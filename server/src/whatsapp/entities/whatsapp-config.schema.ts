import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type WhatsAppConfigDocument = WhatsAppConfig & Document;

@Schema({ timestamps: true })
export class WhatsAppConfig {
  @Prop({ default: 'whatsapp-business' })
  provider: string;

  @Prop({ type: Object })
  credentials: {
    // WhatsApp Business API
    accessToken: string;
    phoneNumberId: string;
    businessAccountId: string;
    webhookUrl?: string; // opcional
  };

  @Prop({ type: Object, default: {} })
  globalSettings: {
    rateLimitPerMinute: number;
    sendTimeStart: string;
    sendTimeEnd: string;
    timezone: string;
    enableWebhooks: boolean;
  };

  @Prop({ type: Object, default: {} })
  status: {
    connected: boolean;
    messagesToday: number;
    dailyLimit: number;
    activeClients: number;
    totalTemplates: number;
  };
}

export const WhatsAppConfigSchema = SchemaFactory.createForClass(WhatsAppConfig); 