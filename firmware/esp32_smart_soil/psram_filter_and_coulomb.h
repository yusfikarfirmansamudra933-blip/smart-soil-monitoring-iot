#ifndef SMART_SOIL_PSRAM_FILTER_AND_COULOMB_H
#define SMART_SOIL_PSRAM_FILTER_AND_COULOMB_H

#include <Arduino.h>
#include <Preferences.h>
#include <WiFi.h>
#include <esp_idf_version.h>
#include <esp_task_wdt.h>
#include <math.h>
#include <stdlib.h>

// ============================================================================
// 1. HARDWARE TASK WATCHDOG (ESP32-S3 SELF-RECOVERY)
// ============================================================================
inline void initHardwareWatchdog(uint32_t timeoutSec = 45) {
#if ESP_IDF_VERSION_MAJOR >= 5
  esp_task_wdt_config_t wdtCfg = {
    .timeout_ms = timeoutSec * 1000,
    .idle_core_mask = 0,
    .trigger_panic = true
  };
  esp_task_wdt_reconfigure(&wdtCfg);
#else
  esp_task_wdt_init(timeoutSec, true);
#endif
  esp_task_wdt_add(NULL);
}

inline void registerCurrentTaskWatchdog() {
  esp_task_wdt_add(NULL);
}

inline void feedHardwareWatchdog() {
  esp_task_wdt_reset();
}

inline void suspendCurrentTaskWatchdog() {
  esp_task_wdt_delete(NULL);
}

// ============================================================================
// 2. 8MB OPI PSRAM RING BUFFER + TRIMMED MEDIAN-KALMAN FILTER
// ============================================================================
class PsramSignalFilter {
private:
  float* _buf = nullptr;
  size_t _cap = 0;
  size_t _count = 0;
  size_t _head = 0;
  bool _inPsram = false;
  bool _hasEstimate = false;
  float _kalmanEst = 0.0f;
  float _kalmanErr = 1.0f;
  float _procNoise = 0.015f;
  float _measNoise = 0.12f;

public:
  PsramSignalFilter(size_t capacity = 64, float procNoise = 0.015f, float measNoise = 0.12f)
    : _cap(capacity), _procNoise(procNoise), _measNoise(measNoise) {}

  bool begin() {
    if (_buf != nullptr) return true;
    if (psramFound()) {
      _buf = (float*)ps_malloc(_cap * sizeof(float));
      if (_buf != nullptr) _inPsram = true;
    }
    if (_buf == nullptr) {
      _buf = (float*)malloc(_cap * sizeof(float));
      _inPsram = false;
    }
    _count = 0;
    _head = 0;
    _hasEstimate = false;
    return _buf != nullptr;
  }

  bool isUsingPsram() const { return _inPsram; }

  void reset() {
    _count = 0;
    _head = 0;
    _hasEstimate = false;
    _kalmanErr = 1.0f;
  }

  float pushAndFilter(float sample) {
    if (isnan(sample) || _buf == nullptr) return sample;

    _buf[_head] = sample;
    _head = (_head + 1) % _cap;
    if (_count < _cap) _count++;

    // Copy active window and sort (insertion sort fast for N <= 64)
    float tmp[64];
    size_t n = _count > 64 ? 64 : _count;
    for (size_t i = 0; i < n; i++) {
      size_t idx = (_head + _cap - n + i) % _cap;
      tmp[i] = _buf[idx];
    }
    for (size_t i = 1; i < n; i++) {
      float key = tmp[i];
      int j = (int)i - 1;
      while (j >= 0 && tmp[j] > key) {
        tmp[j + 1] = tmp[j];
        j--;
      }
      tmp[j + 1] = key;
    }

    // Interquartile trimmed mean around median to reject spikes & 50Hz hum
    size_t trim = n >= 8 ? (n / 4) : 0;
    float sum = 0.0f;
    size_t used = 0;
    for (size_t i = trim; i < n - trim; i++) {
      sum += tmp[i];
      used++;
    }
    float medianMean = used > 0 ? (sum / (float)used) : sample;

    // 1D Kalman update
    if (!_hasEstimate) {
      _kalmanEst = medianMean;
      _kalmanErr = _measNoise;
      _hasEstimate = true;
      return _kalmanEst;
    }
    float predErr = _kalmanErr + _procNoise;
    float gain = predErr / (predErr + _measNoise);
    _kalmanEst = _kalmanEst + gain * (medianMean - _kalmanEst);
    _kalmanErr = (1.0f - gain) * predErr;
    return _kalmanEst;
  }
};

// ============================================================================
// 3. COULOMB COUNTING (Wh) & 3S2P LI-ION RUNTIME PREDICTOR
// ============================================================================
// Baterai rakitan 3S2P Li-ion 18650:
// - Rentang tegangan: 9.6V (0%) s/d 12.6V (100%), nominal ~11.1V
// - Kapasitas energi nominal konservatif: ~44 Wh (mis. 2P ~4000mAh @ 11.1V)
class CoulombEnergyMeter {
private:
  Preferences _prefs;
  bool _prefsReady = false;
  float _solarWh = 0.0f;
  float _battUsedWh = 0.0f;
  float _usableCapWh = 44.0f;
  float _remainingWh = NAN;
  float _avgLoadWatts = 1.2f;
  bool _socInitialized = false;
  unsigned long _lastPersistMs = 0;

  static float voltageToSoc3S(float v) {
    const float minV = 9.60f;
    const float maxV = 12.60f;
    float soc = (v - minV) / (maxV - minV);
    if (soc < 0.0f) soc = 0.0f;
    if (soc > 1.0f) soc = 1.0f;
    return soc;
  }

public:
  void begin(float nominalPackWh = 44.0f) {
    _usableCapWh = nominalPackWh;
    if (_prefs.begin("energy_nvs", false)) {
      _prefsReady = true;
      _solarWh = _prefs.getFloat("solar_wh", 0.0f);
      _battUsedWh = _prefs.getFloat("batt_wh", 0.0f);
    }
  }

  void update(bool solarOk, float solarV, float solarP,
              bool battOk, float battV, float battI, float battP,
              float dtSec) {
    if (dtSec <= 0.0f || dtSec > 10.0f) return;
    float dtHours = dtSec / 3600.0f;

    if (solarOk && !isnan(solarP) && solarP > 0.01f) {
      _solarWh += solarP * dtHours;
    }

    if (battOk && !isnan(battV) && !isnan(battP)) {
      if (!_socInitialized) {
        _remainingWh = voltageToSoc3S(battV) * _usableCapWh;
        _socInitialized = true;
      }

      bool isCharging = (!isnan(solarV) && solarV > battV + 0.4f && solarP > 0.2f) ||
                        (!isnan(battI) && battI < -0.02f);

      float absPower = fabs(battP);
      if (!isCharging && absPower > 0.02f) {
        _battUsedWh += absPower * dtHours;
        _remainingWh -= absPower * dtHours;
        _avgLoadWatts = 0.98f * _avgLoadWatts + 0.02f * absPower;
      } else if (isCharging && absPower > 0.02f) {
        _remainingWh += absPower * dtHours * 0.92f; // efisiensi charge Li-ion
      }

      // Koreksi lembut drift Coulomb terhadap tegangan penuh / habis 3S Li-ion
      if (battV >= 12.52f) {
        _remainingWh = _usableCapWh;
      } else if (battV <= 9.65f) {
        _remainingWh = 0.0f;
      } else {
        float vWh = voltageToSoc3S(battV) * _usableCapWh;
        _remainingWh = 0.9995f * _remainingWh + 0.0005f * vWh;
      }

      if (_remainingWh < 0.0f) _remainingWh = 0.0f;
      if (_remainingWh > _usableCapWh) _remainingWh = _usableCapWh;
    }

    // Simpan ke NVS tiap 5 menit agar awet & tidak hilang saat reboot
    if (_prefsReady && (millis() - _lastPersistMs >= 300000UL)) {
      _lastPersistMs = millis();
      _prefs.putFloat("solar_wh", _solarWh);
      _prefs.putFloat("batt_wh", _battUsedWh);
    }
  }

  float getSolarEnergyWh(bool solarOk) const {
    return solarOk ? _solarWh : NAN;
  }

  float getBatteryEnergyWh(bool battOk) const {
    return battOk ? _battUsedWh : NAN;
  }

  float getRemainingHours(bool battOk) const {
    if (!battOk || !_socInitialized || isnan(_remainingWh)) return NAN;
    float loadW = _avgLoadWatts < 0.25f ? 0.25f : _avgLoadWatts;
    float hrs = _remainingWh / loadW;
    if (hrs > 999.0f) hrs = 999.0f;
    return hrs;
  }

  void resetCounters() {
    _solarWh = 0.0f;
    _battUsedWh = 0.0f;
    if (_prefsReady) {
      _prefs.putFloat("solar_wh", 0.0f);
      _prefs.putFloat("batt_wh", 0.0f);
    }
  }
};

// Mode Hemat Daya dihapus agar ESP32-S3 selalu mengirim data real-time penuh (240 MHz tanpa jeda 5-10 menit)
#endif
