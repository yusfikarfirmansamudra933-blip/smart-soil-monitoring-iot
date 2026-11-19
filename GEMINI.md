# Smart Soil Monitoring IoT — Antigravity Project Configuration

Proyek ini adalah aplikasi web **Smart Soil Monitoring IoT** berbasis **Next.js 15 (App Router) + TypeScript + Tailwind CSS + Recharts + Supabase PostgreSQL + PWA + ESP32-S3 N16R8 Modular Firmware**.

## Informasi Integrasi
- **Supabase Project ID**: `omrjqsolejpxiduogzfn` (`https://omrjqsolejpxiduogzfn.supabase.co`)
- **GitHub Repository**: `https://github.com/yusfikarfirmansamudra933-blip/smart-soil-monitoring-iot`
- **Vercel Production URL**: `https://smart-soil-monitoring-iot.vercel.app`
- **Default Device ID**: `SOIL-001`

## Ketentuan Teknis Hardware & Sensor (Komponen Utama Terbaru)
1. **Otak Utama (MCU)**: **ESP32-S3 N16R8** (16MB Flash, 8MB OPI PSRAM, I2C, ADC1, UART).
2. **Monitoring Energi (2× Sensor Arus & Tegangan DC)**: **2× INA226** (I2C: `0x40` untuk **Panel Surya**, `0x41` untuk **Baterai**).
3. **Solar Charge Controller**: **CN3791** (MPPT Solar Charge Controller) + Panel Surya + Baterai + Sekering & Distribusi Daya.
4. **Sensor Tanah**:
   - **DS18B20 Waterproof** (suhu tanah 1-Wire)
   - **Capacitive Soil Moisture Sensor** (kelembapan tanah kapasitif)
   - **Sensor pH Tanah Output Analog ADC + DMS** (Driver Sensor Modular)
5. **Konektivitas & Peringatan Pulsa**: **Modem 4G LTE** + **Active Buzzer** (berbunyi otomatis saat sisa pulsa/kuota Modem 4G menipis di bawah batas minimum).
6. Pertahankan arsitektur **Driver Sensor Modular** (`src/lib/sensor-drivers.ts` & `firmware/esp32_smart_soil/sensor_drivers.h`).
7. Jangan membuat data energi/pulsa palsu (`Not Available` jika sensor INA226 / pembacaan pulsa belum terpasang) dan jangan menampilkan data lama seolah-olah real-time.
8. Pisahkan selalu data **DEMO** (`is_demo: true`) dari data perangkat nyata (`is_demo: false`).
