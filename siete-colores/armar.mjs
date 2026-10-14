// node siete-colores/armar.mjs → siete-colores/siete-colores.html (un solo archivo, sin nada de afuera)
import fs from 'fs'; import path from 'path'; import vm from 'vm'; import { fileURLToPath } from 'url';
const dir = path.dirname(fileURLToPath(import.meta.url));
const cfg = JSON.parse(fs.readFileSync(path.join(dir, 'juego.json'), 'utf8'));
let js = '', inicios = [];
for (const f of cfg.js) { inicios.push([f, js.split('\n').length + 1]); js += fs.readFileSync(path.join(dir, f), 'utf8') + '\n'; }
const cuerpo = "(function(){'use strict';\n" + js + '})();';
try { new vm.Script(cuerpo, { filename: 'juego.js' }); } catch (e) {
  const m = /juego\.js:(\d+)/.exec(e.stack || ''); let donde = '';
  if (m) { const l = +m[1] - 1; let f = inicios[0]; for (const x of inicios) if (x[1] <= l) f = x; donde = `${f[0]}:${l - f[1] + 1}`; }
  console.error('ERROR de sintaxis en', donde, '\n', e.message); process.exit(1);
}
const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
const css = (cfg.css || []).map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
const salida = html.replace('<!--CSS-->', () => css).replace('<!--JS-->', () => '<script>' + cuerpo.replace(/<\/script/gi, '<\\/script') + '</script>');
fs.writeFileSync(path.join(dir, cfg.salida), salida);
console.log(cfg.salida, (salida.length / 1024).toFixed(1) + ' KB');
