#ifndef SMART_SOIL_MODEM_QUOTA_READER_H
#define SMART_SOIL_MODEM_QUOTA_READER_H

#include <Arduino.h>
#include <HTTPClient.h>
#include <Preferences.h>
#include <WiFi.h>
#include <mbedtls/base64.h>

// ============================================================================
// MODEM 4G SMS QUOTA & CREDIT PARSER (ESP32-S3 N16R8 — Default: ZTE MF90)
// ============================================================================
// Mendukung pembacaan SMS notifikasi kuota/pulsa dari operator Indonesia
// (Telkomsel, Indosat, XL, Axis, Tri, Smartfren) melalui:
// 1. MODEM_SMS_HTTP_ZTE    : MiFi Bolt 4G ZTE MF90 / ZTE WebUI (192.168.1.1 / 192.168.0.1)
// 2. MODEM_SMS_HTTP_HILINK : MiFi/Dongle WiFi Huawei HiLink (192.168.8.1)
// 3. MODEM_SMS_UART_AT     : Modul 4G UART (SIM7600 / A7670 / EC200U) via GPIO 17/18
// ============================================================================

enum ModemSmsSourceMode {
  MODEM_SMS_HTTP_HILINK = 1,
  MODEM_SMS_HTTP_ZTE    = 2,
  MODEM_SMS_UART_AT     = 3
};

class ModemQuotaReader {
private:
  ModemSmsSourceMode _mode;
  String _modemHost;
  String _modemPassword;
  HardwareSerial* _uart;
  Preferences _prefs;

  float _lastQuotaMb = NAN;
  float _lastCreditRp = NAN;

  String resolveHost() const {
    if (_modemHost == "auto" || _modemHost.length() == 0) {
      IPAddress gw = WiFi.gatewayIP();
      if (gw[0] != 0) return gw.toString();
      return "192.168.1.1"; // Default Bolt ZTE MF90
    }
    return _modemHost;
  }

  static int hexVal(char c) {
    if (c >= '0' && c <= '9') return c - '0';
    if (c >= 'a' && c <= 'f') return 10 + (c - 'a');
    if (c >= 'A' && c <= 'F') return 10 + (c - 'A');
    return -1;
  }

  // ZTE MF90 WebUI sering mengembalikan isi SMS dalam format UCS2 Hex (contoh: "0053006900730061...")
  static String decodeZteUcs2HexIfNeeded(const String& input) {
    int len = input.length();
    if (len < 8 || (len % 4) != 0) return input;
    for (int i = 0; i < len; i++) {
      if (hexVal(input[i]) < 0) return input; // Bukan string hex murni
    }
    String out = "";
    out.reserve(len / 4);
    for (int i = 0; i + 3 < len; i += 4) {
      int hi = (hexVal(input[i]) << 4) | hexVal(input[i + 1]);
      int lo = (hexVal(input[i + 2]) << 4) | hexVal(input[i + 3]);
      uint16_t code = (uint16_t)((hi << 8) | lo);
      if (code >= 0x20 && code <= 0x7E) {
        out += (char)code;
      } else if (code == 0x0A || code == 0x0D) {
        out += ' ';
      }
    }
    return out.length() > 0 ? out : input;
  }

  static String toBase64(const String& plain) {
    unsigned char out[96];
    size_t outLen = 0;
    if (mbedtls_base64_encode(out, sizeof(out) - 1, &outLen,
                              (const unsigned char*)plain.c_str(), plain.length()) == 0) {
      out[outLen] = '\0';
      return String((const char*)out);
    }
    return plain;
  }

  // Ekstrak angka desimal pertama yang diikuti satuan MB atau GB setelah kata kunci
  static bool extractNumberWithUnit(const String& lowerText, int startIdx, float& outMb) {
    int len = lowerText.length();
    int limit = min(len, startIdx + 90);
    for (int i = startIdx; i < limit; i++) {
      char c = lowerText[i];
      if (isDigit(c)) {
        String numStr = "";
        int j = i;
        while (j < limit && (isDigit(lowerText[j]) || lowerText[j] == '.' || lowerText[j] == ',')) {
          char ch = lowerText[j];
          numStr += (ch == ',') ? '.' : ch;
          j++;
        }
        while (j < limit && lowerText[j] == ' ') j++;
        if (j + 1 < limit) {
          String unit = lowerText.substring(j, j + 2);
          float val = numStr.toFloat();
          if (unit == "gb") {
            outMb = val * 1024.0f;
            return true;
          }
          if (unit == "mb") {
            outMb = val;
            return true;
          }
          if (unit == "kb") {
            outMb = val / 1024.0f;
            return true;
          }
        }
        i = j;
      }
    }
    return false;
  }

  // Ekstrak nominal rupiah (mis: "Rp 8.500" atau "Rp12500")
  static bool extractRupiah(const String& lowerText, int startIdx, float& outRp) {
    int len = lowerText.length();
    int limit = min(len, startIdx + 70);
    int rpIdx = lowerText.indexOf("rp", startIdx);
    int scanFrom = (rpIdx >= 0 && rpIdx < limit) ? rpIdx + 2 : startIdx;

    for (int i = scanFrom; i < limit; i++) {
      if (isDigit(lowerText[i])) {
        String digits = "";
        int j = i;
        while (j < limit && (isDigit(lowerText[j]) || lowerText[j] == '.')) {
          if (isDigit(lowerText[j])) {
            digits += lowerText[j];
          }
          j++;
        }
        if (digits.length() >= 3) {
          outRp = digits.toFloat();
          return true;
        }
        i = j;
      }
    }
    return false;
  }

  static String extractXmlTag(const String& xml, const String& tag, int fromIdx = 0) {
    String openTag = "<" + tag + ">";
    String closeTag = "</" + tag + ">";
    int a = xml.indexOf(openTag, fromIdx);
    if (a < 0) return "";
    a += openTag.length();
    int b = xml.indexOf(closeTag, a);
    if (b < 0) return "";
    return xml.substring(a, b);
  }

  void saveToNvs() {
    _prefs.begin("soil-modem", false);
    if (!isnan(_lastQuotaMb)) _prefs.putFloat("quota_mb", _lastQuotaMb);
    if (!isnan(_lastCreditRp)) _prefs.putFloat("credit_rp", _lastCreditRp);
    _prefs.end();
  }

  // Login ke ZTE MF90 WebUI (jika WebUI meminta autentikasi) & ambil cookie sesi
  String loginZteWebUi(const String& host) {
    if (_modemPassword.length() == 0) return "";
    HTTPClient http;
    String loginUrl = "http://" + host + "/goform/goform_set_cmd_process";
    const char* headerKeys[] = { "Set-Cookie" };
    http.setTimeout(3500);
    http.collectHeaders(headerKeys, 1);
    if (!http.begin(loginUrl)) return "";

    http.addHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
    http.addHeader("Referer", "http://" + host + "/index.html");
    String body = "isTest=false&goformId=LOGIN&password=" + toBase64(_modemPassword);
    int code = http.POST(body);
    String cookie = "";
    if (code == 200) {
      cookie = http.header("Set-Cookie");
      int semi = cookie.indexOf(';');
      if (semi > 0) cookie = cookie.substring(0, semi);
    }
    http.end();
    return cookie;
  }

  // Metode Utama untuk MiFi Bolt 4G ZTE MF90: Baca SMS Inbox dari ZTE WebUI
  void pollZteSms() {
    String host = resolveHost();
    String cookie = loginZteWebUi(host);

    HTTPClient http;
    String url = "http://" + host + "/goform/goform_get_cmd_process?isTest=false&cmd=sms_data_total&page=0&data_per_page=8&mem_store=1&tags=10&order_by=order+by+id+desc";
    http.setTimeout(4000);
    if (!http.begin(url)) return;
    http.addHeader("Referer", "http://" + host + "/index.html");
    if (cookie.length() > 0) {
      http.addHeader("Cookie", cookie);
    }

    int code = http.GET();
    if (code == 200) {
      String json = http.getString();
      // Cari setiap field "content":"..." dari JSON sms_data_total ZTE MF90
      int cursor = 0;
      bool foundContentField = false;
      while (true) {
        int keyIdx = json.indexOf("\"content\":\"", cursor);
        if (keyIdx < 0) break;
        foundContentField = true;
        int valStart = keyIdx + 11;
        int valEnd = json.indexOf("\"", valStart);
        if (valEnd < 0) break;
        String rawContent = json.substring(valStart, valEnd);
        String decoded = decodeZteUcs2HexIfNeeded(rawContent);
        if (decoded.length() > 0) {
          parseOperatorSms(decoded);
        }
        cursor = valEnd + 1;
      }
      if (!foundContentField && json.length() > 2) {
        parseOperatorSms(json);
      }
    }
    http.end();
  }

  // Metode Alternatif: Baca SMS Inbox dari Modem WiFi Huawei HiLink (192.168.8.1)
  void pollHiLinkSms() {
    String host = (_modemHost == "auto" || _modemHost.length() == 0) ? "192.168.8.1" : _modemHost;
    HTTPClient http;
    String sesUrl = "http://" + host + "/api/webserver/SesTokInfo";
    http.setTimeout(3500);
    if (!http.begin(sesUrl)) return;

    int code = http.GET();
    if (code != 200) {
      http.end();
      return;
    }
    String sesXml = http.getString();
    http.end();

    String sesInfo = extractXmlTag(sesXml, "SesInfo");
    String tokInfo = extractXmlTag(sesXml, "TokInfo");
    if (tokInfo.length() == 0) return;

    String smsUrl = "http://" + host + "/api/sms/sms-list";
    if (!http.begin(smsUrl)) return;
    http.addHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
    if (sesInfo.length() > 0) http.addHeader("Cookie", sesInfo);
    http.addHeader("__RequestVerificationToken", tokInfo);

    String body = "<request><PageIndex>1</PageIndex><ReadCount>5</ReadCount><BoxType>1</BoxType><SortType>0</SortType><Ascending>0</Ascending><UnreadPreferred>1</UnreadPreferred></request>";
    int smsCode = http.POST(body);
    if (smsCode == 200) {
      String smsXml = http.getString();
      int cursor = 0;
      while (true) {
        int msgStart = smsXml.indexOf("<Content>", cursor);
        if (msgStart < 0) break;
        String content = extractXmlTag(smsXml, "Content", msgStart);
        if (content.length() > 0) {
          parseOperatorSms(content);
        }
        cursor = msgStart + 9;
      }
    }
    http.end();
  }

  // Metode Alternatif: Baca SMS via UART2 AT Command (SIM7600 / A7670 / EC200U)
  void pollUartAtSms() {
    if (_uart == nullptr) return;
    while (_uart->available()) _uart->read();
    _uart->println("AT+CMGF=1");
    delay(250);
    while (_uart->available()) _uart->read();

    _uart->println("AT+CMGL=\"ALL\"");
    unsigned long t0 = millis();
    String resp = "";
    while (millis() - t0 < 2000) {
      while (_uart->available()) {
        resp += (char)_uart->read();
      }
    }
    if (resp.length() > 0) {
      parseOperatorSms(resp);
    }
  }

public:
  ModemQuotaReader(
    ModemSmsSourceMode mode,
    const String& modemHost = "auto",
    const String& modemPassword = "admin",
    HardwareSerial* uart = nullptr
  ) : _mode(mode), _modemHost(modemHost), _modemPassword(modemPassword), _uart(uart) {}

  void begin() {
    _prefs.begin("soil-modem", true);
    if (_prefs.isKey("quota_mb")) _lastQuotaMb = _prefs.getFloat("quota_mb", NAN);
    if (_prefs.isKey("credit_rp")) _lastCreditRp = _prefs.getFloat("credit_rp", NAN);
    _prefs.end();
  }

  bool parseOperatorSms(const String& rawSms) {
    String lower = rawSms;
    lower.toLowerCase();
    bool updated = false;

    if (lower.indexOf("kuota") >= 0 && (lower.indexOf("habis") >= 0 || lower.indexOf("0 mb") >= 0 || lower.indexOf("0 gb") >= 0)) {
      _lastQuotaMb = 0.0f;
      updated = true;
    } else {
      const char* quotaKeys[] = { "sisa kuota", "kuota utama", "kuota internet", "kuota data", "kuota anda", "kuota", "tersisa", "remaining" };
      for (const char* k : quotaKeys) {
        int idx = lower.indexOf(k);
        if (idx >= 0) {
          float mb = NAN;
          if (extractNumberWithUnit(lower, idx, mb)) {
            _lastQuotaMb = mb;
            updated = true;
            break;
          }
        }
      }
    }

    const char* creditKeys[] = { "sisa pulsa", "pulsa anda", "pulsa", "saldo" };
    for (const char* k : creditKeys) {
      int idx = lower.indexOf(k);
      if (idx >= 0) {
        float rp = NAN;
        if (extractRupiah(lower, idx, rp)) {
          _lastCreditRp = rp;
          updated = true;
          break;
        }
      }
    }

    if (updated) {
      saveToNvs();
      Serial.printf("[MODEM ZTE MF90 SMS] Parsed -> Sisa Kuota: %.1f MB | Sisa Pulsa: Rp %.0f\n",
                    isnan(_lastQuotaMb) ? -1.0f : _lastQuotaMb,
                    isnan(_lastCreditRp) ? -1.0f : _lastCreditRp);
    }
    return updated;
  }

  void pollModemSms() {
    if (_mode == MODEM_SMS_HTTP_ZTE) {
      pollZteSms();
    } else if (_mode == MODEM_SMS_HTTP_HILINK) {
      pollHiLinkSms();
    } else if (_mode == MODEM_SMS_UART_AT) {
      pollUartAtSms();
    }
  }

  float getQuotaMb() const { return _lastQuotaMb; }
  float getCreditRp() const { return _lastCreditRp; }
};

#endif
