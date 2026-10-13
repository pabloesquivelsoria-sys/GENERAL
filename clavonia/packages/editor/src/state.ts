import { newId, type Block, type BlockType, type PageDocument } from '@clavonia/core';

// Props por defecto de cada tipo de bloque. Son factorías para que cada bloque
// nuevo reciba objetos y arrays propios.
const DEFAULT_PROPS: Record<BlockType, () => Record<string, unknown>> = {
  hero: () => ({ title: 'Título principal', subtitle: 'Resume tu propuesta de valor en una frase.' }),
  about: () => ({ title: 'Sobre mí', body: 'Cuenta tu historia en unas líneas.' }),
  services: () => ({ title: 'Servicios', items: [] }),
  gallery: () => ({ title: 'Galería', images: [] }),
  testimonials: () => ({ title: 'Testimonios', items: [] }),
  pricing: () => ({ title: 'Precios', plans: [] }),
  contact: () => ({ title: 'Contacto', email: '', phone: '' }),
  cta: () => ({ title: '¿Listo para empezar?', buttonLabel: 'Comenzar' }),
  footer: () => ({ copyright: '' }),
  text: () => ({ body: 'Escribe tu texto aquí.' }),
  image: () => ({ src: '', alt: '' }),
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Crea un bloque nuevo con id único y props por defecto. */
export function createBlock(type: BlockType): Block {
  return { id: newId(), type, props: DEFAULT_PROPS[type]() };
}

/** Añade un bloque en `index` (por defecto al final). Devuelve un documento nuevo. */
export function addBlock(doc: PageDocument, type: BlockType, index?: number): PageDocument {
  const at = clamp(index ?? doc.blocks.length, 0, doc.blocks.length);
  const blocks = [...doc.blocks.slice(0, at), createBlock(type), ...doc.blocks.slice(at)];
  return { ...doc, blocks };
}

/** Elimina el bloque con `blockId`. Devuelve un documento nuevo. */
export function removeBlock(doc: PageDocument, blockId: string): PageDocument {
  return { ...doc, blocks: doc.blocks.filter((block) => block.id !== blockId) };
}

/**
 * Mueve un bloque a `toIndex`, que es su posición final en la lista resultante.
 * Si el id no existe, devuelve una copia sin cambios de orden.
 */
export function moveBlock(doc: PageDocument, blockId: string, toIndex: number): PageDocument {
  const blocks = [...doc.blocks];
  const from = blocks.findIndex((block) => block.id === blockId);
  if (from === -1) return { ...doc, blocks };

  const [moved] = blocks.splice(from, 1);
  if (!moved) return { ...doc, blocks };

  blocks.splice(clamp(toIndex, 0, blocks.length), 0, moved);
  return { ...doc, blocks };
}

/** Fusiona `patch` en las props del bloque `blockId`. Devuelve un documento nuevo. */
export function updateBlockProps(
  doc: PageDocument,
  blockId: string,
  patch: Record<string, unknown>,
): PageDocument {
  const blocks = doc.blocks.map((block) =>
    block.id === blockId ? { ...block, props: { ...block.props, ...patch } } : block,
  );
  return { ...doc, blocks };
}
