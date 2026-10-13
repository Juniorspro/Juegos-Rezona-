// FAMATINA — arte con código: minas, sprites, texturas de roca, montañas, luces, minerales y retratos
const SUELO = 112, Y0 = SUELO + 10, NH = 44;
const POZO = { x: 3, w: 24 };
const EST = { x: 27, w: 36 };
const TUN = { arriba: 6, abajo: 38 };
const xVeta = () => W - 22;
const xMinA = () => 47;
const xMinB = () => W - 27;
function sup() { return { torre: 15, casa: 29, tolva: 52, ca: 78, cb: W - 60, ing: W - 54 }; }

const MINAS = [
  {
    id: 'famatina', nom: 'FAMATINA', prov: 'LA RIOJA', lat: -29.0, lon: -67.8, trans: 'cable', veg: 'cardon',
    cielo: { noche: ['#0a0e26', '#1e2552'], alba: ['#2e3f7e', '#f2a27a'], dia: ['#3f84d4', '#b6dcf4'], oro: ['#4f6db8', '#ffc479'], ocaso: ['#2f2f72', '#ff7448'] },
    montes: ['#8a78b0', '#a8644e', '#b86a3c'], cumbre: '#f4f0ff', suelo: ['#b06a3c', '#7e4428', '#d39158'], techo: '#a33b2c', pared: '#d0a47a',
    roca: [['#4e3226', '#664230', '#80583e'], ['#55282a', '#6e3530', '#88473a'], ['#3e3a46', '#544e5c', '#6c6474'], ['#2e2c46', '#3e3a5e', '#544e7a'], ['#2e1c1c', '#442622', '#5e3024']],
    menas: [['#d8803e', '#ffa860'], ['#38b47c', '#78f4ae'], ['#cfd8ea', '#f2f6ff'], ['#f6c845', '#ffe27a'], ['#fff3b0', '#ffffff']],
    minerales: [
      { n: 'CUARZO', e: 'cristal', c: ['#ffffff', '#d6e4f8', '#9ab0d4', '#f0f8ff'] },
      { n: 'PIRITA', e: 'cubo', c: ['#fff0a0', '#d8b848', '#8a6a20', '#fff8d0'] },
      { n: 'MALAQUITA', e: 'banda', c: ['#8af0b8', '#2fa86a', '#145a3a', '#5ad090'] },
      { n: 'CALCOPIRITA', e: 'cubo', c: ['#ffe08a', '#c8963a', '#5a4aa0', '#7ad0ff'] },
      { n: 'PLATA NATIVA', e: 'alambre', c: ['#ffffff', '#c8d0dc', '#7a8494', '#eef4ff'] },
      { n: 'ORO NATIVO', e: 'pepita', c: ['#fff4a0', '#f4c542', '#a8741c', '#ffffff'] }],
    mus: { raiz: 57, bpm: 100, quena: 1 },
  },
  {
    id: 'capillitas', nom: 'CAPILLITAS', prov: 'CATAMARCA', lat: -27.35, lon: -66.4, trans: 'vagon', veg: 'cardon',
    cielo: { noche: ['#120a26', '#2c1a4a'], alba: ['#4a2e7a', '#ff9aa0'], dia: ['#5a7ad8', '#e0c8f0'], oro: ['#6a50b0', '#ffb08a'], ocaso: ['#3a2270', '#ff6a8a'] },
    montes: ['#9a7ac0', '#a85a7a', '#9a4a5a'], cumbre: '#ffe8f4', suelo: ['#a05a5a', '#6a343a', '#c87a7a'], techo: '#6a3a6a', pared: '#e0b8b0',
    roca: [['#4a2a36', '#5e3644', '#764658'], ['#3e2840', '#523454', '#6a4470'], ['#36304a', '#4a4262', '#625a80'], ['#2a2440', '#3a3258', '#504676'], ['#2c1626', '#421e34', '#5c2844']],
    menas: [['#e86a8a', '#ff9ab8'], ['#ff5aa0', '#ff9ad0'], ['#b06ae0', '#d8a8ff'], ['#ffb0d0', '#ffe0f0'], ['#ff8ad8', '#ffffff']],
    minerales: [
      { n: 'CALCITA', e: 'tabla', c: ['#ffe0b0', '#f0a860', '#a0602a', '#fff0d8'] },
      { n: 'FLUORITA', e: 'cubo', c: ['#d0b0ff', '#9a6ae0', '#4a2a8a', '#a0f0d0'] },
      { n: 'AMATISTA', e: 'drusa', c: ['#e8c0ff', '#a860e0', '#5a2a8a', '#ffffff'] },
      { n: 'TURMALINA', e: 'cristal', c: ['#ff9ac0', '#3a9a6a', '#1a4a3a', '#ffd0e0'] },
      { n: 'ÓPALO', e: 'gota', c: ['#ffffff', '#bfe8ff', '#8ab0e0', '#ff9ad0'] },
      { n: 'RODOCROSITA', e: 'banda', c: ['#ffc0d4', '#e8608a', '#8a2a4a', '#ff90b0'] }],
    mus: { raiz: 62, bpm: 92, quena: 1.2 },
  },
  {
    id: 'aguilar', nom: 'AGUILAR', prov: 'JUJUY', lat: -23.2, lon: -65.7, trans: 'llama', veg: 'cardon', franjas: true,
    cielo: { noche: ['#081028', '#1a2a50'], alba: ['#2a4a8a', '#ffb070'], dia: ['#2e8ae8', '#a8e0ff'], oro: ['#3e70c0', '#ffd080'], ocaso: ['#2a3a7a', '#ff8a40'] },
    montes: ['#7a8ab8', '#c0603a', '#b88a4a'], cumbre: '#ffffff', suelo: ['#c08a50', '#8a5a30', '#e0aa6a'], techo: '#3a6a8a', pared: '#e8d0a8',
    roca: [['#5a3a2a', '#784a30', '#9a6a3a'], ['#3a4a3a', '#4e604a', '#687a5a'], ['#5a2a3a', '#743a4a', '#904a5a'], ['#2a3a4a', '#3a4e60', '#506a7a'], ['#3a2018', '#522a1e', '#6e3624']],
    menas: [['#9aa8c0', '#d8e4f8'], ['#e0a03a', '#ffd070'], ['#e8eef8', '#ffffff'], ['#3a7ae0', '#8ab8ff'], ['#f6c845', '#ffe88a']],
    minerales: [
      { n: 'BARITINA', e: 'tabla', c: ['#ffffff', '#e0e4ea', '#9aa4b0', '#fff8e8'] },
      { n: 'GALENA', e: 'cubo', c: ['#e0e8f0', '#8a96a8', '#3a4250', '#ffffff'] },
      { n: 'ESFALERITA', e: 'cristal', c: ['#ffd890', '#d08a2a', '#6a3a10', '#ffe8b0'] },
      { n: 'CINABRIO', e: 'cristal', c: ['#ff9a8a', '#d02a2a', '#6a1010', '#ffd0c0'] },
      { n: 'CRISOCOLA', e: 'banda', c: ['#a0fff0', '#2ab8b0', '#0a5a60', '#70e8e0'] },
      { n: 'AZURITA', e: 'drusa', c: ['#a0c0ff', '#2a5ad8', '#102a7a', '#d0e0ff'] }],
    mus: { raiz: 64, bpm: 118, quena: 1 },
  },
  {
    id: 'sierragrande', nom: 'SIERRA GRANDE', prov: 'RÍO NEGRO', lat: -41.6, lon: -65.4, trans: 'camion', veg: 'mata', mar: true,
    cielo: { noche: ['#06122a', '#16304e'], alba: ['#2a4a7a', '#f0b890'], dia: ['#4a90d0', '#c8e8f8'], oro: ['#4a78b0', '#ffd8a0'], ocaso: ['#26407a', '#ff8a5a'] },
    montes: ['#7890a8', '#8a7a6a', '#9a8a5a'], cumbre: '#e8f0f8', suelo: ['#a89060', '#7a6440', '#c8b080'], techo: '#8a2a2a', pared: '#c8c0b0',
    roca: [['#4a3028', '#603c30', '#7a4c3c'], ['#3a1e1e', '#522828', '#6c3232'], ['#2e2e36', '#40404a', '#565662'], ['#2a2a3e', '#383852', '#4a4a6a'], ['#24141a', '#381c22', '#4e242a']],
    menas: [['#b04a3a', '#ff7a5a'], ['#5a5a6e', '#a8a8ff'], ['#d07a4a', '#ffb07a'], ['#c0c8d8', '#f0f4ff'], ['#f6c845', '#fff0a0']],
    minerales: [
      { n: 'JASPE', e: 'banda', c: ['#ff9a7a', '#c0402a', '#601a10', '#e8704a'] },
      { n: 'CALCEDONIA', e: 'gota', c: ['#e0f0ff', '#9ab8d8', '#5a7aa0', '#ffffff'] },
      { n: 'MAGNETITA', e: 'cubo', c: ['#8a8a9a', '#3a3a48', '#14141c', '#c0c8ff'] },
      { n: 'ÓNIX', e: 'banda', c: ['#ffffff', '#2a2a30', '#0a0a10', '#cfcfcf'] },
      { n: 'ÁGATA', e: 'banda', c: ['#ffd0a0', '#c06a30', '#5a2a1a', '#ffffff'] },
      { n: 'HEMATITA', e: 'pepita', c: ['#d0d8e8', '#6a5a6a', '#3a1a1a', '#ff6a5a'] }],
    mus: { raiz: 55, bpm: 84, quena: 0.8 },
  },
  {
    id: 'rioturbio', nom: 'RÍO TURBIO', prov: 'SANTA CRUZ', lat: -51.5, lon: -72.3, trans: 'tren', veg: 'lenga', nieve: true,
    cielo: { noche: ['#040a1c', '#0e1e3e'], alba: ['#28406a', '#e0a8a0'], dia: ['#6a9ac8', '#d8e8f0'], oro: ['#5a74a8', '#f8c8a0'], ocaso: ['#22305e', '#e87a6a'] },
    montes: ['#8a9ab8', '#5a6a80', '#3e5a4a'], cumbre: '#ffffff', suelo: ['#e8eef4', '#a8b8c8', '#ffffff'], techo: '#3a4a5a', pared: '#b8a890',
    roca: [['#2a2a2e', '#3a3a40', '#4e4e56'], ['#24242c', '#32323c', '#44444e'], ['#2a2630', '#3a3442', '#4e4658'], ['#1e2230', '#2a3042', '#3a4256'], ['#1a1010', '#2a1814', '#3e2218']],
    menas: [['#1a1a20', '#ff8a3a'], ['#2a2a34', '#ffb05a'], ['#e0a020', '#ffd060'], ['#c8b090', '#fff0d0'], ['#c8f0ff', '#ffffff']],
    minerales: [
      { n: 'SELENITA', e: 'tabla', c: ['#ffffff', '#e8f0f4', '#a8b8c8', '#ffffff'] },
      { n: 'AZABACHE', e: 'gota', c: ['#8a8aa0', '#1a1a24', '#050508', '#ffffff'] },
      { n: 'OBSIDIANA', e: 'gota', c: ['#a0a0c0', '#20202c', '#08080c', '#c0c8ff'] },
      { n: 'HELECHO FÓSIL', e: 'fosil', c: ['#c8b8a0', '#8a7860', '#4a3a2a', '#2a2018'] },
      { n: 'AMONITE', e: 'fosil2', c: ['#f0d8a8', '#c09a5a', '#6a4a2a', '#fff0c8'] },
      { n: 'ÁMBAR', e: 'ambar', c: ['#ffe08a', '#e0901a', '#8a4a0a', '#3a2010'] }],
    mus: { raiz: 60, bpm: 76, quena: 1.3 },
  },
];

// ---------- utilidades de pixel ----------
function px(g, x, y, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), 1, 1); }
function rect(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
function lin(g, x0, y0, x1, y1, c) {
  g.fillStyle = c;
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  // derecha o parada: los mismos píxeles en un solo rectángulo
  if (x0 === x1 || y0 === y1) {
    const ax = Math.round(x0), ay = Math.round(y0), m = Math.floor(n), bx = Math.round(x0 + (x1 - x0) * m / n), by = Math.round(y0 + (y1 - y0) * m / n);
    g.fillRect(Math.min(ax, bx), Math.min(ay, by), Math.abs(bx - ax) + 1, Math.abs(by - ay) + 1);
    return;
  }
  for (let i = 0; i <= n; i++) g.fillRect(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), 1, 1);
}
// el disco se pinta una vez por radio y color y se estampa (los botones redondos eran ~700 rectángulos por cuadro)
const _disco = new Map();
function disco(g, cx, cy, r, c) {
  if (r !== Math.round(r) || r < 0) {
    g.fillStyle = c;
    for (let y = -r; y <= r; y++) { const w = Math.round(Math.sqrt(Math.max(0, r * r - y * y + r * 0.6))); g.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1); }
    return;
  }
  const k = c + '|' + r;
  let s = _disco.get(k);
  if (!s) {
    s = lienzo(r * 2 + 1, r * 2 + 1); const h = s.getContext('2d'); h.fillStyle = c;
    for (let y = -r; y <= r; y++) { const w = Math.round(Math.sqrt(Math.max(0, r * r - y * y + r * 0.6))); h.fillRect(r - w, r + y, w * 2 + 1, 1); }
    _disco.set(k, s);
  }
  g.drawImage(s, Math.round(cx) - r, Math.round(cy) - r);
}
function spr(filas, pal) {
  const h = filas.length, w = filas[0].length, c = lienzo(w, h), g = c.getContext('2d'), img = g.createImageData(w, h), d = img.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const ch = filas[y][x];
    if (ch === '.' || ch === ' ' || !pal[ch]) continue;
    const col = hexRgb(pal[ch]), p = (y * w + x) * 4;
    d[p] = col[0]; d[p + 1] = col[1]; d[p + 2] = col[2]; d[p + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return c;
}
function espejo(c) { const d = lienzo(c.width, c.height), g = d.getContext('2d'); g.translate(c.width, 0); g.scale(-1, 1); g.drawImage(c, 0, 0); return d; }
function ruido2D(rng) {
  const p = new Float32Array(4096);
  for (let i = 0; i < 4096; i++) p[i] = rng();
  const v = (x, y) => p[(Math.imul(x, 73856093) ^ Math.imul(y, 19349663)) & 4095];
  return (x, y) => {
    const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    return lerp(lerp(v(ix, iy), v(ix + 1, iy), sx), lerp(v(ix, iy + 1), v(ix + 1, iy + 1), sx), sy);
  };
}

// ---------- íconos ----------
const PAL_IC = {
  k: '#1a1020', y: '#f4c542', Y: '#b8862a', w: '#fffbe0', r: '#d8443a', R: '#8a2a22', g: '#b8c0cc', G: '#6a707c', b: '#3a7ad8', B: '#24488a',
  n: '#9a6436', N: '#5e3a1e', v: '#4ab86a', V: '#2a7a44', c: '#8ae8ff', C: '#3a8ac8', l: '#e8ecf2', d: '#2a1418', s: '#ffffff', S: '#c8d0dc', o: '#f08a30',
};
const IC_DEF = {
  moneda: ['..kkkkk..', '.kyywyyk.', 'kywyyyyyk', 'kyyyYyyYk', 'kyyYwYyYk', 'kyyyYyyYk', 'kyyyyyYYk', '.kYyyYYk.', '..kkkkk..'],
  pepita: ['...kkk...', '..kwyyk..', '.kwyyyykk', 'kyyyyyyYk', 'kyyyyyYYk', 'kYyyyYYk.', '.kYYYYk..', '..kkkk...'],
  engranaje: ['....kkk....', '.kk.kgk.kk.', '.kgkgggkgk.', '..kgggggk..', 'kkggkkkggkk', 'kgggk.kgggk', 'kkggkkkggkk', '..kgggggk..', '.kgkgggkgk.', '.kk.kgk.kk.', '....kkk....'],
  globo: ['..kkkkk..', '.kbbvbbk.', 'kbvvbbbbk', 'kbvvvbvbk', 'kbbvbbvvk', 'kbbbbvvbk', 'kbbbbvbbk', '.kbbbbbk.', '..kkkkk..'],
  minas: ['.....k.....', '....kwk....', '...kwnnk...', '..knnnnnk..', '..knnNnnk..', '.knnnkkknk.', '.knnkdddkk.', 'knnNkdddknk', 'knnnkdddknk', 'kkkkkkkkkkk'],
  casco: ['...kkkkk...', '..kyywyyk..', '.kyywyyyyk.', '.kywyyyyyk.', 'kyyyyyyyyYk', 'kyyyyyyyyYk', 'kkkkkkkkkkk', 'kYYYYYYYYYk', '.kkkkkkkkk.'],
  ofrenda: ['.....v.....', '....vVk....', '....kgk....', '...kgggk...', '...kgGgk...', '..kggggGk..', '..kgGgggk..', '.kgggGgggk.', '.kggggggGk.', 'kkkkkkkkkkk'],
  gema: ['...kkkkk...', '..kwccccCk.', '.kwcccccCCk', 'kkkkkkkkkkk', '.kccccccCk.', '..kcccccCk.', '...kcccCk..', '....kcCk...', '.....kk....'],
  trofeo: ['.kkkkkkkkk.', 'kykwyyyyYyk', 'kykwyyyyYyk', '.kkwyyyyYk.', '..kyyyyYk..', '...kyyYk...', '....kYk....', '....kyk....', '...kyyYk...', '..kkkkkkk..'],
  subir: ['.....k.....', '....kyk....', '...kyyyk...', '..kyyyyyk..', '.kkkyyykkk.', '...kyyyk...', '...kyyyk...', '...kyyyk...', '...kkkkk...'],
  candado: ['..kkkkk..', '.kgk.kgk.', '.kgk.kgk.', 'kkkkkkkkk', 'kyyyyyyYk', 'kyyykyyYk', 'kyyykyyYk', 'kyyyyyyYk', 'kkkkkkkkk'],
  reloj: ['..kkkkk..', '.klllllk.', 'klllklllk', 'klllklllk', 'klllkkllk', 'klllllllk', 'klllllllk', '.klllllk.', '..kkkkk..'],
  mano: ['..kk......', '.kssk.....', '.kssk.....', '.ksskkkk..', '.ksskssskk', 'kksssssssk', 'kSksssssk.', 'kSssssssk.', '.kSsssssk.', '..kSSSSk..', '..kkkkkk..'],
  estrella: ['....k....', '...kyk...', '...kyk...', 'kkkyyykkk', 'kyyyyyyyk', '.kyyyyyk.', '..kyyyk..', '.kyykyyk.', '.kkk.kkk.'],
  calendario: ['kkkkkkkkk', 'krrrrrrrk', 'kkkkkkkkk', 'klllllllk', 'klklklklk', 'klllllllk', 'klklklklk', 'klllllllk', 'kkkkkkkkk'],
  rayo: ['...kkk.', '..kyyk.', '.kyyk..', 'kyyyykk', 'kkyyyyk', '..kyyk.', '.kyyk..', '.kyk...', '.kk....'],
  pico: ['.kkkkk...', 'kgggggk..', 'kgkkkngk.', 'kk..knk..', '....knk..', '...knk...', '..knk....', '.knk.....', '.kk......'],
  carro: ['..yyy.y..', '.kkkkkkkk', '.knnnnnnk', '.knNnnNnk', '..knnnnk.', '..kkkkkk.', '..kk..kk.'],
  jaula: ['kkkkkkkkk', 'kgggggggk', 'kgkgkgkgk', 'kgkgkgkgk', 'kgkgkgkgk', 'kgggggggk', 'kkkkkkkkk'],
  flechaD: ['.kkk.', '.kyk.', 'kkykk', '.kyk.', '..k..'],
};
const IC = {};
function icono(g, nom, x, y, t) {
  let c = IC[nom];
  if (!c) { c = IC[nom] = nom === 'bajar' ? (() => { const s = icono0('subir'), d = lienzo(s.width, s.height), gg = d.getContext('2d'); gg.translate(0, s.height); gg.scale(1, -1); gg.drawImage(s, 0, 0); return d; })() : icono0(nom); }
  t = t || 1;
  g.drawImage(c, Math.round(x), Math.round(y), c.width * t, c.height * t);
  return c;
}
function icono0(nom) { return spr(IC_DEF[nom], PAL_IC); }
function tamIcono(nom) { const d = IC_DEF[nom === 'bajar' ? 'subir' : nom]; return [d[0].length, d.length]; }

// ---------- mineros ----------
const MIN_SUP = ['...kkkk...', '..kyywyyk.', '.kyyyyyykw', '.kYYYYYYYk', '..ksssesk.', '..kSsmmmk.', '...ksssk..', '..kcctcck.', '.kccctcCck', '.ksccctcsk'];
const MIN_PIER = {
  parado: ['..kPpppPk.', '..kppkppk.', '..kppkppk.', '..kbbkkbbk'],
  paso: ['..kPpppPk.', '..kpPkppk.', '.kppk.kpk.', '.kbbk.kbbk'],
  paso2: ['..kPpppPk.', '..kppkPpk.', '..kpk.kppk', '..kbbk.kbb'],
};
const PAL_MIN = { k: '#2a1a2e', y: '#f4c542', Y: '#b8862a', w: '#fff4c8', s: '#eaa97c', S: '#b8714a', e: '#2a1a2e', m: '#5a3420', t: '#8a4a2a', p: '#5e4a3a', P: '#3e3028', b: '#2a1e1a' };
const CAMISAS = [['#4a7cc0', '#2e5288'], ['#c84a3a', '#8a2e26'], ['#4a9a5a', '#2e6a3a'], ['#d0943a', '#9a6424'], ['#8a5ac0', '#5a3a8a']];
const PIELES = ['#f0c098', '#eaa97c', '#c88a5a', '#a86a42', '#7a4a2e'];
const SPR = {};
function framesMinero(camisa, piel, casco) {
  const pal = Object.assign({}, PAL_MIN, { c: camisa[0], C: camisa[1], s: piel, S: mezcla(piel, '#5a2a1a', 0.35) }, casco || {});
  const f = {};
  for (const k in MIN_PIER) { const d = spr(MIN_SUP.concat(MIN_PIER[k]), pal); f[k] = [d, espejo(d)]; }
  return f;
}
function prepararSprites() {
  SPR.min = [];
  for (let i = 0; i < CAMISAS.length; i++) SPR.min.push(framesMinero(CAMISAS[i], PIELES[i % PIELES.length]));
  const cascos = [{ y: '#f2f2f2', Y: '#a8aebc', w: '#ffffff' }, { y: '#5aa0f0', Y: '#2e5aa8', w: '#d8ecff' }, { y: '#ffd84a', Y: '#c0821a', w: '#fffbe0' }];
  SPR.cap = cascos.map((c, r) => framesMinero(['#ff8a2a', '#c05a14'], PIELES[(r * 2 + 1) % 5], c));
  SPR.bolsa = spr(['.kkkk.', 'koxook', 'kooOok', 'koooOk', 'kooook', '.kkkk.'], { k: '#2a1a2e', o: '#b08a50', O: '#7a5a30', x: '#ffffff' });
}
// minero con los pies en (x, y); est: 'camina'|'pica'|'quieto'; fase en segundos
function dibujarMinero(g, fr, x, y, est, dir, fase, carga, colMena) {
  const lado = dir > 0 ? 0 : 1;
  let f = fr.parado, bob = 0;
  if (est === 'camina') { const k = Math.floor(fase * 7) % 4; f = k === 0 ? fr.paso : k === 2 ? fr.paso2 : fr.parado; bob = k % 2; }
  const sx = Math.round(x - 5), sy = Math.round(y - 14 + bob);
  if (carga) {
    const bx = dir > 0 ? sx - 2 : sx + 6;
    g.drawImage(SPR.bolsa, bx, sy + 5);
    if (colMena) { px(g, bx + 2, sy + 5, colMena); px(g, bx + 3, sy + 5, colMena); }
  }
  g.drawImage(f[lado], sx, sy);
  if (est === 'pica') {
    const k = (fase * 2.6) % 1, a = k < 0.55 ? lerp(-2.3, -1.6, k / 0.55) : k < 0.75 ? lerp(-1.6, 0.5, (k - 0.55) / 0.2) : 0.5;
    dibujarPico(g, sx + (dir > 0 ? 8 : 1), sy + 9, a, dir);
  } else if (!carga && est !== 'quieto') dibujarPico(g, sx + (dir > 0 ? 3 : 6), sy + 7, -2.5, dir);
}
function dibujarPico(g, hx, hy, a, dir) {
  const L = 6, ex = hx + Math.cos(a) * L * dir, ey = hy + Math.sin(a) * L;
  lin(g, hx, hy, ex, ey, '#9a6a3a');
  const pxx = -Math.sin(a) * dir, pyy = Math.cos(a);
  for (let k = -2; k <= 2; k++) px(g, ex + pxx * k, ey + pyy * k, Math.abs(k) === 2 ? '#7a8090' : '#d0d8e0');
}

// ---------- vehículos y animales ----------
function dibujarCarro(g, tipo, x, y, dir, carga, col, fase) {
  x = Math.round(x); y = Math.round(y);
  const k = '#1e1418';
  if (tipo === 'cable') {
    rect(g, x - 1, y - 1, 3, 2, k); lin(g, x, y, x, y + 4, '#3a3036');
    rect(g, x - 3, y + 5, 7, 1, k); rect(g, x - 3, y + 6, 7, 3, '#6a5a52'); rect(g, x - 2, y + 9, 5, 1, '#4a3c36'); rect(g, x - 3, y + 6, 1, 3, '#8a7a70');
    if (carga) { rect(g, x - 2, y + 4, 5, 1, col); px(g, x, y + 3, col); }
  } else if (tipo === 'vagon') {
    rect(g, x - 6, y - 8, 12, 1, k); rect(g, x - 6, y - 7, 12, 4, '#8a3a2a'); rect(g, x - 5, y - 3, 10, 1, '#5a2418'); rect(g, x - 6, y - 7, 12, 1, '#b05a3a');
    rect(g, x - 4, y - 2, 2, 2, k); rect(g, x + 2, y - 2, 2, 2, k);
    if (carga) { rect(g, x - 5, y - 10, 10, 2, col); rect(g, x - 3, y - 11, 6, 1, col); }
  } else if (tipo === 'llama') {
    const pasoA = Math.floor(fase * 6) % 2, c1 = '#efe4cc', c2 = '#c8b48e', d = dir;
    const bx = x - 5 * d;
    for (let i = 0; i < 4; i++) { const lx = x - 5 + i * 3, off = (i + pasoA) % 2; rect(g, lx, y - 4 + off, 1, 4 - off, c2); }
    rect(g, x - 6, y - 9, 12, 5, c1); rect(g, x - 6, y - 5, 12, 1, c2);
    const nx = x + 5 * d; rect(g, nx - (d > 0 ? 1 : 0), y - 15, 2, 7, c1);
    rect(g, nx + (d > 0 ? -1 : -2), y - 17, 4, 3, c1); px(g, nx + (d > 0 ? 2 : -3), y - 16, c1);
    px(g, nx + (d > 0 ? 1 : -2), y - 16, k); px(g, nx - 1, y - 19, c2); px(g, nx + 1, y - 19, c2); px(g, nx - 1, y - 18, '#e83a6a'); px(g, nx + 1, y - 18, '#3ab0e8');
    rect(g, x - 4, y - 10, 8, 2, '#d8344a'); rect(g, x - 4, y - 9, 8, 1, '#f4c542'); px(g, x - 2, y - 10, '#3a8ae8'); px(g, x + 2, y - 10, '#3ab06a');
    if (carga) { rect(g, x - 4, y - 13, 7, 3, '#b08a50'); rect(g, x - 3, y - 14, 5, 1, col); }
    void bx;
  } else if (tipo === 'camion') {
    const cx = x + 6 * dir;
    rect(g, x - 9, y - 9, 13, 5, '#e0b030'); rect(g, x - 9, y - 9, 13, 1, '#fff0a0'); rect(g, x - 9, y - 5, 13, 1, '#a07a10');
    rect(g, cx - (dir > 0 ? 0 : 4), y - 10, 5, 6, '#f2f2f2'); rect(g, cx + (dir > 0 ? 2 : -3), y - 9, 2, 2, '#6ac0f0');
    rect(g, x - 10, y - 4, 21, 1, '#3a3a3a');
    rect(g, x - 7, y - 3, 3, 3, k); rect(g, x + 4, y - 3, 3, 3, k); px(g, x - 6, y - 2, '#8a8a8a'); px(g, x + 5, y - 2, '#8a8a8a');
    if (carga) { rect(g, x - 8, y - 11, 11, 2, col); rect(g, x - 6, y - 12, 7, 1, col); }
  } else if (tipo === 'tren') {
    const lx = x + 4 * dir, wx = x - 8 * dir;
    rect(g, lx - 5, y - 9, 10, 6, '#2a2a30'); rect(g, lx - 5, y - 6, 10, 1, '#c83a2a');
    rect(g, lx + (dir > 0 ? -5 : 1), y - 12, 4, 3, '#2a2a30'); rect(g, lx + (dir > 0 ? 3 : -4), y - 12, 2, 3, '#3a3a40');
    px(g, lx + (dir > 0 ? 5 : -6), y - 7, '#ffe08a');
    rect(g, wx - 5, y - 7, 10, 4, '#6a4a3a'); rect(g, wx - 5, y - 7, 10, 1, '#8a6a52');
    for (const w of [lx - 3, lx + 2, wx - 3, wx + 2]) rect(g, w, y - 3, 2, 2, k);
    if (carga) rect(g, wx - 4, y - 9, 8, 2, col);
  }
}
function dibujarCondor(g, x, y, fase, dorado) {
  x = Math.round(x); y = Math.round(y);
  const a = Math.sin(fase * 5), tip = Math.round(a * 3), c = dorado ? '#f4c542' : '#16121a', c2 = dorado ? '#fff4b0' : '#e8e4e0', c3 = dorado ? '#b8862a' : '#2e2a30';
  for (const s of [-1, 1]) {
    for (let i = 1; i <= 8; i++) { const yy = y + Math.round(tip * i / 8) - (i > 5 ? 0 : 0); px(g, x + s * i, yy, c); px(g, x + s * i, yy + 1, i < 6 ? c3 : c); if (i > 2 && i < 6) px(g, x + s * i, yy, c2); }
    px(g, x + s * 9, y + tip - 1, c); px(g, x + s * 9, y + tip + 1, c); px(g, x + s * 10, y + tip, c);
  }
  rect(g, x - 1, y, 3, 2, c); px(g, x, y - 1, c2); px(g, x + 1, y - 1, c2); px(g, x + 2, y - 1, dorado ? '#ffffff' : '#b06a6a');
}

// ---------- cielo, nubes y montañas ----------
const FASES_CIELO = [[0, 'noche'], [0.2, 'noche'], [0.26, 'alba'], [0.34, 'dia'], [0.66, 'dia'], [0.74, 'oro'], [0.8, 'ocaso'], [0.87, 'noche'], [1, 'noche']];
function colorCielo(m, fase) {
  let a = FASES_CIELO[0], b = FASES_CIELO[1];
  for (let i = 0; i < FASES_CIELO.length - 1; i++) if (fase >= FASES_CIELO[i][0] && fase <= FASES_CIELO[i + 1][0]) { a = FASES_CIELO[i]; b = FASES_CIELO[i + 1]; break; }
  const t = b[0] > a[0] ? suave((fase - a[0]) / (b[0] - a[0])) : 0, A = m.cielo[a[1]], B = m.cielo[b[1]];
  return [mezcla(A[0], B[0], t), mezcla(A[1], B[1], t)];
}
// tinte de la luz del día: [color, alfa] para teñir objetos
function tinteDia(fase) {
  const noche = fase < 0.22 || fase > 0.86 ? 1 : fase < 0.3 ? 1 - (fase - 0.22) / 0.08 : fase > 0.8 ? (fase - 0.8) / 0.06 : 0;
  const oro = fase > 0.68 && fase < 0.86 ? Math.sin((fase - 0.68) / 0.18 * Math.PI) : fase > 0.22 && fase < 0.34 ? Math.sin((fase - 0.22) / 0.12 * Math.PI) * 0.7 : 0;
  return { noche: clamp(noche, 0, 1), oro: clamp(oro, 0, 1) };
}
function nubes() {
  if (SPR.nubes) return SPR.nubes;
  const r = rngSemilla(77);
  SPR.nubes = [0, 1, 2].map(i => {
    const w = 28 + i * 8, h = 10 + i * 2, c = lienzo(w, h), g = c.getContext('2d');
    const bol = [];
    for (let k = 0; k < 6 + i * 2; k++) bol.push([4 + r() * (w - 8), h * 0.45 + r() * h * 0.25, 2.5 + r() * (h * 0.32)]);
    for (const [x, y, rr] of bol) disco(g, x, y + 1.5, rr, '#b8c0d8');
    for (const [x, y, rr] of bol) disco(g, x, y, rr - 0.5, '#ffffff');
    g.globalCompositeOperation = 'destination-out'; g.fillRect(0, h - 2, w, 2);
    return c;
  });
  return SPR.nubes;
}
function cresta(rng, w, base, amp, picos) {
  const fs = [[0.011, rng() * 6], [0.027, rng() * 6], [0.06, rng() * 6], [0.13, rng() * 6]], out = new Float32Array(w);
  for (let x = 0; x < w; x++) {
    let h = 0;
    h += Math.sin(x * fs[0][0] + fs[0][1]) * 0.5 + Math.sin(x * fs[1][0] + fs[1][1]) * 0.3 + Math.sin(x * fs[2][0] + fs[2][1]) * 0.14 + Math.sin(x * fs[3][0] + fs[3][1]) * 0.06;
    for (const p of picos || []) h += p[2] * Math.exp(-Math.pow((x - p[0] * w) / p[1], 2));
    out[x] = base - h * amp;
  }
  return out;
}
const _montes = new Map();
function capasMontes(m) {
  const key = m.id + ':' + W;
  let M = _montes.get(key);
  if (M) return M;
  const rng = rngSemilla(hashTxt(key)), H0 = SUELO + 2;
  const capas = [];
  const defs = [
    { base: SUELO - 50, amp: 22, picos: m.id === 'famatina' ? [[0.66, 18, 1.4]] : m.id === 'rioturbio' ? [[0.3, 10, 1.2], [0.72, 8, 1.5]] : [[rng(), 22, 0.8]] },
    { base: SUELO - 26, amp: 14, picos: [] },
    { base: SUELO - 10, amp: 6, picos: [] },
  ];
  defs.forEach((d, i) => {
    const c = lienzo(W, H0), g = c.getContext('2d'), cr = cresta(rng, W, d.base, d.amp, d.picos), col = m.montes[i];
    const luz = mezcla(col, '#ffffff', 0.18), som = mezcla(col, '#000000', 0.2);
    for (let x = 0; x < W; x++) {
      const top = Math.round(cr[x]), pend = (cr[Math.min(W - 1, x + 1)] - cr[Math.max(0, x - 1)]);
      for (let y = top; y < H0; y++) {
        let cc = col;
        if (m.franjas && i === 1) { const k = Math.floor((y * 1.0 + Math.sin(x * 0.05) * 4 + x * 0.12) / 3) % 6; cc = ['#c23a2a', '#e08a3a', '#f0c060', '#7aa060', '#a05a8a', '#e07aa0'][(k + 6) % 6]; }
        if (y - top < 3 && pend > 0.3) cc = mezcla(cc, '#ffffff', 0.15);
        else if (pend < -0.2 && y - top < 10) cc = mezcla(cc, '#000000', 0.12);
        if (i === 0 && y - top < 6 + (x % 3) && top < d.base - d.amp * 0.15) cc = m.cumbre;
        if (m.id === 'rioturbio' && y - top < 2 + (x * 7 % 3)) cc = m.cumbre;
        g.fillStyle = cc; g.fillRect(x, y, 1, 1);
      }
      void luz; void som;
    }
    if (i === 2 && m.veg === 'lenga') { for (let x = 2; x < W; x += 3 + Math.floor(rng() * 4)) { const top = Math.round(cr[x]), hh = 5 + Math.floor(rng() * 6); for (let k = 0; k < hh; k++) { const ww = Math.floor(k / 2); g.fillStyle = k % 3 ? '#1e3a2a' : '#2e4a34'; g.fillRect(x - ww, top - hh + k, ww * 2 + 1, 1); } } }
    if (m.mar && i === 0) { const x0 = Math.round(W * 0.6); g.clearRect(x0, 0, W - x0, H0); }
    capas.push({ base: c, cr, tint: lienzo(W, H0), t: -1 });
  });
  M = { capas };
  _montes.set(key, M);
  return M;
}

// ---------- luces ----------
const _luz = new Map();
function spriteLuz(col, r) {
  r = r > 12 ? Math.round(r / 3) * 3 : Math.max(2, Math.round(r));   // en escalones: la luz que crece no arma un lienzo por cuadro
  const key = col + r;
  let c = _luz.get(key);
  if (c) return c;
  c = lienzo(r * 2, r * 2);
  const g = c.getContext('2d'), gr = g.createRadialGradient(r, r, 0, r, r, r), [a, b, d] = hexRgb(col);
  gr.addColorStop(0, `rgba(${a},${b},${d},1)`); gr.addColorStop(0.35, `rgba(${a},${b},${d},0.55)`); gr.addColorStop(0.7, `rgba(${a},${b},${d},0.16)`); gr.addColorStop(1, `rgba(${a},${b},${d},0)`);
  g.fillStyle = gr; g.fillRect(0, 0, r * 2, r * 2);
  _luz.set(key, c);
  return c;
}
function spriteCono(col, r, dir) {
  const key = 'cono' + col + r + dir;
  let c = _luz.get(key);
  if (c) return c;
  c = lienzo(r * 2, r);
  const g = c.getContext('2d'), cx = dir > 0 ? 0 : r * 2, gr = g.createRadialGradient(cx, r / 2, 0, cx, r / 2, r * 2), [a, b, d] = hexRgb(col);
  gr.addColorStop(0, `rgba(${a},${b},${d},0.9)`); gr.addColorStop(0.5, `rgba(${a},${b},${d},0.3)`); gr.addColorStop(1, `rgba(${a},${b},${d},0)`);
  g.fillStyle = gr; g.beginPath(); g.moveTo(cx, r / 2 - 1); g.lineTo(cx + dir * r * 2, 0); g.lineTo(cx + dir * r * 2, r); g.closePath(); g.fill();
  _luz.set(key, c);
  return c;
}

// ---------- texturas de los niveles ----------
const _tex = new Map();
function limpiarTexturas() { _tex.clear(); _montes.clear(); _estat.clear(); }
function texNivel(m, i, cerrado) {
  const key = m.id + ':' + i + ':' + W + (cerrado ? 'c' : '');
  let T = _tex.get(key);
  if (T) return T;
  const c = lienzo(W, NH), g = c.getContext('2d'), img = g.createImageData(W, NH), d = img.data;
  const rng = rngSemilla(hashTxt(key)), ru = ruido2D(rng);
  const banda = Math.min(4, Math.floor(i / 5)), pal = m.roca[banda].map(hexRgb), mena = hexRgb(m.menas[banda][0]), menaL = hexRgb(m.menas[banda][1]);
  const xV = xVeta(), yA = TUN.arriba, yB = TUN.abajo, x0t = POZO.x + POZO.w;
  const techo = [], cara = [];
  for (let x = 0; x < W; x++) techo[x] = Math.round(ru(x / 5, 9.3) * 2.2);
  for (let y = 0; y < NH; y++) cara[y] = Math.round(ru(3.7, y / 4) * 4) - 2;
  const pared = mezcla(m.roca[banda][1], '#140c10', 0.36), pared2 = mezcla(m.roca[banda][2], '#140c10', 0.46);
  const pp = hexRgb(pared), pq = hexRgb(pared2), tierra = hexRgb(mezcla(m.roca[banda][1], '#2a1a12', 0.4));
  const yy0 = i * NH;
  for (let y = 0; y < NH; y++) for (let x = 0; x < W; x++) {
    let n = ru(x / 7, (y + yy0) / 7) * 0.62 + ru(x / 2.4 + 50, (y + yy0) / 2.4) * 0.38 + Math.sin((y + yy0) * 0.42 + x * 0.045) * 0.07;
    let col = n < 0.42 ? pal[0] : n < 0.67 ? pal[1] : pal[2];
    const dentro = !cerrado && y >= yA + techo[x] && y < yB && x >= x0t && x < xV + cara[y];
    if (x >= POZO.x && x < x0t && !cerrado) {
      col = (y + yy0) % 7 === 0 ? [58, 40, 28] : (y + yy0) % 7 === 1 ? [40, 28, 20] : [26, 18, 20];
      if (x === POZO.x + 1 || x === x0t - 2) col = [92, 92, 104];
      if (x === POZO.x || x === x0t - 1) col = [70, 50, 34];
    } else if (dentro) {
      col = n < 0.5 ? pp : pq;
      if (y >= yB - 3) col = tierra;
      if (x < EST.x + EST.w && y < yB - 3 && y > yA + 2) col = (x % 5 === 0) ? [44, 28, 18] : [74, 50, 32];
    } else if (x > xV - 46 && !cerrado) {
      const p = clamp((x - (xV - 46)) / 46, 0, 1);
      if (rng() < p * p * 0.22 && n > 0.5) col = rng() < 0.3 ? menaL : mena;
    } else if (rng() < 0.004 && n > 0.6) col = mena;
    const k = (y * W + x) * 4;
    d[k] = col[0]; d[k + 1] = col[1]; d[k + 2] = col[2]; d[k + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const luces = [], brillos = [];
  // piedritas y grietas en la roca
  for (let k = 0; k < W / 9; k++) {
    const x = Math.floor(rng() * W), y = rng() < 0.5 ? Math.floor(rng() * yA) : yB + 1 + Math.floor(rng() * (NH - yB - 1));
    if (x < x0t) continue;
    rect(g, x, y, 2, 1, m.roca[banda][2]); px(g, x, y + 1, m.roca[banda][0]);
  }
  for (let k = 0; k < 2; k++) {
    let x = x0t + rng() * (W - x0t), y = rng() < 0.5 ? 1 : yB + 2;
    for (let s = 0; s < 6; s++) { px(g, x, y, mezcla(m.roca[banda][0], '#000000', 0.4)); x += rng() < 0.5 ? 1 : -1; y += rng() < 0.6 ? 1 : 0; if (y >= NH) break; }
  }
  if (!cerrado) {
    // vías
    for (let x = EST.x; x < xV - 2; x++) { px(g, x, yB - 2, '#6a6a76'); if (x % 4 === 0) px(g, x, yB - 1, '#3a2418'); }
    // puntales y faroles
    let n = 0;
    for (let x = EST.x + EST.w + 10; x < xV - 10; x += 30) {
      rect(g, x, yA + 1, 2, yB - yA - 1, '#94643a'); rect(g, x + 1, yA + 1, 1, yB - yA - 1, '#5e3c22');
      rect(g, x - 4, yA, 10, 2, '#a8743e'); rect(g, x - 4, yA + 1, 10, 1, '#5e3c22');
      if (n++ % 2 === 0) { rect(g, x + 4, yA + 2, 1, 2, '#2a2020'); rect(g, x + 3, yA + 4, 3, 3, '#2a2020'); px(g, x + 4, yA + 5, '#ffe08a'); luces.push({ x: x + 4.5, y: yA + 5.5, c: '#ffb860', r: 38, f: 1 }); brillos.push({ x: x + 4.5, y: yA + 5.5, c: '#ffd890', r: 4 }); }
    }
    // adornos: cada nivel distinto
    for (let x = EST.x + EST.w + 16; x < xV - 18; x += 30) {
      const k = Math.floor(rng() * 7), ax = x + 6 + Math.floor(rng() * 12), yb = yB - 2;
      if (k === 0) { rect(g, ax, yb - 5, 7, 5, '#8a5a30'); rect(g, ax, yb - 5, 7, 1, '#b07a44'); lin(g, ax, yb - 4, ax + 6, yb - 1, '#5a3a1e'); lin(g, ax + 6, yb - 4, ax, yb - 1, '#5a3a1e'); }
      else if (k === 1) { rect(g, ax, yb - 6, 5, 6, '#7a4a2a'); rect(g, ax, yb - 5, 5, 1, '#3a2a20'); rect(g, ax, yb - 2, 5, 1, '#3a2a20'); px(g, ax + 1, yb - 6, '#a06a3a'); }
      else if (k === 2) { const cm = m.menas[banda][0]; rect(g, ax - 1, yb - 6, 11, 4, '#7a3a2a'); rect(g, ax - 1, yb - 6, 11, 1, '#a05a3a'); rect(g, ax, yb - 7, 9, 1, cm); rect(g, ax + 2, yb - 8, 4, 1, cm); rect(g, ax, yb - 2, 2, 2, '#1e1418'); rect(g, ax + 7, yb - 2, 2, 2, '#1e1418'); }
      else if (k === 3) { lin(g, ax, yb, ax + 3, yb - 10, '#9a6a3a'); for (let q = -1; q <= 2; q++) px(g, ax + 3 + q, yb - 10 - (q === -1 || q === 2 ? 0 : 1), '#c8d0d8'); lin(g, ax + 5, yb, ax + 6, yb - 9, '#9a6a3a'); rect(g, ax + 5, yb - 2, 3, 2, '#8890a0'); }
      else if (k === 4) { rect(g, ax, yb - 3, 6, 3, '#c83a2a'); rect(g, ax, yb - 3, 6, 1, '#f06a4a'); px(g, ax + 2, yb - 4, '#e8e0c0'); }
      else if (k === 5) { rect(g, ax, yA + 3, 1, yb - yA - 3, '#8a6038'); rect(g, ax + 4, yA + 3, 1, yb - yA - 3, '#8a6038'); for (let q = yA + 6; q < yb; q += 4) rect(g, ax, q, 5, 1, '#6a4428'); }
    }
    // la estación: farol junto al pozo
    rect(g, EST.x + 2, yA + 3, 3, 3, '#2a2020'); px(g, EST.x + 3, yA + 4, '#ffe08a');
    luces.push({ x: EST.x + 3.5, y: yA + 4.5, c: '#ffc070', r: 32, f: 1 }); brillos.push({ x: EST.x + 3.5, y: yA + 4.5, c: '#ffe0a0', r: 3 });
    // la veta: cristales en la cara
    for (let k = 0; k < 9; k++) {
      const y = yA + 3 + Math.floor(rng() * (yB - yA - 6)), x = xV + cara[y] + Math.floor(rng() * 6) - 1;
      const cm = m.menas[banda];
      px(g, x, y - 1, cm[1]); rect(g, x - 1, y, 3, 1, cm[0]); px(g, x, y + 1, mezcla(cm[0], '#000000', 0.35)); px(g, x, y, cm[1]);
      if (k % 3 === 0) brillos.push({ x: x + 0.5, y: y + 0.5, c: cm[1], r: 3, chispa: 1 });
    }
    luces.push({ x: xV + 2, y: (yA + yB) / 2, c: m.menas[banda][1], r: 22, f: 0 });
    // adornos por profundidad
    if (banda === 2 || banda === 4) {
      for (let x = EST.x + EST.w + 4; x < xV - 6; x += 9 + Math.floor(rng() * 14)) {
        const cc = banda === 2 ? m.menas[2] : ['#ff5a1a', '#ffd040'];
        if (banda === 2) { const y = yA + techo[x]; px(g, x, y, cc[0]); px(g, x, y + 1, cc[1]); px(g, x + 1, y, cc[0]); if (rng() < 0.4) brillos.push({ x: x + 0.5, y: y + 1, c: cc[1], r: 2.5 }); }
        else { let yy = yB + 1 + Math.floor(rng() * 3), xx = x; for (let s = 0; s < 5; s++) { px(g, xx, yy, s % 2 ? cc[0] : cc[1]); xx += 1; yy += rng() < 0.5 ? 1 : 0; if (yy >= NH) break; } luces.push({ x: x + 2, y: yB + 3, c: '#ff5a20', r: 12, f: 2 }); }
      }
    }
    if (banda === 3) for (let x = EST.x + EST.w + 14; x < xV - 8; x += 22 + Math.floor(rng() * 20)) { rect(g, x - 3, yB - 3, 7, 1, '#3a6a9a'); px(g, x - 1, yB - 3, '#8ac8ff'); luces.push({ x, y: yB - 3, c: '#4a8ad0', r: 9, f: 0 }); }
  } else {
    // nivel cerrado: tablas en la boca
    for (let y = yA + 4; y < yB; y += 5) { rect(g, x0t, y, 12, 3, '#6a4a2a'); rect(g, x0t, y + 2, 12, 1, '#3a2614'); px(g, x0t + 2, y + 1, '#2a1a10'); px(g, x0t + 9, y + 1, '#2a1a10'); }
  }
  T = { cv: c, luces, brillos };
  _tex.set(key, T);
  return T;
}
function texFondo(m) {
  const key = m.id + ':fondo:' + W;
  let T = _tex.get(key);
  if (T) return T;
  const c = lienzo(W, NH), g = c.getContext('2d'), rng = rngSemilla(hashTxt(key)), ru = ruido2D(rng), brillos = [];
  const img = g.createImageData(W, NH), d = img.data;
  for (let y = 0; y < NH; y++) for (let x = 0; x < W; x++) {
    const n = ru(x / 6, y / 6) * 0.6 + ru(x / 2.3 + 9, y / 2.3) * 0.4 + Math.sin(y * 0.5 + x * 0.04) * 0.08, b = clamp(Math.floor(x / W * 2 + y / NH * 3) % 5, 0, 4);
    const pal = m.roca[b], col = hexRgb(mezcla(n < 0.42 ? pal[0] : n < 0.66 ? pal[1] : pal[2], '#000000', 0.18));
    const k = (y * W + x) * 4; d[k] = col[0]; d[k + 1] = col[1]; d[k + 2] = col[2]; d[k + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  for (let k = 0; k < W / 10; k++) { const x = Math.floor(rng() * W), y = Math.floor(rng() * NH); rect(g, x, y, 2, 1, m.roca[2][2]); px(g, x, y + 1, m.roca[0][0]); }
  for (let k = 0; k < 3; k++) {
    const x = 8 + Math.floor(rng() * (W - 16)), y = 6 + Math.floor(rng() * (NH - 12)), cm = m.menas[Math.floor(rng() * 5)];
    px(g, x, y - 1, cm[1]); rect(g, x - 1, y, 3, 1, cm[0]); px(g, x, y + 1, mezcla(cm[0], '#000000', 0.4)); px(g, x + 2, y + 2, cm[0]);
    brillos.push({ x: x + 0.5, y: y + 0.5, c: cm[1], r: 3, chispa: 1 });
  }
  if (rng() < 0.5) { const x = 10 + Math.floor(rng() * (W - 20)), y = 10 + Math.floor(rng() * (NH - 20)); for (let a = 0; a < 12; a += 0.4) { const rr = 0.6 + a * 0.32; px(g, x + Math.cos(a) * rr, y + Math.sin(a) * rr, '#c8b090'); } }
  for (let k = 0; k < 2; k++) { let x = rng() * W, y = rng() * NH; for (let s = 0; s < 7; s++) { px(g, x, y, mezcla(m.roca[0][0], '#000000', 0.5)); x += rng() < 0.5 ? 1 : -1; y += rng() < 0.6 ? 1 : 0; } }
  T = { cv: c, luces: [], brillos };
  _tex.set(key, T);
  return T;
}

// ---------- superficie estática ----------
const _estat = new Map();
function superficieEstatica(m) {
  const key = m.id + ':' + W;
  let S = _estat.get(key);
  if (S) return S;
  const c = lienzo(W, SUELO + 10), g = c.getContext('2d'), rng = rngSemilla(hashTxt(key)), P = sup();
  const [s0, s1, s2] = m.suelo;
  // vegetación de fondo
  for (let x = 6; x < W; x += 14 + Math.floor(rng() * 26)) {
    if (x < P.tolva + 20 || x > P.ing - 6) continue;
    const yb = SUELO - 1;
    if (m.veg === 'cardon') { const h = 8 + Math.floor(rng() * 8); rect(g, x, yb - h, 2, h, '#3a6a3a'); px(g, x + 1, yb - h, '#5a8a4a'); if (h > 10) { rect(g, x - 2, yb - h + 4, 2, 1, '#3a6a3a'); rect(g, x - 2, yb - h + 1, 1, 3, '#3a6a3a'); rect(g, x + 2, yb - h + 6, 2, 1, '#3a6a3a'); rect(g, x + 3, yb - h + 3, 1, 3, '#3a6a3a'); } }
    else if (m.veg === 'mata') { rect(g, x - 2, yb - 2, 5, 2, '#6a7a3a'); px(g, x, yb - 3, '#8a9a4a'); }
    else { const h = 9 + Math.floor(rng() * 6); rect(g, x, yb - 3, 1, 3, '#4a3020'); for (let k = 0; k < h - 3; k++) { const ww = Math.floor((h - 3 - k) / 3) + 1; rect(g, x - ww + 1, yb - 3 - k, ww * 2 - 1, 1, k % 4 === 0 ? '#ffffff' : '#2e5a3a'); } }
  }
  // suelo
  for (let x = 0; x < W; x++) for (let y = SUELO; y < SUELO + 10; y++) {
    const n = (Math.imul(x, 374761393) ^ Math.imul(y, 668265263)) >>> 0;
    let cc = y === SUELO ? s2 : y < SUELO + 2 ? s0 : (n % 7 === 0 ? s1 : (n % 11 === 0 ? s2 : s0));
    if (y > SUELO + 5) cc = mezcla(cc, m.roca[0][1], (y - SUELO - 5) / 5);
    g.fillStyle = cc; g.fillRect(x, y, 1, 1);
  }
  // boca del pozo
  rect(g, POZO.x, SUELO, POZO.w, 10, '#1a1014'); rect(g, POZO.x - 1, SUELO, 1, 10, '#5a4a40'); rect(g, POZO.x + POZO.w, SUELO, 1, 10, '#5a4a40');
  // camino según el transporte
  const ca = P.ca, cb = P.cb;
  if (m.trans === 'vagon' || m.trans === 'tren') { for (let x = ca - 8; x < cb + 8; x++) { px(g, x, SUELO - 1, '#6a6a74'); if (x % 3 === 0) px(g, x, SUELO, '#4a3020'); } }
  else if (m.trans === 'camion') { rect(g, ca - 10, SUELO - 1, cb - ca + 20, 2, '#4a4a50'); for (let x = ca - 8; x < cb + 8; x += 6) rect(g, x, SUELO, 3, 1, '#e8e0a0'); }
  else if (m.trans === 'llama') { for (let x = ca - 8; x < cb + 8; x++) if ((x * 7) % 5 < 3) px(g, x, SUELO, mezcla(s0, '#ffffff', 0.25)); }
  // castillete
  const k = '#2e262c', k2 = '#5a4e56';
  lin(g, 4, SUELO, 10, SUELO - 52, k); lin(g, 5, SUELO, 11, SUELO - 52, k2);
  lin(g, 26, SUELO, 20, SUELO - 52, k); lin(g, 25, SUELO, 19, SUELO - 52, k2);
  for (let j = 1; j <= 4; j++) {
    const y = SUELO - j * 12, xa = 4 + 6 * (j * 12) / 52, xb = 26 - 6 * (j * 12) / 52;
    lin(g, xa, y, xb, y, k2);
    const y2 = y + 12, xa2 = 4 + 6 * ((j - 1) * 12) / 52, xb2 = 26 - 6 * ((j - 1) * 12) / 52;
    lin(g, xa, y, xb2, y2, k); lin(g, xb, y, xa2, y2, k);
  }
  lin(g, 21, SUELO - 46, P.casa + 4, SUELO - 16, k); lin(g, 22, SUELO - 46, P.casa + 5, SUELO - 16, k2);
  rect(g, 7, SUELO - 54, 17, 2, k); rect(g, 7, SUELO - 54, 17, 1, k2);
  // casa de máquinas
  const cx = P.casa;
  for (let y = SUELO - 14; y < SUELO; y++) for (let x = cx; x < cx + 21; x++) { const ladr = ((y % 3 === 0) || ((x + (Math.floor(y / 3) % 2) * 2) % 5 === 0)) ? '#6a3428' : '#9a5040'; g.fillStyle = ladr; g.fillRect(x, y, 1, 1); }
  for (let j = 0; j < 4; j++) rect(g, cx - 1 + j, SUELO - 15 - j, 23 - j * 2, 1, j % 2 ? '#4a4048' : '#5a5058');
  rect(g, cx + 3, SUELO - 10, 5, 5, '#2a2430'); rect(g, cx + 13, SUELO - 9, 4, 9, '#3a2a20');
  // tolva
  const tx = P.tolva;
  rect(g, tx + 2, SUELO - 12, 2, 12, '#4a3c36'); rect(g, tx + 15, SUELO - 12, 2, 12, '#4a3c36');
  for (let j = 0; j < 14; j++) { const w = 19 - Math.floor(j * 12 / 14), x = tx + Math.floor((19 - w) / 2); rect(g, x, SUELO - 26 + j, w, 1, j === 0 ? '#9a8a7a' : j % 4 === 0 ? '#5a4c44' : '#6e5e54'); }
  rect(g, tx + 7, SUELO - 12, 5, 3, '#4a3c36');
  // cinta del castillete a la tolva
  lin(g, 22, SUELO - 22, tx + 1, SUELO - 27, '#3a3036'); lin(g, 22, SUELO - 21, tx + 1, SUELO - 26, '#5a4e46');
  // ingenio
  const ix = P.ing;
  rect(g, ix, SUELO - 16, 52, 16, m.pared); rect(g, ix, SUELO - 16, 52, 1, mezcla(m.pared, '#ffffff', 0.3)); rect(g, ix, SUELO - 2, 52, 2, mezcla(m.pared, '#000000', 0.25));
  rect(g, ix + 10, SUELO - 30, 34, 14, mezcla(m.pared, '#000000', 0.08));
  for (let j = 0; j < 4; j++) rect(g, ix + 8 + j, SUELO - 31 - j, 38 - j * 2, 1, j % 2 ? mezcla(m.techo, '#000000', 0.2) : m.techo);
  for (let j = 0; j < 2; j++) rect(g, ix - 1, SUELO - 17 - j, 54, 1, j ? mezcla(m.techo, '#000000', 0.2) : m.techo);
  rect(g, ix + 40, SUELO - 46, 5, 15, '#5a4a48'); rect(g, ix + 40, SUELO - 46, 5, 1, '#3a3030'); rect(g, ix + 41, SUELO - 45, 1, 14, '#7a6a66');
  const ventanas = [[ix + 14, SUELO - 12], [ix + 24, SUELO - 12], [ix + 34, SUELO - 12], [ix + 16, SUELO - 26], [ix + 30, SUELO - 26]];
  for (const [x, y] of ventanas) { rect(g, x, y, 5, 6, '#2a2028'); rect(g, x + 1, y - 1, 3, 1, '#2a2028'); rect(g, x, y + 6, 5, 1, mezcla(m.pared, '#000000', 0.3)); }
  rect(g, ix + 2, SUELO - 10, 8, 10, '#2a1a14'); rect(g, ix + 2, SUELO - 11, 8, 1, '#4a3020');
  // apacheta
  const ax = Math.round((ca + cb) / 2) + 6, ay = SUELO - 1;
  for (let j = 0; j < 6; j++) { const w = 11 - j * 2; for (let x = 0; x < w; x++) px(g, ax - Math.floor(w / 2) + x, ay - j, ((x + j) % 3 === 0) ? '#8a8a8a' : ((x * 3 + j) % 4 === 0 ? '#5a5a5e' : '#a8a4a0')); }
  px(g, ax, ay - 6, '#cfcac4');
  // torres del cablecarril
  if (m.trans === 'cable') for (const x of [ca + 2, Math.round((ca + cb) / 2) - 10, cb - 2]) { lin(g, x - 3, SUELO, x, SUELO - 26, '#4a3a30'); lin(g, x + 3, SUELO, x, SUELO - 26, '#4a3a30'); rect(g, x - 3, SUELO - 27, 7, 1, '#2e262c'); rect(g, x - 2, SUELO - 14, 5, 1, '#4a3a30'); }
  S = { cv: c, ventanas: ventanas.map(([x, y]) => ({ x: x + 2.5, y: y + 3 })), apacheta: { x: ax, y: ay - 3 } };
  _estat.set(key, S);
  return S;
}
// cable: altura del cable de ida (0) o vuelta (1) en x
function yCable(x, vuelta) {
  const P = sup(), x0 = P.tolva + 10, y0 = SUELO - 30, x1 = P.ing + 12, y1 = SUELO - 34;
  const t = clamp((x - x0) / (x1 - x0), 0, 1);
  return lerp(y0, y1, t) + Math.sin(t * Math.PI) * 6 + (vuelta ? 6 : 0);
}

// ---------- minerales ----------
const _minCv = new Map();
function dibujoMineral(def, semilla) {
  const key = def.n;
  let c = _minCv.get(key);
  if (c) return c;
  c = lienzo(24, 24);
  const g = c.getContext('2d'), r = rngSemilla(hashTxt(def.n) + (semilla || 0)), [L, M, D, A] = def.c;
  const piedra = (cx, cy, rx, ry) => { for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) { const v = (x * x) / (rx * rx) + (y * y) / (ry * ry); if (v <= 1) px(g, cx + x, cy + y, v > 0.7 ? '#4a4048' : (y < 0 ? '#8a8088' : '#6a6068')); } };
  switch (def.e) {
    case 'cristal': {
      piedra(12, 19, 9, 3);
      const pr = [[7, 18, 3, 9], [12, 19, 4, 15], [17, 18, 3, 11], [10, 19, 2, 7], [15, 19, 2, 6]];
      for (const [x, yb, w, h] of pr) {
        for (let y = 0; y < h; y++) for (let k = 0; k < w; k++) { const tope = y < 2; px(g, x - Math.floor(w / 2) + k + (tope && (k === 0 || k === w - 1) ? 0 : 0), yb - y, k === 0 ? L : k === w - 1 ? D : M); }
        px(g, x, yb - h, L); px(g, x - Math.floor(w / 2), yb - h + 1, L);
      }
      px(g, 11, 7, A); break;
    }
    case 'cubo': {
      piedra(12, 19, 9, 3);
      const cs = [[6, 13, 6], [12, 9, 7], [15, 15, 5], [8, 17, 4]];
      for (const [x, y, s] of cs) { rect(g, x, y, s, s, M); rect(g, x, y, s, 1, L); rect(g, x, y, 1, s, L); rect(g, x + s - 1, y, 1, s, D); rect(g, x, y + s - 1, s, 1, D); px(g, x + 1, y + 1, A); }
      break;
    }
    case 'banda': {
      for (let y = -9; y <= 9; y++) for (let x = -10; x <= 10; x++) {
        const v = (x * x) / 100 + (y * y) / 72;
        if (v > 1) continue;
        const b = Math.floor(Math.sqrt(v) * 7 + Math.sin(x * 0.5) * 0.6);
        px(g, 12 + x, 12 + y, v > 0.88 ? D : [L, M, A, M, L, D, M][b % 7]);
      }
      px(g, 8, 7, '#ffffff'); px(g, 9, 7, '#ffffff'); break;
    }
    case 'pepita': {
      for (let k = 0; k < 7; k++) { const cx = 12 + (r() - 0.5) * 10, cy = 13 + (r() - 0.5) * 8, rr = 3 + r() * 3; disco(g, cx, cy, rr, M); }
      for (let k = 0; k < 7; k++) { const cx = 11 + (r() - 0.5) * 8, cy = 11 + (r() - 0.5) * 6; disco(g, cx, cy, 1.5, L); }
      for (let x = 2; x < 22; x++) for (let y = 14; y < 22; y++) { const d = g.getImageData(x, y, 1, 1).data; if (d[3] && r() < 0.25) px(g, x, y, D); }
      px(g, 9, 9, A); px(g, 10, 9, A); break;
    }
    case 'alambre': {
      piedra(12, 20, 8, 2);
      let x = 12, y = 19;
      for (let k = 0; k < 40; k++) { px(g, x, y, k % 5 === 0 ? L : M); px(g, x + 1, y, D); x += Math.round(Math.cos(k * 0.6) * 1.2); y -= k % 3 === 0 ? 1 : 0; if (y < 4) break; }
      x = 8; y = 19; for (let k = 0; k < 24; k++) { px(g, x, y, M); x += Math.round(Math.sin(k * 0.8)); y -= k % 2; if (y < 8) break; }
      px(g, 12, 6, A); break;
    }
    case 'drusa': {
      for (let y = -9; y <= 9; y++) for (let x = -10; x <= 10; x++) { const v = (x * x) / 100 + (y * y) / 81; if (v <= 1) px(g, 12 + x, 12 + y, v > 0.75 ? '#6a5e60' : v > 0.6 ? '#a89ca0' : (((x + y) & 1) ? M : D)); }
      for (let k = 0; k < 18; k++) { const a = r() * 6.28, d = r() * 6; px(g, 12 + Math.cos(a) * d, 12 + Math.sin(a) * d, r() < 0.5 ? L : A); }
      break;
    }
    case 'tabla': {
      piedra(12, 20, 8, 2);
      for (let k = 0; k < 4; k++) { const x = 5 + k * 4, y = 6 + (k % 2) * 3, h = 13 - (k % 2) * 3; rect(g, x, y, 5, h, M); rect(g, x, y, 1, h, L); rect(g, x + 4, y, 1, h, D); rect(g, x, y, 5, 1, L); }
      px(g, 9, 8, A); break;
    }
    case 'gota': {
      for (let y = -9; y <= 8; y++) for (let x = -9; x <= 9; x++) { const v = (x * x) / 81 + (y * y) / (y < 0 ? 81 : 64); if (v <= 1) px(g, 12 + x, 13 + y, v > 0.85 ? D : (x < -2 && y < -2 ? L : M)); }
      px(g, 8, 8, '#ffffff'); px(g, 9, 8, '#ffffff'); px(g, 8, 9, '#ffffff');
      if (def.n === 'ÓPALO') for (let k = 0; k < 14; k++) px(g, 7 + r() * 11, 9 + r() * 9, ['#ff9ad0', '#9affd0', '#ffe08a', '#8ad0ff'][k % 4]);
      break;
    }
    case 'ambar': {
      for (let y = -9; y <= 8; y++) for (let x = -9; x <= 9; x++) { const v = (x * x) / 81 + (y * y) / 72; if (v <= 1) px(g, 12 + x, 13 + y, v > 0.85 ? D : (x < -2 && y < -2 ? L : M)); }
      rect(g, 11, 12, 3, 2, A); px(g, 10, 11, A); px(g, 14, 11, A); px(g, 10, 14, A); px(g, 14, 14, A); px(g, 12, 11, A);
      px(g, 8, 8, '#ffffff'); break;
    }
    case 'fosil': {
      for (let y = -9; y <= 9; y++) for (let x = -10; x <= 10; x++) { const v = (x * x) / 100 + (y * y) / 81; if (v <= 1) px(g, 12 + x, 12 + y, v > 0.85 ? D : M); }
      lin(g, 7, 19, 16, 5, A); for (let k = 0; k < 6; k++) { const t = k / 6, x = lerp(7, 16, t), y = lerp(19, 5, t); lin(g, x, y, x - 4, y - 1, A); lin(g, x, y, x + 3, y + 2, A); }
      break;
    }
    case 'fosil2': {
      disco(g, 12, 12, 9, M);
      for (let a = 0; a < 18; a += 0.15) { const rr = 1 + a * 0.45, x = 12 + Math.cos(a) * rr, y = 12 + Math.sin(a) * rr; if (rr < 9) px(g, x, y, D); }
      for (let a = 0; a < 6.28; a += 0.4) px(g, 12 + Math.cos(a) * 8, 12 + Math.sin(a) * 8, L);
      px(g, 9, 8, A); break;
    }
  }
  _minCv.set(key, c);
  return c;
}

// ---------- retratos de capataces ----------
const NOMBRES = {
  h: ['ERNESTO', 'RAMÓN', 'HUGO', 'TITO', 'BETO', 'LUCHO', 'POCHO', 'CACHO', 'ÑATO', 'ABEL', 'ISMAEL', 'TEÓFILO', 'WILSON', 'NELSON'],
  m: ['ROSA', 'ELVIRA', 'JUANA', 'CHELA', 'NILDA', 'OLGA', 'MIRTA', 'SARA', 'LIDIA', 'TERESA', 'YOLANDA', 'DELIA'],
  a: ['MAMANI', 'QUISPE', 'CHOQUE', 'VILTE', 'TOLABA', 'CRUZ', 'FLORES', 'CORIA', 'LEDESMA', 'SOSA', 'TAPIA', 'RÍOS', 'CONDORÍ', 'GUAYMÁS', 'LIQUÍN', 'ZERPA'],
};
function nombreCapataz(s) { const r = rngSemilla(s), mujer = r() < 0.5, l = mujer ? NOMBRES.m : NOMBRES.h; return l[Math.floor(r() * l.length)] + ' ' + NOMBRES.a[Math.floor(r() * NOMBRES.a.length)]; }
const _ret = new Map();
function retrato(s, rareza) {
  const key = s + ':' + rareza;
  let c = _ret.get(key);
  if (c) return c;
  c = lienzo(16, 16);
  const g = c.getContext('2d'), r = rngSemilla(s), mujer = r() < 0.5;
  const piel = PIELES[Math.floor(r() * PIELES.length)], som = mezcla(piel, '#4a2010', 0.35), k = '#2a1a2e';
  const fondo = ['#6a4a3a', '#3a5a8a', '#7a4aa0'][rareza];
  rect(g, 0, 0, 16, 16, fondo); rect(g, 0, 12, 16, 4, mezcla(fondo, '#000000', 0.25));
  const pelo = ['#2a1a14', '#4a2a1a', '#1a1414', '#8a8a8a', '#5a3a20'][Math.floor(r() * 5)];
  // hombros
  const ropa = ['#c84a3a', '#4a7cc0', '#4a9a5a', '#d0943a', '#8a5ac0', '#3a3a48'][Math.floor(r() * 6)];
  rect(g, 2, 13, 12, 3, ropa); rect(g, 3, 12, 10, 1, ropa); rect(g, 7, 12, 2, 2, piel);
  // cara
  rect(g, 4, 5, 8, 8, piel); rect(g, 5, 13, 6, 0, piel); rect(g, 4, 11, 1, 2, som); rect(g, 11, 11, 1, 2, som); rect(g, 5, 12, 6, 1, som);
  if (mujer) { rect(g, 3, 5, 1, 8, pelo); rect(g, 12, 5, 1, 8, pelo); if (r() < 0.6) { rect(g, 2, 9, 1, 6, pelo); rect(g, 13, 9, 1, 6, pelo); px(g, 2, 14, '#e83a6a'); px(g, 13, 14, '#e83a6a'); } }
  px(g, 6, 8, k); px(g, 9, 8, k); px(g, 5, 7, mezcla(pelo, piel, 0.3)); px(g, 10, 7, mezcla(pelo, piel, 0.3));
  if (!mujer && r() < 0.6) { rect(g, 6, 10, 4, 1, pelo); px(g, 5, 11, pelo); px(g, 10, 11, pelo); } else { rect(g, 7, 11, 2, 1, '#a04a4a'); }
  if (!mujer && r() < 0.25) rect(g, 5, 11, 6, 2, pelo);
  if (r() < 0.2) { rect(g, 5, 8, 2, 1, '#e0e8f0'); rect(g, 9, 8, 2, 1, '#e0e8f0'); px(g, 7, 8, k); px(g, 8, 8, k); }
  // gorro
  const tipo = Math.floor(r() * 4);
  if (tipo === 0 || rareza === 2) {
    const cc = rareza === 2 ? ['#ffd84a', '#c0821a'] : rareza === 1 ? ['#5aa0f0', '#2e5aa8'] : ['#f2f2f2', '#a8aebc'];
    rect(g, 4, 2, 8, 3, cc[0]); rect(g, 5, 1, 6, 1, cc[0]); rect(g, 3, 5, 10, 1, cc[1]); px(g, 6, 2, '#ffffff'); px(g, 11, 3, '#fffbe0');
  } else if (tipo === 1) {
    const cs = ['#d8344a', '#f4c542', '#3a8ae8', '#3ab06a'];
    for (let x = 4; x < 12; x++) for (let y = 1; y < 6; y++) px(g, x, y, cs[(x + y * 2) % 4]);
    rect(g, 3, 5, 1, 4, cs[0]); rect(g, 12, 5, 1, 4, cs[0]); px(g, 7, 0, cs[1]); px(g, 8, 0, cs[1]);
  } else if (tipo === 2) { rect(g, 4, 3, 8, 2, '#1a1a20'); rect(g, 5, 2, 6, 1, '#1a1a20'); px(g, 8, 1, '#1a1a20'); }
  else { rect(g, 2, 4, 12, 1, '#7a5a3a'); rect(g, 4, 1, 8, 3, '#8a6a42'); rect(g, 4, 3, 8, 1, '#4a2a1a'); }
  _ret.set(key, c);
  return c;
}
