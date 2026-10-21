// MANSION BUILDER — el arranque y el bucle: intro JXSTUDIOS → carga (con progreso real) → tocá para jugar → juego.
// Entrada de dedo (joystick flotante o fijo), teclado, calidad que se adapta a los FPS, bot y API de prueba.
const PRINCIPAL = { escena: 'intro', fps: 60, offline: 0, listo: false, prog: 0, pasos: [], pasoI: 0, pausa: false, ultimo: 0, intro: null, musIntro: null, resize: true };
let cvGL = null, cvUI = null, gUI = null, DPRui = 1;
const TECLAS = {};
const BOT = { activo: false, camino: null, ci: 0, dest: null, t: 0 };

function redimensionar() {
  CSSW = Math.max(200, window.innerWidth || 360); CSSH = Math.max(200, window.innerHeight || 640); DPR = window.devicePixelRatio || 1;
  W = CSSW; H = CSSH;
  UI.U = clamp(Math.min(CSSW, CSSH) / 360, 0.8, 1.7);
  DPRui = Math.min(DPR, 2.5);
  cvUI.width = Math.round(CSSW * DPRui); cvUI.height = Math.round(CSSH * DPRui); cvUI.style.width = CSSW + 'px'; cvUI.style.height = CSSH + 'px';
  if (R.cv) R.tamano(CSSW, CSSH, DPR);
  if (PRINCIPAL.escena === 'intro' && PRINCIPAL.intro) { const t = PRINCIPAL.intro.t; crearIntro(); PRINCIPAL.intro.t = t; }
}
function crearIntro() { PRINCIPAL.intro = IntroJXS.crear({ W: CSSW, H: CSSH, presenta: PRESENTA[IDIOMA] || 'presents', vibrar: p => Sonido.vibrar(p), estilo: ESTILO_MANSION }); }
function nivelInicial() {
  let n = nivelPorGPU(EQUIPO.gpu);
  if (EQUIPO.ram <= 2) n = Math.min(n, 1);
  if (EQUIPO.movil && EQUIPO.nucleos <= 4) n = Math.min(n, 1);
  return n;
}
function ponerCalidadAjuste() { R.escalaDin = 1; R.ponerCalidad(AJ.calidad < 0 ? PRINCIPAL.nivelAuto : AJ.calidad); }
function aplicarIdioma() {
  IDIOMA = AJ.idioma !== 'auto' ? AJ.idioma : (Guardado.leer('idiomaIP', null) || idiomaNavegador());
  document.documentElement.lang = IDIOMA;
}
// la carga, en pasos cortos para que la pantalla siga viva
function armarPasos() {
  const P = PRINCIPAL.pasos;
  P.push(() => { if (!R.iniciar(cvGL)) throw new Error('webgl2'); PRINCIPAL.nivelAuto = nivelInicial(); ponerCalidadAjuste(); R.tamano(CSSW, CSSH, DPR); });
  P.push(() => R.compilar());
  P.push(() => iniciarPersonajes());
  P.push(() => { const habia = cargarEstado(); armarPads(); reconstruirMundo(); PRINCIPAL.habia = habia; });
  for (let i = 0; i < NCX * NCZ; i++) P.push(() => R.actualizarTrozos(1));
  P.push(() => { R.calcularSol(); armarFantasma(); camaraJuego(1 / 60); dibujarCuadro(0); });
  P.push(() => { offline(); });
}
function correrPasos(presupuesto) {
  const P = PRINCIPAL.pasos, t0 = performance.now();
  while (PRINCIPAL.pasoI < P.length && performance.now() - t0 < presupuesto) { P[PRINCIPAL.pasoI++](); }
  PRINCIPAL.prog = PRINCIPAL.pasoI / P.length;
  if (PRINCIPAL.pasoI >= P.length && !PRINCIPAL.listo) { PRINCIPAL.listo = true; if (PRUEBA) empezarJuego(); }
}
// lo que dejaron los visitantes mientras no estabas (un tercio de lo normal, hasta 3 horas)
function offline() {
  const s = (Date.now() - (G.t || Date.now())) / 1000;
  PRINCIPAL.offline = 0;
  if (!PRINCIPAL.habia || s < 120 || G.parte < 1) return;
  const e = ECO.visita(Math.min(G.parte, PARTES.length));
  PRINCIPAL.offline = Math.floor(Math.min(s, 3 * 3600) * e.paga / e.cada * 0.3);
}
function empezarJuego() {
  if (PRINCIPAL.escena === 'juego') return;
  PRINCIPAL.escena = 'juego';
  CAM.x = JUG.x; CAM.z = JUG.z; CAM.intro = PRUEBA ? 0 : 2.6;
  Sonido.musica(true);
  if (PRINCIPAL.offline > 0 && !PRUEBA) abrirPanel('volviste');
  else if (G.diario !== hoy() && PRINCIPAL.habia && !PRUEBA) setTimeout(() => { if (!UI.panel) abrirPanel('diario'); }, 3000);
}
function borrarTodo() {
  Guardado.borrar('estado');
  G = estadoNuevo(); VIVO.armando.length = 0; VIVO.festejo = 0; PT.n = 0; UI.fests.length = 0; UI.avisos.length = 0;
  reconstruirMundo(); armarFantasma();
  UI.panel = null; guardar();
}
// ---------- entrada ----------
function entradaMundo() {
  // joystick o teclado (o bot) → dirección en el piso, según hacia dónde mira la cámara
  let jx = 0, jy = 0;
  if (UI.joy.activo) { jx = UI.joy.vx; jy = UI.joy.vy; }
  const kx = (TECLAS.ArrowRight || TECLAS.KeyD ? 1 : 0) - (TECLAS.ArrowLeft || TECLAS.KeyA ? 1 : 0), ky = (TECLAS.ArrowDown || TECLAS.KeyS ? 1 : 0) - (TECLAS.ArrowUp || TECLAS.KeyW ? 1 : 0);
  if (kx || ky) { const l = Math.hypot(kx, ky); jx = kx / l; jy = ky / l; }
  const c = Math.cos(CAM.yaw), s = Math.sin(CAM.yaw);
  return [c * jx + s * jy, -s * jx + c * jy];
}
function posToque(e) { const r = cvUI.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
const TOQUES = {};
function bajar(e) {
  e.preventDefault();
  Sonido.iniciar();
  const [x, y] = posToque(e);
  try { cvUI.setPointerCapture(e.pointerId); } catch (er) { }
  if (PRINCIPAL.escena === 'intro') { PRINCIPAL.intro.saltar(); if (PRINCIPAL.intro.listo && PRINCIPAL.musIntro) PRINCIPAL.musIntro.cortar(); if (!PRINCIPAL.musIntro && Sonido.ok() && PRINCIPAL.intro.t < 1) PRINCIPAL.musIntro = IntroJXS.jingle(Sonido.ctx, Sonido.master, ESTILO_MANSION); return; }
  if (PRINCIPAL.escena === 'carga') { if (PRINCIPAL.listo) { Sonido.efecto('clic', 0.7); empezarJuego(); } return; }
  const b = tocarUI(x, y);
  if (b) { TOQUES[e.pointerId] = { b }; return; }
  if (UI.panel) return;
  const J = UI.joy;
  if (!J.activo) {
    J.activo = true; J.id = e.pointerId;
    if (AJ.joy === 'flota') { J.x0 = x; J.y0 = y; }
    J.x = x; J.y = y; moverJoy(x, y);
  }
}
function moverJoy(x, y) {
  const J = UI.joy, r = 52 * UI.U * [0.8, 1, 1.25][AJ.joyTam] * 0.6;
  let dx = x - J.x0, dy = y - J.y0; const l = Math.hypot(dx, dy);
  if (AJ.joy === 'flota' && l > r * 1.6) { J.x0 = x - dx / l * r * 1.6; J.y0 = y - dy / l * r * 1.6; dx = x - J.x0; dy = y - J.y0; }
  const k = Math.min(1, Math.hypot(dx, dy) / r), a = Math.atan2(dy, dx);
  J.vx = k < 0.12 ? 0 : Math.cos(a) * k; J.vy = k < 0.12 ? 0 : Math.sin(a) * k;
}
function mover(e) { const J = UI.joy; if (J.activo && e.pointerId === J.id) { const [x, y] = posToque(e); moverJoy(x, y); } }
function subir(e) {
  const T0 = TOQUES[e.pointerId]; delete TOQUES[e.pointerId];
  if (T0) { const [x, y] = posToque(e), b = tocarUI(x, y); if (b && b === T0.b || (b && T0.b && b.x === T0.b.x && b.y === T0.b.y)) T0.b.f(); }
  const J = UI.joy; if (J.activo && e.pointerId === J.id) { J.activo = false; J.vx = J.vy = 0; }
}
function soltarTodo() { for (const k in TOQUES) delete TOQUES[k]; UI.joy.activo = false; UI.joy.vx = UI.joy.vy = 0; for (const k in TECLAS) TECLAS[k] = false; }
// ---------- el bot (para probar): sigue el objetivo y compra mejoras con lo que sobra ----------
function botEntrada(dt) {
  let o = VIVO.obj || objetivo();
  const P = PARTES[G.parte];
  if (!JUG.carga.length) {
    let reserva = 0;
    if (P) for (const m in P.need) if (!G.gens[m]) { const pd = PADS.find(p => p.m === m); reserva = Math.max(reserva, pd.precio() - (G.pads[pd.id] || 0)); }
    for (const id of ['ayudante', 'mochila', 'vel', 'gen_madera', 'gen_piedra', 'gen_vidrio', 'gen_marmol']) {
      const p = PADS.find(q => q.id === id);
      if (p && padActivo(p) && G.dinero - (p.precio() - (G.pads[p.id] || 0)) >= reserva && (G.pads[p.id] || G.dinero >= p.precio() - (G.pads[p.id] || 0))) { o = { x: p.x, z: p.z }; break; }
    }
  }
  if (!o) return [0, 0];
  const d = Math.hypot(o.x - JUG.x, o.z - JUG.z);
  if (d < 0.5) { BOT.camino = null; return [0, 0]; }
  BOT.t -= dt;
  if (!BOT.camino || !BOT.dest || Math.hypot(BOT.dest[0] - o.x, BOT.dest[1] - o.z) > 0.4 || BOT.t <= 0) { BOT.camino = buscarCamino(JUG.x, JUG.z, o.x, o.z) || [[o.x, o.z]]; BOT.ci = 0; BOT.dest = [o.x, o.z]; BOT.t = 1.5; }
  let w = BOT.camino[BOT.ci];
  while (w && Math.hypot(w[0] - JUG.x, w[1] - JUG.z) < 0.25 && BOT.ci < BOT.camino.length - 1) w = BOT.camino[++BOT.ci];
  if (!w) return [0, 0];
  const dx = w[0] - JUG.x, dz = w[1] - JUG.z, l = Math.hypot(dx, dz) || 1, k = Math.min(1, l / 0.4);
  return [dx / l * k, dz / l * k];
}
// ---------- el bucle ----------
const ADAPTA = { acum: 0, n: 0, bueno: 0 };
function adaptar(real) {
  ADAPTA.acum += real; ADAPTA.n++;
  if (ADAPTA.acum < 2) return;
  const fps = ADAPTA.n / ADAPTA.acum; PRINCIPAL.fps = fps; ADAPTA.acum = 0; ADAPTA.n = 0;
  if (AJ.calidad >= 0 || PRUEBA) return;
  if (fps < 40) {
    ADAPTA.bueno = 0;
    if ((R.escalaDin || 1) > 0.72) { R.escalaDin = (R.escalaDin || 1) - 0.1; R.tamano(CSSW, CSSH, DPR); }
    else if (R.calidad > 0) { R.escalaDin = 0.9; R.ponerCalidad(R.calidad - 1); }
  } else if (fps > 56) {
    if (++ADAPTA.bueno >= 3 && (R.escalaDin || 1) < 1) { ADAPTA.bueno = 0; R.escalaDin = Math.min(1, R.escalaDin + 0.1); R.tamano(CSSW, CSSH, DPR); }
  }
}
function actualizar(dt) {
  if (PRINCIPAL.escena !== 'juego' || UI.panel) return;
  const [ix, iz] = BOT.activo ? botEntrada(dt) : entradaMundo();
  actualizarJuego(dt, ix, iz);
  UI.pasar(dt);
}
function cuadro(ts) {
  requestAnimationFrame(cuadro);
  try {
    if (PRINCIPAL.resize) { PRINCIPAL.resize = false; redimensionar(); }
    const real = PRINCIPAL.ultimo ? Math.max(0, (ts - PRINCIPAL.ultimo) / 1000) : 1 / 60;
    PRINCIPAL.ultimo = ts;
    const dt = Math.min(0.05, real);
    if (GL.perdido) return;
    const g = gUI; g.setTransform(DPRui, 0, 0, DPRui, 0, 0);
    const esc = PRINCIPAL.escena;
    if (esc === 'intro' || esc === 'carga') {
      if (!PRINCIPAL.listo) correrPasos(esc === 'intro' ? 10 : 14);
      if (esc === 'intro') {
        const I = PRINCIPAL.intro; I.pasar(dt); g.clearRect(0, 0, CSSW, CSSH); I.dibujar(g);
        if (I.listo) PRINCIPAL.escena = 'carga';
      } else dibujarCarga(g, dt, PRINCIPAL.prog, PRINCIPAL.listo);
      return;
    }
    actualizar(dt);
    camaraJuego(dt);
    dibujarCuadro(VIVO.t);
    dibujarUI(g, dt, VIVO.t);
    adaptar(real);
  } catch (e) { mostrarError(e); }
}
function mostrarError(e) {
  if (PRINCIPAL.error) return; PRINCIPAL.error = e;
  console.error(e);
  const d = document.createElement('div');
  d.style.cssText = 'position:absolute;left:10px;right:10px;bottom:10px;padding:10px;background:#c0392b;color:#fff;font:13px sans-serif;border-radius:8px;z-index:9';
  d.textContent = (e && e.message === 'webgl2') ? 'Este celular no tiene WebGL2. Probá con Chrome actualizado.' : 'Error: ' + (e && e.message);
  document.body.appendChild(d);
}
function arrancar() {
  cvGL = document.getElementById('gl'); cvUI = document.getElementById('ui'); gUI = cvUI.getContext('2d');
  cargarAjustes(); aplicarIdioma();
  if (AJ.idioma === 'auto' && !PRUEBA) idiomaPorIP().then(l => { if (!l) return; Guardado.escribir('idiomaIP', l); if (AJ.idioma === 'auto' && l !== IDIOMA) { IDIOMA = l; document.documentElement.lang = l; } });
  redimensionar();
  crearIntro();
  if (PRUEBA && !PARAM.has('intro')) PRINCIPAL.escena = 'carga';
  armarPasos();
  const carga = document.getElementById('carga'); if (carga) carga.remove();
  cvUI.addEventListener('pointerdown', bajar, { passive: false });
  cvUI.addEventListener('pointermove', mover, { passive: true });
  cvUI.addEventListener('pointerup', subir); cvUI.addEventListener('pointercancel', subir);
  window.addEventListener('resize', () => { PRINCIPAL.resize = true; });
  window.addEventListener('orientationchange', () => { PRINCIPAL.resize = true; });
  window.addEventListener('blur', soltarTodo);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { soltarTodo(); if (PRINCIPAL.escena === 'juego') guardar(); Sonido.pausar(true); } else Sonido.pausar(false); });
  window.addEventListener('pagehide', () => { if (PRINCIPAL.escena === 'juego') guardar(); });
  window.addEventListener('keydown', e => { TECLAS[e.code] = true; if (e.code === 'Escape' && PRINCIPAL.escena === 'juego') { if (UI.panel) cerrarPanel(); else abrirPanel('ajustes'); } if ((e.code === 'Space' || e.code === 'Enter') && PRINCIPAL.escena === 'carga' && PRINCIPAL.listo) { Sonido.iniciar(); empezarJuego(); } });
  window.addEventListener('keyup', e => { TECLAS[e.code] = false; });
  document.addEventListener('contextmenu', e => e.preventDefault());
  if (document.fonts && document.fonts.load) document.fonts.load('20px Bungee').catch(() => { });
  requestAnimationFrame(cuadro);
}
// ---------- API de prueba ----------
window.__juego = {
  get bot() { return BOT.activo; }, set bot(v) { BOT.activo = !!v; },
  estado: () => ({ escena: PRINCIPAL.escena, listo: PRINCIPAL.listo, dinero: G.dinero, caja: G.caja, parte: G.parte, entregado: Object.assign({}, G.entregado), gens: JSON.parse(JSON.stringify(G.gens)), ayud: G.ayud, mochila: G.mochila, vel: G.vel, visitas: G.visitas, bloques: G.bloques, obj: VIVO.obj && VIVO.obj.tipo, t: Math.round(G.jugado), fps: Math.round(PRINCIPAL.fps), calidad: R.calidad, idioma: IDIOMA, carga: JUG.carga.length, vis: VIS.length, pos: [+JUG.x.toFixed(2), +JUG.z.toFixed(2)] }),
  paso(n, dib) { for (let i = 0; i < n; i++) { actualizar(1 / 30); camaraJuego(1 / 30); } if (dib) { dibujarCuadro(VIVO.t); gUI.setTransform(DPRui, 0, 0, DPRui, 0, 0); dibujarUI(gUI, 1 / 30, VIVO.t); } },
  empezar: () => empezarJuego(),
  dar: n => { G.dinero += n; },
  completar(k) { while (G.parte < Math.min(k, PARTES.length)) { const P = PARTES[G.parte]; for (const m in P.need) { G.entregado[m] = P.need[m]; } colocar(listaDe(P.arma), false); for (const m in P.need) OBRA.aterrizado[m] = P.need[m]; completarParte(); } for (const m of MATERIALES) if (PRIMERA[m] < G.parte + 1 && !G.gens[m]) { G.gens[m] = { nivel: 1, pila: 6 }; VIVO.gen[m] = { t: 0, enCamino: 0 }; colocar(listaDe(MAQUINAS[m].arma), false); } },
  calidad(n) { AJ.calidad = n; ponerCalidadAjuste(); },
  idioma(l) { AJ.idioma = l; aplicarIdioma(); },
  panel(p) { if (p) abrirPanel(p); else UI.panel = null; },
  ir(x, z) { JUG.x = x; JUG.z = z; CAM.x = x; CAM.z = z; },
  camara(o) { Object.assign(CAM, o); },
  borrar: () => borrarTodo(),
  medir(n) { const t0 = performance.now(); for (let i = 0; i < n; i++) { dibujarCuadro(VIVO.t); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4)); } return (performance.now() - t0) / n; },
  stats: () => Object.assign({}, R.stats, { w: R.w, h: R.h, part: PT.n }),
  ev(s) { return PRUEBA ? eval(s) : undefined; },
};
arrancar();
