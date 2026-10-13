// FAMATINA — el mundo: cielo, superficie, la mina por dentro, luces y partículas (todo a la resolución del juego)
const CAM = { y: 0, vy: 0, obj: null };
let mundoCv, mundoG, luzCv, luzG, objCv, objG;
let LUCES = [], BRILLOS = [];
const PART = [];
const SAC = { t: 0, amp: 0 };
let CALIDAD = 'alta';
function ctx2(c) { const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return g; }
function prepararMundo() {
  mundoCv = lienzo(W, H + 2); mundoG = ctx2(mundoCv);
  luzCv = lienzo(W, H + 2); luzG = ctx2(luzCv);
  objCv = lienzo(W, SUELO + 10); objG = ctx2(objCv);
  limpiarTexturas();
}
function altoMundo(m) { return Y0 + (m.d.niveles.length + 1) * NH + 26; }
function camMax(m) { return Math.max(0, altoMundo(m) + 30 - H); }
function camMin(m) { return Math.min(0, altoMundo(m) + 30 - H); }
function yNivel(i) { return Y0 + i * NH; }
function yJaula(p) { return p <= 1 ? lerp(SUELO - 24, Y0 + 14, p) : Y0 + 14 + (p - 1) * NH; }
function faseDia(m) { if (m && m.carrera) return 0.73; return (((G.reloj + G.desfase) / 480) % 1 + 1) % 1; }
function sacudir(amp, t) { if (amp >= SAC.amp || SAC.t <= 0) { SAC.amp = amp; SAC.t = t; } }

// ---------- partículas ----------
function part(o) {
  const tope = CALIDAD === 'baja' ? 160 : 520;
  if (PART.length >= tope) PART.shift();
  o.max = o.vida;
  PART.push(o);
}
function chispas(x, y, col, n) { for (let k = 0; k < (n || 4); k++) part({ x, y, vx: rnd(-40, 30), vy: rnd(-55, -10), g: 160, vida: rnd(0.15, 0.4), c: k % 2 ? col : '#fff4c0', em: 1 }); }
function polvo(x, y, n, col) { for (let k = 0; k < (n || 5); k++) part({ x: x + rnd(-3, 3), y: y + rnd(-2, 1), vx: rnd(-14, 14), vy: rnd(-10, -2), g: -2, vida: rnd(0.5, 1.1), c: col || '#a89080', t: 'polvo' }); }
function explosionEn(x, y, col) {
  for (let k = 0; k < 26; k++) part({ x, y, vx: rnd(-90, 90), vy: rnd(-110, -20), g: 220, vida: rnd(0.5, 1.2), c: k % 3 ? col : '#5a4a40', t: 'roca', suelo: y + 14 });
  for (let k = 0; k < 18; k++) part({ x: x + rnd(-10, 10), y: y + rnd(-6, 6), vx: rnd(-30, 30), vy: rnd(-30, 5), g: -6, vida: rnd(0.8, 1.8), c: '#b0a090', t: 'polvo' });
  for (let k = 0; k < 14; k++) part({ x, y, vx: rnd(-120, 120), vy: rnd(-120, 40), g: 60, vida: rnd(0.15, 0.45), c: '#ffe080', em: 1 });
  LUCES_EXTRA.push({ x, y, c: '#ffd080', r: 70, vida: 0.35, max: 0.35 });
}
let LUCES_EXTRA = [];
function pasoParticulas(dt) {
  let vivas = 0;   // se compacta en una pasada (splice dentro del bucle era cuadrático en las explosiones)
  for (let i = 0; i < PART.length; i++) {
    const p = PART[i];
    p.vida -= dt;
    if (p.vida <= 0) continue;
    p.vy += (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.t === 'humo' || p.t === 'polvo') { p.vx *= 1 - dt * 0.8; }
    if (p.suelo != null && p.y > p.suelo) { p.y = p.suelo; p.vy *= -0.3; p.vx *= 0.5; }
    PART[vivas++] = p;
  }
  PART.length = vivas;
  for (let i = LUCES_EXTRA.length - 1; i >= 0; i--) { LUCES_EXTRA[i].vida -= dt; if (LUCES_EXTRA[i].vida <= 0) LUCES_EXTRA.splice(i, 1); }
  if (SAC.t > 0) SAC.t -= dt;
}
function dibujarParticulas(g, cam, em) {
  for (const p of PART) {
    if (!!p.em !== !!em) continue;
    const k = p.vida / p.max, x = Math.round(p.x), y = Math.round(p.y - cam);
    if (y < -8 || y > H + 8) continue;
    if (p.t === 'polvo' || p.t === 'humo') {
      g.globalAlpha = k * (p.t === 'humo' ? 0.5 : 0.45);
      const r = p.t === 'humo' ? Math.round(1 + (1 - k) * 4) : Math.round(1 + (1 - k) * 2);
      g.fillStyle = p.c; g.fillRect(x - r, y - r, r * 2, r * 2);
      g.globalAlpha = 1;
    } else if (p.t === 'roca') { g.fillStyle = p.c; g.fillRect(x, y, 2, 2); }
    else if (p.t === 'confeti') { g.fillStyle = p.c; g.fillRect(x, y, Math.sin(p.vida * 20) > 0 ? 2 : 1, 1); }
    else if (p.t === 'hoja') { g.fillStyle = p.c; g.fillRect(x, y, 2, 1); g.fillRect(x + (Math.sin(p.vida * 9) > 0 ? 1 : 0), y - 1, 1, 1); }
    else if (p.t === 'brillo') { g.globalAlpha = k; g.fillStyle = p.c; g.fillRect(x, y - 1, 1, 3); g.fillRect(x - 1, y, 3, 1); g.globalAlpha = 1; }
    else { g.globalAlpha = Math.min(1, k * 2); g.fillStyle = p.c; g.fillRect(x, y, 1, 1); g.globalAlpha = 1; }
  }
}

// ---------- cielo ----------
const _estrellas = new Map();
function estrellas(m) {
  let e = _estrellas.get(m.id);
  if (e) return e;
  const r = rngSemilla(hashTxt(m.id + 'est'));
  e = [];
  for (let k = 0; k < 90; k++) e.push({ x: r(), y: r() * (SUELO - 30), v: 1 + r() * 3, f: r() * 6, c: r() < 0.2 ? '#ffe8c0' : '#ffffff' });
  _estrellas.set(m.id, e);
  return e;
}
const NUBES = [0, 1, 2, 3, 4].map(i => ({ x: (i * 0.23 + 0.05) % 1, y: 8 + i * 9 % 34, v: 0.004 + i * 0.0017, s: i % 3 }));
let _nubT = -1;
const nubTint = [];
function tintarCielo(m, fase) {
  const M = capasMontes(m), [, hor] = colorCielo(m, fase), td = tinteDia(fase);
  for (let i = 0; i < 3; i++) {
    const C = M.capas[i];
    if (Math.abs(C.t - fase) < 0.003 && C.m === m.id) continue;
    C.t = fase; C.m = m.id;
    const g = C.tint.getContext('2d');
    g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, C.tint.width, C.tint.height); g.drawImage(C.base, 0, 0);
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = rgba(hor, [0.42, 0.22, 0.08][i]); g.fillRect(0, 0, W, SUELO + 2);
    if (td.oro > 0) { g.fillStyle = rgba('#ff8a3a', td.oro * [0.18, 0.22, 0.24][i]); g.fillRect(0, 0, W, SUELO + 2); }
    if (td.noche > 0) { g.fillStyle = rgba('#0a0e2a', td.noche * [0.62, 0.68, 0.72][i]); g.fillRect(0, 0, W, SUELO + 2); }
  }
  if (Math.abs(_nubT - fase) > 0.003) {
    _nubT = fase;
    nubes().forEach((n, i) => {
      const c = nubTint[i] || (nubTint[i] = lienzo(n.width, n.height)), g = c.getContext('2d');
      g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, c.width, c.height); g.drawImage(n, 0, 0);
      g.globalCompositeOperation = 'source-atop';
      if (td.oro > 0) { g.fillStyle = rgba('#ff9a6a', td.oro * 0.55); g.fillRect(0, 0, c.width, c.height); }
      if (td.noche > 0) { g.fillStyle = rgba('#1a2050', td.noche * 0.8); g.fillRect(0, 0, c.width, c.height); }
    });
  }
}
function dibujarCielo(g, m, fase, cam, t) {
  const [top, hor] = colorCielo(m.def, fase), td = tinteDia(fase), yS = Y0 - cam;
  const gr = g.createLinearGradient(0, -cam, 0, SUELO - cam);
  gr.addColorStop(0, top); gr.addColorStop(1, hor);
  g.fillStyle = gr; g.fillRect(0, 0, W, Math.min(H + 2, yS));
  if (td.noche > 0.05) {
    for (const s of estrellas(m.def)) { const a = td.noche * (0.55 + 0.45 * Math.sin(t * s.v + s.f)); if (a > 0.2) { g.globalAlpha = a; px(g, s.x * W, s.y - cam * 0.4, s.c); } }
    g.globalAlpha = 1;
    if (m.def.nieve) for (let k = 0; k < 26; k++) {
      const x = (k / 26) * W + Math.sin(t * 0.3 + k) * 6, h = 18 + Math.sin(k * 1.7 + t * 0.5) * 8, y0 = 8 + Math.sin(k * 0.9 + t * 0.2) * 5 - cam * 0.4;
      const gg = g.createLinearGradient(0, y0, 0, y0 + h);
      gg.addColorStop(0, 'rgba(120,255,200,0)'); gg.addColorStop(0.6, `rgba(90,255,170,${0.22 * td.noche})`); gg.addColorStop(1, 'rgba(60,200,255,0)');
      g.fillStyle = gg; g.fillRect(Math.round(x), Math.round(y0), 4, Math.round(h));
    }
  }
  const sa = (fase - 0.24) / 0.6;
  if (sa > -0.05 && sa < 1.05) {
    const sx = lerp(-8, W + 8, sa), sy = SUELO - 18 - Math.sin(clamp(sa, 0, 1) * Math.PI) * 78 - cam * 0.4, col = mezcla('#fff6d8', '#ff8a4a', clamp(1 - Math.sin(clamp(sa, 0, 1) * Math.PI) * 1.6, 0, 1));
    disco(g, sx, sy, 5, col); BRILLOS.push({ x: sx, y: sy, c: col, r: 26, a: 0.5 });
  }
  const la = (((fase + 0.5) % 1) - 0.24) / 0.6;
  if (td.noche > 0.1 && la > -0.05 && la < 1.05) {
    const lx = lerp(W + 6, -6, la), ly = SUELO - 30 - Math.sin(clamp(la, 0, 1) * Math.PI) * 60 - cam * 0.4;
    disco(g, lx, ly, 4, '#eef0f8'); px(g, lx - 1, ly - 1, '#c8ccd8'); px(g, lx + 2, ly + 1, '#c8ccd8'); BRILLOS.push({ x: lx, y: ly, c: '#a8b8ff', r: 14, a: 0.35 * td.noche });
  }
  tintarCielo(m.def, fase);
  nubes();
  for (const n of NUBES) {
    const c = nubTint[n.s];
    if (!c) continue;
    const x = ((n.x + t * n.v) % 1.3) * (W + 60) - 50;
    g.drawImage(c, Math.round(x), Math.round(n.y - cam * 0.5));
  }
  const M = capasMontes(m.def), par = [0.5, 0.7, 0.85];
  for (let i = 0; i < 3; i++) {
    g.drawImage(M.capas[i].tint, 0, Math.round(cam < 0 ? -cam : -cam * par[i]));
    if (i === 0 && m.def.mar) {
      const x0 = Math.round(W * 0.6), y0 = Math.round(SUELO - 34 - (cam < 0 ? cam : cam * par[1]));
      rect(g, x0, y0, W - x0, 1, mezcla(hor, '#ffffff', 0.4));
      const sg = g.createLinearGradient(0, y0, 0, y0 + 30);
      sg.addColorStop(0, mezcla('#2a6a9a', hor, 0.35)); sg.addColorStop(1, td.noche > 0.5 ? '#0a1a30' : '#1a4a7a');
      g.fillStyle = sg; g.fillRect(x0, y0 + 1, W - x0, 30);
      for (let k = 0; k < 14; k++) { const xx = x0 + ((k * 37 + Math.floor(t * 6) * 13) % (W - x0)), yy = y0 + 2 + (k * 7) % 12; px(g, xx, yy, rgba('#ffffff', 0.5 + 0.4 * Math.sin(t * 3 + k))); }
    }
  }
}

// ---------- superficie ----------
function dibujarSuperficie(gm, m, fase, cam, t) {
  const o = objG, P = sup(), d = m.d, def = m.def, td = tinteDia(fase);
  o.globalCompositeOperation = 'source-over';
  o.clearRect(0, 0, W, SUELO + 10);
  const S = superficieEstatica(def);
  o.drawImage(S.cv, 0, 0);
  const asc = m.ag ? m.ag.asc : { p: 0, est: 'quieto', carga: 0 };
  // polea que gira con la jaula
  const giro = asc.p * 2.4 + (asc.est === 'baja' || asc.est === 'sube' ? 0 : 0);
  disco(o, 15, SUELO - 58, 5, '#2e262c'); disco(o, 15, SUELO - 58, 4, '#6a5e64');
  for (let k = 0; k < 4; k++) { const a = giro + k * Math.PI / 4; lin(o, 15 - Math.cos(a) * 4, SUELO - 58 - Math.sin(a) * 4, 15 + Math.cos(a) * 4, SUELO - 58 + Math.sin(a) * 4, '#2e262c'); }
  px(o, 15, SUELO - 58, '#c8c0b0');
  lin(o, 19, SUELO - 59, P.casa + 7, SUELO - 12, '#1e1a1c');
  // cablecarril
  if (def.trans === 'cable') for (let x = P.tolva + 10; x <= P.ing + 12; x++) { px(o, x, yCable(x, 0), '#2a2226'); px(o, x, yCable(x, 1), '#3a3036'); }
  // la tolva con su montón
  const capT = m.capSup() * 1.4, f = clamp(d.tolva / capT, 0, 1), colT = def.menas[Math.min(4, Math.floor((d.niveles.length - 1) / 5))][0];
  if (d.tolva > 0) { const h = 1 + Math.round(f * 5); for (let j = 0; j < h; j++) { const w = 16 - j * 2; if (w > 0) rect(o, P.tolva + 2 + j, SUELO - 27 - j, w + 1, 1, j % 2 ? mezcla(colT, '#000000', 0.2) : colT); } }
  // carros
  const carros = m.ag ? m.ag.sup.carros : [];
  carros.forEach(c => {
    const x = lerp(P.ca, P.cb, c.s), vuelta = c.est === 'vuelta', dir = vuelta ? -1 : 1, mov = c.est === 'ida' || c.est === 'vuelta';
    const y = def.trans === 'cable' ? yCable(x, vuelta ? 1 : 0) : SUELO - 1;
    dibujarCarro(o, def.trans, x, y, dir, c.carga > 0, colT, mov ? c.fase : 0);
  });
  // capataces de la superficie
  const ca = d.asc.cap, cs = d.sup.cap;
  dibujarCapatazEn(o, m, ca, P.casa + 12, SUELO, t, 'asc');
  dibujarCapatazEn(o, m, cs, P.tolva + 22, SUELO, t, 'sup');
  // apacheta encendida durante la ofrenda
  if (!m.carrera && ofrendaActiva()) { const a = S.apacheta; if (vis() < 0.12) part({ x: a.x + rnd(-3, 3), y: a.y - 2, vx: rnd(-6, 6), vy: rnd(-16, -8), g: 4, vida: rnd(1, 2), c: vis() < 0.5 ? '#4ab86a' : '#2a8a44', t: 'hoja' }); BRILLOS.push({ x: a.x, y: a.y - cam, c: '#ffb050', r: 14, a: 0.5 + 0.2 * Math.sin(t * 4) }); }
  if (vis() < 0.08) part({ x: P.ing + 42 + rnd(-1, 1), y: SUELO - 47, vx: rnd(2, 6), vy: rnd(-9, -5), g: -1, vida: rnd(2.5, 4), c: td.noche > 0.5 ? '#5a5a6a' : '#c8c0c0', t: 'humo' });
  // teñir según la hora
  if (td.noche > 0 || td.oro > 0) {
    o.globalCompositeOperation = 'source-atop';
    if (td.oro > 0) { o.fillStyle = rgba('#ff9a50', td.oro * 0.2); o.fillRect(0, 0, W, SUELO + 10); }
    if (td.noche > 0) { o.fillStyle = rgba('#0e1636', td.noche * 0.6); o.fillRect(0, 0, W, SUELO + 10); }
    o.globalCompositeOperation = 'source-over';
  }
  if (td.noche > 0.25) {
    const a = clamp((td.noche - 0.25) * 1.6, 0, 1);
    for (const v of S.ventanas) { o.globalAlpha = a; rect(o, v.x - 1.5, v.y - 2, 3, 4, '#ffc060'); o.globalAlpha = 1; BRILLOS.push({ x: v.x, y: v.y - cam, c: '#ffa040', r: 8, a: 0.6 * a }); }
    o.globalAlpha = a; rect(o, P.casa + 4, SUELO - 9, 3, 3, '#ffc060'); o.globalAlpha = 1;
    BRILLOS.push({ x: 15, y: SUELO - 55 - cam, c: '#ff3020', r: 6, a: (Math.sin(t * 3) > 0 ? 0.9 : 0.2) * a });
  }
  gm.drawImage(objCv, 0, -cam);
}
function dibujarCapatazEn(o, m, cap, x, y, t, tipo) {
  if (cap) {
    const fr = SPR.cap[cap.r], act = m.activa(cap);
    dibujarMinero(o, fr, x, y, 'quieto', 1, t, false);
    rect(o, x + 3, y - 7, 2, 3, '#8a5a30'); px(o, x + 3, y - 7, '#f0f0f0');
    if (act && vis() < 0.25) part({ x: x + rnd(-4, 4), y: y - rnd(2, 12), vx: 0, vy: rnd(-14, -6), vida: 0.6, c: ['#ffe080', '#a8e0ff', '#ff9ad0'][cap.r], t: 'brillo', em: 1 });
    if (!act && cap.cd <= m.ahora() && Math.sin(t * 6) > -0.3) { rect(o, x - 3, y - 22, 7, 6, '#fff4c0'); rect(o, x - 2, y - 16, 2, 1, '#fff4c0'); rect(o, x, y - 21, 1, 4, '#d8443a'); px(o, x, y - 18, '#fff4c0'); }
  } else {
    rect(o, x, y - 9, 1, 9, '#5a3a20');
    rect(o, x - 4, y - 14, 9, 6, '#a8743e'); rect(o, x - 4, y - 9, 9, 1, '#6a4420');
    rect(o, x, y - 13, 1, 4, '#fff4c0'); rect(o, x - 1, y - 12, 3, 1, '#fff4c0'); px(o, x - 1, y - 11, '#fff4c0'); px(o, x + 1, y - 11, '#fff4c0');
  }
}

// ---------- la mina por dentro ----------
function dibujarSubsuelo(g, m, cam, t) {
  const d = m.d, def = m.def, n = d.niveles.length;
  const i0 = Math.max(0, Math.floor((cam - Y0) / NH)), i1 = Math.floor((cam + H + 2 - Y0) / NH);
  for (let i = i0; i <= i1; i++) {
    const y = Y0 + i * NH - cam;
    const T = i < n ? texNivel(def, i, false) : (i === n && n < ECO.NIVELES ? texNivel(def, i, true) : texFondo(def));
    g.drawImage(T.cv, 0, y);
    for (const l of T.luces) {
      let r = l.r;
      if (l.f === 1) r += Math.sin(t * 9 + l.x) * 1.2 + Math.sin(t * 23 + l.x * 2) * 0.6;
      LUCES.push({ x: l.x, y: l.y + y, c: l.c, r });
    }
    for (const b of T.brillos) BRILLOS.push({ x: b.x, y: b.y + y, c: b.c, r: b.r, a: b.chispa ? 0.35 + 0.35 * Math.max(0, Math.sin(t * 3 + b.x * 0.7)) : 0.55 });
    if (i < n) dibujarFila(g, m, i, y, t);
  }
}
function dibujarFila(g, m, i, y, t) {
  const nv = m.d.niveles[i], a = m.ag && m.ag.niv[i], def = m.def, banda = Math.min(4, Math.floor(i / 5)), col = def.menas[banda][0], yF = y + TUN.abajo - 1;
  // cajón
  const bx = EST.x + 2;
  rect(g, bx, yF - 7, 14, 7, '#6a4426'); rect(g, bx, yF - 7, 14, 1, '#9a6a3a'); rect(g, bx, yF - 4, 14, 1, '#4a2e18'); rect(g, bx, yF - 7, 1, 7, '#4a2e18'); rect(g, bx + 13, yF - 7, 1, 7, '#4a2e18');
  if (nv.caja > 0) {
    const f = clamp(nv.caja / (m.prodNivel(i) * 14 + 1e-9), 0.1, 1), h = 1 + Math.round(f * 4);
    for (let j = 0; j < h; j++) { const w = 12 - j * 2; if (w > 0) rect(g, bx + 1 + j, yF - 8 - j, w, 1, j % 2 ? mezcla(col, '#000000', 0.25) : col); }
    if (f > 0.5) BRILLOS.push({ x: bx + 7, y: yF - 9, c: def.menas[banda][1], r: 4, a: 0.3 });
  }
  dibujarCapatazEn(g, m, nv.cap, EST.x + 24, yF + 1, t, 'nivel');
  // geoda en la pared
  const ge = m.ev.geoda;
  if (ge && ge.i === i) {
    const gx = Math.round(lerp(xMinA(), xMinB(), ge.u)), gy = y + 16;
    disco(g, gx, gy, 4, '#5a5058'); disco(g, gx, gy, 3, '#8a7a88'); px(g, gx - 1, gy - 2, '#c8b8c8');
    const cc = def.menas[2][1];
    for (let k = 0; k < ge.golpes + 1; k++) { px(g, gx - 1 + k, gy, cc); px(g, gx + k - 2, gy + 1, cc); }
    if (Math.sin(t * 5) > 0.6) part({ x: gx + rnd(-4, 4), y: gy + rnd(-4, 4) + 0, vx: 0, vy: -4, vida: 0.4, c: '#ffffff', t: 'brillo', em: 1 });
    BRILLOS.push({ x: gx, y: gy, c: cc, r: 9, a: 0.4 + 0.2 * Math.sin(t * 4) });
  }
  // veta rica
  const vr = m.ev.veta;
  if (vr && vr.i === i) {
    const xv = xVeta();
    for (let k = 0; k < 7; k++) { const yy = y + TUN.arriba + 4 + k * 4, xx = xv + 1 + ((k * 5 + Math.floor(t * 8)) % 4); px(g, xx, yy, '#fff4a0'); px(g, xx + 1, yy, '#f4c542'); }
    LUCES.push({ x: xv + 2, y: y + 22, c: '#ffd860', r: 30 + Math.sin(t * 8) * 3 });
    BRILLOS.push({ x: xv + 3, y: y + 22, c: '#ffe070', r: 16, a: 0.55 + 0.25 * Math.sin(t * 10) });
    if (vis() < 0.3) part({ x: xv + rnd(0, 4), y: y + rnd(10, 34), vx: rnd(-10, 4), vy: rnd(-20, -4), g: 40, vida: 0.5, c: '#ffe080', em: 1 });
  }
  if (!a) return;
  const xa = xMinA(), xb = xMinB();
  a.min.forEach((mi, j) => {
    const x = lerp(xa, xb, mi.u) + (mi.est === 'pica' ? -2 - (j % 4) * 4 : (j % 2) * 2);
    const dir = mi.est === 'ida' || mi.est === 'pica' ? 1 : -1;
    const est = mi.est === 'ida' || mi.est === 'vuelta' ? 'camina' : mi.est === 'pica' ? 'pica' : 'quieto';
    const carga = mi.est === 'vuelta' || mi.est === 'deja';
    dibujarMinero(g, SPR.min[mi.ves], x, yF + 1, est, dir, mi.fase, carga, col);
    LUCES.push({ x: x + dir * 3, y: yF - 11, c: '#fff0c0', r: 14, cono: dir });
    if (est === 'quieto' && !nv.cap && Math.sin(t * 4 + j) > 0.95 && j === 0) part({ x: x, y: yF - 18, vx: 0, vy: -6, vida: 0.5, c: '#ffffff', t: 'brillo', em: 1 });
  });
}
function dibujarJaula(g, m, cam, t) {
  const s = m.ag ? m.ag.asc : { p: 0, carga: 0, obj: 1 }, y = Math.round(yJaula(s.p) - cam), x = POZO.x + 2;
  if (y > H + 4 || y < -30) { lin(g, 15, Math.max(0, SUELO - 53 - cam), 15, H + 2, '#1a1418'); return; }
  lin(g, 15, Math.max(-1, SUELO - 53 - cam), 15, y, '#1a1418');
  rect(g, x, y, 20, 2, '#2e262c'); rect(g, x + 1, y, 18, 1, '#5a5058');
  rect(g, x, y + 22, 20, 2, '#2e262c');
  for (let k = 0; k < 20; k += 3) rect(g, x + k, y + 2, 1, 20, k === 0 || k === 18 ? '#3a3238' : '#6a6070');
  rect(g, x + 19, y + 2, 1, 20, '#3a3238');
  const cap = m.capAsc() * m.cargaAscM();
  if (s.carga > 0) {
    const f = clamp(s.carga / cap, 0.12, 1), h = 2 + Math.round(f * 8), col = m.def.menas[Math.min(4, Math.floor((s.obj - 1) / 5))][0];
    for (let j = 0; j < h; j++) rect(g, x + 2 + Math.floor(j / 3), y + 21 - j, 16 - Math.floor(j / 3) * 2, 1, j % 2 ? mezcla(col, '#000000', 0.2) : col);
  }
  rect(g, x + 9, y - 2, 2, 2, '#2e262c'); px(g, x + 9, y - 2, '#ffe08a');
  LUCES.push({ x: x + 10, y: y + 4, c: '#ffe0a0', r: 24 });
  BRILLOS.push({ x: x + 10, y: y - 1, c: '#fff0b0', r: 3, a: 0.7 });
  const td = tinteDia(faseDia(m));
  if (s.p < 0.6 && td.noche > 0) { g.globalAlpha = td.noche * 0.55; rect(g, x, y - 2, 20, 26, '#0e1636'); g.globalAlpha = 1; }
}
function dibujarCondorEvento(g, m, cam, t) {
  const c = m.ev.condor;
  if (!c) return null;
  const p = posCondor(m);
  dibujarCondor(g, p.x, p.y - cam, t, true);
  BRILLOS.push({ x: p.x, y: p.y - cam, c: '#ffd860', r: 14, a: 0.55 + 0.2 * Math.sin(t * 6) });
  if (vis() < 0.35) part({ x: p.x + rnd(-6, 6), y: p.y + rnd(-2, 3), vx: -c.dir * 10, vy: rnd(-4, 4), vida: 0.6, c: '#fff4b0', t: 'brillo', em: 1 });
  return p;
}
function posCondor(m) { const c = m.ev.condor; if (!c) return null; const k = c.t / c.dur; return { x: c.dir > 0 ? lerp(-24, W + 24, k) : lerp(W + 24, -24, k), y: 16 + c.y * 46 + Math.sin(c.t * 1.4) * 4 }; }

// ---------- todo junto ----------
const NIEVE = Array.from({ length: 70 }, (_, k) => ({ x: (k * 0.137) % 1, y: (k * 0.611) % 1, v: 0.4 + (k % 5) * 0.12, f: k }));
function dibujarMundo(m, t) {
  const cam = Math.floor(CAM.y), g = mundoG, fase = faseDia(m);
  LUCES = []; BRILLOS = [];
  g.globalCompositeOperation = 'source-over';
  if (cam < Y0) dibujarCielo(g, m, fase, cam, t);
  dibujarSubsuelo(g, m, cam, t);
  if (cam < Y0) { dibujarCondorEvento(g, m, cam, t); dibujarSuperficie(g, m, fase, cam, t); }
  dibujarJaula(g, m, cam, t);
  dibujarParticulas(g, cam, false);
  for (const l of LUCES_EXTRA) LUCES.push({ x: l.x, y: l.y - cam, c: l.c, r: l.r * (l.vida / l.max + 0.3) });
  // luz: la superficie queda como está; abajo, oscuridad con faroles
  const L = luzG, yS = Y0 - cam;
  L.globalCompositeOperation = 'source-over';
  if (yS > 0) { L.fillStyle = '#ffffff'; L.fillRect(0, 0, W, Math.min(H + 2, yS)); }
  const n = m.d.niveles.length;
  for (let i = Math.max(0, Math.floor((cam - Y0) / NH)); Y0 + i * NH - cam < H + 2; i++) {
    const b = Math.min(4, Math.floor(i / 5));
    L.fillStyle = i <= n ? ['#857892', '#7a6e8a', '#706684', '#665c7c', '#604c5c'][b] : '#625468';
    L.fillRect(0, Y0 + i * NH - cam, W, NH);
  }
  L.globalCompositeOperation = 'lighter';
  for (const l of LUCES) {
    if (l.y < -40 || l.y > H + 40) continue;
    if (l.cono) L.drawImage(spriteCono(l.c, l.r, l.cono), l.cono > 0 ? Math.round(l.x) : Math.round(l.x - l.r * 2), Math.round(l.y - l.r / 2));
    else { const s = spriteLuz(l.c, l.r); L.drawImage(s, Math.round(l.x - s.width / 2), Math.round(l.y - s.height / 2)); }
  }
  g.globalCompositeOperation = 'multiply';
  g.drawImage(luzCv, 0, 0);
  g.globalCompositeOperation = 'lighter';
  if (CALIDAD !== 'baja') for (const b of BRILLOS) { if (b.y < -30 || b.y > H + 30) continue; g.globalAlpha = clamp(b.a == null ? 0.6 : b.a, 0, 1); const s = spriteLuz(b.c, b.r); g.drawImage(s, Math.round(b.x - s.width / 2), Math.round(b.y - s.height / 2)); }
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-over';
  dibujarParticulas(g, cam, true);
  if (m.def.nieve && cam < Y0 + 20) {
    g.fillStyle = '#ffffff';
    for (const f of NIEVE) { const y = ((f.y + t * f.v * 0.08) % 1) * (Y0 + 10) - cam, x = ((f.x + Math.sin(t * 0.7 + f.f) * 0.01) % 1) * W; if (y < Y0 - cam) { g.globalAlpha = 0.8; g.fillRect(Math.round(x), Math.round(y), f.f % 3 ? 1 : 2, 1); } }
    g.globalAlpha = 1;
  }
}
function componerMundo(g, zurdo) {
  const fr = CAM.y - Math.floor(CAM.y);
  let sx = 0, sy = 0;
  if (SAC.t > 0) { sx = Math.round((vis() * 2 - 1) * SAC.amp); sy = Math.round((vis() * 2 - 1) * SAC.amp); }
  g.save();
  if (zurdo) { g.translate(W, 0); g.scale(-1, 1); }
  g.drawImage(mundoCv, sx, sy - fr);
  g.restore();
}
