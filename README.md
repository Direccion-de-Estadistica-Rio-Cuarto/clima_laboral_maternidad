# Encuesta de Clima Laboral 2026 · Maternidad Hortensia Gardey de Kowalk

Formulario web anónimo para relevar el clima laboral del personal de la Maternidad
Hortensia Gardey de Kowalk (Gobierno de Río Cuarto). Implementa el cuestionario
FO-SGC-05-IDI.11 del Sistema de Gestión de Calidad (Decreto N° 1681/2023), elaborado
por la Dirección de Estadística, Control de Calidad y Procesos.

Está construido sobre la plantilla de encuestas del sistema de diseño de Datos Río Cuarto:
usa los mismos tokens, tipografía y componentes que los tableros donde se publican los resultados.

## Características
- 29 preguntas en 7 bloques: datos generales, ambiente laboral, motivación y compromiso,
  capacitación, procesos y recursos, valoración global (eNPS) y comentario final.
- Preguntas condicionales: los seguimientos aparecen solo cuando corresponde (por ejemplo,
  P27.1 y P28 si la satisfacción es baja o la recomendación es de 6 o menos).
- Anonimato por diseño: sin datos identificatorios, sello temporal redondeado a la hora,
  enmascarado automático de DNI y correos en textos libres, y regla de los 5 casos al publicar.
- Modo paso a paso o formulario completo, borrador guardado en el dispositivo y versión imprimible.
- Accesible: etiquetas en todas las preguntas, errores con ícono y texto, foco visible y
  objetivos táctiles de 44 px.
- Modo claro y oscuro.
- Contribuye a los ODS 3, 4, 5, 8 y 16 (Ordenanza N° 148/2021).

## Uso
Abrir `index.html` en el navegador, o servirlo de forma local:

    node herramientas/servidor.js . 5180

Las respuestas se envían en JSON por POST a la URL configurada en `data-endpoint`. Sin
endpoint, se muestran en la consola del navegador.

## Estructura
- `index.html`: la encuesta.
- `js/encuesta.js`: lógica genérica de la plantilla (validación, condicionales, envío).
- `js/maternidad.js`: reglas propias de esta encuesta.
- `css/`: tokens y estilos del sistema de diseño.
- `assets/`: tipografía, escudos, íconos ODS y decreto.

## Créditos
Dirección de Estadística, Control de Calidad y Procesos · Secretaría de Gestión y
Participación Ciudadana · Gobierno de Río Cuarto. Desarrollado con asistencia de IA
(Claude Opus 5.5, Anthropic), con revisión del equipo técnico.
