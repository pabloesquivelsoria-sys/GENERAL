import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { KIND_LABELS, STATUS_LABELS } from "../../../../lib/labels";
import { getProject } from "../../../../lib/projects";
import { getCurrentUserId } from "../../../../lib/session";

export const dynamic = "force-dynamic";

interface ProjectPageProps {
  params: Promise<{ projectId: string }>;
}

export const metadata: Metadata = {
  title: "Proyecto | Clavonia",
};

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = await params;
  const project = getProject(projectId, getCurrentUserId());
  if (!project) notFound();

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Link href="/projects" className="text-sm text-stone-500 hover:text-stone-900">
          ← Mis proyectos
        </Link>
        <h1 className="text-2xl font-semibold text-stone-900">{project.name}</h1>
        <p className="text-sm text-stone-600">
          {KIND_LABELS[project.kind]} · {STATUS_LABELS[project.status]}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/projects/${project.id}/editor`}
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
        >
          Abrir editor
        </Link>
        {/* TODO: acción de publicar cuando exista el flujo de publicación. */}
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-stone-900">Páginas</h2>
        <ul className="divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
          {project.pages.map((page) => (
            <li key={page.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
              <span className="font-medium text-stone-900">{page.title}</span>
              <span className="text-stone-500">/{page.slug}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
