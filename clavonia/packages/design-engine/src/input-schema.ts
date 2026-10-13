import { PROJECT_KINDS } from '@clavonia/core';
import { z } from 'zod';
import { DESIGN_TONES } from './brief';

export { DESIGN_TONES };
export type { DesignTone } from './brief';

export const DESIGN_GOALS = ['contacts', 'sales', 'brand'] as const;
export type DesignGoal = (typeof DESIGN_GOALS)[number];

/** Reglas del wizard de nuevo proyecto; el cliente y la API usan este mismo esquema. */
export const generateProjectInputSchema = z.object({
  kind: z.enum(PROJECT_KINDS, { errorMap: () => ({ message: 'Elige un tipo de proyecto.' }) }),
  businessName: z
    .string()
    .trim()
    .min(1, 'Escribe el nombre de tu negocio.')
    .max(80, 'El nombre no puede tener más de 80 caracteres.'),
  sector: z.string().trim().max(80, 'El sector no puede tener más de 80 caracteres.'),
  goal: z.enum(DESIGN_GOALS, { errorMap: () => ({ message: 'Elige un objetivo.' }) }),
  tone: z.enum(DESIGN_TONES, { errorMap: () => ({ message: 'Elige un tono.' }) }),
});

export type GenerateProjectInput = z.infer<typeof generateProjectInputSchema>;

/** Campos que se validan al avanzar de cada paso del wizard. */
export const WIZARD_STEP_FIELDS: readonly (readonly (keyof GenerateProjectInput)[])[] = [
  ['kind', 'businessName'],
  ['sector', 'goal'],
  ['tone'],
];
