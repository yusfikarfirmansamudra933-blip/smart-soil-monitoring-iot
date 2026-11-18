# Smart Soil Monitoring IoT

Aplikasi web profesional bergaya **Industrial IoT** untuk memantau kondisi tanah menggunakan **ESP32 DevKit**, **Sensor pH Tanah**, **Sensor DMS**, **DS18B20 Waterproof**, **Modem 4G**, dan **Sistem Tenaga Surya (Panel Surya 10 Wp + SCC PWM + Baterai 12V 7Ah)**.

## Fitur Utama
- **Responsif & PWA**: Mendukung Android, tablet, dan desktop dengan App Manifest (`/manifest.json`), Service Worker (`/sw.js`), Splash Screen, dan deteksi Offline State.
- **Tiga Kartu Monitoring Utama**:
  1. **Soil pH**: Nilai pH terkini, grafik perubahan, status Asam/Netral/Basa, riwayat pengukuran, waktu terakhir, dan status koneksi sensor.
  2. **Soil Moisture / DMS**: Nilai mentah sensor DMS (`Raw Value`) & persentase kelembapan terkalibrasi (`%`), status Kering/Normal/Basah, riwayat, dan status koneksi.
  3. **Soil Temperature (DS18B20 Waterproof)**: Suhu tanah dalam °C, grafik perubahan, status suhu, riwayat, dan status sensor.
- **Energy Monitoring**: Pemantauan baterai 12V 7Ah dan panel surya 10 Wp tanpa data palsu (menampilkan `Not Available` jika sensor arus/panel surya belum dipasang).
- **Grafik & Riwayat Interaktif**: Filter rentang waktu (`1 jam`, `6 jam`, `24 jam`, `7 hari`, `30 hari`), filter tanggal, tabel riwayat, **Export CSV**, dan **Export PDF**.
- **Sistem Alarm Otomatis**: Evaluasi 9 kondisi alarm dengan batas yang dapat diatur pengguna.
- **Device Management & Driver Sensor Modular**: Pengaturan interval baca/kirim, mode komunikasi sensor pH & DMS sesuai datasheet, dan penguji endpoint `POST /api/v1/telemetry`.
- **Demo Mode vs Live Hardware Mode**: Semua data simulasi berlabel `DEMO` dan dipisahkan dari data perangkat nyata di PostgreSQL (Supabase).

## Menjalankan Proyek
```bash
npm install
npm run dev
```
