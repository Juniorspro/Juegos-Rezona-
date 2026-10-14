// SIETE COLORES — la interfaz en píxeles: botones, paneles, HUD (los 7 colores, plumas, objetivo), diálogos,
// controles de dedo editables, título, pausa, opciones e idioma.
const TINTA = '#2a1830', CREMA = '#f4ead8', CREMA2 = '#e6d6bc', MARRON = '#7a4a2a';
let ZONAS = [], ZONAS_PREV = [], PANEL = null;
function rect(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
function zona(x, y, w, h, fn, op) { ZONAS.push({ x, y, w, h, fn, op: op || {} }); }
function zonaEn(L, x, y) { for (let i = L.length - 1; i >= 0; i--) { const z = L[i]; if (x >= z.x && y >= z.y && x < z.x + z.w && y < z.y + z.h) return z; } return null; }
function apretado(x, y, w, h) { for (const p of E.punteros.values()) if (p.rol === 'ui' && p.x >= x && p.y >= y && p.x < x + w && p.y < y + h && p.x0 >= x && p.y0 >= y && p.x0 < x + w && p.y0 < y + h) return true; return false; }
function resolverClics() {
  const cl = E.clics.splice(0);
  for (const c of cl) { const z = zonaEn(ZONAS_PREV, c.x, c.y); if (z && z.fn && c.x0 >= z.x && c.y0 >= z.y && c.x0 < z.x + z.w && c.y0 < z.y + z.h) z.fn(c.x, c.y); }
}
// ---------- iconos de píxeles ----------
const ICONOS = {
  pausa: ['.......', '.XX.XX.', '.XX.XX.', '.XX.XX.', '.XX.XX.', '.XX.XX.', '.......'],
  globo: ['..XXX..', '.X.X.X.', 'XXXXXXX', 'X..X..X', 'XXXXXXX', '.X.X.X.', '..XXX..'],
  engranaje: ['...X...', '.XXXXX.', '.X...X.', 'XX.X.XX', '.X...X.', '.XXXXX.', '...X...'],
  mando: ['.......', '.XXXXX.', 'XX.X.XX', 'X.XXX.X', 'XX.X.XX', '.XXXXX.', '.......'],
  casa: ['...X...', '..XXX..', '.XXXXX.', 'XXXXXXX', '.X...X.', '.X.X.X.', '.XXXXX.'],
  flecha: ['...X...', '..XXX..', '.XXXXX.', 'XXXXXXX', '..XXX..', '..XXX..', '..XXX..'],
  charla: ['.XXXXX.', 'XXXXXXX', 'X.X.X.X', 'XXXXXXX', '.XXXXX.', '..X....', '.X.....'],
  mano: ['..X.X..', '.XX.XX.', '.XXXXX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..'],
  play: ['.X.....', '.XX....', '.XXX...', '.XXXX..', '.XXX...', '.XX....', '.X.....'],
  cruz: ['X.....X', '.X...X.', '..X.X..', '...X...', '..X.X..', '.X...X.', 'X.....X'],
  pluma: ['.....XX', '....XXX', '...XXX.', '..XXX..', '.XXX...', '.XX....', 'X......'],
  ojo: ['.......', '..XXX..', '.X...X.', 'X..X..X', '.X...X.', '..XXX..', '.......'],
  musica: ['..XXXXX', '..X...X', '..X...X', '..X...X', 'XXX.XXX', 'XXX.XXX', '.......'],
};
const _ico = new Map();
function icono(g, n, x, y, col, t) {
  t = t || 1; const k = n + col; let c = _ico.get(k);
  if (!c) { const f = ICONOS[n]; c = lienzo(7, 7); const h = c.getContext('2d'); h.fillStyle = col; f.forEach((fila, j) => { for (let i = 0; i < 7; i++) if (fila[i] === 'X') h.fillRect(i, j, 1, 1); }); _ico.set(k, c); }
  g.drawImage(c, Math.round(x), Math.round(y), 7 * t, 7 * t);
}
// ---------- botones y paneles (pintados una vez y estampados) ----------
const _sellos = new Map();
function sello(k, w, h, pintar) {
  let s = _sellos.get(k);
  if (!s) { const c = lienzo(w * RES, h * RES), g = c.getContext('2d'); g.setTransform(RES, 0, 0, RES, 0, 0); g.imageSmoothingEnabled = false; pintar(g); s = c; _sellos.set(k, s); if (_sellos.size > 300) _sellos.delete(_sellos.keys().next().value); }
  return s;
}
function boton(g, x, y, w, h, etiqueta, fn, op) {
  op = op || {}; x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  const ap = !!fn && apretado(x, y, w, h), oy = ap ? 1 : 0, col = op.c || CREMA;
  const s = sello('b' + w + 'x' + h + col + (op.sel ? 1 : 0) + RES, w, h + 2, b => {
    rect(b, 1, 2, w - 2, h, 'rgba(20,10,24,0.45)');
    rect(b, 1, 0, w - 2, h, TINTA); rect(b, 0, 1, w, h - 2, TINTA);
    rect(b, 1, 1, w - 2, h - 2, col);
    rect(b, 2, 1, w - 4, 1, mezcla(col, '#ffffff', 0.45)); rect(b, 2, h - 2, w - 4, 1, mezcla(col, '#000000', 0.25));
    if (op.sel) { rect(b, 2, 2, 2, h - 4, '#f0c84a'); rect(b, w - 4, 2, 2, h - 4, '#f0c84a'); }
  });
  g.drawImage(s, x, y + oy, w, h + 2);
  let cx = x + w / 2;
  const tc = op.tc || TINTA, bor = op.bor === undefined ? null : op.bor, maxT = w - (op.ic ? 18 : 8);
  // si no entra en la letra grande, va la chica
  let f = op.f;
  if (etiqueta && !f && esPx(mayus(etiqueta), 'px') && anchoTxt(g, etiqueta, { t: op.t || 1 }) > maxT) f = 'mini';
  if (op.ic) { const tw = etiqueta ? Math.min(maxT, anchoTxt(g, etiqueta, { t: op.t || 1, f })) + 10 : 7; icono(g, op.ic, cx - tw / 2, y + oy + Math.round(h / 2 - 3.5), tc); cx += 5; }
  if (etiqueta) txt(g, etiqueta, cx, y + oy + Math.round(h / 2 - (f === 'mini' ? 2.5 : 3.5) * (op.t || 1)), { al: 0.5, c: tc, b: bor, max: maxT, t: op.t || 1, f });
  if (fn) zona(x, y, w, h, () => { Sonido.boton(); vibrar(8); fn(); }, op);
  return ap;
}
function marco(g, x, y, w, h, titulo) {
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  zona(x, y, w, h, () => { });
  const s = sello('m' + w + 'x' + h + RES, w, h, b => {
    rect(b, 2, 0, w - 4, h, TINTA); rect(b, 0, 2, w, h - 4, TINTA); rect(b, 1, 1, w - 2, h - 2, TINTA);
    rect(b, 2, 2, w - 4, h - 4, CREMA);
    // franja de aguayo arriba
    for (let i = 0; i < 7; i++) rect(b, 2 + i * (w - 4) / 7, 2, (w - 4) / 7 + 1, 3, COLORES[i]);
    rect(b, 2, 5, w - 4, 1, TINTA);
    rect(b, 3, h - 4, w - 6, 1, CREMA2);
  });
  g.drawImage(s, x, y, w, h);
  if (titulo) txt(g, titulo, x + w / 2, y + 10, { al: 0.5, c: TINTA, b: null, max: w - 16, t: 1 });
}
function fondoOscuro(g, a) { g.fillStyle = 'rgba(20,10,28,' + (a == null ? 0.55 : a) + ')'; g.fillRect(0, 0, W, H); zona(0, 0, W, H, () => { }); }
function deslizador(g, x, y, w, v, fn) {
  x = Math.round(x); y = Math.round(y); w = Math.round(w);
  rect(g, x, y + 3, w, 3, TINTA); rect(g, x + 1, y + 4, Math.round((w - 2) * v), 1, '#e04a3a');
  const kx = Math.round(x + v * (w - 6));
  rect(g, kx, y, 6, 9, TINTA); rect(g, kx + 1, y + 1, 4, 7, CREMA);
  zona(x - 4, y - 6, w + 8, 21, null, { drag: (px) => fn(clamp((px - x - 3) / (w - 6), 0, 1)) });
}
function interruptor(g, x, y, on, fn) {
  rect(g, x, y, 22, 11, TINTA); rect(g, x + 1, y + 1, 20, 9, on ? '#6ab85a' : '#b0a090');
  rect(g, x + (on ? 12 : 2), y + 2, 8, 7, CREMA);
  zona(x - 4, y - 4, 30, 19, () => { Sonido.boton(); fn(); });
}

// ---------- controles de dedo ----------
const CTL = { joy: { act: false, id: null, bx: 0, by: 0, vx: 0, vy: 0 }, bot: { A: false, B: false } };
function orient() { return W > H ? 'h' : 'v'; }
function radioCtl(id) { const s = (OP.tam[id] || 1) * (id === 'joy' ? 26 : id === 'A' ? 20 : 16); return W > H ? s * 0.9 : s; }
function opacCtl(id) { return OP.opac[id] != null ? OP.opac[id] : 0.85; }
function posDefecto(id) { const p = { joy: [38, H - 46], A: [W - 30, H - 50], B: [W - 70, H - 30] }[id]; return OP.zurdo ? [W - p[0], p[1]] : p; }
function posCtl(id) {
  const q = OP.pos[orient()] && OP.pos[orient()][id], p = q ? [q[0] * W, q[1] * H] : posDefecto(id), r = radioCtl(id);
  return [clamp(p[0], r + 2, W - r - 2), clamp(p[1], r + 2, H - r - 2)];
}
function zonaPalanca(x, y) {
  if (OP.palanca === 'fija') { const [px, py] = posCtl('joy'); return Math.hypot(x - px, y - py) < radioCtl('joy') * 1.6; }
  return (OP.zurdo ? x > W * 0.5 : x < W * 0.5) && y > H * 0.35;
}
function tocarControl(x, y) {
  for (const id of ['A', 'B']) { if (id === 'B' && !botonB()) continue; const [cx, cy] = posCtl(id); if (Math.hypot(x - cx, y - cy) < radioCtl(id) * 1.25) return id; }
  return zonaPalanca(x, y) ? 'joy' : null;
}
function moverPalanca(x, y, inicio) {
  const j = CTL.joy, r = radioCtl('joy');
  if (inicio) { if (OP.palanca === 'flotante') { j.bx = x; j.by = y; } else [j.bx, j.by] = posCtl('joy'); }
  let dx = x - j.bx, dy = y - j.by, d = Math.hypot(dx, dy);
  if (OP.palanca === 'flotante' && d > r) { j.bx += dx / d * (d - r); j.by += dy / d * (d - r); dx = x - j.bx; dy = y - j.by; d = r; }
  const k = d < r * 0.12 ? 0 : Math.min(1, d / (r * 0.8));
  j.vx = d ? dx / d * k : 0; j.vy = d ? dy / d * k : 0;
}
function botonB() { return ESCENA === 'juego' && !DLG && !CINE && hablable(); }
const _ctlS = new Map();
function selloCtl(id, r, ap, ic, col) {
  const k = id + r + ap + ic + RES; let s = _ctlS.get(k);
  if (s) return s;
  const L = Math.ceil(r * 2 + 6);
  s = sello('c' + k, L, L, b => {
    const c = L / 2;
    const disco = (rr, cc, oy) => { for (let y = -rr; y <= rr; y++) { const w = Math.round(Math.sqrt(Math.max(0, rr * rr - y * y))); rect(b, c - w, c + y + oy, w * 2, 1, cc); } };
    disco(r, 'rgba(20,10,24,0.4)', 2);
    disco(r, TINTA, ap ? 1 : 0); disco(r - 1.5, ap ? mezcla(col, '#000000', 0.2) : col, ap ? 1 : 0);
    disco(r * 0.45, mezcla(col, '#ffffff', 0.3), ap ? 1 - r * 0.35 : -r * 0.35);
    disco(r - 1.5, col, ap ? 1 : 0);
    rect(b, c - r * 0.5, c - r * 0.62 + (ap ? 1 : 0), r * 0.5, 2, 'rgba(255,255,255,0.45)');
    const t = r > 17 ? 2 : 1; icono(b, ic, c - 3.5 * t, c - 3.5 * t + (ap ? 1 : 0), TINTA, t);
  });
  _ctlS.set(k, s);
  return s;
}
function dibujarControl(g, id, editor, sel) {
  const [x, y] = posCtl(id), r = radioCtl(id);
  g.globalAlpha = editor ? 1 : opacCtl(id);
  if (id === 'joy') {
    const j = CTL.joy, act = j.act && !editor, flot = OP.palanca === 'flotante', bx = act && flot ? j.bx : x, by = act && flot ? j.by : y;
    if (!act && flot && !editor) g.globalAlpha *= 0.5;
    const s = sello('joy' + r + RES, r * 2 + 4, r * 2 + 4, b => {
      const c = r + 2;
      for (let yy = -r; yy <= r; yy++) { const w = Math.round(Math.sqrt(Math.max(0, r * r - yy * yy))); rect(b, c - w, c + yy, w * 2, 1, 'rgba(244,234,216,0.22)'); rect(b, c - w, c + yy, 1, 1, CREMA); rect(b, c + w - 1, c + yy, 1, 1, CREMA); }
      rect(b, c - 1, c - r + 3, 2, 3, CREMA); rect(b, c - 1, c + r - 6, 2, 3, CREMA); rect(b, c - r + 3, c - 1, 3, 2, CREMA); rect(b, c + r - 6, c - 1, 3, 2, CREMA);
    });
    g.drawImage(s, bx - r - 2, by - r - 2, r * 2 + 4, r * 2 + 4);
    const kx = bx + (act ? j.vx : 0) * r * 0.6, ky = by + (act ? j.vy : 0) * r * 0.6, rk = Math.round(r * 0.45);
    const sk = sello('joyk' + rk + RES, rk * 2 + 4, rk * 2 + 6, b => {
      const c = rk + 2;
      for (let yy = -rk; yy <= rk; yy++) { const w = Math.round(Math.sqrt(Math.max(0, rk * rk - yy * yy))); rect(b, c - w, c + yy + 2, w * 2, 1, 'rgba(20,10,24,0.35)'); }
      for (let yy = -rk; yy <= rk; yy++) { const w = Math.round(Math.sqrt(Math.max(0, rk * rk - yy * yy))); rect(b, c - w, c + yy, w * 2, 1, TINTA); }
      for (let yy = -rk + 1; yy <= rk - 1; yy++) { const w = Math.round(Math.sqrt(Math.max(0, (rk - 1) * (rk - 1) - yy * yy))); rect(b, c - w, c + yy, w * 2, 1, yy < -rk * 0.3 ? '#fff8ec' : CREMA); }
    });
    g.drawImage(sk, kx - rk - 2, ky - rk - 2, rk * 2 + 4, rk * 2 + 6);
  } else {
    const ap = CTL.bot[id] && !editor;
    let ic = 'flecha', col = '#f0c84a';
    if (id === 'B') { const h = editor ? null : hablable(); ic = h && h.id === 'tablilla' ? 'mano' : 'charla'; col = '#3ac0b8'; }
    else if (!editor && ESCENA === 'juego' && !J.suelo && !J.pared) { ic = 'pluma'; col = J.estam >= 1 ? '#f0c84a' : '#c8b8a0'; }
    const s = selloCtl(id, r, ap ? 1 : 0, ic, col);
    g.drawImage(s, x - s.width / RES / 2, y - s.height / RES / 2, s.width / RES, s.height / RES);
  }
  g.globalAlpha = 1;
  if (editor && sel) { g.strokeStyle = '#ffffff'; g.lineWidth = 1; g.setLineDash([3, 2]); g.strokeRect(Math.round(x - r - 4) + 0.5, Math.round(y - r - 4) + 0.5, Math.round(r * 2 + 8), Math.round(r * 2 + 8)); g.setLineDash([]); }
}
function dibujarControles(g) {
  if (!TACTIL || (PANEL && PANEL.tipo === 'controles')) return;
  if (DLG || CINE) return;
  dibujarControl(g, 'joy'); dibujarControl(g, 'A');
  if (botonB()) dibujarControl(g, 'B');
}

// ---------- HUD ----------
function proyectar(x, y, z) { const p = M4.proyectar(R.VP, x, y, z); return p ? [p[0] * W, p[1] * H, p[2]] : null; }
function hud(g) {
  // los siete colores arriba a la izquierda
  for (let i = 0; i < 7; i++) {
    const x = 6 + i * 11, y = 6, tiene = G.colores[i];
    const s = sello('gota' + i + (tiene ? 1 : 0) + RES, 10, 12, b => {
      const f = ['..XXXX..', '.XXXXXX.', 'XXXXXXXX', 'XXXXXXXX', 'XXXXXXXX', '.XXXXXX.', '..XXXX..'];
      const borde = ['...XX...', '..XXXX..', '.X....X.', 'X......X', 'X......X', 'X......X', 'X......X', 'X......X', '.X....X.', '..XXXX..'];
      borde.forEach((fila, j) => { for (let k = 0; k < 8; k++) if (fila[k] === 'X') rect(b, k + 1, j + 1, 1, 1, TINTA); });
      for (let j = 2; j < 9; j++) { const w = j < 3 ? 2 : j < 4 ? 4 : 6; rect(b, 5 - w / 2, j + 1, w, 1, tiene ? COLORES[i] : 'rgba(40,24,48,0.45)'); }
      if (tiene) { rect(b, 3, 5, 1, 2, '#ffffff'); }
    });
    g.drawImage(s, x, y, 10, 12);
  }
  // plumas
  const np = Object.keys(G.plumas).length;
  icono(g, 'pluma', 6, 21, '#f4ead8'); txt(g, np + '/10', 15, 21, { c: '#f4ead8', b: TINTA, f: 'px' });
  // pausa
  const ps = 20;
  boton(g, W - ps - 4, 4, ps, ps, null, () => abrirPanel('pausa'), { ic: 'pausa' });
  // objetivo (se muestra un rato al cambiar)
  const ob = objetivoActual();
  if (ob !== OBJT.ultimo) { OBJT.ultimo = ob; OBJT.t = 0; }
  OBJT.t += DT;
  if (OBJT.t < 7) {
    const s = tr(ob), wmax = W - 40, lin = partir(g, s, wmax - 14), w = Math.min(wmax, Math.max(...lin.map(l => anchoTxt(g, l))) + 18), hh = lin.length * 10 + 3;
    const k = Math.min(1, OBJT.t / 0.3, (7 - OBJT.t) / 0.4), x = Math.round(lerp(-w, 4, suave(k))), y = 33;
    rect(g, x, y, w, hh, TINTA); rect(g, x + 1, y + 1, w - 2, hh - 2, CREMA);
    rect(g, x + 3, y + 3, 3, 7, '#e04a3a'); rect(g, x + 3, y + 3, 1, 9, MARRON);
    lin.forEach((l, i) => txt(g, l, x + 10, y + 3 + i * 10, { c: TINTA, b: null, max: w - 13 }));
  }
  // plumas sobre Killa al trepar, planear o aletear
  if (J.pared || !J.suelo || J.estam < J.estamMax) {
    const p = proyectar(J.x, J.y + 1.9, J.z);
    if (p) {
      const n = J.estamMax, w = n * 6;
      for (let i = 0; i < n; i++) {
        const lleno = J.estam >= i + 1 ? 1 : J.estam > i ? J.estam - i : 0;
        icono(g, 'pluma', p[0] - w / 2 + i * 6, p[1] - 8, lleno >= 1 ? '#f0c84a' : lleno > 0 ? '#f4ead8' : 'rgba(42,24,48,0.6)');
      }
    }
  }
  // "!" sobre quien tiene algo para decir
  const h = hablable();
  for (const e of ENT) {
    if (!e.vis || !e.nombre || e.manada || e.escondido) continue;
    const d = Math.hypot(e.x - J.x, e.z - J.z);
    if (d > 16) continue;
    const nuevo = tieneNovedad(e);
    if (!nuevo && e !== h) continue;
    const p = proyectar(e.x, e.y + (e.cuad ? 1.6 : 1.85) + Math.sin(T * 4) * 0.05, e.z);
    if (!p) continue;
    rect(g, p[0] - 4, p[1] - 10, 9, 10, TINTA); rect(g, p[0] - 3, p[1] - 9, 7, 8, nuevo ? '#f0c84a' : CREMA);
    if (nuevo) { rect(g, p[0], p[1] - 8, 1, 4, TINTA); rect(g, p[0], p[1] - 3, 1, 1, TINTA); } else { rect(g, p[0] - 2, p[1] - 6, 1, 1, TINTA); rect(g, p[0], p[1] - 6, 1, 1, TINTA); rect(g, p[0] + 2, p[1] - 6, 1, 1, TINTA); }
  }
  // burbujas
  for (const b of BURBUJAS) {
    b.t += DT;
    const e = b.e, p = e ? proyectar(e.x, e.y + 2.1 + b.t * 0.4, e.z) : proyectar(J.x, J.y + 1.9 + b.t * 0.4, J.z);
    if (!p || b.t > 1.4) continue;
    const s = tr(b.k), w = anchoTxt(g, s) + 8;
    g.globalAlpha = Math.min(1, (1.4 - b.t) * 3);
    rect(g, p[0] - w / 2, p[1] - 12, w, 11, TINTA); rect(g, p[0] - w / 2 + 1, p[1] - 11, w - 2, 9, '#ffffff');
    txt(g, s, p[0], p[1] - 10, { al: 0.5, c: TINTA, b: null });
    g.globalAlpha = 1;
  }
  BURBUJAS = BURBUJAS.filter(b => b.t < 1.4);
  // aviso del momento (tutorial)
  if (BAN) {
    BAN.t += DT;
    const k = Math.min(1, BAN.t / 0.25, (BAN.dur - BAN.t) / 0.3);
    if (BAN.t > BAN.dur) BAN = null;
    else {
      g.globalAlpha = clamp(k, 0, 1);
      const w = Math.min(W - 20, 190), lineas = partir(g, tr(BAN.k), w - 16), hh = lineas.length * 11 + 10, x = (W - w) / 2, y = H * 0.56;
      rect(g, x, y, w, hh, TINTA); rect(g, x + 1, y + 1, w - 2, hh - 2, '#3a2448');
      lineas.forEach((l, i) => txt(g, l, W / 2, y + 6 + i * 11, { al: 0.5, c: '#f4ead8', b: null, max: w - 12 }));
      g.globalAlpha = 1;
    }
  }
  // cartelito (pluma, ovillo, color)
  if (TOAST) {
    TOAST.t += DT;
    if (TOAST.t > 3) TOAST = null;
    else {
      const k = Math.min(1, TOAST.t / 0.25, (3 - TOAST.t) / 0.3), s = tr(TOAST.k, TOAST.a, TOAST.b), w = Math.min(W - 16, anchoTxt(g, s) + 20), y = Math.round(lerp(-16, 52, suave(k)));
      rect(g, W / 2 - w / 2, y, w, 14, TINTA); rect(g, W / 2 - w / 2 + 1, y + 1, w - 2, 12, '#f0c84a');
      txt(g, s, W / 2, y + 4, { al: 0.5, c: TINTA, b: null, max: w - 8 });
    }
  }
}
function tieneNovedad(e) {
  const f = G.flags;
  switch (e.id) {
    case 'arriero': return !G.colores[0] && (!f.rojoIni || Object.keys(G.ovillos).length >= 3);
    case 'flor': return !G.colores[1] && !f.naranjaIni;
    case 'tomas': return !G.colores[2] && (!f.amarilloIni || Object.keys(G.chicos).length >= 3);
    case 'fermin': return !f.verde && !f.verdeIni;
    case 'coquena': return !G.colores[4] && !f.turquesaIni;
    case 'tito': return !G.colores[5] && !f.violetaIni;
    case 'abuela': return !G.flags.ini;
    case 'pujllay': return !G.colores[6] && nColores() >= 6 && !ACT;
  }
  return false;
}

// ---------- diálogo ----------
function dibujarDialogo(g) {
  const D = DLG, [quien, k] = D.lineas[D.i], s = tr(k, D.arg);
  D.t += DT;
  const voz = quien === 'killa' ? 1.25 : (entDe(quien) || {}).voz || 1;
  const antes = Math.floor(D.letras);
  D.letras = Math.min(s.length, D.letras + DT * 42);
  if (Math.floor(D.letras) > antes && s[Math.floor(D.letras) - 1] !== ' ') Sonido.letra(voz);
  const w = Math.min(W - 12, 300), x = Math.round((W - w) / 2), lineas = partir(g, s.slice(0, Math.max(1, Math.ceil(D.letras))), w - 16), todas = partir(g, s, w - 16);
  const hh = Math.max(3, todas.length) * 11 + 22, y = Math.round(H - hh - (W > H ? 8 : Math.max(10, H * 0.06)));
  rect(g, x - 1, y, w + 2, hh, TINTA); rect(g, x, y - 1, w, hh + 2, TINTA); rect(g, x + 1, y + 1, w - 2, hh - 2, CREMA);
  for (let i = 0; i < 7; i++) rect(g, x + 1 + i * (w - 2) / 7, y + 1, (w - 2) / 7 + 1, 2, COLORES[i]);
  // nombre
  const nom = quien === 'killa' ? tr('n_killa') : tr((entDe(quien) || {}).nombre || '');
  const nw = anchoTxt(g, nom) + 10;
  rect(g, x + 6, y - 7, nw, 11, TINTA); rect(g, x + 7, y - 6, nw - 2, 9, quien === 'killa' ? '#d23a2c' : quien === 'pujllay' ? '#a060d0' : MARRON);
  txt(g, nom, x + 11, y - 5, { c: '#ffffff', b: null });
  lineas.forEach((l, i) => txt(g, l, esRTL() ? x + w - 8 : x + 8, y + 10 + i * 11, { c: TINTA, b: null, max: w - 16, al: esRTL() ? 1 : 0 }));
  if (D.letras >= s.length && Math.sin(T * 8) > 0) { rect(g, x + w - 10, y + hh - 8, 5, 1, TINTA); rect(g, x + w - 9, y + hh - 7, 3, 1, TINTA); rect(g, x + w - 8, y + hh - 6, 1, 1, TINTA); }
  zona(0, 0, W, H, () => avanzarDialogo());
}

// ---------- telón ----------
const TELON = { fase: 0, t: 0, alMedio: null };
function irA(esc, alMedio) {
  if (TELON.fase) return;
  const f = () => { ESCENA = esc; soltarTodo(); if (alMedio) alMedio(); };
  if (PRUEBA && !PARAM.has('telon')) { f(); return; }
  TELON.fase = 1; TELON.t = 0; TELON.alMedio = f; Sonido.telon();
}
function dibujarTelon(g) {
  if (!TELON.fase) return;
  // franjas de aguayo que se cierran desde los costados
  const k = suave(TELON.t), n = 7, hF = H / n;
  for (let i = 0; i < n; i++) {
    const w = W * k * (0.9 + 0.2 * Math.sin(i * 1.7)), lado = i % 2;
    const x = lado ? W - w : 0;
    rect(g, x, i * hF, w + 1, hF + 1, COLORES[i]);
    rect(g, x, i * hF, w + 1, 2, mezcla(COLORES[i], '#ffffff', 0.3));
    rect(g, lado ? x : x + w - 3, i * hF, 3, hF + 1, TINTA);
  }
  if (k > 0.98) { g.fillStyle = TINTA; g.fillRect(0, 0, W, H); }
}

// ---------- paneles ----------
function abrirPanel(tipo, d) { PANEL = Object.assign({ tipo, t: 0 }, d || {}); soltarTodo(); }
function cerrarPanel() { const v = PANEL && PANEL.volver; PANEL = null; if (v) abrirPanel(v); }
function dibujarPanel(g) {
  const P = PANEL; P.t += DT;
  ({ pausa: panelPausa, opciones: panelOpciones, idioma: panelIdioma, controles: panelControles, confirmar: panelConfirmar })[P.tipo](g, P);
}
function panelPausa(g, P) {
  fondoOscuro(g);
  const w = Math.min(W - 30, 180), bh = 20, gap = 6, h = 46 + 4 * (bh + gap), x = (W - w) / 2, y = Math.max(8, (H - h) / 2);
  marco(g, x, y, w, h, tr('pausa'));
  txt(g, fmtT(G.tiempo || 0) + '   ' + nColores() + '/7', W / 2, y + 22, { al: 0.5, c: MARRON, b: null, f: 'px' });
  const bs = [[tr('seguir'), () => cerrarPanel(), { c: '#6ab85a', ic: 'play' }], [tr('opciones'), () => abrirPanel('opciones', { volver: 'pausa' }), { ic: 'engranaje' }],
    [tr('controles'), () => abrirPanel('controles', { volver: 'pausa' }), { ic: 'mando' }], [tr('menu'), () => { PANEL = null; guardar(); irA('titulo', () => { Sonido.musica(0); }); }, { ic: 'casa', c: '#f0b8a0' }]];
  bs.forEach((b, i) => boton(g, x + 12, y + 34 + i * (bh + gap), w - 24, bh, b[0], b[1], b[2]));
}
function panelOpciones(g, P) {
  fondoOscuro(g);
  const w = Math.min(W - 16, 240), fila = 21, h = 30 + fila * 5 + 64 + 28, x = (W - w) / 2, y = Math.max(6, (H - h) / 2);
  marco(g, x, y, w, h, tr('opciones'));
  const x1 = x + 10, x2 = x + w * 0.5, ww = w * 0.5 - 12;
  const et = (k, i) => txt(g, tr(k), x1, y + 24 + i * fila, { c: TINTA, b: null, max: w * 0.46 });
  et('musica', 0); deslizador(g, x2, y + 23, ww, OP.musica, v => { OP.musica = v; Sonido.volumen(OP.musica, OP.sonido); guardarOp(); });
  et('sonido', 1); deslizador(g, x2, y + 23 + fila, ww, OP.sonido, v => { OP.sonido = v; Sonido.volumen(OP.musica, OP.sonido); guardarOp(); });
  et('camaraVel', 2); deslizador(g, x2, y + 23 + fila * 2, ww, (OP.sens - 0.4) / 1.6, v => { OP.sens = 0.4 + v * 1.6; guardarOp(); });
  et('invertir', 3); interruptor(g, x2, y + 22 + fila * 3, OP.invertir, () => { OP.invertir = !OP.invertir; guardarOp(); });
  et('vibrar', 4); interruptor(g, x2, y + 22 + fila * 4, OP.vibrar, () => { OP.vibrar = !OP.vibrar; VIBRAR = OP.vibrar; guardarOp(); vibrar(30); });
  // calidad: una fila entera de cuatro botones
  const yc = y + 22 + fila * 5;
  txt(g, tr('calidad'), x1, yc, { c: TINTA, b: null, max: w - 20 });
  const cs = ['auto', 'baja', 'media', 'alta'], cw = (w - 20 + 3) / 4;
  cs.forEach((c, i) => boton(g, x1 + i * cw, yc + 10, cw - 3, 15, tr('cal_' + c), () => { OP.calidad = c; aplicarCalidad(); guardarOp(); }, { c: OP.calidad === c ? '#f0c84a' : CREMA }));
  // idioma: también fila entera
  const yi = yc + 32;
  boton(g, x1, yi, w - 20, 17, nombreIdioma(), () => abrirPanel('idioma', { volver: 'opciones', volver2: P.volver }), { ic: 'globo' });
  boton(g, W / 2 - 40, y + h - 25, 80, 18, tr('volver'), () => { const v = P.volver; PANEL = null; if (v) abrirPanel(v); }, { c: '#6ab85a' });
}
function nombreIdioma() { const l = IDIOMAS.find(x => x[0] === IDIOMA); return l ? l[1] : IDIOMA; }
function cambiarIdioma(cod) { IDIOMA = cod; Guardado.escribir('idioma', cod); document.documentElement.lang = cod; document.documentElement.dir = esRTL() ? 'rtl' : 'ltr'; }
function panelIdioma(g, P) {
  fondoOscuro(g);
  const cols = 2, filas = Math.ceil(IDIOMAS.length / cols), bh = 16, gap = 4, w = Math.min(W - 16, 260), h = 30 + filas * (bh + gap) + 6, x = (W - w) / 2, y = Math.max(6, (H - h) / 2);
  marco(g, x, y, w, h, tr('idioma'));
  const cw = (w - 20 - gap) / 2;
  IDIOMAS.forEach(([cod, nom], i) => {
    const c = i % cols, f = Math.floor(i / cols);
    boton(g, x + 10 + c * (cw + gap), y + 22 + f * (bh + gap), cw, bh, null, () => { cambiarIdioma(cod); const v = P.volver, v2 = P.volver2; PANEL = null; if (v) abrirPanel(v, { volver: v2 }); }, { c: cod === IDIOMA ? '#f0c84a' : CREMA });
    const viejo = IDIOMA; IDIOMA = cod; const chico = esPx(mayus(nom), 'px') && anchoTxt(g, nom) > cw - 6;
    txt(g, nom, x + 10 + c * (cw + gap) + cw / 2, y + 22 + f * (bh + gap) + (chico ? 5 : 4), { al: 0.5, c: TINTA, b: null, max: cw - 6, f: chico ? 'mini' : 'px' }); IDIOMA = viejo;
  });
}
function panelConfirmar(g, P) {
  fondoOscuro(g);
  const w = Math.min(W - 30, 200), lineas = partir(g, tr(P.k), w - 20), h = 40 + lineas.length * 11 + 10, x = (W - w) / 2, y = (H - h) / 2;
  marco(g, x, y, w, h, null);
  lineas.forEach((l, i) => txt(g, l, W / 2, y + 14 + i * 11, { al: 0.5, c: TINTA, b: null, max: w - 16 }));
  boton(g, x + 10, y + h - 26, (w - 26) / 2, 18, tr('no'), () => { PANEL = null; }, {});
  boton(g, x + 16 + (w - 26) / 2, y + h - 26, (w - 26) / 2, 18, tr('si'), () => { PANEL = null; P.si(); }, { c: '#e04a3a', tc: '#ffffff' });
}
// editor de controles: mover, tamaño, opacidad, palanca fija o flotante, zurdo, restablecer
function panelControles(g, P) {
  g.fillStyle = 'rgba(20,10,28,0.35)'; g.fillRect(0, 0, W, H);
  P.sel = P.sel || 'A';
  for (const id of ['joy', 'A', 'B']) dibujarControl(g, id, true, P.sel === id);
  const w = Math.min(W - 16, 230), ls = partir(g, tr('arrastrar'), w - 16), h = 124 + ls.length * 11, x = (W - w) / 2, y = W > H ? 6 : Math.round(H * 0.14);
  marco(g, x, y, w, h, tr('controles'));
  ls.forEach((l, i) => txt(g, l, W / 2, y + 20 + i * 11, { al: 0.5, c: MARRON, b: null, max: w - 12 }));
  const y0 = y + 20 + ls.length * 11, x2 = x + w * 0.42, ww = w * 0.58 - 10;
  txt(g, tr('tamano'), x + 8, y0 + 4, { c: TINTA, b: null, max: w * 0.4 });
  deslizador(g, x2, y0 + 3, ww, ((OP.tam[P.sel] || 1) - 0.6) / 0.9, v => { OP.tam[P.sel] = 0.6 + v * 0.9; guardarOp(); });
  txt(g, tr('opacidad'), x + 8, y0 + 20, { c: TINTA, b: null, max: w * 0.4 });
  deslizador(g, x2, y0 + 19, ww, ((OP.opac[P.sel] != null ? OP.opac[P.sel] : 0.85) - 0.25) / 0.75, v => { OP.opac[P.sel] = 0.25 + v * 0.75; guardarOp(); });
  const bw = (w - 21) / 2;
  boton(g, x + 8, y0 + 34, w - 16, 16, tr(OP.palanca === 'fija' ? 'palancaFija' : 'palancaFlot'), () => { OP.palanca = OP.palanca === 'fija' ? 'flotante' : 'fija'; guardarOp(); });
  boton(g, x + 8, y0 + 54, bw, 16, tr('zurdo'), () => { OP.zurdo = !OP.zurdo; OP.pos = { v: {}, h: {} }; guardarOp(); }, { c: OP.zurdo ? '#f0c84a' : CREMA });
  boton(g, x + 13 + bw, y0 + 54, bw, 16, tr('restablecer'), () => { OP.pos = { v: {}, h: {} }; OP.tam = {}; OP.opac = {}; OP.palanca = 'flotante'; OP.zurdo = false; guardarOp(); });
  boton(g, W / 2 - 40, y + h - 26, 80, 18, tr('listo'), () => { const v = P.volver; PANEL = null; if (v) abrirPanel(v); }, { c: '#6ab85a' });
}

// ---------- título ----------
function letrasTitulo(g, y, t) {
  // en una línea si entra grande; si no, SIETE arriba y COLORES abajo
  const una = anchoPx('SIETE COLORES', 'px', 4) <= W - 12;
  const filas = una ? ['SIETE COLORES'] : ['SIETE', 'COLORES'];
  let tt = 4; while (tt > 2 && filas.some(f => anchoPx(f, 'px', tt) > W - 12)) tt--;
  let k = 0;
  filas.forEach((s, fi) => {
    const w = anchoPx(s, 'px', tt); let cx = Math.round(W / 2 - w / 2);
    const yy0 = y + fi * (9 * tt + 2);
    for (const ch of s) {
      if (ch === ' ') { cx += (FUENTES.px.espacio + 1) * tt; continue; }
      const i = k % 7, col = G && G.colores[i] ? COLORES[i] : mezcla(COLORES[i], '#9a9098', 0.75);
      const yy = yy0 + Math.round(Math.sin(t * 3 + k * 0.6) * 1.5);
      dibujarPx(g, ch, cx, yy + tt, 'px', tt, TINTA, TINTA);
      dibujarPx(g, ch, cx, yy, 'px', tt, col, TINTA);
      cx += (FUENTES.px.g[ch].w + 1) * tt; k++;
    }
  });
  return filas.length * (9 * tt + 2);
}
function escenaTitulo(g) {
  const yT = Math.round(H * (W > H ? 0.12 : 0.17));
  const ht = letrasTitulo(g, yT, T);
  parrafo(g, tr('subtitulo'), W / 2, yT + ht + 6, W - 24, { al: 0.5, c: '#fff4e0', b: TINTA });
  const bw = Math.min(W - 60, 150), bh = 22, x = (W - bw) / 2;
  let y = Math.round(H * (W > H ? 0.48 : 0.6));
  const hay = HAY_PARTIDA && G;
  if (hay) { boton(g, x, y, bw, bh, G.fin ? tr('seguirExplorando') : tr('continuar'), () => continuarPartida(), { c: '#6ab85a', ic: 'play' }); y += bh + 7; }
  boton(g, x, y, bw, bh, hay ? tr('nueva') : tr('jugar'), () => { if (hay) abrirPanel('confirmar', { k: 'seguroNueva', si: nuevaPartida }); else nuevaPartida(); }, { c: hay ? CREMA : '#6ab85a', ic: hay ? null : 'play' }); y += bh + 7;
  boton(g, x, y, bw, bh - 4, tr('opciones'), () => abrirPanel('opciones'), { ic: 'engranaje' }); y += bh + 3;
  boton(g, x, y, bw, bh - 4, tr('controles'), () => abrirPanel('controles'), { ic: 'mando' });
  boton(g, W - 24, 4, 20, 20, null, () => abrirPanel('idioma'), { ic: 'globo' });
  txt(g, 'JXSTUDIOS', W / 2, H - 12, { al: 0.5, c: '#fff4e0', b: TINTA, f: 'mini' });
}
// pantalla de idioma después de la intro (en cada arranque)
function escenaIdioma(g) {
  g.fillStyle = 'rgba(20,10,28,0.45)'; g.fillRect(0, 0, W, H);
  const yT = Math.round(H * 0.06);
  const ht = letrasTitulo(g, yT, T);
  const cods = IDIOMAS.map(l => l[0]), per = 1.6, i = Math.floor(T / per) % cods.length, k = (T % per) / per, a = Math.max(0, Math.min(1, k / 0.15, (1 - k) / 0.15));
  const yP = yT + ht + 6, viejo = IDIOMA;
  IDIOMA = cods[i]; g.globalAlpha = a; txt(g, ELEGI_IDIOMA[cods[i]], W / 2, yP, { al: 0.5, c: '#fff0d0', b: TINTA, max: W - 10 }); g.globalAlpha = 1; IDIOMA = viejo;
  const port = H > W * 1.2, cols = port ? 2 : 3, filas = Math.ceil(IDIOMAS.length / cols), gap = 4;
  const y0 = yP + 18, bh = Math.max(14, Math.min(20, Math.floor((H - y0 - 10 - gap * (filas - 1)) / filas))), bw = Math.floor(Math.min(port ? 100 : 110, (W - 16 - gap * (cols - 1)) / cols));
  const x0 = Math.round(W / 2 - (cols * bw + (cols - 1) * gap) / 2), resto = IDIOMAS.length % cols;
  IDIOMAS.forEach(([cod, nom], j) => {
    const f = Math.floor(j / cols), ultima = resto && f === filas - 1, sel = cod === IDIOMA;
    const bx = x0 + (j % cols) * (bw + gap) + (ultima ? Math.round((cols - resto) * (bw + gap) / 2) : 0), by = y0 + f * (bh + gap);
    boton(g, bx, by, bw, bh, null, () => elegirIdioma(cod), { c: sel ? '#f0c84a' : CREMA, sel });
    const v = IDIOMA; IDIOMA = cod;
    const chico = esPx(mayus(nom), 'px') && anchoTxt(g, nom) > bw - 6;
    txt(g, nom, bx + bw / 2, by + Math.round((bh - (chico ? 5 : 7)) / 2), { al: 0.5, c: TINTA, b: null, max: bw - 6, f: chico ? 'mini' : 'px' });
    IDIOMA = v;
  });
}
// créditos al final
function dibujarFinal(g, C) {
  const t = C.t;
  if (t > 9) {
    const k = clamp((t - 9) / 1.2, 0, 1);
    g.globalAlpha = k;
    const ht = letrasTitulo(g, Math.round(H * 0.16), T);
    let yy = Math.round(H * 0.16) + ht + 8;
    for (const l of ['fin_1', 'fin_2']) yy += parrafo(g, tr(l), W / 2, yy, W - 20, { al: 0.5, c: '#fff4e0', b: TINTA }) + 4;
    if (t > 13) txt(g, 'JXSTUDIOS', W / 2, H * 0.8, { al: 0.5, t: 2, c: '#f0c84a', b: TINTA });
    g.globalAlpha = 1;
  }
  if (t > 15) zona(0, 0, W, H, () => { if (CINE && CINE.tipo === 'final') terminarFinal(); });
  if (t > 15 && Math.sin(T * 4) > 0) txt(g, tr('tocar'), W / 2, H - 20, { al: 0.5, c: '#ffffff', b: TINTA, f: 'mini' });
}
