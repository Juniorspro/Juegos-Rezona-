// MANSION BUILDER — el sonido: la música y los efectos hechos con Higgsfield (mp3 metidos en el HTML), pasos
// sintetizados y la vibración. El audio arranca con el primer toque (los navegadores no dejan antes).
const Sonido = {
  ctx: null, master: null, bMus: null, bSfx: null, buf: {}, listo: false, musOn: true, sfxOn: true, vibOn: true, tocado: false,
  fuentes: [], musT: 0, musTimer: 0, ultimo: {}, ruido: null,
  ok() { return !!(this.interno || (this.ctx && this.ctx.state === 'running')); },
  iniciar() {
    this.tocado = true;
    if (!this.ctx && !this.interno) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { if (window.__crearAudio) { this.interno = { pila: {}, musica: null }; this.listo = true; if (this.quiereMusica) this.musica(true); } return; }
      try { this.ctx = new AC({ latencyHint: 'interactive' }); } catch (e) { try { this.ctx = new AC(); } catch (e2) { return; } }
      const c = this.ctx;
      this.master = c.createGain(); this.master.gain.value = 0.9;
      const comp = c.createDynamicsCompressor(); comp.threshold.value = -12; comp.ratio.value = 3;
      this.master.connect(comp); comp.connect(c.destination);
      this.bMus = c.createGain(); this.bMus.gain.value = this.musOn ? 0.42 : 0; this.bMus.connect(this.master);
      this.bSfx = c.createGain(); this.bSfx.gain.value = this.sfxOn ? 0.8 : 0; this.bSfx.connect(this.master);
      const n = c.sampleRate * 0.5, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      this.ruido = b;
      this.decodificar();
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => { });
  },
  // los mp3 vienen en base64 dentro del HTML (AUDIO_DATOS lo arma armar.mjs)
  decodificar() {
    const datos = typeof AUDIO_DATOS !== 'undefined' ? AUDIO_DATOS : {};
    const nombres = (Object.keys(datos).length ? Object.keys(datos) : (window.__audios || [])).sort((a, b) => (a === 'musica') - (b === 'musica'));
    let i = 0;
    const sig = () => {
      if (i >= nombres.length) { this.listo = true; return; }
      const k = nombres[i++];
      let u;
      if (datos[k]) { const s = atob(datos[k]); u = new Uint8Array(s.length); for (let j = 0; j < s.length; j++) u[j] = s.charCodeAt(j); }
      else { const ab = window.__leerAudio ? window.__leerAudio(k) : null; if (!ab) { setTimeout(sig, 0); return; } u = new Uint8Array(ab); }
      const fin = b => { if (b) this.buf[k] = b; if (k === 'musica' && this.quiereMusica) this.musica(true); setTimeout(sig, 0); };
      try { const p = this.ctx.decodeAudioData(u.buffer, fin, () => fin(null)); if (p && p.catch) p.catch(() => { }); } catch (e) { fin(null); }
    };
    sig();
  },
  ponerMusica(on) { this.musOn = on; if (this.interno && this.interno.musica) this.interno.musica.volume = on ? 0.42 : 0; if (this.bMus) this.bMus.gain.setTargetAtTime(on ? 0.42 : 0, this.ctx.currentTime, 0.2); },
  ponerSfx(on) { this.sfxOn = on; if (this.bSfx) this.bSfx.gain.setTargetAtTime(on ? 0.8 : 0, this.ctx.currentTime, 0.05); },
  // la música en loop con fundido cruzado (el tema dura 86 s y termina en fundido)
  musica(on) {
    this.quiereMusica = on;
    if (this.interno) {
      const I = this.interno;
      if (on && !I.musica) { I.musica = window.__crearAudio('musica', true); }
      if (I.musica) { I.musica.volume = this.musOn ? 0.42 : 0; if (on) I.musica.play(); else I.musica.stop(); }
      return;
    }
    if (!on) { for (const f of this.fuentes) { try { f.g.gain.setTargetAtTime(0, this.ctx.currentTime, 0.4); f.s.stop(this.ctx.currentTime + 2); } catch (e) { } } this.fuentes = []; clearTimeout(this.musTimer); return; }
    if (!this.ok() || !this.buf.musica || this.fuentes.length) return;
    const tocar = (desde) => {
      const c = this.ctx, b = this.buf.musica, s = c.createBufferSource(), g = c.createGain();
      s.buffer = b; s.connect(g); g.connect(this.bMus);
      const t = c.currentTime + 0.05;
      g.gain.setValueAtTime(desde ? 0 : 1, t); if (desde) g.gain.linearRampToValueAtTime(1, t + 3);
      s.start(t);
      const f = { s, g }; this.fuentes.push(f);
      s.onended = () => { const k = this.fuentes.indexOf(f); if (k >= 0) this.fuentes.splice(k, 1); };
      this.musTimer = setTimeout(() => { if (this.quiereMusica) tocar(true); }, Math.max(1000, (b.duration - 3.5) * 1000));
    };
    tocar(false);
  },
  // un efecto: vol, tono (rate) y un mínimo de separación para que no se amontonen
  efecto(nombre, vol = 1, tono = 1, sep = 0.03) {
    if (!this.ok() || !this.sfxOn) return;
    if (this.interno) {
      // sin WebAudio: unas pocas voces por efecto, que se reciclan
      const ahora = Date.now() / 1000, I = this.interno; if (this.ultimo[nombre] && ahora - this.ultimo[nombre] < Math.max(sep, 0.06)) return; this.ultimo[nombre] = ahora;
      const p = I.pila[nombre] || (I.pila[nombre] = { i: 0, voces: [] });
      if (p.voces.length < 3) p.voces.push(window.__crearAudio(nombre, false));
      const a = p.voces[p.i++ % p.voces.length]; a.volume = Math.min(1, vol * 0.8); a.stop(); a.play();
      return;
    }
    const c = this.ctx, ahora = c.currentTime;
    if (this.ultimo[nombre] && ahora - this.ultimo[nombre] < sep) return;
    this.ultimo[nombre] = ahora;
    const b = this.buf[nombre];
    if (!b) return this.sintetico(nombre, vol, tono);
    const s = c.createBufferSource(), g = c.createGain();
    s.buffer = b; s.playbackRate.value = tono; g.gain.value = vol;
    s.connect(g); g.connect(this.bSfx); s.start(ahora);
  },
  // por si el mp3 todavía no se decodificó: un tono corto que se le parece
  sintetico(nombre, vol, tono) {
    const c = this.ctx, t = c.currentTime, o = c.createOscillator(), g = c.createGain();
    const f = { pop: 520, recoger: 380, moneda: 1320, caja: 990, desbloquear: 660, fanfarria: 784, clic: 900, martillo: 180, tick: 1500, pala: 220, cofre: 880, agua: 300 }[nombre] || 600;
    o.type = nombre === 'martillo' ? 'square' : 'triangle'; o.frequency.setValueAtTime(f * tono, t); o.frequency.exponentialRampToValueAtTime(f * tono * 1.5, t + 0.08);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.18 * vol, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    o.connect(g); g.connect(this.bSfx); o.start(t); o.stop(t + 0.2);
  },
  // un paso: ruido corto filtrado (pasto o piedra)
  paso(duro) {
    if (!this.ctx || !this.ok() || !this.sfxOn || !this.ruido) return;
    const c = this.ctx, t = c.currentTime, s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.ruido; s.playbackRate.value = 0.8 + Math.random() * 0.4;
    fl.type = 'bandpass'; fl.frequency.value = duro ? 1800 : 700; fl.Q.value = 0.9;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(duro ? 0.07 : 0.05, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    s.connect(fl); fl.connect(g); g.connect(this.bSfx); s.start(t, Math.random() * 0.4, 0.09);
  },
  vibrar(p) { if (!this.vibOn || !this.tocado || !navigator.vibrate) return; try { navigator.vibrate(p); } catch (e) { } },
  pausar(si) { if (this.interno && this.interno.musica) { if (si) this.interno.musica.pause(); else if (this.quiereMusica) this.interno.musica.play(); } if (!this.ctx) return; if (si) this.ctx.suspend().catch(() => { }); else if (this.tocado) this.ctx.resume().catch(() => { }); },
};
