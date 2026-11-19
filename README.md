# Smart Soil Monitoring IoT

Aplikasi web profesional bergaya **Industrial IoT** untuk memantau kondisi tanah, energi tenaga surya, dan status pulsa modem secara *real-time* maupun historis menggunakan **ESP32-S3 N16R8**, **2× Sensor Arus & Tegangan DC INA226**, **Solar Charge Controller MPPT CN3791**, **Active Buzzer (Alarm Sisa Pulsa Modem 4G)**, **DS18B20 Waterproof**, **Capacitive Soil Moisture Sensor**, **Sensor pH Tanah Output Analog ADC + DMS**, dan **Modem 4G LTE**.

- **Production Web App**: https://smart-soil-monitoring-iot.vercel.app
- **Default Device ID**: `SOIL-001`
- **Database**: Supabase PostgreSQL

---

## Fitur Utama
- **Responsif & PWA**: Mendukung Android, tablet, dan desktop dengan App Manifest (`/manifest.json`), Service Worker (`/sw.js`), Splash Screen, dan deteksi Offline State.
- **Monitoring Tanah Real-Time**:
  1. **Soil pH (Analog ADC + DMS)**: Nilai pH terkini, grafik perubahan, status Asam/Netral/Basa, riwayat pengukuran, dan status koneksi sensor.
  2. **Soil Moisture (Capacitive Soil Moisture + DMS)**: Pembacaan kelembapan terkalibrasi (`%`) & nilai mentah (`Raw Value`), status Kering/Normal/Basah, riwayat, dan status koneksi.
  3. **Soil Temperature (DS18B20 Waterproof)**: Suhu tanah dalam °C, grafik perubahan, status suhu, riwayat, dan status sensor.
- **Dual-Channel Energy Monitoring (2× INA226 + CN3791 MPPT)**:
  - **INA226 #1 (`0x40`)**: Memantau **Tegangan (V), Arus (A), dan Daya (W) Panel Surya** secara real-time.
  - **INA226 #2 (`0x41`)**: Memantau **Tegangan (V), Arus (A), dan Daya (W) Baterai** secara real-time.
  - Tidak membuat data energi palsu (menampilkan `Not Available` jika INA226 belum terdeteksi).
- **Fitur Peringatan Pulsa Modem 4G + Active Buzzer**:
  - Memantau sisa pulsa Modem 4G (`modem_credit_rp`) dan otomatis membunyikan **Active Buzzer (`GPIO 21`)** serta memicu alarm kritis di dashboard saat pulsa turun di bawah ambang batas (default `< Rp 10.000`).
- **Grafik & Riwayat Interaktif**: Filter rentang waktu (`1 jam`, `6 jam`, `24 jam`, `7 hari`, `30 hari`), filter tanggal, tabel riwayat, **Export CSV**, dan **Export PDF**.
- **Sistem Alarm Otomatis (10 Parameter)**: Evaluasi otomatis pH, kelembapan, suhu, tegangan baterai, status ESP32-S3, koneksi sensor, modem 4G, dan **sisa pulsa modem (Active Buzzer)**.
- **Demo Mode vs Live Hardware Mode**: Semua data simulasi berlabel `DEMO` (`is_demo: true`) dan dipisahkan dari data perangkat nyata (`is_demo: false`) di PostgreSQL.

---

## Komponen Utama Perangkat Keras
1. **ESP32-S3 N16R8** — Otak utama (Dual-core, 16MB Flash, 8MB OPI PSRAM, I2C, ADC1, UART).
2. **2× Sensor Arus & Tegangan DC INA226** — 16-bit I2C bidirectional monitor (`0x40` untuk **Panel Surya**, `0x41` untuk **Baterai**).
3. **CN3791** — MPPT Solar Charge Controller untuk pengisian baterai efisien dari panel surya.
4. **Active Buzzer** — Alarm suara lokal ketika sisa pulsa Modem 4G menipis.
5. **DS18B20 Waterproof** — Sensor suhu tanah digital tahan air (1-Wire).
6. **Capacitive Soil Moisture Sensor** — Sensor kelembapan tanah kapasitif anti-korosi.
7. **Sensor pH Tanah Output Analog ADC + DMS** — Arsitektur *Driver Sensor Modular*.
8. **Modem 4G LTE** — Koneksi internet lapangan & pembacaan status pulsa.
9. **Panel Surya & Baterai** — Sumber daya mandiri 24 jam.
10. **DC-DC Converter 5V, Sekering (Fuse), & Distribusi Daya**.

---

## Diagram Blok Wiring Keseluruhan

```text
                SISTEM TENAGA SURYA, CN3791 MPPT & 2× INA226
  ┌─────────────────┐     ┌──────────────────────┐     ┌───────────────────────┐
  │   Panel Surya   │────▶│  INA226 #1 (0x40)    │────▶│  CN3791 MPPT Charger  │
  │    (PV+ / PV-)  │     │  (Ukur V, A, W PV)   │     │  [IN+ / IN-]          │
  └─────────────────┘     └──────────┬───────────┘     │  [BAT+ / BAT-]        │
                                     │ I2C (SDA/SCL)   └───────────┬───────────┘
                                     │                             ▼
                                     │                 ┌───────────────────────┐
                                     │                 │  INA226 #2 (0x41)     │
                                     │                 │  (Ukur V, A, W Batt)  │
                                     │                 └─────┬───────────┬─────┘
                                     │ I2C (GPIO 8/9)        │ I2C       │ Fuse
                                     └───────────────────────┘           ▼
                                                               ┌───────────────────┐
                                                               │ Baterai + DC-DC   │
                                                               │ Regulasi 5V Stabil│
                                                               └────┬─────────┬────┘
                                                            5V/GND  │         │ 5V/GND
                                                     ┌──────────────┘         └──────────────┐
                                                     ▼                                       ▼
                                           ┌──────────────────┐                    ┌─────────────────────────────┐
                                           │    Modem 4G      │◀─ WiFi / UART2 ───▶│       ESP32-S3 N16R8        │
                                           │  (Cek Pulsa+Net) │  (GPIO 17 / 18)    │  5V | 3.3V | GND | I2C 8/9  │
                                           └──────────────────┘                    └─┬──────┬──────┬──────┬──────┘
                                                                                     │      │      │      │
                ┌────────────────────────────────────────────────────────────────────┘      │      │      └──────────────────┐
                ▼                                 ▼                                         ▼                                ▼
    ┌───────────────────────┐         ┌────────────────────────┐               ┌──────────────────────────┐      ┌──────────────────────┐
    │   DS18B20 Waterproof  │         │ Capacitive Soil Moist. │               │  pH Analog ADC + DMS     │      │    Active Buzzer     │
    │  DATA ──▶ GPIO 4      │         │   AOUT ──▶ GPIO 5      │               │ pH ──▶ GPIO 6 (ADC1)     │      │  SIG ──▶ GPIO 21     │
    │  + Pull-up 4.7kΩ 3.3V │         │   VCC ──▶ 3.3V         │               │ DMS ──▶ GPIO 7 (ADC1)    │      │ (Alarm Pulsa Menipis)│
    └───────────────────────┘         └────────────────────────┘               └──────────────────────────┘      └──────────────────────┘
```

---

## 1. Wiring Tenaga Surya, CN3791 MPPT & 2× INA226

### A. Jalur Daya Utama (High-Side Current Sensing)
| Dari Komponen | Ke Komponen | Keterangan |
|---|---|---|
| Panel Surya (`PV+`) | **INA226 #1 (`0x40`)** `VIN+` | Jalur positif panel masuk ke shunt INA226 #1 |
| **INA226 #1 (`0x40`)** `VIN-` | **CN3791** Terminal `IN+` (`PV+`) | Arus panel terukur sebelum masuk ke CN3791 |
| Panel Surya (`PV-`) | **CN3791** `IN-` (`GND`) | Satukan ke Common Ground (`GND`) |
| **CN3791** Terminal `BAT+` | **INA226 #2 (`0x41`)** `VIN+` | Jalur pengisian/pemakaian baterai masuk ke shunt INA226 #2 |
| **INA226 #2 (`0x41`)** `VIN-` | **Sekering (Fuse)** → Baterai (`+`) & Input DC-DC 5V | Mengukur tegangan, arus charge (+), dan arus discharge (-) baterai |
| Baterai (`-`) | **CN3791** `BAT-` (`GND`) & Common Ground | Semua `GND` (CN3791, 2× INA226, ESP32-S3, Modem 4G) wajib tersambung |
| Output DC-DC 5V (`5V` / `GND`) | Pin `5V` ESP32-S3 N16R8 & Daya `5V` Modem 4G | Pastikan output stabil **5.0V (≥ 2A)** sebelum disambung |

### B. Wiring I2C & Alamat 2× INA226 ke ESP32-S3 N16R8
Agar kedua sensor INA226 dapat berjalan bersamaan pada satu bus I2C tanpa bentrok alamat:

| Pin INA226 | INA226 #1 — Panel Surya (`0x40`) | INA226 #2 — Baterai (`0x41`) |
|---|---|---|
| `VCC` | `3.3V` ESP32-S3 | `3.3V` ESP32-S3 |
| `GND` | `GND` ESP32-S3 | `GND` ESP32-S3 |
| `SDA` | `GPIO 8` ESP32-S3 | `GPIO 8` ESP32-S3 *(paralel)* |
| `SCL` | `GPIO 9` ESP32-S3 | `GPIO 9` ESP32-S3 *(paralel)* |
| `A0` | Sambung ke `GND` | Sambung ke `3.3V` (`VS`) → alamat menjadi **`0x41`** |
| `A1` | Sambung ke `GND` | Sambung ke `GND` |
| `VBUS` | Sambung ke `VIN+` (PV+) | Sambung ke `VIN+` (BAT+) |

---

## 2. Wiring Sensor Tanah, Active Buzzer & Modem 4G ke ESP32-S3 N16R8

> **PERINGATAN PIN ESP32-S3 N16R8:**
> Pada varian **N16R8 (Octal OPI PSRAM)**, **`GPIO 35`, `GPIO 36`, dan `GPIO 37` digunakan internal oleh PSRAM** dan **TIDAK BOLEH** dipakai untuk sensor. Semua pin di bawah ini 100% aman dan berada di `ADC1` (tidak bentrok dengan WiFi).

| Komponen | Pin Modul | Pin ESP32-S3 N16R8 | Keterangan |
|---|---|---|---|
| **DS18B20 Waterproof** | `VCC` (Merah) / `GND` (Hitam) / `DATA` (Kuning) | `3.3V` / `GND` / **`GPIO 4`** | Wajib pasang resistor **pull-up 4.7 kΩ** antara `GPIO 4` dan `3.3V` |
| **Capacitive Soil Moisture** | `VCC` / `GND` / `AOUT` | `3.3V` / `GND` / **`GPIO 5`** | `ADC1_CH4` — gunakan suplai 3.3V agar output ≤3.3V |
| **Sensor pH Tanah (Analog ADC)** | `VCC` / `GND` / `AOUT` | `3.3V` atau `5V`* / `GND` / **`GPIO 6`** | `ADC1_CH5` — *jika output analog >3.3V, gunakan pembagi tegangan* |
| **Sensor DMS** | `VCC` / `GND` / `OUT` | `3.3V` / `GND` / **`GPIO 7`** | `ADC1_CH6` — pembacaan `Raw Value` + kalibrasi `%` |
| **Active Buzzer (Alarm Pulsa)** | `VCC / (+)` / `GND / (-)` | **`GPIO 21`** / `GND` | Untuk buzzer 3.3V langsung ke `GPIO 21`; untuk buzzer 5V gunakan modul buzzer 3-pin (VCC 5V, GND, I/O → `GPIO 21`) atau transistor NPN S8050 + resistor 1 kΩ |
| **Modem 4G (Opsional UART2)** | `TX` / `RX` / `VCC 5V` / `GND` | **`GPIO 18 (RX2)`** / **`GPIO 17 (TX2)`** / `5V DC-DC` / `GND` | Untuk cek sisa pulsa via AT Command USSD (`AT+CUSD`) atau koneksi data |

---

## 3. Cara Upload Firmware ke ESP32-S3 N16R8

File firmware berada di folder `firmware/esp32_smart_soil/`:
- [esp32_smart_soil.ino](firmware/esp32_smart_soil/esp32_smart_soil.ino)
- [sensor_drivers.h](firmware/esp32_smart_soil/sensor_drivers.h)

### Langkah 1 — Siapkan Arduino IDE & Library
1. Instal **Arduino IDE 2.x** dari https://www.arduino.cc/en/software.
2. Buka **File → Preferences** → tambahkan URL berikut pada **Additional Boards Manager URLs**:
   ```text
   https://espressif.github.io/arduino-esp32/package_esp32_index.json
   ```
3. Buka **Tools → Board → Boards Manager...**, cari **`esp32`** (*by Espressif Systems*), lalu klik **Install**.
4. Buka **Tools → Manage Libraries...**, lalu instal 3 library wajib berikut:
   - **`INA226_WE`** (*by Wolfgang Ewald*) — untuk 2× sensor arus/tegangan INA226
   - **`OneWire`** (*by Paul Stoffregen*)
   - **`DallasTemperature`** (*by Miles Burton*)

### Langkah 2 — Konfigurasi Firmware
Buka `firmware/esp32_smart_soil/esp32_smart_soil.ino` dan sesuaikan bagian konfigurasi:
```cpp
const char* DEVICE_ID           = "SOIL-001";
const char* API_KEY             = "sk_soil_001_esp32_4g_key_2026";
const char* API_ENDPOINT        = "https://smart-soil-monitoring-iot.vercel.app/api/v1/telemetry";

const char* MODEM_AP_SSID       = "NAMA_WIFI_MODEM_4G_ANDA";
const char* MODEM_AP_PASS       = "PASSWORD_MODEM_4G_ANDA";

const float MODEM_CREDIT_MIN_RP = 10000.0f; // Active Buzzer bunyi jika pulsa < Rp 10.000
```

### Langkah 3 — Pengaturan Board Khusus ESP32-S3 N16R8 & Upload
1. Sambungkan **ESP32-S3 N16R8** ke laptop menggunakan **kabel USB-C data** (colok ke port `USB` atau `UART/COM` di board).
2. Di menu **Tools**, atur persis sesuai spesifikasi **N16R8**:
   - **Board**: `ESP32S3 Dev Module`
   - **Flash Size**: `16MB (128Mb)`
   - **PSRAM**: `OPI PSRAM`
   - **USB CDC On Boot**: `Enabled` *(agar Serial Monitor muncul jika memakai port USB native)*
   - **Upload Speed**: `921600` (atau `115200` jika kurang stabil)
   - **Port**: Pilih port `COMx` ESP32-S3 Anda.
3. Klik tombol **Upload (`→`)**.
   > **Tips Mode Bootloader ESP32-S3**: Jika gagal terhubung, tekan & tahan tombol **`BOOT`**, tekan sebentar tombol **`RST`**, lalu lepaskan **`BOOT`** agar ESP32-S3 masuk mode download, kemudian klik **Upload**.

### Langkah 4 — Verifikasi di Serial Monitor & Dashboard Web
1. Buka **Tools → Serial Monitor** (`115200 baud`).
2. Pastikan muncul log:
   - `[INA226 #1] Panel Surya (0x40) OK`
   - `[INA226 #2] Baterai (0x41) OK`
   - `[TELEMETRY PAYLOAD] {...}` dan `[HTTP POST] Status code: 201`.
3. Buka web **Smart Soil Monitoring IoT** → beralih ke mode **LIVE HARDWARE** → cek menu **Energy Monitoring** (2× INA226), **Soil Monitoring**, dan **Alerts** (termasuk status **Active Buzzer & Pulsa Modem 4G**).

---

## Menjalankan Aplikasi Web Secara Lokal
```bash
npm install
npm run dev
```
Lalu buka `http://localhost:3000` di browser.
