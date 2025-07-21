import { IsString, IsOptional, IsEmail, IsArray } from 'class-validator';
import { Types } from 'mongoose';

export class UpdateParticipantDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  company?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsArray()
  @IsOptional()
  lists?: Types.ObjectId[];

  @IsString()
  @IsOptional()
  shareLink?: string;

  @IsString()
  @IsOptional()
  uniqueReferralCode?: string;

  @IsArray()
  @IsOptional()
  assignedRewards?: Types.ObjectId[];

  @IsString()
  @IsOptional()
  tipo?: 'participante' | 'indicador' | 'influenciador';

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  pixKey?: string;
} 