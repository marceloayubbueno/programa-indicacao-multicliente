import { IsEnum, IsNumber, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { RewardType } from '../entities/reward.schema';

export class CreateRewardDto {
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
} 