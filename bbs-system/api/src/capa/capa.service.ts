import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, EntityManager } from 'typeorm';
import { AlertsService } from '../alerts/alerts.service';
import { AuthUser, isManager } from '../common/auth-user';
import { withActor } from '../common/db';
import { CapaSource, CapaStatus } from '../common/enums';
import { paged, Where } from '../common/pagination';
import {
  AddCapaCommentDto, CreateCapaDto, DecideExtensionDto, ListCapaQuery, RequestExtensionDto, TransitionCapaDto, UpdateCapaDto, VerifyCapaDto,
} from './capa.dto';
import { ACTIVE_CAPA_STATUSES, canTransition } from './capa.state-machine';

const canManage = (u: AuthUser) => isManager(u) || u.roles.includes('site_manager');

@Injectable()
export class CapaService {
  constructor(private ds: DataSource, private alerts: AlertsService, private cfg: ConfigService) {}

  // ---------- helpers ----------

  private async lock(m: EntityManager, id: string) {
    const [c] = await m.query(`SELECT * FROM capas WHERE id = $1 FOR UPDATE`, [id]);
    if (!c) throw new NotFoundException('CAPA no encontrada');
    return c;
  }

  /** Bitácora de la CAPA + registro explícito TRANSITION en audit_log (además del trigger UPDATE). */
  private async logTransition(m: EntityManager, capaId: string, actor: string, from: CapaStatus | null, to: CapaStatus, comment?: string | null) {
    await m.query(
      `INSERT INTO capa_updates(capa_id, author_id, from_status, to_status, comment) VALUES ($1,$2,$3,$4,$5)`,
      [capaId, actor, from, to, comment ?? null]);
    await m.query(
      `INSERT INTO audit_log(table_name, record_id, action, actor_id, old_data, new_data)
       VALUES ('capas', $1, 'TRANSITION', $2, $3::jsonb, $4::jsonb)`,
      [capaId, actor, JSON.stringify({ status: from }), JSON.stringify({ status: to, comment: comment ?? null })]);
  }

  private translate(e: any): never {
    if (e?.code === '23514') throw new BadRequestException('Regla de integridad violada (p. ej. verificador distinto del responsable, fuente requerida)');
    if (e?.code === '23503') throw new BadRequestException('Referencia inexistente (sitio, área, usuario, observación o casi-accidente)');
    throw e;
  }

  private async requireActiveUser(m: EntityManager, id: string, label: string) {
    const [u] = await m.query(`SELECT 1 FROM users WHERE id = $1 AND is_active`, [id]);
    if (!u) throw new BadRequestException(`${label} no existe o está inactivo`);
  }

  // ---------- creación / edición ----------

  async create(user: AuthUser, dto: CreateCapaDto) {
    let source: CapaSource = dto.source ?? 'other';
    if (!dto.source) {
      if (dto.source_near_miss_id) source = 'near_miss';
      else if (dto.source_observation_id || dto.source_observation_item_id) source = 'observation';
    }
    if (source === 'observation' && !dto.source_observation_id && !dto.source_observation_item_id) {
      throw new BadRequestException('source=observation requiere source_observation_id o source_observation_item_id');
    }
    if (source === 'near_miss' && !dto.source_near_miss_id) throw new BadRequestException('source=near_miss requiere source_near_miss_id');
    if (dto.verifier_id && dto.verifier_id === dto.owner_id) throw new BadRequestException('El verificador debe ser distinto del responsable');

    try {
      const id = await withActor(this.ds, user.id, async (m) => {
        const [{ ok }] = await m.query(`SELECT $1::date >= current_date AS ok`, [dto.due_date]);
        if (!ok) throw new BadRequestException('due_date no puede estar en el pasado');
        if (dto.area_id) {
          const [a] = await m.query(`SELECT 1 FROM areas WHERE id = $1 AND site_id = $2`, [dto.area_id, dto.site_id]);
          if (!a) throw new BadRequestException('area_id no pertenece al sitio');
        }
        await this.requireActiveUser(m, dto.owner_id, 'Responsable');
        if (dto.verifier_id) await this.requireActiveUser(m, dto.verifier_id, 'Verificador');

        const [c] = await m.query(
          `INSERT INTO capas(site_id, area_id, title, description, type, control_level, source, source_observation_id,
             source_observation_item_id, source_near_miss_id, root_cause, priority, owner_id, verifier_id, created_by, due_date, original_due_date)
           VALUES ($1,$2,$3,$4,COALESCE($5::capa_type,'corrective'),$6,$7::capa_source,$8,$9,$10,$11,COALESCE($12::priority_level,'medium'),
                   $13,$14,$15,$16::date,$16::date) RETURNING id`,
          [dto.site_id, dto.area_id ?? null, dto.title, dto.description, dto.type ?? null, dto.control_level ?? null, source,
           dto.source_observation_id ?? null, dto.source_observation_item_id ?? null, dto.source_near_miss_id ?? null,
           dto.root_cause ?? null, dto.priority ?? null, dto.owner_id, dto.verifier_id ?? null, user.id, dto.due_date]);
        await this.logTransition(m, c.id, user.id, null, 'open', 'CAPA creada');
        if (source === 'near_miss') {
          await m.query(`UPDATE near_misses SET status = 'capa_assigned' WHERE id = $1 AND status IN ('reported','under_investigation')`, [dto.source_near_miss_id]);
        }
        return c.id as string;
      });
      return this.get(id);
    } catch (e) { this.translate(e); }
  }

  async update(user: AuthUser, id: string, dto: UpdateCapaDto) {
    try {
      await withActor(this.ds, user.id, async (m) => {
        const c = await this.lock(m, id);
        if (!ACTIVE_CAPA_STATUSES.includes(c.status)) throw new ConflictException('No se puede editar una CAPA cerrada o cancelada');
        if (!(canManage(user) || user.roles.includes('supervisor') || c.created_by === user.id)) throw new ForbiddenException();
        if (dto.owner_id) await this.requireActiveUser(m, dto.owner_id, 'Responsable');
        if (dto.verifier_id) await this.requireActiveUser(m, dto.verifier_id, 'Verificador');
        await m.query(
          `UPDATE capas SET title = COALESCE($2, title), description = COALESCE($3, description),
             control_level = COALESCE($4::hierarchy_control, control_level), root_cause = COALESCE($5, root_cause),
             priority = COALESCE($6::priority_level, priority), owner_id = COALESCE($7, owner_id),
             verifier_id = COALESCE($8, verifier_id) WHERE id = $1`,
          [id, dto.title ?? null, dto.description ?? null, dto.control_level ?? null, dto.root_cause ?? null,
           dto.priority ?? null, dto.owner_id ?? null, dto.verifier_id ?? null]);
      });
    } catch (e) { this.translate(e); }
    return this.get(id);
  }

  // ---------- máquina de estados ----------

  async transition(user: AuthUser, id: string, dto: TransitionCapaDto) {
    await withActor(this.ds, user.id, async (m) => {
      const c = await this.lock(m, id);
      const from = c.status as CapaStatus;
      const to = dto.to;
      if (to === 'closed') throw new BadRequestException('El cierre se realiza registrando una verificación eficaz: POST /capa/:id/verifications');
      if (!canTransition(from, to)) throw new ConflictException(`Transición inválida ${from} -> ${to}`);
      const isOwner = c.owner_id === user.id;
      const comment = dto.comment?.trim();

      if (to === 'in_progress' && from === 'open') {
        if (!(isOwner || c.created_by === user.id || canManage(user))) throw new ForbiddenException('Solo responsable, creador o gerente');
        await m.query(`UPDATE capas SET status = 'in_progress', started_at = COALESCE(started_at, now()) WHERE id = $1`, [id]);
      } else if (to === 'verification') {
        if (!(isOwner || canManage(user))) throw new ForbiddenException('Solo el responsable o un gerente');
        if (!c.verifier_id) throw new BadRequestException('Asigna un verificador (PATCH /capa/:id) antes de enviar a verificación');
        if (!comment) throw new BadRequestException('comment obligatorio: describe la evidencia de implementación');
        await m.query(`UPDATE capas SET status = 'verification', submitted_for_verification_at = now() WHERE id = $1`, [id]);
        await this.alerts.raise(m, {
          type: 'verification_pending', severity: c.priority, siteId: c.site_id, areaId: c.area_id,
          title: `CAPA ${c.reference} lista para verificar`, message: c.title, entityType: 'capa', entityId: id,
          dedupeKey: `verif:${id}:${Date.now()}`, recipientIds: [c.verifier_id],
        });
      } else if (to === 'in_progress' && from === 'verification') {
        if (!(c.verifier_id === user.id || canManage(user))) throw new ForbiddenException('Solo el verificador o un gerente');
        if (!comment) throw new BadRequestException('comment obligatorio: indica por qué se devuelve');
        await m.query(`UPDATE capas SET status = 'in_progress' WHERE id = $1`, [id]);
      } else if (to === 'cancelled') {
        if (!canManage(user)) throw new ForbiddenException('Solo gerentes pueden cancelar');
        if (!comment) throw new BadRequestException('comment obligatorio: motivo de cancelación');
        await m.query(`UPDATE capas SET status = 'cancelled', cancelled_reason = $2 WHERE id = $1`, [id, comment]);
        await this.alerts.resolveForEntity(m, 'capa', id);
      }
      await this.logTransition(m, id, user.id, from, to, comment);
    });
    return this.get(id);
  }

  /** Verificación de eficacia. Eficaz => cierra; no eficaz => regresa a in_progress. */
  async verify(user: AuthUser, id: string, dto: VerifyCapaDto) {
    try {
      await withActor(this.ds, user.id, async (m) => {
        const c = await this.lock(m, id);
        if (c.status !== 'verification') throw new ConflictException(`La CAPA está en '${c.status}'; debe estar en 'verification'`);
        if (c.owner_id === user.id) throw new ForbiddenException('El responsable no puede verificar su propia CAPA');
        if (!(c.verifier_id === user.id || canManage(user))) throw new ForbiddenException('Solo el verificador asignado o un gerente');
        await m.query(
          `INSERT INTO capa_verifications(capa_id, verifier_id, is_effective, method, findings, follow_up_observation_id)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [id, user.id, dto.is_effective, dto.method ?? null, dto.findings, dto.follow_up_observation_id ?? null]);
        if (dto.is_effective) {
          await m.query(`UPDATE capas SET status = 'closed', closed_at = now() WHERE id = $1`, [id]);
          await this.logTransition(m, id, user.id, 'verification', 'closed', dto.findings);
          await this.alerts.resolveForEntity(m, 'capa', id);
        } else {
          await m.query(`UPDATE capas SET status = 'in_progress' WHERE id = $1`, [id]);
          await this.logTransition(m, id, user.id, 'verification', 'in_progress', `Verificación no eficaz: ${dto.findings}`);
        }
      });
    } catch (e) { this.translate(e); }
    return this.get(id);
  }

  async comment(user: AuthUser, id: string, dto: AddCapaCommentDto) {
    await withActor(this.ds, user.id, async (m) => {
      const [c] = await m.query(`SELECT 1 FROM capas WHERE id = $1`, [id]);
      if (!c) throw new NotFoundException('CAPA no encontrada');
      await m.query(`INSERT INTO capa_updates(capa_id, author_id, comment) VALUES ($1,$2,$3)`, [id, user.id, dto.comment]);
    });
    return this.get(id);
  }

  // ---------- extensiones de plazo ----------

  async requestExtension(user: AuthUser, id: string, dto: RequestExtensionDto) {
    const max = Number(this.cfg.get('CAPA_MAX_EXTENSIONS') ?? 2);
    try {
      await withActor(this.ds, user.id, async (m) => {
        const c = await this.lock(m, id);
        if (!ACTIVE_CAPA_STATUSES.includes(c.status)) throw new ConflictException('La CAPA no está activa');
        if (!(c.owner_id === user.id || canManage(user))) throw new ForbiddenException('Solo el responsable o un gerente');
        if (c.extension_count >= max) throw new ConflictException(`Se alcanzó el máximo de ${max} extensiones`);
        const [pending] = await m.query(`SELECT 1 FROM capa_extensions WHERE capa_id = $1 AND approved IS NULL`, [id]);
        if (pending) throw new ConflictException('Ya existe una solicitud de extensión pendiente');
        const [{ later }] = await m.query(`SELECT $1::date > $2::date AS later`, [dto.new_due_date, c.due_date]);
        if (!later) throw new BadRequestException('new_due_date debe ser posterior al plazo actual');
        await m.query(
          `INSERT INTO capa_extensions(capa_id, requested_by, old_due_date, new_due_date, reason) VALUES ($1,$2,$3,$4::date,$5)`,
          [id, user.id, c.due_date, dto.new_due_date, dto.reason]);
      });
    } catch (e) { this.translate(e); }
    return this.get(id);
  }

  async decideExtension(user: AuthUser, extId: string, dto: DecideExtensionDto) {
    const capaId = await withActor(this.ds, user.id, async (m) => {
      const [x] = await m.query(`SELECT * FROM capa_extensions WHERE id = $1 FOR UPDATE`, [extId]);
      if (!x) throw new NotFoundException('Solicitud no encontrada');
      if (x.approved !== null) throw new ConflictException('La solicitud ya fue resuelta');
      if (x.requested_by === user.id) throw new ForbiddenException('No puedes aprobar tu propia solicitud');
      const c = await this.lock(m, x.capa_id);
      await m.query(`UPDATE capa_extensions SET approved = $2, approved_by = $3, decided_at = now() WHERE id = $1`, [extId, dto.approved, user.id]);
      if (dto.approved) {
        if (!ACTIVE_CAPA_STATUSES.includes(c.status)) throw new ConflictException('La CAPA ya no está activa');
        await m.query(
          `UPDATE capas SET due_date = $2::date, extension_count = extension_count + 1,
             escalation_level = CASE WHEN $2::date >= current_date THEN 0 ELSE escalation_level END WHERE id = $1`,
          [c.id, x.new_due_date]);
        await m.query(
          `INSERT INTO capa_updates(capa_id, author_id, comment) VALUES ($1,$2,$3)`,
          [c.id, user.id, `Extensión aprobada: ${x.old_due_date} -> ${x.new_due_date}`]);
        const [{ future }] = await m.query(`SELECT $1::date >= current_date AS future`, [x.new_due_date]);
        if (future) await this.alerts.resolveForEntity(m, 'capa', c.id);
      }
      return c.id as string;
    });
    return this.get(capaId);
  }

  // ---------- consultas ----------

  async list(user: AuthUser, q: ListCapaQuery) {
    const w = new Where().add('c.site_id = ?', q.site_id).add('c.area_id = ?', q.area_id).add('c.owner_id = ?', q.owner_id)
      .add('c.status = ?::capa_status', q.status).add('c.priority = ?::priority_level', q.priority)
      .add('c.source = ?::capa_source', q.source);
    if (q.overdue) w.raw(`c.status IN ('open','in_progress','verification') AND c.due_date < current_date`);
    if (q.mine) w.add('(c.owner_id = ? OR c.verifier_id = ?)', user.id);
    const sql = w.sql;
    const [{ n }] = await this.ds.query(`SELECT count(*)::int AS n FROM capas c ${sql}`, w.params);
    const rows = await this.ds.query(
      `SELECT c.id, c.reference, c.title, c.type, c.source, c.priority, c.status, c.site_id, c.area_id, c.owner_id,
              o.full_name AS owner_name, c.verifier_id, c.due_date, c.escalation_level, c.extension_count,
              (c.status IN ('open','in_progress','verification') AND c.due_date < current_date) AS is_overdue,
              GREATEST(current_date - c.due_date, 0) * (c.status IN ('open','in_progress','verification'))::int AS days_overdue
         FROM capas c JOIN users o ON o.id = c.owner_id ${sql}
        ORDER BY (c.status IN ('closed','cancelled')), c.due_date LIMIT ${q.limit} OFFSET ${(q.page - 1) * q.limit}`, w.params);
    return paged(rows, n, q);
  }

  async get(id: string) {
    const [c] = await this.ds.query(
      `SELECT c.*, o.full_name AS owner_name, v.full_name AS verifier_name,
              (c.status IN ('open','in_progress','verification') AND c.due_date < current_date) AS is_overdue
         FROM capas c JOIN users o ON o.id = c.owner_id LEFT JOIN users v ON v.id = c.verifier_id WHERE c.id = $1`, [id]);
    if (!c) throw new NotFoundException('CAPA no encontrada');
    const [updates, verifications, extensions] = await Promise.all([
      this.ds.query(`SELECT u.*, a.full_name AS author_name FROM capa_updates u LEFT JOIN users a ON a.id = u.author_id WHERE u.capa_id = $1 ORDER BY u.created_at`, [id]),
      this.ds.query(`SELECT v.*, a.full_name AS verifier_name FROM capa_verifications v JOIN users a ON a.id = v.verifier_id WHERE v.capa_id = $1 ORDER BY v.verified_at`, [id]),
      this.ds.query(`SELECT * FROM capa_extensions WHERE capa_id = $1 ORDER BY created_at`, [id]),
    ]);
    return { ...c, updates, verifications, extensions };
  }

  /** Historial de auditoría inmutable (audit_log) de la CAPA y sus verificaciones. */
  async history(id: string) {
    const [c] = await this.ds.query(`SELECT 1 FROM capas WHERE id = $1`, [id]);
    if (!c) throw new NotFoundException('CAPA no encontrada');
    return this.ds.query(
      `SELECT l.id, l.table_name, l.action, l.actor_id, u.full_name AS actor_name, l.old_data, l.new_data, l.changed_at
         FROM audit_log l LEFT JOIN users u ON u.id = l.actor_id
        WHERE (l.table_name = 'capas' AND l.record_id = $1)
           OR (l.table_name = 'capa_verifications' AND l.new_data->>'capa_id' = $1)
        ORDER BY l.id`, [id]);
  }
}
