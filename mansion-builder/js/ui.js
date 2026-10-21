// MANSION BUILDER — la interfaz (lienzo 2D arriba del 3D): plata, la parte en obra, botones, ajustes, carteles,
// flecha de objetivo y joystick. Todo en píxeles CSS escalados por U (el lado corto mide 360).
const FUENTE = (window.__fuenteTT ? "'" + window.__fuenteTT + "', " : '') + "Bungee, 'Arial Black', Impact, sans-serif";
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
  pulsoGemas() { this.pulsoG = 1; },
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
  } else if (tipo === 'tv') {
    g.lineWidth = s * 0.12; rr(g, -s * 0.48, -s * 0.34, s * 0.96, s * 0.68, s * 0.14); g.stroke();
    g.beginPath(); g.moveTo(-s * 0.12, -s * 0.18); g.lineTo(s * 0.22, 0); g.lineTo(-s * 0.12, s * 0.18); g.closePath(); g.fill();
  } else if (tipo === 'carrito') {
    g.lineWidth = s * 0.1; g.beginPath(); g.moveTo(-s * 0.5, -s * 0.36); g.lineTo(-s * 0.32, -s * 0.36); g.lineTo(-s * 0.18, s * 0.16); g.lineTo(s * 0.38, s * 0.16); g.lineTo(s * 0.48, -s * 0.2); g.lineTo(-s * 0.26, -s * 0.2); g.stroke();
    g.beginPath(); g.arc(-s * 0.12, s * 0.34, s * 0.1, 0, TAU); g.arc(s * 0.3, s * 0.34, s * 0.1, 0, TAU); g.fill();
  } else if (tipo === 'estrella') {
    g.beginPath(); for (let k = 0; k < 10; k++) { const a = -PI / 2 + k / 10 * TAU, r = k % 2 ? s * 0.22 : s * 0.5; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill();
  } else if (tipo === 'mando') {
    rr(g, -s * 0.5, -s * 0.24, s, s * 0.5, s * 0.24); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(-s * 0.34, -s * 0.04, s * 0.22, s * 0.08); g.fillRect(-s * 0.27, -s * 0.11, s * 0.08, s * 0.22);
    g.beginPath(); g.arc(s * 0.2, -s * 0.06, s * 0.06, 0, TAU); g.arc(s * 0.32, s * 0.06, s * 0.06, 0, TAU); g.fill();
  } else if (tipo === 'ruleta') {
    const cs = ['#ff5a6e', '#ffd34a', '#5ee06a', '#5ab8ff'];
    for (let k = 0; k < 8; k++) { g.fillStyle = cs[k % 4]; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, s * 0.46, k / 8 * TAU, (k + 1) / 8 * TAU); g.closePath(); g.fill(); }
    g.fillStyle = '#fff'; g.beginPath(); g.arc(0, 0, s * 0.1, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(0, -s * 0.34); g.lineTo(-s * 0.1, -s * 0.56); g.lineTo(s * 0.1, -s * 0.56); g.closePath(); g.fill();
  } else if (tipo === 'pala') {
    g.lineWidth = s * 0.12; g.beginPath(); g.moveTo(-s * 0.3, s * 0.3); g.lineTo(s * 0.18, -s * 0.18); g.stroke();
    g.beginPath(); g.moveTo(s * 0.1, -s * 0.3); g.lineTo(s * 0.42, -s * 0.48); g.lineTo(s * 0.5, -s * 0.12); g.lineTo(s * 0.3, -s * 0.02); g.closePath(); g.fill();
  } else if (tipo === 'calendario') {
    rr(g, -s * 0.42, -s * 0.34, s * 0.84, s * 0.76, s * 0.1); g.fill();
    g.fillStyle = '#e8384f'; g.fillRect(-s * 0.42, -s * 0.34, s * 0.84, s * 0.22);
    g.fillStyle = 'rgba(0,0,0,0.35)'; for (let k = 0; k < 6; k++) g.fillRect(-s * 0.3 + (k % 3) * s * 0.22, -s * 0.02 + Math.floor(k / 3) * s * 0.2, s * 0.14, s * 0.12);
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
  if (f) { const e = UI.esc; UI.botones.push(e ? { x: e.cx + (x - e.cx) * e.k, y: e.cy + (y - e.cy) * e.k, w: w * e.k, h: (h + canto) * e.k, f } : { x, y, w, h: h + canto, f }); }
  return dy;
}
function tarjeta(g, x, y, w, h) {
  const U = UI.U;
  g.fillStyle = 'rgba(0,0,0,0.28)'; rr(g, x, y + 5 * U, w, h, 16 * U); g.fill();
  g.fillStyle = '#2b3a55'; rr(g, x, y, w, h, 16 * U); g.fill();
  g.fillStyle = '#3b5078'; rr(g, x + 4 * U, y + 4 * U, w - 8 * U, h - 8 * U, 13 * U); g.fill();
  g.strokeStyle = '#1a2438'; g.lineWidth = 3 * U; rr(g, x, y, w, h, 16 * U); g.stroke();
}
function gema(g, x, y, r) {
  const pts = [[0, -1], [0.85, -0.35], [0.6, 0.75], [-0.6, 0.75], [-0.85, -0.35]];
  g.fillStyle = '#4a1d7a'; g.beginPath(); pts.forEach(([a, b], i) => i ? g.lineTo(x + a * r, y + b * r + r * 0.12) : g.moveTo(x + a * r, y + b * r + r * 0.12)); g.closePath(); g.fill();
  const gr = g.createLinearGradient(x, y - r, x, y + r); gr.addColorStop(0, '#f2d6ff'); gr.addColorStop(0.5, '#c06cf0'); gr.addColorStop(1, '#7a2ec0');
  g.fillStyle = gr; g.beginPath(); pts.forEach(([a, b], i) => i ? g.lineTo(x + a * r, y + b * r) : g.moveTo(x + a * r, y + b * r)); g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.moveTo(x, y - r); g.lineTo(x + 0.85 * r, y - 0.35 * r); g.lineTo(x, y - 0.1 * r); g.lineTo(x - 0.85 * r, y - 0.35 * r); g.closePath(); g.fill();
}
// un marco de panel que entra en la pantalla (si no entra, se achica todo junto, también los toques)
function abrirMarco(g, w, h) {
  const U = UI.U, Wc = CSSW, Hc = CSSH, k = Math.min(1, (Hc - 12 * U) / h, (Wc - 8 * U) / w);
  UI.esc = { cx: Wc / 2, cy: Hc / 2, k };
  g.save(); g.translate(Wc / 2, Hc / 2); g.scale(k, k); g.translate(-Wc / 2, -Hc / 2);
  return { x: Wc / 2 - w / 2, y: Hc / 2 - h / 2, w, h };
}
function cerrarMarco(g) { g.restore(); UI.esc = null; }
function botonCerrar(g, x, y, f) { const U = UI.U, dy = boton(g, x, y, 36 * U, 32 * U, '#d9485f', f || cerrarPanel); iconoDibujo(g, 'cruz', x + 18 * U, y + 16 * U + dy, 22 * U, '#fff'); }
function monedasPanel(g, cx, cy) {
  const U = UI.U;
  g.fillStyle = 'rgba(16,24,38,0.7)'; rr(g, cx - 120 * U, cy - 12 * U, 240 * U, 24 * U, 12 * U); g.fill();
  moneda(g, cx - 104 * U, cy, 8 * U); texto(g, fmt(G.dinero), cx - 92 * U, cy + 1 * U, 12 * U, '#ffe066', '#101826', 'left');
  gema(g, cx + 30 * U, cy, 8 * U); texto(g, fmt(G.gemas), cx + 42 * U, cy + 1 * U, 12 * U, '#e6c8ff', '#101826', 'left');
}
function pestanas(g, x, y, w, nombres, actual, f) {
  const U = UI.U, n = nombres.length, bw = (w - (n - 1) * 4 * U) / n;
  nombres.forEach((s, i) => {
    const bx = x + i * (bw + 4 * U), dy = boton(g, bx, y, bw, 30 * U, i === actual ? '#e8a33a' : '#56708f', () => f(i), i === actual);
    texto(g, s, bx + bw / 2, y + 15 * U + dy, tamQueEntra(g, s, 11 * U, bw - 6 * U), '#fff', '#101826');
  });
}
function tarjetaItem(g, x, y, w, h, marcado) {
  const U = UI.U;
  g.fillStyle = marcado ? '#2f7a4a' : '#2b3a55'; rr(g, x, y, w, h, 10 * U); g.fill();
  g.strokeStyle = marcado ? '#8dffa0' : 'rgba(255,255,255,0.18)'; g.lineWidth = 2 * U; rr(g, x, y, w, h, 10 * U); g.stroke();
}
function insignia(g, x, y) { const U = UI.U; g.fillStyle = '#ff3b4e'; g.beginPath(); g.arc(x, y, 7 * U, 0, TAU); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 1.5 * U; g.stroke(); texto(g, '!', x, y + 0.5 * U, 10 * U, '#fff', null); }
// ---------- la interfaz del juego ----------
function dibujarUI(g, dt, t) {
  const U = UI.U, Wc = CSSW, Hc = CSSH;
  UI.botones.length = 0;
  g.clearRect(0, 0, Wc, Hc);
  UI.pulso = Math.max(0, UI.pulso - dt * 4);
  etiquetasMundo(g, t);
  flechaObjetivo(g, t);
  // la plata y las gemas
  UI.pulsoG = Math.max(0, (UI.pulsoG || 0) - dt * 4);
  const sPlata = fmt(G.dinero), sGemas = fmt(G.gemas), hp = 40 * U, yp = 10 * U;
  letra(g, 20 * U); const wp = Math.max(110 * U, g.measureText(sPlata).width + 62 * U), wg = Math.max(70 * U, g.measureText(sGemas).width + 50 * U);
  const x0 = Wc / 2 - (wp + 6 * U + wg) / 2;
  const pastilla = (x, w, borde) => { g.fillStyle = 'rgba(0,0,0,0.3)'; rr(g, x, yp + 4 * U, w, hp, hp / 2); g.fill(); g.fillStyle = 'rgba(24,34,54,0.86)'; rr(g, x, yp, w, hp, hp / 2); g.fill(); g.strokeStyle = borde; g.lineWidth = 2.5 * U; rr(g, x, yp, w, hp, hp / 2); g.stroke(); };
  pastilla(x0, wp, '#ffd34a'); moneda(g, x0 + 20 * U, yp + hp / 2, 13 * U);
  texto(g, sPlata, x0 + 38 * U + (wp - 46 * U) / 2, yp + hp / 2 + 1 * U, 20 * U * (1 + UI.pulso * 0.12), '#ffffff', '#101826');
  const xg = x0 + wp + 6 * U;
  pastilla(xg, wg, '#c06cf0'); gema(g, xg + 19 * U, yp + hp / 2, 11 * U);
  texto(g, sGemas, xg + 34 * U + (wg - 42 * U) / 2, yp + hp / 2 + 1 * U, 18 * U * (1 + UI.pulsoG * 0.15), '#ffffff', '#101826');
  // izquierda: ajustes y el boost x2 por anuncio
  const bs = 44 * U;
  let dy = boton(g, 10 * U, 10 * U, bs, bs, '#6b7c93', () => abrirPanel('ajustes'));
  iconoDibujo(g, 'engranaje', 10 * U + bs / 2, 10 * U + bs / 2 + dy, bs * 0.62, '#ffffff');
  if (G.parte >= 1) {
    const activo = G.boosts.x2 > 0;
    dy = boton(g, 10 * U, 64 * U, bs, bs, activo ? '#3fae4f' : '#8a52c8', activo ? null : () => conAnuncio('boost', () => { G.boosts.x2 += 300; UI.aviso('x2 $!', 'oro'); Sonido.efecto('desbloquear', 0.8); }));
    texto(g, 'x2', 10 * U + bs / 2, 64 * U + bs / 2 - 5 * U + dy, 15 * U, '#ffe066', '#101826');
    if (activo) texto(g, fmtReloj(G.boosts.x2), 10 * U + bs / 2, 64 * U + bs - 9 * U + dy, 9 * U, '#ffffff', '#101826');
    else iconoDibujo(g, 'tv', 10 * U + bs / 2, 64 * U + bs - 10 * U + dy, 13 * U, '#ffffff');
    // los otros boosts activos, chiquitos debajo
    let yb = 120 * U;
    for (const k of ['vel', 'iman']) if (G.boosts[k] > 0) {
      g.fillStyle = 'rgba(24,34,54,0.8)'; rr(g, 8 * U, yb, 48 * U, 22 * U, 11 * U); g.fill();
      g.drawImage(iconoBloque(k === 'vel' ? B.LANA_CELESTE : B.HIERRO), 11 * U, yb + 2 * U, 16 * U, 17.9 * U);
      texto(g, fmtReloj(G.boosts[k]), 42 * U, yb + 11.5 * U, 9 * U, '#fff', '#101826'); yb += 26 * U;
    }
  }
  // derecha: calendario, compartir, tienda, actividades, minijuegos y ruleta
  const xb = Wc - 10 * U - bs, col = [
    ['calendario', '#e8a33a', () => { ACT.pestana = 'calendario'; abrirPanel('actividades'); }, calendarioListo()],
    ['compartir', '#3aa0e8', () => compartir(), false],
    ['carrito', '#3fae4f', () => abrirTienda(), false],
    ['estrella', '#d9485f', () => { ACT.pestana = 'misiones'; abrirPanel('actividades'); }, hayMision()],
    ['mando', '#8a52c8', () => abrirPanel('minijuegos'), ceboActual() >= CEBO_MAX || partidasTorre() > 0],
    ['ruleta', '#f2a516', () => abrirPanel('ruleta'), ruletaGratis()],
  ];
  const paso = Math.min(54 * U, (Hc - 20 * U) / col.length);
  col.forEach(([ic, c, f, avisa], i) => {
    if (i >= 2 && G.parte < 1) return;
    const yb = 10 * U + i * paso, d = boton(g, xb, yb, bs, bs, c, f);
    iconoDibujo(g, ic, xb + bs / 2, yb + bs / 2 + d, bs * 0.6, '#ffffff');
    if (avisa) insignia(g, xb + bs - 3 * U, yb + 4 * U);
  });
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
    texto(g, T('mansion'), Wc / 2, y + 15 * U, tamQueEntra(g, T('mansion'), 12 * U, w - 16 * U), '#ffd34a', '#101826');
    const dy = boton(g, x + 16 * U, y + 26 * U, w - 32 * U, 22 * U, '#e8a33a', () => abrirPanel('renovar'));
    const s2 = T('renovar') + (G.estrellas + 2); texto(g, s2, Wc / 2, y + 37 * U + dy, tamQueEntra(g, s2, 11 * U, w - 44 * U), '#ffffff', '#101826');
    return;
  }
  if (G.estrellas) texto(g, '★'.repeat(Math.min(5, G.estrellas)), x + w - 8 * U, y + 10 * U, 9 * U, '#ffd34a', '#101826', 'right');
  const tit = T('parteN', { n: G.parte + 1, t: PARTES.length }) + ' · ' + T('parte.' + P.id).toUpperCase();
  texto(g, tit, Wc / 2, y + 12 * U, tamQueEntra(g, tit, 11 * U, w - 16 * U), '#ffffff', '#101826');
  // progreso total de la parte
  let hecho = 0, total = 0; for (const m in P.need) { const n = necesita(G.parte, m); hecho += Math.min(n, OBRA.aterrizado[m] || 0); total += n; }
  const bx = x + 10 * U, bw = w - 20 * U, by = y + 22 * U;
  g.fillStyle = '#16202f'; rr(g, bx, by, bw, 7 * U, 3.5 * U); g.fill();
  g.fillStyle = '#5ee06a'; if (hecho) { rr(g, bx, by, Math.max(7 * U, bw * hecho / total), 7 * U, 3.5 * U); g.fill(); }
  // lo que pide, material por material
  const mats = Object.keys(P.need), cw = Math.min(70 * U, (w - 16 * U) / mats.length);
  mats.forEach((m, i) => {
    const n = necesita(G.parte, m), cx = Wc / 2 + (i - (mats.length - 1) / 2) * cw, cy = y + 39 * U, lleg = Math.min(n, OBRA.aterrizado[m] || 0);
    g.drawImage(iconoBloque(BLOQUE_DE[m], Math.round(16 * U * 2) / 2), cx - 26 * U, cy - 9 * U, 16 * U, 17.9 * U);
    texto(g, lleg + '/' + n, cx + 6 * U, cy + 0.5 * U, 11 * U, lleg >= n ? '#5ee06a' : '#ffffff', '#101826', 'center');
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
  // completar lo que falta para un cuadro mirando un anuncio
  const pa = VIVO.padActivo;
  if (pa && padActivo(pa)) {
    const falta = pa.precio() - (G.pads[pa.id] || 0) - G.dinero, q = M4.proyectar(R.VP, pa.x, SUELO + 0.1, pa.z + 1.3);
    if (q && falta > 0 && falta <= unidadPlata() * 4 && adQueda('completar') > 0) {
      const x = q[0] * Wc, y = q[1] * Hc + 52 * U;
      const dy = boton(g, x - 62 * U, y, 124 * U, 30 * U, '#8a52c8', () => conAnuncio('completar', () => { G.dinero += falta; UI.pulsoPlata(); }));
      iconoDibujo(g, 'tv', x - 42 * U, y + 15 * U + dy, 16 * U, '#fff'); texto(g, '+$' + fmt(falta), x + 10 * U, y + 16 * U + dy, tamQueEntra(g, '+$' + fmt(falta), 13 * U, 80 * U), '#fff', '#101826');
    }
  }
  // los cuadros de actividad (pesca en el muelle y la maquinita de arcade)
  if (G.parte >= 1) for (const a of ACT_PADS) {
    const q = M4.proyectar(R.VP, a.x, alturaPiso(a.x, a.z) + 0.1, a.z + 1.2); if (!q) continue;
    const x = q[0] * Wc, y = q[1] * Hc + 6 * U; if (x < -60 || x > Wc + 60 || y < -40 || y > Hc + 60) continue;
    const s = a.id === 'pesca' ? T('mj.pesca').toUpperCase() : T('minijuegos'); letra(g, 12 * U); const w = g.measureText(s).width + 40 * U;
    g.fillStyle = 'rgba(24,60,120,0.9)'; rr(g, x - w / 2, y, w, 24 * U, 12 * U); g.fill(); g.strokeStyle = '#9fd0ff'; g.lineWidth = 2 * U; rr(g, x - w / 2, y, w, 24 * U, 12 * U); g.stroke();
    if (a.id === 'pesca') dibujarPez(g, x - w / 2 + 16 * U, y + 12 * U, 9 * U, PECES[1], 0); else iconoDibujo(g, 'mando', x - w / 2 + 16 * U, y + 12 * U, 18 * U, '#ffffff');
    texto(g, s, x + 9 * U, y + 13 * U, 12 * U, '#ffffff', '#101826');
  }
  // el cofre: si no se ve, un aviso en el borde
  if (COFRES.uno && !UI.panel) {
    const c = COFRES.uno, q = M4.proyectar(R.VP, c.x, SUELO + 1.4, c.z);
    if (q && q[0] > 0.05 && q[0] < 0.95 && q[1] > 0.12 && q[1] < 0.95) { texto(g, '!', q[0] * Wc, q[1] * Hc - Math.abs(Math.sin(t * 5)) * 6 * U, 20 * U, '#ffe066', '#101826'); }
    else if (q) {
      const ex = clamp(q[0], 0.08, 0.92) * Wc, ey = clamp(q[1], 0.2, 0.9) * Hc;
      g.fillStyle = 'rgba(24,34,54,0.85)'; g.beginPath(); g.arc(ex, ey, 18 * U, 0, TAU); g.fill(); g.strokeStyle = '#ffd34a'; g.lineWidth = 2 * U; g.stroke();
      g.drawImage(iconoBloque(B.CAJA), ex - 11 * U, ey - 13 * U, 22 * U, 24.6 * U);
    }
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
  if (p === 'tienda') return panelTienda(g, t);
  if (p === 'actividades') return panelActividades(g, t);
  if (p === 'minijuegos') return panelMinijuegos(g, t);
  if (p === 'ruleta') return panelRuleta(g, t);
  if (p === 'premio') return panelPremio(g, t);
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
  } else if (p === 'renovar') {
    const w = Math.min(Wc - 40 * U, 300 * U), h = 230 * U, x = Wc / 2 - w / 2, y = Hc / 2 - h / 2;
    tarjeta(g, x, y, w, h);
    texto(g, T('renovar') + (G.estrellas + 2), Wc / 2, y + 30 * U, tamQueEntra(g, T('renovar') + (G.estrellas + 2), 18 * U, w - 30 * U), '#ffd34a', '#101826');
    envolver(g, T('renovarTxt'), Wc / 2, y + 86 * U, w - 40 * U, 13 * U, '#ffffff');
    let dy = boton(g, x + 22 * U, y + h - 58 * U, w / 2 - 32 * U, 38 * U, '#3fae4f', () => renovarMansion());
    texto(g, T('siB'), x + 22 * U + (w / 2 - 32 * U) / 2, y + h - 39 * U + dy, 15 * U, '#fff', '#101826');
    dy = boton(g, x + w / 2 + 10 * U, y + h - 58 * U, w / 2 - 32 * U, 38 * U, '#56708f', () => cerrarPanel());
    texto(g, T('noB'), x + w / 2 + 10 * U + (w / 2 - 32 * U) / 2, y + h - 39 * U + dy, 15 * U, '#fff', '#1a2438');
  } else if (p === 'borrar') {
    const w = Math.min(Wc - 40 * U, 300 * U), h = 170 * U, x = Wc / 2 - w / 2, y = Hc / 2 - h / 2;
    tarjeta(g, x, y, w, h);
    envolver(g, T('seguro'), Wc / 2, y + 44 * U, w - 40 * U, 15 * U, '#ffffff');
    let dy = boton(g, x + 22 * U, y + h - 58 * U, w / 2 - 32 * U, 38 * U, '#c0392b', () => { borrarTodo(); });
    texto(g, T('siB'), x + 22 * U + (w / 2 - 32 * U) / 2, y + h - 39 * U + dy, 15 * U, '#fff', '#5a120c');
    dy = boton(g, x + w / 2 + 10 * U, y + h - 58 * U, w / 2 - 32 * U, 38 * U, '#56708f', () => abrirPanel('ajustes'));
    texto(g, T('noB'), x + w / 2 + 10 * U + (w / 2 - 32 * U) / 2, y + h - 39 * U + dy, 15 * U, '#fff', '#1a2438');
  } else if (p === 'volviste') {
    const w = Math.min(Wc - 40 * U, 300 * U), h = 290 * U, x = Wc / 2 - w / 2, y = Hc / 2 - h / 2, monto = PRINCIPAL.offline;
    tarjeta(g, x, y, w, h);
    texto(g, T('volviste'), Wc / 2, y + 32 * U, tamQueEntra(g, T('volviste'), 20 * U, w - 30 * U), '#ffd34a', '#101826');
    envolver(g, T('teDejaron'), Wc / 2, y + 64 * U, w - 40 * U, 13 * U, '#ffffff');
    moneda(g, Wc / 2 - 56 * U, y + 120 * U, 20 * U);
    texto(g, fmt(monto), Wc / 2 + 10 * U, y + 121 * U, 28 * U, '#ffe066', '#101826');
    const cobrar = m => { G.dinero += monto * m; G.ganado += monto * m; UI.pulsoPlata(); Sonido.efecto('caja', 0.9); Sonido.vibrar([20, 30, 20]); PRINCIPAL.offline = 0; for (let k = 0; k < 30; k++) confeti(JUG.x + rnd(-1, 1), JUG.y + 2, JUG.z + rnd(-1, 1)); guardar(); UI.panel = null; };
    let dy = boton(g, x + 30 * U, y + h - 112 * U, w - 60 * U, 44 * U, '#8a52c8', () => conAnuncio('completar', () => cobrar(2)));
    iconoDibujo(g, 'tv', x + 62 * U, y + h - 90 * U + dy, 20 * U, '#fff'); texto(g, T('cobrarX', { n: 2 }), Wc / 2 + 14 * U, y + h - 90 * U + dy, tamQueEntra(g, T('cobrarX', { n: 2 }), 16 * U, w - 130 * U), '#fff', '#101826');
    dy = boton(g, x + 50 * U, y + h - 58 * U, w - 100 * U, 38 * U, '#3fae4f', () => cobrar(1));
    texto(g, T('cobrar'), Wc / 2, y + h - 39 * U + dy, 15 * U, '#ffffff', '#101826');
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
  if (window.__compartirTT) { window.__compartirTT(txt); return; }
  if (navigator.share) { navigator.share({ title: 'MANSION BUILDER', text: txt, url }).catch(() => { }); return; }
  const copiar = navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(txt + ' ' + url) : Promise.reject();
  copiar.then(() => UI.aviso(T('copiado'), 'oro')).catch(() => UI.aviso(T('copiado'), 'oro'));
}
function guardarAjustes() { Guardado.escribir('ajustes', AJ); }
function cargarAjustes() { Object.assign(AJ, Guardado.leer('ajustes', {})); Sonido.musOn = AJ.musica; Sonido.sfxOn = AJ.sonido; Sonido.vibOn = AJ.vibra; }
