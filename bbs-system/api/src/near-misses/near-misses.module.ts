import { Module } from '@nestjs/common';
import { AlertsModule } from '../alerts/alerts.module';
import { NearMissesController } from './near-misses.controller';
import { NearMissesService } from './near-misses.service';

@Module({ imports: [AlertsModule], controllers: [NearMissesController], providers: [NearMissesService] })
export class NearMissesModule {}
