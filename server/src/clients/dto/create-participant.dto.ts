import { IsString, IsNotEmpty, IsEmail, IsOptional, IsArray, ValidateIf } from 'class-validator';
import { Types } from 'mongoose';

export class CreateParticipantDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

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
  @IsNotEmpty()
  clientId: string;

  @IsString()
  @IsOptional()
  shareLink?: string;

  @IsString()
  @IsOptional()
  uniqueReferralCode?: string;

  @IsArray()
  @IsOptional()
  assignedRewards?: Types.ObjectId[];

  @ValidateIf(o => o.tipo === 'indicador')
  @IsString()
  @IsOptional()
  plainPassword?: string;

  @IsString()
  @IsOptional()
  pixKey?: string;

  @IsString()
  @IsNotEmpty()
  tipo: 'participante' | 'indicador' | 'influenciador';
} 