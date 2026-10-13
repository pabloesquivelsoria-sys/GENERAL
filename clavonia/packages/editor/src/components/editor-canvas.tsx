'use client';

import { useState } from 'react';
import type { BrandTheme, PageDocument } from '@clavonia/core';
import { BlockRenderer } from './block-renderer';

export interface EditorCanvasProps {
  doc: PageDocument;
  brand?: BrandTheme;
  onSelectionChange?: (blockId: string | null) => void;
}

/** Lienzo que muestra los bloques de la página y mantiene el bloque seleccionado. */
export function EditorCanvas({ doc, brand, onSelectionChange }: EditorCanvasProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const select = (blockId: string | null) => {
    setSelectedId(blockId);
    onSelectionChange?.(blockId);
  };

  if (doc.blocks.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-neutral-300 p-10 text-center text-neutral-500">
        Aún no hay bloques. Añade uno desde la paleta.
      </p>
    );
  }

  return (
    <ul aria-label="Bloques de la página" className="flex flex-col gap-2">
      {doc.blocks.map((block) => {
        const isSelected = block.id === selectedId;
        return (
          <li key={block.id}>
            <div
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              data-selected={isSelected}
              onClick={() => select(block.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  select(block.id);
                }
              }}
              className={
                isSelected
                  ? 'cursor-pointer rounded-md outline outline-2 outline-offset-2 outline-blue-500'
                  : 'cursor-pointer rounded-md outline-none hover:outline hover:outline-1 hover:outline-neutral-300'
              }
            >
              <BlockRenderer block={block} brand={brand} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
