import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RedisService } from '../database/redis.service';
import { AlertsService } from './alerts.service';

/** Barrido periódico de vencimientos. Lock en Redis para que solo una réplica lo ejecute. */
@Injectable()
export class AlertsScheduler {
  private readonly log = new Logger('AlertsScheduler');

  constructor(private alerts: AlertsService, private redis: RedisService, private cfg: ConfigService) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async tick() {
    if (this.cfg.get('SCHEDULER_ENABLED') === 'false') return;
    try {
      await this.redis.withLock('escalation-sweep', 540, () => this.alerts.runEscalation());
    } catch (e) {
      this.log.error(`Fallo en barrido de escalamiento: ${(e as Error).message}`);
    }
  }
}
