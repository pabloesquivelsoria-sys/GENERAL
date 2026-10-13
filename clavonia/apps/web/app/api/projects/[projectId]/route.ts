import { AppError, projectInputSchema } from "@clavonia/core";
import type { NextResponse } from "next/server";
import { jsonError, jsonOk, parseJson } from "../../../../lib/api";
import { deleteProject, getProject, updateProject } from "../../../../lib/projects";
import { getCurrentUserId } from "../../../../lib/session";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ projectId: string }>;
}

const notFound = () => jsonError(new AppError("NOT_FOUND", "Proyecto no encontrado."));

export async function GET(_request: Request, context: RouteContext): Promise<NextResponse> {
  const { projectId } = await context.params;
  const project = getProject(projectId, getCurrentUserId());
  if (!project) return notFound();
  return jsonOk(project);
}

export async function PATCH(request: Request, context: RouteContext): Promise<NextResponse> {
  const { projectId } = await context.params;
  const patch = await parseJson(request, projectInputSchema.partial());
  if (patch instanceof AppError) return jsonError(patch);

  const project = updateProject(projectId, getCurrentUserId(), patch);
  if (!project) return notFound();
  return jsonOk(project);
}

export async function DELETE(_request: Request, context: RouteContext): Promise<NextResponse> {
  const { projectId } = await context.params;
  if (!deleteProject(projectId, getCurrentUserId())) return notFound();
  return jsonOk({ id: projectId, deleted: true });
}
