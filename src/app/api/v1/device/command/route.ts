import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_DEVICE_ID, supabase } from "@/lib/supabase";
import { DEFAULT_CONFIG } from "@/lib/default-config";

const ALLOWED_ONE_SHOT_COMMANDS = new Set([
  "ring_buzzer",
  "reset_energy",
  "reboot_mcu",
  "ota_update",
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const deviceId = String(body.device_id || DEFAULT_DEVICE_ID).trim();
    const command = String(body.command || "").trim();
    const customOtaUrl =
      typeof body.ota_url === "string" ? body.ota_url.trim() : "";

    const { data: existing } = await supabase
      .from("soil_device_configs")
      .select("*")
      .eq("device_id", deviceId)
      .maybeSingle();

    const baseCfg = { ...DEFAULT_CONFIG, ...(existing || {}), device_id: deviceId };

    if (command === "toggle_power_save") {
      const nextForce =
        typeof body.force_power_save === "boolean"
          ? body.force_power_save
          : !Boolean(baseCfg.force_power_save);

      const { data: updated, error } = await supabase
        .from("soil_device_configs")
        .upsert({
          ...baseCfg,
          force_power_save: nextForce,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        status: "ok",
        message: nextForce
          ? "Mode Paksa Hemat Daya (80 MHz) diaktifkan — ESP32-S3 menyesuaikan pada siklus berikutnya (~2 detik)."
          : "Mode Paksa Hemat Daya dimatikan — ESP32-S3 kembali ke mode otomatis (240 MHz).",
        force_power_save: nextForce,
        config: updated,
      });
    }

    if (!ALLOWED_ONE_SHOT_COMMANDS.has(command)) {
      return NextResponse.json(
        { error: "Perintah jarak jauh tidak dikenali." },
        { status: 400 }
      );
    }

    let pendingValue = command;
    if (
      command === "ota_update" &&
      customOtaUrl.length > 10 &&
      (customOtaUrl.startsWith("https://") || customOtaUrl.startsWith("http://"))
    ) {
      pendingValue = `ota_update:${customOtaUrl}`;
    }

    const { data: updated, error } = await supabase
      .from("soil_device_configs")
      .upsert({
        ...baseCfg,
        pending_command: pendingValue,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const labels: Record<string, string> = {
      ring_buzzer:
        "Perintah Tes Bunyi Buzzer dikirim! Buzzer di ESP32-S3 akan berbunyi pada siklus telemetri berikutnya (~2 detik).",
      reset_energy:
        "Perintah Reset Meteran Energi (Wh) dikirim! Akumulasi Wh Surya & Baterai di ESP32-S3 segera di-nolkan.",
      reboot_mcu:
        "Perintah Restart Jarak Jauh dikirim! ESP32-S3 akan reboot otomatis dalam ~2 detik.",
      ota_update:
        "Perintah Wireless OTA Update dikirim! ESP32-S3 sedang mengunduh firmware terbaru lewat WiFi/4G, menulis ke partisi OTA, lalu reboot otomatis (~20–45 detik).",
    };

    return NextResponse.json({
      status: "ok",
      message: labels[command] || "Perintah dikirim.",
      config: updated,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Gagal mengirim perintah ke perangkat.",
      },
      { status: 500 }
    );
  }
}
