(function(){'use strict';
// MANSION BUILDER — adaptador para TikTok Minis (runtime nativo: no hay DOM ni CSS). Va adentro del mismo cierre que el
// juego y le presta lo poco de navegador que usa: el lienzo de la pantalla (WebGL2) y otro para la interfaz 2D que se
// compone encima como textura, los toques, el guardado, el sonido (WebAudio del runtime o InnerAudio), la letra TTF,
// compartir y la vida de la app (onShow/onHide). Los anuncios usan TTMinis.game directo (ver js/anuncios.js).
const TTG = (typeof TTMinis !== 'undefined' && TTMinis.game) ? TTMinis.game : (typeof tt !== 'undefined' ? tt : null);
if (!TTG) throw new Error('Este paquete es para TikTok Minis');
const _sys = TTG.getSystemInfoSync();
const _pantalla = TTG.createCanvas();   // el primero es el de la pantalla
const _ui = TTG.createCanvas();         // los demás quedan fuera de pantalla
const _oyentes = {}, _vis = [];
// Path2D no existe en el runtime: un camino que se reproduce al trazarlo
class Path2D { constructor() { this.c = []; } moveTo(x, y) { this.c.push(0, x, y); } lineTo(x, y) { this.c.push(1, x, y); } bezierCurveTo(a, b, c, d, e, f) { this.c.push(2, a, b, c, d, e, f); } }
function _parchear(c) {
  if (!c.style) c.style = {};
  const gc = c.getContext.bind(c);
  c.getContext = (tipo, op) => {
    const g = gc(tipo, op);
    if (tipo === '2d' && g && !g.__parche) {
      g.__parche = true;
      const st = g.stroke.bind(g), fi = g.fill.bind(g);
      const trazar = p => { g.beginPath(); const a = p.c; for (let i = 0; i < a.length;) { const o = a[i++]; if (o === 0) { g.moveTo(a[i], a[i + 1]); i += 2; } else if (o === 1) { g.lineTo(a[i], a[i + 1]); i += 2; } else { g.bezierCurveTo(a[i], a[i + 1], a[i + 2], a[i + 3], a[i + 4], a[i + 5]); i += 6; } } };
      g.stroke = p => { if (p instanceof Path2D) trazar(p); st(); };
      g.fill = (p, r) => { if (p instanceof Path2D) { trazar(p); fi(r || 'nonzero'); } else if (p) fi(p); else fi(); };
    }
    return g;
  };
  return c;
}
_parchear(_ui);
if (!_pantalla.style) _pantalla.style = {};
_pantalla.addEventListener = () => { };
_ui.addEventListener = (tipo, f) => { (_oyentes[tipo] || (_oyentes[tipo] = [])).push(f); };
_ui.getBoundingClientRect = () => ({ left: 0, top: 0, width: _sys.windowWidth, height: _sys.windowHeight });
_ui.setPointerCapture = () => { };
// los toques del runtime → los "pointer" que escucha el juego
const _toque = tipo => e => {
  for (const t of (e.changedTouches || e.touches || [])) {
    const ev = { pointerId: t.identifier, clientX: t.clientX, clientY: t.clientY, preventDefault() { } };
    for (const f of (_oyentes[tipo] || [])) f(ev);
  }
};
TTG.onTouchStart(_toque('pointerdown')); TTG.onTouchMove(_toque('pointermove')); TTG.onTouchEnd(_toque('pointerup')); if (TTG.onTouchCancel) TTG.onTouchCancel(_toque('pointercancel'));
// el sonido: WebAudio del runtime si está completo; si no, InnerAudio con los mp3 del paquete
let _AC;
if (TTG.createWebAudioContext) {
  try {
    const c = TTG.createWebAudioContext();
    if (c && c.createGain && c.createBufferSource && c.decodeAudioData && c.createOscillator && c.createBiquadFilter && c.createDynamicsCompressor) {
      if (!('state' in c)) c.state = 'running';
      if (!c.resume) c.resume = () => Promise.resolve(); if (!c.suspend) c.suspend = () => Promise.resolve();
      _AC = function () { return c; };
    }
  } catch (e) { _AC = undefined; }
}
const window = {
  innerWidth: _sys.windowWidth, innerHeight: _sys.windowHeight, devicePixelRatio: _sys.pixelRatio || 2, ontouchstart: null,
  addEventListener() { }, removeEventListener() { }, AudioContext: _AC, __uiDPR: 1.5, __tiktok: true,
  __audios: ["agua","caja","clic","cofre","desbloquear","fanfarria","martillo","moneda","musica","pala","pop","recoger","tick"],
  __leerAudio: n => { try { return TTG.getFileSystemManager().readFileSync('audio/' + n + '.mp3'); } catch (e) { return null; } },
  __nuevaImagen: TTG.createImage ? () => TTG.createImage() : undefined,   // el logo y los íconos van en img/ del paquete
  __crearAudio: TTG.createInnerAudioContext ? (n, bucle) => {
    const a = TTG.createInnerAudioContext(); a.src = 'audio/' + n + '.mp3'; a.loop = !!bucle;
    return { play: () => a.play(), stop: () => a.stop(), pause: () => a.pause(), set volume(v) { a.volume = v; }, get volume() { return a.volume; } };
  } : undefined,
  __compartirTT: txt => { try { if (TTG.shareAppMessage) TTG.shareAppMessage({ title: 'MANSION BUILDER', desc: txt, query: '' }); else if (TTG.setClipboardData) TTG.setClipboardData({ data: txt }); } catch (e) { } },
};
if (typeof globalThis !== 'undefined') globalThis.__ventanaTT = window;   // para depurar desde afuera
try { window.__fuenteTT = TTG.loadFont ? TTG.loadFont('fuente/bungee.ttf') : null; } catch (e) { window.__fuenteTT = null; }
const document = {
  hidden: false,
  getElementById: id => id === 'gl' ? _pantalla : id === 'ui' ? _ui : null,
  createElement: tipo => tipo === 'canvas' ? _parchear(TTG.createCanvas()) : { style: {}, appendChild() { }, remove() { } },
  documentElement: { lang: 'en' }, body: { appendChild() { } },
  addEventListener: (tipo, f) => { if (tipo === 'visibilitychange') _vis.push(f); },
  fonts: { load: () => Promise.resolve() },
};
if (TTG.onHide) TTG.onHide(() => { document.hidden = true; _vis.forEach(f => f()); });
if (TTG.onShow) TTG.onShow(() => { document.hidden = false; _vis.forEach(f => f()); });
// el inicio de sesión silencioso que pide TikTok (no muestra nada; el guardado sigue siendo local)
try { if (TTG.login) TTG.login({ success() { }, fail() { } }); } catch (e) { }
const navigator = {
  userAgent: 'TikTokMinis Mobile ' + (_sys.platform || '') + ' ' + (_sys.model || ''), language: _sys.language || 'en', languages: [_sys.language || 'en'],
  maxTouchPoints: 5, hardwareConcurrency: 4, deviceMemory: 3,
  vibrate: p => { try { (Array.isArray(p) || p > 25 ? TTG.vibrateLong : TTG.vibrateShort).call(TTG, { type: 'light' }); } catch (e) { } return true; },
  clipboard: TTG.setClipboardData ? { writeText: s => new Promise(ok => TTG.setClipboardData({ data: s, success: ok, fail: ok })) } : undefined,
};
const screen = { width: _sys.screenWidth || _sys.windowWidth, height: _sys.screenHeight || _sys.windowHeight };
const location = { search: '', href: 'https://www.tiktok.com/', protocol: 'https:' };
const localStorage = {
  getItem: k => { try { const v = TTG.getStorageSync(k); return v === '' || v == null ? null : String(v); } catch (e) { return null; } },
  setItem: (k, v) => { try { TTG.setStorageSync(k, String(v)); } catch (e) { } },
  removeItem: k => { try { TTG.removeStorageSync(k); } catch (e) { } },
};
const performance = (typeof globalThis !== 'undefined' && globalThis.performance && globalThis.performance.now) ? globalThis.performance : (TTG.getPerformance ? TTG.getPerformance() : { now: () => Date.now() });
const URLSearchParams = class { has() { return false; } get() { return null; } };
const AbortController = undefined;
const atob = s => { const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'; let o = '', b = 0, n = 0; for (const ch of s.replace(/=+$/, '')) { b = (b << 6) | A.indexOf(ch); n += 6; if (n >= 8) { n -= 8; o += String.fromCharCode((b >> n) & 255); } } return o; };
// la red del runtime (los dominios de la IP tienen que estar habilitados en el portal; si no, queda el idioma de TikTok)
const fetch = (url) => new Promise((ok, mal) => {
  if (!TTG.request) return mal(new Error('sin red'));
  TTG.request({ url, method: 'GET', success: r => ok({ json: () => Promise.resolve(typeof r.data === 'string' ? JSON.parse(r.data) : r.data) }), fail: mal });
});
// la interfaz 2D se sube como textura y se dibuja encima del 3D (o sola, en la intro, la carga y los minijuegos)
let _gl = null, _prog = null, _vao = null, _tex = null;
(function () {
  _gl = _pantalla.getContext('webgl2', { antialias: true, alpha: false, depth: true, stencil: false, preserveDrawingBuffer: false, powerPreference: 'high-performance' });
  if (!_gl) return;
  const g = _gl, sh = (t, src) => { const s = g.createShader(t); g.shaderSource(s, src); g.compileShader(s); return s; };
  _prog = g.createProgram();
  g.attachShader(_prog, sh(g.VERTEX_SHADER, '#version 300 es\nin vec2 p; out vec2 uv; void main() { uv = vec2(p.x * 0.5 + 0.5, 0.5 - p.y * 0.5); gl_Position = vec4(p, 0.0, 1.0); }'));
  g.attachShader(_prog, sh(g.FRAGMENT_SHADER, '#version 300 es\nprecision mediump float; uniform sampler2D t; in vec2 uv; out vec4 o; void main() { o = texture(t, uv); }'));
  g.bindAttribLocation(_prog, 0, 'p'); g.linkProgram(_prog);
  _vao = g.createVertexArray(); g.bindVertexArray(_vao);
  const b = g.createBuffer(); g.bindBuffer(g.ARRAY_BUFFER, b); g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), g.STATIC_DRAW);
  g.enableVertexAttribArray(0); g.vertexAttribPointer(0, 2, g.FLOAT, false, 0, 0); g.bindVertexArray(null);
  _tex = g.createTexture(); g.bindTexture(g.TEXTURE_2D, _tex);
  g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR);
  g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
})();
window.__componer = hizo3D => {
  const g = _gl; if (!g || !_ui.width) return;
  g.bindFramebuffer(g.FRAMEBUFFER, null); g.viewport(0, 0, _pantalla.width, _pantalla.height);
  if (!hizo3D) { g.clearColor(0.05, 0.1, 0.16, 1); g.depthMask(true); g.clear(g.COLOR_BUFFER_BIT | g.DEPTH_BUFFER_BIT); }
  g.disable(g.DEPTH_TEST); g.disable(g.CULL_FACE); g.enable(g.BLEND); g.blendFunc(g.ONE, g.ONE_MINUS_SRC_ALPHA);
  g.useProgram(_prog); g.activeTexture(g.TEXTURE0); g.bindTexture(g.TEXTURE_2D, _tex);
  g.pixelStorei(g.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, _ui);
  g.pixelStorei(g.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  g.bindVertexArray(_vao); g.drawArrays(g.TRIANGLE_STRIP, 0, 4); g.bindVertexArray(null);
  g.disable(g.BLEND); g.enable(g.DEPTH_TEST); g.enable(g.CULL_FACE);
};

const AUDIO_DATOS = {};
const IMAGENES_DATOS = {};
// MANSION BUILDER — base: medidas de pantalla, azar con semilla, guardado, colores, matrices y equipo
const JUEGO = 'mansionbuilder';
const PARAM = new URLSearchParams(location.search);
const PRUEBA = PARAM.has('prueba');
// W×H: la pantalla en unidades (el lado corto mide 360); S: píxeles del lienzo por unidad
let W = 360, H = 640, S = 1, DPR = 1, CSSW = 360, CSSH = 640;

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const suave = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const rebote = t => { const c = 1.70158; t -= 1; return 1 + (c + 1) * t * t * t + c * t * t; };
const salida = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
const elastico = t => { t = clamp(t, 0, 1); return t === 0 || t === 1 ? t : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * 2.0944) + 1; };
const angDif = (a, b) => { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };
const acercar = (v, obj, paso) => v < obj ? Math.min(obj, v + paso) : Math.max(obj, v - paso);
const PI = Math.PI, TAU = Math.PI * 2;

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
function ruido2(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
// azar de la simulación (con semilla, para que el bot y las pruebas se repitan) y azar visual (no importa)
let RND = rngSemilla(1);
const az = () => RND();
const azR = (a, b) => a + RND() * (b - a);
const vis = Math.random;
const rnd = (a, b) => a + vis() * (b - a);
function hoy() { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }

const Guardado = {
  leer(k, def) { try { const v = localStorage.getItem(JUEGO + '.' + k); return v == null ? def : JSON.parse(v); } catch (e) { return def; } },
  escribir(k, v) { try { localStorage.setItem(JUEGO + '.' + k, JSON.stringify(v)); } catch (e) { } },
  borrar(k) { try { localStorage.removeItem(JUEGO + '.' + k); } catch (e) { } },
};
function fmtReloj(s) { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
function lienzo(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }

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
function lin3(h) { return hexRgb(h).map(v => Math.pow(v / 255, 2.2)); }
function col3(h) { return hexRgb(h).map(v => v / 255); }

// ---------- matrices (columna mayor, como WebGL) ----------
const M4 = {
  nueva() { const m = new Float32Array(16); m[0] = m[5] = m[10] = m[15] = 1; return m; },
  ident(m) { m.fill(0); m[0] = m[5] = m[10] = m[15] = 1; return m; },
  copiar(o, m) { o.set(m); return o; },
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
  mover(m, x, y, z) { m[12] += m[0] * x + m[4] * y + m[8] * z; m[13] += m[1] * x + m[5] * y + m[9] * z; m[14] += m[2] * x + m[6] * y + m[10] * z; m[15] += m[3] * x + m[7] * y + m[11] * z; return m; },
  rotX(m, a) { if (!a) return m; const c = Math.cos(a), s = Math.sin(a); for (let i = 0; i < 4; i++) { const y = m[4 + i], z = m[8 + i]; m[4 + i] = y * c + z * s; m[8 + i] = z * c - y * s; } return m; },
  rotY(m, a) { if (!a) return m; const c = Math.cos(a), s = Math.sin(a); for (let i = 0; i < 4; i++) { const x = m[i], z = m[8 + i]; m[i] = x * c - z * s; m[8 + i] = x * s + z * c; } return m; },
  rotZ(m, a) { if (!a) return m; const c = Math.cos(a), s = Math.sin(a); for (let i = 0; i < 4; i++) { const x = m[i], y = m[4 + i]; m[i] = x * c + y * s; m[4 + i] = y * c - x * s; } return m; },
  escalar(m, x, y, z) { for (let i = 0; i < 4; i++) { m[i] *= x; m[4 + i] *= y; m[8 + i] *= z; } return m; },
  // punto del mundo → pantalla (0..1); null si queda atrás
  proyectar(vp, x, y, z) {
    const w = vp[3] * x + vp[7] * y + vp[11] * z + vp[15];
    if (w <= 0.01) return null;
    return [((vp[0] * x + vp[4] * y + vp[8] * z + vp[12]) / w) * 0.5 + 0.5, 0.5 - ((vp[1] * x + vp[5] * y + vp[9] * z + vp[13]) / w) * 0.5, w];
  },
  _t: new Float32Array(16),
};

// ---------- el equipo: celular o compu, y qué tan fuerte es ----------
const EQUIPO = (() => {
  const ua = navigator.userAgent || '', tactil = 'ontouchstart' in window || (navigator.maxTouchPoints || 0) > 0;
  const movil = /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(ua) || (tactil && Math.min(screen.width, screen.height) < 820);
  const ram = navigator.deviceMemory || (movil ? 3 : 8), nucleos = navigator.hardwareConcurrency || (movil ? 4 : 8);
  return { ua, tactil, movil, ios: /iPhone|iPad|iPod/i.test(ua), ram, nucleos, gpu: '', nivel: 2 };
})();
// el nivel según la placa de video: 0 bajo · 1 medio · 2 alto · 3 ultra
function nivelPorGPU(gpu) {
  const g = (gpu || '').toLowerCase();
  if (!g) return EQUIPO.movil ? 1 : 3;
  if (/swiftshader|llvmpipe|software/.test(g)) return 1;
  if (/apple/.test(g)) return EQUIPO.movil ? 2 : 3;
  let m = /adreno[^0-9]*(\d{3})/.exec(g);
  if (m) { const n = +m[1]; return n >= 730 ? 3 : n >= 640 ? 2 : n >= 610 ? 2 : n >= 506 ? 1 : 0; }
  m = /mali-?g(\d+)/.exec(g);
  if (m) { const n = +m[1]; return n >= 710 ? 3 : n >= 610 ? 2 : n >= 57 ? 1 : 0; }
  if (/mali|powervr|vivante|sgx/.test(g)) return 0;
  if (/xclipse|immortalis/.test(g)) return 3;
  if (/intel/.test(g)) return 2;
  if (/nvidia|geforce|radeon|amd|rtx|gtx/.test(g)) return 3;
  return EQUIPO.movil ? 1 : 2;
}

// MANSION BUILDER — las imágenes de Higgsfield: el logo y una hoja con los íconos de la interfaz (8×3 de 128 px).
// En el HTML vienen en base64 (IMAGENES_DATOS lo arma armar.mjs); en TikTok son archivos del paquete (img/*.png).
// Mientras no cargan, cada lugar sigue con su dibujo de siempre.
const ICONOS_HOJA = ['moneda', 'gema', 'estrella', 'cofre', 'regalo', 'martillo', 'bolsa', 'pesca', 'pico', 'bloques', 'anuncio', 'trofeo',
  'calendario', 'ruleta', 'rayo', 'reloj', 'mejora', 'ayudante', 'mascota', 'traje', 'fuente', 'musica', 'ajustes', 'mapa'];
const IMG = { listo: {} };
(function () {
  const nueva = window.__nuevaImagen || (typeof Image !== 'undefined' ? () => new Image() : null);
  for (const n of ['iconos', 'logo']) {
    const src = window.__nuevaImagen ? 'img/' + n + '.png' : (typeof IMAGENES_DATOS !== 'undefined' ? IMAGENES_DATOS[n] : null);
    if (!nueva || !src) continue;
    try { const im = nueva(); im.onload = () => { IMG.listo[n] = true; }; im.src = src; IMG[n] = im; } catch (e) { }
  }
})();
// un ícono de la hoja centrado en (x, y) con lado s; false si todavía no cargó
function dibujarIcono(g, nombre, x, y, s) {
  const i = ICONOS_HOJA.indexOf(nombre);
  if (!IMG.listo.iconos || i < 0) return false;
  g.drawImage(IMG.iconos, (i % 8) * 128, Math.floor(i / 8) * 128, 128, 128, x - s / 2, y - s / 2, s, s);
  return true;
}

// MANSION BUILDER — los 4 idiomas (inglés, español, portugués, vietnamita), elegidos solos según el país de la IP
const TXT = {
  en: {
    renovar: "NEW MANSION ★", renovarTxt: "Start a new mansion with a new style. You keep your machines, helpers and outfits, and visitors pay 50% more forever!",
    sinAnuncio: "Ad not available, try later",
    anuncio: "AD",
    anuncioPrueba: "Test ad · the real one shows on TikTok",
    volveManana: "No more today, come back tomorrow",
    faltaPlata: "NOT ENOUGH MONEY",
    faltaGemas: "NOT ENOUGH GEMS",
    tienda: "SHOP",
    usando: "IN USE",
    usar: "USE",
    listo: "DONE",
    mision: "MISSION COMPLETE!",
    logroTit: "ACHIEVEMENT!",
    diaN: "DAY {n}",
    ruleta: "LUCKY WHEEL",
    cofreAparece: "A CHEST APPEARED!",
    cofre: "TREASURE CHEST",
    actividades: "ACTIVITIES",
    nuevasMisiones: "New missions every day",
    girarGratis: "FREE SPIN",
    girar: "SPIN",
    unaGratis: "One free spin every day",
    masGiros: "Watch an ad for an extra spin",
    cobrarX: "COLLECT x{n}",
    sinCebo: "NO BAIT",
    perfecto: "PERFECT!",
    seEscapo: "IT GOT AWAY!",
    tocaYa: "TAP NOW!",
    lanzar: "CAST",
    masCebo: "+5 BAIT",
    tocaSoltar: "Tap to drop the block",
    pisos: "{n} FLOORS",
    seguir: "CONTINUE",
    excavaTit: "DIG FOR TREASURE",
    masPicos: "+2 DIGS",
    elegiCelda: "Pick a spot to dig",
    minijuegos: "MINIGAMES",
    cebos: "Bait",
    partidas: "Plays today",
    jugar: "PLAY",
    tab: {"trajes": "OUTFITS", "mascotas": "PETS", "decos": "DECOR", "boosts": "BOOSTS", "misiones": "MISSIONS", "logros": "ACHIEVEMENTS", "calendario": "DAILY"},
    traje: {"jugador": "Builder", "granjero": "Farmer", "chef": "Chef", "surfista": "Surfer", "vaquero": "Cowboy", "pirata": "Pirate", "ninja": "Ninja", "astronauta": "Astronaut", "heroe": "Hero", "rey": "King"},
    masc: {"perro": "Dog", "gato": "Cat", "gallina": "Hen", "cerdito": "Piggy"},
    mascEf: {"perro": "+10% speed", "gato": "Collects the cash when you are near", "gallina": "Lays golden eggs", "cerdito": "Visitors pay 10% more"},
    deco: {"estatua": "Gold statue", "palmeras": "Palm trees", "flamencos": "Flamingos", "auto": "Sports car", "helados": "Ice cream stand", "barco": "Sailboat", "faro": "Lighthouse", "globo": "Hot air balloon"},
    boost: {"x2": "Double money", "vel": "Super speed", "iman": "Cash magnet", "llenar": "Fill machines", "pack": "Money pack", "gemasAd": "Free gems"},
    mis: {"entregar": "Deliver {n} blocks", "cobrar": "Collect ${n} from the cash", "visitas": "Get {n} visitors to pay", "mejora": "Buy {n} upgrade", "cofre": "Open {n} chests", "pescar": "Catch {n} fish", "torre": "Stack {n} floors in the tower", "excavar": "Play {n} treasure dig", "ruleta": "Spin the wheel {n} time", "anuncio": "Watch {n} ads"},
    logro: {"bloques1": "Deliver your first block", "bloques100": "Deliver {n} blocks", "bloques500": "Deliver {n} blocks", "partes2": "Finish {n} parts", "partes7": "Finish {n} parts", "partes13": "Finish the mansion", "plata5k": "Earn ${n}", "plata100k": "Earn ${n}", "visitas100": "{n} visitors", "ayudantes3": "Hire {n} helpers", "peces10": "Catch {n} fish", "torre20": "Stack {n} floors", "cofres10": "Open {n} chests", "trajes5": "Own {n} outfits", "mascotas2": "Adopt {n} pets", "decos4": "Buy {n} decorations"},
    pez: {"sardina": "Sardine", "salmon": "Salmon", "globo": "Pufferfish", "espada": "Swordfish", "dorado": "Golden fish"},
    mj: {"pesca": "Fishing", "torre": "Block tower", "excava": "Treasure dig"},
    mjDesc: {"pesca": "Tap when the needle is in the green. Gold = double!", "torre": "Stack blocks as high as you can. Perfect drops keep the size!", "excava": "Pick 3 spots and dig for coins, gems and chests."},
    sub: 'Build your dream mansion!', toca: 'TAP TO PLAY', cargando: 'Loading',
    tips: ['Carry blocks from the machines to the construction site.', 'Step on a green pad to spend money and unlock things.', 'Helpers carry blocks for you, even while you rest.', 'Visitors pay to see your mansion: collect the cash!', 'A bigger backpack means fewer trips.'],
    mat: { madera: 'Wood', piedra: 'Stone', vidrio: 'Glass', marmol: 'Marble', oro: 'Gold' },
    gen: { madera: 'Sawmill', piedra: 'Quarry', vidrio: 'Glassworks', marmol: 'Marble works', oro: 'Gold mine' },
    parte: { piso: 'Floor', cimientos: 'Foundation', paredes: 'Walls', puerta: 'Front door', ventanas: 'Windows', entrepiso: 'Second floor', alta: 'Upper floor', ventanales: 'Big windows', techo: 'Roof', balcon: 'Balcony', jardin: 'Garden', pileta: 'Pool', oro: 'Gold details' },
    obj: { junta: 'Collect {m}', entrega: 'Bring the blocks to the construction', plata: 'Collect your cash', desbloquear: 'Unlock the {g}', espera: 'Wait for visitors to pay', mejora: 'Buy an upgrade' },
    desbloquear: 'UNLOCK', mejorar: 'UPGRADE', nivel: 'LV', max: 'MAX', mochila: 'Backpack', vel: 'Shoes', ayudante: 'Helper', contratar: 'HIRE',
    lleno: 'FULL!', noHace: 'NOT NEEDED NOW', lista: '{p} DONE!', mansion: 'MANSION COMPLETE!', nuevoAy: 'NEW HELPER!', abierto: '{g} UNLOCKED!', subio: 'LEVEL UP!',
    parteN: 'PART {n}/{t}', obra: 'CONSTRUCTION', caja: 'CASH',
    ajustes: 'SETTINGS', musica: 'Music', sonido: 'Sound', vibra: 'Vibration', graficos: 'Graphics', idioma: 'Language', joy: 'Joystick', tam: 'Size',
    si: 'ON', no: 'OFF', auto: 'Auto', cal: ['Low', 'Medium', 'High', 'Ultra'], flota: 'Floating', fijo: 'Fixed', tams: ['S', 'M', 'L'],
    borrar: 'Reset progress', seguro: 'Delete everything and start over?', siB: 'YES', noB: 'NO', cerrar: 'CLOSE',
    volviste: 'WELCOME BACK!', teDejaron: 'Your visitors left you', cobrar: 'COLLECT',
    diario: 'DAILY REWARD', reclamar: 'CLAIM', manana: 'Come back tomorrow!',
    compartir: 'SHARE', textoComp: 'I am building my dream mansion in MANSION BUILDER!', copiado: 'COPIED!', fin: 'You built the whole mansion! Visitors keep coming.',
    girar: 'Rotate your phone for the best view',
  },
  es: {
    renovar: "NUEVA MANSIÓN ★", renovarTxt: "Empezá una mansión nueva con otro estilo. Te quedás con las máquinas, ayudantes y trajes, ¡y los visitantes pagan 50% más para siempre!",
    sinAnuncio: "No hay anuncio ahora, probá más tarde",
    anuncio: "ANUNCIO",
    anuncioPrueba: "Anuncio de prueba · el de verdad sale en TikTok",
    volveManana: "Por hoy no hay más, volvé mañana",
    faltaPlata: "TE FALTA PLATA",
    faltaGemas: "TE FALTAN GEMAS",
    tienda: "TIENDA",
    usando: "PUESTO",
    usar: "USAR",
    listo: "LISTO",
    mision: "¡MISIÓN CUMPLIDA!",
    logroTit: "¡LOGRO!",
    diaN: "DÍA {n}",
    ruleta: "RULETA",
    cofreAparece: "¡APARECIÓ UN COFRE!",
    cofre: "COFRE DEL TESORO",
    actividades: "ACTIVIDADES",
    nuevasMisiones: "Misiones nuevas todos los días",
    girarGratis: "GIRAR GRATIS",
    girar: "GIRAR",
    unaGratis: "Un giro gratis por día",
    masGiros: "Mirá un anuncio para girar otra vez",
    cobrarX: "COBRAR x{n}",
    sinCebo: "SIN CEBO",
    perfecto: "¡PERFECTO!",
    seEscapo: "¡SE ESCAPÓ!",
    tocaYa: "¡TOCÁ YA!",
    lanzar: "LANZAR",
    masCebo: "+5 CEBOS",
    tocaSoltar: "Tocá para soltar el bloque",
    pisos: "{n} PISOS",
    seguir: "SEGUIR",
    excavaTit: "BUSCÁ EL TESORO",
    masPicos: "+2 PALADAS",
    elegiCelda: "Elegí dónde cavar",
    minijuegos: "MINIJUEGOS",
    cebos: "Cebos",
    partidas: "Partidas hoy",
    jugar: "JUGAR",
    tab: {"trajes": "TRAJES", "mascotas": "MASCOTAS", "decos": "DECO", "boosts": "MEJORAS", "misiones": "MISIONES", "logros": "LOGROS", "calendario": "DIARIO"},
    traje: {"jugador": "Constructor", "granjero": "Granjero", "chef": "Chef", "surfista": "Surfista", "vaquero": "Vaquero", "pirata": "Pirata", "ninja": "Ninja", "astronauta": "Astronauta", "heroe": "Héroe", "rey": "Rey"},
    masc: {"perro": "Perro", "gato": "Gato", "gallina": "Gallina", "cerdito": "Cerdito"},
    mascEf: {"perro": "+10% de velocidad", "gato": "Junta la plata de la caja si estás cerca", "gallina": "Pone huevos de oro", "cerdito": "Los visitantes pagan 10% más"},
    deco: {"estatua": "Estatua dorada", "palmeras": "Palmeras", "flamencos": "Flamencos", "auto": "Auto deportivo", "helados": "Heladería", "barco": "Velero", "faro": "Faro", "globo": "Globo aerostático"},
    boost: {"x2": "Plata x2", "vel": "Súper velocidad", "iman": "Imán de plata", "llenar": "Llenar máquinas", "pack": "Paquete de plata", "gemasAd": "Gemas gratis"},
    mis: {"entregar": "Entregá {n} bloques", "cobrar": "Juntá ${n} de la caja", "visitas": "Que paguen {n} visitantes", "mejora": "Comprá {n} mejora", "cofre": "Abrí {n} cofres", "pescar": "Pescá {n} peces", "torre": "Apilá {n} pisos en la torre", "excavar": "Jugá {n} excavación", "ruleta": "Girá la ruleta {n} vez", "anuncio": "Mirá {n} anuncios"},
    logro: {"bloques1": "Entregá tu primer bloque", "bloques100": "Entregá {n} bloques", "bloques500": "Entregá {n} bloques", "partes2": "Terminá {n} partes", "partes7": "Terminá {n} partes", "partes13": "Terminá la mansión", "plata5k": "Ganá ${n}", "plata100k": "Ganá ${n}", "visitas100": "{n} visitantes", "ayudantes3": "Contratá {n} ayudantes", "peces10": "Pescá {n} peces", "torre20": "Apilá {n} pisos", "cofres10": "Abrí {n} cofres", "trajes5": "Tené {n} trajes", "mascotas2": "Adoptá {n} mascotas", "decos4": "Comprá {n} decoraciones"},
    pez: {"sardina": "Sardina", "salmon": "Salmón", "globo": "Pez globo", "espada": "Pez espada", "dorado": "Pez dorado"},
    mj: {"pesca": "Pesca", "torre": "Torre de bloques", "excava": "Excavación"},
    mjDesc: {"pesca": "Tocá cuando la aguja esté en lo verde. ¡En lo dorado, doble!", "torre": "Apilá bloques lo más alto posible. ¡Los perfectos no se achican!", "excava": "Elegí 3 lugares y cavá: monedas, gemas y cofres."},
    sub: '¡Construí la mansión de tus sueños!', toca: 'TOCÁ PARA JUGAR', cargando: 'Cargando',
    tips: ['Llevá los bloques de las máquinas a la obra.', 'Pisá un cuadro verde para gastar plata y desbloquear cosas.', 'Los ayudantes cargan bloques por vos, aunque descanses.', 'Los visitantes pagan por ver tu mansión: ¡juntá la plata!', 'Con una mochila más grande hacés menos viajes.'],
    mat: { madera: 'Madera', piedra: 'Piedra', vidrio: 'Vidrio', marmol: 'Mármol', oro: 'Oro' },
    gen: { madera: 'Maderera', piedra: 'Cantera', vidrio: 'Vidriería', marmol: 'Marmolería', oro: 'Mina de oro' },
    parte: { piso: 'Piso', cimientos: 'Cimientos', paredes: 'Paredes', puerta: 'Puerta', ventanas: 'Ventanas', entrepiso: 'Entrepiso', alta: 'Planta alta', ventanales: 'Ventanales', techo: 'Techo', balcon: 'Balcón', jardin: 'Jardín', pileta: 'Pileta', oro: 'Detalles de oro' },
    obj: { junta: 'Juntá {m}', entrega: 'Llevá los bloques a la obra', plata: 'Juntá tu plata', desbloquear: 'Desbloqueá la {g}', espera: 'Esperá que paguen los visitantes', mejora: 'Comprá una mejora' },
    desbloquear: 'DESBLOQUEAR', mejorar: 'MEJORAR', nivel: 'NV', max: 'MÁX', mochila: 'Mochila', vel: 'Zapatillas', ayudante: 'Ayudante', contratar: 'CONTRATAR',
    lleno: '¡LLENO!', noHace: 'AHORA NO HACE FALTA', lista: '¡{p} LISTO!', mansion: '¡MANSIÓN TERMINADA!', nuevoAy: '¡NUEVO AYUDANTE!', abierto: '¡{g} ABIERTA!', subio: '¡SUBIÓ DE NIVEL!',
    parteN: 'PARTE {n}/{t}', obra: 'OBRA', caja: 'CAJA',
    ajustes: 'AJUSTES', musica: 'Música', sonido: 'Sonido', vibra: 'Vibración', graficos: 'Gráficos', idioma: 'Idioma', joy: 'Joystick', tam: 'Tamaño',
    si: 'SÍ', no: 'NO', auto: 'Auto', cal: ['Bajo', 'Medio', 'Alto', 'Ultra'], flota: 'Flotante', fijo: 'Fijo', tams: ['C', 'M', 'G'],
    borrar: 'Borrar progreso', seguro: '¿Borrar todo y empezar de nuevo?', siB: 'SÍ', noB: 'NO', cerrar: 'CERRAR',
    volviste: '¡VOLVISTE!', teDejaron: 'Tus visitantes te dejaron', cobrar: 'COBRAR',
    diario: 'PREMIO DIARIO', reclamar: 'RECLAMAR', manana: '¡Volvé mañana!',
    compartir: 'COMPARTIR', textoComp: '¡Estoy construyendo la mansión de mis sueños en MANSION BUILDER!', copiado: '¡COPIADO!', fin: '¡Construiste la mansión entera! Los visitantes siguen viniendo.',
    girar: 'Girá el celular para verlo mejor',
  },
  pt: {
    renovar: "NOVA MANSÃO ★", renovarTxt: "Comece uma mansão nova com outro estilo. Você mantém máquinas, ajudantes e roupas, e os visitantes pagam 50% a mais para sempre!",
    sinAnuncio: "Anúncio indisponível, tente depois",
    anuncio: "ANÚNCIO",
    anuncioPrueba: "Anúncio de teste · o real aparece no TikTok",
    volveManana: "Por hoje acabou, volte amanhã",
    faltaPlata: "FALTA DINHEIRO",
    faltaGemas: "FALTAM GEMAS",
    tienda: "LOJA",
    usando: "EM USO",
    usar: "USAR",
    listo: "PRONTO",
    mision: "MISSÃO CUMPRIDA!",
    logroTit: "CONQUISTA!",
    diaN: "DIA {n}",
    ruleta: "ROLETA",
    cofreAparece: "APARECEU UM BAÚ!",
    cofre: "BAÚ DO TESOURO",
    actividades: "ATIVIDADES",
    nuevasMisiones: "Missões novas todo dia",
    girarGratis: "GIRAR GRÁTIS",
    girar: "GIRAR",
    unaGratis: "Um giro grátis por dia",
    masGiros: "Veja um anúncio para girar de novo",
    cobrarX: "COLETAR x{n}",
    sinCebo: "SEM ISCA",
    perfecto: "PERFEITO!",
    seEscapo: "ESCAPOU!",
    tocaYa: "TOQUE AGORA!",
    lanzar: "LANÇAR",
    masCebo: "+5 ISCAS",
    tocaSoltar: "Toque para soltar o bloco",
    pisos: "{n} ANDARES",
    seguir: "CONTINUAR",
    excavaTit: "ACHE O TESOURO",
    masPicos: "+2 ESCAVADAS",
    elegiCelda: "Escolha onde cavar",
    minijuegos: "MINIJOGOS",
    cebos: "Iscas",
    partidas: "Partidas hoje",
    jugar: "JOGAR",
    tab: {"trajes": "ROUPAS", "mascotas": "PETS", "decos": "DECORAÇÃO", "boosts": "TURBOS", "misiones": "MISSÕES", "logros": "CONQUISTAS", "calendario": "DIÁRIO"},
    traje: {"jugador": "Construtor", "granjero": "Fazendeiro", "chef": "Chef", "surfista": "Surfista", "vaquero": "Caubói", "pirata": "Pirata", "ninja": "Ninja", "astronauta": "Astronauta", "heroe": "Herói", "rey": "Rei"},
    masc: {"perro": "Cachorro", "gato": "Gato", "gallina": "Galinha", "cerdito": "Porquinho"},
    mascEf: {"perro": "+10% de velocidade", "gato": "Pega o dinheiro do caixa quando você está perto", "gallina": "Bota ovos de ouro", "cerdito": "Visitantes pagam 10% a mais"},
    deco: {"estatua": "Estátua dourada", "palmeras": "Coqueiros", "flamencos": "Flamingos", "auto": "Carro esportivo", "helados": "Sorveteria", "barco": "Veleiro", "faro": "Farol", "globo": "Balão"},
    boost: {"x2": "Dinheiro x2", "vel": "Supervelocidade", "iman": "Ímã de dinheiro", "llenar": "Encher máquinas", "pack": "Pacote de dinheiro", "gemasAd": "Gemas grátis"},
    mis: {"entregar": "Entregue {n} blocos", "cobrar": "Pegue ${n} do caixa", "visitas": "Faça {n} visitantes pagarem", "mejora": "Compre {n} melhoria", "cofre": "Abra {n} baús", "pescar": "Pesque {n} peixes", "torre": "Empilhe {n} andares na torre", "excavar": "Jogue {n} escavação", "ruleta": "Gire a roleta {n} vez", "anuncio": "Veja {n} anúncios"},
    logro: {"bloques1": "Entregue seu primeiro bloco", "bloques100": "Entregue {n} blocos", "bloques500": "Entregue {n} blocos", "partes2": "Termine {n} partes", "partes7": "Termine {n} partes", "partes13": "Termine a mansão", "plata5k": "Ganhe ${n}", "plata100k": "Ganhe ${n}", "visitas100": "{n} visitantes", "ayudantes3": "Contrate {n} ajudantes", "peces10": "Pesque {n} peixes", "torre20": "Empilhe {n} andares", "cofres10": "Abra {n} baús", "trajes5": "Tenha {n} roupas", "mascotas2": "Adote {n} pets", "decos4": "Compre {n} decorações"},
    pez: {"sardina": "Sardinha", "salmon": "Salmão", "globo": "Baiacu", "espada": "Peixe-espada", "dorado": "Peixe dourado"},
    mj: {"pesca": "Pesca", "torre": "Torre de blocos", "excava": "Escavação"},
    mjDesc: {"pesca": "Toque quando a agulha estiver no verde. No dourado, dobro!", "torre": "Empilhe blocos o mais alto possível. Os perfeitos não diminuem!", "excava": "Escolha 3 lugares e cave: moedas, gemas e baús."},
    sub: 'Construa a mansão dos seus sonhos!', toca: 'TOQUE PARA JOGAR', cargando: 'Carregando',
    tips: ['Leve os blocos das máquinas até a obra.', 'Pise num quadrado verde para gastar dinheiro e desbloquear coisas.', 'Os ajudantes carregam blocos por você, mesmo quando você descansa.', 'Os visitantes pagam para ver sua mansão: pegue o dinheiro!', 'Com uma mochila maior você faz menos viagens.'],
    mat: { madera: 'Madeira', piedra: 'Pedra', vidrio: 'Vidro', marmol: 'Mármore', oro: 'Ouro' },
    gen: { madera: 'Serraria', piedra: 'Pedreira', vidrio: 'Vidraria', marmol: 'Marmoraria', oro: 'Mina de ouro' },
    parte: { piso: 'Piso', cimientos: 'Fundação', paredes: 'Paredes', puerta: 'Porta', ventanas: 'Janelas', entrepiso: 'Laje', alta: 'Andar de cima', ventanales: 'Janelões', techo: 'Telhado', balcon: 'Sacada', jardin: 'Jardim', pileta: 'Piscina', oro: 'Detalhes de ouro' },
    obj: { junta: 'Pegue {m}', entrega: 'Leve os blocos até a obra', plata: 'Pegue seu dinheiro', desbloquear: 'Desbloqueie a {g}', espera: 'Espere os visitantes pagarem', mejora: 'Compre uma melhoria' },
    desbloquear: 'DESBLOQUEAR', mejorar: 'MELHORAR', nivel: 'NV', max: 'MÁX', mochila: 'Mochila', vel: 'Tênis', ayudante: 'Ajudante', contratar: 'CONTRATAR',
    lleno: 'CHEIO!', noHace: 'NÃO PRECISA AGORA', lista: '{p} PRONTO!', mansion: 'MANSÃO CONCLUÍDA!', nuevoAy: 'NOVO AJUDANTE!', abierto: '{g} ABERTA!', subio: 'SUBIU DE NÍVEL!',
    parteN: 'PARTE {n}/{t}', obra: 'OBRA', caja: 'CAIXA',
    ajustes: 'AJUSTES', musica: 'Música', sonido: 'Som', vibra: 'Vibração', graficos: 'Gráficos', idioma: 'Idioma', joy: 'Joystick', tam: 'Tamanho',
    si: 'SIM', no: 'NÃO', auto: 'Auto', cal: ['Baixo', 'Médio', 'Alto', 'Ultra'], flota: 'Flutuante', fijo: 'Fixo', tams: ['P', 'M', 'G'],
    borrar: 'Apagar progresso', seguro: 'Apagar tudo e começar de novo?', siB: 'SIM', noB: 'NÃO', cerrar: 'FECHAR',
    volviste: 'BEM-VINDO DE VOLTA!', teDejaron: 'Seus visitantes deixaram', cobrar: 'COLETAR',
    diario: 'PRÊMIO DIÁRIO', reclamar: 'RESGATAR', manana: 'Volte amanhã!',
    compartir: 'COMPARTILHAR', textoComp: 'Estou construindo a mansão dos meus sonhos no MANSION BUILDER!', copiado: 'COPIADO!', fin: 'Você construiu a mansão inteira! Os visitantes continuam vindo.',
    girar: 'Gire o celular para ver melhor',
  },
  vi: {
    renovar: "BIỆT THỰ MỚI ★", renovarTxt: "Xây biệt thự mới với phong cách khác. Bạn giữ máy, người phụ và trang phục, và khách trả thêm 50% mãi mãi!",
    sinAnuncio: "Chưa có quảng cáo, thử lại sau",
    anuncio: "QUẢNG CÁO",
    anuncioPrueba: "Quảng cáo thử · bản thật hiện trên TikTok",
    volveManana: "Hôm nay hết rồi, mai quay lại nhé",
    faltaPlata: "KHÔNG ĐỦ TIỀN",
    faltaGemas: "KHÔNG ĐỦ ĐÁ QUÝ",
    tienda: "CỬA HÀNG",
    usando: "ĐANG DÙNG",
    usar: "DÙNG",
    listo: "XONG",
    mision: "HOÀN THÀNH NHIỆM VỤ!",
    logroTit: "THÀNH TÍCH!",
    diaN: "NGÀY {n}",
    ruleta: "VÒNG QUAY",
    cofreAparece: "CÓ RƯƠNG XUẤT HIỆN!",
    cofre: "RƯƠNG KHO BÁU",
    actividades: "HOẠT ĐỘNG",
    nuevasMisiones: "Nhiệm vụ mới mỗi ngày",
    girarGratis: "QUAY MIỄN PHÍ",
    girar: "QUAY",
    unaGratis: "Mỗi ngày một lượt quay miễn phí",
    masGiros: "Xem quảng cáo để quay thêm",
    cobrarX: "NHẬN x{n}",
    sinCebo: "HẾT MỒI",
    perfecto: "HOÀN HẢO!",
    seEscapo: "XỔNG MẤT RỒI!",
    tocaYa: "CHẠM NGAY!",
    lanzar: "QUĂNG CẦN",
    masCebo: "+5 MỒI",
    tocaSoltar: "Chạm để thả khối",
    pisos: "{n} TẦNG",
    seguir: "TIẾP TỤC",
    excavaTit: "ĐÀO KHO BÁU",
    masPicos: "+2 LƯỢT ĐÀO",
    elegiCelda: "Chọn chỗ để đào",
    minijuegos: "TRÒ CHƠI NHỎ",
    cebos: "Mồi",
    partidas: "Lượt hôm nay",
    jugar: "CHƠI",
    tab: {"trajes": "TRANG PHỤC", "mascotas": "THÚ CƯNG", "decos": "TRANG TRÍ", "boosts": "TĂNG TỐC", "misiones": "NHIỆM VỤ", "logros": "THÀNH TÍCH", "calendario": "HẰNG NGÀY"},
    traje: {"jugador": "Thợ xây", "granjero": "Nông dân", "chef": "Đầu bếp", "surfista": "Lướt sóng", "vaquero": "Cao bồi", "pirata": "Cướp biển", "ninja": "Ninja", "astronauta": "Phi hành gia", "heroe": "Siêu anh hùng", "rey": "Nhà vua"},
    masc: {"perro": "Chó", "gato": "Mèo", "gallina": "Gà mái", "cerdito": "Heo con"},
    mascEf: {"perro": "+10% tốc độ", "gato": "Tự nhặt tiền khi bạn ở gần", "gallina": "Đẻ trứng vàng", "cerdito": "Khách trả thêm 10%"},
    deco: {"estatua": "Tượng vàng", "palmeras": "Cây dừa", "flamencos": "Hồng hạc", "auto": "Xe thể thao", "helados": "Quầy kem", "barco": "Thuyền buồm", "faro": "Hải đăng", "globo": "Khinh khí cầu"},
    boost: {"x2": "Tiền x2", "vel": "Siêu tốc", "iman": "Nam châm tiền", "llenar": "Làm đầy máy", "pack": "Gói tiền", "gemasAd": "Đá quý miễn phí"},
    mis: {"entregar": "Giao {n} khối", "cobrar": "Nhặt ${n} từ quầy tiền", "visitas": "{n} khách trả tiền", "mejora": "Mua {n} nâng cấp", "cofre": "Mở {n} rương", "pescar": "Câu {n} con cá", "torre": "Xếp {n} tầng tháp", "excavar": "Chơi {n} lần đào kho báu", "ruleta": "Quay vòng quay {n} lần", "anuncio": "Xem {n} quảng cáo"},
    logro: {"bloques1": "Giao khối đầu tiên", "bloques100": "Giao {n} khối", "bloques500": "Giao {n} khối", "partes2": "Hoàn thành {n} phần", "partes7": "Hoàn thành {n} phần", "partes13": "Xây xong biệt thự", "plata5k": "Kiếm ${n}", "plata100k": "Kiếm ${n}", "visitas100": "{n} khách tham quan", "ayudantes3": "Thuê {n} người phụ", "peces10": "Câu {n} con cá", "torre20": "Xếp {n} tầng", "cofres10": "Mở {n} rương", "trajes5": "Có {n} bộ đồ", "mascotas2": "Nuôi {n} thú cưng", "decos4": "Mua {n} đồ trang trí"},
    pez: {"sardina": "Cá mòi", "salmon": "Cá hồi", "globo": "Cá nóc", "espada": "Cá kiếm", "dorado": "Cá vàng"},
    mj: {"pesca": "Câu cá", "torre": "Tháp khối", "excava": "Đào kho báu"},
    mjDesc: {"pesca": "Chạm khi kim ở vùng xanh. Vùng vàng được gấp đôi!", "torre": "Xếp khối càng cao càng tốt. Thả chuẩn giữ nguyên kích thước!", "excava": "Chọn 3 chỗ để đào: xu, đá quý và rương."},
    sub: 'Xây biệt thự trong mơ của bạn!', toca: 'CHẠM ĐỂ CHƠI', cargando: 'Đang tải',
    tips: ['Mang khối từ máy đến công trường.', 'Bước lên ô xanh để tiêu tiền và mở khóa.', 'Người phụ mang khối giúp bạn, kể cả khi bạn nghỉ.', 'Khách trả tiền để xem biệt thự: hãy nhặt tiền!', 'Ba lô lớn hơn thì đi ít chuyến hơn.'],
    mat: { madera: 'Gỗ', piedra: 'Đá', vidrio: 'Kính', marmol: 'Cẩm thạch', oro: 'Vàng' },
    gen: { madera: 'Xưởng gỗ', piedra: 'Mỏ đá', vidrio: 'Xưởng kính', marmol: 'Xưởng cẩm thạch', oro: 'Mỏ vàng' },
    parte: { piso: 'Sàn nhà', cimientos: 'Móng nhà', paredes: 'Tường', puerta: 'Cửa chính', ventanas: 'Cửa sổ', entrepiso: 'Sàn tầng hai', alta: 'Tầng trên', ventanales: 'Cửa kính lớn', techo: 'Mái nhà', balcon: 'Ban công', jardin: 'Khu vườn', pileta: 'Hồ bơi', oro: 'Chi tiết vàng' },
    obj: { junta: 'Nhặt {m}', entrega: 'Mang khối đến công trường', plata: 'Nhặt tiền của bạn', desbloquear: 'Mở khóa {g}', espera: 'Chờ khách trả tiền', mejora: 'Mua nâng cấp' },
    desbloquear: 'MỞ KHÓA', mejorar: 'NÂNG CẤP', nivel: 'CẤP', max: 'TỐI ĐA', mochila: 'Ba lô', vel: 'Giày', ayudante: 'Người phụ', contratar: 'THUÊ',
    lleno: 'ĐẦY RỒI!', noHace: 'CHƯA CẦN', lista: '{p} XONG!', mansion: 'BIỆT THỰ HOÀN THÀNH!', nuevoAy: 'NGƯỜI PHỤ MỚI!', abierto: 'ĐÃ MỞ {g}!', subio: 'LÊN CẤP!',
    parteN: 'PHẦN {n}/{t}', obra: 'CÔNG TRƯỜNG', caja: 'TIỀN',
    ajustes: 'CÀI ĐẶT', musica: 'Âm nhạc', sonido: 'Âm thanh', vibra: 'Rung', graficos: 'Đồ họa', idioma: 'Ngôn ngữ', joy: 'Cần điều khiển', tam: 'Cỡ',
    si: 'BẬT', no: 'TẮT', auto: 'Tự động', cal: ['Thấp', 'Vừa', 'Cao', 'Cực cao'], flota: 'Nổi', fijo: 'Cố định', tams: ['N', 'V', 'L'],
    borrar: 'Xóa tiến trình', seguro: 'Xóa hết và chơi lại từ đầu?', siB: 'CÓ', noB: 'KHÔNG', cerrar: 'ĐÓNG',
    volviste: 'CHÀO MỪNG TRỞ LẠI!', teDejaron: 'Khách tham quan để lại cho bạn', cobrar: 'NHẬN',
    diario: 'QUÀ HẰNG NGÀY', reclamar: 'NHẬN QUÀ', manana: 'Mai quay lại nhé!',
    compartir: 'CHIA SẺ', textoComp: 'Mình đang xây biệt thự trong mơ trong MANSION BUILDER!', copiado: 'ĐÃ SAO CHÉP!', fin: 'Bạn đã xây xong cả biệt thự! Khách vẫn tiếp tục đến.',
    girar: 'Xoay điện thoại để xem rõ hơn',
  },
};
const IDIOMAS = ['en', 'es', 'pt', 'vi'];
const NOMBRE_IDIOMA = { en: 'English', es: 'Español', pt: 'Português', vi: 'Tiếng Việt' };
let IDIOMA = 'en';
// texto por clave ("obj.junta") con {variables}
function T(clave, vars) {
  let v = TXT[IDIOMA], e = TXT.en;
  for (const k of clave.split('.')) { v = v ? v[k] : undefined; e = e ? e[k] : undefined; }
  let s = v != null ? v : (e != null ? e : clave);
  if (vars && typeof s === 'string') s = s.replace(/\{(\w+)\}/g, (_, k) => vars[k] != null ? vars[k] : '');
  return s;
}
// el país → el idioma (lo que no es de habla hispana, portuguesa o Vietnam va en inglés)
const PAIS_IDIOMA = (() => {
  const m = { VN: 'vi' };
  for (const c of ['BR', 'PT', 'AO', 'MZ', 'CV', 'GW', 'ST', 'TL']) m[c] = 'pt';
  for (const c of ['AR', 'BO', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC', 'SV', 'GQ', 'GT', 'HN', 'MX', 'NI', 'PA', 'PY', 'PE', 'PR', 'ES', 'UY', 'VE']) m[c] = 'es';
  return m;
})();
function idiomaNavegador() {
  for (const l of (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en'])) { const k = String(l).slice(0, 2).toLowerCase(); if (TXT[k]) return k; }
  return 'en';
}
// pregunta el país a tres servicios (gana el primero que contesta; sin red, queda el del navegador)
function idiomaPorIP() {
  const pedir = (url, campo) => new Promise((ok, mal) => {
    const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const t = setTimeout(() => { if (ctl) ctl.abort(); mal(new Error('tiempo')); }, 3500);
    fetch(url, { cache: 'no-store', signal: ctl ? ctl.signal : undefined }).then(r => r.json()).then(j => { clearTimeout(t); const c = String(j[campo] || '').toUpperCase(); if (/^[A-Z]{2}$/.test(c)) ok(c); else mal(new Error('sin país')); }).catch(e => { clearTimeout(t); mal(e); });
  });
  const servicios = [['https://api.country.is/', 'country'], ['https://ipwho.is/', 'country_code'], ['https://get.geojs.io/v1/ip/country.json', 'country']];
  return new Promise(ok => {
    let fallas = 0;
    for (const [u, c] of servicios) pedir(u, c).then(pais => ok(PAIS_IDIOMA[pais] || 'en')).catch(() => { if (++fallas === servicios.length) ok(null); });
  });
}

// MANSION BUILDER — WebGL2 sin librerías: programas, búferes, texturas en arreglo, instancias y sombra
let gl = null;
const GL = {
  ok: false, perdido: false, aniso: null, anisoMax: 1,
  iniciar(cv) {
    const op = { antialias: !PARAM.has('sinaa'), alpha: false, depth: true, stencil: false, preserveDrawingBuffer: !!PRUEBA, powerPreference: 'high-performance' };
    try { gl = cv.getContext('webgl2', op); } catch (e) { gl = null; }
    if (!gl) return false;
    cv.addEventListener('webglcontextlost', e => { e.preventDefault(); GL.perdido = true; }, false);
    cv.addEventListener('webglcontextrestored', () => location.reload(), false);
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    try { EQUIPO.gpu = String(dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)); } catch (e) { EQUIPO.gpu = ''; }
    this.aniso = gl.getExtension('EXT_texture_filter_anisotropic');
    if (this.aniso) this.anisoMax = gl.getParameter(this.aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT) || 1;
    this.ok = true;
    return true;
  },
  programa(vs, fs, nombre) {
    const sh = (tipo, src) => {
      const s = gl.createShader(tipo); gl.shaderSource(s, '#version 300 es\nprecision highp float;\nprecision highp int;\nprecision highp sampler2DArray;\nprecision highp sampler2DShadow;\n' + src); gl.compileShader(s);
      return s;
    };
    const v = sh(gl.VERTEX_SHADER, vs), f = sh(gl.FRAGMENT_SHADER, fs), p = gl.createProgram();
    gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p);
    return { p, u: {}, nombre, v, f, listo: false };
  },
  revisar(P) {
    if (P.listo) return;
    if (!gl.getProgramParameter(P.p, gl.LINK_STATUS)) {
      const err = (gl.getShaderInfoLog(P.v) || '') + (gl.getShaderInfoLog(P.f) || '') + (gl.getProgramInfoLog(P.p) || '');
      throw new Error('shader ' + P.nombre + ': ' + err.slice(0, 600));
    }
    const n = gl.getProgramParameter(P.p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const a = gl.getActiveUniform(P.p, i), nom = a.name.replace(/\[0\]$/, ''); P.u[nom] = gl.getUniformLocation(P.p, a.name); }
    P.listo = true;
  },
  usar(P) { this.revisar(P); gl.useProgram(P.p); return P.u; },
  textura(w, h, interno, formato, tipo, filtro, datos, repetir) {
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, interno, w, h, 0, formato, tipo, datos || null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filtro || gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filtro || gl.NEAREST);
    const wr = repetir ? gl.REPEAT : gl.CLAMP_TO_EDGE;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wr); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wr);
    return t;
  },
  // arreglo de texturas chicas (16×16 los bloques, 64×64 las pieles): sin sangrado entre vecinas y con mipmaps propios
  texturaArreglo(w, h, capas, datos, mip, repetir) {
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D_ARRAY, t);
    gl.texImage3D(gl.TEXTURE_2D_ARRAY, 0, gl.RGBA8, w, h, capas, 0, gl.RGBA, gl.UNSIGNED_BYTE, datos);
    if (mip) { gl.generateMipmap(gl.TEXTURE_2D_ARRAY); gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR); }
    else gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    const wr = repetir ? gl.REPEAT : gl.CLAMP_TO_EDGE;
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, wr); gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, wr);
    return t;
  },
  anisotropia(t, n) {
    if (!this.aniso) return;
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, t);
    gl.texParameterf(gl.TEXTURE_2D_ARRAY, this.aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(n, this.anisoMax));
  },
  tam(t) { return t === gl.FLOAT || t === gl.INT || t === gl.UNSIGNED_INT ? 4 : t === gl.UNSIGNED_SHORT || t === gl.SHORT ? 2 : 1; },
  // búfer de vértices con su formato: [{k: componentes, t: tipo, norm}]; idx opcional
  malla(datos, formato, idx, dinamica) {
    const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, datos, dinamica ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW);
    let paso = 0; for (const f of formato) paso += f.k * this.tam(f.t);
    let o = 0;
    formato.forEach((f, i) => { gl.enableVertexAttribArray(i); gl.vertexAttribPointer(i, f.k, f.t, !!f.norm, paso, o); o += f.k * this.tam(f.t); });
    let ib = null;
    if (idx) { ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW); }
    gl.bindVertexArray(null);
    return { vao, vb, ib, n: idx ? idx.length : datos.byteLength / paso, paso, idx32: idx instanceof Uint32Array, nAtrib: formato.length };
  },
  // le suma a una malla un búfer de instancias (divisor 1) a partir del atributo nAtrib
  instancias(m, formato, capacidad) {
    gl.bindVertexArray(m.vao);
    const ib = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, ib);
    let paso = 0; for (const f of formato) paso += f.k * this.tam(f.t);
    gl.bufferData(gl.ARRAY_BUFFER, paso * capacidad, gl.DYNAMIC_DRAW);
    let o = 0;
    formato.forEach((f, i) => { const a = m.nAtrib + i; gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, f.k, f.t, !!f.norm, paso, o); gl.vertexAttribDivisor(a, 1); o += f.k * this.tam(f.t); });
    gl.bindVertexArray(null);
    m.inst = { b: ib, paso, cap: capacidad, datos: new Float32Array(paso / 4 * capacidad) };
    return m;
  },
  subir(m, n) { gl.bindBuffer(gl.ARRAY_BUFFER, m.inst.b); gl.bufferSubData(gl.ARRAY_BUFFER, 0, m.inst.datos, 0, n * m.inst.paso / 4); },
  borrarMalla(m) { if (!m) return; gl.deleteVertexArray(m.vao); gl.deleteBuffer(m.vb); if (m.ib) gl.deleteBuffer(m.ib); if (m.inst) gl.deleteBuffer(m.inst.b); },
  destinoSombra(n) {
    const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.DEPTH_COMPONENT24, n, n);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, t, 0);
    gl.drawBuffers([gl.NONE]); gl.readBuffer(gl.NONE);
    const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { fb, t, n, ok };
  },
  borrar(d) { if (!d) return; if (d.t) gl.deleteTexture(d.t); if (d.fb) gl.deleteFramebuffer(d.fb); },
};

// MANSION BUILDER — las texturas de los bloques, pintadas píxel a píxel con código (16×16, nada de afuera)
const TEX = { nombres: [], capa: {}, datos: null, color: {} };
(function armarTexturas() {
  const N = 16;
  // ruido de valor que se repite cada 16 píxeles (para manchas sin costuras)
  const ruidoT = (x, y, g, s) => {
    const p = N / g, xi = Math.floor(x / p), yi = Math.floor(y / p), fx = x / p - xi, fy = y / p - yi;
    const h = (a, b) => hash2(((a % g) + g) % g + s * 31, ((b % g) + g) % g + s * 17);
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const a = h(xi, yi), b = h(xi + 1, yi), c = h(xi, yi + 1), d = h(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
  const elegir = (pal, t) => pal[clamp(Math.floor(t * pal.length), 0, pal.length - 1)];
  const defs = [];
  const def = (n, f) => defs.push([n, f]);
  // pinta con una paleta según ruido + grano
  const manchas = (pal, g1, g2, gr, s) => (x, y, r) => { const t = ruidoT(x, y, g1, s) * 0.55 + ruidoT(x, y, g2, s + 3) * 0.3 + r() * gr; return [elegir(pal, t / (0.85 + gr)), 255]; };

  def('pasto_arriba', (x, y, r) => { const t = ruidoT(x, y, 4, 1) * 0.5 + r() * 0.6; return [elegir(['#4e9a2f', '#5aa837', '#63b33d', '#6cbd43', '#78c84b'], t / 1.1), 255]; });
  const tierraPal = ['#6f4a32', '#7c5238', '#87603f', '#966c48'];
  const tierra = (x, y, r) => { if (r() < 0.06) return [r() < 0.5 ? '#8f8a83' : '#5c3d29', 255]; const t = ruidoT(x, y, 4, 7) * 0.5 + r() * 0.5; return [elegir(tierraPal, t), 255]; };
  def('pasto_lado', (() => { const rr = rngSemilla(5), hondo = []; for (let x = 0; x < N; x++) hondo.push(2 + Math.floor(rr() * 3) + (x % 5 === 2 ? 1 : 0)); return (x, y, r) => { if (y < hondo[x]) return [elegir(['#5aa837', '#63b33d', '#6cbd43', '#4e9a2f'], r()), 255]; if (y === hondo[x]) return ['#3f7f26', 255]; return tierra(x, y, r); }; })());
  def('tierra', tierra);
  def('piedra', manchas(['#6e6e72', '#7a7a7e', '#86868a', '#919195', '#9c9ca0'], 4, 8, 0.35, 11));
  def('arena', manchas(['#d6c58a', '#dfcf95', '#e7d8a2', '#efe2b1'], 4, 8, 0.45, 13));
  def('grava', (() => { const rr = rngSemilla(17), m = []; for (let k = 0; k < 26; k++) m.push([Math.floor(rr() * N), Math.floor(rr() * N), elegir(['#9b958d', '#7d776f', '#8e7d6b', '#b1aba3', '#6a645d'], rr())]); return (x, y, r) => { for (const [a, b, c] of m) { const dx = ((x - a + 24) % N) - 8, dy = ((y - b + 24) % N) - 8; if (dx >= 0 && dx < 2 && dy >= 0 && dy < 2) return [dx === 0 && dy === 0 ? mezcla(c, '#ffffff', 0.2) : c, 255]; } return [elegir(['#6b665f', '#76716a', '#5f5a54'], r()), 255]; }; })());
  const corteza = (base, osc, cla, s) => { const rr = rngSemilla(s), cols = []; for (let x = 0; x < N; x++) cols.push(rr()); return (x, y, r) => { const c = cols[x], rr2 = hash2(x * 3 + s, Math.floor((y + c * 16) / 3)); if (c < 0.22 || rr2 < 0.12) return [osc, 255]; if (c > 0.82 && rr2 > 0.4) return [cla, 255]; return [r() < 0.25 ? mezcla(base, osc, 0.4) : base, 255]; }; };
  const anillos = (bar, a1, a2, s) => (x, y, r) => { if (x === 0 || y === 0 || x === N - 1 || y === N - 1) return [bar, 255]; const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5)) + (r() - 0.5) * 0.6; return [Math.floor(d) % 2 ? a1 : a2, 255]; };
  def('tronco_lado', corteza('#6e4c2c', '#523720', '#86613b', 21));
  def('tronco_arriba', anillos('#5e4127', '#b08a52', '#c6a065', 22));
  def('hojas', (x, y, r) => { const t = ruidoT(x, y, 8, 23) * 0.6 + r() * 0.55; if (r() < 0.05) return ['#7cc456', 255]; return [elegir(['#2c5f1e', '#36702a', '#3f7f2e', '#4a8f34', '#579c3b'], t / 1.15), 255]; });
  const tablas = (pal, seam, s) => { const rr = rngSemilla(s), cortes = [0, 1, 2, 3].map(() => Math.floor(rr() * N)), tono = [0, 1, 2, 3].map(() => rr() * 0.12 - 0.06); return (x, y, r) => { const fila = y >> 2, yy = y & 3; if (yy === 3) return [seam, 255]; if (x === cortes[fila] && fila % 2 === 0 || x === (cortes[fila] + 8) % N && fila % 2 === 1) return [seam, 255]; let c = pal[clamp(Math.floor((0.5 + tono[fila] + (r() - 0.5) * 0.35 + (yy === 0 ? 0.2 : 0)) * pal.length), 0, pal.length - 1)]; return [c, 255]; }; };
  def('tablas', tablas(['#9c7444', '#aa8150', '#b88e5c', '#c49b67'], '#6d4f2c', 31));
  def('adoquin', (() => { const rr = rngSemilla(41), sem = []; for (let k = 0; k < 10; k++) sem.push([rr() * N, rr() * N, elegir(['#8a8a8e', '#7b7b7f', '#97979b', '#a3a3a7'], rr())]); const cerca = (x, y) => { let d1 = 1e9, d2 = 1e9, c = null; for (const [a, b, col] of sem) for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) { const d = Math.hypot(x + 0.5 - a - ox * N, y + 0.5 - b - oy * N); if (d < d1) { d2 = d1; d1 = d; c = col; } else if (d < d2) d2 = d; } return [d2 - d1, c]; }; return (x, y, r) => { const [b, c] = cerca(x, y); if (b < 1.1) return ['#57575b', 255]; const [b2] = cerca(x - 1, y - 1); return [b2 < 1.1 ? mezcla(c, '#ffffff', 0.18) : (r() < 0.2 ? mezcla(c, '#000000', 0.08) : c), 255]; }; })());
  def('ladrillo_piedra', (x, y, r) => { const fila = y >> 3, yy = y & 7, xx = (x + (fila ? 8 : 0)) % N; if (yy === 7 || xx === 0) return ['#5b5b60', 255]; if (yy === 0 || xx === 1) return ['#a2a2a6', 255]; if (fila === 1 && xx > 9 && xx < 12 && yy === 4) return ['#6a6a6e', 255]; return [elegir(['#86868a', '#8e8e92', '#929296'], r()), 255]; });
  def('vidrio', (x, y, r) => { if (x === 0 || y === 0 || x === N - 1 || y === N - 1) return ['#e8f4ff', 235]; if ((x === 1 || y === 1) && x < 15 && y < 15) return ['#a8c8e0', 110]; if (x + y === 6 || x + y === 7 || x + y === 18) return ['#ffffff', 120]; return ['#cfe8ff', 30]; });
  const marmol = (x, y, r) => { const v = Math.abs(Math.sin((x * 0.55 + y * 0.9) + ruidoT(x, y, 4, 51) * 5)); if (v < 0.06) return ['#d7d1c7', 255]; return [elegir(['#ece8e0', '#f1eee7', '#f6f3ee', '#faf8f4'], ruidoT(x, y, 8, 52) * 0.6 + r() * 0.4), 255]; };
  def('cuarzo', marmol);
  def('cuarzo_pilar_lado', (x, y, r) => { if (x === 0 || x === N - 1) return ['#d6d0c4', 255]; if (x === 3 || x === 12) return ['#dcd6cb', 255]; if (x === 4 || x === 13) return ['#ffffff', 255]; return [elegir(['#ece8e0', '#f2efe8', '#f6f4ef'], r()), 255]; });
  def('cuarzo_pilar_arriba', (x, y, r) => { const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5)); if (d > 7) return ['#d6d0c4', 255]; if (Math.floor(d) === 4) return ['#dcd6cb', 255]; return [elegir(['#ece8e0', '#f2efe8', '#f6f4ef'], r()), 255]; });
  def('cuarzo_ladrillo', (x, y, r) => { const fila = y >> 3, yy = y & 7, xx = (x + (fila ? 8 : 0)) % N; if (yy === 7 || xx === 0) return ['#d3cdc1', 255]; if (yy === 0) return ['#ffffff', 255]; return [elegir(['#ece8e0', '#f1eee7', '#f5f2ec'], r()), 255]; });
  def('oro', (x, y, r) => { if (x === 0 || y === 0) return ['#fff1a0', 255]; if (x === N - 1 || y === N - 1) return ['#c98a12', 255]; if (r() < 0.04) return ['#ffffff', 255]; const t = ruidoT(x, y, 4, 61) * 0.5 + r() * 0.5; return [elegir(['#e8b223', '#f2c33a', '#f8d54e', '#fde27a'], t), 255]; });
  def('tablas_oscuras', tablas(['#3e2a1a', '#47301e', '#513823', '#5b4029'], '#2a1c11', 71));
  def('tronco_osc_lado', corteza('#3d2a1a', '#2a1c11', '#523a25', 72));
  def('tronco_osc_arriba', anillos('#2f2014', '#5b4029', '#6b4c31', 73));
  def('ladrillos', (x, y, r) => { const fila = y >> 2, yy = y & 3, xx = (x + (fila % 2 ? 4 : 0)) % 8; if (yy === 3 || xx === 7) return ['#c9bdaa', 255]; if (yy === 0 && r() < 0.5) return ['#c0604c', 255]; return [elegir(['#984234', '#a3493a', '#ad5240', '#b85a46'], hash2(Math.floor((x + (fila % 2 ? 4 : 0)) / 8), fila) * 0.7 + r() * 0.3), 255]; });
  def('pizarra', (x, y, r) => { const fila = y >> 2, yy = y & 3, xx = (x + (fila % 2 ? 2 : 0)) % 4; if (yy === 3) return ['#232a35', 255]; if (xx === 3 && yy > 0) return ['#2b3340', 255]; if (yy === 0) return ['#5f7088', 255]; return [elegir(['#3b4657', '#435064', '#4b5a70'], r()), 255]; });
  const lana = (base, s) => (x, y, r) => { const t = ((x + y) % 4 === 0 ? 0.1 : 0) + r() * 0.12 + ruidoT(x, y, 4, s) * 0.1; return [mezcla(base, t > 0.17 ? '#ffffff' : '#000000', Math.abs(t - 0.12) * 0.9), 255]; };
  def('lana_roja', lana('#b83a34', 81));
  def('lana_blanca', lana('#e9e9e4', 82));
  def('lana_azul', lana('#2f4ea8', 83));
  def('lana_negra', lana('#2a2a30', 84));
  def('lana_verde', lana('#4f7d2e', 85));
  def('lampara', (x, y, r) => { const t = ruidoT(x, y, 4, 91) * 0.5 + r() * 0.6; if (x % 5 === 0 || y % 5 === 0) return ['#b8762a', 255]; return [elegir(['#f2b34c', '#f8c860', '#fddc7c', '#fff0b0'], t / 1.1), 255]; });
  def('estanteria', (x, y, r) => { if (y < 2 || y > 13 || y === 7 || y === 8) return [y === 0 || y === 8 ? '#c49b67' : '#8d6a3f', 255]; if (x === 0 || x === N - 1) return ['#6d4f2c', 255]; const libro = Math.floor((x + (y > 8 ? 2 : 0)) / 2), c = ['#9b2f2f', '#2f5f9b', '#3d7d3a', '#c9a23a', '#6a3d8f', '#9b5f2f', '#2f8f8f'][libro % 7]; return [(x + (y > 8 ? 2 : 0)) % 2 === 1 ? mezcla(c, '#000000', 0.3) : c, 255]; });
  def('hierro', (x, y, r) => { if (x === 0 || y === 0) return ['#f4f4f6', 255]; if (x === N - 1 || y === N - 1) return ['#8a8a92', 255]; if ((x === 2 || x === 13) && (y === 2 || y === 13)) return ['#9a9aa2', 255]; return [elegir(['#cfcfd5', '#d8d8de', '#e0e0e5'], r()), 255]; });
  def('horno_frente', (x, y, r) => { if (x > 3 && x < 12 && y > 6 && y < 13) { if (y < 8) return ['#2a2a2e', 255]; const f = r(); return [f < 0.3 ? '#ffd23a' : f < 0.65 ? '#ff8a1f' : '#d8451c', 255]; } if (x > 2 && x < 13 && y > 5 && y < 14) return ['#3d3d42', 255]; const t = ruidoT(x, y, 4, 101) * 0.5 + r() * 0.5; return [elegir(['#6e6e72', '#7a7a7e', '#86868a', '#929296'], t), 255]; });
  def('horno_lado', manchas(['#6a6a6e', '#76767a', '#828286', '#8d8d91'], 4, 8, 0.4, 102));
  // plantas (en cruz, con transparencia)
  def('pasto_alto', (() => { const rr = rngSemilla(111), hojas = []; for (let k = 0; k < 9; k++) hojas.push([1 + Math.floor(rr() * 14), 6 + Math.floor(rr() * 9), rr() < 0.5 ? -1 : 1]); return (x, y, r) => { for (const [a, h, dir] of hojas) { const yy = 15 - y; if (yy < h) { const off = Math.round((yy / h) * (yy / h) * 2 * dir); if (x === a + off) return [yy > h - 3 ? '#7cc456' : yy > h * 0.5 ? '#5aa837' : '#3f7f26', 255]; } } return ['#000000', 0]; }; })());
  const flor = (pet, centro, s) => (x, y, r) => { const tallo = x === 7 || (x === 8 && y > 11); if (y >= 7 && tallo) return [y > 12 ? '#2f6b1f' : '#3f8a2a', 255]; if ((x === 5 || x === 9) && y === 11) return ['#4a9a32', 255]; const d = Math.hypot(x - 7.3, y - 4.5); if (d < 1.2) return [centro, 255]; if (d < 3.1 && (Math.abs(x - 7.3) + Math.abs(y - 4.5)) < 3.9) return [r() < 0.2 ? mezcla(pet, '#ffffff', 0.3) : pet, 255]; return ['#000000', 0]; };
  def('flor_roja', flor('#d8342c', '#2a1a10', 121));
  def('flor_amarilla', flor('#f6d32e', '#d0901c', 122));
  def('flor_azul', flor('#4a7bd8', '#f0f0ff', 123));
  def('flor_blanca', flor('#f4f4f0', '#f2c12e', 124));
  def('agua', manchas(['#2f6fc2', '#3478cc', '#3b82d6'], 4, 8, 0.4, 131));
  def('liso', (x, y, r) => { if (x === 0 || y === 0 || x === N - 1 || y === N - 1) return ['#9a9a9e', 255]; return [elegir(['#b7b7bb', '#bdbdc1', '#c3c3c7'], r()), 255]; });
  def('hormigon_negro', manchas(['#26282d', '#2b2d32', '#303237'], 4, 8, 0.5, 141));
  def('hormigon_amarillo', manchas(['#e2ae1c', '#e9b726', '#efc032'], 4, 8, 0.5, 142));
  def('terracota', manchas(['#a85a35', '#b4633c', '#bd6c43'], 4, 8, 0.5, 143));
  def('mineral_oro', (() => { const base = manchas(['#6e6e72', '#7a7a7e', '#86868a', '#919195'], 4, 8, 0.35, 151), rr = rngSemilla(152), v = []; for (let k = 0; k < 5; k++) v.push([2 + Math.floor(rr() * 11), 2 + Math.floor(rr() * 11)]); return (x, y, r) => { for (const [a, b] of v) { const dx = x - a, dy = y - b; if (dx >= 0 && dx < 3 && dy >= 0 && dy < 2 && !(dx === 2 && dy === 1)) return [dx === 0 && dy === 0 ? '#fff1a0' : dy === 1 ? '#c98a12' : '#f2c33a', 255]; } return base(x, y, r); }; })());
  def('billete_arriba', (x, y, r) => { if (y < 2 || y > 13) return ['#3f8a3a', 255]; if (x < 1 || x > 14) return ['#4f9a48', 255]; if (y === 2 || y === 13) return ['#2f6b2a', 255]; const d = Math.hypot(x - 7.5, y - 7.5); if (d < 2.6) return [d < 1.6 ? '#e8f4d8' : '#2f6b2a', 255]; return [(x + y) % 3 === 0 ? '#8fc87a' : '#7ab866', 255]; });
  def('billete_lado', (x, y, r) => { if (y % 4 === 3) return ['#2f6b2a', 255]; return [y % 4 === 0 ? '#e8f4d8' : (r() < 0.5 ? '#9fd08a' : '#8fc87a'), 255]; });
  def('caja', (x, y, r) => { if (x < 2 || y < 2 || x > 13 || y > 13) return [x === 0 || y === 0 ? '#c49b67' : '#6d4f2c', 255]; if (x === y || x === y + 1) return ['#8d6a3f', 255]; return tablas(['#9c7444', '#aa8150', '#b88e5c'], '#6d4f2c', 161)(x, y, r); });
  def('seto', (x, y, r) => { const t = ruidoT(x, y, 8, 171) * 0.6 + r() * 0.5; if (r() < 0.06) return ['#8fd06a', 255]; return [elegir(['#2f6a22', '#3a7b2b', '#458b33', '#529a3c', '#5fa846'], t / 1.1), 255]; });
  def('puerta_abajo', (x, y, r) => { if (x === 0 || x === N - 1 || y === N - 1) return ['#2a1c11', 255]; if ((x === 3 || x === 12) && y > 1 && y < 14 || (y === 2 || y === 13) && x > 2 && x < 13) return ['#3e2a1a', 255]; if (x === 12 && y === 1) return ['#2a1c11', 255]; if ((x === 11 || x === 10) && y === 4) return ['#e8c050', 255]; return [elegir(['#5b4029', '#634630', '#6b4c35'], r()), 255]; });
  def('puerta_arriba', (x, y, r) => { if (x === 0 || x === N - 1 || y === 0) return ['#2a1c11', 255]; if (x > 2 && x < 13 && y > 2 && y < 14) return x === 7 || x === 8 || y === 8 ? ['#3e2a1a', 255] : ['#a8d0ec', 255]; return [elegir(['#5b4029', '#634630', '#6b4c35'], r()), 255]; });
  def('heno_arriba', (x, y, r) => { const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5)); if (d > 6.8) return ['#a8892a', 255]; return [elegir(['#d6b33c', '#ccaa36', '#e0bf4a'], r()), 255]; });
  def('heno_lado', (x, y, r) => { if (y === 3 || y === 12) return ['#8a3a2a', 255]; return [elegir(['#d6b33c', '#ccaa36', '#e0bf4a', '#b8962e'], (x * 7 % 5) / 5 * 0.6 + r() * 0.4), 255]; });
  def('piedra_musgo', (x, y, r) => { const c = manchas(['#7b7b7f', '#86868a', '#919195'], 4, 8, 0.35, 181)(x, y, r); return ruidoT(x, y, 4, 182) > 0.62 ? [elegir(['#4f7d2e', '#5f8f36', '#6b9c3e'], r()), 255] : c; });
  def('cristal_azul', (x, y, r) => { if (x === 0 || y === 0 || x === N - 1 || y === N - 1) return ['#2f3f55', 255]; if (x + y === 6 || x + y === 7) return ['#ffffff', 150]; return ['#7ab8e8', 120]; });
  def('lana_amarilla', lana('#e8c330', 191));
  def('lana_marron', lana('#8a5a34', 192));
  def('lana_rosa', lana('#f08ab0', 193));
  def('lana_gris', lana('#8a8e96', 194));
  def('lana_naranja', lana('#e8822a', 195));
  def('lana_celeste', lana('#6cc4f0', 196));
  def('lana_violeta', lana('#8a52c8', 197));
  def('tejado_rojo', (x, y, r) => { const fila = y >> 2, yy = y & 3, xx = (x + (fila % 2 ? 2 : 0)) % 4; if (yy === 3) return ['#6a2219', 255]; if (xx === 3 && yy > 0) return ['#7d2a1f', 255]; if (yy === 0) return ['#d0644a', 255]; return [elegir(['#a63c2c', '#b04332', '#ba4b38'], r()), 255]; });

  const n = defs.length, datos = new Uint8Array(N * N * 4 * n);
  defs.forEach(([nom, f], i) => {
    const r = rngSemilla(i * 7919 + 13), base = i * N * N * 4;
    let sr = 0, sg = 0, sb = 0, cnt = 0;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const [c, a] = f(x, y, r), rgb = hexRgb(c), k = base + (y * N + x) * 4;
      datos[k] = rgb[0]; datos[k + 1] = rgb[1]; datos[k + 2] = rgb[2]; datos[k + 3] = a;
      if (a > 128) { sr += rgb[0]; sg += rgb[1]; sb += rgb[2]; cnt++; }
    }
    TEX.nombres.push(nom); TEX.capa[nom] = i;
    TEX.color[nom] = cnt ? [sr / cnt / 255, sg / cnt / 255, sb / cnt / 255] : [1, 1, 1];
  });
  TEX.datos = datos; TEX.n = n;
})();
// ruido grande que se repite: sombras de nubes y ondas del agua (64×64, canales distintos)
function texturaRuido() {
  const n = 64, d = new Uint8Array(n * n * 4);
  const oct = (x, y, g, s) => {
    let v = 0, a = 0.5, f = g;
    for (let o = 0; o < 4; o++) {
      const p = n / f, xi = Math.floor(x / p), yi = Math.floor(y / p), fx = x / p - xi, fy = y / p - yi, u = fx * fx * (3 - 2 * fx), w = fy * fy * (3 - 2 * fy);
      const h = (a2, b2) => hash2(((a2 % f) + f) % f + s * 13 + o * 101, ((b2 % f) + f) % f + s * 7 + o * 59);
      const A = h(xi, yi), B = h(xi + 1, yi), C = h(xi, yi + 1), D = h(xi + 1, yi + 1);
      v += a * (A + (B - A) * u + (C - A) * w + (A - B - C + D) * u * w); a *= 0.5; f *= 2;
    }
    return v / 0.9375;
  };
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const k = (y * n + x) * 4;
    d[k] = clamp(oct(x, y, 4, 1) * 255, 0, 255); d[k + 1] = clamp(oct(x, y, 8, 2) * 255, 0, 255);
    d[k + 2] = clamp(oct(x, y, 4, 3) * 255, 0, 255); d[k + 3] = clamp(oct(x, y, 2, 4) * 255, 0, 255);
  }
  return d;
}

// MANSION BUILDER — los tipos de bloque: qué textura va en cada cara y cómo se comporta
// f: [arriba, costado, abajo, frente(+z)?] · o: opaco · t: transparente · c: en cruz · l: losa · e: brilla · a: agua · m: material
const B = {};
const BLOQ = [];
(function armarBloques() {
  const L = n => TEX.capa[n];
  const def = (id, nom, caras, prop) => {
    const f = caras.map(L), p = Object.assign({ id, nom, f: [f[0], f[1] !== undefined ? f[1] : f[0], f[2] !== undefined ? f[2] : f[0], f[3] !== undefined ? f[3] : (f[1] !== undefined ? f[1] : f[0])], o: true, solido: true }, prop || {});
    if (p.t || p.c || p.l || p.a) p.o = false;
    if (p.c || p.a) p.solido = false;
    BLOQ[id] = p; B[nom] = id;
  };
  def(1, 'PIEDRA', ['piedra'], { m: 'piedra' });
  def(2, 'TIERRA', ['tierra']);
  def(3, 'PASTO', ['pasto_arriba', 'pasto_lado', 'tierra']);
  def(4, 'ARENA', ['arena']);
  def(5, 'AGUA', ['agua'], { a: true, t: true });
  def(6, 'GRAVA', ['grava'], { m: 'piedra' });
  def(7, 'TRONCO', ['tronco_arriba', 'tronco_lado', 'tronco_arriba'], { m: 'madera' });
  def(8, 'HOJAS', ['hojas']);
  def(9, 'TABLAS', ['tablas'], { m: 'madera' });
  def(10, 'ADOQUIN', ['adoquin'], { m: 'piedra' });
  def(11, 'LADRILLO_PIEDRA', ['ladrillo_piedra'], { m: 'piedra' });
  def(12, 'VIDRIO', ['vidrio'], { t: true, m: 'vidrio' });
  def(13, 'CUARZO', ['cuarzo'], { m: 'marmol' });
  def(14, 'PILAR', ['cuarzo_pilar_arriba', 'cuarzo_pilar_lado', 'cuarzo_pilar_arriba'], { m: 'marmol' });
  def(15, 'ORO', ['oro'], { m: 'oro', brillo: 0.25 });
  def(16, 'TABLAS_OSC', ['tablas_oscuras'], { m: 'madera' });
  def(17, 'TRONCO_OSC', ['tronco_osc_arriba', 'tronco_osc_lado', 'tronco_osc_arriba'], { m: 'madera' });
  def(18, 'LADRILLOS', ['ladrillos'], { m: 'piedra' });
  def(19, 'PIZARRA', ['pizarra'], { m: 'piedra' });
  def(20, 'LANA_ROJA', ['lana_roja']);
  def(21, 'LANA_BLANCA', ['lana_blanca']);
  def(22, 'LANA_AZUL', ['lana_azul']);
  def(23, 'LAMPARA', ['lampara'], { e: 1, m: 'vidrio' });
  def(24, 'ESTANTERIA', ['tablas', 'estanteria', 'tablas'], { m: 'madera' });
  def(25, 'HIERRO', ['hierro'], { m: 'piedra' });
  def(26, 'HORNO', ['horno_lado', 'horno_lado', 'horno_lado', 'horno_frente'], { m: 'piedra' });
  def(27, 'PASTO_ALTO', ['pasto_alto'], { c: true });
  def(28, 'FLOR_ROJA', ['flor_roja'], { c: true });
  def(29, 'FLOR_AMARILLA', ['flor_amarilla'], { c: true });
  def(30, 'FLOR_AZUL', ['flor_azul'], { c: true });
  def(31, 'FLOR_BLANCA', ['flor_blanca'], { c: true });
  def(32, 'LOSA_PIEDRA', ['ladrillo_piedra'], { l: true, m: 'piedra' });
  def(33, 'LOSA_CUARZO', ['cuarzo'], { l: true, m: 'marmol' });
  def(34, 'LOSA_TABLAS', ['tablas'], { l: true, m: 'madera' });
  def(35, 'LISO', ['liso'], { m: 'piedra' });
  def(36, 'HORM_NEGRO', ['hormigon_negro'], { m: 'piedra' });
  def(37, 'HORM_AMARILLO', ['hormigon_amarillo'], { m: 'piedra' });
  def(38, 'TERRACOTA', ['terracota'], { m: 'piedra' });
  def(39, 'MINERAL_ORO', ['mineral_oro'], { m: 'oro' });
  def(40, 'CAJA', ['caja'], { m: 'madera' });
  def(41, 'SETO', ['seto']);
  def(42, 'PUERTA_ABAJO', ['tablas_oscuras', 'tablas_oscuras', 'tablas_oscuras', 'puerta_abajo'], { m: 'madera' });
  def(43, 'PUERTA_ARRIBA', ['tablas_oscuras', 'tablas_oscuras', 'tablas_oscuras', 'puerta_arriba'], { m: 'madera' });
  def(44, 'HENO', ['heno_arriba', 'heno_lado', 'heno_arriba']);
  def(45, 'PIEDRA_MUSGO', ['piedra_musgo'], { m: 'piedra' });
  def(46, 'CRISTAL_AZUL', ['cristal_azul'], { t: true, m: 'vidrio' });
  def(47, 'LANA_NEGRA', ['lana_negra']);
  def(48, 'LANA_VERDE', ['lana_verde']);
  def(49, 'CUARZO_LADRILLO', ['cuarzo_ladrillo'], { m: 'marmol' });
  def(50, 'LANA_AMARILLA', ['lana_amarilla']);
  def(51, 'TEJADO_ROJO', ['tejado_rojo'], { m: 'piedra' });
  def(52, 'LOSA_PIZARRA', ['pizarra'], { l: true, m: 'piedra' });
  def(53, 'LOSA_TEJADO', ['tejado_rojo'], { l: true, m: 'piedra' });
  def(54, 'BILLETE', ['billete_arriba', 'billete_lado', 'billete_arriba']);
  def(55, 'LOSA_OSCURA', ['tablas_oscuras'], { l: true, m: 'madera' });
  def(56, 'LOSA_LISO', ['liso'], { l: true, m: 'piedra' });
  def(57, 'TRONCO_ACOSTADO', ['tronco_lado', 'tronco_lado', 'tronco_lado', 'tronco_arriba'], { m: 'madera' });
  def(58, 'LANA_MARRON', ['lana_marron']);
  def(59, 'LANA_ROSA', ['lana_rosa']);
  def(60, 'LANA_GRIS', ['lana_gris']);
  def(61, 'LANA_NARANJA', ['lana_naranja']);
  def(62, 'LANA_CELESTE', ['lana_celeste']);
  def(63, 'LANA_VIOLETA', ['lana_violeta']);
})();
// lo que se carga de cada material (el bloque que sale del generador)
const MATERIALES = ['madera', 'piedra', 'vidrio', 'marmol', 'oro'];
const BLOQUE_DE = { madera: B.TABLAS, piedra: B.LADRILLO_PIEDRA, vidrio: B.VIDRIO, marmol: B.CUARZO, oro: B.ORO };

// MANSION BUILDER — el mundo: una isla de bloques con playa, bosque, caminos y el terreno de la mansión
const MX = 48, MY = 40, MZ = 72, SUELO = 5;            // SUELO: la altura donde se camina (arriba del pasto)
const CH = 16;                                          // trozos de 16×16 columnas
const NCX = Math.ceil(MX / CH), NCZ = Math.ceil(MZ / CH);
const Mundo = {
  b: new Uint8Array(MX * MY * MZ),
  sucios: new Set(), cambio: 0, altoT: new Uint8Array(NCX * NCZ),
  dentro: (x, y, z) => x >= 0 && y >= 0 && z >= 0 && x < MX && y < MY && z < MZ,
  get(x, y, z) { return x >= 0 && y >= 0 && z >= 0 && x < MX && y < MY && z < MZ ? this.b[(y * MZ + z) * MX + x] : 0; },
  set(x, y, z, v) {
    if (!(x >= 0 && y >= 0 && z >= 0 && x < MX && y < MY && z < MZ)) return;
    const i = (y * MZ + z) * MX + x;
    if (this.b[i] === v) return;
    this.b[i] = v; this.cambio++;
    const cx = (x / CH) | 0, cz = (z / CH) | 0;
    if (v && y > this.altoT[cx + cz * NCX]) this.altoT[cx + cz * NCX] = y;
    this.sucios.add(cx + cz * NCX);
    const lx = x % CH, lz = z % CH;
    if (lx === 0 && cx > 0) this.sucios.add(cx - 1 + cz * NCX);
    if (lx === CH - 1 && cx < NCX - 1) this.sucios.add(cx + 1 + cz * NCX);
    if (lz === 0 && cz > 0) this.sucios.add(cx + (cz - 1) * NCX);
    if (lz === CH - 1 && cz < NCZ - 1) this.sucios.add(cx + (cz + 1) * NCX);
    if (y >= SUELO - 1 && y <= SUELO + 2) Paso.marcar(x, z);
  },
  caja(x0, y0, z0, x1, y1, z1, v) { for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) this.set(x, y, z, v); },
  opaco(x, y, z) { const v = this.get(x, y, z); return v ? BLOQ[v].o : false; },
};
// la isla: distancia con signo a un rectángulo redondeado, con la orilla ondulada
const ISLA = { x0: 4, x1: 43, z0: 4, z1: 67, r: 9 };
function distIsla(x, z) {
  const cx = (ISLA.x0 + ISLA.x1) / 2, cz = (ISLA.z0 + ISLA.z1) / 2, hx = (ISLA.x1 - ISLA.x0) / 2 - ISLA.r, hz = (ISLA.z1 - ISLA.z0) / 2 - ISLA.r;
  const qx = Math.abs(x + 0.5 - cx) - hx, qz = Math.abs(z + 0.5 - cz) - hz;
  const d = Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0) - ISLA.r;
  return d + (ruido2(x * 0.18, z * 0.18) - 0.5) * 3.2;
}
// los lugares del juego (centros en coordenadas del mundo)
const LUGAR = {
  inicio: [24, 49],
  obra: [24, 34.5],                    // donde se entregan los bloques para construir
  caja: [32.5, 35],                    // donde se junta la plata
  lote: [9, 6, 38, 31],                // terreno de la mansión (x0, z0, x1, z1)
  gen: {
    madera: { maq: [5, 38, 11, 42], pila: [8.5, 44.6], pad: [12.4, 44.6] },
    piedra: { maq: [36, 38, 42, 42], pila: [39.5, 44.6], pad: [35.6, 44.6] },
    vidrio: { maq: [5, 55, 11, 59], pila: [8.5, 61.6], pad: [12.4, 61.6] },
    marmol: { maq: [36, 55, 42, 59], pila: [39.5, 61.6], pad: [35.6, 61.6] },
    oro: { maq: [20, 62, 28, 65], pila: [24, 59.8], pad: [19.8, 59.4] },
  },
  ayudantes: { casa: [14, 50, 18, 54], pad: [16, 57] },
  mochila: [30.5, 52.5], zapatillas: [34, 52.5],
  muelle: [23, 66, 25, 71],
};
function generarMundo() {
  const W = Mundo;
  W.b.fill(0); W.altoT.fill(0);
  const r = rngSemilla(2024);
  for (let z = 0; z < MZ; z++) for (let x = 0; x < MX; x++) {
    const d = distIsla(x, z);
    W.set(x, 0, z, B.PIEDRA);
    if (d < -2.6) { W.caja(x, 1, z, x, 2, z, B.PIEDRA); W.set(x, 3, z, B.TIERRA); W.set(x, 4, z, B.PASTO); }
    else if (d < -1.2) { W.caja(x, 1, z, x, 3, z, B.ARENA); W.set(x, 4, z, B.ARENA); }
    else if (d < 0.2) { W.caja(x, 1, z, x, 3, z, B.ARENA); }
    else if (d < 3.5) { W.caja(x, 1, z, x, 2, z, B.ARENA); W.set(x, 3, z, B.AGUA); }
    else { W.set(x, 1, z, r() < 0.3 ? B.GRAVA : B.ARENA); W.caja(x, 2, z, x, 3, z, B.AGUA); }
  }
  const pasto = (x, z) => W.get(x, 4, z) === B.PASTO && !W.get(x, 5, z);
  const libre = (x, z, m) => { // lejos de las zonas de juego
    const [lx0, lz0, lx1, lz1] = LUGAR.lote; if (x >= lx0 - m && x <= lx1 + m && z >= lz0 - m && z <= lz1 + m) return false;
    for (const k in LUGAR.gen) { const g = LUGAR.gen[k], q = g.maq; if (x >= q[0] - m && x <= q[2] + m && z >= q[1] - m && z <= q[3] + m + 4) return false; }
    const zonas = [[LUGAR.obra, 4], [LUGAR.caja, 3], [LUGAR.inicio, 4], [LUGAR.ayudantes.pad, 3], [LUGAR.mochila, 2.5], [LUGAR.zapatillas, 2.5]];
    for (const k in LUGAR.gen) zonas.push([LUGAR.gen[k].pad, 2.2], [LUGAR.gen[k].pila, 2.4]);
    for (const [p, rr] of zonas) if (Math.hypot(x + 0.5 - p[0], z + 0.5 - p[1]) < rr + m) return false;
    const c = LUGAR.ayudantes.casa; if (x >= c[0] - m && x <= c[2] + m && z >= c[1] - m && z <= c[3] + m + 3) return false;
    if (Math.abs(x + 0.5 - 24) < 2.5 + m && z > 33) return false;   // camino central
    return true;
  };
  // caminos de grava y piedra lisa
  const camino = (x0, z0, x1, z1) => { for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++) for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) if (W.get(x, 4, z) === B.PASTO) W.set(x, 4, z, (x + z) % 7 === 0 ? B.GRAVA : B.LISO); };
  camino(23, 33, 25, 66);
  camino(9, 46, 22, 47); camino(26, 46, 39, 47);
  camino(9, 63, 22, 63); camino(26, 63, 39, 63);
  camino(8, 43, 9, 46); camino(39, 43, 40, 46);
  camino(26, 35, 31, 36);
  // muelle de tablas hacia el agua
  { const [x0, z0, x1, z1] = LUGAR.muelle; for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) { if (W.get(x, 4, z) !== B.PASTO && W.get(x, 4, z) !== B.LISO) W.set(x, 4, z, B.LOSA_TABLAS); } W.set(x0, 4, z1, B.TRONCO); W.set(x1, 4, z1, B.TRONCO); W.set(x0, 3, z1, B.TRONCO); W.set(x1, 3, z1, B.TRONCO); }
  // árboles: el bosque de la izquierda y sueltos por los bordes
  const arbol = (x, z, alto, osc) => {
    if (!pasto(x, z)) return false;
    const tr = osc ? B.TRONCO_OSC : B.TRONCO;
    for (let y = 5; y < 5 + alto; y++) W.set(x, y, z, tr);
    const top = 5 + alto;
    for (let y = top - 3; y <= top; y++) {
      const rad = y >= top ? 1 : y >= top - 1 ? 2 : 2;
      for (let dz = -rad; dz <= rad; dz++) for (let dx = -rad; dx <= rad; dx++) {
        if (Math.abs(dx) === rad && Math.abs(dz) === rad && (y >= top - 1 || r() < 0.6)) continue;
        if (!W.get(x + dx, y, z + dz)) W.set(x + dx, y, z + dz, B.HOJAS);
      }
    }
    return true;
  };
  for (let k = 0; k < 420; k++) {
    const x = 5 + Math.floor(r() * 38), z = 5 + Math.floor(r() * 61);
    const borde = distIsla(x, z) > -7, bosque = x < 13 && z > 43 && z < 56;
    if (!(borde || bosque) || !libre(x, z, 2)) continue;
    let cerca = false; for (let dz = -3; dz <= 3 && !cerca; dz++) for (let dx = -3; dx <= 3; dx++) if (W.get(x + dx, 5, z + dz) === B.TRONCO || W.get(x + dx, 5, z + dz) === B.TRONCO_OSC) { cerca = true; break; }
    if (cerca) continue;
    arbol(x, z, 4 + Math.floor(r() * 3), r() < 0.25);
  }
  // arbustos, rocas, flores y pasto alto
  for (let k = 0; k < 160; k++) {
    const x = 5 + Math.floor(r() * 38), z = 5 + Math.floor(r() * 61);
    if (!pasto(x, z) || !libre(x, z, 1)) continue;
    const q = r();
    if (q < 0.45) { W.set(x, 5, z, B.SETO); if (r() < 0.4 && pasto(x + 1, z)) W.set(x + 1, 5, z, B.SETO); if (r() < 0.3) W.set(x, 6, z, B.HOJAS); }
    else if (q < 0.7) { W.set(x, 5, z, r() < 0.5 ? B.PIEDRA_MUSGO : B.ADOQUIN); if (r() < 0.5 && pasto(x, z + 1)) W.set(x, 5, z + 1, B.PIEDRA); }
    else { W.set(x, 5, z, B.HENO); }
  }
  for (let z = 5; z < 67; z++) for (let x = 5; x < 43; x++) {
    if (!pasto(x, z)) continue;
    const n = ruido2(x * 0.22 + 7, z * 0.22 + 3), q = r();
    if (!libre(x, z, 0)) { if (q < 0.03 && n > 0.55) W.set(x, 5, z, B.PASTO_ALTO); continue; }
    if (n > 0.62 && q < 0.55) W.set(x, 5, z, [B.FLOR_ROJA, B.FLOR_AMARILLA, B.FLOR_AZUL, B.FLOR_BLANCA][Math.floor(hash2(x >> 2, z >> 2) * 4)]);
    else if (q < 0.22) W.set(x, 5, z, B.PASTO_ALTO);
  }
  // faroles a lo largo del camino central
  for (const z of [38, 44, 52, 58]) for (const x of [21, 27]) if (pasto(x, z)) { W.set(x, 5, z, B.TRONCO_OSC); W.set(x, 6, z, B.TRONCO_OSC); W.set(x, 7, z, B.LAMPARA); }
  // el lote de la mansión, liso y limpio
  { const [x0, z0, x1, z1] = LUGAR.lote; for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) { W.caja(x, 5, z, x, MY - 1, z, 0); if (W.get(x, 4, z) !== B.AGUA) W.set(x, 4, z, B.PASTO); } }
  // la casita de los ayudantes (cabaña de troncos)
  { const [x0, z0, x1, z1] = LUGAR.ayudantes.casa;
    for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
      const borde = x === x0 || x === x1 || z === z0 || z === z1, esq = (x === x0 || x === x1) && (z === z0 || z === z1);
      if (borde) for (let y = 5; y <= 7; y++) W.set(x, y, z, esq ? B.TRONCO : B.TABLAS);
    }
    W.set(16, 5, z1, B.PUERTA_ABAJO); W.set(16, 6, z1, B.PUERTA_ARRIBA); W.set(14, 6, z1, B.VIDRIO); W.set(18, 6, z1, B.VIDRIO);
    for (let y = 8; y <= 10; y++) { const k = y - 8; for (let z = z0 - 1 + k; z <= z1 + 1 - k; z++) for (let x = x0 - 1; x <= x1 + 1; x++) W.set(x, y, z, (z === z0 - 1 + k || z === z1 + 1 - k) ? B.LOSA_TEJADO : B.TEJADO_ROJO); }
  }
  W.sucios.clear(); for (let i = 0; i < NCX * NCZ; i++) W.sucios.add(i);
  Paso.recalcular();
}
function alturaPiso(x, z) { const v = Mundo.get(Math.floor(x), SUELO - 1, Math.floor(z)); return v && BLOQ[v].l ? SUELO - 0.5 : SUELO; }
// por dónde se puede caminar (1 = libre), a la altura del suelo
const Paso = {
  m: new Uint8Array(MX * MZ), version: 0,
  marcar(x, z) { if (x < 0 || z < 0 || x >= MX || z >= MZ) return; this.m[z * MX + x] = this.libreCelda(x, z) ? 1 : 0; this.version++; },
  libreCelda(x, z) {
    const piso = Mundo.get(x, SUELO - 1, z);
    if (!piso || piso === B.AGUA) return false;
    for (let y = SUELO; y <= SUELO + 1; y++) { const v = Mundo.get(x, y, z); if (v && (BLOQ[v].solido || BLOQ[v].a)) return false; }
    return true;
  },
  recalcular() { for (let z = 0; z < MZ; z++) for (let x = 0; x < MX; x++) this.m[z * MX + x] = this.libreCelda(x, z) ? 1 : 0; this.version++; },
  libre(x, z) { x = Math.floor(x); z = Math.floor(z); return x >= 0 && z >= 0 && x < MX && z < MZ && this.m[z * MX + x] === 1; },
};

// MANSION BUILDER — el mallado de los trozos: solo las caras que se ven, con sombra de esquina (AO) y losas
// vértice de 12 bytes: x,y,z (int16, en 1/16 de bloque) · u,v (texel) · capa · cara · ao/hondura · banderas
// banderas: 1 se mece (plantas) · 2 brilla · 4 orilla (espuma) · 8 superficie del agua
const CARA_N = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const CARA_V = [ // esquinas en orden antihorario visto de afuera: abajo-izq, abajo-der, arriba-der, arriba-izq
  [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]],
  [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]],
  [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]],
  [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]],
  [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]],
  [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]],
];
const CARA_UV = [[0, 16], [16, 16], [16, 0], [0, 0]];
// un armador de malla que crece solo (uno por pasada, reusado entre trozos)
class Armador {
  constructor(nq) { this.cap = 0; this.nv = 0; this.ni = 0; this.reservar(nq); }
  reservar(nq) {
    if (this.cap >= nq) return;
    this.cap = nq; this.v = new ArrayBuffer(nq * 4 * 12); this.i16 = new Int16Array(this.v); this.u8 = new Uint8Array(this.v); this.idx = new Uint32Array(nq * 6);
  }
  empezar() { this.nv = 0; this.ni = 0; }
  vert(x, y, z, u, v, capa, cara, ao, fl) {
    const k = this.nv * 12;
    if (k + 12 > this.v.byteLength) this.crecer();
    const s = k >> 1; this.i16[s] = Math.round(x * 16); this.i16[s + 1] = Math.round(y * 16); this.i16[s + 2] = Math.round(z * 16);
    const u8 = this.u8; u8[k + 6] = u; u8[k + 7] = v; u8[k + 8] = capa; u8[k + 9] = cara; u8[k + 10] = ao; u8[k + 11] = fl;
    return this.nv++;
  }
  crecer() { const viejo = this.u8, vi = this.idx, nq = this.cap * 2; this.cap = 0; this.reservar(nq); this.u8.set(viejo); this.idx.set(vi); }
  quad(a, b, c, d, girar) {
    if (this.ni + 6 > this.idx.length) this.crecer();
    const I = this.idx, n = this.ni;
    if (girar) { I[n] = b; I[n + 1] = c; I[n + 2] = d; I[n + 3] = b; I[n + 4] = d; I[n + 5] = a; }
    else { I[n] = a; I[n + 1] = b; I[n + 2] = c; I[n + 3] = a; I[n + 4] = c; I[n + 5] = d; }
    this.ni += 6;
  }
  sacar() { return this.ni ? { v: this.u8.slice(0, this.nv * 12), i: this.idx.slice(0, this.ni) } : null; }
}
const Malla = new Armador(1 << 14);
const PASADAS = { op: new Armador(1 << 14), cruz: new Armador(1 << 11), agua: new Armador(1 << 11), vidrio: new Armador(1 << 11) };
// sombra de esquina para el vértice (cx, cy, cz ∈ {0,1}) de la cara f del bloque (x,y,z)
function aoVert(op, x, y, z, f, cx, cy, cz) {
  const n = CARA_N[f], bx = x + n[0], by = y + n[1], bz = z + n[2];
  let d1x = 0, d1y = 0, d1z = 0, d2x = 0, d2y = 0, d2z = 0;
  if (n[0]) { d1y = cy ? 1 : -1; d2z = cz ? 1 : -1; } else if (n[1]) { d1x = cx ? 1 : -1; d2z = cz ? 1 : -1; } else { d1x = cx ? 1 : -1; d2y = cy ? 1 : -1; }
  const s1 = op(bx + d1x, by + d1y, bz + d1z) ? 1 : 0, s2 = op(bx + d2x, by + d2y, bz + d2z) ? 1 : 0;
  const c = op(bx + d1x + d2x, by + d1y + d2y, bz + d1z + d2z) ? 1 : 0;
  return s1 && s2 ? 0 : 3 - (s1 + s2 + c);
}
// una cara de bloque entero (o de losa con alto h)
function caraBloque(M, op, x, y, z, f, capa, fl, h, conAO) {
  const V = CARA_V[f], ao = [3, 3, 3, 3], idx = [0, 0, 0, 0];
  for (let k = 0; k < 4; k++) {
    const c = V[k];
    if (conAO) ao[k] = aoVert(op, x, y, z, f, c[0], c[1], c[2]);
    let vy = c[1], vv = CARA_UV[k][1];
    if (h < 1) { if (f === 2) vy = h; else if (f !== 3) { if (c[1] === 1) vy = h; vv = c[1] === 1 ? 16 - Math.round(h * 16) : 16; } }
    idx[k] = M.vert(x + c[0], y + vy, z + c[2], CARA_UV[k][0], vv, capa, f, ao[k], fl);
  }
  M.quad(idx[0], idx[1], idx[2], idx[3], ao[0] + ao[2] < ao[1] + ao[3]);
}
// planta en cruz: dos cuadros diagonales (se dibujan sin descarte de caras)
function caraCruz(M, x, y, z, capa, fl) {
  const s = 0.15, a = [[s, s, 1 - s, 1 - s], [s, 1 - s, 1 - s, s]];
  for (const [x0, z0, x1, z1] of a) {
    const i0 = M.vert(x + x0, y, z + z0, 0, 16, capa, 6, 3, fl & ~1), i1 = M.vert(x + x1, y, z + z1, 16, 16, capa, 6, 3, fl & ~1);
    const i2 = M.vert(x + x1, y + 1, z + z1, 16, 0, capa, 6, 3, fl | 1), i3 = M.vert(x + x0, y + 1, z + z0, 0, 0, capa, 6, 3, fl | 1);
    M.quad(i0, i1, i2, i3, false);
  }
}
const _op = (x, y, z) => Mundo.opaco(x, y, z);
// arma las cuatro mallas de un trozo (opaca, plantas, agua y vidrio) en una sola pasada
function mallarTrozo(cx, cz) {
  const T = PASADAS; T.op.empezar(); T.cruz.empezar(); T.agua.empezar(); T.vidrio.empezar();
  const x0 = cx * CH, z0 = cz * CH, x1 = Math.min(MX, x0 + CH), z1 = Math.min(MZ, z0 + CH);
  const b = Mundo.b, yTop = Math.min(MY, Mundo.altoT[cx + cz * NCX] + 1);
  for (let y = 0; y < yTop; y++) for (let z = z0; z < z1; z++) {
    let i = (y * MZ + z) * MX + x0;
    for (let x = x0; x < x1; x++, i++) {
      const v = b[i]; if (!v) continue;
      const P = BLOQ[v];
      if (P.c) { caraCruz(T.cruz, x, y, z, P.f[0], 0); continue; }
      if (P.a) { aguaCaras(T.agua, x, y, z, P); continue; }
      const M = P.t ? T.vidrio : T.op, fl = P.e ? 2 : 0, h = P.l ? 0.5 : 1, conAO = !P.t && !P.l;
      for (let f = 0; f < 6; f++) {
        const n = CARA_N[f], w = Mundo.get(x + n[0], y + n[1], z + n[2]);
        if (w) {
          const Q = BLOQ[w];
          if (Q.o && !(P.l && f === 2)) continue;
          if (P.t && w === v) continue;
          if (P.l && Q.l && f !== 2 && f !== 3) continue;
        } else if (y + n[1] < 0) continue;
        caraBloque(M, _op, x, y, z, f, f === 2 ? P.f[0] : f === 3 ? P.f[2] : f === 4 ? P.f[3] : P.f[1], fl, h, conAO);
      }
    }
  }
  return { op: T.op.sacar(), cruz: T.cruz.sacar(), agua: T.agua.sacar(), vidrio: T.vidrio.sacar() };
}
// el agua: solo la superficie (un poco más baja); hondura y espuma de orilla en el vértice
function aguaCaras(M, x, y, z, P) {
  const arriba = Mundo.get(x, y + 1, z);
  if (arriba === B.AGUA || (arriba && BLOQ[arriba].o)) return;
  let hondo = 0; for (let k = 1; k <= 3 && Mundo.get(x, y - k, z) === B.AGUA; k++) hondo++;
  let orilla = 0;
  for (let dz = -1; dz <= 1 && !orilla; dz++) for (let dx = -1; dx <= 1; dx++) { const w = Mundo.get(x + dx, y, z + dz); if (w && w !== B.AGUA && Mundo.dentro(x + dx, y, z + dz)) { orilla = 4; break; } }
  const h = arriba ? 1 : 0.875, V = CARA_V[2], idx = [];
  for (let k = 0; k < 4; k++) idx.push(M.vert(x + V[k][0], y + h, z + V[k][2], CARA_UV[k][0], CARA_UV[k][1], P.f[0], 2, hondo, 8 | orilla));
  M.quad(idx[0], idx[1], idx[2], idx[3], false);
}
// una malla suelta para un conjunto de bloques (el plano fantasma de la obra): caras hacia afuera del conjunto
function mallarConjunto(lista, ocupa) {
  const M = Malla; M.empezar();
  for (const [x, y, z, v] of lista) {
    const P = BLOQ[v];
    for (let f = 0; f < 6; f++) {
      const n = CARA_N[f];
      if (ocupa(x + n[0], y + n[1], z + n[2])) continue;
      caraBloque(M, null, x, y, z, f, P.f[f === 2 ? 0 : f === 3 ? 2 : 1], 0, P.l ? 0.5 : 1, false);
    }
  }
  return M.sacar();
}

// MANSION BUILDER — el render: bloques con sombra de esquina, sol con sombras, nubes que pasan, agua viva y niebla
const LUZ_GLSL = `
uniform vec3 uSolDir; uniform vec3 uSolCol; uniform vec3 uAmb; uniform vec3 uCielo;
uniform mat4 uSolVP; uniform sampler2DShadow uSombra; uniform float uConSombra;
uniform sampler2D uRuido; uniform float uT; uniform float uNubes;
uniform vec3 uCam; uniform vec3 uNiebla; uniform vec2 uNieblaD;
float sombra(vec3 p, vec3 n) {
  if (uConSombra < 0.5) return 1.0;
  vec4 s = uSolVP * vec4(p + n * 0.05, 1.0);
  vec3 q = s.xyz * 0.5 + 0.5;
  if (q.x <= 0.0 || q.y <= 0.0 || q.x >= 1.0 || q.y >= 1.0 || q.z >= 1.0) return 1.0;
  float d = q.z - 0.0012;
  vec2 tx = 0.75 / vec2(textureSize(uSombra, 0));
  float r = texture(uSombra, vec3(q.xy + vec2(-tx.x, -tx.y), d)) + texture(uSombra, vec3(q.xy + vec2(tx.x, -tx.y), d))
          + texture(uSombra, vec3(q.xy + vec2(-tx.x, tx.y), d)) + texture(uSombra, vec3(q.xy + vec2(tx.x, tx.y), d));
  return r * 0.25;
}
float nubes(vec3 p) {
  if (uNubes < 0.5) return 1.0;
  float n = texture(uRuido, p.xz * 0.016 + vec2(uT * 0.011, uT * 0.006)).r;
  return mix(1.0, 0.7, smoothstep(0.5, 0.7, n));
}
vec3 luz(vec3 base, vec3 n, vec3 p, float ao, float emis) {
  float ndl = max(dot(n, uSolDir), 0.0);
  float sh = sombra(p, n) * nubes(p);
  float aoF = 0.42 + 0.58 * ao;
  vec3 amb = mix(uAmb, uCielo, n.y * 0.5 + 0.5) * aoF;
  float relleno = max(dot(n, vec3(0.94, 0.29, -0.24)), 0.0) * aoF;
  vec3 c = base * (amb + uSolCol * ndl * sh * (0.6 + 0.4 * aoF) + vec3(0.26, 0.25, 0.22) * relleno);
  return mix(c, base * 1.25, emis);
}
vec3 niebla(vec3 c, vec3 p) { float d = distance(p, uCam); float f = 1.0 - exp(-max(d - uNieblaD.x, 0.0) * uNieblaD.y); return mix(c, uNiebla, clamp(f, 0.0, 1.0)); }
`;
const NORM_GLSL = `const vec3 NORM[7] = vec3[7](vec3(1,0,0), vec3(-1,0,0), vec3(0,1,0), vec3(0,-1,0), vec3(0,0,1), vec3(0,0,-1), vec3(0,1,0));`;
const VS_VOX = `
layout(location=0) in vec3 aPos; layout(location=1) in vec2 aUV; layout(location=2) in float aCapa;
layout(location=3) in float aCara; layout(location=4) in float aAO; layout(location=5) in float aFl;
uniform mat4 uVP; uniform float uT; uniform float uViento;
out vec3 vP; out vec2 vUV; flat out float vCapa; flat out int vCara; out float vAO; flat out int vFl;
void main() {
  vec3 p = aPos / 16.0;
  int fl = int(aFl + 0.5);
  if ((fl & 1) != 0) { float s = sin(uT * 2.1 + p.x * 0.9 + p.z * 0.7) + 0.5 * sin(uT * 3.3 + p.z * 1.3); p.x += s * 0.06 * uViento; p.z += s * 0.035 * uViento; }
  vP = p; vUV = aUV / 16.0; vCapa = aCapa; vCara = int(aCara + 0.5); vAO = aAO / 3.0; vFl = fl;
  gl_Position = uVP * vec4(p, 1.0);
}`;
const FS_VOX = `
uniform sampler2DArray uTex; uniform float uCorte;
in vec3 vP; in vec2 vUV; flat in float vCapa; flat in int vCara; in float vAO; flat in int vFl;
out vec4 o;
${NORM_GLSL}
${LUZ_GLSL}
void main() {
  vec4 t = texture(uTex, vec3(vUV, vCapa));
  if (t.a < uCorte) discard;
  vec3 n = NORM[vCara];
  float caraF = vCara == 2 ? 1.0 : vCara == 3 ? 0.6 : vCara == 6 ? 0.95 : (vCara == 4 ? 0.92 : 0.84);
  vec3 c = luz(t.rgb * caraF, n, vP, vCara == 6 ? 0.9 : vAO, (vFl & 2) != 0 ? 1.0 : 0.0);
  o = vec4(niebla(c, vP), 1.0);
}`;
const FS_VIDRIO = `
uniform sampler2DArray uTex;
in vec3 vP; in vec2 vUV; flat in float vCapa; flat in int vCara; in float vAO; flat in int vFl;
out vec4 o;
${NORM_GLSL}
${LUZ_GLSL}
void main() {
  vec4 t = texture(uTex, vec3(vUV, vCapa));
  vec3 n = NORM[vCara];
  vec3 v = normalize(uCam - vP);
  float fres = pow(1.0 - abs(dot(v, n)), 2.0);
  vec3 c = luz(t.rgb, n, vP, 1.0, 0.0) + uCielo * fres * 0.35;
  o = vec4(niebla(c, vP), clamp(t.a * 0.9 + fres * 0.25, 0.0, 1.0));
}`;
const FS_AGUA = `
in vec3 vP; in vec2 vUV; flat in float vCapa; flat in int vCara; in float vAO; flat in int vFl;
out vec4 o;
${LUZ_GLSL}
void main() {
  vec2 q = vP.xz;
  float n1 = texture(uRuido, q * 0.05 + vec2(uT * 0.018, uT * 0.011)).g;
  float n2 = texture(uRuido, q * 0.09 - vec2(uT * 0.014, -uT * 0.019)).g;
  float hondo = vAO;
  vec3 col = mix(vec3(0.30, 0.80, 0.84), vec3(0.09, 0.33, 0.64), clamp(hondo * 1.1 + 0.08, 0.0, 1.0));
  vec3 v = normalize(uCam - vP);
  vec3 nr = normalize(vec3((n1 - 0.5) * 0.9, 1.0, (n2 - 0.5) * 0.9));
  float fres = pow(1.0 - max(dot(v, nr), 0.0), 3.0);
  col = mix(col, uCielo * 1.05, fres * 0.55);
  float sp = pow(max(dot(reflect(-uSolDir, nr), v), 0.0), 48.0);
  col += uSolCol * sp * 0.9;
  float br = smoothstep(0.83, 0.93, (n1 + n2) * 0.5 + 0.06 * sin(uT * 2.7 + q.x * 1.3 + q.y));
  col += br * 0.3;
  if ((vFl & 4) != 0) col = mix(col, vec3(0.96, 0.98, 1.0), smoothstep(0.5, 0.7, n1 + 0.18 * sin(uT * 2.2 + q.x * 2.1 + q.y * 1.7)) * 0.7);
  col *= mix(0.72, 1.0, sombra(vP, vec3(0.0, 1.0, 0.0))) * mix(0.8, 1.0, nubes(vP));
  float a = mix(0.6, 0.9, clamp(hondo * 0.9 + fres, 0.0, 1.0));
  o = vec4(niebla(col, vP), a);
}`;
const VS_SOMBRA = `layout(location=0) in vec3 aPos; uniform mat4 uSolVP; void main() { gl_Position = uSolVP * vec4(aPos / 16.0, 1.0); }`;
const FS_SOMBRA = `out vec4 o; void main() { o = vec4(1.0); }`;
// cubos sueltos (instancias): lo que se carga, las pilas, la plata y los bloques que vuelan
const VS_CUBO = `
layout(location=0) in vec3 aPos; layout(location=1) in vec3 aN; layout(location=2) in vec2 aUV; layout(location=3) in float aCara;
layout(location=4) in vec3 iOff; layout(location=5) in float iEsc; layout(location=6) in float iRot; layout(location=7) in float iB;
uniform mat4 uVP; uniform vec4 uCaras[64];
out vec3 vP; out vec3 vN; out vec2 vUV; flat out float vCapa; flat out float vBrillo;
void main() {
  float c = cos(iRot), s = sin(iRot);
  vec3 e = iEsc < 0.0 ? vec3(-iEsc, -iEsc * 0.3, -iEsc * 0.56) : vec3(iEsc);
  vec3 p = aPos * e; p = vec3(p.x * c + p.z * s, p.y, -p.x * s + p.z * c);
  vN = vec3(aN.x * c + aN.z * s, aN.y, -aN.x * s + aN.z * c);
  vP = p + iOff; vUV = aUV;
  int b = int(iB + 0.5); vec4 f = uCaras[b & 63];
  int cara = int(aCara + 0.5);
  vCapa = cara == 0 ? f.x : cara == 2 ? f.z : cara == 3 ? f.w : f.y;
  vBrillo = float(b >> 6);
  gl_Position = uVP * vec4(vP, 1.0);
}`;
const FS_CUBO = `
uniform sampler2DArray uTex;
in vec3 vP; in vec3 vN; in vec2 vUV; flat in float vCapa; flat in float vBrillo;
out vec4 o;
${LUZ_GLSL}
void main() {
  vec4 t = texture(uTex, vec3(vUV, vCapa));
  if (t.a < 0.3) discard;
  float caraF = vN.y > 0.5 ? 1.0 : vN.y < -0.5 ? 0.6 : 0.88;
  vec3 c = luz(t.rgb * caraF, vN, vP, 1.0, 0.0);
  c = mix(c, vec3(1.0, 1.0, 0.85), vBrillo * 0.45);
  o = vec4(niebla(c, vP), 1.0);
}`;
// el plano fantasma de la obra: bloques celestes que muestran lo que falta
const FS_FANTASMA = `
in vec3 vP; in vec2 vUV; flat in float vCapa; flat in int vCara; in float vAO; flat in int vFl;
uniform float uT; uniform vec3 uColF;
out vec4 o;
void main() {
  vec2 e = min(vUV, 1.0 - vUV);
  float borde = 1.0 - smoothstep(0.03, 0.09, min(e.x, e.y));
  float barrido = smoothstep(0.0, 0.25, fract(vP.y * 0.25 - uT * 0.35)) * 0.12;
  o = vec4(uColF, 0.1 + barrido + borde * 0.55);
}`;
// partículas: cuadraditos que miran a la cámara
const VS_PART = `
layout(location=0) in vec2 aQ; layout(location=1) in vec4 iP; layout(location=2) in vec4 iC;
uniform mat4 uVP; uniform vec3 uDer; uniform vec3 uArr;
out vec4 vC; out vec2 vQ;
void main() { vec3 p = iP.xyz + (uDer * aQ.x + uArr * aQ.y) * iP.w; vC = iC; vQ = aQ; gl_Position = uVP * vec4(p, 1.0); }`;
const FS_PART = `
in vec4 vC; in vec2 vQ; out vec4 o;
void main() { float b = max(abs(vQ.x), abs(vQ.y)); vec3 c = b > 0.36 ? vC.rgb * 0.72 : vC.rgb; o = vec4(c, vC.a); }`;
// calcas en el piso: sombras de gota, zonas para desbloquear, la obra, la caja y los círculos de las pilas
const VS_CALCA = `
layout(location=0) in vec2 aQ; layout(location=1) in vec4 iA; layout(location=2) in vec4 iB;
uniform mat4 uVP;
out vec2 vQ; flat out vec4 vB; out vec2 vTam;
void main() { vec3 p = vec3(iA.x + aQ.x * iA.w * 0.5, iA.y, iA.z + aQ.y * iB.x * 0.5); vQ = aQ; vB = iB; vTam = vec2(iA.w, iB.x); gl_Position = uVP * vec4(p, 1.0); }`;
const FS_CALCA = `
in vec2 vQ; flat in vec4 vB; in vec2 vTam; uniform float uT; out vec4 o;
float caja(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
void main() {
  int k = int(vB.y + 0.5); float pr = vB.z;
  vec2 p = vQ * vTam * 0.5;
  if (k == 0) { float r = length(vQ); o = vec4(0.0, 0.0, 0.0, 0.32 * (1.0 - smoothstep(0.35, 1.0, r))); return; }
  float d = caja(p, vTam * 0.5 - 0.06, 0.32);
  if (d > 0.0) discard;
  float borde = smoothstep(-0.16, -0.1, d);
  float ang = atan(p.y, p.x), per = (abs(p.x) / (vTam.x * 0.5) > abs(p.y) / (vTam.y * 0.5)) ? p.y : p.x;
  if (k == 1) {
    float rayas = step(0.5, fract(per * 1.3 - uT * 0.6));
    float lleno = step(vQ.y * 0.5 + 0.5, pr);
    vec3 c = mix(vec3(0.12, 0.16, 0.22), vec3(0.36, 0.82, 0.36), lleno);
    float a = mix(0.42, 0.62, lleno);
    o = borde > 0.5 ? vec4(vec3(1.0), 0.95 * mix(0.55, 1.0, rayas)) : vec4(c, a);
  } else if (k == 2) {
    float rayas = step(0.5, fract((p.x + p.y) * 1.1 + uT * 0.5));
    vec3 cb = mix(vec3(0.12, 0.1, 0.08), vec3(1.0, 0.78, 0.16), rayas);
    float pulso = 0.32 + 0.12 * sin(uT * 4.0);
    o = borde > 0.5 ? vec4(cb, 0.95) : vec4(1.0, 0.86, 0.3, pulso);
  } else if (k == 3) {
    o = borde > 0.5 ? vec4(0.96, 1.0, 0.9, 0.95) : vec4(0.25, 0.7, 0.3, 0.42 + 0.08 * sin(uT * 3.0));
  } else if (k == 5) {
    float on = step(0.5, fract((p.x - p.y) * 0.9 - uT * 0.4));
    o = borde > 0.5 ? vec4(1.0, 1.0, 1.0, 0.95) : vec4(0.25, 0.55, 1.0, 0.36 + 0.14 * on + 0.06 * sin(uT * 3.0));
  } else {
    float r = length(vQ); float an = 1.0 - smoothstep(0.0, 0.08, abs(r - 0.86));
    o = vec4(1.0, 1.0, 1.0, an * (0.5 + 0.3 * sin(uT * 4.0 + vB.w)));
    if (r > 0.95) discard;
  }
}`;
// personajes de cajas con huesos (cabeza, cuerpo, brazos, piernas)
const VS_PJ = `
layout(location=0) in vec3 aPos; layout(location=1) in vec3 aN; layout(location=2) in vec2 aUV; layout(location=3) in float aH;
uniform mat4 uVP; uniform mat4 uH[8];
out vec3 vP; out vec3 vN; out vec2 vUV;
void main() { mat4 m = uH[int(aH + 0.5)]; vec4 p = m * vec4(aPos, 1.0); vP = p.xyz; vN = normalize(mat3(m) * aN); vUV = aUV; gl_Position = uVP * p; }`;
const FS_PJ = `
uniform sampler2DArray uPieles; uniform float uPiel; uniform float uDestello; uniform float uSilueta;
in vec3 vP; in vec3 vN; in vec2 vUV; out vec4 o;
${LUZ_GLSL}
void main() {
  vec4 t = texture(uPieles, vec3(vUV, uPiel));
  if (t.a < 0.5) discard;
  if (uSilueta > 0.5) { o = vec4(1.0, 0.84, 0.3, 0.6 - 0.25 * step(0.0, vN.y - 0.5)); return; }
  float caraF = vN.y > 0.5 ? 1.0 : vN.y < -0.5 ? 0.62 : 0.9;
  vec3 c = luz(t.rgb * caraF, vN, vP, 1.0, 0.0);
  c = mix(c, vec3(1.0), uDestello);
  o = vec4(niebla(c, vP), 1.0);
}`;

const R = {
  cv: null, cssW: 360, cssH: 640, dpr: 1, escala: 1, w: 1, h: 1,
  calidad: 2, conSombra: true, tamSombra: 2048, conNubes: true, viento: 1, maxPart: 600,
  V: M4.nueva(), P: M4.nueva(), VP: M4.nueva(), iVP: M4.nueva(), solVP: M4.nueva(),
  cam: [0, 0, 0], camDer: [1, 0, 0], camArr: [0, 1, 0],
  nieblaD: [34, 0.018], sol: [-0.45, 0.8, 0.5], solCol: [0.8, 0.74, 0.62], amb: [0.36, 0.4, 0.48], cielo: [0.46, 0.52, 0.62], niebla: [0.66, 0.82, 0.93],
  trozos: [], sombraSucia: true, ultimaSombra: -1, tex: null, ruido: null, pieles: null,
  stats: { dibujos: 0, tris: 0 },
  iniciar(cv) {
    this.cv = cv;
    if (!GL.iniciar(cv)) return false;
    this.pVox = GL.programa(VS_VOX, FS_VOX, 'vox');
    this.pVidrio = GL.programa(VS_VOX, FS_VIDRIO, 'vidrio');
    this.pAgua = GL.programa(VS_VOX, FS_AGUA, 'agua');
    this.pSombra = GL.programa(VS_SOMBRA, FS_SOMBRA, 'sombra');
    this.pCubo = GL.programa(VS_CUBO, FS_CUBO, 'cubo');
    this.pFant = GL.programa(VS_VOX, FS_FANTASMA, 'fantasma');
    this.pPart = GL.programa(VS_PART, FS_PART, 'part');
    this.pCalca = GL.programa(VS_CALCA, FS_CALCA, 'calca');
    this.pPJ = GL.programa(VS_PJ, FS_PJ, 'pj');
    this.tex = GL.texturaArreglo(16, 16, TEX.n, TEX.datos, true, true);
    this.ruido = GL.textura(64, 64, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, gl.LINEAR, texturaRuido(), true);
    this.cubo = this.mallaCubo();
    this.quadPart = GL.malla(new Float32Array([-0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5]), [{ k: 2, t: gl.FLOAT }], new Uint16Array([0, 1, 2, 0, 2, 3]));
    GL.instancias(this.quadPart, [{ k: 4, t: gl.FLOAT }, { k: 4, t: gl.FLOAT }], 1200);
    this.quadCalca = GL.malla(new Float32Array([-1, -1, 1, -1, 1, 1, -1, 1]), [{ k: 2, t: gl.FLOAT }], new Uint16Array([0, 1, 2, 0, 2, 3]));
    GL.instancias(this.quadCalca, [{ k: 4, t: gl.FLOAT }, { k: 4, t: gl.FLOAT }], 160);
    // las caras de cada bloque para los cubos sueltos
    this.caras = new Float32Array(64 * 4);
    for (let i = 0; i < 64; i++) { const P = BLOQ[i]; if (!P) continue; this.caras.set([P.f[0], P.f[1], P.f[2], P.f[3]], i * 4); }
    this.oceano = this.mallaOceano();
    for (let cz = 0; cz < NCZ; cz++) for (let cx = 0; cx < NCX; cx++) this.trozos.push({ cx, cz, op: null, cruz: null, agua: null, vidrio: null, y1: MY });
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK);
    this.ponerCalidad(this.calidad);
    return true;
  },
  // compila los shaders en tandas (para que la pantalla de carga no se congele)
  compilar() { for (const P of [this.pVox, this.pVidrio, this.pAgua, this.pSombra, this.pCubo, this.pFant, this.pPart, this.pCalca, this.pPJ]) GL.revisar(P); },
  mallaCubo() {
    const v = [], idx = [];
    // caras: 0 arriba, 1 costado, 2 abajo, 3 frente (+z)
    const caras = [[2, 0], [3, 2], [4, 3], [5, 1], [0, 1], [1, 1]];
    for (const [f, tipo] of caras) {
      const V = CARA_V[f], n = CARA_N[f], b = v.length / 9;
      for (let k = 0; k < 4; k++) v.push(V[k][0] - 0.5, V[k][1] - 0.5, V[k][2] - 0.5, n[0], n[1], n[2], CARA_UV[k][0] / 16, CARA_UV[k][1] / 16, tipo);
      idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    }
    const m = GL.malla(new Float32Array(v), [{ k: 3, t: gl.FLOAT }, { k: 3, t: gl.FLOAT }, { k: 2, t: gl.FLOAT }, { k: 1, t: gl.FLOAT }], new Uint16Array(idx));
    return GL.instancias(m, [{ k: 3, t: gl.FLOAT }, { k: 1, t: gl.FLOAT }, { k: 1, t: gl.FLOAT }, { k: 1, t: gl.FLOAT }], 1500);
  },
  // el mar alrededor de la grilla: un anillo de agua honda que llega al horizonte
  mallaOceano() {
    const M = Malla; M.empezar(); const y = 3.875, L = 400, capa = TEX.capa.agua;
    const rect = (x0, z0, x1, z1) => { const a = M.vert(x0, y, z1, 0, 0, capa, 2, 3, 8), b = M.vert(x1, y, z1, 0, 0, capa, 2, 3, 8), c = M.vert(x1, y, z0, 0, 0, capa, 2, 3, 8), d = M.vert(x0, y, z0, 0, 0, capa, 2, 3, 8); M.quad(a, b, c, d, false); };
    // en franjas para que la niebla y las olas se interpolen bien
    const paso = 16;
    for (let z = -L; z < MZ + L; z += paso) for (let x = -L; x < MX + L; x += paso) {
      const x1 = x + paso, z1 = z + paso;
      if (x1 > 0 && x < MX && z1 > 0 && z < MZ) {
        // recorta el hueco de la grilla
        if (x < 0) rect(x, z, 0, z1); if (x1 > MX) rect(MX, z, x1, z1);
        const ax = Math.max(x, 0), bx = Math.min(x1, MX);
        if (z < 0) rect(ax, z, bx, 0); if (z1 > MZ) rect(ax, MZ, bx, z1);
        continue;
      }
      rect(x, z, x1, z1);
    }
    const d = M.sacar();
    return this.mallaVox(d);
  },
  mallaVox(d) {
    return GL.malla(d.v, [{ k: 3, t: gl.SHORT }, { k: 2, t: gl.UNSIGNED_BYTE }, { k: 1, t: gl.UNSIGNED_BYTE }, { k: 1, t: gl.UNSIGNED_BYTE }, { k: 1, t: gl.UNSIGNED_BYTE }, { k: 1, t: gl.UNSIGNED_BYTE }], d.i);
  },
  ponerCalidad(n) {
    this.calidad = clamp(n, 0, 3);
    const q = [
      { esc: 0.6, sombra: 0, nubes: false, aniso: 1, part: 220, viento: 0.6 },
      { esc: 0.8, sombra: 1024, nubes: true, aniso: 2, part: 400, viento: 1 },
      { esc: 1, sombra: 2048, nubes: true, aniso: 4, part: 700, viento: 1 },
      { esc: 1, sombra: 2048, nubes: true, aniso: 8, part: 1100, viento: 1 },
    ][this.calidad];
    this.escala = q.esc; this.conNubes = q.nubes; this.maxPart = q.part; this.viento = q.viento;
    this.conSombra = q.sombra > 0;
    if (q.sombra && (!this.dSombra || this.dSombra.n !== q.sombra)) { GL.borrar(this.dSombra); this.dSombra = GL.destinoSombra(q.sombra); if (!this.dSombra.ok) { this.conSombra = false; } }
    this.sombraSucia = true;
    GL.anisotropia(this.tex, q.aniso);
    this.tamano(this.cssW, this.cssH, this.dpr);
  },
  tamano(cssW, cssH, dpr) {
    this.cssW = cssW; this.cssH = cssH; this.dpr = dpr;
    const tope = this.calidad >= 3 ? 3 : 2, k = Math.min(dpr, tope) * this.escala * (this.escalaDin || 1);
    const w = Math.max(1, Math.round(cssW * k)), h = Math.max(1, Math.round(cssH * k));
    if (this.cv.width !== w || this.cv.height !== h) { this.cv.width = w; this.cv.height = h; }
    this.cv.style.width = cssW + 'px'; this.cv.style.height = cssH + 'px';
    this.w = w; this.h = h;
  },
  // cámara de costado-arriba que sigue a un punto
  camara(tx, ty, tz, dist, pitch, yaw, fov) {
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    const ex = tx + Math.sin(yaw) * cp * dist, ey = ty + sp * dist, ez = tz + Math.cos(yaw) * cp * dist;
    this.cam[0] = ex; this.cam[1] = ey; this.cam[2] = ez;
    M4.mirar(this.V, ex, ey, ez, tx, ty, tz, 0, 1, 0);
    M4.persp(this.P, fov, this.w / this.h, 0.5, 520);
    M4.mul(this.VP, this.P, this.V);
    M4.inv(this.iVP, this.VP);
    const V = this.V; this.camDer = [V[0], V[4], V[8]]; this.camArr = [V[1], V[5], V[9]];
    this.planos = planosFrustum(this.VP);
  },
  // rehace los trozos sucios (pocos por cuadro para no trabar)
  actualizarTrozos(max) {
    let n = 0;
    for (const i of Mundo.sucios) {
      const T = this.trozos[i]; const m = mallarTrozo(T.cx, T.cz);
      for (const k of ['op', 'cruz', 'agua', 'vidrio']) { GL.borrarMalla(T[k]); T[k] = m[k] ? this.mallaVox(m[k]) : null; }
      Mundo.sucios.delete(i); this.sombraSucia = true;
      if (++n >= max) break;
    }
    return n;
  },
  calcularSol() {
    const s = this.sol, l = Math.hypot(s[0], s[1], s[2]), d = [s[0] / l, s[1] / l, s[2] / l];
    const c = [MX / 2, 10, MZ / 2], V = M4.nueva();
    M4.mirar(V, c[0] + d[0] * 80, c[1] + d[1] * 80, c[2] + d[2] * 80, c[0], c[1], c[2], 0, 1, 0);
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (const x of [0, MX]) for (const y of [0, 32]) for (const z of [0, MZ]) {
      const px = V[0] * x + V[4] * y + V[8] * z + V[12], py = V[1] * x + V[5] * y + V[9] * z + V[13], pz = V[2] * x + V[6] * y + V[10] * z + V[14];
      x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py); z0 = Math.min(z0, pz); z1 = Math.max(z1, pz);
    }
    const P = M4.orto(M4.nueva(), x0, x1, y0, y1, -z1 - 2, -z0 + 2);
    M4.mul(this.solVP, P, V);
    this.solN = d;
  },
  dibujarSombra(t) {
    if (!this.conSombra || !this.sombraSucia) return;
    if (t - this.ultimaSombra < 0.25 && this.ultimaSombra >= 0) return;
    this.ultimaSombra = t; this.sombraSucia = false;
    if (!this.solN) this.calcularSol();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.dSombra.fb);
    gl.viewport(0, 0, this.dSombra.n, this.dSombra.n);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    const u = GL.usar(this.pSombra);
    gl.uniformMatrix4fv(u.uSolVP, false, this.solVP);
    gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(1.5, 2);
    gl.disable(gl.CULL_FACE);
    for (const T of this.trozos) if (T.op) this.dibujarMalla(T.op);
    gl.enable(gl.CULL_FACE); gl.disable(gl.POLYGON_OFFSET_FILL);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  },
  dibujarMalla(m) { gl.bindVertexArray(m.vao); gl.drawElements(gl.TRIANGLES, m.n, m.idx32 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT, 0); this.stats.dibujos++; this.stats.tris += m.n / 3; },
  luzComun(u, t) {
    gl.uniform3fv(u.uSolDir, this.solN); gl.uniform3fv(u.uSolCol, this.solCol); gl.uniform3fv(u.uAmb, this.amb); gl.uniform3fv(u.uCielo, this.cielo);
    gl.uniformMatrix4fv(u.uSolVP, false, this.solVP); gl.uniform1f(u.uConSombra, this.conSombra ? 1 : 0);
    gl.uniform1f(u.uT, t); gl.uniform1f(u.uNubes, this.conNubes ? 1 : 0);
    gl.uniform3fv(u.uCam, this.cam); gl.uniform3fv(u.uNiebla, this.niebla); gl.uniform2f(u.uNieblaD, this.nieblaD[0], this.nieblaD[1]);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.conSombra ? this.dSombra.t : null); gl.uniform1i(u.uSombra, 1);
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, this.ruido); gl.uniform1i(u.uRuido, 2);
    if (u.uVP) gl.uniformMatrix4fv(u.uVP, false, this.VP);
  },
  visible(T) {
    const x0 = T.cx * CH, z0 = T.cz * CH;
    return cajaEnFrustum(this.planos, x0, 0, z0, x0 + CH, T.y1, z0 + CH);
  },
  // un cuadro entero: E trae personajes, cubos, calcas, partículas y el fantasma
  dibujar(E, t) {
    this.stats.dibujos = 0; this.stats.tris = 0;
    if (!this.solN) this.calcularSol();
    if (!this.conSombra) {
      // sin sombras igual hace falta una textura de comparación válida en la unidad
      if (!this.dSombraVacia) this.dSombraVacia = GL.destinoSombra(16);
    }
    this.dibujarSombra(t);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.w, this.h);
    gl.clearColor(this.niebla[0], this.niebla[1], this.niebla[2], 1);
    gl.depthMask(true); gl.disable(gl.BLEND);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const sombraTex = this.conSombra ? this.dSombra : this.dSombraVacia;
    const prep = (P) => { const u = GL.usar(P); this.luzComun(u, t); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, sombraTex.t); return u; };
    // 1) bloques opacos
    let u = prep(this.pVox);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.tex); gl.uniform1i(u.uTex, 0);
    gl.uniform1f(u.uViento, this.viento); gl.uniform1f(u.uCorte, -1);
    const vis = this.trozos.filter(T => this.visible(T));
    for (const T of vis) if (T.op) this.dibujarMalla(T.op);
    // 2) plantas (con recorte, sin descartar caras)
    gl.uniform1f(u.uCorte, 0.5); gl.disable(gl.CULL_FACE);
    for (const T of vis) if (T.cruz) this.dibujarMalla(T.cruz);
    gl.enable(gl.CULL_FACE);
    // 3) personajes
    if (E.personajes && E.personajes.length) this.dibujarPersonajes(E.personajes, t, prep);
    // 4) cubos sueltos
    if (E.nCubos) {
      u = prep(this.pCubo);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.tex); gl.uniform1i(u.uTex, 0);
      gl.uniform4fv(u.uCaras, this.caras);
      GL.subir(this.cubo, E.nCubos);
      gl.bindVertexArray(this.cubo.vao); gl.drawElementsInstanced(gl.TRIANGLES, this.cubo.n, gl.UNSIGNED_SHORT, 0, E.nCubos); this.stats.dibujos++;
    }
    // 5) calcas del piso
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
    if (E.nCalcas) {
      u = GL.usar(this.pCalca); gl.uniformMatrix4fv(u.uVP, false, this.VP); gl.uniform1f(u.uT, t);
      gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(-2, -4); gl.disable(gl.CULL_FACE);
      GL.subir(this.quadCalca, E.nCalcas);
      gl.bindVertexArray(this.quadCalca.vao); gl.drawElementsInstanced(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0, E.nCalcas); this.stats.dibujos++;
      gl.disable(gl.POLYGON_OFFSET_FILL); gl.enable(gl.CULL_FACE);
    }
    // 6) agua (mar + islas) y vidrio, de atrás para adelante
    u = prep(this.pAgua);
    this.dibujarMalla(this.oceano);
    const orden = vis.slice().sort((a, b) => dist2T(b, this.cam) - dist2T(a, this.cam));
    for (const T of orden) if (T.agua) this.dibujarMalla(T.agua);
    u = prep(this.pVidrio);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.tex); gl.uniform1i(u.uTex, 0);
    gl.disable(gl.CULL_FACE);
    for (const T of orden) if (T.vidrio) this.dibujarMalla(T.vidrio);
    gl.enable(gl.CULL_FACE);
    // 7) el fantasma de la obra
    if (E.fantasma) {
      u = GL.usar(this.pFant); gl.uniformMatrix4fv(u.uVP, false, this.VP); gl.uniform1f(u.uT, t); gl.uniform3fv(u.uColF, E.colFantasma || [0.45, 0.85, 1.0]);
      gl.uniform1f(u.uViento, 0);
      this.dibujarMalla(E.fantasma);
    }
    // 8) partículas
    if (E.nPart) {
      u = GL.usar(this.pPart); gl.uniformMatrix4fv(u.uVP, false, this.VP); gl.uniform3fv(u.uDer, this.camDer); gl.uniform3fv(u.uArr, this.camArr);
      GL.subir(this.quadPart, E.nPart);
      gl.bindVertexArray(this.quadPart.vao); gl.drawElementsInstanced(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0, E.nPart); this.stats.dibujos++;
    }
    // la silueta del constructor cuando lo tapa algo
    if (E.personajes && E.personajes.length) {
      const p = E.personajes[0], u2 = GL.usar(this.pPJ);
      gl.depthFunc(gl.GREATER);
      gl.uniformMatrix4fv(u2.uVP, false, this.VP); gl.uniformMatrix4fv(u2.uH, false, p.huesos); gl.uniform1f(u2.uPiel, p.piel); gl.uniform1f(u2.uSilueta, 1);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.pieles); gl.uniform1i(u2.uPieles, 0);
      this.dibujarMalla(p.malla);
      gl.uniform1f(u2.uSilueta, 0); gl.depthFunc(gl.LEQUAL);
    }
    gl.depthMask(true); gl.disable(gl.BLEND);
    gl.bindVertexArray(null);
  },
  dibujarPersonajes(lista, t, prep) {
    const u = prep(this.pPJ);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.pieles); gl.uniform1i(u.uPieles, 0);
    for (const p of lista) {
      if (!cajaEnFrustum(this.planos, p.x - 1.2, SUELO - 0.2, p.z - 1.2, p.x + 1.2, SUELO + 3, p.z + 1.2)) continue;
      gl.uniformMatrix4fv(u.uH, false, p.huesos);
      gl.uniform1f(u.uPiel, p.piel); gl.uniform1f(u.uDestello, p.destello || 0);
      this.dibujarMalla(p.malla);
    }
  },
};
function dist2T(T, c) { const x = T.cx * CH + CH / 2 - c[0], z = T.cz * CH + CH / 2 - c[2]; return x * x + z * z; }
// los seis planos del frustum (para no dibujar trozos fuera de cámara)
function planosFrustum(m) {
  const p = [], f = (a, b, c, d) => { const l = Math.hypot(a, b, c); p.push([a / l, b / l, c / l, d / l]); };
  f(m[3] + m[0], m[7] + m[4], m[11] + m[8], m[15] + m[12]); f(m[3] - m[0], m[7] - m[4], m[11] - m[8], m[15] - m[12]);
  f(m[3] + m[1], m[7] + m[5], m[11] + m[9], m[15] + m[13]); f(m[3] - m[1], m[7] - m[5], m[11] - m[9], m[15] - m[13]);
  f(m[3] + m[2], m[7] + m[6], m[11] + m[10], m[15] + m[14]); f(m[3] - m[2], m[7] - m[6], m[11] - m[10], m[15] - m[14]);
  return p;
}
function cajaEnFrustum(P, x0, y0, z0, x1, y1, z1) {
  for (const [a, b, c, d] of P) if (a * (a > 0 ? x1 : x0) + b * (b > 0 ? y1 : y0) + c * (c > 0 ? z1 : z0) + d < 0) return false;
  return true;
}

// MANSION BUILDER — los personajes: cajas con piel pintada (64×64) y seis huesos (cuerpo, cabeza, brazos, piernas)
// medidas en píxeles de piel (1 px = 1/16 de bloque); mira hacia +z
const PJ = {
  partes: [ // [x0,y0,z0, x1,y1,z1, u0,v0, w,h,d, hueso, inflar, pivote]
    [-4, 12, -2, 4, 24, 2, 16, 16, 8, 12, 4, 0, 0, [0, 12, 0]],      // cuerpo
    [-4, 24, -4, 4, 32, 4, 0, 0, 8, 8, 8, 1, 0, [0, 24, 0]],         // cabeza
    [-4, 24, -4, 4, 32, 4, 32, 0, 8, 8, 8, 1, 0.55, [0, 24, 0]],     // casco / gorra (capa de arriba)
    [-8, 12, -2, -4, 24, 2, 40, 16, 4, 12, 4, 2, 0, [-6, 22, 0]],    // brazo derecho
    [4, 12, -2, 8, 24, 2, 32, 48, 4, 12, 4, 3, 0, [6, 22, 0]],       // brazo izquierdo
    [-4, 0, -2, 0, 12, 2, 0, 16, 4, 12, 4, 4, 0, [-2, 12, 0]],       // pierna derecha
    [0, 0, -2, 4, 12, 2, 16, 48, 4, 12, 4, 5, 0, [2, 12, 0]],        // pierna izquierda
  ],
  malla: null, pieles: [], nPieles: 0,
};
// los rectángulos de cada cara en la piel: [u, v, ancho, alto] por cara (+x, -x, +y, -y, +z, -z)
function rectsCaja(u0, v0, w, h, d) {
  return [[u0 + d + w, v0 + d, d, h], [u0, v0 + d, d, h], [u0 + d, v0, w, d], [u0 + d + w, v0, w, d], [u0 + d, v0 + d, w, h], [u0 + 2 * d + w, v0 + d, w, h]];
}
function mallaPersonaje() {
  const v = [], idx = [];
  for (const [x0, y0, z0, x1, y1, z1, u0, v0, w, h, d, hueso, inf] of PJ.partes) {
    const R = rectsCaja(u0, v0, w, h, d), a = [x0 - inf, y0 - inf, z0 - inf], b = [x1 + inf, y1 + inf, z1 + inf];
    for (let f = 0; f < 6; f++) {
      const V = CARA_V[f], n = CARA_N[f], [ru, rv, rw, rh] = R[f], base = v.length / 9;
      const uv = [[ru, rv + rh], [ru + rw, rv + rh], [ru + rw, rv], [ru, rv]];
      for (let k = 0; k < 4; k++) {
        const c = V[k];
        v.push(c[0] ? b[0] : a[0], c[1] ? b[1] : a[1], c[2] ? b[2] : a[2], n[0], n[1], n[2], uv[k][0] / 64, uv[k][1] / 64, hueso);
      }
      idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  }
  return GL.malla(new Float32Array(v), [{ k: 3, t: gl.FLOAT }, { k: 3, t: gl.FLOAT }, { k: 2, t: gl.FLOAT }, { k: 1, t: gl.FLOAT }], new Uint16Array(idx));
}
// ---------- las pieles, pintadas a mano con código ----------
const PIELES = {};
function armarPieles() {
  const defs = [];
  const tonos = ['#f2c9a0', '#e0ac7e', '#c58c5c', '#8d5a3b', '#6a4129'];
  const pelos = ['#3a2414', '#6b4423', '#1f1a17', '#c9a050', '#8a3a1e', '#d8d0c0'];
  // pinta una piel a partir de una descripción
  const pintar = (o) => {
    const N = 64, d = new Uint8Array(N * N * 4);
    const px = (x, y, c, a) => { if (x < 0 || y < 0 || x >= N || y >= N || !c) return; const rgb = hexRgb(c), k = (y * N + x) * 4; d[k] = rgb[0]; d[k + 1] = rgb[1]; d[k + 2] = rgb[2]; d[k + 3] = a == null ? 255 : a; };
    const r = rngSemilla(o.semilla || 1);
    const ruido = (c, k) => r() < k ? mezcla(c, '#000000', 0.08) : r() < k ? mezcla(c, '#ffffff', 0.08) : c;
    // recorre las caras de una parte llamando f(cara, x, y, w, h)
    const parte = (i, f) => { const p = PJ.partes[i], R = rectsCaja(p[6], p[7], p[8], p[9], p[10]); R.forEach(([ru, rv, rw, rh], cara) => { for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) { const c = f(cara, x, y, rw, rh); if (c) { if (typeof c === "string") px(ru + x, rv + y, c); else px(ru + x, rv + y, c[0], c[1]); } } }); };
    const piel = o.piel, pelo = o.pelo;
    // cabeza
    parte(1, (cara, x, y) => {
      if (cara === 2) return ruido(pelo, 0.2);
      if (cara === 3) return piel;
      if (cara === 5) return y < 6 ? ruido(pelo, 0.2) : piel;
      if (cara === 0 || cara === 1) return y < 2 || (y < 4 && (cara === 0 ? x > 4 : x < 3)) ? ruido(pelo, 0.2) : (y === 4 && (cara === 0 ? x === 4 : x === 3) ? mezcla(piel, '#000000', 0.15) : piel);
      // cara de frente
      if (y < 2) return ruido(pelo, 0.2);
      if (y === 2) return x === 0 || x === 7 ? pelo : piel;
      if (y === 3) return (x === 1 || x === 2 || x === 5 || x === 6) ? mezcla(pelo, '#000000', 0.2) : piel;
      if (o.parche && (y === 3 || (y === 4 && (x === 1 || x === 2)))) return '#111111';
      if (y === 4) { if (o.lentes) return x >= 1 && x <= 6 ? (x === 3 || x === 4 ? '#222222' : '#111111') : piel; return x === 1 || x === 6 ? '#ffffff' : x === 2 || x === 5 ? o.ojos || '#3a2a1a' : piel; }
      if (y === 5) return x === 3 || x === 4 ? mezcla(piel, '#000000', 0.14) : piel;
      if (y === 6) return x >= 3 && x <= 4 ? '#7a3a2a' : (o.barba ? mezcla(pelo, piel, 0.3) : piel);
      return o.barba ? mezcla(pelo, piel, 0.2) : piel;
    });
    // casco, gorra o sombrero (capa de arriba, con transparencia)
    if (o.gorro && o.gorro.f) parte(2, o.gorro.f);
    else if (o.gorro) parte(2, (cara, x, y, w, h) => {
      const c = o.gorro.c, c2 = mezcla(c, '#000000', 0.22), c3 = mezcla(c, '#ffffff', 0.3);
      if (cara === 2) return x === 0 || x === w - 1 || y === 0 || y === h - 1 ? c2 : (o.gorro.tipo === 'casco' && (x === 3 || x === 4) ? c3 : c);
      if (cara === 3) return null;
      const alto = o.gorro.tipo === 'sombrero' ? 2 : 3;
      if (y < alto) return y === 0 ? c3 : (y === alto - 1 ? c2 : c);
      return null;
    });
    // cuerpo
    parte(0, (cara, x, y, w, h) => {
      if (cara === 2 || cara === 3) return o.cuerpo(cara, x, y, w, h, r);
      return o.cuerpo(cara, x, y, w, h, r);
    });
    // brazos
    for (const i of [3, 4]) parte(i, (cara, x, y, w, h) => {
      if (cara === 2) return o.manga || o.camisa;
      if (cara === 3) return o.guante || piel;
      if (y < o.largoManga) return ruido(o.manga || o.camisa, 0.15);
      if (o.guante && y >= 10) return o.guante;
      return piel;
    });
    // piernas
    for (const i of [5, 6]) parte(i, (cara, x, y, w, h) => {
      if (cara === 2) return o.pantalon;
      if (cara === 3) return mezcla(o.zapato, '#000000', 0.3);
      if (y >= 9) return y === 11 ? mezcla(o.zapato, '#000000', 0.25) : o.zapato;
      if (o.corto && y >= 4) return o.piel;
      if (o.pantalonF) { const pc = o.pantalonF(cara, x, y); if (pc) return pc; }
      const c = (cara === 0 || cara === 1) && x === 1 ? mezcla(o.pantalon, '#000000', 0.15) : o.pantalon;
      return ruido(c, 0.18);
    });
    return d;
  };
  // el constructor: casco amarillo, chaleco naranja con cintas, jean y botas
  defs.push(['jugador', {
    semilla: 3, piel: tonos[1], pelo: '#5a3418', ojos: '#2a3a6a',
    gorro: { c: '#f2c230', tipo: 'casco' }, camisa: '#d8d8d8', manga: '#d8d8d8', largoManga: 4, guante: '#a0682a',
    pantalon: '#3a5aa6', zapato: '#6b4423',
    cuerpo: (cara, x, y, w, h) => {
      if (y === 11) return '#5a3a20';
      if (cara === 4 || cara === 5) { if (cara === 4 && (x === 0 || x === 7) && y < 4) return '#d8d8d8'; if (y === 5 || y === 8) return '#eef2f4'; if (cara === 4 && (x === 3 || x === 4) && y > 1) return x === 3 ? '#d86a18' : '#f08a30'; return '#f07a20'; }
      if (y === 5 || y === 8) return '#eef2f4';
      return cara === 2 ? '#f07a20' : '#e8701c';
    },
  }]);
  // ayudantes: mameluco azul con tiradores y gorra roja / verde
  const ayudante = (sem, piel, pelo, gorra, camisa) => ({
    semilla: sem, piel, pelo, gorro: { c: gorra, tipo: 'gorra' }, camisa, manga: camisa, largoManga: 5, pantalon: '#2f5fb0', zapato: '#3a2a1a', barba: sem % 2 === 0,
    cuerpo: (cara, x, y) => {
      if ((cara === 4 || cara === 5) && y < 4) return (x === 1 || x === 6) ? '#2f5fb0' : camisa;
      if (y < 4) return camisa;
      if (cara === 4 && y === 5 && (x === 1 || x === 6)) return '#e8c050';
      if (cara === 4 && y >= 6 && y <= 8 && x >= 2 && x <= 5) return y === 6 ? '#24508f' : '#2a58a0';
      return '#2f5fb0';
    },
  });
  defs.push(['ayudante1', ayudante(11, tonos[2], '#2a1a10', '#d23a2a', '#e8c84a')]);
  defs.push(['ayudante2', ayudante(12, tonos[0], '#c9a050', '#3a8a3a', '#f0f0f0')]);
  defs.push(['ayudante3', ayudante(13, tonos[3], '#1f1a17', '#2a6ad2', '#e8884a')]);
  // visitantes de colores
  const camisas = ['#e05a5a', '#5aa0e0', '#f0c040', '#9a5ad0', '#4ab88a', '#f08aa8', '#ffffff', '#e08a3a'];
  for (let k = 0; k < 6; k++) {
    const rr = rngSemilla(100 + k), cam = camisas[Math.floor(rr() * camisas.length)], corto = rr() < 0.5, raya = rr() < 0.5;
    defs.push(['visitante' + (k + 1), {
      semilla: 50 + k, piel: tonos[Math.floor(rr() * tonos.length)], pelo: pelos[Math.floor(rr() * pelos.length)], lentes: rr() < 0.4,
      gorro: rr() < 0.35 ? { c: '#d8b878', tipo: 'sombrero' } : null, camisa: cam, manga: cam, largoManga: corto ? 3 : 6,
      pantalon: corto ? ['#e8dcc0', '#5a7a4a', '#3a5aa6'][Math.floor(rr() * 3)] : ['#3a5aa6', '#2a2a30', '#6a5040'][Math.floor(rr() * 3)], corto, zapato: ['#f0f0f0', '#3a2a1a', '#d23a2a'][Math.floor(rr() * 3)],
      cuerpo: (cara, x, y) => (raya && y % 3 === 0 ? mezcla(cam, '#ffffff', 0.45) : (cara === 4 && y < 2 && x > 2 && x < 5 ? mezcla(cam, '#000000', 0.2) : cam)),
    }]);
  }
  // ---------- los trajes de la tienda ----------
  const T1 = tonos[1], T0 = tonos[0], T2 = tonos[2];
  defs.push(['granjero', { semilla: 21, piel: T1, pelo: '#6b4423', gorro: { c: '#e3c060', tipo: 'sombrero' }, camisa: '#c0392b', manga: '#c0392b', largoManga: 6, pantalon: '#3a5aa6', zapato: '#5a3418',
    cuerpo: (cara, x, y) => ((cara === 4 || cara === 5) && y >= 4 && x >= 1 && x <= 6) || ((cara === 4 || cara === 5) && y < 4 && (x === 1 || x === 6)) ? '#3a5aa6' : (((x >> 1) + (y >> 1)) % 2 ? '#c0392b' : '#7b1d14') }]);
  defs.push(['chef', { semilla: 22, piel: T0, pelo: '#3a2414', camisa: '#f4f4f4', manga: '#f4f4f4', largoManga: 7, pantalon: '#222', zapato: '#1a1a1a',
    gorro: { f: (cara, x, y) => cara === 3 ? null : cara === 2 ? (x === 0 || x === 7 || y === 0 || y === 7 ? '#d8d8d8' : '#ffffff') : (y < 3 ? (y === 2 ? '#d8d8d8' : '#ffffff') : null) },
    pantalonF: (cara, x, y) => ((x + y) % 2 ? '#f0f0f0' : '#222222'),
    cuerpo: (cara, x, y) => (cara === 4 && (x === 2 || x === 5) && y % 3 === 2 ? '#bfbfbf' : (y === 11 ? '#d8d8d8' : '#f4f4f4')) }]);
  defs.push(['vaquero', { semilla: 23, piel: T2, pelo: '#3a2414', barba: true, gorro: { c: '#7a4a24', tipo: 'sombrero' }, camisa: '#f0e8d8', manga: '#f0e8d8', largoManga: 6, pantalon: '#35539a', zapato: '#5a3418',
    cuerpo: (cara, x, y) => (y < 2 ? '#c0392b' : (cara === 4 || cara === 5) && (x <= 2 || x >= 5) ? '#7a4a24' : (y === 10 ? '#3a2414' : '#f0e8d8')) }]);
  defs.push(['surfista', { semilla: 24, piel: T1, pelo: '#e3c060', lentes: true, camisa: '#ff8a3d', manga: '#ff8a3d', largoManga: 3, corto: true, pantalon: '#3a9ad9', zapato: T1,
    cuerpo: (cara, x, y) => ((x * 3 + y * 5) % 7 === 0 ? '#ffe066' : (x * 5 + y * 3) % 11 === 0 ? '#ffffff' : '#ff8a3d') }]);
  defs.push(['pirata', { semilla: 25, piel: T1, pelo: '#1f1a17', barba: true, parche: true, camisa: '#f4f4f4', manga: '#f4f4f4', largoManga: 6, pantalon: '#2a2a30', zapato: '#1a1a1a',
    gorro: { f: (cara, x, y) => cara === 3 ? null : cara === 2 ? '#c0392b' : (y < 3 ? ((x + y) % 3 === 0 ? '#ffffff' : '#c0392b') : (cara === 5 && y < 5 && (x === 3 || x === 4) ? '#a02a20' : null)) },
    cuerpo: (cara, x, y) => (y === 10 ? '#3a2414' : y % 2 ? '#c0392b' : '#f4f4f4') }]);
  defs.push(['ninja', { semilla: 26, piel: T1, pelo: '#1f1a17', camisa: '#1f1f24', manga: '#1f1f24', largoManga: 12, guante: '#1f1f24', pantalon: '#1f1f24', zapato: '#141418',
    gorro: { f: (cara, x, y) => cara === 3 ? null : (cara === 4 && (y === 3 || y === 4)) ? null : (cara === 5 && y > 4 && x === 3 ? '#c0392b' : '#1f1f24') },
    cuerpo: (cara, x, y) => (y === 7 || y === 8 ? '#c0392b' : '#1f1f24') }]);
  defs.push(['astronauta', { semilla: 27, piel: T0, pelo: '#6b4423', camisa: '#f2f2f2', manga: '#f2f2f2', largoManga: 10, guante: '#cfd6de', pantalon: '#f2f2f2', zapato: '#8a929c',
    gorro: { f: (cara, x, y) => cara === 3 ? null : (cara === 4 && x >= 1 && x <= 6 && y >= 1 && y <= 6) ? (x === 2 && y === 2 ? '#e0f6ff' : (y < 3 ? '#8fd0f4' : '#5aa8de')) : (y === 7 ? '#c8ccd2' : '#f2f2f2') },
    cuerpo: (cara, x, y) => (cara === 4 && x >= 2 && x <= 5 && y >= 2 && y <= 5 ? (y === 2 && x === 5 ? '#d23a2a' : y === 2 && x === 4 ? '#2a5ad2' : '#c8ccd2') : (y === 9 ? '#8a929c' : '#f2f2f2')) }]);
  defs.push(['heroe', { semilla: 28, piel: T1, pelo: '#1f1a17', camisa: '#2f5fd0', manga: '#2f5fd0', largoManga: 10, guante: '#d23a2a', pantalon: '#2f5fd0', zapato: '#d23a2a',
    gorro: { f: (cara, x, y) => (cara === 4 && (y === 3 || y === 4) && !(y === 4 && (x === 1 || x === 2 || x === 5 || x === 6))) ? '#1a1a1a' : null },
    pantalonF: (cara, x, y) => (y < 3 ? '#d23a2a' : null),
    cuerpo: (cara, x, y) => (y === 7 ? '#ffd23f' : cara === 4 && ((y === 2 && (x === 3 || x === 4)) || (y === 3 && x >= 2 && x <= 5) || (y === 4 && (x === 3 || x === 4))) ? '#ffd23f' : '#2f5fd0') }]);
  defs.push(['rey', { semilla: 29, piel: T0, pelo: '#d8d0c0', barba: true, camisa: '#a8202c', manga: '#a8202c', largoManga: 8, pantalon: '#5a2a7a', zapato: '#3a1a10',
    gorro: { f: (cara, x, y) => cara === 2 || cara === 3 ? null : (y < 2 ? (y === 1 && x % 3 === 1 ? (x % 2 ? '#d23a2a' : '#2a7ad2') : (y === 0 && x % 2 === 1 ? null : '#f2c230')) : y === 2 ? '#d9a420' : null) },
    cuerpo: (cara, x, y) => (y < 2 ? ((x + y) % 3 === 0 ? '#222222' : '#f4f4f4') : y === 7 ? '#f2c230' : '#a8202c') }]);
  defs.push(['vip', { semilla: 30, piel: T2, pelo: '#1f1a17', lentes: true, camisa: '#e8b830', manga: '#e8b830', largoManga: 9, pantalon: '#d8a820', zapato: '#1a1a1a',
    cuerpo: (cara, x, y) => (cara === 4 && (x === 3 || x === 4) ? (y < 6 && x === 3 ? '#1a1a1a' : '#ffffff') : '#e8b830') }]);
  const datos = new Uint8Array(64 * 64 * 4 * defs.length);
  defs.forEach(([nom, o], i) => { datos.set(pintar(o), i * 64 * 64 * 4); PIELES[nom] = i; });
  PJ.nPieles = defs.length; PJ.datos = datos;
  return datos;
}
// ---------- huesos y animación ----------
const _mt = M4.nueva(), _mb = M4.nueva();
function poseHuesos(p, t) {
  const H = p.huesos || (p.huesos = new Float32Array(8 * 16));
  const esc = (p.escala || 0.86) / 16, f = p.fase || 0, an = p.andar || 0;
  const bob = Math.abs(Math.sin(f)) * 0.7 * an + (1 - an) * Math.sin(t * 2.2 + (p.sem || 0)) * 0.25;
  const base = M4.ident(_mb);
  M4.mover(base, p.x, (p.y != null ? p.y : SUELO) + bob * esc, p.z);
  M4.rotY(base, p.yaw || 0);
  M4.escalar(base, esc, esc, esc);
  const balanceo = Math.sin(f) * 0.75 * an;
  const ang = [
    [0, 0, 0],
    [(p.mirarAbajo || 0) + Math.sin(t * 1.3 + (p.sem || 0)) * 0.03, Math.sin(t * 0.7 + (p.sem || 0)) * 0.12 * (1 - an), 0],
    [p.carga ? -1.25 + Math.sin(f) * 0.05 * an : (p.festejo ? -2.8 : -balanceo * 0.8), 0, p.carga ? 0.18 : 0.06],
    [p.carga ? -1.25 + Math.sin(f) * 0.05 * an : (p.festejo ? -2.8 : balanceo * 0.8), 0, p.carga ? -0.18 : -0.06],
    [balanceo, 0, 0],
    [-balanceo, 0, 0],
  ];
  if (p.martillo) ang[2][0] = -1.6 + Math.sin(t * 14) * 0.7;
  for (let h = 0; h < 6; h++) {
    const piv = h === 0 ? [0, 12, 0] : PJ.partes[h === 1 ? 1 : h + 1][13];
    const m = M4.copiar(_mt, base);
    M4.mover(m, piv[0], piv[1], piv[2]);
    M4.rotY(m, ang[h][1]); M4.rotX(m, ang[h][0]); M4.rotZ(m, ang[h][2]);
    M4.mover(m, -piv[0], -piv[1], -piv[2]);
    H.set(m, h * 16);
  }
  return H;
}
function iniciarPersonajes() {
  PJ.malla = mallaPersonaje();
  const datos = PJ.datos || armarPieles();
  R.pieles = GL.texturaArreglo(64, 64, PJ.nPieles, datos, false, false);
}

// MANSION BUILDER — la mansión por partes (cada parte es una lista de bloques), las máquinas y los números del juego
// la casa mira a +z (hacia la cámara): frente en z=25, fondo en z=12, de x=12 a x=35; planta baja y 6..9, alta y 11..14
const ECO = {
  mochila: { cap: [8, 12, 16, 22, 30], precio: [60, 220, 650, 1600] },
  vel: { v: [4.3, 5.1, 5.9, 6.7], precio: [90, 340, 950] },
  ayudante: { precio: [150, 650, 1900], cap: 6, v: 3.4 },
  gen: {
    madera: { precio: 0, upg: [70, 200, 520, 1300] },
    piedra: { precio: 30, upg: [120, 320, 800, 1800] },
    vidrio: { precio: 220, upg: [300, 700, 1500, 3000] },
    marmol: { precio: 650, upg: [800, 1600, 3000, 5000] },
    oro: { precio: 2600, upg: [2000, 3500, 6000, 9000] },
  },
  ritmo: [0.8, 1.2, 1.7, 2.3, 3.0],                     // bloques por segundo según el nivel de la máquina
  tope: [12, 16, 22, 28, 36],                           // cuántos entran en la pila
  visita: n => ({ cada: Math.max(3, 11 - n * 0.6), paga: 2 + n * 2 }),
  diario: n => 50 + n * 60,
};
const CASA = { x0: 12, x1: 35, z0: 12, z1: 25 };
const PIL_X = [12, 18, 22, 25, 29, 35], PIL_Z = [12, 17, 20, 25];
const VEN_X = [[14, 16], [20, 21], [26, 27], [31, 33]], VEN_Z = [[14, 15], [22, 23]];
const enRango = (v, R) => R.some(([a, b]) => v >= a && v <= b);
function esPilastra(x, z) { return ((z === CASA.z0 || z === CASA.z1) && PIL_X.includes(x)) || ((x === CASA.x0 || x === CASA.x1) && PIL_Z.includes(z)); }
const esPuerta = (x, z) => z === CASA.z1 && (x === 23 || x === 24);
// ventana de planta baja (filas 7 y 8) o alta (filas 12 y 13; la puerta del balcón baja hasta 11)
function esVentana(x, z) {
  if (esPilastra(x, z)) return false;
  if (z === CASA.z0 || z === CASA.z1) return enRango(x, VEN_X) || (z === CASA.z0 && (x === 23 || x === 24));
  return enRango(z, VEN_Z);
}
function perimetro(f) { for (let x = CASA.x0; x <= CASA.x1; x++) { f(x, CASA.z0); f(x, CASA.z1); } for (let z = CASA.z0 + 1; z < CASA.z1; z++) { f(CASA.x0, z); f(CASA.x1, z); } }
const alturaTecho = (x, z) => 15 + Math.min(x - 11, 36 - x, z - 11, 26 - z, 7);
// las 13 partes: lo que piden (en bloques entregados), el premio y los bloques que agregan al mundo
const PARTES = [
  { id: 'piso', need: { madera: 10 }, premio: 40, arma(p) {
    for (let z = CASA.z0; z <= CASA.z1; z++) for (let x = CASA.x0; x <= CASA.x1; x++) p(x, 5, z, x === CASA.x0 || x === CASA.x1 || z === CASA.z0 || z === CASA.z1 || (x - 12) % 6 === 5 ? B.TABLAS_OSC : B.TABLAS);
  } },
  { id: 'cimientos', need: { piedra: 14 }, premio: 60, arma(p) {
    for (let z = 11; z <= 26; z++) for (let x = 11; x <= 36; x++) if (x === 11 || x === 36 || z === 11 || z === 26) p(x, 5, z, B.LADRILLO_PIEDRA);
    for (let z = 27; z <= 28; z++) for (let x = 16; x <= 31; x++) p(x, 5, z, x === 16 || x === 31 || z === 28 ? B.LADRILLO_PIEDRA : B.LISO);
    for (let x = 21; x <= 26; x++) p(x, 5, 29, B.LOSA_PIEDRA);
  } },
  { id: 'paredes', need: { madera: 16, piedra: 16 }, premio: 90, arma(p) {
    perimetro((x, z) => {
      if (esPilastra(x, z)) for (let y = 6; y <= 8; y++) p(x, y, z, B.TRONCO_OSC);
      else if (!esPuerta(x, z)) { p(x, 6, z, B.LADRILLO_PIEDRA); if (!esVentana(x, z)) { p(x, 7, z, B.LADRILLOS); p(x, 8, z, B.LADRILLOS); } }
      p(x, 9, z, B.TABLAS_OSC);
    });
  } },
  { id: 'puerta', need: { madera: 8 }, premio: 60, arma(p) {
    p(23, 6, 25, B.PUERTA_ABAJO); p(24, 6, 25, B.PUERTA_ABAJO); p(23, 7, 25, B.PUERTA_ARRIBA); p(24, 7, 25, B.PUERTA_ARRIBA);
    for (let x = 22; x <= 25; x++) p(x, 9, 26, B.LOSA_OSCURA);
    p(22, 8, 26, B.LAMPARA); p(25, 8, 26, B.LAMPARA);
  } },
  { id: 'ventanas', need: { vidrio: 14 }, premio: 170, arma(p) {
    perimetro((x, z) => { if (esVentana(x, z)) { p(x, 7, z, B.VIDRIO); p(x, 8, z, B.VIDRIO); } else if (esPuerta(x, z)) p(x, 8, z, B.VIDRIO); });
  } },
  { id: 'entrepiso', need: { piedra: 24 }, premio: 250, arma(p) {
    for (let z = CASA.z0; z <= CASA.z1; z++) for (let x = CASA.x0; x <= CASA.x1; x++) p(x, 10, z, x === CASA.x0 || x === CASA.x1 || z === CASA.z0 || z === CASA.z1 ? B.LADRILLO_PIEDRA : B.LISO);
  } },
  { id: 'alta', need: { marmol: 24, madera: 10 }, premio: 350, arma(p) {
    perimetro((x, z) => {
      if (esPilastra(x, z)) for (let y = 11; y <= 13; y++) p(x, y, z, B.PILAR);
      else if (esPuerta(x, z)) { /* la puerta del balcón: vidrio de 11 a 13 */ }
      else { p(x, 11, z, B.CUARZO_LADRILLO); if (!esVentana(x, z)) { p(x, 12, z, B.CUARZO); p(x, 13, z, B.CUARZO); } }
      p(x, 14, z, B.TABLAS_OSC);
    });
  } },
  { id: 'ventanales', need: { vidrio: 18 }, premio: 300, arma(p) {
    perimetro((x, z) => { if (esPuerta(x, z)) for (let y = 11; y <= 13; y++) p(x, y, z, B.VIDRIO); else if (esVentana(x, z)) { p(x, 12, z, B.VIDRIO); p(x, 13, z, B.VIDRIO); } });
  } },
  { id: 'techo', need: { piedra: 32 }, premio: 500, arma(p) {
    for (let k = 0; k <= 7; k++) {
      const x0 = 11 + k, x1 = 36 - k, z0 = 11 + k, z1 = 26 - k;
      for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) if (k === 7 || x === x0 || x === x1 || z === z0 || z === z1) p(x, 15 + k, z, k === 0 ? B.LOSA_PIZARRA : B.PIZARRA);
    }
    for (const cx of [15, 31]) for (let z = 14; z <= 15; z++) for (let x = cx; x <= cx + 1; x++) for (let y = alturaTecho(x, z) + 1; y <= 22; y++) p(x, y, z, B.LADRILLOS);
  } },
  { id: 'balcon', need: { marmol: 20 }, premio: 500, arma(p) {
    for (const x of [16, 20, 27, 31]) for (let y = 6; y <= 9; y++) p(x, y, 28, B.PILAR);
    for (let z = 26; z <= 28; z++) for (let x = 16; x <= 31; x++) p(x, 10, z, B.CUARZO);
    for (let x = 16; x <= 31; x++) p(x, 11, 28, B.LOSA_CUARZO);
    for (const x of [16, 31]) for (let z = 26; z <= 27; z++) p(x, 11, z, B.LOSA_CUARZO);
  } },
  { id: 'jardin', need: { madera: 14, piedra: 14 }, premio: 600, arma(p) {
    for (let z = 30; z <= 32; z++) for (let x = 22; x <= 25; x++) p(x, 4, z, B.ADOQUIN);
    for (let x = 17; x <= 21; x++) p(x, 4, 30, B.ADOQUIN);
    for (let x = 26; x <= 31; x++) p(x, 4, 30, B.ADOQUIN);
    // la cerca: postes de tronco con seto en el medio (sin tapar la pileta ni la fuente)
    const borde = (x, z) => {
      if (z === 31 && x >= 21 && x <= 26) return;
      if ((x <= 15 && z >= 27) || (x >= 31 && z >= 26)) return;
      const poste = (x + z) % 3 === 0 || (x === 9 || x === 38) && (z === 6 || z === 31);
      p(x, 5, z, poste ? B.TRONCO : B.SETO);
      if (poste) p(x, 6, z, B.LOSA_TABLAS);
    };
    for (let x = 9; x <= 38; x++) { borde(x, 6); borde(x, 31); }
    for (let z = 7; z <= 30; z++) { borde(9, z); borde(38, z); }
    for (const x of [20, 27]) { p(x, 5, 29, B.TRONCO_OSC); p(x, 6, 29, B.TRONCO_OSC); p(x, 7, 29, B.LAMPARA); }
    // canteros de flores
    const flores = [B.FLOR_ROJA, B.FLOR_AMARILLA, B.FLOR_AZUL, B.FLOR_BLANCA];
    for (const x of [17, 18, 19, 28, 29, 30]) p(x, 5, 29, flores[(x * 7) % 4]);
    for (let z = 8; z <= 9; z++) for (let x = 11; x <= 36; x++) if ((x + z) % 2 === 0) p(x, 5, z, flores[(x + z * 3) % 4]);
  } },
  { id: 'pileta', need: { marmol: 18, vidrio: 7 }, premio: 800, arma(p) {
    for (let z = 28; z <= 30; z++) for (let x = 10; x <= 14; x++) p(x, 4, z, B.CUARZO);
    for (let z = 27; z <= 31; z++) for (let x = 9; x <= 15; x++) {
      const anillo = x === 9 || x === 15 || z === 27 || z === 31;
      if (anillo) p(x, 5, z, z === 31 ? B.VIDRIO : B.CUARZO_LADRILLO);
      else p(x, 5, z, B.AGUA);
    }
    p(12, 6, 27, B.LOSA_TABLAS); p(13, 6, 27, B.LOSA_TABLAS);
  } },
  { id: 'oro', need: { oro: 24 }, premio: 2000, arma(p) {
    for (let z = 27; z <= 31; z++) for (let x = 32; x <= 36; x++) {
      const anillo = x === 32 || x === 36 || z === 27 || z === 31;
      if (anillo) p(x, 5, z, B.ORO); else if (!(x === 34 && z === 29)) p(x, 5, z, B.AGUA);
    }
    for (let y = 5; y <= 7; y++) p(34, y, 29, B.ORO);
    p(34, 8, 29, B.LAMPARA);
    for (const x of [18, 29]) for (const z of [18, 19]) p(x, 23, z, B.ORO);
    for (const cx of [15, 31]) for (let z = 14; z <= 15; z++) for (let x = cx; x <= cx + 1; x++) p(x, 23, z, B.ORO);
    p(16, 11, 28, B.ORO); p(31, 11, 28, B.ORO);
  } },
];
// cuánto pide de verdad una parte: las del final piden más, y cada mansión nueva (estrella) un 25% más
function necesita(i, m) { const P = PARTES[i]; if (!P || !P.need[m]) return 0; return Math.round(P.need[m] * (i >= 8 ? 1.6 : i >= 4 ? 1.3 : 1) * (1 + 0.25 * (G.estrellas || 0))); }
// los estilos de cada mansión nueva: mismos materiales, otros bloques
const ESTILOS = [
  {},
  { LADRILLOS: 'TERRACOTA', PIZARRA: 'TEJADO_ROJO', LOSA_PIZARRA: 'LOSA_TEJADO', TRONCO_OSC: 'TRONCO', VIDRIO: 'CRISTAL_AZUL' },
  { LADRILLOS: 'HORM_NEGRO', PIZARRA: 'LISO', LOSA_PIZARRA: 'LOSA_LISO', TRONCO_OSC: 'TABLAS_OSC', CUARZO_LADRILLO: 'CUARZO', VIDRIO: 'CRISTAL_AZUL', PILAR: 'CUARZO' },
  { LADRILLOS: 'ADOQUIN', PIZARRA: 'TEJADO_ROJO', LOSA_PIZARRA: 'LOSA_TEJADO', CUARZO: 'CUARZO_LADRILLO', TABLAS_OSC: 'TABLAS' },
];
const _estilo = [];
function bloqueEstilo(b) {
  const e = ESTILOS[(G.estrellas || 0) % ESTILOS.length];
  if (!_estilo[b]) _estilo[b] = {};
  const nom = BLOQ[b].nom; return e[nom] ? B[e[nom]] : b;
}
function listaParte(i) { return listaDe(PARTES[i].arma).map(v => [v[0], v[1], v[2], bloqueEstilo(v[3])]); }
// ---------- las máquinas de cada material (se arman al desbloquearlas) ----------
// salida: de dónde sale cada bloque nuevo; humo: dónde echan partículas
const MAQUINAS = {
  madera: { salida: [9.5, 6.2, 41.6], humo: [9.5, 6.6, 40.5], colHumo: '#d8b878', arma(p) {
    for (let z = 38; z <= 40; z++) for (let x = 5; x <= 7; x++) for (let y = 5; y <= 6; y++) if (!(y === 6 && x === 7 && z === 40)) p(x, y, z, B.TRONCO_ACOSTADO);
    p(6, 7, 39, B.TRONCO_ACOSTADO);
    for (const [x, z] of [[8, 38], [11, 38], [8, 42], [11, 42]]) for (let y = 5; y <= 7; y++) p(x, y, z, B.TRONCO);
    for (let z = 38; z <= 42; z++) for (let x = 8; x <= 11; x++) p(x, 8, z, B.LOSA_TABLAS);
    p(9, 5, 40, B.TABLAS_OSC); p(10, 5, 40, B.TABLAS_OSC); p(9, 6, 40, B.HIERRO);
    p(10, 5, 41, B.CAJA);
  } },
  piedra: { salida: [37.5, 7.2, 41.6], humo: [37, 7.4, 40.5], colHumo: '#b8b8b8', arma(p) {
    for (let z = 38; z <= 40; z++) for (let x = 39; x <= 42; x++) {
      const h = 5 + (x >= 40 && x <= 41 && z === 39 ? 2 : (x === 39 || z === 40) ? 0 : 1);
      for (let y = 5; y <= h; y++) p(x, y, z, [B.PIEDRA, B.PIEDRA_MUSGO, B.ADOQUIN, B.GRAVA][(x * 3 + z + y) % 4]);
    }
    for (let z = 40; z <= 41; z++) for (let x = 36; x <= 37; x++) { p(x, 5, z, B.HORM_AMARILLO); p(x, 6, z, B.HIERRO); }
    p(38, 5, 42, B.HORM_NEGRO); p(42, 5, 42, B.PIEDRA);
  } },
  vidrio: { salida: [8.5, 6.2, 58.6], humo: [8.5, 11.2, 56.5], colHumo: '#9aa0a8', arma(p) {
    for (let z = 55; z <= 57; z++) for (let x = 7; x <= 9; x++) for (let y = 5; y <= 7; y++) p(x, y, z, x === 8 && z === 57 && y === 5 ? B.HORNO : B.LADRILLOS);
    for (let y = 8; y <= 10; y++) p(8, y, 56, B.LADRILLOS);
    for (let z = 55; z <= 57; z++) p(5, 5, z, B.ARENA); p(6, 5, 55, B.ARENA); p(6, 5, 56, B.ARENA); p(5, 6, 56, B.ARENA);
    p(10, 5, 55, B.VIDRIO); p(11, 5, 55, B.VIDRIO); p(10, 6, 55, B.VIDRIO);
    p(11, 5, 57, B.CAJA);
  } },
  marmol: { salida: [38.5, 6.2, 58.6], humo: [40.5, 7, 57.5], colHumo: '#f4f0ea', arma(p) {
    for (let z = 55; z <= 56; z++) for (let x = 36; x <= 37; x++) { p(x, 5, z, B.CUARZO); p(x, 6, z, B.CUARZO); }
    for (let y = 5; y <= 7; y++) p(38, y, 55, B.PILAR);
    for (let z = 55; z <= 56; z++) for (let x = 39; x <= 40; x++) p(x, 5, z, B.CUARZO_LADRILLO);
    p(40, 5, 57, B.HIERRO); p(41, 5, 57, B.HIERRO); p(40, 6, 57, B.HIERRO);
    p(42, 5, 58, B.CAJA); p(42, 5, 57, B.CAJA); p(42, 6, 58, B.CAJA);
  } },
  oro: { salida: [24, 6.4, 62.4], humo: [24, 6.5, 63.5], colHumo: '#ffe27a', arma(p) {
    // dos torres de roca con mineral y un arco de tablas: el camino al muelle pasa por abajo
    for (const [a, b] of [[20, 22], [26, 28]]) for (let z = 62; z <= 65; z++) for (let x = a; x <= b; x++) {
      const alto = 7 - ((x === 20 || x === 28) ? 1 : 0) - (z === 62 ? 1 : 0);
      for (let y = 5; y <= alto; y++) p(x, y, z, hash2(x * 7 + y, z * 3) < 0.3 ? B.MINERAL_ORO : (hash2(x, y + z) < 0.5 ? B.PIEDRA : B.ADOQUIN));
    }
    for (let x = 22; x <= 26; x++) for (let z = 62; z <= 64; z++) p(x, 8, z, z === 62 ? B.TABLAS_OSC : B.PIEDRA);
    p(24, 7, 63, B.LAMPARA);
    p(21, 7, 62, B.LAMPARA); p(27, 7, 62, B.LAMPARA);
  } },
};
// lista de bloques de una parte o máquina, sin repetidos
function listaDe(arma) {
  const L = [], vistos = new Set();
  arma((x, y, z, b) => { const k = (y * MZ + z) * MX + x; if (vistos.has(k) || !Mundo.dentro(x, y, z)) return; vistos.add(k); L.push([x, y, z, b]); });
  return L;
}

// MANSION BUILDER — el sonido: la música y los efectos hechos con Higgsfield (mp3 metidos en el HTML), pasos
// sintetizados y la vibración. El audio arranca con el primer toque (los navegadores no dejan antes).
const Sonido = {
  ctx: null, master: null, bMus: null, bSfx: null, buf: {}, listo: false, musOn: true, sfxOn: true, vibOn: true, tocado: false,
  fuentes: [], musT: 0, musTimer: 0, ultimo: {}, ruido: null,
  ok() { return !!(this.interno || (this.ctx && this.ctx.state === 'running')); },
  iniciar() {
    this.tocado = true;
    if (!this.ctx && !this.interno) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { if (window.__crearAudio) { this.interno = { pila: {}, musica: null }; this.listo = true; if (this.quiereMusica) this.musica(true); } return; }
      try { this.ctx = new AC({ latencyHint: 'interactive' }); } catch (e) { try { this.ctx = new AC(); } catch (e2) { return; } }
      const c = this.ctx;
      this.master = c.createGain(); this.master.gain.value = 0.9;
      const comp = c.createDynamicsCompressor(); comp.threshold.value = -12; comp.ratio.value = 3;
      this.master.connect(comp); comp.connect(c.destination);
      this.bMus = c.createGain(); this.bMus.gain.value = this.musOn ? 0.42 : 0; this.bMus.connect(this.master);
      this.bSfx = c.createGain(); this.bSfx.gain.value = this.sfxOn ? 0.8 : 0; this.bSfx.connect(this.master);
      const n = c.sampleRate * 0.5, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      this.ruido = b;
      this.decodificar();
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => { });
  },
  // los mp3 vienen en base64 dentro del HTML (AUDIO_DATOS lo arma armar.mjs)
  decodificar() {
    const datos = typeof AUDIO_DATOS !== 'undefined' ? AUDIO_DATOS : {};
    const nombres = (Object.keys(datos).length ? Object.keys(datos) : (window.__audios || [])).sort((a, b) => (a === 'musica') - (b === 'musica'));
    let i = 0;
    const sig = () => {
      if (i >= nombres.length) { this.listo = true; return; }
      const k = nombres[i++];
      let u;
      if (datos[k]) { const s = atob(datos[k]); u = new Uint8Array(s.length); for (let j = 0; j < s.length; j++) u[j] = s.charCodeAt(j); }
      else { const ab = window.__leerAudio ? window.__leerAudio(k) : null; if (!ab) { setTimeout(sig, 0); return; } u = new Uint8Array(ab); }
      const fin = b => { if (b) this.buf[k] = b; if (k === 'musica' && this.quiereMusica) this.musica(true); setTimeout(sig, 0); };
      try { const p = this.ctx.decodeAudioData(u.buffer, fin, () => fin(null)); if (p && p.catch) p.catch(() => { }); } catch (e) { fin(null); }
    };
    sig();
  },
  ponerMusica(on) { this.musOn = on; if (this.interno && this.interno.musica) this.interno.musica.volume = on ? 0.42 : 0; if (this.bMus) this.bMus.gain.setTargetAtTime(on ? 0.42 : 0, this.ctx.currentTime, 0.2); },
  ponerSfx(on) { this.sfxOn = on; if (this.bSfx) this.bSfx.gain.setTargetAtTime(on ? 0.8 : 0, this.ctx.currentTime, 0.05); },
  // la música en loop con fundido cruzado (el tema dura 86 s y termina en fundido)
  musica(on) {
    this.quiereMusica = on;
    if (this.interno) {
      const I = this.interno;
      if (on && !I.musica) { I.musica = window.__crearAudio('musica', true); }
      if (I.musica) { I.musica.volume = this.musOn ? 0.42 : 0; if (on) I.musica.play(); else I.musica.stop(); }
      return;
    }
    if (!on) { for (const f of this.fuentes) { try { f.g.gain.setTargetAtTime(0, this.ctx.currentTime, 0.4); f.s.stop(this.ctx.currentTime + 2); } catch (e) { } } this.fuentes = []; clearTimeout(this.musTimer); return; }
    if (!this.ok() || !this.buf.musica || this.fuentes.length) return;
    const tocar = (desde) => {
      const c = this.ctx, b = this.buf.musica, s = c.createBufferSource(), g = c.createGain();
      s.buffer = b; s.connect(g); g.connect(this.bMus);
      const t = c.currentTime + 0.05;
      g.gain.setValueAtTime(desde ? 0 : 1, t); if (desde) g.gain.linearRampToValueAtTime(1, t + 3);
      s.start(t);
      const f = { s, g }; this.fuentes.push(f);
      s.onended = () => { const k = this.fuentes.indexOf(f); if (k >= 0) this.fuentes.splice(k, 1); };
      this.musTimer = setTimeout(() => { if (this.quiereMusica) tocar(true); }, Math.max(1000, (b.duration - 3.5) * 1000));
    };
    tocar(false);
  },
  // un efecto: vol, tono (rate) y un mínimo de separación para que no se amontonen
  efecto(nombre, vol = 1, tono = 1, sep = 0.03) {
    if (!this.ok() || !this.sfxOn) return;
    if (this.interno) {
      // sin WebAudio: unas pocas voces por efecto, que se reciclan
      const ahora = Date.now() / 1000, I = this.interno; if (this.ultimo[nombre] && ahora - this.ultimo[nombre] < Math.max(sep, 0.06)) return; this.ultimo[nombre] = ahora;
      const p = I.pila[nombre] || (I.pila[nombre] = { i: 0, voces: [] });
      if (p.voces.length < 3) p.voces.push(window.__crearAudio(nombre, false));
      const a = p.voces[p.i++ % p.voces.length]; a.volume = Math.min(1, vol * 0.8); a.stop(); a.play();
      return;
    }
    const c = this.ctx, ahora = c.currentTime;
    if (this.ultimo[nombre] && ahora - this.ultimo[nombre] < sep) return;
    this.ultimo[nombre] = ahora;
    const b = this.buf[nombre];
    if (!b) return this.sintetico(nombre, vol, tono);
    const s = c.createBufferSource(), g = c.createGain();
    s.buffer = b; s.playbackRate.value = tono; g.gain.value = vol;
    s.connect(g); g.connect(this.bSfx); s.start(ahora);
  },
  // por si el mp3 todavía no se decodificó: un tono corto que se le parece
  sintetico(nombre, vol, tono) {
    const c = this.ctx, t = c.currentTime, o = c.createOscillator(), g = c.createGain();
    const f = { pop: 520, recoger: 380, moneda: 1320, caja: 990, desbloquear: 660, fanfarria: 784, clic: 900, martillo: 180, tick: 1500, pala: 220, cofre: 880, agua: 300 }[nombre] || 600;
    o.type = nombre === 'martillo' ? 'square' : 'triangle'; o.frequency.setValueAtTime(f * tono, t); o.frequency.exponentialRampToValueAtTime(f * tono * 1.5, t + 0.08);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.18 * vol, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    o.connect(g); g.connect(this.bSfx); o.start(t); o.stop(t + 0.2);
  },
  // un paso: ruido corto filtrado (pasto o piedra)
  paso(duro) {
    if (!this.ctx || !this.ok() || !this.sfxOn || !this.ruido) return;
    const c = this.ctx, t = c.currentTime, s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.ruido; s.playbackRate.value = 0.8 + Math.random() * 0.4;
    fl.type = 'bandpass'; fl.frequency.value = duro ? 1800 : 700; fl.Q.value = 0.9;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(duro ? 0.07 : 0.05, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    s.connect(fl); fl.connect(g); g.connect(this.bSfx); s.start(t, Math.random() * 0.4, 0.09);
  },
  vibrar(p) { if (!this.vibOn || !this.tocado || !navigator.vibrate) return; try { navigator.vibrate(p); } catch (e) { } },
  pausar(si) { if (this.interno && this.interno.musica) { if (si) this.interno.musica.pause(); else if (this.quiereMusica) this.interno.musica.play(); } if (!this.ctx) return; if (si) this.ctx.suspend().catch(() => { }); else if (this.tocado) this.ctx.resume().catch(() => { }); },
};

// MANSION BUILDER — el juego: el constructor, las máquinas, la obra, la plata, los ayudantes y los visitantes
function estadoNuevo() {
  return {
    v: 2, dinero: 0, parte: 0, entregado: {}, gens: { madera: { nivel: 1, pila: 10 } }, mochila: 0, vel: 0, ayud: 0, pads: {}, caja: 0, visitas: 0, bloques: 0, ganado: 0, t: Date.now(), jugado: 0,
    gemas: 0, estrellas: 0, traje: 'jugador', trajes: ['jugador'], mascota: null, mascotas: [], decos: [], adProg: {}, boosts: { x2: 0, vel: 0, iman: 0 },
    mis: null, logros: {}, racha: { dia: 0, n: 0 }, ruleta: { dia: 0 }, mj: { dia: 0, torre: 0, excava: 0, cebo: 5, ceboT: 0, mejorTorre: 0 },
    stats: { peces: 0, cofres: 0, torre: 0, anuncios: 0, minijuegos: 0 }, adDia: 0, adUsos: {},
  };
}
// completa lo que falte de una partida vieja (los objetos de adentro también)
function normalizarEstado(leido) {
  const n = estadoNuevo(), e = Object.assign(n, leido || {});
  for (const k of ['boosts', 'racha', 'ruleta', 'mj', 'stats']) e[k] = Object.assign(estadoNuevo()[k], (leido && leido[k]) || {});
  for (const k of ['trajes', 'mascotas', 'decos']) if (!Array.isArray(e[k])) e[k] = estadoNuevo()[k];
  if (!e.trajes.includes('jugador')) e.trajes.unshift('jugador');
  return e;
}
let G = estadoNuevo();
const VIVO = { t: 0, gen: {}, obj: null, objT: 0, cajaVol: 0, cajaIni: 0, visitaT: 4, guardarT: 0, humoT: 0, festejo: 0, padActivo: null };
const JUG = { x: LUGAR.inicio[0], z: LUGAR.inicio[1], y: SUELO, yaw: PI, vx: 0, vz: 0, carga: [], fase: 0, andar: 0, sem: 0, tPila: 0, tObra: 0, tCaja: 0, tPad: 0, padId: null, avisos: {}, pasoF: 0 };
const AYUD = [], VIS = [], VOL = [];
const OBRA = { porMat: {}, adorno: [], aterrizado: {}, fantasma: null, fantSucio: true };
const PRIMERA = {};
PARTES.forEach((P, i) => { for (const m in P.need) if (PRIMERA[m] == null) PRIMERA[m] = i; });
const capMochila = () => ECO.mochila.cap[G.mochila];
const dist2 = (ax, az, bx, bz) => (ax - bx) * (ax - bx) + (az - bz) * (az - bz);

// ---------- guardado ----------
function guardar() {
  const gens = {}; for (const m in G.gens) gens[m] = { nivel: G.gens[m].nivel, pila: G.gens[m].pila };
  Guardado.escribir('estado', Object.assign({}, G, { gens, t: Date.now() }));
}
function cargarEstado() {
  const leido = Guardado.leer('estado', null);
  G = normalizarEstado(leido);
  if (!G.gens.madera) G.gens.madera = { nivel: 1, pila: 10 };
  return !!leido;
}

// ---------- la obra (la parte que se está construyendo) ----------
function prepararParte() {
  const P = PARTES[G.parte];
  OBRA.porMat = {}; OBRA.adorno = []; OBRA.aterrizado = {}; OBRA.fantSucio = true;
  if (!P) return;
  for (const v of listaParte(G.parte)) { const m = BLOQ[v[3]].m; if (m && P.need[m]) (OBRA.porMat[m] || (OBRA.porMat[m] = [])).push(v); else OBRA.adorno.push(v); }
  for (const m in OBRA.porMat) OBRA.porMat[m].sort((a, b) => a[1] - b[1] || b[2] - a[2] || a[0] - b[0]);
  for (const m in P.need) { if (!G.entregado[m]) G.entregado[m] = 0; OBRA.aterrizado[m] = G.entregado[m]; }
}
// cuántos bloques del mundo hay puestos de un material tras k entregas
function hasta(m, k) { const L = OBRA.porMat[m], n = necesita(G.parte, m); if (!L) return 0; return k >= n ? L.length : Math.floor(k * L.length / n); }
const faltaEntregar = m => PARTES[G.parte] ? necesita(G.parte, m) - (G.entregado[m] || 0) : 0;
function cargando(m) { let n = 0; for (const c of JUG.carga) if (c.m === m) n++; for (const a of AYUD) for (const c of a.carga) if (c.m === m) n++; return n; }
const faltaJuntar = m => faltaEntregar(m) - cargando(m);
function colocar(lista, efecto) {
  for (const v of lista) {
    Mundo.set(v[0], v[1], v[2], v[3]);
    if (efecto) chispas(v[0] + 0.5, v[1] + 0.6, v[2] + 0.5, colorBloque(v[3]), 3, 2.2);
  }
}
function parteCompleta() { const P = PARTES[G.parte]; if (!P) return false; for (const m in P.need) if ((OBRA.aterrizado[m] || 0) < necesita(G.parte, m)) return false; return true; }
function completarParte() {
  const P = PARTES[G.parte];
  colocar(OBRA.adorno, true);
  // el premio vuela de la mansión a la caja en billetes (cada estrella lo agranda)
  const premio = Math.round(P.premio * (1 + 0.5 * (G.estrellas || 0)));
  G.caja += premio; VIVO.cajaVol += premio;
  const nb = 14, c = LUGAR.caja;
  for (let k = 0; k < nb; k++) {
    const parte = Math.floor(premio * (k + 1) / nb) - Math.floor(premio * k / nb);
    volar(B.BILLETE, -0.55, [24 + rnd(-6, 6), 12 + rnd(0, 6), 18 + rnd(-3, 6)], () => posCajaArriba(), 0.9 + k * 0.05, 4, () => { VIVO.cajaVol -= parte; Sonido.efecto('moneda', 0.5, 1 + k * 0.03, 0.02); }, k * 0.04);
  }
  for (let k = 0; k < 90; k++) confeti(24 + rnd(-10, 10), 16 + rnd(0, 6), 19 + rnd(-6, 8));
  G.parte++; G.entregado = {}; G.gemas += 5; UI.pulsoGemas();
  Sonido.efecto('fanfarria', 0.9); Sonido.vibrar([40, 30, 60]);
  UI.festejo(T('lista', { p: T('parte.' + P.id).toUpperCase() }), '+$' + fmt(premio));
  VIVO.festejo = 3;
  if (G.parte >= PARTES.length) { UI.festejo(T('mansion'), T('fin'), true); VIVO.festejo = 6; }
  prepararParte();
  guardar();
}
// el plano fantasma: lo que todavía falta de la parte
function armarFantasma() {
  OBRA.fantSucio = false;
  GL.borrarMalla(OBRA.fantasma); OBRA.fantasma = null;
  if (!R.cv) return;
  const P = PARTES[G.parte]; if (!P) return;
  const falta = [], hay = new Set();
  for (const m in OBRA.porMat) { const L = OBRA.porMat[m]; for (let i = hasta(m, OBRA.aterrizado[m] || 0); i < L.length; i++) { falta.push(L[i]); hay.add((L[i][1] * MZ + L[i][2]) * MX + L[i][0]); } }
  if (!falta.length) return;
  const d = mallarConjunto(falta, (x, y, z) => hay.has((y * MZ + z) * MX + x) || Mundo.opaco(x, y, z));
  if (d) OBRA.fantasma = R.mallaVox(d);
}

// ---------- el mundo armado según el progreso ----------
function reconstruirMundo() {
  generarMundo();
  for (const m in G.gens) colocar(listaDe(MAQUINAS[m].arma), false);
  colocar(listaDe(ARCADE_ARMA), false);
  for (const d of G.decos) if (DECO_ARMA[d]) colocar(listaDe(DECO_ARMA[d]), false);
  for (let i = 0; i < Math.min(G.parte, PARTES.length); i++) colocar(listaParte(i), false);
  prepararParte();
  for (const m in OBRA.porMat) colocar(OBRA.porMat[m].slice(0, hasta(m, G.entregado[m] || 0)), false);
  Mundo.sucios.clear(); for (let i = 0; i < NCX * NCZ; i++) Mundo.sucios.add(i);
  Paso.recalcular();
  for (const m in G.gens) VIVO.gen[m] = { t: 0, enCamino: 0 };
  AYUD.length = 0; for (let i = 0; i < G.ayud; i++) AYUD.push(nuevoAyudante(i));
  VIS.length = 0; VOL.length = 0; JUG.carga.length = 0; VIVO.cajaVol = 0;
  JUG.x = LUGAR.inicio[0]; JUG.z = LUGAR.inicio[1]; JUG.yaw = PI;
  COFRES.uno = null; COFRES.t = 70; MASC.huevos.length = 0; ponerMascota();
}
// una mansión nueva con otro estilo: se conserva todo menos lo construido; los visitantes pagan +50% por estrella
function renovarMansion() {
  if (G.parte < PARTES.length) return;
  G.estrellas = (G.estrellas || 0) + 1; G.parte = 0; G.entregado = {}; G.gemas += 50;
  reconstruirMundo(); armarFantasma();
  for (let k = 0; k < 80; k++) confeti(24 + rnd(-8, 8), 10 + rnd(0, 6), 20 + rnd(-6, 8));
  Sonido.efecto('fanfarria', 0.9); UI.festejo(T('renovar') + (G.estrellas + 1), '+50 💎', true);
  UI.panel = null; guardar();
}
// la maquinita de arcade (abre los minijuegos) y los cuadros de actividad del mundo
function ARCADE_ARMA(p) { p(28, 5, 40, B.LANA_AZUL); p(29, 5, 40, B.LANA_AZUL); p(28, 6, 40, B.LAMPARA); p(29, 6, 40, B.LAMPARA); p(28, 7, 40, B.LANA_ROJA); p(29, 7, 40, B.LANA_ROJA); p(28, 8, 40, B.LANA_AMARILLA); p(29, 8, 40, B.LANA_AMARILLA); }
const ACT_PADS = [{ id: 'pesca', x: 24, z: 69.4 }, { id: 'arcade', x: 28.5, z: 42.4 }];
function padsActividad(dt) {
  let sobre = null;
  for (const a of ACT_PADS) if (Math.abs(JUG.x - a.x) < 1.2 && Math.abs(JUG.z - a.z) < 1.2) sobre = a;
  if (!sobre || Math.hypot(JUG.vx, JUG.vz) > 1.2) { JUG.tAct = 0.45; JUG.actHecho = sobre ? JUG.actHecho : null; return; }
  if (JUG.actHecho === sobre.id) return;
  JUG.tAct -= dt;
  if (JUG.tAct <= 0) { JUG.actHecho = sobre.id; if (sobre.id === 'pesca') abrirMinijuego('pesca', null); else abrirPanel('minijuegos'); }
}

// ---------- las máquinas y sus pilas ----------
function posPila(m, i) {
  const p = LUGAR.gen[m].pila, k = i % 4, f = Math.floor(i / 4);
  return [p[0] + (k & 1 ? 0.27 : -0.27), SUELO + 0.25 + f * 0.5, p[1] + (k & 2 ? 0.27 : -0.27)];
}
function producir(dt) {
  for (const m in G.gens) {
    const e = G.gens[m], v = VIVO.gen[m] || (VIVO.gen[m] = { t: 0, enCamino: 0 }), tope = ECO.tope[e.nivel - 1];
    if (e.pila + v.enCamino >= tope) { v.t = 0; continue; }
    v.t += dt * ECO.ritmo[e.nivel - 1];
    while (v.t >= 1 && e.pila + v.enCamino < tope) {
      v.t -= 1; const i = e.pila + v.enCamino; v.enCamino++;
      const M = MAQUINAS[m];
      volar(BLOQUE_DE[m], 0.5, M.salida.slice(), posPila(m, i), 0.45, 1.6, () => { v.enCamino--; e.pila++; });
      if (vis() < 0.6) chispas(M.humo[0], M.humo[1], M.humo[2], M.colHumo, 2, 1.2);
    }
  }
}
// el carrito de cada uno: dónde va el bloque i de la pila que lleva en brazos
function posCarga(c, i) {
  const s = Math.sin(c.yaw || 0), co = Math.cos(c.yaw || 0), mec = Math.sin(VIVO.t * 7 + i * 0.4) * Math.min(0.12, i * 0.008) * (c.andar || 0);
  return [c.x + s * 0.42 + co * mec, (c.y || SUELO) + 0.95 + i * 0.4, c.z + co * 0.42 - s * mec];
}
function tomarDePila(c, m, cap) {
  const e = G.gens[m];
  if (!e || e.pila <= 0 || c.carga.length >= cap || faltaJuntar(m) <= 0) return false;
  e.pila--;
  const o = posPila(m, e.pila);
  c.carga.push({ m, t0: VIVO.t, o });
  return true;
}
// entrega el bloque más alto que la obra pida: vuela hasta su lugar y ahí se pone
function entregarUno(c) {
  const P = PARTES[G.parte];
  if (!P) return false;
  for (let i = c.carga.length - 1; i >= 0; i--) {
    const m = c.carga[i].m;
    if (faltaEntregar(m) <= 0) continue;
    c.carga.splice(i, 1);
    const L = ++G.entregado[m], grupo = OBRA.porMat[m].slice(hasta(m, L - 1), hasta(m, L));
    const o = posCarga(c, c.carga.length), d = centroDe(grupo, o);
    const lejos = Math.hypot(d[0] - o[0], d[2] - o[2]);
    volar(BLOQUE_DE[m], 0.5, o, d, 0.5 + lejos * 0.013, 2 + lejos * 0.12, () => aterrizar(m, grupo));
    return true;
  }
  return false;
}
function centroDe(grupo, def) {
  if (!grupo.length) return [24, 8, 20];
  let x = 0, y = 0, z = 0; for (const v of grupo) { x += v[0]; y += v[1]; z += v[2]; }
  const n = grupo.length; return [x / n + 0.5, y / n + 0.5, z / n + 0.5];
}
function aterrizar(m, grupo) {
  colocar(grupo, true);
  OBRA.aterrizado[m] = (OBRA.aterrizado[m] || 0) + 1; G.bloques++; mision('entregar', 1);
  OBRA.fantSucio = true;
  Sonido.efecto(vis() < 0.5 ? 'pop' : 'martillo', 0.55, 0.9 + vis() * 0.25, 0.05);
  if (parteCompleta()) completarParte();
}

// ---------- la plata: la caja y los billetes ----------
function posCajaArriba() { const n = billetesCaja(); const c = LUGAR.caja, k = n % 9, f = Math.floor(n / 9); return [c[0] + ((k % 3) - 1) * 0.62, SUELO + 0.1 + f * 0.17, c[1] + (Math.floor(k / 3) - 1) * 0.42]; }
function billetesCaja() { const v = G.caja - VIVO.cajaVol; return v <= 0 ? 0 : clamp(Math.ceil(v / 10), 1, 72); }
function fmt(n) {
  n = Math.floor(n);
  if (n < 10000) return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, IDIOMA === 'en' ? ',' : '.');
  if (n < 1e6) return (n / 1000).toFixed(n < 1e5 ? 1 : 0).replace('.0', '') + 'K';
  return (n / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'M';
}
function cobrarCaja(dt) {
  const c = LUGAR.caja, en = (Math.abs(JUG.x - c[0]) < 1.5 && Math.abs(JUG.z - c[1]) < 1.5) || G.boosts.iman > 0 || (G.mascota === 'gato' && dist2(JUG.x, JUG.z, c[0], c[1]) < 81);
  if (!en) { VIVO.cajaIni = 0; return; }
  if (G.caja <= 0) return;
  if (!VIVO.cajaIni) VIVO.cajaIni = G.caja;
  JUG.tCaja -= dt;
  while (JUG.tCaja <= 0 && G.caja > 0) {
    JUG.tCaja += 0.035;
    const a = Math.min(G.caja, Math.max(1, Math.ceil(VIVO.cajaIni / 18)));
    const o = posCajaArriba();
    G.caja -= a;
    const k = VIVO.cajaIni ? 1 - G.caja / VIVO.cajaIni : 0;
    const lejos = Math.hypot(JUG.x - c[0], JUG.z - c[1]);
    volar(B.BILLETE, -0.55, o, () => [JUG.x, JUG.y + 1.4, JUG.z], 0.32 + lejos * 0.04, 1.2 + lejos * 0.15, () => { G.dinero += a; G.ganado += a; mision('cobrar', a); UI.pulsoPlata(); Sonido.efecto('moneda', 0.45, 0.9 + k * 0.5, 0.025); });
  }
  if (G.caja <= 0) { Sonido.efecto('caja', 0.7); Sonido.vibrar(25); }
}

// ---------- los cuadros para gastar (desbloquear y mejorar) ----------
const PADS = [];
function armarPads() {
  PADS.length = 0;
  for (const m of MATERIALES) {
    const g = LUGAR.gen[m];
    PADS.push({ id: 'gen_' + m, x: g.pad[0], z: g.pad[1], m,
      precio: () => { const e = G.gens[m]; return !e ? ECO.gen[m].precio : e.nivel < 5 ? ECO.gen[m].upg[e.nivel - 1] : 0; },
      visible: () => G.gens[m] ? G.parte >= 1 : G.parte >= PRIMERA[m] - 1,
      titulo: () => G.gens[m] ? T('gen.' + m) + ' ' + T('nivel') + (G.gens[m].nivel + 1) : T('gen.' + m),
      accion: () => G.gens[m] ? T('mejorar') : T('desbloquear'),
      icono: () => BLOQUE_DE[m] });
  }
  PADS.push({ id: 'mochila', x: LUGAR.mochila[0], z: LUGAR.mochila[1], precio: () => ECO.mochila.precio[G.mochila] || 0, visible: () => G.parte >= 2, titulo: () => T('mochila') + ' ' + capMochila() + '→' + ECO.mochila.cap[G.mochila + 1], accion: () => T('mejorar'), icono: () => B.CAJA });
  PADS.push({ id: 'vel', x: LUGAR.zapatillas[0], z: LUGAR.zapatillas[1], precio: () => ECO.vel.precio[G.vel] || 0, visible: () => G.parte >= 2, titulo: () => T('vel') + ' ' + T('nivel') + (G.vel + 2), accion: () => T('mejorar'), icono: () => B.LANA_AZUL });
  PADS.push({ id: 'ayudante', x: LUGAR.ayudantes.pad[0], z: LUGAR.ayudantes.pad[1], precio: () => ECO.ayudante.precio[G.ayud] || 0, visible: () => G.parte >= 3, titulo: () => T('ayudante') + ' ' + (G.ayud + 1) + '/3', accion: () => T('contratar'), icono: () => B.LANA_ROJA });
}
const padActivo = p => p.visible() && p.precio() > 0;
function pagarPads(dt) {
  let sobre = null;
  for (const p of PADS) if (padActivo(p) && Math.abs(JUG.x - p.x) < 1.3 && Math.abs(JUG.z - p.z) < 1.3) { sobre = p; break; }
  if (!sobre || sobre.id !== JUG.padId) { JUG.padId = sobre ? sobre.id : null; JUG.tPad = 0.35; }
  VIVO.padActivo = sobre;
  if (!sobre || G.dinero <= 0) return;
  if (Math.hypot(JUG.vx, JUG.vz) > 1.6 && JUG.tPad > 0) { JUG.tPad = 0.35; return; }
  JUG.tPad -= dt;
  while (JUG.tPad <= 0 && G.dinero > 0) {
    JUG.tPad += 0.04;
    const precio = sobre.precio(), pagado = G.pads[sobre.id] || 0;
    const a = Math.min(G.dinero, precio - pagado, Math.max(1, Math.ceil(precio / 36)));
    if (a <= 0) break;
    G.dinero -= a; G.pads[sobre.id] = pagado + a;
    volar(B.BILLETE, -0.5, [JUG.x, JUG.y + 1.4, JUG.z], [sobre.x, SUELO + 0.1, sobre.z], 0.28, 1, null);
    Sonido.efecto('moneda', 0.35, 1.3, 0.05);
    if (G.pads[sobre.id] >= precio) { G.pads[sobre.id] = 0; usarPad(sobre); break; }
  }
}
function usarPad(p) {
  Sonido.efecto('desbloquear', 0.9); Sonido.vibrar([20, 20, 40]); mision('mejora', 1);
  for (let k = 0; k < 40; k++) confeti(p.x + rnd(-1, 1), SUELO + 0.5, p.z + rnd(-1, 1));
  if (p.m) {
    if (!G.gens[p.m]) {
      G.gens[p.m] = { nivel: 1, pila: 4 }; VIVO.gen[p.m] = { t: 0, enCamino: 0 };
      VIVO.armando.push(...listaDe(MAQUINAS[p.m].arma).sort((a, b) => a[1] - b[1]));
      UI.aviso(T('abierto', { g: T('gen.' + p.m).toUpperCase() }), 'oro');
    } else { G.gens[p.m].nivel++; UI.aviso(T('subio'), 'oro'); }
  } else if (p.id === 'mochila') { G.mochila++; UI.aviso(T('subio'), 'oro'); }
  else if (p.id === 'vel') { G.vel++; UI.aviso(T('subio'), 'oro'); }
  else if (p.id === 'ayudante') { AYUD.push(nuevoAyudante(G.ayud)); G.ayud++; UI.aviso(T('nuevoAy'), 'oro'); }
  guardar();
}
VIVO.armando = [];
// las máquinas nuevas se arman de a poco, con chispas
function armarMaquinas(dt) {
  if (!VIVO.armando.length) return;
  VIVO.armaT = (VIVO.armaT || 0) - dt;
  while (VIVO.armaT <= 0 && VIVO.armando.length) {
    VIVO.armaT += 0.03;
    const v = VIVO.armando.shift(); colocar([v], true);
    if (Paso.libre(JUG.x, JUG.z) === false) desatascar(JUG);
    if (VIVO.armando.length % 4 === 0) Sonido.efecto('pop', 0.35, 1.1 + vis() * 0.3, 0.04);
  }
}

// ---------- caminar: el constructor y los demás ----------
function libreR(x, z, r) { return Paso.libre(x - r, z - r) && Paso.libre(x + r, z - r) && Paso.libre(x - r, z + r) && Paso.libre(x + r, z + r); }
function moverConChoque(p, dx, dz, r) {
  if (libreR(p.x + dx, p.z, r)) p.x += dx;
  if (libreR(p.x, p.z + dz, r)) p.z += dz;
}
function desatascar(p) {
  if (libreR(p.x, p.z, 0.3)) return;
  const cx = Math.floor(p.x), cz = Math.floor(p.z);
  for (let r = 1; r < 6; r++) for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
    if (Paso.libre(cx + dx, cz + dz) && libreR(cx + dx + 0.5, cz + dz + 0.5, 0.3)) { p.x = cx + dx + 0.5; p.z = cz + dz + 0.5; return; }
  }
}
function moverJugador(dt, ix, iz) {
  const v = ECO.vel.v[G.vel] * multVel(), k = 1 - Math.exp(-dt * 14);
  JUG.vx += (ix * v - JUG.vx) * k; JUG.vz += (iz * v - JUG.vz) * k;
  moverConChoque(JUG, JUG.vx * dt, JUG.vz * dt, 0.3);
  const sp = Math.hypot(JUG.vx, JUG.vz);
  JUG.andar = clamp(sp / 3.2, 0, 1);
  if (sp > 0.4) JUG.yaw += angDif(JUG.yaw, Math.atan2(JUG.vx, JUG.vz)) * (1 - Math.exp(-dt * 15));
  const f0 = JUG.fase; JUG.fase += sp * dt * 2.3;
  if (Math.floor(f0 / PI) !== Math.floor(JUG.fase / PI) && sp > 1) {
    const piso = Mundo.get(Math.floor(JUG.x), SUELO - 1, Math.floor(JUG.z));
    Sonido.paso(piso !== B.PASTO);
    if (R.calidad >= 1 && vis() < 0.5) polvo(JUG.x, JUG.y + 0.05, JUG.z);
  }
  JUG.y = alturaPiso(JUG.x, JUG.z);
}
// lo que hace el constructor según dónde está parado
function interacciones(dt) {
  const P = PARTES[G.parte];
  // las pilas de las máquinas
  JUG.tPila -= dt;
  for (const m in G.gens) {
    const p = LUGAR.gen[m].pila;
    if (dist2(JUG.x, JUG.z, p[0], p[1]) > 1.6 * 1.6) { JUG.avisos[m] = 0; JUG.enPila = 0; continue; }
    JUG.enPila = (JUG.enPila || 0) + dt;
    while (JUG.tPila <= 0) {
      if (tomarDePila(JUG, m, capMochila())) { JUG.tPila += 0.07; Sonido.efecto('recoger', 0.6, 0.85 + JUG.carga.length * 0.025, 0.04); Sonido.vibrar(8); continue; }
      if (!JUG.avisos[m] && G.gens[m].pila > 0 && JUG.enPila > 0.4) {
        if (JUG.carga.length >= capMochila()) { UI.aviso(T('lleno'), 'rojo'); JUG.avisos[m] = 1; }
        else if (faltaJuntar(m) <= 0 && P) { UI.aviso(T('noHace'), 'gris'); JUG.avisos[m] = 1; }
      }
      break;
    }
    if (JUG.tPila < 0) JUG.tPila = 0;
  }
  // la obra
  const o = LUGAR.obra;
  if (Math.abs(JUG.x - o[0]) < 2.3 && Math.abs(JUG.z - o[1]) < 1.8) {
    JUG.tObra -= dt;
    while (JUG.tObra <= 0) { if (!entregarUno(JUG)) { JUG.tObra = 0; break; } JUG.tObra += 0.075; }
  } else JUG.tObra = 0;
  cobrarCaja(dt);
  pagarPads(dt);
  if (G.parte >= 1) padsActividad(dt);
}

// ---------- caminos (A* sobre la grilla de paso) ----------
const AST = { g: new Float32Array(MX * MZ), padre: new Int32Array(MX * MZ), marca: new Uint32Array(MX * MZ), cerr: new Uint32Array(MX * MZ), gen: 0, heap: [] };
function celdaLibre(x, z) {
  const cx = clamp(Math.floor(x), 0, MX - 1), cz = clamp(Math.floor(z), 0, MZ - 1);
  if (Paso.m[cz * MX + cx]) return cz * MX + cx;
  for (let r = 1; r < 8; r++) for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
    const X = cx + dx, Z = cz + dz;
    if (X >= 0 && Z >= 0 && X < MX && Z < MZ && Paso.m[Z * MX + X]) return Z * MX + X;
  }
  return -1;
}
function vista(ax, az, bx, bz) {
  const d = Math.hypot(bx - ax, bz - az), n = Math.ceil(d / 0.3);
  for (let i = 1; i < n; i++) { const t = i / n; if (!libreR(ax + (bx - ax) * t, az + (bz - az) * t, 0.28)) return false; }
  return true;
}
function buscarCamino(x0, z0, x1, z1) {
  const s = celdaLibre(x0, z0), e = celdaLibre(x1, z1);
  if (s < 0 || e < 0) return null;
  const A = AST, gen = ++A.gen, ex = e % MX, ez = (e / MX) | 0, H = A.heap; H.length = 0;
  const h = i => { const dx = Math.abs(i % MX - ex), dz = Math.abs(((i / MX) | 0) - ez); return Math.max(dx, dz) + 0.414 * Math.min(dx, dz); };
  const push = (i, f) => { H.push([f, i]); let k = H.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (H[p][0] <= H[k][0]) break; [H[p], H[k]] = [H[k], H[p]]; k = p; } };
  const pop = () => { const r = H[0], u = H.pop(); if (H.length) { H[0] = u; let k = 0; for (;;) { const a = 2 * k + 1, b = a + 1; let m = k; if (a < H.length && H[a][0] < H[m][0]) m = a; if (b < H.length && H[b][0] < H[m][0]) m = b; if (m === k) break; [H[m], H[k]] = [H[k], H[m]]; k = m; } } return r; };
  A.marca[s] = gen; A.g[s] = 0; A.padre[s] = -1; push(s, h(s));
  let hallado = false, vueltas = 0;
  while (H.length && vueltas++ < 6000) {
    const [, i] = pop();
    if (A.cerr[i] === gen) continue;
    A.cerr[i] = gen;
    if (i === e) { hallado = true; break; }
    const x = i % MX, z = (i / MX) | 0;
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dz) continue;
      const X = x + dx, Z = z + dz; if (X < 0 || Z < 0 || X >= MX || Z >= MZ) continue;
      const j = Z * MX + X; if (!Paso.m[j] || A.cerr[j] === gen) continue;
      if (dx && dz && (!Paso.m[z * MX + X] || !Paso.m[Z * MX + x])) continue;
      const g = A.g[i] + (dx && dz ? 1.414 : 1);
      if (A.marca[j] !== gen || g < A.g[j]) { A.marca[j] = gen; A.g[j] = g; A.padre[j] = i; push(j, g + h(j)); }
    }
  }
  if (!hallado) return null;
  const celdas = []; for (let i = e; i >= 0; i = A.padre[i]) celdas.push(i);
  celdas.reverse();
  const pts = celdas.map(i => [i % MX + 0.5, ((i / MX) | 0) + 0.5]);
  pts[pts.length - 1] = [x1, z1];
  // se acortan las esquinas mirando qué punto lejano se ve sin chocar
  const lisos = []; let a = [x0, z0], k = 0;
  while (k < pts.length) {
    let j = pts.length - 1;
    while (j > k && !vista(a[0], a[1], pts[j][0], pts[j][1])) j--;
    lisos.push(pts[j]); a = pts[j]; k = j + 1;
  }
  return lisos;
}
// sigue un camino; devuelve true al llegar
function seguir(p, dt, vel) {
  if (!p.camino || p.ci >= p.camino.length) { p.andar = acercar(p.andar || 0, 0, dt * 4); return true; }
  const w = p.camino[p.ci], dx = w[0] - p.x, dz = w[1] - p.z, d = Math.hypot(dx, dz);
  if (d < 0.15) { p.ci++; return p.ci >= p.camino.length; }
  const paso = Math.min(d, vel * dt), px = p.x, pz = p.z;
  moverConChoque(p, dx / d * paso, dz / d * paso, 0.25);
  const real = Math.hypot(p.x - px, p.z - pz);
  if (real < paso * 0.3) { p.atasco = (p.atasco || 0) + dt; if (p.atasco > 0.6) { p.atasco = 0; p.camino = buscarCamino(p.x, p.z, p.dest[0], p.dest[1]); p.ci = 0; desatascar(p); } } else p.atasco = 0;
  p.yaw += angDif(p.yaw, Math.atan2(dx, dz)) * (1 - Math.exp(-dt * 12));
  p.andar = acercar(p.andar || 0, 1, dt * 5); p.fase = (p.fase || 0) + real * 2.3;
  p.y = alturaPiso(p.x, p.z);
  return false;
}
function ir(p, x, z) { p.dest = [x, z]; p.camino = buscarCamino(p.x, p.z, x, z) || [[x, z]]; p.ci = 0; }

// ---------- los ayudantes: cargan lo que la obra pide ----------
function nuevoAyudante(i) {
  const c = LUGAR.ayudantes.casa;
  return { i, x: 16.5, z: c[3] + 1.6, y: SUELO, yaw: 0, carga: [], estado: 'pensar', m: null, t: 0, fase: 0, andar: 0, sem: 3 + i * 2, piel: PIELES['ayudante' + (i + 1)], camino: null, ci: 0 };
}
function pensarAyudante(a) {
  const P = PARTES[G.parte];
  if (a.carga.length && P && a.carga.some(c => faltaEntregar(c.m) > 0)) { a.estado = 'aObra'; ir(a, LUGAR.obra[0] + rnd(-1.4, 1.4), LUGAR.obra[1] + rnd(-0.8, 0.8)); return; }
  let mejor = null, mv = 0;
  if (P) for (const m in P.need) if (G.gens[m]) { const f = faltaJuntar(m); const v = f + (G.gens[m].pila > 0 ? 3 : 0) - AYUD.filter(b => b !== a && b.m === m && b.estado !== 'descansa').length * 4; if (f > 0 && v > mv) { mv = v; mejor = m; } }
  if (mejor) { a.m = mejor; a.estado = 'aPila'; const p = LUGAR.gen[mejor].pila; ir(a, p[0] + rnd(-0.5, 0.5), p[1] + rnd(-0.5, 0.5)); return; }
  a.m = null; a.estado = 'descansa'; a.t = 1.5;
  const pd = LUGAR.ayudantes.pad; ir(a, pd[0] - 2 + a.i * 2, pd[1] + 1.8);
}
function actualizarAyudante(a, dt) {
  const vel = ECO.ayudante.v;
  if (a.estado === 'pensar') return pensarAyudante(a);
  if (a.estado === 'aPila') {
    if (seguir(a, dt, vel)) { a.estado = 'carga'; a.t = 0; a.espera = 0; }
  } else if (a.estado === 'carga') {
    a.t -= dt;
    const p = LUGAR.gen[a.m].pila;
    a.yaw += angDif(a.yaw, Math.atan2(p[0] - a.x, p[1] - a.z)) * 0.2;
    if (a.t <= 0) {
      a.t = 0.12;
      if (!tomarDePila(a, a.m, ECO.ayudante.cap)) {
        a.espera += 0.12;
        if (a.carga.length >= ECO.ayudante.cap || faltaJuntar(a.m) <= 0 || (a.carga.length && a.espera > 1.5) || a.espera > 4) a.estado = 'pensar';
      } else a.espera = 0;
    }
  } else if (a.estado === 'aObra') {
    if (seguir(a, dt, vel)) { a.estado = 'entrega'; a.t = 0; }
  } else if (a.estado === 'entrega') {
    a.t -= dt;
    a.yaw += angDif(a.yaw, Math.atan2(24 - a.x, 22 - a.z)) * 0.2;
    if (a.t <= 0) { a.t = 0.1; if (!entregarUno(a)) a.estado = 'pensar'; }
  } else if (a.estado === 'descansa') {
    seguir(a, dt, vel * 0.7);
    a.t -= dt; if (a.t <= 0) a.estado = 'pensar';
  }
}

// ---------- los visitantes: vienen del muelle, miran la mansión, pagan y se van ----------
function actualizarVisitas(dt) {
  if (G.parte >= 1) {
    VIVO.visitaT -= dt;
    if (VIVO.visitaT <= 0) {
      const e = ECO.visita(G.parte); VIVO.visitaT = e.cada * azR(0.8, 1.2);
      if (VIS.length < 9) {
        const vip = G.parte >= 2 && az() < 0.1;
        const v = { x: 24 + azR(-0.6, 0.6), z: 70.4, y: SUELO, yaw: PI, estado: 'llega', t: 0, fase: 0, andar: 0, sem: az() * 9, vip, piel: vip ? PIELES.vip : PIELES['visitante' + (1 + Math.floor(az() * 6))], paga: Math.round(e.paga * multPaga() * (vip ? 5 : 1)), camino: null, ci: 0 };
        let mx = 20 + az() * 8, mz = 32.6 + az() * 1.4; ir(v, mx, mz); VIS.push(v);
      }
    }
  }
  for (let i = 0; i < VIS.length; i++) {
    const v = VIS[i];
    if (v.estado === 'llega') { if (seguir(v, dt, 2.6)) { v.estado = 'mira'; v.t = 2.5 + az() * 2; } }
    else if (v.estado === 'mira') {
      v.yaw += angDif(v.yaw, Math.atan2(24 - v.x, 19 - v.z)) * 0.1; v.mirarAbajo = -0.25;
      v.t -= dt;
      if (v.t < 1.2 && !v.foto) { v.foto = 1; destello(v.x, v.y + 1.6, v.z); }
      if (v.t <= 0) { v.mirarAbajo = 0; v.estado = 'paga'; const c = LUGAR.caja; ir(v, c[0] + 1.9, c[1] + 0.6 + az() * 0.8); }
    } else if (v.estado === 'paga') {
      if (seguir(v, dt, 2.6)) {
        G.caja += v.paga; VIVO.cajaVol += v.paga; G.visitas++; mision('visitas', 1);
        if (v.vip) { for (let k = 0; k < 16; k++) chispas(v.x, v.y + 1.5, v.z, '#ffd34a', 1, 2.5); UI.aviso('VIP +$' + fmt(v.paga), 'oro'); }
        const pg = v.paga;
        volar(B.BILLETE, -0.5, [v.x, v.y + 1.3, v.z], () => posCajaArriba(), 0.45, 1.2, () => { VIVO.cajaVol -= pg; });
        v.estado = 'vuelve'; v.festejo = 0.6; ir(v, 24 + azR(-0.6, 0.6), 70.6);
      }
    } else if (v.estado === 'vuelve') {
      if (v.festejo > 0) { v.festejo -= dt; continue; }
      if (seguir(v, dt, 2.6)) { VIS[i] = VIS[VIS.length - 1]; VIS.pop(); i--; }
    }
  }
}

// ---------- lo que vuela (bloques, billetes) ----------
function volar(b, esc, o, d, dur, alto, al, demora) {
  VOL.push({ b, esc, o, d, t0: VIVO.t + (demora || 0), dur, alto, al, giro: (vis() - 0.5) * 6 });
}
function actualizarVuelos() {
  for (let i = 0; i < VOL.length; i++) {
    const v = VOL[i];
    if (VIVO.t >= v.t0 + v.dur) { VOL[i] = VOL[VOL.length - 1]; VOL.pop(); i--; if (v.al) v.al(); }
  }
}
function posVuelo(v, out) {
  const k = clamp((VIVO.t - v.t0) / v.dur, 0, 1), d = typeof v.d === 'function' ? v.d() : v.d, o = typeof v.o === 'function' ? v.o() : v.o;
  const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
  out[0] = lerp(o[0], d[0], e); out[1] = lerp(o[1], d[1], e) + v.alto * 4 * k * (1 - k); out[2] = lerp(o[2], d[2], e);
  return k;
}

// ---------- adónde tiene que ir el jugador ahora ----------
function objetivo() {
  const P = PARTES[G.parte];
  if (!P) {
    if (G.caja > 0) return { tipo: 'plata', x: LUGAR.caja[0], z: LUGAR.caja[1] };
    for (const p of PADS) if (padActivo(p) && G.dinero >= p.precio() - (G.pads[p.id] || 0)) return { tipo: 'mejora', x: p.x, z: p.z };
    return null;
  }
  if (JUG.carga.some(c => faltaEntregar(c.m) > 0)) return { tipo: 'entrega', x: LUGAR.obra[0], z: LUGAR.obra[1] };
  const mats = Object.keys(P.need).filter(m => faltaJuntar(m) > 0);
  const abiertos = mats.filter(m => G.gens[m]);
  if (abiertos.length && JUG.carga.length < capMochila()) {
    abiertos.sort((a, b) => (G.gens[b].pila > 0) - (G.gens[a].pila > 0) || dist2(JUG.x, JUG.z, ...LUGAR.gen[a].pila) - dist2(JUG.x, JUG.z, ...LUGAR.gen[b].pila));
    const m = abiertos[0], p = LUGAR.gen[m].pila;
    return { tipo: 'junta', m, x: p[0], z: p[1] };
  }
  const cerrado = mats.find(m => !G.gens[m]);
  if (cerrado) {
    const pad = PADS.find(p => p.m === cerrado), falta = pad.precio() - (G.pads[pad.id] || 0);
    if (G.dinero >= falta) return { tipo: 'desbloquear', g: cerrado, x: pad.x, z: pad.z };
    return { tipo: G.caja > 0 ? 'plata' : 'espera', x: LUGAR.caja[0], z: LUGAR.caja[1] };
  }
  if (JUG.carga.length) return { tipo: 'entrega', x: LUGAR.obra[0], z: LUGAR.obra[1] };
  if (G.caja > 0) return { tipo: 'plata', x: LUGAR.caja[0], z: LUGAR.caja[1] };
  return null;
}
function textoObjetivo(o) {
  if (!o) return '';
  if (o.tipo === 'junta') return T('obj.junta', { m: T('mat.' + o.m) });
  if (o.tipo === 'desbloquear') return T('obj.desbloquear', { g: T('gen.' + o.g) });
  return T('obj.' + o.tipo);
}

// ---------- un paso de la simulación ----------
function actualizarJuego(dt, ix, iz) {
  VIVO.t += dt; G.jugado += dt;
  moverJugador(dt, ix, iz);
  if (!libreR(JUG.x, JUG.z, 0.3)) desatascar(JUG);
  producir(dt);
  interacciones(dt);
  armarMaquinas(dt);
  for (const a of AYUD) actualizarAyudante(a, dt);
  actualizarVisitas(dt);
  for (const k in G.boosts) if (G.boosts[k] > 0) G.boosts[k] = Math.max(0, G.boosts[k] - dt);
  actualizarMascota(dt);
  actualizarCofres(dt);
  for (const v of VIS) if (v.vip && vis() < dt * 6) chispas(v.x, v.y + 1.2, v.z, '#ffe27a', 1, 0.8);
  actualizarVuelos();
  actualizarParticulas(dt);
  // humo de las máquinas y de las chimeneas
  VIVO.humoT -= dt;
  if (VIVO.humoT <= 0) {
    VIVO.humoT = 0.25;
    for (const m in G.gens) { const M = MAQUINAS[m]; if (m === 'vidrio' || m === 'oro' || vis() < 0.3) humo(M.humo[0], M.humo[1], M.humo[2], M.colHumo); }
    if (G.parte > 8) for (const cx of [16, 32]) humo(cx, 23.2, 15, '#d8d8d8');
  }
  VIVO.objT -= dt;
  if (VIVO.objT <= 0) { VIVO.objT = 0.25; VIVO.obj = objetivo(); }
  if (VIVO.festejo > 0) VIVO.festejo -= dt;
  VIVO.guardarT += dt;
  if (VIVO.guardarT > 5) { VIVO.guardarT = 0; guardar(); }
}

// MANSION BUILDER — la escena de cada cuadro: partículas, cubos sueltos, calcas del piso, personajes y cámara
// ---------- partículas (cuadraditos) ----------
const PT = (() => { const n = 1100, f = () => new Float32Array(n); return { n: 0, cap: n, x: f(), y: f(), z: f(), vx: f(), vy: f(), vz: f(), t: f(), vida: f(), tam: f(), r: f(), g: f(), b: f(), grav: f(), crece: f() }; })();
function particula(x, y, z, vx, vy, vz, vida, tam, c, grav, crece) {
  if (PT.n >= Math.min(PT.cap, R.maxPart)) return;
  const i = PT.n++;
  PT.x[i] = x; PT.y[i] = y; PT.z[i] = z; PT.vx[i] = vx; PT.vy[i] = vy; PT.vz[i] = vz; PT.t[i] = 0; PT.vida[i] = vida; PT.tam[i] = tam;
  PT.r[i] = c[0]; PT.g[i] = c[1]; PT.b[i] = c[2]; PT.grav[i] = grav; PT.crece[i] = crece || 0;
}
const PT_K = ['x', 'y', 'z', 'vx', 'vy', 'vz', 't', 'vida', 'tam', 'r', 'g', 'b', 'grav', 'crece'];
function actualizarParticulas(dt) {
  for (let i = 0; i < PT.n; i++) {
    PT.t[i] += dt;
    if (PT.t[i] >= PT.vida[i]) {
      const j = --PT.n;
      if (i !== j) for (let q = 0; q < PT_K.length; q++) { const A = PT[PT_K[q]]; A[i] = A[j]; }
      i--; continue;
    }
    PT.vy[i] -= PT.grav[i] * dt;
    const a = Math.exp(-dt * 1.5);
    PT.vx[i] *= a; PT.vz[i] *= a;
    PT.x[i] += PT.vx[i] * dt; PT.y[i] += PT.vy[i] * dt; PT.z[i] += PT.vz[i] * dt;
    if (PT.y[i] < SUELO + 0.04 && PT.grav[i] > 0) { PT.y[i] = SUELO + 0.04; PT.vy[i] *= -0.3; PT.vx[i] *= 0.6; PT.vz[i] *= 0.6; }
  }
}
const _cols = {};
const c3 = h => _cols[h] || (_cols[h] = col3(h));
function chispas(x, y, z, col, n, v) { const c = c3(col); for (let k = 0; k < n; k++) particula(x, y, z, rnd(-v, v), rnd(0.5, 1.6) * v, rnd(-v, v), rnd(0.35, 0.7), rnd(0.09, 0.16), c, 9); }
const CONFETI = ['#ff4d6d', '#ffd23f', '#3ec1f3', '#7bd88f', '#c77dff', '#ff9f1c', '#ffffff'];
function confeti(x, y, z) { particula(x, y, z, rnd(-3, 3), rnd(3, 8), rnd(-3, 3), rnd(1.4, 2.4), rnd(0.12, 0.2), c3(CONFETI[(vis() * CONFETI.length) | 0]), 5); }
function polvo(x, y, z) { const c = c3('#d9cdb0'); particula(x + rnd(-0.2, 0.2), y + 0.1, z + rnd(-0.2, 0.2), rnd(-0.4, 0.4), rnd(0.4, 0.9), rnd(-0.4, 0.4), rnd(0.35, 0.55), rnd(0.12, 0.2), c, 1.5, 0.25); }
function humo(x, y, z, col) { particula(x + rnd(-0.2, 0.2), y, z + rnd(-0.2, 0.2), rnd(-0.15, 0.15) + 0.25, rnd(0.8, 1.3), rnd(-0.15, 0.15) - 0.1, rnd(1.6, 2.4), rnd(0.2, 0.3), c3(col), -0.1, 0.35); }
function destello(x, y, z) { particula(x, y, z, 0, 0.2, 0, 0.18, 0.7, [1, 1, 0.95], 0, 1.5); for (let k = 0; k < 5; k++) particula(x, y, z, rnd(-1.5, 1.5), rnd(0.5, 2), rnd(-1.5, 1.5), 0.4, 0.08, [1, 1, 0.8], 3); }
// el color promedio de un bloque (para las chispas)
const _colB = [];
function colorBloque(b) {
  if (_colB[b]) return _colB[b];
  const capa = BLOQ[b].f[1], d = TEX.datos, base = capa * 16 * 16 * 4; let r = 0, g = 0, bb = 0, n = 0;
  for (let i = 0; i < 256; i++) { const k = base + i * 4; if (d[k + 3] < 128) continue; r += d[k]; g += d[k + 1]; bb += d[k + 2]; n++; }
  n = n || 1; return (_colB[b] = rgbHex([r / n * 1.15, g / n * 1.15, bb / n * 1.15]));
}

// ---------- la cámara: de costado-arriba, sigue al constructor ----------
const CAM = { x: LUGAR.inicio[0], z: LUGAR.inicio[1], yaw: 0.5, pitch: 0.84, fov: 0.6, intro: 0, temblor: 0, dist: 40, zoom: 1 };
function distCamara() { const asp = R.w / R.h, tg = 2 * Math.tan(CAM.fov / 2); return clamp(Math.max(11.5 / (tg * asp), 12.5 / tg), 14, 60) * CAM.zoom; }
function camaraJuego(dt) {
  // cerca de la obra la cámara se corre hacia la mansión y se aleja un poco, para ver cómo crece
  const k = 1 - Math.exp(-dt * 5), cerca = clamp((44 - JUG.z) / 10, 0, 1) * (Math.abs(JUG.x - 24) < 16 ? 1 : 0);
  CAM.cerca = lerp(CAM.cerca || 0, cerca, 1 - Math.exp(-dt * 2));
  CAM.x += (lerp(JUG.x, 24, CAM.cerca * 0.5) - CAM.x) * k; CAM.z += (JUG.z - 0.4 - CAM.cerca * 7 - CAM.z) * k;
  let dist = distCamara() * (1 + CAM.cerca * 0.75), tx = CAM.x, tz = CAM.z, ty = SUELO + 0.6 + CAM.cerca * 3, pitch = CAM.pitch, yaw = CAM.yaw;
  if (CAM.intro > 0) {
    // entrada: de arriba de la mansión baja hasta el constructor
    const e = suave(1 - CAM.intro / 2.6);
    tx = lerp(24, CAM.x, e); tz = lerp(24, CAM.z, e); dist = lerp(dist * 1.9, dist, e); pitch = lerp(1.25, CAM.pitch, e); yaw = lerp(-0.4, CAM.yaw, e);
    CAM.intro = Math.max(0, CAM.intro - dt);
  }
  CAM.dist = dist;
  R.camara(tx, ty, tz, dist, pitch, yaw, CAM.fov);
  R.nieblaD[0] = dist + 12; R.nieblaD[1] = 0.02;
}

// ---------- el cuadro: llena los búferes de instancias y dibuja ----------
const ESC = { personajes: [], nCubos: 0, nCalcas: 0, nPart: 0, fantasma: null, colFantasma: [0.45, 0.85, 1.0] };
const _v = [0, 0, 0];
function personaje(p, piel, t, escala) {
  p.escala = escala; p.huesos = poseHuesos(p, t);
  ESC.personajes.push({ x: p.x, z: p.z, huesos: p.huesos, malla: PJ.malla, piel, destello: p.destello || 0 });
}
function armarEscena(t) {
  const E = ESC;
  E.personajes.length = 0;
  const pj = JUG;
  personaje({ x: pj.x, y: pj.y, z: pj.z, yaw: pj.yaw, fase: pj.fase, andar: pj.andar, carga: pj.carga.length > 0, sem: 0, huesos: pj.huesos || (pj.huesos = new Float32Array(128)), festejo: VIVO.festejo > 0 && !pj.carga.length }, PIELES[G.traje] != null ? PIELES[G.traje] : PIELES.jugador, t, 0.92);
  for (const a of AYUD) personaje({ x: a.x, y: a.y, z: a.z, yaw: a.yaw, fase: a.fase, andar: a.andar, carga: a.carga.length > 0, sem: a.sem, huesos: a.huesos || (a.huesos = new Float32Array(128)) }, a.piel, t, 0.86);
  for (const v of VIS) personaje({ x: v.x, y: v.y, z: v.z, yaw: v.yaw, fase: v.fase, andar: v.andar, sem: v.sem, mirarAbajo: v.mirarAbajo || 0, festejo: v.festejo > 0, huesos: v.huesos || (v.huesos = new Float32Array(128)) }, v.piel, t, 0.84);
  // cubos sueltos
  const D = R.cubo.inst.datos, cap = R.cubo.inst.cap; let n = 0;
  const cubo = (x, y, z, esc, rot, b) => { if (n >= cap) return; const k = n * 6; D[k] = x; D[k + 1] = y; D[k + 2] = z; D[k + 3] = esc; D[k + 4] = rot; D[k + 5] = b; n++; };
  for (const m in G.gens) { const e = G.gens[m], b = BLOQUE_DE[m]; for (let i = 0; i < e.pila; i++) { const p = posPila(m, i); cubo(p[0], p[1], p[2], 0.5, 0, b); } }
  const cargas = [JUG, ...AYUD];
  for (const c of cargas) for (let i = 0; i < c.carga.length; i++) {
    const it = c.carga[i], dst = posCarga(c, i), k = clamp((t - it.t0) / 0.22, 0, 1);
    if (k < 1) { const e = k * (2 - k); cubo(lerp(it.o[0], dst[0], e), lerp(it.o[1], dst[1], e) + 1.2 * 4 * k * (1 - k), lerp(it.o[2], dst[2], e), 0.36, c.yaw * k, BLOQUE_DE[it.m]); }
    else cubo(dst[0], dst[1], dst[2], 0.36, c.yaw, BLOQUE_DE[it.m]);
  }
  for (const v of VOL) { if (t < v.t0) continue; const k = posVuelo(v, _v); cubo(_v[0], _v[1], _v[2], v.esc, v.giro * k, v.b); }
  dibujarMascota(cubo, t); dibujarCofres(cubo, t);
  const nb = billetesCaja(), cj = LUGAR.caja;
  for (let i = 0; i < nb; i++) { const k = i % 9, f = Math.floor(i / 9); cubo(cj[0] + ((k % 3) - 1) * 0.62, SUELO + 0.1 + f * 0.17, cj[1] + (Math.floor(k / 3) - 1) * 0.42, -0.55, (hash2(i, 7) - 0.5) * 0.2, B.BILLETE); }
  E.nCubos = n;
  // calcas del piso
  const C = R.quadCalca.inst.datos, capC = R.quadCalca.inst.cap; let nc = 0;
  const calca = (x, y, z, w, d, tipo, prog, extra) => { if (nc >= capC) return; const k = nc * 8; C[k] = x; C[k + 1] = y; C[k + 2] = z; C[k + 3] = w; C[k + 4] = d; C[k + 5] = tipo; C[k + 6] = prog; C[k + 7] = extra; nc++; };
  for (const p of E.personajes) calca(p.x, SUELO + 0.02, p.z, 1.0, 1.0, 0, 0, 0);
  const o = LUGAR.obra; if (PARTES[G.parte]) calca(o[0], SUELO + 0.03, o[1], 4.4, 3.4, 2, 0, 0);
  calca(cj[0], SUELO + 0.03, cj[1], 2.9, 2.9, 3, 0, 0);
  for (const m in G.gens) { const p = LUGAR.gen[m].pila; calca(p[0], SUELO + 0.025, p[1], 3.2, 3.2, 4, 0, m.length); }
  for (const p of PADS) if (padActivo(p)) calca(p.x, SUELO + 0.03, p.z, 2.6, 2.6, 1, (G.pads[p.id] || 0) / p.precio(), 0);
  if (G.parte >= 1) for (const a of ACT_PADS) calca(a.x, alturaPiso(a.x, a.z) + 0.03, a.z, 2.4, 2.4, 5, 0, 0);
  if (G.mascota) calca(MASC.x, MASC.y + 0.02, MASC.z, 0.7, 0.7, 0, 0, 0);
  if (COFRES.uno) calca(COFRES.uno.x, SUELO + 0.02, COFRES.uno.z, 1.2, 1.2, 4, 0, 1);
  E.nCalcas = nc;
  // partículas
  const Pd = R.quadPart.inst.datos; let np = 0;
  for (let i = 0; i < PT.n && np < 1200; i++) {
    const k = np * 8, vida = PT.t[i] / PT.vida[i];
    Pd[k] = PT.x[i]; Pd[k + 1] = PT.y[i]; Pd[k + 2] = PT.z[i]; Pd[k + 3] = PT.tam[i] * (1 + PT.crece[i] * PT.t[i] * 4) * (vida > 0.75 ? (1 - vida) * 4 : 1);
    Pd[k + 4] = PT.r[i]; Pd[k + 5] = PT.g[i]; Pd[k + 6] = PT.b[i]; Pd[k + 7] = PT.crece[i] > 0 ? 0.55 * (1 - vida) : 1;
    np++;
  }
  E.nPart = np;
  if (OBRA.fantSucio) armarFantasma();
  E.fantasma = OBRA.fantasma;
  const pulso = 0.85 + 0.15 * Math.sin(t * 3);
  E.colFantasma[0] = 0.45 * pulso; E.colFantasma[1] = 0.85 * pulso; E.colFantasma[2] = 1.0;
}
function dibujarCuadro(t) {
  armarEscena(t);
  R.actualizarTrozos(EQUIPO.movil ? 2 : 4);
  R.dibujar(ESC, t);
}

// MANSION BUILDER — los anuncios con premio. En TikTok Minis usa TTMinis.game.createRewardedVideoAd (una instancia
// por anuncio: TikTok no deja mostrar dos veces la misma); también CrazyGames y Poki si su SDK está cargado.
// Sin ninguno (el HTML suelto) muestra un anuncio de prueba de 3 segundos para que todo se pueda probar.
const ANUNCIO_ID = { tiktok: 'PONER_ID_DEL_ANUNCIO_CON_PREMIO' };   // del Developer Portal de TikTok (In-App Ads)
const Anuncios = {
  ocupado: false, prueba: null,
  plataforma() {
    if (typeof TTMinis !== 'undefined' && TTMinis.game && TTMinis.game.createRewardedVideoAd) return 'tiktok';
    if (typeof window !== 'undefined' && window.CrazyGames && window.CrazyGames.SDK && window.CrazyGames.SDK.ad) return 'crazy';
    if (typeof window !== 'undefined' && window.PokiSDK && window.PokiSDK.rewardedBreak) return 'poki';
    return 'prueba';
  },
  // pide un anuncio con premio; listo(true) solo si lo vio entero
  premio(listo) {
    if (this.ocupado) return;
    this.ocupado = true; UI.joy.activo = false; UI.joy.vx = UI.joy.vy = 0;
    if (Sonido.bMus) Sonido.bMus.gain.setTargetAtTime(0, Sonido.ctx.currentTime, 0.1);
    if (Sonido.bSfx) Sonido.bSfx.gain.setTargetAtTime(0, Sonido.ctx.currentTime, 0.05);
    const fin = ok => {
      if (!this.ocupado) return;
      this.ocupado = false;
      Sonido.ponerMusica(AJ.musica); Sonido.ponerSfx(AJ.sonido);
      if (ok) { G.stats.anuncios++; mision('anuncio', 1); Sonido.efecto('desbloquear', 0.6); }
      else UI.aviso(T('sinAnuncio'), 'gris');
      listo(!!ok); guardar();
    };
    const p = this.plataforma();
    try {
      if (p === 'tiktok') {
        const ad = TTMinis.game.createRewardedVideoAd({ adUnitId: ANUNCIO_ID.tiktok });
        const cerrar = r => { ad.offClose(cerrar); ad.offError(error); fin(!!(r && r.isEnded)); };
        const error = () => { ad.offClose(cerrar); ad.offError(error); fin(false); };
        ad.onClose(cerrar); ad.onError(error);
        ad.show().catch(error);
      } else if (p === 'crazy') {
        window.CrazyGames.SDK.ad.requestAd('rewarded', { adFinished: () => fin(true), adError: () => fin(false) });
      } else if (p === 'poki') {
        window.PokiSDK.rewardedBreak().then(v => fin(v)).catch(() => fin(false));
      } else this.prueba = { t: 0, dura: PRUEBA ? 0.2 : 3, fin };
    } catch (e) { fin(false); }
  },
  // el anuncio de prueba (solo en el HTML suelto): pantalla oscura con cuenta regresiva
  pasar(dt) {
    const a = this.prueba; if (!a) return;
    a.t += dt;
    if (a.t >= a.dura) { this.prueba = null; a.fin(true); }
  },
  dibujar(g) {
    const a = this.prueba; if (!a) return;
    const U = UI.U, Wc = CSSW, Hc = CSSH;
    g.fillStyle = '#0b0f1a'; g.fillRect(0, 0, Wc, Hc);
    const k = a.t / a.dura;
    texto(g, T('anuncio'), Wc / 2, Hc * 0.42, 22 * U, '#ffffff', null);
    texto(g, T('anuncioPrueba'), Wc / 2, Hc * 0.42 + 30 * U, 11 * U, 'rgba(255,255,255,0.6)', null);
    g.fillStyle = '#26324a'; rr(g, Wc / 2 - 110 * U, Hc * 0.52, 220 * U, 10 * U, 5 * U); g.fill();
    g.fillStyle = '#ffd34a'; rr(g, Wc / 2 - 110 * U, Hc * 0.52, 220 * U * k, 10 * U, 5 * U); g.fill();
    texto(g, String(Math.ceil(a.dura - a.t)), Wc / 2, Hc * 0.52 + 34 * U, 16 * U, '#ffffff', null);
  },
};
// un premio que se puede pedir por anuncio, con tope por día (clave → cuántos por día)
const TOPES_AD = { gemas: 5, ruleta: 3, cebo: 3, torre: 5, excava: 3, completar: 6, boost: 8 };
function adHoy(clave) { if (G.adDia !== hoy()) { G.adDia = hoy(); G.adUsos = {}; } return G.adUsos[clave] || 0; }
function adQueda(clave) { return (TOPES_AD[clave] || 99) - adHoy(clave); }
function conAnuncio(clave, alPremio) {
  if (adQueda(clave) <= 0) { UI.aviso(T('volveManana'), 'gris'); return; }
  Anuncios.premio(ok => { if (!ok) return; adHoy(clave); G.adUsos[clave] = (G.adUsos[clave] || 0) + 1; alPremio(); });
}

// MANSION BUILDER — la tienda: trajes, mascotas (te siguen y ayudan), decoración (aparece en la isla y sube lo que pagan
// los visitantes) y boosts. Algunas cosas se pagan con plata, otras con gemas y otras mirando anuncios.
const TRAJES = [
  { id: 'jugador' }, { id: 'granjero', plata: 1500 }, { id: 'chef', plata: 4000 }, { id: 'surfista', ads: 3 }, { id: 'vaquero', plata: 9000 },
  { id: 'pirata', gemas: 40 }, { id: 'ninja', ads: 5 }, { id: 'astronauta', gemas: 90 }, { id: 'heroe', gemas: 120 }, { id: 'rey', gemas: 200 },
];
// mascotas hechas de cubitos: [dx, dy, dz, tamaño, bloque, parte] (mirando a +z)
const MASCOTAS = [
  { id: 'perro', gemas: 30, partes: [[0, 0.34, 0, 0.36, 'LANA_MARRON'], [0, 0.62, 0.26, 0.3, 'LANA_MARRON'], [0, 0.58, 0.44, 0.12, 'LANA_NEGRA'], [-0.11, 0.8, 0.22, 0.1, 'LANA_NEGRA'], [0.11, 0.8, 0.22, 0.1, 'LANA_NEGRA'], [0, 0.5, -0.22, 0.1, 'LANA_MARRON', 'cola'], [-0.1, 0.08, 0.1, 0.12, 'LANA_MARRON', 'pata'], [0.1, 0.08, -0.1, 0.12, 'LANA_MARRON', 'pata'], [0.1, 0.08, 0.1, 0.12, 'LANA_MARRON', 'pata2'], [-0.1, 0.08, -0.1, 0.12, 'LANA_MARRON', 'pata2']] },
  { id: 'gato', plata: 6000, partes: [[0, 0.3, 0, 0.32, 'LANA_NARANJA'], [0, 0.56, 0.22, 0.28, 'LANA_NARANJA'], [-0.09, 0.74, 0.2, 0.08, 'LANA_NARANJA'], [0.09, 0.74, 0.2, 0.08, 'LANA_NARANJA'], [0, 0.6, -0.22, 0.09, 'LANA_NARANJA', 'cola'], [0, 0.72, -0.28, 0.09, 'LANA_BLANCA', 'cola'], [-0.09, 0.07, 0.09, 0.1, 'LANA_BLANCA', 'pata'], [0.09, 0.07, -0.09, 0.1, 'LANA_NARANJA', 'pata'], [0.09, 0.07, 0.09, 0.1, 'LANA_BLANCA', 'pata2'], [-0.09, 0.07, -0.09, 0.1, 'LANA_NARANJA', 'pata2']] },
  { id: 'gallina', gemas: 60, partes: [[0, 0.28, 0, 0.3, 'LANA_BLANCA'], [0, 0.52, 0.12, 0.2, 'LANA_BLANCA'], [0, 0.66, 0.12, 0.08, 'LANA_ROJA'], [0, 0.5, 0.25, 0.08, 'LANA_AMARILLA'], [0, 0.36, -0.18, 0.14, 'LANA_BLANCA', 'cola'], [-0.06, 0.06, 0, 0.07, 'LANA_AMARILLA', 'pata'], [0.06, 0.06, 0, 0.07, 'LANA_AMARILLA', 'pata2']] },
  { id: 'cerdito', ads: 6, partes: [[0, 0.3, 0, 0.36, 'LANA_ROSA'], [0, 0.42, 0.26, 0.26, 'LANA_ROSA'], [0, 0.38, 0.42, 0.12, 'LANA_ROJA'], [-0.08, 0.58, 0.24, 0.07, 'LANA_ROSA'], [0.08, 0.58, 0.24, 0.07, 'LANA_ROSA'], [0, 0.4, -0.22, 0.07, 'LANA_ROSA', 'cola'], [-0.1, 0.07, 0.1, 0.11, 'LANA_ROSA', 'pata'], [0.1, 0.07, -0.1, 0.11, 'LANA_ROSA', 'pata'], [0.1, 0.07, 0.1, 0.11, 'LANA_ROSA', 'pata2'], [-0.1, 0.07, -0.1, 0.11, 'LANA_ROSA', 'pata2']] },
];
const DECOS = [
  { id: 'estatua', plata: 400, icono: 'ORO' }, { id: 'palmeras', plata: 900, icono: 'HOJAS' }, { id: 'flamencos', plata: 1500, icono: 'LANA_ROSA' },
  { id: 'auto', plata: 3000, icono: 'LANA_ROJA' }, { id: 'helados', plata: 5000, icono: 'LANA_CELESTE' }, { id: 'barco', plata: 8000, icono: 'TABLAS_OSC' },
  { id: 'faro', plata: 12000, icono: 'LAMPARA' }, { id: 'globo', gemas: 100, icono: 'LANA_AMARILLA' },
];
const BOOSTS = [
  { id: 'x2', dura: 300, gemas: 12, icono: 'ORO', img: 'rayo' }, { id: 'vel', dura: 180, gemas: 6, icono: 'LANA_CELESTE', img: 'reloj' }, { id: 'iman', dura: 300, gemas: 8, icono: 'HIERRO' },
  { id: 'llenar', gemas: 5, icono: 'CAJA' }, { id: 'pack', gemas: 25, icono: 'BILLETE', img: 'moneda' }, { id: 'gemasAd', icono: 'CRISTAL_AZUL', img: 'gema' },
];
// una "unidad" de plata: lo que dejan los visitantes en un minuto según cuánto va de la mansión (premios que escalan)
function unidadPlata() { const n = clamp(G.parte, 1, PARTES.length), e = ECO.visita(n); return Math.max(25, Math.round(e.paga / e.cada * 60 / 5) * 5); }
function multPaga() { return (G.boosts.x2 > 0 ? 2 : 1) * (1 + 0.05 * G.decos.length) * (G.mascota === 'cerdito' ? 1.1 : 1) * (1 + 0.5 * (G.estrellas || 0)); }
function multVel() { return (G.boosts.vel > 0 ? 1.4 : 1) * (G.mascota === 'perro' ? 1.1 : 1); }
function precioTxt(it) { return it.plata ? fmt(it.plata) : it.gemas ? String(it.gemas) : ''; }
// compra con plata, gemas o anuncios (los de anuncios suman de a uno)
function pagar(it, clave, alComprar) {
  if (it.ads) {
    conAnuncio('compra', () => { G.adProg[clave] = (G.adProg[clave] || 0) + 1; if (G.adProg[clave] >= it.ads) alComprar(); else { UI.aviso(G.adProg[clave] + '/' + it.ads, 'oro'); guardar(); } });
    return;
  }
  if (it.plata && G.dinero < it.plata) { UI.aviso(T('faltaPlata'), 'rojo'); Sonido.efecto('clic', 0.4, 0.6); return; }
  if (it.gemas && G.gemas < it.gemas) { UI.aviso(T('faltaGemas'), 'rojo'); Sonido.efecto('clic', 0.4, 0.6); abrirTienda('boosts'); return; }
  if (it.plata) G.dinero -= it.plata;
  if (it.gemas) { G.gemas -= it.gemas; UI.pulsoGemas(); }
  alComprar();
}
function comprarTraje(it) {
  if (G.trajes.includes(it.id)) { G.traje = it.id; Sonido.efecto('clic', 0.6); guardar(); return; }
  pagar(it, 'traje_' + it.id, () => { G.trajes.push(it.id); G.traje = it.id; festejoCompra(); });
}
function comprarMascota(it) {
  if (G.mascotas.includes(it.id)) { G.mascota = G.mascota === it.id ? null : it.id; ponerMascota(); Sonido.efecto('clic', 0.6); guardar(); return; }
  pagar(it, 'masc_' + it.id, () => { G.mascotas.push(it.id); G.mascota = it.id; ponerMascota(); festejoCompra(); });
}
function comprarDeco(it) {
  if (G.decos.includes(it.id)) return;
  pagar(it, 'deco_' + it.id, () => {
    G.decos.push(it.id);
    VIVO.armando.push(...listaDe(DECO_ARMA[it.id]).sort((a, b) => a[1] - b[1]));
    festejoCompra(); cerrarPanel(); UI.aviso(T('deco.' + it.id).toUpperCase() + ' +5%', 'oro');
  });
}
function usarBoost(it, conAd) {
  const aplicar = () => {
    if (it.dura) G.boosts[it.id] = Math.max(G.boosts[it.id], 0) + it.dura;
    else if (it.id === 'llenar') { for (const m in G.gens) G.gens[m].pila = ECO.tope[G.gens[m].nivel - 1]; }
    else if (it.id === 'pack') { G.dinero += unidadPlata() * 5; UI.pulsoPlata(); }
    else if (it.id === 'gemasAd') { G.gemas += 5; UI.pulsoGemas(); }
    Sonido.efecto('desbloquear', 0.8); UI.aviso(T('boost.' + it.id).toUpperCase() + '!', 'oro'); guardar();
  };
  if (it.id === 'gemasAd') return conAnuncio('gemas', aplicar);
  if (conAd) return conAnuncio('boost', aplicar);
  pagar({ gemas: it.gemas }, '', aplicar);
}
function festejoCompra() {
  Sonido.efecto('fanfarria', 0.7); Sonido.vibrar([20, 30, 20]);
  for (let k = 0; k < 40; k++) confeti(JUG.x + rnd(-1, 1), JUG.y + 2, JUG.z + rnd(-1, 1));
  guardar();
}

// ---------- la mascota que te sigue ----------
const MASC = { x: 0, z: 0, y: SUELO, yaw: 0, salto: 0, andar: 0, huevoT: 60, huevos: [] };
function ponerMascota() { MASC.x = JUG.x - 1; MASC.z = JUG.z + 1; MASC.yaw = JUG.yaw; }
function actualizarMascota(dt) {
  if (!G.mascota) return;
  const s = Math.sin(JUG.yaw), c = Math.cos(JUG.yaw);
  const tx = JUG.x - s * 1.1 + c * 0.7, tz = JUG.z - c * 1.1 - s * 0.7;
  const dx = tx - MASC.x, dz = tz - MASC.z, d = Math.hypot(dx, dz);
  if (d > 9) { MASC.x = tx; MASC.z = tz; }
  else if (d > 0.25) {
    const v = Math.min(d * 3.5, ECO.vel.v[G.vel] * multVel() + 1.5) * dt, px = MASC.x, pz = MASC.z;
    moverConChoque(MASC, dx / d * v, dz / d * v, 0.2);
    if (Math.hypot(MASC.x - px, MASC.z - pz) < v * 0.2) { MASC.x += dx / d * v; MASC.z += dz / d * v; }
    MASC.yaw += angDif(MASC.yaw, Math.atan2(dx, dz)) * (1 - Math.exp(-dt * 10));
    MASC.andar = acercar(MASC.andar, 1, dt * 5);
  } else { MASC.andar = acercar(MASC.andar, 0, dt * 3); MASC.yaw += angDif(MASC.yaw, Math.atan2(JUG.x - MASC.x, JUG.z - MASC.z)) * (1 - Math.exp(-dt * 4)); }
  MASC.salto += dt * (6 + MASC.andar * 6);
  MASC.y = alturaPiso(MASC.x, MASC.z);
  // la gallina pone huevos de oro
  if (G.mascota === 'gallina') {
    MASC.huevoT -= dt;
    if (MASC.huevoT <= 0 && MASC.huevos.length < 3) { MASC.huevoT = 75; MASC.huevos.push({ x: MASC.x, z: MASC.z, t: 0 }); Sonido.efecto('pop', 0.5, 1.4); }
  }
  for (let i = MASC.huevos.length - 1; i >= 0; i--) {
    const h = MASC.huevos[i]; h.t += dt;
    if (dist2(JUG.x, JUG.z, h.x, h.z) < 0.8) {
      MASC.huevos.splice(i, 1); const a = Math.round(unidadPlata() * 0.6);
      G.dinero += a; G.ganado += a; UI.pulsoPlata(); UI.aviso('+$' + fmt(a), 'oro'); Sonido.efecto('caja', 0.6);
      for (let k = 0; k < 14; k++) chispas(h.x, SUELO + 0.3, h.z, '#ffd34a', 1, 2);
    }
  }
}
function dibujarMascota(cubo, t) {
  for (const h of MASC.huevos) cubo(h.x, SUELO + 0.14 + Math.abs(Math.sin(t * 3 + h.x)) * 0.12, h.z, 0.22, t * 1.5, B.ORO + 64);
  if (!G.mascota) return;
  const M = MASCOTAS.find(m => m.id === G.mascota); if (!M) return;
  const s = Math.sin(MASC.yaw), c = Math.cos(MASC.yaw), salto = Math.abs(Math.sin(MASC.salto)) * 0.12 * MASC.andar;
  for (const [dx, dy, dz, tam, b, parte] of M.partes) {
    let ox = dx, oy = dy + salto, oz = dz;
    if (parte === 'cola') ox += Math.sin(t * 9) * 0.05;
    if (parte === 'pata') oy += Math.max(0, Math.sin(MASC.salto)) * 0.06 * MASC.andar;
    if (parte === 'pata2') oy += Math.max(0, -Math.sin(MASC.salto)) * 0.06 * MASC.andar;
    cubo(MASC.x + ox * c + oz * s, MASC.y + oy, MASC.z - ox * s + oz * c, tam, MASC.yaw, B[b]);
  }
}

// ---------- la decoración (bloques que se agregan al mundo) ----------
function buscarArena(x0, z0) {
  for (let r = 0; r < 8; r++) for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
    const x = x0 + dx, z = z0 + dz;
    if (Mundo.get(x, 4, z) === B.ARENA && !Mundo.get(x, 5, z) && Mundo.get(x + 1, 4, z) && Mundo.get(x, 4, z + 1)) return [x, z];
  }
  return [x0, z0];
}
const DECO_ARMA = {
  estatua(p) {
    p(17, 5, 37, B.CUARZO_LADRILLO); p(17, 6, 37, B.ORO); p(17, 7, 37, B.ORO); p(16, 7, 37, B.ORO); p(18, 7, 37, B.ORO); p(17, 8, 37, B.ORO);
    for (const [x, z] of [[16, 36], [18, 36], [16, 38], [18, 38]]) p(x, 5, z, [B.FLOR_ROJA, B.FLOR_AMARILLA][(x + z) % 2]);
  },
  palmeras(p) {
    for (const [x0, z0] of [[42, 22], [42, 30], [6, 47]]) {
      const [x, z] = buscarArena(x0, z0);
      for (let y = 5; y <= 9; y++) p(x + (y >= 8 ? 1 : 0), y, z, B.TRONCO);
      const tx = x + 1, ty = 10;
      p(tx, ty, z, B.HOJAS);
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { p(tx + dx, ty, z + dz, B.HOJAS); p(tx + dx * 2, ty - 1, z + dz * 2, B.HOJAS); }
      p(tx, ty - 1, z + 1, B.LANA_MARRON); p(tx - 1, ty - 1, z, B.LANA_MARRON);
    }
  },
  flamencos(p) {
    for (const [x, z, d] of [[11, 34, 1], [13, 35, -1], [12, 37, 1]]) { p(x, 5, z, B.LANA_ROSA); p(x, 6, z, B.LANA_ROSA); p(x, 7, z + d, B.LANA_ROSA); p(x, 7, z + 2 * d, B.LANA_NEGRA); }
  },
  auto(p) {
    for (const z of [38, 39]) {
      p(32, 5, z, B.LANA_NEGRA); p(35, 5, z, B.LANA_NEGRA); p(33, 5, z, B.LANA_ROJA); p(34, 5, z, B.LANA_ROJA);
      p(32, 6, z, B.LANA_ROJA); p(33, 6, z, B.VIDRIO); p(34, 6, z, B.LANA_ROJA); p(35, 6, z, B.LANA_ROJA);
      p(34, 7, z, B.LANA_ROJA);
    }
    p(31, 5, 38, B.LAMPARA); p(31, 5, 39, B.LAMPARA);
  },
  helados(p) {
    for (let x = 30; x <= 32; x++) { p(x, 5, 58, B.LANA_BLANCA); p(x, 7, 57, x % 2 ? B.LANA_ROSA : B.LANA_BLANCA); p(x, 7, 58, x % 2 ? B.LANA_ROSA : B.LANA_BLANCA); }
    p(30, 6, 58, B.TRONCO); p(32, 6, 58, B.TRONCO); p(31, 6, 58, B.LANA_CELESTE);
    p(31, 8, 57, B.LANA_MARRON); p(31, 9, 57, B.LANA_ROSA); p(31, 10, 57, B.LANA_BLANCA);
  },
  barco(p) {
    for (let z = 68; z <= 71; z++) for (let x = 26; x <= 28; x++) { p(x, 3, z, B.TABLAS_OSC); if (x !== 27 || z === 68 || z === 71) p(x, 4, z, B.TABLAS_OSC); else p(x, 4, z, B.TABLAS); }
    for (let y = 5; y <= 8; y++) p(27, y, 70, B.TRONCO);
    for (let y = 6; y <= 8; y++) { p(27, y, 69, B.LANA_BLANCA); if (y < 8) p(27, y, 68, B.LANA_BLANCA); }
    p(27, 9, 70, B.LANA_ROJA);
  },
  faro(p) {
    const [x, z] = buscarArena(6, 63);
    for (let y = 5; y <= 13; y++) for (let dz = 0; dz <= 1; dz++) for (let dx = 0; dx <= 1; dx++) p(x + dx, y, z + dz, Math.floor((y - 5) / 2) % 2 ? B.LANA_BLANCA : B.LANA_ROJA);
    for (let dz = 0; dz <= 1; dz++) for (let dx = 0; dx <= 1; dx++) { p(x + dx, 14, z + dz, B.LAMPARA); p(x + dx, 15, z + dz, B.LOSA_PIZARRA); }
  },
  globo(p) {
    const cx = 38, cy = 22, cz = 35, r = 3.2, cols = [B.LANA_ROJA, B.LANA_AMARILLA, B.LANA_AZUL, B.LANA_BLANCA];
    for (let y = -4; y <= 4; y++) for (let z = -4; z <= 4; z++) for (let x = -4; x <= 4; x++) {
      const d = Math.hypot(x, y * 0.9, z); if (Math.abs(d - r) > 0.55) continue;
      p(cx + x, cy + y, cz + z, cols[Math.floor((Math.atan2(z, x) + PI) / TAU * 8) % 4]);
    }
    p(cx, cy - 5, cz, B.TABLAS); p(cx + 1, cy - 5, cz, B.TABLAS); p(cx, cy - 5, cz + 1, B.TABLAS); p(cx + 1, cy - 5, cz + 1, B.TABLAS);
  },
};

// ---------- el panel de la tienda ----------
const TIENDA = { pestana: 'trajes' };
function abrirTienda(p) { if (p) TIENDA.pestana = p; abrirPanel('tienda'); }
const _pieles2D = {};
function pielDe(nombre) {
  if (_pieles2D[nombre]) return _pieles2D[nombre];
  const datos = PJ.datos || armarPieles(), i = PIELES[nombre], c = lienzo(64, 64), g = c.getContext('2d'), im = g.createImageData(64, 64);
  im.data.set(datos.subarray(i * 16384, (i + 1) * 16384)); g.putImageData(im, 0, 0);
  return (_pieles2D[nombre] = c);
}
// botón de precio: plata, gemas o anuncios (con su progreso)
function botonPrecio(g, x, y, w, h, it, clave, f, tieneTxt) {
  const U = UI.U;
  if (tieneTxt) { const dy = boton(g, x, y, w, h, tieneTxt.col, f); texto(g, tieneTxt.s, x + w / 2, y + h / 2 + dy + 1 * U, tamQueEntra(g, tieneTxt.s, 11 * U, w - 8 * U), '#fff', '#101826'); return; }
  const puede = it.ads ? true : it.plata ? G.dinero >= it.plata : G.gemas >= it.gemas;
  const dy = boton(g, x, y, w, h, it.ads ? '#8a52c8' : puede ? '#3fae4f' : '#6b7c93', f);
  const cy = y + h / 2 + dy;
  if (it.ads) { iconoDibujo(g, 'tv', x + 16 * U, cy, 16 * U, '#fff'); texto(g, (G.adProg[clave] || 0) + '/' + it.ads, x + w / 2 + 8 * U, cy + 1 * U, 11 * U, '#fff', '#101826'); }
  else if (it.plata) { moneda(g, x + 13 * U, cy, 7 * U); texto(g, fmt(it.plata), x + w / 2 + 7 * U, cy + 1 * U, tamQueEntra(g, fmt(it.plata), 11 * U, w - 26 * U), '#fff', '#101826'); }
  else { gema(g, x + 13 * U, cy, 7 * U); texto(g, String(it.gemas), x + w / 2 + 7 * U, cy + 1 * U, 11 * U, '#fff', '#101826'); }
}
function panelTienda(g, t) {
  const U = UI.U, M = abrirMarco(g, 344 * U, 588 * U), { x, y, w } = M;
  tarjeta(g, x, y, w, M.h);
  texto(g, T('tienda'), x + w / 2, y + 26 * U, 21 * U, '#ffd34a', '#101826');
  botonCerrar(g, x + w - 44 * U, y + 9 * U);
  monedasPanel(g, x + w / 2, y + 54 * U);
  const tabs = ['trajes', 'mascotas', 'decos', 'boosts'];
  pestanas(g, x + 10 * U, y + 72 * U, w - 20 * U, tabs.map(k => T('tab.' + k)), tabs.indexOf(TIENDA.pestana), i => { TIENDA.pestana = tabs[i]; Sonido.efecto('clic', 0.5); }, ['traje', 'mascota', 'fuente', 'rayo']);
  const cy = y + 112 * U, P = TIENDA.pestana;
  if (P === 'trajes') {
    const cw = (w - 28 * U) / 3, ch = 112 * U;
    TRAJES.forEach((it, i) => {
      const cx = x + 10 * U + (i % 3) * (cw + 4 * U), yy = cy + Math.floor(i / 3) * (ch + 4 * U);
      if (i === 9) { tarjetaItem(g, x + 10 * U + cw + 4 * U, yy, cw, ch, G.traje === it.id); dibujarItemTraje(g, it, x + 10 * U + cw + 4 * U, yy, cw, ch, t); return; }
      tarjetaItem(g, cx, yy, cw, ch, G.traje === it.id); dibujarItemTraje(g, it, cx, yy, cw, ch, t);
    });
  } else if (P === 'mascotas') {
    const cw = (w - 24 * U) / 2, ch = 200 * U;
    MASCOTAS.forEach((it, i) => {
      const cx = x + 10 * U + (i % 2) * (cw + 4 * U), yy = cy + Math.floor(i / 2) * (ch + 6 * U), tiene = G.mascotas.includes(it.id);
      tarjetaItem(g, cx, yy, cw, ch, G.mascota === it.id);
      iconoMascota(g, it, cx + cw / 2, yy + 72 * U, 120 * U, t);
      texto(g, T('masc.' + it.id).toUpperCase(), cx + cw / 2, yy + 118 * U, 13 * U, '#fff', '#101826');
      envolver(g, T('mascEf.' + it.id), cx + cw / 2, yy + 142 * U, cw - 14 * U, 9 * U, '#cfe6ff');
      botonPrecio(g, cx + 10 * U, yy + ch - 36 * U, cw - 20 * U, 26 * U, it, 'masc_' + it.id, () => comprarMascota(it), tiene ? { s: G.mascota === it.id ? T('usando') : T('usar'), col: G.mascota === it.id ? '#2f9e44' : '#3a8ad8' } : null);
    });
  } else if (P === 'decos') {
    const cw = (w - 24 * U) / 2, ch = 104 * U;
    DECOS.forEach((it, i) => {
      const cx = x + 10 * U + (i % 2) * (cw + 4 * U), yy = cy + Math.floor(i / 2) * (ch + 4 * U), tiene = G.decos.includes(it.id);
      tarjetaItem(g, cx, yy, cw, ch, tiene);
      g.drawImage(iconoBloque(B[it.icono]), cx + 8 * U, yy + 10 * U, 40 * U, 44.8 * U);
      texto(g, T('deco.' + it.id).toUpperCase(), cx + 54 * U, yy + 24 * U, tamQueEntra(g, T('deco.' + it.id).toUpperCase(), 11 * U, cw - 60 * U), '#fff', '#101826', 'left');
      texto(g, '+5% $', cx + 54 * U, yy + 44 * U, 10 * U, '#8dffa0', '#101826', 'left');
      botonPrecio(g, cx + 8 * U, yy + ch - 36 * U, cw - 16 * U, 26 * U, it, 'deco_' + it.id, () => comprarDeco(it), tiene ? { s: T('listo'), col: '#2f9e44' } : null);
    });
  } else {
    const cw = (w - 24 * U) / 2, ch = 132 * U;
    BOOSTS.forEach((it, i) => {
      const cx = x + 10 * U + (i % 2) * (cw + 4 * U), yy = cy + Math.floor(i / 2) * (ch + 4 * U);
      tarjetaItem(g, cx, yy, cw, ch, it.dura && G.boosts[it.id] > 0);
      if (!(it.img && dibujarIcono(g, it.img, cx + cw / 2, yy + 29 * U, 44 * U))) g.drawImage(iconoBloque(B[it.icono]), cx + cw / 2 - 18 * U, yy + 8 * U, 36 * U, 40.3 * U);
      texto(g, T('boost.' + it.id).toUpperCase(), cx + cw / 2, yy + 60 * U, tamQueEntra(g, T('boost.' + it.id).toUpperCase(), 11 * U, cw - 10 * U), '#fff', '#101826');
      const sub = it.dura ? (G.boosts[it.id] > 0 ? fmtReloj(G.boosts[it.id]) : fmtReloj(it.dura)) : it.id === 'pack' ? '+$' + fmt(unidadPlata() * 5) : it.id === 'gemasAd' ? '+5 · ' + adQueda('gemas') + '/' + TOPES_AD.gemas : '';
      texto(g, sub, cx + cw / 2, yy + 78 * U, 10 * U, G.boosts[it.id] > 0 ? '#8dffa0' : '#cfe6ff', '#101826');
      if (it.id === 'gemasAd') { const dy = boton(g, cx + 10 * U, yy + ch - 38 * U, cw - 20 * U, 28 * U, '#8a52c8', () => usarBoost(it)); iconoDibujo(g, 'tv', cx + cw / 2 - 12 * U, yy + ch - 24 * U + dy, 16 * U, '#fff'); gema(g, cx + cw / 2 + 14 * U, yy + ch - 24 * U + dy, 7 * U); return; }
      const bw = (cw - 24 * U) / 2;
      if (it.dura || it.id === 'llenar') { const dy = boton(g, cx + 8 * U, yy + ch - 38 * U, bw, 28 * U, '#8a52c8', () => usarBoost(it, true)); iconoDibujo(g, 'tv', cx + 8 * U + bw / 2, yy + ch - 24 * U + dy, 16 * U, '#fff'); }
      const bx = it.dura || it.id === 'llenar' ? cx + 16 * U + bw : cx + 8 * U, bw2 = it.dura || it.id === 'llenar' ? bw : cw - 16 * U;
      const dy = boton(g, bx, yy + ch - 38 * U, bw2, 28 * U, G.gemas >= it.gemas ? '#3fae4f' : '#6b7c93', () => usarBoost(it, false));
      gema(g, bx + 12 * U, yy + ch - 24 * U + dy, 6 * U); texto(g, String(it.gemas), bx + bw2 / 2 + 6 * U, yy + ch - 23 * U + dy, 11 * U, '#fff', '#101826');
    });
  }
  cerrarMarco(g);
}
function dibujarItemTraje(g, it, cx, yy, cw, ch, t) {
  const U = UI.U, tiene = G.trajes.includes(it.id);
  constructor2D(g, cx + cw / 2 - 4 * 1.9 * U, yy + 8 * U, 1.9 * U, G.traje === it.id ? t : 0, pielDe(it.id));
  texto(g, T('traje.' + it.id).toUpperCase(), cx + cw / 2, yy + ch - 40 * U, tamQueEntra(g, T('traje.' + it.id).toUpperCase(), 9 * U, cw - 8 * U), '#fff', '#101826');
  botonPrecio(g, cx + 5 * U, yy + ch - 30 * U, cw - 10 * U, 22 * U, it, 'traje_' + it.id, () => comprarTraje(it), tiene ? { s: G.traje === it.id ? T('usando') : T('usar'), col: G.traje === it.id ? '#2f9e44' : '#3a8ad8' } : null);
}
function iconoMascota(g, it, x, y, s, t) {
  // la mascota de costado con sus cubitos (proyección isométrica simple)
  const partes = it.partes.slice().sort((a, b) => (a[2] - a[0]) - (b[2] - b[0]));
  const salto = Math.abs(Math.sin(t * 5)) * 0.06;
  for (const [dx, dy, dz, tam, b] of partes) {
    const px = x + (dz - dx) * s * 0.9, py = y - (dy + salto) * s * 1.1 + (dx + dz) * s * 0.25, w = tam * s * 1.1;
    g.drawImage(iconoBloque(B[b]), px - w / 2, py - w / 2, w, w * 1.12);
  }
}

// MANSION BUILDER — actividades: misiones del día, logros, calendario de 7 días, ruleta y cofres que aparecen en la isla
// ---------- misiones del día (3, elegidas con la fecha como semilla) ----------
const MIS_TIPOS = {
  entregar: n => 20 + n * 6, cobrar: () => unidadPlata() * 3, visitas: n => 6 + n, mejora: () => 1, cofre: () => 2,
  pescar: () => 3, torre: () => 8, excavar: () => 1, ruleta: () => 1, anuncio: () => 2,
};
function misionesDeHoy() {
  if (!G.mis || G.mis.dia !== hoy()) {
    const r = rngSemilla(hoy()), tipos = Object.keys(MIS_TIPOS), lista = [];
    while (lista.length < 3) { const t = tipos[Math.floor(r() * tipos.length)]; if (!lista.some(m => m.t === t)) lista.push({ t, meta: Math.round(MIS_TIPOS[t](Math.max(1, G.parte))), prog: 0, cobrada: false }); }
    G.mis = { dia: hoy(), lista };
  }
  return G.mis.lista;
}
function mision(tipo, n) {
  if (!G || !G.stats) return;
  for (const m of misionesDeHoy()) if (m.t === tipo && !m.cobrada) m.prog = tipo === 'torre' ? Math.max(m.prog, n) : m.prog + n;
}
const misionLista = m => m.prog >= m.meta && !m.cobrada;
function cobrarMision(m) {
  if (!misionLista(m)) return;
  m.cobrada = true; const plata = unidadPlata();
  darPremio({ plata, gemas: 6 }, T('mision'), null);
}
// ---------- logros ----------
const LOGROS = [
  ['bloques1', () => G.bloques, 1, 5], ['bloques100', () => G.bloques, 100, 10], ['bloques500', () => G.bloques, 500, 25],
  ['partes2', () => G.parte, 2, 10], ['partes7', () => G.parte, 7, 20], ['partes13', () => G.parte, 13, 50],
  ['plata5k', () => G.ganado, 5000, 10], ['plata100k', () => G.ganado, 100000, 40], ['visitas100', () => G.visitas, 100, 15],
  ['ayudantes3', () => G.ayud, 3, 15], ['peces10', () => G.stats.peces, 10, 10], ['torre20', () => G.stats.torre, 20, 15],
  ['cofres10', () => G.stats.cofres, 10, 15], ['trajes5', () => G.trajes.length, 5, 20], ['mascotas2', () => G.mascotas.length, 2, 15],
  ['decos4', () => G.decos.length, 4, 20],
].map(([id, v, meta, gemas]) => ({ id, v, meta, gemas }));
const logroListo = l => l.v() >= l.meta && !G.logros[l.id];
function cobrarLogro(l) { if (!logroListo(l)) return; G.logros[l.id] = 1; darPremio({ gemas: l.gemas }, T('logroTit'), null); }
// ---------- calendario de 7 días ----------
const CALENDARIO = [{ plata: 2 }, { gemas: 5 }, { plata: 4 }, { gemas: 10 }, { boost: 'x2', seg: 600 }, { gemas: 20 }, { gemas: 40, traje: 'rey' }];
const calendarioListo = () => G.racha.dia !== hoy();
function premioDia(i) { const c = CALENDARIO[i % 7], p = {}; if (c.plata) p.plata = c.plata * unidadPlata(); if (c.gemas) p.gemas = c.gemas; if (c.boost) p.boost = [c.boost, c.seg]; if (c.traje && !G.trajes.includes(c.traje)) p.traje = c.traje; return p; }
function cobrarCalendario(mult) {
  if (!calendarioListo()) return;
  const i = G.racha.n % 7, p = premioDia(i);
  G.racha.dia = hoy(); G.racha.n++;
  if (mult) { if (p.plata) p.plata *= 2; if (p.gemas) p.gemas *= 2; if (p.boost) p.boost = [p.boost[0], p.boost[1] * 2]; }
  darPremio(p, T('diaN', { n: i + 1 }), null);
}
// ---------- ruleta ----------
const RULETA = [
  { plata: 1, p: 22, c: '#3fae4f' }, { gemas: 3, p: 18, c: '#8a52c8' }, { plata: 2, p: 15, c: '#e8a33a' }, { boost: 'x2', seg: 300, p: 10, c: '#d9485f' },
  { plata: 4, p: 12, c: '#3a8ad8' }, { gemas: 8, p: 10, c: '#c24fd0' }, { boost: 'iman', seg: 300, p: 9, c: '#5a6a80' }, { gemas: 25, p: 4, c: '#f2c230' },
];
const RUL = { ang: 0, vel: 0, girando: false, premio: -1 };
const ruletaGratis = () => G.ruleta.dia !== hoy();
function girarRuleta(conAd) {
  if (RUL.girando) return;
  const empezar = () => {
    let tot = 0; for (const s of RULETA) tot += s.p;
    let r = az() * tot, i = 0; while (r > RULETA[i].p) { r -= RULETA[i].p; i++; }
    RUL.premio = i; RUL.girando = true;
    // el ángulo final deja el sector i bajo la flecha (arriba), con varias vueltas
    const seg = TAU / RULETA.length, fin = -(i + 0.5) * seg - PI / 2 + rnd(-0.3, 0.3) * seg;
    RUL.desde = RUL.ang; RUL.hasta = fin - Math.ceil((fin - RUL.ang) / TAU) * TAU - TAU * 5; RUL.t = 0;
    mision('ruleta', 1); Sonido.efecto('clic', 0.6);
  };
  if (conAd) conAnuncio('ruleta', empezar);
  else if (ruletaGratis()) { G.ruleta.dia = hoy(); empezar(); }
}
function pasarRuleta(dt) {
  if (!RUL.girando) return;
  RUL.t += dt / 4.2;
  const k = Math.min(1, RUL.t), e = 1 - Math.pow(1 - k, 4), antes = RUL.ang;
  RUL.ang = lerp(RUL.desde, RUL.hasta, e);
  if (Math.floor(antes / (TAU / 8)) !== Math.floor(RUL.ang / (TAU / 8))) Sonido.efecto('tick', 0.5, 1 + vis() * 0.1, 0.02);
  if (k >= 1) { RUL.girando = false; const s = RULETA[RUL.premio], p = {}; if (s.plata) p.plata = s.plata * unidadPlata(); if (s.gemas) p.gemas = s.gemas; if (s.boost) p.boost = [s.boost, s.seg]; darPremio(p, T('ruleta'), 2); }
}
// ---------- cofres que aparecen cerca ----------
const COFRES = { t: 70, uno: null };
function actualizarCofres(dt) {
  if (G.parte < 1) return;
  const c = COFRES.uno;
  if (c) {
    c.t += dt; c.vida -= dt;
    if (vis() < dt * 4) chispas(c.x, SUELO + 0.9, c.z, '#ffe27a', 1, 1);
    if (dist2(JUG.x, JUG.z, c.x, c.z) < 0.9) { COFRES.uno = null; abrirCofre(c); }
    else if (c.vida <= 0) COFRES.uno = null;
    return;
  }
  COFRES.t -= dt;
  if (COFRES.t > 0) return;
  COFRES.t = 100 + az() * 60;
  for (let k = 0; k < 30; k++) {
    const a = az() * TAU, d = 5 + az() * 8, x = JUG.x + Math.cos(a) * d, z = JUG.z + Math.sin(a) * d;
    if (libreR(x, z, 0.45) && Mundo.get(Math.floor(x), SUELO - 1, Math.floor(z)) !== B.LOSA_TABLAS) { COFRES.uno = { x: Math.floor(x) + 0.5, z: Math.floor(z) + 0.5, t: 0, vida: 75 }; UI.aviso(T('cofreAparece'), 'oro'); Sonido.efecto('pop', 0.6, 0.8); break; }
  }
}
function abrirCofre(c) {
  G.stats.cofres++; mision('cofre', 1);
  Sonido.efecto('cofre', 0.9); Sonido.vibrar([20, 20, 30]);
  for (let k = 0; k < 30; k++) confeti(c.x, SUELO + 1, c.z);
  const p = az() < 0.65 ? { plata: Math.round(unidadPlata() * azR(1.5, 3)) } : { gemas: 3 + Math.floor(az() * 6) };
  darPremio(p, T('cofre'), 3);
}
function dibujarCofres(cubo, t) {
  const c = COFRES.uno; if (!c) return;
  const sal = Math.abs(Math.sin(t * 3)) * 0.12;
  cubo(c.x, SUELO + 0.32 + sal, c.z, 0.62, Math.sin(t) * 0.3, B.CAJA);
  cubo(c.x, SUELO + 0.7 + sal, c.z, 0.4, Math.sin(t) * 0.3, B.ORO + 64);
}
// ---------- el cartel de premio (con "x2/x3 mirando un anuncio") ----------
// p: { plata, gemas, boost: [id, seg], traje }; mult: multiplicador por anuncio (null = sin opción)
function darPremio(p, titulo, mult) {
  UI.premio = { p, titulo, mult, volver: UI.panel && UI.panel !== 'premio' && UI.panel !== 'mj' ? UI.panel : null };
  abrirPanel('premio');
  Sonido.efecto('caja', 0.7);
}
function cobrarPremio(m) {
  const P = UI.premio; if (!P) return;
  const p = P.p;
  if (p.plata) { G.dinero += Math.round(p.plata * m); G.ganado += Math.round(p.plata * m); UI.pulsoPlata(); }
  if (p.gemas) { G.gemas += p.gemas * m; UI.pulsoGemas(); }
  if (p.boost) G.boosts[p.boost[0]] = (G.boosts[p.boost[0]] || 0) + p.boost[1] * m;
  if (p.traje && !G.trajes.includes(p.traje)) G.trajes.push(p.traje);
  for (let k = 0; k < 24; k++) confeti(JUG.x + rnd(-1, 1), JUG.y + 2, JUG.z + rnd(-1, 1));
  Sonido.efecto('moneda', 0.8, 1.2);
  UI.premio = null; guardar();
  UI.panel = P.volver || null;
}
// algo para hacer avisado con un puntito rojo en su botón
function hayMision() { return misionesDeHoy().some(misionLista) || LOGROS.some(logroListo); }

// ---------- paneles ----------
const ACT = { pestana: 'misiones' };
function panelActividades(g, t) {
  const U = UI.U, M = abrirMarco(g, 344 * U, 560 * U), { x, y, w } = M;
  tarjeta(g, x, y, w, M.h);
  texto(g, T('actividades'), x + w / 2, y + 26 * U, 20 * U, '#ffd34a', '#101826');
  botonCerrar(g, x + w - 44 * U, y + 9 * U);
  const tabs = ['misiones', 'logros', 'calendario'];
  pestanas(g, x + 10 * U, y + 50 * U, w - 20 * U, tabs.map(k => T('tab.' + k)), tabs.indexOf(ACT.pestana), i => { ACT.pestana = tabs[i]; Sonido.efecto('clic', 0.5); }, ['estrella', 'trofeo', 'calendario']);
  const cy = y + 92 * U;
  if (ACT.pestana === 'misiones') {
    const L = misionesDeHoy();
    L.forEach((m, i) => {
      const yy = cy + i * 112 * U;
      tarjetaItem(g, x + 10 * U, yy, w - 20 * U, 104 * U, m.cobrada);
      const s = T('mis.' + m.t, { n: fmt(m.meta) });
      texto(g, s, x + 22 * U, yy + 22 * U, tamQueEntra(g, s, 13 * U, w - 60 * U), '#fff', '#101826', 'left');
      const bw = w - 150 * U, k = Math.min(1, m.prog / m.meta);
      g.fillStyle = '#16202f'; rr(g, x + 22 * U, yy + 44 * U, bw, 14 * U, 7 * U); g.fill();
      g.fillStyle = '#5ee06a'; if (k > 0) { rr(g, x + 22 * U, yy + 44 * U, Math.max(14 * U, bw * k), 14 * U, 7 * U); g.fill(); }
      texto(g, fmt(Math.min(m.prog, m.meta)) + '/' + fmt(m.meta), x + 22 * U + bw / 2, yy + 51.5 * U, 9 * U, '#fff', '#101826');
      gema(g, x + 30 * U, yy + 80 * U, 7 * U); texto(g, '6', x + 44 * U, yy + 81 * U, 11 * U, '#fff', '#101826');
      moneda(g, x + 66 * U, yy + 80 * U, 7 * U); texto(g, fmt(unidadPlata()), x + 78 * U, yy + 81 * U, 11 * U, '#fff', '#101826', 'left');
      const lista = misionLista(m);
      const dy = boton(g, x + w - 120 * U, yy + 40 * U, 96 * U, 34 * U, m.cobrada ? '#56708f' : lista ? '#3fae4f' : '#6b7c93', lista ? () => cobrarMision(m) : null);
      texto(g, m.cobrada ? '✓' : T('cobrar'), x + w - 72 * U, yy + 57 * U + dy, tamQueEntra(g, T('cobrar'), 12 * U, 86 * U), '#fff', '#101826');
    });
    texto(g, T('nuevasMisiones'), x + w / 2, cy + 3 * 112 * U + 14 * U, 10 * U, 'rgba(255,255,255,0.7)', null);
  } else if (ACT.pestana === 'logros') {
    const cw = (w - 24 * U) / 2, ch = 52 * U;
    LOGROS.forEach((l, i) => {
      const cx = x + 10 * U + (i % 2) * (cw + 4 * U), yy = cy + Math.floor(i / 2) * (ch + 4 * U), hecho = !!G.logros[l.id], lista = logroListo(l);
      tarjetaItem(g, cx, yy, cw, ch, hecho);
      const s = T('logro.' + l.id, { n: fmt(l.meta) });
      texto(g, s, cx + 8 * U, yy + 16 * U, tamQueEntra(g, s, 10 * U, cw - 16 * U), '#fff', '#101826', 'left');
      if (hecho) texto(g, '✓', cx + cw - 20 * U, yy + 36 * U, 14 * U, '#8dffa0', '#101826');
      else if (lista) { const dy = boton(g, cx + cw - 64 * U, yy + 26 * U, 56 * U, 20 * U, '#3fae4f', () => cobrarLogro(l)); gema(g, cx + cw - 50 * U, yy + 36 * U + dy, 6 * U); texto(g, String(l.gemas), cx + cw - 30 * U, yy + 37 * U + dy, 10 * U, '#fff', '#101826'); }
      else { const bw = cw - 80 * U, k = Math.min(1, l.v() / l.meta); g.fillStyle = '#16202f'; rr(g, cx + 8 * U, yy + 31 * U, bw, 10 * U, 5 * U); g.fill(); g.fillStyle = '#5ee06a'; if (k > 0) { rr(g, cx + 8 * U, yy + 31 * U, Math.max(10 * U, bw * k), 10 * U, 5 * U); g.fill(); } gema(g, cx + cw - 50 * U, yy + 36 * U, 6 * U); texto(g, String(l.gemas), cx + cw - 30 * U, yy + 37 * U, 10 * U, '#fff', '#101826'); }
    });
  } else {
    const cw = (w - 28 * U) / 3, ch = 108 * U, hoyI = G.racha.n % 7, listo = calendarioListo(), hechos = listo ? G.racha.n % 7 : ((G.racha.n - 1) % 7) + 1;
    CALENDARIO.forEach((c, i) => {
      const fila = Math.floor(i / 3), col = i % 3, ancho = i === 6 ? w - 20 * U : cw;
      const cx = i === 6 ? x + 10 * U : x + 10 * U + col * (cw + 4 * U), yy = cy + fila * (ch + 6 * U);
      const pasado = i < hechos, esHoy = i === hoyI && listo;
      tarjetaItem(g, cx, yy, ancho, ch, esHoy);
      texto(g, T('diaN', { n: i + 1 }), cx + ancho / 2, yy + 16 * U, 11 * U, esHoy ? '#ffd34a' : '#fff', '#101826');
      const p = premioDia(i), cxm = cx + ancho / 2;
      if (p.traje) { constructor2D(g, cxm - 30 * U, yy + 26 * U, 1.6 * U, t, pielDe(p.traje)); gema(g, cxm + 30 * U, yy + 60 * U, 9 * U); texto(g, '+' + p.gemas, cxm + 56 * U, yy + 61 * U, 13 * U, '#fff', '#101826'); }
      else if (p.plata) { moneda(g, cxm, yy + 50 * U, 13 * U); texto(g, fmt(p.plata), cxm, yy + 78 * U, 12 * U, '#fff', '#101826'); }
      else if (p.gemas) { gema(g, cxm, yy + 50 * U, 13 * U); texto(g, '+' + p.gemas, cxm, yy + 78 * U, 12 * U, '#fff', '#101826'); }
      else if (p.boost) { g.drawImage(iconoBloque(B.ORO), cxm - 15 * U, yy + 34 * U, 30 * U, 33.6 * U); texto(g, 'x2 ' + Math.round(p.boost[1] / 60) + 'm', cxm, yy + 78 * U, 12 * U, '#fff', '#101826'); }
      if (pasado) { g.fillStyle = 'rgba(0,0,0,0.35)'; rr(g, cx, yy, ancho, ch, 10 * U); g.fill(); texto(g, '✓', cx + ancho / 2, yy + ch / 2, 34 * U, '#8dffa0', '#101826'); }
      if (esHoy) {
        const bw = (ancho - 16 * U) / 2;
        let dy = boton(g, cx + 6 * U, yy + ch - 26 * U, bw, 20 * U, '#3fae4f', () => cobrarCalendario(false));
        texto(g, T('cobrar'), cx + 6 * U + bw / 2, yy + ch - 16 * U + dy, tamQueEntra(g, T('cobrar'), 9 * U, bw - 4 * U), '#fff', '#101826');
        dy = boton(g, cx + 10 * U + bw, yy + ch - 26 * U, bw, 20 * U, '#8a52c8', () => conAnuncio('completar', () => cobrarCalendario(true)));
        iconoDibujo(g, 'tv', cx + 10 * U + bw + bw / 2 - 8 * U, yy + ch - 16 * U + dy, 12 * U, '#fff'); texto(g, 'x2', cx + 10 * U + bw + bw / 2 + 9 * U, yy + ch - 15 * U + dy, 9 * U, '#fff', '#101826');
      }
    });
    if (!listo) texto(g, T('manana'), x + w / 2, cy + 3 * (ch + 6 * U) + 10 * U, 11 * U, 'rgba(255,255,255,0.8)', null);
  }
  cerrarMarco(g);
}
function panelRuleta(g, t) {
  const U = UI.U, M = abrirMarco(g, 330 * U, 520 * U), { x, y, w } = M;
  tarjeta(g, x, y, w, M.h);
  texto(g, T('ruleta'), x + w / 2, y + 26 * U, 20 * U, '#ffd34a', '#101826');
  if (!RUL.girando) botonCerrar(g, x + w - 44 * U, y + 9 * U);
  const cx = x + w / 2, cy = y + 210 * U, R = 128 * U, n = RULETA.length, seg = TAU / n;
  g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.arc(cx, cy + 6 * U, R + 10 * U, 0, TAU); g.fill();
  g.fillStyle = '#7a3c0c'; g.beginPath(); g.arc(cx, cy, R + 10 * U, 0, TAU); g.fill();
  for (let i = 0; i < n; i++) {
    const a0 = RUL.ang + i * seg, s = RULETA[i];
    g.fillStyle = s.c; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R, a0, a0 + seg); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 2 * U; g.stroke();
    const am = a0 + seg / 2, ix = cx + Math.cos(am) * R * 0.66, iy = cy + Math.sin(am) * R * 0.66;
    g.save(); g.translate(ix, iy); g.rotate(am + PI / 2);
    if (s.plata) { moneda(g, 0, -6 * U, 10 * U); texto(g, fmt(s.plata * unidadPlata()), 0, 14 * U, 10 * U, '#fff', '#101826'); }
    else if (s.gemas) { gema(g, 0, -6 * U, 10 * U); texto(g, '+' + s.gemas, 0, 14 * U, 11 * U, '#fff', '#101826'); }
    else { g.drawImage(iconoBloque(s.boost === 'x2' ? B.ORO : B.HIERRO), -11 * U, -18 * U, 22 * U, 24.6 * U); texto(g, s.boost === 'x2' ? 'x2' : T('boost.iman'), 0, 14 * U, 9 * U, '#fff', '#101826'); }
    g.restore();
  }
  for (let i = 0; i < 16; i++) { const a = i / 16 * TAU + t * 2; g.fillStyle = i % 2 ? '#fff6b0' : '#ffd34a'; g.beginPath(); g.arc(cx + Math.cos(a) * (R + 5 * U), cy + Math.sin(a) * (R + 5 * U), 3 * U, 0, TAU); g.fill(); }
  g.fillStyle = '#fff'; g.beginPath(); g.arc(cx, cy, 18 * U, 0, TAU); g.fill(); moneda(g, cx, cy, 12 * U);
  g.fillStyle = '#ff3b4e'; g.strokeStyle = '#5a120c'; g.lineWidth = 3 * U; g.beginPath(); g.moveTo(cx, cy - R + 18 * U); g.lineTo(cx - 14 * U, cy - R - 16 * U); g.lineTo(cx + 14 * U, cy - R - 16 * U); g.closePath(); g.fill(); g.stroke();
  const by = y + M.h - 120 * U;
  if (!RUL.girando) {
    if (ruletaGratis()) { const dy = boton(g, x + 40 * U, by, w - 80 * U, 46 * U, '#3fae4f', () => girarRuleta(false)); texto(g, T('girarGratis'), x + w / 2, by + 23 * U + dy, tamQueEntra(g, T('girarGratis'), 16 * U, w - 100 * U), '#fff', '#101826'); }
    else {
      const dy = boton(g, x + 40 * U, by, w - 80 * U, 46 * U, adQueda('ruleta') > 0 ? '#8a52c8' : '#6b7c93', () => girarRuleta(true));
      iconoDibujo(g, 'tv', x + 70 * U, by + 23 * U + dy, 20 * U, '#fff'); texto(g, T('girar') + ' (' + adQueda('ruleta') + ')', x + w / 2 + 12 * U, by + 23 * U + dy, tamQueEntra(g, T('girar'), 16 * U, w - 140 * U), '#fff', '#101826');
    }
    texto(g, ruletaGratis() ? T('unaGratis') : T('masGiros'), x + w / 2, by + 70 * U, 10 * U, 'rgba(255,255,255,0.8)', null);
  }
  cerrarMarco(g);
}
function panelPremio(g, t) {
  const P = UI.premio; if (!P) { UI.panel = null; return; }
  const U = UI.U, M = abrirMarco(g, 310 * U, 330 * U), { x, y, w } = M, p = P.p;
  tarjeta(g, x, y, w, M.h);
  texto(g, P.titulo, x + w / 2, y + 30 * U, tamQueEntra(g, P.titulo, 20 * U, w - 30 * U), '#ffd34a', '#101826');
  // rayos detrás del premio
  g.save(); g.translate(x + w / 2, y + 120 * U); g.rotate(t * 0.6); g.fillStyle = 'rgba(255,230,120,0.18)';
  for (let k = 0; k < 10; k++) { g.rotate(TAU / 10); g.beginPath(); g.moveTo(0, 0); g.lineTo(-14 * U, -90 * U); g.lineTo(14 * U, -90 * U); g.closePath(); g.fill(); }
  g.restore();
  const items = [];
  if (p.plata) items.push(['plata', fmt(p.plata)]);
  if (p.gemas) items.push(['gemas', '+' + p.gemas]);
  if (p.boost) items.push(['boost', (p.boost[0] === 'x2' ? 'x2 ' : T('boost.' + p.boost[0]) + ' ') + Math.round(p.boost[1] / 60) + 'm']);
  if (p.traje) items.push(['traje', T('traje.' + p.traje)]);
  items.forEach(([tipo, s], i) => {
    const cx = x + w / 2 + (i - (items.length - 1) / 2) * 110 * U, cy = y + 110 * U;
    if (tipo === 'plata') moneda(g, cx, cy, 24 * U); else if (tipo === 'gemas') gema(g, cx, cy, 24 * U);
    else if (tipo === 'boost') g.drawImage(iconoBloque(p.boost[0] === 'x2' ? B.ORO : p.boost[0] === 'iman' ? B.HIERRO : B.LANA_CELESTE), cx - 24 * U, cy - 28 * U, 48 * U, 53.8 * U);
    else constructor2D(g, cx - 4 * 1.7 * U, cy - 40 * U, 1.7 * U, t, pielDe(p.traje));
    texto(g, s, cx, cy + 46 * U, tamQueEntra(g, s, 18 * U, 104 * U), '#fff', '#101826');
  });
  const by = y + M.h - 120 * U;
  if (P.mult) {
    const dy = boton(g, x + 30 * U, by, w - 60 * U, 46 * U, '#8a52c8', () => conAnuncio('completar', () => cobrarPremio(P.mult)));
    iconoDibujo(g, 'tv', x + 62 * U, by + 23 * U + dy, 20 * U, '#fff'); texto(g, T('cobrarX', { n: P.mult }), x + w / 2 + 14 * U, by + 23 * U + dy, tamQueEntra(g, T('cobrarX', { n: P.mult }), 16 * U, w - 130 * U), '#fff', '#101826');
  }
  const dy = boton(g, x + 50 * U, by + 56 * U, w - 100 * U, 38 * U, '#3fae4f', () => cobrarPremio(1));
  texto(g, T('cobrar'), x + w / 2, by + 75 * U + dy, 15 * U, '#fff', '#101826');
  cerrarMarco(g);
}

// MANSION BUILDER — minijuegos: pesca (en el muelle), torre de bloques y excavación del tesoro. Se juegan encima del
// mundo (que queda en pausa); dan plata y gemas. Cebos/partidas por día, y más mirando anuncios.
const MJ = { tipo: null, s: null };
const TORRE_GRATIS = 5, EXCAVA_GRATIS = 2, CEBO_MAX = 5, CEBO_SEG = 180;
function mjDia() { if (G.mj.dia !== hoy()) { G.mj.dia = hoy(); G.mj.torre = 0; G.mj.excava = 0; G.mj.torreExtra = 0; G.mj.excavaExtra = 0; } }
function partidasTorre() { mjDia(); return TORRE_GRATIS + (G.mj.torreExtra || 0) - G.mj.torre; }
function partidasExcava() { mjDia(); return EXCAVA_GRATIS + (G.mj.excavaExtra || 0) - G.mj.excava; }
function ceboActual() {
  const ahora = Date.now(); if (!G.mj.ceboT) G.mj.ceboT = ahora;
  while (G.mj.cebo < CEBO_MAX && ahora - G.mj.ceboT >= CEBO_SEG * 1000) { G.mj.cebo++; G.mj.ceboT += CEBO_SEG * 1000; }
  if (G.mj.cebo >= CEBO_MAX) G.mj.ceboT = ahora;
  return G.mj.cebo;
}
function abrirMinijuego(tipo, volver) {
  if (tipo === 'torre' && partidasTorre() <= 0) return;
  if (tipo === 'excava' && partidasExcava() <= 0) return;
  if (tipo === 'torre') G.mj.torre++;
  if (tipo === 'excava') { G.mj.excava++; mision('excavar', 1); }
  MJ.tipo = tipo; MJ.s = MJ_INICIO[tipo](); MJ.volver = volver === undefined ? 'minijuegos' : volver; UI.panel = 'mj'; G.stats.minijuegos++;
  UI.joy.activo = false; UI.joy.vx = UI.joy.vy = 0; Sonido.efecto('clic', 0.6); guardar();
}
function salirMinijuego() { MJ.tipo = null; MJ.s = null; UI.panel = MJ.volver; Sonido.efecto('clic', 0.5); guardar(); }
function pasarMJ(dt) { if (MJ.tipo && MJ_PASO[MJ.tipo]) MJ_PASO[MJ.tipo](MJ.s, dt); }
function dibujarMJ(g, t) { if (MJ.tipo) MJ_DIBUJO[MJ.tipo](g, MJ.s, t); }
function tocarMJ(x, y) { if (MJ.tipo && MJ_TOQUE[MJ.tipo]) MJ_TOQUE[MJ.tipo](MJ.s, x, y); }
function ganar(plata, gemas) {
  if (plata) { G.dinero += plata; G.ganado += plata; UI.pulsoPlata(); }
  if (gemas) { G.gemas += gemas; UI.pulsoGemas(); }
}
function fondoCielo(g, c1, c2, Wc, Hc, hasta) { const gr = g.createLinearGradient(0, 0, 0, Hc * hasta); gr.addColorStop(0, c1); gr.addColorStop(1, c2); g.fillStyle = gr; g.fillRect(0, 0, Wc, Hc * hasta); }
function barraMJ(g, s, plata, gemas, extra) {
  // arriba: salir, lo ganado y lo que queda
  const U = UI.U, Wc = CSSW;
  const dy = boton(g, 10 * U, 10 * U, 42 * U, 38 * U, '#d9485f', () => terminarMJ(s));
  iconoDibujo(g, 'cruz', 31 * U, 29 * U + dy, 24 * U, '#fff');
  g.fillStyle = 'rgba(16,24,38,0.75)'; rr(g, Wc / 2 - 96 * U, 12 * U, 192 * U, 34 * U, 17 * U); g.fill();
  moneda(g, Wc / 2 - 76 * U, 29 * U, 10 * U); texto(g, fmt(plata), Wc / 2 - 62 * U, 30 * U, 15 * U, '#ffe066', '#101826', 'left');
  gema(g, Wc / 2 + 30 * U, 29 * U, 10 * U); texto(g, String(gemas), Wc / 2 + 44 * U, 30 * U, 15 * U, '#e6c8ff', '#101826', 'left');
  if (extra) extra();
}
function terminarMJ(s) { if (MJ.tipo && MJ_FIN[MJ.tipo]) MJ_FIN[MJ.tipo](s); salirMinijuego(); }
const MJ_INICIO = {}, MJ_PASO = {}, MJ_DIBUJO = {}, MJ_TOQUE = {}, MJ_FIN = {};

// ======================= PESCA =======================
const PECES = [
  { id: 'sardina', p: 50, v: 0.35, c1: '#a9c4d4', c2: '#5f7f96', w: 0.26, vel: 0.9 },
  { id: 'salmon', p: 26, v: 0.7, c1: '#f4967a', c2: '#c0583e', w: 0.2, vel: 1.15 },
  { id: 'globo', p: 13, v: 1.1, c1: '#f2d060', c2: '#c09a30', w: 0.17, vel: 1.35 },
  { id: 'espada', p: 8, v: 1.8, c1: '#7a9ae0', c2: '#3a5aa8', w: 0.14, vel: 1.6 },
  { id: 'dorado', p: 3, v: 0.5, gemas: 8, c1: '#ffd34a', c2: '#e89a10', w: 0.12, vel: 1.85 },
];
MJ_INICIO.pesca = () => ({ fase: 'listo', t: 0, aguja: 0, dir: 1, plata: 0, gemas: 0, olas: 0, pez: null, res: null });
function lanzar(s) {
  if (s.fase !== 'listo') return;
  if (ceboActual() <= 0) { UI.aviso(T('sinCebo'), 'rojo'); return; }
  G.mj.cebo--; if (G.mj.cebo === CEBO_MAX - 1) G.mj.ceboT = Date.now();
  let tot = 0; for (const p of PECES) tot += p.p;
  let r = az() * tot, i = 0; while (r > PECES[i].p) { r -= PECES[i].p; i++; }
  s.pez = PECES[i]; s.fase = 'espera'; s.t = 0; s.espera = 1.1 + az() * 2.2; s.zona = 0.22 + az() * 0.56;
  Sonido.efecto('agua', 0.45, 1.25);
}
MJ_PASO.pesca = (s, dt) => {
  s.t += dt; s.olas += dt;
  if (s.fase === 'espera' && s.t > s.espera) { s.fase = 'pica'; s.t = 0; s.aguja = 0; s.dir = 1; Sonido.efecto('recoger', 0.8, 0.7); Sonido.vibrar(30); }
  else if (s.fase === 'pica') {
    s.aguja += s.dir * s.pez.vel * dt; if (s.aguja > 1) { s.aguja = 1; s.dir = -1; } if (s.aguja < 0) { s.aguja = 0; s.dir = 1; }
    if (s.t > 4.5) { s.fase = 'resultado'; s.res = { ok: false }; s.t = 0; }
  } else if (s.fase === 'resultado' && s.t > 1.8) { s.fase = 'listo'; s.t = 0; }
};
MJ_TOQUE.pesca = (s) => {
  if (s.fase === 'listo') return lanzar(s);
  if (s.fase !== 'pica') return;
  const d = Math.abs(s.aguja - s.zona), ok = d < s.pez.w / 2, perfecto = d < s.pez.w / 6;
  s.fase = 'resultado'; s.t = 0;
  if (!ok) { s.res = { ok: false }; Sonido.efecto('clic', 0.5, 0.6); return; }
  const plata = Math.round(s.pez.v * unidadPlata() * (perfecto ? 2 : 1)), gemas = s.pez.gemas || 0;
  s.plata += plata; s.gemas += gemas; ganar(plata, gemas);
  s.res = { ok: true, perfecto, plata, gemas, pez: s.pez };
  G.stats.peces++; mision('pescar', 1);
  Sonido.efecto('agua', 0.8, 0.95, 0.01); Sonido.efecto(perfecto ? 'desbloquear' : 'caja', 0.6); Sonido.vibrar(perfecto ? [20, 20, 40] : 25);
};
MJ_FIN.pesca = () => { };
function dibujarPez(g, x, y, s, P, ang) {
  g.save(); g.translate(x, y); g.rotate(ang || 0);
  const largo = P.id === 'espada' ? 1.5 : 1, alto = P.id === 'globo' ? 0.9 : 0.5;
  g.fillStyle = P.c2; g.beginPath(); g.moveTo(-s * 0.55 * largo, 0); g.lineTo(-s * 0.95 * largo, -s * 0.32); g.lineTo(-s * 0.95 * largo, s * 0.32); g.closePath(); g.fill();
  g.fillStyle = P.c1; g.beginPath(); g.ellipse(0, 0, s * 0.6 * largo, s * alto * 0.6, 0, 0, TAU); g.fill();
  g.fillStyle = P.c2; g.beginPath(); g.ellipse(0, -s * alto * 0.2, s * 0.5 * largo, s * alto * 0.3, 0, PI, TAU); g.fill();
  if (P.id === 'globo') { g.strokeStyle = P.c2; g.lineWidth = s * 0.06; for (let k = 0; k < 10; k++) { const a = k / 10 * TAU; g.beginPath(); g.moveTo(Math.cos(a) * s * 0.5, Math.sin(a) * s * 0.5); g.lineTo(Math.cos(a) * s * 0.68, Math.sin(a) * s * 0.68); g.stroke(); } }
  if (P.id === 'espada') { g.fillStyle = P.c2; g.beginPath(); g.moveTo(s * 0.85, -s * 0.04); g.lineTo(s * 1.45, 0); g.lineTo(s * 0.85, s * 0.06); g.closePath(); g.fill(); }
  g.fillStyle = '#fff'; g.beginPath(); g.arc(s * 0.3 * largo, -s * 0.08, s * 0.1, 0, TAU); g.fill();
  g.fillStyle = '#111'; g.beginPath(); g.arc(s * 0.33 * largo, -s * 0.08, s * 0.05, 0, TAU); g.fill();
  if (P.id === 'dorado') { g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillRect(-s * 0.2, -s * 0.2, s * 0.08, s * 0.08); }
  g.restore();
}
MJ_DIBUJO.pesca = (g, s, t) => {
  const U = UI.U, Wc = CSSW, Hc = CSSH, mar = Hc * 0.36;
  fondoCielo(g, '#58b6ee', '#bfe8ff', Wc, Hc, 0.36);
  // isla a lo lejos y el mar con olas
  g.fillStyle = '#5aa837'; g.fillRect(Wc * 0.6, mar - 14 * U, Wc * 0.3, 14 * U); g.fillStyle = '#e8d9a0'; g.fillRect(Wc * 0.57, mar - 4 * U, Wc * 0.36, 4 * U);
  const gr = g.createLinearGradient(0, mar, 0, Hc); gr.addColorStop(0, '#3aa6d8'); gr.addColorStop(1, '#0f4f8a'); g.fillStyle = gr; g.fillRect(0, mar, Wc, Hc - mar);
  g.fillStyle = 'rgba(255,255,255,0.18)';
  for (let k = 0; k < 14; k++) { const y = mar + 10 * U + k * 26 * U, off = ((s.olas * (20 + k * 3) + k * 37) % 80) * U; for (let x = -80 * U + off; x < Wc; x += 80 * U) g.fillRect(x, y, 34 * U, 3 * U); }
  // el muelle y el constructor con la caña
  const my = Hc * 0.8;
  for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? '#8a5a2b' : '#9a6532'; g.fillRect(0, my + i * 12 * U, Wc * 0.55, 12 * U); g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(0, my + i * 12 * U + 10 * U, Wc * 0.55, 2 * U); }
  g.fillStyle = '#5a3a1c'; g.fillRect(Wc * 0.55 - 10 * U, my, 10 * U, Hc - my);
  const px = 3.6 * U, cx = Wc * 0.2, cy = my - 32 * px + 6 * U;
  constructor2D(g, cx, cy, px, 0, pielDe(G.traje));
  const fx = Wc * 0.63, fyBase = mar + (Hc - mar) * 0.28;
  const pica = s.fase === 'pica', baja = pica ? 6 * U + Math.sin(t * 30) * 3 * U : Math.sin(t * 2.5) * 2 * U;
  const tipX = cx + 34 * px, tipY = cy - 6 * px;
  g.strokeStyle = '#5a3a1c'; g.lineWidth = 3 * U; g.beginPath(); g.moveTo(cx + 9 * px, cy + 14 * px); g.lineTo(tipX, tipY); g.stroke();
  if (s.fase !== 'listo') {
    g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 1.2 * U; g.beginPath(); g.moveTo(tipX, tipY); g.quadraticCurveTo((tipX + fx) / 2, tipY + 40 * U, fx, fyBase + baja); g.stroke();
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(fx, fyBase + baja, 7 * U, 0, PI); g.fill();
    g.fillStyle = '#e8384f'; g.beginPath(); g.arc(fx, fyBase + baja, 7 * U, PI, TAU); g.fill();
    if (pica) { g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 2 * U; for (let k = 0; k < 2; k++) { const r = ((t * 2 + k * 0.5) % 1) * 30 * U; g.beginPath(); g.ellipse(fx, fyBase + 7 * U, r, r * 0.35, 0, 0, TAU); g.stroke(); } texto(g, '!', fx, fyBase - 30 * U - Math.abs(Math.sin(t * 10)) * 6 * U, 34 * U, '#ffe066', '#101826'); }
  }
  // la barra de tiempo
  if (pica) {
    const bw = Math.min(300 * U, Wc - 40 * U), bx = Wc / 2 - bw / 2, by = Hc * 0.62, P = s.pez;
    g.fillStyle = 'rgba(0,0,0,0.35)'; rr(g, bx - 6 * U, by - 6 * U, bw + 12 * U, 40 * U, 12 * U); g.fill();
    g.fillStyle = '#26324a'; rr(g, bx, by, bw, 28 * U, 8 * U); g.fill();
    g.fillStyle = '#3fae4f'; g.fillRect(bx + bw * (s.zona - P.w / 2), by, bw * P.w, 28 * U);
    g.fillStyle = '#ffd34a'; g.fillRect(bx + bw * (s.zona - P.w / 6), by, bw * P.w / 3, 28 * U);
    const ax = bx + bw * s.aguja;
    g.fillStyle = '#fff'; g.fillRect(ax - 2 * U, by - 8 * U, 4 * U, 44 * U); g.beginPath(); g.moveTo(ax, by - 2 * U); g.lineTo(ax - 8 * U, by - 14 * U); g.lineTo(ax + 8 * U, by - 14 * U); g.closePath(); g.fill();
    texto(g, T('tocaYa'), Wc / 2, by + 56 * U, 16 * U, '#ffffff', '#101826');
  }
  if (s.fase === 'resultado' && s.res) {
    const k = Math.min(1, s.t / 0.3), y = Hc * 0.45;
    g.save(); g.globalAlpha = Math.min(1, (1.8 - s.t) / 0.3);
    if (s.res.ok) {
      g.fillStyle = 'rgba(16,24,38,0.85)'; rr(g, Wc / 2 - 130 * U, y - 80 * U, 260 * U, 160 * U, 18 * U); g.fill();
      dibujarPez(g, Wc / 2, y - 22 * U - (1 - k) * 40 * U, 46 * U * rebote(k), s.res.pez, Math.sin(t * 6) * 0.15);
      texto(g, T('pez.' + s.res.pez.id).toUpperCase(), Wc / 2, y + 30 * U, 16 * U, '#ffffff', '#101826');
      const txt = '+$' + fmt(s.res.plata) + (s.res.perfecto ? '  ' + T('perfecto') : '');
      texto(g, txt, Wc / 2 - (s.res.gemas ? 24 * U : 0), y + 56 * U, tamQueEntra(g, txt, 14 * U, 200 * U), '#ffe066', '#101826');
      if (s.res.gemas) { gema(g, Wc / 2 + 70 * U, y + 55 * U, 9 * U); texto(g, '+' + s.res.gemas, Wc / 2 + 92 * U, y + 56 * U, 14 * U, '#e6c8ff', '#101826'); }
    } else texto(g, T('seEscapo'), Wc / 2, y, 24 * U, '#ffffff', '#101826');
    g.restore();
  }
  barraMJ(g, s, s.plata, s.gemas);
  // cebos y botón de lanzar
  const c = ceboActual(), by = Hc - 70 * U;
  g.fillStyle = 'rgba(16,24,38,0.75)'; rr(g, 14 * U, by - 46 * U, 140 * U, 30 * U, 15 * U); g.fill();
  for (let i = 0; i < CEBO_MAX; i++) { g.fillStyle = i < c ? '#ff8ab0' : 'rgba(255,255,255,0.2)'; g.beginPath(); g.ellipse(32 * U + i * 24 * U, by - 31 * U, 7 * U, 4 * U, 0.4, 0, TAU); g.fill(); }
  if (c < CEBO_MAX) texto(g, fmtReloj(CEBO_SEG - (Date.now() - G.mj.ceboT) / 1000), 170 * U, by - 30 * U, 11 * U, '#ffffff', '#101826', 'left');
  if (s.fase === 'listo') {
    if (c > 0) { const dy = boton(g, Wc / 2 - 90 * U, by, 180 * U, 48 * U, '#3fae4f', () => lanzar(s)); texto(g, T('lanzar'), Wc / 2, by + 24 * U + dy, 18 * U, '#fff', '#101826'); }
    else {
      const dy = boton(g, Wc / 2 - 110 * U, by, 220 * U, 48 * U, adQueda('cebo') > 0 ? '#8a52c8' : '#6b7c93', () => conAnuncio('cebo', () => { G.mj.cebo = CEBO_MAX; G.mj.ceboT = Date.now(); }));
      iconoDibujo(g, 'tv', Wc / 2 - 80 * U, by + 24 * U + dy, 20 * U, '#fff'); texto(g, T('masCebo'), Wc / 2 + 12 * U, by + 24 * U + dy, tamQueEntra(g, T('masCebo'), 15 * U, 160 * U), '#fff', '#101826');
    }
  }
};

// ======================= TORRE DE BLOQUES =======================
const TORRE_B = ['TABLAS', 'LADRILLOS', 'CUARZO', 'LADRILLO_PIEDRA', 'TABLAS_OSC', 'CUARZO_LADRILLO', 'PIZARRA', 'ORO', 'LANA_CELESTE', 'LANA_ROSA'];
const TH = 26;
MJ_INICIO.torre = () => ({ capas: [{ x: 0, w: 150, b: B.PIEDRA }], mov: { x: -190, w: 150, dir: 1, b: B[TORRE_B[0]] }, caen: [], altura: 0, combo: 0, perdido: false, siguio: false, camY: 0, plata: 0, gemas: 0, t: 0, flash: 0 });
MJ_PASO.torre = (s, dt) => {
  s.t += dt; s.flash = Math.max(0, s.flash - dt * 3);
  if (!s.perdido) {
    const v = 125 + s.altura * 9;
    s.mov.x += s.mov.dir * v * dt;
    if (s.mov.x > 190) { s.mov.x = 190; s.mov.dir = -1; } if (s.mov.x < -190) { s.mov.x = -190; s.mov.dir = 1; }
  }
  for (const c of s.caen) { c.vy += 900 * dt; c.y -= c.vy * dt; c.x += c.vx * dt; c.rot += c.vr * dt; }
  s.caen = s.caen.filter(c => c.y > s.camY - 400);
  s.camY = lerp(s.camY, Math.max(0, (s.altura - 6) * TH), 1 - Math.exp(-dt * 4));
};
MJ_TOQUE.torre = (s) => {
  if (s.perdido) return;
  const top = s.capas[s.capas.length - 1], m = s.mov, dx = m.x - top.x, sobra = top.w - Math.abs(dx);
  const yNueva = s.capas.length * TH;
  if (sobra <= 0) {
    s.caen.push({ x: m.x, y: yNueva, w: m.w, b: m.b, vx: m.dir * 60, vy: 0, rot: 0, vr: m.dir * 2 });
    s.perdido = true; Sonido.efecto('martillo', 0.7, 0.6); Sonido.vibrar(60); return;
  }
  let nx, nw;
  if (Math.abs(dx) < 5) { nx = top.x; nw = top.w; s.combo++; if (s.combo % 3 === 0) nw = Math.min(150, nw + 10); s.flash = 1; Sonido.efecto('pop', 0.7, 1 + Math.min(1, s.combo * 0.08)); }
  else {
    s.combo = 0; nx = top.x + dx / 2; nw = sobra;
    const lado = Math.sign(dx), xc = top.x + lado * (top.w / 2 + Math.abs(dx) / 2);
    s.caen.push({ x: xc, y: yNueva, w: Math.abs(dx), b: m.b, vx: lado * 80, vy: 0, rot: 0, vr: lado * 3 });
    Sonido.efecto('martillo', 0.6, 1.1);
  }
  s.capas.push({ x: nx, w: nw, b: m.b }); s.altura++;
  const p = Math.max(1, Math.round(unidadPlata() * 0.12)); s.plata += p;
  if (s.altura === 10) s.gemas += 5; else if (s.altura === 20) s.gemas += 10; else if (s.altura === 30) s.gemas += 20;
  if (s.altura % 10 === 0) Sonido.efecto('desbloquear', 0.7);
  mision('torre', s.altura); G.stats.torre = Math.max(G.stats.torre, s.altura);
  s.mov = { x: (s.altura % 2 ? 190 : -190), w: nw, dir: s.altura % 2 ? -1 : 1, b: B[TORRE_B[s.altura % TORRE_B.length]] };
  Sonido.vibrar(12);
};
MJ_FIN.torre = (s) => { if (s.cobrado) return; s.cobrado = true; ganar(s.plata, s.gemas); };
function losa(g, x, y, w, h, b, k, rot) {
  // una losa en falso 3D: frente con textura, tapa y costado
  const P = BLOQ[b], fr = texturaChica(P.f[1]), tp = texturaChica(P.f[0]), d = 14 * k, e = 10 * k;
  g.save(); g.translate(x, y); if (rot) g.rotate(rot);
  g.imageSmoothingEnabled = false;
  const tile = h;
  g.save(); g.beginPath(); g.rect(-w / 2, -h, w, h); g.clip(); for (let tx = -w / 2; tx < w / 2; tx += tile) g.drawImage(fr, tx, -h, tile, tile); g.restore();
  g.save(); g.beginPath(); g.moveTo(-w / 2, -h); g.lineTo(-w / 2 + d, -h - e); g.lineTo(w / 2 + d, -h - e); g.lineTo(w / 2, -h); g.closePath(); g.clip();
  for (let tx = -w / 2; tx < w / 2 + d; tx += tile) g.drawImage(tp, tx, -h - e, tile, e); g.fillStyle = 'rgba(255,255,255,0.12)'; g.fill(); g.restore();
  g.fillStyle = 'rgba(0,0,0,0.0)';
  g.save(); g.beginPath(); g.moveTo(w / 2, -h); g.lineTo(w / 2 + d, -h - e); g.lineTo(w / 2 + d, -e); g.lineTo(w / 2, 0); g.closePath(); g.clip();
  g.drawImage(fr, w / 2, -h - e, d, h + e); g.fillStyle = 'rgba(0,0,0,0.35)'; g.fill(); g.restore();
  g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = Math.max(1, k); g.strokeRect(-w / 2, -h, w, h);
  g.imageSmoothingEnabled = true;
  g.restore();
}
MJ_DIBUJO.torre = (g, s, t) => {
  const U = UI.U, Wc = CSSW, Hc = CSSH, k = Math.min(Wc / 380, Hc / 640), alto = Math.min(1, s.altura / 40);
  const gr = g.createLinearGradient(0, 0, 0, Hc); gr.addColorStop(0, alto > 0.5 ? '#2a2060' : '#3f8fe0'); gr.addColorStop(1, alto > 0.5 ? '#6a5ad0' : '#bfe8ff');
  g.fillStyle = gr; g.fillRect(0, 0, Wc, Hc);
  if (alto > 0.4) { g.fillStyle = 'rgba(255,255,255,0.8)'; for (let i = 0; i < 40; i++) g.fillRect((hash2(i, 1) * Wc), (hash2(i, 2) * Hc * 0.7), 2 * U, 2 * U); }
  for (let i = 0; i < 4; i++) { const x = ((i * 157 + t * 12) % (Wc + 120)) - 60, y = (Hc * 0.1 + i * Hc * 0.18 + s.camY * k * 0.3) % Hc; nubePixel(g, x, y, 5 * U); }
  const baseY = Hc * 0.86, X = x => Wc / 2 + x * k, Y = y => baseY - (y - s.camY) * k;
  g.fillStyle = '#5aa837'; g.fillRect(0, Y(0), Wc, Hc); g.fillStyle = '#8b5a2b'; g.fillRect(0, Y(0) + 10 * k, Wc, Hc);
  s.capas.forEach((c, i) => { const y = Y(i * TH); if (y < -60 || y > Hc + 60) return; losa(g, X(c.x), y, c.w * k, TH * k, c.b, k); });
  for (const c of s.caen) losa(g, X(c.x), Y(c.y), c.w * k, TH * k, c.b, k, c.rot);
  if (!s.perdido) losa(g, X(s.mov.x), Y(s.capas.length * TH), s.mov.w * k, TH * k, s.mov.b, k);
  if (s.flash > 0) { g.fillStyle = 'rgba(255,255,255,' + s.flash * 0.35 + ')'; g.fillRect(0, 0, Wc, Hc); }
  texto(g, String(s.altura), Wc / 2, 92 * U, 46 * U, '#ffffff', '#101826');
  if (s.combo >= 2) texto(g, T('perfecto') + ' x' + s.combo, Wc / 2, 132 * U, 14 * U, '#ffe066', '#101826');
  barraMJ(g, s, s.plata, s.gemas);
  if (!s.perdido && s.altura === 0) texto(g, T('tocaSoltar'), Wc / 2, Hc * 0.5, 15 * U, '#ffffff', '#101826');
  if (s.perdido) {
    const w = Math.min(Wc - 40 * U, 300 * U), x = Wc / 2 - w / 2, y = Hc * 0.36;
    tarjeta(g, x, y, w, 210 * U);
    texto(g, T('pisos', { n: s.altura }), Wc / 2, y + 34 * U, 20 * U, '#ffd34a', '#101826');
    moneda(g, Wc / 2 - 50 * U, y + 72 * U, 11 * U); texto(g, fmt(s.plata), Wc / 2 - 34 * U, y + 73 * U, 16 * U, '#fff', '#101826', 'left');
    gema(g, Wc / 2 + 30 * U, y + 72 * U, 11 * U); texto(g, String(s.gemas), Wc / 2 + 46 * U, y + 73 * U, 16 * U, '#fff', '#101826', 'left');
    if (!s.siguio) {
      const dy = boton(g, x + 24 * U, y + 100 * U, w - 48 * U, 40 * U, '#8a52c8', () => conAnuncio('completar', () => { s.siguio = true; s.perdido = false; const top = s.capas[s.capas.length - 1]; s.mov = { x: -190, w: top.w, dir: 1, b: s.mov.b }; s.caen.length = 0; }));
      iconoDibujo(g, 'tv', x + 52 * U, y + 120 * U + dy, 18 * U, '#fff'); texto(g, T('seguir'), Wc / 2 + 12 * U, y + 120 * U + dy, tamQueEntra(g, T('seguir'), 15 * U, w - 110 * U), '#fff', '#101826');
    }
    const dy = boton(g, x + 50 * U, y + 152 * U, w - 100 * U, 38 * U, '#3fae4f', () => terminarMJ(s));
    texto(g, T('cobrar'), Wc / 2, y + 171 * U + dy, 15 * U, '#fff', '#101826');
  }
};

// ======================= EXCAVACIÓN =======================
MJ_INICIO.excava = () => {
  const tipos = ['cofre', 'gemas', 'gemas', 'plata', 'plata', 'plata', 'plata', 'plata'];
  while (tipos.length < 16) tipos.push('nada');
  for (let i = tipos.length - 1; i > 0; i--) { const j = Math.floor(az() * (i + 1)); [tipos[i], tipos[j]] = [tipos[j], tipos[i]]; }
  const u = unidadPlata();
  return { celdas: tipos.map(tp => ({ tp, n: tp === 'cofre' ? u * 4 : tp === 'plata' ? Math.round(u * azR(0.4, 1)) : tp === 'gemas' ? 3 + Math.floor(az() * 4) : 0, abierta: false, t: 0 })), picos: 3, extra: false, plata: 0, gemas: 0, t: 0 };
};
MJ_PASO.excava = (s, dt) => { s.t += dt; for (const c of s.celdas) if (c.abierta) c.t += dt; };
function celdaExcava(s, x, y) {
  const U = UI.U, Wc = CSSW, Hc = CSSH, cs = Math.min(76 * U, (Wc - 40 * U) / 4), ox = Wc / 2 - cs * 2, oy = Hc * 0.24;
  return { cs, ox, oy, i: x >= ox && y >= oy && x < ox + cs * 4 && y < oy + cs * 4 ? Math.floor((y - oy) / cs) * 4 + Math.floor((x - ox) / cs) : -1 };
}
MJ_TOQUE.excava = (s, x, y) => {
  const { i } = celdaExcava(s, x, y);
  if (i < 0 || s.picos <= 0) return;
  const c = s.celdas[i]; if (c.abierta) return;
  c.abierta = true; c.t = 0; s.picos--;
  if (c.tp === 'plata' || c.tp === 'cofre') s.plata += c.n;
  if (c.tp === 'gemas') s.gemas += c.n;
  Sonido.efecto('pala', 0.8, 0.9 + vis() * 0.2, 0.01);
  if (c.tp !== 'nada') Sonido.efecto(c.tp === 'cofre' ? 'cofre' : 'moneda', 0.7, 1.1); Sonido.vibrar(c.tp === 'nada' ? 15 : 30);
};
MJ_FIN.excava = (s) => { if (s.cobrado) return; s.cobrado = true; ganar(s.plata, s.gemas); };
MJ_DIBUJO.excava = (g, s, t) => {
  const U = UI.U, Wc = CSSW, Hc = CSSH;
  fondoCielo(g, '#58b6ee', '#bfe8ff', Wc, Hc, 1);
  const { cs, ox, oy } = celdaExcava(s, 0, 0);
  g.fillStyle = '#7b4f25'; rr(g, ox - 10 * U, oy - 10 * U, cs * 4 + 20 * U, cs * 4 + 20 * U, 14 * U); g.fill();
  texto(g, T('excavaTit'), Wc / 2, oy - 34 * U, 18 * U, '#ffffff', '#101826');
  const pasto = texturaChica(TEX.capa.pasto_arriba), tierra = texturaChica(TEX.capa.tierra);
  s.celdas.forEach((c, i) => {
    const x = ox + (i % 4) * cs, y = oy + Math.floor(i / 4) * cs, m = 3 * U;
    g.imageSmoothingEnabled = false;
    if (!c.abierta) {
      g.drawImage(pasto, x + m, y + m, cs - 2 * m, cs - 2 * m);
      g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(x + m, y + m, cs - 2 * m, 4 * U); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x + m, y + cs - m - 5 * U, cs - 2 * m, 5 * U);
    } else {
      g.drawImage(tierra, x + m, y + m, cs - 2 * m, cs - 2 * m); g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x + m, y + m, cs - 2 * m, cs - 2 * m);
      const k = Math.min(1, c.t / 0.35), sube = (1 - rebote(k)) * 20 * U, cx = x + cs / 2, cy = y + cs / 2 - sube;
      if (c.tp === 'plata') { moneda(g, cx, cy - 6 * U, 13 * U); texto(g, fmt(c.n), cx, cy + 18 * U, 11 * U, '#fff', '#101826'); }
      else if (c.tp === 'gemas') { gema(g, cx, cy - 6 * U, 13 * U); texto(g, '+' + c.n, cx, cy + 18 * U, 11 * U, '#fff', '#101826'); }
      else if (c.tp === 'cofre') { if (!dibujarIcono(g, 'cofre', cx, cy - 6 * U, 38 * U)) g.drawImage(iconoBloque(B.CAJA), cx - 16 * U, cy - 24 * U, 32 * U, 35.8 * U); texto(g, fmt(c.n), cx, cy + 20 * U, 11 * U, '#ffe066', '#101826'); }
      else { g.fillStyle = '#8a8a8e'; g.beginPath(); g.moveTo(cx - 12 * U, cy + 8 * U); g.lineTo(cx - 6 * U, cy - 8 * U); g.lineTo(cx + 8 * U, cy - 6 * U); g.lineTo(cx + 12 * U, cy + 8 * U); g.closePath(); g.fill(); }
    }
    g.imageSmoothingEnabled = true;
  });
  barraMJ(g, s, s.plata, s.gemas);
  const by = oy + cs * 4 + 24 * U;
  for (let i = 0; i < 3 + (s.extra ? 2 : 0); i++) { const x = Wc / 2 + (i - 1 - (s.extra ? 1 : 0)) * 30 * U; g.globalAlpha = i < s.picos ? 1 : 0.25; iconoDibujo(g, 'pala', x, by, 22 * U, '#ffe066'); g.globalAlpha = 1; }
  if (s.picos <= 0) {
    if (!s.extra) {
      const dy = boton(g, Wc / 2 - 120 * U, by + 26 * U, 240 * U, 42 * U, '#8a52c8', () => conAnuncio('excava', () => { s.extra = true; s.picos += 2; }));
      iconoDibujo(g, 'tv', Wc / 2 - 92 * U, by + 47 * U + dy, 18 * U, '#fff'); texto(g, T('masPicos'), Wc / 2 + 12 * U, by + 47 * U + dy, tamQueEntra(g, T('masPicos'), 15 * U, 170 * U), '#fff', '#101826');
    }
    const dy = boton(g, Wc / 2 - 80 * U, by + 80 * U, 160 * U, 40 * U, '#3fae4f', () => terminarMJ(s));
    texto(g, T('cobrar'), Wc / 2, by + 100 * U + dy, 15 * U, '#fff', '#101826');
  } else texto(g, T('elegiCelda'), Wc / 2, by + 34 * U, 13 * U, '#ffffff', '#101826');
};

// ---------- el menú de minijuegos ----------
function panelMinijuegos(g, t) {
  const U = UI.U, M = abrirMarco(g, 330 * U, 520 * U), { x, y, w } = M;
  tarjeta(g, x, y, w, M.h);
  texto(g, T('minijuegos'), x + w / 2, y + 26 * U, 20 * U, '#ffd34a', '#101826');
  botonCerrar(g, x + w - 44 * U, y + 9 * U);
  const items = [
    { id: 'pesca', quedan: ceboActual(), max: CEBO_MAX, icono: (cx, cy) => dibujarPez(g, cx, cy, 26 * U, PECES[1], Math.sin(t * 3) * 0.2), ad: 'cebo', extra: () => { G.mj.cebo = CEBO_MAX; G.mj.ceboT = Date.now(); } },
    { id: 'torre', quedan: partidasTorre(), max: TORRE_GRATIS, icono: (cx, cy) => { losa(g, cx, cy + 22 * U, 46 * U, 14 * U, B.PIEDRA, 0.8 * U); losa(g, cx + 3 * U, cy + 8 * U, 40 * U, 14 * U, B.LADRILLOS, 0.8 * U); losa(g, cx, cy - 6 * U, 40 * U, 14 * U, B.ORO, 0.8 * U); }, ad: 'torre', extra: () => { mjDia(); G.mj.torreExtra = (G.mj.torreExtra || 0) + 1; } },
    { id: 'excava', quedan: partidasExcava(), max: EXCAVA_GRATIS, icono: (cx, cy) => { g.drawImage(iconoBloque(B.PASTO), cx - 26 * U, cy - 22 * U, 52 * U, 58 * U); iconoDibujo(g, 'pala', cx + 18 * U, cy - 14 * U, 26 * U, '#ffe066'); }, ad: 'excava', extra: () => { mjDia(); G.mj.excavaExtra = (G.mj.excavaExtra || 0) + 1; } },
  ];
  items.forEach((it, i) => {
    const yy = y + 56 * U + i * 150 * U;
    tarjetaItem(g, x + 10 * U, yy, w - 20 * U, 142 * U, false);
    it.icono(x + 58 * U, yy + 58 * U);
    texto(g, T('mj.' + it.id).toUpperCase(), x + 106 * U, yy + 26 * U, 16 * U, '#fff', '#101826', 'left');
    envolver(g, T('mjDesc.' + it.id), x + 106 * U + (w - 136 * U) / 2, yy + 58 * U, w - 136 * U, 9.5 * U, '#cfe6ff');
    texto(g, (it.id === 'pesca' ? T('cebos') : T('partidas')) + ': ' + Math.max(0, it.quedan) + '/' + it.max, x + 106 * U, yy + 92 * U, 11 * U, '#ffe066', '#101826', 'left');
    if (it.quedan > 0) {
      const dy = boton(g, x + w - 132 * U, yy + 98 * U, 110 * U, 34 * U, '#3fae4f', () => abrirMinijuego(it.id));
      texto(g, T('jugar'), x + w - 77 * U, yy + 115 * U + dy, 15 * U, '#fff', '#101826');
    } else {
      const dy = boton(g, x + w - 132 * U, yy + 98 * U, 110 * U, 34 * U, adQueda(it.ad) > 0 ? '#8a52c8' : '#6b7c93', () => conAnuncio(it.ad, it.extra));
      iconoDibujo(g, 'tv', x + w - 108 * U, yy + 115 * U + dy, 16 * U, '#fff'); texto(g, '+' + (it.id === 'pesca' ? CEBO_MAX : 1), x + w - 66 * U, yy + 116 * U + dy, 14 * U, '#fff', '#101826');
    }
  });
  cerrarMarco(g);
}

// MANSION BUILDER — la interfaz (lienzo 2D arriba del 3D): plata, la parte en obra, botones, ajustes, carteles,
// flecha de objetivo y joystick. Todo en píxeles CSS escalados por U (el lado corto mide 360).
const FUENTE = (window.__fuenteTT ? "'" + window.__fuenteTT + "', " : '') + "Bungee, 'Arial Black', Impact, sans-serif";
const AJ = { musica: true, sonido: true, vibra: true, calidad: -1, idioma: 'auto', joy: 'flota', joyTam: 1 };
const UI = {
  cv: null, g: null, U: 1, botones: [], avisos: [], fests: [], pulso: 0, panel: null, iconos: {}, tex16: {}, joy: { activo: false, id: -1, x0: 0, y0: 0, x: 0, y: 0, vx: 0, vy: 0 },
  aviso(s, tipo) {
    const ahora = VIVO.t; if (this.ultAviso && this.ultAviso.s === s && ahora - this.ultAviso.t < 2.5) return;
    this.ultAviso = { s, t: ahora };
    if (this.avisos.length > 3) this.avisos.shift(); this.avisos.push({ s, tipo: tipo || 'blanco', t: 0 });
  },
  pasar(dt) {
    for (let i = this.avisos.length - 1; i >= 0; i--) { this.avisos[i].t += dt; if (this.avisos[i].t > 1.6) this.avisos.splice(i, 1); }
    if (this.fests.length) { const f = this.fests[0]; f.t += dt; if (f.t > (f.grande ? 4.5 : 2.6)) this.fests.shift(); }
  },
  festejo(titulo, sub, grande) { if (this.fests.length > 1) this.fests.splice(0, this.fests.length - 1); this.fests.push({ titulo, sub, grande, t: 0 }); },
  pulsoPlata() { this.pulso = 1; },
  pulsoGemas() { this.pulsoG = 1; },
};
function rr(g, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function letra(g, tam) { g.font = tam + 'px ' + FUENTE; }
function texto(g, s, x, y, tam, col, borde, al, bw) {
  letra(g, tam); g.textAlign = al || 'center'; g.textBaseline = 'middle';
  if (borde) { g.lineJoin = 'round'; g.lineWidth = bw || Math.max(2, tam * 0.24); g.strokeStyle = borde; g.strokeText(s, x, y); }
  g.fillStyle = col; g.fillText(s, x, y);
}
function tamQueEntra(g, s, tam, max) { letra(g, tam); const w = g.measureText(s).width; return w > max ? Math.max(6, tam * max / w) : tam; }
// ---------- íconos ----------
function texturaChica(capa) {
  if (UI.tex16[capa]) return UI.tex16[capa];
  const c = lienzo(16, 16), g = c.getContext('2d'), im = g.createImageData(16, 16);
  im.data.set(TEX.datos.subarray(capa * 1024, capa * 1024 + 1024)); g.putImageData(im, 0, 0);
  return (UI.tex16[capa] = c);
}
// un bloque en perspectiva isométrica, pintado con sus texturas
function iconoBloque(b) {
  const s = 64, k = b; if (UI.iconos[k]) return UI.iconos[k];
  const c = lienzo(s, s * 1.12), g = c.getContext('2d'), P = BLOQ[b];
  g.imageSmoothingEnabled = false;
  const caras = [[P.f[0], s / 32, -s / 64, s / 32, s / 64, 0, s / 4, 0], [P.f[1], s / 32, s / 64, 0, s / 32, 0, s / 4, 0.2], [P.f[3], s / 32, -s / 64, 0, s / 32, s / 2, s / 2, 0.38]];
  const poli = [[[0, s / 4], [s / 2, 0], [s, s / 4], [s / 2, s / 2]], [[0, s / 4], [s / 2, s / 2], [s / 2, s], [0, s * 0.75]], [[s / 2, s / 2], [s, s / 4], [s, s * 0.75], [s / 2, s]]];
  caras.forEach(([capa, a, bb, cc, d, e, f, osc], i) => {
    g.save(); g.beginPath(); poli[i].forEach(([x, y], j) => j ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.clip();
    g.setTransform(a, bb, cc, d, e, f); g.drawImage(texturaChica(capa), 0, 0); g.setTransform(1, 0, 0, 1, 0, 0);
    if (osc) { g.fillStyle = 'rgba(0,0,0,' + osc + ')'; g.fillRect(0, 0, s, s * 1.12); }
    g.restore();
  });
  g.strokeStyle = 'rgba(20,24,40,0.55)'; g.lineWidth = Math.max(1, s / 28); g.beginPath();
  g.moveTo(s / 2, s / 2); g.lineTo(s / 2, s); g.moveTo(0, s / 4); g.lineTo(s / 2, 0); g.lineTo(s, s / 4); g.lineTo(s, s * 0.75); g.lineTo(s / 2, s); g.lineTo(0, s * 0.75); g.closePath(); g.stroke();
  return (UI.iconos[k] = c);
}
function moneda(g, x, y, r) {
  if (dibujarIcono(g, 'moneda', x, y, r * 2.4)) return;
  const gr = g.createLinearGradient(x, y - r, x, y + r); gr.addColorStop(0, '#fff3a8'); gr.addColorStop(0.5, '#ffc928'); gr.addColorStop(1, '#d88a10');
  g.fillStyle = '#8a4a08'; g.beginPath(); g.arc(x, y + r * 0.12, r, 0, TAU); g.fill();
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  g.strokeStyle = '#b86a0a'; g.lineWidth = r * 0.14; g.beginPath(); g.arc(x, y, r * 0.72, 0, TAU); g.stroke();
  texto(g, '$', x, y + r * 0.06, r * 1.05, '#b0620a', null);
}
// los dibujos que tienen su ícono de Higgsfield en la hoja (cruz, flechas y compartir siguen dibujados)
const ICONO_IMG = { engranaje: 'ajustes', regalo: 'regalo', tv: 'anuncio', carrito: 'bolsa', estrella: 'estrella', mando: 'bloques', ruleta: 'ruleta', pala: 'pico', calendario: 'calendario' };
function iconoDibujo(g, tipo, x, y, s, col) {
  if (ICONO_IMG[tipo] && dibujarIcono(g, ICONO_IMG[tipo], x, y, s * 1.25)) return;
  g.save(); g.translate(x, y); g.fillStyle = col; g.strokeStyle = col; g.lineCap = 'round'; g.lineJoin = 'round';
  if (tipo === 'engranaje') {
    g.beginPath(); for (let k = 0; k < 16; k++) { const a = k / 16 * TAU, r = k % 2 ? s * 0.5 : s * 0.38; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill();
    g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(0, 0, s * 0.17, 0, TAU); g.fill();
  } else if (tipo === 'regalo') {
    g.fillRect(-s * 0.42, -s * 0.12, s * 0.84, s * 0.55); g.fillRect(-s * 0.48, -s * 0.3, s * 0.96, s * 0.2);
    g.fillStyle = '#e8384f'; g.fillRect(-s * 0.08, -s * 0.3, s * 0.16, s * 0.73);
    g.lineWidth = s * 0.1; g.strokeStyle = '#e8384f'; g.beginPath(); g.ellipse(-s * 0.16, -s * 0.38, s * 0.16, s * 0.09, -0.4, 0, TAU); g.ellipse(s * 0.16, -s * 0.38, s * 0.16, s * 0.09, 0.4, 0, TAU); g.stroke();
  } else if (tipo === 'compartir') {
    g.lineWidth = s * 0.11; const p = [[s * 0.3, -s * 0.32], [-s * 0.3, 0], [s * 0.3, s * 0.32]];
    g.beginPath(); g.moveTo(...p[0]); g.lineTo(...p[1]); g.lineTo(...p[2]); g.stroke();
    for (const q of p) { g.beginPath(); g.arc(q[0], q[1], s * 0.15, 0, TAU); g.fill(); }
  } else if (tipo === 'cruz') {
    g.lineWidth = s * 0.18; g.beginPath(); g.moveTo(-s * 0.3, -s * 0.3); g.lineTo(s * 0.3, s * 0.3); g.moveTo(s * 0.3, -s * 0.3); g.lineTo(-s * 0.3, s * 0.3); g.stroke();
  } else if (tipo === 'tv') {
    g.lineWidth = s * 0.12; rr(g, -s * 0.48, -s * 0.34, s * 0.96, s * 0.68, s * 0.14); g.stroke();
    g.beginPath(); g.moveTo(-s * 0.12, -s * 0.18); g.lineTo(s * 0.22, 0); g.lineTo(-s * 0.12, s * 0.18); g.closePath(); g.fill();
  } else if (tipo === 'carrito') {
    g.lineWidth = s * 0.1; g.beginPath(); g.moveTo(-s * 0.5, -s * 0.36); g.lineTo(-s * 0.32, -s * 0.36); g.lineTo(-s * 0.18, s * 0.16); g.lineTo(s * 0.38, s * 0.16); g.lineTo(s * 0.48, -s * 0.2); g.lineTo(-s * 0.26, -s * 0.2); g.stroke();
    g.beginPath(); g.arc(-s * 0.12, s * 0.34, s * 0.1, 0, TAU); g.arc(s * 0.3, s * 0.34, s * 0.1, 0, TAU); g.fill();
  } else if (tipo === 'estrella') {
    g.beginPath(); for (let k = 0; k < 10; k++) { const a = -PI / 2 + k / 10 * TAU, r = k % 2 ? s * 0.22 : s * 0.5; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill();
  } else if (tipo === 'mando') {
    rr(g, -s * 0.5, -s * 0.24, s, s * 0.5, s * 0.24); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(-s * 0.34, -s * 0.04, s * 0.22, s * 0.08); g.fillRect(-s * 0.27, -s * 0.11, s * 0.08, s * 0.22);
    g.beginPath(); g.arc(s * 0.2, -s * 0.06, s * 0.06, 0, TAU); g.arc(s * 0.32, s * 0.06, s * 0.06, 0, TAU); g.fill();
  } else if (tipo === 'ruleta') {
    const cs = ['#ff5a6e', '#ffd34a', '#5ee06a', '#5ab8ff'];
    for (let k = 0; k < 8; k++) { g.fillStyle = cs[k % 4]; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, s * 0.46, k / 8 * TAU, (k + 1) / 8 * TAU); g.closePath(); g.fill(); }
    g.fillStyle = '#fff'; g.beginPath(); g.arc(0, 0, s * 0.1, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(0, -s * 0.34); g.lineTo(-s * 0.1, -s * 0.56); g.lineTo(s * 0.1, -s * 0.56); g.closePath(); g.fill();
  } else if (tipo === 'pala') {
    g.lineWidth = s * 0.12; g.beginPath(); g.moveTo(-s * 0.3, s * 0.3); g.lineTo(s * 0.18, -s * 0.18); g.stroke();
    g.beginPath(); g.moveTo(s * 0.1, -s * 0.3); g.lineTo(s * 0.42, -s * 0.48); g.lineTo(s * 0.5, -s * 0.12); g.lineTo(s * 0.3, -s * 0.02); g.closePath(); g.fill();
  } else if (tipo === 'calendario') {
    rr(g, -s * 0.42, -s * 0.34, s * 0.84, s * 0.76, s * 0.1); g.fill();
    g.fillStyle = '#e8384f'; g.fillRect(-s * 0.42, -s * 0.34, s * 0.84, s * 0.22);
    g.fillStyle = 'rgba(0,0,0,0.35)'; for (let k = 0; k < 6; k++) g.fillRect(-s * 0.3 + (k % 3) * s * 0.22, -s * 0.02 + Math.floor(k / 3) * s * 0.2, s * 0.14, s * 0.12);
  } else if (tipo === 'izq' || tipo === 'der') {
    const d = tipo === 'izq' ? -1 : 1; g.beginPath(); g.moveTo(d * s * 0.3, 0); g.lineTo(-d * s * 0.2, -s * 0.32); g.lineTo(-d * s * 0.2, s * 0.32); g.closePath(); g.fill();
  }
  g.restore();
}
// botón de bloque: cara de arriba de color y canto oscuro (como un bloque visto de costado)
function boton(g, x, y, w, h, col, f, apretado) {
  const U = UI.U, canto = 5 * U, dy = apretado ? canto * 0.6 : 0;
  g.fillStyle = 'rgba(0,0,0,0.25)'; rr(g, x, y + canto + 2 * U, w, h, 10 * U); g.fill();
  g.fillStyle = mezcla(col, '#000000', 0.38); rr(g, x, y + canto, w, h, 10 * U); g.fill();
  const gr = g.createLinearGradient(0, y + dy, 0, y + dy + h); gr.addColorStop(0, mezcla(col, '#ffffff', 0.25)); gr.addColorStop(1, col);
  g.fillStyle = gr; rr(g, x, y + dy, w, h, 10 * U); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 2 * U; rr(g, x + 2 * U, y + dy + 2 * U, w - 4 * U, h * 0.45, 8 * U); g.stroke();
  if (f) { const e = UI.esc; UI.botones.push(e ? { x: e.cx + (x - e.cx) * e.k, y: e.cy + (y - e.cy) * e.k, w: w * e.k, h: (h + canto) * e.k, f } : { x, y, w, h: h + canto, f }); }
  return dy;
}
function tarjeta(g, x, y, w, h) {
  const U = UI.U;
  g.fillStyle = 'rgba(0,0,0,0.28)'; rr(g, x, y + 5 * U, w, h, 16 * U); g.fill();
  g.fillStyle = '#2b3a55'; rr(g, x, y, w, h, 16 * U); g.fill();
  g.fillStyle = '#3b5078'; rr(g, x + 4 * U, y + 4 * U, w - 8 * U, h - 8 * U, 13 * U); g.fill();
  g.strokeStyle = '#1a2438'; g.lineWidth = 3 * U; rr(g, x, y, w, h, 16 * U); g.stroke();
}
function gema(g, x, y, r) {
  if (dibujarIcono(g, 'gema', x, y, r * 2.5)) return;
  const pts = [[0, -1], [0.85, -0.35], [0.6, 0.75], [-0.6, 0.75], [-0.85, -0.35]];
  g.fillStyle = '#4a1d7a'; g.beginPath(); pts.forEach(([a, b], i) => i ? g.lineTo(x + a * r, y + b * r + r * 0.12) : g.moveTo(x + a * r, y + b * r + r * 0.12)); g.closePath(); g.fill();
  const gr = g.createLinearGradient(x, y - r, x, y + r); gr.addColorStop(0, '#f2d6ff'); gr.addColorStop(0.5, '#c06cf0'); gr.addColorStop(1, '#7a2ec0');
  g.fillStyle = gr; g.beginPath(); pts.forEach(([a, b], i) => i ? g.lineTo(x + a * r, y + b * r) : g.moveTo(x + a * r, y + b * r)); g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.moveTo(x, y - r); g.lineTo(x + 0.85 * r, y - 0.35 * r); g.lineTo(x, y - 0.1 * r); g.lineTo(x - 0.85 * r, y - 0.35 * r); g.closePath(); g.fill();
}
// un marco de panel que entra en la pantalla (si no entra, se achica todo junto, también los toques)
function abrirMarco(g, w, h) {
  const U = UI.U, Wc = CSSW, Hc = CSSH, k = Math.min(1, (Hc - 12 * U) / h, (Wc - 8 * U) / w);
  UI.esc = { cx: Wc / 2, cy: Hc / 2, k };
  g.save(); g.translate(Wc / 2, Hc / 2); g.scale(k, k); g.translate(-Wc / 2, -Hc / 2);
  return { x: Wc / 2 - w / 2, y: Hc / 2 - h / 2, w, h };
}
function cerrarMarco(g) { g.restore(); UI.esc = null; }
function botonCerrar(g, x, y, f) { const U = UI.U, dy = boton(g, x, y, 36 * U, 32 * U, '#d9485f', f || cerrarPanel); iconoDibujo(g, 'cruz', x + 18 * U, y + 16 * U + dy, 22 * U, '#fff'); }
function monedasPanel(g, cx, cy) {
  const U = UI.U;
  g.fillStyle = 'rgba(16,24,38,0.7)'; rr(g, cx - 120 * U, cy - 12 * U, 240 * U, 24 * U, 12 * U); g.fill();
  moneda(g, cx - 104 * U, cy, 8 * U); texto(g, fmt(G.dinero), cx - 92 * U, cy + 1 * U, 12 * U, '#ffe066', '#101826', 'left');
  gema(g, cx + 30 * U, cy, 8 * U); texto(g, fmt(G.gemas), cx + 42 * U, cy + 1 * U, 12 * U, '#e6c8ff', '#101826', 'left');
}
function pestanas(g, x, y, w, nombres, actual, f, iconos) {
  const U = UI.U, n = nombres.length, bw = (w - (n - 1) * 4 * U) / n;
  nombres.forEach((s, i) => {
    const bx = x + i * (bw + 4 * U), dy = boton(g, bx, y, bw, 30 * U, i === actual ? '#e8a33a' : '#56708f', () => f(i), i === actual);
    const ix = iconos && iconos[i] && dibujarIcono(g, iconos[i], bx + 13 * U, y + 15 * U + dy, 21 * U) ? 22 * U : 0;
    texto(g, s, bx + ix + (bw - ix) / 2, y + 15 * U + dy, tamQueEntra(g, s, 11 * U, bw - ix - 6 * U), '#fff', '#101826');
  });
}
function tarjetaItem(g, x, y, w, h, marcado) {
  const U = UI.U;
  g.fillStyle = marcado ? '#2f7a4a' : '#2b3a55'; rr(g, x, y, w, h, 10 * U); g.fill();
  g.strokeStyle = marcado ? '#8dffa0' : 'rgba(255,255,255,0.18)'; g.lineWidth = 2 * U; rr(g, x, y, w, h, 10 * U); g.stroke();
}
function insignia(g, x, y) { const U = UI.U; g.fillStyle = '#ff3b4e'; g.beginPath(); g.arc(x, y, 7 * U, 0, TAU); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 1.5 * U; g.stroke(); texto(g, '!', x, y + 0.5 * U, 10 * U, '#fff', null); }
// ---------- la interfaz del juego ----------
function dibujarUI(g, dt, t) {
  const U = UI.U, Wc = CSSW, Hc = CSSH;
  UI.botones.length = 0;
  g.clearRect(0, 0, Wc, Hc);
  UI.pulso = Math.max(0, UI.pulso - dt * 4);
  etiquetasMundo(g, t);
  flechaObjetivo(g, t);
  // la plata y las gemas
  UI.pulsoG = Math.max(0, (UI.pulsoG || 0) - dt * 4);
  const sPlata = fmt(G.dinero), sGemas = fmt(G.gemas), hp = 40 * U, yp = 10 * U;
  letra(g, 20 * U); const wp = Math.max(110 * U, g.measureText(sPlata).width + 62 * U), wg = Math.max(70 * U, g.measureText(sGemas).width + 50 * U);
  const x0 = Wc / 2 - (wp + 6 * U + wg) / 2;
  const pastilla = (x, w, borde) => { g.fillStyle = 'rgba(0,0,0,0.3)'; rr(g, x, yp + 4 * U, w, hp, hp / 2); g.fill(); g.fillStyle = 'rgba(24,34,54,0.86)'; rr(g, x, yp, w, hp, hp / 2); g.fill(); g.strokeStyle = borde; g.lineWidth = 2.5 * U; rr(g, x, yp, w, hp, hp / 2); g.stroke(); };
  pastilla(x0, wp, '#ffd34a'); moneda(g, x0 + 20 * U, yp + hp / 2, 13 * U);
  texto(g, sPlata, x0 + 38 * U + (wp - 46 * U) / 2, yp + hp / 2 + 1 * U, 20 * U * (1 + UI.pulso * 0.12), '#ffffff', '#101826');
  const xg = x0 + wp + 6 * U;
  pastilla(xg, wg, '#c06cf0'); gema(g, xg + 19 * U, yp + hp / 2, 11 * U);
  texto(g, sGemas, xg + 34 * U + (wg - 42 * U) / 2, yp + hp / 2 + 1 * U, 18 * U * (1 + UI.pulsoG * 0.15), '#ffffff', '#101826');
  // izquierda: ajustes y el boost x2 por anuncio
  const bs = 44 * U;
  let dy = boton(g, 10 * U, 10 * U, bs, bs, '#4a7fb5', () => abrirPanel('ajustes'));
  iconoDibujo(g, 'engranaje', 10 * U + bs / 2, 10 * U + bs / 2 + dy, bs * 0.62, '#ffffff');
  if (G.parte >= 1) {
    const activo = G.boosts.x2 > 0;
    dy = boton(g, 10 * U, 64 * U, bs, bs, activo ? '#3fae4f' : '#8a52c8', activo ? null : () => conAnuncio('boost', () => { G.boosts.x2 += 300; UI.aviso('x2 $!', 'oro'); Sonido.efecto('desbloquear', 0.8); }));
    texto(g, 'x2', 10 * U + bs / 2, 64 * U + bs / 2 - 5 * U + dy, 15 * U, '#ffe066', '#101826');
    if (activo) texto(g, fmtReloj(G.boosts.x2), 10 * U + bs / 2, 64 * U + bs - 9 * U + dy, 9 * U, '#ffffff', '#101826');
    else iconoDibujo(g, 'tv', 10 * U + bs / 2, 64 * U + bs - 10 * U + dy, 13 * U, '#ffffff');
    // los otros boosts activos, chiquitos debajo
    let yb = 120 * U;
    for (const k of ['vel', 'iman']) if (G.boosts[k] > 0) {
      g.fillStyle = 'rgba(24,34,54,0.8)'; rr(g, 8 * U, yb, 48 * U, 22 * U, 11 * U); g.fill();
      if (!(k === 'vel' && dibujarIcono(g, 'reloj', 19 * U, yb + 11 * U, 20 * U))) g.drawImage(iconoBloque(k === 'vel' ? B.LANA_CELESTE : B.HIERRO), 11 * U, yb + 2 * U, 16 * U, 17.9 * U);
      texto(g, fmtReloj(G.boosts[k]), 42 * U, yb + 11.5 * U, 9 * U, '#fff', '#101826'); yb += 26 * U;
    }
  }
  // derecha: calendario, compartir, tienda, actividades, minijuegos y ruleta
  const xb = Wc - 10 * U - bs, col = [
    ['calendario', '#e8a33a', () => { ACT.pestana = 'calendario'; abrirPanel('actividades'); }, calendarioListo()],
    ['compartir', '#3aa0e8', () => compartir(), false],
    ['carrito', '#3fae4f', () => abrirTienda(), false],
    ['estrella', '#d9485f', () => { ACT.pestana = 'misiones'; abrirPanel('actividades'); }, hayMision()],
    ['mando', '#8a52c8', () => abrirPanel('minijuegos'), ceboActual() >= CEBO_MAX || partidasTorre() > 0],
    ['ruleta', '#f2a516', () => abrirPanel('ruleta'), ruletaGratis()],
  ];
  const paso = Math.min(54 * U, (Hc - 20 * U) / col.length);
  col.forEach(([ic, c, f, avisa], i) => {
    if (i >= 2 && G.parte < 1) return;
    const yb = 10 * U + i * paso, d = boton(g, xb, yb, bs, bs, c, f);
    iconoDibujo(g, ic, xb + bs / 2, yb + bs / 2 + d, bs * 0.6, '#ffffff');
    if (avisa) insignia(g, xb + bs - 3 * U, yb + 4 * U);
  });
  // la parte en obra
  tarjetaParte(g, t);
  // avisos que suben desde el constructor
  const pj = M4.proyectar(R.VP, JUG.x, JUG.y + 2.4, JUG.z);
  let ya = pj ? pj[1] * Hc : Hc * 0.45;
  for (let i = UI.avisos.length - 1; i >= 0; i--) {
    const a = UI.avisos[i];
    if (a.t > 1.6) continue;
    const al = a.t < 0.15 ? a.t / 0.15 : a.t > 1.2 ? (1.6 - a.t) / 0.4 : 1, sube = salida(a.t / 1.6) * 34 * U;
    const col = { rojo: '#ff5a5a', oro: '#ffd34a', gris: '#d8dde6', blanco: '#ffffff' }[a.tipo] || '#fff';
    g.globalAlpha = al; texto(g, a.s, Wc / 2, ya - sube, 17 * U * (a.t < 0.15 ? 0.8 + a.t * 1.4 : 1), col, '#101826'); g.globalAlpha = 1;
    ya -= 24 * U;
  }
  // festejos (parte terminada)
  if (UI.fests.length) {
    const f = UI.fests[0], dura = f.grande ? 4.5 : 2.6;
    {
      const e = f.t < 0.5 ? rebote(f.t / 0.5) : 1, al = f.t > dura - 0.4 ? (dura - f.t) / 0.4 : 1, y = Hc * 0.33;
      g.save(); g.globalAlpha = clamp(al, 0, 1); g.translate(Wc / 2, y); g.scale(e, e);
      const tam = tamQueEntra(g, f.titulo, (f.grande ? 30 : 26) * U, Wc - 60 * U), w = Math.min(Wc - 24 * U, g.measureText(f.titulo).width + 70 * U), h = 54 * U;
      g.fillStyle = '#a3561a'; g.beginPath(); g.moveTo(-w / 2 - 22 * U, -h * 0.25); g.lineTo(-w / 2 + 6 * U, -h * 0.25); g.lineTo(-w / 2 + 6 * U, h * 0.55); g.lineTo(-w / 2 - 22 * U, h * 0.55); g.lineTo(-w / 2 - 10 * U, h * 0.15); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(w / 2 + 22 * U, -h * 0.25); g.lineTo(w / 2 - 6 * U, -h * 0.25); g.lineTo(w / 2 - 6 * U, h * 0.55); g.lineTo(w / 2 + 22 * U, h * 0.55); g.lineTo(w / 2 + 10 * U, h * 0.15); g.closePath(); g.fill();
      const gr = g.createLinearGradient(0, -h / 2, 0, h / 2); gr.addColorStop(0, '#ffe066'); gr.addColorStop(1, '#f2a516');
      g.fillStyle = gr; rr(g, -w / 2, -h / 2, w, h, 12 * U); g.fill(); g.strokeStyle = '#7a3c0c'; g.lineWidth = 3 * U; g.stroke();
      texto(g, f.titulo, 0, 1 * U, tam, '#ffffff', '#7a3c0c');
      if (f.sub) { const ts = tamQueEntra(g, f.sub, 16 * U, Wc - 40 * U); texto(g, f.sub, 0, h * 0.5 + 20 * U, ts, f.grande ? '#ffffff' : '#ffe066', '#101826'); }
      g.restore();
    }
  }
  dibujarJoystick(g);
  if (UI.panel) dibujarPanel(g, t);
}
function tarjetaParte(g, t) {
  const U = UI.U, Wc = CSSW, P = PARTES[G.parte];
  const w = Math.min(Wc - 128 * U, 250 * U), x = Wc / 2 - w / 2, y = 60 * U, h = 50 * U;
  g.fillStyle = 'rgba(0,0,0,0.25)'; rr(g, x, y + 3 * U, w, h, 12 * U); g.fill();
  g.fillStyle = 'rgba(24,34,54,0.78)'; rr(g, x, y, w, h, 12 * U); g.fill();
  if (!P) {
    texto(g, T('mansion'), Wc / 2, y + 15 * U, tamQueEntra(g, T('mansion'), 12 * U, w - 16 * U), '#ffd34a', '#101826');
    const dy = boton(g, x + 16 * U, y + 26 * U, w - 32 * U, 22 * U, '#e8a33a', () => abrirPanel('renovar'));
    const s2 = T('renovar') + (G.estrellas + 2); texto(g, s2, Wc / 2, y + 37 * U + dy, tamQueEntra(g, s2, 11 * U, w - 44 * U), '#ffffff', '#101826');
    return;
  }
  if (G.estrellas) texto(g, '★'.repeat(Math.min(5, G.estrellas)), x + w - 8 * U, y + 10 * U, 9 * U, '#ffd34a', '#101826', 'right');
  const tit = T('parteN', { n: G.parte + 1, t: PARTES.length }) + ' · ' + T('parte.' + P.id).toUpperCase();
  texto(g, tit, Wc / 2, y + 12 * U, tamQueEntra(g, tit, 11 * U, w - 16 * U), '#ffffff', '#101826');
  // progreso total de la parte
  let hecho = 0, total = 0; for (const m in P.need) { const n = necesita(G.parte, m); hecho += Math.min(n, OBRA.aterrizado[m] || 0); total += n; }
  const bx = x + 10 * U, bw = w - 20 * U, by = y + 22 * U;
  g.fillStyle = '#16202f'; rr(g, bx, by, bw, 7 * U, 3.5 * U); g.fill();
  g.fillStyle = '#5ee06a'; if (hecho) { rr(g, bx, by, Math.max(7 * U, bw * hecho / total), 7 * U, 3.5 * U); g.fill(); }
  // lo que pide, material por material
  const mats = Object.keys(P.need), cw = Math.min(70 * U, (w - 16 * U) / mats.length);
  mats.forEach((m, i) => {
    const n = necesita(G.parte, m), cx = Wc / 2 + (i - (mats.length - 1) / 2) * cw, cy = y + 39 * U, lleg = Math.min(n, OBRA.aterrizado[m] || 0);
    g.drawImage(iconoBloque(BLOQUE_DE[m], Math.round(16 * U * 2) / 2), cx - 26 * U, cy - 9 * U, 16 * U, 17.9 * U);
    texto(g, lleg + '/' + n, cx + 6 * U, cy + 0.5 * U, 11 * U, lleg >= n ? '#5ee06a' : '#ffffff', '#101826', 'center');
  });
  // qué hacer ahora
  const o = VIVO.obj;
  if (o && (G.parte < 5 || G.jugado < 240)) {
    const s = textoObjetivo(o), ts = tamQueEntra(g, s, 12 * U, Wc - 40 * U); letra(g, ts);
    const ww = g.measureText(s).width + 28 * U, yy = y + h + 8 * U;
    g.fillStyle = 'rgba(255,255,255,0.92)'; rr(g, Wc / 2 - ww / 2, yy, ww, 24 * U, 12 * U); g.fill();
    texto(g, s, Wc / 2, yy + 12.5 * U, ts, '#1d2b3a', null);
  }
}
// carteles arriba de los cuadros de compra, la obra, la caja y las pilas
function etiquetasMundo(g, t) {
  const U = UI.U, Wc = CSSW, Hc = CSSH;
  for (const p of PADS) {
    if (!padActivo(p)) continue;
    const q = M4.proyectar(R.VP, p.x, SUELO + 0.1, p.z + 1.3); if (!q) continue;
    const x = q[0] * Wc, y = q[1] * Hc; if (x < -60 || x > Wc + 60 || y < -40 || y > Hc + 60) continue;
    const precio = p.precio(), falta = precio - (G.pads[p.id] || 0), puede = G.dinero >= falta, s = fmt(falta);
    letra(g, 15 * U); const w = g.measureText(s).width + 40 * U, h = 26 * U;
    const by = y + 6 * U;
    g.fillStyle = 'rgba(0,0,0,0.3)'; rr(g, x - w / 2, by + 3 * U, w, h, h / 2); g.fill();
    g.fillStyle = puede ? '#2f9e44' : 'rgba(24,34,54,0.88)'; rr(g, x - w / 2, by, w, h, h / 2); g.fill();
    g.strokeStyle = puede ? '#b8ffbf' : 'rgba(255,255,255,0.5)'; g.lineWidth = 2 * U; rr(g, x - w / 2, by, w, h, h / 2); g.stroke();
    moneda(g, x - w / 2 + 14 * U, by + h / 2, 9 * U);
    texto(g, s, x + 9 * U, by + h / 2 + 1 * U, 15 * U, '#ffffff', '#101826');
    const tit = p.titulo().toUpperCase(), ts = tamQueEntra(g, tit, 10 * U, 150 * U);
    texto(g, tit, x, by + h + 11 * U, ts, '#ffffff', '#101826');
    g.drawImage(iconoBloque(p.icono(), 24), x - 11 * U, by - 26 * U, 22 * U, 24.6 * U);
  }
  // completar lo que falta para un cuadro mirando un anuncio
  const pa = VIVO.padActivo;
  if (pa && padActivo(pa)) {
    const falta = pa.precio() - (G.pads[pa.id] || 0) - G.dinero, q = M4.proyectar(R.VP, pa.x, SUELO + 0.1, pa.z + 1.3);
    if (q && falta > 0 && falta <= unidadPlata() * 4 && adQueda('completar') > 0) {
      const x = q[0] * Wc, y = q[1] * Hc + 52 * U;
      const dy = boton(g, x - 62 * U, y, 124 * U, 30 * U, '#8a52c8', () => conAnuncio('completar', () => { G.dinero += falta; UI.pulsoPlata(); }));
      iconoDibujo(g, 'tv', x - 42 * U, y + 15 * U + dy, 16 * U, '#fff'); texto(g, '+$' + fmt(falta), x + 10 * U, y + 16 * U + dy, tamQueEntra(g, '+$' + fmt(falta), 13 * U, 80 * U), '#fff', '#101826');
    }
  }
  // los cuadros de actividad (pesca en el muelle y la maquinita de arcade)
  if (G.parte >= 1) for (const a of ACT_PADS) {
    const q = M4.proyectar(R.VP, a.x, alturaPiso(a.x, a.z) + 0.1, a.z + 1.2); if (!q) continue;
    const x = q[0] * Wc, y = q[1] * Hc + 6 * U; if (x < -60 || x > Wc + 60 || y < -40 || y > Hc + 60) continue;
    const s = a.id === 'pesca' ? T('mj.pesca').toUpperCase() : T('minijuegos'); letra(g, 12 * U); const w = g.measureText(s).width + 40 * U;
    g.fillStyle = 'rgba(24,60,120,0.9)'; rr(g, x - w / 2, y, w, 24 * U, 12 * U); g.fill(); g.strokeStyle = '#9fd0ff'; g.lineWidth = 2 * U; rr(g, x - w / 2, y, w, 24 * U, 12 * U); g.stroke();
    if (a.id === 'pesca') dibujarPez(g, x - w / 2 + 16 * U, y + 12 * U, 9 * U, PECES[1], 0); else iconoDibujo(g, 'mando', x - w / 2 + 16 * U, y + 12 * U, 18 * U, '#ffffff');
    texto(g, s, x + 9 * U, y + 13 * U, 12 * U, '#ffffff', '#101826');
  }
  // el cofre: si no se ve, un aviso en el borde
  if (COFRES.uno && !UI.panel) {
    const c = COFRES.uno, q = M4.proyectar(R.VP, c.x, SUELO + 1.4, c.z);
    if (q && q[0] > 0.05 && q[0] < 0.95 && q[1] > 0.12 && q[1] < 0.95) { texto(g, '!', q[0] * Wc, q[1] * Hc - Math.abs(Math.sin(t * 5)) * 6 * U, 20 * U, '#ffe066', '#101826'); }
    else if (q) {
      const ex = clamp(q[0], 0.08, 0.92) * Wc, ey = clamp(q[1], 0.2, 0.9) * Hc;
      g.fillStyle = 'rgba(24,34,54,0.85)'; g.beginPath(); g.arc(ex, ey, 18 * U, 0, TAU); g.fill(); g.strokeStyle = '#ffd34a'; g.lineWidth = 2 * U; g.stroke();
      if (!dibujarIcono(g, 'cofre', ex, ey, 27 * U)) g.drawImage(iconoBloque(B.CAJA), ex - 11 * U, ey - 13 * U, 22 * U, 24.6 * U);
    }
  }
  // la obra: lo que falta, con íconos
  const P = PARTES[G.parte];
  if (P) {
    const q = M4.proyectar(R.VP, LUGAR.obra[0], SUELO + 0.05, LUGAR.obra[1] + 1.9);
    if (q) {
      const mats = Object.keys(P.need).filter(m => faltaEntregar(m) > 0), x = q[0] * Wc, y = q[1] * Hc + 8 * U;
      texto(g, T('obra'), x, y + 34 * U, 11 * U, '#ffd34a', '#101826');
      mats.forEach((m, i) => {
        const cx = x + (i - (mats.length - 1) / 2) * 64 * U, f = faltaEntregar(m);
        g.fillStyle = 'rgba(24,34,54,0.85)'; rr(g, cx - 30 * U, y, 60 * U, 24 * U, 12 * U); g.fill();
        g.drawImage(iconoBloque(BLOQUE_DE[m], 24), cx - 28 * U, y + 1 * U, 20 * U, 22.4 * U);
        texto(g, String(f), cx + 8 * U, y + 13 * U, 13 * U, '#ffffff', '#101826');
      });
    }
  }
  // la caja con plata
  const vc = G.caja - VIVO.cajaVol;
  if (vc > 0) {
    const q = M4.proyectar(R.VP, LUGAR.caja[0], SUELO + 1.2 + billetesCaja() / 9 * 0.17, LUGAR.caja[1]);
    if (q) { const x = q[0] * Wc, y = q[1] * Hc - 14 * U; moneda(g, x - 20 * U - fmt(vc).length * 4 * U, y, 9 * U); texto(g, fmt(vc), x + 4 * U, y + 1 * U, 15 * U, '#ffe066', '#101826'); }
  }
}
// la flecha que marca adónde ir (sobre el objetivo o en el borde de la pantalla)
function flechaObjetivo(g, t) {
  const o = VIVO.obj; if (!o || UI.panel) return;
  if (Math.hypot(JUG.x - o.x, JUG.z - o.z) < 1.4) return;
  const U = UI.U, Wc = CSSW, Hc = CSSH, rebota = Math.abs(Math.sin(t * 4)) * 0.6;
  const q = M4.proyectar(R.VP, o.x, SUELO + 2.4 + rebota, o.z);
  const m = 34 * U;
  let x, y, ang = 0, borde = false;
  if (q && q[0] * Wc > m && q[0] * Wc < Wc - m && q[1] * Hc > 120 * U && q[1] * Hc < Hc - m) { x = q[0] * Wc; y = q[1] * Hc; }
  else {
    const c = M4.proyectar(R.VP, o.x, SUELO, o.z) || [0.5, 1.5];
    let dx = c[0] * Wc - Wc / 2, dy = c[1] * Hc - Hc / 2; if (!q) { dx = -dx; dy = -dy; }
    const k = Math.min((Wc / 2 - m) / Math.max(1e-3, Math.abs(dx)), (Hc / 2 - m - 40 * U) / Math.max(1e-3, Math.abs(dy)));
    x = Wc / 2 + dx * k; y = Hc / 2 + 20 * U + dy * k; ang = Math.atan2(dy, dx) - PI / 2; borde = true;
  }
  g.save(); g.translate(x, y); g.rotate(ang);
  const s = (borde ? 15 : 18) * U * (1 + 0.06 * Math.sin(t * 8));
  g.beginPath(); g.moveTo(0, s * 1.1); g.lineTo(-s, -s * 0.1); g.lineTo(-s * 0.42, -s * 0.1); g.lineTo(-s * 0.42, -s * 1.1); g.lineTo(s * 0.42, -s * 1.1); g.lineTo(s * 0.42, -s * 0.1); g.lineTo(s, -s * 0.1); g.closePath();
  g.lineJoin = 'round'; g.lineWidth = 4 * U; g.strokeStyle = '#3a2408'; g.stroke();
  const gr = g.createLinearGradient(0, -s, 0, s); gr.addColorStop(0, '#fff27a'); gr.addColorStop(1, '#ffb412'); g.fillStyle = gr; g.fill();
  g.restore();
}
function dibujarJoystick(g) {
  const J = UI.joy, U = UI.U, r = 52 * U * [0.8, 1, 1.25][AJ.joyTam];
  let x0 = J.x0, y0 = J.y0, ver = J.activo;
  if (AJ.joy === 'fijo') { x0 = 30 * U + r; y0 = CSSH - 40 * U - r; ver = true; if (!J.activo) { J.x0 = x0; J.y0 = y0; } }
  if (!ver || UI.panel) return;
  g.fillStyle = 'rgba(20,30,50,0.32)'; g.beginPath(); g.arc(x0, y0, r, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 3 * U; g.stroke();
  const kx = x0 + J.vx * r * 0.6, ky = y0 + J.vy * r * 0.6;
  g.fillStyle = 'rgba(255,255,255,0.88)'; g.beginPath(); g.arc(kx, ky, r * 0.42, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(30,40,60,0.4)'; g.lineWidth = 2 * U; g.stroke();
}
// ---------- paneles ----------
function abrirPanel(p) { UI.panel = p; Sonido.efecto('clic', 0.6); UI.joy.activo = false; UI.joy.vx = UI.joy.vy = 0; }
function cerrarPanel() { UI.panel = null; Sonido.efecto('clic', 0.5); guardarAjustes(); }
function dibujarPanel(g, t) {
  const U = UI.U, Wc = CSSW, Hc = CSSH;
  g.fillStyle = 'rgba(8,12,24,0.6)'; g.fillRect(0, 0, Wc, Hc);
  UI.botones.length = 0;
  UI.botones.push({ x: 0, y: 0, w: Wc, h: Hc, f: () => { } });
  const p = UI.panel;
  if (p === 'tienda') return panelTienda(g, t);
  if (p === 'actividades') return panelActividades(g, t);
  if (p === 'minijuegos') return panelMinijuegos(g, t);
  if (p === 'ruleta') return panelRuleta(g, t);
  if (p === 'premio') return panelPremio(g, t);
  if (p === 'ajustes') {
    const filas = [
      [T('musica'), AJ.musica ? T('si') : T('no'), () => { AJ.musica = !AJ.musica; Sonido.ponerMusica(AJ.musica); if (AJ.musica) Sonido.musica(true); }, null],
      [T('sonido'), AJ.sonido ? T('si') : T('no'), () => { AJ.sonido = !AJ.sonido; Sonido.ponerSfx(AJ.sonido); }, null],
      [T('vibra'), AJ.vibra ? T('si') : T('no'), () => { AJ.vibra = !AJ.vibra; Sonido.vibOn = AJ.vibra; Sonido.vibrar(30); }, null],
      [T('graficos'), AJ.calidad < 0 ? T('auto') + ' (' + T('cal')[R.calidad] + ')' : T('cal')[AJ.calidad], d => { AJ.calidad = clamp(AJ.calidad + d, -1, 3); ponerCalidadAjuste(); }, true],
      [T('idioma'), AJ.idioma === 'auto' ? T('auto') + ' · ' + NOMBRE_IDIOMA[IDIOMA] : NOMBRE_IDIOMA[AJ.idioma], d => { const L = ['auto', ...IDIOMAS]; AJ.idioma = L[(L.indexOf(AJ.idioma) + d + L.length) % L.length]; aplicarIdioma(); }, true],
      [T('joy'), AJ.joy === 'flota' ? T('flota') : T('fijo'), () => { AJ.joy = AJ.joy === 'flota' ? 'fijo' : 'flota'; }, true],
      [T('tam'), T('tams')[AJ.joyTam], d => { AJ.joyTam = clamp(AJ.joyTam + d, 0, 2); }, true],
    ];
    const w = Math.min(Wc - 28 * U, 330 * U), fh = 40 * U, h = 96 * U + filas.length * fh + 70 * U, x = Wc / 2 - w / 2, y = Math.max(10 * U, Hc / 2 - h / 2);
    tarjeta(g, x, y, w, h);
    texto(g, T('ajustes'), Wc / 2, y + 30 * U, 22 * U, '#ffd34a', '#101826');
    let dy = boton(g, x + w - 46 * U, y + 10 * U, 36 * U, 32 * U, '#d9485f', cerrarPanel);
    iconoDibujo(g, 'cruz', x + w - 28 * U, y + 26 * U + dy, 22 * U, '#fff');
    filas.forEach(([nom, val, f, flechas], i) => {
      const fy = y + 62 * U + i * fh;
      texto(g, nom, x + 18 * U, fy + fh / 2, tamQueEntra(g, nom, 13 * U, w * 0.38), '#ffffff', '#101826', 'left');
      const cw = w * 0.52, cx = x + w - cw - 14 * U;
      if (flechas) {
        dy = boton(g, cx, fy + 5 * U, 30 * U, 26 * U, '#56708f', () => { f(-1); Sonido.efecto('clic', 0.5); });
        iconoDibujo(g, 'izq', cx + 15 * U, fy + 18 * U + dy, 18 * U, '#fff');
        dy = boton(g, cx + cw - 30 * U, fy + 5 * U, 30 * U, 26 * U, '#56708f', () => { f(1); Sonido.efecto('clic', 0.5); });
        iconoDibujo(g, 'der', cx + cw - 15 * U, fy + 18 * U + dy, 18 * U, '#fff');
        texto(g, val, cx + cw / 2, fy + fh / 2, tamQueEntra(g, val, 12 * U, cw - 70 * U), '#ffffff', '#101826');
      } else {
        const on = val === T('si');
        dy = boton(g, cx + cw - 90 * U, fy + 5 * U, 90 * U, 26 * U, on ? '#3fae4f' : '#7a8496', () => { f(); Sonido.efecto('clic', 0.5); });
        texto(g, val, cx + cw - 45 * U, fy + 18 * U + dy, 13 * U, '#ffffff', '#101826');
      }
    });
    const by = y + 62 * U + filas.length * fh + 8 * U;
    dy = boton(g, x + 30 * U, by, w - 60 * U, 34 * U, '#c0392b', () => abrirPanel('borrar'));
    texto(g, T('borrar'), Wc / 2, by + 17 * U + dy, tamQueEntra(g, T('borrar'), 13 * U, w - 80 * U), '#ffffff', '#5a120c');
    texto(g, 'JXSTUDIOS · MANSION BUILDER 1.0 · ' + Math.round(PRINCIPAL.fps) + ' FPS', Wc / 2, y + h - 16 * U, 8 * U, 'rgba(255,255,255,0.6)', null);
  } else if (p === 'renovar') {
    const w = Math.min(Wc - 40 * U, 300 * U), h = 230 * U, x = Wc / 2 - w / 2, y = Hc / 2 - h / 2;
    tarjeta(g, x, y, w, h);
    texto(g, T('renovar') + (G.estrellas + 2), Wc / 2, y + 30 * U, tamQueEntra(g, T('renovar') + (G.estrellas + 2), 18 * U, w - 30 * U), '#ffd34a', '#101826');
    envolver(g, T('renovarTxt'), Wc / 2, y + 86 * U, w - 40 * U, 13 * U, '#ffffff');
    let dy = boton(g, x + 22 * U, y + h - 58 * U, w / 2 - 32 * U, 38 * U, '#3fae4f', () => renovarMansion());
    texto(g, T('siB'), x + 22 * U + (w / 2 - 32 * U) / 2, y + h - 39 * U + dy, 15 * U, '#fff', '#101826');
    dy = boton(g, x + w / 2 + 10 * U, y + h - 58 * U, w / 2 - 32 * U, 38 * U, '#56708f', () => cerrarPanel());
    texto(g, T('noB'), x + w / 2 + 10 * U + (w / 2 - 32 * U) / 2, y + h - 39 * U + dy, 15 * U, '#fff', '#1a2438');
  } else if (p === 'borrar') {
    const w = Math.min(Wc - 40 * U, 300 * U), h = 170 * U, x = Wc / 2 - w / 2, y = Hc / 2 - h / 2;
    tarjeta(g, x, y, w, h);
    envolver(g, T('seguro'), Wc / 2, y + 44 * U, w - 40 * U, 15 * U, '#ffffff');
    let dy = boton(g, x + 22 * U, y + h - 58 * U, w / 2 - 32 * U, 38 * U, '#c0392b', () => { borrarTodo(); });
    texto(g, T('siB'), x + 22 * U + (w / 2 - 32 * U) / 2, y + h - 39 * U + dy, 15 * U, '#fff', '#5a120c');
    dy = boton(g, x + w / 2 + 10 * U, y + h - 58 * U, w / 2 - 32 * U, 38 * U, '#56708f', () => abrirPanel('ajustes'));
    texto(g, T('noB'), x + w / 2 + 10 * U + (w / 2 - 32 * U) / 2, y + h - 39 * U + dy, 15 * U, '#fff', '#1a2438');
  } else if (p === 'volviste') {
    const w = Math.min(Wc - 40 * U, 300 * U), h = 290 * U, x = Wc / 2 - w / 2, y = Hc / 2 - h / 2, monto = PRINCIPAL.offline;
    tarjeta(g, x, y, w, h);
    texto(g, T('volviste'), Wc / 2, y + 32 * U, tamQueEntra(g, T('volviste'), 20 * U, w - 30 * U), '#ffd34a', '#101826');
    envolver(g, T('teDejaron'), Wc / 2, y + 64 * U, w - 40 * U, 13 * U, '#ffffff');
    moneda(g, Wc / 2 - 56 * U, y + 120 * U, 20 * U);
    texto(g, fmt(monto), Wc / 2 + 10 * U, y + 121 * U, 28 * U, '#ffe066', '#101826');
    const cobrar = m => { G.dinero += monto * m; G.ganado += monto * m; UI.pulsoPlata(); Sonido.efecto('caja', 0.9); Sonido.vibrar([20, 30, 20]); PRINCIPAL.offline = 0; for (let k = 0; k < 30; k++) confeti(JUG.x + rnd(-1, 1), JUG.y + 2, JUG.z + rnd(-1, 1)); guardar(); UI.panel = null; };
    let dy = boton(g, x + 30 * U, y + h - 112 * U, w - 60 * U, 44 * U, '#8a52c8', () => conAnuncio('completar', () => cobrar(2)));
    iconoDibujo(g, 'tv', x + 62 * U, y + h - 90 * U + dy, 20 * U, '#fff'); texto(g, T('cobrarX', { n: 2 }), Wc / 2 + 14 * U, y + h - 90 * U + dy, tamQueEntra(g, T('cobrarX', { n: 2 }), 16 * U, w - 130 * U), '#fff', '#101826');
    dy = boton(g, x + 50 * U, y + h - 58 * U, w - 100 * U, 38 * U, '#3fae4f', () => cobrar(1));
    texto(g, T('cobrar'), Wc / 2, y + h - 39 * U + dy, 15 * U, '#ffffff', '#101826');
  }
}
function envolver(g, s, x, y, max, tam, col) {
  letra(g, tam); const pal = s.split(' '), lin = []; let l = '';
  for (const p of pal) { const q = l ? l + ' ' + p : p; if (g.measureText(q).width > max && l) { lin.push(l); l = p; } else l = q; }
  if (l) lin.push(l);
  lin.forEach((s2, i) => texto(g, s2, x, y + (i - (lin.length - 1) / 2) * tam * 1.35, tam, col, '#101826'));
}
// toques sobre la interfaz: devuelve true si fue a un botón
function tocarUI(x, y) {
  for (let i = UI.botones.length - 1; i >= 0; i--) { const b = UI.botones[i]; if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return b; }
  return null;
}
function compartir() {
  Sonido.efecto('clic', 0.6);
  const url = location.protocol.startsWith('http') ? location.href.split('?')[0] : 'https://rezona.ai', txt = T('textoComp');
  if (window.__compartirTT) { window.__compartirTT(txt); return; }
  if (navigator.share) { navigator.share({ title: 'MANSION BUILDER', text: txt, url }).catch(() => { }); return; }
  const copiar = navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(txt + ' ' + url) : Promise.reject();
  copiar.then(() => UI.aviso(T('copiado'), 'oro')).catch(() => UI.aviso(T('copiado'), 'oro'));
}
function guardarAjustes() { Guardado.escribir('ajustes', AJ); }
function cargarAjustes() { Object.assign(AJ, Guardado.leer('ajustes', {})); Sonido.musOn = AJ.musica; Sonido.sfxOn = AJ.sonido; Sonido.vibOn = AJ.vibra; }

// MANSION BUILDER — la pantalla de carga: cielo con nubes de píxeles, el logo de bloques, el constructor que saluda,
// una casita que se arma con el progreso, la barra de bloques y consejos. Al terminar: "tocá para jugar".
const CARGA = { t: 0, nubes: null, piel: null, tip: 0, tipT: 0, fondo: null, clave: '' };
function pielLienzo() {
  if (CARGA.piel) return CARGA.piel;
  const datos = PJ.datos || armarPieles(), c = lienzo(64, 64), g = c.getContext('2d'), im = g.createImageData(64, 64);
  im.data.set(datos.subarray(PIELES.jugador * 64 * 64 * 4, (PIELES.jugador + 1) * 64 * 64 * 4)); g.putImageData(im, 0, 0);
  return (CARGA.piel = c);
}
// el fondo quieto (cielo, sol, pasto y tierra) en caché, se rehace solo si cambia el tamaño
function fondoCarga(Wc, Hc, U) {
  const clave = Wc + 'x' + Hc + 'x' + DPR;
  if (CARGA.clave === clave) return CARGA.fondo;
  const k = Math.min(DPR, 2), c = lienzo(Wc * k, Hc * k), g = c.getContext('2d');
  g.setTransform(k, 0, 0, k, 0, 0);
  const gr = g.createLinearGradient(0, 0, 0, Hc); gr.addColorStop(0, '#3fa9f5'); gr.addColorStop(0.6, '#9ad8ff'); gr.addColorStop(1, '#d9f2ff');
  g.fillStyle = gr; g.fillRect(0, 0, Wc, Hc);
  const b = Math.ceil(14 * U), y0 = Hc - Math.max(110 * U, Hc * 0.17), r = rngSemilla(5);
  for (let x = 0; x < Wc; x += b) {
    const alto = y0 + (r() < 0.25 ? -b : 0);
    for (let y = alto; y < Hc; y += b) {
      const capa = y < alto + b ? 0 : y < alto + b * 1.7 ? 1 : 2;
      const cols = [['#6ccf3c', '#5fbf32', '#7ad94a'], ['#8b5a2b', '#9a6532', '#7b4f25'], ['#7a7a7e', '#8a8a8e', '#6e6e72']][capa === 2 && y > Hc - b * 1.5 ? 2 : Math.min(capa, 1)];
      g.fillStyle = cols[(r() * 3) | 0]; g.fillRect(x, y, b + 0.5, b + 0.5);
      g.fillStyle = 'rgba(0,0,0,0.08)'; g.fillRect(x + b * 0.5, y + b * 0.5, b * 0.25, b * 0.25);
      if (capa === 0) { g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(x, y, b, b * 0.2); }
    }
  }
  CARGA.fondo = c; CARGA.clave = clave; CARGA.suelo = y0;
  return c;
}
function nubePixel(g, x, y, s) {
  g.fillStyle = 'rgba(255,255,255,0.92)';
  for (const [a, b, w, h] of [[0, 1, 6, 2], [1, 0, 3, 1], [4, 0, 1, 1], [-1, 2, 8, 1]]) g.fillRect(x + a * s, y + b * s, w * s, h * s);
  g.fillStyle = 'rgba(200,225,245,0.9)'; g.fillRect(x - s, y + 3 * s, 8 * s, s * 0.7);
}
// el constructor de frente, pintado con su piel: saluda con el brazo derecho (que sale de atrás del hombro y se
// mueve de lado a lado), respira y parpadea
function constructor2D(g, x, y, px, t, piel) {
  piel = piel || pielLienzo(); g.imageSmoothingEnabled = false;
  const d = (u, v, w, h, X, Y) => g.drawImage(piel, u, v, w, h, x + X * px, y + Y * px, w * px, h * px);
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(x + 4 * px, y + 32 * px, 7 * px, 1.6 * px, 0, 0, TAU); g.fill();
  const resp = Math.sin(t * 2.2) * 0.35;                               // el cuerpo y la cabeza suben y bajan un poco
  d(4, 20, 4, 12, 0, 20); d(20, 52, 4, 12, 4, 20);                    // piernas
  // brazo que saluda: pivote en el hombro (borde izquierdo del cuerpo), apunta arriba-afuera y va y viene
  const ang = 2.55 + Math.sin(t * 7.5) * 0.38;
  g.save(); g.translate(x - 2 * px, y + (9 + resp) * px); g.rotate(ang);
  g.drawImage(piel, 44, 20, 4, 12, -2 * px, -1.2 * px, 4 * px, 12 * px);
  g.restore();
  d(20, 20, 8, 12, 0, 8 + resp);                                       // cuerpo (tapa el hombro del brazo)
  g.save(); g.translate(x + 10 * px, y + (9 + resp) * px); g.rotate(-0.08 + Math.sin(t * 2.2) * 0.04);
  g.drawImage(piel, 36, 52, 4, 12, -2 * px, -1 * px, 4 * px, 12 * px); // el otro brazo, colgando
  g.restore();
  d(8, 8, 8, 8, 0, resp); d(40, 8, 8, 8, 0, resp);                     // cabeza y casco
  if ((t % 3.4) < 0.13) {                                              // parpadeo
    const c = piel.getContext('2d').getImageData(8 + 3, 8 + 5, 1, 1).data;
    g.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
    g.fillRect(x + 1 * px, y + (4 + resp) * px, 2 * px, px); g.fillRect(x + 5 * px, y + (4 + resp) * px, 2 * px, px);
  }
  g.imageSmoothingEnabled = true;
}
// la casita que se arma con el progreso (bloques isométricos)
const CASITA = (() => {
  const L = [];
  for (let y = 0; y < 3; y++) for (let z = 0; z < 3; z++) for (let x = 0; x < 4; x++) {
    if (y > 0 && x > 0 && x < 3 && z > 0 && z < 2) continue;
    const b = y === 0 ? B.LADRILLO_PIEDRA : (z === 0 && (x === 1 || x === 2) && y === 1 ? B.VIDRIO : B.CUARZO);
    L.push([x, y, z, b]);
  }
  for (let z = 0; z < 3; z++) for (let x = 0; x < 4; x++) L.push([x, 3, z, B.PIZARRA]);
  L.push([1, 4, 1, B.PIZARRA], [2, 4, 1, B.PIZARRA], [3, 4, 2, B.ORO]);
  L.sort((a, b) => a[1] - b[1] || (b[2] - a[2]) || a[0] - b[0]);
  return L;
})();
function dibujarCarga(g, dt, prog, listo) {
  const U = UI.U, Wc = CSSW, Hc = CSSH, t = (CARGA.t += dt);
  g.drawImage(fondoCarga(Wc, Hc, U), 0, 0, Wc, Hc);
  // el sol y las nubes
  const sx = Wc * 0.84, sy = Hc * 0.1;
  g.save(); g.translate(sx, sy); g.rotate(t * 0.15); g.fillStyle = 'rgba(255,240,150,0.35)';
  for (let k = 0; k < 10; k++) { g.rotate(TAU / 10); g.fillRect(-4 * U, 26 * U, 8 * U, 26 * U); }
  g.restore();
  g.fillStyle = '#ffe45c'; g.fillRect(sx - 20 * U, sy - 20 * U, 40 * U, 40 * U); g.fillStyle = '#fff3a0'; g.fillRect(sx - 14 * U, sy - 14 * U, 22 * U, 22 * U);
  for (let k = 0; k < 4; k++) { const s = (5 + (k % 2) * 2) * U, x = ((k * 173 + t * (12 + k * 5) * U) % (Wc + 120 * U)) - 80 * U; nubePixel(g, x, Hc * (0.06 + k * 0.07), s); }
  // el logo
  const ly = Hc * 0.2, t1 = tamQueEntra(g, 'MANSION', 54 * U, Wc - 40 * U), t2 = tamQueEntra(g, 'BUILDER', 40 * U, Wc - 60 * U), wob = Math.sin(t * 2) * 2 * U;
  const logo = (s, y, tam, c1, c2) => {
    letra(g, tam); g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let k = 7; k >= 1; k--) { g.fillStyle = k > 5 ? '#3a1f08' : '#7a3c0c'; g.fillText(s, Wc / 2 + k * 0.5 * U, y + k * U); }
    g.lineJoin = 'round'; g.lineWidth = tam * 0.16; g.strokeStyle = '#3a1f08'; g.strokeText(s, Wc / 2, y);
    const gr = g.createLinearGradient(0, y - tam / 2, 0, y + tam / 2); gr.addColorStop(0, c1); gr.addColorStop(1, c2);
    g.fillStyle = gr; g.fillText(s, Wc / 2, y);
  };
  if (IMG.listo.logo) {
    // el logo de Higgsfield: termina donde terminaba el de letras, y se achica si no entra arriba
    const L = IMG.logo, abajo = ly + t1 * 0.85 + t2 * 0.6, alto = Math.min((Wc - 30 * U) * L.height / L.width, 340 * U * L.height / L.width, abajo - 8 * U);
    const ancho = alto * L.width / L.height;
    g.drawImage(L, Wc / 2 - ancho / 2, abajo - alto + wob, ancho, alto);
  } else {
    logo('MANSION', ly + wob, t1, '#fff7b0', '#ffb31a');
    logo('BUILDER', ly + t1 * 0.85 + wob, t2, '#ffffff', '#9fd8ff');
  }
  const sub = T('sub'); texto(g, sub, Wc / 2, ly + t1 * 0.85 + t2 * 0.9 + 6 * U, tamQueEntra(g, sub, 15 * U, Wc - 40 * U), '#ffffff', '#1d3557');
  // el constructor y la casita sobre el pasto
  const suelo = CARGA.suelo, px = Math.max(3, Math.round(Math.min(6.5 * U, (suelo - ly - 150 * U) / 34)));
  constructor2D(g, Wc * 0.27 - 4 * px, suelo - 32 * px + 2 * U, px, t);
  const n = Math.floor(CASITA.length * clamp(prog, 0, 1)), bs = Math.min(36 * U, px * 7), ox = Wc * 0.68, oy = suelo - bs * 0.62;
  for (let i = 0; i < n; i++) {
    const [x, y, z, b] = CASITA[i], ic = iconoBloque(b);
    const caer = i === n - 1 && !listo ? (1 - (t * 3 % 1)) * 10 * U : 0;
    g.drawImage(ic, ox + (x - z) * bs * 0.5 - bs / 2, oy + (x + z) * bs * 0.25 - y * bs * 0.5 - caer - bs * 0.5, bs, bs * 1.12);
  }
  // la barra o "tocá para jugar"
  const by = suelo - 230 * U < ly + 140 * U ? suelo + 30 * U : suelo + 30 * U, bw = Math.min(Wc - 60 * U, 300 * U);
  if (!listo) {
    g.fillStyle = 'rgba(0,0,0,0.35)'; rr(g, Wc / 2 - bw / 2 - 4 * U, by - 4 * U, bw + 8 * U, 26 * U, 8 * U); g.fill();
    const nb = 14, w = bw / nb, lleno = prog * nb;
    for (let i = 0; i < nb; i++) {
      const k = clamp(lleno - i, 0, 1);
      g.fillStyle = '#24361b'; g.fillRect(Wc / 2 - bw / 2 + i * w + 1 * U, by, w - 2 * U, 18 * U);
      if (k > 0) { g.fillStyle = '#5ee06a'; g.fillRect(Wc / 2 - bw / 2 + i * w + 1 * U, by + 18 * U * (1 - k), w - 2 * U, 18 * U * k); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(Wc / 2 - bw / 2 + i * w + 1 * U, by + 18 * U * (1 - k), w - 2 * U, 4 * U * k); }
    }
    texto(g, T('cargando') + '.'.repeat(1 + Math.floor(t * 2.5) % 3), Wc / 2, by + 40 * U, 13 * U, '#ffffff', '#1d3557');
  } else {
    const s = T('toca'), e = 1 + Math.sin(t * 5) * 0.06;
    g.save(); g.translate(Wc / 2, by + 14 * U); g.scale(e, e); texto(g, s, 0, 0, tamQueEntra(g, s, 26 * U, Wc - 40 * U), '#ffffff', '#1d3557', 'center', 6 * U); g.restore();
  }
  CARGA.tipT -= dt; if (CARGA.tipT <= 0) { CARGA.tipT = 3.2; CARGA.tip = (CARGA.tip + 1) % T('tips').length; }
  const tip = T('tips')[CARGA.tip]; envolver(g, tip, Wc / 2, Hc - 34 * U, Wc - 50 * U, 12 * U, '#ffffff');
  texto(g, 'JXSTUDIOS', Wc / 2, Hc - 10 * U, 9 * U, 'rgba(255,255,255,0.75)', null);
}

// comun/intro-jxs.js — LA intro de JXSTUDIOS para todos los juegos (la de La Cripta/TAJO que mandó el dueño).
// Rápida (2,1 s): una raya de luz abre el fondo, el monograma JXS se escribe con chispas en las puntas,
// golpe (destello, sacudida, chispazo, vibración), una franja de brillo lo cruza, "JXSTUDIOS" se tipea y
// abajo "presenta". Un toque la salta (después de 0,35 s). Después va la pantalla de idioma.
// Cada juego la viste a su estilo con `estilo` (la misma coreografía, otro material):
//   metal [8 colores], filo, bisel, borde, sombra {dx,dy,col}     monograma de píxeles (juegos de píxeles)
//   logo(g, i)                                                     monograma a mano (juegos lisos)
//   fondo(W, H, cx, cy) → lienzo, negro, puntas, golpe, destello, chispa, anchoLogo(W, H)
//   letras(g, parte, I, t, y), presentaTxt(g, txt, I, t, y)        el texto, con la letra del juego (obligatorio)
//   antes(g, t, I) / despues(g, t, I), dibujarChispa(g, c), jingle(ctx, bus, t0, tg, h)
const IntroJXS = (() => {
  const CAJA = { w: 350, h: 172 }, GROSOR = 14.5;
  // el monograma: cuatro trazos (A va abajo en el cruce: se dibuja primero)
  const TRAZOS = [
    { id: 'A', capa: 0, d: [['M', 40, 19], ['L', 114, 19], ['L', 176, 101], ['C', 194, 128, 222, 168, 268, 169], ['C', 310, 170, 342, 152, 342, 122]] },
    { id: 'J', capa: 0, d: [['M', 40, 43], ['L', 98, 43], ['L', 98, 116], ['C', 98, 148, 44, 158, 36, 124]] },
    { id: 'S', capa: 0, d: [['M', 312, 66], ['C', 306, 46, 288, 36, 266, 36], ['C', 242, 36, 226, 48, 226, 63], ['C', 226, 80, 248, 86, 272, 92], ['C', 302, 99, 320, 108, 320, 126], ['C', 320, 142, 300, 148, 272, 148], ['C', 246, 148, 226, 138, 216, 118]] },
    { id: 'B', capa: 1, d: [['M', 10, 130], ['C', 18, 158, 50, 168, 86, 166], ['C', 108, 165, 122, 158, 134, 142], ['L', 200, 46], ['C', 216, 24, 244, 12, 272, 12], ['C', 310, 12, 340, 30, 340, 62]] },
  ];
  const lim = (v, a, b) => (v < a ? a : v > b ? b : v);
  const salida = t => 1 - Math.pow(1 - t, 3);
  const salidaAtras = t => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2);
  function camino2d(t, esc, ox, oy) {
    const p = new Path2D();
    for (const [op, ...n] of t.d) {
      const q = n.map((v, i) => (i % 2 ? oy + v * esc : ox + v * esc));
      if (op === 'M') p.moveTo(q[0], q[1]); else if (op === 'L') p.lineTo(q[0], q[1]); else p.bezierCurveTo(q[0], q[1], q[2], q[3], q[4], q[5]);
    }
    return p;
  }
  function muestrear(t, cada) {
    const pts = [];
    let x = 0, y = 0;
    for (const [op, ...n] of t.d) {
      if (op === 'M') { x = n[0]; y = n[1]; pts.push([x, y]); continue; }
      if (op === 'L') { const [x1, y1] = n, k = Math.max(1, Math.ceil(Math.hypot(x1 - x, y1 - y) / cada)); for (let i = 1; i <= k; i++) pts.push([x + (x1 - x) * i / k, y + (y1 - y) * i / k]); x = x1; y = y1; continue; }
      const [c1x, c1y, c2x, c2y, x1, y1] = n, k = Math.max(2, Math.ceil((Math.hypot(c1x - x, c1y - y) + Math.hypot(c2x - c1x, c2y - c1y) + Math.hypot(x1 - c2x, y1 - c2y)) / cada));
      for (let i = 1; i <= k; i++) { const s = i / k, r = 1 - s; pts.push([r * r * r * x + 3 * r * r * s * c1x + 3 * r * s * s * c2x + s * s * s * x1, r * r * r * y + 3 * r * r * s * c1y + 3 * r * s * s * c2y + s * s * s * y1]); }
      x = x1; y = y1;
    }
    return pts;
  }
  const largos = new Map(), muestras = new Map();
  function largo(t) {
    if (largos.has(t.id)) return largos.get(t.id);
    const p = muestrear(t, 2);
    let l = 0;
    for (let i = 1; i < p.length; i++) l += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
    largos.set(t.id, l);
    return l;
  }
  function puntas(avance) {
    const out = [];
    for (const t of TRAZOS) {
      if (!muestras.has(t.id)) { const p = muestrear(t, 2), acum = [0]; for (let i = 1; i < p.length; i++) acum.push(acum[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1])); muestras.set(t.id, { p, acum }); }
      const { p, acum } = muestras.get(t.id), meta = acum[acum.length - 1] * avance;
      let i = 1;
      while (i < acum.length - 1 && acum[i] < meta) i++;
      out.push(p[i]);
    }
    return out;
  }
  // el monograma en píxeles: se traza chico, se separa metal de borde por color y se repinta en escalones con filo y bisel
  function monogramaPixel(anchoPx, avance, E) {
    const esc = anchoPx / CAJA.w, alto = Math.ceil(CAJA.h * esc) + 4, ancho = Math.ceil(anchoPx) + 4;
    const c = document.createElement('canvas'); c.width = ancho; c.height = alto;
    const g = c.getContext('2d');
    for (const capa of [0, 1]) for (const t of TRAZOS) {
      if (t.capa !== capa) continue;
      const p = camino2d(t, esc, 2, 2), l = largo(t) * esc;
      g.save(); if (avance < 1) g.setLineDash([Math.max(0.01, l * avance), l + 10]); g.lineCap = 'butt';
      g.lineWidth = GROSOR * esc + 2.2; g.strokeStyle = '#ff0000'; g.stroke(p);
      g.lineWidth = GROSOR * esc; g.strokeStyle = '#00ff00'; g.stroke(p);
      g.restore();
    }
    const img = g.getImageData(0, 0, ancho, alto), d = img.data, metal = new Uint8Array(ancho * alto), borde = new Uint8Array(ancho * alto);
    for (let i = 0; i < ancho * alto; i++) { if (d[i * 4 + 3] < 90) continue; if (d[i * 4 + 1] > 110) metal[i] = 1; else if (d[i * 4] > 110) borde[i] = 1; }
    const ESC = E.metal || ['#f4f5f8', '#d9dbe1', '#b7bbc4', '#8d929c', '#a9adb6', '#d3d6dc', '#9ea3ad', '#767b85'];
    const FILO = E.filo || '#ffffff', BISEL = E.bisel || '#5b5f68', BO = parseInt((E.borde || '#050608').slice(1), 16);
    for (let y = 0; y < alto; y++) for (let x = 0; x < ancho; x++) {
      const i = y * ancho + x, k = i * 4;
      if (metal[i]) {
        const arriba = y > 0 && metal[i - ancho], abajo = y < alto - 1 && metal[i + ancho], izq = x > 0 && metal[i - 1], der = x < ancho - 1 && metal[i + 1];
        let col = ESC[Math.min(ESC.length - 1, Math.floor((y - 2) / (alto - 4) * ESC.length))];
        if (!arriba || !izq) col = FILO; else if (!abajo || !der) col = BISEL;
        const n = parseInt(col.slice(1), 16);
        d[k] = n >> 16; d[k + 1] = (n >> 8) & 255; d[k + 2] = n & 255; d[k + 3] = 255;
      } else if (borde[i]) { d[k] = BO >> 16; d[k + 1] = (BO >> 8) & 255; d[k + 2] = BO & 255; d[k + 3] = 255; } else d[k + 3] = 0;
    }
    g.putImageData(img, 0, 0);
    c.mascara = metal; c.esc = esc;
    return c;
  }
  const T_CORTE = 0.12, T_ABRE = 0.42, T_TRAZA0 = 0.3, T_TRAZA1 = 0.86, T_GOLPE = 0.88, T_BRILLO = [0.95, 1.35], T_LETRAS = 1.02, T_FIN = 2.1;
  function crear(o) {
    const W = o.W, H = o.H, cx = Math.floor(W / 2), cy = Math.round(H * 0.42), E = o.estilo || {};
    const ancho = E.anchoLogo ? E.anchoLogo(W, H) : Math.round(Math.min(W * 0.66, H * 0.9, 120));
    const fondo = E.fondo ? E.fondo(W, H, cx, cy) : null;
    const PUNTAS = E.puntas || ['#ffffff', '#ffd27a'], GOLPE = E.golpe || ['#ffffff', '#ffd27a', '#c9ccd4', '#7ad7ff'];
    let chispas = [], sacudida = 0, golpeado = false, letras = 0, pts = null, cache = { avance: -1, c: null };
    const I = {
      t: 0, listo: false, cx, cy, ancho, W, H, yPalabra: Math.round(cy + ancho * 0.29 + 4),
      saltar() { if (I.t > 0.35) I.listo = true; },
      pasar(dt) {
        I.t += dt;
        if (I.t > T_TRAZA0 && I.t < T_TRAZA1 && pts) for (const [x, y] of pts) for (let k = 0; k < 2; k++) {
          const a = Math.random() * Math.PI * 2, v = 20 + Math.random() * 50;
          chispas.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 10, t: 0, vida: 0.25 + Math.random() * 0.2, col: PUNTAS[(Math.random() * PUNTAS.length) | 0] });
        }
        if (!golpeado && I.t >= T_GOLPE) {
          golpeado = true; sacudida = 4;
          if (o.vibrar) o.vibrar([30, 20, 40]);
          for (let k = 0; k < 70; k++) { const a = Math.random() * Math.PI * 2, v = 40 + Math.random() * 120; chispas.push({ x: cx + (Math.random() - 0.5) * ancho, y: cy + (Math.random() - 0.5) * ancho * 0.4, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20, t: 0, vida: 0.5 + Math.random() * 0.5, col: GOLPE[k % GOLPE.length] }); }
        }
        letras = lim(Math.floor((I.t - T_LETRAS) / 0.04) + 1, 0, 9);
        for (const c of chispas) { c.t += dt; c.x += c.vx * dt; c.y += c.vy * dt; c.vy += 120 * dt; c.vx *= 0.96; }
        chispas = chispas.filter(c => c.t < c.vida);
        sacudida *= Math.pow(0.84, dt * 60);
        if (I.t >= T_FIN) I.listo = true;
      },
      dibujar(g) {
        const t = I.t;
        g.fillStyle = E.negro || '#05040b'; g.fillRect(0, 0, W, H);
        const s = Math.round(sacudida), sx = s ? Math.round((Math.random() * 2 - 1) * s) : 0, sy = s ? Math.round((Math.random() * 2 - 1) * s) : 0;
        if (t < T_CORTE) { const w = Math.round(W * t / T_CORTE); g.fillStyle = '#f6f3ff'; g.fillRect(Math.round(cx - w / 2), cy, w, E.chispa || 1); return; }
        const abre = lim((t - T_CORTE) / (T_ABRE - T_CORTE), 0, 1), alto = Math.round((Math.max(cy, H - cy) + 4) * salidaAtras(abre));
        g.save(); g.beginPath(); g.rect(0, cy - alto, W, alto * 2); g.clip();
        if (fondo) g.drawImage(fondo, sx, sy, W, H);
        if (E.antes) E.antes(g, t, I);
        g.restore();
        if (abre < 1) { g.fillStyle = '#d9dce3'; g.fillRect(0, cy - alto, W, E.chispa || 1); g.fillRect(0, cy + alto - (E.chispa || 1), W, E.chispa || 1); }
        const avance = lim((t - T_TRAZA0) / (T_TRAZA1 - T_TRAZA0), 0, 1);
        if (avance > 0 && E.logo) {
          const esc = ancho / CAJA.w, x0 = cx - ancho / 2 + sx, y0 = cy - CAJA.h * esc / 2 + sy;
          pts = avance < 1 ? puntas(avance).map(([px, py]) => [x0 + px * esc, y0 + py * esc]) : null;
          E.logo(g, { avance, t, x0, y0, esc, ancho, golpe: t >= T_GOLPE, tGolpe: t - T_GOLPE, TRAZOS, camino2d, largo, muestrear, salida, lim });
          if (t >= T_GOLPE && t < T_GOLPE + 0.06) { g.fillStyle = E.destello || 'rgba(255,255,255,0.85)'; g.fillRect(0, 0, W, H); }
        } else if (avance > 0) {
          const a = Math.round(avance * 40) / 40;
          if (cache.avance !== a) cache = { avance: a, c: monogramaPixel(ancho, a, E) };
          const m = cache.c, x0 = Math.round(cx - m.width / 2) + sx, y0 = Math.round(cy - m.height / 2) + sy;
          pts = avance < 1 ? puntas(avance).map(([px, py]) => [x0 + 2 + px * m.esc, y0 + 2 + py * m.esc]) : null;
          g.drawImage(m, x0, y0);
          if (t >= T_GOLPE && t < T_GOLPE + 0.06) { g.fillStyle = E.destello || 'rgba(255,255,255,0.85)'; g.fillRect(0, 0, W, H); }
          if (t > T_BRILLO[0] && t < T_BRILLO[1]) {
            const k = (t - T_BRILLO[0]) / (T_BRILLO[1] - T_BRILLO[0]), bx = Math.round(-10 + k * (m.width + 20));
            g.fillStyle = 'rgba(255,255,255,0.6)';
            for (let y = 0; y < m.height; y++) for (let dx = -2; dx <= 2; dx++) { const px = bx + dx - Math.round(y * 0.5); if (px >= 0 && px < m.width && m.mascara[y * m.width + px]) g.fillRect(x0 + px, y0 + y, 1, 1); }
          }
        }
        if (letras > 0 && E.letras) {
          E.letras(g, 'JXSTUDIOS'.slice(0, letras), I, t, I.yPalabra + sy);
          if (t > T_LETRAS + 0.5 && E.presentaTxt) E.presentaTxt(g, o.presenta || 'PRESENTA', I, t, I.yPalabra + sy);
        }
        if (E.despues) E.despues(g, t, I);
        const tc = E.chispa || 1;
        for (const c of chispas) { if (c.t > c.vida * 0.7 && ((c.t * 30) | 0) % 2) continue; if (E.dibujarChispa) E.dibujarChispa(g, c); else { g.fillStyle = c.col; g.fillRect(Math.round(c.x), Math.round(c.y), tc, tc); } }
      },
    };
    return I;
  }
  // la música de la intro, agendada con el reloj del audio: cada golpe cae con su cuadro
  function jingle(ctx, destino, E) {
    if (!ctx || ctx.state !== 'running') return null;
    const bus = ctx.createGain(); bus.gain.value = 1; bus.connect(destino || ctx.destination);
    const f = m => 440 * Math.pow(2, (m - 69) / 12);
    const tono = (onda, f0, f1, dur, vol, t, ataque) => {
      const o = ctx.createOscillator(), gn = ctx.createGain();
      o.type = onda; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
      gn.gain.setValueAtTime(0.0001, t); gn.gain.linearRampToValueAtTime(vol, t + (ataque || 0.005)); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(gn); gn.connect(bus); o.start(t); o.stop(t + dur + 0.05);
    };
    const n = ctx.sampleRate, buf = ctx.createBuffer(1, n, n), dd = buf.getChannelData(0);
    for (let i = 0; i < n; i++) dd[i] = Math.random() * 2 - 1;
    const soplo = (dur, vol, tipo, f0, f1, t) => {
      const s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), gn = ctx.createGain();
      s.buffer = buf; fl.type = tipo; fl.Q.value = 1.2; fl.frequency.setValueAtTime(f0, t); fl.frequency.exponentialRampToValueAtTime(f1, t + dur);
      gn.gain.setValueAtTime(vol, t); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(fl); fl.connect(gn); gn.connect(bus); s.start(t); s.stop(t + dur + 0.05);
    };
    const t0 = ctx.currentTime + 0.03, tg = t0 + T_GOLPE;
    if (E && E.jingle) E.jingle(ctx, bus, t0, tg, { tono, soplo, f, T: { T_LETRAS, T_GOLPE, T_FIN } });
    else {
      soplo(0.2, 0.12, 'bandpass', 700, 5200, t0);
      [0.3, 0.38, 0.46, 0.54].forEach((d, k) => tono('square', 240 + k * 70, 1300 + k * 240, 0.16, 0.035, t0 + d));
      tono('sine', 115, 30, 0.95, 0.55, tg);
      for (const [fr, v, d] of [[523, 0.08, 1.3], [1247, 0.05, 1], [2011, 0.035, 0.75], [3150, 0.025, 0.5]]) tono('sine', fr, 0, d, v, tg);
      soplo(0.4, 0.25, 'lowpass', 4200, 260, tg);
      [84, 88, 91, 95, 98, 103].forEach((m, k) => tono('triangle', f(m), 0, 0.28, 0.05, tg + 0.07 + k * 0.035));
      for (let k = 0; k < 9; k++) tono('square', 1320 + (k % 3) * 110, 0, 0.022, 0.03, t0 + T_LETRAS + k * 0.04);
      for (const m of [48, 55, 64, 71, 74]) tono('triangle', f(m), 0, 1.35, 0.05, t0 + 1.1, 0.25);
    }
    return { cortar: () => bus.gain.setTargetAtTime(0, ctx.currentTime, 0.05) };
  }
  return { crear, jingle, salida, salidaAtras, DURA: T_FIN };
})();
// "elegí tu idioma" en cada idioma (la pantalla que va después de la intro) y "presenta"
const ELEGI_IDIOMA = { es: 'ELEGÍ TU IDIOMA', 'es-MX': 'ELIGE TU IDIOMA', en: 'CHOOSE YOUR LANGUAGE', pt: 'ESCOLHA SEU IDIOMA', ar: 'اختر لغتك', id: 'PILIH BAHASAMU', ms: 'PILIH BAHASA ANDA', fil: 'PUMILI NG WIKA', tr: 'DİLİNİ SEÇ', ur: 'اپنی زبان چنیں', th: 'เลือกภาษาของคุณ', my: 'ဘာသာစကား ရွေးပါ', ja: 'ことばをえらんでね' };
const PRESENTA = { vi: 'trân trọng giới thiệu', es: 'presenta', 'es-MX': 'presenta', en: 'presents', pt: 'apresenta', ar: 'تقدّم', id: 'mempersembahkan', ms: 'mempersembahkan', fil: 'naghahandog', tr: 'sunar', ur: 'پیش کرتا ہے', th: 'นำเสนอ', my: 'တင်ဆက်သည်', ja: 'プレゼンツ' };

// MANSION BUILDER — la intro de JXSTUDIOS a su estilo: cielo de día con pasto de bloques, el monograma se arma con
// trazos de oro macizo (canto oscuro, brillo arriba), en el golpe saltan bloquecitos de pasto, madera, piedra y oro,
// JXSTUDIOS en letra gorda y "presenta" en un cartel de madera. Suenan bloques que se ponen y una moneda.
function fondoIntro(W, H) {
  const k = Math.min(DPR, 2), c = lienzo(W * k, H * k), g = c.getContext('2d');
  g.setTransform(k, 0, 0, k, 0, 0);
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#2f8fe0'); gr.addColorStop(0.7, '#8fd3ff'); gr.addColorStop(1, '#c8ecff');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const b = Math.ceil(Math.min(W, H) / 22), r = rngSemilla(9), y0 = H - b * 3;
  for (let x = 0; x < W; x += b) for (let y = y0; y < H; y += b) {
    g.fillStyle = y < y0 + b ? ['#6ccf3c', '#5fbf32', '#7ad94a'][(r() * 3) | 0] : ['#8b5a2b', '#9a6532', '#7b4f25'][(r() * 3) | 0];
    g.fillRect(x, y, b + 0.5, b + 0.5);
  }
  g.fillStyle = 'rgba(255,255,255,0.85)';
  for (let k2 = 0; k2 < 3; k2++) { const s = b * 0.5, x = W * (0.12 + k2 * 0.34), y = H * (0.12 + (k2 % 2) * 0.1); g.fillRect(x, y + s, s * 6, s * 2); g.fillRect(x + s, y, s * 3, s); }
  const v = g.createRadialGradient(W / 2, H * 0.42, Math.min(W, H) * 0.25, W / 2, H * 0.42, Math.hypot(W, H) * 0.6); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(10,30,60,0.35)');
  g.fillStyle = v; g.fillRect(0, 0, W, H);
  return c;
}
const ESTILO_MANSION = {
  negro: '#0d1b2a', chispa: 2,
  anchoLogo: (W, H) => Math.round(Math.min(W * 0.74, H * 0.5, 340)),
  puntas: ['#ffffff', '#fff27a', '#ffd23f'],
  golpe: ['#6ccf3c', '#9a6532', '#8a8a8e', '#ffd23f', '#ffffff', '#3ec1f3'],
  destello: 'rgba(255,250,220,0.85)',
  fondo: (W, H) => fondoIntro(W, H),
  dibujarChispa(g, c) { const s = 4 + (c.vida - c.t) * 6; g.fillStyle = c.col; g.fillRect(c.x - s / 2, c.y - s / 2, s, s); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(c.x - s / 2, c.y + s / 4, s, s / 4); },
  logo(g, i) {
    const G2 = 14.5 * i.esc;
    for (const capa of [0, 1]) for (const tz of i.TRAZOS) {
      if (tz.capa !== capa) continue;
      const p = i.camino2d(tz, i.esc, i.x0, i.y0), l = i.largo(tz) * i.esc;
      g.save();
      if (i.avance < 1) g.setLineDash([Math.max(0.01, l * i.avance), l + 80]);
      g.lineCap = 'square'; g.lineJoin = 'miter';
      g.save(); g.translate(0, G2 * 0.45); g.strokeStyle = '#7a3c0c'; g.lineWidth = G2 * 1.5; g.stroke(p); g.restore();
      g.strokeStyle = '#3a1f08'; g.lineWidth = G2 * 1.62; g.stroke(p);
      g.strokeStyle = '#ffc928'; g.lineWidth = G2 * 1.2; g.stroke(p);
      g.save(); g.translate(-G2 * 0.12, -G2 * 0.22); g.strokeStyle = '#fff3a0'; g.lineWidth = G2 * 0.34; g.stroke(p); g.restore();
      g.restore();
    }
    if (i.golpe && i.tGolpe < 1.2) {
      const k = i.lim(i.tGolpe / 0.4, 0, 1), s = rebote(k);
      g.save(); g.translate(i.x0 + i.ancho * 0.86, i.y0 - i.ancho * 0.04); g.scale(s, s); g.rotate(Math.sin(i.tGolpe * 6) * 0.2);
      const ic = iconoBloque(B.ORO), w = i.ancho * 0.16; g.drawImage(ic, -w / 2, -w / 2, w, w * 1.12); g.restore();
    }
  },
  letras(g, parte, I, t, y) {
    const tam = Math.min(32, I.W * 0.09); letra(g, tam); const w = g.measureText('JXSTUDIOS').width, x = I.cx - w / 2;
    letra(g, tam); g.textAlign = 'left'; g.textBaseline = 'middle';
    g.fillStyle = '#3a1f08'; g.fillText(parte, x + 2, y + tam * 0.6 + 3);
    g.lineJoin = 'round'; g.lineWidth = 5; g.strokeStyle = '#3a1f08'; g.strokeText(parte, x, y + tam * 0.6);
    g.fillStyle = '#ffffff'; g.fillText(parte, x, y + tam * 0.6);
  },
  presentaTxt(g, s, I, t, y) {
    const tam = Math.min(32, I.W * 0.09), a = clamp((t - 1.52) / 0.25, 0, 1);
    g.globalAlpha = a; letra(g, 13); const w = g.measureText(s).width + 30, yy = y + tam * 1.55;
    g.fillStyle = '#5a3a1c'; g.fillRect(I.cx - 3, yy - 4, 6, 26);
    g.fillStyle = '#3a240f'; rr(g, I.cx - w / 2 - 2, yy - 2, w + 4, 26, 5); g.fill();
    g.fillStyle = '#b8844a'; rr(g, I.cx - w / 2, yy, w, 22, 4); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(I.cx - w / 2, yy + 11, w, 1);
    texto(g, s, I.cx, yy + 11.5, 13, '#ffffff', '#3a240f'); g.globalAlpha = 1;
  },
  jingle(ctx, bus, t0, tg, h) {
    const { tono, soplo, f, T: TT } = h;
    // bloques que se van poniendo mientras se escribe el monograma
    for (let k = 0; k < 7; k++) { const t = t0 + 0.12 + k * 0.11; tono('square', 180 + k * 30, 90, 0.07, 0.07, t); soplo(0.04, 0.12, 'bandpass', 900 + k * 100, 400, t); }
    // el golpe: bloque grande, moneda y acorde alegre
    tono('sine', 140, 45, 0.6, 0.5, tg); soplo(0.18, 0.3, 'lowpass', 3000, 300, tg);
    tono('square', f(88), 0, 0.1, 0.05, tg + 0.06); tono('square', f(93), 0, 0.5, 0.05, tg + 0.14);
    [[72, 0.25], [76, 0.36], [79, 0.47], [84, 0.6]].forEach(([m, d]) => { tono('triangle', f(m), 0, 0.5, 0.08, tg + d); tono('sine', f(m) * 2, 0, 0.25, 0.025, tg + d); });
    for (const m of [60, 64, 67, 72]) tono('triangle', f(m), 0, 1.3, 0.045, tg + 0.75, 0.15);
    for (let k = 0; k < 9; k++) tono('square', 1200 + (k % 3) * 120, 0, 0.02, 0.025, t0 + TT.T_LETRAS + k * 0.04);
  },
};

// MANSION BUILDER — el arranque y el bucle: intro JXSTUDIOS → carga (con progreso real) → tocá para jugar → juego.
// Entrada de dedo (joystick flotante o fijo), teclado, calidad que se adapta a los FPS, bot y API de prueba.
const PRINCIPAL = { escena: 'intro', fps: 60, offline: 0, listo: false, prog: 0, pasos: [], pasoI: 0, pausa: false, ultimo: 0, intro: null, musIntro: null, resize: true };
let cvGL = null, cvUI = null, gUI = null, DPRui = 1;
const TECLAS = {};
const BOT = { activo: false, camino: null, ci: 0, dest: null, t: 0 };

function redimensionar() {
  CSSW = Math.max(200, window.innerWidth || 360); CSSH = Math.max(200, window.innerHeight || 640); DPR = window.devicePixelRatio || 1;
  W = CSSW; H = CSSH;
  UI.U = clamp(Math.min(CSSW, CSSH) / 360, 0.8, 1.7);
  DPRui = Math.min(DPR, window.__uiDPR || 2.5);
  cvUI.width = Math.round(CSSW * DPRui); cvUI.height = Math.round(CSSH * DPRui); cvUI.style.width = CSSW + 'px'; cvUI.style.height = CSSH + 'px';
  if (R.cv) R.tamano(CSSW, CSSH, DPR);
  if (PRINCIPAL.escena === 'intro' && PRINCIPAL.intro) { const t = PRINCIPAL.intro.t; crearIntro(); PRINCIPAL.intro.t = t; }
}
function crearIntro() { PRINCIPAL.intro = IntroJXS.crear({ W: CSSW, H: CSSH, presenta: PRESENTA[IDIOMA] || 'presents', vibrar: p => Sonido.vibrar(p), estilo: ESTILO_MANSION }); }
function nivelInicial() {
  let n = nivelPorGPU(EQUIPO.gpu);
  if (EQUIPO.ram <= 2) n = Math.min(n, 1);
  if (EQUIPO.movil && EQUIPO.nucleos <= 4) n = Math.min(n, 1);
  return n;
}
function ponerCalidadAjuste() { R.escalaDin = 1; R.ponerCalidad(AJ.calidad < 0 ? PRINCIPAL.nivelAuto : AJ.calidad); }
function aplicarIdioma() {
  IDIOMA = AJ.idioma !== 'auto' ? AJ.idioma : (Guardado.leer('idiomaIP', null) || idiomaNavegador());
  document.documentElement.lang = IDIOMA;
}
// la carga, en pasos cortos para que la pantalla siga viva
function armarPasos() {
  const P = PRINCIPAL.pasos;
  P.push(() => { if (!R.iniciar(cvGL)) throw new Error('webgl2'); PRINCIPAL.nivelAuto = nivelInicial(); ponerCalidadAjuste(); R.tamano(CSSW, CSSH, DPR); });
  P.push(() => R.compilar());
  P.push(() => iniciarPersonajes());
  P.push(() => { const habia = cargarEstado(); armarPads(); reconstruirMundo(); PRINCIPAL.habia = habia; });
  for (let i = 0; i < NCX * NCZ; i++) P.push(() => R.actualizarTrozos(1));
  P.push(() => { R.calcularSol(); armarFantasma(); camaraJuego(1 / 60); dibujarCuadro(0); });
  P.push(() => { offline(); });
}
function correrPasos(presupuesto) {
  const P = PRINCIPAL.pasos, t0 = performance.now();
  while (PRINCIPAL.pasoI < P.length && performance.now() - t0 < presupuesto) { P[PRINCIPAL.pasoI++](); }
  PRINCIPAL.prog = PRINCIPAL.pasoI / P.length;
  if (PRINCIPAL.pasoI >= P.length && !PRINCIPAL.listo) { PRINCIPAL.listo = true; if (PRUEBA && !PARAM.has('carga')) empezarJuego(); }
}
// lo que dejaron los visitantes mientras no estabas (un tercio de lo normal, hasta 3 horas)
function offline() {
  const s = (Date.now() - (G.t || Date.now())) / 1000;
  PRINCIPAL.offline = 0;
  if (!PRINCIPAL.habia || s < 120 || G.parte < 1) return;
  const e = ECO.visita(Math.min(G.parte, PARTES.length));
  PRINCIPAL.offline = Math.floor(Math.min(s, 3 * 3600) * e.paga / e.cada * 0.3);
}
function empezarJuego() {
  if (PRINCIPAL.escena === 'juego') return;
  PRINCIPAL.escena = 'juego';
  CAM.x = JUG.x; CAM.z = JUG.z; CAM.intro = PRUEBA ? 0 : 2.6;
  Sonido.musica(true);
  if (PRINCIPAL.offline > 0 && !PRUEBA) abrirPanel('volviste');
  else if (calendarioListo() && PRINCIPAL.habia && !PRUEBA) setTimeout(() => { if (!UI.panel) { ACT.pestana = 'calendario'; abrirPanel('actividades'); } }, 3000);
}
function borrarTodo() {
  Guardado.borrar('estado');
  G = estadoNuevo(); VIVO.armando.length = 0; VIVO.festejo = 0; PT.n = 0; UI.fests.length = 0; UI.avisos.length = 0;
  reconstruirMundo(); armarFantasma();
  UI.panel = null; guardar();
}
// ---------- entrada ----------
function entradaMundo() {
  // joystick o teclado (o bot) → dirección en el piso, según hacia dónde mira la cámara
  let jx = 0, jy = 0;
  if (UI.joy.activo) { jx = UI.joy.vx; jy = UI.joy.vy; }
  const kx = (TECLAS.ArrowRight || TECLAS.KeyD ? 1 : 0) - (TECLAS.ArrowLeft || TECLAS.KeyA ? 1 : 0), ky = (TECLAS.ArrowDown || TECLAS.KeyS ? 1 : 0) - (TECLAS.ArrowUp || TECLAS.KeyW ? 1 : 0);
  if (kx || ky) { const l = Math.hypot(kx, ky); jx = kx / l; jy = ky / l; }
  const c = Math.cos(CAM.yaw), s = Math.sin(CAM.yaw);
  return [c * jx + s * jy, -s * jx + c * jy];
}
function posToque(e) { const r = cvUI.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
const TOQUES = {};
function bajar(e) {
  e.preventDefault();
  Sonido.iniciar();
  const [x, y] = posToque(e);
  try { cvUI.setPointerCapture(e.pointerId); } catch (er) { }
  if (PRINCIPAL.escena === 'intro') { PRINCIPAL.intro.saltar(); if (PRINCIPAL.intro.listo && PRINCIPAL.musIntro) PRINCIPAL.musIntro.cortar(); if (!PRINCIPAL.musIntro && Sonido.ok() && PRINCIPAL.intro.t < 1) PRINCIPAL.musIntro = IntroJXS.jingle(Sonido.ctx, Sonido.master, ESTILO_MANSION); return; }
  if (PRINCIPAL.escena === 'carga') { if (PRINCIPAL.listo) { Sonido.efecto('clic', 0.7); empezarJuego(); } return; }
  if (Anuncios.ocupado) return;
  const b = tocarUI(x, y);
  if (b) { TOQUES[e.pointerId] = { b }; return; }
  if (UI.panel === 'mj') { tocarMJ(x, y); return; }
  if (UI.panel) return;
  const J = UI.joy;
  if (!J.activo) {
    J.activo = true; J.id = e.pointerId;
    if (AJ.joy === 'flota') { J.x0 = x; J.y0 = y; }
    J.x = x; J.y = y; moverJoy(x, y);
  }
}
function moverJoy(x, y) {
  const J = UI.joy, r = 52 * UI.U * [0.8, 1, 1.25][AJ.joyTam] * 0.6;
  let dx = x - J.x0, dy = y - J.y0; const l = Math.hypot(dx, dy);
  if (AJ.joy === 'flota' && l > r * 1.6) { J.x0 = x - dx / l * r * 1.6; J.y0 = y - dy / l * r * 1.6; dx = x - J.x0; dy = y - J.y0; }
  const k = Math.min(1, Math.hypot(dx, dy) / r), a = Math.atan2(dy, dx);
  J.vx = k < 0.12 ? 0 : Math.cos(a) * k; J.vy = k < 0.12 ? 0 : Math.sin(a) * k;
}
function mover(e) { const J = UI.joy; if (J.activo && e.pointerId === J.id) { const [x, y] = posToque(e); moverJoy(x, y); } }
function subir(e) {
  const T0 = TOQUES[e.pointerId]; delete TOQUES[e.pointerId];
  if (T0) { const [x, y] = posToque(e), b = tocarUI(x, y); if (b && b === T0.b || (b && T0.b && b.x === T0.b.x && b.y === T0.b.y)) T0.b.f(); }
  const J = UI.joy; if (J.activo && e.pointerId === J.id) { J.activo = false; J.vx = J.vy = 0; }
}
function soltarTodo() { for (const k in TOQUES) delete TOQUES[k]; UI.joy.activo = false; UI.joy.vx = UI.joy.vy = 0; for (const k in TECLAS) TECLAS[k] = false; }
// ---------- el bot (para probar): sigue el objetivo y compra mejoras con lo que sobra ----------
function botEntrada(dt) {
  let o = VIVO.obj || objetivo();
  const P = PARTES[G.parte];
  if (!JUG.carga.length) {
    let reserva = 0;
    if (P) for (const m in P.need) if (!G.gens[m]) { const pd = PADS.find(p => p.m === m); reserva = Math.max(reserva, pd.precio() - (G.pads[pd.id] || 0)); }
    for (const id of ['ayudante', 'mochila', 'vel', 'gen_madera', 'gen_piedra', 'gen_vidrio', 'gen_marmol']) {
      const p = PADS.find(q => q.id === id);
      if (p && padActivo(p) && G.dinero - (p.precio() - (G.pads[p.id] || 0)) >= reserva && (G.pads[p.id] || G.dinero >= p.precio() - (G.pads[p.id] || 0))) { o = { x: p.x, z: p.z }; break; }
    }
  }
  if (!o) return [0, 0];
  const d = Math.hypot(o.x - JUG.x, o.z - JUG.z);
  if (d < 0.5) { BOT.camino = null; return [0, 0]; }
  BOT.t -= dt;
  if (!BOT.camino || !BOT.dest || Math.hypot(BOT.dest[0] - o.x, BOT.dest[1] - o.z) > 0.4 || BOT.t <= 0) { BOT.camino = buscarCamino(JUG.x, JUG.z, o.x, o.z) || [[o.x, o.z]]; BOT.ci = 0; BOT.dest = [o.x, o.z]; BOT.t = 1.5; }
  let w = BOT.camino[BOT.ci];
  while (w && Math.hypot(w[0] - JUG.x, w[1] - JUG.z) < 0.25 && BOT.ci < BOT.camino.length - 1) w = BOT.camino[++BOT.ci];
  if (!w) return [0, 0];
  const dx = w[0] - JUG.x, dz = w[1] - JUG.z, l = Math.hypot(dx, dz) || 1, k = Math.min(1, l / 0.4);
  return [dx / l * k, dz / l * k];
}
// ---------- el bucle ----------
const ADAPTA = { acum: 0, n: 0, bueno: 0 };
function adaptar(real) {
  ADAPTA.acum += real; ADAPTA.n++;
  if (ADAPTA.acum < 2) return;
  const fps = ADAPTA.n / ADAPTA.acum; PRINCIPAL.fps = fps; ADAPTA.acum = 0; ADAPTA.n = 0;
  if (AJ.calidad >= 0 || PRUEBA) return;
  if (fps < 40) {
    ADAPTA.bueno = 0;
    if ((R.escalaDin || 1) > 0.72) { R.escalaDin = (R.escalaDin || 1) - 0.1; R.tamano(CSSW, CSSH, DPR); }
    else if (R.calidad > 0) { R.escalaDin = 0.9; R.ponerCalidad(R.calidad - 1); }
  } else if (fps > 56) {
    if (++ADAPTA.bueno >= 3 && (R.escalaDin || 1) < 1) { ADAPTA.bueno = 0; R.escalaDin = Math.min(1, R.escalaDin + 0.1); R.tamano(CSSW, CSSH, DPR); }
  }
}
function actualizar(dt) {
  if (PRINCIPAL.escena !== 'juego') return;
  Anuncios.pasar(dt); pasarRuleta(dt);
  if (UI.panel === 'mj') pasarMJ(dt);
  if (BOT.activo && UI.panel && UI.panel !== 'mj') { if (UI.panel === 'premio') cobrarPremio(1); else UI.panel = null; }
  if (UI.panel || Anuncios.ocupado) return;
  const [ix, iz] = BOT.activo ? botEntrada(dt) : entradaMundo();
  actualizarJuego(dt, ix, iz);
  UI.pasar(dt);
}
function cuadro(ts) {
  requestAnimationFrame(cuadro);
  try {
    if (PRINCIPAL.resize) { PRINCIPAL.resize = false; redimensionar(); }
    const real = PRINCIPAL.ultimo ? Math.max(0, (ts - PRINCIPAL.ultimo) / 1000) : 1 / 60;
    PRINCIPAL.ultimo = ts;
    const dt = Math.min(0.05, real);
    if (GL.perdido || PRINCIPAL.congelado) return;
    const g = gUI; g.setTransform(DPRui, 0, 0, DPRui, 0, 0);
    const esc = PRINCIPAL.escena;
    // en TikTok Minis la interfaz es un lienzo aparte y se compone encima del 3D al final del cuadro
    const componer = hizo3D => { if (window.__componer) window.__componer(hizo3D); };
    if (esc === 'intro' || esc === 'carga') {
      if (!PRINCIPAL.listo) correrPasos(esc === 'intro' ? 10 : 14);
      if (esc === 'intro') {
        const I = PRINCIPAL.intro; I.pasar(dt); g.clearRect(0, 0, CSSW, CSSH); I.dibujar(g);
        if (I.listo) PRINCIPAL.escena = 'carga';
      } else dibujarCarga(g, dt, PRINCIPAL.prog, PRINCIPAL.listo);
      return componer(false);
    }
    actualizar(dt);
    if (Anuncios.prueba) { g.clearRect(0, 0, CSSW, CSSH); Anuncios.dibujar(g); return componer(false); }
    if (UI.panel === 'mj') { UI.botones.length = 0; g.clearRect(0, 0, CSSW, CSSH); dibujarMJ(g, PRINCIPAL.reloj = (PRINCIPAL.reloj || 0) + dt); return componer(false); }
    camaraJuego(dt);
    dibujarCuadro(VIVO.t);
    dibujarUI(g, dt, VIVO.t);
    componer(true);
    adaptar(real);
  } catch (e) { mostrarError(e); }
}
function mostrarError(e) {
  if (PRINCIPAL.error) return; PRINCIPAL.error = e;
  console.error(e);
  const d = document.createElement('div');
  d.style.cssText = 'position:absolute;left:10px;right:10px;bottom:10px;padding:10px;background:#c0392b;color:#fff;font:13px sans-serif;border-radius:8px;z-index:9';
  d.textContent = (e && e.message === 'webgl2') ? 'Este celular no tiene WebGL2. Probá con Chrome actualizado.' : 'Error: ' + (e && e.message);
  document.body.appendChild(d);
}
function arrancar() {
  cvGL = document.getElementById('gl'); cvUI = document.getElementById('ui'); gUI = cvUI.getContext('2d');
  cargarAjustes(); aplicarIdioma();
  if (AJ.idioma === 'auto' && !PRUEBA) idiomaPorIP().then(l => { if (!l) return; Guardado.escribir('idiomaIP', l); if (AJ.idioma === 'auto' && l !== IDIOMA) { IDIOMA = l; document.documentElement.lang = l; } });
  redimensionar();
  crearIntro();
  if (PRUEBA && !PARAM.has('intro')) PRINCIPAL.escena = 'carga';
  armarPasos();
  const carga = document.getElementById('carga'); if (carga) carga.remove();
  cvUI.addEventListener('pointerdown', bajar, { passive: false });
  cvUI.addEventListener('pointermove', mover, { passive: true });
  cvUI.addEventListener('pointerup', subir); cvUI.addEventListener('pointercancel', subir);
  window.addEventListener('resize', () => { PRINCIPAL.resize = true; });
  window.addEventListener('orientationchange', () => { PRINCIPAL.resize = true; });
  window.addEventListener('blur', soltarTodo);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { soltarTodo(); if (PRINCIPAL.escena === 'juego') guardar(); Sonido.pausar(true); } else Sonido.pausar(false); });
  window.addEventListener('pagehide', () => { if (PRINCIPAL.escena === 'juego') guardar(); });
  window.addEventListener('keydown', e => { TECLAS[e.code] = true; if (e.code === 'Escape' && PRINCIPAL.escena === 'juego') { if (UI.panel) cerrarPanel(); else abrirPanel('ajustes'); } if ((e.code === 'Space' || e.code === 'Enter') && PRINCIPAL.escena === 'carga' && PRINCIPAL.listo) { Sonido.iniciar(); empezarJuego(); } });
  window.addEventListener('keyup', e => { TECLAS[e.code] = false; });
  document.addEventListener('contextmenu', e => e.preventDefault());
  if (document.fonts && document.fonts.load) document.fonts.load('20px Bungee').catch(() => { });
  requestAnimationFrame(cuadro);
}
// ---------- API de prueba ----------
window.__juego = {
  get bot() { return BOT.activo; }, set bot(v) { BOT.activo = !!v; },
  estado: () => ({ escena: PRINCIPAL.escena, listo: PRINCIPAL.listo, dinero: G.dinero, caja: G.caja, parte: G.parte, entregado: Object.assign({}, G.entregado), gens: JSON.parse(JSON.stringify(G.gens)), ayud: G.ayud, mochila: G.mochila, vel: G.vel, visitas: G.visitas, bloques: G.bloques, obj: VIVO.obj && VIVO.obj.tipo, t: Math.round(G.jugado), fps: Math.round(PRINCIPAL.fps), calidad: R.calidad, idioma: IDIOMA, carga: JUG.carga.length, vis: VIS.length, pos: [+JUG.x.toFixed(2), +JUG.z.toFixed(2)] }),
  paso(n, dib) { for (let i = 0; i < n; i++) { actualizar(1 / 30); camaraJuego(1 / 30); } if (dib) { R.actualizarTrozos(99); R.sombraSucia = true; R.ultimaSombra = -1; dibujarCuadro(VIVO.t); gUI.setTransform(DPRui, 0, 0, DPRui, 0, 0); dibujarUI(gUI, 1 / 30, VIVO.t); } },
  empezar: () => empezarJuego(),
  dar: n => { G.dinero += n; },
  completar(k) { while (G.parte < Math.min(k, PARTES.length)) { const P = PARTES[G.parte]; for (const m in P.need) { G.entregado[m] = necesita(G.parte, m); } colocar(listaParte(G.parte), false); for (const m in P.need) OBRA.aterrizado[m] = necesita(G.parte, m); completarParte(); } for (const m of MATERIALES) if (PRIMERA[m] < G.parte + 1 && !G.gens[m]) { G.gens[m] = { nivel: 1, pila: 6 }; VIVO.gen[m] = { t: 0, enCamino: 0 }; colocar(listaDe(MAQUINAS[m].arma), false); } },
  calidad(n) { AJ.calidad = n; ponerCalidadAjuste(); },
  idioma(l) { AJ.idioma = l; aplicarIdioma(); },
  panel(p) { if (p) abrirPanel(p); else UI.panel = null; },
  ir(x, z) { JUG.x = x; JUG.z = z; CAM.x = x; CAM.z = z; },
  camara(o) { Object.assign(CAM, o); },
  borrar: () => borrarTodo(),
  renovar: () => renovarMansion(),
  congelar(v) { PRINCIPAL.congelado = v !== false; },
  gemas: n => { G.gemas += n; },
  mj: t => abrirMinijuego(t, null),
  tocar(x, y) { const b = tocarUI(x, y); if (b) b.f(); else if (UI.panel === 'mj') tocarMJ(x, y); return !!b; },
  dibujarMJ() { gUI.setTransform(DPRui, 0, 0, DPRui, 0, 0); UI.botones.length = 0; gUI.clearRect(0, 0, CSSW, CSSH); dibujarMJ(gUI, 1); },
  medir(n) { const t0 = performance.now(); for (let i = 0; i < n; i++) { dibujarCuadro(VIVO.t); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4)); } return (performance.now() - t0) / n; },
  stats: () => Object.assign({}, R.stats, { w: R.w, h: R.h, part: PT.n }),
  ev(s) { return PRUEBA ? eval(s) : undefined; },
};
arrancar();

})();
