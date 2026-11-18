import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_DEVICE_ID, supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const deviceId = searchParams.get("device_id") || DEFAULT_DEVICE_ID;
  const isDemo = searchParams.get("is_demo") === "true";

  const { data: telemetry, error } = await supabase
    .from("soil_telemetry")
    .select("*")
    .eq("device_id", deviceId)
    .eq("is_demo", isDemo)
    .order("ts", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch latest telemetry", details: error.message },
      { status: 500 }
    );
  }

  const { data: device } = await supabase
    .from("soil_devices")
    .select("*")
    .eq("device_id", deviceId)
    .maybeSingle();

  // Check if telemetry is stale (> 5 minutes old) so we never disguise old data as live
  const now = Date.now();
  const lastSeenMs = telemetry?.ts ? new Date(telemetry.ts).getTime() : 0;
  const isStale = !telemetry || now - lastSeenMs > 5 * 60 * 1000;

  return NextResponse.json({
    device_id: deviceId,
    is_demo: isDemo,
    is_stale: isStale,
    telemetry: telemetry || null,
    device: device || null,
    server_time: new Date().toISOString(),
  });
}
