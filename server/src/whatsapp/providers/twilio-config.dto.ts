import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateTwilioConfigDto {
  @IsString()
  accountSid: string;

  @IsString()
  authToken: string;

  @IsString()
  phoneNumber: string;

  @IsOptional()
  @IsString()
  webhookUrl?: string;
}

export class UpdateTwilioConfigDto {
  @IsOptional()
  @IsString()
  accountSid?: string;

  @IsOptional()
  @IsString()
  authToken?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  webhookUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class TestTwilioMessageDto {
  @IsString()
  to: string;

  @IsString()
  message: string;
}

export class TwilioConfigResponseDto {
  @IsString()
  configId: string;

  @IsString()
  accountSid: string;

  @IsString()
  phoneNumber: string;

  @IsOptional()
  @IsString()
  webhookUrl?: string;

  @IsBoolean()
  isActive: boolean;

  @IsString()
  provider: string;

  @IsOptional()
  lastTestAt?: Date;

  @IsOptional()
  @IsString()
  lastTestResult?: string;

  @IsNumber()
  messagesSent: number;

  @IsNumber()
  messagesFailed: number;
}
