// MANSION BUILDER — las imágenes de Higgsfield: el logo y una hoja con los íconos de la interfaz (8×3 de 128 px).
// En el HTML vienen en base64 (IMAGENES_DATOS lo arma armar.mjs); en TikTok son archivos del paquete (img/*.png).
// Mientras no cargan, cada lugar sigue con su dibujo de siempre.
const ICONOS_HOJA = ['moneda', 'gema', 'estrella', 'cofre', 'regalo', 'martillo', 'bolsa', 'pesca', 'pico', 'bloques', 'anuncio', 'trofeo',
  'calendario', 'ruleta', 'rayo', 'reloj', 'mejora', 'ayudante', 'mascota', 'traje', 'fuente', 'musica', 'ajustes', 'mapa'];
const IMG = { listo: {} };
(function () {
  const nueva = window.__nuevaImagen || (typeof Image !== 'undefined' ? () => new Image() : null);
  for (const n of ['iconos', 'logo']) {
    const src = window.__nuevaImagen ? 'img/' + n + '.png' : (typeof IMAGENES_DATOS !== 'undefined' ? IMAGENES_DATOS[n] : null);
    if (!nueva || !src) continue;
    try { const im = nueva(); im.onload = () => { IMG.listo[n] = true; }; im.src = src; IMG[n] = im; } catch (e) { }
  }
})();
// un ícono de la hoja centrado en (x, y) con lado s; false si todavía no cargó
function dibujarIcono(g, nombre, x, y, s) {
  const i = ICONOS_HOJA.indexOf(nombre);
  if (!IMG.listo.iconos || i < 0) return false;
  g.drawImage(IMG.iconos, (i % 8) * 128, Math.floor(i / 8) * 128, 128, 128, x - s / 2, y - s / 2, s, s);
  return true;
}
