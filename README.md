# Sanitize — Pool Intelligence

Customer-facing dashboard for pool owners and hotel managers: live water
chemistry, plain-language status, trend/forecast charts, visit history, and
itemized billing. Built from `01_customer_dashboard_spec.pdf` (spec 1 of 2 —
staff logging/backend is a separate, not-yet-built Part 2).

**Live demo (zero install):** https://claude.ai/code/artifact/ad493a0d-3d9f-405a-896d-f69bbd17b7f2

## What's here

| Path | What it is |
|---|---|
| `index.html`, `app.js`, `styles.css` | The dashboard itself — static, no build step |
| `data.js` | Data layer: demo dataset generator + real Supabase queries, same shape either way |
| `supabaseClient.js`, `config.js` | Wiring for a real backend (blank `config.js` = demo mode) |
| `supabase/schema.sql` | Full database schema + Row Level Security policies |
| `supabase/seed.sql` | Optional starter data for a fresh real backend |
| `supabase/functions/ingest-reading/` | Edge Function real pool sensors POST readings to |
| `docs/DEPLOY_AND_DEMO.md` | How to go from this repo to a real URL, and how to demo it |
| `docs/SENSOR_INTEGRATION.md` | How real hardware sensors connect in |
| `docs/PARAMETERS.md` | The chemistry threshold model — tiers, the Watch state, per-pool custom sets |
| `docs/SECURITY.md` | What's actually protecting customer data, and what isn't covered yet |

## Quick start

**Just want to look at it?** Open `index.html` in a browser (or use the live
demo link above) — it runs entirely on a built-in simulated dataset, no setup
needed. Three sample accounts on the login screen: a private owner (1 pool,
running a simpler custom parameter set with no ORP/salinity), a hotel manager
(2 pools, one with an active low-chlorine alert to show off the alert/forecast
flow), and an Admin (read-only "Parameter sets" screen — every threshold set
in the system, and which pools use it).

**Want it running with a real backend, real logins, and eventually real
sensors?** Start with `docs/DEPLOY_AND_DEMO.md`.

## How it's built

Plain HTML/CSS/JS, no framework, no build step — deploys as-is to any static
host. Chart.js for the trend/forecast charts. Supabase (Postgres + Auth) as
the optional real backend; the app runs identically without it, just on
simulated data, so there's always something to show even before a backend
exists.

Nine chemistry parameters, each with Low/Good/Watch/High tiers rather than a
single healthy range (pH, chlorine, combined chlorine, alkalinity, calcium
hardness, stabilizer/CYA, salinity, bromine, ORP; temperature is
display-only). CYA and ORP are still missing one confirmed threshold each —
see `docs/PARAMETERS.md` for the full model and `DEFAULT_PARAMS` in
`data.js` if those need to change. Any pool can run its own custom parameter
set instead of the default (`docs/PARAMETERS.md` again, and the Admin
"Parameter sets" screen).

Supports English, Spanish, Dutch, and Papiamentu (the last is a first-pass
machine translation per the spec's instruction — flagged for native review
before launch, not a blocker).
