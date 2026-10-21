// MANSION BUILDER — la pantalla de carga: cielo con nubes de píxeles, el logo de bloques, el constructor que saluda,
// una casita que se arma con el progreso, la barra de bloques y consejos. Al terminar: "tocá para jugar".
const CARGA = { t: 0, nubes: null, piel: null, tip: 0, tipT: 0, fondo: null, clave: '' };
function pielLienzo() {
  if (CARGA.piel) return CARGA.piel;
  const datos = PJ.datos || armarPieles(), c = lienzo(64, 64), g = c.getContext('2d'), im = g.createImageData(64, 64);
  im.data.set(datos.subarray(PIELES.jugador * 64 * 64 * 4, (PIELES.jugador + 1) * 64 * 64 * 4)); g.putImageData(im, 0, 0);
  return (CARGA.piel = c);
}
// el fondo quieto (cielo, sol, pasto y tierra) en caché, se rehace solo si cambia el tamaño
function fondoCarga(Wc, Hc, U) {
  const clave = Wc + 'x' + Hc + 'x' + DPR;
  if (CARGA.clave === clave) return CARGA.fondo;
  const k = Math.min(DPR, 2), c = lienzo(Wc * k, Hc * k), g = c.getContext('2d');
  g.setTransform(k, 0, 0, k, 0, 0);
  const gr = g.createLinearGradient(0, 0, 0, Hc); gr.addColorStop(0, '#3fa9f5'); gr.addColorStop(0.6, '#9ad8ff'); gr.addColorStop(1, '#d9f2ff');
  g.fillStyle = gr; g.fillRect(0, 0, Wc, Hc);
  const b = Math.ceil(14 * U), y0 = Hc - Math.max(110 * U, Hc * 0.17), r = rngSemilla(5);
  for (let x = 0; x < Wc; x += b) {
    const alto = y0 + (r() < 0.25 ? -b : 0);
    for (let y = alto; y < Hc; y += b) {
      const capa = y < alto + b ? 0 : y < alto + b * 1.7 ? 1 : 2;
      const cols = [['#6ccf3c', '#5fbf32', '#7ad94a'], ['#8b5a2b', '#9a6532', '#7b4f25'], ['#7a7a7e', '#8a8a8e', '#6e6e72']][capa === 2 && y > Hc - b * 1.5 ? 2 : Math.min(capa, 1)];
      g.fillStyle = cols[(r() * 3) | 0]; g.fillRect(x, y, b + 0.5, b + 0.5);
      g.fillStyle = 'rgba(0,0,0,0.08)'; g.fillRect(x + b * 0.5, y + b * 0.5, b * 0.25, b * 0.25);
      if (capa === 0) { g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(x, y, b, b * 0.2); }
    }
  }
  CARGA.fondo = c; CARGA.clave = clave; CARGA.suelo = y0;
  return c;
}
function nubePixel(g, x, y, s) {
  g.fillStyle = 'rgba(255,255,255,0.92)';
  for (const [a, b, w, h] of [[0, 1, 6, 2], [1, 0, 3, 1], [4, 0, 1, 1], [-1, 2, 8, 1]]) g.fillRect(x + a * s, y + b * s, w * s, h * s);
  g.fillStyle = 'rgba(200,225,245,0.9)'; g.fillRect(x - s, y + 3 * s, 8 * s, s * 0.7);
}
// el constructor de frente, pintado con su piel (saluda con el brazo)
function constructor2D(g, x, y, px, t) {
  const piel = pielLienzo(); g.imageSmoothingEnabled = false;
  const d = (u, v, w, h, X, Y) => g.drawImage(piel, u, v, w, h, x + X * px, y + Y * px, w * px, h * px);
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(x + 4 * px, y + 32 * px, 7 * px, 1.6 * px, 0, 0, TAU); g.fill();
  const bob = Math.round(Math.sin(t * 3) * 0.6);
  d(4, 20, 4, 12, 0, 20); d(20, 52, 4, 12, 4, 20);
  d(20, 20, 8, 12, 0, 8 + bob * 0.2);
  d(36, 52, 4, 12, 8, 8 + bob * 0.2);
  g.save(); g.translate(x - 2 * px, y + 9 * px); g.rotate(-2.4 + Math.sin(t * 7) * 0.35); g.drawImage(piel, 44, 20, 4, 12, -2 * px, -1 * px, 4 * px, 12 * px); g.restore();
  d(8, 8, 8, 8, 0, bob * 0.2); d(40, 8, 8, 8, 0, bob * 0.2);
  g.imageSmoothingEnabled = true;
}
// la casita que se arma con el progreso (bloques isométricos)
const CASITA = (() => {
  const L = [];
  for (let y = 0; y < 3; y++) for (let z = 0; z < 3; z++) for (let x = 0; x < 4; x++) {
    if (y > 0 && x > 0 && x < 3 && z > 0 && z < 2) continue;
    const b = y === 0 ? B.LADRILLO_PIEDRA : (z === 0 && (x === 1 || x === 2) && y === 1 ? B.VIDRIO : B.CUARZO);
    L.push([x, y, z, b]);
  }
  for (let z = 0; z < 3; z++) for (let x = 0; x < 4; x++) L.push([x, 3, z, B.PIZARRA]);
  L.push([1, 4, 1, B.PIZARRA], [2, 4, 1, B.PIZARRA], [3, 4, 2, B.ORO]);
  L.sort((a, b) => a[1] - b[1] || (b[2] - a[2]) || a[0] - b[0]);
  return L;
})();
function dibujarCarga(g, dt, prog, listo) {
  const U = UI.U, Wc = CSSW, Hc = CSSH, t = (CARGA.t += dt);
  g.drawImage(fondoCarga(Wc, Hc, U), 0, 0, Wc, Hc);
  // el sol y las nubes
  const sx = Wc * 0.84, sy = Hc * 0.1;
  g.save(); g.translate(sx, sy); g.rotate(t * 0.15); g.fillStyle = 'rgba(255,240,150,0.35)';
  for (let k = 0; k < 10; k++) { g.rotate(TAU / 10); g.fillRect(-4 * U, 26 * U, 8 * U, 26 * U); }
  g.restore();
  g.fillStyle = '#ffe45c'; g.fillRect(sx - 20 * U, sy - 20 * U, 40 * U, 40 * U); g.fillStyle = '#fff3a0'; g.fillRect(sx - 14 * U, sy - 14 * U, 22 * U, 22 * U);
  for (let k = 0; k < 4; k++) { const s = (5 + (k % 2) * 2) * U, x = ((k * 173 + t * (12 + k * 5) * U) % (Wc + 120 * U)) - 80 * U; nubePixel(g, x, Hc * (0.06 + k * 0.07), s); }
  // el logo
  const ly = Hc * 0.2, t1 = tamQueEntra(g, 'MANSION', 54 * U, Wc - 40 * U), t2 = tamQueEntra(g, 'BUILDER', 40 * U, Wc - 60 * U), wob = Math.sin(t * 2) * 2 * U;
  const logo = (s, y, tam, c1, c2) => {
    letra(g, tam); g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let k = 7; k >= 1; k--) { g.fillStyle = k > 5 ? '#3a1f08' : '#7a3c0c'; g.fillText(s, Wc / 2 + k * 0.5 * U, y + k * U); }
    g.lineJoin = 'round'; g.lineWidth = tam * 0.16; g.strokeStyle = '#3a1f08'; g.strokeText(s, Wc / 2, y);
    const gr = g.createLinearGradient(0, y - tam / 2, 0, y + tam / 2); gr.addColorStop(0, c1); gr.addColorStop(1, c2);
    g.fillStyle = gr; g.fillText(s, Wc / 2, y);
  };
  logo('MANSION', ly + wob, t1, '#fff7b0', '#ffb31a');
  logo('BUILDER', ly + t1 * 0.85 + wob, t2, '#ffffff', '#9fd8ff');
  const sub = T('sub'); texto(g, sub, Wc / 2, ly + t1 * 0.85 + t2 * 0.9 + 6 * U, tamQueEntra(g, sub, 15 * U, Wc - 40 * U), '#ffffff', '#1d3557');
  // el constructor y la casita sobre el pasto
  const suelo = CARGA.suelo, px = Math.max(3, Math.round(Math.min(6.5 * U, (suelo - ly - 150 * U) / 34)));
  constructor2D(g, Wc * 0.27 - 4 * px, suelo - 32 * px + 2 * U, px, t);
  const n = Math.floor(CASITA.length * clamp(prog, 0, 1)), bs = Math.min(36 * U, px * 7), ox = Wc * 0.68, oy = suelo - bs * 0.62;
  for (let i = 0; i < n; i++) {
    const [x, y, z, b] = CASITA[i], ic = iconoBloque(b);
    const caer = i === n - 1 && !listo ? (1 - (t * 3 % 1)) * 10 * U : 0;
    g.drawImage(ic, ox + (x - z) * bs * 0.5 - bs / 2, oy + (x + z) * bs * 0.25 - y * bs * 0.5 - caer - bs * 0.5, bs, bs * 1.12);
  }
  // la barra o "tocá para jugar"
  const by = suelo - 230 * U < ly + 140 * U ? suelo + 30 * U : suelo + 30 * U, bw = Math.min(Wc - 60 * U, 300 * U);
  if (!listo) {
    g.fillStyle = 'rgba(0,0,0,0.35)'; rr(g, Wc / 2 - bw / 2 - 4 * U, by - 4 * U, bw + 8 * U, 26 * U, 8 * U); g.fill();
    const nb = 14, w = bw / nb, lleno = prog * nb;
    for (let i = 0; i < nb; i++) {
      const k = clamp(lleno - i, 0, 1);
      g.fillStyle = '#24361b'; g.fillRect(Wc / 2 - bw / 2 + i * w + 1 * U, by, w - 2 * U, 18 * U);
      if (k > 0) { g.fillStyle = '#5ee06a'; g.fillRect(Wc / 2 - bw / 2 + i * w + 1 * U, by + 18 * U * (1 - k), w - 2 * U, 18 * U * k); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(Wc / 2 - bw / 2 + i * w + 1 * U, by + 18 * U * (1 - k), w - 2 * U, 4 * U * k); }
    }
    texto(g, T('cargando') + '.'.repeat(1 + Math.floor(t * 2.5) % 3), Wc / 2, by + 40 * U, 13 * U, '#ffffff', '#1d3557');
  } else {
    const s = T('toca'), e = 1 + Math.sin(t * 5) * 0.06;
    g.save(); g.translate(Wc / 2, by + 14 * U); g.scale(e, e); texto(g, s, 0, 0, tamQueEntra(g, s, 26 * U, Wc - 40 * U), '#ffffff', '#1d3557', 'center', 6 * U); g.restore();
  }
  CARGA.tipT -= dt; if (CARGA.tipT <= 0) { CARGA.tipT = 3.2; CARGA.tip = (CARGA.tip + 1) % T('tips').length; }
  const tip = T('tips')[CARGA.tip]; envolver(g, tip, Wc / 2, Hc - 34 * U, Wc - 50 * U, 12 * U, '#ffffff');
  texto(g, 'JXSTUDIOS', Wc / 2, Hc - 10 * U, 9 * U, 'rgba(255,255,255,0.75)', null);
}
