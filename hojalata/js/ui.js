// HOJALATA — la interfaz de chapa litografiada: placas esmaltadas con bisel y remaches, letras en relieve,
// cintas, medallas, íconos a mano, paneles (opciones, idioma, confirmar, controles), la persiana de la
// juguetería como telón y los controles de dedo editables.
const TINTA = '#1b1a2e', CREMA = '#f6e7c6', CREMA2 = '#e6d2aa', ROJO = '#d8352a', AZUL = '#1f4fa8', AMARILLO = '#f2b632', VERDE = '#3fae4f',
  CELESTE = '#4ab8e8', ROSA = '#f47eb4', NARANJA = '#ff8a1f', VIOLETA = '#8d5be0', BLANCO = '#ffffff', PLATA = '#c9ced8', ORO = '#d9a441';
let ZONAS = [], ZONAS_PREV = [], PANEL = null;
function zona(x, y, w, h, fn, op) { ZONAS.push({ x, y, w, h, fn, op: op || {} }); }
function zonaEn(L, x, y) { for (let i = L.length - 1; i >= 0; i--) { const z = L[i]; if (x >= z.x && y >= z.y && x < z.x + z.w && y < z.y + z.h) return z; } return null; }
function apretado(x, y, w, h) { for (const p of E.punteros.values()) if (p.rol === 'ui' && p.x >= x && p.y >= y && p.x < x + w && p.y < y + h && p.x0 >= x && p.y0 >= y && p.x0 < x + w && p.y0 < y + h) return true; return false; }
function resolverClics() {
  const cl = E.clics.splice(0);
  for (const c of cl) { const z = zonaEn(ZONAS_PREV, c.x, c.y); if (z && z.fn && c.x0 >= z.x && c.y0 >= z.y && c.x0 < z.x + z.w && c.y0 < z.y + z.h) z.fn(c.x, c.y); }
}
// ---------- sellos: lo quieto se pinta una vez ----------
const _sellos = new Map();
function sello(k, w, h, pintar) {
  const kk = k + '|' + S.toFixed(3);
  let s = _sellos.get(kk);
  if (!s) {
    const c = lienzo(w * S, h * S), g = c.getContext('2d'); g.setTransform(S, 0, 0, S, 0, 0); pintar(g); s = c; _sellos.set(kk, s);
    if (_sellos.size > 300) _sellos.delete(_sellos.keys().next().value);
  }
  return s;
}
function estampar(g, s, x, y) { g.drawImage(s, x, y, s.width / S, s.height / S); }
function caminoRedondo(g, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); g.beginPath(); g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r); g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h); g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r); g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath(); }
function remache(g, x, y, r) {
  const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
  gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.45, '#c9ced8'); gr.addColorStop(1, '#5a5f6a');
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
}
// una placa de chapa esmaltada: sombra, borde de lata con bisel, esmalte con brillo, remaches
function chapa(g, x, y, w, h, col, o) {
  o = o || {};
  const r = o.r != null ? o.r : Math.min(10, h * 0.3), b = o.borde != null ? o.borde : 2.6;
  if (o.sombra !== 0) { g.fillStyle = 'rgba(20,14,30,0.35)'; caminoRedondo(g, x + 1.5, y + (o.sombra || 4), w, h, r); g.fill(); }
  // borde de lata
  const gb = g.createLinearGradient(x, y, x, y + h); gb.addColorStop(0, '#f4f6fa'); gb.addColorStop(0.5, '#a8aeb8'); gb.addColorStop(1, '#6a707c');
  caminoRedondo(g, x, y, w, h, r); g.fillStyle = gb; g.fill();
  // esmalte
  const ge = g.createLinearGradient(x, y, x, y + h); ge.addColorStop(0, mezcla(col, '#ffffff', 0.22)); ge.addColorStop(0.55, col); ge.addColorStop(1, mezcla(col, '#000000', 0.18));
  caminoRedondo(g, x + b, y + b, w - b * 2, h - b * 2, Math.max(1, r - b)); g.fillStyle = ge; g.fill();
  if (o.rayas) { g.save(); caminoRedondo(g, x + b, y + b, w - b * 2, h - b * 2, Math.max(1, r - b)); g.clip(); g.fillStyle = rgba(o.rayas, 0.18); for (let k = -h; k < w; k += 9) { g.beginPath(); g.moveTo(x + k, y + h); g.lineTo(x + k + h, y); g.lineTo(x + k + h + 4, y); g.lineTo(x + k + 4, y + h); g.fill(); } g.restore(); }
  // brillo de arriba
  g.save(); caminoRedondo(g, x + b, y + b, w - b * 2, h - b * 2, Math.max(1, r - b)); g.clip();
  g.fillStyle = 'rgba(255,255,255,0.28)'; g.beginPath(); g.ellipse(x + w * 0.5, y + b, w * 0.55, Math.min(h * 0.38, 14), 0, 0, TAU); g.fill();
  g.restore();
  caminoRedondo(g, x + 0.5, y + 0.5, w - 1, h - 1, r); g.lineWidth = 1; g.strokeStyle = 'rgba(20,14,30,0.55)'; g.stroke();
  if (o.remaches && w > 40 && h > 24) { const q = Math.min(7, r * 0.6 + 3); for (const [a, c] of [[x + q, y + q], [x + w - q, y + q], [x + q, y + h - q], [x + w - q, y + h - q]]) remache(g, a, c, 2.2); }
}
// texto en relieve (estampado en la chapa)
function txtR(g, s, x, y, o) {
  o = Object.assign({ b: null }, o || {});
  const c = o.c || CREMA, osc = o.osc || 'rgba(15,10,25,0.75)';
  txt(g, s, x + (o.dx != null ? o.dx : 0.8), y + (o.dy != null ? o.dy : 1.4), Object.assign({}, o, { c: osc, b: o.b ? osc : null }));
  return txt(g, s, x, y, Object.assign({}, o, { c }));
}
// la cinta (para títulos)
function cinta(g, cx, y, s, o) {
  o = o || {};
  const tam = o.tam || 13, w = Math.min(o.max || W - 30, medir(s, tam, 1) + tam * 2.4), h = tam * 2.0, col = o.c || ROJO;
  const st = sello('cinta' + s + '|' + tam + col + (o.tc || '') + w.toFixed(1) + IDIOMA, w + 34, h + 12, b => {
    const x = 16;
    b.fillStyle = mezcla(col, '#000000', 0.35);
    for (const s2 of [-1, 1]) { const ex = s2 < 0 ? x - 10 : x + w + 10, ix = s2 < 0 ? x + 6 : x + w - 6; b.beginPath(); b.moveTo(ix, 5); b.lineTo(ex, 5); b.lineTo(ex + s2 * -6, h / 2 + 5); b.lineTo(ex, h + 5); b.lineTo(ix, h + 5); b.closePath(); b.fill(); }
    chapa(b, x, 0, w, h, col, { r: 3, sombra: 3, borde: 2 });
    txtR(b, s, x + w / 2, h / 2, { tam, c: o.tc || CREMA, al: 0.5, max: w - tam });
  });
  g.drawImage(st, cx - w / 2 - 16, y, st.width / S, st.height / S);
  return h;
}
// una chapa quieta, pintada una vez
function chapaS(g, x, y, w, h, col, o) {
  const k = 'chS' + w.toFixed(1) + 'x' + h.toFixed(1) + col + JSON.stringify(o || {});
  const st = sello(k, w + 8, h + 10, b => chapa(b, 3, 2, w, h, col, o));
  g.drawImage(st, x - 3, y - 2, st.width / S, st.height / S);
}
// números que cambian cada cuadro (el reloj): de a una letra, con sellos por carácter
function txtNum(g, s, x, y, o) {
  const tam = o.tam || 12, w = medir('0', tam, 1) * 1.02;
  let tot = 0; for (const ch of s) tot += ch === ':' || ch === '.' ? w * 0.5 : w;
  let cx = x - tot * (o.al == null ? 0 : o.al);
  for (const ch of s) { const cw = ch === ':' || ch === '.' ? w * 0.5 : w; txt(g, ch, cx + cw / 2, y, Object.assign({}, o, { al: 0.5, max: null })); cx += cw; }
}
// ---------- íconos ----------
function icono(g, n, x, y, t, col) {
  g.save(); g.translate(x, y); g.scale(t / 10, t / 10);
  g.strokeStyle = col || TINTA; g.fillStyle = col || TINTA; g.lineWidth = 1.7; g.lineCap = 'round'; g.lineJoin = 'round';
  const L = (pts, cerrar) => { g.beginPath(); pts.forEach(([a, b], i) => i ? g.lineTo(a, b) : g.moveTo(a, b)); if (cerrar) g.closePath(); g.stroke(); };
  const Cc = (cx, cy, r, relleno) => { g.beginPath(); g.arc(cx, cy, r, 0, TAU); relleno ? g.fill() : g.stroke(); };
  switch (n) {
    case 'pausa': g.fillRect(-3.6, -4.5, 2.6, 9); g.fillRect(1, -4.5, 2.6, 9); break;
    case 'play': g.beginPath(); g.moveTo(-3, -4.8); g.lineTo(4.6, 0); g.lineTo(-3, 4.8); g.closePath(); g.fill(); break;
    case 'globo': Cc(0, 0, 4.6); g.beginPath(); g.ellipse(0, 0, 2, 4.6, 0, 0, TAU); g.stroke(); L([[-4.6, 0], [4.6, 0]]); L([[-3.8, -2.4], [3.8, -2.4]]); L([[-3.8, 2.4], [3.8, 2.4]]); break;
    case 'engranaje': for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; L([[Math.cos(a) * 3.2, Math.sin(a) * 3.2], [Math.cos(a) * 5, Math.sin(a) * 5]]); } Cc(0, 0, 3.2); Cc(0, 0, 1.2, true); break;
    case 'mando': caminoRedondo(g, -5, -3, 10, 6.4, 3); g.stroke(); L([[-3, 0.2], [-1, 0.2]]); L([[-2, -0.8], [-2, 1.2]]); Cc(2, -0.6, 0.7, true); Cc(3.4, 0.9, 0.7, true); break;
    case 'casa': L([[-5, -0.4], [0, -5], [5, -0.4]]); L([[-3.6, -1.4], [-3.6, 4.6], [3.6, 4.6], [3.6, -1.4]]); L([[-0.9, 4.6], [-0.9, 1.6], [0.9, 1.6], [0.9, 4.6]]); break;
    case 'cruz': L([[-4, -4], [4, 4]]); L([[4, -4], [-4, 4]]); break;
    case 'check': L([[-4.4, 0.2], [-1.4, 3.4], [4.6, -3.6]]); break;
    case 'flechaIzq': L([[3, -4.5], [-2.5, 0], [3, 4.5]]); break;
    case 'flechaDer': L([[-3, -4.5], [2.5, 0], [-3, 4.5]]); break;
    case 'flechaArr': L([[-4.5, 3], [0, -2.5], [4.5, 3]]); break;
    case 'estrella': g.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU - PI / 2, r = i % 2 ? 2.2 : 5.2; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill(); break;
    case 'trofeo': L([[-3, -4.4], [3, -4.4], [2.6, 0], [0, 1.8], [-2.6, 0]], true); L([[-3, -3.2], [-4.8, -3.2], [-4.4, -0.8], [-2.6, 0]]); L([[3, -3.2], [4.8, -3.2], [4.4, -0.8], [2.6, 0]]); L([[0, 1.8], [0, 3.4]]); L([[-2.6, 4.6], [2.6, 4.6]]); break;
    case 'candado': caminoRedondo(g, -3.8, -0.6, 7.6, 5.4, 1); g.fill(); g.beginPath(); g.arc(0, -1, 2.6, PI, 0); g.stroke(); L([[-2.6, -1], [-2.6, -0.4]]); L([[2.6, -1], [2.6, -0.4]]); break;
    case 'reloj': Cc(0, 0.4, 4.4); L([[0, 0.4], [0, -2.4]]); L([[0, 0.4], [2, 1.6]]); L([[-1.2, -4.8], [1.2, -4.8]]); break;
    case 'musica': L([[-2, 3.4], [-2, -4.4], [3.6, -5], [3.6, 2.6]]); Cc(-3.4, 3.4, 1.5, true); Cc(2.2, 2.6, 1.5, true); break;
    case 'atras': L([[-4.2, 0], [4.2, 0]]); L([[-1, -3.4], [-4.4, 0], [-1, 3.4]]); break;
    case 'libro': L([[0, -3.6], [0, 4.4]]); L([[0, -3.6], [-4.8, -4.4], [-4.8, 3.6], [0, 4.4], [4.8, 3.6], [4.8, -4.4], [0, -3.6]]); break;
    case 'calendario': caminoRedondo(g, -4.6, -3.6, 9.2, 8.4, 1.2); g.stroke(); L([[-4.6, -1.2], [4.6, -1.2]]); L([[-2.2, -5], [-2.2, -2.6]]); L([[2.2, -5], [2.2, -2.6]]); Cc(0, 1.8, 1, true); break;
    case 'repetir': g.beginPath(); g.arc(0, 0, 4.2, -PI * 0.85, PI * 0.6); g.stroke(); L([[1.6, 4.4], [-1.4, 4], [-0.2, 1.6]]); break;
    case 'bandera': L([[-4, 5], [-4, -5]]); for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) if ((i + j) % 2 === 0) g.fillRect(-4 + i * 2.8, -5 + j * 2.6, 2.8, 2.6); g.strokeRect(-4, -5, 8.4, 5.2); break;
    case 'llave': g.lineWidth = 1.9; L([[0, 4.8], [0, -0.6]]); Cc(-2.2, -2.6, 2.1); Cc(2.2, -2.6, 2.1); L([[-1.2, 2.2], [1.2, 2.2]]); break;
    case 'derrape': g.beginPath(); g.arc(0, 0, 3.6, PI * 0.2, PI * 1.6); g.stroke(); L([[-1.2, -4.6], [0.6, -3.4], [-1, -2]]); for (let k = 0; k < 3; k++) L([[2 + k * 1.1, 2.8 - k * 1.2], [3.4 + k * 1.1, 3.4 - k * 1.2]]); break;
    case 'regalo': g.strokeRect(-4.2, -1.4, 8.4, 5.8); g.strokeRect(-4.8, -3.4, 9.6, 2); L([[0, -3.4], [0, 4.4]]); g.beginPath(); g.ellipse(-1.6, -4.6, 1.6, 1, -0.4, 0, TAU); g.ellipse(1.6, -4.6, 1.6, 1, 0.4, 0, TAU); g.stroke(); break;
    case 'canica': Cc(0, 0, 4.4); g.beginPath(); g.moveTo(-2.4, 2); g.quadraticCurveTo(0, -3, 2.8, 1.6); g.stroke(); Cc(-1.6, -1.8, 0.8, true); break;
    case 'boton': Cc(0, 0, 4.6); Cc(0, 0, 3.4); for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) Cc(a * 1.1, b * 1.1, 0.55, true); break;
    case 'resorte': for (let k = 0; k < 5; k++) { g.beginPath(); g.ellipse(0, 3.6 - k * 1.8, 3.6, 1, 0, 0, PI); g.stroke(); } L([[-3.6, -4.4], [3.6, -4.4]]); L([[-3.6, 4.4], [3.6, 4.4]]); break;
    case 'pompa': Cc(0, 0, 4.6); g.beginPath(); g.arc(0, 0, 3.2, PI * 1.1, PI * 1.5); g.stroke(); Cc(1.8, -2.2, 0.6, true); break;
    case 'tornillo': Cc(0, -2, 2.8); L([[-1.8, -2], [1.8, -2]]); L([[-1, 0.8], [-1, 4.8], [1, 4.8], [1, 0.8]]); for (let k = 0; k < 3; k++) L([[-1, 1.6 + k * 1.1], [1, 2.2 + k * 1.1]]); break;
    case 'auto': caminoRedondo(g, -5, -1, 10, 3.4, 1.4); g.stroke(); L([[-2.6, -1], [-1.4, -3.4], [1.8, -3.4], [3, -1]]); Cc(-2.8, 2.8, 1.4, true); Cc(2.8, 2.8, 1.4, true); break;
    case 'fantasma': g.beginPath(); g.arc(0, -1, 4, PI, 0); g.lineTo(4, 4.4); g.lineTo(2, 3); g.lineTo(0, 4.4); g.lineTo(-2, 3); g.lineTo(-4, 4.4); g.closePath(); g.stroke(); Cc(-1.5, -1.2, 0.8, true); Cc(1.5, -1.2, 0.8, true); break;
  }
  g.restore();
}
// ---------- botones ----------
function boton(g, x, y, w, h, etiqueta, fn, op) {
  op = op || {};
  const ap = !!fn && apretado(x, y, w, h), d = ap ? 2.2 : 0, col = op.c || CREMA, sombra = op.sombra != null ? op.sombra : 4;
  const s = sello('bt' + w.toFixed(1) + 'x' + h.toFixed(1) + col + (op.sel ? 1 : 0) + sombra + (ap ? 1 : 0) + (op.rem ? 1 : 0), w + 8, h + 10, b => {
    chapa(b, 2, 2 + (ap ? 2 : 0), w, h, ap ? mezcla(col, '#000000', 0.12) : col, { r: op.r != null ? op.r : Math.min(10, h * 0.32), sombra: ap ? 1.5 : sombra, remaches: op.rem });
    if (op.sel) { caminoRedondo(b, 6, 6 + (ap ? 2 : 0), w - 8, h - 8, 6); b.lineWidth = 1.6; b.setLineDash([3, 2.5]); b.strokeStyle = TINTA; b.stroke(); b.setLineDash([]); }
  });
  g.drawImage(s, x - 2, y - 2, s.width / S, s.height / S);
  const tam = op.tam || Math.min(16, h * 0.42), claro = op.tc ? op.tc : (lumi(col) > 0.6 ? TINTA : CREMA);
  const cx = x + w / 2, cy = y + h / 2 + d;
  const osc = lumi(col) > 0.6 ? 'rgba(255,255,255,0.7)' : 'rgba(15,10,25,0.7)';
  if (op.ic) {
    const it = op.it || Math.min(h * 0.5, 16);
    if (etiqueta) {
      const tw = Math.min(w - it - 18, medir(etiqueta, tam, 1)), tot = it + 6 + tw;
      icono(g, op.ic, cx - tot / 2 + it / 2, cy, it, claro);
      txtR(g, etiqueta, cx - tot / 2 + it + 6, cy, { tam, c: claro, osc, max: w - it - 18, al: 0, dy: lumi(col) > 0.6 ? 1 : 1.3 });
    } else icono(g, op.ic, cx, cy, it, claro);
  } else if (etiqueta) txtR(g, etiqueta, cx, cy, { tam, c: claro, osc, max: w - 14, al: 0.5, dy: lumi(col) > 0.6 ? 1 : 1.3 });
  if (op.sub) txt(g, op.sub, cx, y + h - 7 + d, { tam: tam * 0.62, c: claro, b: null, max: w - 12, al: 0.5, peso: 0 });
  if (fn) zona(x, y, w, h, () => { if (op.mudo !== true) Sonido.boton(); vibrar(8); fn(); }, op);
  return ap;
}
function lumi(h) { const c = hexRgb(h); return (c[0] * 0.3 + c[1] * 0.55 + c[2] * 0.15) / 255; }
// el botón grande del título: una placa ovalada con la llave de cuerda que gira
function botonGrande(g, cx, cy, w, h, etiqueta, fn, op) {
  op = op || {};
  const x = cx - w / 2, y = cy - h / 2, ap = !!fn && apretado(x, y, w, h), d = ap ? 2.5 : 0, pul = ap ? 1 : 1 + Math.sin(T * 4) * 0.02;
  g.save(); g.translate(cx, cy + d); g.scale(pul, pul); g.translate(-cx, -cy);
  const s = sello('bg' + w + 'x' + h + (op.c || ROJO) + (ap ? 1 : 0), w + 10, h + 12, b => chapa(b, 3, 3, w, h, op.c || ROJO, { r: h / 2, sombra: ap ? 1.5 : 5, borde: 3.4, rayas: '#ffffff' }));
  g.drawImage(s, x - 3, y - 3, s.width / S, s.height / S);
  const kx = x + h * 0.55, ky = cy;
  g.save(); g.translate(kx, ky); g.rotate(T * 2.2); icono(g, 'llave', 0, 0, h * 0.5, AMARILLO); g.restore();
  txtR(g, etiqueta, cx + h * 0.22, cy, { tam: op.tam || h * 0.36, c: CREMA, al: 0.5, max: w - h * 1.3, dy: 1.8, dx: 1 });
  g.restore();
  if (fn) zona(x, y, w, h, () => { Sonido.boton(); vibrar(12); fn(); });
}
// marco de panel: una chapa grande con remaches y título en cinta
function marco(g, x, y, w, h, titulo, col) {
  zona(x, y, w, h, () => { });
  const s = sello('mc' + w.toFixed(1) + 'x' + h.toFixed(1) + (col || CREMA), w + 12, h + 14, b => {
    chapa(b, 4, 4, w, h, col || CREMA, { r: 12, sombra: 6, borde: 4, remaches: true });
    b.save(); caminoRedondo(b, 12, 12, w - 16, h - 16, 8); b.clip(); b.fillStyle = 'rgba(160,110,60,0.07)'; for (let k = 0; k < h; k += 8) b.fillRect(4, 8 + k, w, 3); b.restore();
  });
  g.drawImage(s, x - 4, y - 4, s.width / S, s.height / S);
  if (titulo) cinta(g, x + w / 2, y - 14, titulo, { tam: 13, max: w - 20 });
}
function fondoOscuro(g, a) { g.fillStyle = 'rgba(16,12,24,' + (a == null ? 0.55 : a) + ')'; g.fillRect(0, 0, W, H); zona(0, 0, W, H, () => { }); }
function deslizador(g, x, y, w, v, fn) {
  caminoRedondo(g, x, y + 4, w, 7, 3.5); g.fillStyle = '#7a808c'; g.fill();
  caminoRedondo(g, x, y + 4, Math.max(7, w * v), 7, 3.5); g.fillStyle = AMARILLO; g.fill(); g.lineWidth = 1; g.strokeStyle = TINTA; g.stroke();
  const kx = x + v * w;
  remache(g, kx, y + 7.5, 8);
  zona(x - 8, y - 6, w + 16, 27, null, { drag: (px) => fn(clamp((px - x) / w, 0, 1)) });
}
function interruptor(g, x, y, on, fn) {
  chapa(g, x, y, 36, 17, on ? VERDE : '#7a808c', { r: 8.5, sombra: 2, borde: 1.6 });
  remache(g, x + (on ? 27 : 9), y + 8.5, 6.5);
  zona(x - 6, y - 6, 48, 29, () => { Sonido.boton(); fn(); });
}
// ---------- la persiana (el telón): láminas que bajan y suben ----------
const TELON = { fase: 0, t: 0, alMedio: null };
function irA(esc, alMedio) {
  if (TELON.fase) return;
  const f = () => { ESCENA = esc; soltarTodo(); if (alMedio) alMedio(); };
  if (PRUEBA && !PARAM.has('telon')) { f(); return; }
  TELON.fase = 1; TELON.t = 0; TELON.alMedio = f; Sonido.persiana();
}
function dibujarTelon(g) {
  if (!TELON.fase) return;
  const k = TELON.t, h = H * suave(k), lam = 18;
  const s = sello('persiana' + Math.round(W) + 'x' + Math.round(H), W, H + lam, b => {
    const gr = b.createLinearGradient(0, 0, 0, lam); gr.addColorStop(0, '#dfe3ea'); gr.addColorStop(0.5, '#9aa0aa'); gr.addColorStop(1, '#5a606a');
    for (let y = 0; y < H + lam; y += lam) { b.save(); b.translate(0, y); b.fillStyle = gr; b.fillRect(0, 0, W, lam); b.fillStyle = 'rgba(0,0,0,0.35)'; b.fillRect(0, lam - 2, W, 2); b.restore(); }
    b.fillStyle = 'rgba(20,14,30,0.25)'; for (let x = 20; x < W; x += 60) b.fillRect(x, 0, 2, H + lam);
  });
  g.drawImage(s, 0, h - s.height / S, s.width / S, s.height / S);
  chapa(g, -6, h - 14, W + 12, 16, ROJO, { r: 3, sombra: 4, borde: 2 });
  if (k > 0.5) { const a = clamp((k - 0.5) / 0.3, 0, 1); g.globalAlpha = a; cinta(g, W / 2, h - H * 0.55, 'HOJALATA', { tam: 16, c: AZUL }); g.globalAlpha = 1; }
}
// ---------- paneles ----------
function abrirPanel(tipo, d) { PANEL = Object.assign({ tipo, t: 0 }, d || {}); soltarTodo(); }
function cerrarPanel() { const v = PANEL && PANEL.volver; PANEL = null; if (v) abrirPanel(v); }
function dibujarPanel(g) {
  const P = PANEL; P.t += DT;
  const f = { opciones: panelOpciones, idioma: panelIdioma, controles: panelControles, confirmar: panelConfirmar, pausa: panelPausa }[P.tipo];
  if (f) f(g, P);
}
function entrada(P) { return rebote(clamp(P.t / 0.28, 0, 1)); }
function panelOpciones(g, P) {
  fondoOscuro(g);
  const w = Math.min(W - 24, 330), fila = 34, h = 70 + fila * 3 + 98, x = (W - w) / 2, y = Math.max(22, (H - h) / 2) + (1 - entrada(P)) * 30;
  marco(g, x, y, w, h, tr('opciones'));
  const x1 = x + 16, x2 = x + w * 0.48, ww = w * 0.52 - 24;
  const et = (k, i) => txt(g, tr(k), x1, y + 36 + i * fila, { tam: 12, c: TINTA, b: null, max: w * 0.44 });
  et('musica', 0); deslizador(g, x2, y + 28, ww, OP.musica, v => { OP.musica = v; Sonido.volumen(OP.musica, OP.sonido); guardarOp(); });
  et('sonido', 1); deslizador(g, x2, y + 28 + fila, ww, OP.sonido, v => { OP.sonido = v; Sonido.volumen(OP.musica, OP.sonido); guardarOp(); });
  et('vibrar', 2); interruptor(g, x2, y + 28 + fila * 2, OP.vibrar, () => { OP.vibrar = !OP.vibrar; VIBRAR = OP.vibrar; guardarOp(); vibrar(30); });
  const yc = y + 32 + fila * 3;
  txt(g, tr('calidad'), x1, yc + 4, { tam: 12, c: TINTA, b: null, max: w - 28 });
  const cs = ['auto', 'baja', 'media', 'alta'], cw = (w - 32 + 5) / 4;
  cs.forEach((c, i) => boton(g, x1 + i * cw, yc + 14, cw - 5, 26, tr('cal_' + c), () => { OP.calidad = c; aplicarCalidad(); guardarOp(); }, { c: OP.calidad === c ? AMARILLO : CREMA, tam: 10, sombra: 2.5 }));
  boton(g, x1, yc + 48, w - 32, 28, nombreIdioma(), () => abrirPanel('idioma', { volver: 'opciones', volver2: P.volver }), { ic: 'globo', tam: 11, sombra: 2.5 });
  boton(g, W / 2 - 58, y + h - 20, 116, 32, tr('volver'), () => { const v = P.volver; PANEL = null; if (v) abrirPanel(v); }, { c: VERDE, ic: 'check' });
}
function nombreIdioma() { const l = IDIOMAS.find(x => x[0] === IDIOMA); return l ? l[1] : IDIOMA; }
function cambiarIdioma(cod) { IDIOMA = cod; Guardado.escribir('idioma', cod); document.documentElement.lang = cod; document.documentElement.dir = esRTL() ? 'rtl' : 'ltr'; _aMano.clear(); }
function botonIdioma(g, bx, by, bw, bh, cod, nom, fn, sel) {
  boton(g, bx, by, bw, bh, null, fn, { c: sel ? AMARILLO : CREMA, sel, sombra: 2.5 });
  const v = IDIOMA; IDIOMA = cod;
  txt(g, nom, bx + bw / 2, by + bh / 2, { tam: Math.min(12, bh * 0.42), c: TINTA, b: null, max: bw - 12, al: 0.5, peso: 1 });
  IDIOMA = v;
}
function panelIdioma(g, P) {
  fondoOscuro(g);
  const cols = 2, filas = Math.ceil(IDIOMAS.length / cols), bh = 26, gap = 6, w = Math.min(W - 20, 340), h = 44 + filas * (bh + gap) + 8, x = (W - w) / 2, y = Math.max(20, (H - h) / 2);
  marco(g, x, y, w, h, tr('idioma'));
  const cw = (w - 28 - gap) / 2;
  IDIOMAS.forEach(([cod, nom], i) => {
    const c = i % cols, f = Math.floor(i / cols);
    botonIdioma(g, x + 14 + c * (cw + gap), y + 28 + f * (bh + gap), cw, bh, cod, nom, () => { cambiarIdioma(cod); const v = P.volver, v2 = P.volver2; PANEL = null; if (v) abrirPanel(v, { volver: v2 }); }, cod === IDIOMA);
  });
}
function panelConfirmar(g, P) {
  fondoOscuro(g);
  const w = Math.min(W - 40, 290), tam = 13, L = partir(tr(P.k), w - 30, tam, 1), lh = altoRenglon(tam), h = 76 + L.length * lh, x = (W - w) / 2, y = (H - h) / 2;
  marco(g, x, y, w, h, null);
  L.forEach((l, i) => txt(g, l, W / 2, y + 22 + lh * (i + 0.5), { tam, c: TINTA, b: null, max: w - 24, al: 0.5 }));
  const bw = (w - 40) / 2;
  boton(g, x + 14, y + h - 46, bw, 32, tr('no'), () => { PANEL = null; if (P.no) P.no(); }, {});
  boton(g, x + 26 + bw, y + h - 46, bw, 32, tr('si'), () => { PANEL = null; P.si(); }, { c: ROJO });
}

// ---------- controles de dedo ----------
// joy: palanca (dobla; abajo frena) · A: derrape · B: ítem · C: soltar la cuerda (turbo)
const CTL = { joy: { act: false, id: null, bx: 0, by: 0, vx: 0, vy: 0 }, bot: { A: false, B: false, C: false } };
const IDS_CTL = ['joy', 'A', 'B', 'C'];
function orient() { return W > H ? 'h' : 'v'; }
function radioCtl(id) { const s = (OP.tam[id] || 1) * ({ joy: 54, A: 38, B: 30, C: 30 }[id]); return W > H ? s * 0.9 : s; }
function opacCtl(id) { return OP.opac[id] != null ? OP.opac[id] : 0.9; }
function posDefecto(id) {
  const v = W <= H, p = v ? { joy: [82, H - 104], A: [W - 64, H - 96], B: [W - 140, H - 62], C: [W - 132, H - 148] }[id]
    : { joy: [96, H - 92], A: [W - 70, H - 90], B: [W - 150, H - 58], C: [W - 140, H - 140] }[id];
  return OP.zurdo ? [W - p[0], p[1]] : p;
}
function posCtl(id) {
  const q = OP.pos[orient()] && OP.pos[orient()][id], p = q ? [q[0] * W, q[1] * H] : posDefecto(id), r = radioCtl(id);
  return [clamp(p[0], r + 4, W - r - 4), clamp(p[1], r + 4, H - r - 4)];
}
function zonaPalanca(x, y) {
  if (OP.palanca === 'fija') { const [px, py] = posCtl('joy'); return Math.hypot(x - px, y - py) < radioCtl('joy') * 1.5; }
  return (OP.zurdo ? x > W * 0.5 : x < W * 0.5) && y > H * 0.35;
}
function tocarControl(x, y) {
  for (const id of ['A', 'B', 'C']) { const [cx, cy] = posCtl(id), r = radioCtl(id); if (Math.hypot(x - cx, y - cy) < r * 1.25) return id; }
  return zonaPalanca(x, y) ? 'joy' : null;
}
function moverPalanca(x, y, inicio) {
  const j = CTL.joy, r = radioCtl('joy');
  if (inicio) { if (OP.palanca === 'flotante') { j.bx = x; j.by = y; } else [j.bx, j.by] = posCtl('joy'); }
  let dx = x - j.bx, dy = y - j.by, d = Math.hypot(dx, dy);
  if (OP.palanca === 'flotante' && d > r) { j.bx += dx / d * (d - r); j.by += dy / d * (d - r); dx = x - j.bx; dy = y - j.by; d = r; }
  const k = d < r * 0.08 ? 0 : Math.min(1, d / (r * 0.7));
  j.vx = d ? dx / d * k : 0; j.vy = d ? dy / d * k : 0;
}
function iconoCtl(id) { return { A: 'derrape', B: 'regalo', C: 'llave' }[id]; }
function colorCtl(id) { return { A: ROJO, B: AZUL, C: AMARILLO }[id]; }
function selloCtl(id, r, ap, col) {
  return sello('ctl' + id + r.toFixed(1) + ap + col, r * 2 + 14, r * 2 + 14, b => {
    const c = r + 6, o = ap ? 2.5 : 0;
    b.fillStyle = 'rgba(16,12,24,0.35)'; b.beginPath(); b.arc(c + 1, c + 4, r, 0, TAU); b.fill();
    const gb = b.createLinearGradient(0, c - r, 0, c + r); gb.addColorStop(0, '#f4f6fa'); gb.addColorStop(1, '#5a606a');
    b.fillStyle = gb; b.beginPath(); b.arc(c + o * 0.3, c + o, r, 0, TAU); b.fill();
    const ge = b.createRadialGradient(c - r * 0.3, c - r * 0.4 + o, r * 0.1, c, c + o, r);
    ge.addColorStop(0, mezcla(col, '#ffffff', 0.35)); ge.addColorStop(0.7, ap ? mezcla(col, '#000000', 0.2) : col); ge.addColorStop(1, mezcla(col, '#000000', 0.3));
    b.fillStyle = ge; b.beginPath(); b.arc(c + o * 0.3, c + o, r - 3, 0, TAU); b.fill();
    b.fillStyle = 'rgba(255,255,255,0.35)'; b.beginPath(); b.ellipse(c - r * 0.25, c - r * 0.45 + o, r * 0.5, r * 0.22, -0.3, 0, TAU); b.fill();
    icono(b, iconoCtl(id), c + o * 0.3, c + o, r * 0.95, lumi(col) > 0.6 ? TINTA : CREMA);
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
      b.beginPath(); b.arc(c, c, r, 0, TAU); b.fillStyle = 'rgba(27,26,46,0.28)'; b.fill(); b.lineWidth = 3; b.strokeStyle = 'rgba(246,231,198,0.85)'; b.stroke();
      for (const a of [0, PI]) { b.save(); b.translate(c + Math.cos(a) * r * 0.72, c); b.rotate(a); icono(b, 'flechaDer', 0, 0, r * 0.28, 'rgba(246,231,198,0.8)'); b.restore(); }
    });
    g.drawImage(s, bx - r - 4, by - r - 4, s.width / S, s.height / S);
    const kx = bx + (act ? j.vx : 0) * r * 0.6, ky = by + (act ? j.vy : 0) * r * 0.6, rk = r * 0.46;
    const sk = sello('joyk' + rk.toFixed(1), rk * 2 + 10, rk * 2 + 10, b => {
      const c = rk + 4;
      b.fillStyle = 'rgba(16,12,24,0.35)'; b.beginPath(); b.arc(c + 1, c + 3, rk, 0, TAU); b.fill();
      const gr = b.createRadialGradient(c - rk * 0.35, c - rk * 0.35, rk * 0.1, c, c, rk); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.5, '#c9ced8'); gr.addColorStop(1, '#5a606a');
      b.fillStyle = gr; b.beginPath(); b.arc(c, c, rk, 0, TAU); b.fill();
      b.strokeStyle = 'rgba(27,26,46,0.4)'; b.lineWidth = 1.2; for (let k = 0; k < 3; k++) { b.beginPath(); b.arc(c, c, rk * (0.3 + k * 0.22), 0, TAU); b.stroke(); }
    });
    g.drawImage(sk, kx - rk - 4, ky - rk - 4, sk.width / S, sk.height / S);
  } else {
    const ap = CTL.bot[id] && !editor ? 1 : 0;
    const s = selloCtl(id, r, ap, colorCtl(id));
    g.drawImage(s, x - r - 6, y - r - 6, s.width / S, s.height / S);
    if (!editor && typeof estadoCtl === 'function') estadoCtl(g, id, x, y, r);
  }
  g.globalAlpha = 1;
  if (editor && sel) { g.strokeStyle = BLANCO; g.lineWidth = 2; g.setLineDash([5, 4]); g.strokeRect(x - r - 7, y - r - 7, r * 2 + 14, r * 2 + 14); g.setLineDash([]); }
}
function dibujarControles(g) {
  if (!TACTIL || (PANEL && PANEL.tipo === 'controles')) return;
  for (const id of IDS_CTL) dibujarControl(g, id);
}
function panelControles(g, P) {
  g.fillStyle = 'rgba(16,12,24,0.4)'; g.fillRect(0, 0, W, H);
  P.sel = P.sel || 'A';
  for (const id of IDS_CTL) dibujarControl(g, id, true, P.sel === id);
  for (const id of ['A', 'B', 'C']) { const [cx, cy] = posCtl(id), r = radioCtl(id); txt(g, tr('ctl_' + id), cx, cy - r - 12, { tam: 9, c: BLANCO, b: TINTA, al: 0.5, max: 110 }); }
  { const [cx, cy] = posCtl('joy'), r = radioCtl('joy'); txt(g, tr('ctl_joy'), cx, cy - r - 12, { tam: 9, c: BLANCO, b: TINTA, al: 0.5, max: 140 }); }
  const w = Math.min(W - 24, 320), tam = 10.5, L = partir(tr('arrastrar'), w - 28, tam, 0), lh = altoRenglon(tam), h = 156 + L.length * lh, x = (W - w) / 2, y = W > H ? 20 : Math.round(H * 0.1);
  marco(g, x, y, w, h, tr('controles'));
  L.forEach((l, i) => txt(g, l, W / 2, y + 24 + lh * (i + 0.5), { tam, c: TINTA, b: null, max: w - 24, al: 0.5, peso: 0 }));
  const y0 = y + 28 + L.length * lh, x2 = x + w * 0.4, ww = w * 0.6 - 22;
  txt(g, tr('tamano'), x + 14, y0 + 9, { tam: 11, c: TINTA, b: null, max: w * 0.36 });
  deslizador(g, x2, y0 + 2, ww, ((OP.tam[P.sel] || 1) - 0.6) / 0.9, v => { OP.tam[P.sel] = 0.6 + v * 0.9; guardarOp(); });
  txt(g, tr('opacidad'), x + 14, y0 + 35, { tam: 11, c: TINTA, b: null, max: w * 0.36 });
  deslizador(g, x2, y0 + 28, ww, ((OP.opac[P.sel] != null ? OP.opac[P.sel] : 0.9) - 0.25) / 0.75, v => { OP.opac[P.sel] = 0.25 + v * 0.75; guardarOp(); });
  const bw = (w - 34) / 2;
  boton(g, x + 14, y0 + 54, w - 28, 26, tr(OP.palanca === 'fija' ? 'palancaFija' : 'palancaFlot'), () => { OP.palanca = OP.palanca === 'fija' ? 'flotante' : 'fija'; guardarOp(); }, { tam: 10.5, sombra: 2.5 });
  boton(g, x + 14, y0 + 86, bw, 26, tr('zurdo'), () => { OP.zurdo = !OP.zurdo; OP.pos = { v: {}, h: {} }; guardarOp(); }, { c: OP.zurdo ? AMARILLO : CREMA, tam: 10.5, sombra: 2.5 });
  boton(g, x + 20 + bw, y0 + 86, bw, 26, tr('restablecer'), () => { OP.pos = { v: {}, h: {} }; OP.tam = {}; OP.opac = {}; OP.palanca = 'flotante'; OP.zurdo = false; guardarOp(); }, { tam: 10.5, sombra: 2.5 });
  boton(g, W / 2 - 58, y + h - 20, 116, 32, tr('listo'), () => { const v = P.volver; PANEL = null; if (v) abrirPanel(v); }, { c: VERDE, ic: 'check' });
}
