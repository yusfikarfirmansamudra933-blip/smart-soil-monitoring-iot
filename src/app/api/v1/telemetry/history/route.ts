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
  const limit = Math.min(Number(searchParams.get("limit") || 500), 1000);

  let query = supabase
    .from("soil_telemetry")
    .select("*")
    .eq("device_id", deviceId)
    .eq("is_demo", isDemo)
    .order("ts", { ascending: true })
    .limit(limit);

  if (startDate) {
    query = query.gte("ts", new Date(startDate).toISOString());
  } else {
    const duration = RANGE_MS[range] || RANGE_MS["24h"];
    const since = new Date(Date.now() - duration).toISOString();
    query = query.gte("ts", since);
  }

  if (endDate) {
    query = query.lte("ts", new Date(endDate).toISOString());
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch telemetry history", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    device_id: deviceId,
    range,
    is_demo: isDemo,
    count: data?.length || 0,
    records: data || [],
  });
}
