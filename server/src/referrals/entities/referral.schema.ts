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

  // === CAMPOS PARA VALORES EDITÁVEIS DE RECOMPENSA ===
  @Prop({ required: false })
  editableRewardValue?: number;

  @Prop({ required: false })
  finalRewardValue?: number;

  @Prop({ required: false, enum: ['fixed', 'percentage'], default: 'fixed' })
  rewardCalculationType?: string;

  @Prop({ required: false })
  rewardBaseValue?: number;
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
    if (doc.whatsappProcessed === true) {
      return;
    }
    
    // Verificar se é a primeira execução (não processado ainda)
    if (doc.whatsappProcessed !== false) {
      return;
    }
    
    // ✅ CORREÇÃO: Buscar dados reais do indicador
    let indicadorName = 'Indicador';
    let indicadorEmail = '';
    let indicadorPhone = '';
    
    if (doc.indicatorId) {
      try {
        // Buscar dados do indicador no banco
        const Participant = this.db.models.Participant || this.db.model('Participant');
        if (Participant) {
          const indicador = await Participant.findById(doc.indicatorId).select('name email phone').exec();
          if (indicador) {
            indicadorName = indicador.name || 'Indicador';
            indicadorEmail = indicador.email || '';
            indicadorPhone = indicador.phone || '';
          }
        }
      } catch (error) {
        console.error('⚠️ [REFERRAL-HOOK] Erro ao buscar dados do indicador:', error.message);
      }
    }
    
    // Preparar dados do referral com dados reais do indicador
    const referralData = {
      id: doc._id.toString(),
      leadName: doc.leadName,
      leadEmail: doc.leadEmail,
      leadPhone: doc.leadPhone,
      indicadorName: indicadorName,
      indicadorEmail: indicadorEmail,
      indicadorPhone: indicadorPhone,
      campaignName: 'Campanha',
      createdAt: doc.createdAt
    };
    
    // Chamar o serviço de trigger
    const result = await global.whatsAppFlowTriggerService.triggerLeadIndicated(
      referralData,
      doc.clientId!.toString(),
      doc.campaignId?.toString()
    );
    
    if (result.success) {
      try {
        doc.whatsappProcessed = true;
      } catch (updateError) {
        console.error('⚠️ [REFERRAL-HOOK] Erro ao marcar como processado:', updateError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ [REFERRAL-HOOK] Erro no hook:', error.message);
  }
});

export type ReferralDocument = Referral & Document; 