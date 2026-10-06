import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsBoolean, IsDateString, IsIn, IsInt, IsOptional, IsString,
  IsUUID, Max, MaxLength, Min, ValidateNested,
} from 'class-validator';
import { BEHAVIOR_RESULTS, BehaviorResult, SEVERITIES, Severity } from '../common/enums';
import { PageQuery } from '../common/pagination';

export const OBSERVATION_STATUSES = ['draft', 'submitted', 'reviewed', 'archived'] as const;
export type ObservationStatus = (typeof OBSERVATION_STATUSES)[number];

export class ObservationItemDto {
  @IsUUID() behavior_id: string;
  @IsIn(BEHAVIOR_RESULTS as unknown as string[]) result: BehaviorResult;
  /** Solo válida si result = at_risk (si se omite, se usa la severidad por defecto del comportamiento). */
  @IsOptional() @IsIn(SEVERITIES as unknown as string[]) severity?: Severity;
  @IsOptional() @IsString() @MaxLength(2000) comment?: string;
  @IsOptional() @IsBoolean() corrected_on_spot?: boolean;
  @IsOptional() @IsArray() @ArrayUnique() @IsInt({ each: true }) factor_ids?: number[];
}

export class CreateObservationDto {
  @IsUUID() site_id: string;
  @IsOptional() @IsUUID() area_id?: string;
  @IsOptional() @IsString() @MaxLength(500) location_detail?: string;
  @IsOptional() @IsUUID() checklist_id?: string;
  @IsOptional() @IsDateString() observed_at?: string;
  @IsOptional() @IsString() @MaxLength(50) shift?: string;
  @IsOptional() @IsString() @MaxLength(500) task_observed?: string;
  @IsOptional() @IsInt() @Min(0) @Max(1440) duration_minutes?: number;
  @IsOptional() @IsInt() @Min(1) @Max(1000) people_observed?: number;
  /** Por defecto true: no se registra la identidad del observado. */
  @IsOptional() @IsBoolean() is_anonymous_observed?: boolean;
  @IsOptional() @IsUUID() observed_user_id?: string;
  @IsOptional() @IsString() @MaxLength(200) observed_name?: string;
  @IsOptional() @IsString() @MaxLength(200) observed_company?: string;
  @IsOptional() @IsBoolean() positive_feedback_given?: boolean;
  @IsOptional() @IsString() @MaxLength(4000) coaching_notes?: string;
  @IsOptional() @IsString() @MaxLength(2000) immediate_action?: string;
  /** true guarda como borrador (sin alertas hasta enviarla). */
  @IsOptional() @IsBoolean() save_as_draft?: boolean;
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(100) @ValidateNested({ each: true }) @Type(() => ObservationItemDto)
  items: ObservationItemDto[];
}

export class ChangeObservationStatusDto {
  @IsIn(OBSERVATION_STATUSES as unknown as string[]) status: ObservationStatus;
}

export class ListObservationsQuery extends PageQuery {
  @IsOptional() @IsUUID() site_id?: string;
  @IsOptional() @IsUUID() area_id?: string;
  @IsOptional() @IsUUID() observer_id?: string;
  @IsOptional() @IsIn(OBSERVATION_STATUSES as unknown as string[]) status?: ObservationStatus;
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
  @IsOptional() @Transform(({ value }) => value === 'true' || value === true) @IsBoolean() has_at_risk?: boolean;
}
