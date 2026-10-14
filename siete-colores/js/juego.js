// SIETE COLORES — el juego: carga en tandas, escenas, entrada (dedos, mouse y teclado), cámaras, bucle y API de prueba
let G = null, OP = null, ESCENA = 'carga', T = 0, DT = 1 / 60, ACUM = 0, TURBO = 1, BOT = false, CONGELADO = false, HAY_PARTIDA = false, TACTIL = false;
let INTRO = null, MUS_INTRO = null, cvGL = null, cvUI = null, gu = null, PEND_RES = true, tGuardar = 0, ultimo = 0, DT_REAL = 1 / 60;
const PASO = 1 / 60;
const E = { punteros: new Map(), clics: [], teclas: new Set(), salto: false, accion: false };
const TECLA_B = { A: false, B: false };
const ERRORES = [];
const CARGA = { i: 0, listo: false };
const CAL = { nivel: 'media', t: 0, n: 0 };

function nuevoG() { return { v: 1, colores: [false, false, false, false, false, false, false], plumas: {}, ovillos: {}, chicos: {}, flags: {}, pos: null, tiempo: 0, fin: false, objetivo: null }; }
function opDefecto() { return { v: 1, calidad: 'auto', musica: 0.7, sonido: 0.8, vibrar: true, zurdo: false, palanca: 'flotante', pos: { v: {}, h: {} }, tam: {}, opac: {}, sens: 1, invertir: false }; }
function guardar() { if (!G || !HAY_PARTIDA) return; if (ESCENA === 'juego' && J.suelo && !CINE) G.pos = [J.x, J.y, J.z, J.yaw]; Guardado.escribir('datos', G); }
function guardarOp() { Guardado.escribir('opciones', OP); }
function aplicarCalidad() {
  const q = OP.calidad === 'auto' ? CAL.nivel : OP.calidad;
  if (R.calidad !== q || !R.cart) { R.ponerCalidad(q); if (CARGA.listo) R.subirCarteles(armarDecorado(q === 'baja' ? 0.45 : q === 'media' ? 0.8 : 1), 0); }
}
function rehacerZona(x, z) {
  const hechos = new Set();
  for (const [dx, dz] of [[-2, -2], [2, -2], [-2, 2], [2, 2], [0, 0]]) { const cx = Math.floor((x + dx) / CH), cz = Math.floor((z + dz) / CH), k = cx + ',' + cz; if (hechos.has(k) || cx < 0 || cz < 0 || cx >= NCX || cz >= NCZ) continue; hechos.add(k); R.subirTrozo(cx, cz, mallaTrozo(cx, cz)); }
}

// ---------- carga: el mundo se arma mientras corre la intro ----------
function pasoCarga() {
  if (CARGA.listo) return;
  const t0 = performance.now(), n = NCX * NCZ;
  while (performance.now() - t0 < 7 && CARGA.i < n) { const cx = CARGA.i % NCX, cz = Math.floor(CARGA.i / NCX); R.subirTrozo(cx, cz, mallaTrozo(cx, cz)); CARGA.i++; }
  if (CARGA.i >= n) {
    CARGA.listo = true;
    armarHistoria();
    aplicarCalidad();
    R.subirCarteles(armarDecorado(R.calidad === 'baja' ? 0.45 : R.calidad === 'media' ? 0.8 : 1), 0);
  }
}

// ---------- escenas ----------
function empezarIntro() {
  ESCENA = 'intro';
  INTRO = IntroJXS.crear({ W, H, presenta: PRESENTA[IDIOMA] || 'presenta', vibrar: p => vibrar(p), estilo: ESTILO_SIETE });
  MUS_INTRO = Sonido.ok() ? IntroJXS.jingle(Sonido.ctx, Sonido.master, ESTILO_SIETE) : null;
  Sonido.callar = true;
}
function saltarIntro() { if (!INTRO) return; INTRO.saltar(); if (INTRO.listo && MUS_INTRO) MUS_INTRO.cortar(); }
function elegirIdioma(cod) { cambiarIdioma(cod); irA('titulo', () => Sonido.musica(0)); }
function lugarInicio() { const [cx, cz] = SITIOS.casa; return [cx + 1.5, 11, cz + 5.5, 2.3]; }
function nuevaPartida() { G = nuevoG(); HAY_PARTIDA = true; Guardado.escribir('datos', G); irA('juego', arrancarPartida); }
function arrancarPartida() {
  ESCENA = 'juego'; CINE = null; DLG = null; ACT = null;
  armarHistoria();
  const p = lugarInicio(); J.colocar(p[0], p[1], p[2], p[3]); J.estam = J.estamMax;
  CAMJ.yaw = Math.PI * 0.75; CAMJ.pitch = -0.25; CAMJ.ox = J.x; CAMJ.oy = J.y + 1; CAMJ.oz = J.z; CAMJ.distAct = 5;
  Sonido.musica(1);
  decir([['abuela', 'p1'], ['killa', 'p2'], ['abuela', 'p3'], ['abuela', 'p4'], ['abuela', 'p5']], () => { G.flags.ini = 1; guardar(); ayuda('h_mover'); });
}
function continuarPartida() {
  irA('juego', () => {
    armarHistoria();
    const p = G.pos || lugarInicio(); J.colocar(p[0], p[1] + 0.01, p[2], p[3]);
    if (chocaCaja(J.x - J.r, J.y, J.z - J.r, J.x + J.r, J.y + J.alto, J.z + J.r)) J.y = sueloEn(J.x, J.z);
    CAMJ.yaw = Math.atan2(Math.sin(J.yaw), -Math.cos(J.yaw)); CAMJ.ox = J.x; CAMJ.oy = J.y + 1; CAMJ.oz = J.z;
    Sonido.musica(G.fin ? 3 : 1);
    if (!G.flags.ini) decir([['abuela', 'p1'], ['killa', 'p2'], ['abuela', 'p3'], ['abuela', 'p4'], ['abuela', 'p5']], () => { G.flags.ini = 1; guardar(); ayuda('h_mover'); });
  });
}
function terminarFinal() {
  CINE = null; G.fin = true; guardar();
  for (const e of ENT) if (e.fiesta && e.id !== 'pujllay') e.fiesta = true;
  ayudaObj(Object.keys(G.plumas).length < 10 ? 'o_plumas' : 'o_libre');
}

// ---------- entrada ----------
function aLog(e) { const r = cvUI.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; }
function teclasDir() { let x = 0, y = 0; if (E.teclas.has('l')) x -= 1; if (E.teclas.has('r')) x += 1; if (E.teclas.has('u')) y -= 1; if (E.teclas.has('dn')) y += 1; return [x, y]; }
function soltarTodo() { E.punteros.clear(); E.teclas.clear(); CTL.joy.act = false; CTL.joy.vx = CTL.joy.vy = 0; CTL.bot.A = CTL.bot.B = false; TECLA_B.A = TECLA_B.B = false; E.salto = E.accion = false; }
function enJuegoLibre() { return ESCENA === 'juego' && !PANEL && !DLG && !TELON.fase && !(CINE && CINE.tipo !== 'final'); }
const TECLAS = { ArrowLeft: 'l', a: 'l', ArrowRight: 'r', d: 'r', ArrowUp: 'u', w: 'u', ArrowDown: 'dn', s: 'dn' };
function apretarA() { if (DLG) { avanzarDialogo(); return; } E.salto = true; vibrar(8); }
function apretarB() { if (DLG) { avanzarDialogo(); return; } E.accion = true; vibrar(12); }
function prepararEntrada() {
  cvUI.addEventListener('pointerdown', e => {
    e.preventDefault();
    Sonido.iniciar(); Sonido.volumen(OP.musica, OP.sonido);
    if (e.pointerType === 'touch' || e.pointerType === 'pen') TACTIL = true;
    const p = aLog(e), z = zonaEn(ZONAS_PREV, p.x, p.y);
    const ptr = { id: e.pointerId, x: p.x, y: p.y, x0: p.x, y0: p.y, px: p.x, py: p.y, arr: false, rol: 'ui', zona: z };
    const ed = PANEL && PANEL.tipo === 'controles';
    if (ed && (!z || z.fn === null || (z.op && !z.op.drag && z.w >= W - 1))) {
      for (const id of ['A', 'B', 'joy']) { const [cx, cy] = posCtl(id); if (Math.hypot(p.x - cx, p.y - cy) < radioCtl(id) * 1.2) { ptr.rol = 'mover'; ptr.ctl = id; PANEL.sel = id; ptr.dx = cx - p.x; ptr.dy = cy - p.y; break; } }
    }
    if (ptr.rol === 'ui' && enJuegoLibre() && (!z || z.w >= W - 1)) {
      const id = TACTIL ? tocarControl(p.x, p.y) : null;
      if (id === 'joy') { if (!CTL.joy.act) { ptr.rol = 'joy'; CTL.joy.act = true; CTL.joy.id = e.pointerId; moverPalanca(p.x, p.y, true); } }
      else if (id) { ptr.rol = id; CTL.bot[id] = true; if (id === 'A') apretarA(); else apretarB(); }
      else ptr.rol = 'cam';
    }
    E.punteros.set(e.pointerId, ptr);
    if (ptr.rol === 'ui' && z && z.op.drag) { ptr.drag = z.op.drag; ptr.drag(p.x, p.y); }
    try { cvUI.setPointerCapture(e.pointerId); } catch (er) { }
  });
  cvUI.addEventListener('pointermove', e => {
    const ptr = E.punteros.get(e.pointerId);
    if (!ptr) return;
    const p = aLog(e);
    const dx = p.x - ptr.px, dy = p.y - ptr.py;
    ptr.px = p.x; ptr.py = p.y; ptr.x = p.x; ptr.y = p.y;
    if (!ptr.arr && Math.hypot(p.x - ptr.x0, p.y - ptr.y0) > 5) ptr.arr = true;
    if (ptr.rol === 'joy') moverPalanca(p.x, p.y, false);
    else if (ptr.rol === 'cam') girarCamara(dx * (TACTIL ? 1.3 : 1), dy * (TACTIL ? 1.3 : 1));
    else if (ptr.rol === 'mover') { const r = radioCtl(ptr.ctl), o = orient(); OP.pos[o] = OP.pos[o] || {}; OP.pos[o][ptr.ctl] = [clamp(p.x + ptr.dx, r + 2, W - r - 2) / W, clamp(p.y + ptr.dy, r + 2, H - r - 2) / H]; }
    else if (ptr.drag) ptr.drag(p.x, p.y);
  });
  const soltar = e => {
    const ptr = E.punteros.get(e.pointerId);
    if (!ptr) return;
    E.punteros.delete(e.pointerId);
    if (ptr.rol === 'joy') { CTL.joy.act = false; CTL.joy.vx = CTL.joy.vy = 0; CTL.joy.id = null; }
    else if (ptr.rol === 'A' || ptr.rol === 'B') CTL.bot[ptr.rol] = false;
    else if (ptr.rol === 'mover') guardarOp();
    if (e.type === 'pointercancel') return;
    if (ptr.rol === 'ui' && !ptr.arr && !ptr.drag) E.clics.push({ x: ptr.x, y: ptr.y, x0: ptr.x0, y0: ptr.y0 });
  };
  cvUI.addEventListener('pointerup', soltar);
  cvUI.addEventListener('pointercancel', soltar);
  cvUI.addEventListener('contextmenu', e => e.preventDefault());
  window.addEventListener('keydown', e => {
    Sonido.iniciar(); Sonido.volumen(OP.musica, OP.sonido);
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === 'Escape' || k === 'p') { if (!e.repeat) { if (PANEL) cerrarPanel(); else if (ESCENA === 'juego' && !DLG && !CINE) abrirPanel('pausa'); } e.preventDefault(); return; }
    if (ESCENA === 'intro') { saltarIntro(); return; }
    if (TECLAS[k]) { E.teclas.add(TECLAS[k]); e.preventDefault(); }
    if (k === ' ' || k === 'z' || k === 'j') { e.preventDefault(); TECLA_B.A = true; if (!e.repeat) apretarA(); }
    if (k === 'e' || k === 'Enter' || k === 'x' || k === 'k') { e.preventDefault(); TECLA_B.B = true; if (!e.repeat) { if (ESCENA === 'titulo' && !PANEL && k === 'Enter') (HAY_PARTIDA ? continuarPartida : nuevaPartida)(); else apretarB(); } }
  });
  window.addEventListener('keyup', e => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (TECLAS[k]) E.teclas.delete(TECLAS[k]);
    if (k === ' ' || k === 'z' || k === 'j') TECLA_B.A = false;
    if (k === 'e' || k === 'Enter' || k === 'x' || k === 'k') TECLA_B.B = false;
  });
  window.addEventListener('blur', soltarTodo);
  window.addEventListener('resize', () => { PEND_RES = true; });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { guardar(); Sonido.pausar(); soltarTodo(); if (ESCENA === 'juego' && !PANEL && !DLG && !CINE && !BOT) abrirPanel('pausa'); }
    else { Sonido.seguir(); ultimo = 0; }
  });
}

// ---------- pantalla ----------
function redimensionar() {
  DPR = window.devicePixelRatio || 1;
  const iw = window.innerWidth, ih = window.innerHeight, pw = iw * DPR, ph = ih * DPR;
  ESC = Math.max(1, Math.floor(Math.min(pw / 216, ph / 300)));
  W = clamp(Math.floor(pw / ESC), 160, 960); H = clamp(Math.floor(ph / ESC), 240, 960);
  RES = Math.min(ESC, 4);
  cvGL.width = W; cvGL.height = H; cvUI.width = W * RES; cvUI.height = H * RES;
  const cw = W * ESC / DPR, ch = H * ESC / DPR;
  for (const c of [cvGL, cvUI]) { c.style.width = cw + 'px'; c.style.height = ch + 'px'; c.style.left = Math.floor((iw - cw) / 2) + 'px'; c.style.top = Math.floor((ih - ch) / 2) + 'px'; }
  gu = cvUI.getContext('2d');
  R.tamano(W, H);
  R.cam.fovY = W > H ? 0.95 : 1.12;
  _sellos.clear(); _ctlS.clear();
  if (ESCENA === 'intro' && INTRO && !INTRO.listo) { const t = INTRO.t; INTRO = IntroJXS.crear({ W, H, presenta: PRESENTA[IDIOMA] || 'presenta', vibrar: p => vibrar(p), estilo: ESTILO_SIETE }); INTRO.t = t; }
}

// ---------- el paso de la partida (60 por segundo) ----------
function pasoJuego(dt) {
  if (!G || !CARGA.listo) return;
  G.tiempo += dt;
  let mx = 0, mz = 0, salta = false, sostiene = false, accion = false;
  if (CINE) pasoCine(CINE, dt);
  if (BOT && (DLG || CINE) && !PANEL) pasoBot(dt);
  if (enJuegoLibre() && !CINE) {
    let sx = 0, sy = 0;
    if (BOT) { const b = pasoBot(dt); mx = b.mx; mz = b.mz; salta = b.salta; sostiene = b.sostiene; accion = b.accion; }
    else {
      if (CTL.joy.act) { sx = CTL.joy.vx; sy = CTL.joy.vy; }
      const [kx, ky] = teclasDir();
      if (kx || ky) { const l = Math.hypot(kx, ky); sx = kx / l; sy = ky / l; }
      const c = Math.cos(CAMJ.yaw), s = Math.sin(CAMJ.yaw);
      mx = sx * c - sy * s; mz = sx * s + sy * c;
      salta = E.salto; sostiene = CTL.bot.A || TECLA_B.A; accion = E.accion;
    }
    pasoJugador(dt, mx, mz, salta, sostiene);
    if (accion) { const h = hablable(); if (h) hablarCon(h); }
    if (ACT) { if (ACT.tipo === 'vicuna') pasoVicuna(dt); else if (ACT.tipo === 'huancas') pasoHuancas(dt); else if (ACT.tipo === 'pujllay') pasoPujllay(dt); }
    revisarObjetos(dt);
    // el Pujllay aparece la primera vez que llegás a la plaza
    if (G.flags.ini && !G.flags.plaza && Math.hypot(J.x - SITIOS.plaza[0], J.z - SITIOS.plaza[1]) < 10) cinePujllayPlaza();
    if (G.flags.plaza && !G.flags.tHablar && !DLG) { G.flags.tHablar = 1; ayuda('h_hablar'); }
    if (!J.suelo && J.tAire > 0.9 && !G.flags.tPlanear && !DLG) { G.flags.tPlanear = 1; ayuda('h_planear'); }
    if (J.planea && !G.flags.tAletear && G.flags.tPlanear && J.tAire > 1.5) { G.flags.tAletear = 1; ayuda('h_aletear'); }
    // la vicuña vuelve a empezar si te fuiste lejos
    if (ACT && ACT.tipo === 'vicuna' && Math.hypot(J.x - 160, J.z - 32) > 60) ACT = null;
    if (ACT && ACT.tipo === 'huancas' && Math.hypot(J.x - SITIOS.pucara[0], J.z - SITIOS.pucara[1]) > 14) ACT = null;
  } else {
    J.vx = J.vz = 0; J.est = DLG && quienHabla() === 'killa' ? 'habla' : J.suelo ? 'quieto' : J.est;
    if (!J.suelo && !J.pared && !J.borde) { J.vy = Math.max(-30, J.vy - FIS.G * dt); moverEnt(J, 0, J.vy * dt, 0, false); J.suelo = J.vy <= 0 && pisaSuelo(J); if (J.suelo) J.vy = 0; }
  }
  E.salto = false; E.accion = false;
  pasoEntidades(dt, T);
  for (const h of HUANCAS) if (!ACT || ACT.tipo !== 'huancas') h.luz = Math.max(0, h.luz - dt);
  tGuardar += dt; if (tGuardar > 5) { tGuardar = 0; guardar(); }
}
function pasoCine(C, dt) {
  if (C.tipo === 'color') pasoCineColor(C, dt);
  else if (C.tipo === 'mirar') { C.t += dt; if (C.t >= C.dur) { CINE = null; if (C.fin) C.fin(); } }
  else if (C.tipo === 'final') {
    C.t += dt;
    if (Math.random() < 0.5) confeti(100, 22, 122, 3);
    if (Math.random() < 0.06) { const x = 100 + rnd(-10, 10), z = 122 + rnd(-10, 10); chispas(x, 30 + rnd(0, 8), z, COLORES[Math.floor(Math.random() * 7)], 30); Sonido.toque(); }
    if (Math.random() < 0.08) talco(100 + rnd(-8, 8), 12, 122 + rnd(-8, 8), 8);
  }
}

// ---------- cámaras ----------
const _cineCam = { x: 0, y: 0, z: 0, ok: false };
function mirarDesde(x, y, z, tx, ty, tz, k) {
  const c = R.cam;
  if (k < 1) { c.x = lerp(c.x, x, k); c.y = lerp(c.y, y, k); c.z = lerp(c.z, z, k); } else { c.x = x; c.y = y; c.z = z; }
  const dx = tx - c.x, dy = ty - c.y, dz = tz - c.z, hz = Math.hypot(dx, dz);
  const yaw = Math.atan2(dx, -dz), pitch = Math.atan2(dy, hz);
  c.yaw = k < 1 ? c.yaw + angDif(c.yaw, yaw) * k : yaw; c.pitch = k < 1 ? lerp(c.pitch, pitch, k) : pitch;
}
function camaraJuego(dt) {
  const ap = W > H;
  const C = CINE;
  if (C && C.tipo === 'color') {
    // mira al cerro mientras la ola lo pinta
    const [cx, cz] = SITIOS.cerro, a = Math.atan2(J.x - cx, J.z - cz), d = Math.max(30, Math.hypot(J.x - cx, J.z - cz));
    const px = cx + Math.sin(a) * (d + 10), pz = cz + Math.cos(a) * (d + 10);
    mirarDesde(px, Math.max(J.y + 6, sueloEn(px, pz) + 4), pz, C.gx != null && C.t < 1.6 ? C.gx : cx, C.t < 1.6 ? (C.gy || 40) : 38, C.t < 1.6 ? (C.gz || cz) : cz, Math.min(1, dt * 2.2));
    CAMJ.ox = J.x; CAMJ.oy = J.y + 1.15; CAMJ.oz = J.z;
    return;
  }
  if (C && C.tipo === 'mirar') { mirarDesde(J.x - Math.sin(Math.atan2(C.x - J.x, C.z - J.z)) * 6, J.y + 3, J.z - Math.cos(Math.atan2(C.x - J.x, C.z - J.z)) * 6, C.x, C.y, C.z, Math.min(1, dt * 2)); return; }
  if (C && C.tipo === 'final') {
    const a = C.t * 0.12 + 0.6, r = 16 - Math.min(6, C.t * 0.4);
    mirarDesde(100.5 + Math.sin(a) * r, 16 + Math.sin(C.t * 0.2) * 2, 122.5 + Math.cos(a) * r, 100.5, 13, 122.5, C.t < 0.1 ? 1 : Math.min(1, dt * 2));
    return;
  }
  if (DLG) {
    const q = quienHabla(), e = q && q !== 'killa' ? entDe(q) : DLG.lineas.map(l => l[0]).filter(x => x !== 'killa').map(entDe)[0];
    if (e && Math.hypot(e.x - J.x, e.z - J.z) < 16) {
      // por encima del hombro de Killa mirando a quien habla; si atrás no hay lugar, por encima del hombro del otro
      const dx = e.x - J.x, dz = e.z - J.z, d = Math.hypot(dx, dz) || 1, ux = dx / d, uz = dz / d;
      if (!DLG.cam) {
        let mejor = null;
        for (const [desde, hacia, signo] of [[J, e, 1], [e, J, -1]]) for (const lado of [1, -1]) {
          const bx = -ux * signo, bz = -uz * signo, px = -bz * lado, pz = bx * lado;
          const so = signo > 0 ? 1.3 : 1.9, vx = bx * 2.6 + px * so, vy = 0.75, vz = bz * 2.6 + pz * so, l = Math.hypot(vx, vy, vz);
          const libre = Math.min(l, rayo(desde.x, desde.y + 1.3, desde.z, vx / l, vy / l, vz / l, l + 0.4) - 0.35);
          const puntos = libre + (signo > 0 ? 1.2 : 0) + ((R.cam.x - desde.x) * px + (R.cam.z - desde.z) * pz > 0 ? 0.3 : 0);
          if (!mejor || puntos > mejor.puntos) mejor = { desde, hacia, vx: vx / l, vy: vy / l, vz: vz / l, libre, puntos };
        }
        DLG.cam = mejor;
      }
      const o = DLG.cam, dd = Math.max(0.9, o.libre);
      mirarDesde(o.desde.x + o.vx * dd, o.desde.y + 1.3 + o.vy * dd, o.desde.z + o.vz * dd, o.hacia.x, o.hacia.y + 1.0, o.hacia.z, Math.min(1, dt * 3));
      return;
    }
  }
  camaraJugador(dt, ap);
}
function camaraTitulo(t) {
  // desde el sur del pueblo, mirando el cerro; se corre despacio de un lado al otro
  const a = Math.sin(t * 0.06) * 0.8, x = 100 + Math.sin(a) * 30, z = 168 - Math.abs(Math.sin(a)) * 6;
  mirarDesde(x, 27 + Math.sin(t * 0.09) * 2, z, 100 + Math.sin(a) * 6, 31, 70, 1);
}
// ---------- el bucle ----------
function cuadro(ts) {
  requestAnimationFrame(cuadro);
  try {
    if (GL.perdido) { mostrarAviso('perdido'); return; }
    if (PEND_RES) { PEND_RES = false; redimensionar(); }
    const real = ultimo ? Math.max(0, (ts - ultimo) / 1000) : 1 / 60;
    ultimo = ts; DT_REAL = real;
    const dt = Math.min(0.05, real);
    DT = dt;
    pasoCarga();
    if (!CONGELADO) actualizar(dt);
    dibujar();
    // calidad automática: 60 cuadros de tiempo real; si pasa de 30 ms, un escalón abajo
    if (OP.calidad === 'auto' && !PRUEBA && ESCENA === 'juego' && real < 0.5) {
      CAL.t += real; CAL.n++;
      if (CAL.n >= 60) { const m = CAL.t / CAL.n * 1000; if (m > 30 && CAL.nivel !== 'baja') { CAL.nivel = CAL.nivel === 'alta' ? 'media' : 'baja'; aplicarCalidad(); } CAL.t = 0; CAL.n = 0; }
    }
  } catch (e) { registrarError(e); }
}
function registrarError(e) { const s = String(e && e.stack || e); if (ERRORES.length < 20) ERRORES.push(s); console.error(e); }
function actualizar(dt) {
  T += dt;
  if (TELON.fase === 1) { TELON.t += dt / 0.35; if (TELON.t >= 1) { TELON.t = 1; TELON.fase = 2; const f = TELON.alMedio; TELON.alMedio = null; if (f) f(); } }
  else if (TELON.fase === 2) { TELON.t -= dt / 0.35; if (TELON.t <= 0) { TELON.t = 0; TELON.fase = 0; } }
  if (ESCENA === 'intro') {
    INTRO.pasar(dt);
    if (INTRO.listo && !TELON.fase) { Sonido.callar = false; irA('idioma'); }
    return;
  }
  if (ESCENA === 'juego' && !PANEL) {
    ACUM += dt * TURBO;
    let n = 0;
    while (ACUM >= PASO && n < 8 * TURBO) { pasoJuego(PASO); ACUM -= PASO; n++; }
    pasoParticulas(dt);
  } else if (CARGA.listo && G) { pasoEntidades(dt, T); pasoParticulas(dt); }
  Sonido.tic(); if (ESCENA === 'juego') Sonido.ambiente(dt);
}
function munecosVisibles() {
  const L = [];
  if (ESCENA === 'juego') {
    const m = J.mun;
    m.x = J.x; m.y = J.y + J.yVis; m.z = J.z; m.yaw = J.yaw;
    animarPersona(m, J.est, T, J.est === 'trepa' ? J.vel : Math.min(1.3, J.vel / 4), DT);
    // si la cámara quedó pegada, Killa no tapa la vista
    if (Math.hypot(R.cam.x - J.x, R.cam.y - J.y - 0.9, R.cam.z - J.z) > 1.35 || CINE || DLG) { posarMuneco(m); L.push(m); }
  }
  const c = R.cam;
  for (const e of ENT) {
    if (!e.vis) continue;
    const d = Math.hypot(e.x - c.x, e.z - c.z);
    if (d > 85) continue;
    posarMuneco(e.mun); L.push(e.mun);
  }
  // las huancas y la piedrita
  if (FIGURAS.huanca && Math.hypot(SITIOS.pucara[0] - c.x, SITIOS.pucara[1] - c.z) < 80) {
    for (const h of HUANCAS) { const m = h.mun || (h.mun = nuevoMuneco('huanca', h.x, h.y, h.z, 0)); m.y = h.y + h.luz * 0.06; m.brillo = h.luz * 1.6; posarMuneco(m); L.push(m); }
    const tb = _tablilla || (_tablilla = nuevoMuneco('tablilla', SITIOS.pucara[0] + 2.5, 29, SITIOS.pucara[1] - 2.5, 0.5)); posarMuneco(tb); L.push(tb);
  }
  return L;
}
let _tablilla = null;
function dibujar() {
  const g = gu;
  ZONAS = [];
  g.setTransform(RES, 0, 0, RES, 0, 0); g.imageSmoothingEnabled = false;
  g.clearRect(0, 0, W, H);
  if (ESCENA === 'intro' || ESCENA === 'carga') {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.clearColor(0.08, 0.03, 0.11, 1); gl.clear(gl.COLOR_BUFFER_BIT);
    if (INTRO) { INTRO.dibujar(g); zona(0, 0, W, H, saltarIntro); }
    dibujarTelon(g); resolverClics(); ZONAS_PREV = ZONAS;
    return;
  }
  if (CARGA.listo && G && ESCENA !== 'portada') {
    if (ESCENA === 'juego') camaraJuego(DT); else camaraTitulo(T);
    R.subirCarteles(cartelesDinamicos(T), 1);
    R.fundido = 0;
    R.dibujar(T, munecosVisibles(), PTOS, ESCENA === 'juego' ? [J.x, J.y + 0.7, J.z] : null);
  } else { gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.clearColor(0.08, 0.03, 0.11, 1); gl.clear(gl.COLOR_BUFFER_BIT); }
  if (ESCENA === 'portada') { dibujarPortada(g); resolverClics(); ZONAS_PREV = ZONAS; return; }
  if (ESCENA === 'idioma') escenaIdioma(g);
  else if (ESCENA === 'titulo') { if (CARGA.listo) escenaTitulo(g); else txt(g, tr('cargando'), W / 2, H / 2, { al: 0.5, c: '#fff4e0', b: TINTA }); }
  else if (ESCENA === 'juego') {
    if (CINE && CINE.tipo === 'final') dibujarFinal(g, CINE);
    else if (!CINE || CINE.tipo !== 'color') { hud(g); dibujarControles(g); }
    if (DLG) dibujarDialogo(g);
    if (!TACTIL && !DLG && !CINE && OBJT.t < 7 && G.tiempo < 40) txt(g, tr('teclas'), W / 2, H - 10, { al: 0.5, c: '#fff4e0', b: TINTA, f: 'mini', max: W - 8 });
  }
  if (PANEL) dibujarPanel(g);
  dibujarTelon(g);
  if (ERRORES.length && PRUEBA) txt(g, 'ERR ' + ERRORES.length, 2, H - 8, { f: 'mini', c: '#ff5050' });
  resolverClics();
  ZONAS_PREV = ZONAS;
}
function mostrarAviso(tipo) {
  const c = document.getElementById('carga');
  if (!c) return;
  c.style.display = 'flex';
  c.innerHTML = tipo === 'sinGL' ? '<div style="font:16px sans-serif;padding:20px;text-align:center">Este juego necesita WebGL 2.<br>Probá con Chrome o Safari actualizados.</div>' : '<div style="font:16px sans-serif;padding:20px;text-align:center">Se perdió la placa de video.<br>Tocá para recargar.</div>';
  c.onclick = () => location.reload();
}

// ---------- arranque ----------
function iniciar() {
  cvGL = document.getElementById('gl'); cvUI = document.getElementById('ui');
  if (!GL.iniciar(cvGL)) { mostrarAviso('sinGL'); return; }
  OP = Object.assign(opDefecto(), Guardado.leer('opciones', {}));
  VIBRAR = OP.vibrar;
  TACTIL = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  CAL.nivel = PARAM.get('cal') || (TACTIL ? 'media' : 'alta');
  IDIOMA = idiomaInicial(PARAM.get('idioma') || Guardado.leer('idioma', null));
  cambiarIdioma(IDIOMA);
  const datos = Guardado.leer('datos', null);
  if (datos && datos.v === 1 && Array.isArray(datos.colores)) { G = Object.assign(nuevoG(), datos); HAY_PARTIDA = true; } else G = nuevoG();
  R.iniciar(); R.ponerCalidad(CAL.nivel);
  armarFiguras();
  registrarFigura('huanca', [{ nombre: 'raiz', padre: -1, piv: [0, 0, 0], cajas: [{ c: [0, 0.06, 0], t: [1.0, 0.16, 1.0], col: '#8a8078' }, { c: [0, 0.15, 0], t: [0.5, 0.04, 0.5], col: '#d8c8a0' }] }]);
  registrarFigura('tablilla', [{ nombre: 'raiz', padre: -1, piv: [0, 0, 0], cajas: [{ c: [0, 0.3, 0], t: [0.7, 0.6, 0.5], col: '#7a6c62' }, { c: [0, 0.61, 0], t: [0.5, 0.03, 0.34], col: '#f0c84a' }] }]);
  J.mun = nuevoMuneco('killa', 0, 0, 0, 0);
  const t0 = performance.now(); generarMundo(); window.__tiempos = { mundo: Math.round(performance.now() - t0) };
  redimensionar();
  prepararEntrada();
  document.getElementById('carga').style.display = 'none';
  if (PARAM.has('portada')) { while (!CARGA.listo) pasoCarga(); armarPortada(); }
  else if (PRUEBA && !PARAM.has('intro')) { while (!CARGA.listo) pasoCarga(); ESCENA = PARAM.get('escena') || 'titulo'; }
  else empezarIntro();
  requestAnimationFrame(cuadro);
}

// ---------- portada 9:16: el cerro con sus colores y Killa planeando, el título en la letra del juego ----------
function armarPortada() {
  ESCENA = 'portada';
  G = nuevoG(); G.colores = G.colores.map(() => true); armarHistoria(); diaSegun(5);
  J.colocar(105.2, 36.6, 143.6, Math.atan2(106 - 105.2, 150 - 143.6) + 0.6); J.est = 'planea'; J.planea = true;
  const pj = entDe('pujllay'); pj.vis = true; pj.x = 100.5; pj.z = 56.5; pj.y = sueloEn(100, 56, 62); pj.est = 'festeja';
  for (let k = 0; k < 220; k++) part(rnd(94, 114), rnd(30, 46), rnd(118, 146), 0, 0, 0, 999, 1.2, COLORES[k % 7], 0, 0, 1);
}
function dibujarPortada(g) {
  mirarDesde(106, 38.5, 150, 99, 31, 66, 1);
  const m = J.mun; m.x = J.x; m.y = J.y; m.z = J.z; m.yaw = J.yaw; animarPersona(m, 'planea', 0.3, 1, 0); posarMuneco(m);
  const L = [m];
  for (const e of ENT) if (e.vis && Math.hypot(e.x - 100, e.z - 100) < 90) { posarMuneco(e.mun); L.push(e.mun); }
  R.subirCarteles(cartelesDinamicos(4), 1);
  pasoParticulas(0);
  R.dibujar(4, L, PTOS, [J.x, J.y, J.z]);
  const yT = Math.round(H * 0.14);
  const ht = letrasTitulo(g, yT, 0);
  parrafo(g, tr('subtitulo'), W / 2, yT + ht + 6, W - 30, { al: 0.5, c: '#fff4e0', b: TINTA });
  txt(g, 'JXSTUDIOS', W / 2, Math.round(H * 0.84), { al: 0.5, c: '#fff4e0', b: TINTA, t: 1 });
}

// ---------- API de prueba ----------
window.__juego = {
  get G() { return G; }, get J() { return J; }, get escena() { return ESCENA; }, get errores() { return ERRORES; }, get fuera() { return FUERA; }, get stats() { return R.stats; },
  get dlg() { return DLG && { quien: quienHabla(), k: DLG.lineas[DLG.i][1] }; }, get cine() { return CINE && CINE.tipo; }, get act() { return ACT && { tipo: ACT.tipo, toques: ACT.toques }; },
  get intro() { return INTRO && { t: INTRO.t, listo: INTRO.listo }; }, get carga() { return CARGA.listo; }, get tiempos() { return window.__tiempos; }, get panel() { return PANEL && PANEL.tipo; },
  set congelado(v) { CONGELADO = !!v; }, set turbo(v) { TURBO = v; }, set bot(v) { BOT = !!v; if (BOT) iniciarBot(); }, get bot() { return BOT; }, get botInfo() { return typeof BOTI !== 'undefined' ? BOTI.info() : null; },
  escenaA(e) { ESCENA = e; if (e === 'intro') empezarIntro(); },
  nueva(sinPrologo) { G = nuevoG(); HAY_PARTIDA = true; arrancarPartida(); if (sinPrologo) { DLG = null; G.flags.ini = 1; } },
  ir(x, y, z, yaw) { J.colocar(x, y == null ? sueloEn(x, z) : y, z, yaw || 0); CAMJ.ox = J.x; CAMJ.oy = J.y + 1; CAMJ.oz = J.z; CAMJ.distAct = 7; },
  cam(yaw, pitch) { CAMJ.yaw = yaw; CAMJ.pitch = pitch; CAMJ.tArr = 0; },
  paso(n, dib) { for (let i = 0; i < (n || 1); i++) actualizar(PASO); if (dib !== false) dibujar(); },
  dibujar() { dibujar(); }, avanzar() { avanzarDialogo(); }, cerrar() { PANEL = null; DLG = null; },
  color(i) { G.colores[i] = true; R.sat[i + 1] = 1; diaSegun(); }, colores(n) { for (let i = 0; i < 7; i++) { G.colores[i] = i < n; R.sat[i + 1] = i < n ? 1 : 0; } diaSegun(); },
  hablar(id) { const e = entDe(id); if (e) hablarCon(e); }, idioma(c) { cambiarIdioma(c); }, calidad(c) { OP.calidad = c; aplicarCalidad(); }, abrir(p, d) { abrirPanel(p, d); },
  traza(n, cada) { const L = []; for (let i = 0; i < n; i++) { actualizar(PASO); if (i % (cada || 6) === 0) L.push([+J.x.toFixed(2), +J.y.toFixed(2), +J.z.toFixed(2), J.est, +J.estam.toFixed(2), J.pared ? 'P' : '', J.borde ? 'B' : '', J.suelo ? 's' : '']); } return L; },
  botPaso(nom) { const i = BOTI.pasos.findIndex(p => p.n === nom); if (i >= 0) { BOTI.i = i; BOTI.ruta = null; } return i; },
  ruta() { return BOTI.ruta && BOTI.ruta.slice(BOTI.k).map(n => n.tipo + '@' + n.x + ',' + n.y + ',' + n.z); },
  get zonasPrev() { return ZONAS_PREV.map(z => [Math.round(z.x), Math.round(z.y), Math.round(z.w), Math.round(z.h)]); },
  probarTextos() {
    const g = gu; g.setTransform(RES, 0, 0, RES, 0, 0); FUERA.length = 0;
    const objs = ['o_abuela', 'o_buscar', 'o_m0', 'o_m1', 'o_m2', 'o_m3', 'o_m4', 'o_m5', 'o_volverArriero', 'o_volverTomas', 'o_vicuna', 'o_cumbre', 'o_atrapar', 'o_plumas', 'o_libre'];
    for (const k of objs) { const lin = partir(g, tr(k), W - 54); if (lin.length > 2) FUERA.push('3 renglones: ' + k); for (const l of lin) txt(g, l, 0, -50, { max: W - 53 }); }
    for (const [k, a, b] of [['toast_pluma', 10], ['toast_ovillo', 3], ...NOMBRE_COLOR.map(n => ['toast_color', tr('col_' + n), 7])]) { const s = tr(k, a, b), w = Math.min(W - 16, anchoTxt(g, s) + 20); txt(g, s, 0, -50, { max: w - 8 }); }
    for (const k of ['ay', 'j_ay1', 'j_ay2', 'vic_1', 'vic_2']) txt(g, tr(k), 0, -50, {});
    return FUERA.slice();
  },
  nivel() { if (!Sonido.anal) return null; const d = new Float32Array(2048); Sonido.anal.getFloatTimeDomainData(d); let p = 0, r = 0; for (const v of d) { p = Math.max(p, Math.abs(v)); r += v * v; } return { estado: Sonido.ctx.state, pico: +p.toFixed(3), rms: +Math.sqrt(r / d.length).toFixed(4), tema: Sonido.tema }; },
  get camInfo() { return [+R.cam.x.toFixed(1), +R.cam.y.toFixed(1), +R.cam.z.toFixed(1), +R.cam.yaw.toFixed(2), +R.cam.pitch.toFixed(2), +CAMJ.distAct.toFixed(2), +(CAMJ.extra || 0).toFixed(2)]; },
  estado() { return { escena: ESCENA, x: +J.x.toFixed(2), y: +J.y.toFixed(2), z: +J.z.toFixed(2), est: J.est, colores: G.colores.map(Number).join(''), plumas: Object.keys(G.plumas).length, ovillos: Object.keys(G.ovillos).length, chicos: Object.keys(G.chicos).length, flags: Object.keys(G.flags).join(','), fin: G.fin, tiempo: Math.round(G.tiempo), obj: objetivoActual(), dlg: DLG ? DLG.lineas[DLG.i][1] : null, cine: CINE && CINE.tipo, act: ACT && ACT.tipo }; },
};
iniciar();
