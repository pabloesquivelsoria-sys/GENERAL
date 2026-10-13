import type { BrandTheme, PageDocument } from '@clavonia/core';
import type { DesignBrief } from './brief';

/** Output of a design provider: a brand theme and the generated pages. */
export interface GenerationResult {
  brand: BrandTheme;
  pages: PageDocument[];
}

/**
 * Contract every design provider implements.
 * The stub provider is used today; the real AI provider will implement
 * this same interface later.
 */
export interface DesignProvider {
  readonly name: string;
  generate(brief: DesignBrief): Promise<GenerationResult>;
}
