/**
 * ============================================================================
 * SMART SOIL MONITORING IoT — ESP32 FIRMWARE (4G LTE + SOLAR POWERED)
 * ============================================================================
 * Hardware:
 * 1. ESP32 DevKit V1
 * 2. Sensor pH Tanah (Modular Driver — konfigurasi sesuai pemeriksaan datasheet)
 * 3. Sensor DMS (Modular Driver — mendukung Raw Data & Kalibrasi %)
 * 4. DS18B20 Waterproof (OneWire GPIO 4)
 * 5. Modem 4G LTE (UART2 / WiFi Router 4G)
 * 6. Sistem Tenaga Surya: Panel Surya 10Wp + SCC PWM + Baterai 12V 7Ah + Buck 12V->5V
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include "sensor_drivers.h"

// Konfigurasi Identitas Perangkat & Endpoint API
const char* DEVICE_ID      = "SOIL-001";
const char* API_KEY        = "sk_soil_001_esp32_4g_key_2026";
const char* API_ENDPOINT   = "https://your-domain.vercel.app/api/v1/telemetry";

// Koneksi 4G CPE / MiFi / Modem
const char* MODEM_AP_SSID  = "4G_SMART_SOIL_MODEM";
const char* MODEM_AP_PASS  = "smartsoil2026";

// Pin Mapping ESP32 DevKit
#define PIN_SOIL_PH        34
#define PIN_SOIL_DMS       35
#define PIN_DS18B20        4
#define PIN_BATT_VOLTAGE   32  // Voltage divider R1=30k, R2=7.5k untuk Baterai 12V 7Ah

// Inisialisasi Driver Modular (Default: PH_MODE_PENDING_DATASHEET & DMS_MODE_PENDING_DATASHEET
// sampai spesifikasi datasheet dikonfirmasi)
ModularSoilPhDriver  phSensor(PH_MODE_PENDING_DATASHEET, PIN_SOIL_PH, 0.0f);
ModularSoilDmsDriver dmsSensor(DMS_MODE_PENDING_DATASHEET, PIN_SOIL_DMS, false, 3200, 1400);

unsigned long lastSendMs = 0;
const unsigned long SEND_INTERVAL_MS = 60000; // 60 detik

float readBatteryVoltage12V() {
  int raw = analogRead(PIN_BATT_VOLTAGE);
  if (raw <= 10) return NAN; // Sensor tegangan belum terhubung
  float vPin = (raw / 4095.0f) * 3.3f;
  // Rasio pembagi tegangan 5.0 (misal 30k + 7.5k)
  return vPin * 5.0f;
}

SoilTempReading readDs18b20() {
  SoilTempReading res = { false, NAN, "not_connected" };
  // Gunakan DallasTemperature sensors.getTempCByIndex(0) pada implementasi fisik:
  // Jika nilai == -127.00 (DEVICE_DISCONNECTED_C), kembalikan "not_connected".
  return res;
}

void setup() {
  Serial.begin(115200);
  analogReadResolution(12);

  phSensor.begin();
  dmsSensor.begin();
  pinMode(PIN_BATT_VOLTAGE, INPUT);

  Serial.println("[SMART SOIL IoT] Menghubungkan ke jaringan Modem 4G...");
  WiFi.begin(MODEM_AP_SSID, MODEM_AP_PASS);
}

void loop() {
  if (millis() - lastSendMs >= SEND_INTERVAL_MS) {
    lastSendMs = millis();

    SoilPhReading   ph   = phSensor.read();
    SoilDmsReading  dms  = dmsSensor.read();
    SoilTempReading temp = readDs18b20();
    float battV          = readBatteryVoltage12V();

    String payload = "{";
    payload += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
    payload += "\"soil_ph\":" + (isnan(ph.phValue) ? "null" : String(ph.phValue, 2)) + ",";
    payload += "\"soil_moisture\":" + (isnan(dms.moisturePercent) ? "null" : String(dms.moisturePercent, 1)) + ",";
    payload += "\"soil_dms_raw\":" + (dms.connected ? String(dms.rawValue) : "null") + ",";
    payload += "\"soil_temperature\":" + (isnan(temp.temperatureC) ? "null" : String(temp.temperatureC, 1)) + ",";
    payload += "\"battery_voltage\":" + (isnan(battV) ? "null" : String(battV, 2)) + ",";
    payload += "\"uptime_seconds\":" + String(millis() / 1000) + ",";
    payload += "\"sensor_status\":{";
    payload += "\"ph\":\"" + String(ph.status) + "\",";
    payload += "\"dms\":\"" + String(dms.status) + "\",";
    payload += "\"temperature\":\"" + String(temp.status) + "\"";
    payload += "}}";

    Serial.println("[TELEMETRY PAYLOAD] " + payload);

    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(API_ENDPOINT);
      http.addHeader("Content-Type", "application/json");
      http.addHeader("X-API-Key", API_KEY);
      int code = http.POST(payload);
      Serial.printf("[HTTP POST] Status code: %d\n", code);
      http.end();
    } else {
      Serial.println("[MODEM 4G] Koneksi terputus, mencoba reconnect...");
      WiFi.reconnect();
    }
  }
}
