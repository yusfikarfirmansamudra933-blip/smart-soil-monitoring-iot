"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BatteryCharging,
  Bell,
  Clock,
  Cpu,
  Download,
  History,
  Info,
  LayoutDashboard,
  Menu,
  Moon,
  Radio,
  RefreshCw,
  Settings,
  Sprout,
  Sun,
  Thermometer,
  WifiOff,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import {
  NavSection,
  SoilAlertRecord,
  SoilDeviceConfig,
  SoilDeviceStatus,
  SoilTelemetryRecord,
  TimeRangeOption,
} from "@/lib/types";
import { DEFAULT_CONFIG } from "@/lib/default-config";
import {
  determineChargingStatus,
  estimateBatteryPercentage,
} from "@/lib/sensor-drivers";
import { DEFAULT_DEVICE_ID, supabase } from "@/lib/supabase";
import { SoilMonitoringCards } from "@/components/SoilMonitoringCards";
import { EnergyMonitoringView } from "@/components/EnergyMonitoringView";
import { HistoryAndChartsView } from "@/components/HistoryAndChartsView";
import { AlertsView } from "@/components/AlertsView";
import { DeviceManagementView } from "@/components/DeviceManagementView";
import { AboutProjectView, SettingsView } from "@/components/SettingsAndAboutView";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const NAV_ITEMS: {
  id: NavSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "soil", label: "Soil Monitoring", icon: Sprout },
  { id: "energy", label: "Energy Monitoring", icon: Zap },
  { id: "history", label: "Data History", icon: History },
  { id: "alerts", label: "Alerts", icon: Bell },
  { id: "device", label: "Device Management", icon: Wrench },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "about", label: "About Project", icon: Info },
];

export default function SmartSoilMonitoringApp() {
  const [activeNav, setActiveNav] = useState<NavSection>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  const [selectedRange, setSelectedRange] = useState<TimeRangeOption>("24h");
  const [config, setConfig] = useState<SoilDeviceConfig>(DEFAULT_CONFIG);

  // Live Hardware State
  const [liveLatest, setLiveLatest] = useState<SoilTelemetryRecord | null>(
    null
  );
  const [liveHistory, setLiveHistory] = useState<SoilTelemetryRecord[]>([]);
  const [liveDeviceStatus, setLiveDeviceStatus] = useState<SoilDeviceStatus>({
    device_id: DEFAULT_DEVICE_ID,
    name: "Smart Soil Station #1",
    location: "Blok A - Lahan Pertanian Utama",
    firmware_version: "v1.2.0-esp32-4g",
    esp32_status: "offline",
    modem_status: "disconnected",
    signal_rssi: null,
    sensor_ph_status: "not_connected",
    sensor_dms_status: "not_connected",
    sensor_temp_status: "not_connected",
    uptime_seconds: 0,
    last_seen: null,
    is_stale: true,
  });
  const [liveAlerts, setLiveAlerts] = useState<SoilAlertRecord[]>([]);

  // Network & PWA states
  const [isBrowserOffline, setIsBrowserOffline] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  // Sync Dark Mode class with <html>
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [darkMode]);

  // Register Service Worker & Offline listeners for PWA
  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsBrowserOffline(!navigator.onLine);
    const handleOnline = () => setIsBrowserOffline(false);
    const handleOffline = () => setIsBrowserOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Service worker registration optional in dev
      });
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  // Fetch Real Hardware Data & Config from REST API + Supabase
  const fetchHardwareData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [latestRes, historyRes, statusRes, configRes, alertsRes] =
        await Promise.all([
          fetch(
            `/api/v1/telemetry/latest?device_id=${DEFAULT_DEVICE_ID}&is_demo=false`
          ),
          fetch(
            `/api/v1/telemetry/history?device_id=${DEFAULT_DEVICE_ID}&range=${selectedRange}&is_demo=false`
          ),
          fetch(`/api/v1/device/status?device_id=${DEFAULT_DEVICE_ID}`),
          fetch(`/api/v1/device/config?device_id=${DEFAULT_DEVICE_ID}`),
          supabase
            .from("soil_alerts")
            .select("*")
            .eq("device_id", DEFAULT_DEVICE_ID)
            .eq("is_demo", false)
            .order("ts", { ascending: false })
            .limit(30),
        ]);

      if (latestRes.ok) {
        const latestJson = await latestRes.json();
        // Do not show stale old data as live if device is offline/stale
        setLiveLatest(latestJson.telemetry || null);
      }

      if (historyRes.ok) {
        const histJson = await historyRes.json();
        setLiveHistory(histJson.records || []);
      }

      if (statusRes.ok) {
        const statusJson = await statusRes.json();
        setLiveDeviceStatus(statusJson);
      }

      if (configRes.ok) {
        const cfgJson = await configRes.json();
        if (cfgJson.config) {
          setConfig(cfgJson.config);
        }
      }

      if (alertsRes.data) {
        setLiveAlerts(alertsRes.data as SoilAlertRecord[]);
      }
    } catch {
      // Handled by offline banner
    } finally {
      setLoadingData(false);
    }
  }, [selectedRange]);

  useEffect(() => {
    fetchHardwareData();
  }, [fetchHardwareData]);

  // Subscribe to Supabase Realtime for instant hardware telemetry updates
  useEffect(() => {
    const channel = supabase
      .channel("soil-realtime-stream")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "soil_telemetry",
        },
        (payload) => {
          const newRow = payload.new as SoilTelemetryRecord;
          if (!newRow.is_demo && newRow.device_id === DEFAULT_DEVICE_ID) {
            setLiveLatest(newRow);
            setLiveHistory((prev) => [...prev, newRow]);
            fetchHardwareData();
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "soil_devices",
        },
        () => {
          fetchHardwareData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchHardwareData]);

  // Active Live Hardware Data
  const activeHistory = liveHistory;
  const activeLatest =
    liveDeviceStatus.esp32_status === "online" ? liveLatest : null; // Prevent showing stale data as real-time when ESP32 is offline
  const activeDeviceStatus = liveDeviceStatus;
  const activeAlerts = liveAlerts;

  const unacknowledgedCount = activeAlerts.filter(
    (a) => !a.acknowledged
  ).length;

  const handleSaveConfig = async (
    updated: Partial<SoilDeviceConfig>,
    identity?: { name: string; location: string; firmware_version: string }
  ) => {
    const merged = { ...config, ...updated };
    setConfig(merged);
    await fetch("/api/v1/device/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...merged,
        device_id: DEFAULT_DEVICE_ID,
        device_identity: identity,
      }),
    });
    await fetchHardwareData();
  };

  const handleAcknowledgeAlert = async (id: number) => {
    await supabase
      .from("soil_alerts")
      .update({ acknowledged: true })
      .eq("id", id);
    await fetchHardwareData();
  };

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      setDeferredPrompt(null);
    } else {
      alert(
        "Aplikasi PWA sudah siap! Di Android Chrome, ketuk menu titik tiga (⋮) lalu pilih 'Tambahkan ke Layar Utama / Install App'."
      );
    }
  };

  const batteryPct = estimateBatteryPercentage(
    activeLatest?.battery_voltage ?? null
  );
  const chargingStatus = determineChargingStatus({
    esp32Online: activeDeviceStatus.esp32_status === "online",
    batteryVoltage: activeLatest?.battery_voltage ?? null,
    solarVoltage: activeLatest?.solar_voltage ?? null,
    batteryLowThreshold: config.battery_low_alarm,
    explicitStatus: activeLatest?.charging_status,
  });

  const modemQuotaMb =
    activeLatest?.modem_quota_mb ?? activeDeviceStatus.modem_quota_mb ?? null;
  const modemCreditRp =
    activeLatest?.modem_credit_rp ?? activeDeviceStatus.modem_credit_rp ?? null;
  const quotaMinMb = config.modem_quota_min_mb ?? 500;
  const creditMinRp = config.modem_credit_min_rp ?? 10000;
  const isModemQuotaLow =
    (modemQuotaMb !== null && modemQuotaMb < quotaMinMb) ||
    (modemCreditRp !== null && modemCreditRp < creditMinRp);
  const isBuzzerRinging = Boolean(
    activeLatest?.buzzer_active ??
      activeDeviceStatus.buzzer_active ??
      (config.buzzer_enabled !== false && isModemQuotaLow)
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-transparent text-slate-900 dark:text-slate-100">
      {/* Desktop Sidebar Navigation */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 glass-surface text-slate-800 dark:text-slate-100 border-r border-slate-200/70 dark:border-white/5 z-30 no-print">
        <div className="p-5 border-b border-slate-200/70 dark:border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-md shadow-emerald-600/20">
            <Sprout className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wide text-slate-900 dark:text-white">
              Smart Soil IoT
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              ESP32 • 4G LTE • Solar
            </p>
          </div>
        </div>

        <div className="px-5 pt-5 pb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Menu
        </div>
        <nav className="flex-1 px-4 pb-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeNav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveNav(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-[13px] font-medium transition ${
                  active
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-1 ring-inset ring-emerald-500/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  {item.label}
                </span>
                {item.id === "alerts" && unacknowledgedCount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] rounded-full bg-rose-500 text-white font-extrabold">
                    {unacknowledgedCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Hardware Summary Footer */}
        <div className="p-4 m-3 rounded-xl bg-slate-100/70 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/5 space-y-2 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400 uppercase">Status ESP32</span>
            <span
              className={`font-bold flex items-center gap-1.5 ${
                activeDeviceStatus.esp32_status === "online"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-500 dark:text-rose-400"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {activeDeviceStatus.esp32_status.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400 uppercase">Jaringan 4G</span>
            <span
              className={`font-bold flex items-center gap-1.5 ${
                activeDeviceStatus.modem_status === "connected"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-500 dark:text-rose-400"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {activeDeviceStatus.modem_status.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400 uppercase">Database</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-mono">Supabase PG17</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen pb-20 lg:pb-8">
        {/* Offline Network Warning Banner */}
        {isBrowserOffline && (
          <div className="bg-rose-600 text-white px-4 py-2.5 text-xs font-bold flex items-center justify-center gap-2">
            <WifiOff className="w-4 h-4" />
            Koneksi Internet Perangkat Anda Terputus (PWA Offline Mode). Data
            lama tidak ditampilkan sebagai real-time.
          </div>
        )}

        {/* Top Industrial Header */}
        <header className="sticky top-0 z-20 glass-surface border-b border-slate-200/70 dark:border-white/5 px-4 lg:px-8 py-3.5 no-print">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Mobile Menu Button & Title */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-lg bg-slate-100/80 dark:bg-white/5 text-slate-700 dark:text-slate-200 border border-slate-200/70 dark:border-white/10"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-base sm:text-lg text-slate-900 dark:text-white">
                    Smart Soil Monitoring IoT
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    LIVE HARDWARE
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                  {activeDeviceStatus.name} • {activeDeviceStatus.location}
                </p>
              </div>
            </div>

            {/* Right Controls: PWA Install, Refresh, Theme */}
            <div className="flex items-center gap-2">

              <button
                type="button"
                onClick={fetchHardwareData}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500/20 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition"
                title="Sinkronisasi Data"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loadingData ? "animate-spin" : ""}`}
                />
              </button>

              <button
                type="button"
                onClick={handleInstallPwa}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-xs font-bold border border-slate-200 dark:border-slate-700 transition"
              >
                <Download className="w-3.5 h-3.5" />
                PWA
              </button>

              <button
                type="button"
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
                title="Ubah Dark / Light Mode"
              >
                {darkMode ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-700" />
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Slide-Over Menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-72 max-w-full glass-surface-strong text-slate-800 dark:text-white h-full flex flex-col justify-between z-10 border-r border-slate-200/70 dark:border-white/5">
              <div className="flex-1 p-5 flex flex-col justify-between">
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-white/5 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                      <Sprout className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-semibold text-sm">Smart Soil IoT</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 rounded-lg bg-slate-100/80 dark:bg-white/5 border border-slate-200/70 dark:border-white/10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1">
                  {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveNav(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-[13px] font-medium ${
                          activeNav === item.id
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-1 ring-inset ring-emerald-500/20"
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <Icon className="w-4 h-4" />
                          {item.label}
                        </span>
                        {item.id === "alerts" && unacknowledgedCount > 0 && (
                          <span className="px-2 py-0.5 text-[10px] rounded-full bg-rose-500 text-white">
                            {unacknowledgedCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={handleInstallPwa}
                className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Install Aplikasi Android (PWA)
              </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Workspace Container */}
        <main className="flex-1 px-4 lg:px-8 py-6 space-y-6 max-w-7xl w-full mx-auto">
          {/* Industrial Telemetry Status Ribbon (Always visible on Dashboard) */}
          {activeNav === "dashboard" && (
            <>
              {/* Live Hardware Offline Banner */}
              {liveDeviceStatus.esp32_status !== "online" && (
                <div className="rounded-2xl bg-rose-500/10 border border-rose-500/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400">
                        Perangkat Keras ESP32 Belum Terhubung / Offline
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Sesuai ketentuan sistem, data lama tidak ditampilkan
                        seolah-olah real-time dan sensor yang belum
                        terintegrasi menampilkan status{" "}
                        <strong>Sensor Not Connected</strong>. Anda dapat
                        menguji pengiriman data pada menu{" "}
                        <strong>Device Management</strong>.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveNav("device")}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-emerald-600 text-white text-xs font-bold shrink-0 transition"
                  >
                    Buka Uji Telemetri ESP32
                  </button>
                </div>
              )}

              {/* 7 Industrial Status Indicators Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3.5">
                {/* 1. Status ESP32 */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-xl ${
                      activeDeviceStatus.esp32_status === "online"
                        ? "bg-emerald-500/15 text-emerald-500"
                        : "bg-rose-500/15 text-rose-500"
                    }`}
                  >
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">
                      Status ESP32
                    </span>
                    <span className="font-extrabold text-xs uppercase">
                      {activeDeviceStatus.esp32_status}
                    </span>
                  </div>
                </div>

                {/* 2. Status Koneksi 4G */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-xl ${
                      activeDeviceStatus.modem_status === "connected"
                        ? "bg-emerald-500/15 text-emerald-500"
                        : "bg-rose-500/15 text-rose-500"
                    }`}
                  >
                    <Radio className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">
                      Koneksi Modem 4G
                    </span>
                    <span className="font-extrabold text-xs uppercase">
                      {activeDeviceStatus.modem_status === "connected"
                        ? `4G Online (${activeDeviceStatus.signal_rssi ?? -68} dBm)`
                        : "Disconnected"}
                    </span>
                  </div>
                </div>

                {/* 3. Waktu Terakhir Menerima Data */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-500">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">
                      Data Terakhir Diterima
                    </span>
                    <span className="font-bold text-xs">
                      {activeLatest?.ts
                        ? new Date(activeLatest.ts).toLocaleTimeString(
                            "id-ID",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            }
                          )
                        : "Belum Ada Data"}
                    </span>
                  </div>
                </div>

                {/* 4. Status Baterai 12V 7Ah */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-500">
                    <BatteryCharging className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">
                      Baterai 12V 7Ah
                    </span>
                    <span className="font-extrabold text-xs">
                      {activeLatest?.battery_voltage !== null &&
                      activeLatest?.battery_voltage !== undefined
                        ? `${activeLatest.battery_voltage.toFixed(2)}V (${
                            batteryPct ?? 0
                          }%)`
                        : "Not Available"}
                    </span>
                  </div>
                </div>

                {/* 5. Status Tenaga Surya */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-500">
                    <Sun className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">
                      CN3791 &amp; 2× INA226
                    </span>
                    <span className="font-extrabold text-xs">
                      {chargingStatus}
                    </span>
                  </div>
                </div>

                {/* 6. Sisa Kuota Modem 4G & Active Buzzer */}
                <button
                  type="button"
                  onClick={() => setActiveNav("device")}
                  className={`p-4 rounded-2xl border flex items-center gap-3 text-left transition hover:border-emerald-500/50 ${
                    isBuzzerRinging
                      ? "bg-rose-500/10 border-rose-500/40"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                  }`}
                  title="Klik untuk atur batas kuota di Device Management"
                >
                  <div
                    className={`p-2.5 rounded-xl ${
                      isBuzzerRinging
                        ? "bg-rose-500/20 text-rose-500 animate-pulse"
                        : "bg-emerald-500/15 text-emerald-500"
                    }`}
                  >
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">
                      Sisa Kuota Modem 4G
                    </span>
                    <span
                      className={`font-extrabold text-xs ${
                        isBuzzerRinging
                          ? "text-rose-600 dark:text-rose-400"
                          : ""
                      }`}
                    >
                      {modemQuotaMb !== null
                        ? `${modemQuotaMb} MB · ${
                            isBuzzerRinging ? "BUZZER ON" : "AMAN"
                          }`
                        : "Not Available"}
                    </span>
                  </div>
                </button>

                {/* 7. Suhu Hardware (ESP32-S3 Internal Temp) */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-sky-500/15 text-sky-500">
                    <Thermometer className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">
                      Suhu Hardware
                    </span>
                    <span className="font-extrabold text-xs">
                      {activeLatest?.hardware_temperature !== null &&
                      activeLatest?.hardware_temperature !== undefined
                        ? `${activeLatest.hardware_temperature.toFixed(1)} °C`
                        : "Not Available"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Three Primary Soil Monitoring Cards */}
              <SoilMonitoringCards
                latest={activeLatest}
                history={activeHistory}
                deviceStatus={activeDeviceStatus}
                config={config}
                onToggleDmsCalibrated={(cal) =>
                  handleSaveConfig({ dms_calibrated: cal })
                }
              />

              {/* Quick Bottom Row on Main Dashboard: Energy Summary + Active Alerts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <Zap className="w-4 h-4 text-emerald-500" />
                      Ringkasan Sistem Tenaga Surya & Baterai
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveNav("energy")}
                      className="text-xs font-bold text-emerald-500 hover:underline"
                    >
                      Lihat Detail Energi →
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                      <span className="text-slate-500 block">
                        Tegangan Baterai
                      </span>
                      <span className="font-extrabold text-sm">
                        {activeLatest?.battery_voltage !== null &&
                        activeLatest?.battery_voltage !== undefined
                          ? `${activeLatest.battery_voltage.toFixed(2)} V`
                          : "Not Available"}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                      <span className="text-slate-500 block">
                        Panel Surya (10Wp)
                      </span>
                      <span className="font-extrabold text-sm">
                        {activeLatest?.solar_voltage !== null &&
                        activeLatest?.solar_voltage !== undefined
                          ? `${activeLatest.solar_voltage.toFixed(1)} V`
                          : "Not Available"}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                      <span className="text-slate-500 block">Status Daya</span>
                      <span className="font-extrabold text-sm text-emerald-500">
                        {chargingStatus}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <Bell className="w-4 h-4 text-emerald-500" />
                      Status Sistem Alarm & Notifikasi Terbaru
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveNav("alerts")}
                      className="text-xs font-bold text-emerald-500 hover:underline"
                    >
                      Kelola Batas Alarm →
                    </button>
                  </div>
                  {activeAlerts.length > 0 ? (
                    <div className="space-y-2">
                      {activeAlerts.slice(0, 2).map((al) => (
                        <div
                          key={al.id}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {al.title}
                            </span>
                            <p className="text-[11px] text-slate-500">
                              {al.message}
                            </p>
                          </div>
                          <span className="font-mono text-[11px] text-emerald-500 shrink-0 ml-2">
                            {al.metric_value}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 py-4 text-center">
                      Semua parameter berada dalam batas aman.
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Menu 2: Soil Monitoring */}
          {activeNav === "soil" && (
            <SoilMonitoringCards
              latest={activeLatest}
              history={activeHistory}
              deviceStatus={activeDeviceStatus}
              config={config}
              detailedView={true}
              onToggleDmsCalibrated={(cal) =>
                handleSaveConfig({ dms_calibrated: cal })
              }
            />
          )}

          {/* Menu 3: Energy Monitoring */}
          {activeNav === "energy" && (
            <EnergyMonitoringView
              latest={activeLatest}
              history={activeHistory}
              deviceStatus={activeDeviceStatus}
              config={config}
            />
          )}

          {/* Menu 4: Data History */}
          {activeNav === "history" && (
            <HistoryAndChartsView
              history={activeHistory}
              selectedRange={selectedRange}
              onSelectRange={setSelectedRange}
              config={config}
              onRefresh={fetchHardwareData}
            />
          )}

          {/* Menu 5: Alerts */}
          {activeNav === "alerts" && (
            <AlertsView
              alerts={activeAlerts}
              config={config}
              deviceStatus={activeDeviceStatus}
              latest={activeLatest}
              onAcknowledgeAlert={handleAcknowledgeAlert}
              onSaveThresholds={(updated) => handleSaveConfig(updated)}
            />
          )}

          {/* Menu 6: Device Management */}
          {activeNav === "device" && (
            <DeviceManagementView
              deviceStatus={activeDeviceStatus}
              config={config}
              onSaveConfig={handleSaveConfig}
              onTriggerRefresh={fetchHardwareData}
            />
          )}

          {/* Menu 7: Settings */}
          {activeNav === "settings" && (
            <SettingsView
              darkMode={darkMode}
              onToggleDarkMode={() => setDarkMode(!darkMode)}
              canInstallPwa={Boolean(deferredPrompt)}
              onInstallPwa={handleInstallPwa}
            />
          )}

          {/* Menu 8: About Project */}
          {activeNav === "about" && <AboutProjectView />}
        </main>

        {/* Bottom Navigation Bar for Android / Mobile */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 glass-surface-strong border-t border-slate-200/70 dark:border-white/5 px-2 py-1.5 grid grid-cols-5 gap-1 z-30 no-print">
          {[
            NAV_ITEMS[0],
            NAV_ITEMS[1],
            NAV_ITEMS[2],
            NAV_ITEMS[3],
            NAV_ITEMS[5],
          ].map((item) => {
            const Icon = item.icon;
            const active = activeNav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveNav(item.id)}
                className={`flex flex-col items-center justify-center py-1.5 rounded-lg text-[10px] font-medium ${
                  active
                    ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                <Icon className="w-4 h-4 mb-0.5" />
                <span className="truncate max-w-[64px]">
                  {item.label.split(" ")[0]}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
