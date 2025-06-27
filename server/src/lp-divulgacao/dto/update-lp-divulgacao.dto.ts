import { PartialType } from '@nestjs/mapped-types';
import { CreateLPDivulgacaoDto } from './create-lp-divulgacao.dto';
import { IsOptional, IsString, IsObject } from 'class-validator';
 
export class UpdateLPDivulgacaoDto extends PartialType(CreateLPDivulgacaoDto) {
  @IsOptional()
  @IsString()
  lastModifiedBy?: string;

  @IsOptional()
  @IsString()
  redirectUrl?: string;

  @IsOptional()
  @IsObject()
  utmParams?: Record<string, string>;
} 