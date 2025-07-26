import { IsString, IsBoolean, IsOptional, IsEnum, IsEmail } from 'class-validator';

export class CreateEmailConfigDto {
  @IsOptional()
  @IsString()
  clientId?: string;

  @IsEnum(['brevo'])
  provider: string;

  @IsString()
  apiKey: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  settings?: {
    fromName?: string;
    fromEmail?: string;
    replyTo?: string;
  };
}

export class UpdateEmailConfigDto {
  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  settings?: {
    fromName?: string;
    fromEmail?: string;
    replyTo?: string;
  };
}

export class TestEmailDto {
  @IsEmail()
  testEmail: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  message?: string;
} 