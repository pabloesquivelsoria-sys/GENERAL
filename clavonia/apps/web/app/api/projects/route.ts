import { AppError, projectInputSchema } from "@clavonia/core";
import type { NextResponse } from "next/server";
import { jsonError, jsonOk, parseJson } from "../../../lib/api";
import { createProject, listProjects } from "../../../lib/projects";
import { getCurrentUserId } from "../../../lib/session";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  return jsonOk(listProjects(getCurrentUserId()));
}

export async function POST(request: Request): Promise<NextResponse> {
  const input = await parseJson(request, projectInputSchema);
  if (input instanceof AppError) return jsonError(input);

  const project = createProject(input, getCurrentUserId());
  return jsonOk(project, 201);
}
