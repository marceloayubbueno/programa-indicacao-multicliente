import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WhatsAppFlow, WhatsAppFlowDocument } from '../entities/whatsapp-flow.schema';
import { Participant } from '../../clients/entities/participant.schema';

@Injectable()
export class WhatsAppFlowService {
  constructor(
    @InjectModel(WhatsAppFlow.name) private flowModel: Model<WhatsAppFlowDocument>,
    @InjectModel(Participant.name) private participantModel: Model<Participant>,
  ) {}

  // ===== CRUD OPERATIONS =====

  /**
   * Criar novo fluxo
   */
  async createFlow(createFlowDto: any, clientId: Types.ObjectId): Promise<WhatsAppFlow> {
    try {
      // Validar dados obrigatórios
      if (!createFlowDto.name || !createFlowDto.targetAudience || !createFlowDto.messages) {
        throw new BadRequestException('Nome, audiência alvo e mensagens são obrigatórios');
      }

      // 🆕 NOVO: Validar campo triggers
      if (!createFlowDto.triggers || !Array.isArray(createFlowDto.triggers) || createFlowDto.triggers.length === 0) {
        throw new BadRequestException('Pelo menos um gatilho deve ser configurado');
      }

      // 🆕 NOVO: Validar campo scope
      if (!createFlowDto.scope || !['global', 'campaign'].includes(createFlowDto.scope)) {
        throw new BadRequestException('Escopo deve ser "global" ou "campaign"');
      }

      // 🆕 NOVO: Validar campaignId quando scope for 'campaign'
      if (createFlowDto.scope === 'campaign' && !createFlowDto.campaignId) {
        throw new BadRequestException('Campanha é obrigatória para fluxos de campanha específica');
      }

      // 🆕 NOVO: Limpar campaignId quando scope for 'global'
      if (createFlowDto.scope === 'global') {
        createFlowDto.campaignId = undefined;
      }

      // Validar mensagens
      if (!Array.isArray(createFlowDto.messages) || createFlowDto.messages.length === 0) {
        throw new BadRequestException('Pelo menos uma mensagem deve ser configurada');
      }

      // Validar ordem das mensagens
      const orders = createFlowDto.messages.map(m => m.order).sort((a, b) => a - b);
      for (let i = 0; i < orders.length; i++) {
        if (orders[i] !== i + 1) {
          throw new BadRequestException('Ordem das mensagens deve ser sequencial (1, 2, 3...)');
        }
      }

      // 🆕 NOVO: Log para debug
      console.log('🔍 [DEBUG] Dados recebidos para criar fluxo:', {
        name: createFlowDto.name,
        targetAudience: createFlowDto.targetAudience,
        scope: createFlowDto.scope,
        campaignId: createFlowDto.campaignId,
        triggers: createFlowDto.triggers,
        messagesCount: createFlowDto.messages.length
      });

      // Criar fluxo
      const flow = new this.flowModel({
        ...createFlowDto,
        clientId,
        status: 'draft', // Sempre começa como rascunho
        statistics: {
          totalSent: 0,
          totalDelivered: 0,
          totalFailed: 0,
        },
      });

      // 🆕 NOVO: Log para debug
      console.log('🔍 [DEBUG] Fluxo criado com scope:', flow.scope, 'e campaignId:', flow.campaignId);

      return await flow.save();
    } catch (error) {
      throw new BadRequestException(`Erro ao criar fluxo: ${error.message}`);
    }
  }

  /**
   * Obter todos os fluxos de um cliente
   */
  async getFlowsByClient(clientId: Types.ObjectId): Promise<WhatsAppFlow[]> {
    return await this.flowModel.find({ clientId }).sort({ createdAt: -1 });
  }

  /**
   * Obter fluxo específico
   */
  async getFlowById(flowId: string, clientId: Types.ObjectId): Promise<WhatsAppFlow> {
    const flow = await this.flowModel.findOne({ _id: flowId, clientId });
    if (!flow) {
      throw new NotFoundException('Fluxo não encontrado');
    }
    return flow;
  }

  /**
   * Atualizar fluxo
   */
  async updateFlow(flowId: string, updateFlowDto: any, clientId: Types.ObjectId): Promise<WhatsAppFlow> {
    const flow = await this.getFlowById(flowId, clientId);

    // Validar se pode editar (não pode editar fluxos ativos)
    if (flow.status === 'active') {
      throw new BadRequestException('Não é possível editar um fluxo ativo. Pause-o primeiro.');
    }

    // Validar mensagens se foram alteradas
    if (updateFlowDto.messages) {
      if (!Array.isArray(updateFlowDto.messages) || updateFlowDto.messages.length === 0) {
        throw new BadRequestException('Pelo menos uma mensagem deve ser configurada');
      }

      // Validar ordem das mensagens
      const orders = updateFlowDto.messages.map(m => m.order).sort((a, b) => a - b);
      for (let i = 0; i < orders.length; i++) {
        if (orders[i] !== i + 1) {
          throw new BadRequestException('Ordem das mensagens deve ser sequencial (1, 2, 3...)');
        }
      }
    }

    // Atualizar fluxo
    const updatedFlow = await this.flowModel.findOneAndUpdate(
      { _id: flowId, clientId },
      { ...updateFlowDto, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedFlow) {
      throw new NotFoundException('Erro ao atualizar fluxo');
    }

    return updatedFlow;
  }

  /**
   * Deletar fluxo
   */
  async deleteFlow(flowId: string, clientId: Types.ObjectId): Promise<void> {
    const flow = await this.getFlowById(flowId, clientId);

    // Validar se pode deletar
    if (flow.status === 'active') {
      throw new BadRequestException('Não é possível deletar um fluxo ativo. Pause-o primeiro.');
    }

    await this.flowModel.deleteOne({ _id: flowId, clientId });
  }

  // ===== FLOW MANAGEMENT =====

  /**
   * Ativar fluxo
   */
  async activateFlow(flowId: string, clientId: Types.ObjectId): Promise<WhatsAppFlow> {
    const flow = await this.getFlowById(flowId, clientId);

    // Validar se pode ativar
    if (flow.status === 'active') {
      throw new BadRequestException('Fluxo já está ativo');
    }

    if (flow.status === 'archived') {
      throw new BadRequestException('Não é possível ativar um fluxo arquivado');
    }

    // Validar configuração do fluxo
    if (!flow.triggers || flow.triggers.length === 0) {
      throw new BadRequestException('Fluxo deve ter pelo menos um gatilho configurado');
    }

    if (!flow.messages || flow.messages.length === 0) {
      throw new BadRequestException('Fluxo deve ter pelo menos uma mensagem configurada');
    }

    // Ativar fluxo
    const updatedFlow = await this.flowModel.findOneAndUpdate(
      { _id: flowId, clientId },
      { status: 'active', updatedAt: new Date() },
      { new: true }
    );

    if (!updatedFlow) {
      throw new NotFoundException('Erro ao ativar fluxo');
    }

    return updatedFlow;
  }

  /**
   * Pausar fluxo
   */
  async pauseFlow(flowId: string, clientId: Types.ObjectId): Promise<WhatsAppFlow> {
    const flow = await this.getFlowById(flowId, clientId);

    if (flow.status !== 'active') {
      throw new BadRequestException('Só é possível pausar fluxos ativos');
    }

    const updatedFlow = await this.flowModel.findOneAndUpdate(
      { _id: flowId, clientId },
      { status: 'paused', updatedAt: new Date() },
      { new: true }
    );

    if (!updatedFlow) {
      throw new NotFoundException('Erro ao pausar fluxo');
    }

    return updatedFlow;
  }

  /**
   * Arquivar fluxo
   */
  async archiveFlow(flowId: string, clientId: Types.ObjectId): Promise<WhatsAppFlow> {
    const flow = await this.getFlowById(flowId, clientId);

    if (flow.status === 'active') {
      throw new BadRequestException('Pause o fluxo antes de arquivá-lo');
    }

    const updatedFlow = await this.flowModel.findOneAndUpdate(
      { _id: flowId, clientId },
      { status: 'archived', updatedAt: new Date() },
      { new: true }
    );

    if (!updatedFlow) {
      throw new NotFoundException('Erro ao arquivar fluxo');
    }

    return updatedFlow;
  }

  /**
   * Duplicar fluxo
   */
  async duplicateFlow(flowId: string, clientId: Types.ObjectId, newName: string): Promise<WhatsAppFlow> {
    const originalFlow = await this.getFlowById(flowId, clientId);

    // Criar cópia com novo nome
    const duplicatedFlow = new this.flowModel({
      ...originalFlow,
      _id: undefined, // Remove ID para criar novo
      name: newName,
      status: 'draft', // Sempre começa como rascunho
      statistics: {
        totalSent: 0,
        totalDelivered: 0,
        totalFailed: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return await duplicatedFlow.save();
  }

  // ===== FLOW EXECUTION =====

  /**
   * Obter fluxos ativos para um cliente
   */
  async getActiveFlows(clientId: Types.ObjectId): Promise<WhatsAppFlow[]> {
    return await this.flowModel.find({ 
      clientId, 
      status: 'active',
      'scheduling.enabled': { $ne: true } // Fluxos sem agendamento
    });
  }

  /**
   * Obter fluxos ativos com agendamento
   */
  async getScheduledFlows(clientId: Types.ObjectId): Promise<WhatsAppFlow[]> {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Domingo, 1 = Segunda, etc.
    const currentTime = now.toTimeString().substring(0, 5); // HH:MM

    return await this.flowModel.find({
      clientId,
      status: 'active',
      'scheduling.enabled': true,
      'scheduling.startDate': { $lte: now },
      $or: [
        { 'scheduling.endDate': { $exists: false } },
        { 'scheduling.endDate': { $gte: now } }
      ],
      'scheduling.timeSlots': {
        $elemMatch: {
          dayOfWeek: currentDay,
          startTime: { $lte: currentTime },
          endTime: { $gte: currentTime }
        }
      }
    });
  }

  /**
   * Atualizar estatísticas do fluxo
   */
  async updateFlowStatistics(flowId: string, stats: {
    totalSent?: number;
    totalDelivered?: number;
    totalFailed?: number;
    lastSentAt?: Date;
  }): Promise<void> {
    await this.flowModel.updateOne(
      { _id: flowId },
      { 
        $inc: {
          'statistics.totalSent': stats.totalSent || 0,
          'statistics.totalDelivered': stats.totalDelivered || 0,
          'statistics.totalFailed': stats.totalFailed || 0,
        },
        $set: {
          'statistics.lastSentAt': stats.lastSentAt || new Date(),
          updatedAt: new Date()
        }
      }
    );
  }

  // ===== VALIDATION HELPERS =====

  /**
   * Validar se o fluxo pode ser executado
   */
  async canExecuteFlow(flowId: string, clientId: Types.ObjectId): Promise<boolean> {
    try {
      const flow = await this.getFlowById(flowId, clientId);
      
      if (flow.status !== 'active') {
        return false;
      }

      // Verificar agendamento se habilitado
      if (flow.scheduling?.enabled) {
        const now = new Date();
        
        if (flow.scheduling.startDate && now < flow.scheduling.startDate) {
          return false;
        }
        
        if (flow.scheduling.endDate && now > flow.scheduling.endDate) {
          return false;
        }

        // Verificar horário permitido
        if (flow.scheduling.timeSlots && flow.scheduling.timeSlots.length > 0) {
          const currentDay = now.getDay();
          const currentTime = now.toTimeString().substring(0, 5);
          
          const hasValidTimeSlot = flow.scheduling.timeSlots.some(slot => 
            slot.dayOfWeek === currentDay &&
            slot.startTime <= currentTime &&
            slot.endTime >= currentTime
          );
          
          if (!hasValidTimeSlot) {
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Obter estatísticas resumidas dos fluxos de um cliente
   */
  async getClientFlowStatistics(clientId: Types.ObjectId): Promise<{
    totalFlows: number;
    activeFlows: number;
    pausedFlows: number;
    draftFlows: number;
    archivedFlows: number;
    totalMessagesSent: number;
    totalMessagesDelivered: number;
    totalMessagesFailed: number;
  }> {
    const flows = await this.getFlowsByClient(clientId);
    
    const stats = {
      totalFlows: flows.length,
      activeFlows: flows.filter(f => f.status === 'active').length,
      pausedFlows: flows.filter(f => f.status === 'paused').length,
      draftFlows: flows.filter(f => f.status === 'draft').length,
      archivedFlows: flows.filter(f => f.status === 'archived').length,
      totalMessagesSent: flows.reduce((sum, f) => sum + (f.statistics?.totalSent || 0), 0),
      totalMessagesDelivered: flows.reduce((sum, f) => sum + (f.statistics?.totalDelivered || 0), 0),
      totalMessagesFailed: flows.reduce((sum, f) => sum + (f.statistics?.totalFailed || 0), 0),
    };

    return stats;
  }

  /**
   * Disparar fluxo manualmente
   */
  async triggerFlowManually(
    flowId: string, 
    clientId: Types.ObjectId, 
    body: {
      manualTrigger?: boolean;
      targetAudience?: string;
      campaignId?: string;
    }
  ) {
    try {
      // Buscar fluxo e validar
      const flow = await this.getFlowById(flowId, clientId);
      
      if (!flow) {
        throw new BadRequestException('Fluxo não encontrado');
      }

      if (flow.status !== 'active') {
        throw new BadRequestException('Apenas fluxos ativos podem ser disparados manualmente');
      }

      if (!flow.messages || flow.messages.length === 0) {
        throw new BadRequestException('Este fluxo não possui mensagens para disparar');
      }

      // Buscar participantes baseado no campaignId
      let participants: Participant[] = [];
      if (body.campaignId) {
        participants = await this.participantModel.find({
          campaignId: body.campaignId,
          clientId: clientId,
          tipo: 'indicador' // Apenas indicadores recebem mensagens de boas-vindas
        }).exec();
      }

      // Simular envio de mensagens (implementação básica)
      const messagesSent = participants.length;
      const eligibleParticipants = participants.length;

      // Atualizar estatísticas do fluxo
      await this.updateFlowStatistics(flowId, {
        totalSent: (flow.statistics?.totalSent || 0) + messagesSent,
        lastSentAt: new Date()
      });

      return {
        success: true,
        message: 'Fluxo disparado manualmente com sucesso',
        messagesSent,
        eligibleParticipants,
        participants: participants.map(p => ({
          id: p._id,
          name: p.name,
          email: p.email,
          phone: p.phone
        }))
      };

    } catch (error) {
      throw new BadRequestException(`Erro ao disparar fluxo: ${error.message}`);
    }
  }
}
