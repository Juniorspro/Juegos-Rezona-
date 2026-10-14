// SIETE COLORES — Killa: caminar, subir un escalón solo, saltar, agarrarse de un borde, trepar (gasta plumas),
// planear con el poncho y aletear (gasta una pluma). Y la cámara que la sigue.
const FIS = { R: 0.26, ALTO: 1.3, G: 26, VSALTO: 9.1, VCAMINA: 3.0, VCORRE: 6.0, ACC: 44, ACCAIRE: 15, VPLANEO: 6.9, CAIDAPLANEO: 2.2, VTREPA: 2.4, ALETEO: 7.4, ESTAM0: 3 };
function chocaCaja(x0, y0, z0, x1, y1, z1) {
  const ax = Math.floor(x0), bx = Math.floor(x1 - 1e-6), ay = Math.floor(y0), by = Math.floor(y1 - 1e-6), az = Math.floor(z0), bz = Math.floor(z1 - 1e-6);
  for (let x = ax; x <= bx; x++) for (let z = az; z <= bz; z++) for (let y = ay; y <= by; y++) if (solido(x, y, z)) return true;
  return false;
}
function cajaToca(x0, y0, z0, x1, y1, z1, tipo) {
  const ax = Math.floor(x0), bx = Math.floor(x1 - 1e-6), ay = Math.floor(y0), by = Math.floor(y1 - 1e-6), az = Math.floor(z0), bz = Math.floor(z1 - 1e-6);
  for (let x = ax; x <= bx; x++) for (let z = az; z <= bz; z++) for (let y = ay; y <= by; y++) if (bloque(x, y, z) === tipo) return true;
  return false;
}
// mueve una entidad {x,y,z,r,alto} contra los cubos; con escalón sube 1 cubo sin saltar
function moverEnt(e, dx, dy, dz, escalon) {
  const r = e.r, h = e.alto, res = { px: 0, pz: 0, techo: false, subio: 0 };
  const choca = (x, y, z) => chocaCaja(x - r, y, z - r, x + r, y + h, z + r);
  const eje = (k, d) => {
    if (!d) return;
    const nx = k === 'x' ? e.x + d : e.x, nz = k === 'z' ? e.z + d : e.z;
    if (!choca(nx, e.y, nz)) { e[k] = k === 'x' ? nx : nz; return; }
    // escalón: si arriba hay lugar, sube
    if (escalon) {
      const y2 = Math.floor(e.y + 0.001) + 1;
      if (y2 - e.y <= 1.05 && !choca(nx, y2, nz) && !choca(e.x, y2, e.z)) { res.subio = y2 - e.y; e.y = y2; e[k] = k === 'x' ? nx : nz; return; }
    }
    // pegado a la pared
    const v = k === 'x' ? nx : nz, s = d > 0 ? Math.floor(v + r) - r - 0.001 : Math.floor(v - r) + 1 + r + 0.001;
    if ((d > 0 ? s >= e[k] - 0.0001 : s <= e[k] + 0.0001) && !choca(k === 'x' ? s : e.x, e.y, k === 'z' ? s : e.z)) e[k] = s;
    res[k === 'x' ? 'px' : 'pz'] = d > 0 ? 1 : -1;
  };
  eje('x', dx); eje('z', dz);
  if (dy) {
    const ny = e.y + dy;
    if (!choca(e.x, ny, e.z)) e.y = ny;
    else {
      if (dy < 0) e.y = Math.max(e.y + dy, Math.floor(ny) + 1);
      else { e.y = Math.min(e.y, Math.floor(ny + h) - h - 0.001); res.techo = true; }
      if (choca(e.x, e.y, e.z)) e.y = Math.floor(e.y) + 1;
      e.vy = 0;
    }
  }
  return res;
}
function pisaSuelo(e) { return chocaCaja(e.x - e.r * 0.9, e.y - 0.06, e.z - e.r * 0.9, e.x + e.r * 0.9, e.y, e.z + e.r * 0.9); }
function bloqueBajo(e) { return bloque(Math.floor(e.x), Math.floor(e.y - 0.05), Math.floor(e.z)); }
// rayo por la grilla (para la cámara): distancia al primer sólido
function rayo(ox, oy, oz, dx, dy, dz, max) {
  let x = Math.floor(ox), y = Math.floor(oy), z = Math.floor(oz);
  const sx = dx > 0 ? 1 : -1, sy = dy > 0 ? 1 : -1, sz = dz > 0 ? 1 : -1;
  const tdx = Math.abs(1 / (dx || 1e-9)), tdy = Math.abs(1 / (dy || 1e-9)), tdz = Math.abs(1 / (dz || 1e-9));
  let tx = (dx > 0 ? x + 1 - ox : ox - x) * tdx, ty = (dy > 0 ? y + 1 - oy : oy - y) * tdy, tz = (dz > 0 ? z + 1 - oz : oz - z) * tdz, t = 0;
  while (t < max) {
    if (tx < ty && tx < tz) { x += sx; t = tx; tx += tdx; } else if (ty < tz) { y += sy; t = ty; ty += tdy; } else { z += sz; t = tz; tz += tdz; }
    if (t < max && solido(x, y, z)) return t;
  }
  return max;
}

const J = {
  x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, r: FIS.R, alto: FIS.ALTO, yaw: 0, suelo: true, est: 'quieto', estam: FIS.ESTAM0, estamMax: FIS.ESTAM0,
  coyote: 0, buffer: 0, tAire: 0, borde: null, pared: null, tAleteo: 0, yVis: 0, segura: [0, 0, 0], tSuelo: 0, mun: null, quieta: false, tPincha: 0, vel: 0, enAgua: false, tPaso: 0,
  colocar(x, y, z, yaw) { this.x = x; this.y = y; this.z = z; this.vx = this.vy = this.vz = 0; this.yaw = yaw || 0; this.suelo = true; this.est = 'quieto'; this.borde = null; this.pared = null; this.segura = [x, y, z]; this.yVis = 0; },
};
// entrada del paso: mx,mz (mundo, largo 0..1), salta (apretado ahora), sostiene (A apretado)
function pasoJugador(dt, mx, mz, salta, sostiene) {
  const j = J, m = Math.min(1, Math.hypot(mx, mz));
  j.tAleteo = Math.max(0, j.tAleteo - dt); j.tPincha = Math.max(0, j.tPincha - dt);
  if (salta) j.buffer = 0.13; else j.buffer = Math.max(0, j.buffer - dt);
  // subiendo un borde: se interpola, sin física
  if (j.borde) {
    const b = j.borde; b.t += dt / 0.24;
    const k = suave(b.t);
    j.x = lerp(b.x0, b.x1, k); j.z = lerp(b.z0, b.z1, k); j.y = lerp(b.y0, b.y1, Math.min(1, k * 1.6));
    j.est = 'trepa';
    if (b.t >= 1) { j.borde = null; j.suelo = true; j.vy = 0; j.est = 'quieto'; Sonido.paso('piedra'); }
    return;
  }
  // trepando
  if (j.pared) { pasoTrepar(dt, mx, mz, salta); return; }
  // caminar / correr
  const vObj = j.suelo ? lerp(FIS.VCAMINA, FIS.VCORRE, clamp((m - 0.55) / 0.4, 0, 1)) * (m > 0.08 ? 1 : 0) : 0;
  const agua = j.enAgua ? 0.55 : 1;
  let planea = !j.suelo && sostiene && j.vy < 0.5 && j.tAleteo <= 0;
  if (j.suelo || !planea) {
    const acc = (j.suelo ? FIS.ACC : FIS.ACCAIRE) * dt;
    const tvx = m > 0.08 ? mx / m * (j.suelo ? vObj : Math.max(FIS.VCAMINA, Math.hypot(j.vx, j.vz))) * agua : 0, tvz = m > 0.08 ? mz / m * (j.suelo ? vObj : Math.max(FIS.VCAMINA, Math.hypot(j.vx, j.vz))) * agua : 0;
    if (j.suelo || m > 0.08) { j.vx = acercar(j.vx, tvx, acc); j.vz = acercar(j.vz, tvz, acc); }
    if (m > 0.08) j.yaw += angDif(j.yaw, Math.atan2(mx, mz)) * Math.min(1, dt * (j.suelo ? 14 : 6));
  } else {
    // planeando: va hacia donde mira y dobla de a poco
    if (m > 0.08) j.yaw += clamp(angDif(j.yaw, Math.atan2(mx, mz)), -2.8 * dt, 2.8 * dt);
    const v = FIS.VPLANEO * (m > 0.08 ? 1 : 0.8), k = Math.min(1, dt * 3.2);
    j.vx += (Math.sin(j.yaw) * v - j.vx) * k; j.vz += (Math.cos(j.yaw) * v - j.vz) * k;
  }
  // saltar, aletear
  if (j.buffer > 0 && (j.suelo || j.coyote > 0)) {
    j.vy = FIS.VSALTO; j.suelo = false; j.coyote = 0; j.buffer = 0; j.tAire = 0;
    j.mun.sqT = 1; j.mun.sqA = 0.18; Sonido.salto(); polvo(j.x, j.y, j.z, 5);
  } else if (salta && !j.suelo && j.coyote <= 0 && j.tAire > 0.08) {
    if (j.estam >= 1) { j.estam -= 1; j.vy = FIS.ALETEO; j.tAleteo = 0.32; planea = false; Sonido.aleteo(); vibrar(12); plumitas(j.x, j.y + 0.8, j.z); }
    else Sonido.sinPlumas();
  }
  // gravedad
  if (planea) { j.vy -= FIS.G * dt * 0.5; if (j.vy < -FIS.CAIDAPLANEO) j.vy += (-FIS.CAIDAPLANEO - j.vy) * Math.min(1, dt * 9); }
  else j.vy = Math.max(-30, j.vy - FIS.G * dt);
  const antesSuelo = j.suelo, vyAntes = j.vy;
  const res = moverEnt(j, j.vx * dt, j.vy * dt, j.vz * dt, j.suelo || j.coyote > 0);
  if (res.subio) j.yVis -= res.subio;
  j.suelo = j.vy <= 0 && pisaSuelo(j);
  if (j.suelo) {
    if (!antesSuelo) { j.mun.sqT = 1; j.mun.sqA = -Math.min(0.28, Math.abs(vyAntes) * 0.022); if (vyAntes < -7) { Sonido.caer(); polvo(j.x, j.y, j.z, 8); vibrar(15); } else Sonido.paso(sueloDe(bloqueBajo(j))); }
    j.coyote = 0.12; j.tAire = 0; j.tSuelo += dt;
    if (j.tSuelo > 0.25 && j.estam < j.estamMax) { j.estam = j.estamMax; }
    const bb = bloqueBajo(j);
    if (bb !== B.CARDON && bb !== B.AGUA && bb !== 0) j.segura = [j.x, j.y, j.z];
  } else { j.coyote = Math.max(0, j.coyote - dt); j.tAire += dt; j.tSuelo = 0; }
  j.enAgua = aguaEn(j.x, j.y + 0.1, j.z);
  // los cardones pinchan: rebota
  if (j.tPincha <= 0 && cajaToca(j.x - j.r - 0.06, j.y + 0.1, j.z - j.r - 0.06, j.x + j.r + 0.06, j.y + j.alto, j.z + j.r + 0.06, B.CARDON) && (res.px || res.pz)) {
    j.vx = -(res.px || 0) * 5; j.vz = -(res.pz || 0) * 5; j.vy = Math.max(j.vy, 4.5); j.suelo = false; j.tPincha = 0.6; Sonido.ay(); vibrar(30); burbuja('ay');
  }
  // contra una pared: borde (si está a la altura del pecho) o trepar
  const ix = m > 0.08 ? mx / m : 0, iz = m > 0.08 ? mz / m : 0;
  if ((res.px || res.pz) && m > 0.3 && j.tPincha <= 0) {
    const wx = res.px, wz = wx ? 0 : res.pz;
    if (ix * wx + iz * wz > 0.55) {
      if (!j.suelo || j.tSuelo < 0.05 || true) {
        if (intentarBorde(j, wx, wz)) return;
      }
      if (!j.suelo && j.vy < 3 && puedeTrepar(j, wx, wz)) { empezarTrepar(j, wx, wz); return; }
      if (j.suelo && puedeTrepar(j, wx, wz) && paredAlta(j, wx, wz)) { empezarTrepar(j, wx, wz); return; }
    }
  }
  // caída al vacío (no debería pasar): vuelve al último lugar seguro
  if (j.y < -4) { const s = j.segura; j.colocar(s[0], s[1] + 0.5, s[2], j.yaw); }
  // estado para la animación
  j.vel = Math.hypot(j.vx, j.vz);
  if (j.suelo) j.est = j.vel > 4.2 ? 'corre' : j.vel > 0.4 ? 'camina' : 'quieto';
  else if (j.tAleteo > 0) j.est = 'aletea';
  else if (planea) j.est = 'planea';
  else j.est = j.vy > 0 ? 'salta' : 'cae';
  if (j.suelo && j.vel > 0.6) { j.tPaso -= dt * j.vel; if (j.tPaso <= 0) { j.tPaso = 1.25; Sonido.paso(j.enAgua ? 'agua' : sueloDe(bloqueBajo(j))); if (j.vel > 4.5 && hash2(T * 100, 3) < 0.4) polvo(j.x, j.y, j.z, 1); } }
  j.planea = planea;
}
function sueloDe(b) { return b === B.SAL ? 'sal' : b === B.MADERA || b === B.PUERTA ? 'madera' : b === B.BALDOSA || b === B.PIRCA || b === B.PIEDRA || b === B.PIEDRASOL ? 'piedra' : b === B.AGUA ? 'agua' : b === B.NIEVE ? 'nieve' : 'tierra'; }
// ¿hay un borde a la altura del pecho? (se sube sin trepar)
function intentarBorde(j, wx, wz) {
  for (let k = 1; k <= 2; k++) {
    const y2 = Math.floor(j.y + 0.001) + k;
    if (y2 - j.y > 1.25 || y2 - j.y < 0.3) continue;
    const x2 = j.x + wx * (j.r * 2 + 0.12), z2 = j.z + wz * (j.r * 2 + 0.12);
    const ch = (x, y, z) => chocaCaja(x - j.r, y, z - j.r, x + j.r, y + j.alto, z + j.r);
    if (!ch(x2, y2, z2) && !ch(j.x, y2, j.z) && solido(Math.floor(x2), y2 - 1, Math.floor(z2)) && bloque(Math.floor(x2), y2 - 1, Math.floor(z2)) !== B.CARDON) {
      j.borde = { t: 0, x0: j.x, y0: j.y, z0: j.z, x1: x2, y1: y2, z1: z2 }; j.vx = j.vz = j.vy = 0; j.pared = null;
      return true;
    }
  }
  return false;
}
function frente(j, wx, wz, dy) { return bloque(Math.floor(j.x + wx * (j.r + 0.1)), Math.floor(j.y + dy), Math.floor(j.z + wz * (j.r + 0.1))); }
function puedeTrepar(j, wx, wz) { if (j.estam <= 0.05) return false; const b = frente(j, wx, wz, 0.6); return SOLIDO[b] && TREPA[b]; }
function paredAlta(j, wx, wz) { return SOLIDO[frente(j, wx, wz, 0.5)] && SOLIDO[frente(j, wx, wz, 1.5)] && SOLIDO[frente(j, wx, wz, 2.5)]; }
function empezarTrepar(j, wx, wz) {
  j.pared = { wx, wz }; j.vx = j.vz = 0; j.vy = 0; j.impulso = 0; j.suelo = false; j.est = 'trepa'; j.yaw = Math.atan2(wx, wz);
  Sonido.agarre();
}
function pasoTrepar(dt, mx, mz, salta) {
  const j = J, p = j.pared, m = Math.min(1, Math.hypot(mx, mz));
  // en la pared: "hacia la pared" es subir, "para atrás" es bajar, a los costados se corre
  const hacia = m > 0.1 ? (mx * p.wx + mz * p.wz) : 0, tx = -p.wz, tz = p.wx, lado = m > 0.1 ? (mx * tx + mz * tz) : 0;
  const sube = hacia > 0.2 ? Math.min(1, m * 1.2) : hacia < -0.35 ? -Math.min(1, m * 1.2) : 0;
  if (salta) {
    if (j.estam >= 1 && hacia > -0.3) { j.estam -= 1; j.impulso = 6.2; Sonido.aleteo(); }
    else { j.pared = null; j.vx = -p.wx * 4.5; j.vz = -p.wz * 4.5; j.vy = 6; j.yaw = Math.atan2(-p.wx, -p.wz); j.est = 'salta'; return; }
  }
  if (hacia < -0.75 && m > 0.6) { j.pared = null; j.vx = -p.wx * 2; j.vz = -p.wz * 2; return; }
  const gasta = (Math.abs(sube) > 0.1 || Math.abs(lado) > 0.1 || j.impulso > 0) ? 1 : 0.35;
  j.estam = Math.max(0, j.estam - dt * gasta);
  if (j.impulso > 0) { j.impulso = Math.max(0, j.impulso - FIS.G * dt); j.vy = j.impulso; } else j.vy = sube * FIS.VTREPA;
  if (j.estam <= 0) { j.vy = -1.5; if (frente(j, p.wx, p.wz, 0.6) === 0 || pisaSuelo(j)) { j.pared = null; } }
  const res = moverEnt(j, (p.wx * 0.6 + tx * lado * 1.6) * dt, j.vy * dt, (p.wz * 0.6 + tz * lado * 1.6) * dt, false);
  j.yaw = Math.atan2(p.wx, p.wz);
  j.est = 'trepa'; j.vel = Math.abs(j.vy) / FIS.VTREPA + Math.abs(lado);
  // arriba se termina la pared: sube al borde
  if (!SOLIDO[frente(j, p.wx, p.wz, 0.95)] || !SOLIDO[frente(j, p.wx, p.wz, 0.4)]) {
    if (intentarBorde(j, p.wx, p.wz)) return;
    if (!SOLIDO[frente(j, p.wx, p.wz, 0.4)]) { j.pared = null; return; }
  }
  // llegó al suelo bajando
  if (j.vy < 0 && pisaSuelo(j)) { j.pared = null; j.suelo = true; }
  // se soltó (la pared se terminó de costado) o ya no se puede trepar
  if (!SOLIDO[frente(j, p.wx, p.wz, 0.6)] && !SOLIDO[frente(j, p.wx, p.wz, 1.2)]) j.pared = null;
  if (j.pared && !TREPA[frente(j, p.wx, p.wz, 0.6)] && SOLIDO[frente(j, p.wx, p.wz, 0.6)]) j.pared = null;
  if (j.pared && j.tAire > 0) j.tAire = 0;
}

// ---------- la cámara ----------
const CAMJ = { yaw: Math.PI, pitch: -0.3, dist: 7, distAct: 7, tArr: 9, ox: 0, oy: 0, oz: 0, modo: 'sigue', cine: null, temblor: 0 };
function camaraJugador(dt, apaisado) {
  const c = CAMJ, j = J;
  const ty = j.y + j.yVis + 1.15;
  j.yVis *= Math.exp(-dt * 14);
  c.ox += (j.x - c.ox) * Math.min(1, dt * 10); c.oz += (j.z - c.oz) * Math.min(1, dt * 10); c.oy += (ty - c.oy) * Math.min(1, dt * (j.suelo || j.pared || j.borde ? 9 : 4));
  if (Math.hypot(j.x - c.ox, j.z - c.oz) > 4 || Math.abs(ty - c.oy) > 4) { c.ox = j.x; c.oy = ty; c.oz = j.z; }
  // el punto que mira nunca adentro de un cubo
  for (let k = 0; k < 6 && solido(Math.floor(c.ox), Math.floor(c.oy), Math.floor(c.oz)); k++) c.oy += 0.35;
  c.tArr += dt;
  // vuelve sola detrás cuando se camina (1,5 s después del último arrastre)
  if (c.tArr > 1.5 && j.vel > 1 && !j.pared) {
    const atras = Math.atan2(j.vx, -j.vz), d = angDif(c.yaw, atras);
    if (Math.abs(d) < 2.5) c.yaw += d * Math.min(1, dt * 0.9 * clamp(j.vel / 5, 0.2, 1.2));
  }
  if (j.pared && c.tArr > 1) { const atras = Math.atan2(j.pared.wx, -j.pared.wz); c.yaw += angDif(c.yaw, atras) * Math.min(1, dt * 1.5); }
  const pObj = c.tArr > 2.5 ? (j.planea ? -0.22 : j.pared ? -0.12 : -0.3) : c.pitch;
  if (c.tArr > 2.5) c.pitch += (pObj - c.pitch) * Math.min(1, dt * 1.2);
  const base = apaisado ? 6.2 : 7.0;
  // tapada por una pared: la cámara sube y mira desde arriba (en un cañón o una calle angosta)
  const dir = p => { const cp = Math.cos(p); return [Math.sin(c.yaw) * cp, Math.sin(p), -Math.cos(c.yaw) * cp]; };
  let d0 = dir(c.pitch), hit = rayo(c.ox, c.oy, c.oz, -d0[0], -d0[1], -d0[2], base + 0.4) - 0.35, extraObj = 0;
  // tapada de costado: si nadie la está girando, busca el ángulo más libre cerca (calles y senderos)
  if (hit < base * 0.6 && c.tArr > 1.0) {
    let mejor = 0, mh = hit;
    for (const dy of [0.35, -0.35, 0.7, -0.7, 1.05, -1.05]) {
      const cp = Math.cos(c.pitch), ya = c.yaw + dy, h2 = rayo(c.ox, c.oy, c.oz, -Math.sin(ya) * cp, -Math.sin(c.pitch), Math.cos(ya) * cp, base + 0.4) - 0.35;
      if (h2 > mh + 0.6 + Math.abs(dy) * 0.6) { mh = h2; mejor = dy; }
    }
    if (mejor) c.yaw += mejor * Math.min(1, dt * 2.2);
  }
  if (hit < base * 0.7) {
    for (const ex of [0.35, 0.7, 1.0]) {
      const p2 = Math.max(-1.3, c.pitch - ex), d2 = dir(p2), h2 = rayo(c.ox, c.oy, c.oz, -d2[0], -d2[1], -d2[2], base + 0.4) - 0.35;
      if (h2 > hit + 0.8) { extraObj = ex; if (h2 > base * 0.7) break; }
    }
  }
  c.extra = (c.extra || 0) + (extraObj - (c.extra || 0)) * Math.min(1, dt * (extraObj > (c.extra || 0) ? 6 : 1.2));
  const pa = Math.max(-1.3, c.pitch - c.extra), d1 = dir(pa);
  hit = rayo(c.ox, c.oy, c.oz, -d1[0], -d1[1], -d1[2], base + 0.4) - 0.35;
  const fx = d1[0], fy = d1[1], fz = d1[2];
  const obj = clamp(Math.min(base, hit), 0.5, base);
  c.distAct = obj < c.distAct ? obj : c.distAct + (obj - c.distAct) * Math.min(1, dt * 1.5);
  const cam = R.cam;
  const tb = c.temblor > 0 ? (c.temblor -= dt, c.temblor * 0.15) : 0;
  cam.x = c.ox - fx * c.distAct + Math.sin(T * 37) * tb; cam.y = c.oy - fy * c.distAct + Math.sin(T * 43) * tb; cam.z = c.oz - fz * c.distAct;
  cam.yaw = c.yaw; cam.pitch = pa + Math.sin(T * 0.7) * 0.004;
}
function girarCamara(dx, dy) {
  CAMJ.yaw += dx * 0.012 * (OP ? OP.sens : 1); CAMJ.pitch = clamp(CAMJ.pitch - dy * 0.008 * (OP ? OP.sens : 1) * (OP && OP.invertir ? -1 : 1), -1.2, 0.5); CAMJ.tArr = 0;
}
