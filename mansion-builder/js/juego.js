// MANSION BUILDER — el juego: el constructor, las máquinas, la obra, la plata, los ayudantes y los visitantes
function estadoNuevo() {
  return {
    v: 2, dinero: 0, parte: 0, entregado: {}, gens: { madera: { nivel: 1, pila: 10 } }, mochila: 0, vel: 0, ayud: 0, pads: {}, caja: 0, visitas: 0, bloques: 0, ganado: 0, t: Date.now(), jugado: 0,
    gemas: 0, estrellas: 0, traje: 'jugador', trajes: ['jugador'], mascota: null, mascotas: [], decos: [], adProg: {}, boosts: { x2: 0, vel: 0, iman: 0 },
    mis: null, logros: {}, racha: { dia: 0, n: 0 }, ruleta: { dia: 0 }, mj: { dia: 0, torre: 0, excava: 0, cebo: 5, ceboT: 0, mejorTorre: 0 },
    stats: { peces: 0, cofres: 0, torre: 0, anuncios: 0, minijuegos: 0 }, adDia: 0, adUsos: {},
  };
}
// completa lo que falte de una partida vieja (los objetos de adentro también)
function normalizarEstado(leido) {
  const n = estadoNuevo(), e = Object.assign(n, leido || {});
  for (const k of ['boosts', 'racha', 'ruleta', 'mj', 'stats']) e[k] = Object.assign(estadoNuevo()[k], (leido && leido[k]) || {});
  for (const k of ['trajes', 'mascotas', 'decos']) if (!Array.isArray(e[k])) e[k] = estadoNuevo()[k];
  if (!e.trajes.includes('jugador')) e.trajes.unshift('jugador');
  return e;
}
let G = estadoNuevo();
const VIVO = { t: 0, gen: {}, obj: null, objT: 0, cajaVol: 0, cajaIni: 0, visitaT: 4, guardarT: 0, humoT: 0, festejo: 0, padActivo: null };
const JUG = { x: LUGAR.inicio[0], z: LUGAR.inicio[1], y: SUELO, yaw: PI, vx: 0, vz: 0, carga: [], fase: 0, andar: 0, sem: 0, tPila: 0, tObra: 0, tCaja: 0, tPad: 0, padId: null, avisos: {}, pasoF: 0 };
const AYUD = [], VIS = [], VOL = [];
const OBRA = { porMat: {}, adorno: [], aterrizado: {}, fantasma: null, fantSucio: true };
const PRIMERA = {};
PARTES.forEach((P, i) => { for (const m in P.need) if (PRIMERA[m] == null) PRIMERA[m] = i; });
const capMochila = () => ECO.mochila.cap[G.mochila];
const dist2 = (ax, az, bx, bz) => (ax - bx) * (ax - bx) + (az - bz) * (az - bz);

// ---------- guardado ----------
function guardar() {
  const gens = {}; for (const m in G.gens) gens[m] = { nivel: G.gens[m].nivel, pila: G.gens[m].pila };
  Guardado.escribir('estado', Object.assign({}, G, { gens, t: Date.now() }));
}
function cargarEstado() {
  const leido = Guardado.leer('estado', null);
  G = normalizarEstado(leido);
  if (!G.gens.madera) G.gens.madera = { nivel: 1, pila: 10 };
  return !!leido;
}

// ---------- la obra (la parte que se está construyendo) ----------
function prepararParte() {
  const P = PARTES[G.parte];
  OBRA.porMat = {}; OBRA.adorno = []; OBRA.aterrizado = {}; OBRA.fantSucio = true;
  if (!P) return;
  for (const v of listaParte(G.parte)) { const m = BLOQ[v[3]].m; if (m && P.need[m]) (OBRA.porMat[m] || (OBRA.porMat[m] = [])).push(v); else OBRA.adorno.push(v); }
  for (const m in OBRA.porMat) OBRA.porMat[m].sort((a, b) => a[1] - b[1] || b[2] - a[2] || a[0] - b[0]);
  for (const m in P.need) { if (!G.entregado[m]) G.entregado[m] = 0; OBRA.aterrizado[m] = G.entregado[m]; }
}
// cuántos bloques del mundo hay puestos de un material tras k entregas
function hasta(m, k) { const L = OBRA.porMat[m], n = necesita(G.parte, m); if (!L) return 0; return k >= n ? L.length : Math.floor(k * L.length / n); }
const faltaEntregar = m => PARTES[G.parte] ? necesita(G.parte, m) - (G.entregado[m] || 0) : 0;
function cargando(m) { let n = 0; for (const c of JUG.carga) if (c.m === m) n++; for (const a of AYUD) for (const c of a.carga) if (c.m === m) n++; return n; }
const faltaJuntar = m => faltaEntregar(m) - cargando(m);
function colocar(lista, efecto) {
  for (const v of lista) {
    Mundo.set(v[0], v[1], v[2], v[3]);
    if (efecto) chispas(v[0] + 0.5, v[1] + 0.6, v[2] + 0.5, colorBloque(v[3]), 3, 2.2);
  }
}
function parteCompleta() { const P = PARTES[G.parte]; if (!P) return false; for (const m in P.need) if ((OBRA.aterrizado[m] || 0) < necesita(G.parte, m)) return false; return true; }
function completarParte() {
  const P = PARTES[G.parte];
  colocar(OBRA.adorno, true);
  // el premio vuela de la mansión a la caja en billetes (cada estrella lo agranda)
  const premio = Math.round(P.premio * (1 + 0.5 * (G.estrellas || 0)));
  G.caja += premio; VIVO.cajaVol += premio;
  const nb = 14, c = LUGAR.caja;
  for (let k = 0; k < nb; k++) {
    const parte = Math.floor(premio * (k + 1) / nb) - Math.floor(premio * k / nb);
    volar(B.BILLETE, -0.55, [24 + rnd(-6, 6), 12 + rnd(0, 6), 18 + rnd(-3, 6)], () => posCajaArriba(), 0.9 + k * 0.05, 4, () => { VIVO.cajaVol -= parte; Sonido.efecto('moneda', 0.5, 1 + k * 0.03, 0.02); }, k * 0.04);
  }
  for (let k = 0; k < 90; k++) confeti(24 + rnd(-10, 10), 16 + rnd(0, 6), 19 + rnd(-6, 8));
  G.parte++; G.entregado = {}; G.gemas += 5; UI.pulsoGemas();
  Sonido.efecto('fanfarria', 0.9); Sonido.vibrar([40, 30, 60]);
  UI.festejo(T('lista', { p: T('parte.' + P.id).toUpperCase() }), '+$' + fmt(premio));
  VIVO.festejo = 3;
  if (G.parte >= PARTES.length) { UI.festejo(T('mansion'), T('fin'), true); VIVO.festejo = 6; }
  prepararParte();
  guardar();
}
// el plano fantasma: lo que todavía falta de la parte
function armarFantasma() {
  OBRA.fantSucio = false;
  GL.borrarMalla(OBRA.fantasma); OBRA.fantasma = null;
  if (!R.cv) return;
  const P = PARTES[G.parte]; if (!P) return;
  const falta = [], hay = new Set();
  for (const m in OBRA.porMat) { const L = OBRA.porMat[m]; for (let i = hasta(m, OBRA.aterrizado[m] || 0); i < L.length; i++) { falta.push(L[i]); hay.add((L[i][1] * MZ + L[i][2]) * MX + L[i][0]); } }
  if (!falta.length) return;
  const d = mallarConjunto(falta, (x, y, z) => hay.has((y * MZ + z) * MX + x) || Mundo.opaco(x, y, z));
  if (d) OBRA.fantasma = R.mallaVox(d);
}

// ---------- el mundo armado según el progreso ----------
function reconstruirMundo() {
  generarMundo();
  for (const m in G.gens) colocar(listaDe(MAQUINAS[m].arma), false);
  colocar(listaDe(ARCADE_ARMA), false);
  for (const d of G.decos) if (DECO_ARMA[d]) colocar(listaDe(DECO_ARMA[d]), false);
  for (let i = 0; i < Math.min(G.parte, PARTES.length); i++) colocar(listaParte(i), false);
  prepararParte();
  for (const m in OBRA.porMat) colocar(OBRA.porMat[m].slice(0, hasta(m, G.entregado[m] || 0)), false);
  Mundo.sucios.clear(); for (let i = 0; i < NCX * NCZ; i++) Mundo.sucios.add(i);
  Paso.recalcular();
  for (const m in G.gens) VIVO.gen[m] = { t: 0, enCamino: 0 };
  AYUD.length = 0; for (let i = 0; i < G.ayud; i++) AYUD.push(nuevoAyudante(i));
  VIS.length = 0; VOL.length = 0; JUG.carga.length = 0; VIVO.cajaVol = 0;
  JUG.x = LUGAR.inicio[0]; JUG.z = LUGAR.inicio[1]; JUG.yaw = PI;
  COFRES.uno = null; COFRES.t = 70; MASC.huevos.length = 0; ponerMascota();
}
// una mansión nueva con otro estilo: se conserva todo menos lo construido; los visitantes pagan +50% por estrella
function renovarMansion() {
  if (G.parte < PARTES.length) return;
  G.estrellas = (G.estrellas || 0) + 1; G.parte = 0; G.entregado = {}; G.gemas += 50;
  reconstruirMundo(); armarFantasma();
  for (let k = 0; k < 80; k++) confeti(24 + rnd(-8, 8), 10 + rnd(0, 6), 20 + rnd(-6, 8));
  Sonido.efecto('fanfarria', 0.9); UI.festejo(T('renovar') + (G.estrellas + 1), '+50 💎', true);
  UI.panel = null; guardar();
}
// la maquinita de arcade (abre los minijuegos) y los cuadros de actividad del mundo
function ARCADE_ARMA(p) { p(28, 5, 40, B.LANA_AZUL); p(29, 5, 40, B.LANA_AZUL); p(28, 6, 40, B.LAMPARA); p(29, 6, 40, B.LAMPARA); p(28, 7, 40, B.LANA_ROJA); p(29, 7, 40, B.LANA_ROJA); p(28, 8, 40, B.LANA_AMARILLA); p(29, 8, 40, B.LANA_AMARILLA); }
const ACT_PADS = [{ id: 'pesca', x: 24, z: 69.4 }, { id: 'arcade', x: 28.5, z: 42.4 }];
function padsActividad(dt) {
  let sobre = null;
  for (const a of ACT_PADS) if (Math.abs(JUG.x - a.x) < 1.2 && Math.abs(JUG.z - a.z) < 1.2) sobre = a;
  if (!sobre || Math.hypot(JUG.vx, JUG.vz) > 1.2) { JUG.tAct = 0.45; JUG.actHecho = sobre ? JUG.actHecho : null; return; }
  if (JUG.actHecho === sobre.id) return;
  JUG.tAct -= dt;
  if (JUG.tAct <= 0) { JUG.actHecho = sobre.id; if (sobre.id === 'pesca') abrirMinijuego('pesca', null); else abrirPanel('minijuegos'); }
}

// ---------- las máquinas y sus pilas ----------
function posPila(m, i) {
  const p = LUGAR.gen[m].pila, k = i % 4, f = Math.floor(i / 4);
  return [p[0] + (k & 1 ? 0.27 : -0.27), SUELO + 0.25 + f * 0.5, p[1] + (k & 2 ? 0.27 : -0.27)];
}
function producir(dt) {
  for (const m in G.gens) {
    const e = G.gens[m], v = VIVO.gen[m] || (VIVO.gen[m] = { t: 0, enCamino: 0 }), tope = ECO.tope[e.nivel - 1];
    if (e.pila + v.enCamino >= tope) { v.t = 0; continue; }
    v.t += dt * ECO.ritmo[e.nivel - 1];
    while (v.t >= 1 && e.pila + v.enCamino < tope) {
      v.t -= 1; const i = e.pila + v.enCamino; v.enCamino++;
      const M = MAQUINAS[m];
      volar(BLOQUE_DE[m], 0.5, M.salida.slice(), posPila(m, i), 0.45, 1.6, () => { v.enCamino--; e.pila++; });
      if (vis() < 0.6) chispas(M.humo[0], M.humo[1], M.humo[2], M.colHumo, 2, 1.2);
    }
  }
}
// el carrito de cada uno: dónde va el bloque i de la pila que lleva en brazos
function posCarga(c, i) {
  const s = Math.sin(c.yaw || 0), co = Math.cos(c.yaw || 0), mec = Math.sin(VIVO.t * 7 + i * 0.4) * Math.min(0.12, i * 0.008) * (c.andar || 0);
  return [c.x + s * 0.42 + co * mec, (c.y || SUELO) + 0.95 + i * 0.4, c.z + co * 0.42 - s * mec];
}
function tomarDePila(c, m, cap) {
  const e = G.gens[m];
  if (!e || e.pila <= 0 || c.carga.length >= cap || faltaJuntar(m) <= 0) return false;
  e.pila--;
  const o = posPila(m, e.pila);
  c.carga.push({ m, t0: VIVO.t, o });
  return true;
}
// entrega el bloque más alto que la obra pida: vuela hasta su lugar y ahí se pone
function entregarUno(c) {
  const P = PARTES[G.parte];
  if (!P) return false;
  for (let i = c.carga.length - 1; i >= 0; i--) {
    const m = c.carga[i].m;
    if (faltaEntregar(m) <= 0) continue;
    c.carga.splice(i, 1);
    const L = ++G.entregado[m], grupo = OBRA.porMat[m].slice(hasta(m, L - 1), hasta(m, L));
    const o = posCarga(c, c.carga.length), d = centroDe(grupo, o);
    const lejos = Math.hypot(d[0] - o[0], d[2] - o[2]);
    volar(BLOQUE_DE[m], 0.5, o, d, 0.5 + lejos * 0.013, 2 + lejos * 0.12, () => aterrizar(m, grupo));
    return true;
  }
  return false;
}
function centroDe(grupo, def) {
  if (!grupo.length) return [24, 8, 20];
  let x = 0, y = 0, z = 0; for (const v of grupo) { x += v[0]; y += v[1]; z += v[2]; }
  const n = grupo.length; return [x / n + 0.5, y / n + 0.5, z / n + 0.5];
}
function aterrizar(m, grupo) {
  colocar(grupo, true);
  OBRA.aterrizado[m] = (OBRA.aterrizado[m] || 0) + 1; G.bloques++; mision('entregar', 1);
  OBRA.fantSucio = true;
  Sonido.efecto(vis() < 0.5 ? 'pop' : 'martillo', 0.55, 0.9 + vis() * 0.25, 0.05);
  if (parteCompleta()) completarParte();
}

// ---------- la plata: la caja y los billetes ----------
function posCajaArriba() { const n = billetesCaja(); const c = LUGAR.caja, k = n % 9, f = Math.floor(n / 9); return [c[0] + ((k % 3) - 1) * 0.62, SUELO + 0.1 + f * 0.17, c[1] + (Math.floor(k / 3) - 1) * 0.42]; }
function billetesCaja() { const v = G.caja - VIVO.cajaVol; return v <= 0 ? 0 : clamp(Math.ceil(v / 10), 1, 72); }
function fmt(n) {
  n = Math.floor(n);
  if (n < 10000) return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, IDIOMA === 'en' ? ',' : '.');
  if (n < 1e6) return (n / 1000).toFixed(n < 1e5 ? 1 : 0).replace('.0', '') + 'K';
  return (n / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'M';
}
function cobrarCaja(dt) {
  const c = LUGAR.caja, en = (Math.abs(JUG.x - c[0]) < 1.5 && Math.abs(JUG.z - c[1]) < 1.5) || G.boosts.iman > 0 || (G.mascota === 'gato' && dist2(JUG.x, JUG.z, c[0], c[1]) < 81);
  if (!en) { VIVO.cajaIni = 0; return; }
  if (G.caja <= 0) return;
  if (!VIVO.cajaIni) VIVO.cajaIni = G.caja;
  JUG.tCaja -= dt;
  while (JUG.tCaja <= 0 && G.caja > 0) {
    JUG.tCaja += 0.035;
    const a = Math.min(G.caja, Math.max(1, Math.ceil(VIVO.cajaIni / 18)));
    const o = posCajaArriba();
    G.caja -= a;
    const k = VIVO.cajaIni ? 1 - G.caja / VIVO.cajaIni : 0;
    const lejos = Math.hypot(JUG.x - c[0], JUG.z - c[1]);
    volar(B.BILLETE, -0.55, o, () => [JUG.x, JUG.y + 1.4, JUG.z], 0.32 + lejos * 0.04, 1.2 + lejos * 0.15, () => { G.dinero += a; G.ganado += a; mision('cobrar', a); UI.pulsoPlata(); Sonido.efecto('moneda', 0.45, 0.9 + k * 0.5, 0.025); });
  }
  if (G.caja <= 0) { Sonido.efecto('caja', 0.7); Sonido.vibrar(25); }
}

// ---------- los cuadros para gastar (desbloquear y mejorar) ----------
const PADS = [];
function armarPads() {
  PADS.length = 0;
  for (const m of MATERIALES) {
    const g = LUGAR.gen[m];
    PADS.push({ id: 'gen_' + m, x: g.pad[0], z: g.pad[1], m,
      precio: () => { const e = G.gens[m]; return !e ? ECO.gen[m].precio : e.nivel < 5 ? ECO.gen[m].upg[e.nivel - 1] : 0; },
      visible: () => G.gens[m] ? G.parte >= 1 : G.parte >= PRIMERA[m] - 1,
      titulo: () => G.gens[m] ? T('gen.' + m) + ' ' + T('nivel') + (G.gens[m].nivel + 1) : T('gen.' + m),
      accion: () => G.gens[m] ? T('mejorar') : T('desbloquear'),
      icono: () => BLOQUE_DE[m] });
  }
  PADS.push({ id: 'mochila', x: LUGAR.mochila[0], z: LUGAR.mochila[1], precio: () => ECO.mochila.precio[G.mochila] || 0, visible: () => G.parte >= 2, titulo: () => T('mochila') + ' ' + capMochila() + '→' + ECO.mochila.cap[G.mochila + 1], accion: () => T('mejorar'), icono: () => B.CAJA });
  PADS.push({ id: 'vel', x: LUGAR.zapatillas[0], z: LUGAR.zapatillas[1], precio: () => ECO.vel.precio[G.vel] || 0, visible: () => G.parte >= 2, titulo: () => T('vel') + ' ' + T('nivel') + (G.vel + 2), accion: () => T('mejorar'), icono: () => B.LANA_AZUL });
  PADS.push({ id: 'ayudante', x: LUGAR.ayudantes.pad[0], z: LUGAR.ayudantes.pad[1], precio: () => ECO.ayudante.precio[G.ayud] || 0, visible: () => G.parte >= 3, titulo: () => T('ayudante') + ' ' + (G.ayud + 1) + '/3', accion: () => T('contratar'), icono: () => B.LANA_ROJA });
}
const padActivo = p => p.visible() && p.precio() > 0;
function pagarPads(dt) {
  let sobre = null;
  for (const p of PADS) if (padActivo(p) && Math.abs(JUG.x - p.x) < 1.3 && Math.abs(JUG.z - p.z) < 1.3) { sobre = p; break; }
  if (!sobre || sobre.id !== JUG.padId) { JUG.padId = sobre ? sobre.id : null; JUG.tPad = 0.35; }
  VIVO.padActivo = sobre;
  if (!sobre || G.dinero <= 0) return;
  if (Math.hypot(JUG.vx, JUG.vz) > 1.6 && JUG.tPad > 0) { JUG.tPad = 0.35; return; }
  JUG.tPad -= dt;
  while (JUG.tPad <= 0 && G.dinero > 0) {
    JUG.tPad += 0.04;
    const precio = sobre.precio(), pagado = G.pads[sobre.id] || 0;
    const a = Math.min(G.dinero, precio - pagado, Math.max(1, Math.ceil(precio / 36)));
    if (a <= 0) break;
    G.dinero -= a; G.pads[sobre.id] = pagado + a;
    volar(B.BILLETE, -0.5, [JUG.x, JUG.y + 1.4, JUG.z], [sobre.x, SUELO + 0.1, sobre.z], 0.28, 1, null);
    Sonido.efecto('moneda', 0.35, 1.3, 0.05);
    if (G.pads[sobre.id] >= precio) { G.pads[sobre.id] = 0; usarPad(sobre); break; }
  }
}
function usarPad(p) {
  Sonido.efecto('desbloquear', 0.9); Sonido.vibrar([20, 20, 40]); mision('mejora', 1);
  for (let k = 0; k < 40; k++) confeti(p.x + rnd(-1, 1), SUELO + 0.5, p.z + rnd(-1, 1));
  if (p.m) {
    if (!G.gens[p.m]) {
      G.gens[p.m] = { nivel: 1, pila: 4 }; VIVO.gen[p.m] = { t: 0, enCamino: 0 };
      VIVO.armando.push(...listaDe(MAQUINAS[p.m].arma).sort((a, b) => a[1] - b[1]));
      UI.aviso(T('abierto', { g: T('gen.' + p.m).toUpperCase() }), 'oro');
    } else { G.gens[p.m].nivel++; UI.aviso(T('subio'), 'oro'); }
  } else if (p.id === 'mochila') { G.mochila++; UI.aviso(T('subio'), 'oro'); }
  else if (p.id === 'vel') { G.vel++; UI.aviso(T('subio'), 'oro'); }
  else if (p.id === 'ayudante') { AYUD.push(nuevoAyudante(G.ayud)); G.ayud++; UI.aviso(T('nuevoAy'), 'oro'); }
  guardar();
}
VIVO.armando = [];
// las máquinas nuevas se arman de a poco, con chispas
function armarMaquinas(dt) {
  if (!VIVO.armando.length) return;
  VIVO.armaT = (VIVO.armaT || 0) - dt;
  while (VIVO.armaT <= 0 && VIVO.armando.length) {
    VIVO.armaT += 0.03;
    const v = VIVO.armando.shift(); colocar([v], true);
    if (Paso.libre(JUG.x, JUG.z) === false) desatascar(JUG);
    if (VIVO.armando.length % 4 === 0) Sonido.efecto('pop', 0.35, 1.1 + vis() * 0.3, 0.04);
  }
}

// ---------- caminar: el constructor y los demás ----------
function libreR(x, z, r) { return Paso.libre(x - r, z - r) && Paso.libre(x + r, z - r) && Paso.libre(x - r, z + r) && Paso.libre(x + r, z + r); }
function moverConChoque(p, dx, dz, r) {
  if (libreR(p.x + dx, p.z, r)) p.x += dx;
  if (libreR(p.x, p.z + dz, r)) p.z += dz;
}
function desatascar(p) {
  if (libreR(p.x, p.z, 0.3)) return;
  const cx = Math.floor(p.x), cz = Math.floor(p.z);
  for (let r = 1; r < 6; r++) for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
    if (Paso.libre(cx + dx, cz + dz) && libreR(cx + dx + 0.5, cz + dz + 0.5, 0.3)) { p.x = cx + dx + 0.5; p.z = cz + dz + 0.5; return; }
  }
}
function moverJugador(dt, ix, iz) {
  const v = ECO.vel.v[G.vel] * multVel(), k = 1 - Math.exp(-dt * 14);
  JUG.vx += (ix * v - JUG.vx) * k; JUG.vz += (iz * v - JUG.vz) * k;
  moverConChoque(JUG, JUG.vx * dt, JUG.vz * dt, 0.3);
  const sp = Math.hypot(JUG.vx, JUG.vz);
  JUG.andar = clamp(sp / 3.2, 0, 1);
  if (sp > 0.4) JUG.yaw += angDif(JUG.yaw, Math.atan2(JUG.vx, JUG.vz)) * (1 - Math.exp(-dt * 15));
  const f0 = JUG.fase; JUG.fase += sp * dt * 2.3;
  if (Math.floor(f0 / PI) !== Math.floor(JUG.fase / PI) && sp > 1) {
    const piso = Mundo.get(Math.floor(JUG.x), SUELO - 1, Math.floor(JUG.z));
    Sonido.paso(piso !== B.PASTO);
    if (R.calidad >= 1 && vis() < 0.5) polvo(JUG.x, JUG.y + 0.05, JUG.z);
  }
  JUG.y = alturaPiso(JUG.x, JUG.z);
}
// lo que hace el constructor según dónde está parado
function interacciones(dt) {
  const P = PARTES[G.parte];
  // las pilas de las máquinas
  JUG.tPila -= dt;
  for (const m in G.gens) {
    const p = LUGAR.gen[m].pila;
    if (dist2(JUG.x, JUG.z, p[0], p[1]) > 1.6 * 1.6) { JUG.avisos[m] = 0; JUG.enPila = 0; continue; }
    JUG.enPila = (JUG.enPila || 0) + dt;
    while (JUG.tPila <= 0) {
      if (tomarDePila(JUG, m, capMochila())) { JUG.tPila += 0.07; Sonido.efecto('recoger', 0.6, 0.85 + JUG.carga.length * 0.025, 0.04); Sonido.vibrar(8); continue; }
      if (!JUG.avisos[m] && G.gens[m].pila > 0 && JUG.enPila > 0.4) {
        if (JUG.carga.length >= capMochila()) { UI.aviso(T('lleno'), 'rojo'); JUG.avisos[m] = 1; }
        else if (faltaJuntar(m) <= 0 && P) { UI.aviso(T('noHace'), 'gris'); JUG.avisos[m] = 1; }
      }
      break;
    }
    if (JUG.tPila < 0) JUG.tPila = 0;
  }
  // la obra
  const o = LUGAR.obra;
  if (Math.abs(JUG.x - o[0]) < 2.3 && Math.abs(JUG.z - o[1]) < 1.8) {
    JUG.tObra -= dt;
    while (JUG.tObra <= 0) { if (!entregarUno(JUG)) { JUG.tObra = 0; break; } JUG.tObra += 0.075; }
  } else JUG.tObra = 0;
  cobrarCaja(dt);
  pagarPads(dt);
  if (G.parte >= 1) padsActividad(dt);
}

// ---------- caminos (A* sobre la grilla de paso) ----------
const AST = { g: new Float32Array(MX * MZ), padre: new Int32Array(MX * MZ), marca: new Uint32Array(MX * MZ), cerr: new Uint32Array(MX * MZ), gen: 0, heap: [] };
function celdaLibre(x, z) {
  const cx = clamp(Math.floor(x), 0, MX - 1), cz = clamp(Math.floor(z), 0, MZ - 1);
  if (Paso.m[cz * MX + cx]) return cz * MX + cx;
  for (let r = 1; r < 8; r++) for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
    const X = cx + dx, Z = cz + dz;
    if (X >= 0 && Z >= 0 && X < MX && Z < MZ && Paso.m[Z * MX + X]) return Z * MX + X;
  }
  return -1;
}
function vista(ax, az, bx, bz) {
  const d = Math.hypot(bx - ax, bz - az), n = Math.ceil(d / 0.3);
  for (let i = 1; i < n; i++) { const t = i / n; if (!libreR(ax + (bx - ax) * t, az + (bz - az) * t, 0.28)) return false; }
  return true;
}
function buscarCamino(x0, z0, x1, z1) {
  const s = celdaLibre(x0, z0), e = celdaLibre(x1, z1);
  if (s < 0 || e < 0) return null;
  const A = AST, gen = ++A.gen, ex = e % MX, ez = (e / MX) | 0, H = A.heap; H.length = 0;
  const h = i => { const dx = Math.abs(i % MX - ex), dz = Math.abs(((i / MX) | 0) - ez); return Math.max(dx, dz) + 0.414 * Math.min(dx, dz); };
  const push = (i, f) => { H.push([f, i]); let k = H.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (H[p][0] <= H[k][0]) break; [H[p], H[k]] = [H[k], H[p]]; k = p; } };
  const pop = () => { const r = H[0], u = H.pop(); if (H.length) { H[0] = u; let k = 0; for (;;) { const a = 2 * k + 1, b = a + 1; let m = k; if (a < H.length && H[a][0] < H[m][0]) m = a; if (b < H.length && H[b][0] < H[m][0]) m = b; if (m === k) break; [H[m], H[k]] = [H[k], H[m]]; k = m; } } return r; };
  A.marca[s] = gen; A.g[s] = 0; A.padre[s] = -1; push(s, h(s));
  let hallado = false, vueltas = 0;
  while (H.length && vueltas++ < 6000) {
    const [, i] = pop();
    if (A.cerr[i] === gen) continue;
    A.cerr[i] = gen;
    if (i === e) { hallado = true; break; }
    const x = i % MX, z = (i / MX) | 0;
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dz) continue;
      const X = x + dx, Z = z + dz; if (X < 0 || Z < 0 || X >= MX || Z >= MZ) continue;
      const j = Z * MX + X; if (!Paso.m[j] || A.cerr[j] === gen) continue;
      if (dx && dz && (!Paso.m[z * MX + X] || !Paso.m[Z * MX + x])) continue;
      const g = A.g[i] + (dx && dz ? 1.414 : 1);
      if (A.marca[j] !== gen || g < A.g[j]) { A.marca[j] = gen; A.g[j] = g; A.padre[j] = i; push(j, g + h(j)); }
    }
  }
  if (!hallado) return null;
  const celdas = []; for (let i = e; i >= 0; i = A.padre[i]) celdas.push(i);
  celdas.reverse();
  const pts = celdas.map(i => [i % MX + 0.5, ((i / MX) | 0) + 0.5]);
  pts[pts.length - 1] = [x1, z1];
  // se acortan las esquinas mirando qué punto lejano se ve sin chocar
  const lisos = []; let a = [x0, z0], k = 0;
  while (k < pts.length) {
    let j = pts.length - 1;
    while (j > k && !vista(a[0], a[1], pts[j][0], pts[j][1])) j--;
    lisos.push(pts[j]); a = pts[j]; k = j + 1;
  }
  return lisos;
}
// sigue un camino; devuelve true al llegar
function seguir(p, dt, vel) {
  if (!p.camino || p.ci >= p.camino.length) { p.andar = acercar(p.andar || 0, 0, dt * 4); return true; }
  const w = p.camino[p.ci], dx = w[0] - p.x, dz = w[1] - p.z, d = Math.hypot(dx, dz);
  if (d < 0.15) { p.ci++; return p.ci >= p.camino.length; }
  const paso = Math.min(d, vel * dt), px = p.x, pz = p.z;
  moverConChoque(p, dx / d * paso, dz / d * paso, 0.25);
  const real = Math.hypot(p.x - px, p.z - pz);
  if (real < paso * 0.3) { p.atasco = (p.atasco || 0) + dt; if (p.atasco > 0.6) { p.atasco = 0; p.camino = buscarCamino(p.x, p.z, p.dest[0], p.dest[1]); p.ci = 0; desatascar(p); } } else p.atasco = 0;
  p.yaw += angDif(p.yaw, Math.atan2(dx, dz)) * (1 - Math.exp(-dt * 12));
  p.andar = acercar(p.andar || 0, 1, dt * 5); p.fase = (p.fase || 0) + real * 2.3;
  p.y = alturaPiso(p.x, p.z);
  return false;
}
function ir(p, x, z) { p.dest = [x, z]; p.camino = buscarCamino(p.x, p.z, x, z) || [[x, z]]; p.ci = 0; }

// ---------- los ayudantes: cargan lo que la obra pide ----------
function nuevoAyudante(i) {
  const c = LUGAR.ayudantes.casa;
  return { i, x: 16.5, z: c[3] + 1.6, y: SUELO, yaw: 0, carga: [], estado: 'pensar', m: null, t: 0, fase: 0, andar: 0, sem: 3 + i * 2, piel: PIELES['ayudante' + (i + 1)], camino: null, ci: 0 };
}
function pensarAyudante(a) {
  const P = PARTES[G.parte];
  if (a.carga.length && P && a.carga.some(c => faltaEntregar(c.m) > 0)) { a.estado = 'aObra'; ir(a, LUGAR.obra[0] + rnd(-1.4, 1.4), LUGAR.obra[1] + rnd(-0.8, 0.8)); return; }
  let mejor = null, mv = 0;
  if (P) for (const m in P.need) if (G.gens[m]) { const f = faltaJuntar(m); const v = f + (G.gens[m].pila > 0 ? 3 : 0) - AYUD.filter(b => b !== a && b.m === m && b.estado !== 'descansa').length * 4; if (f > 0 && v > mv) { mv = v; mejor = m; } }
  if (mejor) { a.m = mejor; a.estado = 'aPila'; const p = LUGAR.gen[mejor].pila; ir(a, p[0] + rnd(-0.5, 0.5), p[1] + rnd(-0.5, 0.5)); return; }
  a.m = null; a.estado = 'descansa'; a.t = 1.5;
  const pd = LUGAR.ayudantes.pad; ir(a, pd[0] - 2 + a.i * 2, pd[1] + 1.8);
}
function actualizarAyudante(a, dt) {
  const vel = ECO.ayudante.v;
  if (a.estado === 'pensar') return pensarAyudante(a);
  if (a.estado === 'aPila') {
    if (seguir(a, dt, vel)) { a.estado = 'carga'; a.t = 0; a.espera = 0; }
  } else if (a.estado === 'carga') {
    a.t -= dt;
    const p = LUGAR.gen[a.m].pila;
    a.yaw += angDif(a.yaw, Math.atan2(p[0] - a.x, p[1] - a.z)) * 0.2;
    if (a.t <= 0) {
      a.t = 0.12;
      if (!tomarDePila(a, a.m, ECO.ayudante.cap)) {
        a.espera += 0.12;
        if (a.carga.length >= ECO.ayudante.cap || faltaJuntar(a.m) <= 0 || (a.carga.length && a.espera > 1.5) || a.espera > 4) a.estado = 'pensar';
      } else a.espera = 0;
    }
  } else if (a.estado === 'aObra') {
    if (seguir(a, dt, vel)) { a.estado = 'entrega'; a.t = 0; }
  } else if (a.estado === 'entrega') {
    a.t -= dt;
    a.yaw += angDif(a.yaw, Math.atan2(24 - a.x, 22 - a.z)) * 0.2;
    if (a.t <= 0) { a.t = 0.1; if (!entregarUno(a)) a.estado = 'pensar'; }
  } else if (a.estado === 'descansa') {
    seguir(a, dt, vel * 0.7);
    a.t -= dt; if (a.t <= 0) a.estado = 'pensar';
  }
}

// ---------- los visitantes: vienen del muelle, miran la mansión, pagan y se van ----------
function actualizarVisitas(dt) {
  if (G.parte >= 1) {
    VIVO.visitaT -= dt;
    if (VIVO.visitaT <= 0) {
      const e = ECO.visita(G.parte); VIVO.visitaT = e.cada * azR(0.8, 1.2);
      if (VIS.length < 9) {
        const vip = G.parte >= 2 && az() < 0.1;
        const v = { x: 24 + azR(-0.6, 0.6), z: 70.4, y: SUELO, yaw: PI, estado: 'llega', t: 0, fase: 0, andar: 0, sem: az() * 9, vip, piel: vip ? PIELES.vip : PIELES['visitante' + (1 + Math.floor(az() * 6))], paga: Math.round(e.paga * multPaga() * (vip ? 5 : 1)), camino: null, ci: 0 };
        let mx = 20 + az() * 8, mz = 32.6 + az() * 1.4; ir(v, mx, mz); VIS.push(v);
      }
    }
  }
  for (let i = 0; i < VIS.length; i++) {
    const v = VIS[i];
    if (v.estado === 'llega') { if (seguir(v, dt, 2.6)) { v.estado = 'mira'; v.t = 2.5 + az() * 2; } }
    else if (v.estado === 'mira') {
      v.yaw += angDif(v.yaw, Math.atan2(24 - v.x, 19 - v.z)) * 0.1; v.mirarAbajo = -0.25;
      v.t -= dt;
      if (v.t < 1.2 && !v.foto) { v.foto = 1; destello(v.x, v.y + 1.6, v.z); }
      if (v.t <= 0) { v.mirarAbajo = 0; v.estado = 'paga'; const c = LUGAR.caja; ir(v, c[0] + 1.9, c[1] + 0.6 + az() * 0.8); }
    } else if (v.estado === 'paga') {
      if (seguir(v, dt, 2.6)) {
        G.caja += v.paga; VIVO.cajaVol += v.paga; G.visitas++; mision('visitas', 1);
        if (v.vip) { for (let k = 0; k < 16; k++) chispas(v.x, v.y + 1.5, v.z, '#ffd34a', 1, 2.5); UI.aviso('VIP +$' + fmt(v.paga), 'oro'); }
        const pg = v.paga;
        volar(B.BILLETE, -0.5, [v.x, v.y + 1.3, v.z], () => posCajaArriba(), 0.45, 1.2, () => { VIVO.cajaVol -= pg; });
        v.estado = 'vuelve'; v.festejo = 0.6; ir(v, 24 + azR(-0.6, 0.6), 70.6);
      }
    } else if (v.estado === 'vuelve') {
      if (v.festejo > 0) { v.festejo -= dt; continue; }
      if (seguir(v, dt, 2.6)) { VIS[i] = VIS[VIS.length - 1]; VIS.pop(); i--; }
    }
  }
}

// ---------- lo que vuela (bloques, billetes) ----------
function volar(b, esc, o, d, dur, alto, al, demora) {
  VOL.push({ b, esc, o, d, t0: VIVO.t + (demora || 0), dur, alto, al, giro: (vis() - 0.5) * 6 });
}
function actualizarVuelos() {
  for (let i = 0; i < VOL.length; i++) {
    const v = VOL[i];
    if (VIVO.t >= v.t0 + v.dur) { VOL[i] = VOL[VOL.length - 1]; VOL.pop(); i--; if (v.al) v.al(); }
  }
}
function posVuelo(v, out) {
  const k = clamp((VIVO.t - v.t0) / v.dur, 0, 1), d = typeof v.d === 'function' ? v.d() : v.d, o = typeof v.o === 'function' ? v.o() : v.o;
  const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
  out[0] = lerp(o[0], d[0], e); out[1] = lerp(o[1], d[1], e) + v.alto * 4 * k * (1 - k); out[2] = lerp(o[2], d[2], e);
  return k;
}

// ---------- adónde tiene que ir el jugador ahora ----------
function objetivo() {
  const P = PARTES[G.parte];
  if (!P) {
    if (G.caja > 0) return { tipo: 'plata', x: LUGAR.caja[0], z: LUGAR.caja[1] };
    for (const p of PADS) if (padActivo(p) && G.dinero >= p.precio() - (G.pads[p.id] || 0)) return { tipo: 'mejora', x: p.x, z: p.z };
    return null;
  }
  if (JUG.carga.some(c => faltaEntregar(c.m) > 0)) return { tipo: 'entrega', x: LUGAR.obra[0], z: LUGAR.obra[1] };
  const mats = Object.keys(P.need).filter(m => faltaJuntar(m) > 0);
  const abiertos = mats.filter(m => G.gens[m]);
  if (abiertos.length && JUG.carga.length < capMochila()) {
    abiertos.sort((a, b) => (G.gens[b].pila > 0) - (G.gens[a].pila > 0) || dist2(JUG.x, JUG.z, ...LUGAR.gen[a].pila) - dist2(JUG.x, JUG.z, ...LUGAR.gen[b].pila));
    const m = abiertos[0], p = LUGAR.gen[m].pila;
    return { tipo: 'junta', m, x: p[0], z: p[1] };
  }
  const cerrado = mats.find(m => !G.gens[m]);
  if (cerrado) {
    const pad = PADS.find(p => p.m === cerrado), falta = pad.precio() - (G.pads[pad.id] || 0);
    if (G.dinero >= falta) return { tipo: 'desbloquear', g: cerrado, x: pad.x, z: pad.z };
    return { tipo: G.caja > 0 ? 'plata' : 'espera', x: LUGAR.caja[0], z: LUGAR.caja[1] };
  }
  if (JUG.carga.length) return { tipo: 'entrega', x: LUGAR.obra[0], z: LUGAR.obra[1] };
  if (G.caja > 0) return { tipo: 'plata', x: LUGAR.caja[0], z: LUGAR.caja[1] };
  return null;
}
function textoObjetivo(o) {
  if (!o) return '';
  if (o.tipo === 'junta') return T('obj.junta', { m: T('mat.' + o.m) });
  if (o.tipo === 'desbloquear') return T('obj.desbloquear', { g: T('gen.' + o.g) });
  return T('obj.' + o.tipo);
}

// ---------- un paso de la simulación ----------
function actualizarJuego(dt, ix, iz) {
  VIVO.t += dt; G.jugado += dt;
  moverJugador(dt, ix, iz);
  if (!libreR(JUG.x, JUG.z, 0.3)) desatascar(JUG);
  producir(dt);
  interacciones(dt);
  armarMaquinas(dt);
  for (const a of AYUD) actualizarAyudante(a, dt);
  actualizarVisitas(dt);
  for (const k in G.boosts) if (G.boosts[k] > 0) G.boosts[k] = Math.max(0, G.boosts[k] - dt);
  actualizarMascota(dt);
  actualizarCofres(dt);
  for (const v of VIS) if (v.vip && vis() < dt * 6) chispas(v.x, v.y + 1.2, v.z, '#ffe27a', 1, 0.8);
  actualizarVuelos();
  actualizarParticulas(dt);
  // humo de las máquinas y de las chimeneas
  VIVO.humoT -= dt;
  if (VIVO.humoT <= 0) {
    VIVO.humoT = 0.25;
    for (const m in G.gens) { const M = MAQUINAS[m]; if (m === 'vidrio' || m === 'oro' || vis() < 0.3) humo(M.humo[0], M.humo[1], M.humo[2], M.colHumo); }
    if (G.parte > 8) for (const cx of [16, 32]) humo(cx, 23.2, 15, '#d8d8d8');
  }
  VIVO.objT -= dt;
  if (VIVO.objT <= 0) { VIVO.objT = 0.25; VIVO.obj = objetivo(); }
  if (VIVO.festejo > 0) VIVO.festejo -= dt;
  VIVO.guardarT += dt;
  if (VIVO.guardarT > 5) { VIVO.guardarT = 0; guardar(); }
}
