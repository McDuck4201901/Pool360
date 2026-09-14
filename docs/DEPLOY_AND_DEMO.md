# Installing, deploying, and demoing this

Three separate questions, answered in order: how do people *view* it today
with zero setup, how do you put it on a real URL with real accounts, and how
do you show it to investors/hotels along the way.

## Option A — show it right now, zero install

This dashboard is already published as a shareable link (built on the
simulated Pyrmont/de Windt dataset, no backend needed):

**https://claude.ai/code/artifact/ad493a0d-3d9f-405a-896d-f69bbd17b7f2**

Anyone with the link can open it in a phone or laptop browser — nothing to
install. This is the fastest way to demo the *product experience* to an
investor or a hotel decision-maker before a single line of backend exists.
Its limits: it's read-only simulated data, and it's hosted on Claude's
infrastructure, not your own domain — fine for a pitch, not for real
customers.

## Option B — your own real, installable web app

This is what the rest of this doc sets up: your own domain, a real Supabase
backend, real logins. Total cost to start: **$0/month** (Supabase and Vercel
both have generous free tiers that comfortably cover a handful of hotel
properties).

### Step 1 — create the backend (Supabase, ~10 minutes)

1. Go to [supabase.com](https://supabase.com) → sign up → **New project**.
   Pick a region close to Curaçao (US East or nearest available).
2. Once it's provisioned: **SQL Editor** → **New query** → paste the entire
   contents of [`supabase/schema.sql`](../supabase/schema.sql) → **Run**.
3. (Optional, recommended for a first real go-live) Create your first two
   real users under **Authentication → Users → Add user**, then run
   [`supabase/seed.sql`](../supabase/seed.sql) with their UIDs filled in —
   this gives the dashboard real starting data instead of an empty account.
4. **Project Settings → API** — copy the **Project URL** and the
   **anon public** key. You'll need these in Step 3. (Also note the
   **service_role** key here, but keep it out of anything client-facing —
   see `docs/SECURITY.md`.)

### Step 2 — deploy the sensor-ingestion function (optional, do this whenever you have real sensors)

Needs the [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
npm install -g supabase
supabase login
supabase link --project-ref <your-project-ref>
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<your service_role key>
supabase functions deploy ingest-reading --no-verify-jwt
```

See `docs/SENSOR_INTEGRATION.md` for what talks to this endpoint.

### Step 3 — configure the frontend

Edit `config.js` in this project:

```js
window.SANITIZE_CONFIG = {
  supabaseUrl: "https://<your-project-ref>.supabase.co",
  supabaseAnonKey: "<your anon public key>"
};
```

That's it — the app detects this automatically and switches from the demo
dataset to real sign-in and real data. Open `index.html` locally (or run any
static file server) to confirm it now shows a real login screen.

### Step 4 — put it on a real URL (Vercel, ~5 minutes)

This is a static site (`index.html` + a few `.js`/`.css` files) — any static
host works (Netlify, Cloudflare Pages, GitHub Pages). Vercel's the path of
least resistance if you don't already have a preference:

1. Push this folder to a GitHub repo (see below if you haven't already).
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import that
   repo. Framework preset: **Other** (it's static — no build step needed).
   Leave build command blank, output directory `.`.
3. Deploy. You get a `*.vercel.app` URL immediately.
4. **Project Settings → Domains** → add your own domain (e.g.
   `dashboard.sanitizepool.com`) and follow the DNS instructions Vercel gives
   you. HTTPS is automatic and free.

```bash
# First time pushing this project to GitHub:
git remote add origin https://github.com/<you>/sanitize-pool-dashboard.git
git branch -M main
git push -u origin main
```

From here on, every `git push` to `main` redeploys automatically.

### Step 5 — provisioning a real customer (private owner or hotel)

There's deliberately no public "sign up" button — customers don't create
their own account, the pool company sets them up (matches how the business
actually works: you're the one who knows which pool belongs to which
login). To onboard someone new:

1. **Authentication → Users → Add user** in Supabase — set their email (or,
   for a hotel's internal login name, an address like
   `pyrmont@login.sanitizepool.internal`) and a temporary password, or use
   **Send invite** to let them set their own password by email.
2. Insert their `profiles` / `properties` / `pools` rows (copy the pattern in
   `supabase/seed.sql`), using the UID Supabase just gave that user.
3. Send them their login (email or login name) and password. They sign in at
   your real URL from Step 4.

Once Part 2 (the staff app) exists, this provisioning step is exactly what
it would automate.

## Demoing to investors and hotels

- **No real backend yet / early pitch:** use the Option A link above, or the
  two sample-account buttons under **"Or preview with sample data"** on the
  real login screen once you're live — they're always there, load the same
  rich simulated dataset, and need no credentials. Good for a laptop-in-hand
  pitch meeting or a projector.
- **Once you're live on your own domain:** the real login screen *is* the
  demo — sign in as a seeded real account (Step 1.3) to show genuine backend
  data, or use the sample-account buttons for the polished multi-month
  history story (real early accounts won't have 6 months of visits yet).
- **Handing someone a link on the spot:** put your Vercel URL into a QR code
  (any free QR generator) on a printed one-pager or a slide — a hotel GM can
  scan it and land straight on the login screen from their phone.
- **Leaving something behind:** the Option A artifact link works from any
  browser with no login and no expiry concerns — good for "here's the
  link, take a look after the meeting."
