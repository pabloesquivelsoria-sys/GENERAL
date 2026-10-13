import { BlockEditor } from "@clavonia/editor";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProject } from "../../../../../lib/projects";
import { getCurrentUserId } from "../../../../../lib/session";

export const dynamic = "force-dynamic";

interface EditorPageProps {
  params: Promise<{ projectId: string }>;
}

export const metadata: Metadata = {
  title: "Editor | Clavonia",
};

export default async function EditorPage({ params }: EditorPageProps) {
  const { projectId } = await params;
  const project = getProject(projectId, getCurrentUserId());
  if (!project) notFound();

  // TODO: permitir elegir la página cuando un proyecto tenga varias.
  const page = project.pages[0];
  if (!page) notFound();

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold text-stone-900">{project.name}</h1>
        <p className="text-sm text-stone-500">Editando: {page.title}</p>
      </header>
      <BlockEditor page={page} />
    </div>
  );
}
