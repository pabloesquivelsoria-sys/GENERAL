# Clavonia · Variante "Cursor" (código)

## Concepto

El editor es el protagonista. La marca es una ventana de editor con bloques en la lista lateral, y el cursor de texto (la barra de inserción) marca el lugar donde se escribe la página. El tono es técnico pero cercano: la herramienta se muestra, no se explica.

- **Cursor fijo:** una barra cian estática después del punto final del titular. Es el único acento de cada pieza.
- **Marca:** una C hecha con bloques dentro de una ficha de editor, con el cursor cian a la derecha.
- **Etiquetas:** texto pequeño en monoespaciada (`bloque 01`, `editor / inicio`, `// elige tu plan`) como si fueran parte de la interfaz.
- **Superficies:** planos sólidos, sin degradados ni brillos. Bloques con esquinas de 14 a 20 px.

## Paleta

| Nombre | Hex | Uso | Contraste sobre fondo `#0B0F14` |
|---|---|---|---|
| Fondo | `#0B0F14` | Fondo de todas las piezas | — |
| Panel | `#151B23` | Ventanas, bloques, tarjetas | — |
| Panel oscuro | `#10161E` | Barras y barra lateral del editor | — |
| Línea | `#263142` | Bordes y separadores | — |
| Cian | `#38BDF8` | Cursor, botones, señal de acción | 9.0:1 |
| Lila | `#C4B5FD` | Etiquetas e índices | alto |
| Texto | `#E6EDF3` | Titulares y texto principal | alto |
| Gris | `#8B98A9` | Texto secundario | 6.6:1 (5.9:1 sobre Panel) |

Texto sobre cian: usa `#0B0F14` (8.9:1). No uses cian para texto pequeño sobre fondos oscuros; úsalo para formas y cursores.

## Tipografía

- **Sora** (600 y 700) para titulares, marca y botones. Google Fonts.
- **JetBrains Mono** (400 y 500) para etiquetas de interfaz y detalles pequeños. Texto corrido en Sora 400, color Gris.
- La palabra de marca es siempre `clavonia` en minúsculas, en Sora 700.

## Reglas de uso

1. El cursor cian es la única señal de acento. No agregues una segunda barra ni resaltes más de un bloque por pieza.
2. El titular es "Tu página, lista en minutos." y el subtítulo "Elige una plantilla, edita por bloques y publica cuando quieras.". No cambies la copia sin revisar el tono.
3. No agregues handle, dominio, precios ni cifras de planes que no estén confirmados.
4. Mantén el margen libre alrededor de la marca de al menos un décimo de su ancho.
5. Zonas seguras: historias 250 px arriba y abajo; portada de Facebook, columna central de 560 px; destacados, círculo de ~840 px; X, 80 % central y nada abajo a la izquierda; LinkedIn personal, texto a la derecha de los 400 px del avatar; YouTube, todo el texto en el área central de 1546 × 423; TikTok, texto arriba y al centro, fuera de los 120 px de la derecha y los 400 px de abajo.
6. Un solo llamado a la acción por pieza ("Crear mi página" o "Empieza hoy"), botón de al menos 44 px de alto. En anuncios: logo, titular corto y botón.
7. Las ventanas de editor son ilustración. Cuando haya capturas reales del producto, reemplaza el contenido, no el marco.
8. No estires la marca ni cambies sus colores. No agregues brillos ni sombras.

## Archivos

| Archivo | Medida | Uso |
|---|---|---|
| `avatar-1080x1080.png` | 1080 × 1080 | Foto de perfil (solo la marca) |
| `facebook-cover-1640x624.png` | 1640 × 624 | Portada de Facebook |
| `facebook-post-1200x630.png` | 1200 × 630 | Imagen para enlaces compartidos |
| `instagram-post-1080x1350.png` | 1080 × 1350 | Post de feed 4:5 |
| `instagram-square-1080x1080.png` | 1080 × 1080 | Mosaico de cuadrícula |
| `instagram-story-1080x1920.png` | 1080 × 1920 | Historia (zona segura de 250 px) |
| `highlight-1-1080x1080.png` | 1080 × 1080 | Destacado "Planes" |
| `highlight-2-1080x1080.png` | 1080 × 1080 | Destacado "Cómo funciona" |
| `brand-guide-1600x1200.png` | 1600 × 1200 | Lámina de guía de marca (8 secciones) |
| `social-preview-1500x1150.png` | 1500 × 1150 | Vista previa de Facebook e Instagram |
| `x-header-1500x500.png` | 1500 × 500 | Encabezado de X |
| `x-post-1200x675.png` | 1200 × 675 | Post de X |
| `linkedin-banner-1584x396.png` | 1584 × 396 | Banner de perfil personal de LinkedIn |
| `linkedin-company-1128x191.png` | 1128 × 191 | Portada de página de empresa de LinkedIn |
| `linkedin-post-1200x627.png` | 1200 × 627 | Post de LinkedIn |
| `youtube-channel-2560x1440.png` | 2560 × 1440 | Portada del canal de YouTube |
| `youtube-thumbnail-1280x720.png` | 1280 × 720 | Miniatura de YouTube |
| `pinterest-pin-1000x1500.png` | 1000 × 1500 | Pin de Pinterest (2:3) |
| `tiktok-cover-1080x1920.png` | 1080 × 1920 | Portada de TikTok |
| `ad-300x250` · `ad-336x280` · `ad-728x90` · `ad-300x600` · `ad-320x100` (`.png`) | según nombre | Anuncios de display de Google |
| `banners-overview-1600x1200.png` | 1600 × 1200 | Lámina con todos los banners |

Cada PNG tiene su fuente HTML con el mismo nombre (`.html`). Para regenerar un PNG:

```bash
node /tmp/claude-0/e2e/shot.mjs file://$PWD/<nombre>.html <nombre>.png <ancho> <alto>
```

## Pendiente

- Handle, dominio y precios sin definir (no aparecen o van entre [corchetes]). Faltan capturas reales del producto para las ventanas ilustradas.
- Las piezas usan Google Fonts; si se imprimen, convierte el texto a curvas.
