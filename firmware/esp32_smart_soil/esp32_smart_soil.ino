/**
 * ============================================================================
 * SMART SOIL MONITORING IoT — ESP32-S3 N16R8 FIRMWARE (v3.0.0 Dual-Core PSRAM)
 * ============================================================================
 * Komponen Utama & Fitur ESP32-S3 Maksimal (0 Komponen Tambahan):
 * 1. MCU             : ESP32-S3 N16R8 (16MB Flash, 8MB OPI PSRAM, Dual-Core 240MHz)
 *                      *PENTING: Jangan gunakan GPIO 35, 36, 37 (OPI PSRAM)*
 * 2. Core 0 Engine   : Sampling 100ms + Trimmed Median-Kalman Filter di 8MB PSRAM
 *                      + Coulomb Counting (Wh) & Estimasi Sisa Jam Baterai 3S Li-ion
 * 3. Core 1 Engine   : Local Web Portal & Ganti WiFi Tanpa Laptop (Tahan BOOT 3 dtk
 *                      / Auto SoftAP 'SmartSoil-Setup' / http://smartsoil.local),
 *                      Sinkronisasi Offline Logger 16MB LittleFS, SMS Modem, & HTTPS
 * 4. Proteksi Sistem : Hardware Task Watchdog (WDT 45s) + Adaptive Power Save (80MHz)
 * 5. Sensor Energi   : 2x INA226 (I2C GPIO 8=SDA, GPIO 9=SCL: 0x40 Solar, 0x41 Batt)
 * 6. Sensor Tanah    : DS18B20 (GPIO 4), Capacitive Moisture (GPIO 5), pH+DMS (GPIO 6/7)
 * 7. Active Buzzer   : GPIO 21 (Alarm Kuota/Pulsa Modem 4G Menipis)
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
#include "psram_filter_and_coulomb.h"
#include "local_portal.h"

// ============================================================================
// KONFIGURASI IDENTITAS PERANGKAT, API, & DEFAULT WIFI (DAPAT DIGANTI LEWAT HP)
// ============================================================================
const char* DEVICE_ID         = "SOIL-001";
const char* API_KEY           = "sk_soil_001_esp32_4g_key_2026";
const char* BASE_API_URL      = "https://smart-soil-monitoring-iot.vercel.app";

const char* MODEM_AP_SSID     = "khusus rakyat miskin";
const char* MODEM_AP_PASS     = "00000000";

const ModemSmsSourceMode MODEM_SMS_MODE = MODEM_SMS_HTTP_ZTE;
const char* MODEM_ROUTER_IP             = "auto";
const char* MODEM_WEB_PASSWORD          = "admin";

float modemQuotaMinMb  = 500.0f;
float modemCreditMinRp = 10000.0f;
float batteryLowAlarmV = 10.8f;
bool  buzzerEnabled    = true;

// ============================================================================
// PIN MAPPING ESP32-S3 N16R8 (AMAN DARI OPI PSRAM GPIO 35/36/37)
// ============================================================================
#define PIN_BOOT_BUTTON       0     // Tombol BOOT bawaan board (Tahan 3 dtk -> Portal WiFi)
#define PIN_I2C_SDA           8
#define PIN_I2C_SCL           9
#define INA226_ADDR_SOLAR     0x40  // A0=GND, A1=GND  -> Panel Surya
#define INA226_ADDR_BATTERY   0x41  // A0=3.3V, A1=GND -> Baterai 3S Li-ion

#define PIN_DS18B20           4     // 1-Wire + Pull-up 4.7kΩ ke 3.3V
#define PIN_CAP_MOISTURE      5     // Capacitive Soil Moisture (ADC1_CH4)
#define PIN_SOIL_PH_ADC       6     // Modul DMS Output ADC pH (ADC1_CH5)
#define PIN_DMS_CTRL          7     // Modul DMS Kontrol/Trigger
#define PIN_ACTIVE_BUZZER     21    // Active Buzzer (Alarm Kuota/Pulsa Menipis)

#define PIN_MODEM_TX          17    // UART2 TX -> RX Modul 4G (opsional)
#define PIN_MODEM_RX          18    // UART2 RX -> TX Modul 4G (opsional)

// ============================================================================
// OBJEK DRIVER, PSRAM FILTER, COULOMB METER, PORTAL, & DUAL-CORE STATE
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
CoulombEnergyMeter coulombMeter;
AdaptivePowerManager powerManager;
LocalConfigPortal localPortal;

ModularSoilPhDriver  phSensor(PH_MODE_ANALOG_ADC, PIN_SOIL_PH_ADC, 0.0f);
ModularSoilDmsDriver dmsSensor(DMS_MODE_DIGITAL_GPIO, PIN_DMS_CTRL, true, 3200, 1400);
CapacitiveMoistureDriver capMoistureSensor(PIN_CAP_MOISTURE, 2950, 1250);

// 8MB PSRAM Signal Filters (64 sampel per kanal di OPI PSRAM)
PsramSignalFilter psramPhFilter(64, 0.01f, 0.15f);
PsramSignalFilter psramMoistFilter(64, 0.02f, 0.25f);
PsramSignalFilter psramTempFilter(16, 0.01f, 0.08f);
PsramSignalFilter psramHwTempFilter(16, 0.02f, 0.15f);
PsramSignalFilter psramSolarVFilter(32, 0.02f, 0.10f);
PsramSignalFilter psramSolarIFilter(32, 0.02f, 0.10f);
PsramSignalFilter psramSolarPFilter(32, 0.02f, 0.10f);
PsramSignalFilter psramBattVFilter(32, 0.01f, 0.08f);
PsramSignalFilter psramBattIFilter(32, 0.02f, 0.10f);
PsramSignalFilter psramBattPFilter(32, 0.02f, 0.10f);

struct SharedSensorState {
  SoilPhReading ph = { false, NAN, 0, "not_connected" };
  SoilDmsReading cap = { false, true, NAN, 0, "not_connected" };
  SoilTempReading temp = { false, NAN, "not_connected" };
  float hwTempC = NAN;
  float solarV = NAN;
  float solarI = NAN;
  float solarP = NAN;
  float solarWh = NAN;
  float battV = NAN;
  float battI = NAN;
  float battP = NAN;
  float battWh = NAN;
  float battRemHours = NAN;
  bool psramActive = false;
};

SharedSensorState sharedState;
SemaphoreHandle_t stateMutex = nullptr;
SemaphoreHandle_t driverMutex = nullptr;
TaskHandle_t core0TaskHandle = nullptr;

bool ntpSynced = false;
unsigned long lastSendMs = 0;
unsigned long lastSmsPollMs = 0;
unsigned long sendIntervalMs = 60000;
const unsigned long SMS_POLL_MS = 120000;
bool buzzerActive = false;
bool firstTelemetrySent = false;

void onPortalCalibrationChanged(float phOff, int capDry, int capWet) {
  if (driverMutex && xSemaphoreTake(driverMutex, pdMS_TO_TICKS(100)) == pdTRUE) {
    phSensor.setCalibrationOffset(phOff);
    capMoistureSensor.setCalibrationBounds(capDry, capWet);
    xSemaphoreGive(driverMutex);
  } else {
    phSensor.setCalibrationOffset(phOff);
    capMoistureSensor.setCalibrationBounds(capDry, capWet);
  }
}

void updateActiveBuzzer(bool shouldRing) {
  buzzerActive = buzzerEnabled && shouldRing;
  if (buzzerActive) {
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

// ============================================================================
// CORE 0 TASK: DEDICATED HIGH-SPEED PSRAM SENSOR FILTER & COULOMB COUNTING
// ============================================================================
void sensorCore0Task(void* pvParameters) {
  (void)pvParameters;
  registerCurrentTaskWatchdog();

  unsigned long prevTickMs = millis();
  uint32_t tickCounter = 0;
  SoilTempReading cachedTemp = { false, NAN, "not_connected" };
  float cachedHwTemp = temperatureRead();

  for (;;) {
    unsigned long nowMs = millis();
    float dtSec = (nowMs - prevTickMs) / 1000.0f;
    prevTickMs = nowMs;

    SoilPhReading rawPh;
    SoilDmsReading rawCap;
    if (xSemaphoreTake(driverMutex, pdMS_TO_TICKS(50)) == pdTRUE) {
      rawPh = phSensor.read();
      rawCap = capMoistureSensor.read();
      xSemaphoreGive(driverMutex);
    } else {
      rawPh = { false, NAN, 0, "not_connected" };
      rawCap = { false, true, NAN, 0, "not_connected" };
    }

    if (rawPh.connected && !isnan(rawPh.phValue)) {
      rawPh.phValue = psramPhFilter.pushAndFilter(rawPh.phValue);
    } else {
      psramPhFilter.reset();
    }

    if (rawCap.connected && !isnan(rawCap.moisturePercent)) {
      rawCap.moisturePercent = psramMoistFilter.pushAndFilter(rawCap.moisturePercent);
    } else {
      psramMoistFilter.reset();
    }

    float sV = NAN, sI = NAN, sP = NAN;
    if (inaSolarOk) {
      sV = psramSolarVFilter.pushAndFilter(inaSolar.getBusVoltage_V());
      sI = psramSolarIFilter.pushAndFilter(inaSolar.getCurrent_mA() / 1000.0f);
      sP = psramSolarPFilter.pushAndFilter(inaSolar.getBusPower() / 1000.0f);
    }

    float bV = NAN, bI = NAN, bP = NAN;
    if (inaBatteryOk) {
      bV = psramBattVFilter.pushAndFilter(inaBattery.getBusVoltage_V());
      bI = psramBattIFilter.pushAndFilter(inaBattery.getCurrent_mA() / 1000.0f);
      bP = psramBattPFilter.pushAndFilter(inaBattery.getBusPower() / 1000.0f);
    }

    // Integrasi energi Wh & estimasi jam nyala baterai setiap 100 ms
    coulombMeter.update(inaSolarOk, sV, sP, inaBatteryOk, bV, bI, bP, dtSec);

    // Baca suhu DS18B20 & suhu internal chip tiap 2 detik (20 x 100ms)
    if (tickCounter % 20 == 0) {
      SoilTempReading tRead = readDs18b20();
      if (tRead.connected && !isnan(tRead.temperatureC)) {
        tRead.temperatureC = psramTempFilter.pushAndFilter(tRead.temperatureC);
      } else {
        psramTempFilter.reset();
      }
      cachedTemp = tRead;
      cachedHwTemp = psramHwTempFilter.pushAndFilter(temperatureRead());
    }
    tickCounter++;

    if (xSemaphoreTake(stateMutex, pdMS_TO_TICKS(50)) == pdTRUE) {
      sharedState.ph = rawPh;
      sharedState.cap = rawCap;
      sharedState.temp = cachedTemp;
      sharedState.hwTempC = cachedHwTemp;
      sharedState.solarV = sV;
      sharedState.solarI = sI;
      sharedState.solarP = sP;
      sharedState.solarWh = coulombMeter.getSolarEnergyWh(inaSolarOk);
      sharedState.battV = bV;
      sharedState.battI = bI;
      sharedState.battP = bP;
      sharedState.battWh = coulombMeter.getBatteryEnergyWh(inaBatteryOk);
      sharedState.battRemHours = coulombMeter.getRemainingHours(inaBatteryOk);
      sharedState.psramActive = psramPhFilter.isUsingPsram();
      xSemaphoreGive(stateMutex);
    }

    feedHardwareWatchdog();
    vTaskDelay(pdMS_TO_TICKS(100));
  }
}

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
    float bLow = extractJsonNumber(body, "battery_low_alarm", batteryLowAlarmV);
    if (qMin > 0) modemQuotaMinMb = qMin;
    if (cMin >= 0) modemCreditMinRp = cMin;
    if (sendSec >= 10) sendIntervalMs = (unsigned long)sendSec * 1000UL;
    if (bLow >= 9.0f && bLow <= 13.0f) batteryLowAlarmV = bLow;
    if (body.indexOf("\"buzzer_enabled\":false") >= 0) buzzerEnabled = false;
    else if (body.indexOf("\"buzzer_enabled\":true") >= 0) buzzerEnabled = true;

    Serial.printf("[CONFIG SYNC] KuotaMin: %.0f MB | PulsaMin: Rp %.0f | BattLow: %.2fV | Buzzer: %s\n",
                  modemQuotaMinMb, modemCreditMinRp, batteryLowAlarmV, buzzerEnabled ? "ON" : "OFF");
  }
  http.end();
}

void setup() {
  Serial.begin(115200);
  analogReadResolution(12);

  // Matikan LED RGB onboard ESP32-S3 (GPIO 48 / 38)
  neopixelWrite(48, 0, 0, 0);
  neopixelWrite(38, 0, 0, 0);

  // Aktifkan Hardware Watchdog 45 detik
  initHardwareWatchdog(45);

  pinMode(PIN_ACTIVE_BUZZER, OUTPUT);
  digitalWrite(PIN_ACTIVE_BUZZER, LOW);

  stateMutex = xSemaphoreCreateMutex();
  driverMutex = xSemaphoreCreateMutex();

  // Alokasikan ring buffer filter di 8MB OPI PSRAM
  psramPhFilter.begin();
  psramMoistFilter.begin();
  psramTempFilter.begin();
  psramHwTempFilter.begin();
  psramSolarVFilter.begin();
  psramSolarIFilter.begin();
  psramSolarPFilter.begin();
  psramBattVFilter.begin();
  psramBattIFilter.begin();
  psramBattPFilter.begin();

  Serial.printf("[PSRAM] Total: %u KB | Free: %u KB | Filter in PSRAM: %s\n",
                ESP.getPsramSize() / 1024, ESP.getFreePsram() / 1024,
                psramPhFilter.isUsingPsram() ? "YES" : "NO");

  if (MODEM_SMS_MODE == MODEM_SMS_UART_AT) {
    ModemSerial.begin(115200, SERIAL_8N1, PIN_MODEM_RX, PIN_MODEM_TX);
  }
  modemReader.begin();

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
  coulombMeter.begin(44.0f);

  // Mulai Portal Konfigurasi Lokal + Koneksi WiFi dari NVS
  localPortal.begin(MODEM_AP_SSID, MODEM_AP_PASS, onPortalCalibrationChanged, PIN_BOOT_BUTTON);

  // Jalankan task pembacaan sensor & Coulomb Counting di Core 0
  xTaskCreatePinnedToCore(
    sensorCore0Task,
    "SensorCore0",
    8192,
    nullptr,
    2,
    &core0TaskHandle,
    0
  );
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
  feedHardwareWatchdog();

  SharedSensorState snap;
  if (xSemaphoreTake(stateMutex, pdMS_TO_TICKS(50)) == pdTRUE) {
    snap = sharedState;
    xSemaphoreGive(stateMutex);
  }

  // Update data live untuk halaman Web Portal Lokal (HP tanpa internet)
  PortalLiveTelemetry portalSnap;
  portalSnap.soilPh = snap.ph.phValue;
  portalSnap.soilMoisture = snap.cap.connected ? snap.cap.moisturePercent : NAN;
  portalSnap.soilTempC = snap.temp.temperatureC;
  portalSnap.hwTempC = snap.hwTempC;
  portalSnap.solarV = snap.solarV;
  portalSnap.solarP = snap.solarP;
  portalSnap.solarWh = snap.solarWh;
  portalSnap.battV = snap.battV;
  portalSnap.battP = snap.battP;
  portalSnap.battWh = snap.battWh;
  portalSnap.battRemHours = snap.battRemHours;
  portalSnap.powerSave = powerManager.isPowerSaveActive();
  portalSnap.psramActive = snap.psramActive;
  portalSnap.pendingOffline = offlineLogger.countPending();
  localPortal.updateLiveSnapshot(portalSnap);
  localPortal.handle();

  // Sinkronisasi jam NTP sekali setelah WiFi tersambung
  if (!ntpSynced && WiFi.status() == WL_CONNECTED) {
    configTime(0, 0, "pool.ntp.org", "time.nist.gov");
    if (time(nullptr) > 1700000000) {
      ntpSynced = true;
      Serial.println("[NTP] Waktu UTC tersinkronisasi untuk Offline Logger.");
    }
  }

  // Uji manual SMS parser lewat Serial Monitor
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

  // Evaluasi Adaptive Power Mode berdasarkan tegangan baterai 3S Li-ion
  unsigned long effectiveSendIntervalMs = powerManager.evaluateAndApply(
    inaBatteryOk, snap.battV, batteryLowAlarmV, sendIntervalMs, localPortal.isApActive()
  );

  if ((!firstTelemetrySent && WiFi.status() == WL_CONNECTED && millis() > 3500) ||
      (millis() - lastSendMs >= effectiveSendIntervalMs)) {
    firstTelemetrySent = true;
    lastSendMs = millis();

    float moisturePct = snap.cap.connected ? snap.cap.moisturePercent : NAN;
    int   rawMoisture = snap.cap.connected ? snap.cap.rawValue : 0;
    const char* moistStatus = snap.cap.status;

    float quotaMb  = modemReader.getQuotaMb();
    float creditRp = modemReader.getCreditRp();
    bool lowQuotaOrCredit =
      (!isnan(quotaMb) && quotaMb < modemQuotaMinMb) ||
      (!isnan(creditRp) && creditRp < modemCreditMinRp);

    updateActiveBuzzer(lowQuotaOrCredit);

    String isoTs = getIsoTimestampOrEmpty();
    int rssiVal = (WiFi.status() == WL_CONNECTED) ? WiFi.RSSI() : -99;

    String payload = "{";
    payload += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
    if (isoTs.length() > 0) {
      payload += "\"timestamp\":\"" + isoTs + "\",";
    }
    payload += "\"soil_ph\":" + (isnan(snap.ph.phValue) ? "null" : String(snap.ph.phValue, 2)) + ",";
    payload += "\"soil_ph_raw\":" + (snap.ph.connected ? String(snap.ph.rawValue) : "null") + ",";
    payload += "\"soil_moisture\":" + (isnan(moisturePct) ? "null" : String(moisturePct, 1)) + ",";
    payload += "\"soil_dms_raw\":" + (snap.cap.connected ? String(rawMoisture) : "null") + ",";
    payload += "\"soil_temperature\":" + (isnan(snap.temp.temperatureC) ? "null" : String(snap.temp.temperatureC, 1)) + ",";
    payload += "\"hardware_temperature\":" + (isnan(snap.hwTempC) ? "null" : String(snap.hwTempC, 1)) + ",";
    payload += "\"solar_voltage\":" + (isnan(snap.solarV) ? "null" : String(snap.solarV, 2)) + ",";
    payload += "\"solar_current\":" + (isnan(snap.solarI) ? "null" : String(snap.solarI, 3)) + ",";
    payload += "\"solar_power\":" + (isnan(snap.solarP) ? "null" : String(snap.solarP, 2)) + ",";
    payload += "\"solar_energy_wh\":" + (isnan(snap.solarWh) ? "null" : String(snap.solarWh, 2)) + ",";
    payload += "\"battery_voltage\":" + (isnan(snap.battV) ? "null" : String(snap.battV, 2)) + ",";
    payload += "\"battery_current\":" + (isnan(snap.battI) ? "null" : String(snap.battI, 3)) + ",";
    payload += "\"battery_power\":" + (isnan(snap.battP) ? "null" : String(snap.battP, 2)) + ",";
    payload += "\"battery_energy_wh\":" + (isnan(snap.battWh) ? "null" : String(snap.battWh, 2)) + ",";
    payload += "\"battery_remaining_hours\":" + (isnan(snap.battRemHours) ? "null" : String(snap.battRemHours, 1)) + ",";
    payload += "\"power_save_mode\":" + String(powerManager.isPowerSaveActive() ? "true" : "false") + ",";
    payload += "\"signal_rssi\":" + String(rssiVal) + ",";
    payload += "\"modem_quota_mb\":" + (isnan(quotaMb) ? "null" : String(quotaMb, 0)) + ",";
    payload += "\"modem_credit_rp\":" + (isnan(creditRp) ? "null" : String(creditRp, 0)) + ",";
    payload += "\"buzzer_active\":" + String(buzzerActive ? "true" : "false") + ",";
    payload += "\"uptime_seconds\":" + String(millis() / 1000) + ",";
    payload += "\"sensor_status\":{";
    payload += "\"ph\":\"" + String(snap.ph.status) + "\",";
    payload += "\"dms\":\"" + String(moistStatus) + "\",";
    payload += "\"temperature\":\"" + String(snap.temp.status) + "\"";
    payload += "}}";

    Serial.println("[TELEMETRY PAYLOAD] " + payload);

    if (WiFi.status() == WL_CONNECTED) {
      String endpoint = String(BASE_API_URL) + "/api/v1/telemetry";

      offlineLogger.flushBatch(endpoint, API_KEY, 5);
      feedHardwareWatchdog();

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
        offlineLogger.enqueue(payload);
      }
      http.end();
    } else {
      Serial.println("[MODEM 4G] Koneksi terputus! Menyimpan ke Offline Logger Flash...");
      offlineLogger.enqueue(payload);
    }
  }

  delay(5);
}
