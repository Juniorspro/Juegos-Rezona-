// HOJALATA — la carrera: física en coordenadas de pista (s a lo largo, d de costado, rumbo relativo, velocidad
// de frente y de costado), derrape con miniturbo, la cuerda (se carga derrapando y se suelta como turbo), saltos
// y huecos, barandas, caídas con la grúa, choques entre autitos, cajitas sorpresa, tornillos, canicas, botones,
// resortes, llave dorada y pompa; la IA con línea de carrera; vueltas, posiciones, fantasma y cámara.
const FIS = { g: 24, vmax: 12.5, acel: 8.5, giro: 2.35, agarre: 11, agarreDerrape: 3.4, rad: 0.42 };
const ITEMS = ['canica', 'boton', 'resorte', 'llave', 'pompa'];
const TABLA_ITEMS = { canica: [30, 30, 26, 20, 14, 10], boton: [36, 26, 16, 10, 5, 0], pompa: [24, 20, 20, 16, 12, 10], resorte: [10, 14, 18, 20, 20, 18], llave: [0, 10, 20, 34, 49, 62] };
let CAR = null;
const ESCENARIOS = {};
let FIGS = {};
function figDe(id) { return FIGS[id] || (FIGS[id] = armarAuto(id)); }
// arma (una vez) la casa y la pista: mallas, mapa, cajitas, tornillos
function prepararPista(i) {
  if (ESCENARIOS[i]) return ESCENARIOS[i];
  for (const k in ESCENARIOS) { for (const m of ESCENARIOS[k].E.mallas) GL.borrarMalla(m); delete ESCENARIOS[k]; }
  const P = PISTAS[i], C = armarCurva(P.puntos), rr = rngSemilla(100 + i * 17);
  const G = mallaPista(C, { riel: P.riel, columna: P.columna, sinColumnas: P.sinColumnas, suelo: 0 });
  const mallas = geoPartir(G, 30);
  const H = nuevaGeo(false);
  P.decorar.call(P, H, C, rr);
  for (const m of geoPartir(H, 30)) mallas.push(m);
  let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9;
  for (let k = 0; k < C.N; k++) { x0 = Math.min(x0, C.px[k]); x1 = Math.max(x1, C.px[k]); z0 = Math.min(z0, C.pz[k]); z1 = Math.max(z1, C.pz[k]); }
  const E = { mallas, amb: P.amb, centro: [(x0 + x1) / 2, 0, (z0 + z1) / 2], radioSombra: Math.max(x1 - x0, z1 - z0) / 2 + 14, atlas: null };
  // cajitas en el medio de cada tramo marcado, tornillos en fila por la línea
  const cajas = [], torn = [];
  const tramos = (bit) => { const L = []; let ini = -1; for (let k = 0; k <= C.N; k++) { const on = k < C.N && (C.f[k] & bit); if (on && ini < 0) ini = k; if (!on && ini >= 0) { L.push([ini, k - 1]); ini = -1; } } return L; };
  for (const [a, b] of tramos(F_CAJAS)) { const s = ((a + b) / 2) * C.paso, w = C.w[Math.round((a + b) / 2)]; for (let k = 0; k < 4; k++) cajas.push({ s, d: (k - 1.5) * Math.min(1.25, w / 4.6), t: 0 }); }
  for (const [a, b] of tramos(F_TORN)) { const m = (a + b) / 2; for (let k = 0; k < 5; k++) { const s = (m + (k - 2) * 3) * C.paso; torn.push({ s, d: marcoEn(C, s).linea * 0.8, t: 0 }); } }
  const S = { C, E, mapa: mapaPista(C), cajas, torn, P };
  ESCENARIOS[i] = S;
  return S;
}
let PISTA_ACTUAL = null;
function ponerPista(i) {
  const S = prepararPista(i);
  PISTA_ACTUAL = i;
  if (R.E !== S.E) { R.ponerEscenario(S.E); }
  return S;
}
// ---------- la carrera ----------
function nuevaCarrera(cfg) {
  const S = ponerPista(cfg.pista), C = S.C;
  RND = rngSemilla(cfg.semilla || 1);
  const ids = cfg.corredores || ORDEN_PJ.slice(), n = ids.length;
  CAR = {
    cfg, S, C, t: 0, fase: cfg.sinPresentacion ? 'cuenta' : 'presenta', tFase: 0, vueltas: cfg.vueltas || 3, autos: [], objetos: [], msj: [], fin: null, reloj: 0,
    cajas: S.cajas.map(c => Object.assign({}, c, { t: 0 })), torn: S.torn.map(c => Object.assign({}, c, { t: 0 })), sacudir: 0, camYaw: null, camPos: null, ganador: null,
    fantasma: null, grabando: [], tVuelta: 0, mejorVuelta: null, tren: S.P.tren ? 0 : null, cuentaToques: 0,
  };
  const grilla = cfg.grilla || [5, 4, 3, 2, 1, 0];
  ids.forEach((id, k) => {
    const g = grilla[k] != null ? grilla[k] : k, fila = Math.floor(g / 2), col = g % 2 ? 1 : -1;
    const A = nuevoCorredor(id, id === cfg.yo && !cfg.demo, cfg);
    A.s = C.L - 2.2 - fila * 2.6 - (g % 2) * 1.2; A.d = col * 1.15; A.vuelta = -1; A.grilla = g;
    CAR.autos.push(A);
  });
  CAR.yo = CAR.autos.find(a => a.humano) || CAR.autos[0];
  for (const A of CAR.autos) { const m = marcoEn(C, A.s); A.y = m.py + m.ry * A.d; }
  if (cfg.modo === 'contra') { CAR.yo.item = 'llave'; CAR.yo.llaves = 2; CAR.fantasma = cargarFantasma(cfg.pista); }
  actualizarAutosRender(0);
  camaraCarrera(1, true);
  return CAR;
}
function nuevoCorredor(id, humano, cfg) {
  const D = PERSONAJES[id], fig = figDe(id), dif = cfg.dificultad || 1;
  const A = {
    id, humano, auto: nuevoAuto(fig), st: D.stats, s: 0, d: 0, y: 0, vy: 0, enAire: false, psi: 0, vf: 0, vl: 0, vuelta: -1, prog: 0, pos: 0,
    derr: { on: false, dir: 0, t: 0, nivel: 0 }, turboT: 0, turboK: 0, cuerda: 0.25, tornillos: 0, item: null, ruleta: 0, ruletaItem: null, escudo: 0, superT: 0,
    giroT: 0, giroAng: 0, cae: null, grua: 0, fin: null, tiempos: [], tVuelta0: 0, alReves: 0, golpeT: 0, steer: 0, ultS: 0, sinPiso: 0, carga: 0, salida: 0,
    ia: { k: 1, linea: 0.75 + az() * 0.3, desvio: (az() - 0.5) * 1.2, tItem: 0, ruido: 0, nivel: humano ? 1 : (0.93 + az() * 0.05) * (0.97 + (dif - 1) * 0.7) },
    entrada: { steer: 0, derrape: false, item: false, cuerda: false, freno: false, atras: false },
  };
  return A;
}
function cfgDe(A) { return CAR.cfg; }
// ---------- el paso fijo ----------
function pasoCarrera(dt, inpJugador) {
  const K = CAR, C = K.C;
  K.t += dt; K.tFase += dt;
  if (K.fase === 'presenta') { if (K.tFase > 3.6 || K.saltarPres) { K.fase = 'cuenta'; K.tFase = 0; } }
  else if (K.fase === 'cuenta') {
    const n = 3 - Math.floor(K.tFase);
    if (n !== K.ultCuenta && n >= 0) { K.ultCuenta = n; if (n > 0) Sonido.cuenta(n); }
    if (K.tFase >= 3) { K.fase = 'carrera'; K.tFase = 0; Sonido.cuenta(0); Sonido.musica(K.S.P.musica); largada(); }
  } else if (K.fase === 'carrera' || K.fase === 'final') {
    K.reloj += dt;
  }
  const corriendo = K.fase === 'carrera' || K.fase === 'final';
  for (const A of K.autos) {
    let inp;
    if (!corriendo) inp = { steer: 0, derrape: false, item: false, cuerda: false, freno: false };
    else if (A.humano && !BOT && !A.fin) inp = inpJugador;
    else inp = iaCorredor(A);
    A.entrada = inp;
    if (K.fase === 'cuenta' && A.humano && inpJugador && inpJugador.cuerda && !BOT) { K.cuentaToques++; A.carga = Math.min(14, A.carga + 1); Sonido.cuerda(); }
    if (corriendo) pasoCorredor(A, inp, dt);
  }
  if (corriendo) { choquesAutos(); pasoObjetos(dt); posiciones(); }
  if (K.tren != null) K.tren += dt;
  // fantasma: grabar la vuelta del jugador
  if (K.cfg.modo === 'contra' && K.fase === 'carrera' && !K.yo.fin) { K.tVuelta += dt; if (Math.round(K.t * 60) % 3 === 0) K.grabando.push([+K.yo.s.toFixed(2), +K.yo.d.toFixed(2), +K.yo.psi.toFixed(3), +(K.yo.y).toFixed(2)]); }
  // fin: el jugador cruzó; los demás terminan solos (si tardan, se estima)
  if (K.fase === 'final' && K.tFase > 5) {
    for (const A of K.autos) if (!A.fin) { const falta = (K.vueltas * C.L - A.prog) / Math.max(4, A.vf || 8); A.fin = { t: K.reloj + falta, estimado: true }; }
    terminarCarrera();
  }
  if (K.sacudir > 0) K.sacudir = Math.max(0, K.sacudir - dt * 2.5);
  for (let i = K.msj.length - 1; i >= 0; i--) { K.msj[i].t += dt; }
  let j = 0; for (let i = 0; i < K.msj.length; i++) if (K.msj[i].t < K.msj[i].dur) K.msj[j++] = K.msj[i]; K.msj.length = j;
}
function largada() {
  for (const A of CAR.autos) {
    let c = A.humano && !BOT ? A.carga : 4 + Math.floor(az() * 9);
    if (c >= 5 && c <= 11) { A.turboT = 0.4 + (c - 5) * 0.12; A.turboK = 0.8; A.vf = 3; if (A.humano) { mensaje('buenaLargada', 1.2); Sonido.turbo(); } }
    else if (c > 11) { A.giroT = 0.6; A.giroAng = 0; if (A.humano) mensaje('pasado', 1.2); }
  }
}
function mensaje(k, dur, extra) { CAR.msj.push({ k, t: 0, dur: dur || 1.5, extra }); }
// ---------- un autito ----------
function giroMax(A) { const v = Math.abs(A.vf); return FIS.giro * A.st.giro * clamp(v / 3, 0, 1) * (1 - 0.2 * clamp((v - 8) / 8, 0, 1)); }
function vmaxDe(A, m) {
  let v = FIS.vmax * A.st.vel * (1 + A.tornillos * 0.012) * A.ia.nivel * (A.humano ? 1 : A.ia.k);
  if (m.f & F_TOALLA) v *= 0.72; if (m.f & F_AGUA) v *= 0.8;
  if (Math.abs(A.d) > m.w / 2) v *= 0.55;
  if (A.turboT > 0) v *= 1 + 0.36 * A.turboK;
  if (A.superT > 0) v *= 1.3;
  return v;
}
function pasoCorredor(A, inp, dt) {
  const K = CAR, C = K.C;
  // cayendo o colgado de la grúa
  if (A.cae) {
    A.cae.t += dt;
    if (A.cae.t < 0.75) { A.vy -= FIS.g * dt; A.y += A.vy * dt; A.giroAng += dt * 6; }
    else if (!A.cae.puesto) { A.cae.puesto = true; A.s = A.cae.s; A.d = 0; A.psi = 0; A.vf = 0; A.vl = 0; const m = marcoEn(C, A.s); A.y = m.py; A.grua = 1; A.giroAng = 0; }
    if (A.cae.t > 0.75) { A.grua = Math.max(0, 1 - (A.cae.t - 0.75) / 0.9); }
    if (A.cae.t > 1.65) { A.cae = null; A.grua = 0; A.escudo = Math.max(A.escudo, 1.2); A.invul = 1.2; }
    return;
  }
  const m = marcoEn(C, A.s), f0 = m.f;
  const sObj = A.s;
  A.steer = acercar(A.steer, inp.steer || 0, dt * 7);
  let steer = A.steer;
  if (A.giroT > 0) { A.giroT -= dt; A.giroAng += dt * 13; steer = 0; A.vf *= Math.max(0, 1 - 2.2 * dt); A.derr.on = false; }
  else A.giroAng = 0;
  if (A.golpeT > 0) A.golpeT -= dt;
  if (A.invul > 0) A.invul -= dt;
  if (A.escudo > 0) A.escudo -= dt;
  if (A.superT > 0) A.superT -= dt;
  // motor y freno
  const vmax = vmaxDe(A, m), suelo = !A.enAire;
  if (suelo) {
    if (inp.freno && A.giroT <= 0) { A.vf = A.vf > -3.5 ? A.vf - 16 * dt : A.vf; }
    else if (A.vf < vmax) { const k = A.turboT > 0 || A.superT > 0 ? 2.2 : 1; A.vf += FIS.acel * A.st.acel * k * Math.max(0.12, 1 - Math.max(0, A.vf) / vmax) * dt; }
    else A.vf = Math.max(vmax, A.vf - 5 * dt);
    A.vf -= FIS.g * m.ty * 0.5 * dt;
  }
  if (A.turboT > 0) A.turboT -= dt;
  // derrape: se arma apretando con el palito para un costado; se suelta para el miniturbo
  const D = A.derr;
  if (inp.derrape && !D.on && suelo && Math.abs(steer) > 0.3 && A.vf > 6 && A.giroT <= 0) { D.on = true; D.dir = Math.sign(steer); D.t = 0; D.nivel = 0; A.vy = 2.6; A.enAire = true; A.saltito = true; if (A.humano) Sonido.salto(0.4); }
  if (D.on) {
    D.t += dt; A.cuerda = Math.min(1, A.cuerda + dt * 0.1);
    const nv = D.t > 1.5 ? 2 : D.t > 0.65 ? 1 : 0; if (nv > D.nivel) { D.nivel = nv; if (A.humano) Sonido.nivelDerrape(nv); }
    if (!inp.derrape || A.vf < 4) {
      if (D.nivel > 0 && A.vf > 4) { A.turboT = Math.max(A.turboT, D.nivel === 2 ? 1.1 : 0.6); A.turboK = D.nivel === 2 ? 1 : 0.65; A.cuerda = Math.min(1, A.cuerda + 0.08 * D.nivel); if (A.humano) Sonido.turbo(); }
      D.on = false;
    }
  }
  // dirección
  const gm = giroMax(A) * (A.vf < 0 ? -1 : 1);
  let w = steer * gm;
  if (D.on) w = (D.dir * 0.7 + steer * 0.35) * Math.abs(gm) * 1.15;
  if (A.enAire && !A.saltito) w *= 0.3;
  const dp = w * dt;
  A.psi += dp;
  const c = Math.cos(dp), s = Math.sin(dp), vf2 = A.vf * c + A.vl * s, vl2 = -A.vf * s + A.vl * c; A.vf = vf2; A.vl = vl2;
  let agarre = D.on ? FIS.agarreDerrape : FIS.agarre;
  if (f0 & F_JABON) agarre *= 0.3;
  if (A.enAire) agarre *= 0.15;
  // las ruedas llevan la velocidad hacia donde apunta el autito (sin perder casi rapidez: es de juguete)
  { const vel = Math.hypot(A.vf, A.vl); if (vel > 0.01) { let b = Math.atan2(A.vl, Math.abs(A.vf)); b *= Math.exp(-agarre * dt); const v2 = vel * (1 - Math.min(0.5, Math.abs(Math.sin(b)) * 0.5 * dt)), sg = A.vf < 0 ? -1 : 1; A.vf = sg * v2 * Math.cos(b); A.vl = v2 * Math.sin(b); } }
  if (!D.on) A.psi *= 1 - Math.min(1, dt * 0.15);
  // mover en la pista
  const cp = Math.cos(A.psi), sp = Math.sin(A.psi);
  let vT = A.vf * cp - A.vl * sp, vR = A.vf * sp + A.vl * cp;
  const ds = vT * dt / Math.max(0.3, 1 - m.kap * A.d);
  const sAnt = A.s;
  A.s += ds; A.d += vR * dt; A.psi -= m.kap * ds;
  if (A.psi > PI) A.psi -= TAU; if (A.psi < -PI) A.psi += TAU;
  if (A.s >= C.L) { A.s -= C.L; cruzarMeta(A, 1); } else if (A.s < 0) { A.s += C.L; cruzarMeta(A, -1); }
  const m2 = marcoEn(C, A.s), half = m2.w / 2, lim = half - 0.3;
  // barandas
  for (const lado of [-1, 1]) {
    const tiene = m2.f & (lado < 0 ? F_RI : F_RD);
    if (tiene && A.d * lado > lim) {
      A.d = lado * lim;
      if (vR * lado > 0) {
        const imp = Math.abs(vR);
        vR = -vR * 0.25; vT *= 1 - clamp(imp / 30, 0.02, 0.35);
        A.vf = vT * cp + vR * sp; A.vl = -vT * sp + vR * cp;
        if (A.psi * lado > 0) A.psi *= 0.55;
        if (imp > 1.2) { chispasChoque(A, lado, imp); if (A.humano) { Sonido.choque(imp / 10); if (imp > 4) { vibrar(18); CAR.sacudir = Math.min(1, imp / 12); A.auto.gesto = GESTOS.sorpresa; A.gestoT = 0.6; } } }
      }
    }
  }
  // sin baranda: banquina en el piso o caída si va alto
  if (Math.abs(A.d) > half + 0.08 && !(m2.f & (A.d < 0 ? F_RI : F_RD))) {
    if (m2.py > 0.7 && !A.enAire) caer(A, A.s);
    else if (Math.abs(A.d) > half + 1.4) { A.d = Math.sign(A.d) * (half + 1.4); A.vl *= -0.3; A.vf *= 0.96; }
  }
  // altura: en el piso sigue la pista; en el aire, vuelo de verdad
  const ySup = m2.py + m2.ry * A.d;
  if (A.enAire) {
    A.vy -= FIS.g * dt; A.y += A.vy * dt;
    if (A.y <= ySup) {
      if (m2.f & F_HUECO) { if (A.y < ySup - 1.2) caer(A, sigSinHueco(C, A.s)); }
      else { const golpe = -A.vy; A.y = ySup; A.vy = 0; A.enAire = false; A.saltito = false; if (golpe > 6) { A.auto.rebote = -0.05; if (A.humano) { Sonido.aterrizaje(golpe / 14); vibrar(12); } polvo(A, 6); } }
    }
  } else {
    A.y = ySup;
    if ((f0 & F_SALTO) && !(m2.f & F_SALTO) && ds > 0) { A.enAire = true; A.vy = A.vf * Math.max(0, m.ty) + 5; if (A.humano) Sonido.salto(1); }
    else if (m2.f & F_HUECO) { A.enAire = true; A.vy = 0; }
  }
  // almohadillas de turbo (las flechas que corren)
  if (!A.enAire && (m2.f & F_TURBO) && (m2.i % 10) < 6 && Math.abs(A.d) < Math.min(1.3, m2.w * 0.225) + 0.25) { if (A.turboT < 0.5 && A.humano) Sonido.turbo(); A.turboT = Math.max(A.turboT, 0.9); A.turboK = Math.max(A.turboK, 0.85); }
  // cuerda: se suelta como turbo
  if (inp.cuerda && A.cuerda >= 0.2 && A.giroT <= 0 && !A.cae) { A.turboT = Math.max(A.turboT, 0.5 + 1.7 * A.cuerda); A.turboK = 0.95; A.cuerda = 0; if (A.humano) { Sonido.turboCuerda(); vibrar(20); } A.llaveTurbo = 1; }
  A.cuerda = Math.min(1, A.cuerda + dt * 0.012);
  // ruleta e ítems
  if (A.ruleta > 0) { A.ruleta -= dt; if (A.humano && Math.floor(A.ruleta * 14) !== Math.floor((A.ruleta + dt) * 14)) Sonido.ruleta(); if (A.ruleta <= 0) { A.item = A.ruletaItem; A.ruletaItem = null; if (A.humano) Sonido.itemListo(); } }
  if (inp.item && A.item && A.ruleta <= 0) usarItem(A, inp.atras);
  // al revés
  if (vT < -1 && !A.cae) A.alReves += dt; else A.alReves = Math.max(0, A.alReves - dt * 2);
  A.prog = A.vuelta * C.L + A.s;
  // gesto de la cara
  if (A.gestoT > 0) A.gestoT -= dt; else A.auto.gesto = A.fin ? (A.pos === 0 ? GESTOS.risa : GESTOS.feliz) : A.giroT > 0 ? GESTOS.sorpresa : (A.turboT > 0 || D.on) ? GESTOS.decidido : GESTOS.normal;
}
function sigSinHueco(C, s) { for (let k = 0; k < 200; k++) { const m = marcoEn(C, s + k * C.paso); if (!(m.f & F_HUECO) && !(m.f & F_SALTO)) return s + k * C.paso + 2; } return s; }
function caer(A, sVuelta) {
  if (A.cae) return;
  A.cae = { t: 0, s: ((sVuelta % CAR.C.L) + CAR.C.L) % CAR.C.L, puesto: false }; A.derr.on = false; A.turboT = 0; A.vy = Math.min(A.vy, 0); A.enAire = false;
  if (A.humano) { Sonido.caida(); mensaje('uy', 1.4); vibrar(30); }
  const m = marcoEn(CAR.C, A.s); if (m.py > 2) { for (let k = 0; k < 10; k++) particula(m.px, m.py - 1, m.pz, rnd(-2, 2), rnd(1, 4), rnd(-2, 2), 0.8, 0.12, '#bfe6ff', 1, 9); }
}
function cruzarMeta(A, dir) {
  const K = CAR;
  if (dir > 0) {
    A.vuelta++;
    if (A.vuelta >= 1 && !A.fin) {
      const tv = K.reloj - A.tVuelta0; A.tiempos.push(tv); A.tVuelta0 = K.reloj;
      if (A.humano && K.cfg.modo === 'contra') terminarVueltaFantasma(tv);
    } else if (A.vuelta === 0) A.tVuelta0 = K.reloj;
    if (A.vuelta >= K.vueltas && !A.fin) {
      A.fin = { t: K.reloj };
      if (A.humano) { K.fase = 'final'; K.tFase = 0; Sonido.meta(); mensaje('meta', 4); Sonido.musica(-1); }
    } else if (A.humano && A.vuelta === K.vueltas - 1 && A.vuelta > 0) { mensaje('ultimaVuelta', 2.2); Sonido.ultimaVuelta(); }
    else if (A.humano && A.vuelta > 0) { mensaje('vueltaN', 1.6, A.vuelta + 1); Sonido.vuelta(); }
  } else A.vuelta--;
}
function posiciones() {
  const L = CAR.autos.slice().sort((a, b) => (a.fin && b.fin) ? a.fin.t - b.fin.t : a.fin ? -1 : b.fin ? 1 : b.prog - a.prog);
  L.forEach((A, i) => { if (A.pos !== i && A.humano && CAR.fase === 'carrera' && A.pos > i) Sonido.pasar(); A.pos = i; });
  // goma: los de atrás del jugador aprietan un poco, los de adelante aflojan
  const yo = CAR.yo;
  for (const A of CAR.autos) if (!A.humano) { const d = clamp((yo.prog - A.prog) / 70, -1, 1); A.ia.k = CAR.cfg.modo === 'demo' ? 1 : 1 + d * (d > 0 ? 0.03 : 0.07); }
}
// ---------- golpes ----------
function golpear(A, tipo) {
  if (A.invul > 0 || A.cae) return false;
  if (A.escudo > 0 && tipo !== 'tren') { A.escudo = 0; Sonido.pompa(); for (let k = 0; k < 12; k++) { const p = posMundo(A, 0, 0.4, 0); particula(p[0], p[1], p[2], rnd(-3, 3), rnd(0, 3), rnd(-3, 3), 0.6, 0.1, '#bfe6ff', 2.5, 2); } return false; }
  if (A.superT > 0) return false;
  A.giroT = tipo === 'canica' ? 1.1 : 0.9; A.vf *= 0.4; A.derr.on = false; A.turboT = 0;
  A.tornillos = Math.max(0, A.tornillos - 2); A.invul = 1.4;
  A.auto.gesto = GESTOS.sorpresa; A.gestoT = 1.2;
  if (A.humano) { Sonido.golpe(); vibrar(40); CAR.sacudir = 0.8; }
  else if (CAR.yo && Math.abs(difS(CAR.C, CAR.yo.s, A.s)) < 25) Sonido.golpe(0.5);
  return true;
}
// ---------- choques entre autitos ----------
function choquesAutos() {
  const L = CAR.autos, C = CAR.C, r2 = FIS.rad * 2;
  for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
    const A = L[i], B = L[j];
    if (A.cae || B.cae) continue;
    const ds = difS(C, A.s, B.s), dd = B.d - A.d;
    if (Math.abs(ds) > r2 || Math.abs(dd) > r2 || Math.abs(A.y - B.y) > 0.6) continue;
    const dist = Math.hypot(ds, dd) || 0.01;
    if (dist >= r2) continue;
    const nx = ds / dist, ny = dd / dist, sol = r2 - dist, mA = A.st.peso, mB = B.st.peso, tot = mA + mB;
    A.s -= nx * sol * mB / tot; A.d -= ny * sol * mB / tot; B.s += nx * sol * mA / tot; B.d += ny * sol * mA / tot;
    // velocidades en el marco de la pista
    const vA = velPista(A), vB = velPista(B), rel = (vB[0] - vA[0]) * nx + (vB[1] - vA[1]) * ny;
    if (rel < 0) {
      const jj = -(1 + 0.45) * rel / (1 / mA + 1 / mB);
      vA[0] -= jj / mA * nx; vA[1] -= jj / mA * ny; vB[0] += jj / mB * nx; vB[1] += jj / mB * ny;
      ponerVelPista(A, vA); ponerVelPista(B, vB);
      if (A.superT > 0) golpear(B, 'super'); else if (B.superT > 0) golpear(A, 'super');
      if ((A.humano || B.humano) && -rel > 1.5) { Sonido.choque(-rel / 12); if (-rel > 4) vibrar(10); }
    }
  }
}
function velPista(A) { const cp = Math.cos(A.psi), sp = Math.sin(A.psi); return [A.vf * cp - A.vl * sp, A.vf * sp + A.vl * cp]; }
function ponerVelPista(A, v) { const cp = Math.cos(A.psi), sp = Math.sin(A.psi); A.vf = v[0] * cp + v[1] * sp; A.vl = -v[0] * sp + v[1] * cp; }
// ---------- ítems ----------
function sortearItem(A) {
  if (CAR.cfg.modo === 'desafio' && CAR.cfg.sinItems) return null;
  const p = Math.min(5, A.pos), tot = ITEMS.reduce((s, k) => s + TABLA_ITEMS[k][p], 0);
  let x = az() * tot;
  for (const k of ITEMS) { x -= TABLA_ITEMS[k][p]; if (x <= 0) return k; }
  return 'canica';
}
function usarItem(A, atras) {
  const it = A.item, C = CAR.C;
  A.item = null;
  if (CAR.cfg.modo === 'contra' && A.llaves > 0) { A.llaves--; A.item = 'llave'; }
  if (A.humano) A.usados = (A.usados || 0) + 1;
  if (it === 'canica') {
    const v = atras ? -7 : 22;
    CAR.objetos.push({ tipo: 'canica', s: A.s + (atras ? -0.9 : 0.9), d: A.d, vs: v + (atras ? 0 : Math.max(0, A.vf * 0.4)), vd: atras ? 0 : Math.sin(A.psi) * 6, t: 0, vida: atras ? 12 : 5, dueno: A, rueda: 0 });
    Sonido.canica();
  } else if (it === 'boton') {
    CAR.objetos.push({ tipo: 'boton', s: A.s - 0.95, d: A.d, vs: 0, vd: 0, t: 0, vida: 40, dueno: A, giro: az() * TAU, tinte: 1 + Math.floor(az() * 5) });
    Sonido.botonCae();
  } else if (it === 'resorte') {
    A.enAire = true; A.vy = 8.5; A.turboT = Math.max(A.turboT, 0.7); A.turboK = 0.6; A.saltoResorte = 0.8;
    Sonido.resorte();
  } else if (it === 'llave') {
    A.superT = 2.4; A.turboT = Math.max(A.turboT, 2.4); A.turboK = 1.1; A.cuerda = 1; A.llaveTurbo = 1;
    Sonido.turboCuerda(); if (A.humano) vibrar(25);
  } else if (it === 'pompa') { A.escudo = 10; Sonido.pompaSale(); }
  // los botones viejos se van (máximo 12)
  const bs = CAR.objetos.filter(o => o.tipo === 'boton');
  if (bs.length > 12) bs[0].vida = 0;
}
function pasoObjetos(dt) {
  const K = CAR, C = K.C;
  // cajitas y tornillos
  for (const c of K.cajas) {
    if (c.t > 0) { c.t -= dt; continue; }
    for (const A of K.autos) {
      if (A.cae || A.y - (marcoEn(C, c.s).py) > 1.2) continue;
      if (Math.abs(difS(C, A.s, c.s)) < 0.7 && Math.abs(A.d - c.d) < 0.75) {
        c.t = 3;
        const p = puntoEn(C, c.s, c.d, 0.4);
        for (let k = 0; k < 16; k++) particula(p[0], p[1], p[2], rnd(-3, 3), rnd(1, 5), rnd(-3, 3), 0.9, 0.09, ['#ff4a5a', '#ffd23f', '#4ad0ff', '#7aff6a', '#ffffff'][k % 5], 1, 12, 1, false);
        if (!A.item && A.ruleta <= 0) { A.ruletaItem = sortearItem(A); if (A.ruletaItem) { A.ruleta = A.humano ? 1.25 : 0.6; A.ia.tItem = 1 + az() * 3; } }
        if (A.humano) Sonido.cajitaSorpresa();
        break;
      }
    }
  }
  for (const c of K.torn) {
    if (c.t > 0) { c.t -= dt; continue; }
    for (const A of K.autos) {
      if (A.cae) continue;
      if (Math.abs(difS(C, A.s, c.s)) < 0.6 && Math.abs(A.d - c.d) < 0.65 && A.y - marcoEn(C, c.s).py < 1) {
        c.t = 9; A.tornillos = Math.min(10, A.tornillos + 1); A.cuerda = Math.min(1, A.cuerda + 0.05);
        if (A.humano) { Sonido.tornillo(); A.juntados = (A.juntados || 0) + 1; }
        break;
      }
    }
  }
  // canicas y botones
  let j = 0;
  for (let i = 0; i < K.objetos.length; i++) {
    const o = K.objetos[i];
    o.t += dt;
    if (o.t > o.vida) continue;
    if (o.tipo === 'canica') {
      const m = marcoEn(C, o.s);
      o.s += o.vs * dt; o.d += o.vd * dt; o.rueda += o.vs * dt / 0.16;
      if (o.vs < 0) o.vs = Math.min(0, o.vs + 6 * dt);
      const lim = m.w / 2 - 0.2;
      if (Math.abs(o.d) > lim) { if (m.f & (o.d < 0 ? F_RI : F_RD)) { o.d = Math.sign(o.d) * lim; o.vd = -o.vd * 0.8; } else if (Math.abs(o.d) > m.w / 2 + 0.2) { o.vida = 0; continue; } }
      if (m.f & F_HUECO) { o.vida = 0; continue; }
      if (o.s >= C.L) o.s -= C.L; if (o.s < 0) o.s += C.L;
      // apunta un poco al de adelante
      if (o.vs > 0) { let mejor = null, md = 18; for (const A of K.autos) { if (A === o.dueno && o.t < 0.5) continue; const ds = difS(C, o.s, A.s); if (ds > 0 && ds < md && Math.abs(A.d - o.d) < 2.5) { md = ds; mejor = A; } } if (mejor) o.vd += clamp(mejor.d - o.d, -1, 1) * 5 * dt; }
    }
    let toco = false;
    for (const A of K.autos) {
      if (A.cae || (A === o.dueno && o.t < 0.6)) continue;
      if (A.enAire && A.y - marcoEn(C, A.s).py > 0.5) continue;
      if (Math.abs(difS(C, A.s, o.s)) < 0.62 && Math.abs(A.d - o.d) < 0.62) { golpear(A, o.tipo); toco = true; break; }
    }
    if (toco) continue;
    // canica contra botón: se rompen los dos
    if (o.tipo === 'canica') { let roto = false; for (const b of K.objetos) if (b.tipo === 'boton' && b.vida > b.t && Math.abs(difS(C, o.s, b.s)) < 0.5 && Math.abs(o.d - b.d) < 0.5) { b.vida = 0; roto = true; break; } if (roto) continue; }
    K.objetos[j++] = o;
  }
  K.objetos.length = j;
}
// ---------- la IA ----------
function iaCorredor(A) {
  const K = CAR, C = K.C, I = A.ia, o = { steer: 0, derrape: false, item: false, cuerda: false, freno: false, atras: false };
  if (A.cae) return o;
  const look = 3.2 + Math.max(0, A.vf) * 0.32, mL = marcoEn(C, A.s + look), lin = mL.linea;
  const w = mL.w / 2 - 0.65;
  let objD = clamp(lin * I.linea + I.desvio * 0.5, -w, w);
  if (A.fin) objD = clamp(A.d, -w, w);
  // esquivar autos de adelante y botones
  for (const B of K.autos) { if (B === A || B.cae) continue; const ds = difS(C, A.s, B.s); if (ds > 0 && ds < 4.5 && Math.abs(B.d - objD) < 1.0) objD += (B.d > A.d ? -1 : 1) * 1.3 * (1 - ds / 4.5); }
  for (const b of K.objetos) { if (b.tipo !== 'boton') continue; const ds = difS(C, A.s, b.s); if (ds > 0 && ds < 7 && Math.abs(b.d - objD) < 0.9) objD += (objD >= b.d ? 1 : -1) * 1.1; }
  // ir a buscar cajitas si no tiene nada
  if (!A.item && A.ruleta <= 0) for (const c of K.cajas) { if (c.t > 0) continue; const ds = difS(C, A.s, c.s); if (ds > 2 && ds < 12) { objD = lerp(objD, c.d, 0.6); break; } }
  { const mT = marcoEn(C, A.s + look + 2); if (mT.f & F_TURBO) objD = lerp(objD, 0, 0.7); }
  // sin baranda y alto: lejos del borde, y nada de derrapar ahí
  let borde = false;
  for (let k = 0; k < 4; k++) { const mB = marcoEn(C, A.s + k * 2.5); if (mB.py > 0.7 && (mB.f & (F_RI | F_RD)) !== (F_RI | F_RD)) { borde = true; if (!(mB.f & F_RI)) objD = Math.max(objD, -mB.w / 2 + 1.25); if (!(mB.f & F_RD)) objD = Math.min(objD, mB.w / 2 - 1.25); } }
  objD = clamp(objD, -w, w);
  I.ruido = lerp(I.ruido, (az() - 0.5) * 0.5, 0.02);
  const psiObj = Math.atan2(objD - A.d, look) + I.ruido * 0.12;
  const gm = Math.max(0.3, giroMax(A));
  let st = (mL.kap * Math.max(2, A.vf)) / gm * 0.95 + (psiObj - A.psi) * 2.6;
  // derrapar en las curvas cerradas
  let kAde = 0; for (let k = 0; k < 6; k++) kAde += marcoEn(C, A.s + 2 + k * 1.5).kap; kAde /= 6;
  if (A.derr.on) { o.derrape = !borde && Math.abs(kAde) > 0.05 && Math.sign(kAde) === A.derr.dir; st = clamp(st, -1, 1); }
  else if (!borde && Math.abs(kAde) > 0.12 && A.vf > 8 && !A.enAire) { o.derrape = true; st = Math.sign(kAde); }
  o.steer = clamp(st, -1, 1);
  // ítems
  if (A.item) {
    I.tItem -= 1 / 60;
    const recta = Math.abs(kAde) < 0.04;
    if (I.tItem <= 0) {
      if (A.item === 'canica') { for (const B of K.autos) { if (B === A) continue; const ds = difS(C, A.s, B.s); if (ds > 3 && ds < 14 && Math.abs(B.d - A.d) < 1.2 && (!B.humano || az() < 0.02)) { o.item = true; break; } } if (I.tItem < -8) o.item = true; }
      else if (A.item === 'boton') { for (const B of K.autos) { if (B === A) continue; const ds = difS(C, A.s, B.s); if (ds < -1 && ds > -9) { o.item = true; break; } } if (I.tItem < -5) o.item = true; }
      else if (A.item === 'llave' || A.item === 'resorte') { if (recta) o.item = true; }
      else o.item = true;
    }
  }
  if (A.cuerda > 0.6 && Math.abs(kAde) < 0.035 && !A.derr.on && A.turboT <= 0) o.cuerda = true;
  if (K.cfg.modo === 'contra' && !A.humano) o.item = false;
  return o;
}
// ---------- el render de los autitos ----------
const _pm = [0, 0, 0];
function posMundo(A, lx, ly, lz) { const M = A.auto.M; _pm[0] = M[0] * lx + M[4] * ly + M[8] * lz + M[12]; _pm[1] = M[1] * lx + M[5] * ly + M[9] * lz + M[13]; _pm[2] = M[2] * lx + M[6] * ly + M[10] * lz + M[14]; return _pm; }
function matCorredor(A, M) {
  const C = CAR.C, m = marcoEn(C, A.s), a = A.auto;
  let ps = A.psi + (A.derr.on ? A.derr.dir * 0.42 : 0) + A.giroAng;
  const cp = Math.cos(ps), sp = Math.sin(ps);
  let fx = m.tx * cp + m.rx * sp, fy = m.ty * cp + m.ry * sp, fz = m.tz * cp + m.rz * sp;
  let ux = m.ux, uy = m.uy, uz = m.uz;
  if (A.enAire && !A.saltito) { const k = clamp(-A.vy * 0.03, -0.35, 0.35); fy -= k; const l = Math.hypot(fx, fy, fz); fx /= l; fy /= l; fz /= l; }
  // izquierda = arriba × adelante
  let ix = uy * fz - uz * fy, iy = uz * fx - ux * fz, iz = ux * fy - uy * fx; const li = Math.hypot(ix, iy, iz) || 1; ix /= li; iy /= li; iz /= li;
  ux = fy * iz - fz * iy; uy = fz * ix - fx * iz; uz = fx * iy - fy * ix;
  const px = m.px + m.rx * A.d, pz = m.pz + m.rz * A.d;
  let y = A.y;
  if (A.cae && A.cae.puesto) y = A.y + A.grua * 5;
  matAuto(M, px, y, pz, ix, iy, iz, ux, uy, uz, fx, fy, fz);
}
function actualizarAutosRender(dt) {
  const K = CAR;
  for (const A of K.autos) {
    const a = A.auto;
    matCorredor(A, a.M);
    a.giroRueda += A.vf / RUEDA_R * dt * (A.enAire ? 1.3 : 1);
    a.volante = A.steer * 0.42;
    a.llave += dt * (1.5 + Math.abs(A.vf) * 0.2 + (A.turboT > 0 ? 22 : 0) + A.cuerda * 2);
    a.ladeo = lerp(a.ladeo, -A.steer * 0.05 - (A.derr.on ? A.derr.dir * 0.06 : 0), 0.2);
    a.cabeceo = lerp(a.cabeceo, A.turboT > 0 ? -0.04 : 0, 0.15);
    a.rebote = lerp(a.rebote || 0, Math.sin(T * 38 + A.grilla) * 0.004 * Math.min(1, Math.abs(A.vf) / 4), 0.5);
    a.cab.yaw = lerp(a.cab.yaw, A.steer * 0.35 + (A.giroT > 0 ? Math.sin(T * 20) * 0.5 : 0), 0.15);
    a.cab.pitch = A.enAire ? -0.1 : 0; a.torso.roll = -A.steer * 0.12;
    a.buf = clamp(Math.abs(A.vf) / 14, 0, 1.3);
    a.oculto = !!(A.cae && !A.cae.puesto && A.cae.t > 0.6);
    a.tinte = A.invul > 0 && Math.floor(T * 14) % 2 ? [1, 1, 1, 0.35] : A.superT > 0 ? [1, 0.8, 0.2, 0.25 + Math.sin(T * 30) * 0.15] : null;
    posarAuto(a, T);
  }
}
// partículas que salen de los autitos (con el reloj real)
function particulasAutos(dt) {
  for (const A of CAR.autos) {
    if (A.cae || A.auto.oculto) continue;
    const cerca = Math.abs(difS(CAR.C, CAR.yo.s, A.s)) < 30;
    if (!cerca) continue;
    if (A.derr.on && !A.enAire) {
      const col = A.derr.nivel === 2 ? '#ff9a2a' : A.derr.nivel === 1 ? '#4ab8ff' : '#fff6d0';
      for (const s of [-1, 1]) if (vis() < 0.7) { const p = posMundo(A, s * 0.26, 0.03, -0.32); particula(p[0], p[1], p[2], rnd(-1.5, 1.5), rnd(0.5, 2.5), rnd(-1.5, 1.5), 0.25, 0.07, col, A.derr.nivel ? 4 : 2, 8, 2); }
    }
    if (A.turboT > 0 || A.superT > 0) { for (let k = 0; k < 2; k++) { const p = posMundo(A, rnd(-0.06, 0.06), 0.2, -0.55); particula(p[0], p[1], p[2], rnd(-0.4, 0.4), rnd(0, 0.8), rnd(-0.4, 0.4), 0.22, 0.12, k ? '#ffd23f' : '#ff7a1a', 4.5, -1, 2); } }
    if (A.escudo > 0 && vis() < 0.3) { const p = posMundo(A, rnd(-0.6, 0.6), rnd(0, 0.9), rnd(-0.7, 0.7)); particula(p[0], p[1], p[2], 0, 0.3, 0, 0.5, 0.05, '#ffffff', 3, 0, 0); }
    if (Math.abs(A.d) > CAR.C.w[marcoEn(CAR.C, A.s).i] / 2 && !A.enAire && A.vf > 3 && vis() < 0.5) polvo(A, 1);
  }
}
function polvo(A, n) { for (let k = 0; k < n; k++) { const p = posMundo(A, rnd(-0.3, 0.3), 0.05, -0.4); particula(p[0], p[1], p[2], rnd(-1, 1), rnd(0.5, 1.5), rnd(-1, 1), 0.6, 0.18, '#c8b8a0', 1, 1, 2); } }
function chispasChoque(A, lado, imp) { if (Math.abs(difS(CAR.C, CAR.yo.s, A.s)) > 30) return; const p = posMundo(A, -lado * 0.3, 0.15, 0.2); for (let k = 0; k < Math.min(14, 3 + imp * 2); k++) particula(p[0], p[1], p[2], rnd(-3, 3), rnd(1, 4), rnd(-3, 3), 0.35, 0.06, k % 2 ? '#ffe28a' : '#ffffff', 5, 14, 0.5); }
// las cosas de la pista a dibujar
function instanciasCarrera() {
  const K = CAR, C = K.C;
  R.vaciarInst();
  for (const c of K.cajas) { if (c.t > 0) continue; const p = puntoEn(C, c.s, c.d, 0.25 + Math.sin(T * 3 + c.s) * 0.08); R.inst('cajita', p[0], p[1], p[2], T * 1.5 + c.d, 1.25, 0, 1 + ((c.s * 7 + c.d * 3) | 0) % 5); }
  for (const c of K.torn) { if (c.t > 0) continue; const p = puntoEn(C, c.s, c.d, 0.3); R.inst('tornillo', p[0], p[1], p[2], T * 4 + c.s, 1.6, 0); }
  for (const o of K.objetos) {
    const p = puntoEn(C, o.s, o.d, 0);
    if (o.tipo === 'canica') R.inst('canica', p[0], p[1], p[2], 0, 1.4, o.rueda, 1);
    else R.inst('boton', p[0], p[1] + 0.01, p[2], o.giro, 1.5, 0, o.tinte);
  }
  for (const A of K.autos) {
    if (A.escudo > 0 && !A.auto.oculto) { const M = A.auto.M; R.inst('pompa', M[12], M[13], M[14], Math.atan2(M[8], M[10]), 1, 0); }
    if (A.cae && A.cae.puesto && A.grua > 0) { const M = A.auto.M; R.inst('gancho', M[12], M[13] + 0.45, M[14], Math.atan2(M[8], M[10]), 1, 0); }
    if (A.saltoResorte > 0) { A.saltoResorte -= DT; const M = A.auto.M; R.inst('resorte', M[12], M[13] - 0.3, M[14], 0, 1.4, 0); }
  }
  if (K.tren != null) {
    const T0 = K.S.P.tren;
    for (let k = 0; k < 4; k++) { const a = K.tren * T0.vel - k * 0.24, x = T0.cx + Math.cos(a) * T0.rx, z = T0.cz + Math.sin(a) * T0.rz, dx = -Math.sin(a) * T0.rx, dz = Math.cos(a) * T0.rz; R.inst(k ? 'vagon' : 'locomotora', x, 0.15, z, Math.atan2(dx, dz), 1, 0, k); }
  }
}
// ---------- cámara (en el paso fijo) ----------
function camaraCarrera(dt, cortar) {
  const K = CAR, c = R.cam, A = K.yo, M = A.auto.M, ap = W > H;
  if (K.fase === 'presenta') {
    const k = clamp(K.tFase / 3.6, 0, 1), C = K.C, s = C.L * (0.08 + k * 0.5), m = marcoEn(C, s), m2 = marcoEn(C, s + 14);
    c.x = m.px - m.rx * 9 + m.ux * 7; c.y = m.py + 6 + Math.sin(k * PI) * 3; c.z = m.pz - m.rz * 9; c.tx = m2.px; c.ty = m2.py; c.tz = m2.pz; c.fovY = ap ? 0.9 : 1.15; c.cerca = 0.08; c.lejos = 220;
    R.foco = Math.hypot(c.x - c.tx, c.y - c.ty, c.z - c.tz); R.rango = 22; R.centroD = [m2.px, m2.py, m2.pz];
    return;
  }
  // el rumbo de la cámara sigue el del autito (sin el giro del trompo)
  const C = K.C, m = marcoEn(C, A.s), ps = A.giroT > 0 ? 0 : A.psi * 0.75;
  const fx = m.tx * Math.cos(ps) + m.rx * Math.sin(ps), fz = m.tz * Math.cos(ps) + m.rz * Math.sin(ps);
  const yawObj = Math.atan2(fx, fz);
  if (K.camYaw == null || cortar) K.camYaw = yawObj;
  K.camYaw += angDif(K.camYaw, yawObj) * (1 - Math.exp(-(A.derr.on ? 4 : 6) * dt));
  const fin = K.fase === 'final', orb = fin ? K.tFase * 0.5 : 0;
  const yaw = K.camYaw + orb, sy = Math.sin(yaw), cy = Math.cos(yaw);
  const dist = (ap ? 3.0 : 3.55) + (fin ? 1.2 : 0), alto = ap ? 1.3 : 1.72;
  const px = M[12], py = M[13], pz = M[14];
  const ox = px - sy * dist, oz = pz - cy * dist, oy = Math.max(py, m.py) + alto + (A.enAire ? 0.4 : 0);
  if (!K.camPos || cortar) K.camPos = [ox, oy, oz];
  const kp = 1 - Math.exp(-12 * dt), ky = 1 - Math.exp(-5 * dt);
  K.camPos[0] += (ox - K.camPos[0]) * kp; K.camPos[2] += (oz - K.camPos[2]) * kp; K.camPos[1] += (oy - K.camPos[1]) * ky;
  const sh = K.sacudir * 0.08;
  c.x = K.camPos[0] + (vis() - 0.5) * sh; c.y = K.camPos[1] + (vis() - 0.5) * sh; c.z = K.camPos[2] + (vis() - 0.5) * sh;
  c.tx = px + sy * 2.4; c.ty = py + 0.55; c.tz = pz + cy * 2.4;
  const vel = clamp(A.vf / FIS.vmax, 0, 1.5), fov0 = ap ? 0.86 : 1.12;
  c.fovY = lerp(c.fovY || fov0, fov0 + vel * 0.08 + (A.turboT > 0 ? 0.1 : 0), 0.08); c.cerca = 0.08; c.lejos = 220;
  R.foco = Math.hypot(c.x - px, c.y - py, c.z - pz); R.rango = 13; R.centroD = [px + sy * 4, py, pz + cy * 4];
  R.veloc = A.turboT > 0 || A.superT > 0 ? 0.8 : 0;
}
// ---------- fantasma (contrarreloj) ----------
function cargarFantasma(pista) { const f = Guardado.leer('fantasma' + pista, null); return f && f.m ? f : null; }
function terminarVueltaFantasma(tv) {
  const K = CAR, viejo = K.fantasma;
  if (!K.mejorVuelta || tv < K.mejorVuelta) K.mejorVuelta = tv;
  if (!viejo || tv < viejo.t) { K.fantasmaNuevo = { t: tv, m: K.grabando.slice() }; Guardado.escribir('fantasma' + K.cfg.pista, K.fantasmaNuevo); mensaje('recordVuelta', 2); }
  K.grabando = []; K.tVuelta = 0; K.tVueltaIni = K.reloj;
  if (K.fantasmaNuevo) K.fantasma = K.fantasmaNuevo;
}
function autoFantasma() {
  const K = CAR, F = K.fantasma;
  if (!F || K.fase !== 'carrera') return null;
  const t = K.reloj - (K.tVueltaIni || K.yo.tVuelta0 || 0), i = Math.floor(t * 20);
  if (i < 0 || i >= F.m.length - 1) return null;
  if (!K.autoF) { K.autoF = nuevoAuto(figDe(K.yo.id), { fantasma: true }); }
  const [s, d, psi, y] = F.m[i], C = K.C, m = marcoEn(C, s), a = K.autoF;
  const cp = Math.cos(psi), sp = Math.sin(psi), fx = m.tx * cp + m.rx * sp, fy = m.ty * cp + m.ry * sp, fz = m.tz * cp + m.rz * sp;
  let ix = m.uy * fz - m.uz * fy, iy = m.uz * fx - m.ux * fz, iz = m.ux * fy - m.uy * fx; const l = Math.hypot(ix, iy, iz) || 1;
  matAuto(a.M, m.px + m.rx * d, y, m.pz + m.rz * d, ix / l, iy / l, iz / l, m.ux, m.uy, m.uz, fx, fy, fz);
  a.giroRueda += 0.5; posarAuto(a, T);
  return a;
}
function terminarCarrera() {
  const K = CAR;
  if (K.terminada) return;
  K.terminada = true;
  posiciones();
  const orden = K.autos.slice().sort((a, b) => a.fin.t - b.fin.t);
  const yo = K.yo, res = { cfg: K.cfg, puesto: orden.indexOf(yo), orden: orden.map(a => ({ id: a.id, t: a.fin.t, est: !!a.fin.estimado, humano: a.humano })), tiempo: yo.fin ? yo.fin.t : K.reloj, vueltas: yo.tiempos.slice(), mejor: Math.min(...yo.tiempos.concat([999])), tornillos: yo.juntados || 0, usados: yo.usados || 0 };
  if (K.cfg.alTerminar) K.cfg.alTerminar(res);
}
// ---------- dibujar ----------
function autosParaDibujar() { const L = CAR.autos.map(A => A.auto); const f = autoFantasma(); if (f) L.push(f); return L; }
