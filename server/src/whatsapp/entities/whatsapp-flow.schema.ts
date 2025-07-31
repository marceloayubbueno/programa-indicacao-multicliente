import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WhatsAppFlowDocument = WhatsAppFlow & Document;

@Schema({ timestamps: true })
export class WhatsAppFlow {
  @Prop({ type: Types.ObjectId, ref: 'Client', required: true })
  clientId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: ['indicators', 'leads', 'mixed'] })
  targetAudience: string;

  @Prop({ type: Object })
  filters: {
    // Para indicadores
    minIndications?: number;
    maxIndications?: number;
    indicatorHasRewards?: boolean;
    isActive?: boolean;
    
    // Para leads
    status?: string[];
    source?: string[];
    leadHasRewards?: boolean;
    
    // Para ambos
    tags?: string[];
  };

  @Prop({ type: [Object], required: true })
  messages: Array<{
    templateId: Types.ObjectId;
    delay: number; // Delay em segundos após o trigger
    order: number;
    conditions?: {
      field: string;
      operator: string;
      value: any;
    }[];
  }>;

  @Prop({ type: [String], default: [] })
  triggers: string[]; // ['indicator_joined', 'lead_indicated', 'reward_earned']

  @Prop({ required: true, enum: ['draft', 'active', 'paused', 'archived'] })
  status: string;

  @Prop({ type: Object })
  scheduling: {
    enabled: boolean;
    startDate?: Date;
    endDate?: Date;
    timeSlots?: Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }>;
  };

  @Prop({ type: Object, default: {} })
  statistics: {
    totalSent: number;
    totalDelivered: number;
    totalFailed: number;
    lastSentAt?: Date;
  };
}

export const WhatsAppFlowSchema = SchemaFactory.createForClass(WhatsAppFlow); 