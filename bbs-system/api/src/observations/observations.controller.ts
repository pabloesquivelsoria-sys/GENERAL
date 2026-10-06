import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { AuthUser } from '../common/auth-user';
import { CurrentUser, Roles } from '../common/decorators';
import { ChangeObservationStatusDto, CreateObservationDto, ListObservationsQuery } from './observations.dto';
import { ObservationsService } from './observations.service';

@Controller('observations')
export class ObservationsController {
  constructor(private svc: ObservationsService) {}

  @Post() @Roles('observer', 'supervisor', 'ehs_manager', 'site_manager')
  create(@CurrentUser() u: AuthUser, @Body() dto: CreateObservationDto) { return this.svc.create(u, dto); }

  @Get()
  list(@Query() q: ListObservationsQuery) { return this.svc.list(q); }

  @Get('catalog')
  catalog() { return this.svc.catalog(); }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) { return this.svc.get(id); }

  @Patch(':id/status') @HttpCode(200) @Roles('observer', 'supervisor', 'ehs_manager', 'site_manager')
  status(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ChangeObservationStatusDto) {
    return this.svc.changeStatus(u, id, dto.status);
  }
}
