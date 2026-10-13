# MAPA (leer esto, no la guía entera)

Guía = `GUIA-JUEGOS.md` (~40k tokens). Leer solo el tramo: `Read offset=<línea> limit=<hasta la siguiente>`.

## Reglas fijas (sección 0)
1 HTML offline doble clic · 9:16 primero · bot juega cada modo + hoja de capturas · estilo propio y mejor que el
anterior · controles de dedo editables · 13 idiomas sin cartel + globito · portada 9:16 · sin intro (salvo pedido)
· lo chico rápido · números detrás · canciones ajenas fuera del repo · ports solo gratis · no instalar nada · Rezona > Higgsfield.

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
Vacío salvo guía/mapa. No existen `motor2d/`, `herramientas/`, ni juegos de ejemplo citados en la guía.
