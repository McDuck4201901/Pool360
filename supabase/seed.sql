-- ============================================================================
-- Optional starter data — run AFTER schema.sql, and after you've created the
-- two auth users below (Supabase Auth users can't be created by plain SQL
-- insert; use the Dashboard or the Admin API). This mirrors the two demo
-- accounts in the built-in simulated dataset — M. de Windt (a private owner,
-- one directly-owned property) and Pyrmont (a Hospitality Group manager,
-- scoped to a group with two hotels) — so a fresh real backend starts out
-- populated instead of empty, and both ownership modes have a working example.
--
-- Step 1 — create the auth users (Dashboard -> Authentication -> Users -> Add user):
--   1. m.dewindt@example.com          (private owner)   -> set a password
--   2. pyrmont@login.sanitizepool.internal  (hotel manager) -> set a password
--      (this is the "internal" email behind the login name "pyrmont" —
--       see resolve_login_identifier() in schema.sql)
--
-- Step 2 — copy each user's UID (shown in the Dashboard user list) into the
-- two variables below, then run this whole file in the SQL Editor.
-- ============================================================================
do $$
declare
  dewindt_uid  uuid := '00000000-0000-0000-0000-000000000001'; -- <-- replace
  pyrmont_uid  uuid := '00000000-0000-0000-0000-000000000002'; -- <-- replace
  pyrmont_group_id uuid;
  prop_dewindt uuid;
  prop_pyrmont_main uuid;
  prop_pyrmont_beach uuid;
  pool_home    uuid;
  pool_main    uuid;
  pool_lagoon  uuid;
  pool_beach   uuid;
  tech1 uuid; tech2 uuid; tech3 uuid;
  v uuid;
begin
  -- Pyrmont Hospitality Group — the account below is scoped to this group
  -- (profiles.group_id), not to one property directly, so it sees every
  -- property under it (spec update, 2026-09-24).
  insert into public.hospitality_groups (name) values ('Pyrmont Hospitality Group')
  returning id into pyrmont_group_id;

  -- profiles
  insert into public.profiles (id, account_type, display_name, login_name)
  values (dewindt_uid, 'private_owner', 'M. de Windt', null)
  on conflict (id) do nothing;

  insert into public.profiles (id, account_type, display_name, login_name, group_id)
  values (pyrmont_uid, 'hotel_manager', 'Pyrmont Hospitality Group', 'pyrmont', pyrmont_group_id)
  on conflict (id) do nothing;

  -- properties: de Windt directly owns one (account_id); the two Pyrmont
  -- hotels belong to the group instead (group_id, account_id left null).
  insert into public.properties (account_id, name, location)
  values (dewindt_uid, 'Residence de Windt', 'Jan Thiel, Curaçao')
  returning id into prop_dewindt;

  insert into public.properties (group_id, name, location)
  values (pyrmont_group_id, 'Pyrmont Resort & Spa', 'Willemstad, Curaçao')
  returning id into prop_pyrmont_main;

  insert into public.properties (group_id, name, location)
  values (pyrmont_group_id, 'Pyrmont Beach Club', 'Mambo Beach, Curaçao')
  returning id into prop_pyrmont_beach;

  -- pools
  insert into public.pools (property_id, name) values (prop_dewindt, 'Home Pool') returning id into pool_home;
  insert into public.pools (property_id, name) values (prop_pyrmont_main, 'Main Pool') returning id into pool_main;
  insert into public.pools (property_id, name) values (prop_pyrmont_main, 'Lagoon Pool') returning id into pool_lagoon;
  insert into public.pools (property_id, name) values (prop_pyrmont_beach, 'Beach Club Pool') returning id into pool_beach;

  -- technicians
  insert into public.technicians (name) values ('Robert Martina') returning id into tech1;
  insert into public.technicians (name) values ('Giselle Every') returning id into tech2;
  insert into public.technicians (name) values ('Kevin Statia') returning id into tech3;

  -- one opening visit per pool so the dashboard has something real to show
  insert into public.visits (pool_id, technician_id, occurred_at, source, notes)
  values (pool_home, tech1, now(), 'staff', 'Initial balance check on backend go-live.')
  returning id into v;
  -- Home Pool runs the simpler chlorine-only setup (no ORP/salinity) — see the
  -- HOME_POOL_PARAMS custom set note. If you're seeding a pool onto a custom
  -- parameter set instead of the default, set pools.parameter_set_id accordingly.
  insert into public.readings (visit_id, parameter, value) values
    (v,'ph',7.4),(v,'freeChlorine',2.6),(v,'combinedChlorine',0.05),
    (v,'totalAlkalinity',100),(v,'calciumHardness',300),(v,'cyanuricAcid',40),
    (v,'bromine',4),(v,'temperature',28.6);

  insert into public.visits (pool_id, technician_id, occurred_at, source, notes)
  values (pool_main, tech2, now(), 'staff', 'Initial balance check on backend go-live.')
  returning id into v;
  insert into public.readings (visit_id, parameter, value) values
    (v,'ph',7.3),(v,'freeChlorine',2.9),(v,'combinedChlorine',0.06),
    (v,'totalAlkalinity',105),(v,'calciumHardness',280),(v,'cyanuricAcid',38),
    (v,'salinity',3.1),(v,'bromine',4.1),(v,'orp',690),(v,'temperature',29.0);

  insert into public.visits (pool_id, technician_id, occurred_at, source, notes)
  values (pool_lagoon, tech3, now(), 'staff', 'Chlorine reading low — adjustment scheduled next visit.')
  returning id into v;
  insert into public.readings (visit_id, parameter, value) values
    (v,'ph',7.5),(v,'freeChlorine',0.9),(v,'combinedChlorine',0.08),
    (v,'totalAlkalinity',95),(v,'calciumHardness',310),(v,'cyanuricAcid',42),
    (v,'salinity',2.95),(v,'bromine',3.8),(v,'orp',660),(v,'temperature',28.8);

  insert into public.visits (pool_id, technician_id, occurred_at, source, notes)
  values (pool_beach, tech1, now(), 'staff', 'Initial balance check on backend go-live.')
  returning id into v;
  insert into public.readings (visit_id, parameter, value) values
    (v,'ph',7.4),(v,'freeChlorine',3.0),(v,'combinedChlorine',0.05),
    (v,'totalAlkalinity',110),(v,'calciumHardness',290),(v,'cyanuricAcid',36),
    (v,'salinity',2.8),(v,'bromine',4.2),(v,'orp',705),(v,'temperature',28.9);
end $$;
