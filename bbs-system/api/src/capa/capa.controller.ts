import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { AuthUser } from '../common/auth-user';
import { CurrentUser, Roles } from '../common/decorators';
import {
  AddCapaCommentDto, CreateCapaDto, DecideExtensionDto, ListCapaQuery, RequestExtensionDto, TransitionCapaDto, UpdateCapaDto, VerifyCapaDto,
} from './capa.dto';
import { CapaService } from './capa.service';

@Controller('capa')
export class CapaController {
  constructor(private svc: CapaService) {}

  @Post() @Roles('supervisor', 'ehs_manager', 'site_manager')
  create(@CurrentUser() u: AuthUser, @Body() dto: CreateCapaDto) { return this.svc.create(u, dto); }

  @Get()
  list(@CurrentUser() u: AuthUser, @Query() q: ListCapaQuery) { return this.svc.list(u, q); }

  /** Aprobar/rechazar una solicitud de extensión de plazo. */
  @Post('extensions/:extId/decision') @HttpCode(200) @Roles('ehs_manager', 'site_manager')
  decide(@CurrentUser() u: AuthUser, @Param('extId', ParseUUIDPipe) extId: string, @Body() dto: DecideExtensionDto) {
    return this.svc.decideExtension(u, extId, dto);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) { return this.svc.get(id); }

  @Get(':id/history')
  history(@Param('id', ParseUUIDPipe) id: string) { return this.svc.history(id); }

  @Patch(':id') @HttpCode(200) @Roles('supervisor', 'ehs_manager', 'site_manager')
  update(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCapaDto) {
    return this.svc.update(u, id, dto);
  }

  @Post(':id/transition') @HttpCode(200) @Roles('capa_owner', 'supervisor', 'ehs_manager', 'site_manager')
  transition(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: TransitionCapaDto) {
    return this.svc.transition(u, id, dto);
  }

  @Post(':id/verifications') @Roles('supervisor', 'ehs_manager', 'site_manager', 'capa_owner', 'observer')
  verify(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: VerifyCapaDto) {
    return this.svc.verify(u, id, dto);
  }

  @Post(':id/comments') @Roles('capa_owner', 'supervisor', 'ehs_manager', 'site_manager', 'observer')
  comment(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: AddCapaCommentDto) {
    return this.svc.comment(u, id, dto);
  }

  @Post(':id/extensions') @Roles('capa_owner', 'supervisor', 'ehs_manager', 'site_manager')
  extend(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: RequestExtensionDto) {
    return this.svc.requestExtension(u, id, dto);
  }
}
