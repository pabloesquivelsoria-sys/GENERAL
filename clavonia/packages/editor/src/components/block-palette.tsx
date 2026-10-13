'use client';

import { BLOCK_TYPES, type BlockType } from '@clavonia/core';
import { BLOCK_LABELS } from '../labels';

export interface BlockPaletteProps {
  onAdd: (type: BlockType) => void;
}

/** Lista de tipos de bloque disponibles para añadir a la página. */
export function BlockPalette({ onAdd }: BlockPaletteProps) {
  return (
    <aside aria-label="Bloques disponibles" className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-neutral-700">Bloques</h2>
      <ul className="grid grid-cols-2 gap-2">
        {BLOCK_TYPES.map((type) => (
          <li key={type}>
            <button
              type="button"
              onClick={() => onAdd(type)}
              className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-left text-sm hover:bg-neutral-50"
            >
              {BLOCK_LABELS[type]}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
