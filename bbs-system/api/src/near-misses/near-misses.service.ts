import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AlertsService } from '../alerts/alerts.service';
import { AuthUser } from '../common/auth-user';
import { withActor } from '../common/db';
import { NearMissStatus } from '../common/enums';
import { paged, Where } from '../common/pagination';
import { ChangeNearMissStatusDto, CreateNearMissDto, ListNearMissesQuery, UpdateNearMissDto } from './near-misses.dto';

/** reported -> under_investigation -> capa_assigned -> closed (cierre directo permitido desde investigación si no requiere CAPA). */
const TRANSITIONS: Record<NearMissStatus, NearMissStatus[]> = {
  reported: ['under_investigation'],
  under_investigation: ['capa_assigned', 'closed'],
  capa_assigned: ['under_investigation', 'closed'],
  closed: [],
};

@Injectable()
export class NearMissesService {
  constructor(private ds: DataSource, private alerts: AlertsService) {}

  async create(user: AuthUser, dto: CreateNearMissDto) {
    const anonymous = dto.is_anonymous ?? false;
    try {
      const id = await withActor(this.ds, anonymous ? null : user.id, async (m) => {
        if (dto.area_id) {
          const [a] = await m.query(`SELECT 1 FROM areas WHERE id = $1 AND site_id = $2`, [dto.area_id, dto.site_id]);
          if (!a) throw new BadRequestException('area_id no pertenece al sitio');
        }
        const [nm] = await m.query(
          `INSERT INTO near_misses(site_id, area_id, location_detail, reported_by, is_anonymous, occurred_at, title, description,
             potential_severity, likelihood, related_observation_id, related_behavior_id, immediate_action)
           VALUES ($1,$2,$3,$4,$5,COALESCE($6::timestamptz, now()),$7,$8,COALESCE($9::severity_level,'medium'),$10,$11,$12,$13)
           RETURNING id, reference, site_id, area_id, title, potential_severity, risk_score`,
          [dto.site_id, dto.area_id ?? null, dto.location_detail ?? null, anonymous ? null : user.id, anonymous,
           dto.occurred_at ?? null, dto.title, dto.description, dto.potential_severity ?? null, dto.likelihood ?? null,
           dto.related_observation_id ?? null, dto.related_behavior_id ?? null, dto.immediate_action ?? null]);
        if (dto.factor_ids?.length) {
          await m.query(`INSERT INTO near_miss_factors(near_miss_id, factor_id) SELECT $1, f FROM unnest($2::smallint[]) f`, [nm.id, dto.factor_ids]);
        }
        const high = nm.potential_severity === 'high' || nm.potential_severity === 'critical';
        await this.alerts.raise(m, {
          type: 'near_miss_reported', severity: nm.potential_severity, siteId: nm.site_id, areaId: nm.area_id,
          title: `Casi-accidente ${nm.reference}: ${nm.title}`, message: `Severidad potencial ${nm.potential_severity}, riesgo ${nm.risk_score}`,
          entityType: 'near_miss', entityId: nm.id, dedupeKey: `nm:${nm.id}`,
          recipientIds: await this.alerts.usersWithRoles(m, nm.site_id,
            high ? ['supervisor', 'ehs_manager', 'site_manager'] : ['supervisor', 'ehs_manager']),
        });
        return nm.id as string;
      });
      return this.get(id);
    } catch (e: any) {
      if (e?.code === '23503') throw new BadRequestException('Referencia inexistente (sitio, observación, comportamiento o factor)');
      throw e;
    }
  }

  async update(user: AuthUser, id: string, dto: UpdateNearMissDto) {
    await withActor(this.ds, user.id, async (m) => {
      const [nm] = await m.query(`SELECT status FROM near_misses WHERE id = $1 FOR UPDATE`, [id]);
      if (!nm) throw new NotFoundException('Casi-accidente no encontrado');
      if (nm.status === 'closed') throw new ConflictException('El casi-accidente está cerrado');
      await m.query(
        `UPDATE near_misses SET root_cause = COALESCE($2, root_cause), potential_severity = COALESCE($3::severity_level, potential_severity),
           likelihood = COALESCE($4, likelihood), immediate_action = COALESCE($5, immediate_action) WHERE id = $1`,
        [id, dto.root_cause ?? null, dto.potential_severity ?? null, dto.likelihood ?? null, dto.immediate_action ?? null]);
      if (dto.factor_ids) {
        await m.query(`DELETE FROM near_miss_factors WHERE near_miss_id = $1`, [id]);
        if (dto.factor_ids.length) {
          await m.query(`INSERT INTO near_miss_factors(near_miss_id, factor_id) SELECT $1, f FROM unnest($2::smallint[]) f`, [id, dto.factor_ids]);
        }
      }
    });
    return this.get(id);
  }

  async changeStatus(user: AuthUser, id: string, dto: ChangeNearMissStatusDto) {
    await withActor(this.ds, user.id, async (m) => {
      const [nm] = await m.query(`SELECT status, root_cause FROM near_misses WHERE id = $1 FOR UPDATE`, [id]);
      if (!nm) throw new NotFoundException('Casi-accidente no encontrado');
      const from = nm.status as NearMissStatus;
      if (!TRANSITIONS[from].includes(dto.status)) throw new ConflictException(`Transición inválida ${from} -> ${dto.status}`);
      if (dto.status === 'capa_assigned') {
        const [c] = await m.query(`SELECT 1 FROM capas WHERE source_near_miss_id = $1 AND status <> 'cancelled' LIMIT 1`, [id]);
        if (!c) throw new BadRequestException('Crea primero una CAPA con source=near_miss para este casi-accidente');
      }
      if (dto.status === 'closed') {
        if (!nm.root_cause) throw new BadRequestException('Registra la causa raíz antes de cerrar');
        const [open] = await m.query(
          `SELECT 1 FROM capas WHERE source_near_miss_id = $1 AND status IN ('open','in_progress','verification') LIMIT 1`, [id]);
        if (open) throw new ConflictException('Hay CAPA abiertas vinculadas; ciérralas antes');
      }
      await m.query(`UPDATE near_misses SET status = $2::near_miss_status, closed_at = CASE WHEN $2::near_miss_status = 'closed' THEN now() ELSE closed_at END WHERE id = $1`, [id, dto.status]);
      await m.query(
        `INSERT INTO audit_log(table_name, record_id, action, actor_id, old_data, new_data)
         VALUES ('near_misses', $1, 'TRANSITION', $2, $3::jsonb, $4::jsonb)`,
        [id, user.id, JSON.stringify({ status: from }), JSON.stringify({ status: dto.status, comment: dto.comment ?? null })]);
      if (dto.status === 'closed') await this.alerts.resolveForEntity(m, 'near_miss', id);
    });
    return this.get(id);
  }

  async list(q: ListNearMissesQuery) {
    const w = new Where().add('n.site_id = ?', q.site_id).add('n.area_id = ?', q.area_id)
      .add('n.status = ?::near_miss_status', q.status).add('n.potential_severity = ?::severity_level', q.potential_severity)
      .add('n.occurred_at >= ?::timestamptz', q.from).add('n.occurred_at < ?::timestamptz', q.to);
    const [{ n }] = await this.ds.query(`SELECT count(*)::int AS n FROM near_misses n ${w.sql}`, w.params);
    const rows = await this.ds.query(
      `SELECT n.id, n.reference, n.site_id, n.area_id, a.name AS area_name, n.title, n.occurred_at, n.potential_severity,
              n.likelihood, n.risk_score, n.status, n.is_anonymous
         FROM near_misses n LEFT JOIN areas a ON a.id = n.area_id ${w.sql}
        ORDER BY n.occurred_at DESC LIMIT ${q.limit} OFFSET ${(q.page - 1) * q.limit}`, w.params);
    return paged(rows, n, q);
  }

  async get(id: string) {
    const [nm] = await this.ds.query(
      `SELECT n.*, u.full_name AS reporter_name, a.name AS area_name FROM near_misses n
         LEFT JOIN users u ON u.id = n.reported_by AND NOT n.is_anonymous LEFT JOIN areas a ON a.id = n.area_id WHERE n.id = $1`, [id]);
    if (!nm) throw new NotFoundException('Casi-accidente no encontrado');
    const factors = await this.ds.query(
      `SELECT f.id, f.code, f.name FROM near_miss_factors x JOIN causal_factors f ON f.id = x.factor_id WHERE x.near_miss_id = $1`, [id]);
    const capas = await this.ds.query(
      `SELECT id, reference, title, status, due_date, priority FROM capas WHERE source_near_miss_id = $1 ORDER BY created_at`, [id]);
    return { ...nm, factors, capas };
  }
}
