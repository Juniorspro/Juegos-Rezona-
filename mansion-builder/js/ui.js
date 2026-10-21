// MANSION BUILDER — la interfaz (lienzo 2D arriba del 3D): plata, la parte en obra, botones, ajustes, carteles,
// flecha de objetivo y joystick. Todo en píxeles CSS escalados por U (el lado corto mide 360).
const FUENTE = "Bungee, 'Arial Black', Impact, sans-serif";
const AJ = { musica: true, sonido: true, vibra: true, calidad: -1, idioma: 'auto', joy: 'flota', joyTam: 1 };
const UI = {
  cv: null, g: null, U: 1, botones: [], avisos: [], fests: [], pulso: 0, panel: null, iconos: {}, tex16: {}, joy: { activo: false, id: -1, x0: 0, y0: 0, x: 0, y: 0, vx: 0, vy: 0 },
  aviso(s, tipo) {
    const ahora = VIVO.t; if (this.ultAviso && this.ultAviso.s === s && ahora - this.ultAviso.t < 2.5) return;
    this.ultAviso = { s, t: ahora };
    if (this.avisos.length > 3) this.avisos.shift(); this.avisos.push({ s, tipo: tipo || 'blanco', t: 0 });
  },
  pasar(dt) {
    for (let i = this.avisos.length - 1; i >= 0; i--) { this.avisos[i].t += dt; if (this.avisos[i].t > 1.6) this.avisos.splice(i, 1); }
    if (this.fests.length) { const f = this.fests[0]; f.t += dt; if (f.t > (f.grande ? 4.5 : 2.6)) this.fests.shift(); }
  },
  festejo(titulo, sub, grande) { if (this.fests.length > 1) this.fests.splice(0, this.fests.length - 1); this.fests.push({ titulo, sub, grande, t: 0 }); },
  pulsoPlata() { this.pulso = 1; },
};
function rr(g, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function letra(g, tam) { g.font = tam + 'px ' + FUENTE; }
function texto(g, s, x, y, tam, col, borde, al, bw) {
  letra(g, tam); g.textAlign = al || 'center'; g.textBaseline = 'middle';
  if (borde) { g.lineJoin = 'round'; g.lineWidth = bw || Math.max(2, tam * 0.24); g.strokeStyle = borde; g.strokeText(s, x, y); }
  g.fillStyle = col; g.fillText(s, x, y);
}
function tamQueEntra(g, s, tam, max) { letra(g, tam); const w = g.measureText(s).width; return w > max ? Math.max(6, tam * max / w) : tam; }
// ---------- íconos ----------
function texturaChica(capa) {
  if (UI.tex16[capa]) return UI.tex16[capa];
  const c = lienzo(16, 16), g = c.getContext('2d'), im = g.createImageData(16, 16);
  im.data.set(TEX.datos.subarray(capa * 1024, capa * 1024 + 1024)); g.putImageData(im, 0, 0);
  return (UI.tex16[capa] = c);
}
// un bloque en perspectiva isométrica, pintado con sus texturas
function iconoBloque(b) {
  const s = 64, k = b; if (UI.iconos[k]) return UI.iconos[k];
  const c = lienzo(s, s * 1.12), g = c.getContext('2d'), P = BLOQ[b];
  g.imageSmoothingEnabled = false;
  const caras = [[P.f[0], s / 32, -s / 64, s / 32, s / 64, 0, s / 4, 0], [P.f[1], s / 32, s / 64, 0, s / 32, 0, s / 4, 0.2], [P.f[3], s / 32, -s / 64, 0, s / 32, s / 2, s / 2, 0.38]];
  const poli = [[[0, s / 4], [s / 2, 0], [s, s / 4], [s / 2, s / 2]], [[0, s / 4], [s / 2, s / 2], [s / 2, s], [0, s * 0.75]], [[s / 2, s / 2], [s, s / 4], [s, s * 0.75], [s / 2, s]]];
  caras.forEach(([capa, a, bb, cc, d, e, f, osc], i) => {
    g.save(); g.beginPath(); poli[i].forEach(([x, y], j) => j ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.clip();
    g.setTransform(a, bb, cc, d, e, f); g.drawImage(texturaChica(capa), 0, 0); g.setTransform(1, 0, 0, 1, 0, 0);
    if (osc) { g.fillStyle = 'rgba(0,0,0,' + osc + ')'; g.fillRect(0, 0, s, s * 1.12); }
    g.restore();
  });
  g.strokeStyle = 'rgba(20,24,40,0.55)'; g.lineWidth = Math.max(1, s / 28); g.beginPath();
  g.moveTo(s / 2, s / 2); g.lineTo(s / 2, s); g.moveTo(0, s / 4); g.lineTo(s / 2, 0); g.lineTo(s, s / 4); g.lineTo(s, s * 0.75); g.lineTo(s / 2, s); g.lineTo(0, s * 0.75); g.closePath(); g.stroke();
  return (UI.iconos[k] = c);
}
function moneda(g, x, y, r) {
  const gr = g.createLinearGradient(x, y - r, x, y + r); gr.addColorStop(0, '#fff3a8'); gr.addColorStop(0.5, '#ffc928'); gr.addColorStop(1, '#d88a10');
  g.fillStyle = '#8a4a08'; g.beginPath(); g.arc(x, y + r * 0.12, r, 0, TAU); g.fill();
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  g.strokeStyle = '#b86a0a'; g.lineWidth = r * 0.14; g.beginPath(); g.arc(x, y, r * 0.72, 0, TAU); g.stroke();
  texto(g, '$', x, y + r * 0.06, r * 1.05, '#b0620a', null);
}
function iconoDibujo(g, tipo, x, y, s, col) {
  g.save(); g.translate(x, y); g.fillStyle = col; g.strokeStyle = col; g.lineCap = 'round'; g.lineJoin = 'round';
  if (tipo === 'engranaje') {
    g.beginPath(); for (let k = 0; k < 16; k++) { const a = k / 16 * TAU, r = k % 2 ? s * 0.5 : s * 0.38; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill();
    g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(0, 0, s * 0.17, 0, TAU); g.fill();
  } else if (tipo === 'regalo') {
    g.fillRect(-s * 0.42, -s * 0.12, s * 0.84, s * 0.55); g.fillRect(-s * 0.48, -s * 0.3, s * 0.96, s * 0.2);
    g.fillStyle = '#e8384f'; g.fillRect(-s * 0.08, -s * 0.3, s * 0.16, s * 0.73);
    g.lineWidth = s * 0.1; g.strokeStyle = '#e8384f'; g.beginPath(); g.ellipse(-s * 0.16, -s * 0.38, s * 0.16, s * 0.09, -0.4, 0, TAU); g.ellipse(s * 0.16, -s * 0.38, s * 0.16, s * 0.09, 0.4, 0, TAU); g.stroke();
  } else if (tipo === 'compartir') {
    g.lineWidth = s * 0.11; const p = [[s * 0.3, -s * 0.32], [-s * 0.3, 0], [s * 0.3, s * 0.32]];
    g.beginPath(); g.moveTo(...p[0]); g.lineTo(...p[1]); g.lineTo(...p[2]); g.stroke();
    for (const q of p) { g.beginPath(); g.arc(q[0], q[1], s * 0.15, 0, TAU); g.fill(); }
  } else if (tipo === 'cruz') {
    g.lineWidth = s * 0.18; g.beginPath(); g.moveTo(-s * 0.3, -s * 0.3); g.lineTo(s * 0.3, s * 0.3); g.moveTo(s * 0.3, -s * 0.3); g.lineTo(-s * 0.3, s * 0.3); g.stroke();
  } else if (tipo === 'izq' || tipo === 'der') {
    const d = tipo === 'izq' ? -1 : 1; g.beginPath(); g.moveTo(d * s * 0.3, 0); g.lineTo(-d * s * 0.2, -s * 0.32); g.lineTo(-d * s * 0.2, s * 0.32); g.closePath(); g.fill();
  }
  g.restore();
}
// botón de bloque: cara de arriba de color y canto oscuro (como un bloque visto de costado)
function boton(g, x, y, w, h, col, f, apretado) {
  const U = UI.U, canto = 5 * U, dy = apretado ? canto * 0.6 : 0;
  g.fillStyle = 'rgba(0,0,0,0.25)'; rr(g, x, y + canto + 2 * U, w, h, 10 * U); g.fill();
  g.fillStyle = mezcla(col, '#000000', 0.38); rr(g, x, y + canto, w, h, 10 * U); g.fill();
  const gr = g.createLinearGradient(0, y + dy, 0, y + dy + h); gr.addColorStop(0, mezcla(col, '#ffffff', 0.25)); gr.addColorStop(1, col);
  g.fillStyle = gr; rr(g, x, y + dy, w, h, 10 * U); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 2 * U; rr(g, x + 2 * U, y + dy + 2 * U, w - 4 * U, h * 0.45, 8 * U); g.stroke();
  if (f) UI.botones.push({ x, y, w, h: h + canto, f });
  return dy;
}
function tarjeta(g, x, y, w, h) {
  const U = UI.U;
  g.fillStyle = 'rgba(0,0,0,0.28)'; rr(g, x, y + 5 * U, w, h, 16 * U); g.fill();
  g.fillStyle = '#2b3a55'; rr(g, x, y, w, h, 16 * U); g.fill();
  g.fillStyle = '#3b5078'; rr(g, x + 4 * U, y + 4 * U, w - 8 * U, h - 8 * U, 13 * U); g.fill();
  g.strokeStyle = '#1a2438'; g.lineWidth = 3 * U; rr(g, x, y, w, h, 16 * U); g.stroke();
}
// ---------- la interfaz del juego ----------
function dibujarUI(g, dt, t) {
  const U = UI.U, Wc = CSSW, Hc = CSSH;
  UI.botones.length = 0;
  g.clearRect(0, 0, Wc, Hc);
  UI.pulso = Math.max(0, UI.pulso - dt * 4);
  etiquetasMundo(g, t);
  flechaObjetivo(g, t);
  // la plata
  const sPlata = fmt(G.dinero), tp = 22 * U * (1 + UI.pulso * 0.12);
  letra(g, 22 * U); const wTxt = g.measureText(sPlata).width, wp = Math.max(130 * U, wTxt + 74 * U), hp = 42 * U, xp = Wc / 2 - wp / 2, yp = 10 * U;
  g.fillStyle = 'rgba(0,0,0,0.3)'; rr(g, xp, yp + 4 * U, wp, hp, hp / 2); g.fill();
  g.fillStyle = 'rgba(24,34,54,0.86)'; rr(g, xp, yp, wp, hp, hp / 2); g.fill();
  g.strokeStyle = '#ffd34a'; g.lineWidth = 2.5 * U; rr(g, xp, yp, wp, hp, hp / 2); g.stroke();
  moneda(g, xp + 22 * U, yp + hp / 2, 15 * U);
  texto(g, sPlata, xp + 44 * U + (wp - 54 * U) / 2, yp + hp / 2 + 1 * U, tp, '#ffffff', '#101826');
  // botones: ajustes a la izquierda, premio diario y compartir a la derecha
  const bs = 44 * U;
  let dy = boton(g, 10 * U, 10 * U, bs, bs, '#6b7c93', () => abrirPanel('ajustes'));
  iconoDibujo(g, 'engranaje', 10 * U + bs / 2, 10 * U + bs / 2 + dy, bs * 0.62, '#ffffff');
  dy = boton(g, Wc - 10 * U - bs, 10 * U, bs, bs, '#e8a33a', () => abrirPanel('diario'));
  iconoDibujo(g, 'regalo', Wc - 10 * U - bs / 2, 12 * U + bs / 2 + dy, bs * 0.6, '#ffffff');
  if (G.diario !== hoy()) { g.fillStyle = '#ff3b4e'; g.beginPath(); g.arc(Wc - 14 * U, 13 * U, 7 * U, 0, TAU); g.fill(); texto(g, '!', Wc - 14 * U, 13.5 * U, 10 * U, '#fff', null); }
  dy = boton(g, Wc - 10 * U - bs, 64 * U, bs, bs, '#3aa0e8', () => compartir());
  iconoDibujo(g, 'compartir', Wc - 10 * U - bs / 2, 64 * U + bs / 2 + dy, bs * 0.6, '#ffffff');
  // la parte en obra
  tarjetaParte(g, t);
  // avisos que suben desde el constructor
  const pj = M4.proyectar(R.VP, JUG.x, JUG.y + 2.4, JUG.z);
  let ya = pj ? pj[1] * Hc : Hc * 0.45;
  for (let i = UI.avisos.length - 1; i >= 0; i--) {
    const a = UI.avisos[i];
    if (a.t > 1.6) continue;
    const al = a.t < 0.15 ? a.t / 0.15 : a.t > 1.2 ? (1.6 - a.t) / 0.4 : 1, sube = salida(a.t / 1.6) * 34 * U;
    const col = { rojo: '#ff5a5a', oro: '#ffd34a', gris: '#d8dde6', blanco: '#ffffff' }[a.tipo] || '#fff';
    g.globalAlpha = al; texto(g, a.s, Wc / 2, ya - sube, 17 * U * (a.t < 0.15 ? 0.8 + a.t * 1.4 : 1), col, '#101826'); g.globalAlpha = 1;
    ya -= 24 * U;
  }
  // festejos (parte terminada)
  if (UI.fests.length) {
    const f = UI.fests[0], dura = f.grande ? 4.5 : 2.6;
    {
      const e = f.t < 0.5 ? rebote(f.t / 0.5) : 1, al = f.t > dura - 0.4 ? (dura - f.t) / 0.4 : 1, y = Hc * 0.33;
      g.save(); g.globalAlpha = clamp(al, 0, 1); g.translate(Wc / 2, y); g.scale(e, e);
      const tam = tamQueEntra(g, f.titulo, (f.grande ? 30 : 26) * U, Wc - 60 * U), w = Math.min(Wc - 24 * U, g.measureText(f.titulo).width + 70 * U), h = 54 * U;
      g.fillStyle = '#a3561a'; g.beginPath(); g.moveTo(-w / 2 - 22 * U, -h * 0.25); g.lineTo(-w / 2 + 6 * U, -h * 0.25); g.lineTo(-w / 2 + 6 * U, h * 0.55); g.lineTo(-w / 2 - 22 * U, h * 0.55); g.lineTo(-w / 2 - 10 * U, h * 0.15); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(w / 2 + 22 * U, -h * 0.25); g.lineTo(w / 2 - 6 * U, -h * 0.25); g.lineTo(w / 2 - 6 * U, h * 0.55); g.lineTo(w / 2 + 22 * U, h * 0.55); g.lineTo(w / 2 + 10 * U, h * 0.15); g.closePath(); g.fill();
      const gr = g.createLinearGradient(0, -h / 2, 0, h / 2); gr.addColorStop(0, '#ffe066'); gr.addColorStop(1, '#f2a516');
      g.fillStyle = gr; rr(g, -w / 2, -h / 2, w, h, 12 * U); g.fill(); g.strokeStyle = '#7a3c0c'; g.lineWidth = 3 * U; g.stroke();
      texto(g, f.titulo, 0, 1 * U, tam, '#ffffff', '#7a3c0c');
      if (f.sub) { const ts = tamQueEntra(g, f.sub, 16 * U, Wc - 40 * U); texto(g, f.sub, 0, h * 0.5 + 20 * U, ts, f.grande ? '#ffffff' : '#ffe066', '#101826'); }
      g.restore();
    }
  }
  dibujarJoystick(g);
  if (UI.panel) dibujarPanel(g, t);
}
function tarjetaParte(g, t) {
  const U = UI.U, Wc = CSSW, P = PARTES[G.parte];
  const w = Math.min(Wc - 128 * U, 250 * U), x = Wc / 2 - w / 2, y = 60 * U, h = 50 * U;
  g.fillStyle = 'rgba(0,0,0,0.25)'; rr(g, x, y + 3 * U, w, h, 12 * U); g.fill();
  g.fillStyle = 'rgba(24,34,54,0.78)'; rr(g, x, y, w, h, 12 * U); g.fill();
  if (!P) {
    texto(g, T('mansion'), Wc / 2, y + 17 * U, tamQueEntra(g, T('mansion'), 13 * U, w - 16 * U), '#ffd34a', '#101826');
    texto(g, '★ ' + fmt(G.visitas), Wc / 2, y + 36 * U, 13 * U, '#ffffff', '#101826');
    return;
  }
  const tit = T('parteN', { n: G.parte + 1, t: PARTES.length }) + ' · ' + T('parte.' + P.id).toUpperCase();
  texto(g, tit, Wc / 2, y + 12 * U, tamQueEntra(g, tit, 11 * U, w - 16 * U), '#ffffff', '#101826');
  // progreso total de la parte
  let hecho = 0, total = 0; for (const m in P.need) { hecho += Math.min(P.need[m], OBRA.aterrizado[m] || 0); total += P.need[m]; }
  const bx = x + 10 * U, bw = w - 20 * U, by = y + 22 * U;
  g.fillStyle = '#16202f'; rr(g, bx, by, bw, 7 * U, 3.5 * U); g.fill();
  g.fillStyle = '#5ee06a'; if (hecho) { rr(g, bx, by, Math.max(7 * U, bw * hecho / total), 7 * U, 3.5 * U); g.fill(); }
  // lo que pide, material por material
  const mats = Object.keys(P.need), cw = Math.min(70 * U, (w - 16 * U) / mats.length);
  mats.forEach((m, i) => {
    const cx = Wc / 2 + (i - (mats.length - 1) / 2) * cw, cy = y + 39 * U, lleg = Math.min(P.need[m], OBRA.aterrizado[m] || 0);
    g.drawImage(iconoBloque(BLOQUE_DE[m], Math.round(16 * U * 2) / 2), cx - 26 * U, cy - 9 * U, 16 * U, 17.9 * U);
    texto(g, lleg + '/' + P.need[m], cx + 6 * U, cy + 0.5 * U, 11 * U, lleg >= P.need[m] ? '#5ee06a' : '#ffffff', '#101826', 'center');
  });
  // qué hacer ahora
  const o = VIVO.obj;
  if (o && (G.parte < 5 || G.jugado < 240)) {
    const s = textoObjetivo(o), ts = tamQueEntra(g, s, 12 * U, Wc - 40 * U); letra(g, ts);
    const ww = g.measureText(s).width + 28 * U, yy = y + h + 8 * U;
    g.fillStyle = 'rgba(255,255,255,0.92)'; rr(g, Wc / 2 - ww / 2, yy, ww, 24 * U, 12 * U); g.fill();
    texto(g, s, Wc / 2, yy + 12.5 * U, ts, '#1d2b3a', null);
  }
}
// carteles arriba de los cuadros de compra, la obra, la caja y las pilas
function etiquetasMundo(g, t) {
  const U = UI.U, Wc = CSSW, Hc = CSSH;
  for (const p of PADS) {
    if (!padActivo(p)) continue;
    const q = M4.proyectar(R.VP, p.x, SUELO + 0.1, p.z + 1.3); if (!q) continue;
    const x = q[0] * Wc, y = q[1] * Hc; if (x < -60 || x > Wc + 60 || y < -40 || y > Hc + 60) continue;
    const precio = p.precio(), falta = precio - (G.pads[p.id] || 0), puede = G.dinero >= falta, s = fmt(falta);
    letra(g, 15 * U); const w = g.measureText(s).width + 40 * U, h = 26 * U;
    const by = y + 6 * U;
    g.fillStyle = 'rgba(0,0,0,0.3)'; rr(g, x - w / 2, by + 3 * U, w, h, h / 2); g.fill();
    g.fillStyle = puede ? '#2f9e44' : 'rgba(24,34,54,0.88)'; rr(g, x - w / 2, by, w, h, h / 2); g.fill();
    g.strokeStyle = puede ? '#b8ffbf' : 'rgba(255,255,255,0.5)'; g.lineWidth = 2 * U; rr(g, x - w / 2, by, w, h, h / 2); g.stroke();
    moneda(g, x - w / 2 + 14 * U, by + h / 2, 9 * U);
    texto(g, s, x + 9 * U, by + h / 2 + 1 * U, 15 * U, '#ffffff', '#101826');
    const tit = p.titulo().toUpperCase(), ts = tamQueEntra(g, tit, 10 * U, 150 * U);
    texto(g, tit, x, by + h + 11 * U, ts, '#ffffff', '#101826');
    g.drawImage(iconoBloque(p.icono(), 24), x - 11 * U, by - 26 * U, 22 * U, 24.6 * U);
  }
  // la obra: lo que falta, con íconos
  const P = PARTES[G.parte];
  if (P) {
    const q = M4.proyectar(R.VP, LUGAR.obra[0], SUELO + 0.05, LUGAR.obra[1] + 1.9);
    if (q) {
      const mats = Object.keys(P.need).filter(m => faltaEntregar(m) > 0), x = q[0] * Wc, y = q[1] * Hc + 8 * U;
      texto(g, T('obra'), x, y + 34 * U, 11 * U, '#ffd34a', '#101826');
      mats.forEach((m, i) => {
        const cx = x + (i - (mats.length - 1) / 2) * 64 * U, f = faltaEntregar(m);
        g.fillStyle = 'rgba(24,34,54,0.85)'; rr(g, cx - 30 * U, y, 60 * U, 24 * U, 12 * U); g.fill();
        g.drawImage(iconoBloque(BLOQUE_DE[m], 24), cx - 28 * U, y + 1 * U, 20 * U, 22.4 * U);
        texto(g, String(f), cx + 8 * U, y + 13 * U, 13 * U, '#ffffff', '#101826');
      });
    }
  }
  // la caja con plata
  const vc = G.caja - VIVO.cajaVol;
  if (vc > 0) {
    const q = M4.proyectar(R.VP, LUGAR.caja[0], SUELO + 1.2 + billetesCaja() / 9 * 0.17, LUGAR.caja[1]);
    if (q) { const x = q[0] * Wc, y = q[1] * Hc - 14 * U; moneda(g, x - 20 * U - fmt(vc).length * 4 * U, y, 9 * U); texto(g, fmt(vc), x + 4 * U, y + 1 * U, 15 * U, '#ffe066', '#101826'); }
  }
}
// la flecha que marca adónde ir (sobre el objetivo o en el borde de la pantalla)
function flechaObjetivo(g, t) {
  const o = VIVO.obj; if (!o || UI.panel) return;
  if (Math.hypot(JUG.x - o.x, JUG.z - o.z) < 1.4) return;
  const U = UI.U, Wc = CSSW, Hc = CSSH, rebota = Math.abs(Math.sin(t * 4)) * 0.6;
  const q = M4.proyectar(R.VP, o.x, SUELO + 2.4 + rebota, o.z);
  const m = 34 * U;
  let x, y, ang = 0, borde = false;
  if (q && q[0] * Wc > m && q[0] * Wc < Wc - m && q[1] * Hc > 120 * U && q[1] * Hc < Hc - m) { x = q[0] * Wc; y = q[1] * Hc; }
  else {
    const c = M4.proyectar(R.VP, o.x, SUELO, o.z) || [0.5, 1.5];
    let dx = c[0] * Wc - Wc / 2, dy = c[1] * Hc - Hc / 2; if (!q) { dx = -dx; dy = -dy; }
    const k = Math.min((Wc / 2 - m) / Math.max(1e-3, Math.abs(dx)), (Hc / 2 - m - 40 * U) / Math.max(1e-3, Math.abs(dy)));
    x = Wc / 2 + dx * k; y = Hc / 2 + 20 * U + dy * k; ang = Math.atan2(dy, dx) - PI / 2; borde = true;
  }
  g.save(); g.translate(x, y); g.rotate(ang);
  const s = (borde ? 15 : 18) * U * (1 + 0.06 * Math.sin(t * 8));
  g.beginPath(); g.moveTo(0, s * 1.1); g.lineTo(-s, -s * 0.1); g.lineTo(-s * 0.42, -s * 0.1); g.lineTo(-s * 0.42, -s * 1.1); g.lineTo(s * 0.42, -s * 1.1); g.lineTo(s * 0.42, -s * 0.1); g.lineTo(s, -s * 0.1); g.closePath();
  g.lineJoin = 'round'; g.lineWidth = 4 * U; g.strokeStyle = '#3a2408'; g.stroke();
  const gr = g.createLinearGradient(0, -s, 0, s); gr.addColorStop(0, '#fff27a'); gr.addColorStop(1, '#ffb412'); g.fillStyle = gr; g.fill();
  g.restore();
}
function dibujarJoystick(g) {
  const J = UI.joy, U = UI.U, r = 52 * U * [0.8, 1, 1.25][AJ.joyTam];
  let x0 = J.x0, y0 = J.y0, ver = J.activo;
  if (AJ.joy === 'fijo') { x0 = 30 * U + r; y0 = CSSH - 40 * U - r; ver = true; if (!J.activo) { J.x0 = x0; J.y0 = y0; } }
  if (!ver || UI.panel) return;
  g.fillStyle = 'rgba(20,30,50,0.32)'; g.beginPath(); g.arc(x0, y0, r, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 3 * U; g.stroke();
  const kx = x0 + J.vx * r * 0.6, ky = y0 + J.vy * r * 0.6;
  g.fillStyle = 'rgba(255,255,255,0.88)'; g.beginPath(); g.arc(kx, ky, r * 0.42, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(30,40,60,0.4)'; g.lineWidth = 2 * U; g.stroke();
}
// ---------- paneles ----------
function abrirPanel(p) { UI.panel = p; Sonido.efecto('clic', 0.6); UI.joy.activo = false; UI.joy.vx = UI.joy.vy = 0; }
function cerrarPanel() { UI.panel = null; Sonido.efecto('clic', 0.5); guardarAjustes(); }
function dibujarPanel(g, t) {
  const U = UI.U, Wc = CSSW, Hc = CSSH;
  g.fillStyle = 'rgba(8,12,24,0.6)'; g.fillRect(0, 0, Wc, Hc);
  UI.botones.length = 0;
  UI.botones.push({ x: 0, y: 0, w: Wc, h: Hc, f: () => { } });
  const p = UI.panel;
  if (p === 'ajustes') {
    const filas = [
      [T('musica'), AJ.musica ? T('si') : T('no'), () => { AJ.musica = !AJ.musica; Sonido.ponerMusica(AJ.musica); if (AJ.musica) Sonido.musica(true); }, null],
      [T('sonido'), AJ.sonido ? T('si') : T('no'), () => { AJ.sonido = !AJ.sonido; Sonido.ponerSfx(AJ.sonido); }, null],
      [T('vibra'), AJ.vibra ? T('si') : T('no'), () => { AJ.vibra = !AJ.vibra; Sonido.vibOn = AJ.vibra; Sonido.vibrar(30); }, null],
      [T('graficos'), AJ.calidad < 0 ? T('auto') + ' (' + T('cal')[R.calidad] + ')' : T('cal')[AJ.calidad], d => { AJ.calidad = clamp(AJ.calidad + d, -1, 3); ponerCalidadAjuste(); }, true],
      [T('idioma'), AJ.idioma === 'auto' ? T('auto') + ' · ' + NOMBRE_IDIOMA[IDIOMA] : NOMBRE_IDIOMA[AJ.idioma], d => { const L = ['auto', ...IDIOMAS]; AJ.idioma = L[(L.indexOf(AJ.idioma) + d + L.length) % L.length]; aplicarIdioma(); }, true],
      [T('joy'), AJ.joy === 'flota' ? T('flota') : T('fijo'), () => { AJ.joy = AJ.joy === 'flota' ? 'fijo' : 'flota'; }, true],
      [T('tam'), T('tams')[AJ.joyTam], d => { AJ.joyTam = clamp(AJ.joyTam + d, 0, 2); }, true],
    ];
    const w = Math.min(Wc - 28 * U, 330 * U), fh = 40 * U, h = 96 * U + filas.length * fh + 70 * U, x = Wc / 2 - w / 2, y = Math.max(10 * U, Hc / 2 - h / 2);
    tarjeta(g, x, y, w, h);
    texto(g, T('ajustes'), Wc / 2, y + 30 * U, 22 * U, '#ffd34a', '#101826');
    let dy = boton(g, x + w - 46 * U, y + 10 * U, 36 * U, 32 * U, '#d9485f', cerrarPanel);
    iconoDibujo(g, 'cruz', x + w - 28 * U, y + 26 * U + dy, 22 * U, '#fff');
    filas.forEach(([nom, val, f, flechas], i) => {
      const fy = y + 62 * U + i * fh;
      texto(g, nom, x + 18 * U, fy + fh / 2, tamQueEntra(g, nom, 13 * U, w * 0.38), '#ffffff', '#101826', 'left');
      const cw = w * 0.52, cx = x + w - cw - 14 * U;
      if (flechas) {
        dy = boton(g, cx, fy + 5 * U, 30 * U, 26 * U, '#56708f', () => { f(-1); Sonido.efecto('clic', 0.5); });
        iconoDibujo(g, 'izq', cx + 15 * U, fy + 18 * U + dy, 18 * U, '#fff');
        dy = boton(g, cx + cw - 30 * U, fy + 5 * U, 30 * U, 26 * U, '#56708f', () => { f(1); Sonido.efecto('clic', 0.5); });
        iconoDibujo(g, 'der', cx + cw - 15 * U, fy + 18 * U + dy, 18 * U, '#fff');
        texto(g, val, cx + cw / 2, fy + fh / 2, tamQueEntra(g, val, 12 * U, cw - 70 * U), '#ffffff', '#101826');
      } else {
        const on = val === T('si');
        dy = boton(g, cx + cw - 90 * U, fy + 5 * U, 90 * U, 26 * U, on ? '#3fae4f' : '#7a8496', () => { f(); Sonido.efecto('clic', 0.5); });
        texto(g, val, cx + cw - 45 * U, fy + 18 * U + dy, 13 * U, '#ffffff', '#101826');
      }
    });
    const by = y + 62 * U + filas.length * fh + 8 * U;
    dy = boton(g, x + 30 * U, by, w - 60 * U, 34 * U, '#c0392b', () => abrirPanel('borrar'));
    texto(g, T('borrar'), Wc / 2, by + 17 * U + dy, tamQueEntra(g, T('borrar'), 13 * U, w - 80 * U), '#ffffff', '#5a120c');
    texto(g, 'JXSTUDIOS · MANSION BUILDER 1.0 · ' + Math.round(PRINCIPAL.fps) + ' FPS', Wc / 2, y + h - 16 * U, 8 * U, 'rgba(255,255,255,0.6)', null);
  } else if (p === 'borrar') {
    const w = Math.min(Wc - 40 * U, 300 * U), h = 170 * U, x = Wc / 2 - w / 2, y = Hc / 2 - h / 2;
    tarjeta(g, x, y, w, h);
    envolver(g, T('seguro'), Wc / 2, y + 44 * U, w - 40 * U, 15 * U, '#ffffff');
    let dy = boton(g, x + 22 * U, y + h - 58 * U, w / 2 - 32 * U, 38 * U, '#c0392b', () => { borrarTodo(); });
    texto(g, T('siB'), x + 22 * U + (w / 2 - 32 * U) / 2, y + h - 39 * U + dy, 15 * U, '#fff', '#5a120c');
    dy = boton(g, x + w / 2 + 10 * U, y + h - 58 * U, w / 2 - 32 * U, 38 * U, '#56708f', () => abrirPanel('ajustes'));
    texto(g, T('noB'), x + w / 2 + 10 * U + (w / 2 - 32 * U) / 2, y + h - 39 * U + dy, 15 * U, '#fff', '#1a2438');
  } else if (p === 'volviste' || p === 'diario') {
    const w = Math.min(Wc - 40 * U, 300 * U), h = 250 * U, x = Wc / 2 - w / 2, y = Hc / 2 - h / 2;
    tarjeta(g, x, y, w, h);
    const tit = p === 'volviste' ? T('volviste') : T('diario');
    texto(g, tit, Wc / 2, y + 32 * U, tamQueEntra(g, tit, 20 * U, w - 30 * U), '#ffd34a', '#101826');
    const yaTomo = p === 'diario' && G.diario === hoy(), monto = p === 'volviste' ? PRINCIPAL.offline : ECO.diario(G.parte);
    if (p === 'volviste') envolver(g, T('teDejaron'), Wc / 2, y + 62 * U, w - 40 * U, 13 * U, '#ffffff');
    else { g.save(); g.translate(Wc / 2, y + 82 * U); g.rotate(Math.sin(t * 3) * 0.08); iconoDibujo(g, 'regalo', 0, 0, 58 * U, '#f6d365'); g.restore(); }
    if (!yaTomo) {
      moneda(g, Wc / 2 - 50 * U, y + 132 * U, 18 * U);
      texto(g, fmt(monto), Wc / 2 + 12 * U, y + 133 * U, 28 * U, '#ffe066', '#101826');
    } else envolver(g, T('manana'), Wc / 2, y + 132 * U, w - 40 * U, 14 * U, '#ffffff');
    const etq = yaTomo ? T('cerrar') : (p === 'volviste' ? T('cobrar') : T('reclamar'));
    const dy = boton(g, x + 40 * U, y + h - 66 * U, w - 80 * U, 44 * U, yaTomo ? '#56708f' : '#3fae4f', () => {
      if (!yaTomo) {
        G.dinero += monto; G.ganado += monto; UI.pulsoPlata(); Sonido.efecto('caja', 0.9); Sonido.vibrar([20, 30, 20]);
        if (p === 'diario') G.diario = hoy(); else PRINCIPAL.offline = 0;
        for (let k = 0; k < 30; k++) confeti(JUG.x + rnd(-1, 1), JUG.y + 2, JUG.z + rnd(-1, 1));
        guardar();
      }
      cerrarPanel();
    });
    texto(g, etq, Wc / 2, y + h - 44 * U + dy, tamQueEntra(g, etq, 17 * U, w - 100 * U), '#ffffff', '#101826');
  }
}
function envolver(g, s, x, y, max, tam, col) {
  letra(g, tam); const pal = s.split(' '), lin = []; let l = '';
  for (const p of pal) { const q = l ? l + ' ' + p : p; if (g.measureText(q).width > max && l) { lin.push(l); l = p; } else l = q; }
  if (l) lin.push(l);
  lin.forEach((s2, i) => texto(g, s2, x, y + (i - (lin.length - 1) / 2) * tam * 1.35, tam, col, '#101826'));
}
// toques sobre la interfaz: devuelve true si fue a un botón
function tocarUI(x, y) {
  for (let i = UI.botones.length - 1; i >= 0; i--) { const b = UI.botones[i]; if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return b; }
  return null;
}
function compartir() {
  Sonido.efecto('clic', 0.6);
  const url = location.protocol.startsWith('http') ? location.href.split('?')[0] : 'https://rezona.ai', txt = T('textoComp');
  if (navigator.share) { navigator.share({ title: 'MANSION BUILDER', text: txt, url }).catch(() => { }); return; }
  const copiar = navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(txt + ' ' + url) : Promise.reject();
  copiar.then(() => UI.aviso(T('copiado'), 'oro')).catch(() => UI.aviso(T('copiado'), 'oro'));
}
function guardarAjustes() { Guardado.escribir('ajustes', AJ); }
function cargarAjustes() { Object.assign(AJ, Guardado.leer('ajustes', {})); Sonido.musOn = AJ.musica; Sonido.sfxOn = AJ.sonido; Sonido.vibOn = AJ.vibra; }
