# Clavonia · Variante "Stickers Pop"

Dirección: piezas sociales lúdicas y pensadas para compartir. Pegatinas con contorno grueso, ilustraciones a dos tintas de bloques de página y números grandes solo cuando hay una secuencia real.

## Concepto

- **Pegatina:** formas redondeadas con borde grueso de tinta y sombra desplazada sólida. Algunas se inclinan para dar energía.
- **Dos tintas:** las ilustraciones son bloques de página (barra de navegación, héroe, tarjetas) en una tinta y un relleno de color. Sin fotos.
- **Números:** solo en la secuencia "Elige, edita, publica" (post de Instagram, destacado "Cómo funciona").
- **Logo:** la C de bloques se redibujó con esquinas más redondas. El cursor sigue siendo el acento de color. El nombre "clavonia" va en Bricolage Grotesque 800.
- **Regla de color:** cada pieza usa como máximo tres colores: tinta y dos de la paleta.

## Paleta

| Nombre | Hex | Uso |
|---|---|---|
| Tinta | `#1B1464` | Texto, contornos, fondos oscuros |
| Rosa pop | `#FF5C8A` | Pegatinas, cursor del logo, bloques destacados |
| Amarillo mantequilla | `#FFE66D` | Fondos claros |
| Menta | `#2BD4A3` | Bloques de acento sobre blanco |
| Blanco | `#FFFFFF` | Texto sobre tinta, tarjetas |

Contraste comprobado (texto pequeño y grande):

- Tinta sobre blanco: 15.8:1
- Tinta sobre amarillo: 11.6:1
- Tinta sobre menta: 8.3:1
- Tinta sobre rosa: 5.4:1 (válido para texto)
- Rosa sobre tinta: 5.4:1 (solo texto grande o en negrita)
- Blanco sobre rosa: 2.9:1, no se usa para texto

## Tipografía

- **Titulares y números:** Bricolage Grotesque, 700 a 800, interletra apretada.
- **Texto:** Figtree, 500 a 800.
- Ambas se cargan desde Google Fonts en cada HTML.

## Reglas de uso

1. Texto siempre en tinta sobre fondos claros, o en blanco / amarillo sobre tinta. Nunca blanco sobre rosa.
2. Sin degradados, brillos ni sombras difusas. Solo relleno plano y sombra desplazada sólida.
3. No estirar el logo ni cambiar sus colores. Dejar aire alrededor igual a un décimo de su ancho.
4. Los números grandes solo sirven para pasos que van en orden.
5. No añadir handle, dominio ni precios: no existen todavía. Las piezas usan solo el mensaje de lanzamiento.
6. Historias: el texto clave queda entre 250 px del borde superior e inferior.
7. Destacados: el contenido va dentro del círculo central; las esquinas se recortan en la app.
8. Las piezas de Facebook se leen en móvil: el titular va al centro de la portada.

## Archivos

Cada pieza tiene su HTML fuente (mismo nombre) y su PNG renderizado al tamaño exacto.

| Archivo | Medida | Uso |
|---|---|---|
| `avatar-1080x1080.png` | 1080 × 1080 | Foto de perfil (Instagram, Facebook) |
| `facebook-cover-1640x624.png` | 1640 × 624 | Portada de Facebook |
| `facebook-post-1200x630.png` | 1200 × 630 | Imagen de enlace compartido |
| `instagram-post-1080x1350.png` | 1080 × 1350 | Post de feed (4:5) |
| `instagram-square-1080x1080.png` | 1080 × 1080 | Mosaico del perfil |
| `instagram-story-1080x1920.png` | 1080 × 1920 | Historia |
| `highlight-1-1080x1080.png` | 1080 × 1080 | Destacado "Planes" |
| `highlight-2-1080x1080.png` | 1080 × 1080 | Destacado "Cómo funciona" |
| `brand-guide-1600x1200.png` | 1600 × 1200 | Lámina de guía de marca (8 secciones) |
| `social-preview-1500x1150.png` | 1500 × 1150 | Vista previa de Facebook e Instagram |

Cada `.html` tiene un contenedor de medida fija. Para regenerar un PNG:

```bash
node /tmp/claude-0/e2e/shot.mjs file://$PWD/<nombre>.html $PWD/<nombre>.png <ancho> <alto>
```
