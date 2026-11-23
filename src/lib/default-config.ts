import { SoilDeviceConfig } from "./types";

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
  modem_quota_min_mb: 500,
  modem_credit_min_rp: 10000,
  buzzer_enabled: true,
};
