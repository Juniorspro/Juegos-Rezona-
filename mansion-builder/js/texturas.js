// MANSION BUILDER — las texturas de los bloques, pintadas píxel a píxel con código (16×16, nada de afuera)
const TEX = { nombres: [], capa: {}, datos: null, color: {} };
(function armarTexturas() {
  const N = 16;
  // ruido de valor que se repite cada 16 píxeles (para manchas sin costuras)
  const ruidoT = (x, y, g, s) => {
    const p = N / g, xi = Math.floor(x / p), yi = Math.floor(y / p), fx = x / p - xi, fy = y / p - yi;
    const h = (a, b) => hash2(((a % g) + g) % g + s * 31, ((b % g) + g) % g + s * 17);
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const a = h(xi, yi), b = h(xi + 1, yi), c = h(xi, yi + 1), d = h(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
  const elegir = (pal, t) => pal[clamp(Math.floor(t * pal.length), 0, pal.length - 1)];
  const defs = [];
  const def = (n, f) => defs.push([n, f]);
  // pinta con una paleta según ruido + grano
  const manchas = (pal, g1, g2, gr, s) => (x, y, r) => { const t = ruidoT(x, y, g1, s) * 0.55 + ruidoT(x, y, g2, s + 3) * 0.3 + r() * gr; return [elegir(pal, t / (0.85 + gr)), 255]; };

  def('pasto_arriba', (x, y, r) => { const t = ruidoT(x, y, 4, 1) * 0.5 + r() * 0.6; return [elegir(['#4e9a2f', '#5aa837', '#63b33d', '#6cbd43', '#78c84b'], t / 1.1), 255]; });
  const tierraPal = ['#6f4a32', '#7c5238', '#87603f', '#966c48'];
  const tierra = (x, y, r) => { if (r() < 0.06) return [r() < 0.5 ? '#8f8a83' : '#5c3d29', 255]; const t = ruidoT(x, y, 4, 7) * 0.5 + r() * 0.5; return [elegir(tierraPal, t), 255]; };
  def('pasto_lado', (() => { const rr = rngSemilla(5), hondo = []; for (let x = 0; x < N; x++) hondo.push(2 + Math.floor(rr() * 3) + (x % 5 === 2 ? 1 : 0)); return (x, y, r) => { if (y < hondo[x]) return [elegir(['#5aa837', '#63b33d', '#6cbd43', '#4e9a2f'], r()), 255]; if (y === hondo[x]) return ['#3f7f26', 255]; return tierra(x, y, r); }; })());
  def('tierra', tierra);
  def('piedra', manchas(['#6e6e72', '#7a7a7e', '#86868a', '#919195', '#9c9ca0'], 4, 8, 0.35, 11));
  def('arena', manchas(['#d6c58a', '#dfcf95', '#e7d8a2', '#efe2b1'], 4, 8, 0.45, 13));
  def('grava', (() => { const rr = rngSemilla(17), m = []; for (let k = 0; k < 26; k++) m.push([Math.floor(rr() * N), Math.floor(rr() * N), elegir(['#9b958d', '#7d776f', '#8e7d6b', '#b1aba3', '#6a645d'], rr())]); return (x, y, r) => { for (const [a, b, c] of m) { const dx = ((x - a + 24) % N) - 8, dy = ((y - b + 24) % N) - 8; if (dx >= 0 && dx < 2 && dy >= 0 && dy < 2) return [dx === 0 && dy === 0 ? mezcla(c, '#ffffff', 0.2) : c, 255]; } return [elegir(['#6b665f', '#76716a', '#5f5a54'], r()), 255]; }; })());
  const corteza = (base, osc, cla, s) => { const rr = rngSemilla(s), cols = []; for (let x = 0; x < N; x++) cols.push(rr()); return (x, y, r) => { const c = cols[x], rr2 = hash2(x * 3 + s, Math.floor((y + c * 16) / 3)); if (c < 0.22 || rr2 < 0.12) return [osc, 255]; if (c > 0.82 && rr2 > 0.4) return [cla, 255]; return [r() < 0.25 ? mezcla(base, osc, 0.4) : base, 255]; }; };
  const anillos = (bar, a1, a2, s) => (x, y, r) => { if (x === 0 || y === 0 || x === N - 1 || y === N - 1) return [bar, 255]; const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5)) + (r() - 0.5) * 0.6; return [Math.floor(d) % 2 ? a1 : a2, 255]; };
  def('tronco_lado', corteza('#6e4c2c', '#523720', '#86613b', 21));
  def('tronco_arriba', anillos('#5e4127', '#b08a52', '#c6a065', 22));
  def('hojas', (x, y, r) => { const t = ruidoT(x, y, 8, 23) * 0.6 + r() * 0.55; if (r() < 0.05) return ['#7cc456', 255]; return [elegir(['#2c5f1e', '#36702a', '#3f7f2e', '#4a8f34', '#579c3b'], t / 1.15), 255]; });
  const tablas = (pal, seam, s) => { const rr = rngSemilla(s), cortes = [0, 1, 2, 3].map(() => Math.floor(rr() * N)), tono = [0, 1, 2, 3].map(() => rr() * 0.12 - 0.06); return (x, y, r) => { const fila = y >> 2, yy = y & 3; if (yy === 3) return [seam, 255]; if (x === cortes[fila] && fila % 2 === 0 || x === (cortes[fila] + 8) % N && fila % 2 === 1) return [seam, 255]; let c = pal[clamp(Math.floor((0.5 + tono[fila] + (r() - 0.5) * 0.35 + (yy === 0 ? 0.2 : 0)) * pal.length), 0, pal.length - 1)]; return [c, 255]; }; };
  def('tablas', tablas(['#9c7444', '#aa8150', '#b88e5c', '#c49b67'], '#6d4f2c', 31));
  def('adoquin', (() => { const rr = rngSemilla(41), sem = []; for (let k = 0; k < 10; k++) sem.push([rr() * N, rr() * N, elegir(['#8a8a8e', '#7b7b7f', '#97979b', '#a3a3a7'], rr())]); const cerca = (x, y) => { let d1 = 1e9, d2 = 1e9, c = null; for (const [a, b, col] of sem) for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) { const d = Math.hypot(x + 0.5 - a - ox * N, y + 0.5 - b - oy * N); if (d < d1) { d2 = d1; d1 = d; c = col; } else if (d < d2) d2 = d; } return [d2 - d1, c]; }; return (x, y, r) => { const [b, c] = cerca(x, y); if (b < 1.1) return ['#57575b', 255]; const [b2] = cerca(x - 1, y - 1); return [b2 < 1.1 ? mezcla(c, '#ffffff', 0.18) : (r() < 0.2 ? mezcla(c, '#000000', 0.08) : c), 255]; }; })());
  def('ladrillo_piedra', (x, y, r) => { const fila = y >> 3, yy = y & 7, xx = (x + (fila ? 8 : 0)) % N; if (yy === 7 || xx === 0) return ['#5b5b60', 255]; if (yy === 0 || xx === 1) return ['#a2a2a6', 255]; if (fila === 1 && xx > 9 && xx < 12 && yy === 4) return ['#6a6a6e', 255]; return [elegir(['#86868a', '#8e8e92', '#929296'], r()), 255]; });
  def('vidrio', (x, y, r) => { if (x === 0 || y === 0 || x === N - 1 || y === N - 1) return ['#e8f4ff', 235]; if ((x === 1 || y === 1) && x < 15 && y < 15) return ['#a8c8e0', 110]; if (x + y === 6 || x + y === 7 || x + y === 18) return ['#ffffff', 120]; return ['#cfe8ff', 30]; });
  const marmol = (x, y, r) => { const v = Math.abs(Math.sin((x * 0.55 + y * 0.9) + ruidoT(x, y, 4, 51) * 5)); if (v < 0.06) return ['#d7d1c7', 255]; return [elegir(['#ece8e0', '#f1eee7', '#f6f3ee', '#faf8f4'], ruidoT(x, y, 8, 52) * 0.6 + r() * 0.4), 255]; };
  def('cuarzo', marmol);
  def('cuarzo_pilar_lado', (x, y, r) => { if (x === 0 || x === N - 1) return ['#d6d0c4', 255]; if (x === 3 || x === 12) return ['#dcd6cb', 255]; if (x === 4 || x === 13) return ['#ffffff', 255]; return [elegir(['#ece8e0', '#f2efe8', '#f6f4ef'], r()), 255]; });
  def('cuarzo_pilar_arriba', (x, y, r) => { const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5)); if (d > 7) return ['#d6d0c4', 255]; if (Math.floor(d) === 4) return ['#dcd6cb', 255]; return [elegir(['#ece8e0', '#f2efe8', '#f6f4ef'], r()), 255]; });
  def('cuarzo_ladrillo', (x, y, r) => { const fila = y >> 3, yy = y & 7, xx = (x + (fila ? 8 : 0)) % N; if (yy === 7 || xx === 0) return ['#d3cdc1', 255]; if (yy === 0) return ['#ffffff', 255]; return [elegir(['#ece8e0', '#f1eee7', '#f5f2ec'], r()), 255]; });
  def('oro', (x, y, r) => { if (x === 0 || y === 0) return ['#fff1a0', 255]; if (x === N - 1 || y === N - 1) return ['#c98a12', 255]; if (r() < 0.04) return ['#ffffff', 255]; const t = ruidoT(x, y, 4, 61) * 0.5 + r() * 0.5; return [elegir(['#e8b223', '#f2c33a', '#f8d54e', '#fde27a'], t), 255]; });
  def('tablas_oscuras', tablas(['#3e2a1a', '#47301e', '#513823', '#5b4029'], '#2a1c11', 71));
  def('tronco_osc_lado', corteza('#3d2a1a', '#2a1c11', '#523a25', 72));
  def('tronco_osc_arriba', anillos('#2f2014', '#5b4029', '#6b4c31', 73));
  def('ladrillos', (x, y, r) => { const fila = y >> 2, yy = y & 3, xx = (x + (fila % 2 ? 4 : 0)) % 8; if (yy === 3 || xx === 7) return ['#c9bdaa', 255]; if (yy === 0 && r() < 0.5) return ['#c0604c', 255]; return [elegir(['#984234', '#a3493a', '#ad5240', '#b85a46'], hash2(Math.floor((x + (fila % 2 ? 4 : 0)) / 8), fila) * 0.7 + r() * 0.3), 255]; });
  def('pizarra', (x, y, r) => { const fila = y >> 2, yy = y & 3, xx = (x + (fila % 2 ? 2 : 0)) % 4; if (yy === 3) return ['#232a35', 255]; if (xx === 3 && yy > 0) return ['#2b3340', 255]; if (yy === 0) return ['#5f7088', 255]; return [elegir(['#3b4657', '#435064', '#4b5a70'], r()), 255]; });
  const lana = (base, s) => (x, y, r) => { const t = ((x + y) % 4 === 0 ? 0.1 : 0) + r() * 0.12 + ruidoT(x, y, 4, s) * 0.1; return [mezcla(base, t > 0.17 ? '#ffffff' : '#000000', Math.abs(t - 0.12) * 0.9), 255]; };
  def('lana_roja', lana('#b83a34', 81));
  def('lana_blanca', lana('#e9e9e4', 82));
  def('lana_azul', lana('#2f4ea8', 83));
  def('lana_negra', lana('#2a2a30', 84));
  def('lana_verde', lana('#4f7d2e', 85));
  def('lampara', (x, y, r) => { const t = ruidoT(x, y, 4, 91) * 0.5 + r() * 0.6; if (x % 5 === 0 || y % 5 === 0) return ['#b8762a', 255]; return [elegir(['#f2b34c', '#f8c860', '#fddc7c', '#fff0b0'], t / 1.1), 255]; });
  def('estanteria', (x, y, r) => { if (y < 2 || y > 13 || y === 7 || y === 8) return [y === 0 || y === 8 ? '#c49b67' : '#8d6a3f', 255]; if (x === 0 || x === N - 1) return ['#6d4f2c', 255]; const libro = Math.floor((x + (y > 8 ? 2 : 0)) / 2), c = ['#9b2f2f', '#2f5f9b', '#3d7d3a', '#c9a23a', '#6a3d8f', '#9b5f2f', '#2f8f8f'][libro % 7]; return [(x + (y > 8 ? 2 : 0)) % 2 === 1 ? mezcla(c, '#000000', 0.3) : c, 255]; });
  def('hierro', (x, y, r) => { if (x === 0 || y === 0) return ['#f4f4f6', 255]; if (x === N - 1 || y === N - 1) return ['#8a8a92', 255]; if ((x === 2 || x === 13) && (y === 2 || y === 13)) return ['#9a9aa2', 255]; return [elegir(['#cfcfd5', '#d8d8de', '#e0e0e5'], r()), 255]; });
  def('horno_frente', (x, y, r) => { if (x > 3 && x < 12 && y > 6 && y < 13) { if (y < 8) return ['#2a2a2e', 255]; const f = r(); return [f < 0.3 ? '#ffd23a' : f < 0.65 ? '#ff8a1f' : '#d8451c', 255]; } if (x > 2 && x < 13 && y > 5 && y < 14) return ['#3d3d42', 255]; const t = ruidoT(x, y, 4, 101) * 0.5 + r() * 0.5; return [elegir(['#6e6e72', '#7a7a7e', '#86868a', '#929296'], t), 255]; });
  def('horno_lado', manchas(['#6a6a6e', '#76767a', '#828286', '#8d8d91'], 4, 8, 0.4, 102));
  // plantas (en cruz, con transparencia)
  def('pasto_alto', (() => { const rr = rngSemilla(111), hojas = []; for (let k = 0; k < 9; k++) hojas.push([1 + Math.floor(rr() * 14), 6 + Math.floor(rr() * 9), rr() < 0.5 ? -1 : 1]); return (x, y, r) => { for (const [a, h, dir] of hojas) { const yy = 15 - y; if (yy < h) { const off = Math.round((yy / h) * (yy / h) * 2 * dir); if (x === a + off) return [yy > h - 3 ? '#7cc456' : yy > h * 0.5 ? '#5aa837' : '#3f7f26', 255]; } } return ['#000000', 0]; }; })());
  const flor = (pet, centro, s) => (x, y, r) => { const tallo = x === 7 || (x === 8 && y > 11); if (y >= 7 && tallo) return [y > 12 ? '#2f6b1f' : '#3f8a2a', 255]; if ((x === 5 || x === 9) && y === 11) return ['#4a9a32', 255]; const d = Math.hypot(x - 7.3, y - 4.5); if (d < 1.2) return [centro, 255]; if (d < 3.1 && (Math.abs(x - 7.3) + Math.abs(y - 4.5)) < 3.9) return [r() < 0.2 ? mezcla(pet, '#ffffff', 0.3) : pet, 255]; return ['#000000', 0]; };
  def('flor_roja', flor('#d8342c', '#2a1a10', 121));
  def('flor_amarilla', flor('#f6d32e', '#d0901c', 122));
  def('flor_azul', flor('#4a7bd8', '#f0f0ff', 123));
  def('flor_blanca', flor('#f4f4f0', '#f2c12e', 124));
  def('agua', manchas(['#2f6fc2', '#3478cc', '#3b82d6'], 4, 8, 0.4, 131));
  def('liso', (x, y, r) => { if (x === 0 || y === 0 || x === N - 1 || y === N - 1) return ['#9a9a9e', 255]; return [elegir(['#b7b7bb', '#bdbdc1', '#c3c3c7'], r()), 255]; });
  def('hormigon_negro', manchas(['#26282d', '#2b2d32', '#303237'], 4, 8, 0.5, 141));
  def('hormigon_amarillo', manchas(['#e2ae1c', '#e9b726', '#efc032'], 4, 8, 0.5, 142));
  def('terracota', manchas(['#a85a35', '#b4633c', '#bd6c43'], 4, 8, 0.5, 143));
  def('mineral_oro', (() => { const base = manchas(['#6e6e72', '#7a7a7e', '#86868a', '#919195'], 4, 8, 0.35, 151), rr = rngSemilla(152), v = []; for (let k = 0; k < 5; k++) v.push([2 + Math.floor(rr() * 11), 2 + Math.floor(rr() * 11)]); return (x, y, r) => { for (const [a, b] of v) { const dx = x - a, dy = y - b; if (dx >= 0 && dx < 3 && dy >= 0 && dy < 2 && !(dx === 2 && dy === 1)) return [dx === 0 && dy === 0 ? '#fff1a0' : dy === 1 ? '#c98a12' : '#f2c33a', 255]; } return base(x, y, r); }; })());
  def('billete_arriba', (x, y, r) => { if (y < 2 || y > 13) return ['#3f8a3a', 255]; if (x < 1 || x > 14) return ['#4f9a48', 255]; if (y === 2 || y === 13) return ['#2f6b2a', 255]; const d = Math.hypot(x - 7.5, y - 7.5); if (d < 2.6) return [d < 1.6 ? '#e8f4d8' : '#2f6b2a', 255]; return [(x + y) % 3 === 0 ? '#8fc87a' : '#7ab866', 255]; });
  def('billete_lado', (x, y, r) => { if (y % 4 === 3) return ['#2f6b2a', 255]; return [y % 4 === 0 ? '#e8f4d8' : (r() < 0.5 ? '#9fd08a' : '#8fc87a'), 255]; });
  def('caja', (x, y, r) => { if (x < 2 || y < 2 || x > 13 || y > 13) return [x === 0 || y === 0 ? '#c49b67' : '#6d4f2c', 255]; if (x === y || x === y + 1) return ['#8d6a3f', 255]; return tablas(['#9c7444', '#aa8150', '#b88e5c'], '#6d4f2c', 161)(x, y, r); });
  def('seto', (x, y, r) => { const t = ruidoT(x, y, 8, 171) * 0.6 + r() * 0.5; if (r() < 0.06) return ['#8fd06a', 255]; return [elegir(['#2f6a22', '#3a7b2b', '#458b33', '#529a3c', '#5fa846'], t / 1.1), 255]; });
  def('puerta_abajo', (x, y, r) => { if (x === 0 || x === N - 1 || y === N - 1) return ['#2a1c11', 255]; if ((x === 3 || x === 12) && y > 1 && y < 14 || (y === 2 || y === 13) && x > 2 && x < 13) return ['#3e2a1a', 255]; if (x === 12 && y === 1) return ['#2a1c11', 255]; if ((x === 11 || x === 10) && y === 4) return ['#e8c050', 255]; return [elegir(['#5b4029', '#634630', '#6b4c35'], r()), 255]; });
  def('puerta_arriba', (x, y, r) => { if (x === 0 || x === N - 1 || y === 0) return ['#2a1c11', 255]; if (x > 2 && x < 13 && y > 2 && y < 14) return x === 7 || x === 8 || y === 8 ? ['#3e2a1a', 255] : ['#a8d0ec', 255]; return [elegir(['#5b4029', '#634630', '#6b4c35'], r()), 255]; });
  def('heno_arriba', (x, y, r) => { const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5)); if (d > 6.8) return ['#a8892a', 255]; return [elegir(['#d6b33c', '#ccaa36', '#e0bf4a'], r()), 255]; });
  def('heno_lado', (x, y, r) => { if (y === 3 || y === 12) return ['#8a3a2a', 255]; return [elegir(['#d6b33c', '#ccaa36', '#e0bf4a', '#b8962e'], (x * 7 % 5) / 5 * 0.6 + r() * 0.4), 255]; });
  def('piedra_musgo', (x, y, r) => { const c = manchas(['#7b7b7f', '#86868a', '#919195'], 4, 8, 0.35, 181)(x, y, r); return ruidoT(x, y, 4, 182) > 0.62 ? [elegir(['#4f7d2e', '#5f8f36', '#6b9c3e'], r()), 255] : c; });
  def('cristal_azul', (x, y, r) => { if (x === 0 || y === 0 || x === N - 1 || y === N - 1) return ['#2f3f55', 255]; if (x + y === 6 || x + y === 7) return ['#ffffff', 150]; return ['#7ab8e8', 120]; });
  def('lana_amarilla', lana('#e8c330', 191));
  def('tejado_rojo', (x, y, r) => { const fila = y >> 2, yy = y & 3, xx = (x + (fila % 2 ? 2 : 0)) % 4; if (yy === 3) return ['#6a2219', 255]; if (xx === 3 && yy > 0) return ['#7d2a1f', 255]; if (yy === 0) return ['#d0644a', 255]; return [elegir(['#a63c2c', '#b04332', '#ba4b38'], r()), 255]; });

  const n = defs.length, datos = new Uint8Array(N * N * 4 * n);
  defs.forEach(([nom, f], i) => {
    const r = rngSemilla(i * 7919 + 13), base = i * N * N * 4;
    let sr = 0, sg = 0, sb = 0, cnt = 0;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const [c, a] = f(x, y, r), rgb = hexRgb(c), k = base + (y * N + x) * 4;
      datos[k] = rgb[0]; datos[k + 1] = rgb[1]; datos[k + 2] = rgb[2]; datos[k + 3] = a;
      if (a > 128) { sr += rgb[0]; sg += rgb[1]; sb += rgb[2]; cnt++; }
    }
    TEX.nombres.push(nom); TEX.capa[nom] = i;
    TEX.color[nom] = cnt ? [sr / cnt / 255, sg / cnt / 255, sb / cnt / 255] : [1, 1, 1];
  });
  TEX.datos = datos; TEX.n = n;
})();
// ruido grande que se repite: sombras de nubes y ondas del agua (64×64, canales distintos)
function texturaRuido() {
  const n = 64, d = new Uint8Array(n * n * 4);
  const oct = (x, y, g, s) => {
    let v = 0, a = 0.5, f = g;
    for (let o = 0; o < 4; o++) {
      const p = n / f, xi = Math.floor(x / p), yi = Math.floor(y / p), fx = x / p - xi, fy = y / p - yi, u = fx * fx * (3 - 2 * fx), w = fy * fy * (3 - 2 * fy);
      const h = (a2, b2) => hash2(((a2 % f) + f) % f + s * 13 + o * 101, ((b2 % f) + f) % f + s * 7 + o * 59);
      const A = h(xi, yi), B = h(xi + 1, yi), C = h(xi, yi + 1), D = h(xi + 1, yi + 1);
      v += a * (A + (B - A) * u + (C - A) * w + (A - B - C + D) * u * w); a *= 0.5; f *= 2;
    }
    return v / 0.9375;
  };
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const k = (y * n + x) * 4;
    d[k] = clamp(oct(x, y, 4, 1) * 255, 0, 255); d[k + 1] = clamp(oct(x, y, 8, 2) * 255, 0, 255);
    d[k + 2] = clamp(oct(x, y, 4, 3) * 255, 0, 255); d[k + 3] = clamp(oct(x, y, 2, 4) * 255, 0, 255);
  }
  return d;
}
