// SIETE COLORES — base: tamaños, azar con semilla, guardado, colores, matrices e idioma
const JUEGO = 'sietecolores';
const PARAM = new URLSearchParams(location.search);
const PRUEBA = PARAM.has('prueba');
let W = 216, H = 400, RES = 1, ESC = 1, DPR = 1;

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const suave = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const rebote = t => { const c = 1.70158; t -= 1; return 1 + (c + 1) * t * t * t + c * t * t; };
const salida = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
const angDif = (a, b) => { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };
const acercar = (v, obj, paso) => v < obj ? Math.min(obj, v + paso) : Math.max(obj, v - paso);

function rngSemilla(s) {
  let a = (s >>> 0) || 1;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash2(x, y) { let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function hash3(x, y, z) { return hash2(x + Math.imul(z | 0, 1013), y - Math.imul(z | 0, 7919)); }
// ruido de valor suave (para el terreno)
function ruido2(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm2(x, y, oct) { let s = 0, a = 0.5, f = 1, n = 0; for (let i = 0; i < (oct || 4); i++) { s += a * ruido2(x * f, y * f); n += a; a *= 0.5; f *= 2.03; } return s / n; }
const vis = Math.random;
const rnd = (a, b) => a + vis() * (b - a);

const Guardado = {
  leer(k, def) { try { const v = localStorage.getItem(JUEGO + '.' + k); return v == null ? def : JSON.parse(v); } catch (e) { return def; } },
  escribir(k, v) { try { localStorage.setItem(JUEGO + '.' + k, JSON.stringify(v)); } catch (e) { } },
  borrar(k) { try { localStorage.removeItem(JUEGO + '.' + k); } catch (e) { } },
};
function fmtT(s) { s = Math.max(0, Math.floor(s)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); }

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
// color hex → lineal 0..1 (para los sombreadores)
function lin3(h) { return hexRgb(h).map(v => Math.pow(v / 255, 2.2)); }

// ---------- matrices (columna mayor, como WebGL) ----------
const M4 = {
  nueva() { const m = new Float32Array(16); m[0] = m[5] = m[10] = m[15] = 1; return m; },
  ident(m) { m.fill(0); m[0] = m[5] = m[10] = m[15] = 1; return m; },
  persp(m, fovy, asp, n, f) {
    const t = 1 / Math.tan(fovy / 2); m.fill(0);
    m[0] = t / asp; m[5] = t; m[10] = (f + n) / (n - f); m[11] = -1; m[14] = 2 * f * n / (n - f); return m;
  },
  orto(m, l, r, b, t, n, f) {
    m.fill(0); m[0] = 2 / (r - l); m[5] = 2 / (t - b); m[10] = -2 / (f - n); m[12] = -(r + l) / (r - l); m[13] = -(t + b) / (t - b); m[14] = -(f + n) / (f - n); m[15] = 1; return m;
  },
  mirar(m, ex, ey, ez, cx, cy, cz, ux, uy, uz) {
    let zx = ex - cx, zy = ey - cy, zz = ez - cz, l = Math.hypot(zx, zy, zz) || 1; zx /= l; zy /= l; zz /= l;
    let xx = uy * zz - uz * zy, xy = uz * zx - ux * zz, xz = ux * zy - uy * zx; l = Math.hypot(xx, xy, xz) || 1; xx /= l; xy /= l; xz /= l;
    const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
    m[0] = xx; m[1] = yx; m[2] = zx; m[3] = 0; m[4] = xy; m[5] = yy; m[6] = zy; m[7] = 0; m[8] = xz; m[9] = yz; m[10] = zz; m[11] = 0;
    m[12] = -(xx * ex + xy * ey + xz * ez); m[13] = -(yx * ex + yy * ey + yz * ez); m[14] = -(zx * ex + zy * ey + zz * ez); m[15] = 1; return m;
  },
  mul(o, a, b) {
    const r = M4._t;
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) r[j * 4 + i] = a[i] * b[j * 4] + a[4 + i] * b[j * 4 + 1] + a[8 + i] * b[j * 4 + 2] + a[12 + i] * b[j * 4 + 3];
    o.set(r); return o;
  },
  inv(o, m) {
    const a = m, b = M4._t;
    b[0] = a[5] * a[10] * a[15] - a[5] * a[11] * a[14] - a[9] * a[6] * a[15] + a[9] * a[7] * a[14] + a[13] * a[6] * a[11] - a[13] * a[7] * a[10];
    b[4] = -a[4] * a[10] * a[15] + a[4] * a[11] * a[14] + a[8] * a[6] * a[15] - a[8] * a[7] * a[14] - a[12] * a[6] * a[11] + a[12] * a[7] * a[10];
    b[8] = a[4] * a[9] * a[15] - a[4] * a[11] * a[13] - a[8] * a[5] * a[15] + a[8] * a[7] * a[13] + a[12] * a[5] * a[11] - a[12] * a[7] * a[9];
    b[12] = -a[4] * a[9] * a[14] + a[4] * a[10] * a[13] + a[8] * a[5] * a[14] - a[8] * a[6] * a[13] - a[12] * a[5] * a[10] + a[12] * a[6] * a[9];
    b[1] = -a[1] * a[10] * a[15] + a[1] * a[11] * a[14] + a[9] * a[2] * a[15] - a[9] * a[3] * a[14] - a[13] * a[2] * a[11] + a[13] * a[3] * a[10];
    b[5] = a[0] * a[10] * a[15] - a[0] * a[11] * a[14] - a[8] * a[2] * a[15] + a[8] * a[3] * a[14] + a[12] * a[2] * a[11] - a[12] * a[3] * a[10];
    b[9] = -a[0] * a[9] * a[15] + a[0] * a[11] * a[13] + a[8] * a[1] * a[15] - a[8] * a[3] * a[13] - a[12] * a[1] * a[11] + a[12] * a[3] * a[9];
    b[13] = a[0] * a[9] * a[14] - a[0] * a[10] * a[13] - a[8] * a[1] * a[14] + a[8] * a[2] * a[13] + a[12] * a[1] * a[10] - a[12] * a[2] * a[9];
    b[2] = a[1] * a[6] * a[15] - a[1] * a[7] * a[14] - a[5] * a[2] * a[15] + a[5] * a[3] * a[14] + a[13] * a[2] * a[7] - a[13] * a[3] * a[6];
    b[6] = -a[0] * a[6] * a[15] + a[0] * a[7] * a[14] + a[4] * a[2] * a[15] - a[4] * a[3] * a[14] - a[12] * a[2] * a[7] + a[12] * a[3] * a[6];
    b[10] = a[0] * a[5] * a[15] - a[0] * a[7] * a[13] - a[4] * a[1] * a[15] + a[4] * a[3] * a[13] + a[12] * a[1] * a[7] - a[12] * a[3] * a[5];
    b[14] = -a[0] * a[5] * a[14] + a[0] * a[6] * a[13] + a[4] * a[1] * a[14] - a[4] * a[2] * a[13] - a[12] * a[1] * a[6] + a[12] * a[2] * a[5];
    b[3] = -a[1] * a[6] * a[11] + a[1] * a[7] * a[10] + a[5] * a[2] * a[11] - a[5] * a[3] * a[10] - a[9] * a[2] * a[7] + a[9] * a[3] * a[6];
    b[7] = a[0] * a[6] * a[11] - a[0] * a[7] * a[10] - a[4] * a[2] * a[11] + a[4] * a[3] * a[10] + a[8] * a[2] * a[7] - a[8] * a[3] * a[6];
    b[11] = -a[0] * a[5] * a[11] + a[0] * a[7] * a[9] + a[4] * a[1] * a[11] - a[4] * a[3] * a[9] - a[8] * a[1] * a[7] + a[8] * a[3] * a[5];
    b[15] = a[0] * a[5] * a[10] - a[0] * a[6] * a[9] - a[4] * a[1] * a[10] + a[4] * a[2] * a[9] + a[8] * a[1] * a[6] - a[8] * a[2] * a[5];
    let det = a[0] * b[0] + a[1] * b[4] + a[2] * b[8] + a[3] * b[12];
    det = det ? 1 / det : 0;
    for (let i = 0; i < 16; i++) o[i] = b[i] * det;
    return o;
  },
  // m = m · T, m · R, m · S (para armar los muñecos de a piezas)
  mover(m, x, y, z) { m[12] += m[0] * x + m[4] * y + m[8] * z; m[13] += m[1] * x + m[5] * y + m[9] * z; m[14] += m[2] * x + m[6] * y + m[10] * z; m[15] += m[3] * x + m[7] * y + m[11] * z; return m; },
  rotX(m, a) { const c = Math.cos(a), s = Math.sin(a); for (let i = 0; i < 4; i++) { const y = m[4 + i], z = m[8 + i]; m[4 + i] = y * c + z * s; m[8 + i] = z * c - y * s; } return m; },
  rotY(m, a) { const c = Math.cos(a), s = Math.sin(a); for (let i = 0; i < 4; i++) { const x = m[i], z = m[8 + i]; m[i] = x * c - z * s; m[8 + i] = x * s + z * c; } return m; },
  rotZ(m, a) { const c = Math.cos(a), s = Math.sin(a); for (let i = 0; i < 4; i++) { const x = m[i], y = m[4 + i]; m[i] = x * c + y * s; m[4 + i] = y * c - x * s; } return m; },
  escalar(m, x, y, z) { for (let i = 0; i < 4; i++) { m[i] *= x; m[4 + i] *= y; m[8 + i] *= z; } return m; },
  // punto del mundo → pantalla (0..1); null si queda atrás
  proyectar(vp, x, y, z) {
    const w = vp[3] * x + vp[7] * y + vp[11] * z + vp[15];
    if (w <= 0.01) return null;
    return [((vp[0] * x + vp[4] * y + vp[8] * z + vp[12]) / w) * 0.5 + 0.5, 0.5 - ((vp[1] * x + vp[5] * y + vp[9] * z + vp[13]) / w) * 0.5, w];
  },
  _t: new Float32Array(16),
};
// los 6 planos del frustum desde VP (ax+by+cz+d >= 0 adentro)
function planosFrustum(vp, out) {
  const p = out || [new Float32Array(4), new Float32Array(4), new Float32Array(4), new Float32Array(4), new Float32Array(4), new Float32Array(4)];
  const f = (k, a, b, c, d) => { const l = Math.hypot(a, b, c) || 1; p[k][0] = a / l; p[k][1] = b / l; p[k][2] = c / l; p[k][3] = d / l; };
  const m = vp;
  f(0, m[3] + m[0], m[7] + m[4], m[11] + m[8], m[15] + m[12]);
  f(1, m[3] - m[0], m[7] - m[4], m[11] - m[8], m[15] - m[12]);
  f(2, m[3] + m[1], m[7] + m[5], m[11] + m[9], m[15] + m[13]);
  f(3, m[3] - m[1], m[7] - m[5], m[11] - m[9], m[15] - m[13]);
  f(4, m[3] + m[2], m[7] + m[6], m[11] + m[10], m[15] + m[14]);
  f(5, m[3] - m[2], m[7] - m[6], m[11] - m[10], m[15] - m[14]);
  return p;
}
function cajaVisible(P, x0, y0, z0, x1, y1, z1) {
  for (let k = 0; k < 6; k++) {
    const p = P[k];
    if (p[0] * (p[0] > 0 ? x1 : x0) + p[1] * (p[1] > 0 ? y1 : y0) + p[2] * (p[2] > 0 ? z1 : z0) + p[3] < 0) return false;
  }
  return true;
}

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
  if (s == null && IDIOMA === 'es-MX') s = TXT.es[k];
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
