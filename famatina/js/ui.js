// FAMATINA — interfaz: HUD, botones flotantes, paneles, título, telón y tutorial (modo inmediato con zonas)
let ZONAS = [], ZONAS_PREV = [];
let PANEL = null, CONF = null;
const FLOT = [], BANNERS = [];
const HUD = { cash: 0, pulso: 0, combo: 0, tCombo: 0 };
let ZURDO = false;
const ORO7 = ['#fff6c0', '#ffe58a', '#f8cf55', '#f0b83a', '#e09a2a', '#c87a1e', '#a85e16'];
const CREMA = '#f0e0c8', VERDE = '#8af08a', ROJO = '#ff7a6a';
const PAL_BOT = {
  oro: { base: '#e8b030', luz: '#fff0a0', som: '#a06a10', txt: '#2a1406', bor: null },
  piedra: { base: '#6a6474', luz: '#9a94a4', som: '#3e3a46', txt: '#ffffff', bor: '#1a1020' },
  verde: { base: '#3a9a4a', luz: '#8ae08a', som: '#1e5a2a', txt: '#ffffff', bor: '#0e2a14' },
  rojo: { base: '#b83a2a', luz: '#f08a6a', som: '#6a1a14', txt: '#ffffff', bor: '#2a0a08' },
  azul: { base: '#3a6ab8', luz: '#8ab8f0', som: '#1e3a6a', txt: '#ffffff', bor: '#0a1a3a' },
  des: { base: '#4a4450', luz: '#5e5866', som: '#2e2a34', txt: '#9a94a4', bor: '#1a1020' },
};
const RX = (x, w) => (ZURDO ? W - x - (w || 0) : x);
function zona(x, y, w, h, fn, op) { ZONAS.push({ x, y, w, h, fn, op: op || {} }); }
function zonaEn(lista, x, y) { for (let i = lista.length - 1; i >= 0; i--) { const z = lista[i]; if (x >= z.x && x < z.x + z.w && y >= z.y && y < z.y + z.h) return z; } return null; }
function apretado(x, y, w, h) {
  for (const p of E.punteros.values()) if (!p.arr && p.x >= x && p.x < x + w && p.y >= y && p.y < y + h && p.x0 >= x - 4 && p.x0 < x + w + 4 && p.y0 >= y - 4 && p.y0 < y + h + 4) return true;
  return false;
}
function MC() { return ESCENA === 'carrera' && CARRERA ? CARRERA.mina : MA; }

// ---------- piezas ----------
function boton(g, x, y, w, h, eti, fn, op) {
  op = op || {};
  x = Math.round(x); y = Math.round(y);
  const P = PAL_BOT[op.des ? 'des' : (op.estilo || 'oro')], ap = !!fn && !op.des && apretado(x, y, w, h), oy = ap ? 1 : 0;
  if (!ap) { g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(x + 1, y + h, w - 1, 1); }
  rect(g, x, y + oy, w, h, P.bor || '#2a1406');
  rect(g, x + 1, y + 1 + oy, w - 2, h - 2, P.base);
  rect(g, x + 1, y + 1 + oy, w - 2, 1, P.luz); rect(g, x + 1, y + 1 + oy, 1, h - 3, P.luz);
  rect(g, x + 1, y + h - 2 + oy, w - 2, 1, P.som); rect(g, x + w - 2, y + 2 + oy, 1, h - 3, P.som);
  if (op.brillo && !op.des) { const k = (T * 0.7) % 1.6; if (k < 1) { g.globalAlpha = 0.4; rect(g, x + 2 + Math.round(k * (w - 6)), y + 2 + oy, 2, h - 4, '#ffffff'); g.globalAlpha = 1; } }
  if (op.sel) { rect(g, x - 1, y - 1 + oy, w + 2, 1, '#ffffff'); rect(g, x - 1, y + h + oy, w + 2, 1, '#ffffff'); rect(g, x - 1, y + oy, 1, h, '#ffffff'); rect(g, x + w, y + oy, 1, h, '#ffffff'); }
  if (op.dibujar) op.dibujar(g, x, y + oy, w, h, P);
  else {
    const t = op.t || 1, ic = op.icono, iw = ic ? tamIcono(ic)[0] + (eti ? 3 : 0) : 0, maxT = w - 6 - iw;
    const tw = eti ? Math.min(anchoTxt(g, eti, { t }), maxT) : 0;
    let cx = x + Math.round((w - iw - tw) / 2);
    if (ic) { icono(g, ic, cx, y + oy + Math.round((h - tamIcono(ic)[1]) / 2)); cx += iw; }
    if (eti) txt(g, eti, cx, y + oy + Math.round((h - 7 * t) / 2), { t, c: P.txt, b: P.bor, max: maxT });
  }
  if (fn) zona(x, y, w, h, op.des ? (op.alDes || (() => Sonido.error())) : () => { if (!op.mudo) Sonido.boton(); fn(); }, op);
  return ap;
}
function botonRedondo(g, cx, cy, r, ic, fn, op) {
  op = op || {};
  const ap = !!fn && apretado(cx - r, cy - r, r * 2, r * 2), oy = ap ? 1 : 0;
  g.globalAlpha = op.op != null ? op.op : 1;
  disco(g, cx, cy + 2, r, 'rgba(0,0,0,0.4)');
  disco(g, cx, cy + oy, r, '#140a06'); disco(g, cx, cy + oy, r - 1, op.anillo || '#c87a3a'); disco(g, cx, cy + oy, r - 2, '#4a2a18'); disco(g, cx, cy - 1 + oy, r - 3, '#6e4428');
  const t = r >= 18 ? 2 : 1, [iw, ih] = tamIcono(ic);
  icono(g, ic, cx - Math.floor(iw * t / 2), cy - Math.floor(ih * t / 2) + oy, t);
  if (op.badge) { const b = String(op.badge === true ? '' : op.badge), bx = cx + r - 4, by = cy - r + 1; disco(g, bx, by, 3, '#140a06'); disco(g, bx, by, 2, '#e8443a'); if (b && b.length < 3) txt(g, b, bx, by - 2, { f: 'mini', al: 0.5, c: '#ffffff', b: null }); }
  g.globalAlpha = 1;
  if (fn) zona(cx - r, cy - r, r * 2, r * 2, () => { Sonido.boton(); fn(); }, op);
}
function botonCerrar(g, x, y, fn) {
  const ap = apretado(x - 2, y - 2, 14, 14), oy = ap ? 1 : 0;
  disco(g, x + 5, y + 5 + oy, 5, '#140a06'); disco(g, x + 5, y + 5 + oy, 4, '#c83a2a'); disco(g, x + 5, y + 4 + oy, 3, '#e85a4a');
  lin(g, x + 3, y + 3 + oy, x + 7, y + 7 + oy, '#ffffff'); lin(g, x + 7, y + 3 + oy, x + 3, y + 7 + oy, '#ffffff');
  zona(x - 2, y - 2, 14, 14, () => { Sonido.boton(); fn(); });
}
function marco(g, x, y, w, h, titulo, op) {
  x = Math.round(x); y = Math.round(y);
  zona(x, y, w, h, () => { });
  g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(x + 2, y + 3, w, h);
  rect(g, x - 1, y - 1, w + 2, h + 2, '#120804');
  rect(g, x, y, w, h, '#3b2416');
  for (let yy = y + 5; yy < y + h - 2; yy += 6) rect(g, x + 2, yy, w - 4, 1, '#331e12');
  for (let k = 0; k < w * h / 260; k++) rect(g, x + 3 + ((k * 53) % (w - 8)), y + 3 + ((k * 31) % (h - 6)), 3, 1, '#48301e');
  rect(g, x, y, w, 2, '#d08440'); rect(g, x, y + h - 2, w, 2, '#6a3a1a'); rect(g, x, y, 2, h, '#b86e34'); rect(g, x + w - 2, y, 2, h, '#6a3a1a');
  for (const [rx, ry] of [[x + 3, y + 3], [x + w - 5, y + 3], [x + 3, y + h - 5], [x + w - 5, y + h - 5]]) { rect(g, rx, ry, 2, 2, '#f0b070'); px(g, rx + 1, ry + 1, '#6a3a1a'); }
  if (titulo) { rect(g, x + 2, y + 2, w - 4, 15, '#24140a'); rect(g, x + 2, y + 17, w - 4, 1, '#d08440'); txt(g, titulo, x + w / 2, y + 6, { al: 0.5, c: ORO7, b: '#120804', max: w - 34 }); }
  if (op && op.cerrar) botonCerrar(g, x + w - 15, y + 4, op.cerrar);
}
function fondoModal(g, fn) { g.fillStyle = 'rgba(12,6,16,0.62)'; g.fillRect(0, 0, W, H); zona(0, 0, W, H, fn || (() => { })); }
function pastilla(g, s, cx, y, col) { const w = anchoTxt(g, s, { f: 'mini' }); g.fillStyle = 'rgba(10,6,4,0.62)'; g.fillRect(Math.round(cx - w / 2 - 2), y - 1, Math.round(w + 4), 7); txt(g, s, cx, y, { f: 'mini', al: 0.5, c: col || '#ffffff', b: null }); }
function barra(g, x, y, w, h, f, col) { rect(g, x, y, w, h, '#120804'); rect(g, x + 1, y + 1, w - 2, h - 2, '#2a1a10'); rect(g, x + 1, y + 1, Math.round((w - 2) * clamp(f, 0, 1)), h - 2, col || '#f0b83a'); rect(g, x + 1, y + 1, Math.round((w - 2) * clamp(f, 0, 1)), 1, '#ffffff40'); }
function deslizador(g, x, y, w, v, fn) {
  rect(g, x, y + 3, w, 3, '#120804'); rect(g, x + 1, y + 4, w - 2, 1, '#6a4a30'); rect(g, x + 1, y + 4, Math.round((w - 2) * v), 1, '#f0b83a');
  const kx = Math.round(x + (w - 1) * v);
  rect(g, kx - 2, y, 5, 9, '#140a06'); rect(g, kx - 1, y + 1, 3, 7, '#f0c050'); px(g, kx - 1, y + 1, '#fff0a0');
  zona(x - 4, y - 3, w + 8, 15, () => { }, { drag: (px0) => fn(clamp((px0 - x) / (w - 1), 0, 1)) });
}
function monedaChica(g, x, y) { rect(g, x - 1, y - 2, 3, 5, '#a06a10'); rect(g, x - 2, y - 1, 5, 3, '#a06a10'); rect(g, x - 1, y - 1, 3, 3, '#f4c542'); px(g, x - 1, y - 1, '#fff6c0'); }
function costo(g, v, x, y, al, col, t) {
  const s = fmt(v), w = anchoTxt(g, s, { t: t || 1 }) + 11, x0 = Math.round(x - w * (al || 0));
  icono(g, 'moneda', x0, y - 1); txt(g, s, x0 + 11, y, { t: t || 1, c: col || ORO7, b: col === '#2a1406' ? null : '#1a0e08' });
  return w;
}
function costoPep(g, n, x, y, al, col) {
  const s = String(n), w = anchoTxt(g, s) + 11, x0 = Math.round(x - w * (al || 0));
  icono(g, 'pepita', x0, y); txt(g, s, x0 + 11, y, { c: col || '#fff0a0', b: col === '#2a1406' ? null : '#1a0e08' });
  return w;
}

// ---------- efectos de pantalla ----------
function flotar(x, y, s, col, t) { FLOT.push({ k: 't', x, y, s, c: col || '#ffffff', vida: 1.3, max: 1.3, t: t || 1 }); }
function monedasA(x, y, n) { for (let i = 0; i < Math.min(n, 8); i++) FLOT.push({ k: 'm', x0: x + rnd(-4, 4), y0: y + rnd(-4, 4), x1: 8, y1: 8, cx: x + rnd(-30, 30), cy: y - rnd(20, 60), t: -i * 0.06, dur: 0.6 + rnd(0, 0.2) }); }
function banner(s, sub, col) { BANNERS.length = 0; BANNERS.push({ s, sub, c: col || ORO7, t: 0, dur: 1.8 }); }
function pasoFlot(dt) {
  for (let i = FLOT.length - 1; i >= 0; i--) {
    const f = FLOT[i];
    if (f.k === 't') { f.vida -= dt; f.y -= dt * 16; if (f.vida <= 0) FLOT.splice(i, 1); }
    else { f.t += dt; if (f.t >= f.dur) { FLOT.splice(i, 1); HUD.pulso = 0.12; Sonido.moneda(2); } }
  }
  for (let i = BANNERS.length - 1; i >= 0; i--) { BANNERS[i].t += dt; if (BANNERS[i].t > BANNERS[i].dur) BANNERS.splice(i, 1); }
  if (HUD.pulso > 0) HUD.pulso -= dt;
  if (HUD.tCombo > 0) { HUD.tCombo -= dt; if (HUD.tCombo <= 0) HUD.combo = 0; }
}
function dibujarFlot(g) {
  for (const f of FLOT) {
    if (f.k === 't') { const a = clamp(f.vida / f.max * 2, 0, 1); g.globalAlpha = a; txt(g, f.s, f.x, Math.round(f.y), { al: 0.5, c: f.c, t: f.t, f: f.t === 0 ? 'mini' : 'px' }); g.globalAlpha = 1; }
    else if (f.t > 0) { const k = suave(f.t / f.dur), a = 1 - k, x = a * a * f.x0 + 2 * a * k * f.cx + k * k * f.x1, y = a * a * f.y0 + 2 * a * k * f.cy + k * k * f.y1; monedaChica(g, Math.round(x), Math.round(y)); }
  }
  for (const b of BANNERS) {
    const k = clamp(b.t / 0.35, 0, 1), sal = clamp((b.dur - b.t) / 0.3, 0, 1), es = rebote(k);
    g.globalAlpha = sal;
    const y = Math.round(H * 0.3 - (1 - es) * 30), t = anchoTxt(g, b.s, { t: 3 }) < W - 12 ? 3 : 2;
    g.fillStyle = 'rgba(10,6,4,0.5)'; g.fillRect(0, y - 6, W, 7 * t + 12 + (b.sub ? 12 : 0));
    txt(g, b.s, W / 2, y, { t, al: 0.5, c: b.c, b: '#120804', s: '#000000', max: W - 8 });
    if (b.sub) txt(g, b.sub, W / 2, y + 7 * t + 4, { al: 0.5, c: CREMA, max: W - 8 });
    g.globalAlpha = 1;
  }
}

// ---------- HUD ----------
function hudSuperior(g, m) {
  g.fillStyle = 'rgba(18,10,6,0.74)'; g.fillRect(0, 0, W, 20);
  rect(g, 0, 20, W, 1, '#c87a3a'); g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, 21, W, 1);
  const c = m.d.cash;
  HUD.cash = c < HUD.cash ? c : HUD.cash + (c - HUD.cash) * Math.min(1, 0.18 + 0 * c);
  if (Math.abs(HUD.cash - c) < Math.max(1, c * 1e-4)) HUD.cash = c;
  icono(g, 'moneda', 3, 4);
  txt(g, fmt(HUD.cash), 15, HUD.pulso > 0 ? 2 : 3, { c: ORO7, b: '#120804' });
  txt(g, '+' + fmt(m.tasa) + '/S', 15, 12, { f: 'mini', c: '#9af0a0', b: null });
  if (ESCENA === 'carrera') return;
  const ps = fmt(G.pepitas), pw = anchoTxt(g, ps);
  icono(g, 'pepita', W - 26 - pw - 11, 5);
  txt(g, ps, W - 26 - pw, 6, { c: '#fff0a0', b: '#120804' });
  if (ofrendaActiva()) { const x = Math.round(W * 0.42); icono(g, 'rayo', x, 5); txt(g, fmtT(G.ofrenda.hasta - G.reloj), x + 9, 7, { f: 'mini', c: '#ffe08a', b: null }); }
  botonRedondo(g, W - 11, 10, 9, 'engranaje', () => abrirPanel('opciones'));
}
const BOTONES = ['minas', 'capataces', 'ofrenda', 'vitrina', 'logros', 'ir'];
function posDefecto(id) {
  if (id === 'ir') return { x: W - 16, y: H - 52 };
  const k = BOTONES.indexOf(id), esp = Math.min(42, (W - 30) / 4.6);
  return { x: W / 2 + (k - 2) * esp, y: H - 18 };
}
function posBoton(id) {
  const ori = W > H ? 'h' : 'v', c = OP.botones[ori] && OP.botones[ori][id];
  const p = c ? { x: c.x * W, y: c.y * H } : posDefecto(id);
  if (ZURDO && !c) p.x = W - p.x;
  const r = Math.round(12 * (OP.tam[id] || 1) * (id === 'ir' ? 0.8 : 1));
  return { x: Math.round(clamp(p.x, r + 1, W - r - 1)), y: Math.round(clamp(p.y, r + 23, H - r - 1)), r, op: OP.opac[id] != null ? OP.opac[id] : 1 };
}
function badgeDe(id) {
  if (id === 'logros') { const n = LOGROS.filter(l => G.logros[l.id] === 1).length; return n || 0; }
  if (id === 'ofrenda') return G.ofrenda.libre <= G.reloj ? true : 0;
  if (id === 'vitrina') return G.nuevoMineral ? true : 0;
  if (id === 'capataces') { const n = MA.capataces().filter(([, , c]) => c.cd <= G.reloj).length; return n || 0; }
  if (id === 'minas') return MA.puedeRefundar() || minaNuevaSinVisitar() ? true : 0;
  return 0;
}
function accionBoton(id) {
  if (id === 'ir') { CAM.obj = CAM.y > Y0 ? 0 : camMax(MA); return; }
  abrirPanel(id);
}
function botonesFlotantes(g) {
  for (const id of BOTONES) {
    const p = posBoton(id), ic = id === 'ir' ? (CAM.y > Y0 ? 'subir' : 'bajar') : id === 'capataces' ? 'casco' : id === 'logros' ? 'trofeo' : id === 'vitrina' ? 'gema' : id;
    botonRedondo(g, p.x, p.y, p.r, ic, () => { vibrar(8); accionBoton(id); }, { op: p.op, badge: id === 'ir' ? 0 : badgeDe(id) });
  }
}

// ---------- la mina: etiquetas y botones sobre el mundo ----------
function botonNivelMundo(g, x, y, w, h, L, puede, cuello, fn, ic) {
  x = Math.round(x); y = Math.round(y);
  const ap = apretado(x, y, w, h), oy = ap ? 1 : 0;
  const base = puede ? '#3a8a3a' : '#3a3440', luz = puede ? '#8ae07a' : '#5e5868', som = puede ? '#1e4a1e' : '#1e1a24';
  g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(x + 1, y + h, w - 1, 1);
  rect(g, x, y + oy, w, h, '#0e0a08'); rect(g, x + 1, y + 1 + oy, w - 2, h - 2, base); rect(g, x + 1, y + 1 + oy, w - 2, 1, luz); rect(g, x + 1, y + h - 2 + oy, w - 2, 1, som);
  if (ic) icono(g, ic, x + 2, y + Math.round((h - tamIcono(ic)[1]) / 2) + oy);
  const ax = x + w - 7, ay = y + 2 + oy, ca = puede ? '#fff4a0' : '#a8a0b0';
  px(g, ax + 2, ay, ca); rect(g, ax + 1, ay + 1, 3, 1, ca); rect(g, ax, ay + 2, 5, 1, ca); rect(g, ax + 1, ay + 3, 3, 4, ca);
  txt(g, String(L), ax - 2, y + 3 + oy, { f: 'mini', al: 1, c: '#ffffff', b: '#0e0a08' });
  if (puede && (T * 1.3) % 2 < 0.25) { g.globalAlpha = 0.5; rect(g, x + 1, y + 1 + oy, w - 2, h - 2, '#ffffff'); g.globalAlpha = 1; }
  if (cuello) { rect(g, x - 2, y - 3, 6, 7, '#140a06'); rect(g, x - 1, y - 2, 4, 5, '#e8443a'); px(g, x + 1, y - 1, '#ffffff'); px(g, x + 1, y, '#ffffff'); px(g, x + 1, y + 2, '#ffffff'); }
  zona(x - 2, y - 2, w + 4, h + 4, () => { Sonido.boton(); fn(); });
}
function uiMundo(g, m) {
  const cam = CAM.y, d = m.d, n = d.niveles.length, P = sup(), mult = m.multValor(), cu = m.cuello();
  // pozo: tocar para que suba la jaula
  zona(RX(POZO.x - 1, POZO.w + 2), Math.max(22, SUELO - 56 - cam), POZO.w + 2, Y0 + n * NH - (SUELO - 56), () => { if (!d.asc.cap && m.tocarAsc()) { Sonido.jaula(); vibrar(6); } }, { scroll: 1 });
  for (let i = Math.max(0, Math.floor((cam - Y0) / NH)); i <= n; i++) {
    const y = Y0 + i * NH - cam;
    if (y > H) break;
    if (i === n) {
      if (n < ECO.NIVELES) {
        const c = m.costoAbrir(n), puede = d.cash >= c, bw = Math.min(124, W - 70), bx = RX(Math.round((EST.x + 6 + W) / 2 - bw / 2), bw);
        boton(g, bx, y + 9, bw, 25, null, () => abrirNivelNuevo(m), {
          des: !puede, brillo: puede, alDes: () => { Sonido.error(); flotar(bx + bw / 2, y + 4, tr('faltan', fmt(c - d.cash)), ROJO); },
          dibujar: (g2, x, yy, w, h, Pb) => { txt(g2, tr('nuevoNivel'), x + w / 2, yy + 4, { al: 0.5, c: Pb.txt, b: Pb.bor, max: w - 8 }); costo(g2, c, x + w / 2, yy + 14, 0.5, puede ? '#2a1406' : '#c8c0d0', 1); },
        });
      } else { pastilla(g, tr('fondo'), W / 2, y + 18, '#ffe08a'); }
      break;
    }
    if (y < -NH) continue;
    const nv = d.niveles[i];
    zona(RX(xMinA() - 6, W - xMinA() + 4), y + TUN.arriba, W - xMinA() + 4, TUN.abajo - TUN.arriba, () => { if (!nv.cap && m.tocarNivel(i)) { vibrar(5); Sonido.pico(0.6); } }, { scroll: 1 });
    zona(RX(EST.x + 17, 15), y + 12, 15, 27, () => abrirPanel('capataz', { sec: 'nivel', i }), { scroll: 1 });
    rect(g, RX(EST.x + 1, 9), y, 9, 7, '#140a06'); rect(g, RX(EST.x + 2, 7), y + 1, 7, 5, '#5a3a22');
    txt(g, String(i + 1), RX(EST.x + 5.5, 0), y + 1, { f: 'mini', al: 0.5, c: '#ffe08a', b: null });
    botonNivelMundo(g, RX(EST.x + 1, 35), y + 8, 35, 11, nv.L, m.maxN('nivel', i) > 0, cu === 'nivel' && i === n - 1, () => abrirMejora('nivel', i), 'pico');
    if (nv.caja > 0.5) pastilla(g, fmt(nv.caja * mult), RX(EST.x + 9, 0), y + 22, '#ffe8b0');
    const ve = m.ev.veta;
    if (ve && ve.i === i) zona(RX(xVeta() - 12, W - xVeta() + 12), y + TUN.arriba, W - xVeta() + 12, TUN.abajo - TUN.arriba, () => tocarVeta(m, y));
    const ge = m.ev.geoda;
    if (ge && ge.i === i) { const gx = lerp(xMinA(), xMinB(), ge.u); zona(RX(gx - 8, 16), y + 8, 16, 16, () => tocarGeoda(m, RX(gx, 0), y + 16)); }
  }
  if (cam < Y0 + 10) {
    const ys = -cam;
    if (cam < 40 && ESCENA !== 'titulo') { const s = m.def.nom; pastilla(g, s, W / 2, 25, '#ffe08a'); }
    zona(RX(P.tolva - 2, P.cb - P.tolva + 10), SUELO - 30 + ys, P.cb - P.tolva + 10, 32, () => { if (!d.sup.cap && m.tocarSup()) { Sonido.jaula(); vibrar(5); } }, { scroll: 1 });
    zona(RX(P.casa + 5, 14), SUELO - 18 + ys, 14, 18, () => abrirPanel('capataz', { sec: 'asc', i: 0 }), { scroll: 1 });
    zona(RX(P.tolva + 15, 14), SUELO - 18 + ys, 14, 18, () => abrirPanel('capataz', { sec: 'sup', i: 0 }), { scroll: 1 });
    botonNivelMundo(g, RX(28, 35), SUELO - 46 + ys, 35, 11, d.asc.L, m.maxN('asc', 0) > 0, cu === 'asc', () => abrirMejora('asc', 0), 'jaula');
    botonNivelMundo(g, RX(P.tolva + 14, 35), SUELO - 56 + ys, 35, 11, d.sup.L, m.maxN('sup', 0) > 0, cu === 'sup', () => abrirMejora('sup', 0), 'carro');
    if (d.tolva > 0.5) pastilla(g, fmt(d.tolva * mult), RX(P.tolva + 10, 0), SUELO - 36 + ys, '#ffe8b0');
    if (!m.carrera) { const S = superficieEstatica(m.def); zona(RX(S.apacheta.x - 8, 16), S.apacheta.y - 8 + ys, 16, 14, () => abrirPanel('ofrenda'), { scroll: 1 }); }
  }
  const pc = posCondor(m);
  if (pc) {
    if (pc.y - cam > 18) zona(RX(pc.x - 14, 28), pc.y - cam - 9, 28, 18, () => tocarCondor(m, RX(pc.x, 0), pc.y - cam));
    else if (pc.x > 0 && pc.x < W) { const x = RX(pc.x, 0); botonRedondo(g, Math.round(clamp(x, 14, W - 14)), 34, 9, 'subir', () => { CAM.obj = 0; }, { anillo: '#ffd84a' }); }
  }
}

// ---------- acciones con su jugo ----------
function abrirMejora(sec, i) {
  abrirPanel('mejora', { sec, i });
  if (sec === 'nivel') { const y = Y0 + i * NH; if (y - CAM.y > H - 200 || y - CAM.y < 24) CAM.obj = clamp(y - 60, 0, camMax(MC())); }
  else if (CAM.y > 40) CAM.obj = 0;
}
function comprarSel(m, sec, i) {
  const n = cantidadCompra(m, sec, i);
  if (n < 1 || !m.comprar(sec, i, n)) { Sonido.error(); return false; }
  HUD.combo++; HUD.tCombo = 1.4;
  Sonido.mejora(HUD.combo); vibrar(6);
  const yb = H - 34;
  for (let k = 0; k < 5; k++) FLOT.push({ k: 't', x: W / 2 + rnd(-50, 50), y: yb + rnd(-6, 6), s: '+', c: '#fff4a0', vida: 0.5, max: 0.5, t: 1 });
  return true;
}
function cantidadCompra(m, sec, i) {
  const s = OP.sel, mx = m.maxN(sec, i);
  if (s === 'max') return Math.max(1, mx);
  return s;
}
function abrirNivelNuevo(m) {
  if (!m.abrir()) { Sonido.error(); return; }
  const i = m.d.niveles.length - 1, y = Y0 + i * NH + 22;
  explosionEn((xMinA() + xVeta()) / 2, y, m.def.roca[Math.min(4, Math.floor(i / 5))][2]);
  Sonido.nivelNuevo(); sacudir(3, 0.45); vibrar([30, 40, 60]); LENTA.t = 0.3;
  banner(tr('nivelBanner', i + 1), null);
  CAM.obj = clamp(y - H * 0.45, 0, camMax(m) + NH);
  revisarLogros();
}
function tocarCondor(m, x, y) {
  const p = m.tocarCondor();
  if (!p) return;
  Sonido.condor(); vibrar(20);
  for (let k = 0; k < 18; k++) part({ x: RX(x, 0), y: y + CAM.y, vx: rnd(-60, 60), vy: rnd(-70, 20), g: 90, vida: rnd(0.4, 0.9), c: k % 2 ? '#ffe080' : '#ffffff', em: 1 });
  aplicarPremio(m, p, x, y);
  if (!m.carrera) G.est.condores++;
}
function aplicarPremio(m, p, x, y) {
  if (p.tipo === 'cash') { flotar(x, y - 6, '+' + fmt(p.v), '#ffe08a'); monedasA(x, y, 6); }
  else if (p.tipo === 'pepitas') { G.pepitas += p.n; flotar(x, y - 6, '+' + p.n + ' ' + tr('pepitas'), '#fff0a0'); Sonido.gema(); }
  else if (p.tipo === 'boost') {
    if (m.carrera) m.boostHasta = Math.max(m.boostHasta || 0, m.ahora()) + p.seg; else G.ofrenda.hasta = Math.max(G.ofrenda.hasta, G.reloj) + p.seg;
    flotar(x, y - 6, tr('boost') + ' ' + fmtT(p.seg), '#9af0a0'); Sonido.hito();
  } else if (p.tipo === 'mineral') hallazgoMineral(m, p.j);
}
function tocarVeta(m, y) {
  const v = m.tocarVeta();
  if (!v) return;
  const x = RX(xVeta() + 2, 0);
  Sonido.veta(m.ev.veta ? m.ev.veta.toques : 15); vibrar(5);
  chispas(xVeta() + 2, y + CAM.y + 20, '#ffe080', 7);
  flotar(x + rnd(-14, 4), y + 12, '+' + fmt(v), '#ffe08a'); monedasA(x, y + 20, 2);
}
function tocarGeoda(m, x, y) {
  const p = m.golpearGeoda();
  if (!p) return;
  Sonido.geoda(); vibrar(10); sacudir(1, 0.1);
  polvo(RX(x, 0), y + CAM.y, 4, '#c8b8c8');
  if (p.tipo !== 'golpe') { G.est.geodas++; chispas(RX(x, 0), y + CAM.y, m.def.menas[2][1], 12); aplicarPremio(m, p, x, y); }
}
function hallazgoMineral(m, j) {
  G.nuevoMineral = 1;
  const def = m.def.minerales[j];
  banner(tr('encontraste', def.n), null, ORO7);
  Sonido.gema(); vibrar([20, 30, 20]);
  revisarLogros();
}

// ---------- paneles ----------
function abrirPanel(tipo, datos) { PANEL = Object.assign({ tipo, t: 0, pag: 0 }, datos || {}); if (tipo === 'vitrina') { G.nuevoMineral = 0; PANEL.k = MA.k; } }
function cerrarPanel() { PANEL = null; }
function confirmar(s, si) { CONF = { s, si, t: 0 }; }
function anchoPanel(max) { return Math.min(W - 8, max || 212); }
function entra(P, h) { return Math.round((1 - rebote(clamp(P.t / 0.25, 0, 1))) * 24); }

function titSec(sec, i) { return sec === 'nivel' ? tr('nivel', i + 1) : sec === 'asc' ? tr('ascensor') : tr('transporte'); }
function panelMejora(g, P) {
  const m = MC(), sec = P.sec, i = P.i || 0, o = m.nivelDe(sec, i), L = o.L, mult = m.multValor();
  const w = Math.min(W - 4, 232), h = 166, x = Math.round((W - w) / 2), y = Math.round(H - h * suave(clamp(P.t / 0.2, 0, 1)) - 2);
  zona(0, 0, W, H, cerrarPanel);
  marco(g, x, y, w, h, titSec(sec, i), { cerrar: cerrarPanel });
  icono(g, sec === 'nivel' ? 'pico' : sec === 'asc' ? 'jaula' : 'carro', x + 6, y + 5);
  const n = cantidadCompra(m, sec, i), L2 = L + n;
  txt(g, 'NV ' + L, x + 7, y + 22, { c: '#ffffff' });
  txt(g, '→ ' + L2, x + 7 + anchoTxt(g, 'NV ' + L) + 4, y + 22, { c: VERDE });
  const pc = (a, b) => Math.round(a / b * 100) + '%';
  let filas;
  if (sec === 'nivel') filas = [
    [tr('mineros'), minerosDe(L), minerosDe(L2)],
    [tr('produccion'), fmt(m.prodNivel(i, L) * mult) + '/S', fmt(m.prodNivel(i, L2) * mult) + '/S'],
    [tr('carga'), fmt(m.prodNivel(i, L) * m.cicloMin(L) / minerosDe(L) * mult), fmt(m.prodNivel(i, L2) * m.cicloMin(L2) / minerosDe(L2) * mult)],
    [tr('velocidad'), pc(m.velMin(L), m.velMin(1)), pc(m.velMin(L2), m.velMin(1))]];
  else if (sec === 'asc') filas = [
    [tr('capacidad'), fmt(m.capAsc(L) * mult), fmt(m.capAsc(L2) * mult)],
    [tr('velocidad'), pc(m.velAsc(L), m.velAsc(1)), pc(m.velAsc(L2), m.velAsc(1))],
    [tr('transporte'), fmt(m.tAsc(null, L) * mult) + '/S', fmt(m.tAsc(null, L2) * mult) + '/S']];
  else filas = [
    [tr('cantidad'), carrosDe(L), carrosDe(L2)],
    [tr('capacidad'), fmt(m.capSup(L) * mult), fmt(m.capSup(L2) * mult)],
    [tr('velocidad'), pc(m.velSup(L), m.velSup(1)), pc(m.velSup(L2), m.velSup(1))],
    [tr('venta'), fmt(m.tSup(L) * mult) + '/S', fmt(m.tSup(L2) * mult) + '/S']];
  let yy = y + 34;
  for (const [et, a, b] of filas) {
    txt(g, et, x + 7, yy, { c: CREMA, max: w * 0.42 });
    txt(g, String(a), x + w - 52, yy, { al: 1, c: '#ffffff' });
    txt(g, '→', x + w - 49, yy, { c: '#a89070' });
    txt(g, String(b), x + w - 6, yy, { al: 1, c: String(b) !== String(a) ? VERDE : '#ffffff' });
    yy += 10;
  }
  const ph = proximoHito(L), prev = L < 10 ? 0 : L < 25 ? 10 : L < 50 ? 25 : ph - 50;
  const premioH = sec === 'nivel' && minerosDe(ph) > minerosDe(L) ? tr('masMinero') : sec === 'sup' && carrosDe(ph) > carrosDe(L) ? tr('masCarro') : sec === 'asc' ? tr('masVel') : '';
  const yh = y + 34 + 4 * 10 + 1;
  txt(g, tr('hito', ph) + ': ×2' + (premioH ? ' ' + premioH : ''), x + 7, yh, { f: 'mini', c: '#ffe08a', b: null, max: w - 14 });
  barra(g, x + 7, yh + 7, w - 14, 5, (L - prev) / (ph - prev), '#f0b83a');
  if (m.cuello() === sec) { const s = '! ' + tr('cuello'); txt(g, s, x + w - 7, y + 22, { al: 1, c: ROJO, f: 'mini', b: null, max: w * 0.5 }); }
  const sels = [1, 10, 50, 'max'], bw = Math.floor((w - 14 - 9) / 4);
  sels.forEach((s, k) => boton(g, x + 7 + k * (bw + 3), y + h - 50, bw, 13, s === 'max' ? tr('max') : '×' + s, () => { OP.sel = s; guardarOp(); }, { estilo: OP.sel === s ? 'azul' : 'piedra', sel: OP.sel === s }));
  const c = m.costo(sec, i, n), puede = c <= m.d.cash;
  boton(g, x + 7, y + h - 33, w - 14, 26, null, () => comprarSel(m, sec, i), {
    des: !puede, rep: 1, mudo: 1, brillo: puede,
    alDes: () => { Sonido.error(); flotar(W / 2, y + h - 40, tr('faltan', fmt(c - m.d.cash)), ROJO); },
    dibujar: (g2, bx, by, bw2, bh, Pb) => { txt(g2, tr('mejorar') + (n > 1 ? ' ×' + n : ''), bx + bw2 / 2, by + 4, { al: 0.5, c: Pb.txt, b: Pb.bor, max: bw2 - 8 }); costo(g2, c, bx + bw2 / 2, by + 15, 0.5, puede ? '#2a1406' : ROJO); },
  });
}
function nombreHab(c) { return c.h === 'vel' ? tr('habVel', RAREZA[c.r].x) : c.h === 'carga' ? tr('habCarga', RAREZA[c.r].x) : tr('habRebaja', Math.round(RAREZA[c.r].reb * 100)); }
const COL_RAR = ['#e0a060', '#8ac0ff', '#ffd84a'];
function panelCapataz(g, P) {
  const m = MC(), sec = P.sec, i = P.i || 0, o = m.nivelDe(sec, i), w = anchoPanel(204), h = 150, x = Math.round((W - w) / 2), y = Math.round(H / 2 - h / 2) + entra(P);
  fondoModal(g, cerrarPanel);
  marco(g, x, y, w, h, tr('capataz') + ' · ' + titSec(sec, i), { cerrar: cerrarPanel });
  const cap = o.cap;
  if (!cap) {
    icono(g, 'casco', x + w / 2 - 11, y + 26, 2);
    parrafo(g, tr('trabajaSolo'), x + w / 2, y + 50, w - 20, { al: 0.5, c: CREMA });
    const c = m.costoCapataz(sec, i), puede = m.d.cash >= c;
    boton(g, x + 14, y + h - 40, w - 28, 28, null, () => { const k = m.contratar(sec, i); if (k) { if (!m.carrera) { G.est.capataces++; if (k.r === 2) G.est.epicos = (G.est.epicos || 0) + 1; } Sonido.hito(); vibrar(20); for (let q = 0; q < 20; q++) part({ x: EST.x + 24, y: Y0 + i * NH + 20, vx: rnd(-50, 50), vy: rnd(-60, -10), g: 80, vida: 1, c: ['#ffd84a', '#ff6a8a', '#6ae0ff'][q % 3], t: 'confeti' }); revisarLogros(); } }, {
      des: !puede, brillo: puede, alDes: () => { Sonido.error(); flotar(W / 2, y + h - 46, tr('faltan', fmt(c - m.d.cash)), ROJO); },
      dibujar: (g2, bx, by, bw, bh, Pb) => { txt(g2, tr('contratar'), bx + bw / 2, by + 4, { al: 0.5, c: Pb.txt, b: Pb.bor, max: bw - 8 }); costo(g2, c, bx + bw / 2, by + 16, 0.5, puede ? '#2a1406' : ROJO); },
    });
    return;
  }
  const rt = retrato(cap.s, cap.r);
  rect(g, x + 9, y + 23, 52, 52, COL_RAR[cap.r]); rect(g, x + 10, y + 24, 50, 50, '#120804');
  g.drawImage(rt, x + 11, y + 25, 48, 48);
  const nx = x + 68;
  txt(g, nombreCapataz(cap.s), nx, y + 25, { c: '#ffffff', max: w - 76 });
  for (let k = 0; k <= cap.r; k++) icono(g, 'estrella', nx + k * 10, y + 36);
  txt(g, tr(['comun', 'raro', 'epico'][cap.r]), nx + 32, y + 37, { c: COL_RAR[cap.r], max: w - 106 });
  txt(g, nombreHab(cap), nx, y + 50, { c: '#ffe08a', max: w - 76 });
  txt(g, tr('dura', fmtT(RAREZA[cap.r].dur), fmtT(RAREZA[cap.r].cd)), nx, y + 62, { f: 'mini', c: CREMA, b: null, max: w - 76 });
  const t = m.ahora(), act = cap.act > t, listo = cap.cd <= t;
  if (act) { boton(g, x + 10, y + 82, w - 20, 22, tr('activa', fmtT(cap.act - t)), () => { }, { estilo: 'oro', des: true }); barra(g, x + 10, y + 105, w - 20, 4, (cap.act - t) / RAREZA[cap.r].dur, '#ffd84a'); }
  else if (listo) boton(g, x + 10, y + 82, w - 20, 22, tr('usar'), () => { if (m.usarHabilidad(sec, i)) { if (!m.carrera) G.est.habilidades++; Sonido.hito(); vibrar(25); banner(nombreHab(cap), null, ORO7); revisarLogros(); } }, { estilo: 'verde', icono: 'rayo', brillo: 1 });
  else boton(g, x + 10, y + 82, w - 20, 22, tr('listaEn', fmtT(cap.cd - t)), () => { }, { des: true });
  if (!m.carrera) boton(g, x + 10, y + h - 30, w - 20, 20, null, () => {
    if (G.pepitas < 5) { Sonido.error(); flotar(W / 2, y + h - 36, tr('sinPepitas'), ROJO); return; }
    G.pepitas -= 5; const k = m.cambiarCapataz(sec, i); if (k.r === 2) G.est.epicos = (G.est.epicos || 0) + 1; Sonido.gema(); revisarLogros();
  }, { estilo: 'piedra', dibujar: (g2, bx, by, bw, bh, Pb) => { const s = tr('otro'), tw = Math.min(anchoTxt(g2, s), bw - 34); txt(g2, s, bx + (bw - tw - 24) / 2, by + 6, { c: Pb.txt, b: Pb.bor, max: bw - 34 }); costoPep(g2, 5, bx + (bw + tw - 4) / 2 + 2, by + 6, 0); } });
}
function panelCapataces(g, P) {
  const m = MA, w = anchoPanel(210), h = Math.min(H - 40, 218), x = Math.round((W - w) / 2), y = Math.round((H - h) / 2) + entra(P);
  fondoModal(g, cerrarPanel);
  marco(g, x, y, w, h, tr('capataces'), { cerrar: cerrarPanel });
  const l = m.capataces(), t = m.ahora(), porPag = Math.max(1, Math.floor((h - 62) / 24)), pags = Math.max(1, Math.ceil(l.length / porPag));
  P.pag = clamp(P.pag, 0, pags - 1);
  if (!l.length) { parrafo(g, tr('nada') + ' · ' + tr('trabajaSolo'), x + w / 2, y + 40, w - 24, { al: 0.5, c: CREMA }); return; }
  const listos = l.filter(([, , c]) => c.cd <= t);
  boton(g, x + 8, y + 22, w - 16, 16, tr('usarTodas'), () => { let k = 0; for (const [s, i] of listos) if (m.usarHabilidad(s, i)) { k++; G.est.habilidades++; } if (k) { Sonido.hito(); vibrar(25); revisarLogros(); } }, { estilo: 'verde', des: !listos.length, icono: 'rayo' });
  l.slice(P.pag * porPag, P.pag * porPag + porPag).forEach(([s, i, c], k) => {
    const yy = y + 42 + k * 24;
    rect(g, x + 6, yy, w - 12, 22, '#2a160c');
    rect(g, x + 7, yy + 3, 18, 18, COL_RAR[c.r]); g.drawImage(retrato(c.s, c.r), x + 8, yy + 4);
    txt(g, titSec(s, i), x + 29, yy + 3, { c: '#ffffff', max: w - 90 });
    txt(g, nombreHab(c), x + 29, yy + 13, { f: 'mini', c: COL_RAR[c.r], b: null, max: w - 90 });
    const act = c.act > t, listo = c.cd <= t;
    if (act) txt(g, fmtT(c.act - t), x + w - 10, yy + 8, { al: 1, c: '#ffd84a' });
    else if (listo) boton(g, x + w - 56, yy + 3, 48, 16, tr('usar'), () => { if (m.usarHabilidad(s, i)) { G.est.habilidades++; Sonido.hito(); revisarLogros(); } }, { estilo: 'verde' });
    else txt(g, fmtT(c.cd - t), x + w - 10, yy + 8, { al: 1, c: '#a89aa8', f: 'mini', b: null });
  });
  paginas(g, P, pags, x, y + h - 18, w);
}
function paginas(g, P, pags, x, y, w) {
  if (pags < 2) return;
  boton(g, x + 8, y, 22, 13, '<', () => { P.pag = (P.pag + pags - 1) % pags; }, { estilo: 'piedra' });
  boton(g, x + w - 30, y, 22, 13, '>', () => { P.pag = (P.pag + 1) % pags; }, { estilo: 'piedra' });
  txt(g, (P.pag + 1) + '/' + pags, x + w / 2, y + 3, { al: 0.5, c: CREMA });
}
// mapa de la Argentina
const ARG = [[-22.0, -65.7], [-22.1, -64.3], [-22.0, -62.8], [-23.4, -61.0], [-25.3, -57.6], [-27.3, -55.9], [-25.6, -54.6], [-26.2, -53.7], [-27.5, -54.2], [-29.0, -56.0], [-30.2, -57.6], [-32.5, -58.2], [-34.0, -58.4], [-34.6, -58.0], [-35.6, -57.2], [-36.3, -56.7], [-38.0, -57.5], [-38.9, -62.0], [-40.6, -62.3], [-41.1, -65.0], [-42.2, -63.7], [-43.3, -65.0], [-45.0, -65.6], [-46.0, -67.5], [-47.7, -65.8], [-50.0, -68.4], [-51.6, -69.0], [-52.4, -68.4], [-52.0, -69.6], [-51.5, -72.3], [-50.0, -73.4], [-48.5, -72.6], [-46.5, -71.7], [-44.0, -71.6], [-42.0, -71.8], [-40.0, -71.6], [-37.5, -71.2], [-35.0, -70.3], [-33.0, -70.0], [-31.0, -70.5], [-29.0, -69.8], [-27.0, -68.6], [-25.0, -68.5], [-23.5, -67.2], [-22.8, -67.0]];
const FUEGO = [[-52.6, -68.6], [-53.4, -67.6], [-54.6, -65.2], [-54.9, -66.5], [-54.9, -68.6]];
let _mapa = null;
function mapaArg(w, h) {
  const key = w + 'x' + h;
  if (_mapa && _mapa.key === key) return _mapa;
  const c = lienzo(w, h), g = c.getContext('2d'), sy = h / 34, sx = sy * 0.82, ox = -74.2, oy = -21.5;
  const P = p => [(p[1] - ox) * sx, (oy - p[0]) * sy];
  const relleno = (poly, col) => {
    const pts = poly.map(P);
    for (let y = 0; y < h; y++) {
      const xs = [];
      for (let k = 0; k < pts.length; k++) { const [x1, y1] = pts[k], [x2, y2] = pts[(k + 1) % pts.length]; if ((y1 <= y + 0.5 && y2 > y + 0.5) || (y2 <= y + 0.5 && y1 > y + 0.5)) xs.push(x1 + (y + 0.5 - y1) / (y2 - y1) * (x2 - x1)); }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) rect(g, Math.round(xs[k]), y, Math.round(xs[k + 1]) - Math.round(xs[k]), 1, col);
    }
  };
  relleno(ARG, '#c8a46a'); relleno(FUEGO, '#c8a46a');
  const img = g.getImageData(0, 0, w, h), d = img.data, out = new Uint8ClampedArray(d);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const k = (y * w + x) * 4; if (!d[k + 3]) continue; const borde = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => { const X = x + a, Y = y + b; return X < 0 || Y < 0 || X >= w || Y >= h || !d[(Y * w + X) * 4 + 3]; }); if (borde) { out[k] = 106; out[k + 1] = 70; out[k + 2] = 34; } else if (x < 8 + (y / h) * 6) { out[k] = 168; out[k + 1] = 128; out[k + 2] = 90; } }
  g.putImageData(new ImageData(out, w, h), 0, 0);
  _mapa = { key, cv: c, P };
  return _mapa;
}
function minaDesbloqueada(k) { return k === 0 || (G.minas[k - 1] && (G.minas[k - 1].maxN || 1) >= 10); }
function minaNuevaSinVisitar() { for (let k = 1; k < MINAS.length; k++) if (minaDesbloqueada(k) && !G.minas[k]) return true; return false; }
function panelMinas(g, P) {
  const w = anchoPanel(220), h = Math.min(H - 30, 250), x = Math.round((W - w) / 2), y = Math.round((H - h) / 2) + entra(P);
  fondoModal(g, cerrarPanel);
  marco(g, x, y, w, h, tr('minas'), { cerrar: cerrarPanel });
  const mh = h - 90, mw = Math.round(mh * 0.5), M = mapaArg(mw, mh), mx = x + 6, my = y + 22;
  rect(g, mx - 1, my - 1, mw + 2, mh + 2, '#1a2a44'); rect(g, mx, my, mw, mh, '#24406a');
  for (let k = 0; k < 20; k++) px(g, mx + (k * 13) % mw, my + (k * 29) % mh, '#3a5a8a');
  g.drawImage(M.cv, mx, my);
  const cw = w - mw - 18, cx = mx + mw + 6, chh = Math.floor((mh) / 5);
  MINAS.forEach((def, k) => {
    const [px0, py0] = M.P([def.lat, def.lon]), act = k === G.minaAct, abierta = minaDesbloqueada(k);
    const c = act ? '#ffd84a' : abierta ? '#ffffff' : '#6a6070';
    rect(g, mx + Math.round(px0) - 2, my + Math.round(py0) - 2, 5, 5, '#120804'); rect(g, mx + Math.round(px0) - 1, my + Math.round(py0) - 1, 3, 3, c);
    if (act && Math.sin(T * 6) > 0) { rect(g, mx + Math.round(px0) - 3, my + Math.round(py0) - 3, 7, 1, '#ffd84a'); rect(g, mx + Math.round(px0) - 3, my + Math.round(py0) + 3, 7, 1, '#ffd84a'); }
    const yy = my + k * chh;
    rect(g, cx, yy, cw, chh - 2, act ? '#4a2e16' : '#2a160c');
    if (act) { rect(g, cx, yy, 2, chh - 2, '#ffd84a'); }
    txt(g, def.nom, cx + 4, yy + 3, { c: abierta ? '#ffffff' : '#8a8090', max: cw - 8 });
    txt(g, def.prov, cx + 4, yy + 12, { f: 'mini', c: '#c8a46a', b: null, max: cw - 8 });
    if (!abierta) { icono(g, 'candado', cx + cw - 13, yy + 3); txt(g, tr('bloqueada', 10, MINAS[k - 1].nom), cx + 4, yy + 19, { f: 'mini', c: '#a89aa8', b: null, max: cw - 8 }); }
    else if (act) txt(g, tr('actual'), cx + 4, yy + 19, { f: 'mini', c: '#ffd84a', b: null, max: cw - 8 });
    else {
      const d = G.minas[k];
      txt(g, d ? '+' + fmt(MINA[k].ingresoTeo()) + '/S' : tr('minaNueva'), cx + 4, yy + 19, { f: 'mini', c: VERDE, b: null, max: cw - 40 });
      boton(g, cx + cw - 32, yy + 4, 28, 14, tr('ir'), () => viajarA(k), { estilo: 'verde', brillo: !d });
    }
  });
  const m = MA, yb = y + h - 64;
  rect(g, x + 6, yb, w - 12, 58, '#24140a');
  txt(g, tr('refundar') + ' ' + m.def.nom, x + 10, yb + 3, { c: '#ffe08a', max: w - 70 });
  txt(g, '×' + fmtMult(m.d.mult) + ' → ×' + fmtMult(m.d.mult * m.gananciaRefundar()), x + w - 10, yb + 3, { al: 1, c: VERDE });
  parrafo(g, tr('refundarTxt'), x + 10, yb + 13, w - 20, { f: 'mini', c: CREMA, b: null });
  const puede = m.puedeRefundar();
  boton(g, x + 10, yb + 37, w - 20, 17, puede ? tr('refundar') : tr('refundarReq', m.reqRefundar()), () => confirmar(tr('refundarTxt'), () => refundarMina(m)), { estilo: 'rojo', des: !puede, brillo: puede });
}
function fmtMult(v) { return v < 100 ? (Math.round(v * 100) / 100).toString() : fmt(v); }
function viajarA(k) {
  cerrarPanel();
  irA('mina', () => { cambiarMina(k); });
}
function refundarMina(m) {
  m.refundar(); G.est.refundaciones++;
  cerrarPanel(); CAM.y = 0; CAM.obj = null;
  banner(tr('refundada', fmtMult(m.d.mult)), null, ORO7);
  Sonido.hito(); sacudir(2, 0.3);
  revisarLogros(); guardar();
}
function panelVitrina(g, P) {
  const w = anchoPanel(214), h = Math.min(H - 30, 214), x = Math.round((W - w) / 2), y = Math.round((H - h) / 2) + entra(P);
  fondoModal(g, cerrarPanel);
  marco(g, x, y, w, h, tr('vitrina'), { cerrar: cerrarPanel });
  const disp = MINAS.map((d, k) => k).filter(k => G.minas[k]);
  if (!disp.includes(P.k)) P.k = disp[0];
  const def = MINAS[P.k], d = G.minas[P.k];
  boton(g, x + 8, y + 21, 18, 14, '<', () => { const i = disp.indexOf(P.k); P.k = disp[(i + disp.length - 1) % disp.length]; }, { estilo: 'piedra' });
  boton(g, x + w - 26, y + 21, 18, 14, '>', () => { const i = disp.indexOf(P.k); P.k = disp[(i + 1) % disp.length]; }, { estilo: 'piedra' });
  txt(g, def.nom, x + w / 2, y + 25, { al: 0.5, c: '#ffffff', max: w - 60 });
  const cw = Math.floor((w - 16) / 3), ch = Math.floor((h - 76) / 2);
  def.minerales.forEach((mn, j) => {
    const cx = x + 8 + (j % 3) * cw, cy = y + 40 + Math.floor(j / 3) * ch;
    rect(g, cx + 1, cy, cw - 2, ch - 2, '#140a06'); rect(g, cx + 2, cy + 1, cw - 4, ch - 4, '#3a1020');
    for (let k = 0; k < 6; k++) rect(g, cx + 2, cy + 1 + k * 2, cw - 4, 1, k % 2 ? '#40142a' : '#4a1832');
    const tiene = d.min[j], img = dibujoMineral(mn), t = cw >= 54 && ch >= 60 ? 2 : 1, iw = 24 * t, ix = cx + Math.round((cw - iw) / 2), iy = cy + 4;
    if (tiene) { g.drawImage(img, ix, iy, iw, iw); if (Math.sin(T * 2 + j * 1.7) > 0.8) { const sx = ix + ((j * 7 + Math.floor(T * 3)) % iw), sy = iy + ((j * 13 + Math.floor(T * 5)) % iw); rect(g, sx, sy - 1, 1, 3, '#ffffff'); rect(g, sx - 1, sy, 3, 1, '#ffffff'); } }
    else { g.globalAlpha = 0.25; g.drawImage(img, ix, iy, iw, iw); g.globalAlpha = 1; g.fillStyle = 'rgba(10,4,8,0.55)'; g.fillRect(ix, iy, iw, iw); txt(g, '?', ix + iw / 2, iy + iw / 2 - 4, { al: 0.5, c: '#8a7080' }); }
    txt(g, tiene ? mn.n : 'NV ' + (nivelMineral(j) + 1) + '+', cx + cw / 2, cy + ch - 10, { f: 'mini', al: 0.5, c: tiene ? '#ffe8f0' : '#8a7080', b: null, max: cw - 4 });
  });
  const e = d.min.reduce((a, b) => a + (b ? 1 : 0), 0), bono = (1 + 0.1 * e) * (e === 6 ? 2 : 1);
  parrafo(g, tr('vitrinaTxt'), x + w / 2, y + h - 34, w - 16, { f: 'mini', al: 0.5, c: CREMA, b: null });
  txt(g, e + '/6 · ×' + bono.toFixed(1), x + w / 2, y + h - 16, { al: 0.5, c: e === 6 ? '#ffd84a' : VERDE });
}
function panelLogros(g, P) {
  const w = anchoPanel(214), h = Math.min(H - 30, 232), x = Math.round((W - w) / 2), y = Math.round((H - h) / 2) + entra(P);
  fondoModal(g, cerrarPanel);
  marco(g, x, y, w, h, tr('logros'), { cerrar: cerrarPanel });
  txt(g, tr('logrosTxt') + ': ×' + (1 + 0.02 * logrosHechos()).toFixed(2), x + w / 2, y + 22, { f: 'mini', al: 0.5, c: VERDE, b: null, max: w - 16 });
  const porPag = Math.max(1, Math.floor((h - 52) / 22)), pags = Math.ceil(LOGROS.length / porPag);
  P.pag = clamp(P.pag, 0, pags - 1);
  LOGROS.slice(P.pag * porPag, P.pag * porPag + porPag).forEach((l, k) => {
    const yy = y + 31 + k * 22, st = G.logros[l.id] || 0, v = l.f(), f = clamp(v / l.a, 0, 1);
    rect(g, x + 6, yy, w - 12, 20, st ? '#3a2410' : '#2a160c');
    g.globalAlpha = st ? 1 : 0.4; icono(g, 'trofeo', x + 9, yy + 5); g.globalAlpha = 1;
    txt(g, textoLogro(l), x + 23, yy + 3, { c: st ? '#ffffff' : CREMA, max: w - 80, f: anchoTxt(g, textoLogro(l)) > w - 80 ? 'mini' : 'px' });
    if (st === 1) boton(g, x + w - 54, yy + 3, 46, 14, null, () => { G.logros[l.id] = 2; G.pepitas += l.p; Sonido.gema(); vibrar(15); flotar(x + w - 30, yy, '+' + l.p, '#fff0a0'); guardar(); }, { estilo: 'oro', brillo: 1, dibujar: (g2, bx, by, bw) => costoPep(g2, l.p, bx + bw / 2, by + 3, 0.5, '#2a1406') });
    else if (st === 2) txt(g, '★', x + w - 14, yy + 6, { c: '#ffd84a' });
    else { barra(g, x + 23, yy + 13, w - 92, 4, f); costoPep(g, l.p, x + w - 10, yy + 7, 1); }
  });
  paginas(g, P, pags, x, y + h - 17, w);
}
function panelOfrenda(g, P) {
  const w = anchoPanel(206), h = 190, x = Math.round((W - w) / 2), y = Math.round((H - h) / 2) + entra(P);
  fondoModal(g, cerrarPanel);
  marco(g, x, y, w, h, tr('ofrenda'), { cerrar: cerrarPanel });
  const ax = x + w / 2, ay = y + 50;
  for (let j = 0; j < 8; j++) { const ww = 26 - j * 3; for (let k = 0; k < ww; k++) rect(g, ax - Math.floor(ww / 2) + k, ay - j * 2, 1, 2, ((k + j) % 3 === 0) ? '#8a8a8a' : ((k * 3 + j) % 4 === 0 ? '#5a5a5e' : '#b8b4b0')); }
  for (let k = 0; k < 3; k++) { const hx = ax - 6 + k * 6 + Math.sin(T * 2 + k) * 2, hy = ay - 22 - k * 3 + Math.cos(T * 2 + k) * 2; rect(g, hx, hy, 3, 1, '#4ab86a'); px(g, hx + 1, hy - 1, '#2a8a44'); }
  if (ofrendaActiva()) txt(g, tr('boost') + ' · ' + tr('quedan', fmtT(G.ofrenda.hasta - G.reloj)), x + w / 2, y + 56, { al: 0.5, c: VERDE, max: w - 12 });
  const libre = G.ofrenda.libre <= G.reloj;
  boton(g, x + 10, y + 70, w - 20, 26, null, () => hacerOfrenda(1200, 0), { estilo: 'verde', des: !libre, brillo: libre, dibujar: (g2, bx, by, bw, bh, Pb) => { txt(g2, libre ? tr('gratis') : tr('listaEn', fmtT(G.ofrenda.libre - G.reloj)), bx + bw / 2, by + 4, { al: 0.5, c: Pb.txt, b: Pb.bor, max: bw - 8 }); txt(g2, tr('ofrendaTxt', fmtT(1200)), bx + bw / 2, by + 15, { f: 'mini', al: 0.5, c: Pb.txt, b: null, max: bw - 8 }); } });
  boton(g, x + 10, y + 102, w - 20, 26, null, () => hacerOfrenda(1800, 10), { estilo: 'oro', dibujar: (g2, bx, by, bw, bh, Pb) => { txt(g2, tr('ofrendaTxt', fmtT(1800)), bx + bw / 2, by + 4, { al: 0.5, c: Pb.txt, b: Pb.bor, max: bw - 8 }); costoPep(g2, 10, bx + bw / 2, by + 15, 0.5, '#2a1406'); } });
  const adel = MA.ingresoRef() * 7200;
  boton(g, x + 10, y + 134, w - 20, 26, null, () => { if (G.pepitas < 20) { Sonido.error(); flotar(W / 2, y + 130, tr('sinPepitas'), ROJO); return; } G.pepitas -= 20; MA.d.cash += adel; MA.d.total += adel; MA.d.hist += adel; G.est.ganado += adel; Sonido.hito(); monedasA(W / 2, y + 140, 8); flotar(W / 2, y + 130, '+' + fmt(adel), '#ffe08a'); revisarLogros(); }, { estilo: 'azul', dibujar: (g2, bx, by, bw, bh, Pb) => { txt(g2, tr('adelantar', '2H') + ' +' + fmt(adel), bx + bw / 2, by + 4, { al: 0.5, c: Pb.txt, b: Pb.bor, max: bw - 8 }); costoPep(g2, 20, bx + bw / 2, by + 15, 0.5); } });
  txt(g, tr('pepitas') + ': ' + G.pepitas, x + w / 2, y + h - 18, { al: 0.5, c: '#fff0a0', f: 'mini', b: null });
}
function hacerOfrenda(seg, pep) {
  if (pep) { if (G.pepitas < pep) { Sonido.error(); flotar(W / 2, H / 2, tr('sinPepitas'), ROJO); return; } G.pepitas -= pep; }
  else { if (G.ofrenda.libre > G.reloj) return; G.ofrenda.libre = G.reloj + 4 * 3600; }
  G.ofrenda.hasta = Math.max(G.ofrenda.hasta, G.reloj) + seg;
  G.est.ofrendas++;
  Sonido.ofrenda(); vibrar([20, 40, 20]);
  const S = superficieEstatica(MA.def);
  for (let k = 0; k < 30; k++) part({ x: S.apacheta.x, y: S.apacheta.y, vx: rnd(-40, 40), vy: rnd(-70, -20), g: 30, vida: rnd(1, 2), c: ['#4ab86a', '#ffd84a', '#ff6a8a', '#6ae0ff'][k % 4], t: k % 2 ? 'hoja' : 'confeti' });
  banner(tr('boost'), tr('quedan', fmtT(G.ofrenda.hasta - G.reloj)), ORO7);
  cerrarPanel(); CAM.obj = 0;
  revisarLogros(); guardar();
}
function filaOpcion(g, x, y, w, et) { txt(g, et, x + 8, y + 3, { c: CREMA, max: w * 0.4 }); }
function panelOpciones(g, P) {
  const w = anchoPanel(208), h = Math.min(H - 24, 262), x = Math.round((W - w) / 2), y = Math.round((H - h) / 2) + entra(P);
  fondoModal(g, cerrarPanel);
  marco(g, x, y, w, h, tr('opciones'), { cerrar: cerrarPanel });
  const cx = x + Math.round(w * 0.45), cw = w - Math.round(w * 0.45) - 8;
  let yy = y + 24;
  filaOpcion(g, x, yy, w, tr('musica')); deslizador(g, cx, yy + 1, cw, OP.musica, v => { OP.musica = v; Sonido.volumen(OP.musica, OP.sonido); guardarOp(); }); yy += 17;
  filaOpcion(g, x, yy, w, tr('sonido')); deslizador(g, cx, yy + 1, cw, OP.sonido, v => { OP.sonido = v; Sonido.volumen(OP.musica, OP.sonido); guardarOp(); }); yy += 17;
  filaOpcion(g, x, yy, w, tr('idioma')); boton(g, cx, yy, cw, 14, null, () => abrirPanel('idioma'), { estilo: 'azul', dibujar: (g2, bx, by, bw, bh, Pb) => { icono(g2, 'globo', bx + 3, by + 2); txt(g2, nombreIdioma(), bx + 15, by + 3, { c: '#ffffff', b: Pb.bor, max: bw - 18 }); } }); yy += 18;
  filaOpcion(g, x, yy, w, tr('controles')); boton(g, cx, yy, cw, 14, tr('controles'), () => abrirPanel('controles', { sel: 'minas' }), { estilo: 'piedra', icono: 'mano' }); yy += 18;
  const tres = (opts, val, fn) => { const bw = Math.floor((cw - (opts.length - 1) * 2) / opts.length); opts.forEach(([v, et], k) => boton(g, cx + k * (bw + 2), yy, bw, 14, et, () => fn(v), { estilo: val === v ? 'azul' : 'piedra', sel: val === v })); };
  filaOpcion(g, x, yy, w, tr('calidad')); tres([['auto', tr('auto')], ['alta', tr('alta')], ['baja', tr('baja')]], OP.calidad, v => { OP.calidad = v; CALIDAD = v === 'baja' ? 'baja' : 'alta'; guardarOp(); }); yy += 18;
  filaOpcion(g, x, yy, w, tr('numeros')); tres([['corto', tr('corto')], ['cientifico', '1E6']], OP.numeros, v => { OP.numeros = v; FORMATO = v; guardarOp(); }); yy += 18;
  filaOpcion(g, x, yy, w, tr('vibrar')); tres([[true, tr('si')], [false, tr('no')]], OP.vibrar, v => { OP.vibrar = v; VIBRAR = v; guardarOp(); if (v) vibrar(30); }); yy += 22;
  if (ESCENA !== 'titulo') boton(g, x + 8, yy, w - 16, 18, tr('menu'), () => { cerrarPanel(); guardar(); irA('titulo'); }, { estilo: 'piedra' });
  yy += 22;
  boton(g, x + 8, yy, w - 16, 16, tr('borrar'), () => confirmar(tr('seguro'), () => { Guardado.borrar('datos'); location.reload(); }), { estilo: 'rojo' });
  txt(g, 'JXSTUDIOS · FAMATINA', x + w / 2, y + h - 12, { f: 'mini', al: 0.5, c: '#8a6a50', b: null });
}
function nombreIdioma() { const l = IDIOMAS.find(x => x[0] === IDIOMA); return l ? l[1] : IDIOMA; }
function panelIdioma(g, P) {
  const w = anchoPanel(214), h = Math.min(H - 24, 22 + 7 * 21 + 10), x = Math.round((W - w) / 2), y = Math.round((H - h) / 2) + entra(P);
  fondoModal(g, cerrarPanel);
  marco(g, x, y, w, h, tr('idioma'), { cerrar: () => abrirPanel('opciones') });
  icono(g, 'globo', x + 6, y + 5);
  const bw = Math.floor((w - 20) / 2), bh = Math.min(18, Math.floor((h - 30) / 7) - 3);
  IDIOMAS.forEach(([cod, nom], k) => {
    const bx = x + 8 + (k % 2) * (bw + 4), by = y + 23 + Math.floor(k / 2) * (bh + 3), sel = cod === IDIOMA;
    boton(g, bx, by, bw, bh, null, () => { cambiarIdioma(cod); }, { estilo: sel ? 'oro' : 'piedra', sel, dibujar: (g2, x2, y2, w2, h2, Pb) => {
      const viejo = IDIOMA; IDIOMA = cod;
      const chico = esPx(mayus(nom), 'px') && anchoTxt(g2, nom) > w2 - 6;
      txt(g2, nom, x2 + w2 / 2, y2 + Math.round((h2 - (chico ? 5 : 7)) / 2), { al: 0.5, c: Pb.txt, b: Pb.bor, max: w2 - 6, f: chico ? 'mini' : 'px' });
      IDIOMA = viejo;
    } });
  });
}
function cambiarIdioma(cod) { IDIOMA = cod; Guardado.escribir('idioma', cod); document.documentElement.lang = cod; FUERA.length = 0; }
// editor de controles: mover, tamaño, opacidad, zurdo, vibrar, arrastre, mantener, probar
function panelControles(g, P) {
  g.fillStyle = 'rgba(12,6,16,0.55)'; g.fillRect(0, 0, W, H);
  zona(0, 0, W, H, () => { });
  const ori = W > H ? 'h' : 'v';
  const w = anchoPanel(206), h = Math.min(H - 78, 252), x = Math.round((W - w) / 2), y = 24;
  marco(g, x, y, w, h, tr('controles'), { cerrar: () => { guardarOp(); abrirPanel('opciones'); } });
  parrafo(g, tr('arrastraBotones'), x + w / 2, y + 21, w - 16, { f: 'mini', al: 0.5, c: CREMA, b: null });
  const sel = P.sel || 'minas', cx = x + Math.round(w * 0.45), cw = w - Math.round(w * 0.45) - 8;
  let yy = y + 36;
  txt(g, sel === 'ir' ? '▲▼' : '', x + 8, yy, { c: '#ffe08a' });
  filaOpcion(g, x, yy, w, tr('tamano')); deslizador(g, cx, yy + 1, cw, ((OP.tam[sel] || 1) - 0.6) / 1.2, v => { OP.tam[sel] = 0.6 + v * 1.2; }); yy += 16;
  filaOpcion(g, x, yy, w, tr('opacidad')); deslizador(g, cx, yy + 1, cw, ((OP.opac[sel] != null ? OP.opac[sel] : 1) - 0.2) / 0.8, v => { OP.opac[sel] = 0.2 + v * 0.8; }); yy += 16;
  filaOpcion(g, x, yy, w, tr('arrastre')); deslizador(g, cx, yy + 1, cw, (OP.arrastre - 0.5) / 1.5, v => { OP.arrastre = 0.5 + v * 1.5; }); yy += 16;
  const dos = (opts, val, fn) => { const bw = Math.floor((cw - (opts.length - 1) * 2) / opts.length); opts.forEach(([v, et], k) => boton(g, cx + k * (bw + 2), yy, bw, 13, et, () => fn(v), { estilo: val === v ? 'azul' : 'piedra', sel: val === v })); };
  filaOpcion(g, x, yy, w, tr('zurdo')); dos([[true, tr('si')], [false, tr('no')]], OP.zurdo, v => { OP.zurdo = v; ZURDO = v; }); yy += 16;
  filaOpcion(g, x, yy, w, tr('vibrar')); dos([[true, tr('si')], [false, tr('no')]], OP.vibrar, v => { OP.vibrar = v; VIBRAR = v; if (v) vibrar(30); }); yy += 16;
  txt(g, tr('mantener'), x + 8, yy + 3, { c: CREMA, max: w - 16, f: 'mini', b: null }); yy += 10;
  { const opts = [[0, tr('lento')], [1, tr('normal')], [2, tr('rapido')]], bw = Math.floor((w - 16 - 4) / 3); opts.forEach(([v, et], k) => boton(g, x + 8 + k * (bw + 2), yy, bw, 13, et, () => { OP.mantener = v; }, { estilo: OP.mantener === v ? 'azul' : 'piedra', sel: OP.mantener === v })); yy += 18; }
  // PROBÁ ACÁ
  const ph = Math.max(30, y + h - 26 - yy);
  rect(g, x + 8, yy, w - 16, ph, '#140a06'); rect(g, x + 9, yy + 1, w - 18, ph - 2, '#24180e');
  txt(g, tr('probaAca'), x + 12, yy + 3, { f: 'mini', c: '#a89070', b: null });
  P.prueba = P.prueba || 0;
  boton(g, x + w / 2 - 40, yy + Math.round(ph / 2) - 8, 80, 16, tr('mejorar') + ' ' + P.prueba, () => { P.prueba++; Sonido.mejora(P.prueba % 11); vibrar(6); }, { rep: 1, mudo: 1 });
  boton(g, x + 8, y + h - 22, Math.floor((w - 20) / 2), 16, tr('restablecer'), () => { OP.botones = { v: {}, h: {} }; OP.tam = {}; OP.opac = {}; OP.arrastre = 1; OP.mantener = 1; OP.zurdo = false; ZURDO = false; }, { estilo: 'piedra' });
  boton(g, x + 12 + Math.floor((w - 20) / 2), y + h - 22, Math.floor((w - 20) / 2), 16, tr('listo'), () => { guardarOp(); cerrarPanel(); }, { estilo: 'verde' });
  // los botones, arrastrables
  for (const id of BOTONES) {
    const p = posBoton(id), ic = id === 'ir' ? 'subir' : id === 'capataces' ? 'casco' : id === 'logros' ? 'trofeo' : id === 'vitrina' ? 'gema' : id;
    if (id === sel) { const k = Math.sin(T * 6) > 0 ? '#ffffff' : '#ffd84a'; for (let a = 0; a < 24; a++) { const an = a / 24 * Math.PI * 2; px(g, p.x + Math.cos(an) * (p.r + 2), p.y + Math.sin(an) * (p.r + 2), k); } }
    botonRedondo(g, p.x, p.y, p.r, ic, null, { op: p.op });
    zona(p.x - p.r - 2, p.y - p.r - 2, p.r * 2 + 4, p.r * 2 + 4, () => { P.sel = id; }, { drag: (px0, py0, inicio) => { P.sel = id; if (inicio) return; OP.botones[ori] = OP.botones[ori] || {}; OP.botones[ori][id] = { x: clamp(px0 / W, 0.03, 0.97), y: clamp(py0 / H, 0.08, 0.98) }; } });
  }
}
function panelDiario(g, P) {
  const w = anchoPanel(208), h = 178, x = Math.round((W - w) / 2), y = Math.round((H - h) / 2) + entra(P);
  fondoModal(g, () => { });
  marco(g, x, y, w, h, tr('diario'));
  const dia = G.diario.racha, cw = Math.floor((w - 16) / 4);
  DIARIO.forEach((r, k) => {
    const cx = x + 8 + (k % 4) * cw + (k >= 4 ? cw / 2 : 0), cy = y + 22 + Math.floor(k / 4) * 46, hoyEs = k === (dia - 1) % 7, paso = k < (dia - 1) % 7;
    rect(g, cx + 1, cy, cw - 2, 42, hoyEs ? '#e8b030' : '#140a06'); rect(g, cx + 2, cy + 1, cw - 4, 40, hoyEs ? '#5a3a14' : '#2a160c');
    txt(g, tr('dia', k + 1), cx + cw / 2, cy + 3, { f: 'mini', al: 0.5, c: hoyEs ? '#ffe08a' : CREMA, b: null, max: cw - 4 });
    const ic = r.p ? 'pepita' : r.of ? 'ofrenda' : 'moneda';
    icono(g, ic, cx + Math.round(cw / 2 - tamIcono(ic)[0] / 2), cy + 12 + (hoyEs ? Math.round(Math.sin(T * 5)) : 0));
    txt(g, r.p ? '+' + r.p : r.of ? '×2 ' + fmtT(r.of) : fmtT(r.cash), cx + cw / 2, cy + 28, { f: 'mini', al: 0.5, c: '#ffffff', b: null, max: cw - 4 });
    if (paso) { g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(cx + 2, cy + 1, cw - 4, 40); txt(g, '★', cx + cw / 2, cy + 16, { al: 0.5, c: '#ffd84a' }); }
  });
  boton(g, x + 12, y + h - 34, w - 24, 24, tr('cobrar'), () => cobrarDiario(), { estilo: 'oro', brillo: 1 });
}
function panelBienvenida(g, P) {
  const w = anchoPanel(206), filas = P.lista.length, h = 92 + filas * 11, x = Math.round((W - w) / 2), y = Math.round((H - h) / 2) + entra(P);
  fondoModal(g, () => { });
  marco(g, x, y, w, h, tr('bienvenida'));
  txt(g, tr('afuera', fmtT(P.seg)), x + w / 2, y + 23, { al: 0.5, c: CREMA, max: w - 16 });
  P.lista.forEach(([k, v], j) => { txt(g, MINAS[k].nom, x + 10, y + 36 + j * 11, { c: '#ffffff', max: w * 0.5 }); costo(g, v, x + w - 10, y + 36 + j * 11, 1); });
  const cerrar = () => { PANEL = null; siguienteAviso(); };
  boton(g, x + 8, y + h - 34, Math.floor((w - 20) / 2), 24, tr('cobrar'), () => { Sonido.moneda(5); monedasA(W / 2, y + h - 30, 8); cerrar(); }, { estilo: 'oro' });
  boton(g, x + 12 + Math.floor((w - 20) / 2), y + h - 34, Math.floor((w - 20) / 2), 24, null, () => {
    if (G.pepitas < 8) { Sonido.error(); flotar(W / 2, y + h - 40, tr('sinPepitas'), ROJO); return; }
    G.pepitas -= 8;
    for (const [k, v] of P.lista) { const d = G.minas[k]; d.cash += v; d.total += v; d.hist += v; G.est.ganado += v; }
    Sonido.hito(); monedasA(W / 2, y + h - 30, 8); cerrar(); revisarLogros();
  }, { estilo: 'verde', dibujar: (g2, bx, by, bw, bh, Pb) => { const s = '×2', tw = anchoTxt(g2, s); txt(g2, s, bx + bw / 2 - 12 - tw / 2, by + 8, { c: Pb.txt, b: Pb.bor }); costoPep(g2, 8, bx + bw / 2 - 6, by + 8, 0); } });
}
function panelConfirmar(g) {
  const w = anchoPanel(190), x = Math.round((W - w) / 2), lineas = partir(g, CONF.s, w - 20, {}).length, h = 52 + lineas * 11, y = Math.round((H - h) / 2);
  fondoModal(g, () => { CONF = null; });
  marco(g, x, y, w, h, null);
  parrafo(g, CONF.s, x + w / 2, y + 10, w - 20, { al: 0.5, c: CREMA });
  boton(g, x + 8, y + h - 26, Math.floor((w - 20) / 2), 18, tr('cancelar'), () => { CONF = null; }, { estilo: 'piedra' });
  boton(g, x + 12 + Math.floor((w - 20) / 2), y + h - 26, Math.floor((w - 20) / 2), 18, tr('aceptar'), () => { const f = CONF.si; CONF = null; f(); }, { estilo: 'rojo' });
}
function panelFiebre(g, P) {
  const des = desafioDelDia(hoy()), par = parDelDia(des), w = anchoPanel(208), h = 214, x = Math.round((W - w) / 2), y = Math.round((H - h) / 2) + entra(P);
  fondoModal(g, cerrarPanel);
  marco(g, x, y, w, h, tr('fiebre'), { cerrar: cerrarPanel });
  let yy = y + 22;
  yy += parrafo(g, tr('fiebreTxt'), x + w / 2, yy, w - 16, { al: 0.5, c: CREMA }) + 4;
  txt(g, MINAS[des.mina].nom, x + w / 2, yy, { al: 0.5, c: '#ffe08a' }); yy += 12;
  for (const [k, a] of des.info) { txt(g, '★ ' + tr(k, a), x + w / 2, yy, { al: 0.5, c: VERDE, max: w - 16 }); yy += 11; }
  yy += 3;
  const med = [['bronce', MEDALLAS[0], '#d8905a'], ['plata', MEDALLAS[1], '#d0d8e8'], ['oro', MEDALLAS[2], '#ffd84a']];
  med.forEach(([k, f, c], j) => { const bx = x + 8 + j * Math.floor((w - 16) / 3), bw = Math.floor((w - 16) / 3) - 2; rect(g, bx, yy, bw, 22, '#24140a'); txt(g, tr(k), bx + bw / 2, yy + 3, { f: 'mini', al: 0.5, c, b: null, max: bw - 2 }); txt(g, fmt(par * f), bx + bw / 2, yy + 12, { f: 'mini', al: 0.5, c: '#ffffff', b: null }); if (G.fiebre.dia === des.dia && G.fiebre.medallaHoy > j) txt(g, '★', bx + bw - 6, yy + 2, { f: 'mini', c }); });
  yy += 28;
  txt(g, tr('hoy') + ': ' + fmt(G.fiebre.dia === des.dia ? G.fiebre.mejorHoy : 0) + '   ' + tr('record') + ': ' + fmt(G.fiebre.record), x + w / 2, yy, { al: 0.5, c: CREMA, f: 'mini', b: null, max: w - 12 });
  boton(g, x + 12, y + h - 34, w - 24, 24, tr('empezar'), () => empezarCarrera(des), { estilo: 'oro', brillo: 1 });
}
function panelFiebreFin(g, P) {
  const C = CARRERA, w = anchoPanel(200), h = 176, x = Math.round((W - w) / 2), y = Math.round((H - h) / 2) + entra(P);
  fondoModal(g, () => { });
  marco(g, x, y, w, h, tr('tiempo'));
  txt(g, fmt(C.mina.d.total), x + w / 2, y + 26, { t: 2, al: 0.5, c: ORO7, max: w - 16 });
  const med = P.med, cols = ['#8a8090', '#d8905a', '#d0d8e8', '#ffd84a'];
  txt(g, med ? tr(['', 'bronce', 'plata', 'oro'][med]) : '—', x + w / 2, y + 48, { al: 0.5, c: cols[med], t: med === 3 ? 2 : 1 });
  if (med) for (let k = 0; k < med; k++) icono(g, 'estrella', x + w / 2 - med * 6 + k * 12, y + 64);
  if (P.premio) { txt(g, tr('premio') + ':', x + w / 2 - 20, y + 80, { al: 1, c: CREMA }); costoPep(g, P.premio, x + w / 2 - 14, y + 80, 0); }
  if (P.record) txt(g, '¡' + tr('record') + '!', x + w / 2, y + 94, { al: 0.5, c: VERDE });
  boton(g, x + 8, y + h - 50, w - 16, 20, tr('otraVez'), () => empezarCarrera(C.des), { estilo: 'oro', brillo: 1 });
  boton(g, x + 8, y + h - 26, w - 16, 18, tr('volver'), () => { PANEL = null; irA('titulo', () => { CARRERA = null; Sonido.musicaMina(G.minaAct); }); }, { estilo: 'piedra' });
}
function hudCarrera(g) {
  const C = CARRERA, m = C.mina, rest = Math.max(0, C.dur - C.t), s = Math.floor(rest / 60) + ':' + String(Math.floor(rest % 60)).padStart(2, '0');
  txt(g, s, W / 2, 4, { t: 2, al: 0.5, c: rest < 15 && Math.sin(T * 10) > 0 ? ['#ff9a8a', '#ff7a6a', '#ff5a4a', '#e83a2a', '#c82a1a', '#a81a10', '#881008'] : ORO7, b: '#120804' });
  const par = parDelDia(C.des), f = m.d.total / (par * MEDALLAS[2]);
  barra(g, W - 66, 6, 58, 6, f, f >= 1 ? '#ffd84a' : f >= 0.65 ? '#d0d8e8' : '#d8905a');
  for (const q of [MEDALLAS[0] / MEDALLAS[2], MEDALLAS[1] / MEDALLAS[2]]) rect(g, W - 66 + Math.round(58 * q), 5, 1, 8, '#ffffff');
  botonRedondo(g, W - 11, 30, 8, 'engranaje', () => confirmar(tr('abandonar'), () => { CARRERA.t = CARRERA.dur; }));
}

// ---------- título ----------
function escenaTitulo(g) {
  const portada = PARAM.has('portada'), tt = W >= 216 ? 4 : 3, yT = Math.round(H * (portada ? 0.16 : 0.12) + Math.sin(T * 1.4) * 2);
  if (!portada) { g.fillStyle = 'rgba(10,6,4,0.25)'; g.fillRect(0, yT - 8, W, 7 * tt + 34); }
  txt(g, 'FAMATINA', W / 2, yT, { t: tt, al: 0.5, c: ORO7, b: '#1a0a04', s: '#1a0a04', max: W - 6 });
  txt(g, tr('subtitulo'), W / 2, yT + 7 * tt + 8, { al: 0.5, c: '#fff0d0', b: '#1a0a04', max: W - 10 });
  if (portada) { const yj = Math.round(H * 0.85); g.fillStyle = 'rgba(10,6,4,0.6)'; g.fillRect(W / 2 - 34, yj - 4, 68, 15); txt(g, 'JXSTUDIOS', W / 2, yj, { al: 0.5, c: ORO7, b: '#1a0a04' }); return; }
  const bw = Math.min(150, W - 40), bx = Math.round((W - bw) / 2), by = Math.round(H * 0.68);
  g.fillStyle = 'rgba(10,6,4,0.55)'; g.fillRect(bx - 10, by - 10, bw + 20, 96);
  boton(g, bx, by, bw, 28, tr('jugar'), () => irA('mina', alEntrarMina), { estilo: 'oro', t: 2, brillo: 1 });
  boton(g, bx, by + 36, bw, 20, tr('fiebre'), () => abrirPanel('fiebre'), { estilo: 'azul', icono: 'reloj' });
  boton(g, bx, by + 62, bw, 16, tr('opciones'), () => abrirPanel('opciones'), { estilo: 'piedra', icono: 'engranaje' });
  botonRedondo(g, W - 14, 14, 11, 'globo', () => abrirPanel('idioma'));
  txt(g, 'JXSTUDIOS', W / 2, H - 12, { f: 'mini', al: 0.5, c: '#d8c0a0', b: '#1a0a04' });
}

// ---------- tutorial ----------
function pasosTutorial(m) {
  const d = m.d, y0 = Y0 - CAM.y, P = sup();
  return [
    { k: 'tut1', ok: () => d.niveles[0].caja > 0 || (m.ag && m.ag.niv[0].min.some(x => x.est !== 'quieto')) || G.est.ganado > 0, pos: [RX((xMinA() + xVeta()) / 2, 0), y0 + 24] },
    { k: 'tut2', ok: () => (m.ag && m.ag.asc.est !== 'quieto') || d.tolva > 0 || G.est.ganado > 0, pos: [RX(15, 0), y0 + 26], si: () => d.niveles[0].caja > 0 },
    { k: 'tut3', ok: () => G.est.ganado > 0, pos: [RX(P.tolva + 10, 0), SUELO - 14 - CAM.y], si: () => d.tolva > 0 },
    { k: 'tut4', ok: () => d.niveles[0].L >= 2, pos: [RX(EST.x + 18, 0), y0 + 13], si: () => d.cash >= m.costo('nivel', 0, 1) },
    { k: 'tut5', ok: () => m.capataces().length > 0, pos: [RX(EST.x + 24, 0), y0 + 26], si: () => d.cash >= m.costoCapataz('nivel', 0) },
    { k: 'tut6', ok: () => d.niveles.length >= 2, pos: [W / 2, y0 + NH + 20], si: () => d.cash >= m.costoAbrir(1) },
  ];
}
function tutorial(g, m) {
  if (G.tut >= 6 || PANEL || ESCENA !== 'mina' || m !== MA) return;
  const ps = pasosTutorial(m), p = ps[G.tut];
  if (p.ok()) { G.tut++; if (G.tut >= 6) siguienteAviso(); return; }
  if (p.si && !p.si()) return;
  if (CAM.y > 60) return;
  const [x, y] = p.pos, bw = Math.min(150, W - 16), lineas = partir(g, tr(p.k), bw - 10, {}), bh = lineas.length * 11 + 8;
  const arriba = y > H * 0.45, by = arriba ? y - 26 - bh : y + 22, bx = clamp(Math.round(x - bw / 2), 6, W - bw - 6);
  rect(g, bx - 1, by - 1, bw + 2, bh + 2, '#1a0a04'); rect(g, bx, by, bw, bh, '#fff4d8'); rect(g, bx, by + bh - 2, bw, 2, '#e0c8a0');
  lineas.forEach((l, k) => txt(g, l, bx + bw / 2, by + 4 + k * 11, { al: 0.5, c: '#3a1e08', b: null, max: bw - 8 }));
  const k = Math.abs(Math.sin(T * 5)) * 4, hy = arriba ? y - 22 + k : y + 4 - k;
  icono(g, 'mano', Math.round(x - 3), Math.round(hy));
}

// ---------- telón: la reja de la jaula ----------
let REJA = null;
function rejaCv() {
  const w = Math.ceil(W / 2) + 3;
  if (REJA && REJA.width === w && REJA.height === H) return REJA;
  REJA = lienzo(w, H);
  const g = ctx2(REJA);
  rect(g, 0, 0, w, H, '#140c10');
  for (let k = -H; k < w + H; k += 12) { lin(g, k, 0, k + H, H, '#3a3238'); lin(g, k + 1, 0, k + 1 + H, H, '#7a7080'); lin(g, k + H, 0, k, H, '#3a3238'); lin(g, k + H + 1, 0, k + 1, H, '#6a6070'); }
  for (let x = 0; x < w; x += 12) { rect(g, x, 0, 2, H, '#4a4048'); rect(g, x, 0, 1, H, '#8a8090'); }
  for (let x = 0; x < w; x += 12) for (let y = 0; y < H; y += 12) { rect(g, x, y, 2, 2, '#c8b8a0'); px(g, x + 1, y + 1, '#3a3238'); }
  rect(g, w - 4, 0, 4, H, '#2a2228'); rect(g, w - 3, 0, 1, H, '#9a90a0');
  rect(g, w - 9, Math.round(H / 2) - 8, 4, 16, '#c87a3a'); rect(g, w - 8, Math.round(H / 2) - 7, 2, 14, '#f0b070');
  return REJA;
}
function dibujarTelon(g) {
  if (!TELON.fase) return;
  const k = suave(TELON.t), R = rejaCv(), off = Math.round((1 - k) * R.width);
  g.fillStyle = 'rgba(10,6,12,' + (k * 0.5) + ')'; g.fillRect(0, 0, W, H);
  g.drawImage(R, -off, 0);
  g.save(); g.translate(W, 0); g.scale(-1, 1); g.drawImage(R, -off, 0); g.restore();
  zona(0, 0, W, H, () => { });
}
