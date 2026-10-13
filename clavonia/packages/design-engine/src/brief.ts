import { slugify } from '@clavonia/core';
import type { ProjectKind } from '@clavonia/core';

export const DESIGN_TONES = ['calido', 'sereno', 'sobrio', 'vibrante'] as const;
export type DesignTone = (typeof DESIGN_TONES)[number];

export const DESIGN_LANGUAGES = ['es', 'en'] as const;
export type DesignLanguage = (typeof DESIGN_LANGUAGES)[number];

/** Raw input captured from the user (wizard or form). */
export interface DesignBriefInput {
  businessName: string;
  sector: string;
  goal: string;
  kind: ProjectKind;
  tone: DesignTone;
  language: DesignLanguage;
}

/** Normalized input plus derived fields, ready for a design provider. */
export interface DesignBrief extends DesignBriefInput {
  slug: string;
}

const FALLBACK_SLUG = 'proyecto';

/** Trims the free-text fields and derives the slug from the business name. */
export function buildBrief(input: DesignBriefInput): DesignBrief {
  const businessName = input.businessName.trim();
  if (businessName.length === 0) {
    throw new Error('El nombre del negocio es obligatorio.');
  }

  return {
    businessName,
    sector: input.sector.trim(),
    goal: input.goal.trim(),
    kind: input.kind,
    tone: input.tone,
    language: input.language,
    slug: slugify(businessName) || FALLBACK_SLUG,
  };
}
