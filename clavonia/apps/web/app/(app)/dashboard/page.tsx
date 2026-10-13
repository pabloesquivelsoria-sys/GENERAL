import type { Metadata } from "next";
import Link from "next/link";
import { ProjectCard } from "../../../components/project-card";
import { listProjects } from "../../../lib/projects";
import { getCurrentUserId } from "../../../lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Inicio | Clavonia",
};

export default function DashboardPage() {
  const projects = listProjects(getCurrentUserId());
  const recent = projects.slice(0, 6);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Inicio</h1>
          <p className="text-sm text-stone-600">Retoma tus páginas o crea una nueva.</p>
        </div>
        <Link
          href="/projects/new"
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
        >
          Nuevo proyecto
        </Link>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-stone-900">Proyectos recientes</h2>
        {recent.length === 0 ? (
          <div className="rounded-lg border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-600">
            Todavía no tienes proyectos. Crea el primero desde una plantilla o describe tu negocio.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {recent.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
