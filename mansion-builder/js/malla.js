// MANSION BUILDER — el mallado de los trozos: solo las caras que se ven, con sombra de esquina (AO) y losas
// vértice de 12 bytes: x,y,z (int16, en 1/16 de bloque) · u,v (texel) · capa · cara · ao/hondura · banderas
// banderas: 1 se mece (plantas) · 2 brilla · 4 orilla (espuma) · 8 superficie del agua
const CARA_N = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const CARA_V = [ // esquinas en orden antihorario visto de afuera: abajo-izq, abajo-der, arriba-der, arriba-izq
  [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]],
  [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]],
  [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]],
  [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]],
  [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]],
  [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]],
];
const CARA_UV = [[0, 16], [16, 16], [16, 0], [0, 0]];
// un armador de malla que crece solo (uno por pasada, reusado entre trozos)
class Armador {
  constructor(nq) { this.cap = 0; this.nv = 0; this.ni = 0; this.reservar(nq); }
  reservar(nq) {
    if (this.cap >= nq) return;
    this.cap = nq; this.v = new ArrayBuffer(nq * 4 * 12); this.i16 = new Int16Array(this.v); this.u8 = new Uint8Array(this.v); this.idx = new Uint32Array(nq * 6);
  }
  empezar() { this.nv = 0; this.ni = 0; }
  vert(x, y, z, u, v, capa, cara, ao, fl) {
    const k = this.nv * 12;
    if (k + 12 > this.v.byteLength) this.crecer();
    const s = k >> 1; this.i16[s] = Math.round(x * 16); this.i16[s + 1] = Math.round(y * 16); this.i16[s + 2] = Math.round(z * 16);
    const u8 = this.u8; u8[k + 6] = u; u8[k + 7] = v; u8[k + 8] = capa; u8[k + 9] = cara; u8[k + 10] = ao; u8[k + 11] = fl;
    return this.nv++;
  }
  crecer() { const viejo = this.u8, vi = this.idx, nq = this.cap * 2; this.cap = 0; this.reservar(nq); this.u8.set(viejo); this.idx.set(vi); }
  quad(a, b, c, d, girar) {
    if (this.ni + 6 > this.idx.length) this.crecer();
    const I = this.idx, n = this.ni;
    if (girar) { I[n] = b; I[n + 1] = c; I[n + 2] = d; I[n + 3] = b; I[n + 4] = d; I[n + 5] = a; }
    else { I[n] = a; I[n + 1] = b; I[n + 2] = c; I[n + 3] = a; I[n + 4] = c; I[n + 5] = d; }
    this.ni += 6;
  }
  sacar() { return this.ni ? { v: this.u8.slice(0, this.nv * 12), i: this.idx.slice(0, this.ni) } : null; }
}
const Malla = new Armador(1 << 14);
const PASADAS = { op: new Armador(1 << 14), cruz: new Armador(1 << 11), agua: new Armador(1 << 11), vidrio: new Armador(1 << 11) };
// sombra de esquina para el vértice (cx, cy, cz ∈ {0,1}) de la cara f del bloque (x,y,z)
function aoVert(op, x, y, z, f, cx, cy, cz) {
  const n = CARA_N[f], bx = x + n[0], by = y + n[1], bz = z + n[2];
  let d1x = 0, d1y = 0, d1z = 0, d2x = 0, d2y = 0, d2z = 0;
  if (n[0]) { d1y = cy ? 1 : -1; d2z = cz ? 1 : -1; } else if (n[1]) { d1x = cx ? 1 : -1; d2z = cz ? 1 : -1; } else { d1x = cx ? 1 : -1; d2y = cy ? 1 : -1; }
  const s1 = op(bx + d1x, by + d1y, bz + d1z) ? 1 : 0, s2 = op(bx + d2x, by + d2y, bz + d2z) ? 1 : 0;
  const c = op(bx + d1x + d2x, by + d1y + d2y, bz + d1z + d2z) ? 1 : 0;
  return s1 && s2 ? 0 : 3 - (s1 + s2 + c);
}
// una cara de bloque entero (o de losa con alto h)
function caraBloque(M, op, x, y, z, f, capa, fl, h, conAO) {
  const V = CARA_V[f], ao = [3, 3, 3, 3], idx = [0, 0, 0, 0];
  for (let k = 0; k < 4; k++) {
    const c = V[k];
    if (conAO) ao[k] = aoVert(op, x, y, z, f, c[0], c[1], c[2]);
    let vy = c[1], vv = CARA_UV[k][1];
    if (h < 1) { if (f === 2) vy = h; else if (f !== 3) { if (c[1] === 1) vy = h; vv = c[1] === 1 ? 16 - Math.round(h * 16) : 16; } }
    idx[k] = M.vert(x + c[0], y + vy, z + c[2], CARA_UV[k][0], vv, capa, f, ao[k], fl);
  }
  M.quad(idx[0], idx[1], idx[2], idx[3], ao[0] + ao[2] < ao[1] + ao[3]);
}
// planta en cruz: dos cuadros diagonales (se dibujan sin descarte de caras)
function caraCruz(M, x, y, z, capa, fl) {
  const s = 0.15, a = [[s, s, 1 - s, 1 - s], [s, 1 - s, 1 - s, s]];
  for (const [x0, z0, x1, z1] of a) {
    const i0 = M.vert(x + x0, y, z + z0, 0, 16, capa, 6, 3, fl & ~1), i1 = M.vert(x + x1, y, z + z1, 16, 16, capa, 6, 3, fl & ~1);
    const i2 = M.vert(x + x1, y + 1, z + z1, 16, 0, capa, 6, 3, fl | 1), i3 = M.vert(x + x0, y + 1, z + z0, 0, 0, capa, 6, 3, fl | 1);
    M.quad(i0, i1, i2, i3, false);
  }
}
const _op = (x, y, z) => Mundo.opaco(x, y, z);
// arma las cuatro mallas de un trozo (opaca, plantas, agua y vidrio) en una sola pasada
function mallarTrozo(cx, cz) {
  const T = PASADAS; T.op.empezar(); T.cruz.empezar(); T.agua.empezar(); T.vidrio.empezar();
  const x0 = cx * CH, z0 = cz * CH, x1 = Math.min(MX, x0 + CH), z1 = Math.min(MZ, z0 + CH);
  const b = Mundo.b, yTop = Math.min(MY, Mundo.altoT[cx + cz * NCX] + 1);
  for (let y = 0; y < yTop; y++) for (let z = z0; z < z1; z++) {
    let i = (y * MZ + z) * MX + x0;
    for (let x = x0; x < x1; x++, i++) {
      const v = b[i]; if (!v) continue;
      const P = BLOQ[v];
      if (P.c) { caraCruz(T.cruz, x, y, z, P.f[0], 0); continue; }
      if (P.a) { aguaCaras(T.agua, x, y, z, P); continue; }
      const M = P.t ? T.vidrio : T.op, fl = P.e ? 2 : 0, h = P.l ? 0.5 : 1, conAO = !P.t && !P.l;
      for (let f = 0; f < 6; f++) {
        const n = CARA_N[f], w = Mundo.get(x + n[0], y + n[1], z + n[2]);
        if (w) {
          const Q = BLOQ[w];
          if (Q.o && !(P.l && f === 2)) continue;
          if (P.t && w === v) continue;
          if (P.l && Q.l && f !== 2 && f !== 3) continue;
        } else if (y + n[1] < 0) continue;
        caraBloque(M, _op, x, y, z, f, f === 2 ? P.f[0] : f === 3 ? P.f[2] : f === 4 ? P.f[3] : P.f[1], fl, h, conAO);
      }
    }
  }
  return { op: T.op.sacar(), cruz: T.cruz.sacar(), agua: T.agua.sacar(), vidrio: T.vidrio.sacar() };
}
// el agua: solo la superficie (un poco más baja); hondura y espuma de orilla en el vértice
function aguaCaras(M, x, y, z, P) {
  const arriba = Mundo.get(x, y + 1, z);
  if (arriba === B.AGUA || (arriba && BLOQ[arriba].o)) return;
  let hondo = 0; for (let k = 1; k <= 3 && Mundo.get(x, y - k, z) === B.AGUA; k++) hondo++;
  let orilla = 0;
  for (let dz = -1; dz <= 1 && !orilla; dz++) for (let dx = -1; dx <= 1; dx++) { const w = Mundo.get(x + dx, y, z + dz); if (w && w !== B.AGUA && Mundo.dentro(x + dx, y, z + dz)) { orilla = 4; break; } }
  const h = arriba ? 1 : 0.875, V = CARA_V[2], idx = [];
  for (let k = 0; k < 4; k++) idx.push(M.vert(x + V[k][0], y + h, z + V[k][2], CARA_UV[k][0], CARA_UV[k][1], P.f[0], 2, hondo, 8 | orilla));
  M.quad(idx[0], idx[1], idx[2], idx[3], false);
}
// una malla suelta para un conjunto de bloques (el plano fantasma de la obra): caras hacia afuera del conjunto
function mallarConjunto(lista, ocupa) {
  const M = Malla; M.empezar();
  for (const [x, y, z, v] of lista) {
    const P = BLOQ[v];
    for (let f = 0; f < 6; f++) {
      const n = CARA_N[f];
      if (ocupa(x + n[0], y + n[1], z + n[2])) continue;
      caraBloque(M, null, x, y, z, f, P.f[f === 2 ? 0 : f === 3 ? 2 : 1], 0, P.l ? 0.5 : 1, false);
    }
  }
  return M.sacar();
}
