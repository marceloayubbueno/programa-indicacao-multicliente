import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Referral extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Participant', required: false })
  indicatorId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Client', required: false })
  clientId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Campaign', required: false })
  campaignId?: Types.ObjectId;

  @Prop({ required: true })
  leadName: string;

  @Prop({ required: true })
  leadEmail: string;

  @Prop({ required: true })
  leadPhone: string;

  @Prop({ required: true, enum: ['pendente', 'aprovada', 'rejeitada'], default: 'pendente' })
  status: string;

  @Prop({ type: Object, required: false })
  originMetadata?: any;

  @Prop({ type: Object, required: false })
  utmParams?: Record<string, string>;

  // === NOVOS CAMPOS PARA SISTEMA DE LINKS EXCLUSIVOS ===
  @Prop({ required: false, enum: ['manual', 'link', 'landing-page'], default: 'manual' })
  referralSource?: string;

  @Prop({ required: false })
  indicatorReferralCode?: string;

  @Prop({ required: false, enum: ['pending', 'approved', 'paid', 'rejected', 'cancelled'], default: 'pending' })
  rewardStatus?: string;

  @Prop({ type: Types.ObjectId, ref: 'Reward', required: false })
  rewardId?: Types.ObjectId;

  @Prop({ required: false })
  rewardValue?: number;

  @Prop({ required: false, enum: ['fixed', 'percentage', 'monthly'], default: 'fixed' })
  rewardType?: string;

  // === CAMPOS DE APROVAÇÃO ===
  @Prop({ required: false })
  approvalNotes?: string;

  @Prop({ required: false })
  approvedAt?: Date;

  @Prop({ required: false })
  rejectionNotes?: string;

  @Prop({ required: false })
  rejectedAt?: Date;

  // === CAMPOS DE PAGAMENTO ===
  @Prop({ required: false, enum: ['pix', 'discount', 'voucher', 'discount_link'] })
  paymentMethod?: string;

  @Prop({ required: false })
  paymentReference?: string;

  @Prop({ required: false })
  paymentNotes?: string;

  @Prop({ required: false })
  paidAt?: Date;

  // === CAMPOS DE CONVERSÃO ===
  @Prop({ required: false })
  conversionValue?: number;

  @Prop({ required: false })
  conversionNotes?: string;

  @Prop({ required: false })
  convertedAt?: Date;
  // === FIM DOS NOVOS CAMPOS ===
}

export const ReferralSchema = SchemaFactory.createForClass(Referral);

// === NOVOS ÍNDICES PARA PERFORMANCE ===
ReferralSchema.index({ indicatorReferralCode: 1 });
ReferralSchema.index({ referralSource: 1 });
ReferralSchema.index({ rewardStatus: 1 });

export type ReferralDocument = Referral & Document; 