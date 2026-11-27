import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_DEVICE_ID, supabase } from "@/lib/supabase";
import { DEFAULT_CONFIG } from "@/lib/default-config";
import {
  buildSensorEvaluationSummary,
  matchCropProfileFromText,
} from "@/lib/crop-profiles";
import { SoilTelemetryRecord } from "@/lib/types";

interface AiStructuredDecision {
  should_update_crop: boolean;
  crop_name: string;
  ph_min: number;
  ph_max: number;
  moisture_min: number;
  moisture_max: number;
  temp_min: number;
  temp_max: number;
  reply: string;
}

const clamp = (val: number, min: number, max: number) =>
  Math.max(min, Math.min(max, val));

async function callGeminiAgronomist(
  apiKey: string,
  userMessage: string,
  history: Array<{ role: string; content: string }>,
  sensorContext: string,
  currentConfigContext: string
): Promise<AiStructuredDecision | null> {
  const systemInstruction = `Anda adalah Asisten AI Agronomi Cerdas pada sistem Smart Soil Monitoring IoT (ESP32-S3).
Tugas utama Anda:
1. Jika petani menyebutkan jenis tanaman yang sedang/akan ditanam atau meminta kalibrasi/target ideal tanaman tertentu (contoh: cabai, tomat, padi, bawang, melon, stroberi, sawi, kopi, atau tanaman apa pun), set "should_update_crop" = true dan tentukan angka ilmiah agronomi tropis Indonesia yang akurat untuk:
   - crop_name (nama tanaman singkat, misal "Cabai Rawit" atau "Tomat")
   - ph_min & ph_max (rentang pH tanah ideal, antara 4.0 - 8.5)
   - moisture_min & moisture_max (kelembapan tanah % ideal, antara 20 - 95)
   - temp_min & temp_max (suhu tanah °C ideal, antara 12 - 36)
2. Jika petani hanya bertanya umum tanpa mengganti tanaman, set "should_update_crop" = false dan pertahankan nilai konfigurasi saat ini.
3. Jawab dalam Bahasa Indonesia yang ramah, ringkas, dan praktis untuk petani pada field "reply". Jangan mengarang angka sensor jika sensor tertulis Not Connected / Offline.

Konteks Konfigurasi Saat Ini:
${currentConfigContext}

Konteks Pembacaan Sensor Live ESP32-S3 Saat Ini:
${sensorContext}`;

  const contents = [
    ...history.slice(-6).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: String(m.content || "").slice(0, 1000) }],
    })),
    {
      role: "user",
      parts: [{ text: userMessage }],
    },
  ];

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
      apiKey
    )}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents,
        generationConfig: {
          temperature: 0.25,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              should_update_crop: { type: "BOOLEAN" },
              crop_name: { type: "STRING" },
              ph_min: { type: "NUMBER" },
              ph_max: { type: "NUMBER" },
              moisture_min: { type: "NUMBER" },
              moisture_max: { type: "NUMBER" },
              temp_min: { type: "NUMBER" },
              temp_max: { type: "NUMBER" },
              reply: { type: "STRING" },
            },
            required: [
              "should_update_crop",
              "crop_name",
              "ph_min",
              "ph_max",
              "moisture_min",
              "moisture_max",
              "temp_min",
              "temp_max",
              "reply",
            ],
          },
        },
      }),
    }
  );

  if (!res.ok) return null;
  const data = await res.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) return null;
  return JSON.parse(rawText) as AiStructuredDecision;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = String(body.message || "").trim();
    const deviceId = String(body.device_id || DEFAULT_DEVICE_ID).trim();
    const history = Array.isArray(body.history) ? body.history : [];

    if (!message) {
      return NextResponse.json(
        { error: "Pesan tidak boleh kosong." },
        { status: 400 }
      );
    }

    // 1. Ambil konfigurasi & data sensor live terbaru dari Supabase
    const [{ data: cfgRow }, { data: devRow }, { data: latestRow }] =
      await Promise.all([
        supabase
          .from("soil_device_configs")
          .select("*")
          .eq("device_id", deviceId)
          .maybeSingle(),
        supabase
          .from("soil_devices")
          .select("*")
          .eq("device_id", deviceId)
          .maybeSingle(),
        supabase
          .from("soil_telemetry")
          .select("*")
          .eq("device_id", deviceId)
          .eq("is_demo", false)
          .order("ts", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

    const currentCfg = { ...DEFAULT_CONFIG, ...(cfgRow || {}), device_id: deviceId };
    const lastSeenMs = devRow?.last_seen
      ? new Date(devRow.last_seen).getTime()
      : 0;
    const isDeviceOnline =
      devRow?.esp32_status === "online" &&
      lastSeenMs > 0 &&
      Date.now() - lastSeenMs < 180000;

    const latest = (isDeviceOnline ? latestRow : null) as SoilTelemetryRecord | null;

    const sensorContext = !isDeviceOnline || !latest
      ? "ESP32-S3 Status: Offline / Belum mengirim data real-time."
      : `ESP32-S3 Status: Online | Soil pH: ${
          latest.soil_ph !== null && latest.sensor_status?.ph !== "not_connected"
            ? latest.soil_ph
            : "Sensor Not Connected"
        } | Soil Moisture: ${
          latest.soil_moisture !== null &&
          latest.sensor_status?.dms !== "not_connected"
            ? `${latest.soil_moisture}%`
            : "Sensor Not Connected"
        } | Soil Temperature: ${
          latest.soil_temperature !== null &&
          latest.sensor_status?.temperature !== "not_connected"
            ? `${latest.soil_temperature}°C`
            : "Sensor Not Connected"
        }`;

    const currentConfigContext = `Tanaman Aktif: ${
      currentCfg.active_crop || "Umum"
    } | pH Ideal: ${currentCfg.ph_min_alarm}-${
      currentCfg.ph_max_alarm
    } | Moisture Ideal: ${currentCfg.moisture_min_alarm}%-${
      currentCfg.moisture_max_alarm
    }% | Suhu Ideal: ${currentCfg.temp_min_alarm}°C-${currentCfg.temp_max_alarm}°C`;

    // 2. Cek API Key Gemini (env server atau header opsional dari pengguna)
    const geminiKey =
      req.headers.get("x-gemini-api-key")?.trim() ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      "";

    let decision: AiStructuredDecision | null = null;
    let engine: "gemini-2.5-flash" | "agronomy-ai-engine" = "agronomy-ai-engine";

    if (geminiKey) {
      try {
        decision = await callGeminiAgronomist(
          geminiKey,
          message,
          history,
          sensorContext,
          currentConfigContext
        );
        if (decision) engine = "gemini-2.5-flash";
      } catch {
        decision = null;
      }
    }

    // 3. Fallback cerdas berbasis Basis Pengetahuan Agronomi Indonesia (selalu siap 24/7)
    if (!decision) {
      const matched = matchCropProfileFromText(message);
      if (matched) {
        const evalText = buildSensorEvaluationSummary(latest, isDeviceOnline, matched);
        decision = {
          should_update_crop: true,
          crop_name: matched.cropName,
          ph_min: matched.phMin,
          ph_max: matched.phMax,
          moisture_min: matched.moistureMin,
          moisture_max: matched.moistureMax,
          temp_min: matched.tempMin,
          temp_max: matched.tempMax,
          reply: `Siap! Parameter sistem telah saya kalibrasi otomatis untuk tanaman **${matched.cropName}**:\n- **pH Tanah Ideal:** ${matched.phMin.toFixed(1)} – ${matched.phMax.toFixed(1)}\n- **Soil Moisture Ideal:** ${matched.moistureMin}% – ${matched.moistureMax}%\n- **Suhu Tanah Ideal:** ${matched.tempMin}°C – ${matched.tempMax}°C\n\n**Evaluasi Kondisi Lahan Saat Ini:**\n${evalText}\n\n**Saran Agronomi:** ${matched.tips}`,
        };
      } else {
        const evalCurrent = buildSensorEvaluationSummary(latest, isDeviceOnline, {
          cropName: currentCfg.active_crop || "Umum",
          phMin: currentCfg.ph_min_alarm,
          phMax: currentCfg.ph_max_alarm,
          moistureMin: currentCfg.moisture_min_alarm,
          moistureMax: currentCfg.moisture_max_alarm,
          tempMin: currentCfg.temp_min_alarm,
          tempMax: currentCfg.temp_max_alarm,
        });
        decision = {
          should_update_crop: false,
          crop_name: currentCfg.active_crop || "Umum",
          ph_min: currentCfg.ph_min_alarm,
          ph_max: currentCfg.ph_max_alarm,
          moisture_min: currentCfg.moisture_min_alarm,
          moisture_max: currentCfg.moisture_max_alarm,
          temp_min: currentCfg.temp_min_alarm,
          temp_max: currentCfg.temp_max_alarm,
          reply: `Saat ini sistem menggunakan profil tanaman **${
            currentCfg.active_crop || "Umum"
          }**.\n\n**Kondisi Sensor Live (${deviceId}):**\n${evalCurrent}\n\nKetik nama tanaman yang Anda tanam (misalnya *"Saya menanam cabai"*, *"Tomat"*, *"Bawang merah"*, *"Padi"*, *"Melon"*, *"Jagung"*, *"Stroberi"*, dll.) agar saya otomatis menyesuaikan target pH, Soil Moisture, dan Suhu idealnya.`,
        };
      }
    }

    // 4. Jika AI memutuskan update tanaman, simpan otomatis ke Supabase soil_device_configs
    let appliedConfig = null;
    if (decision.should_update_crop) {
      const phMin = Number(clamp(decision.ph_min, 3.5, 8.5).toFixed(1));
      const phMax = Number(
        clamp(Math.max(phMin + 0.3, decision.ph_max), 3.8, 9.0).toFixed(1)
      );
      const moistMin = Math.round(clamp(decision.moisture_min, 15, 90));
      const moistMax = Math.round(
        clamp(Math.max(moistMin + 5, decision.moisture_max), 20, 98)
      );
      const tempMin = Number(clamp(decision.temp_min, 10, 35).toFixed(1));
      const tempMax = Number(
        clamp(Math.max(tempMin + 2, decision.temp_max), 12, 40).toFixed(1)
      );
      const cropLabel = String(decision.crop_name || "Tanaman Kustom").slice(0, 60);

      const updatedPayload = {
        ...currentCfg,
        device_id: deviceId,
        active_crop: cropLabel,
        ph_min_alarm: phMin,
        ph_max_alarm: phMax,
        moisture_min_alarm: moistMin,
        moisture_max_alarm: moistMax,
        temp_min_alarm: tempMin,
        temp_max_alarm: tempMax,
        updated_at: new Date().toISOString(),
      };

      const { data: savedRow, error: saveErr } = await supabase
        .from("soil_device_configs")
        .upsert(updatedPayload)
        .select()
        .single();

      if (!saveErr) {
        appliedConfig = savedRow || updatedPayload;
      }
    }

    return NextResponse.json({
      reply: decision.reply,
      appliedConfig,
      engine,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error: "Gagal memproses permintaan AI.",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
