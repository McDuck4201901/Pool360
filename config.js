// Sanitize Pool Intelligence — environment config.
//
// Leave both values blank ("") to run the dashboard entirely on its built-in simulated
// dataset — no backend needed. This is the default, and it's what makes the app work
// as a zero-install investor/demo build.
//
// To go live with a real Supabase backend (real accounts, real visits, real sensor data):
//   1. Create a free project at https://supabase.com
//   2. Run supabase/schema.sql against it (SQL Editor -> paste -> Run)
//   3. Project Settings -> API -> copy "Project URL" and the "anon public" key below
//
// The anon key is NOT a secret — it's meant to ship in client-side code. Real access
// control is enforced in the database by Row Level Security policies (see schema.sql),
// not by hiding this key. See docs/SECURITY.md for the full explanation.
window.SANITIZE_CONFIG = {
  supabaseUrl: "",
  supabaseAnonKey: ""
};
