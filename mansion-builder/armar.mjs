// node mansion-builder/armar.mjs → mansion-builder/mansion-builder.html (un solo archivo: la letra y los audios adentro)
import fs from 'fs'; import path from 'path'; import vm from 'vm'; import { fileURLToPath } from 'url';
const dir = path.dirname(fileURLToPath(import.meta.url));
const cfg = JSON.parse(fs.readFileSync(path.join(dir, 'juego.json'), 'utf8'));
const b64 = f => fs.readFileSync(path.join(dir, f)).toString('base64');
// los mp3 de Higgsfield (audio/) van en base64; sonido.js los decodifica con el primer toque
const audios = fs.readdirSync(path.join(dir, 'audio')).filter(f => f.endsWith('.mp3')).sort();
// el logo y la hoja de íconos (img/) van como data: URL; imagenes.js los carga
const imagenes = fs.readdirSync(path.join(dir, 'img')).filter(f => f.endsWith('.png')).sort();
let js = 'const AUDIO_DATOS = {' + audios.map(f => JSON.stringify(f.replace('.mp3', '')) + ':"' + b64('audio/' + f) + '"').join(',') + '};\n'
  + 'const IMAGENES_DATOS = {' + imagenes.map(f => JSON.stringify(f.replace('.png', '')) + ':"data:image/png;base64,' + b64('img/' + f) + '"').join(',') + '};\n', inicios = [];
for (const f of cfg.js) { inicios.push([f, js.split('\n').length + 1]); js += fs.readFileSync(path.join(dir, f), 'utf8') + '\n'; }
const cuerpo = "(function(){'use strict';\n" + js + '})();';
try { new vm.Script(cuerpo, { filename: 'juego.js' }); } catch (e) {
  const m = /juego\.js:(\d+)/.exec(e.stack || ''); let donde = '';
  if (m) { const l = +m[1] - 1; let f = inicios[0]; for (const x of inicios) if (x[1] <= l) f = x; donde = `${f[0]}:${l - f[1] + 1}`; }
  console.error('ERROR de sintaxis en', donde, '\n', e.message); process.exit(1);
}
// la letra Bungee (latina, latina extendida y vietnamita), con sus rangos
const rangos = {
  'bungee-vi.woff2': 'U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB',
  'bungee-ext.woff2': 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C4,U+2113,U+2C60-2C7F,U+A720-A7FF',
  'bungee-lat.woff2': 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
};
const css = Object.entries(rangos).map(([f, r]) => `@font-face{font-family:'Bungee';font-style:normal;font-weight:400;font-display:swap;src:url(data:font/woff2;base64,${b64('fuente/' + f)}) format('woff2');unicode-range:${r}}`).join('\n');
const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
const salida = html.replace('/*CSS*/', () => css).replace('<!--JS-->', () => '<script>' + cuerpo.replace(/<\/script/gi, '<\\/script') + '</script>');
fs.writeFileSync(path.join(dir, cfg.salida), salida);
console.log(cfg.salida, (salida.length / 1024).toFixed(1) + ' KB');
// --tiktok: el paquete para el runtime nativo de TikTok Minis (game.js + game.json + project.config.json + audio + letra)
if (process.argv.includes('--tiktok')) {
  const sal = path.join(dir, 'tiktok'), nombres = audios.map(f => f.replace('.mp3', ''));
  fs.rmSync(sal, { recursive: true, force: true }); for (const d of ['audio', 'fuente', 'img']) fs.mkdirSync(path.join(sal, d), { recursive: true });
  for (const f of imagenes) fs.copyFileSync(path.join(dir, 'img', f), path.join(sal, 'img', f));
  const adapt = fs.readFileSync(path.join(dir, 'plataformas/tiktok.js'), 'utf8').replace('/*AUDIOS*/', JSON.stringify(nombres));
  let jsT = 'const AUDIO_DATOS = {};\nconst IMAGENES_DATOS = {};\n';
  for (const f of cfg.js) jsT += fs.readFileSync(path.join(dir, f), 'utf8') + '\n';
  const cuerpoT = "(function(){'use strict';\n" + adapt + '\n' + jsT + '})();\n';
  try { new vm.Script(cuerpoT, { filename: 'game.js' }); } catch (e) { console.error('ERROR de sintaxis (tiktok)', e.message); process.exit(1); }
  fs.writeFileSync(path.join(sal, 'game.js'), cuerpoT);
  fs.writeFileSync(path.join(sal, 'game.json'), JSON.stringify({ deviceOrientation: 'portrait', showStatusBar: false, networkTimeout: { request: 5000 } }, null, 2) + '\n');
  fs.writeFileSync(path.join(sal, 'project.config.json'), JSON.stringify({ appid: 'PONER_APPID_DE_TIKTOK', projectname: 'mansion-builder', compileType: 'game', setting: { es6: true, minified: true } }, null, 2) + '\n');
  for (const f of audios) fs.copyFileSync(path.join(dir, 'audio', f), path.join(sal, 'audio', f));
  fs.copyFileSync(path.join(dir, 'fuente', 'bungee.ttf'), path.join(sal, 'fuente', 'bungee.ttf'));
  fs.writeFileSync(path.join(sal, 'LEEME.md'), [
    '# MANSION BUILDER para TikTok Minis (runtime nativo)', '',
    'Desde el 28/8/2026 TikTok no acepta juegos HTML: este paquete corre en el runtime nativo (game.js, sin DOM).', '',
    '1. En `project.config.json` poné el **appid** de tu Mini Game.',
    '2. Creá un anuncio con premio (In-App Ads) en el Developer Portal y poné su id en `js/anuncios.js` (`ANUNCIO_ID.tiktok`); después `node mansion-builder/armar.mjs --tiktok`. (O buscá `PONER_ID_DEL_ANUNCIO_CON_PREMIO` en `game.js` y reemplazalo.)',
    '3. Para que el idioma salga por la IP, agregá a los dominios permitidos: `https://api.country.is`, `https://ipwho.is`, `https://get.geojs.io`. Si no, usa el idioma de TikTok.',
    '4. Abrilo con la TikTok DevTool y probalo en un celular de verdad: necesita WebGL2. Se probó solo en un TikTok simulado en Chromium.',
    '5. Para la ficha del Developer Portal: ícono `../arte-tiktok/icono-1024.png` (1024×1024) y las miniaturas de DM `../arte-tiktok/miniatura-*.png` (360×360).',
    '6. Para subirlo: un .zip con todo lo de esta carpeta menos este LEEME (game.js, game.json, project.config.json, audio/, fuente/, img/). Al arrancar llama a `TTMinis.game.login` en silencio, como pide TikTok.', '',
    'Pesa ~1,1 MB (el paquete principal admite 4 MB).', '',
  ].join('\n'));
  let tot = 0; const sumar = d => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const q = path.join(d, e.name); if (e.isDirectory()) sumar(q); else tot += fs.statSync(q).size; } }; sumar(sal);
  console.log('tiktok/ listo:', (tot / 1024).toFixed(0) + ' KB (el paquete principal puede tener hasta 4 MB)');
}
