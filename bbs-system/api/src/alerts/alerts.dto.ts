import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsUUID } from 'class-validator';
import { ALERT_TYPES, AlertType } from '../common/enums';
import { PageQuery } from '../common/pagination';

export const ALERT_STATUSES = ['open', 'acknowledged', 'resolved'] as const;

export class ListAlertsQuery extends PageQuery {
  @IsOptional() @IsIn(ALERT_STATUSES as unknown as string[]) status?: string;
  @IsOptional() @IsIn(ALERT_TYPES as unknown as string[]) type?: AlertType;
  @IsOptional() @IsUUID() site_id?: string;
  /** true (default): solo alertas dirigidas al usuario. false: todas (solo gerentes). */
  @IsOptional() @Transform(({ value }) => value === 'true' || value === true) @IsBoolean()
  mine?: boolean = true;
  @IsOptional() @Transform(({ value }) => value === 'true' || value === true) @IsBoolean()
  unread?: boolean;
}

export interface RaiseAlertInput {
  type: AlertType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  siteId: string | null;
  areaId?: string | null;
  title: string;
  message?: string;
  entityType: 'observation' | 'near_miss' | 'capa';
  entityId: string;
  escalationLevel?: number;
  dedupeKey?: string;
  recipientIds: string[];
}
