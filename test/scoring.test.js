// Tests for the health-scoring logic in data.js — the highest-value target
// flagged in the 2026-09-24 audit (pure functions, no DOM, cheap to test).
// Run with: node --test   (Node's built-in test runner — no dependencies)
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { DEFAULT_PARAMS, paramTierInfo, paramScore, poolHealth, poolAlerts, scoreTier } = require("../data.js");

// A reading for every parameter, comfortably inside its Good tier, so a pool
// built from this scores 100 — tests override just the parameter under test.
const GOOD_READINGS = {
  ph: 7.3, freeChlorine: 3, combinedChlorine: 0.1, totalAlkalinity: 110,
  calciumHardness: 300, cyanuricAcid: 40, salinity: 2.75, bromine: 4,
  orp: 700, temperature: 28
};
function poolWith(overrides){
  return { visits: [{ readings: Object.assign({}, GOOD_READINGS, overrides) }] };
}

test("paramTierInfo — tier boundaries", () => {
  assert.equal(paramTierInfo(DEFAULT_PARAMS, "ph", 7.3).tier, "good");
  assert.equal(paramTierInfo(DEFAULT_PARAMS, "ph", 6.9).tier, "low");
  assert.equal(paramTierInfo(DEFAULT_PARAMS, "ph", 7.7).tier, "high");

  // Free chlorine has the Watch gap (4-5ppm) called out in the 09-14 spec update.
  assert.equal(paramTierInfo(DEFAULT_PARAMS, "freeChlorine", 1).tier, "low");
  assert.equal(paramTierInfo(DEFAULT_PARAMS, "freeChlorine", 3).tier, "good");
  assert.equal(paramTierInfo(DEFAULT_PARAMS, "freeChlorine", 4.5).tier, "watch");
  assert.equal(paramTierInfo(DEFAULT_PARAMS, "freeChlorine", 6).tier, "high");
});

test("paramTierInfo — provisional params (CYA/ORP) have no tier on the unconfirmed side", () => {
  // CYA: only the High threshold (50) is confirmed — nothing is "low" yet.
  assert.equal(paramTierInfo(DEFAULT_PARAMS, "cyanuricAcid", 0).tier, "good");
  assert.equal(paramTierInfo(DEFAULT_PARAMS, "cyanuricAcid", 60).tier, "high");
  // ORP: only the Low threshold (650) is confirmed — nothing is "high" yet.
  assert.equal(paramTierInfo(DEFAULT_PARAMS, "orp", 1000).tier, "good");
  assert.equal(paramTierInfo(DEFAULT_PARAMS, "orp", 500).tier, "low");

  const cya = DEFAULT_PARAMS.find(p => p.key === "cyanuricAcid");
  const orp = DEFAULT_PARAMS.find(p => p.key === "orp");
  assert.equal(cya.provisional, true);
  assert.equal(orp.provisional, true);
  assert.ok(!DEFAULT_PARAMS.find(p => p.key === "ph").provisional, "ph should not be marked provisional");
});

test("paramScore — good=100, watch=70 flat, low/high scale with distance past the edge", () => {
  assert.equal(paramScore(DEFAULT_PARAMS, "freeChlorine", 3), 100);
  assert.equal(paramScore(DEFAULT_PARAMS, "freeChlorine", 4.5), 70);
  // edge = good.min (2), bandHalf = 1 -> dev 0.5 -> score 50
  assert.equal(paramScore(DEFAULT_PARAMS, "freeChlorine", 1.5), 50);
  // dev 2 >= bandHalf 1 -> clamped to 0, never negative
  assert.equal(paramScore(DEFAULT_PARAMS, "freeChlorine", 0), 0);
});

test("poolHealth — all-good pool scores 100", () => {
  assert.equal(poolHealth(poolWith({})), 100);
});

test("poolHealth — one zeroed-out parameter pulls the weighted composite down predictably", () => {
  // freeChlorine weight 1.6 of 9.7 total (temperature's weight 0 excluded).
  // score 0 for that one param -> (9.7-1.6)*100 / 9.7 = 83.50... -> rounds to 84.
  assert.equal(poolHealth(poolWith({ freeChlorine: 0 })), 84);
});

test("poolAlerts — Watch never raises an alert; Low/High do, with correct severity", () => {
  assert.equal(poolAlerts(poolWith({ freeChlorine: 4.5 })).length, 0, "watch-tier reading must not alert");

  const alerts = poolAlerts(poolWith({ freeChlorine: 0 }));
  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].param, "freeChlorine");
  assert.equal(alerts[0].dir, "trendingLow");
  assert.equal(alerts[0].status, "critical"); // dev(2)/bandHalf(1) = 2 > 0.5
});

test("scoreTier — composite score bands", () => {
  assert.equal(scoreTier(90), "good");
  assert.equal(scoreTier(85), "good");
  assert.equal(scoreTier(70), "warn");
  assert.equal(scoreTier(60), "warn");
  assert.equal(scoreTier(50), "critical");
});
