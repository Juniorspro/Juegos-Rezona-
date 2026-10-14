// POTRERO — la cabeza de los pibes: formación que se corre con la pelota, el que va a buscarla, el que presiona,
// el que cubre, las marcas, y el que la tiene decide entre tirar, pasar, gambetear o encarar.
const FORM_AT = { def: [0, 0.3], medI: [-0.56, 0.52], medD: [0.56, 0.52], del: [0.08, 0.8] };
const FORM_DEF = { def: [0, 0.13], medI: [-0.42, 0.3], medD: [0.42, 0.3], del: [0.05, 0.5] };
let BOT_TODO = false;   // el bot maneja también al nuestro
const wDe = (eq, z) => eq === 0 ? (L_ACT / 2 - z) / L_ACT : (z + L_ACT / 2) / L_ACT;
const zDe = (eq, w) => eq === 0 ? L_ACT / 2 - w * L_ACT : -L_ACT / 2 + w * L_ACT;
function nivelEq(eq) { return EQUIPOS[P.eqs[eq]].nivel * (eq === 1 ? (P.cfg.dificultad || 1) : 1); }
function objetivoForm(j, ataque) {
  const f = (ataque ? FORM_AT : FORM_DEF)[j.rol], bu = B.x / (P.A / 2), bw = wDe(j.eq, B.z);
  let u = f[0] + bu * 0.35, w = f[1] + (bw - 0.5) * (ataque ? 0.32 : 0.38);
  return [clamp(u, -0.86, 0.86) * (P.A / 2 - 1.4), zDe(j.eq, clamp(w, 0.05, 0.93))];
}
function irA2(j, tx, tz, apuro) {
  const ex = tx - j.x, ez = tz - j.z, l = Math.hypot(ex, ez);
  if (l < 0.25) { j.dx = 0; j.dz = 0; j.pique = false; return l; }
  const k = clamp(l / 2.2, 0.25, 1) * (apuro ? 1 : 0.85);
  j.dx = ex / l * k; j.dz = ez / l * k; j.pique = !!apuro && l > 4;
  return l;
}
function pasoIA(dt) {
  if (P.fase !== 'juego') return;
  const due = B.dueno || B.enManos, eqPos = due ? due.eq : -1;
  for (let e = 0; e < 2; e++) {
    const eq = equipoDe(e), riv = equipoDe(1 - e), niv = nivelEq(e);
    // quién va a buscarla (el que llega primero) y quién presiona
    let cazador = null, tc = 1e9, presion = null, cubre = null;
    if (eqPos !== e) {
      const orden = [];
      for (const j of eq) {
        if (j.i === 0) continue;
        let t;
        if (due) t = Math.hypot(due.x - j.x, due.z - j.z) / velMax(j);
        else { t = 9; for (let k = 0; k <= 12; k++) { const tt = k * 0.15, [px, pz] = pelotaEn(tt); if (Math.hypot(px - j.x, pz - j.z) / velMax(j) <= tt + 0.1) { t = tt; break; } } }
        orden.push([t, j]);
      }
      orden.sort((a, b) => a[0] - b[0]);
      if (orden[0]) { cazador = orden[0][1]; tc = orden[0][0]; }
      presion = cazador; cubre = orden[1] && orden[1][1];
    }
    for (const j of eq) {
      if (j.i === 0) { pasoArquero(j, dt); continue; }
      if (j.humano && !BOT_TODO) continue;
      if (j.est !== 'normal') continue;
      j.ia.t -= dt;
      if (B.dueno === j) { conPelota(j, dt, niv); continue; }
      if (eqPos === e) sinPelotaAtaque(j, due, niv);
      else if (eqPos === 1 - e) defender(j, due, j === presion, j === cubre, niv, dt);
      else pelotaSuelta(j, j === cazador, niv, dt);
    }
  }
}
// ---------- con la pelota ----------
function conPelota(j, dt, niv) {
  const da = dirAt(j.eq), gz = -arcoZ(j.eq), D = Math.hypot(j.x, gz - j.z);
  if (P.esperaSaque > 0) { j.dx = 0; j.dz = 0; return; }
  // rival más cerca
  let o = null, od = 1e9;
  for (const r of equipoDe(1 - j.eq)) { const d = Math.hypot(r.x - j.x, r.z - j.z); if (d < od) { od = d; o = r; } }
  if (j.ia.t <= 0) {
    j.ia.t = lerp(0.42, 0.16, niv) * (0.8 + az() * 0.4);
    // ¿tirar? de cerca y con el arco libre
    let tapan = 0;
    for (const r of equipoDe(1 - j.eq)) { if (r.i === 0) continue; const sx = -j.x, sz = gz - j.z, l2 = sx * sx + sz * sz, u = clamp(((r.x - j.x) * sx + (r.z - j.z) * sz) / l2, 0, 1); if (u > 0.05 && u < 0.95 && Math.hypot(j.x + sx * u - r.x, j.z + sz * u - r.z) < 1.1) tapan++; }
    let ganas = D < 6.5 ? 0.55 : D < 10 ? 0.28 : D < 14 ? 0.1 : D < 18 ? 0.02 : 0;
    ganas *= Math.max(0, 1 - tapan * 0.35); if (od < 1.3 && D < 12) ganas += 0.1;
    if (Math.abs(j.x) > P.A / 2 - 3 && D < 9) ganas *= 0.5;
    if (az() < ganas) { tirar(j, null, clamp(0.42 + D * 0.028 + az() * 0.18, 0.38, 0.9), false); return; }
    // ¿pasar? la pelota tiene que correr
    const m = mejorPase(j, 0, 0, false);
    if (m) {
      const apurado = od < 1.7, avanza = (m.pz - j.z) * da;
      let pp = apurado ? (m.abierto > 0.8 ? 0.7 : 0.3) : m.abierto > 1.4 ? (avanza > 1 ? 0.38 : 0.16) : 0.05;
      if (m.t.rol === 'del' && avanza > 2 && m.abierto > 1.6) pp += 0.2;
      if (az() < pp) { pasar(j, (m.px - j.x) / m.d, (m.pz - j.z) / m.d, false); return; }
    }
    // ¿centro desde la punta?
    if (Math.abs(j.x) > P.A / 2 - 4 && D < 14 && az() < 0.25) { const ml = mejorPase(j, -Math.sign(j.x), da * 0.3, true); if (ml && ml.abierto > 1.2) { pasar(j, (ml.px - j.x) / ml.d, (ml.pz - j.z) / ml.d, true); return; } }
    // ¿gambeta? cuando te vienen a sacar
    if (o && od < 1.6 && j.cdGam <= 0 && az() < 0.25 + j.st.gam * 0.5) { if (gambeta(j, 0, 0)) return; }
  }
  // encarar: al arco, esquivando
  let tx = clamp(-j.x * 0.4, -2, 2), tz = gz;
  let ax = tx - j.x, azz = tz - j.z; const l = Math.hypot(ax, azz) || 1; ax /= l; azz /= l;
  let sx = 0, sz = 0;
  for (const r of equipoDe(1 - j.eq)) {
    const ex = r.x - j.x, ez = r.z - j.z, d = Math.hypot(ex, ez);
    if (d > 4.5 || d < 1e-3) continue;
    if ((ex * ax + ez * azz) / d < -0.2) continue;
    const lado = Math.sign(ex * azz - ez * ax) || 1, k = (4.5 - d) / 4.5 * 1.2;
    sx += -azz * lado * k; sz += ax * lado * k;
  }
  ax += sx; azz += sz;
  if (Math.abs(j.x) > P.A / 2 - 1.8) ax -= Math.sign(j.x) * 0.8;
  const l2 = Math.hypot(ax, azz) || 1;
  j.dx = ax / l2; j.dz = azz / l2; j.pique = od > 2.5 && D > 8;
}
// ---------- sin la pelota, atacando ----------
function sinPelotaAtaque(j, due, niv) {
  let [tx, tz] = objetivoForm(j, true);
  const da = dirAt(j.eq);
  if (due && due !== j) {
    // el más cercano se ofrece para el pase corto, el 9 pica al vacío
    const d = Math.hypot(due.x - j.x, due.z - j.z);
    if (j.rol === 'del' && wDe(j.eq, due.z) > 0.35) { tz = zDe(j.eq, clamp(wDe(j.eq, due.z) + 0.3, 0.5, 0.9)); tx = clamp(-due.x * 0.5, -6, 6); }
    else if (d < 9) { const lado = j.x > due.x ? 1 : -1; tx = due.x + lado * 5; tz = due.z + da * 3; }
  }
  // espacio libre: se aleja de los rivales
  for (const r of equipoDe(1 - j.eq)) { const ex = tx - r.x, ez = tz - r.z, d = Math.hypot(ex, ez); if (d < 3 && d > 0.01) { tx += ex / d * (3 - d) * 0.8; tz += ez / d * (3 - d) * 0.8; } }
  tx = clamp(tx, -P.A / 2 + 1.2, P.A / 2 - 1.2); tz = clamp(tz, -P.L / 2 + 1.5, P.L / 2 - 1.5);
  irA2(j, tx, tz, Math.hypot(tx - j.x, tz - j.z) > 5);
  j.mira = null;
  // si viene alta cerca del arco: cabezazo o volea
  remateIA(j, niv);
}
// ---------- defendiendo ----------
function defender(j, due, presiona, cubre, niv, dt) {
  const gz = arcoZ(j.eq);
  if (presiona && due) {
    // cerrarle el camino al arco
    const ex = 0 - due.x, ez = gz - due.z, l = Math.hypot(ex, ez) || 1;
    const tx = due.x + ex / l * 0.7 + due.vx * 0.25, tz = due.z + ez / l * 0.7 + due.vz * 0.25;
    const d = irA2(j, tx, tz, true);
    const dd = Math.hypot(due.x - j.x, due.z - j.z);
    if (dd < 1.15 && j.cdQuite <= 0 && az() < (0.9 + niv * 2.5) * dt * (EQUIPOS[P.eqs[j.eq]].rudos ? 1.4 : 1)) quiteParado(j, due);
    else if (dd < 2.3 && dd > 1.0 && j.cdQuite <= 0 && az() < (0.15 + niv * 0.4) * dt * 2) { j.yaw = Math.atan2(B.x - j.x, B.z - j.z); barrida(j); }
    void d;
    return;
  }
  if (cubre && due) {
    const ex = 0 - due.x, ez = gz - due.z, l = Math.hypot(ex, ez) || 1;
    irA2(j, due.x + ex / l * 4.2, due.z + ez / l * 4.2, true);
    return;
  }
  // marca: el rival más peligroso cerca de su zona
  let [tx, tz] = objetivoForm(j, false);
  let marca = null, md = 1e9;
  for (const r of equipoDe(1 - j.eq)) { if (r.i === 0 || r === due) continue; const d = Math.hypot(r.x - tx, r.z - tz); if (d < md) { md = d; marca = r; } }
  if (marca && md < 7) { const ex = 0 - marca.x, ez = gz - marca.z, l = Math.hypot(ex, ez) || 1; tx = marca.x + ex / l * 1.6; tz = marca.z + ez / l * 1.6; }
  irA2(j, tx, tz, Math.hypot(tx - j.x, tz - j.z) > 4);
  j.mira = null;
  remateIA(j, niv);
}
// ---------- pelota suelta ----------
function pelotaSuelta(j, caza, niv, dt) {
  if (caza) {
    let t = Math.hypot(B.x - j.x, B.z - j.z) / velMax(j);
    const [px, pz] = pelotaEn(Math.min(1.8, t * 0.9));
    irA2(j, px, pz, true);
    remateIA(j, niv);
    return;
  }
  const nuestra = B.ultimo && B.ultimo.eq === j.eq;
  const [tx, tz] = objetivoForm(j, nuestra);
  irA2(j, tx, tz, Math.hypot(tx - j.x, tz - j.z) > 5);
  remateIA(j, niv);
}
function remateIA(j, niv) {
  if (!pelotaLibre() || j.est !== 'normal') return;
  const alto = B.y - FUT.R, d = Math.hypot(B.x - j.x, B.z - j.z);
  if (alto < 0.45 || alto > 2.3 || d > 1.6) return;
  const acerca = (B.vx * (j.x - B.x) + B.vz * (j.z - B.z)) > 0;
  if (!acerca && d > 0.9) return;
  const gz = -arcoZ(j.eq), D = Math.hypot(j.x, gz - j.z);
  if (az() < 0.5 + niv * 0.4) prepararRemate(j, D < 13 ? 'tiro' : 'pase');
}
// ---------- el nuestro (con el palito y los botones) ----------
function controlHumano(j, inp, dt) {
  if (!j || j.est === 'caido' || j.est === 'estira' || P.fase !== 'juego') { P.carga = 0; return; }
  const con = B.dueno === j;
  if (j.est === 'normal' || j.est === 'carga') { j.dx = inp.dx; j.dz = inp.dz; j.pique = inp.C; }
  if (P.esperaSaque > 0 && con && !(inp.A.ap || inp.B.ap)) { j.dx = 0; j.dz = 0; }
  if (con) {
    if (inp.D && especialListo()) { empezarEspecial(j); return; }
    if (inp.A.suelta && j.est === 'normal') { pasar(j, inp.dx, inp.dz, inp.A.t > 0.28); P.esperaSaque = 0; }
    if (inp.B.ap && j.est === 'normal') { j.est = 'carga'; P.carga = 0; }
    if (j.est === 'carga') {
      P.carga = Math.min(1, P.carga + dt / 0.85);
      if (!inp.B.abajo) { j.est = 'normal'; const lat = lateralDe(j, inp); tirar(j, lat, P.carga, false); P.carga = 0; P.esperaSaque = 0; }
    }
    if (inp.C_toque && j.est === 'normal') gambeta(j, inp.dx, inp.dz);
  } else {
    if (j.est === 'carga') { j.est = 'normal'; P.carga = 0; }
    const alto = B.y - FUT.R, d = Math.hypot(B.x - j.x, B.z - j.z);
    const alta = pelotaLibre() && alto > 0.45 && d < 2.2;
    if (inp.A.ap) { if (alta) prepararRemate(j, 'pase'); else cambiarJugadorHumano(inp); }
    if (inp.B.ap) { if (alta) prepararRemate(j, 'tiro'); else barrida(j); }
  }
}
// el palito de costado elige el palo (según desde dónde mira la cámara)
function lateralDe(j, inp) { return Math.abs(inp.dx) > 0.3 ? clamp(inp.dx * 1.4, -1, 1) : null; }
function cambiarJugadorHumano(inp) {
  const act = P.humano, nos = equipoDe(0).filter(j => j.i !== 0 && j !== act);
  let mejor = null, ms = -1e9;
  for (const j of nos) {
    const d = Math.hypot(j.x - B.x, j.z - B.z);
    let s = -d;
    if (Math.hypot(inp.dx, inp.dz) > 0.3) { const ex = j.x - act.x, ez = j.z - act.z, l = Math.hypot(ex, ez) || 1; s += ((ex * inp.dx + ez * inp.dz) / l) * 6; }
    if (s > ms) { ms = s; mejor = j; }
  }
  if (mejor) { cambiarA(mejor); Sonido.boton(); }
}
