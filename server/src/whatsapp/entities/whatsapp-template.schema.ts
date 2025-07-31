import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WhatsAppTemplateDocument = WhatsAppTemplate & Document;

@Schema({ timestamps: true })
export class WhatsAppTemplate {
  @Prop({ type: Types.ObjectId, ref: 'Client' })
  clientId?: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: ['marketing', 'utility', 'authentication'] })
  category: string;

  @Prop({ required: true, default: 'pt_BR' })
  language: string;

  @Prop({ type: Object, required: true })
  content: {
    header?: {
      type: string;
      text?: string;
      mediaUrl?: string;
    };
    body: string;
    footer?: string;
    buttons?: Array<{
      type: string;
      text: string;
      url?: string;
      phoneNumber?: string;
    }>;
  };

  @Prop({ type: [String], default: [] })
  variables: string[];

  @Prop({ required: true, enum: ['draft', 'pending', 'approved', 'rejected'] })
  status: string;

  @Prop({ type: Object })
  approvalDetails?: {
    approvedBy?: string;
    approvedAt?: Date;
    rejectionReason?: string;
  };

  @Prop({ default: false })
  isGlobal: boolean;
}

export const WhatsAppTemplateSchema = SchemaFactory.createForClass(WhatsAppTemplate); 