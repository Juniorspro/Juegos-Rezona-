// POTRERO — sonido sintetizado: cumbia en el menú (güiro, congas, bajo, teclado), guitarra y acordeón en la
// historieta, la hinchada (bombos, redoblante y trompetas) en la cancha, la tribuna que responde a la jugada y
// un relator que grita el gol con formantes. Patadas, piques, palos, red, barridas, silbatos.
const Sonido = {
  ctx: null, vMus: 0.7, vEf: 0.8, ks: new Map(), tema: -1, temaPed: -1, paso_: 0, prox: 0, ult: {}, callar: false, frase: null,
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
    this.amb = c.createGain(); this.amb.gain.value = 0; this.amb.connect(this.master);
    // reverberación de barrio (la caída cada 64 muestras)
    const len = Math.floor(c.sampleRate * 1.6), ir = c.createBuffer(2, len, c.sampleRate), env = new Float32Array((len >> 6) + 2);
    for (let j = 0; j < env.length; j++) env[j] = Math.pow(Math.max(0, 1 - j * 64 / len), 3);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) { const j = i >> 6; d[i] = (Math.random() * 2 - 1) * (env[j] + (env[j + 1] - env[j]) * (i & 63) / 64); } }
    this.rev = c.createConvolver(); this.rev.buffer = ir;
    const wet = c.createGain(); wet.gain.value = 0.26; this.rev.connect(wet); wet.connect(this.master);
    this.envio = c.createGain(); this.envio.gain.value = 1; this.envio.connect(this.rev);
    const n = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), nd = n.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    this.ruido = n;
    // la tribuna: tres ruidos filtrados que siempre suenan (murmullo, griterío, viento)
    const loop = (fc, q, tipo, dest) => { const s = c.createBufferSource(); s.buffer = n; s.loop = true; s.loopStart = Math.random(); const f = c.createBiquadFilter(); f.type = tipo; f.frequency.value = fc; f.Q.value = q; const g = c.createGain(); g.gain.value = 0; s.connect(f); f.connect(g); g.connect(dest || this.amb); s.start(0, Math.random() * 1.5); return { f, g }; };
    this.murmullo = loop(700, 0.7, 'bandpass'); this.grito = loop(1300, 1.1, 'bandpass'); this.viento = loop(420, 0.5, 'bandpass');
    this.volumen(this.vMus, this.vEf);
    this.prox = c.currentTime + 0.3; this.sonando = true;
    this.precalentar();
  },
  volumen(m, e) {
    this.vMus = m; this.vEf = e;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.mus.gain.setTargetAtTime(m * 1.3, t, 0.05); this.ef.gain.setTargetAtTime(e * 1.25, t, 0.05); this.amb.gain.setTargetAtTime(e * 0.9, t, 0.1);
  },
  pausar() { if (this.ctx && this.ctx.state === 'running') this.ctx.suspend(); },
  seguir() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
  ok() { return this.ctx && this.ctx.state === 'running'; },
  lim(k, s) { const t = performance.now(); if (this.ult[k] && t - this.ult[k] < s * 1000) return false; this.ult[k] = t; return true; },
  ahora() { return this.ctx.currentTime; },
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
  // ---- instrumentos (con tiempo absoluto del audio) ----
  bufKS(f, largo) {
    const key = Math.round(f * 4) + (largo ? 'L' : '');
    let b = this.ks.get(key);
    if (b) return b;
    const c = this.ctx, sr = c.sampleRate, N = Math.max(2, Math.round(sr / f)), len = Math.floor(sr * (largo ? 1.6 : 0.9)), buf = new Float32Array(N);
    b = c.createBuffer(1, len, sr);
    const d = b.getChannelData(0);
    for (let i = 0; i < N; i++) buf[i] = (Math.random() * 2 - 1) * (1 - i / N * 0.4);
    let p = 0, prev = 0;
    const amort = largo ? 0.997 : 0.994;
    for (let i = 0; i < len; i++) { const v = buf[p], nx = buf[(p + 1) % N]; buf[p] = (v + nx) * 0.5 * amort; d[i] = (v - prev * 0.2) * 0.8; prev = v; p = (p + 1) % N; }
    this.ks.set(key, b);
    return b;
  },
  // las cuerdas de la guitarra se arman de a tandas, sin trabar el cuadro
  precalentar() {
    const ctx = this.ctx, fs = [];
    for (const raiz of [110, 98, 87.31, 82.41, 130.81, 146.83]) for (const a of [0, 3, 4, 7, 10, 12, 15, 16, 19, 24]) fs.push(raiz * Math.pow(2, a / 12));
    const tanda = () => { if (this.ctx !== ctx) return; const t0 = performance.now(); while (fs.length && performance.now() - t0 < 4) this.bufKS(fs.shift(), true); if (fs.length) setTimeout(tanda, 0); };
    setTimeout(tanda, 0);
  },
  cuerda(t, f, vol, dest) { const c = this.ctx, s = c.createBufferSource(), g = c.createGain(); s.buffer = this.bufKS(f, true); g.gain.value = vol; s.connect(g); g.connect(dest || this.musT); g.connect(this.envio); s.start(t); s.stop(t + 1.6); },
  nota(t, f, dur, vol, tipo, fc, dest, vib) {
    const c = this.ctx, o = c.createOscillator(), fl = c.createBiquadFilter(), g = c.createGain();
    o.type = tipo || 'square'; o.frequency.setValueAtTime(f, t);
    if (vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = 5.5; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * vib, t + Math.min(0.25, dur * 0.6)); l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur + 0.1); }
    fl.type = 'lowpass'; fl.frequency.value = fc || 2400; fl.Q.value = 0.8;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.012); g.gain.setValueAtTime(vol * 0.8, t + Math.max(0.02, dur - 0.04)); g.gain.linearRampToValueAtTime(0, t + dur + 0.05);
    o.connect(fl); fl.connect(g); g.connect(dest || this.musT); o.start(t); o.stop(t + dur + 0.08);
    return g;
  },
  acordeon(t, f, dur, vol) {
    const c = this.ctx, fl = c.createBiquadFilter(), g = c.createGain();
    fl.type = 'lowpass'; fl.frequency.value = 1700; fl.Q.value = 1.2;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.07); g.gain.setValueAtTime(vol * 0.85, t + Math.max(0.08, dur - 0.08)); g.gain.linearRampToValueAtTime(0, t + dur + 0.1);
    for (const d of [0.997, 1.004]) { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f * d; o.connect(fl); o.start(t); o.stop(t + dur + 0.12); }
    fl.connect(g); g.connect(this.musT); g.connect(this.envio);
  },
  trompeta(t, f, dur, vol) {
    const c = this.ctx, o = c.createOscillator(), fl = c.createBiquadFilter(), g = c.createGain();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(f * 0.96, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.05);
    fl.type = 'lowpass'; fl.frequency.setValueAtTime(600, t); fl.frequency.linearRampToValueAtTime(2600, t + 0.06); fl.frequency.linearRampToValueAtTime(1600, t + dur); fl.Q.value = 1.5;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.03); g.gain.setValueAtTime(vol * 0.85, t + Math.max(0.04, dur - 0.04)); g.gain.linearRampToValueAtTime(0, t + dur + 0.04);
    o.connect(fl); fl.connect(g); g.connect(this.musT); g.connect(this.envio); o.start(t); o.stop(t + dur + 0.08);
  },
  bombo(t, vol, dest) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.22);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
    o.connect(g); g.connect(dest || this.musT); o.start(t); o.stop(t + 0.36);
    this.soplo(0.05, vol * 0.25, 'lowpass', 900, 0, t - this.ctx.currentTime, 1, dest || this.musT);
  },
  redo(t, vol, dest) { this.soplo(0.12, vol, 'bandpass', 2200, 1400, t - this.ctx.currentTime, 0.9, dest || this.musT); this.tono(210, 'triangle', 0.06, vol * 0.5, t - this.ctx.currentTime, dest || this.musT); },
  platillo(t, vol, dest) { this.soplo(0.5, vol, 'highpass', 6500, 4500, t - this.ctx.currentTime, 0.7, dest || this.musT); },
  guiro(t, largo, vol) { const dur = largo ? 0.13 : 0.045; this.soplo(dur, vol, 'bandpass', 3800, largo ? 5200 : 0, t - this.ctx.currentTime, 2.5); },
  conga(t, f, vol) { const c = this.ctx, o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f * 1.3, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.03); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22); o.connect(g); g.connect(this.musT); o.start(t); o.stop(t + 0.25); },
  bajo(t, f, dur, vol) { this.nota(t, f, dur, vol, 'triangle', 600); this.nota(t, f * 2, dur * 0.6, vol * 0.2, 'sine', 900); },
  // ---- música: 0 cumbia del menú · 1 historieta · 2 hinchada · 3 tensión (penales) ----
  musica(i) { if (this.temaPed === i && (this.tema === i || this.cambio)) return; this.temaPed = i; if (!this.ctx) { this.tema = i; return; } const t = this.ctx.currentTime; this.musT.gain.setTargetAtTime(0, t, 0.2); this.cambio = t + 0.6; },
  BPM: [100, 84, 124, 92],
  frasear(r, esc, n, largo) {
    // una frase pegadiza: dos compases que se repiten con la respuesta cambiada
    const notas = []; let g = 3;
    for (let c = 0; c < largo; c++) {
      const ritmos = [[2, 2, 1, 1, 2, 4, 4], [3, 3, 2, 2, 2, 4], [1, 1, 2, 2, 2, 2, 6], [4, 2, 2, 4, 4]];
      const ritmo = ritmos[Math.floor(r() * ritmos.length)];
      let pos = 0;
      for (const d of ritmo) {
        if (pos >= 16) break;
        g = clamp(g + Math.floor(r() * 5) - 2, 0, esc.length - 1);
        if (c === largo - 1 && pos + d >= 16) g = 0;
        notas.push({ p: c * 16 + pos, d: Math.min(d, 16 - pos), n: esc[g], sil: r() < 0.12 && pos > 0 });
        pos += d;
      }
    }
    return notas;
  },
  tic() {
    if (!this.sonando || !this.ok() || this.callar) return;
    const c = this.ctx;
    if (this.cambio && c.currentTime >= this.cambio) { this.cambio = 0; this.tema = this.temaPed; this.paso_ = 0; this.frase = null; this.prox = c.currentTime + 0.05; this.musT.gain.setTargetAtTime(1, c.currentTime, 0.15); }
    if (this.tema < 0) return;
    const sem = 60 / this.BPM[this.tema] / 4;
    if (this.prox < c.currentTime - 0.2) this.prox = c.currentTime + 0.05;
    while (this.prox < c.currentTime + 0.25) {
      const t = this.prox, p = this.paso_;
      if (this.tema === 0) this.pasoCumbia(t, p, sem);
      else if (this.tema === 1) this.pasoHistorieta(t, p, sem);
      else if (this.tema === 2) this.pasoHinchada(t, p, sem);
      else if (this.tema === 3) this.pasoTension(t, p, sem);
      this.prox += sem; this.paso_++;
    }
  },
  pasoCumbia(t, p, sem) {
    const s = p % 16, comp = Math.floor(p / 16) % 4, vuelta = Math.floor(p / 64);
    const prog = [0, -2, -4, -5], raiz = 110 * Math.pow(2, prog[comp] / 12), mayor = comp === 3;
    if (s === 0 && comp === 0) { const r = rngSemilla(vuelta % 4 + 11); if (!this.frase || vuelta % 4 === 0) this.frase = this.frasear(r, [0, 2, 3, 5, 7, 8, 10, 12, 14, 15], 0, 4); }
    this.guiro(t, s % 4 === 0, s % 4 === 0 ? 0.09 : 0.05);
    if (s === 4 || s === 12) this.redo(t, 0.07);
    if (s === 6 || s === 14) this.conga(t, 330, 0.16); if (s === 7 || s === 15) this.conga(t, 220, 0.14); if (s === 3 || s === 11) this.conga(t, 260, 0.08);
    if (s === 0 || s === 8) this.bombo(t, 0.32);
    if (s === 0) this.bajo(t, raiz, sem * 3.5, 0.2);
    if (s === 4) this.bajo(t, raiz * 1.5 / 2 * (mayor ? 1 : 1), sem * 3, 0.16);
    if (s === 8) this.bajo(t, raiz, sem * 3, 0.18);
    if (s === 12) this.bajo(t, raiz * 1.5 / 2, sem * 2, 0.14);
    if (s === 14 && comp === 3) this.bajo(t, raiz * 1.06, sem * 2, 0.12);
    // el "chucu" del teclado en los contratiempos
    if (s % 4 === 2) for (const a of [0, mayor ? 4 : 3, 7]) this.nota(t, raiz * 2 * Math.pow(2, a / 12), sem * 0.8, 0.025, 'sawtooth', 1800);
    if (this.frase && vuelta % 2 === 0 || this.frase && vuelta % 2 === 1 && comp < 2) for (const nt of this.frase) if (nt.p === (p % 64) && !nt.sil) {
      let n = nt.n; if (mayor && (n % 12 === 3)) n += 1;
      this.nota(t, 440 * Math.pow(2, n / 12), nt.d * sem * 0.9, 0.05, 'square', 2600, null, 0.012);
    }
  },
  pasoHistorieta(t, p, sem) {
    // 6/8 tranquilo: guitarra arpegiada y el acordeón que canta
    const s = p % 12, comp = Math.floor(p / 12) % 4, vuelta = Math.floor(p / 48);
    const prog = [0, 5, -2, 3], raiz = 98 * Math.pow(2, prog[comp] / 12), mayor = comp !== 0 && comp !== 2;
    const ac = mayor ? [0, 7, 12, 16, 19, 12] : [0, 7, 12, 15, 19, 12];
    if (s % 2 === 0) this.cuerda(t, raiz * Math.pow(2, ac[(s / 2) % 6] / 12), s === 0 ? 0.26 : 0.17);
    if (s === 0) this.bajo(t, raiz / 2, sem * 10, 0.12);
    if (s === 0 && comp === 0) { const r = rngSemilla(vuelta % 3 + 31); this.frase = this.frasear(r, [0, 2, 4, 7, 9, 12, 14, 16], 0, 3); }
    if (this.frase && vuelta % 3 !== 2) for (const nt of this.frase) if (nt.p === Math.floor((p % 48) * 16 / 12) && !nt.sil && (p % 48) * 16 % 12 === 0) this.acordeon(t, 196 * Math.pow(2, nt.n / 12), nt.d * sem * 0.75 * 1.2, 0.055);
  },
  pasoHinchada(t, p, sem) {
    const s = p % 16, comp = Math.floor(p / 16) % 4, vuelta = Math.floor(p / 64), v = this.hinchadaVol || 0.5;
    if (s === 0 || s === 8 || s === 14) this.bombo(t, 0.38 * v + 0.1);
    if (s === 4 || s === 12) { this.bombo(t, 0.2 * v); this.platillo(t, 0.05 * v); }
    if (comp === 3 && s >= 12) this.redo(t, 0.05 + (s - 12) * 0.015);
    if (s % 2 === 1 && comp % 2 === 0) this.redo(t, 0.025);
    if (s === 0 && comp === 0) { const r = rngSemilla(vuelta % 2 + 51); this.frase = this.frasear(r, [0, 2, 4, 5, 7, 9, 12], 0, 4); }
    if (this.frase && v > 0.45 && vuelta % 2 === 0) for (const nt of this.frase) if (nt.p === (p % 64) && !nt.sil) { const f = 349.23 * Math.pow(2, nt.n / 12); this.trompeta(t, f, nt.d * sem * 0.85, 0.045 * v); this.trompeta(t, f * 0.75, nt.d * sem * 0.85, 0.028 * v); }
  },
  pasoTension(t, p, sem) {
    const s = p % 16;
    if (s === 0 || s === 6 || s === 10) this.bombo(t, 0.3);
    if (s % 2 === 0) this.redo(t, 0.02 + (s / 16) * 0.03);
    if (s === 0 && p % 32 === 0) this.acordeon(t, 82.41 * (p % 64 === 0 ? 1 : 1.06), sem * 15, 0.05);
  },
  // ---- ambiente: la tribuna sigue la jugada (k de 0 a 1), más gente en el estadio ----
  ambiente(dt, k, gente, viento) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, g = gente == null ? 0.4 : gente;
    this.murmullo.g.gain.setTargetAtTime((0.03 + 0.1 * g) * (0.8 + 0.3 * Math.sin(t * 0.3)), t, 0.5);
    this.grito.g.gain.setTargetAtTime(g * k * 0.22, t, 0.25);
    this.grito.f.frequency.setTargetAtTime(900 + k * 700, t, 0.3);
    this.viento.g.gain.setTargetAtTime((viento || 0) * 0.16 + 0.015, t, 0.6);
    this.viento.f.frequency.setTargetAtTime(380 + Math.sin(t * 0.21) * 120 + (viento || 0) * 200, t, 0.6);
  },
  silencioAmb() { if (!this.ok()) return; const t = this.ctx.currentTime; for (const l of [this.murmullo, this.grito, this.viento]) l.g.gain.setTargetAtTime(0, t, 0.3); },
  // ---- efectos ----
  boton() { if (!this.ok()) return; this.tono(900, 'triangle', 0.05, 0.07); this.tono(1500, 'sine', 0.05, 0.04, 0.025); },
  telon() { if (!this.ok()) return; this.soplo(0.35, 0.08, 'bandpass', 500, 2400, 0, 1); },
  pagina() { if (!this.ok()) return; this.soplo(0.22, 0.12, 'bandpass', 1800, 600, 0, 0.8); this.soplo(0.08, 0.06, 'highpass', 4000, 0, 0.16, 1); },
  globo() { if (!this.ok() || !this.lim('globo', 0.05)) return; this.tono(520, 'sine', 0.09, 0.07, 0, null, 900); },
  silbato(n) {
    if (!this.ok()) return;
    const L = n === 3 ? [[0, 0.22], [0.32, 0.22], [0.64, 0.75]] : n === 2 ? [[0, 0.16], [0.24, 0.16]] : [[0, n === 1 ? 0.45 : 0.25]];
    for (const [d, dur] of L) {
      const c = this.ctx, t = c.currentTime + d, o = c.createOscillator(), g = c.createGain(), l = c.createOscillator(), lg = c.createGain();
      o.type = 'sine'; o.frequency.value = 2650; l.frequency.value = 34; lg.gain.value = 140; l.connect(lg); lg.connect(o.frequency);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.1, t + 0.015); g.gain.setValueAtTime(0.1, t + dur - 0.03); g.gain.linearRampToValueAtTime(0, t + dur);
      o.connect(g); g.connect(this.ef); o.start(t); l.start(t); o.stop(t + dur + 0.02); l.stop(t + dur + 0.02);
      this.soplo(dur, 0.035, 'bandpass', 2700, 0, d, 2);
    }
  },
  pase(f) { if (!this.ok() || !this.lim('pat', 0.04)) return; const v = 0.12 + (f || 0.5) * 0.12; this.tono(150, 'sine', 0.09, v, 0, null, 70); this.soplo(0.03, v * 0.5, 'bandpass', 1400, 0, 0, 1.2); },
  tiro(f) {
    if (!this.ok() || !this.lim('pat', 0.04)) return;
    const v = 0.2 + (f || 0.7) * 0.2;
    this.tono(170, 'sine', 0.16, v, 0, null, 48); this.soplo(0.05, v * 0.8, 'highpass', 2600, 0, 0, 0.8); this.soplo(0.4, v * 0.18, 'bandpass', 1800, 500, 0.03, 1.4);
  },
  rebote(v) { if (!this.ok() || v < 1.2 || !this.lim('reb', 0.06)) return; const k = clamp(v / 14, 0.05, 1); this.tono(120, 'sine', 0.08, 0.06 + k * 0.14, 0, null, 70); this.soplo(0.03, k * 0.06, 'lowpass', 1200, 0, 0, 1); },
  pared(v) { if (!this.ok() || v < 1.5 || !this.lim('pared', 0.06)) return; const k = clamp(v / 14, 0.05, 1); this.tono(95, 'sine', 0.12, 0.08 + k * 0.16, 0, null, 55); this.soplo(0.06, k * 0.1, 'bandpass', 700, 0, 0, 0.8); },
  poste() { if (!this.ok()) return; for (const [f, v, d] of [[523, 0.12, 1.1], [1243, 0.07, 0.8], [2011, 0.05, 0.6], [3150, 0.03, 0.4]]) this.tono(f, 'sine', d, v); this.soplo(0.05, 0.12, 'highpass', 3000, 0, 0, 1); },
  red() { if (!this.ok()) return; this.soplo(0.45, 0.2, 'bandpass', 900, 3200, 0, 0.7); this.soplo(0.25, 0.1, 'highpass', 5000, 0, 0.05, 0.8); },
  barrida() { if (!this.ok()) return; this.soplo(0.4, 0.14, 'lowpass', 1600, 400, 0, 0.7); },
  quite() { if (!this.ok()) return; this.tono(130, 'sine', 0.1, 0.18, 0, null, 60); this.soplo(0.06, 0.1, 'bandpass', 900, 0, 0, 1); },
  caida() { if (!this.ok()) return; this.tono(90, 'sine', 0.2, 0.18, 0, null, 45); this.soplo(0.2, 0.1, 'lowpass', 800, 200, 0.02, 1); },
  atajada() { if (!this.ok()) return; this.soplo(0.07, 0.24, 'bandpass', 1300, 0, 0, 1.2); this.tono(200, 'sine', 0.08, 0.12, 0, null, 90); },
  whoosh() { if (!this.ok()) return; this.soplo(0.35, 0.12, 'bandpass', 600, 3400, 0, 1.6); },
  cuenta(n) { if (!this.ok()) return; this.tono(n ? 660 : 1320, 'square', 0.1, 0.05); },
  uuh() {
    if (!this.ok()) return;
    const c = this.ctx, t = c.currentTime, fl = c.createBiquadFilter(), g = c.createGain(), s = c.createBufferSource();
    s.buffer = this.ruido; fl.type = 'bandpass'; fl.Q.value = 3; fl.frequency.setValueAtTime(500, t); fl.frequency.linearRampToValueAtTime(340, t + 1.1);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.35, t + 0.15); g.gain.linearRampToValueAtTime(0, t + 1.2);
    s.connect(fl); fl.connect(g); g.connect(this.amb); s.start(t, Math.random()); s.stop(t + 1.3);
  },
  aplausos(dur, vol) { if (!this.ok()) return; for (let k = 0; k < (dur || 1.5) * 26; k++) this.soplo(0.03, (vol || 0.06) * (0.5 + Math.random() * 0.6), 'bandpass', 1400 + Math.random() * 2400, 0, k / 26 + Math.random() * 0.03, 1.5, this.amb); },
  // el relator: G + OOOOO + L con formantes sobre una voz de diente de sierra
  relatoGol(dur) {
    if (!this.ok()) return;
    const c = this.ctx, t = c.currentTime + 0.05, D = dur || 2.4, voz = c.createOscillator(), vg = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
    voz.type = 'sawtooth'; voz.frequency.setValueAtTime(150, t); voz.frequency.linearRampToValueAtTime(205, t + 0.3); voz.frequency.setValueAtTime(205, t + D - 0.4); voz.frequency.linearRampToValueAtTime(165, t + D);
    lfo.frequency.value = 6.2; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(7, t + 0.8); lfo.connect(lg); lg.connect(voz.frequency);
    vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(0.5, t + 0.08); vg.gain.setValueAtTime(0.5, t + D - 0.25); vg.gain.linearRampToValueAtTime(0, t + D);
    voz.connect(vg);
    const salidaV = c.createGain(); salidaV.gain.value = 0.55; salidaV.connect(this.ef); salidaV.connect(this.envio);
    for (const [f0, f1, q, a] of [[520, 360, 8, 1], [880, 760, 9, 0.6], [2700, 2600, 10, 0.18]]) {
      const bp = c.createBiquadFilter(), ga = c.createGain();
      bp.type = 'bandpass'; bp.Q.value = q; bp.frequency.setValueAtTime(f0, t); bp.frequency.setValueAtTime(f0, t + D - 0.25); bp.frequency.linearRampToValueAtTime(f1, t + D);
      ga.gain.value = a; vg.connect(bp); bp.connect(ga); ga.connect(salidaV);
    }
    voz.start(t); lfo.start(t); voz.stop(t + D + 0.05); lfo.stop(t + D + 0.05);
    this.soplo(0.06, 0.15, 'lowpass', 900, 0, 0.04, 1);
  },
  gol(gente) {
    if (!this.ok()) return;
    this.red();
    const g = gente == null ? 0.5 : gente;
    this.soplo(3.2, 0.25 + g * 0.3, 'bandpass', 700, 1200, 0.05, 0.6, this.amb);
    this.soplo(3.4, 0.12 + g * 0.18, 'bandpass', 1800, 1400, 0.1, 0.8, this.amb);
    this.relatoGol(2.6);
    this.aplausos(2.5, 0.05 + g * 0.05);
    for (let k = 0; k < 3; k++) this.bombo(this.ctx.currentTime + 0.4 + k * 0.28, 0.35, this.ef);
  },
  golRival() { if (!this.ok()) return; this.red(); this.soplo(1.2, 0.1, 'bandpass', 600, 400, 0.05, 0.6, this.amb); this.tono(300, 'triangle', 0.5, 0.06, 0.2, null, 200); },
  especial() {
    if (!this.ok()) return;
    this.tono(70, 'sine', 1.2, 0.5, 0, null, 30); this.soplo(1.0, 0.3, 'lowpass', 3000, 120, 0, 0.8);
    this.platillo(this.ctx.currentTime, 0.12, this.ef);
    [0, 4, 7, 12].forEach((n, i) => this.tono(523.25 * Math.pow(2, n / 12), 'sawtooth', 0.25, 0.04, 0.05 + i * 0.05));
  },
  victoria() { if (!this.ok()) return; const t = this.ctx.currentTime + 0.05; [[60, 0, 0.16], [64, 0.16, 0.16], [67, 0.32, 0.16], [72, 0.48, 0.5], [67, 1.0, 0.16], [72, 1.16, 0.9]].forEach(([m, d, dur]) => { const f = 440 * Math.pow(2, (m - 69) / 12); this.trompeta(t + d, f, dur, 0.07); this.trompeta(t + d, f * 0.75, dur, 0.04); }); for (let k = 0; k < 4; k++) this.bombo(t + k * 0.32, 0.3); this.platillo(t + 1.16, 0.1); },
  derrota() { if (!this.ok()) return; const t = this.ctx.currentTime + 0.05; [[64, 0, 0.4], [63, 0.42, 0.4], [62, 0.84, 0.4], [61, 1.26, 1.1]].forEach(([m, d, dur]) => this.nota(t + d, 440 * Math.pow(2, (m - 69) / 12) / 2, dur, 0.07, 'sawtooth', 900, this.ef, 0.01)); },
  desbloqueo() { if (!this.ok()) return; [0, 4, 7, 12, 16].forEach((n, i) => this.tono(660 * Math.pow(2, n / 12), 'triangle', 0.4, 0.07, i * 0.06)); },
  perro() { if (!this.ok() || !this.lim('perro', 6)) return; for (let k = 0; k < 2; k++) { this.tono(520, 'sawtooth', 0.09, 0.05, k * 0.2, this.amb, 300); this.soplo(0.08, 0.05, 'bandpass', 900, 0, k * 0.2, 2, this.amb); } },
  tren(k) {
    if (!this.ok()) return;
    // bocina de dos notas y el traqueteo
    for (const f of [311, 392]) this.tono(f, 'sawtooth', 1.4, 0.035 * k, 0, this.amb);
    for (let i = 0; i < 24; i++) this.soplo(0.06, 0.06 * k, 'lowpass', 600, 0, 0.4 + i * 0.16, 1, this.amb);
  },
};
let VIBRAR = true;
function vibrar(ms) { if (!VIBRAR || !navigator.vibrate || (navigator.userActivation && !navigator.userActivation.hasBeenActive)) return; try { navigator.vibrate(ms); } catch (e) { } }
