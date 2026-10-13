import { PROJECT_KINDS, AppError } from "@clavonia/core";
import { buildBrief, DESIGN_LANGUAGES, DESIGN_TONES, StubDesignProvider } from "@clavonia/design-engine";
import type { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, jsonOk, parseJson } from "../../../../lib/api";
import { createProject } from "../../../../lib/projects";
import { getCurrentUserId } from "../../../../lib/session";

export const dynamic = "force-dynamic";

const generateInputSchema = z.object({
  businessName: z.string().trim().min(1, "El nombre del negocio es obligatorio.").max(80),
  sector: z.string().trim().max(80).default(""),
  goal: z.string().trim().max(80).default(""),
  kind: z.enum(PROJECT_KINDS),
  tone: z.enum(DESIGN_TONES),
  language: z.enum(DESIGN_LANGUAGES).default("es"),
});

// Crea un proyecto con páginas generadas a partir del brief del wizard.
export async function POST(request: Request): Promise<NextResponse> {
  const input = await parseJson(request, generateInputSchema);
  if (input instanceof AppError) return jsonError(input);

  const brief = buildBrief(input);
  const result = await new StubDesignProvider().generate(brief);

  const project = createProject(
    { name: brief.businessName, kind: brief.kind, brand: result.brand, pages: result.pages },
    getCurrentUserId(),
  );
  return jsonOk(project, 201);
}
