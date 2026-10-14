// POTRERO — la intro de JXSTUDIOS a su estilo: una página de historieta (papel, trama, líneas de velocidad), el
// monograma se entinta con pincel grueso y relleno amarillo, en el golpe salta un "¡PUM!" con papelitos, y
// JXSTUDIOS se rotula en la letra a mano. Suena un silbato, el bombo de la hinchada y una trompeta.
function fondoHistorieta(W, H, cx, cy) {
  const c = lienzo(W * S, H * S), g = c.getContext('2d');
  g.setTransform(S, 0, 0, S, 0, 0);
  g.fillStyle = '#ffe9a8'; g.fillRect(0, 0, W, H);
  // líneas de velocidad hacia el centro
  const r = rngSemilla(23), R = Math.hypot(W, H);
  g.fillStyle = '#f5b83a';
  for (let i = 0; i < 70; i++) {
    const a = i / 70 * TAU + r() * 0.03, an = 0.012 + r() * 0.02, d0 = Math.min(W, H) * (0.28 + r() * 0.12);
    g.beginPath(); g.moveTo(cx + Math.cos(a) * d0, cy + Math.sin(a) * d0); g.lineTo(cx + Math.cos(a - an) * R, cy + Math.sin(a - an) * R); g.lineTo(cx + Math.cos(a + an) * R, cy + Math.sin(a + an) * R); g.closePath(); g.fill();
  }
  // trama que se oscurece hacia los bordes
  for (let y = 0; y < H; y += 6) for (let x = (y / 6 % 2) * 3; x < W; x += 6) {
    const d = Math.hypot(x - cx, y - cy) / (R * 0.5), rr = clamp((d - 0.55) * 3.2, 0, 2.6);
    if (rr > 0.2) { g.fillStyle = 'rgba(200,70,40,0.55)'; g.beginPath(); g.arc(x, y, rr, 0, TAU); g.fill(); }
  }
  // borde de viñeta
  g.lineWidth = 6; g.strokeStyle = TINTA; g.strokeRect(5, 5, W - 10, H - 10);
  return c;
}
const ESTILO_POTRERO = {
  negro: TINTA, chispa: 2,
  anchoLogo: (W, H) => Math.round(Math.min(W * 0.72, H * 0.5, 330)),
  puntas: [BLANCO, AMARILLO, ROJO],
  golpe: [BLANCO, AMARILLO, ROJO, AZUL, VERDE, ROSA, CELESTE],
  destello: 'rgba(255,255,255,0.85)',
  fondo: (W, H, cx, cy) => fondoHistorieta(W, H, cx, cy),
  dibujarChispa(g, c) { g.save(); g.translate(c.x, c.y); g.rotate(c.t * 9 + c.vx); g.fillStyle = c.col; g.fillRect(-2.2, -1.2, 4.4, 2.4); g.restore(); },
  logo(g, i) {
    const G = 14.5 * i.esc;
    for (const capa of [0, 1]) for (const tz of i.TRAZOS) {
      if (tz.capa !== capa) continue;
      const p = i.camino2d(tz, i.esc, i.x0, i.y0), l = i.largo(tz) * i.esc;
      g.save();
      if (i.avance < 1) g.setLineDash([Math.max(0.01, l * i.avance), l + 80]);
      g.lineCap = 'round'; g.lineJoin = 'round';
      g.save(); g.translate(G * 0.32, G * 0.32); g.strokeStyle = TINTA; g.lineWidth = G * 1.55; g.stroke(p); g.restore();
      g.strokeStyle = TINTA; g.lineWidth = G * 1.55; g.stroke(p);
      g.strokeStyle = AMARILLO; g.lineWidth = G * 0.98; g.stroke(p);
      g.save(); g.translate(-G * 0.12, -G * 0.16); g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = G * 0.22; g.stroke(p); g.restore();
      g.restore();
    }
    if (i.golpe) {
      const k = i.lim(i.tGolpe / 0.45, 0, 1), s = rebote(i.lim(i.tGolpe / 0.3, 0, 1));
      // "¡PUM!" que salta al costado del monograma
      if (k > 0) {
        g.save(); g.translate(i.x0 + i.ancho * 0.92, i.y0 - i.ancho * 0.04); g.rotate(0.18); g.scale(s, s);
        estallido(g, 0, 0, i.ancho * 0.16, i.ancho * 0.11, ROJO, { puntas: 12, semilla: 9 });
        txt(g, '¡PUM!', 0, 0, { tam: i.ancho * 0.075, c: AMARILLO, b: TINTA, bw: 2, al: 0.5, temblor: false });
        g.restore();
      }
    }
  },
  letras(g, parte, I, t, y) {
    const tam = Math.min(30, I.W * 0.085), w = medir('JXSTUDIOS', tam, 1), x = I.cx - w / 2;
    txt(g, parte, x + 2.5, y + tam * 0.75 + 2.5, { tam, c: TINTA, b: TINTA, bw: 3, al: 0 });
    txt(g, parte, x, y + tam * 0.75, { tam, c: BLANCO, b: TINTA, bw: 3, al: 0 });
    if (parte.length < 9 && ((t * 20) | 0) % 2) { g.fillStyle = TINTA; g.fillRect(x + medir(parte, tam, 1) + 4, y + tam * 0.4, 3, tam * 0.7); }
  },
  presentaTxt(g, s, I, t, y) {
    const tam = Math.min(30, I.W * 0.085), a = clamp((t - 1.52) / 0.25, 0, 1);
    g.globalAlpha = a;
    cartucho(g, I.cx, y + tam * 1.7, s, { tam: 11, al: 0.5, max: I.W - 40 });
    g.globalAlpha = 1;
  },
  jingle(ctx, bus, t0, tg, h) {
    const { tono, soplo, f, T } = h;
    // silbato del árbitro mientras se entinta
    for (const [d, dur] of [[0.18, 0.16], [0.4, 0.34]]) { tono('sine', 2600, 2500, dur, 0.06, t0 + d); tono('sine', 2650, 2550, dur, 0.03, t0 + d); soplo(dur, 0.04, 'bandpass', 2600, 2400, t0 + d); }
    // el golpe: bombo de hinchada, platillo y un ¡pum!
    tono('sine', 96, 38, 0.7, 0.62, tg); soplo(0.6, 0.22, 'highpass', 5200, 3000, tg); soplo(0.18, 0.3, 'lowpass', 1800, 160, tg);
    [0.32, 0.48, 0.64].forEach(d => tono('sine', 90, 40, 0.35, 0.4, tg + d));
    // trompeta de la tribuna (dos voces)
    [[67, 0.1, 0.16], [67, 0.28, 0.12], [72, 0.42, 0.36], [76, 0.8, 0.5]].forEach(([m, d, dur]) => { tono('sawtooth', f(m), 0, dur, 0.05, tg + d, 0.02); tono('sawtooth', f(m - 5), 0, dur, 0.035, tg + d, 0.02); });
    for (let k = 0; k < 9; k++) tono('triangle', 1500 + (k % 3) * 160, 0, 0.03, 0.03, t0 + T.T_LETRAS + k * 0.04);
  },
};
