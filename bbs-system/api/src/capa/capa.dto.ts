import { Transform } from 'class-transformer';
import {
  IsBoolean, IsIn, IsOptional, IsString, IsUUID, Matches, MaxLength, MinLength,
} from 'class-validator';
import {
  CAPA_SOURCES, CAPA_STATUSES, CAPA_TYPES, CONTROL_LEVELS, CapaSource, CapaStatus, CapaType, ControlLevel, Priority, SEVERITIES,
} from '../common/enums';
import { PageQuery } from '../common/pagination';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const DATE_MSG = 'debe tener formato YYYY-MM-DD';
const PRIORITIES = SEVERITIES as unknown as string[];

export class CreateCapaDto {
  @IsUUID() site_id: string;
  @IsOptional() @IsUUID() area_id?: string;
  @IsString() @MinLength(5) @MaxLength(200) title: string;
  @IsString() @MinLength(10) @MaxLength(5000) description: string;
  @IsOptional() @IsIn(CAPA_TYPES as unknown as string[]) type?: CapaType;
  @IsOptional() @IsIn(CONTROL_LEVELS as unknown as string[]) control_level?: ControlLevel;
  /** Si se omite se infiere de source_observation_id / source_near_miss_id. */
  @IsOptional() @IsIn(CAPA_SOURCES as unknown as string[]) source?: CapaSource;
  @IsOptional() @IsUUID() source_observation_id?: string;
  @IsOptional() @IsUUID() source_observation_item_id?: string;
  @IsOptional() @IsUUID() source_near_miss_id?: string;
  @IsOptional() @IsString() @MaxLength(5000) root_cause?: string;
  @IsOptional() @IsIn(PRIORITIES) priority?: Priority;
  @IsUUID() owner_id: string;
  @IsOptional() @IsUUID() verifier_id?: string;
  @Matches(DATE, { message: `due_date ${DATE_MSG}` }) due_date: string;
}

export class UpdateCapaDto {
  @IsOptional() @IsString() @MinLength(5) @MaxLength(200) title?: string;
  @IsOptional() @IsString() @MinLength(10) @MaxLength(5000) description?: string;
  @IsOptional() @IsIn(CONTROL_LEVELS as unknown as string[]) control_level?: ControlLevel;
  @IsOptional() @IsString() @MaxLength(5000) root_cause?: string;
  @IsOptional() @IsIn(PRIORITIES) priority?: Priority;
  @IsOptional() @IsUUID() owner_id?: string;
  @IsOptional() @IsUUID() verifier_id?: string;
}

export class TransitionCapaDto {
  @IsIn(CAPA_STATUSES as unknown as string[]) to: CapaStatus;
  /** Obligatorio para verification (evidencia de implementación), cancelled (motivo) y rechazo. */
  @IsOptional() @IsString() @MaxLength(4000) comment?: string;
}

export class VerifyCapaDto {
  @IsBoolean() is_effective: boolean;
  @IsOptional() @IsString() @MaxLength(500) method?: string;
  @IsString() @MinLength(5) @MaxLength(4000) findings: string;
  @IsOptional() @IsUUID() follow_up_observation_id?: string;
}

export class RequestExtensionDto {
  @Matches(DATE, { message: `new_due_date ${DATE_MSG}` }) new_due_date: string;
  @IsString() @MinLength(10) @MaxLength(2000) reason: string;
}

export class DecideExtensionDto {
  @IsBoolean() approved: boolean;
}

export class AddCapaCommentDto {
  @IsString() @MinLength(1) @MaxLength(4000) comment: string;
}

export class ListCapaQuery extends PageQuery {
  @IsOptional() @IsUUID() site_id?: string;
  @IsOptional() @IsUUID() area_id?: string;
  @IsOptional() @IsUUID() owner_id?: string;
  @IsOptional() @IsIn(CAPA_STATUSES as unknown as string[]) status?: CapaStatus;
  @IsOptional() @IsIn(PRIORITIES) priority?: Priority;
  @IsOptional() @IsIn(CAPA_SOURCES as unknown as string[]) source?: CapaSource;
  @IsOptional() @Transform(({ value }) => value === 'true' || value === true) @IsBoolean() overdue?: boolean;
  @IsOptional() @Transform(({ value }) => value === 'true' || value === true) @IsBoolean() mine?: boolean;
}
