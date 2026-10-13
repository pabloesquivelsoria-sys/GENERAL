# Clavonia

Clavonia crea diseños de landing pages y sitios web para emprendedores. El usuario elige una plantilla o describe su negocio, obtiene una página con su marca, la edita en un editor de bloques y la publica.

## Estructura del repositorio

| Ruta | Descripción |
| --- | --- |
| `apps/web` | Aplicación Next.js 15 (App Router) con la interfaz de usuario. |
| `packages/core` | Tipos de dominio y esquemas zod compartidos. |
| `packages/ui` | Primitivas de React y preset de Tailwind. |
| `packages/templates` | Catálogo de plantillas de página. |
| `packages/editor` | Núcleo del editor de bloques. |
| `packages/design-engine` | Generación de páginas a partir de un brief, con proveedor simulado. |
| `packages/db` | Esquema y cliente Prisma para PostgreSQL. |

## Comandos

| Comando | Descripción |
| --- | --- |
| `pnpm dev` | Arranca la aplicación web en modo desarrollo. |
| `pnpm build` | Compila todos los paquetes y aplicaciones. |
| `pnpm typecheck` | Ejecuta `tsc --noEmit` en cada paquete. |
| `pnpm test` | Ejecuta las pruebas con Vitest. |
| `pnpm lint` | Ejecuta ESLint sobre el repositorio. |
| `pnpm format` | Formatea el código con Prettier. |
| `pnpm db:generate` | Genera el cliente de Prisma. |
| `pnpm db:migrate` | Aplica las migraciones de la base de datos. |
| `pnpm db:seed` | Carga datos de ejemplo en la base de datos. |

## Primeros pasos

1. Instala Node.js 20 o superior (la versión está en `.nvmrc`).
2. Activa pnpm con `corepack enable`. El proyecto usa `pnpm@9.12.0`.
3. Levanta PostgreSQL con Docker:

   ```bash
   docker compose up -d
   ```

4. Instala las dependencias:

   ```bash
   pnpm install
   ```

5. Genera el cliente de Prisma:

   ```bash
   pnpm db:generate
   ```

6. Arranca la aplicación:

   ```bash
   pnpm dev
   ```
