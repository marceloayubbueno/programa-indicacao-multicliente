import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Campaign } from './entities/campaign.schema';
import { ParticipantListsService } from '../clients/participant-lists.service';
import { ParticipantsService } from '../clients/participants.service';
import { RewardsService } from '../rewards/rewards.service';
import { LPIndicadoresService } from '../lp-indicadores/lp-indicadores.service';
import { LPDivulgacaoService } from '../lp-divulgacao/lp-divulgacao.service';

// Enum de tipos válidos de campanha
export const CAMPAIGN_TYPES = {
  LP_DIVULGACAO: 'lp-divulgacao',
  LP_INDICADORES: 'lp-indicadores',
  LISTA_PARTICIPANTES: 'lista-participantes',
  LINK_COMPARTILHAMENTO: 'link-compartilhamento',
};

@Injectable()
export class CampaignsService {
  constructor(
    @InjectModel(Campaign.name) private campaignModel: Model<Campaign>,
    private readonly participantListsService: ParticipantListsService,
    private readonly participantsService: ParticipantsService,
    private readonly rewardsService: RewardsService,
    private readonly lpIndicadoresService: LPIndicadoresService,
    private readonly lpDivulgacaoService: LPDivulgacaoService,
  ) {}

  async createCampaign(data: any): Promise<Campaign> {
    console.log('[CREATE-CAMPAIGN] Início', data);
    
    // Validação do tipo
    const validTypes = Object.values(CAMPAIGN_TYPES);
    if (!data.type || !validTypes.includes(data.type)) {
      throw new BadRequestException(
        `O campo type é obrigatório e deve ser um dos seguintes: ${validTypes.join(', ')}`
      );
    }

    let participantListId: Types.ObjectId | undefined;
    let campaignName: string = data.name;
    let createdCampaign: Campaign | null = null; // Inicializar como null

    try {
      // Cria a campanha primeiro para obter o _id
      const created = new this.campaignModel({
        ...data,
      });
      createdCampaign = await created.save();
      const campaignId = createdCampaign._id;

      // Duplicar recompensas-modelo, se fornecido
      const rewardTemplateIds: string[] = [];
      if (data.rewardOnReferralTemplateId) {
        rewardTemplateIds.push(data.rewardOnReferralTemplateId);
      }
      if (data.rewardOnConversionTemplateId) {
        rewardTemplateIds.push(data.rewardOnConversionTemplateId);
      }

      if (rewardTemplateIds.length > 0) {
        console.log('[CREATE-CAMPAIGN] Duplicando recompensas-modelo:', rewardTemplateIds);
        
        try {
          const rewardTemplates = await this.rewardsService['rewardModel'].find({ _id: { $in: rewardTemplateIds } });
          await this.rewardsService.duplicateRewardsForCampaign(rewardTemplates, campaignId, campaignName, data.clientId);
          console.log('[CREATE-CAMPAIGN] ✅ Recompensas duplicadas para campanha.');
        } catch (error) {
          console.error('[CREATE-CAMPAIGN] ❌ Erro ao duplicar recompensas:', error.message);
          // Não falha a criação da campanha se recompensas falharem
        }
      }

      // Processar diferentes tipos de campanha
      
      if (data.type === CAMPAIGN_TYPES.LISTA_PARTICIPANTES && data.selectedParticipantListId) {
        console.log('\n🎯 === INÍCIO CRIAÇÃO CAMPANHA COM LISTA ===');
        console.log('[H3] CAMPAIGN-DEBUG - Dados da campanha:', { 
          type: data.type, 
          selectedParticipantListId: data.selectedParticipantListId,
          campaignId: campaignId.toString(),
          campaignName: campaignName,
          clientId: data.clientId,
          timestamp: new Date().toISOString()
        });
        
        // Buscar a lista de participantes
        console.log('[CAMPAIGN-DEBUG] 🔍 Buscando lista com ID:', data.selectedParticipantListId);
        const participantList = await this.participantListsService.findById(data.selectedParticipantListId);
        if (!participantList) {
          console.error('❌ [H3] CAMPAIGN-DEBUG - ERRO: Lista de participantes não encontrada');
          console.error('[CAMPAIGN-DEBUG] ID que falhou:', data.selectedParticipantListId);
          throw new BadRequestException('Lista de participantes não encontrada');
        }

        console.log('✅ [CAMPAIGN-DEBUG] Lista original encontrada:', {
          id: participantList._id,
          name: participantList.name,
          tipo: participantList.tipo,
          participantsCount: participantList.participants?.length || 0,
          clientId: participantList.clientId
        });

        // 🚀 IMPLEMENTAÇÃO: Duplicar lista e criar novos participantes indicadores
        console.log('\n🚀 [CREATE-CAMPAIGN] Iniciando duplicação REAL de participantes...');
        console.log('[CAMPAIGN-DEBUG] Parâmetros para duplicação:', {
          originalListId: data.selectedParticipantListId,
          campaignId: campaignId.toString(),
          campaignName: campaignName,
          clientId: data.clientId
        });
        
        try {
          console.log('[CAMPAIGN-DEBUG] 📞 ANTES de chamar duplicateListForCampaign...');
          console.log('[CAMPAIGN-DEBUG] 🔍 DETALHES DA CHAMADA:', {
            selectedParticipantListId: data.selectedParticipantListId,
            campaignId: campaignId.toString(),
            campaignName: campaignName,
            clientId: data.clientId,
            functionExists: typeof this.participantListsService.duplicateListForCampaign === 'function'
          });
          
          // 1. Duplicar a lista criando nova lista de indicadores
          console.log('[CAMPAIGN-DEBUG] 🚀 EXECUTANDO duplicateListForCampaign AGORA...');
          const duplicatedList = await this.participantListsService.duplicateListForCampaign(
            data.selectedParticipantListId,
            campaignId.toString(),
            campaignName,
            data.clientId
          );
          console.log('[CAMPAIGN-DEBUG] 🏁 duplicateListForCampaign RETORNOU');
          
          console.log('🎉 [CAMPAIGN-DEBUG] duplicateListForCampaign retornou:', {
            listId: duplicatedList._id,
            listName: duplicatedList.name,
            participantsCount: duplicatedList.participants?.length || 0,
            participants: duplicatedList.participants
          });
          
          // 2. ✅ VERIFICAR RESULTADO DA DUPLICAÇÃO
          const newIndicatorsCount = duplicatedList.participants?.length || 0;
          console.log('[CAMPAIGN-DEBUG] ✅ Resultado da duplicação:', { 
            listaDuplicadaId: duplicatedList._id,
            listaDuplicadaNome: duplicatedList.name,
            novosIndicadoresCriados: newIndicatorsCount,
            idsNovosIndicadores: duplicatedList.participants,
            sucessoCompleto: newIndicatorsCount > 0
          });
          
          if (newIndicatorsCount > 0) {
            console.log('🎉 [CREATE-CAMPAIGN] ✅ Sucesso! Novos indicadores criados:', newIndicatorsCount);
          } else {
            console.error('🚨 [CREATE-CAMPAIGN] ❌ PROBLEMA: Nenhum indicador foi criado!');
          }
          
          // 3. Atualizar a campanha com o ID da nova lista
          participantListId = duplicatedList._id;
        await this.campaignModel.findByIdAndUpdate(campaignId, {
          participantListId: participantListId
        });

          console.log('[CAMPAIGN-DEBUG] ✅ Campanha atualizada com nova lista:', participantListId);
          
        } catch (error) {
          console.error('💥 [H3] CAMPAIGN-DEBUG - ERRO CRÍTICO na duplicação:', { 
            error: error.message, 
            stack: error.stack,
            originalListId: data.selectedParticipantListId,
            campaignId: campaignId.toString(),
            campaignName: campaignName
          });
          console.error('❌ [CREATE-CAMPAIGN] Falha na duplicação REAL:', error.message);
          throw new BadRequestException('Erro ao processar lista de participantes: ' + error.message);
        }
        
        console.log('🎯 === FIM CRIAÇÃO CAMPANHA COM LISTA ===\n');
      }

      // 🆕 NOVA FUNCIONALIDADE: Criar lista vazia de indicadores para LP de Indicadores
      if (data.type === CAMPAIGN_TYPES.LP_INDICADORES) {
        console.log('[CREATE-CAMPAIGN] 🚀 Criando lista vazia de indicadores para LP de Indicadores...');
        
        try {
          const indicatorList = await this.createIndicatorListForCampaign(
            campaignId.toString(),
            campaignName,
            data.clientId
          );
          
          console.log('[CREATE-CAMPAIGN] ✅ Lista de indicadores criada:', indicatorList._id);
          
          // Atualizar a campanha com o ID da nova lista
          participantListId = indicatorList._id;
          await this.campaignModel.findByIdAndUpdate(campaignId, {
            participantListId: participantListId
          });

          // 🔧 CORREÇÃO PRINCIPAL: Garantir vinculação bidirecional LP-Campanha
          if (data.lpIndicadoresId) {
            console.log('[CREATE-CAMPAIGN] 🔗 Vinculando LP de indicadores à campanha...');
            
            // Atualizar a LP com os dados da campanha
            const updateResult = await this.lpIndicadoresService.update(data.lpIndicadoresId, {
              campaignId: campaignId.toString(),
              campaignName: campaignName
            });
            
            console.log('[CREATE-CAMPAIGN] ✅ LP de indicadores vinculada à campanha');
            console.log('[CREATE-CAMPAIGN] 🔍 Dados da LP atualizada:', {
              id: (updateResult as any)._id,
              name: updateResult.name,
              campaignId: updateResult.campaignId,
              campaignName: updateResult.campaignName
            });
            
            // 🆕 VERIFICAÇÃO ADICIONAL: Confirmar que a vinculação foi bem-sucedida
            const lpCheck = await this.lpIndicadoresService.findOne(data.lpIndicadoresId);
            if (!lpCheck.campaignId || lpCheck.campaignId.toString() !== campaignId.toString()) {
              console.error('[CREATE-CAMPAIGN] ❌ ERRO: LP não foi adequadamente vinculada!');
              console.error('[CREATE-CAMPAIGN] ❌ Expected campaignId:', campaignId.toString());
              console.error('[CREATE-CAMPAIGN] ❌ Actual campaignId:', lpCheck.campaignId?.toString());
              
              // Tentar novamente com método direto
              console.log('[CREATE-CAMPAIGN] 🔄 Tentando vinculação direta...');
              await this.lpIndicadoresService['lpIndicadoresModel'].findByIdAndUpdate(
                data.lpIndicadoresId,
                {
                  campaignId: campaignId.toString(),
                  campaignName: campaignName
                }
              );
              console.log('[CREATE-CAMPAIGN] ✅ Vinculação direta aplicada');
            } else {
              console.log('[CREATE-CAMPAIGN] ✅ Vinculação confirmada com sucesso!');
            }
          }

          console.log('[CREATE-CAMPAIGN] ✅ Campanha atualizada com nova lista de indicadores:', participantListId);
          
        } catch (error) {
          console.error('[CREATE-CAMPAIGN] ❌ Erro ao criar lista de indicadores:', error.message);
          throw new BadRequestException('Erro ao criar lista de indicadores: ' + error.message);
        }
      }

      // Buscar a campanha atualizada para retorno
      const finalCampaign = await this.campaignModel.findById(campaignId)
        .populate('participantListId')
        .populate('rewardOnReferral')
        .populate('rewardOnConversion')
        .exec();

      console.log('[CREATE-CAMPAIGN] Campanha criada com sucesso:', finalCampaign?._id);
      return finalCampaign!;

    } catch (error) {
      console.error('[CREATE-CAMPAIGN] Erro:', error);
      
      // Cleanup se necessário (só se a campanha foi criada)
      if (createdCampaign && createdCampaign._id) {
        await this.campaignModel.findByIdAndDelete(createdCampaign._id);
      }
      
      throw error;
    }
  }

  async findByClient(clientId: string): Promise<Campaign[]> {
    return this.campaignModel.find({ clientId }).exec();
  }

  /**
   * 🆕 NOVA FUNCIONALIDADE: Buscar LP de Indicadores de uma campanha
   */
  async getCampaignLPIndicadores(campaignId: string, clientId: string): Promise<any> {
    // Buscar a campanha
    const campaign = await this.campaignModel.findOne({ 
      _id: campaignId, 
      clientId: clientId 
    }).exec();
    
    if (!campaign) {
      throw new BadRequestException('Campanha não encontrada');
    }

    // Se não for campanha de LP de indicadores, retornar null
    if (campaign.type !== 'lp-indicadores') {
      return null;
    }

    // Buscar a LP de indicadores vinculada
    if (campaign.lpIndicadoresId) {
      try {
        const lp = await this.lpIndicadoresService.findOne(campaign.lpIndicadoresId.toString());
        
        // 🔧 FIX: Extrair clientId corretamente (pode ser populated object ou string)
        const lpClientId = (lp?.clientId as any)?._id?.toString() || lp?.clientId?.toString();
        
        // 🔒 SEGURANÇA: Verificar ownership antes de retornar dados
        if (lpClientId !== clientId) {
          throw new BadRequestException('LP não encontrada ou não pertence ao cliente');
        }
        
        // 🔧 Gerar URLs absolutas corretas para LP de Indicadores
        const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
        const CLIENT_BASE_URL = process.env.CLIENT_BASE_URL || 'http://localhost:5501';
        
        // URLs corretas baseadas na função real:
        const publicUrl = lp.status === 'published' ? `https://lp.virallead.com.br/api/lp-indicadores/slug/${lp.slug}` : null;
        const editUrl = `${CLIENT_BASE_URL}/client/pages/lp-editor-grapes.html?id=${(lp as any)._id?.toString()}`;
        const previewUrl = `${CLIENT_BASE_URL}/client/pages/lp-preview.html?id=${(lp as any)._id?.toString()}`;

        return {
          campaign: {
            id: campaign._id,
            name: campaign.name,
            type: campaign.type
          },
          lpIndicadores: {
            id: (lp as any)._id?.toString(),
            name: lp.name,
            slug: lp.slug,
            status: lp.status,
            publicUrl: publicUrl,
            editUrl: editUrl,
            previewUrl: previewUrl,
            statistics: lp.statistics
          }
        };
      } catch (error) {
        throw error;
      }
    }

    return null;
  }

  async updateCampaign(campaignId: string, updateData: any): Promise<Campaign> {
    try {
      const updated = await this.campaignModel.findByIdAndUpdate(
        campaignId,
        updateData,
        { new: true }
      );
      
      if (!updated) {
        throw new Error('Campanha não encontrada');
      }
      
      return updated;
    } catch (error) {
      console.error('[UPDATE-CAMPAIGN] Erro:', error);
      throw error;
    }
  }

  /**
   * 🆕 NOVA FUNCIONALIDADE: Criar lista vazia de indicadores para campanha de LP de Indicadores
   */
  async createIndicatorListForCampaign(campaignId: string, campaignName: string, clientId: string): Promise<any> {
    console.log('[CREATE-INDICATOR-LIST] Criando lista para campanha:', campaignName);
    
    try {
      const listData = {
        name: `Indicadores - ${campaignName}`,
        description: `Lista de indicadores gerada automaticamente para a campanha "${campaignName}"`,
        tipo: 'indicador' as const,
        clientId: clientId,
        participants: [], // Lista vazia inicialmente
        campaignId: campaignId,
        campaignName: campaignName
      };

      const createdList = await this.participantListsService.create(listData);
      console.log('[CREATE-INDICATOR-LIST] ✅ Lista criada com sucesso:', createdList._id);
      
      return createdList;
    } catch (error) {
      console.error('[CREATE-INDICATOR-LIST] ❌ Erro ao criar lista:', error.message);
      throw error;
    }
  }

  // === MÉTODOS PARA SISTEMA DE RECOMPENSAS AUTOMÁTICAS ===

  /**
   * Vincula recompensas aos indicadores de uma campanha
   */
  async assignRewardsToIndicators(campaignId: string): Promise<void> {
    console.log('[REWARDS] Vinculando recompensas aos indicadores da campanha:', campaignId);
    
    try {
      // Buscar campanha
      const campaign = await this.campaignModel.findById(campaignId);
      if (!campaign) {
        throw new Error('Campanha não encontrada');
      }

      // Buscar recompensas da campanha
      const campaignRewards = await this.rewardsService.findByCampaign(campaignId);
      
      if (campaignRewards.length === 0) {
        console.log('[REWARDS] Nenhuma recompensa encontrada para a campanha');
        return;
      }

      // Buscar indicadores da campanha
      const indicatorsList = await this.participantListsService.findAll(campaign.clientId.toString());
      let indicatorIds: string[] = [];

      for (const list of indicatorsList) {
        if (list.tipo === 'indicador' && list.participants) {
          indicatorIds = indicatorIds.concat(
            list.participants.map(p => (typeof p === 'string' ? p : p.toString()))
          );
        }
      }

      if (indicatorIds.length === 0) {
        console.log('[REWARDS] Nenhum indicador encontrado na campanha');
        return;
      }

      // Vincular recompensas aos indicadores
      const rewardIds = campaignRewards.map((r: any) => r._id);
      
      const updateResult = await this.participantsService['participantModel'].updateMany(
        { 
          _id: { $in: indicatorIds },
          tipo: { $in: ['indicador', 'influenciador'] }
        },
        {
          $addToSet: { assignedRewards: { $each: rewardIds } },
          $set: { updatedAt: new Date() }
        }
      );

      console.log('[REWARDS] ✅ Recompensas vinculadas a', updateResult.modifiedCount, 'indicadores');
    } catch (error) {
      console.error('[REWARDS] ❌ Erro ao vincular recompensas:', error.message);
      throw error;
    }
  }

  /**
   * Calcula recompensas devidas para um indicador específico
   */
  async calculateRewardsForIndicator(indicatorId: string): Promise<any> {
    try {
      // Buscar indicador
      const indicator = await this.participantsService.findById(indicatorId);
      if (!indicator) {
        throw new Error('Indicador não encontrado');
      }

      // Buscar indicações do indicador
      const { InjectModel } = await import('@nestjs/mongoose');
      const mongoose = await import('mongoose');
      const ReferralModel = mongoose.model('Referral');
      
      const referrals = await ReferralModel.find({
        indicatorId: indicatorId,
        status: { $in: ['pendente', 'aprovada'] }
      });

      // Buscar recompensas atribuídas ao indicador
      let assignedRewards: any[] = [];
      if (indicator.assignedRewards && indicator.assignedRewards.length > 0) {
        assignedRewards = await this.rewardsService['rewardModel'].find({
          _id: { $in: indicator.assignedRewards }
        });
        

      }

      // Calcular recompensas devidas
      let totalPending = 0;
      let totalPaid = 0;
      const rewardDetails: any[] = [];

      for (const referral of referrals) {
        // Buscar recompensa por indicação
        const indicationReward = assignedRewards.find((r: any) => r.trigger === 'referral');
        if (indicationReward && referral.rewardStatus === 'pending') {
          totalPending += indicationReward.value || 0;
          rewardDetails.push({
            type: 'referral',
            referralId: referral._id,
            rewardId: indicationReward._id,
            value: indicationReward.value,
            status: 'pending',
            createdAt: referral.createdAt
          });
        }

        // Buscar recompensa por conversão (se aprovada)
        if (referral.status === 'aprovada') {
          const conversionReward = assignedRewards.find((r: any) => r.trigger === 'conversion');
          if (conversionReward && referral.rewardStatus === 'pending') {
            totalPending += conversionReward.value || 0;
            rewardDetails.push({
              type: 'conversion',
              referralId: referral._id,
              rewardId: conversionReward._id,
              value: conversionReward.value,
              status: 'pending',
              createdAt: referral.createdAt
            });
          }
        }
      }

      return {
        indicatorId,
        indicatorName: indicator.name,
        totalReferrals: referrals.length,
        approvedReferrals: referrals.filter(r => r.status === 'aprovada').length,
        totalPending,
        totalPaid,
        rewardDetails,
        assignedRewards: assignedRewards.map(r => ({
          id: r._id,
          name: r.name,
          type: r.type,
          value: r.value,
          trigger: r.trigger
        }))
      };
    } catch (error) {
      console.error('[REWARDS] Erro ao calcular recompensas:', error.message);
      throw error;
    }
  }

  /**
   * Processa recompensa automática quando uma indicação é criada
   */
  async processReferralReward(referralId: string): Promise<void> {
    console.log('[REWARDS] Processando recompensa para referral:', referralId);
    
    try {
      // Buscar referral
      const mongoose = await import('mongoose');
      const ReferralModel = mongoose.model('Referral');
      const referral = await ReferralModel.findById(referralId);
      
      if (!referral || !referral.indicatorId) {
        console.log('[REWARDS] Referral sem indicador, pulando processamento de recompensa');
        return;
      }

      // Buscar recompensas do indicador
      const indicator = await this.participantsService.findById(referral.indicatorId.toString());
      if (!indicator || !indicator.assignedRewards || indicator.assignedRewards.length === 0) {
        console.log('[REWARDS] Indicador sem recompensas atribuídas');
        return;
      }

      // Buscar recompensa por indicação
      const rewards = await this.rewardsService['rewardModel'].find({
        _id: { $in: indicator.assignedRewards },
        trigger: 'referral'
      });

      if (rewards.length > 0) {
        const reward = rewards[0]; // Pegar primeira recompensa por indicação
        
        // Atualizar referral com informações da recompensa
        await ReferralModel.findByIdAndUpdate(referralId, {
          rewardId: reward._id,
          rewardValue: reward.value,
          rewardStatus: 'pending'
        });

        console.log(`[REWARDS] ✅ Recompensa de R$ ${reward.value} atribuída ao referral ${referralId}`);
      }
    } catch (error) {
      console.error('[REWARDS] ❌ Erro ao processar recompensa:', error.message);
      // Não falha o fluxo principal
    }
  }

  /**
   * Marca uma conversão manual e processa recompensa adicional
   */
  async markConversion(referralId: string, notes?: string): Promise<void> {
    console.log('[REWARDS] Marcando conversão para referral:', referralId);
    
    try {
      const mongoose = await import('mongoose');
      const ReferralModel = mongoose.model('Referral');
      
      // Atualizar status do referral
      const referral = await ReferralModel.findByIdAndUpdate(
        referralId,
        {
          status: 'aprovada',
          conversionNotes: notes,
          convertedAt: new Date()
        },
        { new: true }
      );

      if (!referral || !referral.indicatorId) {
        throw new Error('Referral não encontrado ou sem indicador');
      }

      // Incrementar estatísticas do indicador
      await this.participantsService.incrementIndicatorStats(referral.indicatorId.toString(), 'approved');

      // Processar recompensa por conversão se existir
      const indicator = await this.participantsService.findById(referral.indicatorId.toString());
      if (indicator && indicator.assignedRewards) {
        const rewards = await this.rewardsService['rewardModel'].find({
          _id: { $in: indicator.assignedRewards },
          trigger: 'conversion'
        });

        if (rewards.length > 0) {
          const conversionReward = rewards[0];
          
          // Atualizar referral com recompensa de conversão
          await ReferralModel.findByIdAndUpdate(referralId, {
            $set: {
              conversionRewardId: conversionReward._id,
              conversionRewardValue: conversionReward.value
            }
          });

          console.log(`[REWARDS] ✅ Recompensa de conversão R$ ${conversionReward.value} atribuída`);
        }
      }

    } catch (error) {
      console.error('[REWARDS] ❌ Erro ao marcar conversão:', error.message);
      throw error;
    }
  }

  /**
   * 🔧 CORREÇÃO: Método para corrigir vinculações de LPs existentes
   */
  async repairLPCampaignLinks(): Promise<any> {
    console.log('[REPAIR] 🔧 Iniciando reparação de vinculações LP-Campanha...');
    
    try {
      // Buscar todas as campanhas que têm LP de indicadores
      const campaigns = await this.campaignModel.find({
        lpIndicadoresId: { $exists: true, $ne: null }
      }).exec();
      
      console.log('[REPAIR] 🔍 Encontradas', campaigns.length, 'campanhas com LPs de indicadores');
      
      const results = {
        total: campaigns.length,
        fixed: 0,
        errors: [] as string[]
      };
      
      for (const campaign of campaigns) {
        try {
          console.log(`[REPAIR] 🔧 Verificando campanha: ${campaign.name}`);
          
          // Verificar se campaign.lpIndicadoresId existe
          if (!campaign.lpIndicadoresId) {
            console.warn(`[REPAIR] ⚠️ Campaign ${campaign.name} não tem lpIndicadoresId`);
            results.errors.push(`Campaign ${campaign.name} não tem lpIndicadoresId`);
            continue;
          }
          
          // Buscar a LP
          const lp = await this.lpIndicadoresService.findOne(campaign.lpIndicadoresId.toString());
          
          if (!lp) {
            console.warn(`[REPAIR] ⚠️ LP não encontrada para campanha ${campaign.name}`);
            results.errors.push(`LP não encontrada para campanha ${campaign.name}`);
            continue;
          }
          
          // Verificar se a LP está adequadamente vinculada
          const needsRepair = !lp.campaignId || lp.campaignId.toString() !== campaign._id.toString();
          
          if (needsRepair) {
            console.log(`[REPAIR] 🔧 Reparando vinculação da LP: ${lp.name}`);
            
            // Atualizar a LP
            await this.lpIndicadoresService['lpIndicadoresModel'].findByIdAndUpdate(
              (lp as any)._id,
              {
                campaignId: campaign._id,
                campaignName: campaign.name
              }
            );
            
            console.log(`[REPAIR] ✅ LP ${lp.name} vinculada à campanha ${campaign.name}`);
            results.fixed++;
          } else {
            console.log(`[REPAIR] ✅ LP ${lp.name} já está adequadamente vinculada`);
          }
          
        } catch (error) {
          console.error(`[REPAIR] ❌ Erro ao reparar campanha ${campaign.name}:`, error.message);
          results.errors.push(`Erro na campanha ${campaign.name}: ${error.message}`);
        }
      }
      
      console.log('[REPAIR] 🎯 Reparação concluída!');
      console.log('[REPAIR] 📊 Resultados:', results);
      
      return results;
    } catch (error) {
      console.error('[REPAIR] ❌ Erro geral na reparação:', error.message);
      throw error;
    }
  }
} 