# @clavonia/editor

Núcleo del editor de bloques de Clavonia.

## Contenido

- `state.ts`: funciones puras e inmutables sobre `PageDocument` (`addBlock`, `removeBlock`, `moveBlock`, `updateBlockProps`).
- `actions.ts`: unión `EditorAction` y `editorReducer`.
- `hooks.ts`: `useEditor(initial)` basado en `useReducer`, devuelve `{ doc, dispatch }`.
- `components/`: `BlockPalette`, `BlockRenderer` (placeholders por tipo) y `EditorCanvas` (con bloque seleccionado).

## Uso

```tsx
const { doc, dispatch } = useEditor(page);

<BlockPalette onAdd={(type) => dispatch({ type: 'addBlock', blockType: type })} />
<EditorCanvas doc={doc} />
```

## Dependencias

- `@clavonia/core` (tipos y `newId`).
- `@clavonia/ui` (`Section`, `Container`, `Card`, `Button`).
- Peer: `react` y `react-dom` ^19.
