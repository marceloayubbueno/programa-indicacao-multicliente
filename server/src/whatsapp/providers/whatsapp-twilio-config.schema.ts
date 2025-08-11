import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type WhatsAppTwilioConfigDocument = WhatsAppTwilioConfig & Document;

@Schema({ timestamps: true })
export class WhatsAppTwilioConfig {
  @Prop({ required: true, unique: true, default: 'platform' })
  configId: string;

  @Prop({ required: true })
  accountSid: string;

  @Prop({ required: true })
  authToken: string;

  @Prop({ required: true })
  phoneNumber: string;

  @Prop()
  webhookUrl?: string;

  @Prop({ default: false })
  isActive: boolean;

  @Prop({ default: 'twilio' })
  provider: string;

  @Prop()
  lastTestAt?: Date;

  @Prop()
  lastTestResult?: string;

  @Prop({ default: 0 })
  messagesSent: number;

  @Prop({ default: 0 })
  messagesFailed: number;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const WhatsAppTwilioConfigSchema = SchemaFactory.createForClass(WhatsAppTwilioConfig);
