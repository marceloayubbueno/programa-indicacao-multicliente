import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean, IsEmail } from 'class-validator';

export class CreateEmailConfigDto {
  @IsString()
  clientId: string;

  @IsString()
  smtpHost: string;

  @IsOptional()
  @IsNumber()
  smtpPort?: number;

  @IsString()
  smtpUser: string;

  @IsString()
  smtpPassword: string;

  @IsEmail()
  fromEmail: string;

  @IsString()
  fromName: string;

  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: string;

  @IsOptional()
  @IsBoolean()
  isSecure?: boolean;

  @IsOptional()
  @IsEmail()
  replyTo?: string;
} 