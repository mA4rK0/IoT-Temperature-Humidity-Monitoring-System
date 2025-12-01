"use client";

import { useMemo, useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { motion } from "motion/react";
import {
  useSensorRealtime,
  type SensorDataEntry,
} from "@/lib/useSensorRealtime";

interface Props {
  deviceId?: string;
  initialLimit?: number;
}

export default function RealtimeDashboard({
  deviceId = "esp32-01",
  initialLimit = 200,
}: Props) {
  const { data, loading } = useSensorRealtime(deviceId, initialLimit);

  const TEMP_MIN = 16;
  const TEMP_MAX = 40;
  const HUM_MIN = 30;
  const HUM_MAX = 80;

  const latest = useMemo(
    () =>
      data.length
        ? data[data.length - 1]
        : {
            temperature: 0,
            humidity: 0,
            time: "--:--",
            created_at: null,
          },
    [data]
  );

  const lastUpdate = latest?.created_at
    ? new Date(latest.created_at).getTime()
    : null;

  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setNow(Date.now()), 0);
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  const diffSeconds =
    lastUpdate && now ? Math.floor((now - lastUpdate) / 1000) : null;

  const isOnline = diffSeconds !== null && diffSeconds < 60;

  const formatRelativeTime = (timestamp: number, currentTimestamp: number) => {
    const diff = Math.floor((currentTimestamp - timestamp) / 1000);

    if (diff < 60) {
      return `${diff} seconds ago`;
    } else if (diff < 3600) {
      return `${Math.floor(diff / 60)} minutes ago`;
    } else if (diff < 86400) {
      return `${Math.floor(diff / 3600)} hours ago`;
    } else {
      return `${Math.floor(diff / 86400)} days ago`;
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-[#07070d] via-[#0b0b12] to-[#05050a] text-slate-100 p-4 md:p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-wide text-white">
              IoT Monitoring — <span className="text-indigo-400">Realtime</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              ESP32 • DHT22 • Supabase · Realtime
            </p>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            <div className="text-right">
              <div className="text-xs text-slate-400">Device</div>
              <div className="font-mono bg-[#0f1724] px-3 py-1 rounded-md text-sm">
                {deviceId}
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-400">Last update</div>
              <div className="font-mono bg-[#0f1724] px-3 py-1 rounded-md text-sm">
                {lastUpdate && now
                  ? formatRelativeTime(lastUpdate, now)
                  : latest.time}
              </div>
            </div>
          </div>
        </motion.header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="border border-[#12203a] bg-linear-to-b from-[#061018] to-[#071022] rounded-xl p-4 shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400">Temperature</div>
                <div
                  className={`text-3xl font-bold mt-2 ${
                    latest.temperature > TEMP_MAX ||
                    latest.temperature < TEMP_MIN
                      ? "text-rose-400"
                      : "text-emerald-300"
                  }`}
                >
                  {latest.temperature.toFixed(1)}°C
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Current reading
                </div>
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-500">
              Min {TEMP_MIN}°C • Max {TEMP_MAX}°C
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="border border-[#132030] bg-linear-to-b from-[#061018] to-[#071022] rounded-xl p-4 shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400">Humidity</div>
                <div
                  className={`text-3xl font-bold mt-2 ${
                    latest.humidity > HUM_MAX || latest.humidity < HUM_MIN
                      ? "text-rose-400"
                      : "text-emerald-300"
                  }`}
                >
                  {latest.humidity.toFixed(1)}%
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Current reading
                </div>
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-500">
              Min {HUM_MIN}% • Max {HUM_MAX}%
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="border border-[#122033] bg-linear-to-b from-[#061018] to-[#071022] rounded-xl p-4 shadow-md"
          >
            <div>
              <div className="text-xs text-slate-400">Device Status</div>
              <div className="flex items-center gap-3 mt-2">
                <span
                  className={`inline-block w-3 h-3 rounded-full shadow-sm ${
                    isOnline ? "bg-emerald-400" : "bg-rose-500"
                  }`}
                />
                <div className="text-sm font-medium">
                  {isOnline
                    ? "Online"
                    : `Offline (${
                        lastUpdate && now
                          ? formatRelativeTime(lastUpdate, now)
                          : "--"
                      })`}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <ChartCard
            title="Temperature (24h)"
            unit="°C"
            dataKey="temperature"
            min={TEMP_MIN}
            max={TEMP_MAX}
            data={data}
          />
          <ChartCard
            title="Humidity (24h)"
            unit="%"
            dataKey="humidity"
            min={HUM_MIN}
            max={HUM_MAX}
            data={data}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-xl bg-[#061017] border border-[#112034] shadow-md"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs text-slate-400">Recent readings</div>
              <div className="text-sm text-slate-300">
                Latest 10 sensor rows
              </div>
            </div>
            <div className="text-xs text-slate-400">Local time</div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full table-auto text-sm">
              <thead>
                <tr className="text-left text-slate-400 text-xs border-b border-[#122033]">
                  <th className="py-2 px-3">Time</th>
                  <th className="py-2 px-3">Temperature</th>
                  <th className="py-2 px-3">Humidity</th>
                </tr>
              </thead>
              <tbody>
                {data
                  .slice(-10)
                  .reverse()
                  .map((r, i) => (
                    <tr
                      key={r.id ?? i}
                      className="border-b border-[#0f2233] hover:bg-[#071627]"
                    >
                      <td className="py-2 px-3 font-mono text-slate-300">
                        {r.time}
                      </td>
                      <td className="py-2 px-3">
                        {r.temperature.toFixed(1)} °C
                      </td>
                      <td className="py-2 px-3">{r.humidity.toFixed(1)} %</td>
                    </tr>
                  ))}
                {data.length === 0 && !loading && (
                  <tr>
                    <td className="py-4 px-3 text-slate-400" colSpan={3}>
                      No data yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        <footer className="mt-6 text-center text-xs text-slate-500">
          Built with ESP32 • DHT22 • Supabase • Next.js
        </footer>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  unit,
  dataKey,
  data,
  min,
  max,
}: {
  title: string;
  unit: string;
  dataKey: string;
  data: SensorDataEntry[];
  min: number;
  max: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="p-4 rounded-xl bg-[#061017] border border-[#112034] shadow-md"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-xs text-slate-400">{title}</div>
          <div className="text-sm text-slate-300">Realtime and historical</div>
        </div>
        <div className="text-xs text-slate-400">{unit}</div>
      </div>

      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer>
          <LineChart
            data={data}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <CartesianGrid stroke="#0b2233" strokeDasharray="3 3" />
            <XAxis dataKey="time" tick={{ fill: "#94a3b8", fontSize: 12 }} />
            <YAxis tick={{ fill: "#94a3b8" }} />
            <Tooltip
              contentStyle={{
                background: "#071327",
                border: "1px solid #13314a",
              }}
              itemStyle={{ color: "#fff" }}
            />
            <ReferenceLine y={max} stroke="#ef4444" strokeDasharray="4 6" />
            <ReferenceLine y={min} stroke="#60a5fa" strokeDasharray="4 6" />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={dataKey === "temperature" ? "#fb7185" : "#06b6d4"}
              strokeWidth={2.4}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
