"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Bot,
  Bug,
  Camera,
  CheckCircle2,
  Droplets,
  FlaskConical,
  Loader2,
  Mic,
  MicOff,
  Send,
  Sparkles,
  Sprout,
  Thermometer,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import {
  SoilDeviceConfig,
  SoilDeviceStatus,
  SoilTelemetryRecord,
} from "@/lib/types";
import { LeafColorMetrics } from "@/lib/agronomy-expert";

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
  imagePreview?: string;
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

interface BrowserSpeechRecognitionEvent {
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
}

interface BrowserSpeechRecognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: BrowserSpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

const QUICK_CROPS = [
  "Cabai",
  "Tomat",
  "Padi",
  "Bawang Merah",
  "Jagung",
  "Melon",
  "Durian",
  "Anggur",
  "Sawit",
  "Stroberi",
];

function stripMarkdownForSpeech(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^[#>-]+\s*/gm, "")
    .replace(/\n+/g, ". ");
}

function analyzeAndCompressLeafImage(
  file: File
): Promise<{ dataUrl: string; metrics: LeafColorMetrics }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Gagal membaca file foto."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Format gambar tidak didukung."));
      img.onload = () => {
        const maxSide = 512;
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas tidak tersedia."));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);

        // Analisis piksel bagian tengah daun (mengurangi background pinggir)
        const x0 = Math.floor(w * 0.15);
        const y0 = Math.floor(h * 0.15);
        const sw = Math.max(1, Math.floor(w * 0.7));
        const sh = Math.max(1, Math.floor(h * 0.7));
        const pixels = ctx.getImageData(x0, y0, sw, sh).data;

        let green = 0;
        let yellow = 0;
        let brown = 0;
        let white = 0;
        let total = 0;

        for (let i = 0; i < pixels.length; i += 16) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          total++;

          if (r > 195 && g > 195 && b > 185) {
            white++;
          } else if (g > r * 1.08 && g > b * 1.15 && g > 45) {
            green++;
          } else if (r > 130 && g > 115 && b < 100 && Math.abs(r - g) < 55) {
            yellow++;
          } else if (r > g * 1.08 && r > 60 && b < 110) {
            brown++;
          }
        }

        const denom = Math.max(1, total);
        const metrics: LeafColorMetrics = {
          greenPct: (green / denom) * 100,
          yellowPct: (yellow / denom) * 100,
          brownPct: (brown / denom) * 100,
          whitePct: (white / denom) * 100,
        };

        const dataUrl = canvas.toDataURL("image/jpeg", 0.72);
        resolve({ dataUrl, metrics });
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

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
        "Halo! Saya **Asisten AI & Dokter Daun** Anda (aktif penuh tanpa API Key).\n- **Ketik / Bicara (Mikrofon):** Sebutkan tanaman, tanya pupuk, hama, atau penyakit.\n- **Kamera Daun:** Unggah/potret foto daun tanaman sakit untuk didiagnosis bersama data sensor tanah *live*!",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [pendingPhoto, setPendingPhoto] = useState<{
    dataUrl: string;
    metrics: LeafColorMetrics;
  } | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      recognitionRef.current?.stop();
    };
  }, []);

  const speakIndonesian = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(stripMarkdownForSpeech(text));
    utter.lang = "id-ID";
    utter.rate = 1.02;
    const voices = window.speechSynthesis.getVoices();
    const idVoice = voices.find((v) =>
      v.lang.toLowerCase().startsWith("id")
    );
    if (idVoice) utter.voice = idVoice;
    window.speechSynthesis.speak(utter);
  };

  const activeCropLabel = config.active_crop || "Umum";

  const QUICK_TOPICS = [
    {
      label: "Jadwal & Dosis Pupuk",
      prompt: `Apa rekomendasi jadwal dan dosis pupuk terbaik untuk tanaman ${activeCropLabel}?`,
    },
    {
      label: "Atasi Daun Keriting & Hama",
      prompt: `Bagaimana cara mengatasi hama kutu kebul, thrips, dan daun keriting pada ${activeCropLabel}?`,
    },
    {
      label: "Cegah Bunga/Buah Rontok",
      prompt: `Bagaimana cara mencegah bunga dan bakal buah ${activeCropLabel} agar tidak rontok?`,
    },
    {
      label: "Obati Layu & Busuk Buah",
      prompt: `Bagaimana cara mengatasi penyakit layu dan busuk buah/patek pada ${activeCropLabel}?`,
    },
    {
      label: "Cek Kesehatan Tanah Live",
      prompt: `Evaluasi kondisi sensor tanah saya sekarang untuk tanaman ${activeCropLabel}, apakah perlu kapur dolomit atau penyiraman?`,
    },
  ];

  const sendFarmerMessage = async (textOverride?: string) => {
    const rawText = (textOverride ?? input).trim();
    const photoSnap = pendingPhoto;
    if ((!rawText && !photoSnap) || sending) return;

    const displayContent =
      rawText || "Tolong periksa kondisi daun tanaman saya pada foto ini.";

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: displayContent,
      imagePreview: photoSnap?.dataUrl,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textOverride) setInput("");
    setPendingPhoto(null);
    setSending(true);

    try {
      const res = await fetch("/api/v1/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          device_id: deviceStatus.device_id || config.device_id,
          message: displayContent,
          image_base64: photoSnap?.dataUrl || null,
          leaf_metrics: photoSnap?.metrics || null,
          history: messages.slice(-4).map((m) => ({
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

      const replyText = String(data.reply || "");
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: replyText,
          appliedCrop: appliedSummary,
        },
      ]);

      if (autoSpeak && replyText) {
        speakIndonesian(replyText);
      }
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

  const handleToggleVoiceMic = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const win = window as unknown as {
      SpeechRecognition?: new () => BrowserSpeechRecognition;
      webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
    };
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRec) {
      alert(
        "Browser ini belum mendukung input suara. Gunakan Google Chrome di Android atau Desktop."
      );
      return;
    }

    const rec = new SpeechRec();
    rec.lang = "id-ID";
    rec.interimResults = true;
    rec.continuous = false;

    let finalSpoken = "";
    rec.onresult = (event: BrowserSpeechRecognitionEvent) => {
      let combined = "";
      for (let i = 0; i < event.results.length; i++) {
        combined += event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalSpoken = combined;
        }
      }
      setInput(combined);
    };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => {
      setIsListening(false);
      if (finalSpoken.trim()) {
        setInput("");
        sendFarmerMessage(finalSpoken.trim());
      }
    };

    recognitionRef.current = rec;
    setIsListening(true);
    rec.start();
  };

  const handlePhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const processed = await analyzeAndCompressLeafImage(file);
      setPendingPhoto(processed);
    } catch (err: unknown) {
      alert(
        err instanceof Error ? err.message : "Gagal memproses foto daun."
      );
    }
  };

  const renderFormattedText = (raw: string) => {
    return raw.split("\n").map((line, i) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <p key={i} className={line.trim() === "" ? "h-2" : "leading-relaxed"}>
          {parts.map((part, idx) =>
            part.startsWith("**") && part.endsWith("**") ? (
              <strong
                key={idx}
                className="font-bold text-slate-900 dark:text-white"
              >
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
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Asisten AI &amp; Dokter Daun
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                Tanaman: {activeCropLabel}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const next = !autoSpeak;
              setAutoSpeak(next);
              if (!next && typeof window !== "undefined" && "speechSynthesis" in window) {
                window.speechSynthesis.cancel();
              }
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
              autoSpeak
                ? "bg-emerald-600 text-white border-emerald-500"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
            }`}
          >
            {autoSpeak ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
            {autoSpeak ? "Suara AI: ON" : "Suara AI: OFF"}
          </button>
        </div>

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
                Live:{" "}
                {liveMoist !== null ? `${liveMoist.toFixed(1)}%` : "Not Connected"}
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
                Live:{" "}
                {liveTemp !== null ? `${liveTemp.toFixed(1)} °C` : "Not Connected"}
              </span>
            </div>
            <Thermometer className="w-5 h-5 text-amber-500" />
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-[580px]">
        {/* Quick Crop & Topic Bars */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-[11px] font-bold text-slate-500 shrink-0 flex items-center gap-1">
              <Sprout className="w-3.5 h-3.5 text-emerald-500" /> Set Tanaman:
            </span>
            {QUICK_CROPS.map((crop) => (
              <button
                key={crop}
                type="button"
                disabled={sending}
                onClick={() => sendFarmerMessage(`Saya menanam ${crop}`)}
                className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shrink-0 transition disabled:opacity-50"
              >
                {crop}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-[11px] font-bold text-slate-500 shrink-0 flex items-center gap-1">
              <Bug className="w-3.5 h-3.5 text-amber-500" /> Konsultasi:
            </span>
            {QUICK_TOPICS.map((topic) => (
              <button
                key={topic.label}
                type="button"
                disabled={sending}
                onClick={() => sendFarmerMessage(topic.prompt)}
                className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-600 hover:text-white text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 shrink-0 transition disabled:opacity-50"
              >
                {topic.label}
              </button>
            ))}
          </div>
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
                  <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    <span className="flex items-center gap-1.5">
                      <Bot className="w-3.5 h-3.5" />
                      Asisten AI &amp; Dokter Daun
                    </span>
                    <button
                      type="button"
                      onClick={() => speakIndonesian(msg.content)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 text-[10px] font-bold"
                      title="Bacakan dengan suara Bahasa Indonesia"
                    >
                      <Volume2 className="w-3 h-3" /> Dengarkan
                    </button>
                  </div>
                )}

                {msg.imagePreview && (
                  <img
                    src={msg.imagePreview}
                    alt="Foto daun tanaman"
                    className="rounded-xl max-h-48 w-auto object-cover border border-white/20"
                  />
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
                      <div>
                        pH: {msg.appliedCrop.phMin}–{msg.appliedCrop.phMax}
                      </div>
                      <div>
                        Moisture: {msg.appliedCrop.moistureMin}–
                        {msg.appliedCrop.moistureMax}%
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
                Menganalisis kondisi tanaman &amp; tanah...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Pending Leaf Photo Preview Bar */}
        {pendingPhoto && (
          <div className="px-4 py-2 bg-emerald-950/20 border-t border-emerald-500/30 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <img
                src={pendingPhoto.dataUrl}
                alt="Preview daun"
                className="w-10 h-10 rounded-lg object-cover border border-emerald-500/40"
              />
              <div>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 block">
                  Foto Daun Siap Dianalisis
                </span>
                <span className="text-[11px] text-slate-500">
                  Hijau {pendingPhoto.metrics.greenPct.toFixed(0)}% • Kuning{" "}
                  {pendingPhoto.metrics.yellowPct.toFixed(0)}% • Bercak{" "}
                  {pendingPhoto.metrics.brownPct.toFixed(0)}%
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPendingPhoto(null)}
              className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              title="Hapus foto"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Input Form with Camera + Voice Mic + Send */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendFarmerMessage();
          }}
          className="p-3 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoSelected}
            className="hidden"
          />

          <button
            type="button"
            disabled={sending}
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-slate-300 dark:border-slate-700 transition shrink-0"
            title="Potret / Unggah Foto Daun (Dokter Daun AI)"
          >
            <Camera className="w-4 h-4" />
          </button>

          <button
            type="button"
            disabled={sending}
            onClick={handleToggleVoiceMic}
            className={`p-2.5 rounded-xl border transition shrink-0 ${
              isListening
                ? "bg-rose-600 text-white border-rose-500 animate-pulse"
                : "bg-white dark:bg-slate-900 hover:bg-emerald-500/15 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700"
            }`}
            title="Bicara dengan Suara Bahasa Indonesia"
          >
            {isListening ? (
              <MicOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isListening
                ? "Mendengarkan suara Anda..."
                : "Ketik pesan, rekam suara, atau kirim foto daun..."
            }
            disabled={sending}
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
          />

          <button
            type="submit"
            disabled={sending || (!input.trim() && !pendingPhoto)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 transition shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Kirim</span>
          </button>
        </form>
      </div>
    </div>
  );
}
