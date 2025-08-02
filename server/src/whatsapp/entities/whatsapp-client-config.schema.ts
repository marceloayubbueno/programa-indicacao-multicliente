import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WhatsAppClientConfigDocument = WhatsAppClientConfig & Document;

@Schema({ timestamps: true })
export class WhatsAppClientConfig {
  @Prop({ type: Types.ObjectId, ref: 'Client', required: true })
  clientId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  whatsappNumber: string;

  @Prop({ required: true, trim: true })
  displayName: string;

  @Prop({ trim: true })
  businessDescription?: string;

  @Prop({ default: false })
  isActive: boolean;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ type: Date })
  verifiedAt?: Date;

  @Prop({ type: Object })
  settings?: {
    // Configurações específicas do cliente
    enableNotifications?: boolean;
    defaultLanguage?: string;
    timezone?: string;
    businessHours?: {
      start: string; // "09:00"
      end: string;   // "18:00"
    };
    autoReply?: {
      enabled: boolean;
      message: string;
    };
  };

  @Prop({ type: Object })
  statistics?: {
    totalMessagesSent: number;
    totalMessagesDelivered: number;
    totalMessagesFailed: number;
    lastMessageSentAt?: Date;
    monthlyUsage: {
      current: number;
      limit: number;
    };
  };

  @Prop({ type: Object })
  verification?: {
    status: 'pending' | 'approved' | 'rejected';
    submittedAt?: Date;
    approvedAt?: Date;
    rejectedAt?: Date;
    rejectionReason?: string;
    documents?: {
      businessLicense?: string;
      idDocument?: string;
      addressProof?: string;
    };
  };

  @Prop({ type: [String], default: [] })
  tags?: string[];

  @Prop({ type: Object })
  metadata?: {
    createdBy?: string;
    notes?: string;
    customFields?: Record<string, any>;
  };
}

export const WhatsAppClientConfigSchema = SchemaFactory.createForClass(WhatsAppClientConfig);

// Índices para otimização de consultas
WhatsAppClientConfigSchema.index({ clientId: 1 });
WhatsAppClientConfigSchema.index({ whatsappNumber: 1 }, { unique: true });
WhatsAppClientConfigSchema.index({ isActive: 1 });
WhatsAppClientConfigSchema.index({ isVerified: 1 });

// Validação de número de telefone
WhatsAppClientConfigSchema.path('whatsappNumber').validate(function(value: string) {
  // Regex para validar formato internacional de telefone
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(value);
}, 'Número de WhatsApp deve estar no formato internacional (+5511999999999)');

// Middleware para atualizar estatísticas
WhatsAppClientConfigSchema.pre('save', function(next) {
  if (this.isNew) {
    this.statistics = {
      totalMessagesSent: 0,
      totalMessagesDelivered: 0,
      totalMessagesFailed: 0,
      monthlyUsage: {
        current: 0,
        limit: 1000 // Limite padrão mensal
      }
    };
  }
  next();
}); 