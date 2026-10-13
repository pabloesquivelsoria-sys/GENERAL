# ADR 0001: Stack tecnológico

- Estado: Aceptada
- Fecha: 2026-10-13

## Contexto

Clavonia necesita un monorepo con paquetes de dominio compartidos (núcleo, UI, plantillas, editor, motor de diseño y base de datos) y una aplicación web que los compone. El equipo es pequeño, así que priorizamos entregar rápido, tipado estricto y un despliegue sencillo.

## Decisión

- Gestor de paquetes: pnpm workspaces, con paquetes bajo el scope `@clavonia/*`.
- Lenguaje: TypeScript en modo estricto, extendiendo `tsconfig.base.json` desde cada paquete.
- Runtime: Node 20 o superior.
- Aplicación web: Next.js 15 con App Router y React 19.
- Estilos: Tailwind CSS 3.4, con un preset compartido desde `@clavonia/ui`.
- Validación: zod 3 para los esquemas de dominio, que son la fuente de los tipos en tiempo de ejecución.
- Datos: Prisma 5 sobre PostgreSQL. En desarrollo local, PostgreSQL 16 se levanta con Docker Compose.
- Tests: vitest 2.
- CI: GitHub Actions, limitado a cambios en `clavonia/**`.

## Consecuencias

Positivas:

- Un solo stack en TypeScript para la web, los paquetes y los tests.
- Los esquemas zod se reutilizan entre el editor, el motor de diseño y la API.

Negativas y costes:

- Prisma exige generar el cliente (`pnpm db:generate`) antes de typecheck y tests, tanto en local como en CI.
- zod 3 y Tailwind 3.4 quedarán atrasados frente a sus versiones mayores; migrar tendrá coste propio.
- Hasta que se confirme `pnpm-lock.yaml`, la CI instala sin lockfile congelado y los builds no son reproducibles.
