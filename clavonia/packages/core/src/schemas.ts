import { z } from 'zod';
import { BLOCK_TYPES, PROJECT_KINDS } from './types';

const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a 6-digit hex value such as #40273B');

export const blockSchema = z.object({
  id: z.string().min(1),
  type: z.enum(BLOCK_TYPES),
  props: z.record(z.string(), z.unknown()),
});

export const brandThemeSchema = z.object({
  primary: hexColorSchema,
  secondary: hexColorSchema,
  background: hexColorSchema,
  text: hexColorSchema,
  headingFont: z.string().min(1),
  bodyFont: z.string().min(1),
});

export const pageDocumentSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  blocks: z.array(blockSchema),
});

export const projectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(80),
  kind: z.enum(PROJECT_KINDS),
  ownerId: z.string().min(1),
  brand: brandThemeSchema,
  pages: z.array(pageDocumentSchema),
  status: z.enum(['draft', 'published']),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

export const projectInputSchema = z.object({
  name: z.string().min(1).max(80),
  kind: z.enum(PROJECT_KINDS),
  brand: brandThemeSchema.optional(),
});

export type BlockInput = z.infer<typeof blockSchema>;
export type BrandThemeInput = z.infer<typeof brandThemeSchema>;
export type PageDocumentInput = z.infer<typeof pageDocumentSchema>;
export type ProjectRecord = z.infer<typeof projectSchema>;
export type ProjectInput = z.infer<typeof projectInputSchema>;
