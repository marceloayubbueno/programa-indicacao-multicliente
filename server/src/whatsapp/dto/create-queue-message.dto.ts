import { IsString, IsOptional, ValidateNested, IsObject, IsEnum, IsArray, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { MessagePriority } from '../entities/whatsapp-queue.schema';

class ContentDto {
  @IsString()
  body: string;

  @IsObject()
  @IsOptional()
  header?: {
    type: string;
    text?: string;
    mediaUrl?: string;
  };

  @IsString()
  @IsOptional()
  footer?: string;

  @IsArray()
  @IsOptional()
  buttons?: Array<{
    type: string;
    text: string;
    url?: string;
    phoneNumber?: string;
  }>;
}

class TriggerDataDto {
  @IsString()
  @IsOptional()
  participantId?: string;

  @IsString()
  @IsOptional()
  referralId?: string;

  @IsString()
  @IsOptional()
  campaignId?: string;

  @IsObject()
  @IsOptional()
  eventData?: Record<string, any>;
}

class MetadataDto {
  @IsString()
  @IsOptional()
  campaignId?: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsDateString()
  @IsOptional()
  estimatedSendTime?: string;
}

export class CreateQueueMessageDto {
  @IsString()
  @IsOptional()
  clientId?: string;

  @IsString()
  @IsOptional()
  flowId?: string;

  @IsString()
  @IsOptional()
  templateId?: string;

  @IsString()
  to: string; // Número de telefone do destinatário

  @IsString()
  from: string; // Número do WhatsApp Business (admin)

  @IsObject()
  @ValidateNested()
  @Type(() => ContentDto)
  content: ContentDto;

  @IsObject()
  @IsOptional()
  variables?: Record<string, any>;

  @IsEnum(MessagePriority)
  @IsOptional()
  priority?: MessagePriority;

  @IsString()
  trigger: string; // Tipo de gatilho

  @IsObject()
  @ValidateNested()
  @Type(() => TriggerDataDto)
  @IsOptional()
  triggerData?: TriggerDataDto;

  @IsObject()
  @ValidateNested()
  @Type(() => MetadataDto)
  @IsOptional()
  metadata?: MetadataDto;
}
