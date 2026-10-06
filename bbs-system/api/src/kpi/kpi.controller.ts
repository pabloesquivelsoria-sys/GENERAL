import { Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import { Roles } from '../common/decorators';
import { KpiQuery, SnapshotQuery, TopBehaviorsQuery, TrendQuery } from './kpi.dto';
import { KpiService } from './kpi.service';

@Controller('kpi')
export class KpiController {
  constructor(private svc: KpiService) {}

  @Get('summary') summary(@Query() q: KpiQuery) { return this.svc.summary(q); }
  @Get('top-at-risk-behaviors') top(@Query() q: TopBehaviorsQuery) { return this.svc.topAtRisk(q); }
  @Get('safe-rate-trend') trend(@Query() q: TrendQuery) { return this.svc.safeRateTrend(q); }
  @Get('capa-summary') capa(@Query('site_id') siteId?: string) { return this.svc.capaSummary(siteId); }
  @Get('snapshots') snapshots(@Query() q: SnapshotQuery) { return this.svc.snapshots(q); }

  @Post('snapshots/run') @HttpCode(200) @Roles('ehs_manager')
  run() { return this.svc.takeSnapshots(); }
}
