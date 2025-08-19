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

  // === CAMPOS DE TIMESTAMP (IGUAL AO PARTICIPANTSCHEMA) ===
  @Prop({ default: Date.now })
  createdAt?: Date;

  @Prop({ default: Date.now })
  updatedAt?: Date;

  // === NOVO CAMPO PARA MARCAR O PROCESSAMENTO DO WHATSAPP ===
  @Prop({ default: false })
  whatsappProcessed?: boolean;
}

export const ReferralSchema = SchemaFactory.createForClass(Referral);

// === NOVOS ÍNDICES PARA PERFORMANCE ===
ReferralSchema.index({ indicatorReferralCode: 1 });
ReferralSchema.index({ referralSource: 1 });
ReferralSchema.index({ rewardStatus: 1 });

// === HOOK PARA DISPARAR MENSAGENS WHATSAPP QUANDO LEAD FOR INDICADO ===
ReferralSchema.post('save', async function(doc) {
  try {
    // 🔍 LOG SIMPLES: Hook sendo executado
    console.log('🔍 [REFERRAL-HOOK] Hook executado para:', doc._id);
    
    if (doc.whatsappProcessed === true) {
      console.log('⚠️ [REFERRAL-HOOK] Lead já foi processado, pulando...');
      return;
    }
    if (this.isNew === false) {
      console.log('⚠️ [REFERRAL-HOOK] Não é uma inserção nova, pulando...');
      return;
    }
    
    console.log('✅ [REFERRAL-HOOK] Lead novo detectado, processando...');
    
    // Preparar dados do referral
    const referralData = {
      id: doc._id.toString(),
      leadName: doc.leadName,
      leadEmail: doc.leadEmail,
      leadPhone: doc.leadPhone,
      indicadorName: 'Indicador',
      campaignName: 'Campanha',
      createdAt: doc.createdAt
    };
    
    console.log('🔍 [REFERRAL-HOOK] Dados preparados:', referralData);
    console.log('🔍 [REFERRAL-HOOK] leadPhone:', doc.leadPhone);
    console.log('🔍 [REFERRAL-HOOK] clientId:', doc.clientId);
    
    // Chamar o serviço de trigger
    const result = await global.whatsAppFlowTriggerService.triggerLeadIndicated(
      referralData,
      doc.clientId!.toString(),
      doc.campaignId?.toString()
    );
    
    console.log('🔍 [REFERRAL-HOOK] Resultado:', result);
    
    if (result.success) {
      try {
        doc.whatsappProcessed = true;
        console.log('✅ [REFERRAL-HOOK] Lead marcado como processado');
      } catch (updateError) {
        console.error('⚠️ [REFERRAL-HOOK] Erro ao marcar como processado:', updateError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ [REFERRAL-HOOK] Erro no hook:', error.message);
  }
});

export type ReferralDocument = Referral & Document; 