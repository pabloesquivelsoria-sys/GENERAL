import type { NextResponse } from "next/server";
import { jsonOk } from "../../../lib/api";
import { listTemplates } from "../../../lib/templates";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  return jsonOk(listTemplates());
}
