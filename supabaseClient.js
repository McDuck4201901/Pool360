// Sanitize Pool Intelligence — Supabase wiring.
//
// This file turns config.js into an actual client, and exposes a small auth
// API that app.js calls. If config.js is left blank, SANITIZE_LIVE is false
// and the whole app runs on the simulated dataset in data.js — nothing here
// throws or blocks that path.
"use strict";

var SANITIZE_LIVE = !!(window.SANITIZE_CONFIG && window.SANITIZE_CONFIG.supabaseUrl && window.SANITIZE_CONFIG.supabaseAnonKey);

var sb = null;
if (SANITIZE_LIVE) {
  // window.supabase is the UMD global from the supabase-js <script> tag in index.html.
  sb = window.supabase.createClient(window.SANITIZE_CONFIG.supabaseUrl, window.SANITIZE_CONFIG.supabaseAnonKey);
}

var AuthAPI = {
  // identifier: an email ("m.dewindt@example.com") or a hotel login name ("pyrmont").
  // Login names are resolved to their real internal email server-side first
  // (see resolve_login_identifier() in supabase/schema.sql) so Supabase Auth,
  // which is email-based, never needs to know about "login names" itself.
  signIn: function (identifier, password) {
    if (!SANITIZE_LIVE) return Promise.reject(new Error("Live backend is not configured (config.js is blank)."));
    return sb.rpc("resolve_login_identifier", { identifier: identifier }).then(function (res) {
      if (res.error) throw res.error;
      var email = res.data;
      if (!email) throw new Error("We couldn't find that account.");
      return sb.auth.signInWithPassword({ email: email, password: password });
    }).then(function (res) {
      if (res.error) throw res.error;
      return res.data.session;
    });
  },
  signOut: function () {
    if (!SANITIZE_LIVE) return Promise.resolve();
    return sb.auth.signOut();
  },
  getSession: function () {
    if (!SANITIZE_LIVE) return Promise.resolve(null);
    return sb.auth.getSession().then(function (res) { return res.data.session; });
  }
};
