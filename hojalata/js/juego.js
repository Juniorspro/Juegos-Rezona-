// HOJALATA — el juego: escenas (intro, idioma, título con una carrera de fondo, historia, escenas, carrera,
// resultado, carrera rápida, contrarreloj, desafío del día, créditos), entrada (dedos, mouse, teclado), bucle y
// API de prueba.
let OP = null, ESCENA = 'carga', T = 0, DT = 1 / 60, ACUM = 0, TURBO = 1, BOT = false, CONGELADO = false, TACTIL = false;
let INTRO = null, MUS_INTRO = null, cvGL = null, cvUI = null, gu = null, PEND_RES = true, ultimo = 0, RES = null, DEMO = false, PROG = null;
const PASO = 1 / 60;
const E = { punteros: new Map(), clics: [], teclas: new Set() };
const ERRORES = [];
const CAL = { nivel: 'media', t: 0, n: 0 };
const BOTONES = { A: { abajo: false, downs: 0, ups: 0 }, B: { abajo: false, downs: 0, ups: 0 }, C: { abajo: false, downs: 0, ups: 0 } };
const VISTOS = { A: [0, 0], B: [0, 0], C: [0, 0] };
function opDefecto() { return { v: 1, calidad: 'auto', musica: 0.7, sonido: 0.85, vibrar: true, zurdo: false, palanca: 'flotante', pos: { v: {}, h: {} }, tam: {}, opac: {} }; }
function progDefecto() { return { cap: 0, ganados: {}, intentos: {}, fin: false, mejores: {}, desafios: {}, rachaDesafio: 0, carreras: 0 }; }
function guardarOp() { Guardado.escribir('opciones', OP); }
function guardarProg() { Guardado.escribir('prog', PROG); }
function aplicarCalidad() { const q = OP.calidad === 'auto' ? CAL.nivel : OP.calidad; if (R.calidad !== q) R.ponerCalidad(q); }
function apretar(id) { const b = BOTONES[id]; if (!b.abajo) { b.abajo = true; b.downs++; } }
function soltarB(id) { const b = BOTONES[id]; if (b.abajo) { b.abajo = false; b.ups++; } }
// lo que la carrera lee en cada paso
function leerEntrada() {
  let sx = 0, sy = 0;
  if (CTL.joy.act) { sx = CTL.joy.vx; sy = CTL.joy.vy; }
  if (E.teclas.has('l')) sx = -1; if (E.teclas.has('r')) sx = 1; if (E.teclas.has('l') && E.teclas.has('r')) sx = 0;
  if (E.teclas.has('dn')) sy = 1;
  const ap = id => { const b = BOTONES[id], v = VISTOS[id], a = b.downs > v[0]; v[0] = b.downs; v[1] = b.ups; return a; };
  return { steer: clamp(sx * 1.15, -1, 1), freno: sy > 0.72, atras: sy > 0.5, derrape: BOTONES.A.abajo, item: ap('B'), cuerda: ap('C') };
}
// ---------- escenas ----------
function empezarIntro() {
  ESCENA = 'intro';
  INTRO = IntroJXS.crear({ W, H, presenta: PRESENTA[IDIOMA] || 'presenta', vibrar: p => vibrar(p), estilo: ESTILO_HOJALATA });
  MUS_INTRO = Sonido.ok() ? IntroJXS.jingle(Sonido.ctx, Sonido.master, ESTILO_HOJALATA) : null;
  Sonido.callar = true;
}
function saltarIntro() { if (!INTRO) return; INTRO.saltar(); if (INTRO.listo && MUS_INTRO) MUS_INTRO.cortar(); }
function elegirIdioma(cod) { cambiarIdioma(cod); irA('titulo', () => Sonido.musica(0)); }
// la carrera de fondo del menú (la IA sola)
function empezarDemo() {
  nuevaCarrera({ pista: PISTA_ACTUAL != null ? PISTA_ACTUAL : Math.min(PROG.cap, PISTAS.length - 1), corredores: ORDEN_PJ.slice(), yo: 'chispa', vueltas: 99, modo: 'demo', demo: true, semilla: 7, sinPresentacion: true });
  CAR.fase = 'carrera'; CAR.tFase = 9; DEMO = true;
  for (const A of CAR.autos) { A.s = (A.grilla * 9) % CAR.C.L; A.vf = 8; }
  Sonido.motor(false);
}
function irMenu(esc) { irA(esc || 'titulo', () => { empezarDemo(); Sonido.musica(0); }); }
function mostrarResultado(r, seguir) {
  RES = { r, seguir, t: 0 }; PROG.carreras++; guardarProg();
  Sonido.motor(false); Sonido.derrape(false);
  irA('resultado', () => { Sonido.musica(3); if (r.puesto === 0) Sonido.victoria(); else if (r.puesto > 2) Sonido.derrota(); });
}
let CRED = null;
function mostrarCreditos() { CRED = { t: 0 }; irA('creditos', () => { empezarDemo(); Sonido.musica(0); }); }
function correr(cfg) {
  DEMO = false;
  irA('carrera', () => { nuevaCarrera(cfg); Sonido.musica(-1); });
}
function jugarRapida(c) {
  correr({ pista: c.pista, yo: c.pj, corredores: [c.pj].concat(ORDEN_PJ.filter(x => x !== c.pj)), grilla: [3, 0, 1, 2, 4, 5], vueltas: c.vueltas, modo: 'rapida', dificultad: c.dif, semilla: (Math.random() * 1e6) | 0,
    alTerminar: r => { const k = 'p' + c.pista; if (!PROG.mejores[k] || r.tiempo < PROG.mejores[k]) { if (r.puesto === 0) PROG.mejores[k] = r.tiempo; } guardarProg(); mostrarResultado(r, () => irMenu('rapida')); } });
}
function jugarContra(c) {
  correr({ pista: c.pista, yo: c.pj, corredores: [c.pj], grilla: [1], vueltas: 3, modo: 'contra', semilla: 5,
    alTerminar: r => { const k = 'c' + c.pista; r.record = !PROG.mejores[k] || r.tiempo < PROG.mejores[k]; if (r.record) PROG.mejores[k] = r.tiempo; guardarProg(); mostrarResultado(r, () => irMenu('contra')); } });
}
// el desafío del día: pista, autito y objetivo con la fecha de semilla
const PLANTILLAS = [
  { k: 'd_ganar', cumple: r => r.puesto === 0 },
  { k: 'd_sinItems', cumple: r => r.puesto <= 2 && r.usados === 0 },
  { k: 'd_tornillos', cumple: r => r.tornillos >= 10 },
  { k: 'd_top2', cumple: r => r.puesto <= 1 },
];
function desafioDeHoy() {
  const dia = hoy(), r = rngSemilla(dia * 7 + 3);
  return { dia, pista: Math.floor(r() * PISTAS.length), pj: ORDEN_PJ[Math.floor(r() * ORDEN_PJ.length)], plantilla: PLANTILLAS[Math.floor(r() * PLANTILLAS.length)], semilla: dia };
}
function jugarDesafio() {
  const D = desafioDeHoy();
  correr({ pista: D.pista, yo: D.pj, corredores: [D.pj].concat(ORDEN_PJ.filter(x => x !== D.pj)), grilla: [4, 0, 1, 2, 3, 5], vueltas: 3, modo: 'desafio', dificultad: 1.02, semilla: D.semilla,
    alTerminar: r => { const ok = D.plantilla.cumple(r); r.desafio = ok; if (ok && !PROG.desafios[D.dia]) { PROG.desafios[D.dia] = 1; PROG.rachaDesafio++; } guardarProg(); mostrarResultado(r, () => irMenu('desafio')); } });
}
// ---------- entrada ----------
function aLog(e) { const r = cvUI.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; }
function soltarTodo() { E.punteros.clear(); E.teclas.clear(); CTL.joy.act = false; CTL.joy.vx = CTL.joy.vy = 0; for (const id of ['A', 'B', 'C']) { CTL.bot[id] = false; soltarB(id); } }
function enCarreraLibre() { return ESCENA === 'carrera' && !PANEL && !TELON.fase && CAR && !DEMO && (CAR.fase === 'cuenta' || CAR.fase === 'carrera'); }
const TECLAS = { ArrowLeft: 'l', a: 'l', ArrowRight: 'r', d: 'r', ArrowDown: 'dn', s: 'dn' };
const TECLA_BOT = { j: 'A', ' ': 'A', ArrowUp: 'A', w: 'A', k: 'B', e: 'B', l: 'C', Shift: 'C', q: 'C' };
function prepararEntrada() {
  cvUI.addEventListener('pointerdown', e => {
    e.preventDefault();
    Sonido.iniciar(); Sonido.volumen(OP.musica, OP.sonido);
    if (e.pointerType === 'touch' || e.pointerType === 'pen') TACTIL = true;
    const p = aLog(e), z = zonaEn(ZONAS_PREV, p.x, p.y);
    if (!TACTIL && enCarreraLibre() && (!z || z.w >= W - 1)) TACTIL = true;
    const ptr = { id: e.pointerId, x: p.x, y: p.y, x0: p.x, y0: p.y, arr: false, rol: 'ui', zona: z };
    const ed = PANEL && PANEL.tipo === 'controles';
    if (ed && (!z || z.fn === null || (z.op && !z.op.drag && z.w >= W - 1))) {
      for (const id of ['A', 'B', 'C', 'joy']) { const [cx, cy] = posCtl(id); if (Math.hypot(p.x - cx, p.y - cy) < radioCtl(id) * 1.2) { ptr.rol = 'mover'; ptr.ctl = id; PANEL.sel = id; ptr.dx = cx - p.x; ptr.dy = cy - p.y; break; } }
    }
    if (ptr.rol === 'ui' && enCarreraLibre() && TACTIL && (!z || z.w >= W - 1)) {
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
    if (k === 'Escape' || k === 'p') { if (!e.repeat) { if (PANEL) cerrarPanel(); else if (ESCENA === 'carrera' && !DEMO) abrirPanel('pausa'); } e.preventDefault(); return; }
    if (ESCENA === 'intro') { saltarIntro(); return; }
    if (ESCENA === 'escena' && (k === ' ' || k === 'Enter' || k === 'j')) { if (!e.repeat) avanzarEscena(); e.preventDefault(); return; }
    if (ESCENA === 'carrera' && CAR && CAR.fase === 'presenta' && !e.repeat) { CAR.saltarPres = true; }
    if (TECLAS[k]) { E.teclas.add(TECLAS[k]); e.preventDefault(); }
    if (TECLA_BOT[k] && !e.repeat) { apretar(TECLA_BOT[k]); e.preventDefault(); }
  });
  window.addEventListener('keyup', e => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (TECLAS[k]) E.teclas.delete(TECLAS[k]);
    if (TECLA_BOT[k]) soltarB(TECLA_BOT[k]);
  });
  window.addEventListener('blur', soltarTodo);
  window.addEventListener('resize', () => { PEND_RES = true; });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { Sonido.pausar(); soltarTodo(); if (ESCENA === 'carrera' && !DEMO && !PANEL && !BOT && CAR && CAR.fase !== 'final') abrirPanel('pausa'); }
    else { Sonido.seguir(); ultimo = 0; }
  });
}
// ---------- pantalla: el lado corto mide 360 unidades ----------
function redimensionar() {
  DPR = window.devicePixelRatio || 1;
  CSSW = window.innerWidth; CSSH = window.innerHeight;
  const u = Math.min(CSSW, CSSH) / 360;
  W = CSSW / u; H = CSSH / u;
  const dU = Math.min(DPR, 2);
  S = u * dU;
  cvUI.width = Math.round(CSSW * dU); cvUI.height = Math.round(CSSH * dU);
  for (const c of [cvGL, cvUI]) { c.style.width = CSSW + 'px'; c.style.height = CSSH + 'px'; c.style.left = '0px'; c.style.top = '0px'; }
  gu = cvUI.getContext('2d');
  R.tamano(CSSW, CSSH, DPR);
  _sellos.clear(); _txtC.clear();
  if (ESCENA === 'intro' && INTRO && !INTRO.listo) { const t = INTRO.t; INTRO = IntroJXS.crear({ W, H, presenta: PRESENTA[IDIOMA] || 'presenta', vibrar: p => vibrar(p), estilo: ESTILO_HOJALATA }); INTRO.t = t; }
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
    if (OP.calidad === 'auto' && !PRUEBA && ESCENA === 'carrera' && real < 0.5) {
      CAL.t += real; CAL.n++;
      if (CAL.n >= 90) { const m = CAL.t / CAL.n * 1000; if (m > 30 && CAL.nivel !== 'baja') { CAL.nivel = CAL.nivel === 'alta' ? 'media' : 'baja'; aplicarCalidad(); } CAL.t = 0; CAL.n = 0; }
    }
  } catch (e) { registrarError(e); }
}
function registrarError(e) { const s = String(e && e.stack || e); if (ERRORES.length < 20) ERRORES.push(s); console.error(e); }
function actualizar(dt) {
  T += dt;
  if (TELON.fase === 1) { TELON.t += dt / 0.38; if (TELON.t >= 1) { TELON.t = 1; TELON.fase = 2; const f = TELON.alMedio; TELON.alMedio = null; if (f) f(); } }
  else if (TELON.fase === 2) { TELON.t -= dt / 0.38; if (TELON.t <= 0) { TELON.t = 0; TELON.fase = 0; } }
  if (ESCENA === 'intro') { INTRO.pasar(dt); if (INTRO.listo && !TELON.fase) { Sonido.callar = false; irA('idioma'); } return; }
  if (ESCENA === 'escena' && ESC_H) { pasoEscena(dt); pasoParticulas(dt); }
  else if (CAR && (ESCENA === 'carrera' || DEMO) && !(PANEL && !DEMO)) {
    ACUM += dt * TURBO;
    let n = 0;
    const lim = DEMO ? 3 : 8 * TURBO;
    while (ACUM >= PASO && n < lim) { const inp = DEMO ? null : leerEntrada(); pasoCarrera(PASO, inp); if (DEMO) camaraDemo(PASO); else camaraCarrera(PASO); ACUM -= PASO; n++; }
    if (ACUM > PASO * 4) ACUM = 0;
    actualizarAutosRender(dt);
    particulasAutos(dt);
    pasoParticulas(dt);
    if (!DEMO && ESCENA === 'carrera') {
      const A = CAR.yo, vivo = CAR.fase !== 'presenta' && !CAR.terminada;
      Sonido.motor(vivo); if (vivo) Sonido.motorSet(Math.abs(A.vf), A.turboT > 0, A.enAire);
      Sonido.derrape(vivo && A.derr.on && !A.enAire, A.derr.nivel);
    }
  }
  Sonido.tic();
}
// la cámara de la carrera de fondo: de costado, siguiendo a uno
function camaraDemo(dt) {
  const K = CAR, c = R.cam, A = K.autos[Math.floor(T / 9) % K.autos.length], M = A.auto.M;
  const m = marcoEn(K.C, A.s), lado = Math.sin(T * 0.11) > 0 ? 1 : -1, ap = W > H;
  const ox = M[12] - m.tx * 2.2 + m.rx * lado * 2.6, oy = M[13] + 1.0, oz = M[14] - m.tz * 2.2 + m.rz * lado * 2.6;
  if (!K.camPos || K.demoA !== A) { K.camPos = [ox, oy, oz]; K.demoA = A; }
  const k = 1 - Math.exp(-4 * dt);
  K.camPos[0] += (ox - K.camPos[0]) * k; K.camPos[1] += (oy - K.camPos[1]) * k; K.camPos[2] += (oz - K.camPos[2]) * k;
  c.x = K.camPos[0]; c.y = K.camPos[1]; c.z = K.camPos[2]; c.tx = M[12] + m.tx * 0.8; c.ty = M[13] + 0.3; c.tz = M[14] + m.tz * 0.8; c.fovY = ap ? 0.7 : 0.95; c.cerca = 0.08; c.lejos = 220;
  R.foco = Math.hypot(c.x - c.tx, c.y - c.ty, c.z - c.tz); R.rango = 5; R.centroD = [M[12], M[13], M[14]]; R.radioD = 10; R.veloc = 0;
}
function dibujar() {
  const g = gu;
  ZONAS = [];
  g.setTransform(S, 0, 0, S, 0, 0);
  g.clearRect(0, 0, W, H);
  R.veloc = ESCENA === 'carrera' && !DEMO ? R.veloc : 0; R.fundido = 0; R.dof = 1;
  if (ESCENA === 'intro' || ESCENA === 'carga') {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.clearColor(0.1, 0.08, 0.12, 1); gl.clear(gl.COLOR_BUFFER_BIT);
    if (INTRO) { INTRO.dibujar(g); zona(0, 0, W, H, saltarIntro); }
    dibujarTelon(g); resolverClics(); ZONAS_PREV = ZONAS;
    return;
  }
  if (ESCENA === 'vista') { R.vaciarInst(); R.dibujar(T, []); R.post(T); }
  else if (ESCENA === 'escena' && ESC_H) { dibujarEscena3D(); dibujarEscena2D(g); }
  else if (ESCENA === 'carrera' && CAR && !DEMO) {
    R.radioD = 12; instanciasCarrera(); R.dibujar(T, autosParaDibujar()); R.post(T);
    const sh = window.__juego.sinHud;
    if (sh !== true && sh !== 'hud') hudCarrera(g);
    if (sh !== true && sh !== 'ctl' && enCarreraLibre()) dibujarControles(g);
  } else {
    if (CAR && DEMO && CAR.S.E !== R.E) empezarDemo();
    if (CAR && (DEMO || ESCENA === 'resultado')) { instanciasCarrera(); R.dibujar(T, autosParaDibujar()); R.fundido = ESCENA === 'titulo' ? 0 : ESCENA === 'resultado' ? 0.25 : 0.18; R.post(T); }
    else { gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.clearColor(0.1, 0.08, 0.12, 1); gl.clear(gl.COLOR_BUFFER_BIT); }
    ({ idioma: escenaIdioma, titulo: escenaTitulo, historia: escenaHistoria, resultado: escenaResultado, rapida: escenaRapida, contra: escenaContra, desafio: escenaDesafio, creditos: escenaCreditos, portada: dibujarPortada, letras: escenaLetras }[ESCENA] || (() => { }))(g);
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
// ---------- el logo de lata ----------
function logoHojalata(g, cx, cy, tam, t) {
  const s = 'HOJALATA', k = tam * 0.07, w = anchoLetras(s) * k + tam * 0.1 * (s.length - 1);
  const st = sello('logo' + tam.toFixed(1), w + tam * 0.6, tam * 1.3, b => {
    const pos = []; let x = tam * 0.3;
    for (let i = 0; i < s.length; i++) { const cw = anchoLetras(s[i]) * k; pos.push(x); x += cw + tam * 0.1; }
    const capa = (dx, dy, lw, est) => { for (let i = 0; i < s.length; i++) { const { p } = caminoLetras(s[i], k, false, 1); b.save(); b.translate(pos[i] + dx, tam * 0.3 + dy + (i % 2) * tam * 0.04); b.rotate((hash2(i, 5) - 0.5) * 0.08); b.lineCap = 'round'; b.lineJoin = 'round'; b.lineWidth = lw; b.strokeStyle = est; b.stroke(p); b.restore(); } };
    capa(tam * 0.04, tam * 0.08, tam * 0.3, 'rgba(20,14,30,0.6)');
    capa(0, 0, tam * 0.3, TINTA);
    const gr = b.createLinearGradient(0, tam * 0.3, 0, tam * 1.05); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.42, '#c9ced8'); gr.addColorStop(0.5, '#7a808c'); gr.addColorStop(1, '#e8ebf0');
    capa(0, 0, tam * 0.21, gr);
    capa(0, 0, tam * 0.085, ROJO);
    capa(-tam * 0.012, -tam * 0.03, tam * 0.025, 'rgba(255,255,255,0.8)');
  });
  g.save(); g.translate(cx, cy); g.rotate(Math.sin(t * 1.3) * 0.015);
  g.drawImage(st, -st.width / S / 2, -st.height / S / 2, st.width / S, st.height / S);
  g.save(); g.translate(st.width / S / 2 - tam * 0.1, -tam * 0.38); g.rotate(t * 2.5); icono(g, 'llave', 0, 0, tam * 0.42, ORO); g.restore();
  g.restore();
}
function escenaTitulo(g) {
  const ap = W > H, tam = Math.min(ap ? 62 : 58, W / 6.6), yT = ap ? H * 0.17 : H * 0.15;
  g.fillStyle = 'rgba(16,12,24,0.18)'; g.fillRect(0, 0, W, H);
  logoHojalata(g, W / 2, yT, tam, T);
  cinta(g, W / 2, yT + tam * 0.62, tr('subtitulo'), { tam: 11, c: AZUL, max: W - 60 });
  const cy = ap ? H * 0.5 : H * 0.47;
  botonGrande(g, W / 2, cy, ap ? 230 : 250, ap ? 56 : 64, tr('historia'), () => irA('historia'), { c: ROJO });
  const bw = Math.min(W - 70, 250), bh = 38, x0 = W / 2 - bw / 2;
  let y = cy + (ap ? 42 : 52);
  const filas = [[tr('rapida'), () => irA('rapida'), 'bandera', AZUL], [tr('contra'), () => irA('contra'), 'reloj', VERDE], [tr('desafioDia'), () => irA('desafio'), 'calendario', AMARILLO]];
  if (ap) { const w3 = (Math.min(W - 40, 580) - 16) / 3, x3 = W / 2 - (w3 * 3 + 16) / 2; filas.forEach(([s, f, ic, c], i) => boton(g, x3 + i * (w3 + 8), y, w3, bh, s, f, { ic, c, tam: 12 })); y += bh + 12; }
  else filas.forEach(([s, f, ic, c]) => { boton(g, x0, y, bw, bh, s, f, { ic, c, tam: 13 }); y += bh + 10; });
  const sw = (Math.min(W - 70, 250) - 10) / 2;
  boton(g, W / 2 - sw - 5, y + 2, sw, 32, tr('opciones'), () => abrirPanel('opciones'), { ic: 'engranaje', tam: 10.5, sombra: 2.5 });
  boton(g, W / 2 + 5, y + 2, sw, 32, tr('controles'), () => abrirPanel('controles'), { ic: 'mando', tam: 10.5, sombra: 2.5 });
  boton(g, W - 46, 12, 36, 36, null, () => abrirPanel('idioma'), { ic: 'globo', it: 15, sombra: 2.5 });
  txtR(g, 'JXSTUDIOS', W / 2, H - 14, { tam: 10, c: CREMA, al: 0.5 });
}
function escenaIdioma(g) {
  g.fillStyle = 'rgba(16,12,24,0.45)'; g.fillRect(0, 0, W, H);
  const tam = Math.min(46, W / 8), yT = H * 0.09;
  logoHojalata(g, W / 2, yT, tam, T);
  const cods = IDIOMAS.map(l => l[0]), per = 1.6, i = Math.floor(T / per) % cods.length, k = (T % per) / per, a = clamp(Math.min(k / 0.15, (1 - k) / 0.15), 0, 1);
  const yP = yT + tam * 0.7, viejo = IDIOMA;
  IDIOMA = cods[i]; g.globalAlpha = a; cinta(g, W / 2, yP, ELEGI_IDIOMA[cods[i]], { tam: 11, c: AZUL, max: W - 50 }); g.globalAlpha = 1; IDIOMA = viejo;
  const port = H > W * 1.2, cols = port ? 2 : 3, filas = Math.ceil(IDIOMAS.length / cols), gap = 8;
  const libre = H - (yP + 44) - 16, bh = clamp(Math.floor((libre - gap * (filas - 1)) / filas), 24, 40), y0 = yP + 44 + Math.max(0, (libre - (filas * bh + gap * (filas - 1))) * 0.35), bw = Math.floor(Math.min(port ? 160 : 170, (W - 24 - gap * (cols - 1)) / cols));
  const x0 = W / 2 - (cols * bw + (cols - 1) * gap) / 2, resto = IDIOMAS.length % cols;
  IDIOMAS.forEach(([cod, nom], j) => {
    const f = Math.floor(j / cols), ultima = resto && f === filas - 1;
    const bx = x0 + (j % cols) * (bw + gap) + (ultima ? (cols - resto) * (bw + gap) / 2 : 0), by = y0 + f * (bh + gap);
    botonIdioma(g, bx, by, bw, bh, cod, nom, () => elegirIdioma(cod), cod === IDIOMA);
  });
}
function encabezado(g, titulo, col) {
  cinta(g, Math.min(W / 2, 16 + (medir(titulo, 14, 1) + 34) / 2 + 10), 14, titulo, { tam: 14, c: col || ROJO, max: W - 140 });
  boton(g, W - 102, 12, 90, 32, tr('volver'), () => irA('titulo'), { ic: 'atras', tam: 11, sombra: 2.5 });
}
// la historia: seis tarjetas, una por pista
function escenaHistoria(g) {
  g.fillStyle = 'rgba(16,12,24,0.45)'; g.fillRect(0, 0, W, H);
  encabezado(g, tr('historiaTit'));
  const ap = W > H, cols = ap ? 3 : 2, n = CAPITULOS.length, gap = 10, top = 62, bw = Math.min(ap ? 200 : 168, (W - 24 - gap * (cols - 1)) / cols);
  const filas = Math.ceil(n / cols), bh = Math.min(ap ? (H - top - 16 - gap * (filas - 1)) / filas : 150, (H - top - 24 - gap * (filas - 1)) / filas);
  const x0 = W / 2 - (cols * bw + (cols - 1) * gap) / 2;
  CAPITULOS.forEach((C, i) => {
    const x = x0 + (i % cols) * (bw + gap), y = top + Math.floor(i / cols) * (bh + gap);
    const abierto = i <= PROG.cap, gan = PROG.ganados[i], P = PISTAS[C.pista];
    const fn = abierto ? () => jugarCapitulo(i) : null;
    const ap2 = !!fn && apretado(x, y, bw, bh), d = ap2 ? 2 : 0;
    chapa(g, x, y + d, bw, bh, abierto ? (gan != null ? '#d8eec8' : CREMA) : '#8a8f9a', { r: 10, sombra: ap2 ? 1 : 4, remaches: true });
    txt(g, tr('cap') + ' ' + (i + 1), x + 14, y + 18 + d, { tam: 10, c: ROJO, b: null, al: 0, max: bw - 28 });
    const col = ['#d9a46a', '#7ab0c8', '#bfe6ff', '#5aa04a', '#7a5034', '#a82a2a'][i];
    g.fillStyle = col; caminoRedondo(g, x + 12, y + 28 + d, bw - 24, bh * 0.42, 6); g.fill();
    icono(g, ['auto', 'casa', 'pompa', 'estrella', 'llave', 'trofeo'][i], x + bw / 2, y + 28 + bh * 0.21 + d, Math.min(28, bh * 0.25), CREMA);
    txt(g, tr('pista_' + P.id), x + bw / 2, y + bh * 0.42 + 42 + d, { tam: 11, c: TINTA, b: null, al: 0.5, max: bw - 18 });
    if (gan != null) { medallaMini(g, x + bw / 2, y + bh - 18 + d, gan); }
    else if (!abierto) icono(g, 'candado', x + bw / 2, y + bh - 18 + d, 16, TINTA);
    else txtR(g, tr('correr'), x + bw / 2, y + bh - 18 + d, { tam: 12, c: ROJO, osc: 'rgba(255,255,255,0.6)', al: 0.5, max: bw - 14 });
    if (fn) zona(x, y, bw, bh, () => { Sonido.boton(); fn(); });
  });
}
function medallaMini(g, x, y, p) { const col = p === 0 ? ORO : p === 1 ? PLATA : '#c87a4a'; g.fillStyle = col; g.beginPath(); g.arc(x, y, 11, 0, TAU); g.fill(); g.lineWidth = 1.5; g.strokeStyle = TINTA; g.stroke(); txt(g, String(p + 1), x, y, { tam: 11, c: TINTA, b: null, al: 0.5 }); }
function escenaResultado(g) {
  const Rz = RES, r = Rz.r; Rz.t += DT;
  g.fillStyle = 'rgba(16,12,24,0.55)'; g.fillRect(0, 0, W, H);
  const w = Math.min(W - 24, 350), x = W / 2 - w / 2, y = Math.max(30, H * 0.08), h = Math.min(H - y - 20, 470);
  marco(g, x, y, w, h, null);
  const k = rebote(clamp(Rz.t / 0.35, 0, 1)), m = r.cfg.modo;
  g.save(); g.translate(W / 2, y + 40); g.scale(k, k);
  const tit = m === 'contra' ? tr('tiempoTotal') + ' ' + fmtCrono(r.tiempo) : r.puesto === 0 ? tr('ganaste') : r.puesto <= 2 ? tr('podio') : tr('puestoN', r.puesto + 1);
  cinta(g, 0, -18, tit, { tam: 18, c: r.puesto === 0 || m === 'contra' ? VERDE : r.puesto <= 2 ? AZUL : ROJO, max: w - 40 });
  g.restore();
  let yy = y + 82;
  if (m === 'contra') {
    txt(g, tr('mejorVuelta') + ': ' + fmtCrono(r.mejor), W / 2, yy, { tam: 13, c: TINTA, b: null, al: 0.5 }); yy += 26;
    r.vueltas.forEach((t, i) => { txt(g, tr('vuelta') + ' ' + (i + 1) + ': ' + fmtCrono(t), W / 2, yy, { tam: 12, c: TINTA, b: null, al: 0.5 }); yy += 22; });
    if (r.record) { cinta(g, W / 2, yy, tr('nuevoRecord'), { tam: 12, c: ROJO }); yy += 40; }
  } else {
    const fila = Math.min(42, (h - 170) / 6);
    r.orden.forEach((o, i) => {
      const yo = o.humano, fy = yy + i * fila;
      if (yo) { g.fillStyle = 'rgba(242,182,50,0.45)'; caminoRedondo(g, x + 12, fy - fila / 2 + 2, w - 24, fila - 4, 6); g.fill(); }
      txtR(g, String(i + 1), x + 30, fy, { tam: 16, c: i === 0 ? ORO : TINTA, osc: 'rgba(255,255,255,0.5)', al: 0.5 });
      caraUI(g, o.id, x + 62, fy, Math.min(15, fila * 0.38), i === 0 ? 1 : 0);
      txt(g, tr('pj_' + o.id), x + 84, fy, { tam: 12, c: TINTA, b: null, al: 0, max: w * 0.4 });
      txt(g, (o.est ? '~' : '') + fmtCrono(o.t), x + w - 22, fy, { tam: 11, c: TINTA, b: null, al: 1 });
    });
    yy += fila * r.orden.length + 8;
    if (m === 'historia') { cinta(g, W / 2, yy, tr(r.paso ? (r.cfg.pista === 5 ? 'ganasteVidriera' : 'pasaste') : (r.cfg.pista === 5 ? 'tenesQueGanar' : 'necesitasPodio')), { tam: 11, c: r.paso ? VERDE : ROJO, max: w - 40 }); yy += 38; }
    if (r.desafio != null) { cinta(g, W / 2, yy, tr(r.desafio ? 'desafioOk' : 'desafioNo'), { tam: 11, c: r.desafio ? VERDE : '#8a8f9a', max: w - 40 }); yy += 38; }
    if (r.desbloqueo != null) { cinta(g, W / 2, yy, tr('nuevaPista') + ': ' + tr('pista_' + PISTAS[r.desbloqueo].id), { tam: 10, c: AZUL, max: w - 30 }); }
  }
  const bw = (w - 40) / 2, by = y + h - 50;
  boton(g, x + 14, by, bw, 36, tr('menu'), () => { RES = null; irMenu('titulo'); }, { ic: 'casa', tam: 12 });
  boton(g, x + 26 + bw, by, bw, 36, tr('seguir'), () => { const f = Rz.seguir; RES = null; if (f) f(); }, { ic: 'play', c: VERDE, tam: 12 });
}
// selector en ronda
function ronda(L, v, d) { const i = L.indexOf(v); return L[((i < 0 ? 0 : i) + d + L.length) % L.length]; }
function selector(g, x, y, w, etiqueta, valor, menos, mas, extra) {
  txtR(g, etiqueta, x + w / 2, y, { tam: 10, c: AMARILLO, al: 0.5 });
  boton(g, x, y + 10, 36, 36, null, menos, { ic: 'flechaIzq', it: 14, sombra: 2.5 });
  boton(g, x + w - 36, y + 10, 36, 36, null, mas, { ic: 'flechaDer', it: 14, sombra: 2.5 });
  chapa(g, x + 42, y + 10, w - 84, 36, CREMA, { r: 8, sombra: 2.5 });
  if (extra) extra(x + 42, y + 10, w - 84); else txt(g, valor, x + w / 2, y + 28, { tam: 12, c: TINTA, b: null, al: 0.5, max: w - 96 });
}
let SEL = null;
function selDefecto() { return { pj: 'chispa', pista: 0, vueltas: 3, dif: 1 }; }
function pjsAbiertos() { return ORDEN_PJ.filter(id => id !== 'turbo' || PROG.fin); }
function pistasAbiertas() { const L = []; for (let i = 0; i <= Math.min(PROG.cap, PISTAS.length - 1); i++) L.push(i); return L; }
const pjExtra = (g) => (x2, y2, w2) => { caraUI(g, SEL.pj, x2 + 20, y2 + 18, 13); txt(g, tr('pj_' + SEL.pj), x2 + 38 + (w2 - 38) / 2, y2 + 18, { tam: 11, c: TINTA, b: null, al: 0.5, max: w2 - 44 }); };
function escenaRapida(g) {
  SEL = SEL || selDefecto();
  g.fillStyle = 'rgba(16,12,24,0.45)'; g.fillRect(0, 0, W, H);
  encabezado(g, tr('rapida'), AZUL);
  const ap = W > H, w = ap ? Math.min((W - 60) / 2, 320) : Math.min(W - 30, 330), pjs = pjsAbiertos(), ps = pistasAbiertas();
  if (!ps.includes(SEL.pista)) SEL.pista = 0; if (!pjs.includes(SEL.pj)) SEL.pj = 'chispa';
  const col = i => ap ? [W / 2 - w - 10 + (i < 2 ? 0 : w + 20), 70 + (i % 2) * 64] : [W / 2 - w / 2, Math.max(66, H * 0.12) + i * 64];
  let [x, y] = col(0); selector(g, x, y, w, tr('autito'), '', () => { SEL.pj = ronda(pjs, SEL.pj, -1); }, () => { SEL.pj = ronda(pjs, SEL.pj, 1); }, pjExtra(g));
  [x, y] = col(1); selector(g, x, y, w, tr('pista'), tr('pista_' + PISTAS[SEL.pista].id), () => { SEL.pista = ronda(ps, SEL.pista, -1); }, () => { SEL.pista = ronda(ps, SEL.pista, 1); });
  [x, y] = col(2); selector(g, x, y, w, tr('vueltas'), String(SEL.vueltas), () => { SEL.vueltas = ronda([2, 3, 5], SEL.vueltas, -1); }, () => { SEL.vueltas = ronda([2, 3, 5], SEL.vueltas, 1); });
  [x, y] = col(3); selector(g, x, y, w, tr('dificultad'), tr(SEL.dif < 0.97 ? 'facil' : SEL.dif > 1.03 ? 'dificil' : 'normal'), () => { SEL.dif = ronda([0.92, 1, 1.06], SEL.dif, -1); }, () => { SEL.dif = ronda([0.92, 1, 1.06], SEL.dif, 1); });
  if (!PROG.fin) txt(g, tr('turboBloq'), W / 2, ap ? 210 : col(3)[1] + 62, { tam: 9, c: CREMA, b: TINTA, al: 0.5, max: W - 30 });
  botonGrande(g, W / 2, ap ? H - 50 : Math.min(H - 56, col(3)[1] + 110), 220, 56, tr('correr'), () => jugarRapida(SEL), { c: AZUL });
}
function escenaContra(g) {
  SEL = SEL || selDefecto();
  g.fillStyle = 'rgba(16,12,24,0.45)'; g.fillRect(0, 0, W, H);
  encabezado(g, tr('contra'), VERDE);
  const w = Math.min(W - 30, 330), x = W / 2 - w / 2, pjs = pjsAbiertos(), ps = pistasAbiertas();
  if (!ps.includes(SEL.pista)) SEL.pista = 0; if (!pjs.includes(SEL.pj)) SEL.pj = 'chispa';
  let y = Math.max(66, H * 0.12);
  const tam = 11, L = partir(tr('contraExplica'), w - 24, tam, 0);
  chapa(g, x, y, w, L.length * altoRenglon(tam) + 20, CREMA, { r: 8, sombra: 3 });
  L.forEach((l, i) => txt(g, l, W / 2, y + 10 + altoRenglon(tam) * (i + 0.5), { tam, c: TINTA, b: null, al: 0.5, peso: 0, max: w - 20 }));
  y += L.length * altoRenglon(tam) + 34;
  selector(g, x, y, w, tr('autito'), '', () => { SEL.pj = ronda(pjs, SEL.pj, -1); }, () => { SEL.pj = ronda(pjs, SEL.pj, 1); }, pjExtra(g)); y += 64;
  selector(g, x, y, w, tr('pista'), tr('pista_' + PISTAS[SEL.pista].id), () => { SEL.pista = ronda(ps, SEL.pista, -1); }, () => { SEL.pista = ronda(ps, SEL.pista, 1); }); y += 70;
  const f = cargarFantasma(SEL.pista), rec = PROG.mejores['c' + SEL.pista];
  txtR(g, tr('record') + ': ' + (rec ? fmtCrono(rec) : '--'), W / 2, y, { tam: 13, c: AMARILLO, al: 0.5 });
  txtR(g, tr('mejorVuelta') + ': ' + (f ? fmtCrono(f.t) : '--'), W / 2, y + 22, { tam: 11, c: CREMA, al: 0.5 });
  botonGrande(g, W / 2, Math.min(H - 56, y + 82), 220, 56, tr('correr'), () => jugarContra(SEL), { c: VERDE });
}
function escenaDesafio(g) {
  const D = desafioDeHoy(), hecho = !!PROG.desafios[D.dia];
  g.fillStyle = 'rgba(16,12,24,0.45)'; g.fillRect(0, 0, W, H);
  encabezado(g, tr('desafioDia'), AMARILLO);
  const ap = W > H, w = Math.min(W - 30, 330), x = ap ? W / 2 - w - 20 : W / 2 - w / 2, y = Math.max(76, H * 0.15), h = 250;
  marco(g, x, y, w, h, String(D.dia).replace(/(\d{4})(\d{2})(\d{2})/, '$3/$2/$1'));
  const tam = 15, L = partir(tr(D.plantilla.k), w - 30, tam, 1), cx = x + w / 2;
  L.forEach((l, i) => txt(g, l, cx, y + 36 + altoRenglon(tam) * (i + 0.5), { tam, c: TINTA, b: null, al: 0.5, max: w - 24 }));
  caraUI(g, D.pj, cx - 60, y + 140, 26, 5); txt(g, tr('pj_' + D.pj), cx - 60, y + 180, { tam: 11, c: TINTA, b: null, al: 0.5, max: 110 });
  icono(g, 'bandera', cx + 50, y + 132, 30, TINTA); txt(g, tr('pista_' + PISTAS[D.pista].id), cx + 50, y + 180, { tam: 11, c: TINTA, b: null, al: 0.5, max: 130 });
  if (hecho) cinta(g, cx, y + 204, tr('desafioHecho'), { tam: 11, c: VERDE });
  const ox = ap ? W / 2 + 20 + w / 2 : W / 2, oy = ap ? y + 60 : y + h + 28;
  txtR(g, tr('rachaDesafios') + ': ' + PROG.rachaDesafio, ox, oy, { tam: 12, c: AMARILLO, al: 0.5, max: w });
  botonGrande(g, ox, ap ? y + 150 : Math.min(H - 56, y + h + 92), 220, 56, tr('correr'), () => jugarDesafio(), { c: AMARILLO });
}
function escenaCreditos(g) {
  CRED.t += DT;
  g.fillStyle = 'rgba(16,12,24,0.62)'; g.fillRect(0, 0, W, H);
  logoHojalata(g, W / 2, H * 0.17, Math.min(54, W / 7.2), T);
  const L = ['cred1', 'cred2', 'cred3', 'cred4'];
  L.forEach((k, i) => { const a = clamp((CRED.t - 0.6 - i * 0.7) / 0.5, 0, 1); g.globalAlpha = a; txtR(g, tr(k), W / 2, H * 0.36 + i * 36, { tam: 13, c: i === 3 ? AMARILLO : CREMA, al: 0.5, max: W - 30 }); g.globalAlpha = 1; });
  ORDEN_PJ.forEach((id, i) => caraUI(g, id, W / 2 + (i - 2.5) * 46, H * 0.7, 18, 1));
  txtR(g, 'JXSTUDIOS', W / 2, H * 0.82, { tam: 22, c: ROJO, al: 0.5 });
  if (CRED.t > 3) { if (Math.sin(T * 4) > 0) txtR(g, tr('toca'), W / 2, H - 26, { tam: 10, c: CREMA, al: 0.5 }); zona(0, 0, W, H, () => irMenu('titulo')); }
}
function panelPausa(g, Pn) {
  fondoOscuro(g);
  const w = Math.min(W - 40, 270), bh = 36, gap = 10, h = 60 + 5 * (bh + gap), x = (W - w) / 2, y = Math.max(24, (H - h) / 2) + (1 - entrada(Pn)) * 30;
  marco(g, x, y, w, h, tr('pausa'));
  const bs = [[tr('seguir'), () => cerrarPanel(), { c: VERDE, ic: 'play' }], [tr('reintentar'), () => { PANEL = null; const c = CAR.cfg; correr(Object.assign({}, c, { sinPresentacion: true })); }, { ic: 'repetir' }], [tr('opciones'), () => abrirPanel('opciones', { volver: 'pausa' }), { ic: 'engranaje' }],
    [tr('controles'), () => abrirPanel('controles', { volver: 'pausa' }), { ic: 'mando' }], [tr('abandonar'), () => abrirPanel('confirmar', { k: 'seguroAbandonar', si: () => { PANEL = null; Sonido.motor(false); Sonido.derrape(false); irMenu('titulo'); } }), { ic: 'casa', c: '#f0b8a0' }]];
  bs.forEach((b, i) => boton(g, x + 16, y + 30 + i * (bh + gap), w - 32, bh, b[0], b[1], Object.assign({ tam: 12 }, b[2])));
}
function escenaLetras(g) {
  g.fillStyle = CREMA; g.fillRect(0, 0, W, H);
  const filas = ['ABCDEFGHIJKLM', 'NOPQRSTUVWXYZ', '0123456789', '¡!¿?.,:;-–\'"«»()/+=%#&·…°*<>×', 'ÁÀÂÃÄÅÉÈÊËÍÌÎÏİ', 'ÓÒÔÕÖÚÙÛÜÑÇŞĞÝŸ', 'HOJALATA ¡YA!'];
  filas.forEach((f, i) => txtR(g, f, 12, 40 + i * 44, { tam: 26, c: ROJO, b: TINTA, al: 0, max: W - 24 }));
  logoHojalata(g, W / 2, 400, 54, 0);
}
// ---------- portada 9:16 ----------
function armarPortada() {
  ESCENA = 'portada'; DEMO = false;
  nuevaCarrera({ pista: 5, corredores: ['chispa', 'turbo', 'lata', 'patita', 'bicho'], yo: 'chispa', vueltas: 3, modo: 'demo', demo: true, semilla: 3, sinPresentacion: true });
  const C = CAR.C, L = CAR.autos, s0 = +(PARAM.get('s') || 52);
  const pos = [[0, -0.5, 0.14], [-3.0, 0.6, 0.12], [-5.6, -1.1, 0.05], [-7.8, 0.4, 0], [-10.5, -0.4, 0]];
  L.forEach((A, k) => { A.s = s0 + pos[k][0]; A.d = pos[k][1]; A.psi = pos[k][2]; A.vf = 12; const m = marcoEn(C, A.s); A.y = m.py + m.ry * A.d; });
  L[0].derr.on = true; L[0].derr.dir = 1; L[0].derr.nivel = 2; L[1].turboT = 1;
  actualizarAutosRender(0);
  for (let k = 0; k < 120; k++) { const sd = k % 2 ? 1 : -1, p = posMundo(L[0], sd * 0.27 + rnd(-0.08, 0.08), rnd(0.02, 0.2), -0.3 - rnd(0, 1.2)); particula(p[0], p[1], p[2], 0, 0, 0, 999, rnd(0.05, 0.11), k % 3 ? '#ff9a2a' : '#ffe08a', 4, 0, 0, false); }
  for (let k = 0; k < 30; k++) { const p = posMundo(L[1], rnd(-0.08, 0.08), 0.2, -0.55 - rnd(0, 0.5)); particula(p[0], p[1], p[2], 0, 0, 0, 999, rnd(0.06, 0.12), k % 2 ? '#ffd23f' : '#ff7a1a', 4.5, 0, 0, false); }
}
function dibujarPortada(g) {
  const L = CAR.autos, A = L[0], M = A.auto.M;
  actualizarAutosRender(0);
  for (const X of L) { X.auto.hablando = false; }
  A.auto.gesto = GESTOS.decidido; L[1].auto.gesto = GESTOS.enojado; posarAuto(A.auto, 4); posarAuto(L[1].auto, 4);
  const fx = M[8], fz = M[10], lx = M[0], lz = M[2];
  R.cam.x = M[12] + fx * 2.0 + lx * 0.75; R.cam.y = M[13] + 0.32; R.cam.z = M[14] + fz * 2.0 + lz * 0.75;
  const T2 = L[1].auto.M; R.cam.tx = M[12] - fx * 1.6 + (T2[12] - M[12]) * 0.3; R.cam.ty = M[13] + 0.95; R.cam.tz = M[14] - fz * 1.6 + (T2[14] - M[14]) * 0.3; R.cam.fovY = 1.05; R.cam.cerca = 0.05; R.cam.lejos = 220;
  R.foco = Math.hypot(R.cam.x - M[12], R.cam.y - M[13], R.cam.z - M[14]); R.rango = 2.6; R.centroD = [M[12], M[13], M[14]]; R.radioD = 10; R.veloc = 0.3;
  instanciasCarrera(); R.dibujar(4, autosParaDibujar()); R.post(4);
  logoHojalata(g, W / 2, H * 0.11, Math.min(64, W / 6.4), 0);
  cinta(g, W / 2, H * 0.11 + 44, tr('subtitulo'), { tam: 12, c: AZUL, max: W - 50 });
  txtR(g, 'JXSTUDIOS', W / 2, H * 0.94, { tam: 15, c: CREMA, al: 0.5 });
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
  if (PARAM.has('todo')) { PROG.cap = 6; PROG.fin = true; }
  R.iniciar(); R.ponerCalidad(CAL.nivel);
  CARAS_CV = armarCaras();
  R.texCaras = GL.texturaLienzo(CARAS_CV, true);
  R.texAtlas = GL.texturaLienzo(armarAtlas(), true);
  prepararInstancias();
  redimensionar();
  prepararEntrada();
  document.getElementById('carga').style.display = 'none';
  if (PARAM.has('portada')) armarPortada();
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
  get C() { return CAR; }, get escena() { return ESCENA; }, get errores() { return ERRORES; }, get stats() { return R.stats; }, get prog() { return PROG; },
  set congelado(v) { CONGELADO = !!v; }, set turbo(v) { TURBO = v; }, set bot(v) { BOT = !!v; }, get bot() { return BOT; },
  get intro() { return INTRO && { t: INTRO.t, listo: INTRO.listo }; }, get panel() { return PANEL && PANEL.tipo; }, get escenaH() { return ESC_H && { i: ESC_H.i, n: ESC_H.lineas.length, cap: ESC_H.cap }; },
  escenaA(e) { ESCENA = e; if (e === 'intro') empezarIntro(); },
  paso(n, dib) { for (let i = 0; i < (n || 1); i++) actualizar(PASO); if (dib !== false) dibujar(); },
  dibujar() { dibujar(); },
  capitulo(i, sinEscena) { jugarCapitulo(i, sinEscena); },
  rapida(c) { jugarRapida(Object.assign(selDefecto(), c || {})); }, contra(c) { jugarContra(Object.assign(selDefecto(), c || {})); }, desafio() { jugarDesafio(); },
  escenaDe(i, cual) { ESCENA = 'escena'; empezarEscena(i, CAPITULOS[i][cual || 'antes'], () => irA('titulo')); }, avanzarEscena() { if (ESC_H) { ESC_H.letras = 999; avanzarEscena(); } }, saltarEscena() { terminarEscena(); },
  saltarPres() { if (CAR) CAR.saltarPres = true; },
  get R() { return R; }, sinHud: false,
  medir(n) { const px = new Uint8Array(4), t0 = performance.now(); for (let i = 0; i < n; i++) { actualizar(PASO); dibujar(); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); gu.getImageData(0, 0, 1, 1); } return +((performance.now() - t0) / n).toFixed(1); },
  vista(pista, c) { DEMO = false; ESCENA = 'vista'; const S = ponerPista(pista); CAR = null; R.vaciarInst(); Object.assign(R.cam, { cerca: 0.5, lejos: 600 }, c); R.foco = 60; R.rango = 400; R.centroD = [c.tx, 0, c.tz]; R.radioD = 40; R.dibujar(T, []); R.post(T); return { L: S.C.L }; },
  seguirResultado() { if (RES) { const f = RES.seguir; RES = null; if (f) f(); } },
  hojaLetras() { ESCENA = 'letras'; },
  idioma(c) { cambiarIdioma(c); }, calidad(c) { OP.calidad = c; aplicarCalidad(); }, abrir(p, d) { abrirPanel(p, d); }, cerrar() { PANEL = null; },
  posBoton(id) { const [x, y] = posCtl(id); return [x * CSSW / W, y * CSSH / H]; }, get tactil() { return TACTIL; },
  apretar(id) { apretar(id); }, soltar(id) { soltarB(id); },
  nivel() { if (!Sonido.anal) return null; const d = new Float32Array(2048); Sonido.anal.getFloatTimeDomainData(d); let p = 0, r = 0; for (const v of d) { p = Math.max(p, Math.abs(v)); r += v * v; } return { estado: Sonido.ctx.state, pico: +p.toFixed(3), rms: +Math.sqrt(r / d.length).toFixed(4), tema: Sonido.tema }; },
  estado() { if (!CAR) return { escena: ESCENA }; const A = CAR.yo; return { escena: ESCENA, fase: CAR.fase, reloj: +CAR.reloj.toFixed(1), vuelta: A.vuelta, pos: A.pos, s: +A.s.toFixed(1), d: +A.d.toFixed(2), v: +A.vf.toFixed(1), item: A.item, cuerda: +A.cuerda.toFixed(2), torn: A.tornillos, cae: !!A.cae, aire: A.enAire, autos: CAR.autos.map(a => a.id + ':' + a.vuelta + ':' + a.s.toFixed(0)).join(' '), fin: !!A.fin }; },
};
iniciar();
