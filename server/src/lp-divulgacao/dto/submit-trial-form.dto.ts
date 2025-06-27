// Arquivo descontinuado: não utilizar para LP de Divulgação
// TODO: Remover definitivamente após validação do fluxo de indicações
/*
import { IsString, IsEmail, IsOptional, IsObject, IsUrl, IsNumber } from 'class-validator';

export class SubmitTrialFormDto {
  @IsString()
  name: string;

  @IsEmail()
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

  // === CONFIGURAÇÃO DO TESTE GRÁTIS ===
  @IsOptional()
  @IsNumber()
  trialDuration?: number; // Duração em dias

  @IsOptional()
  @IsString()
  productInterest?: string; // Produto/serviço de interesse

  // === CAMPOS PERSONALIZADOS ===
  @IsOptional()
  @IsObject()
  customFields?: Record<string, any>;

  // === DADOS ADICIONAIS DO FORMULÁRIO ===
  @IsOptional()
  @IsObject()
  formData?: Record<string, any>;

  // === INFORMAÇÕES DE QUALIFICAÇÃO ===
  @IsOptional()
  @IsString()
  companySize?: string; // Tamanho da empresa

  @IsOptional()
  @IsString()
  industry?: string; // Setor/indústria

  @IsOptional()
  @IsString()
  role?: string; // Cargo/função

  @IsOptional()
  @IsString()
  budget?: string; // Orçamento disponível

  @IsOptional()
  @IsString()
  timeline?: string; // Prazo para implementação
}
*/ 