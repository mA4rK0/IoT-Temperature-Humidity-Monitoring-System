import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const DEVICE_SECRET = process.env.DEVICE_SECRET!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !DEVICE_SECRET) {
  throw new Error("Missing required env vars for ingest route");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

export async function POST(req: Request) {
  const secret = req.headers.get("device-secret");

  if (!secret || secret !== `Bearer ${process.env.DEVICE_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { device_id, temperature, humidity } = await req.json();

  const { error } = await supabase.from("sensor_data").insert({
    device_id,
    temperature,
    humidity,
  });

  if (error) return NextResponse.json({ error }, { status: 400 });

  return NextResponse.json({ success: true }, { status: 201 });
}
