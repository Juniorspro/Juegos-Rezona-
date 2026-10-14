// SIETE COLORES — sonido sintetizado: carnavalito con charango, sikus (dos tropas que se contestan), bombo legüero,
// caja y erke; efectos de pasos según el suelo, viento y río según dónde estés.
const Sonido = {
  ctx: null, vMus: 0.7, vEf: 0.8, ks: new Map(), tema: 0, temaPed: 0, paso_: 0, prox: 0, frase: null, ult: {}, callar: false,
  iniciar() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try { const C = window.AudioContext || window.webkitAudioContext; if (!C) return; this.ctx = new C(); } catch (e) { return; }
    this.armar();
  },
  armar() {
    const c = this.ctx, t = c.currentTime;
    this.master = c.createGain(); this.master.gain.setValueAtTime(0, t); this.master.gain.linearRampToValueAtTime(1.0, t + 0.5);
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2;
    this.master.connect(comp); comp.connect(c.destination);
    this.anal = c.createAnalyser(); this.anal.fftSize = 2048; comp.connect(this.anal);
    this.mus = c.createGain(); this.mus.gain.value = 0; this.mus.connect(this.master);
    this.musT = c.createGain(); this.musT.gain.value = 1; this.musT.connect(this.mus);
    this.ef = c.createGain(); this.ef.gain.value = 0; this.ef.connect(this.master);
    this.amb = c.createGain(); this.amb.gain.value = 0; this.amb.connect(this.master);
    // reverberación corta de quebrada (la caída cada 64 muestras, sin Math.pow por muestra)
    const len = Math.floor(c.sampleRate * 1.8), ir = c.createBuffer(2, len, c.sampleRate), env = new Float32Array((len >> 6) + 2);
    for (let j = 0; j < env.length; j++) env[j] = Math.pow(Math.max(0, 1 - j * 64 / len), 2.6);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) { const j = i >> 6; d[i] = (Math.random() * 2 - 1) * (env[j] + (env[j + 1] - env[j]) * (i & 63) / 64); } }
    this.rev = c.createConvolver(); this.rev.buffer = ir;
    const wet = c.createGain(); wet.gain.value = 0.3; this.rev.connect(wet); wet.connect(this.master);
    this.envio = c.createGain(); this.envio.gain.value = 1; this.envio.connect(this.rev);
    const n = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), nd = n.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    this.ruido = n;
    // ambiente: viento y río (dos ruidos filtrados que siguen sonando)
    const loop = (fc, q, tipo) => { const s = c.createBufferSource(); s.buffer = n; s.loop = true; const f = c.createBiquadFilter(); f.type = tipo; f.frequency.value = fc; f.Q.value = q; const g = c.createGain(); g.gain.value = 0; s.connect(f); f.connect(g); g.connect(this.amb); s.start(); return { f, g }; };
    this.viento = loop(500, 0.6, 'bandpass'); this.rio = loop(900, 0.4, 'lowpass'); this.planeo = loop(1400, 0.8, 'bandpass');
    this.volumen(this.vMus, this.vEf);
    this.prox = c.currentTime + 0.3; this.sonando = true;
    this.precalentar();
  },
  volumen(m, e) {
    this.vMus = m; this.vEf = e;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.mus.gain.setTargetAtTime(m * 1.35, t, 0.05); this.ef.gain.setTargetAtTime(e * 1.3, t, 0.05); this.amb.gain.setTargetAtTime(e * 0.9, t, 0.1);
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
  // ---- instrumentos ----
  bufKS(f) {
    const key = Math.round(f * 4);
    let b = this.ks.get(key);
    if (b) return b;
    const c = this.ctx, sr = c.sampleRate, N = Math.max(2, Math.round(sr / f)), len = Math.floor(sr * 1.0), buf = new Float32Array(N);
    b = c.createBuffer(1, len, sr);
    const d = b.getChannelData(0);
    for (let i = 0; i < N; i++) buf[i] = (Math.random() * 2 - 1) * (1 - i / N * 0.3);
    let p = 0, prev = 0;
    for (let i = 0; i < len; i++) { const v = buf[p], nx = buf[(p + 1) % N]; buf[p] = (v + nx) * 0.5 * 0.996; d[i] = (v - prev * 0.25) * 0.8; prev = v; p = (p + 1) % N; }
    this.ks.set(key, b);
    return b;
  },
  precalentar() {
    const ctx = this.ctx, fs = [];
    for (const raiz of [220, 196, 174.61, 246.94]) for (const tipo of ['m', 'M']) for (const gr of [0, 3, 5, 7, -2, -4, -5]) {
      const r = raiz * Math.pow(2, gr / 12);
      for (const a of tipo === 'm' ? [0, 7, 12, 15, 19] : [0, 7, 12, 16, 19]) fs.push(r * Math.pow(2, a / 12));
    }
    const tanda = () => { if (this.ctx !== ctx) return; const t0 = performance.now(); while (fs.length && performance.now() - t0 < 4) this.bufKS(fs.shift()); if (fs.length) setTimeout(tanda, 0); };
    setTimeout(tanda, 0);
  },
  cuerda(t, f, vol, dest) { const c = this.ctx, s = c.createBufferSource(), g = c.createGain(); s.buffer = this.bufKS(f); g.gain.value = vol; s.connect(g); g.connect(dest || this.musT); s.start(t); s.stop(t + 1.0); },
  siku(t, f, dur, vol, dest) {
    const c = this.ctx, o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(), g2 = c.createGain();
    o.type = 'sine'; o2.type = 'triangle'; o.frequency.setValueAtTime(f * 0.985, t); o.frequency.linearRampToValueAtTime(f, t + 0.04); o2.frequency.value = f * 2;
    g2.gain.value = 0.12; o2.connect(g2); g2.connect(g); o.connect(g);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.025); g.gain.setValueAtTime(vol * 0.8, t + Math.max(0.03, dur - 0.05)); g.gain.linearRampToValueAtTime(0, t + dur + 0.06);
    g.connect(dest || this.musT); g.connect(this.envio);
    o.start(t); o2.start(t); o.stop(t + dur + 0.1); o2.stop(t + dur + 0.1);
    // el soplido de la caña
    const s = c.createBufferSource(), fl = c.createBiquadFilter(), gn = c.createGain();
    s.buffer = this.ruido; fl.type = 'bandpass'; fl.frequency.value = f * 2.2; fl.Q.value = 3;
    gn.gain.setValueAtTime(0, t); gn.gain.linearRampToValueAtTime(vol * 0.35, t + 0.015); gn.gain.exponentialRampToValueAtTime(0.0001, t + Math.min(dur, 0.18));
    s.connect(fl); fl.connect(gn); gn.connect(dest || this.musT); s.start(t, Math.random()); s.stop(t + dur);
  },
  quena(t, f, dur, vol) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
    o.type = 'sine'; o.frequency.value = f; lfo.frequency.value = 5.2; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.007, t + Math.min(0.35, dur * 0.6));
    lfo.connect(lg); lg.connect(o.frequency);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.06); g.gain.setValueAtTime(vol * 0.85, t + Math.max(0.07, dur - 0.08)); g.gain.linearRampToValueAtTime(0, t + dur + 0.12);
    o.connect(g); g.connect(this.musT); g.connect(this.envio);
    o.start(t); lfo.start(t); o.stop(t + dur + 0.15); lfo.stop(t + dur + 0.15);
  },
  bombo(t, fuerte) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(fuerte ? 84 : 70, t); o.frequency.exponentialRampToValueAtTime(44, t + 0.24);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(fuerte ? 0.6 : 0.36, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
    o.connect(g); g.connect(this.musT); o.start(t); o.stop(t + 0.42);
    this.soplo(0.07, 0.12, 'lowpass', 600, 0, t - this.ctx.currentTime, 1, this.musT);
  },
  aro(t, vol) { this.soplo(0.05, vol || 0.08, 'bandpass', 2800, 0, t - this.ctx.currentTime, 3, this.musT); },
  caja(t, vol) { this.soplo(0.09, vol || 0.1, 'bandpass', 1900, 0, t - this.ctx.currentTime, 1.2, this.musT); this.tono(240, 'triangle', 0.05, (vol || 0.1) * 0.5, t - this.ctx.currentTime, this.musT); },
  erke(t, f, dur, vol) {
    const c = this.ctx, o = c.createOscillator(), fl = c.createBiquadFilter(), g = c.createGain();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(f * 0.97, t); o.frequency.linearRampToValueAtTime(f, t + 0.12);
    fl.type = 'lowpass'; fl.frequency.setValueAtTime(400, t); fl.frequency.linearRampToValueAtTime(1600, t + 0.2); fl.Q.value = 2;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.1); g.gain.setValueAtTime(vol, t + dur - 0.1); g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(fl); fl.connect(g); g.connect(this.musT); g.connect(this.envio); o.start(t); o.stop(t + dur + 0.05);
  },
  cascabeles(cuando, n) { for (let k = 0; k < (n || 6); k++) this.tono(3000 + Math.random() * 2500, 'sine', 0.12, 0.05, (cuando || 0) + k * 0.025 + Math.random() * 0.02); },
  // ---- música: temas armados con escala, progresión y patrón ----
  TEMAS: [
    { bpm: 82, raiz: 220, tipo: 'm', prog: [0, -4, -2, 0, 0, -4, -5, 0], bombo: 0, charango: 'arpegio', voz: 'quena', caja: 0, erke: 0 },
    { bpm: 112, raiz: 220, tipo: 'm', prog: [0, 3, -2, 0, 0, 3, -5, 0], bombo: 1, charango: 'rasgueo', voz: 'sikus', caja: 0, erke: 0 },
    { bpm: 134, raiz: 196, tipo: 'm', prog: [0, 0, 3, 3, -2, -2, -5, 0], bombo: 2, charango: 'rasgueo', voz: 'sikus', caja: 1, erke: 0 },
    { bpm: 126, raiz: 246.94, tipo: 'M', prog: [0, 5, 7, 0, 0, 5, 7, 0], bombo: 2, charango: 'rasgueo', voz: 'sikus', caja: 1, erke: 1 },
  ],
  musica(i) { if (this.tema === i) return; this.temaPed = i; if (!this.ctx) { this.tema = i; return; } const t = this.ctx.currentTime; this.musT.gain.setTargetAtTime(0, t, 0.25); this.cambio = t + 0.7; },
  armarFrase(r, T) {
    const esc = T.tipo === 'm' ? [0, 3, 5, 7, 10, 12, 15, 17] : [0, 2, 4, 7, 9, 12, 14, 16], notas = [];
    let g = 4;
    for (let c = 0; c < 4; c++) {
      const ritmo = r() < 0.5 ? [2, 1, 1, 2, 2] : r() < 0.5 ? [1, 1, 1, 1, 2, 2] : [3, 1, 2, 2];
      let pos = 0;
      for (const d of ritmo) {
        g = clamp(g + Math.floor(r() * 5) - 2, 0, esc.length - 1);
        if (c === 3 && pos + d >= 8) g = 0;
        notas.push({ p: c * 8 + pos, d, n: esc[g], quien: (c + (pos > 3 ? 1 : 0)) % 2, sil: r() < 0.1 && pos > 0 });
        pos += d;
      }
    }
    return notas;
  },
  tic() {
    if (!this.sonando || !this.ok() || this.callar) return;
    const c = this.ctx;
    if (this.cambio && c.currentTime >= this.cambio) { this.cambio = 0; this.tema = this.temaPed; this.paso_ = 0; this.frase = null; this.prox = c.currentTime + 0.05; this.musT.gain.setTargetAtTime(1, c.currentTime, 0.2); }
    const T = this.TEMAS[this.tema];
    if (!T) return;
    const sem = 60 / T.bpm / 2;     // corchea
    if (this.prox < c.currentTime - 0.2) this.prox = c.currentTime + 0.05;
    while (this.prox < c.currentTime + 0.3) {
      const t = this.prox, p = this.paso_ % 64, comp = Math.floor(p / 8), s8 = p % 8;
      if (p === 0) { const r = rngSemilla(Math.floor(this.paso_ / 64) * 17 + this.tema * 5 + 1); if (!this.frase || r() < 0.5) this.frase = this.armarFrase(r, T); this.vuelta = Math.floor(this.paso_ / 64); }
      const gr = T.prog[comp % 8], raiz = T.raiz * Math.pow(2, gr / 12) / 2, men = T.tipo === 'm' ? (gr === 3 || gr === -2 || gr === -4 || gr === 5 ? 'M' : 'm') : (gr === 7 ? 'M' : 'M');
      const ac = men === 'm' ? [0, 7, 12, 15, 19] : [0, 7, 12, 16, 19];
      // bombo legüero: el golpe del carnavalito (1 … y-2)
      if (T.bombo) { if (s8 === 0) this.bombo(t, true); if (s8 === 3 || (T.bombo > 1 && s8 === 5)) this.bombo(t, false); if (s8 === 2 || s8 === 6) this.aro(t, 0.07); }
      if (T.caja && (s8 === 2 || s8 === 6 || (s8 === 7 && comp % 2))) this.caja(t, s8 === 7 ? 0.05 : 0.08);
      // charango
      if (T.charango === 'rasgueo') { if (s8 % 2 === 1 || s8 === 0) { const n = s8 === 0 ? 5 : 3; for (let i = 0; i < n; i++) this.cuerda(t + i * 0.011, raiz * 2 * Math.pow(2, ac[i] / 12), s8 === 0 ? 0.1 : 0.06); } }
      else if (s8 % 2 === 0) this.cuerda(t, raiz * 2 * Math.pow(2, ac[(s8 / 2 + comp) % 5] / 12), 0.09);
      if (s8 === 0) this.cuerda(t, raiz, 0.13);
      // la melodía (sikus que se contestan, o quena)
      if (this.frase && this.vuelta % 4 !== 3) for (const nt of this.frase) if (nt.p === (p % 32) && !nt.sil) {
        const f = T.raiz * 2 * Math.pow(2, nt.n / 12), dur = nt.d * sem * 0.92;
        if (T.voz === 'quena') this.quena(t, f, dur * 1.4, 0.07);
        else this.siku(t, f, dur, nt.quien ? 0.06 : 0.07);
      }
      if (T.erke && s8 === 0 && comp % 4 === 0) this.erke(t, T.raiz / 2, sem * 6, 0.05);
      this.prox += sem; this.paso_++;
    }
  },
  // ambiente: viento más fuerte arriba, el río cerca del agua, el aire al planear
  ambiente(dt) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime;
    const alto = clamp((J.y - 12) / 40, 0, 1), dRio = Math.abs(J.x - RIO(J.z));
    this.viento.g.gain.setTargetAtTime(0.05 + alto * 0.14 + 0.03 * Math.sin(t * 0.4), t, 0.5);
    this.viento.f.frequency.setTargetAtTime(380 + alto * 300 + Math.sin(t * 0.23) * 80, t, 0.5);
    this.rio.g.gain.setTargetAtTime(clamp(1 - dRio / 26, 0, 1) * (J.y < 20 ? 0.16 : 0.05), t, 0.4);
    const pl = J.planea ? clamp(Math.hypot(J.vx, J.vz) / 7, 0, 1) * 0.18 : 0;
    this.planeo.g.gain.setTargetAtTime(pl, t, 0.12);
  },
  // ---- efectos ----
  paso(tipo) {
    if (!this.ok() || !this.lim('paso', 0.07)) return;
    const v = 0.07 + Math.random() * 0.03;
    if (tipo === 'piedra') { this.soplo(0.05, v, 'bandpass', 2200 + Math.random() * 600, 0, 0, 2); this.tono(180, 'triangle', 0.04, v * 0.5); }
    else if (tipo === 'madera') { this.tono(220 + Math.random() * 40, 'triangle', 0.08, v * 1.2); this.soplo(0.04, v * 0.6, 'bandpass', 900, 0, 0, 2); }
    else if (tipo === 'sal' || tipo === 'nieve') this.soplo(0.09, v * 1.1, 'highpass', 3500, 0, 0, 0.7);
    else if (tipo === 'agua') { this.soplo(0.16, v * 1.5, 'bandpass', 900, 2600, 0, 1.5); }
    else this.soplo(0.07, v, 'lowpass', 900 + Math.random() * 300, 0, 0, 1);
  },
  salto() { if (!this.ok()) return; this.soplo(0.12, 0.08, 'bandpass', 700, 1600, 0, 1.5); this.tono(520, 'sine', 0.09, 0.05, 0, null, 700); },
  aleteo() { if (!this.ok()) return; for (let k = 0; k < 2; k++) this.soplo(0.1, 0.14, 'bandpass', 1100, 500, k * 0.07, 1.2); this.tono(660, 'triangle', 0.12, 0.05, 0, null, 990); },
  sinPlumas() { if (!this.ok() || !this.lim('sin', 0.3)) return; this.tono(180, 'square', 0.08, 0.04, 0, null, 140); },
  caer() { if (!this.ok()) return; this.tono(110, 'sine', 0.2, 0.25, 0, null, 50); this.soplo(0.12, 0.12, 'lowpass', 500, 0, 0, 1); },
  agarre() { if (!this.ok()) return; this.soplo(0.1, 0.08, 'bandpass', 1600, 800, 0, 2); },
  ay() { if (!this.ok()) return; this.tono(820, 'square', 0.16, 0.05, 0, null, 480); this.soplo(0.05, 0.08, 'highpass', 4000, 0, 0, 1); },
  pluma() { if (!this.ok()) return; [0, 4, 7, 12, 16].forEach((n, i) => this.tono(880 * Math.pow(2, n / 12), 'sine', 0.5, 0.07, i * 0.06, this.ef)); this.cascabeles(0.3, 5); },
  ovillo() { if (!this.ok()) return; [0, 7, 12].forEach((n, i) => this.tono(330 * Math.pow(2, n / 12), 'triangle', 0.35, 0.08, i * 0.05)); },
  color(i) {
    if (!this.ok()) return;
    const raiz = [220, 246.94, 261.63, 293.66, 329.63, 349.23, 392][i];
    [0, 7, 12, 16, 19, 24].forEach((n, k) => { const c = this.ctx; this.cuerda(c.currentTime + k * 0.03, raiz * Math.pow(2, n / 12), 0.12, this.ef); });
    [0, 4, 7, 12].forEach((n, k) => this.siku(this.ctx.currentTime + 0.25 + k * 0.12, raiz * 2 * Math.pow(2, n / 12), 0.5, 0.06, this.ef));
    this.cascabeles(0.2, 10);
  },
  ola() { if (!this.ok()) return; this.soplo(2.5, 0.16, 'bandpass', 200, 2400, 0, 0.8); for (let k = 0; k < 7; k++) this.tono(523.25 * Math.pow(2, [0, 2, 4, 7, 9, 12, 14][k] / 12), 'sine', 1.2, 0.05, 0.3 + k * 0.18); },
  dialogo() { if (!this.ok()) return; this.tono(900, 'sine', 0.04, 0.03); },
  letra(voz) { if (!this.ok() || !this.lim('letra', 0.045)) return; this.tono((180 + Math.random() * 60) * (voz || 1) * 1.6, 'square', 0.035, 0.018); },
  boton() { if (!this.ok()) return; this.tono(1200, 'sine', 0.05, 0.05); this.tono(1800, 'sine', 0.04, 0.025, 0.02); },
  error() { if (!this.ok()) return; this.tono(220, 'square', 0.18, 0.05, 0, null, 160); },
  encontrado() { if (!this.ok()) return; [0, 4, 7, 4, 12].forEach((n, i) => this.tono(660 * Math.pow(2, n / 12), 'square', 0.08, 0.03, i * 0.07)); },
  toque() { if (!this.ok()) return; this.tono(1320, 'sine', 0.3, 0.08); this.tono(1980, 'sine', 0.25, 0.05, 0.05); this.cascabeles(0, 4); },
  pujllay() { if (!this.ok()) return; this.cascabeles(0, 12); [0, 3, 0, 5].forEach((n, i) => this.tono(520 * Math.pow(2, n / 12), 'square', 0.07, 0.035, 0.1 + i * 0.09)); },
  saltito() { if (!this.ok()) return; this.tono(400, 'triangle', 0.15, 0.05, 0, null, 800); this.cascabeles(0, 3); },
  piedra() { if (!this.ok()) return; this.tono(392, 'sine', 0.6, 0.08); this.tono(588, 'sine', 0.5, 0.04, 0.05); },
  huanca(i) { if (!this.ok()) return; const f = [523.25, 587.33, 659.25, 783.99][i]; this.tono(f, 'sine', 0.9, 0.12, 0, this.ef); this.tono(f * 3.01, 'sine', 0.3, 0.03); },
  piedraAbre() { if (!this.ok()) return; this.soplo(1.6, 0.25, 'lowpass', 300, 80, 0, 1); this.tono(70, 'sine', 1.4, 0.3, 0, null, 40); },
  campana() { if (!this.ok()) return; [1, 2.76, 5.4].forEach((m, i) => this.tono(392 * m, 'sine', 2.2 / (i + 1), 0.06 / (i + 1))); },
  telon() { if (!this.ok()) return; this.soplo(0.4, 0.06, 'bandpass', 400, 1600, 0, 1); },
};
let VIBRAR = true;
function vibrar(ms) { if (!VIBRAR || !navigator.vibrate || (navigator.userActivation && !navigator.userActivation.hasBeenActive)) return; try { navigator.vibrate(ms); } catch (e) { } }
