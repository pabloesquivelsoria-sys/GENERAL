import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// No importamos el cliente generado: puede no existir hasta ejecutar `prisma generate`.
const schema = readFileSync(fileURLToPath(new URL('../../prisma/schema.prisma', import.meta.url)), 'utf8');

describe('prisma/schema.prisma', () => {
  it('declara los modelos principales', () => {
    expect(schema).toContain('model Project');
    expect(schema).toContain('model Page');
    expect(schema).toContain('model User');
  });
});
