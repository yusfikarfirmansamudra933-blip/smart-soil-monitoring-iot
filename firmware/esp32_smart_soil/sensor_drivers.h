#ifndef SMART_SOIL_SENSOR_DRIVERS_H
#define SMART_SOIL_SENSOR_DRIVERS_H

#include <Arduino.h>

// ============================================================================
// MODULAR SENSOR DRIVER ARCHITECTURE — SMART SOIL MONITORING IoT (ESP32-S3 N16R8)
// ============================================================================
// Mendukung:
// 1. Sensor pH Tanah Output Analog ADC (+ opsi RS485/UART modular)
// 2. Sensor DMS (Raw Data & kalibrasi %)
// 3. Capacitive Soil Moisture Sensor (ADC1 terkalibrasi)
// 4. DS18B20 Waterproof (1-Wire)
// 5. Jika sensor belum terhubung, laporkan "not_connected".
// ============================================================================

enum PhInterfaceMode {
  PH_MODE_PENDING_DATASHEET = 0,
  PH_MODE_ANALOG_ADC = 1,
  PH_MODE_RS485_MODBUS = 2,
  PH_MODE_UART = 3
};

enum DmsInterfaceMode {
  DMS_MODE_PENDING_DATASHEET = 0,
  DMS_MODE_ANALOG_ADC = 1,
  DMS_MODE_DIGITAL_GPIO = 2,
  DMS_MODE_RS485_MODBUS = 3
};

struct SoilPhReading {
  bool connected;
  float phValue;
  int rawValue;
  const char* status; // "online" | "not_connected" | "uncalibrated"
};

struct SoilDmsReading {
  bool connected;
  bool calibrated;
  float moisturePercent;
  int rawValue;
  const char* status; // "online" | "not_connected" | "uncalibrated"
};

struct SoilTempReading {
  bool connected;
  float temperatureC;
  const char* status; // "online" | "not_connected"
};

// Deteksi pin analog mengambang (tidak terpasang sensor) via pull-down vs pull-up
inline bool isAnalogPinFloating(uint8_t pin) {
  pinMode(pin, INPUT_PULLDOWN);
  delay(2);
  int lowVal = analogRead(pin);
  pinMode(pin, INPUT_PULLUP);
  delay(2);
  int highVal = analogRead(pin);
  pinMode(pin, INPUT);
  delay(1);
  return (highVal - lowVal) > 1500;
}

class ModularSoilPhDriver {
private:
  PhInterfaceMode _mode;
  uint8_t _pinOrPort;
  float _calOffset;

public:
  ModularSoilPhDriver(PhInterfaceMode mode, uint8_t pinOrPort, float calOffset = 0.0f)
    : _mode(mode), _pinOrPort(pinOrPort), _calOffset(calOffset) {}

  void begin() {
    if (_mode == PH_MODE_ANALOG_ADC) {
      pinMode(_pinOrPort, INPUT);
    }
  }

  void setCalibrationOffset(float offset) { _calOffset = offset; }
  float getCalibrationOffset() const { return _calOffset; }

  SoilPhReading read() {
    SoilPhReading res = { false, NAN, 0, "not_connected" };
    if (_mode == PH_MODE_PENDING_DATASHEET) {
      // Menunggu konfirmasi datasheet sensor pH tanah pada foto produk
      return res;
    }
    if (_mode == PH_MODE_ANALOG_ADC) {
      if (isAnalogPinFloating(_pinOrPort)) {
        return res; // Pin mengambang / sensor belum terpasang
      }
      int raw = analogRead(_pinOrPort);
      if (raw <= 5 || raw >= 4090) {
        return res; // Open circuit / not connected
      }
      res.connected = true;
      res.rawValue = raw;
      float voltage = (raw / 4095.0f) * 3.3f;
      res.phValue = (voltage * 3.5f) + _calOffset;
      res.status = "online";
      return res;
    }
    // Mode RS485 / UART siap diaktifkan setelah register/baudrate datasheet dikonfirmasi
    return res;
  }
};

class ModularSoilDmsDriver {
private:
  DmsInterfaceMode _mode;
  uint8_t _pin;
  bool _calibrated;
  int _rawDry;
  int _rawWet;

public:
  ModularSoilDmsDriver(DmsInterfaceMode mode, uint8_t pin, bool calibrated = false, int rawDry = 3200, int rawWet = 1400)
    : _mode(mode), _pin(pin), _calibrated(calibrated), _rawDry(rawDry), _rawWet(rawWet) {}

  void begin() {
    if (_mode == DMS_MODE_ANALOG_ADC || _mode == DMS_MODE_DIGITAL_GPIO) {
      pinMode(_pin, INPUT);
    }
  }

  SoilDmsReading read() {
    SoilDmsReading res = { false, _calibrated, NAN, 0, "not_connected" };
    if (_mode == DMS_MODE_PENDING_DATASHEET) {
      return res;
    }
    if (_mode == DMS_MODE_ANALOG_ADC) {
      if (isAnalogPinFloating(_pin)) {
        return res; // Pin mengambang / sensor DMS belum terpasang
      }
      int raw = analogRead(_pin);
      if (raw <= 5 || raw >= 4090) {
        return res;
      }
      res.connected = true;
      res.rawValue = raw;
      if (_calibrated && (_rawDry != _rawWet)) {
        float pct = ((float)(_rawDry - raw) / (float)(_rawDry - _rawWet)) * 100.0f;
        res.moisturePercent = constrain(pct, 0.0f, 100.0f);
        res.status = "online";
      } else {
        res.moisturePercent = NAN; // Kirim raw data sampai kalibrasi selesai
        res.status = "uncalibrated";
      }
      return res;
    }
    if (_mode == DMS_MODE_DIGITAL_GPIO) {
      int state = digitalRead(_pin);
      res.connected = true;
      res.rawValue = state;
      res.status = _calibrated ? "online" : "uncalibrated";
      return res;
    }
    return res;
  }
};

class CapacitiveMoistureDriver {
private:
  uint8_t _pin;
  int _rawDry;
  int _rawWet;

public:
  CapacitiveMoistureDriver(uint8_t pin, int rawDry = 2950, int rawWet = 1250)
    : _pin(pin), _rawDry(rawDry), _rawWet(rawWet) {}

  void begin() {
    pinMode(_pin, INPUT);
  }

  void setCalibrationBounds(int rawDry, int rawWet) {
    _rawDry = rawDry;
    _rawWet = rawWet;
  }
  int getRawDry() const { return _rawDry; }
  int getRawWet() const { return _rawWet; }

  SoilDmsReading read() {
    SoilDmsReading res = { false, true, NAN, 0, "not_connected" };
    if (isAnalogPinFloating(_pin)) {
      return res; // Pin mengambang / sensor belum terpasang
    }
    int raw = analogRead(_pin);
    if (raw <= 20 || raw >= 4085) {
      return res; // Open circuit / sensor tidak terpasang
    }
    res.connected = true;
    res.rawValue = raw;
    float pct = ((float)(_rawDry - raw) / (float)(_rawDry - _rawWet)) * 100.0f;
    res.moisturePercent = constrain(pct, 0.0f, 100.0f);
    res.status = "online";
    return res;
  }
};

#endif
