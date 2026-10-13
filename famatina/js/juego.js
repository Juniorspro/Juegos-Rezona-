// FAMATINA — juego: estado, escenas, entrada, bucle, guardado, logros, premios y API de prueba
let G = null, OP = null, MINA = [], MA = null, ESCENA = 'titulo', CARRERA = null;
let T = 0, ACUM = 0, TURBO = 1, BOT = false, CONGELADO = false, BOT_T = 0, PEND_RES = true;
const PASO = 1 / 60;
const LENTA = { t: 0 };
const TELON = { fase: 0, t: 0, alMedio: null };
const E = { punteros: new Map(), clics: [] };
const AVISOS = [], TOASTS = [], ERRORES = [];
let lz = null, gp = null;

function nuevoG() {
  return {
    v: 1, t: Date.now(), reloj: 0, desfase: 0.72 * 480, pepitas: 10, minaAct: 0, minas: [Mina.nueva(11)], logros: {},
    est: { ganado: 0, capataces: 0, epicos: 0, habilidades: 0, condores: 0, geodas: 0, minerales: 0, refundaciones: 0, ofrendas: 0, oroFiebre: 0, racha: 0 },
    diario: { ultimo: 0, racha: 0, pendiente: 0 }, ofrenda: { hasta: 0, libre: 0 }, fiebre: { dia: 0, mejorHoy: 0, record: 0, medallaHoy: 0, parDia: 0, par: 0 }, tut: 0, nuevoMineral: 0,
  };
}
function opDefecto() { return { v: 1, musica: 0.7, sonido: 0.8, calidad: 'auto', numeros: 'corto', vibrar: true, zurdo: false, arrastre: 1, mantener: 1, sel: 1, botones: { v: {}, h: {} }, tam: {}, opac: {} }; }
function guardar() { if (!G) return; G.t = Date.now(); Guardado.escribir('datos', G); }
function guardarOp() { Guardado.escribir('opciones', OP); }
function multGlobal() { return (1 + 0.02 * logrosHechos()) * (1 + 0.25 * Math.max(0, minasAbiertas() - 1)) * (ofrendaActiva() ? 2 : 1); }
function ofrendaActiva() { return !!G && G.ofrenda.hasta > G.reloj; }

// ---------- logros y premios ----------
const maxNivel = () => G.minas.reduce((a, d) => Math.max(a, d ? (d.maxN || d.niveles.length) : 0), 0);
const minasAbiertas = () => G.minas.filter(Boolean).length;
const totalMinerales = () => G.minas.reduce((a, d) => a + (d ? d.min.reduce((x, y) => x + (y ? 1 : 0), 0) : 0), 0);
const vitrinasCompletas = () => G.minas.filter(d => d && d.min.every(Boolean)).length;
const LOGROS = [
  { id: 'g1', k: 'lgGana', a: 100, f: () => G.est.ganado, p: 5 }, { id: 'g2', k: 'lgGana', a: 1e6, f: () => G.est.ganado, p: 10 },
  { id: 'g3', k: 'lgGana', a: 1e9, f: () => G.est.ganado, p: 15 }, { id: 'g4', k: 'lgGana', a: 1e12, f: () => G.est.ganado, p: 20 },
  { id: 'g5', k: 'lgGana', a: 1e18, f: () => G.est.ganado, p: 30 }, { id: 'g6', k: 'lgGana', a: 1e27, f: () => G.est.ganado, p: 50 },
  { id: 'n5', k: 'lgNivel', a: 5, f: maxNivel, p: 5 }, { id: 'n10', k: 'lgNivel', a: 10, f: maxNivel, p: 10 }, { id: 'n15', k: 'lgNivel', a: 15, f: maxNivel, p: 15 },
  { id: 'n20', k: 'lgNivel', a: 20, f: maxNivel, p: 20 }, { id: 'n25', k: 'lgNivel', a: 25, f: maxNivel, p: 40 },
  { id: 'c1', k: 'lgCapataz1', a: 1, f: () => G.est.capataces, p: 5 }, { id: 'c10', k: 'lgCapataz', a: 10, f: () => G.est.capataces, p: 10 },
  { id: 'ce', k: 'lgEpico', a: 1, f: () => G.est.epicos || 0, p: 15 }, { id: 'h20', k: 'lgHab', a: 20, f: () => G.est.habilidades, p: 10 },
  { id: 'co', k: 'lgCondor', a: 10, f: () => G.est.condores, p: 10 }, { id: 'ge', k: 'lgGeoda', a: 10, f: () => G.est.geodas, p: 10 },
  { id: 'mi', k: 'lgMineral', a: 10, f: totalMinerales, p: 15 }, { id: 'vi', k: 'lgVitrina', a: 1, f: vitrinasCompletas, p: 30 },
  { id: 'rf', k: 'lgRefundar', a: 1, f: () => G.est.refundaciones, p: 15 }, { id: 'm2', k: 'lgAbrir', a: 2, arg: 'CAPILLITAS', f: minasAbiertas, p: 15 },
  { id: 'm5', k: 'lgMinas5', a: 5, f: minasAbiertas, p: 50 }, { id: 'fo', k: 'lgFiebre', a: 1, f: () => G.est.oroFiebre, p: 20 },
  { id: 'r7', k: 'lgRacha', a: 7, f: () => G.est.racha, p: 25 }, { id: 'of', k: 'lgOfrenda', a: 5, f: () => G.est.ofrendas, p: 10 },
];
function textoLogro(l) { return l.arg != null ? tr(l.k, l.arg) : tr(l.k, l.a >= 1000 ? fmt(l.a) : l.a); }
function logrosHechos() { let n = 0; if (G) for (const l of LOGROS) if (G.logros[l.id]) n++; return n; }
function revisarLogros() {
  if (!G) return;
  for (const l of LOGROS) if (!G.logros[l.id] && l.f() >= l.a) { G.logros[l.id] = 1; if (!BOT) { TOASTS.push({ s: textoLogro(l), t: 0 }); Sonido.mejora(9); } }
}
const MEDALLAS = [0.25, 0.5, 0.75];
const DIARIO = [{ p: 5 }, { of: 1800 }, { p: 10 }, { cash: 1800 }, { p: 15 }, { of: 3600 }, { p: 30 }];
function revisarDiario() {
  const h = hoy();
  if (G.diario.ultimo === h) return;
  G.diario.racha = G.diario.ultimo === ayer() ? G.diario.racha + 1 : 1;
  G.est.racha = Math.max(G.est.racha, G.diario.racha);
  G.diario.ultimo = h; G.diario.pendiente = 1;
}
function cobrarDiario() {
  const r = DIARIO[(G.diario.racha - 1) % 7];
  if (r.p) { G.pepitas += r.p; flotar(W / 2, H / 2 - 20, '+' + r.p + ' ' + tr('pepitas'), '#fff0a0'); }
  if (r.of) { G.ofrenda.hasta = Math.max(G.ofrenda.hasta, G.reloj) + r.of; flotar(W / 2, H / 2 - 20, tr('boost') + ' ' + fmtT(r.of), VERDE); }
  if (r.cash) { const v = MA.ingresoRef() * r.cash; MA.d.cash += v; MA.d.total += v; MA.d.hist += v; G.est.ganado += v; flotar(W / 2, H / 2 - 20, '+' + fmt(v), '#ffe08a'); monedasA(W / 2, H / 2, 8); }
  G.diario.pendiente = 0;
  Sonido.gema(); vibrar(20); PANEL = null;
  revisarLogros(); guardar(); siguienteAviso();
}
function siguienteAviso() {
  if (PANEL || ESCENA !== 'mina') return;
  const a = AVISOS.shift();
  if (a) { abrirPanel(a.tipo, a); return; }
  if (G.diario.pendiente && (G.tut >= 6 || G.diario.racha > 1)) abrirPanel('diario');
}
function aplicarAusencia(seg) {
  const ef = Math.min(seg, 8 * 3600), conBoost = clamp(G.ofrenda.hasta - G.reloj, 0, ef), gan = [];
  MINA.forEach((m, k) => { if (m) gan[k] = m.analitico(conBoost); });
  G.reloj += conBoost;
  MINA.forEach((m, k) => { if (m) { gan[k] += m.analitico(ef - conBoost); if (seg > 5) m.ag = null; } });
  G.reloj += seg - conBoost;
  const lista = [];
  MINA.forEach((m, k) => { if (m && gan[k] > 0) lista.push([k, gan[k]]); });
  if (seg > 60 && lista.length) { for (let i = AVISOS.length - 1; i >= 0; i--) if (AVISOS[i].tipo === 'bienvenida') AVISOS.splice(i, 1); AVISOS.unshift({ tipo: 'bienvenida', seg, lista }); }
  revisarDiario(); revisarLogros();
}

// ---------- minas ----------
function ganchos(m) {
  return {
    venta: v => {
      if (m !== MC() || ESCENA === 'titulo' || BOT && TURBO > 1) return;
      if (CAM.y < Y0) { const P = sup(), x = RX(P.ing + 6, 0), y = SUELO - 10 - CAM.y; flotar(x, y - 8, '+' + fmt(v), '#ffe08a', 0); monedasA(x, y, 2); }
    },
    descarga: () => {
      if (m !== MC() || CAM.y > Y0 + 20) return;
      Sonido.campana();
      const col = m.def.menas[0][0];
      for (let k = 0; k < 6; k++) part({ x: 22 + k, y: SUELO - 23, vx: rnd(20, 28), vy: rnd(-8, -3), g: 40, vida: 1, c: col, t: 'roca', suelo: SUELO - 27 });
    },
    pica: (i) => {
      if (m !== MC() || BOT && TURBO > 1) return;
      const y = Y0 + i * NH - CAM.y;
      if (y < -NH || y > H) return;
      const b = Math.min(4, Math.floor(i / 5));
      chispas(xVeta() - 1, Y0 + i * NH + 16 + rnd(-6, 8), m.def.menas[b][1], 3);
      if (vis() < 0.3) polvo(xVeta() - 2, Y0 + i * NH + 32, 2);
      Sonido.pico(0.5);
    },
    mineral: j => { G.est.minerales++; if (!BOT) hallazgoMineral(m, j); else G.nuevoMineral = 1; },
    hito: () => {
      if (BOT && TURBO > 1) return;
      banner(tr('hitoBanner'), '×2', ORO7); Sonido.hito(); vibrar([20, 30, 40]);
      for (let k = 0; k < 26; k++) part({ x: rnd(20, W - 20), y: CAM.y + rnd(30, 60), vx: rnd(-30, 30), vy: rnd(-40, 10), g: 50, vida: rnd(1, 1.8), c: ['#ffd84a', '#ff6a8a', '#6ae0ff', '#8af08a'][k % 4], t: 'confeti' });
    },
  };
}
function crearMina(k) { const m = new Mina(k, G.minas[k]); m.on = ganchos(m); return m; }
function cambiarMina(k) {
  const nueva = !G.minas[k];
  if (nueva) G.minas[k] = Mina.nueva(k * 131 + 17);
  if (!MINA[k]) MINA[k] = crearMina(k);
  G.minaAct = k; MA = MINA[k]; MA.ag = null;
  CAM.y = 0; CAM.obj = null; CAM.vy = 0; PART.length = 0;
  Sonido.musicaMina(k);
  if (nueva && !BOT) banner(tr('minaNueva'), MINAS[k].nom, ORO7);
  revisarLogros(); guardar();
}
function alEntrarMina() { CAM.y = 0; CAM.obj = null; HUD.cash = MA.d.cash; siguienteAviso(); }

// ---------- la Fiebre del Oro ----------
function parDelDia(des) {
  if (G.fiebre.parDia === des.dia && G.fiebre.par) return G.fiebre.par;
  G.fiebre.parDia = des.dia; G.fiebre.par = parCarrera(des);
  return G.fiebre.par;
}
function empezarCarrera(des) {
  PANEL = null;
  parDelDia(des);
  irA('carrera', () => { CARRERA = nuevaCarrera(des); CARRERA.mina.on = ganchos(CARRERA.mina); CAM.y = 0; CAM.obj = null; PART.length = 0; HUD.cash = 0; Sonido.musicaMina(des.mina); });
}
function terminarCarrera() {
  const C = CARRERA;
  if (!C || C.fin) return;
  C.fin = true;
  const total = C.mina.d.total, par = parDelDia(C.des), med = total >= par * MEDALLAS[2] ? 3 : total >= par * MEDALLAS[1] ? 2 : total >= par * MEDALLAS[0] ? 1 : 0;
  if (G.fiebre.dia !== C.des.dia) { G.fiebre.dia = C.des.dia; G.fiebre.mejorHoy = 0; G.fiebre.medallaHoy = 0; }
  const pago = [0, 3, 6, 12];
  let premio = 0;
  if (med > G.fiebre.medallaHoy) { premio = pago[med] - pago[G.fiebre.medallaHoy]; G.fiebre.medallaHoy = med; G.pepitas += premio; }
  const record = total > G.fiebre.record;
  G.fiebre.mejorHoy = Math.max(G.fiebre.mejorHoy, total);
  if (record) G.fiebre.record = total;
  if (med === 3) G.est.oroFiebre++;
  PANEL = { tipo: 'fiebreFin', t: 0, med, premio, record };
  if (med) Sonido.hito(); else Sonido.error();
  revisarLogros(); guardar();
}

// ---------- escenas y telón ----------
function irA(esc, alMedio) {
  if (TELON.fase) return false;
  TELON.fase = 1; TELON.t = 0;
  TELON.alMedio = () => { ESCENA = esc; PANEL = null; FLOT.length = 0; BANNERS.length = 0; if (alMedio) alMedio(); };
  Sonido.telon();
  return true;
}

// ---------- simulación ----------
let tFondo = 0, tGuardar = 0;
function simular(seg) {
  ACUM += seg;
  let n = 0;
  while (ACUM >= PASO && n++ < 400000) {
    ACUM -= PASO;
    if (ESCENA === 'carrera' && CARRERA && !CARRERA.fin) {
      CARRERA.t += PASO;
      const cm = CARRERA.mina;
      cm.paso(PASO);
      if (BOT) { const ps = botPaso(cm, PASO, true); if (ps) for (const p of ps) if (p && p.tipo === 'boost') cm.boostHasta = Math.max(cm.boostHasta || 0, CARRERA.t) + p.seg; }
      if (CARRERA.t >= CARRERA.dur) terminarCarrera();
    } else if (ESCENA !== 'carrera') { MA.paso(PASO); if (BOT) botMain(PASO); }
    G.reloj += PASO;
    tFondo += PASO;
    if (tFondo >= 1) { tFondo -= 1; MINA.forEach(m => { if (m && (m !== MA || ESCENA === 'carrera')) m.analitico(1); }); revisarLogros(); }
  }
}
function botMain(dt) {
  const ps = botPaso(MA, dt, true);
  if (ps) for (const p of ps) if (p) {
    if (p.tipo === 'pepitas') G.pepitas += p.n;
    else if (p.tipo === 'boost') G.ofrenda.hasta = Math.max(G.ofrenda.hasta, G.reloj) + p.seg;
    if (p.tipo !== 'mineral') G.est.condores++;
  }
  BOT_T -= dt;
  if (BOT_T > 0) return;
  BOT_T = 5;
  if (G.ofrenda.libre <= G.reloj) { G.ofrenda.libre = G.reloj + 4 * 3600; G.ofrenda.hasta = Math.max(G.ofrenda.hasta, G.reloj) + 1200; G.est.ofrendas++; }
  for (const l of LOGROS) if (G.logros[l.id] === 1) { G.logros[l.id] = 2; G.pepitas += l.p; }
  for (let k = MINAS.length - 1; k > G.minaAct; k--) if (minaDesbloqueada(k) && !G.minas[k]) { cambiarMina(k); return; }
  const m = MA, n = m.d.niveles.length;
  if (n !== m.botN) { m.botN = n; m.botT = G.reloj; }
  if (m.puedeRefundar() && G.reloj - (m.botT || 0) > 1200) { m.refundar(); G.est.refundaciones++; m.botT = G.reloj; }
  revisarLogros();
}

// ---------- entrada ----------
function aLog(e) { const r = lz.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; }
function puedeDesplazar() { return (ESCENA === 'mina' || ESCENA === 'carrera') && !PANEL && !CONF && !TELON.fase; }
function prepararEntrada() {
  lz.addEventListener('pointerdown', e => {
    e.preventDefault();
    Sonido.iniciar(); Sonido.volumen(OP.musica, OP.sonido);
    const p = aLog(e), z = zonaEn(ZONAS_PREV, p.x, p.y);
    const ptr = { id: e.pointerId, x: p.x, y: p.y, x0: p.x, y0: p.y, t0: T, arr: false, zona: z, drag: z && z.op.drag ? z.op.drag : null, scroll: !z || !!z.op.scroll, vy: 0, ty: performance.now() };
    E.punteros.set(e.pointerId, ptr);
    if (ptr.drag) ptr.drag(p.x, p.y, true);
    if (ptr.scroll) { CAM.vy = 0; }
    try { lz.setPointerCapture(e.pointerId); } catch (er) { }
  });
  lz.addEventListener('pointermove', e => {
    const ptr = E.punteros.get(e.pointerId);
    if (!ptr) return;
    const p = aLog(e), dy = p.y - ptr.y;
    ptr.x = p.x; ptr.y = p.y;
    if (!ptr.arr && Math.hypot(p.x - ptr.x0, p.y - ptr.y0) > 5) ptr.arr = true;
    if (ptr.drag) { if (ptr.arr) ptr.drag(p.x, p.y, false); return; }
    if (ptr.arr && ptr.scroll && puedeDesplazar()) {
      CAM.y -= dy * OP.arrastre; CAM.obj = null;
      const ahora = performance.now(), dts = Math.max(8, ahora - ptr.ty) / 1000;
      ptr.vy = lerp(ptr.vy, -dy * OP.arrastre / dts, 0.5); ptr.ty = ahora;
    }
  });
  const soltar = e => {
    const ptr = E.punteros.get(e.pointerId);
    if (!ptr) return;
    E.punteros.delete(e.pointerId);
    if (e.type === 'pointercancel') return;
    if (!ptr.arr && !ptr.repitio && !ptr.drag) E.clics.push({ x: ptr.x, y: ptr.y, x0: ptr.x0, y0: ptr.y0 });
    if (ptr.arr && ptr.scroll && puedeDesplazar() && performance.now() - ptr.ty < 80) CAM.vy = clamp(ptr.vy, -1500, 1500);
  };
  lz.addEventListener('pointerup', soltar);
  lz.addEventListener('pointercancel', soltar);
  lz.addEventListener('contextmenu', e => e.preventDefault());
  lz.addEventListener('wheel', e => { e.preventDefault(); if (puedeDesplazar()) { CAM.y += e.deltaY * 0.35; CAM.obj = null; CAM.vy = 0; } }, { passive: false });
  window.addEventListener('keydown', e => {
    Sonido.iniciar();
    if (e.key === 'Escape') { if (CONF) CONF = null; else if (PANEL) { if (PANEL.tipo !== 'diario' && PANEL.tipo !== 'bienvenida' && PANEL.tipo !== 'fiebreFin') cerrarPanel(); } else if (ESCENA === 'mina') abrirPanel('opciones'); }
    if (puedeDesplazar()) { if (e.key === 'ArrowDown' || e.key === 'PageDown') CAM.obj = clamp(CAM.y + (e.key === 'PageDown' ? H * 0.8 : 44), 0, camMax(MC())); if (e.key === 'ArrowUp' || e.key === 'PageUp') CAM.obj = clamp(CAM.y - (e.key === 'PageUp' ? H * 0.8 : 44), 0, camMax(MC())); if (e.key === 'Home') CAM.obj = 0; if (e.key === 'End') CAM.obj = camMax(MC()); }
  });
  window.addEventListener('blur', () => E.punteros.clear());
  window.addEventListener('resize', () => { PEND_RES = true; });
  let oculto = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { oculto = Date.now(); guardar(); Sonido.pausar(); E.punteros.clear(); }
    else {
      Sonido.seguir(); ultimo = 0;
      if (oculto) { const s = (Date.now() - oculto) / 1000; oculto = 0; if (s > 3 && ESCENA !== 'carrera') { aplicarAusencia(s); siguienteAviso(); } }
    }
  });
}
function repetirBotones() {
  for (const p of E.punteros.values()) {
    if (p.arr || !p.zona || !p.zona.op.rep || T - p.t0 < 0.35) continue;
    if (T >= (p.prox || 0)) {
      const z = zonaEn(ZONAS_PREV, p.x, p.y);
      if (z && z.op.rep) { z.fn(); p.repitio = true; }
      p.prox = T + [0.16, 0.09, 0.05][OP.mantener] * (T - p.t0 > 2 ? 0.5 : 1);
    }
  }
}
function resolverClics() {
  for (const c of E.clics) {
    const z = zonaEn(ZONAS, c.x, c.y);
    if (!z) continue;
    if (c.x0 < z.x - 4 || c.x0 > z.x + z.w + 4 || c.y0 < z.y - 4 || c.y0 > z.y + z.h + 4) continue;
    z.fn(c.x, c.y);
  }
  E.clics.length = 0;
}
function moverCamara(dt) {
  if (ESCENA === 'titulo') { CAM.y = lerp(CAM.y, Math.min(0, SUELO - H * 0.56), 1 - Math.exp(-6 * dt)); return; }
  const mx = camMax(MC());
  let arrastrando = false;
  for (const p of E.punteros.values()) if (p.arr && p.scroll) arrastrando = true;
  if (!arrastrando) {
    if (CAM.obj != null) { CAM.y = lerp(CAM.y, CAM.obj, 1 - Math.exp(-7 * dt)); if (Math.abs(CAM.y - CAM.obj) < 0.4) { CAM.y = CAM.obj; CAM.obj = null; } }
    else if (Math.abs(CAM.vy) > 2) { CAM.y += CAM.vy * dt; CAM.vy *= Math.exp(-3.2 * dt); }
  }
  const mn = camMin(MC());
  CAM.y = mn < 0 ? mn : clamp(CAM.y, 0, mx);
}

// ---------- pantalla ----------
function redimensionar() {
  DPR = window.devicePixelRatio || 1;
  const iw = window.innerWidth, ih = window.innerHeight, pw = iw * DPR, ph = ih * DPR;
  ESC = Math.max(1, Math.floor(Math.min(pw / 216, ph / 300)));
  W = clamp(Math.floor(pw / ESC), 160, 960); H = clamp(Math.floor(ph / ESC), 240, 960);
  RES = Math.min(ESC, 6);
  lz.width = W * RES; lz.height = H * RES;
  const cw = W * ESC / DPR, ch = H * ESC / DPR;
  lz.style.width = cw + 'px'; lz.style.height = ch + 'px';
  lz.style.left = Math.floor((iw - cw) / 2) + 'px'; lz.style.top = Math.floor((ih - ch) / 2) + 'px';
  gp = lz.getContext('2d');
  prepararMundo(); REJA = null; _mapa = null;
  if (MA) CAM.y = clamp(CAM.y, 0, camMax(MC()));
}

// ---------- el bucle ----------
let ultimo = 0, calT = 0, calN = 0;
function actualizar(dt) {
  T += dt;
  if (TELON.fase === 1) { TELON.t += dt / 0.3; if (TELON.t >= 1) { TELON.t = 1; TELON.fase = 2; const f = TELON.alMedio; TELON.alMedio = null; if (f) f(); } }
  else if (TELON.fase === 2) { TELON.t -= dt / 0.3; if (TELON.t <= 0) { TELON.t = 0; TELON.fase = 0; } }
  if (PANEL) PANEL.t += dt;
  let dts = dt;
  if (LENTA.t > 0) { LENTA.t -= dt; dts *= 0.35; }
  simular(dts * TURBO);
  repetirBotones();
  moverCamara(dt);
  pasoParticulas(dt); pasoFlot(dt);
  for (let i = TOASTS.length - 1; i >= 0; i--) if ((TOASTS[i].t += dt) > 2.8 && i === 0) TOASTS.shift();
  Sonido.tic();
  if ((tGuardar += dt) > 5) { tGuardar = 0; guardar(); }
}
const PANELES = {
  mejora: panelMejora, capataz: panelCapataz, capataces: panelCapataces, minas: panelMinas, vitrina: panelVitrina, logros: panelLogros, ofrenda: panelOfrenda,
  opciones: panelOpciones, idioma: panelIdioma, controles: panelControles, diario: panelDiario, bienvenida: panelBienvenida, fiebre: panelFiebre, fiebreFin: panelFiebreFin,
};
function dibujar() {
  const g = gp, m = MC();
  ZONAS = [];
  g.setTransform(RES, 0, 0, RES, 0, 0);
  g.imageSmoothingEnabled = false;
  dibujarMundo(m, T);
  componerMundo(g, ZURDO);
  if (ESCENA === 'titulo') escenaTitulo(g);
  else {
    uiMundo(g, m);
    hudSuperior(g, m);
    if (ESCENA === 'carrera') hudCarrera(g);
    else if (!PANEL || PANEL.tipo !== 'controles') botonesFlotantes(g);
    tutorial(g, m);
  }
  dibujarFlot(g);
  if (TOASTS.length) {
    const t = TOASTS[0], k = Math.min(1, t.t / 0.25, (2.8 - t.t) / 0.25), y = Math.round(lerp(-20, 24, suave(k))), w = Math.min(W - 16, anchoTxt(g, t.s) + 24);
    rect(g, W / 2 - w / 2 - 1, y - 1, w + 2, 15, '#120804'); rect(g, W / 2 - w / 2, y, w, 13, '#3a2410'); rect(g, W / 2 - w / 2, y, w, 1, '#d08440');
    icono(g, 'trofeo', W / 2 - w / 2 + 3, y + 1); txt(g, t.s, W / 2 - w / 2 + 18, y + 3, { c: '#ffe08a', max: w - 22 });
  }
  if (PANEL && PANELES[PANEL.tipo]) PANELES[PANEL.tipo](g, PANEL);
  if (CONF) panelConfirmar(g);
  dibujarTelon(g);
  if (ERRORES.length && PRUEBA) txt(g, 'ERR ' + ERRORES.length, 2, H - 8, { f: 'mini', c: '#ff5050' });
  resolverClics();
  ZONAS_PREV = ZONAS;
}
function cuadro(ts) {
  requestAnimationFrame(cuadro);
  try {
    if (PEND_RES) { PEND_RES = false; redimensionar(); }
    const real = ultimo ? (ts - ultimo) / 1000 : 1 / 60;
    ultimo = ts;
    if (!CONGELADO) actualizar(Math.max(0, Math.min(0.05, real)));
    dibujar();
    if (OP.calidad === 'auto' && CALIDAD !== 'baja' && !PRUEBA && real < 0.5) {
      calT += real; calN++;
      if (calT > 4) { if (calN / calT < 46) { CALIDAD = 'baja'; OP.calidadAuto = 'baja'; guardarOp(); } calT = 0; calN = 0; }
    }
  } catch (e) { ERRORES.push(String(e && e.stack || e)); if (ERRORES.length > 30) ERRORES.shift(); console.error(e); }
}

// ---------- arranque ----------
function cargar() {
  OP = Object.assign(opDefecto(), Guardado.leer('opciones', {}));
  if (!OP.botones || !OP.botones.v) OP.botones = { v: {}, h: {} };
  OP.tam = OP.tam || {}; OP.opac = OP.opac || {};
  FORMATO = OP.numeros; VIBRAR = OP.vibrar; ZURDO = !!OP.zurdo;
  CALIDAD = OP.calidad === 'baja' || (OP.calidad === 'auto' && OP.calidadAuto === 'baja') ? 'baja' : 'alta';
  Sonido.vMus = OP.musica; Sonido.vEf = OP.sonido;
  IDIOMA = idiomaInicial(Guardado.leer('idioma', null));
  document.documentElement.lang = IDIOMA;
  const d = Guardado.leer('datos', null), base = nuevoG();
  G = Object.assign(base, d || {});
  G.est = Object.assign(nuevoG().est, G.est || {}); G.ofrenda = Object.assign({ hasta: 0, libre: 0 }, G.ofrenda || {});
  G.fiebre = Object.assign(nuevoG().fiebre, G.fiebre || {}); G.diario = Object.assign({ ultimo: 0, racha: 0, pendiente: 0 }, G.diario || {});
  if (!Array.isArray(G.minas) || !G.minas[0]) G.minas = [Mina.nueva(11)];
  G.minas.forEach(m => { if (m) { const def = Mina.nueva(); for (const k in def) if (m[k] === undefined) m[k] = def[k]; } });
  MINA = [];
  G.minas.forEach((x, k) => { if (x) MINA[k] = crearMina(k); });
  if (!MINA[G.minaAct]) G.minaAct = 0;
  MA = MINA[G.minaAct];
  Sonido.musicaMina(G.minaAct);
  if (d) { const aus = (Date.now() - (d.t || Date.now())) / 1000; if (aus > 5) aplicarAusencia(aus); }
  revisarDiario();
}
function iniciar() {
  lz = document.getElementById('lienzo');
  prepararSprites();
  cargar();
  redimensionar(); PEND_RES = false;
  prepararEntrada();
  const c = document.getElementById('carga');
  if (c) c.remove();
  if (PARAM.has('portada')) { G.desfase = 0.765 * 480 - G.reloj; MA.ev.condor = { t: 4.6, dur: 12, dir: 1, y: 0.15 }; MA.ev.tC = 1e9; }
  if (PARAM.has('directo')) { ESCENA = 'mina'; alEntrarMina(); }
  requestAnimationFrame(cuadro);
}

window.__juego = {
  get G() { return G; }, get MA() { return MA; }, get MC() { return MC(); }, get escena() { return ESCENA; }, get panel() { return PANEL && PANEL.tipo; },
  get carrera() { return CARRERA; }, get errores() { return ERRORES; }, get fuera() { return FUERA; }, get zonas() { return ZONAS_PREV.map(z => [z.x, z.y, z.w, z.h]); },
  get turbo() { return TURBO; }, set turbo(v) { TURBO = v; }, set bot(v) { BOT = !!v; }, get bot() { return BOT; }, set congelado(v) { CONGELADO = !!v; },
  get W() { return W; }, get H() { return H; }, get cam() { return CAM.y; }, set cam(v) { CAM.y = v; CAM.obj = null; CAM.vy = 0; },
  paso(dt, dib) { actualizar(dt); if (dib !== false) dibujar(); },
  simular(seg, conBot) { const b = BOT, tb = TURBO; BOT = conBot !== false; TURBO = 2; let s = seg; while (s > 0) { const k = Math.min(1, s); simular(k); pasoParticulas(k); s -= k; } FLOT.length = 0; BANNERS.length = 0; BOT = b; TURBO = tb; },
  escenaA(e) { ESCENA = e; if (e === 'mina') alEntrarMina(); }, abrir(t, d) { abrirPanel(t, d); }, cerrar() { PANEL = null; CONF = null; AVISOS.length = 0; },
  idioma(c) { cambiarIdioma(c); }, mina(k) { cambiarMina(k); }, fase(f) { G.desfase = f * 480 - G.reloj; },
  carrera0() { const des = desafioDelDia(hoy()); parDelDia(des); CARRERA = nuevaCarrera(des); CARRERA.mina.on = ganchos(CARRERA.mina); ESCENA = 'carrera'; CAM.y = 0; },
  terminarCarrera() { if (CARRERA) { CARRERA.t = CARRERA.dur; terminarCarrera(); } }, dibujar() { dibujar(); }, tr,
  async medirAudio(seg) {
    const off = new OfflineAudioContext(2, 44100 * seg, 44100);
    let falso = 0;
    const pr = new Proxy(off, { get(t, k) { if (k === 'currentTime') return falso; if (k === 'state') return 'running'; const v = t[k]; return typeof v === 'function' ? v.bind(t) : v; } });
    const viejo = Sonido.ctx;
    Sonido.ctx = pr; Sonido.ks = new Map(); Sonido.armar(); Sonido.volumen(OP.musica, OP.sonido); Sonido.prox = 0.05; Sonido.paso = 0; Sonido.frase = null; Sonido.sonando = true;
    for (falso = 0; falso < seg - 0.6; falso = Math.round((falso + 0.1) * 10) / 10) {
      Sonido.tic(); Sonido.ult = {};
      if (falso % 1.5 < 0.05) { Sonido.pico(1); Sonido.moneda(3); }
      if (falso === 4) Sonido.nivelNuevo(); if (falso === 8) Sonido.hito(); if (falso === 11) Sonido.ofrenda(); if (falso === 13) Sonido.condor(); if (falso === 15) Sonido.gema();
    }
    const b = await off.startRendering();
    Sonido.ctx = viejo; Sonido.ks = new Map(); Sonido.sonando = !!viejo;
    const L = b.getChannelData(0), R = b.getChannelData(1), n = b.length, rms = [];
    let pico = 0, dc = 0;
    for (let s = 0; s < seg; s++) { let a = 0; const i0 = s * 44100, i1 = Math.min(n, i0 + 44100); for (let i = i0; i < i1; i++) { const v = (L[i] + R[i]) / 2; a += v * v; } rms.push(+Math.sqrt(a / (i1 - i0)).toFixed(3)); }
    for (let i = 0; i < n; i++) { pico = Math.max(pico, Math.abs(L[i]), Math.abs(R[i])); dc += L[i]; }
    return { rms, picoDb: +(20 * Math.log10(pico)).toFixed(1), dc: +(dc / n).toFixed(5) };
  },
  estado() { return { escena: ESCENA, panel: PANEL && PANEL.tipo, minaAct: G.minaAct, pepitas: G.pepitas, reloj: Math.round(G.reloj), logros: logrosHechos(), minas: G.minas.map(d => d && { n: d.niveles.length, cash: d.cash, total: d.total, ref: d.ref, maxN: d.maxN, asc: d.asc.L, sup: d.sup.L, min: d.min.join('') }) }; },
};
iniciar();
