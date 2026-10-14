// POTRERO — el dibujo de historieta en WebGL2: luz en tres bandas, trama de puntos en lo oscuro, brillo duro,
// contraluz, sombras (fija del escenario + chica de los jugadores), contorno de tinta por profundidad, normal e
// identidad, papel con grano, líneas de velocidad y el cuadro invertido de los especiales.
const SH_COMUN = `
uniform vec3 uSolDir, uSolCol, uSombraCol, uCam, uNieblaCol;
uniform float uTramaPaso, uNiebla;
uniform mat4 uLuzVP, uLuzVPD;
uniform sampler2DShadow uSombraT, uSombraD;
uniform float uSombraOn;
float muestra(sampler2DShadow s, mat4 vp, vec3 p, float sesgo) {
  vec4 q = vp * vec4(p, 1.0); vec3 c = q.xyz / q.w * 0.5 + 0.5;
  if (c.x < 0.0 || c.x > 1.0 || c.y < 0.0 || c.y > 1.0 || c.z > 1.0) return 1.0;
  return texture(s, vec3(c.xy, c.z - sesgo));
}
float sombra(vec3 p, vec3 n) { if (uSombraOn < 0.5) return 1.0; vec3 q = p + n * 0.035; return min(muestra(uSombraT, uLuzVP, q, 0.0007), muestra(uSombraD, uLuzVPD, q, 0.0012)); }
float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float ruido(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
float trama(float osc) {
  vec2 q = gl_FragCoord.xy / uTramaPaso; q = vec2(q.x + q.y, q.y - q.x) * 0.7071;
  vec2 f = fract(q) - 0.5; float r = sqrt(clamp(osc, 0.0, 1.0)) * 0.56;
  return (1.0 - smoothstep(r - 0.09, r + 0.09, length(f))) * step(0.04, osc);
}
float sombraFija(vec3 p, vec3 n) { if (uSombraOn < 0.5) return 1.0; return muestra(uSombraT, uLuzVP, p + n * 0.035, 0.0007); }
vec3 celL(vec3 base, vec3 n, vec3 p, float spec, float rim, float minLuz, vec3 L, float sh, float fTrama) {
  float luz = clamp(dot(n, L), 0.0, 1.0) * sh;
  luz = max(luz, minLuz);
  float b1 = smoothstep(0.38, 0.46, luz), b2 = smoothstep(0.05, 0.12, luz);
  vec3 cOsc = base * uSombraCol, cMed = base * mix(uSombraCol, uSolCol, 0.6), cLuz = base * uSolCol;
  vec3 c = mix(cOsc, mix(cMed, cLuz, b1), b2);
  float osc = 1.0 - mix(0.0, mix(0.5, 1.0, b1), b2);
  c = mix(c, c * 0.6, trama(osc) * fTrama);
  vec3 v = normalize(uCam - p);
  if (spec > 0.0) { float h = dot(n, normalize(L + v)); c = mix(c, vec3(1.0), spec * smoothstep(0.95, 0.962, h) * step(0.12, luz)); }
  if (rim > 0.0) { float rr = 1.0 - max(dot(n, v), 0.0); c += vec3(0.95, 0.92, 1.0) * rim * smoothstep(0.66, 0.7, rr) * 0.3; }
  return c;
}
vec3 cel(vec3 base, vec3 n, vec3 p, float spec, float rim, float minLuz) { return celL(base, n, p, spec, rim, minLuz, uSolDir, sombra(p, n), 0.85); }
vec3 niebla(vec3 c, vec3 p) { float d = length(p - uCam); return mix(c, uNieblaCol, clamp((d - uNiebla) / (uNiebla * 2.2), 0.0, 0.75)); }
`;
const SH = {
  // ---- escenario ----
  escVS: `
layout(location=0) in vec3 aP; layout(location=1) in vec4 aN; layout(location=2) in vec4 aC; layout(location=3) in vec2 aT;
uniform mat4 uVP;
out vec3 vP; out vec3 vN; out vec4 vC; out vec2 vT;
void main() { vP = aP; vN = aN.xyz; vC = aC; vT = aT; gl_Position = uVP * vec4(aP, 1.0); }`,
  escFS: SH_COMUN + `
in vec3 vP; in vec3 vN; in vec4 vC; in vec2 vT;
uniform sampler2D uAtlas; uniform float uTiempo, uRayas, uID;
layout(location=0) out vec4 oC; layout(location=1) out vec4 oN;
void main() {
  vec3 n = normalize(vN), base = vC.rgb;
  int mat = int(vC.a * 255.0 + 0.5);
  float spec = 0.0, minL = 0.0, id = uID;
  if (mat == 1) {            // pasto: manchas y rayas de corte
    float r = ruido(vP.xz * 0.45) * 0.6 + ruido(vP.xz * 2.1) * 0.4;
    base *= 0.86 + 0.24 * r;
    if (uRayas > 0.5) base *= 1.0 + 0.07 * sign(sin(vP.z * 0.82));
    base = mix(base, base * vec3(1.15, 1.05, 0.7), smoothstep(0.62, 0.8, ruido(vP.xz * 0.18)) * 0.6);
  } else if (mat == 2) {     // tierra: manchas, pastitos y piedritas
    float r = ruido(vP.xz * 0.6), r2 = ruido(vP.xz * 3.0 + 7.0);
    base *= 0.84 + 0.26 * r;
    base = mix(base, vec3(0.42, 0.56, 0.24), smoothstep(0.66, 0.78, ruido(vP.xz * 0.33 + 3.0)) * 0.85);
    base *= 1.0 - 0.18 * step(0.93, r2);
  } else if (mat == 3) {     // ladrillos: hiladas corridas
    vec2 b = vec2(vT.x / 0.24, vT.y / 0.075); b.x += step(1.0, mod(b.y, 2.0)) * 0.5;
    vec2 f = fract(b); float junta = step(f.x, 0.07) + step(f.y, 0.14);
    base *= 0.88 + 0.22 * h21(floor(b));
    base = mix(base, vec3(0.84, 0.8, 0.72), clamp(junta, 0.0, 1.0));
  } else if (mat == 4) {     // agua: oscura, con cielo y brillo
    base = mix(base, uNieblaCol, 0.35 + 0.15 * sin(vP.x * 2.0 + uTiempo * 1.3) * sin(vP.z * 1.7 - uTiempo));
    base = mix(base, vec3(1.0), smoothstep(0.78, 0.92, vT.x) * 0.55 + step(0.93, fract(vP.x * 0.9 + vP.z * 0.4 + uTiempo * 0.2)) * 0.25);
    spec = 1.0; minL = 0.45;
  } else if (mat == 5 || mat == 14) {   // dibujos del atlas (murales, carteles)
    vec4 t = texture(uAtlas, vT); base = mix(base, t.rgb, t.a);
    if (mat == 14) minL = 0.55;
  } else if (mat == 6) {     // hormigón con manchas
    base *= 0.9 + 0.16 * ruido(vP.xz * 0.8 + vP.y);
  } else if (mat == 8) { spec = 1.0;
  } else if (mat == 9) {     // luz propia
    oC = vec4(base * 1.15, 1.0); oN = vec4(n * 0.5 + 0.5, id); return;
  } else if (mat == 10) {    // vidrio
    base = mix(base, uNieblaCol, 0.25 * step(0.5, fract(vP.y * 0.7 + vP.x * 0.3))); spec = 1.0;
  } else if (mat == 11) {    // follaje con manchas
    base *= 0.82 + 0.3 * ruido(vP.xz * 1.4 + vP.y * 1.9);
  } else if (mat == 13) { minL = 0.4;
  }
  vec3 c = cel(base, n, vP, spec, 0.0, minL);
  oC = vec4(niebla(c, vP), 1.0); oN = vec4(n * 0.5 + 0.5, id);
}`,
  sombraEscVS: `layout(location=0) in vec3 aP; uniform mat4 uVP; void main() { gl_Position = uVP * vec4(aP, 1.0); }`,
  vacioFS: `out vec4 o; void main() { o = vec4(1.0); }`,
  // ---- muñecos (piezas rígidas con huesos) y pelota ----
  munVS: `
layout(location=0) in vec3 aP; layout(location=1) in vec4 aN; layout(location=2) in vec4 aC; layout(location=3) in vec2 aT; layout(location=4) in uint aB;
uniform mat4 uVP; uniform mat4 uHuesos[13];
out vec3 vP; out vec3 vN; out vec4 vC; out vec2 vT; out vec3 vL;
void main() { mat4 m = uHuesos[aB]; vec4 p = m * vec4(aP, 1.0); vP = p.xyz; vN = mat3(m) * aN.xyz; vC = aC; vT = aT; vL = aP; gl_Position = uVP * p; }`,
  munFS: SH_COMUN + `
in vec3 vP; in vec3 vN; in vec4 vC; in vec2 vT; in vec3 vL;
uniform sampler2D uCaras; uniform vec2 uCara; uniform vec4 uPatron; uniform vec3 uCol2, uNumCol; uniform float uID; uniform vec4 uTinte;
layout(location=0) out vec4 oC; layout(location=1) out vec4 oN;
void main() {
  vec3 n = normalize(vN), base = vC.rgb;
  int f = int(vC.a * 255.0 + 0.5);
  float spec = 0.0, rim = 0.8;
  if (f == 1) {              // la cara: ojos, cejas y boca del atlas
    vec2 uv = clamp(vT, 0.0, 1.0);
    vec4 t = texture(uCaras, (uCara + uv) * vec2(0.1, 0.25));
    base = mix(base, t.rgb, t.a * step(0.001, vT.x) * step(vT.x, 0.999) * step(0.001, vT.y) * step(vT.y, 0.999));
  } else if (f == 2) {       // el número de la espalda
    vec4 t = texture(uCaras, vT); base = mix(base, uNumCol, t.a);
  } else if (f == 3) {       // la camiseta: lisa, bastones, franja o banda
    float k = 0.0;
    if (uPatron.x > 0.5 && uPatron.x < 1.5) k = step(0.5, fract(vL.x * uPatron.y + 0.25));
    else if (uPatron.x > 1.5 && uPatron.x < 2.5) k = step(abs(vL.y - 0.25), 0.07);
    else if (uPatron.x > 2.5) k = step(abs(vL.y - 0.24 + vL.x * 0.9), 0.065);
    base = mix(base, uCol2, k);
  } else if (f == 4) { spec = 0.6;
  } else if (f == 6) { spec = 0.4;
  } else if (f == 7) { spec = 1.0; rim = 0.0;
  }
  vec3 L = normalize(uSolDir + normalize(uCam - vP) * 0.85);
  float sh = min(sombraFija(vP, n), mix(1.0, muestra(uSombraD, uLuzVPD, vP + n * 0.05, 0.004), 0.0));
  base = mix(vec3(dot(base, vec3(0.3, 0.55, 0.15))), base, 1.18);
  vec3 c = celL(base, n, vP, spec, rim, f == 1 ? 0.5 : 0.12, L, sh, 0.3);
  c = mix(c, uTinte.rgb, uTinte.a);
  oC = vec4(c, 1.0); oN = vec4(n * 0.5 + 0.5, uID);
}`,
  munSombraVS: `layout(location=0) in vec3 aP; layout(location=4) in uint aB; uniform mat4 uVP; uniform mat4 uHuesos[13]; void main() { gl_Position = uVP * (uHuesos[aB] * vec4(aP, 1.0)); }`,
  // ---- red de los arcos (cuadrícula de soga; se infla con el golpe) ----
  redVS: `
layout(location=0) in vec3 aP; layout(location=1) in vec4 aN; layout(location=2) in vec4 aC; layout(location=3) in vec2 aT;
uniform mat4 uVP; uniform vec4 uGolpe; uniform float uTiempo;
out vec3 vP; out vec3 vN; out vec2 vT;
void main() {
  vec3 p = aP; float d = length(p - uGolpe.xyz);
  float k = uGolpe.w * exp(-d * d * 1.6);
  p += aN.xyz * k * (0.55 + 0.1 * sin(uTiempo * 30.0)) * aC.a;
  vP = p; vN = aN.xyz; vT = aT; gl_Position = uVP * vec4(p, 1.0);
}`,
  redFS: SH_COMUN + `
in vec3 vP; in vec3 vN; in vec2 vT;
uniform float uID;
layout(location=0) out vec4 oC; layout(location=1) out vec4 oN;
void main() {
  vec2 f = abs(fract(vT / 0.13) - 0.5);
  if (min(f.x, f.y) > 0.07) discard;
  vec3 c = cel(vec3(0.95, 0.95, 0.92), normalize(vN), vP, 0.0, 0.0, 0.45);
  oC = vec4(c, 1.0); oN = vec4(normalize(vN) * 0.5 + 0.5, uID);
}`,
  // ---- público: carteles que miran a la cámara, con la remera del color de cada uno ----
  pubVS: `
layout(location=0) in vec2 aQ; layout(location=1) in vec4 aI; layout(location=2) in vec4 aD;
uniform mat4 uVP; uniform vec3 uCam; uniform float uTiempo, uFervor;
out vec2 vT; out vec3 vCol; out vec3 vP;
void main() {
  vec3 base = aI.xyz; float var = aD.x, fase = aD.w;
  vec3 haciaCam = uCam - base; haciaCam.y = 0.0; haciaCam = normalize(haciaCam);
  vec3 der = vec3(haciaCam.z, 0.0, -haciaCam.x);
  float salto = max(0.0, sin(uTiempo * (6.0 + fase * 3.0) + fase * 40.0)) * 0.25 * uFervor;
  float brazos = step(0.5, fract(uTiempo * 1.5 + fase * 7.0)) * step(0.35, uFervor);
  vec3 p = base + der * (aQ.x - 0.5) * 0.9 * aI.w + vec3(0.0, aQ.y * 1.25 * aI.w + salto, 0.0);
  vT = vec2((var + aQ.x) / 8.0, (1.0 - aQ.y) * 0.5 + brazos * 0.5);
  vCol = aD.yzx * 0.0 + vec3(fract(aD.y * 7.13), fract(aD.y * 3.71 + 0.3), fract(aD.y * 5.31 + 0.6));
  vP = p; gl_Position = uVP * vec4(p, 1.0);
}`,
  pubFS: SH_COMUN + `
in vec2 vT; in vec3 vCol; in vec3 vP;
uniform sampler2D uPub;
layout(location=0) out vec4 oC; layout(location=1) out vec4 oN;
void main() {
  vec4 t = texture(uPub, vT);
  if (t.a < 0.5) discard;
  vec3 c = t.rgb;
  if (t.r > 0.9 && t.b > 0.9 && t.g < 0.1) c = mix(vec3(0.95), vCol, 0.85);
  c *= mix(uSombraCol, uSolCol, 0.75);
  oC = vec4(niebla(c, vP), 1.0); oN = vec4(0.5, 1.0, 0.5, 0.92);
}`,
  // ---- cielo de historieta: degradé, nubes con borde y estrellas de noche ----
  cieloVS: `out vec2 vQ; void main() { vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2) * 2.0 - 1.0; vQ = p; gl_Position = vec4(p, 1.0, 1.0); }`,
  cieloFS: `
in vec2 vQ; uniform mat4 uInvVP; uniform vec3 uCenit, uHoriz, uCam, uSolDir; uniform float uTiempo, uNoche, uTramaPaso;
layout(location=0) out vec4 oC; layout(location=1) out vec4 oN;
float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float ruido(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
void main() {
  vec4 q = uInvVP * vec4(vQ, 1.0, 1.0); vec3 d = normalize(q.xyz / q.w - uCam);
  float h = clamp(d.y, 0.0, 1.0);
  vec3 c = mix(uHoriz, uCenit, pow(h, 0.55));
  // trama suave cerca del horizonte
  vec2 g = gl_FragCoord.xy / (uTramaPaso * 1.3); g = vec2(g.x + g.y, g.y - g.x) * 0.7071;
  float dot1 = 1.0 - smoothstep(0.18, 0.26, length(fract(g) - 0.5));
  c = mix(c, c * 0.9, dot1 * (1.0 - smoothstep(0.0, 0.35, h)) * 0.6);
  // nubes: manchas con contorno
  vec2 p = d.xz / max(0.08, d.y) * 0.6 + vec2(uTiempo * 0.01, 0.0);
  float n = ruido(p * 0.9) * 0.6 + ruido(p * 2.3) * 0.3 + ruido(p * 5.0) * 0.1;
  float nube = smoothstep(0.6, 0.62, n) * smoothstep(0.02, 0.12, d.y);
  float borde = (smoothstep(0.585, 0.6, n) - smoothstep(0.6, 0.615, n)) * smoothstep(0.02, 0.12, d.y);
  vec3 cn = mix(vec3(1.0, 0.98, 0.94), vec3(0.7, 0.72, 0.9), smoothstep(0.62, 0.8, n) * 0.0 + (1.0 - smoothstep(0.62, 0.7, n)) * 0.0) ;
  cn = mix(cn, cn * vec3(0.78, 0.8, 0.98), smoothstep(0.66, 0.74, ruido(p * 2.3 + 4.0)));
  c = mix(c, mix(cn, c * 0.6 + 0.2, uNoche * 0.8), nube * (1.0 - uNoche * 0.6));
  c = mix(c, vec3(0.09, 0.07, 0.13), borde * 0.85 * (1.0 - uNoche * 0.7));
  // el sol (de día) y estrellas (de noche)
  float s = dot(d, uSolDir);
  c = mix(c, vec3(1.0, 0.97, 0.8), smoothstep(0.9975, 0.998, s) * (1.0 - uNoche));
  float est = step(0.9965, h21(floor(d.xz / max(0.1, d.y) * 60.0))) * uNoche * smoothstep(0.1, 0.3, d.y);
  c = mix(c, vec3(1.0), est);
  oC = vec4(c, 1.0); oN = vec4(0.5, 0.5, 1.0, 0.0);
}`,
  // ---- partículas: papelitos, polvo, gotas, chispas ----
  ptoVS: `
layout(location=0) in vec4 aP; layout(location=1) in vec4 aC;
uniform mat4 uVP; uniform float uEsc;
out vec4 vC; out float vRot;
void main() { vec4 p = uVP * vec4(aP.xyz, 1.0); gl_Position = p; gl_PointSize = clamp(aP.w * uEsc / p.w, 1.5, 64.0); vC = aC; vRot = aP.x * 7.0 + aP.z * 3.0; }`,
  ptoFS: `
in vec4 vC; in float vRot;
layout(location=0) out vec4 oC; layout(location=1) out vec4 oN;
void main() {
  vec2 q = gl_PointCoord - 0.5;
  if (vC.a > 0.75) { float a = vRot; q = mat2(cos(a), -sin(a), sin(a), cos(a)) * q; if (abs(q.x) > 0.42 || abs(q.y) > 0.24) discard; }
  else if (length(q) > 0.5) discard;
  oC = vec4(vC.rgb, 1.0); oN = vec4(0.5, 0.5, 1.0, vC.a > 0.75 ? 0.96 : 0.0);
}`,
  // ---- pasada final: tinta, papel, líneas de velocidad, cuadro invertido ----
  postVS: `out vec2 vUV; void main() { vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2); vUV = p; gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }`,
  postFS: `
in vec2 vUV;
uniform sampler2D uCol, uNor, uProf, uPapel;
uniform vec2 uPx, uCerca; uniform float uGrosor, uTiempo, uVeloc, uInvertir, uFundido, uSepia;
uniform vec3 uTinta, uFundCol; uniform vec2 uCentroV;
out vec4 o;
float lin(float d) { float z = d * 2.0 - 1.0; return 2.0 * uCerca.x * uCerca.y / (uCerca.y + uCerca.x - z * (uCerca.y - uCerca.x)); }
float h11(float p) { return fract(sin(p * 127.1) * 43758.5453); }
void main() {
  vec3 c = texture(uCol, vUV).rgb;
  vec4 nc = texture(uNor, vUV); float dc = lin(texture(uProf, vUV).r);
  vec2 ox = vec2(uPx.x * uGrosor, 0.0), oy = vec2(0.0, uPx.y * uGrosor);
  float dl = lin(texture(uProf, vUV - ox).r), dr = lin(texture(uProf, vUV + ox).r), dd = lin(texture(uProf, vUV - oy).r), du = lin(texture(uProf, vUV + oy).r);
  // laplaciano relativo: no marca el piso de lejos, sí los bordes de las cosas
  float lap = max(abs(dl + dr - 2.0 * dc), abs(dd + du - 2.0 * dc)) / dc;
  float tinta = smoothstep(0.025, 0.06, lap);
  vec4 nl = texture(uNor, vUV - ox), nr = texture(uNor, vUV + ox), nd = texture(uNor, vUV - oy), nu = texture(uNor, vUV + oy);
  vec3 n0 = nc.xyz * 2.0 - 1.0;
  float dn = max(max(1.0 - dot(n0, nl.xyz * 2.0 - 1.0), 1.0 - dot(n0, nr.xyz * 2.0 - 1.0)), max(1.0 - dot(n0, nd.xyz * 2.0 - 1.0), 1.0 - dot(n0, nu.xyz * 2.0 - 1.0)));
  float lejosN = nc.a < 0.05 ? 1.0 - smoothstep(40.0, 90.0, dc) : 1.0 - smoothstep(5.0, 9.0, dc);
  tinta = max(tinta, smoothstep(0.62, 0.92, dn) * lejosN);
  float di = max(max(abs(nc.a - nl.a), abs(nc.a - nr.a)), max(abs(nc.a - nd.a), abs(nc.a - nu.a)));
  tinta = max(tinta, step(0.002, di) * (1.0 - smoothstep(55.0, 110.0, dc)));
  // la red y el alambrado no llevan tinta (si no, quedan todos negros)
  float sinT = step(0.995, max(max(max(nc.a, nl.a), max(nr.a, nd.a)), nu.a));
  c = mix(c, uTinta, tinta * 0.95 * (1.0 - sinT));
  // papel
  float gr = texture(uPapel, gl_FragCoord.xy / 256.0).r;
  c *= 0.95 + 0.07 * gr;
  vec2 v = vUV - 0.5; c *= 1.0 - dot(v, v) * 0.35;
  // líneas de velocidad hacia el centro
  if (uVeloc > 0.0) {
    vec2 q = (vUV - uCentroV) * vec2(uPx.y / uPx.x, 1.0);
    float a = atan(q.y, q.x), r = length(q);
    float k = floor(a * 70.0), lin2 = step(0.62, h11(k + floor(uTiempo * 14.0))) * smoothstep(0.18 + h11(k) * 0.15, 0.55, r);
    c = mix(c, mix(vec3(1.0), uTinta, step(0.5, h11(k * 3.1))), lin2 * uVeloc);
  }
  if (uSepia > 0.0) { float l = dot(c, vec3(0.3, 0.55, 0.15)); c = mix(c, vec3(l * 1.05, l * 0.92, l * 0.72), uSepia); }
  if (uInvertir > 0.0) { float l = dot(c, vec3(0.3, 0.55, 0.15)); vec3 dos = l > 0.45 ? uTinta : vec3(1.0, 0.97, 0.9); c = mix(c, dos, uInvertir); }
  c = mix(c, uFundCol, uFundido);
  o = vec4(c, 1.0);
}`,
};

const R = {
  calidad: 'media', escala: 0.75, stats: { llamadas: 0, tris: 0 }, cam: { x: 0, y: 10, z: 20, tx: 0, ty: 0, tz: 0, fovY: 1.0 },
  VP: M4.nueva(), V: M4.nueva(), P: M4.nueva(), invVP: M4.nueva(),
  luz: { VP: M4.nueva(), VPD: M4.nueva(), tmp: M4.nueva() },
  sol: { dir: [0.4, 0.8, 0.3], col: [1.05, 1.0, 0.92] }, sombraCol: [0.52, 0.54, 0.8], cielo: { cenit: [0.3, 0.55, 0.92], horiz: [0.85, 0.9, 0.95] }, niebla: { col: [0.85, 0.88, 0.92], d: 60 },
  noche: 0, veloc: 0, centroV: [0.5, 0.5], invertir: 0, fundido: 0, fundCol: [0.09, 0.07, 0.12], sepia: 0, fervor: 0, rayas: 0,
  esc: null, red: [], pub: null, ptos: null, fijaLista: false,
  iniciar() {
    const P = (a, b, n) => GL.programa(a, b, n);
    this.pEsc = P(SH.escVS, SH.escFS, 'esc'); this.pEscS = P(SH.sombraEscVS, SH.vacioFS, 'escS');
    this.pMun = P(SH.munVS, SH.munFS, 'mun'); this.pMunS = P(SH.munSombraVS, SH.vacioFS, 'munS');
    this.pRed = P(SH.redVS, SH.redFS, 'red'); this.pPub = P(SH.pubVS, SH.pubFS, 'pub');
    this.pCielo = P(SH.cieloVS, SH.cieloFS, 'cielo'); this.pPto = P(SH.ptoVS, SH.ptoFS, 'pto'); this.pPost = P(SH.postVS, SH.postFS, 'post');
    this.vaoVacio = gl.createVertexArray();
    // el grano del papel
    const c = lienzo(256, 256), g = c.getContext('2d'), img = g.createImageData(256, 256), r = rngSemilla(5);
    for (let i = 0; i < 256 * 256; i++) { const x = i % 256, y = (i / 256) | 0, f = Math.sin(x * 0.11 + Math.sin(y * 0.05) * 3) * 0.5 + 0.5, v = 150 + r() * 70 + f * 35; img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255; }
    g.putImageData(img, 0, 0);
    this.texPapel = GL.texturaLienzo(c); gl.bindTexture(gl.TEXTURE_2D, this.texPapel); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    this.blanco = GL.textura(1, 1, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, gl.NEAREST, new Uint8Array([255, 255, 255, 0]));
    this.texAtlas = this.blanco; this.texCaras = this.blanco; this.texPub = this.blanco;
    // partículas: búfer dinámico
    this.ptoVao = gl.createVertexArray(); gl.bindVertexArray(this.ptoVao);
    this.ptoBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this.ptoBuf); gl.bufferData(gl.ARRAY_BUFFER, 4000 * 32, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 32, 0); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 32, 16);
    gl.bindVertexArray(null);
    this.ptoDatos = new Float32Array(4000 * 8);
  },
  // compila todo con el telón cerrado (para que el primer cuadro del partido no trabe)
  precompilar() { for (const p of [this.pEsc, this.pEscS, this.pMun, this.pMunS, this.pRed, this.pPub, this.pCielo, this.pPto, this.pPost]) GL.revisar(p); },
  ponerCalidad(q) {
    this.calidad = q;
    this.escala = { baja: 0.5, media: 0.72, alta: 1 }[q] || 0.72;
    const nT = q === 'alta' ? 2048 : q === 'media' ? 1536 : 1024, nD = q === 'baja' ? 512 : 1024;
    if (!this.somT || this.somT.n !== nT) { GL.borrar(this.somT); this.somT = GL.destinoSombra(nT); this.fijaLista = false; }
    if (!this.somD || this.somD.n !== nD) { GL.borrar(this.somD); this.somD = GL.destinoSombra(nD); }
    if (this.cssW) this.tamano(this.cssW, this.cssH, this.dprAct);
  },
  tamano(cw, ch, dpr) {
    this.cssW = cw; this.cssH = ch; this.dprAct = dpr;
    const d = Math.min(dpr, 2) * this.escala, w = Math.max(64, Math.round(cw * d)), h = Math.max(64, Math.round(ch * d));
    if (cvGL.width !== w || cvGL.height !== h) { cvGL.width = w; cvGL.height = h; }
    if (!this.esc || this.esc.w !== w || this.esc.h !== h) { GL.borrar(this.esc); this.esc = GL.destinoEscena(w, h); }
    this.w = w; this.h = h;
  },
  // ---- escenario ----
  ponerEscenario(E) {
    for (const m of this.escMallas || []) GL.borrarMalla(m);
    this.escMallas = E.mallas;
    for (const r of this.red) GL.borrarMalla(r.malla);
    this.red = E.redes || [];
    this.E = E; this.fijaLista = false;
    if (E.atlas) { if (this.texAtlas !== this.blanco) gl.deleteTexture(this.texAtlas); this.texAtlas = GL.texturaLienzo(E.atlas, true); }
    this.ponerPublico(E.publico || []);
  },
  ponerPublico(L) {
    if (this.pub) { gl.deleteVertexArray(this.pub.vao); gl.deleteBuffer(this.pub.q); gl.deleteBuffer(this.pub.i); this.pub = null; }
    if (!L.length) return;
    const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    const q = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, q); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);
    const d = new Float32Array(L.length * 8);
    L.forEach((p, i) => { d.set([p[0], p[1], p[2], p[3] || 1, p[4] || 0, p[5] || 0, 0, p[6] || 0], i * 8); });
    const ib = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, ib); gl.bufferData(gl.ARRAY_BUFFER, d, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 32, 0); gl.vertexAttribDivisor(1, 1);
    gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 32, 16); gl.vertexAttribDivisor(2, 1);
    gl.bindVertexArray(null);
    this.pub = { vao, q, i: ib, n: L.length };
  },
  // ---- cámara ----
  camara(asp) {
    const c = this.cam;
    M4.persp(this.P, c.fovY, asp, c.cerca || 0.3, c.lejos || 160);
    M4.mirar(this.V, c.x, c.y, c.z, c.tx, c.ty, c.tz, 0, 1, 0);
    M4.mul(this.VP, this.P, this.V);
    M4.inv(this.invVP, this.VP);
  },
  matLuz(o, cx, cz, rad, prof) {
    const d = this.sol.dir, l = this.luz.tmp;
    M4.mirar(l, cx + d[0] * prof, d[1] * prof, cz + d[2] * prof, cx, 0, cz, 0, 1, 0);
    M4.orto(o, -rad, rad, -rad, rad, 1, prof * 2.2);
    M4.mul(o, o, l);
  },
  uniformesLuz(u) {
    gl.uniform3fv(u.uSolDir, this.sol.dir); gl.uniform3fv(u.uSolCol, this.sol.col); gl.uniform3fv(u.uSombraCol, this.sombraCol);
    gl.uniform3f(u.uCam, this.cam.x, this.cam.y, this.cam.z); gl.uniform3fv(u.uNieblaCol, this.niebla.col); gl.uniform1f(u.uNiebla, this.niebla.d);
    gl.uniform1f(u.uTramaPaso, Math.max(3, 4.2 * this.w / Math.max(1, this.cssW) * 0.9));
    gl.uniformMatrix4fv(u.uLuzVP, false, this.luz.VP); gl.uniformMatrix4fv(u.uLuzVPD, false, this.luz.VPD);
    gl.uniform1f(u.uSombraOn, 1);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.somT.t); gl.uniform1i(u.uSombraT, 1);
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, this.somD.t); gl.uniform1i(u.uSombraD, 2);
  },
  dibujarMalla(m) { gl.bindVertexArray(m.vao); if (m.ib) gl.drawElements(gl.TRIANGLES, m.n, m.idx32 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT, 0); else gl.drawArrays(gl.TRIANGLES, 0, m.n); this.stats.llamadas++; this.stats.tris += m.n / 3; },
  dibujarMuneco(u, m, sombra) {
    gl.uniformMatrix4fv(u.uHuesos, false, m.huesos);
    if (!sombra) {
      gl.uniform2f(u.uCara, m.cara % 10, m.estiloCara + 0);
      const k = m.kit;
      gl.uniform4f(u.uPatron, k ? k.patron : 0, k ? k.esc || 5 : 5, 0, 0);
      gl.uniform3fv(u.uCol2, k ? k.c2v : [1, 1, 1]); gl.uniform3fv(u.uNumCol, k ? k.numv : [1, 1, 1]);
      gl.uniform1f(u.uID, m.id / 255); gl.uniform4fv(u.uTinte, m.tinte || [0, 0, 0, 0]);
    }
    this.dibujarMalla(m.fig.malla);
  },
  // ---- el cuadro completo ----
  dibujar(t, munecos, vista) {
    this.stats.llamadas = 0; this.stats.tris = 0;
    const E = this.E, asp = (vista ? vista.w / vista.h : this.w / this.h);
    this.camara(asp);
    // sombra fija del escenario (una vez por escenario y calidad)
    if (E && !this.fijaLista) {
      this.matLuz(this.luz.VP, E.centro[0], E.centro[1], E.radioSombra, 70);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.somT.fb); gl.viewport(0, 0, this.somT.n, this.somT.n);
      gl.clear(gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST); gl.enable(gl.CULL_FACE); gl.cullFace(gl.FRONT);
      const u = GL.usar(this.pEscS); gl.uniformMatrix4fv(u.uVP, false, this.luz.VP);
      for (const m of this.escMallas) if (!m.sinSombra) this.dibujarMalla(m);
      gl.cullFace(gl.BACK);
      this.fijaLista = true;
    }
    // sombra de los jugadores y la pelota (cada cuadro, sólo la cancha)
    const fx = E ? E.centro[0] : 0, fz = E ? E.centro[1] : 0;
    this.matLuz(this.luz.VPD, fx, fz, E ? E.radioJug : 26, 50);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.somD.fb); gl.viewport(0, 0, this.somD.n, this.somD.n);
    gl.clear(gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
    let u = GL.usar(this.pMunS); gl.uniformMatrix4fv(u.uVP, false, this.luz.VPD);
    for (const m of munecos) if (!m.sinSombra) this.dibujarMuneco(u, m, true);
    // la escena
    const D = this.esc;
    gl.bindFramebuffer(gl.FRAMEBUFFER, D.fb);
    if (vista) { gl.viewport(vista.x, vista.y, vista.w, vista.h); gl.enable(gl.SCISSOR_TEST); gl.scissor(vista.x, vista.y, vista.w, vista.h); }
    else gl.viewport(0, 0, D.w, D.h);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK);
    if (E) {
      u = GL.usar(this.pEsc); this.uniformesLuz(u);
      gl.uniformMatrix4fv(u.uVP, false, this.VP); gl.uniform1f(u.uTiempo, t); gl.uniform1f(u.uRayas, this.rayas); gl.uniform1f(u.uID, 0.02);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.texAtlas); gl.uniform1i(u.uAtlas, 0);
      for (const m of this.escMallas) { if (m.dobleCara) gl.disable(gl.CULL_FACE); this.dibujarMalla(m); if (m.dobleCara) gl.enable(gl.CULL_FACE); }
    }
    // muñecos y pelota
    gl.disable(gl.CULL_FACE);
    u = GL.usar(this.pMun); this.uniformesLuz(u); gl.uniformMatrix4fv(u.uVP, false, this.VP);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.texCaras); gl.uniform1i(u.uCaras, 0);
    for (const m of munecos) this.dibujarMuneco(u, m, false);
    // redes
    if (this.red.length) {
      u = GL.usar(this.pRed); this.uniformesLuz(u); gl.uniformMatrix4fv(u.uVP, false, this.VP); gl.uniform1f(u.uTiempo, t); gl.uniform1f(u.uID, 1.0);
      for (const r of this.red) { gl.uniform4fv(u.uGolpe, r.golpe); this.dibujarMalla(r.malla); }
    }
    // público
    if (this.pub) {
      u = GL.usar(this.pPub); this.uniformesLuz(u); gl.uniformMatrix4fv(u.uVP, false, this.VP); gl.uniform1f(u.uTiempo, t); gl.uniform1f(u.uFervor, this.fervor);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.texPub); gl.uniform1i(u.uPub, 0);
      gl.bindVertexArray(this.pub.vao); gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, this.pub.n); this.stats.llamadas++; this.stats.tris += this.pub.n * 2;
    }
    // partículas
    if (PTOS.n) {
      const n = Math.min(PTOS.n, 4000), d = this.ptoDatos;
      for (let i = 0; i < n; i++) { const p = PTOS.L[i], o = i * 8; d[o] = p.x; d[o + 1] = p.y; d[o + 2] = p.z; d[o + 3] = p.tam; d[o + 4] = p.r; d[o + 5] = p.g; d[o + 6] = p.b; d[o + 7] = p.forma; }
      gl.bindBuffer(gl.ARRAY_BUFFER, this.ptoBuf); gl.bufferSubData(gl.ARRAY_BUFFER, 0, d, 0, n * 8);
      u = GL.usar(this.pPto); gl.uniformMatrix4fv(u.uVP, false, this.VP); gl.uniform1f(u.uEsc, (vista ? vista.h : D.h) * 0.9);
      gl.bindVertexArray(this.ptoVao); gl.drawArrays(gl.POINTS, 0, n); this.stats.llamadas++;
    }
    // cielo (atrás de todo)
    u = GL.usar(this.pCielo);
    gl.uniformMatrix4fv(u.uInvVP, false, this.invVP); gl.uniform3fv(u.uCenit, this.cielo.cenit); gl.uniform3fv(u.uHoriz, this.cielo.horiz);
    gl.uniform3f(u.uCam, this.cam.x, this.cam.y, this.cam.z); gl.uniform3fv(u.uSolDir, this.sol.dir); gl.uniform1f(u.uTiempo, t); gl.uniform1f(u.uNoche, this.noche);
    gl.uniform1f(u.uTramaPaso, Math.max(3, 4.2 * this.w / Math.max(1, this.cssW) * 0.9));
    gl.bindVertexArray(this.vaoVacio); gl.drawArrays(gl.TRIANGLES, 0, 3); this.stats.llamadas++;
    if (vista) gl.disable(gl.SCISSOR_TEST);
    gl.bindVertexArray(null);
  },
  // la pasada final a la pantalla
  post(t) {
    const D = this.esc;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, this.w, this.h);
    gl.disable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
    const u = GL.usar(this.pPost);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, D.col); gl.uniform1i(u.uCol, 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, D.nor); gl.uniform1i(u.uNor, 1);
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, D.prof); gl.uniform1i(u.uProf, 2);
    gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, this.texPapel); gl.uniform1i(u.uPapel, 3);
    gl.uniform2f(u.uPx, 1 / D.w, 1 / D.h); gl.uniform2f(u.uCerca, this.cam.cerca || 0.3, this.cam.lejos || 160);
    gl.uniform1f(u.uGrosor, Math.max(1, D.h / 640 * 1.15)); gl.uniform1f(u.uTiempo, t);
    gl.uniform1f(u.uVeloc, this.veloc); gl.uniform2fv(u.uCentroV, this.centroV); gl.uniform1f(u.uInvertir, this.invertir);
    gl.uniform1f(u.uFundido, this.fundido); gl.uniform3fv(u.uFundCol, this.fundCol); gl.uniform1f(u.uSepia, this.sepia);
    gl.uniform3f(u.uTinta, 0.086, 0.075, 0.12);
    gl.bindVertexArray(this.vaoVacio); gl.drawArrays(gl.TRIANGLES, 0, 3); this.stats.llamadas++;
    gl.bindVertexArray(null);
  },
};
// las partículas (compactadas en el lugar, sin splice)
const PTOS = { L: [], n: 0 };
function particula(x, y, z, vx, vy, vz, vida, tam, col, forma, grav, roce) {
  if (PTOS.n >= 3000) return;
  let p = PTOS.L[PTOS.n];
  if (!p) { p = {}; PTOS.L[PTOS.n] = p; }
  const c = hexRgb(col);
  p.x = x; p.y = y; p.z = z; p.vx = vx; p.vy = vy; p.vz = vz; p.t = 0; p.vida = vida; p.tam = tam; p.r = c[0] / 255; p.g = c[1] / 255; p.b = c[2] / 255; p.forma = forma || 0; p.grav = grav == null ? 9.8 : grav; p.roce = roce == null ? 0.5 : roce;
  PTOS.n++;
}
function pasoParticulas(dt) {
  let j = 0;
  for (let i = 0; i < PTOS.n; i++) {
    const p = PTOS.L[i];
    p.t += dt;
    if (p.t >= p.vida) continue;
    p.vy -= p.grav * dt; const k = Math.max(0, 1 - p.roce * dt);
    p.vx *= k; p.vz *= k; if (p.grav < 3) p.vy *= k;
    p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
    if (p.y < 0.02) { p.y = 0.02; p.vy *= -0.3; p.vx *= 0.6; p.vz *= 0.6; }
    if (j !== i) { PTOS.L[i] = PTOS.L[j]; PTOS.L[j] = p; }
    j++;
  }
  PTOS.n = j;
}
