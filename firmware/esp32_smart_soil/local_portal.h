#ifndef SMART_SOIL_LOCAL_PORTAL_H
#define SMART_SOIL_LOCAL_PORTAL_H

#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <ESPmDNS.h>
#include <Preferences.h>
#include <Update.h>
#include <WiFiClientSecure.h>
#include <ArduinoOTA.h>
#include <esp_task_wdt.h>

struct PortalLiveTelemetry {
  float soilPh = NAN;
  float soilMoisture = NAN;
  float soilTempC = NAN;
  float hwTempC = NAN;
  float solarV = NAN;
  float solarP = NAN;
  float solarWh = NAN;
  float battV = NAN;
  float battP = NAN;
  float battWh = NAN;
  float battRemHours = NAN;
  bool powerSave = false;
  bool psramActive = false;
  size_t pendingOffline = 0;
};

typedef void (*CalibrationUpdateCallback)(float phOffset, int capDry, int capWet);

class LocalConfigPortal {
private:
  WebServer _server{80};
  DNSServer _dns;
  Preferences _prefs;

  String _ssid;
  String _pass;
  float _phOffset = 0.0f;
  int _capDry = 2950;
  int _capWet = 1250;

  uint8_t _bootPin = 0; // Tombol BOOT bawaan ESP32-S3 DevKitC-1
  volatile bool _apTriggerRequested = false;
  unsigned long _bootPressStartMs = 0;
  bool _bootHeldHandled = false;

  bool _apActive = false;
  bool _mdnsStarted = false;
  unsigned long _apStartedMs = 0;
  unsigned long _wifiDisconnectedSinceMs = 0;

  PortalLiveTelemetry _live;
  CalibrationUpdateCallback _onCalUpdate = nullptr;

  const char* _apSsid = "SmartSoil-Setup";

  static String fmtFloatOrNa(float v, int dec, const char* unit) {
    if (isnan(v)) return "Not Connected";
    return String(v, dec) + " " + unit;
  }

  void startSoftApPortal() {
    if (_apActive) return;
    bool staConnected = (WiFi.status() == WL_CONNECTED);
    int channel = (staConnected && WiFi.channel() >= 1 && WiFi.channel() <= 13) ? WiFi.channel() : 6;
    if (!staConnected) {
      // Hentikan scan STA sementara agar radio 2.4GHz fokus memancarkan sinyal AP stabil
      WiFi.disconnect(false);
      delay(50);
    }
    WiFi.mode(WIFI_AP_STA);
    WiFi.setSleep(false);
    IPAddress apIp(192, 168, 4, 1);
    IPAddress netMsk(255, 255, 255, 0);
    WiFi.softAPConfig(apIp, apIp, netMsk);
    bool ok = WiFi.softAP(_apSsid, nullptr, channel, 0, 4);
    _dns.start(53, "*", apIp);
    _apActive = true;
    _apStartedMs = millis();
    Serial.printf("[LOCAL PORTAL] SoftAP '%s' (ch %d) %s! Buka http://192.168.4.1\n",
                  _apSsid, channel, ok ? "AKTIF" : "GAGAL");
  }

  void stopSoftApPortal() {
    if (!_apActive) return;
    _dns.stop();
    WiFi.softAPdisconnect(true);
    WiFi.mode(WIFI_STA);
    _apActive = false;
    Serial.println("[LOCAL PORTAL] SoftAP ditutup otomatis (WiFi utama sudah stabil).");
  }

  void setupRoutes() {
    _server.on("/", HTTP_GET, [this]() {
      String html = "<!DOCTYPE html><html lang='id'><head><meta charset='utf-8'>"
        "<meta name='viewport' content='width=device-width,initial-scale=1'>"
        "<title>Smart Soil ESP32-S3 Portal & OTA</title>"
        "<style>"
        "body{font-family:system-ui,sans-serif;background:#0f172a;color:#f8fafc;margin:0;padding:16px}"
        ".wrap{max-width:520px;margin:0 auto;display:flex;flex-direction:column;gap:14px}"
        ".card{background:#1e293b;border:1px solid #334155;border-radius:14px;padding:16px}"
        "h1{font-size:18px;margin:0 0 4px;color:#34d399}h2{font-size:14px;margin:0 0 10px;color:#94a3b8}"
        ".grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}"
        ".box{background:#0f172a;border-radius:10px;padding:10px}"
        ".lbl{font-size:11px;color:#94a3b8;display:block}.val{font-size:16px;font-weight:700}"
        "label{font-size:12px;color:#cbd5e1;display:block;margin:8px 0 4px}"
        "input{width:100%;box-sizing:border-box;padding:9px 10px;border-radius:8px;border:1px solid #475569;background:#0f172a;color:#fff}"
        "button{margin-top:12px;width:100%;padding:10px;border:0;border-radius:10px;background:#10b981;color:#fff;font-weight:700;cursor:pointer}"
        ".btn-ota{background:#6366f1}"
        ".sub{font-size:11px;color:#64748b}"
        "</style></head><body><div class='wrap'>"
        "<div class='card'><h1>Smart Soil ESP32-S3 N16R8 (Wireless OTA)</h1>"
        "<div class='sub'>WiFi: <b>" + (WiFi.status() == WL_CONNECTED ? WiFi.SSID() + " (" + String(WiFi.RSSI()) + " dBm)" : String("Terputus")) + "</b>"
        " • PSRAM Free: <b>" + String(ESP.getFreePsram() / 1024) + " KB</b>"
        " • CPU: <b>Real-Time 240MHz</b></div></div>"
        "<div class='card'><h2>Pembacaan Sensor Real-Time (Dual-Core PSRAM Filter)</h2><div class='grid'>"
        "<div class='box'><span class='lbl'>Soil pH</span><span class='val' id='ph'>" + fmtFloatOrNa(_live.soilPh, 2, "pH") + "</span></div>"
        "<div class='box'><span class='lbl'>Soil Moisture</span><span class='val' id='moist'>" + fmtFloatOrNa(_live.soilMoisture, 1, "%") + "</span></div>"
        "<div class='box'><span class='lbl'>Soil Temp</span><span class='val' id='stemp'>" + fmtFloatOrNa(_live.soilTempC, 1, "°C") + "</span></div>"
        "<div class='box'><span class='lbl'>Suhu Hardware</span><span class='val' id='htemp'>" + fmtFloatOrNa(_live.hwTempC, 1, "°C") + "</span></div>"
        "<div class='box'><span class='lbl'>Baterai 3S</span><span class='val' id='batt'>" + fmtFloatOrNa(_live.battV, 2, "V") + "</span></div>"
        "<div class='box'><span class='lbl'>Sisa Waktu</span><span class='val' id='rem'>" + fmtFloatOrNa(_live.battRemHours, 1, "Jam") + "</span></div>"
        "<div class='box'><span class='lbl'>Panen Surya</span><span class='val' id='swh'>" + fmtFloatOrNa(_live.solarWh, 2, "Wh") + "</span></div>"
        "<div class='box'><span class='lbl'>Antrean Offline</span><span class='val' id='q'>" + String(_live.pendingOffline) + " data</span></div>"
        "</div></div>"
        "<div class='card'><h2>Wireless OTA Firmware Update (Tanpa Kabel USB)</h2>"
        "<p class='sub' style='margin:0 0 8px'>Pilih file <b>firmware.bin</b> dari HP/Laptop untuk meng-upgrade ESP32-S3 lewat WiFi.</p>"
        "<form method='POST' action='/update' enctype='multipart/form-data'>"
        "<input type='file' name='firmware' accept='.bin' required>"
        "<button type='submit' class='btn-ota'>Upload &amp; Flash Firmware OTA</button></form></div>"
        "<div class='card'><h2>Ganti WiFi / Hotspot Modem 4G (Tanpa Laptop)</h2>"
        "<form method='POST' action='/save-wifi'>"
        "<label>Nama WiFi (SSID 2.4 GHz)</label><input name='ssid' value='" + _ssid + "' required>"
        "<label>Password WiFi</label><input name='pass' type='password' value='" + _pass + "'>"
        "<button type='submit'>Simpan &amp; Sambungkan WiFi</button></form></div>"
        "<div class='card'><h2>Kalibrasi Sensor Cepat</h2>"
        "<form method='POST' action='/save-cal'>"
        "<label>Offset Kalibrasi pH</label><input name='ph_off' type='number' step='0.01' value='" + String(_phOffset, 2) + "'>"
        "<label>ADC Kering (Capacitive Moisture)</label><input name='dry' type='number' value='" + String(_capDry) + "'>"
        "<label>ADC Basah (Capacitive Moisture)</label><input name='wet' type='number' value='" + String(_capWet) + "'>"
        "<button type='submit'>Simpan Kalibrasi ke NVS</button></form></div>"
        "</div>"
        "<script>setInterval(()=>fetch('/api/live').then(r=>r.json()).then(d=>{"
        "document.getElementById('ph').textContent=d.ph||'Not Connected';"
        "document.getElementById('moist').textContent=d.moist||'Not Connected';"
        "document.getElementById('stemp').textContent=d.stemp||'Not Connected';"
        "document.getElementById('htemp').textContent=d.htemp||'-';"
        "document.getElementById('batt').textContent=d.batt||'Not Available';"
        "document.getElementById('rem').textContent=d.rem||'Not Available';"
        "document.getElementById('swh').textContent=d.swh||'Not Available';"
        "document.getElementById('q').textContent=d.q+' data';"
        "}).catch(()=>{}),3000);</script></body></html>";
      _server.send(200, "text/html", html);
    });

    // Endpoint Multipart Browser OTA Update (/update)
    _server.on(
      "/update",
      HTTP_POST,
      [this]() {
        bool ok = !Update.hasError();
        _server.sendHeader("Connection", "close");
        _server.send(200, "text/html",
          ok
            ? "<html><body style='background:#0f172a;color:#34d399;font-family:sans-serif;padding:24px'>"
              "<h2>OTA Update Berhasil!</h2><p>ESP32-S3 sedang merestart dengan firmware baru...</p></body></html>"
            : "<html><body style='background:#0f172a;color:#fb7185;font-family:sans-serif;padding:24px'>"
              "<h2>OTA Gagal!</h2><p>Pastikan file firmware.bin valid untuk ESP32-S3.</p><a href='/' style='color:#fff'>Kembali</a></body></html>");
        delay(400);
        if (ok) {
          ESP.restart();
        } else {
          esp_task_wdt_add(NULL);
        }
      },
      [this]() {
        HTTPUpload& upload = _server.upload();
        if (upload.status == UPLOAD_FILE_START) {
          Serial.printf("[PORTAL OTA] Mulai menerima file: %s\n", upload.filename.c_str());
          esp_task_wdt_delete(NULL);
          WiFi.setSleep(false);
          if (!Update.begin(UPDATE_SIZE_UNKNOWN)) {
            Update.printError(Serial);
          }
        } else if (upload.status == UPLOAD_FILE_WRITE) {
          if (Update.write(upload.buf, upload.currentSize) != upload.currentSize) {
            Update.printError(Serial);
          }
        } else if (upload.status == UPLOAD_FILE_END) {
          if (Update.end(true)) {
            Serial.printf("[PORTAL OTA] Sukses menulis %u bytes! Siap reboot...\n", upload.totalSize);
          } else {
            Update.printError(Serial);
          }
        }
      }
    );

    _server.on("/api/live", HTTP_GET, [this]() {
      String j = "{";
      j += "\"ph\":" + (isnan(_live.soilPh) ? "null" : "\"" + String(_live.soilPh, 2) + " pH\"") + ",";
      j += "\"moist\":" + (isnan(_live.soilMoisture) ? "null" : "\"" + String(_live.soilMoisture, 1) + " %\"") + ",";
      j += "\"stemp\":" + (isnan(_live.soilTempC) ? "null" : "\"" + String(_live.soilTempC, 1) + " °C\"") + ",";
      j += "\"htemp\":" + (isnan(_live.hwTempC) ? "null" : "\"" + String(_live.hwTempC, 1) + " °C\"") + ",";
      j += "\"batt\":" + (isnan(_live.battV) ? "null" : "\"" + String(_live.battV, 2) + " V\"") + ",";
      j += "\"rem\":" + (isnan(_live.battRemHours) ? "null" : "\"" + String(_live.battRemHours, 1) + " Jam\"") + ",";
      j += "\"swh\":" + (isnan(_live.solarWh) ? "null" : "\"" + String(_live.solarWh, 2) + " Wh\"") + ",";
      j += "\"q\":" + String(_live.pendingOffline) + "}";
      _server.send(200, "application/json", j);
    });

    _server.on("/save-wifi", HTTP_POST, [this]() {
      String newSsid = _server.arg("ssid");
      String newPass = _server.arg("pass");
      newSsid.trim();
      if (newSsid.length() > 0) {
        _ssid = newSsid;
        _pass = newPass;
        _prefs.putString("ssid", _ssid);
        _prefs.putString("pass", _pass);
        _server.send(200, "text/html",
          "<html><body style='background:#0f172a;color:#34d399;font-family:sans-serif;padding:24px'>"
          "<h3>WiFi Disimpan!</h3><p>Menyambungkan ke <b>" + _ssid + "</b>...<br><a href='/' style='color:#fff'>Kembali</a></p></body></html>");
        delay(400);
        WiFi.disconnect();
        WiFi.begin(_ssid.c_str(), _pass.c_str());
        _wifiDisconnectedSinceMs = millis();
      } else {
        _server.send(400, "text/plain", "SSID tidak boleh kosong");
      }
    });

    _server.on("/save-cal", HTTP_POST, [this]() {
      _phOffset = _server.arg("ph_off").toFloat();
      _capDry = _server.arg("dry").toInt();
      _capWet = _server.arg("wet").toInt();
      _prefs.putFloat("ph_off", _phOffset);
      _prefs.putInt("cap_dry", _capDry);
      _prefs.putInt("cap_wet", _capWet);
      if (_onCalUpdate) _onCalUpdate(_phOffset, _capDry, _capWet);
      _server.sendHeader("Location", "/");
      _server.send(303);
    });

    // Captive Portal redirect untuk Android / iOS / Windows
    _server.onNotFound([this]() {
      _server.sendHeader("Location", String("http://") + (_apActive ? "192.168.4.1" : WiFi.localIP().toString()) + "/");
      _server.send(302, "text/plain", "");
    });
  }

public:
  void begin(const char* defaultSsid, const char* defaultPass,
             CalibrationUpdateCallback calCb, uint8_t bootButtonPin = 0) {
    _bootPin = bootButtonPin;
    _onCalUpdate = calCb;
    pinMode(_bootPin, INPUT_PULLUP);

    _prefs.begin("soil_cfg", false);
    _ssid = _prefs.getString("ssid", defaultSsid);
    _pass = _prefs.getString("pass", defaultPass);
    _phOffset = _prefs.getFloat("ph_off", 0.0f);
    _capDry = _prefs.getInt("cap_dry", 2950);
    _capWet = _prefs.getInt("cap_wet", 1250);

    if (_onCalUpdate) _onCalUpdate(_phOffset, _capDry, _capWet);

    WiFi.mode(WIFI_STA);
    WiFi.begin(_ssid.c_str(), _pass.c_str());
    _wifiDisconnectedSinceMs = millis();

    setupRoutes();
    _server.begin();
    Serial.printf("[LOCAL PORTAL] Siap. Target WiFi NVS: '%s' (Tahan tombol BOOT 3 detik untuk buka WiFi Setup AP)\n", _ssid.c_str());
  }

  bool isApActive() const { return _apActive; }

  // Dipanggil dari Core 0 setiap 100ms agar tombol BOOT tidak pernah terlewat saat Core 1 sibuk HTTP
  void pollBootButtonFast() {
    if (digitalRead(_bootPin) == LOW) {
      if (_bootPressStartMs == 0) {
        _bootPressStartMs = millis();
        _bootHeldHandled = false;
      } else if (!_bootHeldHandled && (millis() - _bootPressStartMs >= 2000UL)) {
        _bootHeldHandled = true;
        _apTriggerRequested = true;
      }
    } else {
      _bootPressStartMs = 0;
      _bootHeldHandled = false;
    }
  }

  void updateLiveSnapshot(const PortalLiveTelemetry& snap) {
    _live = snap;
  }

  void handle() {
    if (_apTriggerRequested) {
      _apTriggerRequested = false;
      startSoftApPortal();
    }

    _server.handleClient();
    if (_apActive) {
      _dns.processNextRequest();
    }

    // Fallback cek juga di Core 1
    pollBootButtonFast();

    // 2. Mulai mDNS (http://smartsoil.local) saat WiFi tersambung
    if (WiFi.status() == WL_CONNECTED) {
      _wifiDisconnectedSinceMs = millis();
      if (!_mdnsStarted) {
        if (MDNS.begin("smartsoil")) {
          _mdnsStarted = true;
          Serial.printf("[LOCAL PORTAL] Dashboard lokal aktif di http://smartsoil.local atau http://%s\n",
                        WiFi.localIP().toString().c_str());
        }
      }
      // Tutup SoftAP otomatis setelah 10 menit jika WiFi utama sudah tersambung & tidak ada klien di AP
      if (_apActive && WiFi.softAPgetStationNum() == 0 && (millis() - _apStartedMs >= 600000UL)) {
        stopSoftApPortal();
      }
    } else {
      // 3. Jika gagal tersambung ke WiFi selama 30 detik, otomatis nyalakan SoftAP Setup
      if (!_apActive && (millis() - _wifiDisconnectedSinceMs >= 30000UL)) {
        startSoftApPortal();
      }
    }
  }
};

#endif
