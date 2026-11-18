-- Smart Soil Monitoring IoT — PostgreSQL Schema Migration
CREATE TABLE IF NOT EXISTS public.soil_devices (
  device_id text PRIMARY KEY,
  name text NOT NULL DEFAULT 'Smart Soil Station #1',
  location text NOT NULL DEFAULT 'Blok A - Lahan Pertanian Utama',
  firmware_version text NOT NULL DEFAULT 'v1.2.0-esp32-4g',
  api_key text NOT NULL DEFAULT 'sk_soil_001_esp32_4g_key_2026',
  esp32_status text NOT NULL DEFAULT 'offline',
  modem_status text NOT NULL DEFAULT 'disconnected',
  signal_rssi integer,
  sensor_ph_status text NOT NULL DEFAULT 'not_connected',
  sensor_dms_status text NOT NULL DEFAULT 'not_connected',
  sensor_temp_status text NOT NULL DEFAULT 'not_connected',
  uptime_seconds bigint NOT NULL DEFAULT 0,
  last_seen timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.soil_device_configs (
  device_id text PRIMARY KEY REFERENCES public.soil_devices(device_id) ON DELETE CASCADE,
  read_interval_sec integer NOT NULL DEFAULT 30,
  send_interval_sec integer NOT NULL DEFAULT 60,
  timezone text NOT NULL DEFAULT 'Asia/Jakarta',
  ph_interface_mode text NOT NULL DEFAULT 'pending_datasheet',
  dms_interface_mode text NOT NULL DEFAULT 'pending_datasheet',
  dms_calibrated boolean NOT NULL DEFAULT false,
  dms_raw_dry real NOT NULL DEFAULT 3200,
  dms_raw_wet real NOT NULL DEFAULT 1400,
  ph_cal_offset real NOT NULL DEFAULT 0.0,
  ph_min_alarm real NOT NULL DEFAULT 5.5,
  ph_max_alarm real NOT NULL DEFAULT 7.5,
  moisture_min_alarm real NOT NULL DEFAULT 30.0,
  moisture_max_alarm real NOT NULL DEFAULT 80.0,
  temp_min_alarm real NOT NULL DEFAULT 18.0,
  temp_max_alarm real NOT NULL DEFAULT 34.0,
  battery_low_alarm real NOT NULL DEFAULT 11.8,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.soil_telemetry (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  device_id text NOT NULL REFERENCES public.soil_devices(device_id) ON DELETE CASCADE,
  ts timestamptz NOT NULL DEFAULT now(),
  soil_ph real,
  soil_ph_raw real,
  soil_moisture real,
  soil_dms_raw real,
  soil_temperature real,
  battery_voltage real,
  battery_current real,
  battery_power real,
  solar_voltage real,
  solar_current real,
  solar_power real,
  charging_status text,
  sensor_status jsonb NOT NULL DEFAULT '{"ph":"not_connected","dms":"not_connected","temperature":"not_connected"}'::jsonb,
  is_demo boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_soil_telemetry_device_ts ON public.soil_telemetry (device_id, is_demo, ts DESC);

CREATE TABLE IF NOT EXISTS public.soil_alerts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  device_id text NOT NULL REFERENCES public.soil_devices(device_id) ON DELETE CASCADE,
  ts timestamptz NOT NULL DEFAULT now(),
  alert_type text NOT NULL,
  severity text NOT NULL DEFAULT 'warning',
  title text NOT NULL,
  message text NOT NULL,
  metric_value text,
  threshold_value text,
  acknowledged boolean NOT NULL DEFAULT false,
  is_demo boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_soil_alerts_device_ts ON public.soil_alerts (device_id, is_demo, ts DESC);

ALTER TABLE public.soil_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soil_device_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soil_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soil_alerts ENABLE ROW LEVEL SECURITY;
