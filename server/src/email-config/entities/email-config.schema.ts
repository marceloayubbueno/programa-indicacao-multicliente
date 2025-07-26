import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ApiEmailConfigDocument = ApiEmailConfig & Document;

@Schema({ timestamps: true })
export class ApiEmailConfig {
  @Prop({ required: false, default: null })
  clientId?: string; // null = configuração global

  @Prop({ required: true, enum: ['brevo'] })
  provider: string;

  @Prop({ required: true })
  apiKey: string;

  @Prop({ required: true, default: true })
  enabled: boolean;

  @Prop({ required: true, default: false })
  isDefault: boolean;

  @Prop({
    type: {
      fromName: { type: String, required: false },
      fromEmail: { type: String, required: false },
      replyTo: { type: String, required: false }
    },
    required: false
  })
  settings?: {
    fromName?: string;
    fromEmail?: string;
    replyTo?: string;
  };

  @Prop({ required: false })
  lastTestAt?: Date;

  @Prop({ required: false })
  lastTestResult?: boolean;

  @Prop({ required: false })
  lastTestError?: string;
}

export const ApiEmailConfigSchema = SchemaFactory.createForClass(ApiEmailConfig);

// Índices para performance
ApiEmailConfigSchema.index({ clientId: 1, provider: 1 });
ApiEmailConfigSchema.index({ isDefault: 1, provider: 1 });
ApiEmailConfigSchema.index({ enabled: 1 }); 