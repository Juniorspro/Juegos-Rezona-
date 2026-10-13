// CAMALOTE — el mundo: niveles, jugador, enemigos, jefes, guiones y cámara
const TS = 30;                                        // unidades lógicas por baldosa
const SOL = new Set('#T"%xtbFnICcw'.split(''));
const AGUA = new Set(['~', 'p', 'r']);
const LENTO = new Set(['u', 'm']);
const CINTAS = { '>': [1, 0], '<': [-1, 0], 'A': [0, -1], 'V': [0, 1] };
const PROY_BLOQ = new Set('#T"%xtFnICcb'.split(''));
const PUERTAS = { g: 'A', G: 'B', h: 'T', H: 'H', E: 'H' };
const DX = { u: 0, d: 0, l: -1, r: 1 }, DY = { u: -1, d: 1, l: 0, r: 0 };
const SUELOS = new Set(['.', ',', ':', 's', 'q', '_', '~', 'u', '=', 'p']);

let N = null, T_MUNDO = 0, HITSTOP = 0, MODO_DIOS = false, ENT_USADO = false;
const J = { x: 0, y: 0, dir: 'd', hp: 6, hpMax: 6, inv: 0, dash: 0, dashCD: 0, ddx: 0, ddy: 0, nada: false, carga: null, empT: 0, anim: 0, mov: 0, silbCD: 0, bolCD: 0, desmayo: 0, golpe: 0 };
const CAM = { x: 0, y: 0, lock: false, guion: null, temblor: 0, amp: 0 };
const VISTA = { x: 0, y: 0, w: 360, h: 480 };
const EFECTOS = [], PROYS = [];
const ENT = { mx: 0, my: 0, a: false, b: false, c: false, d: false };

function TIENE(i) { return !!(G && G.items[i]); }
function DAR(i) { G.items[i] = 1; }
function QUITAR(i) { delete G.items[i]; }
function sacudir(a, t) { CAM.amp = Math.max(CAM.amp, a); CAM.temblor = Math.max(CAM.temblor, t); }
function efecto(o) { if (EFECTOS.length > 400) EFECTOS.shift(); o.max = o.vida; EFECTOS.push(o); }
function polvo(x, y, n, c) { for (let k = 0; k < (n || 6); k++) efecto({ x: x + rnd(-0.2, 0.2), y: y + rnd(-0.1, 0.1), vx: rnd(-1.2, 1.2), vy: rnd(-0.8, 0.2), z: 0.1, vz: rnd(0.5, 1.5), vida: rnd(0.35, 0.7), c: c || '#e8dcc0', t: 'polvo', tam: rnd(0.08, 0.16) }); }
function chispas(x, y, n, c) { for (let k = 0; k < (n || 8); k++) { const a = rnd(0, 6.28), v = rnd(2, 5); efecto({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, z: 0.4, vz: rnd(1, 3), vida: rnd(0.2, 0.45), c: c || '#fff2a0', t: 'chispa', tam: 0.06 }); } }
function salpicar(x, y, n) { for (let k = 0; k < (n || 10); k++) { const a = rnd(0, 6.28), v = rnd(0.5, 2.2); efecto({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6, z: 0, vz: rnd(2, 4), vida: rnd(0.4, 0.7), c: '#d8f0ff', t: 'gota', tam: rnd(0.05, 0.1) }); } efecto({ x, y, vida: 0.6, t: 'anillo', c: '#ffffff', tam: 0.2 }); }
function hojas(x, y, n, c) { for (let k = 0; k < (n || 8); k++) efecto({ x: x + rnd(-0.3, 0.3), y: y + rnd(-0.3, 0.3), vx: rnd(-1.5, 1.5), vy: rnd(-1.5, 1), z: 0.5, vz: rnd(1, 2.5), vida: rnd(0.6, 1.1), c: c || '#5aa848', t: 'hoja', tam: rnd(0.08, 0.13), r: rnd(0, 6) }); }

// ---------- el nivel ----------
class Nivel {
  constructor(id) {
    const d = MAPAS[id];
    this.id = id; this.d = d; this.w = d.filas[0].length; this.h = d.filas.length;
    this.t = d.filas.map(f => f.split(''));
    this.ents = []; this.ocupa = new Map(); this.estatuas = []; this.botones = []; this.placas = { A: [], B: [] }; this.jefe = null;
    this.mem = G.mundo[id] || (G.mundo[id] = { f: {}, tiles: {}, fuera: {} });
    let nf = 0, nc = 0;
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      const c = this.t[y][x], L = d.ley[c] || LEY[c];
      if (c === 't') this.estatuas.push({ x, y });
      if (c === 'b') this.botones.push({ x, y });
      if (c === 'o' || c === 'O') this.placas[c === 'o' ? 'A' : 'B'].push({ x, y });
      if (!L) continue;
      const clave = c + x + '_' + y;
      this.t[y][x] = L.suelo || this.sueloVecino(x, y);
      if (L.e === 'inicio') { this.inicio = [x + 0.5, y + 0.5]; continue; }
      if (L.e === 'arena') { this.centro = [x + 0.5, y + 0.5]; continue; }
      const e = Object.assign({ clave, tipo: L.e, id: L.id, x: x + 0.5, y: y + 0.5, tx: x, ty: y, ox: x, oy: y, t: rnd(0, 9), dir: 'd' }, L);
      if (L.e === 'figurita') e.id = d.figus[nf++];
      if (L.e === 'cartel') e.texto = d.carteles[nc++];
      if (this.mem.fuera[clave] || (L.e === 'figurita' && G.figus[e.id])) continue;
      if (L.e === 'enemigo') Object.assign(e, ENEMIGOS[e.id](), { x0: e.x, y0: e.y });
      this.ents.push(e);
    }
    for (const k in this.mem.tiles) { const [x, y] = k.split(',').map(Number); this.t[y][x] = this.mem.tiles[k]; }
    if (id === 'c1' && this.flag('yaca')) { const y = this.ent('yaca'); y.x = 14.5; y.y = 40.5; y.tx = 14; y.ty = 40; }
    if (id === 'c2' && this.flag('llave')) { const k = this.ent('coati'); if (k) { k.x = 7.5; k.y = 37.5; } }
    this.reocupar();
  }
  flag(n) { return !!this.mem.f[n]; }
  setFlag(n, v) { this.mem.f[n] = v == null ? 1 : v; }
  tile(x, y) { x = Math.floor(x); y = Math.floor(y); return x < 0 || y < 0 || x >= this.w || y >= this.h ? 'T' : this.t[y][x]; }
  setTile(x, y, c, persistir) { this.t[y][x] = c; this.sg = null; if (persistir !== false) this.mem.tiles[x + ',' + y] = c; }
  abierta(c, x, y) { if (c === 'D') return this.flag('p' + x + '_' + y); return this.flag('abre_' + PUERTAS[c]); }
  solido(x, y) {
    const c = this.tile(x, y);
    if (SOL.has(c)) return true;
    if (PUERTAS[c] || c === 'D') return !this.abierta(c, Math.floor(x), Math.floor(y));
    return this.ocupa.has(Math.floor(x) + ',' + Math.floor(y));
  }
  agua(x, y) { return AGUA.has(this.tile(x, y)); }
  sueloVecino(x, y) {
    const cnt = {};
    for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const c = this.tile(x + a, y + b); if (SUELOS.has(c)) cnt[c] = (cnt[c] || 0) + 1; }
    let mejor = '.', n = 0;
    for (const k in cnt) if (cnt[k] > n) { n = cnt[k]; mejor = k; }
    return mejor === '~' || mejor === '=' ? '.' : mejor;
  }
  reocupar() { this.ocupa.clear(); for (const e of this.ents) if (!e.muerto && (e.tipo === 'empujable' || e.solido || e.tipo === 'jaula')) this.ocupa.set(e.tx + ',' + e.ty, e); }
  ent(id) { return this.ents.find(e => e.id === id && !e.muerto); }
  hay(id) { return this.ents.some(e => e.tipo === 'enemigo' && e.id === id && !e.muerto); }
  quitar(e, persistir) { e.muerto = true; if (persistir) this.mem.fuera[e.clave] = 1; if (this.ocupa.get(e.tx + ',' + e.ty) === e) this.ocupa.delete(e.tx + ',' + e.ty); }
}

// ---------- enemigos ----------
const ENEMIGOS = {
  mosquito: () => ({ hp: 1, vuela: 1, radio: 0.35 }),
  sapo: () => ({ hp: 2, radio: 0.42 }),
  pirana: () => ({ hp: 1, radio: 0.38 }),
  dron: () => ({ hp: 2, vuela: 1, radio: 0.42, tiro: rnd(1, 2.4) }),
};
function nuevoEnemigo(id, x, y) { const e = Object.assign({ tipo: 'enemigo', id, x, y, x0: x, y0: y, t: rnd(0, 9), dir: 'd', clave: 'z' + Math.random() }, ENEMIGOS[id]()); N.ents.push(e); polvo(x, y, 6, '#ffffff'); return e; }
function iaEnemigo(e, dt) {
  e.t += dt;
  if (e.inv > 0) e.inv -= dt;
  if (e.aturdido > 0) { e.aturdido -= dt; return; }
  const dx = J.x - e.x, dy = J.y - e.y, d = Math.hypot(dx, dy) || 1;
  if (e.id === 'mosquito') {
    const v = d < 7 ? 2.0 : 0.6, w = Math.sin(e.t * 6) * 1.2;
    const tx = d < 7 ? dx / d : Math.cos(e.t * 0.7), ty = d < 7 ? dy / d : Math.sin(e.t * 0.9);
    e.x += (tx * v - ty * w * 0.4) * dt; e.y += (ty * v + tx * w * 0.4) * dt;
    e.dir = dx < 0 ? 'l' : 'r';
  } else if (e.id === 'sapo') {
    if (!e.salto) { e.esp = (e.esp || rnd(0.6, 1.4)) - dt; if (e.esp <= 0) { const ang = d < 5 ? Math.atan2(dy, dx) : rnd(0, 6.28); e.salto = { t: 0, vx: Math.cos(ang) * 2.6, vy: Math.sin(ang) * 2.6 }; e.esp = rnd(0.8, 1.5); e.dir = Math.cos(ang) < 0 ? 'l' : 'r'; } }
    else { e.salto.t += dt; const nx = e.x + e.salto.vx * dt, ny = e.y + e.salto.vy * dt; if (!N.solido(nx, ny) && !N.agua(nx, ny)) { e.x = nx; e.y = ny; } if (e.salto.t > 0.38) { e.salto = null; polvo(e.x, e.y, 3, '#c8e8a0'); } }
  } else if (e.id === 'pirana') {
    const enAgua = (x, y) => N.agua(x, y);
    if (J.nada && d < 4.5) { e.ataque = (e.ataque || 0) - dt; if (e.ataque <= 0) { e.vx = dx / d * 3.4; e.vy = dy / d * 3.4; e.ataque = 1.3; } }
    else { e.vx = Math.cos(e.t * 0.8 + e.x0) * 0.8; e.vy = Math.sin(e.t * 0.6 + e.y0) * 0.6; }
    const nx = e.x + e.vx * dt, ny = e.y + e.vy * dt;
    if (enAgua(nx, ny)) { e.x = nx; e.y = ny; } else { e.vx *= -1; e.vy *= -1; }
    e.vx *= 1 - dt * 1.5; e.vy *= 1 - dt * 1.5;
    e.dir = e.vx < 0 ? 'l' : 'r';
  } else if (e.id === 'dron') {
    const quiero = d > 4 ? 1 : d < 2.6 ? -1 : 0;
    e.x += (dx / d * quiero * 1.6 + Math.cos(e.t * 1.3) * 0.6) * dt; e.y += (dy / d * quiero * 1.6 + Math.sin(e.t * 1.1) * 0.6) * dt;
    e.tiro -= dt;
    if (e.tiro <= 0 && d < 7) { e.tiro = 2.3; PROYS.push({ x: e.x, y: e.y, vx: dx / d * 4.6, vy: dy / d * 4.6, de: 'e', vida: 2.4, id: 'clavo' }); Sonido.disparo(); }
    e.dir = dx < 0 ? 'l' : 'r';
  }
  if (e.vuela) { const [ax, ay, aw, ah] = [1, 1, N.w - 2, N.h - 2]; e.x = clamp(e.x, ax, ax + aw); e.y = clamp(e.y, ay, ay + ah); }
}
function danarEnemigo(e, n, dx, dy) {
  if (e.inv > 0 || e.muerto) return false;
  e.hp -= n; e.inv = 0.35;
  if (!e.vuela && e.id !== 'pirana') { const nx = e.x + dx * 0.5, ny = e.y + dy * 0.5; if (!N.solido(nx, ny) && !N.agua(nx, ny)) { e.x = nx; e.y = ny; } }
  else { e.x += dx * 0.5; e.y += dy * 0.5; }
  HITSTOP = 0.05; chispas(e.x, e.y, 8); Sonido.golpe();
  if (e.hp <= 0) { e.muerto = true; polvo(e.x, e.y, 10, '#ffffff'); efecto({ x: e.x, y: e.y, vida: 0.4, t: 'puf', tam: 0.5 }); if (vis() < 0.2 && J.hp < J.hpMax) N.ents.push({ tipo: 'item', id: 'corazon', x: e.x, y: e.y, t: 0, clave: 'cz' + Math.random(), suelto: 1 }); }
  return true;
}

// ---------- el jugador ----------
function libre(x, y) { const a = 0.27, b = 0.2; return !N.solido(x - a, y - b) && !N.solido(x + a, y - b) && !N.solido(x - a, y + b) && !N.solido(x + a, y + b); }
function moverJ(dx, dy) {
  let bx = false, by = false;
  if (dx) {
    if (libre(J.x + dx, J.y)) J.x += dx;
    else { bx = true; for (const s of [-1, 1]) if (libre(J.x + dx, J.y + s * 0.22) && !libre(J.x + dx, J.y - s * 0.22)) { J.y += s * Math.min(Math.abs(dx), 0.05); break; } }
  }
  if (dy) {
    if (libre(J.x, J.y + dy)) J.y += dy;
    else { by = true; for (const s of [-1, 1]) if (libre(J.x + s * 0.24, J.y + dy) && !libre(J.x - s * 0.24, J.y + dy)) { J.x += s * Math.min(Math.abs(dy), 0.05); break; } }
  }
  return [bx, by];
}
function controlarJugador(dt) {
  let ix = ENT.mx, iy = ENT.my;
  const mag = Math.hypot(ix, iy);
  if (mag > 1) { ix /= mag; iy /= mag; }
  if (mag > 0.3) J.dir = Math.abs(ix) > Math.abs(iy) ? (ix > 0 ? 'r' : 'l') : (iy > 0 ? 'd' : 'u');
  if (ENT.b && J.dashCD <= 0) iniciarDash(mag > 0.3 ? ix / Math.max(mag, 1e-6) : DX[J.dir], mag > 0.3 ? iy / Math.max(mag, 1e-6) : DY[J.dir]);
  if (ENT.a) accion();
  if (ENT.c && TIENE('silbato') && J.silbCD <= 0) silbar();
  if (ENT.d && TIENE('boleadoras') && J.bolCD <= 0) tirar();
  if (J.dash > 0) return pasoDash(dt);
  const c = N.tile(J.x, J.y);
  let v = J.nada ? 2.7 : 4.3;
  if (LENTO.has(c)) v *= 0.6;
  if (J.carga) v *= 0.85;
  let vx = ix * v, vy = iy * v;
  const cin = CINTAS[c];
  if (cin && !J.nada) { vx += cin[0] * 2.3; vy += cin[1] * 2.3; }
  const [bx, by] = moverJ(vx * dt, vy * dt);
  J.mov = Math.min(1, Math.hypot(vx, vy) / 4);
  if (mag > 0.3) J.anim += dt * (J.nada ? 6 : 10);
  // empujar
  const ax = Math.abs(ix) > Math.abs(iy) ? Math.sign(ix) : 0, ay = ax ? 0 : Math.sign(iy);
  if (mag > 0.55 && ((ax && bx) || (ay && by))) {
    const tx = Math.floor(J.x + ax * 0.55), ty = Math.floor(J.y + ay * 0.5), e = N.ocupa.get(tx + ',' + ty);
    if (e && e.tipo === 'empujable' && !e.mov) { J.empT += dt; if (J.empT > 0.2) { empujar(e, ax, ay); J.empT = 0; } }
    else J.empT = 0;
    const cd = N.tile(tx, ty);
    if (cd === 'D' && !N.abierta('D', tx, ty) && TIENE('llave')) { N.setFlag('p' + tx + '_' + ty); QUITAR('llave'); Sonido.puzzle(); chispas(tx + 0.5, ty + 0.5, 12, '#ffe080'); }
  } else J.empT = 0;
}
function iniciarDash(dx, dy) {
  if (J.carga) { soltarCarga(); }
  J.dash = 0.2; J.dashCD = 0.42; J.ddx = dx; J.ddy = dy; J.golpe = 0;
  if (Math.abs(dx) > 0.3 || Math.abs(dy) > 0.3) J.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'r' : 'l') : (dy > 0 ? 'd' : 'u');
  Sonido.embestida(); polvo(J.x, J.y, 5);
}
function pasoDash(dt) {
  J.dash -= dt;
  const v = J.nada ? 7 : 10, [bx, by] = moverJ(J.ddx * v * dt, J.ddy * v * dt);
  if (vis() < 0.6) efecto({ x: J.x - J.ddx * 0.3, y: J.y - J.ddy * 0.3, vx: 0, vy: 0, z: 0.2, vz: 0, vida: 0.25, c: J.nada ? '#e8f8ff' : '#f0e4c8', t: 'polvo', tam: 0.12 });
  // pega a enemigos y al jefe
  for (const e of N.ents) if (e.tipo === 'enemigo' && !e.muerto && Math.hypot(e.x - J.x, e.y - (J.y - (e.vuela ? 0.4 : 0))) < e.radio + 0.45) { if (danarEnemigo(e, 1, J.ddx, J.ddy)) { J.dash = 0; rebotar(0.25); return; } }
  if (N.jefe && N.jefe.recibirEmbestida && N.jefe.recibirEmbestida()) { J.dash = 0; rebotar(0.4); return; }
  if ((Math.abs(J.ddx) > 0.5 && bx) || (Math.abs(J.ddy) > 0.5 && by)) {
    const tx = Math.floor(J.x + Math.sign(J.ddx) * (Math.abs(J.ddx) > 0.5 ? 0.6 : 0)), ty = Math.floor(J.y + Math.sign(J.ddy) * (Math.abs(J.ddy) > 0.5 ? 0.55 : 0)), c = N.tile(tx, ty);
    if (c === '%' || c === '"' || c === 'x') romper(tx, ty, c);
    else { Sonido.bonk(); sacudir(2, 0.12); polvo(J.x + J.ddx * 0.4, J.y + J.ddy * 0.3, 4, '#d8c8a8'); }
    J.dash = 0; rebotar(0.15);
  }
}
function rebotar(k) { moverJ(-J.ddx * k, -J.ddy * k); }
function romper(x, y, c) {
  N.setTile(x, y, c === 'x' && N.tile(x, y + 1) === '_' ? '_' : N.sueloVecino(x, y), false);
  HITSTOP = 0.04; sacudir(2, 0.1);
  if (c === 'x') { Sonido.madera(); for (let k = 0; k < 10; k++) efecto({ x: x + 0.5, y: y + 0.5, vx: rnd(-2.5, 2.5), vy: rnd(-2.5, 1), z: 0.3, vz: rnd(1.5, 3.5), vida: rnd(0.5, 0.9), c: k % 2 ? '#b07a44' : '#8a5a2e', t: 'astilla', tam: rnd(0.06, 0.12), r: rnd(0, 6) }); }
  else { Sonido.arbusto(); hojas(x + 0.5, y + 0.5, 12, c === '%' ? '#4a6a3a' : '#5aa848'); if (c === '%') for (let k = 0; k < 4; k++) efecto({ x: x + 0.5, y: y + 0.5, vx: rnd(-2, 2), vy: rnd(-2, 1), z: 0.3, vz: rnd(1, 2), vida: 0.7, c: '#8a3a8a', t: 'chispa', tam: 0.06 }); }
  if (c === '"' && J.hp < J.hpMax && vis() < 0.35) N.ents.push({ tipo: 'item', id: 'corazon', x: x + 0.5, y: y + 0.5, t: 0, clave: 'cz' + Math.random(), suelto: 1 });
}
function empujar(e, dx, dy) {
  const tx = e.tx + dx, ty = e.ty + dy, c = N.tile(tx, ty);
  const agua = e.id === 'tronco' && (c === 'w' || c === '~' || c === 'p');   // solo el tronco se hunde y hace puente
  if (!agua && (N.solido(tx, ty) || N.ents.some(o => o.tipo === 'enemigo' && !o.muerto && !o.vuela && Math.floor(o.x) === tx && Math.floor(o.y) === ty))) { Sonido.bonk(); return; }
  N.ocupa.delete(e.tx + ',' + e.ty);
  e.mov = { x0: e.tx, y0: e.ty, dx, dy, t: 0, agua };
  e.tx = tx; e.ty = ty;
  if (!agua) N.ocupa.set(tx + ',' + ty, e);
  Sonido.empujar(); polvo(e.x, e.y + 0.3, 4);
}
function pasoEmpujables(dt) {
  for (const e of N.ents) {
    if (e.tipo !== 'empujable' || e.muerto) continue;
    // si quedó trabado lejos, vuelve a su lugar: ningún puzzle queda sin salida
    if (!e.mov && (e.tx !== e.ox || e.ty !== e.oy) && !N.placas.A.concat(N.placas.B).some(p => p.x === e.tx && p.y === e.ty) && Math.hypot(J.x - e.x, J.y - e.y) > 8 && Math.hypot(J.x - e.ox - 0.5, J.y - e.oy - 0.5) > 3 && !N.solido(e.ox + 0.5, e.oy + 0.5)) {
      e.lejos = (e.lejos || 0) + dt;
      if (e.lejos > 1.5) { polvo(e.x, e.y, 8, '#ffffff'); N.ocupa.delete(e.tx + ',' + e.ty); e.tx = e.ox; e.ty = e.oy; e.x = e.ox + 0.5; e.y = e.oy + 0.5; N.ocupa.set(e.tx + ',' + e.ty, e); polvo(e.x, e.y, 8, '#ffffff'); e.lejos = 0; }
    } else e.lejos = 0;
    if (!e.mov) continue;
    e.mov.t = Math.min(1, e.mov.t + dt / 0.2);
    e.x = e.mov.x0 + 0.5 + e.mov.dx * e.mov.t; e.y = e.mov.y0 + 0.5 + e.mov.dy * e.mov.t;
    if (e.mov.t >= 1) {
      if (e.mov.agua) { N.setTile(e.tx, e.ty, '='); N.quitar(e, true); salpicar(e.tx + 0.5, e.ty + 0.5, 14); Sonido.chapuzon(); Sonido.puzzle(); }
      e.mov = null;
    }
  }
}
function frente(r) { return [J.x + DX[J.dir] * (r || 0.8), J.y + DY[J.dir] * (r || 0.8)]; }
// lo que se puede hablar o leer adelante (el tero que te sigue cuenta solo si lo mirás)
function hablable() {
  const [fx, fy] = frente(0.8);
  let mejor = null, md = 1.25;
  for (const e of N.ents) {
    if (e.muerto || !(e.tipo === 'npc' || e.tipo === 'cartel' || e.tipo === 'jaula')) continue;
    const df = Math.hypot(e.x - fx, e.y - fy), d = e.id === 'tereso' && N.flag('sigue') ? df : Math.min(df, Math.hypot(e.x - J.x, e.y - J.y) + 0.25);
    if (d < md) { md = d; mejor = e; }
  }
  return mejor;
}
function accion() {
  const mejor = hablable();
  if (mejor) {
    if (mejor.tipo === 'cartel') { correrLista([['di', 'cartel', mejor.texto]]); return; }
    mejor.dir = mejor.x > J.x + 0.3 ? 'l' : mejor.x < J.x - 0.3 ? 'r' : mejor.y > J.y ? 'u' : 'd';
    const h = N.d.hablar[mejor.id];
    if (h) correr(h(N));
    return;
  }
  const [fx, fy] = frente(0.8), c = N.tile(fx, fy);
  if (c === 'F') { descansar(); return; }
  if (c === 'm' || N.tile(J.x, J.y) === 'm') { if (!J.carga) { J.carga = 'barro'; Sonido.barro(); polvo(J.x, J.y, 5, '#7a5a3a'); } return; }
  if (J.carga) soltarCarga();
}
function soltarCarga() { if (!J.carga) return; J.carga = null; Sonido.barro(); for (let k = 0; k < 6; k++) efecto({ x: J.x, y: J.y, vx: rnd(-1.5, 1.5), vy: rnd(-1, 1), z: 0.6, vz: rnd(0.5, 2), vida: 0.5, c: '#6a4a2a', t: 'gota', tam: 0.08 }); }
function descansar() {
  J.hp = J.hpMax; G.check = { nivel: N.id, x: J.x, y: J.y + 0.6 }; guardar();
  Sonido.fogon(); toast(tr('guardado')); chispas(J.x, J.y - 0.6, 10, '#ffb040');
}
function silbar() {
  J.silbCD = 1.0; Sonido.silbato();
  efecto({ x: J.x, y: J.y - 0.4, vida: 0.7, t: 'onda', tam: 3.5 });
  for (const e of N.ents) if (e.tipo === 'enemigo' && !e.muerto && Math.hypot(e.x - J.x, e.y - J.y) < 3.6) { e.aturdido = 2.6; efecto({ x: e.x, y: e.y, vida: 1, t: 'estrellas', tam: 0.3 }); }
  let nuevas = 0;
  for (const s of N.estatuas) {
    const k = 'est_' + s.x + '_' + s.y;
    if (!N.flag(k) && Math.hypot(s.x + 0.5 - J.x, s.y + 0.5 - J.y) < 3.4) { N.setFlag(k); nuevas++; chispas(s.x + 0.5, s.y, 10, '#a8f0ff'); }
  }
  if (nuevas) { Sonido.estatua(); if (N.estatuas.every(s => N.flag('est_' + s.x + '_' + s.y)) && !N.flag('abre_T')) { N.setFlag('abre_T'); Sonido.puzzle(); sacudir(2, 0.3); if (N.id === 'c1') { G.objetivo = 'o_c1f'; toastObjetivo(); } } }
}
function tirar() {
  J.bolCD = 0.65; Sonido.boleadoras();
  PROYS.push({ x: J.x, y: J.y - 0.35, vx: DX[J.dir] * 9, vy: DY[J.dir] * 9, de: 'j', vida: 0.75, id: 'bola', r: 0 });
}
function herir(n, fx, fy) {
  if (MODO_DIOS || J.inv > 0 || J.dash > 0 || J.desmayo > 0) return;
  J.hp -= n; J.inv = 1.1; HITSTOP = 0.08; sacudir(3, 0.25); Sonido.herido(); vibrar(40);
  const dx = J.x - fx, dy = J.y - fy, d = Math.hypot(dx, dy) || 1;
  for (let k = 0; k < 6; k++) moverJ(dx / d * 0.1, dy / d * 0.1);
  if (J.hp <= 0) { J.hp = 0; J.desmayo = 1.8; Sonido.desmayo(); soltarCarga(); }
}

// ---------- proyectiles, ítems, npcs, placas ----------
function pasoProyectiles(dt) {
  for (let i = PROYS.length - 1; i >= 0; i--) {
    const p = PROYS[i];
    p.vida -= dt; p.r += dt * 18;
    if (p.cae) { p.t += dt; if (p.t >= p.dur) { PROYS.splice(i, 1); if (Math.hypot(J.x - p.x, J.y - p.y) < (p.radio || 0.85)) herir(1, p.x, p.y); sacudir(3, 0.2); polvo(p.x, p.y, 10, '#c8c0b0'); Sonido.impacto(); if (p.mancha) EFECTOS.push({ x: p.x, y: p.y, vida: 3, max: 3, t: 'mancha', tam: 0.8 }); } continue; }
    const nx = p.x + p.vx * dt, ny = p.y + p.vy * dt;
    const c = N.tile(nx, ny + (p.de === 'j' ? 0.35 : 0));
    if (p.vida <= 0) { PROYS.splice(i, 1); if (p.de === 'j') polvo(p.x, p.y + 0.3, 3); continue; }
    if (PROY_BLOQ.has(c) || ((c === 'n' || c === 'D' || (PUERTAS[c] && c !== 'E')) && N.solido(nx, ny + 0.35))) {
      if (p.de === 'j' && c === 'b') {
        const tx = Math.floor(nx), ty = Math.floor(ny + 0.35), k = 'btn_' + tx + '_' + ty;
        if (!N.flag(k)) { N.setFlag(k); N.setFlag('abre_H'); Sonido.puzzle(); chispas(tx + 0.5, ty + 0.5, 14, '#80e0ff'); sacudir(2, 0.2); if (N.id === 'c2') { G.objetivo = 'o_c2f'; toastObjetivo(); } }
      } else Sonido.bonk();
      PROYS.splice(i, 1); polvo(p.x, p.y + 0.3, 3); continue;
    }
    p.x = nx; p.y = ny;
    if (p.de === 'j') {
      let pego = false;
      for (const e of N.ents) {
        if (e.muerto) continue;
        if (e.tipo === 'enemigo' && Math.hypot(e.x - p.x, e.y - (e.vuela ? 0.4 : 0) - p.y - 0.3) < e.radio + 0.3) { danarEnemigo(e, 1, Math.sign(p.vx), Math.sign(p.vy)); e.aturdido = 1.2; pego = true; break; }
        if (e.tipo === 'jaula' && e.golpe && !N.flag('jaula_' + e.id) && Math.abs(e.x - p.x) < 0.6 && Math.abs(e.y - p.y - 0.3) < 0.7) { N.setFlag('jaula_' + e.id); Sonido.jaula(); chispas(e.x, e.y, 14, '#ffe080'); correr('c3_' + e.id); pego = true; break; }
      }
      if (!pego && N.jefe && N.jefe.recibirBola && N.jefe.recibirBola(p)) pego = true;
      if (pego) PROYS.splice(i, 1);
    } else if (Math.hypot(J.x - p.x, J.y - 0.3 - p.y) < 0.4) { herir(1, p.x, p.y); PROYS.splice(i, 1); }
  }
}
function pasoEntidades(dt) {
  for (const e of N.ents) {
    if (e.muerto) continue;
    e.t += dt;
    if (e.tipo === 'enemigo') {
      iaEnemigo(e, dt);
      const d = Math.hypot(e.x - J.x, e.y - (e.vuela ? 0.35 : 0) - J.y);
      if (!e.aturdido && d < e.radio + 0.28 && !(e.id === 'pirana' && !J.nada)) herir(1, e.x, e.y);
    } else if (e.tipo === 'item' || e.tipo === 'figurita') {
      if (Math.hypot(e.x - J.x, e.y - J.y) < 0.6) agarrar(e);
    } else if (e.tipo === 'npc') pasoNpc(e, dt);
  }
  if (N.ents.length > 80) N.ents = N.ents.filter(e => !e.muerto || e.tipo === 'empujable');
}
function agarrar(e) {
  if (e.id === 'corazon') { J.hp = Math.min(J.hpMax, J.hp + 2); Sonido.corazon(); N.quitar(e, false); efecto({ x: e.x, y: e.y, vida: 0.6, t: 'subir', c: '#ff6a7a', tam: 0.3 }); return; }
  N.quitar(e, true);
  if (e.tipo === 'figurita') { G.figus[e.id] = 1; G.nuevaFigu = 1; bannerFigurita(e.id); Sonido.figurita(); guardar(); return; }
  DAR(e.id); bannerDar(e.id); Sonido.item(); guardar();
}
function pasoNpc(e, dt) {
  if (e.id === 'tereso' && N.flag('sigue')) {
    const tx = J.x - DX[J.dir] * 0.9 + Math.sin(T_MUNDO * 1.3) * 0.25, ty = J.y - DY[J.dir] * 0.7 - 0.2, d = Math.hypot(tx - e.x, ty - e.y);
    const k = 1 - Math.exp(-(d > 3 ? 4 : 2.2) * dt);
    e.x += (tx - e.x) * k; e.y += (ty - e.y) * k;
    e.vuela = d > 0.5 || J.nada ? 1 : Math.max(0, (e.vuela || 0) - dt * 2);
    if (Math.abs(tx - e.x) > 0.05) e.dir = tx > e.x ? 'r' : 'l';
  } else if (e.id === 'coati' && N.flag('coatiHuye') && !N.flag('llave')) {
    const dx = e.x - J.x, dy = e.y - J.y, d = Math.hypot(dx, dy) || 1;
    if (d < 4.5) {
      let vx = dx / d * 3.1, vy = dy / d * 3.1;
      vx += Math.cos(e.t * 2.3) * 1.2; vy += Math.sin(e.t * 1.9) * 1.2;
      const nx = clamp(e.x + vx * dt, 6.4, 19.6), ny = clamp(e.y + vy * dt, 37.4, 41.6);
      if (!N.solido(nx, e.y)) e.x = nx; if (!N.solido(e.x, ny)) e.y = ny;
      e.dir = vx < 0 ? 'l' : 'r'; e.corre = 1;
    } else e.corre = 0;
    if (d < 0.75 && !GU.lista) { N.setFlag('llave'); correr('c2_coati2'); }
  }
}
function revisarPlacas() {
  for (const g of ['A', 'B']) {
    const ps = N.placas[g];
    if (!ps.length || N.flag('abre_' + g)) continue;
    if (ps.every(p => placaPisada(p.x, p.y))) {
      N.setFlag('abre_' + g); Sonido.puzzle(); sacudir(2, 0.25);
      for (const e of N.ents) if (e.tipo === 'jaula' && e.grupo === g) { N.setFlag('jaula_' + e.id); chispas(e.x, e.y, 14, '#ffe080'); Sonido.jaula(); }
    }
  }
}
function placaPisada(x, y) {
  if (Math.floor(J.x) === x && Math.floor(J.y) === y && !J.nada) return true;
  const e = N.ocupa.get(x + ',' + y);
  return !!(e && e.tipo === 'empujable' && !e.mov);
}

// ---------- jefes ----------
const JEFES = {
  mosquita(n) {
    const [ax, ay, aw, ah] = n.d.arena;
    return {
      id: 'mosquita', x: ax + aw / 2, y: ay + 1, h: 1.6, hp: 5, hpMax: 5, est: 'volar', t: 0, inv: 0, sx: 0, sy: 0, picadas: 0,
      paso(dt) {
        this.t += dt; if (this.inv > 0) this.inv -= dt;
        const fase2 = this.hp <= 2;
        if (this.est === 'volar') {
          const tx = clamp(J.x + Math.sin(T_MUNDO * 0.9) * 2.6, ax + 1, ax + aw - 1), ty = clamp(J.y - 2.4, ay + 0.5, ay + ah - 1);
          this.x += (tx - this.x) * Math.min(1, dt * 2.2); this.y += (ty - this.y) * Math.min(1, dt * 2.2); this.h += (1.6 - this.h) * Math.min(1, dt * 3);
          if (this.t > (fase2 ? 1.4 : 2.4)) { this.t = 0; this.est = n.ents.filter(e => e.id === 'mosquito' && !e.muerto).length < 2 && vis() < 0.5 ? 'invocar' : 'apuntar'; this.sx = J.x; this.sy = J.y; if (this.est === 'apuntar') Sonido.zumbido(); }
        } else if (this.est === 'invocar') {
          if (this.t > 0.7) { for (let k = 0; k < (fase2 ? 3 : 2); k++) nuevoEnemigo('mosquito', this.x + rnd(-1, 1), this.y + rnd(0, 1)); this.est = 'apuntar'; this.t = 0; this.sx = J.x; this.sy = J.y; Sonido.zumbido(); }
        } else if (this.est === 'apuntar') {
          if (this.t < 0.65) { this.sx += (J.x - this.sx) * Math.min(1, dt * 6); this.sy += (J.y - this.sy) * Math.min(1, dt * 6); }
          this.x += (this.sx - this.x) * Math.min(1, dt * 3); this.y += (this.sy - 1 - this.y) * Math.min(1, dt * 3);
          if (this.t > 1.05) { this.est = 'picada'; this.t = 0; }
        } else if (this.est === 'picada') {
          const k = Math.min(1, this.t / 0.2); this.x = lerp(this.x, this.sx, k); this.y = lerp(this.y, this.sy, k); this.h = 1.6 * (1 - k);
          if (k >= 1) { this.est = 'clavada'; this.t = 0; this.h = 0; sacudir(4, 0.3); Sonido.impacto(); polvo(this.sx, this.sy, 14, '#8a6a4a'); if (Math.hypot(J.x - this.sx, J.y - this.sy) < 0.95) herir(1, this.sx, this.sy); this.picadas++; }
        } else if (this.est === 'clavada') {
          if (this.t > (fase2 ? 1.5 : 2.1)) { this.est = fase2 && this.picadas % 2 ? 'apuntar' : 'volar'; this.t = 0; this.sx = J.x; this.sy = J.y; }
        }
      },
      vulnerable() { return this.est === 'clavada' && this.inv <= 0; },
      recibirEmbestida() { if (!this.vulnerable() || Math.hypot(J.x - this.x, J.y - this.y) > 1.15) return false; this.golpear(); return true; },
      golpear() { this.hp--; this.inv = 0.6; this.est = 'volar'; this.t = 0; HITSTOP = 0.12; sacudir(5, 0.35); chispas(this.x, this.y - 0.5, 16, '#ff8090'); Sonido.golpeJefe(); if (this.hp <= 0) jefeDerrotado(); },
    };
  },
  cortacesped(n) {
    const [ax, ay, aw, ah] = n.d.arena;
    return {
      id: 'cortacesped', x: ax + aw / 2, y: ay + 1.6, ang: Math.PI / 2, hp: 5, hpMax: 5, est: 'patrullar', t: 0, inv: 0, giro: 0,
      paso(dt) {
        this.t += dt; if (this.inv > 0) this.inv -= dt; this.giro += dt * (this.est === 'cargar' ? 40 : 18);
        const quiero = Math.atan2(J.y - this.y, J.x - this.x), fase2 = this.hp <= 3;
        let da = ((quiero - this.ang + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        if (this.est === 'patrullar') {
          this.ang += clamp(da, -2.2 * dt, 2.2 * dt);
          this.mover(Math.cos(this.ang) * 1.5 * dt, Math.sin(this.ang) * 1.5 * dt);
          if (this.t > 2.3) { this.est = 'preparar'; this.t = 0; Sonido.motor(); }
        } else if (this.est === 'preparar') {
          this.ang += clamp(da, -3 * dt, 3 * dt);
          if (vis() < 0.4) efecto({ x: this.x - Math.cos(this.ang) * 0.9, y: this.y - Math.sin(this.ang) * 0.9, vx: rnd(-0.3, 0.3), vy: rnd(-0.3, 0.3), z: 0.6, vz: 0.8, vida: 0.7, c: '#5a5a5a', t: 'humo', tam: 0.18 });
          if (this.t > 0.85) { this.est = 'cargar'; this.t = 0; }
        } else if (this.est === 'cargar') {
          const ch = this.mover(Math.cos(this.ang) * 7.5 * dt, Math.sin(this.ang) * 7.5 * dt);
          if (ch || this.t > 2.5) { this.est = 'aturdido'; this.t = 0; sacudir(6, 0.4); Sonido.choque(); chispas(this.x + Math.cos(this.ang), this.y + Math.sin(this.ang), 18); }
        } else if (this.est === 'aturdido') {
          if (vis() < 0.3) efecto({ x: this.x, y: this.y - 0.4, vx: rnd(-0.4, 0.4), vy: -0.3, z: 0.8, vz: 1, vida: 0.9, c: '#4a4a4a', t: 'humo', tam: 0.2 });
          if (this.t > 2.6) { this.est = fase2 ? 'rociar' : 'patrullar'; this.t = 0; }
        } else if (this.est === 'rociar') {
          if (this.t > 0.3 && !this.rocio) { this.rocio = 1; for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; PROYS.push({ x: this.x, y: this.y, vx: Math.cos(a) * 4, vy: Math.sin(a) * 4, de: 'e', vida: 2, id: 'pasto' }); } Sonido.disparo(); }
          if (this.t > 0.9) { this.rocio = 0; this.est = 'patrullar'; this.t = 0; }
        }
        // cuchillas al frente y cuerpo sólido
        const fx = this.x + Math.cos(this.ang) * 0.85, fy = this.y + Math.sin(this.ang) * 0.85;
        if (this.est !== 'aturdido' && Math.hypot(J.x - fx, J.y - fy) < 0.85) herir(1, fx, fy);
        const d = Math.hypot(J.x - this.x, J.y - this.y);
        if (d < 1.0 && J.dash <= 0) { const k = (1.0 - d) / Math.max(d, 0.01); moverJ((J.x - this.x) * k, (J.y - this.y) * k); }
      },
      mover(dx, dy) {
        const nx = this.x + dx, ny = this.y + dy, r = 0.8;
        const choca = (x, y) => N.solido(x - r, y - r * 0.7) || N.solido(x + r, y - r * 0.7) || N.solido(x - r, y + r * 0.7) || N.solido(x + r, y + r * 0.7) || x < ax + r || x > ax + aw - r || y < ay + r || y > ay + ah - r;
        if (choca(nx, ny)) return true;
        this.x = nx; this.y = ny; return false;
      },
      vulnerable() { return this.est === 'aturdido' && this.inv <= 0; },
      recibirEmbestida() { if (!this.vulnerable() || Math.hypot(J.x - this.x, J.y - this.y) > 1.45) return false; this.golpear(); return true; },
      golpear() { this.hp--; this.inv = 0.6; this.est = this.hp <= 3 ? 'rociar' : 'patrullar'; this.t = 0; HITSTOP = 0.12; sacudir(5, 0.35); chispas(this.x, this.y, 18, '#ffb040'); Sonido.golpeJefe(); if (this.hp <= 0) jefeDerrotado(); },
    };
  },
  draga(n) {
    // la draga ocupa el fondo de la arena: el jugador entra por arriba y le pega al motor, que mira hacia él
    const [ax, ay, aw] = n.d.arena, yMin = ay + 0.5, yMax = 53.5;
    for (let x = 9; x <= 18; x++) for (let y = 54; y <= 55; y++) if (x <= 15 || y === 55) n.setTile(x, y, 'c', false);
    return {
      id: 'draga', x: 12.5, y: 55, hp: 6, hpMax: 6, est: 'bolsas', t: 0, inv: 0, n: 0, garra: null, nucleo: [12.5, 53.5],
      paso(dt) {
        this.t += dt; if (this.inv > 0) this.inv -= dt;
        const fase = this.hp <= 2 ? 3 : this.hp <= 4 ? 2 : 1;
        if (this.est === 'bolsas') {
          const cuantas = fase === 3 ? 5 : 3;
          if (this.n < cuantas && this.t > 0.45 * this.n + 0.3) { this.n++; PROYS.push({ cae: 1, x: clamp(J.x + rnd(-0.8, 0.8), ax + 0.5, ax + aw - 0.5), y: clamp(J.y + rnd(-0.8, 0.8), yMin, yMax - 0.6), t: 0, dur: 1.0, de: 'e', id: 'bolsa', radio: 0.85, mancha: 1, vida: 9 }); Sonido.lanzar(); }
          if (this.t > 0.45 * cuantas + 1.6) { this.est = 'garra'; this.t = 0; this.n = 0; this.garra = { y: clamp(Math.round(J.y - 0.5) + 0.5, yMin + 0.5, yMax - 0.5), x: ax - 1, dir: 1, t: 0 }; if (vis() < 0.5) { this.garra.x = ax + aw + 1; this.garra.dir = -1; } Sonido.alarma(); }
        } else if (this.est === 'garra') {
          const gr = this.garra; gr.t += dt;
          if (gr.t > 0.9) { gr.x += gr.dir * (fase === 3 ? 12 : 9.5) * dt; if (Math.abs(J.y - gr.y) < 0.6 && Math.abs(J.x - gr.x) < 0.8) herir(1, gr.x, gr.y); }
          if (gr.x < ax - 2 || gr.x > ax + aw + 2) { this.garra = null; this.est = fase >= 2 && N.ents.filter(e => e.id === 'dron' && !e.muerto).length < 2 ? 'drones' : 'expuesta'; this.t = 0; if (this.est === 'expuesta') Sonido.vapor(); }
        } else if (this.est === 'drones') {
          if (this.t > 0.5) { nuevoEnemigo('dron', this.x - 3, this.y - 3); nuevoEnemigo('dron', this.x + 3, this.y - 3); this.est = 'expuesta'; this.t = 0; Sonido.vapor(); }
        } else if (this.est === 'expuesta') {
          if (vis() < 0.4) efecto({ x: this.nucleo[0] + rnd(-0.5, 0.5), y: this.nucleo[1] - 0.2, vx: rnd(-0.3, 0.3), vy: -0.5, z: 1, vz: 1, vida: 0.8, c: '#d8d0c8', t: 'humo', tam: 0.18 });
          if (this.t > 3.2) { this.est = 'bolsas'; this.t = 0; }
        } else if (this.est === 'cae') {
          if (vis() < 0.5) { chispas(this.x + rnd(-2, 2), this.y + rnd(-1, 1), 6, '#ffb040'); }
          if (this.t > 2.4 && !this.listo) { this.listo = 1; finJefe(); }
        }
      },
      vulnerable() { return this.est === 'expuesta' && this.inv <= 0; },
      recibirEmbestida() { if (!this.vulnerable() || Math.hypot(J.x - this.nucleo[0], J.y - this.nucleo[1] + 0.3) > 1.3) return false; this.golpear(); return true; },
      recibirBola(p) { if (!this.vulnerable() || Math.hypot(p.x - this.nucleo[0], p.y + 0.3 - this.nucleo[1]) > 0.9) return false; this.golpear(); return true; },
      golpear() { this.hp--; this.inv = 0.6; this.est = 'bolsas'; this.t = 0; this.n = 0; HITSTOP = 0.14; sacudir(6, 0.4); chispas(this.nucleo[0], this.nucleo[1], 20, '#ffa030'); Sonido.golpeJefe(); if (this.hp <= 0) { this.est = 'cae'; this.t = 0; Sonido.explosion(); for (const e of N.ents) if (e.tipo === 'enemigo') e.muerto = true; } },
    };
  },
};
function jefeDerrotado() {
  const j = N.jefe;
  j.est = 'muere'; j.t = 0;
  for (const e of N.ents) if (e.tipo === 'enemigo' && !e.muerto) { e.muerto = true; polvo(e.x, e.y, 6, '#ffffff'); }
  Sonido.explosion(); sacudir(6, 0.6);
}
function finJefe() {
  if (!N.jefe) return;
  N.jefe = null; CAM.lock = false; PROYS.length = 0; N.setFlag('jefeOk');
  J.hpMax = Math.max(J.hpMax, G.hpMax || 6); J.hp = J.hpMax;
  Sonido.musica(N.d.mus);
  correr(N.d.fin);
}

// ---------- guiones ----------
const GU = { lista: null, i: 0, t: 0, cola: [], ini: false };
function correr(nombre) { if (!nombre || !GUIONES[nombre]) return; correrLista(GUIONES[nombre]); }
function correrLista(l) { if (GU.lista) { GU.cola.push(l); return; } GU.lista = l; GU.i = 0; GU.t = 0; GU.ini = false; }
function guionActivo() { return !!GU.lista; }
function pasoGuion(dt) {
  let vueltas = 0;
  while (GU.lista && vueltas++ < 20) {
    if (GU.i >= GU.lista.length) { GU.lista = null; CAM.guion = null; if (GU.cola.length) { GU.lista = GU.cola.shift(); GU.i = 0; GU.t = 0; GU.ini = false; } break; }
    const c = GU.lista[GU.i];
    const primera = !GU.ini; GU.ini = true; GU.t += primera ? 0 : dt;
    if (!ejecutar(c, primera, dt)) break;
    GU.i++; GU.t = 0; GU.ini = false;
  }
}
function ejecutar(c, primera, dt) {
  switch (c[0]) {
    case 'di': if (primera) abrirDialogo(c[1], tr(c[2])); return !dialogoAbierto();
    case 'espera': return GU.t >= c[1];
    case 'objetivo': G.objetivo = c[1]; toastObjetivo(); return true;
    case 'flag': N.setFlag(c[1]); return true;
    case 'cam': CAM.guion = [c[1] + 0.5, c[2] + 0.5]; return GU.t >= (c[3] || 0.6);
    case 'camJugador': CAM.guion = null; return true;
    case 'mover': {
      const e = N.ent(c[1]);
      if (!e) return true;
      if (primera) { N.ocupa.delete(e.tx + ',' + e.ty); }
      const tx = c[2] + 0.5, ty = c[3] + 0.5, dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy), v = (c[4] || 2) * (dt || 1 / 60);
      if (d <= v) { e.x = tx; e.y = ty; e.tx = c[2]; e.ty = c[3]; N.reocupar(); return true; }
      e.x += dx / d * v; e.y += dy / d * v; e.dir = dx < 0 ? 'l' : 'r'; e.camina = 1;
      return false;
    }
    case 'aparecer': nuevoEnemigo(c[1], c[2] + 0.5, c[3] + 0.5); return true;
    case 'tile': N.setTile(c[1], c[2], c[3], !!c[4]); polvo(c[1] + 0.5, c[2] + 0.5, 6); return true;
    case 'dar': if (primera) { if (c[1] === 'corazon') { G.hpMax = (G.hpMax || 6) + 2; J.hpMax = G.hpMax; J.hp = J.hpMax; } else DAR(c[1]); bannerDar(c[1]); Sonido.item(); guardar(); } return !bannerAbierto();
    case 'quitarItem': QUITAR(c[1]); return true;
    case 'figurita': if (primera) { G.figus[c[1]] = 1; G.nuevaFigu = 1; bannerFigurita(c[1]); Sonido.figurita(); guardar(); } return !bannerAbierto();
    case 'seguir': N.setFlag('sigue'); return true;
    case 'huir': return true;
    case 'sonido': Sonido[c[1]] && Sonido[c[1]](); return true;
    case 'sacudir': sacudir(c[1], c[2]); return true;
    case 'jefe': N.jefe = JEFES[N.d.jefe](N); CAM.lock = true; Sonido.musica(3); G.check = { nivel: N.id, x: J.x, y: J.y }; return true;
    case 'capitulo': if (primera) cambiarCapitulo(c[1]); return true;
    case 'final': if (primera) iniciarFinal(); return true;
    case 'entregar': {
      if (primera) {
        J.carga = null; const n = (N.mem.f.barro || 0) + 1; N.mem.f.barro = n; Sonido.barro();
        if (n >= 3) { GU.lista = null; correr('c2_rosa4'); return false; }
        abrirDialogo('rosa', tr('d_c2_rosF', 3 - n));
      }
      return !dialogoAbierto();
    }
    case 'pista': if (primera) { const o = G.objetivo || 'o_c1a'; abrirDialogo('tereso', tr('d_pista', TXT.es['h_' + o] ? tr('h_' + o) : tr(o))); } return !dialogoAbierto();
  }
  return true;
}

// ---------- paso del mundo y cámara ----------
function pasoMundo(dt) {
  if (HITSTOP > 0) { HITSTOP -= dt; return; }
  T_MUNDO += dt;
  if (J.inv > 0) J.inv -= dt;
  if (J.dashCD > 0) J.dashCD -= dt;
  if (J.silbCD > 0) J.silbCD -= dt;
  if (J.bolCD > 0) J.bolCD -= dt;
  const libreJ = !GU.lista && !dialogoAbierto() && !bannerAbierto() && J.desmayo <= 0;
  if (J.desmayo > 0) { J.desmayo -= dt; if (J.desmayo <= 0) reaparecer(); }
  else if (libreJ) { controlarJugador(dt); ENT_USADO = true; }
  else { J.dash = 0; J.mov = 0; }
  const nadabaAntes = J.nada;
  J.nada = N.agua(J.x, J.y);
  if (J.nada && !nadabaAntes) { salpicar(J.x, J.y, 8); Sonido.chapuzon(); }
  if (J.nada && J.mov > 0.2 && vis() < 0.15) efecto({ x: J.x, y: J.y, vida: 0.8, t: 'anillo', c: '#ffffff', tam: 0.15 });
  pasoEmpujables(dt);
  pasoEntidades(dt);
  pasoProyectiles(dt);
  if (N.jefe) { if (N.jefe.est === 'muere') { N.jefe.t += dt; if (vis() < 0.4) chispas(N.jefe.x + rnd(-1, 1), N.jefe.y + rnd(-1, 0.5), 5, '#ffd080'); if (N.jefe.t > 1.4) finJefe(); } else N.jefe.paso(dt); }
  revisarPlacas();
  if (!GU.lista && !dialogoAbierto() && !bannerAbierto()) for (const z of N.d.zonas) { const [x, y, w, h] = z.r; if (J.x >= x && J.x < x + w && J.y >= y && J.y < y + h && z.si(N)) { correr(z.g); break; } }
  pasoGuion(dt);
  camara(dt);
  for (let i = EFECTOS.length - 1; i >= 0; i--) {
    const f = EFECTOS[i];
    f.vida -= dt;
    if (f.vida <= 0) { EFECTOS.splice(i, 1); continue; }
    if (f.vx != null) { f.x += f.vx * dt; f.y += f.vy * dt; f.vx *= 1 - dt * 2; f.vy *= 1 - dt * 2; }
    if (f.vz != null) { f.vz -= 9 * dt; f.z = Math.max(0, f.z + f.vz * dt); }
  }
  G.tiempo = (G.tiempo || 0) + dt;
}
function camara(dt) {
  let tx, ty;
  if (CAM.guion) [tx, ty] = CAM.guion;
  else if (CAM.lock && N.d.arena) { const [ax, ay, aw, ah] = N.d.arena; tx = ax + aw / 2; ty = ay + ah / 2; }
  else { tx = J.x + DX[J.dir] * 0.7; ty = J.y + DY[J.dir] * 0.7 - 0.3; }
  const k = 1 - Math.exp(-(CAM.guion ? 3.5 : 6) * dt);
  CAM.x += (tx - CAM.x) * k; CAM.y += (ty - CAM.y) * k;
  limitarCam();
  if (CAM.temblor > 0) CAM.temblor -= dt; else CAM.amp = 0;
}
function limitarCam() {
  const vw = VISTA.w / TS, vh = VISTA.h / TS;
  CAM.x = vw >= N.w ? N.w / 2 : clamp(CAM.x, vw / 2, N.w - vw / 2);
  CAM.y = vh >= N.h ? N.h / 2 : clamp(CAM.y, vh / 2, N.h - vh / 2);
}
function cargarNivel(id, pos) {
  N = new Nivel(id);
  G.nivel = id;
  if (N.flag('jefe') && !N.flag('jefeOk')) delete N.mem.f.jefe;
  const p = pos || N.inicio;
  J.x = p[0]; J.y = p[1]; J.dir = 'd'; J.dash = 0; J.inv = 0; J.carga = null; J.desmayo = 0;
  J.hpMax = G.hpMax || 6; J.hp = J.hpMax;
  PROYS.length = 0; EFECTOS.length = 0; GU.lista = null; GU.cola.length = 0; CAM.guion = null; CAM.lock = false;
  const t = N.ent('tereso');
  if (t && N.flag('sigue')) { t.x = J.x - 0.8; t.y = J.y - 0.4; }
  CAM.x = J.x; CAM.y = J.y; limitarCam();
  Sonido.musica(N.d.mus);
}
function reaparecer() {
  const c = G.check && G.check.nivel === N.id ? [G.check.x, G.check.y] : null;
  cargarNivel(N.id, c);
  toast(tr('desmayo'));
}
