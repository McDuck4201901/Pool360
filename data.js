"use strict";
// Sanitize Pool Intelligence — data layer.
//
// Owns the shape everything else renders from: ACCOUNTS (keyed by account id)
// and POOLS (keyed by pool id, each with a .visits array, most-recent-first).
// Two ways to fill that shape:
//   - buildDemoData()      synchronous, deterministic simulated dataset (no backend)
//   - loadLiveData(userId) async, real rows from Supabase (see supabase/schema.sql)
// Everything downstream (scoring, screens, charts) reads ACCOUNTS/POOLS and
// doesn't care which one filled them in.

var ACCOUNTS = {};
var POOLS = {};
var ADMIN_AUDIT_EVENTS = []; // live mode only — see loadAdminData()

/* =========================================================
   1. reference data — parameters, products, technicians
   ========================================================= */
// Each parameter is a set of TIERS along a line, not just one healthy range.
// A tier is {tier: 'low'|'good'|'watch'|'high', min?, max?} — min/max omitted
// means unbounded on that side. 'watch' tiers exist only where the spec left
// an intentional gap between "good" and "high" (e.g. free chlorine 4–5ppm) —
// shown as its own distinct state, not folded into either neighbor, and it
// never counts as a hard alert (see poolAlerts below).
//
// `bandHalf` is the scoring yardstick: how many units past the edge of the
// good/watch zone equals a fully zeroed-out score for that parameter — kept
// as an explicit field (not derived from tier width) so open-ended tiers
// like CYA/ORP still score sensibly. `provisional: true` marks a parameter
// whose thresholds are still pending confirmation (surfaced to Admins only —
// see screenAdmin() in app.js).
var DEFAULT_PARAMS = [
  {key:"ph", unit:"", decimals:2, weight:1.4, scale:[6.4,8.4], bandHalf:0.3,
    tiers:[{tier:"low",max:7.0},{tier:"good",min:7.0,max:7.6},{tier:"high",min:7.6}]},
  {key:"freeChlorine", unit:"ppm", decimals:1, weight:1.6, scale:[0,20], bandHalf:1,
    tiers:[{tier:"low",max:2},{tier:"good",min:2,max:4},{tier:"watch",min:4,max:5},{tier:"high",min:5}]},
  {key:"combinedChlorine", unit:"ppm", decimals:2, weight:1.0, scale:[0,1], bandHalf:0.1,
    tiers:[{tier:"good",max:0.2},{tier:"high",min:0.2}]},
  {key:"totalAlkalinity", unit:"ppm", decimals:0, weight:1.0, scale:[0,240], bandHalf:30,
    tiers:[{tier:"low",max:80},{tier:"good",min:80,max:140},{tier:"watch",min:140,max:160},{tier:"high",min:160}]},
  {key:"calciumHardness", unit:"ppm", decimals:0, weight:0.8, scale:[0,600], bandHalf:100,
    tiers:[{tier:"low",max:200},{tier:"good",min:200,max:400},{tier:"high",min:400}]},
  {key:"cyanuricAcid", unit:"ppm", decimals:0, weight:0.8, scale:[0,300], bandHalf:20,
    provisional:true, // Low/Good boundary still pending — only the High threshold (50) is confirmed
    tiers:[{tier:"good",max:50},{tier:"high",min:50}]},
  {key:"salinity", unit:"g/L", decimals:2, weight:0.9, scale:[1,4.5], bandHalf:1.75,
    tiers:[{tier:"low",max:1},{tier:"good",min:1,max:4.5},{tier:"high",min:4.5}]},
  {key:"bromine", unit:"ppm", decimals:1, weight:1.0, scale:[0,10], bandHalf:1,
    tiers:[{tier:"low",max:3},{tier:"good",min:3,max:5},{tier:"high",min:5}]},
  {key:"orp", unit:"mV", decimals:0, weight:1.2, scale:[0,750], bandHalf:100,
    provisional:true, // High ceiling still pending — only the Low threshold (650) is confirmed
    tiers:[{tier:"low",max:650},{tier:"good",min:650}]},
  {key:"temperature", unit:"°C", decimals:1, weight:0, scale:null, tiers:null}
];
DEFAULT_PARAMS.__isDefault = true;
function paramByKey(params, key){ for(var i=0;i<params.length;i++) if(params[i].key===key) return params[i]; }
function poolParams(pool){ return pool.params || DEFAULT_PARAMS; }

// Demo-mode product catalog (translated display names). In live mode this
// array is replaced wholesale by loadLiveData() with the real rows from the
// `products` table — productName()/unit lookups below work unchanged either way.
var PRODUCTS = [
  {id:"chlorine",  name:{en:"Liquid Chlorine 12.5%",es:"Cloro Líquido 12.5%",nl:"Vloeibaar Chloor 12,5%",pap:"Kloro Líkido 12.5%"}, unit:"gal", cost:18.50},
  {id:"acid",      name:{en:"Muriatic Acid",es:"Ácido Muriático",nl:"Zoutzuur",pap:"Ásido Muriátiko"}, unit:"gal", cost:9.75},
  {id:"calcium",   name:{en:"Calcium Chloride",es:"Cloruro de Calcio",nl:"Calciumchloride",pap:"Kloruro di Kalsio"}, unit:"bag", cost:22.00},
  {id:"stabilizer",name:{en:"Cyanuric Stabilizer",es:"Estabilizador Cianúrico",nl:"Cyanuurstabilisator",pap:"Stabilisadó Sianúriko"}, unit:"bag", cost:14.25},
  {id:"salt",      name:{en:"Pool Salt",es:"Sal para Piscina",nl:"Zwembadzout",pap:"Salu di Pisina"}, unit:"bag", cost:11.00},
  {id:"bromine",   name:{en:"Bromine Tablets",es:"Tabletas de Bromo",nl:"Broomtabletten",pap:"Tableta di Bromo"}, unit:"jar", cost:26.50},
  {id:"alkincrease",name:{en:"Alkalinity Increaser",es:"Aumentador de Alcalinidad",nl:"Alkaliniteitsverhoger",pap:"Aumentadó di Alkalinidat"}, unit:"bag", cost:16.75},
  {id:"algaecide", name:{en:"Algaecide",es:"Alguicida",nl:"Algendoder",pap:"Algasida"}, unit:"bottle", cost:19.90},
  {id:"testkit",   name:{en:"Test Reagent Refill",es:"Reactivos de Prueba",nl:"Testreagens navulling",pap:"Reagente di Tès"}, unit:"kit", cost:12.00}
];
function productName(id){ var p; for(var i=0;i<PRODUCTS.length;i++) if(PRODUCTS[i].id===id) p=PRODUCTS[i]; return p ? (p.name[currentLang]||p.name.en) : id; }
function productUnit(id){ var p; for(var i=0;i<PRODUCTS.length;i++) if(PRODUCTS[i].id===id) p=PRODUCTS[i]; return p ? p.unit : ""; }

var TECHNICIANS = ["Robert Martina","Giselle Every","Kevin Statia"];

var NOTE_POOL = {
  en:["Routine balance check, all levels within spec.","Backwashed filter and topped up water level.","Brushed walls and vacuumed light debris.","Adjusted chemistry after heavy rain.","Skimmed surface, checked pump pressure — normal.","Balanced pH and topped off sanitizer."],
  es:["Chequeo de rutina, todos los niveles correctos.","Retrolavado del filtro y nivel de agua rellenado.","Se cepillaron paredes y se aspiró sedimento leve.","Química ajustada tras lluvias fuertes.","Superficie limpiada, presión de bomba normal.","pH balanceado y sanitizante repuesto."],
  nl:["Routinecontrole, alle waarden in orde.","Filter teruggespoeld en waterpeil aangevuld.","Wanden geborsteld en licht vuil opgezogen.","Chemie bijgesteld na zware regen.","Oppervlak geschept, pompdruk normaal.","pH gebalanceerd en sanitizer aangevuld."],
  pap:["Chèk di rutina, tur nivel ta korekto.","Filter a wòrdu laba i nivel di awa a wòrdu kompletá.","Muraya a wòrdu sushá i sedimento leve a wòrdu absorbí.","Kimika ahustá despues di áwaseru fuerte.","Superfisie limpiá, presion di pòmpa normal.","pH balansá i sanitisante kompletá."]
};
function noteFor(idx){ var arr = NOTE_POOL[currentLang]||NOTE_POOL.en; return arr[idx % arr.length]; }

function placeholderPhoto(seedStr){
  var h = 0; for(var i=0;i<seedStr.length;i++){ h=(h<<5)-h+seedStr.charCodeAt(i); h|=0; }
  var hue = 178 + (Math.abs(h) % 26);
  return "data:image/svg+xml;utf8," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">'+
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">'+
    '<stop offset="0" stop-color="hsl('+hue+',55%,42%)"/>'+
    '<stop offset="1" stop-color="hsl('+(hue+18)+',60%,28%)"/></linearGradient></defs>'+
    '<rect width="120" height="120" rx="20" fill="url(#g)"/>'+
    '<circle cx="60" cy="52" r="26" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="3"/>'+
    '<path d="M20 92 Q40 82 60 92 T100 92" fill="none" stroke="rgba(255,255,255,.65)" stroke-width="4" stroke-linecap="round"/>'+
    '</svg>'
  );
}

/* =========================================================
   2. demo mode — deterministic PRNG + simulated visit history
   ========================================================= */
function hashSeed(str){ var h=0; for(var i=0;i<str.length;i++){ h=(h<<5)-h+str.charCodeAt(i); h|=0; } return h||42; }
function mulberry32(seed){ var a=seed; return function(){ a|=0; a=a+0x6D2B79F5|0; var t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }

var NOW = new Date(2026,8,10); // fixed "today" so the demo is stable across reloads
var WEEKS = 26;

function genSeries(rng, center, wobble, driftWeeks){
  // driftWeeks: optional {span, target} to bias the most recent weeks toward a value
  // (used to stage the "chlorine trending low" alert scenario for the demo).
  var vals = [];
  var v = center;
  for(var w=0; w<WEEKS; w++){
    var seasonal = Math.sin(w/5.2)*wobble*0.35;
    var noise = (rng()-0.5)*wobble*0.9;
    v = center + seasonal + noise;
    if(driftWeeks && w >= WEEKS-driftWeeks.span){
      var progress = (w-(WEEKS-driftWeeks.span))/Math.max(1,driftWeeks.span-1);
      v = center + (driftWeeks.target-center)*progress + noise*0.4;
    }
    vals.push(Math.max(0, v));
  }
  return vals;
}

// Derives a plausible "usually sits here" center + spread for the simulator
// from a parameter's good tier, without needing a single [lo,hi] range field
// on the parameter itself (CYA/ORP only have one side of that tier defined).
function paramGenStats(p){
  var good = p.tiers.filter(function(t){ return t.tier==="good"; })[0];
  if(good.min!=null && good.max!=null) return {mid:(good.min+good.max)/2, span:good.max-good.min};
  if(good.min!=null) return {mid:good.min + p.bandHalf*0.5, span:p.bandHalf};
  return {mid:good.max - p.bandHalf*0.5, span:p.bandHalf};
}

// `params`: the parameter set this specific pool is tracking — DEFAULT_PARAMS
// for a standard pool, or a trimmed/adjusted custom list (see buildDemoData's
// "Home Pool" for an example: a simpler setup with no ORP or salinity).
// `propertyName`/`propertyLocation`: denormalized onto the pool (rather than
// looked up via propertyId) so any screen can label a pool by its own hotel
// without a separate lookup — needed once one account can span several
// properties (a Hospitality Group), so there's no single "the account's
// property" to fall back on. Same shape whether the pool came from the demo
// generator, loadLiveData(), or loadAdminData().
function buildPool(id, name, params, scenario, propertyId, propertyName, propertyLocation){
  var rng = mulberry32(hashSeed(id));
  var series = {};
  params.forEach(function(p){
    if(!p.tiers){
      series[p.key] = genSeries(rng, 28.5, 1.6, null); // temperature — display only
      return;
    }
    var stats = paramGenStats(p);
    var center = stats.mid + (rng()-0.5)*stats.span*0.25;
    var wobble = stats.span*0.22;
    var drift = null;
    if(scenario.alertParam===p.key){
      drift = {span: scenario.driftSpan||6, target: scenario.driftTarget};
    }
    series[p.key] = genSeries(rng, center, wobble, drift);
  });

  var visits = [];
  for(var w=0; w<WEEKS; w++){
    var date = new Date(NOW.getTime() - (WEEKS-1-w)*7*24*3600*1000);
    var readings = {};
    params.forEach(function(p){ readings[p.key] = series[p.key][w]; });
    var tech = TECHNICIANS[Math.floor(rng()*TECHNICIANS.length)];
    var nProducts = 1 + Math.floor(rng()*3);
    var used = [], cost = 0;
    var pool = PRODUCTS.slice();
    for(var i=0;i<nProducts;i++){
      var idx = Math.floor(rng()*pool.length);
      var prod = pool.splice(idx,1)[0];
      var qty = +(1+rng()*2.2).toFixed(1);
      var lineCost = +(qty*prod.cost).toFixed(2);
      used.push({id:prod.id, qty:qty, cost:lineCost});
      cost += lineCost;
    }
    visits.push({
      id:id+"-v"+w, poolId:id, date:date, technician:tech,
      readings:readings, products:used, cost:+cost.toFixed(2),
      noteIdx:(hashSeed(id)+w)%6, photo:placeholderPhoto(id+w)
    });
  }
  visits.reverse(); // most recent first

  return {id:id, name:name, propertyId:propertyId, propertyName:propertyName, propertyLocation:propertyLocation, params:params, visits:visits};
}

function buildDemoData(){
  ADMIN_AUDIT_EVENTS = []; // no sensor/service activity concept in demo mode
  // Two hotels under one Hospitality Group (spec update, 2026-09-24: a
  // group-scoped account sees every property in its group, not just one).
  var PROPERTIES = {
    dewindt:        {name:{en:"Residence de Windt",es:"Residencia de Windt",nl:"Residentie de Windt",pap:"Residensha de Windt"}, location:"Jan Thiel, Curaçao"},
    "pyrmont-main": {name:{en:"Pyrmont Resort & Spa",es:"Pyrmont Resort & Spa",nl:"Pyrmont Resort & Spa",pap:"Pyrmont Resort & Spa"}, location:"Willemstad, Curaçao"},
    "pyrmont-beach":{name:{en:"Pyrmont Beach Club",es:"Pyrmont Beach Club",nl:"Pyrmont Beach Club",pap:"Pyrmont Beach Club"}, location:"Mambo Beach, Curaçao"}
  };

  ACCOUNTS = {
    dewindt: {
      id:"dewindt", type:"private_owner",
      loginKey:"m.dewindt@example.com",
      displayName:{en:"M. de Windt",es:"M. de Windt",nl:"M. de Windt",pap:"M. de Windt"},
      contextLabel: PROPERTIES.dewindt.name, contextSub: PROPERTIES.dewindt.location,
      poolIds:["dewindt-home"]
    },
    pyrmont: {
      id:"pyrmont", type:"hotel_manager",
      loginKey:"pyrmont",
      displayName:{en:"Pyrmont Hospitality Group",es:"Grupo Hotelero Pyrmont",nl:"Pyrmont Hotelgroep",pap:"Grupo Hotelero Pyrmont"},
      contextLabel:{en:"Pyrmont Hospitality Group",es:"Grupo Hotelero Pyrmont",nl:"Pyrmont Hotelgroep",pap:"Grupo Hotelero Pyrmont"}, contextSub:"2 hotels · Curaçao",
      poolIds:["pyrmont-main","pyrmont-lagoon","pyrmont-beach"]
    },
    admin: {
      id:"admin", type:"admin",
      loginKey:"admin",
      displayName:{en:"Sanitize Admin",es:"Administrador Sanitize",nl:"Sanitize Beheerder",pap:"Admin di Sanitize"},
      contextLabel:null, contextSub:null, poolIds:[]
    }
  };

  // Home Pool runs a simpler chlorine-only setup — no salt/ORP system, so it
  // doesn't track ORP or salinity at all. This is the demo's example of a
  // per-pool custom parameter set (see docs/DEPLOY_AND_DEMO.md and the Admin
  // "Parameter sets" screen).
  var HOME_POOL_PARAMS = DEFAULT_PARAMS.filter(function(p){ return p.key!=="orp" && p.key!=="salinity"; });

  POOLS = {};
  [
    buildPool("dewindt-home", {en:"Home Pool",es:"Piscina Principal",nl:"Thuiszwembad",pap:"Pisina di Kas"}, HOME_POOL_PARAMS, {alertParam:null}, "dewindt", PROPERTIES.dewindt.name, PROPERTIES.dewindt.location),
    buildPool("pyrmont-main", {en:"Main Pool",es:"Piscina Principal",nl:"Hoofdzwembad",pap:"Pisina Prinsipal"}, DEFAULT_PARAMS, {alertParam:null}, "pyrmont-main", PROPERTIES["pyrmont-main"].name, PROPERTIES["pyrmont-main"].location),
    buildPool("pyrmont-lagoon", {en:"Lagoon Pool",es:"Piscina Lagoon",nl:"Lagoon Zwembad",pap:"Pisina Lagoon"}, DEFAULT_PARAMS, {alertParam:"freeChlorine", driftSpan:5, driftTarget:0.8}, "pyrmont-main", PROPERTIES["pyrmont-main"].name, PROPERTIES["pyrmont-main"].location),
    buildPool("pyrmont-beach", {en:"Beach Club Pool",es:"Piscina Beach Club",nl:"Beach Club Zwembad",pap:"Pisina Beach Club"}, DEFAULT_PARAMS, {alertParam:null}, "pyrmont-beach", PROPERTIES["pyrmont-beach"].name, PROPERTIES["pyrmont-beach"].location)
  ].forEach(function(p){ POOLS[p.id]=p; });
}

/* =========================================================
   3. live mode — pull the same shape out of Supabase
   ========================================================= */
// i18n helper: real product/pool/property names aren't pre-translated the way
// the demo copy is (they're whatever the pool company typed in) — wrap a plain
// string as a "translation object" that returns the same text in every language.
function asIs(str){ return {en:str, es:str, nl:str, pap:str}; }

// A parameter_set_items row -> the same shape DEFAULT_PARAMS entries use, so
// scoring/rendering code never needs to know whether a param list came from
// JS or Postgres.
function transformParamSetItems(items){
  return (items||[]).slice().sort(function(a,b){ return (a.sort_order||0)-(b.sort_order||0); }).map(function(row){
    return {
      key: row.key, unit: row.unit||"", decimals: row.decimals!=null?row.decimals:1, weight: Number(row.weight),
      scale: (row.scale_min!=null && row.scale_max!=null) ? [Number(row.scale_min), Number(row.scale_max)] : null,
      bandHalf: row.band_half!=null ? Number(row.band_half) : 1,
      provisional: !!row.provisional,
      tiers: (row.tiers && row.tiers.length) ? row.tiers : null
    };
  });
}
// Fetches every parameter set once and returns {byId, defaultParams} — shared
// by loadLiveData (each pool needs its own set) and loadAdminData (needs all
// of them to show what exists).
function fetchParameterSets(){
  return sb.from("parameter_sets").select("id,name,is_default,parameter_set_items(*)").then(function(res){
    if(res.error) throw res.error;
    var byId = {};
    (res.data||[]).forEach(function(row){
      byId[row.id] = {id:row.id, name:row.name, isDefault:row.is_default, params: transformParamSetItems(row.parameter_set_items)};
    });
    var defaultEntry = (res.data||[]).filter(function(r){return r.is_default;})[0];
    var defaultParams = defaultEntry ? byId[defaultEntry.id].params : DEFAULT_PARAMS;
    defaultParams.__isDefault = true;
    return {byId: byId, defaultParams: defaultParams};
  });
}

// A profile with group_id set is scoped to every property under that
// Hospitality Group (spec update, 2026-09-24); otherwise it's scoped to the
// single property it directly owns (account_id) — same as before.
function loadLiveData(userId){
  if(!SANITIZE_LIVE) return Promise.reject(new Error("Live backend not configured."));

  return Promise.all([
    sb.from("profiles").select("*").eq("id", userId).single(),
    sb.from("products").select("*"),
    fetchParameterSets()
  ]).then(function(results){
    var profileRes = results[0], productsRes = results[1], paramSets = results[2];
    if(profileRes.error) throw profileRes.error;
    if(productsRes.error) throw productsRes.error;
    var profile = profileRes.data;

    // Replace the product catalog with the real one so productName()/productUnit()
    // work unchanged for live visit_products (see PRODUCTS comment above).
    PRODUCTS = (productsRes.data || []).map(function(row){
      return {id: row.id, name: asIs(row.name), unit: row.unit, cost: Number(row.unit_cost)};
    });

    var propertiesQuery = profile.group_id
      ? sb.from("properties").select("*").eq("group_id", profile.group_id)
      : sb.from("properties").select("*").eq("account_id", userId);
    var groupQuery = profile.group_id
      ? sb.from("hospitality_groups").select("*").eq("id", profile.group_id).single()
      : Promise.resolve({data:null, error:null});

    return Promise.all([propertiesQuery, groupQuery]).then(function(res2){
      var propsRes = res2[0], groupRes = res2[1];
      if(propsRes.error) throw propsRes.error;
      if(groupRes.error) throw groupRes.error;
      var properties = propsRes.data || [];
      if(!properties.length) throw new Error("No property is set up for this account yet.");
      var propById = {};
      properties.forEach(function(pr){ propById[pr.id] = pr; });
      var propertyIds = properties.map(function(pr){ return pr.id; });

      return sb.from("pools").select("*").in("property_id", propertyIds).then(function(poolsRes){
        if(poolsRes.error) throw poolsRes.error;
        var poolRows = poolsRes.data || [];

        return Promise.all(poolRows.map(function(poolRow){
          return sb.from("visits")
            .select("id, occurred_at, notes, photo_url, source, technicians(name), visit_products(qty, line_cost, product_id), readings(parameter, value)")
            .eq("pool_id", poolRow.id)
            .order("occurred_at", {ascending:false})
            .then(function(visitsRes){
              if(visitsRes.error) throw visitsRes.error;
              var visits = (visitsRes.data || []).map(function(row){
                var readings = {};
                (row.readings||[]).forEach(function(r){ readings[r.parameter] = Number(r.value); });
                var products = (row.visit_products||[]).map(function(vp){
                  return {id: vp.product_id, qty: Number(vp.qty), cost: Number(vp.line_cost)};
                });
                var cost = products.reduce(function(s,p){ return s+p.cost; }, 0);
                return {
                  id: row.id, poolId: poolRow.id, date: new Date(row.occurred_at),
                  technician: row.technicians ? row.technicians.name : (row.source==="sensor" ? t("sensorAuto") : "—"),
                  readings: readings, products: products, cost: +cost.toFixed(2),
                  note: row.notes || (row.source==="sensor" ? t("sensorAutoNote") : ""),
                  photo: row.photo_url || placeholderPhoto(row.id)
                };
              });
              var setEntry = poolRow.parameter_set_id ? paramSets.byId[poolRow.parameter_set_id] : null;
              var prop = propById[poolRow.property_id];
              return {
                id: poolRow.id, name: asIs(poolRow.name), propertyId: poolRow.property_id,
                propertyName: asIs(prop.name), propertyLocation: prop.location,
                params: setEntry ? setEntry.params : paramSets.defaultParams, visits: visits
              };
            });
        }));
      }).then(function(poolsBuilt){
        POOLS = {};
        poolsBuilt.forEach(function(p){ POOLS[p.id] = p; });

        var contextLabel, contextSub;
        if(groupRes.data){
          contextLabel = asIs(groupRes.data.name);
          contextSub = t("hotelsCount", {n: properties.length});
        } else {
          contextLabel = asIs(properties[0].name);
          contextSub = properties[0].location;
        }

        ACCOUNTS = {};
        ACCOUNTS[profile.id] = {
          id: profile.id, type: profile.account_type,
          loginKey: profile.login_name || "",
          displayName: asIs(profile.display_name),
          contextLabel: contextLabel, contextSub: contextSub,
          poolIds: poolsBuilt.map(function(p){ return p.id; })
        };
        return ACCOUNTS[profile.id];
      });
    });
  });
}

// Single entry point for "a session exists, load whatever it needs" — checks
// account_type first so an Admin gets loadAdminData() (no property of their
// own — loadLiveData would fail looking for one) and everyone else gets
// their normal loadLiveData().
function loadAccountData(userId){
  return sb.from("profiles").select("account_type").eq("id", userId).single().then(function(res){
    if(res.error) throw res.error;
    return res.data.account_type==="admin" ? loadAdminData() : loadLiveData(userId);
  });
}

// Admin's "Parameter sets" screen (view-only, spec update 2026-09-14): every
// parameter set that exists, and which pools use which one. Live mode uses
// the admin-only RLS read policies on pools/properties (schema.sql); demo
// mode just groups whatever's already in POOLS. Either way the result is a
// flat list groupable by set — see adminParameterSets() below, which both
// paths feed into via the same POOLS shape.
function loadAdminData(){
  if(!SANITIZE_LIVE) return Promise.reject(new Error("Live backend not configured."));
  return fetchParameterSets().then(function(paramSets){
    return Promise.all([
      sb.from("pools").select("*"),
      sb.from("properties").select("id,name,location"),
      sb.from("audit_events").select("*").order("occurred_at", {ascending:false}).limit(20)
    ]).then(function(results){
      var poolsRes = results[0], propsRes = results[1], auditRes = results[2];
      if(poolsRes.error) throw poolsRes.error;
      if(propsRes.error) throw propsRes.error;
      // Non-fatal: audit_events is a spec update — don't block the whole Admin
      // screen if a project hasn't run the latest schema.sql yet.
      ADMIN_AUDIT_EVENTS = auditRes.error ? [] : (auditRes.data || []);
      var propsById = {};
      (propsRes.data||[]).forEach(function(row){ propsById[row.id] = row; });

      POOLS = {};
      (poolsRes.data||[]).forEach(function(row){
        var setEntry = row.parameter_set_id ? paramSets.byId[row.parameter_set_id] : null;
        var prop = propsById[row.property_id];
        POOLS[row.id] = {
          id: row.id, name: asIs(row.name), propertyId: row.property_id,
          propertyName: asIs(prop ? prop.name : "—"), propertyLocation: prop ? prop.location : "",
          params: setEntry ? setEntry.params : paramSets.defaultParams,
          visits: [] // admin view shows set definitions, not customer chemistry history
        };
      });
      return {id:"admin", type:"admin", loginKey:"", displayName:asIs("Admin"), contextLabel:null, contextSub:null, poolIds:[]};
    });
  });
}

// Groups whatever's currently in POOLS by which parameter-set array they
// share (reference equality — true by construction in both buildDemoData and
// the live loaders above, since pools on the same set reuse the same
// transformed array rather than each getting their own copy).
function adminParameterSets(){
  var groups = [], seen = [];
  Object.keys(POOLS).forEach(function(id){
    var pool = POOLS[id];
    var params = poolParams(pool);
    var idx = seen.indexOf(params);
    if(idx===-1){ seen.push(params); groups.push({params:params, isDefault: !!params.__isDefault, pools:[pool]}); }
    else { groups[idx].pools.push(pool); }
  });
  return groups;
}

/* =========================================================
   4. scoring & status — reads whatever is in POOLS, either mode
   ========================================================= */
// Which tier a value falls into, plus (for low/high) how far past the edge
// of the good/watch zone it is and how severe that is — the single place
// tier math happens, so paramStatus/paramScore/poolAlerts all agree.
function paramTierInfo(params, paramKey, value){
  var p = paramByKey(params, paramKey);
  if(!p || !p.tiers) return {tier:"display"};
  var tier = "good";
  for(var i=0;i<p.tiers.length;i++){
    var tr = p.tiers[i];
    var minOk = (tr.min===undefined) || value>=tr.min;
    var maxOk = (tr.max===undefined) || value<tr.max;
    if(minOk && maxOk){ tier = tr.tier; break; }
  }
  if(tier==="good" || tier==="watch") return {tier:tier};

  var goodTier = p.tiers.filter(function(tr){ return tr.tier==="good"; })[0];
  var watchTier = p.tiers.filter(function(tr){ return tr.tier==="watch"; })[0];
  var edge = tier==="low" ? (goodTier && goodTier.min) : (watchTier ? watchTier.max : (goodTier && goodTier.max));
  var scale = p.bandHalf || 1;
  var dev = (edge!=null) ? Math.abs(value-edge) : 0;
  var severity = (dev/scale) > 0.5 ? "critical" : "warn";
  return {tier:tier, dev:dev, scale:scale, severity:severity};
}
function paramStatus(params, paramKey, value){
  return paramTierInfo(params, paramKey, value).tier;
}
function paramScore(params, paramKey, value){
  var info = paramTierInfo(params, paramKey, value);
  if(info.tier==="display" || info.tier==="good") return 100;
  if(info.tier==="watch") return 70; // partial credit — a real state, not a hard alert
  var s = 1 - info.dev/info.scale;
  return Math.max(0, Math.min(1,s))*100;
}
function poolHealth(pool){
  var params = poolParams(pool);
  var latest = pool.visits[0].readings;
  var total=0, wsum=0;
  params.forEach(function(p){
    if(p.weight===0) return;
    total += paramScore(params, p.key, latest[p.key]) * p.weight;
    wsum += p.weight;
  });
  return Math.round(total/wsum);
}
function scoreTier(score){ return score>=85?"good":score>=60?"warn":"critical"; }
function tierColorVar(tier){ return tier==="good"?"var(--good)":tier==="warn"?"var(--warn)":"var(--critical)"; }

// Only 'low'/'high' readings are alerts — 'watch' is a visible-but-quiet
// state (see the param breakdown drawer) and never raises the alert badge.
function poolAlerts(pool){
  var params = poolParams(pool);
  var latest = pool.visits[0].readings;
  var list=[];
  params.forEach(function(p){
    if(!p.tiers) return;
    var info = paramTierInfo(params, p.key, latest[p.key]);
    if(info.tier==="low" || info.tier==="high"){
      list.push({param:p.key, status:info.severity, dir: info.tier==="low"?"trendingLow":"trendingHigh", value:latest[p.key]});
    }
  });
  return list;
}
function nextScheduledDate(pool){
  var last = pool.visits[0].date;
  var next = new Date(last.getTime()+7*24*3600*1000);
  return next;
}
function statusLine(pool){
  var alerts = poolAlerts(pool);
  var score = poolHealth(pool);
  if(alerts.length===0) return {text:t("statusExcellent"), sub:null};
  if(score>=70){
    var a = alerts[0];
    return {text:t("statusAttention",{param:pLabel(a.param), dir:t(a.dir)}), sub:t("scheduledFor",{date:fmtDate(nextScheduledDate(pool))})};
  }
  if(score>=60){
    return {text:t("statusGood"), sub:t("scheduledFor",{date:fmtDate(nextScheduledDate(pool))})};
  }
  return {text:t("statusService"), sub:t("scheduledFor",{date:fmtDate(nextScheduledDate(pool))})};
}

// Node-only export for the test suite (test/scoring.test.js) — no-op in the
// browser, where `module` doesn't exist. Doesn't change runtime behavior.
if(typeof module!=="undefined" && module.exports){
  module.exports = { DEFAULT_PARAMS: DEFAULT_PARAMS, paramByKey: paramByKey, paramTierInfo: paramTierInfo, paramStatus: paramStatus, paramScore: paramScore, poolHealth: poolHealth, poolAlerts: poolAlerts, scoreTier: scoreTier };
}
