import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WhatsAppQueueDocument = WhatsAppQueue & Document;

// Enum para prioridades das mensagens
export enum MessagePriority {
  HIGH = 'high',      // Novo indicador, novo lead
  MEDIUM = 'medium',  // Recompensa ganha, follow-up
  LOW = 'low'         // Newsletter, marketing
}

// Enum para status da fila
export enum QueueStatus {
  PENDING = 'pending',    // Aguardando processamento
  PROCESSING = 'processing', // Em processamento
  COMPLETED = 'completed',   // Processado com sucesso
  FAILED = 'failed',         // Falhou no processamento
  RETRY = 'retry'           // Aguardando retry
}

@Schema({ timestamps: true })
export class WhatsAppQueue {
  @Prop({ type: Types.ObjectId, ref: 'Client', required: true })
  clientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'WhatsAppFlow' })
  flowId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'WhatsAppTemplate' })
  templateId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'WhatsAppMessage' })
  messageId?: Types.ObjectId;

  @Prop({ required: true })
  to: string; // Número de telefone do destinatário

  @Prop({ required: true })
  from: string; // Número do WhatsApp Business (admin)

  @Prop({ type: Object, required: true })
  content: {
    body: string;
    header?: {
      type: string;
      text?: string;
      mediaUrl?: string;
    };
    footer?: string;
    buttons?: Array<{
      type: string;
      text: string;
      url?: string;
      phoneNumber?: string;
    }>;
  };

  @Prop({ type: Object })
  variables?: Record<string, any>;

  @Prop({ 
    required: true, 
    enum: MessagePriority, 
    default: MessagePriority.MEDIUM 
  })
  priority: MessagePriority;

  @Prop({ 
    required: true, 
    enum: QueueStatus, 
    default: QueueStatus.PENDING 
  })
  status: QueueStatus;

  @Prop({ required: true })
  trigger: string; // Tipo de gatilho: 'indicator_joined', 'lead_indicated', 'reward_earned'

  @Prop({ type: Object })
  triggerData: {
    participantId?: Types.ObjectId;
    referralId?: Types.ObjectId;
    campaignId?: string;
    eventData?: Record<string, any>;
  };

  @Prop({ type: Number, default: 0 })
  retryCount: number;

  @Prop({ type: Number, default: 3 })
  maxRetries: number;

  @Prop()
  nextRetryAt?: Date;

  @Prop()
  processedAt?: Date;

  @Prop({ type: Object })
  providerResponse?: {
    messageId: string;
    status: string;
    provider?: string;
    errorCode?: string;
    errorMessage?: string;
    sentAt?: Date;
  };

  @Prop({ type: Object })
  metadata?: {
    campaignId?: string;
    userId?: string;
    tags?: string[];
    estimatedSendTime?: Date;
    rateLimitInfo?: {
      clientRateLimit: number;
      globalRateLimit: number;
      lastSentAt?: Date;
    };
  };

  // Campos para controle de rate limiting
  @Prop({ type: Date })
  lastAttemptAt?: Date;

  @Prop({ type: Number, default: 0 })
  attemptsCount: number;

  // Campo para ordenação da fila (prioridade + timestamp)
  @Prop({ type: Date, default: Date.now })
  queuePosition: Date;
}

export const WhatsAppQueueSchema = SchemaFactory.createForClass(WhatsAppQueue);

// Índices para performance e ordenação
WhatsAppQueueSchema.index({ clientId: 1, status: 1, priority: 1, queuePosition: 1 });
WhatsAppQueueSchema.index({ status: 1, priority: 1, queuePosition: 1 });
WhatsAppQueueSchema.index({ clientId: 1, lastAttemptAt: 1 });
WhatsAppQueueSchema.index({ trigger: 1, status: 1 });
