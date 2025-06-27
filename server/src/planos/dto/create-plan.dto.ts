import { IsString, IsOptional, IsNumber, IsObject, IsNotEmpty } from 'class-validator';

export class CreatePlanDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsString()
  @IsOptional()
  descricao?: string;

  @IsNumber()
  preco: number;

  @IsNumber()
  periodoTrial: number;

  @IsNumber()
  limiteIndicadores: number;

  @IsNumber()
  limiteIndicacoes: number;

  @IsObject()
  funcionalidades: Record<string, boolean>;
} 