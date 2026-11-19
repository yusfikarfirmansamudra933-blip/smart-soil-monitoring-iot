import {
  SoilAlertRecord,
  SoilDeviceConfig,
  SoilDeviceStatus,
  SoilTelemetryRecord,
  TimeRangeOption,
} from "./types";

export const DEFAULT_CONFIG: SoilDeviceConfig = {
  device_id: "SOIL-001",
  read_interval_sec: 30,
  send_interval_sec: 60,
  timezone: "Asia/Jakarta",
  ph_interface_mode: "analog_adc",
  dms_interface_mode: "analog_adc",
  dms_calibrated: true,
  dms_raw_dry: 3200,
  dms_raw_wet: 1400,
  ph_cal_offset: 0.0,
  ph_min_alarm: 5.5,
  ph_max_alarm: 7.5,
  moisture_min_alarm: 30.0,
  moisture_max_alarm: 80.0,
  temp_min_alarm: 18.0,
  temp_max_alarm: 34.0,
  battery_low_alarm: 11.8,
  modem_credit_min_rp: 10000,
  buzzer_enabled: true,
};

/**
 * Generates realistic simulated history strictly marked with is_demo = true.
 * Never mixes with real hardware data.
 * Supports toggling whether optional Solar/Current sensors are installed;
 * when includeOptionalEnergySensors is false, current/power/solar values are null
 * so the UI displays "Not Available" (no fake energy data).
 */
export function generateDemoHistory(
  range: TimeRangeOption,
  includeOptionalEnergySensors = true,
  dmsCalibrated = true
): SoilTelemetryRecord[] {
  const now = Date.now();
  let points = 24;
  let stepMs = 15 * 60 * 1000;

  switch (range) {
    case "1h":
      points = 20;
      stepMs = 3 * 60 * 1000;
      break;
    case "6h":
      points = 24;
      stepMs = 15 * 60 * 1000;
      break;
    case "24h":
      points = 24;
      stepMs = 60 * 60 * 1000;
      break;
    case "7d":
      points = 28;
      stepMs = 6 * 60 * 60 * 1000;
      break;
    case "30d":
      points = 30;
      stepMs = 24 * 60 * 60 * 1000;
      break;
  }

  const records: SoilTelemetryRecord[] = [];

  for (let i = points - 1; i >= 0; i--) {
    const t = now - i * stepMs;
    const phase = (points - i) / 4;
    const hourOfDay = new Date(t).getHours();
    const isDaylight = hourOfDay >= 7 && hourOfDay <= 17;

    const ph = Number((6.45 + Math.sin(phase * 0.7) * 0.35).toFixed(2));
    const dmsRaw = Math.round(2150 + Math.cos(phase * 0.5) * 340);
    const moisturePct = dmsCalibrated
      ? Number(
          Math.max(
            0,
            Math.min(100, ((3200 - dmsRaw) / (3200 - 1400)) * 100)
          ).toFixed(1)
        )
      : null;
    const temp = Number(
      (27.8 + (isDaylight ? 1.6 : -1.1) + Math.sin(phase) * 0.8).toFixed(1)
    );
    const battV = Number(
      (12.45 + (isDaylight ? 0.45 : -0.25) + Math.sin(phase * 0.3) * 0.15).toFixed(2)
    );

    const battCurrent = includeOptionalEnergySensors
      ? Number((isDaylight ? 0.38 : -0.14).toFixed(2))
      : null;
    const battPower =
      includeOptionalEnergySensors && battCurrent !== null
        ? Number((battV * Math.abs(battCurrent)).toFixed(2))
        : null;
    const solarV = includeOptionalEnergySensors
      ? Number((isDaylight ? 16.4 + Math.sin(phase) * 1.1 : 0.0).toFixed(2))
      : null;
    const solarI = includeOptionalEnergySensors
      ? Number((isDaylight ? 0.48 + Math.cos(phase) * 0.08 : 0.0).toFixed(2))
      : null;
    const solarP =
      includeOptionalEnergySensors && solarV !== null && solarI !== null
        ? Number((solarV * solarI).toFixed(2))
        : null;

    records.push({
      id: 10000 + (points - i),
      device_id: "DEMO-SOIL-001",
      ts: new Date(t).toISOString(),
      soil_ph: ph,
      soil_ph_raw: Math.round(1890 + ph * 45),
      soil_moisture: moisturePct,
      soil_dms_raw: dmsRaw,
      soil_temperature: temp,
      battery_voltage: battV,
      battery_current: battCurrent,
      battery_power: battPower,
      solar_voltage: solarV,
      solar_current: solarI,
      solar_power: solarP,
      charging_status:
        battV >= 13.5
          ? "Battery Full"
          : isDaylight
          ? "Charging"
          : "Discharging",
      modem_credit_rp: 18500 - (points - 1 - i) * 350,
      buzzer_active: 18500 - (points - 1 - i) * 350 < 10000,
      sensor_status: {
        ph: "online",
        dms: dmsCalibrated ? "online" : "uncalibrated",
        temperature: "online",
      },
      is_demo: true,
    });
  }

  return records;
}

export function generateDemoDeviceStatus(
  dmsCalibrated = true
): SoilDeviceStatus {
  return {
    device_id: "DEMO-SOIL-001",
    name: "[DEMO] Smart Soil Station #1 (ESP32-S3)",
    location: "Simulasi Lahan Pertanian Blok A",
    firmware_version: "v2.0.0-esp32s3-n16r8 (DEMO)",
    api_key: "sk_soil_001_esp32_4g_key_2026",
    esp32_status: "online",
    modem_status: "connected",
    signal_rssi: -67,
    modem_credit_rp: 8500,
    buzzer_active: true,
    sensor_ph_status: "online",
    sensor_dms_status: dmsCalibrated ? "online" : "uncalibrated",
    sensor_temp_status: "online",
    uptime_seconds: 184520,
    last_seen: new Date().toISOString(),
    is_stale: false,
  };
}

export function generateDemoAlerts(): SoilAlertRecord[] {
  const now = Date.now();
  return [
    {
      id: 903,
      device_id: "DEMO-SOIL-001",
      ts: new Date(now - 8 * 60 * 1000).toISOString(),
      alert_type: "modem_credit_low",
      severity: "critical",
      title: "[DEMO] Sisa Pulsa Modem 4G Menipis — Active Buzzer AKTIF",
      message:
        "Simulasi: Sisa pulsa Modem 4G (Rp 8.500) di bawah batas minimum (Rp 10.000). Active Buzzer ESP32-S3 dibunyikan otomatis.",
      metric_value: "Rp 8.500 (Buzzer ON)",
      threshold_value: "< Rp 10.000",
      acknowledged: false,
      is_demo: true,
    },
    {
      id: 901,
      device_id: "DEMO-SOIL-001",
      ts: new Date(now - 25 * 60 * 1000).toISOString(),
      alert_type: "moisture_dry",
      severity: "warning",
      title: "[DEMO] Kelembapan Tanah Menurun",
      message:
        "Simulasi: Pembacaan DMS menunjukkan kelembapan mendekati batas kering pada siang hari.",
      metric_value: "31.5 % (Raw: 2633)",
      threshold_value: "< 30.0 %",
      acknowledged: false,
      is_demo: true,
    },
    {
      id: 902,
      device_id: "DEMO-SOIL-001",
      ts: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
      alert_type: "ph_low",
      severity: "info",
      title: "[DEMO] Fluktuasi pH Tanah Asam Ringan",
      message:
        "Simulasi: Nilai pH tanah sempat turun ke 5.48 setelah penyiraman.",
      metric_value: "5.48 pH",
      threshold_value: "< 5.50 pH",
      acknowledged: true,
      is_demo: true,
    },
  ];
}
