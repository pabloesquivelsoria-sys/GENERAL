import { pageDocumentSchema } from '@clavonia/core';
import { describe, expect, it } from 'vitest';
import { getTemplate, listTemplates, templates } from '../index';

describe('template catalog', () => {
  it('builds pages that pass pageDocumentSchema', () => {
    for (const template of templates) {
      const pages = template.build();
      expect(pages.length).toBeGreaterThan(0);
      for (const page of pages) {
        expect(pageDocumentSchema.safeParse(page).success, `${template.id} / ${page.slug}`).toBe(true);
      }
    }
  });

  it('gives every block a unique id within a template build', () => {
    for (const template of templates) {
      const pages = template.build();
      const blockIds = pages.flatMap((page) => page.blocks.map((block) => block.id));
      expect(new Set(blockIds).size, template.id).toBe(blockIds.length);
    }
  });

  it('has unique template ids', () => {
    const ids = templates.map((template) => template.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('filters templates by kind', () => {
    const landings = listTemplates({ kind: 'landing' });
    const websites = listTemplates({ kind: 'website' });

    expect(landings.length).toBeGreaterThan(0);
    expect(websites.length).toBeGreaterThan(0);
    expect(landings.every((template) => template.kind === 'landing')).toBe(true);
    expect(websites.every((template) => template.kind === 'website')).toBe(true);
    expect(landings.length + websites.length).toBe(templates.length);
  });

  it('returns every template when no filter is given', () => {
    expect(listTemplates()).toHaveLength(templates.length);
  });

  it('finds a template by id', () => {
    expect(getTemplate('portafolio')?.kind).toBe('website');
    expect(getTemplate('no-existe')).toBeUndefined();
  });
});
