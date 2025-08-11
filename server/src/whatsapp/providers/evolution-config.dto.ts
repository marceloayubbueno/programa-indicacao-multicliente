import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateEvolutionConfigDto {
  @IsString()
  instanceName: string;

  @IsString()
  apiKey: string;

  @IsOptional()
  @IsString()
  webhookUrl?: string;
}

export class UpdateEvolutionConfigDto {
  @IsOptional()
  @IsString()
  instanceName?: string;

  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsString()
  webhookUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class TestEvolutionMessageDto {
  @IsString()
  to: string;

  @IsString()
  message: string;
}

export class EvolutionConfigResponseDto {
  success: boolean;
  data?: any;
  message?: string;
}
