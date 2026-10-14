// HOJALATA — la historia: Chispa, una lata roja con llave, quiere el lugar de la vidriera para el Día del Niño;
// Turbo Max (a pila, cromado) dice que es suyo. Seis carreras por la casa, de la juguetería a la vidriera. Las
// escenas se actúan con los autitos en la largada de cada pista: la cámara busca al que habla, globo de chapa
// abajo con su cara, letra que se escribe sola; el Abuelo Tornillo habla desde un cartelito.
const CAPITULOS = [
  { pista: 0, rivales: ['turbo', 'lata', 'bicho', 'robo', 'patita'], antes: [['abuelo', 'h0_1', 0], ['chispa', 'h0_2', 3], ['turbo', 'h0_3', 7], ['lata', 'h0_4', 0], ['bicho', 'h0_5', 5], ['chispa', 'h0_6', 5]], ok: [['chispa', 'h1_ok', 1], ['turbo', 'h1_t', 2]] },
  { pista: 1, rivales: ['turbo', 'lata', 'bicho', 'robo', 'patita'], antes: [['patita', 'h2_1', 1], ['bicho', 'h2_2', 0], ['turbo', 'h2_3', 7]], ok: [['lata', 'h2_ok', 1]] },
  { pista: 2, rivales: ['turbo', 'lata', 'bicho', 'robo', 'patita'], antes: [['patita', 'h3_1', 5], ['robo', 'h3_2', 0], ['chispa', 'h3_3', 3], ['bicho', 'h3_4', 6]], ok: [['robo', 'h3_ok', 1]] },
  { pista: 3, rivales: ['turbo', 'lata', 'bicho', 'robo', 'patita'], antes: [['lata', 'h4_1', 0], ['turbo', 'h4_2', 2], ['chispa', 'h4_3', 6]], ok: [['turbo', 'h4_ok', 2]] },
  { pista: 4, rivales: ['turbo', 'lata', 'bicho', 'robo', 'patita'], antes: [['bicho', 'h5_1', 3], ['lata', 'h5_2', 4], ['chispa', 'h5_3', 5]], ok: [['lata', 'h5_ok', 1]] },
  { pista: 5, rivales: ['turbo', 'lata', 'bicho', 'robo', 'patita'], antes: [['abuelo', 'h6_1', 0], ['turbo', 'h6_2', 5], ['chispa', 'h6_3', 5], ['bicho', 'h6_4', 1]], ok: [['turbo', 'h6_ok1', 4], ['chispa', 'h6_ok2', 1], ['abuelo', 'h6_ok3', 0]], final: true },
];
let ESC_H = null;
// arma la escena: los seis autitos en semicírculo frente a la largada
function empezarEscena(cap, lineas, alTerminar) {
  const S = ponerPista(CAPITULOS[cap].pista), C = S.C, m = marcoEn(C, 8);
  const ids = ['chispa', 'turbo', 'lata', 'bicho', 'robo', 'patita'], autos = {};
  ids.forEach((id, k) => {
    const a = nuevoAuto(figDe(id));
    const ang = (k - 2.5) * 0.42, r = 3.2, dx = Math.sin(ang) * r, df = Math.cos(ang) * r - r + (k === 0 ? 0.6 : 0);
    const x = m.px + m.rx * dx + m.tx * df, z = m.pz + m.rz * dx + m.tz * df;
    const yaw = Math.atan2(m.tx, m.tz) + PI + ang * 0.8;
    a.base = { x, y: m.py, z, yaw }; a.id = id;
    autos[id] = a;
  });
  ESC_H = { cap, lineas, i: 0, t: 0, letras: 0, alTerminar, autos, cam: null, m: { px: m.px, py: m.py, pz: m.pz, tx: m.tx, tz: m.tz, rx: m.rx, rz: m.rz } };
  Sonido.musica(1);
  decirLinea();
}
function decirLinea() {
  const E = ESC_H, L = E.lineas[E.i];
  E.t = 0; E.letras = 0;
  for (const id in E.autos) { E.autos[id].hablando = false; E.autos[id].gesto = 0; }
  if (L[0] !== 'abuelo') { const a = E.autos[L[0]]; a.hablando = true; a.gesto = L[2] || 0; }
  Sonido.pagina();
}
function avanzarEscena() {
  const E = ESC_H; if (!E) return;
  const s = tr(E.lineas[E.i][1]);
  if (E.letras < s.length) { E.letras = s.length; return; }
  E.i++;
  if (E.i >= E.lineas.length) { terminarEscena(); return; }
  decirLinea();
}
function terminarEscena() { const E = ESC_H; if (!E || E.fin) return; E.fin = true; const f = E.alTerminar; ESC_H = null; if (f) f(); }
function pasoEscena(dt) {
  const E = ESC_H; if (!E) return;
  E.t += dt;
  const s = tr(E.lineas[E.i][1]), antes = Math.floor(E.letras);
  E.letras = Math.min(s.length, E.letras + dt * 42);
  if (Math.floor(E.letras) > antes && Math.floor(E.letras) % 3 === 0 && E.letras < s.length) Sonido.globo();
  if (E.letras >= s.length) for (const id in E.autos) E.autos[id].hablando = false;
  // cámara: al que habla, o un plano general para el Abuelo
  const L = E.lineas[E.i], c = R.cam, M = E.m;
  let ob;
  if (L[0] === 'abuelo') ob = { x: M.px + M.tx * 3.2, y: M.py + 2.2, z: M.pz + M.tz * 3.2, tx: M.px - M.tx * 1.8, ty: M.py + 0.4, tz: M.pz - M.tz * 1.8, fov: 0.95 };
  else {
    const b = E.autos[L[0]].base, fx = Math.sin(b.yaw), fz = Math.cos(b.yaw), ap = W > H;
    ob = { x: b.x + fx * 1.7 + fz * 0.5, y: b.y + 0.75, z: b.z + fz * 1.7 - fx * 0.5, tx: b.x - fx * 0.1, ty: b.y + 0.42, tz: b.z - fz * 0.1, fov: ap ? 0.62 : 0.85 };
  }
  if (!E.cam) E.cam = Object.assign({}, ob);
  const k = 1 - Math.exp(-dt * 3.5);
  for (const q of ['x', 'y', 'z', 'tx', 'ty', 'tz', 'fov']) E.cam[q] += (ob[q] - E.cam[q]) * k;
  c.x = E.cam.x; c.y = E.cam.y; c.z = E.cam.z; c.tx = E.cam.tx; c.ty = E.cam.ty; c.tz = E.cam.tz; c.fovY = E.cam.fov; c.cerca = 0.05; c.lejos = 200;
  R.foco = Math.hypot(c.x - c.tx, c.y - c.ty, c.z - c.tz); R.rango = 4; R.centroD = [M.px, M.py, M.pz]; R.radioD = 8;
  // los autitos: quietos, con el conductor que mira a la cámara y se mueve al hablar
  for (const id in E.autos) {
    const a = E.autos[id], b = a.base;
    matAutoYaw(a.M, b.x, b.y, b.z, b.yaw);
    a.rebote = a.hablando ? Math.abs(Math.sin(T * 9)) * 0.012 : 0;
    const dx = c.x - b.x, dz = c.z - b.z, mira = angDif(b.yaw, Math.atan2(dx, dz));
    a.cab.yaw = lerp(a.cab.yaw, clamp(mira, -0.9, 0.9) * 0.7, 0.1); a.cab.pitch = a.hablando ? Math.sin(T * 7) * 0.06 : 0; a.cab.roll = Math.sin(T * 1.3 + b.x) * 0.04;
    a.torso.yaw = clamp(mira, -0.9, 0.9) * 0.25; a.llave += dt * 1.2; a.buf = 0.25;
    posarAuto(a, T);
  }
  R.vaciarInst();
}
function dibujarEscena3D() { R.dibujar(T, Object.values(ESC_H.autos)); R.post(T); }
function dibujarEscena2D(g) {
  const E = ESC_H, L = E.lineas[E.i], quien = L[0], s = tr(L[1]), ap = W > H;
  const w = Math.min(W - 20, 420), x = (W - w) / 2, tam = 13, lineas = partir(s, w - 90, tam, 1), lh = altoRenglon(tam), h = Math.max(96, 44 + lineas.length * lh), y = H - h - (ap ? 10 : 22);
  chapa(g, x, y, w, h, CREMA, { r: 12, sombra: 6, borde: 4, remaches: true });
  const nom = quien === 'abuelo' ? tr('abuelo') : tr('pj_' + quien), col = quien === 'abuelo' ? '#8a5a3a' : PERSONAJES[quien].c1;
  cinta(g, x + 70, y - 16, nom, { tam: 11, c: col });
  if (quien === 'abuelo') retratoAbuelo(g, x + 40, y + h / 2 + 4, 28);
  else caraUI(g, quien, x + 40, y + h / 2 + 4, 26, L[2] || 0);
  let quedan = Math.floor(E.letras);
  lineas.forEach((l, i) => { const v = l.slice(0, Math.max(0, quedan)); quedan -= l.length + 1; if (v) txt(g, v, x + 76, y + 26 + lh * i + lh / 2, { tam, c: TINTA, b: null, al: 0, max: w - 90 }); });
  if (E.letras >= s.length && Math.sin(T * 6) > 0) icono(g, 'play', x + w - 18, y + h - 16, 10, ROJO);
  zona(0, 0, W, H, () => avanzarEscena());
  boton(g, W - 100, 12, 88, 32, tr('saltar'), () => terminarEscena(), { tam: 11, ic: 'flechaDer', c: CREMA, sombra: 2.5 });
  txtR(g, tr('cap') + ' ' + (E.cap + 1) + ' · ' + tr('pista_' + PISTAS[CAPITULOS[E.cap].pista].id), 14, 28, { tam: 11, c: CREMA, al: 0, max: W - 130 });
}
// el Abuelo Tornillo, pintado: boina, anteojos redondos, bigote blanco
function retratoAbuelo(g, x, y, r) {
  const s = sello('abuelo' + r, r * 2 + 8, r * 2 + 8, b => {
    const c = r + 4;
    b.fillStyle = '#8a5a3a'; b.beginPath(); b.arc(c, c, r + 2, 0, TAU); b.fill();
    b.save(); b.beginPath(); b.arc(c, c, r, 0, TAU); b.clip();
    b.fillStyle = '#4ab8e8'; b.fillRect(0, 0, r * 3, r * 3);
    b.fillStyle = '#f2c8a0'; b.beginPath(); b.ellipse(c, c + r * 0.25, r * 0.62, r * 0.72, 0, 0, TAU); b.fill();
    b.fillStyle = '#2a3a5a'; b.beginPath(); b.ellipse(c - r * 0.05, c - r * 0.42, r * 0.78, r * 0.3, -0.15, 0, TAU); b.fill(); b.beginPath(); b.arc(c - r * 0.1, c - r * 0.68, r * 0.08, 0, TAU); b.fill();
    b.strokeStyle = '#d9a441'; b.lineWidth = 2; for (const s2 of [-1, 1]) { b.beginPath(); b.arc(c + s2 * r * 0.24, c + r * 0.05, r * 0.17, 0, TAU); b.stroke(); }
    b.fillStyle = '#1b1a2e'; for (const s2 of [-1, 1]) { b.beginPath(); b.arc(c + s2 * r * 0.24, c + r * 0.06, r * 0.05, 0, TAU); b.fill(); }
    b.fillStyle = '#ffffff'; b.beginPath(); b.moveTo(c, c + r * 0.36); b.bezierCurveTo(c - r * 0.3, c + r * 0.26, c - r * 0.5, c + r * 0.4, c - r * 0.55, c + r * 0.6); b.bezierCurveTo(c - r * 0.3, c + r * 0.5, c - r * 0.1, c + r * 0.55, c, c + r * 0.5); b.bezierCurveTo(c + r * 0.1, c + r * 0.55, c + r * 0.3, c + r * 0.5, c + r * 0.55, c + r * 0.6); b.bezierCurveTo(c + r * 0.5, c + r * 0.4, c + r * 0.3, c + r * 0.26, c, c + r * 0.36); b.fill();
    b.fillStyle = 'rgba(236,90,90,0.4)'; for (const s2 of [-1, 1]) { b.beginPath(); b.arc(c + s2 * r * 0.42, c + r * 0.3, r * 0.1, 0, TAU); b.fill(); }
    b.restore();
    b.lineWidth = 1.5; b.strokeStyle = TINTA; b.beginPath(); b.arc(c, c, r + 2, 0, TAU); b.stroke();
  });
  g.drawImage(s, x - r - 4, y - r - 4, s.width / S, s.height / S);
}
// ---------- el capítulo: escena, carrera, escena de después ----------
function jugarCapitulo(i, sinEscena) {
  const C = CAPITULOS[i];
  const aCorrer = () => irA('carrera', () => {
    DEMO = false;
    nuevaCarrera({ pista: C.pista, yo: 'chispa', corredores: ['chispa'].concat(C.rivales), grilla: [3, 0, 1, 2, 4, 5], vueltas: 3, modo: 'historia', dificultad: 0.95 + i * 0.01, semilla: 1000 + i * 37 + (PROG.intentos[i] || 0),
      alTerminar: r => {
        PROG.intentos[i] = (PROG.intentos[i] || 0) + 1;
        const paso = C.final ? r.puesto === 0 : r.puesto <= 2;
        if (paso) { const ant = PROG.ganados[i]; if (ant == null || r.puesto < ant) PROG.ganados[i] = r.puesto; if (PROG.cap <= i) { PROG.cap = i + 1; r.desbloqueo = i + 1 < PISTAS.length ? i + 1 : null; } }
        guardarProg();
        r.paso = paso;
        mostrarResultado(r, () => {
          if (paso) irA('escena', () => empezarEscena(i, C.ok, () => { if (C.final) { PROG.fin = true; guardarProg(); mostrarCreditos(); } else irA('historia'); }));
          else irA('escena', () => empezarEscena(i, [['bicho', C.final ? 'h6_no' : 'hX_no', 4]], () => jugarCapitulo(i, true)));
        });
      } });
  });
  if (sinEscena) aCorrer();
  else irA('escena', () => empezarEscena(i, C.antes, () => { ESCENA = 'escena'; aCorrer(); }));
}
