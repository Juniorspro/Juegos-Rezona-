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
  __audios: /*AUDIOS*/,
  __leerAudio: n => { try { return TTG.getFileSystemManager().readFileSync('audio/' + n + '.mp3'); } catch (e) { return null; } },
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
