import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WhatsAppMessageDocument = WhatsAppMessage & Document;

@Schema({ timestamps: true })
export class WhatsAppMessage {
  @Prop({ type: Types.ObjectId, ref: 'Client', required: false })
  clientId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'WhatsAppTemplate' })
  templateId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'WhatsAppFlow' })
  flowId?: Types.ObjectId;

  @Prop({ required: true })
  to: string; // Número de telefone

  @Prop({ required: true })
  from: string; // Número do WhatsApp Business

  @Prop({ type: Object, required: true })
  content: {
    body: string;
    header?: {
      type: string;
      text?: string;
      mediaUrl?: string;
    };
    footer?: string;
    buttons?: Array<{
      type: string;
      text: string;
      url?: string;
      phoneNumber?: string;
    }>;
  };

  @Prop({ type: Object })
  variables?: Record<string, any>;

  @Prop({ required: true, enum: ['pending', 'queued', 'sent', 'delivered', 'read', 'failed'] })
  status: string;

  @Prop({ type: Object })
  providerResponse?: {
    messageId: string;
    status: string;
    provider?: string;
    errorCode?: string;
    errorMessage?: string;
  };

  @Prop({ type: Object })
  metadata?: {
    campaignId?: string;
    trigger?: string;
    userId?: string;
    tags?: string[];
  };

  @Prop()
  scheduledFor?: Date;

  @Prop()
  sentAt?: Date;

  @Prop()
  deliveredAt?: Date;

  @Prop()
  readAt?: Date;
}

export const WhatsAppMessageSchema = SchemaFactory.createForClass(WhatsAppMessage); 