// SIETE COLORES — el dibujo: sombra del sol, escena a la resolución del juego (color + normal + profundidad),
// cielo, agua, carteles que miran a la cámara, puntitos, y una pasada final con contorno de tinta, tramado y paleta.
const SH_COMUN = `
uniform vec3 uSolDir, uSolCol, uAmbA, uAmbB, uNiebla, uNieblaSol, uCam;
uniform float uDens, uSombraOn;
uniform highp sampler2DShadow uSombraT, uSombraD;
uniform mat4 uLuzVP, uLuzVPD;
float muestra(highp sampler2DShadow m, mat4 vp, vec3 p, float sesgo){
  vec4 q = vp * vec4(p, 1.0);
  vec3 s = q.xyz / q.w * 0.5 + 0.5;
  if (s.x < 0.0 || s.y < 0.0 || s.x > 1.0 || s.y > 1.0 || s.z > 1.0) return 1.0;
  return texture(m, vec3(s.xy, s.z - sesgo));
}
// el terreno en un mapa fijo (se rehace poco) y los muñecos en uno chico que sigue a Killa
float sombra(vec3 p, vec3 n){
  if (uSombraOn < 0.5) return 1.0;
  vec3 q = p + n * 0.07;
  return min(muestra(uSombraT, uLuzVP, q, 0.0006), muestra(uSombraD, uLuzVPD, q, 0.002));
}
vec3 aces(vec3 x){ x *= 0.62; return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
vec3 niebla(vec3 c, vec3 p){
  vec3 d = p - uCam; float dist = length(d);
  float f = 1.0 - exp(-dist * uDens);
  f *= clamp(1.3 - (p.y - 10.0) / 46.0, 0.3, 1.0);
  float s = pow(max(dot(d / max(dist, 0.001), uSolDir), 0.0), 5.0);
  return mix(c, mix(uNiebla, uNieblaSol, s), clamp(f, 0.0, 1.0));
}
vec3 revelar(vec3 c){ return pow(aces(c), vec3(1.0 / 2.2)); }
vec3 luzDe(vec3 alb, vec3 p, vec3 n, float ao){
  float ndl = max(dot(n, uSolDir), 0.0);
  float sh = ndl > 0.0 ? sombra(p, n) : 0.0;
  vec3 amb = mix(uAmbB, uAmbA, n.y * 0.5 + 0.5);
  return alb * (uSolCol * ndl * sh * mix(0.7, 1.0, ao) + amb * mix(0.32, 1.0, ao));
}
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float h31(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
`;
const SH = {
  voxVS: `
layout(location=0) in uvec4 aP;
layout(location=1) in uvec4 aI;
uniform mat4 uVP; uniform vec3 uTrozo; uniform float uT;
out vec3 vP; out float vAO; flat out int vT; flat out int vC;
void main(){
  vec3 p = vec3(aP.xyz) + uTrozo;
  if (aI.w == 1u) p.y -= 0.16 - 0.05 * sin(uT * 1.7 + p.x * 0.8 + p.z * 0.6);
  vP = p; vAO = float(aI.z) / 3.0; vT = int(aI.x); vC = int(aI.y);
  gl_Position = uVP * vec4(p, 1.0);
}`,
  voxFS: SH_COMUN + `
in vec3 vP; in float vAO; flat in int vT; flat in int vC;
uniform sampler2D uPal; uniform float uSat[8]; uniform vec4 uOla; uniform int uOlaG; uniform float uT;
layout(location=0) out vec4 oC; layout(location=1) out vec4 oN;
const vec3 NOR[6] = vec3[6](vec3(1,0,0), vec3(-1,0,0), vec3(0,1,0), vec3(0,-1,0), vec3(0,0,1), vec3(0,0,-1));
void main(){
  vec3 n = NOR[vC];
  vec3 cel = floor(vP - n * 0.5);
  vec2 uv = vC < 2 ? vec2(vP.z, vP.y) : (vC < 4 ? vP.xz : vP.xy);
  vec2 t = floor(fract(uv) * 8.0);
  vec4 pa = texelFetch(uPal, ivec2(vT, 2), 0);
  int grupo = int(pa.r * 255.0 + 0.5), pat = int(pa.g * 255.0 + 0.5);
  bool arriba = vC == 2;
  vec3 c = texelFetch(uPal, ivec2(vT, arriba ? 0 : 1), 0).rgb;
  float hx = h31(vec3(t, 0.0) + cel * vec3(8.13, 5.71, 3.37));
  float m = 0.92 + 0.16 * hx;
  if (pat == 1) {                              // adobe: ladrillos con junta
    if (!arriba) { float fila = floor(t.y / 4.0); float col = mod(t.x + mod(fila, 2.0) * 4.0, 8.0); m = (mod(t.y, 4.0) > 2.5 || col > 6.5) ? 0.88 : 0.95 + 0.08 * hx; }
  } else if (pat == 2) {                       // pirca: piedras irregulares
    vec2 q = vec2(t.x + (mod(floor(t.y / 3.0), 2.0) * 1.5), t.y); vec2 id = floor(q / vec2(3.0, 3.0)); vec2 f = mod(q, vec2(3.0, 3.0));
    float hh = h21(id + cel.xz * 3.0 + cel.y); m = (f.x < 0.6 || f.y < 0.6) ? 0.6 : 0.82 + 0.3 * hh;
  } else if (pat == 3 || pat == 19) {          // madera / puerta
    m = (mod(t.x, 3.0) < 0.5 ? 0.72 : 0.92 + 0.12 * h21(vec2(floor(t.x / 3.0), t.y * 0.0) + cel.xz)) * (pat == 19 && t.y == 4.0 && t.x > 5.0 ? 1.6 : 1.0);
  } else if (pat == 4) {                       // pasto: puna seca, el costado con borde de pasto
    if (arriba) { m = 0.84 + 0.32 * hx; if (hx > 0.86) c *= vec3(0.8, 0.9, 0.6); }
    else if (t.y >= 6.0 - floor(h21(vec2(t.x, cel.x + cel.z)) * 2.0)) { c = texelFetch(uPal, ivec2(vT, 0), 0).rgb; m = 0.82 + 0.2 * hx; }
  } else if (pat == 6) {                       // sal: costras con bordes claros
    if (arriba) { vec2 q = vec2(t.x + mod(floor(t.y / 4.0), 2.0) * 2.0, t.y); m = (mod(q.x, 4.0) < 0.5 || mod(q.y, 4.0) < 0.5) ? 1.06 : 0.95 + 0.04 * hx; }
  } else if (pat == 7) {                       // paja del techo
    m = 0.78 + 0.3 * h21(vec2(t.x * 0.0 + floor(t.x / 2.0), t.y) + cel.xz * 1.7);
    if (!arriba && t.y < 1.0) m *= 0.7;
  } else if (pat == 8) {                       // tela de aguayo: franjas de colores
    float f = floor((arriba ? t.x : t.y) / 2.0);
    float k = h21(vec2(f, cel.x * 1.3 + cel.z * 2.1 + cel.y));
    c = k < 0.2 ? vec3(0.86, 0.22, 0.2) : k < 0.4 ? vec3(0.96, 0.75, 0.2) : k < 0.6 ? vec3(0.2, 0.62, 0.42) : k < 0.8 ? vec3(0.86, 0.3, 0.6) : vec3(0.95, 0.92, 0.85);
    m = mod((arriba ? t.y : t.x), 4.0) < 0.5 ? 0.82 : 1.0;
  } else if (pat == 9) {                       // estrato: vetas finas
    float v = h21(vec2(floor((t.y + floor(h21(vec2(t.x, cel.y)) * 1.5)) * 0.5), cel.y * 3.1 + floor(cel.x / 4.0)));
    m = 0.86 + 0.18 * v + 0.06 * hx;
    if (hx > 0.94) m *= 0.78;
  } else if (pat == 10) {                      // cardón: costillas y espinas
    m = mod(t.x, 2.0) < 1.0 ? 1.06 : 0.8;
    if (!arriba && h21(t + cel.xy) > 0.92) { c = vec3(0.95, 0.92, 0.8); m = 1.0; }
  } else if (pat == 11) { m = 0.95 + 0.06 * hx; }
  else if (pat == 12) { m = 0.85 + 0.15 * hx; if ((t.x == 1.0 || t.x == 6.0) && (t.y == 1.0 || t.y == 6.0)) m = 1.35; }
  else if (pat == 13) { m = hx > 0.8 ? 0.62 : 0.85 + 0.32 * h21(t + cel.xz * 2.0 + cel.y); }
  else if (pat == 14) {                        // baldosas
    vec2 tl = floor(t / 4.0); m = (mod(t.x, 4.0) < 0.5 || mod(t.y, 4.0) < 0.5) ? 0.78 : 0.93 + 0.1 * h21(tl + cel.xz * 2.0);
  } else if (pat == 15) { m = 0.97 + 0.04 * hx; if (!arriba && t.y < 1.0 && mod(cel.y, 3.0) < 0.5) m = 0.88; }
  else if (pat == 16) { m = 0.9 + 0.14 * hx; if (hx > 0.9) m = 1.12; }
  else if (pat == 17) {                        // flor de cardón
    if (arriba) { vec2 d = t - 3.5; float r = length(d); if (r < 1.6) { c = vec3(0.98, 0.78, 0.25); m = 1.0; } else m = 0.95 + 0.08 * hx; }
  } else if (pat == 18) {                      // piedra del sol: el sol grabado
    vec2 d = t - 3.5; float r = length(d); m = 0.92 + 0.1 * hx;
    if ((r > 1.5 && r < 2.5) || (r > 2.8 && mod(atan(d.y, d.x) * 2.546, 2.0) < 0.9)) m = 0.6;
  }
  // los grabados se apagan con la distancia (lejos titilan)
  float dist = distance(vP, uCam);
  m = mix(1.0, m, clamp(1.4 - dist / 34.0, 0.0, 1.0));
  c *= m;
  c = pow(c, vec3(2.2));
  // el color robado: gris hasta que vuelve (con una ola que se expande desde donde se devolvió)
  if (grupo > 0) {
    float s = uSat[grupo];
    float brillo = 0.0;
    if (grupo == uOlaG) { float dd = distance(vP, uOla.xyz); s = max(s, clamp((uOla.w - dd) / 6.0, 0.0, 1.0)); brillo = max(0.0, 1.0 - abs(uOla.w - dd) / 2.5) * step(dd, uOla.w + 2.5); }
    float g = dot(c, vec3(0.3, 0.55, 0.15));
    c = mix(vec3(g) * vec3(0.92, 0.95, 1.05), c, s);
    c += brillo * vec3(1.6, 1.5, 1.2) * c + brillo * 0.08;
  }
  vec3 col = luzDe(c, vP, n, vAO);
  col = niebla(col, vP);
  oC = vec4(revelar(col), 1.0);
  oN = vec4(n * 0.5 + 0.5, 1.0);
}`,
  sombraVS: `
layout(location=0) in uvec4 aP;
uniform mat4 uVP; uniform vec3 uTrozo;
void main(){ gl_Position = uVP * vec4(vec3(aP.xyz) + uTrozo, 1.0); }`,
  vacioFS: `void main(){}`,
  munVS: `
layout(location=0) in vec3 aP; layout(location=1) in vec4 aN; layout(location=2) in uvec4 aC;
uniform mat4 uVP; uniform mat4 uPar[16];
out vec3 vP; out vec3 vN; out vec3 vCol;
void main(){
  mat4 M = uPar[aC.w];
  vec4 w = M * vec4(aP, 1.0);
  vP = w.xyz; vN = normalize(mat3(M) * aN.xyz); vCol = vec3(aC.rgb) / 255.0;
  gl_Position = uVP * w;
}`,
  munFS: SH_COMUN + `
in vec3 vP; in vec3 vN; in vec3 vCol;
uniform vec3 uTinte; uniform float uBrillo;
layout(location=0) out vec4 oC; layout(location=1) out vec4 oN;
void main(){
  vec3 n = normalize(vN);
  vec3 alb = pow(vCol, vec3(2.2)) * uTinte;
  vec3 col = luzDe(alb, vP, n, 1.0) + alb * uBrillo;
  col = niebla(col, vP);
  oC = vec4(revelar(col), 1.0); oN = vec4(n * 0.5 + 0.5, 1.0);
}`,
  munSombraVS: `
layout(location=0) in vec3 aP; layout(location=2) in uvec4 aC;
uniform mat4 uVP; uniform mat4 uPar[16];
void main(){ gl_Position = uVP * (uPar[aC.w] * vec4(aP, 1.0)); }`,
  cartVS: `
layout(location=0) in vec2 aQ;
layout(location=1) in vec4 aI;
layout(location=2) in vec4 aS;
uniform mat4 uVP; uniform vec3 uDer; uniform float uT;
out vec2 vUV; out vec3 vP; flat out int vTi;
void main(){
  float s = aI.w;
  vec3 p = aI.xyz + uDer * aQ.x * s + vec3(0.0, aQ.y * s, 0.0);
  p.xz += vec2(sin(uT * 1.9 + aI.x * 0.43 + aI.z * 0.31), cos(uT * 1.4 + aI.z * 0.5)) * 0.09 * aQ.y * s * aS.y;
  p.y += aS.z * sin(uT * 2.2 + aI.x);
  vUV = vec2((aS.x + aQ.x + 0.5) / 16.0, 1.0 - aQ.y);
  vP = p; vTi = int(aS.w + 0.5);
  gl_Position = uVP * vec4(p, 1.0);
}`,
  cartFS: SH_COMUN + `
in vec2 vUV; in vec3 vP; flat in int vTi;
uniform sampler2D uAtlas; uniform vec3 uTintes[8];
layout(location=0) out vec4 oC; layout(location=1) out vec4 oN;
void main(){
  vec4 t = texture(uAtlas, vUV);
  if (t.a < 0.5) discard;
  vec3 alb = pow(t.rgb, vec3(2.2));
  float brillo = 0.0;
  if (vTi > 0) { alb *= uTintes[vTi]; brillo = 1.4; }
  vec3 col = luzDe(alb, vP, normalize(vec3(uSolDir.x, 0.6, uSolDir.z)), 0.85) + alb * brillo;
  col = niebla(col, vP);
  oC = vec4(revelar(col), 1.0); oN = vec4(0.5, 1.0, 0.5, 1.0);
}`,
  cieloVS: `
const vec2 V[3] = vec2[3](vec2(-1, -1), vec2(3, -1), vec2(-1, 3));
out vec2 vN;
void main(){ vN = V[gl_VertexID]; gl_Position = vec4(V[gl_VertexID], 1.0, 1.0); }`,
  cieloFS: `
in vec2 vN;
uniform mat4 uIVP; uniform vec3 uCam, uSolDir, uSolCol, uCenit, uHoriz, uNiebla, uNieblaSol, uMontes; uniform float uT;
layout(location=0) out vec4 oC; layout(location=1) out vec4 oN;
float h11(float x){ return fract(sin(x * 91.7) * 43758.5); }
float r1(float x){ float i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(h11(i), h11(i + 1.0), f); }
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float r2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
vec3 aces(vec3 x){ x *= 0.62; return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
void main(){
  vec4 q = uIVP * vec4(vN, 1.0, 1.0);
  vec3 d = normalize(q.xyz / q.w - uCam);
  float h = d.y, s = max(dot(d, uSolDir), 0.0);
  vec3 c = mix(uHoriz, uCenit, pow(clamp(h, 0.0, 1.0), 0.55));
  c = mix(c, uNieblaSol, pow(s, 6.0) * 0.7 * (1.0 - clamp(h, 0.0, 1.0)));
  c += uSolCol * pow(s, 60.0) * 0.5;
  if (s > 0.9985) c = uSolCol * 2.2 + vec3(1.0);
  // nubes chatas, iluminadas desde el sol
  if (h > 0.02) {
    vec2 p = d.xz / (h + 0.06) * 2.2 + vec2(uT * 0.02, 0.0);
    float n = r2(p) * 0.55 + r2(p * 2.1 + 3.0) * 0.3 + r2(p * 4.3 + 7.0) * 0.15;
    float k = smoothstep(0.56, 0.7, n) * smoothstep(0.02, 0.2, h);
    vec3 nc = mix(uNiebla * 0.95, vec3(1.0, 0.92, 0.85) * 1.15 + uSolCol * 0.25 * pow(s, 3.0), clamp(n * 1.6 - 0.6, 0.0, 1.0));
    c = mix(c, nc, k * 0.85);
  }
  // la cordillera lejana
  float az = atan(d.z, d.x);
  float cr = 0.035 + 0.06 * r1(az * 3.0 + 1.0) + 0.03 * r1(az * 9.0) + 0.012 * r1(az * 27.0);
  if (h < cr) { float kk = clamp((cr - h) * 30.0, 0.0, 1.0); c = mix(c, mix(uMontes, uNiebla, 0.35 + 0.4 * clamp(h * 8.0, 0.0, 1.0)), 0.75 + 0.25 * kk); if (cr - h < 0.006 && h > 0.0) c = mix(c, vec3(1.0), 0.35); }
  oC = vec4(pow(aces(c), vec3(1.0 / 2.2)), 1.0); oN = vec4(0.5, 0.5, 0.5, 0.0);
}`,
  aguaFS: SH_COMUN + `
in vec3 vP; in float vAO; flat in int vT; flat in int vC;
uniform float uT;
layout(location=0) out vec4 oC;
void main(){
  vec2 t = floor(vP.xz * 8.0);
  float w = sin(t.x * 0.35 + uT * 2.0) * 0.5 + sin(t.y * 0.45 - uT * 1.6) * 0.5;
  vec3 base = pow(vec3(0.22, 0.6, 0.68), vec3(2.2));
  vec3 n = vec3(0.0, 1.0, 0.0);
  vec3 col = luzDe(base * (0.85 + 0.15 * w), vP, n, 1.0);
  vec3 v = normalize(uCam - vP), r = reflect(-v, n);
  float sp = pow(max(dot(r, uSolDir), 0.0), 80.0);
  float ch = step(0.985, h21(t + floor(uT * 3.0))) * sp * 30.0;
  col += uSolCol * (sp * 2.0 + ch);
  col = niebla(col, vP);
  oC = vec4(revelar(col), 0.74);
}`,
  ptoVS: `
layout(location=0) in vec4 aP; layout(location=1) in vec4 aC;
uniform mat4 uVP; uniform float uEsc;
out vec4 vC;
void main(){ vec4 c = uVP * vec4(aP.xyz, 1.0); gl_Position = c; gl_PointSize = clamp(aP.w * uEsc / c.w, 1.0, 5.0); vC = aC; }`,
  ptoFS: `
in vec4 vC;
layout(location=0) out vec4 oC;
void main(){ oC = vC; }`,
  postVS: `
const vec2 V[3] = vec2[3](vec2(-1, -1), vec2(3, -1), vec2(-1, 3));
void main(){ gl_Position = vec4(V[gl_VertexID], 0.0, 1.0); }`,
  postFS: `
uniform sampler2D uC, uN, uD; uniform vec2 uNF; uniform float uNiv; uniform vec3 uTinta; uniform float uFundido; uniform vec3 uFundidoC;
out vec4 oC;
const float BAYER[16] = float[16](0.0, 8.0, 2.0, 10.0, 12.0, 4.0, 14.0, 6.0, 3.0, 11.0, 1.0, 9.0, 15.0, 7.0, 13.0, 5.0);
float lin(float d){ float z = d * 2.0 - 1.0; return 2.0 * uNF.x * uNF.y / (uNF.y + uNF.x - z * (uNF.y - uNF.x)); }
void main(){
  ivec2 p = ivec2(gl_FragCoord.xy), mx = textureSize(uC, 0) - 1;
  vec3 c = texelFetch(uC, p, 0).rgb;
  float d0 = lin(texelFetch(uD, p, 0).r);
  vec4 nn = texelFetch(uN, p, 0);
  vec3 n0 = nn.xyz * 2.0 - 1.0;
  float lejos = 0.0, pliegue = 0.0;
  ivec2 O[4] = ivec2[4](ivec2(1, 0), ivec2(-1, 0), ivec2(0, 1), ivec2(0, -1));
  for (int i = 0; i < 4; i++) {
    ivec2 q = clamp(p + O[i], ivec2(0), mx);
    float dq = lin(texelFetch(uD, q, 0).r);
    lejos = max(lejos, dq - d0);
    vec4 nq4 = texelFetch(uN, q, 0);
    if (abs(dq - d0) < 0.06 * d0 + 0.25 && nq4.a > 0.5) pliegue = max(pliegue, 1.0 - dot(n0, nq4.xyz * 2.0 - 1.0));
  }
  if (nn.a > 0.5) {
    if (lejos > 0.07 * d0 + 0.35) c = mix(c, uTinta, 0.62);
    else if (pliegue > 0.5 && n0.y > 0.5) c = mix(c, vec3(1.0, 0.96, 0.88), 0.16);
  }
  c = mix(c, uFundidoC, uFundido);
  float b = (BAYER[(p.y & 3) * 4 + (p.x & 3)] + 0.5) / 16.0;
  c = floor(c * uNiv + b) / uNiv;
  oC = vec4(c, 1.0);
}`,
};

const R = {
  listo: false, fb: null, som: null, P: {}, trozos: [], pal: null, atlas: null, cart: null, ptoBuf: null, tintes: new Float32Array(24),
  cam: { x: 100, y: 30, z: 150, yaw: 0, pitch: -0.3, fovY: 1.0, near: 0.15, far: 170 },
  V: M4.nueva(), Pm: M4.nueva(), VP: M4.nueva(), IVP: M4.nueva(), luzV: M4.nueva(), luzP: M4.nueva(), luzVP: M4.nueva(), planos: null, planosLuz: null,
  sol: { dir: [0.5, 0.6, 0.3], col: [3.1, 2.5, 1.85] }, amb: { a: [0.3, 0.38, 0.56], b: [0.3, 0.22, 0.16] },
  cielo: { cenit: [0.12, 0.3, 0.8], horiz: [0.8, 0.7, 0.66], montes: [0.42, 0.36, 0.52] }, niebla: { col: [0.84, 0.72, 0.64], sol: [1.25, 0.85, 0.55], dens: 0.0028 },
  sat: new Float32Array(8), ola: [0, 0, 0, -1], olaG: -1, fundido: 0, fundidoC: [0, 0, 0],
  calidad: 'media', sombraN: 1024, sombraOn: true, niveles: 20, tinta: [0.1, 0.06, 0.14],
  stats: { llamadas: 0, tris: 0 },
  iniciar() {
    const P = this.P;
    P.vox = GL.programa(SH.voxVS, SH.voxFS, 'vox'); P.som = GL.programa(SH.sombraVS, SH.vacioFS, 'sombra');
    P.mun = GL.programa(SH.munVS, SH.munFS, 'mun'); P.munSom = GL.programa(SH.munSombraVS, SH.vacioFS, 'munSom');
    P.cart = GL.programa(SH.cartVS, SH.cartFS, 'cart'); P.cielo = GL.programa(SH.cieloVS, SH.cieloFS, 'cielo');
    P.agua = GL.programa(SH.voxVS, SH.aguaFS, 'agua'); P.pto = GL.programa(SH.ptoVS, SH.ptoFS, 'pto'); P.post = GL.programa(SH.postVS, SH.postFS, 'post');
    this.vacio = gl.createVertexArray();
    // paleta de bloques
    const pal = new Uint8Array(64 * 4 * 4);
    BLOQUES.forEach((b, i) => {
      const a = hexRgb(b[1]), l = hexRgb(b[2]);
      pal.set([a[0], a[1], a[2], 255], i * 4); pal.set([l[0], l[1], l[2], 255], (64 + i) * 4); pal.set([b[3], b[4], 0, 255], (128 + i) * 4);
    });
    this.pal = GL.textura(64, 4, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, gl.NEAREST, pal);
    this.atlas = GL.texturaLienzo(atlasCarteles());
    // cuadradito de los carteles
    this.cuad = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this.cuad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-0.5, 0, 0.5, 0, 0.5, 1, -0.5, 0, 0.5, 1, -0.5, 1]), gl.STATIC_DRAW);
    this.ptoBuf = gl.createBuffer(); this.ptoVao = gl.createVertexArray();
    gl.bindVertexArray(this.ptoVao); gl.bindBuffer(gl.ARRAY_BUFFER, this.ptoBuf);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 32, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 32, 16);
    gl.bindVertexArray(null);
    this.listo = true;
  },
  ponerCalidad(c) {
    this.calidad = c;
    this.sombraOn = c !== 'baja';
    const n = c === 'alta' ? 2048 : 1536;
    if (this.sombraOn && (!this.som || this.som.n !== n)) { GL.borrar(this.som); this.som = GL.destinoSombra(n); this.sucio = true; }
    if (this.sombraOn && !this.somD) this.somD = GL.destinoSombra(512);
    this.cam.far = c === 'baja' ? 110 : c === 'media' ? 150 : 175;
  },
  tamano(w, h) {
    if (this.fb && this.fb.w === w && this.fb.h === h) return;
    GL.borrar(this.fb); this.fb = GL.destinoEscena(w, h);
  },
  subirTrozo(cx, cz, m) {
    let T = this.trozos[cz * NCX + cx];
    if (!T) T = this.trozos[cz * NCX + cx] = { cx, cz, x0: cx * CH, z0: cz * CH };
    for (const k of ['solido', 'agua']) {
      const d = m[k];
      if (T[k]) { gl.deleteVertexArray(T[k].vao); gl.deleteBuffer(T[k].vb); gl.deleteBuffer(T[k].ib); T[k] = null; }
      if (!d.i.length) continue;
      const vao = gl.createVertexArray(), vb = gl.createBuffer(), ib = gl.createBuffer();
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, d.v, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0); gl.vertexAttribIPointer(0, 4, gl.UNSIGNED_BYTE, 8, 0);
      gl.enableVertexAttribArray(1); gl.vertexAttribIPointer(1, 4, gl.UNSIGNED_BYTE, 8, 4);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, d.i, gl.STATIC_DRAW);
      gl.bindVertexArray(null);
      T[k] = { vao, vb, ib, n: d.i.length, ymin: d.ymin, ymax: d.ymax };
    }
  },
  // carteles (pasto, flores, plumas…): Float32 [x,y,z,tam, sprite,viento,salto,0] por instancia
  subirCarteles(datos, k) {
    const C = this.cart || (this.cart = []);
    if (!C[k]) {
      const vao = gl.createVertexArray(), buf = gl.createBuffer();
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.cuad); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 32, 0); gl.vertexAttribDivisor(1, 1);
      gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 32, 16); gl.vertexAttribDivisor(2, 1);
      gl.bindVertexArray(null);
      C[k] = { vao, buf, n: 0 };
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, C[k].buf); gl.bufferData(gl.ARRAY_BUFFER, datos, k ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW);
    C[k].n = datos.length / 8;
  },
  camara(w, h) {
    const c = this.cam, asp = w / h;
    const cp = Math.cos(c.pitch), dx = Math.sin(c.yaw) * cp, dy = Math.sin(c.pitch), dz = -Math.cos(c.yaw) * cp;
    M4.mirar(this.V, c.x, c.y, c.z, c.x + dx, c.y + dy, c.z + dz, 0, 1, 0);
    M4.persp(this.Pm, c.fovY, asp, c.near, c.far);
    M4.mul(this.VP, this.Pm, this.V); M4.inv(this.IVP, this.VP);
    this.planos = planosFrustum(this.VP, this.planos);
    this.der = [Math.cos(c.yaw), 0, Math.sin(c.yaw)];
  },
  luz(fx, fy, fz, jx, jy, jz) {
    const d = this.sol.dir, n = this.som ? this.som.n : 1536, L = 52;
    M4.mirar(this.luzV, 0, 0, 0, -d[0], -d[1], -d[2], 0, 1, 0);
    const v = this.luzV, aLuz = (x, y, z) => [v[0] * x + v[4] * y + v[8] * z, v[1] * x + v[5] * y + v[9] * z, v[2] * x + v[6] * y + v[10] * z];
    // el mapa fijo se rehace solo si el foco se alejó o cambió el sol
    const cs = d.join(',');
    if (!this.ancla || this.sucio || cs !== this._solAntes || Math.hypot(fx - this.ancla[0], fz - this.ancla[2]) > 16) {
      this.ancla = [fx, fy, fz]; this._solAntes = cs; this.sucio = true;
      const [cx, cy, cz] = aLuz(fx, fy, fz), tx = 2 * L / n, sx = Math.round(cx / tx) * tx, sy = Math.round(cy / tx) * tx;
      M4.orto(this.luzP, sx - L, sx + L, sy - L, sy + L, -cz - 150, -cz + 150);
      M4.mul(this.luzVP, this.luzP, this.luzV);
      this.planosLuz = planosFrustum(this.luzVP, this.planosLuz);
    }
    // el chico, alrededor de Killa (o del foco)
    const LD = 9, nd = 512, [dx, dy, dz] = aLuz(jx, jy, jz), td = 2 * LD / nd, ex = Math.round(dx / td) * td, ey = Math.round(dy / td) * td;
    this.luzPD = this.luzPD || M4.nueva(); this.luzVPD = this.luzVPD || M4.nueva();
    M4.orto(this.luzPD, ex - LD, ex + LD, ey - LD, ey + LD, -dz - 60, -dz + 60);
    M4.mul(this.luzVPD, this.luzPD, this.luzV);
    this.focoD = [jx, jy, jz];
  },
  uniformesLuz(u) {
    gl.uniform3fv(u.uSolDir, this.sol.dir); gl.uniform3fv(u.uSolCol, this.sol.col);
    gl.uniform3fv(u.uAmbA, this.amb.a); gl.uniform3fv(u.uAmbB, this.amb.b);
    gl.uniform3fv(u.uNiebla, this.niebla.col); gl.uniform3fv(u.uNieblaSol, this.niebla.sol); gl.uniform1f(u.uDens, this.niebla.dens);
    gl.uniform3f(u.uCam, this.cam.x, this.cam.y, this.cam.z);
    gl.uniform1f(u.uSombraOn, this.sombraOn ? 1 : 0);
    gl.uniformMatrix4fv(u.uLuzVP, false, this.luzVP); gl.uniformMatrix4fv(u.uLuzVPD, false, this.luzVPD);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.sombraOn ? this.som.t : null); gl.uniform1i(u.uSombraT, 1);
    gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, this.sombraOn ? this.somD.t : null); gl.uniform1i(u.uSombraD, 3);
  },
  // muñecos: lista de { malla, partes: Float32Array(16*k), tinte, brillo }
  dibujar(t, munecos, puntos, foco) {
    const w = this.fb.w, h = this.fb.h, S = this.stats;
    S.llamadas = 0; S.tris = 0;
    this.camara(w, h);
    const c = this.cam;
    const fx = c.x + Math.sin(c.yaw) * 20, fz = c.z - Math.cos(c.yaw) * 20, F = foco || [fx, clamp(c.y - 4, 10, 50), fz];
    this.luz(fx, clamp(c.y - 4, 10, 50), fz, F[0], F[1], F[2]);
    gl.enable(gl.DEPTH_TEST); gl.enable(gl.CULL_FACE); gl.disable(gl.BLEND);
    // 1. sombras: el terreno solo cuando hace falta, los muñecos de cerca en cada cuadro
    if (this.sombraOn) {
      if (this.sucio) {
        this.sucio = false; S.sombraFija = (S.sombraFija || 0) + 1;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.som.fb); gl.viewport(0, 0, this.som.n, this.som.n);
        gl.clear(gl.DEPTH_BUFFER_BIT); gl.cullFace(gl.FRONT);
        const u = GL.usar(this.P.som); gl.uniformMatrix4fv(u.uVP, false, this.luzVP);
        for (const T of this.trozos) {
          if (!T || !T.solido) continue;
          if (!cajaVisible(this.planosLuz, T.x0, T.solido.ymin, T.z0, T.x0 + CH, T.solido.ymax, T.z0 + CH)) continue;
          gl.uniform3f(u.uTrozo, T.x0, 0, T.z0); gl.bindVertexArray(T.solido.vao); gl.drawElements(gl.TRIANGLES, T.solido.n, gl.UNSIGNED_INT, 0); S.llamadas++;
        }
        gl.cullFace(gl.BACK);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.somD.fb); gl.viewport(0, 0, 512, 512);
      gl.clear(gl.DEPTH_BUFFER_BIT); gl.disable(gl.CULL_FACE);
      const u = GL.usar(this.P.munSom); gl.uniformMatrix4fv(u.uVP, false, this.luzVPD);
      const fd = this.focoD;
      for (const m of munecos) { if (Math.hypot(m.x - fd[0], m.z - fd[2]) > 12) continue; gl.uniformMatrix4fv(u.uPar, false, m.partes); gl.bindVertexArray(m.malla.vao); gl.drawElements(gl.TRIANGLES, m.malla.n, gl.UNSIGNED_SHORT, 0); S.llamadas++; }
      gl.enable(gl.CULL_FACE);
    }
    // 2. escena
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb.fb); gl.viewport(0, 0, w, h);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    let u = GL.usar(this.P.vox);
    gl.uniformMatrix4fv(u.uVP, false, this.VP); this.uniformesLuz(u);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.pal); gl.uniform1i(u.uPal, 0);
    gl.uniform1fv(u.uSat, this.sat); gl.uniform4fv(u.uOla, this.ola); gl.uniform1i(u.uOlaG, this.olaG); gl.uniform1f(u.uT, t);
    const lejos2 = (c.far + 12) * (c.far + 12);
    const visibles = this._vis || (this._vis = []); visibles.length = 0;
    for (const T of this.trozos) {
      if (!T || !(T.solido || T.agua)) continue;
      const dx = Math.max(T.x0 - c.x, 0, c.x - T.x0 - CH), dz = Math.max(T.z0 - c.z, 0, c.z - T.z0 - CH);
      if (dx * dx + dz * dz > lejos2) continue;
      const y0 = Math.min(T.solido ? T.solido.ymin : 64, T.agua ? T.agua.ymin : 64), y1 = Math.max(T.solido ? T.solido.ymax : 0, T.agua ? T.agua.ymax : 0);
      if (!cajaVisible(this.planos, T.x0, y0, T.z0, T.x0 + CH, y1, T.z0 + CH)) continue;
      visibles.push(T);
    }
    for (const T of visibles) {
      if (!T.solido) continue;
      gl.uniform3f(u.uTrozo, T.x0, 0, T.z0); gl.bindVertexArray(T.solido.vao); gl.drawElements(gl.TRIANGLES, T.solido.n, gl.UNSIGNED_INT, 0);
      S.llamadas++; S.tris += T.solido.n / 3;
    }
    // muñecos
    gl.disable(gl.CULL_FACE);
    u = GL.usar(this.P.mun); gl.uniformMatrix4fv(u.uVP, false, this.VP); this.uniformesLuz(u);
    for (const m of munecos) {
      if (m.oculto) continue;
      gl.uniformMatrix4fv(u.uPar, false, m.partes); gl.uniform3fv(u.uTinte, m.tinte || [1, 1, 1]); gl.uniform1f(u.uBrillo, m.brillo || 0);
      gl.bindVertexArray(m.malla.vao); gl.drawElements(gl.TRIANGLES, m.malla.n, gl.UNSIGNED_SHORT, 0); S.llamadas++; S.tris += m.malla.n / 3;
    }
    // carteles
    if (this.cart) {
      u = GL.usar(this.P.cart); gl.uniformMatrix4fv(u.uVP, false, this.VP); this.uniformesLuz(u);
      gl.uniform3fv(u.uDer, this.der); gl.uniform1f(u.uT, t); gl.uniform3fv(u.uTintes, this.tintes);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.atlas); gl.uniform1i(u.uAtlas, 0);
      for (const C of this.cart) if (C && C.n) { gl.bindVertexArray(C.vao); gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, C.n); S.llamadas++; }
    }
    gl.enable(gl.CULL_FACE);
    // cielo (atrás de todo)
    gl.depthFunc(gl.LEQUAL); gl.depthMask(false);
    u = GL.usar(this.P.cielo);
    gl.uniformMatrix4fv(u.uIVP, false, this.IVP); gl.uniform3f(u.uCam, c.x, c.y, c.z); gl.uniform3fv(u.uSolDir, this.sol.dir); gl.uniform3fv(u.uSolCol, this.sol.col);
    gl.uniform3fv(u.uCenit, this.cielo.cenit); gl.uniform3fv(u.uHoriz, this.cielo.horiz); gl.uniform3fv(u.uNiebla, this.niebla.col); gl.uniform3fv(u.uNieblaSol, this.niebla.sol); gl.uniform3fv(u.uMontes, this.cielo.montes); gl.uniform1f(u.uT, t);
    gl.bindVertexArray(this.vacio); gl.drawArrays(gl.TRIANGLES, 0, 3); S.llamadas++;
    gl.depthFunc(gl.LESS);
    // agua y puntitos: solo color, con mezcla
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.NONE]);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    u = GL.usar(this.P.agua); gl.uniformMatrix4fv(u.uVP, false, this.VP); this.uniformesLuz(u); gl.uniform1f(u.uT, t);
    for (const T of visibles) {
      if (!T.agua) continue;
      gl.uniform3f(u.uTrozo, T.x0, 0, T.z0); gl.bindVertexArray(T.agua.vao); gl.drawElements(gl.TRIANGLES, T.agua.n, gl.UNSIGNED_INT, 0); S.llamadas++;
    }
    if (puntos && puntos.n) {
      u = GL.usar(this.P.pto); gl.uniformMatrix4fv(u.uVP, false, this.VP); gl.uniform1f(u.uEsc, h * 0.06);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.ptoBuf); gl.bufferData(gl.ARRAY_BUFFER, puntos.datos.subarray(0, puntos.n * 8), gl.STREAM_DRAW);
      gl.bindVertexArray(this.ptoVao); gl.drawArrays(gl.POINTS, 0, puntos.n); S.llamadas++;
    }
    gl.disable(gl.BLEND); gl.depthMask(true);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
    // 3. revelado final a la pantalla
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, w, h);
    gl.disable(gl.DEPTH_TEST);
    u = GL.usar(this.P.post);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.fb.col); gl.uniform1i(u.uC, 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.fb.nor); gl.uniform1i(u.uN, 1);
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, this.fb.prof); gl.uniform1i(u.uD, 2);
    gl.uniform2f(u.uNF, c.near, c.far); gl.uniform1f(u.uNiv, this.niveles); gl.uniform3fv(u.uTinta, this.tinta);
    gl.uniform1f(u.uFundido, this.fundido); gl.uniform3fv(u.uFundidoC, this.fundidoC);
    gl.bindVertexArray(this.vacio); gl.drawArrays(gl.TRIANGLES, 0, 3); S.llamadas++;
    gl.bindVertexArray(null);
    gl.enable(gl.DEPTH_TEST);
  },
  // malla de muñeco a la placa
  subirMuneco(mc) {
    const vao = gl.createVertexArray(), vb = gl.createBuffer(), ib = gl.createBuffer();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, mc.buf, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 20, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.BYTE, true, 20, 12);
    gl.enableVertexAttribArray(2); gl.vertexAttribIPointer(2, 4, gl.UNSIGNED_BYTE, 20, 16);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mc.idx, gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    return { vao, n: mc.n };
  },
};

// los dibujitos de los carteles: 16 de 16×16 en una tira
const SPR = { PAJA: 0, PAJA2: 1, FLOR_AM: 2, FLOR_VI: 3, QUISCO: 4, PIEDRITAS: 5, TOLA: 6, FLOR_RO: 7, PLUMA: 8, OVILLO: 9, GOTA: 10, CHISPA: 11, TALCO: 12, MARIPOSA: 13, CONDOR: 14, SERPENTINA: 15 };
function atlasCarteles() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 16;
  const g = c.getContext('2d'), r = rngSemilla(5);
  const px = (s, x, y, col) => { g.fillStyle = col; g.fillRect(s * 16 + x, y, 1, 1); };
  // paja brava: matas de hojas finas
  for (const [s, alto] of [[0, 9], [1, 13]]) for (let k = 0; k < 14; k++) {
    const x0 = 3 + r() * 10, inc = (x0 - 8) * 0.25 + (r() - 0.5) * 0.8, h = alto * (0.6 + r() * 0.4), col = ['#d8bc6a', '#c4a050', '#e8d48a', '#a88a40'][k % 4];
    for (let y = 0; y < h; y++) px(s, Math.round(x0 + inc * y * 0.5), 15 - y, col);
  }
  // flores
  for (const [s, cf] of [[2, '#f0c838'], [3, '#a868d8'], [7, '#e04848']]) {
    for (let k = 0; k < 5; k++) { const x = 3 + k * 2.5, h = 3 + r() * 6; for (let y = 0; y < h; y++) px(s, Math.round(x), 15 - y, '#6a8a3a'); px(s, Math.round(x), 15 - Math.round(h), cf); px(s, Math.round(x) + 1, 15 - Math.round(h), cf); px(s, Math.round(x), 14 - Math.round(h), cf); }
  }
  // quisco: bolita con espinas
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const d = Math.hypot(x - 7.5, y - 10.5); if (d < 5) px(4, x, y, d > 4 ? '#3a6a3a' : x % 2 ? '#5a9a4a' : '#4a8a3e'); }
  for (let k = 0; k < 10; k++) px(4, 3 + Math.floor(r() * 10), 6 + Math.floor(r() * 9), '#f4f0e0');
  px(4, 7, 5, '#f060a0'); px(4, 8, 5, '#f060a0');
  // piedritas
  for (const [x, y, rr, col] of [[4, 13, 2.2, '#8a7a6e'], [10, 14, 1.6, '#a09080'], [12, 12, 1.2, '#7a6a60']]) for (let yy = 0; yy < 16; yy++) for (let xx = 0; xx < 16; xx++) if (Math.hypot(xx - x, (yy - y) * 1.3) < rr) px(5, xx, yy, col);
  // tola: arbusto oscuro
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const d = Math.hypot(x - 7.5, (y - 10) * 1.2); if (d < 6 && r() < 0.85) px(6, x, y, r() < 0.3 ? '#3a5a2a' : '#5a7a3a'); }
  // pluma de cóndor
  for (let y = 1; y < 15; y++) { const w = Math.round(Math.sin((y - 1) / 14 * Math.PI) * 3.2); for (let x = -w; x <= w; x++) px(8, 8 + x - Math.round(y * 0.15), y, y < 6 ? '#2a2830' : x === 0 ? '#e8e4dc' : '#f8f6f0'); }
  for (let y = 12; y < 16; y++) px(8, 8 - Math.round(y * 0.15), y, '#c8c0b0');
  // ovillo rojo
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const d = Math.hypot(x - 7.5, y - 9); if (d < 5.2) px(9, x, y, (x + y * 2) % 4 < 1 ? '#a02a20' : d < 3 ? '#f06a50' : '#d8402e'); }
  for (let k = 0; k < 4; k++) px(9, 12 + k, 13 + (k & 1), '#d8402e');
  // gota de color (se tiñe)
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const d = Math.hypot(x - 7.5, (y - 9.5) * 1.05), punta = y < 6 && Math.abs(x - 7.5) < (y - 1) * 0.7; if (d < 5 || punta) px(10, x, y, d < 2.2 && y > 7 ? '#ffffff' : '#f4f4f4'); }
  // chispa
  for (let k = -4; k <= 4; k++) { px(11, 7 + k, 8, '#ffffff'); px(11, 7, 8 + k, '#ffffff'); }
  for (let k = -2; k <= 2; k++) { px(11, 7 + k, 8 + k, '#fff4c0'); px(11, 7 + k, 8 - k, '#fff4c0'); }
  // talco
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (Math.hypot(x - 7.5, y - 8) < 6 && r() < 0.7) px(12, x, y, '#ffffff');
  // mariposa
  for (const [x, y, col] of [[5, 7, '#f0a030'], [6, 7, '#f0a030'], [5, 8, '#f0a030'], [6, 8, '#e06020'], [9, 7, '#f0a030'], [10, 7, '#f0a030'], [9, 8, '#e06020'], [10, 8, '#f0a030'], [7, 8, '#2a2020'], [8, 8, '#2a2020'], [7, 7, '#2a2020'], [8, 7, '#2a2020']]) px(13, x, y, col);
  // cóndor de lejos
  for (let x = 0; x < 16; x++) { const y = 8 + Math.round(Math.abs(x - 7.5) * 0.35 - (Math.abs(x - 7.5) > 5 ? (Math.abs(x - 7.5) - 5) * 0.8 : 0)); px(14, x, y, '#1a1820'); if (Math.abs(x - 7.5) < 4) px(14, x, y + 1, '#1a1820'); }
  px(14, 7, 7, '#f0f0f0'); px(14, 8, 7, '#f0f0f0');
  // serpentina
  for (let y = 0; y < 16; y++) px(15, 7 + Math.round(Math.sin(y * 0.8) * 3), y, '#ffffff');
  return c;
}
