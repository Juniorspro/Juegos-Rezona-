// HOJALATA — la intro de JXSTUDIOS a su estilo: una chapa litografiada (rayos de sol crema y mostaza, marco de
// remaches), el monograma se estampa como tiras de lata plateada con filete rojo, en el golpe salta una llave de
// dar cuerda que gira y vuelan engranajitos; JXSTUDIOS en relieve y "presenta" en una cinta. Suena el trinquete de
// la cuerda, un resorte, la cajita de música y un timbre de bicicleta.
function fondoChapa(W, H, cx, cy) {
  const c = lienzo(W * S, H * S), g = c.getContext('2d');
  g.setTransform(S, 0, 0, S, 0, 0);
  g.fillStyle = '#f6e7c6'; g.fillRect(0, 0, W, H);
  const R = Math.hypot(W, H);
  for (let i = 0; i < 28; i++) { g.fillStyle = i % 2 ? '#f2c45a' : '#f6e7c6'; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R, i / 28 * TAU, (i + 1) / 28 * TAU); g.closePath(); g.fill(); }
  const gr = g.createRadialGradient(cx, cy, Math.min(W, H) * 0.2, cx, cy, R * 0.6); gr.addColorStop(0, 'rgba(255,250,235,0)'); gr.addColorStop(1, 'rgba(120,40,30,0.45)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  // marco de lata con remaches
  g.lineWidth = 14; g.strokeStyle = '#d8352a'; g.strokeRect(7, 7, W - 14, H - 14);
  g.lineWidth = 2; g.strokeStyle = '#1b1a2e'; g.strokeRect(14, 14, W - 28, H - 28); g.strokeRect(1, 1, W - 2, H - 2);
  for (let x = 24; x < W - 14; x += 28) for (const y of [7, H - 7]) remache(g, x, y, 2.6);
  for (let y = 24; y < H - 14; y += 28) for (const x of [7, W - 7]) remache(g, x, y, 2.6);
  return c;
}
function engranajito(g, x, y, r, rot, col) {
  g.save(); g.translate(x, y); g.rotate(rot); g.fillStyle = col; g.beginPath();
  for (let k = 0; k < 16; k++) { const a = k / 16 * TAU, rr = k % 2 ? r : r * 1.3; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  g.closePath(); g.fill(); g.fillStyle = 'rgba(27,26,46,0.6)'; g.beginPath(); g.arc(0, 0, r * 0.35, 0, TAU); g.fill(); g.restore();
}
const ESTILO_HOJALATA = {
  negro: '#1b1a2e', chispa: 2,
  anchoLogo: (W, H) => Math.round(Math.min(W * 0.72, H * 0.5, 330)),
  puntas: [BLANCO, AMARILLO, PLATA],
  golpe: [ROJO, AMARILLO, AZUL, PLATA, ORO, VERDE],
  destello: 'rgba(255,250,230,0.85)',
  fondo: (W, H, cx, cy) => fondoChapa(W, H, cx, cy),
  dibujarChispa(g, c) { engranajito(g, c.x, c.y, 3.2, c.t * 8 + c.vx, c.col); },
  logo(g, i) {
    const G = 14.5 * i.esc;
    const gr = g.createLinearGradient(i.x0, i.y0, i.x0, i.y0 + i.ancho * 0.5); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.45, '#c9ced8'); gr.addColorStop(0.55, '#8a909c'); gr.addColorStop(1, '#dfe3ea');
    for (const capa of [0, 1]) for (const tz of i.TRAZOS) {
      if (tz.capa !== capa) continue;
      const p = i.camino2d(tz, i.esc, i.x0, i.y0), l = i.largo(tz) * i.esc;
      g.save();
      if (i.avance < 1) g.setLineDash([Math.max(0.01, l * i.avance), l + 80]);
      g.lineCap = 'round'; g.lineJoin = 'round';
      g.save(); g.translate(G * 0.25, G * 0.4); g.strokeStyle = 'rgba(27,26,46,0.55)'; g.lineWidth = G * 1.55; g.stroke(p); g.restore();
      g.strokeStyle = '#1b1a2e'; g.lineWidth = G * 1.55; g.stroke(p);
      g.strokeStyle = gr; g.lineWidth = G * 1.12; g.stroke(p);
      g.strokeStyle = '#d8352a'; g.lineWidth = G * 0.34; g.stroke(p);
      g.save(); g.translate(-G * 0.1, -G * 0.2); g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = G * 0.14; g.stroke(p); g.restore();
      g.restore();
    }
    if (i.golpe) {
      const k = i.lim(i.tGolpe / 0.5, 0, 1), s = rebote(i.lim(i.tGolpe / 0.35, 0, 1));
      if (k > 0) {
        g.save(); g.translate(i.x0 + i.ancho * 0.5, i.y0 - i.ancho * 0.1 - s * i.ancho * 0.05); g.scale(s, s); g.rotate(i.tGolpe * 9);
        icono(g, 'llave', 0, 0, i.ancho * 0.16, '#d9a441');
        g.restore();
      }
    }
  },
  letras(g, parte, I, t, y) {
    const tam = Math.min(30, I.W * 0.085), w = medir('JXSTUDIOS', tam, 1), x = I.cx - w / 2;
    txt(g, parte, x + 1.5, y + tam * 0.75 + 2.5, { tam, c: 'rgba(27,26,46,0.8)', b: null, al: 0 });
    txt(g, parte, x, y + tam * 0.75, { tam, c: '#d8352a', b: '#1b1a2e', bw: 2.4, al: 0 });
    if (parte.length < 9 && ((t * 20) | 0) % 2) { g.fillStyle = '#1b1a2e'; g.fillRect(x + medir(parte, tam, 1) + 4, y + tam * 0.4, 3, tam * 0.7); }
  },
  presentaTxt(g, s, I, t, y) {
    const tam = Math.min(30, I.W * 0.085), a = clamp((t - 1.52) / 0.25, 0, 1);
    g.globalAlpha = a; cinta(g, I.cx, y + tam * 1.4, s, { tam: 11, c: AZUL, max: I.W - 60 }); g.globalAlpha = 1;
  },
  jingle(ctx, bus, t0, tg, h) {
    const { tono, soplo, f, T } = h;
    // el trinquete de la cuerda mientras se estampa
    for (let k = 0; k < 14; k++) soplo(0.02, 0.08, 'highpass', 3200, 2800, t0 + 0.1 + k * 0.075 * (1 - k * 0.025));
    // el golpe: resorte que rebota, chapa, cajita de música y timbre de bicicleta
    tono('triangle', 200, 620, 0.5, 0.2, tg); tono('sine', 380, 0, 0.35, 0.12, tg); tono('sine', 912, 0, 0.25, 0.08, tg); soplo(0.05, 0.2, 'highpass', 2500, 2000, tg);
    [[72, 0.12], [76, 0.24], [79, 0.36], [84, 0.5], [88, 0.62]].forEach(([m, d]) => { tono('sine', f(m), 0, 0.9, 0.09, tg + d); tono('sine', f(m) * 4.02, 0, 0.1, 0.03, tg + d); });
    for (const d of [0.95, 1.12]) { tono('sine', 2350, 0, 0.6, 0.06, tg + d); tono('sine', 3120, 0, 0.45, 0.04, tg + d); }
    for (let k = 0; k < 9; k++) tono('triangle', 1500 + (k % 3) * 160, 0, 0.03, 0.03, t0 + T.T_LETRAS + k * 0.04);
  },
};
