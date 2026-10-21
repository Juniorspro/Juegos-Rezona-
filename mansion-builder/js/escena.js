// MANSION BUILDER — la escena de cada cuadro: partículas, cubos sueltos, calcas del piso, personajes y cámara
// ---------- partículas (cuadraditos) ----------
const PT = (() => { const n = 1100, f = () => new Float32Array(n); return { n: 0, cap: n, x: f(), y: f(), z: f(), vx: f(), vy: f(), vz: f(), t: f(), vida: f(), tam: f(), r: f(), g: f(), b: f(), grav: f(), crece: f() }; })();
function particula(x, y, z, vx, vy, vz, vida, tam, c, grav, crece) {
  if (PT.n >= Math.min(PT.cap, R.maxPart)) return;
  const i = PT.n++;
  PT.x[i] = x; PT.y[i] = y; PT.z[i] = z; PT.vx[i] = vx; PT.vy[i] = vy; PT.vz[i] = vz; PT.t[i] = 0; PT.vida[i] = vida; PT.tam[i] = tam;
  PT.r[i] = c[0]; PT.g[i] = c[1]; PT.b[i] = c[2]; PT.grav[i] = grav; PT.crece[i] = crece || 0;
}
const PT_K = ['x', 'y', 'z', 'vx', 'vy', 'vz', 't', 'vida', 'tam', 'r', 'g', 'b', 'grav', 'crece'];
function actualizarParticulas(dt) {
  for (let i = 0; i < PT.n; i++) {
    PT.t[i] += dt;
    if (PT.t[i] >= PT.vida[i]) {
      const j = --PT.n;
      if (i !== j) for (let q = 0; q < PT_K.length; q++) { const A = PT[PT_K[q]]; A[i] = A[j]; }
      i--; continue;
    }
    PT.vy[i] -= PT.grav[i] * dt;
    const a = Math.exp(-dt * 1.5);
    PT.vx[i] *= a; PT.vz[i] *= a;
    PT.x[i] += PT.vx[i] * dt; PT.y[i] += PT.vy[i] * dt; PT.z[i] += PT.vz[i] * dt;
    if (PT.y[i] < SUELO + 0.04 && PT.grav[i] > 0) { PT.y[i] = SUELO + 0.04; PT.vy[i] *= -0.3; PT.vx[i] *= 0.6; PT.vz[i] *= 0.6; }
  }
}
const _cols = {};
const c3 = h => _cols[h] || (_cols[h] = col3(h));
function chispas(x, y, z, col, n, v) { const c = c3(col); for (let k = 0; k < n; k++) particula(x, y, z, rnd(-v, v), rnd(0.5, 1.6) * v, rnd(-v, v), rnd(0.35, 0.7), rnd(0.09, 0.16), c, 9); }
const CONFETI = ['#ff4d6d', '#ffd23f', '#3ec1f3', '#7bd88f', '#c77dff', '#ff9f1c', '#ffffff'];
function confeti(x, y, z) { particula(x, y, z, rnd(-3, 3), rnd(3, 8), rnd(-3, 3), rnd(1.4, 2.4), rnd(0.12, 0.2), c3(CONFETI[(vis() * CONFETI.length) | 0]), 5); }
function polvo(x, y, z) { const c = c3('#d9cdb0'); particula(x + rnd(-0.2, 0.2), y + 0.1, z + rnd(-0.2, 0.2), rnd(-0.4, 0.4), rnd(0.4, 0.9), rnd(-0.4, 0.4), rnd(0.35, 0.55), rnd(0.12, 0.2), c, 1.5, 0.25); }
function humo(x, y, z, col) { particula(x + rnd(-0.2, 0.2), y, z + rnd(-0.2, 0.2), rnd(-0.15, 0.15) + 0.25, rnd(0.8, 1.3), rnd(-0.15, 0.15) - 0.1, rnd(1.6, 2.4), rnd(0.2, 0.3), c3(col), -0.1, 0.35); }
function destello(x, y, z) { particula(x, y, z, 0, 0.2, 0, 0.18, 0.7, [1, 1, 0.95], 0, 1.5); for (let k = 0; k < 5; k++) particula(x, y, z, rnd(-1.5, 1.5), rnd(0.5, 2), rnd(-1.5, 1.5), 0.4, 0.08, [1, 1, 0.8], 3); }
// el color promedio de un bloque (para las chispas)
const _colB = [];
function colorBloque(b) {
  if (_colB[b]) return _colB[b];
  const capa = BLOQ[b].f[1], d = TEX.datos, base = capa * 16 * 16 * 4; let r = 0, g = 0, bb = 0, n = 0;
  for (let i = 0; i < 256; i++) { const k = base + i * 4; if (d[k + 3] < 128) continue; r += d[k]; g += d[k + 1]; bb += d[k + 2]; n++; }
  n = n || 1; return (_colB[b] = rgbHex([r / n * 1.15, g / n * 1.15, bb / n * 1.15]));
}

// ---------- la cámara: de costado-arriba, sigue al constructor ----------
const CAM = { x: LUGAR.inicio[0], z: LUGAR.inicio[1], yaw: 0.5, pitch: 0.84, fov: 0.6, intro: 0, temblor: 0, dist: 40, zoom: 1 };
function distCamara() { const asp = R.w / R.h, tg = 2 * Math.tan(CAM.fov / 2); return clamp(Math.max(11.5 / (tg * asp), 12.5 / tg), 14, 60) * CAM.zoom; }
function camaraJuego(dt) {
  // cerca de la obra la cámara se corre hacia la mansión y se aleja un poco, para ver cómo crece
  const k = 1 - Math.exp(-dt * 5), cerca = clamp((44 - JUG.z) / 10, 0, 1) * (Math.abs(JUG.x - 24) < 16 ? 1 : 0);
  CAM.cerca = lerp(CAM.cerca || 0, cerca, 1 - Math.exp(-dt * 2));
  CAM.x += (lerp(JUG.x, 24, CAM.cerca * 0.5) - CAM.x) * k; CAM.z += (JUG.z - 0.4 - CAM.cerca * 7 - CAM.z) * k;
  let dist = distCamara() * (1 + CAM.cerca * 0.75), tx = CAM.x, tz = CAM.z, ty = SUELO + 0.6 + CAM.cerca * 3, pitch = CAM.pitch, yaw = CAM.yaw;
  if (CAM.intro > 0) {
    // entrada: de arriba de la mansión baja hasta el constructor
    const e = suave(1 - CAM.intro / 2.6);
    tx = lerp(24, CAM.x, e); tz = lerp(24, CAM.z, e); dist = lerp(dist * 1.9, dist, e); pitch = lerp(1.25, CAM.pitch, e); yaw = lerp(-0.4, CAM.yaw, e);
    CAM.intro = Math.max(0, CAM.intro - dt);
  }
  CAM.dist = dist;
  R.camara(tx, ty, tz, dist, pitch, yaw, CAM.fov);
  R.nieblaD[0] = dist + 12; R.nieblaD[1] = 0.02;
}

// ---------- el cuadro: llena los búferes de instancias y dibuja ----------
const ESC = { personajes: [], nCubos: 0, nCalcas: 0, nPart: 0, fantasma: null, colFantasma: [0.45, 0.85, 1.0] };
const _v = [0, 0, 0];
function personaje(p, piel, t, escala) {
  p.escala = escala; p.huesos = poseHuesos(p, t);
  ESC.personajes.push({ x: p.x, z: p.z, huesos: p.huesos, malla: PJ.malla, piel, destello: p.destello || 0 });
}
function armarEscena(t) {
  const E = ESC;
  E.personajes.length = 0;
  const pj = JUG;
  personaje({ x: pj.x, y: pj.y, z: pj.z, yaw: pj.yaw, fase: pj.fase, andar: pj.andar, carga: pj.carga.length > 0, sem: 0, huesos: pj.huesos || (pj.huesos = new Float32Array(128)), festejo: VIVO.festejo > 0 && !pj.carga.length }, PIELES.jugador, t, 0.92);
  for (const a of AYUD) personaje({ x: a.x, y: a.y, z: a.z, yaw: a.yaw, fase: a.fase, andar: a.andar, carga: a.carga.length > 0, sem: a.sem, huesos: a.huesos || (a.huesos = new Float32Array(128)) }, a.piel, t, 0.86);
  for (const v of VIS) personaje({ x: v.x, y: v.y, z: v.z, yaw: v.yaw, fase: v.fase, andar: v.andar, sem: v.sem, mirarAbajo: v.mirarAbajo || 0, festejo: v.festejo > 0, huesos: v.huesos || (v.huesos = new Float32Array(128)) }, v.piel, t, 0.84);
  // cubos sueltos
  const D = R.cubo.inst.datos, cap = R.cubo.inst.cap; let n = 0;
  const cubo = (x, y, z, esc, rot, b) => { if (n >= cap) return; const k = n * 6; D[k] = x; D[k + 1] = y; D[k + 2] = z; D[k + 3] = esc; D[k + 4] = rot; D[k + 5] = b; n++; };
  for (const m in G.gens) { const e = G.gens[m], b = BLOQUE_DE[m]; for (let i = 0; i < e.pila; i++) { const p = posPila(m, i); cubo(p[0], p[1], p[2], 0.5, 0, b); } }
  const cargas = [JUG, ...AYUD];
  for (const c of cargas) for (let i = 0; i < c.carga.length; i++) {
    const it = c.carga[i], dst = posCarga(c, i), k = clamp((t - it.t0) / 0.22, 0, 1);
    if (k < 1) { const e = k * (2 - k); cubo(lerp(it.o[0], dst[0], e), lerp(it.o[1], dst[1], e) + 1.2 * 4 * k * (1 - k), lerp(it.o[2], dst[2], e), 0.36, c.yaw * k, BLOQUE_DE[it.m]); }
    else cubo(dst[0], dst[1], dst[2], 0.36, c.yaw, BLOQUE_DE[it.m]);
  }
  for (const v of VOL) { if (t < v.t0) continue; const k = posVuelo(v, _v); cubo(_v[0], _v[1], _v[2], v.esc, v.giro * k, v.b); }
  const nb = billetesCaja(), cj = LUGAR.caja;
  for (let i = 0; i < nb; i++) { const k = i % 9, f = Math.floor(i / 9); cubo(cj[0] + ((k % 3) - 1) * 0.62, SUELO + 0.1 + f * 0.17, cj[1] + (Math.floor(k / 3) - 1) * 0.42, -0.55, (hash2(i, 7) - 0.5) * 0.2, B.BILLETE); }
  E.nCubos = n;
  // calcas del piso
  const C = R.quadCalca.inst.datos, capC = R.quadCalca.inst.cap; let nc = 0;
  const calca = (x, y, z, w, d, tipo, prog, extra) => { if (nc >= capC) return; const k = nc * 8; C[k] = x; C[k + 1] = y; C[k + 2] = z; C[k + 3] = w; C[k + 4] = d; C[k + 5] = tipo; C[k + 6] = prog; C[k + 7] = extra; nc++; };
  for (const p of E.personajes) calca(p.x, SUELO + 0.02, p.z, 1.0, 1.0, 0, 0, 0);
  const o = LUGAR.obra; if (PARTES[G.parte]) calca(o[0], SUELO + 0.03, o[1], 4.4, 3.4, 2, 0, 0);
  calca(cj[0], SUELO + 0.03, cj[1], 2.9, 2.9, 3, 0, 0);
  for (const m in G.gens) { const p = LUGAR.gen[m].pila; calca(p[0], SUELO + 0.025, p[1], 3.2, 3.2, 4, 0, m.length); }
  for (const p of PADS) if (padActivo(p)) calca(p.x, SUELO + 0.03, p.z, 2.6, 2.6, 1, (G.pads[p.id] || 0) / p.precio(), 0);
  E.nCalcas = nc;
  // partículas
  const Pd = R.quadPart.inst.datos; let np = 0;
  for (let i = 0; i < PT.n && np < 1200; i++) {
    const k = np * 8, vida = PT.t[i] / PT.vida[i];
    Pd[k] = PT.x[i]; Pd[k + 1] = PT.y[i]; Pd[k + 2] = PT.z[i]; Pd[k + 3] = PT.tam[i] * (1 + PT.crece[i] * PT.t[i] * 4) * (vida > 0.75 ? (1 - vida) * 4 : 1);
    Pd[k + 4] = PT.r[i]; Pd[k + 5] = PT.g[i]; Pd[k + 6] = PT.b[i]; Pd[k + 7] = PT.crece[i] > 0 ? 0.55 * (1 - vida) : 1;
    np++;
  }
  E.nPart = np;
  if (OBRA.fantSucio) armarFantasma();
  E.fantasma = OBRA.fantasma;
  const pulso = 0.85 + 0.15 * Math.sin(t * 3);
  E.colFantasma[0] = 0.45 * pulso; E.colFantasma[1] = 0.85 * pulso; E.colFantasma[2] = 1.0;
}
function dibujarCuadro(t) {
  armarEscena(t);
  R.actualizarTrozos(EQUIPO.movil ? 2 : 4);
  R.dibujar(ESC, t);
}
