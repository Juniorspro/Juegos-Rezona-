// POTRERO — geometría a mano: el armador de mallas (también para las canchas), los pibes con 13 huesos y
// cara pintada (10 gestos × 3 estilos), peinados, camisetas con número, la pelota de gajos, y las poses.
// ---------- armador de mallas ----------
function nuevaGeo(conHueso) { return { p: [], n: [], c: [], t: [], b: [], conHueso: !!conHueso }; }
let GEO_T = null;   // transformación opcional al agregar vértices: (x,y,z) → [x,y,z] y normal
function geoV(G, x, y, z, nx, ny, nz, col, flag, u, v, hueso) {
  if (GEO_T) { const q = GEO_T(x, y, z, nx, ny, nz); x = q[0]; y = q[1]; z = q[2]; nx = q[3]; ny = q[4]; nz = q[5]; }
  G.p.push(x, y, z); const l = Math.hypot(nx, ny, nz) || 1; G.n.push(nx / l, ny / l, nz / l);
  G.c.push(col[0], col[1], col[2], flag || 0); G.t.push(u || 0, v || 0); if (G.conHueso) G.b.push(hueso || 0);
}
function geoEmpacar(G) {
  const nv = G.p.length / 3, paso = G.conHueso ? 32 : 28, buf = new ArrayBuffer(nv * paso), f = new Float32Array(buf), i8 = new Int8Array(buf), u8 = new Uint8Array(buf);
  for (let i = 0; i < nv; i++) {
    const o = i * paso;
    f[o / 4] = G.p[i * 3]; f[o / 4 + 1] = G.p[i * 3 + 1]; f[o / 4 + 2] = G.p[i * 3 + 2];
    i8[o + 12] = Math.round(G.n[i * 3] * 127); i8[o + 13] = Math.round(G.n[i * 3 + 1] * 127); i8[o + 14] = Math.round(G.n[i * 3 + 2] * 127); i8[o + 15] = 0;
    u8[o + 16] = G.c[i * 4]; u8[o + 17] = G.c[i * 4 + 1]; u8[o + 18] = G.c[i * 4 + 2]; u8[o + 19] = G.c[i * 4 + 3];
    f[o / 4 + 5] = G.t[i * 2]; f[o / 4 + 6] = G.t[i * 2 + 1];
    if (G.conHueso) u8[o + 28] = G.b[i];
  }
  const fmt = [{ k: 3, t: gl.FLOAT }, { k: 4, t: gl.BYTE, norm: true }, { k: 4, t: gl.UNSIGNED_BYTE, norm: true }, { k: 2, t: gl.FLOAT }];
  if (G.conHueso) fmt.push({ k: 1, t: gl.UNSIGNED_BYTE, entero: true });
  const m = GL.malla(new Uint8Array(buf), fmt.map(x => Object.assign({}, x)));
  // el último atributo ocupa 4 bytes (1 + relleno): el paso se corrige a mano
  if (G.conHueso) { gl.bindVertexArray(m.vao); gl.bindBuffer(gl.ARRAY_BUFFER, m.vb); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 32, 0); gl.vertexAttribPointer(1, 4, gl.BYTE, true, 32, 12); gl.vertexAttribPointer(2, 4, gl.UNSIGNED_BYTE, true, 32, 16); gl.vertexAttribPointer(3, 2, gl.FLOAT, false, 32, 20); gl.vertexAttribIPointer(4, 1, gl.UNSIGNED_BYTE, 32, 28); gl.bindVertexArray(null); m.n = nv; }
  m.nv = nv;
  return m;
}
// una superficie paramétrica (u de 0 a 1 alrededor, v de 0 a 1 de abajo a arriba) con normales por diferencias
function geoSuperficie(G, fn, nu, nv, col, flag, hueso, uvFn) {
  const P = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) P.push(fn(i / nu, j / nv));
  const N = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
    const a = P[j * (nu + 1) + Math.min(nu, i + 1)], b = P[j * (nu + 1) + Math.max(0, i - 1)], c = P[Math.min(nv, j + 1) * (nu + 1) + i], d = P[Math.max(0, j - 1) * (nu + 1) + i];
    const ux = a[0] - b[0], uy = a[1] - b[1], uz = a[2] - b[2], vx = c[0] - d[0], vy = c[1] - d[1], vz = c[2] - d[2];
    let nx = vy * uz - vz * uy, ny = vz * ux - vx * uz, nz = vx * uy - vy * ux;
    if (Math.hypot(nx, ny, nz) < 1e-9) { const p = P[j * (nu + 1) + i], q = fn(i / nu, j / nv, true); nx = p[0] - q[0]; ny = p[1] - q[1]; nz = p[2] - q[2]; }
    N.push([nx, ny, nz]);
  }
  const vert = (i, j) => { const k = j * (nu + 1) + i, p = P[k], n = N[k], uv = uvFn ? uvFn(p, i / nu, j / nv) : [0, 0]; geoV(G, p[0], p[1], p[2], n[0], n[1], n[2], col, flag, uv[0], uv[1], hueso); };
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { vert(i, j); vert(i + 1, j); vert(i + 1, j + 1); vert(i, j); vert(i + 1, j + 1); vert(i, j + 1); }
}
const sgnPow = (v, e) => Math.sign(v) * Math.pow(Math.abs(v), e);
// elipsoide o "caja redondeada" (e < 1)
function geoElipsoide(G, cx, cy, cz, rx, ry, rz, col, o) {
  o = o || {};
  const e = o.e || 1, nu = o.nu || 14, nv = o.nv || 10;
  const fn = (u, v, adentro) => {
    const th = u * TAU, ph = (v - 0.5) * PI, cp = Math.cos(ph), sp = Math.sin(ph), k = adentro ? 0.5 : 1;
    let x = sgnPow(cp, e) * sgnPow(Math.sin(th), e), y = sgnPow(sp, e), z = sgnPow(cp, e) * sgnPow(Math.cos(th), e);
    if (o.abajo != null && y < o.abajo) y = o.abajo;   // aplanado abajo
    if (o.afina) { const f = o.afina(y); x *= f; z *= f; }
    return [cx + x * rx * k, cy + y * ry * k, cz + z * rz * k];
  };
  geoSuperficie(G, fn, nu, nv, col, o.flag, o.hueso, o.uv);
}
// cápsula entre dos puntos (radios distintos en cada punta)
function geoCapsula(G, a, b, ra, rb, col, o) {
  o = o || {};
  const nu = o.nu || 10, nv = o.nv || 8, dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz) || 1e-6;
  const ex = [dx / L, dy / L, dz / L];
  let up = Math.abs(ex[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  let px = [up[1] * ex[2] - up[2] * ex[1], up[2] * ex[0] - up[0] * ex[2], up[0] * ex[1] - up[1] * ex[0]]; let l = Math.hypot(...px); px = px.map(v => v / l);
  const py = [ex[1] * px[2] - ex[2] * px[1], ex[2] * px[0] - ex[0] * px[2], ex[0] * px[1] - ex[1] * px[0]];
  const fn = (u, v, adentro) => {
    const th = u * TAU, ph = (v - 0.5) * PI;
    // la mitad de abajo es la tapa de "a", la de arriba la de "b", el medio el cuerpo
    let t, r, s;
    if (v < 0.5) { const q = v / 0.5; t = 0; r = ra; s = -Math.cos(q * PI / 2); r *= Math.sin(q * PI / 2); }
    else { const q = (v - 0.5) / 0.5; t = 1; r = rb; s = Math.sin(q * PI / 2); r *= Math.cos(q * PI / 2); }
    const rr = (v < 0.5 ? ra : rb), k = adentro ? 0.3 : 1;
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
const _colC = new Map();
function cc(h) { let c = _colC.get(h); if (!c) { c = hexRgb(h); _colC.set(h, c); } return c; }

// ---------- el esqueleto ----------
const HUESOS = [
  [-1, 0, 0, 0], [0, 0, 0.06, 0], [1, 0, 0.42, 0],
  [1, 0.175, 0.37, 0], [3, 0, -0.21, 0], [1, -0.175, 0.37, 0], [5, 0, -0.21, 0],
  [0, 0.085, -0.03, 0], [7, 0, -0.33, 0], [8, 0, -0.32, 0],
  [0, -0.085, -0.03, 0], [10, 0, -0.33, 0], [11, 0, -0.32, 0],
];
const ALTO_CADERA = 0.74;
const CAMPOS_POSE = ['py', 'pp', 'pr', 'pyaw', 'tp', 'tr', 'ty', 'cp', 'cy', 'cr', 'bIp', 'bIr', 'aI', 'bDp', 'bDr', 'aD', 'mIp', 'mIr', 'rI', 'pI', 'mDp', 'mDr', 'rD', 'pD'];
function poseVacia() { const p = {}; for (const k of CAMPOS_POSE) p[k] = 0; return p; }
function mezclarPose(a, b, k, out) { for (const c of CAMPOS_POSE) out[c] = a[c] + (b[c] - a[c]) * k; return out; }
function sumarPose(a, b, k) { for (const c of CAMPOS_POSE) a[c] += b[c] * k; return a; }
const _pm = M4.nueva();
function posarMuneco(m) {
  const P = m.pose, H = m.huesos, s = m.escala || 1, M = _pm;
  M4.ident(M); M4.mover(M, m.x, m.y, m.z); M4.rotY(M, m.yaw); M4.escalar(M, s, s, s);
  M4.mover(M, 0, ALTO_CADERA + P.py, 0); M4.rotY(M, P.pyaw); M4.rotX(M, P.pp); M4.rotZ(M, P.pr);
  H.set(M, 0);
  const rot = [null, [P.tp, P.ty, P.tr], [P.cp, P.cy, P.cr], [-P.bIp, 0, P.bIr], [-P.aI, 0, 0], [-P.bDp, 0, -P.bDr], [-P.aD, 0, 0],
    [-P.mIp, 0, P.mIr], [P.rI, 0, 0], [P.pI, 0, 0], [-P.mDp, 0, -P.mDr], [P.rD, 0, 0], [P.pD, 0, 0]];
  for (let i = 1; i < 13; i++) {
    const [pa, ox, oy, oz] = HUESOS[i], o = i * 16;
    for (let k = 0; k < 16; k++) M[k] = H[pa * 16 + k];
    M4.mover(M, ox, oy, oz);
    const r = rot[i];
    if (i <= 2) { M4.rotY(M, r[1]); M4.rotX(M, r[0]); M4.rotZ(M, r[2]); }
    else { M4.rotZ(M, r[2]); M4.rotX(M, r[0]); }
    H.set(M, o);
  }
}
// dónde queda un punto de un hueso en el mundo (para pegarle a la pelota con el pie)
function puntoHueso(m, i, x, y, z) { const H = m.huesos, o = i * 16; return [H[o] * x + H[o + 4] * y + H[o + 8] * z + H[o + 12], H[o + 1] * x + H[o + 5] * y + H[o + 9] * z + H[o + 13], H[o + 2] * x + H[o + 6] * y + H[o + 10] * z + H[o + 14]]; }

// ---------- caras: 10 gestos × 3 estilos (fila 4: los números de la espalda) ----------
const GESTOS = { normal: 0, feliz: 1, enojado: 2, sorpresa: 3, triste: 4, decidido: 5, grito: 6, miedo: 7, picaro: 8, cerrados: 9 };
function armarCaras() {
  const C = 128, cv = lienzo(C * 10, C * 4), g = cv.getContext('2d');
  g.lineCap = 'round'; g.lineJoin = 'round';
  const tinta = '#1a1420';
  for (let est = 0; est < 3; est++) for (let ge = 0; ge < 10; ge++) {
    g.save(); g.translate(ge * C, est * C);
    const ojoY = 60, sep = 27, ry = est === 0 ? 18 : est === 1 ? 12 : 10.5, rx = est === 0 ? 14 : 13;
    const ojo = (lado) => {
      const x = 64 + lado * sep;
      if (ge === 9 || (ge === 1 && est !== 2) || (ge === 6 && est !== 0)) {   // cerrados o riendo: arcos
        g.strokeStyle = tinta; g.lineWidth = 5; g.beginPath();
        if (ge === 6) { g.moveTo(x - 10, ojoY - 6); g.lineTo(x + 2 * lado * -1 + 0, ojoY + 1); g.lineTo(x - 10, ojoY + 7); if (lado < 0) { g.moveTo(x + 10, ojoY - 6); g.lineTo(x, ojoY + 1); g.lineTo(x + 10, ojoY + 7); } }
        else g.arc(x, ojoY + 6, 10, PI * 1.15, PI * 1.85);
        g.stroke(); return;
      }
      if (ge === 6 && est === 0) { g.strokeStyle = tinta; g.lineWidth = 5; g.beginPath(); g.moveTo(x - 9 * lado, ojoY - 8); g.lineTo(x + 6 * lado, ojoY); g.lineTo(x - 9 * lado, ojoY + 8); g.stroke(); return; }
      const r2 = ge === 3 ? ry * 1.15 : ge === 2 || ge === 5 ? ry * 0.82 : ry;
      g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(x, ojoY, rx, r2, 0, 0, TAU); g.fill();
      // pupila
      const pr = ge === 3 || ge === 7 ? 4.2 : est === 0 ? 9.2 : 7.2, px = x - lado * (ge === 8 ? -3 : 1.5) + (ge === 8 ? 3 : 0), py = ojoY + (ge === 4 ? 3 : 1.5);
      g.fillStyle = est === 2 ? '#3a2a1c' : '#2a1c14'; g.beginPath(); g.ellipse(px, py, pr, pr * (est === 0 ? 1.2 : 1), 0, 0, TAU); g.fill();
      g.fillStyle = '#ffffff'; g.beginPath(); g.arc(px - 2.5, py - 3.5, Math.max(1.4, pr * 0.32), 0, TAU); g.fill();
      g.strokeStyle = tinta; g.lineWidth = 4.6; g.beginPath(); g.ellipse(x, ojoY, rx, r2, 0, 0, TAU); g.stroke();
      // párpado: estilo B mira con desgano; enojado y decidido, tapado arriba
      if (est === 1 || ge === 2 || ge === 5 || ge === 8) {
        g.fillStyle = tinta; g.beginPath(); const pp = ge === 2 || ge === 5 ? 0.45 : est === 1 ? 0.3 : 0.25;
        g.moveTo(x - rx - 2, ojoY - r2 - 2); g.lineTo(x + rx + 2, ojoY - r2 - 2); g.lineTo(x + rx + 2, ojoY - r2 + r2 * 2 * pp * (lado > 0 ? (ge === 2 || ge === 5 ? 0.6 : 1) : (ge === 2 || ge === 5 ? 1.4 : 1))); g.lineTo(x - rx - 2, ojoY - r2 + r2 * 2 * pp * (lado < 0 ? (ge === 2 || ge === 5 ? 0.6 : 1) : (ge === 2 || ge === 5 ? 1.4 : 1))); g.closePath();
        g.save(); g.beginPath(); g.ellipse(x, ojoY, rx + 1.5, r2 + 1.5, 0, 0, TAU); g.clip();
        g.beginPath(); g.moveTo(x - rx - 3, ojoY - r2 - 3); g.lineTo(x + rx + 3, ojoY - r2 - 3);
        const a1 = ojoY - r2 + r2 * 2 * pp * (ge === 2 || ge === 5 ? (lado > 0 ? 1.4 : 0.6) : 1), a0 = ojoY - r2 + r2 * 2 * pp * (ge === 2 || ge === 5 ? (lado > 0 ? 0.6 : 1.4) : 1);
        g.lineTo(x + rx + 3, a1); g.lineTo(x - rx - 3, a0); g.closePath(); g.fillStyle = '#d99a78'; g.globalAlpha = 0.0; g.fill(); g.globalAlpha = 1;
        g.strokeStyle = tinta; g.lineWidth = 3.4; g.beginPath(); g.moveTo(x - rx - 1, a0); g.lineTo(x + rx + 1, a1); g.stroke();
        g.restore();
      }
      if (est === 0 && ge !== 2) { g.strokeStyle = tinta; g.lineWidth = 2.6; g.beginPath(); g.moveTo(x + lado * rx * 0.7, ojoY - r2 * 0.75); g.lineTo(x + lado * (rx + 4), ojoY - r2 - 1); g.stroke(); }
    };
    ojo(-1); ojo(1);
    // cejas
    const cejaY = ojoY - (est === 0 ? 27 : 20), cg = est === 2 ? 7.5 : 5.6;
    g.strokeStyle = est === 2 ? '#5a4a40' : tinta; g.lineWidth = cg;
    for (const lado of [-1, 1]) {
      const x = 64 + lado * sep;
      let ai = 0, ae = 0;
      if (ge === 2 || ge === 5 || ge === 6) { ai = 7; ae = -4; }
      else if (ge === 4 || ge === 7) { ai = -6; ae = 4; }
      else if (ge === 3) { ai = -6; ae = -6; }
      else if (ge === 8 && lado > 0) { ai = -6; ae = -8; }
      g.beginPath(); g.moveTo(x - lado * 3, cejaY + ai); g.quadraticCurveTo(x + lado * 6, cejaY - 4 + (ai + ae) / 2, x + lado * 14, cejaY + ae); g.stroke();
    }
    // nariz y cachetes
    g.strokeStyle = tinta; g.lineWidth = 2.6; g.beginPath(); g.moveTo(66, 74); g.quadraticCurveTo(70, 80, 64, 81); g.stroke();
    if (ge === 1 || ge === 6 || ge === 9 || ge === 8) { g.fillStyle = 'rgba(240,110,110,0.45)'; for (const lado of [-1, 1]) { g.beginPath(); g.ellipse(64 + lado * 33, 78, 8, 4.5, 0, 0, TAU); g.fill(); } }
    // bigote del estilo C
    if (est === 2) { g.fillStyle = '#4a3a30'; g.beginPath(); g.moveTo(64, 84); g.bezierCurveTo(52, 80, 38, 84, 34, 94); g.bezierCurveTo(44, 90, 54, 92, 64, 89); g.bezierCurveTo(74, 92, 84, 90, 94, 94); g.bezierCurveTo(90, 84, 76, 80, 64, 84); g.fill(); }
    // boca
    const by = est === 2 ? 99 : 94;
    g.strokeStyle = tinta; g.lineWidth = 4.4; g.fillStyle = '#7a1f28';
    g.beginPath();
    if (ge === 0) { g.moveTo(54, by); g.quadraticCurveTo(64, by + 6, 74, by - 1); g.stroke(); }
    else if (ge === 1 || ge === 9) { g.moveTo(48, by - 3); g.quadraticCurveTo(64, by + 18, 80, by - 3); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#ffffff'; g.fillRect(52, by - 3, 24, 3); g.fillStyle = '#e8707a'; g.beginPath(); g.ellipse(64, by + 7, 7, 3, 0, 0, TAU); g.fill(); }
    else if (ge === 2) { g.moveTo(52, by + 4); g.quadraticCurveTo(64, by - 5, 76, by + 4); g.stroke(); }
    else if (ge === 3) { g.ellipse(64, by + 2, 6, 8, 0, 0, TAU); g.fill(); g.stroke(); }
    else if (ge === 4) { g.moveTo(54, by + 5); g.quadraticCurveTo(64, by - 3, 74, by + 5); g.stroke(); g.fillStyle = '#7ac8f0'; g.beginPath(); g.ellipse(64 - sep - 4, ojoY + 18, 3, 6, 0, 0, TAU); g.fill(); }
    else if (ge === 5) { g.fillStyle = '#ffffff'; g.fillRect(52, by - 4, 24, 9); g.strokeRect(52, by - 4, 24, 9); g.beginPath(); g.moveTo(52, by); g.lineTo(76, by); g.stroke(); }
    else if (ge === 6) { g.ellipse(64, by + 5, 15, 13, 0, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#e8707a'; g.beginPath(); g.ellipse(64, by + 11, 9, 5, 0, 0, TAU); g.fill(); g.fillStyle = '#ffffff'; g.fillRect(53, by - 7, 22, 4); }
    else if (ge === 7) { g.moveTo(52, by + 2); for (let k = 0; k <= 6; k++) g.lineTo(52 + k * 4, by + 2 + (k % 2 ? -3 : 3)); g.stroke(); g.fillStyle = '#9ad8f8'; g.beginPath(); g.ellipse(98, 40, 4, 7, 0.3, 0, TAU); g.fill(); }
    else if (ge === 8) { g.moveTo(52, by + 2); g.quadraticCurveTo(66, by + 6, 78, by - 5); g.stroke(); }
    g.restore();
  }
  // los números (sólo importa la forma)
  for (let d = 0; d < 10; d++) {
    g.save(); g.translate(d * C, 3 * C);
    const { p } = caminoLetras(String(d), 9.2, false, 1);
    g.translate(64 - anchoLetras(String(d)) * 9.2 / 2, 18);
    g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = '#ffffff'; g.lineWidth = 17; g.stroke(p);
    g.restore();
  }
  return cv;
}

// ---------- los pibes ----------
// f: {piel, pelo, peinado, estilo (0 A, 1 B, 2 C), altura, ancho, panza, camiseta, short, medias, botines, guantes, numero, extras}
function armarFigura(f) {
  const G = nuevaGeo(true), piel = cc(f.piel), cam = cc(f.camiseta || '#e04a3a'), sho = cc(f.short || '#1a1a2a'), med = cc(f.medias || '#ffffff'), bot = cc(f.botines || '#222222'), pel = cc(f.pelo || '#2a1a10');
  const an = f.ancho || 1, pz = f.panza || 0, fcam = f.camisetaFlag != null ? f.camisetaFlag : 3;
  // pelvis y short
  geoElipsoide(G, 0, -0.02, 0, 0.15 * an + pz * 0.03, 0.1, 0.1 + pz * 0.04, sho, { e: 0.55, hueso: 0, nu: 12, nv: 8 });
  // torso (camiseta) y panza
  geoElipsoide(G, 0, 0.2, 0, (0.17 + pz * 0.05) * an, 0.225, 0.105 + pz * 0.06, cam, { e: 0.62, hueso: 1, flag: fcam, nu: 16, nv: 12, afina: y => pz > 0.3 ? 1 - Math.max(0, y - 0.4) * 0.25 : 0.84 + 0.16 * clamp((y + 0.6) / 1.2, 0, 1) - Math.max(0, y - 0.7) * 0.5 });
  geoElipsoide(G, 0, 0.42, 0, 0.065, 0.05, 0.055, piel, { hueso: 1, nu: 8, nv: 6 });   // cuello
  if (f.saco) geoElipsoide(G, 0, 0.36, 0.085 + pz * 0.05, 0.05, 0.08, 0.02, cc(f.saco), { hueso: 1, nu: 8, nv: 6 });   // corbata
  // número en la espalda
  if (f.numero != null) {
    const s = String(f.numero), n = s.length, ancho = 0.11 * n, y0 = 0.08, y1 = 0.3, z = -0.112 - pz * 0.06;
    for (let i = 0; i < n; i++) {
      const d = +s[i], x0 = ancho / 2 - i * 0.11, x1 = x0 - 0.11, u0 = d * 0.1 + 0.012, u1 = u0 + 0.076;
      geoQuad(G, [x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], cam, 2, [[u0, 1], [u1, 1], [u1, 0.75], [u0, 0.75]], 1);
    }
  }
  // cabeza con cara
  const rc = 0.165;
  geoElipsoide(G, 0, 0.16, 0.01, rc, rc * 1.02, rc * 0.98, piel, {
    hueso: 2, flag: 1, nu: 18, nv: 14, abajo: -0.9,
    uv: (p) => { const x = p[0], y = p[1] - 0.16, z = p[2] - 0.01; if (z > -0.02) return [0.5 + x / (rc * 1.9), 0.5 - (y - rc * 0.08) / (rc * 1.9)]; return [0.5 + Math.sign(x) * (0.56 + (-z / rc) * 0.5), 0.5 - (y - rc * 0.08) / (rc * 1.9)]; },
  });
  // orejas
  for (const s of [-1, 1]) geoElipsoide(G, s * rc * 0.98, 0.15, 0.0, 0.03, 0.045, 0.025, piel, { hueso: 2, nu: 8, nv: 6 });
  peinado(G, f.peinado || 'corto', pel, rc, f);
  // brazos: manga, brazo, antebrazo, mano (o guante)
  for (const s of [1, -1]) {
    const hb = s > 0 ? 3 : 5, ha = s > 0 ? 4 : 6;
    geoCapsula(G, [0, 0.02, 0], [0, -0.1, 0], 0.062, 0.056, f.mangaLarga ? cam : cam, { hueso: hb, flag: fcam === 3 ? 0 : fcam });
    geoCapsula(G, [0, -0.08, 0], [0, -0.2, 0], 0.045, 0.04, f.mangaLarga ? cam : piel, { hueso: hb });
    geoCapsula(G, [0, 0, 0], [0, -0.17, 0], 0.04, 0.035, f.mangaLarga ? cam : piel, { hueso: ha });
    geoElipsoide(G, 0, -0.21, 0.005, f.guantes ? 0.055 : 0.042, f.guantes ? 0.06 : 0.048, f.guantes ? 0.04 : 0.035, f.guantes ? cc(f.guantes) : piel, { hueso: ha, nu: 10, nv: 8 });
  }
  // piernas: muslo, short encima, media, botín
  for (const s of [1, -1]) {
    const hm = s > 0 ? 7 : 10, hp = s > 0 ? 8 : 11, hf = s > 0 ? 9 : 12;
    geoCapsula(G, [0, 0.0, 0], [0, -0.3, 0], 0.07 + pz * 0.012, 0.055, f.pantalon ? sho : piel, { hueso: hm });
    geoCapsula(G, [0, 0.01, 0], [0, -0.13, 0], 0.085 + pz * 0.012, 0.08, sho, { hueso: hm });
    geoCapsula(G, [0, -0.02, 0], [0, -0.3, 0], 0.052, 0.04, f.pantalon ? sho : med, { hueso: hp });
    geoElipsoide(G, 0, -0.025, 0.045, 0.05, 0.04, 0.1, bot, { e: 0.6, hueso: hf, flag: 6, nu: 10, nv: 8, abajo: -0.75 });
  }
  return { malla: geoEmpacar(G), datos: f };
}
function peinado(G, tipo, col, rc, f) {
  const E = (x, y, z, rx, ry, rz, o) => geoElipsoide(G, x * rc, 0.16 + y * rc, 0.01 + z * rc, rx * rc, ry * rc, rz * rc, col, Object.assign({ hueso: 2, flag: 4, nu: 14, nv: 10 }, o || {}));
  const casco = (sube, atras) => E(0, 0.12 + sube, -0.1 - atras, 1.07, 0.95, 1.04, { abajo: -0.25 });
  switch (tipo) {
    case 'corto': casco(0, 0); E(0, 0.62, 0.62, 0.62, 0.3, 0.42); break;
    case 'flequillo': casco(0, 0); E(0, 0.55, 0.68, 0.85, 0.32, 0.4); break;
    case 'parado': casco(0, 0); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; E(Math.sin(a) * 0.45, 0.95, Math.cos(a) * 0.4 - 0.05, 0.28, 0.42, 0.28, { nu: 8, nv: 6 }); } break;
    case 'rapado': E(0, 0.08, -0.06, 1.03, 0.96, 1.02, { abajo: -0.1 }); break;
    case 'colita': casco(0.02, 0); E(0, 0.6, 0.6, 0.75, 0.3, 0.4); E(0, 0.45, -1.15, 0.35, 0.35, 0.35); E(0, -0.15, -1.35, 0.3, 0.7, 0.3); if (f && f.vincha) geoCapsula(G, [-rc * 1.02, 0.16 + rc * 0.35, 0.01], [rc * 1.02, 0.16 + rc * 0.35, 0.01], rc * 0.12, rc * 0.12, cc(f.vincha), { hueso: 2 }); break;
    case 'trenzas': casco(0.02, 0); E(0, 0.6, 0.6, 0.75, 0.3, 0.4); for (const s of [-1, 1]) { E(s * 0.95, -0.25, -0.35, 0.25, 0.35, 0.25); E(s * 1.0, -0.75, -0.25, 0.22, 0.32, 0.22); E(s * 1.0, -1.15, -0.2, 0.2, 0.25, 0.2); } break;
    case 'rodetes': casco(0.02, 0); E(0, 0.62, 0.6, 0.72, 0.3, 0.4); for (const s of [-1, 1]) E(s * 0.7, 0.95, -0.25, 0.42, 0.42, 0.42); break;
    case 'rulos': for (let i = 0; i < 22; i++) { const a = i * 2.4, h = (i % 5) / 5; const y = 0.15 + h * 0.85, r = Math.sqrt(1 - Math.min(0.95, (y - 0.1) * (y - 0.1))) * 1.0; const z = Math.cos(a) * r * 1.05 - 0.12; if (z > 0.55 && y < 0.6) continue; E(Math.sin(a) * r * 1.05, y, z, 0.36, 0.36, 0.36, { nu: 8, nv: 6 }); } E(0, 0.3, -0.15, 1.05, 0.9, 1.0, { abajo: -0.3 }); break;
    case 'largo': casco(0.02, 0); E(0, 0.6, 0.6, 0.75, 0.3, 0.4); E(0, -0.45, -0.5, 1.02, 1.05, 0.6); break;
    case 'peinadoAtras': E(0, 0.18, -0.12, 1.06, 0.92, 1.05, { abajo: -0.2 }); E(0, 0.72, 0.25, 0.85, 0.38, 0.75); break;
    case 'pelado': for (const s of [-1, 1]) E(s * 0.88, 0.05, -0.3, 0.3, 0.42, 0.62); E(0, 0.12, -0.92, 0.75, 0.42, 0.25); break;
    case 'gorra': { const g2 = cc(f && f.gorra || '#2a5ab8'); geoElipsoide(G, 0, 0.16 + rc * 0.28, 0.0, rc * 1.08, rc * 0.8, rc * 1.06, g2, { hueso: 2, abajo: 0, nu: 14, nv: 8 }); geoElipsoide(G, 0, 0.16 + rc * 0.3, 0.01 + rc * (f && f.gorraAtras ? -1.2 : 1.2), rc * 0.75, rc * 0.08, rc * 0.55, g2, { hueso: 2, e: 0.7, nu: 10, nv: 6 }); E(0, -0.2, -0.75, 0.85, 0.5, 0.4); break; }
  }
}
// la pelota: icosaedro subdividido, gajos negros en los 12 vértices originales
function armarPelota() {
  const t = (1 + Math.sqrt(5)) / 2;
  let V = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(v => { const l = Math.hypot(...v); return v.map(x => x / l); });
  const ori = V.slice();
  let F = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
  for (let s = 0; s < 2; s++) {
    const cache = new Map(), mid = (a, b) => { const k = a < b ? a + '_' + b : b + '_' + a; if (cache.has(k)) return cache.get(k); const p = V[a].map((x, i) => (x + V[b][i]) / 2), l = Math.hypot(...p); V.push(p.map(x => x / l)); cache.set(k, V.length - 1); return V.length - 1; };
    const F2 = []; for (const [a, b, c] of F) { const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a); F2.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]); } F = F2;
  }
  const G = nuevaGeo(true), r = 0.125, blanco = cc('#f8f6f0'), negro = cc('#1e1a26');
  for (const f of F) {
    const cx = (V[f[0]][0] + V[f[1]][0] + V[f[2]][0]) / 3, cy = (V[f[0]][1] + V[f[1]][1] + V[f[2]][1]) / 3, cz = (V[f[0]][2] + V[f[1]][2] + V[f[2]][2]) / 3, l = Math.hypot(cx, cy, cz);
    let neg = false; for (const o of ori) if ((cx * o[0] + cy * o[1] + cz * o[2]) / l > 0.93) neg = true;
    for (const i of f) { const v = V[i]; geoV(G, v[0] * r, v[1] * r, v[2] * r, v[0], v[1], v[2], neg ? negro : blanco, 7, 0, 0, 0); }
  }
  return { malla: geoEmpacar(G), datos: { pelota: true } };
}
let ID_MUN = 1;
function nuevoMuneco(fig, x, z, yaw, escala) {
  return { fig, x: x || 0, y: 0, z: z || 0, yaw: yaw || 0, escala: escala || (fig.datos.altura || 1), pose: poseVacia(), huesos: new Float32Array(13 * 16), cara: 0, estiloCara: fig.datos.estilo || 0, kit: fig.kit || null, id: (ID_MUN++ % 200) + 20, tinte: null, parpadeo: rnd(1, 4) };
}

// ---------- poses y animaciones ----------
const _P = poseVacia(), _Q = poseVacia();
function pQuieto(p, t, k) {
  const r = Math.sin(t * 2.2);
  p.py = -0.01 + r * 0.006; p.tp = 0.04 + r * 0.01; p.bIr = 0.2; p.bDr = 0.2; p.aI = 0.42; p.aD = 0.42; p.cr = r * 0.02; p.mIr = 0.05; p.mDr = 0.05; p.cp = -0.02;
  p.bIp = 0.05 + r * 0.02; p.bDp = 0.05 - r * 0.02;
  return p;
}
function pCorrer(p, fase, v) {
  // v: 0 trote suave … 1 pique; fase en vueltas
  const w = fase * TAU, A = 0.45 + v * 0.45, s = Math.sin(w), c = Math.cos(w);
  p.mIp = A * s; p.mDp = -A * s;
  p.rI = 0.15 + (0.75 + v * 0.7) * Math.max(0, c); p.rD = 0.15 + (0.75 + v * 0.7) * Math.max(0, -c);
  p.pI = -0.25 * Math.max(0, -s) + 0.2 * Math.max(0, s); p.pD = -0.25 * Math.max(0, s) + 0.2 * Math.max(0, -s);
  p.py = -0.02 - 0.035 * Math.abs(c) * (0.6 + v) + 0.02;
  p.tp = 0.12 + v * 0.22; p.ty = 0.12 * s; p.pyaw = -0.08 * s;
  p.bIp = -A * 0.9 * s; p.bDp = A * 0.9 * s; p.aI = 1.1 + 0.2 * v; p.aD = 1.1 + 0.2 * v; p.bIr = 0.1; p.bDr = 0.1;
  p.cp = -0.08 - v * 0.12;
  return p;
}
// patada: k de 0 a 1; pie 1 derecho, -1 izquierdo; fuerza 0 pase … 1 tiro
function pPatear(p, k, pie, fuerza) {
  const der = pie > 0, ar = clamp(k / 0.42, 0, 1), gol = clamp((k - 0.42) / 0.14, 0, 1), sig = clamp((k - 0.56) / 0.44, 0, 1);
  const atras = -0.55 - 0.45 * fuerza, adel = 0.9 + 0.6 * fuerza;
  let muslo = lerp(0, atras, suave(ar)); if (gol > 0) muslo = lerp(atras, adel, salida(gol)); if (sig > 0) muslo = lerp(adel, 0.15, suave(sig));
  let rodilla = lerp(0.2, 1.5 + 0.4 * fuerza, suave(ar)); if (gol > 0) rodilla = lerp(1.5 + 0.4 * fuerza, 0.05, salida(gol)); if (sig > 0) rodilla = lerp(0.05, 0.3, sig);
  if (der) { p.mDp = muslo; p.rD = rodilla; p.mIp = -0.1; p.rI = 0.35; p.pD = 0.3 * gol; }
  else { p.mIp = muslo; p.rI = rodilla; p.mDp = -0.1; p.rD = 0.35; p.pI = 0.3 * gol; }
  const brazo = 0.4 + 0.7 * fuerza;
  p.bIr = brazo; p.bDr = brazo; p.bIp = der ? 0.5 : -0.3; p.bDp = der ? -0.3 : 0.5; p.aI = 0.6; p.aD = 0.6;
  p.tp = lerp(0.1, fuerza > 0.5 ? -0.12 : 0.15, gol); p.ty = (der ? 1 : -1) * lerp(0.25, -0.3, gol) * (0.5 + fuerza * 0.5);
  p.py = -0.03 - 0.03 * fuerza; p.cp = 0.25;
  return p;
}
function pCabezazo(p, k) {
  const a = Math.sin(clamp(k, 0, 1) * PI);
  p.tp = lerp(-0.45, 0.5, clamp((k - 0.3) / 0.3, 0, 1)); p.cp = lerp(-0.4, 0.5, clamp((k - 0.35) / 0.25, 0, 1));
  p.bIp = 0.6; p.bDp = 0.6; p.bIr = 0.9; p.bDr = 0.9; p.aI = 0.8; p.aD = 0.8;
  p.mIp = 0.3 * a; p.mDp = -0.2 * a; p.rI = 0.9 * a; p.rD = 0.6 * a;
  return p;
}
function pBarrida(p, k, pie) {
  const e = clamp(k / 0.18, 0, 1), sale = clamp((k - 0.75) / 0.25, 0, 1), b = suave(e) * (1 - suave(sale));
  const der = pie > 0;
  p.py = -0.46 * b; p.pp = -0.35 * b; p.tp = -0.25 * b;
  if (der) { p.mDp = 1.45 * b; p.rD = 0.05; p.mIp = 0.4 * b; p.rI = 1.9 * b; p.mIr = 0.4 * b; }
  else { p.mIp = 1.45 * b; p.rI = 0.05; p.mDp = 0.4 * b; p.rD = 1.9 * b; p.mDr = 0.4 * b; }
  p.bIp = -0.5 * b; p.bDp = -0.5 * b; p.bIr = 0.6 * b; p.bDr = 0.6 * b; p.aI = 0.4; p.aD = 0.4; p.cp = 0.2 * b;
  return p;
}
function pCaido(p, k) {
  const a = suave(clamp(k / 0.35, 0, 1)), sube = suave(clamp((k - 0.7) / 0.3, 0, 1)), b = a * (1 - sube);
  p.py = -0.62 * b; p.pp = 1.25 * b; p.tp = 0.2 * b; p.bIp = 2.2 * b; p.bDp = 2.0 * b; p.bIr = 0.5 * b; p.bDr = 0.5 * b;
  p.mIp = -0.2 * b; p.mDp = 0.1 * b; p.rI = 0.4 * b; p.rD = 0.8 * b; p.cp = -0.6 * b;
  return p;
}
function pArquero(p, t) {
  const r = Math.sin(t * 6) * 0.02;
  p.py = -0.1 + r; p.tp = 0.32; p.cp = -0.25; p.mIp = 0.45; p.mDp = 0.45; p.rI = 0.8; p.rD = 0.8; p.pI = -0.3; p.pD = -0.3; p.mIr = 0.18; p.mDr = 0.18;
  p.bIp = 0.7; p.bDp = 0.7; p.bIr = 0.55; p.bDr = 0.55; p.aI = 0.9; p.aD = 0.9;
  return p;
}
// estirada del arquero: lado 1 a su izquierda, -1 a su derecha; alto 0 abajo … 1 arriba
function pEstirada(p, k, lado, alto) {
  const v = suave(clamp(k / 0.3, 0, 1)), cae = clamp((k - 0.55) / 0.3, 0, 1);
  p.pr = -lado * (1.0 + 0.4 * (1 - alto)) * v; p.py = lerp(-0.1, -0.25 - 0.3 * cae, v);
  p.bIp = 2.7 * v; p.bDp = 2.7 * v; p.bIr = lado > 0 ? 0.9 * v : 0.2 * v; p.bDr = lado < 0 ? 0.9 * v : 0.2 * v; p.aI = 0.2; p.aD = 0.2;
  p.mIp = 0.2; p.mDp = 0.2; p.rI = 0.5; p.rD = 0.5; p.mIr = lado > 0 ? 0.3 : 0; p.mDr = lado < 0 ? 0.3 : 0; p.tr = -lado * 0.2 * v; p.cp = -0.2;
  return p;
}
function pAtajar(p, k) { p.py = -0.12; p.tp = 0.35; p.bIp = 1.1; p.bDp = 1.1; p.bIr = 0.1; p.bDr = 0.1; p.aI = 1.4; p.aD = 1.4; p.mIp = 0.35; p.mDp = 0.35; p.rI = 0.7; p.rD = 0.7; p.cp = 0.2; return p; }
function pSaque(p, k) { const a = clamp(k, 0, 1); p.bIp = lerp(3.0, 1.2, a); p.bDp = lerp(3.0, 1.2, a); p.aI = lerp(1.6, 0.1, a); p.aD = lerp(1.6, 0.1, a); p.tp = lerp(-0.3, 0.3, a); p.mIp = 0.5; p.rI = 0.4; p.mDp = -0.3; return p; }
function pFestejo(p, t, tipo) {
  if (tipo === 'avion') { p.bIr = 1.45; p.bDr = 1.45; p.aI = 0.1; p.aD = 0.1; p.tr = Math.sin(t * 3) * 0.3; p.tp = 0.2; p.cp = -0.2; return p; }
  if (tipo === 'rodillas') { p.py = -0.36; p.mIp = 0.15; p.mDp = 0.15; p.rI = 1.75; p.rD = 1.75; p.pI = 0.6; p.pD = 0.6; p.tp = -0.45; p.cp = -0.5; p.bIp = 2.4; p.bDp = 2.4; p.bIr = 0.7; p.bDr = 0.7; return p; }
  if (tipo === 'puno') { const a = Math.max(0, Math.sin(t * 9)); p.bDp = 0.6 + a * 1.8; p.aD = 2.0 - a * 0.6; p.bIr = 0.3; p.tp = 0.2 * a; p.cp = -0.2; return p; }
  if (tipo === 'senal') { p.bDp = 2.8; p.bDr = 0.2; p.aD = 0.05; p.bIp = 0.2; p.cp = -0.6; p.tp = -0.15; return p; }
  // brazos arriba saltando
  const s = Math.abs(Math.sin(t * 7));
  p.bIp = 2.75; p.bDp = 2.75; p.bIr = 0.45 + s * 0.2; p.bDr = 0.45 + s * 0.2; p.aI = 0.2; p.aD = 0.2; p.cp = -0.45; p.mIp = s * 0.4; p.rI = s * 0.9; p.mDp = s * 0.2; p.rD = s * 0.6;
  return p;
}
// poses de historieta
function pGesto(p, nom, t) {
  pQuieto(p, t, 1);
  const r = Math.sin(t * 3);
  switch (nom) {
    case 'cintura': p.bIr = 0.55; p.bDr = 0.55; p.bIp = -0.35; p.bDp = -0.35; p.aI = 1.7; p.aD = 1.7; p.tp = -0.05; break;
    case 'cruzado': p.bIp = 0.55; p.bDp = 0.62; p.aI = 2.25; p.aD = 2.25; p.bIr = 0.05; p.bDr = 0.05; p.tp = -0.06; p.cp = -0.05; break;
    case 'senala': p.bDp = 1.45; p.bDr = 0.2; p.aD = 0.05; p.tp = 0.05; break;
    case 'senalaArriba': p.bDp = 2.6; p.aD = 0.05; p.cp = -0.4; break;
    case 'piensa': p.bDp = 0.65; p.aD = 2.45; p.bDr = -0.15; p.bIp = 0.3; p.aI = 1.8; p.cp = 0.1; p.cr = 0.15; break;
    case 'saluda': p.bDp = 2.4 + r * 0.15; p.bDr = 0.5 + r * 0.25; p.aD = 0.6; break;
    case 'habla': p.bDp = 0.7 + r * 0.15; p.aD = 1.4; p.bDr = 0.3; p.bIp = 0.2; break;
    case 'puno': p.bDp = 1.4; p.aD = 2.3; p.bDr = 0.1; p.tp = 0.1; p.cp = -0.1; break;
    case 'susto': p.bIp = 1.6; p.bDp = 1.6; p.bIr = 0.8; p.bDr = 0.8; p.aI = 0.8; p.aD = 0.8; p.tp = -0.25; p.cp = -0.2; p.py = -0.03; break;
    case 'llora': p.bIp = 1.1; p.bDp = 1.1; p.aI = 2.4; p.aD = 2.4; p.bIr = -0.05; p.bDr = -0.05; p.tp = 0.25; p.cp = 0.35; break;
    case 'festeja': pFestejo(p, t, 'brazos'); break;
    case 'triste': p.tp = 0.3; p.cp = 0.45; p.bIr = 0.05; p.bDr = 0.05; p.aI = 0.1; p.aD = 0.1; break;
    case 'sentado': p.py = -0.3; p.mIp = 1.45; p.mDp = 1.45; p.rI = 1.45; p.rD = 1.45; p.pI = -0.1; p.pD = -0.1; p.bIp = 0.5; p.bDp = 0.5; p.aI = 0.5; p.aD = 0.5; p.tp = 0.1; break;
    case 'pelota': p.bIp = 0.9; p.bDp = 0.9; p.aI = 0.9; p.aD = 0.9; p.bIr = -0.1; p.bDr = -0.1; break;
    case 'manos': p.bIp = 0.6; p.bDp = 0.6; p.bIr = 0.6; p.bDr = 0.6; p.aI = 1.2; p.aD = 1.2; break;
    case 'arquero': pArquero(p, t); break;
  }
  return p;
}
