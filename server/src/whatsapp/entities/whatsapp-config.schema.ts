import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type WhatsAppConfigDocument = WhatsAppConfig & Document;

@Schema({ timestamps: true })
export class WhatsAppConfig {
  @Prop({ required: true, enum: ['twilio', 'meta', '360dialog'] })
  provider: string;

  @Prop({ type: Object })
  credentials: {
    // Twilio
    accountSid?: string;
    authToken?: string;
    whatsappNumber?: string;
    
    // Meta
    accessToken?: string;
    phoneNumberId?: string;
    businessAccountId?: string;
    
    // 360dialog
    apiKey?: string;
    instanceId?: string;
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