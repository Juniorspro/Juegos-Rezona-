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
