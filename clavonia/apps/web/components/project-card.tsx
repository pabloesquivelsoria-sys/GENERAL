import Link from "next/link";
import type { Project } from "@clavonia/core";
import { KIND_LABELS, STATUS_LABELS } from "../lib/labels";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const pageCount = project.pages.length;
  const pagesLabel = `${pageCount} ${pageCount === 1 ? "página" : "páginas"}`;

  return (
    <Link
      href={`/projects/${project.id}`}
      className="block rounded-lg border border-stone-200 bg-white p-5 hover:border-stone-300 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="truncate font-medium text-stone-900">{project.name}</h3>
        <span className="shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
          {STATUS_LABELS[project.status]}
        </span>
      </div>
      <p className="mt-2 text-sm text-stone-500">
        {KIND_LABELS[project.kind]} · {pagesLabel}
      </p>
      <p className="mt-1 text-xs text-stone-400">
        Actualizado el {new Date(project.updatedAt).toLocaleDateString("es")}
      </p>
    </Link>
  );
}
