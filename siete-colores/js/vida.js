// SIETE COLORES — lo que se mueve: partículas (polvo, talco, chispas, serpentinas), pasto y flores que se mecen,
// las cosas para juntar, la gente y los animales.
const PMAX = 1400;
const PART = { n: 0, x: new Float32Array(PMAX), y: new Float32Array(PMAX), z: new Float32Array(PMAX), vx: new Float32Array(PMAX), vy: new Float32Array(PMAX), vz: new Float32Array(PMAX),
  vida: new Float32Array(PMAX), max: new Float32Array(PMAX), tam: new Float32Array(PMAX), g: new Float32Array(PMAX), r: new Float32Array(PMAX), gg: new Float32Array(PMAX), b: new Float32Array(PMAX), a: new Float32Array(PMAX), roce: new Float32Array(PMAX) };
const PTOS = { datos: new Float32Array(PMAX * 8), n: 0 };
function part(x, y, z, vx, vy, vz, vida, tam, col, g, roce, a) {
  const P = PART;
  let i = P.n;
  if (i >= PMAX) i = Math.floor(Math.random() * PMAX); else P.n++;
  P.x[i] = x; P.y[i] = y; P.z[i] = z; P.vx[i] = vx; P.vy[i] = vy; P.vz[i] = vz; P.vida[i] = P.max[i] = vida; P.tam[i] = tam; P.g[i] = g || 0; P.roce[i] = roce || 0;
  const c = typeof col === 'string' ? hexRgb(col) : col;
  P.r[i] = c[0] / 255; P.gg[i] = c[1] / 255; P.b[i] = c[2] / 255; P.a[i] = a == null ? 1 : a;
}
function polvo(x, y, z, n) { for (let k = 0; k < n; k++) part(x + rnd(-0.3, 0.3), y + 0.05, z + rnd(-0.3, 0.3), rnd(-1, 1), rnd(0.3, 1.2), rnd(-1, 1), rnd(0.4, 0.8), 0.9, '#d8c0a0', -0.4, 2.5, 0.8); }
function plumitas(x, y, z) { for (let k = 0; k < 8; k++) part(x, y, z, rnd(-2, 2), rnd(-2, 0.5), rnd(-2, 2), rnd(0.5, 1), 0.9, k % 2 ? '#ffffff' : '#d23a2c', 1.5, 1.5); }
function talco(x, y, z, n) { for (let k = 0; k < n; k++) part(x + rnd(-0.4, 0.4), y + rnd(-0.3, 0.6), z + rnd(-0.4, 0.4), rnd(-2.5, 2.5), rnd(0, 3), rnd(-2.5, 2.5), rnd(0.8, 1.6), 1.6, '#ffffff', -0.5, 2.2, 0.85); }
function chispas(x, y, z, col, n) { for (let k = 0; k < n; k++) part(x, y, z, rnd(-3, 3), rnd(0.5, 5), rnd(-3, 3), rnd(0.5, 1.2), 1.1, k % 3 ? col : '#ffffff', 6, 0.8); }
function confeti(x, y, z, n) { const cs = COLORES; for (let k = 0; k < n; k++) part(x + rnd(-6, 6), y + rnd(0, 4), z + rnd(-6, 6), rnd(-1, 1), rnd(-0.5, 1), rnd(-1, 1), rnd(2.5, 4), 1.0, cs[k % 7], 1.2, 1.2); }
function salpicon(x, y, z) { for (let k = 0; k < 6; k++) part(x, y, z, rnd(-1.5, 1.5), rnd(1, 3), rnd(-1.5, 1.5), rnd(0.3, 0.6), 0.9, '#d8f0f8', 9, 0.5); }
function pasoParticulas(dt) {
  const P = PART, D = PTOS.datos;
  let n = 0;
  for (let i = 0; i < P.n; i++) {
    P.vida[i] -= dt;
    if (P.vida[i] <= 0) continue;
    const ro = Math.exp(-P.roce[i] * dt);
    P.vx[i] *= ro; P.vz[i] *= ro; P.vy[i] = P.vy[i] * ro - P.g[i] * dt;
    P.x[i] += P.vx[i] * dt; P.y[i] += P.vy[i] * dt; P.z[i] += P.vz[i] * dt;
    // compactar en el lugar
    if (n !== i) for (const k of ['x', 'y', 'z', 'vx', 'vy', 'vz', 'vida', 'max', 'tam', 'g', 'r', 'gg', 'b', 'a', 'roce']) P[k][n] = P[k][i];
    const o = n * 8, k = P.vida[n] / P.max[n];
    D[o] = P.x[n]; D[o + 1] = P.y[n]; D[o + 2] = P.z[n]; D[o + 3] = P.tam[n];
    D[o + 4] = P.r[n]; D[o + 5] = P.gg[n]; D[o + 6] = P.b[n]; D[o + 7] = P.a[n] * Math.min(1, k * 3);
    n++;
  }
  P.n = n; PTOS.n = n;
}

// ---------- pasto, flores y piedritas (fijos) ----------
function armarDecorado(densidad) {
  const L = [], r = rngSemilla(31);
  for (let z = 1; z < SZ - 1; z++) for (let x = 1; x < SX - 1; x++) {
    const y = ALT[z * SX + x], b = VOX[vidx(x, y, z)];
    if (bloque(x, y + 1, z)) continue;
    const reg = REG[z * SX + x], h = r();
    let spr = -1, tam = 1, viento = 1;
    if (b === B.PASTO) { if (h < 0.16 * densidad) { spr = r() < 0.6 ? SPR.PAJA : SPR.PAJA2; tam = 0.8 + r() * 0.5; } else if (h < 0.2 * densidad) { spr = r() < 0.5 ? SPR.FLOR_AM : SPR.FLOR_VI; tam = 0.7; } }
    else if (b === B.TIERRA) { if (h < 0.05 * densidad) { spr = r() < 0.5 ? SPR.TOLA : SPR.PIEDRITAS; tam = 0.8 + r() * 0.3; viento = spr === SPR.PIEDRITAS ? 0 : 0.4; } else if (h < 0.08 * densidad) { spr = SPR.PAJA; tam = 0.7; } }
    else if (b === B.ARENA && reg === RG.RIO) { if (h < 0.05 * densidad) { spr = SPR.PIEDRITAS; tam = 0.7; viento = 0; } }
    else if (b === B.ARENA && reg === RG.COLORADOS) { if (h < 0.04 * densidad) { spr = r() < 0.5 ? SPR.QUISCO : SPR.TOLA; tam = 0.8; viento = 0.2; } }
    if (reg === RG.CARDONAL && (b === B.PASTO || b === B.TIERRA) && h > 0.96) { spr = r() < 0.6 ? SPR.QUISCO : SPR.FLOR_RO; tam = 0.8; viento = 0.2; }
    if (reg === RG.PUNA && b === B.PASTO && h < 0.22 * densidad) { spr = SPR.PAJA2; tam = 0.9 + r() * 0.5; }
    if (spr < 0) continue;
    L.push(x + 0.2 + r() * 0.6, y + 1, z + 0.2 + r() * 0.6, tam, spr, viento, 0, 0);
  }
  return new Float32Array(L);
}
// cosas para juntar: carteles que flotan y brillan (se rearma cada cuadro)
const _dyn = new Float32Array(64 * 8);
function cartelesDinamicos(t) {
  let n = 0;
  const pon = (x, y, z, tam, spr, salto, tinte) => { if (n >= 64) return; const o = n * 8; _dyn[o] = x; _dyn[o + 1] = y; _dyn[o + 2] = z; _dyn[o + 3] = tam; _dyn[o + 4] = spr; _dyn[o + 5] = 0; _dyn[o + 6] = salto; _dyn[o + 7] = tinte; n++; };
  for (const o of OBJ) {
    if (!o.vis) continue;
    if (o.tipo === 'pluma') pon(o.x, o.y - 0.4, o.z, 0.9, SPR.PLUMA, 0.12, 0);
    else if (o.tipo === 'ovillo') pon(o.x, o.y - 0.45, o.z, 0.75, SPR.OVILLO, 0.08, 0);
    else if (o.tipo === 'color') pon(o.x, o.y - 0.5, o.z, 1.0, SPR.GOTA, 0.15, o.color + 1);
  }
  // cóndores dando vueltas alto
  for (let k = 0; k < 3; k++) { const a = t * (0.08 + k * 0.03) + k * 2.1, rr = 30 + k * 18; pon(96 + Math.cos(a) * rr, 60 + k * 2 + Math.sin(t * 0.3 + k) * 2, 90 + Math.sin(a) * rr, 2.4, SPR.CONDOR, 0, 0); }
  // mariposas cerca de Killa
  for (let k = 0; k < 3; k++) { const a = t * 0.9 + k * 2.2; pon(J.x + Math.cos(a) * (4 + k) + Math.sin(t * 3 + k) * 0.4, J.y + 0.8 + Math.sin(t * 2.3 + k) * 0.5, J.z + Math.sin(a * 1.3) * (4 + k), 0.5, SPR.MARIPOSA, 0.05, 0); }
  return _dyn.subarray(0, n * 8);
}

// ---------- gente y animales ----------
function pasoEntidades(dt, t) {
  for (const e of ENT) {
    if (!e.vis) continue;
    // volver a la plaza (los chicos encontrados)
    if (e.volver) {
      const [tx, tz] = e.volver, dx = tx - e.x, dz = tz - e.z, d = Math.hypot(dx, dz);
      if (d < 0.3) { e.volver = null; e.est = 'quieto'; e.yaw = Math.PI; }
      else {
        const v = 3.6, nx = e.x + dx / d * v * dt, nz = e.z + dz / d * v * dt, ny = sueloEn(nx, nz, e.y + 1.5);
        if (Math.abs(ny - e.y) <= 1.5) { e.x = nx; e.z = nz; e.y += (ny - e.y) * Math.min(1, dt * 14); }
        else { e.x = tx; e.z = tz; e.y = sueloEn(tx, tz, 30); }
        e.yaw = Math.atan2(dx, dz); e.est = 'corre';
      }
    } else if (e.manada) {
      // las vicuñas pastan y se alejan si te acercás
      e.tm = (e.tm || 0) - dt;
      const d = Math.hypot(e.x - J.x, e.z - J.z);
      if (d < 4.5) { const a = Math.atan2(e.x - J.x, e.z - J.z); e.dir = a; e.tm = 1.2; e.rapido = true; }
      if (e.tm <= 0) { e.tm = 2 + Math.random() * 4; e.dir = Math.random() < 0.5 ? null : Math.random() * 6.28; e.rapido = false; }
      if (e.dir != null) {
        const v = e.rapido ? 4.5 : 1.0, nx = e.x + Math.sin(e.dir) * v * dt, nz = e.z + Math.cos(e.dir) * v * dt, ny = sueloEn(nx, nz, e.y + 1.5);
        if (Math.abs(ny - e.y) <= 1.1 && REG[Math.floor(nz) * SX + Math.floor(nx)] === RG.PUNA) { e.x = nx; e.z = nz; e.y += (ny - e.y) * Math.min(1, dt * 10); e.yaw = e.dir; e.est = e.rapido ? 'corre' : 'camina'; }
        else { e.dir = null; e.est = 'quieto'; }
      } else e.est = 'quieto';
    } else if (e.id === 'llama1' || e.id === 'llama2') {
      e.tm = (e.tm || 0) - dt;
      if (e.tm <= 0) { e.tm = 3 + Math.random() * 4; e.dir = Math.random() < 0.6 ? null : Math.random() * 6.28; }
      if (e.dir != null) { const nx = e.x + Math.sin(e.dir) * 0.8 * dt, nz = e.z + Math.cos(e.dir) * 0.8 * dt; if (nx > 97.6 && nx < 107.4 && nz > 147.6 && nz < 153.4) { e.x = nx; e.z = nz; e.yaw = e.dir; e.est = 'camina'; } else e.dir = null; }
      else e.est = 'quieto';
    } else if (e.fiesta) {
      e.est = 'baila';
    } else if (e.nombre && !e.escondido && e.id !== 'pujllay' && e.id !== 'vicBlanca') {
      // miran a Killa cuando está cerca
      const d = Math.hypot(e.x - J.x, e.z - J.z);
      if (d < 5 && !DLG) e.yaw += angDif(e.yaw, Math.atan2(J.x - e.x, J.z - e.z)) * Math.min(1, dt * 4);
      if (DLG && quienHabla() === e.id) e.est = 'habla';
      else if (e.id === 'abuela') e.est = d < 4 ? 'quieto' : 'teje';
      else if (e.id === 'fermin') e.est = d < 4 ? 'quieto' : 'toca';
      else if (e.est === 'habla') e.est = 'quieto';
    }
    const m = e.mun;
    m.x = e.x; m.y = e.y; m.z = e.z; m.yaw = e.yaw;
    if (e.cuad) animarCuadrupedo(m, e.est, t + e.x, e.est === 'corre' ? 1.3 : 1, dt); else animarPersona(m, e.est, t + e.x * 0.37, e.est === 'corre' ? 1.2 : 1, dt);
  }
}
// burbujas de texto chiquitas sobre la gente ("¡ay!", "¡je!")
let BURBUJAS = [];
function burbuja(k, e) { BURBUJAS.push({ k, e: e || null, t: 0 }); if (BURBUJAS.length > 4) BURBUJAS.shift(); }
let TOAST = null;
