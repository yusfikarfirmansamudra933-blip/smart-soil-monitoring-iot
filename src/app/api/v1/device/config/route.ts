import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_DEVICE_ID, supabase } from "@/lib/supabase";
import { DEFAULT_CONFIG } from "@/lib/default-config";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const deviceId = searchParams.get("device_id") || DEFAULT_DEVICE_ID;

  const { data: config, error } = await supabase
    .from("soil_device_configs")
    .select("*")
    .eq("device_id", deviceId)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Failed to load device config", details: error.message },
      { status: 500 }
    );
  }

  const { data: device } = await supabase
    .from("soil_devices")
    .select("device_id, name, location, firmware_version")
    .eq("device_id", deviceId)
    .maybeSingle();

  return NextResponse.json({
    config: config || { ...DEFAULT_CONFIG, device_id: deviceId },
    device: device || {
      device_id: deviceId,
      name: "Smart Soil Station #1",
      location: "Blok A - Lahan Pertanian Utama",
      firmware_version: "v1.2.0-esp32-4g",
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const deviceId = String(body.device_id || DEFAULT_DEVICE_ID).trim();

    if (!/^[A-Za-z0-9_-]{1,32}$/.test(deviceId)) {
      return NextResponse.json(
        { error: "Format device_id tidak valid." },
        { status: 400 }
      );
    }

    if (body.device_identity) {
      await supabase
        .from("soil_devices")
        .upsert({
          device_id: deviceId,
          name: String(body.device_identity.name || "Smart Soil Station #1").slice(0, 80),
          location: String(
            body.device_identity.location || "Blok A - Lahan Pertanian Utama"
          ).slice(0, 120),
          firmware_version: String(
            body.device_identity.firmware_version || "v1.2.0-esp32-4g"
          ).slice(0, 40),
        });
    }

    const clamp = (val: number, min: number, max: number) =>
      Math.max(min, Math.min(max, val));

    const configPayload: Record<string, unknown> = {
      device_id: deviceId,
      ...(body.active_crop ? { active_crop: String(body.active_crop).slice(0, 60) } : {}),
      read_interval_sec: clamp(Number(body.read_interval_sec ?? 2) || 2, 1, 86400),
      send_interval_sec: clamp(Number(body.send_interval_sec ?? 2) || 2, 1, 86400),
      timezone: String(body.timezone || "Asia/Jakarta"),
      ph_interface_mode: String(body.ph_interface_mode || "pending_datasheet"),
      dms_interface_mode: String(body.dms_interface_mode || "pending_datasheet"),
      dms_calibrated: Boolean(body.dms_calibrated ?? false),
      dms_raw_dry: Number(body.dms_raw_dry ?? 3200),
      dms_raw_wet: Number(body.dms_raw_wet ?? 1400),
      ph_cal_offset: Number(body.ph_cal_offset ?? 0),
      ph_min_alarm: clamp(Number(body.ph_min_alarm ?? 5.5), 0, 14),
      ph_max_alarm: clamp(Number(body.ph_max_alarm ?? 7.5), 0, 14),
      moisture_min_alarm: clamp(Number(body.moisture_min_alarm ?? 30), 0, 100),
      moisture_max_alarm: clamp(Number(body.moisture_max_alarm ?? 80), 0, 100),
      temp_min_alarm: clamp(Number(body.temp_min_alarm ?? 18), -20, 85),
      temp_max_alarm: clamp(Number(body.temp_max_alarm ?? 34), -20, 85),
      battery_low_alarm: Number(body.battery_low_alarm ?? 11.8),
      modem_quota_min_mb: Math.max(0, Number(body.modem_quota_min_mb ?? 500)),
      modem_credit_min_rp: Math.max(0, Number(body.modem_credit_min_rp ?? 10000)),
      buzzer_enabled: Boolean(body.buzzer_enabled ?? true),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("soil_device_configs")
      .upsert(configPayload)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to save device config", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "ok",
      message: "Konfigurasi perangkat berhasil diperbarui",
      config: data,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid config payload";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
