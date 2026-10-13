import type { Metadata } from "next";
import Link from "next/link";
import { listTemplates } from "../../../lib/templates";

export const metadata: Metadata = {
  title: "Plantillas | Clavonia",
};

export default function TemplatesPage() {
  const templates = listTemplates();

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-stone-900">Plantillas</h1>
        <p className="text-sm text-stone-600">Elige un punto de partida para tu página.</p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => (
          <li
            key={template.id}
            className="flex flex-col justify-between rounded-lg border border-stone-200 bg-white p-5"
          >
            <h2 className="font-medium text-stone-900">{template.name}</h2>
            {/* TODO: pasar la plantilla elegida al asistente de nuevo proyecto. */}
            <Link
              href="/projects/new"
              className="mt-6 self-start text-sm font-medium text-stone-900 underline"
            >
              Usar plantilla
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
