import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WhatsAppClientConfigDocument = WhatsAppClientConfig & Document;

@Schema({ timestamps: true })
export class WhatsAppClientConfig {
  @Prop({ type: Types.ObjectId, ref: 'Client', required: true })
  clientId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  displayName: string;

  @Prop({ trim: true })
  businessDescription?: string;

  @Prop({ default: false })
  isActive: boolean;

  @Prop({ default: false })
  isVerified: boolean;
}

export const WhatsAppClientConfigSchema = SchemaFactory.createForClass(WhatsAppClientConfig);

// Índices para otimização de consultas
WhatsAppClientConfigSchema.index({ clientId: 1 });
WhatsAppClientConfigSchema.index({ isActive: 1 });
WhatsAppClientConfigSchema.index({ isVerified: 1 }); 