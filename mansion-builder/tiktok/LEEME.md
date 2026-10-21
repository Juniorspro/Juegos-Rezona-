# MANSION BUILDER para TikTok Minis (runtime nativo)

Desde el 28/8/2026 TikTok no acepta juegos HTML: este paquete corre en el runtime nativo (game.js, sin DOM).

1. En `project.config.json` poné el **appid** de tu Mini Game.
2. Creá un anuncio con premio (In-App Ads) en el Developer Portal y poné su id en `js/anuncios.js` (`ANUNCIO_ID.tiktok`); después `node mansion-builder/armar.mjs --tiktok`. (O buscá `PONER_ID_DEL_ANUNCIO_CON_PREMIO` en `game.js` y reemplazalo.)
3. Para que el idioma salga por la IP, agregá a los dominios permitidos: `https://api.country.is`, `https://ipwho.is`, `https://get.geojs.io`. Si no, usa el idioma de TikTok.
4. Abrilo con la TikTok DevTool y probalo en un celular de verdad: necesita WebGL2. Se probó solo en un TikTok simulado en Chromium.

Pesa ~1,1 MB (el paquete principal admite 4 MB).
