/**
 * ============================================================================
 * SMART SOIL MONITORING IoT — ESP32-S3 N16R8 FIRMWARE (v2.0.0)
 * ============================================================================
 * Komponen Utama:
 * 1. MCU             : ESP32-S3 N16R8 (16MB Flash, 8MB OPI PSRAM)
 *                      *PENTING: Jangan gunakan GPIO 35, 36, 37 (OPI PSRAM)*
 * 2. Sensor Energi   : 2x INA226 (I2C GPIO 8=SDA, GPIO 9=SCL)
 *                      - INA226 #1 (0x40): Panel Surya (V, A, W)
 *                      - INA226 #2 (0x41): Baterai (V, A, W)
 * 3. Solar Charger   : CN3791 MPPT Solar Charge Controller
 * 4. Active Buzzer   : GPIO 21 (Berbunyi otomatis saat sisa pulsa Modem 4G menipis)
 * 5. Suhu Tanah      : DS18B20 Waterproof (1-Wire GPIO 4 + Pull-up 4.7kΩ)
 * 6. Kelembapan      : Capacitive Soil Moisture Sensor (ADC1 GPIO 5)
 * 7. pH Tanah + DMS  : Sensor pH Analog ADC (GPIO 6) + DMS (GPIO 7) — Driver Modular
 * 8. Konektivitas    : Modem 4G LTE (WiFi AP / UART2 GPIO 17 TX, GPIO 18 RX)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <INA226_WE.h>
#include "sensor_drivers.h"

// ============================================================================
// KONFIGURASI IDENTITAS PERANGKAT, API, & MODEM 4G
// ============================================================================
const char* DEVICE_ID         = "SOIL-001";
const char* API_KEY           = "sk_soil_001_esp32_4g_key_2026";
const char* API_ENDPOINT      = "https://smart-soil-monitoring-iot.vercel.app/api/v1/telemetry";

const char* MODEM_AP_SSID     = "4G_SMART_SOIL_MODEM";
const char* MODEM_AP_PASS     = "smartsoil2026";

// Ambang batas sisa pulsa Modem 4G (Rp) pemicu Active Buzzer
const float MODEM_CREDIT_MIN_RP = 10000.0f;

// ============================================================================
// PIN MAPPING ESP32-S3 N16R8 (AMAN DARI OPI PSRAM GPIO 35/36/37)
// ============================================================================
#define PIN_I2C_SDA           8
#define PIN_I2C_SCL           9
#define INA226_ADDR_SOLAR     0x40  // A0=GND, A1=GND  -> Panel Surya
#define INA226_ADDR_BATTERY   0x41  // A0=3.3V, A1=GND -> Baterai

#define PIN_DS18B20           4     // 1-Wire + Pull-up 4.7kΩ ke 3.3V
#define PIN_CAP_MOISTURE      5     // Capacitive Soil Moisture (ADC1_CH4)
#define PIN_SOIL_PH_ADC       6     // Sensor pH Tanah Output Analog ADC (ADC1_CH5)
#define PIN_SOIL_DMS          7     // Sensor DMS (ADC1_CH6)
#define PIN_ACTIVE_BUZZER     21    // Active Buzzer (Alarm Pulsa Modem Menipis)

#define PIN_MODEM_TX          17    // UART2 TX -> RX Modem 4G (opsional AT USSD)
#define PIN_MODEM_RX          18    // UART2 RX -> TX Modem 4G (opsional AT USSD)

// ============================================================================
// INISIALISASI OBJEK SENSOR
// ============================================================================
INA226_WE inaSolar   = INA226_WE(INA226_ADDR_SOLAR);
INA226_WE inaBattery = INA226_WE(INA226_ADDR_BATTERY);
bool inaSolarOk   = false;
bool inaBatteryOk = false;

OneWire oneWire(PIN_DS18B20);
DallasTemperature ds18b20(&oneWire);

// Driver Modular: pH Analog ADC + DMS + Capacitive Soil Moisture
ModularSoilPhDriver  phSensor(PH_MODE_ANALOG_ADC, PIN_SOIL_PH_ADC, 0.0f);
ModularSoilDmsDriver dmsSensor(DMS_MODE_ANALOG_ADC, PIN_SOIL_DMS, true, 3200, 1400);
CapacitiveMoistureDriver capMoistureSensor(PIN_CAP_MOISTURE, 2950, 1250);

unsigned long lastSendMs = 0;
const unsigned long SEND_INTERVAL_MS = 60000; // 60 detik

// Variabel sisa pulsa Modem 4G (NAN jika belum terbaca via USSD/API)
float currentModemCreditRp = NAN;
bool buzzerActive = false;

void updateActiveBuzzer(bool lowCredit) {
  buzzerActive = lowCredit;
  if (buzzerActive) {
    // Pola bunyi beep-beep peringatan pulsa menipis (3x beep singkat)
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

float readModemCreditRp() {
  // Jika menggunakan modul 4G UART (SIM7600/A7670), kirim AT+CUSD=1,"*888#",15
  // lalu parse angka sisa pulsa (Rp) dan simpan ke currentModemCreditRp.
  // Jika belum ada respon pulsa, kembalikan NAN (UI menampilkan "Not Available").
  return currentModemCreditRp;
}

void setup() {
  Serial.begin(115200);
  analogReadResolution(12);

  pinMode(PIN_ACTIVE_BUZZER, OUTPUT);
  digitalWrite(PIN_ACTIVE_BUZZER, LOW);

  // Inisialisasi I2C untuk 2x INA226
  Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL);

  inaSolarOk = inaSolar.init();
  if (inaSolarOk) {
    inaSolar.setResistorRange(0.1, 0.8); // Sesuaikan Rshunt (umumnya 0.1 Ohm)
    Serial.println("[INA226 #1] Panel Surya (0x40) OK");
  } else {
    Serial.println("[INA226 #1] Panel Surya (0x40) TIDAK TERDETEKSI");
  }

  inaBatteryOk = inaBattery.init();
  if (inaBatteryOk) {
    inaBattery.setResistorRange(0.1, 0.8); // Sesuaikan Rshunt (umumnya 0.1 Ohm)
    Serial.println("[INA226 #2] Baterai (0x41) OK");
  } else {
    Serial.println("[INA226 #2] Baterai (0x41) TIDAK TERDETEKSI");
  }

  ds18b20.begin();
  phSensor.begin();
  dmsSensor.begin();
  capMoistureSensor.begin();

  Serial.println("[SMART SOIL IoT - ESP32-S3 N16R8] Menghubungkan ke Modem 4G...");
  WiFi.begin(MODEM_AP_SSID, MODEM_AP_PASS);
}

void loop() {
  if (millis() - lastSendMs >= SEND_INTERVAL_MS) {
    lastSendMs = millis();

    SoilPhReading   ph   = phSensor.read();
    SoilDmsReading  dms  = dmsSensor.read();
    SoilDmsReading  cap  = capMoistureSensor.read();
    SoilTempReading temp = readDs18b20();

    // Prioritaskan pembacaan kelembapan dari Capacitive Soil Moisture, fallback ke DMS
    float moisturePct = cap.connected ? cap.moisturePercent : dms.moisturePercent;
    int   rawMoisture = dms.connected ? dms.rawValue : cap.rawValue;
    const char* moistStatus = cap.connected ? cap.status : dms.status;

    // Baca 2x INA226 (Solar Panel & Baterai) — kirim null jika sensor tidak terdeteksi
    float solarV = inaSolarOk ? inaSolar.getBusVoltage_V() : NAN;
    float solarI = inaSolarOk ? (inaSolar.getCurrent_mA() / 1000.0f) : NAN;
    float solarP = inaSolarOk ? (inaSolar.getBusPower() / 1000.0f) : NAN;

    float battV  = inaBatteryOk ? inaBattery.getBusVoltage_V() : NAN;
    float battI  = inaBatteryOk ? (inaBattery.getCurrent_mA() / 1000.0f) : NAN;
    float battP  = inaBatteryOk ? (inaBattery.getBusPower() / 1000.0f) : NAN;

    // Cek sisa pulsa Modem 4G & kendalikan Active Buzzer
    float creditRp = readModemCreditRp();
    bool lowCredit = (!isnan(creditRp) && creditRp < MODEM_CREDIT_MIN_RP);
    updateActiveBuzzer(lowCredit);

    String payload = "{";
    payload += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
    payload += "\"soil_ph\":" + (isnan(ph.phValue) ? "null" : String(ph.phValue, 2)) + ",";
    payload += "\"soil_ph_raw\":" + (ph.connected ? String(ph.rawValue) : "null") + ",";
    payload += "\"soil_moisture\":" + (isnan(moisturePct) ? "null" : String(moisturePct, 1)) + ",";
    payload += "\"soil_dms_raw\":" + ((dms.connected || cap.connected) ? String(rawMoisture) : "null") + ",";
    payload += "\"soil_temperature\":" + (isnan(temp.temperatureC) ? "null" : String(temp.temperatureC, 1)) + ",";
    payload += "\"solar_voltage\":" + (isnan(solarV) ? "null" : String(solarV, 2)) + ",";
    payload += "\"solar_current\":" + (isnan(solarI) ? "null" : String(solarI, 3)) + ",";
    payload += "\"solar_power\":" + (isnan(solarP) ? "null" : String(solarP, 2)) + ",";
    payload += "\"battery_voltage\":" + (isnan(battV) ? "null" : String(battV, 2)) + ",";
    payload += "\"battery_current\":" + (isnan(battI) ? "null" : String(battI, 3)) + ",";
    payload += "\"battery_power\":" + (isnan(battP) ? "null" : String(battP, 2)) + ",";
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
