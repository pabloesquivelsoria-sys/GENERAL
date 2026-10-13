# @clavonia/core

Paquete base de Clavonia: tipos de dominio, esquemas de validación y utilidades compartidas.

## Contenido

- `types.ts`: contrato de dominio (`Block`, `BrandTheme`, `PageDocument`, `Project`, `BLOCK_TYPES`, `PROJECT_KINDS`).
- `schemas.ts`: esquemas zod (`blockSchema`, `brandThemeSchema`, `pageDocumentSchema`, `projectSchema`, `projectInputSchema`).
- `ids.ts`: `newId()` genera identificadores UUID.
- `slug.ts`: `slugify()` convierte texto en slug (sin acentos).
- `errors.ts`: `AppError(code, message)`.

## Scripts

- `pnpm --filter @clavonia/core typecheck`
- `pnpm --filter @clavonia/core test`

Este paquete solo depende de `zod`. No debe importar otros paquetes internos.
