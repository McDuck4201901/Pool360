"use strict";


/* =========================================================
   0. i18n
   ========================================================= */
var LANGS = ["en","es","nl","pap"];
var LANG_NAMES = {en:"English",es:"Español",nl:"Nederlands",pap:"Papiamentu"};

var PARAM_LABELS = {
  ph:            {en:"pH",                 es:"pH",                   nl:"pH",                   pap:"pH"},
  freeChlorine:  {en:"Chlorine (Cl)",      es:"Cloro (Cl)",           nl:"Chloor (Cl)",          pap:"Kloro (Cl)"},
  combinedChlorine:{en:"Combined Chlorine", es:"Cloro Combinado",      nl:"Gebonden Chloor",      pap:"Kloro Kombiná"},
  totalAlkalinity:{en:"Alkalinity (Alk)",  es:"Alcalinidad (Alk)",    nl:"Alkaliniteit (Alk)",   pap:"Alkalinidat (Alk)"},
  calciumHardness:{en:"Calcium Hardness",   es:"Dureza de Calcio",     nl:"Calciumhardheid",      pap:"Doresa di Kalsio"},
  cyanuricAcid:  {en:"Stabilizer (CYA)",   es:"Estabilizador (CYA)",  nl:"Stabilisator (CYA)",   pap:"Stabilisadó (CYA)"},
  salinity:      {en:"Salinity",            es:"Salinidad",            nl:"Zoutgehalte",          pap:"Salinidat"},
  bromine:       {en:"Bromine",             es:"Bromo",                nl:"Broom",                pap:"Bromo"},
  orp:           {en:"ORP",                es:"ORP",                  nl:"ORP",                  pap:"ORP"},
  temperature:   {en:"Temperature",         es:"Temperatura",          nl:"Temperatuur",          pap:"Temperatura"}
};

var STR = {
  appName:{en:"Sanitize",es:"Sanitize",nl:"Sanitize",pap:"Sanitize"},
  tagline:{en:"Pool Intelligence",es:"Inteligencia de Piscina",nl:"Zweminzicht",pap:"Inteligensia di Pisina"},
  loginTitle:{en:"Welcome back",es:"Bienvenido de nuevo",nl:"Welkom terug",pap:"Bon bini bèk"},
  loginSub:{en:"Sign in to view live water chemistry, visit history and billing for your pool.",es:"Inicia sesión para ver la química del agua, el historial de visitas y la facturación.",nl:"Log in om waterchemie, bezoekhistorie en facturatie te bekijken.",pap:"Log in pa mira kimika di awa, historia di bishita i fakturashon."},
  emailLabel:{en:"Email",es:"Correo electrónico",nl:"E-mail",pap:"Email"},
  loginNameLabel:{en:"Login name",es:"Nombre de usuario",nl:"Inlognaam",pap:"Nòmber di login"},
  passwordLabel:{en:"Password",es:"Contraseña",nl:"Wachtwoord",pap:"Kontraseña"},
  signIn:{en:"Sign in",es:"Iniciar sesión",nl:"Inloggen",pap:"Log in"},
  orDemo:{en:"Or continue with a demo account",es:"O continúa con una cuenta de demostración",nl:"Of ga verder met een demo-account",pap:"Of sigui ku un kuenta demo"},
  demoOwnerName:{en:"M. de Windt",es:"M. de Windt",nl:"M. de Windt",pap:"M. de Windt"},
  demoOwnerSub:{en:"Private owner · 1 pool",es:"Propietario privado · 1 piscina",nl:"Particuliere eigenaar · 1 zwembad",pap:"Doño privá · 1 pisina"},
  demoHotelName:{en:"Pyrmont Resort & Spa",es:"Pyrmont Resort & Spa",nl:"Pyrmont Resort & Spa",pap:"Pyrmont Resort & Spa"},
  demoHotelSub:{en:"Hotel manager · 2 pools",es:"Gerente de hotel · 2 piscinas",nl:"Hotelmanager · 2 zwembaden",pap:"Manager di hotel · 2 pisina"},
  demoAdminName:{en:"Sanitize Admin",es:"Administrador Sanitize",nl:"Sanitize Beheerder",pap:"Admin di Sanitize"},
  demoAdminSub:{en:"Admin · Parameter sets",es:"Admin · Conjuntos de parámetros",nl:"Beheerder · Parametersets",pap:"Admin · Konjunto di parámetro"},
  navOverview:{en:"Overview",es:"Resumen",nl:"Overzicht",pap:"Resúmen"},
  navBilling:{en:"Billing",es:"Facturación",nl:"Facturatie",pap:"Fakturashon"},
  navLogout:{en:"Log out",es:"Cerrar sesión",nl:"Uitloggen",pap:"Sali"},
  overviewTitle:{en:"Property overview",es:"Resumen de la propiedad",nl:"Overzicht accommodatie",pap:"Resúmen di propiedat"},
  overviewSub:{en:"All pools at this property, at a glance.",es:"Todas las piscinas de esta propiedad, de un vistazo.",nl:"Alle zwembaden van deze accommodatie in één oogopslag.",pap:"Tur pisina di e propiedat aki, den un wak."},
  statTotalPools:{en:"Total pools",es:"Piscinas totales",nl:"Totaal zwembaden",pap:"Total di pisina"},
  statOutOfRange:{en:"Out of range now",es:"Fuera de rango ahora",nl:"Nu buiten bereik",pap:"Fuera di rango awor"},
  statSpend:{en:"Spend this month",es:"Gasto este mes",nl:"Uitgaven deze maand",pap:"Gasto e luna aki"},
  viewPool:{en:"View pool →",es:"Ver piscina →",nl:"Bekijk zwembad →",pap:"Wak pisina →"},
  healthLabel:{en:"Pool Health",es:"Salud de la piscina",nl:"Zwembadstatus",pap:"Salú di pisina"},
  tapDetails:{en:"Tap gauge for full breakdown",es:"Toca el medidor para más detalles",nl:"Tik op de meter voor details",pap:"Toka e medidor pa mas detaye"},
  breakdownTitle:{en:"Water chemistry breakdown",es:"Desglose de la química del agua",nl:"Waterchemie in detail",pap:"Detaye di kimika di awa"},
  inRange:{en:"In range",es:"En rango",nl:"Binnen bereik",pap:"Den rango"},
  outRange:{en:"Out of range",es:"Fuera de rango",nl:"Buiten bereik",pap:"Fuera di rango"},
  displayOnly:{en:"Display only",es:"Solo informativo",nl:"Alleen weergave",pap:"Solo pa mustra"},
  lastReading:{en:"Last reading",es:"Última lectura",nl:"Laatste meting",pap:"Último medishon"},
  alertsTitle:{en:"Active alerts",es:"Alertas activas",nl:"Actieve meldingen",pap:"Alerta aktivo"},
  alertsNone:{en:"Everything is within the healthy range.",es:"Todo está dentro del rango saludable.",nl:"Alles binnen het gezonde bereik.",pap:"Tur kos ta den rango saludabel."},
  alertsAutoClear:{en:"Alerts clear automatically once the next visit brings a reading back in range.",es:"Las alertas se borran automáticamente cuando la próxima visita corrige la lectura.",nl:"Meldingen verdwijnen automatisch zodra het volgende bezoek de meting herstelt.",pap:"Alerta ta desaparesé outomátikamente ora e siguiente bishita drecha e medishon."},
  scheduledFor:{en:"scheduled for adjustment {date}",es:"ajuste programado para el {date}",nl:"aanpassing gepland voor {date}",pap:"ahuste pland pa {date}"},
  notifyPrefs:{en:"Notify me via",es:"Notificarme por",nl:"Waarschuw me via",pap:"Notifiká mi via"},
  email:{en:"Email",es:"Correo",nl:"E-mail",pap:"Email"},
  sms:{en:"SMS",es:"SMS",nl:"SMS",pap:"SMS"},
  trendCompare:{en:"Trend & comparison",es:"Tendencia y comparación",nl:"Trend & vergelijking",pap:"Tendensia & komparashon"},
  trendSub:{en:"See whether each reading is stable or drifting over time.",es:"Observa si cada lectura es estable o cambia con el tiempo.",nl:"Zie of elke meting stabiel is of afwijkt.",pap:"Wak si kada medishon ta stabil òf ta drif."},
  thisMonthAvg:{en:"This month avg.",es:"Promedio este mes",nl:"Gem. deze maand",pap:"Promedio e luna aki"},
  lastMonthAvg:{en:"Last month avg.",es:"Promedio mes pasado",nl:"Gem. vorige maand",pap:"Promedio luna pasá"},
  forecastTitle:{en:"Forecast",es:"Pronóstico",nl:"Voorspelling",pap:"Pronóstiko"},
  forecastSub:{en:"Projected trend for the next few weeks, based on visit history.",es:"Tendencia proyectada para las próximas semanas, según el historial.",nl:"Verwachte trend voor de komende weken, gebaseerd op de geschiedenis.",pap:"Tendensia projektá pa e siguiente simannan."},
  forecastStable:{en:"Projected to stay within the healthy range.",es:"Se proyecta que se mantenga dentro del rango saludable.",nl:"Verwacht wordt dat dit binnen het gezonde bereik blijft.",pap:"Ta projektá pa keda den rango saludabel."},
  forecastDrift:{en:"Projected to drift {dir} of range around {date} if untreated.",es:"Se proyecta que se salga del rango ({dir}) cerca del {date} si no se trata.",nl:"Verwacht wordt dat dit rond {date} buiten bereik raakt ({dir}) indien onbehandeld.",pap:"Ta projektá pa sali for di rango ({dir}) serka di {date} si no ta trata."},
  visitHistory:{en:"Visit history",es:"Historial de visitas",nl:"Bezoekgeschiedenis",pap:"Historia di bishita"},
  visitHistorySub:{en:"Every maintenance visit for this pool, most recent first.",es:"Cada visita de mantenimiento de esta piscina, la más reciente primero.",nl:"Elk onderhoudsbezoek voor dit zwembad, meest recente eerst.",pap:"Kada bishita di mantenshon pa e pisina aki, mas resien promé."},
  technician:{en:"Technician",es:"Técnico",nl:"Technicus",pap:"Tékniko"},
  products:{en:"Products used",es:"Productos usados",nl:"Gebruikte producten",pap:"Produkto usá"},
  billingTitle:{en:"Cost & billing",es:"Costos y facturación",nl:"Kosten & facturatie",pap:"Costo & fakturashon"},
  billingSub:{en:"Itemized product cost for every visit. Labor is not billed.",es:"Costo de productos detallado por visita. La mano de obra no se factura.",nl:"Gespecificeerde productkosten per bezoek. Arbeid wordt niet gefactureerd.",pap:"Costo di produkto detayá pa kada bishita. Man di obra no ta wòrdu fakturá."},
  costThisMonth:{en:"Cost this month",es:"Costo este mes",nl:"Kosten deze maand",pap:"Costo e luna aki"},
  costYtd:{en:"Cost year-to-date",es:"Costo en lo que va del año",nl:"Kosten dit jaar",pap:"Costo pa e aña aki"},
  costPerPool:{en:"Avg. cost per pool / mo.",es:"Costo prom. por piscina / mes",nl:"Gem. kosten per zwembad/mnd",pap:"Costo promedio pa pisina/luna"},
  visitsLogged:{en:"Visits logged (12 mo.)",es:"Visitas registradas (12 m.)",nl:"Bezoeken gelogd (12 mnd.)",pap:"Bishita registrá (12 luna)"},
  exportCsv:{en:"Export CSV",es:"Exportar CSV",nl:"CSV exporteren",pap:"Ekspòrtá CSV"},
  exportPdf:{en:"Export PDF",es:"Exportar PDF",nl:"PDF exporteren",pap:"Ekspòrtá PDF"},
  colDate:{en:"Date",es:"Fecha",nl:"Datum",pap:"Fecha"},
  colPool:{en:"Pool",es:"Piscina",nl:"Zwembad",pap:"Pisina"},
  colTech:{en:"Technician",es:"Técnico",nl:"Technicus",pap:"Tékniko"},
  colItems:{en:"Products",es:"Productos",nl:"Producten",pap:"Produkto"},
  colCost:{en:"Cost",es:"Costo",nl:"Kosten",pap:"Costo"},
  allPools:{en:"All pools",es:"Todas las piscinas",nl:"Alle zwembaden",pap:"Tur pisina"},
  copyCsv:{en:"Copy CSV to clipboard",es:"Copiar CSV al portapapeles",nl:"CSV naar klembord kopiëren",pap:"Kopia CSV",},
  copied:{en:"Copied to clipboard",es:"Copiado al portapapeles",nl:"Gekopieerd naar klembord",pap:"Kopiá"},
  printSave:{en:"Print / Save as PDF",es:"Imprimir / Guardar como PDF",nl:"Afdrukken / Opslaan als PDF",pap:"Imprimí / Warda komo PDF"},
  exportNote:{en:"Opens your browser's print dialog — choose “Save as PDF” as the destination.",es:"Abre el diálogo de impresión — elige “Guardar como PDF” como destino.",nl:"Opent het afdrukvenster — kies “Opslaan als PDF”.",pap:"Ta habri e diálogo di imprementá — skohe “Warda komo PDF”."},
  fullPricing:{en:"Full pricing is visible on every visit — no hidden costs.",es:"El precio completo es visible en cada visita, sin costos ocultos.",nl:"Volledige prijzen zichtbaar per bezoek — geen verborgen kosten.",pap:"Preis kompleto ta visibel pa kada bishita — sin costo skondí."},
  close:{en:"Close",es:"Cerrar",nl:"Sluiten",pap:"Sera"},
  back:{en:"Back",es:"Atrás",nl:"Terug",pap:"Bèk"},
  statusExcellent:{en:"Your pool is in excellent condition.",es:"Su piscina está en excelente condición.",nl:"Uw zwembad verkeert in uitstekende staat.",pap:"Bo pisina ta den kondishon ekselente."},
  statusGood:{en:"Your pool is in good condition, with one small item to watch.",es:"Su piscina está en buena condición, con un pequeño detalle a vigilar.",nl:"Uw zwembad is in goede staat, met één klein aandachtspunt.",pap:"Bo pisina ta bon, ku un detaye chikí pa observá."},
  statusAttention:{en:"Your pool needs a little attention — {param} is trending {dir}.",es:"Su piscina necesita un poco de atención — {param} está en tendencia {dir}.",nl:"Uw zwembad heeft wat aandacht nodig — {param} loopt {dir}.",pap:"Bo pisina mester un poko atenshon — {param} ta tendensha {dir}."},
  statusService:{en:"Your pool needs service soon — several readings are out of range.",es:"Su piscina necesita servicio pronto — varias lecturas están fuera de rango.",nl:"Uw zwembad heeft binnenkort onderhoud nodig — meerdere metingen wijken af.",pap:"Bo pisina mester sirbishi pronto — vários medishon ta fuera di rango."},
  trendingLow:{en:"low",es:"baja",nl:"laag",pap:"abou"},
  trendingHigh:{en:"high",es:"alta",nl:"hoog",pap:"haltu"},
  langLabel:{en:"Language",es:"Idioma",nl:"Taal",pap:"Idioma"},
  poolsCount:{en:"{n} pools",es:"{n} piscinas",nl:"{n} zwembaden",pap:"{n} pisina"},
  tierGood:{en:"Excellent",es:"Excelente",nl:"Uitstekend",pap:"Ekselente"},
  tierWarn:{en:"Attention",es:"Atención",nl:"Aandacht",pap:"Atenshon"},
  tierCritical:{en:"Service needed",es:"Necesita servicio",nl:"Onderhoud nodig",pap:"Mester sirbishi"},
  monthsCovered:{en:"Months covered",es:"Meses cubiertos",nl:"Maanden gedekt",pap:"Luna kubrí"},
  orDemoLive:{en:"Or preview with sample data",es:"O explora con datos de muestra",nl:"Of bekijk met voorbeelddata",pap:"Of purba ku data di muestra"},
  authErrorMissing:{en:"Enter your login and password.",es:"Ingresa tu usuario y contraseña.",nl:"Vul je inloggegevens en wachtwoord in.",pap:"Yena bo login i kontraseña."},
  authErrorGeneric:{en:"We couldn't sign you in. Check your details and try again.",es:"No pudimos iniciar tu sesión. Verifica tus datos e intenta de nuevo.",nl:"Inloggen is niet gelukt. Controleer je gegevens en probeer opnieuw.",pap:"No por a log in bo. Chek bo detaye i purba atrobe."},
  loadingPools:{en:"Loading your pools…",es:"Cargando tus piscinas…",nl:"Zwembaden laden…",pap:"Ta karga bo pisinanan…"},
  sensorAuto:{en:"Automated sensor",es:"Sensor automático",nl:"Automatische sensor",pap:"Sensor outomátiko"},
  sensorAutoNote:{en:"Reading logged automatically by an in-pool sensor.",es:"Lectura registrada automáticamente por un sensor en la piscina.",nl:"Meting automatisch geregistreerd door een sensor in het zwembad.",pap:"Medishon registrá outomátikamente pa un sensor den pisina."},
  navParamSets:{en:"Parameter sets",es:"Conjuntos de parámetros",nl:"Parameterset",pap:"Konjunto di parámetro"},
  adminTitle:{en:"Parameter sets",es:"Conjuntos de parámetros",nl:"Parametersets",pap:"Konjunto di parámetro"},
  adminSub:{en:"Every chemistry threshold set in the system, and which pools use it. View only — defining or editing a set is a direct-database task for now.",es:"Cada conjunto de umbrales químicos del sistema, y qué piscinas lo usan. Solo lectura — definir o editar un conjunto es una tarea directa en la base de datos por ahora.",nl:"Elke chemie-drempelset in het systeem, en welke zwembaden deze gebruiken. Alleen weergave — een set definiëren of bewerken is voorlopig een directe databasetaak.",pap:"Kada konjunto di limite kímiko den sistema, i kua pisina ta usu'e. Solo pa wak — definí òf editá un konjunto ta un tarea direkto den database pa awor."},
  defaultSetLabel:{en:"Standard (default)",es:"Estándar (predeterminado)",nl:"Standaard (default)",pap:"Estándar (default)"},
  customSetLabel:{en:"Custom set",es:"Conjunto personalizado",nl:"Aangepaste set",pap:"Konjunto personalisá"},
  usedByPools:{en:"Used by: {list}",es:"Usado por: {list}",nl:"Gebruikt door: {list}",pap:"Usá pa: {list}"},
  noPoolsYet:{en:"no pools yet",es:"ninguna piscina aún",nl:"nog geen zwembaden",pap:"ainda ningun pisina"},
  provisionalTitle:{en:"Thresholds pending final confirmation",es:"Umbrales pendientes de confirmación final",nl:"Drempels wachten op definitieve bevestiging",pap:"Limite ta pendiente di konfirmashon final"},
  paramTierLow:{en:"Low",es:"Bajo",nl:"Laag",pap:"Abou"},
  paramTierGood:{en:"Good",es:"Bueno",nl:"Goed",pap:"Bon"},
  paramTierWatch:{en:"Watch",es:"Observar",nl:"Let op",pap:"Observá"},
  paramTierHigh:{en:"High",es:"Alto",nl:"Hoog",pap:"Haltu"}
};

var currentLang = "en";
try{ var savedLang = localStorage.getItem("sanitize_lang"); if(savedLang && LANGS.indexOf(savedLang)>-1) currentLang = savedLang; }catch(e){}

function t(key, vars){
  var entry = STR[key];
  var s = entry ? (entry[currentLang] || entry.en) : key;
  if(vars){ Object.keys(vars).forEach(function(k){ s = s.replace("{"+k+"}", vars[k]); }); }
  return s;
}
function pLabel(key){ var e = PARAM_LABELS[key]; return e ? (e[currentLang]||e.en) : key; }
function locale(){ return currentLang==="es"?"es-ES":currentLang==="nl"?"nl-NL":"en-US"; }
function fmtMoney(n){ return "$"+n.toLocaleString(locale(),{minimumFractionDigits:2,maximumFractionDigits:2}); }
function fmtDate(d,opts){ return d.toLocaleDateString(locale(), opts||{month:"short",day:"numeric",year:"numeric"}); }
function fmtShortDate(d){ return d.toLocaleDateString(locale(), {month:"short",day:"numeric"}); }

/* =========================================================
   4. state
   ========================================================= */
var state = {
  route:"login",
  accountId:null,
  poolId:null,
  chartParam:"freeChlorine",
  billingScope:"all",
  gaugeOpen:false,
  exportOpen:false,
  alertsOpen:false,
  notifPrefs:{}, // poolId -> {email,sms}
  isDemoSession:false,
  authError:null
};
try{
  var savedNotif = localStorage.getItem("sanitize_notif");
  if(savedNotif) state.notifPrefs = JSON.parse(savedNotif);
}catch(e){}
function saveNotif(){ try{ localStorage.setItem("sanitize_notif", JSON.stringify(state.notifPrefs)); }catch(e){} }
function notifFor(poolId){ return state.notifPrefs[poolId] || {email:true, sms:false}; }

function currentAccount(){ return state.accountId ? ACCOUNTS[state.accountId] : null; }
function accountPools(){ var a=currentAccount(); return a ? a.poolIds.map(function(id){return POOLS[id];}) : []; }

var chartInstances = {};

/* =========================================================
   5. icons (inline svg strings)
   ========================================================= */
var ICONS = {
  drop:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2s7 7.5 7 12.5a7 7 0 1 1-14 0C5 9.5 12 2 12 2z"/></svg>',
  bell:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>',
  user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>',
  building:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 8h1M14 8h1M9 12h1M14 12h1M9 16h2"/></svg>',
  back:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 19l-7-7 7-7"/></svg>',
  chevron:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>',
  close:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  alertTri:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 2 20h20L12 3z"/><path d="M12 9v5M12 17h.01"/></svg>',
  info:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/></svg>',
  receipt:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2z"/><path d="M9 8h6M9 12h6M9 16h3"/></svg>',
  download:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m0 0l-4-4m4 4l4-4"/><path d="M4 19h16"/></svg>',
  print:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V3h12v6"/><rect x="6" y="13" width="12" height="8"/><path d="M4 13h16v-1a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v1z"/></svg>',
  copy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
  logout:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>',
  sliders:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h13M21 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="17" cy="18" r="2"/></svg>'
};

/* =========================================================
   6. small render helpers
   ========================================================= */
function esc(s){ return String(s).replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }

function gaugeSvg(score, size, strokeW){
  size = size||210; strokeW = strokeW||16;
  var r = (size-strokeW)/2, c = 2*Math.PI*r;
  var tier = scoreTier(score);
  var offset = c*(1-score/100);
  return '<svg viewBox="0 0 '+size+' '+size+'">'+
    '<circle cx="'+size/2+'" cy="'+size/2+'" r="'+r+'" fill="none" stroke="var(--surface-3)" stroke-width="'+strokeW+'"/>'+
    '<circle cx="'+size/2+'" cy="'+size/2+'" r="'+r+'" fill="none" stroke="'+tierColorVar(tier)+'" stroke-width="'+strokeW+'" stroke-linecap="round" stroke-dasharray="'+c+'" stroke-dashoffset="'+offset+'" style="transition:stroke-dashoffset .8s cubic-bezier(.4,0,.2,1)"/>'+
  '</svg>';
}
function miniRing(score, size){
  size=size||52;
  return '<div class="mini-ring">'+gaugeSvg(score,size,6)+'</div>';
}
// tier/severity -> the visual language shared by the range bar marker and
// the param dot. 'watch' gets its own color — visible, but deliberately not
// the warn/critical red-amber family, since it's not a hard alert.
function paramTierColor(tier, severity){
  if(tier==="good") return "var(--good)";
  if(tier==="watch") return "var(--watch)";
  if(tier==="display") return "var(--ink-muted)";
  return severity==="critical" ? "var(--critical)" : "var(--warn)";
}
function rangeBar(params, paramKey, value){
  var p = paramByKey(params, paramKey);
  if(!p || !p.tiers || !p.scale) return '<div class="range-track"></div>';
  var dmin=p.scale[0], dmax=p.scale[1];
  function pct(v){ return Math.max(0,Math.min(100,(v-dmin)/(dmax-dmin)*100)); }
  var goodTier = p.tiers.filter(function(tr){return tr.tier==="good";})[0];
  var watchTier = p.tiers.filter(function(tr){return tr.tier==="watch";})[0];
  var info = paramTierInfo(params, paramKey, value);
  var color = paramTierColor(info.tier, info.severity);
  return '<div class="range-track">'+
    (goodTier ? '<div class="range-zone good" style="left:'+pct(goodTier.min!=null?goodTier.min:dmin)+'%;width:'+(pct(goodTier.max!=null?goodTier.max:dmax)-pct(goodTier.min!=null?goodTier.min:dmin))+'%"></div>' : '')+
    (watchTier ? '<div class="range-zone watch" style="left:'+pct(watchTier.min!=null?watchTier.min:dmin)+'%;width:'+(pct(watchTier.max!=null?watchTier.max:dmax)-pct(watchTier.min!=null?watchTier.min:dmin))+'%"></div>' : '')+
    '<div class="range-mark" style="left:'+pct(value)+'%;background:'+color+'"></div>'+
  '</div>';
}
function paramDot(tier, severity){
  return '<span class="dot" style="background:'+paramTierColor(tier,severity)+'"></span>';
}
function fmtVal(params, paramKey, value){
  var p = paramByKey(params, paramKey);
  return value.toFixed(p.decimals) + (p.unit?" "+p.unit:"");
}
function breakdownRows(pool){
  var params = poolParams(pool);
  var latest = pool.visits[0].readings;
  return params.map(function(p){
    var val = latest[p.key];
    var info = p.tiers ? paramTierInfo(params,p.key,val) : {tier:"display"};
    return '<div class="param-row">'+
      '<div class="param-name">'+paramDot(info.tier,info.severity)+pLabel(p.key)+(p.provisional?'&nbsp;<span class="prov-dot" title="'+t("provisionalTitle")+'"></span>':'')+'</div>'+
      rangeBar(params, p.key, val)+
      '<div class="param-val">'+fmtVal(params, p.key,val)+'</div>'+
    '</div>';
  }).join("");
}

/* =========================================================
   7. screens
   ========================================================= */
function topbar(opts){
  opts = opts||{};
  var acc = currentAccount();
  var isAdmin = acc && acc.type==="admin";
  var alerts = (acc && !isAdmin) ? [].concat.apply([], accountPools().map(function(p){ return poolAlerts(p).map(function(a){ return {pool:p, a:a}; }); })) : [];
  var langOpts = LANGS.map(function(l){ return '<option value="'+l+'"'+(l===currentLang?" selected":"")+'>'+LANG_NAMES[l]+'</option>'; }).join("");
  return '<div class="topbar"><div class="wrap topbar-inner">'+
    '<button class="brand" data-nav="home">'+
      '<span class="brand-mark">'+ICONS.drop+'</span>'+
      '<span><span style="display:block">'+t("appName")+'</span><small>'+t("tagline")+'</small></span>'+
    '</button>'+
    (acc && acc.property && opts.showContext!==false ? '<div class="topbar-context"><b>'+esc(acc.property.name[currentLang]||acc.property.name.en)+'</b><span>'+esc(acc.property.location)+'</span></div>' : '')+
    '<div class="topbar-spacer"></div>'+
    (isAdmin ? '<button class="navbtn'+(state.route==="admin"?" active":"")+'" data-nav="admin">'+ICONS.sliders+' <span class="nav-label">'+t("navParamSets")+'</span></button>' : '')+
    (acc && !isAdmin && acc.poolIds.length>1 ? '<button class="navbtn'+(state.route==="overview"?" active":"")+'" data-nav="overview">'+ICONS.building+' <span class="nav-label">'+t("navOverview")+'</span></button>' : '')+
    (acc && !isAdmin ? '<button class="navbtn'+(state.route==="billing"?" active":"")+'" data-nav="billing">'+ICONS.receipt+' <span class="nav-label">'+t("navBilling")+'</span></button>' : '')+
    '<div class="topbar-actions">'+
      (acc && !isAdmin ? '<div class="pos-rel">'+
        '<button class="icon-btn" data-action="toggle-alerts">'+ICONS.bell+(alerts.length?'<span class="badge-dot">'+alerts.length+'</span>':'')+'</button>'+
        (state.alertsOpen ? alertsDropdown(alerts) : '')+
      '</div>' : '')+
      '<select class="lang-select" data-action="lang" aria-label="'+t("langLabel")+'">'+langOpts+'</select>'+
      (acc ? '<button class="icon-btn" data-nav="logout" title="'+t("navLogout")+'">'+ICONS.logout+'</button>' : '')+
    '</div>'+
  '</div></div>';
}
function alertsDropdown(alerts){
  if(!alerts.length) return '<div class="dropdown"><div class="dropdown-head">'+t("alertsTitle")+'</div><div class="dropdown-empty">'+t("alertsNone")+'</div></div>';
  return '<div class="dropdown"><div class="dropdown-head">'+t("alertsTitle")+'</div>'+
    alerts.map(function(item){
      var pool=item.pool, a=item.a;
      return '<div class="dropdown-item" data-nav="pool" data-pool="'+pool.id+'">'+
        '<div class="alert-ic" style="color:'+(a.status==="critical"?"var(--critical)":"var(--warn)")+'">'+ICONS.alertTri+'</div>'+
        '<div><b style="font-size:12.5px;font-weight:700;display:block">'+esc(pool.name[currentLang]||pool.name.en)+'</b>'+
        '<span class="subtle">'+pLabel(a.param)+' · '+t(a.dir)+'</span></div>'+
      '</div>';
    }).join("")+
  '</div>';
}

function screenLogin(){
  return '<div class="login-screen"><div class="login-caustics"></div>'+
    '<div class="login-card">'+
      '<div class="login-brand"><span class="brand-mark">'+ICONS.drop+'</span><div class="login-brand-text"><b>'+t("appName")+'</b><span>'+t("tagline")+' · Curaçao</span></div></div>'+
      '<h1 class="login-title">'+t("loginTitle")+'</h1>'+
      '<p class="login-sub">'+t("loginSub")+'</p>'+
      (state.authError ? '<div class="auth-error">'+ICONS.alertTri+'<span>'+esc(state.authError)+'</span></div>' : '')+
      '<form id="login-form">'+
        '<div class="field"><label>'+t("emailLabel")+' / '+t("loginNameLabel")+'</label><input id="login-identifier" type="text" placeholder="you@example.com" autocomplete="username"></div>'+
        '<div class="field"><label>'+t("passwordLabel")+'</label><input id="login-password" type="password" placeholder="••••••••" autocomplete="current-password"></div>'+
        '<button type="submit" class="btn btn-primary login-submit">'+t("signIn")+'</button>'+
      '</form>'+
      '<div class="demo-divider">'+(SANITIZE_LIVE ? t("orDemoLive") : t("orDemo"))+'</div>'+
      '<div class="demo-accounts">'+
        '<button class="demo-acc" data-login="dewindt"><span class="demo-acc-ic">'+ICONS.user+'</span><span><b>'+t("demoOwnerName")+'</b><span>'+t("demoOwnerSub")+'</span></span></button>'+
        '<button class="demo-acc" data-login="pyrmont"><span class="demo-acc-ic">'+ICONS.building+'</span><span><b>'+t("demoHotelName")+'</b><span>'+t("demoHotelSub")+'</span></span></button>'+
        '<button class="demo-acc" data-login="admin"><span class="demo-acc-ic">'+ICONS.sliders+'</span><span><b>'+t("demoAdminName")+'</b><span>'+t("demoAdminSub")+'</span></span></button>'+
      '</div>'+
    '</div>'+
  '</div>';
}

function screenLoading(){
  return '<div class="login-screen"><div class="login-caustics"></div>'+
    '<div class="loading-card">'+
      '<span class="brand-mark">'+ICONS.drop+'</span>'+
      '<div class="spinner" aria-hidden="true"></div>'+
      '<p>'+t("loadingPools")+'</p>'+
    '</div>'+
  '</div>';
}

function screenOverview(){
  var pools = accountPools();
  var outOfRange = pools.filter(function(p){ return poolAlerts(p).length>0; }).length;
  var spend = pools.reduce(function(sum,p){
    return sum + p.visits.filter(function(v){ return v.date.getMonth()===NOW.getMonth() && v.date.getFullYear()===NOW.getFullYear(); })
      .reduce(function(s,v){ return s+v.cost; },0);
  },0);
  return topbar()+
    '<div class="wrap page">'+
      '<div class="page-head"><div><p class="eyebrow">'+t("poolsCount",{n:pools.length})+'</p><h1>'+t("overviewTitle")+'</h1><p>'+t("overviewSub")+'</p></div></div>'+
      '<div class="stat-row">'+
        '<div class="stat-card"><div class="n tabular">'+pools.length+'</div><div class="l">'+t("statTotalPools")+'</div></div>'+
        '<div class="stat-card'+(outOfRange?" warn":" good")+'"><div class="n tabular">'+outOfRange+'</div><div class="l">'+t("statOutOfRange")+'</div></div>'+
        '<div class="stat-card"><div class="n tabular">'+fmtMoney(spend)+'</div><div class="l">'+t("statSpend")+'</div></div>'+
      '</div>'+
      '<div class="pool-grid">'+
        pools.map(function(p){
          var score = poolHealth(p), tier = scoreTier(score);
          var latestVisit = p.visits[0];
          return '<button class="pool-card" data-nav="pool" data-pool="'+p.id+'">'+
            '<div class="pool-card-top">'+
              '<div><h3>'+esc(p.name[currentLang]||p.name.en)+'</h3><span>'+fmtDate(latestVisit.date)+'</span></div>'+
              miniRing(score)+
            '</div>'+
            statusPillForTier(tier)+
            '<div class="pool-card-row"><span>'+t("lastReading")+'</span><b class="tabular">'+score+' / 100</b></div>'+
          '</button>';
        }).join("")+
      '</div>'+
    '</div>';
}
function statusPillForTier(tier){
  var label = tier==="good" ? t("tierGood") : tier==="warn" ? t("tierWarn") : t("tierCritical");
  return '<span class="status-pill pill-'+tier+'"><span class="dot"></span>'+label+'</span>';
}

// Admin — "visualize the chemical parameters" (spec update, 2026-09-14): every
// parameter set that exists in the system, and which pools use each one.
// View only, front-end and back-end (see supabase/schema.sql RLS: Admins get
// a scoped read of parameter_sets/pools/properties, nothing else).
function screenAdmin(){
  var groups = adminParameterSets();
  return topbar()+
    '<div class="wrap page">'+
      '<div class="page-head"><div><p class="eyebrow">'+t("navParamSets")+'</p><h1>'+t("adminTitle")+'</h1><p>'+t("adminSub")+'</p></div></div>'+
      groups.map(adminSetCard).join("")+
    '</div>';
}
function adminSetCard(g){
  var poolLabels = g.pools.map(function(pl){
    var propName = pl.propertyName ? (pl.propertyName[currentLang]||pl.propertyName.en) : "—";
    return esc(pl.name[currentLang]||pl.name.en)+' ('+esc(propName)+')';
  });
  return '<div class="card" style="margin-bottom:16px">'+
    '<div class="card-head"><div><h2>'+(g.isDefault?t("defaultSetLabel"):t("customSetLabel"))+'</h2>'+
      '<p class="card-desc" style="margin:2px 0 0">'+t("usedByPools",{list:poolLabels.join(", ")||t("noPoolsYet")})+'</p></div>'+
      (g.isDefault?'':'<span class="beta-chip">'+t("customSetLabel")+'</span>')+
    '</div>'+
    g.params.filter(function(p){return !!p.tiers;}).map(function(p){
      return '<div class="param-row">'+
        '<div class="param-name">'+pLabel(p.key)+(p.provisional?'&nbsp;<span class="prov-dot" title="'+t("provisionalTitle")+'"></span>':'')+'</div>'+
        paramTierLegend(p)+
        '<div class="param-val subtle">'+(p.unit||"—")+'</div>'+
        '<div class="param-tier-caption" style="grid-column:1/-1">'+paramTierCaption(p)+'</div>'+
      '</div>';
    }).join("")+
  '</div>';
}
function paramTierLegend(p){
  if(!p.scale) return '<div class="range-track"></div>';
  var dmin=p.scale[0], dmax=p.scale[1];
  function pct(v){ return Math.max(0,Math.min(100,(v-dmin)/(dmax-dmin)*100)); }
  var goodTier = p.tiers.filter(function(tr){return tr.tier==="good";})[0];
  var watchTier = p.tiers.filter(function(tr){return tr.tier==="watch";})[0];
  return '<div class="range-track">'+
    (goodTier?'<div class="range-zone good" style="left:'+pct(goodTier.min!=null?goodTier.min:dmin)+'%;width:'+(pct(goodTier.max!=null?goodTier.max:dmax)-pct(goodTier.min!=null?goodTier.min:dmin))+'%"></div>':'')+
    (watchTier?'<div class="range-zone watch" style="left:'+pct(watchTier.min!=null?watchTier.min:dmin)+'%;width:'+(pct(watchTier.max!=null?watchTier.max:dmax)-pct(watchTier.min!=null?watchTier.min:dmin))+'%"></div>':'')+
  '</div>';
}
function paramTierCaption(p){
  var names = {low:t("paramTierLow"), good:t("paramTierGood"), watch:t("paramTierWatch"), high:t("paramTierHigh")};
  return p.tiers.map(function(tr){
    var range = tr.min==null ? "<"+tr.max : tr.max==null ? "≥"+tr.min : tr.min+"–"+tr.max;
    return names[tr.tier]+": "+range;
  }).join(" · ");
}

function screenPool(){
  var pool = POOLS[state.poolId];
  var acc = currentAccount();
  var score = poolHealth(pool), tier = scoreTier(score);
  var alerts = poolAlerts(pool);
  var sl = statusLine(pool);
  var multi = acc.poolIds.length>1;

  var html = topbar();
  html += '<div class="wrap page">';
  html += '<div class="pool-header">'+
    (multi ? '<button class="back-btn" data-nav="overview">'+ICONS.back+'</button>' : '')+
    '<div><h1>'+esc(pool.name[currentLang]||pool.name.en)+'</h1><span class="loc">'+esc(acc.property.location)+'</span></div>'+
  '</div>';

  html += '<div class="hero-grid">';
  html += '<div class="hero-card">'+
    '<div class="gauge-wrap" data-action="open-gauge">'+gaugeSvg(score)+
      '<div class="gauge-center"><div class="gauge-score tabular" style="color:'+tierColorVar(tier)+'">'+score+'</div><div class="gauge-of">'+t("healthLabel")+'</div>'+
      '<div class="gauge-tap">'+ICONS.info+' '+t("tapDetails")+'</div></div>'+
    '</div>'+
    '<div class="status-line">'+sl.text+'</div>'+
    (sl.sub ? '<div class="status-sub">'+sl.sub+'</div>' : '')+
  '</div>';

  html += '<div class="side-cards">';
  // alerts card
  var alertTier = alerts.some(function(a){return a.status==="critical";}) ? "critical" : "warn";
  html += '<div class="card'+(alerts.length?" alert-card "+(alertTier==="critical"?"critical":""):"")+'">'+
    '<div class="card-head"><h2>'+t("alertsTitle")+'</h2></div>';
  if(alerts.length){
    html += alerts.map(function(a){
      var msg = currentLang==="en"
        ? (a.dir==="trendingLow" ? pLabel(a.param)+" is trending low, "+t("scheduledFor",{date:fmtDate(nextScheduledDate(pool))})
                                  : pLabel(a.param)+" is trending high, "+t("scheduledFor",{date:fmtDate(nextScheduledDate(pool))}))
        : pLabel(a.param)+" — "+t(a.dir)+", "+t("scheduledFor",{date:fmtDate(nextScheduledDate(pool))});
      return '<div class="alert-row"><div class="alert-ic">'+ICONS.alertTri+'</div><p>'+msg+' <span class="subtle tabular">('+fmtVal(poolParams(pool), a.param, a.value)+')</span></p></div>';
    }).join("");
  } else {
    html += '<p class="card-desc" style="margin-top:2px">'+t("alertsNone")+'</p>';
  }
  html += '<p class="footnote" style="margin-top:10px;text-align:left">'+t("alertsAutoClear")+'</p>';
  var np = notifFor(pool.id);
  html += '<div class="notify-row"><span style="font-size:12px;font-weight:700;color:var(--ink-2)">'+t("notifyPrefs")+'</span>'+
    '<div class="notify-opts">'+
      '<span class="switch-lbl">'+t("email")+'<span class="switch'+(np.email?" on":"")+'" data-action="toggle-notif" data-pool="'+pool.id+'" data-ch="email"><i></i></span></span>'+
      '<span class="switch-lbl">'+t("sms")+'<span class="switch'+(np.sms?" on":"")+'" data-action="toggle-notif" data-pool="'+pool.id+'" data-ch="sms"><i></i></span></span>'+
    '</div>'+
  '</div>';
  html += '</div>';

  // visit summary card
  var lastVisit = pool.visits[0];
  html += '<div class="card"><h2>'+t("visitHistory")+'</h2><p class="card-desc">'+t("lastReading")+': '+fmtDate(lastVisit.date)+' · '+esc(lastVisit.technician)+'</p>'+
    '<div class="visit-products">'+lastVisit.products.map(function(pr){ return '<span class="chip">'+productName(pr.id)+'</span>'; }).join("")+'</div>'+
  '</div>';
  html += '</div>'; // side-cards
  html += '</div>'; // hero-grid

  // trend & comparison
  html += trendCard(pool);
  // forecast
  html += forecastCard(pool);
  // visit feed
  html += visitFeedCard(pool);

  html += '</div>'; // wrap page

  if(state.gaugeOpen) html += gaugeModal(pool);
  if(state.exportOpen) html += exportModal([pool]);
  return html;
}

function trendCard(pool){
  var params = poolParams(pool);
  var series = pool.visits.slice().reverse(); // chrono order
  var thisMonth = series.filter(function(v){return v.date.getMonth()===NOW.getMonth()&&v.date.getFullYear()===NOW.getFullYear();});
  var lastMonthDate = new Date(NOW.getFullYear(), NOW.getMonth()-1, 1);
  var lastMonth = series.filter(function(v){return v.date.getMonth()===lastMonthDate.getMonth()&&v.date.getFullYear()===lastMonthDate.getFullYear();});
  function avg(list,key){ if(!list.length) return null; return list.reduce(function(s,v){return s+v.readings[key];},0)/list.length; }
  var tmAvg = avg(thisMonth, state.chartParam), lmAvg = avg(lastMonth, state.chartParam);

  return '<div class="card" style="margin-bottom:16px">'+
    '<div class="card-head"><div><h2>'+t("trendCompare")+'</h2><p class="card-desc" style="margin:2px 0 0">'+t("trendSub")+'</p></div></div>'+
    '<div class="tabs">'+params.filter(function(pp){return !!pp.tiers;}).map(function(pp){
      return '<button class="tab'+(pp.key===state.chartParam?" active":"")+'" data-action="set-param" data-param="'+pp.key+'">'+pLabel(pp.key)+'</button>';
    }).join("")+'</div>'+
    '<div class="chart-box"><canvas id="trend-chart"></canvas></div>'+
    '<div class="compare-grid">'+
      '<div class="compare-cell"><div class="l">'+t("thisMonthAvg")+'</div><div class="v tabular">'+(tmAvg!=null?fmtVal(params,state.chartParam,tmAvg):"—")+'</div></div>'+
      '<div class="compare-cell"><div class="l">'+t("lastMonthAvg")+'</div><div class="v tabular">'+(lmAvg!=null?fmtVal(params,state.chartParam,lmAvg):"—")+'</div></div>'+
    '</div>'+
  '</div>';
}

function forecastCard(pool){
  var params = poolParams(pool);
  var series = pool.visits.slice().reverse();
  var recent = series.slice(-8);
  var pts = recent.map(function(v,i){ return {x:i, y:v.readings[state.chartParam]}; });
  var lr = linreg(pts);
  var p = paramByKey(params, state.chartParam);
  var caption;
  if(!p.tiers){
    caption = {icon:"info", text:t("displayOnly")};
  } else {
    var goodTier = p.tiers.filter(function(tr){return tr.tier==="good";})[0];
    var lo = goodTier && goodTier.min, hi = goodTier && goodTier.max;
    var lastX = pts.length-1;
    var future = [1,2,3,4].map(function(k){ return Math.max(0, lr.slope*(lastX+k)+lr.intercept); });
    var exitIdx = -1, dir=null;
    for(var i=0;i<future.length;i++){
      if(lo!=null && future[i]<lo){ exitIdx=i; dir="trendingLow"; break; }
      if(hi!=null && future[i]>=hi){ exitIdx=i; dir="trendingHigh"; break; }
    }
    if(exitIdx===-1){
      caption = {icon:"check", text:t("forecastStable")};
    } else {
      var weeksOut = exitIdx+1;
      var date = new Date(NOW.getTime()+weeksOut*7*24*3600*1000);
      caption = {icon:"alertTri", text:t("forecastDrift",{dir:t(dir), date:fmtDate(date)})};
    }
  }
  return '<div class="card" style="margin-bottom:16px">'+
    '<div class="card-head"><div><h2>'+t("forecastTitle")+' <span class="beta-chip">BETA</span></h2><p class="card-desc" style="margin:2px 0 0">'+t("forecastSub")+'</p></div></div>'+
    '<div class="chart-box"><canvas id="forecast-chart"></canvas></div>'+
    '<div class="forecast-caption">'+ICONS[caption.icon]+'<p>'+caption.text+'</p></div>'+
  '</div>';
}
function linreg(points){
  var n=points.length, sumX=0,sumY=0,sumXY=0,sumXX=0;
  points.forEach(function(pt){ sumX+=pt.x; sumY+=pt.y; sumXY+=pt.x*pt.y; sumXX+=pt.x*pt.x; });
  var denom = n*sumXX - sumX*sumX;
  if(denom===0) return {slope:0, intercept:sumY/n};
  var slope = (n*sumXY - sumX*sumY)/denom;
  var intercept = (sumY - slope*sumX)/n;
  return {slope:slope, intercept:intercept};
}

function visitFeedCard(pool){
  return '<div class="card">'+
    '<div class="card-head"><div><h2>'+t("visitHistory")+'</h2><p class="card-desc" style="margin:2px 0 0">'+t("visitHistorySub")+'</p></div></div>'+
    pool.visits.slice(0,10).map(function(v){
      return '<div class="visit">'+
        '<img class="visit-photo" src="'+v.photo+'" alt="">'+
        '<div class="visit-main">'+
          '<div class="visit-top"><span class="visit-date">'+fmtDate(v.date)+'</span><span class="visit-cost tabular">'+fmtMoney(v.cost)+'</span></div>'+
          '<div class="visit-tech">'+t("technician")+': '+esc(v.technician)+'</div>'+
          '<div class="visit-products">'+v.products.map(function(pr){ return '<span class="chip">'+productName(pr.id)+' · '+pr.qty+' '+productUnit(pr.id)+'</span>'; }).join("")+'</div>'+
          '<div class="visit-notes">'+(v.note!=null ? esc(v.note) : noteFor(v.noteIdx))+'</div>'+
        '</div>'+
      '</div>';
    }).join("")+
  '</div>';
}

function gaugeModal(pool){
  var score = poolHealth(pool);
  return '<div class="overlay"><div class="sheet" data-stop="1">'+
    '<div class="sheet-head"><h3>'+t("breakdownTitle")+'</h3><button class="close-x" data-action="close-gauge">'+ICONS.close+'</button></div>'+
    '<div class="sheet-body">'+
      '<div style="display:flex;align-items:center;gap:14px;margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid var(--border)">'+
        gaugeSvgWrap(score,72,9)+
        '<div><div class="gauge-score tabular" style="font-size:30px;color:'+tierColorVar(scoreTier(score))+'">'+score+'<span style="font-size:14px;color:var(--ink-muted);font-family:var(--font-body);font-weight:600"> /100</span></div><div class="subtle">'+t("healthLabel")+'</div></div>'+
      '</div>'+
      breakdownRows(pool)+
    '</div>'+
  '</div></div>';
}
function gaugeSvgWrap(score,size,strokeW){ return '<div style="width:'+size+'px;height:'+size+'px;flex:none">'+gaugeSvg(score,size,strokeW)+'</div>'; }

function screenBilling(){
  var acc = currentAccount();
  var pools = accountPools();
  var multi = pools.length>1;
  var scopePools = state.billingScope==="all" ? pools : pools.filter(function(p){return p.id===state.billingScope;});
  var allVisits = [];
  scopePools.forEach(function(p){ p.visits.forEach(function(v){ allVisits.push(v); }); });
  allVisits.sort(function(a,b){ return b.date-a.date; });

  var thisMonth = allVisits.filter(function(v){return v.date.getMonth()===NOW.getMonth()&&v.date.getFullYear()===NOW.getFullYear();});
  var costThisMonth = thisMonth.reduce(function(s,v){return s+v.cost;},0);
  var ytd = allVisits.filter(function(v){return v.date.getFullYear()===NOW.getFullYear();});
  var costYtd = ytd.reduce(function(s,v){return s+v.cost;},0);
  var months = {};
  allVisits.forEach(function(v){ var k=v.date.getFullYear()+"-"+v.date.getMonth(); months[k]=(months[k]||0)+v.cost; });
  var monthKeys = Object.keys(months);
  var perPoolAvg = scopePools.length ? (costYtd/scopePools.length/Math.max(1,(NOW.getMonth()+1))) : 0;

  return topbar()+
    '<div class="wrap page">'+
      '<div class="page-head"><div><p class="eyebrow">'+t("navBilling")+'</p><h1>'+t("billingTitle")+'</h1><p>'+t("billingSub")+'</p></div>'+
        '<div style="display:flex;gap:8px;flex-wrap:wrap">'+
          (multi ? billingScopeSelect(pools) : '')+
          '<button class="btn btn-ghost btn-sm" data-action="open-export">'+ICONS.download+' '+t("exportCsv")+' / '+t("exportPdf")+'</button>'+
        '</div>'+
      '</div>'+
      '<div class="billing-grid">'+
        '<div class="stat-card"><div class="n tabular">'+fmtMoney(costThisMonth)+'</div><div class="l">'+t("costThisMonth")+'</div></div>'+
        '<div class="stat-card"><div class="n tabular">'+fmtMoney(costYtd)+'</div><div class="l">'+t("costYtd")+'</div></div>'+
        (multi ? '<div class="stat-card"><div class="n tabular">'+fmtMoney(perPoolAvg)+'</div><div class="l">'+t("costPerPool")+'</div></div>' : '<div class="stat-card"><div class="n tabular">'+allVisits.length+'</div><div class="l">'+t("visitsLogged")+'</div></div>')+
        '<div class="stat-card"><div class="n tabular">'+monthKeys.length+'</div><div class="l">'+t("monthsCovered")+'</div></div>'+
      '</div>'+
      '<div class="table-wrap"><table><thead><tr>'+
        '<th>'+t("colDate")+'</th>'+(multi?'<th>'+t("colPool")+'</th>':'')+'<th>'+t("colTech")+'</th><th>'+t("colItems")+'</th><th style="text-align:right">'+t("colCost")+'</th>'+
      '</tr></thead><tbody>'+
        allVisits.slice(0,60).map(function(v){
          var pool = POOLS[v.poolId];
          return '<tr><td class="tabular">'+fmtDate(v.date)+'</td>'+
            (multi?'<td>'+esc(pool.name[currentLang]||pool.name.en)+'</td>':'')+
            '<td>'+esc(v.technician)+'</td>'+
            '<td>'+v.products.map(function(pr){return productName(pr.id)+' ('+pr.qty+')';}).join(", ")+'</td>'+
            '<td class="num tabular">'+fmtMoney(v.cost)+'</td></tr>';
        }).join("")+
      '</tbody></table></div>'+
      '<p class="footnote">'+t("fullPricing")+'</p>'+
    '</div>'+
  (state.exportOpen ? exportModal(scopePools) : '');
}
function billingScopeSelect(pools){
  var opts = '<option value="all"'+(state.billingScope==="all"?" selected":"")+'>'+t("allPools")+'</option>'+
    pools.map(function(p){ return '<option value="'+p.id+'"'+(state.billingScope===p.id?" selected":"")+'>'+esc(p.name[currentLang]||p.name.en)+'</option>'; }).join("");
  return '<select class="lang-select" data-action="billing-scope" style="height:36px">'+opts+'</select>';
}

function exportModal(pools){
  var visits = [];
  pools.forEach(function(p){ p.visits.forEach(function(v){ visits.push(v); }); });
  visits.sort(function(a,b){ return b.date-a.date; });
  var rows = [["Date","Pool","Technician","Products","Cost (USD)"]];
  visits.forEach(function(v){
    var pool = POOLS[v.poolId];
    rows.push([fmtDate(v.date,{year:"numeric",month:"2-digit",day:"2-digit"}), pool.name[currentLang]||pool.name.en, v.technician,
      v.products.map(function(pr){return productName(pr.id)+" x"+pr.qty;}).join("; "), v.cost.toFixed(2)]);
  });
  var csv = rows.map(function(r){ return r.map(function(c){ return '"'+String(c).replace(/"/g,'""')+'"'; }).join(","); }).join("\n");
  return '<div class="overlay"><div class="sheet" data-stop="1">'+
    '<div class="sheet-head"><h3>'+t("exportCsv")+' / '+t("exportPdf")+'</h3><button class="close-x" data-action="close-export">'+ICONS.close+'</button></div>'+
    '<div class="sheet-body">'+
      '<p class="card-desc" style="margin-bottom:10px">'+t("exportNote")+'</p>'+
      '<div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap">'+
        '<button class="btn btn-primary btn-sm" data-action="do-print">'+ICONS.print+' '+t("printSave")+'</button>'+
        '<button class="btn btn-ghost btn-sm" data-action="copy-csv">'+ICONS.copy+' '+t("copyCsv")+'</button>'+
      '</div>'+
      '<textarea class="csv-box" id="csv-box" readonly>'+esc(csv)+'</textarea>'+
      '<div class="copied-note" id="copied-note" hidden>'+ICONS.check+' '+t("copied")+'</div>'+
      '<div class="print-only" id="print-area">'+printableInvoice(pools, visits)+'</div>'+
    '</div>'+
  '</div></div>';
}
function printableInvoice(pools, visits){
  var acc = currentAccount();
  var total = visits.reduce(function(s,v){return s+v.cost;},0);
  return '<div style="padding:20px 0">'+
    '<h2 style="margin:0 0 4px">'+t("appName")+' — '+t("billingTitle")+'</h2>'+
    '<p style="color:#555;margin:0 0 16px">'+esc(acc.property.name[currentLang]||acc.property.name.en)+' · '+esc(acc.property.location)+' · '+fmtDate(NOW)+'</p>'+
    '<table style="width:100%;border-collapse:collapse;font-size:12px">'+
    '<thead><tr>'+["Date","Pool","Technician","Products","Cost"].map(function(h){return '<th style="text-align:left;border-bottom:1px solid #999;padding:6px 8px">'+h+'</th>';}).join("")+'</tr></thead><tbody>'+
    visits.map(function(v){
      var pool=POOLS[v.poolId];
      return '<tr>'+
        '<td style="padding:6px 8px;border-bottom:1px solid #ddd">'+fmtDate(v.date)+'</td>'+
        '<td style="padding:6px 8px;border-bottom:1px solid #ddd">'+esc(pool.name[currentLang]||pool.name.en)+'</td>'+
        '<td style="padding:6px 8px;border-bottom:1px solid #ddd">'+esc(v.technician)+'</td>'+
        '<td style="padding:6px 8px;border-bottom:1px solid #ddd">'+v.products.map(function(pr){return productName(pr.id)+" x"+pr.qty;}).join(", ")+'</td>'+
        '<td style="padding:6px 8px;border-bottom:1px solid #ddd;text-align:right">'+fmtMoney(v.cost)+'</td>'+
      '</tr>';
    }).join("")+
    '</tbody></table>'+
    '<p style="text-align:right;font-weight:700;margin-top:10px">'+t("colCost")+': '+fmtMoney(total)+'</p>'+
  '</div>';
}

/* =========================================================
   8. chart rendering (post-DOM)
   ========================================================= */
function destroyCharts(){ Object.keys(chartInstances).forEach(function(k){ chartInstances[k].destroy(); }); chartInstances={}; }
function themeColor(varName){ return getComputedStyle(document.documentElement).getPropertyValue(varName).trim(); }

function drawTrendChart(pool){
  var el = document.getElementById("trend-chart");
  if(!el) return;
  var params = poolParams(pool);
  var series = pool.visits.slice().reverse();
  var p = paramByKey(params, state.chartParam);
  var goodTier = p.tiers ? p.tiers.filter(function(tr){return tr.tier==="good";})[0] : null;
  var labels = series.map(function(v){ return fmtShortDate(v.date); });
  var data = series.map(function(v){ return v.readings[state.chartParam]; });
  var ink2 = themeColor("--ink-2"), muted = themeColor("--ink-muted"), border = themeColor("--border"), accent = themeColor("--accent"), accentWash = themeColor("--accent-wash"), good=themeColor("--good");

  var bandPlugin = {
    id:"band",
    beforeDatasetsDraw:function(chart){
      if(!goodTier || goodTier.min==null || goodTier.max==null) return;
      var yScale = chart.scales.y;
      var ctx = chart.ctx, area = chart.chartArea;
      var y0 = yScale.getPixelForValue(goodTier.max);
      var y1 = yScale.getPixelForValue(goodTier.min);
      ctx.save();
      ctx.fillStyle = good; ctx.globalAlpha=0.12;
      ctx.fillRect(area.left, y0, area.right-area.left, y1-y0);
      ctx.restore();
    }
  };

  chartInstances.trend = new Chart(el.getContext("2d"), {
    type:"line",
    data:{ labels:labels, datasets:[{ data:data, borderColor:accent, backgroundColor:accentWash, borderWidth:2.5, pointRadius:0, pointHoverRadius:4, tension:.35, fill:true }] },
    options:{
      responsive:true, maintainAspectRatio:false,
      interaction:{intersect:false,mode:"index"},
      plugins:{ legend:{display:false}, tooltip:{
        backgroundColor: themeColor("--surface"), titleColor: themeColor("--ink"), bodyColor: themeColor("--ink-2"),
        borderColor: border, borderWidth:1, padding:10, displayColors:false,
        callbacks:{ label:function(ctx){ return fmtVal(params, state.chartParam, ctx.parsed.y); } }
      }},
      scales:{
        x:{ grid:{display:false}, ticks:{ color:muted, maxTicksLimit:7, font:{size:10.5} } },
        y:{ grid:{color:border}, ticks:{ color:muted, font:{size:10.5} } }
      }
    },
    plugins:[bandPlugin]
  });
}

function drawForecastChart(pool){
  var el = document.getElementById("forecast-chart");
  if(!el) return;
  var params = poolParams(pool);
  var series = pool.visits.slice().reverse();
  var recent = series.slice(-8);
  var p = paramByKey(params, state.chartParam);
  var goodTier = p.tiers ? p.tiers.filter(function(tr){return tr.tier==="good";})[0] : null;
  var pts = recent.map(function(v,i){ return {x:i, y:v.readings[state.chartParam]}; });
  var lr = linreg(pts);
  var future = [1,2,3,4].map(function(k){ return Math.max(0, lr.slope*(pts.length-1+k)+lr.intercept); });

  var histLabels = recent.map(function(v){ return fmtShortDate(v.date); });
  var futLabels = future.map(function(_,i){ var d=new Date(recent[recent.length-1].date.getTime()+(i+1)*7*24*3600*1000); return fmtShortDate(d); });
  var labels = histLabels.concat(futLabels);
  var histData = recent.map(function(v){ return v.readings[state.chartParam]; }).concat(new Array(future.length).fill(null));
  var futData = new Array(recent.length-1).fill(null).concat([recent[recent.length-1].readings[state.chartParam]]).concat(future);

  var accent = themeColor("--accent"), muted = themeColor("--ink-muted"), border = themeColor("--border"), good = themeColor("--good");

  var bandPlugin = {
    id:"band2",
    beforeDatasetsDraw:function(chart){
      if(!goodTier || goodTier.min==null || goodTier.max==null) return;
      var yScale = chart.scales.y, ctx=chart.ctx, area=chart.chartArea;
      var y0=yScale.getPixelForValue(goodTier.max), y1=yScale.getPixelForValue(goodTier.min);
      ctx.save(); ctx.fillStyle=good; ctx.globalAlpha=.12; ctx.fillRect(area.left,y0,area.right-area.left,y1-y0); ctx.restore();
    }
  };

  chartInstances.forecast = new Chart(el.getContext("2d"), {
    type:"line",
    data:{ labels:labels, datasets:[
      { label:"history", data:histData, borderColor:accent, borderWidth:2.5, pointRadius:2, tension:.3, spanGaps:false },
      { label:"forecast", data:futData, borderColor:accent, borderDash:[6,5], borderWidth:2.5, pointRadius:2, tension:0, spanGaps:true }
    ]},
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:false}, tooltip:{
        backgroundColor: themeColor("--surface"), titleColor: themeColor("--ink"), bodyColor: themeColor("--ink-2"),
        borderColor: border, borderWidth:1, padding:10, displayColors:false,
        callbacks:{ label:function(ctx){ return ctx.parsed.y!=null ? fmtVal(params, state.chartParam, ctx.parsed.y):""; } }
      }},
      scales:{
        x:{ grid:{display:false}, ticks:{ color:muted, maxTicksLimit:6, font:{size:10.5} } },
        y:{ grid:{color:border}, ticks:{ color:muted, font:{size:10.5} } }
      }
    },
    plugins:[bandPlugin]
  });
}

/* =========================================================
   9. router / render
   ========================================================= */
function render(){
  destroyCharts();
  var app = document.getElementById("app");
  var html = "";
  if(state.route==="loading") html = screenLoading();
  else if(state.route==="login") html = screenLogin();
  else if(state.route==="overview") html = screenOverview();
  else if(state.route==="pool") html = screenPool();
  else if(state.route==="billing") html = screenBilling();
  else if(state.route==="admin") html = screenAdmin();
  app.innerHTML = html;
  bindEvents();
  if(state.route==="pool"){ drawTrendChart(POOLS[state.poolId]); drawForecastChart(POOLS[state.poolId]); }
}

function goHome(){
  var acc = currentAccount();
  if(!acc){ state.route="login"; return; }
  if(acc.type==="admin"){ state.route="admin"; return; }
  if(acc.poolIds.length===1){ state.route="pool"; state.poolId=acc.poolIds[0]; }
  else { state.route="overview"; }
}

function bindEvents(){
  var app = document.getElementById("app");

  var loginForm = document.getElementById("login-form");
  if(loginForm){ loginForm.addEventListener("submit", function(e){ e.preventDefault(); submitLogin(); }); }

  app.querySelectorAll("[data-login]").forEach(function(btn){
    btn.addEventListener("click", function(){ doLogin(btn.getAttribute("data-login")); });
  });

  app.querySelectorAll("[data-nav]").forEach(function(el){
    el.addEventListener("click", function(){
      var nav = el.getAttribute("data-nav");
      state.alertsOpen=false;
      if(nav==="home"){ goHome(); }
      else if(nav==="overview"){ state.route="overview"; }
      else if(nav==="billing"){ state.route="billing"; state.exportOpen=false; }
      else if(nav==="pool"){ state.route="pool"; state.poolId = el.getAttribute("data-pool"); state.gaugeOpen=false; }
      else if(nav==="logout"){ doLogout(); return; }
      render();
    });
  });

  app.querySelectorAll("[data-action]").forEach(function(el){
    el.addEventListener("click", function(ev){
      var action = el.getAttribute("data-action");
      if(action==="toggle-alerts"){ ev.stopPropagation(); state.alertsOpen=!state.alertsOpen; render(); }
      else if(action==="open-gauge"){ state.gaugeOpen=true; render(); }
      else if(action==="close-gauge"){ state.gaugeOpen=false; render(); }
      else if(action==="open-export"){ state.exportOpen=true; render(); }
      else if(action==="close-export"){ state.exportOpen=false; render(); }
      else if(action==="set-param"){ state.chartParam = el.getAttribute("data-param"); render(); }
      else if(action==="billing-scope"){ /* handled by change event below */ }
      else if(action==="toggle-notif"){
        var poolId = el.getAttribute("data-pool"), ch = el.getAttribute("data-ch");
        var cur = notifFor(poolId);
        cur[ch] = !cur[ch];
        state.notifPrefs[poolId] = cur;
        saveNotif();
        render();
      }
      else if(action==="do-print"){ window.print(); }
      else if(action==="copy-csv"){
        var box = document.getElementById("csv-box");
        box.select();
        var done = function(){ var note=document.getElementById("copied-note"); if(note){ note.hidden=false; setTimeout(function(){ note.hidden=true; },2200); } };
        if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(box.value).then(done).catch(function(){ try{document.execCommand("copy"); done();}catch(e){} }); }
        else { try{ document.execCommand("copy"); done(); }catch(e){} }
      }
    });
  });

  var langSel = app.querySelector('[data-action="lang"]');
  if(langSel){ langSel.addEventListener("change", function(){ currentLang = langSel.value; try{localStorage.setItem("sanitize_lang",currentLang);}catch(e){} render(); }); }

  var scopeSel = app.querySelector('[data-action="billing-scope"]');
  if(scopeSel){ scopeSel.addEventListener("change", function(){ state.billingScope = scopeSel.value; render(); }); }

  var overlays = app.querySelectorAll(".overlay");
  overlays.forEach(function(ov){
    ov.addEventListener("click", function(e){
      if(e.target===ov){
        if(ov.querySelector(".sheet-head h3") && ov.querySelector(".sheet-head h3").textContent===t("breakdownTitle")){ state.gaugeOpen=false; } else { state.exportOpen=false; }
        render();
      }
    });
  });

}
function escHandler(e){
  if(e.key==="Escape"){ state.gaugeOpen=false; state.exportOpen=false; state.alertsOpen=false; render(); }
}

// "Preview with sample data" — always available, even once a real backend is
// configured, so the dashboard still works as an instant investor/staging demo.
function doLogin(accountId){
  buildDemoData();
  state.accountId = accountId;
  state.isDemoSession = true;
  state.authError = null;
  goHome();
  render();
}

function doLogout(){
  if(SANITIZE_LIVE && !state.isDemoSession){ AuthAPI.signOut().catch(function(){}); }
  state.accountId = null;
  state.poolId = null;
  state.isDemoSession = false;
  state.route = "login";
  render();
}

// Real sign-in: resolves a login name to its account email, authenticates
// with Supabase, then loads that account's real pools/visits (see data.js).
function submitLogin(){
  var identifier = (document.getElementById("login-identifier")||{}).value || "";
  var password = (document.getElementById("login-password")||{}).value || "";
  if(!identifier || !password){ state.authError = t("authErrorMissing"); render(); return; }

  state.authError = null;
  state.route = "loading";
  render();

  AuthAPI.signIn(identifier, password).then(function(session){
    return loadAccountData(session.user.id);
  }).then(function(account){
    state.accountId = account.id;
    state.isDemoSession = false;
    goHome();
    render();
  }).catch(function(err){
    state.route = "login";
    state.authError = (err && err.message) ? err.message : t("authErrorGeneric");
    render();
  });
}

function initApp(){
  document.addEventListener("keydown", escHandler);

  if(!SANITIZE_LIVE){
    buildDemoData();
    render();
    return;
  }

  state.route = "loading";
  render();
  AuthAPI.getSession().then(function(session){
    if(!session){ state.route = "login"; render(); return; }
    return loadAccountData(session.user.id).then(function(account){
      state.accountId = account.id;
      state.isDemoSession = false;
      goHome();
      render();
    });
  }).catch(function(err){
    state.route = "login";
    state.authError = (err && err.message) ? err.message : t("authErrorGeneric");
    render();
  });
}

initApp();
