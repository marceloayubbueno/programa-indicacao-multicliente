import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';
import { Types } from 'mongoose';

export class CreateParticipantListDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  clientId: string;

  @IsArray()
  @IsOptional()
  participants?: Types.ObjectId[];

  @IsString()
  @IsNotEmpty()
  tipo: 'participante' | 'indicador' | 'influenciador' | 'mista';

  @IsString()
  @IsOptional()
  campaignId?: string;

  @IsString()
  @IsOptional()
  campaignName?: string;
} 