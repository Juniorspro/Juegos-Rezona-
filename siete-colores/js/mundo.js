// SIETE COLORES — el mundo: cubos de 1 m en la Quebrada de Humahuaca (192 × 64 × 192). Se arma con código y semilla.
const SX = 192, SZ = 192, SY = 64;
const VOX = new Uint8Array(SX * SY * SZ);
const ALT = new Int16Array(SX * SZ);            // altura del terreno (último cubo sólido del suelo) para el armado
const REG = new Uint8Array(SX * SZ);            // región de cada columna
const vidx = (x, y, z) => (z * SX + x) * SY + y;

// patrones de textura (se dibujan en el sombreador a 8×8 por cara)
const PT = { RUIDO: 0, ADOBE: 1, PIRCA: 2, MADERA: 3, PASTO: 4, AGUA: 5, SAL: 6, PAJA: 7, TELA: 8, ESTRATO: 9, CARDON: 10, NIEVE: 11, HIERRO: 12, HOJA: 13, BALDOSA: 14, CAL: 15, CAMINO: 16, FLOR: 17, SOL: 18, PUERTA: 19 };
// [nombre, arriba, costado, grupo de color (0 = siempre tiene), patrón, sólido, se trepa]
const BLOQUES = [
  ['aire', '#000000', '#000000', 0, 0, 0, 0],
  ['tierra', '#b9875a', '#a2714a', 0, PT.RUIDO, 1, 1],
  ['pasto', '#b4a85a', '#a2714a', 0, PT.PASTO, 1, 1],
  ['arena', '#dcc594', '#cdb07e', 0, PT.RUIDO, 1, 1],
  ['piedra', '#948476', '#857467', 0, PT.RUIDO, 1, 1],
  ['adobe', '#d6aa7a', '#c89a6a', 0, PT.ADOBE, 1, 1],
  ['paja', '#d4b462', '#b8964c', 0, PT.PAJA, 1, 1],
  ['madera', '#8e5c34', '#7c4c2a', 0, PT.MADERA, 1, 1],
  ['cal', '#f2ebe0', '#ebe2d4', 0, PT.CAL, 1, 1],
  ['pirca', '#968a7c', '#857a6c', 0, PT.PIRCA, 1, 1],
  ['sal', '#f7f7f2', '#e6e6e0', 0, PT.SAL, 1, 1],
  ['agua', '#3a98b0', '#3a98b0', 0, PT.AGUA, 0, 0],
  ['nieve', '#f6faff', '#e9eff9', 0, PT.NIEVE, 1, 1],
  ['cardon', '#6a9a52', '#5a8a46', 0, PT.CARDON, 1, 0],
  ['hoja', '#6a9a3e', '#5a8a36', 0, PT.HOJA, 1, 1],
  ['tela', '#d04a3a', '#d04a3a', 0, PT.TELA, 1, 1],
  ['baldosa', '#c4ab90', '#b09878', 0, PT.BALDOSA, 1, 1],
  ['hierro', '#74463a', '#633b31', 0, PT.HIERRO, 1, 1],
  ['oro', '#e8b840', '#d4a030', 0, PT.RUIDO, 1, 1],
  ['rocaosc', '#5e524c', '#544842', 0, PT.RUIDO, 1, 1],
  ['rojo', '#d2503c', '#c2452f', 1, PT.ESTRATO, 1, 1],
  ['naranja', '#e88a3c', '#d87a30', 2, PT.ESTRATO, 1, 1],
  ['amarillo', '#ecc650', '#dcb440', 3, PT.ESTRATO, 1, 1],
  ['verde', '#74ac5c', '#62984e', 4, PT.ESTRATO, 1, 1],
  ['turquesa', '#48b8b0', '#3aa69e', 5, PT.ESTRATO, 1, 1],
  ['violeta', '#9a62c0', '#8a52b0', 6, PT.ESTRATO, 1, 1],
  ['rosa', '#ec98b4', '#dc88a4', 7, PT.ESTRATO, 1, 1],
  ['colorado', '#c4483a', '#b03c30', 1, PT.ESTRATO, 1, 1],
  ['camino', '#c9a074', '#b48a60', 0, PT.CAMINO, 1, 1],
  ['flor', '#f4ecd8', '#e8dcc0', 0, PT.FLOR, 1, 1],
  ['piedrasol', '#7a6c62', '#6e625a', 0, PT.SOL, 1, 1],
  ['puerta', '#7a4a2a', '#7a4a2a', 0, PT.PUERTA, 1, 0],
];
const B = {}; BLOQUES.forEach((b, i) => { B[b[0].toUpperCase()] = i; });
const SOLIDO = new Uint8Array(256), TREPA = new Uint8Array(256);
BLOQUES.forEach((b, i) => { SOLIDO[i] = b[5]; TREPA[i] = b[6]; });
const ESTRATOS = [B.ROJO, B.NARANJA, B.AMARILLO, B.VERDE, B.TURQUESA, B.VIOLETA, B.ROSA];
const RG = { VALLE: 0, BORDE: 1, CERRO: 2, COLORADOS: 3, CARDONAL: 4, PUNA: 5, PUCARA: 6, SALINAS: 7, VIADUCTO: 8, PUEBLO: 9, RIO: 10 };

function bloque(x, y, z) {
  if (y < 0) return B.ROCAOSC;
  if (y >= SY) return 0;
  if (x < 0 || z < 0 || x >= SX || z >= SZ) return 0;
  return VOX[vidx(x, y, z)];
}
// para chocar: afuera del mapa es pared
function solido(x, y, z) {
  if (x < 0 || z < 0 || x >= SX || z >= SZ) return y < SY + 8;
  if (y < 0) return true;
  if (y >= SY) return false;
  return SOLIDO[VOX[vidx(x, y, z)]] === 1;
}
function poner(x, y, z, b) { if (x >= 0 && z >= 0 && y >= 0 && x < SX && z < SZ && y < SY) VOX[vidx(x, y, z)] = b; }
function caja(x0, y0, z0, x1, y1, z1, b) {
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++) for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) poner(x, y, z, b);
}
// altura donde se para alguien en (x,z): el primer aire con suelo abajo, buscando desde arriba
function sueloEn(x, z, desde) {
  x = Math.floor(x); z = Math.floor(z);
  for (let y = Math.min(SY - 2, desde == null ? SY - 2 : Math.floor(desde)); y > 0; y--) if (solido(x, y - 1, z) && !solido(x, y, z) && !solido(x, y + 1, z)) return y;
  return 1;
}
function aguaEn(x, y, z) { return bloque(Math.floor(x), Math.floor(y), Math.floor(z)) === B.AGUA; }

// ---------- el armado ----------
const RIO = z => 58 + 6 * Math.sin(z * 0.035) + 3 * Math.sin(z * 0.09 + 1);
const SITIOS = {
  plaza: [100, 122], cerro: [100, 56], colorados: [160, 112], cardonal: [158, 168], mirador: [174, 181], puna: [160, 34], laguna: [170, 24],
  pucara: [32, 116], salinas: [30, 34], viaducto: [32, 168], estacion: [54, 152], casa: [118, 121], iglesia: [84, 121],
};
// caminos: polilíneas [x, z, altura del suelo]; se tallan con pendiente suave (el escalón de 1 cubo se sube solo)
const CAMINOS = [
  // al cerro: zigzag por la cara sur hasta la cumbre
  [[100, 104, 10], [100, 97, 12], [124, 88, 17], [86, 80, 25], [118, 71, 33], [92, 64, 41], [108, 59, 47], [101, 56, 52]],
  // a los Colorados y la vuelta por el cañón
  [[108, 120, 10], [134, 118, 11], [146, 112, 12], [158, 104, 12], [172, 110, 12], [170, 126, 12], [154, 132, 12], [140, 126, 11]],
  // al cardonal y el mirador
  [[110, 132, 10], [128, 146, 12], [146, 160, 14], [160, 176, 15], [168, 186, 21], [178, 184, 26], [176, 178, 30]],
  // a la puna por la ladera este
  [[114, 108, 10], [128, 98, 13], [140, 84, 18], [146, 68, 23], [150, 54, 27], [160, 40, 27]],
  // al oeste: puente y pucará (con andenes)
  [[90, 122, 10], [66, 122, 10], [50, 122, 10], [46, 118, 11]],
  // a las salinas
  [[52, 112, 10], [44, 90, 10], [36, 64, 10], [32, 46, 10]],
  // a la estación del viaducto (sube a la meseta)
  [[54, 128, 10], [56, 138, 13], [58, 146, 19], [54, 152, 22]],
];

function generarMundo() {
  const r = rngSemilla(7);
  VOX.fill(0);
  // 1. alturas
  const alt = new Float32Array(SX * SZ);
  const dist = (x, z, c) => Math.hypot(x - c[0], z - c[1]);
  for (let z = 0; z < SZ; z++) for (let x = 0; x < SX; x++) {
    let h = 10 + (fbm2(x * 0.05, z * 0.05, 3) - 0.5) * 2.2, reg = RG.VALLE;
    // el río
    const dr = Math.abs(x - RIO(z));
    // borde: cerros altos que cierran el mapa
    const de = Math.min(x, z, SX - 1 - x, SZ - 1 - z);
    if (de < 20) { const k = (20 - de) / 20; h += Math.pow(k, 1.4) * 44 + fbm2(x * 0.08, z * 0.08, 3) * 10 * k; if (k > 0.25) reg = RG.BORDE; }
    // el Cerro de los Siete Colores
    const dc = dist(x, z, SITIOS.cerro) / 40;
    if (dc < 1) {
      // domo con crestas que bajan desde la cumbre y cárcavas entre ellas
      const w = fbm2(x * 0.09 + 3, z * 0.09, 3) - 0.5, ang = Math.atan2(z - SITIOS.cerro[1], x - SITIOS.cerro[0]);
      const cresta = Math.abs(Math.sin(ang * 4.5 + w * 3 + dc * 2)) - 0.55, filo = 1 - Math.abs(fbm2(x * 0.06, z * 0.06 + 9, 3) * 2 - 1);
      const hc = 10 + 44 * Math.pow(1 - dc * dc, 1.25) + w * 7 * (1 - dc) + cresta * 9 * dc * (1 - dc) * 3 + (filo - 0.5) * 8 * (1 - dc);
      if (hc > h) { h = hc; reg = RG.CERRO; }
    }
    // los Colorados: crestas rojas
    const dco = Math.max(Math.abs(x - 160) / 28, Math.abs(z - 113) / 34);
    if (dco < 1) {
      const cr = 1 - Math.abs(fbm2(x * 0.07, z * 0.07, 3) * 2 - 1);
      const k = suave((1 - dco) * 3);
      const hc = 11 + Math.pow(cr, 2.2) * 26 * k;
      if (hc > h) h = hc;
      reg = RG.COLORADOS;
    }
    // el cardonal: ladera que sube al sudeste
    if (x > 126 && z > 142 && de >= 6) { const hc = 11 + Math.max(0, (x - 126) * 0.08 + (z - 142) * 0.12) + (fbm2(x * 0.1, z * 0.1, 2) - 0.5) * 2; if (hc > h - 0.5) { h = Math.max(h, hc); if (reg !== RG.BORDE) reg = RG.CARDONAL; } }
    // la puna: meseta alta al noreste
    const dp = Math.max(Math.abs(x - 158) / 34, Math.abs(z - 34) / 30);
    if (dp < 1) { const k = suave((1 - dp) * 2.5), hp = lerp(h, 27 + (fbm2(x * 0.06, z * 0.06, 3) - 0.5) * 3, k); if (hp > h) { h = hp; reg = RG.PUNA; } }
    // el pucará: cerro con andenes
    const dpu = dist(x, z, SITIOS.pucara) / 22;
    if (dpu < 1) { let hp = 10 + 19 * Math.pow(1 - dpu, 0.8); hp = Math.floor((hp - 10) / 2.5) * 2.5 + 10; if (dpu < 0.28) hp = 28; if (hp > h) { h = hp; reg = RG.PUCARA; } }
    // salinas: llano blanco
    if (x > 10 && x < 54 && z > 14 && z < 58 && de >= 8) { const k = suave(Math.min(x - 10, 54 - x, z - 14, 58 - z) / 6); h = lerp(h, 10, k); if (k > 0.5) reg = RG.SALINAS; }
    // la meseta del viaducto y la quebrada honda
    if (x < 60 && z > 142 && de >= 4) {
      const k = suave(Math.min((60 - x) / 6, (z - 142) / 6)), hm = 22 + (fbm2(x * 0.1, z * 0.1, 2) - 0.5) * 1.5;
      h = Math.max(h, lerp(h, hm, k)); if (k > 0.5 && reg !== RG.BORDE) reg = RG.VIADUCTO;
      const dq = Math.abs(z - 168 - Math.sin(x * 0.15) * 1.5);
      if (dq < 7 && x > 4 && x < 58) { const kq = suave((7 - dq) / 3) * suave((58 - x) / 4); h = lerp(h, 3 + dq * 0.3, kq); }
    }
    // el pueblo: plano
    if (x > 74 && x < 126 && z > 100 && z < 144) { const k = suave(Math.min(x - 74, 126 - x, z - 100, 144 - z) / 5); h = lerp(h, 10, k); if (k > 0.6) reg = RG.PUEBLO; }
    // el cauce
    if (dr < 7 && z > 2 && z < SZ - 3) { const k = suave((7 - dr) / 4); h = lerp(h, dr < 3 ? 8 : 9, k); if (dr < 4) reg = RG.RIO; }
    alt[z * SX + x] = h; REG[z * SX + x] = reg;
  }
  // 2. caminos tallados (corte y relleno)
  for (const c of CAMINOS) tallarCamino(alt, c);
  // 3. columnas
  for (let z = 0; z < SZ; z++) for (let x = 0; x < SX; x++) {
    const i = z * SX + x, reg = REG[i];
    let h = Math.round(alt[i]);
    h = clamp(h, 2, SY - 3); ALT[i] = h;
    const empinado = Math.max(Math.abs(alt[i] - (alt[i - 1] || alt[i])), Math.abs(alt[i] - (alt[i + 1] || alt[i])), Math.abs(alt[i] - (alt[i - SX] || alt[i])), Math.abs(alt[i] - (alt[i + SX] || alt[i]))) > 1.4;
    for (let y = 0; y <= h; y++) {
      let b;
      const prof = h - y;
      if (y < 2) b = B.ROCAOSC;
      else if (reg === RG.CERRO || reg === RG.BORDE || (reg === RG.PUNA && (empinado || prof > 1)) || (reg === RG.CARDONAL && empinado && y > 13)) b = estrato(x, y, z);
      else if (reg === RG.COLORADOS) b = prof === 0 && !empinado && y < 14 ? B.ARENA : B.COLORADO;
      else if (prof > 3) b = B.PIEDRA;
      else if (reg === RG.SALINAS) b = prof === 0 ? B.SAL : B.ARENA;
      else if (reg === RG.RIO) b = B.ARENA;
      else if (reg === RG.PUCARA) b = prof === 0 ? (empinado ? B.PIRCA : B.PASTO) : B.TIERRA;
      else if (reg === RG.VIADUCTO) b = prof === 0 && !empinado ? B.PASTO : empinado ? estrato(x, y, z) : B.TIERRA;
      else b = prof === 0 ? (hash2(x * 3, z * 3) < 0.55 ? B.PASTO : B.TIERRA) : B.TIERRA;
      if (prof === 0 && reg === RG.BORDE && y > 46) b = B.NIEVE;
      VOX[vidx(x, y, z)] = b;
    }
  }
  // superficie de los caminos
  for (const c of CAMINOS) superficieCamino(c);
  // 4. el agua del río y la laguna
  for (let z = 0; z < SZ; z++) for (let x = 0; x < SX; x++) {
    const h = ALT[z * SX + x];
    if (REG[z * SX + x] === RG.RIO && h <= 8) poner(x, 9, z, B.AGUA);
  }
  laguna();
  // 5. lo construido
  pueblo(r);
  cardonal(r);
  colorados(r);
  pucara(r);
  viaducto(r);
  salinas(r);
  cumbre(r);
  // 6. alturas finales
  for (let z = 0; z < SZ; z++) for (let x = 0; x < SX; x++) { let y = SY - 1; while (y > 0 && !SOLIDO[VOX[vidx(x, y, z)]]) y--; ALT[z * SX + x] = y; }
}
function estrato(x, y, z) {
  const ola = Math.sin(x * 0.07) * 2 + Math.sin(z * 0.05 + 1) * 1.5 + Math.sin((x + z) * 0.021) * 3;
  const banda = Math.floor((y + ola + 40) / 3.4);
  return ESTRATOS[((banda % 7) + 7) % 7];
}
function tallarCamino(alt, c) {
  for (let k = 0; k < c.length - 1; k++) {
    const [x0, z0, h0] = c[k], [x1, z1, h1] = c[k + 1], L = Math.hypot(x1 - x0, z1 - z0), n = Math.ceil(L * 2);
    for (let i = 0; i <= n; i++) {
      const t = i / n, px = lerp(x0, x1, t), pz = lerp(z0, z1, t), ph = lerp(h0, h1, t);
      for (let dz = -4; dz <= 4; dz++) for (let dx = -4; dx <= 4; dx++) {
        const x = Math.round(px + dx), z = Math.round(pz + dz);
        if (x < 1 || z < 1 || x >= SX - 1 || z >= SZ - 1) continue;
        const d = Math.hypot(x - px, z - pz);
        if (d > 4) continue;
        const j = z * SX + x;
        if (REG[j] === RG.RIO && alt[j] < 9.5 && Math.abs(x - RIO(z)) < 3.5) continue;   // el puente pasa por arriba
        const kk = d < 1.9 ? 1 : suave((4 - d) / 2.1);
        alt[j] = lerp(alt[j], ph, kk);
      }
    }
  }
}
function superficieCamino(c) {
  for (let k = 0; k < c.length - 1; k++) {
    const [x0, z0] = c[k], [x1, z1] = c[k + 1], L = Math.hypot(x1 - x0, z1 - z0), n = Math.ceil(L * 2);
    for (let i = 0; i <= n; i++) {
      const t = i / n, px = lerp(x0, x1, t), pz = lerp(z0, z1, t);
      for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
        const x = Math.round(px + dx), z = Math.round(pz + dz);
        if (x < 0 || z < 0 || x >= SX || z >= SZ || REG[z * SX + x] === RG.RIO) continue;
        const h = ALT[z * SX + x];
        if (h > 9 && hash2(x * 7, z * 5) > 0.12) poner(x, h, z, B.CAMINO);
      }
    }
  }
}
function laguna() {
  const [cx, cz] = SITIOS.laguna;
  for (let z = cz - 9; z <= cz + 9; z++) for (let x = cx - 10; x <= cx + 10; x++) {
    const d = Math.hypot((x - cx) / 9, (z - cz) / 7);
    if (d >= 1) continue;
    const h = ALT[z * SX + x], fondo = d < 0.75 ? 25 : 26;
    for (let y = fondo + 1; y <= h; y++) poner(x, y, z, 0);
    poner(x, fondo, z, B.ARENA);
    for (let y = fondo + 1; y <= 27; y++) poner(x, y, z, B.AGUA);
    ALT[z * SX + x] = fondo;
  }
  // islita con piedras
  caja(cx + 2, 26, cz - 1, cx + 3, 28, cz, B.PIEDRA);
}

// ---------- el pueblo de Purmamarca ----------
function casa(x0, z0, w, d, puerta, r, alto) {
  const y0 = 11, ah = alto || 3;
  caja(x0, 10, z0, x0 + w - 1, 10, z0 + d - 1, B.TIERRA);
  caja(x0, y0, z0, x0 + w - 1, y0 + ah - 1, z0 + d - 1, B.ADOBE);
  caja(x0 + 1, y0, z0 + 1, x0 + w - 2, y0 + ah - 1, z0 + d - 2, 0);
  // techo de barro y paja con alero
  caja(x0 - 1, y0 + ah, z0 - 1, x0 + w, y0 + ah, z0 + d, B.PAJA);
  // puerta (hueco de 1×2 con marco de madera) y ventanas
  const [px, pz] = puerta;
  poner(px, y0, pz, 0); poner(px, y0 + 1, pz, 0);
  const vent = [[x0 + 1, z0], [x0 + w - 2, z0], [x0, z0 + 1], [x0 + w - 1, z0 + d - 2], [x0 + 1, z0 + d - 1]];
  for (const [vx, vz] of vent) if ((vx !== px || vz !== pz) && r() < 0.6 && Math.abs(vx - px) + Math.abs(vz - pz) > 1) poner(vx, y0 + 1, vz, 0);
}
function arbol(x, z, y, r, alto, radio) {
  for (let k = 0; k < alto; k++) poner(x, y + k, z, B.MADERA);
  poner(x + 1, y + alto - 2, z, B.MADERA); poner(x - 1, y + alto - 1, z, B.MADERA); poner(x, y + alto - 2, z + 1, B.MADERA);
  const cy = y + alto + 1;
  for (let dz = -radio; dz <= radio; dz++) for (let dx = -radio; dx <= radio; dx++) for (let dy = -2; dy <= 2; dy++) {
    const d = Math.hypot(dx / radio, dy / 2.2, dz / radio);
    if (d < 1 && (d < 0.75 || r() < 0.6)) poner(x + dx, cy + dy, z + dz, B.HOJA);
  }
}
function pueblo(r) {
  // la plaza
  const [px, pz] = SITIOS.plaza;
  for (let z = pz - 9; z <= pz + 8; z++) for (let x = px - 9; x <= px + 8; x++) { for (let y = 11; y < 18; y++) poner(x, y, z, 0); poner(x, 10, z, B.BALDOSA); }
  // el algarrobo en el medio, con un cantero
  caja(px - 2, 11, pz - 2, px + 1, 11, pz + 1, B.PIRCA); caja(px - 1, 11, pz - 1, px, 11, pz, B.TIERRA);
  arbol(px, pz, 12, r, 4, 4);
  // bancos
  for (const [bx, bz] of [[px - 6, pz - 6], [px + 5, pz - 6], [px - 6, pz + 5], [px + 5, pz + 5]]) { poner(bx, 11, bz, B.MADERA); poner(bx + 1, 11, bz, B.MADERA); }
  // puestos de la feria (techos de tela) al norte de la plaza
  for (let k = 0; k < 4; k++) {
    const x0 = px - 8 + k * 4, z0 = pz - 9;
    for (const [dx, dz] of [[0, 0], [2, 0], [0, 2], [2, 2]]) caja(x0 + dx, 11, z0 + dz, x0 + dx, 13, z0 + dz, B.MADERA);
    caja(x0, 14, z0, x0 + 2, 14, z0 + 2, B.TELA);
    caja(x0, 11, z0 + 1, x0 + 2, 11, z0 + 1, B.TELA);
  }
  // la iglesia (blanca, de adobe, con su torre aparte)
  const ix = 80, iz = 114;
  caja(ix, 10, iz, ix + 9, 10, iz + 14, B.PIEDRA);
  caja(ix, 11, iz, ix + 9, 16, iz + 14, B.CAL);
  caja(ix + 1, 11, iz + 1, ix + 8, 16, iz + 13, 0);
  caja(ix - 1, 17, iz - 1, ix + 10, 17, iz + 15, B.PAJA);
  caja(ix, 18, iz, ix + 9, 18, iz + 14, B.PAJA);
  caja(ix + 1, 19, iz + 2, ix + 8, 19, iz + 12, B.PAJA);
  caja(ix + 9, 11, iz + 6, ix + 9, 13, iz + 8, B.PUERTA);
  caja(ix + 9, 11, iz + 7, ix + 9, 12, iz + 7, 0);
  caja(ix + 9, 14, iz + 7, ix + 9, 14, iz + 7, B.MADERA);
  for (const wz of [iz + 3, iz + 11]) poner(ix + 9, 14, wz, 0);
  // la torre con la campana
  const tx = ix + 1, tz = iz + 16;
  caja(tx, 10, tz, tx + 3, 10, tz + 3, B.PIEDRA);
  caja(tx, 11, tz, tx + 3, 21, tz + 3, B.CAL);
  caja(tx + 1, 11, tz + 1, tx + 2, 20, tz + 2, 0);
  for (let y = 11; y <= 19; y += 2) poner(tx + 1 + ((y >> 1) & 1), y, tz + 1, B.MADERA);
  caja(tx, 19, tz + 1, tx, 20, tz + 2, 0); caja(tx + 3, 19, tz + 1, tx + 3, 20, tz + 2, 0); caja(tx + 1, 19, tz, tx + 2, 20, tz, 0); caja(tx + 1, 19, tz + 3, tx + 2, 20, tz + 3, 0);
  poner(tx + 1, 20, tz + 1, B.ORO); poner(tx + 2, 20, tz + 2, 0);
  caja(tx - 1, 22, tz - 1, tx + 4, 22, tz + 4, B.CAL); caja(tx, 23, tz, tx + 3, 23, tz + 3, B.PAJA); poner(tx + 1, 24, tz + 1, B.MADERA); poner(tx + 1, 25, tz + 1, B.MADERA);
  poner(tx, 11, tz + 1, 0); poner(tx, 12, tz + 1, 0);
  // casas alrededor (puertas hacia la calle)
  const casas = [
    [84, 103, 7, 6, [87, 108]], [93, 103, 6, 6, [95, 108]], [101, 103, 7, 6, [104, 108]], [110, 103, 6, 5, [112, 107]],
    [91, 134, 6, 6, [93, 134]], [99, 134, 7, 6, [102, 134]], [108, 134, 6, 6, [110, 134]], [80, 133, 6, 6, [82, 133]],
    [74, 104, 6, 7, [79, 107]], [118, 104, 6, 6, [118, 106]], [116, 134, 6, 7, [116, 137]],
  ];
  for (const c of casas) casa(c[0], c[1], c[2], c[3], c[4], r);
  // escalera de adobe para subir al techo (del lado de atrás de una casa)
  for (let k = 0; k < 4; k++) caja(111 + k, 10, 101, 111 + k, 11 + k, 101, B.ADOBE);
  // la casa de Killa y la abuela, con patio y telar
  const [cx, cz] = SITIOS.casa;
  casa(cx, cz - 6, 7, 6, [cx, cz - 3], r);
  caja(cx - 1, 11, cz, cx + 7, 12, cz, B.ADOBE); caja(cx + 7, 11, cz, cx + 7, 12, cz + 8, B.ADOBE); caja(cx - 1, 11, cz + 8, cx + 7, 12, cz + 8, B.ADOBE);
  caja(cx - 1, 11, cz + 1, cx - 1, 12, cz + 7, B.ADOBE); caja(cx - 1, 11, cz + 3, cx - 1, 12, cz + 4, 0);
  caja(cx, 10, cz + 1, cx + 6, 10, cz + 7, B.CAMINO);
  // el telar: dos postes, travesaño y la tela a medio tejer
  caja(cx + 3, 11, cz + 6, cx + 3, 13, cz + 6, B.MADERA); caja(cx + 6, 11, cz + 6, cx + 6, 13, cz + 6, B.MADERA); caja(cx + 3, 14, cz + 6, cx + 6, 14, cz + 6, B.MADERA);
  caja(cx + 4, 12, cz + 6, cx + 5, 13, cz + 6, B.TELA);
  // corral con pirca al sur del pueblo
  caja(96, 11, 146, 108, 11, 146, B.PIRCA); caja(96, 11, 146, 96, 11, 154, B.PIRCA); caja(108, 11, 146, 108, 11, 154, B.PIRCA); caja(96, 11, 154, 108, 11, 154, B.PIRCA); poner(102, 11, 146, 0);
  // el puente sobre el río
  const zp = 122;
  for (let x = Math.floor(RIO(zp)) - 5; x <= Math.ceil(RIO(zp)) + 5; x++) {
    for (let dz = -1; dz <= 1; dz++) { poner(x, 10, zp + dz, B.MADERA); for (let y = 11; y < 14; y++) if (bloque(x, y, zp + dz) !== B.MADERA) poner(x, y, zp + dz, 0); }
    if (x % 3 === 0) { for (let y = 7; y < 10; y++) { poner(x, y, zp - 1, B.MADERA); poner(x, y, zp + 1, B.MADERA); } }
    poner(x, 11, zp - 2, x % 2 ? B.MADERA : 0); poner(x, 11, zp + 2, x % 2 ? B.MADERA : 0);
  }
}

// ---------- cardones ----------
function cardon(x, z, alto, r, conFlor) {
  const y0 = sueloEn(x, z);
  for (let k = 0; k < alto; k++) poner(x, y0 + k, z, B.CARDON);
  const brazos = alto > 5 ? 1 + Math.floor(r() * 3) : 0;
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (let b = 0; b < brazos; b++) {
    const [dx, dz] = dirs[(b + Math.floor(r() * 4)) % 4], hb = 2 + Math.floor(r() * (alto - 4));
    poner(x + dx, y0 + hb, z + dz, B.CARDON);
    const la = 1 + Math.floor(r() * 3);
    for (let k = 1; k <= la; k++) poner(x + dx * 2, y0 + hb + k - 1, z + dz * 2, B.CARDON);
    poner(x + dx, y0 + hb, z + dz, B.CARDON);
  }
  if (conFlor) poner(x, y0 + alto, z, B.FLOR);
}
function cardonal(r) {
  // el Cardón Abuelo: altísimo, con una corona de flores donde se puede parar
  const [ax, az] = SITIOS.cardonal, y0 = sueloEn(ax, az);
  caja(ax - 1, y0, az - 1, ax + 1, y0 + 11, az + 1, B.CARDON);
  caja(ax - 1, y0 + 12, az - 1, ax + 1, y0 + 12, az + 1, B.FLOR);
  for (const [dx, dz, h] of [[2, 0, 5], [-2, 0, 7], [0, 2, 4]]) { poner(ax + dx, y0 + h, az + dz, B.CARDON); for (let k = 0; k < 4; k++) poner(ax + dx * 1.5, y0 + h + k, az + dz * 1.5, B.CARDON); }
  // el mirador: un peñón con camino (la última parte del camino ya sube)
  const [mx, mz] = SITIOS.mirador;
  for (let z = mz - 4; z <= mz + 4; z++) for (let x = mx - 4; x <= mx + 4; x++) { const d = Math.hypot(x - mx, z - mz); if (d < 4.5) for (let y = 10; y <= 31; y++) if (bloque(x, y, z) === 0) poner(x, y, z, d < 3.2 || y < 29 ? estrato(x, y, z) : 0); }
  caja(mx - 2, 32, mz - 2, mx + 2, 32, mz + 2, 0);
  // escalones tallados del camino al mirador
  for (let k = 0; k < 6; k++) caja(mx + 4 - k, 26 + k, mz + 3, mx + 4 - k, 26 + k, mz + 4, B.CAMINO);
  // cardones sueltos por la ladera
  for (let k = 0; k < 70; k++) {
    const x = 128 + Math.floor(r() * 56), z = 140 + Math.floor(r() * 44);
    if (Math.hypot(x - ax, z - az) < 7 || Math.hypot(x - mx, z - mz) < 7 || REG[z * SX + x] !== RG.CARDONAL) continue;
    if (bloque(x, sueloEn(x, z) - 1, z) === B.CAMINO) continue;
    cardon(x, z, 3 + Math.floor(r() * 6), r, r() < 0.3);
  }
}

// ---------- los Colorados ----------
function colorados(r) {
  // agujas de piedra roja
  const agujas = [[150, 100, 9], [166, 96, 12], [178, 104, 10], [162, 120, 7], [146, 126, 11], [176, 132, 9], [156, 138, 8], [170, 116, 14]];
  for (const [x, z, a] of agujas) {
    const y0 = sueloEn(x, z);
    for (let k = 0; k < a; k++) { const rr = k < a - 2 ? 1.8 : 1.2; for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (Math.hypot(dx, dz) <= rr) poner(x + dx, y0 + k, z + dz, B.COLORADO); }
  }
  // la aguja del ovillo: 8 de alto sobre el camino, con un escalón de 2 al pie (salto y borde, y después 6 de trepada)
  const [ax, az] = [147, 129], ay = sueloEn(ax, az);
  for (let y = ay; y < ay + 8; y++) for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (Math.abs(dx) + Math.abs(dz) < 2 || y < ay + 6) poner(ax + dx, y, az + dz, B.COLORADO);
  caja(ax + 2, ay, az - 1, ax + 3, ay + 1, az + 1, B.COLORADO);
  caja(ax + 2, ay + 2, az - 1, ax + 3, ay + 4, az + 1, 0);
  // cueva en la ladera del norte del cañón
  const cy = 12;
  caja(170, cy, 126, 174, cy + 2, 129, 0);
  caja(171, cy, 129, 173, cy + 1, 132, 0);
}

// ---------- el pucará ----------
function pucara(r) {
  const [cx, cz] = SITIOS.pucara, y = 29;
  // recintos de pirca (algunos rotos)
  const rec = [[cx - 7, cz - 7, 5, 5], [cx + 3, cz - 7, 5, 4], [cx - 7, cz + 3, 4, 5], [cx + 3, cz + 3, 5, 5], [cx - 1, cz - 11, 4, 3]];
  for (const [x0, z0, w, d] of rec) {
    for (let x = x0; x < x0 + w; x++) for (let z = z0; z < z0 + d; z++) {
      if (x !== x0 && x !== x0 + w - 1 && z !== z0 && z !== z0 + d - 1) continue;
      const alto = r() < 0.15 ? 0 : r() < 0.4 ? 1 : 2;
      for (let k = 0; k < alto; k++) poner(x, sueloEn(x, z, y + 4) + 0, z, B.PIRCA);
    }
  }
  // la Piedra del Sol en el centro (se abre al tocar bien la canción)
  caja(cx - 1, y, cz - 1, cx + 1, y + 2, cz + 1, B.PIEDRASOL);
  // escalinata de los andenes (lado este, hacia el puente)
  for (let k = 0; k < 20; k++) { const x = cx + 21 - k, h = Math.min(28, 10 + Math.floor(k * 0.95)); caja(x, 10, cz - 1, x, h, cz + 1, B.PIRCA); caja(x, h + 1, cz - 1, x, h + 4, cz + 1, 0); }
}

// ---------- el viaducto ----------
function viaducto(r) {
  const z = 168, yd = 22;
  const huecos = [[19, 21], [29, 32], [41, 43]];
  const hueco = x => huecos.some(([a, b]) => x >= a && x <= b);
  for (let x = 6; x <= 58; x++) {
    if (hueco(x)) continue;
    for (let dz = -1; dz <= 1; dz++) poner(x, yd, z + dz, dz === 0 ? B.MADERA : B.HIERRO);
    for (let y = yd + 1; y < yd + 4; y++) for (let dz = -1; dz <= 1; dz++) if (bloque(x, y, z + dz) && x > 8 && x < 56) poner(x, y, z + dz, 0);
    if (x % 2 === 0) { poner(x, yd + 1, z - 2, 0); poner(x, yd + 1, z + 2, 0); }
  }
  // pilares de hierro
  for (const x of [10, 16, 25, 36, 47, 53]) for (let y = 2; y < yd; y++) { poner(x, y, z - 1, B.HIERRO); poner(x, y, z + 1, B.HIERRO); if (y % 4 === 0) poner(x, y, z, B.HIERRO); }
  // el vagón varado en el tramo del medio
  caja(34, yd + 1, z - 1, 39, yd + 1, z + 1, B.HIERRO);
  caja(34, yd + 2, z - 1, 39, yd + 4, z + 1, B.MADERA);
  caja(35, yd + 2, z, 38, yd + 3, z, 0);
  caja(34, yd + 2, z, 34, yd + 3, z, 0); caja(39, yd + 2, z, 39, yd + 3, z, 0);
  caja(36, yd + 3, z - 1, 37, yd + 3, z - 1, 0); caja(36, yd + 3, z + 1, 37, yd + 3, z + 1, 0);
  caja(33, yd + 5, z - 1, 40, yd + 5, z + 1, B.HIERRO);
  // la estación (adobe) y su andén
  const [ex, ez] = SITIOS.estacion;
  casa(ex - 12, ez - 8, 7, 5, [ex - 6, ez - 4], r, 3);
  for (let x = ex - 4; x <= ex + 4; x++) for (let zz = ez - 3; zz <= ez + 3; zz++) { poner(x, yd, zz, B.BALDOSA); for (let y = yd + 1; y < yd + 4; y++) poner(x, y, zz, 0); }
  // vía de la estación al viaducto
  for (let zz = ez + 3; zz <= z; zz++) for (let dx = -1; dx <= 1; dx++) { poner(56 + dx, yd, zz, dx === 0 ? B.MADERA : B.HIERRO); for (let y = yd + 1; y < yd + 4; y++) poner(56 + dx, y, zz, 0); }
  // escalera tallada para volver a subir desde el fondo de la quebrada (lado este)
  for (let k = 0; k < 20; k++) { const xx = 58 - Math.floor(k / 10), zz = 176 - (k % 10), y = 4 + k; caja(xx - 1, 3, zz, xx, y, zz, B.PIRCA); caja(xx - 1, y + 1, zz, xx, y + 3, zz, 0); }
}

// ---------- las salinas ----------
function salinas(r) {
  // piletones de agua salada (los "ojos") y montoncitos de sal cortada
  for (const [x, z] of [[24, 30], [40, 42], [30, 50], [18, 44]]) { caja(x, 10, z, x + 2, 10, z + 1, B.AGUA); }
  for (let k = 0; k < 10; k++) { const x = 16 + Math.floor(r() * 30), z = 20 + Math.floor(r() * 30); if (bloque(x, 10, z) === B.SAL) { poner(x, 11, z, B.SAL); if (r() < 0.5) poner(x + 1, 11, z, B.SAL); } }
}

// ---------- la cumbre ----------
function cumbre(r) {
  const [cx, cz] = SITIOS.cerro;
  for (let z = cz - 8; z <= cz + 8; z++) for (let x = cx - 8; x <= cx + 8; x++) {
    const d = Math.hypot(x - cx, z - cz);
    if (d > 7.5) continue;
    for (let y = 53; y < SY; y++) poner(x, y, z, 0);
    for (let y = 40; y <= 52; y++) if (!bloque(x, y, z)) poner(x, y, z, estrato(x, y, z));
  }
  // piedras para que el Pujllay salte
  for (const [dx, dz, a] of [[-4, -3, 2], [4, -2, 1], [3, 4, 2], [-3, 4, 1], [0, -6, 1]]) caja(cx + dx, 53, cz + dz, cx + dx, 52 + a, cz + dz, B.PIEDRA);
}
