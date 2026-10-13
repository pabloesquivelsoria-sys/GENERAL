import { newId, type Block, type BlockType, type PageDocument } from '@clavonia/core';

/** Creates a block with a fresh id. */
export function createBlock(type: BlockType, props: Record<string, unknown>): Block {
  return { id: newId(), type, props };
}

/** Creates a page with a fresh id. */
export function createPage(slug: string, title: string, blocks: Block[]): PageDocument {
  return { id: newId(), slug, title, blocks };
}
