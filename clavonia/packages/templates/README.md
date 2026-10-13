# @clavonia/templates

Catálogo de plantillas para crear proyectos nuevos en Clavonia: landings y sitios web listos para personalizar.

## Contenido

- `templates`: lista de todas las plantillas.
- `getTemplate(id)`: devuelve una plantilla por su identificador.
- `listTemplates({ kind?, category? })`: filtra plantillas por tipo (`landing` o `website`) o categoría.
- `build()` de cada plantilla: genera las páginas con ids nuevos en cada llamada.

## Plantillas

| id | Tipo | Descripción |
| --- | --- | --- |
| `landing-servicios` | landing | Presenta servicios y recibe solicitudes de cotización. |
| `landing-producto` | landing | Vende un producto con galería, precio y botón de compra. |
| `sitio-negocio-local` | website | Inicio y menú con servicios, precios y contacto. |
| `portafolio` | website | Portafolio freelance con trabajos y contacto. |

Los textos usan marcadores como `[nombre del negocio]` o `[precio]` que se reemplazan al personalizar el proyecto.

## Scripts

- `pnpm --filter @clavonia/templates test`
- `pnpm --filter @clavonia/templates typecheck`
