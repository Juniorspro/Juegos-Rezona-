// POTRERO — la letra de historieta, dibujada a mano con trazos (mayúsculas, números, signos y acentos del
// español, portugués, turco, malayo, indonesio y filipino). Cada letra tiembla un poquito como rotulada con
// pincel. Lo que no tiene (árabe, urdu, tailandés, birmano, japonés) va con la letra del sistema.
// Coordenadas: x de 0 al ancho, y de 0 (arriba de la mayúscula) a 10 (renglón).
const GLIFOS = {
  A: [6, 'M0 10 L3 0 L6 10 M1.2 6.6 L4.8 6.6'],
  B: [6.2, 'M0.5 0 L0.5 10 M0.5 0 L3.4 0 Q5.6 0 5.6 2.5 Q5.6 4.9 3.2 4.9 L0.5 4.9 M3.2 4.9 Q6 4.9 6 7.4 Q6 10 3.4 10 L0.5 10'],
  C: [6.4, 'A3.4 5 3.2 5 -48 48 1'],
  D: [6.4, 'M0.5 0 L0.5 10 L2.6 10 Q6.2 10 6.2 5 Q6.2 0 2.6 0 L0.5 0'],
  E: [5.6, 'M5.4 0 L0.5 0 L0.5 10 L5.4 10 M0.5 4.9 L4.4 4.9'],
  F: [5.4, 'M5.4 0 L0.5 0 L0.5 10 M0.5 4.9 L4.4 4.9'],
  G: [6.8, 'A3.4 5 3.3 5 -42 32 1 M3.8 5.6 L6.6 5.6 L6.5 8.4'],
  H: [6, 'M0.5 0 L0.5 10 M5.5 0 L5.5 10 M0.5 4.9 L5.5 4.9'],
  I: [2, 'M1 0 L1 10'],
  J: [5.6, 'M5 0 L5 7 Q5 10 2.6 10 Q0.4 10 0.2 7.6'],
  K: [6, 'M0.5 0 L0.5 10 M5.6 0 L0.6 6 M2.2 4.4 L5.8 10'],
  L: [5.2, 'M0.5 0 L0.5 10 L5 10'],
  M: [7.2, 'M0.4 10 L0.6 0 L3.6 6.4 L6.6 0 L6.8 10'],
  N: [6.1, 'M0.5 10 L0.5 0 L5.6 10 L5.6 0'],
  O: [6.8, 'E3.4 5 3.3 5'],
  P: [6.1, 'M0.5 10 L0.5 0 L3.3 0 Q6 0 6 2.8 Q6 5.6 3.3 5.6 L0.5 5.6'],
  Q: [6.8, 'E3.4 5 3.3 5 M3.8 7 L6.6 10.4'],
  R: [6.2, 'M0.5 10 L0.5 0 L3.3 0 Q6 0 6 2.7 Q6 5.4 3.3 5.4 L0.5 5.4 M3 5.4 L6 10'],
  S: [6, 'M5.4 1.4 Q4.6 0 3 0 Q0.6 0 0.6 2.5 Q0.6 4.4 3 4.9 Q5.6 5.5 5.6 7.6 Q5.6 10 3 10 Q1.1 10 0.2 8.4'],
  T: [6, 'M0 0 L6 0 M3 0 L3 10'],
  U: [6.2, 'M0.5 0 L0.5 6.8 Q0.5 10 3.1 10 Q5.7 10 5.7 6.8 L5.7 0'],
  V: [6, 'M0 0 L3 10 L6 0'],
  W: [7.6, 'M0 0 L1.9 10 L3.8 3.4 L5.7 10 L7.6 0'],
  X: [6, 'M0.2 0 L5.8 10 M5.8 0 L0.2 10'],
  Y: [6, 'M0 0 L3 5 L6 0 M3 5 L3 10'],
  Z: [6.2, 'M0.4 0 L5.6 0 L0.4 10 L5.8 10'],
  0: [6, 'E3 5 2.8 5'],
  1: [4.4, 'M1.2 2.2 L3 0 L3 10'],
  2: [6, 'M0.6 2.4 Q1 0 3 0 Q5.4 0 5.4 2.6 Q5.4 4.4 3.4 6 L0.4 10 L5.6 10'],
  3: [6.2, 'M0.6 1.2 Q1.6 0 3 0 Q5.4 0 5.4 2.4 Q5.4 4.8 2.6 4.8 Q5.8 4.8 5.8 7.4 Q5.8 10 3 10 Q1.2 10 0.3 8.6'],
  4: [6.2, 'M4.4 10 L4.4 0 L0.2 7 L6 7'],
  5: [6.2, 'M5.2 0 L1.2 0 L0.8 4.4 Q1.8 3.6 3.1 3.6 Q5.8 3.6 5.8 6.8 Q5.8 10 3 10 Q1.2 10 0.3 8.6'],
  6: [6.2, 'M5 0.8 Q4.2 0 3 0 Q0.4 0 0.4 5.6 Q0.4 10 3.1 10 Q5.8 10 5.8 7 Q5.8 4.2 3.1 4.2 Q1.2 4.2 0.5 6'],
  7: [6, 'M0.4 0 L5.8 0 L2.4 10'],
  8: [6.2, 'E3.1 2.5 2.4 2.5 E3.1 7.4 2.8 2.6'],
  9: [6.2, 'M5.6 4 Q4.9 5.8 3 5.8 Q0.4 5.8 0.4 3 Q0.4 0 3.1 0 Q5.8 0 5.8 4.4 Q5.8 10 3 10 Q1.6 10 0.8 9.2'],
  '!': [2, 'M1 0 L1 6.8 M1 9.6 L1 9.7'],
  '¡': [2, 'M1 0.3 L1 0.4 M1 3.2 L1 10'],
  '?': [5.6, 'M0.4 2.2 Q0.8 0 3 0 Q5.4 0 5.4 2.4 Q5.4 4 3.6 4.9 Q2.8 5.4 2.8 7 M2.8 9.6 L2.8 9.7'],
  '¿': [5.6, 'M2.8 0.3 L2.8 0.4 M2.8 3 Q2.8 4.6 2 5.1 Q0.2 6 0.2 7.6 Q0.2 10 2.6 10 Q4.8 10 5.2 7.8'],
  '.': [1.6, 'M0.8 9.6 L0.8 9.7'],
  ',': [1.6, 'M1 9.2 L0.4 11'],
  ':': [1.6, 'M0.8 3.4 L0.8 3.5 M0.8 9.6 L0.8 9.7'],
  ';': [1.8, 'M1 3.4 L1 3.5 M1 9.2 L0.4 11'],
  '-': [4, 'M0.4 5.4 L3.6 5.4'],
  '–': [6, 'M0.4 5.4 L5.6 5.4'], '—': [7, 'M0.4 5.4 L6.6 5.4'],
  "'": [1.8, 'M1 0 L0.8 2.6'], '’': [1.8, 'M1.2 0 L0.6 2.6'], '‘': [1.8, 'M0.6 0 L1.2 2.6'],
  '"': [3.2, 'M0.8 0 L0.6 2.6 M2.6 0 L2.4 2.6'], '“': [3.2, 'M0.6 0 L1 2.6 M2.4 0 L2.8 2.6'], '”': [3.2, 'M1 0 L0.6 2.6 M2.8 0 L2.4 2.6'],
  '«': [5.4, 'M2.6 2.6 L0.4 5 L2.6 7.4 M5 2.6 L2.8 5 L5 7.4'], '»': [5.4, 'M0.4 2.6 L2.6 5 L0.4 7.4 M2.8 2.6 L5 5 L2.8 7.4'],
  '(': [3.2, 'A3.4 5 3 6 -120 120 1'], ')': [3.2, 'A-0.2 5 3 6 -60 60 0'],
  '/': [4.4, 'M4 0 L0 10'], '+': [5.4, 'M0.4 5 L5 5 M2.7 2.7 L2.7 7.3'], '=': [5.4, 'M0.4 3.8 L5 3.8 M0.4 6.6 L5 6.6'],
  '%': [6.2, 'E1.4 1.8 1.2 1.6 E4.8 8.2 1.2 1.6 M5.4 0.4 L0.8 9.6'],
  '#': [6, 'M2 0.5 L1.2 9.5 M4.6 0.5 L3.8 9.5 M0.4 3.4 L6 3.4 M0.2 6.6 L5.8 6.6'],
  '&': [6, 'M5.6 10 L1.4 3.6 Q0.6 2.4 1.4 1 Q2.2 0 3.2 0.6 Q4.2 1.4 3.4 3 L0.8 6.6 Q0 8.4 1.4 9.6 Q3.2 10.6 5.2 7.4'],
  '·': [1.6, 'M0.8 5 L0.8 5.1'], '…': [5, 'M0.8 9.6 L0.8 9.7 M2.6 9.6 L2.6 9.7 M4.4 9.6 L4.4 9.7'],
  '°': [3, 'E1.4 1.4 1.1 1.1'], '*': [4.8, 'M2.4 0.6 L2.4 4.6 M0.6 1.6 L4.2 3.6 M4.2 1.6 L0.6 3.6'],
  '<': [4.6, 'M4 1.6 L0.4 5 L4 8.4'], '>': [4.6, 'M0.6 1.6 L4.2 5 L0.6 8.4'], '×': [5, 'M0.6 2.6 L4.4 7.4 M4.4 2.6 L0.6 7.4'],
  ' ': [3, ''],
};
// los acentos van encima del centro de la letra (o abajo, la cedilla)
const MARCAS = {
  agudo: 'M-0.6 -1.0 L0.9 -2.9', grave: 'M0.6 -1.0 L-0.9 -2.9', circ: 'M-1.5 -1.0 L0 -2.7 L1.5 -1.0',
  tilde: 'M-1.9 -1.4 Q-0.9 -2.9 0 -2 Q0.9 -1.1 1.9 -2.5', dier: 'M-1.3 -1.9 L-1.3 -1.8 M1.3 -1.9 L1.3 -1.8',
  aro: 'E0 -2.1 0.9 0.9', breve: 'M-1.5 -2.7 Q0 -0.7 1.5 -2.7', punto: 'M0 -1.9 L0 -1.8', cedilla: 'M0.1 10.2 L0.6 11.2 L-0.5 12.2',
};
const COMPUESTAS = {
  'Á': 'A agudo', 'À': 'A grave', 'Â': 'A circ', 'Ã': 'A tilde', 'Ä': 'A dier', 'Å': 'A aro',
  'É': 'E agudo', 'È': 'E grave', 'Ê': 'E circ', 'Ë': 'E dier', 'Í': 'I agudo', 'Ì': 'I grave', 'Î': 'I circ', 'Ï': 'I dier', 'İ': 'I punto',
  'Ó': 'O agudo', 'Ò': 'O grave', 'Ô': 'O circ', 'Õ': 'O tilde', 'Ö': 'O dier', 'Ú': 'U agudo', 'Ù': 'U grave', 'Û': 'U circ', 'Ü': 'U dier',
  'Ñ': 'N tilde', 'Ç': 'C cedilla', 'Ş': 'S cedilla', 'Ğ': 'G breve', 'Ý': 'Y agudo', 'Ÿ': 'Y dier',
};
const _ops = new Map();
function opsDe(src) {
  let o = _ops.get(src);
  if (o) return o;
  o = [];
  const t = src.trim().split(/\s+/).filter(Boolean);
  let i = 0;
  const num = () => parseFloat(t[i++]);
  while (i < t.length) {
    let c = t[i][0], primero = t[i].slice(1);
    i++;
    const n = [];
    if (primero.length) n.push(parseFloat(primero));
    const cuantos = { M: 2, L: 2, Q: 4, C: 6, E: 4, A: 7 }[c] || 0;
    while (n.length < cuantos) n.push(num());
    o.push([c, n]);
  }
  _ops.set(src, o);
  return o;
}
function tieneGlifo(ch) { return GLIFOS[ch] !== undefined || COMPUESTAS[ch] !== undefined; }
// arma el camino de un texto en mayúsculas; k = tamaño de una unidad del glifo
function caminoLetras(s, k, temblor, semilla) {
  const p = new Path2D();
  let x = 0;
  const esp = 0.9;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i], comp = COMPUESTAS[ch];
    const base = comp ? comp.split(' ')[0] : ch, gl = GLIFOS[base];
    if (!gl) continue;
    const w = gl[0], cx = w / 2, h = hash2(s.charCodeAt(i) * 7 + i * 131, semilla || 3);
    const rot = temblor ? (h - 0.5) * 0.09 : 0, dy = temblor ? (hash2(i, s.charCodeAt(i)) - 0.5) * 0.35 : 0, es = temblor ? 1 + (h - 0.5) * 0.06 : 1;
    const co = Math.cos(rot) * es, si = Math.sin(rot) * es;
    const ox = (x + cx) * k, oy = (5 + dy) * k;
    const T = (px, py) => [ox + ((px - cx) * co - (py - 5) * si) * k, oy + ((px - cx) * si + (py - 5) * co) * k];
    const trazar = (ops, dx) => {
      for (const [c, n] of ops) {
        if (c === 'M') { const a = T(n[0] + dx, n[1]); p.moveTo(a[0], a[1]); }
        else if (c === 'L') { const a = T(n[0] + dx, n[1]); p.lineTo(a[0], a[1]); }
        else if (c === 'Q') { const a = T(n[0] + dx, n[1]), b = T(n[2] + dx, n[3]); p.quadraticCurveTo(a[0], a[1], b[0], b[1]); }
        else if (c === 'C') { const a = T(n[0] + dx, n[1]), b = T(n[2] + dx, n[3]), d = T(n[4] + dx, n[5]); p.bezierCurveTo(a[0], a[1], b[0], b[1], d[0], d[1]); }
        else if (c === 'E') { const a = T(n[0] + dx, n[1]); p.moveTo(a[0] + n[2] * k * co, a[1] + n[2] * k * si); p.ellipse(a[0], a[1], n[2] * k * es, n[3] * k * es, rot, 0, TAU); }
        else if (c === 'A') {
          const a = T(n[0] + dx, n[1]), a0 = n[4] * PI / 180, a1 = n[5] * PI / 180, ex = Math.cos(a0) * n[2] * k * es, ey = Math.sin(a0) * n[3] * k * es;
          p.moveTo(a[0] + ex * Math.cos(rot) - ey * Math.sin(rot), a[1] + ex * Math.sin(rot) + ey * Math.cos(rot)); p.ellipse(a[0], a[1], n[2] * k * es, n[3] * k * es, rot, a0, a1, !!n[6]);
        }
      }
    };
    trazar(opsDe(gl[1]), 0);
    if (comp) trazar(opsDe(MARCAS[comp.split(' ')[1]]), cx);
    x += w + esp;
  }
  return { p, ancho: Math.max(0, x - esp) * k };
}
function anchoLetras(s) {
  let x = 0;
  for (let i = 0; i < s.length; i++) { const ch = s[i], comp = COMPUESTAS[ch], gl = GLIFOS[comp ? comp.split(' ')[0] : ch]; if (gl) x += gl[0] + 0.9; }
  return Math.max(0, x - 0.9);
}

// ---------- la API de texto (en unidades de pantalla) ----------
function mayus(s) { return IDIOMA === 'tr' ? s.toLocaleUpperCase('tr') : s.toUpperCase(); }
const _aMano = new Map();
function aMano(s) {
  let v = _aMano.get(s);
  if (v === undefined) { v = true; for (const ch of s) if (!tieneGlifo(ch)) { v = false; break; } _aMano.set(s, v); if (_aMano.size > 3000) _aMano.clear(); }
  return v;
}
const FUENTE_SIS = '"Noto Sans","Segoe UI",system-ui,-apple-system,"Hiragino Sans","Yu Gothic","Noto Sans JP","Noto Sans Thai","Leelawadee UI","Myanmar Text","Noto Sans Myanmar","Padauk","Noto Naskh Arabic","Tahoma",sans-serif';
function altoRenglon(tam) { return tam * ({ th: 1.65, my: 1.75, ur: 1.85, ar: 1.55, ja: 1.4 }[IDIOMA] || 1.3); }
// ancho de un texto (ya en mayúsculas si va a mano)
let _gMed = null;
function medir(s, tam, peso) {
  const m = mayus(s);
  if (aMano(m)) return anchoLetras(m) * tam * 0.07;
  if (!_gMed) _gMed = lienzo(4, 4).getContext('2d');
  _gMed.font = (peso ? '800 ' : '600 ') + tam + 'px ' + FUENTE_SIS;
  return _gMed.measureText(s).width;
}
// el texto se pinta una vez en un lienzo chico y después se estampa
const _txtC = new Map();
function selloTexto(s, tam, c, b, bw, peso, temblor) {
  const k = s + '\u0001' + tam.toFixed(2) + c + b + bw + (peso ? 1 : 0) + (temblor ? 1 : 0) + S.toFixed(3) + IDIOMA;
  let e = _txtC.get(k);
  if (e) { _txtC.delete(k); _txtC.set(k, e); return e; }
  const m = mayus(s), mano = aMano(m), bor = b ? bw : 0;
  const pad = bor + tam * 0.35;
  let ancho, alto;
  if (mano) { ancho = anchoLetras(m) * tam * 0.07; alto = tam * 0.7; }
  else { ancho = medir(s, tam, peso); alto = altoRenglon(tam); }
  const cv = lienzo((ancho + pad * 2) * S, (alto + pad * 2 + tam * 0.3) * S), g = cv.getContext('2d');
  g.setTransform(S, 0, 0, S, 0, 0);
  if (mano) {
    const kk = tam * 0.07, { p } = caminoLetras(m, kk, temblor, 3);
    const lw = tam * (peso ? 0.12 : 0.09);
    g.translate(pad, pad + tam * 0.15);
    g.lineCap = 'round'; g.lineJoin = 'round';
    if (b) { g.strokeStyle = b; g.lineWidth = lw + bor * 2; g.stroke(p); }
    g.strokeStyle = c; g.lineWidth = lw; g.stroke(p);
  } else {
    g.font = (peso ? '800 ' : '600 ') + tam + 'px ' + FUENTE_SIS;
    g.textBaseline = 'middle'; g.textAlign = 'left'; g.direction = esRTL() ? 'rtl' : 'ltr';
    const x = pad, y = pad + tam * 0.15 + alto / 2;
    if (b) { g.lineJoin = 'round'; g.strokeStyle = b; g.lineWidth = bor * 2; g.strokeText(s, x, y); }
    g.fillStyle = c; g.fillText(s, x, y);
  }
  e = { cv, ancho, alto, pad, sub: tam * 0.15 };
  _txtC.set(k, e);
  if (_txtC.size > 500) _txtC.delete(_txtC.keys().next().value);
  return e;
}
// txt(g, s, x, y, {tam, c, b, bw, al, max, peso, temblor}): y es el medio del renglón; devuelve el ancho
function txt(g, s, x, y, o) {
  o = o || {};
  if (s == null || s === '') return 0;
  s = String(s);
  let tam = o.tam || 12;
  const peso = o.peso === undefined ? 1 : o.peso;
  if (o.max) { const w = medir(s, tam, peso); if (w > o.max) tam = Math.max(4, tam * o.max / w); }
  const b = o.b === undefined ? TINTA : o.b, bw = o.bw != null ? o.bw : tam * 0.13;
  const e = selloTexto(s, Math.round(tam * 4) / 4, o.c || TINTA, b, Math.round(bw * 8) / 8, peso, o.temblor !== false);
  const al = o.al == null ? 0 : o.al;
  const x0 = x - e.ancho * al - e.pad, y0 = y - e.alto / 2 - e.pad - e.sub;
  g.drawImage(e.cv, x0, y0, e.cv.width / S, e.cv.height / S);
  return e.ancho;
}
// corta un texto en renglones de un ancho
let _seg = null;
function palabras(s) {
  if (IDIOMA === 'ja' || IDIOMA === 'th' || IDIOMA === 'my') {
    try { if (!_seg || _seg.idioma !== IDIOMA) { _seg = new Intl.Segmenter(IDIOMA, { granularity: 'word' }); _seg.idioma = IDIOMA; } return Array.from(_seg.segment(s), x => x.segment); } catch (e) { }
    if (IDIOMA === 'ja') return Array.from(s);
  }
  const out = []; let cur = '';
  for (const ch of s) { cur += ch; if (ch === ' ') { out.push(cur); cur = ''; } }
  if (cur) out.push(cur);
  return out;
}
function partir(s, ancho, tam, peso) {
  const L = [];
  for (const parrafo of String(s).split('\n')) {
    const ws = palabras(parrafo);
    let lin = '';
    for (const w of ws) {
      const prueba = lin + w;
      if (lin && medir(prueba.trimEnd(), tam, peso) > ancho) { L.push(lin.trimEnd()); lin = w.trimStart(); }
      else lin = prueba;
    }
    if (lin.trim() || !L.length) L.push(lin.trimEnd());
  }
  return L;
}
function parrafo(g, s, x, y, ancho, o) {
  o = o || {};
  const tam = o.tam || 12, L = partir(s, ancho, tam, o.peso === undefined ? 1 : o.peso), al = o.al == null ? 0.5 : o.al, lh = o.lh || altoRenglon(tam);
  L.forEach((l, i) => txt(g, l, x, y + lh * (i + 0.5), Object.assign({}, o, { max: ancho, al })));
  return L.length * lh;
}
