# Smart Soil Monitoring IoT — Antigravity Project Configuration

Proyek ini adalah aplikasi web **Smart Soil Monitoring IoT** berbasis **Next.js 15 (App Router) + TypeScript + Tailwind CSS + Recharts + Supabase PostgreSQL + PWA + ESP32 Modular Firmware**.

## Informasi Integrasi
- **Supabase Project ID**: `omrjqsolejpxiduogzfn` (`https://omrjqsolejpxiduogzfn.supabase.co`)
- **GitHub Repository**: `https://github.com/yusfikarfirmansamudra933-blip/smart-soil-monitoring-iot`
- **Vercel Production URL**: `https://smart-soil-monitoring-iot.vercel.app`
- **Default Device ID**: `SOIL-001`

## Ketentuan Teknis Hardware & Sensor
1. Gunakan **ESP32 DevKit**, **Sensor pH Tanah**, **Sensor DMS**, **DS18B20 Waterproof**, **Modem 4G**, dan **Sistem Tenaga Surya (Panel 10 Wp, SCC PWM, Baterai 12V 7Ah, DC-DC 12V ke 5V, Sekering)**.
2. **Jangan** menggunakan Capacitive Soil Moisture Sensor atau sensor pH cairan PH-4502C.
3. Pertahankan arsitektur **Driver Sensor Modular** (`src/lib/sensor-drivers.ts` & `firmware/esp32_smart_soil/sensor_drivers.h`).
4. Jangan membuat data energi palsu (`Not Available` jika sensor belum terpasang) dan jangan menampilkan data lama seolah-olah real-time.
5. Pisahkan selalu data **DEMO** (`is_demo: true`) dari data perangkat nyata (`is_demo: false`).
