import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { AuthUser } from '../common/auth-user';
import { CurrentUser, Roles } from '../common/decorators';
import { ImportBenchmarkDto } from './imports.dto';
import { ImportsService } from './imports.service';

@Controller('imports')
export class ImportsController {
  constructor(private svc: ImportsService) {}

  /** Absorbe acciones exportadas de Benchmark (tablero OK) como CAPAs; idempotente por id externo. */
  @Post('benchmark/capa') @HttpCode(200) @Roles('admin', 'ehs_manager')
  benchmark(@CurrentUser() u: AuthUser, @Body() dto: ImportBenchmarkDto) { return this.svc.importBenchmark(u, dto); }

  @Get('runs') @Roles('admin', 'ehs_manager')
  runs(@Query('limit') limit?: string) { return this.svc.runs(limit ? Number(limit) || 20 : 20); }

  @Get('runs/:id') @Roles('admin', 'ehs_manager')
  run(@Param('id', ParseUUIDPipe) id: string) { return this.svc.run(id); }
}
