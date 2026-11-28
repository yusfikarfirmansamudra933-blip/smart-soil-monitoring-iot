import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_DEVICE_ID, supabase } from "@/lib/supabase";

const RANGE_MS: Record<string, number> = {
  "1h": 60 * 60 * 1000,
  "6h": 6 * 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const deviceId = searchParams.get("device_id") || DEFAULT_DEVICE_ID;
  const range = searchParams.get("range") || "24h";
  const isDemo = searchParams.get("is_demo") === "true";
  const startDate = searchParams.get("start");
  const endDate = searchParams.get("end");
  const limit = Math.min(Number(searchParams.get("limit") || 120), 500);

  // Ambil data TERBARU terlebih dahulu (descending), lalu balik urutannya agar grafik selalu menampilkan waktu terkini
  let query = supabase
    .from("soil_telemetry")
    .select(
      "id,device_id,ts,soil_ph,soil_ph_raw,soil_moisture,soil_dms_raw,soil_temperature,hardware_temperature,battery_voltage,battery_current,battery_power,battery_energy_wh,battery_remaining_hours,solar_voltage,solar_current,solar_power,solar_energy_wh,power_save_mode,charging_status,modem_quota_mb,modem_credit_rp,buzzer_active,sensor_status,is_demo"
    )
    .eq("device_id", deviceId)
    .eq("is_demo", isDemo)
    .order("ts", { ascending: false })
    .limit(limit);

  if (startDate && !Number.isNaN(Date.parse(startDate))) {
    query = query.gte("ts", new Date(startDate).toISOString());
  } else {
    const duration = RANGE_MS[range] || RANGE_MS["24h"];
    const since = new Date(Date.now() - duration).toISOString();
    query = query.gte("ts", since);
  }

  if (endDate && !Number.isNaN(Date.parse(endDate))) {
    query = query.lte("ts", new Date(endDate).toISOString());
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch telemetry history", details: error.message },
      { status: 500 }
    );
  }

  const chronological = data ? [...data].reverse() : [];

  return NextResponse.json({
    device_id: deviceId,
    range,
    is_demo: isDemo,
    count: chronological.length,
    records: chronological,
  });
}
