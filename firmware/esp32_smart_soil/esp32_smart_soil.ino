/**
 * ============================================================================
 * SMART SOIL MONITORING IoT — ESP32-S3 N16R8 FIRMWARE (v2.1.0)
 * ============================================================================
 * Komponen Utama:
 * 1. MCU             : ESP32-S3 N16R8 (16MB Flash, 8MB OPI PSRAM)
 *                      *PENTING: Jangan gunakan GPIO 35, 36, 37 (OPI PSRAM)*
 * 2. Sensor Energi   : 2x INA226 (I2C GPIO 8=SDA, GPIO 9=SCL)
 *                      - INA226 #1 (0x40): Panel Surya (V, A, W)
 *                      - INA226 #2 (0x41): Baterai (V, A, W)
 * 3. Solar Charger   : CN3791 MPPT Solar Charge Controller
 * 4. Active Buzzer   : GPIO 21 (Berbunyi otomatis saat kuota/pulsa Modem 4G menipis)
 * 5. Suhu Tanah      : DS18B20 Waterproof (1-Wire GPIO 4 + Pull-up 4.7kΩ)
 * 6. Kelembapan      : Capacitive Soil Moisture Sensor (ADC1 GPIO 5)
 * 7. pH Tanah + DMS  : Sensor pH Analog ADC (GPIO 6) + DMS (GPIO 7) — Driver Modular
 * 8. Konektivitas    : Modem 4G Kartu SIM (Baca SMS Operator -> Sisa Kuota & Pulsa)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <INA226_WE.h>
#include <time.h>
#include "sensor_drivers.h"
#include "modem_quota_reader.h"
#include "offline_logger.h"

// ============================================================================
// KONFIGURASI IDENTITAS PERANGKAT, API, & MODEM 4G
// ============================================================================
const char* DEVICE_ID         = "SOIL-001";
const char* API_KEY           = "sk_soil_001_esp32_4g_key_2026";
const char* BASE_API_URL      = "https://smart-soil-monitoring-iot.vercel.app";

const char* MODEM_AP_SSID     = "4G_SMART_SOIL_MODEM";
const char* MODEM_AP_PASS     = "smartsoil2026";

// Pilih metode baca SMS kuota/pulsa dari Modem 4G kartu HP Anda:
// - MODEM_SMS_HTTP_ZTE    : MiFi Bolt 4G ZTE MF90 (Otomatis deteksi Gateway IP: 192.168.1.1 / 192.168.0.1)
// - MODEM_SMS_HTTP_HILINK : MiFi/Router Huawei HiLink (192.168.8.1)
// - MODEM_SMS_UART_AT     : Modul 4G UART SIM7600/A7670 di GPIO 17/18
const ModemSmsSourceMode MODEM_SMS_MODE = MODEM_SMS_HTTP_ZTE;
const char* MODEM_ROUTER_IP             = "auto";  // "auto" -> pakai IP Gateway ZTE MF90 otomatis
const char* MODEM_WEB_PASSWORD          = "admin"; // Password login WebUI ZTE MF90 (default: "admin")

// Batas default (otomatis disinkronkan dengan menu Device Management di web)
float modemQuotaMinMb  = 500.0f;
float modemCreditMinRp = 10000.0f;
bool  buzzerEnabled    = true;

// ============================================================================
// PIN MAPPING ESP32-S3 N16R8 (AMAN DARI OPI PSRAM GPIO 35/36/37)
// ============================================================================
#define PIN_I2C_SDA           8
#define PIN_I2C_SCL           9
#define INA226_ADDR_SOLAR     0x40  // A0=GND, A1=GND  -> Panel Surya
#define INA226_ADDR_BATTERY   0x41  // A0=3.3V, A1=GND -> Baterai

#define PIN_DS18B20           4     // 1-Wire + Pull-up 4.7kΩ ke 3.3V
#define PIN_CAP_MOISTURE      5     // Capacitive Soil Moisture (ADC1_CH4)
#define PIN_SOIL_PH_ADC       6     // Modul DMS Kabel Ungu/Kuning (D34 di ESP32 -> GPIO 6 ADC1_CH5 di S3)
#define PIN_DMS_CTRL          7     // Modul DMS Kabel Biru/Hijau (D13 di ESP32 -> GPIO 7 di S3)
#define PIN_ACTIVE_BUZZER     21    // Active Buzzer (Alarm Kuota/Pulsa Menipis)

#define PIN_MODEM_TX          17    // UART2 TX -> RX Modul 4G (jika pakai MODEM_SMS_UART_AT)
#define PIN_MODEM_RX          18    // UART2 RX -> TX Modul 4G (jika pakai MODEM_SMS_UART_AT)

// ============================================================================
// INISIALISASI OBJEK SENSOR & MODEM SMS READER
// ============================================================================
INA226_WE inaSolar   = INA226_WE(INA226_ADDR_SOLAR);
INA226_WE inaBattery = INA226_WE(INA226_ADDR_BATTERY);
bool inaSolarOk   = false;
bool inaBatteryOk = false;

OneWire oneWire(PIN_DS18B20);
DallasTemperature ds18b20(&oneWire);

HardwareSerial ModemSerial(2);
ModemQuotaReader modemReader(MODEM_SMS_MODE, MODEM_ROUTER_IP, MODEM_WEB_PASSWORD, &ModemSerial);
OfflineTelemetryLogger offlineLogger;

bool ntpSynced = false;

ModularSoilPhDriver  phSensor(PH_MODE_ANALOG_ADC, PIN_SOIL_PH_ADC, 0.0f);
ModularSoilDmsDriver dmsSensor(DMS_MODE_DIGITAL_GPIO, PIN_DMS_CTRL, true, 3200, 1400);
CapacitiveMoistureDriver capMoistureSensor(PIN_CAP_MOISTURE, 2950, 1250);

unsigned long lastSendMs = 0;
unsigned long lastSmsPollMs = 0;
unsigned long sendIntervalMs = 60000;        // 60 detik (disinkronkan dari web)
const unsigned long SMS_POLL_MS = 120000;    // Cek SMS modem setiap 2 menit
bool buzzerActive = false;

void updateActiveBuzzer(bool shouldRing) {
  buzzerActive = buzzerEnabled && shouldRing;
  if (buzzerActive) {
    // Pola bunyi beep-beep peringatan kuota/pulsa menipis (3x beep singkat)
    for (int i = 0; i < 3; i++) {
      digitalWrite(PIN_ACTIVE_BUZZER, HIGH);
      delay(180);
      digitalWrite(PIN_ACTIVE_BUZZER, LOW);
      delay(120);
    }
  } else {
    digitalWrite(PIN_ACTIVE_BUZZER, LOW);
  }
}

SoilTempReading readDs18b20() {
  SoilTempReading res = { false, NAN, "not_connected" };
  ds18b20.requestTemperatures();
  float t = ds18b20.getTempCByIndex(0);
  if (t == DEVICE_DISCONNECTED_C || t < -50.0f || t > 125.0f) {
    return res;
  }
  res.connected = true;
  res.temperatureC = t;
  res.status = "online";
  return res;
}

// Helper sederhana baca nilai angka/boolean dari JSON config server
float extractJsonNumber(const String& json, const char* key, float fallback) {
  String pat = String("\"") + key + "\":";
  int idx = json.indexOf(pat);
  if (idx < 0) return fallback;
  idx += pat.length();
  while (idx < (int)json.length() && json[idx] == ' ') idx++;
  return json.substring(idx, idx + 16).toFloat();
}

void syncRemoteDeviceConfig() {
  if (WiFi.status() != WL_CONNECTED) return;
  HTTPClient http;
  String cfgUrl = String(BASE_API_URL) + "/api/v1/device/config?device_id=" + DEVICE_ID;
  http.setTimeout(5000);
  if (!http.begin(cfgUrl)) return;

  int code = http.GET();
  if (code == 200) {
    String body = http.getString();
    float qMin = extractJsonNumber(body, "modem_quota_min_mb", modemQuotaMinMb);
    float cMin = extractJsonNumber(body, "modem_credit_min_rp", modemCreditMinRp);
    float sendSec = extractJsonNumber(body, "send_interval_sec", sendIntervalMs / 1000.0f);
    if (qMin > 0) modemQuotaMinMb = qMin;
    if (cMin >= 0) modemCreditMinRp = cMin;
    if (sendSec >= 10) sendIntervalMs = (unsigned long)sendSec * 1000UL;
    if (body.indexOf("\"buzzer_enabled\":false") >= 0) buzzerEnabled = false;
    else if (body.indexOf("\"buzzer_enabled\":true") >= 0) buzzerEnabled = true;

    Serial.printf("[CONFIG SYNC] Batas Kuota: %.0f MB | Batas Pulsa: Rp %.0f | Buzzer: %s\n",
                  modemQuotaMinMb, modemCreditMinRp, buzzerEnabled ? "ON" : "OFF");
  }
  http.end();
}

void setup() {
  Serial.begin(115200);
  analogReadResolution(12);

  pinMode(PIN_ACTIVE_BUZZER, OUTPUT);
  digitalWrite(PIN_ACTIVE_BUZZER, LOW);

  if (MODEM_SMS_MODE == MODEM_SMS_UART_AT) {
    ModemSerial.begin(115200, SERIAL_8N1, PIN_MODEM_RX, PIN_MODEM_TX);
  }
  modemReader.begin();

  // Inisialisasi I2C untuk 2x INA226
  Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL);

  inaSolarOk = inaSolar.init();
  if (inaSolarOk) {
    inaSolar.setResistorRange(0.1, 0.8);
    Serial.println("[INA226 #1] Panel Surya (0x40) OK");
  } else {
    Serial.println("[INA226 #1] Panel Surya (0x40) TIDAK TERDETEKSI");
  }

  inaBatteryOk = inaBattery.init();
  if (inaBatteryOk) {
    inaBattery.setResistorRange(0.1, 0.8);
    Serial.println("[INA226 #2] Baterai (0x41) OK");
  } else {
    Serial.println("[INA226 #2] Baterai (0x41) TIDAK TERDETEKSI");
  }

  ds18b20.begin();
  phSensor.begin();
  dmsSensor.begin();
  capMoistureSensor.begin();
  offlineLogger.begin();

  Serial.println("[SMART SOIL IoT - ESP32-S3 N16R8] Menghubungkan ke Modem 4G...");
  WiFi.begin(MODEM_AP_SSID, MODEM_AP_PASS);
}

String getIsoTimestampOrEmpty() {
  time_t now = time(nullptr);
  if (now < 1700000000) return "";
  struct tm tmUtc;
  gmtime_r(&now, &tmUtc);
  char buf[28];
  strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%SZ", &tmUtc);
  return String(buf);
}

void loop() {
  // Sinkronisasi jam NTP sekali setelah WiFi 4G tersambung agar timestamp offline akurat
  if (!ntpSynced && WiFi.status() == WL_CONNECTED) {
    configTime(0, 0, "pool.ntp.org", "time.nist.gov");
    if (time(nullptr) > 1700000000) {
      ntpSynced = true;
      Serial.println("[NTP] Waktu UTC tersinkronisasi untuk Offline Logger.");
    }
  }
  // Uji manual SMS parser lewat Serial Monitor (ketik contoh SMS operator lalu Enter)
  if (Serial.available()) {
    String testSms = Serial.readStringUntil('\n');
    testSms.trim();
    if (testSms.length() > 5) {
      modemReader.parseOperatorSms(testSms);
    }
  }

  // Cek SMS notifikasi operator dari Modem 4G secara berkala
  if (WiFi.status() == WL_CONNECTED && (millis() - lastSmsPollMs >= SMS_POLL_MS || lastSmsPollMs == 0)) {
    lastSmsPollMs = millis();
    modemReader.pollModemSms();
    syncRemoteDeviceConfig();
  }

  if (millis() - lastSendMs >= sendIntervalMs) {
    lastSendMs = millis();

    SoilPhReading   ph   = phSensor.read();
    SoilDmsReading  dms  = dmsSensor.read();
    SoilDmsReading  cap  = capMoistureSensor.read();
    SoilTempReading temp = readDs18b20();
    float hwTempC = temperatureRead();

    float moisturePct = cap.connected ? cap.moisturePercent : dms.moisturePercent;
    int   rawMoisture = dms.connected ? dms.rawValue : cap.rawValue;
    const char* moistStatus = cap.connected ? cap.status : dms.status;

    float solarV = inaSolarOk ? inaSolar.getBusVoltage_V() : NAN;
    float solarI = inaSolarOk ? (inaSolar.getCurrent_mA() / 1000.0f) : NAN;
    float solarP = inaSolarOk ? (inaSolar.getBusPower() / 1000.0f) : NAN;

    float battV  = inaBatteryOk ? inaBattery.getBusVoltage_V() : NAN;
    float battI  = inaBatteryOk ? (inaBattery.getCurrent_mA() / 1000.0f) : NAN;
    float battP  = inaBatteryOk ? (inaBattery.getBusPower() / 1000.0f) : NAN;

    // Ambil sisa kuota (MB) & pulsa (Rp) hasil parsing SMS operator di Modem 4G
    float quotaMb  = modemReader.getQuotaMb();
    float creditRp = modemReader.getCreditRp();
    bool lowQuotaOrCredit =
      (!isnan(quotaMb) && quotaMb < modemQuotaMinMb) ||
      (!isnan(creditRp) && creditRp < modemCreditMinRp);

    updateActiveBuzzer(lowQuotaOrCredit);

    String isoTs = getIsoTimestampOrEmpty();
    String payload = "{";
    payload += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
    if (isoTs.length() > 0) {
      payload += "\"timestamp\":\"" + isoTs + "\",";
    }
    payload += "\"soil_ph\":" + (isnan(ph.phValue) ? "null" : String(ph.phValue, 2)) + ",";
    payload += "\"soil_ph_raw\":" + (ph.connected ? String(ph.rawValue) : "null") + ",";
    payload += "\"soil_moisture\":" + (isnan(moisturePct) ? "null" : String(moisturePct, 1)) + ",";
    payload += "\"soil_dms_raw\":" + ((dms.connected || cap.connected) ? String(rawMoisture) : "null") + ",";
    payload += "\"soil_temperature\":" + (isnan(temp.temperatureC) ? "null" : String(temp.temperatureC, 1)) + ",";
    payload += "\"hardware_temperature\":" + (isnan(hwTempC) ? "null" : String(hwTempC, 1)) + ",";
    payload += "\"solar_voltage\":" + (isnan(solarV) ? "null" : String(solarV, 2)) + ",";
    payload += "\"solar_current\":" + (isnan(solarI) ? "null" : String(solarI, 3)) + ",";
    payload += "\"solar_power\":" + (isnan(solarP) ? "null" : String(solarP, 2)) + ",";
    payload += "\"battery_voltage\":" + (isnan(battV) ? "null" : String(battV, 2)) + ",";
    payload += "\"battery_current\":" + (isnan(battI) ? "null" : String(battI, 3)) + ",";
    payload += "\"battery_power\":" + (isnan(battP) ? "null" : String(battP, 2)) + ",";
    payload += "\"modem_quota_mb\":" + (isnan(quotaMb) ? "null" : String(quotaMb, 0)) + ",";
    payload += "\"modem_credit_rp\":" + (isnan(creditRp) ? "null" : String(creditRp, 0)) + ",";
    payload += "\"buzzer_active\":" + String(buzzerActive ? "true" : "false") + ",";
    payload += "\"uptime_seconds\":" + String(millis() / 1000) + ",";
    payload += "\"sensor_status\":{";
    payload += "\"ph\":\"" + String(ph.status) + "\",";
    payload += "\"dms\":\"" + String(moistStatus) + "\",";
    payload += "\"temperature\":\"" + String(temp.status) + "\"";
    payload += "}}";

    Serial.println("[TELEMETRY PAYLOAD] " + payload);

    if (WiFi.status() == WL_CONNECTED) {
      String endpoint = String(BASE_API_URL) + "/api/v1/telemetry";

      // 1. Kirim data offline yang tertunda di Flash terlebih dahulu (maks 5 per siklus)
      offlineLogger.flushBatch(endpoint, API_KEY, 5);

      // 2. Kirim data real-time terbaru
      HTTPClient http;
      http.setTimeout(6000);
      http.begin(endpoint);
      http.addHeader("Content-Type", "application/json");
      http.addHeader("X-API-Key", API_KEY);
      int code = http.POST(payload);
      String resp = http.getString();
      Serial.printf("[HTTP POST] Status code: %d\n", code);

      if (code >= 200 && code < 300) {
        if (resp.indexOf("\"buzzer_command\":true") >= 0 && !buzzerActive) {
          updateActiveBuzzer(true);
        }
      } else {
        // Server error / kuota habis -> simpan ke 16MB Flash agar tidak hilang
        offlineLogger.enqueue(payload);
      }
      http.end();
    } else {
      Serial.println("[MODEM 4G] Koneksi terputus! Menyimpan ke Offline Logger Flash & mencoba reconnect...");
      offlineLogger.enqueue(payload);
      WiFi.reconnect();
    }
  }
}
