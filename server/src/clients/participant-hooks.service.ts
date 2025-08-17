import { Injectable, Logger } from '@nestjs/common';
import { WhatsAppFlowTriggerService } from '../whatsapp/whatsapp-flow-trigger.service';
import { Types } from 'mongoose';

@Injectable()
export class ParticipantHooksService {
  private readonly logger = new Logger(ParticipantHooksService.name);

  constructor(
    private readonly whatsAppFlowTriggerService: WhatsAppFlowTriggerService,
  ) {}

  /**
   * 🚀 Disparar gatilho WhatsApp para novo indicador
   * Chamado automaticamente pelo hook do Mongoose
   */
  async handleNewIndicator(participantData: {
    _id: Types.ObjectId;
    name: string;
    email: string;
    phone: string;
    tipo: string;
    clientId: Types.ObjectId;
    campaignId?: Types.ObjectId;
    createdAt?: Date;
  }): Promise<void> {
    try {
      this.logger.log('🚀 [HOOKS] Processando novo indicador:', participantData.name);

      // Verificar se é realmente um indicador
      if (participantData.tipo !== 'indicador') {
        this.logger.log('ℹ️ [HOOKS] Participante não é indicador, ignorando:', participantData.tipo);
        return;
      }

      // Disparar gatilho WhatsApp
      const result = await this.whatsAppFlowTriggerService.triggerIndicatorJoined(
        {
          id: participantData._id.toString(),
          name: participantData.name,
          email: participantData.email,
          phone: participantData.phone,
          createdAt: participantData.createdAt || new Date(),
        },
        participantData.clientId,
        participantData.campaignId?.toString()
      );

      this.logger.log('✅ [HOOKS] Gatilho WhatsApp disparado com sucesso:', {
        flowsTriggered: result.flowsTriggered,
        messagesAdded: result.messagesAdded,
        message: result.message
      });

    } catch (error) {
      this.logger.error('❌ [HOOKS] Erro ao processar gatilho WhatsApp:', error);
      this.logger.error('❌ [HOOKS] Stack trace:', error.stack);
      // Não falhar o processo por erro no gatilho
    }
  }

  /**
   * 🔄 Disparar gatilho WhatsApp para indicador atualizado
   * Chamado quando status ou dados importantes mudam
   */
  async handleIndicatorUpdate(participantData: {
    _id: Types.ObjectId;
    name: string;
    email: string;
    phone: string;
    tipo: string;
    clientId: Types.ObjectId;
    campaignId?: Types.ObjectId;
    status?: string;
    totalIndicacoes?: number;
    recompensasRecebidas?: number;
  }): Promise<void> {
    try {
      this.logger.log('🔄 [HOOKS] Processando atualização de indicador:', participantData.name);

      // Verificar se é realmente um indicador
      if (participantData.tipo !== 'indicador') {
        return;
      }

      // Gatilho para recompensa ganha
      if (participantData.recompensasRecebidas && participantData.recompensasRecebidas > 0) {
        this.logger.log('💰 [HOOKS] Indicador ganhou recompensa, disparando gatilho...');
        
        const result = await this.whatsAppFlowTriggerService.triggerRewardEarned(
          {
            id: participantData._id.toString(),
            name: participantData.name,
            email: participantData.email,
            phone: participantData.phone,
          },
          participantData.clientId,
          participantData.recompensasRecebidas,
          'Comissão',
          participantData.recompensasRecebidas
        );

        this.logger.log('✅ [HOOKS] Gatilho de recompensa disparado:', result);
      }

      // Outros gatilhos podem ser adicionados aqui...

    } catch (error) {
      this.logger.error('❌ [HOOKS] Erro ao processar atualização:', error);
    }
  }
}
