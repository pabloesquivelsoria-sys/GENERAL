import { listTemplates } from '@clavonia/templates';
import type { DesignBrief } from './brief';
import { paletteForTone } from './palettes';
import type { DesignProvider, GenerationResult } from './provider';

// Plantilla preferida por tipo y objetivo. Si no hay coincidencia se usa la primera del tipo.
const PREFERRED_TEMPLATE: Record<string, string> = {
  'landing:sales': 'landing-producto',
  'landing:contacts': 'landing-servicios',
  'website:contacts': 'sitio-negocio-local',
};

function pickTemplate(brief: DesignBrief) {
  const candidates = listTemplates({ kind: brief.kind });
  const preferredId = PREFERRED_TEMPLATE[`${brief.kind}:${brief.goal}`];
  return candidates.find((template) => template.id === preferredId) ?? candidates[0];
}

/**
 * Deterministic provider without AI calls.
 * Picks the catalog templates for the project kind and builds their pages.
 */
export class StubDesignProvider implements DesignProvider {
  readonly name = 'stub';

  async generate(brief: DesignBrief): Promise<GenerationResult> {
    // TODO: the AI provider will choose templates and fill copy from the brief.
    const template = pickTemplate(brief);
    if (!template) {
      throw new Error(`No hay plantillas disponibles para el tipo "${brief.kind}".`);
    }
    const pages = template.build();

    return {
      brand: paletteForTone(brief.tone),
      pages,
    };
  }
}
