import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_DEVICE_ID, supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const deviceId = searchParams.get("device_id") || DEFAULT_DEVICE_ID;

  const { data: device, error } = await supabase
    .from("soil_devices")
    .select(
      "device_id, name, location, firmware_version, esp32_status, modem_status, signal_rssi, modem_quota_mb, modem_credit_rp, buzzer_active, sensor_ph_status, sensor_dms_status, sensor_temp_status, uptime_seconds, last_seen"
    )
    .eq("device_id", deviceId)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch device status", details: error.message },
      { status: 500 }
    );
  }

  if (!device) {
    return NextResponse.json({
      device_id: deviceId,
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
  }

  const lastSeenMs = device.last_seen
    ? new Date(device.last_seen).getTime()
    : 0;
  const isOffline = !device.last_seen || Date.now() - lastSeenMs > 5 * 60 * 1000;

  return NextResponse.json({
    ...device,
    esp32_status: isOffline ? "offline" : device.esp32_status,
    modem_status: isOffline ? "disconnected" : device.modem_status,
    is_stale: isOffline,
  });
}
