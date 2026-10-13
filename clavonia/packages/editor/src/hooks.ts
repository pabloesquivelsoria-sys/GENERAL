import { useReducer, type Dispatch } from 'react';
import type { PageDocument } from '@clavonia/core';
import { editorReducer, type EditorAction } from './actions';

export interface UseEditorResult {
  doc: PageDocument;
  dispatch: Dispatch<EditorAction>;
}

/** Estado del editor sobre un PageDocument, construido con useReducer. */
export function useEditor(initial: PageDocument): UseEditorResult {
  const [doc, dispatch] = useReducer(editorReducer, initial);
  return { doc, dispatch };
}
