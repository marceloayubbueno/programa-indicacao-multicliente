import { IsString, IsNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateParticipantDto } from './create-participant.dto';

export class ImportParticipantsDto {
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateParticipantDto)
  participants: Omit<CreateParticipantDto, 'clientId'>[];
} 