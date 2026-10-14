// POTRERO — el fútbol: la pelota con física (gravedad, roce del aire, efecto, piques, paredes, palos y red),
// los pibes (correr, pase, tiro cargado, gambeta, barrida, cabezazo, volea), el arquero que lee el tiro y se
// estira, la posesión, el aguante y los especiales, el reloj, los goles y la repetición.
const FUT = { G: 9.81, R: 0.11, DRAG: 0.012, MAGNUS: 0.05, ACEL: 17, CTRL: 0.7, AREA_X: 4.6, AREA_Z: 5.6 };
const ROLES = ['arq', 'def', 'medI', 'medD', 'del'];
let P = null, B = null;
const dirAt = eq => eq === 0 ? -1 : 1;                 // hacia dónde ataca cada equipo (en z)
const arcoZ = eq => eq === 0 ? L_ACT / 2 : -L_ACT / 2;  // su arco
function nuevoPartido(cfg) {
  RND = rngSemilla(cfg.semilla || 7);
  const E = armarCancha(cfg.cancha);
  R.ponerEscenario(E); aplicarLuzCancha(E);
  P = {
    cfg, E, A: E.A, L: E.L, C: E.C, fase: 'presentacion', tFase: 0, mitad: 1, reloj: cfg.dur / 2, goles: [0, 0], aguante: [0, 0], jug: [], eqs: cfg.eq,
    humano: null, textos: [], sacudir: 0, lento: 1, tLento: 0, especial: null, saca: cfg.sacaPrimero || 0, ultimoGol: null, penales: null,
    stats: { tiros: [0, 0], alArco: [0, 0], pases: [0, 0], pasesOk: [0, 0], ataj: [0, 0], quites: [0, 0], pos: [0, 0], esp: [0, 0] },
    rep: { buf: new Float32Array(400 * 330), i: 0, n: 0, ver: null }, carga: 0, tren: null, viento: [0, 0], tiempoTotal: 0, eventos: [],
  };
  if (E.C.viento) { const a = azR(0, TAU); P.viento = [Math.sin(a) * 2.2, Math.cos(a) * 2.2]; }
  if (E.extras.tren) P.tren = { z: -200, v: 0, t: 18 + azR(0, 10), m: null };
  for (let e = 0; e < 2; e++) for (let i = 0; i < 5; i++) P.jug.push(crearJugador(e, cfg.eq[e], i));
  B = { x: 0, y: FUT.R, z: 0, vx: 0, vy: 0, vz: 0, wx: 0, wy: 0, wz: 0, dueno: null, ultimo: null, tUlt: 0, rot: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]), m: null, enArco: 0, alArco: false };
  B.m = nuevoMuneco(FIG_PELOTA, 0, 0, 0, 1.4); B.m.id = 13; B.m.kit = null;
  P.humano = P.jug[4];
  ponerSaque(P.saca);
  return P;
}
function crearJugador(eq, idEq, i) {
  const d = jugadoresDe(idEq)[i], fig = figuraJugador(idEq, i), m = nuevoMuneco(fig, 0, 0, 0, d.altura || 1);
  return { eq, i, idEq, rol: ROLES[i], nom: d.nom, st: d.st, m, x: 0, z: 0, y: 0, vy: 0, vx: 0, vz: 0, yaw: 0, est: 'normal', t: 0, dur: 0, fase: azR(0, 1), dx: 0, dz: 0, pique: false, accion: null, noToca: 0, cdQuite: 0, cdGam: 0, inv: 0, mira: null, ia: { t: azR(0, 0.3), obj: [0, 0], dec: null }, humano: false, cara: 0, tCara: 0, remate: null };
}
function equipoDe(eq) { return P.jug.slice(eq * 5, eq * 5 + 5); }
function arqueroDe(eq) { return P.jug[eq * 5]; }
// ---------- saque del medio ----------
const FORM_SAQUE = [[0, 0.46], [0, 0.32], [-0.5, 0.16], [0.5, 0.16], [0.12, 0.04]];
function ponerSaque(eqSaca) {
  const A = P.A, L = P.L;
  for (const j of P.jug) {
    const f = FORM_SAQUE[j.i], s = j.eq === 0 ? 1 : -1;
    j.x = f[0] * (A / 2 - 2) * s; j.z = s * f[1] * L + (j.i === 0 ? s * 1.2 : 0);
    if (j.i === 4) { j.x = j.eq === eqSaca ? 0 : 1.5 * s; j.z = j.eq === eqSaca ? s * 0.45 : s * 3.4; }
    if (j.i === 3 && j.eq === eqSaca) { j.x = 2.2 * s; j.z = s * 0.8; }
    j.vx = j.vz = 0; j.y = 0; j.vy = 0; j.est = 'normal'; j.t = 0; j.accion = null; j.yaw = j.eq === 0 ? PI : 0; j.noToca = 0; j.remate = null;
  }
  B.x = 0; B.z = 0; B.y = FUT.R; B.vx = B.vy = B.vz = 0; B.wx = B.wy = B.wz = 0; B.dueno = null; B.ultimo = null; B.enArco = 0;
  const k = P.jug[eqSaca * 5 + 4]; B.dueno = k; k.yaw = eqSaca === 0 ? PI : 0;
  P.saca = eqSaca; P.carga = 0;
  if (eqSaca === 0 || !P.humano || P.humano.eq !== 0) P.humano = equipoDe(0)[4];
  for (const j of P.jug) j.humano = j === P.humano;
  P.esperaSaque = 0.6;
}
// ---------- utilidades de la pelota ----------
function pelotaLibre() { return !B.dueno && !(B.enManos); }
function velPelota() { return Math.hypot(B.vx, B.vy, B.vz); }
// dónde va a estar la pelota (rodando) en t segundos, más o menos
function pelotaEn(t) {
  if (B.dueno) return [B.x + B.dueno.vx * t, B.z + B.dueno.vz * t];
  const v = Math.hypot(B.vx, B.vz), roce = P.C.roce * 2.4;
  if (v < 0.05) return [B.x, B.z];
  const tPara = v / roce, tt = Math.min(t, tPara), d = v * tt - 0.5 * roce * tt * tt;
  return [B.x + B.vx / v * d, B.z + B.vz / v * d];
}
function soltarPelota() { if (B.dueno) { B.dueno = null; } B.enManos = null; }
// patada: deja la pelota con esa velocidad y efecto
function patear(j, vx, vy, vz, efecto, tipo, fuerza) {
  soltarPelota();
  B.vx = vx; B.vy = vy; B.vz = vz;
  const v = Math.hypot(vx, vz) || 1;
  B.wx = 0; B.wy = efecto || 0; B.wz = 0;
  if (vy > 2) { B.wx = -vz / v * 8; B.wz = vx / v * 8; }
  B.ultimo = j; B.tUlt = 0; j.noToca = tipo === 'tiro' ? 0.35 : 0.22;
  B.y = Math.max(B.y, FUT.R + 0.01);
  B.alArco = tipo === 'tiro' || tipo === 'especial';
  B.tipo = tipo;
  if (tipo === 'tiro' || tipo === 'especial') { Sonido.tiro(fuerza); P.stats.tiros[j.eq]++; } else Sonido.pase(fuerza);
}
// ---------- la física de la pelota ----------
function pasoPelota(dt) {
  if (B.enManos) {
    const g = B.enManos, fx = Math.sin(g.yaw), fz = Math.cos(g.yaw);
    B.x = g.x + fx * 0.32; B.z = g.z + fz * 0.32; B.y = g.est === 'saca' ? 1.6 : 0.95; B.vx = B.vy = B.vz = 0;
    return;
  }
  if (B.dueno) {
    const j = B.dueno, fx = Math.sin(j.yaw), fz = Math.cos(j.yaw), sp = Math.hypot(j.vx, j.vz);
    const d = 0.4 + sp * 0.045 + 0.13 * Math.max(0, Math.sin(j.fase * TAU * 2)) * Math.min(1, sp / 3);
    const tx = j.x + fx * d, tz = j.z + fz * d, k = 1 - Math.exp(-dt * (16 + j.st.gam * 10));
    const nx = lerp(B.x, tx, k), nz = lerp(B.z, tz, k);
    B.vx = (nx - B.x) / dt; B.vz = (nz - B.z) / dt; B.x = nx; B.z = nz; B.y = FUT.R; B.vy = 0;
    girarPelota(dt, true);
    paredes(dt);
    return;
  }
  const sub = 2, h = dt / sub, R0 = FUT.R, C = P.C;
  for (let s = 0; s < sub; s++) {
    const v = Math.hypot(B.vx, B.vy, B.vz);
    const enPiso = B.y <= R0 + 0.005 && Math.abs(B.vy) < 0.6;
    // aire: roce cuadrático y efecto (Magnus)
    if (!enPiso) {
      B.vx -= FUT.DRAG * v * B.vx * h; B.vy -= FUT.DRAG * v * B.vy * h; B.vz -= FUT.DRAG * v * B.vz * h;
      B.vx += FUT.MAGNUS * (B.wy * B.vz - B.wz * B.vy) * h; B.vy += FUT.MAGNUS * (B.wz * B.vx - B.wx * B.vz) * h * 0.4; B.vz += FUT.MAGNUS * (B.wx * B.vy - B.wy * B.vx) * h;
      B.vy -= FUT.G * h;
      B.vx += P.viento[0] * h * 0.55; B.vz += P.viento[1] * h * 0.55;
    } else {
      // rodando: roce del piso (más en los charcos)
      B.vy = 0; B.y = R0;
      let roce = C.roce * 2.4;
      for (const ch of P.E.charcos) if (Math.hypot(B.x - ch[0], (B.z - ch[1]) * 1.25) < ch[2]) { roce *= 3.2; if (v > 2 && vis() < 0.3) particula(B.x, 0.05, B.z, B.vx * 0.2 + rnd(-1, 1), rnd(1, 2.5), B.vz * 0.2 + rnd(-1, 1), 0.5, 0.09, '#9ac8f0', 0, 9.8, 1); }
      const vh = Math.hypot(B.vx, B.vz);
      if (vh > 0) { const nv = Math.max(0, vh - roce * h - 0.004 * vh * vh * h); B.vx *= nv / vh; B.vz *= nv / vh; }
      B.wy *= Math.max(0, 1 - 3 * h);
    }
    B.x += B.vx * h; B.y += B.vy * h; B.z += B.vz * h;
    // pique
    if (B.y < R0) {
      B.y = R0;
      if (B.vy < -0.6) { const vy = -B.vy; Sonido.rebote(vy); B.vy = vy * C.rebote; B.vx *= 0.86; B.vz *= 0.86; B.wy *= 0.6; if (vy > 3 && P.C.suelo !== 'pasto') polvo(B.x, B.z, 3); }
      else B.vy = 0;
    }
    paredes(h);
    palos(h);
  }
  girarPelota(dt, false);
}
function girarPelota(dt, rodando) {
  const R0 = FUT.R;
  let ax, ay, az;
  if (rodando || B.y <= R0 + 0.01) { ax = B.vz / R0; ay = 0; az = -B.vx / R0; }
  else { ax = B.wx; ay = B.wy; az = B.wz; }
  const w = Math.hypot(ax, ay, az), a = w * dt;
  if (a < 1e-5) return;
  const x = ax / w, y = ay / w, z = az / w, c = Math.cos(a), s = Math.sin(a), t = 1 - c;
  const Rm = [t * x * x + c, t * x * y + s * z, t * x * z - s * y, t * x * y - s * z, t * y * y + c, t * y * z + s * x, t * x * z + s * y, t * y * z - s * x, t * z * z + c];
  const o = B.rot, n = new Array(9);
  for (let i = 0; i < 3; i++) for (let j2 = 0; j2 < 3; j2++) n[j2 * 3 + i] = Rm[i] * o[j2 * 3] + Rm[3 + i] * o[j2 * 3 + 1] + Rm[6 + i] * o[j2 * 3 + 2];
  for (let i = 0; i < 9; i++) o[i] = n[i];
}
// paredes, arco y red
function paredes(h) {
  const A = P.A, L = P.L, R0 = FUT.R, xa = A / 2 - R0, zl = L / 2 - R0, ra = P.C.pared, an = ARCO.ancho / 2, alto = ARCO.alto;
  if (B.x > xa) { B.x = xa; if (B.vx > 0) { Sonido.pared(B.vx); B.vx = -B.vx * ra; B.vz *= 0.85; if (B.dueno) robarPorPared(); } }
  if (B.x < -xa) { B.x = -xa; if (B.vx < 0) { Sonido.pared(-B.vx); B.vx = -B.vx * ra; B.vz *= 0.85; if (B.dueno) robarPorPared(); } }
  const boca = Math.abs(B.x) < an - R0 * 0.6 && B.y < alto - R0 * 0.6;
  for (const s of [-1, 1]) {
    const dz = B.z * s;
    if (dz > zl && dz < L / 2 + 0.25 && !boca && B.enArco === 0) {
      B.z = s * zl; if (B.vz * s > 0) { Sonido.pared(Math.abs(B.vz)); B.vz = -B.vz * ra; B.vx *= 0.85; if (B.dueno) robarPorPared(); }
    }
    if (dz > L / 2 - 0.02 && boca && B.enArco === 0 && !B.dueno) B.enArco = s;
  }
  if (B.enArco) {
    const s = B.enArco, fondo = L / 2 + ARCO.fondo - R0;
    if (Math.abs(B.x) > an - R0) { B.x = Math.sign(B.x) * (an - R0); B.vx *= -0.15; B.vz *= 0.6; golpeRed(s, 0.5); }
    if (B.y > alto - R0) { B.y = alto - R0; B.vy *= -0.2; B.vz *= 0.7; golpeRed(s, 0.4); }
    if (B.z * s > fondo) { B.z = s * fondo; const v = Math.abs(B.vz); B.vz = -B.vz * 0.12; B.vx *= 0.5; B.vy *= 0.5; golpeRed(s, clamp(v / 14, 0.3, 1.4)); }
    // si salió para la cancha de nuevo (rebotó en la red)
    if (B.z * s < L / 2 - 0.3) B.enArco = 0;
    // gol: la pelota cruzó entera la línea entre los palos
    if (P.fase === 'juego' && B.z * s > L / 2 + R0 && !P.golMarcado) marcarGol(s < 0 ? 0 : 1);
  }
}
function golpeRed(s, k) {
  const r = R.red.find(x => x.z === s);
  if (r) { r.golpe[0] = B.x; r.golpe[1] = B.y; r.golpe[2] = B.z; r.golpe[3] = Math.max(r.golpe[3], k); }
  if (k > 0.6) Sonido.red();
}
function palos(h) {
  const L = P.L, an = ARCO.ancho / 2, alto = ARCO.alto, rp = 0.06, R0 = FUT.R;
  for (const s of [-1, 1]) {
    const z = s * L / 2;
    if (Math.abs(B.z - z) > 0.6) continue;
    for (const px of [-an, an]) {
      if (B.y > alto + R0) continue;
      const dx = B.x - px, dz = B.z - z, d = Math.hypot(dx, dz);
      if (d < R0 + rp && d > 1e-4) { const nx = dx / d, nz = dz / d, vn = B.vx * nx + B.vz * nz; B.x = px + nx * (R0 + rp); B.z = z + nz * (R0 + rp); if (vn < 0) { B.vx -= 1.7 * vn * nx; B.vz -= 1.7 * vn * nz; tocoPalo(); } }
    }
    if (Math.abs(B.x) < an) {
      const dy = B.y - alto, dz = B.z - z, d = Math.hypot(dy, dz);
      if (d < R0 + rp && d > 1e-4) { const ny = dy / d, nz = dz / d, vn = B.vy * ny + B.vz * nz; B.y = alto + ny * (R0 + rp); B.z = z + nz * (R0 + rp); if (vn < 0) { B.vy -= 1.7 * vn * ny; B.vz -= 1.7 * vn * nz; tocoPalo(); } }
    }
  }
}
function tocoPalo() {
  if (!Sonido.lim('palo', 0.3)) return;
  Sonido.poste(); texto('t_palo', B.x, B.y + 0.6, B.z, 1.1, AMARILLO); P.sacudir = Math.max(P.sacudir, 0.25); vibrar(30);
  if (P.fase === 'juego') { Sonido.uuh(); }
}
function robarPorPared() { /* con la pelota pegada, la pared sólo la frena */ }
// ---------- texto de historieta en la cancha ----------
function texto(k, x, y, z, tam, col, dur) { P.textos.push({ k, x, y, z, t: 0, dur: dur || 1.0, tam: tam || 1, col: col || AMARILLO, rot: azR(-0.2, 0.2) }); if (P.textos.length > 12) P.textos.shift(); }
function polvo(x, z, n) { const col = P.C.suelo === 'tierra' ? '#d8b48a' : P.C.suelo === 'pasto' ? '#7ac860' : '#c0c0c8'; for (let i = 0; i < n; i++) particula(x + rnd(-0.2, 0.2), 0.08, z + rnd(-0.2, 0.2), rnd(-1.2, 1.2), rnd(0.6, 2), rnd(-1.2, 1.2), rnd(0.35, 0.7), rnd(0.12, 0.22), col, 0, 2.5, 2); }
// ---------- los pibes: movimiento y acciones ----------
function velMax(j) {
  let v = 4.9 + 2.6 * j.st.vel;
  if (j.pique) v *= 1.2;
  if (B.dueno === j) v *= 0.9;
  if (j.est === 'carga') v *= 0.55;
  if (j.i === 0 && j.eq >= 0) v *= 0.92;
  return v;
}
function pasoJugador(j, dt) {
  j.t += dt; j.noToca = Math.max(0, j.noToca - dt); j.cdQuite = Math.max(0, j.cdQuite - dt); j.cdGam = Math.max(0, j.cdGam - dt); j.inv = Math.max(0, j.inv - dt);
  if (j.y > 0 || j.vy > 0) { j.vy -= FUT.G * dt; j.y += j.vy * dt; if (j.y <= 0) { j.y = 0; j.vy = 0; } }
  const st = j.est;
  if (st === 'caido') { j.vx *= Math.pow(0.02, dt); j.vz *= Math.pow(0.02, dt); if (j.t > j.dur) j.est = 'normal'; }
  else if (st === 'barre') {
    const k = j.t / j.dur;
    const f = k < 0.65 ? 1 : Math.max(0, 1 - (k - 0.65) * 3);
    j.vx = Math.sin(j.yaw) * j.velBarr * f; j.vz = Math.cos(j.yaw) * j.velBarr * f;
    if (k < 0.7) chequearBarrida(j);
    if (j.t > j.dur) { j.est = 'normal'; j.cdQuite = 0.6; }
    if (vis() < 0.4 && f > 0.3) polvo(j.x, j.z, 1);
  } else if (st === 'patea') {
    j.vx *= Math.pow(0.05, dt); j.vz *= Math.pow(0.05, dt);
    if (j.accion && !j.accion.hecho && j.t >= j.accion.golpe) { j.accion.hecho = true; ejecutarPatada(j, j.accion); }
    if (j.t > j.dur) { j.est = 'normal'; j.accion = null; }
  } else if (st === 'gambeta') {
    const k = j.t / j.dur;
    j.vx = j.gdx * 6.8 * (1 - k * 0.6); j.vz = j.gdz * 6.8 * (1 - k * 0.6);
    if (j.t > j.dur) j.est = 'normal';
  } else if (st === 'cabecea') {
    if (j.remate && !j.remate.hecho && j.t > 0.12) intentarRemate(j);
    if (j.t > j.dur) { j.est = 'normal'; j.remate = null; }
  } else if (st === 'estira') {
    const k = j.t / j.dur;
    if (k < 0.55) { j.x += j.velEst * dt; }
    j.vx = 0; j.vz = 0;
    if (k < 0.62) chequearAtajada(j, true);
    if (j.t > j.dur) { j.est = 'normal'; }
  } else if (st === 'ataja' || st === 'saca') {
    j.vx = 0; j.vz = 0;
    if (st === 'saca' && j.t >= 0.3 && j.accion && !j.accion.hecho) { j.accion.hecho = true; ejecutarPatada(j, j.accion); }
    if (st === 'saca' && j.t > 0.55) { j.est = 'normal'; j.accion = null; }
  } else if (st === 'festeja' || st === 'triste') {
    const sp = Math.hypot(j.dx, j.dz);
    const tv = st === 'festeja' ? 6 : 1.2;
    j.vx = lerp(j.vx, j.dx * tv, 1 - Math.exp(-dt * 4)); j.vz = lerp(j.vz, j.dz * tv, 1 - Math.exp(-dt * 4));
    void sp;
  } else {
    // normal o cargando un tiro: acelera hacia lo que quiere
    const vm = velMax(j), tx = j.dx * vm, tz = j.dz * vm;
    let ddx = tx - j.vx, ddz = tz - j.vz, l = Math.hypot(ddx, ddz), ac = FUT.ACEL * (0.8 + j.st.vel * 0.4) * dt;
    if (l > ac) { ddx *= ac / l; ddz *= ac / l; }
    j.vx += ddx; j.vz += ddz;
  }
  j.x += j.vx * dt; j.z += j.vz * dt;
  // mirar: hacia donde corre, o hacia la pelota si está parado
  const sp = Math.hypot(j.vx, j.vz);
  let ya = null;
  if (st === 'normal' || st === 'carga') { if (sp > 0.6) ya = Math.atan2(j.vx, j.vz); else if (j.mira) ya = Math.atan2(j.mira[0] - j.x, j.mira[1] - j.z); else ya = Math.atan2(B.x - j.x, B.z - j.z); }
  else if (st === 'festeja' && sp > 0.5) ya = Math.atan2(j.vx, j.vz);
  if (ya != null) { const giro = (B.dueno === j ? 8 : 11) * dt; j.yaw += clamp(angDif(j.yaw, ya), -giro, giro); }
  if (st === 'carga') { const ya2 = Math.atan2(-j.x * 0.3, arcoZ(1 - j.eq) - j.z); j.yaw += clamp(angDif(j.yaw, ya2), -5 * dt, 5 * dt); }
  // límites de la cancha
  const xa = P.A / 2 - 0.3, za = P.L / 2 - 0.3;
  j.x = clamp(j.x, -xa, xa);
  if (Math.abs(j.x) > ARCO.ancho / 2 - 0.2 || j.i !== 0) j.z = clamp(j.z, -za, za);
  else j.z = clamp(j.z, -za - ARCO.fondo * 0.6, za + ARCO.fondo * 0.6);
  // ciclo de la carrera
  j.fase += sp * dt / (1.25 + sp * 0.12);
}
// que no se encimen
function separarJugadores() {
  const L = P.jug;
  for (let a = 0; a < L.length; a++) for (let b = a + 1; b < L.length; b++) {
    const p = L[a], q = L[b];
    if (p.est === 'caido' || q.est === 'caido') continue;
    const dx = q.x - p.x, dz = q.z - p.z, d = Math.hypot(dx, dz), min = 0.62;
    if (d < min && d > 1e-4) { const k = (min - d) / 2, nx = dx / d, nz = dz / d; p.x -= nx * k; p.z -= nz * k; q.x += nx * k; q.z += nz * k; }
  }
}
// ---------- posesión ----------
function puedeControlar(j) {
  if (j.noToca > 0 || j.est === 'caido' || j.est === 'estira' || j.est === 'barre' || j.est === 'festeja' || j.est === 'triste') return false;
  return true;
}
function chequearPosesion() {
  if (B.dueno || B.enManos || P.fase !== 'juego') return;
  const v = Math.hypot(B.vx, B.vz);
  let mejor = null, md = 1e9;
  for (const j of P.jug) {
    if (!puedeControlar(j)) continue;
    const d = Math.hypot(B.x - j.x, B.z - j.z);
    const alc = FUT.CTRL + (j.i === 0 && enArea(j.eq, B.x, B.z) ? 0.45 : 0);
    if (d > alc) continue;
    const alto = B.y - FUT.R;
    // arquero en su área: con las manos hasta arriba
    if (j.i === 0 && enArea(j.eq, j.x, j.z) && alto < 1.9) { if (d < md) { md = d; mejor = j; } continue; }
    if (alto > 0.62) continue;
    const lim = 9 + 9 * j.st.gam + (alto < 0.2 ? 3 : 0);
    if (v > lim) {
      // muy fuerte: rebota en el cuerpo
      if (d < 0.42 && B.ultimo !== j) { B.vx *= -0.35; B.vz *= -0.35; B.vy = Math.max(B.vy, 1.2); B.ultimo = j; Sonido.quite(); }
      continue;
    }
    if (d < md) { md = d; mejor = j; }
  }
  if (mejor) tomarPelota(mejor);
}
function enArea(eq, x, z) { return Math.abs(x) < FUT.AREA_X && Math.abs(z - arcoZ(eq)) < FUT.AREA_Z && Math.sign(z) === Math.sign(arcoZ(eq)); }
function tomarPelota(j) {
  const antes = B.ultimo;
  // pase completo
  if (antes && antes !== j && antes.eq === j.eq && B.tipo === 'pase') { P.stats.pasesOk[j.eq]++; sumarAguante(j.eq, 4); }
  if (antes && antes.eq !== j.eq && B.tipo === 'pase') { P.stats.quites[j.eq]++; }
  B.vy = 0; B.ultimo = j; B.tUlt = 0; B.tipo = null; B.alArco = false;
  if (j.i === 0 && enArea(j.eq, j.x, j.z)) {
    // el arquero la agarra con las manos
    const fuerte = velPelota() > 11;
    B.enManos = j; B.dueno = null; j.est = 'ataja'; j.t = 0; j.vx = j.vz = 0;
    Sonido.atajada();
    if (antes && antes.eq !== j.eq && (B.alArcoAntes || fuerte)) { P.stats.ataj[j.eq]++; sumarAguante(j.eq, 6); texto('t_atajo', j.x, 2.1, j.z, 1.1, CELESTE); }
    return;
  }
  B.dueno = j;
  // el pase llegó a uno nuestro: lo manejás vos
  if (j.eq === 0 && P.humano && P.humano !== j && !BOT_TODO) cambiarA(j);
  if (j.eq !== 0 && OP.cambioAuto && P.humano) autoCambio();
}
function cambiarA(j) { if (!j || j.i === 0) return; if (P.humano) P.humano.humano = false; P.humano = j; j.humano = true; P.carga = 0; }
function autoCambio() {
  // cuando la tienen ellos: el más cercano a la pelota (si conviene cambiar)
  const nos = equipoDe(0).filter(j => j.i !== 0), act = P.humano;
  let mejor = act, md = act ? Math.hypot(act.x - B.x, act.z - B.z) - 2.5 : 1e9;
  for (const j of nos) { const d = Math.hypot(j.x - B.x, j.z - B.z); if (d < md) { md = d; mejor = j; } }
  if (mejor !== act) cambiarA(mejor);
}
// ---------- acciones ----------
function empezarPatada(j, ac) {
  j.est = 'patea'; j.t = 0; j.accion = ac; ac.hecho = false;
  j.dur = ac.tipo === 'pase' ? 0.32 : ac.tipo === 'globo' ? 0.42 : 0.5;
  ac.golpe = ac.tipo === 'pase' ? 0.07 : ac.tipo === 'globo' ? 0.13 : 0.16;
  if (ac.tipo === 'especial') { j.dur = 0.6; ac.golpe = 0.05; }
  // girar hacia donde va
  if (ac.yaw != null) j.yaw = ac.yaw;
  ac.pie = 1;
}
function ejecutarPatada(j, ac) {
  if (j.i === 0 && B.enManos === j) { B.enManos = null; }
  else if (B.dueno !== j) return;   // se la sacaron antes
  const vx = ac.vx, vy = ac.vy, vz = ac.vz;
  patear(j, vx, vy, vz, ac.efecto || 0, ac.tipo === 'globo' || ac.tipo === 'pase' || ac.tipo === 'saque' ? 'pase' : ac.tipo, ac.fuerza || 0.5);
  if (ac.tipo === 'pase' || ac.tipo === 'globo' || ac.tipo === 'saque') P.stats.pases[j.eq]++;
  if (ac.tipo === 'tiro' && (ac.fuerza || 0) > 0.72) { texto('t_pum', B.x, 1.4, B.z, 1.2, ROJO, 0.7); P.sacudir = Math.max(P.sacudir, 0.3); P.tLento = 0.06; }
  if (ac.tipo === 'especial') { P.especialPelota = { t: 0, eq: j.eq, j }; }
  B.x += Math.sin(j.yaw) * 0.05; B.z += Math.cos(j.yaw) * 0.05;
}
// el mejor compañero para pasarle, mirando hacia (dx, dz)
function mejorPase(j, dx, dz, largo) {
  const comp = equipoDe(j.eq), riv = equipoDe(1 - j.eq), da = dirAt(j.eq);
  const hay = Math.hypot(dx, dz) > 0.2;
  let mejor = null, ms = -1e9;
  for (const t of comp) {
    if (t === j) continue;
    const ex = t.x - j.x, ez = t.z - j.z, d = Math.hypot(ex, ez);
    if (d < 2.2 || d > (largo ? 34 : 26)) continue;
    const vp = largo ? 13 : clamp(d * 1.1 + 5, 8, 17), tl = d / vp;
    const px = t.x + t.vx * tl * 0.85, pz = t.z + t.vz * tl * 0.85;
    let abierto = 4;
    for (const o of riv) {
      const sx = px - j.x, sz = pz - j.z, l2 = sx * sx + sz * sz, u = clamp(((o.x - j.x) * sx + (o.z - j.z) * sz) / l2, 0, 1);
      const qx = j.x + sx * u - o.x, qz = j.z + sz * u - o.z;
      abierto = Math.min(abierto, Math.hypot(qx, qz) * (largo ? 1.6 : 1) + (u > 0.95 ? 0.4 : 0));
    }
    const alin = hay ? (ex * dx + ez * dz) / d : 0;
    if (hay && alin < 0.2) continue;
    const avance = (pz - j.z) * da;
    let s = (hay ? alin * 4 : 0) + avance * 0.1 + abierto * 0.7 - Math.abs(d - 11) * 0.05 - (t.i === 0 ? 3 : 0);
    if (s > ms) { ms = s; mejor = { t, px, pz, d, abierto, s }; }
  }
  return mejor;
}
function pasar(j, dx, dz, largo) {
  let m = mejorPase(j, dx, dz, largo);
  let px, pz, d;
  if (m) { px = m.px; pz = m.pz; d = Math.hypot(px - j.x, pz - j.z); }
  else {
    // a nadie: al espacio hacia donde mira
    const yaw = Math.hypot(dx, dz) > 0.2 ? Math.atan2(dx, dz) : j.yaw;
    d = largo ? 14 : 9; px = j.x + Math.sin(yaw) * d; pz = j.z + Math.cos(yaw) * d;
  }
  const yaw = Math.atan2(px - j.x, pz - j.z), err = (1 - j.st.pase) * 0.08 * (az() - 0.5) * 2;
  const ya = yaw + err;
  if (largo) {
    const th = 0.62, vv = Math.sqrt(Math.max(4, d) * FUT.G / Math.sin(2 * th)) * (1.05 + d * 0.004);
    empezarPatada(j, { tipo: 'globo', vx: Math.sin(ya) * vv * Math.cos(th), vy: vv * Math.sin(th), vz: Math.cos(ya) * vv * Math.cos(th), yaw: ya, fuerza: 0.6, rec: m && m.t });
  } else {
    const v = clamp(d * 1.05 + 5.5, 8, 18);
    empezarPatada(j, { tipo: 'pase', vx: Math.sin(ya) * v, vy: d > 14 ? 1.2 : 0.2, vz: Math.cos(ya) * v, yaw: ya, fuerza: v / 18, rec: m && m.t });
  }
  if (m && m.t.eq === 0 && j.eq === 0) P.receptor = m.t;
}
// tiro: lateral de -1 a 1 (null: al palo lejos del arquero), potencia de 0 a 1
function tirar(j, lateral, potencia, especial) {
  const s = dirAt(j.eq), gz = -arcoZ(j.eq), an = ARCO.ancho / 2, gk = arqueroDe(1 - j.eq);
  let lado = lateral;
  if (lado == null || Math.abs(lado) < 0.25) { lado = gk.x > j.x * 0.3 ? -1 : 1; if (az() < 0.25) lado = -lado; lado *= 0.6 + az() * 0.4; }
  const tx = clamp(lado, -1, 1) * (an - 0.35), ty = 0.3 + potencia * 1.05 + (az() - 0.5) * 0.3, tz = gz + s * 0.4;
  let speed = lerp(14, 27, potencia) * (0.82 + 0.25 * j.st.tiro);
  if (especial) speed = 31;
  const dx = tx - B.x, dz = tz - B.z, D = Math.hypot(dx, dz);
  let yaw = Math.atan2(dx, dz);
  // error: peor de lejos, con presión y si te pasás de fuerza
  let presion = 0; for (const o of equipoDe(1 - j.eq)) { const d = Math.hypot(o.x - j.x, o.z - j.z); if (d < 2) presion = Math.max(presion, 1 - d / 2); }
  const err = especial ? 0.01 : (0.035 + (1 - j.st.tiro) * 0.07 + presion * 0.05 + Math.max(0, D - 14) * 0.004) * (az() - 0.5) * 2;
  yaw += err;
  const k = FUT.DRAG, T = (Math.exp(k * D) - 1) / (k * speed);
  let vy = (ty - FUT.R + 0.5 * FUT.G * T * T) / T;
  if (potencia > 0.94 && !especial) vy += (potencia - 0.94) * 40;
  vy += (az() - 0.5) * (1 - j.st.tiro) * 2.5;
  const ef = especial ? -lado * 9 : (az() - 0.5) * 3;
  empezarPatada(j, { tipo: especial ? 'especial' : 'tiro', vx: Math.sin(yaw) * speed, vy, vz: Math.cos(yaw) * speed, yaw: Math.atan2(dx, dz), efecto: ef, fuerza: potencia });
  if (especial) { const c = j.accion; c.vx -= Math.sign(-lado) * 2.5; }
}
function gambeta(j, dx, dz) {
  if (j.cdGam > 0 || B.dueno !== j) return false;
  // al costado: hacia donde apunta el palito o lejos del rival más cercano
  let gx, gz;
  const fx = Math.sin(j.yaw), fz = Math.cos(j.yaw);
  if (Math.hypot(dx, dz) > 0.3) { gx = dx; gz = dz; }
  else { let o = null, md = 1e9; for (const r of equipoDe(1 - j.eq)) { const d = Math.hypot(r.x - j.x, r.z - j.z); if (d < md) { md = d; o = r; } } const side = o ? Math.sign((o.x - j.x) * fz - (o.z - j.z) * fx) || 1 : 1; gx = -fz * side + fx * 0.6; gz = fx * side + fz * 0.6; }
  const l = Math.hypot(gx, gz); j.gdx = gx / l; j.gdz = gz / l;
  j.est = 'gambeta'; j.t = 0; j.dur = 0.3; j.inv = 0.36; j.cdGam = 0.75;
  Sonido.whoosh();
  // si alguien venía a sacártela: ¡caño!
  for (const r of equipoDe(1 - j.eq)) if ((r.est === 'barre' || r.quiteT > 0) && Math.hypot(r.x - j.x, r.z - j.z) < 2.4) { texto('t_cano', j.x, 1.9, j.z, 1.1, VERDE); sumarAguante(j.eq, 12); break; }
  return true;
}
function barrida(j) {
  if (j.cdQuite > 0 || j.est !== 'normal') return false;
  j.est = 'barre'; j.t = 0; j.dur = 0.62; j.velBarr = 7.5 + j.st.def * 1.5; j.barrioYa = false;
  // apunta a la pelota si está cerca
  const d = Math.hypot(B.x - j.x, B.z - j.z);
  if (d < 4) j.yaw = Math.atan2(B.x - j.x, B.z - j.z);
  Sonido.barrida();
  return true;
}
function chequearBarrida(j) {
  if (j.barrioYa) return;
  const fx = Math.sin(j.yaw), fz = Math.cos(j.yaw);
  const pieX = j.x + fx * 0.55, pieZ = j.z + fz * 0.55;
  const d = Math.hypot(B.x - pieX, B.z - pieZ);
  const dueno = B.dueno;
  if (d < 0.62 && B.y < 0.6) {
    j.barrioYa = true;
    if (dueno && dueno.inv > 0) return;
    if (dueno === j) return;
    const robo = dueno ? az() < 0.45 + j.st.def * 0.4 - dueno.st.gam * 0.2 : true;
    if (!robo) return;
    soltarPelota();
    B.vx = fx * (4 + az() * 3) + (az() - 0.5) * 2; B.vz = fz * (4 + az() * 3) + (az() - 0.5) * 2; B.vy = 1 + az();
    B.ultimo = j; B.tipo = null; j.noToca = 0.15;
    Sonido.quite(); texto('t_zas', B.x, 1.2, B.z, 1, NARANJA); P.sacudir = Math.max(P.sacudir, 0.18); vibrar(25);
    if (dueno) { P.stats.quites[j.eq]++; sumarAguante(j.eq, 8); if (az() < 0.3) caer(dueno, 0.8); }
    return;
  }
  // le pegó al jugador antes que a la pelota
  for (const o of equipoDe(1 - j.eq)) {
    if (o.est === 'caido' || o.inv > 0 || B.enManos === o) continue;
    if (Math.hypot(o.x - pieX, o.z - pieZ) < 0.55) { j.barrioYa = true; caer(o, 1.1); if (B.dueno === o) { soltarPelota(); B.vx = o.vx * 0.6 + (az() - 0.5) * 3; B.vz = o.vz * 0.6 + (az() - 0.5) * 3; B.vy = 0.8; B.ultimo = j; B.tipo = null; } Sonido.caida(); texto('t_ay', o.x, 1.7, o.z, 0.9, BLANCO); return; }
  }
}
function caer(j, dur) { if (B.enManos === j) return; j.est = 'caido'; j.t = 0; j.dur = dur || 1; if (B.dueno === j) soltarPelota(); j.accion = null; polvo(j.x, j.z, 5); }
// quite parado (la IA y el que está cerca)
function quiteParado(j, o) {
  if (j.cdQuite > 0 || o.inv > 0 || B.dueno !== o) return;
  j.cdQuite = 1.0; j.quiteT = 0.3;
  const p = 0.32 + j.st.def * 0.42 - o.st.gam * 0.3 + (Math.hypot(o.vx, o.vz) > 5 ? 0.05 : 0.1);
  if (az() < p) {
    soltarPelota(); B.ultimo = j; B.tipo = null; Sonido.quite();
    if (az() < 0.55) { B.dueno = j; if (j.eq === 0 && P.humano !== j && !BOT_TODO) cambiarA(j); if (j.eq !== 0 && OP.cambioAuto) autoCambio(); }
    else { B.vx = (B.x - o.x) * 6 + (az() - 0.5) * 3; B.vz = (B.z - o.z) * 6 + (az() - 0.5) * 3; B.vy = 0.5; }
    texto('t_zas', o.x, 1.6, o.z, 0.85, NARANJA); P.stats.quites[j.eq]++; sumarAguante(j.eq, 6);
  }
}
// cabezazo o volea: se arma y espera a que llegue la pelota
function prepararRemate(j, tipo) {
  if (j.est !== 'normal') return false;
  const alto = B.y - FUT.R;
  j.est = 'cabecea'; j.t = 0; j.dur = 0.45; j.remate = { tipo, hecho: false, cabeza: alto > 0.85 };
  if (alto > 0.85) j.vy = 3.6;
  return true;
}
function intentarRemate(j) {
  const r = j.remate, alto = B.y - FUT.R, d = Math.hypot(B.x - j.x, B.z - j.z);
  if (!pelotaLibre() || d > 1.25 || alto < 0.25 || alto > 2.5 + j.y) return;
  r.hecho = true;
  const s = dirAt(j.eq);
  if (r.tipo === 'tiro') {
    const gz = -arcoZ(j.eq), gk = arqueroDe(1 - j.eq), lado = gk.x > 0 ? -1 : 1, tx = lado * (ARCO.ancho / 2 - 0.4) * (0.5 + az() * 0.5);
    const dx = tx - B.x, dz = gz + s * 0.3 - B.z, D = Math.hypot(dx, dz), v = r.cabeza ? 15 + j.st.tiro * 5 : 19 + j.st.tiro * 7;
    const yaw = Math.atan2(dx, dz) + (az() - 0.5) * 0.12, T = D / v, vy = (0.6 - B.y + 0.5 * FUT.G * T * T) / T;
    patear(j, Math.sin(yaw) * v, vy, Math.cos(yaw) * v, 0, 'tiro', 0.8);
    texto(r.cabeza ? 't_cabeza' : 't_volea', j.x, 2.3, j.z, 1.05, AMARILLO);
  } else {
    const m = mejorPase(j, 0, s, false), px = m ? m.px : j.x, pz = m ? m.pz : j.z + s * 8, d2 = Math.hypot(px - B.x, pz - B.z), v = clamp(d2 * 1.1 + 4, 8, 15), yaw = Math.atan2(px - B.x, pz - B.z);
    patear(j, Math.sin(yaw) * v, 2, Math.cos(yaw) * v, 0, 'pase', 0.5);
  }
  sumarAguante(j.eq, 5);
}
// ---------- el arquero ----------
function pasoArquero(g, dt) {
  const eq = g.eq, gz = arcoZ(eq), s = -dirAt(eq);   // s: hacia afuera de su arco (al fondo)
  if (g.est === 'estira' || g.est === 'caido' || g.est === 'patea') return;
  if (B.enManos === g) {
    g.mira = [0, 0];
    if (g.est !== 'ataja' && g.est !== 'saca') { g.est = 'ataja'; g.t = 0; }
    if (g.est === 'ataja' && g.t > (g.eq === 0 ? 0.9 : 1.1)) sacarArquero(g);
    return;
  }
  // lectura del tiro
  if (pelotaLibre() && B.vz * s > 4 && Math.abs(B.z - gz) < 24) {
    const tz = gz - s * 0.5, t = (tz - B.z) / B.vz;
    if (t > 0 && t < 2.2) {
      const xh = B.x + B.vx * t, yh = Math.max(FUT.R, B.y + B.vy * t - 0.5 * FUT.G * t * t);
      if (Math.abs(xh) < ARCO.ancho / 2 + 0.7 && yh < ARCO.alto + 0.5) {
        B.alArcoAntes = true;
        g.reac = (g.reac || 0) + dt;
        const reac = (0.27 - 0.15 * g.st.arq) * (B.tipo === 'especial' ? 2.2 : 1);
        if (g.reac >= reac) {
          const dx = xh - g.x;
          if (Math.abs(dx) < 0.55 && yh < 1.7) { g.dx = 0; g.dz = 0; chequearAtajada(g, false); }
          else if (g.est === 'normal') {
            g.est = 'estira'; g.t = 0; g.dur = 0.85; g.lado = Math.sign(dx); g.altoEst = clamp(yh / 1.8, 0, 1);
            const alc = 1.6 + g.st.arq * 1.1;
            g.velEst = clamp(dx, -alc, alc) / 0.42;
            Sonido.whoosh();
          }
          return;
        }
      }
    }
  } else g.reac = 0;
  // achicar: entre la pelota y el centro del arco; sale a buscarla si está cerca y libre
  const bx = B.x, bz = B.z, dB = Math.hypot(bx, bz - gz);
  const libreCerca = pelotaLibre() && enArea(eq, bx, bz) && tiempoA(g, bx, bz) < tiempoRival(eq, bx, bz) - 0.1;
  if (libreCerca) { const [px, pz] = pelotaEn(0.3); g.dx = px - g.x; g.dz = pz - g.z; const l = Math.hypot(g.dx, g.dz); if (l > 0.01) { g.dx /= l; g.dz /= l; } g.pique = true; g.mira = null; return; }
  g.pique = false;
  const prof = clamp(0.9 + (1 - dB / 22) * 1.6, 0.8, 2.6);
  const ang = Math.atan2(bx, (bz - gz) * -s);
  let tx = Math.sin(ang) * prof * 0.9, tz = gz - s * Math.cos(ang) * prof;
  tx = clamp(tx, -ARCO.ancho / 2 - 0.2, ARCO.ancho / 2 + 0.2);
  const ex = tx - g.x, ez = tz - g.z, l = Math.hypot(ex, ez);
  if (l > 0.08) { const k = Math.min(1, l / 0.8); g.dx = ex / l * k; g.dz = ez / l * k; } else { g.dx = 0; g.dz = 0; }
  g.mira = [bx, bz];
}
function chequearAtajada(g, estirado) {
  if (!pelotaLibre() || B.ultimo === g) return;
  let hx = g.x, hy = 1.0, hz = g.z;
  if (estirado) { const k = clamp(g.t / 0.4, 0, 1); hx = g.x + g.lado * 0.55 * k; hy = lerp(1.0, 0.25 + g.altoEst * 1.6, k); }
  const alc = 0.5 + g.st.arq * 0.28 + (estirado ? 0.1 : 0);
  const dx = B.x - hx, dy = B.y - hy, dz = B.z - hz;
  if (Math.abs(dx) < alc && Math.abs(dy) < 0.75 && Math.abs(dz) < 0.55) {
    const v = velPelota(), esp = B.tipo === 'especial';
    if (esp && az() < (P.cfg.rivalArqueroBueno && g.eq === 1 ? 0.55 : 0.72)) return;   // el especial casi siempre entra
    B.alArcoAntes = false;
    P.stats.ataj[g.eq]++; sumarAguante(g.eq, 7);
    if (!esp && v < 15 + 6 * g.st.arq && Math.abs(dx) < 0.45) {
      B.enManos = g; B.dueno = null; B.vx = B.vy = B.vz = 0; g.est = 'ataja'; g.t = 0; B.ultimo = g; B.tipo = null;
      Sonido.atajada(); texto('t_atajo', g.x, 2.2, g.z, 1.15, CELESTE);
    } else {
      // la manda al córner
      const s = -dirAt(g.eq);
      B.vz = -B.vz * 0.3 - s * (3 + az() * 3); B.vx = (Math.sign(dx) || 1) * (3 + az() * 4); B.vy = 2.5 + az() * 3; B.ultimo = g; B.tipo = null; B.alArco = false;
      Sonido.atajada(); texto('t_atajo', g.x, 2.2, g.z, 1.15, CELESTE); P.sacudir = Math.max(P.sacudir, 0.2);
      g.noToca = 0.4;
    }
    vibrar(20);
    Sonido.aplausos(0.8, 0.05);
  }
}
function sacarArquero(g) {
  const s = dirAt(g.eq);
  let m = mejorPase(g, 0, s, false);
  const px = m ? m.px : g.x + 4, pz = m ? m.pz : g.z + s * 10, d = Math.hypot(px - g.x, pz - g.z), yaw = Math.atan2(px - g.x, pz - g.z);
  const v = clamp(d * 1.0 + 5, 8, 16);
  g.est = 'saca'; g.t = 0; g.yaw = yaw;
  g.accion = { tipo: 'saque', vx: Math.sin(yaw) * v, vy: d > 12 ? 4 : 1.5, vz: Math.cos(yaw) * v, fuerza: 0.4, hecho: false };
  if (m && m.t.eq === 0 && g.eq === 0 && !BOT_TODO) cambiarA(m.t);
}
function tiempoA(j, x, z) { return Math.hypot(x - j.x, z - j.z) / velMax(j) + (j.est === 'normal' ? 0 : 0.4); }
function tiempoRival(eq, x, z) { let m = 1e9; for (const o of equipoDe(1 - eq)) m = Math.min(m, tiempoA(o, x, z)); return m; }
// ---------- aguante y especial ----------
function sumarAguante(eq, n) { if (!P || P.fase !== 'juego') return; const antes = P.aguante[eq]; P.aguante[eq] = Math.min(100, P.aguante[eq] + n * (eq === 1 && !P.cfg.especialRival ? 0 : 1)); if (eq === 0 && antes < 100 && P.aguante[0] >= 100) { Sonido.desbloqueo(); texto('t_aguante', P.humano.x, 2.4, P.humano.z, 1, AMARILLO, 1.6); } }
function especialListo() { return !!(P && P.fase === 'juego' && P.aguante[0] >= 100 && B.dueno && B.dueno === P.humano && (B.z - 0) * dirAt(0) > -2 && P.humano.est === 'normal'); }
function empezarEspecial(j) {
  P.aguante[j.eq] = 0; P.stats.esp[j.eq]++;
  P.especial = { t: 0, j, dur: 1.5, nombre: j.eq === 0 ? 'esp_' + j.nom.toLowerCase() : (EQUIPOS[P.eqs[1]].especialRival || 'esp_rival') };
  Sonido.especial(); vibrar([40, 30, 60]);
  j.yaw = Math.atan2(-B.x * 0.4, -arcoZ(j.eq) - j.z);
}
function pasoEspecial(dt) {
  const E = P.especial;
  E.t += dt;
  if (E.t >= E.dur) {
    const j = E.j; P.especial = null;
    if (B.dueno === j) tirar(j, j.x > 0 ? -1 : 1, 1, true);
  }
}
// ---------- goles ----------
function marcarGol(eq) {
  P.golMarcado = true; P.goles[eq]++;
  const autor = B.ultimo && B.ultimo.eq === eq ? B.ultimo : null;
  P.ultimoGol = { eq, autor, t: P.cfg.dur / 2 - P.reloj + (P.mitad - 1) * P.cfg.dur / 2, especial: B.tipo === 'especial' };
  P.eventos.push({ tipo: 'gol', eq, autor: autor && autor.nom });
  sumarAguante(eq, 20);
  if (eq === 0) { Sonido.gol(P.C.gente); vibrar([60, 40, 90]); } else Sonido.golRival();
  P.fase = 'gol'; P.tFase = 0; P.lento = 0.35; P.sacudir = 0.6;
  for (const j of P.jug) { j.dx = 0; j.dz = 0; j.accion = null; if (j.est === 'carga') j.est = 'normal'; }
  if (autor) { autor.est = 'festeja'; autor.t = 0; autor.fest = ['brazos', 'avion', 'rodillas', 'puno', 'senal'][Math.floor(az() * 5)]; }
  for (const j of equipoDe(eq)) if (j !== autor && j.i !== 0) { j.est = 'festeja'; j.t = 0; j.fest = 'brazos'; }
  for (const j of equipoDe(1 - eq)) if (j.i !== 0) { j.est = 'triste'; j.t = 0; }
  if (P.E.C.gente > 0.5 || eq === 0) for (let i = 0; i < 90; i++) particula(rnd(-P.A / 2, P.A / 2), rnd(4, 9), arcoZ(1 - eq) * 0.8 + rnd(-6, 6), rnd(-1, 1), rnd(-0.5, 0.5), rnd(-1, 1), 4, rnd(0.12, 0.2), [AMARILLO, BLANCO, CELESTE, ROSA, VERDE, ROJO][i % 6], 1, 0.9, 1.2);
}
// ---------- la repetición: se guarda todo lo que se dibuja ----------
const REP_N = 400, REP_J = 31, REP_TAM = 10 * REP_J + 12 + 8;
function grabarCuadro() {
  const r = P.rep, o = r.i * REP_TAM, b = r.buf;
  let k = o;
  for (const j of P.jug) { const m = j.m; b[k++] = m.x; b[k++] = m.y; b[k++] = m.z; b[k++] = m.yaw; b[k++] = m.cara; b[k++] = m.tinte ? 1 : 0; b[k++] = 0; for (const c of CAMPOS_POSE) b[k++] = m.pose[c]; }
  b[k++] = B.x; b[k++] = B.y; b[k++] = B.z; for (let i = 0; i < 9; i++) b[k++] = B.rot[i];
  for (const rr of R.red.slice(0, 2)) for (let i = 0; i < 4; i++) b[k++] = rr.golpe[i];
  r.i = (r.i + 1) % REP_N; r.n = Math.min(REP_N, r.n + 1);
}
function leerCuadro(idx) {
  const r = P.rep, o = (((r.i - r.n + idx) % REP_N) + REP_N) % REP_N * REP_TAM, b = r.buf;
  let k = o;
  for (const j of P.jug) { const m = j.m; m.x = b[k++]; m.y = b[k++]; m.z = b[k++]; m.yaw = b[k++]; m.cara = b[k++]; k++; k++; for (const c of CAMPOS_POSE) m.pose[c] = b[k++]; posarMuneco(m); }
  B.m.x = b[k++]; B.m.y = b[k++]; B.m.z = b[k++]; const rot = []; for (let i = 0; i < 9; i++) rot.push(b[k++]);
  matrizPelota(B.m.x, B.m.y, B.m.z, rot);
  for (const rr of R.red.slice(0, 2)) for (let i = 0; i < 4; i++) rr.golpe[i] = b[k++];
}
function matrizPelota(x, y, z, rot) {
  const m = B.m.huesos, s = 1.4;
  m[0] = rot[0] * s; m[1] = rot[1] * s; m[2] = rot[2] * s; m[3] = 0; m[4] = rot[3] * s; m[5] = rot[4] * s; m[6] = rot[5] * s; m[7] = 0; m[8] = rot[6] * s; m[9] = rot[7] * s; m[10] = rot[8] * s; m[11] = 0;
  m[12] = x; m[13] = Math.max(y, 0.125 * s); m[14] = z; m[15] = 1;
}
// ---------- las poses de cada uno (se calculan en el paso, para poder repetirlas) ----------
function animarJugador(j, dt) {
  const m = j.m, p = m.pose;
  m.x = j.x; m.z = j.z; m.y = j.y; m.yaw = j.yaw;
  const sp = Math.hypot(j.vx, j.vz), v = clamp((sp - 2) / 5, 0, 1);
  switch (j.est) {
    case 'patea': { const ac = j.accion || { golpe: 0.1, tipo: 'pase' }, ka = j.t < ac.golpe ? 0.42 * j.t / ac.golpe : 0.42 + (j.t - ac.golpe) / Math.max(0.05, j.dur - ac.golpe) * 0.58; pPatear(poseVaciaEn(p), clamp(ka, 0, 1), ac.pie || 1, ac.tipo === 'pase' ? 0.2 : ac.tipo === 'globo' ? 0.55 : 1); break; }
    case 'barre': pBarrida(poseVaciaEn(p), j.t / j.dur, 1); break;
    case 'caido': pCaido(poseVaciaEn(p), j.t / j.dur); break;
    case 'gambeta': pCorrer(poseVaciaEn(p), j.fase, 1); p.tr = 0.35 * Math.sin(j.t / j.dur * PI) * Math.sign(j.gdx * Math.cos(j.yaw) - j.gdz * Math.sin(j.yaw)); break;
    case 'cabecea': if (j.remate && j.remate.cabeza) pCabezazo(poseVaciaEn(p), j.t / j.dur); else pPatear(poseVaciaEn(p), 0.3 + j.t / j.dur * 0.7, 1, 0.8); break;
    case 'estira': pEstirada(poseVaciaEn(p), j.t / j.dur, j.lado, j.altoEst); m.y = Math.max(0, Math.sin(clamp(j.t / 0.5, 0, 1) * PI) * 0.35 * (0.4 + j.altoEst)); break;
    case 'ataja': pAtajar(poseVaciaEn(p), j.t); break;
    case 'saca': pSaque(poseVaciaEn(p), j.t / 0.45); break;
    case 'festeja': pFestejo(poseVaciaEn(p), j.t, j.fest || 'brazos'); if ((j.fest || 'brazos') === 'brazos') m.y = Math.abs(Math.sin(j.t * 7)) * 0.22; break;
    case 'triste': pGesto(poseVaciaEn(p), 'triste', j.t); break;
    default:
      if (j.i === 0 && sp < 1.5 && !B.enManos) { pArquero(poseVaciaEn(p), j.t); if (sp > 0.2) { pCorrer(_Q2, j.fase, 0); mezclarPose(p, _Q2, clamp(sp / 1.5, 0, 0.6), p); } }
      else {
        pQuieto(poseVaciaEn(_Q1), j.t, 1); pCorrer(poseVaciaEn(_Q2), j.fase, v);
        mezclarPose(_Q1, _Q2, clamp(sp / 1.6, 0, 1), p);
        if (j.est === 'carga') { p.tp += 0.15; p.bIr = 0.6; p.bDr = 0.6; }
      }
  }
  // gestos de la cara
  j.tCara -= dt;
  if (j.tCara <= 0) { j.cara = 0; }
  let c = j.cara || 0;
  if (j.est === 'festeja') c = 6; else if (j.est === 'triste') c = 4; else if (j.est === 'caido') c = 7; else if (j.est === 'barre' || j.est === 'carga' || (j.est === 'patea' && j.accion && j.accion.tipo !== 'pase')) c = 5; else if (j.est === 'estira') c = 3; else if (B.dueno === j && sp > 4) c = 5;
  m.parpadeo -= dt; if (m.parpadeo < 0) { if (m.parpadeo < -0.12) m.parpadeo = rnd(2, 5); else if (c === 0) c = 9; }
  m.cara = c;
  posarMuneco(m);
}
const _Q1 = poseVacia(), _Q2 = poseVacia();
function poseVaciaEn(p) { for (const k of CAMPOS_POSE) p[k] = 0; return p; }
