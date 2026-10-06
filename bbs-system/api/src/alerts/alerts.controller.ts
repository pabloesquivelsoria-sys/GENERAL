import { Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { AuthUser } from '../common/auth-user';
import { CurrentUser, Roles } from '../common/decorators';
import { ListAlertsQuery } from './alerts.dto';
import { AlertsService } from './alerts.service';

@Controller('alerts')
export class AlertsController {
  constructor(private alerts: AlertsService) {}

  @Get()
  list(@CurrentUser() u: AuthUser, @Query() q: ListAlertsQuery) { return this.alerts.list(u, q); }

  @Get('unread-count')
  unread(@CurrentUser() u: AuthUser) { return this.alerts.unreadCount(u); }

  @Post('escalation/run') @HttpCode(200) @Roles('ehs_manager')
  run() { return this.alerts.runEscalation(); }

  @Post(':id/read') @HttpCode(200)
  read(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string) { return this.alerts.markRead(u, id); }

  @Post(':id/acknowledge') @HttpCode(200)
  ack(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string) { return this.alerts.acknowledge(u, id); }

  @Post(':id/resolve') @HttpCode(200) @Roles('ehs_manager', 'site_manager', 'supervisor')
  resolve(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string) { return this.alerts.resolve(u, id); }
}
