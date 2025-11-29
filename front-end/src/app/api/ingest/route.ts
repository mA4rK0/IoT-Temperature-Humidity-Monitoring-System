import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

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
