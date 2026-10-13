import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// No importamos el cliente generado: puede no existir hasta ejecutar `prisma generate`.
const schema = readFileSync(resolve(process.cwd(), 'prisma', 'schema.prisma'), 'utf8');

describe('prisma/schema.prisma', () => {
  it('declara los modelos principales', () => {
    expect(schema).toContain('model Project');
    expect(schema).toContain('model Page');
    expect(schema).toContain('model User');
  });
});
