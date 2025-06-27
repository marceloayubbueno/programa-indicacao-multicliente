import { IsString, IsOptional, IsEnum, IsObject, IsArray, IsBoolean, IsNumber, IsUrl, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// DTO para dados do GrapesJS (reutilizando estrutura)
export class GrapesJSDataDto {
  @IsArray()
  components: any[];

  @IsArray()
  styles: any[];

  @IsArray()
  assets: any[];
}

// DTO para saída compilada
export class CompiledOutputDto {
  @IsString()
  html: string;

  @IsString()
  css: string;
}

// DTO para metadados
export class LPMetadataDto {
  @IsArray()
  @IsString({ each: true })
  blocksUsed: string[];

  @IsString()
  version: string;

  @IsOptional()
  @IsString()
  editorVersion?: string;
}

// DTO para campo personalizado do formulário de trial
export class CustomFieldDto {
  @IsString()
  name: string;

  @IsString()
  type: string;

  @IsString()
  label: string;

  @IsOptional()
  @IsString()
  placeholder?: string;

  @IsOptional()
  @IsBoolean()
  required?: boolean;
}

// DTO para configuração de email provider
export class EmailProviderDto {
  @IsEnum(['mailchimp', 'sendgrid', 'custom'])
  provider: string;

  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsString()
  listId?: string;
}

// DTO para configuração de analytics
export class AnalyticsConfigDto {
  @IsOptional()
  @IsString()
  googleAnalyticsId?: string;

  @IsOptional()
  @IsString()
  facebookPixelId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  customEvents?: string[];
}

// DTO para configuração de integração
export class IntegrationConfigDto {
  @IsOptional()
  @IsUrl()
  crmWebhook?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => EmailProviderDto)
  emailProvider?: EmailProviderDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AnalyticsConfigDto)
  analyticsConfig?: AnalyticsConfigDto;
}

// DTO para público-alvo
export class TargetAudienceDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  demographics?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  painPoints?: string[];
}

// DTO para códigos de rastreamento
export class TrackingCodesDto {
  @IsOptional()
  @IsString()
  googleAnalytics?: string;

  @IsOptional()
  @IsString()
  facebookPixel?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  customScripts?: string[];
}

export class CreateLPDivulgacaoDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['draft', 'published', 'inactive'])
  status?: string;

  @IsString()
  clientId: string;

  @IsOptional()
  @IsString()
  campaignId?: string;

  @IsOptional()
  @IsString()
  lpdedivulgacaoId?: string;

  // === CONTEÚDO GRAPESJS ===
  @IsObject()
  @ValidateNested()
  @Type(() => GrapesJSDataDto)
  grapesData: GrapesJSDataDto;

  @IsObject()
  @ValidateNested()
  @Type(() => CompiledOutputDto)
  compiledOutput: CompiledOutputDto;

  @IsObject()
  @ValidateNested()
  @Type(() => LPMetadataDto)
  metadata: LPMetadataDto;

  // === SEO E METADADOS ===
  @IsOptional()
  @IsString()
  metaTitle?: string;

  @IsOptional()
  @IsString()
  metaDescription?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  metaKeywords?: string[];

  @IsOptional()
  @IsUrl()
  ogImage?: string;

  // === CONFIGURAÇÕES AVANÇADAS ===
  @IsOptional()
  @IsString()
  customCSS?: string;

  @IsOptional()
  @IsString()
  customJS?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => TrackingCodesDto)
  trackingCodes?: TrackingCodesDto;

  // === INTEGRAÇÃO E AUTOMAÇÃO ===
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => IntegrationConfigDto)
  integrationConfig?: IntegrationConfigDto;

  // === CONFIGURAÇÃO DE PRODUTO/SERVIÇO ===
  @IsOptional()
  @IsString()
  productName?: string;

  @IsOptional()
  @IsNumber()
  productPrice?: number;

  @IsOptional()
  @IsString()
  productDescription?: string;

  // === TEMPLATES ===
  @IsOptional()
  @IsString()
  templateId?: string;

  @IsOptional()
  @IsString()
  parentLPId?: string;

  @IsOptional()
  @IsBoolean()
  isTemplate?: boolean;

  // === CONFIGURAÇÃO DE FUNIL ===
  @IsOptional()
  @IsEnum(['awareness', 'consideration', 'decision'])
  funnelStage?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => TargetAudienceDto)
  targetAudience?: TargetAudienceDto;

  // === AUDITORIA ===
  @IsOptional()
  @IsString()
  createdBy?: string;

  @IsOptional()
  @IsString()
  redirectUrl?: string;

  @IsOptional()
  @IsObject()
  utmParams?: Record<string, string>;
} 