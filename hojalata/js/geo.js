// HOJALATA — geometría a mano: el armador de mallas (vértice de 28 o 32 bytes), superficies paramétricas,
// cajas redondeadas, torno, cilindros, tubos por un camino, transformaciones, y el partido de la casa en trozos
// con su caja (para no dibujar lo que la cámara no ve).
function nuevaGeo(conHueso) { return { p: [], n: [], c: [], t: [], b: [], conHueso: !!conHueso }; }
let GEO_T = null;   // transformación opcional al agregar vértices
function geoV(G, x, y, z, nx, ny, nz, col, flag, u, v, hueso) {
  if (GEO_T) { const q = GEO_T(x, y, z, nx, ny, nz); x = q[0]; y = q[1]; z = q[2]; nx = q[3]; ny = q[4]; nz = q[5]; }
  G.p.push(x, y, z); const l = Math.hypot(nx, ny, nz) || 1; G.n.push(nx / l, ny / l, nz / l);
  G.c.push(col[0], col[1], col[2], flag || 0); G.t.push(u || 0, v || 0); if (G.conHueso) G.b.push(hueso || 0);
}
// matriz → transformación de posición y normal (con la inversa transpuesta, por si la escala no es pareja)
function hacerT(m) {
  const a = m[0], b = m[1], c = m[2], d = m[4], e = m[5], f = m[6], g = m[8], h = m[9], i = m[10];
  const A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g, det = a * A + b * B + c * C || 1;
  const n00 = A / det, n01 = B / det, n02 = C / det, n10 = -(b * i - c * h) / det, n11 = (a * i - c * g) / det, n12 = -(a * h - b * g) / det, n20 = (b * f - c * e) / det, n21 = -(a * f - c * d) / det, n22 = (a * e - b * d) / det;
  const out = [0, 0, 0, 0, 0, 0];
  return (x, y, z, nx, ny, nz) => {
    out[0] = m[0] * x + m[4] * y + m[8] * z + m[12]; out[1] = m[1] * x + m[5] * y + m[9] * z + m[13]; out[2] = m[2] * x + m[6] * y + m[10] * z + m[14];
    out[3] = n00 * nx + n01 * ny + n02 * nz; out[4] = n10 * nx + n11 * ny + n12 * nz; out[5] = n20 * nx + n21 * ny + n22 * nz;
    return out;
  };
}
// se anidan: lo de adentro queda en el lugar de lo de afuera
let GEO_M = null;
function conT(m, fn) {
  const pm = GEO_M, pt = GEO_T;
  if (m) { if (pm) { const q = M4.nueva(); M4.mul(q, pm, m); GEO_M = q; } else GEO_M = m; GEO_T = hacerT(GEO_M); }
  try { fn(); } finally { GEO_M = pm; GEO_T = pt; }
}
// matriz de lugar: mover, girar (yaw, después cabeceo y rolido) y escalar
function lugar(x, y, z, yaw, sx, sy, sz, pitch, roll) {
  const m = M4.nueva(); M4.mover(m, x, y, z); M4.rotY(m, yaw || 0); if (pitch) M4.rotX(m, pitch); if (roll) M4.rotZ(m, roll);
  M4.escalar(m, sx == null ? 1 : sx, sy == null ? (sx == null ? 1 : sx) : sy, sz == null ? (sx == null ? 1 : sx) : sz); return m;
}
function geoEmpacar(G) {
  const nv = G.p.length / 3, paso = G.conHueso ? 32 : 28, buf = new ArrayBuffer(nv * paso), f = new Float32Array(buf), i8 = new Int8Array(buf), u8 = new Uint8Array(buf);
  let x0 = 1e9, y0 = 1e9, z0 = 1e9, x1 = -1e9, y1 = -1e9, z1 = -1e9;
  for (let i = 0; i < nv; i++) {
    const o = i * paso, x = G.p[i * 3], y = G.p[i * 3 + 1], z = G.p[i * 3 + 2];
    f[o / 4] = x; f[o / 4 + 1] = y; f[o / 4 + 2] = z;
    if (x < x0) x0 = x; if (y < y0) y0 = y; if (z < z0) z0 = z; if (x > x1) x1 = x; if (y > y1) y1 = y; if (z > z1) z1 = z;
    i8[o + 12] = Math.round(G.n[i * 3] * 127); i8[o + 13] = Math.round(G.n[i * 3 + 1] * 127); i8[o + 14] = Math.round(G.n[i * 3 + 2] * 127); i8[o + 15] = 0;
    u8[o + 16] = G.c[i * 4]; u8[o + 17] = G.c[i * 4 + 1]; u8[o + 18] = G.c[i * 4 + 2]; u8[o + 19] = G.c[i * 4 + 3];
    f[o / 4 + 5] = G.t[i * 2]; f[o / 4 + 6] = G.t[i * 2 + 1];
    if (G.conHueso) u8[o + 28] = G.b[i];
  }
  const fmt = [{ k: 3, t: gl.FLOAT }, { k: 4, t: gl.BYTE, norm: true }, { k: 4, t: gl.UNSIGNED_BYTE, norm: true }, { k: 2, t: gl.FLOAT }];
  if (G.conHueso) fmt.push({ k: 1, t: gl.UNSIGNED_BYTE, entero: true });
  const m = GL.malla(new Uint8Array(buf), fmt.map(x => Object.assign({}, x)));
  if (G.conHueso) { gl.bindVertexArray(m.vao); gl.bindBuffer(gl.ARRAY_BUFFER, m.vb); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 32, 0); gl.vertexAttribPointer(1, 4, gl.BYTE, true, 32, 12); gl.vertexAttribPointer(2, 4, gl.UNSIGNED_BYTE, true, 32, 16); gl.vertexAttribPointer(3, 2, gl.FLOAT, false, 32, 20); gl.vertexAttribIPointer(4, 1, gl.UNSIGNED_BYTE, 32, 28); gl.bindVertexArray(null); }
  m.n = nv; m.nv = nv; m.caja = [x0, y0, z0, x1, y1, z1];
  return m;
}
// parte una geometría grande en trozos de una grilla (por el centro de cada triángulo)
function geoPartir(G, celda, op) {
  const grupos = new Map(), nt = G.p.length / 9;
  for (let t = 0; t < nt; t++) {
    const o = t * 9, cx = (G.p[o] + G.p[o + 3] + G.p[o + 6]) / 3, cz = (G.p[o + 2] + G.p[o + 5] + G.p[o + 8]) / 3;
    const k = Math.floor(cx / celda) + ',' + Math.floor(cz / celda);
    let L = grupos.get(k); if (!L) { L = []; grupos.set(k, L); } L.push(t);
  }
  const out = [];
  for (const L of grupos.values()) {
    const H = nuevaGeo(false);
    for (const t of L) for (let v = 0; v < 3; v++) { const i = t * 3 + v; H.p.push(G.p[i * 3], G.p[i * 3 + 1], G.p[i * 3 + 2]); H.n.push(G.n[i * 3], G.n[i * 3 + 1], G.n[i * 3 + 2]); H.c.push(G.c[i * 4], G.c[i * 4 + 1], G.c[i * 4 + 2], G.c[i * 4 + 3]); H.t.push(G.t[i * 2], G.t[i * 2 + 1]); }
    const m = geoEmpacar(H); Object.assign(m, op || {}); out.push(m);
  }
  return out;
}
// una superficie paramétrica (u alrededor, v de abajo a arriba) con normales por diferencias
function geoSuperficie(G, fn, nu, nv, col, flag, hueso, uvFn) {
  const P = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) P.push(fn(i / nu, j / nv));
  const N = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
    const a = P[j * (nu + 1) + Math.min(nu, i + 1)], b = P[j * (nu + 1) + Math.max(0, i - 1)], c = P[Math.min(nv, j + 1) * (nu + 1) + i], d = P[Math.max(0, j - 1) * (nu + 1) + i];
    const ux = a[0] - b[0], uy = a[1] - b[1], uz = a[2] - b[2], vx = c[0] - d[0], vy = c[1] - d[1], vz = c[2] - d[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    if (Math.hypot(nx, ny, nz) < 1e-9) { const p = P[j * (nu + 1) + i], q = fn(i / nu, j / nv, true); nx = p[0] - q[0]; ny = p[1] - q[1]; nz = p[2] - q[2]; if (Math.hypot(nx, ny, nz) < 1e-9) { nx = 0; ny = j * 2 < nv ? -1 : 1; nz = 0; } }
    N.push([nx, ny, nz]);
  }
  const vert = (i, j) => { const k = j * (nu + 1) + i, p = P[k], n = N[k], uv = uvFn ? uvFn(p, i / nu, j / nv) : [i / nu, j / nv]; geoV(G, p[0], p[1], p[2], n[0], n[1], n[2], col, flag, uv[0], uv[1], hueso); };
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { vert(i, j); vert(i + 1, j); vert(i + 1, j + 1); vert(i, j); vert(i + 1, j + 1); vert(i, j + 1); }
}
const sgnPow = (v, e) => Math.sign(v) * Math.pow(Math.abs(v), e);
// elipsoide o "caja redondeada" (e < 1)
function geoElipsoide(G, cx, cy, cz, rx, ry, rz, col, o) {
  o = o || {};
  const e = o.e || 1, e2 = o.e2 || e, nu = o.nu || 14, nv = o.nv || 10;
  const fn = (u, v, adentro) => {
    const th = u * TAU, ph = (v - 0.5) * PI, cp = Math.cos(ph), sp = Math.sin(ph), k = adentro ? 0.5 : 1;
    let x = sgnPow(cp, e) * sgnPow(Math.sin(th), e2), y = sgnPow(sp, e), z = sgnPow(cp, e) * sgnPow(Math.cos(th), e2);
    if (o.abajo != null && y < o.abajo) y = o.abajo;
    if (o.arriba != null && y > o.arriba) y = o.arriba;
    if (o.afina) { const f = o.afina(y, z); x *= f; }
    if (o.afinaZ) { const f = o.afinaZ(y, z); y = y * f; }
    return [cx + x * rx * k, cy + y * ry * k, cz + z * rz * k];
  };
  geoSuperficie(G, fn, nu, nv, col, o.flag, o.hueso, o.uv);
}
// cápsula entre dos puntos
function geoCapsula(G, a, b, ra, rb, col, o) {
  o = o || {};
  const nu = o.nu || 10, nv = o.nv || 8, dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz) || 1e-6;
  const ex = [dx / L, dy / L, dz / L];
  const up = Math.abs(ex[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  let px = [up[1] * ex[2] - up[2] * ex[1], up[2] * ex[0] - up[0] * ex[2], up[0] * ex[1] - up[1] * ex[0]]; const l = Math.hypot(...px); px = px.map(v => v / l);
  const py = [ex[1] * px[2] - ex[2] * px[1], ex[2] * px[0] - ex[0] * px[2], ex[0] * px[1] - ex[1] * px[0]];
  const fn = (u, v, adentro) => {
    const th = u * TAU;
    let t, r, s;
    if (v < 0.5) { const q = v / 0.5; t = 0; r = ra * Math.sin(q * PI / 2); s = -Math.cos(q * PI / 2); }
    else { const q = (v - 0.5) / 0.5; t = 1; r = rb * Math.cos(q * PI / 2); s = Math.sin(q * PI / 2); }
    const rr = v < 0.5 ? ra : rb, k = adentro ? 0.3 : 1;
    const cxx = a[0] + dx * t + ex[0] * s * rr, cyy = a[1] + dy * t + ex[1] * s * rr, czz = a[2] + dz * t + ex[2] * s * rr;
    const c = Math.cos(th), sn = Math.sin(th);
    return [cxx + (px[0] * c + py[0] * sn) * r * k, cyy + (px[1] * c + py[1] * sn) * r * k, czz + (px[2] * c + py[2] * sn) * r * k];
  };
  geoSuperficie(G, fn, nu, nv, col, o.flag, o.hueso);
}
function geoQuad(G, a, b, c, d, col, flag, uvs, hueso) {
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
  const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, t = uvs || [[0, 0], [1, 0], [1, 1], [0, 1]];
  for (const [p, q] of [[a, t[0]], [b, t[1]], [c, t[2]], [a, t[0]], [c, t[2]], [d, t[3]]]) geoV(G, p[0], p[1], p[2], nx, ny, nz, col, flag, q[0], q[1], hueso);
}
// caja de lados rectos (uv en metros, para madera y ladrillo); o.sin: lados que no van ('-y' etc.)
function geoCaja(G, x0, y0, z0, x1, y1, z1, col, flag, o) {
  o = o || {};
  const sin = o.sin || '', h = o.hueso, k = o.uvEsc || 1;
  const P = (x, y, z) => [x, y, z];
  if (!sin.includes('+y')) geoQuad(G, P(x0, y1, z0), P(x0, y1, z1), P(x1, y1, z1), P(x1, y1, z0), col, flag, o.uvArriba || [[x0 * k, z0 * k], [x0 * k, z1 * k], [x1 * k, z1 * k], [x1 * k, z0 * k]], h);
  if (!sin.includes('-y')) geoQuad(G, P(x0, y0, z0), P(x1, y0, z0), P(x1, y0, z1), P(x0, y0, z1), col, flag, null, h);
  if (!sin.includes('+z')) geoQuad(G, P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1), col, flag, o.uvFrente || [[x0 * k, y0 * k], [x1 * k, y0 * k], [x1 * k, y1 * k], [x0 * k, y1 * k]], h);
  if (!sin.includes('-z')) geoQuad(G, P(x1, y0, z0), P(x0, y0, z0), P(x0, y1, z0), P(x1, y1, z0), col, flag, o.uvAtras || [[x1 * k, y0 * k], [x0 * k, y0 * k], [x0 * k, y1 * k], [x1 * k, y1 * k]], h);
  if (!sin.includes('+x')) geoQuad(G, P(x1, y0, z1), P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), col, flag, o.uvDer || [[z1 * k, y0 * k], [z0 * k, y0 * k], [z0 * k, y1 * k], [z1 * k, y1 * k]], h);
  if (!sin.includes('-x')) geoQuad(G, P(x0, y0, z0), P(x0, y0, z1), P(x0, y1, z1), P(x0, y1, z0), col, flag, o.uvIzq || [[z0 * k, y0 * k], [z1 * k, y0 * k], [z1 * k, y1 * k], [z0 * k, y1 * k]], h);
}
// torno: un perfil [[r, y], ...] que gira alrededor del eje Y (normales por tramo, suavizadas si el quiebre es chico)
function geoTorno(G, perfil, col, o) {
  o = o || {};
  const nu = o.nu || 18, n = perfil.length, a0 = o.a0 || 0, a1 = o.a1 == null ? TAU : o.a1;
  const tn = [];
  for (let i = 0; i < n - 1; i++) { const dr = perfil[i + 1][0] - perfil[i][0], dy = perfil[i + 1][1] - perfil[i][1], l = Math.hypot(dr, dy) || 1; tn.push([dy / l, -dr / l]); }
  const nv = (i, lado) => {   // normal 2D en el vértice i, del tramo de abajo (lado 0) o de arriba (lado 1)
    const a = tn[Math.max(0, i - 1)], b = tn[Math.min(n - 2, i)];
    if (i === 0) return b; if (i === n - 1) return a;
    if (a[0] * b[0] + a[1] * b[1] > 0.8) { const x = a[0] + b[0], y = a[1] + b[1], l = Math.hypot(x, y) || 1; return [x / l, y / l]; }
    return lado ? b : a;
  };
  const cols = o.cols;
  for (let i = 0; i < n - 1; i++) {
    const c = cols ? cc(cols[i % cols.length]) : col, fl = o.flags ? o.flags[i] : o.flag;
    const [r0, y0] = perfil[i], [r1, y1] = perfil[i + 1], n0 = nv(i, 1), n1 = nv(i + 1, 0);
    for (let j = 0; j < nu; j++) {
      const t0 = a0 + (a1 - a0) * j / nu, t1 = a0 + (a1 - a0) * (j + 1) / nu, s0 = Math.sin(t0), c0 = Math.cos(t0), s1 = Math.sin(t1), c1 = Math.cos(t1);
      const V = (r, y, nn, s, cc_, u, v) => geoV(G, r * s, y, r * cc_, nn[0] * s, nn[1], nn[0] * cc_, c, fl, u, v, o.hueso);
      V(r0, y0, n0, s0, c0, j / nu, i / (n - 1)); V(r0, y0, n0, s1, c1, (j + 1) / nu, i / (n - 1)); V(r1, y1, n1, s1, c1, (j + 1) / nu, (i + 1) / (n - 1));
      V(r0, y0, n0, s0, c0, j / nu, i / (n - 1)); V(r1, y1, n1, s1, c1, (j + 1) / nu, (i + 1) / (n - 1)); V(r1, y1, n1, s0, c0, j / nu, (i + 1) / (n - 1));
    }
  }
}
function geoCilindro(G, x, y0, z, r, h, col, flag, o) {
  o = o || {};
  const P = [[0, y0], [r, y0], [r, y0], [r, y0 + h], [r, y0 + h], [0, y0 + h]];
  conT(o.m || lugar(x, 0, z, 0), () => geoTorno(G, o.sinTapas ? [[r, y0], [r, y0 + h]] : P, col, { nu: o.nu || 16, flag, hueso: o.hueso }));
}
// tubo a lo largo de un camino de puntos
function geoTubo(G, pts, r, col, flag, o) {
  o = o || {};
  const nu = o.nu || 8, n = pts.length;
  const anillos = [];
  let prevN = null;
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    let t = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]; const lt = Math.hypot(...t) || 1; t = t.map(v => v / lt);
    let nn = prevN || (Math.abs(t[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]);
    const dt = nn[0] * t[0] + nn[1] * t[1] + nn[2] * t[2];
    nn = [nn[0] - t[0] * dt, nn[1] - t[1] * dt, nn[2] - t[2] * dt]; const ln = Math.hypot(...nn) || 1; nn = nn.map(v => v / ln);
    const bb = [t[1] * nn[2] - t[2] * nn[1], t[2] * nn[0] - t[0] * nn[2], t[0] * nn[1] - t[1] * nn[0]];
    prevN = nn;
    const rr = typeof r === 'function' ? r(i / (n - 1)) : r, ring = [];
    for (let j = 0; j <= nu; j++) { const th = j / nu * TAU, c = Math.cos(th), s = Math.sin(th), dx = nn[0] * c + bb[0] * s, dy = nn[1] * c + bb[1] * s, dz = nn[2] * c + bb[2] * s; ring.push([pts[i][0] + dx * rr, pts[i][1] + dy * rr, pts[i][2] + dz * rr, dx, dy, dz]); }
    anillos.push(ring);
  }
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < nu; j++) {
    const A = anillos[i][j], B = anillos[i][j + 1], C = anillos[i + 1][j + 1], D = anillos[i + 1][j];
    for (const q of [A, B, C, A, C, D]) geoV(G, q[0], q[1], q[2], q[3], q[4], q[5], col, flag, j / nu, i / (n - 1), o.hueso);
  }
}
// aro (toroide) en el plano XY, centrado en el origen
function geoAro(G, R0, r, col, flag, o) {
  o = o || {};
  const nu = o.nu || 18, nv = o.nv || 8;
  geoSuperficie(G, (u, v, adentro) => {
    const a = u * TAU, b = v * TAU, k = adentro ? 0 : 1, cx = Math.cos(a) * R0, cy = Math.sin(a) * R0;
    return [cx + Math.cos(a) * Math.cos(b) * r * k, cy + Math.sin(a) * Math.cos(b) * r * k, Math.sin(b) * r * k];
  }, nu, nv, col, flag, o.hueso);
}
const _colC = new Map();
function cc(h) { let c = _colC.get(h); if (!c) { c = hexRgb(h); _colC.set(h, c); } return c; }
