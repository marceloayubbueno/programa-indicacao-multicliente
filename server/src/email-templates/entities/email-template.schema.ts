import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Client } from '../../clients/entities/client.schema';

export type EmailTemplateDocument = EmailTemplate & Document;

@Schema({ timestamps: true })
export class EmailTemplate {
  @Prop({ required: true })
  name: string;

  @Prop({ required: false })
  description?: string;

  @Prop({ required: true })
  htmlContent: string;

  @Prop({ type: Types.ObjectId, ref: 'Client', required: true })
  clientId: Client;

  @Prop({ required: true, enum: ['welcome', 'campaign', 'flow', 'notification'], default: 'welcome' })
  type: string;

  @Prop({ required: true, enum: ['active', 'inactive', 'draft'], default: 'draft' })
  status: string;

  @Prop({ type: [String], default: [] })
  variables: string[];

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @Prop({ type: Number, default: 0 })
  emailsSent: number;

  @Prop({ type: Date })
  lastSentAt?: Date;

  @Prop({ type: String })
  subject?: string;

  @Prop({ type: String })
  fromName?: string;

  @Prop({ type: String })
  fromEmail?: string;

  @Prop({ type: Boolean, default: false })
  isDefault: boolean;

  @Prop({ type: Date })
  createdAt?: Date;

  @Prop({ type: Date })
  updatedAt?: Date;
}

export const EmailTemplateSchema = SchemaFactory.createForClass(EmailTemplate);

// Índices para otimização
EmailTemplateSchema.index({ clientId: 1, type: 1 });
EmailTemplateSchema.index({ clientId: 1, status: 1 });
EmailTemplateSchema.index({ type: 1, status: 1 }); 