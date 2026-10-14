// POTRERO — la historia: la Copa de los Barrios en seis partidos, contada en páginas de historieta. El
// Ingeniero Brizuela quiere hacer un estacionamiento en el potrero; si La Loma gana la copa, el potrero queda
// para el barrio. Cada partido tiene su cancha y su vuelta (charcos, tren, noche, viento, la final).
const toma = (x, z, ang, d, h, ty) => [x + Math.sin(ang) * d, h, z + Math.cos(ang) * d, x, ty == null ? 1.05 : ty, z];
const Ac = (q, x, z, g, c, o) => Object.assign({ q, x, z, g, c }, o || {});
const Gl = (q, k, t, o) => Object.assign({ q, k, t }, o || {});
const PAG = {
  prologo: [
    { cancha: 'potrero', paneles: [
      { cam: toma(0, 6, 0.45, 17, 8, 0.4), fov: 0.9, act: [Ac('juani', 1, 2, 'corre', 'decidido', { yaw: 2.6 }), Ac('rulo', -3, 5, 'corre', 'feliz', { yaw: 2.9 }), Ac('bebe', 4, 7, 'corre', 'feliz', { yaw: -2.8 }), Ac('chacha', -1, 10, 'cintura', 'picaro'), Ac('toto', 0, 16.8, 'arquero', 'decidido', { yaw: PI })], globos: [Gl(null, 'h_p1a', 'narra')], pelota: [1.4, 0.13, 1.6] },
      { cam: toma(0.6, 3, 2.3, 3.3, 1.2, 0.85), act: [Ac('juani', 0.6, 3, 'patea', 'grito', { yaw: 0.25 })], globos: [Gl('juani', 'h_p1b', 'grito')], sfx: [{ k: 't_pum', u: 0.78, v: 0.7 }], pelota: [0.9, 0.4, 3.9] },
      { cam: toma(0, 16.6, -2.6, 4.6, 1.5, 0.9), act: [Ac('toto', -0.4, 16.6, 'estira', 'miedo', { yaw: PI, lado: -1, y: 0.35 })], globos: [Gl('toto', 'h_p1c', 'grito')], pelota: [1.2, 1.3, 17.6] },
    ] },
    { cancha: 'potrero', paneles: [
      { cam: toma(-7.6, -3.8, 2.3, 6.2, 1.9, 1.15), act: [Ac('brizuela', -9.6, -4.4, 'cintura', 'picaro', { hacia: 'juani' }), Ac('juani', -6.2, -2.6, 'quieto', 'sorpresa', { hacia: 'brizuela' }), Ac('rulo', -5.8, -4.9, 'quieto', 'sorpresa', { hacia: 'brizuela' })], globos: [Gl('brizuela', 'h_p2a', 'habla')] },
      { cam: toma(-5.2, -3.4, -1.2, 4.0, 1.45, 1.05), act: [Ac('bebe', -5.7, -4.2, 'susto', 'sorpresa', { yaw: -1.3 }), Ac('chacha', -4.5, -2.5, 'cintura', 'enojado', { yaw: -1.6 }), Ac('juani', -5.3, -2.8, 'puno', 'enojado', { yaw: -1.5 })], globos: [Gl('bebe', 'h_p2b', 'grito'), Gl('chacha', 'h_p2c', 'habla', { abajo: true })] },
      { cam: toma(-9.6, -4.4, 1.25, 2.6, 1.8, 1.6), act: [Ac('brizuela', -9.6, -4.4, 'habla', 'picaro', { yaw: 1.15 })], globos: [Gl('brizuela', 'h_p2d', 'habla')] },
    ] },
    { cancha: 'potrero', paneles: [
      { cam: toma(12.3, 20.2, -1.0, 4.5, 1.7, 1.3), act: [Ac('cacho', 12.4, 20.0, 'senala', 'enojado', { yaw: -1.8 })], globos: [Gl('cacho', 'h_p3a', 'habla')] },
      { cam: toma(8.5, 15.2, -2.5, 5.2, 1.9, 1.0), act: [Ac('cacho', 9.6, 16.4, 'habla', 'normal', { yaw: -2.4 }), Ac('juani', 7.6, 14.8, 'quieto', 'normal', { hacia: 'cacho' }), Ac('rulo', 8.3, 13.8, 'piensa', 'normal', { hacia: 'cacho' }), Ac('chacha', 7.0, 16.0, 'cruzado', 'normal', { hacia: 'cacho' }), Ac('bebe', 9.0, 14.0, 'quieto', 'sorpresa', { hacia: 'cacho' })], globos: [Gl('cacho', 'h_p3b', 'habla')] },
      { cam: toma(-9.6, -4.4, 0.9, 3.2, 1.6, 1.4), act: [Ac('brizuela', -9.6, -4.4, 'cintura', 'feliz', { yaw: 0.9 })], globos: [Gl('brizuela', 'h_p3c', 'grito')], sfx: [{ k: 't_ja', u: 0.2, v: 0.75, c: BLANCO }] },
    ] },
    { cancha: 'potrero', paneles: [
      { cam: toma(0, 0, 0.0, 1.6, 1.42, 1.38), fov: 0.7, act: [Ac('juani', 0, 0, 'puno', 'decidido', { yaw: 0 })], globos: [Gl('juani', 'h_p4a', 'habla')] },
      { cam: toma(0, 0.4, 0.2, 5.4, 1.9, 1.0), act: [Ac('juani', 0, 0, 'fest_brazos', 'grito'), Ac('rulo', -1.4, 0.8, 'fest_brazos', 'feliz'), Ac('bebe', 1.4, 0.8, 'fest_brazos', 'grito'), Ac('chacha', -2.6, -0.4, 'puno', 'feliz'), Ac('toto', 2.7, -0.5, 'saluda', 'feliz'), Ac('cacho', 0.5, -2.2, 'cintura', 'feliz')], globos: [Gl('rulo', 'h_p4b', 'grito'), Gl('cacho', 'h_p4c', 'habla')] },
    ] },
  ],
  d1: [
    { cancha: 'potrero', luz: 'tarde', paneles: [
      { cam: toma(0, 2, 0.3, 6.5, 2, 1.0), act: [Ac('juani', 0, 1.5, 'fest_brazos', 'grito'), Ac('bebe', 1.5, 2.2, 'fest_brazos', 'feliz'), Ac('rulo', -1.5, 2.4, 'puno', 'feliz'), Ac('cacho', 0.4, -0.6, 'cintura', 'feliz')], globos: [Gl('cacho', 'h_d1a', 'habla')] },
      { cam: toma(0.2, 1, -2.4, 3.8, 1.5, 1.2), act: [Ac('juani', 0, 1.5, 'quieto', 'decidido', { hacia: 'cacho' }), Ac('cacho', 0.4, -0.6, 'senala', 'normal', { hacia: 'juani' })], globos: [Gl('juani', 'h_d1b', 'habla'), Gl('cacho', 'h_d1c', 'habla')] },
    ] },
  ],
  a2: [
    { cancha: 'puerto', paneles: [
      { cam: toma(0, 4, 0.9, 14, 6, 0.8), act: [Ac('puerto:4', -1, -2, 'cruzado', 'picaro', { yaw: 0.4 }), Ac('puerto:1', 1.3, -2.8, 'cintura', 'enojado', { yaw: 0.2 }), Ac('juani', 0, 3, 'quieto', 'decidido', { yaw: PI }), Ac('chacha', 1.5, 3.6, 'cintura', 'enojado', { yaw: PI })], globos: [Gl(null, 'h_a2a', 'narra'), Gl('puerto:4', 'h_a2b', 'habla')] },
      { cam: toma(1.5, 3.6, 2.6, 2.6, 1.4, 1.2), act: [Ac('chacha', 1.5, 3.6, 'puno', 'decidido', { yaw: 2.9 })], globos: [Gl('chacha', 'h_a2c', 'habla')] },
    ] },
  ],
  d2: [
    { cancha: 'puerto', luz: 'tarde', paneles: [
      { cam: toma(0, 0, 1.2, 4.5, 1.6, 1.1), act: [Ac('puerto:4', -0.7, 0, 'saluda', 'feliz', { hacia: 'chacha' }), Ac('chacha', 0.7, 0.2, 'saluda', 'feliz', { hacia: 'puerto:4' })], globos: [Gl('puerto:4', 'h_d2a', 'habla')] },
      { cam: toma(0, 2, -0.3, 5, 1.7, 1.0), act: [Ac('toto', -0.8, 2, 'fest_brazos', 'feliz'), Ac('chacha', 0.9, 2.3, 'cruzado', 'picaro'), Ac('cacho', 0, 0.3, 'senala', 'normal')], globos: [Gl('toto', 'h_d2b', 'grito'), Gl('cacho', 'h_d2c', 'habla')] },
    ] },
  ],
  a3: [
    { cancha: 'via', paneles: [
      { cam: toma(6, 0, -1.3, 13, 5, 1.0), act: [Ac('pumas:4', 2, -1, 'cintura', 'picaro', { yaw: 1.3 }), Ac('pumas:3', 2.5, 1.2, 'cruzado', 'normal', { yaw: 1.4 }), Ac('bebe', -1, 0, 'quieto', 'sorpresa', { yaw: -1.6 })], globos: [Gl(null, 'h_a3a', 'narra'), Gl('pumas:4', 'h_a3b', 'habla')] },
      { cam: toma(-1, 0, 0.8, 2.4, 1.3, 1.1), act: [Ac('bebe', -1, 0, 'puno', 'decidido', { yaw: 0.9 })], globos: [Gl('bebe', 'h_a3c', 'habla')] },
    ] },
  ],
  d3: [
    { cancha: 'via', paneles: [
      { cam: toma(0, 0, 0.6, 4, 1.5, 0.9), act: [Ac('bebe', -0.6, 0, 'triste', 'cerrados'), Ac('pumas:4', 0.8, 0.4, 'saluda', 'feliz', { hacia: 'bebe' })], globos: [Gl('bebe', 'h_d3a', 'habla'), Gl('pumas:4', 'h_d3b', 'habla')] },
      { cam: toma(-8.5, -2, 1.6, 3.2, 1.7, 1.5), act: [Ac('brizuela', -8.5, -2, 'piensa', 'enojado', { yaw: 1.4 })], globos: [Gl('brizuela', 'h_d3c', 'piensa')] },
    ] },
  ],
  a4: [
    { cancha: 'club', paneles: [
      { cam: toma(-6, 0, -1.2, 9, 3, 1.4), act: [Ac('murga:4', -2, 0, 'fest_brazos', 'feliz', { yaw: -1.4 }), Ac('murga:2', -3, 1.5, 'saluda', 'feliz', { yaw: -1.4 }), Ac('rulo', 2, 0.5, 'quieto', 'sorpresa', { yaw: 1.6 })], globos: [Gl(null, 'h_a4a', 'narra'), Gl('murga:4', 'h_a4b', 'grito')], sfx: [{ k: 't_bum', u: 0.2, v: 0.4, c: VERDE }] },
      { cam: toma(2, 0.5, 1.1, 2.3, 1.35, 1.15), act: [Ac('rulo', 2, 0.5, 'piensa', 'decidido', { yaw: 1.2 })], globos: [Gl('rulo', 'h_a4c', 'habla')] },
    ] },
  ],
  d4: [
    { cancha: 'club', paneles: [
      { cam: toma(0, 0, 0.3, 6, 2, 1.0), act: [Ac('murga:4', -1.2, 0, 'fest_brazos', 'feliz'), Ac('murga:1', 1.4, -0.4, 'fest_puno', 'feliz'), Ac('rulo', 0.2, 1.4, 'fest_brazos', 'grito')], globos: [Gl('murga:4', 'h_d4a', 'grito')] },
      { cam: toma(0, 2, -0.4, 3.8, 1.6, 1.15), act: [Ac('rulo', -0.6, 2, 'puno', 'feliz', { hacia: 'cacho' }), Ac('cacho', 0.7, 2.2, 'piensa', 'normal', { hacia: 'rulo' })], globos: [Gl('rulo', 'h_d4b', 'grito'), Gl('cacho', 'h_d4c', 'habla')] },
    ] },
  ],
  a5: [
    { cancha: 'campo', paneles: [
      { cam: toma(0, 2, 0.5, 15, 5.5, 1.5), act: [Ac('gauchos:4', -1, -2, 'cruzado', 'normal', { yaw: 0.3 }), Ac('gauchos:3', 1.5, -2.5, 'cintura', 'normal', { yaw: 0.1 }), Ac('juani', 0, 3, 'quieto', 'decidido', { yaw: PI })], globos: [Gl(null, 'h_a5a', 'narra'), Gl('gauchos:4', 'h_a5b', 'habla')] },
      { cam: toma(0, 3, 2.7, 2.4, 1.35, 1.2), act: [Ac('juani', 0, 3, 'cintura', 'picaro', { yaw: 2.8 })], globos: [Gl('juani', 'h_a5c', 'habla')] },
    ] },
  ],
  d5: [
    { cancha: 'campo', luz: 'tarde', paneles: [
      { cam: toma(0, 0, 0.2, 5.5, 1.8, 1.0), act: [Ac('juani', 0, 0, 'fest_brazos', 'grito'), Ac('toto', -1.5, 0.6, 'fest_brazos', 'feliz'), Ac('chacha', 1.5, 0.7, 'puno', 'feliz')], globos: [Gl('juani', 'h_d5a', 'grito')] },
      { cam: toma(-9.5, 0, 1.7, 3.0, 1.7, 1.55), act: [Ac('brizuela', -9.5, 0, 'piensa', 'enojado', { yaw: 1.5 })], globos: [Gl('brizuela', 'h_d5b', 'habla')] },
    ] },
    { cancha: 'potrero', luz: 'noche', paneles: [
      { cam: toma(11.6, 19.2, -0.9, 3.6, 1.5, 1.2), act: [Ac('cacho', 12.2, 19.6, 'pelota', 'triste', { yaw: -2.3 }), Ac('juani', 11, 18.5, 'quieto', 'sorpresa', { hacia: 'cacho' })], globos: [Gl('cacho', 'h_d5c', 'habla'), Gl('cacho', 'h_d5d', 'habla')] },
      { cam: toma(11.6, 19.0, -2.0, 2.4, 1.45, 1.3), act: [Ac('juani', 11, 18.5, 'pelota', 'feliz', { hacia: 'cacho' }), Ac('cacho', 12.2, 19.6, 'manos', 'feliz', { hacia: 'juani' })], globos: [Gl('cacho', 'h_d5e', 'habla'), Gl('juani', 'h_d5f', 'habla')] },
    ] },
  ],
  a6: [
    { cancha: 'estadio', paneles: [
      { cam: toma(0, 0, 0.6, 22, 9, 1.0), fov: 0.95, act: [Ac('juani', -1, 2, 'quieto', 'decidido', { yaw: PI }), Ac('halcones:4', 1, -2, 'cintura', 'picaro', { yaw: 0 }), Ac('halcones:2', 2.4, -2.4, 'cruzado', 'picaro', { yaw: 0 })], globos: [Gl(null, 'h_a6a', 'narra')] },
      { cam: toma(1, -2, 0.2, 2.4, 1.4, 1.25), act: [Ac('halcones:4', 1, -2, 'senala', 'picaro', { yaw: 0.3 })], globos: [Gl('halcones:4', 'h_a6b', 'habla')] },
      { cam: toma(-1, 2, PI - 0.3, 2.3, 1.4, 1.25), act: [Ac('juani', -1, 2, 'puno', 'decidido', { yaw: PI - 0.2 })], globos: [Gl('juani', 'h_a6c', 'habla')] },
    ] },
  ],
  fin: [
    { cancha: 'estadio', paneles: [
      { cam: toma(0, 0, 0.3, 7, 2.6, 1.2), act: [Ac('juani', 0, 0, 'fest_brazos', 'grito', { y: 0.5 }), Ac('rulo', -1.3, 0.6, 'fest_brazos', 'grito'), Ac('bebe', 1.3, 0.6, 'fest_brazos', 'feliz'), Ac('chacha', -2.4, -0.2, 'fest_puno', 'feliz'), Ac('toto', 2.5, -0.2, 'fest_brazos', 'grito'), Ac('cacho', 0.4, -1.8, 'llora', 'feliz')], globos: [Gl(null, 'h_f1', 'narra')], sfx: [{ k: 't_campeones', u: 0.5, v: 0.82, tam: 26 }] },
      { cam: toma(0, 1, -1.2, 3.2, 1.5, 1.2), act: [Ac('halcones:4', -0.7, 1, 'saluda', 'triste', { hacia: 'juani' }), Ac('juani', 0.7, 1.2, 'manos', 'feliz', { hacia: 'halcones:4' })], globos: [Gl('halcones:4', 'h_f2', 'habla'), Gl('juani', 'h_f3', 'habla')] },
      { cam: toma(-1, -3, 0.7, 4.2, 1.8, 1.4), act: [Ac('brizuela', -1.6, -3, 'triste', 'triste', { hacia: 'intendenta' }), Ac('intendenta', -0.2, -2.8, 'senala', 'feliz', { hacia: 'brizuela' })], globos: [Gl('brizuela', 'h_f4', 'habla'), Gl('intendenta', 'h_f5', 'habla')] },
    ] },
    { cancha: 'potrero', luz: 'tarde', paneles: [
      { cam: toma(0, 6, 0.5, 16, 7, 0.6), fov: 0.95, act: [Ac('juani', 1, 2, 'corre', 'feliz', { yaw: 2.6 }), Ac('halcones:4', -2, 4, 'corre', 'feliz', { yaw: 2.9 }), Ac('bebe', 4, 7, 'corre', 'grito', { yaw: -2.8 }), Ac('rulo', -4, 8, 'saluda', 'feliz'), Ac('chacha', 2, 10, 'cintura', 'feliz'), Ac('toto', 0, 16.8, 'arquero', 'feliz', { yaw: PI }), Ac('cacho', 12.4, 19.8, 'saluda', 'feliz', { yaw: -2.2 })], globos: [Gl(null, 'h_f6', 'narra')], pelota: [1.5, 0.13, 1.4] },
    ] },
  ],
  derrota: [
    { cancha: 'potrero', luz: 'tarde', paneles: [
      { cam: toma(0, 0, 0.4, 4.5, 1.6, 1.0), act: [Ac('juani', -0.6, 0, 'triste', 'triste'), Ac('rulo', 0.8, 0.4, 'triste', 'triste'), Ac('cacho', 0.1, -1.2, 'manos', 'decidido')], globos: [Gl('cacho', 'h_x1', 'habla'), Gl('juani', 'h_x2', 'habla')] },
    ] },
  ],
};
const CAPITULOS = [
  { rival: 'gatos', cancha: 'potrero', antes: 'prologo', despues: 'd1', dif: 0.9 },
  { rival: 'puerto', cancha: 'puerto', antes: 'a2', despues: 'd2', dif: 0.9 },
  { rival: 'pumas', cancha: 'via', antes: 'a3', despues: 'd3', dif: 1 },
  { rival: 'murga', cancha: 'club', antes: 'a4', despues: 'd4', dif: 1, especialRival: true },
  { rival: 'gauchos', cancha: 'campo', antes: 'a5', despues: 'd5', dif: 1, especialRival: true },
  { rival: 'halcones', cancha: 'estadio', antes: 'a6', despues: 'fin', dif: 1.05, especialRival: true, final: true },
];
// ---------- progreso ----------
let PROG = null;
function progDefecto() { return { v: 1, cap: 0, ganados: {}, desbloq: { gatos: 1 }, canchas: { potrero: 1 }, picados: 0, golesTotal: 0, mejorRacha: 0, desafios: {}, rachaDesafio: 0, fin: false }; }
function guardarProg() { Guardado.escribir('prog', PROG); }
function jugarCapitulo(i, saltarComic) {
  const C = CAPITULOS[i];
  const partido = () => irA('partido', () => {
    empezarPartido({ eq: ['loma', C.rival], cancha: C.cancha, dur: DUR_HISTORIA, modo: 'historia', cap: i, penales: true, especialRival: !!C.especialRival, dificultad: C.dif, rivalArqueroBueno: !!C.final, titulo: 'cap' + (i + 1), semilla: 1000 + i * 17 + (PROG.intentos || 0), alTerminar: r => finCapitulo(i, r) });
  });
  if (saltarComic) partido(); else empezarComic(PAG[C.antes], partido);
  if (COMIC) COMIC.titulo = 'cap' + (i + 1);
}
const DUR_HISTORIA = 180;
function finCapitulo(i, r) {
  const C = CAPITULOS[i];
  if (r.gana === 0) {
    PROG.ganados[i] = { g: r.goles, p: r.penales };
    PROG.desbloq[C.rival] = 1; PROG.canchas[C.cancha] = 1;
    if (i + 1 < CAPITULOS.length) { PROG.cap = Math.max(PROG.cap, i + 1); PROG.desbloq[CAPITULOS[i + 1].rival] = PROG.desbloq[CAPITULOS[i + 1].rival] || 0; }
    else PROG.fin = true;
    PROG.golesTotal += r.goles[0]; PROG.intentos = 0;
    guardarProg();
    mostrarResultado(r, () => empezarComic(PAG[C.despues], () => { irA('historia', () => Sonido.musica(0)); if (C.final) mostrarCreditos(); }));
  } else {
    PROG.intentos = (PROG.intentos || 0) + 1; guardarProg();
    mostrarResultado(r, () => empezarComic(PAG.derrota, () => irA('historia', () => Sonido.musica(0))));
  }
}
// ---------- desafío del día ----------
const DESAFIOS = [
  { k: 'des_dif2', cumple: r => r.goles[0] - r.goles[1] >= 2 },
  { k: 'des_3goles', cumple: r => r.goles[0] >= 3 },
  { k: 'des_cero', cumple: r => r.gana === 0 && r.goles[1] === 0 },
  { k: 'des_cabeza', cumple: r => r.gana === 0 && r.cabezazos > 0 },
  { k: 'des_especial', cumple: r => r.golesEspecial > 0 },
  { k: 'des_remontada', cumple: r => r.gana === 0, inicio: [0, 2] },
];
function desafioDeHoy() {
  const d = hoy(), r = rngSemilla(d * 7 + 3), plantilla = DESAFIOS[Math.floor(r() * DESAFIOS.length)];
  const rivales = ORDEN_RIVALES, rival = rivales[Math.floor(r() * rivales.length)], canchas = Object.keys(CANCHAS), cancha = canchas[Math.floor(r() * canchas.length)];
  return { dia: d, plantilla, rival, cancha, semilla: d };
}
