# @clavonia/ui

Primitivas de interfaz y preset de Tailwind de Clavonia.

## Contenido

- **Componentes**: `Button` (variantes `primary`, `secondary`, `ghost`; tamaños `sm`, `md`, `lg`), `Card`, `Input`, `Label`, `Badge`, `Container` y `Section`.
- **Utilidades**: `cn` para unir clases de Tailwind y descartar valores falsy.
- **Tokens**: `colors` (Ink, Paper, Sage, Clay, Mist y escala neutra) y `radius`.
- **Preset de Tailwind**: `@clavonia/ui/tailwind-preset` mapea los tokens a colores, radios y familias tipográficas (`font-heading` con serif, `font-body` con sans).

## Uso

```tsx
import { Button, Card, cn } from '@clavonia/ui';

export function Ejemplo() {
  return (
    <Card className={cn('max-w-sm', false && 'hidden')}>
      <Button variant="primary" size="lg">Empezar</Button>
    </Card>
  );
}
```

En `tailwind.config.ts` de la app:

```ts
import clavonia from '@clavonia/ui/tailwind-preset';

export default {
  presets: [clavonia],
  content: ['./src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
};
```

## Notas

- React y React DOM son peer dependencies (`^19`).
- Los componentes no usan `forwardRef`; reciben las props nativas del elemento HTML.
