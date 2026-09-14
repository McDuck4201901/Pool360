// Sanitize Pool Intelligence — sensor ingestion endpoint (Supabase Edge Function)
//
// Deploy:   supabase functions deploy ingest-reading --no-verify-jwt
// URL:      https://<project-ref>.supabase.co/functions/v1/ingest-reading
//
// This is the one place real sensor hardware talks to. It authenticates each
// request by a per-device secret key (not a customer login), then writes a new
// "visit" of source='sensor' plus its readings — using the service role key,
// which is only ever available inside this server-side function, never in the
// browser. See docs/SENSOR_INTEGRATION.md for the full walkthrough and an
// example ESP32 sketch that POSTs to this exact endpoint.
//
// Required Edge Function secrets (Dashboard -> Edge Functions -> Secrets, or
// `supabase secrets set`):
//   SUPABASE_URL              (auto-provided by the platform)
//   SUPABASE_SERVICE_ROLE_KEY (Project Settings -> API -> service_role — SECRET, never share)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_PARAMS = new Set([
  "ph", "freeChlorine", "combinedChlorine", "totalAlkalinity",
  "calciumHardness", "cyanuricAcid", "salinity", "bromine", "orp", "temperature",
]);

// Devices are matched by the SHA-256 hash of their key, never the raw key —
// mirrors public.devices.device_key_hash in supabase/schema.sql.
async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST only" }), { status: 405 });
  }

  const deviceKey = req.headers.get("x-device-key") ?? "";
  if (!deviceKey) {
    return new Response(JSON.stringify({ error: "Missing X-Device-Key header" }), { status: 401 });
  }

  let body: { readings?: Record<string, number>; occurred_at?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Body must be JSON" }), { status: 400 });
  }

  const readings = body.readings ?? {};
  const entries = Object.entries(readings);
  if (entries.length === 0) {
    return new Response(JSON.stringify({ error: "readings must have at least one parameter" }), { status: 400 });
  }
  for (const [param, value] of entries) {
    if (!ALLOWED_PARAMS.has(param)) {
      return new Response(JSON.stringify({ error: `Unknown parameter: ${param}` }), { status: 400 });
    }
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return new Response(JSON.stringify({ error: `${param} must be a finite number` }), { status: 400 });
    }
  }

  const keyHash = await sha256Hex(deviceKey);
  const { data: device, error: deviceErr } = await supabase
    .from("devices")
    .select("id, pool_id, last_seen_at")
    .eq("device_key_hash", keyHash)
    .maybeSingle();

  if (deviceErr) {
    return new Response(JSON.stringify({ error: "Lookup failed" }), { status: 500 });
  }
  if (!device) {
    // Unknown key — do not distinguish "wrong key" from "no such device" in the response.
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  // Simple abuse guard: refuse more than one reading per device per 20 seconds.
  if (device.last_seen_at) {
    const secondsSinceLast = (Date.now() - new Date(device.last_seen_at).getTime()) / 1000;
    if (secondsSinceLast < 20) {
      return new Response(JSON.stringify({ error: "Too many requests" }), { status: 429 });
    }
  }

  const occurredAt = body.occurred_at ?? new Date().toISOString();

  const { data: visit, error: visitErr } = await supabase
    .from("visits")
    .insert({ pool_id: device.pool_id, occurred_at: occurredAt, source: "sensor" })
    .select("id")
    .single();

  if (visitErr) {
    return new Response(JSON.stringify({ error: visitErr.message }), { status: 500 });
  }

  const readingRows = entries.map(([parameter, value]) => ({ visit_id: visit.id, parameter, value }));
  const { error: readingsErr } = await supabase.from("readings").insert(readingRows);
  if (readingsErr) {
    return new Response(JSON.stringify({ error: readingsErr.message }), { status: 500 });
  }

  await supabase.from("devices").update({ last_seen_at: occurredAt }).eq("id", device.id);

  return new Response(JSON.stringify({ ok: true, visit_id: visit.id }), {
    status: 201,
    headers: { "content-type": "application/json" },
  });
});
