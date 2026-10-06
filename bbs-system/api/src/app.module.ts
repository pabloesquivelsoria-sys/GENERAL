import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AlertsModule } from './alerts/alerts.module';
import { AuthModule } from './auth/auth.module';
import { CapaModule } from './capa/capa.module';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health.controller';
import { ImportsModule } from './imports/imports.module';
import { KpiModule } from './kpi/kpi.module';
import { NearMissesModule } from './near-misses/near-misses.module';
import { ObservationsModule } from './observations/observations.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    AlertsModule,
    ObservationsModule,
    NearMissesModule,
    CapaModule,
    KpiModule,
    ImportsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
