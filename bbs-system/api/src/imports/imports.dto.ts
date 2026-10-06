import { ArrayMaxSize, IsArray, IsBoolean, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';

export class ImportBenchmarkDto {
  /** Filas ya en JSON (clave = cabecera de la exportación de Benchmark). */
  @ValidateIf((o) => !o.csv) @IsArray() @ArrayMaxSize(5000)
  rows?: Record<string, unknown>[];

  /** Alternativa: contenido CSV de la exportación (separador , o ; autodetectado). */
  @ValidateIf((o) => !o.rows) @IsString() @MaxLength(10_000_000)
  csv?: string;

  /** true = valida y reporta sin escribir en la base. */
  @IsOptional() @IsBoolean()
  dry_run?: boolean;
}
