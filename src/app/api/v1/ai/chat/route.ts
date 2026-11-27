import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_DEVICE_ID, supabase } from "@/lib/supabase";
import { DEFAULT_CONFIG } from "@/lib/default-config";
import {
  LeafColorMetrics,
  runLocalAgronomyExpert,
} from "@/lib/agronomy-expert";
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

function extractJsonObject(raw: string): AiStructuredDecision | null {
  try {
    const cleaned = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    const parsed = JSON.parse(cleaned.slice(start, end + 1));
    if (
      typeof parsed.should_update_crop !== "boolean" ||
      typeof parsed.reply !== "string" ||
      !parsed.reply.trim()
    ) {
      return null;
    }
    return {
      should_update_crop: parsed.should_update_crop,
      crop_name: String(parsed.crop_name || "Umum"),
      ph_min: Number(parsed.ph_min ?? 6.0),
      ph_max: Number(parsed.ph_max ?? 7.0),
      moisture_min: Number(parsed.moisture_min ?? 50),
      moisture_max: Number(parsed.moisture_max ?? 75),
      temp_min: Number(parsed.temp_min ?? 20),
      temp_max: Number(parsed.temp_max ?? 30),
      reply: parsed.reply.trim(),
    };
  } catch {
    return null;
  }
}

async function callKeylessCloudAgronomist(
  userMessage: string,
  history: Array<{ role: string; content: string }>,
  sensorContext: string,
  currentConfigContext: string,
  expertReferenceHint: string,
  imageBase64?: string | null
): Promise<AiStructuredDecision | null> {
  const systemPrompt = `Anda adalah Asisten AI Agronomi & Dokter Daun Tanaman pada sistem Smart Soil Monitoring IoT berbasis ESP32-S3.
Anda BISA menjawab semua konsultasi pertanian (tanaman apa saja, pupuk, hama, penyakit, olah tanah) SERTA menganalisis foto daun tanaman yang diunggah petani dengan menggabungkan kondisi sensor tanah real-time!

ATURAN WAJIB OUTPUT:
Balas HANYA dalam format JSON valid persis struktur ini:
{
  "should_update_crop": boolean,
  "crop_name": "Nama Tanaman Singkat",
  "ph_min": number,
  "ph_max": number,
  "moisture_min": number,
  "moisture_max": number,
  "temp_min": number,
  "temp_max": number,
  "reply": "Jawaban lengkap berbahasa Indonesia yang ramah & rapi (gunakan **tebal** dan daftar poin - )"
}

Ketentuan:
1. Set "should_update_crop": true HANYA jika petani menyebutkan ingin menanam/mengganti target tanaman tertentu. Jika sedang konsultasi foto daun / pupuk / hama tanaman aktif, set "should_update_crop": false.
2. Jangan pernah mengarang angka sensor jika tertulis "Sensor Not Connected" atau "Offline".

Konteks Konfigurasi Saat Ini:
${currentConfigContext}

Konteks Sensor Live ESP32-S3 Saat Ini:
${sensorContext}

Referensi Pakar & Analisis Piksel Daun:
${expertReferenceHint}`;

  const userContent = imageBase64
    ? [
        { type: "text", text: userMessage },
        { type: "image_url", image_url: { url: imageBase64 } },
      ]
    : userMessage;

  const messages = [
    { role: "system", content: systemPrompt },
    ...history.slice(-4).map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content || "").slice(0, 700),
    })),
    { role: "user", content: userContent },
  ];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 11000);

  try {
    const res = await fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai",
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages,
      }),
      signal: controller.signal,
    });

    if (!res.ok) return null;
    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content;
    if (!content) return null;
    return extractJsonObject(String(content));
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawMessage = String(body.message || "").trim();
    const imageBase64 =
      typeof body.image_base64 === "string" &&
      body.image_base64.startsWith("data:image/")
        ? body.image_base64
        : null;
    const leafMetrics = (body.leaf_metrics || null) as LeafColorMetrics | null;

    const message =
      rawMessage ||
      (imageBase64
        ? "Tolong periksa kondisi kesehatan daun tanaman pada foto ini beserta cara mengatasinya."
        : "");

    const deviceId = String(body.device_id || DEFAULT_DEVICE_ID).trim();
    const history = Array.isArray(body.history) ? body.history : [];

    if (!message) {
      return NextResponse.json(
        { error: "Pesan atau foto daun tidak boleh kosong." },
        { status: 400 }
      );
    }

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

    const localExpert = runLocalAgronomyExpert(
      message,
      currentCfg,
      latest,
      isDeviceOnline,
      leafMetrics
    );

    const leafHint = leafMetrics
      ? ` | Rasio Warna Foto Daun: Hijau=${leafMetrics.greenPct.toFixed(
          0
        )}%, Kuning=${leafMetrics.yellowPct.toFixed(
          0
        )}%, Cokelat/Bercak=${leafMetrics.brownPct.toFixed(
          0
        )}%, Putih=${leafMetrics.whitePct.toFixed(0)}%`
      : "";

    const expertHint = `Rekomendasi target=${localExpert.cropName} (pH ${localExpert.phMin}-${localExpert.phMax}, Moisture ${localExpert.moistureMin}-${localExpert.moistureMax}%, Suhu ${localExpert.tempMin}-${localExpert.tempMax}°C)${leafHint}.`;

    let decision = await callKeylessCloudAgronomist(
      message,
      history,
      sensorContext,
      currentConfigContext,
      expertHint,
      imageBase64
    );

    let engine: "keyless-vision-llm" | "agronomy-expert-engine" =
      "keyless-vision-llm";

    if (!decision) {
      engine = "agronomy-expert-engine";
      decision = {
        should_update_crop: localExpert.shouldUpdateCrop,
        crop_name: localExpert.cropName,
        ph_min: localExpert.phMin,
        ph_max: localExpert.phMax,
        moisture_min: localExpert.moistureMin,
        moisture_max: localExpert.moistureMax,
        temp_min: localExpert.tempMin,
        temp_max: localExpert.tempMax,
        reply: localExpert.reply,
      };
    }

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
      const cropLabel = String(decision.crop_name || "Tanaman Kustom").slice(
        0,
        60
      );

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
