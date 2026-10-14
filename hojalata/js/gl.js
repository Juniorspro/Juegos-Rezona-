// HOJALATA — WebGL2 sin librerías: programas, búferes, texturas y destinos de dibujo
let gl = null;
const GL = {
  ok: false, perdido: false,
  iniciar(cv) {
    try { gl = cv.getContext('webgl2', { antialias: false, alpha: false, depth: true, stencil: false, preserveDrawingBuffer: !!PRUEBA, powerPreference: 'high-performance' }); } catch (e) { gl = null; }
    if (!gl) return false;
    cv.addEventListener('webglcontextlost', e => { e.preventDefault(); GL.perdido = true; }, false);
    cv.addEventListener('webglcontextrestored', () => location.reload(), false);
    this.ok = true;
    return true;
  },
  programa(vs, fs, nombre) {
    const sh = (tipo, src) => {
      const s = gl.createShader(tipo); gl.shaderSource(s, '#version 300 es\nprecision highp float;\nprecision highp int;\nprecision highp sampler2DShadow;\n' + src); gl.compileShader(s);
      return s;
    };
    const v = sh(gl.VERTEX_SHADER, vs), f = sh(gl.FRAGMENT_SHADER, fs), p = gl.createProgram();
    gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p);
    return { p, u: {}, nombre, v, f, listo: false };
  },
  revisar(P) {
    if (P.listo) return;
    if (!gl.getProgramParameter(P.p, gl.LINK_STATUS)) {
      const err = (gl.getShaderInfoLog(P.v) || '') + (gl.getShaderInfoLog(P.f) || '') + (gl.getProgramInfoLog(P.p) || '');
      throw new Error('shader ' + P.nombre + ': ' + err.slice(0, 500));
    }
    const n = gl.getProgramParameter(P.p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const a = gl.getActiveUniform(P.p, i), nom = a.name.replace(/\[0\]$/, ''); P.u[nom] = gl.getUniformLocation(P.p, a.name); }
    P.listo = true;
  },
  usar(P) { this.revisar(P); gl.useProgram(P.p); return P.u; },
  textura(w, h, interno, formato, tipo, filtro, datos, repetir) {
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, interno, w, h, 0, formato, tipo, datos || null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filtro || gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filtro || gl.NEAREST);
    const wr = repetir ? gl.REPEAT : gl.CLAMP_TO_EDGE;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wr); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wr);
    return t;
  },
  // un lienzo 2D como textura (con mipmaps si se pide, para los carteles lejanos)
  texturaLienzo(cv, mip, t0) {
    const t = t0 || gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv);
    if (mip) { gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); }
    else gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  },
  // búfer de vértices con su formato: [{n: nombre, k: componentes, t: tipo, norm}]
  malla(datos, formato, idx) {
    const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, datos, gl.STATIC_DRAW);
    let paso = 0; for (const f of formato) paso += f.k * (f.t === gl.FLOAT ? 4 : f.t === gl.UNSIGNED_SHORT || f.t === gl.SHORT ? 2 : 1);
    let o = 0;
    formato.forEach((f, i) => {
      gl.enableVertexAttribArray(i);
      if (f.entero) gl.vertexAttribIPointer(i, f.k, f.t, paso, o); else gl.vertexAttribPointer(i, f.k, f.t, !!f.norm, paso, o);
      o += f.k * (f.t === gl.FLOAT ? 4 : f.t === gl.UNSIGNED_SHORT || f.t === gl.SHORT ? 2 : 1);
    });
    let ib = null;
    if (idx) { ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW); }
    gl.bindVertexArray(null);
    return { vao, vb, ib, n: idx ? idx.length : datos.byteLength / paso, paso, idx32: idx instanceof Uint32Array };
  },
  borrarMalla(m) { if (!m) return; gl.deleteVertexArray(m.vao); gl.deleteBuffer(m.vb); if (m.ib) gl.deleteBuffer(m.ib); },
  // destino de la escena: color + normal/ID (MRT) + profundidad como textura
  destinoEscena(w, h) {
    const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    const col = this.textura(w, h, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, gl.LINEAR), nor = this.textura(w, h, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE);
    const prof = this.textura(w, h, gl.DEPTH_COMPONENT24, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, col, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, nor, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, prof, 0);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
    const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { fb, col, nor, prof, w, h, ok };
  },
  destinoSombra(n) {
    const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.DEPTH_COMPONENT24, n, n);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, t, 0);
    gl.drawBuffers([gl.NONE]); gl.readBuffer(gl.NONE);
    const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { fb, t, n, ok };
  },
  borrar(d) { if (!d) return; for (const k of ['col', 'nor', 'prof', 't']) if (d[k]) gl.deleteTexture(d[k]); if (d.fb) gl.deleteFramebuffer(d.fb); },
};
