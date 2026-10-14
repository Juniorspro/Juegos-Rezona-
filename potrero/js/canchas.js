// POTRERO — las seis canchas armadas con código: el potrero de La Loma, el puerto con charcos, la cancha de la
// vía (pasa el tren), el club de noche con la murga, el campo con viento y el estadio de la final.
// Ejes: el largo va en z (arcos en z = ±L/2), el ancho en x. Nosotros atacamos hacia z negativo.
const MAT = { liso: 0, pasto: 1, tierra: 2, ladrillo: 3, agua: 4, dibujo: 5, hormigon: 6, madera: 7, metal: 8, luz: 9, vidrio: 10, follaje: 11, cal: 13, cartel: 14 };
const ARCO = { ancho: 3.6, alto: 2.0, fondo: 1.0 };
function eCaja(G, x0, y0, z0, x1, y1, z1, col, mat, o) {
  o = o || {};
  const c = typeof col === 'string' ? cc(col) : col, u = o.uv;
  const caras = [
    [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], u ? [[x0, y0], [x1, y0], [x1, y1], [x0, y1]] : null, 'f'],
    [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], u ? [[-x1, y0], [-x0, y0], [-x0, y1], [-x1, y1]] : null, 'b'],
    [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], u ? [[-z1, y0], [-z0, y0], [-z0, y1], [-z1, y1]] : null, 'r'],
    [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], u ? [[z0, y0], [z1, y0], [z1, y1], [z0, y1]] : null, 'l'],
    [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], null, 't'],
    [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], null, 'd'],
  ];
  for (const [a, b, cc2, d, uv, k] of caras) { if (o.sin && o.sin.includes(k)) continue; geoQuad(G, a, b, cc2, d, (o.techo && k === 't') ? cc(o.techo) : c, (o.techo && k === 't') ? (o.matTecho || 0) : mat, uv || undefined); }
}
function eCilindro(G, cx, y0, cz, r, h, col, mat, seg, tapa) {
  const c = typeof col === 'string' ? cc(col) : col; seg = seg || 10;
  for (let i = 0; i < seg; i++) {
    const a0 = i / seg * TAU, a1 = (i + 1) / seg * TAU, x0 = cx + Math.sin(a0) * r, z0 = cz + Math.cos(a0) * r, x1 = cx + Math.sin(a1) * r, z1 = cz + Math.cos(a1) * r;
    const n0 = [Math.sin(a0), 0, Math.cos(a0)], n1 = [Math.sin(a1), 0, Math.cos(a1)];
    for (const [p, n] of [[[x0, y0, z0], n0], [[x1, y0, z1], n1], [[x1, y0 + h, z1], n1], [[x0, y0, z0], n0], [[x1, y0 + h, z1], n1], [[x0, y0 + h, z0], n0]]) geoV(G, p[0], p[1], p[2], n[0], n[1], n[2], c, mat);
    if (tapa !== false) for (const p of [[cx, y0 + h, cz], [x0, y0 + h, z0], [x1, y0 + h, z1]]) geoV(G, p[0], p[1], p[2], 0, 1, 0, c, mat);
  }
}
// palo entre dos puntos (cilindro orientado, para arcos, postes, grúas)
function ePalo(G, a, b, r, col, mat, seg) {
  const c = typeof col === 'string' ? cc(col) : col; seg = seg || 8;
  const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz), ex = [dx / L, dy / L, dz / L];
  const up = Math.abs(ex[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  let px = [up[1] * ex[2] - up[2] * ex[1], up[2] * ex[0] - up[0] * ex[2], up[0] * ex[1] - up[1] * ex[0]]; const l = Math.hypot(...px); px = px.map(v => v / l);
  const py = [ex[1] * px[2] - ex[2] * px[1], ex[2] * px[0] - ex[0] * px[2], ex[0] * px[1] - ex[1] * px[0]];
  for (let i = 0; i < seg; i++) {
    const a0 = i / seg * TAU, a1 = (i + 1) / seg * TAU;
    const n0 = [px[0] * Math.cos(a0) + py[0] * Math.sin(a0), px[1] * Math.cos(a0) + py[1] * Math.sin(a0), px[2] * Math.cos(a0) + py[2] * Math.sin(a0)];
    const n1 = [px[0] * Math.cos(a1) + py[0] * Math.sin(a1), px[1] * Math.cos(a1) + py[1] * Math.sin(a1), px[2] * Math.cos(a1) + py[2] * Math.sin(a1)];
    const P = (o, n) => [o[0] + n[0] * r, o[1] + n[1] * r, o[2] + n[2] * r];
    for (const [p, n] of [[P(a, n0), n0], [P(a, n1), n1], [P(b, n1), n1], [P(a, n0), n0], [P(b, n1), n1], [P(b, n0), n0]]) geoV(G, p[0], p[1], p[2], n[0], n[1], n[2], c, mat);
  }
}
function eDisco(G, cx, y, cz, rx, rz, col, mat, n) {
  const c = typeof col === 'string' ? cc(col) : col;
  for (let i = 0; i < n; i++) { const a0 = i / n * TAU, a1 = (i + 1) / n * TAU, w0 = 1 + 0.12 * Math.sin(a0 * 3 + cx), w1 = 1 + 0.12 * Math.sin(a1 * 3 + cx); for (const [x, z, u] of [[cx, cz, 0], [cx + Math.sin(a1) * rx * w1, cz + Math.cos(a1) * rz * w1, 1], [cx + Math.sin(a0) * rx * w0, cz + Math.cos(a0) * rz * w0, 1]]) geoV(G, x, y, z, 0, 1, 0, c, mat, u, 0); }
}
function ePlano(G, x0, z0, x1, z1, y, col, mat, uvEsc) {
  const c = typeof col === 'string' ? cc(col) : col, k = uvEsc || 0;
  geoQuad(G, [x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], c, mat, k ? [[x0 * k, z1 * k], [x1 * k, z1 * k], [x1 * k, z0 * k], [x0 * k, z0 * k]] : undefined);
}
// cartel con un pedazo del atlas (u0,v0,u1,v1 en 0..1), mirando hacia n (normal en xz)
function eCartel(G, cx, y0, cz, w, h, ang, uvr, mat) {
  const s = Math.sin(ang), c = Math.cos(ang), dx = c * w / 2, dz = -s * w / 2, o = 0.02;
  const ox = s * o, oz = c * o;
  geoQuad(G, [cx - dx + ox, y0, cz - dz + oz], [cx + dx + ox, y0, cz + dz + oz], [cx + dx + ox, y0 + h, cz + dz + oz], [cx - dx + ox, y0 + h, cz - dz + oz], cc('#ffffff'), mat || MAT.dibujo, [[uvr[0], uvr[3]], [uvr[2], uvr[3]], [uvr[2], uvr[1]], [uvr[0], uvr[1]]]);
}
function eArbol(G, x, z, h, r, colH, rnd2) {
  eCilindro(G, x, 0, z, 0.16, h * 0.55, '#6a4a32', MAT.madera, 7);
  const n = 4 + Math.floor(rnd2() * 3);
  for (let i = 0; i < n; i++) {
    const a = rnd2() * TAU, d = r * 0.45 * rnd2(), rr = r * (0.55 + rnd2() * 0.35);
    geoElipsoide(G, x + Math.sin(a) * d, h * 0.6 + rnd2() * h * 0.3, z + Math.cos(a) * d, rr, rr * 0.8, rr, cc(mezcla(colH, '#2a5a2a', rnd2() * 0.3)), { flag: MAT.follaje, nu: 9, nv: 7 });
  }
}
// casita del barrio: frente de color, ventanas, puerta, tanque de agua y antena
function eCasa(G, x0, z0, x1, z1, h, col, frente, rnd2, o) {
  o = o || {};
  eCaja(G, x0, 0, z0, x1, h, z1, col, MAT.liso, { techo: o.techo || '#b8aea0', matTecho: MAT.hormigon });
  eCaja(G, x0 - 0.12, h, z0 - 0.12, x1 + 0.12, h + 0.25, z1 + 0.12, mezcla(col, '#ffffff', 0.25), MAT.liso, { sin: ['d'] });
  // ventanas y puerta en el frente (frente: 'z0', 'z1', 'x0', 'x1')
  const pisos = Math.max(1, Math.round(h / 2.9));
  const largo = frente[0] === 'z' ? x1 - x0 : z1 - z0, nv = Math.max(1, Math.floor(largo / 2.6));
  for (let p = 0; p < pisos; p++) for (let i = 0; i < nv; i++) {
    const t = (i + 0.5) / nv, y = 0.9 + p * 2.9, puerta = p === 0 && i === Math.floor(nv / 2) && !o.sinPuerta;
    const w = puerta ? 1.0 : 1.1, hh = puerta ? 2.1 : 1.2, yy = puerta ? 0 : y;
    const colV = puerta ? cc(o.puerta || '#6a3a2a') : cc('#24306a');
    if (frente === 'z1') { const xc = x0 + largo * t; eCaja(G, xc - w / 2, yy, z1, xc + w / 2, yy + hh, z1 + 0.05, colV, puerta ? MAT.madera : MAT.vidrio, { sin: ['b'] }); if (!puerta) eCaja(G, xc - w / 2 - 0.1, yy - 0.12, z1, xc + w / 2 + 0.1, yy, z1 + 0.14, '#f0ece0', MAT.liso, { sin: ['b'] }); }
    else if (frente === 'z0') { const xc = x0 + largo * t; eCaja(G, xc - w / 2, yy, z0 - 0.05, xc + w / 2, yy + hh, z0, colV, puerta ? MAT.madera : MAT.vidrio, { sin: ['f'] }); if (!puerta) eCaja(G, xc - w / 2 - 0.1, yy - 0.12, z0 - 0.14, xc + w / 2 + 0.1, yy, z0, '#f0ece0', MAT.liso, { sin: ['f'] }); }
    else if (frente === 'x1') { const zc = z0 + largo * t; eCaja(G, x1, yy, zc - w / 2, x1 + 0.05, yy + hh, zc + w / 2, colV, puerta ? MAT.madera : MAT.vidrio, { sin: ['l'] }); }
    else { const zc = z0 + largo * t; eCaja(G, x0 - 0.05, yy, zc - w / 2, x0, yy + hh, zc + w / 2, colV, puerta ? MAT.madera : MAT.vidrio, { sin: ['r'] }); }
  }
  if (!o.sinTanque && rnd2() < 0.75) { const tx = lerp(x0 + 1, x1 - 1, rnd2()), tz = lerp(z0 + 1, z1 - 1, rnd2()); eCaja(G, tx - 0.6, h + 0.25, tz - 0.6, tx + 0.6, h + 0.9, tz + 0.6, '#d8d4cc', MAT.hormigon); eCilindro(G, tx, h + 0.9, tz, 0.55, 1.1, rnd2() < 0.5 ? '#2a2a34' : '#3a6ad0', MAT.liso, 10); }
  if (rnd2() < 0.5) { const ax = lerp(x0 + 0.5, x1 - 0.5, rnd2()), az = lerp(z0 + 0.5, z1 - 0.5, rnd2()); ePalo(G, [ax, h + 0.25, az], [ax, h + 2.6, az], 0.025, '#888890', MAT.metal, 4); ePalo(G, [ax - 0.6, h + 2.2, az], [ax + 0.6, h + 2.2, az], 0.02, '#888890', MAT.metal, 4); }
}
// arcos: palos blancos y la red (malla aparte que se infla)
function eArco(G, zSigno, col) {
  const z = zSigno * 0, A = ARCO.ancho / 2, h = ARCO.alto, f = ARCO.fondo, r = 0.06, c = col || '#f4f4f0';
  const zl = zSigno * L_ACT / 2, zb = zl + zSigno * f;
  ePalo(G, [-A, 0, zl], [-A, h, zl], r, c, MAT.metal, 8); ePalo(G, [A, 0, zl], [A, h, zl], r, c, MAT.metal, 8);
  ePalo(G, [-A - r, h, zl], [A + r, h, zl], r, c, MAT.metal, 8);
  ePalo(G, [-A, h, zl], [-A, h * 0.85, zb], 0.03, c, MAT.metal, 5); ePalo(G, [A, h, zl], [A, h * 0.85, zb], 0.03, c, MAT.metal, 5);
  ePalo(G, [-A, 0, zb], [A, 0, zb], 0.03, c, MAT.metal, 5); ePalo(G, [-A, 0, zb], [-A, h * 0.85, zb], 0.03, c, MAT.metal, 5); ePalo(G, [A, 0, zb], [A, h * 0.85, zb], 0.03, c, MAT.metal, 5);
  return z;
}
function mallaRed(zSigno) {
  const G = nuevaGeo(false), A = ARCO.ancho / 2, h = ARCO.alto, f = ARCO.fondo, zl = zSigno * L_ACT / 2, zb = zl + zSigno * f, n = 10;
  const blanco = [240, 240, 236];
  // cada vértice lleva en alfa cuánto se mueve (los bordes atados no)
  const pared = (P, nrm, uvf, movil) => {
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const q = [[i / n, j / n], [(i + 1) / n, j / n], [(i + 1) / n, (j + 1) / n], [i / n, j / n], [(i + 1) / n, (j + 1) / n], [i / n, (j + 1) / n]];
      for (const [u, v] of q) { const p = P(u, v), t = uvf(u, v), m = movil(u, v); geoV(G, p[0], p[1], p[2], nrm[0], nrm[1], nrm[2], blanco, Math.round(m * 255), t[0], t[1]); }
    }
  };
  const ab = (u) => Math.sin(u * PI);
  pared((u, v) => [lerp(-A, A, u), lerp(0, h * 0.85, v), zb], [0, 0, zSigno], (u, v) => [u * ARCO.ancho, v * h], (u, v) => ab(u) * ab(v));
  pared((u, v) => [lerp(-A, A, u), lerp(h, h * 0.85, v), lerp(zl, zb, v)], [0, 1, 0], (u, v) => [u * ARCO.ancho, v * f], (u, v) => ab(u) * ab(v) * 0.6);
  for (const s of [-1, 1]) pared((u, v) => [s * A, lerp(0, h - (h * 0.15) * u, v), lerp(zl, zb, u)], [s, 0, 0], (u, v) => [u * f, v * h], (u, v) => ab(u) * ab(v) * 0.7);
  const m = geoEmpacar(G);
  return { malla: m, golpe: new Float32Array([0, 1, zb, 0]), z: zSigno };
}
// líneas de cal
function eLineas(G, A, L, col) {
  const c = cc(col || '#f4f2ea'), y = 0.012, w = 0.09;
  const seg = (x0, z0, x1, z1) => { const dx = x1 - x0, dz = z1 - z0, l = Math.hypot(dx, dz) || 1, nx = -dz / l * w / 2, nz = dx / l * w / 2; geoQuad(G, [x0 - nx, y, z0 - nz], [x0 + nx, y, z0 + nz], [x1 + nx, y, z1 + nz], [x1 - nx, y, z1 - nz], c, MAT.cal); };
  const arco = (cx, cz, r, a0, a1, n) => { for (let i = 0; i < n; i++) { const t0 = a0 + (a1 - a0) * i / n, t1 = a0 + (a1 - a0) * (i + 1) / n; seg(cx + Math.sin(t0) * r, cz + Math.cos(t0) * r, cx + Math.sin(t1) * r, cz + Math.cos(t1) * r); } };
  const a = A / 2 - 0.35, l = L / 2 - 0.1;
  seg(-a, -l, a, -l); seg(-a, l, a, l); seg(-a, -l, -a, l); seg(a, -l, a, l); seg(-a, 0, a, 0);
  arco(0, 0, 3, 0, TAU, 28);
  for (const s of [-1, 1]) { arco(0, s * l, 6, s > 0 ? PI * 0.5 + 0.0 : -PI * 0.5, s > 0 ? PI * 1.5 : PI * 0.5, 22); seg(-1, s * (l - 6), 1, s * (l - 6)); geoQuad(G, [-0.12, y, s * (l - 6) - 0.12], [0.12, y, s * (l - 6) - 0.12], [0.12, y, s * (l - 6) + 0.12], [-0.12, y, s * (l - 6) + 0.12], c, MAT.cal); }
  geoQuad(G, [-0.15, y, -0.15], [0.15, y, -0.15], [0.15, y, 0.15], [-0.15, y, 0.15], c, MAT.cal);
}
// alambrado (usa la malla de red, sin moverse)
function mallaAlambre(tramos, alto0, alto1) {
  const G = nuevaGeo(false), gris = [200, 205, 210];
  for (const [x0, z0, x1, z1] of tramos) {
    const L = Math.hypot(x1 - x0, z1 - z0), nx = -(z1 - z0) / L, nz = (x1 - x0) / L;
    geoQuad(G, [x0, alto0, z0], [x1, alto0, z1], [x1, alto1, z1], [x0, alto1, z0], gris, 0, [[0, 0], [L * 0.7, 0], [L * 0.7, (alto1 - alto0) * 0.7], [0, (alto1 - alto0) * 0.7]]);
    void nx; void nz;
  }
  const m = geoEmpacar(G);
  return { malla: m, golpe: new Float32Array([0, -50, 0, 0]), alambre: true };
}
// ---------- el atlas de dibujos de cada cancha ----------
function atlasCancha(tipo) {
  const N = 1024, cv = lienzo(N, N), g = cv.getContext('2d');
  g.lineJoin = 'round'; g.lineCap = 'round';
  const tinta = '#16131f';
  const letrero = (x, y, w, h, fondo, s, colT, tam, rot) => {
    g.save(); g.translate(x + w / 2, y + h / 2); if (rot) g.rotate(rot);
    g.fillStyle = fondo; g.fillRect(-w / 2, -h / 2, w, h); g.lineWidth = 8; g.strokeStyle = tinta; g.strokeRect(-w / 2 + 4, -h / 2 + 4, w - 8, h - 8);
    const k = tam / 10, { p, ancho } = caminoLetras(mayus(s), k, true, 5);
    g.translate(-ancho / 2, -tam * 0.36);
    g.strokeStyle = tinta; g.lineWidth = k * 3.4; g.stroke(p); g.strokeStyle = colT; g.lineWidth = k * 1.6; g.stroke(p);
    g.restore();
  };
  // 0: mural del barrio (sol, cerro, "LA LOMA")
  g.fillStyle = '#62c6f2'; g.fillRect(0, 0, 512, 256);
  g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(120, 120, 60, 0, TAU); g.fill(); g.lineWidth = 8; g.strokeStyle = tinta; g.stroke();
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; g.beginPath(); g.moveTo(120 + Math.cos(a) * 72, 120 + Math.sin(a) * 72); g.lineTo(120 + Math.cos(a) * 100, 120 + Math.sin(a) * 100); g.stroke(); }
  g.fillStyle = tinta; g.beginPath(); g.arc(102, 110, 7, 0, TAU); g.arc(138, 110, 7, 0, TAU); g.fill(); g.beginPath(); g.arc(120, 128, 24, 0.2, PI - 0.2); g.stroke();
  g.fillStyle = '#4bb553'; g.beginPath(); g.moveTo(0, 256); g.quadraticCurveTo(220, 150, 512, 230); g.lineTo(512, 256); g.fill(); g.stroke();
  letrero(230, 60, 260, 100, '#ec4a33', 'LA LOMA', '#fff6e0', 70, -0.05);
  // 1: cartel del kiosco
  letrero(512, 0, 512, 128, '#ffd23f', 'KIOSCO DON CACHO', '#ec4a33', 54, 0);
  letrero(512, 128, 512, 128, '#3270d8', 'GOLOSINAS · FIGURITAS', '#fff6e0', 40, 0);
  // 2: corazón y pelota "POTRERO"
  g.fillStyle = '#f47eb4'; g.fillRect(0, 256, 512, 256);
  g.fillStyle = '#ec4a33'; g.beginPath(); g.moveTo(130, 470); g.bezierCurveTo(10, 380, 40, 290, 130, 330); g.bezierCurveTo(220, 290, 250, 380, 130, 470); g.fill(); g.lineWidth = 9; g.strokeStyle = tinta; g.stroke();
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(390, 370, 80, 0, TAU); g.fill(); g.stroke();
  g.fillStyle = tinta; g.beginPath(); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU - PI / 2; g.lineTo(390 + Math.cos(a) * 30, 370 + Math.sin(a) * 30); } g.fill();
  letrero(150, 450, 340, 54, '#ffd23f', 'POTRERO', '#16131f', 40, 0.04);
  // 3: publicidades para las vallas (tiras de 128 de alto)
  const ads = [['#ffd23f', 'ALFAJORES TITO', '#ec4a33'], ['#3270d8', 'FERRETERÍA EL TORNILLO', '#fff6e0'], ['#4bb553', 'VERDULERÍA LA HUERTA', '#fff6e0'], ['#ec4a33', 'PIZZERÍA EL MOSTRO', '#ffd23f']];
  ads.forEach(([f, s, c], i) => letrero(512, 256 + i * 64, 512, 64, f, s, c, 34, 0));
  // 4: bandera grande "COPA DE LOS BARRIOS"
  letrero(0, 512, 1024, 128, '#16131f', 'COPA DE LOS BARRIOS', '#ffd23f', 76, 0);
  // 5: graffiti y carteles sueltos
  letrero(0, 640, 512, 128, '#8d5be0', '¡AGUANTE LA LOMA!', '#ffd23f', 50, -0.04);
  letrero(512, 640, 512, 128, '#f7962e', 'PROHIBIDO ESTACIONAR', '#16131f', 44, 0);
  letrero(0, 768, 512, 128, '#62c6f2', 'PUERTO BRAVO', '#16131f', 60, 0);
  letrero(512, 768, 512, 128, '#4bb553', 'CLUB SOCIAL Y DEPORTIVO', '#fff6e0', 40, 0);
  letrero(0, 896, 512, 128, '#fff6e0', 'ESTACIÓN LA VÍA', '#16131f', 52, 0);
  letrero(512, 896, 512, 128, '#ec4a33', 'LOS HALCONES', '#fff6e0', 60, 0);
  return cv;
}
// los cartones del público: 8 tipos, brazos abajo (arriba) y arriba (abajo); la remera en magenta se tiñe
function atlasPublico() {
  const w = 64, h = 128, cv = lienzo(w * 8, h * 2), g = cv.getContext('2d'), r = rngSemilla(77);
  const pieles = ['#f0c8a0', '#d9a07a', '#a8714a', '#7a4a2a', '#e8b890', '#c08458'], pelos = ['#2a1a10', '#5a3a1a', '#d8b050', '#1a1a1a', '#8a2a1a', '#b0b0b0'];
  g.lineJoin = 'round'; g.lineCap = 'round';
  for (let i = 0; i < 8; i++) for (let f = 0; f < 2; f++) {
    g.save(); g.translate(i * w, f * h);
    const piel = pieles[i % pieles.length], pelo = pelos[(i * 3) % pelos.length], gordo = r() * 6;
    g.lineWidth = 4; g.strokeStyle = '#16131f';
    // brazos
    g.strokeStyle = '#16131f'; g.lineWidth = 11;
    if (f) { g.beginPath(); g.moveTo(18, 70); g.lineTo(8, 34); g.moveTo(46, 70); g.lineTo(56, 34); g.stroke(); g.strokeStyle = piel; g.lineWidth = 6; g.stroke(); }
    else { g.beginPath(); g.moveTo(16, 70); g.lineTo(12, 104); g.moveTo(48, 70); g.lineTo(52, 104); g.stroke(); g.strokeStyle = piel; g.lineWidth = 6; g.stroke(); }
    // cuerpo (remera para teñir)
    g.fillStyle = '#ff00ff'; g.beginPath(); g.moveTo(14 - gordo, 126); g.quadraticCurveTo(10 - gordo, 66, 32, 62); g.quadraticCurveTo(54 + gordo, 66, 50 + gordo, 126); g.closePath(); g.fill(); g.lineWidth = 4; g.strokeStyle = '#16131f'; g.stroke();
    // cabeza
    g.fillStyle = piel; g.beginPath(); g.arc(32, 44, 15, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = pelo; g.beginPath(); g.arc(32, 40, 15.5, PI, TAU); g.fill(); g.stroke();
    g.fillStyle = '#16131f'; g.fillRect(26, 44, 3, 4); g.fillRect(35, 44, 3, 4);
    g.beginPath(); g.arc(32, 50, f ? 5 : 3, 0, PI); g.fill();
    if (i % 3 === 0) { g.fillStyle = '#ffffff'; g.fillRect(14, 84, 36, 8); }   // bufanda
    g.restore();
  }
  return cv;
}
// ---------- las canchas ----------
let L_ACT = 36;
const CANCHAS = {
  potrero: { A: 22, L: 36, suelo: 'tierra', roce: 1.25, rebote: 0.5, pared: 0.62, alto: 4.2, luz: 'dia', gente: 0.25 },
  puerto: { A: 22, L: 36, suelo: 'hormigon', roce: 0.9, rebote: 0.62, pared: 0.6, alto: 4.2, luz: 'tarde', gente: 0.3, charcos: true },
  via: { A: 21, L: 37, suelo: 'tierra', roce: 1.15, rebote: 0.5, pared: 0.6, alto: 4.2, luz: 'dia2', gente: 0.3, tren: true },
  club: { A: 22, L: 38, suelo: 'pasto', roce: 1.0, rebote: 0.55, pared: 0.55, alto: 5, luz: 'noche', gente: 0.6, rayas: true },
  campo: { A: 24, L: 40, suelo: 'pasto', roce: 1.05, rebote: 0.55, pared: 0.5, alto: 4, luz: 'dia3', gente: 0.25, viento: true },
  estadio: { A: 24, L: 40, suelo: 'pasto', roce: 0.95, rebote: 0.58, pared: 0.55, alto: 5, luz: 'noche2', gente: 1, rayas: true },
};
const LUCES = {
  dia: { sol: [0.42, 0.8, 0.42], solCol: [1.06, 1.0, 0.9], sombra: [0.5, 0.52, 0.8], cenit: [0.3, 0.56, 0.92], horiz: [0.86, 0.92, 0.96], noche: 0 },
  dia2: { sol: [-0.5, 0.75, 0.42], solCol: [1.08, 1.0, 0.88], sombra: [0.52, 0.5, 0.78], cenit: [0.36, 0.6, 0.94], horiz: [0.92, 0.92, 0.9], noche: 0 },
  dia3: { sol: [0.3, 0.82, -0.48], solCol: [1.05, 1.02, 0.92], sombra: [0.5, 0.55, 0.78], cenit: [0.28, 0.54, 0.95], horiz: [0.88, 0.94, 0.98], noche: 0 },
  tarde: { sol: [-0.55, 0.75, -0.35], solCol: [1.18, 0.86, 0.62], sombra: [0.46, 0.4, 0.72], cenit: [0.34, 0.32, 0.64], horiz: [1.0, 0.66, 0.46], noche: 0 },
  noche: { sol: [0.25, 0.92, 0.3], solCol: [1.0, 0.98, 0.94], sombra: [0.32, 0.34, 0.6], cenit: [0.03, 0.04, 0.13], horiz: [0.13, 0.12, 0.27], noche: 1 },
  noche2: { sol: [-0.3, 0.9, 0.32], solCol: [1.04, 1.0, 0.95], sombra: [0.34, 0.34, 0.62], cenit: [0.03, 0.03, 0.12], horiz: [0.2, 0.14, 0.3], noche: 1 },
};
function armarCancha(nombre) {
  const C = CANCHAS[nombre], A = C.A, L = C.L, r = rngSemilla(nombre.length * 97 + 3);
  L_ACT = L;
  const G = nuevaGeo(false), Gs = nuevaGeo(false);   // Gs: lo que no hace sombra (piso)
  const publico = [], extras = {};
  const pub = (x, y, z, s) => publico.push([x, y, z, s || 1, Math.floor(r() * 8), r(), r()]);
  // piso
  const colSuelo = { tierra: '#c99a62', hormigon: '#9a9aa2', pasto: '#5aa848' }[C.suelo], matSuelo = { tierra: MAT.tierra, hormigon: MAT.hormigon, pasto: MAT.pasto }[C.suelo];
  ePlano(Gs, -70, -70, 70, 70, 0, nombre === 'campo' ? '#6ab452' : nombre === 'puerto' ? '#7a7a84' : nombre === 'estadio' || nombre === 'club' ? '#4a4a52' : '#b8916a', nombre === 'campo' ? MAT.pasto : MAT.tierra);
  ePlano(Gs, -A / 2 - 0.4, -L / 2 - 1.2, A / 2 + 0.4, L / 2 + 1.2, 0.004, colSuelo, matSuelo);
  eLineas(Gs, A, L);
  if (C.charcos) {
    extras.charcos = [];
    for (let i = 0; i < 7; i++) { const x = (r() - 0.5) * (A - 6), z = (r() - 0.5) * (L - 8), rr = 1.2 + r() * 1.4; extras.charcos.push([x, z, rr]); eDisco(Gs, x, 0.014, z, rr, rr * 0.8, '#3a5a9a', MAT.agua, 18); }
  }
  // borde de la cancha (paredes que devuelven la pelota)
  const xA = A / 2, zL = L / 2, gol = ARCO.ancho / 2 + 0.25;
  const pared = (x0, z0, x1, z1, h, col, mat) => eCaja(G, x0, 0, z0, x1, h, z1, col, mat, { uv: true });
  const tramos = [[-xA, -zL, -xA, zL], [xA, -zL, xA, zL], [-xA, -zL, -gol, -zL], [gol, -zL, xA, -zL], [-xA, zL, -gol, zL], [gol, zL, xA, zL]];
  let hPared = 1.6;
  if (nombre === 'potrero' || nombre === 'via') {
    hPared = 1.7;
    pared(-xA - 0.3, -zL - 0.3, -xA, zL + 0.3, hPared, '#c86a48', MAT.ladrillo); pared(xA, -zL - 0.3, xA + 0.3, zL + 0.3, hPared, '#c86a48', MAT.ladrillo);
    for (const s of [-1, 1]) { pared(-xA, s * zL + (s > 0 ? 0 : -0.3), -gol, s * zL + (s > 0 ? 0.3 : 0), hPared, '#c86a48', MAT.ladrillo); pared(gol, s * zL + (s > 0 ? 0 : -0.3), xA, s * zL + (s > 0 ? 0.3 : 0), hPared, '#c86a48', MAT.ladrillo); pared(-gol, s * (zL + ARCO.fondo + 0.2), gol, s * (zL + ARCO.fondo + 0.5), hPared, '#c86a48', MAT.ladrillo); }
    // murales en las paredes de adentro
    eCartel(G, -xA + 0.01, 0.15, -6, 5.6, 1.4, PI / 2, [0, 0, 0.5, 0.25], MAT.dibujo);
    eCartel(G, xA - 0.01, 0.15, 7, 5.6, 1.4, -PI / 2, [0, 0.25, 0.5, 0.5], MAT.dibujo);
    eCartel(G, -xA + 0.01, 0.2, 9, 4.2, 1.05, PI / 2, [0, 0.625, 0.5, 0.75], MAT.dibujo);
  } else if (nombre === 'puerto') {
    // contenedores de un lado, alambrado del otro
    const cols = ['#ec4a33', '#3270d8', '#f7962e', '#4bb553', '#8d5be0', '#62c6f2'];
    for (let i = 0; i < 7; i++) { const z0 = -zL - 1 + i * 6.1; for (let p = 0; p < (i % 3 === 1 ? 2 : 1); p++) { const c = cols[(i + p * 3) % 6]; eCaja(G, xA, p * 2.6, z0, xA + 2.4, p * 2.6 + 2.6, z0 + 6, c, MAT.metal); for (let k = 0; k < 9; k++) eCaja(G, xA - 0.04, p * 2.6 + 0.1, z0 + 0.3 + k * 0.62, xA, p * 2.6 + 2.5, z0 + 0.5 + k * 0.62, mezcla(c, '#000000', 0.2), MAT.metal, { sin: ['r'] }); } }
    pared(-xA - 0.3, -zL - 0.3, -xA, zL + 0.3, 1.0, '#8a8a92', MAT.hormigon);
    for (const s of [-1, 1]) { pared(-xA, s * zL + (s > 0 ? 0 : -0.3), -gol, s * zL + (s > 0 ? 0.3 : 0), 1.0, '#8a8a92', MAT.hormigon); pared(gol, s * zL + (s > 0 ? 0 : -0.3), xA, s * zL + (s > 0 ? 0.3 : 0), 1.0, '#8a8a92', MAT.hormigon); pared(-gol, s * (zL + ARCO.fondo + 0.2), gol, s * (zL + ARCO.fondo + 0.5), 1.0, '#8a8a92', MAT.hormigon); }
    hPared = 1.0;
    eCartel(G, -xA + 0.01, 0.0, 4, 3.6, 0.9, PI / 2, [0, 0.75, 0.5, 0.875], MAT.dibujo);
  } else {
    // vallas de publicidad (club, campo con fardos, estadio)
    if (nombre === 'campo') {
      for (const [x0, z0, x1, z1] of tramos) { const l = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(l / 1.3)); for (let i = 0; i < n; i++) { const t0 = i / n, t1 = (i + 1) / n; const ax = lerp(x0, x1, t0), az = lerp(z0, z1, t0), bx = lerp(x0, x1, t1), bz = lerp(z0, z1, t1); const ox = Math.abs(x1 - x0) < 0.1 ? Math.sign(x0) * 0.6 : 0, oz = Math.abs(z1 - z0) < 0.1 ? Math.sign(z0) * 0.6 : 0; eCaja(G, Math.min(ax, bx) + (ox < 0 ? -1.2 : ox > 0 ? 0 : 0.03), 0, Math.min(az, bz) + (oz < 0 ? -1.2 : oz > 0 ? 0 : 0.03), Math.max(ax, bx) + (ox > 0 ? 1.2 : ox < 0 ? 0 : -0.03), 1.0, Math.max(az, bz) + (oz > 0 ? 1.2 : oz < 0 ? 0 : -0.03), r() < 0.5 ? '#e8c860' : '#d8b450', MAT.follaje); } }
      hPared = 1.0;
      for (const s of [-1, 1]) eCaja(G, -gol, 0, s * (zL + ARCO.fondo + 0.2), gol, 1.0, s * (zL + ARCO.fondo + 1.2), '#e0c058', MAT.follaje);
    } else {
      hPared = 1.0;
      const ladoV = (x0, z0, x1, z1, k) => { eCaja(G, Math.min(x0, x1), 0, Math.min(z0, z1), Math.max(x0, x1), 1.0, Math.max(z0, z1), '#f0ece0', MAT.liso); };
      ladoV(-xA - 0.25, -zL, -xA, zL); ladoV(xA, -zL, xA + 0.25, zL);
      for (const s of [-1, 1]) { ladoV(-xA, s * zL, -gol, s * zL + s * 0.25); ladoV(gol, s * zL, xA, s * zL + s * 0.25); ladoV(-gol, s * (zL + ARCO.fondo + 0.2), gol, s * (zL + ARCO.fondo + 0.45)); }
      // publicidades
      const nA = Math.floor(L / 5.4);
      for (let i = 0; i < nA; i++) { const z = -L / 2 + (i + 0.5) * L / nA, k = (i % 4) * 64; eCartel(G, -xA + 0.01, 0.06, z, L / nA - 0.15, 0.88, PI / 2, [0.5, (256 + k) / 1024, 1, (320 + k) / 1024], MAT.cartel); eCartel(G, xA - 0.01, 0.06, z, L / nA - 0.15, 0.88, -PI / 2, [0.5, (256 + ((i + 2) % 4) * 64) / 1024, 1, (320 + ((i + 2) % 4) * 64) / 1024], MAT.cartel); }
    }
  }
  // alambrado arriba del borde (la pelota rebota igual)
  const alambre = mallaAlambre(tramos.concat([[-gol, -zL - ARCO.fondo - 0.35, gol, -zL - ARCO.fondo - 0.35], [-gol, zL + ARCO.fondo + 0.35, gol, zL + ARCO.fondo + 0.35]]), hPared, C.alto);
  for (const [x0, z0, x1, z1] of tramos) { const l = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(l / 4)); for (let i = 0; i <= n; i++) { const x = lerp(x0, x1, i / n), z = lerp(z0, z1, i / n); ePalo(G, [x, 0, z], [x, C.alto + 0.1, z], 0.045, '#9a9aa4', MAT.metal, 5); } }
  // arcos
  eArco(G, -1); eArco(G, 1);
  const redes = [mallaRed(-1), mallaRed(1), alambre];
  // ---- lo de afuera: cada cancha su barrio ----
  const colsCasa = ['#f47eb4', '#ffd23f', '#62c6f2', '#f7962e', '#9ad87a', '#f0e6c8', '#c8a0e8', '#f08070'];
  if (nombre === 'potrero' || nombre === 'via') {
    // casas en la vereda de enfrente y detrás de los arcos
    const fila = (x0, z0, z1, frente, lado) => { let z = z0; while (z < z1 - 3) { const w = 5 + r() * 4, h = 3 + Math.floor(r() * 3) * 2.6, c = colsCasa[Math.floor(r() * colsCasa.length)]; if (lado > 0) eCasa(G, x0, z, x0 + 7, Math.min(z1, z + w), h, c, frente, r); else eCasa(G, x0 - 7, z, x0, Math.min(z1, z + w), h, c, frente, r); z += w + 0.4; } };
    if (nombre === 'potrero') { fila(-xA - 6, -zL - 8, zL + 8, 'x1', -1); fila(xA + 6, -zL - 8, zL + 2, 'x0', 1); }
    else { fila(-xA - 6, -zL - 8, zL + 8, 'x1', -1); }
    for (const s of [-1, 1]) { let x = -xA - 4; while (x < xA + 4) { const w = 5 + r() * 3, h = 3 + Math.floor(r() * 3) * 2.6; if (s < 0) eCasa(G, x, -zL - 14, Math.min(xA + 4, x + w), -zL - 7, h, colsCasa[Math.floor(r() * 8)], 'z1', r); else eCasa(G, x, zL + 7, Math.min(xA + 4, x + w), zL + 14, h, colsCasa[Math.floor(r() * 8)], 'z0', r); x += w + 0.4; } }
    // vereda y calle
    ePlano(Gs, -xA - 6, -zL - 7, -xA - 0.3, zL + 7, 0.006, '#a8a4a0', MAT.hormigon);
    if (nombre === 'potrero') {
      ePlano(Gs, xA + 0.3, -zL - 7, xA + 6, zL + 7, 0.006, '#a8a4a0', MAT.hormigon);
      // el kiosco de Don Cacho en la esquina
      const kx = xA + 2.2, kz = zL + 3.5;
      eCaja(G, kx, 0, kz, kx + 3.4, 2.8, kz + 3, '#ffd23f', MAT.liso, { techo: '#ec4a33' });
      eCaja(G, kx - 0.05, 0.9, kz + 0.4, kx, 2.1, kz + 2.6, '#24306a', MAT.vidrio, { sin: ['r'] });
      eCartel(G, kx - 0.07, 2.15, kz + 1.5, 2.9, 0.62, -PI / 2, [0.5, 0, 1, 0.125], MAT.cartel);
      eCaja(G, kx - 0.6, 0, kz + 0.5, kx - 0.1, 0.5, kz + 1.0, '#ec4a33', MAT.liso); eCaja(G, kx - 0.6, 0.5, kz + 0.55, kx - 0.1, 1.0, kz + 0.95, '#3270d8', MAT.liso);
      extras.kiosco = [kx - 1.2, kz + 1.5];
      // árboles y faroles
      for (const [x, z] of [[xA + 3.4, -8], [xA + 3.4, 6], [-xA - 3.2, -12], [-xA - 3.2, 10]]) eArbol(G, x, z, 5.5 + r() * 1.5, 1.9, '#4a9a3a', r);
      for (const [x, z] of [[xA + 1.0, -zL + 2], [-xA - 1.0, 0], [xA + 1.0, zL - 9]]) { ePalo(G, [x, 0, z], [x, 5.2, z], 0.07, '#4a4a54', MAT.metal, 6); ePalo(G, [x, 5.2, z], [x - Math.sign(x) * 1.2, 5.4, z], 0.05, '#4a4a54', MAT.metal, 5); eCaja(G, x - Math.sign(x) * 1.2 - 0.25, 5.15, z - 0.15, x - Math.sign(x) * 1.2 + 0.25, 5.3, z + 0.15, '#fff2b0', MAT.luz); }
      // vecinos mirando: en la vereda, en las terrazas, en el paredón
      for (let i = 0; i < 16; i++) pub(-xA - 1.2 - r() * 2.5, 0, -zL + 2 + r() * (L - 4), 1.05 + r() * 0.2);
      for (let i = 0; i < 10; i++) pub(xA + 1.2 + r() * 1.8, 0, -zL + 2 + r() * (L - 10), 1.05 + r() * 0.2);
      for (let i = 0; i < 6; i++) pub(-xA - 0.15, hPared, -zL + 3 + r() * (L - 6), 0.9);
      extras.perro = true;
    } else {
      // la vía: terraplén, rieles, durmientes y el andén
      const vx = xA + 5;
      ePlano(Gs, xA + 0.3, -60, vx - 2, 60, 0.006, '#9ab06a', MAT.pasto);
      eCaja(Gs, vx - 2, 0, -70, vx + 2, 0.35, 70, '#8a8078', MAT.hormigon);
      for (let z = -70; z < 70; z += 0.7) eCaja(G, vx - 1.3, 0.35, z, vx + 1.3, 0.45, z + 0.22, '#6a4a32', MAT.madera, { sin: ['d'] });
      for (const s of [-1, 1]) eCaja(G, vx + s * 0.72 - 0.05, 0.45, -70, vx + s * 0.72 + 0.05, 0.58, 70, '#9a9aa4', MAT.metal, { sin: ['d'] });
      eCaja(G, vx + 2.4, 0, -12, vx + 5.4, 0.9, 12, '#b8b0a4', MAT.hormigon);
      eCaja(G, vx + 3.6, 0.9, -4, vx + 5.4, 3.6, 4, '#ec4a33', MAT.liso, { techo: '#5a5a62' });
      eCartel(G, vx + 3.58, 2.6, 0, 4.2, 0.8, -PI / 2, [0, 0.875, 0.5, 1], MAT.cartel);
      for (const z of [-30, -10, 14, 34]) eArbol(G, vx + 7, z, 6, 2.2, '#4a8a3a', r);
      extras.tren = { x: vx, y: 0.45 };
      for (let i = 0; i < 12; i++) pub(vx + 3 + r() * 2.2, 0.9, -10 + r() * 20, 1.0);
      for (let i = 0; i < 12; i++) pub(-xA - 1.2 - r() * 2.5, 0, -zL + 2 + r() * (L - 4), 1.05 + r() * 0.2);
      for (const [x, z] of [[-xA - 3, -14], [-xA - 3, 12]]) eArbol(G, x, z, 5.5, 1.9, '#4a9a3a', r);
    }
  } else if (nombre === 'puerto') {
    // río, muelle, grúas y galpones
    ePlano(Gs, xA + 2.4, -80, 80, 80, -0.6, '#3a5a8a', MAT.agua);
    eCaja(G, xA + 2.4, -0.6, -70, xA + 4, 0, 70, '#7a7a84', MAT.hormigon);
    for (const z of [-14, 12]) { const x = xA + 6; for (const dz of [-2, 2]) { ePalo(G, [x - 2, -0.6, z + dz], [x - 1.2, 16, z + dz * 0.6], 0.25, '#f7962e', MAT.metal, 6); ePalo(G, [x + 2, -0.6, z + dz], [x + 1.2, 16, z + dz * 0.6], 0.25, '#f7962e', MAT.metal, 6); } eCaja(G, x - 3, 16, z - 2, x + 3, 17.2, z + 2, '#f7962e', MAT.metal); eCaja(G, x - 16, 16.4, z - 0.6, x + 6, 17, z + 0.6, '#f7962e', MAT.metal); for (let k = 0; k < 8; k++) ePalo(G, [x - 15 + k * 2.6, 16.4, z], [x - 13.7 + k * 2.6, 17, z], 0.1, '#e8862a', MAT.metal, 4); }
    for (let i = 0; i < 4; i++) { const z0 = -40 + i * 20; eCaja(G, -xA - 22, 0, z0, -xA - 7, 8, z0 + 16, ['#9a8a7a', '#8a9aa4', '#a49a8a', '#7a8a8a'][i], MAT.metal, { techo: '#6a6a72' }); eCaja(G, -xA - 7.05, 0, z0 + 5, -xA - 7, 4.5, z0 + 11, '#5a4a3a', MAT.madera, { sin: ['l'] }); }
    eCartel(G, -xA - 6.98, 5, -12, 9, 2.2, PI / 2, [0, 0.75, 0.5, 0.875], MAT.cartel);
    for (let i = 0; i < 24; i++) pub(-xA - 1.2 - r() * 4, 0, -zL + 2 + r() * (L - 4), 1.05 + r() * 0.2);
    for (let i = 0; i < 10; i++) pub(xA + 0.8 + r() * 1.5, 2.6, -zL + 2 + r() * 10, 1.0);
  } else if (nombre === 'club') {
    // tribunita, sede con ventanas prendidas, torres de luz
    for (let p = 0; p < 4; p++) eCaja(G, -xA - 1.2 - p * 0.9, 0, -14, -xA - 0.3 - p * 0.9, 0.5 + p * 0.5, 14, '#8a8a92', MAT.hormigon);
    for (let p = 0; p < 4; p++) for (let i = 0; i < 26; i++) pub(-xA - 0.8 - p * 0.9, 0.5 + p * 0.5, -13 + i + r() * 0.5, 1.0);
    eCaja(G, xA + 4, 0, -12, xA + 14, 6, 12, '#f0e6c8', MAT.liso, { techo: '#7a5a4a' });
    for (let i = 0; i < 7; i++) for (let p = 0; p < 2; p++) eCaja(G, xA + 3.95, 1 + p * 2.6, -10 + i * 3, xA + 4, 2.4 + p * 2.6, -8.6 + i * 3, '#ffe38a', MAT.luz, { sin: ['r'] });
    eCartel(G, xA + 3.93, 5.2, 0, 10, 0.8, -PI / 2, [0.5, 0.75, 1, 0.875], MAT.cartel);
    for (const [x, z] of [[-xA - 6, -zL], [-xA - 6, zL], [xA + 2.5, -zL], [xA + 2.5, zL]]) { ePalo(G, [x, 0, z], [x, 14, z], 0.18, '#7a7a84', MAT.metal, 6); eCaja(G, x - 1.4, 14, z - 0.3, x + 1.4, 15.4, z + 0.3, '#5a5a62', MAT.metal); for (let k = 0; k < 4; k++) eCaja(G, x - 1.2 + k * 0.62, 14.2, z + (z > 0 ? -0.32 : 0.3), x - 0.7 + k * 0.62, 15.2, z + (z > 0 ? -0.3 : 0.32), '#fffbe0', MAT.luz); }
    for (const [x, z] of [[-xA - 12, -24], [-xA - 14, 20], [xA + 18, -20], [xA + 16, 24]]) eArbol(G, x, z, 7, 2.6, '#2a5a3a', r);
  } else if (nombre === 'campo') {
    // molino, rancho, eucaliptos, vacas a lo lejos y lomas
    const mx = -xA - 10, mz = -6;
    for (const [dx, dz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) ePalo(G, [mx + dx * 1.4, 0, mz + dz * 1.4], [mx + dx * 0.25, 10, mz + dz * 0.25], 0.08, '#8a8a92', MAT.metal, 5);
    for (let k = 1; k < 5; k++) { const y = k * 2.2, s = 1.4 - k * 0.24; for (const [a, b] of [[[-s, -s], [s, -s]], [[s, -s], [s, s]], [[s, s], [-s, s]], [[-s, s], [-s, -s]]]) ePalo(G, [mx + a[0], y, mz + a[1]], [mx + b[0], y, mz + b[1]], 0.04, '#8a8a92', MAT.metal, 4); }
    extras.molino = { x: mx, y: 10.4, z: mz };
    eCilindro(G, mx + 3.5, 0, mz + 3, 1.6, 1.4, '#9aa4a8', MAT.metal, 12);
    eCaja(G, xA + 9, 0, -8, xA + 17, 3.2, 6, '#f0e6d2', MAT.liso, { techo: '#c8a060' });
    eCaja(G, xA + 8.95, 0, -2.5, xA + 9, 2.1, -1.2, '#6a3a2a', MAT.madera, { sin: ['r'] });
    for (let i = 0; i < 9; i++) eArbol(G, -xA - 16 - r() * 10, -30 + i * 7 + r() * 3, 11 + r() * 4, 2.2, '#5a8a5a', r);
    for (let i = 0; i < 5; i++) eArbol(G, xA + 22 + r() * 8, -26 + i * 12, 10 + r() * 3, 2.4, '#5a8a5a', r);
    for (const [x, z, s] of [[-60, -40, 22], [50, -55, 28], [0, -75, 30], [-40, 60, 26], [60, 50, 20]]) geoElipsoide(G, x, -s * 0.55, z, s * 1.6, s, s * 1.4, cc('#7ab85a'), { flag: MAT.pasto, nu: 16, nv: 8 });
    for (let i = 0; i < 14; i++) pub(-xA - 2 - r() * 3, 0, -zL + 2 + r() * (L - 4), 1.05 + r() * 0.2);
    for (let i = 0; i < 8; i++) pub(xA + 2 + r() * 3, 0, -zL + 4 + r() * (L - 8), 1.05 + r() * 0.2);
    extras.viento = true;
  } else if (nombre === 'estadio') {
    // tribunas en escalones con mucha gente, torres de luz, banderas
    const grada = (x0, z0, x1, z1, dir, filas) => {
      for (let p = 0; p < filas; p++) {
        const d = p * 0.85, h = 0.6 + p * 0.55;
        if (dir === 'x-') eCaja(G, x0 - d - 0.85, 0, z0, x0 - d, h, z1, p % 2 ? '#5a5a66' : '#6a6a76', MAT.hormigon);
        if (dir === 'x+') eCaja(G, x0 + d, 0, z0, x0 + d + 0.85, h, z1, p % 2 ? '#5a5a66' : '#6a6a76', MAT.hormigon);
        if (dir === 'z-') eCaja(G, x0, 0, z0 - d - 0.85, x1, h, z0 - d, p % 2 ? '#5a5a66' : '#6a6a76', MAT.hormigon);
        if (dir === 'z+') eCaja(G, x0, 0, z0 + d, x1, h, z0 + d + 0.85, p % 2 ? '#5a5a66' : '#6a6a76', MAT.hormigon);
        const n = Math.floor((dir[0] === 'x' ? z1 - z0 : x1 - x0) / 0.8);
        for (let i = 0; i < n; i++) { if (r() < 0.12) continue; const t = (i + 0.5) / n; if (dir === 'x-') pub(x0 - d - 0.45, h, lerp(z0, z1, t), 1.0); if (dir === 'x+') pub(x0 + d + 0.45, h, lerp(z0, z1, t), 1.0); if (dir === 'z-') pub(lerp(x0, x1, t), h, z0 - d - 0.45, 1.0); if (dir === 'z+') pub(lerp(x0, x1, t), h, z0 + d + 0.45, 1.0); }
      }
    };
    grada(-xA - 3, -zL - 2, -xA - 3, zL + 2, 'x-', 9); grada(xA + 3, -zL - 2, xA + 3, zL + 2, 'x+', 9);
    grada(-xA - 2, -zL - 5, xA + 2, -zL - 5, 'z-', 7); grada(-xA - 2, zL + 5, xA + 2, zL + 5, 'z+', 7);
    ePlano(Gs, -xA - 3, -zL - 5, xA + 3, zL + 5, 0.003, '#3f8f3a', MAT.pasto);
    // bandera grande
    eCartel(G, -xA - 3.3, 5.2, 0, 16, 2.0, PI / 2, [0, 0.5, 1, 0.625], MAT.cartel);
    eCartel(G, xA + 3.3, 5.2, 0, 10, 2.0, -PI / 2, [0.5, 0.875, 1, 1], MAT.cartel);
    for (const [x, z] of [[-xA - 12, -zL - 10], [-xA - 12, zL + 10], [xA + 12, -zL - 10], [xA + 12, zL + 10]]) { ePalo(G, [x, 0, z], [x, 24, z], 0.35, '#6a6a74', MAT.metal, 6); eCaja(G, x - 2.4, 24, z - 0.4, x + 2.4, 26.4, z + 0.4, '#4a4a52', MAT.metal); for (let k = 0; k < 6; k++) for (let j = 0; j < 2; j++) eCaja(G, x - 2.2 + k * 0.75, 24.2 + j * 1.1, z + (z > 0 ? -0.42 : 0.4), x - 1.6 + k * 0.75, 25.1 + j * 1.1, z + (z > 0 ? -0.4 : 0.42), '#fffbe8', MAT.luz); }
  }
  const mallas = [geoEmpacar(Gs), geoEmpacar(G)];
  mallas[0].sinSombra = true;
  const lz = LUCES[C.luz];
  const ext = Math.max(A, L) / 2 + 22;
  return {
    nombre, A, L, C, mallas, redes, publico, extras, atlas: atlasCancha(nombre), centro: [0, 0], radioSombra: ext, radioJug: Math.max(A, L) / 2 + 4,
    luz: lz, hPared, charcos: extras.charcos || [],
  };
}
function aplicarLuzCancha(E) {
  const l = E.luz, d = l.sol, n = Math.hypot(...d);
  R.sol.dir = d.map(v => v / n); R.sol.col = l.solCol.slice(); R.sombraCol = l.sombra.slice();
  R.cielo.cenit = l.cenit.slice(); R.cielo.horiz = l.horiz.slice(); R.niebla.col = l.horiz.slice(); R.niebla.d = 55; R.noche = l.noche;
  R.rayas = E.C.rayas ? 1 : 0;
}
