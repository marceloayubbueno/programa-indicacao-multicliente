import { IsEnum, IsNumber, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { RewardType } from '../entities/reward.schema';

export class CreateRewardDto {
  // CAMPOS EXISTENTES (NÃO ALTERAR - JÁ FUNCIONAM)
  @IsEnum(RewardType)
  type: RewardType;

  @IsNumber()
  value: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  campaign?: string;

  @IsString()
  @IsOptional()
  indicator?: string;

  @IsString()
  @IsNotEmpty({ message: 'clientId é obrigatório' })
  clientId: string;

  // CAMPOS ADICIONAIS PARA NOVOS TIPOS (OPCIONAIS - NÃO QUEBRAM FUNCIONALIDADE EXISTENTE)
  @IsNumber()
  @IsOptional()
  fixedValue?: number;

  @IsNumber()
  @IsOptional()
  percentageValue?: number;

  @IsNumber()
  @IsOptional()
  baseValue?: number;

  @IsString()
  @IsOptional()
  cupomCode?: string;

  @IsNumber()
  @IsOptional()
  validadeDias?: number;

  @IsNumber()
  @IsOptional()
  limiteUso?: number;
} 