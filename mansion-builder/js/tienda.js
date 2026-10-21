// MANSION BUILDER — la tienda: trajes, mascotas (te siguen y ayudan), decoración (aparece en la isla y sube lo que pagan
// los visitantes) y boosts. Algunas cosas se pagan con plata, otras con gemas y otras mirando anuncios.
const TRAJES = [
  { id: 'jugador' }, { id: 'granjero', plata: 1500 }, { id: 'chef', plata: 4000 }, { id: 'surfista', ads: 3 }, { id: 'vaquero', plata: 9000 },
  { id: 'pirata', gemas: 40 }, { id: 'ninja', ads: 5 }, { id: 'astronauta', gemas: 90 }, { id: 'heroe', gemas: 120 }, { id: 'rey', gemas: 200 },
];
// mascotas hechas de cubitos: [dx, dy, dz, tamaño, bloque, parte] (mirando a +z)
const MASCOTAS = [
  { id: 'perro', gemas: 30, partes: [[0, 0.34, 0, 0.36, 'LANA_MARRON'], [0, 0.62, 0.26, 0.3, 'LANA_MARRON'], [0, 0.58, 0.44, 0.12, 'LANA_NEGRA'], [-0.11, 0.8, 0.22, 0.1, 'LANA_NEGRA'], [0.11, 0.8, 0.22, 0.1, 'LANA_NEGRA'], [0, 0.5, -0.22, 0.1, 'LANA_MARRON', 'cola'], [-0.1, 0.08, 0.1, 0.12, 'LANA_MARRON', 'pata'], [0.1, 0.08, -0.1, 0.12, 'LANA_MARRON', 'pata'], [0.1, 0.08, 0.1, 0.12, 'LANA_MARRON', 'pata2'], [-0.1, 0.08, -0.1, 0.12, 'LANA_MARRON', 'pata2']] },
  { id: 'gato', plata: 6000, partes: [[0, 0.3, 0, 0.32, 'LANA_NARANJA'], [0, 0.56, 0.22, 0.28, 'LANA_NARANJA'], [-0.09, 0.74, 0.2, 0.08, 'LANA_NARANJA'], [0.09, 0.74, 0.2, 0.08, 'LANA_NARANJA'], [0, 0.6, -0.22, 0.09, 'LANA_NARANJA', 'cola'], [0, 0.72, -0.28, 0.09, 'LANA_BLANCA', 'cola'], [-0.09, 0.07, 0.09, 0.1, 'LANA_BLANCA', 'pata'], [0.09, 0.07, -0.09, 0.1, 'LANA_NARANJA', 'pata'], [0.09, 0.07, 0.09, 0.1, 'LANA_BLANCA', 'pata2'], [-0.09, 0.07, -0.09, 0.1, 'LANA_NARANJA', 'pata2']] },
  { id: 'gallina', gemas: 60, partes: [[0, 0.28, 0, 0.3, 'LANA_BLANCA'], [0, 0.52, 0.12, 0.2, 'LANA_BLANCA'], [0, 0.66, 0.12, 0.08, 'LANA_ROJA'], [0, 0.5, 0.25, 0.08, 'LANA_AMARILLA'], [0, 0.36, -0.18, 0.14, 'LANA_BLANCA', 'cola'], [-0.06, 0.06, 0, 0.07, 'LANA_AMARILLA', 'pata'], [0.06, 0.06, 0, 0.07, 'LANA_AMARILLA', 'pata2']] },
  { id: 'cerdito', ads: 6, partes: [[0, 0.3, 0, 0.36, 'LANA_ROSA'], [0, 0.42, 0.26, 0.26, 'LANA_ROSA'], [0, 0.38, 0.42, 0.12, 'LANA_ROJA'], [-0.08, 0.58, 0.24, 0.07, 'LANA_ROSA'], [0.08, 0.58, 0.24, 0.07, 'LANA_ROSA'], [0, 0.4, -0.22, 0.07, 'LANA_ROSA', 'cola'], [-0.1, 0.07, 0.1, 0.11, 'LANA_ROSA', 'pata'], [0.1, 0.07, -0.1, 0.11, 'LANA_ROSA', 'pata'], [0.1, 0.07, 0.1, 0.11, 'LANA_ROSA', 'pata2'], [-0.1, 0.07, -0.1, 0.11, 'LANA_ROSA', 'pata2']] },
];
const DECOS = [
  { id: 'estatua', plata: 400, icono: 'ORO' }, { id: 'palmeras', plata: 900, icono: 'HOJAS' }, { id: 'flamencos', plata: 1500, icono: 'LANA_ROSA' },
  { id: 'auto', plata: 3000, icono: 'LANA_ROJA' }, { id: 'helados', plata: 5000, icono: 'LANA_CELESTE' }, { id: 'barco', plata: 8000, icono: 'TABLAS_OSC' },
  { id: 'faro', plata: 12000, icono: 'LAMPARA' }, { id: 'globo', gemas: 100, icono: 'LANA_AMARILLA' },
];
const BOOSTS = [
  { id: 'x2', dura: 300, gemas: 12, icono: 'ORO', img: 'rayo' }, { id: 'vel', dura: 180, gemas: 6, icono: 'LANA_CELESTE', img: 'reloj' }, { id: 'iman', dura: 300, gemas: 8, icono: 'HIERRO' },
  { id: 'llenar', gemas: 5, icono: 'CAJA' }, { id: 'pack', gemas: 25, icono: 'BILLETE', img: 'moneda' }, { id: 'gemasAd', icono: 'CRISTAL_AZUL', img: 'gema' },
];
// una "unidad" de plata: lo que dejan los visitantes en un minuto según cuánto va de la mansión (premios que escalan)
function unidadPlata() { const n = clamp(G.parte, 1, PARTES.length), e = ECO.visita(n); return Math.max(25, Math.round(e.paga / e.cada * 60 / 5) * 5); }
function multPaga() { return (G.boosts.x2 > 0 ? 2 : 1) * (1 + 0.05 * G.decos.length) * (G.mascota === 'cerdito' ? 1.1 : 1) * (1 + 0.5 * (G.estrellas || 0)); }
function multVel() { return (G.boosts.vel > 0 ? 1.4 : 1) * (G.mascota === 'perro' ? 1.1 : 1); }
function precioTxt(it) { return it.plata ? fmt(it.plata) : it.gemas ? String(it.gemas) : ''; }
// compra con plata, gemas o anuncios (los de anuncios suman de a uno)
function pagar(it, clave, alComprar) {
  if (it.ads) {
    conAnuncio('compra', () => { G.adProg[clave] = (G.adProg[clave] || 0) + 1; if (G.adProg[clave] >= it.ads) alComprar(); else { UI.aviso(G.adProg[clave] + '/' + it.ads, 'oro'); guardar(); } });
    return;
  }
  if (it.plata && G.dinero < it.plata) { UI.aviso(T('faltaPlata'), 'rojo'); Sonido.efecto('clic', 0.4, 0.6); return; }
  if (it.gemas && G.gemas < it.gemas) { UI.aviso(T('faltaGemas'), 'rojo'); Sonido.efecto('clic', 0.4, 0.6); abrirTienda('boosts'); return; }
  if (it.plata) G.dinero -= it.plata;
  if (it.gemas) { G.gemas -= it.gemas; UI.pulsoGemas(); }
  alComprar();
}
function comprarTraje(it) {
  if (G.trajes.includes(it.id)) { G.traje = it.id; Sonido.efecto('clic', 0.6); guardar(); return; }
  pagar(it, 'traje_' + it.id, () => { G.trajes.push(it.id); G.traje = it.id; festejoCompra(); });
}
function comprarMascota(it) {
  if (G.mascotas.includes(it.id)) { G.mascota = G.mascota === it.id ? null : it.id; ponerMascota(); Sonido.efecto('clic', 0.6); guardar(); return; }
  pagar(it, 'masc_' + it.id, () => { G.mascotas.push(it.id); G.mascota = it.id; ponerMascota(); festejoCompra(); });
}
function comprarDeco(it) {
  if (G.decos.includes(it.id)) return;
  pagar(it, 'deco_' + it.id, () => {
    G.decos.push(it.id);
    VIVO.armando.push(...listaDe(DECO_ARMA[it.id]).sort((a, b) => a[1] - b[1]));
    festejoCompra(); cerrarPanel(); UI.aviso(T('deco.' + it.id).toUpperCase() + ' +5%', 'oro');
  });
}
function usarBoost(it, conAd) {
  const aplicar = () => {
    if (it.dura) G.boosts[it.id] = Math.max(G.boosts[it.id], 0) + it.dura;
    else if (it.id === 'llenar') { for (const m in G.gens) G.gens[m].pila = ECO.tope[G.gens[m].nivel - 1]; }
    else if (it.id === 'pack') { G.dinero += unidadPlata() * 5; UI.pulsoPlata(); }
    else if (it.id === 'gemasAd') { G.gemas += 5; UI.pulsoGemas(); }
    Sonido.efecto('desbloquear', 0.8); UI.aviso(T('boost.' + it.id).toUpperCase() + '!', 'oro'); guardar();
  };
  if (it.id === 'gemasAd') return conAnuncio('gemas', aplicar);
  if (conAd) return conAnuncio('boost', aplicar);
  pagar({ gemas: it.gemas }, '', aplicar);
}
function festejoCompra() {
  Sonido.efecto('fanfarria', 0.7); Sonido.vibrar([20, 30, 20]);
  for (let k = 0; k < 40; k++) confeti(JUG.x + rnd(-1, 1), JUG.y + 2, JUG.z + rnd(-1, 1));
  guardar();
}

// ---------- la mascota que te sigue ----------
const MASC = { x: 0, z: 0, y: SUELO, yaw: 0, salto: 0, andar: 0, huevoT: 60, huevos: [] };
function ponerMascota() { MASC.x = JUG.x - 1; MASC.z = JUG.z + 1; MASC.yaw = JUG.yaw; }
function actualizarMascota(dt) {
  if (!G.mascota) return;
  const s = Math.sin(JUG.yaw), c = Math.cos(JUG.yaw);
  const tx = JUG.x - s * 1.1 + c * 0.7, tz = JUG.z - c * 1.1 - s * 0.7;
  const dx = tx - MASC.x, dz = tz - MASC.z, d = Math.hypot(dx, dz);
  if (d > 9) { MASC.x = tx; MASC.z = tz; }
  else if (d > 0.25) {
    const v = Math.min(d * 3.5, ECO.vel.v[G.vel] * multVel() + 1.5) * dt, px = MASC.x, pz = MASC.z;
    moverConChoque(MASC, dx / d * v, dz / d * v, 0.2);
    if (Math.hypot(MASC.x - px, MASC.z - pz) < v * 0.2) { MASC.x += dx / d * v; MASC.z += dz / d * v; }
    MASC.yaw += angDif(MASC.yaw, Math.atan2(dx, dz)) * (1 - Math.exp(-dt * 10));
    MASC.andar = acercar(MASC.andar, 1, dt * 5);
  } else { MASC.andar = acercar(MASC.andar, 0, dt * 3); MASC.yaw += angDif(MASC.yaw, Math.atan2(JUG.x - MASC.x, JUG.z - MASC.z)) * (1 - Math.exp(-dt * 4)); }
  MASC.salto += dt * (6 + MASC.andar * 6);
  MASC.y = alturaPiso(MASC.x, MASC.z);
  // la gallina pone huevos de oro
  if (G.mascota === 'gallina') {
    MASC.huevoT -= dt;
    if (MASC.huevoT <= 0 && MASC.huevos.length < 3) { MASC.huevoT = 75; MASC.huevos.push({ x: MASC.x, z: MASC.z, t: 0 }); Sonido.efecto('pop', 0.5, 1.4); }
  }
  for (let i = MASC.huevos.length - 1; i >= 0; i--) {
    const h = MASC.huevos[i]; h.t += dt;
    if (dist2(JUG.x, JUG.z, h.x, h.z) < 0.8) {
      MASC.huevos.splice(i, 1); const a = Math.round(unidadPlata() * 0.6);
      G.dinero += a; G.ganado += a; UI.pulsoPlata(); UI.aviso('+$' + fmt(a), 'oro'); Sonido.efecto('caja', 0.6);
      for (let k = 0; k < 14; k++) chispas(h.x, SUELO + 0.3, h.z, '#ffd34a', 1, 2);
    }
  }
}
function dibujarMascota(cubo, t) {
  for (const h of MASC.huevos) cubo(h.x, SUELO + 0.14 + Math.abs(Math.sin(t * 3 + h.x)) * 0.12, h.z, 0.22, t * 1.5, B.ORO + 64);
  if (!G.mascota) return;
  const M = MASCOTAS.find(m => m.id === G.mascota); if (!M) return;
  const s = Math.sin(MASC.yaw), c = Math.cos(MASC.yaw), salto = Math.abs(Math.sin(MASC.salto)) * 0.12 * MASC.andar;
  for (const [dx, dy, dz, tam, b, parte] of M.partes) {
    let ox = dx, oy = dy + salto, oz = dz;
    if (parte === 'cola') ox += Math.sin(t * 9) * 0.05;
    if (parte === 'pata') oy += Math.max(0, Math.sin(MASC.salto)) * 0.06 * MASC.andar;
    if (parte === 'pata2') oy += Math.max(0, -Math.sin(MASC.salto)) * 0.06 * MASC.andar;
    cubo(MASC.x + ox * c + oz * s, MASC.y + oy, MASC.z - ox * s + oz * c, tam, MASC.yaw, B[b]);
  }
}

// ---------- la decoración (bloques que se agregan al mundo) ----------
function buscarArena(x0, z0) {
  for (let r = 0; r < 8; r++) for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
    const x = x0 + dx, z = z0 + dz;
    if (Mundo.get(x, 4, z) === B.ARENA && !Mundo.get(x, 5, z) && Mundo.get(x + 1, 4, z) && Mundo.get(x, 4, z + 1)) return [x, z];
  }
  return [x0, z0];
}
const DECO_ARMA = {
  estatua(p) {
    p(17, 5, 37, B.CUARZO_LADRILLO); p(17, 6, 37, B.ORO); p(17, 7, 37, B.ORO); p(16, 7, 37, B.ORO); p(18, 7, 37, B.ORO); p(17, 8, 37, B.ORO);
    for (const [x, z] of [[16, 36], [18, 36], [16, 38], [18, 38]]) p(x, 5, z, [B.FLOR_ROJA, B.FLOR_AMARILLA][(x + z) % 2]);
  },
  palmeras(p) {
    for (const [x0, z0] of [[42, 22], [42, 30], [6, 47]]) {
      const [x, z] = buscarArena(x0, z0);
      for (let y = 5; y <= 9; y++) p(x + (y >= 8 ? 1 : 0), y, z, B.TRONCO);
      const tx = x + 1, ty = 10;
      p(tx, ty, z, B.HOJAS);
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { p(tx + dx, ty, z + dz, B.HOJAS); p(tx + dx * 2, ty - 1, z + dz * 2, B.HOJAS); }
      p(tx, ty - 1, z + 1, B.LANA_MARRON); p(tx - 1, ty - 1, z, B.LANA_MARRON);
    }
  },
  flamencos(p) {
    for (const [x, z, d] of [[11, 34, 1], [13, 35, -1], [12, 37, 1]]) { p(x, 5, z, B.LANA_ROSA); p(x, 6, z, B.LANA_ROSA); p(x, 7, z + d, B.LANA_ROSA); p(x, 7, z + 2 * d, B.LANA_NEGRA); }
  },
  auto(p) {
    for (const z of [38, 39]) {
      p(32, 5, z, B.LANA_NEGRA); p(35, 5, z, B.LANA_NEGRA); p(33, 5, z, B.LANA_ROJA); p(34, 5, z, B.LANA_ROJA);
      p(32, 6, z, B.LANA_ROJA); p(33, 6, z, B.VIDRIO); p(34, 6, z, B.LANA_ROJA); p(35, 6, z, B.LANA_ROJA);
      p(34, 7, z, B.LANA_ROJA);
    }
    p(31, 5, 38, B.LAMPARA); p(31, 5, 39, B.LAMPARA);
  },
  helados(p) {
    for (let x = 30; x <= 32; x++) { p(x, 5, 58, B.LANA_BLANCA); p(x, 7, 57, x % 2 ? B.LANA_ROSA : B.LANA_BLANCA); p(x, 7, 58, x % 2 ? B.LANA_ROSA : B.LANA_BLANCA); }
    p(30, 6, 58, B.TRONCO); p(32, 6, 58, B.TRONCO); p(31, 6, 58, B.LANA_CELESTE);
    p(31, 8, 57, B.LANA_MARRON); p(31, 9, 57, B.LANA_ROSA); p(31, 10, 57, B.LANA_BLANCA);
  },
  barco(p) {
    for (let z = 68; z <= 71; z++) for (let x = 26; x <= 28; x++) { p(x, 3, z, B.TABLAS_OSC); if (x !== 27 || z === 68 || z === 71) p(x, 4, z, B.TABLAS_OSC); else p(x, 4, z, B.TABLAS); }
    for (let y = 5; y <= 8; y++) p(27, y, 70, B.TRONCO);
    for (let y = 6; y <= 8; y++) { p(27, y, 69, B.LANA_BLANCA); if (y < 8) p(27, y, 68, B.LANA_BLANCA); }
    p(27, 9, 70, B.LANA_ROJA);
  },
  faro(p) {
    const [x, z] = buscarArena(6, 63);
    for (let y = 5; y <= 13; y++) for (let dz = 0; dz <= 1; dz++) for (let dx = 0; dx <= 1; dx++) p(x + dx, y, z + dz, Math.floor((y - 5) / 2) % 2 ? B.LANA_BLANCA : B.LANA_ROJA);
    for (let dz = 0; dz <= 1; dz++) for (let dx = 0; dx <= 1; dx++) { p(x + dx, 14, z + dz, B.LAMPARA); p(x + dx, 15, z + dz, B.LOSA_PIZARRA); }
  },
  globo(p) {
    const cx = 38, cy = 22, cz = 35, r = 3.2, cols = [B.LANA_ROJA, B.LANA_AMARILLA, B.LANA_AZUL, B.LANA_BLANCA];
    for (let y = -4; y <= 4; y++) for (let z = -4; z <= 4; z++) for (let x = -4; x <= 4; x++) {
      const d = Math.hypot(x, y * 0.9, z); if (Math.abs(d - r) > 0.55) continue;
      p(cx + x, cy + y, cz + z, cols[Math.floor((Math.atan2(z, x) + PI) / TAU * 8) % 4]);
    }
    p(cx, cy - 5, cz, B.TABLAS); p(cx + 1, cy - 5, cz, B.TABLAS); p(cx, cy - 5, cz + 1, B.TABLAS); p(cx + 1, cy - 5, cz + 1, B.TABLAS);
  },
};

// ---------- el panel de la tienda ----------
const TIENDA = { pestana: 'trajes' };
function abrirTienda(p) { if (p) TIENDA.pestana = p; abrirPanel('tienda'); }
const _pieles2D = {};
function pielDe(nombre) {
  if (_pieles2D[nombre]) return _pieles2D[nombre];
  const datos = PJ.datos || armarPieles(), i = PIELES[nombre], c = lienzo(64, 64), g = c.getContext('2d'), im = g.createImageData(64, 64);
  im.data.set(datos.subarray(i * 16384, (i + 1) * 16384)); g.putImageData(im, 0, 0);
  return (_pieles2D[nombre] = c);
}
// botón de precio: plata, gemas o anuncios (con su progreso)
function botonPrecio(g, x, y, w, h, it, clave, f, tieneTxt) {
  const U = UI.U;
  if (tieneTxt) { const dy = boton(g, x, y, w, h, tieneTxt.col, f); texto(g, tieneTxt.s, x + w / 2, y + h / 2 + dy + 1 * U, tamQueEntra(g, tieneTxt.s, 11 * U, w - 8 * U), '#fff', '#101826'); return; }
  const puede = it.ads ? true : it.plata ? G.dinero >= it.plata : G.gemas >= it.gemas;
  const dy = boton(g, x, y, w, h, it.ads ? '#8a52c8' : puede ? '#3fae4f' : '#6b7c93', f);
  const cy = y + h / 2 + dy;
  if (it.ads) { iconoDibujo(g, 'tv', x + 16 * U, cy, 16 * U, '#fff'); texto(g, (G.adProg[clave] || 0) + '/' + it.ads, x + w / 2 + 8 * U, cy + 1 * U, 11 * U, '#fff', '#101826'); }
  else if (it.plata) { moneda(g, x + 13 * U, cy, 7 * U); texto(g, fmt(it.plata), x + w / 2 + 7 * U, cy + 1 * U, tamQueEntra(g, fmt(it.plata), 11 * U, w - 26 * U), '#fff', '#101826'); }
  else { gema(g, x + 13 * U, cy, 7 * U); texto(g, String(it.gemas), x + w / 2 + 7 * U, cy + 1 * U, 11 * U, '#fff', '#101826'); }
}
function panelTienda(g, t) {
  const U = UI.U, M = abrirMarco(g, 344 * U, 588 * U), { x, y, w } = M;
  tarjeta(g, x, y, w, M.h);
  texto(g, T('tienda'), x + w / 2, y + 26 * U, 21 * U, '#ffd34a', '#101826');
  botonCerrar(g, x + w - 44 * U, y + 9 * U);
  monedasPanel(g, x + w / 2, y + 54 * U);
  const tabs = ['trajes', 'mascotas', 'decos', 'boosts'];
  pestanas(g, x + 10 * U, y + 72 * U, w - 20 * U, tabs.map(k => T('tab.' + k)), tabs.indexOf(TIENDA.pestana), i => { TIENDA.pestana = tabs[i]; Sonido.efecto('clic', 0.5); }, ['traje', 'mascota', 'fuente', 'rayo']);
  const cy = y + 112 * U, P = TIENDA.pestana;
  if (P === 'trajes') {
    const cw = (w - 28 * U) / 3, ch = 112 * U;
    TRAJES.forEach((it, i) => {
      const cx = x + 10 * U + (i % 3) * (cw + 4 * U), yy = cy + Math.floor(i / 3) * (ch + 4 * U);
      if (i === 9) { tarjetaItem(g, x + 10 * U + cw + 4 * U, yy, cw, ch, G.traje === it.id); dibujarItemTraje(g, it, x + 10 * U + cw + 4 * U, yy, cw, ch, t); return; }
      tarjetaItem(g, cx, yy, cw, ch, G.traje === it.id); dibujarItemTraje(g, it, cx, yy, cw, ch, t);
    });
  } else if (P === 'mascotas') {
    const cw = (w - 24 * U) / 2, ch = 200 * U;
    MASCOTAS.forEach((it, i) => {
      const cx = x + 10 * U + (i % 2) * (cw + 4 * U), yy = cy + Math.floor(i / 2) * (ch + 6 * U), tiene = G.mascotas.includes(it.id);
      tarjetaItem(g, cx, yy, cw, ch, G.mascota === it.id);
      iconoMascota(g, it, cx + cw / 2, yy + 72 * U, 120 * U, t);
      texto(g, T('masc.' + it.id).toUpperCase(), cx + cw / 2, yy + 118 * U, 13 * U, '#fff', '#101826');
      envolver(g, T('mascEf.' + it.id), cx + cw / 2, yy + 142 * U, cw - 14 * U, 9 * U, '#cfe6ff');
      botonPrecio(g, cx + 10 * U, yy + ch - 36 * U, cw - 20 * U, 26 * U, it, 'masc_' + it.id, () => comprarMascota(it), tiene ? { s: G.mascota === it.id ? T('usando') : T('usar'), col: G.mascota === it.id ? '#2f9e44' : '#3a8ad8' } : null);
    });
  } else if (P === 'decos') {
    const cw = (w - 24 * U) / 2, ch = 104 * U;
    DECOS.forEach((it, i) => {
      const cx = x + 10 * U + (i % 2) * (cw + 4 * U), yy = cy + Math.floor(i / 2) * (ch + 4 * U), tiene = G.decos.includes(it.id);
      tarjetaItem(g, cx, yy, cw, ch, tiene);
      g.drawImage(iconoBloque(B[it.icono]), cx + 8 * U, yy + 10 * U, 40 * U, 44.8 * U);
      texto(g, T('deco.' + it.id).toUpperCase(), cx + 54 * U, yy + 24 * U, tamQueEntra(g, T('deco.' + it.id).toUpperCase(), 11 * U, cw - 60 * U), '#fff', '#101826', 'left');
      texto(g, '+5% $', cx + 54 * U, yy + 44 * U, 10 * U, '#8dffa0', '#101826', 'left');
      botonPrecio(g, cx + 8 * U, yy + ch - 36 * U, cw - 16 * U, 26 * U, it, 'deco_' + it.id, () => comprarDeco(it), tiene ? { s: T('listo'), col: '#2f9e44' } : null);
    });
  } else {
    const cw = (w - 24 * U) / 2, ch = 132 * U;
    BOOSTS.forEach((it, i) => {
      const cx = x + 10 * U + (i % 2) * (cw + 4 * U), yy = cy + Math.floor(i / 2) * (ch + 4 * U);
      tarjetaItem(g, cx, yy, cw, ch, it.dura && G.boosts[it.id] > 0);
      if (!(it.img && dibujarIcono(g, it.img, cx + cw / 2, yy + 29 * U, 44 * U))) g.drawImage(iconoBloque(B[it.icono]), cx + cw / 2 - 18 * U, yy + 8 * U, 36 * U, 40.3 * U);
      texto(g, T('boost.' + it.id).toUpperCase(), cx + cw / 2, yy + 60 * U, tamQueEntra(g, T('boost.' + it.id).toUpperCase(), 11 * U, cw - 10 * U), '#fff', '#101826');
      const sub = it.dura ? (G.boosts[it.id] > 0 ? fmtReloj(G.boosts[it.id]) : fmtReloj(it.dura)) : it.id === 'pack' ? '+$' + fmt(unidadPlata() * 5) : it.id === 'gemasAd' ? '+5 · ' + adQueda('gemas') + '/' + TOPES_AD.gemas : '';
      texto(g, sub, cx + cw / 2, yy + 78 * U, 10 * U, G.boosts[it.id] > 0 ? '#8dffa0' : '#cfe6ff', '#101826');
      if (it.id === 'gemasAd') { const dy = boton(g, cx + 10 * U, yy + ch - 38 * U, cw - 20 * U, 28 * U, '#8a52c8', () => usarBoost(it)); iconoDibujo(g, 'tv', cx + cw / 2 - 12 * U, yy + ch - 24 * U + dy, 16 * U, '#fff'); gema(g, cx + cw / 2 + 14 * U, yy + ch - 24 * U + dy, 7 * U); return; }
      const bw = (cw - 24 * U) / 2;
      if (it.dura || it.id === 'llenar') { const dy = boton(g, cx + 8 * U, yy + ch - 38 * U, bw, 28 * U, '#8a52c8', () => usarBoost(it, true)); iconoDibujo(g, 'tv', cx + 8 * U + bw / 2, yy + ch - 24 * U + dy, 16 * U, '#fff'); }
      const bx = it.dura || it.id === 'llenar' ? cx + 16 * U + bw : cx + 8 * U, bw2 = it.dura || it.id === 'llenar' ? bw : cw - 16 * U;
      const dy = boton(g, bx, yy + ch - 38 * U, bw2, 28 * U, G.gemas >= it.gemas ? '#3fae4f' : '#6b7c93', () => usarBoost(it, false));
      gema(g, bx + 12 * U, yy + ch - 24 * U + dy, 6 * U); texto(g, String(it.gemas), bx + bw2 / 2 + 6 * U, yy + ch - 23 * U + dy, 11 * U, '#fff', '#101826');
    });
  }
  cerrarMarco(g);
}
function dibujarItemTraje(g, it, cx, yy, cw, ch, t) {
  const U = UI.U, tiene = G.trajes.includes(it.id);
  constructor2D(g, cx + cw / 2 - 4 * 1.9 * U, yy + 8 * U, 1.9 * U, G.traje === it.id ? t : 0, pielDe(it.id));
  texto(g, T('traje.' + it.id).toUpperCase(), cx + cw / 2, yy + ch - 40 * U, tamQueEntra(g, T('traje.' + it.id).toUpperCase(), 9 * U, cw - 8 * U), '#fff', '#101826');
  botonPrecio(g, cx + 5 * U, yy + ch - 30 * U, cw - 10 * U, 22 * U, it, 'traje_' + it.id, () => comprarTraje(it), tiene ? { s: G.traje === it.id ? T('usando') : T('usar'), col: G.traje === it.id ? '#2f9e44' : '#3a8ad8' } : null);
}
function iconoMascota(g, it, x, y, s, t) {
  // la mascota de costado con sus cubitos (proyección isométrica simple)
  const partes = it.partes.slice().sort((a, b) => (a[2] - a[0]) - (b[2] - b[0]));
  const salto = Math.abs(Math.sin(t * 5)) * 0.06;
  for (const [dx, dy, dz, tam, b] of partes) {
    const px = x + (dz - dx) * s * 0.9, py = y - (dy + salto) * s * 1.1 + (dx + dz) * s * 0.25, w = tam * s * 1.1;
    g.drawImage(iconoBloque(B[b]), px - w / 2, py - w / 2, w, w * 1.12);
  }
}
