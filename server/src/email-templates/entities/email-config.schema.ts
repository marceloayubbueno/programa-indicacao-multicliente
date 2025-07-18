import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Client } from '../../clients/entities/client.schema';

export type EmailConfigDocument = EmailConfig & Document;

@Schema({ timestamps: true })
export class EmailConfig {
  @Prop({ type: Types.ObjectId, ref: 'Client', required: true, unique: true })
  clientId: Client;

  @Prop({ required: true })
  smtpHost: string;

  @Prop({ required: true, default: 587 })
  smtpPort: number;

  @Prop({ required: true })
  smtpUser: string;

  @Prop({ required: true })
  smtpPassword: string;

  @Prop({ required: true })
  fromEmail: string;

  @Prop({ required: true })
  fromName: string;

  @Prop({ required: true, enum: ['active', 'inactive'], default: 'inactive' })
  status: string;

  @Prop({ type: Boolean, default: false })
  isSecure: boolean;

  @Prop({ type: String })
  replyTo?: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @Prop({ type: Date })
  lastTestAt?: Date;

  @Prop({ type: Boolean, default: false })
  testSuccess: boolean;

  @Prop({ type: Date })
  createdAt?: Date;

  @Prop({ type: Date })
  updatedAt?: Date;
}

export const EmailConfigSchema = SchemaFactory.createForClass(EmailConfig);

// Índices para otimização
EmailConfigSchema.index({ clientId: 1 }, { unique: true });
EmailConfigSchema.index({ status: 1 }); 