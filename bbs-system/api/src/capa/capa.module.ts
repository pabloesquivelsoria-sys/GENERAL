import { Module } from '@nestjs/common';
import { AlertsModule } from '../alerts/alerts.module';
import { CapaController } from './capa.controller';
import { CapaService } from './capa.service';

@Module({ imports: [AlertsModule], controllers: [CapaController], providers: [CapaService] })
export class CapaModule {}
