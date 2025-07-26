import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EmailConfigDocument = EmailConfig & Document;

@Schema({ timestamps: true })
export class EmailConfig {
  @Prop({ required: false, default: null })
  clientId?: string; // null = configuração global

  @Prop({ required: true, enum: ['brevo', 'sendgrid'] })
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

export const EmailConfigSchema = SchemaFactory.createForClass(EmailConfig);

// Índices para performance
EmailConfigSchema.index({ clientId: 1, provider: 1 });
EmailConfigSchema.index({ isDefault: 1, provider: 1 });
EmailConfigSchema.index({ enabled: 1 }); 