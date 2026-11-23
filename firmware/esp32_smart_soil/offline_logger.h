#ifndef SMART_SOIL_OFFLINE_LOGGER_H
#define SMART_SOIL_OFFLINE_LOGGER_H

#include <Arduino.h>
#include <LittleFS.h>
#include <HTTPClient.h>
#include <vector>

// ============================================================================
// OFFLINE DATA LOGGER & AUTO-SYNC (16MB FLASH LittleFS — ESP32-S3 N16R8)
// ============================================================================
// Menyimpan paket JSON telemetri ke Flash internal saat Modem 4G ZTE MF90
// kehilangan sinyal atau kehabisan kuota, lalu otomatis mengirim ulang (sync)
// begitu koneksi internet pulih.
// ============================================================================

class OfflineTelemetryLogger {
private:
  const char* _queuePath = "/offline_queue.jsonl";
  const char* _tmpPath   = "/offline_queue.tmp";
  bool _fsReady = false;
  size_t _maxRecords = 2000;

public:
  bool begin() {
    if (!LittleFS.begin(true)) {
      Serial.println("[OFFLINE LOGGER] Gagal mount LittleFS!");
      _fsReady = false;
      return false;
    }
    _fsReady = true;
    size_t pending = countPending();
    Serial.printf("[OFFLINE LOGGER] LittleFS 16MB Flash siap. Antrean tersimpan: %u data\n", (unsigned int)pending);
    return true;
  }

  size_t countPending() {
    if (!_fsReady || !LittleFS.exists(_queuePath)) return 0;
    File f = LittleFS.open(_queuePath, FILE_READ);
    if (!f) return 0;
    size_t lines = 0;
    while (f.available()) {
      String line = f.readStringUntil('\n');
      line.trim();
      if (line.length() > 2) lines++;
    }
    f.close();
    return lines;
  }

  bool enqueue(const String& jsonPayload) {
    if (!_fsReady) return false;
    size_t current = countPending();
    if (current >= _maxRecords) {
      Serial.println("[OFFLINE LOGGER] Antrean penuh (2000 data), melewati penyimpanan baru.");
      return false;
    }
    File f = LittleFS.open(_queuePath, FILE_APPEND);
    if (!f) {
      Serial.println("[OFFLINE LOGGER] Gagal membuka file antrean untuk menulis.");
      return false;
    }
    f.println(jsonPayload);
    f.close();
    Serial.printf("[OFFLINE LOGGER] Offline! Data disimpan ke Flash (Total antrean: %u)\n", (unsigned int)(current + 1));
    return true;
  }

  // Kirim maksimal `maxBatch` data tertunda saat WiFi/4G kembali online
  int flushBatch(const String& endpoint, const char* apiKey, int maxBatch = 5) {
    if (!_fsReady || !LittleFS.exists(_queuePath)) return 0;

    File f = LittleFS.open(_queuePath, FILE_READ);
    if (!f) return 0;

    std::vector<String> allLines;
    while (f.available()) {
      String line = f.readStringUntil('\n');
      line.trim();
      if (line.length() > 2) {
        allLines.push_back(line);
      }
    }
    f.close();

    if (allLines.empty()) {
      LittleFS.remove(_queuePath);
      return 0;
    }

    int sentCount = 0;
    size_t idx = 0;
    while (idx < allLines.size() && sentCount < maxBatch) {
      HTTPClient http;
      http.setTimeout(6000);
      if (!http.begin(endpoint)) break;
      http.addHeader("Content-Type", "application/json");
      http.addHeader("X-API-Key", apiKey);
      int code = http.POST(allLines[idx]);
      http.end();

      if (code >= 200 && code < 300) {
        sentCount++;
        idx++;
        Serial.printf("[AUTO-SYNC] Berhasil kirim data offline #%d (HTTP %d)\n", sentCount, code);
      } else {
        Serial.printf("[AUTO-SYNC] Gagal kirim (HTTP %d), tunda sisa antrean.\n", code);
        break;
      }
    }

    if (idx > 0) {
      if (idx >= allLines.size()) {
        LittleFS.remove(_queuePath);
        Serial.println("[AUTO-SYNC] Semua data offline berhasil disinkronkan!");
      } else {
        File tmp = LittleFS.open(_tmpPath, FILE_WRITE);
        if (tmp) {
          for (size_t j = idx; j < allLines.size(); j++) {
            tmp.println(allLines[j]);
          }
          tmp.close();
          LittleFS.remove(_queuePath);
          LittleFS.rename(_tmpPath, _queuePath);
          Serial.printf("[AUTO-SYNC] Sisa antrean di Flash: %u data\n", (unsigned int)(allLines.size() - idx));
        }
      }
    }

    return sentCount;
  }
};

#endif
