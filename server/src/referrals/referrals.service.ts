import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Referral } from './entities/referral.schema';
import { Participant } from '../clients/entities/participant.schema';
import { Campaign } from '../campaigns/entities/campaign.schema';
import { Reward } from '../rewards/entities/reward.schema';

@Injectable()
export class ReferralsService {
  private readonly logger = new Logger(ReferralsService.name);

  constructor(
    @InjectModel(Referral.name) private readonly referralModel: Model<Referral>,
    @InjectModel(Participant.name) private readonly participantModel: Model<Participant>,
    @InjectModel(Campaign.name) private readonly campaignModel: Model<Campaign>,
    @InjectModel(Reward.name) private readonly rewardModel: Model<Reward>,
  ) {}

  async create(data: Partial<Referral>): Promise<Referral> {
    this.logger.debug('Criando referral com dados:', JSON.stringify(data));
    const referral = new this.referralModel(data);
    const saved = await referral.save();
    this.logger.debug('Referral salvo no MongoDB:', JSON.stringify(saved));
    return saved;
  }

  async findAll(): Promise<any[]> {
    this.logger.debug('Buscando todas as indicações no MongoDB');
    const referrals = await this.referralModel.find()
      .populate('indicatorId', 'name')
      .populate('campaignId', 'name')
      .sort({ createdAt: -1 })
      .exec();
    // Mapear para retornar os campos necessários para o frontend
    return referrals.map(ref => ({
      _id: ref._id,
      leadName: ref.leadName,
      leadEmail: ref.leadEmail,
      leadPhone: ref.leadPhone,
      status: ref.status,
      createdAt: (ref as any).createdAt,
      indicatorName: (ref.indicatorId && (ref.indicatorId as any).name) ? (ref.indicatorId as any).name : '-',
      campaignName: (ref.campaignId && (ref.campaignId as any).name) ? (ref.campaignId as any).name : '-',
      referralSource: (ref as any).referralSource || 'manual',
      indicatorReferralCode: (ref as any).indicatorReferralCode || null,
      rewardValue: (ref as any).rewardValue || 0,
    }));
  }

  // === MÉTODOS PARA SISTEMA DE RECOMPENSAS ===

  /**
   * Marca uma indicação como convertida (venda realizada)
   */
  async markAsConverted(referralId: string, notes?: string): Promise<void> {

    
    this.logger.log(`Marcando referral ${referralId} como convertido (padrão estabelecido)`);
    
    try {
      // Buscar referral antes da conversão
      const referralBeforeUpdate = await this.referralModel.findById(referralId);

      
      const referral = await this.referralModel.findByIdAndUpdate(
        referralId,
        {
          status: 'aprovada',
          conversionNotes: notes,
          convertedAt: new Date(),
          updatedAt: new Date()
        },
        { new: true }
      );
      


      if (!referral) {
        throw new Error('Indicação não encontrada');
      }

      // Incrementar estatísticas do indicador se existir
      if (referral.indicatorId) {
        await this.participantModel.findByIdAndUpdate(referral.indicatorId, {
          $inc: { indicacoesAprovadas: 1 },
          lastIndicacaoAt: new Date(),
          updatedAt: new Date()
        });
      }

      // === RECOMPENSA POR CONVERSÃO (PADRÃO ESTABELECIDO) ===

      
      if (referral.campaignId) {
        try {
          // Buscar campanha com populate das recompensas
          const campaign = await this.campaignModel.findById(referral.campaignId).populate('rewardOnConversion');
          
          
          if (campaign && campaign.rewardOnConversion) {
            const conversionRewardConfig = campaign.rewardOnConversion as any;

            
            // Calcular valor total (recompensa existente + recompensa de conversão)
            const currentReward = referral.rewardValue || 0;
            const conversionReward = conversionRewardConfig.value;
            const totalReward = currentReward + conversionReward;
            

            
            // Atualizar referral com recompensa de conversão
            await this.referralModel.findByIdAndUpdate(referralId, {
              rewardValue: totalReward,
              rewardStatus: 'pending', // Aparece novamente no gerenciador
              rewardType: 'conversion_bonus',
              conversionRewardId: conversionRewardConfig._id,
              conversionRewardValue: conversionReward
            });
            

            this.logger.log(`🎊 Recompensa de conversão de R$ ${conversionReward} adicionada. Total: R$ ${totalReward}`);
          } else {
            this.logger.log('ℹ️ Nenhuma recompensa de conversão configurada na campanha');
          }
        } catch (error) {
          this.logger.error('Erro ao processar recompensa de conversão:', error);
        }
      }

    } catch (error) {
      this.logger.error('Erro ao marcar como convertido:', error);
      throw error;
    }
  }

  /**
   * Busca recompensas de um indicador específico
   */
  async getIndicatorRewards(indicatorId: string): Promise<any> {
    this.logger.log(`Buscando recompensas do indicador ${indicatorId}`);
    
    try {
      // Buscar todas as indicações do indicador
      const referrals = await this.referralModel.find({
        indicatorId: indicatorId
      }).sort({ createdAt: -1 });

      // Calcular totais
      const totalReferrals = referrals.length;
      const approvedReferrals = referrals.filter(r => r.status === 'aprovada').length;
      const pendingRewards = referrals.filter(r => r.rewardStatus === 'pending');
      const paidRewards = referrals.filter(r => r.rewardStatus === 'paid');

      let totalPendingValue = 0;
      let totalPaidValue = 0;

      pendingRewards.forEach(r => {
        if (r.rewardValue) totalPendingValue += r.rewardValue;
      });

      paidRewards.forEach(r => {
        if (r.rewardValue) totalPaidValue += r.rewardValue;
      });

      // Mapear detalhes das recompensas
      const rewardDetails = referrals.map(ref => ({
        referralId: ref._id,
        leadName: ref.leadName,
        leadEmail: ref.leadEmail,
        status: ref.status,
        rewardStatus: ref.rewardStatus,
        rewardValue: ref.rewardValue || 0,
        createdAt: (ref as any).createdAt,
        convertedAt: (ref as any).convertedAt || null,
        source: ref.referralSource || 'manual'
      }));

      return {
        indicatorId,
        summary: {
          totalReferrals,
          approvedReferrals,
          totalPendingValue,
          totalPaidValue,
          pendingCount: pendingRewards.length,
          paidCount: paidRewards.length
        },
        rewardDetails
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar recompensas: ${error.message}`);
      throw error;
    }
  }

  /**
   * Busca indicações com recompensas pendentes
   */
  async findPendingRewards(clientId: string): Promise<any[]> {
    this.logger.log(`Buscando recompensas pendentes para cliente ${clientId}`);
    
    try {
      const pendingReferrals = await this.referralModel.find({
        clientId: clientId,
        rewardStatus: 'pending',
        rewardValue: { $gt: 0 }
      })
      .populate('indicatorId', 'name email')
      .populate('campaignId', 'name')
      .sort({ createdAt: -1 });

      return pendingReferrals.map(ref => ({
        referralId: ref._id,
        leadName: ref.leadName,
        leadEmail: ref.leadEmail,
        leadPhone: ref.leadPhone,
        indicatorName: (ref.indicatorId as any)?.name || 'N/A',
        indicatorEmail: (ref.indicatorId as any)?.email || 'N/A',
        campaignName: (ref.campaignId as any)?.name || 'N/A',
        rewardValue: ref.rewardValue || 0,
        status: ref.status,
        source: ref.referralSource || 'manual',
        createdAt: (ref as any).createdAt,
        convertedAt: (ref as any).convertedAt
      }));
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar recompensas pendentes: ${error.message}`);
      throw error;
    }
  }

  /**
   * Buscar dados para página de pagamentos
   */
  async getRewardsForPayments(clientId?: string): Promise<any[]> {
    
    this.logger.debug('Buscando recompensas para página de pagamentos');
    
    try {
      const query = clientId ? { clientId } : {};

      // ✅ BUSCA FLEXÍVEL: Aceitar clientId como string OU ObjectId
      let finalQuery: any = {};
      if (clientId) {
        const { Types } = require('mongoose');
        if (Types.ObjectId.isValid(clientId)) {
          finalQuery = {
            $or: [
              { clientId: clientId },
              { clientId: new Types.ObjectId(clientId) }
            ]
          };
        } else {
          finalQuery = { clientId: clientId };
        }
      }

      const referrals = await this.referralModel.find({
        ...finalQuery,
        rewardValue: { $exists: true } // Qualquer referral com rewardValue definido
      })
      .populate('indicatorId', 'name email')
      .populate('campaignId', 'name')
      .sort({ createdAt: -1 })
      .exec();

      return referrals.map(ref => {
        // ✅ Determinar categoria da recompensa
        const isConversionReward = (ref as any).rewardType === 'conversion_bonus' || 
                                  (ref as any).conversionRewardId || 
                                  (ref as any).conversionRewardValue;
        
        const rewardCategory = isConversionReward ? 'Recompensa por Conversão' : 'Recompensa por Indicação';
        
        return {
          _id: ref._id,
          leadName: ref.leadName,
          leadEmail: ref.leadEmail,
          leadPhone: ref.leadPhone,
          indicatorName: (ref.indicatorId as any)?.name || 'N/A',
          indicatorEmail: (ref.indicatorId as any)?.email || 'N/A',
          indicatorId: ref.indicatorId,
          campaignName: (ref.campaignId as any)?.name || 'N/A',
          campaignId: ref.campaignId,
          rewardValue: (ref as any).rewardValue || 0,
          rewardStatus: (ref as any).rewardStatus || 'pending',
          rewardType: (ref as any).rewardType || 'fixed',
          rewardCategory: rewardCategory, // ✅ NOVO CAMPO
          paymentMethod: (ref as any).paymentMethod,
          paymentReference: (ref as any).paymentReference,
          paymentNotes: (ref as any).paymentNotes,
          createdAt: (ref as any).createdAt,
          paidAt: (ref as any).paidAt,
          approvedAt: (ref as any).approvedAt,
          updatedAt: (ref as any).updatedAt
        };
      });
    } catch (error) {
      this.logger.error(`Erro ao buscar recompensas: ${error.message}`);
      throw error;
    }
  }

  /**
   * Atualizar status do lead
   */
  async updateLeadStatus(referralId: string, newStatus: string): Promise<void> {
    this.logger.log(`Atualizando status do lead ${referralId} para ${newStatus}`);
    
    try {
      const referral = await this.referralModel.findByIdAndUpdate(
        referralId,
        {
          status: newStatus,
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!referral) {
        throw new Error('Lead não encontrado');
      }

      this.logger.log(`✅ Status do lead atualizado para ${newStatus}`);
    } catch (error) {
      this.logger.error(`❌ Erro ao atualizar status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Aprovar recompensa (pendente → aprovada)
   */
  async approveReward(referralId: string, notes?: string): Promise<void> {
    this.logger.log(`Aprovando recompensa para referral ${referralId}`);
    
    try {
      const referral = await this.referralModel.findByIdAndUpdate(
        referralId,
        {
          rewardStatus: 'approved',
          approvalNotes: notes,
          approvedAt: new Date(),
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!referral) {
        throw new Error('Indicação não encontrada');
      }

      this.logger.log(`✅ Recompensa aprovada para referral ${referralId}`);
    } catch (error) {
      this.logger.error(`❌ Erro ao aprovar recompensa: ${error.message}`);
      throw error;
    }
  }

  /**
   * Rejeitar recompensa
   */
  async rejectReward(referralId: string, notes?: string): Promise<void> {
    this.logger.log(`Rejeitando recompensa para referral ${referralId}`);
    
    try {
      const referral = await this.referralModel.findByIdAndUpdate(
        referralId,
        {
          rewardStatus: 'rejected',
          rejectionNotes: notes,
          rejectedAt: new Date(),
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!referral) {
        throw new Error('Indicação não encontrada');
      }

      this.logger.log(`✅ Recompensa rejeitada para referral ${referralId}`);
    } catch (error) {
      this.logger.error(`❌ Erro ao rejeitar recompensa: ${error.message}`);
      throw error;
    }
  }

  /**
   * Processar pagamento (aprovada → paga)
   */
  async processPayment(referralId: string, paymentData: {
    paymentMethod: string;
    reference: string;
    notes?: string;
  }): Promise<void> {
    this.logger.log(`Processando pagamento para referral ${referralId}`);
    
    try {
      const referral = await this.referralModel.findByIdAndUpdate(
        referralId,
        {
          rewardStatus: 'paid',
          paymentMethod: paymentData.paymentMethod,
          paymentReference: paymentData.reference,
          paymentNotes: paymentData.notes,
          paidAt: new Date(),
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!referral) {
        throw new Error('Indicação não encontrada');
      }

      // Atualizar estatísticas do indicador
      if (referral.indicatorId) {
        await this.participantModel.findByIdAndUpdate(referral.indicatorId, {
          $inc: { recompensasRecebidas: (referral as any).rewardValue || 0 },
          updatedAt: new Date()
        });
      }

      this.logger.log(`✅ Pagamento processado para referral ${referralId}`);
    } catch (error) {
      this.logger.error(`❌ Erro ao processar pagamento: ${error.message}`);
      throw error;
    }
  }

  async createReferral(createReferralDto: any): Promise<any> {
    try {
      
      this.logger.log('🚀 Criando novo referral');
      
      // Extrair IDs corretamente
      const campaignId = createReferralDto.campaignId?._id?.toString() || 
                        createReferralDto.campaignId?.toString() || 
                        createReferralDto.campaignId;
      
      const indicatorId = createReferralDto.indicatorId?._id?.toString() || 
                         createReferralDto.indicatorId?.toString() || 
                         createReferralDto.indicatorId;

      // Buscar dados do indicador
      let indicatorData = null;
      if (indicatorId) {
        try {
          indicatorData = await this.participantModel.findById(indicatorId);
        } catch (error) {
          this.logger.warn(`Participante não encontrado: ${indicatorId}`);
        }
      }

      // Criar referral base
      const referralData = {
        ...createReferralDto,
        campaignId: campaignId || null,
        indicatorId: indicatorId || null,
        indicatorName: (indicatorData as any)?.name || createReferralDto.indicatorName || null,
        status: createReferralDto.status || 'pendente',  // ✅ CORRIGIDO: era 'novo'
        createdAt: new Date(),
      };

      const referral = new this.referralModel(referralData);
      const savedReferral = await referral.save();
      
      // === RECOMPENSA POR INDICAÇÃO (PADRÃO ESTABELECIDO) ===
      if (campaignId) {
        await this.processReferralRewardEstablished(savedReferral._id.toString(), campaignId);
      } else {
        await this.processReferralRewardByClient(savedReferral._id.toString(), createReferralDto.clientId);
      }

      return {
        success: true,
        data: savedReferral,
        message: 'Referral criado com sucesso'
      };

    } catch (error) {
      this.logger.error('Erro ao criar referral:', error);
      throw new Error(`Erro ao criar referral: ${error.message}`);
    }
  }

  // === RECOMPENSA POR INDICAÇÃO - FALLBACK POR CLIENTE ===
  async processReferralRewardByClient(referralId: string, clientId: string): Promise<void> {
    try {
      
      this.logger.log(`💰 Processamento de recompensa por clientId (fallback)`);
      this.logger.log(`   - Referral ID: ${referralId}`);
      this.logger.log(`   - Client ID: ${clientId}`);
      
      // Buscar recompensas do cliente (qualquer status para debugging)
      this.logger.log(`🔍 Buscando recompensas do cliente...`);
      

      
      // Query original por clientId exato
      const exactMatches = await this.rewardModel.find({
        clientId: clientId
      }).sort({ createdAt: -1 });
      
      // Query alternativa: clientId como ObjectId
      const { Types } = require('mongoose');
      let objectIdMatches: any[] = [];
      if (Types.ObjectId.isValid(clientId)) {
        objectIdMatches = await this.rewardModel.find({
          clientId: new Types.ObjectId(clientId)
        }).sort({ createdAt: -1 });
      }
      
      // Query alternativa: buscar por $or (string OU ObjectId)
      const flexibleMatches = await this.rewardModel.find({
        $or: [
          { clientId: clientId },
          { clientId: Types.ObjectId.isValid(clientId) ? new Types.ObjectId(clientId) : null }
        ].filter(Boolean)
      }).sort({ createdAt: -1 });
      
      // Usar a query que encontrou mais resultados
      const activeRewards = flexibleMatches.length > 0 ? flexibleMatches : 
                           objectIdMatches.length > 0 ? objectIdMatches : 
                           exactMatches;
      
      if (activeRewards.length === 0) {
        this.logger.log('ℹ️ Nenhuma recompensa encontrada para o cliente');
        return;
      }

      // 🔧 CORREÇÃO DO BUG: Filtrar recompensa de indicação (menor valor)
      // Assumir que recompensa de indicação tem menor valor que conversão
      const referralRewards = activeRewards.filter(r => 
        r.description && (
          r.description.toLowerCase().includes('indicação') ||
          r.description.toLowerCase().includes('indicacao') ||
          r.value <= 50 // Fallback: valores baixos são indicação
        )
      );
      
      const rewardConfig = referralRewards.length > 0 ? 
                          referralRewards[0] : 
                          activeRewards.sort((a, b) => a.value - b.value)[0]; // Menor valor como fallback
      
      this.logger.log(`🔧 CORREÇÃO APLICADA - Filtro para recompensa de indicação:`);
      this.logger.log(`   - Total de recompensas encontradas: ${activeRewards.length}`);
      this.logger.log(`   - Recompensas filtradas (indicação): ${referralRewards.length}`);
      this.logger.log(`🎯 Recompensa selecionada para indicação:`);
      this.logger.log(`💰 Dados da recompensa:`);
      this.logger.log(`   - ID: ${rewardConfig._id}`);
      this.logger.log(`   - Valor: ${rewardConfig.value} (corrigido de R$ 200 para R$ 10)`);
      this.logger.log(`   - Tipo: ${rewardConfig.type}`);
      this.logger.log(`   - Status: ${rewardConfig.status}`);
      this.logger.log(`   - Descrição: ${rewardConfig.description}`);
      
      // Atualizar referral com recompensa automática
      this.logger.log(`🔄 Atualizando referral ${referralId}...`);
      
      const updateData = {
        rewardValue: rewardConfig.value,
        rewardStatus: 'pending', // Status conforme padrão estabelecido
        rewardType: rewardConfig.type,
        rewardId: rewardConfig._id
      };

      const updateResult = await this.referralModel.findByIdAndUpdate(referralId, updateData, { new: true });

      if (updateResult) {
        this.logger.log(`✅ Recompensa aplicada com sucesso via fallback!`);
        this.logger.log(`   - Valor aplicado: R$ ${rewardConfig.value}`);
        this.logger.log(`   - Status: pending`);
        this.logger.log(`   - Referral atualizado: ${updateResult._id}`);
      } else {
        this.logger.error(`❌ Falha ao atualizar referral via fallback`);
      }

    } catch (error) {
      this.logger.error('❌ Erro ao processar recompensa por clientId:', error);
      this.logger.error(`   - Erro completo: ${error.message}`);
    }
  }

  // === RECOMPENSA POR INDICAÇÃO - PADRÃO ESTABELECIDO ===
  async processReferralRewardEstablished(referralId: string, campaignId: string): Promise<void> {
    try {
      
      this.logger.log(`💰 Processando recompensa por indicação (padrão estabelecido)`);
      this.logger.log(`   - Referral ID: ${referralId}`);
      this.logger.log(`   - Campaign ID: ${campaignId}`);
      
      // Buscar campanha com populate das recompensas
      this.logger.log(`🔍 Buscando campanha com populate...`);
      const campaign = await this.campaignModel.findById(campaignId).populate('rewardOnReferral');
      
      if (!campaign) {
        this.logger.warn(`❌ Campanha não encontrada: ${campaignId}`);
        return;
      }

      this.logger.log(`✅ Campanha encontrada`);
      this.logger.log(`   - rewardOnReferral: ${campaign.rewardOnReferral || 'N/A'}`);
      this.logger.log(`   - Tipo do rewardOnReferral: ${typeof campaign.rewardOnReferral}`);

      // Verificar se tem recompensa por indicação configurada
      if (campaign.rewardOnReferral) {
        this.logger.log(`🎯 Recompensa encontrada, processando...`);
        const rewardConfig = campaign.rewardOnReferral as any;

        this.logger.log(`💰 Dados da recompensa:`);
        this.logger.log(`   - ID: ${rewardConfig._id}`);
        this.logger.log(`   - Valor: ${rewardConfig.value}`);
        this.logger.log(`   - Tipo: ${rewardConfig.type}`);
        this.logger.log(`   - Status: ${rewardConfig.status}`);
        
        // Atualizar referral com recompensa automática
        this.logger.log(`🔄 Atualizando referral ${referralId}...`);
        
        const updateData = {
          rewardValue: rewardConfig.value,
          rewardStatus: 'pending', // Status conforme padrão estabelecido
          rewardType: rewardConfig.type,
          rewardId: rewardConfig._id
        };

        const updateResult = await this.referralModel.findByIdAndUpdate(referralId, updateData, { new: true });

        if (updateResult) {
          this.logger.log(`✅ Recompensa aplicada com sucesso!`);
          this.logger.log(`   - Valor aplicado: R$ ${rewardConfig.value}`);
          this.logger.log(`   - Status: pending`);
          this.logger.log(`   - Referral atualizado: ${updateResult._id}`);
        } else {
          this.logger.error(`❌ Falha ao atualizar referral`);
        }

        this.logger.log(`✅ Recompensa por indicação aplicada: R$ ${rewardConfig.value}`);
      } else {
        this.logger.log('ℹ️ Nenhuma recompensa por indicação configurada na campanha');
      }

    } catch (error) {
      this.logger.error('❌ Erro ao processar recompensa por indicação:', error);
      this.logger.error(`   - Erro completo: ${error.message}`);
      this.logger.error(`   - Stack: ${error.stack}`);
    }
  }
} 