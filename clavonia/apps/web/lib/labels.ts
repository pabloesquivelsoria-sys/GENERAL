import type { Project, ProjectKind } from "@clavonia/core";

export const KIND_LABELS: Record<ProjectKind, string> = {
  landing: "Landing page",
  website: "Sitio web",
};

export const STATUS_LABELS: Record<Project["status"], string> = {
  draft: "Borrador",
  published: "Publicado",
};
