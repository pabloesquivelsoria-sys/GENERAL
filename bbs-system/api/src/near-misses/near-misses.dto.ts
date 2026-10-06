
import {
  ArrayUnique, IsArray, IsBoolean, IsDateString, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength,
} from 'class-validator';
import { NEAR_MISS_STATUSES, NearMissStatus, SEVERITIES, Severity } from '../common/enums';
import { PageQuery } from '../common/pagination';

export class CreateNearMissDto {
  @IsUUID() site_id: string;
  @IsOptional() @IsUUID() area_id?: string;
  @IsOptional() @IsString() @MaxLength(500) location_detail?: string;
  @IsOptional() @IsDateString() occurred_at?: string;
  @IsString() @MinLength(5) @MaxLength(200) title: string;
  @IsString() @MinLength(10) @MaxLength(5000) description: string;
  @IsOptional() @IsIn(SEVERITIES as unknown as string[]) potential_severity?: Severity;
  @IsOptional() @IsInt() @Min(1) @Max(5) likelihood?: number;
  /** true: no se guarda quién reporta. */
  @IsOptional() @IsBoolean() is_anonymous?: boolean;
  @IsOptional() @IsUUID() related_observation_id?: string;
  @IsOptional() @IsUUID() related_behavior_id?: string;
  @IsOptional() @IsString() @MaxLength(2000) immediate_action?: string;
  @IsOptional() @IsArray() @ArrayUnique() @IsInt({ each: true }) factor_ids?: number[];
}

export class UpdateNearMissDto {
  @IsOptional() @IsString() @MaxLength(5000) root_cause?: string;
  @IsOptional() @IsIn(SEVERITIES as unknown as string[]) potential_severity?: Severity;
  @IsOptional() @IsInt() @Min(1) @Max(5) likelihood?: number;
  @IsOptional() @IsString() @MaxLength(2000) immediate_action?: string;
  @IsOptional() @IsArray() @ArrayUnique() @IsInt({ each: true }) factor_ids?: number[];
}

export class ChangeNearMissStatusDto {
  @IsIn(NEAR_MISS_STATUSES as unknown as string[]) status: NearMissStatus;
  @IsOptional() @IsString() @MaxLength(2000) comment?: string;
}

export class ListNearMissesQuery extends PageQuery {
  @IsOptional() @IsUUID() site_id?: string;
  @IsOptional() @IsUUID() area_id?: string;
  @IsOptional() @IsIn(NEAR_MISS_STATUSES as unknown as string[]) status?: NearMissStatus;
  @IsOptional() @IsIn(SEVERITIES as unknown as string[]) potential_severity?: Severity;
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
}
