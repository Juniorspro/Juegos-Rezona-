// CAMALOTE — letras: Fredoka (subconjunto latino adentro del HTML) y la del sistema para las otras escrituras
function familia() {
  switch (IDIOMA) {
    case 'ar': case 'ur': return '"Noto Naskh Arabic","Geeza Pro","Segoe UI",Arial,sans-serif';
    case 'th': return '"Noto Sans Thai",Thonburi,"Leelawadee UI",Tahoma,sans-serif';
    case 'my': return '"Noto Sans Myanmar","Myanmar Text",Padauk,sans-serif';
    case 'ja': return '"Hiragino Sans","Hiragino Kaku Gothic ProN","Noto Sans JP","Yu Gothic",sans-serif';
    default: return 'Fredoka,"Trebuchet MS","Segoe UI",sans-serif';
  }
}
function escalaFuente() { return { ar: 1.1, ur: 1.1, th: 1.04, my: 0.94, ja: 0.92 }[IDIOMA] || 1; }
const FUERA = [];
function fuente(g, tam, peso) { g.font = (peso || 700) + ' ' + (tam * escalaFuente()).toFixed(1) + 'px ' + familia(); }
// o: tam, peso, c (color o lista de colores en degradé), b (borde), bw, al (0 izq, .5 centro, 1 der), max (ancho), s (sombra), sy
function txt(g, s, x, y, o) {
  o = o || {};
  s = String(s);
  const t0 = o.tam || 14;
  let tam = t0;
  fuente(g, tam, o.peso);
  let w = g.measureText(s).width;
  if (o.max && w > o.max) {
    tam *= o.max / w;
    if (tam < t0 * 0.72 && PRUEBA && !FUERA.includes(s)) FUERA.push(s);
    fuente(g, tam, o.peso); w = g.measureText(s).width;
  }
  const rtl = esRTL(), x0 = x - w * (o.al == null ? 0 : o.al), xd = rtl ? x0 + w : x0;
  g.direction = rtl ? 'rtl' : 'ltr'; g.textAlign = rtl ? 'right' : 'left'; g.textBaseline = 'middle';
  if (o.s) { g.fillStyle = o.s; g.fillText(s, xd, y + (o.sy != null ? o.sy : tam * 0.1)); }
  if (o.b) { g.lineJoin = 'round'; g.lineWidth = o.bw || Math.max(2, tam * 0.2); g.strokeStyle = o.b; g.strokeText(s, xd, y); }
  if (Array.isArray(o.c)) { const gr = g.createLinearGradient(0, y - tam * 0.55, 0, y + tam * 0.55); o.c.forEach((c, i) => gr.addColorStop(i / (o.c.length - 1), c)); g.fillStyle = gr; }
  else g.fillStyle = o.c || '#ffffff';
  g.fillText(s, xd, y);
  g.direction = 'ltr'; g.textAlign = 'left';
  return w;
}
function anchoTxt(g, s, o) { o = o || {}; fuente(g, o.tam || 14, o.peso); return g.measureText(String(s)).width; }
function partir(g, s, ancho, o) {
  s = String(s);
  const pal = /^(th|my|ja)/.test(IDIOMA) && typeof Intl !== 'undefined' && Intl.Segmenter
    ? Array.from(new Intl.Segmenter(IDIOMA, { granularity: 'word' }).segment(s), x => x.segment) : s.split(/(\s+)/);
  const ls = [];
  let act = '';
  for (const p of pal) {
    const prueba = act + p;
    if (act.trim() && anchoTxt(g, prueba.trim(), o) > ancho) { ls.push(act.trim()); act = p.replace(/^\s+/, ''); }
    else act = prueba;
  }
  if (act.trim()) ls.push(act.trim());
  return ls;
}
function parrafo(g, s, x, y, ancho, o) {
  o = o || {};
  const ls = partir(g, s, ancho, o), lh = (o.tam || 14) * 1.3;
  ls.forEach((l, i) => txt(g, l, x, y + i * lh + lh / 2, Object.assign({}, o, { max: ancho })));
  return ls.length * lh;
}
