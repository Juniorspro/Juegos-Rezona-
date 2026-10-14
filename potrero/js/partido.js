// POTRERO — el partido de punta a punta: presentación, saque, reloj, gol (cámara lenta, festejo y repetición),
// entretiempo, final, penales; la cámara que sigue la jugada y todo lo que se dibuja encima (marcador, aguante,
// el que manejás, onomatopeyas, el especial).
const CAMP = { x: 0, y: 14, z: 20, tx: 0, ty: 0, tz: 0, ok: false };
function empezarPartido(cfg) {
  // el picado de fondo del menú lo juega la IA sola; un partido de verdad lo manejás vos
  if (!cfg.demo) { BOT_TODO = BOT; DEMO = null; }
  nuevoPartido(cfg);
  Sonido.musica(P.C.gente > 0.5 ? 2 : -1); Sonido.hinchadaVol = P.C.gente;
  CAMP.ok = false;
  P.fase = PRUEBA && PARAM.has('sinpres') ? 'juego' : 'presentacion'; P.tFase = 0;
  if (P.fase === 'juego') { Sonido.silbato(1); }
}
// ---------- el paso fijo ----------
function pasoPartido(dt, inp) {
  if (!P) return;
  P.tFase += dt;
  if (P.tLento > 0) { P.tLento -= dt; return; }
  for (const r of R.red) if (!r.alambre) r.golpe[3] = Math.max(0, r.golpe[3] - dt * 1.6);
  P.sacudir = Math.max(0, P.sacudir - dt * 1.4);
  for (const t of P.textos) t.t += dt;
  P.textos = P.textos.filter(t => t.t < t.dur);
  switch (P.fase) {
    case 'presentacion':
      for (const j of P.jug) animarJugador(j, dt);
      if (P.tFase > 3.2) { P.fase = 'juego'; P.tFase = 0; Sonido.silbato(1); }
      matrizPelota(B.x, B.y, B.z, B.rot);
      break;
    case 'juego': pasoJuegoPartido(dt, inp); break;
    case 'gol': {
      for (const j of P.jug) { if (j.est === 'festeja' && P.tFase < 2.2) { const a = Math.atan2(j.x, (arcoZ(j.eq) * 0.2) - j.z) + Math.sin(P.tFase * 2 + j.i) * 0.6; j.dx = Math.sin(a) * 0.7; j.dz = Math.cos(a) * 0.7; } else { j.dx = 0; j.dz = 0; } pasoJugador(j, dt); animarJugador(j, dt); }
      separarJugadores(); pasoPelota(dt); matrizPelota(B.x, B.y, B.z, B.rot);
      if (P.tFase > 0.7) P.lento = 1;
      grabarCuadro();
      if (P.tFase > 3.0) { if (P.rep.n > 120 && !PARAM.has('sinrep')) { P.fase = 'repeticion'; P.tFase = 0; P.rep.ver = { k: Math.max(0, P.rep.n - 75 - 180), fin: P.rep.n - 1 }; P.rep.ver.k0 = P.rep.ver.k; Sonido.pagina(); } else reanudar(); }
      break;
    }
    case 'repeticion': {
      const v = P.rep.ver;
      v.k += dt * 60 * (P.tFase < 2.2 ? 0.55 : 0.8);
      if (v.k >= v.fin || P.saltarRep) { P.saltarRep = false; reanudar(); break; }
      leerCuadro(Math.floor(v.k));
      break;
    }
    case 'entretiempo':
      for (const j of P.jug) animarJugador(j, dt);
      if (P.tFase > 2.6) { P.mitad = 2; P.reloj = P.cfg.dur / 2; P.golMarcado = false; ponerSaque(1 - (P.cfg.sacaPrimero || 0)); P.fase = 'juego'; P.tFase = 0; Sonido.silbato(1); }
      break;
    case 'final':
      for (const j of P.jug) { j.dx = 0; j.dz = 0; pasoJugador(j, dt); animarJugador(j, dt); }
      matrizPelota(B.x, B.y, B.z, B.rot);
      if (P.tFase > 3.4) terminarPartido();
      break;
    case 'penales': pasoPenales(dt, inp); break;
  }
}
function pasoJuegoPartido(dt, inp) {
  if (P.especial) { pasoEspecial(dt); for (const j of P.jug) animarJugador(j, dt); matrizPelota(B.x, B.y, B.z, B.rot); return; }
  if (P.esperaSaque > 0) { P.esperaSaque -= dt; if (P.esperaSaque <= 0 && B.dueno && !(B.dueno.humano && !BOT_TODO)) P.esperaSaque = 0; }
  if (P.humano && !BOT_TODO) controlHumano(P.humano, inp, dt);
  if (P.esperaSaque > 0) for (const j of P.jug) { if (!(j.humano && !BOT_TODO)) { j.dx = 0; j.dz = 0; } }
  else pasoIA(dt);
  for (const j of P.jug) pasoJugador(j, dt);
  separarJugadores();
  pasoPelota(dt);
  chequearPosesion();
  if (P.especialPelota) { P.especialPelota.t += dt; if (P.especialPelota.t > 1.4 || !pelotaLibre()) P.especialPelota = null; else if (vis() < 0.9) particula(B.x, B.y, B.z, rnd(-0.5, 0.5), rnd(-0.2, 0.6), rnd(-0.5, 0.5), 0.45, 0.3, P.especialPelota.eq === 0 ? AMARILLO : ROJO, 0, 0, 3); }
  for (const j of P.jug) animarJugador(j, dt);
  matrizPelota(B.x, B.y, B.z, B.rot);
  // posesión, reloj y aguante que sube despacio con la pelota
  const due = B.dueno || B.enManos;
  if (due) { P.stats.pos[due.eq] += dt; P.aguante[due.eq] = Math.min(100, P.aguante[due.eq] + dt * (due.eq === 1 && !P.cfg.especialRival ? 0 : 0.7)); }
  if (P.cfg.especialRival && P.aguante[1] >= 100 && B.dueno && B.dueno.eq === 1 && B.dueno.est === 'normal' && wDe(1, B.z) > 0.55 && Math.abs(B.z - arcoZ(0)) < 15) empezarEspecial(B.dueno);
  if (!P.golMarcado) P.reloj -= dt;
  P.tiempoTotal += dt;
  if (P.reloj <= 0 && !P.golMarcado) finDeTiempo();
  // la tribuna sigue la jugada
  const cerca = clamp(1 - Math.min(Math.abs(B.z - arcoZ(0)), Math.abs(B.z - arcoZ(1))) / 14, 0, 1);
  P.fervor = lerp(P.fervor || 0, cerca, dt * 2);
  pasoEventosCancha(dt);
  grabarCuadro();
}
function finDeTiempo() {
  if (P.mitad === 1) { P.fase = 'entretiempo'; P.tFase = 0; Sonido.silbato(2); for (const j of P.jug) { j.dx = 0; j.dz = 0; j.vx = 0; j.vz = 0; if (j.est !== 'normal') j.est = 'normal'; } }
  else {
    P.fase = 'final'; P.tFase = 0; Sonido.silbato(3);
    const g = P.goles, gana = g[0] > g[1] ? 0 : g[1] > g[0] ? 1 : -1;
    for (const j of P.jug) { if (j.i === 0) continue; if (gana === j.eq) { j.est = 'festeja'; j.t = 0; j.fest = 'brazos'; } else if (gana >= 0) { j.est = 'triste'; j.t = 0; } }
    if (gana === 0) Sonido.aplausos(2.5, 0.08);
  }
}
function reanudar() {
  P.golMarcado = false;
  for (const r of R.red) if (!r.alambre) r.golpe[3] = 0;
  const eq = P.ultimoGol ? 1 - P.ultimoGol.eq : 0;
  ponerSaque(eq); P.fase = 'juego'; P.tFase = 0; Sonido.silbato(1);
}
function terminarPartido() {
  const g = P.goles;
  if (g[0] === g[1] && P.cfg.penales && !P.penales) { empezarPenales(); return; }
  let gana = g[0] > g[1] ? 0 : g[1] > g[0] ? 1 : -1;
  if (P.penales) gana = P.penales.goles[0] > P.penales.goles[1] ? 0 : 1;
  P.fase = 'terminado';
  const res = { gana, goles: g.slice(), penales: P.penales ? P.penales.goles.slice() : null, stats: P.stats, cfg: P.cfg };
  if (P.cfg.alTerminar) P.cfg.alTerminar(res);
}
// el tren de la vía, el perro del potrero, el viento del campo
function pasoEventosCancha(dt) {
  const T2 = P.tren;
  if (T2) {
    T2.t -= dt;
    if (T2.t <= 0 && T2.v === 0) { T2.v = 22; T2.z = -110; Sonido.tren(1); texto('t_tren', P.A / 2, 3, -6, 1.2, AMARILLO, 2.2); }
    if (T2.v) { T2.z += T2.v * dt; if (T2.z > 120) { T2.v = 0; T2.t = 24 + az() * 14; } if (vis() < 0.4) particula(P.E.extras.tren.x + rnd(-0.4, 0.4), 4.2, T2.z + 9, rnd(-0.3, 0.3), rnd(0.8, 1.4), rnd(-0.3, 0.3), 2.2, rnd(0.6, 1), '#e8e4dc', 0, -0.4, 0.4); }
  }
  if (P.E.extras.perro && vis() < dt * 0.05) Sonido.perro();
}
// ---------- penales ----------
function empezarPenales(soloModo) {
  P.penales = { ronda: 0, turno: 0, goles: [0, 0], marcas: [[], []], fase: 'listo', t: 0, apunta: [0, 1], modo: soloModo || null, racha: 0 };
  P.fase = 'penales'; P.tFase = 0;
  Sonido.musica(3);
  prepararPenal();
}
function prepararPenal() {
  const Q = P.penales, tira = Q.turno, ataja = 1 - tira, gz = arcoZ(ataja), s = -Math.sign(gz);
  for (const j of P.jug) { j.est = 'normal'; j.vx = j.vz = 0; j.dx = j.dz = 0; j.accion = null; j.x = (j.i - 2) * 1.3 + (j.eq ? 6 : -6); j.z = 0; j.yaw = j.eq === 0 ? PI : 0; }
  const pat = equipoDe(tira)[[4, 2, 3, 1, 4][Q.ronda % 5]], arq = arqueroDe(ataja);
  arq.x = 0; arq.z = gz - s * 0.3; arq.yaw = gz > 0 ? PI : 0;
  pat.x = 0.4; pat.z = gz + s * 8.2; pat.yaw = Math.atan2(0, gz - pat.z);
  B.dueno = null; B.enManos = null; B.x = 0; B.z = gz + s * 6.5; B.y = FUT.R; B.vx = B.vy = B.vz = 0; B.enArco = 0; B.wx = B.wy = B.wz = 0;
  Q.pat = pat; Q.arq = arq; Q.fase = 'apuntar'; Q.t = 0; Q.apunta = [0, 0.8]; Q.carga = 0; Q.res = null; Q.lado = 0;
  P.golMarcado = false;
  for (const r of R.red) if (!r.alambre) r.golpe[3] = 0;
}
function pasoPenales(dt, inp) {
  const Q = P.penales, tira = Q.turno, humanoTira = tira === 0 && !BOT_TODO, humanoAtaja = tira === 1 && !BOT_TODO;
  Q.t += dt;
  const gz = arcoZ(1 - tira), s = -Math.sign(gz);
  if (Q.fase === 'apuntar') {
    if (humanoTira) {
      // la mira se mueve con el palito; B cargado y suelto patea
      Q.apunta[0] = clamp(Q.apunta[0] + inp.dx * dt * 2.2, -1, 1); Q.apunta[1] = clamp(Q.apunta[1] - inp.dz * s * dt * 1.6 * 0, 0, 1.6);
      if (Math.abs(inp.dz) > 0.2) Q.apunta[1] = clamp(Q.apunta[1] + (s > 0 ? inp.dz : -inp.dz) * dt * 1.8, 0.15, 1.7);
      if (inp.B.abajo) Q.carga = Math.min(1, Q.carga + dt / 0.9);
      if ((inp.B.suelta && Q.carga > 0.05) || Q.t > 9) { Q.fase = 'corre'; Q.t = 0; Q.pot = Math.max(0.35, Q.carga); }
    } else if (Q.t > 1.2) {
      Q.apunta = [(az() < 0.5 ? -1 : 1) * (0.35 + az() * 0.65), 0.2 + az() * 1.3]; Q.pot = 0.55 + az() * 0.4; Q.fase = 'corre'; Q.t = 0;
    }
    if (humanoAtaja) { if (inp.A.ap || inp.B.ap || inp.C_toque) Q.lado = Math.abs(inp.dx) > 0.25 ? Math.sign(inp.dx) : 0; if (Math.abs(inp.dx) > 0.25) Q.ladoPend = Math.sign(inp.dx); }
  } else if (Q.fase === 'corre') {
    const pat = Q.pat; pat.dx = (B.x - 0.25 - pat.x); pat.dz = (B.z - s * 0.5 - pat.z); const l = Math.hypot(pat.dx, pat.dz); if (l > 0.3) { pat.dx /= l; pat.dz /= l; } else { pat.dx = 0; pat.dz = 0; }
    pasoJugador(pat, dt);
    if (humanoAtaja && (inp.A.ap || inp.B.ap || inp.C_toque || Math.abs(inp.dx) > 0.25)) Q.lado = Math.abs(inp.dx) > 0.25 ? Math.sign(inp.dx) : Q.lado;
    if (l <= 0.35 || Q.t > 2.5) {
      // patada
      B.dueno = pat;
      const tx = Q.apunta[0] * (ARCO.ancho / 2 - 0.25), ty = Q.apunta[1], dx = tx - B.x, dz = gz - B.z, D = Math.hypot(dx, dz);
      const v = lerp(15, 26, Q.pot) * (0.85 + pat.st.tiro * 0.2), T = D / v;
      const err = (1 - pat.st.tiro) * 0.06 * (az() - 0.5) + (Q.pot > 0.93 ? (Q.pot - 0.93) * 2.5 * az() : 0);
      const yaw = Math.atan2(dx, dz) + err, vy = (ty - FUT.R + 0.5 * FUT.G * T * T) / T + (Q.pot > 0.95 ? 2.5 : 0);
      empezarPatada(pat, { tipo: 'tiro', vx: Math.sin(yaw) * v, vy, vz: Math.cos(yaw) * v, yaw: Math.atan2(dx, dz), fuerza: Q.pot });
      Q.fase = 'vuela'; Q.t = 0;
      // el arquero se tira
      const arq = Q.arq;
      let lado;
      if (humanoAtaja) lado = Q.lado || Q.ladoPend || (az() < 0.5 ? -1 : 1);
      else { const lee = az() < 0.25 + arq.st.arq * 0.35; lado = lee ? Math.sign(tx) || 1 : (az() < 0.5 ? -1 : 1); if (az() < 0.12) lado = 0; }
      Q.ladoArq = lado;
    }
  } else if (Q.fase === 'vuela') {
    const pat = Q.pat, arq = Q.arq;
    pasoJugador(pat, dt);
    if (pat.est !== 'patea' && Q.t > 0.05 && arq.est === 'normal' && !Q.seTiro) {
      Q.seTiro = true;
      if (Q.ladoArq) { arq.est = 'estira'; arq.t = 0; arq.dur = 0.85; arq.lado = Q.ladoArq * (gz > 0 ? 1 : 1); arq.altoEst = clamp(Q.apunta[1] / 1.8, 0, 1); arq.velEst = Q.ladoArq * (1.9 + arq.st.arq * 0.9) / 0.42; }
    }
    pasoJugador(arq, dt);
    if (arq.est === 'estira') chequearAtajada(arq, true); else chequearAtajada(arq, false);
    pasoPelota(dt);
    if (B.enManos) { B.vx = B.vy = B.vz = 0; }
    const gol = Math.abs(B.z) > P.L / 2 + FUT.R && Math.abs(B.x) < ARCO.ancho / 2 && B.y < ARCO.alto;
    if (gol && !Q.res) { Q.res = 'gol'; Sonido.red(); if (tira === 0) Sonido.gol(P.C.gente); else Sonido.golRival(); texto('t_gol', 0, 2.6, gz, 1.4, AMARILLO, 1.4); }
    if (!Q.res && (Q.t > 2.2 || (B.enManos) || (Math.abs(B.z - gz) < 1 && Math.abs(B.vz) < 1.5 && Q.t > 0.8) || (Math.hypot(B.vx, B.vz) < 0.3 && Q.t > 0.8))) { Q.res = Math.abs(B.x) > ARCO.ancho / 2 + 0.05 || B.y > ARCO.alto ? 'afuera' : 'atajo'; if (Q.res === 'atajo') texto('t_atajo', arq.x, 2.2, arq.z, 1.2, CELESTE, 1.3); else { texto('t_afuera', B.x, 1.6, gz, 1.1, BLANCO, 1.3); Sonido.uuh(); } }
    if (Q.res && Q.tRes == null) Q.tRes = 0;
    if (Q.tRes != null) {
      Q.tRes += dt;
      if (Q.tRes > 1.6) {
        Q.marcas[tira].push(Q.res === 'gol' ? 1 : 0); if (Q.res === 'gol') Q.goles[tira]++;
        Q.tRes = null; Q.seTiro = false;
        if (Q.modo) { // modo penales: racha
          if (tira === 0 && Q.res === 'gol') Q.racha++;
          if (tira === 1 && Q.res !== 'gol') Q.racha++;
          if ((tira === 0 && Q.res !== 'gol') || (tira === 1 && Q.res === 'gol')) { Q.vidas = (Q.vidas == null ? 3 : Q.vidas) - 1; }
          if (Q.vidas === 0) { P.fase = 'terminado'; if (P.cfg.alTerminar) P.cfg.alTerminar({ penalesRacha: Q.racha, stats: P.stats, cfg: P.cfg }); return; }
        } else if (decididoPenales(Q)) { terminarPartido(); return; }
        if (tira === 1) Q.ronda++;
        Q.turno = 1 - Q.turno;
        prepararPenal();
        return;
      }
    }
  }
  for (const j of P.jug) animarJugador(j, dt);
  matrizPelota(B.x, B.y, B.z, B.rot);
}
function decididoPenales(Q) {
  const r = Q.marcas, n0 = r[0].length, n1 = r[1].length, g0 = Q.goles[0], g1 = Q.goles[1];
  if (n0 <= 5 && n1 <= 5 && Math.max(n0, n1) <= 5) {
    const q0 = 5 - n0, q1 = 5 - n1;
    if (g0 + q0 < g1 || g1 + q1 < g0) return true;
    return false;
  }
  return n0 === n1 && g0 !== g1;
}
// ---------- la cámara ----------
function camaraPartido(dt) {
  const c = R.cam, ap = W > H, L = P.L, A = P.A;
  let ex, ey, ez, tx, ty, tz, k = Math.min(1, dt * 3.2);
  let bx = B.x, by = B.y, bz = B.z;
  if (P.fase === 'repeticion') { bx = B.m.x; by = B.m.y; bz = B.m.z; }
  if (P.fase === 'presentacion') {
    const a = -0.6 + P.tFase * 0.32, r = 24;
    ex = Math.sin(a) * r; ey = 11 - P.tFase * 1.2; ez = Math.cos(a) * r + 6; tx = 0; ty = 0; tz = 0; k = P.tFase < 0.1 ? 1 : Math.min(1, dt * 2.5);
  } else if (P.especial) {
    const j = P.especial.j, f = P.especial.t / P.especial.dur, fx = Math.sin(j.yaw), fz = Math.cos(j.yaw), a = j.yaw + 0.9 - f * 0.8;
    ex = j.x + Math.sin(a) * (3.2 - f * 0.9); ey = 0.9 + f * 0.5; ez = j.z + Math.cos(a) * (3.2 - f * 0.9); tx = j.x + fx * 0.3; ty = 0.9; tz = j.z + fz * 0.3; k = Math.min(1, dt * 7);
  } else if (P.fase === 'repeticion') {
    const g = P.ultimoGol, gz = arcoZ(1 - (g ? g.eq : 0)), s = Math.sign(gz), v = P.rep.ver, prog = (v.k - v.k0) / Math.max(1, v.fin - v.k0);
    if (prog < 0.62) { ex = bx * 0.75 + (bx > 0 ? -2.6 : 2.6); ey = 3.6; ez = bz - s * 8; tx = bx * 0.7; ty = 0.6; tz = bz + s * 3.5; }
    else { const lado = bx > 0 ? -1 : 1; ex = lado * 3.4; ey = 1.5; ez = gz - s * 2.6; tx = bx * 0.6; ty = Math.max(0.6, by * 0.7); tz = gz - s * 0.2; }
    k = Math.min(1, dt * (prog < 0.05 ? 60 : 4.5));
  } else if (P.fase === 'gol' && P.tFase > 0.7) {
    const g = P.ultimoGol, a = g && g.autor ? g.autor : null;
    if (a) { ex = a.x + 2.6; ey = 1.6; ez = a.z + (a.eq === 0 ? -1 : 1) * -3.4; tx = a.x; ty = 1.0; tz = a.z; k = Math.min(1, dt * 2); }
  } else if (P.fase === 'penales') {
    const Q = P.penales, gz = arcoZ(1 - Q.turno), s = Math.sign(gz);
    if (Q.turno === 0 || BOT_TODO) { ex = 0.6; ey = 2.3; ez = gz - s * 12.5; tx = 0; ty = 0.9; tz = gz; }
    else { ex = -1.2; ey = 2.2; ez = gz + s * 2.6; tx = 0; ty = 0.6; tz = gz - s * 7; }
    if (ap) { ey += 0.4; }
    k = Math.min(1, dt * 3);
  } else if (P.fase === 'entretiempo' || P.fase === 'final') {
    ex = 0; ey = 22; ez = L * 0.62; tx = 0; ty = 0; tz = 0; k = Math.min(1, dt * 1.2);
  }
  if (ex == null) {
    // de juego: parado detrás del ataque nuestro; acostado, de costado como en la tele
    const vx = B.vx, vz = B.vz, ad = 0.35;
    const fx = clamp(bx + vx * ad, -A / 2, A / 2), fz = clamp(bz + vz * ad, -L / 2 - 2, L / 2 + 2);
    CAMP.fx = CAMP.ok ? lerp(CAMP.fx, fx, Math.min(1, dt * 2.6)) : fx; CAMP.fz = CAMP.ok ? lerp(CAMP.fz, fz, Math.min(1, dt * 2.6)) : fz; CAMP.ok = true;
    if (!ap) {
      const sx = clamp(CAMP.fx * 0.7, -A / 2 + 4, A / 2 - 4);
      tx = sx; ty = 0.4; tz = CAMP.fz - 2.6; ex = sx * 0.92; ey = 9.2; ez = CAMP.fz + 10.2;
    } else {
      const sz = clamp(CAMP.fz, -L / 2 + 6, L / 2 - 6);
      tx = clamp(CAMP.fx * 0.5, -A / 2 + 3, A / 2 - 3) - 1.0; ty = 0.3; tz = sz; ex = tx + 13; ey = 9.2; ez = sz;
    }
    k = Math.min(1, dt * 4);
  }
  if (!c.ok || P.fase === 'presentacion' && P.tFase < 0.05) { c.x = ex; c.y = ey; c.z = ez; c.tx = tx; c.ty = ty; c.tz = tz; c.ok = true; }
  c.x = lerp(c.x, ex, k); c.y = lerp(c.y, ey, k); c.z = lerp(c.z, ez, k); c.tx = lerp(c.tx, tx, k); c.ty = lerp(c.ty, ty, k); c.tz = lerp(c.tz, tz, k);
  const sh = P.sacudir * 0.35;
  R.cam.fovY = ap ? 0.78 : 1.02; R.cam.cerca = 0.3; R.cam.lejos = 170;
  R.cam.sx = sh ? rnd(-sh, sh) : 0; R.cam.sy = sh ? rnd(-sh, sh) : 0;
  c.x += R.cam.sx; c.y += R.cam.sy;
}
function munecosPartido() {
  const L = [];
  for (const j of P.jug) L.push(j.m);
  L.push(B.m);
  if (P.tren && P.tren.v) { const m = trenMuneco(); m.x = P.E.extras.tren.x; m.z = P.tren.z; m.y = P.E.extras.tren.y; M4.ident(_trM); M4.mover(_trM, m.x, m.y, m.z); m.huesos.set(_trM, 0); L.push(m); }
  return L;
}
const _trM = M4.nueva();
let _tren = null;
function trenMuneco() {
  if (_tren) return _tren;
  const G = nuevaGeo(true);
  for (let k = 0; k < 4; k++) {
    const z0 = -k * 14.5, col = k === 0 ? '#ec4a33' : '#ffd23f';
    const caja = (x0, y0, a0, x1, y1, a1, c, fl) => { const C3 = cc(c); for (const [a, b, c2, d] of [[[x0, y0, a1], [x1, y0, a1], [x1, y1, a1], [x0, y1, a1]], [[x1, y0, a0], [x0, y0, a0], [x0, y1, a0], [x1, y1, a0]], [[x1, y0, a1], [x1, y0, a0], [x1, y1, a0], [x1, y1, a1]], [[x0, y0, a0], [x0, y0, a1], [x0, y1, a1], [x0, y1, a0]], [[x0, y1, a1], [x1, y1, a1], [x1, y1, a0], [x0, y1, a0]]]) geoQuad(G, a, b, c2, d, C3, fl || 0, null, 0); };
    caja(-1.5, 0.4, z0 - 13.5, 1.5, 3.6, z0, col);
    caja(-1.52, 2.0, z0 - 12.5, 1.52, 2.9, z0 - 1, '#24306a', 7);
    caja(-1.55, 0.9, z0 - 13.5, 1.55, 1.15, z0, '#16131f');
  }
  _tren = { fig: { malla: geoEmpacar(G), datos: {} }, x: 0, y: 0, z: 0, yaw: 0, huesos: new Float32Array(13 * 16), cara: 0, estiloCara: 0, kit: null, id: 15, sinSombra: true };
  for (let i = 0; i < 13; i++) _tren.huesos.set(M4.ident(M4.nueva()), i * 16);
  return _tren;
}
// ---------- lo que se dibuja encima ----------
function proyectarU(x, y, z) { const p = M4.proyectar(R.VP, x, y, z); return p ? [p[0] * W, p[1] * H, p[2]] : null; }
function escudo(g, x, y, r, eqId) {
  const E = EQUIPOS[eqId];
  g.save(); g.translate(x, y);
  g.beginPath(); g.moveTo(-r, -r * 0.9); g.lineTo(r, -r * 0.9); g.lineTo(r, r * 0.2); g.quadraticCurveTo(r * 0.9, r * 0.9, 0, r * 1.15); g.quadraticCurveTo(-r * 0.9, r * 0.9, -r, r * 0.2); g.closePath();
  g.fillStyle = E.kit.camiseta; g.fill();
  g.save(); g.clip(); g.fillStyle = E.kit.c2 || '#ffffff'; if (E.kit.patron === 1) for (let i = -2; i <= 2; i += 2) g.fillRect(i * r * 0.32 - r * 0.16, -r, r * 0.32, r * 2.2); else if (E.kit.patron === 2) g.fillRect(-r, -r * 0.15, r * 2, r * 0.32); else if (E.kit.patron === 3) { g.beginPath(); g.moveTo(-r, r * 0.4); g.lineTo(r, -r * 0.8); g.lineTo(r, -r * 0.4); g.lineTo(-r, r * 0.8); g.fill(); } g.restore();
  g.lineWidth = 2.2; g.strokeStyle = TINTA; g.stroke();
  txt(g, E.corto, 0, r * 0.05, { tam: r * 0.62, c: BLANCO, b: TINTA, bw: 1.6, al: 0.5, temblor: false });
  g.restore();
}
function hudPartido(g) {
  if (!P) return;
  const ap = W > H;
  // marcador
  if (P.fase !== 'presentacion' && P.fase !== 'penales') {
    const w = 176, h = 44, x = W / 2 - w / 2, y = 8;
    const s = sello('marc' + w, w + 10, h + 10, b => { cuadroComic(b, 1.5, 1.5, w, h, PAPEL, { r: 6, sombra: 3.5, liso: true }); });
    estampar(g, s, x - 1.5, y - 1.5);
    escudo(g, x + 24, y + h / 2 - 2, 15, P.eqs[0]); escudo(g, x + w - 24, y + h / 2 - 2, 15, P.eqs[1]);
    txt(g, P.goles[0] + ' - ' + P.goles[1], W / 2, y + h / 2 - 1, { tam: 24, c: TINTA, b: null, al: 0.5, temblor: false });
    const rel = (P.mitad === 1 ? tr('t1') : tr('t2')) + ' ' + fmtReloj(Math.max(0, P.reloj));
    cartucho(g, W / 2, y + h - 2, rel, { tam: 10, al: 0.5, c: P.reloj < 15 && P.mitad === 2 ? ROJO : AMARILLO, tc: TINTA, rot: 0.02 });
  }
  // aguante
  if (P.fase === 'juego' || P.fase === 'gol') {
    const w = ap ? 150 : 128, h = 14, x = ap ? 14 : 12, y = ap ? 14 : 62, k = P.aguante[0] / 100, lleno = k >= 1;
    g.save();
    caminoRedondo(g, x + 3, y + 3, w, h, 7); g.fillStyle = trama(g, TINTA, 3, 1.2); g.fill();
    caminoRedondo(g, x, y, w, h, 7); g.fillStyle = PAPEL2; g.fill();
    g.save(); g.clip(); g.fillStyle = lleno ? (Math.sin(T * 12) > 0 ? AMARILLO : NARANJA) : AMARILLO; g.fillRect(x, y, w * k, h); g.fillStyle = trama(g, mezcla(AMARILLO, ROJO, 0.4), 3, 1); g.fillRect(x, y + h * 0.55, w * k, h); g.restore();
    caminoRedondo(g, x, y, w, h, 7); g.lineWidth = 2.2; g.strokeStyle = TINTA; g.stroke();
    icono(g, 'estrella', x + w + 12, y + h / 2, 15, lleno ? ROJO : TINTA);
    txt(g, tr('aguante'), x + 8, y + h / 2, { tam: 8.5, c: TINTA, b: null, al: 0, peso: 1 });
    if (P.cfg.especialRival) { const k2 = P.aguante[1] / 100; g.fillStyle = TINTA; g.fillRect(x, y + h + 5, w * 0.6, 4); g.fillStyle = ROJO; g.fillRect(x, y + h + 5, w * 0.6 * k2, 4); }
    g.restore();
  }
  // el que manejás: aro y nombre; el que va a recibir
  if ((P.fase === 'juego') && P.humano && !P.especial) {
    const j = P.humano, p = proyectarU(j.x, 0.02, j.z), q = proyectarU(j.x, 2.0 * (j.m.escala || 1), j.z);
    if (p && q) {
      const rr = Math.max(9, (p[1] - q[1]) * 0.28);
      g.save(); g.beginPath(); g.ellipse(p[0], p[1], rr * 1.25, rr * 0.5, 0, 0, TAU); g.lineWidth = 3.4; g.strokeStyle = TINTA; g.stroke(); g.lineWidth = 2; g.strokeStyle = AMARILLO; g.stroke(); g.restore();
      const y = q[1] - 6 + Math.sin(T * 6) * 1.5;
      g.beginPath(); g.moveTo(q[0] - 6, y - 8); g.lineTo(q[0] + 6, y - 8); g.lineTo(q[0], y); g.closePath(); g.fillStyle = AMARILLO; g.fill(); g.lineWidth = 2; g.strokeStyle = TINTA; g.stroke();
      txt(g, j.nom, q[0], y - 16, { tam: 9, c: BLANCO, b: TINTA, al: 0.5 });
      if (P.carga > 0) { const w = 40; g.fillStyle = TINTA; g.fillRect(q[0] - w / 2 - 2, y - 30, w + 4, 8); g.fillStyle = P.carga > 0.92 ? ROJO : AMARILLO; g.fillRect(q[0] - w / 2, y - 28, w * P.carga, 4); }
    }
    if (B.dueno === j && TACTIL && CTL.bot.A) { const m = mejorPase(j, ENTRADA.dx, ENTRADA.dz, false); if (m) { const r = proyectarU(m.t.x, 1.9, m.t.z); if (r) { g.beginPath(); g.arc(r[0], r[1] - 4, 6, 0, TAU); g.fillStyle = VERDE; g.fill(); g.lineWidth = 2; g.strokeStyle = TINTA; g.stroke(); } } }
  }
  // onomatopeyas
  for (const t of P.textos) {
    const p = proyectarU(t.x, t.y, t.z); if (!p) continue;
    const k = t.t / t.dur, esc = (k < 0.18 ? rebote(k / 0.18) : 1) * (1 - Math.max(0, k - 0.8) * 2.5);
    g.save(); g.translate(p[0], p[1] - k * 14); g.rotate(t.rot); g.scale(esc, esc);
    txt(g, tr(t.k), 0, 0, { tam: 19 * t.tam, c: t.col, b: TINTA, bw: 3, al: 0.5 });
    g.restore();
  }
  // carteles grandes de cada momento
  if (P.fase === 'presentacion') {
    const k = clamp(P.tFase / 0.4, 0, 1);
    g.save(); g.translate(W / 2, H * 0.3); g.scale(rebote(k), rebote(k));
    escudo(g, -70, 0, 34, P.eqs[0]); escudo(g, 70, 0, 34, P.eqs[1]);
    txt(g, 'VS', 0, 0, { tam: 34, c: AMARILLO, b: TINTA, bw: 4, al: 0.5 });
    g.restore();
    cartucho(g, W / 2, H * 0.3 + 52, tr(EQUIPOS[P.eqs[0]].nom), { tam: 12, al: 0.5, max: W - 40 });
    cartucho(g, W / 2, H * 0.3 + 78, tr(EQUIPOS[P.eqs[1]].nom), { tam: 12, al: 0.5, c: PAPEL, max: W - 40, rot: 0.03 });
    if (P.cfg.titulo) cartucho(g, W / 2, H * 0.3 - 74, tr(P.cfg.titulo), { tam: 11, al: 0.5, c: ROJO, tc: BLANCO, max: W - 40 });
    if (P.tFase > 2.4) bannerGrande(g, tr('aJugar'), P.tFase - 2.4, VERDE);
  }
  if (P.fase === 'juego' && P.tFase < 1.1 && P.esperaSaque >= 0) bannerGrande(g, tr('aJugar'), P.tFase + 0.6, VERDE);
  if (P.fase === 'gol') {
    const eq = P.ultimoGol.eq, k = P.tFase;
    bannerGol(g, k, eq === 0 ? AMARILLO : '#c8c0d0');
    const a = P.ultimoGol.autor;
    if (a && k > 0.6) cartucho(g, W / 2, H * 0.5 + 44, a.nom + (P.ultimoGol.especial ? ' · ' + tr('especial') : ''), { tam: 13, al: 0.5, c: eq === 0 ? VERDE : PAPEL, tc: eq === 0 ? BLANCO : TINTA });
  }
  if (P.fase === 'repeticion') {
    g.lineWidth = 10; g.strokeStyle = TINTA; g.strokeRect(5, 5, W - 10, H - 10);
    cartucho(g, 16, 18, tr('repeticion'), { tam: 13, c: ROJO, tc: BLANCO });
    if (Math.sin(T * 5) > 0) txt(g, tr('tocaSaltar'), W / 2, H - 30, { tam: 10, c: BLANCO, b: TINTA, al: 0.5 });
    zona(0, 0, W, H, () => { P.saltarRep = true; });
  }
  if (P.fase === 'entretiempo') bannerGrande(g, tr('entretiempo'), P.tFase, CELESTE);
  if (P.fase === 'final') bannerGrande(g, tr('final'), P.tFase, ROJO);
  if (P.especial) dibujarEspecial(g);
  if (P.fase === 'penales') hudPenales(g);
}
function bannerGrande(g, s, t, col) {
  const k = clamp(t / 0.3, 0, 1), sale = clamp((t - 1.8) / 0.3, 0, 1);
  if (sale >= 1) return;
  g.save(); g.translate(W / 2, H * 0.42); g.scale(rebote(k) * (1 - sale), rebote(k) * (1 - sale)); g.rotate(-0.05);
  estallido(g, 0, 0, Math.min(W * 0.42, 170), 52, col, { puntas: 18, semilla: 3 });
  txt(g, s, 0, 0, { tam: 26, c: BLANCO, b: TINTA, bw: 3.4, al: 0.5, max: Math.min(W * 0.62, 240) });
  g.restore();
}
function bannerGol(g, t, col) {
  const s = mayus(tr('gol')), n = s.length, tam = Math.min(58, W / (n * 0.62));
  g.save(); g.translate(W / 2, H * 0.4);
  const k = clamp(t / 0.25, 0, 1);
  g.scale(rebote(k), rebote(k));
  estallido(g, 0, 0, Math.min(W * 0.46, 200), 70, col, { puntas: 22, semilla: 11 });
  let x = -medir(s, tam, 1) / 2;
  for (let i = 0; i < n; i++) {
    const ch = s[i], w = medir(ch, tam, 1), y = Math.sin(T * 10 + i * 0.7) * 5;
    txt(g, ch, x + w / 2, y, { tam, c: i % 2 ? ROJO : BLANCO, b: TINTA, bw: 4, al: 0.5 });
    x += w + tam * 0.06;
  }
  g.restore();
}
function dibujarEspecial(g) {
  const E = P.especial, k = E.t / E.dur;
  R.veloc = 1; R.centroV = [0.5, 0.5]; R.invertir = k < 0.12 ? 1 : 0;
  const ent = salida(clamp(k / 0.2, 0, 1)), y = H * 0.66;
  g.save(); g.translate((1 - ent) * -W, 0);
  g.beginPath(); g.moveTo(0, y - 46); g.lineTo(W, y - 70); g.lineTo(W, y + 30); g.lineTo(0, y + 54); g.closePath();
  g.fillStyle = E.j.eq === 0 ? AMARILLO : ROJO; g.fill(); g.lineWidth = 4; g.strokeStyle = TINTA; g.stroke();
  txt(g, mayus(tr(E.nombre)), W / 2, y - 8, { tam: 30, c: E.j.eq === 0 ? ROJO : AMARILLO, b: TINTA, bw: 4, al: 0.5, max: W - 30 });
  txt(g, E.j.nom, W / 2, y + 26, { tam: 14, c: BLANCO, b: TINTA, al: 0.5 });
  g.restore();
}
function hudPenales(g) {
  const Q = P.penales;
  // las marcas de cada uno
  const w = 220, x = W / 2 - w / 2, y = 10;
  cuadroComic(g, x, y, w, 52, PAPEL, { r: 6, sombra: 3, liso: true });
  for (let e = 0; e < 2; e++) {
    escudo(g, x + 20, y + 15 + e * 24, 9, P.eqs[e]);
    const n = Math.max(5, Q.marcas[e].length);
    for (let i = 0; i < Math.min(n, 8); i++) { const m = Q.marcas[e][i], cx = x + 42 + i * 21, cy = y + 15 + e * 24; g.beginPath(); g.arc(cx, cy, 7, 0, TAU); g.fillStyle = m === 1 ? VERDE : m === 0 ? ROJO : PAPEL2; g.fill(); g.lineWidth = 2; g.strokeStyle = TINTA; g.stroke(); }
  }
  if (Q.modo) txt(g, tr('racha') + ': ' + Q.racha + '   ' + '♥'.repeat(Math.max(0, Q.vidas == null ? 3 : Q.vidas)), W / 2, y + 66, { tam: 12, c: BLANCO, b: TINTA, al: 0.5 });
  const humanoTira = Q.turno === 0 && !BOT_TODO;
  if (Q.fase === 'apuntar' && humanoTira) {
    // la mira en el arco
    const gz = arcoZ(1), p = proyectarU(Q.apunta[0] * (ARCO.ancho / 2 - 0.25), Q.apunta[1], gz);
    if (p) { g.beginPath(); g.arc(p[0], p[1], 11, 0, TAU); g.lineWidth = 3; g.strokeStyle = TINTA; g.stroke(); g.lineWidth = 1.6; g.strokeStyle = ROJO; g.stroke(); g.beginPath(); g.moveTo(p[0] - 16, p[1]); g.lineTo(p[0] + 16, p[1]); g.moveTo(p[0], p[1] - 16); g.lineTo(p[0], p[1] + 16); g.stroke(); }
    cartucho(g, W / 2, H * 0.62, tr('penalApunta'), { tam: 11, al: 0.5, max: W - 30 });
  }
  if (Q.turno === 1 && !BOT_TODO && Q.fase !== 'vuela') cartucho(g, W / 2, H * 0.62, tr('penalAtaja'), { tam: 11, al: 0.5, max: W - 30, c: CELESTE });
}
