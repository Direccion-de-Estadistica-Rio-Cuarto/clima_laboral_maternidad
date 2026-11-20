/* ==========================================================================
   encuesta.js — Lógica genérica de la plantilla. No hace falta tocarlo para
   armar una encuesta nueva: todo se declara en el HTML con atributos.

   PREGUNTAS (el script completa lo repetitivo):
     <fieldset class="pregunta" data-requerida> + .opciones   → única / múltiple
     <fieldset class="pregunta" data-tipo="likert" data-escala="conformidad"
               data-nombre="p08_ambiente" data-requerida>      → Likert con caras
     <fieldset class="pregunta" data-tipo="nps"  data-nombre="…">  → NPS ciudadano
     <fieldset class="pregunta" data-tipo="enps" data-nombre="…">  → eNPS clima laboral
     <div class="pregunta matriz-pregunta" data-nombre="…">         → matriz

   PRIMERA PREGUNTA SIEMPRE: género (p00_genero), la agrega el script sola.
   Excepción: data-sin-genero en el form (solo si la encuesta no lo necesita).

   A TODAS las preguntas se les agrega automáticamente:
     · NS/NC (valor "ns_nc") y «Otro» con su campo de texto (<nombre>_otro)
       — en las abiertas (texto, número, fecha) solo NS/NC, porque «Otro» no aplica.
     · el número (en un form.encuesta), el asterisco y la línea de tipo
       ("Selección única · obligatoria").
   A las Likert, NPS y eNPS se les agrega una justificación OBLIGATORIA
   (<nombre>_porque) que aparece solo si la respuesta es desfavorable.

   OTROS ATRIBUTOS
     data-mostrar-si="p07=no"      → condicional (también a=x|y, a!=x, a, a=x && b=y)
     data-min / data-max            → mínimo / máximo de casillas
     data-desfavorables="1|2"       → qué valores piden justificación
     data-justificacion="Texto"     → enunciado propio de la justificación
     data-sin-extras                → no agregar NS/NC ni «Otro» (usar con criterio)
   ========================================================================== */
(function () {
  'use strict';

  var doc = document;
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }
  var cont = 0;
  function nuevoId(p) { return (p || 'e') + '-' + (++cont); }
  function crear(html) { var t = doc.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; }
  function guardarLocal(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function leerLocal(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  /* ---------- Íconos ---------------------------------------------------- */
  var trazo = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  var CARAS = {
    5: '<circle cx="12" cy="12" r="9.5"/><path d="M8 9.8q1-1.3 2 0M14 9.8q1-1.3 2 0"/><path d="M7.5 13.5h9q-1 4-4.5 4t-4.5-4z"/>',
    4: '<circle cx="12" cy="12" r="9.5"/><circle cx="9" cy="10" r=".6" fill="currentColor"/><circle cx="15" cy="10" r=".6" fill="currentColor"/><path d="M8.5 14.5q3.5 3.2 7 0"/>',
    3: '<circle cx="12" cy="12" r="9.5"/><circle cx="9" cy="10" r=".6" fill="currentColor"/><circle cx="15" cy="10" r=".6" fill="currentColor"/><path d="M9 15.5h6"/>',
    2: '<circle cx="12" cy="12" r="9.5"/><circle cx="9" cy="10" r=".6" fill="currentColor"/><circle cx="15" cy="10" r=".6" fill="currentColor"/><path d="M8.5 16.8q3.5-3.2 7 0"/>',
    1: '<circle cx="12" cy="12" r="9.5"/><path d="M8 8.6l2 2m0-2l-2 2M14 8.6l2 2m0-2l-2 2"/><path d="M8 17q4-4 8 0"/>'
  };
  function cara(v) { return '<svg class="likert__cara" viewBox="0 0 24 24" ' + trazo + ' aria-hidden="true">' + CARAS[v] + '</svg>'; }
  var ICONO_ESCALA = '<svg class="icono" viewBox="0 0 24 24" ' + trazo + ' aria-hidden="true"><path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><path d="M15 4v4M9 10v4M17 16v4"/></svg>';
  var ICONO_ERROR = '<svg class="icono" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 17q.43 0 .71-.29T13 16t-.29-.71T12 15t-.71.29T11 16t.29.71T12 17m-1-4h2V7h-2zm1 9q-2.07 0-3.9-.79t-3.17-2.14T2.79 15.9T2 12t.79-3.9t2.14-3.17T8.1 2.79T12 2t3.9.79t3.17 2.14t2.14 3.17T22 12t-.79 3.9t-2.14 3.17t-3.17 2.14T12 22"/></svg>';

  /* ---------- Escalas Likert (valor 5 = más favorable … 1 = menos) ----- */
  var ESCALAS = {
    conformidad: { titulo: 'Escala de conformidad',
      opciones: ['Muy conforme', 'Conforme', 'Ni conforme ni disconforme', 'Poco conforme', 'Nada conforme'],
      porque: '¿Por qué no estás conforme? Contanos qué te llevó a esa respuesta y qué habría que mejorar.' },
    acuerdo: { titulo: 'Escala de acuerdo',
      opciones: ['Muy de acuerdo', 'De acuerdo', 'Ni de acuerdo ni en desacuerdo', 'En desacuerdo', 'Muy en desacuerdo'],
      porque: '¿Por qué no estás de acuerdo? Contanos qué te llevó a esa respuesta.' },
    acuerdo_total: { titulo: 'Escala de acuerdo',
      opciones: ['Totalmente de acuerdo', 'De acuerdo', 'Ni de acuerdo ni en desacuerdo', 'En desacuerdo', 'Totalmente en desacuerdo'],
      porque: '¿Por qué no estás de acuerdo? Contanos qué te llevó a esa respuesta.' },
    satisfaccion: { titulo: 'Escala de satisfacción',
      opciones: ['Muy satisfecho/a', 'Satisfecho/a', 'Ni satisfecho/a ni insatisfecho/a', 'Insatisfecho/a', 'Muy insatisfecho/a'],
      porque: '¿Por qué no estás satisfecho/a? Contanos qué habría que mejorar.' },
    calidad: { titulo: 'Escala de calidad',
      opciones: ['Muy buena', 'Buena', 'Regular', 'Mala', 'Muy mala'],
      porque: '¿Por qué te pareció así? Contanos qué habría que mejorar.' },
    frecuencia: { titulo: 'Escala de frecuencia',
      opciones: ['Siempre', 'Casi siempre', 'A veces', 'Casi nunca', 'Nunca'],
      porque: '¿Por qué? Contanos qué pasa en esos casos.' }
  };

  var NPS = {
    nps:  { meta: 'Escala de recomendación (NPS)', porque: '¿Por qué elegiste ese puntaje? Contanos qué tendríamos que mejorar.' },
    enps: { meta: 'Escala de recomendación (eNPS)', porque: '¿Qué haría falta para que recomiendes trabajar en tu área?' }
  };

  /* ---------- Pregunta de género: OBLIGATORIA y PRIMERA en toda encuesta ---
     La agrega el script al comienzo de la primera sección de cada form.encuesta
     (si ya hay una con data-genero, la mueve al primer lugar). Mismas opciones
     y códigos en todas las encuestas, para poder cruzarlas. Las opciones de
     «Otra identidad» siguen las categorías del Censo 2022 (INDEC) y son
     optativas. «Prefiero no responder» cumple el papel de NS/NC y «Otra
     identidad» el de «Otro»: por eso esta pregunta no lleva los extras. */
  var GENERO = {
    nombre: 'p00_genero',
    opciones: [['mujer', 'Mujer'], ['varon', 'Varón'], ['otra_identidad', 'Otra identidad'], ['ns_nc', 'Prefiero no responder']],
    detalle: [['mujer_trans_travesti', 'Mujer trans / travesti'], ['varon_trans', 'Varón trans / masculinidad trans'],
              ['no_binario', 'No binario'], ['otra_ninguna', 'Otra identidad / ninguna de las anteriores']]
  };
  function generoHTML() {
    var n = GENERO.nombre;
    return '<fieldset class="pregunta pregunta--genero" data-genero data-requerida data-sin-extras>' +
      '<legend>¿Con qué género te identificás?</legend>' +
      '<div class="opciones opciones--2col">' + GENERO.opciones.map(function (o) {
        return '<label class="opcion' + (o[0] === 'ns_nc' ? ' opcion--nsnc' : '') + '"><input type="radio" name="' + n + '" value="' + o[0] + '"> ' + o[1] + '</label>';
      }).join('') + '</div>' +
      '<div class="genero-detalle" data-mostrar-si="' + n + '=otra_identidad" hidden>' +
        '<p class="genero-detalle__titulo">Si querés, especificá <span class="texto-suave">(opcional · categorías del Censo 2022)</span></p>' +
        '<div class="opciones opciones--2col">' + GENERO.detalle.map(function (o) {
          return '<label class="opcion"><input type="radio" name="' + n + '_detalle" value="' + o[0] + '"> ' + o[1] + '</label>';
        }).join('') + '</div>' +
      '</div>' +
    '</fieldset>';
  }
  function asegurarGenero(form) {
    var primera = form.querySelector('.seccion');
    if (!primera) return;
    var g = form.querySelector('[data-genero]') || crear(generoHTML());
    var enc = primera.querySelector(':scope > .seccion__encabezado');
    if (enc) enc.after(g); else primera.prepend(g);
  }

  /* ---------- Construcción de preguntas -------------------------------- */
  function nombreDe(p) {
    if (p.dataset.nombre) return p.dataset.nombre;
    var c = p.querySelector('input[name], select[name], textarea[name]');
    return (p.dataset.nombre = (c && c.name) || nuevoId('p'));
  }

  function opcionHTML(tipo, nombre, valor, texto, clase) {
    return '<label class="opcion ' + (clase || '') + '"><input type="' + tipo + '" name="' + nombre + '" value="' + valor + '"> ' + texto + '</label>';
  }
  function nsncHTML(tipo, nombre) {
    return opcionHTML(tipo, nombre, 'ns_nc', '<abbr title="No sabe / No contesta">NS/NC</abbr>', 'opcion--nsnc');
  }
  function otroHTML(tipo, nombre) {
    return '<label class="opcion opcion--otro"><input type="' + tipo + '" name="' + nombre + '" value="otro"> Otro' +
      '<input class="campo" type="text" name="' + nombre + '_otro" data-otro-texto aria-label="Especificá a qué te referís con «Otro»" placeholder="¿Cuál?" maxlength="200"></label>';
  }
  function extrasHTML(tipo, nombre) {
    return '<div class="opciones opciones--extras">' + nsncHTML(tipo, nombre) + otroHTML(tipo, nombre) + '</div>';
  }

  function agregarJustificacion(p, nombre, valores, texto) {
    if (p.hasAttribute('data-sin-justificacion')) return;
    var id = nuevoId('porque');
    var j = crear(
      '<div class="pregunta pregunta--justificacion" data-mostrar-si="' + nombre + '=' + valores + '" data-requerida data-sin-extras hidden>' +
        '<label class="pregunta__enunciado" for="' + id + '">' + (p.dataset.justificacion || texto) + '</label>' +
        '<p class="pregunta__ayuda">Aparece porque elegiste una respuesta desfavorable: es obligatoria. No incluyas nombres ni datos personales.</p>' +
        '<textarea class="campo" id="' + id + '" name="' + nombre + '_porque" maxlength="500"></textarea>' +
        '<div class="contador" aria-live="polite"></div>' +
      '</div>');
    p.after(j);
  }

  function construirLikert(p) {
    var esc = ESCALAS[p.dataset.escala] || ESCALAS.conformidad;
    var nombre = nombreDe(p);
    var html = '<div class="likert">' + esc.opciones.map(function (texto, i) {
      var v = 5 - i;
      return '<label class="likert__opcion likert__opcion--' + v + '"><input type="radio" name="' + nombre + '" value="' + v + '">' +
             cara(v) + '<span class="likert__texto">' + texto + '</span></label>';
    }).join('') + '</div>';
    p.insertAdjacentHTML('beforeend', html + (p.hasAttribute('data-sin-extras') ? '' : extrasHTML('radio', nombre)));
    agregarJustificacion(p, nombre, p.dataset.desfavorables || '1|2', esc.porque);
  }

  function construirNPS(p) {
    var conf = NPS[p.dataset.tipo];
    var nombre = nombreDe(p);
    var desde = p.dataset.desde ? +p.dataset.desde : 0;
    var grupo = function (v) { return v <= 6 ? 'detractor' : v <= 8 ? 'neutro' : 'promotor'; };
    var botones = '';
    for (var v = desde; v <= 10; v++) {
      var extremo = v === desde ? ' aria-label="' + v + ', nada probable"' : v === 10 ? ' aria-label="10, totalmente probable"' : '';
      botones += '<label class="nps__punto nps__punto--' + grupo(v) + '"><input type="radio" name="' + nombre + '" value="' + v + '"' + extremo + '><span>' + v + '</span></label>';
    }
    var detr = []; for (var d = desde; d <= 6; d++) detr.push(d);
    var html =
      '<div class="nps" style="--puntos:' + (11 - desde) + '">' + botones + '</div>' +
      '<div class="nps__leyenda">' +
        '<span class="nps__grupo--detractor"><i aria-hidden="true"></i>' + desde + ' = Nada probable (Detractores: ' + desde + ' a 6)</span>' +
        '<span class="nps__grupo--neutro"><i aria-hidden="true"></i>Neutros (7 a 8)</span>' +
        '<span class="nps__grupo--promotor"><i aria-hidden="true"></i>10 = Totalmente probable (Promotores: 9 a 10)</span>' +
      '</div>';
    p.insertAdjacentHTML('beforeend', html + (p.hasAttribute('data-sin-extras') ? '' : extrasHTML('radio', nombre)));
    agregarJustificacion(p, nombre, p.dataset.desfavorables || detr.join('|'), conf.porque);
  }

  function agregarExtras(p) {
    if (p.hasAttribute('data-sin-extras') || p.dataset.tipo) return;
    var nombre = nombreDe(p);

    // Matriz: columna NS/NC y fila «Otro»
    if (p.classList.contains('matriz-pregunta')) {
      var tabla = p.querySelector('table.matriz');
      if (!tabla.querySelector('input[value="ns_nc"]')) {
        tabla.querySelector('thead tr').insertAdjacentHTML('beforeend', '<th scope="col"><abbr title="No sabe / No contesta">NS/NC</abbr></th>');
        $$('tbody tr', tabla).forEach(function (tr) {
          var r = tr.querySelector('input[type="radio"]');
          tr.insertAdjacentHTML('beforeend', '<td><input type="radio" name="' + r.name + '" value="ns_nc" aria-label="' + tr.querySelector('th').textContent.trim() + ': NS/NC"></td>');
        });
      }
      if (!tabla.querySelector('.matriz__otro')) {
        var valores = $$('tbody tr:first-child input[type="radio"]', tabla).map(function (i) { return i.value; });
        var celdas = valores.map(function (v) {
          return '<td><input type="radio" name="' + nombre + '_otro_valor" value="' + v + '" aria-label="Otro aspecto: ' + (v === 'ns_nc' ? 'NS/NC' : v) + '"></td>';
        }).join('');
        tabla.querySelector('tbody').insertAdjacentHTML('beforeend',
          '<tr class="matriz__otro"><th scope="row"><input class="campo" type="text" name="' + nombre + '_otro" data-otro-matriz placeholder="Otro (especificá)" aria-label="Otro aspecto: especificá cuál" maxlength="120"></th>' + celdas + '</tr>');
      }
      return;
    }

    var opciones = p.querySelector('.opciones:not(.opciones--extras)');
    if (opciones) {
      var tipo = opciones.querySelector('input').type;
      if (!opciones.querySelector('input[value="ns_nc"]')) opciones.insertAdjacentHTML('beforeend', nsncHTML(tipo, nombre));
      if (!opciones.querySelector('.opcion--otro, input[value="otro"]')) opciones.insertAdjacentHTML('beforeend', otroHTML(tipo, nombre));
      return;
    }

    var select = p.querySelector('select');
    if (select) {
      if (!select.querySelector('option[value="ns_nc"]')) select.insertAdjacentHTML('beforeend', '<option value="ns_nc">NS/NC (no sabe / no contesta)</option>');
      if (!select.querySelector('option[value="otro"]')) select.insertAdjacentHTML('beforeend', '<option value="otro">Otro</option>');
      if (!p.querySelector('.otro-detalle')) {
        var id = nuevoId('otro');
        select.insertAdjacentHTML('afterend',
          '<div class="otro-detalle" hidden><label class="texto-chico" for="' + id + '">¿Cuál?</label>' +
          '<input class="campo" id="' + id + '" type="text" name="' + select.name + '_otro" data-otro-texto maxlength="200"></div>');
      }
      return;
    }

    // Abiertas (texto, número, fecha, correo): NS/NC deshabilita el campo
    var campo = p.querySelector('input:not([type="radio"]):not([type="checkbox"]), textarea');
    if (campo && !p.querySelector('.nsnc-abierta')) {
      var ancla = p.querySelector('.contador') || campo;
      ancla.insertAdjacentHTML('afterend',
        '<label class="nsnc-abierta"><input type="checkbox" name="' + campo.name + '" value="ns_nc"> ' +
        '<abbr title="No sabe / No contesta">NS/NC</abbr> · Prefiero no responder / no sé</label>');
    }
  }

  function tipoDe(p) {
    var t = p.dataset.tipo;
    if (t === 'likert') return 'Selección única';
    if (NPS[t]) return NPS[t].meta;
    if (p.classList.contains('matriz-pregunta')) return 'Matriz · una respuesta por fila';
    var i = p.querySelector('.opciones:not(.opciones--extras) input');
    if (i && i.type === 'checkbox') return 'Selección múltiple' + (p.dataset.max ? ' (hasta ' + p.dataset.max + ')' : '');
    if (i) return 'Selección única';
    if (p.querySelector('select')) return 'Lista desplegable';
    if (p.querySelector('textarea')) return 'Respuesta abierta';
    var c = p.querySelector('input');
    return ({ number: 'Número', date: 'Fecha', email: 'Correo electrónico' })[c && c.type] || 'Respuesta corta';
  }

  function completarEncabezado(p) {
    var enc = p.querySelector(':scope > legend, :scope > .pregunta__enunciado');
    if (!enc || enc.querySelector('.pregunta__texto')) return;
    var texto = doc.createElement('span');
    texto.className = 'pregunta__texto';
    Array.prototype.slice.call(enc.childNodes).forEach(function (n) {
      if (!(n.classList && n.classList.contains('pregunta__numero'))) texto.appendChild(n);
    });
    enc.appendChild(texto);
    var req = p.hasAttribute('data-requerida');
    if (req && !texto.querySelector('.requerido')) texto.insertAdjacentHTML('beforeend', '<span class="requerido" aria-hidden="true"> *</span>');
    if (!p.querySelector(':scope > .pregunta__meta')) {
      enc.insertAdjacentHTML('afterend', '<p class="pregunta__meta">' + tipoDe(p) + ' · ' + (req ? 'obligatoria' : 'opcional') + '</p>');
    }
  }

  // data-numero-inicial en el form: número de la primera pregunta (por defecto 1).
  // data-numero="23.1a" en una pregunta: número fijo; las siguientes siguen desde su parte entera.
  function numerar(form) {
    var n = form.hasAttribute('data-numero-inicial') ? +form.dataset.numeroInicial - 1 : 0;
    var ultimo = '';
    $$('.pregunta', form).forEach(function (p) {
      if (p.hasAttribute('data-sin-numero')) return;
      var enc = p.querySelector(':scope > legend, :scope > .pregunta__enunciado');
      if (!enc) return;
      var num;
      if (p.dataset.numero) {
        num = p.dataset.numero;
        if (!isNaN(parseInt(num, 10))) n = parseInt(num, 10);
      } else if (p.classList.contains('pregunta--justificacion')) {
        num = ultimo + '.1';
      } else {
        num = String(++n);
      }
      if (!p.classList.contains('pregunta--justificacion')) ultimo = num;
      var badge = enc.querySelector('.pregunta__numero');
      if (!badge) enc.insertAdjacentHTML('afterbegin', '<span class="pregunta__numero">' + num + '</span>');
    });
  }

  function leyendasDeEscala(raiz) {
    $$('.pregunta[data-tipo="likert"]', raiz).forEach(function (p) {
      var clave = p.dataset.escala || 'conformidad', esc = ESCALAS[clave] || ESCALAS.conformidad;
      var cont = p.closest('.seccion, .demo') || p.parentNode;
      if (cont.querySelector('.aviso--escala[data-escala="' + clave + '"]')) return;
      p.insertAdjacentHTML('beforebegin',
        '<div class="aviso aviso--info aviso--escala" data-escala="' + clave + '" role="note">' + ICONO_ESCALA +
        '<p><strong>' + esc.titulo + ':</strong> ' + esc.opciones.join(' · ') + '.</p></div>');
    });
  }

  function ampliar(raiz) {
    $$('form.encuesta:not([data-sin-genero])', raiz).forEach(asegurarGenero);
    $$('[data-insertar-genero]', raiz).forEach(function (el) { el.replaceWith(crear(generoHTML())); });
    $$('.pregunta[data-tipo="likert"]', raiz).forEach(construirLikert);
    $$('.pregunta[data-tipo="nps"], .pregunta[data-tipo="enps"]', raiz).forEach(construirNPS);
    $$('.pregunta', raiz).forEach(agregarExtras);
    leyendasDeEscala(raiz);
    $$('form.encuesta', raiz).forEach(numerar);
    $$('.pregunta', raiz).forEach(function (p) {
      completarEncabezado(p);
      if (p.querySelector('.pregunta__numero')) p.classList.add('pregunta--numerada');
    });
  }

  /* ---------- Valores y lógica condicional ----------------------------- */
  function valores(nombre) {
    return $$('[name="' + nombre + '"]').filter(function (el) {
      if (el.disabled) return false;
      if (el.type === 'radio' || el.type === 'checkbox') return el.checked;
      return el.value.trim() !== '';
    }).map(function (el) { return el.value; });
  }

  // Formato: "nombre=valor" · "nombre=v1|v2" · "nombre!=valor" · "nombre" (respondida) · "a=x && b=y"
  //          · "a=x || b=y" (alcanza con que se cumpla una; && agrupa antes que ||)
  function cumple(regla) {
    return regla.split('||').some(cumpleTodas);
  }
  function cumpleTodas(regla) {
    return regla.split('&&').every(function (parte) {
      var m = parte.trim().match(/^([\w-]+)\s*(!?=)?\s*(.*)$/);
      if (!m) return true;
      var v = valores(m[1]);
      if (!m[2]) return v.length > 0;
      var ops = m[3].split('|').map(function (s) { return s.trim(); });
      var hay = v.some(function (x) { return ops.indexOf(x) !== -1; });
      return m[2] === '=' ? hay : !hay;
    });
  }

  function aplicarCondiciones() {
    // 1) Condicionales: lo oculto no se valida ni se envía.
    //    (Las secciones solo se habilitan/deshabilitan; mostrarlas es tarea de la navegación.)
    $$('[data-mostrar-si]').forEach(function (el) {
      var visible = cumple(el.dataset.mostrarSi);
      if (!el.classList.contains('seccion')) el.hidden = !visible;
      $$('input, select, textarea', el).forEach(function (c) { c.disabled = !visible; });
    });
    // 1b) Máximo de casillas (data-max): al llegar al límite se bloquean las que faltan
    aplicarLimites();
    // 2) «Otro» en opciones: el texto se despliega y habilita solo si está marcado
    $$('.opcion--otro').forEach(function (o) {
      var marca = o.querySelector('input[type="radio"], input[type="checkbox"]');
      var txt = o.querySelector('input[type="text"]');
      if (txt) txt.disabled = marca.disabled || !marca.checked;
    });
    // 3) «Otro» en listas desplegables
    $$('.otro-detalle').forEach(function (d) {
      var sel = d.previousElementSibling;
      var on = sel && !sel.disabled && sel.value === 'otro';
      d.hidden = !on;
      d.querySelector('input').disabled = !on;
    });
    // 4) NS/NC en abiertas: deshabilita el campo
    $$('.nsnc-abierta input').forEach(function (chk) {
      var p = chk.closest('.pregunta');
      $$('input:not([type="checkbox"]), textarea', p).forEach(function (c) {
        if (chk.disabled) return;
        c.disabled = chk.checked;
      });
    });
  }

  // data-max en selección múltiple: no deja marcar más casillas que el máximo.
  // Al llegar al límite, las casillas sin marcar se deshabilitan y aparece un aviso;
  // al desmarcar una, se vuelven a habilitar. NS/NC no cuenta para el límite.
  function aplicarLimites() {
    $$('.pregunta[data-max]').forEach(function (p) {
      var max = +p.dataset.max;
      var casillas = $$('.opciones input[type="checkbox"]', p).filter(function (c) { return c.value !== 'ns_nc'; });
      if (!max || !casillas.length) return;
      // Si la pregunta está oculta por una condicional, sus casillas ya quedaron deshabilitadas
      var cond = p.closest('[data-mostrar-si]');
      if (cond && !cumple(cond.dataset.mostrarSi)) return;
      var marcadas = casillas.filter(function (c) { return c.checked; }).length;
      var lleno = marcadas >= max;
      casillas.forEach(function (c) {
        var bloquear = lleno && !c.checked;
        c.disabled = bloquear;
        c.closest('.opcion').classList.toggle('opcion--bloqueada', bloquear);
      });
      var aviso = p.querySelector(':scope > .pregunta__limite');
      if (!aviso) {
        aviso = doc.createElement('p');
        aviso.className = 'pregunta__limite';
        aviso.setAttribute('aria-live', 'polite');
        var ancla = p.querySelector('.opciones');
        ancla.after(aviso);
      }
      aviso.hidden = !lleno;
      aviso.textContent = lleno ? 'Llegaste al máximo de ' + max + (max === 1 ? ' opción' : ' opciones') + '. Para elegir otra, primero desmarcá una.' : '';
    });
  }

  // NS/NC excluye al resto de las opciones en las de selección múltiple
  function exclusividadNSNC(e) {
    var t = e.target;
    if (t.type !== 'checkbox' || !t.checked) return;
    var grupo = $$('input[type="checkbox"][name="' + t.name + '"]');
    if (grupo.length < 2) return;
    grupo.forEach(function (c) {
      if (c !== t && (t.value === 'ns_nc' || c.value === 'ns_nc')) c.checked = false;
    });
  }

  /* ---------- Validación ---------------------------------------------- */
  function mostrarError(p, mensaje) {
    p.classList.add('pregunta--error');
    var err = p.querySelector(':scope > .pregunta__error');
    if (!err) {
      err = doc.createElement('p');
      err.className = 'pregunta__error';
      err.id = nuevoId('err');
      p.appendChild(err);
    }
    err.innerHTML = ICONO_ERROR + mensaje;
    $$('input, select, textarea', p).forEach(function (c) {
      c.setAttribute('aria-invalid', 'true');
      c.setAttribute('aria-describedby', err.id);
    });
  }

  function limpiarError(p) {
    p.classList.remove('pregunta--error');
    var err = p.querySelector(':scope > .pregunta__error');
    if (err) err.remove();
    $$('[aria-invalid]', p).forEach(function (c) { c.removeAttribute('aria-invalid'); c.removeAttribute('aria-describedby'); });
    $$('tr.pregunta--error', p).forEach(function (tr) { tr.classList.remove('pregunta--error'); });
  }

  var MSJ_OTRO = 'Especificá a qué te referís con «Otro».';

  function validarPregunta(p) {
    if (p.hidden || p.closest('[hidden]:not(.seccion)')) return true;
    limpiarError(p);
    var req = p.hasAttribute('data-requerida');

    if (p.classList.contains('matriz-pregunta')) {
      var faltan = 0;
      $$('tbody tr:not(.matriz__otro)', p).forEach(function (tr) {
        var ok = valores(tr.querySelector('input[type="radio"]').name).length > 0;
        if (!ok && req) { tr.classList.add('pregunta--error'); faltan++; }
      });
      if (faltan) { mostrarError(p, faltan === 1 ? 'Falta responder 1 fila.' : 'Faltan responder ' + faltan + ' filas.'); return false; }
      var fila = p.querySelector('.matriz__otro');
      if (fila) {
        var txt = fila.querySelector('input[type="text"]');
        var puntaje = valores(fila.querySelector('input[type="radio"]').name).length > 0;
        if (txt.value.trim() && !puntaje) { fila.classList.add('pregunta--error'); mostrarError(p, 'Calificá el aspecto que agregaste en «Otro».'); return false; }
        if (!txt.value.trim() && puntaje) { fila.classList.add('pregunta--error'); mostrarError(p, MSJ_OTRO); return false; }
      }
      return true;
    }

    var campos = $$('input, select, textarea', p).filter(function (c) { return !c.disabled && c.name; });
    var todos = $$('input[name], select[name], textarea[name]', p);
    if (!todos.length) return true;
    var nombre = todos[0].name;
    var v = valores(nombre);

    if (req && v.length === 0) { mostrarError(p, 'Esta pregunta es obligatoria.'); return false; }
    var cuenta = v.filter(function (x) { return x !== 'ns_nc'; }).length;
    var min = +p.dataset.min || 0, max = +p.dataset.max || 0;
    if (cuenta && min && cuenta < min) { mostrarError(p, 'Elegí al menos ' + min + ' opciones.'); return false; }
    if (max && cuenta > max) { mostrarError(p, 'Elegí como máximo ' + max + ' opciones.'); return false; }

    var otroVacio = campos.filter(function (c) { return c.hasAttribute('data-otro-texto') && !c.value.trim(); });
    if (otroVacio.length) { mostrarError(p, MSJ_OTRO); return false; }

    for (var i = 0; i < campos.length; i++) {
      if (!campos[i].checkValidity()) { mostrarError(p, campos[i].dataset.mensaje || campos[i].validationMessage); return false; }
    }
    return true;
  }

  /* ---------- Modal (protocolo de anonimato u otros) ------------------- */
  doc.addEventListener('click', function (e) {
    var abrir = e.target.closest('[data-abrir-modal]');
    if (abrir) {
      var d = doc.getElementById(abrir.dataset.abrirModal);
      if (d && d.showModal) { d.showModal(); }
      return;
    }
    if (e.target.closest('[data-cerrar-modal]')) { e.target.closest('dialog').close(); return; }
    // Clic fuera del recuadro (sobre el fondo) cierra
    if (e.target.tagName === 'DIALOG' && e.target.open) {
      var r = e.target.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) e.target.close();
    }
  });

  /* ---------- Contadores ---------------------------------------------- */
  function actualizarContador(campo) {
    var c = campo.parentNode.querySelector('.contador');
    if (c && campo.maxLength > 0) c.textContent = campo.value.length + ' / ' + campo.maxLength;
  }

  /* ==================================================================== */
  ampliar(doc);
  $$('.contador').forEach(function (c) {
    var campo = c.parentNode.querySelector('[maxlength]');
    if (campo) actualizarContador(campo);
  });
  aplicarCondiciones();

  var form = doc.querySelector('form.encuesta');

  // Fuera de un formulario (por ejemplo, la guía de diseño), alcanza con esto
  doc.addEventListener('change', function (e) { exclusividadNSNC(e); aplicarCondiciones(); });
  doc.addEventListener('input', function (e) {
    if (e.target.maxLength > 0) actualizarContador(e.target);
    aplicarCondiciones();
    var p = e.target.closest('.pregunta');
    if (p && p.classList.contains('pregunta--error')) validarPregunta(p);
  });

  window.Encuesta = { ampliar: ampliar, validarPregunta: validarPregunta, aplicarCondiciones: aplicarCondiciones };
  if (!form) return;

  /* ==================== Lógica del formulario ======================== */
  var ID = form.dataset.encuesta || 'encuesta';
  var CLAVE_BORRADOR = 'borrador:' + ID;
  var CLAVE_MODO = 'encuesta-modo';
  var secciones = $$('.seccion', form);
  var final = doc.getElementById('final');
  var progreso = doc.querySelector('.progreso');
  var relleno = doc.querySelector('.progreso__relleno');
  var textoPaso = doc.querySelector('[data-paso]');
  var textoPct = doc.querySelector('[data-porcentaje]');
  var barra = doc.querySelector('.progreso__barra');
  var portada = doc.querySelector('[data-portada]');
  var avisoBorrador = doc.getElementById('aviso-borrador');
  var botonModo = doc.querySelector('[data-accion="modo"]');
  var actual = 0;
  var modo = leerLocal(CLAVE_MODO) === 'completo' ? 'completo' : 'pasos';
  var terminado = false;

  function seccionVisible(s) { return !s.hasAttribute('data-mostrar-si') || cumple(s.dataset.mostrarSi); }
  function visibles() { return secciones.filter(seccionVisible); }

  function siguienteIndice(dir) {
    for (var j = actual + dir; j >= 0 && j < secciones.length; j += dir) if (seccionVisible(secciones[j])) return j;
    return -1;
  }

  function preguntasVisibles() {
    return $$('.pregunta', form).filter(function (p) {
      var s = p.closest('.seccion');
      return !p.hidden && seccionVisible(s);
    });
  }

  function respondida(p) {
    var c = p.querySelector('input[name], select[name], textarea[name]');
    if (p.classList.contains('matriz-pregunta')) {
      return $$('tbody tr:not(.matriz__otro)', p).every(function (tr) { return valores(tr.querySelector('input').name).length; });
    }
    return c ? valores(c.name).length > 0 : false;
  }

  function actualizarProgreso() {
    var pct, etiqueta;
    if (modo === 'completo') {
      var ps = preguntasVisibles(), r = ps.filter(respondida).length;
      pct = ps.length ? Math.round((r / ps.length) * 100) : 0;
      etiqueta = r + ' de ' + ps.length + ' preguntas respondidas';
    } else {
      var vs = visibles(), pos = vs.indexOf(secciones[actual]) + 1;
      pct = Math.round(((pos - 1) / vs.length) * 100);
      etiqueta = 'Sección ' + pos + ' de ' + vs.length;
    }
    if (relleno) relleno.style.width = pct + '%';
    if (barra) barra.setAttribute('aria-valuenow', pct);
    if (textoPaso) textoPaso.textContent = etiqueta;
    if (textoPct) textoPct.textContent = pct + '% completado';
  }

  function mostrar(enfocar) {
    if (terminado) return;
    var completo = modo === 'completo';
    form.classList.toggle('encuesta--completa', completo);
    secciones.forEach(function (s, j) { s.hidden = completo ? !seccionVisible(s) : j !== actual; });
    var esUltima = completo || siguienteIndice(1) === -1;
    $$('[data-accion="anterior"]').forEach(function (b) { b.hidden = completo || siguienteIndice(-1) === -1; });
    $$('[data-accion="siguiente"]').forEach(function (b) { b.hidden = esUltima; });
    $$('[data-accion="enviar"]').forEach(function (b) { b.hidden = !esUltima; });
    // Los paneles de apertura solo se ven al abrir la encuesta
    // (en paso a paso: solo en la primera sección; en formulario completo: arriba de todo)
    if (portada) portada.hidden = !completo && secciones[actual] !== visibles()[0];
    if (botonModo) {
      botonModo.querySelector('[data-texto-modo]').textContent = completo ? 'Modo paso a paso' : 'Ver formulario completo';
      botonModo.querySelector('.icono-pasos').style.display = completo ? '' : 'none';
      botonModo.querySelector('.icono-completo').style.display = completo ? 'none' : '';
      botonModo.setAttribute('aria-pressed', String(completo));
    }
    actualizarProgreso();
    if (enfocar) {
      var h = secciones[actual].querySelector('h2');
      if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
      window.scrollTo({ top: (portada && !portada.hidden ? 0 : form.offsetTop - 90), behavior: 'smooth' });
    }
  }

  function irA(i, enfocar) { actual = i; mostrar(enfocar); }

  function validarSeccion(s) {
    var invalidas = $$('.pregunta', s).filter(function (p) { return !validarPregunta(p); });
    return invalidas;
  }

  function enfocarError(p) {
    var foco = p.querySelector('input:not([disabled]), select:not([disabled]), textarea:not([disabled])');
    p.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (foco) foco.focus({ preventScroll: true });
  }

  form.addEventListener('click', function (e) {
    var b = e.target.closest('[data-accion]');
    if (!b) return;
    if (b.dataset.accion === 'siguiente') {
      var inv = validarSeccion(secciones[actual]);
      if (inv.length) { enfocarError(inv[0]); return; }
      irA(siguienteIndice(1), true);
    } else if (b.dataset.accion === 'anterior') {
      irA(siguienteIndice(-1), true);
    }
    guardarBorrador();
  });

  if (botonModo) botonModo.addEventListener('click', function () {
    modo = modo === 'completo' ? 'pasos' : 'completo';
    guardarLocal(CLAVE_MODO, modo);
    if (modo === 'pasos') actual = secciones.indexOf(visibles()[0]);
    mostrar(false);
  });

  /* ---------- Borrador local ------------------------------------------ */
  function serializar() {
    var datos = {};
    new FormData(form).forEach(function (valor, nombre) {
      if (datos[nombre] === undefined) datos[nombre] = valor;
      else datos[nombre] = [].concat(datos[nombre], valor);
    });
    return datos;
  }

  var indicador = doc.querySelector('.guardado');
  function guardarBorrador() {
    if (terminado) return;
    guardarLocal(CLAVE_BORRADOR, JSON.stringify({ datos: serializar(), seccion: actual }));
    if (indicador) indicador.textContent = 'Borrador guardado en este dispositivo · ' + new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  }

  function restaurarBorrador() {
    var b;
    try { b = JSON.parse(leerLocal(CLAVE_BORRADOR)); } catch (e) {}
    if (!b || !b.datos) return;
    Object.keys(b.datos).forEach(function (nombre) {
      var vals = [].concat(b.datos[nombre]);
      $$('[name="' + nombre + '"]', form).forEach(function (el) {
        if (el.type === 'radio' || el.type === 'checkbox') el.checked = vals.indexOf(el.value) !== -1;
        else if (el.tagName === 'SELECT' || vals[0] !== 'ns_nc') el.value = vals[0];
      });
    });
    aplicarCondiciones();
    actual = Math.min(b.seccion || 0, secciones.length - 1);
    if (avisoBorrador) avisoBorrador.hidden = false;
  }

  function borrarBorrador() { try { localStorage.removeItem(CLAVE_BORRADOR); } catch (e) {} }

  var botonDescartar = doc.querySelector('[data-accion="descartar"]');
  if (botonDescartar) botonDescartar.addEventListener('click', function () {
    borrarBorrador(); form.reset(); aplicarCondiciones();
    $$('.pregunta--error', form).forEach(limpiarError);
    avisoBorrador.hidden = true; irA(0, true);
  });

  form.addEventListener('input', function () { mostrar(false); guardarBorrador(); });
  form.addEventListener('change', function () { mostrar(false); guardarBorrador(); });

  /* ---------- Envío (con las salvaguardas del protocolo) -------------- */
  // Enmascara documentos (DNI, CUIL) y correos escritos por error en textos libres
  function sanitizar(texto) {
    return texto
      .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, '[correo omitido]')
      .replace(/\b\d{2}[-.\s]?\d{1,2}[.\s]?\d{3}[.\s]?\d{3}[-.\s]?\d\b/g, '[documento omitido]')
      .replace(/\b\d{1,2}[.\s]?\d{3}[.\s]?\d{3}\b/g, '[documento omitido]');
  }

  function codigo() {
    var c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = '';
    for (var i = 0; i < 6; i++) s += c[Math.floor(Math.random() * c.length)];
    return s;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    // Se valida todo lo visible, también lo que quedó atrás al cambiar de modo
    for (var i = 0; i < secciones.length; i++) {
      if (!seccionVisible(secciones[i])) continue;
      var inv = validarSeccion(secciones[i]);
      if (inv.length) {
        if (modo === 'pasos' && i !== actual) { irA(i, false); validarSeccion(secciones[i]); }
        enfocarError(inv[0]);
        return;
      }
    }

    var datos = serializar();
    Object.keys(datos).forEach(function (k) {
      var campo = form.querySelector('[name="' + k + '"]');
      if (campo && (campo.tagName === 'TEXTAREA' || campo.type === 'text')) {
        datos[k] = Array.isArray(datos[k]) ? datos[k].map(sanitizar) : sanitizar(datos[k]);
      }
    });
    var hora = new Date(); hora.setMinutes(0, 0, 0);     // sello temporal redondeado a la hora

    var respuesta = {
      encuesta: ID,
      formulario: form.dataset.codigoFormulario || undefined,
      version: form.dataset.version || '1',
      codigo: codigo(),
      fecha: hora.toISOString(),
      respuestas: datos
    };

    var enviar = form.dataset.endpoint
      ? fetch(form.dataset.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(respuesta) })
          .then(function (r) { if (!r.ok) throw new Error(r.status); })
      : Promise.resolve(console.info('[encuesta] Sin data-endpoint: respuesta generada', respuesta));

    var botonEnviar = form.querySelector('[data-accion="enviar"]');
    botonEnviar.disabled = true; botonEnviar.textContent = 'Enviando…';

    enviar.then(function () {
      terminado = true;
      borrarBorrador();
      form.hidden = true;
      if (progreso) progreso.hidden = true;
      if (portada) portada.hidden = true;
      if (botonModo) botonModo.hidden = true;
      if (avisoBorrador) avisoBorrador.hidden = true;
      final.hidden = false;
      final.querySelector('[data-codigo]').textContent = respuesta.codigo;
      final.querySelector('h2').focus();
    }).catch(function () {
      botonEnviar.disabled = false; botonEnviar.textContent = 'Enviar respuestas';
      var err = doc.getElementById('aviso-error');
      err.hidden = false; err.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });

  /* ---------- Inicio -------------------------------------------------- */
  restaurarBorrador();
  if (!seccionVisible(secciones[actual])) actual = secciones.indexOf(visibles()[0]);
  mostrar(false);
})();
