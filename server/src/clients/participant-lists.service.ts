import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ParticipantList } from './entities/participant-list.schema';
import { CreateParticipantListDto } from './dto/create-participant-list.dto';
import { UpdateParticipantListDto } from './dto/update-participant-list.dto';
import { Participant } from './entities/participant.schema';

@Injectable()
export class ParticipantListsService {
  constructor(
    @InjectModel(ParticipantList.name) private participantListModel: Model<ParticipantList>,
    @InjectModel(Participant.name) private participantModel: Model<Participant>,
  ) {}

  async create(dto: CreateParticipantListDto) {
    console.log('[CREATE-LIST] DTO recebido:', dto);
    
    // 🆕 CORREÇÃO: Permitir listas vazias temporariamente durante processo de import
    // Listas vazias são úteis quando:
    // 1. Criando lista para depois importar participantes de Excel
    // 2. Criando lista de indicadores para campanhas
    // 3. Criando lista template para depois popular
    
    if (!dto.participants || dto.participants.length === 0) {
      console.log('[CREATE-LIST] Criando lista vazia (será populada depois):', dto.name);
      dto.participants = []; // Lista vazia é permitida
    }
    
    const list = new this.participantListModel(dto);
    const savedList = await list.save();
    
    // Atualiza o campo 'lists' dos participantes selecionados (se houver)
    if (dto.participants && dto.participants.length > 0) {
      const participantIds = dto.participants.map(id => new Types.ObjectId(id));
      console.log('[CREATE-LIST] Atualizando participantes:', participantIds);
      const updateResult = await this.participantModel.updateMany(
        { _id: { $in: participantIds } },
        { $addToSet: { lists: savedList._id } }
      );
      console.log('[CREATE-LIST] Resultado updateMany:', updateResult.modifiedCount);
    } else {
      console.log('[CREATE-LIST] Lista criada vazia - será populada posteriormente');
    }
    
    return savedList;
  }

  async update(id: string, dto: UpdateParticipantListDto) {
    console.log('[UPDATE-LIST] DTO recebido:', dto);
    // Atualiza a lista
    const updatedList = await this.participantListModel.findByIdAndUpdate(id, dto, { new: true });
    // Atualiza o campo 'lists' dos participantes
    if (Array.isArray(dto.participants) && dto.participants.length > 0) {
      const participantIds = dto.participants.map(pid => new Types.ObjectId(pid));
      console.log('[UPDATE-LIST] Atualizando participantes:', participantIds);
      // Adiciona a lista para novos participantes
      const addResult = await this.participantModel.updateMany(
        { _id: { $in: participantIds }, lists: { $ne: id } },
        { $addToSet: { lists: id } }
      );
      // Remove a lista dos participantes que não estão mais nela
      const listDoc = await this.participantListModel.findById(id);
      const allParticipantIds = (listDoc?.participants || []).map(p => p.toString());
      const toRemove = allParticipantIds.filter(pid =>
        !(Array.isArray(dto.participants) ? dto.participants.map(String) : []).includes(pid)
      );
      if (toRemove.length > 0) {
        const removeIds = toRemove.map(pid => new Types.ObjectId(pid));
        const removeResult = await this.participantModel.updateMany(
          { _id: { $in: removeIds } },
          { $pull: { lists: id } }
        );
        console.log('[UPDATE-LIST] Removidos da lista:', removeIds, removeResult.modifiedCount);
      }
      console.log('[UPDATE-LIST] Adicionados à lista:', participantIds, addResult.modifiedCount);
    }
    return updatedList;
  }

  async findAll(clientId: string) {
    console.log('🔍 [LISTS-FIND] ============ BUSCANDO LISTAS ============');
    console.log('🔍 [LISTS-FIND] Cliente ID:', clientId);
    
    // 🚀 CORREÇÃO AUTOMÁTICA: Verificar e corrigir participantes órfãos
    try {
      console.log('🔍 [AUTO-FIX] Verificando participantes órfãos antes de buscar listas...');
      // Note: Usando this.participantModel diretamente já que está injetado
      const orphanParticipants = await this.participantModel.find({
        clientId: clientId,
        tipo: 'participante',
        $or: [
          { lists: { $exists: false } },
          { lists: { $size: 0 } },
          { lists: null }
        ]
      }).exec();
      
      // 🔍 H1 - DIAGNÓSTICO: Detectar criação automática da Lista Geral
      console.log('🔍 H1 - DIAGNÓSTICO LISTA GERAL AUTOMÁTICA:', {
        clientId: clientId,
        foundOrphans: orphanParticipants.length,
        orphansDetails: orphanParticipants.map(p => ({
          id: p._id,
          name: p.name,
          email: p.email,
          createdAt: p.createdAt,
          originSource: p.originSource
        })),
        timestamp: new Date().toISOString()
      });
      
      if (orphanParticipants.length > 0) {
        console.log(`🔍 [ORPHANS-FOUND] ============ ÓRFÃOS DETECTADOS ============`);
        console.log(`🔍 [ORPHANS-FOUND] Quantidade de órfãos: ${orphanParticipants.length}`);
        console.log('🔍 [ORPHANS-FOUND] Participantes órfãos:', orphanParticipants.map(p => ({
          id: p._id,
          name: p.name,
          email: p.email,
          listsCount: p.lists?.length || 0
        })));
        
        // 🚨 PROBLEMA: Esta lógica cria "Lista Geral" automaticamente
        console.log('🔍 [AUTO-FIX-PROBLEM] ============ PROBLEMA IDENTIFICADO ============');
        console.log('🔍 [AUTO-FIX-PROBLEM] Este código vai criar "Lista Geral" automaticamente!');
        console.log('🔍 [AUTO-FIX-PROBLEM] Isso é o que está causando o problema relatado!');
        
        // Buscar ou criar lista padrão
        let defaultList = await this.participantListModel.findOne({
          clientId: clientId,
          tipo: 'participante',
          $or: [
            { name: /^Lista Geral$/i },
            { name: /^Participantes$/i },
            { name: /^Lista Principal$/i }
          ]
        }).exec();
        
        console.log('🔍 [DEFAULT-LIST] Lista Geral existente encontrada:', !!defaultList);
        
        // 🔍 H1 - DIAGNÓSTICO: Monitorar criação da Lista Geral
        if (!defaultList) {
          console.log('🔍 H1 - CRIAR LISTA GERAL AUTOMÁTICA:', {
            trigger: 'AUTO_FIX_ORPHANS',
            orphansCount: orphanParticipants.length,
            clientId: clientId,
            willCreateListGeral: true,
            timestamp: new Date().toISOString()
          });
          
          console.log('🔍 [CREATE-GENERAL] ============ CRIANDO LISTA GERAL ============');
          console.log('🔍 [CREATE-GENERAL] Este é o momento onde "Lista Geral" é criada!');
          
          defaultList = new this.participantListModel({
            name: 'Lista Geral',
            description: 'Lista padrão criada automaticamente para novos participantes',
            clientId: clientId,
            tipo: 'participante',
            participants: []
          });
          defaultList = await defaultList.save();
          console.log('🔍 [CREATE-GENERAL] Lista Geral criada com ID:', defaultList._id);
          
          // 🔍 H1 - DIAGNÓSTICO: Confirmar criação
          console.log('🔍 H1 - LISTA GERAL CRIADA AUTOMATICAMENTE:', {
            listId: defaultList._id,
            listName: defaultList.name,
            clientId: defaultList.clientId,
            autoCreated: true,
            timestamp: new Date().toISOString()
          });
        } else {
          console.log('🔍 H1 - LISTA GERAL JÁ EXISTE:', {
            listId: defaultList._id,
            listName: defaultList.name,
            participantsCount: defaultList.participants?.length || 0,
            reusingExisting: true,
            timestamp: new Date().toISOString()
          });
        }
        
        // Associar órfãos à lista padrão
        const orphanIds = orphanParticipants.map(p => p._id);
        console.log('🔍 [ORPHAN-MOVE] Movendo órfãos para Lista Geral:', orphanIds);
        
        await this.participantListModel.findByIdAndUpdate(
          defaultList._id,
          { $addToSet: { participants: { $each: orphanIds } } }
        );
        
        await this.participantModel.updateMany(
          { _id: { $in: orphanIds } },
          { $addToSet: { lists: defaultList._id } }
        );
        
        console.log(`🔍 [ORPHAN-MOVED] ${orphanParticipants.length} participantes movidos para Lista Geral`);
        
        // 🔍 H1 - DIAGNÓSTICO: Resultado final
        console.log('🔍 H1 - RESULTADO AUTO-FIX:', {
          orphansFixed: orphanParticipants.length,
          movedToListId: defaultList._id,
          listGeneralFinalCount: (defaultList.participants?.length || 0) + orphanParticipants.length,
          autoFixCompleted: true,
          timestamp: new Date().toISOString()
        });
      } else {
        console.log('🔍 [NO-ORPHANS] Nenhum participante órfão encontrado');
        console.log('🔍 H1 - SEM ÓRFÃOS DETECTADOS:', {
          clientId: clientId,
          orphansFound: 0,
          autoFixSkipped: true,
          timestamp: new Date().toISOString()
        });
      }
    } catch (autoFixError) {
      console.error('❌ AUTO-FIX: Erro na correção automática (continuando busca):', autoFixError);
      console.log('🔍 H1 - ERRO NO AUTO-FIX:', {
        error: autoFixError.message,
        clientId: clientId,
        autoFixFailed: true,
        timestamp: new Date().toISOString()
      });
    }
    
    // Busca as listas
    const lists = await this.participantListModel.find({ clientId });
    
    // Para cada lista, adiciona a contagem de participantes
    const listsWithCount = await Promise.all(
      lists.map(async (list) => {
        const listObj = list.toObject();
        // Conta participantes diretamente no array da lista
        listObj.participantCount = list.participants ? list.participants.length : 0;
        return listObj;
      })
    );
    
    console.log(`✅ FIND-ALL-LISTS: Retornando ${listsWithCount.length} listas para cliente`);
    return listsWithCount;
  }

  async findById(id: string) {
    const list = await this.participantListModel.findById(id).exec();
    if (!list) {
      return null;
    }
    
    let participants: any[] = [];
    
    if (list.participants && list.participants.length > 0) {
      participants = await this.participantModel.find({
        _id: { $in: list.participants }
      }).lean().exec();
    } else {
      participants = await this.participantModel.find({
        lists: id
      }).lean().exec();
      
      if (participants.length > 0) {
        const participantIds = participants.map(p => p._id);
        await this.participantListModel.findByIdAndUpdate(id, {
          participants: participantIds
        });
      }
    }
    
    // 🎯 SOLUÇÃO FINAL: Incluir campos extras de forma segura
    const cleanParticipants = participants.map(participant => ({
      _id: participant._id,
      name: participant.name,
      email: participant.email,
      phone: participant.phone,
      tipo: participant.tipo,
      status: participant.status,
      createdAt: participant.createdAt,
      // 🌟 CAMPOS EXTRAS SEGUROS
      originCampaignId: participant.originCampaignId ? String(participant.originCampaignId) : undefined,
      company: participant.company ? String(participant.company) : undefined,
      originMetadata: participant.originMetadata ? {
        source: participant.originMetadata.source,
        campaignName: participant.originMetadata.campaignName,
        landingPage: participant.originMetadata.landingPage,
        referrer: participant.originMetadata.referrer
      } : undefined
    }));
    
    // Retornar lista com participantes populados
    const listObj = list.toObject();
    (listObj as any).participants = cleanParticipants;
    return listObj;
  }

  async addParticipant(listId: string, participantId: string) {
    console.log('[ADD-PARTICIPANT] Adicionando participante à lista...');
    console.log('[ADD-PARTICIPANT] listId:', listId, 'participantId:', participantId);
    
    // Atualizar ambos os lados da relação
    await this.participantListModel.findByIdAndUpdate(listId, { $addToSet: { participants: participantId } });
    await this.participantModel.findByIdAndUpdate(participantId, { $addToSet: { lists: listId } });
    
    console.log('[ADD-PARTICIPANT] ✅ Sincronização completa realizada');
    return { success: true, message: 'Participante adicionado com sucesso' };
  }

  async removeParticipant(listId: string, participantId: string) {
    console.log('[REMOVE-PARTICIPANT] Removendo participante da lista...');
    console.log('[REMOVE-PARTICIPANT] listId:', listId, 'participantId:', participantId);
    
    // Atualizar ambos os lados da relação
    await this.participantListModel.findByIdAndUpdate(listId, { $pull: { participants: participantId } });
    await this.participantModel.findByIdAndUpdate(participantId, { $pull: { lists: listId } });
    
    console.log('[REMOVE-PARTICIPANT] ✅ Sincronização completa realizada');
    return { success: true, message: 'Participante removido com sucesso' };
  }

  async remove(id: string) {
    return this.participantListModel.findByIdAndDelete(id);
  }

  /**
   * Duplica uma lista de participantes para uma campanha, criando lista de indicadores com participantes duplicados
   */
  async duplicateListForCampaign(originalListId: string, campaignId: string, campaignName: string, clientId: string): Promise<ParticipantList> {
    console.log('\n🚀=== INÍCIO DUPLICAÇÃO REAL ===');
    console.log('[H2] REAL-DUPLICATION - Parâmetros recebidos:', { 
      originalListId, 
      campaignId, 
      campaignName, 
      clientId,
      timestamp: new Date().toISOString()
    });
    console.log('[DUPLICATE-LIST] Duplicando lista e CRIANDO novos participantes indicadores...');
    
    // Buscar a lista original
    console.log('[DEBUG] 📋 Buscando lista original com ID:', originalListId);
    const originalList = await this.participantListModel.findById(originalListId);
    if (!originalList) {
      console.error('❌ [H2] REAL-DUPLICATION - ERRO: Lista original não encontrada');
      console.error('❌ [DEBUG] Lista ID que falhou:', originalListId);
      throw new Error('Lista original não encontrada');
    }
    
    console.log('✅ [DEBUG] Lista original encontrada:', { 
      id: originalListId, 
      name: originalList.name,
      tipo: originalList.tipo,
      participantsCount: originalList.participants?.length || 0,
      participantsArray: originalList.participants || [],
      hasParticipants: !!(originalList.participants && originalList.participants.length > 0)
    });
    
    // 🚀 NOVA IMPLEMENTAÇÃO: Duplicar participantes reais
    const newParticipantIds: Types.ObjectId[] = [];
    
    console.log('[DEBUG] 🔍 Verificando participantes da lista...');
    console.log('[DEBUG] originalList.participants:', originalList.participants);
    console.log('[DEBUG] É array?', Array.isArray(originalList.participants));
    console.log('[DEBUG] Tamanho:', originalList.participants?.length);
    
    if (originalList.participants && originalList.participants.length > 0) {
      console.log('🚀 [H2] REAL-DUPLICATION - Iniciando duplicação de', originalList.participants.length, 'participantes...');
      console.log('[DEBUG] IDs dos participantes a duplicar:', originalList.participants);
      
      for (const participantId of originalList.participants) {
        try {
          console.log(`\n🔄 [DEBUG] Processando participante ID: ${participantId}`);
          
          // Buscar participante original
          const originalParticipant = await this.participantModel.findById(participantId);
          if (!originalParticipant) {
            console.warn('⚠️ [H2] REAL-DUPLICATION - Participante não encontrado:', participantId);
            console.warn('[DEBUG] Pulando este participante...');
            continue;
          }
          
          console.log('✅ [DEBUG] Participante original encontrado:', {
            id: originalParticipant._id,
            name: originalParticipant.name,
            email: originalParticipant.email,
            tipo: originalParticipant.tipo,
            clientId: originalParticipant.clientId
          });
          
          console.log('🔄 [H2] REAL-DUPLICATION - Duplicando participante:', originalParticipant.name);
          
          // Criar novo participante indicador
          const { v4: uuidv4 } = await import('uuid');
          const newParticipant = new this.participantModel({
            // Dados copiados do original
            name: originalParticipant.name,
            email: originalParticipant.email,
            phone: originalParticipant.phone,
            company: originalParticipant.company,
            clientId: originalParticipant.clientId,
            status: originalParticipant.status || 'ativo',
            
            // Dados específicos da campanha
            tipo: 'indicador',
            campaignId: new Types.ObjectId(campaignId),
            campaignName: campaignName,
            canIndicate: true,
            
            // Novos identificadores únicos
            participantId: uuidv4(),
            // uniqueReferralCode será gerado automaticamente pelo hook pre('save')
            
            // Origem e rastreamento
            originSource: 'campaign-duplication',
            originalParticipantId: originalParticipant._id,
            originMetadata: {
              source: 'campaign-duplication',
              campaignName: campaignName,
              originalParticipantName: originalParticipant.name,
              originalParticipantEmail: originalParticipant.email,
              duplicatedAt: new Date()
            },
            
            // Estatísticas zeradas para novo indicador
            totalIndicacoes: 0,
            indicacoesAprovadas: 0,
            recompensasRecebidas: 0,
            
            // Listas será definida após salvar
            lists: []
          });
          
          console.log('[DEBUG] 💾 Salvando novo participante...');
          console.log('[DEBUG] Dados antes do save:', {
            name: newParticipant.name,
            email: newParticipant.email,
            tipo: newParticipant.tipo,
            campaignId: newParticipant.campaignId,
            campaignName: newParticipant.campaignName,
            originalParticipantId: newParticipant.originalParticipantId
          });
          
          // Salvar novo participante (hook gerará uniqueReferralCode)
          const savedParticipant = await newParticipant.save();
          newParticipantIds.push(savedParticipant._id);
          
          console.log('🎉 [H2] REAL-DUPLICATION - ✅ Participante duplicado COM SUCESSO!');
          console.log('[DEBUG] Resultado:', {
            original: { 
              id: originalParticipant._id, 
              name: originalParticipant.name, 
              tipo: originalParticipant.tipo 
            },
            novo: { 
              id: savedParticipant._id, 
              name: savedParticipant.name, 
              tipo: savedParticipant.tipo, 
              codigo: savedParticipant.uniqueReferralCode,
              campaignId: savedParticipant.campaignId,
              campaignName: savedParticipant.campaignName
            }
          });
          
        } catch (error) {
          console.error('💥 [H2] REAL-DUPLICATION - ❌ ERRO ao duplicar participante:', error.message);
          console.error('[DEBUG] Stack trace completo:', error.stack);
          console.error('[DEBUG] Participante que falhou:', participantId);
          // Continua com os próximos participantes
        }
      }
    } else {
      console.warn('⚠️ [DEBUG] PROBLEMA: Lista não tem participantes para duplicar!');
      console.warn('[DEBUG] originalList.participants:', originalList.participants);
      console.warn('[DEBUG] Tipo da lista:', originalList.tipo);
    }
    
    // Criar nova lista de indicadores com os novos participantes
    const duplicatedListData = {
      name: `Indicadores - ${campaignName}`,
      description: `Lista de indicadores gerada automaticamente da campanha: ${campaignName}`,
      clientId: clientId,
      participants: newParticipantIds, // ✅ Agora contém IDs dos NOVOS participantes duplicados
      tipo: 'indicador' as const,
      campaignId: campaignId,
      campaignName: campaignName,
    };
    
    console.log('[H2] REAL-DUPLICATION - Criando lista com novos participantes:', {
      name: duplicatedListData.name,
      newParticipantsCount: newParticipantIds.length,
      tipo: duplicatedListData.tipo,
      campaignId: duplicatedListData.campaignId
    });
    
    const duplicatedList = new this.participantListModel(duplicatedListData);
    const savedList = await duplicatedList.save();
    
    // Atualizar os novos participantes para incluir a nova lista
    if (newParticipantIds.length > 0) {
      const updateResult = await this.participantModel.updateMany(
        { _id: { $in: newParticipantIds } },
        { $addToSet: { lists: savedList._id } }
      );
      
      console.log('[H2] REAL-DUPLICATION - ✅ Novos participantes associados à lista:', updateResult.modifiedCount);
    }
    
    console.log('\n🏁 [H2] REAL-DUPLICATION - ✅ DUPLICAÇÃO REAL COMPLETA!');
    console.log('📊 [DEBUG] RESULTADO FINAL:', { 
      listaOriginalId: originalListId,
      listaDuplicadaId: savedList._id,
      participantesOriginais: originalList.participants?.length || 0,
      novosParticipantesCriados: newParticipantIds.length,
      idsNovosParticipantes: newParticipantIds,
      sucessoTotal: newParticipantIds.length === (originalList.participants?.length || 0),
      timestamp: new Date().toISOString()
    });
    
    if (newParticipantIds.length === 0) {
      console.error('🚨 [DEBUG] PROBLEMA CRÍTICO: Nenhum participante foi duplicado!');
      console.error('[DEBUG] Verifique os logs acima para identificar a causa');
    }
    
    console.log('🚀=== FIM DUPLICAÇÃO REAL ===\n');
    
    return savedList;
  }
} 