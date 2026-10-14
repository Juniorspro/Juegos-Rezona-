// SIETE COLORES — la intro de JXSTUDIOS a su estilo: la quebrada al atardecer se abre con un tajo de luz, el
// monograma se escribe en franjas de los siete colores del cerro, en el golpe vuelan serpentinas y talco de
// carnaval, y JXSTUDIOS se tipea en la letra de píxeles con una letra de cada color. Suena el erke y el bombo.
function fondoQuebrada(W, H, cx, cy) {
  const c = lienzo(W, H), g = c.getContext('2d'), r = rngSemilla(19);
  for (let y = 0; y < H; y++) { const k = y / H; g.fillStyle = mezcla(mezcla('#2a1840', '#c8506a', clamp(k * 1.6, 0, 1)), '#f0a050', clamp((k - 0.45) * 2.4, 0, 1)); g.fillRect(0, y, W, 1); }
  // el sol bajito
  const sy = Math.round(H * 0.62);
  for (let y = -10; y <= 10; y++) { const w = Math.round(Math.sqrt(100 - y * y)); g.fillStyle = y < 3 ? '#ffe8a0' : '#ffd070'; g.fillRect(cx + Math.round(W * 0.22) - w, sy + y, w * 2, 1); }
  // tres filas de cerros: las de atrás con niebla, la del medio con las franjas de colores
  const fila = (base, amp, frec, fase, col, franjas) => {
    for (let x = 0; x < W; x++) {
      const h = Math.round(base - amp * (0.55 + 0.45 * Math.sin(x * frec + fase)) - amp * 0.3 * Math.sin(x * frec * 2.7 + fase * 2) - (franjas ? Math.max(0, 1 - Math.abs(x - cx) / (W * 0.3)) * amp * 1.1 : 0));
      for (let y = h; y < H; y++) {
        let cc = col;
        if (franjas) { const b = Math.floor((y + Math.sin(x * 0.07) * 3) / 5) % 7; cc = mezcla(COLORES[(b + 7) % 7], '#3a2040', 0.45 + clamp((y - h) / 40, 0, 0.35)); }
        g.fillStyle = cc; g.fillRect(x, y, 1, 1);
      }
    }
  };
  fila(H * 0.66, H * 0.1, 0.03, 1, '#6a4060');
  fila(H * 0.74, H * 0.16, 0.022, 3, '#000', true);
  fila(H * 0.88, H * 0.06, 0.05, 0.5, '#2a1428');
  // cardones a contraluz
  for (let k = 0; k < 7; k++) {
    const x = Math.round(r() * W), base = Math.round(H * 0.86 + r() * H * 0.08), alto = 10 + Math.round(r() * 18);
    g.fillStyle = '#1a0c1c'; g.fillRect(x, base - alto, 3, alto);
    const hb = base - Math.round(alto * (0.4 + r() * 0.3)); g.fillRect(x - 4, hb, 4, 2); g.fillRect(x - 4, hb - 6, 2, 6); g.fillRect(x + 3, hb + 2, 3, 2); g.fillRect(x + 5, hb - 3, 2, 5);
  }
  return c;
}
const ESTILO_SIETE = {
  negro: '#14081c', chispa: 1,
  metal: ['#f090b0', '#a060d0', '#3ac0b8', '#6ab85a', '#f0c84a', '#f08a3a', '#e04a3a', '#c83a2c'],
  filo: '#fff6e8', bisel: '#5a2a48', borde: '#14081c',
  puntas: ['#ffffff', '#ffe8a0', '#f090b0'],
  golpe: ['#ffffff', '#e04a3a', '#f08a3a', '#f0c84a', '#6ab85a', '#3ac0b8', '#a060d0', '#f090b0'],
  destello: 'rgba(255,240,220,0.8)',
  fondo: (W, H, cx, cy) => fondoQuebrada(W, H, cx, cy),
  letras(g, parte, I, t, y) {
    const tt = I.W >= 200 ? 2 : 1, w = anchoPx('JXSTUDIOS', 'px', tt), x0 = Math.round(I.cx - w / 2);
    let cx = x0;
    for (let k = 0; k < parte.length; k++) {
      const ch = parte[k], col = COLORES[k % 7];
      dibujarPx(g, ch, cx, y + tt, 'px', tt, '#14081c', '#14081c');
      dibujarPx(g, ch, cx, y, 'px', tt, col, '#14081c');
      cx += (FUENTES.px.g[ch].w + 1) * tt;
    }
    if (parte.length < 9 && ((t * 20) | 0) % 2) { g.fillStyle = '#fff6e8'; g.fillRect(cx + tt, y, tt, 7 * tt); }
  },
  presentaTxt(g, s, I, t, y) { const tt = I.W >= 200 ? 2 : 1; txt(g, s, I.cx, y + 12 * tt, { al: 0.5, c: '#ffe8c8', b: '#14081c', max: I.W - 10 }); },
  jingle(ctx, bus, t0, tg, h) {
    const { tono, soplo, f, T } = h;
    soplo(0.22, 0.1, 'bandpass', 600, 3800, t0);                                                        // el tajo: viento de la quebrada
    [0.3, 0.42, 0.54, 0.66].forEach((d, k) => tono('triangle', f(81 + k * 2), f(86 + k * 2), 0.09, 0.04, t0 + d));   // chispas como cascabeles
    // el erke: un llamado grave que crece hasta el golpe
    const o = ctx.createOscillator(), fl = ctx.createBiquadFilter(), gn = ctx.createGain();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(f(45), t0 + 0.2); o.frequency.linearRampToValueAtTime(f(46), tg);
    fl.type = 'lowpass'; fl.frequency.setValueAtTime(300, t0 + 0.2); fl.frequency.linearRampToValueAtTime(1800, tg);
    gn.gain.setValueAtTime(0.0001, t0 + 0.2); gn.gain.linearRampToValueAtTime(0.07, tg - 0.05); gn.gain.exponentialRampToValueAtTime(0.0001, tg + 0.6);
    o.connect(fl); fl.connect(gn); gn.connect(bus); o.start(t0 + 0.2); o.stop(tg + 0.7);
    tono('sine', 92, 40, 0.8, 0.6, tg); soplo(0.5, 0.25, 'lowpass', 2600, 120, tg);                     // el bombo
    tono('sine', 92, 40, 0.5, 0.35, tg + 0.36);
    [57, 64, 69, 72, 76].forEach((m, k) => tono('triangle', f(m), 0, 0.6, 0.06, tg + 0.08 + k * 0.025));   // rasgueo de charango
    for (let k = 0; k < 12; k++) tono('sine', 3000 + Math.random() * 2500, 0, 0.1, 0.03, tg + 0.05 + k * 0.03);   // cascabeles
    for (let k = 0; k < 9; k++) tono('square', 1320 + (k % 3) * 110, 0, 0.022, 0.025, t0 + T.T_LETRAS + k * 0.04);
    [76, 81, 84, 88].forEach((m, k) => tono('sine', f(m), 0, 0.45, 0.04, t0 + 1.55 + k * 0.07));       // sikus que contestan
  },
};
