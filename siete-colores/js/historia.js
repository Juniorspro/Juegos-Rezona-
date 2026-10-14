// SIETE COLORES — la historia: la gente de la quebrada, los siete desafíos, las plumas, los diálogos y las cinemáticas.
// Colores: 0 rojo · 1 naranja · 2 amarillo · 3 verde · 4 turquesa · 5 violeta · 6 rosa (grupo de cubos = índice + 1)
const COLORES = ['#e04a3a', '#f08a3a', '#f0c84a', '#6ab85a', '#3ac0b8', '#a060d0', '#f090b0'];
const NOMBRE_COLOR = ['rojo', 'naranja', 'amarillo', 'verde', 'turquesa', 'violeta', 'rosa'];
let ENT = [];          // gente y animales
let OBJ = [];          // cosas para juntar (ovillos, plumas, colores)
let DLG = null;        // diálogo en curso
let CINE = null;       // cinemática en curso
let ACT = null;        // desafío activo con su estado (vicuña, huancas, Pujllay)
const HUANCAS = [];    // las cuatro piedras del pucará
const CANCION = [2, 0, 3, 1];

function ent(id, fig, x, z, yaw, o) {
  const y = o && o.y != null ? o.y : sueloEn(x, z, o && o.desde);
  const e = Object.assign({ id, fig, x, y, z, yaw: yaw || 0, est: 'quieto', habla: null, radio: 2.4, vis: true, cuad: /vicuna|llama|mula/.test(fig) }, o || {});
  e.y = y; e.mun = nuevoMuneco(fig, x, y, z, e.yaw);
  ENT.push(e);
  return e;
}
const entDe = id => ENT.find(e => e.id === id);
function objeto(id, tipo, x, y, z, o) { const ob = Object.assign({ id, tipo, x, y, z, vis: true, t: Math.random() * 6 }, o || {}); OBJ.push(ob); return ob; }
const objDe = id => OBJ.find(o => o.id === id);

// las plumas de cóndor escondidas (cada una suma una pluma para trepar y aletear)
const PLUMAS = [
  ['p1', 83.5, 20.6, 131.5], ['p2', 170.5, 0, 116.5], ['p3', 25.5, 0, 109.5], ['p4', 33.5, 0, 26.5], ['p5', 172.5, 0, 23.5],
  ['p6', 8.5, 23, 168.5], ['p7', 150.5, 0, 176.5], ['p8', 62.5, 0, 127.5], ['p9', 112.5, 0, 75.5], ['p10', 178.5, 0, 60.5],
];
function armarHistoria() {
  ENT = []; OBJ = []; HUANCAS.length = 0;
  const [cx, cz] = SITIOS.casa;
  ent('abuela', 'abuela', cx + 4.5, cz + 3.5, 0, { est: 'teje', nombre: 'n_abuela', voz: 0.8 });
  ent('arriero', 'arriero', 136.5, 115.5, -Math.PI / 2, { nombre: 'n_arriero', voz: 0.7 });
  ent('mula', 'mula', 137.5, 112.5, -2.2);
  ent('flor', 'nina', 141.5, 150.5, -2.4, { nombre: 'n_flor', voz: 1.15 });
  ent('tomas', 'tomas', 103.5, 125.5, Math.PI, { nombre: 'n_tomas', voz: 1.4 });
  ent('lucia', 'lucia', 113.5, 103.5, 0, { desde: 20, nombre: 'n_lucia', voz: 1.45, escondido: true });
  ent('pedro', 'pedro', 82.5, 117.5, Math.PI / 2, { desde: 13, nombre: 'n_pedro', voz: 1.35, escondido: true });
  ent('rosa', 'rosa', 98.5, 152.5, 0.6, { nombre: 'n_rosa', voz: 1.5, escondido: true });
  ent('fermin', 'fermin', SITIOS.pucara[0] + 3.5, SITIOS.pucara[1] + 2.5, -2.4, { desde: 40, est: 'toca', nombre: 'n_fermin', voz: 0.75 });
  ent('coquena', 'coquena', 148.5, 46.5, 2.6, { desde: 40, nombre: 'n_coquena', voz: 0.9 });
  ent('tito', 'tito', SITIOS.estacion[0] + 1.5, SITIOS.estacion[1] - 1.5, Math.PI, { desde: 30, nombre: 'n_tito', voz: 0.95 });
  ent('pujllay', 'pujllay', 100.5, 116.5, 0, { nombre: 'n_pujllay', voz: 1.25, vis: false });
  // animales
  ent('llama1', 'llama', 100.5, 149.5, 0.4); ent('llama2', 'llamaMarron', 104.5, 151.5, -1.2);
  for (let k = 0; k < 5; k++) ent('vic' + k, 'vicuna', 156.5 + k * 3.1, 40.5 + (k % 2) * 4, k * 1.3, { desde: 40, manada: true });
  ent('vicBlanca', 'vicunaBlanca', 152.5, 40.5, 0.5, { desde: 40, nombre: 'n_vicuna' });
  // ovillos rojos del arriero
  objeto('ov1', 'ovillo', 158.5, 0, 104.5);
  objeto('ov2', 'ovillo', 172.5, 12, 131.5);
  objeto('ov3', 'ovillo', 147.5, 0, 129.5, { desde: 40 });
  // los colores que se ven desde el principio (los otros aparecen al resolver)
  objeto('c1', 'color', SITIOS.cardonal[0] + 0.5, 0, SITIOS.cardonal[1] + 0.5, { color: 1, desde: 50 });
  objeto('c5', 'color', 36.5, 24.6, 168.5, { color: 5 });
  for (const [id, x, y, z] of PLUMAS) objeto(id, 'pluma', x, y || 0, z, { desde: y ? y + 1 : 60 });
  // las huancas alrededor de la Piedra del Sol
  const [px, pz] = SITIOS.pucara;
  [[0, -4], [4, 0], [0, 4], [-4, 0]].forEach(([dx, dz], i) => HUANCAS.push({ i, x: px + 0.5 + dx, z: pz + 0.5 + dz, y: sueloEn(px + dx, pz + dz, 40), luz: 0 }));
  for (const o of OBJ) if (!o.y) o.y = sueloEn(o.x, o.z, o.desde) + 0.55;
  for (const o of OBJ) if (o.tipo === 'ovillo' && o.id === 'ov2') o.y = 12.55;
  aplicarEstado();
}
// lo que ya pasó (al cargar una partida) se refleja en el mundo
function aplicarEstado() {
  for (let i = 0; i < 7; i++) R.sat[i + 1] = G.colores[i] ? 1 : 0;
  for (const o of OBJ) {
    if (o.tipo === 'pluma') o.vis = !G.plumas[o.id];
    if (o.tipo === 'ovillo') o.vis = !!G.flags.rojoIni && !G.ovillos[o.id] && !G.colores[0];
    if (o.tipo === 'color') o.vis = !G.colores[o.color] && (o.color !== 5 || !!G.flags.violetaIni) && (o.color !== 1 || !!G.flags.naranjaIni);
  }
  for (const id of ['lucia', 'pedro', 'rosa']) {
    const e = entDe(id);
    if (G.chicos[id] || G.colores[2]) { const p = { lucia: [101.5, 120.5], pedro: [104.5, 119.5], rosa: [102.5, 117.5] }[id]; e.x = p[0]; e.z = p[1]; e.y = 11; e.escondido = false; e.yaw = Math.PI; }
  }
  if (G.flags.verde) abrirPiedraSol(true);
  J.estamMax = FIS.ESTAM0 + Object.keys(G.plumas).length;
  const pj = entDe('pujllay');
  pj.vis = false;
  if (G.colores.filter(Boolean).length >= 6 && !G.colores[6]) { const [cx, cz] = SITIOS.cerro; pj.x = cx + 0.5; pj.z = cz + 0.5; pj.y = sueloEn(cx, cz, 62); pj.vis = true; }
  diaSegun();
}
// la hora: arranca a media tarde y baja hacia el atardecer con cada color
function diaSegun(k) {
  const n = k != null ? k : G.colores.filter(Boolean).length;
  const f = n / 7, el = lerp(40, 14, f) * Math.PI / 180, az = lerp(-2.25, -1.95, f);
  R.sol.dir = [Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az)];
  const c0 = [3.1, 2.5, 1.85], c1 = [3.0, 2.08, 1.42];
  R.sol.col = c0.map((v, i) => lerp(v, c1[i], f));
  R.cielo.cenit = [lerp(0.12, 0.2, f), lerp(0.3, 0.22, f), lerp(0.8, 0.6, f)];
  R.cielo.horiz = [lerp(0.8, 0.94, f), lerp(0.7, 0.68, f), lerp(0.66, 0.64, f)];
  R.niebla.col = [lerp(0.84, 0.88, f), lerp(0.72, 0.68, f), lerp(0.64, 0.66, f)];
  R.niebla.sol = [lerp(1.25, 1.4, f), lerp(0.85, 0.78, f), lerp(0.55, 0.5, f)];
  R.amb.a = [lerp(0.3, 0.3, f), lerp(0.38, 0.3, f), lerp(0.56, 0.5, f)];
}
function nColores() { return G.colores.filter(Boolean).length; }

// ---------- diálogos ----------
// linea: [quien, clave] (quien: id de entidad o 'killa'); fin: función al terminar
function decir(lineas, fin, o) {
  DLG = Object.assign({ lineas, i: 0, t: 0, fin, letras: 0 }, o || {});
  const q = lineas[0][0];
  const e = q === 'killa' ? null : entDe(q);
  if (e) { e.yawAntes = e.yaw; }
  Sonido.dialogo();
}
function avanzarDialogo() {
  const D = DLG;
  if (!D) return;
  const txt = tr(D.lineas[D.i][1]);
  if (D.letras < txt.length) { D.letras = txt.length; return; }
  if (D.i < D.lineas.length - 1) { D.i++; D.t = 0; D.letras = 0; Sonido.dialogo(); return; }
  DLG = null;
  for (const e of ENT) if (e.yawAntes != null) { e.yaw = e.yawAntes; e.yawAntes = null; }
  if (D.fin) D.fin();
}
function quienHabla() { return DLG ? DLG.lineas[DLG.i][0] : null; }

// ---------- con quién se puede hablar acá ----------
function hablable() {
  if (DLG || CINE) return null;
  let mejor = null, md = 1e9;
  for (const e of ENT) {
    if (!e.vis || !e.nombre || e.manada) continue;
    const d = Math.hypot(e.x - J.x, e.z - J.z), dy = Math.abs(e.y - J.y);
    if (d < e.radio && dy < 2.2 && d < md) { md = d; mejor = e; }
  }
  if (mejor) return mejor;
  // la piedra chica de las huancas
  if (G.flags.verdeIni && !G.flags.verde) { const [px, pz] = SITIOS.pucara; if (Math.hypot(px + 2.5 - J.x, pz - 2.5 - J.z) < 2 && Math.abs(J.y - 29) < 2) return { id: 'tablilla' }; }
  return null;
}
function hablarCon(e) {
  if (!e) return;
  if (e.id !== 'tablilla') { e.yawAntes = e.yaw; e.yaw = Math.atan2(J.x - e.x, J.z - e.z); J.yaw = Math.atan2(e.x - J.x, e.z - J.z); }
  const f = G.flags;
  switch (e.id) {
    case 'abuela':
      if (nColores() >= 6 && !G.colores[6]) decir([['abuela', 'a_cumbre']]);
      else if (G.fin) decir([['abuela', 'a_fin']]);
      else decir([['abuela', nColores() ? 'a_animo' : 'a_plaza']]);
      break;
    case 'arriero':
      if (G.colores[0]) decir([['arriero', 'r_gracias']]);
      else if (!f.rojoIni) decir([['arriero', 'r_1'], ['arriero', 'r_2'], ['killa', 'k_dale']], () => { f.rojoIni = 1; aplicarEstado(); mision(0); ayuda('h_trepar'); guardar(); });
      else if (Object.keys(G.ovillos).length >= 3) decir([['arriero', 'r_4']], () => darColor(0, e));
      else decir([['arriero', 'r_3']]);
      break;
    case 'flor':
      if (G.colores[1]) decir([['flor', 'n_4']]);
      else if (!f.naranjaIni) decir([['flor', 'n_1'], ['flor', 'n_2'], ['killa', 'k_dale']], () => { f.naranjaIni = 1; aplicarEstado(); mision(1); ayuda('h_planear'); guardar(); });
      else decir([['flor', 'n_3']]);
      break;
    case 'tomas':
      if (G.colores[2]) decir([['tomas', 't_5']]);
      else if (!f.amarilloIni) decir([['tomas', 't_1'], ['tomas', 't_2'], ['killa', 'k_dale']], () => { f.amarilloIni = 1; mision(2); guardar(); });
      else if (Object.keys(G.chicos).length >= 3) decir([['tomas', 't_4']], () => darColor(2, e));
      else decir([['tomas', tr('t_3', 3 - Object.keys(G.chicos).length) ? 't_3' : 't_3']], null, { arg: 3 - Object.keys(G.chicos).length });
      break;
    case 'lucia': case 'pedro': case 'rosa':
      if (e.escondido && f.amarilloIni) {
        decir([[e.id, 'e_' + e.id]], () => { G.chicos[e.id] = 1; e.escondido = false; e.volver = { lucia: [101.5, 120.5], pedro: [104.5, 119.5], rosa: [102.5, 117.5] }[e.id]; Sonido.encontrado(); guardar(); if (Object.keys(G.chicos).length >= 3) ayudaObj('o_volverTomas'); });
      } else if (e.escondido) decir([[e.id, 'e_shh']]);
      else decir([[e.id, G.colores[2] ? 'e_gracias' : 'e_espera']]);
      break;
    case 'fermin':
      if (f.verde) decir([['fermin', 'f_5']]);
      else if (!f.verdeIni) decir([['fermin', 'f_1'], ['fermin', 'f_2'], ['killa', 'k_dale']], () => { f.verdeIni = 1; mision(3); guardar(); });
      else decir([['fermin', 'f_6']]);
      break;
    case 'tablilla': tocarCancion(); break;
    case 'coquena':
      if (G.colores[4]) decir([['coquena', 'c_4']]);
      else if (!f.turquesaIni) decir([['coquena', 'c_1'], ['coquena', 'c_2'], ['killa', 'k_dale']], () => { f.turquesaIni = 1; mision(4); empezarVicuna(); guardar(); });
      else { decir([['coquena', 'c_3']]); if (!ACT || ACT.tipo !== 'vicuna') empezarVicuna(); }
      break;
    case 'tito':
      if (G.colores[5]) decir([['tito', 'v_4']]);
      else if (!f.violetaIni) decir([['tito', 'v_1'], ['tito', 'v_2'], ['killa', 'k_dale']], () => { f.violetaIni = 1; aplicarEstado(); mision(5); guardar(); });
      else decir([['tito', 'v_3']]);
      break;
    case 'pujllay':
      if (!G.colores[6] && nColores() >= 6 && (!ACT || ACT.tipo !== 'pujllay')) decir([['pujllay', 'j_cumbre1'], ['pujllay', 'j_cumbre2']], () => empezarPujllay());
      break;
    case 'vicBlanca': break;
  }
}
function ayuda(k) { BAN = { k, t: 0, dur: 5 }; }
function ayudaObj(k) { G.objetivo = k; OBJT.t = 0; }
const OBJT = { t: 99 };
let BAN = null;
// el objetivo del momento (lo que dice el banderín de arriba)
function objetivoActual() {
  if (!G.flags.ini) return 'o_abuela';
  if (G.fin) return G.colores.every(Boolean) && Object.keys(G.plumas).length < 10 ? 'o_plumas' : 'o_libre';
  if (ACT && ACT.tipo === 'pujllay') return 'o_atrapar';
  if (nColores() >= 6) return 'o_cumbre';
  if (ACT && ACT.tipo === 'vicuna') return 'o_vicuna';
  if (G.objetivo) return G.objetivo;
  return 'o_buscar';
}
function mision(i) { G.objetivo = 'o_m' + i; OBJT.t = 0; }

// ---------- recoger ----------
function revisarObjetos(dt) {
  for (const o of OBJ) {
    if (!o.vis) continue;
    o.t += dt;
    const d = Math.hypot(o.x - J.x, o.z - J.z), dy = o.y - (J.y + 0.7);
    if (d < 1.0 && Math.abs(dy) < 1.3) tomar(o);
  }
}
function tomar(o) {
  o.vis = false;
  if (o.tipo === 'pluma') {
    G.plumas[o.id] = 1; J.estamMax = FIS.ESTAM0 + Object.keys(G.plumas).length; J.estam = J.estamMax;
    Sonido.pluma(); vibrar(25); chispas(o.x, o.y, o.z, '#ffffff', 16);
    TOAST = { k: 'toast_pluma', a: Object.keys(G.plumas).length, t: 0 };
  } else if (o.tipo === 'ovillo') {
    G.ovillos[o.id] = 1; Sonido.ovillo(); chispas(o.x, o.y, o.z, '#e04a3a', 12);
    const n = Object.keys(G.ovillos).length;
    TOAST = { k: 'toast_ovillo', a: n, t: 0 };
    if (n >= 3) ayudaObj('o_volverArriero');
  } else if (o.tipo === 'color') { darColor(o.color, null, o); }
  guardar();
}

// ---------- devolver un color: la ola que pinta los cerros ----------
function darColor(i, quien, ob) {
  if (G.colores[i]) return;
  G.colores[i] = true; G.objetivo = null;
  const x = ob ? ob.x : J.x, y = ob ? ob.y : J.y + 1, z = ob ? ob.z : J.z;
  CINE = { tipo: 'color', i, t: 0, x, y, z, dur: 6.2 };
  Sonido.color(i); vibrar([30, 60, 30]);
  chispas(x, y, z, COLORES[i], 40);
  guardar();
}
function pasoCineColor(C, dt) {
  C.t += dt;
  const [cx, cz] = SITIOS.cerro;
  // 1) la gota sube y viaja al cerro  2) la ola sale de la cumbre y pinta todo
  if (C.t < 1.6) {
    const k = suave(C.t / 1.6);
    C.gx = lerp(C.x, cx, k); C.gz = lerp(C.z, cz, k); C.gy = lerp(C.y, 60, Math.sin(k * Math.PI / 2));
    if (Math.random() < 0.7) chispas(C.gx, C.gy, C.gz, COLORES[C.i], 2);
  } else {
    if (!C.ola) { C.ola = true; R.olaG = C.i + 1; Sonido.ola(); CAMJ.temblor = 0.6; vibrar(40); }
    const r = (C.t - 1.6) * 62;
    R.ola = [cx, 45, cz, r];
  }
  if (C.t >= C.dur) {
    R.sat[C.i + 1] = 1; R.olaG = -1; R.ola[3] = -1; CINE = null;
    diaSegun();
    const n = nColores();
    TOAST = { k: 'toast_color', a: tr('col_' + NOMBRE_COLOR[C.i]), b: n, t: 0 };
    if (n === 6 && !G.colores[6]) cinePujllayCumbre();
    else if (n === 7) cineFinal();
  }
}

// ---------- el Pujllay ----------
function cinePujllayPlaza() {
  const pj = entDe('pujllay'), [cx, cz] = SITIOS.plaza;
  // aparece delante de Killa, del lado de la plaza (que el algarrobo no lo tape)
  const dx = cx - J.x, dz = cz - J.z, d = Math.hypot(dx, dz) || 1;
  let px = J.x + dx / d * 4.2 - dz / d * 1.2, pz = J.z + dz / d * 4.2 + dx / d * 1.2;
  if (Math.hypot(px - cx, pz - cz) < 4.5) { px = J.x + dx / d * 3; pz = J.z + dz / d * 3; }
  pj.x = px; pj.z = pz; pj.y = sueloEn(px, pz, J.y + 3); pj.vis = true; pj.est = 'festeja'; pj.yaw = Math.atan2(J.x - pj.x, J.z - pj.z);
  talco(pj.x, pj.y + 0.8, pj.z, 30); Sonido.pujllay();
  decir([['pujllay', 'j_1'], ['pujllay', 'j_2'], ['killa', 'k_oye'], ['pujllay', 'j_3']], () => {
    talco(pj.x, pj.y + 0.8, pj.z, 40); pj.vis = false; Sonido.pujllay(); G.flags.plaza = 1; guardar();
  });
}
function cinePujllayCumbre() {
  const pj = entDe('pujllay'), [cx, cz] = SITIOS.cerro;
  pj.x = cx + 0.5; pj.z = cz + 0.5; pj.y = sueloEn(cx, cz, 62); pj.vis = true; pj.est = 'festeja';
  CINE = { tipo: 'mirar', t: 0, dur: 3.5, x: pj.x, y: pj.y + 1, z: pj.z, fin: () => decir([['pujllay', 'j_seis']], () => ayudaObj('o_cumbre')) };
  Sonido.pujllay();
}
function empezarPujllay() {
  const [cx, cz] = SITIOS.cerro;
  const puntos = [[cx - 4, cz - 3], [cx + 4, cz - 2], [cx + 3, cz + 4], [cx - 3, cz + 4], [cx, cz - 6], [cx, cz]];
  ACT = { tipo: 'pujllay', toques: 0, puntos, i: 5, t: 0, salto: null, cd: 0 };
  Sonido.musica(2);
}
function pasoPujllay(dt) {
  const A = ACT, pj = entDe('pujllay');
  A.cd = Math.max(0, A.cd - dt);
  if (A.salto) {
    const s = A.salto; s.t += dt / s.dur;
    const k = Math.min(1, s.t);
    pj.x = lerp(s.x0, s.x1, k); pj.z = lerp(s.z0, s.z1, k); pj.y = lerp(s.y0, s.y1, k) + Math.sin(k * Math.PI) * 2.6;
    pj.est = 'salta';
    if (k >= 1) { A.salto = null; pj.est = 'festeja'; talco(pj.x, pj.y, pj.z, 6); A.descanso = 1.6 - A.toques * 0.2; }
    return;
  }
  A.descanso = Math.max(0, (A.descanso || 0) - dt);
  pj.yaw = Math.atan2(J.x - pj.x, J.z - pj.z);
  const d = Math.hypot(pj.x - J.x, pj.z - J.z);
  if (d < 1.5 && Math.abs(pj.y - J.y) < 1.8 && A.cd <= 0) {
    A.toques++; A.cd = 0.8; Sonido.toque(); vibrar(30); talco(pj.x, pj.y + 1, pj.z, 25);
    if (A.toques >= 3) {
      ACT = null; pj.est = 'quieto';
      decir([['pujllay', 'j_gane1'], ['pujllay', 'j_gane2']], () => { pj.est = 'festeja'; darColor(6, pj, { x: pj.x, y: pj.y + 1.5, z: pj.z }); });
      return;
    }
    burbuja(['j_ay1', 'j_ay2'][A.toques - 1], pj);
  }
  // si te acercás (y ya descansó), salta a otra piedra; recién tocado, se escapa enseguida
  if ((d < 2.8 && A.descanso <= 0) || A.cd > 0.5) {
    let mej = -1, md = -1;
    A.puntos.forEach(([x, z], i) => { if (i === A.i) return; const dd = Math.hypot(x + 0.5 - J.x, z + 0.5 - J.z); if (dd > md) { md = dd; mej = i; } });
    if (A.toques >= 1 && Math.random() < 0.35) mej = (A.i + 2) % A.puntos.length;
    const [x, z] = A.puntos[mej];
    A.salto = { t: 0, dur: 0.75 + A.toques * 0.08, x0: pj.x, z0: pj.z, y0: pj.y, x1: x + 0.5, z1: z + 0.5, y1: sueloEn(x, z, 62) };
    A.i = mej; Sonido.saltito();
  }
}

// ---------- la vicuña blanca ----------
const RUTA_VICUNA = [[152.5, 40.5], [160.5, 33.5], [158.5, 22.5], [166.5, 16.5], [176.5, 28.5], [168.5, 34.5]];
function empezarVicuna() {
  const v = entDe('vicBlanca');
  ACT = { tipo: 'vicuna', toques: 0, i: 0, corre: false, cd: 0 };
  v.x = RUTA_VICUNA[0][0]; v.z = RUTA_VICUNA[0][1]; v.y = sueloEn(v.x, v.z, 40);
}
function pasoVicuna(dt) {
  const A = ACT, v = entDe('vicBlanca');
  A.cd = Math.max(0, A.cd - dt);
  const d = Math.hypot(v.x - J.x, v.z - J.z);
  if (d < 1.7 && Math.abs(v.y - J.y) < 2 && A.cd <= 0) {
    A.toques++; A.cd = 1; Sonido.toque(); vibrar(30); chispas(v.x, v.y + 1, v.z, COLORES[4], 14);
    if (A.toques >= 3) {
      ACT = null; v.est = 'quieto';
      decir([['coquena', 'c_bien']], () => darColor(4, v, { x: v.x, y: v.y + 1.2, z: v.z }));
      return;
    }
    burbuja('vic_' + A.toques, v);
    A.corre = true; A.i = (A.i + 1) % RUTA_VICUNA.length;
  }
  if (!A.corre && d < 5.5) { A.corre = true; A.i = (A.i + 1) % RUTA_VICUNA.length; }
  if (A.corre) {
    const [tx, tz] = RUTA_VICUNA[A.i], dx = tx - v.x, dz = tz - v.z, dd = Math.hypot(dx, dz);
    const vel = 5.1 + A.toques * 0.25;
    if (dd < 0.4) { A.corre = false; v.est = 'quieto'; }
    else { v.x += dx / dd * vel * dt; v.z += dz / dd * vel * dt; v.yaw = Math.atan2(dx, dz); v.est = 'corre'; v.y += (sueloEn(v.x, v.z, v.y + 2) - v.y) * Math.min(1, dt * 12); }
  } else { v.yaw = Math.atan2(J.x - v.x, J.z - v.z); }
}

// ---------- las huancas ----------
function tocarCancion() {
  if (ACT && ACT.tipo === 'huancas' && ACT.mostrando) return;
  ACT = { tipo: 'huancas', mostrando: true, t: 0, paso: 0, pisadas: [], sobre: -1 };
  Sonido.piedra();
}
function pasoHuancas(dt) {
  const A = ACT;
  for (const h of HUANCAS) h.luz = Math.max(0, h.luz - dt * 1.6);
  if (A.mostrando) {
    A.t += dt;
    const k = Math.floor((A.t - 0.6) / 0.85);
    if (k >= 0 && k < 4 && k !== A.paso - 1 + 1 && A.ultimo !== k) { A.ultimo = k; HUANCAS[CANCION[k]].luz = 1; Sonido.huanca(CANCION[k]); }
    if (A.t > 0.6 + 4 * 0.85 + 0.3) { A.mostrando = false; A.pisadas = []; }
    return;
  }
  // pisar
  let sobre = -1;
  for (const h of HUANCAS) if (Math.hypot(h.x - J.x, h.z - J.z) < 0.9 && Math.abs(J.y - h.y) < 0.6 && J.suelo) sobre = h.i;
  if (sobre >= 0 && sobre !== A.sobre) {
    HUANCAS[sobre].luz = 1; Sonido.huanca(sobre);
    A.pisadas.push(sobre);
    const n = A.pisadas.length;
    if (A.pisadas[n - 1] !== CANCION[n - 1]) {
      A.pisadas = []; Sonido.error(); for (const h of HUANCAS) h.luz = 0.6;
      ACT = null; decir([['fermin', 'f_3']]);
    } else if (n === 4) {
      ACT = null; G.flags.verde = 1;
      decir([['fermin', 'f_4']], () => { abrirPiedraSol(false); });
    }
  }
  A.sobre = sobre;
}
function abrirPiedraSol(ya) {
  const [px, pz] = SITIOS.pucara;
  caja(px - 1, 29, pz - 1, px + 1, 31, pz + 1, 0);
  // queda una base con el color arriba
  caja(px - 1, 28, pz - 1, px + 1, 28, pz + 1, B.PIEDRASOL);
  if (typeof rehacerZona === 'function') rehacerZona(px, pz);
  if (!ya) { Sonido.piedraAbre(); CAMJ.temblor = 0.8; talco(px + 0.5, 30, pz + 0.5, 30); }
  if (!G.colores[3] && !objDe('c3')) objeto('c3', 'color', px + 0.5, 29.6, pz + 0.5, { color: 3 });
}

// ---------- el final ----------
function cineFinal() {
  G.fin = true; guardar();
  CINE = { tipo: 'final', t: 0, dur: 22 };
  Sonido.musica(3);
  // todos a la plaza a bailar
  const pl = SITIOS.plaza;
  const lugares = [[96, 118], [104, 118], [96, 126], [104, 126], [99, 115], [101, 129], [93, 122], [107, 122], [97, 121], [103, 123]];
  ['abuela', 'arriero', 'flor', 'tomas', 'lucia', 'pedro', 'rosa', 'fermin', 'tito', 'coquena'].forEach((id, k) => { const e = entDe(id); const [x, z] = lugares[k]; e.x = x + 0.5; e.z = z + 0.5; e.y = 11; e.est = 'baila'; e.yaw = Math.atan2(pl[0] - x, pl[1] - z); e.fiesta = true; });
  const pj = entDe('pujllay'); pj.x = 100.5; pj.z = 119.5; pj.y = 11; pj.vis = true; pj.est = 'baila'; pj.fiesta = true;
}
