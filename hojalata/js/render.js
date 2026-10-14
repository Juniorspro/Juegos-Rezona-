// HOJALATA — el dibujo de lata en WebGL2: metal pintado con brillo GGX y el reflejo de la pieza (la ventana con
// parantes se ve en cada autito), sombras (fija de la casa y la pista + chica de los autitos), lámparas, fondo de
// cielo, partículas que brillan, fantasma tramado, y el posproceso de miniatura: brillo en cadena (bloom), foco
// corto (tilt-shift), ACES, color de la hora del día, viñeta y grano.
const SH_COMUN = `
uniform vec3 uSolDir, uSolCol, uCielo, uSuelo, uCam, uNieblaCol;
uniform vec3 uEnvTecho, uEnvPared, uEnvPiso, uVenDir, uVenCol;
uniform float uVenTam, uNiebla, uEscHDR, uNLuces, uTiempo;
uniform vec4 uLuces[4]; uniform vec3 uLucesCol[4];
uniform mat4 uLuzVP, uLuzVPD;
uniform sampler2DShadow uSombraT, uSombraD;
uniform float uSombraOn;
float muestra(sampler2DShadow s, mat4 vp, vec3 p, float sesgo) {
  vec4 q = vp * vec4(p, 1.0); vec3 c = q.xyz / q.w * 0.5 + 0.5;
  if (c.x < 0.0 || c.x > 1.0 || c.y < 0.0 || c.y > 1.0 || c.z > 1.0) return 1.0;
  return texture(s, vec3(c.xy, c.z - sesgo));
}
float sombra(vec3 p, vec3 n) { if (uSombraOn < 0.5) return 1.0; vec3 q = p + n * 0.03; return min(muestra(uSombraT, uLuzVP, q, 0.0006), muestra(uSombraD, uLuzVPD, q, 0.0015)); }
float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float ruido(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p) { return ruido(p) * 0.55 + ruido(p * 2.03 + 7.1) * 0.3 + ruido(p * 4.1 + 3.7) * 0.15; }
// el reflejo de la pieza: piso, paredes, techo y la ventana con su cruz de parantes
vec3 envLuz(vec3 r, float rough) {
  float k = 0.12 + rough * 0.7;
  vec3 c = mix(uEnvPiso, uEnvPared, smoothstep(-k - 0.12, k * 0.45, r.y));
  c = mix(c, uEnvTecho, smoothstep(0.25 - k * 0.3, 0.9, r.y));
  float d = dot(r, uVenDir), bd = 0.01 + rough * rough * 0.7;
  float w = smoothstep(uVenTam - bd, uVenTam + bd * 0.25, d);
  if (w > 0.0 && rough < 0.55) {
    vec3 a = normalize(cross(uVenDir, vec3(0.0, 1.0, 0.0) + vec3(0.0001))), b = cross(a, uVenDir);
    vec2 q = vec2(dot(r, a), dot(r, b)) / max(0.05, sqrt(max(0.0, 1.0 - uVenTam * uVenTam)));
    float par = max(step(abs(q.x), 0.07), step(abs(q.y + 0.15), 0.06));
    w *= 1.0 - par * (1.0 - rough * 1.8) * 0.9;
  }
  return c + uVenCol * w;
}
vec3 sombrear(vec3 alb, vec3 n, vec3 p, float rough, float metal, float ao, float sh) {
  vec3 v = normalize(uCam - p), L = uSolDir;
  float ndl = max(dot(n, L), 0.0), ndv = max(dot(n, v), 0.001);
  vec3 h = normalize(L + v);
  float ndh = max(dot(n, h), 0.0), a = rough * rough, a2 = a * a, dd = ndh * ndh * (a2 - 1.0) + 1.0;
  float D = a2 / (3.14159 * dd * dd), k = (rough + 1.0) * (rough + 1.0) * 0.125;
  float Vis = 0.25 / ((ndl * (1.0 - k) + k) * (ndv * (1.0 - k) + k));
  vec3 F0 = mix(vec3(0.04), alb, metal);
  vec3 F = F0 + (1.0 - F0) * pow(1.0 - max(dot(h, v), 0.0), 5.0);
  vec3 dif = alb * (1.0 - metal);
  vec3 amb = mix(uSuelo, uCielo, n.y * 0.5 + 0.5);
  vec3 c = dif * (uSolCol * ndl * sh + amb * ao);
  c += min(D * Vis, 40.0) * F * uSolCol * ndl * sh;
  vec3 r = reflect(-v, n);
  vec3 Fr = F0 + (max(vec3(1.0 - rough), F0) - F0) * pow(1.0 - ndv, 5.0);
  c += envLuz(r, rough) * Fr * ao * (0.55 + 0.45 * sh);
  for (int i = 0; i < 4; i++) {
    if (float(i) >= uNLuces) break;
    vec3 dl = uLuces[i].xyz - p; float dist = length(dl); vec3 l = dl / max(dist, 0.001);
    float at = clamp(1.0 - dist / uLuces[i].w, 0.0, 1.0); at *= at;
    float nl = max(dot(n, l), 0.0); vec3 hh = normalize(l + v);
    float sp = pow(max(dot(n, hh), 0.0), mix(180.0, 8.0, rough)) * (1.0 - rough * 0.7);
    c += uLucesCol[i] * at * (dif * nl + F0 * sp * nl * 4.0 + dif * 0.08);
  }
  return c;
}
vec3 niebla(vec3 c, vec3 p) { float d = length(p - uCam); return mix(c, uNieblaCol * 0.7, clamp((d - uNiebla) / (uNiebla * 3.0), 0.0, 0.55)); }
`;
const SH = {
  // ---- la casa y la pista: madera, baldosas, chapa de la pista, pasto, tela, cerámica… ----
  escVS: `
layout(location=0) in vec3 aP; layout(location=1) in vec4 aN; layout(location=2) in vec4 aC; layout(location=3) in vec2 aT;
uniform mat4 uVP;
out vec3 vP; out vec3 vN; out vec4 vC; out vec2 vT;
void main() { vP = aP; vN = aN.xyz; vC = aC; vT = aT; gl_Position = uVP * vec4(aP, 1.0); }`,
  escFS: SH_COMUN + `
in vec3 vP; in vec3 vN; in vec4 vC; in vec2 vT;
uniform sampler2D uAtlas; uniform vec3 uPista1, uPista2, uPista3;
layout(location=0) out vec4 oC;
void main() {
  vec3 n = dot(vN, vN) > 1e-10 ? normalize(vN) : vec3(0.0, 1.0, 0.0), base = vC.rgb;
  int mat = int(vC.a * 255.0 + 0.5);
  float rough = 0.6, metal = 0.0, ao = 1.0, emis = 0.0;
  if (mat == 4) {            // madera: tablas con vetas
    vec2 q = vec2(dot(vP.xz, vec2(0.0, 1.0)) * 0.42, vP.x * 0.06 + vP.y * 0.3);
    float tabla = floor(q.x), f = fract(q.x);
    float veta = sin((q.y * 9.0 + ruido(vec2(q.y * 3.0, tabla * 3.1)) * 6.0 + tabla * 5.0)) * 0.5 + 0.5;
    base *= 0.82 + 0.22 * veta * (0.6 + 0.4 * h21(vec2(tabla, 1.0))) + 0.1 * (h21(vec2(tabla, 3.0)) - 0.5);
    base *= 1.0 - 0.45 * (1.0 - smoothstep(0.0, 0.02, f)) - 0.3 * smoothstep(0.985, 1.0, f);
    rough = 0.42;
  } else if (mat == 5) {     // baldosas con junta
    vec2 q = vP.xz / 2.2, f = abs(fract(q) - 0.5);
    float junta = smoothstep(0.47, 0.485, max(f.x, f.y));
    float t = h21(floor(q));
    base *= 0.93 + 0.1 * t; base = mix(base, base * vec3(0.62, 0.6, 0.58), junta);
    rough = mix(0.16, 0.8, junta);
  } else if (mat == 6) {     // la pista de chapa litografiada: cordones, línea punteada, remaches y desgaste
    float u = vT.x, s = vT.y;
    vec3 c = uPista1;
    float borde = 1.0 - step(0.085, u) * step(u, 0.915);
    c = mix(c, mix(uPista2, vec3(0.96, 0.93, 0.86), step(0.5, fract(s * 0.5))), borde);
    float filete = step(abs(u - 0.1), 0.008) + step(abs(u - 0.9), 0.008);
    c = mix(c, uPista3, clamp(filete, 0.0, 1.0));
    float linea = step(abs(u - 0.5), 0.012) * step(0.45, fract(s * 0.35));
    c = mix(c, vec3(0.97, 0.94, 0.86), linea);
    float rem = 1.0 - smoothstep(0.03, 0.045, length(vec2((abs(u - 0.5) - 0.455) * 9.0, fract(s * 0.5 + 0.25) - 0.5)));
    c = mix(c, vec3(0.82, 0.84, 0.88), rem);
    float ray = smoothstep(0.82, 0.9, ruido(vec2(u * 40.0, s * 3.0))) * smoothstep(0.5, 0.7, ruido(vP.xz * 0.6));
    base = mix(c, vec3(0.75, 0.77, 0.8), ray * 0.8);
    rough = mix(0.34, 0.2, ray + rem); metal = mix(0.3, 0.95, max(ray, rem));
  } else if (mat == 7) {     // agua o vidrio: refleja la pieza
    float o = sin(vP.x * 3.0 + uTiempo * 1.4) * sin(vP.z * 2.6 - uTiempo * 1.1);
    n = normalize(n + vec3(o * 0.06, 0.0, o * 0.05));
    rough = 0.06; metal = 0.0; base *= 0.5;
  } else if (mat == 8) {     // luz propia (lámparas, foquitos, ventana)
    emis = 1.0;
  } else if (mat == 9) {     // pasto
    float r = fbm(vP.xz * 0.9);
    base *= 0.74 + 0.4 * r + 0.15 * h21(floor(vP.xz * 9.0));
    rough = 0.85;
  } else if (mat == 10) {    // tela, toalla y alfombra: trama
    vec2 q = vP.xz * 7.0 + vP.y * 3.0;
    base *= 0.84 + 0.12 * (step(0.5, fract(q.x)) * 0.5 + step(0.5, fract(q.y)) * 0.5) + 0.08 * ruido(q * 0.2);
    rough = 0.95;
  } else if (mat == 13) {    // plástico brillante
    rough = 0.22;
  } else if (mat == 14) {    // jabón: lisito y resbaloso
    rough = 0.12; base *= 1.05;
  } else if (mat == 15) {    // cartón y papel
    base *= 0.9 + 0.1 * ruido(vP.xz * 14.0 + vP.y * 9.0); rough = 0.9;
  } else if (mat == 16) {    // cerámica esmaltada
    rough = 0.12;
  } else if (mat == 17) {    // tierra con piedritas
    float r = fbm(vP.xz * 1.3), r2 = h21(floor(vP.xz * 6.0));
    base *= 0.78 + 0.32 * r; base *= 1.0 - 0.22 * step(0.94, r2); rough = 0.95;
  } else if (mat == 18) {    // ladrillo o pared con zócalo
    vec2 b = vec2(vT.x / 1.2, vP.y / 0.45); b.x += step(1.0, mod(b.y, 2.0)) * 0.5;
    vec2 f = fract(b); float junta = step(f.x, 0.05) + step(f.y, 0.09);
    base *= 0.86 + 0.2 * h21(floor(b)); base = mix(base, base * 1.35, clamp(junta, 0.0, 1.0)); rough = 0.9;
  } else if (mat == 19) {    // metal pintado viejo (ollas, baúl, regadera)
    rough = 0.38; metal = 0.55; base *= 0.9 + 0.12 * fbm(vP.xz * 2.0 + vP.y * 3.0);
  } else if (mat == 2) {     // cromo o lata pelada
    rough = 0.14; metal = 1.0;
  } else if (mat == 20 || mat == 22) {   // dibujos del atlas (etiquetas, carteles, libros)
    vec4 t = texture(uAtlas, vT); base = mix(base, t.rgb, t.a);
    rough = 0.55; if (mat == 22) emis = 0.7;
  } else if (mat == 21) {    // almohadilla de turbo: flechas que corren
    float u = vT.x, s = vT.y;
    float fl = step(0.5, fract(s * 1.2 - abs(u - 0.5) * 1.6 - uTiempo * 2.2));
    base = mix(vec3(1.0, 0.45, 0.08), vec3(1.0, 0.85, 0.2), fl); emis = 0.9 + 0.4 * fl; rough = 0.3;
  } else if (mat == 23) {    // corcho y tapitas
    base *= 0.8 + 0.3 * h21(floor(vP.xz * 30.0)); rough = 0.9;
  } else if (mat == 24) {    // hilo, lana
    base *= 0.85 + 0.15 * step(0.5, fract((vP.y + vP.x * 0.3) * 30.0)); rough = 0.9;
  } else if (mat == 25) {    // vía de tren: durmientes de madera
    rough = 0.7; base *= 0.85 + 0.2 * ruido(vP.xz * 4.0);
  }
  base *= base;               // a lineal
  float sh = sombra(vP, n);
  vec3 c = sombrear(base, n, vP, rough, metal, ao, sh);
  if (mat == 7) c = mix(c, envLuz(reflect(-normalize(uCam - vP), n), 0.05) * 0.8, 0.45);
  c += base * emis * 3.2;
  oC = vec4(niebla(c, vP) * uEscHDR, 1.0);
}`,
  sombraEscVS: `layout(location=0) in vec3 aP; uniform mat4 uVP; void main() { gl_Position = uVP * vec4(aP, 1.0); }`,
  vacioFS: `out vec4 o; void main() { o = vec4(1.0); }`,
  // ---- autitos y personajes: piezas rígidas con huesos (ruedas, llave, cabeza, bufanda) ----
  autVS: `
layout(location=0) in vec3 aP; layout(location=1) in vec4 aN; layout(location=2) in vec4 aC; layout(location=3) in vec2 aT; layout(location=4) in uint aB;
uniform mat4 uVP; uniform mat4 uHuesos[10];
out vec3 vP; out vec3 vN; out vec4 vC; out vec2 vT; out vec3 vL;
void main() { mat4 m = uHuesos[aB]; vec4 p = m * vec4(aP, 1.0); vP = p.xyz; vN = mat3(m) * aN.xyz; vC = aC; vT = aT; vL = aP; gl_Position = uVP * p; }`,
  autFS: SH_COMUN + `
in vec3 vP; in vec3 vN; in vec4 vC; in vec2 vT; in vec3 vL;
uniform sampler2D uCaras; uniform vec2 uCara; uniform vec4 uPatron; uniform vec3 uCol2, uCol3; uniform float uDesgaste, uFantasma, uBrillo;
uniform vec4 uTinte;
layout(location=0) out vec4 oC;
void main() {
  if (uFantasma > 0.0) { vec2 q = floor(gl_FragCoord.xy); if (mod(q.x + q.y, 2.0) < 1.0) discard; }
  vec3 n = dot(vN, vN) > 1e-10 ? normalize(vN) : vec3(0.0, 1.0, 0.0), base = vC.rgb;
  int f = int(vC.a * 255.0 + 0.5);
  float rough = 0.5, metal = 0.0, emis = 0.0;
  if (f == 1) {              // carrocería de lata litografiada: el dibujo sale de la posición local
    float k = 0.0, z = vL.z, x = vL.x, y = vL.y;
    int pt = int(uPatron.x + 0.5);
    if (pt == 1) k = step(abs(abs(x) - 0.07), 0.035);                         // dos franjas a lo largo
    else if (pt == 2) k = step(abs(z + 0.05), 0.09) * step(0.5, fract((x + 1.0) * 10.0 + step(0.5, fract((y + 1.0) * 10.0)) * 0.5)); // banda a cuadros
    else if (pt == 3) { vec2 q = vec2(z, y) * 18.0 + vec2(step(0.5, fract(x * 9.0)) * 0.5); k = step(length(fract(q) - 0.5), 0.26); } // lunares
    else if (pt == 4) k = step(abs(y - 0.13 - 0.03 * abs(fract(z * 7.0) - 0.5) * 4.0), 0.025);            // zigzag
    else if (pt == 5) { vec2 q = vec2(z * 7.0, y * 7.0 + x * 3.0); vec2 c = fract(q) - 0.5; float a = atan(c.y, c.x); float r = 0.12 + 0.08 * cos(a * 5.0); k = step(length(c), r); } // estrellitas
    else if (pt == 6) k = step(0.0, sin(z * 26.0 + y * 6.0)) * step(abs(y - 0.16), 0.05);                // llamas de rayas
    base = mix(base, uCol2, k);
    // filete del color 3 en la cintura
    base = mix(base, uCol3, step(abs(y - uPatron.y), 0.012));
    // desgaste: rayones que muestran la lata y puntitos de óxido
    float ray = smoothstep(0.86, 0.93, ruido(vec2(z * 60.0 + x * 9.0, y * 6.0))) * uDesgaste;
    float ox = smoothstep(0.78, 0.86, fbm(vL.xz * 9.0 + vL.y * 5.0)) * uDesgaste * 0.8;
    base = mix(base, vec3(0.78, 0.8, 0.84), ray);
    base = mix(base, vec3(0.45, 0.25, 0.12), ox);
    rough = mix(0.24, 0.16, ray) + ox * 0.5; metal = mix(0.28, 1.0, ray) * (1.0 - ox);
    rough = mix(rough, 0.12, uBrillo); metal = mix(metal, 0.85, uBrillo);
  } else if (f == 2) { rough = 0.12; metal = 1.0;            // cromo
  } else if (f == 3) { rough = 0.85; base *= 0.5;            // goma
  } else if (f == 7) { rough = 0.05; metal = 0.0; base *= 0.35;   // vidrio
  } else if (f == 8) { emis = 1.0; rough = 0.3;              // faros
  } else if (f == 11) {      // la cara del conductor (atlas: personaje × gesto)
    vec2 uv = clamp(vT, 0.0, 1.0);
    vec4 t = texture(uCaras, (uCara + uv) * vec2(1.0 / 16.0, 1.0 / 8.0));
    base = mix(base, t.rgb, t.a * step(0.001, vT.x) * step(vT.x, 0.999) * step(0.001, vT.y) * step(vT.y, 0.999));
    rough = 0.4; metal = 0.15;
  } else if (f == 12) {      // el número en el capot y los costados
    vec4 t = texture(uCaras, vT); base = mix(base, uCol3, t.a); rough = 0.3; metal = 0.2;
  } else if (f == 13) { rough = 0.2;                         // plástico
  } else if (f == 14) { rough = 0.4; metal = 0.15;           // lata pintada del conductor
  } else if (f == 15) { rough = 0.9;                         // tela (bufanda)
  }
  base *= base;
  float sh = sombra(vP, n);
  vec3 c = sombrear(base, n, vP, rough, metal, 1.0, sh);
  if (f == 7) { vec3 v = normalize(uCam - vP); c = mix(c, envLuz(reflect(-v, n), 0.08) * 0.7, 0.3 + 0.5 * pow(1.0 - abs(dot(n, v)), 3.0)); }
  c += base * emis * 4.0;
  c = mix(c, uTinte.rgb, uTinte.a);
  if (uFantasma > 0.0) c = mix(c, vec3(0.5, 0.75, 1.2), 0.55);
  oC = vec4(niebla(c, vP) * uEscHDR, 1.0);
}`,
  autSombraVS: `layout(location=0) in vec3 aP; layout(location=4) in uint aB; uniform mat4 uVP; uniform mat4 uHuesos[10]; void main() { gl_Position = uVP * (uHuesos[aB] * vec4(aP, 1.0)); }`,
  // ---- cosas repetidas (cajitas sorpresa, tornillos, canicas, botones, pompas): una llamada por tipo ----
  instVS: `
layout(location=0) in vec3 aP; layout(location=1) in vec4 aN; layout(location=2) in vec4 aC; layout(location=3) in vec2 aT;
layout(location=5) in vec4 aI0; layout(location=6) in vec4 aI1;
uniform mat4 uVP;
out vec3 vP; out vec3 vN; out vec4 vC; out vec2 vT; out float vTinte;
void main() {
  float cy = cos(aI0.w), sy = sin(aI0.w), cx = cos(aI1.y), sx = sin(aI1.y);
  vec3 p = aP * aI1.x;
  p = vec3(p.x, p.y * cx - p.z * sx, p.y * sx + p.z * cx);
  vec3 nn = vec3(aN.x, aN.y * cx - aN.z * sx, aN.y * sx + aN.z * cx);
  p = vec3(p.x * cy + p.z * sy, p.y, -p.x * sy + p.z * cy);
  nn = vec3(nn.x * cy + nn.z * sy, nn.y, -nn.x * sy + nn.z * cy);
  vP = p + aI0.xyz; vN = nn; vC = aC; vT = aT; vTinte = aI1.z;
  gl_Position = uVP * vec4(vP, 1.0);
}`,
  instFS: SH_COMUN + `
in vec3 vP; in vec3 vN; in vec4 vC; in vec2 vT; in float vTinte;
uniform sampler2D uAtlas;
layout(location=0) out vec4 oC;
vec3 tinte(float i) { return i < 0.5 ? vec3(1.0) : i < 1.5 ? vec3(1.0, 0.35, 0.3) : i < 2.5 ? vec3(0.35, 0.6, 1.0) : i < 3.5 ? vec3(0.45, 1.0, 0.5) : i < 4.5 ? vec3(1.0, 0.85, 0.3) : vec3(0.9, 0.5, 1.0); }
void main() {
  vec3 n = dot(vN, vN) > 1e-10 ? normalize(vN) : vec3(0.0, 1.0, 0.0), base = vC.rgb;
  int f = int(vC.a * 255.0 + 0.5);
  float rough = 0.4, metal = 0.0, emis = 0.0;
  if (f == 1) base *= tinte(vTinte);
  else if (f == 2) { rough = 0.15; metal = 1.0; }
  else if (f == 7) { rough = 0.04; base = mix(base, tinte(vTinte), 0.55); }        // canica de vidrio
  else if (f == 8) { emis = 1.0; base *= tinte(vTinte); }
  else if (f == 9) {                                                                  // pompa: borde irisado
    vec3 v = normalize(uCam - vP); float fr = 1.0 - abs(dot(n, v));
    if (fr < 0.55 || h21(floor(gl_FragCoord.xy) + floor(uTiempo * 20.0)) > (fr - 0.55) * 3.0) discard;
    base = mix(vec3(0.85), 0.5 + 0.5 * cos(6.2831 * (fr * 1.3 + vec3(0.0, 0.33, 0.67)) + uTiempo), 0.45); rough = 0.05; emis = 0.15;
  }
  else if (f == 20) { vec4 t = texture(uAtlas, vT); base = mix(base, t.rgb, t.a); }
  base *= base;
  vec3 c = sombrear(base, n, vP, rough, metal, 1.0, sombra(vP, n));
  c += base * emis * 3.5;
  oC = vec4(niebla(c, vP) * uEscHDR, 1.0);
}`,
  instSombraVS: `
layout(location=0) in vec3 aP; layout(location=5) in vec4 aI0; layout(location=6) in vec4 aI1; uniform mat4 uVP;
void main() { float cy = cos(aI0.w), sy = sin(aI0.w); vec3 p = aP * aI1.x; p = vec3(p.x * cy + p.z * sy, p.y, -p.x * sy + p.z * cy); gl_Position = uVP * vec4(p + aI0.xyz, 1.0); }`,
  // ---- cielo del patio (degradé, sol y nubes de algodón) ----
  cieloVS: `out vec2 vQ; void main() { vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2) * 2.0 - 1.0; vQ = p; gl_Position = vec4(p, 1.0, 1.0); }`,
  cieloFS: `
in vec2 vQ; uniform mat4 uInvVP; uniform vec3 uCenit, uHoriz, uCam, uSolDir; uniform float uTiempo, uEscHDR;
layout(location=0) out vec4 oC;
float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float ruido(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
void main() {
  vec4 q = uInvVP * vec4(vQ, 1.0, 1.0); vec3 d = normalize(q.xyz / q.w - uCam);
  float h = clamp(d.y, 0.0, 1.0);
  vec3 c = mix(uHoriz, uCenit, pow(h, 0.5));
  vec2 p = d.xz / max(0.06, d.y) * 0.5 + vec2(uTiempo * 0.006, 0.0);
  float n = ruido(p * 0.8) * 0.6 + ruido(p * 2.1) * 0.3 + ruido(p * 4.7) * 0.1;
  float nube = smoothstep(0.55, 0.75, n) * smoothstep(0.02, 0.2, d.y);
  c = mix(c, mix(vec3(1.0, 0.97, 0.94), uHoriz * 1.1, 0.25) * 1.15, nube * 0.85);
  float s = max(dot(d, uSolDir), 0.0);
  c += vec3(1.0, 0.85, 0.6) * (pow(s, 600.0) * 30.0 + pow(s, 12.0) * 0.5);
  oC = vec4(c * uEscHDR, 1.0);
}`,
  // ---- partículas: chispas que brillan, polvo, gotas, papelitos ----
  ptoVS: `
layout(location=0) in vec4 aP; layout(location=1) in vec4 aC;
uniform mat4 uVP; uniform float uEsc;
out vec4 vC;
void main() { vec4 p = uVP * vec4(aP.xyz, 1.0); gl_Position = p; gl_PointSize = clamp(aP.w * uEsc / p.w, 1.5, 26.0); vC = aC; }`,
  ptoFS: `
in vec4 vC; uniform float uEscHDR;
layout(location=0) out vec4 oC;
void main() {
  vec2 q = gl_PointCoord - 0.5; float r = length(q);
  if (r > 0.5) discard;
  float k = vC.a > 1.5 ? (1.0 - r * 2.0) * vC.a : 1.0;
  oC = vec4(vC.rgb * vC.rgb * max(1.0, k) * uEscHDR, 1.0);
}`,
  // ---- posproceso ----
  postVS: `out vec2 vUV; void main() { vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2); vUV = p; gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }`,
  // achicar a la mitad con 13 muestras (con umbral para el brillo)
  bajarFS: `
in vec2 vUV; uniform sampler2D uTex; uniform vec2 uPx; uniform float uUmbral, uInv;
out vec4 o;
vec3 m(vec2 d) { return texture(uTex, vUV + d * uPx).rgb; }
void main() {
  vec3 a = m(vec2(-2, -2)), b = m(vec2(0, -2)), c = m(vec2(2, -2)), d = m(vec2(-1, -1)), e = m(vec2(1, -1)), f = m(vec2(-2, 0)), g = m(vec2(0, 0)),
       h = m(vec2(2, 0)), i = m(vec2(-1, 1)), j = m(vec2(1, 1)), k = m(vec2(-2, 2)), l = m(vec2(0, 2)), mm = m(vec2(2, 2));
  vec3 s = (d + e + i + j) * 0.125 + (a + b + f + g) * 0.03125 + (b + c + g + h) * 0.03125 + (f + g + k + l) * 0.03125 + (g + h + l + mm) * 0.03125;
  s *= uInv;
  if (any(isnan(s)) || any(isinf(s))) s = vec3(0.0);
  if (uUmbral > 0.0) { float br = max(s.r, max(s.g, s.b)); float q = clamp(br - uUmbral + 0.5, 0.0, 1.0); q = q * q * 0.5; s *= max(q, br - uUmbral) / max(br, 0.0001); s = min(s, vec3(12.0)); }
  o = vec4(s, 1.0);
}`,
  // agrandar con carpa de 9 muestras y sumar el nivel de arriba
  subirFS: `
in vec2 vUV; uniform sampler2D uTex, uBase; uniform vec2 uPx; uniform float uPeso;
out vec4 o;
void main() {
  vec3 s = texture(uTex, vUV + vec2(-1, -1) * uPx).rgb + texture(uTex, vUV + vec2(1, -1) * uPx).rgb + texture(uTex, vUV + vec2(-1, 1) * uPx).rgb + texture(uTex, vUV + vec2(1, 1) * uPx).rgb
    + 2.0 * (texture(uTex, vUV + vec2(0, -1) * uPx).rgb + texture(uTex, vUV + vec2(0, 1) * uPx).rgb + texture(uTex, vUV + vec2(-1, 0) * uPx).rgb + texture(uTex, vUV + vec2(1, 0) * uPx).rgb)
    + 4.0 * texture(uTex, vUV).rgb;
  o = vec4(texture(uBase, vUV).rgb + s / 16.0 * uPeso, 1.0);
}`,
  finalFS: `
in vec2 vUV;
uniform sampler2D uCol, uProf, uMedio, uCuarto, uBrillo;
uniform vec2 uCerca, uPx; uniform float uFoco, uRango, uDOF, uBloomK, uExpo, uSat, uContraste, uVineta, uTiempo, uInvHDR, uFundido, uConBrillo, uConCuarto, uVeloc;
uniform vec3 uGrado, uFundCol;
out vec4 o;
float lin(float d) { float z = d * 2.0 - 1.0; return 2.0 * uCerca.x * uCerca.y / (uCerca.y + uCerca.x - z * (uCerca.y - uCerca.x)); }
float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
void main() {
  vec2 uv = vUV;
  if (uVeloc > 0.0) { vec2 dd = uv - vec2(0.5, 0.55); uv -= dd * uVeloc * 0.025 * (0.5 + 0.5 * h21(vec2(floor(uTiempo * 30.0), 1.0))); }
  vec3 c = texture(uCol, uv).rgb * uInvHDR;
  if (any(isnan(c))) c = vec3(0.0);
  if (uDOF > 0.0) {
    float z = lin(texture(uProf, uv).r);
    float coc = clamp((abs(z - uFoco) - uRango * 0.35) / uRango, 0.0, 1.0);
    coc = max(coc, smoothstep(0.32, 0.5, abs(uv.y - 0.48)) * 0.35) * uDOF;
    vec3 m1 = texture(uMedio, uv).rgb * uInvHDR;
    c = mix(c, m1, smoothstep(0.0, 0.45, coc));
    if (uConCuarto > 0.0) c = mix(c, texture(uCuarto, uv).rgb * uInvHDR, smoothstep(0.45, 1.0, coc));
  }
  if (uConBrillo > 0.0) c += texture(uBrillo, uv).rgb * uInvHDR * uBloomK;
  if (uVeloc > 0.0) { vec2 dd = uv - vec2(0.5, 0.55); c += vec3(0.6, 0.8, 1.0) * smoothstep(0.35, 0.8, length(dd * vec2(1.0, 0.6))) * uVeloc * 0.25 * step(0.82, h21(vec2(floor(atan(dd.y, dd.x) * 40.0), floor(uTiempo * 20.0)))); }
  c = aces(max(c, vec3(0.0)) * uExpo);
  c = pow(c, vec3(1.0 / 2.2));
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  c = mix(vec3(l), c, uSat);
  c = (c - 0.5) * uContraste + 0.5;
  c *= uGrado;
  vec2 v = vUV - 0.5; c *= 1.0 - dot(v, v) * uVineta;
  c += (h21(gl_FragCoord.xy + fract(uTiempo) * 97.0) - 0.5) * 0.025;
  c = mix(c, uFundCol, uFundido);
  o = vec4(c, 1.0);
}`,
};

const R = {
  calidad: 'media', escala: 0.72, stats: { llamadas: 0, tris: 0 }, cam: { x: 0, y: 3, z: 6, tx: 0, ty: 0, tz: 0, fovY: 1.0, cerca: 0.08, lejos: 120 },
  VP: M4.nueva(), V: M4.nueva(), P: M4.nueva(), invVP: M4.nueva(),
  luz: { VP: M4.nueva(), VPD: M4.nueva(), tmp: M4.nueva() },
  amb: null, esc: null, fijaLista: false, hdr: false, foco: 4, rango: 3, dof: 1, bloom: 0.32, veloc: 0, fundido: 0, fundCol: [0.08, 0.06, 0.1],
  centroD: [0, 0, 0], radioD: 12, mallas: [], insts: {},
  iniciar() {
    const P = (a, b, n) => GL.programa(a, b, n);
    this.pEsc = P(SH.escVS, SH.escFS, 'esc'); this.pEscS = P(SH.sombraEscVS, SH.vacioFS, 'escS');
    this.pAut = P(SH.autVS, SH.autFS, 'aut'); this.pAutS = P(SH.autSombraVS, SH.vacioFS, 'autS');
    this.pInst = P(SH.instVS, SH.instFS, 'inst'); this.pInstS = P(SH.instSombraVS, SH.vacioFS, 'instS');
    this.pCielo = P(SH.cieloVS, SH.cieloFS, 'cielo'); this.pPto = P(SH.ptoVS, SH.ptoFS, 'pto');
    this.pBajar = P(SH.postVS, SH.bajarFS, 'bajar'); this.pSubir = P(SH.postVS, SH.subirFS, 'subir'); this.pFinal = P(SH.postVS, SH.finalFS, 'final');
    this.vaoVacio = gl.createVertexArray();
    this.hdr = !!gl.getExtension('EXT_color_buffer_float');
    this.blanco = GL.textura(1, 1, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, gl.NEAREST, new Uint8Array([255, 255, 255, 0]));
    this.texAtlas = this.blanco; this.texCaras = this.blanco;
    this.ptoVao = gl.createVertexArray(); gl.bindVertexArray(this.ptoVao);
    this.ptoBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this.ptoBuf); gl.bufferData(gl.ARRAY_BUFFER, 3000 * 32, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 32, 0); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 32, 16);
    gl.bindVertexArray(null);
    this.ptoDatos = new Float32Array(3000 * 8);
  },
  todos() { return [this.pEsc, this.pEscS, this.pAut, this.pAutS, this.pInst, this.pInstS, this.pCielo, this.pPto, this.pBajar, this.pSubir, this.pFinal]; },
  precompilar() { for (const p of this.todos()) GL.revisar(p); },
  // destino de color (HDR si se puede) con profundidad opcional
  destino(w, h, conProf) {
    const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    const col = this.hdr ? GL.textura(w, h, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT, gl.LINEAR) : GL.textura(w, h, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, gl.LINEAR);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, col, 0);
    let prof = null;
    if (conProf) { prof = GL.textura(w, h, gl.DEPTH_COMPONENT24, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, prof, 0); }
    gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
    let ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    if (!ok && this.hdr) { gl.deleteFramebuffer(fb); gl.deleteTexture(col); if (prof) gl.deleteTexture(prof); this.hdr = false; return this.destino(w, h, conProf); }
    return { fb, col, prof, w, h };
  },
  ponerCalidad(q) {
    this.calidad = q;
    this.escala = { baja: 0.42, media: 0.58, alta: 0.8 }[q] || 0.58;
    this.conBrillo = q !== 'baja'; this.conDOF = q !== 'baja'; this.conCuarto = q === 'alta';
    const nT = q === 'alta' ? 2048 : q === 'media' ? 1536 : 1024, nD = q === 'baja' ? 512 : 1024;
    if (!this.somT || this.somT.n !== nT) { GL.borrar(this.somT); this.somT = GL.destinoSombra(nT); this.fijaLista = false; }
    if (!this.somD || this.somD.n !== nD) { GL.borrar(this.somD); this.somD = GL.destinoSombra(nD); }
    if (this.cssW) this.tamano(this.cssW, this.cssH, this.dprAct, true);
  },
  tamano(cw, ch, dpr, forzar) {
    this.cssW = cw; this.cssH = ch; this.dprAct = dpr;
    const d = Math.min(dpr, 2) * this.escala, w = Math.max(64, Math.round(cw * d)), h = Math.max(64, Math.round(ch * d));
    if (cvGL.width !== w || cvGL.height !== h) { cvGL.width = w; cvGL.height = h; }
    if (!this.esc || this.esc.w !== w || this.esc.h !== h || forzar) {
      for (const k of ['esc', 'medio', 'cuarto', 'b1', 'b2', 'b3', 'u2', 'u1']) { if (this[k]) { GL.borrar(this[k]); this[k] = null; } }
      this.esc = this.destino(w, h, true);
      const w2 = Math.max(8, w >> 1), h2 = Math.max(8, h >> 1), w4 = Math.max(4, w2 >> 1), h4 = Math.max(4, h2 >> 1);
      this.medio = this.destino(w2, h2); this.cuarto = this.destino(w4, h4);
      this.b1 = this.destino(w4, h4); this.b2 = this.destino(Math.max(2, w4 >> 1), Math.max(2, h4 >> 1)); this.b3 = this.destino(Math.max(2, w4 >> 2), Math.max(2, h4 >> 2));
      this.u2 = this.destino(this.b2.w, this.b2.h); this.u1 = this.destino(w4, h4);
    }
    this.w = w; this.h = h;
  },
  // ---- el escenario: mallas fijas (casa + pista) y el ambiente (luz, colores, niebla) ----
  ponerEscenario(E) {
    for (const m of this.mallas) GL.borrarMalla(m);
    this.mallas = E.mallas; this.E = E; this.amb = E.amb; this.fijaLista = false;
    if (E.atlas) { if (this.texAtlas !== this.blanco) gl.deleteTexture(this.texAtlas); this.texAtlas = GL.texturaLienzo(E.atlas, true); }
  },
  ponerInst(nombre, malla) { this.insts[nombre] = { malla, n: 0, datos: new Float32Array(256 * 8), buf: null, vao: null }; this.armarInst(this.insts[nombre]); },
  armarInst(I) {
    const m = I.malla;
    gl.bindVertexArray(m.vao);
    I.buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, I.buf); gl.bufferData(gl.ARRAY_BUFFER, I.datos.byteLength, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(5); gl.vertexAttribPointer(5, 4, gl.FLOAT, false, 32, 0); gl.vertexAttribDivisor(5, 1);
    gl.enableVertexAttribArray(6); gl.vertexAttribPointer(6, 4, gl.FLOAT, false, 32, 16); gl.vertexAttribDivisor(6, 1);
    gl.bindVertexArray(null);
  },
  // cada cuadro: vaciar y cargar las instancias
  inst(nombre, x, y, z, yaw, esc, giro, tinte) {
    const I = this.insts[nombre]; if (!I || I.n >= 256) return;
    const o = I.n * 8, d = I.datos;
    d[o] = x; d[o + 1] = y; d[o + 2] = z; d[o + 3] = yaw; d[o + 4] = esc; d[o + 5] = giro || 0; d[o + 6] = tinte || 0; d[o + 7] = 0;
    I.n++;
  },
  vaciarInst() { for (const k in this.insts) this.insts[k].n = 0; },
  // ---- cámara ----
  camara(asp) {
    const c = this.cam;
    M4.persp(this.P, c.fovY, asp, c.cerca, c.lejos);
    M4.mirar(this.V, c.x, c.y, c.z, c.tx, c.ty, c.tz, 0, 1, 0);
    M4.mul(this.VP, this.P, this.V);
    M4.inv(this.invVP, this.VP);
  },
  matLuz(o, cx, cy, cz, rad, prof) {
    const d = this.amb.sol, l = this.luz.tmp;
    M4.mirar(l, cx + d[0] * prof, cy + d[1] * prof, cz + d[2] * prof, cx, cy, cz, 0, 1, 0);
    M4.orto(o, -rad, rad, -rad, rad, 1, prof * 2.2);
    M4.mul(o, o, l);
  },
  uniformesLuz(u) {
    const A = this.amb;
    gl.uniform3fv(u.uSolDir, A.sol); gl.uniform3fv(u.uSolCol, A.solCol); gl.uniform3fv(u.uCielo, A.cielo); gl.uniform3fv(u.uSuelo, A.suelo);
    gl.uniform3f(u.uCam, this.cam.x, this.cam.y, this.cam.z); gl.uniform3fv(u.uNieblaCol, A.nieblaCol); gl.uniform1f(u.uNiebla, A.niebla);
    gl.uniform3fv(u.uEnvTecho, A.techo); gl.uniform3fv(u.uEnvPared, A.pared); gl.uniform3fv(u.uEnvPiso, A.piso); gl.uniform3fv(u.uVenDir, A.venDir); gl.uniform3fv(u.uVenCol, A.venCol); gl.uniform1f(u.uVenTam, A.venTam);
    gl.uniform1f(u.uEscHDR, this.hdr ? 1 : 0.5); gl.uniform1f(u.uTiempo, this.t || 0);
    const L = A.luces || [];
    gl.uniform1f(u.uNLuces, Math.min(4, L.length));
    if (L.length) { if (!this._lp) { this._lp = new Float32Array(16); this._lc = new Float32Array(12); } for (let i = 0; i < 4; i++) { const l = L[i]; if (!l) continue; this._lp.set([l[0], l[1], l[2], l[3]], i * 4); this._lc.set(l[4], i * 3); } gl.uniform4fv(u.uLuces, this._lp); gl.uniform3fv(u.uLucesCol, this._lc); }
    gl.uniformMatrix4fv(u.uLuzVP, false, this.luz.VP); gl.uniformMatrix4fv(u.uLuzVPD, false, this.luz.VPD);
    gl.uniform1f(u.uSombraOn, 1);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.somT.t); gl.uniform1i(u.uSombraT, 1);
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, this.somD.t); gl.uniform1i(u.uSombraD, 2);
  },
  dibujarMalla(m) { gl.bindVertexArray(m.vao); if (m.ib) gl.drawElements(gl.TRIANGLES, m.n, m.idx32 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT, 0); else gl.drawArrays(gl.TRIANGLES, 0, m.n); this.stats.llamadas++; this.stats.tris += m.n / 3; },
  // ¿la caja (de una malla) entra en la vista?
  visible(m) {
    const b = m.caja; if (!b) return true;
    const M = this.VP; let fuera = [0, 0, 0, 0, 0, 0];
    for (let i = 0; i < 8; i++) {
      const x = i & 1 ? b[3] : b[0], y = i & 2 ? b[4] : b[1], z = i & 4 ? b[5] : b[2];
      const cx = M[0] * x + M[4] * y + M[8] * z + M[12], cy = M[1] * x + M[5] * y + M[9] * z + M[13], cz = M[2] * x + M[6] * y + M[10] * z + M[14], cw = M[3] * x + M[7] * y + M[11] * z + M[15];
      if (cx < -cw) fuera[0]++; if (cx > cw) fuera[1]++; if (cy < -cw) fuera[2]++; if (cy > cw) fuera[3]++; if (cz < -cw) fuera[4]++; if (cz > cw) fuera[5]++;
    }
    for (let k = 0; k < 6; k++) if (fuera[k] === 8) return false;
    return true;
  },
  dibujarAuto(u, a, sombra) {
    gl.uniformMatrix4fv(u.uHuesos, false, a.huesos);
    if (!sombra) {
      const k = a.lito;
      gl.uniform2f(u.uCara, a.cara, a.filaCara);
      gl.uniform4f(u.uPatron, k.patron, k.cintura, 0, 0);
      gl.uniform3fv(u.uCol2, k.c2v); gl.uniform3fv(u.uCol3, k.c3v);
      gl.uniform1f(u.uDesgaste, k.desgaste || 0); gl.uniform1f(u.uBrillo, k.brillo || 0);
      gl.uniform1f(u.uFantasma, a.fantasma ? 1 : 0); gl.uniform4fv(u.uTinte, a.tinte || [0, 0, 0, 0]);
    }
    this.dibujarMalla(a.malla);
  },
  dibujarInst(u, sombra) {
    for (const k in this.insts) {
      const I = this.insts[k]; if (!I.n) continue;
      if (sombra && I.sinSombra) continue;
      gl.bindVertexArray(I.malla.vao); gl.drawArraysInstanced(gl.TRIANGLES, 0, I.malla.n, I.n);
      this.stats.llamadas++; this.stats.tris += I.malla.n / 3 * I.n;
    }
  },
  // ---- el cuadro completo: sombras, escena, cielo y partículas al destino HDR ----
  dibujar(t, autos, vista) {
    this.t = t;
    this.stats.llamadas = 0; this.stats.tris = 0;
    for (const k in this.insts) { const I = this.insts[k]; if (I.n) { gl.bindBuffer(gl.ARRAY_BUFFER, I.buf); gl.bufferSubData(gl.ARRAY_BUFFER, 0, I.datos, 0, I.n * 8); } }
    const E = this.E, A = this.amb;
    const D = this.esc, asp = vista ? vista.w / vista.h : D.w / D.h;
    this.camara(asp);
    if (E && !this.fijaLista) {
      this.matLuz(this.luz.VP, E.centro[0], E.centro[1], E.centro[2], E.radioSombra, 90);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.somT.fb); gl.viewport(0, 0, this.somT.n, this.somT.n);
      gl.clear(gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
      const u = GL.usar(this.pEscS); gl.uniformMatrix4fv(u.uVP, false, this.luz.VP);
      for (const m of this.mallas) if (!m.sinSombra) this.dibujarMalla(m);
      this.fijaLista = true;
    }
    // sombra chica: los autitos y las cosas sueltas cerca del foco
    const c = this.centroD;
    this.matLuz(this.luz.VPD, c[0], c[1], c[2], this.radioD, 40);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.somD.fb); gl.viewport(0, 0, this.somD.n, this.somD.n);
    gl.clear(gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
    let u = GL.usar(this.pAutS); gl.uniformMatrix4fv(u.uVP, false, this.luz.VPD);
    for (const a of autos) if (!a.sinSombra && !a.fantasma) this.dibujarAuto(u, a, true);
    u = GL.usar(this.pInstS); gl.uniformMatrix4fv(u.uVP, false, this.luz.VPD); this.dibujarInst(u, true);
    // la escena
    gl.bindFramebuffer(gl.FRAMEBUFFER, D.fb);
    if (vista) { gl.viewport(vista.x, vista.y, vista.w, vista.h); gl.enable(gl.SCISSOR_TEST); gl.scissor(vista.x, vista.y, vista.w, vista.h); }
    else gl.viewport(0, 0, D.w, D.h);
    const nc = A ? A.nieblaCol : [0.1, 0.1, 0.1], ke = (this.hdr ? 1 : 0.5) * 0.7;
    gl.clearColor(nc[0] * ke, nc[1] * ke, nc[2] * ke, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK);
    if (E) {
      u = GL.usar(this.pEsc); this.uniformesLuz(u);
      gl.uniformMatrix4fv(u.uVP, false, this.VP);
      gl.uniform3fv(u.uPista1, A.pista[0]); gl.uniform3fv(u.uPista2, A.pista[1]); gl.uniform3fv(u.uPista3, A.pista[2]);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.texAtlas); gl.uniform1i(u.uAtlas, 0);
      for (const m of this.mallas) { if (!this.visible(m)) continue; if (m.dobleCara) gl.disable(gl.CULL_FACE); this.dibujarMalla(m); if (m.dobleCara) gl.enable(gl.CULL_FACE); }
    }
    gl.disable(gl.CULL_FACE);
    if (autos.length) {
      u = GL.usar(this.pAut); this.uniformesLuz(u); gl.uniformMatrix4fv(u.uVP, false, this.VP);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.texCaras); gl.uniform1i(u.uCaras, 0);
      for (const a of autos) if (!a.oculto) this.dibujarAuto(u, a, false);
    }
    u = GL.usar(this.pInst); this.uniformesLuz(u); gl.uniformMatrix4fv(u.uVP, false, this.VP);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.texAtlas); gl.uniform1i(u.uAtlas, 0);
    this.dibujarInst(u, false);
    if (PTOS.n) {
      const n = Math.min(PTOS.n, 3000), d = this.ptoDatos;
      for (let i = 0; i < n; i++) { const p = PTOS.L[i], o = i * 8, k = 1 - p.t / p.vida; d[o] = p.x; d[o + 1] = p.y; d[o + 2] = p.z; d[o + 3] = p.tam * (p.achica ? k : 1); d[o + 4] = p.r; d[o + 5] = p.g; d[o + 6] = p.b; d[o + 7] = p.brillo * (p.brillo > 1.5 ? k : 1); }
      gl.bindBuffer(gl.ARRAY_BUFFER, this.ptoBuf); gl.bufferSubData(gl.ARRAY_BUFFER, 0, d, 0, n * 8);
      u = GL.usar(this.pPto); gl.uniformMatrix4fv(u.uVP, false, this.VP); gl.uniform1f(u.uEsc, (vista ? vista.h : D.h) * 0.9); gl.uniform1f(u.uEscHDR, ke);
      gl.bindVertexArray(this.ptoVao); gl.drawArrays(gl.POINTS, 0, n); this.stats.llamadas++;
    }
    if (A && A.cieloAfuera) {
      u = GL.usar(this.pCielo);
      gl.uniformMatrix4fv(u.uInvVP, false, this.invVP); gl.uniform3fv(u.uCenit, A.cenit); gl.uniform3fv(u.uHoriz, A.horiz);
      gl.uniform3f(u.uCam, this.cam.x, this.cam.y, this.cam.z); gl.uniform3fv(u.uSolDir, A.sol); gl.uniform1f(u.uTiempo, t); gl.uniform1f(u.uEscHDR, ke);
      gl.bindVertexArray(this.vaoVacio); gl.drawArrays(gl.TRIANGLES, 0, 3); this.stats.llamadas++;
    }
    if (vista) gl.disable(gl.SCISSOR_TEST);
    gl.bindVertexArray(null);
  },
  pasada(P, dest, fn) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, dest ? dest.fb : null);
    gl.viewport(0, 0, dest ? dest.w : this.w, dest ? dest.h : this.h);
    const u = GL.usar(P); fn(u);
    gl.bindVertexArray(this.vaoVacio); gl.drawArrays(gl.TRIANGLES, 0, 3); this.stats.llamadas++;
  },
  tex(u, nom, t, i) { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, t); gl.uniform1i(u[nom], i); },
  // posproceso: medio (foco), cuarto (foco fuerte), cadena del brillo y la mezcla final
  post(t) {
    const D = this.esc;
    gl.disable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
    const A = this.amb || {}, inv = this.hdr ? 1 : 2;
    if (this.conDOF || this.conBrillo) this.pasada(this.pBajar, this.medio, u => { this.tex(u, 'uTex', D.col, 0); gl.uniform2f(u.uPx, 1 / D.w, 1 / D.h); gl.uniform1f(u.uUmbral, 0); gl.uniform1f(u.uInv, 1); });
    if (this.conCuarto) this.pasada(this.pBajar, this.cuarto, u => { this.tex(u, 'uTex', this.medio.col, 0); gl.uniform2f(u.uPx, 1 / this.medio.w, 1 / this.medio.h); gl.uniform1f(u.uUmbral, 0); gl.uniform1f(u.uInv, 1); });
    if (this.conBrillo) {
      const um = (A.umbral || 1.1) / inv;
      this.pasada(this.pBajar, this.b1, u => { this.tex(u, 'uTex', this.medio.col, 0); gl.uniform2f(u.uPx, 1 / this.medio.w, 1 / this.medio.h); gl.uniform1f(u.uUmbral, um); gl.uniform1f(u.uInv, 1); });
      this.pasada(this.pBajar, this.b2, u => { this.tex(u, 'uTex', this.b1.col, 0); gl.uniform2f(u.uPx, 1 / this.b1.w, 1 / this.b1.h); gl.uniform1f(u.uUmbral, 0); gl.uniform1f(u.uInv, 1); });
      this.pasada(this.pBajar, this.b3, u => { this.tex(u, 'uTex', this.b2.col, 0); gl.uniform2f(u.uPx, 1 / this.b2.w, 1 / this.b2.h); gl.uniform1f(u.uUmbral, 0); gl.uniform1f(u.uInv, 1); });
      this.pasada(this.pSubir, this.u2, u => { this.tex(u, 'uTex', this.b3.col, 0); this.tex(u, 'uBase', this.b2.col, 1); gl.uniform2f(u.uPx, 1 / this.b3.w, 1 / this.b3.h); gl.uniform1f(u.uPeso, 1); });
      this.pasada(this.pSubir, this.u1, u => { this.tex(u, 'uTex', this.u2.col, 0); this.tex(u, 'uBase', this.b1.col, 1); gl.uniform2f(u.uPx, 1 / this.u2.w, 1 / this.u2.h); gl.uniform1f(u.uPeso, 1); });
    }
    this.pasada(this.pFinal, null, u => {
      this.tex(u, 'uCol', D.col, 0); this.tex(u, 'uProf', D.prof, 1); this.tex(u, 'uMedio', this.medio.col, 2); this.tex(u, 'uCuarto', this.cuarto.col, 3); this.tex(u, 'uBrillo', this.u1.col, 4);
      gl.uniform2f(u.uCerca, this.cam.cerca, this.cam.lejos); gl.uniform2f(u.uPx, 1 / D.w, 1 / D.h);
      gl.uniform1f(u.uFoco, this.foco); gl.uniform1f(u.uRango, this.rango); gl.uniform1f(u.uDOF, this.conDOF ? this.dof : 0); gl.uniform1f(u.uConCuarto, this.conCuarto ? 1 : 0);
      gl.uniform1f(u.uConBrillo, this.conBrillo ? 1 : 0); gl.uniform1f(u.uBloomK, this.bloom);
      gl.uniform1f(u.uExpo, A.expo || 1); gl.uniform1f(u.uSat, A.sat || 1.08); gl.uniform1f(u.uContraste, A.contraste || 1.04); gl.uniform1f(u.uVineta, A.vineta != null ? A.vineta : 0.55);
      gl.uniform3fv(u.uGrado, A.grado || [1, 1, 1]); gl.uniform1f(u.uTiempo, t); gl.uniform1f(u.uInvHDR, inv);
      gl.uniform1f(u.uFundido, this.fundido); gl.uniform3fv(u.uFundCol, this.fundCol); gl.uniform1f(u.uVeloc, this.veloc);
    });
    gl.bindVertexArray(null);
  },
};
// las partículas (compactadas en el lugar, sin splice)
const PTOS = { L: [], n: 0 };
function particula(x, y, z, vx, vy, vz, vida, tam, col, brillo, grav, roce, achica) {
  if (PTOS.n >= 2400) return;
  let p = PTOS.L[PTOS.n];
  if (!p) { p = {}; PTOS.L[PTOS.n] = p; }
  const c = hexRgb(col);
  p.x = x; p.y = y; p.z = z; p.vx = vx; p.vy = vy; p.vz = vz; p.t = 0; p.vida = vida; p.tam = tam; p.r = c[0] / 255; p.g = c[1] / 255; p.b = c[2] / 255;
  p.brillo = brillo || 1; p.grav = grav == null ? 9.8 : grav; p.roce = roce == null ? 0.5 : roce; p.achica = achica !== false; p.piso = -99;
  PTOS.n++;
  return p;
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
    if (p.y < p.piso) { p.y = p.piso; p.vy *= -0.35; p.vx *= 0.6; p.vz *= 0.6; }
    if (j !== i) { PTOS.L[i] = PTOS.L[j]; PTOS.L[j] = p; }
    j++;
  }
  PTOS.n = j;
}
