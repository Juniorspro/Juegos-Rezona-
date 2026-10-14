// HOJALATA — sonido sintetizado: vals de cajita de música en el menú, la cajita lenta con glockenspiel en la
// historia, polka de organito (tuba, acordes, flautín de calíope y redoblante de lata) en la carrera y más
// apurada en la última vuelta. Ruidos de juguete: motor de cuerda que tictaquea con la velocidad, el trinquete
// de dar cuerda, resorte, chapa que choca, derrape, canicas, botones, pompas, silbato que cae, espantasuegras.
const Sonido = {
  ctx: null, vMus: 0.7, vEf: 0.8, tema: -1, temaPed: -1, paso_: 0, prox: 0, ult: {}, callar: false, frase: null, apuro: 1, semilla: 0,
  iniciar() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try { const C = window.AudioContext || window.webkitAudioContext; if (!C) return; this.ctx = new C(); } catch (e) { return; }
    this.armar();
  },
  armar() {
    const c = this.ctx, t = c.currentTime;
    this.master = c.createGain(); this.master.gain.setValueAtTime(0, t); this.master.gain.linearRampToValueAtTime(1.0, t + 0.4);
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -12; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2;
    this.master.connect(comp); comp.connect(c.destination);
    this.anal = c.createAnalyser(); this.anal.fftSize = 2048; comp.connect(this.anal);
    this.mus = c.createGain(); this.mus.gain.value = 0; this.mus.connect(this.master);
    this.musT = c.createGain(); this.musT.gain.value = 1; this.musT.connect(this.mus);
    this.ef = c.createGain(); this.ef.gain.value = 0; this.ef.connect(this.master);
    // una pieza chica (la reverberación armada de a 64 muestras)
    const len = Math.floor(c.sampleRate * 1.3), ir = c.createBuffer(2, len, c.sampleRate), env = new Float32Array((len >> 6) + 2);
    for (let j = 0; j < env.length; j++) env[j] = Math.pow(Math.max(0, 1 - j * 64 / len), 3.2);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) { const j = i >> 6; d[i] = (Math.random() * 2 - 1) * (env[j] + (env[j + 1] - env[j]) * (i & 63) / 64); } }
    this.rev = c.createConvolver(); this.rev.buffer = ir;
    const wet = c.createGain(); wet.gain.value = 0.3; this.rev.connect(wet); wet.connect(this.master);
    this.envio = c.createGain(); this.envio.gain.value = 1; this.envio.connect(this.rev);
    const n = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), nd = n.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    this.ruido = n;
    this.volumen(this.vMus, this.vEf);
    this.prox = c.currentTime + 0.3; this.sonando = true;
  },
  volumen(m, e) {
    this.vMus = m; this.vEf = e;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.mus.gain.setTargetAtTime(m * 1.2, t, 0.05); this.ef.gain.setTargetAtTime(e * 1.2, t, 0.05);
  },
  pausar() { if (this.ctx && this.ctx.state === 'running') this.ctx.suspend(); },
  seguir() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
  ok() { return this.ctx && this.ctx.state === 'running'; },
  lim(k, s) { const t = performance.now(); if (this.ult[k] && t - this.ult[k] < s * 1000) return false; this.ult[k] = t; return true; },
  tono(f, tipo, dur, vol, cuando, dest, f2, ataque) {
    const c = this.ctx, t = c.currentTime + (cuando || 0), o = c.createOscillator(), g = c.createGain();
    o.type = tipo; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + (ataque || 0.005)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || this.ef); o.start(t); o.stop(t + dur + 0.02);
    return g;
  },
  soplo(dur, vol, tipo, f0, f1, cuando, q, dest) {
    const c = this.ctx, t = c.currentTime + (cuando || 0), s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.ruido; fl.type = tipo; fl.frequency.setValueAtTime(f0, t); if (f1) fl.frequency.exponentialRampToValueAtTime(f1, t + dur); fl.Q.value = q || 1;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + Math.min(0.02, dur * 0.2)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(dest || this.ef); s.start(t, Math.random()); s.stop(t + dur + 0.02);
  },
  // ---- instrumentos (tiempo absoluto del audio) ----
  cajita(t, f, vol, dest) {
    const c = this.ctx, g = c.createGain(), o = c.createOscillator(), o2 = c.createOscillator(), g2 = c.createGain();
    o.type = 'sine'; o.frequency.value = f; o2.type = 'sine'; o2.frequency.value = f * 4.02;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
    g2.gain.setValueAtTime(vol * 0.35, t); g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    o.connect(g); o2.connect(g2); g2.connect(g); g.connect(dest || this.musT); g.connect(this.envio);
    o.start(t); o2.start(t); o.stop(t + 1.35); o2.stop(t + 0.15);
  },
  glock(t, f, vol) { const c = this.ctx; for (const [k, v, d] of [[1, 1, 0.9], [2.76, 0.35, 0.3], [5.4, 0.15, 0.12]]) { const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = f * k; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol * v, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g); g.connect(this.musT); g.connect(this.envio); o.start(t); o.stop(t + d + 0.02); } },
  flauta(t, f, dur, vol) {
    const c = this.ctx, o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(), l = c.createOscillator(), lg = c.createGain();
    o.type = 'triangle'; o.frequency.value = f; o2.type = 'square'; o2.frequency.value = f; const g2 = c.createGain(); g2.gain.value = 0.18;
    l.frequency.value = 6; lg.gain.value = f * 0.008; l.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.02); g.gain.setValueAtTime(vol * 0.85, t + Math.max(0.03, dur - 0.03)); g.gain.linearRampToValueAtTime(0, t + dur + 0.03);
    o.connect(g); o2.connect(g2); g2.connect(g); g.connect(this.musT); g.connect(this.envio);
    o.start(t); o2.start(t); l.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05); l.stop(t + dur + 0.05);
    this.soplo(Math.min(0.08, dur), vol * 0.25, 'bandpass', f * 2, 0, t - c.currentTime, 2, this.musT);
  },
  tuba(t, f, dur, vol) { const c = this.ctx, o = c.createOscillator(), fl = c.createBiquadFilter(), g = c.createGain(); o.type = 'sawtooth'; o.frequency.value = f; fl.type = 'lowpass'; fl.frequency.setValueAtTime(260, t); fl.frequency.linearRampToValueAtTime(700, t + 0.03); fl.frequency.linearRampToValueAtTime(320, t + dur); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.05); o.connect(fl); fl.connect(g); g.connect(this.musT); o.start(t); o.stop(t + dur + 0.08); },
  acorde(t, fs, dur, vol) { const c = this.ctx, fl = c.createBiquadFilter(), g = c.createGain(); fl.type = 'lowpass'; fl.frequency.value = 2200; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); for (const f of fs) { const o = c.createOscillator(); o.type = 'square'; o.frequency.value = f; o.connect(fl); o.start(t); o.stop(t + dur + 0.02); } fl.connect(g); g.connect(this.musT); },
  redo(t, vol) { this.soplo(0.09, vol, 'bandpass', 2600, 1600, t - this.ctx.currentTime, 0.9, this.musT); },
  bombo(t, vol) { const c = this.ctx, o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(50, t + 0.15); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25); o.connect(g); g.connect(this.musT); o.start(t); o.stop(t + 0.27); },
  platillo(t, vol) { this.soplo(0.35, vol, 'highpass', 7000, 5000, t - this.ctx.currentTime, 0.7, this.musT); },
  madera(t, vol) { this.tono(1250, 'sine', 0.05, vol, t - this.ctx.currentTime, this.musT, 900); },
  // ---- música: 0 vals de cajita · 1 cajita lenta (historia) · 2 polka de carrera · 3 resultado ----
  musica(i) { if (this.temaPed === i && (this.tema === i || this.cambio)) return; this.temaPed = i; if (!this.ctx) { this.tema = i; return; } const t = this.ctx.currentTime; this.musT.gain.setTargetAtTime(0, t, 0.15); this.cambio = t + 0.45; },
  BPM: [96, 80, 132, 112],
  frasear(r, esc, largo, pasosCompas) {
    const notas = []; let g = 2;
    const ritmos = pasosCompas === 6 ? [[2, 2, 2], [3, 1, 2], [1, 1, 2, 2], [4, 2], [2, 4]] : [[2, 2, 2, 2], [1, 1, 2, 2, 2], [3, 1, 2, 2], [2, 1, 1, 4], [4, 4]];
    for (let cp = 0; cp < largo; cp++) {
      const ritmo = ritmos[Math.floor(r() * ritmos.length)];
      let pos = 0;
      for (const d of ritmo) {
        g = clamp(g + Math.floor(r() * 5) - 2, 0, esc.length - 1);
        if (cp === largo - 1 && pos + d >= pasosCompas) g = 0;
        notas.push({ p: cp * pasosCompas + pos, d, n: esc[g], sil: r() < 0.08 && pos > 0 });
        pos += d;
      }
    }
    return notas;
  },
  tic() {
    if (!this.sonando || !this.ok() || this.callar) return;
    const c = this.ctx;
    if (this.cambio && c.currentTime >= this.cambio) { this.cambio = 0; this.tema = this.temaPed; this.paso_ = 0; this.frase = null; this.prox = c.currentTime + 0.05; this.musT.gain.setTargetAtTime(1, c.currentTime, 0.12); }
    if (this.tema < 0) return;
    const sem = 60 / (this.BPM[this.tema] * (this.tema === 2 ? this.apuro : 1)) / 2;
    if (this.prox < c.currentTime - 0.2) this.prox = c.currentTime + 0.05;
    while (this.prox < c.currentTime + 0.25) {
      const t = this.prox, p = this.paso_;
      if (this.tema === 0) this.pasoVals(t, p, sem, false);
      else if (this.tema === 1) this.pasoVals(t, p, sem, true);
      else if (this.tema === 2) this.pasoPolka(t, p, sem);
      else if (this.tema === 3) this.pasoFiesta(t, p, sem);
      this.prox += sem; this.paso_++;
    }
  },
  // vals 3/4 en corcheas (6 por compás): bajo en el 1, acorde en 2 y 3, melodía de cajita
  pasoVals(t, p, sem, lento) {
    const s = p % 6, comp = Math.floor(p / 6) % 8, vuelta = Math.floor(p / 48);
    const prog = lento ? [0, 5, 3, 4, 0, 5, 1, 4] : [0, 4, 5, 3, 0, 4, 3, 4], grados = [0, 2, 4, 5, 7, 9, 11], raiz = 261.63 * Math.pow(2, grados[prog[comp]] / 12) / 2;
    const menor = [1, 2, 5].includes(prog[comp]), terc = menor ? 3 : 4;
    if (s === 0 && comp === 0) { const r = rngSemilla(vuelta % 3 + (lento ? 71 : 61)); this.frase = this.frasear(r, [0, 2, 4, 5, 7, 9, 11, 12, 14, 16], 4, 6); }
    if (s === 0) this.cajita(t, raiz / 2, 0.11);
    if (s === 2 || s === 4) for (const a of [0, terc, 7]) this.cajita(t, raiz * Math.pow(2, a / 12), 0.03);
    if (this.frase) for (const nt of this.frase) if (nt.p === (p % 24) && !nt.sil) { const f = 523.25 * Math.pow(2, nt.n / 12) * (comp >= 4 && !lento ? 1 : 1); this.cajita(t, f, 0.075); if (lento && vuelta % 2) this.glock(t, f * 2, 0.025); }
    if (lento && s === 0 && comp % 2 === 0) this.glock(t, raiz * 4, 0.02);
  },
  // polka 2/4 en corcheas (4 por compás): tuba en 1 y 3, acorde en los contratiempos, flautín y redoblante
  pasoPolka(t, p, sem) {
    const s = p % 4, comp = Math.floor(p / 4) % 8, vuelta = Math.floor(p / 32);
    const prog = [0, 0, 4, 4, 0, 0, 4, 0], grados = [0, 2, 4, 5, 7, 9, 11], tono = [0, 5, 2, 7, 3, 9][this.semilla % 6], raiz = 196 * Math.pow(2, (grados[prog[comp]] + tono) / 12) / 2;
    if (s === 0 && comp === 0) { const r = rngSemilla((vuelta % 2) + 91 + this.semilla * 7); this.frase = this.frasear(r, [0, 2, 4, 5, 7, 9, 11, 12, 14], 8, 4); }
    if (s === 0) this.tuba(t, raiz, sem * 0.9, 0.22);
    if (s === 2) this.tuba(t, raiz * 1.5, sem * 0.9, 0.17);
    if (s === 1 || s === 3) { this.acorde(t, [raiz * 4, raiz * 5, raiz * 6], sem * 0.6, 0.028); this.redo(t, 0.05); }
    if (s === 0) this.bombo(t, 0.2);
    if (comp === 7 && s >= 2) this.redo(t, 0.07);
    if (s === 0 && comp === 0 && vuelta % 2 === 0) this.platillo(t, 0.05);
    if (this.frase) for (const nt of this.frase) if (nt.p === (p % 32) && !nt.sil) this.flauta(t, 392 * Math.pow(2, (nt.n + tono) / 12), nt.d * sem * 0.85, 0.06);
    if (vuelta % 2 === 1 && s === 1) this.glock(t, raiz * 8, 0.015);
  },
  pasoFiesta(t, p, sem) {
    const s = p % 4, comp = Math.floor(p / 4) % 4, raiz = 261.63 * [1, 1.335, 1.5, 1][comp] / 2;
    if (s === 0) this.tuba(t, raiz, sem, 0.18);
    if (s === 2) this.tuba(t, raiz * 1.5, sem, 0.14);
    if (s % 2 === 1) this.acorde(t, [raiz * 4, raiz * 5, raiz * 6], sem * 0.5, 0.025);
    this.cajita(t, raiz * 4 * Math.pow(2, [0, 4, 7, 12][s] / 12), 0.05);
  },
  // ---- el motor de cuerda del jugador (siempre prendido durante la carrera) ----
  motor(on) {
    if (!this.ok()) return;
    const c = this.ctx, t = c.currentTime;
    if (on && !this.mot) {
      const o = c.createOscillator(), fl = c.createBiquadFilter(), g = c.createGain(), am = c.createGain(), l = c.createOscillator(), lg = c.createGain(), wh = c.createOscillator(), wg = c.createGain();
      o.type = 'sawtooth'; o.frequency.value = 70; fl.type = 'bandpass'; fl.frequency.value = 900; fl.Q.value = 1.4;
      l.type = 'square'; l.frequency.value = 10; lg.gain.value = 0.45; am.gain.value = 0.55; l.connect(lg); lg.connect(am.gain);
      wh.type = 'sine'; wh.frequency.value = 900; wg.gain.value = 0;
      o.connect(fl); fl.connect(am); am.connect(g); wh.connect(wg); wg.connect(g); g.gain.value = 0; g.connect(this.ef);
      o.start(); l.start(); wh.start();
      this.mot = { o, fl, g, l, wh, wg };
      g.gain.setTargetAtTime(0.09, t, 0.1);
    } else if (!on && this.mot) { const m = this.mot; m.g.gain.setTargetAtTime(0, t, 0.08); setTimeout(() => { try { m.o.stop(); m.l.stop(); m.wh.stop(); } catch (e) { } }, 400); this.mot = null; }
    if (this.der) { if (!on) this.derrape(false); }
  },
  motorSet(v, turbo, aire) {
    const m = this.mot; if (!m || !this.ok()) return;
    const t = this.ctx.currentTime, k = clamp(v / 14, 0, 1.4);
    m.o.frequency.setTargetAtTime(55 + k * 70 + (turbo ? 30 : 0), t, 0.05); m.fl.frequency.setTargetAtTime(500 + k * 1100 + (aire ? 400 : 0), t, 0.05);
    m.l.frequency.setTargetAtTime(6 + k * 16, t, 0.05); m.wh.frequency.setTargetAtTime(700 + k * 900 + (turbo ? 500 : 0), t, 0.05);
    m.wg.gain.setTargetAtTime(turbo ? 0.05 : 0.008 * k, t, 0.06); m.g.gain.setTargetAtTime(0.06 + k * 0.05, t, 0.08);
  },
  derrape(on, nivel) {
    if (!this.ok()) return;
    const c = this.ctx, t = c.currentTime;
    if (on && !this.der) { const s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain(); s.buffer = this.ruido; s.loop = true; fl.type = 'bandpass'; fl.frequency.value = 2400; fl.Q.value = 3; g.gain.value = 0; s.connect(fl); fl.connect(g); g.connect(this.ef); s.start(0, Math.random()); g.gain.setTargetAtTime(0.06, t, 0.03); this.der = { s, fl, g }; }
    else if (!on && this.der) { const d = this.der; d.g.gain.setTargetAtTime(0, t, 0.04); setTimeout(() => { try { d.s.stop(); } catch (e) { } }, 300); this.der = null; }
    if (this.der && nivel != null) this.der.fl.frequency.setTargetAtTime(2400 + nivel * 700, t, 0.05);
  },
  // ---- efectos ----
  boton() { if (!this.ok()) return; this.tono(1700, 'triangle', 0.04, 0.06); this.tono(2600, 'sine', 0.05, 0.035, 0.012); },
  persiana() { if (!this.ok()) return; for (let k = 0; k < 9; k++) this.soplo(0.05, 0.05, 'bandpass', 1400 + k * 60, 0, k * 0.035, 2.5); this.tono(80, 'sine', 0.35, 0.08, 0, null, 60); },
  pagina() { if (!this.ok()) return; this.tono(880, 'sine', 0.1, 0.05, 0, null, 1320); },
  globo() { if (!this.ok() || !this.lim('globo', 0.04)) return; this.tono(1300 + Math.random() * 300, 'triangle', 0.035, 0.035); },
  cuerda() { if (!this.ok()) return; for (let k = 0; k < 3; k++) this.soplo(0.025, 0.09, 'highpass', 3200, 0, k * 0.03, 2); this.tono(2200, 'square', 0.02, 0.02); },
  cuenta(n) { if (!this.ok()) return; const t = this.ctx.currentTime; if (n) { this.cajita(t, 784, 0.18, this.ef); this.cajita(t, 1568, 0.06, this.ef); } else { [1046.5, 1318.5, 1568].forEach((f, i) => this.cajita(t + i * 0.02, f, 0.16, this.ef)); this.platillo(t, 0.12); } },
  turbo() { if (!this.ok()) return; this.soplo(0.5, 0.16, 'bandpass', 500, 3000, 0, 1.2); this.tono(300, 'sawtooth', 0.4, 0.04, 0, null, 900); },
  turboCuerda() { if (!this.ok()) return; for (let k = 0; k < 8; k++) this.soplo(0.02, 0.06, 'highpass', 3000, 0, k * 0.02, 2); this.tono(200, 'sawtooth', 0.7, 0.06, 0.15, null, 1200); this.soplo(0.7, 0.14, 'bandpass', 600, 3500, 0.15, 1.2); },
  nivelDerrape(n) { if (!this.ok()) return; this.tono(n === 2 ? 1760 : 1320, 'triangle', 0.18, 0.05); this.tono(n === 2 ? 2640 : 1980, 'sine', 0.15, 0.025, 0.04); },
  salto(k) { if (!this.ok() || !this.lim('salto', 0.15)) return; this.tono(400, 'sine', 0.25 * (k || 1), 0.07, 0, null, 900); },
  aterrizaje(k) { if (!this.ok() || !this.lim('ater', 0.2)) return; this.clank(clamp(k, 0.2, 1) * 0.6); },
  clank(k) { for (const [f, v, d] of [[380, 1, 0.35], [912, 0.6, 0.25], [1430, 0.45, 0.18], [2210, 0.3, 0.12], [3150, 0.2, 0.08]]) this.tono(f * (0.95 + Math.random() * 0.1), 'sine', d, v * 0.09 * k); this.soplo(0.05, 0.1 * k, 'highpass', 2500, 0, 0, 1); },
  choque(k) { if (!this.ok() || !this.lim('choque', 0.08)) return; this.clank(clamp(k, 0.15, 1)); },
  golpe(k) { if (!this.ok()) return; const v = k || 1; this.clank(0.8 * v); this.tono(900, 'sine', 0.6, 0.07 * v, 0.05, null, 250); for (let i = 0; i < 4; i++) this.tono(500 + i * 120, 'triangle', 0.08, 0.03 * v, 0.1 + i * 0.07); },
  caida() { if (!this.ok()) return; this.tono(1400, 'sine', 0.8, 0.08, 0, null, 220); this.soplo(0.4, 0.08, 'lowpass', 1200, 300, 0.7, 1); for (let k = 0; k < 10; k++) this.soplo(0.03, 0.05, 'highpass', 3000, 0, 0.9 + k * 0.06, 2); },
  cajitaSorpresa() { if (!this.ok()) return; this.soplo(0.12, 0.12, 'bandpass', 2600, 900, 0, 1); this.tono(660, 'triangle', 0.08, 0.06, 0.02, null, 1320); },
  ruleta() { if (!this.ok()) return; this.tono(2400, 'square', 0.015, 0.02); },
  itemListo() { if (!this.ok()) return; this.tono(1568, 'triangle', 0.25, 0.06); this.tono(2093, 'sine', 0.3, 0.04, 0.06); },
  tornillo() { if (!this.ok() || !this.lim('torn', 0.05)) return; this.tono(2637, 'sine', 0.18, 0.06); this.tono(3951, 'sine', 0.12, 0.035, 0.03); },
  canica() { if (!this.ok()) return; this.tono(3000, 'sine', 0.08, 0.06, 0, null, 1800); this.soplo(0.5, 0.05, 'bandpass', 1800, 1500, 0.03, 4); },
  botonCae() { if (!this.ok()) return; this.tono(700, 'square', 0.04, 0.05, 0, null, 400); },
  resorte() { if (!this.ok()) return; const c = this.ctx, t = c.currentTime, o = c.createOscillator(), g = c.createGain(), l = c.createOscillator(), lg = c.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(180, t); o.frequency.exponentialRampToValueAtTime(520, t + 0.5); l.frequency.value = 18; lg.gain.value = 60; l.connect(lg); lg.connect(o.frequency); g.gain.setValueAtTime(0.1, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6); o.connect(g); g.connect(this.ef); o.start(t); l.start(t); o.stop(t + 0.62); l.stop(t + 0.62); },
  pompaSale() { if (!this.ok()) return; this.tono(300, 'sine', 0.3, 0.08, 0, null, 900); this.tono(600, 'sine', 0.25, 0.04, 0.08, null, 1500); },
  pompa() { if (!this.ok()) return; this.tono(1800, 'sine', 0.06, 0.08, 0, null, 2800); this.soplo(0.05, 0.08, 'highpass', 4000, 0, 0, 1); },
  vuelta() { if (!this.ok()) return; const t = this.ctx.currentTime; this.cajita(t, 1046.5, 0.12, this.ef); this.cajita(t + 0.12, 1568, 0.12, this.ef); },
  ultimaVuelta() { if (!this.ok()) return; const t = this.ctx.currentTime; [[523.25, 0], [659.25, 0.1], [783.99, 0.2], [1046.5, 0.3]].forEach(([f, d]) => this.flautaEf(t + d, f, 0.12)); this.apuro = 1.12; },
  flautaEf(t, f, dur) { const c = this.ctx, o = c.createOscillator(), g = c.createGain(); o.type = 'square'; o.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.05, t + 0.01); g.gain.linearRampToValueAtTime(0, t + dur); const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 2400; o.connect(fl); fl.connect(g); g.connect(this.ef); o.start(t); o.stop(t + dur + 0.02); },
  pasar() { if (!this.ok() || !this.lim('pasar', 0.6)) return; this.tono(1175, 'triangle', 0.1, 0.04); this.tono(1568, 'triangle', 0.12, 0.04, 0.07); },
  // el espantasuegras de la meta y la fanfarria de juguete
  meta() {
    if (!this.ok()) return;
    const c = this.ctx, t = c.currentTime;
    for (let k = 0; k < 3; k++) { const o = c.createOscillator(), g = c.createGain(), fl = c.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.setValueAtTime(380, t + k * 0.35); o.frequency.linearRampToValueAtTime(520, t + k * 0.35 + 0.3); fl.type = 'bandpass'; fl.frequency.value = 1400; fl.Q.value = 2; g.gain.setValueAtTime(0, t + k * 0.35); g.gain.linearRampToValueAtTime(0.07, t + k * 0.35 + 0.03); g.gain.linearRampToValueAtTime(0, t + k * 0.35 + 0.32); o.connect(fl); fl.connect(g); g.connect(this.ef); o.start(t + k * 0.35); o.stop(t + k * 0.35 + 0.34); }
    [[523.25, 1.1, 0.14], [659.25, 1.25, 0.14], [783.99, 1.4, 0.14], [1046.5, 1.55, 0.5]].forEach(([f, d, dur]) => this.flautaEf(t + d, f, dur));
    for (let k = 0; k < 12; k++) this.soplo(0.05, 0.05, 'highpass', 5000, 0, 1.1 + k * 0.05, 1);
    this.apuro = 1;
  },
  victoria() { if (!this.ok()) return; const t = this.ctx.currentTime + 0.05; [0, 4, 7, 12, 16, 12, 16, 19, 24].forEach((n, i) => this.cajita(t + i * 0.11, 523.25 * Math.pow(2, n / 12), 0.12, this.ef)); this.platillo(t + 0.9, 0.1); },
  derrota() { if (!this.ok()) return; const t = this.ctx.currentTime + 0.05; [7, 5, 4, 0].forEach((n, i) => this.cajita(t + i * 0.3, 392 * Math.pow(2, n / 12), 0.12, this.ef)); },
  desbloqueo() { if (!this.ok()) return; [0, 4, 7, 12, 16].forEach((n, i) => this.tono(880 * Math.pow(2, n / 12), 'triangle', 0.4, 0.06, i * 0.06)); },
};
let VIBRAR = true;
function vibrar(ms) { if (!VIBRAR || !navigator.vibrate || (navigator.userActivation && !navigator.userActivation.hasBeenActive)) return; try { navigator.vibrate(ms); } catch (e) { } }
