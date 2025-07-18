import { IsString, IsOptional, IsEnum, IsArray, IsObject, IsNumber, IsBoolean, IsDateString } from 'class-validator';

export class CreateEmailTemplateDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  htmlContent: string;

  @IsString()
  clientId: string;

  @IsEnum(['welcome', 'campaign', 'flow', 'notification'])
  type: string;

  @IsOptional()
  @IsEnum(['active', 'inactive', 'draft'])
  status?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  variables?: string[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  fromName?: string;

  @IsOptional()
  @IsString()
  fromEmail?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
} 