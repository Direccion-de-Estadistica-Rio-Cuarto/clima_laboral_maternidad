/* ==========================================================================
   maternidad.js — Reglas propias de la Encuesta de Clima Laboral 2026 de la
   Maternidad Hortensia Gardey de Kowalk. Va después de js/encuesta.js.
     · P4: si en P1 eligió «Servicios de Apoyo y Logística», preselecciona
       «Maestranza» (se puede cambiar).
     · P7: no ofrece como área preferida la misma área elegida en P1.
   ========================================================================== */
(function () {
  'use strict';

  var form = document.getElementById('encuesta');
  if (!form || !window.Encuesta) return;

  function marcado(nombre) {
    var el = form.querySelector('[name="' + nombre + '"]:checked');
    return el ? el.value : '';
  }
  function avisarCambio(el) { el.dispatchEvent(new Event('change', { bubbles: true })); }

  // P4 · Maestranza preseleccionada (solo si todavía no eligió una labor)
  var maestranzaAutomatica = false;
  function preseleccionarLabor() {
    var maestranza = form.querySelector('[name="p04_labor"][value="maestranza"]');
    if (!maestranza) return;
    if (marcado('p01_area') === 'apoyo_logistica') {
      if (!marcado('p04_labor')) {
        maestranza.checked = true;
        avisarCambio(maestranza);
        maestranzaAutomatica = true;
      }
    } else if (maestranzaAutomatica && maestranza.checked) {
      // Cambió de área: se retira lo que se había preseleccionado
      maestranza.checked = false;
      maestranzaAutomatica = false;
      avisarCambio(maestranza);
    }
  }

  // P7 · sin el área propia
  function filtrarAreas() {
    var propia = marcado('p01_area');
    Array.prototype.forEach.call(form.querySelectorAll('[name="p07_area_preferida"]'), function (input) {
      var esPropia = propia !== '' && input.value === propia;
      input.closest('.opcion').hidden = esPropia;
      if (esPropia && input.checked) { input.checked = false; avisarCambio(input); }
    });
  }

  form.addEventListener('change', function (e) {
    var nombre = e.target.name;
    if (nombre === 'p04_labor' && e.isTrusted) maestranzaAutomatica = false;
    if (nombre === 'p01_area') { preseleccionarLabor(); filtrarAreas(); }
  });

  filtrarAreas();
})();
