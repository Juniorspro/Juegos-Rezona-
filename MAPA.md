# MAPA (leer esto, no la guía entera)

Guía = `GUIA-JUEGOS.md` (~40k tokens). Leer solo el tramo: `Read offset=<línea> limit=<hasta la siguiente>`.

## Reglas fijas (sección 0)
1 HTML offline doble clic · 9:16 primero · bot juega cada modo + hoja de capturas · estilo propio y mejor que el
anterior · controles de dedo editables · portada 9:16 · lo chico rápido · números detrás · canciones ajenas fuera del
repo · ports solo gratis · no instalar nada · Rezona > Higgsfield.
**Siempre (pedido del dueño, manda sobre la guía):** al abrir, intro JXSTUDIOS (`comun/intro-jxs.js` + un `ESTILO_<JUEGO>`
en `js/intro.js` con fondo, monograma, letras y jingle del juego; toque la salta) → pantalla de idioma en cada arranque
(13 idiomas, el aviso rota por idioma) → título; globito para cambiarlo después. `?prueba` la salta (`&intro` la muestra).
**Sin lag:** medir con dibujo forzado (`getImageData` de 1 px por cuadro) y contar llamadas; lo quieto en caché/sellos,
lo animado en un solo trazo, luces a ¼, nada de `splice` en bucles, cuerdas de audio armadas de a tandas, `vibrate` solo
tras el primer toque.

## Tarea → líneas
| tarea | líneas |
|---|---|
| pedido/reglas | 33-60 |
| pasos de un juego | 61-81 |
| elegir técnica | 82-101 |
| 2D: armado 104 · pantalla 122 · arte código 146 · arte pintado 161 · letras 180 · escenas/botones 191 · bucle 210 · física x género 220 · rendimiento 251 · guardado 267 | 102-276 |
| 3D: regla luz 279 · pasadas 297 · luz números 320 · niebla 343 · terreno 389 · vegetación 402 · agua 434 · personaje/cámara 440 · post 461 · modelos 477 · rendimiento 537 · arranque 587 · multijugador 597 | 277-614 |
| assets: Rezona 617 · lista 660 · prompts 669 · procesar 743 · Higgsfield 777 · plan B 789 | 615-799 |
| celular: parado 802 · girar 817 · controles dedo 826 · toques 844 · CSS 855 | 800-871 |
| sonido: básico 874 · sintetizada 885 · generada 899 · canciones 907 | 872-918 |
| idiomas: cuáles 921 · armado 935 · probar 959 | 919-968 |
| pruebas: navegador 971 · API 986 · bots 1001 · mirar 1013 · dedos 1021 · medir 1031 | 969-1040 |
| entregar: HTML 1043 · portada 1065 · zip 1077 · APK 1084 · publicar 1101 · video 1114 · mandar 1123 | 1041-1131 |
| ports | 1132-1188 |
| trampas (tablas síntoma→arreglo) | 1189-1269 |
| checklist "listo" | 1270-1301 |

## Lo más usado, sin abrir la guía
- Bucle: rAF primero + try; `dt=max(0,min(.05,…))`; física paso fijo 60/s con semilla; animación con reloj real.
- Píxeles: W 180/216, `esc=floor(min(iw·dpr/W, ih·dpr/altoMin))`, lienzo a W·RES (RES≤4), smoothing off tras cada resize.
- Liso: 360 u de ancho, `setTransform(S,…)`, caché con clave S.
- Guardado: localStorage con prefijo, try/catch, `Object.assign(defaults, leído)`.
- Entrada: pointerId por dedo, clic = bajó y subió adentro, abrir cosas en pointerup, soltar todo en blur.
- 3D: sol 4,6 / hemi 0,5 / env 0,26; bloom 1,45; HDR→AgX una vez; resize al empezar el cuadro; `checkShaderErrors=false`; `compileAsync`.
- Pruebas: Chromium `/opt/pw-browsers/chromium`, viewport 360-412 dpr 3 touch; capturas con ruta absoluta fuera del repo; FPS de acá no valen.
- Entrega: probar por file://, 0 pedidos afuera, 0 errores; `replace` con función; escapar `</script`.

## Estado del repo
No existen `motor2d/`, `herramientas/` ni los juegos de ejemplo citados en la guía.
- `comun/intro-jxs.js`: la intro JXSTUDIOS compartida (`IntroJXS.crear({W,H,presenta,vibrar,estilo})`, `jingle`,
  `ELEGI_IDIOMA` y `PRESENTA` en 13 idiomas). Cada `juego.json` la incluye como `../comun/intro-jxs.js` antes de `js/intro.js`.
- `comun/fuente-px.js`: la letra de píxeles (5×7 y 3×5, acentos, letra del sistema para lo que no tiene); la usan
  FAMATINA y SIETE COLORES.
- `siete-colores/`: aventura 3D en pixel art (cubos de 1 m, WebGL2 propio, sin librerías) en la Quebrada de Humahuaca:
  Killa recupera 7 colores del cerro (7 desafíos, 10 plumas, final de carnaval). `js/`: base, idiomas 1-3, gl, mundo
  (armado con semilla, 192×64×192), malla (trozos 32×64×32 con oclusión), render (sombra fija del terreno + chica de
  muñecos, escena a la resolución del juego con color+normal+profundidad, contorno de tinta, tramado, ACES), personajes
  (cajas con poses), jugador (escalón, borde, trepar con plumas, planear, aletear), vida, historia, sonido, intro, ui,
  bot (A* sobre cubos + guion entero), juego. `node siete-colores/armar.mjs` → `siete-colores.html` (~340 KB).
  Prueba: `?prueba`, `window.__juego` (`nueva()`, `bot=true`, `paso(n,dib)`, `ir()`, `traza()`); `?portada`.
- `potrero/`: fútbol 5 de barrio en 3D estilo historieta (WebGL2 propio: luz en bandas, trama de puntos, tinta por
  profundidad/normal/identidad, papel). Historia de 6 partidos contada en páginas de historieta con viñetas 3D y globos
  (Brizuela quiere un estacionamiento en el potrero), picado, penales (racha con 3 vidas) y desafío del día con semilla.
  `js/`: base, idiomas 1-4, letras (letra de historieta a mano con acentos; árabe/urdu/tailandés/birmano/japonés con la
  del sistema), gl, ui, sonido (cumbia, hinchada, relator con formantes), render, modelos (pibes con 13 huesos y 10 gestos
  de cara, pelota, poses), canchas (6, con charcos/tren/noche/viento/estadio), equipos, futbol (física de pelota,
  pase/tiro cargado/gambeta/barrida/cabezazo, arquero, aguante y especiales, repetición), ia, partido (fases, cámara,
  HUD, penales), comic, historia, intro, juego. `node potrero/armar.mjs` → `potrero.html` (~420 KB).
  Prueba: `?prueba` (`&sinpres`, `&sinrep`), `window.__juego` (`bot=true`, `capitulo(i)`, `picado({...})`, `penales()`,
  `desafio()`, `comicDe(n)`, `paso(n,dib)`, `estado()`); `?portada`.
- `famatina/`: tycoon minero 2D en píxeles. Fuente en `js/` (base, idiomas, fuente, arte, eco, sonido, mundo, intro, ui, juego);
  `node famatina/armar.mjs` → `famatina.html` (un archivo, ~275 KB). Balance en `ECO` (`js/eco.js`). Prueba: `?prueba` y
  `window.__juego` (bot, `simular(seg)`, `medirAudio(seg)`, `abrir(panel)`); `?portada` arma la portada 9:16.
- `camalote/`: aventura vista desde arriba (tipo Zelda) en vectorial, 3 capítulos con jefes, puzzles, diálogos y 9 figuritas.
  Fuente en `js/` (base, idiomas 1-3, texto, arte, mapas, mundo, sonido, intro, ui, juego); `node camalote/armar.mjs` →
  `camalote.html` (~390 KB). Suelo en trozos de 8×8 cacheados, K cuantizado a TS, calidad alta/media/baja (celu: media). Mapas, guiones, láminas y rutas del bot en `js/mapas.js`. Prueba: `?prueba` y
  `window.__juego` (`bot` inmortal que sigue `RUTAS`, `capitulo(n)`, `simular(seg)`, `medirAudio`); `?portada`.
