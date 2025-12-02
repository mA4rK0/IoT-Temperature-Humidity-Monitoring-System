# 🌡️ IoT Temperature & Humidity Monitoring System  
### ESP32 → Next.js API → Supabase Realtime → Telegram Alerts → Mobile Dashboard

A production-ready IoT monitoring system for real-world temperature & humidity tracking.
Built with a secure ingestion pipeline, realtime dashboard, device heartbeat,
alerting system, and mobile-friendly responsive UI.

---

## 🚀 Live Demo  
**Realtime Dashboard:** https://io-t-temperature-humidity-monitorin.vercel.app/  
**Repository:** https://github.com/mA4rK0/IoT-Temperature-Humidity-Monitoring-System

---

# 🧩 System Architecture

![Architecture Diagram](./docs/architecture.png)
Not Ready Diagram!

### **Flow Summary**
1. **ESP32** reads temperature & humidity from a **DHT22** sensor.  
2. Device sends a secure **HTTP POST (JSON)** to a Next.js API endpoint using a `Authorization` header.  
3. API validates the device → inserts the data into **Supabase PostgreSQL**.  
4. **Supabase Realtime** instantly broadcasts new rows to the dashboard.  
5. **Next.js Dashboard** updates charts + tables + device status in realtime.  
6. **Alerting engine** triggers Telegram messages when thresholds exceed limits.  
7. **Heartbeat system** automatically marks device as **Online** or **Offline**.

---

# ✨ Features

## 🔧 Core Features
- 📡 **Realtime temperature & humidity monitoring**  
- 🚀 **ESP32 → Next.js ingestion pipeline**  
- 🗄️ **Supabase PostgreSQL** storage  
- ⚡ **Supabase Realtime** push updates  
- 🛡️ **Secure device authentication** (`Authorization`)  
- 🎨 **Modern, animated dashboard UI** (Next.js + Tailwind + Framer Motion)  

## 📱 Mobile Features
- Fully responsive  
- Touch-friendly charts  
- Compact data layout for phones  
- Mobile status widgets  

## 🔔 Alerting & Monitoring
- **Telegram Alerts** for high/low temperature or humidity  
- Threshold-based warnings  
- Timestamp included in alert payload  
- Optional silent mode  

## 🟢 Device Heartbeat
- Device marked **Online** if last data < X seconds  
- Marked **Offline** automatically  
- Visual indicator on dashboard  
- Useful for cold storage, greenhouse, lab monitoring  

## 📊 Data Visualization
- 24-hour charts for temperature & humidity  
- Animated line charts (Recharts)  
- Recent 10 readings table  
- Local time formatting  

---

# 🔌 Hardware Requirements

- ESP32 DevKit  
- DHT22 Sensor (or DS18B20 alternative)  
- Jumper wires  
- Breadboard (optional)  
- WiFi network  

### Wiring (ESP32 → DHT22)

![Wiring Diagram](./docs/wiring.png)
Not Ready Diagram!

```
DHT22 VCC → 3.3V  
DHT22 GND → GND  
DHT22 Data → GPIO 4  
```

---

# 🧠 Technology Stack

### Device
- ESP32  
- DHT22  
- Arduino Framework  

### Cloud Backend
- Next.js 14 API Route  
- Supabase PostgreSQL  
- Supabase Realtime  
- Supabase Auth  

### Frontend
- Next.js 14  
- TailwindCSS  
- Recharts  
- Framer Motion  
- Responsive Mobile Layout  

---

# 🛠️ ESP32 Firmware (Excerpt)

```cpp
http.begin(SERVER_URL);
http.addHeader("Content-Type", "application/json");
http.addHeader("device-secret", String("Bearer ") + DEVICE_SECRET);

String json = "{\"device_id\":\"esp32-01\",\"temperature\":";
json += temp;
json += ",\"humidity\":";
json += humidity;
json += "}";
```

Full firmware: `iot_code.ino`

---

# 🛠️ Next.js API — Secure Ingestion Route

**Path:** `/api/ingest`

```ts
const headerSecret =
  req.headers.get("device-secret") ||
  req.headers.get("x-device-secret") ||
  req.headers.get("authorization");

const expected = `Bearer ${DEVICE_SECRET}`;
if (!headerSecret || headerSecret !== expected) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

- Validates device  
- Sanitizes incoming payload  
- Inserts data to Supabase  
- Returns inserted row  

File: `/app/api/ingest/route.ts`

---

# 📈 Dashboard Preview

![Dashboard Screenshot](./docs/dashboard.png)
Not Ready

### Includes:
- Temperature + humidity cards  
- Device status indicator  
- 24-hour animated charts  
- Recent readings table  
- Last update time  
- Mobile optimization  
- Smooth transitions  

---

# 🔔 Telegram Alert System

### Trigger Conditions:
- `temperature > TEMP_MAX`  
- `humidity > HUM_MAX` 

### Alert Format:
```
ALERT
Device: esp32-01
Type: humidity_high
Value: 82.5
Time (Asia/Jakarta): 12/01/2025, 01:04:26 PM
Timestamp (UTC): 2025-12-01T06:04:26.085791+00:00

URL: https://io-t-temperature-humidity-monitorin.vercel.app/
```

### Implemented Via:
- Telegram Bot API  
- Next.js server-side alert dispatcher  
- Integrated inside ingestion route  

---

# 🟢 Device Status System (Online / Offline)

### Method:
- Each ingestion updates a `last_seen` timestamp  
- Dashboard calculates:
  - If `now - last_seen < 60s` → **Online**  
  - Else → **Offline**

### UI:
Green dot = Online  
Red dot = Offline  

---

# 🔑 Environment Variables

### Server (Vercel)
```
SUPABASE_SERVICE_KEY=YOUR_SUPABASE_SERVICE_KEY
DEVICE_SECRET=YOUR_CUSTOM_DEVICE_SECRET
TELEGRAM_TOKEN=YOUR_TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID=YOUR_TELEGRAM_CHAT_ID_API
```

### Client
```
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
NEXT_PUBLIC_SITE_URL=YOUR_PUBLIC_SITE_URL
ALERT_TEMP_THRESHOLD=YOUR_TEMP_THRESHOLD
ALERT_HUM_THRESHOLD=YOUR_HUM_THRESHOLD
ALERT_MINUTES_BETWEEN=YOUR_MINUTES_BETWEEN
TIMEZONE=YOUR_TIMEZONE
```

---

# 🧪 Run Locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Local dashboard:  
http://localhost:3000/

---

# 🚀 Deployment (Vercel + Supabase)

### Steps:
1. Deploy to **Vercel**  
2. Add all environment variables  
3. Enable Supabase Realtime:

```sql
select * from supabase_realtime.add_realtime_publication('sensor_data');
```

4. Flash ESP32 with correct  
   - `SERVER_URL`  
   - `DEVICE_SECRET`  
5. Data will appear instantly on dashboard  
6. Alerts will fire automatically  

---

# 📦 Folder Structure not ready

```
IoT-Temperature-Humidity-Monitoring-System
├── LICENCE
├── README.md
├── config.example.h
├── config.h
├── docs/
├── iot_code.ino
└── front-end
    ├── README.md
    ├── eslint.config.mjs
    ├── example.env
    ├── next-env.d.ts
    ├── next.config.ts
    ├── package.json
    ├── pnpm-lock.yaml
    ├── postcss.config.mjs
    ├── tsconfig.json
    ├── public
    │   └── vercel.svg
    └── src
        ├── app
        │   ├── api
        │   │   └── ingest
        │   │       └── route.ts
        │   ├── favicon.ico
        │   ├── globals.css
        │   ├── layout.tsx
        │   └── page.tsx
        └── lib
            ├── useSensorRealtime.ts
            └── useSupabaseClient.ts
```

---

# 🧭 Future Enhancements

- Multi-device support  
- MQTT ingestion mode  
- Multi-user access control  
- CSV/Excel export  
- Long-term (30-day) analytics  
- Chart smoothing + anomaly detection  

---

# 👤 Author

**Marko**  
IoT • Embedded Systems • Robotics • Cloud Integration  

> Building real-world systems that connect hardware, cloud, and people.

---

# 📝 License  
MIT License — free to use & modify.
