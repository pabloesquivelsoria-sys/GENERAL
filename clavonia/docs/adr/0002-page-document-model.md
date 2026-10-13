# ADR 0002: Modelo de documento de página

- Estado: Aceptada
- Fecha: 2026-10-13

## Contexto

La página de un proyecto se compone de bloques ordenados (hero, about, services, gallery, testimonials, pricing, contact, cta, footer, text e image). El editor de bloques, el motor de diseño y la publicación necesitan el mismo formato. Además, el documento debe poder evolucionar sin romper los proyectos ya guardados.

## Decisión

- Un `PageDocument` es un objeto JSON con `schemaVersion` y un array ordenado de `Block`.
- Cada `Block` tiene un `id` estable, un `type` contenido en `BLOCK_TYPES` y `props` tipadas según el tipo. Todo se valida con esquemas zod en `@clavonia/core`.
- El documento se guarda como JSON en PostgreSQL (columna `Json` de Prisma), no como una tabla por bloque.
- Al publicar se guarda un snapshot inmutable del documento en ese momento.
- Las migraciones de documento viven en `@clavonia/core`, indexadas por `schemaVersion`, y se aplican al cargar un documento antiguo.
- El editor modifica el documento mediante operaciones puras (insertar, mover, eliminar, actualizar props) definidas en `@clavonia/editor`.

## Consecuencias

Positivas:

- Hay un único formato para el editor, el motor de diseño, el render de la página publicada y la API.
- Los cambios de esquema quedan controlados por versión y son testeables.

Negativas y costes:

- No se pueden hacer consultas SQL sobre bloques individuales.
- Es obligatorio validar el JSON al leerlo desde la base de datos.
- Cada cambio de `schemaVersion` exige escribir y mantener una migración.
