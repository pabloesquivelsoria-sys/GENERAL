import {
  newId,
  slugify,
  type BrandTheme,
  type PageDocument,
  type Project,
  type ProjectKind,
} from "@clavonia/core";

export const DEFAULT_BRAND: BrandTheme = {
  primary: "#40273B",
  secondary: "#F4EDE8",
  background: "#FFFFFF",
  text: "#1F1A1E",
  headingFont: "Inter",
  bodyFont: "Inter",
};

export interface CreateProjectInput {
  name: string;
  kind: ProjectKind;
  brand?: Partial<BrandTheme>;
  pages?: PageDocument[];
}

export interface UpdateProjectInput {
  name?: string;
  kind?: ProjectKind;
  brand?: Partial<BrandTheme>;
}

// TODO: sustituir todo este almacenamiento por el cliente Prisma de @clavonia/db
// (prisma.project.findMany / create / update / delete). Esto es un stub en memoria
// que vive en globalThis para compartir estado entre páginas y route handlers en dev.
const globalStore = globalThis as unknown as {
  __clavoniaProjects?: Map<string, Project>;
};

function projectsMap(): Map<string, Project> {
  if (!globalStore.__clavoniaProjects) {
    globalStore.__clavoniaProjects = new Map<string, Project>();
  }
  return globalStore.__clavoniaProjects;
}

function createEmptyPage(title: string): PageDocument {
  return {
    id: newId(),
    slug: slugify(title) || "inicio",
    title,
    blocks: [],
  };
}

export function listProjects(ownerId: string): Project[] {
  return Array.from(projectsMap().values())
    .filter((project) => project.ownerId === ownerId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getProject(projectId: string, ownerId: string): Project | undefined {
  const project = projectsMap().get(projectId);
  return project && project.ownerId === ownerId ? project : undefined;
}

export function createProject(input: CreateProjectInput, ownerId: string): Project {
  const now = new Date().toISOString();
  const project: Project = {
    id: newId(),
    name: input.name,
    kind: input.kind,
    ownerId,
    brand: { ...DEFAULT_BRAND, ...input.brand },
    pages: input.pages?.length ? input.pages : [createEmptyPage("Inicio")],
    status: "draft",
    createdAt: now,
    updatedAt: now,
  };
  projectsMap().set(project.id, project);
  return project;
}

export function updateProject(
  projectId: string,
  ownerId: string,
  patch: UpdateProjectInput,
): Project | undefined {
  const current = getProject(projectId, ownerId);
  if (!current) return undefined;

  const updated: Project = {
    ...current,
    name: patch.name ?? current.name,
    kind: patch.kind ?? current.kind,
    brand: { ...current.brand, ...patch.brand },
    updatedAt: new Date().toISOString(),
  };
  projectsMap().set(updated.id, updated);
  return updated;
}

export function deleteProject(projectId: string, ownerId: string): boolean {
  if (!getProject(projectId, ownerId)) return false;
  return projectsMap().delete(projectId);
}

/** Busca una página publicada por slug. Usado por la ruta pública /p/[slug]. */
export function findPublishedPage(
  slug: string,
): { project: Project; page: PageDocument } | undefined {
  for (const project of Array.from(projectsMap().values())) {
    if (project.status !== "published") continue;
    const page = project.pages.find((candidate) => candidate.slug === slug);
    if (page) return { project, page };
  }
  return undefined;
}
