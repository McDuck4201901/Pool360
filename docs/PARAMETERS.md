# Chemical parameters & the health-status logic

Spec update, 2026-09-14. This replaces the provisional 5-range table in the
original spec (§5) with a merged, tiered model. What changed and why:

## What's tracked now

Nine parameters — the original set plus the new spec's update, merged rather
than one replacing the other (Combined Chlorine, Calcium Hardness, and
Bromine stayed; the new spec's numbers won out wherever a parameter appears
in both, since they're the more current data):

| Parameter | Scale | Low | Good | Watch | High |
|---|---|---|---|---|---|
| pH | 6.4–8.4 | <7.0 | 7.0–7.6 | — | >7.6 |
| Chlorine (Cl) | 0–20 ppm | <2 | 2–4 | 4–5 | ≥5 |
| Combined Chlorine | 0–1 ppm | — | <0.2 | — | ≥0.2 |
| Alkalinity (Alk) | 0–240 ppm | <80 | 80–140 | 140–160 | ≥160 |
| Calcium Hardness | 0–600 ppm | <200 | 200–400 | — | ≥400 |
| Stabilizer (CYA) | 0–300 ppm | *pending* | *pending*–50 | — | ≥50 |
| Salinity | 1–4.5 g/L | <1 | 1–4.5 | — | ≥4.5 |
| Bromine | 0–10 ppm | <3 | 3–5 | — | ≥5 |
| ORP | 0–750 mV | <650 | ≥650 | — | *pending* |
| Temperature | display only | — | — | — | — |

CYA's Low/Good boundary and ORP's High ceiling are still pending confirmation
— only the confirmed side of each is enforced today (see `provisional: true`
in `data.js`/`schema.sql`). Nothing is flagged as too-low CYA or too-high ORP
until those numbers arrive; update the two `parameter_set_items` rows (or the
matching entries in `DEFAULT_PARAMS`) once they do.

## The Watch tier

Chlorine and Alkalinity each have a gap between Good and High that the spec
didn't assign to either side (Chlorine 4–5ppm, Alkalinity 140–160ppm). Rather
than silently rounding that gap into Good or High, it's its own state:

- Shown as a distinct color everywhere a reading appears (indigo, not the
  green/amber/red used for good/warn/critical).
- Worth 70/100 in the health-score math — a real dent, not a free pass, but
  not treated as broken either.
- **Never raises an alert.** `poolAlerts()` only fires for Low/High. A
  Watch-tier reading is visible in the parameter breakdown drawer and the
  Admin parameter-sets screen, not in the alert banner or the bell badge.

## The health score, updated

The composite 0–100 score (the gauge, the pool cards) still averages
per-parameter scores weighted by importance (`weight` in `DEFAULT_PARAMS`),
same as before. What changed is how a single parameter's score is computed,
now that thresholds are tiers instead of one `[low, high]` range:

- **Good** → 100.
- **Watch** → 70 flat.
- **Low / High** → `100 * max(0, 1 - distance_past_the_edge / bandHalf)`,
  where "the edge" is the good tier's boundary on the low side, and the
  *watch* tier's outer boundary on the high side (if a watch tier exists) —
  so drifting from Good into Watch costs you the fixed 30 points, and further
  drift past Watch into High costs you more, proportionally.
- `bandHalf` is an explicit per-parameter number now (not derived from tier
  width), specifically so CYA and ORP — which only have one side of their
  Good tier defined — still score sensibly instead of dividing by an
  undefined range.

This lives in `paramTierInfo()` / `paramScore()` in `data.js` — one function
computes tier + severity, everything else (score, alert list, dot color,
range-bar marker) reads from it, so there's one place to get this right.

## Per-pool custom sets

A pool can point at a different parameter set than the default — added
because not every pool has the same setup (a basic chlorine pool with no
salt/ORP system shouldn't show ORP/Salinity rows at all, rather than showing
them as permanently blank). See `pools.parameter_set_id` in
`supabase/schema.sql`; `null` means "use whichever set has `is_default =
true`". The demo dataset's "Home Pool" is a worked example — it drops ORP and
Salinity entirely (see `HOME_POOL_PARAMS` in `data.js`).

**Defining or editing a set is a direct-database task for now** — Admins can
view every set and which pools use it (the "Parameter sets" screen), but
there's no in-app editor yet. That's a deliberate scope line for this round,
not an oversight — see the "Admin edit" note in `docs/SECURITY.md`'s change
log if/when that gets built.

## If you're changing thresholds

1. Edit the parameter set — either `DEFAULT_PARAMS` in `data.js` (demo mode)
   or the `parameter_set_items` row in Postgres (real backend). Keep both in
   sync if you want demo and live data to agree.
2. A `tiers` array must stay ordered low→high and each parameter needs at
   least a `good` tier; `min`/`max` can be omitted to mean unbounded.
3. Re-check `bandHalf` — it's not derived automatically, so a widened Good
   band without a matching `bandHalf` change will score too harshly or too
   leniently near the edge.

## Regulatory reference (spec update, 2026-09-25)

The product's own thresholds above (`DEFAULT_PARAMS` / `parameter_sets`) are
what score pools and raise alerts — that's a deliberate product decision,
tuned to this business. Regulatory/public-health guidance is a **separate**,
explicitly-labeled thing: `REGULATORY_REFERENCE` in `data.js` and the
`regulatory_reference` table in Postgres, shown only on the Admin screen as a
side-by-side comparison. Nothing reads it for scoring or alerts.

It's currently seeded with CDC Model Aquatic Health Code (MAHC) and PHTA
(Pool & Hot Tub Alliance) figures — the standard references for US
commercial/hotel pools — as an **explicit placeholder** (`is_placeholder:
true`), because the real jurisdiction-specific regulatory source for this
customer exists but wasn't accessible yet when this was built. The Admin
screen shows a visible "PLACEHOLDER" badge and links the CDC source so this
is never mistaken for the confirmed number.

**Swapping in the real source later:** update the one `regulatory_reference`
row (`UPDATE public.regulatory_reference SET source_name=..., source_url=...,
is_placeholder=false, limits=...`) — no code change, no migration. Mirror the
same values into `DEFAULT_REGULATORY_REFERENCE` in `data.js` if you want demo
mode to show the real numbers too.
