import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AuthUser } from './auth-user';
import { IS_PUBLIC, ROLES_KEY } from './decorators';
import { RoleCode } from './enums';

/** Guard global: exige JWT Bearer salvo en rutas @Public(). */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private reflector: Reflector, private jwt: JwtService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [ctx.getHandler(), ctx.getClass()])) return true;
    const req = ctx.switchToHttp().getRequest();
    const header: string | undefined = req.headers['authorization'];
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
    if (!token) throw new UnauthorizedException('Token requerido');
    try {
      const p = await this.jwt.verifyAsync<{ sub: string; email: string; roles: RoleCode[] }>(token);
      req.user = { id: p.sub, email: p.email, roles: p.roles } satisfies AuthUser;
      return true;
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}

/** Guard global: si la ruta tiene @Roles(...), el usuario necesita al menos uno (admin siempre pasa). */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<RoleCode[]>(ROLES_KEY, [ctx.getHandler(), ctx.getClass()]);
    if (!required?.length) return true;
    const user: AuthUser | undefined = ctx.switchToHttp().getRequest().user;
    if (!user) throw new UnauthorizedException();
    if (user.roles.includes('admin') || required.some((r) => user.roles.includes(r))) return true;
    throw new ForbiddenException('Rol insuficiente');
  }
}
