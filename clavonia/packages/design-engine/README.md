# @clavonia/design-engine

Convierte un brief de negocio en una marca (`BrandTheme`) y un conjunto de páginas (`PageDocument[]`).

## Piezas

- `buildBrief(input)`: normaliza el brief y deriva el `slug` del nombre del negocio.
- `paletteForTone(tone)`: paleta predefinida para cada tono (`calido`, `sereno`, `sobrio`, `vibrante`).
- `DesignProvider`: interfaz que implementa cualquier proveedor de diseño.
- `StubDesignProvider`: proveedor actual, sin llamadas a IA. Elige plantillas de `@clavonia/templates` y las construye.

## Proveedor de IA

El proveedor de IA real implementará la misma interfaz `DesignProvider` más adelante, así que el resto de la aplicación no tendrá que cambiar al sustituir el stub.
