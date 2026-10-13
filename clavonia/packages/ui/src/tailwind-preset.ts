import type { Config } from 'tailwindcss';
import { colors, radius } from './tokens';

// Preset de Tailwind compartido por las apps de Clavonia.
// Mapea los tokens de marca a colores, radios y familias tipograficas.
const preset = {
  theme: {
    extend: {
      colors: {
        ink: colors.ink,
        paper: colors.paper,
        sage: colors.sage,
        clay: colors.clay,
        mist: colors.mist,
        neutral: colors.neutral,
      },
      fontFamily: {
        heading: ['Georgia', 'Cambria', '"Times New Roman"', 'serif'],
        body: ['ui-sans-serif', 'system-ui', 'Helvetica', 'Arial', 'sans-serif'],
      },
      borderRadius: radius,
    },
  },
} satisfies Config;

export default preset;
