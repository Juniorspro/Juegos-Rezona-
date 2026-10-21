// MANSION BUILDER — WebGL2 sin librerías: programas, búferes, texturas en arreglo, instancias y sombra
let gl = null;
const GL = {
  ok: false, perdido: false, aniso: null, anisoMax: 1,
  iniciar(cv) {
    const op = { antialias: !PARAM.has('sinaa'), alpha: false, depth: true, stencil: false, preserveDrawingBuffer: !!PRUEBA, powerPreference: 'high-performance' };
    try { gl = cv.getContext('webgl2', op); } catch (e) { gl = null; }
    if (!gl) return false;
    cv.addEventListener('webglcontextlost', e => { e.preventDefault(); GL.perdido = true; }, false);
    cv.addEventListener('webglcontextrestored', () => location.reload(), false);
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    try { EQUIPO.gpu = String(dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)); } catch (e) { EQUIPO.gpu = ''; }
    this.aniso = gl.getExtension('EXT_texture_filter_anisotropic');
    if (this.aniso) this.anisoMax = gl.getParameter(this.aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT) || 1;
    this.ok = true;
    return true;
  },
  programa(vs, fs, nombre) {
    const sh = (tipo, src) => {
      const s = gl.createShader(tipo); gl.shaderSource(s, '#version 300 es\nprecision highp float;\nprecision highp int;\nprecision highp sampler2DArray;\nprecision highp sampler2DShadow;\n' + src); gl.compileShader(s);
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
      throw new Error('shader ' + P.nombre + ': ' + err.slice(0, 600));
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
  // arreglo de texturas chicas (16×16 los bloques, 64×64 las pieles): sin sangrado entre vecinas y con mipmaps propios
  texturaArreglo(w, h, capas, datos, mip, repetir) {
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D_ARRAY, t);
    gl.texImage3D(gl.TEXTURE_2D_ARRAY, 0, gl.RGBA8, w, h, capas, 0, gl.RGBA, gl.UNSIGNED_BYTE, datos);
    if (mip) { gl.generateMipmap(gl.TEXTURE_2D_ARRAY); gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR); }
    else gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    const wr = repetir ? gl.REPEAT : gl.CLAMP_TO_EDGE;
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, wr); gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, wr);
    return t;
  },
  anisotropia(t, n) {
    if (!this.aniso) return;
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, t);
    gl.texParameterf(gl.TEXTURE_2D_ARRAY, this.aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(n, this.anisoMax));
  },
  tam(t) { return t === gl.FLOAT || t === gl.INT || t === gl.UNSIGNED_INT ? 4 : t === gl.UNSIGNED_SHORT || t === gl.SHORT ? 2 : 1; },
  // búfer de vértices con su formato: [{k: componentes, t: tipo, norm}]; idx opcional
  malla(datos, formato, idx, dinamica) {
    const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, datos, dinamica ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW);
    let paso = 0; for (const f of formato) paso += f.k * this.tam(f.t);
    let o = 0;
    formato.forEach((f, i) => { gl.enableVertexAttribArray(i); gl.vertexAttribPointer(i, f.k, f.t, !!f.norm, paso, o); o += f.k * this.tam(f.t); });
    let ib = null;
    if (idx) { ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW); }
    gl.bindVertexArray(null);
    return { vao, vb, ib, n: idx ? idx.length : datos.byteLength / paso, paso, idx32: idx instanceof Uint32Array, nAtrib: formato.length };
  },
  // le suma a una malla un búfer de instancias (divisor 1) a partir del atributo nAtrib
  instancias(m, formato, capacidad) {
    gl.bindVertexArray(m.vao);
    const ib = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, ib);
    let paso = 0; for (const f of formato) paso += f.k * this.tam(f.t);
    gl.bufferData(gl.ARRAY_BUFFER, paso * capacidad, gl.DYNAMIC_DRAW);
    let o = 0;
    formato.forEach((f, i) => { const a = m.nAtrib + i; gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, f.k, f.t, !!f.norm, paso, o); gl.vertexAttribDivisor(a, 1); o += f.k * this.tam(f.t); });
    gl.bindVertexArray(null);
    m.inst = { b: ib, paso, cap: capacidad, datos: new Float32Array(paso / 4 * capacidad) };
    return m;
  },
  subir(m, n) { gl.bindBuffer(gl.ARRAY_BUFFER, m.inst.b); gl.bufferSubData(gl.ARRAY_BUFFER, 0, m.inst.datos, 0, n * m.inst.paso / 4); },
  borrarMalla(m) { if (!m) return; gl.deleteVertexArray(m.vao); gl.deleteBuffer(m.vb); if (m.ib) gl.deleteBuffer(m.ib); if (m.inst) gl.deleteBuffer(m.inst.b); },
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
  borrar(d) { if (!d) return; if (d.t) gl.deleteTexture(d.t); if (d.fb) gl.deleteFramebuffer(d.fb); },
};
