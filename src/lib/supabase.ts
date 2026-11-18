import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://omrjqsolejpxiduogzfn.supabase.co";

const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_OX599tu6WNtPPHZrhAkaKQ_JK9SQtkG";

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
});

export const DEFAULT_DEVICE_ID =
  process.env.NEXT_PUBLIC_DEFAULT_DEVICE_ID || "SOIL-001";

export const DEFAULT_DEVICE_API_KEY =
  process.env.SOIL_DEVICE_API_KEY || "sk_soil_001_esp32_4g_key_2026";
