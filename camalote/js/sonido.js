// CAMALOTE — sonido sintetizado: efectos y un chamamé con acordeón, guitarra y contrabajo
const Sonido = {
  ctx: null, vMus: 0.7, vEf: 0.8, ult: {}, ks: new Map(), tema: -1, paso: 0, prox: 0, frase: null, sonando: false, lluvia: null,
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
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 24;
    this.master.connect(comp); comp.connect(hp); hp.connect(c.destination);
    this.mus = c.createGain(); this.mus.gain.value = 0; this.mus.connect(this.master);
    this.ef = c.createGain(); this.ef.gain.value = 0; this.ef.connect(this.master);
    const len = Math.floor(c.sampleRate * 2.2), ir = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.4); }
    this.rev = c.createConvolver(); this.rev.buffer = ir;
    const wet = c.createGain(); wet.gain.value = 0.24; this.rev.connect(wet); wet.connect(this.master);
    this.envioRev = c.createGain(); this.envioRev.gain.value = 1; this.envioRev.connect(this.rev);
    const n = c.createBuffer(1, c.sampleRate, c.sampleRate), nd = n.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    this.ruidoBuf = n;
    this.volumen(this.vMus, this.vEf);
    this.prox = c.currentTime + 0.3;
    this.sonando = true;
    if (this.tema === 2) this.ambiente(true);
  },
  volumen(m, e) {
    this.vMus = m; this.vEf = e;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.mus.gain.setTargetAtTime(m * 0.55, t, 0.05); this.ef.gain.setTargetAtTime(e * 0.7, t, 0.05);
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
  nota(n) { return 440 * Math.pow(2, (n - 69) / 12); },
  // ---- efectos del mundo ----
  embestida() { if (!this.ok()) return; this.ruido(0.16, 0.16, 'bandpass', 700, 1.2, 0, null, 2400); this.tono(180, 'triangle', 0.1, 0.06, 0, null, 320); },
  golpe() { if (!this.ok() || !this.limitar('golpe', 0.05)) return; this.tono(220, 'square', 0.06, 0.08, 0, null, 90); this.ruido(0.06, 0.18, 'lowpass', 1800); },
  bonk() { if (!this.ok() || !this.limitar('bonk', 0.12)) return; this.tono(140, 'sine', 0.12, 0.22, 0, null, 70); this.ruido(0.04, 0.08, 'lowpass', 700); },
  madera() { if (!this.ok()) return; this.ruido(0.18, 0.26, 'bandpass', 900, 1.5); [0, 0.04, 0.09].forEach(d => this.tono(300 + Math.random() * 200, 'triangle', 0.07, 0.07, d, null, 150)); },
  arbusto() { if (!this.ok()) return; this.ruido(0.3, 0.2, 'highpass', 1800, 0.7, 0, null, 5000); this.ruido(0.18, 0.1, 'bandpass', 600, 1, 0.03); },
  empujar() { if (!this.ok() || !this.limitar('empujar', 0.15)) return; this.ruido(0.22, 0.12, 'lowpass', 400, 1, 0, null, 200); },
  chapuzon() { if (!this.ok() || !this.limitar('chap', 0.2)) return; this.ruido(0.35, 0.22, 'bandpass', 900, 0.8, 0, null, 300); this.tono(500, 'sine', 0.12, 0.06, 0.02, null, 1200); },
  puzzle() { if (!this.ok()) return; [0, 4, 7, 12].forEach((n, i) => this.tono(this.nota(74 + n), 'triangle', 0.25, 0.08, i * 0.08, this.envioRev)); [0, 4, 7, 12].forEach((n, i) => this.tono(this.nota(86 + n), 'sine', 0.2, 0.03, i * 0.08)); },
  barro() { if (!this.ok() || !this.limitar('barro', 0.1)) return; this.ruido(0.14, 0.18, 'lowpass', 500, 2, 0, null, 180); this.tono(120, 'sine', 0.08, 0.1, 0.02, null, 60); },
  fogon() { if (!this.ok()) return; this.ruido(0.8, 0.14, 'bandpass', 1400, 0.6, 0, this.envioRev, 500); [0, 4, 7].forEach((n, i) => this.tono(this.nota(67 + n), 'sine', 0.5, 0.06, 0.1 + i * 0.12, this.envioRev)); },
  silbato() { if (!this.ok()) return; this.tono(2300, 'sine', 0.12, 0.09, 0, null, 2700); this.tono(2700, 'sine', 0.22, 0.09, 0.13, this.envioRev, 2200); this.ruido(0.3, 0.03, 'bandpass', 2500, 6); },
  estatua() { if (!this.ok()) return; this.ruido(0.4, 0.12, 'lowpass', 600, 1, 0, null, 200); this.tono(this.nota(79), 'sine', 0.6, 0.07, 0.1, this.envioRev); this.tono(this.nota(86), 'sine', 0.6, 0.05, 0.22, this.envioRev); },
  boleadoras() { if (!this.ok()) return; for (let k = 0; k < 4; k++) this.ruido(0.07, 0.07, 'bandpass', 1200 + k * 300, 3, k * 0.06); },
  herido() { if (!this.ok()) return; this.tono(520, 'square', 0.18, 0.08, 0, null, 180); this.ruido(0.1, 0.12, 'lowpass', 1200); },
  desmayo() { if (!this.ok()) return; [0, -3, -6, -12].forEach((n, i) => this.tono(this.nota(67 + n), 'triangle', 0.25, 0.09, i * 0.16)); },
  impacto() { if (!this.ok() || !this.limitar('imp', 0.08)) return; this.tono(90, 'sine', 0.3, 0.3, 0, null, 40); this.ruido(0.25, 0.22, 'lowpass', 900, 0.8, 0, null, 120); },
  jaula() { if (!this.ok()) return; this.ruido(0.12, 0.14, 'highpass', 2500); [0, 0.07].forEach(d => this.tono(1400, 'square', 0.06, 0.04, d, null, 900)); },
  corazon() { if (!this.ok()) return; this.tono(this.nota(81), 'sine', 0.1, 0.1); this.tono(this.nota(88), 'sine', 0.18, 0.1, 0.08, this.envioRev); },
  figurita() { if (!this.ok()) return; [0, 4, 7, 11, 14, 19].forEach((n, i) => this.tono(this.nota(79 + n), 'triangle', 0.3, 0.07, i * 0.06, this.envioRev)); this.ruido(0.5, 0.04, 'highpass', 6000, 0.7, 0.1); },
  item() { if (!this.ok()) return; [0, 5, 9, 12].forEach((n, i) => this.tono(this.nota(72 + n), 'square', 0.16, 0.035, i * 0.09)); [0, 5, 9, 12].forEach((n, i) => this.tono(this.nota(72 + n), 'triangle', 0.35, 0.08, i * 0.09, this.envioRev)); },
  disparo() { if (!this.ok() || !this.limitar('disp', 0.08)) return; this.tono(900, 'square', 0.08, 0.04, 0, null, 300); },
  zumbido() { if (!this.ok()) return; const g = this.tono(180, 'sawtooth', 0.6, 0.05, 0, null, 240, 0.1); void g; this.tono(183, 'sawtooth', 0.6, 0.04, 0, null, 250, 0.1); },
  golpeJefe() { if (!this.ok()) return; this.tono(160, 'square', 0.2, 0.12, 0, null, 60); this.ruido(0.3, 0.3, 'lowpass', 2400, 0.8, 0, null, 200); this.tono(this.nota(76), 'triangle', 0.2, 0.06, 0.05, this.envioRev); },
  motor() { if (!this.ok()) return; for (let k = 0; k < 6; k++) this.tono(70 + k * 6, 'sawtooth', 0.12, 0.05, k * 0.11, null, 90 + k * 8); },
  choque() { if (!this.ok()) return; this.ruido(0.5, 0.3, 'lowpass', 1600, 0.8, 0, null, 100); this.tono(70, 'sine', 0.4, 0.3, 0, null, 35); this.tono(1200, 'square', 0.1, 0.03, 0.05, null, 400); },
  lanzar() { if (!this.ok() || !this.limitar('lanzar', 0.1)) return; this.tono(600, 'triangle', 0.3, 0.05, 0, null, 200); },
  alarma() { if (!this.ok()) return; for (let k = 0; k < 3; k++) { this.tono(880, 'square', 0.12, 0.035, k * 0.28); this.tono(660, 'square', 0.12, 0.035, k * 0.28 + 0.14); } },
  vapor() { if (!this.ok()) return; this.ruido(0.8, 0.12, 'highpass', 3000, 0.5, 0, null, 1200); },
  explosion() { if (!this.ok()) return; this.ruido(1.0, 0.45, 'lowpass', 2400, 0.7, 0, null, 70); this.tono(80, 'sine', 0.7, 0.4, 0, null, 28); this.ruido(1.4, 0.1, 'bandpass', 500, 0.8, 0.1, this.envioRev, 120); },
  trueno() { if (!this.ok()) return; this.ruido(2.2, 0.16, 'lowpass', 500, 0.6, 0.15, this.envioRev, 60); this.ruido(0.3, 0.12, 'highpass', 1500, 0.5, 0.1); },
  // ---- interfaz ----
  boton() { if (!this.ok()) return; this.tono(600, 'sine', 0.05, 0.1, 0, null, 900); this.ruido(0.02, 0.04, 'bandpass', 2000, 2); },
  pagina() { if (!this.ok()) return; this.ruido(0.25, 0.08, 'bandpass', 2600, 0.6, 0, null, 900); },
  ola() { if (!this.ok()) return; this.ruido(0.7, 0.12, 'bandpass', 500, 0.6, 0, this.envioRev, 1500); },
  voz: { abuela: 330, tereso: 900, yaca: 150, mosquita: 1100, cemento: 180, rosa: 760, mulita: 520, coati: 640, nutria: 600, ciervo: 260, lola: 820, pancho: 420, cartel: 360 },
  blip(quien) {
    if (!this.ok() || !this.limitar('blip', 0.065)) return;
    const f = (this.voz[quien] || 440) * (0.9 + Math.random() * 0.25);
    this.tono(f, quien === 'cemento' || quien === 'yaca' ? 'square' : 'triangle', 0.045, quien === 'cemento' ? 0.03 : 0.05);
  },
  // ---- instrumentos ----
  bufKS(f) {
    const key = Math.round(f * 4);
    let b = this.ks.get(key);
    if (b) return b;
    const c = this.ctx, sr = c.sampleRate, N = Math.max(2, Math.round(sr / f)), len = Math.floor(sr * 1.0), buf = new Float32Array(N);
    b = c.createBuffer(1, len, sr);
    const d = b.getChannelData(0);
    for (let i = 0; i < N; i++) buf[i] = (Math.random() * 2 - 1) * (1 - i / N * 0.5);
    let p = 0;
    for (let i = 0; i < len; i++) { const v = buf[p], nx = buf[(p + 1) % N]; buf[p] = (v + nx) * 0.5 * 0.996; d[i] = v * 0.8; p = (p + 1) % N; }
    this.ks.set(key, b);
    return b;
  },
  pulsoEn(t, f, vol) {
    const c = this.ctx, s = c.createBufferSource(), g = c.createGain();
    s.buffer = this.bufKS(f); g.gain.value = vol;
    s.connect(g); g.connect(this.mus); s.start(t); s.stop(t + 1.0);
  },
  bajoEn(t, f, dur, vol) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain(), fl = c.createBiquadFilter();
    o.type = 'triangle'; o.frequency.value = f; fl.type = 'lowpass'; fl.frequency.value = 600;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(fl); fl.connect(g); g.connect(this.mus); o.start(t); o.stop(t + dur + 0.05);
  },
  // acordeón: dos sierras desafinadas (el "musette") con filtro y fuelle
  acordeonEn(t, f, dur, vol, brillo) {
    const c = this.ctx, g = c.createGain(), fl = c.createBiquadFilter(), osc = [];
    fl.type = 'lowpass'; fl.frequency.value = brillo || 2000; fl.Q.value = 0.7;
    for (const d of [-7, 7]) { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = d; o.connect(fl); osc.push(o); }
    const o2 = c.createOscillator(); o2.type = 'square'; o2.frequency.value = f / 2; const g2 = c.createGain(); g2.gain.value = 0.25; o2.connect(g2); g2.connect(fl); osc.push(o2);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.025); g.gain.setValueAtTime(vol * 0.9, t + Math.max(0.03, dur - 0.05)); g.gain.linearRampToValueAtTime(0, t + dur + 0.06);
    fl.connect(g); g.connect(this.mus); g.connect(this.envioRev);
    for (const o of osc) { o.start(t); o.stop(t + dur + 0.1); }
  },
  bomboEn(t, vol) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.18);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    o.connect(g); g.connect(this.mus); o.start(t); o.stop(t + 0.35);
  },
  chasEn(t, vol, f) {
    const c = this.ctx, s = c.createBufferSource(), fl = c.createBiquadFilter(), gn = c.createGain();
    s.buffer = this.ruidoBuf; fl.type = 'bandpass'; fl.frequency.value = f || 3200; fl.Q.value = 1.2;
    gn.gain.setValueAtTime(0, t); gn.gain.linearRampToValueAtTime(vol, t + 0.002); gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    s.connect(fl); fl.connect(gn); gn.connect(this.mus); s.start(t, Math.random()); s.stop(t + 0.1);
  },
  ambiente(on) {
    if (!this.ctx) return;
    if (on && !this.lluvia) {
      const c = this.ctx, s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
      s.buffer = this.ruidoBuf; s.loop = true; fl.type = 'bandpass'; fl.frequency.value = 2400; fl.Q.value = 0.4;
      g.gain.value = 0; g.gain.setValueAtTime(0, c.currentTime); g.gain.linearRampToValueAtTime(0.04, c.currentTime + 1.5);
      s.connect(fl); fl.connect(g); g.connect(this.mus); s.start(c.currentTime);
      this.lluvia = { s, g };
    } else if (!on && this.lluvia) { const l = this.lluvia; this.lluvia = null; try { l.g.gain.setTargetAtTime(0, this.ctx.currentTime, 0.3); l.s.stop(this.ctx.currentTime + 1.5); } catch (e) { } }
  },
  // ---- la música: chamamé en 6/8 (corcheas), progresión fija y frases con patrón ----
  TEMAS: [
    { bpm: 200, raiz: 62, menor: false, brillo: 2200, acor: 0.05, guit: 0.07, bajo: 0.16 },        // las islas
    { bpm: 216, raiz: 67, menor: false, brillo: 2600, acor: 0.05, guit: 0.08, bajo: 0.16 },        // delta dorado
    { bpm: 168, raiz: 57, menor: true, brillo: 1500, acor: 0.045, guit: 0.05, bajo: 0.15, dron: 1 }, // la draga, de noche
    { bpm: 252, raiz: 64, menor: true, brillo: 2800, acor: 0.05, guit: 0.07, bajo: 0.17, bombo: 1 },  // jefe
    { bpm: 150, raiz: 62, menor: false, brillo: 1700, acor: 0.04, guit: 0.06, bajo: 0.1 },          // cuento
  ],
  musica(n) { if (this.tema === n) return; this.tema = n; this.frase = null; this.paso = 0; if (this.ctx) { this.prox = this.ctx.currentTime + 0.15; this.ambiente(n === 2); } },
  armarFrase(rng, menor) {
    const esc = menor ? [0, 2, 3, 5, 7, 8, 10, 12, 14, 15] : [0, 2, 4, 5, 7, 9, 11, 12, 14, 16], notas = [];
    let g = 4;
    for (let c = 0; c < 4; c++) {
      const ritmo = [[2, 1, 2, 1], [3, 3], [1, 1, 1, 3], [2, 1, 3]][Math.floor(rng() * 4)];
      let pos = 0;
      for (const r of ritmo) {
        g = clamp(g + Math.floor(rng() * 5) - 2, 0, esc.length - 1);
        if (c === 3 && pos + r >= 6) g = rng() < 0.5 ? 0 : 7;
        notas.push({ p: c * 6 + pos, d: r, n: esc[g], silencio: rng() < 0.1 && pos > 0 });
        pos += r;
      }
    }
    return notas;
  },
  tic() {
    if (!this.sonando || !this.ok() || this.tema < 0) return;
    const c = this.ctx, M = this.TEMAS[this.tema], cor = 60 / M.bpm;   // corchea
    if (this.prox < c.currentTime - 0.2) this.prox = c.currentTime + 0.05;
    const prog = M.menor ? [[0, 'm'], [0, 'm'], [-2, 'M'], [-2, 'M'], [-4, 'M'], [-4, 'M'], [-5, 'M'], [-5, 'M']] : [[0, 'M'], [7, 'M'], [7, 'M'], [0, 'M'], [5, 'M'], [0, 'M'], [7, 'M'], [0, 'M']];
    while (this.prox < c.currentTime + 0.3) {
      const t = this.prox, p = this.paso % 48, comp = Math.floor(p / 6), s = p % 6;
      if (p === 0) { const r = rngSemilla(Math.floor(this.paso / 48) * 17 + this.tema * 101 + 5); if (!this.frase || r() < 0.5) this.frase = this.armarFrase(r, M.menor); this.vuelta = Math.floor(this.paso / 48); }
      const [gr, tipo] = prog[comp], raiz = this.nota(M.raiz + gr - 12), acorde = tipo === 'm' ? [0, 3, 7, 12] : [0, 4, 7, 12];
      // contrabajo en 1 y en 4 (tónica y quinta), la guitarra rasguea "chan-chan" en las otras corcheas
      if (s === 0) this.bajoEn(t, raiz / 2, cor * 2.6, M.bajo);
      if (s === 3) this.bajoEn(t, raiz / 2 * 1.5, cor * 2.2, M.bajo * 0.8);
      if (s === 1 || s === 2 || s === 4 || s === 5) { const fuerte = s === 2 || s === 5; for (let i = 0; i < (fuerte ? 4 : 3); i++) this.pulsoEn(t + i * 0.011, raiz * 2 * Math.pow(2, acorde[i] / 12), fuerte ? M.guit : M.guit * 0.6); }
      if (M.bombo) { if (s === 0 || s === 3) this.bomboEn(t, 0.34); if (s === 2 || s === 5) this.chasEn(t, 0.05); }
      if (M.dron && s === 0 && comp % 2 === 0) this.acordeonEn(t, raiz / 2, cor * 11.5, 0.03, 600);
      // el acordeón: la frase, y en la cuarta vuelta descansa (la guitarra sola)
      if (this.frase && this.vuelta % 4 !== 3) for (const nt of this.frase) if (nt.p === (p % 24) && !nt.silencio) this.acordeonEn(t, this.nota(M.raiz + 12 + nt.n), nt.d * cor * 0.92, M.acor, M.brillo);
      this.prox += cor; this.paso++;
    }
  },
};
let VIBRAR = true;
function vibrar(ms) { if (VIBRAR && navigator.vibrate) try { navigator.vibrate(ms); } catch (e) { } }
