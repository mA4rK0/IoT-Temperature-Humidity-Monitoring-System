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

    const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || "";
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";
    const TEMP_THRESHOLD = Number(process.env.ALERT_TEMP_THRESHOLD || 40);
    const HUM_THRESHOLD = Number(process.env.ALERT_HUM_THRESHOLD || 90);
    const MINUTES_BETWEEN = Number(process.env.ALERT_MINUTES_BETWEEN || 10);

    async function sendTelegramMessage(text: string) {
      if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) {
        console.warn("telegram not configured, skip send");
        return { ok: false, reason: "no_telegram" };
      }

      try {
        const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text,
            parse_mode: "HTML",
          }),
        });
        const json = await res.json();
        return { ok: res.ok, json };
      } catch (e) {
        console.error("telegram send error", e);
        return { ok: false, reason: e };
      }
    }

    const alertsToSend: { type: string; value: number }[] = [];
    if (temperature !== undefined && Number(temperature) >= TEMP_THRESHOLD) {
      alertsToSend.push({
        type: "temperature_high",
        value: Number(temperature),
      });
    }
    if (humidity !== undefined && Number(humidity) >= HUM_THRESHOLD) {
      alertsToSend.push({ type: "humidity_high", value: Number(humidity) });
    }

    for (const a of alertsToSend) {
      const { data: lastAlerts, error: lastErr } = await supabase
        .from("alerts")
        .select("created_at")
        .eq("device_id", device_id)
        .eq("alert_type", a.type)
        .order("created_at", { ascending: false })
        .limit(1);

      if (lastErr) console.warn("error fetching last alert", lastErr);

      let shouldSend = true;
      if (lastAlerts && lastAlerts.length > 0) {
        const lastTime = new Date(lastAlerts[0].created_at).getTime();
        const now = Date.now();
        const diffMin = (now - lastTime) / (1000 * 60);
        if (diffMin < MINUTES_BETWEEN) {
          shouldSend = false;
        }
      }

      if (shouldSend) {
        const message = `<b>ALERT</b>\nDevice: <code>${device_id}</code>\nType: ${
          a.type
        }\nValue: ${a.value}\nTime: ${new Date(
          data?.[0]?.created_at ?? new Date().toISOString()
        ).toLocaleString()}\n\nURL: ${
          process.env.NEXT_PUBLIC_SITE_URL || "Demo URL"
        }`;
        const sent = await sendTelegramMessage(message);

        const { error: recordErr } = await supabase.from("alerts").insert({
          device_id,
          alert_type: a.type,
          temperature:
            a.type === "temperature_high" ? a.value : temperature ?? null,
          humidity: a.type === "humidity_high" ? a.value : humidity ?? null,
        });

        if (recordErr) {
          console.warn("failed to record alert", recordErr);
        } else {
          console.log(
            "alert recorded for",
            device_id,
            a.type,
            "sent?",
            sent.ok
          );
        }
      } else {
        console.log(
          `skipping alert ${a.type} for ${device_id} - sent recently`
        );
      }
    }

    return NextResponse.json(
      { success: true, row: data?.[0] },
      { status: 201 }
    );
  } catch (err) {
    console.error("ingest handler error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
