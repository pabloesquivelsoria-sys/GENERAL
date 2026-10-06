import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class KpiQuery {
  @IsOptional() @IsUUID() site_id?: string;
  /** ISO 8601; por defecto hace 30 días. */
  @IsOptional() @IsDateString() from?: string;
  /** ISO 8601 (exclusivo); por defecto ahora. */
  @IsOptional() @IsDateString() to?: string;
}

export class TopBehaviorsQuery extends KpiQuery {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) limit: number = 10;
}

export class TrendQuery extends KpiQuery {
  @IsOptional() @IsIn(['day', 'week', 'month']) bucket: 'day' | 'week' | 'month' = 'week';
}

export class SnapshotQuery {
  @IsOptional() @IsUUID() site_id?: string;
  @IsOptional() @IsIn(['safe_behavior_rate_pct', 'avg_capa_close_days', 'capa_on_time_close_pct', 'capa_overdue_now', 'observations_count', 'near_miss_count'])
  metric?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(730) days: number = 90;
}
