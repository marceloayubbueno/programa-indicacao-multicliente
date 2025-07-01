import { Injectable, Logger, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LPDivulgacao, LPDivulgacaoDocument } from './entities/lp-divulgacao.schema';
import { CreateLPDivulgacaoDto } from './dto/create-lp-divulgacao.dto';
import { UpdateLPDivulgacaoDto } from './dto/update-lp-divulgacao.dto';
import { Referral, ReferralDocument } from '../referrals/entities/referral.schema';
import { Participant } from '../clients/entities/participant.schema';
import { ReferralsService } from '../referrals/referrals.service';

@Injectable()
export class LPDivulgacaoService {
  private readonly logger = new Logger(LPDivulgacaoService.name);

  constructor(
    @InjectModel(LPDivulgacao.name) private lpDivulgacaoModel: Model<LPDivulgacaoDocument>,
    @InjectModel(Referral.name) private referralModel: Model<ReferralDocument>,
    @InjectModel(Participant.name) private participantModel: Model<Participant>,
    private readonly referralsService: ReferralsService,
  ) {}

  // === SUBMISSÃO DE FORMULÁRIO DE TESTE GRÁTIS ===

  async submitReferralForm(submitReferralFormDto: any): Promise<any> {
    try {
      // === 🔍 DIAGNOSIS H2: Logs detalhados do backend ===
      this.logger.log('[DIAGNOSIS-H2] 🚀 === INÍCIO submitReferralForm ===');
      this.logger.log('[DIAGNOSIS-H2] 📥 Payload recebido:', JSON.stringify(submitReferralFormDto, null, 2));
      this.logger.log('[DIAGNOSIS-H2] 🕐 Timestamp:', new Date().toISOString());

      const {
        name,
        email,
        phone,
        lpId,
        indicatorCode
      } = submitReferralFormDto;

      this.logger.log('[DIAGNOSIS-H2] 📝 Dados extraídos do payload:');
      this.logger.log('[DIAGNOSIS-H2]   name:', name);
      this.logger.log('[DIAGNOSIS-H2]   email:', email);
      this.logger.log('[DIAGNOSIS-H2]   phone:', phone);
      this.logger.log('[DIAGNOSIS-H2]   lpId:', lpId);
      this.logger.log('[DIAGNOSIS-H2]   indicatorCode:', indicatorCode);

      // Validações básicas
      if (!name || !email || !phone || !lpId) {
        const missingFields = [];
        if (!name) missingFields.push('name');
        if (!email) missingFields.push('email');
        if (!phone) missingFields.push('phone');
        if (!lpId) missingFields.push('lpId');
        
        this.logger.error('[DIAGNOSIS-H2] ❌ Campos obrigatórios ausentes:', missingFields);
        throw new Error(`Dados obrigatórios ausentes: ${missingFields.join(', ')}`);
      }

      this.logger.log('[DIAGNOSIS-H2] ✅ Validação básica passou');

      // Buscar a LP de divulgação
      this.logger.log('[DIAGNOSIS-H2] 🔍 Buscando LP de divulgação no banco...');
      const lp = await this.lpDivulgacaoModel.findById(lpId)
        .populate('campaignId')
        .populate('clientId')
        .exec();

      if (!lp) {
        this.logger.error('[DIAGNOSIS-H2] ❌ LP de divulgação não encontrada no banco');
        throw new Error('LP de divulgação não encontrada');
      }

      this.logger.log('[DIAGNOSIS-H2] ✅ LP encontrada:', {
        id: lp._id,
        name: lp.name,
        clientId: lp.clientId,
        campaignId: lp.campaignId
      });

      // Extrair IDs necessários
      const campaignId = lp.campaignId?._id?.toString() || lp.campaignId?.toString() || lp.campaignId;
      const clientId = lp.clientId?._id?.toString() || lp.clientId?.toString() || lp.clientId;

      this.logger.log('[DIAGNOSIS-H2] 🆔 IDs extraídos:');
      this.logger.log('[DIAGNOSIS-H2]   campaignId:', campaignId);
      this.logger.log('[DIAGNOSIS-H2]   clientId:', clientId);

      // Buscar indicador pelo código único (se fornecido)
      let indicadorId = null;
      let indicadorData = null;

      if (indicatorCode) {
        this.logger.log('[DIAGNOSIS-H2] 🔍 Buscando indicador pelo código:', indicatorCode);
        indicadorData = await this.participantModel.findOne({
          uniqueReferralCode: indicatorCode,
          tipo: { $in: ['indicador', 'influenciador'] }
        });

        if (indicadorData) {
          indicadorId = (indicadorData as any)._id.toString();
          this.logger.log('[DIAGNOSIS-H2] ✅ Indicador encontrado:', {
            id: indicadorId,
            name: (indicadorData as any).name,
            code: indicatorCode
          });
        } else {
          this.logger.warn('[DIAGNOSIS-H2] ⚠️ Indicador não encontrado para código:', indicatorCode);
        }
      } else {
        this.logger.log('[DIAGNOSIS-H2] ℹ️ Nenhum código de indicador fornecido');
      }

      // ✅ CORREÇÃO: Usar sistema unificado de criação de referrals
      this.logger.log('[DIAGNOSIS-H2] 🔄 Preparando dados para sistema unificado de referrals');
      
      const referralData = {
        leadName: name,
        leadEmail: email,
        leadPhone: phone,
        campaignId: campaignId || null,
        campaignName: (lp.campaignId as any)?.name || 'LP Divulgacao',
        clientId: clientId,
        indicatorId: indicadorId || null,
        indicatorName: (indicadorData as any)?.name || null,
        indicatorReferralCode: indicatorCode || null,
        referralSource: 'landing-page',
        status: 'pendente',
        lpDivulgacaoId: lpId
      };

      this.logger.log('[DIAGNOSIS-H2] 📦 Dados do referral a serem enviados:', JSON.stringify(referralData, null, 2));

      // 🎯 USAR SISTEMA UNIFICADO que inclui logs H2/H3 e processamento automático de recompensas
      this.logger.log('[DIAGNOSIS-H2] 🚀 Chamando referralsService.createReferral...');
      const referralResult = await this.referralsService.createReferral(referralData);
      const savedReferral = referralResult.data;
      
      this.logger.log('[DIAGNOSIS-H2] ✅ Referral criado via sistema unificado:', {
        id: savedReferral._id,
        leadName: savedReferral.leadName,
        leadEmail: savedReferral.leadEmail,
        indicatorName: savedReferral.indicatorName
      });

      // Atualizar estatísticas da LP
      this.logger.log('[DIAGNOSIS-H2] 📊 Atualizando estatísticas da LP...');
      await this.lpDivulgacaoModel.findByIdAndUpdate(
        submitReferralFormDto.lpId,
        { 
          $inc: { 
            'statistics.totalSubmissions': 1
          },
          $set: { 'statistics.lastSubmissionAt': new Date() }
        }
      ).exec();
      this.logger.log('[DIAGNOSIS-H2] ✅ Estatísticas da LP atualizadas');

      const responseData = {
        success: true,
        message: 'Indicação enviada com sucesso',
        referralId: savedReferral._id,
        data: {
          leadName: savedReferral.leadName,
          leadEmail: savedReferral.leadEmail,
          indicatorName: (indicadorData as any)?.name || null,
          campaignName: (lp.campaignId as any)?.name || 'LP Divulgacao'
        }
      };

      this.logger.log('[DIAGNOSIS-H2] 🎉 === FIM submitReferralForm - SUCESSO ===');
      this.logger.log('[DIAGNOSIS-H2] 📤 Response enviado:', JSON.stringify(responseData, null, 2));

      return responseData;

    } catch (error) {
      this.logger.error('[DIAGNOSIS-H2] 💥 === ERRO em submitReferralForm ===');
      this.logger.error('[DIAGNOSIS-H2] 💥 Mensagem do erro:', error.message);
      this.logger.error('[DIAGNOSIS-H2] 💥 Stack trace:', error.stack);
      this.logger.error('[DIAGNOSIS-H2] 💥 Payload que causou erro:', JSON.stringify(submitReferralFormDto, null, 2));
      throw error;
    }
  }
} 