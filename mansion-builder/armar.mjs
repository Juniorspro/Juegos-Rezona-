// node mansion-builder/armar.mjs → mansion-builder/mansion-builder.html (un solo archivo: la letra y los audios adentro)
import fs from 'fs'; import path from 'path'; import vm from 'vm'; import { fileURLToPath } from 'url';
const dir = path.dirname(fileURLToPath(import.meta.url));
const cfg = JSON.parse(fs.readFileSync(path.join(dir, 'juego.json'), 'utf8'));
const b64 = f => fs.readFileSync(path.join(dir, f)).toString('base64');
// los mp3 de Higgsfield (audio/) van en base64; sonido.js los decodifica con el primer toque
const audios = fs.readdirSync(path.join(dir, 'audio')).filter(f => f.endsWith('.mp3')).sort();
let js = 'const AUDIO_DATOS = {' + audios.map(f => JSON.stringify(f.replace('.mp3', '')) + ':"' + b64('audio/' + f) + '"').join(',') + '};\n', inicios = [];
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
