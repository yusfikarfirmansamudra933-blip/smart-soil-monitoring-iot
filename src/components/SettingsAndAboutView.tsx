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
      name: "ESP32 DevKit",
      role: "Mikrokontroler utama dual-core 32-bit untuk akuisisi sensor & telemetri.",
    },
    {
      no: 2,
      name: "Sensor pH Tanah (Sesuai Foto Produk)",
      role: "Pengukur tingkat keasaman/kebasaan tanah dengan driver komunikasi modular.",
    },
    {
      no: 3,
      name: "Sensor DMS (Sesuai Foto Produk)",
      role: "Pengukur kelembapan tanah DMS (mendukung nilai mentah & konversi % terkalibrasi).",
    },
    {
      no: 4,
      name: "DS18B20 Waterproof",
      role: "Sensor suhu tanah digital tahan air berbasis protokol 1-Wire.",
    },
    {
      no: 5,
      name: "Modem 4G LTE",
      role: "Transmisi data internet lapangan jarak jauh ke server cloud.",
    },
    {
      no: 6,
      name: "Panel Surya 10 Wp",
      role: "Sumber energi terbarukan utama untuk operasional mandiri di lahan.",
    },
    {
      no: 7,
      name: "Solar Charge Controller PWM",
      role: "Pengatur pengisian daya dari panel surya ke baterai 12V.",
    },
    {
      no: 8,
      name: "Baterai 12V 7Ah",
      role: "Penyimpanan energi cadangan untuk operasional siang & malam 24 jam.",
    },
    {
      no: 9,
      name: "DC-DC Converter 12V ke 5V",
      role: "Penurun tegangan efisien untuk menyuplai ESP32, sensor, dan modem.",
    },
    {
      no: 10,
      name: "Sekering & Distribusi Daya",
      role: "Sistem proteksi arus pendek dan terminal distribusi jalur daya.",
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
          <em>Industrial IoT</em> untuk memantau parameter krusial kesuburan
          tanah secara real-time maupun historis. Sistem ini mematuhi prinsip
          ketat perangkat keras: <strong>tidak</strong> menggunakan Capacitive
          Soil Moisture Sensor maupun sensor pH cairan PH-4502C, serta
          menggunakan arsitektur <strong>Driver Sensor Modular</strong> agar
          antarmuka komunikasi sensor pH tanah dan DMS dapat disesuaikan dengan
          spesifikasi datasheet fisik.
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
  "timestamp": "2026-11-18T10:00:00Z",
  "soil_ph": 6.5,
  "soil_moisture": 58.2,
  "soil_dms_raw": 2150,
  "soil_temperature": 28.4,
  "battery_voltage": 12.6,
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
