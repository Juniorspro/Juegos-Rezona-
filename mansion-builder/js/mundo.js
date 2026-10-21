// MANSION BUILDER — el mundo: una isla de bloques con playa, bosque, caminos y el terreno de la mansión
const MX = 48, MY = 40, MZ = 72, SUELO = 5;            // SUELO: la altura donde se camina (arriba del pasto)
const CH = 16;                                          // trozos de 16×16 columnas
const NCX = Math.ceil(MX / CH), NCZ = Math.ceil(MZ / CH);
const Mundo = {
  b: new Uint8Array(MX * MY * MZ),
  sucios: new Set(), cambio: 0, altoT: new Uint8Array(NCX * NCZ),
  dentro: (x, y, z) => x >= 0 && y >= 0 && z >= 0 && x < MX && y < MY && z < MZ,
  get(x, y, z) { return x >= 0 && y >= 0 && z >= 0 && x < MX && y < MY && z < MZ ? this.b[(y * MZ + z) * MX + x] : 0; },
  set(x, y, z, v) {
    if (!(x >= 0 && y >= 0 && z >= 0 && x < MX && y < MY && z < MZ)) return;
    const i = (y * MZ + z) * MX + x;
    if (this.b[i] === v) return;
    this.b[i] = v; this.cambio++;
    const cx = (x / CH) | 0, cz = (z / CH) | 0;
    if (v && y > this.altoT[cx + cz * NCX]) this.altoT[cx + cz * NCX] = y;
    this.sucios.add(cx + cz * NCX);
    const lx = x % CH, lz = z % CH;
    if (lx === 0 && cx > 0) this.sucios.add(cx - 1 + cz * NCX);
    if (lx === CH - 1 && cx < NCX - 1) this.sucios.add(cx + 1 + cz * NCX);
    if (lz === 0 && cz > 0) this.sucios.add(cx + (cz - 1) * NCX);
    if (lz === CH - 1 && cz < NCZ - 1) this.sucios.add(cx + (cz + 1) * NCX);
    if (y >= SUELO - 1 && y <= SUELO + 2) Paso.marcar(x, z);
  },
  caja(x0, y0, z0, x1, y1, z1, v) { for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) this.set(x, y, z, v); },
  opaco(x, y, z) { const v = this.get(x, y, z); return v ? BLOQ[v].o : false; },
};
// la isla: distancia con signo a un rectángulo redondeado, con la orilla ondulada
const ISLA = { x0: 4, x1: 43, z0: 4, z1: 67, r: 9 };
function distIsla(x, z) {
  const cx = (ISLA.x0 + ISLA.x1) / 2, cz = (ISLA.z0 + ISLA.z1) / 2, hx = (ISLA.x1 - ISLA.x0) / 2 - ISLA.r, hz = (ISLA.z1 - ISLA.z0) / 2 - ISLA.r;
  const qx = Math.abs(x + 0.5 - cx) - hx, qz = Math.abs(z + 0.5 - cz) - hz;
  const d = Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0) - ISLA.r;
  return d + (ruido2(x * 0.18, z * 0.18) - 0.5) * 3.2;
}
// los lugares del juego (centros en coordenadas del mundo)
const LUGAR = {
  inicio: [24, 49],
  obra: [24, 34.5],                    // donde se entregan los bloques para construir
  caja: [32.5, 35],                    // donde se junta la plata
  lote: [9, 6, 38, 31],                // terreno de la mansión (x0, z0, x1, z1)
  gen: {
    madera: { maq: [5, 38, 11, 42], pila: [8.5, 44.6], pad: [12.4, 44.6] },
    piedra: { maq: [36, 38, 42, 42], pila: [39.5, 44.6], pad: [35.6, 44.6] },
    vidrio: { maq: [5, 55, 11, 59], pila: [8.5, 61.6], pad: [12.4, 61.6] },
    marmol: { maq: [36, 55, 42, 59], pila: [39.5, 61.6], pad: [35.6, 61.6] },
    oro: { maq: [20, 62, 28, 65], pila: [24, 59.8], pad: [19.8, 59.4] },
  },
  ayudantes: { casa: [14, 50, 18, 54], pad: [16, 57] },
  mochila: [30.5, 52.5], zapatillas: [34, 52.5],
  muelle: [23, 66, 25, 71],
};
function generarMundo() {
  const W = Mundo;
  W.b.fill(0); W.altoT.fill(0);
  const r = rngSemilla(2024);
  for (let z = 0; z < MZ; z++) for (let x = 0; x < MX; x++) {
    const d = distIsla(x, z);
    W.set(x, 0, z, B.PIEDRA);
    if (d < -2.6) { W.caja(x, 1, z, x, 2, z, B.PIEDRA); W.set(x, 3, z, B.TIERRA); W.set(x, 4, z, B.PASTO); }
    else if (d < -1.2) { W.caja(x, 1, z, x, 3, z, B.ARENA); W.set(x, 4, z, B.ARENA); }
    else if (d < 0.2) { W.caja(x, 1, z, x, 3, z, B.ARENA); }
    else if (d < 3.5) { W.caja(x, 1, z, x, 2, z, B.ARENA); W.set(x, 3, z, B.AGUA); }
    else { W.set(x, 1, z, r() < 0.3 ? B.GRAVA : B.ARENA); W.caja(x, 2, z, x, 3, z, B.AGUA); }
  }
  const pasto = (x, z) => W.get(x, 4, z) === B.PASTO && !W.get(x, 5, z);
  const libre = (x, z, m) => { // lejos de las zonas de juego
    const [lx0, lz0, lx1, lz1] = LUGAR.lote; if (x >= lx0 - m && x <= lx1 + m && z >= lz0 - m && z <= lz1 + m) return false;
    for (const k in LUGAR.gen) { const g = LUGAR.gen[k], q = g.maq; if (x >= q[0] - m && x <= q[2] + m && z >= q[1] - m && z <= q[3] + m + 4) return false; }
    const zonas = [[LUGAR.obra, 4], [LUGAR.caja, 3], [LUGAR.inicio, 4], [LUGAR.ayudantes.pad, 3], [LUGAR.mochila, 2.5], [LUGAR.zapatillas, 2.5]];
    for (const k in LUGAR.gen) zonas.push([LUGAR.gen[k].pad, 2.2], [LUGAR.gen[k].pila, 2.4]);
    for (const [p, rr] of zonas) if (Math.hypot(x + 0.5 - p[0], z + 0.5 - p[1]) < rr + m) return false;
    const c = LUGAR.ayudantes.casa; if (x >= c[0] - m && x <= c[2] + m && z >= c[1] - m && z <= c[3] + m + 3) return false;
    if (Math.abs(x + 0.5 - 24) < 2.5 + m && z > 33) return false;   // camino central
    return true;
  };
  // caminos de grava y piedra lisa
  const camino = (x0, z0, x1, z1) => { for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++) for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) if (W.get(x, 4, z) === B.PASTO) W.set(x, 4, z, (x + z) % 7 === 0 ? B.GRAVA : B.LISO); };
  camino(23, 33, 25, 66);
  camino(9, 46, 22, 47); camino(26, 46, 39, 47);
  camino(9, 63, 22, 63); camino(26, 63, 39, 63);
  camino(8, 43, 9, 46); camino(39, 43, 40, 46);
  camino(26, 35, 31, 36);
  // muelle de tablas hacia el agua
  { const [x0, z0, x1, z1] = LUGAR.muelle; for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) { if (W.get(x, 4, z) !== B.PASTO && W.get(x, 4, z) !== B.LISO) W.set(x, 4, z, B.LOSA_TABLAS); } W.set(x0, 4, z1, B.TRONCO); W.set(x1, 4, z1, B.TRONCO); W.set(x0, 3, z1, B.TRONCO); W.set(x1, 3, z1, B.TRONCO); }
  // árboles: el bosque de la izquierda y sueltos por los bordes
  const arbol = (x, z, alto, osc) => {
    if (!pasto(x, z)) return false;
    const tr = osc ? B.TRONCO_OSC : B.TRONCO;
    for (let y = 5; y < 5 + alto; y++) W.set(x, y, z, tr);
    const top = 5 + alto;
    for (let y = top - 3; y <= top; y++) {
      const rad = y >= top ? 1 : y >= top - 1 ? 2 : 2;
      for (let dz = -rad; dz <= rad; dz++) for (let dx = -rad; dx <= rad; dx++) {
        if (Math.abs(dx) === rad && Math.abs(dz) === rad && (y >= top - 1 || r() < 0.6)) continue;
        if (!W.get(x + dx, y, z + dz)) W.set(x + dx, y, z + dz, B.HOJAS);
      }
    }
    return true;
  };
  for (let k = 0; k < 420; k++) {
    const x = 5 + Math.floor(r() * 38), z = 5 + Math.floor(r() * 61);
    const borde = distIsla(x, z) > -7, bosque = x < 13 && z > 43 && z < 56;
    if (!(borde || bosque) || !libre(x, z, 2)) continue;
    let cerca = false; for (let dz = -3; dz <= 3 && !cerca; dz++) for (let dx = -3; dx <= 3; dx++) if (W.get(x + dx, 5, z + dz) === B.TRONCO || W.get(x + dx, 5, z + dz) === B.TRONCO_OSC) { cerca = true; break; }
    if (cerca) continue;
    arbol(x, z, 4 + Math.floor(r() * 3), r() < 0.25);
  }
  // arbustos, rocas, flores y pasto alto
  for (let k = 0; k < 160; k++) {
    const x = 5 + Math.floor(r() * 38), z = 5 + Math.floor(r() * 61);
    if (!pasto(x, z) || !libre(x, z, 1)) continue;
    const q = r();
    if (q < 0.45) { W.set(x, 5, z, B.SETO); if (r() < 0.4 && pasto(x + 1, z)) W.set(x + 1, 5, z, B.SETO); if (r() < 0.3) W.set(x, 6, z, B.HOJAS); }
    else if (q < 0.7) { W.set(x, 5, z, r() < 0.5 ? B.PIEDRA_MUSGO : B.ADOQUIN); if (r() < 0.5 && pasto(x, z + 1)) W.set(x, 5, z + 1, B.PIEDRA); }
    else { W.set(x, 5, z, B.HENO); }
  }
  for (let z = 5; z < 67; z++) for (let x = 5; x < 43; x++) {
    if (!pasto(x, z)) continue;
    const n = ruido2(x * 0.22 + 7, z * 0.22 + 3), q = r();
    if (!libre(x, z, 0)) { if (q < 0.03 && n > 0.55) W.set(x, 5, z, B.PASTO_ALTO); continue; }
    if (n > 0.62 && q < 0.55) W.set(x, 5, z, [B.FLOR_ROJA, B.FLOR_AMARILLA, B.FLOR_AZUL, B.FLOR_BLANCA][Math.floor(hash2(x >> 2, z >> 2) * 4)]);
    else if (q < 0.22) W.set(x, 5, z, B.PASTO_ALTO);
  }
  // faroles a lo largo del camino central
  for (const z of [38, 44, 52, 58]) for (const x of [21, 27]) if (pasto(x, z)) { W.set(x, 5, z, B.TRONCO_OSC); W.set(x, 6, z, B.TRONCO_OSC); W.set(x, 7, z, B.LAMPARA); }
  // el lote de la mansión, liso y limpio
  { const [x0, z0, x1, z1] = LUGAR.lote; for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) { W.caja(x, 5, z, x, MY - 1, z, 0); if (W.get(x, 4, z) !== B.AGUA) W.set(x, 4, z, B.PASTO); } }
  // la casita de los ayudantes (cabaña de troncos)
  { const [x0, z0, x1, z1] = LUGAR.ayudantes.casa;
    for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
      const borde = x === x0 || x === x1 || z === z0 || z === z1, esq = (x === x0 || x === x1) && (z === z0 || z === z1);
      if (borde) for (let y = 5; y <= 7; y++) W.set(x, y, z, esq ? B.TRONCO : B.TABLAS);
    }
    W.set(16, 5, z1, B.PUERTA_ABAJO); W.set(16, 6, z1, B.PUERTA_ARRIBA); W.set(14, 6, z1, B.VIDRIO); W.set(18, 6, z1, B.VIDRIO);
    for (let y = 8; y <= 10; y++) { const k = y - 8; for (let z = z0 - 1 + k; z <= z1 + 1 - k; z++) for (let x = x0 - 1; x <= x1 + 1; x++) W.set(x, y, z, (z === z0 - 1 + k || z === z1 + 1 - k) ? B.LOSA_TEJADO : B.TEJADO_ROJO); }
  }
  W.sucios.clear(); for (let i = 0; i < NCX * NCZ; i++) W.sucios.add(i);
  Paso.recalcular();
}
function alturaPiso(x, z) { const v = Mundo.get(Math.floor(x), SUELO - 1, Math.floor(z)); return v && BLOQ[v].l ? SUELO - 0.5 : SUELO; }
// por dónde se puede caminar (1 = libre), a la altura del suelo
const Paso = {
  m: new Uint8Array(MX * MZ), version: 0,
  marcar(x, z) { if (x < 0 || z < 0 || x >= MX || z >= MZ) return; this.m[z * MX + x] = this.libreCelda(x, z) ? 1 : 0; this.version++; },
  libreCelda(x, z) {
    const piso = Mundo.get(x, SUELO - 1, z);
    if (!piso || piso === B.AGUA) return false;
    for (let y = SUELO; y <= SUELO + 1; y++) { const v = Mundo.get(x, y, z); if (v && (BLOQ[v].solido || BLOQ[v].a)) return false; }
    return true;
  },
  recalcular() { for (let z = 0; z < MZ; z++) for (let x = 0; x < MX; x++) this.m[z * MX + x] = this.libreCelda(x, z) ? 1 : 0; this.version++; },
  libre(x, z) { x = Math.floor(x); z = Math.floor(z); return x >= 0 && z >= 0 && x < MX && z < MZ && this.m[z * MX + x] === 1; },
};
