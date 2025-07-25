import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Participant } from './entities/participant.schema';
import { ParticipantList } from './entities/participant-list.schema';
import { CreateParticipantDto } from './dto/create-participant.dto';
import { UpdateParticipantDto } from './dto/update-participant.dto';
import { ImportParticipantsDto } from './dto/import-participants.dto';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class ParticipantsService {
  constructor(
    @InjectModel(Participant.name) private participantModel: Model<Participant>,
    @InjectModel(ParticipantList.name) private participantListModel: Model<ParticipantList>,
  ) {}

  async create(dto: CreateParticipantDto) {
    console.log('🔧 BACKEND create participant chamado:', dto);
    let plainPassword: string | undefined = undefined;
    if (dto.tipo === 'indicador') {
      if (dto.plainPassword) {
        plainPassword = dto.plainPassword;
      } else {
        plainPassword = Math.random().toString(36).slice(-8);
      }
    }
    const participant = new this.participantModel({
      ...dto,
      plainPassword,
      participantId: (dto as any).participantId || uuidv4()
    });
    const savedParticipant = await participant.save();
    await this.autoAssociateToDefaultList(savedParticipant);
    return savedParticipant;
  }

  /**
   * 🚀 CORREÇÃO DEFINITIVA: Auto-associar participante a lista padrão
   */
  private async autoAssociateToDefaultList(participant: any) {
    try {
      console.log('🔧 AUTO-ASSOCIATION: Buscando lista padrão para:', participant.clientId);
      
      // 1. Buscar lista padrão existente do tipo "participante"
      let defaultList = await this.participantListModel.findOne({
        clientId: participant.clientId,
        tipo: 'participante',
        $or: [
          { name: /^Lista Geral$/i },
          { name: /^Participantes$/i },
          { name: /^Lista Principal$/i }
        ]
      }).exec();
      
      // 2. Se não existir, criar uma lista padrão
      if (!defaultList) {
        console.log('🔧 AUTO-ASSOCIATION: Criando lista padrão...');
        
        defaultList = new this.participantListModel({
          name: 'Lista Geral',
          description: 'Lista padrão criada automaticamente para novos participantes',
          clientId: participant.clientId,
          tipo: 'participante',
          participants: []
        });
        
        defaultList = await defaultList.save();
        console.log('✅ AUTO-ASSOCIATION: Lista padrão criada:', defaultList._id);
      }
      
      // 3. Verificar se o participante já está na lista
      const isAlreadyInList = defaultList.participants.includes(participant._id);
      if (isAlreadyInList) {
        console.log('ℹ️ AUTO-ASSOCIATION: Participante já está na lista padrão');
        return;
      }
      
      // 4. Associar participante à lista (sincronização bidirecional)
      await this.participantListModel.findByIdAndUpdate(
        defaultList._id,
        { $addToSet: { participants: participant._id } }
      );
      
      await this.participantModel.findByIdAndUpdate(
        participant._id,
        { $addToSet: { lists: defaultList._id } }
      );
      
      console.log(`✅ AUTO-ASSOCIATION: Participante ${participant.name} associado à lista "${defaultList.name}"`);
      
    } catch (error) {
      console.error('❌ AUTO-ASSOCIATION: Erro na associação automática:', error);
      // Não falhar a criação do participante por erro de associação
    }
  }

  async update(id: string, dto: UpdateParticipantDto) {
    // Permitir atualização de plainPassword se necessário
    return this.participantModel.findByIdAndUpdate(id, dto, { new: true });
  }

  async findAll(clientId: string, page = 1, limit = 20, filter: any = {}) {
    // 🚀 CORREÇÃO CRÍTICA: Processar filtro listId corretamente
    const { listId, ...otherFilters } = filter;
    const query: any = { clientId, ...otherFilters };
    
    // 🔧 FILTRO LISTID: Converter para query no campo "lists"
    if (listId) {
      console.log('🔧 LISTID FILTER: Aplicando filtro por lista:', listId);
      query.lists = { $in: [listId] };
      
      // 🔍 H2 - DIAGNÓSTICO FILTRO BACKEND DETALHADO
      console.log('🔍 H2 - FILTRO BACKEND APLICADO:', {
        originalFilter: filter,
        extractedListId: listId,
        listIdType: typeof listId,
        finalQuery: query,
        queryListsField: query.lists,
        clientId: clientId
      });
    } else {
      // 🔍 H2 - DIAGNÓSTICO QUANDO NÃO HÁ FILTRO
      console.log('🔍 H2 - SEM FILTRO DE LISTA:', {
        originalFilter: filter,
        hasListId: !!listId,
        listIdValue: listId || 'UNDEFINED',
        finalQuery: query
      });
    }
    
    // 🔍 DEBUG BACKEND SERVICE - Log da query
    console.log('🔍 DEBUG BACKEND SERVICE - ClientId:', clientId);
    console.log('🔍 DEBUG BACKEND SERVICE - Original filter:', filter);
    console.log('🔍 DEBUG BACKEND SERVICE - Query MongoDB CORRIGIDA:', query);
    console.log('🔍 DEBUG BACKEND SERVICE - Page:', page, 'Limit:', limit);
    
    // 🔍 H1 - DIAGNÓSTICO CLIENTID
    console.log('🔍 H1 - ClientId usado na consulta:', clientId);
    const participantsWithoutClientId = await this.participantModel.find({ 
      $or: [
        { clientId: { $exists: false } },
        { clientId: null },
        { clientId: '' }
      ]
    }).select('_id name email originSource campaignId').exec();
    console.log('🔍 H1 - Participantes sem clientId:', participantsWithoutClientId.length);
    
    // 🔍 H3 - DIAGNÓSTICO ORIGEM CAMPANHA
    const campaignParticipants = await this.participantModel.find({ 
      originSource: 'campaign',
      clientId: clientId
    }).select('_id name email originSource campaignId campaignName').exec();
    console.log('🔍 H3 - Participantes origin=campaign para este cliente:', campaignParticipants.length);
    
    const participantsWithCampaignId = await this.participantModel.find({ 
      campaignId: { $exists: true, $ne: null },
      clientId: clientId
    }).select('_id name email originSource campaignId campaignName').exec();
    console.log('🔍 H3 - Participantes com campaignId para este cliente:', participantsWithCampaignId.length);
    
    // 🔍 H6 - DIAGNÓSTICO CÓDIGO DE LIMPEZA DE DUPLICADOS
    console.log('🔍 H6 - Investigando possível remoção de participantes duplicados...');
    
    // Verificar participantes órfãos (sem listas)
    const orphanParticipants = await this.participantModel.find({ 
      clientId: clientId,
      $or: [
        { lists: { $exists: false } },
        { lists: { $size: 0 } },
        { lists: null }
      ]
    }).select('_id name email originSource campaignId').exec();
    console.log('🔍 H6 - Participantes órfãos (sem listas):', orphanParticipants.length);
    
    // Verificar se há participantes com campaignId mas sem estar em listas de campanha
    const campaignParticipantsNotInLists = await this.participantModel.find({
      clientId: clientId,
      campaignId: { $exists: true, $ne: null },
      $or: [
        { lists: { $exists: false } },
        { lists: { $size: 0 } },
        { lists: null }
      ]
    }).select('_id name email campaignId campaignName originSource').exec();
    console.log('🔍 H6 - Participantes de campanha SEM listas:', campaignParticipantsNotInLists.length);
    
    if (campaignParticipantsNotInLists.length > 0) {
      console.log('🔍 H6 - Detalhes dos participantes de campanha órfãos:', campaignParticipantsNotInLists.map(p => ({
        id: p._id,
        name: p.name,
        email: p.email,
        campaignId: p.campaignId,
        campaignName: p.campaignName
      })));
    }
    
    const total = await this.participantModel.countDocuments(query);
    console.log('🔍 DEBUG BACKEND SERVICE - Total documents found:', total);
    
    // 🔍 DEBUG BACKEND SERVICE - Verificar todos os participantes no banco
    const allParticipants = await this.participantModel.find({}).select('_id name email clientId originSource tipo').exec();
    console.log('🔍 DEBUG BACKEND SERVICE - ALL participants in DB:', allParticipants.length);
    console.log('🔍 DEBUG BACKEND SERVICE - ALL participants sample:', allParticipants.slice(0, 5).map(p => ({
      id: p._id,
      name: p.name,
      email: p.email,
      clientId: p.clientId,
      originSource: p.originSource,
      tipo: p.tipo
    })));
    
    // 🔍 DEBUG BACKEND SERVICE - Verificar participantes sem clientId
    const participantsWithoutClientIdOld = await this.participantModel.find({ 
      $or: [
        { clientId: { $exists: false } },
        { clientId: null },
        { clientId: '' }
      ]
    }).select('_id name email clientId originSource tipo').exec();
    
    console.log('🔍 DEBUG BACKEND SERVICE - Participants WITHOUT clientId:', participantsWithoutClientIdOld.length);
    if (participantsWithoutClientIdOld.length > 0) {
      console.log('🔍 DEBUG BACKEND SERVICE - Participants WITHOUT clientId details:', participantsWithoutClientIdOld.map(p => ({
        id: p._id,
        name: p.name,
        email: p.email,
        clientId: p.clientId,
        originSource: p.originSource,
        tipo: p.tipo
      })));
    }
    
    const participants = await this.participantModel
      .find(query)
      .populate({
        path: 'lists',
        model: 'ParticipantList',
        select: 'name tipo description'
      })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()
      .exec();

    // Adicionar plainPassword apenas para indicadores e se existir
    const participantsWithPassword = participants.map(p => {
      if (p.tipo === 'indicador' && p.plainPassword) {
        return { ...p, plainPassword: p.plainPassword };
      }
      return { ...p, plainPassword: undefined };
    });

    // 🔍 H2 - DIAGNÓSTICO MONGODB QUERY RESULT
    console.log('🔍 H2 - RESULTADO QUERY MONGODB:', {
      queryUsada: query,
      participantsEncontrados: participants.length,
      totalDocuments: total,
      temFiltroLista: !!query.lists,
      filtroListaValue: query.lists,
      participantsComListas: participants.filter(p => p.lists && p.lists.length > 0).length,
      participantsSemListas: participants.filter(p => !p.lists || p.lists.length === 0).length
    });
    
    // 🔍 H3 - DIAGNÓSTICO ESPECÍFICO: Verificar campo lists dos participantes
    if (participants.length > 0) {
      console.log('🔍 H3 - SAMPLE PARTICIPANTES COM LISTAS:', participants.slice(0, 3).map(p => ({
        id: p._id,
        name: p.name,
        email: p.email,
        lists: p.lists?.map(l => ({ id: l._id, name: (l as any).name })) || [],
        listsCount: p.lists?.length || 0,
        listsField: p.lists || 'UNDEFINED'
      })));
    } else {
      console.log('🔍 H3 - NENHUM PARTICIPANTE ENCONTRADO - Verificando todos participantes:');
      
      // Buscar TODOS os participantes deste cliente para diagnóstico
      const allParticipants = await this.participantModel
        .find({ clientId })
        .select('_id name email lists')
        .populate('lists', 'name _id')
        .exec();
      
      console.log('🔍 H3 - TODOS PARTICIPANTES CLIENTE:', {
        totalParticipants: allParticipants.length,
        participantsComListas: allParticipants.filter(p => p.lists && p.lists.length > 0).length,
        participantsSemListas: allParticipants.filter(p => !p.lists || p.lists.length === 0).length,
        listIdProcurado: query.lists?.$in?.[0] || 'NENHUM',
        amostraParticipantes: allParticipants.slice(0, 3).map(p => ({
          id: p._id,
          name: p.name,
          lists: p.lists?.map(l => (l as any)._id?.toString()) || [],
          temListaProcurada: p.lists?.some(l => (l as any)._id?.toString() === (query.lists?.$in?.[0] || ''))
        }))
      });
      
      // 🚨 CORREÇÃO AUTOMÁTICA: Se há participantes mas nenhum com listas, corrigir
      const participantsSemListas = allParticipants.filter(p => !p.lists || p.lists.length === 0).length;
      if (allParticipants.length > 0 && participantsSemListas > 0) {
        console.log('🚨 [AUTO-FIX] Detectados participantes órfãos - executando correção automática...');
        try {
          const fixResult = await this.fixOrphanParticipants(clientId);
          console.log('✅ [AUTO-FIX] Correção automática concluída:', fixResult);
          
          // Reexecutar query após correção
          console.log('🔄 [AUTO-FIX] Reexecutando query após correção...');
          const fixedParticipants = await this.participantModel
            .find(query)
            .populate({
              path: 'lists',
              model: 'ParticipantList',
              select: 'name tipo description'
            })
            .skip((page - 1) * limit)
            .limit(limit)
            .exec();
          
          console.log('🔄 [AUTO-FIX] Participantes encontrados após correção:', fixedParticipants.length);
          
          if (fixedParticipants.length > 0) {
            console.log('✅ [AUTO-FIX] Correção bem-sucedida! Retornando participantes corrigidos');
            return { 
              participants: fixedParticipants, 
              page, 
              totalPages: Math.ceil(fixedParticipants.length / limit),
              autoFixed: true,
              fixResult 
            };
          }
        } catch (fixError) {
          console.error('❌ [AUTO-FIX] Erro na correção automática:', fixError);
          // Não falhar a consulta por erro na correção
        }
      }
    }
    
    // 🔍 H2 - Verificar listas existentes para este cliente
    const allLists = await this.participantListModel
      .find({ clientId })
      .select('_id name tipo participants campaignId')
      .exec();
    console.log('🔍 H2 - Listas existentes para este cliente:', allLists.length);
    
    // 🔍 H6 - VERIFICAR LISTAS VAZIAS SUSPEITAS
    const emptyLists = allLists.filter(list => !list.participants || list.participants.length === 0);
    const campaignLists = allLists.filter(list => list.campaignId);
    const emptyCampaignLists = campaignLists.filter(list => !list.participants || list.participants.length === 0);
    
    console.log('🔍 H6 - Listas vazias (total):', emptyLists.length);
    console.log('🔍 H6 - Listas de campanha (total):', campaignLists.length);
    console.log('🔍 H6 - Listas de campanha VAZIAS:', emptyCampaignLists.length);
    
    if (emptyCampaignLists.length > 0) {
      console.log('🔍 H6 - SUSPEITO: Listas de campanha que estão vazias:', emptyCampaignLists.map(list => ({
        id: list._id,
        name: list.name,
        tipo: list.tipo,
        campaignId: list.campaignId,
        participantsCount: list.participants?.length || 0
      })));
    }
    
    allLists.forEach((list, idx) => {
      if (idx < 3) {
        console.log(`🔍 H2 - Lista ${idx + 1}:`, {
          id: list._id,
          name: list.name,
          tipo: list.tipo,
          participants: list.participants?.length || 0,
          campaignId: list.campaignId
        });
      }
    });
    
    console.log('🔍 DEBUG BACKEND SERVICE - Participants returned:', participants.length);
    console.log('🔍 DEBUG BACKEND SERVICE - Sample participants:', participants.slice(0, 2).map(p => ({
      id: p._id,
      name: p.name,
      email: p.email,
      originSource: p.originSource,
      tipo: p.tipo,
      clientId: p.clientId
    })));
    
    return { participants: participantsWithPassword, page, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    return this.participantModel.findById(id);
  }

  // 🔧 MÉTODO MELHORADO: Importar participantes com detecção de duplicatas
  async importMany(dto: ImportParticipantsDto) {
    console.log('🔍 [BACKEND-IMPORT] ============ INICIANDO IMPORTAÇÃO ============');
    console.log('🔍 [BACKEND-IMPORT] DTO recebido:', {
      clientId: dto.clientId,
      listId: dto.listId || 'NENHUM',
      tipoParticipante: dto.tipoParticipante,
      participantesCount: dto.participants.length
    });
    console.log('🔍 [BACKEND-IMPORT] Participantes a importar:', dto.participants.map(p => ({ 
      name: p.name, 
      email: p.email 
    })));

    // 🔍 H3 - DIAGNÓSTICO: Verificar se listId foi fornecido
    console.log('🔍 H3 - IMPORT SEM LISTID:', {
      hasListId: !!dto.listId,
      listIdValue: dto.listId || 'UNDEFINED',
      participantsCount: dto.participants.length,
      clientId: dto.clientId,
      willCreateOrphans: !dto.listId,
      timestamp: new Date().toISOString()
    });

    try {
      // 🎯 DETECÇÃO DE DUPLICATAS: Verificar emails já existentes
      const incomingEmails = dto.participants.map(p => p.email.toLowerCase());
      const existingParticipants = await this.participantModel.find({
        clientId: dto.clientId,
        email: { $in: incomingEmails }
      }).select('_id email name lists').exec();

      console.log(`🔍 [BACKEND-DUPLICATES] Verificação de duplicatas: ${existingParticipants.length} já existem de ${dto.participants.length} enviados`);
      
      // 🔍 DIAGNÓSTICO: Verificar estado dos participantes existentes
      console.log('🔍 [BACKEND-EXISTING] Participantes existentes encontrados:', existingParticipants.map(p => ({
        id: p._id,
        email: p.email,
        name: p.name,
        listsCount: p.lists?.length || 0,
        lists: p.lists?.map(l => l.toString()) || []
      })));

      // Separar novos dos existentes
      const existingEmails = existingParticipants.map(p => p.email.toLowerCase());
      const newParticipants = dto.participants.filter(p => !existingEmails.includes(p.email.toLowerCase()));

      console.log(`🔍 [BACKEND-SPLIT] ${newParticipants.length} novos participantes, ${existingParticipants.length} duplicatas`);
      console.log('🔍 [BACKEND-NEW] Novos participantes a criar:', newParticipants.map(p => ({ name: p.name, email: p.email })));

      // 🔧 CRIAR NOVOS PARTICIPANTES
      let insertedParticipants: any[] = [];
      if (newParticipants.length > 0) {
        const participants = newParticipants.map(p => ({
          ...p,
          clientId: dto.clientId,
          participantId: (p as any).participantId || uuidv4(),
          tipo: dto.tipoParticipante || 'participante',
          originSource: 'import',
          importedAt: new Date(),
          status: 'ativo'
        }));

        insertedParticipants = await this.participantModel.insertMany(participants);
        console.log(`✅ BACKEND ${insertedParticipants.length} novos participantes criados`);
      }

      // 🚀 SOLUÇÃO DEFINITIVA: SEMPRE sincronizar TODOS (novos + existentes) se listId fornecido
      if (dto.listId) {
        console.log('🔍 [BACKEND-SYNC] ============ INICIANDO SINCRONIZAÇÃO ============');
        console.log('🔍 [BACKEND-SYNC] ListId fornecido:', dto.listId);
        console.log('🔍 [BACKEND-SYNC] Vai sincronizar novos + existentes');
        
        // 🔍 H4 - DIAGNÓSTICO: Monitorar sincronização bidirecional
        console.log('🔍 H4 - SINCRONIZAÇÃO BIDIRECIONAL INICIO:', {
          listId: dto.listId,
          newParticipantsCount: insertedParticipants.length,
          existingParticipantsCount: existingParticipants.length,
          totalToSync: insertedParticipants.length + existingParticipants.length,
          timestamp: new Date().toISOString()
        });
        
        try {
          // Verificar se a lista existe
          const list = await this.participantListModel.findById(dto.listId);
          if (!list) {
            console.error('❌ BACKEND Lista não encontrada:', dto.listId);
            throw new Error('Lista não encontrada');
          }

          console.log('✅ BACKEND Lista encontrada:', list.name);

          // IDs de TODOS os participantes (novos + existentes)
          const allParticipantIds = [
            ...insertedParticipants.map(p => p._id),
            ...existingParticipants.map(p => p._id)
          ];

          console.log(`🔧 BACKEND Sincronizando ${allParticipantIds.length} participantes (${insertedParticipants.length} novos + ${existingParticipants.length} existentes)`);
          
          // 🔍 H4 - DIAGNÓSTICO: Antes da sincronização
          console.log('🔍 H4 - ANTES SINCRONIZAÇÃO:', {
            listCurrentParticipants: list.participants?.length || 0,
            participantsToAdd: allParticipantIds.length,
            listName: list.name,
            timestamp: new Date().toISOString()
          });
          
          // 1. Atualizar lista com TODOS os participantes (sem duplicatas)
          await this.participantListModel.findByIdAndUpdate(
            dto.listId,
            { $addToSet: { participants: { $each: allParticipantIds } } }
          );

          // 2. Atualizar TODOS os participantes com a lista (sem duplicatas)
          await this.participantModel.updateMany(
            { _id: { $in: allParticipantIds } },
            { $addToSet: { lists: dto.listId } }
          );

          console.log('✅ BACKEND Sincronização bidirecional aplicada para TODOS os participantes');

          // 3. VERIFICAÇÃO FINAL: Garantir que todos estão sincronizados
          console.log('🔍 BACKEND Verificação final...');
          
          // 🔍 H5 - DIAGNÓSTICO: Verificar estado final dos participantes
          for (const participantId of allParticipantIds) {
            const participant = await this.participantModel.findById(participantId);
            if (participant) {
              console.log(`🔍 H5 - ESTADO PARTICIPANTE ${participant.name}:`, {
                id: participantId,
                email: participant.email,
                associatedLists: participant.lists?.length || 0,
                listsIds: participant.lists?.map(l => l.toString()) || [],
                hasTargetList: participant.lists?.includes(dto.listId as any),
                timestamp: new Date().toISOString()
              });
              
              if (!participant.lists || !participant.lists.includes(dto.listId as any)) {
                console.log(`⚠️ BACKEND Re-sincronizando participante ${participantId}...`);
                await this.participantModel.findByIdAndUpdate(
                  participantId,
                  { $addToSet: { lists: dto.listId } }
                );
                
                console.log(`🔍 H5 - RE-SINCRONIZADO:`, {
                  participantId: participantId,
                  listId: dto.listId,
                  action: 'FORCE_SYNC',
                  timestamp: new Date().toISOString()
                });
              }
            }
          }
          
          // 4. Verificar contagem final
          const finalList = await this.participantListModel.findById(dto.listId);
          if (finalList) {
            console.log(`✅ BACKEND Lista "${finalList.name}" agora tem ${finalList.participants?.length || 0} participantes`);
            
            // 🔍 H4 - DIAGNÓSTICO: Resultado final da sincronização
            console.log('🔍 H4 - SINCRONIZAÇÃO FINAL COMPLETA:', {
              listId: dto.listId,
              listName: finalList.name,
              finalParticipantsCount: finalList.participants?.length || 0,
              expectedCount: allParticipantIds.length,
              syncSuccessful: (finalList.participants?.length || 0) >= allParticipantIds.length,
              timestamp: new Date().toISOString()
            });
          }
          
        } catch (syncError) {
          console.error('🔍 [BACKEND-SYNC-ERROR] Erro na sincronização automática:', syncError);
          // Não falhar a importação por erro de sincronização
        }
      } else {
        console.log('🔍 [BACKEND-NO-SYNC] ============ NENHUMA SINCRONIZAÇÃO ============');
        console.log('🔍 [BACKEND-NO-SYNC] ListId NÃO fornecido - participantes ficam órfãos!');
        console.log('🔍 [BACKEND-NO-SYNC] Participantes criados:', insertedParticipants.length);
        console.log('🔍 [BACKEND-NO-SYNC] Participantes existentes:', existingParticipants.length);
        console.log('🔍 [BACKEND-NO-SYNC] Estes participantes não estão associados a nenhuma lista');
        
        // 🔍 H3 - DIAGNÓSTICO: Confirmar criação de órfãos
        console.log('🔍 H3 - ÓRFÃOS CRIADOS:', {
          newOrphansCount: insertedParticipants.length,
          existingParticipantsCount: existingParticipants.length,
          totalOrphansCreated: insertedParticipants.length,
          listIdMissing: true,
          willTriggerAutoFix: true,
          orphansDetails: insertedParticipants.map(p => ({
            id: p._id,
            name: p.name,
            email: p.email,
            lists: p.lists || []
          })),
          timestamp: new Date().toISOString()
        });
      }

      const result = {
        success: true,
        message: `${insertedParticipants.length} novos participantes criados, ${existingParticipants.length} duplicatas associadas à lista`,
        participantsCreated: insertedParticipants.length,
        duplicatesFound: existingParticipants.length,
        totalProcessed: insertedParticipants.length + existingParticipants.length,
        listAssociated: !!dto.listId,
        autoSyncApplied: !!dto.listId
      };
      
      console.log('🔍 [BACKEND-RESULT] ============ RESULTADO FINAL ============');
      console.log('🔍 [BACKEND-RESULT] Resultado da importação:', result);
      
      return result;

    } catch (error) {
      console.error('❌ BACKEND Erro na importação:', error);
      throw error;
    }
  }

  async addToList(participantId: string, listId: string) {
    await this.participantListModel.findByIdAndUpdate(listId, { $addToSet: { participants: participantId } });
    await this.participantModel.findByIdAndUpdate(participantId, { $addToSet: { lists: listId } });
    return true;
  }

  async removeFromList(participantId: string, listId: string) {
    await this.participantListModel.findByIdAndUpdate(listId, { $pull: { participants: participantId } });
    await this.participantModel.findByIdAndUpdate(participantId, { $pull: { lists: listId } });
    return true;
  }

  async findIndicators() {
    // Participantes que estão em pelo menos uma lista (campanha)
    return this.participantModel.find({ lists: { $exists: true, $not: { $size: 0 } } })
      .populate({ path: 'lists', select: 'name nome' })
      .exec();
  }

  async remove(id: string) {
    const deleted = await this.participantModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException('Participante não encontrado');
    return { message: 'Participante removido com sucesso' };
  }

  async countByList(listId: string) {
    return this.participantModel.countDocuments({ lists: listId });
  }

  async transformToIndicators(participantIds: string[], campaignId: string, campaignName: string) {
    console.log('[H1] DIAGNÓSTICO - Transformação iniciada:', { participantIds, campaignId, campaignName });
    console.log('[PARTICIPANTS-SERVICE] Transformando', participantIds.length, 'participantes em indicadores...');
    
    // Verificar se os participantes existem
    const existingParticipants = await this.participantModel.find({ _id: { $in: participantIds } });
    
    console.log('[H1] DIAGNÓSTICO - Participantes encontrados:', existingParticipants.length);
    
    if (existingParticipants.length === 0) {
      console.error('[PARTICIPANTS-SERVICE] ❌ Nenhum participante encontrado com os IDs fornecidos!');
      console.error('[H1] DIAGNÓSTICO - ERRO: Nenhum participante encontrado para transformar');
      return { modifiedCount: 0, matchedCount: 0 };
    }
    
    console.log(`[PARTICIPANTS-SERVICE] Encontrados ${existingParticipants.length} participantes válidos`);
    
    // Transformar cada participante individualmente para triggar hooks
    let modifiedCount = 0;
    
    for (const participant of existingParticipants) {
      try {
        const beforeTransform = {
          id: participant._id,
          name: participant.name,
          tipo: participant.tipo,
          codigo: participant.uniqueReferralCode,
          campaignId: participant.campaignId
        };
        
        participant.tipo = 'indicador';
        participant.campaignId = new Types.ObjectId(campaignId);
        participant.campaignName = campaignName;
        participant.canIndicate = true;
        participant.updatedAt = new Date();
        
        // save() vai triggar o hook pre('save') que gera o código
        await participant.save();
        modifiedCount++;
        
        console.log('[H1] DIAGNÓSTICO - Participante ANTES da transformação:', beforeTransform);
        console.log('[H1] DIAGNÓSTICO - Participante APÓS transformação:', { 
          id: participant._id, 
          name: participant.name, 
          tipo: participant.tipo, 
          codigo: participant.uniqueReferralCode,
          campaignId: participant.campaignId,
          campaignName: participant.campaignName
        });
        
        console.log(`[PARTICIPANTS-SERVICE] ✅ ${participant.name} transformado - Código: ${participant.uniqueReferralCode}`);
      } catch (error) {
        console.error(`[PARTICIPANTS-SERVICE] ❌ Erro ao transformar ${participant.name}:`, error);
        console.error('[H1] DIAGNÓSTICO - ERRO na transformação:', { participantName: participant.name, error: error.message });
      }
    }
    
    console.log(`[PARTICIPANTS-SERVICE] ✅ ${modifiedCount} participantes transformados em indicadores com códigos gerados`);
    console.log('[H1] DIAGNÓSTICO - Resultado final transformação:', { modifiedCount, matchedCount: existingParticipants.length });
    
    return { modifiedCount, matchedCount: existingParticipants.length };
  }

  // === MÉTODOS PARA SISTEMA DE LINKS EXCLUSIVOS ===
  
  /**
   * Busca um indicador pelo código único de referral
   */
  async findByReferralCode(code: string): Promise<Participant | null> {
    try {
      return await this.participantModel
        .findOne({ 
          uniqueReferralCode: code,
          tipo: { $in: ['indicador', 'influenciador'] },
          status: 'ativo'
        })
        .populate('clientId', 'name')
        .populate('campaignId', 'name')
        .exec();
    } catch (error) {
      console.error('Erro ao buscar participante por código de referral:', error);
      return null;
    }
  }

  /**
   * Gera ou regenera código único para um indicador
   */
  async generateReferralCode(participantId: string): Promise<string | null> {
    try {
      const participant = await this.participantModel.findById(participantId);
      
      if (!participant || !['indicador', 'influenciador'].includes(participant.tipo)) {
        throw new Error('Participante não é um indicador válido');
      }

      // Gerar novo código único
      let newCode: string = '';
      let isUnique = false;
      let attempts = 0;
      
      while (!isUnique && attempts < 10) {
        newCode = this.generateUniqueCode();
        const existing = await this.participantModel.findOne({ uniqueReferralCode: newCode });
        if (!existing) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        throw new Error('Não foi possível gerar código único após 10 tentativas');
      }

      // Atualizar participante
      await this.participantModel.findByIdAndUpdate(participantId, {
        uniqueReferralCode: newCode,
        updatedAt: new Date()
      });

      return newCode;
    } catch (error) {
      console.error('Erro ao gerar código de referral:', error);
      return null;
    }
  }

  /**
   * Valida se um código de referral é válido e ativo
   */
  async validateReferralCode(code: string): Promise<{ valid: boolean; participant?: Participant; error?: string }> {
    // 🚨 [H2] DIAGNÓSTICO VALIDAÇÃO CÓDIGOS - Início da validação
    console.log(`🚨 [H2-VALIDATION] ========== VALIDANDO CÓDIGO ==========`);
    console.log(`🚨 [H2-VALIDATION] Timestamp: ${new Date().toISOString()}`);
    console.log(`🚨 [H2-VALIDATION] Código recebido: "${code}"`);
    console.log(`🚨 [H2-VALIDATION] Tipo do código: ${typeof code}`);
    console.log(`🚨 [H2-VALIDATION] Comprimento: ${code?.length || 0}`);
    
    try {
      if (!code || code.length < 6) {
        console.log(`🚨 [H2-VALIDATION] ❌ CÓDIGO MUITO CURTO: "${code}" (length: ${code?.length || 0})`);
        return { valid: false, error: 'Código inválido' };
      }

      console.log(`🚨 [H2-VALIDATION] 🔍 Buscando no banco de dados...`);
      
      // 🚨 [H2] Log da query no MongoDB
      const queryConditions = { 
        uniqueReferralCode: code,
        tipo: { $in: ['indicador', 'influenciador'] },
        status: 'ativo'
      };
      console.log(`🚨 [H2-VALIDATION] Query MongoDB:`, queryConditions);
      
      const participant = await this.findByReferralCode(code);
      
      console.log(`🚨 [H2-VALIDATION] Resultado da busca:`, {
        found: !!participant,
        participantId: participant?._id,
        participantName: participant?.name,
        participantEmail: participant?.email,
        participantTipo: participant?.tipo,
        participantStatus: participant?.status,
        participantCanIndicate: participant?.canIndicate,
        participantClientId: participant?.clientId
      });
      
      if (!participant) {
        console.log(`🚨 [H2-VALIDATION] ❌ PARTICIPANTE NÃO ENCONTRADO para código: "${code}"`);
        
        // 🚨 [H2] DIAGNÓSTICO EXTRA: Buscar códigos similares
        const similarCodes = await this.participantModel
          .find({ uniqueReferralCode: { $regex: code.substring(0, 3), $options: 'i' } })
          .select('uniqueReferralCode name email tipo status')
          .limit(5)
          .exec();
        
        console.log(`🚨 [H2-VALIDATION] Códigos similares encontrados:`, similarCodes.map(p => ({
          code: p.uniqueReferralCode,
          name: p.name,
          tipo: p.tipo,
          status: p.status
        })));
        
        // 🚨 [H2] DIAGNÓSTICO EXTRA: Contar total de indicadores
        const totalIndicators = await this.participantModel.countDocuments({
          tipo: { $in: ['indicador', 'influenciador'] },
          uniqueReferralCode: { $exists: true, $ne: null }
        });
        console.log(`🚨 [H2-VALIDATION] Total de indicadores com código: ${totalIndicators}`);
        
        return { valid: false, error: 'Código não encontrado ou indicador inativo' };
      }

      if (!participant.canIndicate) {
        console.log(`🚨 [H2-VALIDATION] ❌ INDICADOR NÃO AUTORIZADO: ${participant.name} (canIndicate: ${participant.canIndicate})`);
        return { valid: false, error: 'Indicador não autorizado a fazer indicações' };
      }

      console.log(`🚨 [H2-VALIDATION] ✅ CÓDIGO VÁLIDO: ${participant.name} (${participant.email})`);
      return { valid: true, participant };
    } catch (error) {
      console.error(`🚨 [H2-VALIDATION] 💥 ERRO NA VALIDAÇÃO:`, error);
      console.error(`🚨 [H2-VALIDATION] Stack trace:`, error.stack);
      return { valid: false, error: 'Erro interno na validação' };
    }
  }

  /**
   * Incrementa estatísticas do indicador
   */
  async incrementIndicatorStats(participantId: string, type: 'total' | 'approved'): Promise<void> {
    try {
      const updateField = type === 'approved' ? 'indicacoesAprovadas' : 'totalIndicacoes';
      
      await this.participantModel.findByIdAndUpdate(participantId, {
        $inc: { [updateField]: 1 },
        lastIndicacaoAt: new Date(),
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Erro ao incrementar estatísticas do indicador:', error);
    }
  }

  /**
   * Gera código único (método auxiliar privado)
   */
  private generateUniqueCode(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 8);
    return `${timestamp}${randomPart}`.toUpperCase();
  }

  /**
   * Lista indicadores com seus links e estatísticas
   */
  async findIndicatorsWithLinks(clientId: string): Promise<any[]> {
    try {
      const indicators = await this.participantModel
        .find({ 
          clientId,
          tipo: { $in: ['indicador', 'influenciador'] },
          uniqueReferralCode: { $exists: true, $ne: null }
        })
        .select('name email phone uniqueReferralCode totalIndicacoes indicacoesAprovadas lastIndicacaoAt status campaignName')
        .sort({ createdAt: -1 })
        .exec();

      return indicators.map(indicator => ({
        _id: indicator._id,
        name: indicator.name,
        email: indicator.email,
        phone: indicator.phone,
        referralCode: indicator.uniqueReferralCode,
        referralLink: `/indicacao/${indicator.uniqueReferralCode}`,
        totalIndicacoes: indicator.totalIndicacoes || 0,
        indicacoesAprovadas: indicator.indicacoesAprovadas || 0,
        lastIndicacaoAt: indicator.lastIndicacaoAt,
        status: indicator.status,
        campaignName: indicator.campaignName || '-'
      }));
    } catch (error) {
      console.error('Erro ao listar indicadores com links:', error);
      return [];
    }
  }

  /**
   * Método de diagnóstico para verificar todos os participantes
   */
  async debugAllParticipants(currentClientId: string) {
    console.log('🔍 DEBUG SERVICE - ClientId do usuário logado:', currentClientId);
    
    // Buscar TODOS os participantes no banco
    const allParticipants = await this.participantModel.find({}).select('_id name email clientId originSource tipo campaignId originLandingPageId').exec();
    console.log('🔍 DEBUG SERVICE - Total de participantes no banco:', allParticipants.length);
    
    // Agrupar por clientId
    const byClientId: { [key: string]: any[] } = {};
    const withoutClientId: any[] = [];
    
    allParticipants.forEach(p => {
      const key = p.clientId?.toString() || 'SEM_CLIENT_ID';
      if (key === 'SEM_CLIENT_ID') {
        withoutClientId.push(p);
      } else {
        if (!byClientId[key]) byClientId[key] = [];
        byClientId[key].push(p);
      }
    });
    
    console.log('🔍 DEBUG SERVICE - Participantes por clientId:', Object.keys(byClientId).map(k => `${k}: ${byClientId[k].length}`));
    console.log('🔍 DEBUG SERVICE - Participantes SEM clientId:', withoutClientId.length);
    
    // Verificar participantes do cliente atual
    const currentClientParticipants = byClientId[currentClientId] || [];
    console.log('🔍 DEBUG SERVICE - Participantes do cliente atual:', currentClientParticipants.length);
    
    // Agrupar por originSource
    const byOriginSource: { [key: string]: any[] } = {};
    currentClientParticipants.forEach(p => {
      const origin = p.originSource || 'undefined';
      if (!byOriginSource[origin]) byOriginSource[origin] = [];
      byOriginSource[origin].push(p);
    });
    
    console.log('🔍 DEBUG SERVICE - Por originSource no cliente atual:', Object.keys(byOriginSource).map(k => `${k}: ${byOriginSource[k].length}`));
    
    // Verificar participantes de LP
    const lpParticipants = allParticipants.filter(p => 
      p.originSource === 'landing-page' || 
      p.originLandingPageId
    );
    
    console.log('🔍 DEBUG SERVICE - Participantes de LP (total):', lpParticipants.length);
    console.log('🔍 DEBUG SERVICE - Participantes de LP samples:', lpParticipants.slice(0, 3).map(p => ({
      id: p._id,
      name: p.name,
      email: p.email,
      clientId: p.clientId?.toString(),
      originSource: p.originSource,
      originLandingPageId: p.originLandingPageId?.toString()
    })));
    
    return {
      totalParticipants: allParticipants.length,
      byClientId: Object.keys(byClientId).map(k => ({ clientId: k, count: byClientId[k].length })),
      withoutClientId: withoutClientId.length,
      currentClient: {
        clientId: currentClientId,
        count: currentClientParticipants.length,
        byOriginSource: Object.keys(byOriginSource).map(k => ({ origin: k, count: byOriginSource[k].length }))
      },
      lpParticipants: {
        total: lpParticipants.length,
        samples: lpParticipants.slice(0, 5).map(p => ({
          id: p._id,
          name: p.name,
          email: p.email,
          clientId: p.clientId?.toString(),
          originSource: p.originSource,
          originLandingPageId: p.originLandingPageId?.toString()
        }))
      }
    };
  }

  /**
   * 🔧 CORREÇÃO AUTOMÁTICA: Detectar e corrigir participantes órfãos
   */
  async fixOrphanParticipants(clientId: string) {
    console.log('🔧 [FIX-ORPHANS] ============ INICIANDO CORREÇÃO ============');
    console.log('🔧 [FIX-ORPHANS] ClientId:', clientId);
    
    try {
      // 1. Buscar todos os participantes órfãos (sem listas)
      const orphanParticipants = await this.participantModel.find({
        clientId: clientId,
        $or: [
          { lists: { $exists: false } },
          { lists: { $size: 0 } },
          { lists: null }
        ]
      }).exec();
      
      console.log('🔧 [FIX-ORPHANS] Participantes órfãos encontrados:', orphanParticipants.length);
      
      if (orphanParticipants.length === 0) {
        console.log('✅ [FIX-ORPHANS] Nenhum participante órfão encontrado');
        return { success: true, message: 'Nenhum participante órfão', fixed: 0 };
      }
      
      // 2. Buscar ou criar lista padrão
      let defaultList = await this.participantListModel.findOne({
        clientId: clientId,
        tipo: 'participante',
        $or: [
          { name: /^Lista Geral$/i },
          { name: /^Participantes$/i },
          { name: /^Lista Principal$/i }
        ]
      }).exec();
      
      if (!defaultList) {
        console.log('🔧 [FIX-ORPHANS] Criando lista padrão...');
        defaultList = new this.participantListModel({
          name: 'Lista Geral',
          description: 'Lista padrão criada automaticamente',
          clientId: clientId,
          tipo: 'participante',
          participants: []
        });
        defaultList = await defaultList.save();
        console.log('✅ [FIX-ORPHANS] Lista padrão criada:', defaultList._id);
      }
      
      // 3. Associar todos os órfãos à lista padrão
      console.log('🔧 [FIX-ORPHANS] Associando órfãos à lista padrão...');
      
      const orphanIds = orphanParticipants.map(p => p._id);
      
      // Atualizar lista com os participantes
      await this.participantListModel.findByIdAndUpdate(
        defaultList._id,
        { $addToSet: { participants: { $each: orphanIds } } }
      );
      
      // Atualizar participantes com a lista
      await this.participantModel.updateMany(
        { _id: { $in: orphanIds } },
        { $set: { lists: [defaultList._id] } }
      );
      
      console.log(`✅ [FIX-ORPHANS] ${orphanParticipants.length} participantes associados à lista "${defaultList.name}"`);
      
      return {
        success: true,
        message: `${orphanParticipants.length} participantes associados à lista padrão`,
        fixed: orphanParticipants.length,
        listId: defaultList._id,
        listName: defaultList.name
      };
      
    } catch (error) {
      console.error('❌ [FIX-ORPHANS] Erro na correção:', error);
      throw error;
    }
  }
} 