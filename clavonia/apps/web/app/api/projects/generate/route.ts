import { AppError } from "@clavonia/core";
import { buildBrief, generateProjectInputSchema, StubDesignProvider } from "@clavonia/design-engine";
import type { NextResponse } from "next/server";
import { jsonError, jsonOk, parseJson } from "../../../../lib/api";
import { createProject } from "../../../../lib/projects";
import { getCurrentUserId } from "../../../../lib/session";

export const dynamic = "force-dynamic";

// Crea un proyecto con páginas generadas a partir del brief del wizard.
export async function POST(request: Request): Promise<NextResponse> {
  const input = await parseJson(request, generateProjectInputSchema);
  if (input instanceof AppError) return jsonError(input);

  const brief = buildBrief({ ...input, language: "es" });
  const result = await new StubDesignProvider().generate(brief);

  const project = createProject(
    { name: brief.businessName, kind: brief.kind, brand: result.brand, pages: result.pages },
    getCurrentUserId(),
  );
  return jsonOk(project, 201);
}
