// Tokens de diseno de Clavonia: paleta de marca, escala neutra y radios.
export const colors = {
  ink: '#1F2430',
  paper: '#FAF7F2',
  sage: '#7C9A86',
  clay: '#C97B5A',
  mist: '#E9EEF0',
  neutral: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
} as const;

export const radius = {
  sm: '0.25rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  full: '9999px',
} as const;
