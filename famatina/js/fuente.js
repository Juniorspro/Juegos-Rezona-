// FAMATINA — letras: "px" 5×7 con acentos arriba y cedilla abajo, "mini" 3×5; lo que no tienen, letra del sistema
const F5 = {
  A: [5, 14, 17, 17, 31, 17, 17, 17], B: [5, 30, 17, 17, 30, 17, 17, 30], C: [5, 14, 17, 16, 16, 16, 17, 14], D: [5, 30, 17, 17, 17, 17, 17, 30],
  E: [5, 31, 16, 16, 30, 16, 16, 31], F: [5, 31, 16, 16, 30, 16, 16, 16], G: [5, 14, 17, 16, 23, 17, 17, 15], H: [5, 17, 17, 17, 31, 17, 17, 17],
  I: [3, 7, 2, 2, 2, 2, 2, 7], J: [5, 7, 2, 2, 2, 2, 18, 12], K: [5, 17, 18, 20, 24, 20, 18, 17], L: [5, 16, 16, 16, 16, 16, 16, 31],
  M: [5, 17, 27, 21, 21, 17, 17, 17], N: [5, 17, 17, 25, 21, 19, 17, 17], O: [5, 14, 17, 17, 17, 17, 17, 14], P: [5, 30, 17, 17, 30, 16, 16, 16],
  Q: [5, 14, 17, 17, 17, 21, 18, 13], R: [5, 30, 17, 17, 30, 20, 18, 17], S: [5, 15, 16, 16, 14, 1, 1, 30], T: [5, 31, 4, 4, 4, 4, 4, 4],
  U: [5, 17, 17, 17, 17, 17, 17, 14], V: [5, 17, 17, 17, 17, 17, 10, 4], W: [5, 17, 17, 17, 21, 21, 21, 10], X: [5, 17, 17, 10, 4, 10, 17, 17],
  Y: [5, 17, 17, 10, 4, 4, 4, 4], Z: [5, 31, 1, 2, 4, 8, 16, 31],
  0: [5, 14, 17, 19, 21, 25, 17, 14], 1: [3, 2, 6, 2, 2, 2, 2, 7], 2: [5, 14, 17, 1, 2, 4, 8, 31], 3: [5, 30, 1, 1, 14, 1, 1, 30],
  4: [5, 2, 6, 10, 18, 31, 2, 2], 5: [5, 31, 16, 30, 1, 1, 17, 14], 6: [5, 6, 8, 16, 30, 17, 17, 14], 7: [5, 31, 1, 2, 4, 8, 8, 8],
  8: [5, 14, 17, 17, 14, 17, 17, 14], 9: [5, 14, 17, 17, 15, 1, 2, 12],
  '.': [1, 0, 0, 0, 0, 0, 0, 1], ',': [2, 0, 0, 0, 0, 0, 1, 2], ':': [1, 0, 1, 0, 0, 0, 1, 0], ';': [2, 0, 1, 0, 0, 0, 1, 2],
  '!': [1, 1, 1, 1, 1, 1, 0, 1], '¡': [1, 1, 0, 1, 1, 1, 1, 1], '?': [5, 14, 17, 1, 2, 4, 0, 4], '¿': [5, 4, 0, 4, 8, 16, 17, 14],
  "'": [1, 1, 1, 0, 0, 0, 0, 0], '"': [3, 5, 5, 0, 0, 0, 0, 0], '-': [4, 0, 0, 0, 15, 0, 0, 0], '+': [5, 0, 4, 4, 31, 4, 4, 0],
  '×': [5, 0, 17, 10, 4, 10, 17, 0], '/': [5, 1, 1, 2, 4, 8, 16, 16], '%': [5, 24, 25, 2, 4, 8, 19, 3], '$': [5, 4, 15, 20, 14, 5, 30, 4],
  '(': [3, 1, 2, 4, 4, 4, 2, 1], ')': [3, 4, 2, 1, 1, 1, 2, 4], '#': [5, 10, 10, 31, 10, 31, 10, 10], '=': [5, 0, 0, 31, 0, 31, 0, 0],
  '<': [4, 1, 2, 4, 8, 4, 2, 1], '>': [4, 8, 4, 2, 1, 2, 4, 8], '_': [5, 0, 0, 0, 0, 0, 0, 31], '*': [5, 0, 21, 14, 31, 14, 21, 0],
  '&': [5, 12, 18, 20, 8, 21, 18, 13], '·': [1, 0, 0, 0, 1, 0, 0, 0], '…': [5, 0, 0, 0, 0, 0, 0, 21], '▲': [5, 0, 0, 4, 14, 31, 0, 0],
  '▼': [5, 0, 0, 31, 14, 4, 0, 0], '★': [5, 4, 4, 31, 14, 10, 17, 0], '→': [5, 0, 4, 2, 31, 2, 4, 0], '←': [5, 0, 4, 8, 31, 8, 4, 0],
  '−': [4, 0, 0, 0, 15, 0, 0, 0], '–': [4, 0, 0, 0, 15, 0, 0, 0], '“': [3, 5, 5, 0, 0, 0, 0, 0], '”': [3, 5, 5, 0, 0, 0, 0, 0],
};
const MARCAS = { agudo: [2, 4], grave: [8, 4], circ: [4, 10], tilde: [13, 22], dier: [0, 10], punto: [0, 4], breve: [10, 4] };
const DIAC = {
  'Á': 'A agudo', 'É': 'E agudo', 'Í': 'I agudo', 'Ó': 'O agudo', 'Ú': 'U agudo', 'À': 'A grave', 'Â': 'A circ', 'Ê': 'E circ', 'Ô': 'O circ',
  'Ã': 'A tilde', 'Õ': 'O tilde', 'Ñ': 'N tilde', 'Ü': 'U dier', 'Ö': 'O dier', 'Ğ': 'G breve', 'İ': 'I punto', 'Ç': 'C cedilla', 'Ş': 'S cedilla',
};
const F3 = {
  0: [3, 7, 5, 5, 5, 7], 1: [3, 2, 6, 2, 2, 7], 2: [3, 7, 1, 7, 4, 7], 3: [3, 7, 1, 3, 1, 7], 4: [3, 5, 5, 7, 1, 1], 5: [3, 7, 4, 7, 1, 7],
  6: [3, 7, 4, 7, 5, 7], 7: [3, 7, 1, 1, 2, 2], 8: [3, 7, 5, 7, 5, 7], 9: [3, 7, 5, 7, 1, 7],
  A: [3, 2, 5, 7, 5, 5], B: [3, 6, 5, 6, 5, 6], C: [3, 3, 4, 4, 4, 3], D: [3, 6, 5, 5, 5, 6], E: [3, 7, 4, 6, 4, 7], F: [3, 7, 4, 6, 4, 4],
  G: [3, 3, 4, 5, 5, 3], H: [3, 5, 5, 7, 5, 5], I: [3, 7, 2, 2, 2, 7], J: [3, 1, 1, 1, 5, 2], K: [3, 5, 5, 6, 5, 5], L: [3, 4, 4, 4, 4, 7],
  M: [3, 5, 7, 7, 5, 5], N: [3, 6, 5, 5, 5, 5], O: [3, 2, 5, 5, 5, 2], P: [3, 6, 5, 6, 4, 4], Q: [3, 2, 5, 5, 6, 3], R: [3, 6, 5, 6, 5, 5],
  S: [3, 3, 4, 2, 1, 6], T: [3, 7, 2, 2, 2, 2], U: [3, 5, 5, 5, 5, 7], V: [3, 5, 5, 5, 5, 2], W: [3, 5, 5, 7, 7, 5], X: [3, 5, 5, 2, 5, 5],
  Y: [3, 5, 5, 2, 2, 2], Z: [3, 7, 1, 2, 4, 7],
  '.': [1, 0, 0, 0, 0, 1], ':': [1, 0, 1, 0, 1, 0], '/': [3, 1, 1, 2, 4, 4], '+': [3, 0, 2, 7, 2, 0], '-': [3, 0, 0, 7, 0, 0],
  '×': [3, 0, 5, 2, 5, 0], '%': [3, 5, 1, 2, 4, 5], '!': [1, 1, 1, 1, 0, 1], '?': [3, 7, 1, 2, 0, 2], ',': [2, 0, 0, 0, 1, 2],
  '(': [2, 1, 2, 2, 2, 1], ')': [2, 2, 1, 1, 1, 2], '=': [3, 0, 7, 0, 7, 0], '▲': [3, 0, 2, 7, 7, 0], '$': [3, 3, 6, 2, 3, 6], "'": [1, 1, 1, 0, 0, 0],
  '−': [3, 0, 0, 7, 0, 0],
};
const SIN_ACENTO = { 'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U', 'À': 'A', 'Â': 'A', 'Ê': 'E', 'Ô': 'O', 'Ã': 'A', 'Õ': 'O', 'Ñ': 'N', 'Ü': 'U', 'Ö': 'O', 'Ğ': 'G', 'İ': 'I', 'Ç': 'C', 'Ş': 'S' };

const FUENTES = { px: { alto: 7, arriba: 2, abajo: 2, espacio: 3, g: {} }, mini: { alto: 5, arriba: 0, abajo: 0, espacio: 2, g: {} } };
(function armarFuentes() {
  const px = FUENTES.px;
  for (const ch in F5) { const d = F5[ch]; px.g[ch] = { w: d[0], filas: [0, 0, ...d.slice(1), 0, 0] }; }
  for (const ch in DIAC) {
    const [base, marca] = DIAC[ch].split(' '), b = px.g[base], f = b.filas.slice();
    const corr = b.w === 3 ? 1 : 0;
    if (marca === 'cedilla') { f[9] |= 4 >> corr; f[10] |= 8 >> corr; } else { const m = MARCAS[marca]; f[0] |= m[0] >> corr; f[1] |= m[1] >> corr; }
    px.g[ch] = { w: b.w, filas: f };
  }
  const mi = FUENTES.mini;
  for (const ch in F3) { const d = F3[ch]; mi.g[ch] = { w: d[0], filas: d.slice(1) }; }
  for (const ch in SIN_ACENTO) mi.g[ch] = mi.g[SIN_ACENTO[ch]];
})();

function lienzo(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, w | 0); c.height = Math.max(1, h | 0); return c; }

const _atlas = new Map();
function atlasDe(fn, rel, bor) {
  const key = fn + '|' + (Array.isArray(rel) ? rel.join(',') : rel) + '|' + (bor || '');
  let A = _atlas.get(key);
  if (A) return A;
  const F = FUENTES[fn], chs = Object.keys(F.g), alto = F.arriba + F.alto + F.abajo, hT = alto + 2;
  const pos = {};
  let x = 0;
  for (const ch of chs) { pos[ch] = x; x += F.g[ch].w + 2; }
  const c = lienzo(x, hT), g = c.getContext('2d'), img = g.createImageData(x, hT), d = img.data;
  const lleno = new Uint8Array(x * hT);
  for (const ch of chs) {
    const gl = F.g[ch], x0 = pos[ch] + 1;
    for (let r = 0; r < gl.filas.length; r++) {
      const fila = gl.filas[r];
      if (!fila) continue;
      const col = hexRgb(Array.isArray(rel) ? rel[clamp(r - F.arriba, 0, rel.length - 1)] : rel);
      for (let i = 0; i < gl.w; i++) if ((fila >> (gl.w - 1 - i)) & 1) {
        const p = (r + 1) * x + x0 + i;
        lleno[p] = 1; d[p * 4] = col[0]; d[p * 4 + 1] = col[1]; d[p * 4 + 2] = col[2]; d[p * 4 + 3] = 255;
      }
    }
  }
  if (bor) {
    const cb = hexRgb(bor);
    for (let yy = 0; yy < hT; yy++) for (let xx = 0; xx < x; xx++) {
      const p = yy * x + xx;
      if (lleno[p]) continue;
      let v = 0;
      for (let dy = -1; dy <= 1 && !v; dy++) for (let dx = -1; dx <= 1; dx++) {
        const X = xx + dx, Y = yy + dy;
        if (X >= 0 && Y >= 0 && X < x && Y < hT && lleno[Y * x + X]) { v = 1; break; }
      }
      if (v) { d[p * 4] = cb[0]; d[p * 4 + 1] = cb[1]; d[p * 4 + 2] = cb[2]; d[p * 4 + 3] = 255; }
    }
  }
  g.putImageData(img, 0, 0);
  A = { cv: c, pos, h: hT, F };
  _atlas.set(key, A);
  return A;
}

function mayus(s) { return IDIOMA === 'tr' ? s.toLocaleUpperCase('tr') : s.toUpperCase(); }
function esPx(s, fn) { const G = FUENTES[fn].g; for (const ch of s) if (ch !== ' ' && !G[ch]) return false; return true; }
function anchoPx(s, fn, t) {
  const F = FUENTES[fn];
  let w = 0;
  for (const ch of s) w += (ch === ' ' ? F.espacio : (F.g[ch] ? F.g[ch].w : 3)) + 1;
  return Math.max(0, w - 1) * t;
}
function fuenteEscritura() {
  switch (IDIOMA) {
    case 'ar': case 'ur': return '"Noto Naskh Arabic","Geeza Pro","Segoe UI","Arial",sans-serif';
    case 'th': return '"Noto Sans Thai","Thonburi","Leelawadee UI","Tahoma",sans-serif';
    case 'my': return '"Noto Sans Myanmar","Myanmar Text","Padauk",sans-serif';
    case 'ja': return '"Hiragino Sans","Hiragino Kaku Gothic ProN","Noto Sans JP","Noto Sans CJK JP","Yu Gothic",sans-serif';
    default: return '"Trebuchet MS","Verdana","Segoe UI",sans-serif';
  }
}
function escalaEscritura() { return { ar: 1.18, ur: 1.18, th: 1.12, my: 1.0, ja: 0.92 }[IDIOMA] || 1; }
const FUERA = [];   // en ?prueba: textos que no entraron

// Dibuja texto. o: t (escala entera), f ('px'|'mini'), c (color o 7 tonos por fila), b (borde), s (sombra), al (0 izq, .5 centro, 1 der), max (ancho)
function txt(g, s, x, y, o) {
  o = o || {};
  s = mayus(String(s));
  const fn = o.f || 'px';
  let t = o.t || 1;
  if (esPx(s, fn)) {
    let w = anchoPx(s, fn, t);
    while (o.max && w > o.max && t > 1) { t--; w = anchoPx(s, fn, t); }
    if (!(o.max && w > o.max + 0.5)) {
      const F = FUENTES[fn], x0 = Math.round(x - w * (o.al || 0)), y0 = Math.round(y);
      if (o.s) dibujarPx(g, s, x0 + (o.sx != null ? o.sx : 0), y0 + t, fn, t, o.s, o.s);
      dibujarPx(g, s, x0, y0, fn, t, o.c || '#ffffff', o.b === undefined ? '#1a1020' : o.b);
      return w;
    }
    if (PRUEBA && !FUERA.includes(s)) FUERA.push(s);
  }
  return txtSis(g, s, x, y, o, t);
}
function dibujarPx(g, s, x, y, fn, t, rel, bor) {
  const A = atlasDe(fn, rel, bor), F = A.F;
  let cx = x;
  for (const ch of s) {
    if (ch === ' ') { cx += (F.espacio + 1) * t; continue; }
    const gl = F.g[ch];
    if (!gl) { cx += 4 * t; continue; }
    g.drawImage(A.cv, A.pos[ch], 0, gl.w + 2, A.h, cx - t, y - (F.arriba + 1) * t, (gl.w + 2) * t, A.h * t);
    cx += (gl.w + 1) * t;
  }
}
function tamSis(fn, t) { return (fn === 'mini' ? 6.6 : 9.4) * t * escalaEscritura(); }
function txtSis(g, s, x, y, o, t) {
  const fn = o.f || 'px';
  let tam = tamSis(fn, t);
  g.font = 'bold ' + tam + 'px ' + fuenteEscritura();
  let w = g.measureText(s).width;
  if (o.max && w > o.max) { tam *= o.max / w; g.font = 'bold ' + tam + 'px ' + fuenteEscritura(); w = g.measureText(s).width; }
  const xx = x - w * (o.al || 0), yy = y + FUENTES[fn].alto * t / 2 + 0.4;
  g.textAlign = 'left'; g.textBaseline = 'middle';
  g.direction = esRTL() ? 'rtl' : 'ltr';
  if (esRTL()) g.textAlign = 'right';
  const xd = esRTL() ? xx + w : xx;
  if (o.s) { g.fillStyle = o.s; g.fillText(s, xd, yy + t); }
  const borde = o.b === undefined ? '#1a1020' : o.b;
  if (borde) { g.lineJoin = 'round'; g.lineWidth = Math.max(1.4, tam * 0.2); g.strokeStyle = borde; g.strokeText(s, xd, yy); }
  if (Array.isArray(o.c)) {
    const gr = g.createLinearGradient(0, yy - tam / 2, 0, yy + tam / 2);
    o.c.forEach((c, i) => gr.addColorStop(i / (o.c.length - 1), c));
    g.fillStyle = gr;
  } else g.fillStyle = o.c || '#ffffff';
  g.fillText(s, xd, yy);
  g.direction = 'ltr'; g.textAlign = 'left';
  return w;
}
function anchoTxt(g, s, o) {
  o = o || {};
  s = mayus(String(s));
  const fn = o.f || 'px', t = o.t || 1;
  if (esPx(s, fn)) return anchoPx(s, fn, t);
  g.font = 'bold ' + tamSis(fn, t) + 'px ' + fuenteEscritura();
  return g.measureText(s).width;
}
function altoRenglon(o) { o = o || {}; const t = o.t || 1; return (o.f === 'mini' ? 7 : 11) * t; }
function partir(g, s, ancho, o) {
  s = String(s);
  let pal;
  if (/^(th|my|ja)/.test(IDIOMA) && typeof Intl !== 'undefined' && Intl.Segmenter) {
    pal = Array.from(new Intl.Segmenter(IDIOMA, { granularity: 'word' }).segment(s), x => x.segment);
  } else pal = s.split(/(\s+)/);
  const lineas = [];
  let act = '';
  for (const p of pal) {
    const prueba = act + p;
    if (act && anchoTxt(g, prueba.trim(), o) > ancho) { lineas.push(act.trim()); act = p.trimStart(); }
    else act = prueba;
  }
  if (act.trim()) lineas.push(act.trim());
  return lineas;
}
// párrafo centrado o alineado; devuelve el alto usado
function parrafo(g, s, x, y, ancho, o) {
  o = o || {};
  const ls = partir(g, s, ancho, o), h = altoRenglon(o) * (esPx(mayus(s), o.f || 'px') ? 1 : 1.15);
  ls.forEach((l, i) => txt(g, l, x, y + i * h, Object.assign({}, o, { max: ancho })));
  return ls.length * h;
}
