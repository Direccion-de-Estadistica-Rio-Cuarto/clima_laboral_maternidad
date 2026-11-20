# Encuesta de Clima Laboral 2026 · Maternidad Hortensia Gardey de Kowalk

Copia de la plantilla adaptada al cuestionario FO-SGC-05-IDI.11 (29 preguntas, 7 bloques).
Agregados respecto de la plantilla original:

- `js/encuesta.js`, cambios genéricos y compatibles con la plantilla:
  - condición «o» en `data-mostrar-si` (`a=x || b=y`; `&&` agrupa antes que `||`);
  - escala `acuerdo_total` («Totalmente de acuerdo … Totalmente en desacuerdo»);
  - numeración fija: `data-numero-inicial="0"` en el form (género = 0) y `data-numero="23.1a"` en una pregunta.
- `js/maternidad.js`, reglas propias de esta encuesta: «Maestranza» preseleccionada en P4 si P1 es
  «Servicios de Apoyo y Logística», y P7 sin el área elegida en P1.
- P25, P26 y P27 no llevan la justificación automática: la reemplazan P25.1, P27.1 y P28.
- **Todas las preguntas llevan `data-sin-extras`**: solo tienen las opciones del cuestionario en PDF. «Otro» con
  texto aparece donde el PDF lo pide (P4, P6, P7, P22, P23.1, P25.1, P27.1) y no hay NS/NC. El «No sé» de la
  P24 se guarda como `ns_nc`.
- Pie: **Río Cuarto IA** abre la declaración de uso de IA y **Río Cuarto ODS** los ODS 3, 4, 5, 8 y 16
  (íconos oficiales de la ONU en `assets/img/ods/`), con enlace a la Ordenanza N° 148/2021.
- Para probarla en la computadora: `node herramientas/servidor.js . 5180` y abrir http://localhost:5180
  (también se puede abrir `index.html` con doble clic).

---

# Plantilla de encuestas · Sistema de diseño Río Cuarto

Formulario de recolección de datos que usa **los mismos tokens, tipografía y componentes que los tableros**. Así, lo que se ve al responder una encuesta es igual a lo que se ve después al leer los resultados.

```
plantilla-encuestas/
├── index.html                ← encuesta de ejemplo completa (copiala y editala)
├── sistema-de-diseno.html    ← guía visual del sistema; funciona sola, en cualquier carpeta
├── css/fuentes.css           ← Google Sans (igual que los tableros)
├── css/tokens.css            ← colores y medidas: MISMO archivo que los tableros, no se toca
├── css/tokens-encuesta.css   ← lo que suman las encuestas (fondos de estado, foco)
├── css/encuesta.css          ← header y componentes de formulario
├── js/tema.js                ← modo claro/oscuro (mismo archivo que los tableros)
├── js/encuesta.js            ← pasos, validación, condicionales, borrador y envío
├── assets/fonts/google-sans-latin-variable.woff2
├── assets/img/logo-gobierno.webp        ← escudo del header
├── assets/img/escudo-secretaria.png     ← escudos del footer
├── assets/img/escudo-datos.png
└── assets/img/ods/ods-rueda.png
```

`index.html` necesita las carpetas `css`, `js` y `assets` al lado. `sistema-de-diseno.html`
trae todo incluido (fuente, escudo, estilos): si cambiás algún CSS, hay que regenerarla.

## Tipografía y header
- **Google Sans en todo**, también en botones, campos, opciones y códigos. Se carga desde
  `assets/fonts/`, no de internet.
- **Header igual al de Datos Río Cuarto**, sin el botón de iniciar sesión: escudo, Secretaría,
  Dirección y botón de tema. No achiques el nombre de la Secretaría (1.17rem / 700): es el
  mínimo de contraste para el blanco sobre el celeste.
- **Footer igual al del portal**: escudos de la Secretaría y de Datos Río Cuarto, botones
  Río Cuarto IA y Río Cuarto ODS (en una encuesta llevan al portal), Elaboración, Fuente y
  enlaces a Privacidad, Condiciones y Sistema de diseño.
- `css/tokens.css`, `css/fuentes.css` y `js/tema.js` son copias exactas de los del portal.
  Si cambian allá, copialos acá.

## Cómo armar una encuesta nueva
**La primera pregunta de toda encuesta es siempre el género**, y la agrega el script sola
(`p00_genero`). Es selección única y obligatoria, con las opciones Mujer, Varón, Otra identidad
y Prefiero no responder. «Otra identidad» despliega, de forma optativa, las categorías del
Censo 2022 (`p00_genero_detalle`). No la escribas en el HTML. Solo si una encuesta en particular
no la necesita, agregá `data-sin-genero` al `<form class="encuesta">` y el script no la suma.

En el HTML va **solo lo propio de cada pregunta**. `js/encuesta.js` completa el resto: número,
asterisco, línea de tipo ("Selección única · obligatoria"), **NS/NC y «Otro» en todas las
preguntas**, las escalas y las justificaciones.

| Necesito… | Cómo |
|---|---|
| Una página o bloque | `<section class="seccion">` (desde la segunda, con `hidden`) |
| Que sea obligatoria | `data-requerida` en el `.pregunta` |
| Selección única o múltiple | `<fieldset class="pregunta">` + `.opciones` con `<label class="opcion">` |
| Máximo o mínimo de casillas | `data-max="2"` / `data-min="1"` |
| **Likert con caras** | `<fieldset class="pregunta" data-tipo="likert" data-escala="conformidad" data-nombre="p04_ambiente">` + `<legend>`. Escalas: `conformidad`, `acuerdo`, `satisfaccion`, `calidad`, `frecuencia` |
| **NPS** (satisfacción ciudadana) | `data-tipo="nps"` + `data-nombre` + `<legend>` |
| **eNPS** (clima laboral) | `data-tipo="enps"` + `data-nombre` + `<legend>`. Con `data-desde="1"` va de 1 a 10 |
| Justificación si es desfavorable | Automática y obligatoria: Likert 2 y 1, NPS y eNPS de 0 a 6. Se cambia con `data-desfavorables="5\|4"` o `data-justificacion="…"` |
| Matriz | `.pregunta.matriz-pregunta` con `data-nombre` + `table.matriz` (el script suma la columna NS/NC y la fila «Otro») |
| Condicional a mano | `data-mostrar-si="p07=no"` (también `a=x\|y`, `a!=x`, `a`, `a=x && b=y`) |
| No agregar NS/NC ni «Otro» | `data-sin-extras` (usar con criterio) |

**Paneles de apertura**: los chips (código del formulario, anonimato), el botón del protocolo
(`data-abrir-modal="protocolo"` abre el `<dialog id="protocolo">`) y el aviso Propósito van en
`<div class="portada" data-portada>`. Solo se ven al abrir la encuesta.

**Modos**: el botón `data-accion="modo"` alterna entre *paso a paso* (una sección por vez) y
*formulario completo* (todo de principio a fin). La elección queda guardada en el navegador.

**Nombres y valores**: `pNN_concepto` (son las columnas del dataset). NS/NC = `ns_nc` siempre.
«Otro» = `otro` + texto en `<nombre>_otro`. Justificación = `<nombre>_porque`.
Likert 5 (más favorable) a 1 (menos favorable).

## Qué hace el JS al enviar
- Valida todo lo visible. En paso a paso valida cada sección antes de avanzar.
- Lo que está oculto por una condicional (o una justificación que ya no corresponde) no se envía.
- **Sello temporal redondeado a la hora** (`2026-11-19T14:00:00.000Z`).
- **Sanitiza los textos libres**: los correos quedan como `[correo omitido]` y los DNI o CUIL
  como `[documento omitido]`.
- Envía el JSON por POST a `data-endpoint`. Sin endpoint, solo lo muestra en la consola del navegador (para probar).
- Guarda un borrador en el dispositivo mientras se responde.

Del protocolo quedan del lado del servidor y del tablero: **no guardar IP ni metadatos** en el
servidor que recibe el `data-endpoint`, y aplicar la **regla de los 5 casos** al publicar.

## Accesibilidad (mismos criterios que los tableros)
Tiene "Saltar al contenido", `label`/`legend` en todas las preguntas (nunca solo `placeholder`), errores con ícono y texto (no dependen solo del color) unidos al campo por `aria-describedby`, foco visible, `role="progressbar"`, objetivos táctiles de 44 px y respeto de `prefers-reduced-motion`.

## Versión impresa
Al imprimir (Ctrl+P) aparecen todas las secciones juntas, sin header ni botones, como cuestionario en papel para relevamiento en campo.

## Norma de calidad (Decreto N° 1681/2023)
Entre los paneles de apertura, el chip verde «Sistema de Gestión de Calidad · Decreto N° 1681/2023»
(`.chip--norma`) abre el modal `#decreto-1681`. El modal tiene el texto legal completo transcrito,
el escudo de la ciudad (`assets/img/escudo-ciudad.png`), los firmantes y un enlace al PDF original
(`assets/docs/decreto-1681-2023.pdf`). Las firmas digitalizadas están en `assets/img/firma-antonetti.png` y
`assets/img/firma-llamosas.png`.
