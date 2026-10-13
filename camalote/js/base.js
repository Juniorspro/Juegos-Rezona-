// CAMALOTE — base: tamaños, azar con semilla, guardado, números, colores e idioma
const JUEGO = 'camalote';
const PARAM = new URLSearchParams(location.search);
const PRUEBA = PARAM.has('prueba');
let W = 360, H = 640, K = 1, DPR = 1;   // unidades lógicas (360 del lado corto) y píxeles reales por unidad

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const suave = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const rebote = t => { const c = 1.70158; t -= 1; return 1 + (c + 1) * t * t * t + c * t * t; };

function rngSemilla(s) {
  let a = (s >>> 0) || 1;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashTxt(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function hoy(d) { d = d || new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }
function ayer() { const d = new Date(); d.setDate(d.getDate() - 1); return hoy(d); }
// azar solo para lo que se ve (la simulación usa semillas)
const vis = Math.random;
const rnd = (a, b) => a + vis() * (b - a);
const rndI = (a, b) => Math.floor(rnd(a, b + 1));

const Guardado = {
  leer(k, def) { try { const v = localStorage.getItem(JUEGO + '.' + k); return v == null ? def : JSON.parse(v); } catch (e) { return def; } },
  escribir(k, v) { try { localStorage.setItem(JUEGO + '.' + k, JSON.stringify(v)); } catch (e) { } },
  borrar(k) { try { localStorage.removeItem(JUEGO + '.' + k); } catch (e) { } },
};

// ---------- números ----------
function fmtT(s) { s = Math.max(0, Math.floor(s)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : String(m)) + ':' + String(x).padStart(2, '0'); }

// ---------- colores ----------
const _rgb = new Map();
function hexRgb(h) {
  let c = _rgb.get(h);
  if (!c) { const n = parseInt(h.slice(1), 16); c = [n >> 16 & 255, n >> 8 & 255, n & 255]; _rgb.set(h, c); }
  return c;
}
function rgbHex(c) { return '#' + c.map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join(''); }
function mezcla(a, b, t) { const x = hexRgb(a), y = hexRgb(b); return rgbHex([lerp(x[0], y[0], t), lerp(x[1], y[1], t), lerp(x[2], y[2], t)]); }
function rgba(h, a) { const c = hexRgb(h); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
function mult(a, b) { const x = hexRgb(a), y = hexRgb(b); return rgbHex([x[0] * y[0] / 255, x[1] * y[1] / 255, x[2] * y[2] / 255]); }

// ---------- idiomas ----------
const IDIOMAS = [
  ['es', 'Español (Argentina)'], ['es-MX', 'Español (México)'], ['en', 'English'], ['pt', 'Português (Brasil)'],
  ['ar', 'العربية'], ['id', 'Bahasa Indonesia'], ['ms', 'Bahasa Melayu'], ['fil', 'Filipino'],
  ['tr', 'Türkçe'], ['ur', 'اردو'], ['th', 'ไทย'], ['my', 'မြန်မာ'], ['ja', '日本語'],
];
const TXT = {};
let IDIOMA = 'es';
function tr(k) {
  let s = (TXT[IDIOMA] && TXT[IDIOMA][k]);
  if (s == null) s = TXT.en && TXT.en[k];
  if (s == null) s = TXT.es[k];
  if (s == null) return k;
  if (arguments.length > 1) { const a = arguments; s = s.replace(/\{(\d)\}/g, (m, i) => a[+i + 1]); }
  return s;
}
function idiomaInicial(g) {
  if (g && TXT[g]) return g;
  const ls = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en'];
  for (const l0 of ls) {
    const [a, b] = String(l0 || '').toLowerCase().split('-');
    if (a === 'es') return b === 'ar' || b === 'uy' || b === 'py' ? 'es' : 'es-MX';
    if (a === 'pt') return 'pt';
    if (a === 'tl' || a === 'fil') return 'fil';
    if (a === 'in' || a === 'id') return 'id';
    if (['en', 'ar', 'ms', 'tr', 'ur', 'th', 'my', 'ja'].includes(a)) return a;
  }
  return 'en';
}
const esRTL = () => IDIOMA === 'ar' || IDIOMA === 'ur';
