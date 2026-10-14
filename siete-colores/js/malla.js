// SIETE COLORES — mallas: el mundo en trozos de 16×64×16 (caras visibles con oclusión en las esquinas) y los muñecos de cajas
const CH = 32, NCX = SX / CH, NCZ = SZ / CH;
// por cara: normal, y las 4 esquinas en orden antihorario visto desde afuera (con sus ejes u,v para la oclusión)
const CARAS = (() => {
  const L = [];
  const defs = [[0, 1], [0, -1], [1, 1], [1, -1], [2, 1], [2, -1]];
  for (const [eje, s] of defs) {
    const u = (eje + 1) % 3, v = (eje + 2) % 3, n = [0, 0, 0]; n[eje] = s;
    let esq = [[0, 0], [1, 0], [1, 1], [0, 1]].map(([a, b]) => { const p = [0, 0, 0]; p[eje] = s > 0 ? 1 : 0; p[u] = a; p[v] = b; return { p, a, b }; });
    const c = esq.map(e => e.p), e1 = [c[1][0] - c[0][0], c[1][1] - c[0][1], c[1][2] - c[0][2]], e2 = [c[2][0] - c[0][0], c[2][1] - c[0][1], c[2][2] - c[0][2]];
    const cr = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
    if (cr[0] * n[0] + cr[1] * n[1] + cr[2] * n[2] < 0) esq = [esq[0], esq[3], esq[2], esq[1]];
    const U = [0, 0, 0], V = [0, 0, 0]; U[u] = 1; V[v] = 1;
    L.push({ n, u, v, esq, U, V });
  }
  return L;
})();
// búfer de armado reutilizable
let _mv = new Uint8Array(8 * 65536), _mi = new Uint32Array(6 * 16384);
function _crecer(nv, ni) {
  if (nv * 8 > _mv.length) { const a = new Uint8Array(Math.max(nv * 8, _mv.length * 2)); a.set(_mv); _mv = a; }
  if (ni > _mi.length) { const a = new Uint32Array(Math.max(ni, _mi.length * 2)); a.set(_mi); _mi = a; }
}
const transp = b => b === 0 || b === B.AGUA;
// arma la malla de un trozo: devuelve { v (Uint8Array), i (Uint32Array), va, ia } para lo sólido y el agua
function mallaTrozo(cx, cz) {
  const out = {};
  for (const agua of [false, true]) {
    let nv = 0, ni = 0;
    const x0 = cx * CH, z0 = cz * CH;
    let ymin = SY, ymax = 0;
    for (let z = z0; z < z0 + CH; z++) for (let x = x0; x < x0 + CH; x++) {
      const base = (z * SX + x) * SY;
      for (let y = 0; y < SY; y++) {
        const b = VOX[base + y];
        if (b === 0 || (b === B.AGUA) !== agua) continue;
        for (let f = 0; f < 6; f++) {
          const C = CARAS[f], n = C.n, nx = x + n[0], ny = y + n[1], nz = z + n[2];
          let nb;
          if (nx < 0 || nz < 0 || nx >= SX || nz >= SZ) nb = agua ? 0 : B.PIEDRA; else if (ny < 0) nb = B.PIEDRA; else if (ny >= SY) nb = 0; else nb = VOX[(nz * SX + nx) * SY + ny];
          if (agua ? nb !== 0 : !transp(nb)) continue;
          if (agua && f !== 2 && SOLIDO[bloque(nx, ny - 1, nz)] === 0) continue;   // costados del agua solo sobre algo
          _crecer(nv + 4, ni + 6);
          const ao = [3, 3, 3, 3];
          if (!agua) {
            const U = C.U, V = C.V;
            for (let k = 0; k < 4; k++) {
              const e = C.esq[k], du = e.a ? 1 : -1, dv = e.b ? 1 : -1;
              const s1 = solido(nx + U[0] * du, ny + U[1] * du, nz + U[2] * du) ? 1 : 0, s2 = solido(nx + V[0] * dv, ny + V[1] * dv, nz + V[2] * dv) ? 1 : 0;
              const s3 = solido(nx + U[0] * du + V[0] * dv, ny + U[1] * du + V[1] * dv, nz + U[2] * du + V[2] * dv) ? 1 : 0;
              ao[k] = s1 && s2 ? 0 : 3 - (s1 + s2 + s3);
            }
          }
          for (let k = 0; k < 4; k++) {
            const p = C.esq[k].p, o = (nv + k) * 8;
            _mv[o] = x - x0 + p[0]; _mv[o + 1] = y + p[1]; _mv[o + 2] = z - z0 + p[2]; _mv[o + 3] = 0;
            _mv[o + 4] = b; _mv[o + 5] = f; _mv[o + 6] = ao[k]; _mv[o + 7] = agua && f === 2 ? 1 : 0;
          }
          if (ao[0] + ao[2] < ao[1] + ao[3]) { _mi[ni] = nv; _mi[ni + 1] = nv + 1; _mi[ni + 2] = nv + 3; _mi[ni + 3] = nv + 1; _mi[ni + 4] = nv + 2; _mi[ni + 5] = nv + 3; }
          else { _mi[ni] = nv; _mi[ni + 1] = nv + 1; _mi[ni + 2] = nv + 2; _mi[ni + 3] = nv; _mi[ni + 4] = nv + 2; _mi[ni + 5] = nv + 3; }
          nv += 4; ni += 6;
          if (y < ymin) ymin = y; if (y > ymax) ymax = y;
        }
      }
    }
    out[agua ? 'agua' : 'solido'] = { v: _mv.slice(0, nv * 8), i: _mi.slice(0, ni), ymin, ymax: ymax + 1 };
  }
  return out;
}

// ---------- muñecos de cajas ----------
// pieza: { c: [x,y,z] centro, t: [w,h,d] tamaño, col: '#hex' o {arriba,lado,frente,abajo}, parte: n }
// vértice: posición float32 ×3, normal int8 ×3 + pad, color u8 ×3 + parte → 20 bytes
function mallaCajas(piezas) {
  const nv = piezas.length * 24, buf = new ArrayBuffer(nv * 20), f32 = new Float32Array(buf), i8 = new Int8Array(buf), u8 = new Uint8Array(buf);
  const idx = new Uint16Array(piezas.length * 36);
  let v = 0, ii = 0;
  for (const pz of piezas) {
    const [cx, cy, cz] = pz.c, [w, h, d] = pz.t;
    for (let f = 0; f < 6; f++) {
      const C = CARAS[f];
      const colH = typeof pz.col === 'string' ? pz.col : (f === 2 ? pz.col.arriba : f === 3 ? pz.col.abajo || pz.col.lado : f === 4 ? pz.col.frente || pz.col.lado : f === 5 ? pz.col.atras || pz.col.lado : pz.col.lado);
      const col = hexRgb(colH), sombreo = f === 3 ? 0.85 : 1;
      for (let k = 0; k < 4; k++) {
        const p = C.esq[k].p, o = v * 5;
        f32[o] = cx + (p[0] - 0.5) * w; f32[o + 1] = cy + (p[1] - 0.5) * h; f32[o + 2] = cz + (p[2] - 0.5) * d;
        const bo = v * 20 + 12;
        i8[bo] = C.n[0] * 127; i8[bo + 1] = C.n[1] * 127; i8[bo + 2] = C.n[2] * 127; i8[bo + 3] = 0;
        u8[bo + 4] = col[0] * sombreo; u8[bo + 5] = col[1] * sombreo; u8[bo + 6] = col[2] * sombreo; u8[bo + 7] = pz.parte || 0;
        v++;
      }
      const b0 = v - 4;
      idx[ii++] = b0; idx[ii++] = b0 + 1; idx[ii++] = b0 + 2; idx[ii++] = b0; idx[ii++] = b0 + 2; idx[ii++] = b0 + 3;
    }
  }
  return { buf, idx, n: ii };
}
