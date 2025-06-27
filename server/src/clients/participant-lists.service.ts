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
    // 🆕 AJUSTE: Permitir listas vazias para tipo "indicador" (geradas por campanhas)
    if (!dto.participants || dto.participants.length === 0) {
      if (dto.tipo === 'indicador' && dto.campaignId) {
        console.log('[CREATE-LIST] Criando lista vazia de indicadores para campanha:', dto.campaignName);
        dto.participants = []; // Lista vazia é permitida para indicadores
      } else {
        console.warn('[CREATE-LIST] Tentativa de criar lista sem participantes!');
        throw new Error('Lista deve conter pelo menos um participante');
      }
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
      console.log('[CREATE-LIST] Lista criada sem participantes iniciais (normal para listas de indicadores)');
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
   * Duplica uma lista de participantes para uma campanha, criando lista de indicadores
   */
  async duplicateListForCampaign(originalListId: string, campaignId: string, campaignName: string, clientId: string): Promise<ParticipantList> {
    console.log('[DUPLICATE-LIST] Duplicando lista para campanha...');
    console.log('[DUPLICATE-LIST] originalListId:', originalListId, 'campaignId:', campaignId);
    
    // Buscar a lista original
    const originalList = await this.participantListModel.findById(originalListId);
    if (!originalList) {
      throw new Error('Lista original não encontrada');
    }
    
    console.log('[DUPLICATE-LIST] Lista original encontrada:', originalList.name, 'com', originalList.participants?.length || 0, 'participantes');
    
    // Criar nova lista de indicadores
    const duplicatedListData = {
      name: `Indicadores - ${campaignName}`,
      description: `Lista de indicadores gerada automaticamente da campanha: ${campaignName}`,
      clientId: clientId,
      participants: originalList.participants || [], // Copia os participantes
      tipo: 'indicador' as const,
      campaignId: campaignId,
      campaignName: campaignName,
    };
    
    const duplicatedList = new this.participantListModel(duplicatedListData);
    const savedList = await duplicatedList.save();
    
    // Atualizar o campo 'lists' dos participantes para incluir a nova lista
    if (savedList.participants && savedList.participants.length > 0) {
      const participantIds = savedList.participants.map(id => new Types.ObjectId(id));
      console.log('[DUPLICATE-LIST] Atualizando', participantIds.length, 'participantes com nova lista');
      
      const updateResult = await this.participantModel.updateMany(
        { _id: { $in: participantIds } },
        { $addToSet: { lists: savedList._id } }
      );
      
      console.log('[DUPLICATE-LIST] ✅ Participantes atualizados:', updateResult.modifiedCount);
    }
    
    console.log('[DUPLICATE-LIST] ✅ Lista duplicada com sucesso:', savedList._id);
    return savedList;
  }
} 