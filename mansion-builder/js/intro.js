// MANSION BUILDER — la intro de JXSTUDIOS a su estilo: cielo de día con pasto de bloques, el monograma se arma con
// trazos de oro macizo (canto oscuro, brillo arriba), en el golpe saltan bloquecitos de pasto, madera, piedra y oro,
// JXSTUDIOS en letra gorda y "presenta" en un cartel de madera. Suenan bloques que se ponen y una moneda.
function fondoIntro(W, H) {
  const k = Math.min(DPR, 2), c = lienzo(W * k, H * k), g = c.getContext('2d');
  g.setTransform(k, 0, 0, k, 0, 0);
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#2f8fe0'); gr.addColorStop(0.7, '#8fd3ff'); gr.addColorStop(1, '#c8ecff');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const b = Math.ceil(Math.min(W, H) / 22), r = rngSemilla(9), y0 = H - b * 3;
  for (let x = 0; x < W; x += b) for (let y = y0; y < H; y += b) {
    g.fillStyle = y < y0 + b ? ['#6ccf3c', '#5fbf32', '#7ad94a'][(r() * 3) | 0] : ['#8b5a2b', '#9a6532', '#7b4f25'][(r() * 3) | 0];
    g.fillRect(x, y, b + 0.5, b + 0.5);
  }
  g.fillStyle = 'rgba(255,255,255,0.85)';
  for (let k2 = 0; k2 < 3; k2++) { const s = b * 0.5, x = W * (0.12 + k2 * 0.34), y = H * (0.12 + (k2 % 2) * 0.1); g.fillRect(x, y + s, s * 6, s * 2); g.fillRect(x + s, y, s * 3, s); }
  const v = g.createRadialGradient(W / 2, H * 0.42, Math.min(W, H) * 0.25, W / 2, H * 0.42, Math.hypot(W, H) * 0.6); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(10,30,60,0.35)');
  g.fillStyle = v; g.fillRect(0, 0, W, H);
  return c;
}
const ESTILO_MANSION = {
  negro: '#0d1b2a', chispa: 2,
  anchoLogo: (W, H) => Math.round(Math.min(W * 0.74, H * 0.5, 340)),
  puntas: ['#ffffff', '#fff27a', '#ffd23f'],
  golpe: ['#6ccf3c', '#9a6532', '#8a8a8e', '#ffd23f', '#ffffff', '#3ec1f3'],
  destello: 'rgba(255,250,220,0.85)',
  fondo: (W, H) => fondoIntro(W, H),
  dibujarChispa(g, c) { const s = 4 + (c.vida - c.t) * 6; g.fillStyle = c.col; g.fillRect(c.x - s / 2, c.y - s / 2, s, s); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(c.x - s / 2, c.y + s / 4, s, s / 4); },
  logo(g, i) {
    const G2 = 14.5 * i.esc;
    for (const capa of [0, 1]) for (const tz of i.TRAZOS) {
      if (tz.capa !== capa) continue;
      const p = i.camino2d(tz, i.esc, i.x0, i.y0), l = i.largo(tz) * i.esc;
      g.save();
      if (i.avance < 1) g.setLineDash([Math.max(0.01, l * i.avance), l + 80]);
      g.lineCap = 'square'; g.lineJoin = 'miter';
      g.save(); g.translate(0, G2 * 0.45); g.strokeStyle = '#7a3c0c'; g.lineWidth = G2 * 1.5; g.stroke(p); g.restore();
      g.strokeStyle = '#3a1f08'; g.lineWidth = G2 * 1.62; g.stroke(p);
      g.strokeStyle = '#ffc928'; g.lineWidth = G2 * 1.2; g.stroke(p);
      g.save(); g.translate(-G2 * 0.12, -G2 * 0.22); g.strokeStyle = '#fff3a0'; g.lineWidth = G2 * 0.34; g.stroke(p); g.restore();
      g.restore();
    }
    if (i.golpe && i.tGolpe < 1.2) {
      const k = i.lim(i.tGolpe / 0.4, 0, 1), s = rebote(k);
      g.save(); g.translate(i.x0 + i.ancho * 0.86, i.y0 - i.ancho * 0.04); g.scale(s, s); g.rotate(Math.sin(i.tGolpe * 6) * 0.2);
      const ic = iconoBloque(B.ORO), w = i.ancho * 0.16; g.drawImage(ic, -w / 2, -w / 2, w, w * 1.12); g.restore();
    }
  },
  letras(g, parte, I, t, y) {
    const tam = Math.min(32, I.W * 0.09); letra(g, tam); const w = g.measureText('JXSTUDIOS').width, x = I.cx - w / 2;
    letra(g, tam); g.textAlign = 'left'; g.textBaseline = 'middle';
    g.fillStyle = '#3a1f08'; g.fillText(parte, x + 2, y + tam * 0.6 + 3);
    g.lineJoin = 'round'; g.lineWidth = 5; g.strokeStyle = '#3a1f08'; g.strokeText(parte, x, y + tam * 0.6);
    g.fillStyle = '#ffffff'; g.fillText(parte, x, y + tam * 0.6);
  },
  presentaTxt(g, s, I, t, y) {
    const tam = Math.min(32, I.W * 0.09), a = clamp((t - 1.52) / 0.25, 0, 1);
    g.globalAlpha = a; letra(g, 13); const w = g.measureText(s).width + 30, yy = y + tam * 1.55;
    g.fillStyle = '#5a3a1c'; g.fillRect(I.cx - 3, yy - 4, 6, 26);
    g.fillStyle = '#3a240f'; rr(g, I.cx - w / 2 - 2, yy - 2, w + 4, 26, 5); g.fill();
    g.fillStyle = '#b8844a'; rr(g, I.cx - w / 2, yy, w, 22, 4); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(I.cx - w / 2, yy + 11, w, 1);
    texto(g, s, I.cx, yy + 11.5, 13, '#ffffff', '#3a240f'); g.globalAlpha = 1;
  },
  jingle(ctx, bus, t0, tg, h) {
    const { tono, soplo, f, T: TT } = h;
    // bloques que se van poniendo mientras se escribe el monograma
    for (let k = 0; k < 7; k++) { const t = t0 + 0.12 + k * 0.11; tono('square', 180 + k * 30, 90, 0.07, 0.07, t); soplo(0.04, 0.12, 'bandpass', 900 + k * 100, 400, t); }
    // el golpe: bloque grande, moneda y acorde alegre
    tono('sine', 140, 45, 0.6, 0.5, tg); soplo(0.18, 0.3, 'lowpass', 3000, 300, tg);
    tono('square', f(88), 0, 0.1, 0.05, tg + 0.06); tono('square', f(93), 0, 0.5, 0.05, tg + 0.14);
    [[72, 0.25], [76, 0.36], [79, 0.47], [84, 0.6]].forEach(([m, d]) => { tono('triangle', f(m), 0, 0.5, 0.08, tg + d); tono('sine', f(m) * 2, 0, 0.25, 0.025, tg + d); });
    for (const m of [60, 64, 67, 72]) tono('triangle', f(m), 0, 1.3, 0.045, tg + 0.75, 0.15);
    for (let k = 0; k < 9; k++) tono('square', 1200 + (k % 3) * 120, 0, 0.02, 0.025, t0 + TT.T_LETRAS + k * 0.04);
  },
};
