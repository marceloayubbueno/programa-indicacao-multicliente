import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WhatsAppFlow, WhatsAppFlowDocument } from './entities/whatsapp-flow.schema';
import { WhatsAppQueueService } from './whatsapp-queue.service';
import { MessagePriority, QueueStatus } from './entities/whatsapp-queue.schema';
import { CreateQueueMessageDto } from './dto/create-queue-message.dto';

// Tipos de gatilhos suportados
export enum TriggerType {
  INDICATOR_JOINED = 'indicator_joined',      // Novo indicador se juntou
  LEAD_INDICATED = 'lead_indicated',          // Novo lead foi indicado
  REWARD_EARNED = 'reward_earned',            // Recompensa foi ganha
  CAMPAIGN_STARTED = 'campaign_started',      // Campanha iniciou
  PARTICIPANT_ACTIVATED = 'participant_activated', // Participante ativado
  REFERRAL_COMPLETED = 'referral_completed',  // Indicação completada
}

// Interface para dados do gatilho
export interface TriggerData {
  participantId?: Types.ObjectId;
  referralId?: Types.ObjectId;
  campaignId?: string;
  clientId: Types.ObjectId;
  eventData: Record<string, any>;
}

// Interface para resultado do processamento
export interface TriggerResult {
  success: boolean;
  message: string;
  flowsTriggered: number;
  messagesAdded: number;
  errors?: string[];
}

@Injectable()
export class WhatsAppFlowTriggerService {
  private readonly logger = new Logger(WhatsAppFlowTriggerService.name);

  constructor(
    @InjectModel(WhatsAppFlow.name) private whatsappFlowModel: Model<WhatsAppFlowDocument>,
    private readonly whatsappQueueService: WhatsAppQueueService,
  ) {}

  /**
   * Processa um gatilho do sistema
   */
  async processTrigger(
    triggerType: TriggerType,
    triggerData: TriggerData,
  ): Promise<TriggerResult> {
    try {
      this.logger.log(`Processando gatilho: ${triggerType} para cliente: ${triggerData.clientId}`);

      // Buscar fluxos ativos para este gatilho
      const activeFlows = await this.getActiveFlowsForTrigger(triggerType, triggerData.clientId);
      
      if (activeFlows.length === 0) {
        this.logger.log(`Nenhum fluxo ativo encontrado para gatilho: ${triggerType}`);
        return {
          success: true,
          message: 'Nenhum fluxo ativo para este gatilho',
          flowsTriggered: 0,
          messagesAdded: 0,
        };
      }

      // Processar cada fluxo
      const results = await Promise.allSettled(
        activeFlows.map(flow => this.processFlow(flow, triggerType, triggerData))
      );

      // Analisar resultados
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      const errors = results
        .filter(r => r.status === 'rejected')
        .map(r => (r as PromiseRejectedResult).reason?.message || 'Erro desconhecido');

      this.logger.log(`Gatilho processado: ${successful} fluxos executados, ${failed} falharam`);

      return {
        success: failed === 0,
        message: `Gatilho processado com sucesso`,
        flowsTriggered: activeFlows.length,
        messagesAdded: successful,
        errors: errors.length > 0 ? errors : undefined,
      };

    } catch (error) {
      this.logger.error(`Erro ao processar gatilho ${triggerType}: ${error.message}`);
      return {
        success: false,
        message: `Erro ao processar gatilho: ${error.message}`,
        flowsTriggered: 0,
        messagesAdded: 0,
        errors: [error.message],
      };
    }
  }

  /**
   * Busca fluxos ativos para um determinado gatilho
   */
  private async getActiveFlowsForTrigger(
    triggerType: TriggerType,
    clientId: Types.ObjectId,
  ): Promise<WhatsAppFlowDocument[]> {
    try {
      const flows = await this.whatsappFlowModel
        .find({
          clientId,
          status: 'active',
          triggers: triggerType,
        })
        .exec();

      this.logger.log(`Encontrados ${flows.length} fluxos ativos para gatilho: ${triggerType}`);
      return flows;

    } catch (error) {
      this.logger.error(`Erro ao buscar fluxos para gatilho ${triggerType}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Processa um fluxo específico
   */
  private async processFlow(
    flow: WhatsAppFlowDocument,
    triggerType: TriggerType,
    triggerData: TriggerData,
  ): Promise<void> {
    try {
      this.logger.log(`Processando fluxo: ${flow.name} (ID: ${flow._id})`);

      // Extrair dados do destinatário
      const recipientData = await this.extractRecipientData(flow, triggerType, triggerData);
      
      if (!recipientData) {
        this.logger.warn(`Não foi possível extrair dados do destinatário para fluxo: ${flow.name}`);
        return;
      }

      // Determinar prioridade baseada no tipo de gatilho
      const priority = this.determinePriority(triggerType);

      // Preparar conteúdo da mensagem
      const messageContent = await this.prepareMessageContent(flow, recipientData, triggerData, triggerType);

      // Criar DTO para adicionar à fila
      const queueMessageDto: CreateQueueMessageDto = {
        clientId: triggerData.clientId.toString(),
        flowId: flow._id.toString(),
        templateId: flow.messages?.[0]?.templateId?.toString(),
        to: recipientData.phoneNumber,
        from: 'default', // Número do WhatsApp Business (será configurado pelo sistema)
        content: messageContent,
        variables: recipientData.variables,
        priority,
        trigger: triggerType,
        triggerData: {
          participantId: triggerData.participantId?.toString(),
          referralId: triggerData.referralId?.toString(),
          campaignId: triggerData.campaignId,
          eventData: triggerData.eventData,
        },
        metadata: {
          campaignId: triggerData.campaignId,
          userId: flow._id.toString(),
          tags: [triggerType, 'auto-triggered'],
        },
      };

      // Adicionar à fila
      await this.whatsappQueueService.addToQueue(queueMessageDto);
      
      this.logger.log(`Mensagem adicionada à fila para fluxo: ${flow.name} - Destinatário: ${recipientData.phoneNumber}`);

    } catch (error) {
      this.logger.error(`Erro ao processar fluxo ${flow.name}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extrai dados do destinatário baseado no tipo de gatilho
   */
  private async extractRecipientData(
    flow: WhatsAppFlowDocument,
    triggerType: TriggerType,
    triggerData: TriggerData,
  ): Promise<{
    phoneNumber: string;
    variables: Record<string, any>;
  } | null> {
    try {
      let phoneNumber: string | undefined;
      let variables: Record<string, any> = {};

      switch (triggerType) {
        case TriggerType.INDICATOR_JOINED:
          if (triggerData.participantId) {
            // Buscar dados do participante
            const participant = await this.getParticipantData(triggerData.participantId);
            if (participant) {
              phoneNumber = participant.phoneNumber;
              variables = {
                participantName: participant.name,
                participantEmail: participant.email,
                joinDate: new Date().toLocaleDateString('pt-BR'),
              };
            }
          }
          break;

        case TriggerType.LEAD_INDICATED:
          if (triggerData.referralId) {
            // Buscar dados da indicação
            const referral = await this.getReferralData(triggerData.referralId);
            if (referral) {
              phoneNumber = referral.phoneNumber;
              variables = {
                leadName: referral.name,
                leadEmail: referral.email,
                indicatorName: referral.indicatorName,
                campaignName: referral.campaignName,
              };
            }
          }
          break;

        case TriggerType.REWARD_EARNED:
          if (triggerData.participantId) {
            // Buscar dados do participante e recompensa
            const participant = await this.getParticipantData(triggerData.participantId);
            if (participant) {
              phoneNumber = participant.phoneNumber;
              variables = {
                participantName: participant.name,
                rewardAmount: triggerData.eventData.rewardAmount,
                rewardType: triggerData.eventData.rewardType,
                totalEarnings: triggerData.eventData.totalEarnings,
              };
            }
          }
          break;

        default:
          this.logger.warn(`Tipo de gatilho não suportado: ${triggerType}`);
          return null;
      }

      if (!phoneNumber) {
        this.logger.warn(`Não foi possível extrair número de telefone para gatilho: ${triggerType}`);
        return null;
      }

      return { phoneNumber, variables };

    } catch (error) {
      this.logger.error(`Erro ao extrair dados do destinatário: ${error.message}`);
      return null;
    }
  }

  /**
   * Determina a prioridade baseada no tipo de gatilho
   */
  private determinePriority(triggerType: TriggerType): MessagePriority {
    switch (triggerType) {
      case TriggerType.INDICATOR_JOINED:
      case TriggerType.LEAD_INDICATED:
        return MessagePriority.HIGH; // Alta prioridade para novos leads/indicadores
      
      case TriggerType.REWARD_EARNED:
        return MessagePriority.MEDIUM; // Prioridade média para recompensas
      
      case TriggerType.CAMPAIGN_STARTED:
      case TriggerType.PARTICIPANT_ACTIVATED:
        return MessagePriority.MEDIUM; // Prioridade média para campanhas
      
      case TriggerType.REFERRAL_COMPLETED:
        return MessagePriority.LOW; // Prioridade baixa para conclusões
      
      default:
        return MessagePriority.MEDIUM;
    }
  }

  /**
   * Prepara o conteúdo da mensagem baseado no template e variáveis
   */
  private async prepareMessageContent(
    flow: WhatsAppFlowDocument,
    recipientData: { phoneNumber: string; variables: Record<string, any> },
    triggerData: TriggerData,
    triggerType: TriggerType,
  ): Promise<{
    body: string;
    header?: { type: string; text?: string; mediaUrl?: string };
    footer?: string;
    buttons?: Array<{ type: string; text: string; url?: string; phoneNumber?: string }>;
  }> {
    try {
      // Por enquanto, usar mensagem padrão baseada no tipo de gatilho
      // TODO: Implementar busca de templates quando o sistema estiver completo
      const defaultMessages = {
        [TriggerType.INDICATOR_JOINED]: 'Olá {{participantName}}! Bem-vindo ao nosso programa de indicações. Estamos muito felizes que você se juntou a nós!',
        [TriggerType.LEAD_INDICATED]: 'Olá {{leadName}}! Você foi indicado por {{indicatorName}} para nossa campanha {{campaignName}}. Vamos conversar?',
        [TriggerType.REWARD_EARNED]: 'Parabéns {{participantName}}! Você ganhou R$ {{rewardAmount}} de {{rewardType}}. Seu total de ganhos agora é R$ {{totalEarnings}}.',
        [TriggerType.CAMPAIGN_STARTED]: 'Nova campanha iniciada! Aproveite as oportunidades.',
        [TriggerType.PARTICIPANT_ACTIVATED]: 'Seu perfil foi ativado com sucesso!',
        [TriggerType.REFERRAL_COMPLETED]: 'Indicação completada com sucesso!',
      };

      const messageBody = defaultMessages[triggerType as TriggerType] || 'Mensagem automática do sistema';
      
      return {
        body: this.replaceVariables(messageBody, recipientData.variables),
        header: {
          type: 'text',
          text: 'Sistema de Indicações',
        },
        footer: 'Obrigado por usar nosso sistema!',
      };

    } catch (error) {
      this.logger.error(`Erro ao preparar conteúdo da mensagem: ${error.message}`);
      // Retornar mensagem padrão em caso de erro
      return {
        body: 'Mensagem automática do sistema',
      };
    }
  }

  /**
   * Substitui variáveis no texto
   */
  private replaceVariables(text: string, variables: Record<string, any>): string {
    let result = text;
    
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), String(value));
    }
    
    return result;
  }

  /**
   * Busca dados do participante (mock - implementar com schema real)
   */
  private async getParticipantData(participantId: Types.ObjectId): Promise<{
    phoneNumber: string;
    name: string;
    email: string;
  } | null> {
    // TODO: Implementar busca real no schema de participantes
    // Por enquanto, retornar dados mock para teste
    return {
      phoneNumber: '+5511999999999',
      name: 'Participante Teste',
      email: 'participante@teste.com',
    };
  }

  /**
   * Busca dados da indicação (mock - implementar com schema real)
   */
  private async getReferralData(referralId: Types.ObjectId): Promise<{
    phoneNumber: string;
    name: string;
    email: string;
    indicatorName: string;
    campaignName: string;
  } | null> {
    // TODO: Implementar busca real no schema de indicações
    // Por enquanto, retornar dados mock para teste
    return {
      phoneNumber: '+5511888888888',
      name: 'Lead Teste',
      email: 'lead@teste.com',
      indicatorName: 'Indicador Teste',
      campaignName: 'Campanha Teste',
    };
  }

  /**
   * Processa gatilho de novo indicador
   */
  async triggerIndicatorJoined(
    participantId: Types.ObjectId,
    clientId: Types.ObjectId,
    campaignId?: string,
  ): Promise<TriggerResult> {
    return this.processTrigger(TriggerType.INDICATOR_JOINED, {
      participantId,
      clientId,
      campaignId,
      eventData: {
        eventType: 'indicator_joined',
        timestamp: new Date(),
      },
    });
  }

  /**
   * Processa gatilho de novo lead
   */
  async triggerLeadIndicated(
    referralId: Types.ObjectId,
    clientId: Types.ObjectId,
    campaignId?: string,
  ): Promise<TriggerResult> {
    return this.processTrigger(TriggerType.LEAD_INDICATED, {
      referralId,
      clientId,
      campaignId,
      eventData: {
        eventType: 'lead_indicated',
        timestamp: new Date(),
      },
    });
  }

  /**
   * Processa gatilho de recompensa ganha
   */
  async triggerRewardEarned(
    participantId: Types.ObjectId,
    clientId: Types.ObjectId,
    rewardAmount: number,
    rewardType: string,
    totalEarnings: number,
  ): Promise<TriggerResult> {
    return this.processTrigger(TriggerType.REWARD_EARNED, {
      participantId,
      clientId,
      eventData: {
        eventType: 'reward_earned',
        rewardAmount,
        rewardType,
        totalEarnings,
        timestamp: new Date(),
      },
    });
  }
}
