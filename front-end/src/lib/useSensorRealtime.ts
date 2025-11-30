"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/useSupabaseClient";
import { PostgrestError } from "@supabase/supabase-js";

export interface SensorDataEntry {
  id?: string;
  device_id: string;
  temperature: number;
  humidity: number;
  created_at: string;
  time?: string;
}

interface SensorDataRow {
  id: string;
  device_id: string;
  temperature: number;
  humidity: number;
  created_at: string;
}

export function useSensorRealtime(deviceId: string, initialLimit = 200) {
  const [data, setData] = useState<SensorDataEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<PostgrestError | Error | null>(null);
  const [prevDeviceId, setPrevDeviceId] = useState(deviceId);

  if (deviceId !== prevDeviceId) {
    setPrevDeviceId(deviceId);
    if (deviceId) {
      setLoading(true);
      setError(null);
      setData([]);
    }
  }

  useEffect(() => {
    if (!deviceId) return;

    let mounted = true;

    const fetchInitial = async () => {
      try {
        const { data: rows, error: fetchError } = await supabase
          .from("sensor_data")
          .select("id, device_id, temperature, humidity, created_at")
          .eq("device_id", deviceId)
          .order("created_at", { ascending: false })
          .limit(initialLimit);

        if (!mounted) return;

        if (fetchError) {
          setError(fetchError);
          setLoading(false);
          return;
        }

        const mapped: SensorDataEntry[] = (rows || [])
          .map((r: SensorDataRow) => ({
            id: r.id,
            device_id: r.device_id,
            temperature: Number(r.temperature),
            humidity: Number(r.humidity),
            created_at: r.created_at,
            time: new Date(r.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          }))
          .reverse();

        setData(mapped);
        setLoading(false);
      } catch (err) {
        if (!mounted) return;
        setError(err as Error);
        setLoading(false);
      }
    };

    fetchInitial();

    const channel = supabase.channel(`sensor_updates_${deviceId}`).on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "sensor_data",
        filter: `device_id=eq.${deviceId}`,
      },
      (payload) => {
        const r = payload.new as SensorDataRow;
        const entry: SensorDataEntry = {
          id: r.id,
          device_id: r.device_id,
          temperature: Number(r.temperature),
          humidity: Number(r.humidity),
          created_at: r.created_at,
          time: new Date(r.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };

        setData((prev) => {
          const next = [...prev, entry];
          if (next.length > 2000) next.shift();
          return next;
        });
      }
    );

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [deviceId, initialLimit]);

  return { data, loading, error };
}
