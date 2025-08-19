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
    // 🆕 NOVO: Verificar se já foi processado para evitar duplicatas
    if ((doc as any).__whatsappProcessed) {
      console.log('⚠️ [REFERRAL-HOOK] Hook já executado, pulando...');
      return;
    }
    
    // Marcar como processado
    (doc as any).__whatsappProcessed = true;
    
    // Verificar se o WhatsAppFlowTriggerService está disponível globalmente
    if (global.whatsAppFlowTriggerService) {
      console.log('🚀 [REFERRAL-HOOK] Novo lead indicado, disparando mensagem WhatsApp...');
      console.log('🔍 [REFERRAL-HOOK] Dados do lead:', {
        id: doc._id,
        leadName: doc.leadName,
        leadEmail: doc.leadEmail,
        leadPhone: doc.leadPhone,
        clientId: doc.clientId,
        campaignId: doc.campaignId
      });
      
      // Preparar dados do referral para o service
      const referralData = {
        id: doc._id.toString(),
        leadName: doc.leadName,
        leadEmail: doc.leadEmail,
        leadPhone: doc.leadPhone,
        createdAt: doc.createdAt
      };
      
      // Chamar o service para disparar mensagem para o lead
      // 🆕 NOVO: Verificar se clientId existe antes de chamar
      if (!doc.clientId) {
        console.log('⚠️ [REFERRAL-HOOK] ClientId não encontrado, pulando disparo de WhatsApp');
        return;
      }
      
      const result = await global.whatsAppFlowTriggerService.triggerLeadIndicated(
        referralData,
        doc.clientId!.toString(), // 🆕 CORRIGIDO: Usar ! para assertão não-nula
        doc.campaignId?.toString()
      );
      
      console.log('✅ [REFERRAL-HOOK] Mensagem WhatsApp disparada com sucesso para o lead');
      console.log('📊 [REFERRAL-HOOK] Resultado:', result);
    } else {
      console.log('⚠️ [REFERRAL-HOOK] WhatsAppFlowTriggerService não disponível globalmente');
    }
  } catch (error) {
    console.error('❌ [REFERRAL-HOOK] Erro ao disparar mensagem WhatsApp:', error.message);
    console.error('❌ [REFERRAL-HOOK] Stack trace:', error.stack);
    // Não rejeitar a operação de save se houver erro no WhatsApp
  }
});

export type ReferralDocument = Referral & Document; 