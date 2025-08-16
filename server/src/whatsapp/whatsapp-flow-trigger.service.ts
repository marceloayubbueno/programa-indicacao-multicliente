import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WhatsAppFlow, WhatsAppFlowDocument } from './entities/whatsapp-flow.schema';
import { WhatsAppQueueService } from './whatsapp-queue.service';
import { MessagePriority, QueueStatus } from './entities/whatsapp-queue.schema';
import { CreateQueueMessageDto } from './dto/create-queue-message.dto';

// Schemas para buscar dados reais
import { Participant } from '../clients/entities/participant.schema';
import { Referral } from '../referrals/entities/referral.schema';
import { WhatsAppTemplate, WhatsAppTemplateDocument } from './entities/whatsapp-template.schema';

export enum TriggerType {
  INDICATOR_JOINED = 'indicator_joined',
  LEAD_INDICATED = 'lead_indicated',
  REWARD_EARNED = 'reward_earned',
  CAMPAIGN_STARTED = 'campaign_started',
  PARTICIPANT_ACTIVATED = 'participant_activated',
  REFERRAL_COMPLETED = 'referral_completed',
}

export interface TriggerData {
  participantId?: Types.ObjectId;
  referralId?: Types.ObjectId;
  campaignId?: string;
  clientId: Types.ObjectId;
  eventData: Record<string, any>;
}

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
    @InjectModel(Participant.name) private participantModel: Model<Participant>,
    @InjectModel(Referral.name) private referralModel: Model<Referral>,
    @InjectModel(WhatsAppTemplate.name) private templateModel: Model<WhatsAppTemplateDocument>,
    private readonly whatsappQueueService: WhatsAppQueueService,
  ) {}

  async processTrigger(
    triggerType: TriggerType,
    triggerData: TriggerData,
  ): Promise<TriggerResult> {
    try {
      this.logger.log(`Processando gatilho: ${triggerType} para cliente: ${triggerData.clientId}`);

      // Buscar fluxos ativos para este gatilho
      const activeFlows = await this.getActiveFlowsForTrigger(triggerType, triggerData.clientId);
      
      if (activeFlows.length === 0) {
        return {
          success: true,
          message: `Nenhum fluxo ativo encontrado para o gatilho: ${triggerType}`,
          flowsTriggered: 0,
          messagesAdded: 0,
        };
      }

      let messagesAdded = 0;
      const errors: string[] = [];

      // Processar cada fluxo ativo
      for (const flow of activeFlows) {
        try {
          await this.processFlow(flow, triggerType, triggerData);
          messagesAdded++;
        } catch (error) {
          const errorMsg = `Erro ao processar fluxo ${flow.name}: ${error.message}`;
          this.logger.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      return {
        success: errors.length === 0,
        message: `Gatilho processado com sucesso. Fluxos: ${activeFlows.length}, Mensagens: ${messagesAdded}`,
        flowsTriggered: activeFlows.length,
        messagesAdded,
        errors: errors.length > 0 ? errors : undefined,
      };

    } catch (error) {
      this.logger.error(`Erro ao processar gatilho: ${error.message}`);
      throw error;
    }
  }

  private async getActiveFlowsForTrigger(
    triggerType: TriggerType,
    clientId: Types.ObjectId,
  ): Promise<WhatsAppFlowDocument[]> {
    return this.whatsappFlowModel
      .find({
        clientId,
        status: 'active',
        triggers: triggerType,
      })
      .populate('messages.templateId')
      .exec();
  }

  private async processFlow(
    flow: WhatsAppFlowDocument,
    triggerType: TriggerType,
    triggerData: TriggerData,
  ): Promise<void> {
    this.logger.log(`Processando fluxo: ${flow.name}`);

    // Extrair dados do destinatário
    const recipientData = await this.extractRecipientData(flow, triggerType, triggerData);
    
    if (!recipientData) {
      throw new Error('Não foi possível identificar dados do destinatário');
    }

    // Processar cada mensagem do fluxo
    for (const messageConfig of flow.messages || []) {
      if (!messageConfig.templateId) continue;

      // Buscar template
      const template = await this.templateModel.findById(messageConfig.templateId).exec();
      if (!template) {
        this.logger.warn(`Template não encontrado: ${messageConfig.templateId}`);
        continue;
      }

      // Preparar conteúdo da mensagem
      const messageContent = await this.prepareMessageContent(template, recipientData, triggerData, triggerType);

      // Determinar prioridade
      const priority = this.determinePriority(triggerType);

      // Adicionar na fila do admin
      const queueMessage: CreateQueueMessageDto = {
        clientId: triggerData.clientId.toString(),
        flowId: flow._id.toString(),
        templateId: template._id.toString(),
        to: recipientData.phoneNumber,
        from: 'admin', // Número do admin
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
          tags: [triggerType, 'auto-triggered', flow.name],
        },
      };

      await this.whatsappQueueService.addToQueue(queueMessage);
      this.logger.log(`Mensagem adicionada na fila para: ${recipientData.phoneNumber}`);
    }
  }

  private async extractRecipientData(
    flow: WhatsAppFlowDocument,
    triggerType: TriggerType,
    triggerData: TriggerData,
  ): Promise<{ phoneNumber: string; variables: Record<string, any> } | null> {
    let phoneNumber: string | undefined;
    let variables: Record<string, any> = {};

    try {
      switch (triggerType) {
        case TriggerType.INDICATOR_JOINED:
          if (triggerData.participantId) {
            const participant = await this.participantModel.findById(triggerData.participantId).exec();
            if (participant && participant.phone) {
              phoneNumber = participant.phone;
              variables = {
                nome: participant.name || 'Indicador',
                email: participant.email || '',
                telefone: participant.phone || '',
                dataEntrada: participant.createdAt || new Date(),
              };
            }
          }
          break;

                 case TriggerType.LEAD_INDICATED:
           if (triggerData.referralId) {
             const referral = await this.referralModel.findById(triggerData.referralId).exec();
             if (referral && referral.leadPhone) {
               phoneNumber = referral.leadPhone;
               variables = {
                 nome: referral.leadName || 'Lead',
                 email: referral.leadEmail || '',
                 telefone: referral.leadPhone || '',
                 indicador: 'Indicador',
                 campanha: 'Campanha',
                 dataIndicacao: referral.createdAt || new Date(),
               };
             }
           }
           break;

        case TriggerType.REWARD_EARNED:
          if (triggerData.participantId) {
            const participant = await this.participantModel.findById(triggerData.participantId).exec();
            if (participant && participant.phone) {
              phoneNumber = participant.phone;
              variables = {
                nome: participant.name || 'Participante',
                email: participant.email || '',
                telefone: participant.phone || '',
                recompensa: triggerData.eventData?.rewardAmount || 0,
                tipoRecompensa: triggerData.eventData?.rewardType || 'Comissão',
                totalGanhos: triggerData.eventData?.totalEarnings || 0,
              };
            }
          }
          break;

        default:
          // Para outros tipos de gatilho, tentar buscar dados básicos
          if (triggerData.participantId) {
            const participant = await this.participantModel.findById(triggerData.participantId).exec();
            if (participant && participant.phone) {
              phoneNumber = participant.phone;
              variables = {
                nome: participant.name || 'Usuário',
                email: participant.email || '',
                telefone: participant.phone || '',
              };
            }
          }
          break;
      }

      if (!phoneNumber) {
        this.logger.warn(`Número de telefone não encontrado para gatilho: ${triggerType}`);
        return null;
      }

      return { phoneNumber, variables };

    } catch (error) {
      this.logger.error(`Erro ao extrair dados do destinatário: ${error.message}`);
      return null;
    }
  }

  private determinePriority(triggerType: TriggerType): MessagePriority {
    switch (triggerType) {
      case TriggerType.INDICATOR_JOINED:
      case TriggerType.LEAD_INDICATED:
        return MessagePriority.HIGH;
      case TriggerType.REWARD_EARNED:
        return MessagePriority.MEDIUM;
      default:
        return MessagePriority.MEDIUM;
    }
  }

  private async prepareMessageContent(
    template: WhatsAppTemplateDocument,
    recipientData: { phoneNumber: string; variables: Record<string, any> },
    triggerData: TriggerData,
    triggerType: TriggerType,
  ): Promise<{ body: string; header?: { type: string; text?: string; mediaUrl?: string }; footer?: string; buttons?: Array<{ type: string; text: string; url?: string; phoneNumber?: string }> }> {
    
    // Usar conteúdo do template
    let body = template.content?.body || 'Mensagem automática';
    
    // Aplicar variáveis dinâmicas
    body = this.replaceVariables(body, recipientData.variables);
    
    // Adicionar informações específicas do gatilho
    switch (triggerType) {
      case TriggerType.INDICATOR_JOINED:
        body += '\n\n🎉 Bem-vindo ao nosso programa de indicações!';
        break;
      case TriggerType.LEAD_INDICATED:
        body += '\n\n👋 Obrigado pela indicação!';
        break;
      case TriggerType.REWARD_EARNED:
        body += '\n\n💰 Parabéns pela recompensa!';
        break;
    }

    return {
      body,
      header: template.content?.header,
      footer: template.content?.footer,
      buttons: template.content?.buttons,
    };
  }

  private replaceVariables(text: string, variables: Record<string, any>): string {
    let result = text;
    
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{${key}}`;
      if (typeof value === 'string' || typeof value === 'number') {
        result = result.replace(new RegExp(placeholder, 'g'), value.toString());
      }
    }
    
    return result;
  }

  // Métodos públicos para disparar gatilhos específicos
  async triggerIndicatorJoined(participantId: Types.ObjectId, clientId: Types.ObjectId, campaignId?: string): Promise<TriggerResult> {
    return this.processTrigger(TriggerType.INDICATOR_JOINED, {
      participantId,
      clientId,
      campaignId,
      eventData: { type: 'indicator_joined' },
    });
  }

  async triggerLeadIndicated(referralId: Types.ObjectId, clientId: Types.ObjectId, campaignId?: string): Promise<TriggerResult> {
    return this.processTrigger(TriggerType.LEAD_INDICATED, {
      referralId,
      clientId,
      campaignId,
      eventData: { type: 'lead_indicated' },
    });
  }

  async triggerRewardEarned(participantId: Types.ObjectId, clientId: Types.ObjectId, rewardAmount: number, rewardType: string, totalEarnings: number): Promise<TriggerResult> {
    return this.processTrigger(TriggerType.REWARD_EARNED, {
      participantId,
      clientId,
      eventData: {
        type: 'reward_earned',
        rewardAmount,
        rewardType,
        totalEarnings,
      },
    });
  }
}
