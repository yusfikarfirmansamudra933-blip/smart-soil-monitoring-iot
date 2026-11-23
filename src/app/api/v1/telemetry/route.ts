import { NextRequest, NextResponse } from "next/server";
import {
  DEFAULT_DEVICE_API_KEY,
  DEFAULT_DEVICE_ID,
  supabase,
} from "@/lib/supabase";
import { normalizeTelemetryPayload } from "@/lib/mqtt-bridge";
import { convertDmsRawToPercent, determineChargingStatus } from "@/lib/sensor-drivers";
import { DEFAULT_CONFIG } from "@/lib/demo-engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const deviceId = String(body.device_id || DEFAULT_DEVICE_ID);

    // Check API Key from X-API-Key header, Authorization Bearer, or body.api_key
    const headerKey =
      req.headers.get("x-api-key") ||
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
      body.api_key;

    const { data: deviceRow } = await supabase
      .from("soil_devices")
      .select("device_id, api_key")
      .eq("device_id", deviceId)
      .maybeSingle();

    const expectedKey = deviceRow?.api_key || DEFAULT_DEVICE_API_KEY;
    if (headerKey && headerKey !== expectedKey) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "API Key ESP32 tidak valid. Periksa header X-API-Key.",
        },
        { status: 401 }
      );
    }

    // Ensure device and config exist
    if (!deviceRow) {
      await supabase.from("soil_devices").upsert({
        device_id: deviceId,
        name: `Smart Soil Station (${deviceId})`,
        api_key: expectedKey,
      });
    }

    const { data: cfgRow } = await supabase
      .from("soil_device_configs")
      .select("*")
      .eq("device_id", deviceId)
      .maybeSingle();

    const config = cfgRow || DEFAULT_CONFIG;

    const normalized = normalizeTelemetryPayload(body, deviceId);

    // If DMS raw is provided and soil_moisture is null, compute calibrated % if enabled
    let finalMoisture = normalized.soil_moisture;
    if (
      finalMoisture === null &&
      normalized.soil_dms_raw !== null &&
      config.dms_calibrated
    ) {
      finalMoisture = convertDmsRawToPercent(normalized.soil_dms_raw, config);
    }

    const chargingStatus = determineChargingStatus({
      esp32Online: true,
      batteryVoltage: normalized.battery_voltage,
      solarVoltage: normalized.solar_voltage,
      batteryLowThreshold: config.battery_low_alarm,
      explicitStatus: normalized.charging_status,
    });

    const creditMin = Number(config.modem_credit_min_rp ?? 10000);
    const quotaMinMb = Number(config.modem_quota_min_mb ?? 500);
    const buzzerEnabled = config.buzzer_enabled !== false;
    const isCreditLow =
      normalized.modem_credit_rp !== null &&
      normalized.modem_credit_rp !== undefined &&
      normalized.modem_credit_rp < creditMin;
    const isQuotaLow =
      normalized.modem_quota_mb !== null &&
      normalized.modem_quota_mb !== undefined &&
      normalized.modem_quota_mb < quotaMinMb;
    const effectiveBuzzerActive = Boolean(
      normalized.buzzer_active || (buzzerEnabled && (isCreditLow || isQuotaLow))
    );

    // 1. Insert into soil_telemetry
    const { data: inserted, error: insertError } = await supabase
      .from("soil_telemetry")
      .insert({
        device_id: deviceId,
        ts: normalized.ts,
        soil_ph: normalized.soil_ph,
        soil_ph_raw: normalized.soil_ph_raw,
        soil_moisture: finalMoisture,
        soil_dms_raw: normalized.soil_dms_raw,
        soil_temperature: normalized.soil_temperature,
        hardware_temperature: normalized.hardware_temperature ?? null,
        battery_voltage: normalized.battery_voltage,
        battery_current: normalized.battery_current,
        battery_power: normalized.battery_power,
        solar_voltage: normalized.solar_voltage,
        solar_current: normalized.solar_current,
        solar_power: normalized.solar_power,
        charging_status: chargingStatus,
        modem_quota_mb: normalized.modem_quota_mb ?? null,
        modem_credit_rp: normalized.modem_credit_rp ?? null,
        buzzer_active: effectiveBuzzerActive,
        sensor_status: normalized.sensor_status,
        is_demo: normalized.is_demo,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: "Database insert error", details: insertError.message },
        { status: 500 }
      );
    }

    // 2. Update device status
    await supabase
      .from("soil_devices")
      .update({
        esp32_status: "online",
        modem_status: body.modem_status || "connected",
        signal_rssi: body.signal_rssi ?? -68,
        modem_quota_mb: normalized.modem_quota_mb ?? null,
        modem_credit_rp: normalized.modem_credit_rp ?? null,
        buzzer_active: effectiveBuzzerActive,
        sensor_ph_status: normalized.sensor_status.ph,
        sensor_dms_status: normalized.sensor_status.dms,
        sensor_temp_status: normalized.sensor_status.temperature,
        uptime_seconds: body.uptime_seconds ?? 3600,
        last_seen: new Date().toISOString(),
      })
      .eq("device_id", deviceId);

    // 3. Evaluate automatic alarm rules
    const alertsToInsert: Array<{
      device_id: string;
      alert_type: string;
      severity: string;
      title: string;
      message: string;
      metric_value: string;
      threshold_value: string;
      is_demo: boolean;
    }> = [];

    if (
      normalized.soil_ph !== null &&
      normalized.sensor_status.ph === "online"
    ) {
      if (normalized.soil_ph < config.ph_min_alarm) {
        alertsToInsert.push({
          device_id: deviceId,
          alert_type: "ph_low",
          severity: "warning",
          title: "pH Tanah Terlalu Rendah (Asam)",
          message: `Nilai pH tanah (${normalized.soil_ph}) berada di bawah batas minimum (${config.ph_min_alarm}).`,
          metric_value: `${normalized.soil_ph} pH`,
          threshold_value: `< ${config.ph_min_alarm} pH`,
          is_demo: normalized.is_demo,
        });
      } else if (normalized.soil_ph > config.ph_max_alarm) {
        alertsToInsert.push({
          device_id: deviceId,
          alert_type: "ph_high",
          severity: "warning",
          title: "pH Tanah Terlalu Tinggi (Basa)",
          message: `Nilai pH tanah (${normalized.soil_ph}) melebihi batas maksimum (${config.ph_max_alarm}).`,
          metric_value: `${normalized.soil_ph} pH`,
          threshold_value: `> ${config.ph_max_alarm} pH`,
          is_demo: normalized.is_demo,
        });
      }
    }

    if (
      finalMoisture !== null &&
      normalized.sensor_status.dms === "online"
    ) {
      if (finalMoisture < config.moisture_min_alarm) {
        alertsToInsert.push({
          device_id: deviceId,
          alert_type: "moisture_dry",
          severity: "warning",
          title: "Tanah Terlalu Kering (DMS)",
          message: `Kelembapan tanah (${finalMoisture}%) di bawah batas minimum (${config.moisture_min_alarm}%).`,
          metric_value: `${finalMoisture}%`,
          threshold_value: `< ${config.moisture_min_alarm}%`,
          is_demo: normalized.is_demo,
        });
      } else if (finalMoisture > config.moisture_max_alarm) {
        alertsToInsert.push({
          device_id: deviceId,
          alert_type: "moisture_wet",
          severity: "info",
          title: "Tanah Terlalu Basah (DMS)",
          message: `Kelembapan tanah (${finalMoisture}%) melebihi batas maksimum (${config.moisture_max_alarm}%).`,
          metric_value: `${finalMoisture}%`,
          threshold_value: `> ${config.moisture_max_alarm}%`,
          is_demo: normalized.is_demo,
        });
      }
    }

    if (
      normalized.soil_temperature !== null &&
      normalized.sensor_status.temperature === "online"
    ) {
      if (
        normalized.soil_temperature > config.temp_max_alarm ||
        normalized.soil_temperature < config.temp_min_alarm
      ) {
        alertsToInsert.push({
          device_id: deviceId,
          alert_type: "temp_limit",
          severity: "warning",
          title: "Suhu Tanah Melewati Batas (DS18B20)",
          message: `Suhu tanah tercatat ${normalized.soil_temperature}°C (batas normal ${config.temp_min_alarm}°C – ${config.temp_max_alarm}°C).`,
          metric_value: `${normalized.soil_temperature} °C`,
          threshold_value: `${config.temp_min_alarm}–${config.temp_max_alarm} °C`,
          is_demo: normalized.is_demo,
        });
      }
    }

    if (
      normalized.battery_voltage !== null &&
      normalized.battery_voltage < config.battery_low_alarm
    ) {
      alertsToInsert.push({
        device_id: deviceId,
        alert_type: "battery_low",
        severity: "critical",
        title: "Baterai 12V Lemah (Battery Low)",
        message: `Tegangan baterai turun ke ${normalized.battery_voltage}V (batas kritis ${config.battery_low_alarm}V).`,
        metric_value: `${normalized.battery_voltage} V`,
        threshold_value: `< ${config.battery_low_alarm} V`,
        is_demo: normalized.is_demo,
      });
    }

    const disconnectedSensors: string[] = [];
    if (normalized.sensor_status.ph !== "online") disconnectedSensors.push("Soil pH");
    if (normalized.sensor_status.dms === "not_connected" || normalized.sensor_status.dms === "offline")
      disconnectedSensors.push("Soil DMS");
    if (normalized.sensor_status.temperature !== "online")
      disconnectedSensors.push("DS18B20 Temperature");

    if (disconnectedSensors.length > 0) {
      alertsToInsert.push({
        device_id: deviceId,
        alert_type: "sensor_disconnected",
        severity: "warning",
        title: "Sensor Tidak Terhubung",
        message: `Sensor berikut melaporkan status tidak terhubung: ${disconnectedSensors.join(", ")}.`,
        metric_value: disconnectedSensors.join(", "),
        threshold_value: "Harus Online",
        is_demo: normalized.is_demo,
      });
    }

    if (isCreditLow) {
      alertsToInsert.push({
        device_id: deviceId,
        alert_type: "modem_credit_low",
        severity: "critical",
        title: "Sisa Pulsa Modem 4G Menipis — Active Buzzer AKTIF",
        message: `Sisa pulsa Modem 4G (Rp ${Number(normalized.modem_credit_rp).toLocaleString("id-ID")}) di bawah batas minimum (Rp ${creditMin.toLocaleString("id-ID")}). Active Buzzer ESP32-S3 diaktifkan.`,
        metric_value: `Rp ${Number(normalized.modem_credit_rp).toLocaleString("id-ID")}`,
        threshold_value: `< Rp ${creditMin.toLocaleString("id-ID")}`,
        is_demo: normalized.is_demo,
      });
    }

    if (alertsToInsert.length > 0) {
      await supabase.from("soil_alerts").insert(alertsToInsert);
    }

    return NextResponse.json(
      {
        status: "ok",
        message: "Telemetry ingested successfully",
        data: inserted,
        triggered_alerts: alertsToInsert.length,
        buzzer_command: effectiveBuzzerActive,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid request payload";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
