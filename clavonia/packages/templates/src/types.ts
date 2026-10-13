import type { PageDocument, ProjectKind } from '@clavonia/core';

/** A reusable starting point that creates the pages of a new project. */
export interface TemplateDefinition {
  id: string;
  name: string;
  kind: ProjectKind;
  category: string;
  description: string;
  /** Returns fresh pages with new ids on every call. */
  build(): PageDocument[];
}

/** Filters accepted by listTemplates. Omitted fields match everything. */
export interface TemplateFilter {
  kind?: ProjectKind;
  category?: string;
}
