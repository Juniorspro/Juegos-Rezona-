// HOJALATA — los juguetes: seis autitos de lata a cuerda (y uno a pila), cada uno con su carrocería, ruedas,
// llave que gira, conductor con cara pintada (8 gestos, boca que habla), bufanda o antena que se mueve; las caras
// en un atlas; las cosas de la pista (cajitas sorpresa, tornillos, canicas, botones, pompas, resortes).
// Ejes del autito: adelante +Z, arriba +Y, izquierda +X. Huesos: 0 chasis · 1-4 ruedas · 5 llave · 6 torso ·
// 7 cabeza · 8 bufanda/antena · 9 punta de la bufanda.
const PERSONAJES = {
  chispa: { fila: 0, tipo: 'roadster', c1: '#d8352a', c2: '#f6e7c6', c3: '#1f4fa8', patron: 1, cintura: 0.19, num: 7, desgaste: 0.3, piel: '#f4cba2', pelo: '#e06a24', ropa: '#f2b632', cabeza: 'chica', bufanda: '#f6e7c6', llave: '#d9a441', stats: { vel: 1, acel: 1, giro: 1, peso: 1 } },
  turbo: { fila: 1, tipo: 'deportivo', c1: '#c9ced8', c2: '#ff5a1f', c3: '#14161f', patron: 6, cintura: 0.17, num: 1, desgaste: 0, brillo: 0.85, piel: '#f0c39a', pelo: '#ffd23f', ropa: '#14161f', cabeza: 'jopo', llave: null, stats: { vel: 1.05, acel: 0.95, giro: 0.93, peso: 1.1 } },
  lata: { fila: 2, tipo: 'sedan', c1: '#2f6fd0', c2: '#f6e7c6', c3: '#d8352a', patron: 3, cintura: 0.2, num: 9, desgaste: 0.55, piel: '#f2c8a8', pelo: '#e8e4f0', ropa: '#a04a9a', cabeza: 'rodete', bufanda: '#f47eb4', llave: '#d9a441', stats: { vel: 0.97, acel: 1, giro: 1.1, peso: 1.15 } },
  bicho: { fila: 3, tipo: 'escarabajo', c1: '#3fae4f', c2: '#1b1a2e', c3: '#f2b632', patron: 3, cintura: 0.15, num: 3, desgaste: 0.35, piel: '#c98a5a', pelo: '#3a2414', ropa: '#3a6ea8', cabeza: 'gorra', llave: '#c9ced8', stats: { vel: 0.98, acel: 1.12, giro: 1.02, peso: 0.85 } },
  robo: { fila: 4, tipo: 'cohete', c1: '#8fa8c8', c2: '#f2b632', c3: '#d8352a', patron: 5, cintura: 0.16, num: 5, desgaste: 0.2, piel: '#b8c4d4', pelo: '#d8352a', ropa: '#5a6a80', cabeza: 'robot', llave: '#d9a441', stats: { vel: 1.04, acel: 0.92, giro: 0.95, peso: 1.2 } },
  patita: { fila: 5, tipo: 'lancha', c1: '#f7c62e', c2: '#1f8fd0', c3: '#d8352a', patron: 4, cintura: 0.17, num: 2, desgaste: 0.25, piel: '#ffffff', pelo: '#ff8a1f', ropa: '#1f4fa8', cabeza: 'pato', llave: '#d9a441', stats: { vel: 0.99, acel: 1.06, giro: 1.08, peso: 0.8 } },
};
const ORDEN_PJ = ['chispa', 'turbo', 'lata', 'bicho', 'robo', 'patita'];
const GESTOS = { normal: 0, feliz: 1, enojado: 2, sorpresa: 3, triste: 4, decidido: 5, risa: 6, picaro: 7 };

// ---------- caras pintadas (fila = personaje, columna = gesto×2 + boca abierta); fila 7: los números ----------
function armarCaras() {
  const C = 96, cv = lienzo(C * 16, C * 8), g = cv.getContext('2d');
  g.lineCap = 'round'; g.lineJoin = 'round';
  const tinta = '#1b1a2e';
  for (let fila = 0; fila < 6; fila++) for (let ge = 0; ge < 8; ge++) for (let ab = 0; ab < 2; ab++) {
    g.save(); g.translate((ge * 2 + ab) * C, fila * C); g.scale(C / 128, C / 128);
    const robot = fila === 4, pato = fila === 5, lentes = fila === 1, abuela = fila === 2;
    const oy = 58, sep = 25;
    // mejillas pintadas (la lata litografiada siempre tiene cachetes rosados)
    if (!robot) { g.fillStyle = 'rgba(236,90,90,0.55)'; for (const s of [-1, 1]) { g.beginPath(); g.arc(64 + s * 36, 80, 9, 0, TAU); g.fill(); } }
    if (fila === 0 || fila === 3) { g.fillStyle = 'rgba(150,70,30,0.6)'; for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(64 + s * (30 + k * 6), 72 + (k % 2) * 4, 1.8, 0, TAU); g.fill(); } }
    // ojos
    const ojo = (lado) => {
      const x = 64 + lado * sep;
      if (robot) {
        g.fillStyle = ge === 2 ? '#ff5a3a' : '#7af0ff';
        const h = ge === 3 ? 20 : ge === 9 ? 4 : ge === 1 || ge === 6 ? 7 : 14;
        if (ge === 1 || ge === 6) { g.lineWidth = 6; g.strokeStyle = '#7af0ff'; g.beginPath(); g.moveTo(x - 10, oy + 4); g.lineTo(x, oy - 4); g.lineTo(x + 10, oy + 4); g.stroke(); }
        else if (ge === 2) { g.beginPath(); g.moveTo(x - 11, oy - 6 + (lado < 0 ? 0 : 4)); g.lineTo(x + 11, oy - 6 + (lado < 0 ? 4 : 0)); g.lineTo(x + 11, oy + 7); g.lineTo(x - 11, oy + 7); g.closePath(); g.fill(); }
        else g.fillRect(x - 11, oy - h / 2, 22, h);
        g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillRect(x - 8, oy - 4, 5, 3);
        return;
      }
      if (lentes) {   // anteojos de sol de Turbo Max
        g.fillStyle = '#14161f'; g.beginPath(); g.ellipse(x, oy, 17, 12 - (ge === 2 ? 3 : 0), lado * (ge === 2 ? 0.25 : 0.05), 0, TAU); g.fill();
        g.fillStyle = 'rgba(140,200,255,0.75)'; g.beginPath(); g.ellipse(x - 5, oy - 4, 6, 3, -0.4, 0, TAU); g.fill();
        g.strokeStyle = '#14161f'; g.lineWidth = 4; g.beginPath(); g.moveTo(64 - 8, oy - 2); g.lineTo(64 + 8, oy - 2); g.stroke();
        return;
      }
      const cerr = ge === 6 || (ge === 1 && ab);
      if (cerr) { g.strokeStyle = tinta; g.lineWidth = 5; g.beginPath(); g.arc(x, oy + 5, 9, PI * 1.15, PI * 1.85); g.stroke(); return; }
      const ry = (ge === 3 ? 15 : ge === 2 || ge === 5 ? 9 : 13) * (abuela ? 0.75 : 1), rx = abuela ? 9 : 11;
      g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(x, oy, rx, ry, 0, 0, TAU); g.fill();
      const pr = ge === 3 ? 4 : abuela ? 5 : 7.5, px = x + (ge === 7 ? 3 : -lado * 1.2), py = oy + (ge === 4 ? 3 : 1);
      g.fillStyle = fila === 3 ? '#4a2a14' : '#1d2a5a'; g.beginPath(); g.arc(px, py, pr, 0, TAU); g.fill();
      g.fillStyle = '#ffffff'; g.beginPath(); g.arc(px - 2.5, py - 3, Math.max(1.5, pr * 0.35), 0, TAU); g.fill();
      g.strokeStyle = tinta; g.lineWidth = 3.6; g.beginPath(); g.ellipse(x, oy, rx, ry, 0, 0, TAU); g.stroke();
      if (ge === 2 || ge === 5 || ge === 7) { g.fillStyle = tinta; g.beginPath(); const a = ge === 7 ? 0.35 : 0.5; g.moveTo(x - rx - 2, oy - ry - 2); g.lineTo(x + rx + 2, oy - ry - 2); g.lineTo(x + rx + 2, oy - ry + ry * 2 * a * (lado > 0 ? 0.6 : 1.3)); g.lineTo(x - rx - 2, oy - ry + ry * 2 * a * (lado < 0 ? 0.6 : 1.3)); g.closePath(); g.save(); g.beginPath(); g.ellipse(x, oy, rx + 2, ry + 2, 0, 0, TAU); g.clip(); g.fillStyle = mezcla(PERSONAJES[ORDEN_PJ[fila]].piel, '#000000', 0.15); g.fill(); g.restore(); }
      if (abuela) { g.strokeStyle = '#c9a441'; g.lineWidth = 3; g.beginPath(); g.arc(x, oy, 15, 0, TAU); g.stroke(); }
      if (fila === 0 && ge !== 2) { g.strokeStyle = tinta; g.lineWidth = 2.5; for (let k = 0; k < 2; k++) { g.beginPath(); g.moveTo(x + lado * (rx - 2), oy - ry * 0.6 + k * 4); g.lineTo(x + lado * (rx + 5), oy - ry * 0.9 + k * 5); g.stroke(); } }
    };
    ojo(-1); ojo(1);
    if (abuela) { g.strokeStyle = '#c9a441'; g.lineWidth = 3; g.beginPath(); g.moveTo(64 - 10, oy); g.lineTo(64 + 10, oy); g.stroke(); }
    // cejas
    if (!robot && !lentes) {
      g.strokeStyle = fila === 2 ? '#a8a4b0' : tinta; g.lineWidth = 4.5;
      for (const lado of [-1, 1]) {
        const x = 64 + lado * sep, cy = oy - 21;
        let ai = 0, ae = 0;
        if (ge === 2 || ge === 5) { ai = 6; ae = -4; } else if (ge === 4) { ai = -5; ae = 4; } else if (ge === 3) { ai = -5; ae = -5; } else if (ge === 7 && lado > 0) { ai = -5; ae = -7; }
        g.beginPath(); g.moveTo(x - lado * 2, cy + ai); g.quadraticCurveTo(x + lado * 6, cy - 4 + (ai + ae) / 2, x + lado * 13, cy + ae); g.stroke();
      }
    } else if (lentes && (ge === 2 || ge === 3)) { g.strokeStyle = '#a07a20'; g.lineWidth = 4.5; for (const lado of [-1, 1]) { g.beginPath(); g.moveTo(64 + lado * 12, oy - 16 + (ge === 2 ? 5 : -4)); g.lineTo(64 + lado * 36, oy - 18 + (ge === 2 ? -3 : -4)); g.stroke(); } }
    // nariz
    if (!robot && !pato) { g.fillStyle = mezcla(PERSONAJES[ORDEN_PJ[fila]].piel, '#c0503a', 0.35); g.beginPath(); g.ellipse(64, 74, 5, 4, 0, 0, TAU); g.fill(); }
    // boca (el pato tiene pico de verdad; el robot, una rejilla)
    const by = 92;
    if (robot) {
      g.fillStyle = '#2a3446'; g.fillRect(46, by - 6, 36, ab ? 14 : 8);
      g.strokeStyle = '#7af0ff'; g.lineWidth = 2; for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(50 + k * 7, by - 4); g.lineTo(50 + k * 7, by + (ab ? 6 : 1)); g.stroke(); }
    } else if (!pato) {
      g.strokeStyle = tinta; g.lineWidth = 4; g.fillStyle = '#8a1f2a';
      g.beginPath();
      if (ab || ge === 3 || ge === 6) {
        const w = ge === 6 ? 15 : ge === 3 ? 7 : 10, h = ge === 6 ? 12 : ge === 3 ? 9 : 7;
        if (ge === 1 || ge === 6) { g.moveTo(64 - w - 4, by - 3); g.quadraticCurveTo(64, by + h * 2.2, 64 + w + 4, by - 3); g.closePath(); }
        else if (ge === 4 || ge === 2) { g.moveTo(64 - w, by + 5); g.quadraticCurveTo(64, by - h, 64 + w, by + 5); g.closePath(); }
        else g.ellipse(64, by + 2, w, h, 0, 0, TAU);
        g.fill(); g.stroke();
        if (ge !== 3) { g.fillStyle = '#ffffff'; g.fillRect(64 - w * 0.6, by - 3, w * 1.2, 3); }
      } else if (ge === 1) { g.moveTo(48, by - 2); g.quadraticCurveTo(64, by + 14, 80, by - 2); g.stroke(); }
      else if (ge === 2) { g.moveTo(52, by + 5); g.quadraticCurveTo(64, by - 4, 76, by + 5); g.stroke(); }
      else if (ge === 4) { g.moveTo(54, by + 5); g.quadraticCurveTo(64, by - 2, 74, by + 5); g.stroke(); g.fillStyle = '#7ac8f0'; g.beginPath(); g.ellipse(64 - sep - 3, oy + 16, 3, 6, 0, 0, TAU); g.fill(); }
      else if (ge === 5) { g.moveTo(52, by + 1); g.lineTo(76, by - 1); g.stroke(); }
      else if (ge === 7) { g.moveTo(52, by + 2); g.quadraticCurveTo(66, by + 6, 78, by - 6); g.stroke(); }
      else { g.moveTo(54, by); g.quadraticCurveTo(64, by + 7, 74, by); g.stroke(); }
    }
    g.restore();
  }
  // los números del capot (blancos: el color lo pone el autito)
  for (let d = 0; d < 10; d++) {
    g.save(); g.translate(d * C, 7 * C);
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(C / 2, C / 2, C * 0.46, 0, TAU); g.fill();
    g.globalCompositeOperation = 'destination-out';
    const k = C * 0.06, { p } = caminoLetras(String(d), k, false, 1);
    g.translate(C / 2 - anchoLetras(String(d)) * k / 2, C / 2 - 5 * k);
    g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = C * 0.11; g.stroke(p);
    g.restore();
  }
  return cv;
}

// ---------- el autito ----------
const RUEDA_R = 0.11;
function armarRueda(G, hueso, ancho, colLlanta, c3) {
  const r = RUEDA_R, w = ancho || 0.07;
  conT(lugar(0, 0, 0, 0, 1, 1, 1, 0, PI / 2), () => {
    geoTorno(G, [[r * 0.62, -w / 2], [r * 0.86, -w / 2 - 0.004], [r, -w * 0.3], [r, w * 0.3], [r * 0.86, w / 2 + 0.004], [r * 0.62, w / 2]], cc('#2a2830'), { nu: 16, flag: 3, hueso });
    geoTorno(G, [[0, -w / 2 - 0.004], [r * 0.62, -w / 2], [r * 0.62, w / 2], [0, w / 2 + 0.004]], cc(colLlanta), { nu: 14, flag: 14, hueso });
    geoTorno(G, [[r * 0.34, w / 2 + 0.002], [r * 0.3, w / 2 + 0.012], [0, w / 2 + 0.02]], cc('#e8eaf0'), { nu: 12, flag: 2, hueso });
    geoTorno(G, [[0, -w / 2 - 0.02], [r * 0.3, -w / 2 - 0.012], [r * 0.34, -w / 2 - 0.002]], cc('#e8eaf0'), { nu: 12, flag: 2, hueso });
  });
  // marca para que se vea girar
  geoQuad(G, [w / 2 + 0.006, -r * 0.1, r * 0.4], [w / 2 + 0.006, r * 0.1, r * 0.4], [w / 2 + 0.006, r * 0.1, r * 0.58], [w / 2 + 0.006, -r * 0.1, r * 0.58], cc(c3), 14, null, hueso);
  geoQuad(G, [-w / 2 - 0.006, r * 0.1, r * 0.4], [-w / 2 - 0.006, -r * 0.1, r * 0.4], [-w / 2 - 0.006, -r * 0.1, r * 0.58], [-w / 2 - 0.006, r * 0.1, r * 0.58], cc(c3), 14, null, hueso);
}
function armarLlave(G, col) {
  const c = cc(col);
  geoCapsula(G, [0, 0, 0.02], [0, 0, -0.09], 0.016, 0.016, c, { flag: 2, hueso: 5, nu: 8, nv: 6 });
  conT(lugar(0, 0, -0.1, 0), () => { for (const s of [-1, 1]) conT(lugar(s * 0.055, 0, 0, 0), () => geoAro(G, 0.045, 0.013, c, 2, { hueso: 5, nu: 16, nv: 6 })); });
}
// número en un redondel: un cuadrado con la cifra del atlas (fila 7)
function numeroDecal(G, n, centro, ejeU, ejeV, tam, hueso, col) {
  const s = String(n), k = s.length, c = cc(col || '#ffffff');
  for (let i = 0; i < k; i++) {
    const d = +s[i], u0 = d / 16, u1 = (d + 1) / 16, v0 = 7 / 8, v1 = 1, off = (i - (k - 1) / 2) * tam * 1.6;
    const P = (a, b) => [centro[0] + ejeU[0] * (a + off) + ejeV[0] * b, centro[1] + ejeU[1] * (a + off) + ejeV[1] * b, centro[2] + ejeU[2] * (a + off) + ejeV[2] * b];
    geoQuad(G, P(-tam, -tam), P(tam, -tam), P(tam, tam), P(-tam, tam), c, 12, [[u0, v1], [u1, v1], [u1, v0], [u0, v0]], hueso);
  }
}
function armarAuto(id) {
  const D = PERSONAJES[id], G = nuevaGeo(true), c1 = cc(D.c1), c2 = cc(D.c2), c3 = cc(D.c3), cromo = cc('#e4e7ee'), oscuro = cc('#2a2a34');
  const H = (x, y, z, rx, ry, rz, col, o) => geoElipsoide(G, x, y, z, rx, ry, rz, col, Object.assign({ hueso: 0, flag: 1, nu: 18, nv: 12 }, o || {}));
  const info = { ruedas: [[0.265, RUEDA_R, 0.31], [-0.265, RUEDA_R, 0.31], [0.265, RUEDA_R, -0.3], [-0.265, RUEDA_R, -0.3]], llave: [0, 0.27, -0.5], asiento: [0, 0.2, -0.06], ancho: 0.075, llanta: D.c3 };
  if (D.tipo === 'roadster') {
    H(0, 0.165, 0, 0.245, 0.08, 0.5, c1, { e: 0.35 });
    H(0, 0.235, 0.25, 0.215, 0.07, 0.25, c1, { e: 0.45, abajo: -0.2 });
    H(0, 0.245, -0.34, 0.215, 0.07, 0.16, c1, { e: 0.45, abajo: -0.2 });
    for (const [x, z] of [[0.25, 0.31], [-0.25, 0.31], [0.25, -0.3], [-0.25, -0.3]]) H(x, 0.19, z, 0.075, 0.075, 0.14, c1, { abajo: -0.05, e: 0.8 });
    H(0, 0.215, -0.07, 0.17, 0.05, 0.12, oscuro, { flag: 0, e: 0.5 });
    // parabrisas con marco de cromo
    geoQuad(G, [0.15, 0.27, 0.07], [-0.15, 0.27, 0.07], [-0.13, 0.38, 0.03], [0.13, 0.38, 0.03], cc('#bfe0f0'), 7, null, 0);
    geoQuad(G, [-0.15, 0.27, 0.071], [0.15, 0.27, 0.071], [0.13, 0.38, 0.031], [-0.13, 0.38, 0.031], cc('#bfe0f0'), 7, null, 0);
    geoTubo(G, [[0.155, 0.265, 0.07], [0.135, 0.385, 0.03], [-0.135, 0.385, 0.03], [-0.155, 0.265, 0.07]], 0.008, cromo, 2, { hueso: 0, nu: 6 });
    numeroDecal(G, D.num, [0, 0.306, 0.26], [1, 0, 0], [0, 0, -1], 0.055, 0);
    for (const s of [1, -1]) numeroDecal(G, D.num, [s * 0.247, 0.17, -0.05], [0, 0, -s], [0, 1, 0], 0.05, 0);
  } else if (D.tipo === 'deportivo') {
    H(0, 0.15, 0, 0.255, 0.07, 0.52, c1, { e: 0.3 });
    H(0, 0.21, 0.08, 0.235, 0.075, 0.46, c1, { e: 0.4, abajo: -0.3, afinaZ: (y, z) => z > 0 ? 1 - z * 0.55 : 1 });
    for (const [x, z] of [[0.26, 0.31], [-0.26, 0.31], [0.26, -0.3], [-0.26, -0.3]]) H(x, 0.18, z, 0.07, 0.075, 0.14, c1, { abajo: -0.05, e: 0.6 });
    H(0, 0.235, -0.08, 0.15, 0.04, 0.11, oscuro, { flag: 0, e: 0.5 });
    geoQuad(G, [0.14, 0.255, 0.06], [-0.14, 0.255, 0.06], [-0.11, 0.33, 0.0], [0.11, 0.33, 0.0], cc('#2a3a50'), 7, null, 0);
    geoQuad(G, [-0.14, 0.255, 0.061], [0.14, 0.255, 0.061], [0.11, 0.33, 0.001], [-0.11, 0.33, 0.001], cc('#2a3a50'), 7, null, 0);
    // alerón
    for (const s of [1, -1]) geoCaja(G, s * 0.16 - 0.012, 0.22, -0.47, s * 0.16 + 0.012, 0.33, -0.43, c3, 13, { hueso: 0 });
    H(0, 0.34, -0.46, 0.27, 0.014, 0.06, c2, { flag: 13, e: 0.3 });
    numeroDecal(G, D.num, [0, 0.262, 0.3], [1, 0, 0], [0, 0, -1], 0.05, 0, '#14161f');
    info.llave = [0, 0.25, -0.53];
  } else if (D.tipo === 'sedan') {
    H(0, 0.19, 0, 0.23, 0.1, 0.47, c1, { e: 0.45 });
    H(0, 0.27, 0.27, 0.19, 0.06, 0.2, c1, { e: 0.55, abajo: -0.2 });
    H(0, 0.29, -0.3, 0.2, 0.08, 0.17, c1, { e: 0.55, abajo: -0.2 });
    for (const [x, z] of [[0.24, 0.31], [-0.24, 0.31], [0.24, -0.3], [-0.24, -0.3]]) H(x, 0.18, z, 0.09, 0.09, 0.15, c3, { abajo: -0.02, e: 0.9 });
    for (const s of [1, -1]) geoCaja(G, s * 0.24 - 0.04, 0.1, -0.16, s * 0.24 + 0.04, 0.115, 0.17, cc('#1b1a2e'), 0, { hueso: 0 });   // estribos
    H(0, 0.25, -0.08, 0.16, 0.05, 0.11, oscuro, { flag: 0, e: 0.5 });
    // faros redondos en palitos y rueda de auxilio
    for (const s of [1, -1]) { geoCapsula(G, [s * 0.12, 0.25, 0.43], [s * 0.15, 0.3, 0.45], 0.008, 0.008, cromo, { flag: 2, hueso: 0, nu: 6, nv: 4 }); H(s * 0.15, 0.31, 0.46, 0.035, 0.035, 0.025, cromo, { flag: 2, nu: 10, nv: 8 }); H(s * 0.15, 0.31, 0.482, 0.025, 0.025, 0.006, cc('#fff4c0'), { flag: 8, nu: 10, nv: 6 }); }
    numeroDecal(G, D.num, [0, 0.333, 0.27], [1, 0, 0], [0, 0, -1], 0.05, 0);
    info.llave = [0, 0.3, -0.48];
  } else if (D.tipo === 'escarabajo') {
    H(0, 0.2, 0, 0.27, 0.15, 0.46, c1, { e: 0.85, abajo: -0.55 });
    for (const [x, z] of [[0.25, 0.31], [-0.25, 0.31], [0.25, -0.3], [-0.25, -0.3]]) H(x, 0.17, z, 0.08, 0.08, 0.14, c1, { abajo: -0.05 });
    H(0, 0.33, -0.04, 0.13, 0.02, 0.12, oscuro, { flag: 0 });
    // antenas de bicho
    for (const s of [1, -1]) geoTubo(G, [[s * 0.06, 0.3, 0.32], [s * 0.1, 0.4, 0.42], [s * 0.16, 0.45, 0.5], [s * 0.2, 0.44, 0.55]], 0.009, cc('#1b1a2e'), 0, { hueso: 0, nu: 5 });
    for (const s of [1, -1]) H(s * 0.2, 0.44, 0.56, 0.022, 0.022, 0.022, c3, { flag: 13, nu: 8, nv: 6 });
    numeroDecal(G, D.num, [0, 0.27, 0.36], [1, 0, 0], [0, 0.45, -0.89], 0.05, 0);
    info.asiento = [0, 0.27, -0.06]; info.llave = [0, 0.27, -0.47];
  } else if (D.tipo === 'cohete') {
    geoCapsula(G, [0, 0.2, -0.38], [0, 0.2, 0.36], 0.15, 0.13, c1, { flag: 1, hueso: 0, nu: 18, nv: 12 });
    H(0, 0.13, 0, 0.25, 0.04, 0.42, c1, { e: 0.3 });
    for (const [x, z] of [[0.25, 0.31], [-0.25, 0.31], [0.25, -0.3], [-0.25, -0.3]]) H(x, 0.17, z, 0.07, 0.07, 0.13, c2, { abajo: -0.05, e: 0.7 });
    // aletas y tobera
    for (const a of [0, 1, 2]) { const ang = a * TAU / 3 + PI / 2, ca = Math.cos(ang), sa = Math.sin(ang); geoQuad(G, [ca * 0.12, 0.2 + sa * 0.12, -0.3], [ca * 0.12, 0.2 + sa * 0.12, -0.5], [ca * 0.25, 0.2 + sa * 0.25, -0.56], [ca * 0.24, 0.2 + sa * 0.24, -0.4], c3, 13, null, 0); geoQuad(G, [ca * 0.24, 0.2 + sa * 0.24, -0.4], [ca * 0.25, 0.2 + sa * 0.25, -0.56], [ca * 0.12, 0.2 + sa * 0.12, -0.5], [ca * 0.12, 0.2 + sa * 0.12, -0.3], c3, 13, null, 0); }
    conT(lugar(0, 0.2, -0.5, 0, 1, 1, 1, -PI / 2), () => geoTorno(G, [[0.09, 0], [0.11, 0.08], [0.1, 0.1], [0.06, 0.06], [0, 0.05]], cromo, { nu: 14, flag: 2, hueso: 0, flags: [2, 2, 2, 8] }));
    H(0, 0.32, -0.05, 0.11, 0.03, 0.1, oscuro, { flag: 0 });
    numeroDecal(G, D.num, [0, 0.336, 0.18], [1, 0, 0], [0, 0.6, -0.8], 0.045, 0);
    info.asiento = [0, 0.29, -0.06]; info.llave = [0, 0.36, -0.3];
  } else if (D.tipo === 'lancha') {
    H(0, 0.19, 0, 0.255, 0.12, 0.5, c1, { e: 0.6, arriba: 0.5, afina: (y, z) => z > 0 ? 1 - z * z * 0.7 : 1 });
    geoElipsoide(G, 0, 0.255, 0, 0.21, 0.01, 0.42, c2, { hueso: 0, flag: 0, e: 0.5, nu: 16, nv: 6, afina: (y, z) => z > 0 ? 1 - z * z * 0.75 : 1 });
    for (const [x, z] of [[0.24, 0.31], [-0.24, 0.31], [0.24, -0.3], [-0.24, -0.3]]) H(x, 0.15, z, 0.065, 0.065, 0.12, c1, { abajo: -0.05 });
    // salvavidas y banderita
    conT(lugar(0.2, 0.25, -0.32, 0, 1, 1, 1, 0, PI / 2), () => geoAro(G, 0.06, 0.022, cc('#ffffff'), 13, { hueso: 0, nu: 14, nv: 6 }));
    geoCapsula(G, [-0.17, 0.25, -0.38], [-0.17, 0.5, -0.38], 0.006, 0.006, cromo, { flag: 2, hueso: 0, nu: 5, nv: 3 });
    geoQuad(G, [-0.17, 0.5, -0.38], [-0.17, 0.43, -0.38], [-0.17, 0.465, -0.26], [-0.17, 0.5, -0.38], c3, 13, null, 0);
    geoQuad(G, [-0.17, 0.5, -0.38], [-0.17, 0.465, -0.26], [-0.17, 0.43, -0.38], [-0.17, 0.5, -0.38], c3, 13, null, 0);
    numeroDecal(G, D.num, [0, 0.27, 0.3], [1, 0, 0], [0, 0.2, -1], 0.045, 0);
    info.asiento = [0, 0.24, -0.08];
  }
  // paragolpes, parrilla y faros (menos el cohete y la lancha)
  if (D.tipo !== 'cohete' && D.tipo !== 'lancha') {
    geoCapsula(G, [0.22, 0.12, 0.505], [-0.22, 0.12, 0.505], 0.022, 0.022, cromo, { flag: 2, hueso: 0, nu: 8, nv: 6 });
    geoCapsula(G, [0.22, 0.12, -0.5], [-0.22, 0.12, -0.5], 0.022, 0.022, cromo, { flag: 2, hueso: 0, nu: 8, nv: 6 });
    if (D.tipo !== 'sedan') for (const s of [1, -1]) { H(s * 0.15, 0.2, 0.49, 0.03, 0.03, 0.02, cromo, { flag: 2, nu: 10, nv: 8 }); H(s * 0.15, 0.2, 0.505, 0.022, 0.022, 0.006, cc('#fff4c0'), { flag: 8, nu: 10, nv: 6 }); }
  }
  // luces de atrás
  for (const s of [1, -1]) H(s * 0.17, 0.2, -0.5, 0.025, 0.02, 0.01, cc('#ff3a2a'), { flag: 8, nu: 8, nv: 6 });
  // las ruedas (cada una en su hueso)
  for (let i = 0; i < 4; i++) armarRueda(G, i + 1, info.ancho, info.llanta, D.c2);
  // la llave (o el ventilador de Turbo Max, que es a pila)
  if (D.llave) armarLlave(G, D.llave);
  else {
    geoCaja(G, -0.06, -0.03, -0.02, 0.06, 0.03, 0.06, cc('#2a6ad8'), 13, { hueso: 0, m: null });
    for (let b = 0; b < 3; b++) { const a = b * TAU / 3; geoQuad(G, [0, 0, -0.005], [Math.cos(a - 0.3) * 0.08, Math.sin(a - 0.3) * 0.08, -0.01], [Math.cos(a + 0.3) * 0.08, Math.sin(a + 0.3) * 0.08, -0.01], [0, 0, -0.005], cc('#ff5a1f'), 13, null, 5); geoQuad(G, [0, 0, -0.005], [Math.cos(a + 0.3) * 0.08, Math.sin(a + 0.3) * 0.08, -0.01], [Math.cos(a - 0.3) * 0.08, Math.sin(a - 0.3) * 0.08, -0.01], [0, 0, -0.005], cc('#ff5a1f'), 13, null, 5); }
    geoElipsoide(G, 0, 0, 0, 0.015, 0.015, 0.015, cc('#7af0ff'), { hueso: 5, flag: 8, nu: 6, nv: 4 });
  }
  armarConductor(G, D);
  const m = geoEmpacar(G);
  return { malla: m, info, datos: D, id };
}
// el conductor: torso de lata pintada (hueso 6), cabeza con cara (7), bufanda o antena (8, 9)
function armarConductor(G, D) {
  const piel = cc(D.piel), ropa = cc(D.ropa), pelo = cc(D.pelo), tinta = cc('#1b1a2e');
  const E = (x, y, z, rx, ry, rz, col, hueso, o) => geoElipsoide(G, x, y, z, rx, ry, rz, col, Object.assign({ hueso, flag: 14, nu: 12, nv: 8 }, o || {}));
  E(0, 0.07, 0, 0.085, 0.085, 0.065, ropa, 6, { e: 0.8 });
  for (const s of [1, -1]) { geoCapsula(G, [s * 0.075, 0.11, 0], [s * 0.06, 0.06, 0.09], 0.025, 0.022, ropa, { flag: 14, hueso: 6, nu: 6, nv: 4 }); E(s * 0.05, 0.06, 0.1, 0.022, 0.022, 0.022, piel, 6); }
  // volante
  conT(lugar(0, 0.07, 0.12, 0, 1, 1, 1, -0.6), () => geoAro(G, 0.05, 0.008, tinta, 13, { hueso: 6, nu: 14, nv: 5 }));
  const rc = 0.085, hy = 0.08;
  if (D.cabeza === 'robot') {
    geoCaja(G, -0.075, hy - 0.06, -0.06, 0.075, hy + 0.07, 0.065, piel, 2, { hueso: 7, sin: '+z' });
    geoQuad(G, [0.075, hy - 0.06, 0.065], [-0.075, hy - 0.06, 0.065], [-0.075, hy + 0.07, 0.065], [0.075, hy + 0.07, 0.065], piel, 11, [[1, 1], [0, 1], [0, 0], [1, 0]], 7);
    for (const s of [1, -1]) E(s * 0.085, hy, 0, 0.015, 0.03, 0.03, cc('#d8352a'), 7, { flag: 13 });
    geoCapsula(G, [0, 0, 0], [0, 0.08, 0], 0.006, 0.006, cc('#c9ced8'), { flag: 2, hueso: 8, nu: 5, nv: 3 });
    E(0, 0.09, 0, 0.018, 0.018, 0.018, cc('#ff3a2a'), 8, { flag: 8 });
    return;
  }
  // cabeza redonda con la cara pintada adelante
  geoElipsoide(G, 0, hy, 0, rc, rc * 1.02, rc * 0.96, piel, {
    hueso: 7, flag: 11, nu: 18, nv: 12,
    uv: (p) => { const x = p[0], y = p[1] - hy, z = p[2]; if (z > -0.01) return [0.5 - x / (rc * 1.9), 0.5 - (y - rc * 0.05) / (rc * 1.9)]; return [-1, -1]; },
  });
  const P = (x, y, z, rx, ry, rz, col, o) => E(x * rc, hy + y * rc, z * rc, rx * rc, ry * rc, rz * rc, col, 7, o);
  switch (D.cabeza) {
    case 'chica':   // pelo en dos rodetes, antiparras en la frente
      P(0, 0.35, -0.12, 1.06, 0.8, 1.02, pelo, { abajo: -0.2, flag: 14 });
      for (const s of [1, -1]) P(s * 0.85, 0.75, -0.2, 0.42, 0.42, 0.42, pelo);
      conT(lugar(0, hy + rc * 0.55, 0, 0), () => geoTorno(G, [[rc * 1.03, -0.012], [rc * 1.05, 0], [rc * 1.03, 0.012]], cc('#5a3a20'), { nu: 18, flag: 14, hueso: 7 }));
      for (const s of [1, -1]) { P(s * 0.38, 0.55, 0.88, 0.3, 0.26, 0.12, cc('#c9ced8'), { flag: 2 }); P(s * 0.38, 0.55, 0.96, 0.22, 0.18, 0.05, cc('#7ac8f0'), { flag: 7 }); }
      break;
    case 'jopo':    // jopo rubio de Turbo Max
      P(0, 0.4, -0.1, 1.05, 0.75, 1.02, pelo, { abajo: -0.2 });
      P(0, 0.95, 0.45, 0.62, 0.42, 0.75, pelo);
      P(0, 1.15, 0.85, 0.42, 0.28, 0.42, pelo);
      break;
    case 'rodete':  // pelo canoso con rodete y anteojos (pintados en la cara)
      P(0, 0.35, -0.12, 1.06, 0.82, 1.03, pelo, { abajo: -0.15 });
      P(0, 0.95, -0.45, 0.48, 0.42, 0.48, pelo);
      break;
    case 'gorra':   // gorra al revés del mecánico
      P(0, 0.42, -0.05, 1.07, 0.68, 1.05, cc('#d8352a'), { abajo: 0, flag: 13 });
      P(0, 0.45, -1.15, 0.7, 0.07, 0.48, cc('#d8352a'), { flag: 13, e: 0.6 });
      P(0, 0.05, -0.55, 0.9, 0.55, 0.6, pelo);
      break;
    case 'pato':    // pato: pico naranja y gorrito de marinero
      P(0, -0.22, 0.95, 0.48, 0.16, 0.42, pelo, { flag: 13 });
      P(0, -0.38, 0.9, 0.42, 0.1, 0.36, pelo, { flag: 13 });
      P(0, 0.72, -0.05, 0.75, 0.3, 0.75, cc('#ffffff'), { flag: 13 });
      P(0, 0.62, -0.05, 0.85, 0.08, 0.85, cc('#1f4fa8'), { flag: 13 });
      break;
  }
  for (const s of [1, -1]) if (D.cabeza !== 'pato') P(s * 0.98, -0.02, 0, 0.16, 0.24, 0.13, piel);
  // bufanda que flamea (base en el cuello: hueso 8; punta: hueso 9)
  if (D.bufanda) {
    const b = cc(D.bufanda);
    conT(lugar(0, 0.005, 0, 0), () => geoTorno(G, [[0.072, -0.02], [0.08, 0], [0.072, 0.02]], b, { nu: 14, flag: 15, hueso: 8 }));
    geoQuad(G, [0.03, 0, -0.06], [-0.03, 0, -0.06], [-0.03, -0.01, -0.16], [0.03, -0.01, -0.16], b, 15, null, 8);
    geoQuad(G, [-0.03, 0, -0.06], [0.03, 0, -0.06], [0.03, -0.01, -0.16], [-0.03, -0.01, -0.16], b, 15, null, 8);
    geoQuad(G, [0.03, 0, 0], [-0.03, 0, 0], [-0.025, -0.01, -0.12], [0.025, -0.01, -0.12], b, 15, null, 9);
    geoQuad(G, [-0.03, 0, 0], [0.03, 0, 0], [0.025, -0.01, -0.12], [-0.025, -0.01, -0.12], b, 15, null, 9);
  }
}
let ID_AUTO = 1;
function nuevoAuto(fig, op) {
  const D = fig.datos;
  return Object.assign({
    fig, malla: fig.malla, huesos: new Float32Array(10 * 16), M: M4.nueva(), giroRueda: 0, volante: 0, llave: 0, cara: 0, filaCara: D.fila,
    cab: { yaw: 0, pitch: 0, roll: 0 }, torso: { yaw: 0, roll: 0, salto: 0 }, buf: 0, ladeo: 0, cabeceo: 0, rebote: 0,
    lito: { patron: D.patron, cintura: D.cintura, c2v: col3(D.c2), c3v: col3(D.c3), desgaste: D.desgaste, brillo: D.brillo || 0 },
    id: ID_AUTO++, tinte: null, fantasma: false, oculto: false, gesto: 0, hablando: false, parpadeo: rnd(1, 4),
  }, op || {});
}
// arma los huesos a partir de la matriz del mundo (a.M) y el estado de animación
const _hm = M4.nueva(), _hc = M4.nueva(), _ht = M4.nueva(), _hh = M4.nueva(), _hb = M4.nueva(), _h9 = M4.nueva();
function posarAuto(a, t) {
  const H = a.huesos, inf = a.fig.info, M = _hm;
  M4.copiar(M, a.M);
  M4.mover(M, 0, a.rebote || 0, 0);
  M4.rotZ(M, a.ladeo || 0); M4.rotX(M, a.cabeceo || 0);
  H.set(M, 0);
  const B = (i, fn) => { const q = _hc; M4.copiar(q, M); fn(q); H.set(q, i * 16); };
  for (let i = 0; i < 4; i++) {
    const [x, y, z] = inf.ruedas[i];
    B(i + 1, q => { M4.mover(q, x, y - (a.rebote || 0) * 0.6, z); if (i < 2) M4.rotY(q, a.volante); M4.rotX(q, a.giroRueda); });
  }
  const [kx, ky, kz] = inf.llave;
  B(5, q => { M4.mover(q, kx, ky, kz); M4.rotZ(q, a.llave); });
  const [sx, sy, sz] = inf.asiento, T = a.torso, C = a.cab;
  const qt = _ht;
  M4.copiar(qt, M); M4.mover(qt, sx, sy + (T.salto || 0), sz); M4.rotY(qt, T.yaw); M4.rotZ(qt, T.roll); H.set(qt, 6 * 16);
  const qh = _hh;
  M4.copiar(qh, qt); M4.mover(qh, 0, 0.16, 0.0); M4.rotY(qh, C.yaw); M4.rotX(qh, C.pitch); M4.rotZ(qh, C.roll); H.set(qh, 7 * 16);
  const qb = _hb;
  if (a.fig.datos.cabeza === 'robot') { M4.copiar(qb, qh); M4.mover(qb, 0, 0.15, 0); M4.rotZ(qb, Math.sin(t * 7) * 0.25 + a.buf * 0.3); M4.rotX(qb, -a.buf * 0.4); }
  else { M4.copiar(qb, qt); M4.mover(qb, 0, 0.155, 0); M4.rotX(qb, 0.25 + a.buf * 0.25 + Math.sin(t * 13) * 0.08 * (0.3 + a.buf)); }
  H.set(qb, 8 * 16);
  const q9 = _h9; M4.copiar(q9, qb); M4.mover(q9, 0, -0.01, -0.15); M4.rotX(q9, -0.2 + Math.sin(t * 17 + 1) * 0.35 * (0.3 + a.buf)); M4.rotY(q9, Math.sin(t * 11) * 0.3 * a.buf);
  H.set(q9, 9 * 16);
  // la cara: parpadeo de vez en cuando, boca que se mueve al hablar
  a.parpadeo -= DT;
  let g = a.gesto;
  if (a.parpadeo < 0) { if (a.parpadeo < -0.12) a.parpadeo = rnd(1.8, 4.5); else if (g === 0) g = 1; }
  a.cara = g * 2 + (a.hablando && Math.sin(t * 22) > 0 ? 1 : 0);
}
// matriz del mundo desde una posición y tres ejes (izquierda, arriba, adelante)
function matAuto(M, x, y, z, ix, iy, iz, ux, uy, uz, fx, fy, fz) {
  M[0] = ix; M[1] = iy; M[2] = iz; M[3] = 0; M[4] = ux; M[5] = uy; M[6] = uz; M[7] = 0; M[8] = fx; M[9] = fy; M[10] = fz; M[11] = 0; M[12] = x; M[13] = y; M[14] = z; M[15] = 1;
  return M;
}
function matAutoYaw(M, x, y, z, yaw) { const s = Math.sin(yaw), c = Math.cos(yaw); return matAuto(M, x, y, z, c, 0, -s, 0, 1, 0, s, 0, c); }

// ---------- las cosas de la pista (mallas para dibujar de a muchas) ----------
function mallaCajita() {
  const G = nuevaGeo(false), papel = cc('#ffffff'), cinta = cc('#ffd23f');
  geoElipsoide(G, 0, 0.2, 0, 0.2, 0.2, 0.2, papel, { e: 0.25, flag: 1, nu: 16, nv: 12 });
  geoCaja(G, -0.205, 0.0, -0.045, 0.205, 0.41, 0.045, cinta, 2);
  geoCaja(G, -0.045, 0.0, -0.205, 0.045, 0.41, 0.205, cinta, 2);
  for (const s of [1, -1]) geoElipsoide(G, s * 0.07, 0.45, 0, 0.08, 0.05, 0.035, cinta, { flag: 2, nu: 10, nv: 6 });
  geoElipsoide(G, 0, 0.27, 0.22, 0.07, 0.07, 0.01, cc('#1b1a2e'), { flag: 0, nu: 10, nv: 6 });
  return geoEmpacar(G);
}
function mallaTornillo() {
  const G = nuevaGeo(false), m = cc('#dfe3ea');
  geoTorno(G, [[0, -0.02], [0.04, 0.0], [0.05, 0.15], [0.12, 0.17], [0.11, 0.2], [0, 0.2]], m, { nu: 12, flag: 2 });
  geoCaja(G, -0.09, 0.2, -0.015, 0.09, 0.212, 0.015, cc('#30343c'), 0);
  return geoEmpacar(G);
}
function mallaCanica() { const G = nuevaGeo(false); geoElipsoide(G, 0, 0.16, 0, 0.16, 0.16, 0.16, cc('#f0f6ff'), { flag: 7, nu: 14, nv: 10 }); geoElipsoide(G, 0, 0.16, 0, 0.07, 0.11, 0.03, cc('#ff5a3a'), { flag: 8, nu: 8, nv: 6 }); return geoEmpacar(G); }
function mallaBoton() {
  const G = nuevaGeo(false), c = cc('#ffffff');
  geoTorno(G, [[0, 0.0], [0.24, 0.0], [0.24, 0.035], [0.2, 0.05], [0, 0.05]], c, { nu: 18, flag: 1 });
  for (const [x, z] of [[0.05, 0.05], [-0.05, 0.05], [0.05, -0.05], [-0.05, -0.05]]) geoElipsoide(G, x, 0.052, z, 0.022, 0.004, 0.022, cc('#1b1a2e'), { flag: 0, nu: 8, nv: 4 });
  return geoEmpacar(G);
}
function mallaPompa() { const G = nuevaGeo(false); geoElipsoide(G, 0, 0.45, 0, 0.62, 0.55, 0.72, cc('#ffffff'), { flag: 9, nu: 18, nv: 12 }); return geoEmpacar(G); }
function mallaResorte() {
  const G = nuevaGeo(false), pts = [];
  for (let i = 0; i <= 60; i++) { const a = i / 60 * 5 * TAU; pts.push([Math.cos(a) * 0.12, 0.02 + i / 60 * 0.3, Math.sin(a) * 0.12]); }
  geoTubo(G, pts, 0.018, cc('#dfe3ea'), 2, { nu: 5 });
  return geoEmpacar(G);
}
function mallaChispa() { const G = nuevaGeo(false); geoElipsoide(G, 0, 0, 0, 0.05, 0.05, 0.05, cc('#ffd23f'), { flag: 8, nu: 6, nv: 4 }); return geoEmpacar(G); }
function mallaGancho() {
  const G = nuevaGeo(false), m = cc('#c9ced8');
  geoTubo(G, [[0, 0.62, 0], [0, 6, 0]], 0.03, cc('#3a3a44'), 0, { nu: 5 });
  geoElipsoide(G, 0, 0.7, 0, 0.09, 0.12, 0.09, cc('#d8352a'), { flag: 13, nu: 8, nv: 6 });
  const pts = []; for (let k = 0; k <= 16; k++) { const a = -0.3 + k / 16 * 3.6; pts.push([Math.sin(a) * 0.14, 0.45 - (1 - Math.cos(a)) * 0.0 - Math.cos(a) * 0.12, 0]); }
  geoTubo(G, pts, 0.025, m, 2, { nu: 6 });
  return geoEmpacar(G);
}
function mallaLocomotora() {
  const G = nuevaGeo(false), r = cc('#d8352a'), n = cc('#1b1a2e'), o = cc('#d9a441');
  geoCaja(G, -0.55, 0.25, -1.2, 0.55, 0.45, 1.3, n, 19);
  conT(lugar(0, 0.9, 0.35, 0, 1, 1, 1, PI / 2), () => geoTorno(G, [[0, -0.95], [0.45, -0.95], [0.45, 0.95], [0, 0.95]], r, { nu: 14, flag: 19 }));
  geoCaja(G, -0.55, 0.45, -1.2, 0.55, 1.75, -0.35, r, 19); geoCaja(G, -0.65, 1.75, -1.3, 0.65, 1.88, -0.25, n, 19);
  geoCilindro(G, 0, 1.3, 1.0, 0.16, 0.7, n, 19, { nu: 10 }); geoCilindro(G, 0, 1.3, 0.3, 0.2, 0.25, o, 2, { nu: 10 });
  for (const z of [-0.8, 0, 0.8]) for (const s of [-1, 1]) conT(lugar(s * 0.58, 0.32, z, 0, 1, 1, 1, 0, PI / 2), () => geoTorno(G, [[0, -0.06], [0.3, -0.06], [0.3, 0.06], [0, 0.06]], o, { nu: 12, flag: 2 }));
  geoElipsoide(G, 0, 0.9, 1.32, 0.16, 0.16, 0.05, cc('#fff4c0'), { flag: 8, nu: 10, nv: 6 });
  return geoEmpacar(G);
}
function mallaVagon() {
  const G = nuevaGeo(false), c = cc('#ffffff'), n = cc('#1b1a2e'), o = cc('#d9a441');
  geoCaja(G, -0.55, 0.25, -1.0, 0.55, 0.42, 1.0, n, 19);
  geoCaja(G, -0.5, 0.42, -0.9, 0.5, 1.3, 0.9, c, 1, {});
  geoCaja(G, -0.6, 1.3, -1.0, 0.6, 1.4, 1.0, n, 19);
  for (const z of [-0.6, 0.6]) for (const s of [-1, 1]) conT(lugar(s * 0.58, 0.3, z, 0, 1, 1, 1, 0, PI / 2), () => geoTorno(G, [[0, -0.05], [0.25, -0.05], [0.25, 0.05], [0, 0.05]], o, { nu: 12, flag: 2 }));
  return geoEmpacar(G);
}
function prepararInstancias() {
  R.ponerInst('cajita', mallaCajita()); R.ponerInst('tornillo', mallaTornillo()); R.ponerInst('canica', mallaCanica()); R.ponerInst('boton', mallaBoton());
  R.ponerInst('pompa', mallaPompa()); R.insts.pompa.sinSombra = true; R.ponerInst('resorte', mallaResorte()); R.ponerInst('gancho', mallaGancho());
  R.ponerInst('locomotora', mallaLocomotora()); R.ponerInst('vagon', mallaVagon());
}
