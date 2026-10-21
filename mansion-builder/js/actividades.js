// MANSION BUILDER — actividades: misiones del día, logros, calendario de 7 días, ruleta y cofres que aparecen en la isla
// ---------- misiones del día (3, elegidas con la fecha como semilla) ----------
const MIS_TIPOS = {
  entregar: n => 20 + n * 6, cobrar: () => unidadPlata() * 3, visitas: n => 6 + n, mejora: () => 1, cofre: () => 2,
  pescar: () => 3, torre: () => 8, excavar: () => 1, ruleta: () => 1, anuncio: () => 2,
};
function misionesDeHoy() {
  if (!G.mis || G.mis.dia !== hoy()) {
    const r = rngSemilla(hoy()), tipos = Object.keys(MIS_TIPOS), lista = [];
    while (lista.length < 3) { const t = tipos[Math.floor(r() * tipos.length)]; if (!lista.some(m => m.t === t)) lista.push({ t, meta: Math.round(MIS_TIPOS[t](Math.max(1, G.parte))), prog: 0, cobrada: false }); }
    G.mis = { dia: hoy(), lista };
  }
  return G.mis.lista;
}
function mision(tipo, n) {
  if (!G || !G.stats) return;
  for (const m of misionesDeHoy()) if (m.t === tipo && !m.cobrada) m.prog = tipo === 'torre' ? Math.max(m.prog, n) : m.prog + n;
}
const misionLista = m => m.prog >= m.meta && !m.cobrada;
function cobrarMision(m) {
  if (!misionLista(m)) return;
  m.cobrada = true; const plata = unidadPlata();
  darPremio({ plata, gemas: 6 }, T('mision'), null);
}
// ---------- logros ----------
const LOGROS = [
  ['bloques1', () => G.bloques, 1, 5], ['bloques100', () => G.bloques, 100, 10], ['bloques500', () => G.bloques, 500, 25],
  ['partes2', () => G.parte, 2, 10], ['partes7', () => G.parte, 7, 20], ['partes13', () => G.parte, 13, 50],
  ['plata5k', () => G.ganado, 5000, 10], ['plata100k', () => G.ganado, 100000, 40], ['visitas100', () => G.visitas, 100, 15],
  ['ayudantes3', () => G.ayud, 3, 15], ['peces10', () => G.stats.peces, 10, 10], ['torre20', () => G.stats.torre, 20, 15],
  ['cofres10', () => G.stats.cofres, 10, 15], ['trajes5', () => G.trajes.length, 5, 20], ['mascotas2', () => G.mascotas.length, 2, 15],
  ['decos4', () => G.decos.length, 4, 20],
].map(([id, v, meta, gemas]) => ({ id, v, meta, gemas }));
const logroListo = l => l.v() >= l.meta && !G.logros[l.id];
function cobrarLogro(l) { if (!logroListo(l)) return; G.logros[l.id] = 1; darPremio({ gemas: l.gemas }, T('logroTit'), null); }
// ---------- calendario de 7 días ----------
const CALENDARIO = [{ plata: 2 }, { gemas: 5 }, { plata: 4 }, { gemas: 10 }, { boost: 'x2', seg: 600 }, { gemas: 20 }, { gemas: 40, traje: 'rey' }];
const calendarioListo = () => G.racha.dia !== hoy();
function premioDia(i) { const c = CALENDARIO[i % 7], p = {}; if (c.plata) p.plata = c.plata * unidadPlata(); if (c.gemas) p.gemas = c.gemas; if (c.boost) p.boost = [c.boost, c.seg]; if (c.traje && !G.trajes.includes(c.traje)) p.traje = c.traje; return p; }
function cobrarCalendario(mult) {
  if (!calendarioListo()) return;
  const i = G.racha.n % 7, p = premioDia(i);
  G.racha.dia = hoy(); G.racha.n++;
  if (mult) { if (p.plata) p.plata *= 2; if (p.gemas) p.gemas *= 2; if (p.boost) p.boost = [p.boost[0], p.boost[1] * 2]; }
  darPremio(p, T('diaN', { n: i + 1 }), null);
}
// ---------- ruleta ----------
const RULETA = [
  { plata: 1, p: 22, c: '#3fae4f' }, { gemas: 3, p: 18, c: '#8a52c8' }, { plata: 2, p: 15, c: '#e8a33a' }, { boost: 'x2', seg: 300, p: 10, c: '#d9485f' },
  { plata: 4, p: 12, c: '#3a8ad8' }, { gemas: 8, p: 10, c: '#c24fd0' }, { boost: 'iman', seg: 300, p: 9, c: '#5a6a80' }, { gemas: 25, p: 4, c: '#f2c230' },
];
const RUL = { ang: 0, vel: 0, girando: false, premio: -1 };
const ruletaGratis = () => G.ruleta.dia !== hoy();
function girarRuleta(conAd) {
  if (RUL.girando) return;
  const empezar = () => {
    let tot = 0; for (const s of RULETA) tot += s.p;
    let r = az() * tot, i = 0; while (r > RULETA[i].p) { r -= RULETA[i].p; i++; }
    RUL.premio = i; RUL.girando = true;
    // el ángulo final deja el sector i bajo la flecha (arriba), con varias vueltas
    const seg = TAU / RULETA.length, fin = -(i + 0.5) * seg - PI / 2 + rnd(-0.3, 0.3) * seg;
    RUL.desde = RUL.ang; RUL.hasta = fin - Math.ceil((fin - RUL.ang) / TAU) * TAU - TAU * 5; RUL.t = 0;
    mision('ruleta', 1); Sonido.efecto('clic', 0.6);
  };
  if (conAd) conAnuncio('ruleta', empezar);
  else if (ruletaGratis()) { G.ruleta.dia = hoy(); empezar(); }
}
function pasarRuleta(dt) {
  if (!RUL.girando) return;
  RUL.t += dt / 4.2;
  const k = Math.min(1, RUL.t), e = 1 - Math.pow(1 - k, 4), antes = RUL.ang;
  RUL.ang = lerp(RUL.desde, RUL.hasta, e);
  if (Math.floor(antes / (TAU / 8)) !== Math.floor(RUL.ang / (TAU / 8))) Sonido.efecto('tick', 0.5, 1 + vis() * 0.1, 0.02);
  if (k >= 1) { RUL.girando = false; const s = RULETA[RUL.premio], p = {}; if (s.plata) p.plata = s.plata * unidadPlata(); if (s.gemas) p.gemas = s.gemas; if (s.boost) p.boost = [s.boost, s.seg]; darPremio(p, T('ruleta'), 2); }
}
// ---------- cofres que aparecen cerca ----------
const COFRES = { t: 70, uno: null };
function actualizarCofres(dt) {
  if (G.parte < 1) return;
  const c = COFRES.uno;
  if (c) {
    c.t += dt; c.vida -= dt;
    if (vis() < dt * 4) chispas(c.x, SUELO + 0.9, c.z, '#ffe27a', 1, 1);
    if (dist2(JUG.x, JUG.z, c.x, c.z) < 0.9) { COFRES.uno = null; abrirCofre(c); }
    else if (c.vida <= 0) COFRES.uno = null;
    return;
  }
  COFRES.t -= dt;
  if (COFRES.t > 0) return;
  COFRES.t = 100 + az() * 60;
  for (let k = 0; k < 30; k++) {
    const a = az() * TAU, d = 5 + az() * 8, x = JUG.x + Math.cos(a) * d, z = JUG.z + Math.sin(a) * d;
    if (libreR(x, z, 0.45) && Mundo.get(Math.floor(x), SUELO - 1, Math.floor(z)) !== B.LOSA_TABLAS) { COFRES.uno = { x: Math.floor(x) + 0.5, z: Math.floor(z) + 0.5, t: 0, vida: 75 }; UI.aviso(T('cofreAparece'), 'oro'); Sonido.efecto('pop', 0.6, 0.8); break; }
  }
}
function abrirCofre(c) {
  G.stats.cofres++; mision('cofre', 1);
  Sonido.efecto('cofre', 0.9); Sonido.vibrar([20, 20, 30]);
  for (let k = 0; k < 30; k++) confeti(c.x, SUELO + 1, c.z);
  const p = az() < 0.65 ? { plata: Math.round(unidadPlata() * azR(1.5, 3)) } : { gemas: 3 + Math.floor(az() * 6) };
  darPremio(p, T('cofre'), 3);
}
function dibujarCofres(cubo, t) {
  const c = COFRES.uno; if (!c) return;
  const sal = Math.abs(Math.sin(t * 3)) * 0.12;
  cubo(c.x, SUELO + 0.32 + sal, c.z, 0.62, Math.sin(t) * 0.3, B.CAJA);
  cubo(c.x, SUELO + 0.7 + sal, c.z, 0.4, Math.sin(t) * 0.3, B.ORO + 64);
}
// ---------- el cartel de premio (con "x2/x3 mirando un anuncio") ----------
// p: { plata, gemas, boost: [id, seg], traje }; mult: multiplicador por anuncio (null = sin opción)
function darPremio(p, titulo, mult) {
  UI.premio = { p, titulo, mult, volver: UI.panel && UI.panel !== 'premio' && UI.panel !== 'mj' ? UI.panel : null };
  abrirPanel('premio');
  Sonido.efecto('caja', 0.7);
}
function cobrarPremio(m) {
  const P = UI.premio; if (!P) return;
  const p = P.p;
  if (p.plata) { G.dinero += Math.round(p.plata * m); G.ganado += Math.round(p.plata * m); UI.pulsoPlata(); }
  if (p.gemas) { G.gemas += p.gemas * m; UI.pulsoGemas(); }
  if (p.boost) G.boosts[p.boost[0]] = (G.boosts[p.boost[0]] || 0) + p.boost[1] * m;
  if (p.traje && !G.trajes.includes(p.traje)) G.trajes.push(p.traje);
  for (let k = 0; k < 24; k++) confeti(JUG.x + rnd(-1, 1), JUG.y + 2, JUG.z + rnd(-1, 1));
  Sonido.efecto('moneda', 0.8, 1.2);
  UI.premio = null; guardar();
  UI.panel = P.volver || null;
}
// algo para hacer avisado con un puntito rojo en su botón
function hayMision() { return misionesDeHoy().some(misionLista) || LOGROS.some(logroListo); }

// ---------- paneles ----------
const ACT = { pestana: 'misiones' };
function panelActividades(g, t) {
  const U = UI.U, M = abrirMarco(g, 344 * U, 560 * U), { x, y, w } = M;
  tarjeta(g, x, y, w, M.h);
  texto(g, T('actividades'), x + w / 2, y + 26 * U, 20 * U, '#ffd34a', '#101826');
  botonCerrar(g, x + w - 44 * U, y + 9 * U);
  const tabs = ['misiones', 'logros', 'calendario'];
  pestanas(g, x + 10 * U, y + 50 * U, w - 20 * U, tabs.map(k => T('tab.' + k)), tabs.indexOf(ACT.pestana), i => { ACT.pestana = tabs[i]; Sonido.efecto('clic', 0.5); });
  const cy = y + 92 * U;
  if (ACT.pestana === 'misiones') {
    const L = misionesDeHoy();
    L.forEach((m, i) => {
      const yy = cy + i * 112 * U;
      tarjetaItem(g, x + 10 * U, yy, w - 20 * U, 104 * U, m.cobrada);
      const s = T('mis.' + m.t, { n: fmt(m.meta) });
      texto(g, s, x + 22 * U, yy + 22 * U, tamQueEntra(g, s, 13 * U, w - 60 * U), '#fff', '#101826', 'left');
      const bw = w - 150 * U, k = Math.min(1, m.prog / m.meta);
      g.fillStyle = '#16202f'; rr(g, x + 22 * U, yy + 44 * U, bw, 14 * U, 7 * U); g.fill();
      g.fillStyle = '#5ee06a'; if (k > 0) { rr(g, x + 22 * U, yy + 44 * U, Math.max(14 * U, bw * k), 14 * U, 7 * U); g.fill(); }
      texto(g, fmt(Math.min(m.prog, m.meta)) + '/' + fmt(m.meta), x + 22 * U + bw / 2, yy + 51.5 * U, 9 * U, '#fff', '#101826');
      gema(g, x + 30 * U, yy + 80 * U, 7 * U); texto(g, '6', x + 44 * U, yy + 81 * U, 11 * U, '#fff', '#101826');
      moneda(g, x + 66 * U, yy + 80 * U, 7 * U); texto(g, fmt(unidadPlata()), x + 78 * U, yy + 81 * U, 11 * U, '#fff', '#101826', 'left');
      const lista = misionLista(m);
      const dy = boton(g, x + w - 120 * U, yy + 40 * U, 96 * U, 34 * U, m.cobrada ? '#56708f' : lista ? '#3fae4f' : '#6b7c93', lista ? () => cobrarMision(m) : null);
      texto(g, m.cobrada ? '✓' : T('cobrar'), x + w - 72 * U, yy + 57 * U + dy, tamQueEntra(g, T('cobrar'), 12 * U, 86 * U), '#fff', '#101826');
    });
    texto(g, T('nuevasMisiones'), x + w / 2, cy + 3 * 112 * U + 14 * U, 10 * U, 'rgba(255,255,255,0.7)', null);
  } else if (ACT.pestana === 'logros') {
    const cw = (w - 24 * U) / 2, ch = 52 * U;
    LOGROS.forEach((l, i) => {
      const cx = x + 10 * U + (i % 2) * (cw + 4 * U), yy = cy + Math.floor(i / 2) * (ch + 4 * U), hecho = !!G.logros[l.id], lista = logroListo(l);
      tarjetaItem(g, cx, yy, cw, ch, hecho);
      const s = T('logro.' + l.id, { n: fmt(l.meta) });
      texto(g, s, cx + 8 * U, yy + 16 * U, tamQueEntra(g, s, 10 * U, cw - 16 * U), '#fff', '#101826', 'left');
      if (hecho) texto(g, '✓', cx + cw - 20 * U, yy + 36 * U, 14 * U, '#8dffa0', '#101826');
      else if (lista) { const dy = boton(g, cx + cw - 64 * U, yy + 26 * U, 56 * U, 20 * U, '#3fae4f', () => cobrarLogro(l)); gema(g, cx + cw - 50 * U, yy + 36 * U + dy, 6 * U); texto(g, String(l.gemas), cx + cw - 30 * U, yy + 37 * U + dy, 10 * U, '#fff', '#101826'); }
      else { const bw = cw - 80 * U, k = Math.min(1, l.v() / l.meta); g.fillStyle = '#16202f'; rr(g, cx + 8 * U, yy + 31 * U, bw, 10 * U, 5 * U); g.fill(); g.fillStyle = '#5ee06a'; if (k > 0) { rr(g, cx + 8 * U, yy + 31 * U, Math.max(10 * U, bw * k), 10 * U, 5 * U); g.fill(); } gema(g, cx + cw - 50 * U, yy + 36 * U, 6 * U); texto(g, String(l.gemas), cx + cw - 30 * U, yy + 37 * U, 10 * U, '#fff', '#101826'); }
    });
  } else {
    const cw = (w - 28 * U) / 3, ch = 108 * U, hoyI = G.racha.n % 7, listo = calendarioListo(), hechos = listo ? G.racha.n % 7 : ((G.racha.n - 1) % 7) + 1;
    CALENDARIO.forEach((c, i) => {
      const fila = Math.floor(i / 3), col = i % 3, ancho = i === 6 ? w - 20 * U : cw;
      const cx = i === 6 ? x + 10 * U : x + 10 * U + col * (cw + 4 * U), yy = cy + fila * (ch + 6 * U);
      const pasado = i < hechos, esHoy = i === hoyI && listo;
      tarjetaItem(g, cx, yy, ancho, ch, esHoy);
      texto(g, T('diaN', { n: i + 1 }), cx + ancho / 2, yy + 16 * U, 11 * U, esHoy ? '#ffd34a' : '#fff', '#101826');
      const p = premioDia(i), cxm = cx + ancho / 2;
      if (p.traje) { constructor2D(g, cxm - 30 * U, yy + 26 * U, 1.6 * U, t, pielDe(p.traje)); gema(g, cxm + 30 * U, yy + 60 * U, 9 * U); texto(g, '+' + p.gemas, cxm + 56 * U, yy + 61 * U, 13 * U, '#fff', '#101826'); }
      else if (p.plata) { moneda(g, cxm, yy + 50 * U, 13 * U); texto(g, fmt(p.plata), cxm, yy + 78 * U, 12 * U, '#fff', '#101826'); }
      else if (p.gemas) { gema(g, cxm, yy + 50 * U, 13 * U); texto(g, '+' + p.gemas, cxm, yy + 78 * U, 12 * U, '#fff', '#101826'); }
      else if (p.boost) { g.drawImage(iconoBloque(B.ORO), cxm - 15 * U, yy + 34 * U, 30 * U, 33.6 * U); texto(g, 'x2 ' + Math.round(p.boost[1] / 60) + 'm', cxm, yy + 78 * U, 12 * U, '#fff', '#101826'); }
      if (pasado) { g.fillStyle = 'rgba(0,0,0,0.35)'; rr(g, cx, yy, ancho, ch, 10 * U); g.fill(); texto(g, '✓', cx + ancho / 2, yy + ch / 2, 34 * U, '#8dffa0', '#101826'); }
      if (esHoy) {
        const bw = (ancho - 16 * U) / 2;
        let dy = boton(g, cx + 6 * U, yy + ch - 26 * U, bw, 20 * U, '#3fae4f', () => cobrarCalendario(false));
        texto(g, T('cobrar'), cx + 6 * U + bw / 2, yy + ch - 16 * U + dy, tamQueEntra(g, T('cobrar'), 9 * U, bw - 4 * U), '#fff', '#101826');
        dy = boton(g, cx + 10 * U + bw, yy + ch - 26 * U, bw, 20 * U, '#8a52c8', () => conAnuncio('completar', () => cobrarCalendario(true)));
        iconoDibujo(g, 'tv', cx + 10 * U + bw + bw / 2 - 8 * U, yy + ch - 16 * U + dy, 12 * U, '#fff'); texto(g, 'x2', cx + 10 * U + bw + bw / 2 + 9 * U, yy + ch - 15 * U + dy, 9 * U, '#fff', '#101826');
      }
    });
    if (!listo) texto(g, T('manana'), x + w / 2, cy + 3 * (ch + 6 * U) + 10 * U, 11 * U, 'rgba(255,255,255,0.8)', null);
  }
  cerrarMarco(g);
}
function panelRuleta(g, t) {
  const U = UI.U, M = abrirMarco(g, 330 * U, 520 * U), { x, y, w } = M;
  tarjeta(g, x, y, w, M.h);
  texto(g, T('ruleta'), x + w / 2, y + 26 * U, 20 * U, '#ffd34a', '#101826');
  if (!RUL.girando) botonCerrar(g, x + w - 44 * U, y + 9 * U);
  const cx = x + w / 2, cy = y + 210 * U, R = 128 * U, n = RULETA.length, seg = TAU / n;
  g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.arc(cx, cy + 6 * U, R + 10 * U, 0, TAU); g.fill();
  g.fillStyle = '#7a3c0c'; g.beginPath(); g.arc(cx, cy, R + 10 * U, 0, TAU); g.fill();
  for (let i = 0; i < n; i++) {
    const a0 = RUL.ang + i * seg, s = RULETA[i];
    g.fillStyle = s.c; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R, a0, a0 + seg); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 2 * U; g.stroke();
    const am = a0 + seg / 2, ix = cx + Math.cos(am) * R * 0.66, iy = cy + Math.sin(am) * R * 0.66;
    g.save(); g.translate(ix, iy); g.rotate(am + PI / 2);
    if (s.plata) { moneda(g, 0, -6 * U, 10 * U); texto(g, fmt(s.plata * unidadPlata()), 0, 14 * U, 10 * U, '#fff', '#101826'); }
    else if (s.gemas) { gema(g, 0, -6 * U, 10 * U); texto(g, '+' + s.gemas, 0, 14 * U, 11 * U, '#fff', '#101826'); }
    else { g.drawImage(iconoBloque(s.boost === 'x2' ? B.ORO : B.HIERRO), -11 * U, -18 * U, 22 * U, 24.6 * U); texto(g, s.boost === 'x2' ? 'x2' : T('boost.iman'), 0, 14 * U, 9 * U, '#fff', '#101826'); }
    g.restore();
  }
  for (let i = 0; i < 16; i++) { const a = i / 16 * TAU + t * 2; g.fillStyle = i % 2 ? '#fff6b0' : '#ffd34a'; g.beginPath(); g.arc(cx + Math.cos(a) * (R + 5 * U), cy + Math.sin(a) * (R + 5 * U), 3 * U, 0, TAU); g.fill(); }
  g.fillStyle = '#fff'; g.beginPath(); g.arc(cx, cy, 18 * U, 0, TAU); g.fill(); moneda(g, cx, cy, 12 * U);
  g.fillStyle = '#ff3b4e'; g.strokeStyle = '#5a120c'; g.lineWidth = 3 * U; g.beginPath(); g.moveTo(cx, cy - R + 18 * U); g.lineTo(cx - 14 * U, cy - R - 16 * U); g.lineTo(cx + 14 * U, cy - R - 16 * U); g.closePath(); g.fill(); g.stroke();
  const by = y + M.h - 120 * U;
  if (!RUL.girando) {
    if (ruletaGratis()) { const dy = boton(g, x + 40 * U, by, w - 80 * U, 46 * U, '#3fae4f', () => girarRuleta(false)); texto(g, T('girarGratis'), x + w / 2, by + 23 * U + dy, tamQueEntra(g, T('girarGratis'), 16 * U, w - 100 * U), '#fff', '#101826'); }
    else {
      const dy = boton(g, x + 40 * U, by, w - 80 * U, 46 * U, adQueda('ruleta') > 0 ? '#8a52c8' : '#6b7c93', () => girarRuleta(true));
      iconoDibujo(g, 'tv', x + 70 * U, by + 23 * U + dy, 20 * U, '#fff'); texto(g, T('girar') + ' (' + adQueda('ruleta') + ')', x + w / 2 + 12 * U, by + 23 * U + dy, tamQueEntra(g, T('girar'), 16 * U, w - 140 * U), '#fff', '#101826');
    }
    texto(g, ruletaGratis() ? T('unaGratis') : T('masGiros'), x + w / 2, by + 70 * U, 10 * U, 'rgba(255,255,255,0.8)', null);
  }
  cerrarMarco(g);
}
function panelPremio(g, t) {
  const P = UI.premio; if (!P) { UI.panel = null; return; }
  const U = UI.U, M = abrirMarco(g, 310 * U, 330 * U), { x, y, w } = M, p = P.p;
  tarjeta(g, x, y, w, M.h);
  texto(g, P.titulo, x + w / 2, y + 30 * U, tamQueEntra(g, P.titulo, 20 * U, w - 30 * U), '#ffd34a', '#101826');
  // rayos detrás del premio
  g.save(); g.translate(x + w / 2, y + 120 * U); g.rotate(t * 0.6); g.fillStyle = 'rgba(255,230,120,0.18)';
  for (let k = 0; k < 10; k++) { g.rotate(TAU / 10); g.beginPath(); g.moveTo(0, 0); g.lineTo(-14 * U, -90 * U); g.lineTo(14 * U, -90 * U); g.closePath(); g.fill(); }
  g.restore();
  const items = [];
  if (p.plata) items.push(['plata', fmt(p.plata)]);
  if (p.gemas) items.push(['gemas', '+' + p.gemas]);
  if (p.boost) items.push(['boost', (p.boost[0] === 'x2' ? 'x2 ' : T('boost.' + p.boost[0]) + ' ') + Math.round(p.boost[1] / 60) + 'm']);
  if (p.traje) items.push(['traje', T('traje.' + p.traje)]);
  items.forEach(([tipo, s], i) => {
    const cx = x + w / 2 + (i - (items.length - 1) / 2) * 110 * U, cy = y + 110 * U;
    if (tipo === 'plata') moneda(g, cx, cy, 24 * U); else if (tipo === 'gemas') gema(g, cx, cy, 24 * U);
    else if (tipo === 'boost') g.drawImage(iconoBloque(p.boost[0] === 'x2' ? B.ORO : p.boost[0] === 'iman' ? B.HIERRO : B.LANA_CELESTE), cx - 24 * U, cy - 28 * U, 48 * U, 53.8 * U);
    else constructor2D(g, cx - 4 * 1.7 * U, cy - 40 * U, 1.7 * U, t, pielDe(p.traje));
    texto(g, s, cx, cy + 46 * U, tamQueEntra(g, s, 18 * U, 104 * U), '#fff', '#101826');
  });
  const by = y + M.h - 120 * U;
  if (P.mult) {
    const dy = boton(g, x + 30 * U, by, w - 60 * U, 46 * U, '#8a52c8', () => conAnuncio('completar', () => cobrarPremio(P.mult)));
    iconoDibujo(g, 'tv', x + 62 * U, by + 23 * U + dy, 20 * U, '#fff'); texto(g, T('cobrarX', { n: P.mult }), x + w / 2 + 14 * U, by + 23 * U + dy, tamQueEntra(g, T('cobrarX', { n: P.mult }), 16 * U, w - 130 * U), '#fff', '#101826');
  }
  const dy = boton(g, x + 50 * U, by + 56 * U, w - 100 * U, 38 * U, '#3fae4f', () => cobrarPremio(1));
  texto(g, T('cobrar'), x + w / 2, by + 75 * U + dy, 15 * U, '#fff', '#101826');
  cerrarMarco(g);
}
