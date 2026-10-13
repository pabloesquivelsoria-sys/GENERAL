# Clavonia · Variante "Bloques vivos"

## Concepto

Bloques vivos es una variante gráfica y de alta energía de la marca. Usa bloques
geométricos grandes, colores planos y tipografía pesada, como un cartel. La idea
viene del editor de Clavonia: cada página se arma con bloques, y aquí los bloques
son protagonistas. Cada pieza usa como máximo tres colores, y el texto siempre
tiene contraste suficiente.

La marca se redibuja en esta dirección: la C de bloques sigue siendo la base,
con un cursor de acento que ahora es un bloque sólido (amarillo, tinta o blanco
según el fondo).

## Paleta

| Nombre | Hex | Uso |
|---|---|---|
| Azul eléctrico | `#2F5BFF` | Fondos, bloques, acentos de texto grande |
| Amarillo sol | `#FFD23F` | Bloques, fondos de tarjeta, texto sobre azul o tinta |
| Tinta | `#111111` | Texto principal, bloques oscuros, fondos |
| Blanco | `#FFFFFF` | Fondos claros, texto sobre tinta o azul |

Reglas de color:

- Usa solo tres colores por pieza. Ejemplo: azul, amarillo y tinta.
- Sin degradados ni sombras. Solo colores planos.
- Texto pequeño: tinta sobre blanco o amarillo, blanco sobre tinta o azul, o azul sobre blanco.
- Amarillo sobre azul (3.6:1) solo para textos grandes (desde 24 px en negrita).
- Azul sobre tinta (3.6:1) solo para textos grandes (desde 24 px en negrita).

## Tipografía

- **Títulos:** Archivo Black (Google Fonts), 400.
- **Texto:** Archivo (Google Fonts), 500, 700 y 800.

Las piezas cargan las fuentes desde Google Fonts. Si no hay conexión, el
navegador usa un respaldo sans-serif, así que revisa los PNG antes de publicar.

## Reglas de uso

- Los bloques son rectángulos planos, sin bordes redondeados. La excepción es
  el destacado "Planes", que usa barras con esquinas suaves.
- Un titular por pieza. Mantén el mensaje central: "Tu página, lista en minutos."
- Subtítulo: "Elige una plantilla, edita por bloques y publica cuando quieras."
- Logo: no lo estires, no cambies sus colores fuera de la paleta y deja libre al
  menos un décimo de su ancho.
- No agregues handle, dominio ni precios hasta que la marca los defina.
- Un solo botón por pieza: "Empieza hoy" o "Crear mi página" (mínimo 44 px de alto).
- Historias: el texto clave se mantiene entre 250 px desde arriba y 250 px desde
  abajo. Lo decorativo puede salir de esa zona.
- Destacados (highlights): el contenido queda dentro del círculo central, así
  que no pongas texto en las esquinas.

## Archivos

Todos están en esta carpeta. Cada PNG tiene su HTML fuente con el mismo nombre.

| Archivo PNG | Medida (px) | Uso |
|---|---|---|
| `avatar-1080x1080.png` | 1080 × 1080 | Foto de perfil |
| `facebook-cover-1640x624.png` | 1640 × 624 | Portada de Facebook |
| `facebook-post-1200x630.png` | 1200 × 630 | Imagen de enlace compartido |
| `instagram-post-1080x1350.png` | 1080 × 1350 | Publicación de feed (4:5) |
| `instagram-square-1080x1080.png` | 1080 × 1080 | Cuadro de cuadrícula |
| `instagram-story-1080x1920.png` | 1080 × 1920 | Historia |
| `highlight-1-1080x1080.png` | 1080 × 1080 | Destacado "Planes" |
| `highlight-2-1080x1080.png` | 1080 × 1080 | Destacado "Cómo funciona" |
| `brand-guide-1600x1200.png` | 1600 × 1200 | Lámina: guía de marca en una página |
| `social-preview-1500x1150.png` | 1500 × 1150 | Lámina: vista previa de Facebook e Instagram |
| `x-header-1500x500.png`, `x-post-1200x675.png` | 1500 × 500, 1200 × 675 | X: encabezado y publicación |
| `linkedin-banner-1584x396.png`, `linkedin-company-1128x191.png`, `linkedin-post-1200x627.png` | 1584 × 396, 1128 × 191, 1200 × 627 | LinkedIn: banner personal, portada de empresa y publicación |
| `youtube-channel-2560x1440.png`, `youtube-thumbnail-1280x720.png` | 2560 × 1440, 1280 × 720 | YouTube: portada del canal (texto en 1546 × 423) y miniatura |
| `pinterest-pin-1000x1500.png`, `tiktok-cover-1080x1920.png` | 1000 × 1500, 1080 × 1920 | Pin de Pinterest y portada de TikTok |
| `ad-300x250.png`, `ad-336x280.png`, `ad-728x90.png`, `ad-300x600.png`, `ad-320x100.png` | según el nombre | Anuncios de Google Display |
| `banners-overview-1600x1200.png` | 1600 × 1200 | Lámina: todos los banners y anuncios |

Para regenerar un PNG, abre su HTML en un navegador con el tamaño exacto de la
pieza y guarda una captura de página completa (por ejemplo, con Playwright).
