// HOJALATA — la casa vista desde un autito: el atlas (cubos con letras, lomos de libros, etiquetas, la calle de
// la vidriera), la utilería (cubos, frascos de caramelos, trompo, osito, libros, ollas, bol del gato, pato de goma,
// bañadera, macetas, manguera, enanito, baúles, lámparas, casitas, arbolitos, regalos, foquitos, paredes y
// ventanas) y las seis pistas con su luz.
const ESC_ATLAS = 128;
function armarAtlas() {
  const C = ESC_ATLAS, cv = lienzo(C * 8, C * 8), g = cv.getContext('2d');
  const celda = (i, fn) => { g.save(); g.translate((i % 8) * C, Math.floor(i / 8) * C); g.beginPath(); g.rect(0, 0, C, C); g.clip(); fn(g); g.restore(); };
  const colsBloque = ['#d8352a', '#1f4fa8', '#3fae4f', '#f2b632', '#a04a9a', '#ff8a1f'];
  // 0-25: caras de cubos de madera con letras
  for (let i = 0; i < 26; i++) celda(i, g => {
    g.fillStyle = '#e8c48a'; g.fillRect(0, 0, C, C);
    g.fillStyle = 'rgba(160,110,60,0.25)'; for (let k = 0; k < 9; k++) g.fillRect(0, k * 15 + (i * 7) % 11, C, 3);
    g.lineWidth = 8; g.strokeStyle = colsBloque[i % 6]; g.strokeRect(10, 10, C - 20, C - 20);
    const L = String.fromCharCode(65 + i), k = 7.2, { p } = caminoLetras(L, k, false, 1);
    g.translate(C / 2 - anchoLetras(L) * k / 2, C / 2 - 5 * k); g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = colsBloque[(i + 2) % 6]; g.lineWidth = 15; g.stroke(p);
  });
  // 26-31: lomos de libros
  const colsLibro = ['#7a2a2a', '#2a4a7a', '#2f6a3a', '#8a6a2a', '#5a2a6a', '#2a2a30'];
  for (let i = 0; i < 6; i++) celda(26 + i, g => {
    g.fillStyle = colsLibro[i]; g.fillRect(0, 0, C, C);
    g.fillStyle = '#e8c96a'; g.fillRect(0, 14, C, 6); g.fillRect(0, C - 20, C, 6);
    g.fillStyle = 'rgba(255,240,200,0.8)'; for (let k = 0; k < 3; k++) g.fillRect(24 + k * 4, 40 + k * 14, C - 48 - k * 10, 6);
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 0, 6, C); g.fillRect(C - 6, 0, 6, C);
  });
  // 32: bolsa de harina (espiga) · 33: caja de galletitas · 34: jabón · 35: champú · 36: bol del gato (pescadito)
  celda(32, g => { g.fillStyle = '#f4ead6'; g.fillRect(0, 0, C, C); g.fillStyle = '#1f4fa8'; g.fillRect(0, 0, C, 22); g.fillRect(0, C - 22, C, 22); g.strokeStyle = '#d9a441'; g.lineWidth = 5; g.beginPath(); g.moveTo(64, 100); g.lineTo(64, 34); g.stroke(); for (let k = 0; k < 5; k++) for (const s of [-1, 1]) { g.fillStyle = '#d9a441'; g.beginPath(); g.ellipse(64 + s * 9, 44 + k * 11, 9, 5, s * 0.6, 0, TAU); g.fill(); } });
  celda(33, g => { g.fillStyle = '#d8352a'; g.fillRect(0, 0, C, C); g.fillStyle = '#f2b632'; for (const [x, y] of [[36, 40], [88, 52], [52, 92], [96, 100]]) { g.beginPath(); g.arc(x, y, 18, 0, TAU); g.fill(); g.fillStyle = '#7a4a2a'; for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(x - 8 + (k % 2) * 14, y - 6 + (k >> 1) * 12, 3, 0, TAU); g.fill(); } g.fillStyle = '#f2b632'; } });
  celda(34, g => { g.fillStyle = '#f7d6e8'; g.fillRect(0, 0, C, C); g.strokeStyle = '#ffffff'; g.lineWidth = 4; for (const [x, y, r] of [[40, 50, 18], [80, 40, 12], [70, 84, 22], [30, 94, 10]]) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke(); } });
  celda(35, g => { g.fillStyle = '#3fb0c8'; g.fillRect(0, 0, C, C); g.fillStyle = '#ffffff'; g.fillRect(20, 30, C - 40, C - 60); g.fillStyle = '#3fb0c8'; g.beginPath(); g.ellipse(64, 64, 18, 26, 0, 0, TAU); g.fill(); });
  celda(36, g => { g.fillStyle = '#f0f0f6'; g.fillRect(0, 0, C, C); g.fillStyle = '#4a8ad8'; g.beginPath(); g.ellipse(58, 64, 30, 16, 0, 0, TAU); g.fill(); g.beginPath(); g.moveTo(84, 64); g.lineTo(108, 46); g.lineTo(108, 82); g.closePath(); g.fill(); g.fillStyle = '#ffffff'; g.beginPath(); g.arc(44, 60, 4, 0, TAU); g.fill(); });
  // 37: cartel de la juguetería (la llave de dar cuerda)
  celda(37, g => {
    g.fillStyle = '#1f4fa8'; g.fillRect(0, 0, C, C); g.strokeStyle = '#f2b632'; g.lineWidth = 6; g.strokeRect(8, 8, C - 16, C - 16);
    g.strokeStyle = '#f2b632'; g.lineWidth = 9; g.beginPath(); g.moveTo(64, 98); g.lineTo(64, 60); g.stroke();
    for (const s of [-1, 1]) { g.beginPath(); g.arc(64 + s * 17, 44, 15, 0, TAU); g.stroke(); }
    g.fillStyle = '#d8352a'; for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(20 + k * 17.6, 116, 4, 0, TAU); g.fill(); }
  });
  // 38: póster de una carrera
  celda(38, g => {
    g.fillStyle = '#f6e7c6'; g.fillRect(0, 0, C, C);
    for (let k = 0; k < 12; k++) { g.fillStyle = k % 2 ? '#f2b632' : '#f6e7c6'; g.beginPath(); g.moveTo(64, 70); g.arc(64, 70, 100, k / 12 * TAU, (k + 1) / 12 * TAU); g.fill(); }
    g.fillStyle = '#d8352a'; g.beginPath(); g.ellipse(64, 76, 40, 16, 0, 0, TAU); g.fill(); g.fillStyle = '#1b1a2e'; for (const x of [38, 90]) { g.beginPath(); g.arc(x, 92, 10, 0, TAU); g.fill(); }
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(64, 70, 9, 0, TAU); g.fill();
  });
  // 39: reloj · 40: estrella · 41: carta · 42: rayas de tren · 43: papel de regalo a rayas · 44: a lunares · 45: foto
  celda(39, g => { g.fillStyle = '#f6efe0'; g.fillRect(0, 0, C, C); g.strokeStyle = '#1b1a2e'; g.lineWidth = 5; g.beginPath(); g.arc(64, 64, 52, 0, TAU); g.stroke(); for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; g.beginPath(); g.moveTo(64 + Math.cos(a) * 42, 64 + Math.sin(a) * 42); g.lineTo(64 + Math.cos(a) * 50, 64 + Math.sin(a) * 50); g.stroke(); } g.lineWidth = 6; g.beginPath(); g.moveTo(64, 64); g.lineTo(64, 28); g.moveTo(64, 64); g.lineTo(90, 70); g.stroke(); });
  celda(40, g => { g.fillStyle = '#1f4fa8'; g.fillRect(0, 0, C, C); g.fillStyle = '#f2b632'; g.beginPath(); for (let k = 0; k < 10; k++) { const a = k / 10 * TAU - PI / 2, r = k % 2 ? 22 : 52; g.lineTo(64 + Math.cos(a) * r, 64 + Math.sin(a) * r); } g.fill(); });
  celda(41, g => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, C, C); g.strokeStyle = '#d8352a'; g.lineWidth = 4; g.strokeRect(8, 8, C - 16, C - 16); g.fillStyle = '#d8352a'; g.beginPath(); g.moveTo(64, 34); g.bezierCurveTo(30, 0, 10, 60, 64, 96); g.bezierCurveTo(118, 60, 98, 0, 64, 34); g.fill(); });
  celda(42, g => { g.fillStyle = '#2f6a3a'; g.fillRect(0, 0, C, C); g.fillStyle = '#f2b632'; g.fillRect(0, 50, C, 10); g.fillStyle = '#d8352a'; g.fillRect(0, 64, C, 6); g.fillStyle = '#f6e7c6'; for (let k = 0; k < 4; k++) g.fillRect(10 + k * 30, 16, 20, 22); });
  celda(43, g => { g.fillStyle = '#d8352a'; g.fillRect(0, 0, C, C); g.fillStyle = '#ffffff'; for (let k = -2; k < 8; k++) { g.save(); g.translate(k * 24, 0); g.transform(1, 0, -0.6, 1, 0, 0); g.fillRect(0, 0, 10, C); g.restore(); } });
  celda(44, g => { g.fillStyle = '#3fae4f'; g.fillRect(0, 0, C, C); g.fillStyle = '#f2b632'; for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) { g.beginPath(); g.arc(x * 28 + (y % 2) * 14 + 8, y * 28 + 8, 6, 0, TAU); g.fill(); } });
  celda(45, g => { g.fillStyle = '#8a6a4a'; g.fillRect(0, 0, C, C); g.fillStyle = '#f0e6d0'; g.fillRect(12, 12, C - 24, C - 24); g.fillStyle = '#9ac0e0'; g.fillRect(18, 18, C - 36, 50); g.fillStyle = '#5a8a4a'; g.fillRect(18, 68, C - 36, 42); g.fillStyle = '#d8352a'; g.fillRect(52, 74, 24, 14); });
  // 46: cielo de noche · 47: mapa del tesoro
  celda(46, g => { const gr = g.createLinearGradient(0, 0, 0, C); gr.addColorStop(0, '#0a1030'); gr.addColorStop(1, '#2a3a70'); g.fillStyle = gr; g.fillRect(0, 0, C, C); g.fillStyle = '#ffffff'; const r = rngSemilla(4); for (let k = 0; k < 40; k++) g.fillRect(r() * C, r() * C * 0.8, 2, 2); g.fillStyle = '#fff6c8'; g.beginPath(); g.arc(92, 30, 12, 0, TAU); g.fill(); });
  celda(47, g => { g.fillStyle = '#e8d4a0'; g.fillRect(0, 0, C, C); g.strokeStyle = '#8a5a2a'; g.lineWidth = 3; g.setLineDash([6, 5]); g.beginPath(); g.moveTo(16, 100); g.bezierCurveTo(40, 40, 80, 110, 104, 30); g.stroke(); g.setLineDash([]); g.strokeStyle = '#d8352a'; g.lineWidth = 6; g.beginPath(); g.moveTo(96, 22); g.lineTo(112, 38); g.moveTo(112, 22); g.lineTo(96, 38); g.stroke(); });
  // 48-51: etiquetas de cajas de juguetes (robot, avión, muñeca, pelota)
  const etq = [['#d8352a', 'robot'], ['#1f4fa8', 'avion'], ['#f47eb4', 'muneca'], ['#3fae4f', 'pelota']];
  etq.forEach(([col, tipo], i) => celda(48 + i, g => {
    g.fillStyle = col; g.fillRect(0, 0, C, C); g.fillStyle = '#f6e7c6'; g.fillRect(14, 14, C - 28, C - 28);
    g.fillStyle = col; g.strokeStyle = '#1b1a2e'; g.lineWidth = 3;
    if (tipo === 'robot') { g.fillRect(44, 30, 40, 34); g.fillRect(38, 66, 52, 40); g.fillStyle = '#7af0ff'; g.fillRect(52, 40, 8, 8); g.fillRect(68, 40, 8, 8); }
    else if (tipo === 'avion') { g.beginPath(); g.ellipse(64, 64, 44, 10, -0.2, 0, TAU); g.fill(); g.fillRect(52, 34, 14, 60); }
    else if (tipo === 'muneca') { g.beginPath(); g.arc(64, 44, 16, 0, TAU); g.fill(); g.beginPath(); g.moveTo(40, 108); g.lineTo(64, 58); g.lineTo(88, 108); g.fill(); }
    else { g.beginPath(); g.arc(64, 64, 34, 0, TAU); g.fill(); g.fillStyle = '#ffffff'; g.fillRect(30, 58, 68, 10); }
  }));
  // fila 7 entera: la calle al amanecer (panorama para la vidriera)
  {
    g.save(); g.translate(0, 7 * C);
    const gr = g.createLinearGradient(0, 0, 0, C); gr.addColorStop(0, '#6a8ad8'); gr.addColorStop(0.55, '#f6b88a'); gr.addColorStop(1, '#ffe2a8');
    g.fillStyle = gr; g.fillRect(0, 0, C * 8, C);
    const r = rngSemilla(9); let x = 0;
    while (x < C * 8) { const w = 40 + r() * 70, h = 30 + r() * 70; g.fillStyle = ['#5a4a6a', '#6a5a7a', '#4a4060', '#7a6a8a'][Math.floor(r() * 4)]; g.fillRect(x, C - h, w, h); g.fillStyle = 'rgba(255,220,140,0.9)'; for (let wy = C - h + 8; wy < C - 10; wy += 14) for (let wx = x + 6; wx < x + w - 8; wx += 12) if (r() < 0.45) g.fillRect(wx, wy, 6, 8); x += w + 4; }
    g.restore();
  }
  return cv;
}
function uvCelda(i) { const u0 = (i % 8) / 8, v0 = Math.floor(i / 8) / 8, e = 0.002; return [[u0 + e, v0 + 1 / 8 - e], [u0 + 1 / 8 - e, v0 + 1 / 8 - e], [u0 + 1 / 8 - e, v0 + e], [u0 + e, v0 + e]]; }

// ---------- utilería ----------
const U = {
  caja(G, x, y, z, w, h, d, col, mat, yaw, o) { conT(lugar(x, y, z, yaw || 0), () => geoCaja(G, -w / 2, 0, -d / 2, w / 2, h, d / 2, cc(col), mat || 0, o)); },
  cajaR(G, x, y, z, w, h, d, col, mat, yaw, e) { conT(lugar(x, y, z, yaw || 0), () => geoElipsoide(G, 0, h / 2, 0, w / 2, h / 2, d / 2, cc(col), { e: e || 0.25, flag: mat || 0, nu: 16, nv: 10 })); },
  esfera(G, x, y, z, r, col, mat, nu) { geoElipsoide(G, x, y, z, r, r, r, cc(col), { flag: mat || 0, nu: nu || 14, nv: Math.max(6, (nu || 14) * 0.7 | 0) }); },
  cil(G, x, y, z, r, h, col, mat, nu) { geoCilindro(G, x, y, z, r, h, cc(col), mat || 0, { nu: nu || 16 }); },
  torno(G, x, y, z, perfil, col, mat, o) { o = o || {}; conT(lugar(x, y, z, o.yaw || 0, o.esc || 1), () => geoTorno(G, perfil, cc(col), Object.assign({ flag: mat || 0, nu: 20 }, o))); },
  // un cubo de madera con letras en los costados
  bloque(G, x, y, z, t, letra, yaw, tilt) {
    conT(lugar(x, y, z, yaw || 0, 1, 1, 1, 0, tilt || 0), () => {
      const h = t / 2, cara = (k) => uvCelda((letra + k) % 26), col = cc('#ffffff');
      geoQuad(G, [-h, 0, h], [h, 0, h], [h, t, h], [-h, t, h], col, 20, cara(0));
      geoQuad(G, [h, 0, -h], [-h, 0, -h], [-h, t, -h], [h, t, -h], col, 20, cara(1));
      geoQuad(G, [h, 0, h], [h, 0, -h], [h, t, -h], [h, t, h], col, 20, cara(2));
      geoQuad(G, [-h, 0, -h], [-h, 0, h], [-h, t, h], [-h, t, -h], col, 20, cara(3));
      geoQuad(G, [-h, t, h], [h, t, h], [h, t, -h], [-h, t, -h], col, 20, cara(4));
    });
  },
  frasco(G, x, y, z, r, h, rr) {
    const cols = ['#ff4a5a', '#ffd23f', '#5ad0ff', '#7ae05a', '#ff8ad8', '#ffffff', '#ff8a1f'];
    for (let k = 0; k < 34; k++) { const a = rr() * TAU, d = Math.sqrt(rr()) * (r - 0.3), yy = 0.35 + rr() * (h - 0.9); U.esfera(G, x + Math.cos(a) * d, y + yy, z + Math.sin(a) * d, 0.32, cols[k % cols.length], 13, 8); }
    U.torno(G, x, y, z, [[0, 0], [r, 0], [r, 0.18], [r * 0.95, 0.22]], '#d8dde6', 7);
    U.torno(G, x, y + h - 0.2, z, [[r * 0.97, 0], [r * 1.02, 0.05], [r * 1.02, 0.45], [r * 0.85, 0.55], [0, 0.6]], '#d8352a', 19);
  },
  trompo(G, x, y, z, r) { U.torno(G, x, y, z, [[0, 0], [r * 0.2, 0.3 * r], [r, 0.9 * r], [r * 0.95, 1.2 * r], [r * 0.3, 1.35 * r], [r * 0.12, 1.4 * r], [r * 0.12, 1.9 * r], [0, 1.95 * r]], '#ffffff', 19, { cols: ['#c9ced8', '#d8352a', '#f2b632', '#1f4fa8', '#3fae4f', '#d8352a', '#c9ced8'] }); },
  pelota(G, x, y, z, r, c1, c2) { const P = []; for (let k = 0; k <= 12; k++) { const a = -PI / 2 + k / 12 * PI; P.push([Math.cos(a) * r, Math.sin(a) * r + r]); } U.torno(G, x, y, z, P, c1, 13, { cols: [c1, c1, c1, c2, c2, c1, c1, c2, c2, c1, c1, c1], nu: 24 }); },
  osito(G, x, y, z, e, yaw) {
    conT(lugar(x, y, z, yaw || 0, e), () => {
      const c = cc('#b07a48'), cl = cc('#e8c49a'), n = cc('#2a1a14'), E = (a, b, cz, rx, ry, rz, col, f) => geoElipsoide(G, a, b, cz, rx, ry, rz, col, { flag: f == null ? 10 : f, nu: 14, nv: 10 });
      E(0, 2.2, 0, 1.7, 2.0, 1.5, c); E(0, 2.0, 0.9, 1.1, 1.3, 0.7, cl);
      E(0, 5.0, 0.1, 1.45, 1.35, 1.3, c); E(0, 4.7, 1.2, 0.65, 0.5, 0.5, cl); E(0, 4.9, 1.65, 0.22, 0.17, 0.15, n, 13);
      for (const s of [-1, 1]) { E(s * 1.05, 6.1, 0, 0.5, 0.5, 0.3, c); E(s * 1.05, 6.1, 0.12, 0.3, 0.3, 0.2, cl); E(s * 0.5, 5.35, 1.15, 0.16, 0.18, 0.12, n, 13); E(s * 1.8, 2.8, 0.5, 0.55, 1.3, 0.55, c); E(s * 1.0, 0.6, 1.3, 0.75, 0.6, 1.1, c); E(s * 1.0, 0.6, 2.25, 0.5, 0.45, 0.12, cl); }
      geoElipsoide(G, 0, 3.95, 0.5, 1.1, 0.25, 1.0, cc('#d8352a'), { flag: 15, nu: 12, nv: 6 });
    });
  },
  libro(G, x, y, z, w, h, d, yaw, v, tumbado) {
    conT(lugar(x, y, z, yaw || 0, 1, 1, 1, 0, tumbado ? PI / 2 : 0), () => {
      const tapa = cc(['#7a2a2a', '#2a4a7a', '#2f6a3a', '#8a6a2a', '#5a2a6a', '#2a2a30'][v % 6]), hojas = cc('#f2ead6');
      geoCaja(G, -w / 2, 0, -d / 2, w / 2, h, d / 2, hojas, 15, { sin: '-x' });
      geoCaja(G, -w / 2 - 0.04, -0.02, -d / 2 - 0.04, w / 2 + 0.04, 0.06, d / 2 + 0.04, tapa, 15);
      geoCaja(G, -w / 2 - 0.04, h - 0.06, -d / 2 - 0.04, w / 2 + 0.04, h + 0.02, d / 2 + 0.04, tapa, 15);
      geoQuad(G, [-w / 2 - 0.05, -0.02, -d / 2 - 0.04], [-w / 2 - 0.05, -0.02, d / 2 + 0.04], [-w / 2 - 0.05, h + 0.02, d / 2 + 0.04], [-w / 2 - 0.05, h + 0.02, -d / 2 - 0.04], cc('#ffffff'), 20, uvCelda(26 + v % 6));
    });
  },
  lapiz(G, x, y, z, largo, yaw, col) {
    conT(lugar(x, y + 0.2, z, yaw || 0, 1, 1, 1, PI / 2), () => {
      geoTorno(G, [[0.2, 0], [0.2, largo * 0.85]], cc(col), { nu: 6, flag: 13 });
      geoTorno(G, [[0.2, largo * 0.85], [0.07, largo * 0.97], [0, largo]], cc('#e8c48a'), { nu: 6, flag: 4 });
      geoTorno(G, [[0, -0.2], [0.2, -0.15], [0.2, 0]], cc('#f47eb4'), { nu: 8, flag: 13 });
    });
  },
  carretel(G, x, y, z, r, h, col) { U.torno(G, x, y, z, [[0, 0], [r * 1.25, 0], [r * 1.25, 0.15], [r, 0.18], [r, h - 0.18], [r * 1.25, h - 0.15], [r * 1.25, h], [0, h]], col, 24, { flags: [4, 4, 4, 24, 4, 4, 4], cols: ['#e8c48a', '#e8c48a', '#e8c48a', col, '#e8c48a', '#e8c48a', '#e8c48a'] }); },
  taza(G, x, y, z, r, h, col) { U.torno(G, x, y, z, [[0, 0], [r * 0.85, 0], [r, 0.12], [r, h], [r * 0.9, h], [r * 0.9, 0.25], [0, 0.25]], col, 16); conT(lugar(x + r + 0.25, y + h * 0.55, z, 0), () => geoAro(G, h * 0.25, 0.12, cc(col), 16, { nu: 12, nv: 6 })); },
  olla(G, x, y, z, r, h, col) { U.torno(G, x, y, z, [[0, 0], [r, 0], [r, h], [r * 1.05, h + 0.05], [r * 0.95, h + 0.05], [r * 0.95, 0.2], [0, 0.2]], col, 19); for (const s of [-1, 1]) U.caja(G, x + s * (r + 0.35), y + h * 0.75, z, 0.7, 0.25, 0.6, '#2a2a30', 13); U.torno(G, x, y + h + 0.6, z, [[r * 1.02, 0], [r * 0.6, 0.35], [0.2, 0.45], [0.25, 0.8], [0, 0.85]], '#c9ced8', 2); },
  fruta(G, x, y, z, r, col, hoja) { U.esfera(G, x, y + r, z, r, col, 13, 12); if (hoja) { geoCapsula(G, [x, y + r * 1.9, z], [x, y + r * 2.25, z], 0.06, 0.05, cc('#5a3a20'), { nu: 5, nv: 3 }); U.esfera(G, x + 0.25, y + r * 2.1, z, 0.22, '#4a9a3a', 13, 8); } },
  bolGato(G, x, y, z, r) { U.torno(G, x, y, z, [[0, 0], [r * 0.85, 0], [r, r * 0.45], [r * 0.92, r * 0.5], [r * 0.75, 0.25], [0, 0.25]], '#f0f0f6', 16); for (let k = 0; k < 22; k++) { const a = k * 2.4, d = Math.sqrt(k / 22) * r * 0.62; U.esfera(G, x + Math.cos(a) * d, y + 0.35, z + Math.sin(a) * d, 0.22, k % 3 ? '#a0603a' : '#c08050', 0, 6); } },
  bolsa(G, x, y, z, w, h, d, celda, yaw) { conT(lugar(x, y, z, yaw || 0), () => { geoElipsoide(G, 0, h / 2, 0, w / 2, h / 2, d / 2, cc('#f4ead6'), { e: 0.35, flag: 15, nu: 14, nv: 10 }); geoQuad(G, [-w * 0.36, h * 0.15, d / 2 + 0.02], [w * 0.36, h * 0.15, d / 2 + 0.02], [w * 0.36, h * 0.85, d / 2 + 0.02], [-w * 0.36, h * 0.85, d / 2 + 0.02], cc('#ffffff'), 20, uvCelda(celda)); }); },
  mesa(G, x0, z0, x1, z1, h, col, pata) {
    const t = 0.5, p = pata || 0.6;
    U.caja(G, (x0 + x1) / 2, h - t, (z0 + z1) / 2, x1 - x0, t, z1 - z0, col, 4);
    for (const [x, z] of [[x0 + p * 2, z0 + p * 2], [x1 - p * 2, z0 + p * 2], [x0 + p * 2, z1 - p * 2], [x1 - p * 2, z1 - p * 2]]) U.caja(G, x, 0, z, p * 2, h - t, p * 2, col, 4);
  },
  silla(G, x, z, yaw, h, col) {
    conT(lugar(x, 0, z, yaw || 0), () => {
      const c = cc(col || '#a0603a'), H = h || 9;
      geoCaja(G, -3.5, H - 0.5, -3.5, 3.5, H, 3.5, c, 4);
      for (const [a, b] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) geoCaja(G, a - 0.35, 0, b - 0.35, a + 0.35, H - 0.5, b + 0.35, c, 4);
      for (const a of [-3, 3]) geoCaja(G, a - 0.35, H, -3.35, a + 0.35, H * 1.9, -2.65, c, 4);
      geoCaja(G, -3.3, H * 1.5, -3.4, 3.3, H * 1.85, -2.6, c, 4);
    });
  },
  patoGoma(G, x, y, z, e, yaw) {
    conT(lugar(x, y, z, yaw || 0, e), () => {
      const am = cc('#ffd23f'), na = cc('#ff8a1f');
      geoElipsoide(G, 0, 0.8, 0, 1.2, 0.8, 1.5, am, { flag: 13, nu: 16, nv: 10, abajo: -0.6 });
      geoElipsoide(G, 0, 0.95, -1.3, 0.5, 0.6, 0.5, am, { flag: 13, nu: 10, nv: 8 });
      geoElipsoide(G, 0, 2.0, 0.9, 0.75, 0.72, 0.72, am, { flag: 13, nu: 14, nv: 10 });
      geoElipsoide(G, 0, 1.85, 1.6, 0.42, 0.16, 0.4, na, { flag: 13, nu: 10, nv: 6 });
      for (const s of [-1, 1]) { geoElipsoide(G, s * 0.38, 2.25, 1.45, 0.14, 0.17, 0.08, cc('#1b1a2e'), { flag: 13, nu: 8, nv: 6 }); geoElipsoide(G, s * 1.1, 1.0, 0, 0.25, 0.45, 0.8, am, { flag: 13, nu: 10, nv: 6 }); }
    });
  },
  maceta(G, x, y, z, r, h, tipo, rr) {
    U.torno(G, x, y, z, [[0, 0], [r * 0.75, 0], [r, h], [r * 1.1, h], [r * 1.1, h + 0.5], [r * 0.95, h + 0.5], [r * 0.95, h - 0.3], [0, h - 0.3]], '#c8643a', 0);
    if (tipo === 'flores') { for (let k = 0; k < 7; k++) { const a = k / 7 * TAU, d = r * 0.5 * rr(), hh = h + 2 + rr() * 3; geoCapsula(G, [x + Math.cos(a) * d * 0.3, y + h, z + Math.sin(a) * d * 0.3], [x + Math.cos(a) * d, y + hh, z + Math.sin(a) * d], 0.12, 0.1, cc('#3f8a3a'), { nu: 5, nv: 3 }); const fc = ['#ff4a5a', '#ffd23f', '#ff8ad8', '#ffffff', '#a04ad8'][k % 5]; for (let p = 0; p < 5; p++) { const b = p / 5 * TAU; U.esfera(G, x + Math.cos(a) * d + Math.cos(b) * 0.5, y + hh, z + Math.sin(a) * d + Math.sin(b) * 0.5, 0.4, fc, 13, 6); } U.esfera(G, x + Math.cos(a) * d, y + hh + 0.1, z + Math.sin(a) * d, 0.32, '#ffd23f', 13, 6); } }
    else if (tipo === 'cactus') { geoCapsula(G, [x, y + h - 0.3, z], [x, y + h + 4, z], r * 0.45, r * 0.4, cc('#4a9a4a'), { nu: 10, nv: 6 }); for (const s of [-1, 1]) geoCapsula(G, [x + s * r * 0.4, y + h + 1.8, z], [x + s * r * 0.9, y + h + 3.2, z], r * 0.22, r * 0.2, cc('#4a9a4a'), { nu: 8, nv: 5 }); }
    else { for (let k = 0; k < 9; k++) { const a = k / 9 * TAU + rr(), l = 2.5 + rr() * 2.5; geoElipsoide(G, x + Math.cos(a) * l * 0.4, y + h + l * 0.45, z + Math.sin(a) * l * 0.4, 0.5, l * 0.5, 0.9, cc('#3f8a3a'), { flag: 0, nu: 8, nv: 6 }); } }
  },
  enano(G, x, y, z, e, yaw) {
    conT(lugar(x, y, z, yaw || 0, e), () => {
      const E = (a, b, c, rx, ry, rz, col, f) => geoElipsoide(G, a, b, c, rx, ry, rz, cc(col), { flag: f || 16, nu: 14, nv: 10 });
      E(0, 1.4, 0, 1.2, 1.5, 1.1, '#2f5ab0'); E(0, 1.7, 0.55, 1.0, 0.9, 0.7, '#ffffff'); E(0, 3.1, 0, 0.9, 0.9, 0.9, '#f2c8a0'); E(0, 3.0, 0.8, 0.28, 0.26, 0.26, '#f08080');
      E(0, 2.55, 0.55, 0.85, 0.75, 0.55, '#ffffff');
      geoTorno(G, [[1.0, 3.5], [0.6, 4.6], [0.15, 5.6], [0, 5.8]], cc('#d8352a'), { flag: 16, nu: 14 });
      for (const s of [-1, 1]) { E(s * 0.32, 3.35, 0.78, 0.12, 0.14, 0.08, '#1b1a2e'); E(s * 0.55, 0.3, 0.2, 0.45, 0.3, 0.7, '#5a3a20'); }
    });
  },
  regadera(G, x, y, z, e, yaw) { conT(lugar(x, y, z, yaw || 0, e), () => { geoTorno(G, [[0, 0], [1.6, 0], [1.6, 2.6], [1.4, 2.8], [0, 2.8]], cc('#3fae7f'), { flag: 19, nu: 18 }); geoTubo(G, [[0, 1.0, 1.4], [0, 2.4, 3.2], [0, 3.4, 4.2]], 0.22, cc('#3fae7f'), 19); conT(lugar(0, 2.8, 0, 0), () => geoAro(G, 1.1, 0.14, cc('#3fae7f'), 19)); }); },
  baul(G, x, z, w, d, h, yaw, col, plano) {
    conT(lugar(x, 0, z, yaw || 0), () => {
      const c = cc(col || '#6a3a24'), f = cc('#2a2a30'), oro = cc('#d9a441');
      geoCaja(G, -w / 2, 0, -d / 2, w / 2, h * 0.75, d / 2, c, 4);
      if (plano) geoCaja(G, -w / 2 - 0.2, h * 0.75, -d / 2 - 0.2, w / 2 + 0.2, h, d / 2 + 0.2, c, 4);
      else conT(lugar(0, h * 0.75, 0, 0, 1, 1, 1, 0, PI / 2), () => geoTorno(G, [[0, -w / 2], [d / 2, -w / 2], [d / 2, w / 2], [0, w / 2]], c, { flag: 4, nu: 10, a0: -PI / 2, a1: PI / 2 }));
      for (const k of [-0.32, 0.32]) { geoCaja(G, k * w - 0.3, -0.01, -d / 2 - 0.05, k * w + 0.3, h * 0.75, d / 2 + 0.05, f, 19); }
      geoCaja(G, -0.5, h * 0.55, d / 2, 0.5, h * 0.72, d / 2 + 0.12, oro, 2);
    });
  },
  lampara(G, x, y, z, techo) { geoTubo(G, [[x, techo, z], [x, y + 1.2, z]], 0.08, cc('#2a2a30'), 0); U.torno(G, x, y + 0.9, z, [[0.15, 0.9], [1.6, 0], [1.5, -0.05], [0.12, 0.8]], '#2f6a3a', 19); U.esfera(G, x, y + 0.45, z, 0.5, '#fff2c0', 8, 10); },
  casita(G, x, z, w, d, h, col, techo, yaw, noche) {
    conT(lugar(x, 0, z, yaw || 0), () => {
      geoCaja(G, -w / 2, 0, -d / 2, w / 2, h, d / 2, cc(col), 15, { sin: '-y' });
      const t = cc(techo), r = h + w * 0.45;
      geoQuad(G, [-w / 2 - 0.2, h, d / 2 + 0.3], [-w / 2 - 0.2, h, -d / 2 - 0.3], [0, r, -d / 2 - 0.3], [0, r, d / 2 + 0.3], t, 15);
      geoQuad(G, [w / 2 + 0.2, h, -d / 2 - 0.3], [w / 2 + 0.2, h, d / 2 + 0.3], [0, r, d / 2 + 0.3], [0, r, -d / 2 - 0.3], t, 15);
      for (const s of [-1, 1]) geoQuad(G, [-w / 2 * s, h, s * d / 2], [w / 2 * s, h, s * d / 2], [0, r, s * d / 2], [0, r, s * d / 2], cc(col), 15);
      const v = cc(noche ? '#ffd890' : '#9ac8e8');
      for (const s of [-1, 1]) { geoQuad(G, [s * w * 0.3 - 0.4, h * 0.45, d / 2 + 0.01], [s * w * 0.3 + 0.4, h * 0.45, d / 2 + 0.01], [s * w * 0.3 + 0.4, h * 0.75, d / 2 + 0.01], [s * w * 0.3 - 0.4, h * 0.75, d / 2 + 0.01], v, noche ? 8 : 7); }
      geoQuad(G, [-0.45, 0, d / 2 + 0.01], [0.45, 0, d / 2 + 0.01], [0.45, h * 0.4, d / 2 + 0.01], [-0.45, h * 0.4, d / 2 + 0.01], cc('#6a3a24'), 4);
    });
  },
  arbolito(G, x, z, h, col) { const c = col || '#2f7a4a'; geoCapsula(G, [x, 0, z], [x, h * 0.3, z], h * 0.06, h * 0.05, cc('#6a4a2a'), { nu: 6, nv: 3 }); for (let k = 0; k < 3; k++) U.torno(G, x, h * (0.22 + k * 0.22), z, [[0, 0], [h * (0.32 - k * 0.07), 0.05], [0, h * 0.42]], c, 0, { nu: 12 }); },
  regalo(G, x, y, z, w, h, d, papel, cinta, yaw) {
    conT(lugar(x, y, z, yaw || 0), () => {
      geoCaja(G, -w / 2, 0, -d / 2, w / 2, h, d / 2, cc(papel), 13);
      const ci = cc(cinta), t = Math.min(w, d) * 0.08;
      geoCaja(G, -w / 2 - 0.02, -0.01, -t, w / 2 + 0.02, h + 0.02, t, ci, 2);
      geoCaja(G, -t, -0.01, -d / 2 - 0.02, t, h + 0.02, d / 2 + 0.02, ci, 2);
      for (const s of [-1, 1]) geoElipsoide(G, s * w * 0.12, h + w * 0.08, 0, w * 0.14, w * 0.09, w * 0.06, ci, { flag: 2, nu: 10, nv: 6 });
    });
  },
  foquitos(G, pts, cols) {
    geoTubo(G, pts, 0.05, cc('#2a3a2a'), 0, { nu: 5 });
    for (let i = 1; i < pts.length - 1; i += 2) U.esfera(G, pts[i][0], pts[i][1] - 0.25, pts[i][2], 0.22, cols[(i >> 1) % cols.length], 8, 8);
  },
  // pared vertical de (x0,z0) a (x1,z1), mirando a la izquierda del recorrido; con zócalo
  pared(G, x0, z0, x1, z1, h, col, mat, zocalo) {
    const L = Math.hypot(x1 - x0, z1 - z0);
    geoQuad(G, [x0, 0, z0], [x1, 0, z1], [x1, h, z1], [x0, h, z0], cc(col), mat || 18, [[0, 0], [L, 0], [L, h], [0, h]]);
    if (zocalo) { const nx = -(z1 - z0) / L * 0.15, nz = (x1 - x0) / L * 0.15; geoQuad(G, [x0 + nx, 0, z0 + nz], [x1 + nx, 0, z1 + nz], [x1 + nx, 1.6, z1 + nz], [x0 + nx, 1.6, z0 + nz], cc(zocalo), 4, [[0, 0], [L, 0], [L, 1.6], [0, 1.6]]); }
  },
  // ventana con luz: vidrio que brilla, marco y cruz de madera, cortinas
  ventana(G, x, y, z, w, h, yaw, luz, cortina, celda) {
    conT(lugar(x, y, z, yaw || 0), () => {
      if (celda != null) geoQuad(G, [-w / 2, 0, 0], [w / 2, 0, 0], [w / 2, h, 0], [-w / 2, h, 0], cc('#ffffff'), 22, uvCelda(celda));
      else geoQuad(G, [-w / 2, 0, 0], [w / 2, 0, 0], [w / 2, h, 0], [-w / 2, h, 0], cc(luz), 8);
      const m = cc('#f2ead6');
      geoCaja(G, -w / 2 - 0.6, -0.6, 0, w / 2 + 0.6, 0, 0.6, m, 4); geoCaja(G, -w / 2 - 0.6, h, 0, w / 2 + 0.6, h + 0.6, 0.6, m, 4);
      geoCaja(G, -w / 2 - 0.6, 0, 0, -w / 2, h, 0.6, m, 4); geoCaja(G, w / 2, 0, 0, w / 2 + 0.6, h, 0.6, m, 4);
      geoCaja(G, -0.25, 0, 0, 0.25, h, 0.35, m, 4); geoCaja(G, -w / 2, h * 0.58 - 0.25, 0, w / 2, h * 0.58 + 0.25, 0.35, m, 4);
      if (cortina) for (const s of [-1, 1]) for (let k = 0; k < 4; k++) geoElipsoide(G, s * (w / 2 + 0.8 - k * 0.9), h / 2, 0.9, 0.6, h / 2 + 0.4, 0.4, cc(cortina), { flag: 10, nu: 8, nv: 6 });
    });
  },
  // piso grande en baldosas de grilla (para que se pueda partir en trozos)
  piso(G, x0, z0, x1, z1, col, mat, y, paso) {
    const p = paso || 16, c = cc(col);
    for (let x = x0; x < x1; x += p) for (let z = z0; z < z1; z += p) { const xa = Math.min(x1, x + p), za = Math.min(z1, z + p); geoQuad(G, [x, y || 0, z], [x, y || 0, za], [xa, y || 0, za], [xa, y || 0, z], c, mat, [[x, z], [x, za], [xa, za], [xa, z]]); }
  },
  estante(G, x0, z0, x1, z1, y, prof, rr) {
    const L = Math.hypot(x1 - x0, z1 - z0), yaw = Math.atan2(x1 - x0, z1 - z0) - PI / 2;
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    conT(lugar(cx, y, cz, yaw), () => {
      geoCaja(G, -L / 2, -0.5, 0, L / 2, 0, prof, cc('#c8945a'), 4);
      let x = -L / 2 + 1;
      while (x < L / 2 - 4) {
        const w = 3 + rr() * 4, h = 3 + rr() * 6, k = Math.floor(rr() * 4);
        geoCaja(G, x, 0, 0.6, x + w, h, prof - 0.4, cc(['#d8352a', '#1f4fa8', '#f47eb4', '#3fae4f'][k]), 15, { sin: '-y' });
        geoQuad(G, [x + 0.3, h * 0.15, prof - 0.39], [x + w - 0.3, h * 0.15, prof - 0.39], [x + w - 0.3, h * 0.85, prof - 0.39], [x + 0.3, h * 0.85, prof - 0.39], cc('#ffffff'), 20, uvCelda(48 + k));
        x += w + 0.8 + rr() * 2;
      }
    });
  },
};
// ¿está lejos de la pista? (para tirar cosas sin pisarla)
function libreDePista(C, x, z, r) { for (let i = 0; i < C.N; i += 2) { const dx = C.px[i] - x, dz = C.pz[i] - z, m = C.w[i] / 2 + r + 0.6; if (dx * dx + dz * dz < m * m) return false; } return true; }

// ---------- las seis pistas ----------
// puntos: [x, z, y, ancho, peralte°, banderas]   (n sin barandas · i/d una sola · T turbo · J salto al final · H hueco ·
// m madera · j jabón · t toalla · a agua · x tierra)
const AMB_BASE = { sol: [-0.45, 0.78, -0.43], solCol: [2.5, 2.25, 1.9], cielo: [0.4, 0.44, 0.54], suelo: [0.27, 0.21, 0.16], techo: [1.0, 0.95, 0.86], pared: [0.72, 0.6, 0.46], piso: [0.4, 0.3, 0.2], venCol: [6.5, 6.0, 5.2], venTam: 0.93, nieblaCol: [0.8, 0.68, 0.54], niebla: 60, pista: [[0.93, 0.86, 0.72], [0.85, 0.2, 0.16], [0.12, 0.3, 0.66]], grado: [1.03, 1.0, 0.95], sat: 1.12, contraste: 1.1, expo: 0.88, vineta: 0.5, umbral: 1.7, luces: [] };
const PISTAS = [
  {
    id: 'jugueteria', musica: 2, riel: '#d8352a', columna: 'metal',
    puntos: [
      [0, 0, 0, 6, 0, 'c'], [20, 0, 0, 6, 0, ''], [40, 0, 0, 5.8, 0, ''], [56, 12, 0, 5.5, 0, ''], [56, 32, 0, 5.5, 0, 'k'], [40, 40, 0, 5.5, 0, ''],
      [26, 35, 0.6, 5, 0, 'mT'], [12, 40, 2.6, 4.8, 0, 'm'], [-4, 34, 3, 4.8, 0, 'cJ'], [-18, 42, 3, 4.6, 0, 'H'], [-32, 41, 0.9, 5, 0, ''],
      [-46, 32, 0, 5.5, 0, 'k'], [-50, 16, 0, 5.2, 0, ''], [-38, 6, 0, 5.5, 0, ''], [-20, -6, 0, 6, 0, 'T'], [-8, -2, 0, 6, 0, 'k'],
    ],
    sinColumnas: [[-17, 27, 16, 50]],
    amb: {},
    decorar(G, C, rr) {
      U.piso(G, -90, -40, 100, 90, '#c8905a', 4);
      U.pared(G, -80, -26, 84, -26, 60, '#e8d6b8', 18, '#8a5a3a'); U.pared(G, 84, -26, 84, 76, 60, '#e2ceb0', 18, '#8a5a3a'); U.pared(G, 84, 76, -80, 76, 60, '#e8d6b8', 18, '#8a5a3a'); U.pared(G, -80, 76, -80, -26, 60, '#e2ceb0', 18, '#8a5a3a');
      U.ventana(G, -30, 8, -25.9, 46, 30, 0, '#fff4dc', '#d8352a');
      U.caja(G, 24, 20, -25.4, 16, 16, 0.4, '#ffffff', 20, 0, { uvFrente: uvCelda(37) });
      for (const y of [6, 16, 26]) { U.estante(G, 84, 0, 84, 70, y, 6, rr); U.estante(G, 80, 76, -76, 76, y, 6, rr); U.estante(G, -80, 70, -80, -20, y, 6, rr); }
      // la mesa de exhibición (la pista pasa por arriba)
      U.mesa(G, -17, 27, 16, 50, 3.03, '#b8804a', 0.8);
      U.frasco(G, 12, 3.03, 47, 2.2, 5.5, rr); U.frasco(G, -13, 3.03, 29.5, 1.8, 4.5, rr); U.frasco(G, 6, 3.03, 29.5, 1.6, 4.0, rr);
      U.caja(G, -5, 3.03, 46.5, 7, 4, 5, '#3a3a44', 19); U.caja(G, -5, 7.03, 45.2, 7, 2.2, 2.4, '#3a3a44', 19);
      for (let k = 0; k < 12; k++) U.caja(G, -7.6 + (k % 4) * 1.7, 7.03, 47.3 + Math.floor(k / 4) * 0.9, 1.1, 0.3, 0.6, '#f6e7c6', 2);
      // en el medio de la pista: torre de cubos, tambor, trompo, cajón de juguetes, pelota, osito
      let L = 0; for (let k = 0; k < 4; k++) for (let j = 0; j < 4 - k; j++) U.bloque(G, 40 + j * 2.6 + k * 1.3, k * 2.5, 20 + (j % 2) * 0.3, 2.5, L++, (rr() - 0.5) * 0.3);
      U.bloque(G, 31, 0, 13, 2.5, 7, 0.6); U.bloque(G, 28, 0, 15.5, 2.5, 3, -0.4);
      U.torno(G, -38, 0, 19, [[0, 0], [3.6, 0], [3.6, 0.35], [3.4, 0.4], [3.4, 3.6], [3.6, 3.65], [3.6, 4.0], [0, 4.0]], '#ffffff', 13, { cols: ['#d9a441', '#d9a441', '#d9a441', '#d8352a', '#d9a441', '#d9a441', '#f6e7c6'], flags: [2, 2, 2, 13, 2, 2, 10] });
      U.trompo(G, 6, 0, 18, 2.4); U.pelota(G, 20, 0, 22, 2.8, '#1f4fa8', '#f2b632');
      U.caja(G, -14, 0, 14, 11, 4.5, 7, '#c8945a', 4); U.pelota(G, -17, 4.5, 14, 1.6, '#d8352a', '#ffffff'); U.osito(G, -12, 4.5, 14.5, 0.45, 0.4);
      U.osito(G, -26, 0, 10, 0.9, 0.9);
      for (let k = 0; k < 14; k++) { const x = rr() * 150 - 70, z = rr() * 90 - 20; if (libreDePista(C, x, z, 2)) U.bloque(G, x, 0, z, 2.2, Math.floor(rr() * 26), rr() * 3); }
      for (let k = 0; k < 6; k++) { const x = rr() * 140 - 65, z = rr() * 80 - 15; if (libreDePista(C, x, z, 2)) U.lapiz(G, x, 0, z, 7, rr() * 6, ['#d8352a', '#1f4fa8', '#3fae4f', '#f2b632'][k % 4]); }
    },
  },
  {
    id: 'cocina', musica: 2, riel: '#1f4fa8', columna: 'madera',
    puntos: [
      [0, 0, 0, 6, 0, 'c'], [22, 0, 0, 6, 0, ''], [38, -8, 0, 5.2, 0, ''], [52, -2, 0, 5, 0, 'k'], [62, 12, 0, 5.2, 0, ''], [56, 28, 0, 5.5, 0, ''],
      [42, 34, 0.5, 5, 0, 'TJ'], [30, 30, 1.6, 5, 0, 'H'], [18, 33, 0.4, 5, 0, ''], [6, 40, 0, 5.5, 0, 'c'], [-10, 42, 1.2, 3.4, 0, 'nm'], [-24, 38, 1.2, 3.4, 0, 'nm'],
      [-34, 28, 0, 5, 0, ''], [-36, 14, 0, 5.2, 0, 'k'], [-34, 3, 0, 5.2, 0, ''], [-36, -6, 0, 5.2, 0, ''], [-30, -12, 0, 5.4, 0, ''], [-16, -13, 0, 5.8, 0, 'T'],
    ],
    sinColumnas: [],
    amb: { sol: [0.5, 0.8, -0.35], solCol: [2.5, 2.35, 2.1], cielo: [0.42, 0.46, 0.54], suelo: [0.28, 0.26, 0.23], techo: [1.0, 1.0, 0.98], pared: [0.75, 0.72, 0.62], piso: [0.5, 0.48, 0.44], venCol: [7.5, 7.2, 6.5], nieblaCol: [0.82, 0.8, 0.72], pista: [[0.95, 0.94, 0.88], [0.15, 0.4, 0.75], [0.9, 0.3, 0.2]], grado: [1.0, 1.0, 0.98] },
    decorar(G, C, rr) {
      U.piso(G, -90, -50, 110, 90, '#d8d2c4', 5);
      for (const [x0, z0, x1, z1] of [[-80, -34, 92, -34], [92, -34, 92, 74], [92, 74, -80, 74], [-80, 74, -80, -34]]) U.pared(G, x0, z0, x1, z1, 60, '#f6f0dc', 5, '#c8b890');
      U.ventana(G, 50, 14, -33.9, 34, 26, 0, '#fffbea', '#f2b632');
      // muebles de cocina contra la pared del fondo
      U.caja(G, 6, 0, -30, 90, 18, 8, '#7ab0c8', 13); U.caja(G, 6, 18, -30, 92, 1.2, 9, '#e8e0d0', 16);
      U.olla(G, -12, 19.2, -30, 4, 4, '#c9ced8'); U.taza(G, 10, 19.2, -29, 1.4, 2.4, '#d8352a'); U.caja(G, 26, 19.2, -30, 4, 7, 3, '#ffffff', 20, 0.1, { uvFrente: uvCelda(33) });
      U.caja(G, -40, 0, -26, 18, 44, 14, '#e8eef2', 16);   // heladera
      U.caja(G, -40, 30, -18.9, 1, 8, 0.8, '#c9ced8', 2);
      // la mesa y las sillas (patas gruesas entre la pista)
      U.mesa(G, -6, 4, 46, 26, 22, '#a8703a', 1.0);
      U.silla(G, 20, -14, 0.1); U.silla(G, 70, 30, -1.5); U.silla(G, -48, 30, 1.4);
      // el bol del gato, la bolsa de harina (rampa del salto), la leche volcada y la cuchara de madera
      U.bolGato(G, 50, 0, 12, 3.4); U.bolGato(G, 44, 0, 18, 2.4);
      U.bolsa(G, 34, 0, 31, 7, 1.55, 5, 32, 0.3); U.bolsa(G, 26, 0, 24, 6, 7, 4, 32, 0.2);
      geoElipsoide(G, 22, 0.03, 32, 6, 0.02, 4.5, cc('#ffffff'), { flag: 7, nu: 16, nv: 4 });
      geoElipsoide(G, -17, 0.03, 40, 9, 0.02, 4, cc('#cfe8ff'), { flag: 7, nu: 16, nv: 4 });
      U.fruta(G, 12, 0, 18, 1.5, '#ff8a1f', true); U.fruta(G, 9, 0, 22, 1.4, '#d8352a', true); U.fruta(G, 15, 0, 23, 1.5, '#ff8a1f', true);
      U.olla(G, -14, 0, 18, 3.5, 3.5, '#d8352a'); U.taza(G, -6, 0, 52, 1.5, 2.6, '#3fae4f'); U.taza(G, 0, 0, 56, 1.4, 2.4, '#f2b632');
      for (let k = 0; k < 10; k++) { const x = rr() * 150 - 70, z = rr() * 90 - 30; if (libreDePista(C, x, z, 2)) U.fruta(G, x, 0, z, 1.2 + rr() * 0.6, ['#ff8a1f', '#d8352a', '#ffd23f', '#7ae05a'][k % 4], true); }
    },
  },
  {
    id: 'bano', musica: 2, riel: '#1f8fd0', columna: 'metal',
    puntos: [
      [0, 0, 0, 6, 0, 'c'], [20, 0, 0, 6, 0, ''], [34, 6, 0, 5.4, 0, 'k'], [40, 20, 0, 5.2, 0, ''], [32, 32, 1.0, 4.8, 0, 'T'], [18, 36, 4.2, 4.4, 0, ''],
      [4, 36, 6.2, 3.6, 0, 'n'], [-12, 36, 6.2, 3.6, 0, 'nc'], [-25, 36, 6.2, 3.8, 0, 'nj'], [-37, 30, 3.4, 4.8, 0, 'j'], [-45, 18, 0.3, 5.2, 0, 'j'],
      [-40, 6, 0, 5.4, 0, 't'], [-28, 2, 0, 5.4, 0, 'k'], [-22, -10, 0, 5.4, 0, ''], [-10, -10, 0, 5.8, 0, 'T'],
    ],
    sinColumnas: [[-27, 30, 12, 44]],
    amb: { sol: [0.3, 0.85, 0.42], solCol: [2.2, 2.3, 2.45], cielo: [0.44, 0.5, 0.6], suelo: [0.3, 0.33, 0.38], techo: [0.95, 0.98, 1.0], pared: [0.6, 0.72, 0.8], piso: [0.5, 0.56, 0.62], venCol: [5, 5.4, 5.8], nieblaCol: [0.55, 0.72, 0.74], pista: [[0.98, 0.95, 0.88], [0.12, 0.5, 0.78], [0.95, 0.45, 0.6]], grado: [0.98, 1.0, 1.02], contraste: 1.14 },
    decorar(G, C, rr) {
      U.piso(G, -90, -40, 90, 90, '#7fb6cf', 5);
      for (const [x0, z0, x1, z1] of [[-80, -30, 80, -30], [80, -30, 80, 80], [80, 80, -80, 80], [-80, 80, -80, -30]]) U.pared(G, x0, z0, x1, z1, 60, '#9fd6c8', 5, '#3f8aa8');
      U.ventana(G, 20, 22, 79.9, 22, 18, PI, '#ffffff', '#ffffff');
      // la bañadera: el borde es la pista angosta, adentro hay agua
      const bx0 = -27, bx1 = 12, bz0 = 32, bz1 = 52, h = 6.22;
      U.caja(G, (bx0 + bx1) / 2, 0, (bz0 + bz1) / 2, bx1 - bx0, h, bz1 - bz0, '#ffffff', 16, 0, { sin: '+y' });
      U.caja(G, (bx0 + bx1) / 2, h - 0.01, bz0 + 3, bx1 - bx0, 0.01, 6, '#ffffff', 16, 0, { sin: '-y' });
      geoQuad(G, [bx0 + 1, h - 1.2, bz1 - 1], [bx1 - 1, h - 1.2, bz1 - 1], [bx1 - 1, h - 1.2, bz0 + 6], [bx0 + 1, h - 1.2, bz0 + 6], cc('#bfe6ff'), 7);
      U.patoGoma(G, -6, h - 1.2, 44, 1.3, 2.4); U.patoGoma(G, -24, h - 1.2, 47, 0.9, 0.6);
      for (let k = 0; k < 12; k++) geoElipsoide(G, bx0 + 3 + rr() * (bx1 - bx0 - 6), h - 1.1, bz0 + 8 + rr() * 10, 0.8 + rr(), 0.5, 0.8 + rr(), cc('#ffffff'), { flag: 16, nu: 8, nv: 5 });
      // jabones, frascos, cepillo, canasto de ropa, toallas
      U.cajaR(G, -20, h, 33, 3, 1.2, 1.8, '#f7a8d0', 14, 0.1); U.cajaR(G, 16, 0, 22, 4, 1.5, 2.5, '#a8f0d0', 14, -0.5);
      for (const [x, z, c] of [[-14, 50.5, '#3fb0c8'], [-10, 50.5, '#f47eb4'], [-18, 50.5, '#ffd23f']]) { U.torno(G, x, h, z, [[0, 0], [1.1, 0], [1.1, 3.5], [0.5, 4.2], [0.5, 4.8], [0, 4.8]], c, 13); }
      U.torno(G, 52, 0, 40, [[0, 0], [6, 0], [7, 12], [6.6, 12], [5.6, 0.4], [0, 0.4]], '#e8c48a', 24);
      geoElipsoide(G, 52, 11, 40, 5.6, 2.2, 5.6, cc('#f47eb4'), { flag: 10, nu: 14, nv: 8 });
      U.caja(G, -40, 0.05, 10, 10, 0.1, 18, '#5ab0d8', 10, 0.1);
      U.patoGoma(G, 10, 0, 16, 1.8, -0.8);
      U.torno(G, 58, 0, 6, [[0, 0], [4, 0], [4.5, 9], [5.5, 10], [5.5, 10.5], [0, 10.5]], '#ffffff', 16);
      for (let k = 0; k < 16; k++) { const x = rr() * 140 - 70, z = rr() * 90 - 25; if (libreDePista(C, x, z, 1.5)) geoElipsoide(G, x, 0.6, z, 0.6 + rr() * 0.6, 0.6 + rr() * 0.4, 0.6 + rr() * 0.6, cc('#ffffff'), { flag: 9, nu: 10, nv: 8 }); }
    },
  },
  {
    id: 'patio', musica: 2, riel: '#3fae4f', columna: 'madera',
    puntos: [
      [0, 0, 0, 6, 0, 'c'], [22, 2, 0, 6, 0, 'x'], [40, 0, 0, 5.4, 0, 'x'], [54, 10, 0, 5.2, 0, 'xk'], [56, 26, 0.7, 5.2, 0, 'x'], [46, 38, 0, 5.2, 0, 'x'],
      [30, 40, 1.2, 5, 0, 'mTJ'], [16, 42, 2.0, 5, 0, 'mH'], [2, 44, 0.3, 5.2, 0, 'x'], [-12, 38, 0, 5.4, 0, 'xc'], [-24, 44, 0, 5.2, 0, 'x'], [-38, 40, 0, 5.2, 0, 'x'],
      [-48, 28, 0, 5, 0, 'xk'], [-42, 16, 0, 5, 0, 'x'], [-46, 4, 0, 5, 0, 'x'], [-32, -6, 0, 5.6, 0, 'x'], [-16, -4, 0, 6, 0, 'T'],
    ],
    sinColumnas: [],
    amb: { sol: [0.35, 0.62, -0.7], solCol: [2.9, 2.4, 1.85], cielo: [0.42, 0.52, 0.75], suelo: [0.24, 0.28, 0.16], techo: [0.7, 0.85, 1.15], pared: [0.55, 0.62, 0.55], piso: [0.25, 0.32, 0.16], venCol: [9, 7.5, 5.5], venTam: 0.985, nieblaCol: [0.72, 0.8, 0.92], niebla: 60, cieloAfuera: true, cenit: [0.28, 0.5, 0.92], horiz: [0.96, 0.78, 0.6], pista: [[0.95, 0.88, 0.7], [0.25, 0.6, 0.25], [0.85, 0.3, 0.15]], grado: [1.05, 1.0, 0.92], sat: 1.15 },
    decorar(G, C, rr) {
      U.piso(G, -120, -80, 130, 120, '#5aa04a', 9);
      // camino de tierra debajo de la pista
      for (let i = 0; i < C.N; i += 2) { const j = (i + 2) % C.N, w = C.w[i] / 2 + 1.2, P = (k, d) => [C.px[k] + C.rx[k] * d, 0.012, C.pz[k] + C.rz[k] * d]; geoQuad(G, P(i, -w), P(i, w), P(j, w), P(j, -w), cc('#9a7048'), 17); }
      // la casa al fondo, la cerca, el banco, macetas, manguera, enanito, regadera, charco
      U.caja(G, 0, 0, -60, 160, 50, 4, '#e8d0b0', 18); U.ventana(G, -20, 10, -57.9, 18, 16, 0, '#2a3040', '#d8352a'); U.ventana(G, 30, 10, -57.9, 18, 16, 0, '#2a3040', '#3fae4f');
      for (let x = -110; x < 120; x += 6) U.caja(G, x, 0, 100, 4.5, 14 + (x % 12 ? 0 : 2), 1, '#f6efe0', 4);
      for (let z = -50; z < 100; z += 6) { U.caja(G, -110, 0, z, 1, 14, 4.5, '#f6efe0', 4); U.caja(G, 120, 0, z, 1, 14, 4.5, '#f6efe0', 4); }
      U.caja(G, 26, 6.5, 16, 34, 1.2, 9, '#8a5a3a', 4); for (const [x, z] of [[11, 13], [41, 13], [11, 19], [41, 19]]) U.caja(G, x, 0, z, 1.2, 6.5, 1.2, '#2a2a30', 19);
      for (const [x, z, r, t] of [[66, 20, 3.4, 'flores'], [-58, 30, 3, 'cactus'], [-20, 22, 3.6, 'flores'], [8, 60, 4, 'planta'], [70, 50, 3.2, 'planta'], [-60, 60, 3.6, 'flores']]) U.maceta(G, x, 0, z, r, r * 1.2, t, rr);
      { const pts = []; for (let k = 0; k <= 40; k++) { const t = k / 40; pts.push([92 - t * 24 + Math.sin(t * 6) * 3, 0.45, -50 + t * 110 + Math.cos(t * 7) * 3]); } geoTubo(G, pts, 0.45, cc('#3fae4f'), 13, { nu: 8 }); }
      U.enano(G, -30, 0, 28, 1.6, 0.5); U.regadera(G, 34, 0, 60, 1.3, 2.4);
      geoElipsoide(G, 8, 0.03, 44, 7, 0.02, 5, cc('#7aa0c0'), { flag: 7, nu: 16, nv: 4 });
      for (let k = 0; k < 90; k++) { const x = rr() * 220 - 110, z = rr() * 170 - 70; if (libreDePista(C, x, z, 2.2)) { const h = 1.5 + rr() * 2.5; for (let b = 0; b < 3; b++) geoQuad(G, [x - 0.4 + b * 0.3, 0, z], [x + 0.4 + b * 0.3, 0, z + 0.2], [x + 0.15 * b + rr() * 0.6 - 0.3, h, z + 0.1], [x + 0.15 * b, h * 0.98, z + 0.1], cc('#4a9a3a'), 9); } }
      for (let k = 0; k < 18; k++) { const x = rr() * 200 - 100, z = rr() * 160 - 60; if (libreDePista(C, x, z, 1.5)) U.esfera(G, x, 0.3, z, 0.5 + rr() * 0.7, '#9a9aa0', 0, 8); }
    },
  },
  {
    id: 'altillo', musica: 2, riel: '#8a5a3a', columna: 'libros',
    puntos: [
      [0, 0, 0, 6, 0, 'c'], [20, 0, 0, 6, 0, ''], [36, 4, 0, 5.4, 0, 'm'], [48, 14, 1.6, 5, 0, 'mT'], [52, 28, 4.2, 4.6, 0, 'm'], [42, 38, 4.2, 4.4, 0, 'dmcJ'],
      [28, 40, 4.2, 4.4, 0, 'nmH'], [14, 38, 0.8, 5, 0, ''], [0, 44, 0, 5.4, 0, 'k'], [-16, 40, 0, 5, 0, ''], [-24, 32, 0, 5, 0, ''], [-21, 21, 0, 5, 0, ''],
      [-24, 10, 0, 5, 0, 'k'], [-34, 5, 0, 5, 0, ''], [-41, 2, 0, 5, 0, ''], [-43, -4, 0, 5.2, 0, ''], [-38, -9, 0, 5.4, 0, ''], [-26, -10, 0, 5.8, 0, 'T'], [-14, -6, 0, 6, 0, ''],
    ],
    sinColumnas: [[30, 26, 60, 46]],
    amb: { sol: [-0.6, 0.55, 0.58], solCol: [1.6, 1.8, 2.6], cielo: [0.18, 0.2, 0.3], suelo: [0.16, 0.12, 0.1], techo: [0.35, 0.3, 0.28], pared: [0.32, 0.24, 0.18], piso: [0.2, 0.14, 0.1], venCol: [3.5, 4, 6], venTam: 0.96, nieblaCol: [0.16, 0.13, 0.14], niebla: 36, pista: [[0.92, 0.84, 0.7], [0.55, 0.32, 0.18], [0.85, 0.65, 0.2]], grado: [1.04, 0.98, 0.94], expo: 1.25, vineta: 0.75, umbral: 1.0,
      luces: [[10, 16, 18, 34, [7, 5, 2.6]], [-30, 14, 20, 30, [6, 4.2, 2.2]], [44, 14, 40, 26, [5, 3.6, 2.0]]] },
    decorar(G, C, rr) {
      U.piso(G, -90, -40, 100, 90, '#7a5034', 4);
      for (const [x0, z0, x1, z1] of [[-80, -30, 86, -30], [86, -30, 86, 76], [86, 76, -80, 76], [-80, 76, -80, -30]]) U.pared(G, x0, z0, x1, z1, 50, '#6a5040', 4);
      // vigas del techo inclinado y la ventana redonda con luna
      for (let x = -70; x < 86; x += 16) U.caja(G, x, 34, 23, 2, 2, 106, '#4a3020', 4);
      U.ventana(G, -79.9, 14, 20, 16, 16, PI / 2, '#ffffff', null, 46);
      U.lampara(G, 10, 16, 18, 36); U.lampara(G, -30, 14, 20, 36); U.lampara(G, 44, 14, 40, 36);
      // el baúl grande (la pista pasa por la tapa) y otros baúles, cajas de cartón, libros, mapa
      U.baul(G, 45, 36, 30, 20, 4.25, 0, '#6a3a24', true);
      U.baul(G, -50, 30, 16, 10, 8, 0.4, '#3a5a8a'); U.baul(G, 70, 0, 14, 9, 7, -0.3, '#8a2a2a');
      for (const [x, z, w, h, d] of [[-8, 28, 8, 6, 6], [-4, 34, 5, 4, 5], [62, 60, 12, 9, 10], [-60, 60, 10, 8, 8]]) U.caja(G, x, 0, z, w, h, d, '#b88a5a', 15, rr() * 0.5);
      for (let k = 0; k < 6; k++) U.libro(G, 20 + k * 0.1, k * 0.9, 20, 4, 0.85, 3, rr() * 0.6, k, false);
      for (let k = 0; k < 5; k++) U.libro(G, -36, k * 1.0, 0 + k * 0.1, 3.6, 0.95, 2.6, rr() * 0.5, k + 2, false);
      U.caja(G, -10, 0.02, 12, 6, 0.04, 4, '#ffffff', 20, 0.3, { uvArriba: uvCelda(47) });
      U.trompo(G, 6, 0, 30, 2); U.osito(G, 0, 0, 22, 0.7, -0.5);
      // telas de araña en las vigas (unos hilos) y polvo
      for (let k = 0; k < 8; k++) { const x = rr() * 150 - 70, z = rr() * 90 - 20; geoTubo(G, [[x, 33, z], [x + 2, 28, z + 1], [x + 3, 33, z + 3]], 0.03, cc('#d8d8e0'), 0, { nu: 3 }); }
    },
  },
  {
    id: 'vidriera', musica: 2, riel: '#d9a441', columna: 'metal',
    puntos: [
      [0, 0, 0, 6, 0, 'c'], [22, 0, 0, 6, 0, ''], [40, 4, 0, 5.4, 0, 'k'], [50, 16, 0, 5.2, 0, ''], [44, 30, 0, 5.2, 0, 'T'], [30, 34, 1.6, 5, 0, ''],
      [16, 30, 3.6, 4.6, 0, 'cJ'], [4, 36, 3.6, 4.4, 0, 'H'], [-8, 44, 0.6, 5, 0, ''], [-24, 44, 0, 5.2, 0, 'k'], [-38, 36, 0, 5, 0, ''], [-44, 22, 0, 5, 0, ''],
      [-38, 9, 0, 5, 0, 'c'], [-38, -1, 0, 5, 0, ''], [-28, -8, 0, 5.6, 0, 'T'], [-12, -6, 0, 6, 0, 'k'],
    ],
    sinColumnas: [[8, 24, 24, 38]],
    tren: { cx: 10, cz: 14, rx: 16, rz: 9, vel: 0.22 },
    amb: { sol: [0.1, 0.38, 0.92], solCol: [3.6, 2.5, 1.7], cielo: [0.42, 0.42, 0.6], suelo: [0.42, 0.18, 0.16], techo: [0.9, 0.7, 0.6], pared: [0.7, 0.4, 0.35], piso: [0.4, 0.12, 0.1], venCol: [8, 5.5, 3.6], venTam: 0.9, nieblaCol: [0.55, 0.36, 0.38], niebla: 50, pista: [[0.97, 0.92, 0.82], [0.85, 0.65, 0.2], [0.8, 0.15, 0.2]], grado: [1.05, 0.98, 0.95], sat: 1.12, umbral: 1.05,
      luces: [[-20, 8, 30, 26, [5, 3.2, 1.6]], [30, 8, 40, 26, [4.5, 3, 1.8]]] },
    decorar(G, C, rr) {
      U.piso(G, -90, -40, 100, 90, '#a82a2a', 10);
      U.pared(G, 86, -30, 86, 76, 50, '#2a1a24', 4); U.pared(G, 86, 76, -80, 76, 50, '#3a2030', 4); U.pared(G, -80, 76, -80, -30, 50, '#2a1a24', 4);
      // el vidrio de la vidriera con la calle al amanecer
      for (let k = 0; k < 8; k++) geoQuad(G, [-80 + k * 20.75, 0, -30], [-80 + (k + 1) * 20.75, 0, -30], [-80 + (k + 1) * 20.75, 50, -30], [-80 + k * 20.75, 50, -30], cc('#ffffff'), 22, [[k / 8, 1], [(k + 1) / 8, 1], [(k + 1) / 8, 7 / 8], [k / 8, 7 / 8]]);
      for (let x = -80; x <= 86; x += 41.5) U.caja(G, x, 0, -29.5, 1.2, 50, 1.2, '#d9a441', 2);
      // la vía del tren de juguete (óvalo)
      const T = this.tren; { const pts = [], pts2 = []; for (let k = 0; k <= 64; k++) { const a = k / 64 * TAU; pts.push([T.cx + Math.cos(a) * (T.rx - 0.6), 0.1, T.cz + Math.sin(a) * (T.rz - 0.6)]); pts2.push([T.cx + Math.cos(a) * (T.rx + 0.6), 0.1, T.cz + Math.sin(a) * (T.rz + 0.6)]); } geoTubo(G, pts, 0.1, cc('#c9ced8'), 2, { nu: 5 }); geoTubo(G, pts2, 0.1, cc('#c9ced8'), 2, { nu: 5 }); for (let k = 0; k < 64; k++) { const a = k / 64 * TAU; U.caja(G, T.cx + Math.cos(a) * T.rx, 0, T.cz + Math.sin(a) * T.rz, 0.5, 0.08, 2.0, '#6a4a2a', 25, PI / 2 - a); } }
      // el pueblito: casitas, arbolitos, foquitos, regalos (la pista salta desde uno grande)
      for (const [x, z, w, d, h, c, t, y] of [[-14, 22, 6, 5, 5, '#f6e7c6', '#d8352a', 0.3], [-6, 30, 5, 5, 6, '#9ac8e8', '#1f4fa8', -0.2], [-52, 46, 7, 6, 6, '#f2c8a0', '#3fae4f', 0.8], [62, 40, 6, 6, 7, '#f6e7c6', '#a04a9a', -0.6], [20, -14, 7, 5, 5, '#ffe0a0', '#d8352a', 0.1], [-48, -14, 6, 5, 6, '#c8e0c0', '#8a2a2a', 0.4]]) U.casita(G, x, z, w, d, h, c, t, y, true);
      for (let k = 0; k < 16; k++) { const x = rr() * 150 - 70, z = rr() * 90 - 20; if (libreDePista(C, x, z, 2) && Math.hypot((x - T.cx) / (T.rx + 3), (z - T.cz) / (T.rz + 3)) > 1) U.arbolito(G, x, z, 5 + rr() * 4, rr() < 0.3 ? '#e8f0f0' : '#2f7a4a'); }
      U.regalo(G, 16, 0, 31, 14, 3.62, 12, '#1f4fa8', '#f2b632', 0.1);
      U.regalo(G, 60, 0, 10, 8, 6, 8, '#d8352a', '#ffffff', 0.4); U.regalo(G, -56, 0, 24, 7, 5, 7, '#3fae4f', '#d8352a', -0.3); U.regalo(G, -20, 0, 60, 9, 7, 9, '#f2b632', '#1f4fa8', 0.2);
      for (const [a, b] of [[[-70, 30, 70], [80, 30, 70]], [[-78, 28, -10], [-78, 28, 70]]]) { const pts = []; for (let k = 0; k <= 30; k++) { const t = k / 30; pts.push([a[0] + (b[0] - a[0]) * t, a[1] - Math.sin(t * PI) * 4 - Math.abs(Math.sin(t * PI * 5)) * 1.5, a[2] + (b[2] - a[2]) * t]); } U.foquitos(G, pts, ['#ff4a4a', '#ffd23f', '#4ad0ff', '#7aff6a']); }
      U.osito(G, 62, 0, 62, 1.1, -0.6); U.patoGoma(G, -40, 0, 60, 1.6, 0.9); U.trompo(G, 40, 0, 56, 2.6);
    },
  },
];
for (const p of PISTAS) { const a = p.amb = Object.assign({}, AMB_BASE, p.amb), l = Math.hypot(...a.sol); a.sol = a.sol.map(v => v / l); a.venDir = a.venDir || a.sol; a.cenit = a.cenit || [0.3, 0.5, 0.9]; a.horiz = a.horiz || [0.9, 0.85, 0.8]; }
