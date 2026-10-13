import { describe, it, expect } from 'vitest';
import { brandThemeSchema, pageDocumentSchema, PROJECT_KINDS } from '@clavonia/core';
import { buildBrief } from '../brief';
import { StubDesignProvider } from '../stub-provider';

describe('buildBrief', () => {
  it('normaliza el brief y deriva el slug del nombre del negocio', () => {
    const brief = buildBrief({
      businessName: '  Clavonia Studio  ',
      sector: ' Diseño ',
      goal: 'Captar clientes',
      kind: 'landing',
      tone: 'sereno',
      language: 'es',
    });

    expect(brief.businessName).toBe('Clavonia Studio');
    expect(brief.sector).toBe('Diseño');
    expect(brief.slug).toBe('clavonia-studio');
  });
});

describe('StubDesignProvider', () => {
  const provider = new StubDesignProvider();

  for (const kind of PROJECT_KINDS) {
    it(`genera páginas y marca válidas para ${kind}`, async () => {
      const brief = buildBrief({
        businessName: 'Panadería Luna',
        sector: 'Alimentos',
        goal: 'Pedidos en línea',
        kind,
        tone: 'calido',
        language: 'es',
      });

      const result = await provider.generate(brief);

      expect(result.pages.length).toBeGreaterThan(0);
      for (const page of result.pages) {
        expect(() => pageDocumentSchema.parse(page)).not.toThrow();
      }
      expect(() => brandThemeSchema.parse(result.brand)).not.toThrow();
    });
  }
});
