import { IsString, IsOptional, IsEnum, IsObject, IsArray, IsBoolean, IsNumber, IsUrl, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';

// DTO para dados do GrapesJS
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

// DTO para campo personalizado do formulário
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

// DTO para configuração do formulário
export class FormConfigDto {
  @IsArray()
  @IsString({ each: true })
  fields: string[];

  @IsOptional()
  @IsUrl()
  submitEndpoint?: string;

  @IsOptional()
  @IsString()
  successMessage?: string;

  @IsOptional()
  @IsUrl()
  redirectUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredFields?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomFieldDto)
  customFields?: CustomFieldDto[];
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

export class CreateLPIndicadoresDto {
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

  // === CONFIGURAÇÃO DO FORMULÁRIO ===
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => FormConfigDto)
  formConfig?: FormConfigDto;

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

  // === AUDITORIA ===
  @IsOptional()
  @IsString()
  createdBy?: string;
} 