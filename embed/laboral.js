/* POPULI · Monitor Laboral — piezas propias de este monitor (encima del molde común, window.PM).
   Los datos salen de populi-mercado-laboral/scripts/11_datos_monitor.py (microdato de la ECE del INE). */
(function () {
  'use strict';
  var L = {}, T = PM.t;
  // ── Dos idiomas (molde v2.4: `?lang=en`) ──────────────────────────────────────────────────────────────────────
  // Los JSON traen los nombres en castellano (ramas, categorías, ámbitos) y el código los usa como CLAVES: se
  // traducen sólo al mostrarlos, con L.N(nombre). Un nombre que no está acá sale como viene.
  var EN = {
    'Urbano': 'Urban', 'Rural': 'Rural', 'Área urbana': 'Urban area', 'Área rural': 'Rural area',
    'Eje (LP-CB-SC)': 'Central axis (LP-CB-SC)', 'Resto (CH-OR-PT-TJ-BE-PA)': 'Rest (CH-OR-PT-TJ-BE-PA)',
    // ramas de actividad (CAEB agrupada)
    'Agropecuario': 'Agriculture', 'Minería e hidrocarburos': 'Mining and hydrocarbons', 'Industria manufacturera': 'Manufacturing',
    'Electricidad, gas y agua': 'Electricity, gas and water', 'Construcción': 'Construction', 'Comercio': 'Trade',
    'Transporte y almacenamiento': 'Transport and storage', 'Alojamiento y comidas': 'Accommodation and food',
    'Servicios financieros, profesionales y TIC': 'Finance, professional services and ICT', 'Administración pública': 'Public administration',
    'Educación': 'Education', 'Salud y asistencia social': 'Health and social work', 'Otros servicios': 'Other services',
    'Trabajo en hogares': 'Households as employers',
    // categoría ocupacional, tamaño del establecimiento, sector
    'Obrero/empleado': 'Employee', 'Cuenta propia': 'Own-account worker', 'Familiar sin remuneración': 'Unpaid family worker',
    'Empleador/socio': 'Employer/partner', 'Trabajador/a del hogar': 'Domestic worker', 'Cooperativista': 'Cooperative member',
    'Aprendiz sin remuneración': 'Unpaid apprentice',
    '1 persona': '1 person', '50 o más': '50 or more',
    'Sector formal': 'Formal sector', 'Sector informal': 'Informal sector', 'Sector hogares': 'Household sector'
  };
  L.N = function (s) { return PM.en && EN[s] ? EN[s] : s; };
  // el ámbito dentro de una frase: «En el área rural, …» / «In rural areas, …»; con «de»: «del área rural», «de Santa Cruz»
  L.lugar = function (dom) { return (PM.en ? { 'Urbano': 'urban areas', 'Rural': 'rural areas' } : { 'Urbano': 'el área urbana', 'Rural': 'el área rural' })[dom] || dom; };
  L.de = function (dom) { return PM.en ? 'of ' + L.lugar(dom) : ({ 'Urbano': 'del área urbana', 'Rural': 'del área rural' })[dom] || 'de ' + dom; };
  // «Bs del 1T-2026» (metadata.ingresos_en) → «Q1 2026 Bs»; «2025-T2 a 2026-T1» → «Q2 2025 to Q1 2026»
  L.bsDel = function (s) { return PM.en ? String(s || '').replace(/^Bs del (\d)T-(\d{4})$/, 'Q$1 $2 Bs') : s; };
  // la base de los ingresos reales, leída de los datos (metadata.ingresos_en, que fija 11_datos_monitor.py):
  // corto «Bs del 1T-2026» / «Q1 2026 Bs»; largo «bolivianos del 1.er trimestre de 2026» / «Q1 2026 bolivianos»
  L.base = function (meta) {
    var s = (meta && meta.ingresos_en) || '', m = /(\d)T-(\d{4})/.exec(s);
    if (!m) return { corto: s, largo: s };
    var ord = { 1: '1.er', 2: '2.º', 3: '3.er', 4: '4.º' }[m[1]];
    return { corto: T(s, 'Q' + m[1] + ' ' + m[2] + ' Bs'), largo: T('bolivianos del ' + ord + ' trimestre de ' + m[2], 'Q' + m[1] + ' ' + m[2] + ' bolivianos') };
  };
  L.ventana = function (s) { return PM.en ? String(s || '').replace(/(\d{4})-T(\d)/g, 'Q$2 $1').replace(' a ', ' to ') : s; };
  // la metodología, en el idioma del gráfico (metodologia.html lleva los dos)
  L.metodologia = function (url) {
    url = url || '../metodologia.html';
    return PM.en ? url.replace(/(#|$)/, '?lang=en$1') : url;
  };

  // Ámbitos con serie trimestral publicable (CV < 15 %): Bolivia, urbano, rural y el eje
  L.AMBITOS = [['Bolivia', 'Bolivia'], ['Urbano', L.N('Urbano')], ['Rural', 'Rural'],
    ['Santa Cruz', 'Santa Cruz'], ['La Paz', 'La Paz'], ['Cochabamba', 'Cochabamba']];
  L.RANGOS = [['5a', T('5 años', '5 years')], ['desde2019', T('Desde 2019', 'Since 2019')], ['todo', T('Desde 2015', 'Since 2015')]];

  // índice del último dato no nulo
  L.ultimo = function (arr) { var n = arr.length - 1; while (n >= 0 && arr[n] == null) n--; return n; };
  // mismo trimestre del año anterior, buscado por fecha (no por posición: hay huecos en 2020)
  L.haceUnAnio = function (K, i) {
    var p = PM.periodo(K[i]); if (!p) return -1;
    return K.indexOf((p.a - 1) + '-T' + p.t);
  };
  // Selector nativo (ver laboral.css): opciones [[valor, texto], …] o grupos {rotulo: [[valor, texto], …]}
  L.selector = function (el, opciones, activo, alCambiar, aria) {
    var op = function (o) { return '<option value="' + o[0] + '"' + (o[0] === activo ? ' selected' : '') + '>' + o[1] + '</option>'; };
    var html = Array.isArray(opciones) ? opciones.map(op).join('')
      : Object.keys(opciones).map(function (g) { return '<optgroup label="' + g + '">' + opciones[g].map(op).join('') + '</optgroup>'; }).join('');
    el.classList.add('con-sel');
    el.innerHTML = '<select class="sel-l" aria-label="' + (aria || '') + '">' + html + '</select>';
    el.querySelector('select').addEventListener('change', function (e) { alCambiar(e.target.value); });
  };
  L.AMBITOS_SEL = {};
  L.AMBITOS_SEL['Bolivia'] = [['Bolivia', 'Bolivia'], ['Urbano', L.N('Área urbana')], ['Rural', L.N('Área rural')]];
  L.AMBITOS_SEL[T('Departamento', 'Department')] = [['Santa Cruz', 'Santa Cruz'], ['La Paz', 'La Paz'], ['Cochabamba', 'Cochabamba']];
  L.esPrelim = function (meta, k) { return (meta.preliminares || []).indexOf(k) >= 0; };
  // Sombreado de los trimestres preliminares (cuadros del INE): arranca en el último trimestre del microdato
  L.areaPrelim = function (KV, meta) {
    var pre = (meta.preliminares || []).filter(function (k) { return KV.indexOf(k) >= 0; });
    if (!pre.length) return null;
    var a = Math.max(0, KV.indexOf(pre[0]) - 1);
    return { silent: true, animation: false, label: { show: false },
      itemStyle: { color: PM.dk() ? 'rgba(226,232,240,.06)' : 'rgba(0,18,25,.05)' },
      data: [[{ xAxis: KV[a] }, { xAxis: KV[KV.length - 1] }]] };
  };
  L.fechaP = function (meta, k) { return PM.fecha(k) + (L.esPrelim(meta, k) ? ' (p)' : ''); };
  L.millones = function (v) { return v == null ? '—' : PM.num(v / 1e6, 2) + ' M'; };
  L.miles = function (v) { return v == null ? '—' : PM.num(v / 1e3, 0) + T(' mil', 'k'); };
  L.bs = function (v) { return v == null ? '—' : 'Bs ' + PM.num(v, 0); };
  // cifra con su calidad: referencial entre paréntesis; no publicable, raya
  L.conCalidad = function (txt, c) { return c === 2 ? '—' : c === 1 ? '(' + txt + ')' : txt; };
  L.fuente = function (meta, ultimo) {
    var pre = (meta.preliminares || []).length;
    return T('Fuente: <a href="https://www.ine.gob.bo/index.php/metadatos-y-microdatos/" target="_blank" rel="noopener">INE, Encuesta Continua de Empleo</a> (microdato' +
      (pre ? '; los trimestres (p) son preliminares de los cuadros del INE' : '') +
      ') · Elaboración: Centro de Estudios POPULI · Datos al: ' + ultimo,
      'Source: <a href="https://www.ine.gob.bo/index.php/metadatos-y-microdatos/" target="_blank" rel="noopener">INE, Continuous Employment Survey</a> (microdata' +
      (pre ? '; quarters marked (p) are preliminary figures from INE tables' : '') +
      ') · Analysis: Centro de Estudios POPULI · Data as of: ' + ultimo);
  };
  // ── Estimación POPULI de los trimestres sin encuesta rural (2T-4T 2020) ─────────────────────────────────────
  // La serie oficial queda vacía (como en el INE); la estimación va aparte (D.estimados[dominio][clave][periodo] =
  // [estimado, li95, ls95]) y se dibuja como TRAMO PUNTEADO que une los trimestres observados de cada lado, con el
  // intervalo de 95 % como banda tenue. Método: metodologia.html#hueco-2020.
  L.METODO = T('un promedio de tres modelos estructurales de series de tiempo, validado escondiendo trimestres conocidos (también los de la pandemia en las ciudades)',
    'an average of three structural time-series models, validated by hiding quarters with known data (including the pandemic quarters in the cities)');
  L.est = function (D, dom, clave, k) {
    var e = D.estimados && D.estimados[dom] && D.estimados[dom][clave];
    return e && e[k] ? { v: e[k][0], li: e[k][1], ls: e[k][2] } : null;
  };
  L.hayEst = function (D, dom, k) {
    var e = D.estimados && D.estimados[dom];
    return !!e && Object.keys(e).some(function (c) { return e[c][k]; });
  };
  // valor del trimestre: el oficial, o la estimación marcada
  L.valor = function (D, dom, clave, K, i) {
    var v = D.dominios[dom][clave][i];
    if (v != null) return { v: v, est: false };
    var e = L.est(D, dom, clave, K[i]);
    return e ? { v: e.v, est: true, li: e.li, ls: e.ls } : { v: null, est: false };
  };
  // series extra para el tramo estimado de una serie visible: [punteada, banda inferior (invisible), banda (alto)]
  L.tramo = function (D, dom, clave, KV, datos, color, ancho) {
    var idx = KV.map(function (k, j) { return L.est(D, dom, clave, k) ? j : -1; }).filter(function (j) { return j >= 0; });
    if (!idx.length) return [];
    var a = Math.max(0, idx[0] - 1), b = Math.min(KV.length - 1, idx[idx.length - 1] + 1);
    var linea = KV.map(function () { return null; }), bajo = linea.slice(), alto = linea.slice();
    for (var j = a; j <= b; j++) {
      var e = L.est(D, dom, clave, KV[j]);
      if (e) { linea[j] = e.v; bajo[j] = e.li; alto[j] = e.ls - e.li; }
      else if (datos[j] != null) { linea[j] = datos[j]; bajo[j] = datos[j]; alto[j] = 0; }
    }
    var id = '_est_' + clave;
    return [
      PM.linea(color, { ancho: Math.max(1.5, (ancho || 2) - 0.5), punteada: true, extra: { name: id, data: linea, connectNulls: false, smooth: false, z: 3, silent: true, showSymbol: false } }),
      { type: 'line', name: id + '_b', data: bajo, stack: id, symbol: 'none', silent: true, lineStyle: { width: 0 }, areaStyle: { opacity: 0 }, z: 1, tooltip: { show: false } },
      { type: 'line', name: id + '_a', data: alto, stack: id, symbol: 'none', silent: true, lineStyle: { width: 0 }, z: 1, tooltip: { show: false },
        areaStyle: { color: PM.rgba(color, PM.dk() ? 0.16 : 0.12) } }
    ];
  };
  // filas del tooltip para un trimestre estimado
  L.ttEst = function (D, dom, k, filas) {
    var h = '';
    filas.forEach(function (f) {
      var e = L.est(D, dom, f.k, k);
      if (e) h += PM.ttFila(f.color, f.nombre, f.fmt(e.v), 'punteada');
    });
    return h ? h + PM.ttPie(T('Estimación POPULI (sin encuesta rural): promedio de modelos estructurales. Intervalo de 95 % en la banda',
      'POPULI estimate (no rural survey): average of structural models. 95% interval in the band')) : '';
  };
  L.notaEst = function (D) {
    var m = D.metadata && D.metadata.estimados;
    return m ? T(' · <strong>2T-4T 2020</strong>: estimación POPULI (línea punteada; el INE no levantó el área rural), <a href="' + m.metodologia + '" target="_blank" rel="noopener">ver metodología</a>',
      ' · <strong>Q2–Q4 2020</strong>: POPULI estimate (dashed line; INE did not survey rural areas), <a href="' + L.metodologia(m.metodologia) + '" target="_blank" rel="noopener">see methodology</a>') : '';
  };
  window.L = L;
})();
