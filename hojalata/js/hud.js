// HOJALATA — lo que se ve encima de la carrera: medalla del puesto, vueltas y reloj, la cajita del ítem con su
// ruleta, la cuerda alrededor del botón de turbo, tornillos, el mapita con los autitos, la cuenta regresiva con
// "¡dale cuerda!", carteles (última vuelta, al revés, meta) y las caras de los corredores.
let CARAS_CV = null;
function caraUI(g, id, x, y, r, gesto, borde) {
  const D = PERSONAJES[id], C = 96, col = (gesto || 0) * 2, fila = D.fila;
  const s = sello('cara' + id + (gesto || 0) + r.toFixed(1) + (borde || ''), r * 2 + 6, r * 2 + 6, b => {
    const c = r + 3;
    b.fillStyle = borde || D.c1; b.beginPath(); b.arc(c, c, r + 2, 0, TAU); b.fill();
    b.save(); b.beginPath(); b.arc(c, c, r, 0, TAU); b.clip();
    b.fillStyle = D.pelo; b.fillRect(0, 0, r * 2 + 6, r * 2 + 6);
    b.fillStyle = D.piel; b.beginPath(); b.arc(c, c + r * 0.25, r * 0.92, 0, TAU); b.fill();
    if (CARAS_CV) b.drawImage(CARAS_CV, col * C, fila * C, C, C, c - r * 0.95, c - r * 0.6, r * 1.9, r * 1.9);
    b.restore();
    b.lineWidth = 1.5; b.strokeStyle = TINTA; b.beginPath(); b.arc(c, c, r + 2, 0, TAU); b.stroke();
  });
  g.drawImage(s, x - r - 3, y - r - 3, s.width / S, s.height / S);
}
function sufijo(n) { return tr('pos' + Math.min(n, 6)); }
function medallaPuesto(g, x, y, p) {
  const col = p === 0 ? ORO : p === 1 ? PLATA : p === 2 ? '#c87a4a' : CREMA2, r = 28;
  const s = sello('medalla' + p, r * 2 + 12, r * 2 + 14, b => {
    const c = r + 6;
    b.fillStyle = 'rgba(16,12,24,0.35)'; b.beginPath(); b.arc(c + 1, c + 4, r, 0, TAU); b.fill();
    for (let k = 0; k < 16; k++) { const a = k / 16 * TAU; b.fillStyle = mezcla(col, '#000000', 0.25); b.beginPath(); b.arc(c + Math.cos(a) * r * 0.92, c + Math.sin(a) * r * 0.92, r * 0.18, 0, TAU); b.fill(); }
    const gr = b.createRadialGradient(c - r * 0.3, c - r * 0.35, r * 0.1, c, c, r); gr.addColorStop(0, mezcla(col, '#ffffff', 0.55)); gr.addColorStop(0.7, col); gr.addColorStop(1, mezcla(col, '#000000', 0.3));
    b.fillStyle = gr; b.beginPath(); b.arc(c, c, r * 0.86, 0, TAU); b.fill();
    b.lineWidth = 1.5; b.strokeStyle = 'rgba(27,26,46,0.6)'; b.beginPath(); b.arc(c, c, r * 0.7, 0, TAU); b.stroke();
  });
  g.drawImage(s, x - r - 6, y - r - 6, s.width / S, s.height / S);
  txtR(g, String(p + 1), x - 4, y + 1, { tam: 26, c: TINTA, osc: 'rgba(255,255,255,0.6)', al: 0.5, dx: 1, dy: 1.2 });
  txt(g, sufijo(p + 1), x + 11, y - 9, { tam: 10, c: TINTA, b: null, al: 0.5 });
}
// el mapita: la pista en un sello; los autitos, puntos encima
function mapita(g, x, y, t) {
  const K = CAR, M = K.S.mapa;
  const s = sello('mapa' + K.cfg.pista + t, t + 12, t + 12, b => {
    b.fillStyle = 'rgba(27,26,46,0.35)'; caminoRedondo(b, 2, 2, t + 8, t + 8, 10); b.fill();
    b.lineJoin = 'round'; b.lineCap = 'round';
    b.beginPath(); M.pts.forEach(([px, pz], i) => { const X = 6 + t / 2 + px * t * 0.9, Y = 6 + t / 2 + pz * t * 0.9; if (i) b.lineTo(X, Y); else b.moveTo(X, Y); }); b.closePath();
    b.strokeStyle = 'rgba(27,26,46,0.85)'; b.lineWidth = 6; b.stroke(); b.strokeStyle = CREMA; b.lineWidth = 3.2; b.stroke();
  });
  g.drawImage(s, x - 6, y - 6, s.width / S, s.height / S);
  const P = (A) => { const m = marcoEn(K.C, A.s); return [x + t / 2 + (m.px - M.cx) * M.esc * t * 0.9, y + t / 2 + (m.pz - M.cz) * M.esc * t * 0.9]; };
  for (const A of K.autos) { if (A.humano) continue; const [px, py] = P(A); g.fillStyle = PERSONAJES[A.id].c1; g.beginPath(); g.arc(px, py, 3.2, 0, TAU); g.fill(); g.lineWidth = 1; g.strokeStyle = TINTA; g.stroke(); }
  const [px, py] = P(K.yo); g.fillStyle = BLANCO; g.beginPath(); g.arc(px, py, 4.6, 0, TAU); g.fill(); g.fillStyle = PERSONAJES[K.yo.id].c1; g.beginPath(); g.arc(px, py, 3.2, 0, TAU); g.fill();
}
function cajaItem(g, x, y, t) {
  const A = CAR.yo;
  chapaS(g, x, y, t, t, CREMA, { r: 9, sombra: 3, remaches: true });
  let ic = A.item;
  if (A.ruleta > 0) ic = ITEMS[Math.floor(T * 14) % ITEMS.length];
  if (ic) { const col = { canica: CELESTE, boton: ROJO, resorte: PLATA, llave: ORO, pompa: ROSA }[ic]; g.save(); if (A.ruleta > 0) { g.globalAlpha = 0.75; } icono(g, ic, x + t / 2, y + t / 2, t * 0.55, TINTA); g.restore(); g.fillStyle = rgba(col, 0.25); caminoRedondo(g, x + 5, y + 5, t - 10, t - 10, 6); g.fill(); }
  if (CAR.cfg.modo === 'contra' && A.llaves > 0) txt(g, '×' + (A.llaves + (A.item ? 1 : 0)), x + t - 4, y + t - 6, { tam: 10, c: TINTA, b: CREMA, al: 1 });
  if (TACTIL) zona(x, y, t, t, () => { apretar('B'); setTimeout(() => soltarB('B'), 60); });
}
// encima de los botones: la cuerda en el C, el nivel del derrape en el A
function estadoCtl(g, id, x, y, r) {
  if (!CAR || CAR.fase === 'presenta') return;
  const A = CAR.yo;
  if (id === 'C') {
    const c = A.cuerda, listo = c >= 0.2;
    g.beginPath(); g.arc(x, y, r + 5, -PI / 2, -PI / 2 + TAU * c); g.lineWidth = 5; g.strokeStyle = listo ? (c > 0.95 ? ROJO : AMARILLO) : '#8a8f9a'; g.stroke();
    if (CAR.fase === 'cuenta') { const k = 1 + Math.sin(T * 12) * 0.08; g.save(); g.translate(x, y - r - 18); g.scale(k, k); cinta(g, 0, -10, tr('daleCuerda'), { tam: 9, c: ROJO }); g.restore(); }
  } else if (id === 'A' && A.derr.on && A.derr.nivel) { g.beginPath(); g.arc(x, y, r + 5, 0, TAU); g.lineWidth = 4; g.strokeStyle = A.derr.nivel === 2 ? NARANJA : CELESTE; g.stroke(); }
  else if (id === 'B' && A.item && A.ruleta <= 0) { g.save(); g.globalAlpha *= 0.9; icono(g, A.item, x + r * 0.55, y - r * 0.55, r * 0.5, BLANCO); g.restore(); }
}
function hudCarrera(g) {
  const K = CAR, A = K.yo, ap = W > H;
  if (K.fase === 'presenta') {
    const P = K.S.P;
    cinta(g, W / 2, H * 0.14, tr('pista_' + P.id), { tam: 18, c: AZUL });
    txtR(g, tr('vueltasN', K.vueltas), W / 2, H * 0.14 + 52, { tam: 12, c: CREMA, al: 0.5 });
    if (Math.sin(T * 5) > -0.3) txtR(g, tr('toca'), W / 2, H - 40, { tam: 10, c: CREMA, al: 0.5 });
    zona(0, 0, W, H, () => { K.saltarPres = true; });
    return;
  }
  // arriba: medalla, vuelta y reloj, ítem
  medallaPuesto(g, 40, 44, A.pos);
  const vu = clamp(A.vuelta + 1, 1, K.vueltas);
  const sv = sello('placaVuelta' + vu + '/' + K.vueltas + IDIOMA, 112, 60, b => { chapa(b, 3, 2, 104, 50, AZUL, { r: 8, sombra: 3 }); txtR(b, tr('vuelta') + ' ' + vu + '/' + K.vueltas, 55, 18, { tam: 11, c: CREMA, al: 0.5, max: 94 }); });
  g.drawImage(sv, 73, 14, sv.width / S, sv.height / S);
  txtNum(g, fmtCrono(K.reloj), 128, 52, { tam: 12, c: AMARILLO, b: null, al: 0.5 });
  cajaItem(g, W - 108, 12, 54);
  boton(g, W - 46, 12, 36, 36, null, () => abrirPanel('pausa'), { ic: 'pausa', it: 13, sombra: 2.5, c: CREMA });
  // tornillos y mapita
  icono(g, 'tornillo', W - 100, 80, 12, CREMA); txtR(g, '×' + A.tornillos, W - 90, 80, { tam: 11, c: CREMA, al: 0 });
  if (!ap || H > 330) mapita(g, 12, 82, ap ? 70 : 84);
  // contrarreloj: fantasma y mejor vuelta
  if (K.cfg.modo === 'contra') { const f = K.fantasma; txtR(g, tr('mejorVuelta') + ' ' + (f ? fmtCrono(f.t) : '--'), W / 2, 84, { tam: 10, c: CREMA, al: 0.5 }); }
  // cuenta regresiva
  if (K.fase === 'cuenta' || (K.fase === 'carrera' && K.tFase < 0.8)) {
    const n = K.fase === 'cuenta' ? 3 - Math.floor(K.tFase) : 0, f = K.fase === 'cuenta' ? K.tFase % 1 : K.tFase / 0.8, k = rebote(clamp(f / 0.25, 0, 1)) * (1 - clamp((f - 0.75) / 0.25, 0, 1) * (n ? 1 : 0));
    g.save(); g.translate(W / 2, H * 0.36); g.scale(k, k);
    const s = n ? String(n) : tr('ya');
    chapaS(g, -60, -42, 120, 84, n ? [ROJO, AMARILLO, VERDE][3 - n] || ROJO : VERDE, { r: 20, sombra: 6, borde: 4, remaches: true });
    txtR(g, s, 0, 2, { tam: n ? 50 : 30, c: CREMA, al: 0.5, max: 110, dx: 2, dy: 3 });
    g.restore();
    if (K.fase === 'cuenta' && TACTIL && A.carga > 0) { for (let k2 = 0; k2 < Math.min(14, A.carga); k2++) { g.fillStyle = k2 >= 5 && k2 <= 11 ? VERDE : k2 > 11 ? ROJO : AMARILLO; g.fillRect(W / 2 - 70 + k2 * 10, H * 0.36 + 56, 8, 8); } }
    if (K.fase === 'cuenta' && !TACTIL) txtR(g, tr('teclaCuerda'), W / 2, H * 0.36 + 70, { tam: 10, c: CREMA, al: 0.5, max: W - 20 });
  }
  // carteles
  let yM = H * 0.24;
  for (const m of K.msj) {
    const k = rebote(clamp(m.t / 0.25, 0, 1)), a = clamp((m.dur - m.t) / 0.3, 0, 1);
    g.globalAlpha = a; g.save(); g.translate(W / 2, yM); g.scale(k, k);
    cinta(g, 0, -14, tr(m.k, m.extra), { tam: m.k === 'meta' ? 20 : 14, c: m.k === 'uy' ? ROJO : m.k === 'meta' ? VERDE : m.k === 'ultimaVuelta' ? ROJO : AZUL });
    g.restore(); g.globalAlpha = 1; yM += 46;
  }
  if (A.alReves > 1.2 && K.fase === 'carrera') { const k = Math.sin(T * 8) > 0; if (k) cinta(g, W / 2, H * 0.42, tr('alReves'), { tam: 16, c: ROJO }); }
  if (K.fase === 'final') { const p = A.pos; txtR(g, (p + 1) + sufijo(p + 1), W / 2, H * 0.36, { tam: 44, c: p === 0 ? ORO : CREMA, al: 0.5, dx: 2, dy: 3 }); }
  if (!TACTIL && K.reloj < 7 && K.fase === 'carrera') txtR(g, tr('teclas'), W / 2, H - 16, { tam: 9, c: CREMA, al: 0.5, max: W - 16 });
}
function fmtCrono(s) { s = Math.max(0, s); const m = Math.floor(s / 60), r = s - m * 60; return m + ':' + (r < 10 ? '0' : '') + r.toFixed(2); }
