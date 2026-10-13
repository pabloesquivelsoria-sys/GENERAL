# Arquitectura de Clavonia

Clavonia ayuda a emprendedores a crear landing pages y sitios web de marca. El usuario elige una plantilla o describe su negocio, obtiene una página generada, la ajusta en un editor de bloques y la publica.

## Paquetes y dirección de dependencias

Las flechas van del paquete que depende hacia la dependencia.

```mermaid
flowchart TB
  web[apps/web<br/>Next.js 15 App Router]
  engine[design-engine<br/>brief a página]
  editor[editor<br/>núcleo del editor de bloques]
  templates[templates<br/>catálogo de plantillas]
  ui[ui<br/>primitivas React y preset Tailwind]
  db[db<br/>Prisma y PostgreSQL]
  core[core<br/>tipos de dominio y esquemas zod]

  web --> engine
  web --> editor
  web --> templates
  web --> ui
  web --> db
  engine --> templates
  engine --> core
  editor --> ui
  editor --> core
  templates --> core
  ui --> core
  db --> core
```

Reglas:

- `core` no depende de ningún otro paquete `@clavonia/*`.
- Los paquetes de dominio (`templates`, `editor`, `design-engine`, `db`) nunca importan de `apps/web`.
- Sólo `apps/web` compone los paquetes: rutas, server actions, API y páginas.
- No hay ciclos entre paquetes.

## Flujo de peticiones

1. **Wizard.** El usuario elige una plantilla o describe su negocio en `apps/web`. Se crea un proyecto con `kind` (`landing` o `website`) y un `BrandTheme`.
2. **Motor de diseño.** `design-engine` recibe el brief y devuelve un `PageDocument` inicial. En la fase 1 usa un proveedor stub basado en plantillas; en la fase 4 se sustituye por un proveedor de IA detrás de la misma interfaz.
3. **Persistencia.** `apps/web` guarda el proyecto y su documento a través de `@clavonia/db`.
4. **Editor.** El usuario edita los bloques (`BLOCK_TYPES`) con operaciones de `@clavonia/editor`. Cada guardado persiste una nueva versión del documento.
5. **Publicación.** En la fase 3, `apps/web` crea un snapshot inmutable del documento, le asigna una URL pública y la sirve.

```mermaid
sequenceDiagram
  actor U as Emprendedor
  participant W as Wizard (apps/web)
  participant D as design-engine
  participant DB as db (Prisma)
  participant E as editor
  participant P as Publicación (apps/web)

  U->>W: Plantilla o descripción del negocio
  W->>D: brief (kind, BrandTheme)
  D-->>W: PageDocument inicial
  W->>DB: crear Project y PageDocument
  U->>E: editar bloques
  E->>DB: guardar PageDocument (nueva versión)
  U->>P: publicar
  P->>DB: leer documento y guardar snapshot
  P-->>U: URL pública (fase 3)
```

## Modelo de datos

El modelo es orientativo. La fuente de verdad es `packages/db/prisma/schema.prisma`.

```mermaid
erDiagram
  USER ||--o{ PROJECT : posee
  PROJECT ||--|| PAGE_DOCUMENT : contiene
  PROJECT ||--o{ PUBLISHED_PAGE : publica

  USER {
    string id PK
    string email "fase 2"
  }
  PROJECT {
    string id PK
    string name
    string kind "landing o website"
    json theme "BrandTheme"
    string status "draft o published"
  }
  PAGE_DOCUMENT {
    string id PK
    string projectId FK
    int schemaVersion
    int version
    json blocks "Block[]"
  }
  PUBLISHED_PAGE {
    string id PK
    string projectId FK
    string slug UK "fase 3"
    json snapshot "PageDocument inmutable"
    datetime publishedAt
  }
```

Notas:

- `PAGE_DOCUMENT` guarda el documento actual del proyecto. Su formato se describe en el [ADR 0002](adr/0002-page-document-model.md).
- `USER` y el vínculo `owner` llegan en la fase 2. Hasta entonces los proyectos no tienen dueño.
- `PUBLISHED_PAGE` llega en la fase 3 y guarda snapshots que no cambian al editar el proyecto.
