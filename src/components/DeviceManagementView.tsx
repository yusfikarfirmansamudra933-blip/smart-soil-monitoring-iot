"use client";

import React, { useEffect, useState } from "react";
import {
  Activity,
  Bell,
  CheckCircle2,
  Clock,
  Cpu,
  Key,
  Power,
  Radio,
  RotateCcw,
  Save,
  Send,
  Server,
  Settings2,
  Sliders,
  Unplug,
  Volume2,
  Zap,
} from "lucide-react";
import {
  DmsInterfaceMode,
  PhInterfaceMode,
  SoilDeviceConfig,
  SoilDeviceStatus,
} from "@/lib/types";
import {
  DMS_INTERFACE_OPTIONS,
  PH_INTERFACE_OPTIONS,
} from "@/lib/sensor-drivers";

interface DeviceManagementProps {
  deviceStatus: SoilDeviceStatus;
  config: SoilDeviceConfig;
  onSaveConfig: (
    updatedConfig: Partial<SoilDeviceConfig>,
    identity?: { name: string; location: string; firmware_version: string }
  ) => Promise<void>;
  onTriggerRefresh: () => void;
}

function formatUptime(sec: number) {
  if (!sec || sec <= 0) return "0m (Offline)";
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${d}h ${h}j ${m}m`;
}

export function DeviceManagementView({
  deviceStatus,
  config,
  onSaveConfig,
  onTriggerRefresh,
}: DeviceManagementProps) {
  const [identity, setIdentity] = useState({
    device_id: deviceStatus.device_id || "SOIL-001",
    name: deviceStatus.name || "Smart Soil Station #1",
    location: deviceStatus.location || "Blok A - Lahan Pertanian Utama",
    firmware_version: deviceStatus.firmware_version || "v1.2.0-esp32-4g",
  });

  const [cfg, setCfg] = useState<SoilDeviceConfig>({ ...config });
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [sendingRemoteCmd, setSendingRemoteCmd] = useState<string | null>(null);
  const [remoteCmdStatus, setRemoteCmdStatus] = useState<string | null>(null);
  const [customOtaUrl, setCustomOtaUrl] = useState("");

  useEffect(() => {
    setCfg({ ...config });
  }, [config]);

  const handleRemoteCommand = async (
    command:
      | "ring_buzzer"
      | "reset_energy"
      | "reboot_mcu"
      | "toggle_power_save"
      | "ota_update"
  ) => {
    setSendingRemoteCmd(command);
    setRemoteCmdStatus(null);
    try {
      const res = await fetch("/api/v1/device/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          device_id: deviceStatus.device_id || "SOIL-001",
          command,
          ...(command === "ota_update" && customOtaUrl.trim()
            ? { ota_url: customOtaUrl.trim() }
            : {}),
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setRemoteCmdStatus(json.message || "Perintah jarak jauh berhasil dikirim.");
        if (typeof json.force_power_save === "boolean") {
          setCfg((prev) => ({ ...prev, force_power_save: json.force_power_save }));
        }
        onTriggerRefresh();
      } else {
        setRemoteCmdStatus(`Gagal: ${json.error || "Gagal mengirim perintah"}`);
      }
    } catch (err: unknown) {
      setRemoteCmdStatus(
        `Error: ${err instanceof Error ? err.message : "Kesalahan jaringan"}`
      );
    } finally {
      setSendingRemoteCmd(null);
    }
  };

  // Interactive HTTP POST /api/v1/telemetry tester
  const [testPayload, setTestPayload] = useState({
    soil_ph: "6.5",
    soil_moisture: "58.2",
    soil_dms_raw: "2150",
    soil_temperature: "28.4",
    battery_voltage: "12.6",
    modem_quota_mb: "420",
    modem_credit_rp: "8500",
    ph_status: "online",
    dms_status: "online",
    temp_status: "online",
  });
  const [testResult, setTestResult] = useState<string | null>(null);
  const [sendingTest, setSendingTest] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMessage(null);
    await onSaveConfig(cfg, {
      name: identity.name,
      location: identity.location,
      firmware_version: identity.firmware_version,
    });
    setSaving(false);
    setSaveMessage(
      "Konfigurasi perangkat & driver sensor modular berhasil disimpan ke PostgreSQL!"
    );
    setTimeout(() => setSaveMessage(null), 4000);
  };

  const handleSendTestTelemetry = async () => {
    setSendingTest(true);
    setTestResult(null);
    try {
      const payload = {
        device_id: "SOIL-001",
        timestamp: new Date().toISOString(),
        soil_ph:
          testPayload.ph_status === "not_connected"
            ? null
            : Number(testPayload.soil_ph),
        soil_moisture:
          testPayload.dms_status === "not_connected"
            ? null
            : Number(testPayload.soil_moisture),
        soil_dms_raw:
          testPayload.dms_status === "not_connected"
            ? null
            : Number(testPayload.soil_dms_raw),
        soil_temperature:
          testPayload.temp_status === "not_connected"
            ? null
            : Number(testPayload.soil_temperature),
        battery_voltage: Number(testPayload.battery_voltage),
        modem_quota_mb:
          testPayload.modem_quota_mb === ""
            ? null
            : Number(testPayload.modem_quota_mb),
        modem_credit_rp:
          testPayload.modem_credit_rp === ""
            ? null
            : Number(testPayload.modem_credit_rp),
        sensor_status: {
          ph: testPayload.ph_status,
          dms: testPayload.dms_status,
          temperature: testPayload.temp_status,
        },
        is_demo: false,
      };

      const res = await fetch("/api/v1/telemetry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key":
            deviceStatus.api_key || "sk_soil_001_esp32_4g_key_2026",
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (res.ok) {
        setTestResult(
          `Sukses (HTTP 201): Data tersimpan ke PostgreSQL (ID: ${json.data?.id}).`
        );
        onTriggerRefresh();
      } else {
        setTestResult(`Gagal: ${json.error || "Unknown error"}`);
      }
    } catch (err: unknown) {
      setTestResult(
        `Error: ${err instanceof Error ? err.message : "Network error"}`
      );
    } finally {
      setSendingTest(false);
    }
  };

  const statusPill = (state: string) => {
    const isOk = state === "online" || state === "connected";
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
          isOk
            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
            : state === "uncalibrated"
            ? "bg-indigo-500/15 text-indigo-500 border border-indigo-500/30"
            : "bg-rose-500/15 text-rose-500 border border-rose-500/30"
        }`}
      >
        {isOk ? (
          <CheckCircle2 className="w-3.5 h-3.5" />
        ) : (
          <Unplug className="w-3.5 h-3.5" />
        )}
        {state === "not_connected"
          ? "Sensor Not Connected"
          : state.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* 9-Item Hardware & Telemetry Status Grid */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-6 h-6 text-emerald-500" />
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Device Management & Diagnostik Hardware ESP32
              </h2>
              <p className="text-xs text-slate-500">
                Status real-time mikrokontroler ESP32-S3 N16R8, ketiga sensor
                tanah modular, 2× INA226, dan modem 4G LTE
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <span className="text-slate-500 block">1. Device ID</span>
              <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                {deviceStatus.device_id}
              </span>
            </div>
            <Server className="w-5 h-5 text-emerald-500" />
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <span className="text-slate-500 block">2. Firmware Version</span>
              <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                {deviceStatus.firmware_version}
              </span>
            </div>
            <Cpu className="w-5 h-5 text-emerald-500" />
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <span className="text-slate-500 block mb-1">3. Status ESP32</span>
              {statusPill(deviceStatus.esp32_status)}
            </div>
            <Activity className="w-5 h-5 text-emerald-500" />
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <span className="text-slate-500 block mb-1">
                4. Status Sensor pH Tanah
              </span>
              {statusPill(deviceStatus.sensor_ph_status)}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <span className="text-slate-500 block mb-1">
                5. Status Sensor DMS
              </span>
              {statusPill(deviceStatus.sensor_dms_status)}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <span className="text-slate-500 block mb-1">
                6. Status DS18B20 Waterproof
              </span>
              {statusPill(deviceStatus.sensor_temp_status)}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <span className="text-slate-500 block mb-1">
                7. Status Modem 4G LTE
              </span>
              {statusPill(deviceStatus.modem_status)}
            </div>
            <Radio className="w-5 h-5 text-emerald-500" />
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <span className="text-slate-500 block">8. Last Seen</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {deviceStatus.last_seen
                  ? new Date(deviceStatus.last_seen).toLocaleString("id-ID")
                  : "Belum Pernah Terhubung"}
              </span>
            </div>
            <Clock className="w-5 h-5 text-emerald-500" />
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <span className="text-slate-500 block">9. Uptime Sistem</span>
              <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                {formatUptime(deviceStatus.uptime_seconds)}
              </span>
            </div>
            <Clock className="w-5 h-5 text-emerald-500" />
          </div>
        </div>
      </div>

      {/* 2-Way Remote Control Panel (Web -> ESP32-S3) */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Radio className="w-5 h-5 text-emerald-500" />
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Kontrol Jarak Jauh 2-Arah (Web → ESP32-S3)
              </h3>
              <p className="text-xs text-slate-500">
                Perintah dieksekusi otomatis oleh ESP32-S3 pada siklus telemetri berikutnya (~2 detik) tanpa perlu kabel USB
              </p>
            </div>
          </div>
          {cfg.pending_command && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              Menunggu Eksekusi: {cfg.pending_command}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <button
            type="button"
            disabled={sendingRemoteCmd !== null}
            onClick={() => handleRemoteCommand("ring_buzzer")}
            className="p-3.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-left transition flex items-start gap-3 disabled:opacity-50"
          >
            <Volume2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">
                {sendingRemoteCmd === "ring_buzzer"
                  ? "Mengirim..."
                  : "Tes Bunyikan Buzzer"}
              </span>
              <span className="text-[11px] text-slate-500">
                Bunyikan Active Buzzer 3× untuk cek posisi alat di kebun
              </span>
            </div>
          </button>

          <button
            type="button"
            disabled={sendingRemoteCmd !== null}
            onClick={() => handleRemoteCommand("reset_energy")}
            className="p-3.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-left transition flex items-start gap-3 disabled:opacity-50"
          >
            <RotateCcw className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">
                {sendingRemoteCmd === "reset_energy"
                  ? "Mengirim..."
                  : "Reset Meteran Energi (Wh)"}
              </span>
              <span className="text-[11px] text-slate-500">
                Nolkan akumulasi Wh Panel Surya & Baterai di NVS
              </span>
            </div>
          </button>

          <button
            type="button"
            disabled={sendingRemoteCmd !== null}
            onClick={() => handleRemoteCommand("toggle_power_save")}
            className={`p-3.5 rounded-xl border text-left transition flex items-start gap-3 disabled:opacity-50 ${
              cfg.force_power_save
                ? "bg-amber-500/20 border-amber-500/50 hover:bg-amber-500/25"
                : "bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20"
            }`}
          >
            <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">
                {sendingRemoteCmd === "toggle_power_save"
                  ? "Mengubah..."
                  : `Hemat Daya 80 MHz: ${cfg.force_power_save ? "AKTIF" : "OFF"}`}
              </span>
              <span className="text-[11px] text-slate-500">
                Paksa CPU 80 MHz & WiFi Modem-Sleep saat cuaca mendung
              </span>
            </div>
          </button>

          <button
            type="button"
            disabled={sendingRemoteCmd !== null}
            onClick={() => handleRemoteCommand("reboot_mcu")}
            className="p-3.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-left transition flex items-start gap-3 disabled:opacity-50"
          >
            <Power className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">
                {sendingRemoteCmd === "reboot_mcu"
                  ? "Merestart..."
                  : "Restart ESP32-S3"}
              </span>
              <span className="text-[11px] text-slate-500">
                Muat ulang mikrokontroler jarak jauh tanpa ke lahan
              </span>
            </div>
          </button>
        </div>

        {/* Wireless Cloud & Local OTA Firmware Update Box */}
        <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 space-y-3 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="font-bold text-slate-900 dark:text-white block text-sm">
                Wireless OTA Firmware Update (Tanpa Kabel USB)
              </span>
              <span className="text-[11px] text-slate-500">
                1-Klik tarik firmware terbaru dari Cloud HTTPS Vercel, atau upload file{" "}
                <code className="font-mono">.bin</code> lokal via WiFi di{" "}
                <code className="font-mono">http://smartsoil.local</code> /{" "}
                <code className="font-mono">http://192.168.4.1</code>
              </span>
            </div>
            <span className="font-mono text-[11px] px-2.5 py-1 rounded-lg bg-slate-900/10 dark:bg-white/10 text-slate-700 dark:text-slate-200 shrink-0">
              Aktif: {deviceStatus.firmware_version}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="url"
              value={customOtaUrl}
              onChange={(e) => setCustomOtaUrl(e.target.value)}
              placeholder="Kosongkan untuk pakai firmware terbaru bawaan (/firmware/esp32s3-latest.bin) atau isi URL .bin kustom"
              className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-indigo-500/30 text-xs"
            />
            <button
              type="button"
              disabled={sendingRemoteCmd !== null}
              onClick={() => handleRemoteCommand("ota_update")}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shrink-0 disabled:opacity-50"
            >
              {sendingRemoteCmd === "ota_update"
                ? "Mengirim OTA..."
                : "Update Firmware via OTA"}
            </button>
          </div>
        </div>

        {remoteCmdStatus && (
          <div className="px-3.5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-medium text-emerald-700 dark:text-emerald-300">
            {remoteCmdStatus}
          </div>
        )}
      </div>

      {/* Configuration Form & Live Telemetry Tester */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form
          onSubmit={handleSave}
          className="lg:col-span-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-5"
        >
          <div className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Pengaturan Perangkat, Interval, & Driver Modular Sensor
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold mb-1">
                Nama Identitas Perangkat
              </label>
              <input
                type="text"
                value={identity.name}
                onChange={(e) =>
                  setIdentity({ ...identity, name: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">
                Lokasi Lahan / Stasiun
              </label>
              <input
                type="text"
                value={identity.location}
                onChange={(e) =>
                  setIdentity({ ...identity, location: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">
                Interval Pembacaan Sensor (detik)
              </label>
              <input
                type="number"
                min={5}
                max={3600}
                value={cfg.read_interval_sec}
                onChange={(e) =>
                  setCfg({ ...cfg, read_interval_sec: Number(e.target.value) })
                }
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">
                Interval Pengiriman Data 4G (detik)
              </label>
              <input
                type="number"
                min={10}
                max={7200}
                value={cfg.send_interval_sec}
                onChange={(e) =>
                  setCfg({ ...cfg, send_interval_sec: Number(e.target.value) })
                }
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Zona Waktu</label>
              <select
                value={cfg.timezone}
                onChange={(e) => setCfg({ ...cfg, timezone: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <option value="Asia/Jakarta">WIB (Asia/Jakarta, UTC+7)</option>
                <option value="Asia/Makassar">
                  WITA (Asia/Makassar, UTC+8)
                </option>
                <option value="Asia/Jayapura">
                  WIT (Asia/Jayapura, UTC+9)
                </option>
                <option value="UTC">UTC</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">
                Versi Firmware ESP32
              </label>
              <input
                type="text"
                value={identity.firmware_version}
                onChange={(e) =>
                  setIdentity({
                    ...identity,
                    firmware_version: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
              />
            </div>
          </div>

          {/* Modular Sensor Interface Selection */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <Sliders className="w-4 h-4 text-emerald-500" />
              Konfigurasi Driver Sensor Modular (Sesuai Pemeriksaan Datasheet)
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1">
                  Mode Komunikasi Sensor pH Tanah
                </label>
                <select
                  value={cfg.ph_interface_mode}
                  onChange={(e) =>
                    setCfg({
                      ...cfg,
                      ph_interface_mode: e.target.value as PhInterfaceMode,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  {PH_INTERFACE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  Mode Komunikasi Sensor DMS
                </label>
                <select
                  value={cfg.dms_interface_mode}
                  onChange={(e) =>
                    setCfg({
                      ...cfg,
                      dms_interface_mode: e.target.value as DmsInterfaceMode,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  {DMS_INTERFACE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="flex items-center gap-2 pt-4">
                <input
                  id="dms_cal_chk"
                  type="checkbox"
                  checked={cfg.dms_calibrated}
                  onChange={(e) =>
                    setCfg({ ...cfg, dms_calibrated: e.target.checked })
                  }
                  className="w-4 h-4 accent-emerald-600 rounded"
                />
                <label htmlFor="dms_cal_chk" className="font-semibold">
                  Aktifkan Konversi % DMS
                </label>
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  DMS Nilai Mentah Kering (0%)
                </label>
                <input
                  type="number"
                  value={cfg.dms_raw_dry}
                  onChange={(e) =>
                    setCfg({ ...cfg, dms_raw_dry: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  DMS Nilai Mentah Basah (100%)
                </label>
                <input
                  type="number"
                  value={cfg.dms_raw_wet}
                  onChange={(e) =>
                    setCfg({ ...cfg, dms_raw_wet: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>
          </div>

          {/* Atur Batas Kuota & Pulsa Modem 4G + Active Buzzer */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3 text-xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <Bell className="w-4 h-4 text-emerald-500" />
                Atur Batas Kuota Modem 4G &amp; Active Buzzer (GPIO 21)
              </div>
              {deviceStatus.modem_quota_mb !== null &&
                deviceStatus.modem_quota_mb !== undefined && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    Sisa Kuota Saat Ini: {deviceStatus.modem_quota_mb} MB
                  </span>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1">
                  Batas Minimum Kuota Data 4G (MB)
                </label>
                <input
                  type="number"
                  min={50}
                  step={50}
                  value={cfg.modem_quota_min_mb ?? 500}
                  onChange={(e) =>
                    setCfg({
                      ...cfg,
                      modem_quota_min_mb: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Active Buzzer menyala jika sisa kuota &lt;{" "}
                  {cfg.modem_quota_min_mb ?? 500} MB
                </p>
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  Batas Minimum Pulsa Modem 4G (Rp)
                </label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={cfg.modem_credit_min_rp ?? 10000}
                  onChange={(e) =>
                    setCfg({
                      ...cfg,
                      modem_credit_min_rp: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Active Buzzer menyala jika sisa pulsa &lt; Rp{" "}
                  {(cfg.modem_credit_min_rp ?? 10000).toLocaleString("id-ID")}
                </p>
              </div>
            </div>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 cursor-pointer">
              <div>
                <div className="font-bold text-slate-900 dark:text-white">
                  Aktifkan Active Buzzer Otomatis (GPIO 21)
                </div>
                <div className="text-[11px] text-slate-500">
                  Bunyikan buzzer ESP32-S3 N16R8 otomatis saat kuota atau pulsa
                  modem 4G berada di bawah batas minimum
                </div>
              </div>
              <input
                type="checkbox"
                checked={cfg.buzzer_enabled !== false}
                onChange={(e) =>
                  setCfg({ ...cfg, buzzer_enabled: e.target.checked })
                }
                className="w-4 h-4 accent-emerald-600"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-2 transition"
          >
            <Save className="w-4 h-4" />
            {saving
              ? "Menyimpan Konfigurasi..."
              : "Simpan Konfigurasi Perangkat (POST /api/v1/device/config)"}
          </button>

          {saveMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              {saveMessage}
            </div>
          )}
        </form>

        {/* Live ESP32 HTTP REST API Telemetry Injector / Tester */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Uji Endpoint ESP32 (POST /api/v1/telemetry)
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Kirim paket telemetri JSON langsung ke database PostgreSQL untuk
            menguji integrasi perangkat nyata dan evaluasi alarm.
          </p>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-semibold">
              <Key className="w-3.5 h-3.5 text-emerald-500" />
              X-API-Key:
            </span>
            <code className="text-[11px] text-emerald-600 dark:text-emerald-400">
              sk_soil_001_esp32_4g_key_2026
            </code>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold mb-1">Soil pH</label>
              <input
                type="number"
                step="0.1"
                value={testPayload.soil_ph}
                onChange={(e) =>
                  setTestPayload({ ...testPayload, soil_ph: e.target.value })
                }
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Status pH</label>
              <select
                value={testPayload.ph_status}
                onChange={(e) =>
                  setTestPayload({ ...testPayload, ph_status: e.target.value })
                }
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <option value="online">online</option>
                <option value="not_connected">not_connected</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">DMS Raw Value</label>
              <input
                type="number"
                value={testPayload.soil_dms_raw}
                onChange={(e) =>
                  setTestPayload({
                    ...testPayload,
                    soil_dms_raw: e.target.value,
                  })
                }
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Status DMS</label>
              <select
                value={testPayload.dms_status}
                onChange={(e) =>
                  setTestPayload({ ...testPayload, dms_status: e.target.value })
                }
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <option value="online">online</option>
                <option value="uncalibrated">uncalibrated</option>
                <option value="not_connected">not_connected</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Suhu (°C)</label>
              <input
                type="number"
                step="0.1"
                value={testPayload.soil_temperature}
                onChange={(e) =>
                  setTestPayload({
                    ...testPayload,
                    soil_temperature: e.target.value,
                  })
                }
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Status DS18B20</label>
              <select
                value={testPayload.temp_status}
                onChange={(e) =>
                  setTestPayload({
                    ...testPayload,
                    temp_status: e.target.value,
                  })
                }
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <option value="online">online</option>
                <option value="not_connected">not_connected</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block font-semibold mb-1">
                Tegangan Baterai 12V (Volt)
              </label>
              <input
                type="number"
                step="0.1"
                value={testPayload.battery_voltage}
                onChange={(e) =>
                  setTestPayload({
                    ...testPayload,
                    battery_voltage: e.target.value,
                  })
                }
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">
                Kuota Modem (MB)
              </label>
              <input
                type="number"
                value={testPayload.modem_quota_mb}
                onChange={(e) =>
                  setTestPayload({
                    ...testPayload,
                    modem_quota_mb: e.target.value,
                  })
                }
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">
                Pulsa Modem (Rp)
              </label>
              <input
                type="number"
                step="500"
                value={testPayload.modem_credit_rp}
                onChange={(e) =>
                  setTestPayload({
                    ...testPayload,
                    modem_credit_rp: e.target.value,
                  })
                }
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          <button
            type="button"
            disabled={sendingTest}
            onClick={handleSendTestTelemetry}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
          >
            <Send className="w-4 h-4" />
            {sendingTest
              ? "Mengirim Paket..."
              : "Kirim Paket Telemetri ke Server"}
          </button>

          {testResult && (
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-mono text-emerald-600 dark:text-emerald-400">
              {testResult}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
