import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import { RedisService } from '../database/redis.service';
import { KpiQuery, SnapshotQuery, TopBehaviorsQuery, TrendQuery } from './kpi.dto';

const CACHE_TTL_S = 60;

@Injectable()
export class KpiService {
  private readonly log = new Logger('Kpi');

  constructor(private ds: DataSource, private redis: RedisService, private cfg: ConfigService) {}

  private range(q: KpiQuery): { site: string | null; from: Date; to: Date } {
    const to = q.to ? new Date(q.to) : new Date();
    const from = q.from ? new Date(q.from) : new Date(to.getTime() - 30 * 86400_000);
    if (from >= to) throw new BadRequestException('from debe ser anterior a to');
    return { site: q.site_id ?? null, from, to };
  }

  /** Caché corta en Redis; los cálculos reales viven en SQL (fn_kpi_summary, vistas). */
  private async cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const hit = await this.redis.getJson<T>(`kpi:${key}`);
    if (hit) return hit;
    const val = await fn();
    await this.redis.setJson(`kpi:${key}`, val, CACHE_TTL_S);
    return val;
  }

  summary(q: KpiQuery) {
    const r = this.range(q);
    // clave sin milisegundos de "ahora" para que la caché sea útil
    const key = `summary:${r.site}:${r.from.toISOString().slice(0, 13)}:${r.to.toISOString().slice(0, 13)}`;
    return this.cached(key, async () => {
      const [row] = await this.ds.query(`SELECT * FROM fn_kpi_summary($1, $2, $3)`, [r.site, r.from, r.to]);
      return { site_id: r.site, from: r.from, to: r.to, ...row };
    });
  }

  topAtRisk(q: TopBehaviorsQuery) {
    const r = this.range(q);
    return this.cached(`top:${r.site}:${q.limit}:${r.from.toISOString().slice(0, 13)}:${r.to.toISOString().slice(0, 13)}`, () =>
      this.ds.query(`SELECT * FROM fn_top_at_risk_behaviors($1, $2, $3, $4)`, [r.site, r.from, r.to, q.limit]));
  }

  /** Tendencia de la tasa de comportamiento seguro por día/semana/mes (usa v_safe_behavior_daily). */
  safeRateTrend(q: TrendQuery) {
    const r = this.range(q);
    return this.cached(`trend:${r.site}:${q.bucket}:${r.from.toISOString().slice(0, 13)}:${r.to.toISOString().slice(0, 13)}`, () =>
      this.ds.query(
        `SELECT date_trunc($4, day::timestamp)::date AS period,
                sum(safe_count)::int AS safe_count, sum(at_risk_count)::int AS at_risk_count,
                round(100.0 * sum(safe_count) / NULLIF(sum(evaluated_count), 0), 2) AS safe_rate_pct
           FROM v_safe_behavior_daily
          WHERE ($1::uuid IS NULL OR site_id = $1) AND day >= $2::date AND day <= $3::date
          GROUP BY 1 ORDER BY 1`, [r.site, r.from, r.to, q.bucket]));
  }

  capaSummary(siteId?: string) {
    return this.cached(`capa:${siteId ?? 'all'}`, () =>
      this.ds.query(`SELECT * FROM v_capa_summary WHERE ($1::uuid IS NULL OR site_id = $1)`, [siteId ?? null]));
  }

  snapshots(q: SnapshotQuery) {
    return this.ds.query(
      `SELECT site_id, snapshot_date, metric, value FROM kpi_snapshots
        WHERE ($1::uuid IS NULL OR site_id = $1) AND ($2::text IS NULL OR metric = $2)
          AND snapshot_date >= current_date - $3::int ORDER BY snapshot_date, metric`,
      [q.site_id ?? null, q.metric ?? null, q.days]);
  }

  /** Guarda el KPI de los últimos 30 días por sitio (upsert idempotente por día). */
  async takeSnapshots(): Promise<{ sites: number; metrics: number }> {
    const sites: { id: string }[] = await this.ds.query(`SELECT id FROM sites WHERE is_active`);
    let metrics = 0;
    for (const s of sites) {
      const [k] = await this.ds.query(
        `SELECT * FROM fn_kpi_summary($1, now() - interval '30 days', now())`, [s.id]);
      const vals: Record<string, number | null> = {
        safe_behavior_rate_pct: k.safe_behavior_rate_pct, avg_capa_close_days: k.avg_capa_close_days,
        capa_on_time_close_pct: k.capa_on_time_close_pct, capa_overdue_now: k.capa_overdue_now,
        observations_count: k.observations_count, near_miss_count: k.near_miss_count,
      };
      for (const [metric, value] of Object.entries(vals)) {
        await this.ds.query(
          `INSERT INTO kpi_snapshots(site_id, snapshot_date, metric, value) VALUES ($1, current_date, $2, $3)
           ON CONFLICT (site_id, snapshot_date, metric) DO UPDATE SET value = EXCLUDED.value`, [s.id, metric, value]);
        metrics++;
      }
    }
    await this.redis.delByPrefix('kpi:');
    return { sites: sites.length, metrics };
  }

  @Cron('0 30 1 * * *')
  async nightly() {
    if (this.cfg.get('SCHEDULER_ENABLED') === 'false') return;
    try {
      const r = await this.redis.withLock('kpi-snapshot', 600, () => this.takeSnapshots());
      if (r) this.log.log(`Snapshots KPI: ${JSON.stringify(r)}`);
    } catch (e) {
      this.log.error(`Fallo en snapshot KPI: ${(e as Error).message}`);
    }
  }
}
