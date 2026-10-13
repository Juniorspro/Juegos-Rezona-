// comun/intro-jxs.js — LA intro de JXSTUDIOS para todos los juegos (la de La Cripta/TAJO que mandó el dueño).
// Rápida (2,1 s): una raya de luz abre el fondo, el monograma JXS se escribe con chispas en las puntas,
// golpe (destello, sacudida, chispazo, vibración), una franja de brillo lo cruza, "JXSTUDIOS" se tipea y
// abajo "presenta". Un toque la salta (después de 0,35 s). Después va la pantalla de idioma.
// Cada juego la viste a su estilo con `estilo` (la misma coreografía, otro material):
//   metal [8 colores], filo, bisel, borde, sombra {dx,dy,col}     monograma de píxeles (juegos de píxeles)
//   logo(g, i)                                                     monograma a mano (juegos lisos)
//   fondo(W, H, cx, cy) → lienzo, negro, puntas, golpe, destello, chispa, anchoLogo(W, H)
//   letras(g, parte, I, t, y), presentaTxt(g, txt, I, t, y)        el texto, con la letra del juego (obligatorio)
//   antes(g, t, I) / despues(g, t, I), dibujarChispa(g, c), jingle(ctx, bus, t0, tg, h)
const IntroJXS = (() => {
  const CAJA = { w: 350, h: 172 }, GROSOR = 14.5;
  // el monograma: cuatro trazos (A va abajo en el cruce: se dibuja primero)
  const TRAZOS = [
    { id: 'A', capa: 0, d: [['M', 40, 19], ['L', 114, 19], ['L', 176, 101], ['C', 194, 128, 222, 168, 268, 169], ['C', 310, 170, 342, 152, 342, 122]] },
    { id: 'J', capa: 0, d: [['M', 40, 43], ['L', 98, 43], ['L', 98, 116], ['C', 98, 148, 44, 158, 36, 124]] },
    { id: 'S', capa: 0, d: [['M', 312, 66], ['C', 306, 46, 288, 36, 266, 36], ['C', 242, 36, 226, 48, 226, 63], ['C', 226, 80, 248, 86, 272, 92], ['C', 302, 99, 320, 108, 320, 126], ['C', 320, 142, 300, 148, 272, 148], ['C', 246, 148, 226, 138, 216, 118]] },
    { id: 'B', capa: 1, d: [['M', 10, 130], ['C', 18, 158, 50, 168, 86, 166], ['C', 108, 165, 122, 158, 134, 142], ['L', 200, 46], ['C', 216, 24, 244, 12, 272, 12], ['C', 310, 12, 340, 30, 340, 62]] },
  ];
  const lim = (v, a, b) => (v < a ? a : v > b ? b : v);
  const salida = t => 1 - Math.pow(1 - t, 3);
  const salidaAtras = t => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2);
  function camino2d(t, esc, ox, oy) {
    const p = new Path2D();
    for (const [op, ...n] of t.d) {
      const q = n.map((v, i) => (i % 2 ? oy + v * esc : ox + v * esc));
      if (op === 'M') p.moveTo(q[0], q[1]); else if (op === 'L') p.lineTo(q[0], q[1]); else p.bezierCurveTo(q[0], q[1], q[2], q[3], q[4], q[5]);
    }
    return p;
  }
  function muestrear(t, cada) {
    const pts = [];
    let x = 0, y = 0;
    for (const [op, ...n] of t.d) {
      if (op === 'M') { x = n[0]; y = n[1]; pts.push([x, y]); continue; }
      if (op === 'L') { const [x1, y1] = n, k = Math.max(1, Math.ceil(Math.hypot(x1 - x, y1 - y) / cada)); for (let i = 1; i <= k; i++) pts.push([x + (x1 - x) * i / k, y + (y1 - y) * i / k]); x = x1; y = y1; continue; }
      const [c1x, c1y, c2x, c2y, x1, y1] = n, k = Math.max(2, Math.ceil((Math.hypot(c1x - x, c1y - y) + Math.hypot(c2x - c1x, c2y - c1y) + Math.hypot(x1 - c2x, y1 - c2y)) / cada));
      for (let i = 1; i <= k; i++) { const s = i / k, r = 1 - s; pts.push([r * r * r * x + 3 * r * r * s * c1x + 3 * r * s * s * c2x + s * s * s * x1, r * r * r * y + 3 * r * r * s * c1y + 3 * r * s * s * c2y + s * s * s * y1]); }
      x = x1; y = y1;
    }
    return pts;
  }
  const largos = new Map(), muestras = new Map();
  function largo(t) {
    if (largos.has(t.id)) return largos.get(t.id);
    const p = muestrear(t, 2);
    let l = 0;
    for (let i = 1; i < p.length; i++) l += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
    largos.set(t.id, l);
    return l;
  }
  function puntas(avance) {
    const out = [];
    for (const t of TRAZOS) {
      if (!muestras.has(t.id)) { const p = muestrear(t, 2), acum = [0]; for (let i = 1; i < p.length; i++) acum.push(acum[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1])); muestras.set(t.id, { p, acum }); }
      const { p, acum } = muestras.get(t.id), meta = acum[acum.length - 1] * avance;
      let i = 1;
      while (i < acum.length - 1 && acum[i] < meta) i++;
      out.push(p[i]);
    }
    return out;
  }
  // el monograma en píxeles: se traza chico, se separa metal de borde por color y se repinta en escalones con filo y bisel
  function monogramaPixel(anchoPx, avance, E) {
    const esc = anchoPx / CAJA.w, alto = Math.ceil(CAJA.h * esc) + 4, ancho = Math.ceil(anchoPx) + 4;
    const c = document.createElement('canvas'); c.width = ancho; c.height = alto;
    const g = c.getContext('2d');
    for (const capa of [0, 1]) for (const t of TRAZOS) {
      if (t.capa !== capa) continue;
      const p = camino2d(t, esc, 2, 2), l = largo(t) * esc;
      g.save(); if (avance < 1) g.setLineDash([Math.max(0.01, l * avance), l + 10]); g.lineCap = 'butt';
      g.lineWidth = GROSOR * esc + 2.2; g.strokeStyle = '#ff0000'; g.stroke(p);
      g.lineWidth = GROSOR * esc; g.strokeStyle = '#00ff00'; g.stroke(p);
      g.restore();
    }
    const img = g.getImageData(0, 0, ancho, alto), d = img.data, metal = new Uint8Array(ancho * alto), borde = new Uint8Array(ancho * alto);
    for (let i = 0; i < ancho * alto; i++) { if (d[i * 4 + 3] < 90) continue; if (d[i * 4 + 1] > 110) metal[i] = 1; else if (d[i * 4] > 110) borde[i] = 1; }
    const ESC = E.metal || ['#f4f5f8', '#d9dbe1', '#b7bbc4', '#8d929c', '#a9adb6', '#d3d6dc', '#9ea3ad', '#767b85'];
    const FILO = E.filo || '#ffffff', BISEL = E.bisel || '#5b5f68', BO = parseInt((E.borde || '#050608').slice(1), 16);
    for (let y = 0; y < alto; y++) for (let x = 0; x < ancho; x++) {
      const i = y * ancho + x, k = i * 4;
      if (metal[i]) {
        const arriba = y > 0 && metal[i - ancho], abajo = y < alto - 1 && metal[i + ancho], izq = x > 0 && metal[i - 1], der = x < ancho - 1 && metal[i + 1];
        let col = ESC[Math.min(ESC.length - 1, Math.floor((y - 2) / (alto - 4) * ESC.length))];
        if (!arriba || !izq) col = FILO; else if (!abajo || !der) col = BISEL;
        const n = parseInt(col.slice(1), 16);
        d[k] = n >> 16; d[k + 1] = (n >> 8) & 255; d[k + 2] = n & 255; d[k + 3] = 255;
      } else if (borde[i]) { d[k] = BO >> 16; d[k + 1] = (BO >> 8) & 255; d[k + 2] = BO & 255; d[k + 3] = 255; } else d[k + 3] = 0;
    }
    g.putImageData(img, 0, 0);
    c.mascara = metal; c.esc = esc;
    return c;
  }
  const T_CORTE = 0.12, T_ABRE = 0.42, T_TRAZA0 = 0.3, T_TRAZA1 = 0.86, T_GOLPE = 0.88, T_BRILLO = [0.95, 1.35], T_LETRAS = 1.02, T_FIN = 2.1;
  function crear(o) {
    const W = o.W, H = o.H, cx = Math.floor(W / 2), cy = Math.round(H * 0.42), E = o.estilo || {};
    const ancho = E.anchoLogo ? E.anchoLogo(W, H) : Math.round(Math.min(W * 0.66, H * 0.9, 120));
    const fondo = E.fondo ? E.fondo(W, H, cx, cy) : null;
    const PUNTAS = E.puntas || ['#ffffff', '#ffd27a'], GOLPE = E.golpe || ['#ffffff', '#ffd27a', '#c9ccd4', '#7ad7ff'];
    let chispas = [], sacudida = 0, golpeado = false, letras = 0, pts = null, cache = { avance: -1, c: null };
    const I = {
      t: 0, listo: false, cx, cy, ancho, W, H, yPalabra: Math.round(cy + ancho * 0.29 + 4),
      saltar() { if (I.t > 0.35) I.listo = true; },
      pasar(dt) {
        I.t += dt;
        if (I.t > T_TRAZA0 && I.t < T_TRAZA1 && pts) for (const [x, y] of pts) for (let k = 0; k < 2; k++) {
          const a = Math.random() * Math.PI * 2, v = 20 + Math.random() * 50;
          chispas.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 10, t: 0, vida: 0.25 + Math.random() * 0.2, col: PUNTAS[(Math.random() * PUNTAS.length) | 0] });
        }
        if (!golpeado && I.t >= T_GOLPE) {
          golpeado = true; sacudida = 4;
          if (o.vibrar) o.vibrar([30, 20, 40]);
          for (let k = 0; k < 70; k++) { const a = Math.random() * Math.PI * 2, v = 40 + Math.random() * 120; chispas.push({ x: cx + (Math.random() - 0.5) * ancho, y: cy + (Math.random() - 0.5) * ancho * 0.4, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20, t: 0, vida: 0.5 + Math.random() * 0.5, col: GOLPE[k % GOLPE.length] }); }
        }
        letras = lim(Math.floor((I.t - T_LETRAS) / 0.04) + 1, 0, 9);
        for (const c of chispas) { c.t += dt; c.x += c.vx * dt; c.y += c.vy * dt; c.vy += 120 * dt; c.vx *= 0.96; }
        chispas = chispas.filter(c => c.t < c.vida);
        sacudida *= Math.pow(0.84, dt * 60);
        if (I.t >= T_FIN) I.listo = true;
      },
      dibujar(g) {
        const t = I.t;
        g.fillStyle = E.negro || '#05040b'; g.fillRect(0, 0, W, H);
        const s = Math.round(sacudida), sx = s ? Math.round((Math.random() * 2 - 1) * s) : 0, sy = s ? Math.round((Math.random() * 2 - 1) * s) : 0;
        if (t < T_CORTE) { const w = Math.round(W * t / T_CORTE); g.fillStyle = '#f6f3ff'; g.fillRect(Math.round(cx - w / 2), cy, w, E.chispa || 1); return; }
        const abre = lim((t - T_CORTE) / (T_ABRE - T_CORTE), 0, 1), alto = Math.round((Math.max(cy, H - cy) + 4) * salidaAtras(abre));
        g.save(); g.beginPath(); g.rect(0, cy - alto, W, alto * 2); g.clip();
        if (fondo) g.drawImage(fondo, sx, sy, W, H);
        if (E.antes) E.antes(g, t, I);
        g.restore();
        if (abre < 1) { g.fillStyle = '#d9dce3'; g.fillRect(0, cy - alto, W, E.chispa || 1); g.fillRect(0, cy + alto - (E.chispa || 1), W, E.chispa || 1); }
        const avance = lim((t - T_TRAZA0) / (T_TRAZA1 - T_TRAZA0), 0, 1);
        if (avance > 0 && E.logo) {
          const esc = ancho / CAJA.w, x0 = cx - ancho / 2 + sx, y0 = cy - CAJA.h * esc / 2 + sy;
          pts = avance < 1 ? puntas(avance).map(([px, py]) => [x0 + px * esc, y0 + py * esc]) : null;
          E.logo(g, { avance, t, x0, y0, esc, ancho, golpe: t >= T_GOLPE, tGolpe: t - T_GOLPE, TRAZOS, camino2d, largo, muestrear, salida, lim });
          if (t >= T_GOLPE && t < T_GOLPE + 0.06) { g.fillStyle = E.destello || 'rgba(255,255,255,0.85)'; g.fillRect(0, 0, W, H); }
        } else if (avance > 0) {
          const a = Math.round(avance * 40) / 40;
          if (cache.avance !== a) cache = { avance: a, c: monogramaPixel(ancho, a, E) };
          const m = cache.c, x0 = Math.round(cx - m.width / 2) + sx, y0 = Math.round(cy - m.height / 2) + sy;
          pts = avance < 1 ? puntas(avance).map(([px, py]) => [x0 + 2 + px * m.esc, y0 + 2 + py * m.esc]) : null;
          g.drawImage(m, x0, y0);
          if (t >= T_GOLPE && t < T_GOLPE + 0.06) { g.fillStyle = E.destello || 'rgba(255,255,255,0.85)'; g.fillRect(0, 0, W, H); }
          if (t > T_BRILLO[0] && t < T_BRILLO[1]) {
            const k = (t - T_BRILLO[0]) / (T_BRILLO[1] - T_BRILLO[0]), bx = Math.round(-10 + k * (m.width + 20));
            g.fillStyle = 'rgba(255,255,255,0.6)';
            for (let y = 0; y < m.height; y++) for (let dx = -2; dx <= 2; dx++) { const px = bx + dx - Math.round(y * 0.5); if (px >= 0 && px < m.width && m.mascara[y * m.width + px]) g.fillRect(x0 + px, y0 + y, 1, 1); }
          }
        }
        if (letras > 0 && E.letras) {
          E.letras(g, 'JXSTUDIOS'.slice(0, letras), I, t, I.yPalabra + sy);
          if (t > T_LETRAS + 0.5 && E.presentaTxt) E.presentaTxt(g, o.presenta || 'PRESENTA', I, t, I.yPalabra + sy);
        }
        if (E.despues) E.despues(g, t, I);
        const tc = E.chispa || 1;
        for (const c of chispas) { if (c.t > c.vida * 0.7 && ((c.t * 30) | 0) % 2) continue; if (E.dibujarChispa) E.dibujarChispa(g, c); else { g.fillStyle = c.col; g.fillRect(Math.round(c.x), Math.round(c.y), tc, tc); } }
      },
    };
    return I;
  }
  // la música de la intro, agendada con el reloj del audio: cada golpe cae con su cuadro
  function jingle(ctx, destino, E) {
    if (!ctx || ctx.state !== 'running') return null;
    const bus = ctx.createGain(); bus.gain.value = 1; bus.connect(destino || ctx.destination);
    const f = m => 440 * Math.pow(2, (m - 69) / 12);
    const tono = (onda, f0, f1, dur, vol, t, ataque) => {
      const o = ctx.createOscillator(), gn = ctx.createGain();
      o.type = onda; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
      gn.gain.setValueAtTime(0.0001, t); gn.gain.linearRampToValueAtTime(vol, t + (ataque || 0.005)); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(gn); gn.connect(bus); o.start(t); o.stop(t + dur + 0.05);
    };
    const n = ctx.sampleRate, buf = ctx.createBuffer(1, n, n), dd = buf.getChannelData(0);
    for (let i = 0; i < n; i++) dd[i] = Math.random() * 2 - 1;
    const soplo = (dur, vol, tipo, f0, f1, t) => {
      const s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), gn = ctx.createGain();
      s.buffer = buf; fl.type = tipo; fl.Q.value = 1.2; fl.frequency.setValueAtTime(f0, t); fl.frequency.exponentialRampToValueAtTime(f1, t + dur);
      gn.gain.setValueAtTime(vol, t); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(fl); fl.connect(gn); gn.connect(bus); s.start(t); s.stop(t + dur + 0.05);
    };
    const t0 = ctx.currentTime + 0.03, tg = t0 + T_GOLPE;
    if (E && E.jingle) E.jingle(ctx, bus, t0, tg, { tono, soplo, f, T: { T_LETRAS, T_GOLPE, T_FIN } });
    else {
      soplo(0.2, 0.12, 'bandpass', 700, 5200, t0);
      [0.3, 0.38, 0.46, 0.54].forEach((d, k) => tono('square', 240 + k * 70, 1300 + k * 240, 0.16, 0.035, t0 + d));
      tono('sine', 115, 30, 0.95, 0.55, tg);
      for (const [fr, v, d] of [[523, 0.08, 1.3], [1247, 0.05, 1], [2011, 0.035, 0.75], [3150, 0.025, 0.5]]) tono('sine', fr, 0, d, v, tg);
      soplo(0.4, 0.25, 'lowpass', 4200, 260, tg);
      [84, 88, 91, 95, 98, 103].forEach((m, k) => tono('triangle', f(m), 0, 0.28, 0.05, tg + 0.07 + k * 0.035));
      for (let k = 0; k < 9; k++) tono('square', 1320 + (k % 3) * 110, 0, 0.022, 0.03, t0 + T_LETRAS + k * 0.04);
      for (const m of [48, 55, 64, 71, 74]) tono('triangle', f(m), 0, 1.35, 0.05, t0 + 1.1, 0.25);
    }
    return { cortar: () => bus.gain.setTargetAtTime(0, ctx.currentTime, 0.05) };
  }
  return { crear, jingle, salida, salidaAtras, DURA: T_FIN };
})();
// "elegí tu idioma" en cada idioma (la pantalla que va después de la intro) y "presenta"
const ELEGI_IDIOMA = { es: 'ELEGÍ TU IDIOMA', 'es-MX': 'ELIGE TU IDIOMA', en: 'CHOOSE YOUR LANGUAGE', pt: 'ESCOLHA SEU IDIOMA', ar: 'اختر لغتك', id: 'PILIH BAHASAMU', ms: 'PILIH BAHASA ANDA', fil: 'PUMILI NG WIKA', tr: 'DİLİNİ SEÇ', ur: 'اپنی زبان چنیں', th: 'เลือกภาษาของคุณ', my: 'ဘာသာစကား ရွေးပါ', ja: 'ことばをえらんでね' };
const PRESENTA = { es: 'presenta', 'es-MX': 'presenta', en: 'presents', pt: 'apresenta', ar: 'تقدّم', id: 'mempersembahkan', ms: 'mempersembahkan', fil: 'naghahandog', tr: 'sunar', ur: 'پیش کرتا ہے', th: 'นำเสนอ', my: 'တင်ဆက်သည်', ja: 'プレゼンツ' };
