import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, EntityManager } from 'typeorm';
import { AlertsService } from '../alerts/alerts.service';
import { AuthUser, isManager } from '../common/auth-user';
import { withActor } from '../common/db';
import { paged, Where } from '../common/pagination';
import { CreateObservationDto, ListObservationsQuery, OBSERVATION_STATUSES, ObservationStatus } from './observations.dto';

const TRANSITIONS: Record<ObservationStatus, ObservationStatus[]> = {
  draft: ['submitted'],
  submitted: ['reviewed', 'archived'],
  reviewed: ['archived'],
  archived: [],
};

@Injectable()
export class ObservationsService {
  constructor(private ds: DataSource, private alerts: AlertsService, private cfg: ConfigService) {}

  async create(user: AuthUser, dto: CreateObservationDto) {
    const ids = dto.items.map((i) => i.behavior_id);
    if (new Set(ids).size !== ids.length) throw new BadRequestException('Comportamiento repetido en items');
    for (const it of dto.items) {
      if (it.severity && it.result !== 'at_risk') throw new BadRequestException('severity solo aplica a result=at_risk');
      if (it.corrected_on_spot && it.result !== 'at_risk') throw new BadRequestException('corrected_on_spot solo aplica a result=at_risk');
    }
    const anonymous = dto.is_anonymous_observed ?? true;
    if (anonymous && (dto.observed_user_id || dto.observed_name)) {
      throw new BadRequestException('Observación anónima: no envíes observed_user_id/observed_name o usa is_anonymous_observed=false');
    }
    const status: ObservationStatus = dto.save_as_draft ? 'draft' : 'submitted';

    try {
      const id = await withActor(this.ds, user.id, async (m) => {
        if (dto.area_id) {
          const [a] = await m.query(`SELECT 1 FROM areas WHERE id = $1 AND site_id = $2`, [dto.area_id, dto.site_id]);
          if (!a) throw new BadRequestException('area_id no pertenece al sitio');
        }
        const [{ n }] = await m.query(`SELECT count(*)::int AS n FROM behaviors WHERE id = ANY($1::uuid[]) AND is_active`, [ids]);
        if (n !== ids.length) throw new BadRequestException('Algún behavior_id no existe o está inactivo');

        const [o] = await m.query(
          `INSERT INTO observations(site_id, area_id, location_detail, checklist_id, observer_id, observed_user_id, observed_name,
             observed_company, is_anonymous_observed, observed_at, shift, task_observed, duration_minutes, people_observed,
             status, positive_feedback_given, coaching_notes, immediate_action)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,COALESCE($10::timestamptz, now()),$11,$12,$13,COALESCE($14,1),$15,$16,$17,$18)
           RETURNING id`,
          [dto.site_id, dto.area_id ?? null, dto.location_detail ?? null, dto.checklist_id ?? null, user.id,
           anonymous ? null : dto.observed_user_id ?? null, anonymous ? null : dto.observed_name ?? null,
           dto.observed_company ?? null, anonymous, dto.observed_at ?? null, dto.shift ?? null, dto.task_observed ?? null,
           dto.duration_minutes ?? null, dto.people_observed ?? null, status,
           dto.positive_feedback_given ?? false, dto.coaching_notes ?? null, dto.immediate_action ?? null]);

        for (const it of dto.items) {
          const [row] = await m.query(
            `INSERT INTO observation_items(observation_id, behavior_id, result, severity, comment, corrected_on_spot)
             VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
            [o.id, it.behavior_id, it.result, it.severity ?? null, it.comment ?? null, it.corrected_on_spot ?? false]);
          if (it.factor_ids?.length) {
            await m.query(
              `INSERT INTO observation_item_factors(observation_item_id, factor_id) SELECT $1, f FROM unnest($2::smallint[]) f`,
              [row.id, it.factor_ids]);
          }
        }
        if (status === 'submitted') await this.raiseAlerts(m, o.id);
        return o.id as string;
      });
      return this.get(id);
    } catch (e: any) {
      if (e?.code === '23503') throw new BadRequestException('Referencia inexistente (sitio, checklist, usuario o factor)');
      throw e;
    }
  }

  /** Alerta por cada comportamiento at_risk; inmediata/crítica si el ítem es crítico en el checklist. Detecta reincidencia. */
  private async raiseAlerts(m: EntityManager, obsId: string) {
    const threshold = Number(this.cfg.get('REPEAT_UNSAFE_THRESHOLD') ?? 3);
    const windowDays = Number(this.cfg.get('REPEAT_UNSAFE_WINDOW_DAYS') ?? 30);
    const [o] = await m.query(`SELECT id, reference, site_id, area_id, checklist_id FROM observations WHERE id = $1`, [obsId]);
    const items = await m.query(
      `SELECT i.id, i.behavior_id, b.name AS behavior, COALESCE(i.severity, b.default_severity) AS severity,
              COALESCE(ci.is_critical, false) AS is_critical
         FROM observation_items i JOIN behaviors b ON b.id = i.behavior_id
         LEFT JOIN checklist_items ci ON ci.checklist_id = $2 AND ci.behavior_id = i.behavior_id
        WHERE i.observation_id = $1 AND i.result = 'at_risk'`, [obsId, o.checklist_id]);

    for (const it of items) {
      const critical = it.is_critical || it.severity === 'critical';
      const severity = it.is_critical ? 'critical' : it.severity;
      const roles = critical || severity === 'high' ? ['supervisor', 'ehs_manager', 'site_manager'] : ['supervisor', 'ehs_manager'];
      await this.alerts.raise(m, {
        type: 'unsafe_behavior', severity, siteId: o.site_id, areaId: o.area_id,
        title: `Comportamiento de riesgo: ${it.behavior}`,
        message: `Observación ${o.reference}${it.is_critical ? ' (ítem crítico del checklist)' : ''}`,
        entityType: 'observation', entityId: o.id, dedupeKey: `obs_item:${it.id}`,
        recipientIds: await this.alerts.usersWithRoles(m, o.site_id, roles as any),
      });

      const [{ n }] = await m.query(
        `SELECT count(*)::int AS n FROM observation_items i JOIN observations ob ON ob.id = i.observation_id
          WHERE i.behavior_id = $1 AND i.result = 'at_risk' AND ob.status <> 'draft' AND ob.site_id = $2
            AND ob.area_id IS NOT DISTINCT FROM $3
            AND ob.observed_at >= now() - make_interval(days => $4::int)`,
        [it.behavior_id, o.site_id, o.area_id, windowDays]);
      if (n >= threshold) {
        await this.alerts.raise(m, {
          type: 'repeat_unsafe_behavior', severity: 'high', siteId: o.site_id, areaId: o.area_id,
          title: `Reincidencia: "${it.behavior}" ${n} veces en ${windowDays} días`,
          message: 'Considere una CAPA sistémica sobre las causas (jerarquía de controles).',
          entityType: 'observation', entityId: o.id, dedupeKey: `repeat:${it.behavior_id}:${o.area_id ?? o.site_id}`,
          recipientIds: await this.alerts.usersWithRoles(m, o.site_id, ['supervisor', 'ehs_manager']),
        });
      }
    }
  }

  async changeStatus(user: AuthUser, id: string, to: ObservationStatus) {
    if (!OBSERVATION_STATUSES.includes(to)) throw new BadRequestException('Estado inválido');
    await withActor(this.ds, user.id, async (m) => {
      const [o] = await m.query(`SELECT status, observer_id FROM observations WHERE id = $1 FOR UPDATE`, [id]);
      if (!o) throw new NotFoundException('Observación no encontrada');
      if (!TRANSITIONS[o.status as ObservationStatus].includes(to)) {
        throw new ConflictException(`Transición inválida ${o.status} -> ${to}`);
      }
      const reviewer = isManager(user) || user.roles.includes('supervisor');
      if (to === 'submitted' ? !(reviewer || o.observer_id === user.id) : !reviewer) {
        throw new ForbiddenException('Sin permiso para esta transición');
      }
      await m.query(`UPDATE observations SET status = $2 WHERE id = $1`, [id, to]);
      if (to === 'submitted') await this.raiseAlerts(m, id);
    });
    return this.get(id);
  }

  async list(q: ListObservationsQuery) {
    const w = new Where()
      .add('o.site_id = ?', q.site_id).add('o.area_id = ?', q.area_id).add('o.observer_id = ?', q.observer_id)
      .add('o.status = ?::observation_status', q.status).add('o.observed_at >= ?::timestamptz', q.from)
      .add('o.observed_at < ?::timestamptz', q.to);
    if (q.has_at_risk) w.raw(`EXISTS (SELECT 1 FROM observation_items x WHERE x.observation_id = o.id AND x.result = 'at_risk')`);
    const [{ n }] = await this.ds.query(`SELECT count(*)::int AS n FROM observations o ${w.sql}`, w.params);
    const rows = await this.ds.query(
      `SELECT o.id, o.reference, o.site_id, o.area_id, a.name AS area_name, o.observer_id, u.full_name AS observer_name,
              o.observed_at, o.status, o.shift, o.task_observed,
              (SELECT count(*) FROM observation_items i WHERE i.observation_id = o.id AND i.result = 'safe')::int AS safe_count,
              (SELECT count(*) FROM observation_items i WHERE i.observation_id = o.id AND i.result = 'at_risk')::int AS at_risk_count
         FROM observations o JOIN users u ON u.id = o.observer_id LEFT JOIN areas a ON a.id = o.area_id
         ${w.sql} ORDER BY o.observed_at DESC LIMIT ${q.limit} OFFSET ${(q.page - 1) * q.limit}`, w.params);
    return paged(rows, n, q);
  }

  async get(id: string) {
    const [o] = await this.ds.query(
      `SELECT o.*, u.full_name AS observer_name, a.name AS area_name FROM observations o
         JOIN users u ON u.id = o.observer_id LEFT JOIN areas a ON a.id = o.area_id WHERE o.id = $1`, [id]);
    if (!o) throw new NotFoundException('Observación no encontrada');
    const items = await this.ds.query(
      `SELECT i.*, b.code AS behavior_code, b.name AS behavior_name,
              COALESCE((SELECT json_agg(json_build_object('id', f.id, 'code', f.code, 'name', f.name))
                          FROM observation_item_factors x JOIN causal_factors f ON f.id = x.factor_id
                         WHERE x.observation_item_id = i.id), '[]'::json) AS factors
         FROM observation_items i JOIN behaviors b ON b.id = i.behavior_id WHERE i.observation_id = $1 ORDER BY b.code`, [id]);
    const capas = await this.ds.query(
      `SELECT id, reference, title, status, due_date, priority FROM capas WHERE source_observation_id = $1
         OR source_observation_item_id IN (SELECT id FROM observation_items WHERE observation_id = $1)`, [id]);
    return { ...o, items, capas };
  }

  /** Catálogos para formularios de captura. */
  async catalog() {
    const [behaviors, checklists, factors, sites] = await Promise.all([
      this.ds.query(`SELECT b.id, b.code, b.name, b.safe_description, b.at_risk_description, b.default_severity,
                            c.id AS category_id, c.name AS category FROM behaviors b
                       JOIN behavior_categories c ON c.id = b.category_id WHERE b.is_active ORDER BY c.sort_order, b.code`),
      this.ds.query(`SELECT c.id, c.code, c.name, c.site_id, c.area_id,
                            COALESCE(json_agg(json_build_object('behavior_id', ci.behavior_id, 'is_critical', ci.is_critical)
                                     ORDER BY ci.sort_order) FILTER (WHERE ci.id IS NOT NULL), '[]') AS items
                       FROM checklists c LEFT JOIN checklist_items ci ON ci.checklist_id = c.id WHERE c.is_active GROUP BY c.id`),
      this.ds.query(`SELECT id, code, name, group_name FROM causal_factors ORDER BY group_name, name`),
      this.ds.query(`SELECT s.id, s.code, s.name,
                            COALESCE(json_agg(json_build_object('id', a.id, 'code', a.code, 'name', a.name)) FILTER (WHERE a.id IS NOT NULL), '[]') AS areas
                       FROM sites s LEFT JOIN areas a ON a.site_id = s.id AND a.is_active WHERE s.is_active GROUP BY s.id ORDER BY s.name`),
    ]);
    return { behaviors, checklists, causal_factors: factors, sites };
  }
}
