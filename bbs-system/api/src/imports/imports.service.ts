import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { AuthUser } from '../common/auth-user';
import { withActor } from '../common/db';
import { CapaStatus, Priority } from '../common/enums';
import { BenchmarkMapping, loadMapping, norm } from './benchmark.mapping';
import { parseCsv } from './csv';
import { ImportBenchmarkDto } from './imports.dto';

const SOURCE = 'benchmark';
class DryRunRollback extends Error {}

interface RowIssue { row: number; external_id?: string; message: string }
export interface ImportResult {
  run_id: string | null; dry_run: boolean; total: number; inserted: number; updated: number; failed: number;
  errors: RowIssue[]; warnings: RowIssue[];
}

@Injectable()
export class ImportsService {
  private mapping: BenchmarkMapping = loadMapping();
  constructor(private ds: DataSource) {}

  // ---------- helpers de normalización ----------

  /** Devuelve el valor de la primera cabecera cuyo nombre normalizado coincide con algún alias del campo. */
  private pick(row: Record<string, unknown>, field: keyof BenchmarkMapping['aliases']): string {
    const idx = new Map(Object.keys(row).map((k) => [norm(k), k]));
    for (const a of this.mapping.aliases[field]) {
      const k = idx.get(norm(a));
      if (k !== undefined && String(row[k] ?? '').trim() !== '') return String(row[k]).trim();
    }
    return '';
  }

  /** ISO (yyyy-mm-dd), dd/mm/yyyy, dd-mm-yyyy o número serial de Excel -> 'yyyy-mm-dd' (o null). */
  static parseDate(v: string): string | null {
    if (!v) return null;
    let m = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return ImportsService.validDate(+m[1], +m[2], +m[3]);
    m = v.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
    if (m) return ImportsService.validDate(+m[3] < 100 ? 2000 + +m[3] : +m[3], +m[2], +m[1]);
    if (/^\d{5}(\.\d+)?$/.test(v)) {
      const d = new Date(Math.round((parseFloat(v) - 25569) * 86400000));
      return ImportsService.validDate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
    }
    return null;
  }
  private static validDate(y: number, mo: number, d: number): string | null {
    const dt = new Date(Date.UTC(y, mo - 1, d));
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
    return dt.toISOString().slice(0, 10);
  }

  // ---------- resolución de entidades (con caché por corrida) ----------

  private async resolveSite(m: EntityManager, name: string, cache: Map<string, string | null>): Promise<string | null> {
    const key = norm(name || process.env.BENCHMARK_DEFAULT_SITE || '');
    if (!key) return null;
    if (cache.has(key)) return cache.get(key)!;
    const [s] = await m.query(
      `SELECT id FROM sites WHERE is_active AND (lower(code) = $1 OR lower(name) = $1 OR regexp_replace(lower(name),'[^a-z0-9]+','_','g') = $2) LIMIT 1`,
      [(name || process.env.BENCHMARK_DEFAULT_SITE || '').toLowerCase(), key]);
    cache.set(key, s?.id ?? null);
    return s?.id ?? null;
  }

  private async resolveArea(m: EntityManager, siteId: string, name: string, cache: Map<string, string | null>): Promise<string | null> {
    if (!name) return null;
    const key = `${siteId}:${norm(name)}`;
    if (cache.has(key)) return cache.get(key)!;
    const [a] = await m.query(
      `SELECT id FROM areas WHERE site_id = $1 AND is_active AND (lower(code) = $2 OR lower(name) = $2) LIMIT 1`, [siteId, name.toLowerCase()]);
    cache.set(key, a?.id ?? null);
    return a?.id ?? null;
  }

  private async resolveOwner(m: EntityManager, who: string, cache: Map<string, string | null>): Promise<string | null> {
    const val = who || process.env.BENCHMARK_DEFAULT_OWNER_EMAIL || '';
    if (!val) return null;
    const key = val.toLowerCase();
    if (cache.has(key)) return cache.get(key)!;
    const [u] = await m.query(
      `SELECT id FROM users WHERE is_active AND (email = $1 OR lower(employee_code) = $2 OR lower(full_name) = $2) LIMIT 1`, [val, key]);
    cache.set(key, u?.id ?? null);
    return u?.id ?? null;
  }

  // ---------- importación ----------

  async importBenchmark(user: AuthUser, dto: ImportBenchmarkDto): Promise<ImportResult> {
    const rows = dto.rows ?? parseCsv(dto.csv ?? '');
    if (!rows.length) throw new BadRequestException('No hay filas para importar (revisa cabeceras y separador)');
    const dry = !!dto.dry_run;
    const errors: RowIssue[] = [], warnings: RowIssue[] = [];
    let inserted = 0, updated = 0;

    try {
      await withActor(this.ds, user.id, async (m) => {
        const siteCache = new Map<string, string | null>(), areaCache = new Map<string, string | null>(), ownerCache = new Map<string, string | null>();
        const seen = new Set<string>();

        for (let i = 0; i < rows.length; i++) {
          const n = i + 2; // fila en el archivo (1 = cabecera)
          const r = rows[i];
          const externalId = this.pick(r, 'external_id');
          const fail = (message: string) => errors.push({ row: n, external_id: externalId || undefined, message });
          const warn = (message: string) => warnings.push({ row: n, external_id: externalId || undefined, message });

          if (!externalId) { fail('Sin identificador (columna id/folio/número)'); continue; }
          if (seen.has(externalId)) { fail('Identificador duplicado en el archivo'); continue; }
          seen.add(externalId);

          const description = this.pick(r, 'description');
          const title = this.pick(r, 'title') || description.slice(0, 120);
          if (!title) { fail('Sin título ni descripción'); continue; }

          const statusRaw = this.pick(r, 'status');
          let status: CapaStatus = 'open';
          if (statusRaw) {
            const s = this.mapping.status[norm(statusRaw)];
            if (s) status = s; else warn(`Estatus desconocido "${statusRaw}"; se usó "open"`);
          }
          const prioRaw = this.pick(r, 'priority');
          let priority: Priority = 'medium';
          if (prioRaw) {
            const p = this.mapping.priority[norm(prioRaw)];
            if (p) priority = p; else warn(`Prioridad desconocida "${prioRaw}"; se usó "medium"`);
          }

          const createdAt = ImportsService.parseDate(this.pick(r, 'created_at'));
          let due = ImportsService.parseDate(this.pick(r, 'due_date'));
          if (!due) {
            const base = createdAt ? new Date(createdAt) : new Date();
            base.setUTCDate(base.getUTCDate() + Number(process.env.BENCHMARK_DEFAULT_DUE_DAYS ?? 30));
            due = base.toISOString().slice(0, 10);
            warn('Sin fecha compromiso válida; se asignó la predeterminada');
          }
          const closedAt = ImportsService.parseDate(this.pick(r, 'closed_at'));

          try {
            await m.transaction(async (s) => {
              const siteName = this.pick(r, 'site');
              const siteId = await this.resolveSite(s, siteName, siteCache);
              if (!siteId) throw new Error(`Sitio no encontrado ("${siteName}"); define BENCHMARK_DEFAULT_SITE o crea el sitio`);
              const ownerName = this.pick(r, 'owner');
              const ownerId = await this.resolveOwner(s, ownerName, ownerCache);
              if (!ownerId) throw new Error(`Responsable no encontrado ("${ownerName}"); usa su email/código o define BENCHMARK_DEFAULT_OWNER_EMAIL`);
              const areaName = this.pick(r, 'area');
              const areaId = await this.resolveArea(s, siteId, areaName, areaCache);
              if (areaName && !areaId) warn(`Área "${areaName}" no encontrada en el sitio; se dejó sin área`);
              const rootCause = this.pick(r, 'root_cause') || null;
              const closedTs = status === 'closed' ? (closedAt ?? new Date().toISOString().slice(0, 10)) : null;

              const [ex] = await s.query(`SELECT id, status FROM capas WHERE external_source = $1 AND external_id = $2 FOR UPDATE`, [SOURCE, externalId]);
              if (ex) {
                await s.query(
                  `UPDATE capas SET title=$2, description=$3, root_cause=COALESCE($4, root_cause), priority=$5::priority_level, status=$6::capa_status, owner_id=$7,
                          due_date=$8, area_id=COALESCE($9, area_id),
                          closed_at = CASE WHEN $6::capa_status = 'closed' THEN COALESCE(closed_at, $10::timestamptz) ELSE NULL END,
                          external_payload=$11::jsonb, external_synced_at=now()
                   WHERE id=$1`,
                  [ex.id, title, description || title, rootCause, priority, status, ownerId, due, areaId, closedTs, JSON.stringify(r)]);
                if (ex.status !== status) {
                  await s.query(`INSERT INTO capa_updates(capa_id, author_id, from_status, to_status, comment) VALUES ($1,$2,$3,$4,$5)`,
                    [ex.id, user.id, ex.status, status, 'Estatus sincronizado desde Benchmark']);
                }
                updated++;
              } else {
                const [c] = await s.query(
                  `INSERT INTO capas(site_id, area_id, title, description, type, source, root_cause, priority, status, owner_id, created_by,
                                     due_date, original_due_date, started_at, closed_at, created_at, external_source, external_id, external_payload, external_synced_at)
                   VALUES ($1,$2,$3,$4,'corrective','other',$5,$6::priority_level,$7::capa_status,$8,$9,$10,$10,
                           CASE WHEN $7::capa_status IN ('in_progress','verification','closed') THEN COALESCE($12::timestamptz, now()) END,
                           $11::timestamptz, COALESCE($12::timestamptz, now()), $13, $14, $15::jsonb, now())
                   RETURNING id`,
                  [siteId, areaId, title, description || title, rootCause, priority, status, ownerId, user.id, due, closedTs, createdAt, SOURCE, externalId, JSON.stringify(r)]);
                await s.query(`INSERT INTO capa_updates(capa_id, author_id, from_status, to_status, comment) VALUES ($1,$2,NULL,$3,$4)`,
                  [c.id, user.id, status, 'Importada desde Benchmark (tablero OK)']);
                inserted++;
              }
            });
          } catch (e: any) { fail(e?.message ?? String(e)); }
        }
        if (dry) throw new DryRunRollback();
      });
    } catch (e) {
      if (!(e instanceof DryRunRollback)) throw e;
    }

    const failed = errors.length;
    const [run] = await this.ds.query(
      `INSERT INTO import_runs(source, entity, actor_id, dry_run, total, inserted, updated, failed, errors, warnings)
       VALUES ($1,'capa',$2,$3,$4,$5,$6,$7,$8::jsonb,$9::jsonb) RETURNING id`,
      [SOURCE, user.id, dry, rows.length, inserted, updated, failed, JSON.stringify(errors), JSON.stringify(warnings)]);
    return { run_id: run.id, dry_run: dry, total: rows.length, inserted, updated, failed, errors, warnings };
  }

  runs(limit = 20) {
    return this.ds.query(
      `SELECT id, source, entity, dry_run, total, inserted, updated, failed, created_at FROM import_runs ORDER BY created_at DESC LIMIT $1`,
      [Math.min(limit, 100)]);
  }

  async run(id: string) {
    const [r] = await this.ds.query(`SELECT * FROM import_runs WHERE id = $1`, [id]);
    if (!r) throw new BadRequestException('Corrida no encontrada');
    return r;
  }
}
