// POTRERO — el juego: escenas (intro, idioma, título con un picado de fondo, historia, historieta, partido,
// resultado, picado, penales, desafío del día, créditos), entrada (dedos, mouse, teclado), bucle y API de prueba.
let OP = null, ESCENA = 'carga', T = 0, DT = 1 / 60, ACUM = 0, TURBO = 1, BOT = false, CONGELADO = false, TACTIL = false;
let INTRO = null, MUS_INTRO = null, cvGL = null, cvUI = null, gu = null, PEND_RES = true, ultimo = 0, FIG_PELOTA = null, RES = null, DEMO = null;
const PASO = 1 / 60;
const E = { punteros: new Map(), clics: [], teclas: new Set() };
const ERRORES = [];
const CAL = { nivel: 'media', t: 0, n: 0 };
const BOTONES = { A: { abajo: false, downs: 0, ups: 0, t0: 0, dur: 0 }, B: { abajo: false, downs: 0, ups: 0, t0: 0, dur: 0 }, C: { abajo: false, downs: 0, ups: 0, t0: 0, dur: 0 }, D: { abajo: false, downs: 0, ups: 0, t0: 0, dur: 0 } };
const VISTOS = { A: [0, 0], B: [0, 0], C: [0, 0], D: [0, 0] };
let ENTRADA = { dx: 0, dz: 0, A: {}, B: {}, C: false, C_toque: false, D: false };
let RELOJ = 0;
function opDefecto() { return { v: 1, calidad: 'auto', musica: 0.7, sonido: 0.85, vibrar: true, zurdo: false, palanca: 'flotante', pos: { v: {}, h: {} }, tam: {}, opac: {}, cambioAuto: true }; }
function guardarOp() { Guardado.escribir('opciones', OP); }
function aplicarCalidad() { const q = OP.calidad === 'auto' ? CAL.nivel : OP.calidad; if (R.calidad !== q) R.ponerCalidad(q); }
function apretar(id) { const b = BOTONES[id]; if (!b.abajo) { b.abajo = true; b.downs++; b.t0 = RELOJ; } }
function soltarB(id) { const b = BOTONES[id]; if (b.abajo) { b.abajo = false; b.ups++; b.dur = RELOJ - b.t0; } }
// lo que el partido lee en cada paso: palito en el mundo y bordes de los botones
function leerEntrada() {
  let sx = 0, sy = 0;
  if (CTL.joy.act) { sx = CTL.joy.vx; sy = CTL.joy.vy; }
  let kx = 0, ky = 0; if (E.teclas.has('l')) kx -= 1; if (E.teclas.has('r')) kx += 1; if (E.teclas.has('u')) ky -= 1; if (E.teclas.has('dn')) ky += 1;
  if (kx || ky) { const l = Math.hypot(kx, ky); sx = kx / l; sy = ky / l; }
  // pantalla → cancha según la cámara
  const c = R.cam, fx = c.tx - c.x, fz = c.tz - c.z, l = Math.hypot(fx, fz) || 1, Fx = fx / l, Fz = fz / l, Rx = -Fz, Rz = Fx;
  const dx = sx * Rx - sy * Fx, dz = sx * Rz - sy * Fz;
  const o = { dx, dz };
  for (const id of ['A', 'B', 'C', 'D']) {
    const b = BOTONES[id], v = VISTOS[id], ap = b.downs > v[0], su = b.ups > v[1];
    v[0] = b.downs; v[1] = b.ups;
    o[id] = { abajo: b.abajo, ap, suelta: su, t: b.abajo ? RELOJ - b.t0 : b.dur };
  }
  o.C_toque = o.C.suelta && o.C.t < 0.22; o.C = o.C.abajo && RELOJ - BOTONES.C.t0 > 0.15; o.D = o.D.ap;
  ENTRADA = o;
  return o;
}
// ---------- escenas ----------
function empezarIntro() {
  ESCENA = 'intro';
  INTRO = IntroJXS.crear({ W, H, presenta: PRESENTA[IDIOMA] || 'presenta', vibrar: p => vibrar(p), estilo: ESTILO_POTRERO });
  MUS_INTRO = Sonido.ok() ? IntroJXS.jingle(Sonido.ctx, Sonido.master, ESTILO_POTRERO) : null;
  Sonido.callar = true;
}
function saltarIntro() { if (!INTRO) return; INTRO.saltar(); if (INTRO.listo && MUS_INTRO) MUS_INTRO.cortar(); }
function elegirIdioma(cod) { cambiarIdioma(cod); irA('titulo', () => Sonido.musica(0)); }
// el picado de fondo del título (la IA juega sola)
function empezarDemo() {
  BOT_TODO = true;
  nuevoPartido({ eq: ['loma', 'gatos'], cancha: 'potrero', dur: 99999, modo: 'demo', semilla: 3, demo: true });
  P.fase = 'juego'; P.esperaSaque = 0; DEMO = P;
}
function salirDemo() { BOT_TODO = BOT; DEMO = null; }
function irMenu(esc) { irA(esc || 'titulo', () => { if (!DEMO) empezarDemo(); Sonido.musica(0); }); }
function mostrarResultado(r, seguir) { RES = { r, seguir, t: 0 }; irA('resultado', () => { Sonido.musica(-1); if (r.gana === 0 || (r.penalesRacha != null && r.penalesRacha > 0)) Sonido.victoria(); else if (r.gana === 1) Sonido.derrota(); }); }
function mostrarCreditos() { CRED = { t: 0 }; irA('creditos', () => Sonido.musica(0)); }
let CRED = null;
function jugarPicado(cfgP) {
  salirDemo();
  irA('partido', () => empezarPartido({ eq: [cfgP.yo, cfgP.rival], cancha: cfgP.cancha, dur: cfgP.dur, modo: 'picado', penales: false, especialRival: cfgP.rival !== 'gatos' && cfgP.rival !== 'puerto' && cfgP.rival !== 'pumas', dificultad: cfgP.dif, semilla: (Math.random() * 1e6) | 0, alTerminar: r => { PROG.picados++; PROG.golesTotal += r.goles[0]; guardarProg(); mostrarResultado(r, () => irMenu('picado')); } }));
}
function jugarPenales(cfgP) {
  salirDemo();
  irA('partido', () => {
    empezarPartido({ eq: [cfgP.yo, cfgP.rival], cancha: cfgP.cancha, dur: 60, modo: 'penales', semilla: (Math.random() * 1e6) | 0, alTerminar: r => { const nuevo = r.penalesRacha > PROG.mejorRacha; if (nuevo) PROG.mejorRacha = r.penalesRacha; guardarProg(); r.nuevoRecord = nuevo; mostrarResultado(r, () => irMenu('penalesMenu')); } });
    P.fase = 'penales'; empezarPenales(true);
  });
}
function jugarDesafio() {
  const D = desafioDeHoy();
  salirDemo();
  irA('partido', () => {
    empezarPartido({ eq: ['loma', D.rival], cancha: D.cancha, dur: 150, modo: 'desafio', penales: false, especialRival: true, dificultad: 1, semilla: D.semilla, titulo: 'desafio', alTerminar: r => {
      r.cabezazos = P.stats.golesCabeza || 0; r.golesEspecial = P.stats.golesEsp || 0;
      const ok = D.plantilla.cumple(r); r.desafio = ok;
      if (ok && !PROG.desafios[D.dia]) { PROG.desafios[D.dia] = 1; PROG.rachaDesafio++; }
      guardarProg(); mostrarResultado(r, () => irMenu('desafio'));
    } });
    if (D.plantilla.inicio) P.goles = D.plantilla.inicio.slice();
  });
}
// ---------- entrada ----------
function aLog(e) { const r = cvUI.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; }
function soltarTodo() { E.punteros.clear(); E.teclas.clear(); CTL.joy.act = false; CTL.joy.vx = CTL.joy.vy = 0; for (const id of ['A', 'B', 'C', 'D']) { CTL.bot[id] = false; soltarB(id); } }
function enPartidoLibre() { return ESCENA === 'partido' && !PANEL && !TELON.fase && P && (P.fase === 'juego' || P.fase === 'penales'); }
const TECLAS = { ArrowLeft: 'l', a: 'l', ArrowRight: 'r', d: 'r', ArrowUp: 'u', w: 'u', ArrowDown: 'dn', s: 'dn' };
const TECLA_BOT = { j: 'A', ' ': 'A', k: 'B', l: 'C', Shift: 'C', i: 'D', e: 'D' };
function prepararEntrada() {
  cvUI.addEventListener('pointerdown', e => {
    e.preventDefault();
    Sonido.iniciar(); Sonido.volumen(OP.musica, OP.sonido);
    if (e.pointerType === 'touch' || e.pointerType === 'pen') TACTIL = true;
    const p = aLog(e), z = zonaEn(ZONAS_PREV, p.x, p.y);
    const ptr = { id: e.pointerId, x: p.x, y: p.y, x0: p.x, y0: p.y, arr: false, rol: 'ui', zona: z };
    const ed = PANEL && PANEL.tipo === 'controles';
    if (ed && (!z || z.fn === null || (z.op && !z.op.drag && z.w >= W - 1))) {
      for (const id of ['A', 'B', 'C', 'D', 'joy']) { const [cx, cy] = posCtl(id); if (Math.hypot(p.x - cx, p.y - cy) < radioCtl(id) * 1.2) { ptr.rol = 'mover'; ptr.ctl = id; PANEL.sel = id; ptr.dx = cx - p.x; ptr.dy = cy - p.y; break; } }
    }
    if (ptr.rol === 'ui' && enPartidoLibre() && TACTIL && (!z || z.w >= W - 1)) {
      const id = tocarControl(p.x, p.y);
      if (id === 'joy') { if (!CTL.joy.act) { ptr.rol = 'joy'; CTL.joy.act = true; CTL.joy.id = e.pointerId; moverPalanca(p.x, p.y, true); } }
      else if (id) { ptr.rol = id; CTL.bot[id] = true; apretar(id); vibrar(8); }
    }
    E.punteros.set(e.pointerId, ptr);
    if (ptr.rol === 'ui' && z && z.op.drag) { ptr.drag = z.op.drag; ptr.drag(p.x, p.y); }
    try { cvUI.setPointerCapture(e.pointerId); } catch (er) { }
  });
  cvUI.addEventListener('pointermove', e => {
    const ptr = E.punteros.get(e.pointerId);
    if (!ptr) return;
    const p = aLog(e);
    ptr.x = p.x; ptr.y = p.y;
    if (!ptr.arr && Math.hypot(p.x - ptr.x0, p.y - ptr.y0) > 8) ptr.arr = true;
    if (ptr.rol === 'joy') moverPalanca(p.x, p.y, false);
    else if (ptr.rol === 'mover') { const r = radioCtl(ptr.ctl), o = orient(); OP.pos[o] = OP.pos[o] || {}; OP.pos[o][ptr.ctl] = [clamp(p.x + ptr.dx, r + 4, W - r - 4) / W, clamp(p.y + ptr.dy, r + 4, H - r - 4) / H]; }
    else if (ptr.drag) ptr.drag(p.x, p.y);
  });
  const soltar = e => {
    const ptr = E.punteros.get(e.pointerId);
    if (!ptr) return;
    E.punteros.delete(e.pointerId);
    if (ptr.rol === 'joy') { CTL.joy.act = false; CTL.joy.vx = CTL.joy.vy = 0; CTL.joy.id = null; }
    else if (BOTONES[ptr.rol]) { CTL.bot[ptr.rol] = false; soltarB(ptr.rol); }
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
    if (k === 'Escape' || k === 'p') { if (!e.repeat) { if (PANEL) cerrarPanel(); else if (ESCENA === 'partido') abrirPanel('pausa'); } e.preventDefault(); return; }
    if (ESCENA === 'intro') { saltarIntro(); return; }
    if (ESCENA === 'comic' && (k === ' ' || k === 'Enter' || k === 'j')) { if (!e.repeat) avanzarComic(); e.preventDefault(); return; }
    if (TECLAS[k]) { E.teclas.add(TECLAS[k]); e.preventDefault(); }
    if (TECLA_BOT[k] && !e.repeat) { apretar(TECLA_BOT[k]); e.preventDefault(); }
    if (ESCENA === 'partido' && P && P.fase === 'repeticion' && !e.repeat) P.saltarRep = true;
  });
  window.addEventListener('keyup', e => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (TECLAS[k]) E.teclas.delete(TECLAS[k]);
    if (TECLA_BOT[k]) soltarB(TECLA_BOT[k]);
  });
  window.addEventListener('blur', soltarTodo);
  window.addEventListener('resize', () => { PEND_RES = true; });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { Sonido.pausar(); soltarTodo(); if (ESCENA === 'partido' && !PANEL && !BOT && P && P.fase !== 'terminado') abrirPanel('pausa'); }
    else { Sonido.seguir(); ultimo = 0; }
  });
}
// ---------- pantalla: el lado corto mide 360 unidades ----------
function redimensionar() {
  DPR = window.devicePixelRatio || 1;
  CSSW = window.innerWidth; CSSH = window.innerHeight;
  const u = Math.min(CSSW, CSSH) / 360;
  W = CSSW / u; H = CSSH / u;
  const dU = Math.min(DPR, 2.5);
  S = u * dU;
  cvUI.width = Math.round(CSSW * dU); cvUI.height = Math.round(CSSH * dU);
  for (const c of [cvGL, cvUI]) { c.style.width = CSSW + 'px'; c.style.height = CSSH + 'px'; c.style.left = '0px'; c.style.top = '0px'; }
  gu = cvUI.getContext('2d');
  R.tamano(CSSW, CSSH, DPR);
  _sellos.clear(); _txtC.clear(); _tramas.clear();
  if (ESCENA === 'intro' && INTRO && !INTRO.listo) { const t = INTRO.t; INTRO = IntroJXS.crear({ W, H, presenta: PRESENTA[IDIOMA] || 'presenta', vibrar: p => vibrar(p), estilo: ESTILO_POTRERO }); INTRO.t = t; }
}
// ---------- el bucle ----------
function cuadro(ts) {
  requestAnimationFrame(cuadro);
  try {
    if (GL.perdido) { mostrarAviso('perdido'); return; }
    if (PEND_RES) { PEND_RES = false; redimensionar(); }
    const real = ultimo ? Math.max(0, (ts - ultimo) / 1000) : 1 / 60;
    ultimo = ts;
    const dt = Math.min(0.05, real);
    DT = dt;
    if (!CONGELADO) actualizar(dt);
    dibujar();
    if (OP.calidad === 'auto' && !PRUEBA && ESCENA === 'partido' && real < 0.5) {
      CAL.t += real; CAL.n++;
      if (CAL.n >= 90) { const m = CAL.t / CAL.n * 1000; if (m > 30 && CAL.nivel !== 'baja') { CAL.nivel = CAL.nivel === 'alta' ? 'media' : 'baja'; aplicarCalidad(); } CAL.t = 0; CAL.n = 0; }
    }
  } catch (e) { registrarError(e); }
}
function registrarError(e) { const s = String(e && e.stack || e); if (ERRORES.length < 20) ERRORES.push(s); console.error(e); }
function actualizar(dt) {
  T += dt; RELOJ += dt;
  if (TELON.fase === 1) { TELON.t += dt / 0.32; if (TELON.t >= 1) { TELON.t = 1; TELON.fase = 2; const f = TELON.alMedio; TELON.alMedio = null; if (f) f(); } }
  else if (TELON.fase === 2) { TELON.t -= dt / 0.32; if (TELON.t <= 0) { TELON.t = 0; TELON.fase = 0; } }
  if (ESCENA === 'intro') { INTRO.pasar(dt); if (INTRO.listo && !TELON.fase) { Sonido.callar = false; irA('idioma'); } return; }
  if (ESCENA === 'partido' && P && !PANEL) {
    ACUM += dt * TURBO * (P.lento || 1);
    let n = 0;
    while (ACUM >= PASO && n < 8 * TURBO) { const inp = leerEntrada(); pasoPartido(PASO, inp); if (P) camaraPartido(PASO); ACUM -= PASO; n++; }
    pasoParticulas(dt);
    Sonido.ambiente(dt, P.fervor || 0, P.C.gente, P.C.viento ? 1 : 0);
  } else if (DEMO && P === DEMO && ESCENA !== 'comic' && ESCENA !== 'partido') {
    ACUM += dt; let n = 0;
    while (ACUM >= PASO && n < 4) { pasoPartido(PASO, ENTRADA); ACUM -= PASO; n++; }
    if (P.fase !== 'juego') { P.fase = 'juego'; }
    if (P.reloj < 100) P.reloj = 99999;
    pasoParticulas(dt);
    Sonido.ambiente(dt, 0.1, 0.2, 0);
  } else if (ESCENA === 'comic' && COMIC) { COMIC.t += dt; COMIC.tPanel += dt; COMIC.voltea = Math.max(0, COMIC.voltea - dt * 3.5); pasoParticulas(dt); }
  Sonido.tic();
}
function camaraDemo() {
  const c = R.cam, a = T * 0.05, r = W > H ? 15 : 17;
  c.x = Math.sin(a) * r * 0.55; c.y = 10 + Math.sin(T * 0.13) * 1.5; c.z = Math.cos(a) * r; c.tx = B.x * 0.4; c.ty = 0; c.tz = B.z * 0.4; c.fovY = W > H ? 0.75 : 1.0; c.cerca = 0.3; c.lejos = 170;
}
function dibujar() {
  const g = gu;
  ZONAS = [];
  g.setTransform(S, 0, 0, S, 0, 0);
  g.clearRect(0, 0, W, H);
  R.veloc = 0; R.invertir = 0; R.sepia = 0; R.fundido = 0;
  if (ESCENA === 'intro' || ESCENA === 'carga') {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.clearColor(0.09, 0.07, 0.12, 1); gl.clear(gl.COLOR_BUFFER_BIT);
    if (INTRO) { INTRO.dibujar(g); zona(0, 0, W, H, saltarIntro); }
    dibujarTelon(g); resolverClics(); ZONAS_PREV = ZONAS;
    return;
  }
  if (ESCENA === 'comic' && COMIC) { dibujarComic3D(); dibujarComic2D(g); }
  else if (ESCENA === 'partido' && P) {
    R.fervor = Math.max(P.fervor || 0, P.fase === 'gol' ? 1 : 0);
    if (P.fase === 'repeticion') R.sepia = 0.55;
    if (P.especial) { const k = P.especial.t / P.especial.dur; R.veloc = 1; R.invertir = k < 0.12 ? 1 : 0; }
    else if (P.especialPelota) R.veloc = 0.6;
    R.dibujar(T, munecosPartido()); R.post(T);
    if (P.fase !== 'terminado') { hudPartido(g); if (enPartidoLibre() && !P.especial) dibujarControles(g); boton(g, W - 40, 10, 30, 30, null, () => abrirPanel('pausa'), { ic: 'pausa', it: 12, sombra: 2.5 }); }
    if (!TACTIL && P.tiempoTotal < 8 && P.fase === 'juego') txt(g, tr('teclas'), W / 2, H - 14, { tam: 9, c: BLANCO, b: TINTA, al: 0.5, max: W - 16 });
  } else {
    if (DEMO && P === DEMO) { camaraDemo(); R.fervor = 0.2; R.dibujar(T, munecosPartido()); R.sepia = ESCENA === 'titulo' ? 0 : 0.35; R.post(T); }
    else if (ESCENA === 'resultado' && P && R.E) { R.dibujar(T, munecosPartido()); R.sepia = 0.45; R.post(T); }
    else { gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.clearColor(0.09, 0.07, 0.12, 1); gl.clear(gl.COLOR_BUFFER_BIT); }
    ({ idioma: escenaIdioma, titulo: escenaTitulo, historia: escenaHistoria, resultado: escenaResultado, picado: escenaPicado, penalesMenu: escenaPenalesMenu, desafio: escenaDesafio, creditos: escenaCreditos, portada: dibujarPortada, letras: escenaLetras }[ESCENA] || (() => { }))(g);
  }
  if (PANEL) dibujarPanel(g);
  dibujarTelon(g);
  if (ERRORES.length && PRUEBA) txt(g, 'ERR ' + ERRORES.length, 4, H - 10, { tam: 9, c: ROJO, b: BLANCO });
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
// ---------- pantallas de menú ----------
function logoPotrero(g, cx, cy, tam, t) {
  // en pasadas: sombra de todas, borde de todas, relleno de todas (así una letra no le pisa el relleno a otra)
  const s = 'POTRERO', w = medir(s, tam, 1) + tam * 0.07 * (s.length - 1), pos = [];
  let x = cx - w / 2;
  for (let i = 0; i < s.length; i++) { const cw = medir(s[i], tam, 1); pos.push([x + cw / 2, cy + Math.sin(t * 3 + i * 0.7) * tam * 0.04, (hash2(i, 9) - 0.5) * 0.16]); x += cw + tam * 0.07; }
  const letra = (i, dx, dy, o) => { const [px, py, rot] = pos[i]; g.save(); g.translate(px + dx, py + dy); g.rotate(rot); txt(g, s[i], 0, 0, Object.assign({ tam, al: 0.5, temblor: false }, o)); g.restore(); };
  for (let k = 5; k >= 1; k--) for (let i = 0; i < s.length; i++) letra(i, k * tam * 0.025, k * tam * 0.03, { c: TINTA, b: TINTA, bw: tam * 0.12 });
  for (let i = 0; i < s.length; i++) letra(i, 0, 0, { c: TINTA, b: TINTA, bw: tam * 0.12 });
  for (let i = 0; i < s.length; i++) letra(i, 0, 0, { c: i % 2 ? AMARILLO : '#ffffff', b: null });
  for (let i = 0; i < s.length; i++) letra(i, -tam * 0.015, -tam * 0.03, { tam: tam * 0.96, c: i % 2 ? '#fff3a8' : '#ffffff', b: null, peso: 0 });
}
function escenaTitulo(g) {
  const ap = W > H, tam = Math.min(ap ? 64 : 62, W / 6.4), yT = ap ? H * 0.17 : H * 0.15;
  g.fillStyle = 'rgba(16,12,24,0.25)'; g.fillRect(0, 0, W, H);
  logoPotrero(g, W / 2, yT, tam, T);
  cartucho(g, W / 2, yT + tam * 0.62, tr('subtitulo'), { tam: 12, al: 0.5, max: W - 40, rot: -0.03 });
  const cy = ap ? H * 0.53 : H * 0.48;
  botonEstallido(g, W / 2, cy, ap ? 96 : 104, ap ? 42 : 48, tr('historia'), () => irA('historia', () => { }), { ic: 'libro', tam: 21 });
  const bw = Math.min(W - 60, 250), bh = 36, x0 = W / 2 - bw / 2;
  let y = cy + (ap ? 56 : 70);
  const filas = [[tr('picado'), () => irA('picado'), 'pelota', CELESTE], [tr('penales'), () => irA('penalesMenu'), 'arco', ROSA], [tr('desafioDia'), () => irA('desafio'), 'calendario', VERDE]];
  if (ap) {
    const w3 = (Math.min(W - 40, 560) - 16) / 3, x3 = W / 2 - (w3 * 3 + 16) / 2;
    filas.forEach(([s, f, ic, c], i) => boton(g, x3 + i * (w3 + 8), y, w3, bh, s, f, { ic, c, tam: 12 }));
    y += bh + 12;
  } else filas.forEach(([s, f, ic, c]) => { boton(g, x0, y, bw, bh, s, f, { ic, c, tam: 13 }); y += bh + 10; });
  const sw = (Math.min(W - 60, 250) - 10) / 2;
  boton(g, W / 2 - sw - 5, y + 2, sw, 30, tr('opciones'), () => abrirPanel('opciones'), { ic: 'engranaje', tam: 10.5, sombra: 2.5 });
  boton(g, W / 2 + 5, y + 2, sw, 30, tr('controles'), () => abrirPanel('controles'), { ic: 'mando', tam: 10.5, sombra: 2.5 });
  boton(g, W - 42, 10, 32, 32, null, () => abrirPanel('idioma'), { ic: 'globo', it: 15, sombra: 2.5 });
  txt(g, 'JXSTUDIOS', W / 2, H - 14, { tam: 10, c: BLANCO, b: TINTA, al: 0.5 });
}
function escenaIdioma(g) {
  g.fillStyle = 'rgba(16,12,24,0.45)'; g.fillRect(0, 0, W, H);
  const tam = Math.min(48, W / 7.5), yT = H * 0.09;
  logoPotrero(g, W / 2, yT, tam, T);
  const cods = IDIOMAS.map(l => l[0]), per = 1.6, i = Math.floor(T / per) % cods.length, k = (T % per) / per, a = clamp(Math.min(k / 0.15, (1 - k) / 0.15), 0, 1);
  const yP = yT + tam * 0.75, viejo = IDIOMA;
  IDIOMA = cods[i]; g.globalAlpha = a; cartucho(g, W / 2, yP, ELEGI_IDIOMA[cods[i]], { tam: 12, al: 0.5, max: W - 30 }); g.globalAlpha = 1; IDIOMA = viejo;
  const port = H > W * 1.2, cols = port ? 2 : 3, filas = Math.ceil(IDIOMAS.length / cols), gap = 8;
  const libre = H - (yP + 40) - 16, bh = clamp(Math.floor((libre - gap * (filas - 1)) / filas), 24, 40), y0 = yP + 40 + Math.max(0, (libre - (filas * bh + gap * (filas - 1))) * 0.35), bw = Math.floor(Math.min(port ? 160 : 170, (W - 24 - gap * (cols - 1)) / cols));
  const x0 = W / 2 - (cols * bw + (cols - 1) * gap) / 2, resto = IDIOMAS.length % cols;
  IDIOMAS.forEach(([cod, nom], j) => {
    const f = Math.floor(j / cols), ultima = resto && f === filas - 1;
    const bx = x0 + (j % cols) * (bw + gap) + (ultima ? (cols - resto) * (bw + gap) / 2 : 0), by = y0 + f * (bh + gap);
    botonIdioma(g, bx, by, bw, bh, cod, nom, () => elegirIdioma(cod), cod === IDIOMA);
  });
}
// la historia: un índice de historieta con los seis partidos
function escenaHistoria(g) {
  g.fillStyle = 'rgba(16,12,24,0.5)'; g.fillRect(0, 0, W, H);
  const ap = W > H;
  cartucho(g, 14, 14, tr('copaBarrios'), { tam: 15, c: AMARILLO });
  boton(g, W - 100, 10, 90, 30, tr('volver'), () => irA('titulo'), { ic: 'atras', tam: 11, sombra: 2.5 });
  const cols = ap ? 3 : 2, n = CAPITULOS.length, gap = 10, top = 54, bw = Math.min(ap ? 200 : 170, (W - 24 - gap * (cols - 1)) / cols);
  const filas = Math.ceil(n / cols), bh = Math.min(ap ? (H - top - 20 - gap * (filas - 1)) / filas : 150, (H - top - 30 - gap * (filas - 1)) / filas);
  const x0 = W / 2 - (cols * bw + (cols - 1) * gap) / 2;
  CAPITULOS.forEach((C, i) => {
    const x = x0 + (i % cols) * (bw + gap), y = top + Math.floor(i / cols) * (bh + gap);
    const abierto = i <= PROG.cap, gan = PROG.ganados[i], E = EQUIPOS[C.rival];
    const fn = abierto ? () => jugarCapitulo(i) : null;
    const ap2 = !!fn && apretado(x, y, bw, bh), d = ap2 ? 2 : 0;
    cuadroComic(g, x + d, y + d, bw, bh, abierto ? (gan ? '#d8f0c8' : PAPEL) : '#b8b0c0', { r: 4, sombra: ap2 ? 1 : 4 });
    txt(g, tr('cap' + (i + 1)), x + 10 + d, y + 14 + d, { tam: 10, c: ROJO, b: null, al: 0, max: bw - 20 });
    escudo(g, x + bw / 2 + d, y + bh * 0.42 + d, Math.min(26, bh * 0.2), C.rival);
    txt(g, tr(E.nom), x + bw / 2 + d, y + bh * 0.72 + d, { tam: 11, c: TINTA, b: null, al: 0.5, max: bw - 14 });
    if (gan) txt(g, gan.g[0] + ' - ' + gan.g[1] + (gan.p ? ' (' + gan.p[0] + '-' + gan.p[1] + ')' : ''), x + bw / 2 + d, y + bh - 14 + d, { tam: 11, c: VERDE, b: TINTA, al: 0.5 });
    else if (!abierto) icono(g, 'candado', x + bw / 2 + d, y + bh - 16 + d, 16, TINTA);
    else txt(g, tr('jugar'), x + bw / 2 + d, y + bh - 14 + d, { tam: 11, c: ROJO, b: TINTA, al: 0.5, max: bw - 14 });
    if (fn) zona(x, y, bw, bh, () => { Sonido.boton(); fn(); });
  });
}
function escenaResultado(g) {
  const Rz = RES, r = Rz.r; Rz.t += DT;
  g.fillStyle = 'rgba(16,12,24,0.55)'; g.fillRect(0, 0, W, H);
  const w = Math.min(W - 24, 340), x = W / 2 - w / 2, y = Math.max(18, H * 0.1), h = Math.min(H - y - 20, 430);
  marco(g, x, y, w, h, null);
  const gano = r.gana === 0, empate = r.gana === -1, k = rebote(clamp(Rz.t / 0.35, 0, 1));
  g.save(); g.translate(W / 2, y + 44); g.scale(k, k);
  if (r.penalesRacha != null) { estallido(g, 0, 0, 120, 34, r.nuevoRecord ? AMARILLO : CELESTE, { puntas: 16 }); txt(g, tr('racha') + ': ' + r.penalesRacha, 0, 0, { tam: 22, c: BLANCO, b: TINTA, bw: 3, al: 0.5, max: 200 }); }
  else { estallido(g, 0, 0, 120, 36, gano ? AMARILLO : empate ? CELESTE : '#c8c0d0', { puntas: 16 }); txt(g, tr(gano ? 'ganaste' : empate ? 'empate' : 'perdiste'), 0, 0, { tam: 24, c: gano ? ROJO : BLANCO, b: TINTA, bw: 3, al: 0.5, max: 200 }); }
  g.restore();
  if (r.penalesRacha != null) {
    if (r.nuevoRecord) cartucho(g, W / 2, y + 92, tr('nuevoRecord'), { tam: 12, al: 0.5, c: ROJO, tc: BLANCO });
    txt(g, tr('mejorRacha') + ': ' + PROG.mejorRacha, W / 2, y + 130, { tam: 13, c: TINTA, b: null, al: 0.5 });
  } else {
    const eq = r.cfg.eq;
    escudo(g, W / 2 - 80, y + 112, 22, eq[0]); escudo(g, W / 2 + 80, y + 112, 22, eq[1]);
    txt(g, r.goles[0] + ' - ' + r.goles[1], W / 2, y + 112, { tam: 34, c: TINTA, b: null, al: 0.5 });
    if (r.penales) txt(g, tr('penales') + ' ' + r.penales[0] + ' - ' + r.penales[1], W / 2, y + 142, { tam: 11, c: TINTA, b: null, al: 0.5 });
    const st = r.stats, pos = st.pos[0] + st.pos[1] > 0 ? Math.round(st.pos[0] / (st.pos[0] + st.pos[1]) * 100) : 50;
    const filas = [['tiros', st.tiros[0], st.tiros[1]], ['pases', st.pasesOk[0] + '/' + st.pases[0], st.pasesOk[1] + '/' + st.pases[1]], ['atajadas', st.ataj[0], st.ataj[1]], ['quites', st.quites[0], st.quites[1]], ['posesion', pos + '%', (100 - pos) + '%']];
    const paso = Math.min(24, (h - 168 - 52) / 5.4);
    filas.forEach(([kk, a, b], i) => { const yy = y + 168 + i * paso; txt(g, String(a), x + 34, yy, { tam: 13, c: TINTA, b: null, al: 0.5 }); txt(g, tr(kk), W / 2, yy, { tam: 11, c: ROJO, b: null, al: 0.5, max: w - 130 }); txt(g, String(b), x + w - 34, yy, { tam: 13, c: TINTA, b: null, al: 0.5 }); });
    if (r.desafio != null) cartucho(g, W / 2, y + 168 + 5 * paso + 4, tr(r.desafio ? 'desafioOk' : 'desafioNo'), { tam: 11, al: 0.5, c: r.desafio ? VERDE : PAPEL2, tc: r.desafio ? BLANCO : TINTA, max: w - 30 });
  }
  const bw = (w - 36) / 2, by = y + h - 46;
  boton(g, x + 12, by, bw, 34, tr('menu'), () => { RES = null; irMenu('titulo'); }, { ic: 'casa', tam: 12 });
  boton(g, x + 24 + bw, by, bw, 34, tr('seguir'), () => { const f = Rz.seguir; RES = null; if (f) f(); }, { ic: 'play', c: VERDE, tam: 12 });
}
// selección en ronda (equipo, rival, cancha…)
let PIC = null;
function picDefecto() { return { yo: 'loma', rival: 'gatos', cancha: 'potrero', dur: 240, dif: 1 }; }
function equiposAbiertos() { return ['loma'].concat(ORDEN_RIVALES.filter(id => PROG.desbloq[id] === 1 || id === 'gatos')); }
function canchasAbiertas() { return Object.keys(CANCHAS).filter(c => PROG.canchas[c] || c === 'potrero'); }
function ronda(L, v, d) { const i = L.indexOf(v); return L[((i < 0 ? 0 : i) + d + L.length) % L.length]; }
function selector(g, x, y, w, etiqueta, valor, menos, mas, extra) {
  txt(g, etiqueta, x + w / 2, y, { tam: 10, c: AMARILLO, b: TINTA, al: 0.5 });
  boton(g, x, y + 10, 34, 34, null, menos, { ic: 'flechaIzq', it: 14, sombra: 2.5 });
  boton(g, x + w - 34, y + 10, 34, 34, null, mas, { ic: 'flechaDer', it: 14, sombra: 2.5 });
  cuadroComic(g, x + 40, y + 10, w - 80, 34, PAPEL, { r: 4, sombra: 2.5, liso: true });
  if (extra) extra(x + 40, y + 10, w - 80); else txt(g, valor, x + w / 2, y + 27, { tam: 12, c: TINTA, b: null, al: 0.5, max: w - 92 });
}
function escenaPicado(g) {
  PIC = PIC || picDefecto();
  g.fillStyle = 'rgba(16,12,24,0.5)'; g.fillRect(0, 0, W, H);
  cartucho(g, 14, 14, tr('picado'), { tam: 15, c: CELESTE });
  boton(g, W - 100, 10, 90, 30, tr('volver'), () => irA('titulo'), { ic: 'atras', tam: 11, sombra: 2.5 });
  const ap = W > H, w = ap ? Math.min((W - 60) / 2, 320) : Math.min(W - 30, 330), eqs = equiposAbiertos(), cs = canchasAbiertas();
  const col = i => ap ? [W / 2 - w - 10 + (i < 3 ? 0 : w + 20), 60 + (i % 3) * 60] : [W / 2 - w / 2, Math.max(56, H * 0.12) + i * 60];
  const escE = id => (x2, y2, w2) => { escudo(g, x2 + 18, y2 + 17, 11, id); txt(g, tr(EQUIPOS[id].nom), x2 + 34 + (w2 - 34) / 2, y2 + 17, { tam: 10.5, c: TINTA, b: null, al: 0.5, max: w2 - 40 }); };
  let [x, y] = col(0); selector(g, x, y, w, tr('tuEquipo'), '', () => { PIC.yo = ronda(eqs, PIC.yo, -1); }, () => { PIC.yo = ronda(eqs, PIC.yo, 1); }, escE(PIC.yo));
  [x, y] = col(1); selector(g, x, y, w, tr('rival'), '', () => { PIC.rival = ronda(eqs, PIC.rival, -1); }, () => { PIC.rival = ronda(eqs, PIC.rival, 1); }, escE(PIC.rival));
  [x, y] = col(2); selector(g, x, y, w, tr('cancha'), tr('ca_' + PIC.cancha), () => { PIC.cancha = ronda(cs, PIC.cancha, -1); }, () => { PIC.cancha = ronda(cs, PIC.cancha, 1); });
  [x, y] = col(3); selector(g, x, y, w, tr('duracion'), fmtReloj(PIC.dur), () => { PIC.dur = ronda([120, 180, 240, 360], PIC.dur, -1); }, () => { PIC.dur = ronda([120, 180, 240, 360], PIC.dur, 1); });
  [x, y] = col(4); selector(g, x, y, w, tr('dificultad'), tr(PIC.dif < 0.95 ? 'facil' : PIC.dif > 1.05 ? 'dificil' : 'normal'), () => { PIC.dif = ronda([0.85, 1, 1.15], PIC.dif, -1); }, () => { PIC.dif = ronda([0.85, 1, 1.15], PIC.dif, 1); });
  if (PIC.yo === PIC.rival) PIC.rival = ronda(eqs, PIC.rival, 1);
  const [bx, by] = ap ? [col(5)[0] + w / 2, col(5)[1] + 36] : [W / 2, Math.min(H - 52, col(4)[1] + 100)];
  botonEstallido(g, bx, by, 90, 36, tr('jugar'), () => jugarPicado(PIC), { tam: 20 });
}
function escenaPenalesMenu(g) {
  PIC = PIC || picDefecto();
  g.fillStyle = 'rgba(16,12,24,0.5)'; g.fillRect(0, 0, W, H);
  cartucho(g, 14, 14, tr('penales'), { tam: 15, c: ROSA });
  boton(g, W - 100, 10, 90, 30, tr('volver'), () => irA('titulo'), { ic: 'atras', tam: 11, sombra: 2.5 });
  const w = Math.min(W - 30, 330), x = W / 2 - w / 2, eqs = equiposAbiertos();
  let y = Math.max(60, H * 0.14);
  const tam = 11, L = partir(tr('penalesExplica'), w - 20, tam, 0);
  cuadroComic(g, x, y, w, L.length * altoRenglon(tam) + 18, PAPEL, { r: 4, sombra: 3, liso: true });
  L.forEach((l, i) => txt(g, l, W / 2, y + 9 + altoRenglon(tam) * (i + 0.5), { tam, c: TINTA, b: null, al: 0.5, peso: 0, max: w - 16 }));
  y += L.length * altoRenglon(tam) + 34;
  const escE = id => (x2, y2, w2) => { escudo(g, x2 + 18, y2 + 17, 11, id); txt(g, tr(EQUIPOS[id].nom), x2 + 34 + (w2 - 34) / 2, y2 + 17, { tam: 10.5, c: TINTA, b: null, al: 0.5, max: w2 - 40 }); };
  selector(g, x, y, w, tr('tuEquipo'), '', () => { PIC.yo = ronda(eqs, PIC.yo, -1); }, () => { PIC.yo = ronda(eqs, PIC.yo, 1); }, escE(PIC.yo)); y += 60;
  selector(g, x, y, w, tr('rival'), '', () => { PIC.rival = ronda(eqs, PIC.rival, -1); }, () => { PIC.rival = ronda(eqs, PIC.rival, 1); }, escE(PIC.rival)); y += 66;
  if (PIC.yo === PIC.rival) PIC.rival = ronda(eqs, PIC.rival, 1);
  txt(g, tr('mejorRacha') + ': ' + PROG.mejorRacha, W / 2, y, { tam: 13, c: AMARILLO, b: TINTA, al: 0.5 });
  botonEstallido(g, W / 2, Math.min(H - 52, y + 52), 90, 36, tr('jugar'), () => jugarPenales({ yo: PIC.yo, rival: PIC.rival, cancha: EQUIPOS[PIC.rival].cancha === 'estadio' && !PROG.canchas.estadio ? 'potrero' : (PROG.canchas[EQUIPOS[PIC.rival].cancha] ? EQUIPOS[PIC.rival].cancha : 'potrero') }), { tam: 20 });
}
function escenaDesafio(g) {
  const D = desafioDeHoy(), hecho = !!PROG.desafios[D.dia];
  g.fillStyle = 'rgba(16,12,24,0.5)'; g.fillRect(0, 0, W, H);
  cartucho(g, 14, 14, tr('desafioDia'), { tam: 15, c: VERDE, tc: BLANCO });
  boton(g, W - 100, 10, 90, 30, tr('volver'), () => irA('titulo'), { ic: 'atras', tam: 11, sombra: 2.5 });
  const ap = W > H, w = Math.min(W - 30, 330), x = ap ? W / 2 - w - 20 : W / 2 - w / 2, y = Math.max(64, H * 0.15), h = 230;
  marco(g, x, y, w, h, String(D.dia).replace(/(\d{4})(\d{2})(\d{2})/, '$3/$2/$1'));
  const tam = 15, L = partir(tr(D.plantilla.k), w - 30, tam, 1);
  const cx = x + w / 2;
  L.forEach((l, i) => txt(g, l, cx, y + 34 + altoRenglon(tam) * (i + 0.5), { tam, c: TINTA, b: null, al: 0.5, max: w - 24 }));
  escudo(g, cx - 60, y + 128, 24, 'loma'); txt(g, 'VS', cx, y + 128, { tam: 18, c: ROJO, b: TINTA, al: 0.5 }); escudo(g, cx + 60, y + 128, 24, D.rival);
  txt(g, tr('ca_' + D.cancha), cx, y + 168, { tam: 11, c: TINTA, b: null, al: 0.5 });
  if (hecho) cartucho(g, cx, y + 192, tr('desafioHecho'), { tam: 11, al: 0.5, c: VERDE, tc: BLANCO });
  const ox = ap ? W / 2 + 20 + w / 2 : W / 2, oy = ap ? y + 60 : y + h + 22;
  txt(g, tr('rachaDesafios') + ': ' + PROG.rachaDesafio, ox, oy, { tam: 12, c: AMARILLO, b: TINTA, al: 0.5, max: w });
  botonEstallido(g, ox, ap ? y + 140 : Math.min(H - 52, y + h + 80), 90, 36, tr('jugar'), () => jugarDesafio(), { tam: 20 });
}
function escenaCreditos(g) {
  CRED.t += DT;
  g.fillStyle = 'rgba(16,12,24,0.7)'; g.fillRect(0, 0, W, H);
  logoPotrero(g, W / 2, H * 0.2, Math.min(56, W / 7), T);
  const L = ['cred1', 'cred2', 'cred3', 'cred4'];
  L.forEach((k, i) => { const a = clamp((CRED.t - 0.6 - i * 0.7) / 0.5, 0, 1); g.globalAlpha = a; txt(g, tr(k), W / 2, H * 0.36 + i * 34, { tam: 13, c: i === 3 ? AMARILLO : BLANCO, b: TINTA, al: 0.5, max: W - 30 }); g.globalAlpha = 1; });
  txt(g, 'JXSTUDIOS', W / 2, H * 0.78, { tam: 22, c: AMARILLO, b: TINTA, bw: 3, al: 0.5 });
  if (CRED.t > 3) { if (Math.sin(T * 4) > 0) txt(g, tr('toca'), W / 2, H - 26, { tam: 10, c: BLANCO, b: TINTA, al: 0.5 }); zona(0, 0, W, H, () => irMenu('titulo')); }
}
function panelPausa(g, Pn) {
  fondoOscuro(g);
  const w = Math.min(W - 40, 270), bh = 36, gap = 10, h = 54 + 4 * (bh + gap), x = (W - w) / 2, y = Math.max(16, (H - h) / 2) + (1 - entrada(Pn)) * 30;
  marco(g, x, y, w, h, tr('pausa'));
  if (P && P.goles) txt(g, P.goles[0] + ' - ' + P.goles[1] + '   ' + fmtReloj(Math.max(0, P.reloj || 0)), W / 2, y + 26, { tam: 12, c: TINTA, b: null, al: 0.5 });
  const bs = [[tr('seguir'), () => cerrarPanel(), { c: VERDE, ic: 'play' }], [tr('opciones'), () => abrirPanel('opciones', { volver: 'pausa' }), { ic: 'engranaje' }],
    [tr('controles'), () => abrirPanel('controles', { volver: 'pausa' }), { ic: 'mando' }], [tr('abandonar'), () => abrirPanel('confirmar', { k: 'seguroAbandonar', si: () => { PANEL = null; P = null; irMenu('titulo'); } }), { ic: 'casa', c: '#f0b8a0' }]];
  bs.forEach((b, i) => boton(g, x + 16, y + 44 + i * (bh + gap), w - 32, bh, b[0], b[1], Object.assign({ tam: 12 }, b[2])));
}
function escenaLetras(g) {
  g.fillStyle = PAPEL; g.fillRect(0, 0, W, H);
  const filas = ['ABCDEFGHIJKLM', 'NOPQRSTUVWXYZ', '0123456789', '¡!¿?.,:;-–\'"«»()/+=%#&·…°*<>×', 'ÁÀÂÃÄÅÉÈÊËÍÌÎÏİ', 'ÓÒÔÕÖÚÙÛÜÑÇŞĞÝŸ', 'POTRERO ¡GOOOL!', 'Juani Rulo Bebé'];
  filas.forEach((f, i) => txt(g, f, 12, 40 + i * 44, { tam: 26, c: AMARILLO, b: TINTA, al: 0, max: W - 24 }));
  logoPotrero(g, W / 2, 420, 60, 0);
}
// ---------- portada 9:16 ----------
function armarPortada() {
  ESCENA = 'portada';
  BOT_TODO = true;
  nuevoPartido({ eq: ['loma', 'halcones'], cancha: 'estadio', dur: 999, modo: 'demo', semilla: 9 });
  const J = P.jug[4]; J.x = 0.5; J.z = -9; J.yaw = PI + 0.25;
  B.x = 0.62; B.z = -9.75; B.y = 0.5; B.dueno = null;
  const arq = P.jug[5]; arq.x = -1.3; arq.z = -17.6; arq.yaw = 0;
  for (const [i, x, z] of [[6, 2.6, -11.2], [7, -2.4, -12], [8, -3.4, -14.5], [9, -3, -7], [1, -1, -2], [2, -4, -4], [3, 4, -3], [0, 0, 16]]) { P.jug[i].x = x; P.jug[i].z = z; }
  for (let k = 0; k < 160; k++) particula(rnd(-10, 10), rnd(2, 12), rnd(-20, 4), 0, 0, 0, 999, rnd(0.14, 0.22), [AMARILLO, BLANCO, CELESTE, ROSA, VERDE, ROJO][k % 6], 1, 0, 0);
}
function dibujarPortada(g) {
  const J = P.jug[4], m = J.m;
  for (const j of P.jug) { poseVaciaEn(j.m.pose); j.m.x = j.x; j.m.z = j.z; j.m.yaw = j.yaw; j.m.y = 0; if (j.i === 0) pArquero(j.m.pose, 0); else pCorrer(j.m.pose, j.i * 0.3, 0.7); j.m.cara = 5; posarMuneco(j.m); }
  pPatear(poseVaciaEn(m.pose), 0.5, 1, 1); m.cara = 6; posarMuneco(m);
  const arq = P.jug[5]; pEstirada(poseVaciaEn(arq.m.pose), 0.4, -1, 0.7); arq.m.y = 0.3; arq.m.cara = 3; posarMuneco(arq.m);
  matrizPelota(B.x, B.y, B.z, B.rot);
  R.cam.x = 3.2; R.cam.y = 1.1; R.cam.z = -6.4; R.cam.tx = -0.2; R.cam.ty = 1.4; R.cam.tz = -12; R.cam.fovY = 1.05; R.cam.cerca = 0.2; R.cam.lejos = 170;
  R.veloc = 0.55; R.centroV = [0.48, 0.58]; R.fervor = 1;
  R.dibujar(4, munecosPartido()); R.post(4);
  logoPotrero(g, W / 2, H * 0.12, Math.min(70, W / 6), 0);
  cartucho(g, W / 2, H * 0.12 + 46, tr('subtitulo'), { tam: 13, al: 0.5, max: W - 40 });
  g.save(); g.translate(W * 0.7, H * 0.44); g.rotate(-0.12); estallido(g, 0, 0, 62, 34, ROJO, { puntas: 14 }); txt(g, '¡PUM!', 0, 0, { tam: 26, c: AMARILLO, b: TINTA, bw: 3, al: 0.5 }); g.restore();
  txt(g, 'JXSTUDIOS', W / 2, H * 0.93, { tam: 16, c: BLANCO, b: TINTA, al: 0.5 });
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
  PROG = Object.assign(progDefecto(), Guardado.leer('prog', {}));
  R.iniciar(); R.ponerCalidad(CAL.nivel);
  R.texCaras = GL.texturaLienzo(armarCaras(), true);
  R.texPub = GL.texturaLienzo(atlasPublico(), true);
  FIG_PELOTA = armarPelota();
  redimensionar();
  prepararEntrada();
  document.getElementById('carga').style.display = 'none';
  if (PARAM.has('portada')) { armarPortada(); }
  else {
    empezarDemo();
    R.precompilar();
    if (PRUEBA && !PARAM.has('intro')) { ESCENA = PARAM.get('escena') || 'titulo'; Sonido.musica(0); }
    else empezarIntro();
  }
  requestAnimationFrame(cuadro);
}
// ---------- API de prueba ----------
window.__juego = {
  get P() { return P; }, get B() { return B; }, get escena() { return ESCENA; }, get errores() { return ERRORES; }, get stats() { return R.stats; }, get prog() { return PROG; }, get comic() { return COMIC && { p: COMIC.p, panel: COMIC.panel, n: COMIC.paginas.length, np: COMIC.paginas[COMIC.p].paneles.length, fin: !!COMIC.terminado }; },
  set congelado(v) { CONGELADO = !!v; }, set turbo(v) { TURBO = v; }, set bot(v) { BOT = !!v; BOT_TODO = BOT; }, get bot() { return BOT; },
  get intro() { return INTRO && { t: INTRO.t, listo: INTRO.listo }; }, get panel() { return PANEL && PANEL.tipo; },
  escenaA(e) { ESCENA = e; if (e === 'intro') empezarIntro(); },
  paso(n, dib) { for (let i = 0; i < (n || 1); i++) actualizar(PASO); if (dib !== false) dibujar(); },
  dibujar() { dibujar(); },
  capitulo(i, sinComic) { jugarCapitulo(i, sinComic); },
  picado(c) { jugarPicado(Object.assign(picDefecto(), c || {})); }, penales(c) { jugarPenales(Object.assign(picDefecto(), c || {})); }, desafio() { jugarDesafio(); },
  hojaLetras() { ESCENA = 'letras'; },
  comicDe(n) { empezarComic(PAG[n], () => irA('titulo')); ESCENA = 'comic'; }, get nombresComic() { return Object.keys(PAG); },
  comicPrueba(pags) { empezarComic(pags, () => irA('titulo')); ESCENA = 'comic'; },
  avanzarComic() { if (COMIC) { COMIC.tPanel = 9; avanzarComic(); } }, saltarComic() { if (COMIC && !COMIC.terminado) terminarComic(); },
  seguirResultado() { if (RES) { const f = RES.seguir; RES = null; if (f) f(); } },
  idioma(c) { cambiarIdioma(c); }, calidad(c) { OP.calidad = c; aplicarCalidad(); }, abrir(p, d) { abrirPanel(p, d); }, cerrar() { PANEL = null; },
  posBoton(id) { const [x, y] = posCtl(id); return [x * CSSW / W, y * CSSH / H]; }, get tactil() { return TACTIL; },
  apretar(id) { apretar(id); }, soltar(id) { soltarB(id); },
  nivel() { if (!Sonido.anal) return null; const d = new Float32Array(2048); Sonido.anal.getFloatTimeDomainData(d); let p = 0, r = 0; for (const v of d) { p = Math.max(p, Math.abs(v)); r += v * v; } return { estado: Sonido.ctx.state, pico: +p.toFixed(3), rms: +Math.sqrt(r / d.length).toFixed(4), tema: Sonido.tema }; },
  estado() { return P ? { escena: ESCENA, fase: P.fase, goles: P.goles.join('-'), reloj: Math.round(P.reloj), mitad: P.mitad, due: B.dueno ? B.dueno.eq + ':' + B.dueno.nom : B.enManos ? 'manos' : '-', pel: [+B.x.toFixed(1), +B.y.toFixed(2), +B.z.toFixed(1)], hum: P.humano && P.humano.nom, ag: P.aguante.map(Math.round).join('/'), pen: P.penales && P.penales.goles.join('-') } : { escena: ESCENA }; },
};
iniciar();
