// SIETE COLORES — el bot: un A* sobre los cubos donde Killa se puede parar (caminar, escalón, borde, saltos de
// hueco, trepar paredes) y un guion que juega la historia entera con los mismos controles que una persona.
const BOTI = {
  pasos: [], i: 0, ruta: null, k: 0, t: 0, atasco: 0, mejorD: 1e9, replan: 0, tele: 0, fallas: [], esp: 0, dlgT: 0, salto: 0, log: [], planeo: null,
  info() { return { i: this.i, total: this.pasos.length, paso: this.pasos[this.i] && this.pasos[this.i].n, tele: this.tele, fallas: this.fallas.slice(-5), ruta: this.ruta ? this.ruta.length - this.k : 0 }; },
};
const parado = (x, y, z) => solido(x, y - 1, z) && !solido(x, y, z) && !solido(x, y + 1, z) && bloque(x, y - 1, z) !== B.CARDON;
function alturaParado(x, z, y0, abajo, arriba) { for (let y = y0 + arriba; y >= y0 - abajo; y--) if (parado(x, y, z)) return y; return null; }
const libre = (x, y, z) => !solido(x, y, z);
// vecinos de una celda: [x, y, z, costo, tipo]
function vecinosNav(x, y, z, alcance) {
  const L = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    if (!dx && !dz) continue;
    const nx = x + dx, nz = z + dz, diag = dx && dz;
    if (diag && !(libre(x + dx, y, z) && libre(x + dx, y + 1, z) && libre(x, y, z + dz) && libre(x, y + 1, z + dz))) continue;
    // caminar, escalón (+1) o bajar (hasta 6)
    let hecho = false;
    for (let ny = y + 1; ny >= y - 22; ny--) {
      if (!parado(nx, ny, nz)) continue;
      if (ny === y + 1 && !libre(x, y + 2, z)) break;
      if (ny < y) { let ok = true; for (let yy = ny; yy <= y + 1; yy++) if (!libre(nx, yy, nz)) { ok = false; break; } if (!ok) break; }
      L.push([nx, ny, nz, (diag ? 1.42 : 1) + (ny > y ? 0.3 : (y - ny) * 0.25), ny < y - 1 ? 'baja' : 'camina']);
      hecho = true; break;
    }
    if (diag) continue;
    // borde a la altura del pecho (+2): salto y se sube
    if (parado(nx, y + 2, nz) && libre(x, y + 2, z) && libre(x, y + 3, z)) L.push([nx, y + 2, nz, 2.6, 'borde']);
    // huecos de 2 a 4 (saltando; los de 4 con planeo)
    if (!hecho || !parado(nx, y, nz)) {
      for (let k = 2; k <= 6; k++) {
        const tx = x + dx * k, tz = z + dz * k;
        let ok = true;
        for (let j = 1; j <= k; j++) for (let yy = y; yy <= y + 2; yy++) if (!libre(x + dx * j, yy, z + dz * j) && !(j === k && yy === y - 1)) { if (j < k || yy > y) ok = false; }
        if (!ok) break;
        const ty = alturaParado(tx, tz, y, 3, k <= 3 ? 1 : 0);
        if (ty != null && parado(tx, ty, tz)) { let bajo = true; for (let j = 1; j < k; j++) if (parado(x + dx * j, y, z + dz * j)) bajo = false; if (bajo) { L.push([tx, ty, tz, 3 + k, k >= 4 ? 'planea' : 'salta']); break; } }
      }
    }
    // trepar una pared alta
    if (alcance > 2 && libre(x, y + 2, z) && !libre(nx, y, nz) && !libre(nx, y + 1, nz) && TREPA[bloque(nx, y, nz)] && TREPA[bloque(nx, y + 1, nz)]) {
      for (let ty = y + 3; ty <= y + alcance; ty++) {
        if (!libre(x, ty, z) || !libre(x, ty + 1, z)) break;
        if (!TREPA[bloque(nx, ty - 1, nz)] && solido(nx, ty - 1, nz)) break;
        if (parado(nx, ty, nz)) { L.push([nx, ty, nz, 2 + (ty - y) * 0.8, 'trepa']); break; }
      }
    }
  }
  return L;
}
// A* (montículo binario chico)
function rutaA(x0, y0, z0, x1, y1, z1, radio, alcance) {
  const clave = (x, y, z) => (x * 256 + z) * 64 + y;
  const abiertos = [], g = new Map(), de = new Map(), info = new Map();
  const h = (x, y, z) => Math.hypot(x - x1, z - z1) + Math.abs(y - y1) * 0.5;
  const push = n => { abiertos.push(n); let i = abiertos.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (abiertos[p].f <= abiertos[i].f) break; [abiertos[p], abiertos[i]] = [abiertos[i], abiertos[p]]; i = p; } };
  const pop = () => { const r = abiertos[0], u = abiertos.pop(); if (abiertos.length) { abiertos[0] = u; let i = 0; for (;;) { const l = 2 * i + 1, rr = l + 1; let m = i; if (l < abiertos.length && abiertos[l].f < abiertos[m].f) m = l; if (rr < abiertos.length && abiertos[rr].f < abiertos[m].f) m = rr; if (m === i) break; [abiertos[m], abiertos[i]] = [abiertos[i], abiertos[m]]; i = m; } } return r; };
  const k0 = clave(x0, y0, z0); g.set(k0, 0); push({ x: x0, y: y0, z: z0, f: h(x0, y0, z0), k: k0 });
  let n = 0, mejor = null, mejorH = 1e9;
  while (abiertos.length && n < 60000) {
    const c = pop(); n++;
    const hc = h(c.x, c.y, c.z);
    if (hc < mejorH) { mejorH = hc; mejor = c; }
    if (Math.hypot(c.x - x1, c.z - z1) <= radio && Math.abs(c.y - y1) <= (radio > 1.5 ? 3 : 1.5)) { mejor = c; mejorH = 0; break; }
    const gc = g.get(c.k);
    for (const [nx, ny, nz, costo, tipo] of vecinosNav(c.x, c.y, c.z, alcance)) {
      if (nx < 1 || nz < 1 || nx >= SX - 1 || nz >= SZ - 1) continue;
      const k = clave(nx, ny, nz), ng = gc + costo;
      if (g.has(k) && g.get(k) <= ng) continue;
      g.set(k, ng); de.set(k, c.k); info.set(k, { x: nx, y: ny, z: nz, tipo });
      push({ x: nx, y: ny, z: nz, f: ng + h(nx, ny, nz) * 1.1, k });
    }
  }
  if (!mejor || mejorH > radio + 2) return null;
  const ruta = [];
  let k = mejor.k;
  while (k !== k0 && info.has(k)) { ruta.push(info.get(k)); k = de.get(k); }
  ruta.reverse();
  return ruta;
}
function celdaJ() { return [Math.floor(J.x), Math.round(J.y), Math.floor(J.z)]; }

// ---------- el guion ----------
function guionBot() {
  const S = [], pl = SITIOS.plaza;
  const ir = (x, z, y, r, n) => S.push({ t: 'ir', x, z, y, r: r || 1.2, n: n || 'ir ' + x + ',' + z });
  const hablar = id => S.push({ t: 'hablar', id, n: 'hablar ' + id });
  const esperar = (f, n) => S.push({ t: 'esperar', f, n: n || 'esperar' });
  const tomar = id => S.push({ t: 'tomar', id, n: 'tomar ' + id });
  esperar(() => G.flags.ini, 'prólogo');
  ir(pl[0] + 3, pl[1] + 6, null, 2, 'plaza');
  esperar(() => G.flags.plaza, 'pujllay plaza');
  // rojo
  hablar('arriero'); tomar('ov1'); tomar('ov2'); tomar('ov3'); hablar('arriero'); esperar(() => G.colores[0] && !CINE, 'rojo');
  // naranja
  hablar('flor'); ir(SITIOS.mirador[0], SITIOS.mirador[1], null, 1.5, 'mirador');
  S.push({ t: 'planear', id: 'c1', n: 'planear al cardón' }); esperar(() => G.colores[1] && !CINE, 'naranja');
  // amarillo
  hablar('tomas'); hablar('lucia'); hablar('pedro'); hablar('rosa'); esperar(() => !entDe('rosa').volver, 'chicos vuelven'); hablar('tomas'); esperar(() => G.colores[2] && !CINE, 'amarillo');
  // verde
  hablar('fermin'); S.push({ t: 'tablilla', n: 'tablilla' }); S.push({ t: 'huancas', n: 'huancas' }); esperar(() => G.flags.verde && !DLG, 'piedra'); tomar('c3'); esperar(() => G.colores[3] && !CINE, 'verde');
  // turquesa
  hablar('coquena'); S.push({ t: 'perseguir', id: 'vicBlanca', n: 'vicuña' }); esperar(() => G.colores[4] && !CINE, 'turquesa');
  // violeta
  hablar('tito'); tomar('c5'); esperar(() => G.colores[5] && !CINE, 'violeta');
  // rosa y final
  esperar(() => !CINE && !DLG, 'pujllay cumbre');
  ir(SITIOS.cerro[0] + 2, SITIOS.cerro[1] + 3, null, 3, 'cumbre');
  hablar('pujllay'); S.push({ t: 'perseguir', id: 'pujllay', n: 'pujllay' }); esperar(() => G.colores[6], 'rosa');
  esperar(() => CINE && CINE.tipo === 'final' && CINE.t > 16, 'fiesta'); S.push({ t: 'terminar', n: 'terminar' });
  // después, las diez plumas (prueba que se puede llegar a todas)
  for (const [id] of PLUMAS) tomar(id);
  S.push({ t: 'fin', n: 'fin' });
  return S;
}
function iniciarBot() { BOTI.pasos = guionBot(); BOTI.i = 0; BOTI.ruta = null; BOTI.tele = 0; BOTI.fallas = []; BOTI.esp = 0; }
function alcanceTrepa() { return Math.max(0, Math.floor(J.estamMax * FIS.VTREPA * 0.85)); }
function planRuta(x, y, z, r) {
  const [cx, cy, cz] = celdaJ();
  const sy = parado(cx, cy, cz) ? cy : alturaParado(cx, cz, cy, 3, 1) || cy;
  const ty = y != null ? y : (alturaParado(Math.floor(x), Math.floor(z), 62, 62, 0) || 10);
  BOTI.ruta = rutaA(cx, sy, cz, Math.floor(x), ty, Math.floor(z), r, alcanceTrepa());
  BOTI.k = 0; BOTI.mejorD = 1e9; BOTI.atasco = 0; BOTI.dest = [x, ty, z, r];
  if (!BOTI.ruta) BOTI.fallas.push('sin ruta ' + BOTI.pasos[BOTI.i].n);
  return BOTI.ruta;
}
// devuelve la entrada del paso
function pasoBot(dt) {
  const out = { mx: 0, mz: 0, salta: false, sostiene: false, accion: false };
  const B0 = BOTI, P = B0.pasos[B0.i];
  if (!P) return out;
  if (DLG) { B0.dlgT += dt; if (B0.dlgT > 0.25) { B0.dlgT = 0; avanzarDialogo(); avanzarDialogo(); } return out; }
  const sig = () => { B0.i++; B0.ruta = null; B0.planeo = null; B0.esp = 0; if (B0.log.length < 200) B0.log.push([Math.round(G.tiempo), P.n]); };
  B0.esp += dt;
  if (CINE) { if (P.t === 'esperar' && P.f()) sig(); else if (P.t === 'perseguir' && !ACT) sig(); else if (P.t === 'terminar' && CINE.tipo === 'final') { terminarFinal(); sig(); } return out; }
  switch (P.t) {
    case 'esperar': if (P.f()) sig(); else if (B0.esp > 60) { B0.fallas.push('espera larga ' + P.n); sig(); } return out;
    case 'fin': return out;
    case 'ir': { const r = seguir(P.x, P.z, P.y, P.r, out, dt); if (r === 'llegó') sig(); return out; }
    case 'tomar': {
      const o = objDe(P.id);
      if (!o || !o.vis) { sig(); return out; }
      const r = seguir(o.x, o.z, Math.round(o.y - 0.55), 0.5, out, dt);
      if (r === 'llegó') { const d = Math.hypot(o.x - J.x, o.z - J.z); if (d > 0.5) { out.mx = (o.x - J.x) / d * 0.5; out.mz = (o.z - J.z) / d * 0.5; } }
      return out;
    }
    case 'hablar': {
      const e = entDe(P.id);
      if (!e) { sig(); return out; }
      if (B0.hablo && !DLG) { B0.hablo = false; sig(); return out; }
      const d = Math.hypot(e.x - J.x, e.z - J.z);
      if (d < 1.9 && Math.abs(e.y - J.y) < 2 && hablable() === e) { out.accion = true; B0.hablo = true; return out; }
      seguir(e.x, e.z, Math.round(e.y), 1.4, out, dt);
      return out;
    }
    case 'tablilla': {
      const [px, pz] = SITIOS.pucara, tx = px + 2.5, tz = pz - 2.5;
      const h = hablable();
      if (h && h.id === 'tablilla') { out.accion = true; sig(); return out; }
      seguir(tx - 1, tz, 29, 0.7, out, dt);
      return out;
    }
    case 'huancas': {
      if (G.flags.verde) { sig(); return out; }
      if (!ACT || ACT.tipo !== 'huancas') { B0.paso_ = 0; B0.i -= 1; B0.ruta = null; return out; }
      if (ACT.mostrando) return out;
      const k = ACT.pisadas.length, h = HUANCAS[CANCION[k]];
      if (ACT.sobre >= 0 && ACT.sobre !== CANCION[k]) {
        // salir de la huanca anterior hacia el centro
        const [px, pz] = SITIOS.pucara; const d = Math.hypot(px + 0.5 - J.x, pz + 2.5 - J.z); out.mx = (px + 0.5 - J.x) / d * 0.6; out.mz = (pz + 2.5 - J.z) / d * 0.6; return out;
      }
      const d = Math.hypot(h.x - J.x, h.z - J.z);
      if (d > 0.3) { out.mx = (h.x - J.x) / d * Math.min(1, d); out.mz = (h.z - J.z) / d * Math.min(1, d); }
      if (d > 3) seguir(h.x, h.z, h.y, 0.4, out, dt);
      return out;
    }
    case 'perseguir': {
      const e = entDe(P.id);
      if (!ACT || (ACT.tipo !== 'vicuna' && ACT.tipo !== 'pujllay')) { if (B0.esp > 2) sig(); return out; }
      const d = Math.hypot(e.x - J.x, e.z - J.z);
      if (d < 6 && Math.abs(e.y - J.y) < 2.5) { out.mx = (e.x - J.x) / d; out.mz = (e.z - J.z) / d; if (e.y > J.y + 0.6 && J.suelo) out.salta = true; B0.ruta = null; return out; }
      B0.reT = (B0.reT || 0) - dt;
      if (!B0.ruta || B0.reT <= 0) { B0.reT = 0.8; planRuta(e.x, Math.round(e.y), e.z, 1.2); }
      seguir(e.x, e.z, Math.round(e.y), 1.0, out, dt, true);
      return out;
    }
    case 'planear': {
      const o = objDe(P.id);
      if (!o || !o.vis) { sig(); return out; }
      const dx = o.x - J.x, dz = o.z - J.z, d = Math.hypot(dx, dz);
      if (!B0.planeo) { B0.planeo = { t: 0 }; }
      const pl = B0.planeo; pl.t += dt;
      out.mx = dx / d; out.mz = dz / d;
      if (J.suelo && pl.t > 0.25 && !pl.salto) { pl.salto = true; out.salta = true; return out; }
      if (!J.suelo) { out.sostiene = true; if (J.y < o.y + 1 && d > 3 && J.estam >= 1 && J.vy < -1 && !pl.ale) { out.salta = true; pl.ale = 0.4; } if (pl.ale) { pl.ale -= dt; if (pl.ale <= 0) pl.ale = 0; } }
      if (J.suelo && pl.salto && pl.t > 1.2) {
        // no llegó: vuelve al mirador y lo intenta otra vez
        if (d > 1.5) { B0.fallas.push('planeo corto ' + Math.round(d)); B0.planeo = null; B0.i--; }
      }
      return out;
    }
  }
  return out;
}
// sigue la ruta hacia (x,z): devuelve 'llegó' o 'va'
function seguir(x, z, y, r, out, dt, sinReplan) {
  const B0 = BOTI;
  const dFin = Math.hypot(x - J.x, z - J.z);
  if (dFin <= r && (y == null || Math.abs(J.y - y) < 1.6)) return 'llegó';
  if (!B0.ruta || (!sinReplan && B0.dest && Math.hypot(B0.dest[0] - x, B0.dest[2] - z) > 2)) { planRuta(x, y, z, Math.max(0.5, r - 0.3)); if (!B0.ruta) { B0.tele++; J.colocar(x, y != null ? y : sueloEn(x, z), z, J.yaw); return 'va'; } }
  const R0 = B0.ruta;
  if (B0.k >= R0.length) {
    // se terminó la ruta y no llegó: camina derecho al blanco (y salta si hace falta); si no hay caso, se replanea con pausa
    const dx = x - J.x, dz = z - J.z, d = Math.hypot(dx, dz);
    out.mx = dx / (d || 1); out.mz = dz / (d || 1);
    if (y != null && y > J.y + 0.5 && J.suelo) out.salta = true;
    B0.finT = (B0.finT || 0) + dt;
    if (B0.finT > 2.5) { B0.finT = 0; B0.ruta = null; B0.sinLlegar = (B0.sinLlegar || 0) + 1; if (B0.sinLlegar > 3) { B0.sinLlegar = 0; B0.tele++; B0.fallas.push('no llega ' + Math.round(x) + ',' + Math.round(z)); J.colocar(x, y != null ? y : sueloEn(x, z), z, J.yaw); } }
    return 'va';
  }
  B0.finT = 0;
  const n = R0[B0.k], cx = n.x + 0.5, cz = n.z + 0.5, dx = cx - J.x, dz = cz - J.z, d = Math.hypot(dx, dz);
  // llegó al nodo
  const dy = J.y - n.y;
  if (d < (n.tipo === 'camina' || n.tipo === 'baja' ? 0.45 : 0.35) && Math.abs(dy) < 0.7 && (J.suelo || n.tipo === 'baja')) { B0.k++; B0.mejorD = 1e9; B0.atasco = 0; return 'va'; }
  // también si ya se pasó (el siguiente está más cerca)
  if (B0.k + 1 < R0.length && J.suelo) { const m = R0[B0.k + 1]; if (Math.hypot(m.x + 0.5 - J.x, m.z + 0.5 - J.z) < d && Math.abs(J.y - m.y) < 0.6 && n.tipo === 'camina' && m.tipo === 'camina') { B0.k++; return 'va'; } }
  out.mx = dx / (d || 1); out.mz = dz / (d || 1);
  // trepando: empuja derecho contra la pared (es subir) y apenas hacia el costado del nodo
  if (J.pared) { const p = J.pared, tx = -p.wz, tz = p.wx, lat = clamp(dx * tx + dz * tz, -0.4, 0.4); out.mx = p.wx + tx * lat; out.mz = p.wz + tz * lat; }
  const prevT = n.tipo;
  if (prevT === 'borde' && J.suelo && d < 1.2) out.salta = true;
  if ((prevT === 'salta' || prevT === 'planea') && J.suelo && d < 2.6 + (prevT === 'planea' ? 1.2 : 0.4)) { const prev = B0.k > 0 ? R0[B0.k - 1] : null; const borde = prev ? Math.hypot(prev.x + 0.5 - J.x, prev.z + 0.5 - J.z) : 0; if (borde > 0.25 || !prev) out.salta = true; }
  if (prevT === 'planea' && !J.suelo) out.sostiene = true;
  if (prevT === 'salta' && !J.suelo && J.vy < 0) out.sostiene = true;
  if (n.tipo === 'camina' && n.y > J.y + 0.5 && n.y < J.y + 1.2 && d < 0.9 && J.suelo) { /* el escalón se sube solo */ }
  // atascado: replanea, y si sigue, salta (trepando o subiendo un borde no cuenta)
  const prog = d + Math.abs(n.y - J.y);
  if (J.pared || J.borde) { B0.atasco = 0; B0.mejorD = Math.min(B0.mejorD, prog); }
  else if (prog < B0.mejorD - 0.05) { B0.mejorD = prog; B0.atasco = 0; } else B0.atasco += dt;
  if (B0.atasco > 0.9 && J.suelo) out.salta = true;
  if (B0.atasco > 2.2) { B0.replan++; B0.atasco = 0; B0.mejorD = 1e9; if (B0.replan > 4) { B0.replan = 0; B0.tele++; B0.fallas.push('tele ' + n.x + ',' + n.y + ',' + n.z + ' ' + n.tipo); J.colocar(cx, n.y, cz, J.yaw); B0.k++; } else planRuta(x, y, z, Math.max(0.5, r - 0.3)); }
  return 'va';
}
