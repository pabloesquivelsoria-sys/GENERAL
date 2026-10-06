import { Module } from '@nestjs/common';
import { AlertsModule } from '../alerts/alerts.module';
import { ObservationsController } from './observations.controller';
import { ObservationsService } from './observations.service';

@Module({ imports: [AlertsModule], controllers: [ObservationsController], providers: [ObservationsService] })
export class ObservationsModule {}
