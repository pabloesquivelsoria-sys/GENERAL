# Roadmap de Clavonia (MVP)

El MVP se divide en seis fases. Cada fase se considera terminada cuando se cumplen sus objetivos y todas las casillas están marcadas.

## Fase 0: Esqueleto

**Objetivos**

- Tener el monorepo funcionando con pnpm, TypeScript estricto y los paquetes `@clavonia/*` creados.
- Tener la base de datos local y la CI en marcha.

**Checklist**

- [ ] Workspace pnpm con `core`, `ui`, `templates`, `editor`, `design-engine`, `db` y `apps/web`.
- [ ] `tsconfig.base.json` compartido y modo estricto en todos los paquetes.
- [ ] Esquemas base de `core`: `BLOCK_TYPES`, `Block`, `BrandTheme`, `PageDocument`, `Project` y `ProjectKind`.
- [ ] PostgreSQL 16 local con Docker Compose (`infra/docker-compose.yml`).
- [ ] Archivo `.env.example` con `DATABASE_URL`.
- [ ] CI de GitHub Actions: instalación, `db:generate`, typecheck y tests.
- [ ] ADR 0001 (stack) y ADR 0002 (modelo de documento) aceptados.

## Fase 1: Plantillas y editor

**Objetivos**

- Ofrecer un catálogo de plantillas que se pueda elegir en el wizard.
- Generar una página inicial a partir de una plantilla o de una descripción del negocio, con el proveedor stub.
- Editar la página en un editor de bloques con operaciones puras.

**Checklist**

- [ ] Catálogo de plantillas en `@clavonia/templates` para landing y website.
- [ ] Wizard básico en `apps/web`: elegir plantilla o describir el negocio.
- [ ] `design-engine` con el proveedor stub que devuelve un `PageDocument` válido.
- [ ] Operaciones del editor en `@clavonia/editor`: insertar, mover, eliminar y actualizar props de bloque.
- [ ] Interfaz de edición de bloques con primitivas de `@clavonia/ui`.
- [ ] Tests de las operaciones del editor y de la generación de documentos.

## Fase 2: Cuentas y proyectos

**Objetivos**

- Permitir que cada usuario se registre, inicie sesión y gestione sus proyectos.
- Guardar proyectos y documentos de forma persistente en PostgreSQL.

**Checklist**

- [ ] Registro e inicio de sesión.
- [ ] Modelo `User` en `packages/db` y vínculo de propiedad con `Project`.
- [ ] CRUD de proyectos: crear, listar, renombrar y eliminar.
- [ ] Guardado automático del `PageDocument` con control de versión.
- [ ] Validación de todos los documentos leídos desde la base de datos con zod.
- [ ] Pruebas de autorización: un usuario no ve ni modifica proyectos ajenos.

## Fase 3: Publicación en URL pública

**Objetivos**

- Publicar un proyecto en una URL pública que cualquiera pueda abrir.
- Garantizar que la página publicada no cambia al seguir editando.

**Checklist**

- [ ] Modelo `PublishedPage` con slug único y snapshot del documento.
- [ ] Acción de publicar y de despublicar desde el editor.
- [ ] Ruta pública en `apps/web` que renderiza el snapshot.
- [ ] Render de bloques compartido entre editor y página publicada.
- [ ] Metadatos básicos (título, descripción) y respuesta 404 para slugs inexistentes.

## Fase 4: Proveedor de diseño con IA

**Objetivos**

- Sustituir el proveedor stub por un proveedor de IA que genere páginas a partir del brief.
- Mantener la misma interfaz para que el resto de la aplicación no cambie.

**Checklist**

- [ ] Interfaz de proveedor en `@clavonia/design-engine` estable y documentada.
- [ ] Proveedor de IA detrás de esa interfaz, con la clave de API en variables de entorno.
- [ ] Validación de la salida de la IA contra el esquema de `PageDocument`, con reintento o fallback al stub.
- [ ] Límites de uso por usuario y registro de costes por generación.
- [ ] Conjunto de briefs de prueba para medir la calidad de las páginas generadas.

## Fase 5: Kit de marca y exportaciones

**Objetivos**

- Permitir que el usuario defina su identidad de marca y la aplique a todo el proyecto.
- Permitir exportar la página para usarla fuera de Clavonia.

**Checklist**

- [ ] Editor de `BrandTheme`: colores, tipografías y logotipo.
- [ ] Aplicación del tema a todas las plantillas y bloques del proyecto.
- [ ] Exportación de la página como HTML estático.
- [ ] Exportación en ZIP con los recursos (imágenes y estilos).
- [ ] Revisión de accesibilidad básica (contraste y textos alternativos) en las exportaciones.
