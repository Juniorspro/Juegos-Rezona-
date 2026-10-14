// POTRERO — los equipos de la Copa de los Barrios: camisetas, caras, peinados y lo que sabe hacer cada uno.
// stats de 0 a 1: vel (velocidad), tiro, pase, gam (gambeta), def (quite), arq (arquero)
const EQUIPOS = {
  loma: {
    nom: 'eq_loma', corto: 'LOM', cancha: 'potrero', nivel: 0.7, color: '#62c6f2',
    kit: { camiseta: '#62c6f2', short: '#16131f', medias: '#ffffff', patron: 1, c2: '#ffffff', num: '#16131f', esc: 9 },
    kitArq: { camiseta: '#ffd23f', short: '#16131f', medias: '#ffd23f', guantes: '#4bb553', num: '#16131f' },
    jug: [
      { nom: 'Toto', numero: 1, piel: '#e8b48a', pelo: '#1a1410', peinado: 'parado', estilo: 1, altura: 1.08, ancho: 0.95, st: { vel: 0.6, tiro: 0.5, pase: 0.6, gam: 0.4, def: 0.5, arq: 0.72 } },
      { nom: 'Chacha', numero: 2, piel: '#8d5a3b', pelo: '#1a1010', peinado: 'rodetes', estilo: 0, altura: 0.98, ancho: 1.08, st: { vel: 0.66, tiro: 0.68, pase: 0.62, gam: 0.5, def: 0.86, arq: 0.3 } },
      { nom: 'Rulo', numero: 10, piel: '#c78c62', pelo: '#2a1810', peinado: 'rulos', estilo: 0, altura: 1.0, st: { vel: 0.7, tiro: 0.7, pase: 0.9, gam: 0.8, def: 0.55, arq: 0.3 } },
      { nom: 'Bebe', numero: 7, piel: '#f0c49c', pelo: '#c8902a', peinado: 'flequillo', estilo: 0, altura: 0.88, ancho: 0.92, st: { vel: 0.92, tiro: 0.6, pase: 0.66, gam: 0.84, def: 0.42, arq: 0.3 } },
      { nom: 'Juani', numero: 9, piel: '#d9a07a', pelo: '#3a2014', peinado: 'colita', vincha: '#ec4a33', estilo: 0, altura: 0.97, st: { vel: 0.8, tiro: 0.9, pase: 0.72, gam: 0.78, def: 0.5, arq: 0.3 } },
    ],
    especial: 'esp_zurda',
  },
  gatos: {
    nom: 'eq_gatos', corto: 'GAT', cancha: 'potrero', nivel: 0.42, color: '#8d5be0',
    kit: { camiseta: '#8d5be0', short: '#ffffff', medias: '#8d5be0', patron: 0, c2: '#ffffff', num: '#ffffff' },
    kitArq: { camiseta: '#4bb553', short: '#16131f', medias: '#4bb553', guantes: '#ffffff', num: '#ffffff' },
    semilla: 11,
  },
  puerto: {
    nom: 'eq_puerto', corto: 'PUE', cancha: 'puerto', nivel: 0.55, color: '#f7962e',
    kit: { camiseta: '#f7962e', short: '#3270d8', medias: '#3270d8', patron: 2, c2: '#3270d8', num: '#ffffff' },
    kitArq: { camiseta: '#16131f', short: '#16131f', medias: '#16131f', guantes: '#f7962e', num: '#ffffff' },
    semilla: 23, rudos: true,
  },
  pumas: {
    nom: 'eq_pumas', corto: 'PUM', cancha: 'via', nivel: 0.62, color: '#f47eb4',
    kit: { camiseta: '#f47eb4', short: '#16131f', medias: '#16131f', patron: 3, c2: '#16131f', num: '#ffffff' },
    kitArq: { camiseta: '#62c6f2', short: '#16131f', medias: '#62c6f2', guantes: '#f47eb4', num: '#16131f' },
    semilla: 37, chicas: true, rapidas: true,
  },
  murga: {
    nom: 'eq_murga', corto: 'MUR', cancha: 'club', nivel: 0.68, color: '#4bb553',
    kit: { camiseta: '#4bb553', short: '#ffd23f', medias: '#ec4a33', patron: 1, c2: '#ffd23f', num: '#16131f', esc: 7 },
    kitArq: { camiseta: '#ec4a33', short: '#16131f', medias: '#ec4a33', guantes: '#ffd23f', num: '#ffffff' },
    semilla: 41, especialRival: 'esp_redoble',
  },
  gauchos: {
    nom: 'eq_gauchos', corto: 'GAU', cancha: 'campo', nivel: 0.74, color: '#ffffff',
    kit: { camiseta: '#f4f0e6', short: '#3a5aa8', medias: '#3a5aa8', patron: 2, c2: '#3a5aa8', num: '#3a5aa8' },
    kitArq: { camiseta: '#8a4a2a', short: '#16131f', medias: '#8a4a2a', guantes: '#ffffff', num: '#ffffff' },
    semilla: 53, especialRival: 'esp_boleadora',
  },
  halcones: {
    nom: 'eq_halcones', corto: 'HAL', cancha: 'estadio', nivel: 0.84, color: '#ffd23f',
    kit: { camiseta: '#16131f', short: '#16131f', medias: '#ffd23f', patron: 3, c2: '#ffd23f', num: '#ffd23f' },
    kitArq: { camiseta: '#ec4a33', short: '#16131f', medias: '#ec4a33', guantes: '#ffffff', num: '#ffffff' },
    semilla: 67, especialRival: 'esp_halcon',
    capitan: { nom: 'Thiago', numero: 10, piel: '#f2cfa8', pelo: '#e8c050', peinado: 'peinadoAtras', estilo: 1, altura: 1.02 },
  },
};
const ORDEN_RIVALES = ['gatos', 'puerto', 'pumas', 'murga', 'gauchos', 'halcones'];
const NOMBRES_RIVAL = {
  gatos: ['Pancho', 'Lucho', 'Mili', 'Nacho', 'Tute'], puerto: ['Tanque', 'Grúa', 'Ancla', 'Morsa', 'Faro'], pumas: ['Sol', 'Male', 'Pili', 'Cami', 'Yanina'],
  murga: ['Bombo', 'Platillo', 'Lentejuela', 'Galera', 'Redoblante'], gauchos: ['Facón', 'Chiripá', 'Mate', 'Pampa', 'Tero'], halcones: ['Benja', 'Valen', 'Santi', 'Joaco', 'Thiago'],
};
// arma los cinco de un equipo (los rivales salen de una semilla, con su capitán distinto)
const PIELES = ['#f2cfa8', '#e8b48a', '#d9a07a', '#c78c62', '#a8714a', '#8d5a3b', '#6a3f28'];
const PELOS = ['#1a1410', '#2a1810', '#3a2014', '#5a3418', '#8a5a2a', '#c8902a', '#e8c050', '#2a2a2a'];
function jugadoresDe(id) {
  const E = EQUIPOS[id];
  if (E.jug) return E.jug;
  const r = rngSemilla(E.semilla), N = NOMBRES_RIVAL[id], L = [];
  const peinChicos = ['corto', 'parado', 'rapado', 'flequillo', 'rulos', 'gorra'], peinChicas = ['colita', 'trenzas', 'rodetes', 'largo', 'colita'];
  const base = E.nivel;
  const roles = [
    { arq: 0.55 + base * 0.35, vel: 0.5, tiro: 0.4, pase: 0.5, gam: 0.3, def: 0.4 },
    { vel: 0.55, tiro: 0.5, pase: 0.55, gam: 0.45, def: 0.75, arq: 0.2 },
    { vel: 0.62, tiro: 0.6, pase: 0.72, gam: 0.65, def: 0.5, arq: 0.2 },
    { vel: 0.7, tiro: 0.55, pase: 0.62, gam: 0.7, def: 0.45, arq: 0.2 },
    { vel: 0.7, tiro: 0.75, pase: 0.58, gam: 0.66, def: 0.4, arq: 0.2 },
  ];
  for (let i = 0; i < 5; i++) {
    const chica = E.chicas ? true : r() < 0.3, st = {};
    for (const k in roles[i]) st[k] = clamp(roles[i][k] * (0.65 + base * 0.6) + (r() - 0.5) * 0.08, 0.15, 0.97);
    if (E.rapidas) st.vel = Math.min(0.97, st.vel + 0.12);
    if (E.rudos) st.def = Math.min(0.97, st.def + 0.07);
    const j = {
      nom: N[i], numero: [1, 4, 8, 11, 9][i], piel: PIELES[Math.floor(r() * PIELES.length)], pelo: PELOS[Math.floor(r() * PELOS.length)],
      peinado: chica ? peinChicas[Math.floor(r() * peinChicas.length)] : peinChicos[Math.floor(r() * peinChicos.length)], estilo: r() < 0.6 ? 0 : 1,
      altura: (E.rudos ? 1.04 : 0.94) + r() * 0.1, ancho: E.rudos ? 1.1 + r() * 0.08 : 0.95 + r() * 0.1, gorra: ['#ec4a33', '#3270d8', '#16131f'][Math.floor(r() * 3)], gorraAtras: r() < 0.5, st,
    };
    if (i === 4 && E.capitan) Object.assign(j, E.capitan);
    L.push(j);
  }
  E.jug = L;
  return L;
}
// la figura 3D de un jugador con la camiseta de su equipo (se arma una vez)
const _figs = new Map();
function figuraJugador(id, i) {
  const k = id + ':' + i;
  if (_figs.has(k)) return _figs.get(k);
  const E = EQUIPOS[id], j = jugadoresDe(id)[i], kit = i === 0 ? Object.assign({}, E.kit, E.kitArq, { patron: 0 }) : E.kit;
  const f = armarFigura(Object.assign({}, j, { camiseta: kit.camiseta, short: kit.short, medias: kit.medias, botines: i === 0 ? '#16131f' : '#2a2a34', guantes: i === 0 ? kit.guantes : null, numero: j.numero, mangaLarga: i === 0 }));
  f.kit = { patron: kit.patron || 0, esc: kit.esc || 8, c2v: col3(kit.c2 || '#ffffff'), numv: col3(kit.num || '#ffffff') };
  _figs.set(k, f);
  return f;
}
// los grandes de la historia
const ELENCO = {
  cacho: { nom: 'Don Cacho', piel: '#e0aa82', pelo: '#b8b0a8', peinado: 'pelado', estilo: 2, altura: 1.16, ancho: 1.12, panza: 0.8, camiseta: '#e8e0c8', short: '#4a4a5a', medias: '#4a4a5a', botines: '#5a3a2a', pantalon: true, camisetaFlag: 0 },
  brizuela: { nom: 'Ing. Brizuela', piel: '#f0cfa8', pelo: '#2a2a2a', peinado: 'peinadoAtras', estilo: 1, altura: 1.2, ancho: 0.95, camiseta: '#5a5a6a', short: '#4a4a5a', medias: '#4a4a5a', botines: '#16131f', pantalon: true, mangaLarga: true, camisetaFlag: 0, saco: '#ec4a33' },
  intendenta: { nom: 'Intendenta', piel: '#c78c62', pelo: '#5a2a18', peinado: 'largo', estilo: 0, altura: 1.14, ancho: 0.95, camiseta: '#3270d8', short: '#16131f', medias: '#16131f', botines: '#16131f', pantalon: true, mangaLarga: true, camisetaFlag: 0 },
};
function figuraElenco(id) {
  const k = 'elenco:' + id;
  if (_figs.has(k)) return _figs.get(k);
  const f = armarFigura(ELENCO[id]); f.kit = null; _figs.set(k, f);
  return f;
}
