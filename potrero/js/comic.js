// POTRERO — las páginas de historieta: cada viñeta es una toma 3D de la cancha con los pibes posando y
// gesticulando (respiran, parpadean), globos con cola hacia la boca, gritos en estallido, nubes de pensamiento,
// cartuchos del narrador y onomatopeyas. Se lee tocando: viñeta por viñeta, página por página.
let COMIC = null;
const _actores = new Map();
function actorFig(id) {
  const loma = { toto: 0, chacha: 1, rulo: 2, bebe: 3, juani: 4 };
  if (loma[id] != null) return figuraJugador('loma', loma[id]);
  if (ELENCO[id]) return figuraElenco(id);
  const m = /^(\w+):(\d)$/.exec(id); if (m) return figuraJugador(m[1], +m[2]);
  return figuraJugador('loma', 4);
}
function nombreActor(id) {
  const loma = { toto: 0, chacha: 1, rulo: 2, bebe: 3, juani: 4 };
  if (loma[id] != null) return jugadoresDe('loma')[loma[id]].nom;
  if (ELENCO[id]) return ELENCO[id].nom;
  const m = /^(\w+):(\d)$/.exec(id); if (m) return jugadoresDe(m[1])[+m[2]].nom;
  return id;
}
function munecoActor(id, k) {
  const key = id + '#' + (k || 0);
  let m = _actores.get(key);
  if (!m) { const f = actorFig(id); m = nuevoMuneco(f, 0, 0, 0, f.datos.altura || 1); m.kit = f.kit; _actores.set(key, m); }
  return m;
}
// paginas: [{ cancha, paneles: [{ cam:[ex,ey,ez,tx,ty,tz], fov, act:[{q, x, z, yaw (o 'mira'), g, c, y}], globos:[{q, k, t}], sfx:[{k,u,v}] }] }]
function empezarComic(paginas, alFin) {
  COMIC = { paginas, p: 0, panel: 0, t: 0, tPanel: 0, alFin, voltea: 0, cancha: null };
  prepararPagina();
  Sonido.musica(1);
  irA('comic');
}
function prepararPagina() {
  const pg = COMIC.paginas[COMIC.p];
  if (pg.cancha !== COMIC.cancha || !R.E) { const E = armarCancha(pg.cancha); R.ponerEscenario(E); aplicarLuzCancha(E); COMIC.E = E; COMIC.cancha = pg.cancha; }
  if (pg.luz) { const l = LUCES[pg.luz]; COMIC.E.luz = l; aplicarLuzCancha(COMIC.E); }
  COMIC.panel = 0; COMIC.tPanel = 0; COMIC.t = 0;
  PTOS.n = 0;
}
function avanzarComic() {
  const pg = COMIC.paginas[COMIC.p];
  if (COMIC.tPanel < 0.25) return;
  if (COMIC.panel < pg.paneles.length - 1) { COMIC.panel++; COMIC.tPanel = 0; Sonido.globo(); return; }
  if (COMIC.p < COMIC.paginas.length - 1) { COMIC.p++; Sonido.pagina(); COMIC.voltea = 1; prepararPagina(); return; }
  terminarComic();
}
function terminarComic() { const f = COMIC.alFin; COMIC.terminado = true; if (f) f(); }
// la grilla de viñetas según la pantalla
function grillaPaneles(n) {
  const m = 10, g = 9, top = 44, bot = 46, ap = W > H, out = [];
  const aw = W - m * 2, ah = H - top - bot;
  if (ap) {
    if (n <= 3) { const w = (aw - g * (n - 1)) / n; for (let i = 0; i < n; i++) out.push([m + i * (w + g), top, w, ah]); }
    else { const w = (aw - g) / 2, h = (ah - g) / 2; for (let i = 0; i < n; i++) out.push([m + (i % 2) * (w + g), top + Math.floor(i / 2) * (h + g), w, h]); }
  } else {
    const hs = n === 1 ? [1] : n === 2 ? [0.5, 0.5] : n === 3 ? [0.36, 0.3, 0.34] : [0.27, 0.23, 0.25, 0.25];
    let y = top; const tot = ah - g * (n - 1);
    for (let i = 0; i < n; i++) { const h = tot * hs[i]; out.push([m, y, aw, h]); y += h + g; }
  }
  return out;
}
const _vpPanel = [];
function dibujarComic3D() {
  const pg = COMIC.paginas[COMIC.p], rects = grillaPaneles(pg.paneles.length), sx = R.w / W, sy = R.h / H;
  let primero = true;
  for (let i = 0; i <= COMIC.panel && i < pg.paneles.length; i++) {
    const pn = pg.paneles[i], [x, y, w, h] = rects[i];
    const L = [];
    const usados = new Map();
    for (const a of pn.act || []) {
      const n = usados.get(a.q) || 0; usados.set(a.q, n + 1);
      const m = munecoActor(a.q, n);
      m.x = a.x; m.z = a.z; m.y = a.y || 0;
      m.yaw = typeof a.yaw === 'number' ? a.yaw : Math.atan2(pn.cam[0] - a.x, pn.cam[2] - a.z) + (a.yaw === 'mira' ? 0 : 0);
      if (a.hacia) { const o = pn.act.find(b => b.q === a.hacia); if (o) m.yaw = Math.atan2(o.x - a.x, o.z - a.z); }
      const tt = T + n * 1.3 + a.x;
      poseVaciaEn(m.pose);
      if (a.g === 'corre') pCorrer(m.pose, T * 1.6 + a.x, 0.8);
      else if (a.g === 'patea') pPatear(m.pose, 0.5, 1, 1);
      else if (a.g === 'estira') pEstirada(m.pose, 0.35, a.lado || 1, 0.6);
      else if (a.g === 'barre') pBarrida(m.pose, 0.4, 1);
      else if (a.g === 'cabecea') pCabezazo(m.pose, 0.6);
      else if (a.g && a.g.startsWith('fest_')) { pFestejo(m.pose, tt, a.g.slice(5)); if (a.g === 'fest_brazos') m.y = (a.y || 0) + Math.abs(Math.sin(tt * 7)) * 0.2; }
      else pGesto(m.pose, a.g || 'quieto', tt);
      m.cara = GESTOS[a.c || 'normal'];
      m.parpadeo -= DT; if (m.parpadeo < 0) { if (m.parpadeo < -0.12) m.parpadeo = rnd(2, 5); else if (m.cara === 0) m.cara = 9; }
      posarMuneco(m); L.push(m);
    }
    if (pn.pelota) { if (!COMIC.pel) { COMIC.pel = nuevoMuneco(FIG_PELOTA, 0, 0, 0, 1.15); COMIC.pel.id = 13; } const b = COMIC.pel, s = 1.15; M4.ident(b.huesos.subarray(0, 16)); const hm = b.huesos; hm[0] = hm[5] = hm[10] = s; hm[12] = pn.pelota[0]; hm[13] = pn.pelota[1]; hm[14] = pn.pelota[2]; L.push(b); }
    // la cámara de la viñeta (con un respiro lento)
    const c = pn.cam, k = Math.min(1, (COMIC.p === COMIC.pAnt && i < COMIC.panel ? 1 : COMIC.tPanel) / 0.5), zoom = i === COMIC.panel ? (1 - salida(k)) * 0.12 : 0;
    R.cam.x = c[0] + (c[0] - c[3]) * zoom; R.cam.y = c[1] + (c[1] - c[4]) * zoom; R.cam.z = c[2] + (c[2] - c[5]) * zoom; R.cam.tx = c[3]; R.cam.ty = c[4]; R.cam.tz = c[5];
    R.cam.fovY = pn.fov || 0.8; R.cam.cerca = 0.2; R.cam.lejos = 170;
    const vista = { x: Math.round(x * sx), y: Math.round(R.h - (y + h) * sy), w: Math.max(2, Math.round(w * sx)), h: Math.max(2, Math.round(h * sy)) };
    if (primero) { gl.bindFramebuffer(gl.FRAMEBUFFER, R.esc.fb); gl.viewport(0, 0, R.esc.w, R.esc.h); gl.clearColor(0.09, 0.07, 0.12, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); primero = false; }
    R.dibujar(T, L, vista);
    _vpPanel[i] = { vp: M4.copiar(_vpPanel[i] ? _vpPanel[i].vp : M4.nueva(), R.VP), rect: rects[i], act: L.map((m, j) => ({ m, q: (pn.act[j] || {}).q })) };
  }
  if (primero) { gl.bindFramebuffer(gl.FRAMEBUFFER, R.esc.fb); gl.viewport(0, 0, R.esc.w, R.esc.h); gl.clearColor(0.09, 0.07, 0.12, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); }
  COMIC.pAnt = COMIC.p;
  R.post(T);
}
// ---------- encima: papel, bordes, globos ----------
function dibujarComic2D(g) {
  const C = COMIC, pg = C.paginas[C.p], rects = grillaPaneles(pg.paneles.length);
  // el papel de la página (los huecos entre viñetas)
  g.save();
  g.beginPath(); g.rect(0, 0, W, H);
  for (let i = 0; i <= C.panel && i < rects.length; i++) { const [x, y, w, h] = rects[i]; g.rect(x + w, y, -w, h); }
  g.fillStyle = PAPEL; g.fill('evenodd');
  g.fillStyle = trama(g, 'rgba(22,19,31,0.08)', 5, 1.4); g.fill('evenodd');
  g.restore();
  for (let i = 0; i < rects.length; i++) {
    const [x, y, w, h] = rects[i];
    if (i > C.panel) { g.setLineDash([6, 6]); g.lineWidth = 1.5; g.strokeStyle = 'rgba(22,19,31,0.25)'; g.strokeRect(x, y, w, h); g.setLineDash([]); continue; }
    g.lineWidth = 3.4; g.strokeStyle = TINTA; g.strokeRect(x, y, w, h);
  }
  // globos de las viñetas abiertas (los de la actual aparecen de a uno)
  for (let i = 0; i <= C.panel && i < pg.paneles.length; i++) {
    const pn = pg.paneles[i], vp = _vpPanel[i], [x, y, w, h] = rects[i];
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    let ocupado = [];
    (pn.globos || []).forEach((gb, gi) => {
      const tAp = i === C.panel ? C.tPanel - 0.25 - gi * 0.45 : 9;
      if (tAp < 0) return;
      dibujarGlobo(g, gb, pn, vp, [x, y, w, h], clamp(tAp / 0.22, 0, 1), ocupado, gi);
    });
    for (const s of pn.sfx || []) { const tAp = i === C.panel ? C.tPanel - 0.15 : 9; if (tAp < 0) continue; const k = rebote(clamp(tAp / 0.25, 0, 1)); g.save(); g.translate(x + w * s.u, y + h * s.v); g.rotate(s.rot || -0.12); g.scale(k, k); txt(g, tr(s.k), 0, 0, { tam: s.tam || 30, c: s.c || AMARILLO, b: TINTA, bw: 4, al: 0.5 }); g.restore(); }
    g.restore();
  }
  // número de página, saltar, y "tocá"
  txt(g, (C.p + 1) + ' / ' + C.paginas.length, W - 16, H - 22, { tam: 10, c: TINTA, b: null, al: 1 });
  if (C.titulo) cartucho(g, 12, 12, tr(C.titulo), { tam: 12, c: ROJO, tc: BLANCO, max: W - 120 });
  // tocar en cualquier lado avanza; el botón SALTAR va encima (se agrega después, así gana el toque)
  zona(0, 0, W, H, () => avanzarComic());
  boton(g, W - 92, 8, 82, 26, tr('saltar'), () => terminarComic(), { tam: 10.5, sombra: 2.5, ic: 'flechaDer', it: 11 });
  const ult = C.p === C.paginas.length - 1 && C.panel === pg.paneles.length - 1;
  if (C.tPanel > 1.2 && Math.sin(T * 5) > -0.2) txt(g, tr(ult ? 'tocaSeguir' : 'toca'), W / 2, H - 22, { tam: 10.5, c: TINTA, b: PAPEL, al: 0.5 });
  // vuelta de página
  if (C.voltea > 0) { const k = C.voltea; g.fillStyle = PAPEL; g.beginPath(); g.moveTo(W, 0); g.lineTo(W - W * k * 1.3, 0); g.lineTo(W, H * k * 1.3); g.closePath(); g.fill(); g.lineWidth = 2.5; g.strokeStyle = TINTA; g.stroke(); }
}
function dibujarGlobo(g, gb, pn, vp, rect, k, ocupado, gi) {
  const [x, y, w, h] = rect, tipo = gb.t || 'habla', s = tr(gb.k);
  const tam = Math.min(13, Math.max(10, Math.min(w, h * 1.5) / 24));
  const maxW = Math.min(w * 0.78, 230), L = partir(s, maxW - tam * 1.6, tam, 1), lh = altoRenglon(tam);
  const tw = Math.max(...L.map(l => medir(l, tam, 1))), bw = tw + tam * 1.8, bh = L.length * lh + tam * 1.1;
  // dónde está la boca del que habla
  let boca = null;
  if (gb.q && vp) { const a = vp.act.find(o => o.q === gb.q); if (a) { const m = a.m, sc = m.escala || 1, p = M4.proyectar(vp.vp, m.x, m.y + 1.42 * sc, m.z); if (p) boca = [x + p[0] * w, y + p[1] * h]; } }
  // el globo arriba, del lado de quien habla, sin pisar a los otros
  let cx = boca ? clamp(boca[0], x + bw / 2 + 6, x + w - bw / 2 - 6) : x + w / 2, cy = y + 10 + bh / 2 + (gb.abajo ? h - bh - 20 : 0);
  if (tipo === 'narra') { cx = x + 6 + bw / 2; cy = y + 6 + bh / 2; if (gb.abajo) cy = y + h - 6 - bh / 2; }
  for (const o of ocupado) if (Math.abs(o[0] - cx) < (o[2] + bw) / 2 && Math.abs(o[1] - cy) < (o[3] + bh) / 2) cy = o[1] + (o[3] + bh) / 2 + 6;
  if (boca && cy + bh / 2 > boca[1] - 14 && tipo !== 'narra') cy = Math.max(y + bh / 2 + 4, boca[1] - 22 - bh / 2);
  ocupado.push([cx, cy, bw, bh]);
  g.save(); g.translate(cx, cy); g.scale(0.6 + 0.4 * rebote(k), 0.6 + 0.4 * rebote(k)); g.globalAlpha = clamp(k * 2, 0, 1);
  const tx = boca ? boca[0] - cx : 0, ty = boca ? boca[1] - cy : 0;
  g.lineWidth = 2.6; g.strokeStyle = TINTA; g.fillStyle = tipo === 'grito' ? AMARILLO : BLANCO;
  if (tipo === 'narra') { g.fillStyle = AMARILLO; g.fillRect(-bw / 2, -bh / 2, bw, bh); g.strokeRect(-bw / 2, -bh / 2, bw, bh); }
  else if (tipo === 'grito') { caminoEstallido(g, 0, 0, bw * 0.62, bh * 0.75, 14, 3 + gi); g.fill(); g.stroke(); }
  else if (tipo === 'piensa') {
    g.beginPath(); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, r = 0.92 + 0.08 * Math.sin(i * 2.7); g.ellipse(Math.cos(a) * bw * 0.38, Math.sin(a) * bh * 0.38, bw * 0.2 * r, bh * 0.3 * r, 0, 0, TAU); } g.fill();
    g.beginPath(); g.ellipse(0, 0, bw * 0.5, bh * 0.56, 0, 0, TAU); g.fill(); g.stroke(); g.fill();
    if (boca) for (let i = 1; i <= 3; i++) { const t = i / 4; g.beginPath(); g.arc(tx * t, bh * 0.5 + (ty - bh * 0.5) * t, 4 - i * 0.8, 0, TAU); g.fill(); g.stroke(); }
  } else {
    // globo con cola
    const r = Math.min(bh / 2, 14);
    g.beginPath(); g.moveTo(-bw / 2 + r, -bh / 2); g.lineTo(bw / 2 - r, -bh / 2); g.quadraticCurveTo(bw / 2, -bh / 2, bw / 2, -bh / 2 + r); g.lineTo(bw / 2, bh / 2 - r); g.quadraticCurveTo(bw / 2, bh / 2, bw / 2 - r, bh / 2);
    if (boca) { const bx = clamp(tx * 0.3, -bw / 2 + r + 6, bw / 2 - r - 14); g.lineTo(bx + 12, bh / 2); g.lineTo(tx * 0.75, Math.max(bh / 2 + 8, ty * 0.75)); g.lineTo(bx, bh / 2); }
    g.lineTo(-bw / 2 + r, bh / 2); g.quadraticCurveTo(-bw / 2, bh / 2, -bw / 2, bh / 2 - r); g.lineTo(-bw / 2, -bh / 2 + r); g.quadraticCurveTo(-bw / 2, -bh / 2, -bw / 2 + r, -bh / 2); g.closePath();
    g.fill(); g.stroke();
  }
  L.forEach((l, i) => txt(g, l, 0, -bh / 2 + tam * 0.55 + lh * (i + 0.5), { tam, c: TINTA, b: null, al: 0.5, max: maxW }));
  if (gb.q && tipo !== 'narra' && gb.nombre !== false) txt(g, nombreActor(gb.q), -bw / 2 + 4, -bh / 2 - 2, { tam: 8, c: BLANCO, b: TINTA, al: 0, bw: 1.6 });
  g.restore();
}
