# Smart Soil Monitoring IoT

Aplikasi web profesional bergaya **Industrial IoT** untuk memantau kondisi tanah secara *real-time* maupun historis menggunakan **ESP32 DevKit**, **Sensor pH Tanah**, **Sensor DMS**, **DS18B20 Waterproof**, **Modem 4G**, dan **Sistem Tenaga Surya (Panel Surya 10 Wp + SCC PWM + Baterai 12V 7Ah)**.

- **Production Web App**: https://smart-soil-monitoring-iot.vercel.app
- **Default Device ID**: `SOIL-001`
- **Database**: Supabase PostgreSQL

---

## Fitur Utama
- **Responsif & PWA**: Mendukung Android, tablet, dan desktop dengan App Manifest (`/manifest.json`), Service Worker (`/sw.js`), Splash Screen, dan deteksi Offline State.
- **Tiga Kartu Monitoring Utama**:
  1. **Soil pH**: Nilai pH terkini, grafik perubahan, status Asam/Netral/Basa, riwayat pengukuran, waktu terakhir, dan status koneksi sensor.
  2. **Soil Moisture / DMS**: Nilai mentah sensor DMS (`Raw Value`) & persentase kelembapan terkalibrasi (`%`), status Kering/Normal/Basah, riwayat, dan status koneksi.
  3. **Soil Temperature (DS18B20 Waterproof)**: Suhu tanah dalam °C, grafik perubahan, status suhu, riwayat, dan status sensor.
- **Energy Monitoring**: Pemantauan baterai 12V 7Ah dan panel surya 10 Wp tanpa data palsu (menampilkan `Not Available` jika sensor arus/panel surya belum dipasang).
- **Grafik & Riwayat Interaktif**: Filter rentang waktu (`1 jam`, `6 jam`, `24 jam`, `7 hari`, `30 hari`), filter tanggal, tabel riwayat, **Export CSV**, dan **Export PDF**.
- **Sistem Alarm Otomatis**: Evaluasi kondisi alarm dengan batas yang dapat diatur pengguna.
- **Device Management & Driver Sensor Modular**: Pengaturan interval baca/kirim, mode komunikasi sensor pH & DMS sesuai datasheet, dan penguji endpoint `POST /api/v1/telemetry`.
- **Demo Mode vs Live Hardware Mode**: Semua data simulasi berlabel `DEMO` (`is_demo: true`) dan dipisahkan dari data perangkat nyata (`is_demo: false`) di PostgreSQL.

---

## Spesifikasi 10 Komponen Perangkat Keras
1. **ESP32 DevKit V1** (mikrokontroler utama)
2. **Sensor pH Tanah** (arsitektur *Driver Modular* — konfigurasi sesuai datasheet fisik)
3. **Sensor DMS** (arsitektur *Driver Modular* — mendukung `Raw Value` & konversi `%` terkalibrasi)
4. **DS18B20 Waterproof** (sensor suhu tanah digital 1-Wire)
5. **Modem 4G LTE** (koneksi internet lapangan)
6. **Panel Surya 10 Wp**
7. **Solar Charge Controller (SCC) PWM**
8. **Baterai 12V 7Ah**
9. **DC-DC Buck Converter 12V ke 5V** (minimal 2A–3A)
10. **Sekering (Fuse) & Terminal Distribusi Daya**

> **Catatan Penting Hardware:**
> - **Tidak** menggunakan *Capacitive Soil Moisture Sensor* maupun sensor pH cairan *PH-4502C*.
> - **Jangan** mengasumsikan sensor pH tanah menggunakan RS485 atau sensor DMS menggunakan analog/digital sebelum memeriksa *datasheet* unit fisik. Jika sensor belum terpasang/dikonfirmasi, firmware melaporkan status `not_connected`.

---

## Diagram Blok Wiring Keseluruhan

```text
                       SISTEM TENAGA SURYA & DISTRIBUSI DAYA
  ┌───────────────────┐       ┌─────────────────────────┐       ┌──────────────────┐
  │ Panel Surya 10 Wp │──────▶│  Solar Charge Controller│◀─────▶│  Fuse (5A–10A)   │
  │   (PV+ / PV-)     │       │        SCC PWM          │       │  Baterai 12V 7Ah │
  └───────────────────┘       │    [PV] [BATT] [LOAD]   │       └────────┬─────────┘
                              └───────────┬─────────────┘                │ (Jalur Sense 12V)
                                          │ LOAD 12V (+/-)               ▼
                                          ▼                    ┌───────────────────┐
                                  ┌──────────────┐             │ Voltage Divider   │
                                  │  Fuse 3A–5A  │             │ R1=30kΩ, R2=7.5kΩ │
                                  └───────┬──────┘             │ (Rasio 5:1 ≤3.3V) │
                                          ▼                    └─────────┬─────────┘
                            ┌───────────────────────────┐                │
                            │ DC-DC Buck Converter      │                ▼
                            │     12V ──▶ 5V (3A)       │          GPIO 32 (ADC1)
                            └──────┬─────────────┬──────┘                │
                         5V / GND  │             │  5V / GND             │
                    ┌──────────────┘             └──────────────┐        │
                    ▼                                           ▼        ▼
          ┌──────────────────┐                        ┌────────────────────────────┐
          │    Modem 4G      │◀── WiFi / UART2 ──────▶│       ESP32 DevKit V1      │
          │ (MiFi / LTE Mod) │                        │  VIN(5V) | 3.3V | GND      │
          └──────────────────┘                        └──┬──────────┬───────────┬──┘
                                                         │          │           │
                       ┌─────────────────────────────────┘          │           └──────────────────┐
                       ▼                                            ▼                              ▼
           ┌───────────────────────┐                  ┌─────────────────────────┐      ┌───────────────────────┐
           │   DS18B20 Waterproof  │                  │    Sensor pH Tanah      │      │      Sensor DMS       │
           │  Data ──▶ GPIO 4      │                  │  (Driver Modular)       │      │   (Driver Modular)    │
           │  + Pull-up 4.7kΩ 3.3V │                  │  Default: GPIO 34 (ADC) │      │ Default: GPIO 35 (ADC)│
           └───────────────────────┘                  └─────────────────────────┘      └───────────────────────┘
```

---

## 1. Wiring Sistem Tenaga Surya & Distribusi Daya

> **Urutan Pemasangan Wajib SCC PWM:**
> 1. Hubungkan **Baterai 12V 7Ah** ke terminal `BATT` SCC terlebih dahulu (melalui sekering) agar SCC mendeteksi tegangan sistem 12V.
> 2. Setelah layar/LED SCC menyala, hubungkan **Panel Surya 10 Wp** ke terminal `PV`.
> 3. Terakhir, hubungkan jalur beban (**DC-DC 12V→5V**) ke terminal `LOAD`.
> *(Saat melepas, lakukan urutan kebalikannya: lepas Panel Surya dulu, baru Baterai.)*

| Dari Komponen | Ke Komponen | Keterangan & Proteksi |
|---|---|---|
| Panel Surya 10 Wp (`+` / `-`) | SCC PWM Terminal `PV+` / `PV-` | Pastikan polaritas tidak terbalik |
| Baterai 12V 7Ah (`+`) | **Sekering 5A–10A** → SCC `BATT+` | Proteksi arus pendek baterai |
| Baterai 12V 7Ah (`-`) | SCC `BATT-` | Jalur negatif baterai |
| SCC `LOAD+` | **Sekering 3A–5A** → DC-DC `IN+` | Proteksi jalur beban 12V |
| SCC `LOAD-` | DC-DC `IN-` | Jalur negatif beban |
| DC-DC Buck `OUT+` (**5.0V**) | Terminal Distribusi `5V` → `VIN`/`5V` ESP32 & `VCC` Modem 4G | **Ukur dengan multimeter tepat 5.0V** sebelum disambung ke ESP32! |
| DC-DC Buck `OUT-` (`GND`) | Terminal Distribusi `GND` → `GND` ESP32, Modem, & semua sensor | **Common Ground** wajib tersambung |

---

## 2. Wiring Sensor ke ESP32 DevKit

Mapping pin berikut sesuai langsung dengan [esp32_smart_soil.ino](firmware/esp32_smart_soil/esp32_smart_soil.ino) dan [sensor_drivers.h](firmware/esp32_smart_soil/sensor_drivers.h):

### A. DS18B20 Waterproof (Suhu Tanah — 1-Wire)
| Kabel DS18B20 | Pin ESP32 DevKit | Keterangan |
|---|---|---|
| **Merah (`VCC`)** | `3.3V` | Tegangan suplai stabil 3.3V |
| **Hitam (`GND`)** | `GND` | Common Ground |
| **Kuning / Putih (`DATA`)** | `GPIO 4` (`PIN_DS18B20`) | Pasang **resistor pull-up 4.7 kΩ** antara `GPIO 4` dan `3.3V` |

### B. Pembacaan Tegangan Baterai 12V 7Ah (Voltage Divider)
ESP32 ADC hanya menerima tegangan maksimal **3.3V**, sehingga wajib menggunakan pembagi tegangan (**rasio 5:1**) agar tegangan baterai penuh (`13.8V–14.4V`) turun menjadi `~2.76V–2.88V`:

```text
Baterai 12V (+) ──[ R1 = 30 kΩ ]──┬──▶ ESP32 GPIO 32 (PIN_BATT_VOLTAGE)
                                  │
                             [ R2 = 7.5 kΩ ]
                                  │
Baterai 12V (-) ──────────────────┴──▶ ESP32 GND
```

| Titik Koneksi | Pin ESP32 DevKit | Catatan |
|---|---|---|
| Titik tengah `R1 (30 kΩ)` & `R2 (7.5 kΩ)` | `GPIO 32` (`PIN_BATT_VOLTAGE`) | Bisa juga memakai modul *Voltage Sensor 25V* (sudah berisi 30kΩ + 7.5kΩ) |
| Kaki bawah `R2` | `GND` | Wajib satu ground dengan ESP32 |

### C. Sensor pH Tanah (Modular Driver — `PIN_SOIL_PH`)
Karena arsitektur memakai **Driver Sensor Modular** (`PH_MODE_PENDING_DATASHEET` secara default), sesuaikan wiring setelah memeriksa *datasheet* sensor pH tanah fisik Anda:

| Mode Datasheet | Koneksi ke ESP32 DevKit | Keterangan |
|---|---|---|
| **Mode Analog ADC** (`PH_MODE_ANALOG_ADC`) | `Signal/AO` → `GPIO 34`, `VCC` → `3.3V/5V`* , `GND` → `GND` | *Jika output analog sensor >3.3V, gunakan pembagi tegangan agar tidak melebihi 3.3V |
| **Mode RS485 Modbus** (`PH_MODE_RS485_MODBUS`) | Modul TTL-to-RS485: `RO` → `GPIO 16 (RX2)`, `DI` → `GPIO 17 (TX2)`, `DE/RE` → `GPIO 25` | Sambungkan kabel `A`/`B` sensor ke terminal `A`/`B` modul RS485 |
| **Mode UART TTL** (`PH_MODE_UART`) | `TX Sensor` → `GPIO 16 (RX2)`, `RX Sensor` → `GPIO 17 (TX2)` | Sesuaikan *level shifter* jika sensor 5V |

### D. Sensor DMS Kelembapan Tanah (Modular Driver — `PIN_SOIL_DMS`)
Sesuaikan wiring setelah konfirmasi *datasheet* sensor DMS fisik Anda:

| Mode Datasheet | Koneksi ke ESP32 DevKit | Keterangan |
|---|---|---|
| **Mode Analog ADC** (`DMS_MODE_ANALOG_ADC`) | `Signal/AO` → `GPIO 35`, `VCC` → `3.3V/5V`*, `GND` → `GND` | Default firmware memakai `GPIO 35`; mendukung `Raw Value` & kalibrasi `%` |
| **Mode Digital GPIO** (`DMS_MODE_DIGITAL_GPIO`) | `DO` → `GPIO 35` (atau GPIO input lain), `GND` → `GND` | Sesuaikan level logika 3.3V |
| **Mode RS485 Modbus** (`DMS_MODE_RS485_MODBUS`) | Paralel pada bus RS485 `A`/`B` (alamat Modbus berbeda dari sensor pH) | Berbagi `UART2` (`GPIO 16/17`) |

> **Catatan Pin ESP32**: `GPIO 34` dan `GPIO 35` adalah pin **Input-Only (ADC1)** yang tetap bekerja akurat saat WiFi aktif (berbeda dengan ADC2 yang bentrok dengan WiFi).

---

## 3. Wiring & Koneksi Modem 4G LTE

Tersedia dua skenario penggunaan Modem 4G:

1. **Modem 4G Router / MiFi (Default di Firmware)**
   - **Daya**: Ambil jalur `5V` (minimal 2A) dari output **DC-DC Buck Converter 12V→5V** ke port daya USB/5V Modem 4G.
   - **Data**: ESP32 terhubung secara nirkabel via WiFi ke Access Point Modem 4G (`MODEM_AP_SSID` & `MODEM_AP_PASS`).
2. **Modul Modem 4G Serial/UART (mis. SIM7600 / A7670)**
   - `VCC Modem` → Output **DC-DC Buck 5V (≥2A)** *(jangan mengambil daya dari pin `3.3V` ESP32)*.
   - `GND Modem` → `GND` ESP32 (*Common Ground*).
   - `TX Modem` → `GPIO 16 (RX2)` ESP32.
   - `RX Modem` → `GPIO 17 (TX2)` ESP32.

---

## 4. Cara Upload Firmware ke ESP32

File firmware berada di folder `firmware/esp32_smart_soil/`:
- `firmware/esp32_smart_soil/esp32_smart_soil.ino`
- `firmware/esp32_smart_soil/sensor_drivers.h`

### Langkah 1 — Siapkan Software & Driver
1. Unduh dan instal **Arduino IDE 2.x** dari https://www.arduino.cc/en/software.
2. Instal driver USB-to-Serial sesuai chip pada board ESP32 DevKit Anda:
   - **CP2102** (Silicon Labs CP210x VCP Driver) atau **CH340/CH341** Driver.
3. Buka Arduino IDE → **File → Preferences** → pada kolom **Additional Boards Manager URLs**, tambahkan:
   ```text
   https://espressif.github.io/arduino-esp32/package_esp32_index.json
   ```
4. Buka **Tools → Board → Boards Manager...**, cari **`esp32`** (*by Espressif Systems*), lalu klik **Install**.
5. *(Opsional untuk DS18B20 fisik)* Buka **Tools → Manage Libraries...**, instal library **`OneWire`** (*by Paul Stoffregen*) dan **`DallasTemperature`** (*by Miles Burton*).

### Langkah 2 — Konfigurasi Firmware
1. Buka file `firmware/esp32_smart_soil/esp32_smart_soil.ino` di Arduino IDE (pastikan `sensor_drivers.h` berada dalam folder yang sama).
2. Sesuaikan konfigurasi berikut di bagian atas `esp32_smart_soil.ino`:
   ```cpp
   const char* DEVICE_ID      = "SOIL-001";
   const char* API_KEY        = "sk_soil_001_esp32_4g_key_2026";
   const char* API_ENDPOINT   = "https://smart-soil-monitoring-iot.vercel.app/api/v1/telemetry";

   const char* MODEM_AP_SSID  = "NAMA_WIFI_MODEM_4G_ANDA";
   const char* MODEM_AP_PASS  = "PASSWORD_MODEM_4G_ANDA";
   ```
3. Setelah *datasheet* sensor pH tanah dan DMS dikonfirmasi, ubah mode driver dari `*_PENDING_DATASHEET` ke mode yang sesuai (misalnya `PH_MODE_ANALOG_ADC` / `DMS_MODE_ANALOG_ADC`) serta nilai kalibrasi `_rawDry` dan `_rawWet`.

### Langkah 3 — Pilih Board, Port, & Upload
1. Sambungkan ESP32 DevKit ke laptop menggunakan **kabel micro-USB/USB-C data** *(pastikan bukan kabel charger saja)*.
2. Pilih pengaturan berikut di menu **Tools**:
   - **Board**: `DOIT ESP32 DEVKIT V1` (atau `ESP32 Dev Module`)
   - **Upload Speed**: `115200` (atau `921600`)
   - **Port**: Pilih port `COMx` yang muncul untuk ESP32 Anda.
3. Klik tombol **Upload (`→`)**.
   > **Tips**: Jika di konsol muncul `Connecting........_____` dan tidak segera masuk proses upload, **tekan dan tahan tombol `BOOT`** pada board ESP32 selama 2–3 detik hingga tulisan `Writing at 0x000...` muncul, lalu lepaskan.

### Langkah 4 — Verifikasi di Serial Monitor & Dashboard Web
1. Buka **Tools → Serial Monitor**, atur baud rate ke **`115200`**.
2. Tekan tombol **EN / RST** pada ESP32. Anda akan melihat log koneksi ke Modem 4G, JSON payload telemetri, dan respons `[HTTP POST] Status code: 200` / `201`.
3. Buka web **Smart Soil Monitoring IoT**, matikan **Demo Mode** (alih ke **LIVE HARDWARE**), dan data real-time perangkat `SOIL-001` akan langsung tampil di dashboard.

---

## Menjalankan Aplikasi Web Secara Lokal
```bash
npm install
npm run dev
```
Lalu buka `http://localhost:3000` di browser.
