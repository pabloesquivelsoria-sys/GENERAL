import { describe, expect, it } from 'vitest';
import {
  AppError,
  blockSchema,
  brandThemeSchema,
  newId,
  pageDocumentSchema,
  projectInputSchema,
  slugify,
} from '../index';

describe('schemas', () => {
  it('accepts a valid page document', () => {
    const page = {
      id: 'page-1',
      slug: 'inicio',
      title: 'Inicio',
      blocks: [{ id: 'b1', type: 'hero', props: { headline: 'Hola' } }],
    };
    expect(pageDocumentSchema.safeParse(page).success).toBe(true);
  });

  it('rejects a block with an unknown type', () => {
    const result = blockSchema.safeParse({ id: 'b1', type: 'video', props: {} });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid hex color in the brand theme', () => {
    const brand = {
      primary: '#40273B',
      secondary: '#FFFFFF',
      background: '#FFFFFF',
      text: 'GGGGGG',
      headingFont: 'Inter',
      bodyFont: 'Inter',
    };
    expect(brandThemeSchema.safeParse(brand).success).toBe(false);
    expect(brandThemeSchema.safeParse({ ...brand, text: '#123456' }).success).toBe(true);
  });

  it('validates project input names between 1 and 80 characters', () => {
    expect(projectInputSchema.safeParse({ name: '', kind: 'landing' }).success).toBe(false);
    expect(projectInputSchema.safeParse({ name: 'a'.repeat(81), kind: 'landing' }).success).toBe(false);
    expect(projectInputSchema.safeParse({ name: 'Dulce', kind: 'website' }).success).toBe(true);
  });
});

describe('slugify', () => {
  it('removes accents and symbols', () => {
    expect(slugify('Café Dulce Methow!')).toBe('cafe-dulce-methow');
  });
});

describe('newId', () => {
  it('returns unique values', () => {
    const ids = new Set(Array.from({ length: 100 }, () => newId()));
    expect(ids.size).toBe(100);
  });
});

describe('AppError', () => {
  it('keeps its code and message', () => {
    const error = new AppError('NOT_FOUND', 'Proyecto no encontrado');
    expect(error).toBeInstanceOf(AppError);
    expect(error.code).toBe('NOT_FOUND');
    expect(error.message).toBe('Proyecto no encontrado');
  });
});
