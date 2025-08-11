import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type WhatsAppEvolutionConfigDocument = WhatsAppEvolutionConfig & Document;

@Schema({ timestamps: true })
export class WhatsAppEvolutionConfig {
  @Prop({ required: true, unique: true, default: 'platform' })
  configId: string;

  @Prop({ required: true })
  instanceName: string;

  @Prop({ required: true })
  apiKey: string;

  @Prop()
  webhookUrl?: string;

  @Prop({ default: false })
  isActive: boolean;

  @Prop({ default: 'evolution' })
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

export const WhatsAppEvolutionConfigSchema = SchemaFactory.createForClass(WhatsAppEvolutionConfig);
