# Security model

What's actually protecting customer data, in plain terms, plus what's still
on you before this handles real customers at scale.

## Authentication

- Real accounts use **Supabase Auth** — passwords are hashed (bcrypt) and
  never touch your own code or database tables. Sessions are short-lived
  JWTs, refreshed automatically by the Supabase client library.
- There is **no public sign-up**. Accounts are created by the pool company
  (via the Supabase dashboard or, later, a staff tool) and handed to the
  customer. This matches reality — a customer doesn't get to declare which
  pool is theirs.
- Hotel "login names" (e.g. `pyrmont`) are resolved server-side to an
  internal email before the real Supabase sign-in call
  (`resolve_login_identifier()` in `supabase/schema.sql`). That function
  returns *only* an email string — never anything else about the account —
  so it can safely be called by a not-yet-signed-in visitor.
- Failed sign-in attempts are throttled by Supabase's built-in Auth rate
  limiting — you don't need to build this yourself.

## Authorization (who can see what)

All of it is enforced by **Postgres Row Level Security (RLS)**, not by
frontend code:

- Every table has RLS **on**.
- A signed-in customer can `SELECT` only rows that trace back to their own
  `profiles` row via `properties → pools → visits/readings/visit_products`
  (see the `auth_pool_ids()` helper and the policies in `schema.sql`). A
  private owner and a hotel manager go through the exact same policy — the
  only difference is how many pools their property has, matching spec §2
  ("don't special-case the account type in the pool logic itself").
- There is **no INSERT/UPDATE/DELETE grant** for customers on any
  operational table (`properties`, `pools`, `visits`, `visit_products`,
  `readings`). The customer dashboard is read-only by construction — even a
  compromised customer session can't forge a visit or alter billing history.
- `technicians` and `products` are shared reference data, readable by any
  signed-in customer (needed to show a name/price on a visit) but not
  writable by them either.
- `devices` (sensor keys) has RLS on with **no policies at all** for
  `anon`/`authenticated` — meaning it's completely invisible to every
  client-side session, customer or not. Only the service role can touch it.
- **Admin** (spec update, 2026-09-14) is a third account type with a
  narrow, read-only widening: `is_admin()` grants SELECT on `pools` and
  `properties` (id/name/location/parameter_set_id — enough to label a pool on
  the "Parameter sets" screen). `parameter_sets`/`parameter_set_items`
  themselves aren't account-scoped at all — chemistry thresholds aren't
  secrets, so any signed-in user (customer or Admin) can read every set, same
  as `technicians`/`products` already work. Admins get **no**
  broader access — not to `visits`, `readings`, `visit_products`, `devices`,
  or other customers' `profiles`. Change log: as of this update, Admins can
  view parameter sets but not create/edit them (matches the spec's literal
  ask); editing is a direct-database task until that's explicitly extended —
  if you add an admin editor later, that's the point to add
  INSERT/UPDATE policies gated on `is_admin()`, not a good default to assume.

## The anon key vs. the service role key

This trips people up coming from traditional backends, so to be explicit:

- The **anon key** (in `config.js`, shipped to every browser) is not a
  secret. It identifies your project, nothing more — Supabase's whole design
  assumes it's public. Real protection is 100% the RLS policies above; if
  those are wrong, having the anon key be "secret" wouldn't have saved you.
- The **service role key** (used only inside `ingest-reading` and any future
  staff-tool backend) bypasses RLS entirely. It must **never** reach a
  browser, a public repo, or a client bundle. It lives only in Supabase Edge
  Function secrets / your server's environment variables.

## Sensor device security

- Each physical device gets its own random 256-bit key, provisioned once
  (`supabase/schema.sql` → `devices` table) and stored server-side only as a
  SHA-256 hash — the raw key exists only on the device itself and in
  whatever note you took when you flashed it.
- A wrong or unknown key gets a generic 401 (no hint whether the key format
  was wrong vs. the device doesn't exist).
- Each device is rate-limited to one accepted reading per 20 seconds at the
  ingestion function, independent of anything else — a misbehaving or
  compromised device can't flood the readings table.
- If a device is ever physically compromised (stolen, tampered with),
  delete its row from `devices` — its key stops working immediately, no
  redeploy needed.

## Transport & hosting

- Vercel/Netlify/Cloudflare Pages all terminate HTTPS automatically and for
  free, including on a custom domain — there's no plain-HTTP path to turn
  off.
- Supabase's API is HTTPS-only by default.

## What this does NOT cover (be honest with yourself here)

This gets you a genuinely solid customer-facing auth + data-access story for
free. It is **not** a substitute for a real security review before you're
handling anything beyond what's in this spec:

- **No payment data anywhere in this system.** If you ever add real billing
  (charging a card, not just *displaying* a cost), that's a PCI-scope
  conversation with a payment processor (Stripe etc.) — don't build card
  storage yourself.
- **No audit log.** There's no record of *who* changed what in the backend
  admin flows described above (that's you, doing SQL by hand, today) — worth
  adding before more than one or two people can touch the Supabase dashboard.
- **No automated backups verification.** Supabase backs up your database,
  but "a backup exists" and "we've tested restoring it" are different
  claims — test a restore before you'd bet the business on it.
- **This wasn't audited by a security professional.** For a pilot with one
  or two hotel properties, the model above is appropriate. Before broader
  rollout, or before handling anything more sensitive than pool chemistry
  and line-item costs, get someone whose job this is to look at the RLS
  policies and the Edge Function.
