// MANSION BUILDER — los personajes: cajas con piel pintada (64×64) y seis huesos (cuerpo, cabeza, brazos, piernas)
// medidas en píxeles de piel (1 px = 1/16 de bloque); mira hacia +z
const PJ = {
  partes: [ // [x0,y0,z0, x1,y1,z1, u0,v0, w,h,d, hueso, inflar, pivote]
    [-4, 12, -2, 4, 24, 2, 16, 16, 8, 12, 4, 0, 0, [0, 12, 0]],      // cuerpo
    [-4, 24, -4, 4, 32, 4, 0, 0, 8, 8, 8, 1, 0, [0, 24, 0]],         // cabeza
    [-4, 24, -4, 4, 32, 4, 32, 0, 8, 8, 8, 1, 0.55, [0, 24, 0]],     // casco / gorra (capa de arriba)
    [-8, 12, -2, -4, 24, 2, 40, 16, 4, 12, 4, 2, 0, [-6, 22, 0]],    // brazo derecho
    [4, 12, -2, 8, 24, 2, 32, 48, 4, 12, 4, 3, 0, [6, 22, 0]],       // brazo izquierdo
    [-4, 0, -2, 0, 12, 2, 0, 16, 4, 12, 4, 4, 0, [-2, 12, 0]],       // pierna derecha
    [0, 0, -2, 4, 12, 2, 16, 48, 4, 12, 4, 5, 0, [2, 12, 0]],        // pierna izquierda
  ],
  malla: null, pieles: [], nPieles: 0,
};
// los rectángulos de cada cara en la piel: [u, v, ancho, alto] por cara (+x, -x, +y, -y, +z, -z)
function rectsCaja(u0, v0, w, h, d) {
  return [[u0 + d + w, v0 + d, d, h], [u0, v0 + d, d, h], [u0 + d, v0, w, d], [u0 + d + w, v0, w, d], [u0 + d, v0 + d, w, h], [u0 + 2 * d + w, v0 + d, w, h]];
}
function mallaPersonaje() {
  const v = [], idx = [];
  for (const [x0, y0, z0, x1, y1, z1, u0, v0, w, h, d, hueso, inf] of PJ.partes) {
    const R = rectsCaja(u0, v0, w, h, d), a = [x0 - inf, y0 - inf, z0 - inf], b = [x1 + inf, y1 + inf, z1 + inf];
    for (let f = 0; f < 6; f++) {
      const V = CARA_V[f], n = CARA_N[f], [ru, rv, rw, rh] = R[f], base = v.length / 9;
      const uv = [[ru, rv + rh], [ru + rw, rv + rh], [ru + rw, rv], [ru, rv]];
      for (let k = 0; k < 4; k++) {
        const c = V[k];
        v.push(c[0] ? b[0] : a[0], c[1] ? b[1] : a[1], c[2] ? b[2] : a[2], n[0], n[1], n[2], uv[k][0] / 64, uv[k][1] / 64, hueso);
      }
      idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  }
  return GL.malla(new Float32Array(v), [{ k: 3, t: gl.FLOAT }, { k: 3, t: gl.FLOAT }, { k: 2, t: gl.FLOAT }, { k: 1, t: gl.FLOAT }], new Uint16Array(idx));
}
// ---------- las pieles, pintadas a mano con código ----------
const PIELES = {};
function armarPieles() {
  const defs = [];
  const tonos = ['#f2c9a0', '#e0ac7e', '#c58c5c', '#8d5a3b', '#6a4129'];
  const pelos = ['#3a2414', '#6b4423', '#1f1a17', '#c9a050', '#8a3a1e', '#d8d0c0'];
  // pinta una piel a partir de una descripción
  const pintar = (o) => {
    const N = 64, d = new Uint8Array(N * N * 4);
    const px = (x, y, c, a) => { if (x < 0 || y < 0 || x >= N || y >= N || !c) return; const rgb = hexRgb(c), k = (y * N + x) * 4; d[k] = rgb[0]; d[k + 1] = rgb[1]; d[k + 2] = rgb[2]; d[k + 3] = a == null ? 255 : a; };
    const r = rngSemilla(o.semilla || 1);
    const ruido = (c, k) => r() < k ? mezcla(c, '#000000', 0.08) : r() < k ? mezcla(c, '#ffffff', 0.08) : c;
    // recorre las caras de una parte llamando f(cara, x, y, w, h)
    const parte = (i, f) => { const p = PJ.partes[i], R = rectsCaja(p[6], p[7], p[8], p[9], p[10]); R.forEach(([ru, rv, rw, rh], cara) => { for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) { const c = f(cara, x, y, rw, rh); if (c) { if (typeof c === "string") px(ru + x, rv + y, c); else px(ru + x, rv + y, c[0], c[1]); } } }); };
    const piel = o.piel, pelo = o.pelo;
    // cabeza
    parte(1, (cara, x, y) => {
      if (cara === 2) return ruido(pelo, 0.2);
      if (cara === 3) return piel;
      if (cara === 5) return y < 6 ? ruido(pelo, 0.2) : piel;
      if (cara === 0 || cara === 1) return y < 2 || (y < 4 && (cara === 0 ? x > 4 : x < 3)) ? ruido(pelo, 0.2) : (y === 4 && (cara === 0 ? x === 4 : x === 3) ? mezcla(piel, '#000000', 0.15) : piel);
      // cara de frente
      if (y < 2) return ruido(pelo, 0.2);
      if (y === 2) return x === 0 || x === 7 ? pelo : piel;
      if (y === 3) return (x === 1 || x === 2 || x === 5 || x === 6) ? mezcla(pelo, '#000000', 0.2) : piel;
      if (y === 4) { if (o.lentes) return x >= 1 && x <= 6 ? (x === 3 || x === 4 ? '#222222' : '#111111') : piel; return x === 1 || x === 6 ? '#ffffff' : x === 2 || x === 5 ? o.ojos || '#3a2a1a' : piel; }
      if (y === 5) return x === 3 || x === 4 ? mezcla(piel, '#000000', 0.14) : piel;
      if (y === 6) return x >= 3 && x <= 4 ? '#7a3a2a' : (o.barba ? mezcla(pelo, piel, 0.3) : piel);
      return o.barba ? mezcla(pelo, piel, 0.2) : piel;
    });
    // casco, gorra o sombrero (capa de arriba, con transparencia)
    if (o.gorro) parte(2, (cara, x, y, w, h) => {
      const c = o.gorro.c, c2 = mezcla(c, '#000000', 0.22), c3 = mezcla(c, '#ffffff', 0.3);
      if (cara === 2) return x === 0 || x === w - 1 || y === 0 || y === h - 1 ? c2 : (o.gorro.tipo === 'casco' && (x === 3 || x === 4) ? c3 : c);
      if (cara === 3) return null;
      const alto = o.gorro.tipo === 'sombrero' ? 2 : 3;
      if (y < alto) return y === 0 ? c3 : (y === alto - 1 ? c2 : c);
      return null;
    });
    // cuerpo
    parte(0, (cara, x, y, w, h) => {
      if (cara === 2 || cara === 3) return o.cuerpo(cara, x, y, w, h, r);
      return o.cuerpo(cara, x, y, w, h, r);
    });
    // brazos
    for (const i of [3, 4]) parte(i, (cara, x, y, w, h) => {
      if (cara === 2) return o.manga || o.camisa;
      if (cara === 3) return o.guante || piel;
      if (y < o.largoManga) return ruido(o.manga || o.camisa, 0.15);
      if (o.guante && y >= 10) return o.guante;
      return piel;
    });
    // piernas
    for (const i of [5, 6]) parte(i, (cara, x, y, w, h) => {
      if (cara === 2) return o.pantalon;
      if (cara === 3) return mezcla(o.zapato, '#000000', 0.3);
      if (y >= 9) return y === 11 ? mezcla(o.zapato, '#000000', 0.25) : o.zapato;
      if (o.corto && y >= 4) return o.piel;
      const c = (cara === 0 || cara === 1) && x === 1 ? mezcla(o.pantalon, '#000000', 0.15) : o.pantalon;
      return ruido(c, 0.18);
    });
    return d;
  };
  // el constructor: casco amarillo, chaleco naranja con cintas, jean y botas
  defs.push(['jugador', {
    semilla: 3, piel: tonos[1], pelo: '#5a3418', ojos: '#2a3a6a',
    gorro: { c: '#f2c230', tipo: 'casco' }, camisa: '#d8d8d8', manga: '#d8d8d8', largoManga: 4, guante: '#a0682a',
    pantalon: '#3a5aa6', zapato: '#6b4423',
    cuerpo: (cara, x, y, w, h) => {
      if (y === 11) return '#5a3a20';
      if (cara === 4 || cara === 5) { if (cara === 4 && (x === 0 || x === 7) && y < 4) return '#d8d8d8'; if (y === 5 || y === 8) return '#eef2f4'; if (cara === 4 && (x === 3 || x === 4) && y > 1) return x === 3 ? '#d86a18' : '#f08a30'; return '#f07a20'; }
      if (y === 5 || y === 8) return '#eef2f4';
      return cara === 2 ? '#f07a20' : '#e8701c';
    },
  }]);
  // ayudantes: mameluco azul con tiradores y gorra roja / verde
  const ayudante = (sem, piel, pelo, gorra, camisa) => ({
    semilla: sem, piel, pelo, gorro: { c: gorra, tipo: 'gorra' }, camisa, manga: camisa, largoManga: 5, pantalon: '#2f5fb0', zapato: '#3a2a1a', barba: sem % 2 === 0,
    cuerpo: (cara, x, y) => {
      if ((cara === 4 || cara === 5) && y < 4) return (x === 1 || x === 6) ? '#2f5fb0' : camisa;
      if (y < 4) return camisa;
      if (cara === 4 && y === 5 && (x === 1 || x === 6)) return '#e8c050';
      if (cara === 4 && y >= 6 && y <= 8 && x >= 2 && x <= 5) return y === 6 ? '#24508f' : '#2a58a0';
      return '#2f5fb0';
    },
  });
  defs.push(['ayudante1', ayudante(11, tonos[2], '#2a1a10', '#d23a2a', '#e8c84a')]);
  defs.push(['ayudante2', ayudante(12, tonos[0], '#c9a050', '#3a8a3a', '#f0f0f0')]);
  defs.push(['ayudante3', ayudante(13, tonos[3], '#1f1a17', '#2a6ad2', '#e8884a')]);
  // visitantes de colores
  const camisas = ['#e05a5a', '#5aa0e0', '#f0c040', '#9a5ad0', '#4ab88a', '#f08aa8', '#ffffff', '#e08a3a'];
  for (let k = 0; k < 6; k++) {
    const rr = rngSemilla(100 + k), cam = camisas[Math.floor(rr() * camisas.length)], corto = rr() < 0.5, raya = rr() < 0.5;
    defs.push(['visitante' + (k + 1), {
      semilla: 50 + k, piel: tonos[Math.floor(rr() * tonos.length)], pelo: pelos[Math.floor(rr() * pelos.length)], lentes: rr() < 0.4,
      gorro: rr() < 0.35 ? { c: '#d8b878', tipo: 'sombrero' } : null, camisa: cam, manga: cam, largoManga: corto ? 3 : 6,
      pantalon: corto ? ['#e8dcc0', '#5a7a4a', '#3a5aa6'][Math.floor(rr() * 3)] : ['#3a5aa6', '#2a2a30', '#6a5040'][Math.floor(rr() * 3)], corto, zapato: ['#f0f0f0', '#3a2a1a', '#d23a2a'][Math.floor(rr() * 3)],
      cuerpo: (cara, x, y) => (raya && y % 3 === 0 ? mezcla(cam, '#ffffff', 0.45) : (cara === 4 && y < 2 && x > 2 && x < 5 ? mezcla(cam, '#000000', 0.2) : cam)),
    }]);
  }
  const datos = new Uint8Array(64 * 64 * 4 * defs.length);
  defs.forEach(([nom, o], i) => { datos.set(pintar(o), i * 64 * 64 * 4); PIELES[nom] = i; });
  PJ.nPieles = defs.length; PJ.datos = datos;
  return datos;
}
// ---------- huesos y animación ----------
const _mt = M4.nueva(), _mb = M4.nueva();
function poseHuesos(p, t) {
  const H = p.huesos || (p.huesos = new Float32Array(8 * 16));
  const esc = (p.escala || 0.86) / 16, f = p.fase || 0, an = p.andar || 0;
  const bob = Math.abs(Math.sin(f)) * 0.7 * an + (1 - an) * Math.sin(t * 2.2 + (p.sem || 0)) * 0.25;
  const base = M4.ident(_mb);
  M4.mover(base, p.x, (p.y != null ? p.y : SUELO) + bob * esc, p.z);
  M4.rotY(base, p.yaw || 0);
  M4.escalar(base, esc, esc, esc);
  const balanceo = Math.sin(f) * 0.75 * an;
  const ang = [
    [0, 0, 0],
    [(p.mirarAbajo || 0) + Math.sin(t * 1.3 + (p.sem || 0)) * 0.03, Math.sin(t * 0.7 + (p.sem || 0)) * 0.12 * (1 - an), 0],
    [p.carga ? -1.25 + Math.sin(f) * 0.05 * an : (p.festejo ? -2.8 : -balanceo * 0.8), 0, p.carga ? 0.18 : 0.06],
    [p.carga ? -1.25 + Math.sin(f) * 0.05 * an : (p.festejo ? -2.8 : balanceo * 0.8), 0, p.carga ? -0.18 : -0.06],
    [balanceo, 0, 0],
    [-balanceo, 0, 0],
  ];
  if (p.martillo) ang[2][0] = -1.6 + Math.sin(t * 14) * 0.7;
  for (let h = 0; h < 6; h++) {
    const piv = h === 0 ? [0, 12, 0] : PJ.partes[h === 1 ? 1 : h + 1][13];
    const m = M4.copiar(_mt, base);
    M4.mover(m, piv[0], piv[1], piv[2]);
    M4.rotY(m, ang[h][1]); M4.rotX(m, ang[h][0]); M4.rotZ(m, ang[h][2]);
    M4.mover(m, -piv[0], -piv[1], -piv[2]);
    H.set(m, h * 16);
  }
  return H;
}
function iniciarPersonajes() {
  PJ.malla = mallaPersonaje();
  const datos = PJ.datos || armarPieles();
  R.pieles = GL.texturaArreglo(64, 64, PJ.nPieles, datos, false, false);
}
