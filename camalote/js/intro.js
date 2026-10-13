// CAMALOTE — la intro de JXSTUDIOS a su estilo: el río al amanecer se abre con un tajo de luz, el monograma
// JXS se escribe como el logo del juego (verde con borde de tinta), en el golpe salta el agua y florece un
// camalote, y JXSTUDIOS se tipea en Fredoka. La música: gotas, un "plop", acordeón y guitarra de chamamé.
function fondoRioIntro(W, H) {
  const [c, g] = lienzoK(W, H), r = rngSemilla(11);
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#0d3442'); gr.addColorStop(0.55, '#1c6474'); gr.addColorStop(1, '#2a8486');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.lineWidth = 1.2;
  for (let k = 0; k < 80; k++) { const x = r() * W, y = r() * H, w = 10 + r() * 42; g.strokeStyle = 'rgba(255,255,255,' + (0.04 + r() * 0.08).toFixed(3) + ')'; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + w / 2, y - 3, x + w, y); g.stroke(); }
  for (const [x, y, s] of [[0.08, 0.1, 1.3], [0.93, 0.18, 1.05], [0.1, 0.88, 1.5], [0.9, 0.82, 1.15], [0.55, 0.97, 0.9]]) camaloteArte(g, W * x, H * y, s, 0);
  const v = g.createRadialGradient(W / 2, H * 0.42, Math.min(W, H) * 0.22, W / 2, H * 0.42, Math.max(W, H) * 0.72);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,12,10,0.6)'); g.fillStyle = v; g.fillRect(0, 0, W, H);
  return c;
}
const ESTILO_CAMALOTE = {
  negro: '#071a14', chispa: 2,
  anchoLogo: (W, H) => Math.round(Math.min(W * 0.7, H * 0.48, 320)),
  puntas: ['#ffffff', '#d4f2ff', '#8fd3f2'],
  golpe: ['#ffffff', '#d4f2ff', '#8fd3f2', '#c890e8', '#ffe066', '#7ac862'],
  destello: 'rgba(225,248,255,0.5)',
  fondo: (W, H) => fondoRioIntro(W, H),
  dibujarChispa(g, c) { elip(g, c.x, c.y, 1.9, 1.9); g.fillStyle = c.col; g.fill(); },
  logo(g, i) {
    const G = 14.5 * i.esc;
    for (const capa of [0, 1]) for (const tz of i.TRAZOS) {
      if (tz.capa !== capa) continue;
      const p = i.camino2d(tz, i.esc, i.x0, i.y0), l = i.largo(tz) * i.esc;
      g.save();
      if (i.avance < 1) g.setLineDash([Math.max(0.01, l * i.avance), l + 60]);
      g.lineCap = 'round'; g.lineJoin = 'round';
      g.save(); g.translate(G * 0.2, G * 0.3); g.strokeStyle = 'rgba(0,18,10,0.35)'; g.lineWidth = G * 1.5; g.stroke(p); g.restore();
      g.strokeStyle = LINEA; g.lineWidth = G * 1.46; g.stroke(p);
      const gr = g.createLinearGradient(0, i.y0, 0, i.y0 + i.ancho * 0.5); gr.addColorStop(0, '#c8f07a'); gr.addColorStop(0.55, '#5abf4a'); gr.addColorStop(1, '#2e8a3a');
      g.strokeStyle = gr; g.lineWidth = G; g.stroke(p);
      g.save(); g.translate(-G * 0.14, -G * 0.2); g.strokeStyle = 'rgba(235,255,190,0.55)'; g.lineWidth = G * 0.26; g.stroke(p); g.restore();
      g.restore();
    }
    if (i.golpe) {
      const cx = i.x0 + i.ancho / 2, cy = i.y0 + i.ancho * 0.25, k = i.lim(i.tGolpe / 0.7, 0, 1);
      if (k < 1) { elip(g, cx, cy + i.ancho * 0.1, i.ancho * 0.75 * i.salida(k), i.ancho * 0.26 * i.salida(k)); g.strokeStyle = 'rgba(220,245,255,' + (1 - k).toFixed(3) + ')'; g.lineWidth = 3 * (1 - k) + 0.5; g.stroke(); }
      // en el golpe florece un camalote al pie del monograma
      const s = rebote(i.lim(i.tGolpe / 0.35, 0, 1)) * i.esc * 3.4;
      camaloteArte(g, i.x0 + i.ancho * 0.93, i.y0 + i.ancho * 0.47, s, i.t);
    }
  },
  letras(g, parte, I, t, y) {
    const tam = Math.min(34, I.W * 0.09), f = '700 ' + tam.toFixed(1) + 'px Fredoka,"Trebuchet MS",sans-serif';
    g.font = f; g.textBaseline = 'middle'; g.textAlign = 'left'; g.direction = 'ltr';
    const total = g.measureText('JXSTUDIOS').width, x = I.cx - total / 2, yy = y + tam * 0.75;
    g.lineJoin = 'round'; g.lineWidth = tam * 0.22; g.strokeStyle = LINEA;
    g.fillStyle = 'rgba(0,18,10,0.4)'; g.fillText(parte, x + 2, yy + 3);
    g.strokeText(parte, x, yy);
    const gr = g.createLinearGradient(0, yy - tam * 0.45, 0, yy + tam * 0.45); gr.addColorStop(0, '#fff6d8'); gr.addColorStop(1, '#e8d49a');
    g.fillStyle = gr; g.fillText(parte, x, yy);
    if (parte.length < 9 && ((t * 20) | 0) % 2) { g.fillStyle = '#fff6d8'; g.fillRect(x + g.measureText(parte).width + 3, yy - tam * 0.38, 2.5, tam * 0.76); }
  },
  presentaTxt(g, s, I, t, y) {
    const tam = Math.min(34, I.W * 0.09), a = clamp((t - 1.52) / 0.25, 0, 1);
    g.globalAlpha = a;
    txt(g, s.toUpperCase(), I.cx, y + tam * 1.7, { tam: 14, c: '#bfe6c8', al: 0.5, max: I.W - 40 });
    g.globalAlpha = 1;
  },
  jingle(ctx, bus, t0, tg, h) {
    const { tono, soplo, f, T } = h;
    soplo(0.25, 0.1, 'bandpass', 500, 2600, t0);                                                        // el tajo: agua que corre
    [0.3, 0.42, 0.54, 0.68].forEach((d, k) => tono('sine', f(79 + k * 3), f(86 + k * 3), 0.1, 0.05, t0 + d));   // gotas en las puntas
    tono('sine', 520, 110, 0.32, 0.45, tg); soplo(0.55, 0.22, 'bandpass', 2200, 300, tg);               // el plop y el salpicón
    for (const m of [62, 66, 69, 74]) { tono('sawtooth', f(m), 0, 1.4, 0.022, tg + 0.03, 0.09); tono('sawtooth', f(m) * 1.005, 0, 1.4, 0.018, tg + 0.03, 0.09); }   // acordeón
    [50, 57, 62, 66, 69].forEach((m, k) => tono('triangle', f(m), 0, 0.7, 0.07, tg + 0.12 + k * 0.03));   // rasgueo
    for (let k = 0; k < 9; k++) tono('triangle', 1500 + (k % 3) * 140, 0, 0.03, 0.025, t0 + T.T_LETRAS + k * 0.04);
    [74, 78, 81].forEach((m, k) => tono('sine', f(m), 0, 0.5, 0.04, t0 + 1.55 + k * 0.08));
  },
};
