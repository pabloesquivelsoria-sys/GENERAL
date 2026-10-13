import { describe, expect, it } from 'vitest';
import { cn } from '../cn';
import preset from '../tailwind-preset';

describe('cn', () => {
  it('une clases y descarta valores falsy', () => {
    expect(cn('a', false, null, undefined, '', 'b')).toBe('a b');
  });
});

describe('tailwind preset', () => {
  it('expone la clave colors en theme.extend', () => {
    expect(preset.theme.extend).toHaveProperty('colors');
  });
});
