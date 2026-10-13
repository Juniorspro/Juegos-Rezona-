// CAMALOTE — arte vectorial: terreno, personajes, enemigos, jefes, luz, clima, retratos y láminas
const LINEA = '#2a1e16';
const osc = (c, k) => mezcla(c, '#000000', k), cla = (c, k) => mezcla(c, '#ffffff', k);
function lienzoK(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w * K)); c.height = Math.max(1, Math.ceil(h * K)); const g = c.getContext('2d'); g.scale(K, K); return [c, g]; }
function rr(g, x, y, w, h, r) {
  g.beginPath();
  if (g.roundRect) { g.roundRect(x, y, w, h, r); return; }
  const q = Array.isArray(r) ? r : [r, r, r, r];
  g.moveTo(x + q[0], y); g.lineTo(x + w - q[1], y); g.quadraticCurveTo(x + w, y, x + w, y + q[1]); g.lineTo(x + w, y + h - q[2]);
  g.quadraticCurveTo(x + w, y + h, x + w - q[2], y + h); g.lineTo(x + q[3], y + h); g.quadraticCurveTo(x, y + h, x, y + h - q[3]); g.lineTo(x, y + q[0]); g.quadraticCurveTo(x, y, x + q[0], y);
}
function elip(g, x, y, rx, ry, rot) { g.beginPath(); g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, Math.PI * 2); }
function pintar(g, c, b, bw) { g.fillStyle = c; g.fill(); if (b) { g.strokeStyle = b; g.lineWidth = bw || 1.3; g.lineJoin = 'round'; g.stroke(); } }
function poli(g, pts) { g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.closePath(); }
function trazo(g, pts, c, w) { g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.strokeStyle = c; g.lineWidth = w || 1.3; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(); }
const hash = (x, y) => { let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

// ---------- texturas repetibles ----------
const _pat = {};
let _patK = 0;
function limpiarArte() { for (const k in _pat) delete _pat[k]; for (const k in _sello) delete _sello[k]; _patK = K; }
function patron(nom) {
  if (_patK !== K) limpiarArte();
  if (_pat[nom]) return _pat[nom];
  const ancho = nom === 'golf' || nom === 'chapa' ? 2 : 1, alto = nom === 'chapa' ? 2 : 1, [c, g] = lienzoK(TS * ancho, TS * alto), r = rngSemilla(hashTxt(nom));
  const base = { pasto: '#7cc35b', flores: '#7cc35b', camino: '#d6b07a', arena: '#ecd8a0', golf: '#82cc60', bunker: '#f3e6b8', chapa: '#7f8c9b', barro: '#7a5a3a', pastoN: '#5f8f4a' }[nom];
  g.fillStyle = base; g.fillRect(0, 0, TS * ancho, TS * alto);
  if (nom === 'golf') { g.fillStyle = '#74c054'; g.fillRect(TS, 0, TS, TS); }
  if (nom === 'pasto' || nom === 'flores' || nom === 'golf' || nom === 'pastoN') {
    for (let k = 0; k < 26 * ancho; k++) { const x = r() * TS * ancho, y = r() * TS, cc = r() < 0.5 ? osc(base, 0.16) : cla(base, 0.16); trazo(g, [x, y, x + r() * 2 - 1, y - 2.5 - r() * 2], cc, 1); }
    if (nom === 'flores') for (let k = 0; k < 4; k++) { const x = 4 + r() * 22, y = 4 + r() * 22, cc = ['#ffffff', '#ffe066', '#ff9ad0', '#c8a8ff'][k % 4]; for (let a = 0; a < 5; a++) { elip(g, x + Math.cos(a * 1.26) * 1.6, y + Math.sin(a * 1.26) * 1.6, 1.2, 1.2); pintar(g, cc); } elip(g, x, y, 0.9, 0.9); pintar(g, '#e8a020'); }
  } else if (nom === 'camino') { for (let k = 0; k < 9; k++) { elip(g, r() * TS, r() * TS, 1 + r() * 1.6, 0.8 + r()); pintar(g, r() < 0.5 ? '#b89060' : '#ecd0a0'); } }
  else if (nom === 'arena' || nom === 'bunker') { for (let k = 0; k < 18; k++) { g.fillStyle = r() < 0.5 ? osc(base, 0.1) : cla(base, 0.25); g.fillRect(r() * TS, r() * TS, 1, 1); } }
  else if (nom === 'chapa') {
    // chapa de cubierta: relieve de rombos, costuras cada dos baldosas, remaches y algo de óxido
    const L = TS * 2;
    for (let y = 0; y < L; y += 7.5) for (let x = (y / 7.5) % 2 ? 3.75 : 0; x < L; x += 7.5) { elip(g, x + 2, y + 2, 2.6, 0.9, (Math.floor(x / 3.75) + Math.floor(y / 7.5)) % 2 ? 0.7 : -0.7); pintar(g, '#8e9aa8'); }
    for (let k = 0; k < 5; k++) { elip(g, r() * L, r() * L, 3 + r() * 6, 2 + r() * 4); pintar(g, 'rgba(160,96,50,0.22)'); }
    g.strokeStyle = '#5f6b78'; g.lineWidth = 1.2; g.strokeRect(0.6, 0.6, L - 1.2, L - 1.2);
    g.strokeStyle = 'rgba(200,210,224,0.5)'; g.beginPath(); g.moveTo(1.8, L - 2); g.lineTo(1.8, 1.8); g.lineTo(L - 2, 1.8); g.stroke();
    for (const [x, y] of [[5, 5], [L - 5, 5], [5, L - 5], [L - 5, L - 5], [L / 2, 5], [L / 2, L - 5]]) { elip(g, x, y, 1.4, 1.4); pintar(g, '#c0cad4', '#5f6b78', 0.6); }
  } else if (nom === 'barro') { for (let k = 0; k < 6; k++) { elip(g, r() * TS, r() * TS, 1.5 + r() * 2, 1 + r()); pintar(g, '#5e4228'); } }
  const p = g.createPattern(c, 'repeat');
  if (p.setTransform) p.setTransform(new DOMMatrix([1 / K, 0, 0, 1 / K, 0, 0]));
  _pat[nom] = p;
  return p;
}
const PAT_SUELO = { '.': 'pasto', ',': 'flores', ':': 'camino', 's': 'arena', 'q': 'golf', 'u': 'bunker', '_': 'chapa', 'm': 'barro' };
const COLOR_AGUA = { manana: ['#3d9bd0', '#62b8e0'], dia: ['#3a9ad4', '#66bde6'], noche: ['#1e4870', '#2e6490'] };
function esAguaT(c) { return c === '~' || c === 'r' || c === 'w' || c === 'p' || c === '='; }
function sueloDe(n, x, y) {
  if (!n.sg) {
    n.sg = [];
    for (let yy = 0; yy < n.h; yy++) { const f = []; for (let xx = 0; xx < n.w; xx++) { const c = n.t[yy][xx]; f.push(SUELOS.has(c) || esAguaT(c) ? c : n.sueloVecino(xx, yy)); } n.sg.push(f); }
  }
  return x < 0 || y < 0 || x >= n.w || y >= n.h ? 'T' : n.sg[y][x];
}

// ---------- el suelo ----------
function dibujarSuelo(g, n, x0, y0, x1, y1, t) {
  const luz = n.d.luz, ca = COLOR_AGUA[luz];
  g.fillStyle = ca[0]; g.fillRect(x0 * TS, y0 * TS, (x1 - x0 + 1) * TS, (y1 - y0 + 1) * TS);
  const tierra = (x, y) => !esAguaT(sueloDe(n, x, y));
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const c = sueloDe(n, x, y), px = x * TS, py = y * TS;
    if (c === '~' || c === 'r' || c === '=') {
      const h = hash(x, y), ox = ((t * 9 + h * 30) % 34) - 4;
      g.strokeStyle = 'rgba(255,255,255,0.22)'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(px + ox, py + 9 + h * 10); g.quadraticCurveTo(px + ox + 4, py + 6 + h * 10, px + ox + 8, py + 9 + h * 10); g.stroke();
      if (h > 0.6) { g.beginPath(); g.moveTo(px + (ox + 15) % 30, py + 22); g.quadraticCurveTo(px + (ox + 15) % 30 + 3, py + 20, px + (ox + 15) % 30 + 6, py + 22); g.stroke(); }
      if (h > 0.93 && Math.sin(t * 3 + h * 40) > 0.6) { elip(g, px + h * 25, py + 15, 1.3, 1.3); pintar(g, 'rgba(255,255,255,0.8)'); }
    } else if (c === 'w') {
      g.fillStyle = ca[1]; g.fillRect(px, py, TS, TS);
      g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 1.6;
      for (let k = 0; k < 3; k++) { const yy = py + 6 + k * 9, o = (t * 40 + k * 13 + x * 7) % 40 - 10; g.beginPath(); g.moveTo(px + o, yy); g.lineTo(px + o + 9, yy + 1); g.stroke(); }
    } else if (c === 'p') {
      g.fillStyle = '#7fdcec'; g.fillRect(px, py, TS, TS);
      g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 1; g.strokeRect(px + 0.5, py + 0.5, TS - 1, TS - 1);
      const o = (t * 12 + x * 9) % 30; g.strokeStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.moveTo(px + o, py + 12); g.lineTo(px + o + 6, py + 14); g.stroke();
    }
  }
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const c = sueloDe(n, x, y);
    if (esAguaT(c)) continue;
    const px = x * TS, py = y * TS, Nn = tierra(x, y - 1), S = tierra(x, y + 1), Wn = tierra(x - 1, y), E = tierra(x + 1, y), metal = c === '_' || (c === 'm' && n.d.luz === 'noche');
    const pat = patron(PAT_SUELO[c] || 'pasto');
    if (Nn && S && Wn && E) { g.fillStyle = pat; g.fillRect(px, py, TS, TS); continue; }
    const R = 10, rad = [!Nn && !Wn ? R : 0, !Nn && !E ? R : 0, !S && !E ? R : 0, !S && !Wn ? R : 0];
    rr(g, px, py, TS, TS, rad); g.fillStyle = metal ? '#4a5462' : (c === 's' ? '#d8c088' : '#e8d49c'); g.fill();
    const a = Wn ? 0 : 3, b = Nn ? 0 : 3, cc = E ? 0 : 3, d = S ? 0 : 4;
    rr(g, px + a, py + b, TS - a - cc, TS - b - d, rad.map(v => v ? v - 2 : 0)); g.fillStyle = pat; g.fill();
    if (!S && metal) { g.fillStyle = '#39414c'; g.fillRect(px, py + TS - 4, TS, 4); }
  }
  // espuma en la orilla
  g.strokeStyle = 'rgba(255,255,255,' + (0.35 + 0.15 * Math.sin(t * 2)) + ')'; g.lineWidth = 1.4;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const c = sueloDe(n, x, y);
    if (c !== '~' && c !== 'r') continue;
    const px = x * TS, py = y * TS;
    g.beginPath();
    if (tierra(x, y - 1)) { g.moveTo(px, py + 2); g.lineTo(px + TS, py + 2); }
    if (tierra(x, y + 1)) { g.moveTo(px, py + TS - 2); g.lineTo(px + TS, py + TS - 2); }
    if (tierra(x - 1, y)) { g.moveTo(px + 2, py); g.lineTo(px + 2, py + TS); }
    if (tierra(x + 1, y)) { g.moveTo(px + TS - 2, py); g.lineTo(px + TS - 2, py + TS); }
    g.stroke();
  }
  // detalles planos
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const c = n.tile(x, y), px = x * TS, py = y * TS;
    if (c === 'o' || c === 'O') {
      const pis = placaPisada(x, y);
      rr(g, px + 4, py + 4 + (pis ? 1 : 0), TS - 8, TS - 8, 4); pintar(g, pis ? '#8a9a8a' : '#b8b0a0', '#5a5448', 1.4);
      elip(g, px + 15, py + 15 + (pis ? 1 : 0), 4, 4); pintar(g, pis || n.flag('abre_' + (c === 'o' ? 'A' : 'B')) ? '#7af0b0' : '#8a8274');
    } else if (CINTAS[c]) {
      const [dx, dy] = CINTAS[c];
      g.fillStyle = '#3e4652'; g.fillRect(px, py + 2, TS, TS - 4); g.fillStyle = '#2e343e'; g.fillRect(px, py + 2, TS, 2); g.fillRect(px, py + TS - 4, TS, 2);
      g.save(); g.beginPath(); g.rect(px, py + 4, TS, TS - 8); g.clip();
      const o = (t * 2.3 * TS) % 10;
      g.strokeStyle = '#f0c040'; g.lineWidth = 2;
      for (let k = -1; k < 4; k++) {
        const cx = px + 15 + (dx ? dx * (k * 10 + o - 15) : 0), cy = py + 15 + (dy ? dy * (k * 10 + o - 15) : 0);
        g.beginPath();
        if (dx) { g.moveTo(cx - dx * 3, cy - 5); g.lineTo(cx + dx * 2, cy); g.lineTo(cx - dx * 3, cy + 5); }
        else { g.moveTo(cx - 5, cy - dy * 3); g.lineTo(cx, cy + dy * 2); g.lineTo(cx + 5, cy - dy * 3); }
        g.stroke();
      }
      g.restore();
    } else if (c === '=') {
      const vertical = !esAguaT(sueloDe(n, x, y - 1)) || !esAguaT(sueloDe(n, x, y + 1));
      for (let k = 0; k < 5; k++) {
        if (vertical) { rr(g, px + 2, py + k * 6, TS - 4, 5, 1.5); } else { rr(g, px + k * 6, py + 2, 5, TS - 4, 1.5); }
        pintar(g, k % 2 ? '#a8744a' : '#b8845a', '#6a4426', 1);
      }
    } else if (c === 'm') { elip(g, px + 15, py + 16, 12, 8); pintar(g, '#6a4a2c', '#4a3018'); const b = (t * 1.3 + x) % 1; elip(g, px + 10 + b * 4, py + 15, 1.5 + b, 1.5 + b); g.strokeStyle = 'rgba(200,170,130,' + (1 - b) + ')'; g.lineWidth = 1; g.stroke(); }
    else if (c === 'r') {
      for (let k = 0; k < 5; k++) { const bx = px + 5 + k * 5 + hash(x, k) * 3, sw = Math.sin(t * 1.6 + x + k) * 1.5; trazo(g, [bx, py + 26, bx + sw, py + 8 + hash(k, y) * 6], k % 2 ? '#5a9a4a' : '#78b858', 1.6); }
      elip(g, px + 18, py + 9, 1.6, 4); pintar(g, '#7a5232');
    } else if ((PUERTAS[c] || c === 'D') && n.abierta(c, x, y)) {
      rr(g, px + 1, py + 6, 5, 20, 2); pintar(g, '#8a6a4a', LINEA, 1); rr(g, px + TS - 6, py + 6, 5, 20, 2); pintar(g, '#8a6a4a', LINEA, 1);
    }
  }
}

// ---------- sellos (lo que se repite, dibujado una vez a la resolución real) ----------
const _sello = {};
function sello(nom, w, h, fn) {
  if (_patK !== K) limpiarArte();
  let s = _sello[nom];
  if (!s) { const [c, g] = lienzoK(w, h); fn(g); s = _sello[nom] = { c, w, h }; }
  return s;
}
function selloArbol(tipo) {
  return sello('arbol_' + tipo, 50, 58, g => {
    elip(g, 25, 54, 15, 4.5); pintar(g, 'rgba(0,0,0,0.25)');
    rr(g, 21, 32, 8, 22, 3); pintar(g, '#7a5232', LINEA, 1.3);
    if (tipo === 'palmera') {
      rr(g, 22, 18, 6, 36, 3); pintar(g, '#9a7a52', LINEA, 1.2);
      for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k - 3) * 0.55; g.beginPath(); g.moveTo(25, 18); g.quadraticCurveTo(25 + Math.cos(a) * 14, 18 + Math.sin(a) * 14 - 4, 25 + Math.cos(a) * 22, 18 + Math.sin(a) * 18 + 6); g.lineWidth = 4.5; g.strokeStyle = k % 2 ? '#3a8a3a' : '#4aa448'; g.lineCap = 'round'; g.stroke(); }
      return;
    }
    const cols = { ombu: ['#3f8a3a', '#2f6e30', '#5aa84c'], sauce: ['#7ab854', '#5e9a42', '#9ad06a'], ceibo: ['#4a9a40', '#357a32', '#6ab854'], seco: ['#4a6a4a', '#3a523e', '#5e7e5a'] }[tipo];
    const bolas = tipo === 'sauce' ? [[25, 22, 16], [14, 28, 11], [36, 28, 11]] : [[25, 18, 14], [14, 26, 12], [36, 26, 12], [25, 30, 12]];
    for (const [x, y, r] of bolas) { elip(g, x, y + 2, r, r * 0.9); pintar(g, cols[1], LINEA, 1.4); }
    for (const [x, y, r] of bolas) { elip(g, x, y, r - 1.5, r * 0.9 - 1.5); pintar(g, cols[0]); }
    for (const [x, y, r] of bolas) { elip(g, x - r * 0.3, y - r * 0.35, r * 0.45, r * 0.32); pintar(g, cols[2]); }
    if (tipo === 'sauce') for (let k = 0; k < 9; k++) trazo(g, [10 + k * 3.6, 26, 10 + k * 3.6 + 1, 40 + (k % 3) * 3], '#6aa84a', 1.4);
    if (tipo === 'ceibo') for (let k = 0; k < 9; k++) { const r = rngSemilla(k + 5); elip(g, 12 + r() * 26, 10 + r() * 24, 2.2, 1.5, r()); pintar(g, '#e8303a'); }
  });
}
function selloArbusto(tipo) {
  return sello('arbusto_' + tipo, 34, 30, g => {
    elip(g, 17, 26, 13, 3.5); pintar(g, 'rgba(0,0,0,0.22)');
    const c = tipo === 'zarza' ? ['#3e5e34', '#2e4a28', '#557a46'] : ['#58a848', '#428a38', '#78c460'];
    for (const [x, y, r] of [[10, 17, 8], [24, 17, 8], [17, 12, 9]]) { elip(g, x, y, r, r * 0.85); pintar(g, c[1], LINEA, 1.3); }
    for (const [x, y, r] of [[10, 16, 6.5], [24, 16, 6.5], [17, 11, 7.5]]) { elip(g, x, y, r, r * 0.8); pintar(g, c[0]); }
    elip(g, 14, 8, 3.5, 2.2); pintar(g, c[2]);
    if (tipo === 'zarza') { for (let k = 0; k < 10; k++) { const a = k * 0.63; trazo(g, [17 + Math.cos(a) * 7, 14 + Math.sin(a) * 6, 17 + Math.cos(a) * 11, 14 + Math.sin(a) * 9], '#2a3a20', 1.2); } for (const [x, y] of [[9, 14], [22, 10], [25, 18], [14, 19]]) { elip(g, x, y, 1.6, 1.6); pintar(g, '#8a3a9a'); } }
  });
}

// ---------- lo alto (ordenado por profundidad) ----------
const ALTOS = new Set('#T"%xtbFnICcgGhHED'.split(''));
function dibujarAlto(g, n, c, x, y, t) {
  const px = x * TS, py = y * TS;
  switch (c) {
    case '#': {
      const s = n.tile(x, y + 1) === '#', hgt = 13, Nn = n.tile(x, y - 1) === '#', Wn = n.tile(x - 1, y) === '#', E = n.tile(x + 1, y) === '#';
      if (!s) { rr(g, px, py + TS - hgt - 2, TS, hgt + 2, [0, 0, 4, 4]); pintar(g, '#7a6650', LINEA, 1.2); for (let k = 0; k < 3; k++) trazo(g, [px + 6 + k * 9, py + TS - hgt + 2, px + 5 + k * 9, py + TS - 2], '#62503e', 1.2); }
      rr(g, px, py - hgt + (s ? TS - hgt : 0) * 0, TS, TS - (s ? 0 : 2), [!Nn && !Wn ? 8 : 0, !Nn && !E ? 8 : 0, 0, 0]); pintar(g, '#a89478');
      g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(px + 3, py - hgt + 3, TS - 6, 3);
      if (hash(x, y) > 0.6) { elip(g, px + 9 + hash(y, x) * 12, py - hgt + 12, 3, 2); pintar(g, '#8e7a60'); }
      break;
    }
    case 'T': { const tipos = n.id === 'c2' ? ['palmera', 'ombu', 'ceibo'] : n.id === 'c3' ? ['seco'] : ['ombu', 'sauce', 'ceibo', 'ombu']; const s = selloArbol(tipos[Math.floor(hash(x, y) * tipos.length)]); const sw = Math.sin(t * 1.2 + x * 0.7) * 0.6; g.drawImage(s.c, px + 15 - 25 + sw, py + TS - 56, 50, 58); break; }
    case '"': { const s = selloArbusto('verde'); g.drawImage(s.c, px - 2, py + 2, 34, 30); break; }
    case '%': { const s = selloArbusto('zarza'); g.drawImage(s.c, px - 2, py + 2, 34, 30); break; }
    case 'x': {
      const met = n.id === 'c3';
      rr(g, px + 2, py + 2, 26, 9, [4, 4, 0, 0]); pintar(g, met ? '#9aa4ae' : '#c89a5e', LINEA, 1.3);
      rr(g, px + 2, py + 10, 26, 18, [0, 0, 4, 4]); pintar(g, met ? '#6e7884' : '#a8763e', LINEA, 1.3);
      if (met) { for (let k = 0; k < 4; k++) { poli(g, [px + 3 + k * 7, py + 27, px + 7 + k * 7, py + 27, px + 10 + k * 7, py + 11, px + 6 + k * 7, py + 11]); pintar(g, k % 2 ? '#f0c040' : '#2e2e2e'); } }
      else { trazo(g, [px + 4, py + 13, px + 26, py + 26], '#7a5228', 2); trazo(g, [px + 26, py + 13, px + 4, py + 26], '#7a5228', 2); }
      break;
    }
    case 't': {
      const des = n.flag('est_' + x + '_' + y);
      rr(g, px + 5, py + 16, 20, 12, 3); pintar(g, '#8e8a80', LINEA, 1.3);
      elip(g, px + 15, py + 10, 7, 8); pintar(g, '#a8a498', LINEA, 1.3);
      elip(g, px + 18, py + 2, 4.5, 4); pintar(g, '#a8a498', LINEA, 1.3);
      trazo(g, [px + 16, py - 1, px + 11, py - 5], '#6e6a60', 1.6);
      poli(g, [px + 21, py + 2, px + 26, py + 3, px + 21, py + 4]); pintar(g, '#8e8a80');
      elip(g, px + 19.5, py + 1.5, 1.4, 1.4); pintar(g, des ? '#6af0ff' : '#5e5a52');
      if (des) { g.globalCompositeOperation = 'lighter'; elip(g, px + 19.5, py + 1.5, 4, 4); pintar(g, 'rgba(90,220,255,0.35)'); g.globalCompositeOperation = 'source-over'; }
      break;
    }
    case 'b': {
      const on = n.flag('btn_' + x + '_' + y);
      rr(g, px + 11, py + 12, 8, 16, 2); pintar(g, '#6e6a64', LINEA, 1.2);
      for (const [r, cc] of [[10, on ? '#3ac06a' : '#e84040'], [7, '#ffffff'], [4, on ? '#3ac06a' : '#e84040']]) { elip(g, px + 15, py + 8, r, r); pintar(g, cc, r === 10 ? LINEA : null, 1.3); }
      break;
    }
    case 'F': {
      for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2; elip(g, px + 15 + Math.cos(a) * 10, py + 21 + Math.sin(a) * 5, 4, 3); pintar(g, '#8a8278', LINEA, 1); }
      trazo(g, [px + 8, py + 23, px + 22, py + 18], '#6a4426', 3.5); trazo(g, [px + 8, py + 18, px + 22, py + 23], '#7a5232', 3.5);
      for (let k = 0; k < 3; k++) { const f = Math.sin(t * 10 + k * 2) * 1.5, hh = 13 + k * 2 + Math.sin(t * 7 + k) * 2; poli(g, [px + 9 + k * 6, py + 20, px + 12 + k * 3 + f, py + 20 - hh, px + 15 + k * 3, py + 20]); pintar(g, ['#ff7a20', '#ffb030', '#ffe070'][k]); }
      break;
    }
    case 'n': {
      const blanco = n.id === 'c2', col = blanco ? '#f4f0e8' : '#8a6a4a', h = n.tile(x - 1, y) === 'n' || n.tile(x + 1, y) === 'n';
      if (h) { rr(g, px - 1, py + 10, TS + 2, 4, 1); pintar(g, col, LINEA, 1); rr(g, px - 1, py + 19, TS + 2, 4, 1); pintar(g, col, LINEA, 1); }
      for (const o of h ? [5, 20] : [12]) { rr(g, px + o, py + 3, 5, 25, [3, 3, 1, 1]); pintar(g, col, LINEA, 1.2); }
      if (!h) { rr(g, px + 12, py + 3, 5, 25, 2); pintar(g, col, LINEA, 1.2); }
      break;
    }
    case 'I': { elip(g, px + 15, py + 26, 7, 3); pintar(g, 'rgba(0,0,0,0.25)'); rr(g, px + 11, py - 6, 8, 33, 3); pintar(g, '#d8d8d8', LINEA, 1.3); for (let k = 0; k < 3; k++) { g.fillStyle = '#e84040'; g.fillRect(px + 11, py - 2 + k * 10, 8, 4); } break; }
    case 'C': {
      const s = n.tile(x, y + 1) === 'C', nn = n.tile(x, y - 1) === 'C';
      if (!s) { g.fillStyle = '#f2e6d0'; g.fillRect(px, py + 8, TS, 22); g.strokeStyle = LINEA; g.lineWidth = 1.2; g.strokeRect(px, py + 8, TS, 22); rr(g, px + 9, py + 13, 12, 9, 2); pintar(g, hash(x, y) > 0.5 ? '#ffd870' : '#8ac8e8', LINEA, 1); }
      g.fillStyle = nn ? '#c8583a' : '#d8684a'; g.fillRect(px, py - 10 + (nn ? 0 : 0), TS, s ? TS + 10 : 18);
      for (let k = 0; k < 4; k++) { g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(px, py - 6 + k * 7, TS, 1.5); }
      if (!nn) { g.fillStyle = '#e88a6a'; g.fillRect(px, py - 10, TS, 3); }
      break;
    }
    case 'c': {
      const h = n.tile(x - 1, y) === 'c' || n.tile(x + 1, y) === 'c' || n.tile(x - 1, y) === 'E';
      rr(g, px - (h ? 1 : 0), py + 6, TS + (h ? 2 : 0), 18, 7); pintar(g, '#7a8694', LINEA, 1.3);
      g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(px, py + 9, TS, 3);
      rr(g, px + 12, py + 4, 6, 22, 2); pintar(g, '#5e6876', LINEA, 1);
      if (n.d.luz === 'noche' && hash(x, y) > 0.82) { elip(g, px + 15, py + 2, 3, 3); pintar(g, '#ffe8a0'); }
      break;
    }
    case 'g': case 'G': case 'h': case 'H': case 'D': {
      if (n.abierta(c, x, y)) break;
      if (c === 'h') { rr(g, px, py - 8, TS, TS + 6, [6, 6, 0, 0]); pintar(g, '#9a968a', LINEA, 1.3); elip(g, px + 15, py + 6, 6, 7); pintar(g, '#7e7a70'); elip(g, px + 17, py, 3, 3); pintar(g, '#7e7a70'); break; }
      if (c === 'H') { for (let k = 0; k < 5; k++) { rr(g, px + 2 + k * 6, py - 4, 3.5, 30, 1.5); pintar(g, '#5a6070', LINEA, 1); } rr(g, px, py + 2, TS, 3, 1); pintar(g, '#5a6070'); rr(g, px, py + 18, TS, 3, 1); pintar(g, '#5a6070'); break; }
      for (let k = 0; k < 5; k++) { rr(g, px + 1 + k * 6, py - 6 + (k % 2) * 2, 5.5, 32, [3, 3, 1, 1]); pintar(g, k % 2 ? '#a07848' : '#b08858', LINEA, 1.1); }
      trazo(g, [px, py + 6, px + TS, py + 6], '#5a3a1e', 2); trazo(g, [px, py + 18, px + TS, py + 18], '#5a3a1e', 2);
      if (c === 'D') { rr(g, px + 10, py + 9, 10, 9, 2); pintar(g, '#e8c040', LINEA, 1.2); g.beginPath(); g.arc(px + 15, py + 9, 3.5, Math.PI, 0); g.strokeStyle = '#c8a020'; g.lineWidth = 2; g.stroke(); }
      break;
    }
    case 'E': {
      const on = !n.abierta('E', x, y);
      rr(g, px + 2, py, 4, 28, 2); pintar(g, '#4a5260', LINEA, 1); rr(g, px + 24, py, 4, 28, 2); pintar(g, '#4a5260', LINEA, 1);
      for (let k = 0; k < 3; k++) {
        if (on) { g.beginPath(); g.moveTo(px + 4, py + 6 + k * 8); for (let s = 1; s <= 6; s++) g.lineTo(px + 4 + s * 4, py + 6 + k * 8 + (Math.sin(t * 40 + s * 2 + k) * 2)); g.strokeStyle = '#a0e8ff'; g.lineWidth = 1.6; g.stroke(); }
        else trazo(g, [px + 4, py + 6 + k * 8, px + 26, py + 6 + k * 8], '#5a6270', 1);
      }
      if (on) { g.globalCompositeOperation = 'lighter'; elip(g, px + 15, py + 14, 16, 12); pintar(g, 'rgba(80,180,255,0.18)'); g.globalCompositeOperation = 'source-over'; }
      break;
    }
  }
}

// ---------- personajes ----------
const PIELES = {
  pancho: { cuerpo: '#a0703f', oscuro: '#6e4a28', panza: '#c69a64', hocico: '#7e5434', bandana: '#e0473a' },
  lola: { cuerpo: '#b8844e', oscuro: '#7e5a34', panza: '#d8aa74', hocico: '#8e6440', flor: 1, escala: 0.74 },
  abuela: { cuerpo: '#8f7a62', oscuro: '#5e4e3e', panza: '#b0a088', hocico: '#6e5a46', anteojos: 1, chal: '#7a4a8a' },
};
function capy(g, x, y, dir, t, o) {
  const s = o.escala || 1, anim = o.anim || 0, mov = o.mov || 0, paso = Math.sin(anim), bob = mov * Math.abs(paso) * 1.4, lp = mov * paso * 2.2;
  g.save(); g.translate(x, y); g.scale(s, s);
  if (o.dash) { if (dir === 'l' || dir === 'r') g.scale(1.25, 0.85); else g.scale(0.85, 1.2); }
  if (o.nada) { g.beginPath(); g.rect(-40, -60, 80, 56); g.clip(); g.translate(0, 3 + Math.sin(t * 3) * 0.8); }
  const C = o.cuerpo, D = o.oscuro, P = o.panza, Hc = o.hocico, parp = (t * 0.7 + (o.fase || 0)) % 4 < 0.12;
  if (dir === 'l' || dir === 'r') {
    if (dir === 'l') g.scale(-1, 1);
    rr(g, -9 + lp, -6, 4, 6.5, 2); pintar(g, D); rr(g, 5 - lp, -6, 4, 6.5, 2); pintar(g, D);
    elip(g, 0, -10 - bob, 12.5, 8.5); pintar(g, C, LINEA, 1.4);
    elip(g, -1, -6.5 - bob, 9.5, 3.8); pintar(g, rgba(P, 0.75));
    if (o.chal) { poli(g, [-8, -16 - bob, 4, -17 - bob, 6, -9 - bob, -6, -8 - bob]); pintar(g, o.chal, LINEA, 1); }
    rr(g, -7 - lp, -5, 4.2, 6, 2); pintar(g, osc(C, 0.15), LINEA, 1); rr(g, 6 + lp, -5, 4.2, 6, 2); pintar(g, osc(C, 0.15), LINEA, 1);
    rr(g, 7, -20 - bob, 13, 11.5, 5); pintar(g, C, LINEA, 1.4);
    rr(g, 15, -17 - bob, 7.5, 8.5, 3.5); pintar(g, Hc, LINEA, 1.2);
    elip(g, 9.5, -20.5 - bob, 2.8, 2.3); pintar(g, D, LINEA, 1);
    if (parp) trazo(g, [13.2, -15.8 - bob, 16, -15.8 - bob], LINEA, 1.2); else { elip(g, 14.6, -15.8 - bob, 1.7, 1.8); pintar(g, '#1a1410'); elip(g, 15.1, -16.4 - bob, 0.6, 0.6); pintar(g, '#ffffff'); }
    if (o.anteojos) { elip(g, 14.6, -15.8 - bob, 3, 3); g.strokeStyle = '#3a2a1a'; g.lineWidth = 1; g.stroke(); }
    elip(g, 21, -14.5 - bob, 0.9, 0.9); pintar(g, '#2a1a10');
    if (o.bandana) { poli(g, [5, -17 - bob, 10, -9 - bob, 2, -9.5 - bob]); pintar(g, o.bandana, LINEA, 1); }
    if (o.flor) flor(g, 11, -22 - bob);
  } else if (dir === 'd') {
    rr(g, -7 - lp * 0.4, -5, 4.5, 6, 2); pintar(g, osc(C, 0.15), LINEA, 1); rr(g, 2.5 + lp * 0.4, -5, 4.5, 6, 2); pintar(g, osc(C, 0.15), LINEA, 1);
    elip(g, 0, -11 - bob, 11.5, 9); pintar(g, C, LINEA, 1.4);
    if (o.chal) { poli(g, [-10, -14 - bob, 10, -14 - bob, 7, -6 - bob, -7, -6 - bob]); pintar(g, o.chal, LINEA, 1); }
    elip(g, -7, -15.5 - bob, 2.7, 2.3); pintar(g, D, LINEA, 1); elip(g, 7, -15.5 - bob, 2.7, 2.3); pintar(g, D, LINEA, 1);
    elip(g, 0, -8.5 - bob, 8.8, 7.2); pintar(g, C, LINEA, 1.4);
    elip(g, 0, -5.2 - bob, 6.2, 4.2); pintar(g, Hc, LINEA, 1.2);
    elip(g, -2, -5.8 - bob, 0.8, 1); pintar(g, '#2a1a10'); elip(g, 2, -5.8 - bob, 0.8, 1); pintar(g, '#2a1a10');
    for (const sx of [-4, 4]) { if (parp) trazo(g, [sx - 1.5, -10.5 - bob, sx + 1.5, -10.5 - bob], LINEA, 1.2); else { elip(g, sx, -10.5 - bob, 1.7, 1.8); pintar(g, '#1a1410'); elip(g, sx + 0.5, -11.1 - bob, 0.6, 0.6); pintar(g, '#ffffff'); } if (o.anteojos) { elip(g, sx, -10.5 - bob, 2.8, 2.8); g.strokeStyle = '#3a2a1a'; g.lineWidth = 1; g.stroke(); } }
    if (o.bandana) { poli(g, [-6, -2.5 - bob, 6, -2.5 - bob, 0, 2.5 - bob]); pintar(g, o.bandana, LINEA, 1); }
    if (o.flor) flor(g, 5, -15 - bob);
  } else {
    rr(g, -7 - lp * 0.4, -5, 4.5, 6, 2); pintar(g, osc(C, 0.15), LINEA, 1); rr(g, 2.5 + lp * 0.4, -5, 4.5, 6, 2); pintar(g, osc(C, 0.15), LINEA, 1);
    elip(g, 0, -10 - bob, 11.5, 9); pintar(g, C, LINEA, 1.4);
    if (o.chal) { poli(g, [-10, -15 - bob, 10, -15 - bob, 8, -7 - bob, -8, -7 - bob]); pintar(g, o.chal, LINEA, 1); }
    elip(g, 0, -16.5 - bob, 7.5, 5.8); pintar(g, osc(C, 0.08), LINEA, 1.3);
    elip(g, -5.5, -20 - bob, 2.6, 2.2); pintar(g, D, LINEA, 1); elip(g, 5.5, -20 - bob, 2.6, 2.2); pintar(g, D, LINEA, 1);
    if (o.bandana) { poli(g, [-2, -12 - bob, 2, -12 - bob, 3, -8 - bob, -3, -8 - bob]); pintar(g, o.bandana); }
    if (o.flor) flor(g, 3, -20 - bob);
  }
  g.restore();
  if (o.nada) { elip(g, x, y - 1, 13 * s, 4 * s); g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 1.3; g.stroke(); }
}
function flor(g, x, y) { for (let a = 0; a < 5; a++) { elip(g, x + Math.cos(a * 1.26) * 2.4, y + Math.sin(a * 1.26) * 2.4, 2, 2); pintar(g, '#c890e8', LINEA, 0.6); } elip(g, x, y, 1.4, 1.4); pintar(g, '#ffe060'); }
function tero(g, x, y, dir, t, vuela, s) {
  g.save(); g.translate(x, y - (vuela ? 10 + Math.sin(t * 4) * 2 : 0)); g.scale(s || 1, s || 1); if (dir === 'l') g.scale(-1, 1);
  if (!vuela) { trazo(g, [-1, -7, -2, 0], '#d84a4a', 1.4); trazo(g, [2, -7, 3, 0], '#d84a4a', 1.4); }
  if (vuela) { const a = Math.sin(t * 16) * 7; for (const sy of [1]) { poli(g, [-2, -11, -14, -16 - a, -8, -9]); pintar(g, '#f2f0ea', LINEA, 1); poli(g, [-12, -15 - a, -15, -17 - a, -11, -12 - a * 0.5]); pintar(g, '#1e1e22'); void sy; } }
  elip(g, 0, -11, 7, 5); pintar(g, '#9e9686', LINEA, 1.2);
  elip(g, -1.5, -11.8, 5.5, 3.2); pintar(g, '#857c6e');
  elip(g, 1, -8, 5, 2.4); pintar(g, '#f2f0ea');
  elip(g, 4.2, -9.8, 2.8, 3.2); pintar(g, '#1e1e22');
  poli(g, [-6, -12, -11, -10, -6, -9]); pintar(g, '#1e1e22');
  elip(g, 6, -16, 3.7, 3.5); pintar(g, '#8e887c', LINEA, 1.1);
  elip(g, 6.6, -14.6, 2.4, 1.4); pintar(g, '#f2f0ea');
  trazo(g, [4.5, -18.5, 0, -21.5], '#1e1e22', 1.3);
  elip(g, 7, -16.6, 1.1, 1.1); pintar(g, '#e83a3a');
  poli(g, [9, -16.4, 12.5, -15.6, 9, -15]); pintar(g, '#e8a090', LINEA, 0.8);
  g.restore();
}
function yacare(g, x, y, dir, t, boina) {
  g.save(); g.translate(x, y); if (dir === 'l') g.scale(-1, 1);
  const w = Math.sin(t * 1.5) * 1.5;
  poli(g, [-10, -8, -28, -4 + w, -10, -2]); pintar(g, '#4a6a3a', LINEA, 1.3);
  for (const [lx, ly] of [[-8, -1], [6, -1]]) { rr(g, lx - 2, ly - 3, 5, 5, 2); pintar(g, '#3e5a30', LINEA, 1); }
  elip(g, 0, -6, 13, 6); pintar(g, '#4f7240', LINEA, 1.4);
  for (let k = 0; k < 6; k++) { elip(g, -10 + k * 4, -11, 1.7, 1.4); pintar(g, '#3a5a2c'); }
  elip(g, 0, -3.4, 10, 2.4); pintar(g, '#a8b878');
  rr(g, 9, -11, 18, 8, [3, 5, 4, 3]); pintar(g, '#557a44', LINEA, 1.3);
  trazo(g, [12, -5.5, 26, -5.5], '#2a3a1e', 1); for (let k = 0; k < 4; k++) poli(g, [14 + k * 3, -5.5, 15 + k * 3, -3.8, 16 + k * 3, -5.5]), pintar(g, '#ffffff');
  elip(g, 13, -11.5, 3, 2.6); pintar(g, '#557a44', LINEA, 1); elip(g, 13.5, -11.8, 1.6, 1.3); pintar(g, '#f0d040'); trazo(g, [13.5, -12.8, 13.5, -10.8], '#1a1a10', 0.8);
  if (boina) { elip(g, 13, -14, 6, 2.4); pintar(g, '#1e1e26', LINEA, 1); trazo(g, [13, -16, 13, -18], '#1e1e26', 1.4); }
  g.restore();
}
function hornera(g, x, y, dir, t) {
  g.save(); g.translate(x, y);
  g.save(); g.translate(-15, 0); elip(g, 0, -7, 11, 9); pintar(g, '#b07e4e', LINEA, 1.3); elip(g, -2, -10, 6, 4); pintar(g, '#c8945e'); elip(g, 4, -6, 3, 3.5); pintar(g, '#3a2414'); g.restore();
  if (dir === 'l') g.scale(-1, 1);
  const salto = Math.abs(Math.sin(t * 3)) * 1.2;
  trazo(g, [-1, -4, -1, 0], '#5a3a2a', 1.2); trazo(g, [2, -4, 2, 0], '#5a3a2a', 1.2);
  poli(g, [-5, -9 - salto, -11, -7 - salto, -5, -6 - salto]); pintar(g, '#8a4a24');
  elip(g, 0, -8 - salto, 6, 5); pintar(g, '#b8693a', LINEA, 1.2);
  elip(g, 2, -6.5 - salto, 3.5, 2.5); pintar(g, '#ecc8a0');
  elip(g, 4.5, -13 - salto, 3.4, 3.2); pintar(g, '#a85e32', LINEA, 1);
  elip(g, 5.4, -13.6 - salto, 0.9, 0.9); pintar(g, '#1a1410');
  poli(g, [7.4, -13.4 - salto, 10.5, -12.8 - salto, 7.4, -12 - salto]); pintar(g, '#3a2a1a');
  g.restore();
}
function mulita(g, x, y, dir, t) {
  g.save(); g.translate(x, y); if (dir === 'l') g.scale(-1, 1);
  trazo(g, [-9, -5, -15, -3], '#9a7a6a', 2);
  for (const lx of [-6, 5]) { rr(g, lx, -4, 3.5, 4, 1.5); pintar(g, '#8a6a5a'); }
  elip(g, 0, -8, 10, 7); pintar(g, '#c4a494', LINEA, 1.3);
  for (let k = -2; k <= 2; k++) trazo(g, [k * 3.2, -14.5, k * 3.2, -2], '#9a7a6a', 1.1);
  poli(g, [8, -11, 16, -6, 8, -4]); pintar(g, '#d0b4a4', LINEA, 1.1);
  elip(g, 9, -11, 2, 2.6); pintar(g, '#b08a7a', LINEA, 0.8); elip(g, 11.5, -8, 0.9, 0.9); pintar(g, '#1a1410');
  g.restore();
}
function coati(g, x, y, dir, t, corre) {
  g.save(); g.translate(x, y); if (dir === 'l') g.scale(-1, 1);
  const p = corre ? Math.sin(t * 18) * 2 : 0;
  for (let k = 0; k < 6; k++) { const a = -0.3 - k * 0.32; elip(g, -9 + Math.cos(a) * k * 2.6 - k, -10 - k * 2.4, 2.4, 2.2); pintar(g, k % 2 ? '#3a2818' : '#c8a070', LINEA, 0.6); }
  for (const lx of [-6 + p, 4 - p]) { rr(g, lx, -4, 3, 4.5, 1.5); pintar(g, '#4a3020'); }
  elip(g, 0, -8, 9.5, 5.8); pintar(g, '#9a6a3a', LINEA, 1.3);
  poli(g, [7, -12, 18, -8, 7, -5]); pintar(g, '#8a5a2e', LINEA, 1.1);
  elip(g, 10, -10, 3, 2); pintar(g, '#2a1a10'); elip(g, 10.5, -10.3, 1, 1); pintar(g, '#ffffff');
  elip(g, 6, -13, 2, 2); pintar(g, '#7a4a24', LINEA, 0.8); elip(g, 18, -8, 1, 1); pintar(g, '#1a1010');
  g.restore();
}
function nutria(g, x, y, dir, t) {
  g.save(); g.translate(x, y); if (dir === 'l') g.scale(-1, 1);
  poli(g, [-8, -6, -18, -2, -8, -2]); pintar(g, '#3e2c1e', LINEA, 1);
  elip(g, 0, -8, 10, 7); pintar(g, '#6e4a2e', LINEA, 1.3);
  elip(g, 9, -12, 6, 5); pintar(g, '#7a5434', LINEA, 1.2);
  rr(g, 12, -9.5, 1.6, 3, 0.5); pintar(g, '#ff9a30'); rr(g, 14, -9.5, 1.6, 3, 0.5); pintar(g, '#ff9a30');
  elip(g, 10, -13.5, 1.1, 1.1); pintar(g, '#1a1010'); for (let k = -1; k <= 1; k++) trazo(g, [13, -11, 19, -11 + k * 2], '#e8dcc8', 0.6);
  g.restore();
}
function ciervo(g, x, y, dir, t) {
  g.save(); g.translate(x, y); if (dir === 'l') g.scale(-1, 1);
  for (const lx of [-8, -4, 5, 9]) trazo(g, [lx, -12, lx, 0], '#2a1e1a', 2.2);
  elip(g, 0, -16, 12, 7); pintar(g, '#b0603a', LINEA, 1.3);
  poli(g, [7, -18, 11, -28, 15, -27, 12, -16]); pintar(g, '#b0603a', LINEA, 1.1);
  elip(g, 14, -29, 5, 3.6); pintar(g, '#a85a36', LINEA, 1.1); elip(g, 18, -28, 2.2, 1.8); pintar(g, '#f0e8e0');
  elip(g, 14, -30, 1, 1); pintar(g, '#1a1010');
  trazo(g, [12, -32, 9, -40, 6, -42], '#e0d0b0', 1.6); trazo(g, [9, -40, 12, -44], '#e0d0b0', 1.4); trazo(g, [14, -32, 17, -40, 20, -42], '#e0d0b0', 1.6);
  g.restore();
}
function cemento(g, x, y, dir, t, s) {
  g.save(); g.translate(x, y); g.scale(s || 1, s || 1); if (dir === 'l') g.scale(-1, 1);
  rr(g, -6, -6, 4.5, 7, 2); pintar(g, '#3a3e48'); rr(g, 2, -6, 4.5, 7, 2); pintar(g, '#3a3e48');
  elip(g, 0, -15, 10, 11); pintar(g, '#5a6270', LINEA, 1.4);
  poli(g, [-3, -25, 3, -25, 0, -17]); pintar(g, '#ffffff'); poli(g, [-1, -24, 1, -24, 1.4, -14, 0, -12, -1.4, -14]); pintar(g, '#d83a3a');
  rr(g, 8, -18, 4, 8, 1.5); pintar(g, '#2a2a30');
  elip(g, 0, -29, 7, 6.5); pintar(g, '#f0b89a', LINEA, 1.3);
  elip(g, 2.5, -31, 1, 1.1); pintar(g, '#1a1010'); elip(g, -1.5, -31, 1, 1.1); pintar(g, '#1a1010');
  elip(g, -2, -27, 3.5, 1.8, 0.2); pintar(g, '#2a1a10'); elip(g, 3, -27, 3.5, 1.8, -0.2); pintar(g, '#2a1a10');
  g.beginPath(); g.arc(0, -32, 7.5, Math.PI, 0); pintar(g, '#f2c230', LINEA, 1.2); rr(g, -9, -33, 18, 2.5, 1); pintar(g, '#d8a820', LINEA, 1);
  g.restore();
}
function dibujarPersonaje(g, id, x, y, dir, t, o) {
  o = o || {};
  if (PIELES[id]) return capy(g, x, y, dir, t, Object.assign({ anim: o.anim, mov: o.mov, fase: x }, PIELES[id], o));
  if (id === 'tereso') return tero(g, x, y, dir, t, o.vuela, o.escala);
  if (id === 'yaca') return yacare(g, x, y, dir, t, o.boina);
  if (id === 'rosa') return hornera(g, x, y, dir, t);
  if (id === 'mulita') return mulita(g, x, y, dir, t);
  if (id === 'coati') return coati(g, x, y, dir, t, o.corre);
  if (id === 'nutria') return nutria(g, x, y, dir, t);
  if (id === 'ciervo') return ciervo(g, x, y, dir, t);
  if (id === 'cemento') return cemento(g, x, y, dir, t, o.escala);
  if (id === 'mosquita') return mosquito(g, x, y, dir, t, 2.4, true);
}
function sombra(g, x, y, r, a) { elip(g, x, y, r, r * 0.35); pintar(g, 'rgba(20,20,30,' + (a || 0.25) + ')'); }

// ---------- enemigos ----------
function mosquito(g, x, y, dir, t, s, reina) {
  g.save(); g.translate(x, y); g.scale(s || 1, s || 1); if (dir === 'l') g.scale(-1, 1);
  const a = Math.sin(t * 50);
  g.globalAlpha = 0.55; elip(g, -1, -9, 5, 2.4, -0.6 + a * 0.5); pintar(g, '#e0f4ff', '#8ab0c8', 0.6); elip(g, 1, -9, 5, 2.4, 0.6 - a * 0.5); pintar(g, '#e0f4ff', '#8ab0c8', 0.6); g.globalAlpha = 1;
  for (let k = 0; k < 3; k++) trazo(g, [-2 + k * 2, -5, -4 + k * 3, 0], '#3a3a48', 0.8);
  elip(g, -3, -5.5, 4.5, 2.2, 0.3); pintar(g, '#4a4a5a', LINEA, 0.8);
  trazo(g, [-5.5, -5, -4.5, -6.6], '#e8e8f0', 0.8); trazo(g, [-3, -4.4, -2, -6.4], '#e8e8f0', 0.8);
  elip(g, 2, -6.5, 2.5, 2.3); pintar(g, '#4a4a5a', LINEA, 0.8);
  elip(g, 3.2, -7.2, 1.2, 1.2); pintar(g, '#ff3030');
  trazo(g, [4, -6, 9, -4], '#2a2a30', 0.9);
  if (reina) { poli(g, [0.5, -9, 1, -12, 2, -10, 3, -12.5, 4, -10, 5, -12, 4.8, -8.8]); pintar(g, '#ffd030', LINEA, 0.5); elip(g, 3.8, -5.6, 0.9, 0.6); pintar(g, '#ff3a6a'); }
  g.restore();
}
function dibujarEnemigo(g, e, t) {
  const px = e.x * TS, py = e.y * TS, at = e.aturdido > 0;
  if (e.inv > 0 && Math.floor(t * 30) % 2) g.globalAlpha = 0.5;
  if (e.id === 'mosquito') { sombra(g, px, py, 5); mosquito(g, px, py - 12 - Math.sin(t * 5 + e.x0) * 2 + (at ? 10 : 0), e.dir, t * (at ? 0.1 : 1), 1.3); }
  else if (e.id === 'sapo') {
    const h = e.salto ? Math.sin(Math.min(1, e.salto.t / 0.38) * Math.PI) * 9 : 0, sq = e.salto ? 0.9 : 1 + Math.sin(t * 3) * 0.04;
    sombra(g, px, py, 9);
    g.save(); g.translate(px, py - h); g.scale(e.dir === 'l' ? -1 : 1, 1); g.scale(1 / sq, sq);
    elip(g, 0, -6, 9, 6.5); pintar(g, '#5aa03a', LINEA, 1.3); elip(g, 1, -4, 6, 3); pintar(g, '#e8e070');
    for (const sx of [-3.5, 3.5]) { elip(g, sx, -11.5, 3, 3); pintar(g, '#6ab048', LINEA, 1); elip(g, sx + 0.5, -11.8, 1.5, 1.7); pintar(g, '#1a1a10'); }
    trazo(g, [-4, -7, 4, -7], '#2a4a1a', 1);
    g.restore();
  } else if (e.id === 'pirana') {
    g.save(); g.translate(px, py); if (e.dir === 'l') g.scale(-1, 1);
    g.globalAlpha *= 0.85; elip(g, 0, -3, 8, 4.5); pintar(g, '#8a9aa8', LINEA, 1.1); elip(g, 0, -1.5, 6, 2.4); pintar(g, '#e84a3a');
    poli(g, [-7, -3, -12, -6, -12, 0]); pintar(g, '#7a8a98', LINEA, 1); poli(g, [-1, -7, 3, -10, 3, -6.5]); pintar(g, '#7a8a98');
    elip(g, 4, -4, 1.1, 1.1); pintar(g, '#ff3030');
    if (e.ataque > 0.8) for (let k = 0; k < 3; k++) poli(g, [5 + k * 1.3, -2, 5.6 + k * 1.3, -0.6, 6.2 + k * 1.3, -2]), pintar(g, '#ffffff');
    g.restore();
    elip(g, px, py - 2, 10, 3.5); g.strokeStyle = 'rgba(255,255,255,0.4)'; g.lineWidth = 1; g.stroke();
  } else if (e.id === 'dron') {
    const hh = 16 + Math.sin(t * 3 + e.x0) * 2 + (at ? 10 : 0);
    sombra(g, px, py, 8);
    g.save(); g.translate(px, py - hh);
    for (const [ax, ay] of [[-8, -4], [8, -4], [-8, 4], [8, 4]]) { trazo(g, [0, 0, ax, ay], '#3a3a40', 1.6); g.globalAlpha = 0.45; elip(g, ax, ay, 5, 1.8); pintar(g, '#d0d8e0'); g.globalAlpha = 1; }
    rr(g, -6, -4, 12, 8, 3); pintar(g, '#f0c040', LINEA, 1.2);
    for (let k = 0; k < 3; k++) { poli(g, [-5 + k * 4, 4, -3 + k * 4, 4, -1 + k * 4, -4, -3 + k * 4, -4]); pintar(g, '#2a2a2a'); }
    elip(g, 0, 1, 2, 2); pintar(g, Math.sin(t * 8) > 0 ? '#ff3030' : '#801818');
    g.restore();
  }
  if (at) for (let k = 0; k < 3; k++) { const a = t * 4 + k * 2.1; elip(g, px + Math.cos(a) * 7, py - 22 + Math.sin(a) * 2, 1.6, 1.6); pintar(g, '#ffe060'); }
  g.globalAlpha = 1;
}

// ---------- entidades ----------
function dibujarEnt(g, e, t, n) {
  const px = e.x * TS, py = e.y * TS;
  if (e.tipo === 'enemigo') return dibujarEnemigo(g, e, t);
  if (e.tipo === 'npc') {
    if (e.id === 'tereso') { sombra(g, px, py, 6, e.vuela ? 0.15 : 0.25); return tero(g, px, py, e.dir, t, e.vuela > 0.2); }
    sombra(g, px, py, e.id === 'yaca' ? 20 : 11);
    return dibujarPersonaje(g, e.id, px, py, e.dir, t, { boina: n.flag('yaca'), corre: e.corre, anim: e.camina ? t * 10 : 0, mov: e.camina || e.corre ? 1 : 0 });
  }
  if (e.tipo === 'empujable') {
    sombra(g, px, py + 1, 13, 0.3);
    if (e.id === 'tronco') { rr(g, px - 13, py - 13, 26, 13, 6); pintar(g, '#9a6a3c', LINEA, 1.4); trazo(g, [px - 9, py - 9, px + 7, py - 9], '#7a4e28', 1.2); elip(g, px + 10, py - 6.5, 3.5, 6); pintar(g, '#d8b080', LINEA, 1.1); elip(g, px + 10, py - 6.5, 1.5, 3); pintar(g, '#b08858'); return; }
    if (n.id === 'c2') { elip(g, px, py - 10, 12, 11); pintar(g, '#f8f8f4', LINEA, 1.4); for (let k = 0; k < 9; k++) { elip(g, px - 6 + (k % 3) * 6, py - 15 + Math.floor(k / 3) * 5, 1.2, 1); pintar(g, '#d8d8d0'); } return; }
    if (n.id === 'c3') { rr(g, px - 12, py - 22, 24, 9, [4, 4, 0, 0]); pintar(g, '#9aa4ae', LINEA, 1.3); rr(g, px - 12, py - 14, 24, 14, [0, 0, 4, 4]); pintar(g, '#6e7884', LINEA, 1.3); trazo(g, [px - 9, py - 11, px + 9, py - 3], '#f0c040', 2); return; }
    elip(g, px, py - 9, 13, 10); pintar(g, '#9a958a', LINEA, 1.4); elip(g, px - 4, py - 13, 5, 3); pintar(g, '#b8b4a8'); return;
  }
  if (e.tipo === 'jaula') {
    const ab = n.flag('jaula_' + e.id);
    sombra(g, px, py, 13);
    dibujarPersonaje(g, e.id, px, py - 1, 'd' === e.dir ? 'r' : e.dir, t, {});
    if (!ab) { for (let k = 0; k < 6; k++) { rr(g, px - 14 + k * 5.4, py - 26, 2.4, 27, 1); pintar(g, '#5a6070'); } rr(g, px - 15, py - 28, 30, 4, 2); pintar(g, '#4a505e', LINEA, 1); rr(g, px - 15, py - 1, 30, 3, 1); pintar(g, '#4a505e'); if (e.golpe) { rr(g, px - 4, py - 16, 8, 7, 2); pintar(g, '#e8c040', LINEA, 1); } }
    return;
  }
  if (e.tipo === 'item') {
    const b = Math.sin(t * 3 + e.x) * 2;
    sombra(g, px, py, 7, 0.2);
    if (e.id === 'boina') { elip(g, px, py - 9 + b, 9, 4); pintar(g, '#1e1e26', LINEA, 1.2); trazo(g, [px, py - 12 + b, px, py - 15 + b], '#1e1e26', 1.6); }
    else if (e.id === 'corazon') icono(g, 'corazon', px, py - 8 + b, 0.8);
    brillo(g, px + 6, py - 16 + b, t);
    return;
  }
  if (e.tipo === 'figurita') {
    const b = Math.sin(t * 2.5 + e.x) * 2, k = Math.cos(t * 2);
    sombra(g, px, py, 8, 0.2);
    g.save(); g.translate(px, py - 13 + b); g.scale(Math.max(0.15, Math.abs(k)), 1);
    rr(g, -7, -9, 14, 18, 2.5); pintar(g, k > 0 ? '#fffaf0' : '#e8a020', LINEA, 1.2);
    if (k > 0) { elip(g, 0, -1, 4.5, 4); pintar(g, '#e8a020'); txt(g, '?', 0, -1, { tam: 7, c: '#ffffff', al: 0.5 }); }
    g.restore(); brillo(g, px + 7, py - 22 + b, t);
    return;
  }
  if (e.tipo === 'cartel') {
    rr(g, px - 2, py - 14, 4, 15, 1); pintar(g, '#7a5232', LINEA, 1);
    rr(g, px - 12, py - 24, 24, 13, 2); pintar(g, '#c89a5e', LINEA, 1.3);
    for (let k = 0; k < 3; k++) trazo(g, [px - 8, py - 21 + k * 3.5, px + 8 - (k % 2) * 4, py - 21 + k * 3.5], '#8a6038', 1);
  }
}
function brillo(g, x, y, t) { const k = (Math.sin(t * 4 + x) + 1) / 2; g.fillStyle = 'rgba(255,255,240,' + k + ')'; g.fillRect(x - 0.6, y - 3 * k, 1.2, 6 * k); g.fillRect(x - 3 * k, y - 0.6, 6 * k, 1.2); }
function dibujarJugador(g, j, t) {
  const px = j.x * TS, py = j.y * TS;
  if (j.inv > 0 && Math.floor(t * 24) % 2 && j.desmayo <= 0) return;
  if (!j.nada) sombra(g, px, py, 11);
  if (j.desmayo > 0) { g.save(); g.translate(px, py); g.rotate(Math.min(1, (1.8 - j.desmayo) * 2) * 1.4); capy(g, 0, 0, 'r', t, Object.assign({}, PIELES.pancho)); g.restore(); for (let k = 0; k < 3; k++) { const a = t * 4 + k * 2.1; elip(g, px + Math.cos(a) * 9, py - 26 + Math.sin(a) * 3, 2, 2); pintar(g, '#ffe060'); } return; }
  capy(g, px, py, j.dir, t, Object.assign({ anim: j.anim, mov: j.mov, nada: j.nada, dash: j.dash > 0 }, PIELES.pancho));
  if (j.carga) { const b = Math.sin(t * 6) * 1; elip(g, px, py - 30 + b, 7, 6); pintar(g, '#7a5432', LINEA, 1.3); elip(g, px - 2, py - 32 + b, 2.5, 1.8); pintar(g, '#9a7452'); }
}

// ---------- jefes ----------
function dibujarJefe(g, j, t) {
  const px = j.x * TS, py = j.y * TS, flash = j.inv > 0 && Math.floor(t * 20) % 2;
  if (j.id === 'mosquita') {
    if (j.est === 'apuntar' || j.est === 'picada') { const k = j.est === 'apuntar' ? Math.min(1, j.t / 1.05) : 1; elip(g, j.sx * TS, j.sy * TS, 8 + 16 * k, (8 + 16 * k) * 0.4); pintar(g, 'rgba(200,30,40,' + (0.15 + 0.25 * k) + ')'); g.strokeStyle = 'rgba(255,60,60,0.8)'; g.lineWidth = 1.5; g.stroke(); }
    sombra(g, px, py, 18, 0.3);
    if (flash) g.globalAlpha = 0.5;
    const hh = j.h * TS + Math.sin(t * 4) * 3;
    mosquito(g, px, py - hh, J.x < j.x ? 'l' : 'r', j.est === 'clavada' ? t * 0.3 : t, 2.6, true);
    if (j.est === 'clavada') { for (let k = 0; k < 3; k++) { const a = t * 5 + k * 2.1; elip(g, px + Math.cos(a) * 14, py - 34 + Math.sin(a) * 3, 2.2, 2.2); pintar(g, '#ffe060'); } }
    g.globalAlpha = 1;
  } else if (j.id === 'cortacesped') {
    sombra(g, px, py + 4, 30, 0.3);
    g.save(); g.translate(px, py - 6); g.rotate(j.ang);
    if (flash) g.globalAlpha = 0.6;
    for (const [wx, wy] of [[-18, -20], [-18, 14], [14, -20], [14, 14]]) { rr(g, wx, wy, 10, 6, 2); pintar(g, '#2a2a2a'); }
    rr(g, -26, -17, 46, 34, 9); pintar(g, j.est === 'preparar' && Math.floor(t * 12) % 2 ? '#ff6a40' : '#c8402a', LINEA, 1.8);
    rr(g, -22, -13, 22, 26, 6); pintar(g, j.est === 'aturdido' ? '#3a2a20' : '#9a2e1e', LINEA, 1.2);
    if (j.est === 'aturdido') { elip(g, -11, 0, 8, 8); pintar(g, '#ffa030'); g.globalCompositeOperation = 'lighter'; elip(g, -11, 0, 14, 14); pintar(g, 'rgba(255,160,40,' + (0.3 + 0.2 * Math.sin(t * 10)) + ')'); g.globalCompositeOperation = 'source-over'; }
    else for (let k = 0; k < 4; k++) trazo(g, [-20 + k * 5, -10, -20 + k * 5, 10], '#7a2216', 1.5);
    elip(g, 14, 0, 14, 14); pintar(g, '#8a8f96', LINEA, 1.4);
    for (let k = 0; k < 3; k++) { const a = j.giro + k * 2.09; trazo(g, [14, 0, 14 + Math.cos(a) * 12, Math.sin(a) * 12], '#e8e8ec', 2.4); }
    elip(g, 14, 0, 3, 3); pintar(g, '#3a3a3a');
    rr(g, -4, -20, 10, 6, 2); pintar(g, '#f0c040', LINEA, 1);
    elip(g, 6, -10, 2.5, 2.5); pintar(g, '#ffffff'); elip(g, 6, 10, 2.5, 2.5); pintar(g, '#ffffff');
    g.globalAlpha = 1; g.restore();
  } else if (j.id === 'draga') {
    const cae = j.est === 'cae' ? Math.min(1, j.t / 2.4) : 0, ox = cae ? Math.sin(t * 30) * 3 : 0;
    g.save(); g.translate(px + ox, py + cae * 30); g.rotate(cae * 0.18);
    if (flash) g.globalAlpha = 0.6;
    rr(g, -100, -40, 200, 66, 12); pintar(g, '#e8b030', LINEA, 2);
    for (let k = 0; k < 12; k++) { poli(g, [-96 + k * 16, 20, -88 + k * 16, 20, -80 + k * 16, 26, -88 + k * 16, 26]); pintar(g, '#2a2a2a'); }
    rr(g, -60, -62, 50, 30, 8); pintar(g, '#d8a020', LINEA, 1.6);
    rr(g, -54, -56, 38, 18, 5); pintar(g, '#8ac8e8', LINEA, 1.2);
    cemento(g, -35, -36, 'r', t, 0.8);
    rr(g, 50, -78, 14, 44, 4); pintar(g, '#6a6a70', LINEA, 1.4);
    if (vis() < 0.3) EFECTOS.push({ x: j.x + 2, y: j.y - 2.6, vx: rnd(-0.2, 0.2), vy: -0.6, z: 0, vz: 0, vida: 1.2, max: 1.2, c: '#5a5a5a', t: 'humo', tam: 0.25 });
    trazo(g, [20, -40, 70, -90, 90, -60], '#c89a20', 6);
    const ab = j.est === 'expuesta';
    rr(g, -22, -52, 44, 18, 6); pintar(g, '#6a6a72', LINEA, 1.6);
    elip(g, 0, -45, 15, 11); pintar(g, ab ? '#ffa030' : '#4a4a52', LINEA, 1.6);
    if (ab) { g.globalCompositeOperation = 'lighter'; elip(g, 0, -45, 26, 20); pintar(g, 'rgba(255,150,40,' + (0.35 + 0.2 * Math.sin(t * 12)) + ')'); g.globalCompositeOperation = 'source-over'; }
    else { trazo(g, [-11, -45, 11, -45], '#2e2e34', 2.2); trazo(g, [0, -54, 0, -36], '#2e2e34', 2.2); }
    g.globalAlpha = 1; g.restore();
    if (j.garra) {
      const gr = j.garra, gy = gr.y * TS;
      if (gr.t <= 0.9) { g.fillStyle = 'rgba(255,40,40,' + (0.12 + 0.12 * Math.sin(t * 20)) + ')'; g.fillRect(3 * TS, gy - 14, 20 * TS, 28); }
      else { const gx = gr.x * TS; trazo(g, [px + 60, py - 80, gx, gy - 4], '#8a8a90', 3); g.save(); g.translate(gx, gy); for (const s of [-1, 1]) { poli(g, [0, -6, s * 14, -12, s * 18, 2, s * 6, 8]); pintar(g, '#9aa0aa', LINEA, 1.4); } g.restore(); }
    }
    // Lola en su jaula, al costado
    const lx = (j.x + 4.6) * TS, ly = (j.y + 0.2) * TS;
    capy(g, lx, ly, 'l', t, Object.assign({}, PIELES.lola));
    for (let k = 0; k < 5; k++) { rr(g, lx - 12 + k * 6, ly - 22, 2, 22, 1); pintar(g, '#5a6070'); } rr(g, lx - 13, ly - 24, 28, 3.5, 2); pintar(g, '#4a505e', LINEA, 1);
  }
}
function dibujarProy(g, p, t) {
  const px = p.x * TS, py = p.y * TS;
  if (p.cae) { const k = p.t / p.dur; elip(g, px, py, 6 + 14 * k, (6 + 14 * k) * 0.4); pintar(g, 'rgba(40,40,50,' + (0.15 + 0.3 * k) + ')'); rr(g, px - 8, py - (1 - k) * 120 - 18, 16, 14, 3); pintar(g, '#d8d0c0', LINEA, 1.3); trazo(g, [px - 5, py - (1 - k) * 120 - 12, px + 5, py - (1 - k) * 120 - 12], '#a8a090', 1.2); return; }
  if (p.id === 'bola') { sombra(g, px, py + 10, 4, 0.2); for (const s of [-1, 1]) { const a = p.r * 2 + (s > 0 ? Math.PI : 0); const bx = px + Math.cos(a) * 6, by = py + Math.sin(a) * 3; trazo(g, [px, py, bx, by], '#8a6a4a', 1.2); elip(g, bx, by, 3, 3); pintar(g, '#7a5232', LINEA, 1); } return; }
  if (p.id === 'clavo') { elip(g, px, py, 3.2, 3.2); pintar(g, '#ff8040'); g.globalCompositeOperation = 'lighter'; elip(g, px, py, 7, 7); pintar(g, 'rgba(255,120,40,0.35)'); g.globalCompositeOperation = 'source-over'; return; }
  if (p.id === 'pasto') { g.save(); g.translate(px, py); g.rotate(p.r); rr(g, -4, -1.5, 8, 3, 1.5); pintar(g, '#6ac048', LINEA, 0.8); g.restore(); }
}
function dibujarEfecto(g, f, t) {
  const k = f.vida / f.max, px = f.x * TS, py = f.y * TS - (f.z || 0) * TS;
  switch (f.t) {
    case 'polvo': case 'humo': g.globalAlpha = k * (f.t === 'humo' ? 0.6 : 0.7); elip(g, px, py, f.tam * TS * (1.6 - k * 0.6), f.tam * TS * (1.6 - k * 0.6)); pintar(g, f.c); g.globalAlpha = 1; break;
    case 'chispa': g.globalAlpha = Math.min(1, k * 2); elip(g, px, py, 1.6, 1.6); pintar(g, f.c); g.globalAlpha = 1; break;
    case 'gota': g.globalAlpha = Math.min(1, k * 2); elip(g, px, py, f.tam * TS, f.tam * TS); pintar(g, f.c); g.globalAlpha = 1; break;
    case 'hoja': case 'astilla': g.save(); g.translate(px, py); g.rotate(f.r + t * 6); g.globalAlpha = Math.min(1, k * 2); elip(g, 0, 0, f.tam * TS, f.tam * TS * 0.5); pintar(g, f.c); g.restore(); g.globalAlpha = 1; break;
    case 'anillo': elip(g, px, py, (1 - k) * 14 + 4, ((1 - k) * 14 + 4) * 0.4); g.strokeStyle = 'rgba(255,255,255,' + k * 0.7 + ')'; g.lineWidth = 1.5; g.stroke(); break;
    case 'onda': elip(g, px, py, (1 - k) * f.tam * TS, (1 - k) * f.tam * TS * 0.55); g.strokeStyle = 'rgba(180,240,255,' + k + ')'; g.lineWidth = 3; g.stroke(); break;
    case 'puf': g.globalAlpha = k; for (let a = 0; a < 6; a++) { elip(g, px + Math.cos(a) * (1 - k) * 14, py - 8 + Math.sin(a) * (1 - k) * 10, 5 * k + 2, 5 * k + 2); pintar(g, '#ffffff'); } g.globalAlpha = 1; break;
    case 'estrellas': for (let a = 0; a < 3; a++) { const an = t * 5 + a * 2.1; elip(g, px + Math.cos(an) * 7, py - 22 + Math.sin(an) * 2, 1.6, 1.6); pintar(g, '#ffe060'); } break;
    case 'subir': g.globalAlpha = k; icono(g, 'corazon', px, py - 14 - (1 - k) * 20, 0.6); g.globalAlpha = 1; break;
    case 'mancha': g.globalAlpha = Math.min(1, k); elip(g, px, py, f.tam * TS, f.tam * TS * 0.45); pintar(g, '#b8b0a4', '#8a8478', 1); g.globalAlpha = 1; break;
  }
}

// ---------- luz y clima ----------
const LLUVIA = Array.from({ length: 90 }, (_, k) => ({ x: (k * 0.137) % 1, y: (k * 0.611) % 1, v: 0.8 + (k % 5) * 0.12 }));
let RELAMPAGO = 0, PROX_RAYO = 6;
function luzYClima(g, n, t, dt) {
  const { x, y, w, h } = VISTA;
  if (n.d.luz === 'manana') { g.fillStyle = 'rgba(255,190,120,0.10)'; g.fillRect(x, y, w, h); }
  if (n.d.luz === 'noche') {
    g.globalCompositeOperation = 'multiply'; g.fillStyle = '#6a77a8'; g.fillRect(x, y, w, h); g.globalCompositeOperation = 'source-over';
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    g.globalCompositeOperation = 'lighter';
    const ox = x + w / 2 - CAM.x * TS, oy = y + h / 2 - CAM.y * TS;
    const luzEn = (lx, ly, r, c) => { const gr = g.createRadialGradient(lx, ly, 0, lx, ly, r); gr.addColorStop(0, c); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(lx - r, ly - r, r * 2, r * 2); };
    luzEn(ox + J.x * TS, oy + (J.y - 0.4) * TS, 95, 'rgba(130,140,180,0.42)');
    const x0 = Math.floor(CAM.x - w / 2 / TS) - 1, x1 = Math.ceil(CAM.x + w / 2 / TS) + 1, y0 = Math.floor(CAM.y - h / 2 / TS) - 1, y1 = Math.ceil(CAM.y + h / 2 / TS) + 1;
    for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) {
      const c = n.tile(xx, yy);
      if (c === 'F') luzEn(ox + (xx + 0.5) * TS, oy + (yy + 0.4) * TS, 80 + Math.sin(t * 9) * 4, 'rgba(255,150,60,0.55)');
      else if (c === 'c' && hash(xx, yy) > 0.82) luzEn(ox + (xx + 0.5) * TS, oy + (yy + 0.1) * TS, 46, 'rgba(255,220,140,0.35)');
      else if (c === 'E' && !n.abierta('E', xx, yy)) luzEn(ox + (xx + 0.5) * TS, oy + (yy + 0.5) * TS, 40, 'rgba(80,170,255,0.35)');
    }
    if (n.jefe && n.jefe.id === 'draga') luzEn(ox + 12.5 * TS, oy + 53.5 * TS, 110, n.jefe.est === 'expuesta' ? 'rgba(255,150,50,0.5)' : 'rgba(255,200,120,0.18)');
    g.globalCompositeOperation = 'source-over';
    g.strokeStyle = 'rgba(200,215,255,0.35)'; g.lineWidth = 1.2; g.beginPath();
    for (const d of LLUVIA) { const lx = x + ((d.x + t * 0.05) % 1) * w, ly = y + ((d.y + t * d.v) % 1) * h; g.moveTo(lx, ly); g.lineTo(lx - 3, ly + 9); }
    g.stroke();
    PROX_RAYO -= dt; if (PROX_RAYO <= 0) { PROX_RAYO = rnd(6, 13); RELAMPAGO = 1; Sonido.trueno(); }
    if (RELAMPAGO > 0) { g.fillStyle = 'rgba(230,240,255,' + RELAMPAGO * 0.55 + ')'; g.fillRect(x, y, w, h); RELAMPAGO -= dt * 3; }
    g.restore();
  }
  const vg = g.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * 0.35, x + w / 2, y + h / 2, Math.max(w, h) * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, n.d.luz === 'noche' ? 'rgba(5,8,25,0.55)' : 'rgba(20,30,10,0.28)');
  g.fillStyle = vg; g.fillRect(x, y, w, h);
}

// ---------- íconos ----------
function icono(g, nom, x, y, s) {
  g.save(); g.translate(x, y); g.scale(s || 1, s || 1);
  switch (nom) {
    case 'corazon': case 'corazonM': case 'corazonV': {
      g.beginPath(); g.moveTo(0, 7); g.bezierCurveTo(-11, -1, -6, -10, 0, -4); g.bezierCurveTo(6, -10, 11, -1, 0, 7);
      pintar(g, nom === 'corazonV' ? '#5a3a3a' : '#ff4a5a', LINEA, 1.6);
      if (nom === 'corazonM') { g.save(); g.clip(); g.fillStyle = '#5a3a3a'; g.fillRect(0, -12, 14, 24); g.restore(); g.strokeStyle = LINEA; g.lineWidth = 1.6; g.stroke(); }
      if (nom !== 'corazonV') { elip(g, -3.5, -2.5, 2, 1.4, -0.6); pintar(g, 'rgba(255,255,255,0.7)'); }
      break;
    }
    case 'silbato': rr(g, -9, -4, 14, 9, 4); pintar(g, '#e0c040', LINEA, 1.4); elip(g, 5, 0.5, 4.5, 4.5); pintar(g, '#e0c040', LINEA, 1.4); elip(g, -3, 0, 2, 2); pintar(g, '#3a2a10'); trazo(g, [-9, -2, -13, -6], '#c84a3a', 2); break;
    case 'boleadoras': for (const [bx, by] of [[-7, 5], [7, 5], [0, -7]]) { trazo(g, [0, 0, bx, by], '#8a6a4a', 1.4); elip(g, bx, by, 4, 4); pintar(g, '#7a5232', LINEA, 1.3); } break;
    case 'boina': elip(g, 0, 2, 11, 5); pintar(g, '#1e1e26', LINEA, 1.4); trazo(g, [0, -2, 0, -6], '#1e1e26', 2); break;
    case 'llave': elip(g, -5, 0, 5, 5); pintar(g, '#e8c040', LINEA, 1.4); elip(g, -5, 0, 2, 2); pintar(g, '#3a2a10'); rr(g, -1, -1.6, 13, 3.2, 1); pintar(g, '#e8c040', LINEA, 1.2); rr(g, 8, 0, 2.5, 4, 0.5); pintar(g, '#e8c040'); break;
    case 'barro': elip(g, 0, 0, 8, 7); pintar(g, '#7a5432', LINEA, 1.4); break;
    case 'figurita': rr(g, -7, -9, 14, 18, 2.5); pintar(g, '#fffaf0', LINEA, 1.4); elip(g, 0, -1, 4.5, 4); pintar(g, '#e8a020'); break;
    case 'mano': g.beginPath(); g.moveTo(-6, 6); g.lineTo(-7, -2); g.quadraticCurveTo(-7, -5, -4.5, -4); g.lineTo(-4, -9); g.quadraticCurveTo(-2.5, -11, -1, -9); g.lineTo(0, -3); g.lineTo(1, -10); g.quadraticCurveTo(2.5, -12, 4, -10); g.lineTo(4, -3); g.lineTo(5.5, -8); g.quadraticCurveTo(7.5, -9, 7.5, -6); g.lineTo(7, 4); g.quadraticCurveTo(5, 9, -2, 8.5); g.closePath(); pintar(g, '#fff4e0', LINEA, 1.4); break;
    case 'embestida': capy(g, 2, 9, 'r', 0, Object.assign({ escala: 0.75 }, PIELES.pancho)); for (let k = 0; k < 3; k++) trazo(g, [-14, -6 + k * 5, -8, -6 + k * 5], '#ffffff', 2); break;
    case 'engranaje': for (let k = 0; k < 8; k++) { g.save(); g.rotate(k * Math.PI / 4); rr(g, -2.5, -10, 5, 6, 1); pintar(g, '#e8e0d0'); g.restore(); } elip(g, 0, 0, 7, 7); pintar(g, '#e8e0d0', LINEA, 1.3); elip(g, 0, 0, 2.8, 2.8); pintar(g, '#3a5a4a'); break;
    case 'globo': elip(g, 0, 0, 9, 9); pintar(g, '#4a9ae8', LINEA, 1.4); poli(g, [-5, -6, 1, -7, 3, -2, -1, 1, -4, -1]); pintar(g, '#5ac06a'); poli(g, [2, 2, 7, 1, 6, 6, 2, 6]); pintar(g, '#5ac06a'); break;
    case 'pausa': rr(g, -6, -8, 4.5, 16, 1.5); pintar(g, '#fff4e0', LINEA, 1); rr(g, 1.5, -8, 4.5, 16, 1.5); pintar(g, '#fff4e0', LINEA, 1); break;
    case 'libro': rr(g, -10, -8, 20, 16, 2); pintar(g, '#c8583a', LINEA, 1.4); rr(g, -8, -6, 16, 12, 1); pintar(g, '#fff4e0'); trazo(g, [0, -6, 0, 6], '#c8583a', 1.4); break;
    case 'bandera': trazo(g, [-5, 9, -5, -9], '#5a3a1e', 2); poli(g, [-5, -9, 8, -5, -5, -1]); pintar(g, '#e84a3a', LINEA, 1); break;
    case 'flecha': poli(g, [0, -9, 8, 0, 3, 0, 3, 9, -3, 9, -3, 0, -8, 0]); pintar(g, '#ffe070', LINEA, 1.3); break;
    case 'flecha2': poli(g, [-5, -8, 8, 0, -5, 8]); pintar(g, '#fff4dc', LINEA, 1.6); break;
    case 'casa': poli(g, [-9, -1, 0, -9, 9, -1]); pintar(g, '#e8684a', LINEA, 1.4); rr(g, -6.5, -2, 13, 10, 1.5); pintar(g, '#fff4dc', LINEA, 1.4); rr(g, -2, 2, 4, 6, 1); pintar(g, '#8a5a3a'); break;
    case 'mando': rr(g, -11, -6, 22, 13, 6); pintar(g, '#e8e0d0', LINEA, 1.4); rr(g, -8, -1.2, 6, 2.4, 0.8); pintar(g, LINEA); rr(g, -6.2, -3, 2.4, 6, 0.8); pintar(g, LINEA); elip(g, 4.5, -1.5, 1.7, 1.7); pintar(g, '#e84a3a'); elip(g, 7.5, 1.5, 1.7, 1.7); pintar(g, '#5ab04a'); break;
    case 'cruz': trazo(g, [-5, -5, 5, 5], LINEA, 2.6); trazo(g, [5, -5, -5, 5], LINEA, 2.6); break;
    case 'menos': trazo(g, [-6, 0, 6, 0], LINEA, 2.8); break;
    case 'mas': trazo(g, [-6, 0, 6, 0], LINEA, 2.8); trazo(g, [0, -6, 0, 6], LINEA, 2.8); break;
    case 'charla': rr(g, -10, -8, 20, 14, 6); pintar(g, '#ffffff', LINEA, 1.5); poli(g, [-4, 5, 2, 5, -5, 10]); pintar(g, '#ffffff'); trazo(g, [-4, 6, -5, 10, 2, 6], LINEA, 1.3); for (let k = 0; k < 3; k++) { elip(g, -5 + k * 5, -1, 1.5, 1.5); pintar(g, LINEA); } break;
  }
  g.restore();
}

// ---------- retratos y láminas ----------
function retrato(g, quien, cx, cy, r) {
  g.save(); elip(g, cx, cy, r, r); pintar(g, '#fff0d8', LINEA, 2); g.clip();
  const gr = g.createLinearGradient(0, cy - r, 0, cy + r); gr.addColorStop(0, '#bfe6c8'); gr.addColorStop(1, '#7ec29a'); g.fillStyle = gr; g.fillRect(cx - r, cy - r, r * 2, r * 2);
  const s = r / 14, t = T;
  g.translate(cx, cy); g.scale(s, s);
  if (quien === 'cartel') { rr(g, -11, -8, 22, 14, 2); pintar(g, '#c89a5e', LINEA, 1.3); for (let k = 0; k < 3; k++) trazo(g, [-7, -4 + k * 4, 7, -4 + k * 4], '#8a6038', 1.2); }
  else if (quien === 'tereso') tero(g, -4, 14, 'r', t, false, 1.6);
  else if (quien === 'yaca') yacare(g, -16, 8, 'r', t, N && N.flag('yaca'));
  else if (quien === 'mosquita') mosquito(g, -4, 14, 'r', t, 2.4, true);
  else if (quien === 'cemento') cemento(g, 0, 30, 'r', t, 1);
  else if (quien === 'rosa') { g.scale(1.6, 1.6); hornera(g, 4, 7, 'r', t); }
  else if (quien === 'ciervo') ciervo(g, -10, 34, 'r', t);
  else if (quien === 'mulita' || quien === 'coati' || quien === 'nutria') { g.scale(1.5, 1.5); dibujarPersonaje(g, quien, -4, 8, 'r', t, {}); }
  else if (PIELES[quien]) { const p = Object.assign({}, PIELES[quien], { escala: 1.5 }); capy(g, -10, 20, 'r', t, p); }
  g.restore();
  elip(g, cx, cy, r, r); g.strokeStyle = LINEA; g.lineWidth = 2; g.stroke();
}
function lamina(g, nom, x, y, w, h, t) {
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  const cielo = { tormenta: ['#2a2848', '#6a4a6a'], crecida: ['#1a1e38', '#3a4868'], manana: ['#8ac8e8', '#ffe0b0'], rescate: ['#1e2a4a', '#4a5a7a'], abrazo: ['#ffb08a', '#ffe8b0'], reserva: ['#7ac0e8', '#d8f0c8'] }[nom];
  const gr = g.createLinearGradient(0, y, 0, y + h * 0.6); gr.addColorStop(0, cielo[0]); gr.addColorStop(1, cielo[1]); g.fillStyle = gr; g.fillRect(x, y, w, h);
  const hz = y + h * 0.55;
  if (nom === 'manana' || nom === 'abrazo' || nom === 'reserva') { elip(g, x + w * 0.78, y + h * 0.22, 26, 26); pintar(g, 'rgba(255,240,180,0.9)'); }
  for (let k = 0; k < 3; k++) { elip(g, x + w * (0.2 + k * 0.32), hz - 6, w * 0.22, 14); pintar(g, nom === 'tormenta' || nom === 'crecida' || nom === 'rescate' ? '#2a3a3a' : '#5a9a5a'); }
  const ag = g.createLinearGradient(0, hz, 0, y + h); ag.addColorStop(0, nom === 'crecida' || nom === 'rescate' || nom === 'tormenta' ? '#2a4a6a' : '#4aa0d0'); ag.addColorStop(1, '#1e3a5a'); g.fillStyle = ag; g.fillRect(x, hz, w, h);
  for (let k = 0; k < 14; k++) { const wx = x + ((k * 53 + t * 20) % (w + 40)) - 20, wy = hz + 10 + (k * 17) % (h * 0.4); g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(wx, wy); g.quadraticCurveTo(wx + 6, wy - 3, wx + 12, wy); g.stroke(); }
  const cx = x + w / 2, by = y + h * 0.82, S = Math.min(w, h) / 160;
  g.save(); g.translate(cx, by); g.scale(S * 1.6, S * 1.6);
  if (nom === 'tormenta') { elip(g, 0, 2, 60, 8); pintar(g, '#6a8a4a'); capy(g, -26, 0, 'r', t, Object.assign({}, PIELES.abuela)); capy(g, 0, 0, 'r', t, Object.assign({}, PIELES.pancho)); capy(g, 24, 0, 'l', t, Object.assign({}, PIELES.lola)); }
  else if (nom === 'crecida') { const d = Math.sin(t) * 4; elip(g, 30 + d, 2, 22, 6); pintar(g, '#4a8a3a', LINEA, 1); for (let k = 0; k < 4; k++) flor(g, 18 + k * 7 + d, -1); capy(g, 30 + d, -2, 'l', t, Object.assign({}, PIELES.lola)); elip(g, -40, 4, 26, 6); pintar(g, '#6a8a4a'); capy(g, -42, 0, 'r', t, Object.assign({}, PIELES.pancho)); }
  else if (nom === 'manana') { elip(g, -20, 3, 50, 7); pintar(g, '#6aaa4a'); capy(g, -20, 0, 'r', t, Object.assign({}, PIELES.pancho)); }
  else if (nom === 'rescate') { capy(g, 0, 0, 'r', t, Object.assign({ nada: 1 }, PIELES.pancho)); cemento(g, -2, -8, 'r', t, 0.7); }
  else if (nom === 'abrazo') { elip(g, 0, 3, 50, 7); pintar(g, '#6aaa4a'); capy(g, -9, 0, 'r', t, Object.assign({}, PIELES.pancho)); capy(g, 9, 0, 'l', t, Object.assign({}, PIELES.lola)); tero(g, 26, -18, 'l', t, true); for (let k = 0; k < 3; k++) icono(g, 'corazon', -6 + k * 6, -32 - Math.sin(t * 2 + k) * 3, 0.35); }
  else if (nom === 'reserva') { elip(g, 0, 3, 70, 8); pintar(g, '#6aaa4a'); capy(g, -30, 0, 'r', t, Object.assign({}, PIELES.abuela)); capy(g, -12, 0, 'r', t, Object.assign({}, PIELES.pancho)); capy(g, 4, 0, 'r', t, Object.assign({}, PIELES.lola)); cemento(g, 30, 0, 'l', t, 0.8); tero(g, 18, -26, 'l', t, true); }
  g.restore();
  if (nom === 'reserva') { const sx = x + w * 0.2, sy = y + h * 0.3; rr(g, sx - 2, sy, 4, 34, 1); pintar(g, '#7a5232', LINEA, 1); rr(g, sx - 42, sy - 20, 84, 24, 4); pintar(g, '#c89a5e', LINEA, 1.5); txt(g, tr('reservaCartel'), sx, sy - 8, { tam: 10, c: '#3a2410', al: 0.5, max: 76 }); }
  if (nom === 'tormenta' || nom === 'crecida' || nom === 'rescate') {
    g.strokeStyle = 'rgba(200,215,255,0.4)'; g.lineWidth = 1.2; g.beginPath();
    for (const d of LLUVIA) { const lx = x + ((d.x + t * 0.06) % 1) * w, ly = y + ((d.y + t * d.v) % 1) * h; g.moveTo(lx, ly); g.lineTo(lx - 3, ly + 10); }
    g.stroke();
    if (nom === 'crecida' && (t % 3) < 0.15) { g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(x, y, w, h); }
  }
  g.restore();
}
