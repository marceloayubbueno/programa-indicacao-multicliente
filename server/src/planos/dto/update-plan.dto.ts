import { IsString, IsOptional, IsNumber, IsObject } from 'class-validator';

export class UpdatePlanDto {
  @IsString()
  @IsOptional()
  nome?: string;

  @IsString()
  @IsOptional()
  descricao?: string;

  @IsNumber()
  @IsOptional()
  preco?: number;

  @IsNumber()
  @IsOptional()
  periodoTrial?: number;

  @IsNumber()
  @IsOptional()
  limiteIndicadores?: number;

  @IsNumber()
  @IsOptional()
  limiteIndicacoes?: number;

  @IsObject()
  @IsOptional()
  funcionalidades?: Record<string, boolean>;
} 