// MANSION BUILDER — la mansión por partes (cada parte es una lista de bloques), las máquinas y los números del juego
// la casa mira a +z (hacia la cámara): frente en z=25, fondo en z=12, de x=12 a x=35; planta baja y 6..9, alta y 11..14
const ECO = {
  mochila: { cap: [8, 12, 16, 22, 30], precio: [60, 220, 650, 1600] },
  vel: { v: [4.3, 5.1, 5.9, 6.7], precio: [90, 340, 950] },
  ayudante: { precio: [150, 650, 1900], cap: 6, v: 3.4 },
  gen: {
    madera: { precio: 0, upg: [70, 200, 520, 1300] },
    piedra: { precio: 30, upg: [120, 320, 800, 1800] },
    vidrio: { precio: 220, upg: [300, 700, 1500, 3000] },
    marmol: { precio: 650, upg: [800, 1600, 3000, 5000] },
    oro: { precio: 2600, upg: [2000, 3500, 6000, 9000] },
  },
  ritmo: [0.8, 1.2, 1.7, 2.3, 3.0],                     // bloques por segundo según el nivel de la máquina
  tope: [12, 16, 22, 28, 36],                           // cuántos entran en la pila
  visita: n => ({ cada: Math.max(3, 11 - n * 0.6), paga: 2 + n * 2 }),
  diario: n => 50 + n * 60,
};
const CASA = { x0: 12, x1: 35, z0: 12, z1: 25 };
const PIL_X = [12, 18, 22, 25, 29, 35], PIL_Z = [12, 17, 20, 25];
const VEN_X = [[14, 16], [20, 21], [26, 27], [31, 33]], VEN_Z = [[14, 15], [22, 23]];
const enRango = (v, R) => R.some(([a, b]) => v >= a && v <= b);
function esPilastra(x, z) { return ((z === CASA.z0 || z === CASA.z1) && PIL_X.includes(x)) || ((x === CASA.x0 || x === CASA.x1) && PIL_Z.includes(z)); }
const esPuerta = (x, z) => z === CASA.z1 && (x === 23 || x === 24);
// ventana de planta baja (filas 7 y 8) o alta (filas 12 y 13; la puerta del balcón baja hasta 11)
function esVentana(x, z) {
  if (esPilastra(x, z)) return false;
  if (z === CASA.z0 || z === CASA.z1) return enRango(x, VEN_X) || (z === CASA.z0 && (x === 23 || x === 24));
  return enRango(z, VEN_Z);
}
function perimetro(f) { for (let x = CASA.x0; x <= CASA.x1; x++) { f(x, CASA.z0); f(x, CASA.z1); } for (let z = CASA.z0 + 1; z < CASA.z1; z++) { f(CASA.x0, z); f(CASA.x1, z); } }
const alturaTecho = (x, z) => 15 + Math.min(x - 11, 36 - x, z - 11, 26 - z, 7);
// las 13 partes: lo que piden (en bloques entregados), el premio y los bloques que agregan al mundo
const PARTES = [
  { id: 'piso', need: { madera: 10 }, premio: 40, arma(p) {
    for (let z = CASA.z0; z <= CASA.z1; z++) for (let x = CASA.x0; x <= CASA.x1; x++) p(x, 5, z, x === CASA.x0 || x === CASA.x1 || z === CASA.z0 || z === CASA.z1 || (x - 12) % 6 === 5 ? B.TABLAS_OSC : B.TABLAS);
  } },
  { id: 'cimientos', need: { piedra: 14 }, premio: 60, arma(p) {
    for (let z = 11; z <= 26; z++) for (let x = 11; x <= 36; x++) if (x === 11 || x === 36 || z === 11 || z === 26) p(x, 5, z, B.LADRILLO_PIEDRA);
    for (let z = 27; z <= 28; z++) for (let x = 16; x <= 31; x++) p(x, 5, z, x === 16 || x === 31 || z === 28 ? B.LADRILLO_PIEDRA : B.LISO);
    for (let x = 21; x <= 26; x++) p(x, 5, 29, B.LOSA_PIEDRA);
  } },
  { id: 'paredes', need: { madera: 16, piedra: 16 }, premio: 90, arma(p) {
    perimetro((x, z) => {
      if (esPilastra(x, z)) for (let y = 6; y <= 8; y++) p(x, y, z, B.TRONCO_OSC);
      else if (!esPuerta(x, z)) { p(x, 6, z, B.LADRILLO_PIEDRA); if (!esVentana(x, z)) { p(x, 7, z, B.LADRILLOS); p(x, 8, z, B.LADRILLOS); } }
      p(x, 9, z, B.TABLAS_OSC);
    });
  } },
  { id: 'puerta', need: { madera: 8 }, premio: 60, arma(p) {
    p(23, 6, 25, B.PUERTA_ABAJO); p(24, 6, 25, B.PUERTA_ABAJO); p(23, 7, 25, B.PUERTA_ARRIBA); p(24, 7, 25, B.PUERTA_ARRIBA);
    for (let x = 22; x <= 25; x++) p(x, 9, 26, B.LOSA_OSCURA);
    p(22, 8, 26, B.LAMPARA); p(25, 8, 26, B.LAMPARA);
  } },
  { id: 'ventanas', need: { vidrio: 14 }, premio: 170, arma(p) {
    perimetro((x, z) => { if (esVentana(x, z)) { p(x, 7, z, B.VIDRIO); p(x, 8, z, B.VIDRIO); } else if (esPuerta(x, z)) p(x, 8, z, B.VIDRIO); });
  } },
  { id: 'entrepiso', need: { piedra: 24 }, premio: 250, arma(p) {
    for (let z = CASA.z0; z <= CASA.z1; z++) for (let x = CASA.x0; x <= CASA.x1; x++) p(x, 10, z, x === CASA.x0 || x === CASA.x1 || z === CASA.z0 || z === CASA.z1 ? B.LADRILLO_PIEDRA : B.LISO);
  } },
  { id: 'alta', need: { marmol: 24, madera: 10 }, premio: 350, arma(p) {
    perimetro((x, z) => {
      if (esPilastra(x, z)) for (let y = 11; y <= 13; y++) p(x, y, z, B.PILAR);
      else if (esPuerta(x, z)) { /* la puerta del balcón: vidrio de 11 a 13 */ }
      else { p(x, 11, z, B.CUARZO_LADRILLO); if (!esVentana(x, z)) { p(x, 12, z, B.CUARZO); p(x, 13, z, B.CUARZO); } }
      p(x, 14, z, B.TABLAS_OSC);
    });
  } },
  { id: 'ventanales', need: { vidrio: 18 }, premio: 300, arma(p) {
    perimetro((x, z) => { if (esPuerta(x, z)) for (let y = 11; y <= 13; y++) p(x, y, z, B.VIDRIO); else if (esVentana(x, z)) { p(x, 12, z, B.VIDRIO); p(x, 13, z, B.VIDRIO); } });
  } },
  { id: 'techo', need: { piedra: 32 }, premio: 500, arma(p) {
    for (let k = 0; k <= 7; k++) {
      const x0 = 11 + k, x1 = 36 - k, z0 = 11 + k, z1 = 26 - k;
      for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) if (k === 7 || x === x0 || x === x1 || z === z0 || z === z1) p(x, 15 + k, z, k === 0 ? B.LOSA_PIZARRA : B.PIZARRA);
    }
    for (const cx of [15, 31]) for (let z = 14; z <= 15; z++) for (let x = cx; x <= cx + 1; x++) for (let y = alturaTecho(x, z) + 1; y <= 22; y++) p(x, y, z, B.LADRILLOS);
  } },
  { id: 'balcon', need: { marmol: 20 }, premio: 500, arma(p) {
    for (const x of [16, 20, 27, 31]) for (let y = 6; y <= 9; y++) p(x, y, 28, B.PILAR);
    for (let z = 26; z <= 28; z++) for (let x = 16; x <= 31; x++) p(x, 10, z, B.CUARZO);
    for (let x = 16; x <= 31; x++) p(x, 11, 28, B.LOSA_CUARZO);
    for (const x of [16, 31]) for (let z = 26; z <= 27; z++) p(x, 11, z, B.LOSA_CUARZO);
  } },
  { id: 'jardin', need: { madera: 14, piedra: 14 }, premio: 600, arma(p) {
    for (let z = 30; z <= 32; z++) for (let x = 22; x <= 25; x++) p(x, 4, z, B.ADOQUIN);
    for (let x = 17; x <= 21; x++) p(x, 4, 30, B.ADOQUIN);
    for (let x = 26; x <= 31; x++) p(x, 4, 30, B.ADOQUIN);
    // la cerca: postes de tronco con seto en el medio (sin tapar la pileta ni la fuente)
    const borde = (x, z) => {
      if (z === 31 && x >= 21 && x <= 26) return;
      if ((x <= 15 && z >= 27) || (x >= 31 && z >= 26)) return;
      const poste = (x + z) % 3 === 0 || (x === 9 || x === 38) && (z === 6 || z === 31);
      p(x, 5, z, poste ? B.TRONCO : B.SETO);
      if (poste) p(x, 6, z, B.LOSA_TABLAS);
    };
    for (let x = 9; x <= 38; x++) { borde(x, 6); borde(x, 31); }
    for (let z = 7; z <= 30; z++) { borde(9, z); borde(38, z); }
    for (const x of [20, 27]) { p(x, 5, 29, B.TRONCO_OSC); p(x, 6, 29, B.TRONCO_OSC); p(x, 7, 29, B.LAMPARA); }
    // canteros de flores
    const flores = [B.FLOR_ROJA, B.FLOR_AMARILLA, B.FLOR_AZUL, B.FLOR_BLANCA];
    for (const x of [17, 18, 19, 28, 29, 30]) p(x, 5, 29, flores[(x * 7) % 4]);
    for (let z = 8; z <= 9; z++) for (let x = 11; x <= 36; x++) if ((x + z) % 2 === 0) p(x, 5, z, flores[(x + z * 3) % 4]);
  } },
  { id: 'pileta', need: { marmol: 18, vidrio: 7 }, premio: 800, arma(p) {
    for (let z = 28; z <= 30; z++) for (let x = 10; x <= 14; x++) p(x, 4, z, B.CUARZO);
    for (let z = 27; z <= 31; z++) for (let x = 9; x <= 15; x++) {
      const anillo = x === 9 || x === 15 || z === 27 || z === 31;
      if (anillo) p(x, 5, z, z === 31 ? B.VIDRIO : B.CUARZO_LADRILLO);
      else p(x, 5, z, B.AGUA);
    }
    p(12, 6, 27, B.LOSA_TABLAS); p(13, 6, 27, B.LOSA_TABLAS);
  } },
  { id: 'oro', need: { oro: 24 }, premio: 2000, arma(p) {
    for (let z = 27; z <= 31; z++) for (let x = 32; x <= 36; x++) {
      const anillo = x === 32 || x === 36 || z === 27 || z === 31;
      if (anillo) p(x, 5, z, B.ORO); else if (!(x === 34 && z === 29)) p(x, 5, z, B.AGUA);
    }
    for (let y = 5; y <= 7; y++) p(34, y, 29, B.ORO);
    p(34, 8, 29, B.LAMPARA);
    for (const x of [18, 29]) for (const z of [18, 19]) p(x, 23, z, B.ORO);
    for (const cx of [15, 31]) for (let z = 14; z <= 15; z++) for (let x = cx; x <= cx + 1; x++) p(x, 23, z, B.ORO);
    p(16, 11, 28, B.ORO); p(31, 11, 28, B.ORO);
  } },
];
// cuánto pide de verdad una parte: las del final piden más, y cada mansión nueva (estrella) un 25% más
function necesita(i, m) { const P = PARTES[i]; if (!P || !P.need[m]) return 0; return Math.round(P.need[m] * (i >= 8 ? 1.6 : i >= 4 ? 1.3 : 1) * (1 + 0.25 * (G.estrellas || 0))); }
// los estilos de cada mansión nueva: mismos materiales, otros bloques
const ESTILOS = [
  {},
  { LADRILLOS: 'TERRACOTA', PIZARRA: 'TEJADO_ROJO', LOSA_PIZARRA: 'LOSA_TEJADO', TRONCO_OSC: 'TRONCO', VIDRIO: 'CRISTAL_AZUL' },
  { LADRILLOS: 'HORM_NEGRO', PIZARRA: 'LISO', LOSA_PIZARRA: 'LOSA_LISO', TRONCO_OSC: 'TABLAS_OSC', CUARZO_LADRILLO: 'CUARZO', VIDRIO: 'CRISTAL_AZUL', PILAR: 'CUARZO' },
  { LADRILLOS: 'ADOQUIN', PIZARRA: 'TEJADO_ROJO', LOSA_PIZARRA: 'LOSA_TEJADO', CUARZO: 'CUARZO_LADRILLO', TABLAS_OSC: 'TABLAS' },
];
const _estilo = [];
function bloqueEstilo(b) {
  const e = ESTILOS[(G.estrellas || 0) % ESTILOS.length];
  if (!_estilo[b]) _estilo[b] = {};
  const nom = BLOQ[b].nom; return e[nom] ? B[e[nom]] : b;
}
function listaParte(i) { return listaDe(PARTES[i].arma).map(v => [v[0], v[1], v[2], bloqueEstilo(v[3])]); }
// ---------- las máquinas de cada material (se arman al desbloquearlas) ----------
// salida: de dónde sale cada bloque nuevo; humo: dónde echan partículas
const MAQUINAS = {
  madera: { salida: [9.5, 6.2, 41.6], humo: [9.5, 6.6, 40.5], colHumo: '#d8b878', arma(p) {
    for (let z = 38; z <= 40; z++) for (let x = 5; x <= 7; x++) for (let y = 5; y <= 6; y++) if (!(y === 6 && x === 7 && z === 40)) p(x, y, z, B.TRONCO_ACOSTADO);
    p(6, 7, 39, B.TRONCO_ACOSTADO);
    for (const [x, z] of [[8, 38], [11, 38], [8, 42], [11, 42]]) for (let y = 5; y <= 7; y++) p(x, y, z, B.TRONCO);
    for (let z = 38; z <= 42; z++) for (let x = 8; x <= 11; x++) p(x, 8, z, B.LOSA_TABLAS);
    p(9, 5, 40, B.TABLAS_OSC); p(10, 5, 40, B.TABLAS_OSC); p(9, 6, 40, B.HIERRO);
    p(10, 5, 41, B.CAJA);
  } },
  piedra: { salida: [37.5, 7.2, 41.6], humo: [37, 7.4, 40.5], colHumo: '#b8b8b8', arma(p) {
    for (let z = 38; z <= 40; z++) for (let x = 39; x <= 42; x++) {
      const h = 5 + (x >= 40 && x <= 41 && z === 39 ? 2 : (x === 39 || z === 40) ? 0 : 1);
      for (let y = 5; y <= h; y++) p(x, y, z, [B.PIEDRA, B.PIEDRA_MUSGO, B.ADOQUIN, B.GRAVA][(x * 3 + z + y) % 4]);
    }
    for (let z = 40; z <= 41; z++) for (let x = 36; x <= 37; x++) { p(x, 5, z, B.HORM_AMARILLO); p(x, 6, z, B.HIERRO); }
    p(38, 5, 42, B.HORM_NEGRO); p(42, 5, 42, B.PIEDRA);
  } },
  vidrio: { salida: [8.5, 6.2, 58.6], humo: [8.5, 11.2, 56.5], colHumo: '#9aa0a8', arma(p) {
    for (let z = 55; z <= 57; z++) for (let x = 7; x <= 9; x++) for (let y = 5; y <= 7; y++) p(x, y, z, x === 8 && z === 57 && y === 5 ? B.HORNO : B.LADRILLOS);
    for (let y = 8; y <= 10; y++) p(8, y, 56, B.LADRILLOS);
    for (let z = 55; z <= 57; z++) p(5, 5, z, B.ARENA); p(6, 5, 55, B.ARENA); p(6, 5, 56, B.ARENA); p(5, 6, 56, B.ARENA);
    p(10, 5, 55, B.VIDRIO); p(11, 5, 55, B.VIDRIO); p(10, 6, 55, B.VIDRIO);
    p(11, 5, 57, B.CAJA);
  } },
  marmol: { salida: [38.5, 6.2, 58.6], humo: [40.5, 7, 57.5], colHumo: '#f4f0ea', arma(p) {
    for (let z = 55; z <= 56; z++) for (let x = 36; x <= 37; x++) { p(x, 5, z, B.CUARZO); p(x, 6, z, B.CUARZO); }
    for (let y = 5; y <= 7; y++) p(38, y, 55, B.PILAR);
    for (let z = 55; z <= 56; z++) for (let x = 39; x <= 40; x++) p(x, 5, z, B.CUARZO_LADRILLO);
    p(40, 5, 57, B.HIERRO); p(41, 5, 57, B.HIERRO); p(40, 6, 57, B.HIERRO);
    p(42, 5, 58, B.CAJA); p(42, 5, 57, B.CAJA); p(42, 6, 58, B.CAJA);
  } },
  oro: { salida: [24, 6.4, 62.4], humo: [24, 6.5, 63.5], colHumo: '#ffe27a', arma(p) {
    // dos torres de roca con mineral y un arco de tablas: el camino al muelle pasa por abajo
    for (const [a, b] of [[20, 22], [26, 28]]) for (let z = 62; z <= 65; z++) for (let x = a; x <= b; x++) {
      const alto = 7 - ((x === 20 || x === 28) ? 1 : 0) - (z === 62 ? 1 : 0);
      for (let y = 5; y <= alto; y++) p(x, y, z, hash2(x * 7 + y, z * 3) < 0.3 ? B.MINERAL_ORO : (hash2(x, y + z) < 0.5 ? B.PIEDRA : B.ADOQUIN));
    }
    for (let x = 22; x <= 26; x++) for (let z = 62; z <= 64; z++) p(x, 8, z, z === 62 ? B.TABLAS_OSC : B.PIEDRA);
    p(24, 7, 63, B.LAMPARA);
    p(21, 7, 62, B.LAMPARA); p(27, 7, 62, B.LAMPARA);
  } },
};
// lista de bloques de una parte o máquina, sin repetidos
function listaDe(arma) {
  const L = [], vistos = new Set();
  arma((x, y, z, b) => { const k = (y * MZ + z) * MX + x; if (vistos.has(k) || !Mundo.dentro(x, y, z)) return; vistos.add(k); L.push([x, y, z, b]); });
  return L;
}
