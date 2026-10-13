import type { BlockType, PageDocument } from '@clavonia/core';
import { addBlock, moveBlock, removeBlock, updateBlockProps } from './state';

export type EditorAction =
  | { type: 'addBlock'; blockType: BlockType; index?: number }
  | { type: 'removeBlock'; blockId: string }
  | { type: 'moveBlock'; blockId: string; toIndex: number }
  | { type: 'updateBlockProps'; blockId: string; patch: Record<string, unknown> };

function assertNever(value: never): never {
  throw new Error(`Acción no soportada: ${JSON.stringify(value)}`);
}

/** Reducer puro sobre PageDocument. Nunca muta el documento recibido. */
export function editorReducer(doc: PageDocument, action: EditorAction): PageDocument {
  switch (action.type) {
    case 'addBlock':
      return addBlock(doc, action.blockType, action.index);
    case 'removeBlock':
      return removeBlock(doc, action.blockId);
    case 'moveBlock':
      return moveBlock(doc, action.blockId, action.toIndex);
    case 'updateBlockProps':
      return updateBlockProps(doc, action.blockId, action.patch);
    default:
      return assertNever(action);
  }
}
