// POTRERO — la interfaz de historieta: botones con tinta y trama, cartuchos, globos, estallidos, íconos a
// mano, paneles, opciones, idioma, editor de controles y el telón de puntos.
const TINTA = '#16131f', PAPEL = '#fff6e0', PAPEL2 = '#f1e2c2', AMARILLO = '#ffd23f', ROJO = '#ec4a33', AZUL = '#3270d8',
  CELESTE = '#62c6f2', VERDE = '#4bb553', ROSA = '#f47eb4', NARANJA = '#f7962e', VIOLETA = '#8d5be0', BLANCO = '#ffffff';
let ZONAS = [], ZONAS_PREV = [], PANEL = null;
function zona(x, y, w, h, fn, op) { ZONAS.push({ x, y, w, h, fn, op: op || {} }); }
function zonaEn(L, x, y) { for (let i = L.length - 1; i >= 0; i--) { const z = L[i]; if (x >= z.x && y >= z.y && x < z.x + z.w && y < z.y + z.h) return z; } return null; }
function apretado(x, y, w, h) { for (const p of E.punteros.values()) if (p.rol === 'ui' && p.x >= x && p.y >= y && p.x < x + w && p.y < y + h && p.x0 >= x && p.y0 >= y && p.x0 < x + w && p.y0 < y + h) return true; return false; }
function resolverClics() {
  const cl = E.clics.splice(0);
  for (const c of cl) { const z = zonaEn(ZONAS_PREV, c.x, c.y); if (z && z.fn && c.x0 >= z.x && c.y0 >= z.y && c.x0 < z.x + z.w && c.y0 < z.y + z.h) z.fn(c.x, c.y); }
}
// ---------- sellos: lo que no cambia se pinta una vez ----------
const _sellos = new Map();
function sello(k, w, h, pintar) {
  const kk = k + '|' + S.toFixed(3);
  let s = _sellos.get(kk);
  if (!s) {
    const c = lienzo(w * S, h * S), g = c.getContext('2d'); g.setTransform(S, 0, 0, S, 0, 0); pintar(g); s = c; _sellos.set(kk, s);
    if (_sellos.size > 260) _sellos.delete(_sellos.keys().next().value);
  }
  return s;
}
function estampar(g, s, x, y) { g.drawImage(s, x, y, s.width / S, s.height / S); }
// trama de puntos a 45° (la de las historietas impresas)
const _tramas = new Map();
function trama(g, col, paso, r) {
  const k = col + paso + r + S.toFixed(3);
  let p = _tramas.get(k);
  if (!p) {
    const n = Math.max(2, Math.round(paso * S)), c = lienzo(n, n), h = c.getContext('2d'), rr = r * S;
    h.fillStyle = col;
    for (const [x, y] of [[0, 0], [n, 0], [0, n], [n, n], [n / 2, n / 2]]) { h.beginPath(); h.arc(x, y, rr, 0, TAU); h.fill(); }
    p = g.createPattern(c, 'repeat');
    try { p.setTransform(new DOMMatrix([1 / S, 0, 0, 1 / S, 0, 0])); } catch (e) { }
    _tramas.set(k, p);
  }
  return p;
}
function caminoRedondo(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r); g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h); g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r); g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath(); }
// un cuadro de historieta: sombra de trama, tinta gruesa, relleno y brillo
function cuadroComic(g, x, y, w, h, col, o) {
  o = o || {};
  const bw = o.bw || 2.6, r = o.r != null ? o.r : 5, sx = o.sombra != null ? o.sombra : 4;
  if (sx) { caminoRedondo(g, x + sx, y + sx, w, h, r); g.fillStyle = trama(g, TINTA, 3.2, 1.25); g.fill(); }
  caminoRedondo(g, x, y, w, h, r);
  g.fillStyle = col; g.fill();
  if (!o.liso) {
    g.save(); g.clip();
    g.fillStyle = trama(g, mezcla(col, TINTA, 0.28), 3.4, 1.0); g.fillRect(x, y + h * 0.62, w, h * 0.4);
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(x + 3, y + 2.5, w - 6, Math.min(3, h * 0.12));
    g.restore();
  }
  caminoRedondo(g, x, y, w, h, r);
  g.lineWidth = bw; g.strokeStyle = TINTA; g.lineJoin = 'round'; g.stroke();
}
// estallido (el globo de "¡PUM!")
function caminoEstallido(g, cx, cy, rx, ry, puntas, semilla) {
  const r = rngSemilla(semilla || 7);
  g.beginPath();
  for (let i = 0; i < puntas * 2; i++) {
    const a = i / (puntas * 2) * TAU - PI / 2, k = i % 2 ? 0.72 + r() * 0.08 : 1 + r() * 0.12;
    const x = cx + Math.cos(a) * rx * k, y = cy + Math.sin(a) * ry * k;
    if (i) g.lineTo(x, y); else g.moveTo(x, y);
  }
  g.closePath();
}
function estallido(g, cx, cy, rx, ry, col, o) {
  o = o || {};
  const s = sello('est' + rx + 'x' + ry + col + (o.puntas || 14) + (o.semilla || 7), rx * 2.5 + 10, ry * 2.5 + 10, b => {
    const c = [rx * 1.25 + 5, ry * 1.25 + 5];
    caminoEstallido(b, c[0] + 3.5, c[1] + 3.5, rx, ry, o.puntas || 14, o.semilla); b.fillStyle = trama(b, TINTA, 3.2, 1.3); b.fill();
    caminoEstallido(b, c[0], c[1], rx, ry, o.puntas || 14, o.semilla); b.fillStyle = col; b.fill();
    b.save(); b.clip(); b.fillStyle = trama(b, mezcla(col, ROJO, 0.5), 3.6, 1.1); b.beginPath(); b.arc(c[0] + rx * 0.5, c[1] + ry * 0.6, rx * 0.9, 0, TAU); b.fill(); b.restore();
    caminoEstallido(b, c[0], c[1], rx, ry, o.puntas || 14, o.semilla); b.lineWidth = 2.8; b.lineJoin = 'miter'; b.miterLimit = 3; b.strokeStyle = TINTA; b.stroke();
  });
  g.drawImage(s, cx - rx * 1.25 - 5, cy - ry * 1.25 - 5, s.width / S, s.height / S);
}
// ---------- íconos dibujados a mano ----------
function icono(g, n, x, y, t, col) {
  g.save(); g.translate(x, y); g.scale(t / 10, t / 10);
  g.strokeStyle = col || TINTA; g.fillStyle = col || TINTA; g.lineWidth = 1.6; g.lineCap = 'round'; g.lineJoin = 'round';
  const L = (pts, cerrar) => { g.beginPath(); pts.forEach(([a, b], i) => i ? g.lineTo(a, b) : g.moveTo(a, b)); if (cerrar) g.closePath(); g.stroke(); };
  const C = (cx, cy, r, relleno) => { g.beginPath(); g.arc(cx, cy, r, 0, TAU); relleno ? g.fill() : g.stroke(); };
  switch (n) {
    case 'pausa': g.fillRect(-3.6, -4.5, 2.6, 9); g.fillRect(1, -4.5, 2.6, 9); break;
    case 'play': g.beginPath(); g.moveTo(-3, -4.8); g.lineTo(4.6, 0); g.lineTo(-3, 4.8); g.closePath(); g.fill(); break;
    case 'globo': C(0, 0, 4.6); g.beginPath(); g.ellipse(0, 0, 2, 4.6, 0, 0, TAU); g.stroke(); L([[-4.6, 0], [4.6, 0]]); L([[-3.8, -2.4], [3.8, -2.4]]); L([[-3.8, 2.4], [3.8, 2.4]]); break;
    case 'engranaje': for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; L([[Math.cos(a) * 3.2, Math.sin(a) * 3.2], [Math.cos(a) * 5, Math.sin(a) * 5]]); } C(0, 0, 3.2); C(0, 0, 1.2, true); break;
    case 'mando': caminoRedondo(g, -5, -3, 10, 6.4, 3); g.stroke(); L([[-3, 0.2], [-1, 0.2]]); L([[-2, -0.8], [-2, 1.2]]); C(2, -0.6, 0.7, true); C(3.4, 0.9, 0.7, true); break;
    case 'casa': L([[-5, -0.4], [0, -5], [5, -0.4]]); L([[-3.6, -1.4], [-3.6, 4.6], [3.6, 4.6], [3.6, -1.4]]); L([[-0.9, 4.6], [-0.9, 1.6], [0.9, 1.6], [0.9, 4.6]]); break;
    case 'cruz': L([[-4, -4], [4, 4]]); L([[4, -4], [-4, 4]]); break;
    case 'check': L([[-4.4, 0.2], [-1.4, 3.4], [4.6, -3.6]]); break;
    case 'flechaIzq': L([[3, -4.5], [-2.5, 0], [3, 4.5]]); break;
    case 'flechaDer': L([[-3, -4.5], [2.5, 0], [-3, 4.5]]); break;
    case 'pelota': C(0, 0, 4.8); g.beginPath(); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU - PI / 2; g.lineTo(Math.cos(a) * 1.9, Math.sin(a) * 1.9); } g.closePath(); g.fill(); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU - PI / 2; L([[Math.cos(a) * 1.9, Math.sin(a) * 1.9], [Math.cos(a) * 4.8, Math.sin(a) * 4.8]]); } break;
    case 'pase': C(-2.6, 2.4, 2.2); L([[0.2, 0.4], [4.6, -3.6]]); L([[1.6, -3.8], [4.6, -3.6], [4.4, -0.8]]); L([[-4.6, -1.6], [-1.6, -1.6]]); L([[-4.8, -3.6], [-2.6, -3.6]]); break;
    case 'tiro': C(2.2, 1, 3.2, true); g.fillStyle = col === TINTA ? PAPEL : TINTA; C(2.2, 1, 1.1, true); g.fillStyle = col || TINTA; L([[-5, -3.8], [-1.6, -1.6]]); L([[-5.2, 0.6], [-1.8, 0.8]]); L([[-4.4, 4.6], [-1.4, 3.2]]); break;
    case 'gambeta': L([[-4.6, 4.2], [-1.6, -0.6], [1.2, 2.6], [4.4, -3.2]]); L([[1.8, -3.6], [4.4, -3.2], [4.6, -0.6]]); break;
    case 'estrella': g.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU - PI / 2, r = i % 2 ? 2.2 : 5.2; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill(); break;
    case 'cambio': L([[-4.4, -1.6], [3.6, -1.6]]); L([[1.6, -3.8], [3.8, -1.6], [1.6, 0.6]]); L([[4.4, 2.2], [-3.6, 2.2]]); L([[-1.6, 0], [-3.8, 2.2], [-1.6, 4.4]]); break;
    case 'barrida': L([[-4.8, 3.6], [4.8, 3.6]]); L([[-3.6, 1.6], [2.6, 0.8]]); C(-3.2, -1.4, 1.5, true); L([[3.4, -2.2], [4.8, -0.6]]); L([[1.8, -3.4], [3.6, -1.6]]); break;
    case 'trofeo': L([[-3, -4.4], [3, -4.4], [2.6, 0], [0, 1.8], [-2.6, 0]], true); L([[-3, -3.2], [-4.8, -3.2], [-4.4, -0.8], [-2.6, 0]]); L([[3, -3.2], [4.8, -3.2], [4.4, -0.8], [2.6, 0]]); L([[0, 1.8], [0, 3.4]]); L([[-2.6, 4.6], [2.6, 4.6]]); break;
    case 'candado': caminoRedondo(g, -3.8, -0.6, 7.6, 5.4, 1); g.fill(); g.beginPath(); g.arc(0, -1, 2.6, PI, 0); g.stroke(); L([[-2.6, -1], [-2.6, -0.4]]); L([[2.6, -1], [2.6, -0.4]]); break;
    case 'reloj': C(0, 0.4, 4.4); L([[0, 0.4], [0, -2.4]]); L([[0, 0.4], [2, 1.6]]); L([[-1.2, -4.8], [1.2, -4.8]]); break;
    case 'guante': caminoRedondo(g, -3.6, -1.2, 7.2, 6, 2.4); g.stroke(); for (let i = 0; i < 4; i++) L([[-2.7 + i * 1.8, -1.2], [-2.7 + i * 1.8, -4.4]]); L([[-3.6, 2.4], [-5, 0.2]]); break;
    case 'musica': L([[-2, 3.4], [-2, -4.4], [3.6, -5], [3.6, 2.6]]); C(-3.4, 3.4, 1.5, true); C(2.2, 2.6, 1.5, true); break;
    case 'atras': L([[-4.2, 0], [4.2, 0]]); L([[-1, -3.4], [-4.4, 0], [-1, 3.4]]); break;
    case 'libro': L([[0, -3.6], [0, 4.4]]); L([[0, -3.6], [-4.8, -4.4], [-4.8, 3.6], [0, 4.4], [4.8, 3.6], [4.8, -4.4], [0, -3.6]]); break;
    case 'calendario': caminoRedondo(g, -4.6, -3.6, 9.2, 8.4, 1.2); g.stroke(); L([[-4.6, -1.2], [4.6, -1.2]]); L([[-2.2, -5], [-2.2, -2.6]]); L([[2.2, -5], [2.2, -2.6]]); C(0, 1.8, 1, true); break;
    case 'arco': L([[-5, 4], [-5, -3.6], [5, -3.6], [5, 4]]); for (let i = -3; i <= 3; i += 2) L([[i, -3.6], [i * 0.8, 4]]); L([[-5, 0.4], [5, 0.4]]); break;
    case 'repetir': g.beginPath(); g.arc(0, 0, 4.2, -PI * 0.85, PI * 0.6); g.stroke(); L([[1.6, 4.4], [-1.4, 4], [-0.2, 1.6]]); break;
  }
  g.restore();
}
// ---------- botones ----------
function boton(g, x, y, w, h, etiqueta, fn, op) {
  op = op || {};
  const ap = !!fn && apretado(x, y, w, h), d = ap ? 2.5 : 0, col = op.c || PAPEL, sombra = op.sombra != null ? op.sombra : 3.5;
  const s = sello('bt' + w.toFixed(1) + 'x' + h.toFixed(1) + col + (op.sel ? 1 : 0) + sombra, w + 8, h + 8, b => {
    cuadroComic(b, 1.5, 1.5, w, h, col, { r: op.r != null ? op.r : Math.min(7, h * 0.3), sombra });
    if (op.sel) { caminoRedondo(b, 5, 5, w - 7, h - 7, 4); b.lineWidth = 1.6; b.setLineDash([3, 2.5]); b.strokeStyle = TINTA; b.stroke(); b.setLineDash([]); }
  });
  if (ap) { g.save(); g.beginPath(); g.rect(x - 2, y - 2, w + 9, h + 9); g.clip(); }
  g.drawImage(s, x - 1.5 + d, y - 1.5 + d, s.width / S, s.height / S);
  if (ap) g.restore();
  const tam = op.tam || Math.min(16, h * 0.42), tc = op.tc || TINTA;
  let cx = x + w / 2 + d;
  if (op.ic) {
    const it = op.it || Math.min(h * 0.5, 16);
    if (etiqueta) {
      const tw = Math.min(w - it - 18, medir(etiqueta, tam, 1)), tot = it + 6 + tw;
      icono(g, op.ic, cx - tot / 2 + it / 2, y + h / 2 + d, it, tc);
      txt(g, etiqueta, cx - tot / 2 + it + 6, y + h / 2 + d, { tam, c: tc, b: op.tb !== undefined ? op.tb : null, max: w - it - 18, al: 0 });
    } else icono(g, op.ic, cx, y + h / 2 + d, it, tc);
  } else if (etiqueta) txt(g, etiqueta, cx, y + h / 2 + d, { tam, c: tc, b: op.tb !== undefined ? op.tb : null, max: w - 12, al: 0.5 });
  if (op.sub) txt(g, op.sub, cx, y + h - 7 + d, { tam: tam * 0.62, c: tc, b: null, max: w - 12, al: 0.5, peso: 0 });
  if (fn) zona(x, y, w, h, () => { if (op.mudo !== true) Sonido.boton(); vibrar(8); fn(); }, op);
  return ap;
}
// botón estallido (el principal)
function botonEstallido(g, cx, cy, rx, ry, etiqueta, fn, op) {
  op = op || {};
  const ap = !!fn && apretado(cx - rx, cy - ry, rx * 2, ry * 2), d = ap ? 2.5 : 0, pul = ap ? 1 : 1 + Math.sin(T * 5) * 0.025;
  g.save(); g.translate(cx + d, cy + d); g.scale(pul, pul); g.rotate(Math.sin(T * 2.2) * 0.02);
  estallido(g, 0, 0, rx, ry, op.c || AMARILLO, { puntas: op.puntas || 16, semilla: op.semilla || 5 });
  if (op.ic) icono(g, op.ic, 0, -ry * 0.3, ry * 0.4, TINTA);
  txt(g, etiqueta, 0, op.ic ? ry * 0.18 : 0, { tam: op.tam || ry * 0.42, c: op.tc || ROJO, b: TINTA, bw: 2.2, max: rx * 1.45, al: 0.5 });
  g.restore();
  if (fn) zona(cx - rx, cy - ry, rx * 2, ry * 2, () => { Sonido.boton(); vibrar(12); fn(); });
}
// cartucho (el recuadro amarillo del narrador)
function cartucho(g, x, y, s, o) {
  o = o || {};
  const tam = o.tam || 11, w = Math.min(o.max || W - 20, medir(s, tam, 1) + tam * 1.4), h = altoRenglon(tam) + tam * 0.5, al = o.al == null ? 0 : o.al, x0 = x - w * al;
  g.save(); g.translate(x0 + w / 2, y + h / 2); g.rotate(o.rot != null ? o.rot : -0.025);
  g.fillStyle = TINTA; g.fillRect(-w / 2 + 2.5, -h / 2 + 2.5, w, h);
  g.fillStyle = o.c || AMARILLO; g.fillRect(-w / 2, -h / 2, w, h);
  g.lineWidth = 2; g.strokeStyle = TINTA; g.strokeRect(-w / 2, -h / 2, w, h);
  txt(g, s, 0, 0, { tam, c: o.tc || TINTA, b: null, max: w - tam, al: 0.5 });
  g.restore();
  return h;
}
// marco de panel con título en cartucho
function marco(g, x, y, w, h, titulo, col) {
  zona(x, y, w, h, () => { });
  const s = sello('mc' + w.toFixed(1) + 'x' + h.toFixed(1) + (col || PAPEL), w + 10, h + 10, b => {
    b.fillStyle = trama(b, TINTA, 3.2, 1.3); b.fillRect(6, 6, w, h);
    b.fillStyle = col || PAPEL; b.fillRect(1.5, 1.5, w, h);
    b.save(); b.beginPath(); b.rect(1.5, 1.5, w, h); b.clip(); b.fillStyle = trama(b, 'rgba(22,19,31,0.12)', 4, 1.3); b.beginPath(); b.moveTo(w * 0.55, h + 2); b.lineTo(w + 2, h * 0.5); b.lineTo(w + 2, h + 2); b.fill(); b.restore();
    b.lineWidth = 3; b.strokeStyle = TINTA; b.strokeRect(1.5, 1.5, w, h);
  });
  g.drawImage(s, x - 1.5, y - 1.5, s.width / S, s.height / S);
  if (titulo) cartucho(g, x - 4, y - 9, titulo, { tam: 13, max: w - 10 });
}
function fondoOscuro(g, a) { g.fillStyle = 'rgba(16,12,24,' + (a == null ? 0.55 : a) + ')'; g.fillRect(0, 0, W, H); zona(0, 0, W, H, () => { }); }
function deslizador(g, x, y, w, v, fn) {
  caminoRedondo(g, x, y + 4, w, 7, 3.5); g.fillStyle = PAPEL2; g.fill(); g.lineWidth = 2; g.strokeStyle = TINTA; g.stroke();
  caminoRedondo(g, x, y + 4, Math.max(7, w * v), 7, 3.5); g.fillStyle = AMARILLO; g.fill(); g.stroke();
  const kx = x + v * w;
  g.beginPath(); g.arc(kx, y + 7.5, 7.5, 0, TAU); g.fillStyle = PAPEL; g.fill(); g.lineWidth = 2.2; g.stroke();
  zona(x - 8, y - 6, w + 16, 27, null, { drag: (px) => fn(clamp((px - x) / w, 0, 1)) });
}
function interruptor(g, x, y, on, fn) {
  caminoRedondo(g, x, y, 34, 16, 8); g.fillStyle = on ? VERDE : PAPEL2; g.fill(); g.lineWidth = 2.2; g.strokeStyle = TINTA; g.stroke();
  g.beginPath(); g.arc(x + (on ? 26 : 8), y + 8, 6, 0, TAU); g.fillStyle = PAPEL; g.fill(); g.stroke();
  zona(x - 6, y - 6, 46, 28, () => { Sonido.boton(); fn(); });
}

// ---------- telón de puntos (la trama crece hasta tapar todo y se abre en la otra escena) ----------
const TELON = { fase: 0, t: 0, alMedio: null };
const ESCENAS_MENU = ['titulo', 'historia', 'picado', 'penalesMenu', 'desafio', 'creditos', 'idioma'];
function irA(esc, alMedio) {
  if (TELON.fase) return;
  const f = () => { ESCENA = esc; soltarTodo(); if (alMedio) alMedio(); if (ESCENAS_MENU.includes(ESCENA) && typeof DEMO !== 'undefined' && !DEMO && typeof empezarDemo === 'function') empezarDemo(); };
  if (PRUEBA && !PARAM.has('telon')) { f(); return; }
  TELON.fase = 1; TELON.t = 0; TELON.alMedio = f; Sonido.telon();
}
function dibujarTelon(g) {
  if (!TELON.fase) return;
  const k = TELON.t, paso = 18, diag = W + H;
  if (k >= 0.999) { g.fillStyle = TINTA; g.fillRect(0, 0, W, H); return; }
  g.fillStyle = TINTA; g.beginPath();
  for (let y = 0, f = 0; y < H + paso; y += paso * 0.5, f++) for (let x = (f % 2) * paso * 0.5; x < W + paso; x += paso) {
    const r = clamp(k * 2.2 - (x + y) / diag * 1.2, 0, 1) * paso * 0.78;
    if (r > 0.3) { g.moveTo(x + r, y); g.arc(x, y, r, 0, TAU); }
  }
  g.fill();
}

// ---------- paneles ----------
function abrirPanel(tipo, d) { PANEL = Object.assign({ tipo, t: 0 }, d || {}); soltarTodo(); }
function cerrarPanel() { const v = PANEL && PANEL.volver; PANEL = null; if (v) abrirPanel(v); }
function dibujarPanel(g) {
  const P = PANEL; P.t += DT;
  const f = { opciones: panelOpciones, idioma: panelIdioma, controles: panelControles, confirmar: panelConfirmar, pausa: panelPausa }[P.tipo];
  if (f) f(g, P); else if (typeof panelesExtra === 'function') panelesExtra(g, P);
}
function entrada(P) { return rebote(clamp(P.t / 0.28, 0, 1)); }
function panelOpciones(g, P) {
  fondoOscuro(g);
  const w = Math.min(W - 24, 330), fila = 34, h = 62 + fila * 4 + 98, x = (W - w) / 2, y = Math.max(16, (H - h) / 2) + (1 - entrada(P)) * 30;
  marco(g, x, y, w, h, tr('opciones'));
  const x1 = x + 14, x2 = x + w * 0.48, ww = w * 0.52 - 22;
  const et = (k, i) => txt(g, tr(k), x1, y + 30 + i * fila, { tam: 12, c: TINTA, b: null, max: w * 0.44 });
  et('musica', 0); deslizador(g, x2, y + 22, ww, OP.musica, v => { OP.musica = v; Sonido.volumen(OP.musica, OP.sonido); guardarOp(); });
  et('sonido', 1); deslizador(g, x2, y + 22 + fila, ww, OP.sonido, v => { OP.sonido = v; Sonido.volumen(OP.musica, OP.sonido); guardarOp(); });
  et('vibrar', 2); interruptor(g, x2, y + 22 + fila * 2, OP.vibrar, () => { OP.vibrar = !OP.vibrar; VIBRAR = OP.vibrar; guardarOp(); vibrar(30); });
  et('cambioAuto', 3); interruptor(g, x2, y + 22 + fila * 3, OP.cambioAuto, () => { OP.cambioAuto = !OP.cambioAuto; guardarOp(); });
  const yc = y + 26 + fila * 4;
  txt(g, tr('calidad'), x1, yc + 4, { tam: 12, c: TINTA, b: null, max: w - 28 });
  const cs = ['auto', 'baja', 'media', 'alta'], cw = (w - 28 + 5) / 4;
  cs.forEach((c, i) => boton(g, x1 + i * cw, yc + 14, cw - 5, 24, tr('cal_' + c), () => { OP.calidad = c; aplicarCalidad(); guardarOp(); }, { c: OP.calidad === c ? AMARILLO : PAPEL, tam: 10, sombra: 2.5 }));
  boton(g, x1, yc + 46, w - 28, 26, nombreIdioma(), () => abrirPanel('idioma', { volver: 'opciones', volver2: P.volver }), { ic: 'globo', tam: 11, sombra: 2.5 });
  boton(g, W / 2 - 55, y + h - 18, 110, 30, tr('volver'), () => { const v = P.volver; PANEL = null; if (v) abrirPanel(v); }, { c: VERDE, ic: 'check' });
}
function nombreIdioma() { const l = IDIOMAS.find(x => x[0] === IDIOMA); return l ? l[1] : IDIOMA; }
function cambiarIdioma(cod) { IDIOMA = cod; Guardado.escribir('idioma', cod); document.documentElement.lang = cod; document.documentElement.dir = esRTL() ? 'rtl' : 'ltr'; _aMano.clear(); }
function botonIdioma(g, bx, by, bw, bh, cod, nom, fn, sel) {
  boton(g, bx, by, bw, bh, null, fn, { c: sel ? AMARILLO : PAPEL, sel, sombra: 2.5 });
  const v = IDIOMA; IDIOMA = cod;
  txt(g, nom, bx + bw / 2, by + bh / 2, { tam: Math.min(12, bh * 0.42), c: TINTA, b: null, max: bw - 10, al: 0.5, peso: 1, temblor: false });
  IDIOMA = v;
}
function panelIdioma(g, P) {
  fondoOscuro(g);
  const cols = 2, filas = Math.ceil(IDIOMAS.length / cols), bh = 26, gap = 6, w = Math.min(W - 20, 340), h = 40 + filas * (bh + gap) + 8, x = (W - w) / 2, y = Math.max(14, (H - h) / 2);
  marco(g, x, y, w, h, tr('idioma'));
  const cw = (w - 24 - gap) / 2;
  IDIOMAS.forEach(([cod, nom], i) => {
    const c = i % cols, f = Math.floor(i / cols);
    botonIdioma(g, x + 12 + c * (cw + gap), y + 26 + f * (bh + gap), cw, bh, cod, nom, () => { cambiarIdioma(cod); const v = P.volver, v2 = P.volver2; PANEL = null; if (v) abrirPanel(v, { volver: v2 }); }, cod === IDIOMA);
  });
}
function panelConfirmar(g, P) {
  fondoOscuro(g);
  const w = Math.min(W - 40, 290), tam = 13, L = partir(tr(P.k), w - 30, tam, 1), lh = altoRenglon(tam), h = 70 + L.length * lh, x = (W - w) / 2, y = (H - h) / 2;
  marco(g, x, y, w, h, null);
  L.forEach((l, i) => txt(g, l, W / 2, y + 20 + lh * (i + 0.5), { tam, c: TINTA, b: null, max: w - 24, al: 0.5 }));
  const bw = (w - 36) / 2;
  boton(g, x + 12, y + h - 42, bw, 30, tr('no'), () => { PANEL = null; if (P.no) P.no(); }, {});
  boton(g, x + 24 + bw, y + h - 42, bw, 30, tr('si'), () => { PANEL = null; P.si(); }, { c: ROJO, tc: BLANCO, tb: TINTA });
}

// ---------- controles de dedo ----------
// joy: palanca · A: pase/cambiar · B: tiro/barrida · C: gambeta/pique · D: especial
const CTL = { joy: { act: false, id: null, bx: 0, by: 0, vx: 0, vy: 0 }, bot: { A: false, B: false, C: false, D: false } };
const IDS_CTL = ['joy', 'A', 'B', 'C', 'D'];
function orient() { return W > H ? 'h' : 'v'; }
function radioCtl(id) { const s = (OP.tam[id] || 1) * ({ joy: 52, A: 31, B: 37, C: 27, D: 30 }[id]); return W > H ? s * 0.92 : s; }
function opacCtl(id) { return OP.opac[id] != null ? OP.opac[id] : 0.9; }
function posDefecto(id) {
  const v = W <= H, p = v ? { joy: [78, H - 112], B: [W - 52, H - 118], A: [W - 128, H - 70], C: [W - 118, H - 160], D: [W - 46, H - 214] }[id]
    : { joy: [92, H - 92], B: [W - 58, H - 100], A: [W - 136, H - 58], C: [W - 126, H - 148], D: [W - 52, H - 198] }[id];
  return OP.zurdo ? [W - p[0], p[1]] : p;
}
function posCtl(id) {
  const q = OP.pos[orient()] && OP.pos[orient()][id], p = q ? [q[0] * W, q[1] * H] : posDefecto(id), r = radioCtl(id);
  return [clamp(p[0], r + 4, W - r - 4), clamp(p[1], r + 4, H - r - 4)];
}
function zonaPalanca(x, y) {
  if (OP.palanca === 'fija') { const [px, py] = posCtl('joy'); return Math.hypot(x - px, y - py) < radioCtl('joy') * 1.5; }
  return (OP.zurdo ? x > W * 0.5 : x < W * 0.5) && y > H * 0.3;
}
function ctlVisible(id) { return id === 'D' ? (typeof especialListo === 'function' && especialListo()) : true; }
function tocarControl(x, y) {
  for (const id of ['A', 'B', 'C', 'D']) { if (!ctlVisible(id)) continue; const [cx, cy] = posCtl(id); if (Math.hypot(x - cx, y - cy) < radioCtl(id) * 1.22) return id; }
  return zonaPalanca(x, y) ? 'joy' : null;
}
function moverPalanca(x, y, inicio) {
  const j = CTL.joy, r = radioCtl('joy');
  if (inicio) { if (OP.palanca === 'flotante') { j.bx = x; j.by = y; } else [j.bx, j.by] = posCtl('joy'); }
  let dx = x - j.bx, dy = y - j.by, d = Math.hypot(dx, dy);
  if (OP.palanca === 'flotante' && d > r) { j.bx += dx / d * (d - r); j.by += dy / d * (d - r); dx = x - j.bx; dy = y - j.by; d = r; }
  const k = d < r * 0.1 ? 0 : Math.min(1, d / (r * 0.75));
  j.vx = d ? dx / d * k : 0; j.vy = d ? dy / d * k : 0;
}
// lo que muestra cada botón depende de si tenés la pelota
function iconoCtl(id) {
  const con = typeof tengoPelota === 'function' && tengoPelota();
  return { A: con ? 'pase' : 'cambio', B: con ? 'tiro' : 'barrida', C: 'gambeta', D: 'estrella' }[id];
}
function colorCtl(id) { return { A: VERDE, B: ROJO, C: CELESTE, D: AMARILLO }[id]; }
function selloCtl(id, r, ap, ic, col) {
  return sello('ctl' + id + r.toFixed(1) + ap + ic + col, r * 2 + 12, r * 2 + 12, b => {
    const c = r + 5;
    b.beginPath(); b.arc(c + 3, c + 3, r, 0, TAU); b.fillStyle = trama(b, TINTA, 3, 1.2); b.fill();
    const o = ap ? 2.5 : 0;
    b.beginPath(); b.arc(c + o, c + o, r, 0, TAU); b.fillStyle = ap ? mezcla(col, TINTA, 0.2) : col; b.fill();
    b.save(); b.clip(); b.fillStyle = trama(b, mezcla(col, TINTA, 0.35), 3.2, 1.0); b.beginPath(); b.arc(c + o + r * 0.45, c + o + r * 0.5, r * 0.95, 0, TAU); b.fill();
    b.fillStyle = 'rgba(255,255,255,0.45)'; b.beginPath(); b.ellipse(c + o - r * 0.32, c + o - r * 0.45, r * 0.42, r * 0.22, -0.5, 0, TAU); b.fill(); b.restore();
    b.beginPath(); b.arc(c + o, c + o, r, 0, TAU); b.lineWidth = 2.6; b.strokeStyle = TINTA; b.stroke();
    icono(b, ic, c + o, c + o, r * 0.95, TINTA);
  });
}
function dibujarControl(g, id, editor, sel) {
  const [x, y] = posCtl(id), r = radioCtl(id);
  g.globalAlpha = editor ? 1 : opacCtl(id);
  if (id === 'joy') {
    const j = CTL.joy, act = j.act && !editor, flot = OP.palanca === 'flotante', bx = act && flot ? j.bx : x, by = act && flot ? j.by : y;
    if (!act && flot && !editor) g.globalAlpha *= 0.55;
    const s = sello('joy' + r.toFixed(1), r * 2 + 8, r * 2 + 8, b => {
      const c = r + 4;
      b.beginPath(); b.arc(c, c, r, 0, TAU); b.fillStyle = 'rgba(255,246,224,0.18)'; b.fill(); b.lineWidth = 2.4; b.strokeStyle = TINTA; b.stroke();
      b.beginPath(); b.arc(c, c, r - 3, 0, TAU); b.lineWidth = 1.4; b.strokeStyle = 'rgba(255,246,224,0.8)'; b.setLineDash([4, 4]); b.stroke(); b.setLineDash([]);
    });
    g.drawImage(s, bx - r - 4, by - r - 4, s.width / S, s.height / S);
    const kx = bx + (act ? j.vx : 0) * r * 0.62, ky = by + (act ? j.vy : 0) * r * 0.62, rk = r * 0.44;
    const sk = sello('joyk' + rk.toFixed(1), rk * 2 + 10, rk * 2 + 10, b => {
      const c = rk + 4;
      b.beginPath(); b.arc(c + 2.5, c + 2.5, rk, 0, TAU); b.fillStyle = trama(b, TINTA, 3, 1.2); b.fill();
      b.beginPath(); b.arc(c, c, rk, 0, TAU); b.fillStyle = PAPEL; b.fill();
      b.save(); b.clip(); b.fillStyle = trama(b, PAPEL2, 3, 1.1); b.fillRect(c - rk, c, rk * 2, rk); b.restore();
      b.lineWidth = 2.4; b.strokeStyle = TINTA; b.stroke();
      icono(b, 'pelota', c, c, rk * 1.1, TINTA);
    });
    g.drawImage(sk, kx - rk - 4, ky - rk - 4, sk.width / S, sk.height / S);
  } else {
    const ap = CTL.bot[id] && !editor ? 1 : 0, ic = editor ? { A: 'pase', B: 'tiro', C: 'gambeta', D: 'estrella' }[id] : iconoCtl(id);
    if (id === 'D' && !editor) { const k = 1 + Math.sin(T * 9) * 0.06; g.save(); g.translate(x, y); g.scale(k, k); g.translate(-x, -y); }
    const s = selloCtl(id, r, ap, ic, colorCtl(id));
    g.drawImage(s, x - r - 5, y - r - 5, s.width / S, s.height / S);
    if (id === 'D' && !editor) g.restore();
    // la carga del tiro: un anillo que se llena
    if (id === 'B' && !editor && typeof cargaTiro === 'function') { const c = cargaTiro(); if (c > 0) { g.beginPath(); g.arc(x, y, r + 5, -PI / 2, -PI / 2 + TAU * c); g.lineWidth = 5; g.strokeStyle = c > 0.92 ? ROJO : AMARILLO; g.stroke(); g.lineWidth = 1.5; g.strokeStyle = TINTA; g.beginPath(); g.arc(x, y, r + 7.5, -PI / 2, -PI / 2 + TAU * c); g.stroke(); } }
  }
  g.globalAlpha = 1;
  if (editor && sel) { g.strokeStyle = BLANCO; g.lineWidth = 2; g.setLineDash([5, 4]); g.strokeRect(x - r - 7, y - r - 7, r * 2 + 14, r * 2 + 14); g.setLineDash([]); }
}
function dibujarControles(g) {
  if (!TACTIL || (PANEL && PANEL.tipo === 'controles')) return;
  for (const id of IDS_CTL) if (ctlVisible(id)) dibujarControl(g, id);
}
// editor: mover, tamaño, opacidad, palanca fija o flotante, zurdo, restablecer
function panelControles(g, P) {
  g.fillStyle = 'rgba(16,12,24,0.4)'; g.fillRect(0, 0, W, H);
  P.sel = P.sel || 'B';
  for (const id of IDS_CTL) dibujarControl(g, id, true, P.sel === id);
  // qué hace cada botón, al lado de cada uno
  for (const id of ['A', 'B', 'C', 'D']) { const [cx, cy] = posCtl(id), r = radioCtl(id); txt(g, tr('ctl_' + id), cx, cy - r - 12, { tam: 9, c: BLANCO, b: TINTA, al: 0.5, max: 110 }); }
  const w = Math.min(W - 24, 320), tam = 10.5, L = partir(tr('arrastrar'), w - 24, tam, 0), lh = altoRenglon(tam), h = 150 + L.length * lh, x = (W - w) / 2, y = W > H ? 14 : Math.round(H * 0.1);
  marco(g, x, y, w, h, tr('controles'));
  L.forEach((l, i) => txt(g, l, W / 2, y + 22 + lh * (i + 0.5), { tam, c: TINTA, b: null, max: w - 20, al: 0.5, peso: 0 }));
  const y0 = y + 26 + L.length * lh, x2 = x + w * 0.4, ww = w * 0.6 - 20;
  txt(g, tr('tamano'), x + 12, y0 + 9, { tam: 11, c: TINTA, b: null, max: w * 0.36 });
  deslizador(g, x2, y0 + 2, ww, ((OP.tam[P.sel] || 1) - 0.6) / 0.9, v => { OP.tam[P.sel] = 0.6 + v * 0.9; guardarOp(); });
  txt(g, tr('opacidad'), x + 12, y0 + 35, { tam: 11, c: TINTA, b: null, max: w * 0.36 });
  deslizador(g, x2, y0 + 28, ww, ((OP.opac[P.sel] != null ? OP.opac[P.sel] : 0.9) - 0.25) / 0.75, v => { OP.opac[P.sel] = 0.25 + v * 0.75; guardarOp(); });
  const bw = (w - 30) / 2;
  boton(g, x + 12, y0 + 52, w - 24, 24, tr(OP.palanca === 'fija' ? 'palancaFija' : 'palancaFlot'), () => { OP.palanca = OP.palanca === 'fija' ? 'flotante' : 'fija'; guardarOp(); }, { tam: 10.5, sombra: 2.5 });
  boton(g, x + 12, y0 + 82, bw, 24, tr('zurdo'), () => { OP.zurdo = !OP.zurdo; OP.pos = { v: {}, h: {} }; guardarOp(); }, { c: OP.zurdo ? AMARILLO : PAPEL, tam: 10.5, sombra: 2.5 });
  boton(g, x + 18 + bw, y0 + 82, bw, 24, tr('restablecer'), () => { OP.pos = { v: {}, h: {} }; OP.tam = {}; OP.opac = {}; OP.palanca = 'flotante'; OP.zurdo = false; guardarOp(); }, { tam: 10.5, sombra: 2.5 });
  boton(g, W / 2 - 55, y + h - 18, 110, 30, tr('listo'), () => { const v = P.volver; PANEL = null; if (v) abrirPanel(v); }, { c: VERDE, ic: 'check' });
}
