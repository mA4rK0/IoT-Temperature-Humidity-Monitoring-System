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
  try {
    const headerSecret =
      req.headers.get("device-secret") ||
      req.headers.get("x-device-secret") ||
      req.headers.get("authorization");

    console.log("ingest called, headerSecret:", headerSecret);

    if (!headerSecret) {
      console.warn("no device secret header");
      return NextResponse.json(
        { error: "Unauthorized - no header" },
        { status: 401 }
      );
    }

    const expected = `Bearer ${DEVICE_SECRET}`;
    const allowed =
      headerSecret === expected ||
      headerSecret === DEVICE_SECRET ||
      headerSecret === `Bearer ${process.env.DEVICE_SECRET}`;

    if (!allowed) {
      console.warn("unauthorized header mismatch", { headerSecret, expected });
      return NextResponse.json(
        { error: "Unauthorized - invalid secret" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { device_id, temperature, humidity } = body || {};

    if (!device_id || (temperature === undefined && humidity === undefined)) {
      console.warn("bad payload", body);
      return NextResponse.json(
        { error: "Bad request - missing fields" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("sensor_data")
      .insert({
        device_id,
        temperature,
        humidity,
      })
      .select();

    if (error) {
      console.error("supabase insert error:", error);
      return NextResponse.json(
        { error: error.message || error },
        { status: 500 }
      );
    }

    console.log("inserted", data?.[0]);
    return NextResponse.json(
      { success: true, row: data?.[0] },
      { status: 201 }
    );
  } catch (err) {
    console.error("ingest handler error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
