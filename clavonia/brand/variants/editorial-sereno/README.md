# Clavonia · Variante "Editorial sereno"

## Concepto

Una página de revista tranquila: titular grande en serif, mucho blanco, filetes finos, composición asimétrica y un solo acento azul. El acento es el cursor, la marca de "dónde se escribe la página". El tono es premium y calmado, sin ruido visual.

## Paleta

| Nombre | Hex | Uso | Contraste sobre Papel |
|---|---|---|---|
| Tinta | `#111111` | Titulares, marca, filetes | 16.9:1 |
| Papel | `#F4F2EE` | Fondo principal | - |
| Azul | `#2F4B7C` | Acento: cursor, puntos, botón; fondo del destacado "Planes" | 7.8:1 |
| Grafito | `#5F6670` | Texto secundario | 5.2:1 |
| Trazo suave | `#D9D5CC` | Bloques de maqueta (solo gráfico, no texto) | - |

Nota: el gris propuesto `#8A8F98` da 2.9:1 sobre Papel, por debajo de 4.5:1 para texto pequeño. Por eso el texto secundario usa `#5F6670`.

## Tipografía

- **Titulares:** Fraunces (Google Fonts), peso 400. Marca: Fraunces 500.
- **Texto:** Manrope (Google Fonts), pesos 500 a 700.
- Sin cursivas: ninguna palabra necesita énfasis de significado.

## Marca

- C de trazo fino (1.8 unidades sobre 64) con una sola barra de cursor azul dentro de la abertura.
- Nombre en minúsculas: `clavonia`, en Fraunces 500.
- Espacio libre mínimo: un décimo del ancho del logo.
- Archivo de referencia: la marca está en línea dentro de cada HTML (no hay SVG separado).

## Reglas de uso

- Fondo Papel por defecto. El azul solo como fondo en el destacado "Planes".
- Un solo acento por pieza: el cursor azul (o los puntos azules de "Elige. Edita. Publica.").
- Filetes de 1.5 px en Tinta, máximo tres por pieza.
- Sin degradados, sin sombras, sin cursivas, sin efectos.
- Texto siempre en Tinta o Grafito; el azul solo para titulares grandes o acentos.
- Margen mínimo de 80 px en formatos cuadrados; 88 px en 4:5 y story.
- Story: todo el texto entre 250 px del borde superior y 250 px del inferior.
- Portada de Facebook: el contenido va en el centro (x 410 a 1230), donde el móvil recorta menos.
- No se agregan handle, dominio ni precios. Si después se definen, se añaden como texto nuevo sin cambiar la composición.

## Textos oficiales

- Titular: "Tu página, lista en minutos."
- Subtítulo: "Elige una plantilla, edita por bloques y publica cuando quieras."
- Verbos: "Elige. Edita. Publica."
- Destacados: "Planes", "Cómo funciona".

## Archivos

| Archivo (HTML + PNG) | Medida | Uso |
|---|---|---|
| `avatar-1080x1080` | 1080 × 1080 | Foto de perfil (se recorta en círculo) |
| `facebook-cover-1640x624` | 1640 × 624 | Portada de Facebook |
| `facebook-post-1200x630` | 1200 × 630 | Imagen de enlace compartido |
| `instagram-post-1080x1350` | 1080 × 1350 | Post de feed, formato 4:5 |
| `instagram-square-1080x1080` | 1080 × 1080 | Mosaico de cuadrícula |
| `instagram-story-1080x1920` | 1080 × 1920 | Story, texto dentro de la zona segura de 250 px |
| `highlight-1-1080x1080` | 1080 × 1080 | Destacado "Planes" (fondo azul) |
| `highlight-2-1080x1080` | 1080 × 1080 | Destacado "Cómo funciona" (fondo Papel) |
| `brand-guide-1600x1200` | 1600 × 1200 | Lámina de guía de marca (8 secciones) |
| `social-preview-1500x1150` | 1500 × 1150 | Vista previa de Facebook e Instagram (usa los PNG anteriores) |

Cada HTML es autocontenido (fuentes desde Google Fonts, sin imágenes externas) y tiene un contenedor de tamaño fijo. Para regenerar un PNG, abre el HTML con una captura a la misma medida (viewport igual al tamaño, escala 1).
