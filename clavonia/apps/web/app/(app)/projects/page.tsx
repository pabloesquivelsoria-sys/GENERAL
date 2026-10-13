import type { Metadata } from "next";
import Link from "next/link";
import { ProjectCard } from "../../../components/project-card";
import { listProjects } from "../../../lib/projects";
import { getCurrentUserId } from "../../../lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mis proyectos | Clavonia",
};

export default function ProjectsPage() {
  const projects = listProjects(getCurrentUserId());

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-stone-900">Mis proyectos</h1>
        <Link
          href="/projects/new"
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
        >
          Nuevo proyecto
        </Link>
      </header>

      {projects.length === 0 ? (
        <div className="rounded-lg border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-600">
          Aún no hay proyectos.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
