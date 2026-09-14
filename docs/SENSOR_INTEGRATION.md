# Connecting real pool sensors

The dashboard has nowhere it "waits" for sensor data — chemistry readings just
come from `visits`, and a visit can come from a technician (staff app, Part 2)
**or** from a sensor. This doc covers the sensor path: what hardware to use,
how a reading gets from the pool to the dashboard, and how to keep it secure.

## The pipeline, end to end

```
[ sensor probe ]  --Wi-Fi/HTTPS-->  [ ingest-reading Edge Function ]  -->  [ Postgres: visits + readings ]  -->  [ dashboard reads it like any other visit ]
```

Nothing about the dashboard changes when a reading is sensor-sourced — a
sensor visit just has `source = 'sensor'` and no technician/products, and the
UI already shows a graceful "Automated sensor" label for those (see
`data.js` → `loadLiveData`, and `visits.source` in `supabase/schema.sql`).

## 1. Choosing hardware

You don't need to build a custom probe from scratch. In rough order of
effort:

| Option | What it is | Effort |
|---|---|---|
| **Off-the-shelf smart monitor** (e.g. ICO Pool, pHin, Blue Riiot) | Floating/inline sensor with its own cloud app | Lowest — but you'd need to pull data out of *their* API into yours, if they expose one. Good for a pilot, not a long-term architecture. |
| **Industrial sensor + microcontroller** (recommended) | Atlas Scientific or DFRobot analog pH/ORP/temperature probes, wired into an ESP32 | Moderate — a few hours of wiring + firmware, full control over what gets sent where |
| **Fully custom multi-parameter board** | Custom PCB, lab-grade probes for every one of the 9 parameters | Highest — right move once you're provisioning dozens of pools, not for a first pilot |

For a first real installation (e.g. the Pyrmont pools), the middle option is
the pragmatic choice: an **ESP32** (has Wi-Fi built in) reading an **Atlas
Scientific pH/ORP/temperature kit**, posting a JSON reading on a timer.
Free chlorine, salinity, alkalinity etc. are harder to sense continuously and
cheaply — many real installations start by automating just pH + ORP +
temperature (which correlates with sanitizer demand) and keep the rest on
staff test-strip visits until the economics of full multi-ion probes make
sense. The schema doesn't care — send whichever parameters you actually have.

## 2. Provisioning a device

Each physical sensor gets its own secret key and is tied to exactly one pool.

```sql
-- Run in the Supabase SQL Editor, once per device:
insert into public.devices (pool_id, label, device_key_hash)
values (
  '<pool-uuid>',
  'Lagoon Pool — ESP32 #1',
  encode(digest('choose-a-long-random-secret-here', 'sha256'), 'hex')
);
```

Flash the same raw secret (`choose-a-long-random-secret-here`) onto the
device — never the hash, the device sends the raw key and the server hashes
it to compare. Generate it with something like:

```bash
openssl rand -hex 32
```

## 3. Sending a reading

`POST` to your ingest endpoint with the device's key in a header:

```
POST https://<project-ref>.supabase.co/functions/v1/ingest-reading
X-Device-Key: <the raw secret from step 2>
Content-Type: application/json

{
  "readings": { "ph": 7.4, "temperature": 29.1 },
  "occurred_at": "2026-09-13T14:00:00Z"   // optional, defaults to "now"
}
```

`readings` can include any subset of: `ph`, `freeChlorine`,
`combinedChlorine`, `totalAlkalinity`, `calciumHardness`, `cyanuricAcid`,
`salinity`, `bromine`, `temperature`. The function validates parameter names
and numeric values, rejects unknown device keys, and rate-limits each device
to one reading per 20 seconds. See `supabase/functions/ingest-reading/index.ts`
for the full implementation.

## 4. Example firmware (ESP32 + Arduino, pH + temperature)

```cpp
#include <WiFi.h>
#include <HTTPClient.h>

const char* WIFI_SSID = "your-wifi";
const char* WIFI_PASS = "your-wifi-password";
const char* ENDPOINT  = "https://<project-ref>.supabase.co/functions/v1/ingest-reading";
const char* DEVICE_KEY = "choose-a-long-random-secret-here";

void setup() {
  Serial.begin(115200);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) delay(500);
}

void loop() {
  float ph = readPhProbe();               // your probe-reading function
  float tempC = readTemperatureProbe();    // your probe-reading function

  HTTPClient http;
  http.begin(ENDPOINT);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Key", DEVICE_KEY);

  String body = String("{\"readings\":{\"ph\":") + ph +
                String(",\"temperature\":") + tempC + String("}}");
  int status = http.POST(body);
  Serial.printf("ingest-reading -> %d\n", status);
  http.end();

  delay(15UL * 60UL * 1000UL); // every 15 minutes — plenty for pool chemistry drift
}
```

Swap `readPhProbe()`/`readTemperatureProbe()` for whatever your probe kit's
library provides (Atlas Scientific ships an Arduino library with exactly
these kinds of calls).

## 5. What this deliberately does NOT do (yet)

- **No OTA/device management UI.** Provisioning is a SQL insert today. Fine
  for a handful of pools; worth a small internal admin page once you're past
  ~10 devices.
- **No offline queue.** If the device loses Wi-Fi, that reading is just
  skipped (not queued/retried). Add local buffering in firmware if pools are
  in areas with unreliable connectivity.
- **No anomaly detection.** A stuck sensor sending the same value forever
  will look "stable," not "broken." Worth adding a staff-side alert
  ("no new reading from Device X in 48h") before relying on sensors alone —
  a good v2, not needed for a pilot.

## 6. Reminder: this is additive, not required

Nothing here changes what's already live. Staff-logged visits (Part 2) work
exactly the same way; a pool can be a mix of staff visits and sensor visits
in the same visit history, and the dashboard just shows them chronologically.
