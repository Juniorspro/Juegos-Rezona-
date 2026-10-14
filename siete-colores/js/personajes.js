// SIETE COLORES — muñecos de cajas con piezas articuladas y poses (Killa, la gente de la quebrada, el Pujllay, vicuñas y llamas)
// Una figura: lista de piezas { nombre, padre, piv:[x,y,z] (respecto del padre), cajas:[{c,t,col}] }. Mira hacia +z.
const FIGURAS = {};
function persona(o) {
  const piel = o.piel || '#c8946a', pelo = o.pelo || '#2a1a14', ropa = o.ropa || '#e8e0d0', pant = o.pant || '#3a3040', esc = o.esc || 1;
  const P = [];
  const k = esc;
  P.push({ nombre: 'raiz', padre: -1, piv: [0, 0, 0], cajas: [] });
  P.push({ nombre: 'torso', padre: 0, piv: [0, 0.5 * k, 0], cajas: [{ c: [0, 0.22 * k, 0], t: [0.34 * k, 0.46 * k, 0.22 * k], col: ropa }] });
  const cab = [{ c: [0, 0.16 * k, 0], t: [0.32 * k, 0.32 * k, 0.3 * k], col: piel },
    { c: [0.075 * k, 0.15 * k, 0.152 * k], t: [0.05 * k, 0.07 * k, 0.012], col: '#1a1218' }, { c: [-0.075 * k, 0.15 * k, 0.152 * k], t: [0.05 * k, 0.07 * k, 0.012], col: '#1a1218' },
    { c: [0.075 * k, 0.168 * k, 0.153 * k], t: [0.02 * k, 0.02 * k, 0.012], col: '#ffffff' }, { c: [-0.075 * k, 0.168 * k, 0.153 * k], t: [0.02 * k, 0.02 * k, 0.012], col: '#ffffff' },
    { c: [0, 0.07 * k, 0.152 * k], t: [0.08 * k, 0.025 * k, 0.012], col: o.boca || '#8a4a3a' }];
  if (o.mejillas) cab.push({ c: [0.11 * k, 0.1 * k, 0.151 * k], t: [0.05 * k, 0.03 * k, 0.012], col: '#e88a7a' }, { c: [-0.11 * k, 0.1 * k, 0.151 * k], t: [0.05 * k, 0.03 * k, 0.012], col: '#e88a7a' });
  // pelo
  cab.push({ c: [0, 0.3 * k, -0.01 * k], t: [0.34 * k, 0.07 * k, 0.32 * k], col: pelo }, { c: [0, 0.18 * k, -0.135 * k], t: [0.34 * k, 0.3 * k, 0.06 * k], col: pelo },
    { c: [0.158 * k, 0.2 * k, -0.04 * k], t: [0.03 * k, 0.18 * k, 0.24 * k], col: pelo }, { c: [-0.158 * k, 0.2 * k, -0.04 * k], t: [0.03 * k, 0.18 * k, 0.24 * k], col: pelo });
  if (o.barba) cab.push({ c: [0, 0.04 * k, 0.13 * k], t: [0.3 * k, 0.1 * k, 0.07 * k], col: o.barba });
  if (o.bigote) cab.push({ c: [0, 0.095 * k, 0.155 * k], t: [0.14 * k, 0.03 * k, 0.02], col: o.bigote });
  // sombreros
  if (o.sombrero === 'chullo') {
    const cs = o.chulloCol || ['#d03a2e', '#f0c040', '#2a8a5a', '#e8e0d0'];
    cab.push({ c: [0, 0.34 * k, 0], t: [0.35 * k, 0.1 * k, 0.33 * k], col: cs[0] }, { c: [0, 0.4 * k, 0], t: [0.31 * k, 0.06 * k, 0.29 * k], col: cs[1] },
      { c: [0, 0.45 * k, 0], t: [0.24 * k, 0.05 * k, 0.22 * k], col: cs[2] }, { c: [0, 0.5 * k, 0], t: [0.08 * k, 0.07 * k, 0.08 * k], col: cs[3] },
      { c: [0.17 * k, 0.15 * k, 0], t: [0.04 * k, 0.2 * k, 0.12 * k], col: cs[0] }, { c: [-0.17 * k, 0.15 * k, 0], t: [0.04 * k, 0.2 * k, 0.12 * k], col: cs[0] },
      { c: [0.17 * k, 0.03 * k, 0], t: [0.025 * k, 0.08 * k, 0.025 * k], col: cs[1] }, { c: [-0.17 * k, 0.03 * k, 0], t: [0.025 * k, 0.08 * k, 0.025 * k], col: cs[1] });
  } else if (o.sombrero === 'ala') {
    const sc = o.sombCol || '#4a3a2e';
    cab.push({ c: [0, 0.33 * k, 0], t: [0.56 * k, 0.03 * k, 0.54 * k], col: sc }, { c: [0, 0.41 * k, 0], t: [0.32 * k, 0.14 * k, 0.3 * k], col: sc }, { c: [0, 0.36 * k, 0], t: [0.33 * k, 0.04 * k, 0.31 * k], col: o.cinta || '#c8382a' });
  } else if (o.sombrero === 'bombin') {
    cab.push({ c: [0, 0.33 * k, 0], t: [0.42 * k, 0.03 * k, 0.4 * k], col: '#2a2228' }, { c: [0, 0.42 * k, 0], t: [0.26 * k, 0.16 * k, 0.24 * k], col: '#2a2228' });
  }
  if (o.trenzas) for (const s of [1, -1]) cab.push({ c: [s * 0.1 * k, -0.05 * k, -0.14 * k], t: [0.07 * k, 0.32 * k, 0.07 * k], col: pelo }, { c: [s * 0.1 * k, -0.22 * k, -0.14 * k], t: [0.08 * k, 0.04 * k, 0.08 * k], col: o.lazo || '#e04a8a' });
  P.push({ nombre: 'cabeza', padre: 1, piv: [0, 0.46 * k, 0], cajas: cab });
  const brazoCol = o.poncho ? o.poncho[0] : o.mangas || ropa;
  P.push({ nombre: 'brazoI', padre: 1, piv: [0.22 * k, 0.4 * k, 0], cajas: [{ c: [0.01 * k, -0.15 * k, 0], t: [0.11 * k, 0.32 * k, 0.12 * k], col: brazoCol }, { c: [0.01 * k, -0.34 * k, 0], t: [0.09 * k, 0.08 * k, 0.1 * k], col: piel }] });
  P.push({ nombre: 'brazoD', padre: 1, piv: [-0.22 * k, 0.4 * k, 0], cajas: [{ c: [-0.01 * k, -0.15 * k, 0], t: [0.11 * k, 0.32 * k, 0.12 * k], col: brazoCol }, { c: [-0.01 * k, -0.34 * k, 0], t: [0.09 * k, 0.08 * k, 0.1 * k], col: piel }] });
  const zap = o.zapatos || '#5a3a2a';
  P.push({ nombre: 'piernaI', padre: 0, piv: [0.085 * k, 0.5 * k, 0], cajas: [{ c: [0, -0.22 * k, 0], t: [0.14 * k, 0.44 * k, 0.15 * k], col: pant }, { c: [0, -0.46 * k, 0.025 * k], t: [0.15 * k, 0.07 * k, 0.21 * k], col: zap }] });
  P.push({ nombre: 'piernaD', padre: 0, piv: [-0.085 * k, 0.5 * k, 0], cajas: [{ c: [0, -0.22 * k, 0], t: [0.14 * k, 0.44 * k, 0.15 * k], col: pant }, { c: [0, -0.46 * k, 0.025 * k], t: [0.15 * k, 0.07 * k, 0.21 * k], col: zap }] });
  // poncho: una caja sobre el torso con franjas; al planear se abre como alas
  const pon = [];
  if (o.poncho) {
    const [c0, c1, c2] = o.poncho;
    pon.push({ c: [0, 0.27 * k, 0], t: [0.52 * k, 0.36 * k, 0.3 * k], col: c0 });
    for (const x of [-0.17, 0.17]) { pon.push({ c: [x * k, 0.27 * k, 0], t: [0.035 * k, 0.362 * k, 0.304 * k], col: c1 }); pon.push({ c: [(x * 1.25) * k, 0.27 * k, 0], t: [0.02 * k, 0.364 * k, 0.306 * k], col: c2 }); }
    pon.push({ c: [0, 0.1 * k, 0], t: [0.53 * k, 0.03 * k, 0.31 * k], col: c1 });
    pon.push({ c: [0, 0.44 * k, 0], t: [0.2 * k, 0.04 * k, 0.2 * k], col: c2 });
  }
  if (o.pollera) pon.push({ c: [0, -0.06 * k, 0], t: [0.42 * k, 0.32 * k, 0.32 * k], col: o.pollera }, { c: [0, -0.2 * k, 0], t: [0.43 * k, 0.04 * k, 0.33 * k], col: o.polleraBorde || '#f0c040' });
  if (o.manta) pon.push({ c: [0, 0.32 * k, -0.06 * k], t: [0.44 * k, 0.3 * k, 0.16 * k], col: o.manta }, { c: [0, 0.32 * k, -0.06 * k], t: [0.446 * k, 0.05 * k, 0.166 * k], col: o.mantaFranja || '#f0c040' });
  if (o.extra) pon.push(...o.extra(k));
  P.push({ nombre: 'poncho', padre: 1, piv: [0, 0, 0], cajas: pon });
  return P;
}
function cuadrupedo(o) {
  const c = o.col || '#c89a5a', v = o.vientre || '#f0e6d4', k = o.esc || 1;
  const P = [{ nombre: 'raiz', padre: -1, piv: [0, 0, 0], cajas: [] }];
  P.push({ nombre: 'cuerpo', padre: 0, piv: [0, 0.78 * k, 0], cajas: [{ c: [0, 0, 0], t: [0.36 * k, 0.34 * k, 0.86 * k], col: c }, { c: [0, -0.15 * k, 0], t: [0.3 * k, 0.06 * k, 0.7 * k], col: v }] });
  const cab = [{ c: [0, 0.08 * k, 0.1 * k], t: [0.2 * k, 0.2 * k, 0.32 * k], col: c }, { c: [0, 0.02 * k, 0.27 * k], t: [0.15 * k, 0.12 * k, 0.08 * k], col: v },
    { c: [0.105 * k, 0.12 * k, 0.12 * k], t: [0.012, 0.05 * k, 0.05 * k], col: '#1a1218' }, { c: [-0.105 * k, 0.12 * k, 0.12 * k], t: [0.012, 0.05 * k, 0.05 * k], col: '#1a1218' },
    { c: [0.07 * k, 0.26 * k, 0.02 * k], t: [0.05 * k, 0.14 * k, 0.04 * k], col: c }, { c: [-0.07 * k, 0.26 * k, 0.02 * k], t: [0.05 * k, 0.14 * k, 0.04 * k], col: c }];
  if (o.borlas) cab.push({ c: [0.07 * k, 0.35 * k, 0.02 * k], t: [0.07 * k, 0.06 * k, 0.07 * k], col: o.borlas[0] }, { c: [-0.07 * k, 0.35 * k, 0.02 * k], t: [0.07 * k, 0.06 * k, 0.07 * k], col: o.borlas[1] });
  P.push({ nombre: 'cuello', padre: 1, piv: [0, 0.1 * k, 0.36 * k], cajas: [{ c: [0, 0.26 * k, 0.02 * k], t: [0.16 * k, 0.56 * k, 0.16 * k], col: c }, { c: [0, 0.22 * k, 0.09 * k], t: [0.12 * k, 0.46 * k, 0.03 * k], col: v }] });
  P.push({ nombre: 'cabeza', padre: 2, piv: [0, 0.54 * k, 0.03 * k], cajas: cab });
  for (const [n, x, z] of [['pataDI', 0.12, 0.32], ['pataDD', -0.12, 0.32], ['pataTI', 0.12, -0.32], ['pataTD', -0.12, -0.32]])
    P.push({ nombre: n, padre: 0, piv: [x * k, 0.66 * k, z * k], cajas: [{ c: [0, -0.31 * k, 0], t: [0.09 * k, 0.64 * k, 0.1 * k], col: c }, { c: [0, -0.62 * k, 0.01 * k], t: [0.1 * k, 0.05 * k, 0.12 * k], col: '#3a2a20' }] });
  P.push({ nombre: 'cola', padre: 1, piv: [0, 0.1 * k, -0.43 * k], cajas: [{ c: [0, -0.04 * k, -0.04 * k], t: [0.1 * k, 0.16 * k, 0.1 * k], col: c }] });
  if (o.manta) P[1].cajas.push({ c: [0, 0.18 * k, 0], t: [0.38 * k, 0.04 * k, 0.4 * k], col: o.manta });
  return P;
}
// arma la malla (una sola por figura) y recuerda el índice de cada pieza
function registrarFigura(id, piezas) {
  const cajas = [];
  piezas.forEach((p, i) => { for (const c of p.cajas) cajas.push({ c: c.c, t: c.t, col: c.col, parte: i }); });
  const indice = {}; piezas.forEach((p, i) => { indice[p.nombre] = i; });
  FIGURAS[id] = { piezas, indice, malla: R.listo ? R.subirMuneco(mallaCajas(cajas)) : null, cajas };
}
function armarFiguras() {
  registrarFigura('killa', persona({ piel: '#c48a60', pelo: '#1e1410', ropa: '#f0e8dc', pant: '#4a3a5a', poncho: ['#d23a2c', '#f2c440', '#2a8a5a'], sombrero: 'chullo', trenzas: true, mejillas: true, esc: 0.86, lazo: '#f0c440' }));
  registrarFigura('abuela', persona({ piel: '#b07a52', pelo: '#d8d0c8', ropa: '#7a3a6a', pant: '#3a2a2a', pollera: '#3a5a8a', polleraBorde: '#f0c040', manta: '#c84a3a', mantaFranja: '#2a8a5a', sombrero: 'bombin', trenzas: true, lazo: '#c84a3a', mangas: '#7a3a6a', esc: 0.92 }));
  registrarFigura('arriero', persona({ piel: '#a8724a', pelo: '#2a1a14', ropa: '#e8e0d0', pant: '#5a4a3a', poncho: ['#8a2a20', '#2a2a2a', '#e8c040'], sombrero: 'ala', sombCol: '#3a2a20', bigote: '#2a1a14' }));
  registrarFigura('fermin', persona({ piel: '#a06a48', pelo: '#e0dcd8', ropa: '#5a6a8a', pant: '#3a3a4a', poncho: ['#3a4a7a', '#e8e0d0', '#c84a3a'], sombrero: 'ala', sombCol: '#e8e0d0', cinta: '#2a2a2a', barba: '#e8e4e0' }));
  registrarFigura('coquena', persona({ piel: '#a8744e', pelo: '#f4f0ec', ropa: '#e8dcc4', pant: '#d8c8a8', poncho: ['#f0e6d0', '#c8a878', '#8a6a48'], sombrero: 'ala', sombCol: '#f4f0e8', cinta: '#c8a878', barba: '#f4f0ec', esc: 0.7 }));
  registrarFigura('tito', persona({ piel: '#c08a62', pelo: '#3a2a1a', ropa: '#3a4a6a', pant: '#2a3448', mangas: '#3a4a6a', sombrero: 'bombin', bigote: '#2a1a14', extra: k => [{ c: [0, 0.3 * k, 0.115 * k], t: [0.3 * k, 0.04 * k, 0.012], col: '#e8c040' }] }));
  registrarFigura('nina', persona({ piel: '#b88058', pelo: '#2a1a14', ropa: '#e86a8a', pant: '#2a2a3a', pollera: '#8a3a9a', polleraBorde: '#f0e8dc', sombrero: 'ala', sombCol: '#f0ece4', cinta: '#e86a8a', trenzas: true, lazo: '#e86a8a', esc: 0.95 }));
  // los chicos de las escondidas
  const chicos = [['tomas', '#3a7ac8', '#e8c040'], ['lucia', '#e8603a', '#3aa060'], ['pedro', '#6aa83a', '#c83a6a'], ['rosa', '#c84ac0', '#40b0c0']];
  for (const [id, a, b] of chicos) registrarFigura(id, persona({ piel: '#c48a60', pelo: '#2a1a14', ropa: a, pant: '#3a3a4a', sombrero: id === 'lucia' || id === 'rosa' ? null : 'chullo', chulloCol: [a, b, '#e8e0d0', b], trenzas: id === 'lucia' || id === 'rosa', lazo: b, mejillas: true, esc: 0.72 }));
  // el Pujllay: traje de retazos con espejitos, cascabeles y un tocado de cintas
  const pjP = persona({
    piel: '#e8c8a8', pelo: '#2a1a14', ropa: '#e83a8a', pant: '#3a2a8a', mangas: '#f0c040', boca: '#c8282a', esc: 1.02, zapatos: '#e8c040',
    extra: k => {
      const L = [], cols = ['#e83a3a', '#f08a2a', '#f0d040', '#3ab060', '#2ab0c0', '#7a4ad0', '#f08ab0'];
      for (let i = 0; i < 7; i++) L.push({ c: [(-0.21 + i * 0.07) * k, 0.38 * k, 0.12 * k], t: [0.07 * k, 0.12 * k, 0.012], col: cols[i] });
      for (let i = 0; i < 7; i++) L.push({ c: [(-0.21 + i * 0.07) * k, 0.12 * k, 0.12 * k], t: [0.07 * k, 0.1 * k, 0.012], col: cols[6 - i] });
      L.push({ c: [0.1 * k, 0.25 * k, 0.122 * k], t: [0.06 * k, 0.06 * k, 0.012], col: '#f8f8ff' }, { c: [-0.1 * k, 0.25 * k, 0.122 * k], t: [0.06 * k, 0.06 * k, 0.012], col: '#f8f8ff' });
      L.push({ c: [0, 0.0, 0], t: [0.4 * k, 0.05 * k, 0.26 * k], col: '#f0c040' });
      return L;
    },
  });
  // tocado de cintas de colores y antifaz
  const cab = pjP.find(p => p.nombre === 'cabeza');
  ['#e83a3a', '#f08a2a', '#f0d040', '#3ab060', '#2ab0c0', '#7a4ad0', '#f08ab0'].forEach((c, i) => cab.cajas.push({ c: [(-0.15 + i * 0.05), 0.42 + Math.sin(i) * 0.04, -0.02], t: [0.045, 0.22, 0.045], col: c }));
  cab.cajas.push({ c: [0, 0.32, 0], t: [0.38, 0.08, 0.36], col: '#f0c040' }, { c: [0, 0.16, 0.156], t: [0.3, 0.1, 0.012], col: '#2a1a14' });
  registrarFigura('pujllay', pjP);
  registrarFigura('vicuna', cuadrupedo({ col: '#c8945a', vientre: '#f4ece0', esc: 0.85 }));
  registrarFigura('vicunaBlanca', cuadrupedo({ col: '#f4f0e8', vientre: '#ffffff', esc: 0.9 }));
  registrarFigura('llama', cuadrupedo({ col: '#f0e8dc', vientre: '#ffffff', borlas: ['#e83a6a', '#f0c040'], manta: '#c84a3a', esc: 1.05 }));
  registrarFigura('llamaMarron', cuadrupedo({ col: '#7a5236', vientre: '#c8a888', borlas: ['#3ab060', '#e8603a'], esc: 1.0 }));
  registrarFigura('mula', cuadrupedo({ col: '#5a4232', vientre: '#8a7262', esc: 1.15, manta: '#3a5a8a' }));
}

// ---------- instancias y poses ----------
// pose: rotaciones por pieza {nombre: [rx, ry, rz]} + escala de la pieza {nombre: [sx,sy,sz]}; la raíz lleva posición, giro y aplastado
function nuevoMuneco(fig, x, y, z, yaw) {
  const F = FIGURAS[fig];
  return { fig, F, x, y, z, yaw: yaw || 0, partes: new Float32Array(16 * 16), rot: F.piezas.map(() => [0, 0, 0]), esc: F.piezas.map(() => [1, 1, 1]), sq: [1, 1, 1], bob: 0, malla: F.malla, anim: 0, mira: 0 };
}
const _pm = M4.nueva();
function posarMuneco(m) {
  const F = m.F, P = F.piezas, out = m.partes, mats = m._mats || (m._mats = P.map(() => new Float32Array(16)));
  for (let i = 0; i < P.length; i++) {
    const p = P[i], a = mats[i];
    if (p.padre < 0) { M4.ident(a); M4.mover(a, m.x, m.y + m.bob, m.z); M4.rotY(a, m.yaw); if (m.inclina) M4.rotX(a, m.inclina); M4.escalar(a, m.sq[0], m.sq[1], m.sq[2]); }
    else { a.set(mats[p.padre]); M4.mover(a, p.piv[0], p.piv[1], p.piv[2]); }
    const r = m.rot[i];
    if (r[1]) M4.rotY(a, r[1]); if (r[0]) M4.rotX(a, r[0]); if (r[2]) M4.rotZ(a, r[2]);
    const e = m.esc[i];
    if (e[0] !== 1 || e[1] !== 1 || e[2] !== 1) { _pm.set(a); M4.escalar(_pm, e[0], e[1], e[2]); out.set(_pm, i * 16); }
    else out.set(a, i * 16);
  }
}
// animación de una persona según su estado ('quieto','camina','corre','salta','cae','planea','trepa','habla','festeja','baila','sentado')
function animarPersona(m, est, t, vel, dt) {
  const I = m.F.indice, R0 = m.rot, E0 = m.esc;
  for (const r of R0) r[0] = r[1] = r[2] = 0;
  for (const e of E0) e[0] = e[1] = e[2] = 1;
  m.bob = 0; m.inclina = 0;
  const T = (n, x, y, z) => { const i = I[n]; if (i == null) return; R0[i][0] = x || 0; R0[i][1] = y || 0; R0[i][2] = z || 0; };
  if (est === 'camina' || est === 'corre') {
    m.anim += dt * (est === 'corre' ? 11 : 7.5) * Math.max(0.4, vel);
    const a = Math.sin(m.anim), amp = est === 'corre' ? 0.85 : 0.55;
    T('piernaI', a * amp); T('piernaD', -a * amp); T('brazoI', -a * amp * 0.9, 0, 0.08); T('brazoD', a * amp * 0.9, 0, -0.08);
    T('torso', est === 'corre' ? 0.16 : 0.04, Math.sin(m.anim) * 0.06); T('cabeza', est === 'corre' ? -0.12 : 0);
    m.bob = Math.abs(Math.cos(m.anim)) * (est === 'corre' ? 0.07 : 0.035);
  } else if (est === 'salta') { T('piernaI', -0.9); T('piernaD', 0.3); T('brazoI', -2.6, 0, 0.3); T('brazoD', -2.4, 0, -0.3); T('cabeza', -0.15); }
  else if (est === 'cae') { const w = Math.sin(t * 14) * 0.15; T('piernaI', 0.3 + w); T('piernaD', -0.2 - w); T('brazoI', -0.4, 0, 1.2 + w); T('brazoD', -0.4, 0, -1.2 - w); }
  else if (est === 'planea') {
    const w = Math.sin(t * 6) * 0.06;
    T('brazoI', 0, 0, 1.45 + w); T('brazoD', 0, 0, -1.45 - w); T('piernaI', 0.35); T('piernaD', 0.45); T('torso', 0.55); T('cabeza', -0.45);
    const ip = I.poncho; if (ip != null) { E0[ip][0] = 2.6; E0[ip][1] = 0.55; E0[ip][2] = 1.1; }
  } else if (est === 'aletea') {
    const f = Math.sin(t * 30);
    T('brazoI', 0, 0, 0.6 + f * 0.9); T('brazoD', 0, 0, -0.6 - f * 0.9); T('piernaI', -0.4); T('piernaD', 0.2);
    const ip = I.poncho; if (ip != null) { E0[ip][0] = 1.8 + f * 0.6; E0[ip][1] = 0.7; }
  } else if (est === 'trepa') {
    m.anim += dt * 7 * vel;
    const a = Math.sin(m.anim);
    T('brazoI', -2.7 + a * 0.4, 0, 0.15); T('brazoD', -2.7 - a * 0.4, 0, -0.15); T('piernaI', -0.5 - a * 0.4); T('piernaD', -0.5 + a * 0.4); T('cabeza', -0.3);
  } else if (est === 'habla') {
    const a = Math.sin(t * 9);
    T('cabeza', a * 0.06, Math.sin(t * 2.3) * 0.15); T('brazoI', -0.5 + Math.sin(t * 4) * 0.3, 0, 0.25); T('brazoD', -0.2, 0, -0.15);
    m.bob = Math.abs(Math.sin(t * 2)) * 0.01;
  } else if (est === 'festeja') {
    const a = Math.abs(Math.sin(t * 8));
    T('brazoI', -2.8, 0, 0.4 + a * 0.3); T('brazoD', -2.8, 0, -0.4 - a * 0.3); m.bob = a * 0.25; T('piernaI', -a * 0.4); T('piernaD', -a * 0.3);
  } else if (est === 'baila') {
    const a = Math.sin(t * 7);
    T('brazoI', -1.2 + a * 0.5, 0, 0.6); T('brazoD', -1.2 - a * 0.5, 0, -0.6); T('piernaI', a * 0.4); T('piernaD', -a * 0.4); T('torso', 0, a * 0.25);
    m.bob = Math.abs(a) * 0.08;
  } else if (est === 'toca') {
    const a = Math.sin(t * 10);
    T('brazoI', -1.1, 0.3, 0.2); T('brazoD', -1.0 + a * 0.15, -0.6, -0.2); T('cabeza', 0.15, 0, Math.sin(t * 2) * 0.1);
  } else if (est === 'teje') {
    const a = Math.sin(t * 3.5);
    T('brazoI', -1.2 + a * 0.2, 0, 0.1); T('brazoD', -1.2 - a * 0.2, 0, -0.1); T('cabeza', 0.25);
  } else {
    // quieto: respira y mira alrededor de vez en cuando
    const r = Math.sin(t * 2.1);
    E0[I.torso][1] = 1 + r * 0.015; T('brazoI', 0, 0, 0.1 + r * 0.02); T('brazoD', 0, 0, -0.1 - r * 0.02);
    m.mira += dt; const mi = Math.sin(m.mira * 0.6) > 0.7 ? Math.sin(m.mira * 1.7) * 0.5 : 0;
    T('cabeza', 0, mi);
  }
  // aplastado y estirado (lo pone el que mueve: m.sqT es el apuro de 1 a 0)
  if (m.sqT > 0) { m.sqT = Math.max(0, m.sqT - dt * 5); const k = Math.sin(m.sqT * Math.PI) * (m.sqA || 0.2); m.sq[1] = 1 + k; m.sq[0] = m.sq[2] = 1 - k * 0.5; }
  else { m.sq[0] = m.sq[1] = m.sq[2] = 1; }
}
function animarCuadrupedo(m, est, t, vel, dt) {
  const I = m.F.indice, R0 = m.rot;
  for (const r of R0) r[0] = r[1] = r[2] = 0;
  m.bob = 0;
  const T = (n, x, y, z) => { const i = I[n]; if (i == null) return; R0[i][0] = x || 0; R0[i][1] = y || 0; R0[i][2] = z || 0; };
  if (est === 'corre' || est === 'camina') {
    const c = est === 'corre';
    m.anim += dt * (c ? 13 : 7) * Math.max(0.5, vel);
    const a = Math.sin(m.anim), b = Math.sin(m.anim + (c ? 0.7 : Math.PI)), amp = c ? 0.8 : 0.45;
    T('pataDI', a * amp); T('pataTD', (c ? b : a) * amp); T('pataDD', -a * amp); T('pataTI', -(c ? b : a) * amp);
    T('cuello', c ? 0.35 : 0.1); T('cola', 0.4 + Math.sin(m.anim * 2) * 0.2);
    m.bob = Math.abs(Math.cos(m.anim)) * (c ? 0.12 : 0.03);
  } else if (est === 'salta') { T('pataDI', -0.9); T('pataDD', -0.9); T('pataTI', 0.8); T('pataTD', 0.8); T('cuello', 0.3); }
  else {
    m.mira += dt;
    T('cuello', Math.sin(m.mira * 0.5) > 0.6 ? 0.9 : 0.05, Math.sin(m.mira * 0.8) * 0.3); T('cabeza', 0, 0, Math.sin(m.mira * 3.1) * 0.05); T('cola', Math.sin(t * 3) * 0.2);
  }
}
