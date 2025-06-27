import { IsString, IsOptional, IsArray } from 'class-validator';
import { Types } from 'mongoose';

export class UpdateParticipantListDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  participants?: Types.ObjectId[];

  @IsString()
  @IsOptional()
  tipo?: 'participante' | 'indicador' | 'influenciador' | 'mista';
} 