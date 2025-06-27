import { PartialType } from '@nestjs/mapped-types';
import { CreateRewardDto } from './create-reward.dto';
import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { RewardStatus } from '../entities/reward.schema';

export class UpdateRewardDto extends PartialType(CreateRewardDto) {
  @IsEnum(RewardStatus)
  @IsOptional()
  status?: RewardStatus;

  @IsDateString()
  @IsOptional()
  paymentDate?: string;

  @IsString()
  @IsOptional()
  paymentGatewayId?: string;

  @IsString()
  @IsOptional()
  campaign?: string;

  @IsString()
  @IsOptional()
  indicator?: string;
} 