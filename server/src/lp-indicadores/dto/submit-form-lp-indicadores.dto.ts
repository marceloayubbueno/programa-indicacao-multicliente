import { IsString, IsEmail, IsOptional, IsObject, IsUrl } from 'class-validator';

export class SubmitFormLPIndicadoresDto {
  @IsString()
  name: string;

  @IsEmail({}, { message: 'Por favor, informe um e-mail válido.' })
  email: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  company?: string;

  // === RASTREAMENTO DE ORIGEM ===
  @IsString()
  lpId: string; // ID da LP de origem

  @IsOptional()
  @IsString()
  campaignId?: string; // ID da campanha (se vinculada)

  // === UTM PARAMETERS ===
  @IsOptional()
  @IsString()
  utmSource?: string;

  @IsOptional()
  @IsString()
  utmMedium?: string;

  @IsOptional()
  @IsString()
  utmCampaign?: string;

  @IsOptional()
  @IsString()
  utmContent?: string;

  @IsOptional()
  @IsString()
  utmTerm?: string;

  // === METADADOS TÉCNICOS ===
  @IsOptional()
  @IsUrl()
  referrerUrl?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  // === CAMPOS PERSONALIZADOS ===
  @IsOptional()
  @IsObject()
  customFields?: Record<string, any>;

  // === DADOS ADICIONAIS DO FORMULÁRIO ===
  @IsOptional()
  @IsObject()
  formData?: Record<string, any>;
} 