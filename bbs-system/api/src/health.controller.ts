import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Public } from './common/decorators';
import { RedisService } from './database/redis.service';

@Controller('health')
export class HealthController {
  constructor(private ds: DataSource, private redis: RedisService) {}

  @Public()
  @Get()
  async health() {
    let db = false;
    try { await this.ds.query('SELECT 1'); db = true; } catch { /* down */ }
    const redis = await this.redis.ping();
    const body = { status: db ? (redis ? 'ok' : 'degraded') : 'down', db, redis, uptime_s: Math.round(process.uptime()) };
    if (!db) throw new ServiceUnavailableException(body);
    return body;
  }
}
