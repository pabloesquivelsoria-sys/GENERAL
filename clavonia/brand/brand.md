# Clavonia · Guía de marca

Clavonia crea landing pages y sitios web para emprendedores. La marca es clara, moderna y confiable: el producto ayuda a que cualquier negocio se vea profesional sin ser diseñador.

## Logo

- **Marca:** una C hecha con bloques, la misma idea que los bloques del editor. El cursor de acento (verde menta) marca el lugar donde se crea la página.
- **Archivos:** `logo/clavonia-mark.svg` (solo la marca), `logo/clavonia-logo.svg` (sobre claro), `logo/clavonia-logo-dark.svg` (sobre oscuro).
- **Uso:** deja al menos un décimo del ancho del logo libre alrededor. No lo estires, no cambies sus colores ni le agregues efectos.
- **Nota:** el nombre usa la fuente Sora en minúsculas. Para imprenta, convierte el texto a curvas.

## Color

| Nombre | Hex | Uso |
|---|---|---|
| Tinta | `#0F1B2D` | Texto, fondos oscuros, logo |
| Papel | `#F6F8FB` | Fondo claro |
| Menta | `#2BD4A3` | Acento: cursor, botones, señales de acción (solo gráficos, no texto pequeño) |
| Pizarra | `#5B6B82` | Texto secundario sobre claro (contraste AA sobre Papel) |
| Blanco | `#FFFFFF` | Tarjetas |

El texto siempre va en Tinta sobre fondos claros y en Papel sobre Tinta.

## Tipografía

- **Títulos:** Sora (600 y 700), con espaciado apretado.
- **Texto:** Manrope (500 y 700).

## Elementos gráficos

- Bloques con esquinas redondeadas (radio 4 a 18 px), como las tarjetas del editor.
- Sombras suaves y finas, sin degradados.
- Un solo acento por pieza: el cursor menta.

## Tono

Directo y cercano. Frases cortas, sin jerga técnica. Ejemplo de titular: "Tu página, lista en minutos."

## Piezas para redes (`social/`)

| Archivo | Medida | Uso |
|---|---|---|
| `avatar-1080x1080.png` | 1080 × 1080 | Foto de perfil (Instagram, Facebook, LinkedIn) |
| `facebook-cover-1640x624.png` | 1640 × 624 | Portada de Facebook |
| `x-header-1500x500.png` | 1500 × 500 | Encabezado de X |
| `linkedin-banner-1584x396.png` | 1584 × 396 | Banner de LinkedIn |
| `instagram-post-1080x1350.png` | 1080 × 1350 | Post de Instagram (4:5) |
| `instagram-story-1080x1920.png` | 1080 × 1920 | Story de Instagram |

Cada pieza es un HTML en `social/` con el mismo sistema. Para regenerarlas:

```bash
python3 social/generate.py                       # reescribe los HTML
node social/render.mjs file://$PWD/social/instagram-post-1080x1350.html social/instagram-post-1080x1350.png 1080 1350
```

## Pendiente

- El handle de redes y el dominio aún no están definidos; por eso no aparecen en las piezas.
- Las piezas usan el mensaje de lanzamiento; cuando haya capturas reales del producto, conviene reemplazar el bloque de ilustración.
