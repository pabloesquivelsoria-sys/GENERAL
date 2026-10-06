import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { AuthUser } from '../common/auth-user';
import { CurrentUser, Public, Roles } from '../common/decorators';
import { RoleCode } from '../common/enums';
import { AssignRoleDto, LoginDto, RegisterDto } from './auth.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Public() @Post('register')
  register(@Body() dto: RegisterDto) { return this.auth.register(dto); }

  @Public() @Post('login') @HttpCode(200)
  login(@Body() dto: LoginDto) { return this.auth.login(dto); }

  @Get('me')
  me(@CurrentUser() u: AuthUser) { return this.auth.me(u); }

  @Get('users') @Roles('ehs_manager', 'site_manager', 'supervisor')
  users(@Query('q') q?: string) { return this.auth.listUsers(q); }

  @Post('users/:id/roles') @Roles('admin')
  assign(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: AssignRoleDto) {
    return this.auth.assignRole(u, id, dto);
  }

  @Delete('users/:id/roles/:role') @Roles('admin')
  revoke(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Param('role') role: RoleCode,
         @Query('site_id') siteId?: string) {
    return this.auth.revokeRole(u, id, role, siteId);
  }
}
