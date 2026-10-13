import { landingProductoTemplate } from './catalog/landing-producto';
import { landingServiciosTemplate } from './catalog/landing-servicios';
import { portafolioTemplate } from './catalog/portafolio';
import { sitioNegocioLocalTemplate } from './catalog/sitio-negocio-local';
import type { TemplateDefinition, TemplateFilter } from './types';

export type { TemplateDefinition, TemplateFilter } from './types';
export {
  landingProductoTemplate,
  landingServiciosTemplate,
  portafolioTemplate,
  sitioNegocioLocalTemplate,
};

/** All templates in the catalog, in display order. */
export const templates: readonly TemplateDefinition[] = [
  landingServiciosTemplate,
  landingProductoTemplate,
  sitioNegocioLocalTemplate,
  portafolioTemplate,
];

/** Returns the template with the given id, or undefined when it does not exist. */
export function getTemplate(id: string): TemplateDefinition | undefined {
  return templates.find((template) => template.id === id);
}

/** Returns the templates matching every field set in the filter. */
export function listTemplates(filter: TemplateFilter = {}): TemplateDefinition[] {
  return templates.filter(
    (template) =>
      (filter.kind === undefined || template.kind === filter.kind) &&
      (filter.category === undefined || template.category === filter.category),
  );
}
