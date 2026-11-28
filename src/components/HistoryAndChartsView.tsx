"use client";

import React, { useMemo, useState } from "react";
import {
  Calendar,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  History,
  RefreshCw,
} from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  SoilDeviceConfig,
  SoilTelemetryRecord,
  TimeRangeOption,
} from "@/lib/types";

interface HistoryViewProps {
  history: SoilTelemetryRecord[];
  selectedRange: TimeRangeOption;
  onSelectRange: (range: TimeRangeOption) => void;
  config: SoilDeviceConfig;
  onRefresh: () => void;
}

const TIME_RANGES: { value: TimeRangeOption; label: string }[] = [
  { value: "1h", label: "1 Jam" },
  { value: "6h", label: "6 Jam" },
  { value: "24h", label: "24 Jam" },
  { value: "7d", label: "7 Hari" },
  { value: "30d", label: "30 Hari" },
];

export function HistoryAndChartsView({
  history,
  selectedRange,
  onSelectRange,
  config,
  onRefresh,
}: HistoryViewProps) {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [activeMetric, setActiveMetric] = useState<
    "all" | "ph" | "moisture" | "temp" | "battery"
  >("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filteredRecords = useMemo(() => {
    return history.filter((item) => {
      const t = new Date(item.ts).getTime();
      if (startDate) {
        const s = new Date(startDate).getTime();
        if (t < s) return false;
      }
      if (endDate) {
        const e = new Date(endDate).getTime() + 86399000;
        if (t > e) return false;
      }
      return true;
    });
  }, [history, startDate, endDate]);

  const chartData = useMemo(() => {
    return filteredRecords.map((item) => ({
      time: new Date(item.ts).toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
      soil_ph: item.soil_ph,
      soil_moisture: config.dms_calibrated
        ? item.soil_moisture
        : item.soil_dms_raw,
      soil_dms_raw: item.soil_dms_raw,
      soil_temperature: item.soil_temperature,
      battery_voltage: item.battery_voltage,
    }));
  }, [filteredRecords, config.dms_calibrated]);

  const reversedTable = useMemo(
    () => [...filteredRecords].reverse(),
    [filteredRecords]
  );
  const totalPages = Math.max(1, Math.ceil(reversedTable.length / pageSize));
  const pagedRows = reversedTable.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const sanitizeCsvCell = (val: unknown): string => {
    const str = String(val ?? "");
    if (/^[=+\-@\t\r]/.test(str)) {
      return `'${str}`;
    }
    return str.includes(",") ? `"${str.replace(/"/g, '""')}"` : str;
  };

  const escapeHtml = (val: unknown): string =>
    String(val ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const handleExportCSV = () => {
    const headers = [
      "Timestamp",
      "Device ID",
      "Mode",
      "Soil pH",
      "Soil Moisture (%)",
      "Soil DMS Raw",
      "Soil Temperature (C)",
      "Battery Voltage (V)",
      "Status Sensor pH",
      "Status Sensor DMS",
      "Status Sensor Temp",
    ];
    const rows = reversedTable.map((r) => [
      sanitizeCsvCell(r.ts),
      sanitizeCsvCell(r.device_id),
      "HARDWARE",
      r.soil_ph ?? "",
      r.soil_moisture ?? "",
      r.soil_dms_raw ?? "",
      r.soil_temperature ?? "",
      r.battery_voltage ?? "",
      sanitizeCsvCell(r.sensor_status?.ph ?? ""),
      sanitizeCsvCell(r.sensor_status?.dms ?? ""),
      sanitizeCsvCell(r.sensor_status?.temperature ?? ""),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `smart-soil-telemetry-LIVE-${selectedRange}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const printWin = window.open("", "_blank", "width=960,height=720");
    if (!printWin) {
      window.print();
      return;
    }

    const rowsHtml = reversedTable
      .slice(0, 50)
      .map(
        (r) => `
        <tr>
          <td>${escapeHtml(new Date(r.ts).toLocaleString("id-ID"))}</td>
          <td>${escapeHtml(r.device_id)}</td>
          <td>${r.soil_ph !== null ? r.soil_ph.toFixed(2) : "Not Connected"}</td>
          <td>${
            r.soil_moisture !== null
              ? r.soil_moisture.toFixed(1) + "%"
              : r.soil_dms_raw !== null
              ? "Raw: " + escapeHtml(r.soil_dms_raw)
              : "Not Connected"
          }</td>
          <td>${
            r.soil_temperature !== null
              ? r.soil_temperature.toFixed(1) + " °C"
              : "Not Connected"
          }</td>
          <td>${
            r.battery_voltage !== null
              ? r.battery_voltage.toFixed(2) + " V"
              : "Not Available"
          }</td>
        </tr>`
      )
      .join("");

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Laporan Riwayat Smart Soil Monitoring IoT</title>
          <style>
            body { font-family: Arial, sans-serif; color: #0f172a; padding: 24px; }
            h1 { color: #1f66e0; margin-bottom: 4px; }
            p { color: #475569; font-size: 13px; margin-top: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
            th { background-color: #f1f5f9; font-weight: bold; }
            .badge { display: inline-block; padding: 2px 8px; background: #fef3c7; color: #b45309; border-radius: 4px; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Smart Soil Monitoring IoT — Laporan Riwayat Pengukuran</h1>
          <p>Rentang Waktu: ${selectedRange.toUpperCase()} | Mode Data: <span class="badge">LIVE HARDWARE</span> | Dicetak: ${new Date().toLocaleString("id-ID")}</p>
          <table>
            <thead>
              <tr>
                <th>Waktu Pengukuran</th>
                <th>Device ID</th>
                <th>Soil pH</th>
                <th>Soil Moisture (DMS)</th>
                <th>Soil Temperature</th>
                <th>Battery Voltage</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Controls & Time Range Bar */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <History className="w-6 h-6 text-emerald-500" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Grafik Interaktif & Riwayat Data Historis
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Soil pH • Soil Moisture DMS • Soil Temperature • Battery Voltage
              </p>
            </div>
          </div>

          {/* Time Range Buttons: 1h, 6h, 24h, 7d, 30d */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
              {TIME_RANGES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => {
                    onSelectRange(r.value);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    selectedRange === r.value
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-300 hover:text-emerald-500"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onRefresh}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-slate-600 dark:text-slate-300 transition"
              title="Muat Ulang Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export CSV
            </button>

            <button
              type="button"
              onClick={handleExportPDF}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white dark:bg-slate-700 dark:hover:bg-slate-600 transition shadow-sm"
            >
              <FileText className="w-4 h-4" />
              Export PDF
            </button>
          </div>
        </div>

        {/* Date Filter & Metric Filter */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300">
              <Calendar className="w-4 h-4 text-emerald-500" />
              Filter Tanggal:
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
            />
            <span className="text-slate-400">s/d</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
            />
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                className="text-xs text-rose-500 hover:underline font-semibold"
              >
                Reset Tanggal
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-emerald-500 mr-1" />
            {[
              { id: "all", label: "Semua Grafik (4)" },
              { id: "ph", label: "Soil pH" },
              { id: "moisture", label: "Soil Moisture DMS" },
              { id: "temp", label: "Soil Temperature" },
              { id: "battery", label: "Battery Voltage" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  setActiveMetric(
                    tab.id as "all" | "ph" | "moisture" | "temp" | "battery"
                  )
                }
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  activeMetric === tab.id
                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40"
                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(activeMetric === "all" || activeMetric === "ph") && (
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                1. Grafik Perubahan Soil pH ({selectedRange})
              </h3>
              <span className="text-xs text-emerald-500 font-semibold">
                Rentang Normal: {config.ph_min_alarm} – {config.ph_max_alarm} pH
              </span>
            </div>
            <div className="h-64 w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
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
                      tick={{ fontSize: 11 }}
                      stroke="#62758f"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#202c3d",
                        borderColor: "#3a4a61",
                        color: "#f8fafc",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="soil_ph"
                      name="Soil pH"
                      stroke="#3383f5"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">
                  Tidak ada data historis pada rentang ini.
                </div>
              )}
            </div>
          </div>
        )}

        {(activeMetric === "all" || activeMetric === "moisture") && (
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                2. Grafik Perubahan Soil Moisture DMS ({selectedRange})
              </h3>
              <span className="text-xs text-emerald-500 font-semibold">
                {config.dms_calibrated
                  ? "Terukur dalam % Kelembapan"
                  : "Nilai Mentah (Raw DMS)"}
              </span>
            </div>
            <div className="h-64 w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
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
                    <YAxis tick={{ fontSize: 11 }} stroke="#62758f" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#202c3d",
                        borderColor: "#3a4a61",
                        color: "#f8fafc",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="soil_moisture"
                      name={
                        config.dms_calibrated
                          ? "Soil Moisture DMS (%)"
                          : "Soil DMS (Raw)"
                      }
                      stroke="#1f66e0"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">
                  Tidak ada data historis pada rentang ini.
                </div>
              )}
            </div>
          </div>
        )}

        {(activeMetric === "all" || activeMetric === "temp") && (
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                3. Grafik Perubahan Soil Temperature DS18B20 ({selectedRange})
              </h3>
              <span className="text-xs text-emerald-500 font-semibold">
                Satuan: °C
              </span>
            </div>
            <div className="h-64 w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
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
                      tick={{ fontSize: 11 }}
                      stroke="#62758f"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#202c3d",
                        borderColor: "#3a4a61",
                        color: "#f8fafc",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="soil_temperature"
                      name="Soil Temperature (°C)"
                      stroke="#59a2fb"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">
                  Tidak ada data historis pada rentang ini.
                </div>
              )}
            </div>
          </div>
        )}

        {(activeMetric === "all" || activeMetric === "battery") && (
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                4. Grafik Perubahan Battery Voltage 12V ({selectedRange})
              </h3>
              <span className="text-xs text-emerald-500 font-semibold">
                Baterai 12V 7Ah
              </span>
            </div>
            <div className="h-64 w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
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
                      domain={[10.5, 14.5]}
                      tick={{ fontSize: 11 }}
                      stroke="#62758f"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#202c3d",
                        borderColor: "#3a4a61",
                        color: "#f8fafc",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="battery_voltage"
                      name="Battery Voltage (V)"
                      stroke="#3383f5"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">
                  Tidak ada data historis pada rentang ini.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* History Data Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Tabel Riwayat Pengukuran Lengkap ({reversedTable.length} Baris)
            </h3>
            <p className="text-xs text-slate-500">
              Menampilkan data Perangkat Keras Nyata dari PostgreSQL
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
            >
              <Download className="w-3.5 h-3.5" />
              Unduh CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[11px]">
                <th className="py-3 pr-3">Waktu</th>
                <th className="py-3 px-3">Device ID</th>
                <th className="py-3 px-3">Soil pH</th>
                <th className="py-3 px-3">Soil Moisture (DMS)</th>
                <th className="py-3 px-3">DMS Raw</th>
                <th className="py-3 px-3">Soil Temp (°C)</th>
                <th className="py-3 px-3">Battery (V)</th>
                <th className="py-3 pl-3">Status Sensor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {pagedRows.length > 0 ? (
                pagedRows.map((row, idx) => (
                  <tr
                    key={row.id || idx}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <td className="py-3 pr-3 font-mono text-slate-600 dark:text-slate-300">
                      {new Date(row.ts).toLocaleString("id-ID")}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold">{row.device_id}</span>
                    </td>
                    <td className="py-3 px-3 font-bold">
                      {row.soil_ph !== null
                        ? row.soil_ph.toFixed(2)
                        : "Sensor Not Connected"}
                    </td>
                    <td className="py-3 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                      {config.dms_calibrated && row.soil_moisture !== null
                        ? `${row.soil_moisture.toFixed(1)}%`
                        : "Uncalibrated (Raw)"}
                    </td>
                    <td className="py-3 px-3 font-mono">
                      {row.soil_dms_raw !== null
                        ? row.soil_dms_raw
                        : "Not Connected"}
                    </td>
                    <td className="py-3 px-3 font-bold">
                      {row.soil_temperature !== null
                        ? `${row.soil_temperature.toFixed(1)} °C`
                        : "Sensor Not Connected"}
                    </td>
                    <td className="py-3 px-3 font-bold">
                      {row.battery_voltage !== null
                        ? `${row.battery_voltage.toFixed(2)} V`
                        : "Not Available"}
                    </td>
                    <td className="py-3 pl-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        pH:{row.sensor_status?.ph} | DMS:
                        {row.sensor_status?.dms} | T:
                        {row.sensor_status?.temperature}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Belum ada data historis pada periode waktu yang dipilih.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
          <span>
            Halaman {page} dari {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
            >
              Sebelumnya
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
            >
              Berikutnya
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
