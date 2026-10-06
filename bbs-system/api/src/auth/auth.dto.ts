import { IsEmail, IsIn, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { ROLE_CODES, RoleCode } from '../common/enums';

export class LoginDto {
  @IsEmail() email: string;
  @IsString() @MinLength(1) password: string;
}

export class RegisterDto {
  @IsEmail() email: string;
  @IsString() @MinLength(10) @MaxLength(128) password: string;
  @IsString() @MinLength(2) @MaxLength(200) full_name: string;
  @IsOptional() @IsString() @MaxLength(50) employee_code?: string;
  @IsOptional() @IsString() @MaxLength(100) job_title?: string;
  @IsOptional() @IsUUID() supervisor_id?: string;
  @IsOptional() @IsUUID() home_site_id?: string;
  @IsOptional() @IsUUID() home_area_id?: string;
}

export class AssignRoleDto {
  @IsIn(ROLE_CODES as unknown as string[]) role: RoleCode;
  @IsOptional() @IsUUID() site_id?: string;
}
