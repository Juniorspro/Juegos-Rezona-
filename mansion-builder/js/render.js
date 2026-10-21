// MANSION BUILDER — el render: bloques con sombra de esquina, sol con sombras, nubes que pasan, agua viva y niebla
const LUZ_GLSL = `
uniform vec3 uSolDir; uniform vec3 uSolCol; uniform vec3 uAmb; uniform vec3 uCielo;
uniform mat4 uSolVP; uniform sampler2DShadow uSombra; uniform float uConSombra;
uniform sampler2D uRuido; uniform float uT; uniform float uNubes;
uniform vec3 uCam; uniform vec3 uNiebla; uniform vec2 uNieblaD;
float sombra(vec3 p, vec3 n) {
  if (uConSombra < 0.5) return 1.0;
  vec4 s = uSolVP * vec4(p + n * 0.05, 1.0);
  vec3 q = s.xyz * 0.5 + 0.5;
  if (q.x <= 0.0 || q.y <= 0.0 || q.x >= 1.0 || q.y >= 1.0 || q.z >= 1.0) return 1.0;
  float d = q.z - 0.0012;
  vec2 tx = 0.75 / vec2(textureSize(uSombra, 0));
  float r = texture(uSombra, vec3(q.xy + vec2(-tx.x, -tx.y), d)) + texture(uSombra, vec3(q.xy + vec2(tx.x, -tx.y), d))
          + texture(uSombra, vec3(q.xy + vec2(-tx.x, tx.y), d)) + texture(uSombra, vec3(q.xy + vec2(tx.x, tx.y), d));
  return r * 0.25;
}
float nubes(vec3 p) {
  if (uNubes < 0.5) return 1.0;
  float n = texture(uRuido, p.xz * 0.016 + vec2(uT * 0.011, uT * 0.006)).r;
  return mix(1.0, 0.7, smoothstep(0.5, 0.7, n));
}
vec3 luz(vec3 base, vec3 n, vec3 p, float ao, float emis) {
  float ndl = max(dot(n, uSolDir), 0.0);
  float sh = sombra(p, n) * nubes(p);
  float aoF = 0.42 + 0.58 * ao;
  vec3 amb = mix(uAmb, uCielo, n.y * 0.5 + 0.5) * aoF;
  float relleno = max(dot(n, vec3(0.94, 0.29, -0.24)), 0.0) * aoF;
  vec3 c = base * (amb + uSolCol * ndl * sh * (0.6 + 0.4 * aoF) + vec3(0.26, 0.25, 0.22) * relleno);
  return mix(c, base * 1.25, emis);
}
vec3 niebla(vec3 c, vec3 p) { float d = distance(p, uCam); float f = 1.0 - exp(-max(d - uNieblaD.x, 0.0) * uNieblaD.y); return mix(c, uNiebla, clamp(f, 0.0, 1.0)); }
`;
const NORM_GLSL = `const vec3 NORM[7] = vec3[7](vec3(1,0,0), vec3(-1,0,0), vec3(0,1,0), vec3(0,-1,0), vec3(0,0,1), vec3(0,0,-1), vec3(0,1,0));`;
const VS_VOX = `
layout(location=0) in vec3 aPos; layout(location=1) in vec2 aUV; layout(location=2) in float aCapa;
layout(location=3) in float aCara; layout(location=4) in float aAO; layout(location=5) in float aFl;
uniform mat4 uVP; uniform float uT; uniform float uViento;
out vec3 vP; out vec2 vUV; flat out float vCapa; flat out int vCara; out float vAO; flat out int vFl;
void main() {
  vec3 p = aPos / 16.0;
  int fl = int(aFl + 0.5);
  if ((fl & 1) != 0) { float s = sin(uT * 2.1 + p.x * 0.9 + p.z * 0.7) + 0.5 * sin(uT * 3.3 + p.z * 1.3); p.x += s * 0.06 * uViento; p.z += s * 0.035 * uViento; }
  vP = p; vUV = aUV / 16.0; vCapa = aCapa; vCara = int(aCara + 0.5); vAO = aAO / 3.0; vFl = fl;
  gl_Position = uVP * vec4(p, 1.0);
}`;
const FS_VOX = `
uniform sampler2DArray uTex; uniform float uCorte;
in vec3 vP; in vec2 vUV; flat in float vCapa; flat in int vCara; in float vAO; flat in int vFl;
out vec4 o;
${NORM_GLSL}
${LUZ_GLSL}
void main() {
  vec4 t = texture(uTex, vec3(vUV, vCapa));
  if (t.a < uCorte) discard;
  vec3 n = NORM[vCara];
  float caraF = vCara == 2 ? 1.0 : vCara == 3 ? 0.6 : vCara == 6 ? 0.95 : (vCara == 4 ? 0.92 : 0.84);
  vec3 c = luz(t.rgb * caraF, n, vP, vCara == 6 ? 0.9 : vAO, (vFl & 2) != 0 ? 1.0 : 0.0);
  o = vec4(niebla(c, vP), 1.0);
}`;
const FS_VIDRIO = `
uniform sampler2DArray uTex;
in vec3 vP; in vec2 vUV; flat in float vCapa; flat in int vCara; in float vAO; flat in int vFl;
out vec4 o;
${NORM_GLSL}
${LUZ_GLSL}
void main() {
  vec4 t = texture(uTex, vec3(vUV, vCapa));
  vec3 n = NORM[vCara];
  vec3 v = normalize(uCam - vP);
  float fres = pow(1.0 - abs(dot(v, n)), 2.0);
  vec3 c = luz(t.rgb, n, vP, 1.0, 0.0) + uCielo * fres * 0.35;
  o = vec4(niebla(c, vP), clamp(t.a * 0.9 + fres * 0.25, 0.0, 1.0));
}`;
const FS_AGUA = `
in vec3 vP; in vec2 vUV; flat in float vCapa; flat in int vCara; in float vAO; flat in int vFl;
out vec4 o;
${LUZ_GLSL}
void main() {
  vec2 q = vP.xz;
  float n1 = texture(uRuido, q * 0.05 + vec2(uT * 0.018, uT * 0.011)).g;
  float n2 = texture(uRuido, q * 0.09 - vec2(uT * 0.014, -uT * 0.019)).g;
  float hondo = vAO;
  vec3 col = mix(vec3(0.30, 0.80, 0.84), vec3(0.09, 0.33, 0.64), clamp(hondo * 1.1 + 0.08, 0.0, 1.0));
  vec3 v = normalize(uCam - vP);
  vec3 nr = normalize(vec3((n1 - 0.5) * 0.9, 1.0, (n2 - 0.5) * 0.9));
  float fres = pow(1.0 - max(dot(v, nr), 0.0), 3.0);
  col = mix(col, uCielo * 1.05, fres * 0.55);
  float sp = pow(max(dot(reflect(-uSolDir, nr), v), 0.0), 48.0);
  col += uSolCol * sp * 0.9;
  float br = smoothstep(0.83, 0.93, (n1 + n2) * 0.5 + 0.06 * sin(uT * 2.7 + q.x * 1.3 + q.y));
  col += br * 0.3;
  if ((vFl & 4) != 0) col = mix(col, vec3(0.96, 0.98, 1.0), smoothstep(0.5, 0.7, n1 + 0.18 * sin(uT * 2.2 + q.x * 2.1 + q.y * 1.7)) * 0.7);
  col *= mix(0.72, 1.0, sombra(vP, vec3(0.0, 1.0, 0.0))) * mix(0.8, 1.0, nubes(vP));
  float a = mix(0.6, 0.9, clamp(hondo * 0.9 + fres, 0.0, 1.0));
  o = vec4(niebla(col, vP), a);
}`;
const VS_SOMBRA = `layout(location=0) in vec3 aPos; uniform mat4 uSolVP; void main() { gl_Position = uSolVP * vec4(aPos / 16.0, 1.0); }`;
const FS_SOMBRA = `out vec4 o; void main() { o = vec4(1.0); }`;
// cubos sueltos (instancias): lo que se carga, las pilas, la plata y los bloques que vuelan
const VS_CUBO = `
layout(location=0) in vec3 aPos; layout(location=1) in vec3 aN; layout(location=2) in vec2 aUV; layout(location=3) in float aCara;
layout(location=4) in vec3 iOff; layout(location=5) in float iEsc; layout(location=6) in float iRot; layout(location=7) in float iB;
uniform mat4 uVP; uniform vec4 uCaras[64];
out vec3 vP; out vec3 vN; out vec2 vUV; flat out float vCapa; flat out float vBrillo;
void main() {
  float c = cos(iRot), s = sin(iRot);
  vec3 e = iEsc < 0.0 ? vec3(-iEsc, -iEsc * 0.3, -iEsc * 0.56) : vec3(iEsc);
  vec3 p = aPos * e; p = vec3(p.x * c + p.z * s, p.y, -p.x * s + p.z * c);
  vN = vec3(aN.x * c + aN.z * s, aN.y, -aN.x * s + aN.z * c);
  vP = p + iOff; vUV = aUV;
  int b = int(iB + 0.5); vec4 f = uCaras[b & 63];
  int cara = int(aCara + 0.5);
  vCapa = cara == 0 ? f.x : cara == 2 ? f.z : cara == 3 ? f.w : f.y;
  vBrillo = float(b >> 6);
  gl_Position = uVP * vec4(vP, 1.0);
}`;
const FS_CUBO = `
uniform sampler2DArray uTex;
in vec3 vP; in vec3 vN; in vec2 vUV; flat in float vCapa; flat in float vBrillo;
out vec4 o;
${LUZ_GLSL}
void main() {
  vec4 t = texture(uTex, vec3(vUV, vCapa));
  if (t.a < 0.3) discard;
  float caraF = vN.y > 0.5 ? 1.0 : vN.y < -0.5 ? 0.6 : 0.88;
  vec3 c = luz(t.rgb * caraF, vN, vP, 1.0, 0.0);
  c = mix(c, vec3(1.0, 1.0, 0.85), vBrillo * 0.45);
  o = vec4(niebla(c, vP), 1.0);
}`;
// el plano fantasma de la obra: bloques celestes que muestran lo que falta
const FS_FANTASMA = `
in vec3 vP; in vec2 vUV; flat in float vCapa; flat in int vCara; in float vAO; flat in int vFl;
uniform float uT; uniform vec3 uColF;
out vec4 o;
void main() {
  vec2 e = min(vUV, 1.0 - vUV);
  float borde = 1.0 - smoothstep(0.03, 0.09, min(e.x, e.y));
  float barrido = smoothstep(0.0, 0.25, fract(vP.y * 0.25 - uT * 0.35)) * 0.12;
  o = vec4(uColF, 0.1 + barrido + borde * 0.55);
}`;
// partículas: cuadraditos que miran a la cámara
const VS_PART = `
layout(location=0) in vec2 aQ; layout(location=1) in vec4 iP; layout(location=2) in vec4 iC;
uniform mat4 uVP; uniform vec3 uDer; uniform vec3 uArr;
out vec4 vC; out vec2 vQ;
void main() { vec3 p = iP.xyz + (uDer * aQ.x + uArr * aQ.y) * iP.w; vC = iC; vQ = aQ; gl_Position = uVP * vec4(p, 1.0); }`;
const FS_PART = `
in vec4 vC; in vec2 vQ; out vec4 o;
void main() { float b = max(abs(vQ.x), abs(vQ.y)); vec3 c = b > 0.36 ? vC.rgb * 0.72 : vC.rgb; o = vec4(c, vC.a); }`;
// calcas en el piso: sombras de gota, zonas para desbloquear, la obra, la caja y los círculos de las pilas
const VS_CALCA = `
layout(location=0) in vec2 aQ; layout(location=1) in vec4 iA; layout(location=2) in vec4 iB;
uniform mat4 uVP;
out vec2 vQ; flat out vec4 vB; out vec2 vTam;
void main() { vec3 p = vec3(iA.x + aQ.x * iA.w * 0.5, iA.y, iA.z + aQ.y * iB.x * 0.5); vQ = aQ; vB = iB; vTam = vec2(iA.w, iB.x); gl_Position = uVP * vec4(p, 1.0); }`;
const FS_CALCA = `
in vec2 vQ; flat in vec4 vB; in vec2 vTam; uniform float uT; out vec4 o;
float caja(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
void main() {
  int k = int(vB.y + 0.5); float pr = vB.z;
  vec2 p = vQ * vTam * 0.5;
  if (k == 0) { float r = length(vQ); o = vec4(0.0, 0.0, 0.0, 0.32 * (1.0 - smoothstep(0.35, 1.0, r))); return; }
  float d = caja(p, vTam * 0.5 - 0.06, 0.32);
  if (d > 0.0) discard;
  float borde = smoothstep(-0.16, -0.1, d);
  float ang = atan(p.y, p.x), per = (abs(p.x) / (vTam.x * 0.5) > abs(p.y) / (vTam.y * 0.5)) ? p.y : p.x;
  if (k == 1) {
    float rayas = step(0.5, fract(per * 1.3 - uT * 0.6));
    float lleno = step(vQ.y * 0.5 + 0.5, pr);
    vec3 c = mix(vec3(0.12, 0.16, 0.22), vec3(0.36, 0.82, 0.36), lleno);
    float a = mix(0.42, 0.62, lleno);
    o = borde > 0.5 ? vec4(vec3(1.0), 0.95 * mix(0.55, 1.0, rayas)) : vec4(c, a);
  } else if (k == 2) {
    float rayas = step(0.5, fract((p.x + p.y) * 1.1 + uT * 0.5));
    vec3 cb = mix(vec3(0.12, 0.1, 0.08), vec3(1.0, 0.78, 0.16), rayas);
    float pulso = 0.32 + 0.12 * sin(uT * 4.0);
    o = borde > 0.5 ? vec4(cb, 0.95) : vec4(1.0, 0.86, 0.3, pulso);
  } else if (k == 3) {
    o = borde > 0.5 ? vec4(0.96, 1.0, 0.9, 0.95) : vec4(0.25, 0.7, 0.3, 0.42 + 0.08 * sin(uT * 3.0));
  } else {
    float r = length(vQ); float an = 1.0 - smoothstep(0.0, 0.08, abs(r - 0.86));
    o = vec4(1.0, 1.0, 1.0, an * (0.5 + 0.3 * sin(uT * 4.0 + vB.w)));
    if (r > 0.95) discard;
  }
}`;
// personajes de cajas con huesos (cabeza, cuerpo, brazos, piernas)
const VS_PJ = `
layout(location=0) in vec3 aPos; layout(location=1) in vec3 aN; layout(location=2) in vec2 aUV; layout(location=3) in float aH;
uniform mat4 uVP; uniform mat4 uH[8];
out vec3 vP; out vec3 vN; out vec2 vUV;
void main() { mat4 m = uH[int(aH + 0.5)]; vec4 p = m * vec4(aPos, 1.0); vP = p.xyz; vN = normalize(mat3(m) * aN); vUV = aUV; gl_Position = uVP * p; }`;
const FS_PJ = `
uniform sampler2DArray uPieles; uniform float uPiel; uniform float uDestello; uniform float uSilueta;
in vec3 vP; in vec3 vN; in vec2 vUV; out vec4 o;
${LUZ_GLSL}
void main() {
  vec4 t = texture(uPieles, vec3(vUV, uPiel));
  if (t.a < 0.5) discard;
  if (uSilueta > 0.5) { o = vec4(1.0, 0.84, 0.3, 0.6 - 0.25 * step(0.0, vN.y - 0.5)); return; }
  float caraF = vN.y > 0.5 ? 1.0 : vN.y < -0.5 ? 0.62 : 0.9;
  vec3 c = luz(t.rgb * caraF, vN, vP, 1.0, 0.0);
  c = mix(c, vec3(1.0), uDestello);
  o = vec4(niebla(c, vP), 1.0);
}`;

const R = {
  cv: null, cssW: 360, cssH: 640, dpr: 1, escala: 1, w: 1, h: 1,
  calidad: 2, conSombra: true, tamSombra: 2048, conNubes: true, viento: 1, maxPart: 600,
  V: M4.nueva(), P: M4.nueva(), VP: M4.nueva(), iVP: M4.nueva(), solVP: M4.nueva(),
  cam: [0, 0, 0], camDer: [1, 0, 0], camArr: [0, 1, 0],
  nieblaD: [34, 0.018], sol: [-0.45, 0.8, 0.5], solCol: [0.8, 0.74, 0.62], amb: [0.36, 0.4, 0.48], cielo: [0.46, 0.52, 0.62], niebla: [0.66, 0.82, 0.93],
  trozos: [], sombraSucia: true, ultimaSombra: -1, tex: null, ruido: null, pieles: null,
  stats: { dibujos: 0, tris: 0 },
  iniciar(cv) {
    this.cv = cv;
    if (!GL.iniciar(cv)) return false;
    this.pVox = GL.programa(VS_VOX, FS_VOX, 'vox');
    this.pVidrio = GL.programa(VS_VOX, FS_VIDRIO, 'vidrio');
    this.pAgua = GL.programa(VS_VOX, FS_AGUA, 'agua');
    this.pSombra = GL.programa(VS_SOMBRA, FS_SOMBRA, 'sombra');
    this.pCubo = GL.programa(VS_CUBO, FS_CUBO, 'cubo');
    this.pFant = GL.programa(VS_VOX, FS_FANTASMA, 'fantasma');
    this.pPart = GL.programa(VS_PART, FS_PART, 'part');
    this.pCalca = GL.programa(VS_CALCA, FS_CALCA, 'calca');
    this.pPJ = GL.programa(VS_PJ, FS_PJ, 'pj');
    this.tex = GL.texturaArreglo(16, 16, TEX.n, TEX.datos, true, true);
    this.ruido = GL.textura(64, 64, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, gl.LINEAR, texturaRuido(), true);
    this.cubo = this.mallaCubo();
    this.quadPart = GL.malla(new Float32Array([-0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5]), [{ k: 2, t: gl.FLOAT }], new Uint16Array([0, 1, 2, 0, 2, 3]));
    GL.instancias(this.quadPart, [{ k: 4, t: gl.FLOAT }, { k: 4, t: gl.FLOAT }], 1200);
    this.quadCalca = GL.malla(new Float32Array([-1, -1, 1, -1, 1, 1, -1, 1]), [{ k: 2, t: gl.FLOAT }], new Uint16Array([0, 1, 2, 0, 2, 3]));
    GL.instancias(this.quadCalca, [{ k: 4, t: gl.FLOAT }, { k: 4, t: gl.FLOAT }], 160);
    // las caras de cada bloque para los cubos sueltos
    this.caras = new Float32Array(64 * 4);
    for (let i = 0; i < 64; i++) { const P = BLOQ[i]; if (!P) continue; this.caras.set([P.f[0], P.f[1], P.f[2], P.f[3]], i * 4); }
    this.oceano = this.mallaOceano();
    for (let cz = 0; cz < NCZ; cz++) for (let cx = 0; cx < NCX; cx++) this.trozos.push({ cx, cz, op: null, cruz: null, agua: null, vidrio: null, y1: MY });
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK);
    this.ponerCalidad(this.calidad);
    return true;
  },
  // compila los shaders en tandas (para que la pantalla de carga no se congele)
  compilar() { for (const P of [this.pVox, this.pVidrio, this.pAgua, this.pSombra, this.pCubo, this.pFant, this.pPart, this.pCalca, this.pPJ]) GL.revisar(P); },
  mallaCubo() {
    const v = [], idx = [];
    // caras: 0 arriba, 1 costado, 2 abajo, 3 frente (+z)
    const caras = [[2, 0], [3, 2], [4, 3], [5, 1], [0, 1], [1, 1]];
    for (const [f, tipo] of caras) {
      const V = CARA_V[f], n = CARA_N[f], b = v.length / 9;
      for (let k = 0; k < 4; k++) v.push(V[k][0] - 0.5, V[k][1] - 0.5, V[k][2] - 0.5, n[0], n[1], n[2], CARA_UV[k][0] / 16, CARA_UV[k][1] / 16, tipo);
      idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    }
    const m = GL.malla(new Float32Array(v), [{ k: 3, t: gl.FLOAT }, { k: 3, t: gl.FLOAT }, { k: 2, t: gl.FLOAT }, { k: 1, t: gl.FLOAT }], new Uint16Array(idx));
    return GL.instancias(m, [{ k: 3, t: gl.FLOAT }, { k: 1, t: gl.FLOAT }, { k: 1, t: gl.FLOAT }, { k: 1, t: gl.FLOAT }], 1500);
  },
  // el mar alrededor de la grilla: un anillo de agua honda que llega al horizonte
  mallaOceano() {
    const M = Malla; M.empezar(); const y = 3.875, L = 400, capa = TEX.capa.agua;
    const rect = (x0, z0, x1, z1) => { const a = M.vert(x0, y, z1, 0, 0, capa, 2, 3, 8), b = M.vert(x1, y, z1, 0, 0, capa, 2, 3, 8), c = M.vert(x1, y, z0, 0, 0, capa, 2, 3, 8), d = M.vert(x0, y, z0, 0, 0, capa, 2, 3, 8); M.quad(a, b, c, d, false); };
    // en franjas para que la niebla y las olas se interpolen bien
    const paso = 16;
    for (let z = -L; z < MZ + L; z += paso) for (let x = -L; x < MX + L; x += paso) {
      const x1 = x + paso, z1 = z + paso;
      if (x1 > 0 && x < MX && z1 > 0 && z < MZ) {
        // recorta el hueco de la grilla
        if (x < 0) rect(x, z, 0, z1); if (x1 > MX) rect(MX, z, x1, z1);
        const ax = Math.max(x, 0), bx = Math.min(x1, MX);
        if (z < 0) rect(ax, z, bx, 0); if (z1 > MZ) rect(ax, MZ, bx, z1);
        continue;
      }
      rect(x, z, x1, z1);
    }
    const d = M.sacar();
    return this.mallaVox(d);
  },
  mallaVox(d) {
    return GL.malla(d.v, [{ k: 3, t: gl.SHORT }, { k: 2, t: gl.UNSIGNED_BYTE }, { k: 1, t: gl.UNSIGNED_BYTE }, { k: 1, t: gl.UNSIGNED_BYTE }, { k: 1, t: gl.UNSIGNED_BYTE }, { k: 1, t: gl.UNSIGNED_BYTE }], d.i);
  },
  ponerCalidad(n) {
    this.calidad = clamp(n, 0, 3);
    const q = [
      { esc: 0.6, sombra: 0, nubes: false, aniso: 1, part: 220, viento: 0.6 },
      { esc: 0.8, sombra: 1024, nubes: true, aniso: 2, part: 400, viento: 1 },
      { esc: 1, sombra: 2048, nubes: true, aniso: 4, part: 700, viento: 1 },
      { esc: 1, sombra: 2048, nubes: true, aniso: 8, part: 1100, viento: 1 },
    ][this.calidad];
    this.escala = q.esc; this.conNubes = q.nubes; this.maxPart = q.part; this.viento = q.viento;
    this.conSombra = q.sombra > 0;
    if (q.sombra && (!this.dSombra || this.dSombra.n !== q.sombra)) { GL.borrar(this.dSombra); this.dSombra = GL.destinoSombra(q.sombra); if (!this.dSombra.ok) { this.conSombra = false; } }
    this.sombraSucia = true;
    GL.anisotropia(this.tex, q.aniso);
    this.tamano(this.cssW, this.cssH, this.dpr);
  },
  tamano(cssW, cssH, dpr) {
    this.cssW = cssW; this.cssH = cssH; this.dpr = dpr;
    const tope = this.calidad >= 3 ? 3 : 2, k = Math.min(dpr, tope) * this.escala * (this.escalaDin || 1);
    const w = Math.max(1, Math.round(cssW * k)), h = Math.max(1, Math.round(cssH * k));
    if (this.cv.width !== w || this.cv.height !== h) { this.cv.width = w; this.cv.height = h; }
    this.cv.style.width = cssW + 'px'; this.cv.style.height = cssH + 'px';
    this.w = w; this.h = h;
  },
  // cámara de costado-arriba que sigue a un punto
  camara(tx, ty, tz, dist, pitch, yaw, fov) {
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    const ex = tx + Math.sin(yaw) * cp * dist, ey = ty + sp * dist, ez = tz + Math.cos(yaw) * cp * dist;
    this.cam[0] = ex; this.cam[1] = ey; this.cam[2] = ez;
    M4.mirar(this.V, ex, ey, ez, tx, ty, tz, 0, 1, 0);
    M4.persp(this.P, fov, this.w / this.h, 0.5, 520);
    M4.mul(this.VP, this.P, this.V);
    M4.inv(this.iVP, this.VP);
    const V = this.V; this.camDer = [V[0], V[4], V[8]]; this.camArr = [V[1], V[5], V[9]];
    this.planos = planosFrustum(this.VP);
  },
  // rehace los trozos sucios (pocos por cuadro para no trabar)
  actualizarTrozos(max) {
    let n = 0;
    for (const i of Mundo.sucios) {
      const T = this.trozos[i]; const m = mallarTrozo(T.cx, T.cz);
      for (const k of ['op', 'cruz', 'agua', 'vidrio']) { GL.borrarMalla(T[k]); T[k] = m[k] ? this.mallaVox(m[k]) : null; }
      Mundo.sucios.delete(i); this.sombraSucia = true;
      if (++n >= max) break;
    }
    return n;
  },
  calcularSol() {
    const s = this.sol, l = Math.hypot(s[0], s[1], s[2]), d = [s[0] / l, s[1] / l, s[2] / l];
    const c = [MX / 2, 10, MZ / 2], V = M4.nueva();
    M4.mirar(V, c[0] + d[0] * 80, c[1] + d[1] * 80, c[2] + d[2] * 80, c[0], c[1], c[2], 0, 1, 0);
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (const x of [0, MX]) for (const y of [0, 32]) for (const z of [0, MZ]) {
      const px = V[0] * x + V[4] * y + V[8] * z + V[12], py = V[1] * x + V[5] * y + V[9] * z + V[13], pz = V[2] * x + V[6] * y + V[10] * z + V[14];
      x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py); z0 = Math.min(z0, pz); z1 = Math.max(z1, pz);
    }
    const P = M4.orto(M4.nueva(), x0, x1, y0, y1, -z1 - 2, -z0 + 2);
    M4.mul(this.solVP, P, V);
    this.solN = d;
  },
  dibujarSombra(t) {
    if (!this.conSombra || !this.sombraSucia) return;
    if (t - this.ultimaSombra < 0.25 && this.ultimaSombra >= 0) return;
    this.ultimaSombra = t; this.sombraSucia = false;
    if (!this.solN) this.calcularSol();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.dSombra.fb);
    gl.viewport(0, 0, this.dSombra.n, this.dSombra.n);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    const u = GL.usar(this.pSombra);
    gl.uniformMatrix4fv(u.uSolVP, false, this.solVP);
    gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(1.5, 2);
    gl.disable(gl.CULL_FACE);
    for (const T of this.trozos) if (T.op) this.dibujarMalla(T.op);
    gl.enable(gl.CULL_FACE); gl.disable(gl.POLYGON_OFFSET_FILL);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  },
  dibujarMalla(m) { gl.bindVertexArray(m.vao); gl.drawElements(gl.TRIANGLES, m.n, m.idx32 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT, 0); this.stats.dibujos++; this.stats.tris += m.n / 3; },
  luzComun(u, t) {
    gl.uniform3fv(u.uSolDir, this.solN); gl.uniform3fv(u.uSolCol, this.solCol); gl.uniform3fv(u.uAmb, this.amb); gl.uniform3fv(u.uCielo, this.cielo);
    gl.uniformMatrix4fv(u.uSolVP, false, this.solVP); gl.uniform1f(u.uConSombra, this.conSombra ? 1 : 0);
    gl.uniform1f(u.uT, t); gl.uniform1f(u.uNubes, this.conNubes ? 1 : 0);
    gl.uniform3fv(u.uCam, this.cam); gl.uniform3fv(u.uNiebla, this.niebla); gl.uniform2f(u.uNieblaD, this.nieblaD[0], this.nieblaD[1]);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.conSombra ? this.dSombra.t : null); gl.uniform1i(u.uSombra, 1);
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, this.ruido); gl.uniform1i(u.uRuido, 2);
    if (u.uVP) gl.uniformMatrix4fv(u.uVP, false, this.VP);
  },
  visible(T) {
    const x0 = T.cx * CH, z0 = T.cz * CH;
    return cajaEnFrustum(this.planos, x0, 0, z0, x0 + CH, T.y1, z0 + CH);
  },
  // un cuadro entero: E trae personajes, cubos, calcas, partículas y el fantasma
  dibujar(E, t) {
    this.stats.dibujos = 0; this.stats.tris = 0;
    if (!this.solN) this.calcularSol();
    if (!this.conSombra) {
      // sin sombras igual hace falta una textura de comparación válida en la unidad
      if (!this.dSombraVacia) this.dSombraVacia = GL.destinoSombra(16);
    }
    this.dibujarSombra(t);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.w, this.h);
    gl.clearColor(this.niebla[0], this.niebla[1], this.niebla[2], 1);
    gl.depthMask(true); gl.disable(gl.BLEND);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const sombraTex = this.conSombra ? this.dSombra : this.dSombraVacia;
    const prep = (P) => { const u = GL.usar(P); this.luzComun(u, t); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, sombraTex.t); return u; };
    // 1) bloques opacos
    let u = prep(this.pVox);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.tex); gl.uniform1i(u.uTex, 0);
    gl.uniform1f(u.uViento, this.viento); gl.uniform1f(u.uCorte, -1);
    const vis = this.trozos.filter(T => this.visible(T));
    for (const T of vis) if (T.op) this.dibujarMalla(T.op);
    // 2) plantas (con recorte, sin descartar caras)
    gl.uniform1f(u.uCorte, 0.5); gl.disable(gl.CULL_FACE);
    for (const T of vis) if (T.cruz) this.dibujarMalla(T.cruz);
    gl.enable(gl.CULL_FACE);
    // 3) personajes
    if (E.personajes && E.personajes.length) this.dibujarPersonajes(E.personajes, t, prep);
    // 4) cubos sueltos
    if (E.nCubos) {
      u = prep(this.pCubo);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.tex); gl.uniform1i(u.uTex, 0);
      gl.uniform4fv(u.uCaras, this.caras);
      GL.subir(this.cubo, E.nCubos);
      gl.bindVertexArray(this.cubo.vao); gl.drawElementsInstanced(gl.TRIANGLES, this.cubo.n, gl.UNSIGNED_SHORT, 0, E.nCubos); this.stats.dibujos++;
    }
    // 5) calcas del piso
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
    if (E.nCalcas) {
      u = GL.usar(this.pCalca); gl.uniformMatrix4fv(u.uVP, false, this.VP); gl.uniform1f(u.uT, t);
      gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(-2, -4); gl.disable(gl.CULL_FACE);
      GL.subir(this.quadCalca, E.nCalcas);
      gl.bindVertexArray(this.quadCalca.vao); gl.drawElementsInstanced(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0, E.nCalcas); this.stats.dibujos++;
      gl.disable(gl.POLYGON_OFFSET_FILL); gl.enable(gl.CULL_FACE);
    }
    // 6) agua (mar + islas) y vidrio, de atrás para adelante
    u = prep(this.pAgua);
    this.dibujarMalla(this.oceano);
    const orden = vis.slice().sort((a, b) => dist2T(b, this.cam) - dist2T(a, this.cam));
    for (const T of orden) if (T.agua) this.dibujarMalla(T.agua);
    u = prep(this.pVidrio);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.tex); gl.uniform1i(u.uTex, 0);
    gl.disable(gl.CULL_FACE);
    for (const T of orden) if (T.vidrio) this.dibujarMalla(T.vidrio);
    gl.enable(gl.CULL_FACE);
    // 7) el fantasma de la obra
    if (E.fantasma) {
      u = GL.usar(this.pFant); gl.uniformMatrix4fv(u.uVP, false, this.VP); gl.uniform1f(u.uT, t); gl.uniform3fv(u.uColF, E.colFantasma || [0.45, 0.85, 1.0]);
      gl.uniform1f(u.uViento, 0);
      this.dibujarMalla(E.fantasma);
    }
    // 8) partículas
    if (E.nPart) {
      u = GL.usar(this.pPart); gl.uniformMatrix4fv(u.uVP, false, this.VP); gl.uniform3fv(u.uDer, this.camDer); gl.uniform3fv(u.uArr, this.camArr);
      GL.subir(this.quadPart, E.nPart);
      gl.bindVertexArray(this.quadPart.vao); gl.drawElementsInstanced(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0, E.nPart); this.stats.dibujos++;
    }
    // la silueta del constructor cuando lo tapa algo
    if (E.personajes && E.personajes.length) {
      const p = E.personajes[0], u2 = GL.usar(this.pPJ);
      gl.depthFunc(gl.GREATER);
      gl.uniformMatrix4fv(u2.uVP, false, this.VP); gl.uniformMatrix4fv(u2.uH, false, p.huesos); gl.uniform1f(u2.uPiel, p.piel); gl.uniform1f(u2.uSilueta, 1);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.pieles); gl.uniform1i(u2.uPieles, 0);
      this.dibujarMalla(p.malla);
      gl.uniform1f(u2.uSilueta, 0); gl.depthFunc(gl.LEQUAL);
    }
    gl.depthMask(true); gl.disable(gl.BLEND);
    gl.bindVertexArray(null);
  },
  dibujarPersonajes(lista, t, prep) {
    const u = prep(this.pPJ);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.pieles); gl.uniform1i(u.uPieles, 0);
    for (const p of lista) {
      if (!cajaEnFrustum(this.planos, p.x - 1.2, SUELO - 0.2, p.z - 1.2, p.x + 1.2, SUELO + 3, p.z + 1.2)) continue;
      gl.uniformMatrix4fv(u.uH, false, p.huesos);
      gl.uniform1f(u.uPiel, p.piel); gl.uniform1f(u.uDestello, p.destello || 0);
      this.dibujarMalla(p.malla);
    }
  },
};
function dist2T(T, c) { const x = T.cx * CH + CH / 2 - c[0], z = T.cz * CH + CH / 2 - c[2]; return x * x + z * z; }
// los seis planos del frustum (para no dibujar trozos fuera de cámara)
function planosFrustum(m) {
  const p = [], f = (a, b, c, d) => { const l = Math.hypot(a, b, c); p.push([a / l, b / l, c / l, d / l]); };
  f(m[3] + m[0], m[7] + m[4], m[11] + m[8], m[15] + m[12]); f(m[3] - m[0], m[7] - m[4], m[11] - m[8], m[15] - m[12]);
  f(m[3] + m[1], m[7] + m[5], m[11] + m[9], m[15] + m[13]); f(m[3] - m[1], m[7] - m[5], m[11] - m[9], m[15] - m[13]);
  f(m[3] + m[2], m[7] + m[6], m[11] + m[10], m[15] + m[14]); f(m[3] - m[2], m[7] - m[6], m[11] - m[10], m[15] - m[14]);
  return p;
}
function cajaEnFrustum(P, x0, y0, z0, x1, y1, z1) {
  for (const [a, b, c, d] of P) if (a * (a > 0 ? x1 : x0) + b * (b > 0 ? y1 : y0) + c * (c > 0 ? z1 : z0) + d < 0) return false;
  return true;
}
