"use client";

import React from "react";
import {
  BookOpen,
  CheckCircle2,
  Code2,
  Cpu,
  Database,
  Download,
  Globe,
  Info,
  Key,
  Layers,
  Moon,
  Radio,
  ShieldCheck,
  Smartphone,
  Sun,
} from "lucide-react";
import { DEFAULT_MQTT_CONFIG, getMqttTopics } from "@/lib/mqtt-bridge";

interface SettingsViewProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  isDemo: boolean;
  onToggleDemoMode: (val: boolean) => void;
  canInstallPwa: boolean;
  onInstallPwa: () => void;
}

export function SettingsView({
  darkMode,
  onToggleDarkMode,
  isDemo,
  onToggleDemoMode,
  canInstallPwa,
  onInstallPwa,
}: SettingsViewProps) {
  const mqttTopics = getMqttTopics("SOIL-001");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* App Appearance, Mode & PWA Settings */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-5">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-emerald-500" />
            Pengaturan Aplikasi & Progressive Web App (PWA)
          </h2>

          {/* Theme Switch */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                Tema Tampilan Industrial IoT
              </div>
              <p className="text-xs text-slate-500">
                Beralih antara Dark Mode (Industrial Dark Slate) dan Light Mode
              </p>
            </div>
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-2 transition"
            >
              {darkMode ? (
                <>
                  <Sun className="w-4 h-4" /> Light Mode
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4" /> Dark Mode
                </>
              )}
            </button>
          </div>

          {/* Demo vs Live Mode */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                Sumber Data Dashboard (Demo vs Perangkat Nyata)
              </div>
              <p className="text-xs text-slate-500">
                Semua data simulasi diberi label DEMO dan dipisahkan dari tabel
                data perangkat keras nyata.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onToggleDemoMode(!isDemo)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                isDemo
                  ? "bg-amber-500 text-slate-950 hover:bg-amber-400"
                  : "bg-emerald-600 text-white hover:bg-emerald-500"
              }`}
            >
              {isDemo ? "Mode Saat Ini: DEMO" : "Mode Saat Ini: LIVE HARDWARE"}
            </button>
          </div>

          {/* PWA Install */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                Instalasi Aplikasi Android / Desktop (PWA)
              </div>
              <p className="text-xs text-slate-500">
                Dilengkapi Web App Manifest, Service Worker, Splash Screen, dan
                deteksi Offline State.
              </p>
            </div>
            <button
              type="button"
              onClick={onInstallPwa}
              className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-emerald-600 text-white text-xs font-bold inline-flex items-center gap-2 transition"
            >
              <Download className="w-4 h-4" />
              {canInstallPwa ? "Install PWA" : "Siap Diinstal"}
            </button>
          </div>
        </div>

        {/* API Key, Database & MQTT Ready Info */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-500" />
            Koneksi Backend, PostgreSQL & Arsitektur MQTT-Ready
          </h2>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
                <Key className="w-4 h-4 text-emerald-500" />
                Autentikasi API Key ESP32
              </div>
              <p className="text-slate-500 mb-1">
                Sertakan pada header HTTP <code>X-API-Key</code> saat ESP32
                mengirim data ke <code>POST /api/v1/telemetry</code>:
              </p>
              <code className="block p-2 rounded bg-slate-900 text-emerald-400 font-mono">
                X-API-Key: sk_soil_001_esp32_4g_key_2026
              </code>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
                <Radio className="w-4 h-4 text-emerald-500" />
                Topik Arsitektur MQTT-Ready ({DEFAULT_MQTT_CONFIG.brokerUrl})
              </div>
              <ul className="space-y-1 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                <li>• Telemetry Pub: {mqttTopics.telemetryPublish}</li>
                <li>• Status Pub: {mqttTopics.statusPublish}</li>
                <li>• Config Sub: {mqttTopics.configSubscribe}</li>
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
                <Globe className="w-4 h-4 text-emerald-500" />
                Daftar Endpoint HTTP REST API
              </div>
              <ul className="space-y-1 font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                <li>POST /api/v1/telemetry</li>
                <li>GET /api/v1/telemetry/latest</li>
                <li>GET /api/v1/telemetry/history</li>
                <li>GET /api/v1/device/status</li>
                <li>GET /api/v1/device/config</li>
                <li>POST /api/v1/device/config</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AboutProjectView() {
  const hardwareList = [
    {
      no: 1,
      name: "ESP32-S3 N16R8",
      role: "Mikrokontroler utama (16MB Flash, 8MB OPI PSRAM, I2C, ADC1, UART) sebagai otak sistem.",
    },
    {
      no: 2,
      name: "2× Sensor Arus & Tegangan DC INA226",
      role: "INA226 #1 (I2C 0x40) memantau Panel Surya dan INA226 #2 (I2C 0x41) memantau Baterai (V, A, W).",
    },
    {
      no: 3,
      name: "Solar Charge Controller CN3791 (MPPT)",
      role: "Pengatur pengisian daya MPPT dari panel surya ke baterai secara efisien.",
    },
    {
      no: 4,
      name: "Active Buzzer (Peringatan Pulsa Modem 4G)",
      role: "Aktif otomatis melalui GPIO 21 saat sisa pulsa/kuota Modem 4G menipis di bawah batas minimum.",
    },
    {
      no: 5,
      name: "DS18B20 Waterproof",
      role: "Sensor suhu tanah digital tahan air berbasis protokol 1-Wire (GPIO 4 + pull-up 4.7 kΩ).",
    },
    {
      no: 6,
      name: "Capacitive Soil Moisture Sensor",
      role: "Sensor kelembapan tanah kapasitif anti-korosi terhubung ke ADC1 ESP32-S3 (GPIO 5).",
    },
    {
      no: 7,
      name: "Sensor pH Tanah Output Analog ADC + DMS",
      role: "Pengukur pH tanah output analog ADC (GPIO 6) dipadukan pembacaan DMS (GPIO 7) dengan Driver Modular.",
    },
    {
      no: 8,
      name: "Modem 4G LTE",
      role: "Transmisi data internet lapangan jarak jauh ke cloud & pembacaan status sisa pulsa.",
    },
    {
      no: 9,
      name: "Panel Surya & Baterai Cadangan",
      role: "Sumber energi terbarukan mandiri untuk operasional 24 jam di lahan pertanian.",
    },
    {
      no: 10,
      name: "DC-DC Converter, Sekering & Distribusi Daya",
      role: "Regulasi tegangan 5V stabil untuk ESP32-S3 & Modem 4G beserta proteksi arus pendek.",
    },
  ];

  const stages = [
    "Tahap 1: UI/UX Industrial IoT dan Dashboard Demo Mode.",
    "Tahap 2: Backend HTTP REST API dan Database PostgreSQL (Supabase).",
    "Tahap 3: Arsitektur Driver Modular untuk Sensor pH Tanah, DMS, dan DS18B20 dengan ESP32.",
    "Tahap 4: Integrasi Komunikasi Modem 4G LTE & Autentikasi API Key.",
    "Tahap 5: Integrasi Data Real-Time (Supabase Realtime & Polling).",
    "Tahap 6: Progressive Web App (PWA), Pengujian Endpoint, dan Optimasi.",
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Tentang Proyek — Smart Soil Monitoring IoT
            </h2>
            <p className="text-xs text-slate-500">
              Sistem Pemantauan Kondisi Tanah Mandiri Berbasis ESP32, Jaringan
              4G, dan Tenaga Surya
            </p>
          </div>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <strong>Smart Soil Monitoring IoT</strong> dirancang dengan standar{" "}
          <em>Industrial IoT</em> berbasis <strong>ESP32-S3 N16R8</strong>,{" "}
          <strong>2× sensor arus DC INA226</strong> (untuk Panel Surya &amp;
          Baterai), <strong>CN3791 MPPT</strong>,{" "}
          <strong>Active Buzzer peringatan sisa pulsa Modem 4G</strong>,{" "}
          <strong>DS18B20 Waterproof</strong>,{" "}
          <strong>Capacitive Soil Moisture</strong>, dan{" "}
          <strong>Sensor pH Tanah output Analog ADC + DMS</strong> dengan
          arsitektur <strong>Driver Sensor Modular</strong>.
        </p>
      </div>

      {/* 10 Hardware Components */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-emerald-500" />
          Spesifikasi 10 Komponen Perangkat Keras Terbaru
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
          {hardwareList.map((item) => (
            <div
              key={item.no}
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start gap-3"
            >
              <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0">
                {item.no}
              </span>
              <div>
                <div className="font-bold text-slate-900 dark:text-white">
                  {item.name}
                </div>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                  {item.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6 Implementation Stages & JSON Format */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-500" />
            Tahapan Implementasi Sistem (Tahap 1 – 6)
          </h3>
          <div className="space-y-2.5 text-xs">
            {stages.map((st, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2.5 text-slate-800 dark:text-slate-200 font-medium"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{st}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Code2 className="w-5 h-5 text-emerald-500" />
            Format Standar Payload Telemetri ESP32
          </h3>
          <pre className="p-4 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed">
{`POST /api/v1/telemetry
Headers:
  Content-Type: application/json
  X-API-Key: sk_soil_001_esp32_4g_key_2026

{
  "device_id": "SOIL-001",
  "timestamp": "2026-11-19T10:00:00Z",
  "soil_ph": 6.5,
  "soil_moisture": 58.2,
  "soil_dms_raw": 2150,
  "soil_temperature": 28.4,
  "solar_voltage": 16.40,
  "solar_current": 0.48,
  "solar_power": 7.87,
  "battery_voltage": 12.60,
  "battery_current": 0.35,
  "battery_power": 4.41,
  "modem_credit_rp": 8500,
  "buzzer_active": true,
  "sensor_status": {
    "ph": "online",
    "dms": "online",
    "temperature": "online"
  }
}`}
          </pre>
          <p className="text-[11px] text-slate-500">
            Catatan: Firmware ESP32 tersedia pada direktori proyek{" "}
            <code>firmware/esp32_smart_soil/</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
