export type SensorConnectionState =
  | "online"
  | "offline"
  | "not_connected"
  | "uncalibrated";

export type PhInterfaceMode =
  | "pending_datasheet"
  | "analog_adc"
  | "rs485_modbus"
  | "uart";

export type DmsInterfaceMode =
  | "pending_datasheet"
  | "analog_adc"
  | "digital_gpio"
  | "rs485_modbus";

export type ChargingState =
  | "Charging"
  | "Battery Full"
  | "Battery Low"
  | "Discharging"
  | "System Offline"
  | "Not Available";

export interface SensorStatusMap {
  ph: SensorConnectionState;
  dms: SensorConnectionState;
  temperature: SensorConnectionState;
}

export interface SoilTelemetryRecord {
  id?: number;
  device_id: string;
  ts: string;
  soil_ph: number | null;
  soil_ph_raw?: number | null;
  soil_moisture: number | null; // % if calibrated, null if raw-only or disconnected
  soil_dms_raw: number | null; // Raw DMS reading before/alongside calibration
  soil_temperature: number | null; // °C from DS18B20 Waterproof
  hardware_temperature?: number | null; // °C internal temperature sensor ESP32-S3
  battery_voltage: number | null; // Dari INA226 #2 (0x41 - Baterai)
  battery_current: number | null; // Dari INA226 #2 (0x41 - Arus Baterai)
  battery_power: number | null; // Dari INA226 #2 (0x41 - Daya Baterai)
  solar_voltage: number | null; // Dari INA226 #1 (0x40 - Panel Surya)
  solar_current: number | null; // Dari INA226 #1 (0x40 - Arus Panel Surya)
  solar_power: number | null; // Dari INA226 #1 (0x40 - Daya Panel Surya)
  charging_status: ChargingState | null;
  modem_quota_mb?: number | null; // Sisa kuota data Modem 4G (MB)
  modem_credit_rp?: number | null; // Sisa pulsa Modem 4G (Rp)
  buzzer_active?: boolean; // Active Buzzer menyala jika kuota/pulsa modem menipis
  sensor_status: SensorStatusMap;
  is_demo: boolean;
}

export interface SoilDeviceStatus {
  device_id: string;
  name: string;
  location: string;
  firmware_version: string;
  api_key?: string;
  esp32_status: "online" | "offline";
  modem_status: "connected" | "disconnected" | "weak_signal";
  signal_rssi: number | null;
  modem_quota_mb?: number | null;
  modem_credit_rp?: number | null;
  buzzer_active?: boolean;
  sensor_ph_status: SensorConnectionState;
  sensor_dms_status: SensorConnectionState;
  sensor_temp_status: SensorConnectionState;
  uptime_seconds: number;
  last_seen: string | null;
  is_stale?: boolean;
}

export interface SoilDeviceConfig {
  device_id: string;
  read_interval_sec: number;
  send_interval_sec: number;
  timezone: string;
  ph_interface_mode: PhInterfaceMode;
  dms_interface_mode: DmsInterfaceMode;
  dms_calibrated: boolean;
  dms_raw_dry: number;
  dms_raw_wet: number;
  ph_cal_offset: number;
  ph_min_alarm: number;
  ph_max_alarm: number;
  moisture_min_alarm: number;
  moisture_max_alarm: number;
  temp_min_alarm: number;
  temp_max_alarm: number;
  battery_low_alarm: number;
  modem_quota_min_mb?: number;
  modem_credit_min_rp?: number;
  buzzer_enabled?: boolean;
  updated_at?: string;
}

export type AlertType =
  | "ph_low"
  | "ph_high"
  | "moisture_dry"
  | "moisture_wet"
  | "temp_limit"
  | "battery_low"
  | "esp32_offline"
  | "sensor_disconnected"
  | "modem_offline"
  | "modem_credit_low";

export interface SoilAlertRecord {
  id: number;
  device_id: string;
  ts: string;
  alert_type: AlertType;
  severity: "critical" | "warning" | "info";
  title: string;
  message: string;
  metric_value: string | null;
  threshold_value: string | null;
  acknowledged: boolean;
  is_demo: boolean;
}

export type TimeRangeOption = "1h" | "6h" | "24h" | "7d" | "30d";

export type NavSection =
  | "dashboard"
  | "soil"
  | "energy"
  | "history"
  | "alerts"
  | "device"
  | "settings"
  | "about";
