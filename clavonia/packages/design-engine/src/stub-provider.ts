import { listTemplates } from '@clavonia/templates';
import type { DesignBrief } from './brief';
import { paletteForTone } from './palettes';
import type { DesignProvider, GenerationResult } from './provider';

/**
 * Deterministic provider without AI calls.
 * Picks the catalog templates for the project kind and builds their pages.
 */
export class StubDesignProvider implements DesignProvider {
  readonly name = 'stub';

  async generate(brief: DesignBrief): Promise<GenerationResult> {
    // TODO: the AI provider will choose templates and fill copy from the brief.
    const templates = listTemplates({ kind: brief.kind });
    const pages = templates.flatMap((template) => template.build());

    if (pages.length === 0) {
      throw new Error(`No hay plantillas disponibles para el tipo "${brief.kind}".`);
    }

    return {
      brand: paletteForTone(brief.tone),
      pages,
    };
  }
}
