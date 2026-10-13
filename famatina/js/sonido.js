// FAMATINA — sonido sintetizado: efectos y un huayno con charango, quena y bombo legüero
const Sonido = {
  ctx: null, vMus: 0.7, vEf: 0.8, ult: {}, ks: new Map(), mina: 0, paso: 0, prox: 0, frase: null, sonando: false,
  iniciar() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try { const C = window.AudioContext || window.webkitAudioContext; if (!C) return; this.ctx = new C(); } catch (e) { return; }
    this.armar();
  },
  armar() {
    const c = this.ctx, t = c.currentTime;
    this.master = c.createGain(); this.master.gain.setValueAtTime(0, t); this.master.gain.linearRampToValueAtTime(0.9, t + 0.4);
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 4; comp.knee.value = 8; comp.attack.value = 0.004; comp.release.value = 0.2;
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 22;
    this.master.connect(comp); comp.connect(hp); hp.connect(c.destination);
    this.mus = c.createGain(); this.mus.gain.value = 0; this.mus.connect(this.master);
    this.ef = c.createGain(); this.ef.gain.value = 0; this.ef.connect(this.master);
    const len = Math.floor(c.sampleRate * 2.6), ir = c.createBuffer(2, len, c.sampleRate);
    // la caída se calcula cada 64 muestras y se interpola (Math.pow por muestra trababa el primer toque)
    const env = new Float32Array((len >> 6) + 2);
    for (let j = 0; j < env.length; j++) env[j] = Math.pow(Math.max(0, 1 - j * 64 / len), 3.2);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) { const j = i >> 6, e = env[j] + (env[j + 1] - env[j]) * (i & 63) / 64; d[i] = (Math.random() * 2 - 1) * e; } }
    this.rev = c.createConvolver(); this.rev.buffer = ir;
    const wet = c.createGain(); wet.gain.value = 0.28; this.rev.connect(wet); wet.connect(this.master);
    this.envioRev = c.createGain(); this.envioRev.gain.value = 1; this.envioRev.connect(this.rev);
    const n = c.createBuffer(1, c.sampleRate, c.sampleRate), nd = n.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    this.ruidoBuf = n;
    this.volumen(this.vMus, this.vEf);
    this.prox = c.currentTime + 0.3;
    this.sonando = true;
    this.precalentar();
  },
  // las cuerdas del charango de la mina se arman de a poco fuera del cuadro (armarlas al sonar el acorde trababa)
  precalentar() {
    const ctx = this.ctx, mina = this.mina, fs = [];
    if (!ctx) return;
    for (const [gr, tipo] of [[0, 'm'], [3, 'M'], [-2, 'M'], [-5, 'm']]) {
      const raiz = this.raiz() * Math.pow(2, gr / 12) / 2;
      for (const a of tipo === 'm' ? [0, 7, 12, 15, 19] : [0, 7, 12, 16, 19]) fs.push(raiz * 2 * Math.pow(2, a / 12));
      fs.push(raiz);
    }
    const tanda = () => {
      if (this.ctx !== ctx || this.mina !== mina) return;
      const t0 = performance.now();
      while (fs.length && performance.now() - t0 < 4) this.bufKS(fs.shift());
      if (fs.length) setTimeout(tanda, 0);
    };
    setTimeout(tanda, 0);
  },
  volumen(m, e) {
    this.vMus = m; this.vEf = e;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.mus.gain.setTargetAtTime(m * 0.42, t, 0.05); this.ef.gain.setTargetAtTime(e * 0.7, t, 0.05);
  },
  pausar() { if (this.ctx && this.ctx.state === 'running') this.ctx.suspend(); },
  seguir() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
  limitar(k, s) { const t = performance.now(); if (this.ult[k] && t - this.ult[k] < s * 1000) return false; this.ult[k] = t; return true; },
  ok() { return this.ctx && this.ctx.state === 'running'; },
  tono(f, tipo, dur, vol, cuando, dest, glide, ataque) {
    const c = this.ctx, t = c.currentTime + (cuando || 0), o = c.createOscillator(), g = c.createGain();
    o.type = tipo; o.frequency.setValueAtTime(f, t);
    if (glide) o.frequency.exponentialRampToValueAtTime(glide, t + dur);
    const a = ataque || 0.005;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dur);
    o.connect(g); g.connect(dest || this.ef);
    o.start(t); o.stop(t + a + dur + 0.05);
    return g;
  },
  ruido(dur, vol, tipo, f, q, cuando, dest, fFin) {
    const c = this.ctx, t = c.currentTime + (cuando || 0), s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.ruidoBuf; s.loop = true;
    fl.type = tipo; fl.frequency.setValueAtTime(f, t); fl.Q.value = q || 1;
    if (fFin) fl.frequency.exponentialRampToValueAtTime(fFin, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(dest || this.ef);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  },
  // ---- efectos ----
  pico(dist) {
    if (!this.ok() || !this.limitar('pico', 0.07)) return;
    const v = 0.11 * (dist || 1), f = 2100 * (0.9 + Math.random() * 0.2);
    this.tono(f, 'sine', 0.07, v); this.tono(f * 1.51, 'sine', 0.05, v * 0.6); this.ruido(0.03, v * 0.8, 'highpass', 3000);
  },
  moneda(k) {
    if (!this.ok() || !this.limitar('moneda', 0.06)) return;
    const f = 988 * Math.pow(2, Math.min(k || 0, 12) / 12);
    this.tono(f, 'square', 0.06, 0.05); this.tono(f * 1.335, 'square', 0.12, 0.05, 0.06);
  },
  campana() { if (!this.ok() || !this.limitar('campana', 0.3)) return; this.tono(880, 'sine', 0.7, 0.12); this.tono(1760, 'sine', 0.4, 0.05); this.tono(2640, 'sine', 0.2, 0.03); },
  jaula() { if (!this.ok() || !this.limitar('jaula', 0.25)) return; this.ruido(0.12, 0.12, 'lowpass', 500); this.tono(160, 'triangle', 0.08, 0.08); },
  boton() { if (!this.ok()) return; this.tono(420, 'sine', 0.05, 0.12, 0, null, 220); this.ruido(0.02, 0.06, 'bandpass', 1800, 2); },
  error() { if (!this.ok()) return; this.tono(140, 'square', 0.14, 0.06, 0, null, 100); },
  mejora(k) {
    if (!this.ok()) return;
    const esc = [0, 3, 5, 7, 10, 12, 15, 17, 19, 22, 24], n = esc[Math.min(k || 0, esc.length - 1)];
    const f = 440 * Math.pow(2, n / 12);
    this.tono(f, 'triangle', 0.12, 0.1); this.tono(f * 2, 'sine', 0.1, 0.04, 0.03);
  },
  hito() {
    if (!this.ok()) return;
    [0, 4, 7, 12].forEach((n, i) => this.tono(523 * Math.pow(2, n / 12), 'triangle', 0.35, 0.09, i * 0.07, this.envioRev));
    [0, 4, 7, 12].forEach((n, i) => this.tono(523 * Math.pow(2, n / 12), 'square', 0.2, 0.03, i * 0.07));
  },
  explosion() {
    if (!this.ok()) return;
    this.ruido(0.9, 0.5, 'lowpass', 2400, 0.7, 0, null, 80); this.tono(90, 'sine', 0.6, 0.45, 0, null, 30);
    this.ruido(1.4, 0.12, 'bandpass', 600, 0.8, 0.1, this.envioRev, 150);
  },
  condor() { if (!this.ok()) return; this.tono(1300, 'sawtooth', 0.45, 0.04, 0, null, 700); this.tono(1500, 'sine', 0.35, 0.05, 0.05, this.envioRev, 900); },
  gema() { if (!this.ok()) return; [0, 7, 12, 16, 19, 24].forEach((n, i) => this.tono(1047 * Math.pow(2, n / 12), 'sine', 0.3, 0.07, i * 0.05, this.envioRev)); },
  geoda() { if (!this.ok()) return; this.ruido(0.08, 0.25, 'highpass', 1500); this.tono(300, 'square', 0.05, 0.08, 0, null, 120); },
  veta(k) { if (!this.ok()) return; this.tono(1568 * Math.pow(2, Math.min(k, 14) / 24), 'triangle', 0.1, 0.09); this.ruido(0.04, 0.1, 'highpass', 4000); this.moneda(k); },
  telon() { if (!this.ok()) return; this.ruido(0.18, 0.18, 'bandpass', 900, 3); this.tono(220, 'square', 0.1, 0.05, 0, null, 180); this.tono(320, 'square', 0.08, 0.04, 0.08, null, 260); },
  ofrenda() {
    if (!this.ok()) return;
    [0, 3, 7, 10, 12, 15].forEach((n, i) => this.pulso(this.raiz() * 2 * Math.pow(2, n / 12), 0.12, i * 0.04));
    [0, 7, 12].forEach((n, i) => this.tono(1319 * Math.pow(2, n / 12), 'sine', 0.6, 0.05, 0.3 + i * 0.12, this.envioRev));
  },
  nivelNuevo() { if (!this.ok()) return; this.explosion(); [0, 4, 7, 11, 14].forEach((n, i) => this.tono(392 * Math.pow(2, n / 12), 'triangle', 0.4, 0.08, 0.35 + i * 0.08, this.envioRev)); },
  // ---- instrumentos ----
  raiz() { return 440 * Math.pow(2, ((MINAS[this.mina].mus.raiz) - 69) / 12); },
  bufKS(f) {
    const key = Math.round(f * 4);
    let b = this.ks.get(key);
    if (b) return b;
    const c = this.ctx, sr = c.sampleRate, N = Math.max(2, Math.round(sr / f)), len = Math.floor(sr * 1.1), buf = new Float32Array(N);
    b = c.createBuffer(1, len, sr);
    const d = b.getChannelData(0);
    for (let i = 0; i < N; i++) buf[i] = (Math.random() * 2 - 1) * (1 - i / N * 0.4);
    let p = 0, prev = 0;
    for (let i = 0; i < len; i++) { const v = buf[p], nx = buf[(p + 1) % N]; buf[p] = (v + nx) * 0.5 * 0.9965; const y = v - prev * 0.2; prev = v; d[i] = y * 0.8; p = (p + 1) % N; }
    this.ks.set(key, b);
    return b;
  },
  pulso(f, vol, cuando, dest) {
    const c = this.ctx, t = c.currentTime + (cuando || 0), s = c.createBufferSource(), g = c.createGain();
    s.buffer = this.bufKS(f); g.gain.value = vol;
    s.connect(g); g.connect(dest || this.ef); s.start(t); s.stop(t + 1.1);
  },
  pulsoEn(t, f, vol) {
    const c = this.ctx, s = c.createBufferSource(), g = c.createGain();
    s.buffer = this.bufKS(f); g.gain.value = vol;
    s.connect(g); g.connect(this.mus); s.start(t); s.stop(t + 1.1);
  },
  quenaEn(t, f, dur, vol) {
    const c = this.ctx, o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
    o.type = 'sine'; o2.type = 'triangle'; o.frequency.value = f; o2.frequency.value = f * 2;
    lfo.frequency.value = 5.4; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.006, t + Math.min(0.3, dur * 0.6));
    lfo.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency);
    const g2 = c.createGain(); g2.gain.value = 0.18; o2.connect(g2); g2.connect(g);
    o.connect(g);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.05); g.gain.setValueAtTime(vol * 0.85, t + Math.max(0.06, dur - 0.08)); g.gain.linearRampToValueAtTime(0, t + dur + 0.1);
    g.connect(this.mus); g.connect(this.envioRev);
    for (const x of [o, o2, lfo]) { x.start(t); x.stop(t + dur + 0.15); }
    const s = c.createBufferSource(), fl = c.createBiquadFilter(), gn = c.createGain();
    s.buffer = this.ruidoBuf; fl.type = 'bandpass'; fl.frequency.value = f * 2; fl.Q.value = 4;
    gn.gain.setValueAtTime(0, t); gn.gain.linearRampToValueAtTime(vol * 0.12, t + 0.03); gn.gain.linearRampToValueAtTime(0, t + dur);
    s.connect(fl); fl.connect(gn); gn.connect(this.mus); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  },
  bomboEn(t, fuerte) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(fuerte ? 78 : 66, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.25);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(fuerte ? 0.55 : 0.32, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    o.connect(g); g.connect(this.mus); o.start(t); o.stop(t + 0.45);
    const s = c.createBufferSource(), fl = c.createBiquadFilter(), gn = c.createGain();
    s.buffer = this.ruidoBuf; fl.type = 'lowpass'; fl.frequency.value = 500;
    gn.gain.setValueAtTime(0, t); gn.gain.linearRampToValueAtTime(0.12, t + 0.003); gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    s.connect(fl); fl.connect(gn); gn.connect(this.mus); s.start(t, Math.random()); s.stop(t + 0.1);
  },
  aroEn(t) {
    const c = this.ctx, s = c.createBufferSource(), fl = c.createBiquadFilter(), gn = c.createGain();
    s.buffer = this.ruidoBuf; fl.type = 'bandpass'; fl.frequency.value = 2600; fl.Q.value = 3;
    gn.gain.setValueAtTime(0, t); gn.gain.linearRampToValueAtTime(0.09, t + 0.002); gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    s.connect(fl); fl.connect(gn); gn.connect(this.mus); s.start(t, Math.random()); s.stop(t + 0.07);
  },
  // ---- el huayno: escala pentatónica menor, progresión y patrón (nunca nota por nota al azar) ----
  armarFrase(rng) {
    const notas = [], esc = [0, 3, 5, 7, 10, 12, 15, 17];
    let g = 4;
    for (let c = 0; c < 4; c++) {
      const ritmo = rng() < 0.5 ? [4, 2, 2, 4, 4] : rng() < 0.5 ? [2, 2, 4, 2, 2, 4] : [6, 2, 4, 4];
      let pos = 0;
      for (const r of ritmo) {
        g = clamp(g + Math.floor(rng() * 5) - 2, 0, esc.length - 1);
        if (c === 3 && pos + r >= 16) g = 0;
        notas.push({ p: c * 16 + pos, d: r, n: esc[g] + 12, silencio: rng() < 0.12 && pos > 0 });
        pos += r;
      }
    }
    return notas;
  },
  musicaMina(k) { if (this.mina !== k) { this.mina = k; this.ks.clear(); this.frase = null; this.precalentar(); } },
  tic() {
    if (!this.sonando || !this.ok() || this.callar) return;
    const c = this.ctx, M = MINAS[this.mina].mus, sem = 60 / M.bpm / 4;   // semicorchea
    if (this.prox < c.currentTime - 0.2) this.prox = c.currentTime + 0.05;
    const prog = [[0, 'm'], [3, 'M'], [-2, 'M'], [0, 'm'], [0, 'm'], [3, 'M'], [-5, 'm'], [0, 'm']];
    while (this.prox < c.currentTime + 0.3) {
      const t = this.prox, p = this.paso % 128, comp = Math.floor(p / 16), s16 = p % 16;
      if (p === 0) { const r = rngSemilla(Math.floor(this.paso / 128) * 31 + this.mina * 7 + 3); if (!this.frase || r() < 0.5) this.frase = this.armarFrase(r); this.vuelta = Math.floor(this.paso / 128); }
      const [gr, tipo] = prog[comp % 8], raiz = this.raiz() * Math.pow(2, gr / 12) / 2, acorde = tipo === 'm' ? [0, 7, 12, 15, 19] : [0, 7, 12, 16, 19];
      // bombo legüero: largo-corto-corto (corchea y dos semicorcheas)
      if (s16 === 0 || s16 === 8) this.bomboEn(t, s16 === 0);
      if (s16 === 4 || s16 === 12 || s16 === 14) this.aroEn(t);
      if (s16 === 6) this.bomboEn(t, false);
      // charango: rasgueo en las corcheas
      if (s16 % 2 === 0) {
        const fuerte = s16 % 4 === 0, n = fuerte ? 5 : 3;
        for (let i = 0; i < n; i++) this.pulsoEn(t + i * 0.012, raiz * 2 * Math.pow(2, acorde[i] / 12), fuerte ? 0.11 : 0.06);
      }
      if (s16 === 0) this.pulsoEn(t, raiz, 0.16);
      // quena: la frase, una vuelta sí y otra también salvo la cuarta
      if (this.frase && this.vuelta % 4 !== 3) for (const nt of this.frase) if (nt.p === (p % 64) && !nt.silencio) this.quenaEn(t, this.raiz() * Math.pow(2, nt.n / 12), nt.d * sem * 0.95, 0.075 * M.quena);
      this.prox += sem; this.paso++;
    }
  },
};
let VIBRAR = true;
function vibrar(ms) { if (!VIBRAR || !navigator.vibrate || (navigator.userActivation && !navigator.userActivation.hasBeenActive)) return; try { navigator.vibrate(ms); } catch (e) { } }
