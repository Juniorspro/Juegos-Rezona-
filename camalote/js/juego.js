// CAMALOTE — el juego: estado, escenas, entrada (dedos y teclado), pantalla, bucle, bot y API de prueba
let G = null, OP = null, ALBUM = {}, ESCENA = 'titulo', T = 0, ACUM = 0, TURBO = 1, BOT = false, CONGELADO = false;
let PEND_RES = true, PEND_G = false, HAY_PARTIDA = false, TACTIL = false, BANDEJA = false, DT_REAL = 1 / 60;
const PASO = 1 / 60;
const TELON = { fase: 0, t: 0, alMedio: null };
const E = { punteros: new Map(), clics: [], teclas: new Set() };
const PULSO = { A: 0, B: 0, C: 0, D: 0 }, TECLA_B = { A: false, B: false, C: false, D: false };
const ERRORES = [];
let lz = null, gp = null, tGuardar = 0;

function nuevoG() { return { v: 1, cap: 1, nivel: 'c1', items: {}, mundo: {}, figus: {}, check: null, objetivo: null, hpMax: 6, tiempo: 0, fin: false }; }
function opDefecto() { return { v: 1, calidad: 'alta', musica: 0.7, sonido: 0.8, vibrar: true, zurdo: false, palanca: 'flotante', pos: { v: {}, h: {} }, tam: {}, opac: {} }; }
function guardar() { if (!G || !HAY_PARTIDA) return; if (guionActivo()) { PEND_G = true; return; } G.t = Date.now(); Guardado.escribir('datos', G); HAY_PARTIDA = true; }
function guardarOp() { Guardado.escribir('opciones', OP); }

// ---------- escenas ----------
function irA(esc, alMedio) {
  if (TELON.fase) return;
  const f = () => { ESCENA = esc; soltarTodo(); if (alMedio) alMedio(); };
  if (PRUEBA) { f(); return; }
  TELON.fase = 1; TELON.t = 0; TELON.alMedio = f; Sonido.ola();
}
function nuevaPartida() {
  G = nuevoG(); Guardado.escribir('datos', G); HAY_PARTIDA = true;
  irA('laminas', () => { LAM = { lista: LAMINAS.prologo, i: 0, t: 0, fin: () => cambiarCapitulo(1) }; Sonido.musica(4); });
}
function continuarPartida() { irA('juego', () => entrarNivel(G.nivel, G.check && G.check.nivel === G.nivel ? [G.check.x, G.check.y] : null)); }
function entrarNivel(id, pos) {
  DLG = null; BAN = null; OBJ.t = 99;
  cargarNivel(id, pos);
  if (!N.flag('ini')) { N.setFlag('ini'); correr(N.d.inicio); }
}
function cambiarCapitulo(n) {
  G.cap = n; G.nivel = 'c' + n; G.check = null; guardar();
  irA('tarjeta', () => { TARJ = { cap: n, t: 0 }; Sonido.musica(4); });
}
function salirTarjeta() { if (ESCENA === 'tarjeta') irA('juego', () => entrarNivel(G.nivel)); }
function iniciarFinal() {
  G.fin = true; guardar();
  irA('laminas', () => { LAM = { lista: LAMINAS.final, i: 0, t: 0, fin: () => irA('fin', () => Sonido.musica(0)) }; Sonido.musica(4); });
}
function avanzarLamina(saltar) {
  const L = LAM;
  if (!L || TELON.fase || L.listo || (!saltar && L.t < 0.35)) return;
  if (!saltar && L.i < L.lista.length - 1) { L.i++; L.t = 0; Sonido.pagina(); }
  else { L.listo = true; L.fin(); }
}

// ---------- entrada ----------
function aLog(e) { const r = lz.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; }
function hayModal() { return !!(PANEL || DLG || BAN || TELON.fase || ESCENA !== 'juego'); }
function teclasDir() { let x = 0, y = 0; if (E.teclas.has('l')) x -= 1; if (E.teclas.has('r')) x += 1; if (E.teclas.has('u')) y -= 1; if (E.teclas.has('dn')) y += 1; return [x, y]; }
function soltarTodo() {
  E.punteros.clear(); E.teclas.clear(); CTL.joy.act = false; CTL.joy.vx = CTL.joy.vy = 0;
  for (const k in CTL.bot) { CTL.bot[k] = false; TECLA_B[k] = false; PULSO[k] = 0; }
}
function ctlEn(x, y) {
  for (const id of ['A', 'B', 'C', 'D', 'joy']) { const [cx, cy] = posCtl(id); if (Math.hypot(x - cx, y - cy) < radioCtl(id) * (id === 'joy' ? 0.9 : 1.2)) return id; }
  return null;
}
function moverCtl(id, x, y) {
  const r = id === 'joy' ? radioCtl(id) * 0.8 : radioCtl(id), o = orient();
  OP.pos[o] = OP.pos[o] || {};
  OP.pos[o][id] = [clamp(x, r + 2, W - r - 2) / W, clamp(y, r + 2, H - r - 2) / H];
}
function apretar(id) { PULSO[id] = 0.15; vibrar(id === 'B' ? 18 : 10); }
const TECLAS = { ArrowLeft: 'l', a: 'l', ArrowRight: 'r', d: 'r', ArrowUp: 'u', w: 'u', ArrowDown: 'dn', s: 'dn' };
const TECLAS_B = { z: 'A', j: 'A', e: 'A', Enter: 'A', x: 'B', k: 'B', ' ': 'B', Shift: 'B', c: 'C', l: 'C', q: 'C', v: 'D', i: 'D', f: 'D' };
function teclaEscape() {
  if (PANEL) { soltarTodo(); cerrarPanel(); }
  else if (ESCENA === 'juego' && !DLG && !BAN && !TELON.fase) abrirPanel('pausa');
}
function prepararEntrada() {
  lz.addEventListener('pointerdown', e => {
    e.preventDefault();
    Sonido.iniciar(); Sonido.volumen(OP.musica, OP.sonido);
    if (e.pointerType === 'touch' || e.pointerType === 'pen') TACTIL = true;
    const p = aLog(e), z = zonaEn(ZONAS_PREV, p.x, p.y);
    const ptr = { id: e.pointerId, x: p.x, y: p.y, x0: p.x, y0: p.y, t0: T, arr: false, rol: 'ui', zona: z };
    const ed = PANEL && PANEL.tipo === 'controles';
    if (ed && PANEL.modo === 'mover') {
      const id = !z ? ctlEn(p.x, p.y) : null;
      if (id) { ptr.rol = 'mover'; ptr.ctl = id; PANEL.sel = id; const [cx, cy] = posCtl(id); ptr.dx = cx - p.x; ptr.dy = cy - p.y; }
    } else if (TACTIL && !z && (ed || !hayModal())) {
      const id = tocarControl(p.x, p.y);
      if (id === 'joy') { if (!CTL.joy.act) { ptr.rol = 'joy'; CTL.joy.act = true; CTL.joy.id = e.pointerId; moverPalanca(p.x, p.y, true); } }
      else if (id) { ptr.rol = id; CTL.bot[id] = true; apretar(id); }
    }
    E.punteros.set(e.pointerId, ptr);
    if (ptr.rol === 'ui' && z && z.op.drag) { ptr.drag = z.op.drag; ptr.drag(p.x, p.y); }
    try { lz.setPointerCapture(e.pointerId); } catch (er) { }
  });
  lz.addEventListener('pointermove', e => {
    const ptr = E.punteros.get(e.pointerId);
    if (!ptr) return;
    const p = aLog(e);
    ptr.x = p.x; ptr.y = p.y;
    if (!ptr.arr && Math.hypot(p.x - ptr.x0, p.y - ptr.y0) > 7) ptr.arr = true;
    if (ptr.rol === 'joy') moverPalanca(p.x, p.y, false);
    else if (ptr.rol === 'mover') moverCtl(ptr.ctl, p.x + ptr.dx, p.y + ptr.dy);
    else if (ptr.drag) ptr.drag(p.x, p.y);
  });
  const soltar = e => {
    const ptr = E.punteros.get(e.pointerId);
    if (!ptr) return;
    E.punteros.delete(e.pointerId);
    if (ptr.rol === 'joy') { CTL.joy.act = false; CTL.joy.vx = CTL.joy.vy = 0; CTL.joy.id = null; }
    else if (ptr.rol in CTL.bot) CTL.bot[ptr.rol] = false;
    else if (ptr.rol === 'mover') guardarOp();
    if (e.type === 'pointercancel') return;
    if (ptr.rol === 'ui' && !ptr.arr && !ptr.drag) E.clics.push({ x: ptr.x, y: ptr.y, x0: ptr.x0, y0: ptr.y0 });
  };
  lz.addEventListener('pointerup', soltar);
  lz.addEventListener('pointercancel', soltar);
  lz.addEventListener('contextmenu', e => e.preventDefault());
  window.addEventListener('keydown', e => {
    Sonido.iniciar(); Sonido.volumen(OP.musica, OP.sonido);
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === 'Escape' || k === 'p') { if (!e.repeat) teclaEscape(); e.preventDefault(); return; }
    if (TECLAS[k]) { E.teclas.add(TECLAS[k]); e.preventDefault(); }
    const b = TECLAS_B[k];
    if (b) { e.preventDefault(); TECLA_B[b] = true; if (!e.repeat) { PULSO[b] = 0.15; if (ESCENA === 'titulo' && !PANEL && b === 'A') (HAY_PARTIDA && !G.fin ? continuarPartida : nuevaPartida)(); } }
  });
  window.addEventListener('keyup', e => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (TECLAS[k]) E.teclas.delete(TECLAS[k]);
    if (TECLAS_B[k]) TECLA_B[TECLAS_B[k]] = false;
  });
  window.addEventListener('blur', soltarTodo);
  window.addEventListener('resize', () => { PEND_RES = true; });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { guardar(); Sonido.pausar(); soltarTodo(); if (ESCENA === 'juego' && !PANEL && !DLG && !BAN && !BOT) abrirPanel('pausa'); }
    else { Sonido.seguir(); ultimo = 0; }
  });
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
function leerEntrada() {
  let [mx, my] = teclasDir();
  if (CTL.joy.act) { mx += CTL.joy.vx; my += CTL.joy.vy; }
  if (BOT) { mx = BOTST.in.mx; my = BOTST.in.my; }
  ENT.mx = clamp(mx, -1, 1); ENT.my = clamp(my, -1, 1);
  ENT.a = PULSO.A > 0; ENT.b = PULSO.B > 0;
  ENT.c = PULSO.C > 0 || CTL.bot.C || TECLA_B.C; ENT.d = PULSO.D > 0 || CTL.bot.D || TECLA_B.D;
}

// ---------- pantalla ----------
function redimensionar() {
  DPR = window.devicePixelRatio || 1;
  const iw = Math.max(1, window.innerWidth), ih = Math.max(1, window.innerHeight), esc = Math.min(iw, ih) / 360;
  W = iw / esc; H = ih / esc;
  // calidad automática: alta (la pantalla entera), media (hasta 2 px por punto), baja (1,5): baja sola y queda guardada
  const tope = { alta: [9, 4.2e6], media: [2, 2.2e6], baja: [1.5, 1.2e6] }[OP.calidad] || [9, 4.2e6];
  K = PARAM.has('k') ? +PARAM.get('k') : Math.min(esc * Math.min(DPR, tope[0]), Math.sqrt(tope[1] / (W * H)));
  lz.width = Math.round(W * K); lz.height = Math.round(H * K);
  lz.style.width = iw + 'px'; lz.style.height = ih + 'px';
  gp = lz.getContext('2d');
  BANDEJA = H >= W * 1.55;
  VISTA.x = 0; VISTA.y = 0; VISTA.w = W; VISTA.h = BANDEJA ? Math.round(Math.max(W * 1.05, H * 0.62)) : H;
  if (N) limitarCam();
}

// ---------- el bucle ----------
function prepararDialogo(g) {
  const d = DLG, w = Math.min(VISTA.w - 16, 600);
  if (d.lineas && d.w === w && d.idioma === IDIOMA) return;
  d.lineas = partir(g, d.texto, w - 92, { tam: 14.5, peso: 500 }); d.w = w; d.idioma = IDIOMA;
  d.total = d.lineas.reduce((a, l) => a + Array.from(l).length, 0) + d.lineas.length - 1;
}
function tipear(dt) {
  const d = DLG;
  d.t += dt;
  if (gp) prepararDialogo(gp);
  const antes = Math.floor(d.n);
  d.n = Math.min(d.total || 0, d.n + dt * 48);
  if (Math.floor(d.n) > antes && Math.floor(d.n) % 2 === 0) Sonido.blip(d.quien);
}
function logica(dt) {
  if (ESCENA === 'juego' && N) {
    if (PANEL) { if (PANEL.tipo === 'controles' && PANEL.modo === 'probar') pasoPrevia(dt); return; }
    if (DLG && (PULSO.A > 0 || PULSO.B > 0)) { avanzarDialogo(); PULSO.A = PULSO.B = 0; }
    if (BAN) { BAN.t += dt; if (PULSO.A > 0 || PULSO.B > 0) { cerrarBanner(); PULSO.A = PULSO.B = 0; } }
    if (DLG) tipear(dt);
    ACUM += dt;
    let n = 0;
    while (ACUM >= PASO - 1e-9 && n < 6) {
      if (BOT) botPaso(PASO);
      leerEntrada();
      ENT_USADO = false;
      pasoMundo(PASO);
      if (ENT_USADO) PULSO.A = PULSO.B = PULSO.C = PULSO.D = 0;
      else for (const k in PULSO) PULSO[k] = Math.max(0, PULSO[k] - PASO);
      ACUM -= PASO; n++;
      if (ESCENA !== 'juego') break;
    }
    if (n >= 6) ACUM = 0;
    OBJ.t += dt;
    if (PEND_G && !guionActivo()) { PEND_G = false; guardar(); }
    if ((tGuardar += dt) > 10) { tGuardar = 0; guardar(); }
  } else {
    if (ESCENA === 'laminas' && LAM) LAM.t += dt;
    if (ESCENA === 'tarjeta' && TARJ) { TARJ.t += dt; if (TARJ.t > 3.4) salirTarjeta(); }
    if (BOT) botPaso(dt);
    if (PULSO.A > 0 || PULSO.B > 0) { if (ESCENA === 'tarjeta' && TARJ && TARJ.t > 0.8) salirTarjeta(); else if (ESCENA === 'laminas') avanzarLamina(); }
    for (const k in PULSO) PULSO[k] = 0;
  }
}
function actualizar(dt) {
  T += dt;
  if (TELON.fase === 1) { TELON.t += dt / 0.45; if (TELON.t >= 1) { TELON.t = 1; TELON.fase = 2; const f = TELON.alMedio; TELON.alMedio = null; if (f) f(); } }
  else if (TELON.fase === 2) { TELON.t -= dt / 0.45; if (TELON.t <= 0) { TELON.t = 0; TELON.fase = 0; } }
  if (PANEL) PANEL.t += dt;
  logica(dt);
  if (TOASTS.length && (TOASTS[0].t += dt) > 2.6) TOASTS.shift();
  Sonido.tic();
}
function dibujarMundo(g) {
  const v = VISTA;
  g.save();
  g.beginPath(); g.rect(v.x, v.y, v.w, v.h); g.clip();
  const amp = CAM.amp > 0 && !PRUEBA ? CAM.amp : 0, sx = amp ? (Math.random() * 2 - 1) * amp : 0, sy = amp ? (Math.random() * 2 - 1) * amp : 0;
  const ox = Math.round((v.x + v.w / 2 - CAM.x * TS + sx) * K) / K, oy = Math.round((v.y + v.h / 2 - CAM.y * TS + sy) * K) / K;
  g.translate(ox, oy);
  const x0 = Math.max(0, Math.floor((v.x - ox) / TS) - 1), x1 = Math.min(N.w - 1, Math.ceil((v.x + v.w - ox) / TS) + 1);
  const y0 = Math.max(0, Math.floor((v.y - oy) / TS) - 1), y1 = Math.min(N.h - 1, Math.ceil((v.y + v.h - oy) / TS) + 1);
  dibujarSuelo(g, N, x0, y0, x1, y1, T);
  for (const f of EFECTOS) if (f.t === 'mancha') dibujarEfecto(g, f, T);
  const L = [];
  for (let y = y0; y <= Math.min(N.h - 1, y1 + 2); y++) for (let x = x0; x <= x1; x++) { const c = N.tile(x, y); if (ALTOS.has(c)) L.push([y + 0.95, 0, x, y, c]); }
  for (const e of N.ents) if (!e.muerto && e.x > x0 - 1 && e.x < x1 + 2 && e.y > y0 - 1 && e.y < y1 + 4) L.push([e.y, 1, e]);
  L.push([J.y + 0.01, 2]);
  if (N.jefe) L.push([N.jefe.id === 'draga' ? 53.9 : N.jefe.y + 0.02, 3]);
  L.sort((a, b) => a[0] - b[0]);
  for (const it of L) {
    if (it[1] === 0) dibujarAlto(g, N, it[4], it[2], it[3], T);
    else if (it[1] === 1) dibujarEnt(g, it[2], T, N);
    else if (it[1] === 2) dibujarJugador(g, J, T);
    else dibujarJefe(g, N.jefe, T);
  }
  for (const p of PROYS) dibujarProy(g, p, T);
  for (const f of EFECTOS) if (f.t !== 'mancha') dibujarEfecto(g, f, T);
  burbuja(g);
  g.restore();
}
function dibujar() {
  const g = gp;
  ZONAS = [];
  g.setTransform(K, 0, 0, K, 0, 0);
  g.imageSmoothingEnabled = true;
  if (ESCENA === 'juego' && N) {
    dibujarMundo(g);
    luzYClima(g, N, T, DT_REAL);
    if (BANDEJA) dibujarBandeja(g);
    dibujarControles(g);
    flechaObjetivo(g);
    hud(g);
    dibujarToasts(g);
    if (DLG) { prepararDialogo(g); dibujarDialogo(g); }
    if (BAN) dibujarBanner(g);
  } else if (ESCENA === 'tarjeta' && TARJ) escenaTarjeta(g);
  else if (ESCENA === 'laminas' && LAM) escenaLaminas(g);
  else if (ESCENA === 'fin') escenaFin(g);
  else if (ESCENA === 'portada') escenaPortada(g);
  else escenaTitulo(g);
  if (PANEL) dibujarPanel(g);
  dibujarTelon(g);
  if (ERRORES.length && PRUEBA) txt(g, 'ERR ' + ERRORES.length, 4, H - 10, { tam: 10, c: '#ff5050' });
  resolverClics();
  ZONAS_PREV = ZONAS;
}
let ultimo = 0;
const CAL = { t: 0, n: 0 };
function cuadro(ts) {
  requestAnimationFrame(cuadro);
  try {
    if (PEND_RES) { PEND_RES = false; redimensionar(); }
    const real = ultimo ? (ts - ultimo) / 1000 : 1 / 60;
    ultimo = ts;
    DT_REAL = Math.max(0, Math.min(0.05, real));
    if (!CONGELADO) for (let i = 0; i < TURBO; i++) actualizar(DT_REAL);
    dibujar();
    if (ESCENA === 'juego' && !PANEL && !PRUEBA && OP.calidad !== 'baja' && real < 0.5) {
      CAL.t += real; CAL.n++;
      if (CAL.t > 4) { if (CAL.n / CAL.t < 48) { OP.calidad = OP.calidad === 'media' ? 'baja' : 'media'; guardarOp(); PEND_RES = true; _bandeja = null; } CAL.t = 0; CAL.n = 0; }
    }
  } catch (e) { ERRORES.push(String(e && e.stack || e)); if (ERRORES.length > 30) ERRORES.shift(); console.error(e); }
}

// ---------- el bot: recorre las RUTAS con modo dios (así se sabe que cada capítulo se puede terminar) ----------
const BOTST = { nivel: null, paso: 0, t: 0, sub: {}, log: [], in: { mx: 0, my: 0 }, camino: null, meta: null, chk: null, atasco: 0, td: 0 };
function buscarCamino(x0, y0, x1, y1) {
  const w = N.w, h = N.h, gg = new Float32Array(w * h).fill(1e9), de = new Int32Array(w * h).fill(-1), cer = new Uint8Array(w * h);
  const pasa = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return false;
    const c = N.tile(x, y);
    if (c === 'D' && TIENE('llave')) return true;
    return !N.solido(x + 0.5, y + 0.5);
  };
  const costo = (x, y) => { const c = N.tile(x, y); return 1 + (AGUA.has(c) ? 0.8 : 0) + (LENTO.has(c) ? 0.6 : 0) + (CINTAS[c] ? 0.4 : 0); };
  const hh = (x, y) => Math.abs(x - x1) + Math.abs(y - y1);
  const ab = [[hh(x0, y0), x0, y0]];
  gg[y0 * w + x0] = 0;
  while (ab.length) {
    let bi = 0;
    for (let i = 1; i < ab.length; i++) if (ab[i][0] < ab[bi][0]) bi = i;
    const [, x, y] = ab[bi];
    ab[bi] = ab[ab.length - 1]; ab.pop();
    const k = y * w + x;
    if (cer[k]) continue;
    cer[k] = 1;
    if (x === x1 && y === y1) { const r = []; let q = k; while (q !== y0 * w + x0) { r.push([q % w, Math.floor(q / w)]); q = de[q]; } return r.reverse(); }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (!pasa(nx, ny)) continue;
      const nk = ny * w + nx, ng = gg[k] + costo(nx, ny);
      if (ng < gg[nk]) { gg[nk] = ng; de[nk] = k; ab.push([ng + hh(nx, ny), nx, ny]); }
    }
  }
  return null;
}
function botApuntar(x, y, v) { const dx = x - J.x, dy = y - J.y, d = Math.hypot(dx, dy) || 1; BOTST.in.mx = dx / d * (v || 1); BOTST.in.my = dy / d * (v || 1); return d; }
function botEmbestir(x, y) { if (J.dashCD > 0 || J.dash > 0) return; botApuntar(x, y, 1); PULSO.B = 0.15; }
function botIr(tx, ty) {
  const B = BOTST, cx = tx + 0.5, cy = ty + 0.5;
  if (Math.hypot(J.x - cx, J.y - cy) < 0.2) return true;
  if (!B.camino || B.meta !== tx + ',' + ty) { B.camino = buscarCamino(Math.floor(J.x), Math.floor(J.y), tx, ty); B.meta = tx + ',' + ty; }
  if (!B.camino) { botApuntar(cx, cy, 1); return false; }
  while (B.camino.length && Math.hypot(J.x - (B.camino[0][0] + 0.5), J.y - (B.camino[0][1] + 0.5)) < 0.24) B.camino.shift();
  const [wx, wy] = B.camino.length ? B.camino[0] : [tx, ty];
  botApuntar(wx + 0.5, wy + 0.5, 1);
  if (!B.chk) B.chk = { t: B.t, x: J.x, y: J.y };
  if (B.t - B.chk.t > 1.2) {
    if (Math.hypot(J.x - B.chk.x, J.y - B.chk.y) < 0.15) { B.atasco++; B.camino = null; if (B.atasco > 3) botEmbestir(wx + 0.5, wy + 0.5); }
    B.chk = { t: B.t, x: J.x, y: J.y };
  }
  return false;
}
function botHablar(id) {
  const B = BOTST, s = B.sub, e = N.ent(id);
  if (!e) return true;
  if (s.hecho != null) {
    if (s.vio) return !guionActivo() && !DLG;
    if (B.t - s.hecho > 0.8) s.hecho = null;
    return false;
  }
  if (!s.dest) {
    const ex = Math.floor(e.x), ey = Math.floor(e.y);
    let mejor = null, md = 1e9;
    for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const x = ex + dx, y = ey + dy;
      if (N.solido(x + 0.5, y + 0.5) || N.agua(x + 0.5, y + 0.5)) continue;
      const c = Math.floor(J.x) === x && Math.floor(J.y) === y ? [] : buscarCamino(Math.floor(J.x), Math.floor(J.y), x, y);
      if (c && c.length < md) { md = c.length; mejor = [x, y]; }
    }
    s.dest = mejor || [ex, ey + 1];
  }
  if (!botIr(s.dest[0], s.dest[1])) return false;
  J.dir = e.x > J.x + 0.5 ? 'r' : e.x < J.x - 0.5 ? 'l' : e.y > J.y ? 'd' : 'u';
  PULSO.A = 0.15; s.hecho = B.t;
  return false;
}
function botJefe() {
  const j = N.jefe;
  if (!j) return N.flag('jefeOk') && !guionActivo();
  if (j.est === 'muere' || j.est === 'cae') return false;
  if (j.id === 'mosquita') {
    if (j.vulnerable()) { if (botApuntar(j.x, j.y, 1) < 2) botEmbestir(j.x, j.y); }
    else { const [ax, ay, aw, ah] = N.d.arena; botApuntar(ax + aw / 2 + 0.5, ay + ah / 2 + 0.5, Math.hypot(J.x - ax - aw / 2, J.y - ay - ah / 2) > 0.5 ? 1 : 0); }
  } else if (j.id === 'cortacesped') {
    if (j.vulnerable()) { if (botApuntar(j.x, j.y, 1) < 2.2) botEmbestir(j.x, j.y); }
    else if (Math.hypot(J.x - 5.5, J.y - 54.5) > 0.4) botApuntar(5.5, 54.5, 1);
  } else if (j.id === 'draga') {
    if (Math.hypot(J.x - 12.5, J.y - 52.4) > 0.3) botApuntar(12.5, 52.4, 1);
    else { J.dir = 'd'; if (j.vulnerable()) { if (J.bolCD <= 0) PULSO.D = 0.15; else botEmbestir(12.5, 53.5); } }
  }
  return false;
}
function pasoBot(s, dt) {
  const B = BOTST, sub = B.sub;
  switch (s[0]) {
    case 'ir': return botIr(s[1], s[2]);
    case 'romper': {
      const d = s[1];
      sub.n = sub.n || 0; sub.esp = (sub.esp || 0) - dt;
      if (J.dash <= 0) { B.in.mx = DX[d] * 0.4; B.in.my = DY[d] * 0.4; }
      if (sub.n >= s[2]) return J.dash <= 0 && sub.esp <= -0.2;
      if (J.dashCD <= 0 && J.dash <= 0 && sub.esp <= 0) { B.in.mx = DX[d]; B.in.my = DY[d]; PULSO.B = 0.15; sub.n++; sub.esp = 0.5; }
      return false;
    }
    case 'mantener': B.in.mx = DX[s[1]]; B.in.my = DY[s[1]]; return B.t >= s[2];
    case 'empujar': { B.in.mx = DX[s[1]]; B.in.my = DY[s[1]]; const e = N.ocupa.get(s[2] + ',' + s[3]); return !!(e && e.tipo === 'empujable' && !e.mov) || N.tile(s[2], s[3]) === '='; }
    case 'pelear': {
      const en = N.ents.filter(e => e.tipo === 'enemigo' && !e.muerto);
      if (!en.length) return B.t > 0.6;
      if (B.t > s[1]) return true;
      let e = en[0], md = 1e9;
      for (const o of en) { const d = Math.hypot(o.x - J.x, o.y - J.y); if (d < md) { md = d; e = o; } }
      const ty = e.y + (e.vuela ? 0.4 : 0);
      if (botApuntar(e.x, ty, 1) < 1.6) botEmbestir(e.x, ty);
      return false;
    }
    case 'esperarFlag': return N.flag(s[1]);
    case 'silbar': if (!sub.ok) { PULSO.C = 0.15; sub.ok = 1; } return B.t > 0.4;
    case 'tirar': if (!sub.ok) { PULSO.D = 0.15; sub.ok = 1; } return B.t > 0.3;
    case 'accion': if (!sub.ok) { PULSO.A = 0.15; sub.ok = 1; } return B.t > 0.3 && !guionActivo() && !DLG;
    case 'mirar': J.dir = s[1]; return true;
    case 'esperar': return B.t >= s[1];
    case 'hablar': return botHablar(s[1]);
    case 'cazar': { const e = N.ent(s[1]); if (!e || N.flag('llave')) return true; botApuntar(e.x, e.y, 1); return false; }
    case 'jefe': return botJefe();
  }
  return true;
}
function botPaso(dt) {
  const B = BOTST;
  B.in.mx = 0; B.in.my = 0;
  MODO_DIOS = true;
  if (TELON.fase || ESCENA === 'titulo' || ESCENA === 'fin') return;
  if (ESCENA === 'laminas') { B.t += dt; if (B.t > 0.45) { B.t = 0; avanzarLamina(); } return; }
  if (ESCENA === 'tarjeta') { if (TARJ && TARJ.t > 0.9) salirTarjeta(); return; }
  if (!N) return;
  if (PANEL) { PANEL = null; return; }
  if (DLG || BAN || guionActivo()) B.sub.vio = true;
  if (DLG) { B.td += dt; if (B.td > 0.15) { B.td = 0; avanzarDialogo(); if (DLG) avanzarDialogo(); } return; }
  if (BAN) { if (BAN.t > 0.7) cerrarBanner(); return; }
  if (guionActivo() || J.desmayo > 0) return;
  if (B.nivel !== N.id) { B.nivel = N.id; B.paso = 0; B.t = 0; B.sub = {}; B.camino = null; B.chk = null; B.atasco = 0; }
  const R = RUTAS[N.id];
  if (B.paso >= R.length) return;
  const s = R[B.paso];
  B.t += dt;
  let listo = false;
  try { listo = pasoBot(s, dt); } catch (e) { ERRORES.push('bot: ' + (e && e.stack || e)); listo = true; }
  const max = { ir: 45, romper: 5, empujar: 8, mantener: (s[2] || 0) + 1, pelear: (s[1] || 0) + 1, esperarFlag: 20, hablar: 25, accion: 6, esperar: (s[1] || 0) + 1, cazar: 40, jefe: 300 }[s[0]] || 4;
  if (listo || B.t > max) {
    B.log.push(listo ? [N.id, B.paso, s[0], +B.t.toFixed(1)] : [N.id, B.paso, s[0], 'TIEMPO', +B.t.toFixed(1), +J.x.toFixed(1), +J.y.toFixed(1)]);
    B.paso++; B.t = 0; B.sub = {}; B.camino = null; B.chk = null; B.atasco = 0;
  }
}

// ---------- arranque ----------
function cargar() {
  OP = Object.assign(opDefecto(), Guardado.leer('opciones', {}));
  if (!OP.pos || !OP.pos.v || !OP.pos.h) OP.pos = { v: {}, h: {} };
  OP.tam = OP.tam || {}; OP.opac = OP.opac || {};
  VIBRAR = OP.vibrar;
  Sonido.vMus = OP.musica; Sonido.vEf = OP.sonido;
  IDIOMA = idiomaInicial(Guardado.leer('idioma', null));
  document.documentElement.lang = IDIOMA; document.documentElement.dir = esRTL() ? 'rtl' : 'ltr';
  ALBUM = Guardado.leer('album', {}) || {};
  const d = Guardado.leer('datos', null);
  G = Object.assign(nuevoG(), d || {});
  HAY_PARTIDA = !!d;
  try { TACTIL = matchMedia('(pointer: coarse)').matches; } catch (e) { }
}
async function iniciar() {
  lz = document.getElementById('lienzo');
  cargar();
  try { await Promise.race([Promise.all([document.fonts.load('700 20px Fredoka'), document.fonts.load('500 20px Fredoka')]), new Promise(r => setTimeout(r, 1500))]); } catch (e) { }
  redimensionar(); PEND_RES = false;
  prepararEntrada();
  const c = document.getElementById('carga');
  if (c) c.remove();
  Sonido.musica(0);
  if (PARAM.has('portada')) portada();
  requestAnimationFrame(cuadro);
}

window.__juego = {
  get G() { return G; }, get N() { return N; }, get J() { return J; }, get escena() { return ESCENA; }, get panel() { return PANEL && PANEL.tipo; },
  get errores() { return ERRORES; }, get fuera() { return FUERA; }, get zonas() { return ZONAS_PREV.map(z => [z.x, z.y, z.w, z.h]); },
  get W() { return W; }, get H() { return H; }, get K() { return K; }, get vista() { return VISTA; }, get bandeja() { return BANDEJA; },
  get bot() { return BOT; }, set bot(v) { BOT = !!v; MODO_DIOS = !!v; }, set botIdx(v) { BOTST.nivel = N && N.id; BOTST.paso = v; BOTST.t = 0; BOTST.sub = {}; }, get botLog() { return BOTST.log; }, get dlg() { return DLG && { quien: DLG.quien, texto: DLG.texto }; },
  set turbo(v) { TURBO = v; }, set congelado(v) { CONGELADO = !!v; }, set tactil(v) { TACTIL = !!v; }, get tactil() { return TACTIL; },
  paso(dt, dib) { actualizar(dt || PASO); if (dib !== false) dibujar(); },
  simular(seg) { for (let s = seg; s > 0; s -= PASO) actualizar(PASO); },
  dibujar() { dibujar(); },
  nueva() { nuevaPartida(); }, seguir() { continuarPartida(); },
  capitulo(n, pos) { G = nuevoG(); G.cap = n; G.nivel = 'c' + n; if (n > 1) G.items.silbato = 1; if (n > 2) G.items.boleadoras = 1; ESCENA = 'juego'; PANEL = null; entrarNivel(G.nivel, pos); },
  ir(x, y) { J.x = x; J.y = y; CAM.x = x; CAM.y = y; limitarCam(); },
  idioma(c) { cambiarIdioma(c); }, abrir(t, d) { abrirPanel(t, d); }, cerrar() { PANEL = null; DLG = null; BAN = null; },
  decir(q, k) { abrirDialogo(q, tr(k)); DLG.t = 1; prepararDialogo(gp); DLG.n = DLG.total; },
  premio(tipo, id) { if (tipo === 'figu') bannerFigurita(id); else bannerDar(id); BAN.t = 2; },
  escenaA(e, d) { ESCENA = e; if (e === 'laminas') LAM = { lista: LAMINAS[d || 'prologo'], i: 0, t: 1, fin: () => { } }; if (e === 'tarjeta') TARJ = { cap: d || 1, t: 2 }; },
  lamina(i) { if (LAM) { LAM.i = i; LAM.t = 1; } },
  tr,
  async medirAudio(seg, o) {
    o = o || {};
    const off = new OfflineAudioContext(2, 44100 * seg, 44100);
    let falso = 0;
    const pr = new Proxy(off, { get(t, k) { if (k === 'currentTime') return falso; if (k === 'state') return 'running'; const v = t[k]; return typeof v === 'function' ? v.bind(t) : v; } });
    const viejo = Sonido.ctx, temaViejo = Sonido.tema;
    Sonido.ctx = pr; Sonido.ks = new Map(); Sonido.lluvia = null; Sonido.armar(); Sonido.volumen(OP.musica, OP.sonido); Sonido.tema = -1; Sonido.musica(o.tema != null ? o.tema : 0); Sonido.prox = 0.05; Sonido.sonando = true;
    const efs = ['embestida', 'golpe', 'arbusto', 'chapuzon', 'puzzle', 'silbato', 'boleadoras', 'item', 'figurita', 'herido', 'golpeJefe', 'explosion', 'impacto', 'trueno', 'boton', 'pagina'];
    let i = 0;
    for (falso = 0; falso < seg - 0.6; falso = Math.round((falso + 0.1) * 10) / 10) {
      if (o.tema == null && Math.abs(falso % 6) < 0.05 && falso > 0) Sonido.musica(Math.floor(falso / 6) % 5);
      if (o.efectos !== 'solo') Sonido.tic();
      Sonido.ult = {};
      const lista = o.lista || efs;
      if (o.uno) { if (Math.abs(falso - 0.2) < 0.05) Sonido[o.uno](); }
      else if (o.efectos !== false && lista.length && falso % 0.8 < 0.05) { Sonido[lista[i % lista.length]](); i++; }
      if (!o.uno && o.blips !== false && o.efectos !== false && falso % 0.3 < 0.05) Sonido.blip('tereso');
    }
    const b = await off.startRendering();
    Sonido.ctx = viejo; Sonido.ks = new Map(); Sonido.lluvia = null; Sonido.tema = -1; Sonido.musica(temaViejo < 0 ? 0 : temaViejo); Sonido.sonando = !!viejo;
    const L = b.getChannelData(0), R = b.getChannelData(1), n = b.length, rms = [];
    let pico = 0, dc = 0;
    for (let s = 0; s < seg; s++) { let a = 0; const i0 = s * 44100, i1 = Math.min(n, i0 + 44100); for (let k = i0; k < i1; k++) { const v = (L[k] + R[k]) / 2; a += v * v; } rms.push(+Math.sqrt(a / (i1 - i0)).toFixed(3)); }
    for (let k = 0; k < n; k++) { pico = Math.max(pico, Math.abs(L[k]), Math.abs(R[k])); dc += L[k]; }
    return { rms, picoDb: +(20 * Math.log10(pico)).toFixed(1), dc: +(dc / n).toFixed(5) };
  },
  estado() { return { escena: ESCENA, nivel: G.nivel, cap: G.cap, hp: J.hp, hpMax: J.hpMax, figus: nFigus(), objetivo: G.objetivo, items: Object.keys(G.items), tiempo: Math.round(G.tiempo || 0), bot: BOTST.paso, fin: G.fin, x: +J.x.toFixed(2), y: +J.y.toFixed(2) }; },
};
iniciar().catch(e => { ERRORES.push(String(e && e.stack || e)); console.error(e); });
