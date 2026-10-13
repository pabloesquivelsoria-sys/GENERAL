import { AppError } from "@clavonia/core";
import { NextResponse } from "next/server";
import type { ZodType, ZodTypeDef } from "zod";

// Traduce los códigos de error del dominio a estados HTTP.
// TODO: alinear con los códigos definidos en @clavonia/core.
const STATUS_BY_CODE: Record<string, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
};

export function jsonOk<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ data }, { status });
}

export function jsonError(error: AppError): NextResponse {
  const code = String(error.code);
  return NextResponse.json(
    { error: { code, message: error.message } },
    { status: STATUS_BY_CODE[code] ?? 500 },
  );
}

/**
 * Lee el cuerpo JSON de la petición y lo valida con el esquema indicado.
 * Devuelve los datos validados o un AppError; nunca lanza.
 */
export async function parseJson<T>(
  request: Request,
  schema: ZodType<T, ZodTypeDef, unknown>,
): Promise<T | AppError> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new AppError("VALIDATION_ERROR", "El cuerpo de la petición no es JSON válido.");
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    const message = result.error.issues.map((issue) => issue.message).join("; ");
    return new AppError("VALIDATION_ERROR", message || "Datos no válidos.");
  }
  return result.data;
}
