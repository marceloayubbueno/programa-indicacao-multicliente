import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

@Schema({ timestamps: true })
export class Participant extends Document {
  @Prop({ required: true, unique: false })
  participantId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: false, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: false })
  company: string;

  @Prop({ required: true, enum: ['ativo', 'inativo', 'pendente'], default: 'ativo' })
  status: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'ParticipantList' }], default: [] })
  lists: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'Client', required: true })
  clientId: Types.ObjectId;

  @Prop({ required: false })
  shareLink: string;

  @Prop({ required: false, unique: true, sparse: true })
  uniqueReferralCode?: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Reward' }], default: [] })
  assignedRewards?: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'LPIndicadores', required: false })
  originLandingPageId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Campaign', required: false })
  originCampaignId?: Types.ObjectId;

  @Prop({ required: false, enum: ['landing-page', 'manual', 'import', 'api', 'bulk-upload', 'campaign-duplication'], default: 'manual' })
  originSource: string;

  @Prop({ type: Object, required: false })
  originMetadata?: {
    lpName?: string;
    campaignName?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmContent?: string;
    utmTerm?: string;
    referrerUrl?: string;
    userAgent?: string;
    ipAddress?: string;
    submissionDate?: Date;
    formData?: any;
  };

  @Prop({ default: 0 })
  totalIndicacoes?: number;

  @Prop({ default: 0 })
  indicacoesAprovadas?: number;

  @Prop({ default: 0 })
  recompensasRecebidas?: number;

  @Prop({ required: false })
  lastIndicacaoAt?: Date;

  @Prop({ default: true })
  canIndicate?: boolean;

  @Prop({ required: false })
  indicatorLevel?: string;

  @Prop({ required: false })
  customShareMessage?: string;

  @Prop({ default: Date.now })
  createdAt?: Date;

  @Prop({ default: Date.now })
  updatedAt?: Date;

  @Prop({ required: true, enum: ['participante', 'indicador', 'influenciador'], default: 'participante' })
  tipo: string;

  @Prop({ type: Types.ObjectId, ref: 'Campaign', required: false })
  campaignId?: Types.ObjectId;

  @Prop({ required: false })
  campaignName?: string;

  @Prop({ type: Types.ObjectId, ref: 'Participant', required: false })
  originalParticipantId?: Types.ObjectId;

  @Prop({ required: false })
  plainPassword?: string;

  @Prop({
    required: false,
    validate: {
      validator: function (value: string) {
        if (!value) return true; // Campo opcional
        // Regex para e-mail
        const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
        // Regex para CPF (apenas números, 11 dígitos)
        const cpfRegex = /^\d{11}$/;
        // Regex para celular (apenas números, 11 dígitos, ex: 11999999999)
        const phoneRegex = /^\d{11}$/;
        // Regex para chave aleatória Pix (32 caracteres, letras e números)
        const randomKeyRegex = /^[a-zA-Z0-9]{32}$/;
        return (
          emailRegex.test(value) ||
          cpfRegex.test(value) ||
          phoneRegex.test(value) ||
          randomKeyRegex.test(value)
        );
      },
      message: 'Chave Pix inválida. Use um e-mail, CPF, celular (apenas números) ou chave aleatória Pix.'
    },
    trim: true
  })
  /**
   * Chave Pix do participante (e-mail, CPF, celular ou chave aleatória Pix)
   * Validação básica aplicada. Campo opcional.
   */
  pixKey?: string;
}

export const ParticipantSchema = SchemaFactory.createForClass(Participant);

ParticipantSchema.index({ clientId: 1, status: 1 });
ParticipantSchema.index({ originLandingPageId: 1 });
ParticipantSchema.index({ originCampaignId: 1 });
ParticipantSchema.index({ originSource: 1 });
ParticipantSchema.index({ email: 1, clientId: 1 });
ParticipantSchema.index({ totalIndicacoes: -1 });
ParticipantSchema.index({ createdAt: -1 });
ParticipantSchema.index({ uniqueReferralCode: 1 });
ParticipantSchema.index({ originalParticipantId: 1 });
ParticipantSchema.index({ email: 1, clientId: 1, campaignId: 1 });

function generateUniqueReferralCode(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `${timestamp}${randomPart}`.toUpperCase();
}

ParticipantSchema.pre('save', function (next) {
  if (!this.participantId) {
    this.participantId = uuidv4();
  }
  
  if ((this.tipo === 'indicador' || this.tipo === 'influenciador') && !this.uniqueReferralCode) {
    this.uniqueReferralCode = generateUniqueReferralCode();
  }
  
  this.updatedAt = new Date();
  
  next();
});

// 🚀 HOOK POST-SAVE: Disparar gatilho WhatsApp automaticamente
ParticipantSchema.post('save', async function(doc) {
  try {
    // Só disparar gatilho para participantes do tipo indicador
    if (doc.tipo === 'indicador') {
      console.log('🚀 [HOOK] Participante tipo indicador criado, disparando gatilho WhatsApp...');
      console.log('🚀 [HOOK] Dados:', {
        id: doc._id,
        name: doc.name,
        email: doc.email,
        tipo: doc.tipo,
        clientId: doc.clientId,
        campaignId: doc.campaignId
      });

      // Emitir evento global para ser capturado pelo service
      // O service será responsável por disparar o gatilho
      console.log('✅ [HOOK] Evento emitido - gatilho será processado pelo service');
      
      // Disparar evento global para ser capturado pelo ParticipantHooksService
      if (global.participantHooksService) {
        await global.participantHooksService.handleNewIndicator({
          _id: doc._id,
          name: doc.name,
          email: doc.email,
          phone: doc.phone,
          tipo: doc.tipo,
          clientId: doc.clientId,
          campaignId: doc.campaignId,
          createdAt: doc.createdAt
        });
      } else {
        console.log('⚠️ [HOOK] ParticipantHooksService não disponível globalmente');
      }
      
    } else {
      console.log('ℹ️ [HOOK] Participante não é indicador, gatilho não disparado:', doc.tipo);
    }
  } catch (error) {
    console.error('❌ [HOOK] Erro no hook:', error);
    // Não falhar a operação de save por erro no hook
  }
});

ParticipantSchema.virtual('referralLink').get(function() {
  if (this.uniqueReferralCode) {
    return `/indicacao/${this.uniqueReferralCode}`;
  }
  return null;
});

ParticipantSchema.virtual('indicacaoApprovalRate').get(function() {
  if (!this.totalIndicacoes || this.totalIndicacoes === 0) return 0;
  return ((this.indicacoesAprovadas || 0) / this.totalIndicacoes) * 100;
});

ParticipantSchema.virtual('originInfo').get(function() {
  if (this.originSource === 'landing-page' && this.originMetadata) {
    return {
      type: 'Landing Page',
      name: this.originMetadata.lpName || 'LP não identificada',
      campaign: this.originMetadata.campaignName || 'Campanha não identificada',
      date: this.originMetadata.submissionDate || this.createdAt
    };
  }
  
  return {
    type: this.originSource === 'manual' ? 'Cadastro Manual' : 
          this.originSource === 'import' ? 'Importação' :
          this.originSource === 'api' ? 'API' :
          this.originSource === 'campaign-duplication' ? 'Duplicação de Campanha' : 'Outros',
    name: 'N/A',
    campaign: this.campaignName || 'N/A',
    date: this.createdAt
  };
}); 