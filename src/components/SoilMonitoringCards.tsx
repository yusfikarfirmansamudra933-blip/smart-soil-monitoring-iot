"use client";

import React from "react";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Droplets,
  FlaskConical,
  Sliders,
  Thermometer,
  Unplug,
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
  convertDmsRawToPercent,
  evaluateMoistureCategory,
  evaluatePhCategory,
  evaluateTemperatureCategory,
} from "@/lib/sensor-drivers";

interface SoilMonitoringProps {
  latest: SoilTelemetryRecord | null;
  history: SoilTelemetryRecord[];
  deviceStatus: SoilDeviceStatus;
  config: SoilDeviceConfig;
  detailedView?: boolean;
  onToggleDmsCalibrated?: (calibrated: boolean) => void;
}

function formatTime(iso: string | null | undefined) {
  if (!iso) return "Belum ada data";
  try {
    return new Date(iso).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}

function SensorConnectionBadge({ status }: { status: string }) {
  if (status === "online") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Sensor Online
      </span>
    );
  }
  if (status === "uncalibrated") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
        <Sliders className="w-3.5 h-3.5" />
        Raw Mode (Uncalibrated)
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
      <Unplug className="w-3.5 h-3.5" />
      Sensor Not Connected
    </span>
  );
}

export function SoilMonitoringCards({
  latest,
  history,
  deviceStatus,
  config,
  detailedView = false,
  onToggleDmsCalibrated,
}: SoilMonitoringProps) {
  const phStatus =
    latest?.sensor_status?.ph || deviceStatus.sensor_ph_status || "not_connected";
  const dmsStatus =
    latest?.sensor_status?.dms ||
    deviceStatus.sensor_dms_status ||
    "not_connected";
  const tempStatus =
    latest?.sensor_status?.temperature ||
    deviceStatus.sensor_temp_status ||
    "not_connected";

  const phValue = phStatus === "not_connected" ? null : latest?.soil_ph ?? null;
  const dmsRaw =
    dmsStatus === "not_connected" ? null : latest?.soil_dms_raw ?? null;
  const moisturePct =
    dmsStatus === "not_connected"
      ? null
      : config.dms_calibrated
      ? latest?.soil_moisture ?? convertDmsRawToPercent(dmsRaw, config)
      : null;
  const tempValue =
    tempStatus === "not_connected" ? null : latest?.soil_temperature ?? null;

  const phEval = evaluatePhCategory(phValue, phStatus);
  const moistureEval = evaluateMoistureCategory(
    moisturePct,
    dmsRaw,
    dmsStatus,
    config.dms_calibrated
  );
  const tempEval = evaluateTemperatureCategory(tempValue, tempStatus);

  const chartData = history.slice(-18).map((item) => ({
    time: new Date(item.ts).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    ph: item.soil_ph,
    moisture: config.dms_calibrated ? item.soil_moisture : item.soil_dms_raw,
    dmsRaw: item.soil_dms_raw,
    temperature: item.soil_temperature,
  }));

  const recentRows = [...history].reverse().slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Three Main Soil Monitoring Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CARD A: SOIL pH */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="p-5 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <FlaskConical className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      A. Soil pH
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Sensor pH Tanah Industrial (Modular Driver)
                  </p>
                </div>
              </div>
              <SensorConnectionBadge status={phStatus} />
            </div>

            {/* Value & Status */}
            <div className="flex items-baseline justify-between pt-2">
              <div>
                {phValue !== null ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                      {phValue.toFixed(2)}
                    </span>
                    <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                      pH
                    </span>
                  </div>
                ) : (
                  <div className="text-xl font-bold text-rose-500 dark:text-rose-400 py-2">
                    Sensor Not Connected
                  </div>
                )}
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {phEval.description}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-lg text-xs font-bold border ${phEval.badgeColor}`}
              >
                {phEval.label}
              </span>
            </div>

            {/* pH Scale Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <span>Asam (&lt; 6.0)</span>
                <span>Netral (6.0 - 7.2)</span>
                <span>Basa (&gt; 7.2)</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-gradient-to-r from-amber-500 via-emerald-500 to-sky-500 relative overflow-hidden">
                {phValue !== null && (
                  <div
                    className="absolute top-0 bottom-0 w-2 bg-white border-2 border-slate-900 rounded-full shadow"
                    style={{
                      left: `${Math.max(
                        2,
                        Math.min(96, ((phValue - 3.5) / 6.5) * 100)
                      )}%`,
                    }}
                  />
                )}
              </div>
            </div>

            {/* Mini Chart */}
            <div className="h-36 w-full pt-2">
              {chartData.length > 0 && phValue !== null ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="phGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#3383f5"
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="95%"
                          stopColor="#3383f5"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#3a4a61"
                      opacity={0.2}
                    />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 10 }}
                      stroke="#62758f"
                    />
                    <YAxis
                      domain={[4, 9]}
                      tick={{ fontSize: 10 }}
                      stroke="#62758f"
                      width={28}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#202c3d",
                        borderColor: "#3a4a61",
                        color: "#f8fafc",
                        fontSize: "12px",
                        borderRadius: "8px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="ph"
                      name="Soil pH"
                      stroke="#3383f5"
                      strokeWidth={2}
                      fill="url(#phGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-xs text-slate-500">
                  Menunggu koneksi & integrasi sensor pH tanah...
                </div>
              )}
            </div>

            {/* Recent History Snippet */}
            <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                <span>Riwayat Pengukuran Terakhir</span>
                <span className="font-normal text-slate-400">
                  Batas Alarm: {config.ph_min_alarm} – {config.ph_max_alarm}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {recentRows.slice(0, 3).map((r, idx) => (
                  <div
                    key={idx}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs flex flex-col"
                  >
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {r.soil_ph !== null ? `${r.soil_ph.toFixed(2)} pH` : "N/A"}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(r.ts).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="px-5 py-3 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-500" />
              Update: {formatTime(latest?.ts)}
            </span>
            <span className="font-mono text-[11px]">
              Mode: {config.ph_interface_mode}
            </span>
          </div>
        </div>

        {/* CARD B: SOIL MOISTURE / DMS */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="p-5 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Droplets className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      B. Soil Moisture / DMS
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Capacitive Soil Moisture Sensor + DMS (ADC1)
                  </p>
                </div>
              </div>
              <SensorConnectionBadge status={dmsStatus} />
            </div>

            {/* Value & Calibration Display */}
            <div className="flex items-baseline justify-between pt-2">
              <div>
                {dmsStatus === "not_connected" ||
                (moisturePct === null && dmsRaw === null) ? (
                  <div className="text-xl font-bold text-rose-500 dark:text-rose-400 py-2">
                    Sensor Not Connected
                  </div>
                ) : config.dms_calibrated && moisturePct !== null ? (
                  <div className="space-y-0.5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        {moisturePct.toFixed(1)}
                      </span>
                      <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                        % RH Tanah
                      </span>
                    </div>
                    <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
                      Nilai Sensor DMS (Raw): {dmsRaw ?? "-"}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-extrabold tracking-tight text-indigo-600 dark:text-indigo-400">
                        {dmsRaw}
                      </span>
                      <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500">
                        RAW DMS VALUE
                      </span>
                    </div>
                    <div className="text-xs text-amber-600 dark:text-amber-400">
                      Menampilkan nilai mentah sampai proses kalibrasi selesai
                    </div>
                  </div>
                )}
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {moistureEval.description}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-lg text-xs font-bold border ${moistureEval.badgeColor}`}
              >
                {moistureEval.label}
              </span>
            </div>

            {/* Quick toggle between Raw DMS & Calibrated % */}
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/70 text-xs">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Mode Output DMS:{" "}
                <strong>
                  {config.dms_calibrated
                    ? "Terkalibrasi (% + Raw)"
                    : "Data Mentah (Raw Only)"}
                </strong>
              </span>
              {onToggleDmsCalibrated && (
                <button
                  type="button"
                  onClick={() => onToggleDmsCalibrated(!config.dms_calibrated)}
                  className="px-2.5 py-1 rounded-md font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition text-[11px]"
                >
                  Ubah ke {config.dms_calibrated ? "Raw Mode" : "Kalibrasi %"}
                </button>
              )}
            </div>

            {/* Mini Chart */}
            <div className="h-36 w-full pt-1">
              {chartData.length > 0 &&
              (moisturePct !== null || dmsRaw !== null) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="dmsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#1f66e0"
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="95%"
                          stopColor="#1f66e0"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#3a4a61"
                      opacity={0.2}
                    />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 10 }}
                      stroke="#62758f"
                    />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      stroke="#62758f"
                      width={34}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#202c3d",
                        borderColor: "#3a4a61",
                        color: "#f8fafc",
                        fontSize: "12px",
                        borderRadius: "8px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="moisture"
                      name={
                        config.dms_calibrated ? "Moisture (%)" : "DMS Raw"
                      }
                      stroke="#1f66e0"
                      strokeWidth={2}
                      fill="url(#dmsGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-xs text-slate-500">
                  Menunggu koneksi & integrasi sensor DMS...
                </div>
              )}
            </div>

            {/* Recent History Snippet */}
            <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                <span>Riwayat Pengukuran DMS</span>
                <span className="font-normal text-slate-400">
                  Dry: {config.dms_raw_dry} | Wet: {config.dms_raw_wet}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {recentRows.slice(0, 3).map((r, idx) => (
                  <div
                    key={idx}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs flex flex-col"
                  >
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {config.dms_calibrated && r.soil_moisture !== null
                        ? `${r.soil_moisture.toFixed(1)}%`
                        : r.soil_dms_raw !== null
                        ? `Raw: ${r.soil_dms_raw}`
                        : "N/A"}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(r.ts).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="px-5 py-3 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-500" />
              Update: {formatTime(latest?.ts)}
            </span>
            <span className="font-mono text-[11px]">
              Mode: {config.dms_interface_mode}
            </span>
          </div>
        </div>

        {/* CARD C: SOIL TEMPERATURE (DS18B20 WATERPROOF) */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="p-5 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Thermometer className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      C. Soil Temperature
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Sensor DS18B20 Waterproof (OneWire Digital)
                  </p>
                </div>
              </div>
              <SensorConnectionBadge status={tempStatus} />
            </div>

            {/* Value & Status */}
            <div className="flex items-baseline justify-between pt-2">
              <div>
                {tempValue !== null ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                      {tempValue.toFixed(1)}
                    </span>
                    <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                      °C
                    </span>
                  </div>
                ) : (
                  <div className="text-xl font-bold text-rose-500 dark:text-rose-400 py-2">
                    Sensor Not Connected
                  </div>
                )}
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {tempEval.description}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-lg text-xs font-bold border ${tempEval.badgeColor}`}
              >
                {tempEval.label}
              </span>
            </div>

            {/* Temperature Range Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <span>Dingin (&lt; 18°C)</span>
                <span>Optimal (18 - 33°C)</span>
                <span>Panas (&gt; 33°C)</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-gradient-to-r from-sky-500 via-emerald-500 to-rose-500 relative overflow-hidden">
                {tempValue !== null && (
                  <div
                    className="absolute top-0 bottom-0 w-2 bg-white border-2 border-slate-900 rounded-full shadow"
                    style={{
                      left: `${Math.max(
                        2,
                        Math.min(96, ((tempValue - 10) / 35) * 100)
                      )}%`,
                    }}
                  />
                )}
              </div>
            </div>

            {/* Mini Chart */}
            <div className="h-36 w-full pt-2">
              {chartData.length > 0 && tempValue !== null ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#3383f5"
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="95%"
                          stopColor="#3383f5"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#3a4a61"
                      opacity={0.2}
                    />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 10 }}
                      stroke="#62758f"
                    />
                    <YAxis
                      domain={[15, 40]}
                      tick={{ fontSize: 10 }}
                      stroke="#62758f"
                      width={28}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#202c3d",
                        borderColor: "#3a4a61",
                        color: "#f8fafc",
                        fontSize: "12px",
                        borderRadius: "8px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="temperature"
                      name="Suhu Tanah (°C)"
                      stroke="#3383f5"
                      strokeWidth={2}
                      fill="url(#tempGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-xs text-slate-500">
                  Menunggu koneksi sensor DS18B20 Waterproof...
                </div>
              )}
            </div>

            {/* Recent History Snippet */}
            <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                <span>Riwayat Suhu DS18B20</span>
                <span className="font-normal text-slate-400">
                  Batas: {config.temp_min_alarm}°C – {config.temp_max_alarm}°C
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {recentRows.slice(0, 3).map((r, idx) => (
                  <div
                    key={idx}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs flex flex-col"
                  >
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {r.soil_temperature !== null
                        ? `${r.soil_temperature.toFixed(1)} °C`
                        : "N/A"}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(r.ts).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="px-5 py-3 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-500" />
              Update: {formatTime(latest?.ts)}
            </span>
            <span className="font-mono text-[11px]">OneWire GPIO 4</span>
          </div>
        </div>
      </div>

      {/* Detailed View section when user is on "Soil Monitoring" menu */}
      {detailedView && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Activity className="w-5 h-5 text-emerald-500" />
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                Log Pembacaan Sensor Tanah Terbaru
              </h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                  <th className="py-2.5 pr-3">Waktu</th>
                  <th className="py-2.5 px-3">Soil pH</th>
                  <th className="py-2.5 px-3">DMS Raw</th>
                  <th className="py-2.5 px-3">Moisture (%)</th>
                  <th className="py-2.5 pl-3">Suhu (°C)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {recentRows.length > 0 ? (
                  recentRows.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 pr-3 font-mono text-slate-500">
                        {formatTime(row.ts)}
                      </td>
                      <td className="py-2.5 px-3 font-semibold">
                        {row.soil_ph !== null ? row.soil_ph.toFixed(2) : "Not Connected"}
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        {row.soil_dms_raw !== null ? row.soil_dms_raw : "Not Connected"}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-emerald-600 dark:text-emerald-400">
                        {config.dms_calibrated && row.soil_moisture !== null
                          ? `${row.soil_moisture.toFixed(1)}%`
                          : "Raw Only"}
                      </td>
                      <td className="py-2.5 pl-3 font-semibold">
                        {row.soil_temperature !== null
                          ? `${row.soil_temperature.toFixed(1)} °C`
                          : "Not Connected"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-8 text-center text-slate-500"
                    >
                      <AlertCircle className="w-5 h-5 mx-auto mb-1 text-slate-400" />
                      Belum ada data pengukuran dari perangkat keras.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
