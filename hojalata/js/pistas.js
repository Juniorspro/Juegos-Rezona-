// HOJALATA — la pista: una curva cerrada (Catmull-Rom centrípeta) por puntos de control, muestreada cada medio
// metro de juguete con su marco (adelante, derecha, arriba con peralte), ancho, curvatura y lo que tiene cada
// tramo (barandas, turbo, salto, hueco, madera, jabón, toalla, agua). De ahí sale la malla de chapa con cordones,
// barandas dobladas y columnitas, y las consultas de la física (marco en s, altura en s+d).
const PASO_S = 0.5, HUECO_LARGO = 4.5;
const F_RI = 1, F_RD = 2, F_TURBO = 4, F_SALTO = 8, F_HUECO = 16, F_MADERA = 32, F_JABON = 64, F_TOALLA = 128, F_AGUA = 256, F_CAJAS = 512, F_TORN = 1024, F_TIERRA = 2048;
function banderasDe(s) {
  let f = F_RI | F_RD;
  if (s.includes('n')) f &= ~(F_RI | F_RD);
  if (s.includes('i')) f &= ~F_RD;          // sólo baranda izquierda
  if (s.includes('d')) f &= ~F_RI;          // sólo baranda derecha
  if (s.includes('T')) f |= F_TURBO;
  if (s.includes('J')) f |= F_SALTO;
  if (s.includes('H')) f |= F_HUECO;
  if (s.includes('m')) f |= F_MADERA;
  if (s.includes('j')) f |= F_JABON;
  if (s.includes('t')) f |= F_TOALLA;
  if (s.includes('a')) f |= F_AGUA;
  if (s.includes('c')) f |= F_CAJAS;
  if (s.includes('k')) f |= F_TORN;
  if (s.includes('x')) f |= F_TIERRA;
  return f;
}
// Barry-Goldman: Catmull-Rom centrípeta en 3D
function crPunto(p0, p1, p2, p3, t, o) {
  const d = (a, b) => Math.pow(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), 0.5) || 1e-4;
  const t1 = d(p0, p1), t2 = t1 + d(p1, p2), t3 = t2 + d(p2, p3), tt = t1 + (t2 - t1) * t;
  for (let k = 0; k < 3; k++) {
    const L = (a, b, t0, tb) => a + (b - a) * (tt - t0) / (tb - t0);
    const A1 = L(p0[k], p1[k], 0, t1), A2 = L(p1[k], p2[k], t1, t2), A3 = L(p2[k], p3[k], t2, t3);
    const B1 = A1 + (A2 - A1) * (tt - 0) / (t2 - 0), B2 = A2 + (A3 - A2) * (tt - t1) / (t3 - t1);
    o[k] = B1 + (B2 - B1) * (tt - t1) / (t2 - t1);
  }
  return o;
}
// arma la pista: puntos [x, z, y, ancho, peralteGrados, 'banderas']
function armarCurva(pts) {
  const n = pts.length, P = pts.map(p => [p[0], (p[2] || 0) + 0.1, p[1]]), fino = [], FN = 48;
  const o = [0, 0, 0];
  for (let i = 0; i < n; i++) {
    const p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[(i + 2) % n];
    for (let k = 0; k < FN; k++) { crPunto(p0, p1, p2, p3, k / FN, o); fino.push([o[0], o[1], o[2], i, k / FN]); }
  }
  // largo y remuestreo parejo
  const acum = [0];
  for (let i = 1; i <= fino.length; i++) { const a = fino[i - 1], b = fino[i % fino.length]; acum.push(acum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])); }
  const L = acum[fino.length], N = Math.max(16, Math.round(L / PASO_S)), paso = L / N;
  const C = { N, L, paso, px: new Float32Array(N), py: new Float32Array(N), pz: new Float32Array(N), tx: new Float32Array(N), ty: new Float32Array(N), tz: new Float32Array(N),
    rx: new Float32Array(N), ry: new Float32Array(N), rz: new Float32Array(N), ux: new Float32Array(N), uy: new Float32Array(N), uz: new Float32Array(N),
    w: new Float32Array(N), kap: new Float32Array(N), ban: new Float32Array(N), f: new Uint16Array(N), seg: new Uint16Array(N), linea: new Float32Array(N) };
  let j = 0;
  for (let i = 0; i < N; i++) {
    const s = i * paso;
    while (j < fino.length - 1 && acum[j + 1] < s) j++;
    const a = fino[j], b = fino[(j + 1) % fino.length], k = (s - acum[j]) / Math.max(1e-6, acum[j + 1] - acum[j]);
    C.px[i] = a[0] + (b[0] - a[0]) * k; C.py[i] = a[1] + (b[1] - a[1]) * k; C.pz[i] = a[2] + (b[2] - a[2]) * k;
    const seg = a[3], t = a[4] + (1 / FN) * k, p = pts[seg], q = pts[(seg + 1) % n], st = suave(t);
    C.w[i] = lerp(p[3] || 5, q[3] || 5, st); C.ban[i] = lerp(p[4] || 0, q[4] || 0, st) * PI / 180; C.f[i] = banderasDe(p[5] || ''); C.seg[i] = seg;
  }
  // el hueco es sólo el principio del tramo marcado (después viene la bajada para caer)
  { let ini = -1, segH = -1; for (let i = 0; i < N; i++) { if (C.f[i] & F_HUECO) { if (C.seg[i] !== segH) { segH = C.seg[i]; ini = i; } if ((i - ini) * paso > HUECO_LARGO) C.f[i] &= ~F_HUECO; } } }
  // marco: tangente por diferencias, curvatura con suavizado, peralte (el pedido + uno automático en las curvas)
  const th = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const a = (i - 1 + N) % N, b = (i + 1) % N;
    let tx = C.px[b] - C.px[a], ty = C.py[b] - C.py[a], tz = C.pz[b] - C.pz[a]; const l = Math.hypot(tx, ty, tz) || 1;
    C.tx[i] = tx / l; C.ty[i] = ty / l; C.tz[i] = tz / l; th[i] = Math.atan2(C.tx[i], C.tz[i]);
  }
  const k0 = new Float32Array(N);
  for (let i = 0; i < N; i++) k0[i] = -angDif(th[i], th[(i + 1) % N]) / paso;
  for (let i = 0; i < N; i++) { let s = 0; for (let d = -4; d <= 4; d++) s += k0[(i + d + N) % N]; C.kap[i] = s / 9; }
  for (let i = 0; i < N; i++) {
    const tx = C.tx[i], ty = C.ty[i], tz = C.tz[i];
    let ux = -ty * tx, uy = 1 - ty * ty, uz = -ty * tz; const lu = Math.hypot(ux, uy, uz) || 1; ux /= lu; uy /= lu; uz /= lu;
    let rx = ty * uz - tz * uy, ry = tz * ux - tx * uz, rz = tx * uy - ty * ux;
    const b = C.ban[i] + clamp(C.kap[i] * 1.6, -0.22, 0.22) * ((C.f[i] & (F_RI | F_RD)) ? 1 : 0.3), cb = Math.cos(b), sb = Math.sin(b);
    const nux = ux * cb + rx * sb, nuy = uy * cb + ry * sb, nuz = uz * cb + rz * sb;
    C.py[i] += C.w[i] / 2 * Math.abs(sb);   // con peralte, el borde bajo apoya en el piso (no se mete abajo)
    C.ux[i] = nux; C.uy[i] = nuy; C.uz[i] = nuz;
    C.rx[i] = ty * nuz - tz * nuy; C.ry[i] = tz * nux - tx * nuz; C.rz[i] = tx * nuy - ty * nux;
  }
  // la línea de carrera: hacia adentro de la curva que viene
  for (let i = 0; i < N; i++) {
    let s = 0; for (let d = -6; d <= 18; d++) s += C.kap[(i + d + N) % N];
    const m = C.w[i] / 2 - 0.75;
    C.linea[i] = clamp(s / 25 * 26, -m, m);
  }
  for (let r = 0; r < 3; r++) { const t = C.linea.slice(); for (let i = 0; i < N; i++) C.linea[i] = (t[(i - 2 + N) % N] + t[(i - 1 + N) % N] + t[i] + t[(i + 1) % N] + t[(i + 2) % N]) / 5; }
  return C;
}
// ---------- consultas ----------
function idxS(C, s) { s = ((s % C.L) + C.L) % C.L; const f = s / C.paso, i = Math.floor(f); return [i % C.N, (i + 1) % C.N, f - i]; }
const _mq = { px: 0, py: 0, pz: 0, tx: 0, ty: 0, tz: 0, rx: 0, ry: 0, rz: 0, ux: 0, uy: 0, uz: 0, w: 5, kap: 0, f: 0, linea: 0, i: 0 };
function marcoEn(C, s, o) {
  o = o || _mq;
  const [i, j, k] = idxS(C, s), L = (A) => A[i] + (A[j] - A[i]) * k;
  o.px = L(C.px); o.py = L(C.py); o.pz = L(C.pz);
  o.tx = L(C.tx); o.ty = L(C.ty); o.tz = L(C.tz); o.rx = L(C.rx); o.ry = L(C.ry); o.rz = L(C.rz); o.ux = L(C.ux); o.uy = L(C.uy); o.uz = L(C.uz);
  o.w = L(C.w); o.kap = L(C.kap); o.f = C.f[k < 0.5 ? i : j]; o.linea = L(C.linea); o.i = i;
  return o;
}
function puntoEn(C, s, d, h, out) { const m = marcoEn(C, s); out = out || [0, 0, 0]; out[0] = m.px + m.rx * d + m.ux * h; out[1] = m.py + m.ry * d + m.uy * h; out[2] = m.pz + m.rz * d + m.uz * h; return out; }
// distancia hacia adelante de a hasta b por la pista (entre -L/2 y L/2)
function difS(C, a, b) { let d = (b - a) % C.L; if (d > C.L / 2) d -= C.L; if (d < -C.L / 2) d += C.L; return d; }
// la s más cercana a un punto del mundo (buscando cerca de una pista)
function sCercana(C, x, z, sGuess) {
  let mejor = 0, md = 1e18;
  const desde = sGuess == null ? 0 : Math.floor(sGuess / C.paso) - 40, hasta = sGuess == null ? C.N : Math.floor(sGuess / C.paso) + 40;
  for (let ii = desde; ii < hasta; ii++) { const i = ((ii % C.N) + C.N) % C.N, dx = C.px[i] - x, dz = C.pz[i] - z, d = dx * dx + dz * dz; if (d < md) { md = d; mejor = i; } }
  return mejor * C.paso;
}

// ---------- la malla de la pista ----------
// chapa litografiada arriba, canto y panza, barandas dobladas donde hay, almohadillas de turbo, columnitas
function mallaPista(C, op) {
  const G = nuevaGeo(false), N = C.N, esp = 0.07, hR = 0.24, colRiel = cc(op.riel || '#d8352a'), colPanza = cc('#8f949e'), colCanto = cc('#c4c9d2'), blanco = cc('#ffffff');
  const P = (i, d, h) => { const k = ((i % N) + N) % N; return [C.px[k] + C.rx[k] * d + C.ux[k] * h, C.py[k] + C.ry[k] * d + C.uy[k] * h, C.pz[k] + C.rz[k] * d + C.uz[k] * h]; };
  const sDe = i => i * C.paso;
  for (let i = 0; i < N; i++) {
    const j = i + 1, fi = C.f[i];
    if (fi & F_HUECO) continue;
    const wi = C.w[i] / 2, wj = C.w[j % N] / 2;
    const mat = (fi & F_MADERA) ? 4 : (fi & F_JABON) ? 14 : (fi & F_TOALLA) ? 10 : (fi & F_TIERRA) ? 17 : 6;
    const col = (fi & F_MADERA) ? cc('#d9a066') : (fi & F_JABON) ? cc('#f2b8d8') : (fi & F_TOALLA) ? cc('#5ab0d8') : (fi & F_TIERRA) ? cc('#9a7048') : blanco;
    const s0 = sDe(i), s1 = sDe(j);
    // arriba (con uv: u de 0 a la izquierda a 1 a la derecha, v = s)
    geoQuad(G, P(i, -wi, 0), P(i, wi, 0), P(j, wj, 0), P(j, -wj, 0), col, mat, [[0, s0], [1, s0], [1, s1], [0, s1]]);
    // panza y cantos
    geoQuad(G, P(i, wi, -esp), P(i, -wi, -esp), P(j, -wj, -esp), P(j, wj, -esp), colPanza, 19);
    if (!(fi & F_RI)) geoQuad(G, P(i, -wi, -esp), P(i, -wi, 0), P(j, -wj, 0), P(j, -wj, -esp), colCanto, 2);
    if (!(fi & F_RD)) geoQuad(G, P(i, wi, 0), P(i, wi, -esp), P(j, wj, -esp), P(j, wj, 0), colCanto, 2);
    // barandas: chapa doblada con el borde enrollado
    for (const lado of [-1, 1]) {
      if (!(fi & (lado < 0 ? F_RI : F_RD))) continue;
      const a = lado * wi, b = lado * wj, t = 0.05 * lado;
      if (lado < 0) { geoQuad(G, P(i, a, 0), P(i, a, hR), P(j, b, hR), P(j, b, 0), colRiel, 19); geoQuad(G, P(i, a + t, hR), P(i, a + t, -esp), P(j, b + t, -esp), P(j, b + t, hR), colRiel, 19); }
      else { geoQuad(G, P(i, a, hR), P(i, a, 0), P(j, b, 0), P(j, b, hR), colRiel, 19); geoQuad(G, P(i, a + t, -esp), P(i, a + t, hR), P(j, b + t, hR), P(j, b + t, -esp), colRiel, 19); }
      geoQuad(G, P(i, a, hR), P(i, a + t, hR), P(j, b + t, hR), P(j, b, hR), colCanto, 2);
      // franjitas blancas cada tanto
      if (i % 6 < 3) { const z = 0.003 * -lado; geoQuad(G, lado < 0 ? P(i, a + z, 0.08) : P(i, a + z, 0.16), lado < 0 ? P(i, a + z, 0.16) : P(i, a + z, 0.08), lado < 0 ? P(j, b + z, 0.16) : P(j, b + z, 0.08), lado < 0 ? P(j, b + z, 0.08) : P(j, b + z, 0.16), blanco, 19); }
    }
    // almohadilla de turbo (encima, apenas levantada)
    if ((fi & F_TURBO) && i % 10 < 6) { const h = 0.012, aw = Math.min(1.3, wi * 0.45); geoQuad(G, P(i, -aw, h), P(i, aw, h), P(j, aw, h), P(j, -aw, h), blanco, 21, [[0, s0], [1, s0], [1, s1], [0, s1]]); }
  }
  // la línea de largada: cuatro filas de cuadros blancos y negros
  {
    const wi = C.w[0] / 2, n = 10;
    for (let c = 0; c < n; c++) for (let r = 0; r < 4; r++) {
      const d0 = -wi + c * (2 * wi / n), d1 = d0 + 2 * wi / n, col = (c + r) % 2 ? cc('#1b1a2e') : blanco, f0 = -0.5 + r * 0.25;
      const q = (dd, ff) => { const A = P(0, dd, 0.008); return [A[0] + C.tx[0] * ff, A[1] + C.ty[0] * ff, A[2] + C.tz[0] * ff]; };
      geoQuad(G, q(d0, f0), q(d1, f0), q(d1, f0 + 0.25), q(d0, f0 + 0.25), col, 0);
    }
  }
  // arco de largada: dos postes y un cartel a cuadros
  const wi0 = C.w[0] / 2 + 0.4;
  for (const lado of [-1, 1]) { const A = P(0, lado * wi0, 0); geoCilindro(G, A[0], A[1] - 0.1, A[2], 0.08, 3.2, cc('#e4e7ee'), 2, { nu: 10 }); }
  {
    const A = P(0, -wi0, 3.0), B = P(0, wi0, 3.0), up = [C.ux[0], C.uy[0], C.uz[0]], n = 12;
    for (let c = 0; c < n; c++) for (let r = 0; r < 2; r++) {
      const k0 = c / n, k1 = (c + 1) / n, y0 = r * 0.25, y1 = y0 + 0.25, col = (c + r) % 2 ? cc('#1b1a2e') : blanco;
      const Q = (k, y) => [A[0] + (B[0] - A[0]) * k + up[0] * y, A[1] + (B[1] - A[1]) * k + up[1] * y, A[2] + (B[2] - A[2]) * k + up[2] * y];
      geoQuad(G, Q(k0, y0), Q(k1, y0), Q(k1, y1), Q(k0, y1), col, 0); geoQuad(G, Q(k1, y0), Q(k0, y0), Q(k0, y1), Q(k1, y1), col, 0);
    }
  }
  // columnitas donde la pista va alta (menos arriba de muebles)
  const sinCol = op.sinColumnas || [];
  for (let i = 0; i < N; i += 10) {
    if (C.f[i] & F_HUECO) continue;
    if (sinCol.some(r => C.px[i] > r[0] && C.px[i] < r[2] && C.pz[i] > r[1] && C.pz[i] < r[3])) continue;
    for (const lado of [-0.6, 0.6]) {
      const A = P(i, lado * C.w[i] / 2, -esp);
      if (A[1] - (op.suelo || 0) < 0.3) continue;
      if (op.columna === 'libros') { let y = op.suelo || 0; const rr = rngSemilla(i * 7 + (lado > 0 ? 1 : 0)); while (y < A[1] - 0.05) { const hh = Math.min(A[1] - y, 0.35 + rr() * 0.3); conT(lugar(A[0], y, A[2], rr() * 0.6), () => geoCaja(G, -0.55, 0, -0.4, 0.55, hh, 0.4, cc(['#d8352a', '#1f4fa8', '#3fae4f', '#f2b632', '#8a5a3a'][Math.floor(rr() * 5)]), 15)); y += hh; } }
      else geoCilindro(G, A[0], op.suelo || 0, A[2], 0.09, A[1] - (op.suelo || 0), cc(op.colColumna || '#c4c9d2'), op.columna === 'madera' ? 4 : 2, { nu: 8 });
    }
  }
  return G;
}
// el mapita de la pista (para el HUD): puntos normalizados
function mapaPista(C) {
  let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9;
  for (let i = 0; i < C.N; i++) { x0 = Math.min(x0, C.px[i]); x1 = Math.max(x1, C.px[i]); z0 = Math.min(z0, C.pz[i]); z1 = Math.max(z1, C.pz[i]); }
  const esc = 1 / Math.max(x1 - x0, z1 - z0), pts = [];
  for (let i = 0; i < C.N; i += 4) pts.push([(C.px[i] - (x0 + x1) / 2) * esc, (C.pz[i] - (z0 + z1) / 2) * esc]);
  return { pts, x0, z0, x1, z1, esc, cx: (x0 + x1) / 2, cz: (z0 + z1) / 2 };
}
