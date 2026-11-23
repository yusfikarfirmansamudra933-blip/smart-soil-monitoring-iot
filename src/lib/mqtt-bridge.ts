import { SoilTelemetryRecord } from "./types";

/**
 * MQTT-Ready Architecture Layer for Smart Soil Monitoring IoT.
 * Provides standardized topic definitions, payload parser, and broker configuration
 * so the system can receive telemetry over HTTP REST API now and seamlessly bridge
 * with an MQTT broker (e.g., EMQX, HiveMQ, Mosquitto) over 4G LTE.
 */
export interface MqttBrokerConfig {
  brokerUrl: string;
  topicPrefix: string;
  qos: 0 | 1 | 2;
  keepaliveSec: number;
}

export const DEFAULT_MQTT_CONFIG: MqttBrokerConfig = {
  brokerUrl: process.env.MQTT_BROKER_URL || "mqtt://broker.hivemq.com:1883",
  topicPrefix: process.env.MQTT_TOPIC_PREFIX || "soil/v1",
  qos: 1,
  keepaliveSec: 60,
};

export function getMqttTopics(deviceId: string, prefix = "soil/v1") {
  return {
    telemetryPublish: `${prefix}/${deviceId}/telemetry`,
    statusPublish: `${prefix}/${deviceId}/status`,
    configSubscribe: `${prefix}/${deviceId}/config`,
    commandSubscribe: `${prefix}/${deviceId}/command`,
  };
}

export function normalizeTelemetryPayload(
  rawPayload: Record<string, unknown>,
  defaultDeviceId = "SOIL-001"
): SoilTelemetryRecord {
  const sensorStatusRaw =
    (rawPayload.sensor_status as Record<string, string> | undefined) || {};

  const parseNum = (v: unknown): number | null => {
    if (v === null || v === undefined || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  return {
    device_id: String(rawPayload.device_id || defaultDeviceId),
    ts: rawPayload.timestamp
      ? new Date(String(rawPayload.timestamp)).toISOString()
      : new Date().toISOString(),
    soil_ph: parseNum(rawPayload.soil_ph),
    soil_ph_raw: parseNum(rawPayload.soil_ph_raw),
    soil_moisture: parseNum(rawPayload.soil_moisture),
    soil_dms_raw: parseNum(rawPayload.soil_dms_raw),
    soil_temperature: parseNum(rawPayload.soil_temperature),
    hardware_temperature: parseNum(rawPayload.hardware_temperature),
    battery_voltage: parseNum(rawPayload.battery_voltage),
    battery_current: parseNum(rawPayload.battery_current),
    battery_power: parseNum(rawPayload.battery_power),
    solar_voltage: parseNum(rawPayload.solar_voltage),
    solar_current: parseNum(rawPayload.solar_current),
    solar_power: parseNum(rawPayload.solar_power),
    charging_status: (rawPayload.charging_status as SoilTelemetryRecord["charging_status"]) || null,
    modem_quota_mb: parseNum(rawPayload.modem_quota_mb),
    modem_credit_rp: parseNum(rawPayload.modem_credit_rp),
    buzzer_active: Boolean(rawPayload.buzzer_active),
    sensor_status: {
      ph: (sensorStatusRaw.ph as SoilTelemetryRecord["sensor_status"]["ph"]) || "not_connected",
      dms: (sensorStatusRaw.dms as SoilTelemetryRecord["sensor_status"]["dms"]) || "not_connected",
      temperature:
        (sensorStatusRaw.temperature as SoilTelemetryRecord["sensor_status"]["temperature"]) ||
        "not_connected",
    },
    is_demo: Boolean(rawPayload.is_demo),
  };
}
