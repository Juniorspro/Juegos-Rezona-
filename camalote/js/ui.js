// CAMALOTE — interfaz: botones de figurita, HUD, diálogos, carteles, menús, álbum, láminas y controles de dedo
let ZONAS = [], ZONAS_PREV = [];
let PANEL = null, DLG = null, BAN = null, LAM = null, TARJ = null;
const TOASTS = [], OBJ = { t: 99 };
const CREMA = '#fff4dc', PAPEL = '#f6e8c8', AMARILLO = '#ffd75a', VERDE = '#5ab04a', ROJO = '#e8604a', TINTA2 = '#6a5a4a';
const COLOR_VOZ = { abuela: '#9a6ab8', tereso: '#6a8aa8', yaca: '#5a8a3a', mosquita: '#c84a5a', cemento: '#5a6270', rosa: '#c8743a', mulita: '#b08a7a', coati: '#a8743a', nutria: '#7a5434', ciervo: '#b0603a', lola: '#d07a9a', pancho: '#c0504a', cartel: '#a87a4a' };

function zona(x, y, w, h, fn, op) { ZONAS.push({ x, y, w, h, fn, op: op || {} }); }
function zonaEn(lista, x, y) { for (let i = lista.length - 1; i >= 0; i--) { const z = lista[i]; if (x >= z.x && x < z.x + z.w && y >= z.y && y < z.y + z.h) return z; } return null; }
function apretado(x, y, w, h) { for (const p of E.punteros.values()) if (p.rol === 'ui' && !p.arr && p.x0 >= x && p.x0 < x + w && p.y0 >= y && p.y0 < y + h) return true; return false; }

// ---------- piezas: botón de figurita, botón redondo, tarjeta con cinta, deslizador, interruptor ----------
function boton(g, x, y, w, h, eti, fn, op) {
  op = op || {};
  const ap = fn && apretado(x, y, w, h + 3), dy = ap ? 2 : 0, col = op.c || AMARILLO, r = op.r != null ? op.r : Math.min(h / 2, 14);
  rr(g, x, y + 3, w, h, r); g.fillStyle = osc(col, 0.5); g.fill();
  rr(g, x, y + dy, w, h, r); pintar(g, col, LINEA, 2);
  rr(g, x + 5, y + dy + 3, w - 10, Math.max(3, h * 0.24), r * 0.6); g.fillStyle = 'rgba(255,255,255,0.32)'; g.fill();
  let cx = x + w / 2, mw = w - 16;
  if (op.ic) { const s = op.icS || h / 32; icono(g, op.ic, x + 10 + 11 * s, y + dy + h / 2, s); cx += 10 * s; mw -= 24 * s; }
  if (eti) txt(g, eti, cx, y + dy + h / 2 + 1, { tam: op.tam || Math.min(17, h * 0.44), c: op.ct || LINEA, al: 0.5, max: mw });
  if (fn) zona(x, y, w, h + 3, () => { Sonido.boton(); fn(); });
}
function botonRedondo(g, cx, cy, r, ic, fn, op) {
  op = op || {};
  const ap = fn && apretado(cx - r, cy - r, 2 * r, 2 * r + 3), dy = ap ? 2 : 0;
  elip(g, cx, cy + 3, r, r); g.fillStyle = 'rgba(30,22,16,0.45)'; g.fill();
  elip(g, cx, cy + dy, r, r); pintar(g, op.c || CREMA, LINEA, 2);
  icono(g, ic, cx, cy + dy, op.s || r / 13);
  if (op.badge) { elip(g, cx + r * 0.72, cy - r * 0.72, 5, 5); pintar(g, ROJO, LINEA, 1.4); }
  if (fn) zona(cx - r - 4, cy - r - 4, 2 * r + 8, 2 * r + 10, () => { Sonido.boton(); fn(); });
}
function tarjeta(g, x, y, w, h, titulo, op) {
  op = op || {};
  rr(g, x + 3, y + 6, w, h, 18); g.fillStyle = 'rgba(16,12,8,0.35)'; g.fill();
  rr(g, x, y, w, h, 18); pintar(g, op.c || CREMA, LINEA, 2.2);
  rr(g, x + 7, y + 7, w - 14, h - 14, 13); g.setLineDash([5, 5]); g.strokeStyle = 'rgba(106,90,74,0.35)'; g.lineWidth = 1.4; g.stroke(); g.setLineDash([]);
  if (titulo) {
    const tw = Math.min(w - 30, anchoTxt(g, titulo, { tam: 18 }) + 44);
    g.save(); g.translate(x + w / 2, y + 1); g.rotate(-0.025);
    rr(g, -tw / 2, -15, tw, 30, 5); pintar(g, op.cinta || '#6ab890', LINEA, 2);
    for (const s of [-1, 1]) { poli(g, [s * tw / 2, -15, s * (tw / 2 + 8), -15, s * (tw / 2 + 3), 0, s * (tw / 2 + 8), 15, s * tw / 2, 15]); pintar(g, osc(op.cinta || '#6ab890', 0.2), LINEA, 2); }
    txt(g, titulo, 0, 1, { tam: 18, c: '#ffffff', b: LINEA, bw: 3.5, al: 0.5, max: tw - 22 });
    g.restore();
  }
}
function deslizador(g, x, y, w, v, fn) {
  rr(g, x, y - 5, w, 10, 5); pintar(g, '#e2d2b4', LINEA, 1.6);
  if (v > 0.01) { rr(g, x, y - 5, Math.max(10, w * v), 10, 5); g.fillStyle = VERDE; g.fill(); g.strokeStyle = LINEA; g.lineWidth = 1.6; g.stroke(); }
  elip(g, x + w * v, y, 11, 11); pintar(g, AMARILLO, LINEA, 2);
  const set = px => fn(clamp((px - x) / w, 0, 1));
  zona(x - 14, y - 18, w + 28, 36, px => set(px), { drag: px => set(px) });
}
function interruptor(g, x, y, on, fn) {
  rr(g, x, y, 48, 26, 13); pintar(g, on ? VERDE : '#cdbda2', LINEA, 2);
  elip(g, x + (on ? 35 : 13), y + 13, 9.5, 9.5); pintar(g, CREMA, LINEA, 1.8);
  zona(x - 8, y - 8, 64, 42, () => { Sonido.boton(); fn(); });
}
function fondoModal(g, a) { g.fillStyle = 'rgba(14,22,18,' + (a == null ? 0.6 : a) + ')'; g.fillRect(0, 0, W, H); zona(0, 0, W, H, () => { }); }
function abrirPanel(tipo, datos) { PANEL = Object.assign({ tipo, t: 0 }, datos || {}); }
function cerrarPanel() { const p = PANEL; PANEL = null; if (p && p.volver) abrirPanel(p.volver); if (p && p.tipo === 'controles') guardarOp(); }

// ---------- diálogos, carteles de premio y avisos (los usa el mundo) ----------
function abrirDialogo(quien, texto) { DLG = { quien, texto: String(texto), n: 0, t: 0, lineas: null }; }
function dialogoAbierto() { return !!DLG; }
function avanzarDialogo() { if (!DLG) return; if (DLG.n < DLG.total) DLG.n = DLG.total; else if (DLG.t > 0.12) { DLG = null; Sonido.boton(); } }
function bannerDar(id) { BAN = { tipo: 'item', id, t: 0 }; }
function bannerFigurita(id) { BAN = { tipo: 'figu', id, t: 0 }; ALBUM[id] = 1; Guardado.escribir('album', ALBUM); }
function bannerAbierto() { return !!BAN; }
function cerrarBanner() { if (BAN && BAN.t > 0.6) { BAN = null; Sonido.boton(); } }
function toast(s, ic) { TOASTS.push({ s, ic: ic || null, t: 0 }); if (TOASTS.length > 3) TOASTS.shift(); }
function toastObjetivo() { OBJ.t = 0; }
function pista() {
  if (guionActivo() || DLG || BAN) return;
  if (N.flag('tereso') || N.id !== 'c1') correr('pista'); else OBJ.t = 0;
}

// ---------- adónde apunta la flecha del objetivo ----------
const OBJ_POS = {
  o_c1a: () => N.tile(13, 11) !== '=' ? [13.5, 9.5] : !N.flag('abre_A') ? [6.5, 15.5] : [12.5, 22.5], o_c1c: () => [12.5, 33.5], o_c1f: () => [12.5, 39.5], o_c2f: () => [14.5, 33.5], o_c1d: () => TIENE('boina') ? [12.5, 39.5] : [23.5, 36.5], o_c1e: () => [12.5, 52],
  o_c2a: () => [21.5, 10.5], o_c2b: () => [10.5, 15.5], o_c2c: () => J.carga ? [14.5, 33.5] : [22.5, 31.5], o_c2d: () => [12.5, 38.5],
  o_c2e: () => N.abierta('D', 12, 44) ? [12.5, 54] : [12.5, 44.5],
  o_c3a: () => !N.flag('abre_H') ? [12.5, 20.5] : !N.flag('abre_A') ? [12.5, 36.5] : [12.5, 50.5],
};

// ---------- HUD ----------
function hud(g) {
  const v = VISTA, x0 = v.x + 8, y0 = v.y + 8, n = Math.ceil(J.hpMax / 2);
  rr(g, x0 - 2, y0 - 1, n * 24 + 8, 28, 14); g.fillStyle = 'rgba(24,30,22,0.38)'; g.fill();
  for (let i = 0; i < n; i++) {
    const hp = J.hp - i * 2, nom = hp >= 2 ? 'corazon' : hp === 1 ? 'corazonM' : 'corazonV';
    const late = J.hp <= 2 && hp > 0 ? 1 + Math.max(0, Math.sin(T * 9)) * 0.14 : 1;
    icono(g, nom, x0 + 14 + i * 24, y0 + 13, 1.05 * late);
  }
  if (G.objetivo) {
    const yb = y0 + 33;
    if (OBJ.t < 5) {
      const s = tr(G.objetivo), k = suave(Math.min(1, OBJ.t / 0.3, (5 - OBJ.t) / 0.3)), w = Math.min(v.w - 16, anchoTxt(g, s, { tam: 13 }) + 46);
      g.globalAlpha = Math.max(0.15, k);
      rr(g, x0, yb + 3, w, 28, 14); g.fillStyle = 'rgba(16,12,8,0.35)'; g.fill();
      rr(g, x0, yb, w, 28, 14); pintar(g, CREMA, LINEA, 2);
      icono(g, 'bandera', x0 + 17, yb + 14, 0.8);
      txt(g, s, x0 + 32, yb + 14.5, { tam: 13, c: LINEA, max: w - 42 });
      g.globalAlpha = 1;
      zona(x0, yb, w, 30, pista);
    } else botonRedondo(g, x0 + 15, yb + 15, 15, 'bandera', pista, { s: 0.85 });
  }
  botonRedondo(g, v.x + v.w - 25, y0 + 16, 17, 'pausa', () => abrirPanel('pausa'));
  if (N.jefe) {
    const j = N.jefe, w = Math.min(230, v.w - 110), x = v.x + v.w / 2 - w / 2 + 14, y = y0 + 36, k = Math.max(0, j.hp) / j.hpMax;
    txt(g, tr('n_' + j.id), x + w / 2, y + 2, { tam: 12, c: '#fff', b: LINEA, bw: 3, al: 0.5, max: w });
    rr(g, x, y + 12, w, 12, 6); pintar(g, '#3a2a22', LINEA, 2);
    if (k > 0) { rr(g, x + 2, y + 14, (w - 4) * k, 8, 4); g.fillStyle = j.inv > 0 ? '#ffffff' : '#ff6a5a'; g.fill(); }
  }
}
function flechaObjetivo(g) {
  const f = G.objetivo && OBJ_POS[G.objetivo];
  if (!f || guionActivo() || N.jefe) return;
  const [tx, ty] = f(), v = VISTA, m = 30;
  const sx = v.x + v.w / 2 + (tx - CAM.x) * TS, sy = v.y + v.h / 2 + (ty - CAM.y) * TS;
  if (sx > v.x + m && sx < v.x + v.w - m && sy > v.y + 76 && sy < v.y + v.h - m) return;
  const cx = v.x + v.w / 2, cy = v.y + v.h / 2, a = Math.atan2(sy - cy, sx - cx);
  const ex = clamp(sx, v.x + m, v.x + v.w - m), ey = clamp(sy, v.y + 80, v.y + v.h - m), b = Math.sin(T * 5) * 3;
  g.save(); g.translate(ex + Math.cos(a) * b, ey + Math.sin(a) * b); g.rotate(a + Math.PI / 2); g.globalAlpha = 0.9;
  icono(g, 'flecha', 0, 0, 1.15); g.restore(); g.globalAlpha = 1;
}
// burbuja arriba de lo que se puede hablar (va adentro del mundo)
function burbuja(g) {
  if (guionActivo() || DLG || BAN || J.dash > 0) return;
  const e = hablable();
  let x, y, ic;
  if (e) { x = e.x * TS; y = (e.y - (e.tipo === 'cartel' ? 1.2 : e.id === 'ciervo' ? 1.9 : e.id === 'tereso' && e.vuela ? 1.5 : 1.25)) * TS; ic = e.tipo === 'cartel' ? 'leer' : 'charla'; }
  else { const [fx, fy] = frente(0.8); if (N.tile(fx, fy) !== 'F') return; x = (Math.floor(fx) + 0.5) * TS; y = (Math.floor(fy) - 0.3) * TS; ic = 'fogon'; }
  const b = Math.sin(T * 4) * 2;
  g.save(); g.translate(x, y + b);
  rr(g, -13, -11, 26, 20, 9); pintar(g, '#ffffff', LINEA, 1.6); poli(g, [-4, 8, 4, 8, -2, 14]); pintar(g, '#ffffff'); trazo(g, [-4, 9, -2, 14, 4, 9], LINEA, 1.4);
  if (ic === 'charla') for (let k = 0; k < 3; k++) { elip(g, -6 + k * 6, -1, 2, 2); pintar(g, LINEA); }
  else if (ic === 'leer') { for (let k = 0; k < 3; k++) trazo(g, [-7, -5 + k * 4, 7 - (k % 2) * 4, -5 + k * 4], LINEA, 1.6); }
  else { poli(g, [-5, 5, 0, -8, 5, 5]); pintar(g, '#ff9a30'); poli(g, [-2, 5, 0, -2, 2, 5]); pintar(g, '#ffe070'); }
  g.restore();
}

// ---------- el cuadro de diálogo ----------
function dibujarDialogo(g) {
  const d = DLG, v = VISTA, rtl = esRTL(), tam = 14.5, lh = tam * 1.3;
  const w = Math.min(v.w - 16, 600), x = v.x + (v.w - w) / 2;
  if (!d.lineas || d.w !== w || d.idioma !== IDIOMA) {
    d.lineas = partir(g, d.texto, w - 92, { tam, peso: 500 }); d.w = w; d.idioma = IDIOMA;
    d.total = d.lineas.reduce((a, l) => a + Array.from(l).length, 0) + d.lineas.length - 1;
  }
  const h = Math.max(80, 30 + d.lineas.length * lh + 10), y = v.y + v.h - h - 12, pop = suave(Math.min(1, d.t / 0.14));
  g.save(); g.translate(0, (1 - pop) * 18); g.globalAlpha = pop;
  rr(g, x + 2, y + 5, w, h, 16); g.fillStyle = 'rgba(16,12,8,0.4)'; g.fill();
  rr(g, x, y, w, h, 16); pintar(g, CREMA, LINEA, 2.2);
  const px = rtl ? x + w - 40 : x + 40;
  retrato(g, d.quien, px, y + 40, 28);
  const nom = tr('n_' + d.quien), nw = Math.min(w - 100, anchoTxt(g, nom, { tam: 13 }) + 24), nx = rtl ? x + w - 80 - nw : x + 80;
  rr(g, nx, y - 13, nw, 25, 12); pintar(g, COLOR_VOZ[d.quien] || '#a87a4a', LINEA, 2);
  txt(g, nom, nx + nw / 2, y, { tam: 13, c: '#fff', b: LINEA, bw: 3, al: 0.5, max: nw - 14 });
  let quedan = Math.floor(d.n);
  const tx = rtl ? x + w - 80 : x + 80;
  for (let i = 0; i < d.lineas.length && quedan > 0; i++) {
    const cars = Array.from(d.lineas[i]);
    txt(g, cars.slice(0, quedan).join(''), tx, y + 24 + i * lh, { tam, peso: 500, c: LINEA, al: rtl ? 1 : 0 });
    quedan -= cars.length + 1;
  }
  if (d.n >= d.total) { const b = Math.sin(T * 7) * 2, ax = rtl ? x + 18 : x + w - 18; poli(g, [ax - 6, y + h - 17 + b, ax + 6, y + h - 17 + b, ax, y + h - 10 + b]); pintar(g, LINEA); }
  g.restore();
  zona(0, 0, W, H, avanzarDialogo);
}
function dibujarToasts(g) {
  if (!TOASTS.length) return;
  const t = TOASTS[0], v = VISTA, k = suave(Math.min(1, t.t / 0.25, (2.6 - t.t) / 0.25)), w = Math.min(v.w - 30, anchoTxt(g, t.s, { tam: 14 }) + 36);
  const x = v.x + (v.w - w) / 2, y = v.y + lerp(-40, 76, k);
  rr(g, x, y + 3, w, 30, 15); g.fillStyle = 'rgba(0,0,0,0.3)'; g.fill();
  rr(g, x, y, w, 30, 15); pintar(g, '#2e4a3a', LINEA, 2);
  txt(g, t.s, x + w / 2, y + 15.5, { tam: 14, c: '#fff4dc', al: 0.5, max: w - 24 });
}

// ---------- figuritas ----------
const FIGU_COL = { carpincho: '#9ad670', tero: '#b0dcf0', yacare: '#88c060', mulita: '#f2d68a', hornero: '#f2be80', coati: '#ecc880', camalote: '#98cfee', nutria: '#8cb8de', ciervo: '#c8a8e6' };
function camaloteArte(g, x, y, s, t) {
  g.save(); g.translate(x, y + Math.sin(t * 1.5) * 1.2); g.scale(s, s);
  elip(g, 0, 7, 24, 6); pintar(g, '#3d9bd0');
  for (const [lx, ly, r] of [[-13, 3, 7.5], [12, 4, 7], [0, 1, 8.5], [-6, -5, 6.5], [7, -4, 6.5]]) { elip(g, lx, ly, r, r * 0.72); pintar(g, '#4aa23c', LINEA, 1.1); elip(g, lx - r * 0.3, ly - r * 0.2, r * 0.35, r * 0.2); pintar(g, '#7ac862'); }
  for (const [sx, h] of [[-4, 16], [3, 20], [9, 13]]) {
    trazo(g, [sx, -2, sx + 1, -h], '#3a7a2e', 1.4);
    for (let k = 0; k < 5; k++) { elip(g, sx + 1 + Math.cos(k * 1.3) * 2.6, -h - 1 + Math.sin(k * 1.3) * 2.4 - (k % 2) * 2, 2.2, 1.8); pintar(g, '#b98ce8', LINEA, 0.5); }
    elip(g, sx + 1, -h - 1, 1, 1); pintar(g, '#ffe060');
  }
  g.restore();
}
function animalFigu(g, id, t) {
  switch (id) {
    case 'carpincho': capy(g, -4, 14, 'r', t, Object.assign({}, PIELES.pancho, { bandana: null, escala: 1.25 })); break;
    case 'tero': tero(g, -4, 16, 'r', t, false, 1.6); break;
    case 'yacare': g.save(); g.scale(0.92, 0.92); yacare(g, -2, 12, 'r', t, false); g.restore(); break;
    case 'mulita': g.save(); g.translate(0, 13); g.scale(1.7, 1.7); mulita(g, 0, 0, 'r', t); g.restore(); break;
    case 'hornero': g.save(); g.translate(8, 14); g.scale(1.3, 1.3); hornera(g, 0, 0, 'r', t); g.restore(); break;
    case 'coati': g.save(); g.translate(0, 13); g.scale(1.5, 1.5); coati(g, 0, 0, 'r', t); g.restore(); break;
    case 'camalote': camaloteArte(g, 0, 4, 1.05, t); break;
    case 'nutria': g.save(); g.translate(0, 13); g.scale(1.6, 1.6); nutria(g, 0, 0, 'r', t); g.restore(); break;
    case 'ciervo': g.save(); g.translate(-2, 19); g.scale(0.88, 0.88); ciervo(g, 0, 0, 'r', t); g.restore(); break;
  }
}
function dibujarFigu(g, id, cx, cy, s, t, tiene) {
  g.save(); g.translate(cx, cy); g.scale(s, s);
  rr(g, -31, -39, 64, 84, 7); g.fillStyle = 'rgba(16,12,8,0.3)'; g.fill();
  rr(g, -32, -42, 64, 84, 7); pintar(g, '#fffaf0', LINEA, 1.8);
  rr(g, -27, -37, 54, 58, 4); g.fillStyle = tiene ? FIGU_COL[id] : '#cfc3ae'; g.fill();
  g.save(); rr(g, -27, -37, 54, 58, 4); g.clip();
  if (tiene) {
    g.fillStyle = 'rgba(255,255,255,0.22)'; for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(0, -8); g.arc(0, -8, 60, k * 1.26 + t * 0.2, k * 1.26 + 0.5 + t * 0.2); g.closePath(); g.fill(); }
    if (id !== 'camalote') { elip(g, 0, 22, 30, 8); pintar(g, id === 'nutria' || id === 'yacare' ? '#4aa0d0' : '#6ab04a'); }
    animalFigu(g, id, t);
  } else txt(g, '?', 0, -8, { tam: 34, c: '#a89a84', al: 0.5 });
  g.restore();
  rr(g, -27, -37, 54, 58, 4); g.strokeStyle = LINEA; g.lineWidth = 1.2; g.stroke();
  elip(g, 22, -34, 8, 8); pintar(g, tiene ? ROJO : '#a89a84', LINEA, 1.4);
  txt(g, FIGURITAS.indexOf(id) + 1, 22, -33.5, { tam: 9, c: '#fff', al: 0.5 });
  const nom = tiene ? tr('f_' + id) : '?';
  if (anchoTxt(g, nom, { tam: 8.5 }) > 58) { const ls = partir(g, nom, 56, { tam: 7.5 }).slice(0, 2); ls.forEach((l, i) => txt(g, l, 0, 32 + (i - (ls.length - 1) / 2) * 8.5, { tam: 7.5, c: LINEA, al: 0.5, max: 56 })); }
  else txt(g, nom, 0, 32, { tam: 8.5, c: LINEA, al: 0.5, max: 56 });
  g.restore();
}
function dibujarBanner(g) {
  const b = BAN, k = suave(Math.min(1, b.t / 0.25));
  fondoModal(g, 0.62 * k);
  const w = Math.min(310, W - 32), h = Math.min(330, H - 24), x = (W - w) / 2, y = (H - h) / 2 + (1 - rebote(Math.min(1, b.t / 0.4))) * 40, cy = y + h * 0.36;
  g.save(); g.translate(W / 2, cy); g.rotate(T * 0.35);
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; poli(g, [0, 0, Math.cos(a - 0.12) * 190, Math.sin(a - 0.12) * 190, Math.cos(a + 0.12) * 190, Math.sin(a + 0.12) * 190]); pintar(g, 'rgba(255,226,120,' + 0.16 * k + ')'); }
  g.restore();
  const figu = b.tipo === 'figu', pre = figu ? 'f_' : 'i_';
  tarjeta(g, x, y, w, h, tr(figu ? 'nuevaFigu' : 'conseguiste'), { cinta: figu ? '#e8883a' : '#5ab04a' });
  if (figu) dibujarFigu(g, b.id, W / 2, cy, Math.min(1.35, (h * 0.5) / 84), T, true);
  else { elip(g, W / 2, cy, 46, 46); pintar(g, '#fff9ea', LINEA, 2); icono(g, b.id, W / 2, cy, 2.8); }
  txt(g, tr(pre + b.id), W / 2, y + h * 0.66, { tam: 20, c: LINEA, al: 0.5, max: w - 30 });
  parrafo(g, tr(pre + b.id + '_d'), W / 2, y + h * 0.71, w - 40, { tam: 13.5, peso: 500, c: TINTA2, al: 0.5 });
  if (b.t > 0.6) txt(g, tr('tocar'), W / 2, y + h - 18, { tam: 12, c: rgba('#6a5a4a', 0.55 + 0.45 * Math.sin(T * 5)), al: 0.5, max: w - 30 });
  zona(0, 0, W, H, cerrarBanner);
}

// ---------- controles de dedo ----------
const CTL = { joy: { act: false, id: null, bx: 0, by: 0, vx: 0, vy: 0 }, bot: { A: false, B: false, C: false, D: false } };
const RBASE = { joy: 52, A: 40, B: 33, C: 29, D: 29 };
const ICONO_CTL = { A: 'mano', B: 'embestida', C: 'silbato', D: 'boleadoras' };
const COL_CTL = { A: '#ffd75a', B: '#ff9a6a', C: '#86d0ec', D: '#c09af0' };
function orient() { return BANDEJA ? 'v' : 'h'; }
function ctlVisible(id) { return id === 'joy' || id === 'A' || id === 'B' || (id === 'C' && TIENE('silbato')) || (id === 'D' && TIENE('boleadoras')); }
function radioCtl(id) { return RBASE[id] * ((OP.tam[id]) || 1); }
function opacCtl(id) { return OP.opac[id] != null ? OP.opac[id] : BANDEJA ? 0.95 : 0.7; }
function posDefecto(id) {
  let p;
  if (BANDEJA) { const ty = VISTA.h, th = H - ty; p = { joy: [W * 0.25, ty + th * 0.54], A: [W * 0.82, ty + th * 0.52], B: [W * 0.62, ty + th * 0.75], C: [W * 0.63, ty + th * 0.3], D: [W * 0.85, ty + th * 0.2] }[id]; }
  else p = { joy: [Math.max(90, W * 0.13), H - 96], A: [W - 66, H - 80], B: [W - 146, H - 50], C: [W - 142, H - 128], D: [W - 62, H - 168] }[id];
  return OP.zurdo ? [W - p[0], p[1]] : p;
}
function posCtl(id) {
  const q = OP.pos[orient()] && OP.pos[orient()][id], p = q ? [q[0] * W, q[1] * H] : posDefecto(id), r = id === 'joy' ? radioCtl(id) * 0.8 : radioCtl(id);
  return [clamp(p[0], r + 2, W - r - 2), clamp(p[1], r + 2, H - r - 2)];
}
function zonaPalanca(x, y) {
  if (OP.palanca !== 'flotante') { const [px, py] = posCtl('joy'); return Math.hypot(x - px, y - py) < radioCtl('joy') * 1.7; }
  const lado = OP.zurdo ? x > W / 2 : x < W / 2;
  return lado && (BANDEJA ? y > VISTA.h : y > H * 0.28);
}
function tocarControl(x, y) {
  for (const id of ['A', 'B', 'C', 'D']) { if (!ctlVisible(id)) continue; const [cx, cy] = posCtl(id); if (Math.hypot(x - cx, y - cy) < radioCtl(id) * 1.18) return id; }
  return zonaPalanca(x, y) ? 'joy' : null;
}
function moverPalanca(x, y, inicio) {
  const j = CTL.joy, r = radioCtl('joy');
  if (inicio) {
    if (OP.palanca === 'flotante') { j.bx = clamp(x, r, W - r); j.by = clamp(y, r, H - r); } else [j.bx, j.by] = posCtl('joy');
  }
  let dx = x - j.bx, dy = y - j.by, d = Math.hypot(dx, dy);
  if (OP.palanca === 'flotante' && d > r) { j.bx += dx / d * (d - r); j.by += dy / d * (d - r); dx = x - j.bx; dy = y - j.by; d = r; }
  if (OP.palanca === 'cruz') {
    if (d < r * 0.22) { j.vx = j.vy = 0; return; }
    const a = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * Math.PI / 4;
    j.vx = Math.round(Math.cos(a) * 100) / 100; j.vy = Math.round(Math.sin(a) * 100) / 100; return;
  }
  const k = d < r * 0.14 ? 0 : Math.min(1, d / (r * 0.75));
  j.vx = d ? dx / d * k : 0; j.vy = d ? dy / d * k : 0;
}
function dibujarControl(g, id, editor, sel, k) {
  const [x, y] = posCtl(id), r = radioCtl(id);
  g.globalAlpha = (editor ? 1 : opacCtl(id)) * (k || 1);
  if (id === 'joy') {
    const j = CTL.joy, act = j.act && !editor, flot = OP.palanca === 'flotante', bx = act && flot ? j.bx : x, by = act && flot ? j.by : y;
    if (OP.palanca === 'cruz') {
      for (const [ax, ay] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
        const on = act && Math.round(j.vx) === ax && Math.round(j.vy) === ay;
        rr(g, x + ax * r * 0.55 - r * 0.32, y + ay * r * 0.55 - r * 0.32, r * 0.64, r * 0.64, 7); pintar(g, on ? '#ffe9a8' : 'rgba(255,244,220,0.85)', LINEA, 2);
        g.save(); g.translate(x + ax * r * 0.58, y + ay * r * 0.58); g.rotate(Math.atan2(ay, ax) + Math.PI / 2); poli(g, [0, -7, 6, 3, -6, 3]); pintar(g, LINEA); g.restore();
      }
      elip(g, x, y, r * 0.22, r * 0.22); pintar(g, 'rgba(255,244,220,0.85)', LINEA, 2);
    } else {
      g.globalAlpha *= act || editor || !flot ? 1 : 0.55;
      elip(g, bx, by, r, r); pintar(g, 'rgba(255,244,220,0.22)', 'rgba(255,244,220,0.8)', 2.5);
      for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; g.save(); g.translate(bx + Math.cos(a) * r * 0.78, by + Math.sin(a) * r * 0.78); g.rotate(a + Math.PI / 2); poli(g, [0, -5, 5, 2, -5, 2]); pintar(g, 'rgba(255,244,220,0.8)'); g.restore(); }
      const kx = bx + (act ? j.vx : 0) * r * 0.62, ky = by + (act ? j.vy : 0) * r * 0.62;
      elip(g, kx, ky + 3, r * 0.44, r * 0.44); g.fillStyle = 'rgba(0,0,0,0.3)'; g.fill();
      elip(g, kx, ky, r * 0.44, r * 0.44); pintar(g, CREMA, LINEA, 2.2);
      elip(g, kx - r * 0.12, ky - r * 0.14, r * 0.16, r * 0.1); pintar(g, '#ffffff');
    }
  } else {
    const ap = CTL.bot[id] && !editor, cd = id === 'B' ? J.dashCD / 0.42 : id === 'C' ? J.silbCD : id === 'D' ? J.bolCD / 0.65 : 0;
    const habla = id === 'A' && !editor && N && ESCENA === 'juego' && !DLG && (hablable() || J.carga);
    const ic = habla ? (J.carga && !hablable() ? 'barro' : 'charla') : ICONO_CTL[id], s = selloBoton(id, r, ap, ic);
    g.drawImage(s.c, x - s.m, y - s.m, s.lado, s.lado);
    if (!editor && cd > 0) { g.beginPath(); g.moveTo(x, y); g.arc(x, y, r - 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, cd)); g.closePath(); g.fillStyle = 'rgba(30,20,10,0.38)'; g.fill(); }
  }
  g.globalAlpha = 1;
  if (editor && sel) { elip(g, x, y, r + 7, r + 7); g.setLineDash([6, 5]); g.strokeStyle = '#ffffff'; g.lineWidth = 2.5; g.stroke(); g.setLineDash([]); }
}
const _botones = {};
function selloBoton(id, r, ap, ic) {
  const k = id + r.toFixed(1) + (+ap) + ic + K;
  let s = _botones[k];
  if (s) return s;
  const m = r + 6, lado = m * 2, [c, g] = lienzoK(lado, lado);
  elip(g, m, m + 4, r, r); g.fillStyle = 'rgba(16,12,8,0.4)'; g.fill();
  elip(g, m, m + (ap ? 3 : 0), r, r); pintar(g, ap ? osc(COL_CTL[id], 0.15) : COL_CTL[id], LINEA, 2.4);
  elip(g, m - r * 0.3, m - r * 0.38 + (ap ? 3 : 0), r * 0.38, r * 0.2, -0.4); pintar(g, 'rgba(255,255,255,0.4)');
  icono(g, ic, m, m + (ap ? 3 : 0), r / (id === 'B' ? 17 : 15));
  return (_botones[k] = { c, m, lado });
}
function dibujarControles(g) {
  if (!TACTIL || PANEL && PANEL.tipo === 'controles') return;
  const k = !BANDEJA && (DLG || BAN) ? 0.3 : 1;
  for (const id of ['joy', 'A', 'B', 'C', 'D']) if (ctlVisible(id)) dibujarControl(g, id, false, false, k);
}
let _bandeja = null;
function dibujarBandeja(g) {
  const y0 = VISTA.h, h = H - y0;
  if (!_bandeja || _bandeja.k !== K || _bandeja.w !== W || _bandeja.h !== h) {
    const [c, b] = lienzoK(W, h), r = rngSemilla(7);
    const gr = b.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2c5a3e'); gr.addColorStop(1, '#173426'); b.fillStyle = gr; b.fillRect(0, 0, W, h);
    for (let k = 0; k < 60; k++) { const x = r() * W, y = 14 + r() * (h - 14); elip(b, x, y, 6 + r() * 16, 2 + r() * 3); pintar(b, 'rgba(255,255,255,0.025)'); }
    b.fillStyle = '#4a8a3a'; b.fillRect(0, 0, W, 9); b.fillStyle = '#1e3a2a'; b.fillRect(0, 9, W, 3);
    for (let x = 0; x < W; x += 7 + r() * 6) { const hh = 10 + r() * 16; trazo(b, [x, 9, x + r() * 4 - 2, 9 - hh], r() < 0.5 ? '#5aa048' : '#3e7a34', 2); if (r() < 0.15) { elip(b, x + 1, 9 - hh - 2, 1.6, 4); pintar(b, '#7a5232'); } }
    _bandeja = { c, k: K, w: W, h };
  }
  g.drawImage(_bandeja.c, 0, y0, W, h);
}

// ---------- menús ----------
function dibujarPanel(g) {
  const P = PANEL;
  ({ pausa: panelPausa, opciones: panelOpciones, idioma: panelIdioma, album: panelAlbum, controles: panelControles, confirmar: panelConfirmar })[P.tipo](g, P);
}
function columnaBotones(g, x, y, w, bh, gap, lista) {
  lista.forEach((b, i) => boton(g, x, y + i * (bh + gap), w, bh, b[0], b[1], b[2]));
}
function nFigus() { return FIGURITAS.filter(f => G.figus[f]).length; }
function panelPausa(g, P) {
  fondoModal(g);
  const bh = H < 420 ? 36 : 42, gap = H < 420 ? 8 : 11, pw = Math.min(W - 40, 300), ph = 96 + 5 * (bh + gap), px = (W - pw) / 2, py = Math.max(10, (H - ph) / 2);
  tarjeta(g, px, py, pw, ph, tr('pausa'));
  txt(g, tr(N.d.nombre) + '  ·  ' + fmtT(G.tiempo || 0), W / 2, py + 34, { tam: 14, c: LINEA, al: 0.5, max: pw - 30 });
  icono(g, 'figurita', W / 2 - 22, py + 56, 0.75); txt(g, nFigus() + '/9', W / 2 - 10, py + 57, { tam: 14, c: TINTA2 });
  columnaBotones(g, px + 24, py + 76, pw - 48, bh, gap, [
    [tr('seguir'), () => cerrarPanel(), { c: VERDE, ic: 'flecha2' }],
    [tr('album'), () => abrirPanel('album', { volver: 'pausa' }), { ic: 'libro' }],
    [tr('opciones'), () => abrirPanel('opciones', { volver: 'pausa' }), { ic: 'engranaje' }],
    [tr('controles'), () => abrirPanel('controles', { volver: 'pausa', modo: 'mover' }), { ic: 'mando' }],
    [tr('menu'), () => { PANEL = null; guardar(); irA('titulo', () => Sonido.musica(0)); }, { c: '#f0b8a0', ic: 'casa' }],
  ]);
  if (!TACTIL) txt(g, tr('teclas'), W / 2, H - 12, { tam: 11, c: '#fff4dc', al: 0.5, max: W - 20 });
}
function panelOpciones(g, P) {
  fondoModal(g);
  const fila = H < 420 ? 44 : 52, pw = Math.min(W - 30, 340), ph = 70 + fila * 5 + 50, px = (W - pw) / 2, py = Math.max(8, (H - ph) / 2);
  tarjeta(g, px, py, pw, ph, tr('opciones'));
  const x1 = px + 22, x2 = px + pw - 22, et = (s, i) => txt(g, s, x1, py + 44 + i * fila, { tam: 15, c: LINEA, max: pw * 0.4 });
  et(tr('musica'), 0); deslizador(g, px + pw * 0.48, py + 44, pw * 0.52 - 30, OP.musica, v => { OP.musica = v; Sonido.volumen(OP.musica, OP.sonido); guardarOp(); });
  et(tr('sonido'), 1); deslizador(g, px + pw * 0.48, py + 44 + fila, pw * 0.52 - 30, OP.sonido, v => { OP.sonido = v; Sonido.volumen(OP.musica, OP.sonido); guardarOp(); });
  et(tr('vibrar'), 2); interruptor(g, x2 - 48, py + 44 + fila * 2 - 13, OP.vibrar, () => { OP.vibrar = !OP.vibrar; VIBRAR = OP.vibrar; guardarOp(); vibrar(30); });
  et(tr('idioma'), 3); boton(g, px + pw * 0.44, py + 44 + fila * 3 - 17, pw * 0.56 - 22, 34, nombreIdioma(), () => abrirPanel('idioma', { volver: 'opciones', volver2: P.volver }), { ic: 'globo', tam: 13, c: CREMA });
  et(tr('controlesEt'), 4); boton(g, px + pw * 0.44, py + 44 + fila * 4 - 17, pw * 0.56 - 22, 34, tr('editar'), () => abrirPanel('controles', { volver: 'opciones', volver2: P.volver, modo: 'mover' }), { ic: 'mando', tam: 13, c: CREMA });
  boton(g, W / 2 - 75, py + ph - 52, 150, 38, tr('volver'), () => { const v = P.volver2; cerrarPanel(); if (PANEL && v) PANEL.volver = v; }, { c: VERDE });
}
function nombreIdioma() { const l = IDIOMAS.find(x => x[0] === IDIOMA); return l ? l[1] : IDIOMA; }
function cambiarIdioma(cod) { IDIOMA = cod; Guardado.escribir('idioma', cod); document.documentElement.lang = cod; document.documentElement.dir = esRTL() ? 'rtl' : 'ltr'; if (DLG) DLG.lineas = null; }
function panelIdioma(g, P) {
  fondoModal(g);
  const cols = H < 520 ? 2 : 1, filas = Math.ceil(IDIOMAS.length / cols), bh = H < 520 ? 30 : 32, gap = 6;
  const pw = Math.min(W - 24, cols === 2 ? 460 : 300), ph = 64 + filas * (bh + gap) + 6, px = (W - pw) / 2, py = Math.max(6, (H - ph) / 2);
  tarjeta(g, px, py, pw, ph, tr('idioma'));
  const cw = (pw - 36 - (cols - 1) * 10) / cols;
  IDIOMAS.forEach(([cod, nom], i) => {
    const c = Math.floor(i / filas), f = i % filas, sel = cod === IDIOMA;
    boton(g, px + 18 + c * (cw + 10), py + 32 + f * (bh + gap), cw, bh, nom, () => { cambiarIdioma(cod); const v = P.volver2; cerrarPanel(); if (PANEL && v) PANEL.volver2 = v; }, { c: sel ? VERDE : CREMA, tam: 14 });
  });
  botonRedondo(g, px + pw - 8, py + 8, 15, 'cruz', () => { const v = P.volver2; cerrarPanel(); if (PANEL && v) PANEL.volver2 = v; });
}
function panelConfirmar(g, P) {
  fondoModal(g);
  const pw = Math.min(W - 40, 310), ph = 170, px = (W - pw) / 2, py = (H - ph) / 2;
  tarjeta(g, px, py, pw, ph, null);
  parrafo(g, P.s, W / 2, py + 26, pw - 40, { tam: 15, peso: 500, c: LINEA, al: 0.5 });
  boton(g, px + 20, py + ph - 56, (pw - 52) / 2, 40, tr('no'), () => cerrarPanel(), { c: CREMA });
  boton(g, px + 32 + (pw - 52) / 2, py + ph - 56, (pw - 52) / 2, 40, tr('si'), () => { PANEL = null; P.si(); }, { c: ROJO });
}
function panelAlbum(g, P) {
  fondoModal(g);
  const pw = Math.min(W - 20, 440), ph = Math.min(H - 16, 560), px = (W - pw) / 2, py = (H - ph) / 2;
  tarjeta(g, px, py, pw, ph, tr('album'), { cinta: '#e8883a' });
  const n = FIGURITAS.filter(f => ALBUM[f]).length, gap = 10;
  txt(g, tr('figusN', n), W / 2, py + 32, { tam: 13, c: TINTA2, al: 0.5, max: pw - 40 });
  const s = Math.min((pw - 40 - gap * 2) / 3 / 64, (ph - 120 - gap * 2) / 3 / 84), cw = 64 * s, ch = 84 * s;
  const gx = W / 2 - (cw * 3 + gap * 2) / 2, gy = py + 48;
  FIGURITAS.forEach((id, i) => {
    const cx = gx + (i % 3) * (cw + gap) + cw / 2, cy = gy + Math.floor(i / 3) * (ch + gap) + ch / 2, tiene = !!ALBUM[id];
    dibujarFigu(g, id, cx, cy, s, T, tiene);
    if (tiene) zona(cx - cw / 2, cy - ch / 2, cw, ch, () => { P.ver = id; P.tv = 0; Sonido.pagina(); });
  });
  boton(g, W / 2 - 75, py + ph - 52, 150, 38, tr('volver'), () => cerrarPanel(), { c: VERDE });
  if (P.ver) {
    fondoModal(g, 0.5);
    const port = H > W * 1.2, id = P.ver, w = Math.min(W - 30, port ? 330 : 560), h = Math.min(H - 30, port ? 470 : 300), x = (W - w) / 2, y = (H - h) / 2;
    tarjeta(g, x, y, w, h, tr('f_' + id), { cinta: '#e8883a' });
    if (port) { dibujarFigu(g, id, W / 2, y + 30 + 84 * 1.25, 2.5, T, true); parrafo(g, tr('f_' + id + '_d'), W / 2, y + 60 + 84 * 2.5, w - 40, { tam: 15, peso: 500, c: LINEA, al: 0.5 }); }
    else { const s2 = (h - 60) / 84; dibujarFigu(g, id, x + 30 + 32 * s2, y + h / 2 + 4, s2, T, true); parrafo(g, tr('f_' + id + '_d'), x + 60 + 64 * s2, y + 50, w - 90 - 64 * s2, { tam: 15, peso: 500, c: LINEA }); }
    zona(0, 0, W, H, () => { P.ver = null; });
  }
}

// ---------- editor de controles (mover, tamaño, opacidad, palanca, zurdo, vibrar, probar) ----------
const PREV = { x: 0.5, y: 0.6, dir: 'd', anim: 0, mov: 0, dash: 0, dx: 0, dy: 0, cd: 0, onda: 0, bolas: [] };
function pasoPrevia(dt) {
  const P = PREV;
  let mx = CTL.joy.act ? CTL.joy.vx : 0, my = CTL.joy.act ? CTL.joy.vy : 0;
  if (E.teclas.size) { const k = teclasDir(); mx += k[0]; my += k[1]; }
  const m = Math.hypot(mx, my);
  if (m > 0.3) P.dir = Math.abs(mx) > Math.abs(my) ? (mx > 0 ? 'r' : 'l') : (my > 0 ? 'd' : 'u');
  if (P.cd > 0) P.cd -= dt;
  if (PULSO.B > 0 && P.cd <= 0) { P.dash = 0.2; P.cd = 0.42; P.dx = m > 0.3 ? mx / m : DX[P.dir]; P.dy = m > 0.3 ? my / m : DY[P.dir]; Sonido.embestida(); vibrar(15); }
  if (PULSO.C > 0) { P.onda = 0.6; Sonido.silbato(); }
  if (PULSO.D > 0) { P.bolas.push({ x: P.x, y: P.y - 0.08, vx: DX[P.dir] * 1.4, vy: DY[P.dir] * 1.4, t: 0 }); Sonido.boleadoras(); }
  if (PULSO.A > 0) { P.salto = 0.3; Sonido.boton(); }
  PULSO.A = PULSO.B = PULSO.C = PULSO.D = 0;
  if (P.dash > 0) { P.dash -= dt; P.x += P.dx * dt * 1.5; P.y += P.dy * dt * 1.5; }
  else { P.x += mx * dt * 0.55; P.y += my * dt * 0.55; }
  P.x = clamp(P.x, 0.06, 0.94); P.y = clamp(P.y, 0.3, 0.95);
  P.mov = Math.min(1, m); if (m > 0.3) P.anim += dt * 10;
  if (P.onda > 0) P.onda -= dt; if (P.salto > 0) P.salto -= dt;
  for (const b of P.bolas) { b.x += b.vx * dt; b.y += b.vy * dt; b.t += dt; }
  P.bolas = P.bolas.filter(b => b.t < 0.6);
}
function panelControles(g, P) {
  g.fillStyle = 'rgba(10,18,14,0.5)'; g.fillRect(0, 0, W, H);
  const probar = P.modo === 'probar';
  if (BANDEJA) { g.strokeStyle = 'rgba(255,244,220,0.5)'; g.setLineDash([8, 6]); g.lineWidth = 2; g.strokeRect(6, VISTA.h + 6, W - 12, H - VISTA.h - 12); g.setLineDash([]); }
  for (const id of ['joy', 'A', 'B', 'C', 'D']) dibujarControl(g, id, !probar, P.sel === id);
  const cw = Math.min(W - 16, BANDEJA ? 420 : Math.max(300, W - 300)), cx = (W - cw) / 2, cy = 14;
  const ch = BANDEJA ? Math.min(VISTA.h - 24, 330) : Math.min(H * 0.64, 232);
  tarjeta(g, cx, cy, cw, ch, tr('controles'));
  const fila = BANDEJA ? 46 : 38, bh = BANDEJA ? 34 : 30;
  let y = cy + 26;
  txt(g, probar ? tr('probaHint') : tr('arrastra'), W / 2, y + 6, { tam: 12.5, c: TINTA2, al: 0.5, max: cw - 30 });
  y += 20;
  if (probar) {
    // la caja de prueba: Pancho responde a lo que tocás
    const bx = cx + 16, bw = cw - 32, bhh = ch - (y - cy) - fila - 20;
    rr(g, bx, y, bw, bhh, 12); g.save(); g.clip(); g.fillStyle = patron('pasto'); g.fillRect(bx, y, bw, bhh);
    const ppx = bx + PREV.x * bw, ppy = y + PREV.y * bhh;
    if (PREV.onda > 0) { const k = 1 - PREV.onda / 0.6; elip(g, ppx, ppy - 10, k * 70, k * 38); g.strokeStyle = 'rgba(180,240,255,' + (1 - k) + ')'; g.lineWidth = 3; g.stroke(); }
    for (const b of PREV.bolas) { elip(g, bx + b.x * bw, y + b.y * bhh, 3.5, 3.5); pintar(g, '#7a5232', LINEA, 1); }
    sombra(g, ppx, ppy, 11);
    capy(g, ppx, ppy - (PREV.salto > 0 ? Math.sin(PREV.salto / 0.3 * Math.PI) * 8 : 0), PREV.dir, T, Object.assign({ anim: PREV.anim, mov: PREV.mov, dash: PREV.dash > 0 }, PIELES.pancho, { escala: 1.5 }));
    g.restore(); rr(g, bx, y, bw, bhh, 12); g.strokeStyle = LINEA; g.lineWidth = 2; g.stroke();
    txt(g, tr('probaAca'), bx + 10, y + 12, { tam: 11, c: '#ffffff', b: LINEA, bw: 3 });
    y += bhh + 8;
  } else {
    const half = (cw - 40) / 2;
    const nomP = { flotante: tr('pFlotante'), fija: tr('pFija'), cruz: tr('pCruz') }[OP.palanca];
    boton(g, W / 2 - Math.min(cw - 32, 220) / 2, y, Math.min(cw - 32, 220), bh, nomP, () => { OP.palanca = { flotante: 'fija', fija: 'cruz', cruz: 'flotante' }[OP.palanca]; guardarOp(); }, { tam: 13, c: CREMA, ic: 'mando', icS: 0.85 });
    y += bh + 10;
    txt(g, tr('zurdo'), cx + 18, y + 13, { tam: 13, c: LINEA, max: half - 62 });
    interruptor(g, cx + 16 + half - 52, y, OP.zurdo, () => { OP.zurdo = !OP.zurdo; guardarOp(); });
    txt(g, tr('vibrar'), cx + 26 + half, y + 13, { tam: 13, c: LINEA, max: half - 62 });
    interruptor(g, cx + cw - 16 - 50, y, OP.vibrar, () => { OP.vibrar = !OP.vibrar; VIBRAR = OP.vibrar; guardarOp(); vibrar(30); });
    y += BANDEJA ? 44 : 36;
    if (P.sel) {
      const id = P.sel, half = (cw - 48) / 2;
      const ajuste = (x0, eti, val, menos, mas) => {
        txt(g, eti, x0 + half / 2, y + 2, { tam: 11, c: TINTA2, al: 0.5, max: half - 10 });
        botonRedondo(g, x0 + 15, y + 24, 14, 'menos', menos);
        txt(g, val, x0 + half / 2, y + 25, { tam: 15, c: LINEA, al: 0.5, max: half - 64 });
        botonRedondo(g, x0 + half - 15, y + 24, 14, 'mas', mas);
      };
      const tam = Math.round((OP.tam[id] || 1) * 100), op = Math.round(opacCtl(id) * 100);
      y += 6;
      ajuste(cx + 16, tr('tamano'), tam + '%', () => { OP.tam[id] = clamp((tam - 10) / 100, 0.6, 1.8); guardarOp(); }, () => { OP.tam[id] = clamp((tam + 10) / 100, 0.6, 1.8); guardarOp(); });
      ajuste(cx + 32 + half, tr('opacidad'), op + '%', () => { OP.opac[id] = clamp((op - 10) / 100, 0.2, 1); guardarOp(); }, () => { OP.opac[id] = clamp((op + 10) / 100, 0.2, 1); guardarOp(); });
    } else txt(g, tr('tocaUno'), W / 2, y + 18, { tam: 12, c: TINTA2, al: 0.5, max: cw - 30 });
    y = cy + ch - fila - 8;
  }
  const third = (cw - 40) / 3;
  boton(g, cx + 16, y, third, bh, tr('restablecer'), () => { OP.pos = { v: {}, h: {} }; OP.tam = {}; OP.opac = {}; OP.palanca = 'flotante'; OP.zurdo = false; OP.vibrar = true; VIBRAR = true; P.sel = null; guardarOp(); }, { tam: 12, c: '#f0c8b0' });
  boton(g, cx + 20 + third, y, third, bh, probar ? tr('acomodar') : tr('probar'), () => { P.modo = probar ? 'mover' : 'probar'; P.sel = null; soltarTodo(); }, { tam: 12, c: CELESTE_B });
  boton(g, cx + 24 + third * 2, y, third, bh, tr('listo'), () => { soltarTodo(); cerrarPanel(); }, { tam: 13, c: VERDE });
}
const CELESTE_B = '#9ad4ee';

// ---------- escenas: título, tarjeta de capítulo, láminas, fin ----------
let _cielo = null;
function cieloRio(g, t, noche) {
  const hz = H * (H > W ? 0.5 : 0.56), sx = W * 0.74, sy = hz - H * 0.08, k = W.toFixed(1) + 'x' + H.toFixed(1) + K + noche;
  if (!_cielo || _cielo.k !== k) {
    const [c, b] = lienzoK(W, H);
    const gr = b.createLinearGradient(0, 0, 0, hz); gr.addColorStop(0, noche ? '#1a2240' : '#7cc4ec'); gr.addColorStop(1, noche ? '#4a4a78' : '#ffe2b4'); b.fillStyle = gr; b.fillRect(0, 0, W, hz + 2);
    const sg = b.createRadialGradient(sx, sy, 4, sx, sy, 120); sg.addColorStop(0, noche ? 'rgba(255,250,220,0.5)' : 'rgba(255,246,200,0.95)'); sg.addColorStop(1, 'rgba(255,246,200,0)'); b.fillStyle = sg; b.fillRect(sx - 120, sy - 120, 240, 240);
    elip(b, sx, sy, 26, 26); pintar(b, noche ? '#f4f0dc' : '#fff4c8');
    for (let q = 0; q < 4; q++) { const ix = W * (0.08 + q * 0.3), iw = W * 0.18; elip(b, ix, hz, iw, 9); pintar(b, noche ? '#2a3a50' : '#7aae96'); for (let j = 0; j < 4; j++) { elip(b, ix - iw * 0.6 + j * iw * 0.4, hz - 8 - (j % 2) * 4, 9, 8); pintar(b, noche ? '#24344a' : '#6a9e86'); } }
    const dx = W * 0.2, dy = hz - 4;
    rr(b, dx - 16, dy - 8, 32, 8, 2); pintar(b, noche ? '#3a3a4a' : '#9a8a6a'); trazo(b, [dx + 4, dy - 8, dx + 14, dy - 20, dx + 18, dy - 14], noche ? '#3a3a4a' : '#9a8a6a', 2);
    const ag = b.createLinearGradient(0, hz, 0, H); ag.addColorStop(0, noche ? '#2a4a6a' : '#5ab4e0'); ag.addColorStop(1, noche ? '#142838' : '#2a7ab0'); b.fillStyle = ag; b.fillRect(0, hz, W, H - hz);
    _cielo = { k, c };
  }
  g.drawImage(_cielo.c, 0, 0, W, H);
  for (let q = 0; q < 4; q++) { const cx = ((q * 173 + t * 6) % (W + 160)) - 80, cy = 40 + q * 26 % 90; for (const [ox, r] of [[0, 18], [16, 14], [-16, 12], [30, 10]]) { elip(g, cx + ox, cy, r, r * 0.6); pintar(g, noche ? 'rgba(90,96,140,0.6)' : 'rgba(255,255,255,0.85)'); } }
  if (Math.sin(t * 3) > 0) { elip(g, W * 0.2 - 8, hz - 15, 2, 2); pintar(g, '#ffd040'); }
  g.strokeStyle = 'rgba(255,255,255,0.3)'; g.lineWidth = 1.5; g.beginPath();
  for (let q = 0; q < 26; q++) { const wy = hz + 8 + (q * 37) % (H - hz - 8), wx = ((q * 97 + t * (14 + (wy - hz) * 0.08)) % (W + 40)) - 20, s = 0.5 + (wy - hz) / (H - hz); g.moveTo(wx, wy); g.quadraticCurveTo(wx + 7 * s, wy - 3 * s, wx + 14 * s, wy); }
  g.stroke();
  return hz;
}
function juncos(g, x, y, n, t, esc) {
  for (let k = 0; k < n; k++) { const bx = x + k * 7 * esc, h = (40 + (k * 37) % 30) * esc, sw = Math.sin(t * 1.4 + k) * 3 * esc; trazo(g, [bx, y, bx + sw, y - h], k % 2 ? '#3e7a34' : '#5aa048', 3 * esc); if (k % 3 === 0) { elip(g, bx + sw, y - h - 4 * esc, 2.5 * esc, 7 * esc); pintar(g, '#7a5232'); } }
}
const _letras = {};
function selloLetra(c, tam) {
  const k = c + tam.toFixed(1) + '_' + K;
  let s = _letras[k];
  if (s) return s;
  const fnt = '700 ' + tam.toFixed(1) + 'px Fredoka,"Trebuchet MS",sans-serif', m = document.createElement('canvas').getContext('2d');
  m.font = fnt;
  const w = m.measureText(c).width, W2 = w + tam * 0.6, H2 = tam * 1.7, ox = tam * 0.3, oy = tam * 0.85;
  const [cv, g] = lienzoK(W2, H2);
  g.font = fnt; g.textBaseline = 'middle'; g.textAlign = 'left'; g.direction = 'ltr'; g.lineJoin = 'round'; g.lineWidth = tam * 0.2; g.strokeStyle = LINEA; g.fillStyle = LINEA;
  g.fillText(c, ox, oy + tam * 0.08); g.strokeText(c, ox, oy + tam * 0.08); g.strokeText(c, ox, oy);
  const gr = g.createLinearGradient(0, oy - tam * 0.4, 0, oy + tam * 0.4); gr.addColorStop(0, '#c8f07a'); gr.addColorStop(0.55, '#5abf4a'); gr.addColorStop(1, '#2e8a3a');
  g.fillStyle = gr; g.fillText(c, ox, oy);
  if (c === 'O') { const fx = ox + w / 2, fy = oy - tam * 0.36; for (let q = 0; q < 5; q++) { elip(g, fx + Math.cos(q * 1.26) * tam * 0.07, fy + Math.sin(q * 1.26) * tam * 0.06, tam * 0.055, tam * 0.045); pintar(g, '#c890e8', LINEA, 1); } elip(g, fx, fy, tam * 0.03, tam * 0.03); pintar(g, '#ffe060'); }
  return (_letras[k] = { c: cv, w, W2, H2, ox, oy });
}
function logo(g, cx, cy, tam) {
  const ls = Array.from('CAMALOTE').map(c => selloLetra(c, tam)), total = ls.reduce((a, s) => a + s.w, 0) + 7 * tam * 0.02;
  let x = cx - total / 2;
  ls.forEach((s, i) => {
    const y = cy + Math.sin(T * 2.2 + i * 0.7) * tam * 0.06, rot = Math.sin(T * 1.7 + i) * 0.04;
    g.save(); g.translate(x + s.w / 2, y); g.rotate(rot); g.drawImage(s.c, -s.w / 2 - s.ox, -s.oy, s.W2, s.H2); g.restore();
    x += s.w + tam * 0.02;
  });
}
function escenaTitulo(g) {
  const hz = cieloRio(g, T, false), port = H > W;
  // el camalote con Pancho arriba y Tereso volando
  const bx = W * (port ? 0.5 : 0.17) + Math.sin(T * 0.4) * 10, by = Math.min(H * (port ? 0.62 : 0.8), hz + (H - hz) * (port ? 0.45 : 0.62)) + Math.sin(T * 1.3) * 2;
  g.save(); g.translate(bx, by); const es = Math.min(W, H) / 230; g.scale(es, es);
  camaloteArte(g, 0, 8, 2.2, T);
  capy(g, -6, 2, 'r', T, Object.assign({}, PIELES.pancho, { escala: 1.2 }));
  tero(g, 30 + Math.cos(T * 0.9) * 26, -26 + Math.sin(T * 1.8) * 8, Math.sin(T * 0.9) > 0 ? 'l' : 'r', T, true, 1.1);
  g.restore();
  juncos(g, -6, H + 4, 9, T, 1.1); juncos(g, W - 54, H + 4, 9, T + 2, 1.1);
  const tl = Math.min(W * 0.15, 66), ly = port ? H * 0.17 : H * 0.18;
  logo(g, W / 2, ly, tl);
  const sub = tr('subtitulo'), sw = Math.min(W - 40, anchoTxt(g, sub, { tam: 15 }) + 40);
  rr(g, W / 2 - sw / 2, ly + tl * 0.62, sw, 26, 13); pintar(g, CREMA, LINEA, 2);
  txt(g, sub, W / 2, ly + tl * 0.62 + 13.5, { tam: 15, c: LINEA, al: 0.5, max: sw - 20 });
  if (!PANEL) {
    const hay = HAY_PARTIDA && !G.fin, bw = Math.min(W - 70, 270), bh = 50, x = W / 2 - bw / 2;
    let y = port ? Math.max(by + 70 * Math.min(W, H) / 300, H - 200) : H - 128;
    if (!port) y = Math.min(y, H - 128);
    boton(g, x, y, bw, bh, hay ? tr('continuar') : tr('jugar'), () => (hay ? continuarPartida() : nuevaPartida()), { c: VERDE, tam: 21, ic: 'flecha2', icS: 1.2 });
    const y2 = y + bh + 14, w2 = hay ? (bw - 10) / 2 : bw;
    if (hay) boton(g, x, y2, w2, 40, tr('nueva'), () => abrirPanel('confirmar', { s: tr('borrarSeguro'), si: nuevaPartida }), { tam: 14, c: CREMA });
    boton(g, hay ? x + w2 + 10 : x, y2, w2, 40, tr('album'), () => abrirPanel('album'), { tam: 14, c: '#ffc890', ic: 'libro', icS: 0.9 });
    botonRedondo(g, W - 26, 26, 18, 'globo', () => abrirPanel('idioma'));
    botonRedondo(g, W - 66, 26, 18, 'engranaje', () => abrirPanel('opciones'));
  }
}
// después de la intro: elegir el idioma (el cartel va pasando por los 13 idiomas)
function enIdioma(cod, fn) { const v = IDIOMA; IDIOMA = cod; try { fn(); } finally { IDIOMA = v; } }
function escenaIdioma(g) {
  cieloRio(g, T, false);
  g.fillStyle = 'rgba(8,24,18,0.5)'; g.fillRect(0, 0, W, H);
  const port = H > W * 1.1, tl = port ? Math.min(W * 0.11, 44) : 30;
  logo(g, W / 2, port ? H * 0.1 : 30, tl);
  const cods = IDIOMAS.map(l => l[0]), per = 1.6, i = Math.floor(T / per) % cods.length, k = (T % per) / per, a = Math.max(0, Math.min(1, k / 0.15, (1 - k) / 0.15));
  const yP = port ? H * 0.19 : 66;
  enIdioma(cods[i], () => { g.globalAlpha = a; txt(g, ELEGI_IDIOMA[cods[i]], W / 2, yP, { tam: 19, c: '#fff4dc', b: LINEA, bw: 4.5, al: 0.5, max: W - 40 }); g.globalAlpha = 1; });
  const cols = port ? 2 : 3, filas = Math.ceil(IDIOMAS.length / cols), gap = port ? 9 : 7;
  const y0 = yP + (port ? 32 : 22), alto = H - y0 - (port ? 24 : 10);
  const bh = Math.min(port ? 46 : 38, (alto - gap * (filas - 1)) / filas), bw = Math.min(port ? 160 : 190, (W - 32 - gap * (cols - 1)) / cols);
  const x0 = W / 2 - (cols * bw + (cols - 1) * gap) / 2, resto = IDIOMAS.length % cols;
  IDIOMAS.forEach(([cod, nom], j) => {
    const f = Math.floor(j / cols), ultima = resto && f === filas - 1, x = x0 + (j % cols) * (bw + gap) + (ultima ? (cols - resto) * (bw + gap) / 2 : 0), y = y0 + f * (bh + gap);
    const sel = cod === IDIOMA;
    enIdioma(cod, () => boton(g, x, y, bw, bh, nom, () => elegirIdioma(cod), { c: sel ? VERDE : CREMA, tam: Math.min(16, bh * 0.4) }));
  });
}
function escenaTarjeta(g) {
  const k = TARJ.t, gr = g.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, Math.max(W, H) * 0.7);
  gr.addColorStop(0, '#fbf1da'); gr.addColorStop(1, '#e8d2a6'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const cx = W / 2, cy = H * (H > W ? 0.38 : 0.34), r = Math.min(W, H) * 0.2 * rebote(Math.min(1, k / 0.5));
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + k * 0.2; elip(g, cx + Math.cos(a) * r * 1.25, cy + Math.sin(a) * r * 1.25, r * 0.32, r * 0.22, a); pintar(g, '#6ab04a', LINEA, 1.5); }
  elip(g, cx, cy, r, r); pintar(g, ['#5ab04a', '#e8b030', '#4a6a9a'][TARJ.cap - 1], LINEA, 3);
  txt(g, TARJ.cap, cx, cy + 3, { tam: r * 1.1, c: '#fff4dc', b: LINEA, bw: 6, al: 0.5 });
  const a = suave((k - 0.3) / 0.4), r0 = Math.min(W, H) * 0.2, ty = cy + r0 * 1.62;
  g.globalAlpha = a;
  txt(g, tr('capitulo', TARJ.cap), cx, ty + 14, { tam: 16, c: TINTA2, al: 0.5, max: W - 40 });
  txt(g, tr('cap' + TARJ.cap), cx, ty + 46, { tam: 32, c: LINEA, al: 0.5, max: W - 40 });
  juncos(g, cx - 120, ty + 70, 4, T, 0.45); juncos(g, cx + 100, ty + 70, 4, T + 1, 0.45);
  g.globalAlpha = 1;
  if (k > 1.2) txt(g, tr('tocar'), cx, H - 30, { tam: 13, c: rgba('#6a5a4a', 0.5 + 0.4 * Math.sin(T * 5)), al: 0.5, max: W - 30 });
  zona(0, 0, W, H, () => { if (TARJ.t > 0.8) salirTarjeta(); });
}
function escenaLaminas(g) {
  const L = LAM, p = L.lista[L.i], port = H > W * 1.1;
  g.fillStyle = PAPEL; g.fillRect(0, 0, W, H);
  for (let k = 0; k < 30; k++) { g.fillStyle = 'rgba(160,130,90,0.05)'; g.fillRect(0, (k * 23) % H, W, 1); }
  const ax = 16, ay = 16, aw = port ? W - 32 : W * 0.55, ah = port ? Math.min(W - 32, H * 0.5) : H - 32;
  g.save(); rr(g, ax, ay, aw, ah, 16); g.clip(); lamina(g, p[0], ax, ay, aw, ah, T); g.restore();
  rr(g, ax, ay, aw, ah, 16); g.strokeStyle = LINEA; g.lineWidth = 3; g.stroke();
  const tx = port ? 22 : ax + aw + 20, ty = port ? ay + ah + 20 : 30, tw = port ? W - 44 : W - tx - 20;
  const fade = suave(Math.min(1, L.t / 0.4));
  g.globalAlpha = fade;
  let y = ty;
  if (p[1]) { retrato(g, p[1], tx + 22, y + 22, 22); txt(g, tr('n_' + p[1]), tx + 52, y + 22, { tam: 15, c: COLOR_VOZ[p[1]] || LINEA, b: '#fff4dc', bw: 3, max: tw - 60 }); y += 54; }
  parrafo(g, tr(p[2]), tx, y, tw, { tam: port ? 17 : 15.5, peso: 500, c: LINEA });
  g.globalAlpha = 1;
  const n = L.lista.length, dy = H - 22, dx0 = (port ? W / 2 : tx + tw / 2) - (n - 1) * 8;
  for (let i = 0; i < n; i++) { elip(g, dx0 + i * 16, dy, i === L.i ? 5 : 3.5, i === L.i ? 5 : 3.5); pintar(g, i === L.i ? '#5ab04a' : '#c8b898', LINEA, 1.2); }
  if (L.t > 0.8) txt(g, tr('tocar'), port ? W / 2 : tx + tw / 2, H - 44, { tam: 12, c: rgba('#6a5a4a', 0.5 + 0.4 * Math.sin(T * 5)), al: 0.5, max: tw });
  zona(0, 0, W, H, () => avanzarLamina());
  boton(g, ax + aw - 100, ay + 10, 90, 30, tr('saltar'), () => { L.i = n - 1; avanzarLamina(true); }, { tam: 13, c: 'rgba(255,244,220,0.9)' });
}
function escenaFin(g) {
  const lh = Math.min(H * 0.62, Math.min(W, H) * 1.05);
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#7ac0e8'); gr.addColorStop(1, '#d8f0c8'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  lamina(g, 'reserva', 0, H - lh, W, lh, T);
  const pw = Math.min(W - 40, 320), ph = 250, px = (W - pw) / 2, py = H > W ? H * 0.12 : (H - ph) / 2 - 10;
  tarjeta(g, px, py, pw, ph, tr('fin'), { cinta: '#e8883a' });
  txt(g, tr('gracias'), W / 2, py + 40, { tam: 19, c: LINEA, al: 0.5, max: pw - 30 });
  txt(g, tr('tiempo') + ': ' + fmtT(G.tiempo || 0), W / 2, py + 76, { tam: 15, c: TINTA2, al: 0.5, max: pw - 30 });
  icono(g, 'figurita', W / 2 - 30, py + 104, 0.85); txt(g, nFigus() + '/9', W / 2 - 16, py + 105, { tam: 17, c: LINEA });
  boton(g, px + 22, py + ph - 108, pw - 44, 40, tr('album'), () => abrirPanel('album'), { c: '#ffc890', ic: 'libro', icS: 0.9 });
  boton(g, px + 22, py + ph - 58, pw - 44, 40, tr('menu'), () => irA('titulo', () => Sonido.musica(0)), { c: VERDE, ic: 'casa' });
}
// el telón de agua: sube la crecida, cambia la escena y baja
function dibujarTelon(g) {
  if (!TELON.fase) return;
  const k = suave(TELON.t), top = H - k * (H + 70);
  for (const [o, col, a] of [[18, '#2a78b0', 1], [0, '#4aa8d8', 1]]) {
    g.beginPath(); g.moveTo(0, H + 10);
    for (let x = 0; x <= W + 10; x += 10) g.lineTo(x, top + o + Math.sin(x * 0.03 + T * 4 + o) * 9 + Math.sin(x * 0.07 - T * 3) * 4);
    g.lineTo(W + 10, H + 10); g.closePath(); g.fillStyle = col; g.globalAlpha = a; g.fill();
  }
  g.globalAlpha = 1;
  g.beginPath(); for (let x = 0; x <= W + 10; x += 10) { const y = top + Math.sin(x * 0.03 + T * 4) * 9 + Math.sin(x * 0.07 - T * 3) * 4; x ? g.lineTo(x, y) : g.moveTo(x, y); }
  g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 3; g.stroke();
  if (top > -40 && top < H) camaloteArte(g, W * 0.3 + Math.sin(T) * 20, top + Math.sin(W * 0.3 * 0.03 + T * 4) * 9 - 4, 1.4, T);
}
// la portada 9:16: lo importante (título, Pancho, Tereso y Lola) adentro de la caja 3:4 del centro
function portada() { ESCENA = 'portada'; CONGELADO = true; T = 2.15; }
function escenaPortada(g) {
  const hz = cieloRio(g, T, false), k = W / 360;
  // la draga de Don Cemento en el horizonte, con su luz amarilla
  const dx = W * 0.2, dy = hz - 2, gl = g.createRadialGradient(dx - 10, dy - 22, 2, dx - 10, dy - 22, 60);
  gl.addColorStop(0, 'rgba(255,214,90,0.75)'); gl.addColorStop(1, 'rgba(255,214,90,0)'); g.fillStyle = gl; g.fillRect(dx - 70, dy - 82, 120, 120);
  rr(g, dx - 34, dy - 14, 68, 14, 3); pintar(g, '#8a7a5a'); rr(g, dx - 26, dy - 26, 20, 12, 2); pintar(g, '#7a6a4a');
  trazo(g, [dx + 8, dy - 14, dx + 30, dy - 40, dx + 40, dy - 28], '#7a6a4a', 3.5); elip(g, dx - 16, dy - 22, 3, 3); pintar(g, '#ffe070');
  // Lola a lo lejos, en su camalote, río abajo
  g.save(); g.translate(W * 0.82, hz + (H - hz) * 0.2); g.scale(k, k);
  camaloteArte(g, 0, 6, 1.35, T); capy(g, -2, 0, 'l', T, Object.assign({}, PIELES.lola, { escala: 0.95 }));
  g.restore();
  // la orilla de adelante, con juncos
  const oy = H * 0.7;
  g.fillStyle = '#4a9a3c'; g.beginPath(); g.moveTo(0, oy + 20); g.quadraticCurveTo(W * 0.5, oy - 30, W, oy + 10); g.lineTo(W, H); g.lineTo(0, H); g.closePath(); g.fill();
  g.fillStyle = patron('pasto'); g.beginPath(); g.moveTo(0, oy + 28); g.quadraticCurveTo(W * 0.5, oy - 22, W, oy + 18); g.lineTo(W, H); g.lineTo(0, H); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(0, oy + 20); g.quadraticCurveTo(W * 0.5, oy - 30, W, oy + 10); g.stroke();
  for (let i = 0; i < 6; i++) { const fx = 30 + i * 58, fy = oy + 60 + (i % 2) * 40; flor(g, fx, fy); }
  // Pancho embistiendo, con polvo y rayas de velocidad
  const px = W * 0.42, py = oy + 70;
  for (let i = 0; i < 7; i++) { elip(g, px - 50 - i * 16, py - 6 - (i % 3) * 5, 12 - i, 9 - i * 0.8); pintar(g, 'rgba(240,228,200,' + (0.75 - i * 0.09) + ')'); }
  for (let i = 0; i < 4; i++) trazo(g, [px - 70 - i * 6, py - 58 + i * 14, px - 120 - i * 10, py - 58 + i * 14], 'rgba(255,255,255,0.8)', 3);
  sombra(g, px, py, 32, 0.3);
  capy(g, px, py, 'r', T, Object.assign({}, PIELES.pancho, { escala: 3, dash: true, anim: 1.2, mov: 1 }));
  // Tereso guía hacia Lola y los mosquitos escapan
  tero(g, W * 0.6, oy - 46, 'r', T, true, 2.3);
  mosquito(g, W * 0.86, oy + 30, 'r', T, 2.2); mosquito(g, W * 0.92, oy - 10, 'r', T + 1, 1.8);
  juncos(g, -8, H + 6, 6, T, 1.5); juncos(g, W - 40, H + 6, 6, T + 2, 1.5);
  // el título, compuesto aparte
  const ly = H * 0.215, tl = Math.min(W * 0.17, 66);
  logo(g, W / 2, ly, tl);
  const sub = tr('subtitulo'), sw = Math.min(W - 40, anchoTxt(g, sub, { tam: 16 }) + 44);
  rr(g, W / 2 - sw / 2, ly + tl * 0.62, sw, 28, 14); pintar(g, CREMA, LINEA, 2);
  txt(g, sub, W / 2, ly + tl * 0.62 + 14.5, { tam: 16, c: LINEA, al: 0.5, max: sw - 20 });
}
