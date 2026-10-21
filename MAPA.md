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
  `ELEGI_IDIOMA` y `PRESENTA` en 13 idiomas + `vi`). Cada `juego.json` la incluye como `../comun/intro-jxs.js` antes de `js/intro.js`.
- Portadas `<juego>/portada-<juego>.jpg` (1080×1920): arte Higgsfield `nano_banana_2` 2k + título con la letra de cada
  juego, subtítulo y moneda JXS (el monograma de la intro) compuestos en un lienzo de Chromium (compositor fuera del
  repo). `?portada` arma la vieja, del motor.
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
- `hojalata/`: carreras de autitos de lata a cuerda por la casa, en 3D (WebGL2 propio: lata con brillo GGX y reflejo
  de la pieza con la ventana, sombras fija + chica, brillo en cadena, foco corto de miniatura, ACES). Historia de 6
  carreras (Chispa contra Turbo Max por la vidriera del Día del Niño) con escenas actuadas por los autitos, carrera
  rápida, contrarreloj con fantasma y desafío del día. Física en coordenadas de pista (s, d, rumbo): derrape con
  miniturbo, la cuerda que se carga derrapando y se suelta como turbo, largada dándole cuerda, saltos/huecos, caídas con
  grúa, ítems (canica, botón, resorte, llave dorada, pompa). `js/`: base, idiomas 1-4, letras, gl, geo (armador de
  mallas, torno, tubos, trozos con caja), ui (chapa esmaltada, persiana), sonido (vals de cajita, polka de organito,
  motor de cuerda), render, juguetes (6 autitos con conductor y caras), pistas (curva y malla de chapa), casa (atlas,
  utilería y las 6 pistas con su luz), carrera, hud, historia, intro, juego. `node hojalata/armar.mjs` →
  `hojalata.html` (~400 KB). Prueba: `?prueba` (`&todo` abre todo), `window.__juego` (`bot=true`, `capitulo(i)`,
  `rapida({pista,pj})`, `contra()`, `desafio()`, `escenaDe(i)`, `vista(pista,cam)`, `paso(n,dib)`, `medir(n)`,
  `estado()`); `?portada`.
- `mansion-builder/`: MANSION BUILDER, idle-arcade de levantar una mansión de bloques (estilo Minecraft) en una isla, vista
  3/4 de costado-arriba (WebGL2 propio: trozos 16×16 en una pasada con AO, sombra fija del sol, nubes, agua viva, vidrio,
  calcas del piso, cubos e instancias, silueta del jugador tapado). 5 máquinas → obra; 13 partes que se arman solas;
  visitantes (y VIP) pagan en la caja; cuadros para desbloquear/mejorar; 3 ayudantes con A*. **Nueva mansión ★**
  (`renovarMansion`, `ESTILOS`): se rehace con otro estilo, +50% de paga por estrella. Gemas; tienda (`js/tienda.js`: 10
  trajes, 4 mascotas de cubitos con efecto, 8 decoraciones que se arman en la isla, boosts); actividades
  (`js/actividades.js`: 3 misiones diarias, 16 logros, calendario de 7 días, ruleta, cofres en el mundo); minijuegos
  (`js/minijuegos.js`: pesca en el muelle, torre de bloques, excavación; cebos/partidas por día). Anuncios con premio
  (`js/anuncios.js`: TikTok `TTMinis.game.createRewardedVideoAd`, CrazyGames, Poki o uno de prueba de 3 s; topes por día
  en `TOPES_AD`; `ANUNCIO_ID.tiktok` lo pone el dueño). **4 idiomas (en/es/pt/vi) por el país de la IP, sin pantalla de
  idioma** (pedido del dueño; se cambia en ajustes). Gráficos 0-3 según GPU y FPS. Música y efectos de Higgsfield en
  `audio/`, Bungee en `fuente/` (woff2 para el HTML, ttf para TikTok). `node mansion-builder/armar.mjs` →
  `mansion-builder.html` (~1,25 MB); con `--tiktok` además `tiktok/` (runtime nativo: `plataformas/tiktok.js` hace de
  navegador: lienzo WebGL2 + interfaz 2D compuesta como textura, toques, guardado, InnerAudio/WebAudio, Path2D; ~1,1 MB;
  probado solo con un `tt` simulado). Prueba: `?prueba` (`&intro`, `&carga`), `window.__juego` (`bot=true`, `congelar()`,
  `paso(n,dib)`, `completar(k)`, `renovar()`, `dar(n)`, `gemas(n)`, `mj(t)`, `tocar(x,y)`, `dibujarMJ()`, `calidad(n)`,
  `idioma(l)`, `panel(p)`, `ir(x,z)`, `camara(o)`, `borrar()`, `medir(n)`, `stats()`, `ev(s)` solo con `?prueba`).
  El bot termina la mansión en ~10 min de juego.
- **TikTok Minis:** desde el 28/8/2026 no acepta juegos HTML (solo runtime nativo: `game.js`, `game.json`,
  `project.config.json`; 4 MB el paquete principal). Para un juego nuestro, copiar el adaptador de `mansion-builder`.
  Ficha: ícono 1024×1024 (sin bordes redondeados) y hasta 3 miniaturas de DM 360×360.
- `mansion-builder/arte-tiktok/`: arte Higgsfield para publicar (`gpt_image_2_5` con la portada de referencia):
  `icono-1024.png` (+ `icono-600.png`, `icono-alt-1024.png`), `logo.png` y `logo-alt.png` transparentes, 3
  `miniatura-*.png` de DM, `banner-1920x1080.jpg` e `iconos/` (24 íconos de interfaz 256×256, todavía no usados en el juego).
- `famatina/`: tycoon minero 2D en píxeles. Fuente en `js/` (base, idiomas, fuente, arte, eco, sonido, mundo, intro, ui, juego);
  `node famatina/armar.mjs` → `famatina.html` (un archivo, ~275 KB). Balance en `ECO` (`js/eco.js`). Prueba: `?prueba` y
  `window.__juego` (bot, `simular(seg)`, `medirAudio(seg)`, `abrir(panel)`); `?portada` arma la portada 9:16.
- `camalote/`: aventura vista desde arriba (tipo Zelda) en vectorial, 3 capítulos con jefes, puzzles, diálogos y 9 figuritas.
  Fuente en `js/` (base, idiomas 1-3, texto, arte, mapas, mundo, sonido, intro, ui, juego); `node camalote/armar.mjs` →
  `camalote.html` (~390 KB). Suelo en trozos de 8×8 cacheados, K cuantizado a TS, calidad alta/media/baja (celu: media). Mapas, guiones, láminas y rutas del bot en `js/mapas.js`. Prueba: `?prueba` y
  `window.__juego` (`bot` inmortal que sigue `RUTAS`, `capitulo(n)`, `simular(seg)`, `medirAudio`); `?portada`.
