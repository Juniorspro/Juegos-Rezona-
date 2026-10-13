// FAMATINA — la intro de JXSTUDIOS a su estilo: la roca de la mina se abre con un tajo de luz, el monograma
// JXS se escribe en ORO con chispas de pico en las puntas, en el golpe estalla la dinamita (destello, polvo y
// piedras) y JXSTUDIOS se tipea en la letra de píxeles del juego. La música: picos, la explosión, charango y quena.
function fondoRoca(W, H, cx, cy) {
  const c = lienzo(W, H), g = c.getContext('2d'), img = g.createImageData(W, H), d = img.data, r = rngSemilla(23);
  const ruido = (x, y) => { const h = Math.imul(x * 374761393 + y * 668265263, 1274126177); return ((h ^ (h >>> 15)) >>> 0) / 4294967296; };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const n = ruido(x >> 2, y >> 2) * 0.55 + ruido(x >> 1, y >> 1) * 0.3 + ruido(x, y) * 0.15, luz = 1 - Math.min(1, Math.hypot(x - cx, (y - cy) * 1.2) / Math.max(W, H) * 1.4);
    const v = 14 + n * 16 + luz * 18, k = (y * W + x) * 4;
    d[k] = v + 9; d[k + 1] = v + 4; d[k + 2] = v; d[k + 3] = 255;
  }
  const pon = (x, y, col) => { if (x < 0 || y < 0 || x >= W || y >= H) return; const k = (y * W + x) * 4, n = parseInt(col.slice(1), 16); d[k] = n >> 16; d[k + 1] = (n >> 8) & 255; d[k + 2] = n & 255; };
  // vetas de oro que cruzan la roca y piedritas claras
  for (let v = 0; v < 7; v++) {
    let x = r() * W, y = r() * H, a = r() * Math.PI * 2;
    for (let i = 0; i < 70; i++) { a += (r() - 0.5) * 0.7; x += Math.cos(a) * 1.4; y += Math.sin(a) * 1.4; pon(Math.round(x), Math.round(y), r() < 0.25 ? '#fff0a0' : r() < 0.6 ? '#e0a83a' : '#a86a1e'); }
  }
  for (let i = 0; i < W * H / 60; i++) pon((r() * W) | 0, (r() * H) | 0, r() < 0.5 ? '#5a4a40' : '#3a2e28');
  g.putImageData(img, 0, 0);
  return c;
}
const ESTILO_FAMATINA = {
  negro: '#07050a', chispa: 1,
  metal: ['#fff6c0', '#ffe58a', '#f8cf55', '#f0b83a', '#e09a2a', '#f8cf55', '#c87a1e', '#a85e16'],
  filo: '#fffbe6', bisel: '#6a3a0a', borde: '#140a04',
  puntas: ['#ffffff', '#ffe08a', '#ff9a3a'],
  golpe: ['#ffffff', '#ffd27a', '#e0a040', '#8a7060', '#5a4a40', '#b0a090'],
  destello: 'rgba(255,236,170,0.85)',
  fondo: (W, H, cx, cy) => fondoRoca(W, H, cx, cy),
  letras(g, parte, I, t, y) {
    const tt = I.W >= 200 ? 2 : 1, w = anchoTxt(g, 'JXSTUDIOS', { t: tt }), x = Math.round(I.cx - w / 2);
    txt(g, parte, x, y, { t: tt, c: ORO7, b: '#1a0a04' });
    if (parte.length < 9 && ((t * 20) | 0) % 2) rect(g, x + anchoTxt(g, parte, { t: tt }) + tt, y, tt, 7 * tt, '#fff6d8');
  },
  presentaTxt(g, s, I, t, y) { const tt = I.W >= 200 ? 2 : 1; txt(g, s, I.cx, y + 12 * tt, { al: 0.5, c: '#c8a878', b: '#1a0a04', max: I.W - 10 }); },
  jingle(ctx, bus, t0, tg, h) {
    const { tono, soplo, f, T } = h;
    soplo(0.2, 0.1, 'bandpass', 900, 4000, t0);                                                         // el tajo de luz
    [0.3, 0.42, 0.54, 0.66].forEach((d, k) => { tono('square', 1900 + k * 90, 1200, 0.05, 0.05, t0 + d); soplo(0.04, 0.08, 'highpass', 3000, 2500, t0 + d); });   // los picos
    tono('sine', 90, 30, 0.9, 0.6, tg); soplo(0.9, 0.4, 'lowpass', 2400, 80, tg);                     // la dinamita
    tono('sine', 880, 0, 0.8, 0.08, tg + 0.05); tono('sine', 1760, 0, 0.5, 0.04, tg + 0.05);           // la campana de la mina
    [64, 67, 71, 76, 79].forEach((m, k) => tono('triangle', f(m), 0, 0.45, 0.06, tg + 0.15 + k * 0.03));   // rasgueo de charango
    for (let k = 0; k < 9; k++) tono('square', 1320 + (k % 3) * 110, 0, 0.022, 0.03, t0 + T.T_LETRAS + k * 0.04);
    tono('sine', f(76), 0, 1.0, 0.07, t0 + 1.5, 0.12); tono('sine', f(88), 0, 0.8, 0.015, t0 + 1.5, 0.12);   // la quena
  },
};
