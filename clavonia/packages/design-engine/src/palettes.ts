import type { BrandTheme } from '@clavonia/core';
import type { DesignTone } from './brief';

/** One brand theme preset per tone. Colors are hex values. */
const PALETTES: Record<DesignTone, BrandTheme> = {
  calido: {
    primary: '#B5562E',
    secondary: '#F2C29B',
    background: '#FFF8F1',
    text: '#3B2418',
    headingFont: 'Playfair Display',
    bodyFont: 'Inter',
  },
  sereno: {
    primary: '#3A7CA5',
    secondary: '#A9D6E5',
    background: '#F5FAFC',
    text: '#1F3A4A',
    headingFont: 'Lora',
    bodyFont: 'Source Sans 3',
  },
  sobrio: {
    primary: '#40273B',
    secondary: '#8C7A6B',
    background: '#FAF9F7',
    text: '#1E1A1D',
    headingFont: 'Cormorant Garamond',
    bodyFont: 'Inter',
  },
  vibrante: {
    primary: '#E63946',
    secondary: '#FFB703',
    background: '#FFFFFF',
    text: '#14101F',
    headingFont: 'Poppins',
    bodyFont: 'Inter',
  },
};

/** Returns a copy of the preset so callers can mutate it safely. */
export function paletteForTone(tone: DesignTone): BrandTheme {
  return { ...PALETTES[tone] };
}
