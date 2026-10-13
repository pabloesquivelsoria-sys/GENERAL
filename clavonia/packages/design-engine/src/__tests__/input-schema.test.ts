import { describe, expect, it } from 'vitest';
import { generateProjectInputSchema, WIZARD_STEP_FIELDS } from '../input-schema';

const valid = { kind: 'landing', businessName: '  Dulce Methow  ', sector: 'Panadería', goal: 'sales', tone: 'calido' };

describe('generateProjectInputSchema', () => {
  it('acepta un brief válido y recorta el nombre', () => {
    const result = generateProjectInputSchema.parse(valid);
    expect(result.businessName).toBe('Dulce Methow');
  });

  it('pide el nombre del negocio', () => {
    const result = generateProjectInputSchema.safeParse({ ...valid, businessName: '   ' });
    expect(result.success).toBe(false);
    expect(result.success ? '' : result.error.issues[0]?.message).toBe('Escribe el nombre de tu negocio.');
  });

  it('rechaza tipos, objetivos y tonos fuera de la lista', () => {
    expect(generateProjectInputSchema.safeParse({ ...valid, kind: 'blog' }).success).toBe(false);
    expect(generateProjectInputSchema.safeParse({ ...valid, goal: 'otro' }).success).toBe(false);
    expect(generateProjectInputSchema.safeParse({ ...valid, tone: 'neon' }).success).toBe(false);
  });

  it('cada campo pertenece a exactamente un paso del wizard', () => {
    const fields = WIZARD_STEP_FIELDS.flat();
    expect(new Set(fields).size).toBe(fields.length);
    expect(fields.sort()).toEqual(Object.keys(valid).sort());
  });
});
