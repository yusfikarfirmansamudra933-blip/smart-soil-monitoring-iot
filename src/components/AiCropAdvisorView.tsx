"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Bot,
  CheckCircle2,
  Droplets,
  FlaskConical,
  KeyRound,
  Loader2,
  Send,
  Sparkles,
  Sprout,
  Thermometer,
} from "lucide-react";
import {
  SoilDeviceConfig,
  SoilDeviceStatus,
  SoilTelemetryRecord,
} from "@/lib/types";

interface AiCropAdvisorProps {
  config: SoilDeviceConfig;
  latest: SoilTelemetryRecord | null;
  deviceStatus: SoilDeviceStatus;
  onConfigUpdated: (newCfg: SoilDeviceConfig) => void;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  appliedCrop?: {
    cropName: string;
    phMin: number;
    phMax: number;
    moistureMin: number;
    moistureMax: number;
    tempMin: number;
    tempMax: number;
  };
}

const QUICK_CROPS = [
  "Cabai",
  "Cabai Berbuah",
  "Tomat",
  "Padi",
  "Bawang Merah",
  "Jagung",
  "Melon",
  "Stroberi",
  "Sawi",
  "Kopi",
];

export function AiCropAdvisorView({
  config,
  latest,
  deviceStatus,
  onConfigUpdated,
}: AiCropAdvisorProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Halo! Ketik tanaman yang sedang Anda tanam (contoh: **\"Saya menanam cabai\"**), maka saya akan **otomatis mengkalibrasi target ideal pH, Soil Moisture, dan Suhu Tanah** untuk lahan Anda.",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showKeyBox, setShowKeyBox] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("smart_soil_gemini_key") || "";
      setGeminiApiKey(saved);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const handleSaveApiKey = (val: string) => {
    setGeminiApiKey(val);
    if (typeof window !== "undefined") {
      if (val.trim()) {
        localStorage.setItem("smart_soil_gemini_key", val.trim());
      } else {
        localStorage.removeItem("smart_soil_gemini_key");
      }
    }
  };

  const sendFarmerMessage = async (textToSend?: string) => {
    const text = (textToSend ?? input).trim();
    if (!text || sending) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setSending(true);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (geminiApiKey.trim()) {
        headers["x-gemini-api-key"] = geminiApiKey.trim();
      }

      const res = await fetch("/api/v1/ai/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({
          device_id: deviceStatus.device_id || config.device_id,
          message: text,
          history: messages.slice(-6).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menghubungi Asisten AI.");
      }

      let appliedSummary: ChatMessage["appliedCrop"] | undefined;
      if (data.appliedConfig) {
        onConfigUpdated(data.appliedConfig as SoilDeviceConfig);
        appliedSummary = {
          cropName: data.appliedConfig.active_crop || "Tanaman",
          phMin: Number(data.appliedConfig.ph_min_alarm),
          phMax: Number(data.appliedConfig.ph_max_alarm),
          moistureMin: Number(data.appliedConfig.moisture_min_alarm),
          moistureMax: Number(data.appliedConfig.moisture_max_alarm),
          tempMin: Number(data.appliedConfig.temp_min_alarm),
          tempMax: Number(data.appliedConfig.temp_max_alarm),
        };
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: String(data.reply || ""),
          appliedCrop: appliedSummary,
        },
      ]);
    } catch (err: unknown) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: `Maaf, terjadi kendala koneksi: ${
            err instanceof Error ? err.message : "Unknown error"
          }`,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const renderFormattedText = (raw: string) => {
    return raw.split("\n").map((line, i) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <p key={i} className={line.trim() === "" ? "h-2" : "leading-relaxed"}>
          {parts.map((part, idx) =>
            part.startsWith("**") && part.endsWith("**") ? (
              <strong key={idx} className="font-bold text-slate-900 dark:text-white">
                {part.slice(2, -2)}
              </strong>
            ) : (
              <span key={idx}>{part}</span>
            )
          )}
        </p>
      );
    });
  };

  const espOnline = deviceStatus.esp32_status === "online";
  const livePh =
    espOnline && latest?.sensor_status?.ph !== "not_connected"
      ? latest?.soil_ph ?? null
      : null;
  const liveMoist =
    espOnline && latest?.sensor_status?.dms !== "not_connected"
      ? latest?.soil_moisture ?? null
      : null;
  const liveTemp =
    espOnline && latest?.sensor_status?.temperature !== "not_connected"
      ? latest?.soil_temperature ?? null
      : null;

  return (
    <div className="space-y-5">
      {/* Top Active Crop & Target Calibration Summary */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Asisten AI Tanaman
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  Tanaman: {config.active_crop || "Umum"}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowKeyBox(!showKeyBox)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 transition"
          >
            <KeyRound className="w-3.5 h-3.5 text-emerald-500" />
            {geminiApiKey ? "Gemini API Aktif" : "Opsional: Gemini API Key"}
          </button>
        </div>

        {showKeyBox && (
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 text-xs">
            <input
              type="password"
              value={geminiApiKey}
              onChange={(e) => handleSaveApiKey(e.target.value)}
              placeholder="Tempel Google Gemini API Key (AIza...) — kosongkan untuk mode AI Agronomi bawaan"
              className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
            />
            <button
              type="button"
              onClick={() => setShowKeyBox(false)}
              className="px-3.5 py-2 rounded-lg bg-emerald-600 text-white font-bold"
            >
              Selesai
            </button>
          </div>
        )}

        {/* 3 Target Ideal vs Live Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-500 block">
                Target pH Ideal
              </span>
              <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                {config.ph_min_alarm.toFixed(1)} – {config.ph_max_alarm.toFixed(1)}
              </span>
              <span className="text-[11px] text-emerald-500 block font-semibold">
                Live: {livePh !== null ? `${livePh.toFixed(2)} pH` : "Not Connected"}
              </span>
            </div>
            <FlaskConical className="w-5 h-5 text-emerald-500" />
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-500 block">
                Target Soil Moisture
              </span>
              <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                {config.moisture_min_alarm}% – {config.moisture_max_alarm}%
              </span>
              <span className="text-[11px] text-emerald-500 block font-semibold">
                Live: {liveMoist !== null ? `${liveMoist.toFixed(1)}%` : "Not Connected"}
              </span>
            </div>
            <Droplets className="w-5 h-5 text-sky-500" />
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-500 block">
                Target Suhu Tanah
              </span>
              <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                {config.temp_min_alarm}°C – {config.temp_max_alarm}°C
              </span>
              <span className="text-[11px] text-emerald-500 block font-semibold">
                Live: {liveTemp !== null ? `${liveTemp.toFixed(1)} °C` : "Not Connected"}
              </span>
            </div>
            <Thermometer className="w-5 h-5 text-amber-500" />
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-[520px]">
        {/* Quick Crop Chips */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-bold text-slate-500 shrink-0 flex items-center gap-1">
            <Sprout className="w-3.5 h-3.5 text-emerald-500" /> Pilih Cepat:
          </span>
          {QUICK_CROPS.map((crop) => (
            <button
              key={crop}
              type="button"
              disabled={sending}
              onClick={() => sendFarmerMessage(`Saya menanam ${crop}`)}
              className="px-3 py-1 rounded-full text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shrink-0 transition disabled:opacity-50"
            >
              {crop}
            </button>
          ))}
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[88%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-xs sm:text-sm space-y-2.5 ${
                  msg.role === "user"
                    ? "bg-emerald-600 text-white rounded-br-sm"
                    : "bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-sm"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    <Bot className="w-3.5 h-3.5" />
                    Asisten AI Agronomi
                  </div>
                )}

                <div className="space-y-1">
                  {msg.role === "assistant"
                    ? renderFormattedText(msg.content)
                    : msg.content}
                </div>

                {msg.appliedCrop && (
                  <div className="mt-2 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-extrabold text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      Auto-Kalibrasi Diterapkan: {msg.appliedCrop.cropName}
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[11px] text-slate-700 dark:text-slate-200">
                      <div>pH: {msg.appliedCrop.phMin}–{msg.appliedCrop.phMax}</div>
                      <div>
                        Moisture: {msg.appliedCrop.moistureMin}–{msg.appliedCrop.moistureMax}%
                      </div>
                      <div>
                        Suhu: {msg.appliedCrop.tempMin}–{msg.appliedCrop.tempMax}°C
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-sm px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-xs text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                Menghitung parameter ideal tanaman...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendFarmerMessage();
          }}
          className="p-3 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ketik pesan, misal: Saya menanam cabai rawit..."
            disabled={sending}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 transition"
          >
            <Send className="w-4 h-4" />
            Kirim
          </button>
        </form>
      </div>
    </div>
  );
}
