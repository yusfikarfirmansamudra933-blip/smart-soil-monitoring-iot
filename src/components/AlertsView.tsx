"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Cpu,
  Radio,
  Save,
  Sliders,
  Unplug,
} from "lucide-react";
import {
  SoilAlertRecord,
  SoilDeviceConfig,
  SoilDeviceStatus,
  SoilTelemetryRecord,
} from "@/lib/types";

interface AlertsViewProps {
  alerts: SoilAlertRecord[];
  config: SoilDeviceConfig;
  deviceStatus: SoilDeviceStatus;
  latest: SoilTelemetryRecord | null;
  onAcknowledgeAlert: (id: number) => void;
  onSaveThresholds: (updated: Partial<SoilDeviceConfig>) => Promise<void>;
}

export function AlertsView({
  alerts,
  config,
  deviceStatus,
  latest,
  onAcknowledgeAlert,
  onSaveThresholds,
}: AlertsViewProps) {
  const [form, setForm] = useState({
    ph_min_alarm: config.ph_min_alarm,
    ph_max_alarm: config.ph_max_alarm,
    moisture_min_alarm: config.moisture_min_alarm,
    moisture_max_alarm: config.moisture_max_alarm,
    temp_min_alarm: config.temp_min_alarm,
    temp_max_alarm: config.temp_max_alarm,
    battery_low_alarm: config.battery_low_alarm,
  });
  const quotaMinMb = config.modem_quota_min_mb ?? 500;
  const creditMinRp = config.modem_credit_min_rp ?? 10000;
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  // Live evaluation of all 9 required alarm rules
  const liveEvaluations = [
    {
      id: "ph_low",
      name: "1. pH Terlalu Rendah (Asam)",
      limit: `< ${form.ph_min_alarm} pH`,
      triggered:
        latest?.soil_ph !== null &&
        latest?.soil_ph !== undefined &&
        latest.soil_ph < form.ph_min_alarm,
      current:
        latest?.soil_ph !== null && latest?.soil_ph !== undefined
          ? `${latest.soil_ph.toFixed(2)} pH`
          : "Sensor Not Connected",
    },
    {
      id: "ph_high",
      name: "2. pH Terlalu Tinggi (Basa)",
      limit: `> ${form.ph_max_alarm} pH`,
      triggered:
        latest?.soil_ph !== null &&
        latest?.soil_ph !== undefined &&
        latest.soil_ph > form.ph_max_alarm,
      current:
        latest?.soil_ph !== null && latest?.soil_ph !== undefined
          ? `${latest.soil_ph.toFixed(2)} pH`
          : "Sensor Not Connected",
    },
    {
      id: "moisture_dry",
      name: "3. Tanah Terlalu Kering (DMS)",
      limit: `< ${form.moisture_min_alarm}%`,
      triggered:
        latest?.soil_moisture !== null &&
        latest?.soil_moisture !== undefined &&
        latest.soil_moisture < form.moisture_min_alarm,
      current:
        latest?.soil_moisture !== null && latest?.soil_moisture !== undefined
          ? `${latest.soil_moisture.toFixed(1)}%`
          : latest?.soil_dms_raw !== null && latest?.soil_dms_raw !== undefined
          ? `Raw: ${latest.soil_dms_raw}`
          : "Sensor Not Connected",
    },
    {
      id: "moisture_wet",
      name: "4. Tanah Terlalu Basah (DMS)",
      limit: `> ${form.moisture_max_alarm}%`,
      triggered:
        latest?.soil_moisture !== null &&
        latest?.soil_moisture !== undefined &&
        latest.soil_moisture > form.moisture_max_alarm,
      current:
        latest?.soil_moisture !== null && latest?.soil_moisture !== undefined
          ? `${latest.soil_moisture.toFixed(1)}%`
          : latest?.soil_dms_raw !== null && latest?.soil_dms_raw !== undefined
          ? `Raw: ${latest.soil_dms_raw}`
          : "Sensor Not Connected",
    },
    {
      id: "temp_limit",
      name: "5. Suhu Tanah Melewati Batas (DS18B20)",
      limit: `< ${form.temp_min_alarm}°C atau > ${form.temp_max_alarm}°C`,
      triggered:
        latest?.soil_temperature !== null &&
        latest?.soil_temperature !== undefined &&
        (latest.soil_temperature < form.temp_min_alarm ||
          latest.soil_temperature > form.temp_max_alarm),
      current:
        latest?.soil_temperature !== null &&
        latest?.soil_temperature !== undefined
          ? `${latest.soil_temperature.toFixed(1)} °C`
          : "Sensor Not Connected",
    },
    {
      id: "battery_low",
      name: "6. Baterai 12V Lemah",
      limit: `< ${form.battery_low_alarm} V`,
      triggered:
        latest?.battery_voltage !== null &&
        latest?.battery_voltage !== undefined &&
        latest.battery_voltage < form.battery_low_alarm,
      current:
        latest?.battery_voltage !== null &&
        latest?.battery_voltage !== undefined
          ? `${latest.battery_voltage.toFixed(2)} V`
          : "Not Available",
    },
    {
      id: "esp32_offline",
      name: "7. ESP32 Offline",
      limit: "Tidak ada heartbeat > 5 menit",
      triggered: deviceStatus.esp32_status !== "online",
      current: deviceStatus.esp32_status.toUpperCase(),
    },
    {
      id: "sensor_disconnected",
      name: "8. Sensor Tidak Terhubung",
      limit: "Semua sensor wajib terhubung",
      triggered:
        deviceStatus.sensor_ph_status === "not_connected" ||
        deviceStatus.sensor_dms_status === "not_connected" ||
        deviceStatus.sensor_temp_status === "not_connected",
      current: `pH: ${deviceStatus.sensor_ph_status}, DMS: ${deviceStatus.sensor_dms_status}, Temp: ${deviceStatus.sensor_temp_status}`,
    },
    {
      id: "modem_offline",
      name: "9. Modem 4G Kehilangan Koneksi",
      limit: "Modem 4G harus Connected",
      triggered: deviceStatus.modem_status !== "connected",
      current: deviceStatus.modem_status.toUpperCase(),
    },
    {
      id: "modem_credit_low",
      name: "10. Kuota / Pulsa Modem Menipis (Active Buzzer)",
      limit: `< ${quotaMinMb} MB atau < Rp ${creditMinRp.toLocaleString("id-ID")}`,
      triggered:
        (latest?.modem_quota_mb !== null &&
          latest?.modem_quota_mb !== undefined &&
          latest.modem_quota_mb < quotaMinMb) ||
        (latest?.modem_credit_rp !== null &&
          latest?.modem_credit_rp !== undefined &&
          latest.modem_credit_rp < creditMinRp),
      current:
        latest?.modem_quota_mb !== null &&
        latest?.modem_quota_mb !== undefined
          ? `${latest.modem_quota_mb} MB (Rp ${(latest.modem_credit_rp ?? 0).toLocaleString("id-ID")}) · Buzzer ${
              latest.buzzer_active ? "ON" : "OFF"
            }`
          : latest?.modem_credit_rp !== null &&
            latest?.modem_credit_rp !== undefined
          ? `Rp ${latest.modem_credit_rp.toLocaleString("id-ID")} · Buzzer ${
              latest.buzzer_active ? "ON" : "OFF"
            }`
          : "Not Available",
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedNotice(false);
    await onSaveThresholds(form);
    setSaving(false);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Live 9-Rule Alarm Matrix */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-emerald-500" />
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Matriks Evaluasi Sistem Alarm Otomatis (10 Parameter + Active Buzzer)
              </h2>
              <p className="text-xs text-slate-500">
                Pemantauan otomatis pH Analog ADC+DMS, Capacitive Soil Moisture,
                suhu DS18B20, 2× INA226 baterai/panel, ESP32-S3, modem 4G, dan
                sisa pulsa modem pemicu Active Buzzer
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {liveEvaluations.map((rule) => (
            <div
              key={rule.id}
              className={`p-4 rounded-xl border transition ${
                rule.triggered
                  ? "bg-rose-500/10 border-rose-500/40 text-rose-700 dark:text-rose-300"
                  : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-bold text-xs text-slate-900 dark:text-white">
                  {rule.name}
                </span>
                {rule.triggered ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white">
                    <AlertTriangle className="w-3 h-3" /> ALARM
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" /> NORMAL
                  </span>
                )}
              </div>
              <div className="mt-2 text-xs space-y-0.5">
                <div className="text-slate-500 dark:text-slate-400">
                  Batas: <span className="font-mono">{rule.limit}</span>
                </div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  Saat Ini: <span className="font-mono">{rule.current}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Configurable Alarm Thresholds + Alert History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Threshold Configuration Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4"
        >
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Pengaturan Batas Alarm
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Ubah batas pemicu notifikasi otomatis sesuai jenis tanaman & tanah.
          </p>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold mb-1">pH Minimum</label>
              <input
                type="number"
                step="0.1"
                value={form.ph_min_alarm}
                onChange={(e) =>
                  setForm({ ...form, ph_min_alarm: Number(e.target.value) })
                }
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">pH Maksimum</label>
              <input
                type="number"
                step="0.1"
                value={form.ph_max_alarm}
                onChange={(e) =>
                  setForm({ ...form, ph_max_alarm: Number(e.target.value) })
                }
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">
                Moisture Kering (%)
              </label>
              <input
                type="number"
                step="1"
                value={form.moisture_min_alarm}
                onChange={(e) =>
                  setForm({
                    ...form,
                    moisture_min_alarm: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">
                Moisture Basah (%)
              </label>
              <input
                type="number"
                step="1"
                value={form.moisture_max_alarm}
                onChange={(e) =>
                  setForm({
                    ...form,
                    moisture_max_alarm: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">
                Suhu Minimum (°C)
              </label>
              <input
                type="number"
                step="0.5"
                value={form.temp_min_alarm}
                onChange={(e) =>
                  setForm({ ...form, temp_min_alarm: Number(e.target.value) })
                }
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">
                Suhu Maksimum (°C)
              </label>
              <input
                type="number"
                step="0.5"
                value={form.temp_max_alarm}
                onChange={(e) =>
                  setForm({ ...form, temp_max_alarm: Number(e.target.value) })
                }
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="col-span-2">
              <label className="block font-semibold mb-1">
                Batas Baterai Lemah (Volt)
              </label>
              <input
                type="number"
                step="0.1"
                value={form.battery_low_alarm}
                onChange={(e) =>
                  setForm({
                    ...form,
                    battery_low_alarm: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
          >
            <Save className="w-4 h-4" />
            {saving ? "Menyimpan..." : "Simpan Batas Alarm"}
          </button>

          {savedNotice && (
            <div className="p-2.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-semibold text-center">
              Batas alarm berhasil diperbarui ke database!
            </div>
          )}
        </form>

        {/* Alert Log Feed */}
        <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Riwayat Notifikasi & Kejadian Alarm
            </h3>
            <span className="text-xs text-slate-500">
              Total: {alerts.length} notifikasi
            </span>
          </div>

          <div className="space-y-3">
            {alerts.length > 0 ? (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    alert.acknowledged
                      ? "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-75"
                      : "bg-rose-500/5 border-rose-500/30"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          alert.severity === "critical"
                            ? "bg-rose-600 text-white"
                            : alert.severity === "warning"
                            ? "bg-amber-500 text-slate-950"
                            : "bg-sky-500 text-white"
                        }`}
                      >
                        {alert.severity}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {alert.title}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {alert.message}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 font-mono">
                      <span>
                        Waktu: {new Date(alert.ts).toLocaleString("id-ID")}
                      </span>
                      {alert.metric_value && (
                        <span>Nilai: {alert.metric_value}</span>
                      )}
                      {alert.threshold_value && (
                        <span>Batas: {alert.threshold_value}</span>
                      )}
                    </div>
                  </div>

                  {!alert.acknowledged ? (
                    <button
                      type="button"
                      onClick={() => onAcknowledgeAlert(alert.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shrink-0 transition"
                    >
                      Tandai Selesai
                    </button>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-500 shrink-0">
                      ✓ Acknowledged
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-500">
                Belum ada riwayat alarm yang tercatat pada database.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
