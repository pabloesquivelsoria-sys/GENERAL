import { describe, expect, it } from 'vitest';
import type { Block, PageDocument } from '@clavonia/core';
import { addBlock, moveBlock, removeBlock, updateBlockProps } from '../state';

const block = (id: string): Block => ({ id, type: 'text', props: { body: id } });

const makeDoc = (blocks: Block[]): PageDocument => ({
  id: 'page-1',
  slug: 'inicio',
  title: 'Inicio',
  blocks,
});

describe('addBlock', () => {
  it('no muta el documento original y añade al final por defecto', () => {
    const original = makeDoc([block('a'), block('b')]);
    const snapshot = structuredClone(original);

    const next = addBlock(original, 'hero');

    expect(original).toEqual(snapshot);
    expect(next).not.toBe(original);
    expect(next.blocks).toHaveLength(3);
    expect(next.blocks[2]?.type).toBe('hero');
    expect(next.blocks[2]?.id).not.toBe('');
  });

  it('inserta en el índice indicado', () => {
    const original = makeDoc([block('a'), block('b')]);

    const next = addBlock(original, 'image', 1);

    expect(next.blocks.map((b) => b.type)).toEqual(['text', 'image', 'text']);
    expect(next.blocks[0]).toBe(original.blocks[0]);
  });
});

describe('removeBlock', () => {
  it('no muta el documento original y elimina el bloque indicado', () => {
    const original = makeDoc([block('a'), block('b'), block('c')]);
    const snapshot = structuredClone(original);

    const next = removeBlock(original, 'b');

    expect(original).toEqual(snapshot);
    expect(next).not.toBe(original);
    expect(next.blocks.map((b) => b.id)).toEqual(['a', 'c']);
  });
});

describe('moveBlock', () => {
  it('mueve un bloque hacia adelante', () => {
    const original = makeDoc([block('a'), block('b'), block('c')]);

    const next = moveBlock(original, 'a', 2);

    expect(next.blocks.map((b) => b.id)).toEqual(['b', 'c', 'a']);
    expect(original.blocks.map((b) => b.id)).toEqual(['a', 'b', 'c']);
  });

  it('mueve un bloque hacia atrás', () => {
    const original = makeDoc([block('a'), block('b'), block('c')]);

    const next = moveBlock(original, 'c', 0);

    expect(next.blocks.map((b) => b.id)).toEqual(['c', 'a', 'b']);
  });
});

describe('updateBlockProps', () => {
  it('fusiona el patch sin mutar el bloque original', () => {
    const original = makeDoc([block('a')]);

    const next = updateBlockProps(original, 'a', { body: 'nuevo' });

    expect(next.blocks[0]?.props).toEqual({ body: 'nuevo' });
    expect(original.blocks[0]?.props).toEqual({ body: 'a' });
  });
});
