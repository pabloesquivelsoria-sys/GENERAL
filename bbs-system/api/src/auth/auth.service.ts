import { ConflictException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import { AuthUser } from '../common/auth-user';
import { withActor } from '../common/db';
import { RoleCode } from '../common/enums';
import { AssignRoleDto, LoginDto, RegisterDto } from './auth.dto';

// hash señuelo para igualar el tiempo de respuesta cuando el usuario no existe
const DUMMY_HASH = bcrypt.hashSync('no-such-user', 12);

@Injectable()
export class AuthService {
  constructor(private ds: DataSource, private jwt: JwtService, private cfg: ConfigService) {}

  private async rolesOf(userId: string): Promise<RoleCode[]> {
    const rows = await this.ds.query(
      `SELECT DISTINCT r.code FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = $1`, [userId]);
    return rows.map((r: { code: RoleCode }) => r.code);
  }

  private async token(u: { id: string; email: string }) {
    const roles = await this.rolesOf(u.id);
    return { access_token: await this.jwt.signAsync({ sub: u.id, email: u.email, roles }), roles };
  }

  async register(dto: RegisterDto) {
    if (this.cfg.get('ALLOW_SELF_REGISTER') === 'false') throw new ForbiddenException('Registro deshabilitado');
    const hash = await bcrypt.hash(dto.password, 12);
    try {
      const user = await withActor(this.ds, null, async (m) => {
        const [{ n }] = await m.query(`SELECT count(*)::int AS n FROM users`);
        const [u] = await m.query(
          `INSERT INTO users(email, full_name, password_hash, employee_code, job_title, supervisor_id, home_site_id, home_area_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id, email, full_name`,
          [dto.email, dto.full_name, hash, dto.employee_code ?? null, dto.job_title ?? null,
           dto.supervisor_id ?? null, dto.home_site_id ?? null, dto.home_area_id ?? null]);
        // el primer usuario del sistema es admin (bootstrap); el resto entra como observador
        const role = n === 0 ? 'admin' : 'observer';
        await m.query(`INSERT INTO user_roles(user_id, role_id) SELECT $1, id FROM roles WHERE code = $2`, [u.id, role]);
        return u;
      });
      return { user, ...(await this.token(user)) };
    } catch (e: any) {
      if (e?.code === '23505') throw new ConflictException('Email o código de empleado ya registrado');
      if (e?.code === '23503') throw new NotFoundException('supervisor/sitio/área inexistente');
      throw e;
    }
  }

  async login(dto: LoginDto) {
    const [u] = await this.ds.query(
      `SELECT id, email, full_name, password_hash, is_active FROM users WHERE email = $1`, [dto.email]);
    // comparación siempre ejecutada para no filtrar existencia de cuenta por tiempo
    const ok = await bcrypt.compare(dto.password, u?.password_hash ?? DUMMY_HASH);
    if (!u || !ok || !u.is_active) throw new UnauthorizedException('Credenciales inválidas');
    await this.ds.query(`UPDATE users SET last_login_at = now() WHERE id = $1`, [u.id]);
    return { user: { id: u.id, email: u.email, full_name: u.full_name }, ...(await this.token(u)) };
  }

  async me(user: AuthUser) {
    const [u] = await this.ds.query(
      `SELECT id, email, full_name, employee_code, job_title, supervisor_id, home_site_id, home_area_id, last_login_at
       FROM users WHERE id = $1 AND is_active`, [user.id]);
    if (!u) throw new UnauthorizedException();
    return { ...u, roles: await this.rolesOf(user.id) };
  }

  async assignRole(actor: AuthUser, userId: string, dto: AssignRoleDto) {
    await withActor(this.ds, actor.id, async (m) => {
      const [u] = await m.query(`SELECT 1 FROM users WHERE id = $1`, [userId]);
      if (!u) throw new NotFoundException('Usuario no encontrado');
      await m.query(
        `INSERT INTO user_roles(user_id, role_id, site_id) SELECT $1, id, $3 FROM roles WHERE code = $2
         ON CONFLICT DO NOTHING`, [userId, dto.role, dto.site_id ?? null]);
    });
    return { user_id: userId, roles: await this.rolesOf(userId) };
  }

  async revokeRole(actor: AuthUser, userId: string, role: RoleCode, siteId?: string) {
    await withActor(this.ds, actor.id, (m) => m.query(
      `DELETE FROM user_roles WHERE user_id = $1 AND site_id IS NOT DISTINCT FROM $3
         AND role_id = (SELECT id FROM roles WHERE code = $2)`, [userId, role, siteId ?? null]));
    return { user_id: userId, roles: await this.rolesOf(userId) };
  }

  async listUsers(search?: string) {
    return this.ds.query(
      `SELECT u.id, u.email, u.full_name, u.job_title, u.is_active, u.home_site_id,
              COALESCE(array_agg(DISTINCT r.code) FILTER (WHERE r.code IS NOT NULL), '{}') AS roles
       FROM users u LEFT JOIN user_roles ur ON ur.user_id = u.id LEFT JOIN roles r ON r.id = ur.role_id
       WHERE ($1::text IS NULL OR u.full_name ILIKE '%' || $1 || '%' OR u.email::text ILIKE '%' || $1 || '%')
       GROUP BY u.id ORDER BY u.full_name LIMIT 200`, [search ?? null]);
  }
}
