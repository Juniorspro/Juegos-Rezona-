// FAMATINA — economía y simulación (paso fijo, azar con semilla: Node y el bot corren lo mismo)
const ECO = {
  RP: 7, RC: 5, RU: 9, A: 1, cA: 4, gL: 1.1, cU: 15,
  aE: 22, gE: 1.08, cE: 12, hE: 1.11,
  aS: 26, gS: 1.08, cS: 14, hS: 1.11,
  NIVELES: 25, LMAX: 2000,
};
const escalaMina = k => Math.pow(1e4, k);
function hitos(L) { return L < 10 ? 0 : L < 25 ? 1 : L < 50 ? 2 : 3 + Math.floor((L - 50) / 50); }
function proximoHito(L) { return L < 10 ? 10 : L < 25 ? 25 : L < 50 ? 50 : 50 * (Math.floor(L / 50) + 1); }
function minerosDe(L) { return 1 + (L >= 10) + (L >= 25) + (L >= 50) + (L >= 100) + (L >= 200); }
function carrosDe(L) { return 1 + (L >= 10) + (L >= 25) + (L >= 50) + (L >= 100); }
const RAREZA = [{ p: 0.7, x: 2, dur: 60, cd: 600, reb: 0.3 }, { p: 0.25, x: 3, dur: 120, cd: 720, reb: 0.5 }, { p: 0.05, x: 5, dur: 180, cd: 900, reb: 0.7 }];
const HAB = { nivel: ['vel', 'vel', 'rebaja'], asc: ['vel', 'carga', 'rebaja'], sup: ['vel', 'carga', 'rebaja'] };
const PESO_MIN = [40, 30, 15, 8, 5, 2];
const nivelMineral = j => j * 4;

class Mina {
  constructor(k, d, op) {
    op = op || {};
    this.k = k; this.def = MINAS[k]; this.d = d;
    this.esc = op.escala != null ? op.escala : escalaMina(k);
    this.mods = op.mods || {};
    this.carrera = !!op.carrera;
    this.ahora = op.ahora || (() => G.reloj);
    this.rng = rngSemilla(op.semilla || ((hashTxt(this.def.id) ^ (d.sem || 7)) >>> 0));
    this.ag = null;
    this.ev = { condor: null, veta: null, geoda: null, tC: 75, tV: 55, tG: 110 };
    this.ventas = 0; this.tTasa = 0; this.tasa = 0;
    this.on = {};   // ganchos del dibujo y el sonido: venta, descarga, pica, mineral, hito
  }
  static nueva(sem) { return { cash: 0, total: 0, hist: 0, niveles: [{ L: 1, caja: 0, cap: null }], asc: { L: 1, cap: null }, sup: { L: 1, cap: null }, tolva: 0, ref: 0, mult: 1, refN: 7, min: [0, 0, 0, 0, 0, 0], capG: [], maxN: 1, sem: sem || 7 }; }
  aviso(n, a, b) { const f = this.on[n]; if (f) f(a, b); }

  // ---- multiplicadores ----
  encontrados() { return this.d.min.reduce((a, b) => a + (b ? 1 : 0), 0); }
  multValor() {
    let m = this.d.mult || 1;
    const e = this.encontrados();
    m *= (1 + 0.1 * e) * (e === 6 ? 2 : 1);
    if (!this.carrera && typeof multGlobal === 'function') m *= multGlobal();
    if (this.carrera && this.boostHasta > this.ahora()) m *= 2;
    return m;
  }
  capDe(tipo, i) { return tipo === 'nivel' ? this.d.niveles[i].cap : this.d[tipo].cap; }
  activa(c) { return c && c.act > this.ahora() ? c : null; }
  multHab(tipo, i, h) { const c = this.activa(this.capDe(tipo, i)); return c && c.h === h ? RAREZA[c.r].x : 1; }
  velNivelM(i) { return this.multHab('nivel', i, 'vel') * (this.mods.minero || 1); }
  velAscM() { return this.multHab('asc', 0, 'vel') * (this.mods.asc || 1); }
  cargaAscM() { return this.multHab('asc', 0, 'carga'); }
  velSupM() { return this.multHab('sup', 0, 'vel'); }
  cargaSupM() { return this.multHab('sup', 0, 'carga'); }
  rebajaDe(tipo, i) { const c = this.activa(this.capDe(tipo, i)); return (c && c.h === 'rebaja' ? 1 - RAREZA[c.r].reb : 1) * (this.mods.rebaja || 1); }

  // ---- números de cada parte ----
  prodNivel(i, L) { if (L == null) L = this.d.niveles[i].L; let p = ECO.A * this.esc * Math.pow(ECO.RP, i) * L * Math.pow(2, hitos(L)); if (this.mods.oroNivel === i) p *= 3; return p; }
  velMin(L) { return 0.55 * (1 + 0.08 * Math.min(hitos(L), 8)); }
  cicloMin(L) { return 2 / this.velMin(L) + 1.3; }
  capAsc(L) { if (L == null) L = this.d.asc.L; return ECO.aE * this.esc * Math.pow(ECO.gE, L - 1) * Math.pow(2, hitos(L)); }
  velAsc(L) { if (L == null) L = this.d.asc.L; return 2 * (1 + 0.15 * Math.min(hitos(L), 10)); }
  capSup(L) { if (L == null) L = this.d.sup.L; return ECO.aS * this.esc * Math.pow(ECO.gS, L - 1) * Math.pow(2, hitos(L)); }
  velSup(L) { if (L == null) L = this.d.sup.L; return 0.33 * (1 + 0.1 * Math.min(hitos(L), 8)); }
  costoAbrir(i) { return ECO.cU * this.esc * Math.pow(ECO.RU, i) * (this.mods.rebaja || 1); }
  costoCapataz(tipo, i) {
    const f = this.mods.capataces || 1;
    if (tipo === 'nivel') return (i === 0 ? 30 * this.esc : this.costoAbrir(i) * 0.8) * f;
    return (tipo === 'asc' ? 60 : 75) * this.esc * f;
  }
  datosMejora(tipo, i) {
    if (tipo === 'nivel') { const L = this.d.niveles[i].L; return { L, base: ECO.cA * this.esc * Math.pow(ECO.RC, i) * Math.pow(ECO.gL, L - 1), g: ECO.gL }; }
    if (tipo === 'asc') { const L = this.d.asc.L; return { L, base: ECO.cE * this.esc * Math.pow(ECO.hE, L - 1), g: ECO.hE }; }
    const L = this.d.sup.L; return { L, base: ECO.cS * this.esc * Math.pow(ECO.hS, L - 1), g: ECO.hS };
  }
  costo(tipo, i, n) { const m = this.datosMejora(tipo, i); return m.base * (Math.pow(m.g, n) - 1) / (m.g - 1) * this.rebajaDe(tipo, i); }
  maxN(tipo, i) {
    const m = this.datosMejora(tipo, i), c1 = m.base * this.rebajaDe(tipo, i);
    if (this.d.cash < c1) return 0;
    const n = Math.floor(Math.log(1 + this.d.cash * (m.g - 1) / c1) / Math.log(m.g) + 1e-9);
    return clamp(n, 1, ECO.LMAX - m.L);
  }
  nivelDe(tipo, i) { return tipo === 'nivel' ? this.d.niveles[i] : this.d[tipo]; }
  comprar(tipo, i, n) {
    const o = this.nivelDe(tipo, i);
    n = Math.min(n, ECO.LMAX - o.L);
    if (n < 1) return false;
    const c = this.costo(tipo, i, n);
    if (c > this.d.cash) return false;
    const h0 = hitos(o.L);
    this.d.cash -= c; o.L += n;
    if (hitos(o.L) > h0) this.aviso('hito', tipo, i);
    return true;
  }
  abrir() {
    const d = this.d, i = d.niveles.length;
    if (i >= ECO.NIVELES) return false;
    const c = this.costoAbrir(i);
    if (d.cash < c) return false;
    d.cash -= c;
    d.niveles.push({ L: 1, caja: 0, cap: d.capG[i] || null });
    d.maxN = Math.max(d.maxN || 1, d.niveles.length);
    if (this.ag) this.ag.niv.push({ min: [this.nuevoMinero(0)] });
    return true;
  }
  nuevoCapataz(tipo) {
    if (this.carrera) return { s: Math.floor(this.rng() * 1e9) + 1, r: 0, h: 'vel', act: 0, cd: 0 };   // en la Fiebre, sin suerte
    const r = this.rng(), rar = r < RAREZA[2].p ? 2 : r < RAREZA[2].p + RAREZA[1].p ? 1 : 0, hs = HAB[tipo];
    return { s: Math.floor(this.rng() * 1e9) + 1, r: rar, h: hs[Math.floor(this.rng() * hs.length)], act: 0, cd: 0 };
  }
  contratar(tipo, i) {
    const o = this.nivelDe(tipo, i);
    if (o.cap) return false;
    const c = this.costoCapataz(tipo, i);
    if (this.d.cash < c) return false;
    this.d.cash -= c;
    o.cap = this.nuevoCapataz(tipo);
    if (tipo === 'nivel') this.d.capG[i] = o.cap;
    return o.cap;
  }
  cambiarCapataz(tipo, i) {
    const o = this.nivelDe(tipo, i);
    o.cap = this.nuevoCapataz(tipo);
    if (tipo === 'nivel') this.d.capG[i] = o.cap;
    return o.cap;
  }
  usarHabilidad(tipo, i) {
    const c = this.capDe(tipo, i), t = this.ahora();
    if (!c || c.cd > t) return false;
    c.act = t + RAREZA[c.r].dur; c.cd = t + RAREZA[c.r].cd;
    return true;
  }
  capataces() {
    const l = [];
    this.d.niveles.forEach((n, i) => { if (n.cap) l.push(['nivel', i, n.cap]); });
    if (this.d.asc.cap) l.push(['asc', 0, this.d.asc.cap]);
    if (this.d.sup.cap) l.push(['sup', 0, this.d.sup.cap]);
    return l;
  }

  // ---- flujo ----
  tExt() { let s = 0; for (let i = 0; i < this.d.niveles.length; i++) s += this.prodNivel(i) * this.velNivelM(i); return s; }
  tAsc(n, L) {
    if (n == null) n = this.d.niveles.length;
    const v = this.velAsc(L) * this.velAscM(), cap = this.capAsc(L) * this.cargaAscM();
    return cap / (2 * n / v + 0.12 * n + 1.7);
  }
  tSup(L) { const v = this.velSup(L) * this.velSupM(); return this.capSup(L) * this.cargaSupM() / (2 / v + 1.0); }
  potencial(e, a, s) { const k = 4; return Math.pow(Math.pow(e, -k) + Math.pow(a, -k) + Math.pow(s, -k), -1 / k); }
  ingresoTeo() { return Math.min(this.tExt(), this.tAsc(), this.tSup()) * this.multValor(); }
  ingresoRef() { return Math.max(this.tasa, this.ingresoTeo() * 0.5, 2 * this.esc); }
  cuello() { const e = this.tExt(), a = this.tAsc(), s = this.tSup(), m = Math.min(e, a, s); if (m === e) return 'nivel'; return m === a ? 'asc' : 'sup'; }

  // ---- agentes ----
  nuevoMinero(j) { return { u: 0, est: 'quieto', t: 0, carga: 0, ves: j % CAMISAS.length, off: (j * 0.37) % 1, fase: j * 0.21 }; }
  armarAgentes() {
    this.ag = { niv: this.d.niveles.map(n => { const a = { min: [] }; for (let j = 0; j < minerosDe(n.L); j++) a.min.push(this.nuevoMinero(j)); return a; }), asc: { p: 0, est: 'quieto', t: 0, carga: 0, obj: 1, tomar: 0 }, sup: { carros: [] } };
  }
  tocarNivel(i) {
    if (!this.ag) this.armarAgentes();
    let ok = false;
    this.ag.niv[i].min.forEach((m, j) => { if (m.est === 'quieto') { m.est = 'espera'; m.t = j * 0.18; ok = true; } });
    return ok;
  }
  tocarAsc() { if (!this.ag) this.armarAgentes(); const s = this.ag.asc; if (s.est !== 'quieto') return false; s.obj = 1; s.est = 'baja'; return true; }
  tocarSup() {
    if (!this.ag) this.armarAgentes();
    let ok = false;
    this.ag.sup.carros.forEach((c, j) => { if (c.est === 'quieto') { c.est = 'espera'; c.t = j * 0.3; ok = true; } });
    return ok;
  }
  tocarTodo() { this.d.niveles.forEach((n, i) => { if (!n.cap) this.tocarNivel(i); }); if (!this.d.asc.cap) this.tocarAsc(); if (!this.d.sup.cap) this.tocarSup(); }
  paso(dt) {
    if (!this.ag) this.armarAgentes();
    for (let i = 0; i < this.d.niveles.length; i++) this.pasoNivel(i, dt);
    this.pasoAsc(dt); this.pasoSup(dt); this.pasoEventos(dt);
    this.tTasa += dt;
    if (this.tTasa >= 1) { const inst = this.ventas / this.tTasa; this.tasa = this.tasa ? this.tasa * 0.9 + inst * 0.1 : inst; this.ventas = 0; this.tTasa = 0; }
  }
  pasoNivel(i, dt) {
    const nv = this.d.niveles[i], a = this.ag.niv[i], auto = !!nv.cap, L = nv.L, sp = this.velNivelM(i);
    const v = this.velMin(L) * sp, n = minerosDe(L);
    while (a.min.length < n) a.min.push(this.nuevoMinero(a.min.length));
    for (const m of a.min) {
      m.fase += dt * sp;
      switch (m.est) {
        case 'quieto': if (auto) { m.est = 'espera'; m.t = m.off * 0.6; } break;
        case 'espera': m.t -= dt; if (m.t <= 0) { m.est = 'ida'; } break;
        case 'ida': m.u += v * dt; if (m.u >= 1) { m.u = 1; m.est = 'pica'; m.t = 1.1 / sp; m.fase = 0; } break;
        case 'pica': {
          m.t -= dt;
          if (Math.floor(m.fase * 2.6 + 0.25) > Math.floor((m.fase - dt * sp) * 2.6 + 0.25)) this.aviso('pica', i, m);
          if (m.t <= 0) { m.est = 'vuelta'; m.carga = this.prodNivel(i) * this.cicloMin(L) / n; this.hallazgo(i); }
          break;
        }
        case 'vuelta': m.u -= v * dt; if (m.u <= 0) { m.u = 0; m.est = 'deja'; m.t = 0.2 / sp; } break;
        case 'deja': m.t -= dt; if (m.t <= 0) { nv.caja += m.carga; m.carga = 0; m.est = auto ? 'ida' : 'quieto'; } break;
      }
    }
  }
  pasoAsc(dt) {
    const s = this.ag.asc, d = this.d, n = d.niveles.length, auto = !!d.asc.cap;
    const v = this.velAsc() * this.velAscM(), cap = this.capAsc() * this.cargaAscM();
    switch (s.est) {
      case 'quieto': if (auto) { s.obj = 1; s.est = 'baja'; } break;
      case 'baja':
        s.p += v * dt;
        if (s.p >= s.obj) { s.p = s.obj; s.est = 'carga'; const caja = d.niveles[s.obj - 1].caja; s.tomar = Math.min(caja, Math.max(0, cap - s.carga)); s.t = s.tomar > 0 ? 0.12 + s.tomar / cap * 0.8 : 0.06; }
        break;
      case 'carga':
        s.t -= dt;
        if (s.t <= 0) {
          const nv = d.niveles[s.obj - 1], x = Math.min(nv.caja, s.tomar);
          nv.caja -= x; s.carga += x;
          if (s.carga >= cap * 0.999 || s.obj >= n) s.est = 'sube'; else { s.obj++; s.est = 'baja'; }
        }
        break;
      case 'sube': s.p -= v * dt; if (s.p <= 0) { s.p = 0; s.est = 'descarga'; s.t = s.carga > 0 ? 0.1 + 0.6 * Math.min(1, s.carga / cap) : 0.05; } break;
      case 'descarga': s.t -= dt; if (s.t <= 0) { d.tolva += s.carga; if (s.carga > 0) this.aviso('descarga', s.carga); s.carga = 0; s.est = 'pausa'; s.t = 0.2; } break;
      case 'pausa': s.t -= dt; if (s.t <= 0) s.est = 'quieto'; break;
    }
  }
  pasoSup(dt) {
    const d = this.d, S = this.ag.sup, auto = !!d.sup.cap, n = carrosDe(d.sup.L);
    while (S.carros.length < n) S.carros.push({ s: 0, est: 'quieto', t: 0, carga: 0, fase: S.carros.length * 0.4 });
    const v = this.velSup() * this.velSupM(), capC = this.capSup() * this.cargaSupM() / n;
    for (let j = 0; j < S.carros.length; j++) {
      const c = S.carros[j];
      c.fase += dt;
      switch (c.est) {
        case 'quieto': if (auto && d.tolva > 0) { c.est = 'espera'; c.t = j * 0.3; } break;
        case 'espera': c.t -= dt; if (c.t <= 0) { c.est = 'carga'; c.t = 0.5; } break;
        case 'carga': c.t -= dt; if (c.t <= 0) { const x = Math.min(d.tolva, capC); d.tolva -= x; c.carga = x; c.est = x <= 0 && auto ? 'quieto' : 'ida'; } break;
        case 'ida': c.s += v * dt; if (c.s >= 1) { c.s = 1; c.est = 'descarga'; c.t = 0.5; } break;
        case 'descarga': c.t -= dt; if (c.t <= 0) { if (c.carga > 0) this.vender(c.carga, true); c.carga = 0; c.est = 'vuelta'; } break;
        case 'vuelta': c.s -= v * dt; if (c.s <= 0) { c.s = 0; c.est = 'quieto'; } break;
      }
    }
  }
  vender(x, ver) {
    const v = x * this.multValor();
    this.d.cash += v; this.d.total += v; this.d.hist += v; this.ventas += v;
    if (typeof G !== 'undefined' && G && !this.carrera) G.est.ganado += v;
    if (ver) this.aviso('venta', v);
    return v;
  }

  // ---- hallazgos y eventos ----
  hallazgo(i) { if (!this.carrera && this.rng() < 1 / 3000) { const j = this.encontrarMineral(i); if (j != null) this.aviso('mineral', j); } }
  encontrarMineral(i) {
    const cand = [];
    let tot = 0;
    for (let j = 0; j < 6; j++) if (!this.d.min[j] && nivelMineral(j) <= i) { cand.push(j); tot += PESO_MIN[j]; }
    if (!cand.length) return null;
    let r = this.rng() * tot;
    for (const j of cand) { r -= PESO_MIN[j]; if (r <= 0) { this.d.min[j] = 1; return j; } }
    const j = cand[cand.length - 1]; this.d.min[j] = 1; return j;
  }
  pasoEventos(dt) {
    const e = this.ev, n = this.d.niveles.length;
    if (e.condor) { e.condor.t += dt; if (e.condor.t > e.condor.dur) e.condor = null; }
    else if ((e.tC -= dt) <= 0) { e.condor = { t: 0, dur: 12, dir: this.rng() < 0.5 ? 1 : -1, y: this.rng() }; e.tC = this.mods.condores ? 16 : 140 + this.rng() * 90; }
    if (e.veta) { e.veta.t -= dt; if (e.veta.t <= 0 || e.veta.toques >= 15) e.veta = null; }
    else if ((e.tV -= dt) <= 0) { e.veta = { i: Math.floor(this.rng() * n), t: 20, toques: 0 }; e.tV = this.mods.vetas ? 20 : 100 + this.rng() * 80; }
    if (this.carrera) return;
    if (e.geoda) { e.geoda.t -= dt; if (e.geoda.t <= 0) e.geoda = null; }
    else if ((e.tG -= dt) <= 0) { e.geoda = { i: Math.floor(this.rng() * n), u: 0.3 + this.rng() * 0.45, golpes: 0, t: 60 }; e.tG = 160 + this.rng() * 120; }
  }
  tocarCondor() {
    if (!this.ev.condor) return null;
    this.ev.condor = null;
    const r = this.carrera ? 1 : this.rng();
    if (r < 0.1) return { tipo: 'pepitas', n: 2 + Math.floor(this.rng() * 4) };
    if (r < 0.3) return { tipo: 'boost', seg: 60 };
    const v = this.ingresoRef() * 120;
    this.d.cash += v; this.d.total += v; this.d.hist += v;
    return { tipo: 'cash', v };
  }
  tocarVeta() {
    const e = this.ev.veta;
    if (!e) return 0;
    e.toques++;
    const v = this.ingresoRef() * 3 * Math.pow(1.08, e.toques);
    this.d.cash += v; this.d.total += v; this.d.hist += v;
    return v;
  }
  golpearGeoda() {
    const e = this.ev.geoda;
    if (!e) return null;
    e.golpes++;
    if (e.golpes < 3) return { tipo: 'golpe' };
    this.ev.geoda = null;
    const r = this.rng();
    if (r < 0.4) { const j = this.encontrarMineral(this.d.niveles.length - 1); if (j != null) return { tipo: 'mineral', j }; }
    if (r < 0.75) return { tipo: 'pepitas', n: 1 + Math.floor(this.rng() * 3) };
    const v = this.ingresoRef() * 90;
    this.d.cash += v; this.d.total += v; this.d.hist += v;
    return { tipo: 'cash', v };
  }

  // ---- sin agentes (mientras no estás) ----
  analitico(dt) {
    const d = this.d;
    const antes = d.cash;
    d.niveles.forEach((nv, i) => { if (nv.cap) nv.caja += this.prodNivel(i) * dt; });
    if (d.asc.cap) {
      let tot = 0;
      for (const nv of d.niveles) tot += nv.caja;
      const mov = Math.min(tot, this.tAsc() * dt);
      if (tot > 0) { const f = mov / tot; for (const nv of d.niveles) nv.caja -= nv.caja * f; }
      d.tolva += mov;
    }
    if (d.sup.cap) { const v = Math.min(d.tolva, this.tSup() * dt); d.tolva -= v; this.vender(v); }
    return d.cash - antes;
  }

  // ---- refundar ----
  reqRefundar() { return Math.min(ECO.NIVELES, Math.max(8, (this.d.refN || 7) + 1)); }
  puedeRefundar() { return this.d.niveles.length >= this.reqRefundar(); }
  gananciaRefundar() { return 1 + Math.max(0, this.d.niveles.length - 4) / 4; }
  refundar() {
    const d = this.d;
    d.niveles.forEach((n, i) => { if (n.cap) d.capG[i] = n.cap; });
    d.mult = (d.mult || 1) * this.gananciaRefundar(); d.refN = d.niveles.length;
    d.ref++; d.cash = 0; d.total = 0; d.tolva = 0;
    d.niveles = [{ L: 1, caja: 0, cap: d.capG[0] || null }];
    d.asc.L = 1; d.sup.L = 1;
    this.ag = null; this.ev.veta = null; this.ev.geoda = null;
  }
}

// ---------- el bot: juega con las reglas de verdad ----------
function botCompra(m) {
  const d = m.d, n = d.niveles.length;
  for (let i = 0; i < n; i++) if (!d.niveles[i].cap && m.costoCapataz('nivel', i) <= d.cash * 0.6) { m.contratar('nivel', i); return 'cap'; }
  for (const t of ['asc', 'sup']) if (!d[t].cap && m.costoCapataz(t, 0) <= d.cash * 0.6) { m.contratar(t, 0); return 'cap'; }
  const e = m.tExt(), a = m.tAsc(), s = m.tSup(), P0 = m.potencial(e, a, s), cands = [];
  for (let i = 0; i < n; i++) {
    const L = d.niveles[i].L, c = m.costo('nivel', i, 1), dE = (m.prodNivel(i, L + 1) - m.prodNivel(i, L)) * m.velNivelM(i);
    cands.push({ t: 'nivel', i, c, r: (m.potencial(e + dE, a, s) - P0) / c });
  }
  { const c = m.costo('asc', 0, 1); cands.push({ t: 'asc', i: 0, c, r: (m.potencial(e, m.tAsc(n, d.asc.L + 1), s) - P0) / c }); }
  { const c = m.costo('sup', 0, 1); cands.push({ t: 'sup', i: 0, c, r: (m.potencial(e, a, m.tSup(d.sup.L + 1)) - P0) / c }); }
  if (n < ECO.NIVELES) {
    // abrir y desarrollar el nivel nuevo hasta donde está el anterior: el valor de verdad de abrir
    const c = m.costoAbrir(n), Lr = clamp(d.niveles[n - 1].L, 1, 120);
    const cUp = Lr > 1 ? ECO.cA * m.esc * Math.pow(ECO.RC, n) * (Math.pow(ECO.gL, Lr - 1) - 1) / (ECO.gL - 1) : 0;
    cands.push({ t: 'abrir', i: n, c, r: 1.5 * (m.potencial(e + m.prodNivel(n, Lr), m.tAsc(n + 1), s) - P0) / (c + cUp) });
  }
  cands.sort((x, y) => y.r - x.r);
  const best = cands[0];
  let elegido = best.c <= d.cash ? best : cands.find(x => x.c <= d.cash && x.r >= best.r * 0.5);
  if (!elegido) return null;
  if (elegido.t === 'abrir') m.abrir(); else m.comprar(elegido.t, elegido.i, 1);
  return elegido.t;
}
function botPaso(m, dt, conEventos) {
  m.tBot = (m.tBot || 0) - dt;
  if (m.tBot > 0) return null;
  m.tBot = 0.25;
  m.tocarTodo();
  for (const [t, i, c] of m.capataces()) if (c.cd <= m.ahora()) m.usarHabilidad(t, i);
  const premios = [];
  if (conEventos) {
    if (m.ev.condor && m.ev.condor.t > 1.5) premios.push(m.tocarCondor());
    if (m.ev.veta) { m.tocarVeta(); m.tocarVeta(); }
    if (m.ev.geoda) { const p = m.golpearGeoda(); if (p && p.tipo !== 'golpe') premios.push(p); }
  }
  for (let k = 0; k < 30; k++) if (!botCompra(m)) break;
  return premios;
}

// ---------- la Fiebre del Oro: 3 minutos, todo a mano, el mismo desafío para todos hoy ----------
const MODS_DIA = ['oroNivel', 'ascVeloz', 'condores', 'minerosRapidos', 'vetas', 'rebaja', 'arranque', 'capataces'];
function desafioDelDia(dia) {
  const r = rngSemilla(dia * 2654435761 >>> 0), l = MODS_DIA.slice(), elegidos = [];
  for (let k = 0; k < 2; k++) elegidos.push(l.splice(Math.floor(r() * l.length), 1)[0]);
  const mods = {}, info = [];
  for (const e of elegidos) {
    if (e === 'oroNivel') { mods.oroNivel = 1 + Math.floor(r() * 2); info.push(['modOro', mods.oroNivel + 1]); }
    if (e === 'ascVeloz') { mods.asc = 2; info.push(['modAsc']); }
    if (e === 'condores') { mods.condores = true; info.push(['modCondor']); }
    if (e === 'minerosRapidos') { mods.minero = 1.5; info.push(['modMinero']); }
    if (e === 'vetas') { mods.vetas = true; info.push(['modVetas']); }
    if (e === 'rebaja') { mods.rebaja = 0.6; info.push(['modRebaja']); }
    if (e === 'arranque') { mods.arranque = 300; info.push(['modArranque']); }
    if (e === 'capataces') { mods.capataces = 0.5; info.push(['modCapataces']); }
  }
  return { dia, mods, info, mina: Math.floor(r() * MINAS.length), semilla: (dia * 7919) >>> 0 };
}
function nuevaCarrera(des) {
  const C = { t: 0, dur: 180, des, fin: false };
  const d = Mina.nueva(des.semilla);
  d.cash = des.mods.arranque || 0;
  C.mina = new Mina(des.mina, d, { escala: 1, mods: des.mods, carrera: true, semilla: des.semilla, ahora: () => C.t });
  C.mina.ev.tC = des.mods.condores ? 12 : 60; C.mina.ev.tV = des.mods.vetas ? 15 : 45;
  return C;
}
// lo que saca el bot: la vara de las medallas
function parCarrera(des) {
  const C = nuevaCarrera(des), m = C.mina, dt = 1 / 30;
  while (C.t < C.dur) {
    C.t += dt;
    const ps = botPaso(m, dt, true);
    if (ps) for (const p of ps) if (p && p.tipo === 'boost') m.boostHasta = Math.max(m.boostHasta || 0, C.t) + p.seg;
    m.paso(dt);
  }
  return m.d.total;
}
