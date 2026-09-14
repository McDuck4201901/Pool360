-- ============================================================================
-- Sanitize Pool Intelligence — database schema (Supabase / Postgres)
-- ============================================================================
-- Run this once against a fresh Supabase project:
--   Dashboard -> SQL Editor -> New query -> paste this whole file -> Run
--
-- Mirrors the data model in the spec (01_customer_dashboard_spec.pdf, section 4):
--   Account -> Property -> Pool -> Visit -> Reading
--                                     \-> Product (via visit_products)
--   Technician: name/id only (full staff detail is Part 2, out of scope here)
--
-- Security model (see docs/SECURITY.md for the full explanation):
--   - Every table has Row Level Security ON.
--   - Customers (private_owner / hotel_manager) can only ever SELECT — and only
--     rows under their own property. There is no INSERT/UPDATE/DELETE grant for
--     the customer-facing dashboard at all.
--   - Writes (visits, readings, product usage) come from either a staff tool
--     (Part 2 — not built here) or the sensor-ingestion Edge Function, both of
--     which use the Supabase *service role* key server-side and so bypass RLS
--     deliberately and narrowly. The service role key must never reach the browser.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. profiles  (one row per customer login; id == auth.users.id)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  account_type  text not null check (account_type in ('private_owner','hotel_manager','admin')),
  display_name  text not null,
  -- Hotel/staff accounts sign in with a plain login name instead of an email
  -- (see resolve_login_identifier() below). Private owners just use their email
  -- and can leave this null.
  login_name    text unique,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. properties  (one property per account in this build — see spec §2)
-- ---------------------------------------------------------------------------
create table if not exists public.properties (
  id          uuid primary key default gen_random_uuid(),
  account_id  uuid not null unique references public.profiles(id) on delete cascade,
  name        text not null,
  location    text not null,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3. parameter_sets / parameter_set_items  (chemistry thresholds — see
--    docs/PARAMETERS.md for the full model). One "default" set ships with the
--    product; any pool can instead point at its own custom set (spec update,
--    2026-09-14: "it should be possible to define a custom parameter set per
--    pool, instead of every pool being locked to the same default set").
-- ---------------------------------------------------------------------------
create table if not exists public.parameter_sets (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);
-- at most one default set
create unique index if not exists one_default_parameter_set
  on public.parameter_sets (is_default) where (is_default = true);

create table if not exists public.parameter_set_items (
  id                uuid primary key default gen_random_uuid(),
  parameter_set_id  uuid not null references public.parameter_sets(id) on delete cascade,
  key               text not null check (key in
                      ('ph','freeChlorine','combinedChlorine','totalAlkalinity',
                       'calciumHardness','cyanuricAcid','salinity','bromine','orp','temperature')),
  unit              text not null default '',
  decimals          int not null default 1,
  weight            numeric not null default 1,     -- 0 = display-only, doesn't feed the health score
  scale_min         numeric,
  scale_max         numeric,
  band_half         numeric,                        -- scoring yardstick — see docs/PARAMETERS.md
  provisional       boolean not null default false,  -- thresholds still pending confirmation
  sort_order        int not null default 0,
  -- Tiers along the line: [{"tier":"low","max":2}, {"tier":"good","min":2,"max":4},
  -- {"tier":"watch","min":4,"max":5}, {"tier":"high","min":5}] — min/max omitted means
  -- unbounded on that side. 'watch' only appears where the spec left an intentional
  -- gap between good and high; it's a visible state, never a hard alert.
  tiers             jsonb not null default '[]'::jsonb,
  unique (parameter_set_id, key)
);

-- ---------------------------------------------------------------------------
-- 4. pools  (N per property, built for N from day one — see spec §2)
-- ---------------------------------------------------------------------------
create table if not exists public.pools (
  id                 uuid primary key default gen_random_uuid(),
  property_id        uuid not null references public.properties(id) on delete cascade,
  name               text not null,
  -- null = use whichever parameter_sets row has is_default = true
  parameter_set_id   uuid references public.parameter_sets(id),
  created_at         timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 5. technicians  (name/id only — full detail is Part 2)
-- ---------------------------------------------------------------------------
create table if not exists public.technicians (
  id    uuid primary key default gen_random_uuid(),
  name  text not null
);

-- ---------------------------------------------------------------------------
-- 6. products  (name + unit cost only — inventory is Part 2)
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  unit       text not null,        -- e.g. 'gal', 'bag', 'jar', 'bottle', 'kit'
  unit_cost  numeric(10,2) not null check (unit_cost >= 0)
);

-- ---------------------------------------------------------------------------
-- 7. devices  (sensor authentication — see docs/SENSOR_INTEGRATION.md)
-- ---------------------------------------------------------------------------
-- Never store the raw device key — only its hash. The ingest-reading Edge
-- Function hashes the incoming key the same way and compares.
create table if not exists public.devices (
  id             uuid primary key default gen_random_uuid(),
  pool_id        uuid not null references public.pools(id) on delete cascade,
  label          text not null,
  device_key_hash text not null,
  created_at     timestamptz not null default now(),
  last_seen_at   timestamptz
);

-- ---------------------------------------------------------------------------
-- 8. visits  (a maintenance visit OR an automated sensor check-in)
-- ---------------------------------------------------------------------------
create table if not exists public.visits (
  id             uuid primary key default gen_random_uuid(),
  pool_id        uuid not null references public.pools(id) on delete cascade,
  technician_id  uuid references public.technicians(id),
  occurred_at    timestamptz not null default now(),
  source         text not null default 'staff' check (source in ('staff','sensor')),
  notes          text,
  photo_url      text,
  created_at     timestamptz not null default now()
);
create index if not exists visits_pool_occurred_idx on public.visits (pool_id, occurred_at desc);

-- ---------------------------------------------------------------------------
-- 9. visit_products  (itemized product usage/cost per visit — spec §3.4)
-- ---------------------------------------------------------------------------
create table if not exists public.visit_products (
  id          uuid primary key default gen_random_uuid(),
  visit_id    uuid not null references public.visits(id) on delete cascade,
  product_id  uuid not null references public.products(id),
  qty         numeric(10,2) not null check (qty > 0),
  line_cost   numeric(10,2) not null check (line_cost >= 0) -- snapshot of qty * unit_cost at time of visit
);

-- ---------------------------------------------------------------------------
-- 10. readings  (one row per chemistry parameter per visit — spec §4, §5)
-- ---------------------------------------------------------------------------
create table if not exists public.readings (
  id          uuid primary key default gen_random_uuid(),
  visit_id    uuid not null references public.visits(id) on delete cascade,
  parameter   text not null check (parameter in
                ('ph','freeChlorine','combinedChlorine','totalAlkalinity',
                 'calciumHardness','cyanuricAcid','salinity','bromine','orp','temperature')),
  value       numeric not null
);
create index if not exists readings_visit_idx on public.readings (visit_id);

-- ---------------------------------------------------------------------------
-- Helper: the set of pool ids the CURRENT user is allowed to see.
-- security definer so it can read profiles/properties/pools once and be reused
-- cheaply inside every RLS policy below, instead of repeating the join.
-- ---------------------------------------------------------------------------
create or replace function public.auth_pool_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select po.id
  from public.pools po
  join public.properties pr on pr.id = po.property_id
  where pr.account_id = auth.uid()
$$;

-- ---------------------------------------------------------------------------
-- Login-by-name support: hotel/staff accounts sign in with a login name, not
-- an email. Supabase Auth is email-based, so we resolve "login name" -> the
-- internal email Supabase actually has on file for that user, then the client
-- calls signInWithPassword with the resolved email. This function is callable
-- by anonymous (not-yet-signed-in) visitors — by design it returns ONLY an
-- email string, never any other profile data, and only for rows that have a
-- login_name set at all.
-- ---------------------------------------------------------------------------
create or replace function public.resolve_login_identifier(identifier text)
returns text
language sql
security definer
stable
as $$
  select case
    when identifier ilike '%@%' then identifier
    else (
      select u.email
      from public.profiles p
      join auth.users u on u.id = p.id
      where p.login_name = lower(identifier)
      limit 1
    )
  end
$$;
grant execute on function public.resolve_login_identifier(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Helper: is the current user an Admin? Used to grant Admins a scoped,
-- READ-ONLY view across parameter sets and which pool uses which one — not a
-- blanket bypass. Admins do NOT get this treatment on visits/readings/devices;
-- that stays customer-only (and staff-tool/service-role) as before. Widening
-- admin access further is a deliberate future decision, not a side effect of
-- this one.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists(select 1 from public.profiles where id = auth.uid() and account_type = 'admin')
$$;

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.profiles            enable row level security;
alter table public.properties          enable row level security;
alter table public.parameter_sets      enable row level security;
alter table public.parameter_set_items enable row level security;
alter table public.pools               enable row level security;
alter table public.technicians         enable row level security;
alter table public.products            enable row level security;
alter table public.devices             enable row level security;
alter table public.visits              enable row level security;
alter table public.visit_products      enable row level security;
alter table public.readings            enable row level security;

-- profiles: a user can read (and update their own display name on) only their own row.
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

-- properties: only the owning account's single property.
create policy "properties_select_own" on public.properties
  for select using (account_id = auth.uid());

-- pools: only pools under the caller's own property (private_owner sees 1+,
-- hotel_manager sees every pool at their property — same query either way,
-- per spec §2: "don't special-case the account type in the pool logic itself").
-- Admins additionally see every pool's id/name/parameter_set_id (not its
-- visits/readings/billing) so the "Parameter sets" admin screen can show
-- which pools use a custom set.
create policy "pools_select_own" on public.pools
  for select using (id in (select public.auth_pool_ids()));
create policy "pools_select_admin" on public.pools
  for select using (public.is_admin());

-- properties: same idea — admins can see property name/location (needed to
-- label a pool in the admin view), not the account's operational history.
create policy "properties_select_admin" on public.properties
  for select using (public.is_admin());

-- technicians & products are shared reference data, readable by any signed-in
-- customer (needed to display a technician's name / a product's name on a
-- visit) but never writable from the customer dashboard.
create policy "technicians_select_authenticated" on public.technicians
  for select using (auth.role() = 'authenticated');
create policy "products_select_authenticated" on public.products
  for select using (auth.role() = 'authenticated');

-- parameter_sets & parameter_set_items: chemistry thresholds aren't
-- account-specific secrets — any signed-in user can read them (a customer's
-- dashboard needs its own pool's set; Admins browse all of them). Nobody gets
-- an insert/update/delete policy yet — defining/editing a custom set is a
-- direct-database task for now (see docs/PARAMETERS.md), matching the
-- "Admins can view, not edit yet" scope for this round.
create policy "parameter_sets_select_authenticated" on public.parameter_sets
  for select using (auth.role() = 'authenticated');
create policy "parameter_set_items_select_authenticated" on public.parameter_set_items
  for select using (auth.role() = 'authenticated');

-- devices: never exposed to customers at all. Only the service role (used
-- server-side by the ingest-reading Edge Function) can read/write this table;
-- with RLS on and no policy defined for authenticated/anon, both are denied.

-- visits / visit_products / readings: only rows under the caller's own pools.
create policy "visits_select_own" on public.visits
  for select using (pool_id in (select public.auth_pool_ids()));
create policy "visit_products_select_own" on public.visit_products
  for select using (visit_id in (select id from public.visits where pool_id in (select public.auth_pool_ids())));
create policy "readings_select_own" on public.readings
  for select using (visit_id in (select id from public.visits where pool_id in (select public.auth_pool_ids())));

-- No insert/update/delete policies exist for authenticated/anon on properties,
-- pools, visits, visit_products or readings — on purpose. Those writes are
-- staff-tool (Part 2) or sensor-ingestion territory and go through the
-- service role key from a trusted server context, never from the browser.

-- ============================================================================
-- Reference data every install needs (safe to run — idempotent-ish via ids).
-- Add/adjust technicians and product pricing to match reality before go-live.
-- ============================================================================
insert into public.products (name, unit, unit_cost) values
  ('Liquid Chlorine 12.5%', 'gal', 18.50),
  ('Muriatic Acid', 'gal', 9.75),
  ('Calcium Chloride', 'bag', 22.00),
  ('Cyanuric Stabilizer', 'bag', 14.25),
  ('Pool Salt', 'bag', 11.00),
  ('Bromine Tablets', 'jar', 26.50),
  ('Alkalinity Increaser', 'bag', 16.75),
  ('Algaecide', 'bottle', 19.90),
  ('Test Reagent Refill', 'kit', 12.00)
on conflict (name) do nothing;

-- Default parameter set — mirrors DEFAULT_PARAMS in data.js exactly, so demo
-- mode and a real backend agree on thresholds out of the box. CYA and ORP are
-- marked provisional: only the confirmed side of each is filled in (see
-- docs/PARAMETERS.md) — update these two rows once the remaining numbers come in.
do $$
declare
  default_set_id uuid;
begin
  insert into public.parameter_sets (name, is_default)
  values ('Standard (Sanitize default)', true)
  on conflict do nothing
  returning id into default_set_id;

  if default_set_id is null then
    select id into default_set_id from public.parameter_sets where is_default = true limit 1;
  end if;

  insert into public.parameter_set_items
    (parameter_set_id, key, unit, decimals, weight, scale_min, scale_max, band_half, provisional, sort_order, tiers)
  values
    (default_set_id, 'ph', '', 2, 1.4, 6.4, 8.4, 0.3, false, 1,
      '[{"tier":"low","max":7.0},{"tier":"good","min":7.0,"max":7.6},{"tier":"high","min":7.6}]'),
    (default_set_id, 'freeChlorine', 'ppm', 1, 1.6, 0, 20, 1, false, 2,
      '[{"tier":"low","max":2},{"tier":"good","min":2,"max":4},{"tier":"watch","min":4,"max":5},{"tier":"high","min":5}]'),
    (default_set_id, 'combinedChlorine', 'ppm', 2, 1.0, 0, 1, 0.1, false, 3,
      '[{"tier":"good","max":0.2},{"tier":"high","min":0.2}]'),
    (default_set_id, 'totalAlkalinity', 'ppm', 0, 1.0, 0, 240, 30, false, 4,
      '[{"tier":"low","max":80},{"tier":"good","min":80,"max":140},{"tier":"watch","min":140,"max":160},{"tier":"high","min":160}]'),
    (default_set_id, 'calciumHardness', 'ppm', 0, 0.8, 0, 600, 100, false, 5,
      '[{"tier":"low","max":200},{"tier":"good","min":200,"max":400},{"tier":"high","min":400}]'),
    (default_set_id, 'cyanuricAcid', 'ppm', 0, 0.8, 0, 300, 20, true, 6,
      '[{"tier":"good","max":50},{"tier":"high","min":50}]'),
    (default_set_id, 'salinity', 'g/L', 2, 0.9, 1, 4.5, 1.75, false, 7,
      '[{"tier":"low","max":1},{"tier":"good","min":1,"max":4.5},{"tier":"high","min":4.5}]'),
    (default_set_id, 'bromine', 'ppm', 1, 1.0, 0, 10, 1, false, 8,
      '[{"tier":"low","max":3},{"tier":"good","min":3,"max":5},{"tier":"high","min":5}]'),
    (default_set_id, 'orp', 'mV', 0, 1.2, 0, 750, 100, true, 9,
      '[{"tier":"low","max":650},{"tier":"good","min":650}]'),
    (default_set_id, 'temperature', '°C', 1, 0, null, null, null, false, 10, '[]')
  on conflict (parameter_set_id, key) do nothing;
end $$;
