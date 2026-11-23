"use client";

import React from "react";
import {
  Battery,
  BatteryCharging,
  BatteryFull,
  BatteryLow,
  Cpu,
  ShieldAlert,
  Sun,
  Zap,
  ZapOff,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  SoilDeviceConfig,
  SoilDeviceStatus,
  SoilTelemetryRecord,
} from "@/lib/types";
import {
  determineChargingStatus,
  estimateBatteryPercentage,
} from "@/lib/sensor-drivers";

interface EnergyMonitoringProps {
  latest: SoilTelemetryRecord | null;
  history: SoilTelemetryRecord[];
  deviceStatus: SoilDeviceStatus;
  config: SoilDeviceConfig;
}

export function EnergyMonitoringView({
  latest,
  history,
  deviceStatus,
  config,
}: EnergyMonitoringProps) {
  const esp32Online = deviceStatus.esp32_status === "online";

  const batteryVoltage = esp32Online ? latest?.battery_voltage ?? null : null;
  const batteryCurrent = esp32Online ? latest?.battery_current ?? null : null;
  const batteryPower = esp32Online ? latest?.battery_power ?? null : null;
  const batteryPct = estimateBatteryPercentage(batteryVoltage);

  const solarVoltage = esp32Online ? latest?.solar_voltage ?? null : null;
  const solarCurrent = esp32Online ? latest?.solar_current ?? null : null;
  const solarPower = esp32Online ? latest?.solar_power ?? null : null;

  const chargingStatus = determineChargingStatus({
    esp32Online,
    batteryVoltage,
    solarVoltage,
    batteryLowThreshold: config.battery_low_alarm,
    explicitStatus: latest?.charging_status,
  });

  const statusBadgeStyle: Record<string, string> = {
    Charging:
      "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    "Battery Full":
      "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30",
    "Battery Low":
      "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
    Discharging:
      "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    "System Offline":
      "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-400",
    "Not Available":
      "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-400",
  };

  const chartData = history.slice(-24).map((r) => ({
    time: new Date(r.ts).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    battery_voltage: r.battery_voltage,
    solar_voltage: r.solar_voltage,
  }));

  const formatMetric = (val: number | null, unit: string) => {
    if (val === null || val === undefined || isNaN(val)) {
      return (
        <span className="text-base font-bold text-slate-400 dark:text-slate-500">
          Not Available
        </span>
      );
    }
    return (
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
          {val.toFixed(2)}
        </span>
        <span className="text-sm font-semibold text-slate-500">{unit}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <Sun className="w-6 h-6 text-emerald-500" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Solar & Battery Energy Monitoring
            </h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Spesifikasi Daya: 2× INA226 (Solar <code>0x40</code> &amp; Baterai{" "}
            <code>0x41</code>) • CN3791 MPPT Solar Charge Controller • Panel
            Surya • Baterai • Sekering &amp; Distribusi Daya
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div
            className={`px-4 py-2 rounded-xl border text-sm font-bold flex items-center gap-2 ${
              statusBadgeStyle[chargingStatus] ||
              statusBadgeStyle["Not Available"]
            }`}
          >
            {chargingStatus === "Charging" && (
              <BatteryCharging className="w-4 h-4" />
            )}
            {chargingStatus === "Battery Full" && (
              <BatteryFull className="w-4 h-4" />
            )}
            {chargingStatus === "Battery Low" && (
              <BatteryLow className="w-4 h-4" />
            )}
            {chargingStatus === "Discharging" && (
              <Battery className="w-4 h-4" />
            )}
            {chargingStatus === "System Offline" && (
              <ZapOff className="w-4 h-4" />
            )}
            Status: {chargingStatus}
          </div>
        </div>
      </div>

      {/* Strict Notice about No Fake Energy Data */}
      <div className="rounded-xl bg-emerald-950/20 border border-emerald-500/30 px-4 py-3 flex items-center gap-3 text-xs text-emerald-700 dark:text-emerald-300">
        <ShieldAlert className="w-4 h-4 shrink-0 text-emerald-500" />
        <span>
          <strong>Prinsip Integritas Data Energi:</strong> Sistem tidak membuat
          data energi palsu. Parameter yang belum memiliki sensor fisik
          pengukur arus/panel surya ditampilkan secara jujur sebagai{" "}
          <code className="font-bold">Not Available</code>.
        </span>
      </div>

      {/* 8 Energy Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Tegangan Baterai */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>1. Tegangan Baterai (12V 7Ah)</span>
            <Battery className="w-4 h-4 text-emerald-500" />
          </div>
          {formatMetric(batteryVoltage, "V")}
          <p className="text-[11px] text-slate-400">
            Batas Alarm Lemah: &lt; {config.battery_low_alarm} V
          </p>
        </div>

        {/* 2. Estimasi Persentase Baterai */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>2. Estimasi Kapasitas Baterai</span>
            <BatteryFull className="w-4 h-4 text-emerald-500" />
          </div>
          {batteryPct !== null ? (
            <div className="space-y-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  {batteryPct}
                </span>
                <span className="text-sm font-semibold text-slate-500">%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    batteryPct < 25
                      ? "bg-rose-500"
                      : batteryPct < 50
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                  style={{ width: `${batteryPct}%` }}
                />
              </div>
            </div>
          ) : (
            <span className="text-base font-bold text-slate-400 dark:text-slate-500 block pt-1">
              Not Available
            </span>
          )}
        </div>

        {/* 3. Arus Baterai */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>3. Arus Baterai (INA226 #2)</span>
            <Zap className="w-4 h-4 text-emerald-500" />
          </div>
          {formatMetric(batteryCurrent, "A")}
          <p className="text-[11px] text-slate-400">
            {batteryCurrent === null
              ? "INA226 #2 (0x41) belum terbaca"
              : "INA226 #2 (I2C 0x41) aktif"}
          </p>
        </div>

        {/* 4. Daya Baterai */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>4. Daya Baterai (INA226 #2)</span>
            <Cpu className="w-4 h-4 text-emerald-500" />
          </div>
          {formatMetric(batteryPower, "W")}
          <p className="text-[11px] text-slate-400">
            {batteryPower === null
              ? "Menunggu pembacaan INA226 #2"
              : "Kalkulasi V × I (0x41)"}
          </p>
        </div>

        {/* 5. Status Charging */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>5. Status Sistem Daya</span>
            <BatteryCharging className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="pt-1">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-bold border ${
                statusBadgeStyle[chargingStatus] ||
                statusBadgeStyle["Not Available"]
              }`}
            >
              {chargingStatus}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Controller: CN3791 MPPT Solar Charge Controller
          </p>
        </div>

        {/* 6. Tegangan Panel Surya */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>6. Tegangan Panel Surya (INA226 #1)</span>
            <Sun className="w-4 h-4 text-amber-500" />
          </div>
          {formatMetric(solarVoltage, "V")}
          <p className="text-[11px] text-slate-400">
            {solarVoltage === null
              ? "INA226 #1 (0x40) belum terbaca"
              : "Input PV ke CN3791 MPPT (0x40)"}
          </p>
        </div>

        {/* 7. Arus Panel Surya */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>7. Arus Panel Surya (INA226 #1)</span>
            <Sun className="w-4 h-4 text-amber-500" />
          </div>
          {formatMetric(solarCurrent, "A")}
          <p className="text-[11px] text-slate-400">
            {solarCurrent === null
              ? "INA226 #1 (0x40) belum terbaca"
              : "Arus DC Panel Surya (0x40)"}
          </p>
        </div>

        {/* 8. Daya Panel Surya */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>8. Daya Panel Surya (INA226 #1)</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          {formatMetric(solarPower, "W")}
          <p className="text-[11px] text-slate-400">
            {solarPower === null
              ? "INA226 #1 (0x40) belum terbaca"
              : "Daya PV real-time (INA226 #1)"}
          </p>
        </div>
      </div>

      {/* Battery Voltage History Chart */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Grafik Riwayat Tegangan Baterai 12V 7Ah
            </h3>
            <p className="text-xs text-slate-500">
              Pemantauan kestabilan suplai daya untuk ESP32 & Modem 4G
            </p>
          </div>
        </div>
        <div className="h-64 w-full">
          {chartData.length > 0 && batteryVoltage !== null ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="battGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="#3383f5"
                      stopOpacity={0.35}
                    />
                    <stop offset="95%" stopColor="#3383f5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#3a4a61"
                  opacity={0.2}
                />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 11 }}
                  stroke="#62758f"
                />
                <YAxis
                  domain={[10.5, 14.5]}
                  tick={{ fontSize: 11 }}
                  stroke="#62758f"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#202c3d",
                    borderColor: "#3a4a61",
                    color: "#f8fafc",
                    borderRadius: "10px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="battery_voltage"
                  name="Battery Voltage (V)"
                  stroke="#3383f5"
                  strokeWidth={2.5}
                  fill="url(#battGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-sm text-slate-500">
              Tidak ada data tegangan baterai (System Offline / Sensor Not
              Available).
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
