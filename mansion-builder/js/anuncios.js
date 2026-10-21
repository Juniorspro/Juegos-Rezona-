// MANSION BUILDER — los anuncios con premio. En TikTok Minis usa TTMinis.game.createRewardedVideoAd (una instancia
// por anuncio: TikTok no deja mostrar dos veces la misma); también CrazyGames y Poki si su SDK está cargado.
// Sin ninguno (el HTML suelto) muestra un anuncio de prueba de 3 segundos para que todo se pueda probar.
const ANUNCIO_ID = { tiktok: 'PONER_ID_DEL_ANUNCIO_CON_PREMIO' };   // del Developer Portal de TikTok (In-App Ads)
const Anuncios = {
  ocupado: false, prueba: null,
  plataforma() {
    if (typeof TTMinis !== 'undefined' && TTMinis.game && TTMinis.game.createRewardedVideoAd) return 'tiktok';
    if (typeof window !== 'undefined' && window.CrazyGames && window.CrazyGames.SDK && window.CrazyGames.SDK.ad) return 'crazy';
    if (typeof window !== 'undefined' && window.PokiSDK && window.PokiSDK.rewardedBreak) return 'poki';
    return 'prueba';
  },
  // pide un anuncio con premio; listo(true) solo si lo vio entero
  premio(listo) {
    if (this.ocupado) return;
    this.ocupado = true; UI.joy.activo = false; UI.joy.vx = UI.joy.vy = 0;
    if (Sonido.bMus) Sonido.bMus.gain.setTargetAtTime(0, Sonido.ctx.currentTime, 0.1);
    if (Sonido.bSfx) Sonido.bSfx.gain.setTargetAtTime(0, Sonido.ctx.currentTime, 0.05);
    const fin = ok => {
      if (!this.ocupado) return;
      this.ocupado = false;
      Sonido.ponerMusica(AJ.musica); Sonido.ponerSfx(AJ.sonido);
      if (ok) { G.stats.anuncios++; mision('anuncio', 1); Sonido.efecto('desbloquear', 0.6); }
      else UI.aviso(T('sinAnuncio'), 'gris');
      listo(!!ok); guardar();
    };
    const p = this.plataforma();
    try {
      if (p === 'tiktok') {
        const ad = TTMinis.game.createRewardedVideoAd({ adUnitId: ANUNCIO_ID.tiktok });
        const cerrar = r => { ad.offClose(cerrar); ad.offError(error); fin(!!(r && r.isEnded)); };
        const error = () => { ad.offClose(cerrar); ad.offError(error); fin(false); };
        ad.onClose(cerrar); ad.onError(error);
        ad.show().catch(error);
      } else if (p === 'crazy') {
        window.CrazyGames.SDK.ad.requestAd('rewarded', { adFinished: () => fin(true), adError: () => fin(false) });
      } else if (p === 'poki') {
        window.PokiSDK.rewardedBreak().then(v => fin(v)).catch(() => fin(false));
      } else this.prueba = { t: 0, dura: PRUEBA ? 0.2 : 3, fin };
    } catch (e) { fin(false); }
  },
  // el anuncio de prueba (solo en el HTML suelto): pantalla oscura con cuenta regresiva
  pasar(dt) {
    const a = this.prueba; if (!a) return;
    a.t += dt;
    if (a.t >= a.dura) { this.prueba = null; a.fin(true); }
  },
  dibujar(g) {
    const a = this.prueba; if (!a) return;
    const U = UI.U, Wc = CSSW, Hc = CSSH;
    g.fillStyle = '#0b0f1a'; g.fillRect(0, 0, Wc, Hc);
    const k = a.t / a.dura;
    texto(g, T('anuncio'), Wc / 2, Hc * 0.42, 22 * U, '#ffffff', null);
    texto(g, T('anuncioPrueba'), Wc / 2, Hc * 0.42 + 30 * U, 11 * U, 'rgba(255,255,255,0.6)', null);
    g.fillStyle = '#26324a'; rr(g, Wc / 2 - 110 * U, Hc * 0.52, 220 * U, 10 * U, 5 * U); g.fill();
    g.fillStyle = '#ffd34a'; rr(g, Wc / 2 - 110 * U, Hc * 0.52, 220 * U * k, 10 * U, 5 * U); g.fill();
    texto(g, String(Math.ceil(a.dura - a.t)), Wc / 2, Hc * 0.52 + 34 * U, 16 * U, '#ffffff', null);
  },
};
// un premio que se puede pedir por anuncio, con tope por día (clave → cuántos por día)
const TOPES_AD = { gemas: 5, ruleta: 3, cebo: 3, torre: 5, excava: 3, completar: 6, boost: 8 };
function adHoy(clave) { if (G.adDia !== hoy()) { G.adDia = hoy(); G.adUsos = {}; } return G.adUsos[clave] || 0; }
function adQueda(clave) { return (TOPES_AD[clave] || 99) - adHoy(clave); }
function conAnuncio(clave, alPremio) {
  if (adQueda(clave) <= 0) { UI.aviso(T('volveManana'), 'gris'); return; }
  Anuncios.premio(ok => { if (!ok) return; adHoy(clave); G.adUsos[clave] = (G.adUsos[clave] || 0) + 1; alPremio(); });
}
