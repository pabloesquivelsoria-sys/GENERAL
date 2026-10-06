import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, EntityManager } from 'typeorm';
import { AuthUser, isManager } from '../common/auth-user';
import { withActor } from '../common/db';
import { RoleCode } from '../common/enums';
import { paged, Where } from '../common/pagination';
import { ListAlertsQuery, RaiseAlertInput } from './alerts.dto';

export interface EscalationSummary { due_soon: number; escalated: number; verification_pending: number; }

@Injectable()
export class AlertsService {
  private readonly log = new Logger('Alerts');

  constructor(private ds: DataSource, private cfg: ConfigService) {}

  // ---------- creación (usada por observations / near-misses / capa / scheduler) ----------

  /** Usuarios activos con alguno de los roles, globales o acotados al sitio. */
  async usersWithRoles(m: EntityManager, siteId: string | null, roles: RoleCode[]): Promise<string[]> {
    const rows = await m.query(
      `SELECT DISTINCT u.id FROM users u
         JOIN user_roles ur ON ur.user_id = u.id JOIN roles r ON r.id = ur.role_id
        WHERE u.is_active AND r.code = ANY($1::text[]) AND (ur.site_id IS NULL OR ur.site_id = $2)`,
      [roles, siteId]);
    return rows.map((r: { id: string }) => r.id);
  }

  /**
   * Crea una alerta con destinatarios in_app. Idempotente por dedupe_key mientras la
   * alerta previa no esté resuelta (índice único parcial uq_alert_dedupe). Devuelve id o null.
   */
  async raise(m: EntityManager, a: RaiseAlertInput): Promise<string | null> {
    const rows = await m.query(
      `INSERT INTO alerts(type, severity, site_id, area_id, title, message, entity_type, entity_id, escalation_level, dedupe_key)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (dedupe_key) WHERE dedupe_key IS NOT NULL AND status <> 'resolved' DO NOTHING
       RETURNING id`,
      [a.type, a.severity, a.siteId, a.areaId ?? null, a.title, a.message ?? null, a.entityType, a.entityId,
       a.escalationLevel ?? 0, a.dedupeKey ?? null]);
    if (!rows.length) return null;
    const id: string = rows[0].id;
    const recipients = [...new Set(a.recipientIds.filter(Boolean))];
    if (recipients.length) {
      await m.query(
        `INSERT INTO alert_recipients(alert_id, user_id, channel)
         SELECT $1, u, 'in_app' FROM unnest($2::uuid[]) AS u ON CONFLICT DO NOTHING`, [id, recipients]);
    }
    return id;
  }

  async resolveForEntity(m: EntityManager, entityType: string, entityId: string): Promise<void> {
    await m.query(
      `UPDATE alerts SET status = 'resolved', resolved_at = now()
        WHERE entity_type = $1 AND entity_id = $2 AND status <> 'resolved'`, [entityType, entityId]);
  }

  // ---------- consulta / gestión ----------

  async list(user: AuthUser, q: ListAlertsQuery) {
    const mine = q.mine !== false;
    if (!mine && !isManager(user) && !user.roles.includes('supervisor')) {
      throw new ForbiddenException('Solo supervisores y gerentes pueden ver todas las alertas');
    }
    const w = new Where().add('a.status = ?::alert_status', q.status).add('a.type = ?::alert_type', q.type).add('a.site_id = ?', q.site_id);
    if (mine) w.raw('ar.user_id IS NOT NULL');
    if (q.unread) w.raw('ar.user_id IS NOT NULL AND ar.read_at IS NULL');
    const join = `LEFT JOIN alert_recipients ar ON ar.alert_id = a.id AND ar.channel = 'in_app' AND ar.user_id = $${w.params.length + 1}`;
    const params = [...w.params, user.id];
    const [{ n }] = await this.ds.query(`SELECT count(*)::int AS n FROM alerts a ${join} ${w.sql}`, params);
    const rows = await this.ds.query(
      `SELECT a.*, ar.read_at FROM alerts a ${join} ${w.sql}
       ORDER BY (a.status = 'resolved'), a.created_at DESC
       LIMIT ${q.limit} OFFSET ${(q.page - 1) * q.limit}`, params);
    return paged(rows, n, q);
  }

  async unreadCount(user: AuthUser) {
    const [{ n }] = await this.ds.query(
      `SELECT count(*)::int AS n FROM alert_recipients ar JOIN alerts a ON a.id = ar.alert_id
        WHERE ar.user_id = $1 AND ar.channel = 'in_app' AND ar.read_at IS NULL AND a.status <> 'resolved'`, [user.id]);
    return { unread: n };
  }

  async markRead(user: AuthUser, id: string) {
    // typeorm devuelve [filas, afectadas] en UPDATE ... RETURNING
    const [r] = await this.ds.query(
      `UPDATE alert_recipients SET read_at = COALESCE(read_at, now())
        WHERE alert_id = $1 AND user_id = $2 RETURNING alert_id`, [id, user.id]);
    if (!r.length) throw new NotFoundException('Alerta no dirigida a este usuario');
    return { alert_id: id, read: true };
  }

  async acknowledge(user: AuthUser, id: string) {
    return withActor(this.ds, user.id, async (m) => {
      const [al] = await m.query(`SELECT status FROM alerts WHERE id = $1 FOR UPDATE`, [id]);
      if (!al) throw new NotFoundException('Alerta no encontrada');
      const [rcpt] = await m.query(`SELECT 1 FROM alert_recipients WHERE alert_id = $1 AND user_id = $2`, [id, user.id]);
      if (!rcpt && !isManager(user)) throw new ForbiddenException('No eres destinatario de esta alerta');
      if (al.status === 'open') {
        await m.query(`UPDATE alerts SET status = 'acknowledged', acknowledged_by = $2, acknowledged_at = now() WHERE id = $1`, [id, user.id]);
      }
      await m.query(`UPDATE alert_recipients SET read_at = COALESCE(read_at, now()) WHERE alert_id = $1 AND user_id = $2`, [id, user.id]);
      const [out] = await m.query(`SELECT * FROM alerts WHERE id = $1`, [id]);
      return out;
    });
  }

  async resolve(user: AuthUser, id: string) {
    const [rows] = await withActor(this.ds, user.id, (m) => m.query(
      `UPDATE alerts SET status = 'resolved', resolved_at = now() WHERE id = $1 AND status <> 'resolved' RETURNING *`, [id]));
    if (!rows.length) throw new NotFoundException('Alerta no encontrada o ya resuelta');
    return rows[0];
  }

  // ---------- escalamiento por vencimiento ----------

  /** Destinatarios de un nivel de escalamiento: el responsable + el rol configurado en escalation_rules. */
  private async escalationRecipients(m: EntityManager, c: { owner_id: string; site_id: string }, notifyRole: string) {
    const ids = [c.owner_id];
    if (notifyRole === 'owner_supervisor') {
      const [o] = await m.query(`SELECT supervisor_id FROM users WHERE id = $1`, [c.owner_id]);
      if (o?.supervisor_id) ids.push(o.supervisor_id);
    } else {
      ids.push(...(await this.usersWithRoles(m, c.site_id, [notifyRole as RoleCode])));
    }
    return ids;
  }

  /**
   * Barrido idempotente: (1) CAPA por vencer, (2) CAPA vencidas con nivel de escalamiento
   * según escalation_rules (override por sitio > regla global), (3) verificaciones estancadas.
   * Seguro de ejecutar varias veces: dedupe_key y escalation_level evitan duplicados.
   */
  async runEscalation(): Promise<EscalationSummary> {
    const dueSoonDays = Number(this.cfg.get('ALERT_DUE_SOON_DAYS') ?? 3);
    const verifDays = Number(this.cfg.get('VERIFICATION_PENDING_DAYS') ?? 3);
    const out: EscalationSummary = { due_soon: 0, escalated: 0, verification_pending: 0 };

    // (1) por vencer
    const soon = await this.ds.query(
      `SELECT id, reference, title, site_id, area_id, owner_id, priority, due_date::text AS due_date
         FROM capas WHERE status IN ('open','in_progress')
          AND due_date >= current_date AND due_date <= current_date + $1::int`, [dueSoonDays]);
    for (const c of soon) {
      const id = await withActor(this.ds, null, (m) => this.raise(m, {
        type: 'capa_due_soon', severity: c.priority, siteId: c.site_id, areaId: c.area_id,
        title: `CAPA ${c.reference} vence el ${c.due_date}`, message: c.title,
        entityType: 'capa', entityId: c.id, dedupeKey: `capa_due_soon:${c.id}:${c.due_date}`, recipientIds: [c.owner_id],
      }));
      if (id) out.due_soon++;
    }

    // (2) vencidas
    const overdue = await this.ds.query(
      `SELECT id, reference, title, site_id, area_id, owner_id, priority, escalation_level,
              (current_date - due_date) AS days_overdue
         FROM capas WHERE status IN ('open','in_progress','verification') AND due_date < current_date`);
    for (const c of overdue) {
      const rules = await this.ds.query(
        `WITH eff AS (
           SELECT DISTINCT ON (level) level, days_overdue, notify_role FROM escalation_rules
            WHERE is_active AND priority = $1 AND (site_id = $2 OR site_id IS NULL)
            ORDER BY level, site_id NULLS LAST)
         SELECT level, notify_role FROM eff WHERE days_overdue <= $3 ORDER BY level`,
        [c.priority, c.site_id, c.days_overdue]);
      if (!rules.length) continue;
      const target = rules[rules.length - 1];
      if (target.level <= c.escalation_level) continue;
      const did = await withActor(this.ds, null, async (m) => {
        const [fresh] = await m.query(`SELECT escalation_level FROM capas WHERE id = $1 FOR UPDATE`, [c.id]);
        if (!fresh || fresh.escalation_level >= target.level) return false;
        await m.query(`UPDATE capas SET escalation_level = $2, last_escalated_at = now() WHERE id = $1`, [c.id, target.level]);
        await this.raise(m, {
          type: target.level === 1 ? 'capa_overdue' : 'capa_escalated',
          severity: c.priority, siteId: c.site_id, areaId: c.area_id,
          title: `CAPA ${c.reference} vencida hace ${c.days_overdue} día(s) - nivel ${target.level}`,
          message: c.title, entityType: 'capa', entityId: c.id, escalationLevel: target.level,
          dedupeKey: `capa_esc:${c.id}:${target.level}`,
          recipientIds: await this.escalationRecipients(m, c, target.notify_role),
        });
        return true;
      });
      if (did) out.escalated++;
    }

    // (3) verificación estancada
    const stale = await this.ds.query(
      `SELECT id, reference, title, site_id, area_id, verifier_id, priority FROM capas
        WHERE status = 'verification' AND verifier_id IS NOT NULL
          AND submitted_for_verification_at < now() - make_interval(days => $1::int)`, [verifDays]);
    for (const c of stale) {
      const id = await withActor(this.ds, null, (m) => this.raise(m, {
        type: 'verification_pending', severity: c.priority, siteId: c.site_id, areaId: c.area_id,
        title: `CAPA ${c.reference} espera verificación hace más de ${verifDays} días`, message: c.title,
        entityType: 'capa', entityId: c.id, dedupeKey: `verif_stale:${c.id}`, recipientIds: [c.verifier_id],
      }));
      if (id) out.verification_pending++;
    }

    if (out.due_soon || out.escalated || out.verification_pending) this.log.log(`Escalamiento: ${JSON.stringify(out)}`);
    return out;
  }
}
