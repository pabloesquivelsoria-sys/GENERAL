# Clavonia · Variante "Papel y trazo"

## Concepto

Una marca cálida y hecha a mano, pensada para emprendedores que no son diseñadores.
Las piezas parecen dibujadas sobre papel: trazos de lápiz un poco irregulares pero limpios,
notas adhesivas con cinta, y un fondo de papel con grano muy sutil.

- **Marca:** una C dibujada a mano, con trazo de tinta redondeado. El cursor de acento
  (ocre) queda dentro de la C, donde se crea la página. La palabra "clavonia" va en
  DM Sans Bold, en minúsculas.
- **Trazos:** subrayados, círculos y flechas curvas dibujados como SVG. Cada uno es un
  trazo con borde redondeado, no una línea perfecta.
- **Notas:** tarjetas tipo post-it en verde salvia, con cinta ocre y sombra plana.
- **Papel:** un ruido SVG (`feTurbulence`) a 9 % de opacidad sobre el fondo. Es lo
  único que no es color plano.

## Paleta

| Nombre | Hex | Uso | Contraste de texto |
|---|---|---|---|
| Salvia | `#A7C4B5` | Notas, bloques, fondo del cuadrado | Tinta sobre Salvia: 7.9:1 |
| Salvia profunda | `#2E4A3E` | Títulos de acento, fondos oscuros, botones | Papel sobre Salvia profunda: 9.0:1 |
| Tinta | `#1D2B24` | Texto principal, trazos, logo | Tinta sobre Papel: 13.7:1 |
| Papel | `#F7F7F2` | Fondo claro | |
| Ocre | `#E8B04B` | Solo marcas pequeñas: cursor, cinta, puntos, un subrayado | No se usa para texto (Tinta sobre Ocre: 7.6:1 si fuera necesario) |

Reglas de color: texto siempre en Tinta sobre Papel o Salvia, o en Papel sobre Salvia
profunda. Ocre nunca lleva texto y nunca ocupa más de una pequeña superficie por pieza.

## Tipografía

- **DM Sans** (400, 500, 700, 800): titulares, subtítulo, notas y wordmark.
- **Caveat** (500, 700): solo acentos cortos escritos a mano, como "en minutos.", los
  números de los pasos y las etiquetas de "Cómo funciona".

Las dos fuentes se cargan desde Google Fonts en cada HTML.

## Reglas de uso

- Deja al menos un décimo del ancho del logo libre alrededor.
- No cambies los colores de la C ni le agregues sombras o degradados.
- No cambies el texto de la marca: siempre "clavonia" en minúsculas.
- Las piezas usan solo el mensaje de lanzamiento: "Tu página, lista en minutos." y
  "Elige una plantilla, edita por bloques y publica cuando quieras." No se agregan
  precios, handle ni dominio: aún no están definidos.
- Historias: el texto clave queda a 250 px del borde superior e inferior.
- Destacados de Instagram: el contenido va en el centro para que el recorte circular no
  lo corte.
- Los trazos de subrayado y las flechas se pueden mover o repetir, pero no deformar.
- Para cambiar un texto, edita el HTML y vuelve a renderizar con el mismo tamaño.

## Archivos

Cada PNG tiene su HTML fuente con el mismo nombre. El HTML es autosuficiente
(solo necesita conexión para cargar las fuentes de Google).

| Archivo | Medida | Uso |
|---|---|---|
| `avatar-1080x1080.png` / `.html` | 1080 × 1080 | Foto de perfil (Instagram, Facebook, LinkedIn) |
| `facebook-cover-1640x624.png` / `.html` | 1640 × 624 | Portada de Facebook (el contenido va a la derecha del perfil) |
| `facebook-post-1200x630.png` / `.html` | 1200 × 630 | Imagen para enlaces compartidos en Facebook |
| `instagram-post-1080x1350.png` / `.html` | 1080 × 1350 | Publicación de feed (4:5) |
| `instagram-square-1080x1080.png` / `.html` | 1080 × 1080 | Mosaico de cuadrícula |
| `instagram-story-1080x1920.png` / `.html` | 1080 × 1920 | Historia (texto dentro de 250 px arriba y abajo) |
| `highlight-1-1080x1080.png` / `.html` | 1080 × 1080 | Destacado "Planes" |
| `highlight-2-1080x1080.png` / `.html` | 1080 × 1080 | Destacado "Cómo funciona" |

Render: `node <helper>/shot.mjs file://<ruta>/<archivo>.html <ruta>/<archivo>.png <ancho> <alto>` (usa Playwright con Chromium, sin instalar nada nuevo).
