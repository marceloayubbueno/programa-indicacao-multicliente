import { PartialType } from '@nestjs/mapped-types';
import { CreateLPIndicadoresDto } from './create-lp-indicadores.dto';
import { IsOptional, IsString } from 'class-validator';
 
export class UpdateLPIndicadoresDto extends PartialType(CreateLPIndicadoresDto) {
  @IsOptional()
  @IsString()
  lastModifiedBy?: string;

  // 🆕 Campos adicionais para vinculação com campanha
  @IsOptional()
  @IsString()
  campaignName?: string;
} 