// MANSION BUILDER — los 4 idiomas (inglés, español, portugués, vietnamita), elegidos solos según el país de la IP
const TXT = {
  en: {
    sub: 'Build your dream mansion!', toca: 'TAP TO PLAY', cargando: 'Loading',
    tips: ['Carry blocks from the machines to the construction site.', 'Step on a green pad to spend money and unlock things.', 'Helpers carry blocks for you, even while you rest.', 'Visitors pay to see your mansion: collect the cash!', 'A bigger backpack means fewer trips.'],
    mat: { madera: 'Wood', piedra: 'Stone', vidrio: 'Glass', marmol: 'Marble', oro: 'Gold' },
    gen: { madera: 'Sawmill', piedra: 'Quarry', vidrio: 'Glassworks', marmol: 'Marble works', oro: 'Gold mine' },
    parte: { piso: 'Floor', cimientos: 'Foundation', paredes: 'Walls', puerta: 'Front door', ventanas: 'Windows', entrepiso: 'Second floor', alta: 'Upper floor', ventanales: 'Big windows', techo: 'Roof', balcon: 'Balcony', jardin: 'Garden', pileta: 'Pool', oro: 'Gold details' },
    obj: { junta: 'Collect {m}', entrega: 'Bring the blocks to the construction', plata: 'Collect your cash', desbloquear: 'Unlock the {g}', espera: 'Wait for visitors to pay', mejora: 'Buy an upgrade' },
    desbloquear: 'UNLOCK', mejorar: 'UPGRADE', nivel: 'LV', max: 'MAX', mochila: 'Backpack', vel: 'Shoes', ayudante: 'Helper', contratar: 'HIRE',
    lleno: 'FULL!', noHace: 'NOT NEEDED NOW', lista: '{p} DONE!', mansion: 'MANSION COMPLETE!', nuevoAy: 'NEW HELPER!', abierto: '{g} UNLOCKED!', subio: 'LEVEL UP!',
    parteN: 'PART {n}/{t}', obra: 'CONSTRUCTION', caja: 'CASH',
    ajustes: 'SETTINGS', musica: 'Music', sonido: 'Sound', vibra: 'Vibration', graficos: 'Graphics', idioma: 'Language', joy: 'Joystick', tam: 'Size',
    si: 'ON', no: 'OFF', auto: 'Auto', cal: ['Low', 'Medium', 'High', 'Ultra'], flota: 'Floating', fijo: 'Fixed', tams: ['S', 'M', 'L'],
    borrar: 'Reset progress', seguro: 'Delete everything and start over?', siB: 'YES', noB: 'NO', cerrar: 'CLOSE',
    volviste: 'WELCOME BACK!', teDejaron: 'Your visitors left you', cobrar: 'COLLECT',
    diario: 'DAILY REWARD', reclamar: 'CLAIM', manana: 'Come back tomorrow!',
    compartir: 'SHARE', textoComp: 'I am building my dream mansion in MANSION BUILDER!', copiado: 'COPIED!', fin: 'You built the whole mansion! Visitors keep coming.',
    girar: 'Rotate your phone for the best view',
  },
  es: {
    sub: '¡Construí la mansión de tus sueños!', toca: 'TOCÁ PARA JUGAR', cargando: 'Cargando',
    tips: ['Llevá los bloques de las máquinas a la obra.', 'Pisá un cuadro verde para gastar plata y desbloquear cosas.', 'Los ayudantes cargan bloques por vos, aunque descanses.', 'Los visitantes pagan por ver tu mansión: ¡juntá la plata!', 'Con una mochila más grande hacés menos viajes.'],
    mat: { madera: 'Madera', piedra: 'Piedra', vidrio: 'Vidrio', marmol: 'Mármol', oro: 'Oro' },
    gen: { madera: 'Maderera', piedra: 'Cantera', vidrio: 'Vidriería', marmol: 'Marmolería', oro: 'Mina de oro' },
    parte: { piso: 'Piso', cimientos: 'Cimientos', paredes: 'Paredes', puerta: 'Puerta', ventanas: 'Ventanas', entrepiso: 'Entrepiso', alta: 'Planta alta', ventanales: 'Ventanales', techo: 'Techo', balcon: 'Balcón', jardin: 'Jardín', pileta: 'Pileta', oro: 'Detalles de oro' },
    obj: { junta: 'Juntá {m}', entrega: 'Llevá los bloques a la obra', plata: 'Juntá tu plata', desbloquear: 'Desbloqueá la {g}', espera: 'Esperá que paguen los visitantes', mejora: 'Comprá una mejora' },
    desbloquear: 'DESBLOQUEAR', mejorar: 'MEJORAR', nivel: 'NV', max: 'MÁX', mochila: 'Mochila', vel: 'Zapatillas', ayudante: 'Ayudante', contratar: 'CONTRATAR',
    lleno: '¡LLENO!', noHace: 'AHORA NO HACE FALTA', lista: '¡{p} LISTO!', mansion: '¡MANSIÓN TERMINADA!', nuevoAy: '¡NUEVO AYUDANTE!', abierto: '¡{g} ABIERTA!', subio: '¡SUBIÓ DE NIVEL!',
    parteN: 'PARTE {n}/{t}', obra: 'OBRA', caja: 'CAJA',
    ajustes: 'AJUSTES', musica: 'Música', sonido: 'Sonido', vibra: 'Vibración', graficos: 'Gráficos', idioma: 'Idioma', joy: 'Joystick', tam: 'Tamaño',
    si: 'SÍ', no: 'NO', auto: 'Auto', cal: ['Bajo', 'Medio', 'Alto', 'Ultra'], flota: 'Flotante', fijo: 'Fijo', tams: ['C', 'M', 'G'],
    borrar: 'Borrar progreso', seguro: '¿Borrar todo y empezar de nuevo?', siB: 'SÍ', noB: 'NO', cerrar: 'CERRAR',
    volviste: '¡VOLVISTE!', teDejaron: 'Tus visitantes te dejaron', cobrar: 'COBRAR',
    diario: 'PREMIO DIARIO', reclamar: 'RECLAMAR', manana: '¡Volvé mañana!',
    compartir: 'COMPARTIR', textoComp: '¡Estoy construyendo la mansión de mis sueños en MANSION BUILDER!', copiado: '¡COPIADO!', fin: '¡Construiste la mansión entera! Los visitantes siguen viniendo.',
    girar: 'Girá el celular para verlo mejor',
  },
  pt: {
    sub: 'Construa a mansão dos seus sonhos!', toca: 'TOQUE PARA JOGAR', cargando: 'Carregando',
    tips: ['Leve os blocos das máquinas até a obra.', 'Pise num quadrado verde para gastar dinheiro e desbloquear coisas.', 'Os ajudantes carregam blocos por você, mesmo quando você descansa.', 'Os visitantes pagam para ver sua mansão: pegue o dinheiro!', 'Com uma mochila maior você faz menos viagens.'],
    mat: { madera: 'Madeira', piedra: 'Pedra', vidrio: 'Vidro', marmol: 'Mármore', oro: 'Ouro' },
    gen: { madera: 'Serraria', piedra: 'Pedreira', vidrio: 'Vidraria', marmol: 'Marmoraria', oro: 'Mina de ouro' },
    parte: { piso: 'Piso', cimientos: 'Fundação', paredes: 'Paredes', puerta: 'Porta', ventanas: 'Janelas', entrepiso: 'Laje', alta: 'Andar de cima', ventanales: 'Janelões', techo: 'Telhado', balcon: 'Sacada', jardin: 'Jardim', pileta: 'Piscina', oro: 'Detalhes de ouro' },
    obj: { junta: 'Pegue {m}', entrega: 'Leve os blocos até a obra', plata: 'Pegue seu dinheiro', desbloquear: 'Desbloqueie a {g}', espera: 'Espere os visitantes pagarem', mejora: 'Compre uma melhoria' },
    desbloquear: 'DESBLOQUEAR', mejorar: 'MELHORAR', nivel: 'NV', max: 'MÁX', mochila: 'Mochila', vel: 'Tênis', ayudante: 'Ajudante', contratar: 'CONTRATAR',
    lleno: 'CHEIO!', noHace: 'NÃO PRECISA AGORA', lista: '{p} PRONTO!', mansion: 'MANSÃO CONCLUÍDA!', nuevoAy: 'NOVO AJUDANTE!', abierto: '{g} ABERTA!', subio: 'SUBIU DE NÍVEL!',
    parteN: 'PARTE {n}/{t}', obra: 'OBRA', caja: 'CAIXA',
    ajustes: 'AJUSTES', musica: 'Música', sonido: 'Som', vibra: 'Vibração', graficos: 'Gráficos', idioma: 'Idioma', joy: 'Joystick', tam: 'Tamanho',
    si: 'SIM', no: 'NÃO', auto: 'Auto', cal: ['Baixo', 'Médio', 'Alto', 'Ultra'], flota: 'Flutuante', fijo: 'Fixo', tams: ['P', 'M', 'G'],
    borrar: 'Apagar progresso', seguro: 'Apagar tudo e começar de novo?', siB: 'SIM', noB: 'NÃO', cerrar: 'FECHAR',
    volviste: 'BEM-VINDO DE VOLTA!', teDejaron: 'Seus visitantes deixaram', cobrar: 'COLETAR',
    diario: 'PRÊMIO DIÁRIO', reclamar: 'RESGATAR', manana: 'Volte amanhã!',
    compartir: 'COMPARTILHAR', textoComp: 'Estou construindo a mansão dos meus sonhos no MANSION BUILDER!', copiado: 'COPIADO!', fin: 'Você construiu a mansão inteira! Os visitantes continuam vindo.',
    girar: 'Gire o celular para ver melhor',
  },
  vi: {
    sub: 'Xây biệt thự trong mơ của bạn!', toca: 'CHẠM ĐỂ CHƠI', cargando: 'Đang tải',
    tips: ['Mang khối từ máy đến công trường.', 'Bước lên ô xanh để tiêu tiền và mở khóa.', 'Người phụ mang khối giúp bạn, kể cả khi bạn nghỉ.', 'Khách trả tiền để xem biệt thự: hãy nhặt tiền!', 'Ba lô lớn hơn thì đi ít chuyến hơn.'],
    mat: { madera: 'Gỗ', piedra: 'Đá', vidrio: 'Kính', marmol: 'Cẩm thạch', oro: 'Vàng' },
    gen: { madera: 'Xưởng gỗ', piedra: 'Mỏ đá', vidrio: 'Xưởng kính', marmol: 'Xưởng cẩm thạch', oro: 'Mỏ vàng' },
    parte: { piso: 'Sàn nhà', cimientos: 'Móng nhà', paredes: 'Tường', puerta: 'Cửa chính', ventanas: 'Cửa sổ', entrepiso: 'Sàn tầng hai', alta: 'Tầng trên', ventanales: 'Cửa kính lớn', techo: 'Mái nhà', balcon: 'Ban công', jardin: 'Khu vườn', pileta: 'Hồ bơi', oro: 'Chi tiết vàng' },
    obj: { junta: 'Nhặt {m}', entrega: 'Mang khối đến công trường', plata: 'Nhặt tiền của bạn', desbloquear: 'Mở khóa {g}', espera: 'Chờ khách trả tiền', mejora: 'Mua nâng cấp' },
    desbloquear: 'MỞ KHÓA', mejorar: 'NÂNG CẤP', nivel: 'CẤP', max: 'TỐI ĐA', mochila: 'Ba lô', vel: 'Giày', ayudante: 'Người phụ', contratar: 'THUÊ',
    lleno: 'ĐẦY RỒI!', noHace: 'CHƯA CẦN', lista: '{p} XONG!', mansion: 'BIỆT THỰ HOÀN THÀNH!', nuevoAy: 'NGƯỜI PHỤ MỚI!', abierto: 'ĐÃ MỞ {g}!', subio: 'LÊN CẤP!',
    parteN: 'PHẦN {n}/{t}', obra: 'CÔNG TRƯỜNG', caja: 'TIỀN',
    ajustes: 'CÀI ĐẶT', musica: 'Âm nhạc', sonido: 'Âm thanh', vibra: 'Rung', graficos: 'Đồ họa', idioma: 'Ngôn ngữ', joy: 'Cần điều khiển', tam: 'Cỡ',
    si: 'BẬT', no: 'TẮT', auto: 'Tự động', cal: ['Thấp', 'Vừa', 'Cao', 'Cực cao'], flota: 'Nổi', fijo: 'Cố định', tams: ['N', 'V', 'L'],
    borrar: 'Xóa tiến trình', seguro: 'Xóa hết và chơi lại từ đầu?', siB: 'CÓ', noB: 'KHÔNG', cerrar: 'ĐÓNG',
    volviste: 'CHÀO MỪNG TRỞ LẠI!', teDejaron: 'Khách tham quan để lại cho bạn', cobrar: 'NHẬN',
    diario: 'QUÀ HẰNG NGÀY', reclamar: 'NHẬN QUÀ', manana: 'Mai quay lại nhé!',
    compartir: 'CHIA SẺ', textoComp: 'Mình đang xây biệt thự trong mơ trong MANSION BUILDER!', copiado: 'ĐÃ SAO CHÉP!', fin: 'Bạn đã xây xong cả biệt thự! Khách vẫn tiếp tục đến.',
    girar: 'Xoay điện thoại để xem rõ hơn',
  },
};
const IDIOMAS = ['en', 'es', 'pt', 'vi'];
const NOMBRE_IDIOMA = { en: 'English', es: 'Español', pt: 'Português', vi: 'Tiếng Việt' };
let IDIOMA = 'en';
// texto por clave ("obj.junta") con {variables}
function T(clave, vars) {
  let v = TXT[IDIOMA], e = TXT.en;
  for (const k of clave.split('.')) { v = v ? v[k] : undefined; e = e ? e[k] : undefined; }
  let s = v != null ? v : (e != null ? e : clave);
  if (vars && typeof s === 'string') s = s.replace(/\{(\w+)\}/g, (_, k) => vars[k] != null ? vars[k] : '');
  return s;
}
// el país → el idioma (lo que no es de habla hispana, portuguesa o Vietnam va en inglés)
const PAIS_IDIOMA = (() => {
  const m = { VN: 'vi' };
  for (const c of ['BR', 'PT', 'AO', 'MZ', 'CV', 'GW', 'ST', 'TL']) m[c] = 'pt';
  for (const c of ['AR', 'BO', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC', 'SV', 'GQ', 'GT', 'HN', 'MX', 'NI', 'PA', 'PY', 'PE', 'PR', 'ES', 'UY', 'VE']) m[c] = 'es';
  return m;
})();
function idiomaNavegador() {
  for (const l of (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en'])) { const k = String(l).slice(0, 2).toLowerCase(); if (TXT[k]) return k; }
  return 'en';
}
// pregunta el país a tres servicios (gana el primero que contesta; sin red, queda el del navegador)
function idiomaPorIP() {
  const pedir = (url, campo) => new Promise((ok, mal) => {
    const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const t = setTimeout(() => { if (ctl) ctl.abort(); mal(new Error('tiempo')); }, 3500);
    fetch(url, { cache: 'no-store', signal: ctl ? ctl.signal : undefined }).then(r => r.json()).then(j => { clearTimeout(t); const c = String(j[campo] || '').toUpperCase(); if (/^[A-Z]{2}$/.test(c)) ok(c); else mal(new Error('sin país')); }).catch(e => { clearTimeout(t); mal(e); });
  });
  const servicios = [['https://api.country.is/', 'country'], ['https://ipwho.is/', 'country_code'], ['https://get.geojs.io/v1/ip/country.json', 'country']];
  return new Promise(ok => {
    let fallas = 0;
    for (const [u, c] of servicios) pedir(u, c).then(pais => ok(PAIS_IDIOMA[pais] || 'en')).catch(() => { if (++fallas === servicios.length) ok(null); });
  });
}
