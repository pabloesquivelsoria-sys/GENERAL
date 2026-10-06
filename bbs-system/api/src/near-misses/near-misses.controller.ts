import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { AuthUser } from '../common/auth-user';
import { CurrentUser, Roles } from '../common/decorators';
import { ChangeNearMissStatusDto, CreateNearMissDto, ListNearMissesQuery, UpdateNearMissDto } from './near-misses.dto';
import { NearMissesService } from './near-misses.service';

@Controller('near-misses')
export class NearMissesController {
  constructor(private svc: NearMissesService) {}

  /** Cualquier usuario autenticado (salvo solo-lectura) puede reportar un casi-accidente. */
  @Post() @Roles('observer', 'supervisor', 'ehs_manager', 'site_manager', 'capa_owner')
  create(@CurrentUser() u: AuthUser, @Body() dto: CreateNearMissDto) { return this.svc.create(u, dto); }

  @Get()
  list(@Query() q: ListNearMissesQuery) { return this.svc.list(q); }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) { return this.svc.get(id); }

  @Patch(':id') @HttpCode(200) @Roles('supervisor', 'ehs_manager', 'site_manager')
  update(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateNearMissDto) {
    return this.svc.update(u, id, dto);
  }

  @Post(':id/status') @HttpCode(200) @Roles('supervisor', 'ehs_manager', 'site_manager')
  status(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ChangeNearMissStatusDto) {
    return this.svc.changeStatus(u, id, dto);
  }
}
