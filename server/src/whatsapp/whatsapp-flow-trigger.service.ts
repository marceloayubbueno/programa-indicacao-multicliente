import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WhatsAppFlow, WhatsAppFlowDocument } from './entities/whatsapp-flow.schema';
import { WhatsAppQueueService } from './whatsapp-queue.service';
import { MessagePriority, QueueStatus } from './entities/whatsapp-queue.schema';
import { CreateQueueMessageDto } from './dto/create-queue-message.dto';
import { WhatsAppTemplate, WhatsAppTemplateDocument } from './entities/whatsapp-template.schema';


export enum TriggerType {
  INDICATOR_JOINED = 'indicator_joined',
  LEAD_INDICATED = 'lead_indicated',
  REWARD_EARNED = 'reward_earned',
  CAMPAIGN_STARTED = 'campaign_started',
  PARTICIPANT_ACTIVATED = 'participant_activated',
  REFERRAL_COMPLETED = 'referral_completed',
}

export interface ParticipantData {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt?: Date;
  [key: string]: any;
}

export interface ReferralData {
  id: string;
  leadName: string;
  leadEmail: string;
  leadPhone: string;
  indicadorName?: string;
  campaignName?: string;
  createdAt?: Date;
  [key: string]: any;
}

export interface TriggerData {
  participantId?: Types.ObjectId;
  referralId?: Types.ObjectId;
  campaignId?: string;
  clientId: Types.ObjectId;
  eventData: Record<string, any>;
  // Dados completos para evitar busca em outros módulos
  participantData?: ParticipantData;
  referralData?: ReferralData;
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
    @InjectModel(WhatsAppTemplate.name) private templateModel: Model<WhatsAppTemplateDocument>,
    private readonly whatsappQueueService: WhatsAppQueueService,
  ) {}

  async processTrigger(
    triggerType: TriggerType,
    triggerData: TriggerData,
  ): Promise<TriggerResult> {
    try {
      // 🔍 LOG DE INVESTIGAÇÃO: Iniciando processamento do gatilho
      this.logger.log(`🔍 [INVESTIGAÇÃO] ===== PROCESSANDO GATILHO =====`);
      this.logger.log(`🔍 [INVESTIGAÇÃO] Tipo: ${triggerType}`);
      this.logger.log(`🔍 [INVESTIGAÇÃO] Client ID: ${triggerData.clientId}`);
      this.logger.log(`🔍 [INVESTIGAÇÃO] Participant ID: ${triggerData.participantId}`);
      this.logger.log(`🔍 [INVESTIGAÇÃO] Referral ID: ${triggerData.referralId}`);
      this.logger.log(`🔍 [INVESTIGAÇÃO] ===== FIM PROCESSANDO GATILHO =====`);
      
      // 🆕 LOG SIMPLES E VISÍVEL PARA RASTREAR GATILHOS
      console.log(`🚀 [GATILHO] DISPARADO: ${triggerType} - Client: ${triggerData.clientId} - Participant: ${triggerData.participantId}`);

      const activeFlows = await this.getActiveFlowsForTrigger(triggerType, triggerData.clientId);
      
      if (activeFlows.length === 0) {
        return {
          success: true,
          message: 'Nenhum fluxo ativo encontrado',
          flowsTriggered: 0,
          messagesAdded: 0,
        };
      }

      const flowToProcess = activeFlows[0];

      let messagesAdded = 0;
      const errors: string[] = [];

      try {
        await this.processFlow(flowToProcess, triggerType, triggerData);
        messagesAdded++;
      } catch (error) {
        const errorMsg = `Erro ao processar fluxo ${flowToProcess.name}: ${error.message}`;
        this.logger.error(errorMsg);
        errors.push(errorMsg);
      }

      return {
        success: errors.length === 0,
        message: `Gatilho processado com sucesso. Fluxos: 1, Mensagens: ${messagesAdded}`,
        flowsTriggered: 1,
        messagesAdded,
        errors: errors.length > 0 ? errors : undefined,
      };

    } catch (error) {
      this.logger.error(`Erro ao processar gatilho: ${error.message}`);
      throw error;
    }
  }

  private async getActiveFlowsForTrigger(triggerType: string, clientId: Types.ObjectId): Promise<WhatsAppFlowDocument[]> {
    try {
      const query = {
        clientId: clientId,
        status: 'active',
        triggers: { $in: [triggerType] }
      };
      
      console.log('🔍 [FLOW-TRIGGER] Buscando fluxos com query:', query);
      
      const activeFlows = await this.whatsappFlowModel.find(query).exec();
      
      console.log('🔍 [FLOW-TRIGGER] Fluxos encontrados:', activeFlows.length);
      console.log('🔍 [FLOW-TRIGGER] Fluxos:', activeFlows.map(f => ({ id: f._id, name: f.name, triggers: f.triggers })));
      
      return activeFlows;
    } catch (error) {
      this.logger.error(`Erro ao buscar fluxos: ${error.message}`);
      return [];
    }
  }

  private async processFlow(
    flow: WhatsAppFlowDocument,
    triggerType: TriggerType,
    triggerData: TriggerData,
  ): Promise<void> {
    const recipientData = await this.extractRecipientData(flow, triggerType, triggerData);
    
    if (!recipientData) {
      throw new Error('Não foi possível identificar dados do destinatário');
    }

    await this.processFlowSequentially(flow, triggerType, triggerData, recipientData);
  }

  private async processFlowSequentially(
    flow: WhatsAppFlowDocument,
    triggerType: TriggerType,
    triggerData: TriggerData,
    recipientData: { phoneNumber: string; variables: Record<string, any> }
  ): Promise<void> {
    try {
      const sortedMessages = (flow.messages || []).sort((a, b) => (a.order || 0) - (b.order || 0));
      
      if (sortedMessages.length === 0) {
        this.logger.warn(`Fluxo ${flow.name} não possui mensagens configuradas`);
        return;
      }

      const firstMessage = sortedMessages[0];

      if (!firstMessage.templateId) {
        this.logger.warn(`Primeira mensagem sem template, fluxo não pode ser processado`);
        return;
      }

      try {
        const template = await this.templateModel.findById(firstMessage.templateId).exec();
        if (!template) {
          this.logger.warn(`Template não encontrado: ${firstMessage.templateId}`);
          return;
        }

        const messageContent = await this.prepareMessageContent(template, recipientData, triggerData, triggerType);
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
            messageOrder: firstMessage.order,
            isSequential: false,
          },
        };

        if (firstMessage.delay && firstMessage.delay > 0) {
          queueMessage.metadata = queueMessage.metadata || {};
          (queueMessage.metadata as any).scheduledFor = new Date(Date.now() + (firstMessage.delay * 1000));
        }

        // 🔍 LOG DE INVESTIGAÇÃO: Antes de adicionar na fila
        this.logger.log(`🔍 [INVESTIGAÇÃO] ===== ADICIONANDO MENSAGEM NA FILA =====`);
        this.logger.log(`🔍 [INVESTIGAÇÃO] Flow: ${flow.name} (${flow._id})`);
        this.logger.log(`🔍 [INVESTIGAÇÃO] Template: ${template.name || template._id}`);
        this.logger.log(`🔍 [INVESTIGAÇÃO] Para: ${recipientData.phoneNumber}`);
        this.logger.log(`🔍 [INVESTIGAÇÃO] Trigger: ${triggerType}`);
        this.logger.log(`🔍 [INVESTIGAÇÃO] Client ID: ${triggerData.clientId}`);
        this.logger.log(`🔍 [INVESTIGAÇÃO] ===== FIM ADICIONANDO NA FILA =====`);
        
        // 🆕 LOG SIMPLES E VISÍVEL PARA RASTREAR CRIAÇÃO
        console.log(`🚀 [CRIANDO] MENSAGEM NA FILA: ${triggerType} - Para: ${recipientData.phoneNumber} - Flow: ${flow.name}`);
        
        await this.whatsappQueueService.addToQueue(queueMessage);

      } catch (error) {
        this.logger.error(`Erro ao processar primeira mensagem: ${error.message}`);
        throw new Error(`Erro ao processar mensagem do fluxo ${flow.name}: ${error.message}`);
      }

    } catch (error) {
      this.logger.error(`Erro ao processar fluxo ${flow.name}: ${error.message}`);
      throw error;
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
          if (triggerData.participantData) {
            // Usar dados recebidos via parâmetros
            phoneNumber = triggerData.participantData.phone;
            variables = {
              ...triggerData.participantData, // Incluir todos os dados extras
              dataEntrada: triggerData.participantData.createdAt || new Date(),
            };
          } else if (triggerData.participantId) {

            phoneNumber = 'placeholder_phone';
            variables = {
              nome: 'Indicador',
              email: '',
              telefone: '',
              dataEntrada: new Date(),
            };
          }
          break;

        case TriggerType.LEAD_INDICATED:
          if (triggerData.referralData) {
            // Usar dados recebidos via parâmetros
            console.log('🔍 [FLOW-TRIGGER] referralData recebido:', triggerData.referralData);
            console.log('🔍 [FLOW-TRIGGER] leadPhone:', triggerData.referralData.leadPhone);
            
            phoneNumber = triggerData.referralData.leadPhone;
            variables = {
              ...triggerData.referralData, // Incluir todos os dados extras
              dataIndicacao: triggerData.referralData.createdAt || new Date(),
            };
            
            console.log('🔍 [FLOW-TRIGGER] phoneNumber extraído:', phoneNumber);
            console.log('🔍 [FLOW-TRIGGER] variables preparadas:', variables);
          } else if (triggerData.referralId) {

            phoneNumber = 'placeholder_phone';
            variables = {
              nome: 'Lead',
              email: '',
              telefone: '',
              indicador: 'Indicador',
              campanha: 'Campanha',
              dataIndicacao: new Date(),
            };
          }
          break;

        case TriggerType.REWARD_EARNED:
          if (triggerData.participantData) {
            // Usar dados recebidos via parâmetros
            phoneNumber = triggerData.participantData.phone;
            variables = {
              ...triggerData.participantData, // Incluir todos os dados extras
              recompensa: triggerData.eventData?.rewardAmount || 0,
              tipoRecompensa: triggerData.eventData?.rewardType || 'Comissão',
              totalGanhos: triggerData.eventData?.totalEarnings || 0,
            };
          } else if (triggerData.participantId) {

            phoneNumber = 'placeholder_phone';
            variables = {
              nome: 'Participante',
              email: '',
              telefone: '',
              recompensa: triggerData.eventData?.rewardAmount || 0,
              tipoRecompensa: triggerData.eventData?.rewardType || 'Comissão',
              totalGanhos: triggerData.eventData?.totalEarnings || 0,
            };
          }
          break;

        default:
          // Para outros tipos de gatilho, tentar buscar dados básicos
          if (triggerData.participantData) {
            phoneNumber = triggerData.participantData.phone;
            variables = {
              ...triggerData.participantData, // Incluir todos os dados extras
            };
          } else if (triggerData.participantId) {

            phoneNumber = 'placeholder_phone';
            variables = {
              nome: 'Usuário',
              email: '',
              telefone: '',
            };
          }
          break;
      }

      if (!phoneNumber) {
        return null;
      }

      return { phoneNumber, variables };

    } catch (error) {
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
    
    // 🔍 LOG SIMPLES: Ver o que está chegando
    console.log('🔍 [REPLACE-VARIABLES] Texto original:', text);
    console.log('🔍 [REPLACE-VARIABLES] Variáveis recebidas:', variables);
    
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{${key}}`;
      if (typeof value === 'string' || typeof value === 'number') {
        result = result.replace(new RegExp(placeholder, 'g'), value.toString());
      }
    }
    
    console.log('🔍 [REPLACE-VARIABLES] Texto final:', result);
    return result;
  }

  // Métodos públicos para disparar gatilhos específicos
  async triggerIndicatorJoined(
    participantData: ParticipantData, 
    clientId: Types.ObjectId, 
    campaignId?: string
  ): Promise<TriggerResult> {
    return this.processTrigger(TriggerType.INDICATOR_JOINED, {
      participantId: new Types.ObjectId(participantData.id),
      clientId,
      campaignId,
      participantData,
      eventData: { type: 'indicator_joined' },
    });
  }

  // Disparar gatilho para lead indicado
  async triggerLeadIndicated(
    referralData: ReferralData,
    clientId: string,
    campaignId?: string
  ): Promise<TriggerResult> {
    try {
      const triggerData: TriggerData = {
        referralId: new Types.ObjectId(referralData.id),
        campaignId,
        clientId: new Types.ObjectId(clientId),
        eventData: {
          leadName: referralData.leadName,
          leadEmail: referralData.leadEmail,
          leadPhone: referralData.leadPhone,
          indicadorName: referralData.indicadorName,
          campaignName: referralData.campaignName,
          createdAt: referralData.createdAt
        },
        referralData
      };

      const result = await this.processTrigger(TriggerType.LEAD_INDICATED, triggerData);
      return result;
    } catch (error) {
      return {
        success: false,
        message: `Erro ao disparar gatilho: ${error.message}`,
        flowsTriggered: 0,
        messagesAdded: 0,
        errors: [error.message]
      };
    }
  }

  async triggerRewardEarned(
    participantData: ParticipantData, 
    clientId: Types.ObjectId, 
    rewardAmount: number, 
    rewardType: string, 
    totalEarnings: number
  ): Promise<TriggerResult> {
    return this.processTrigger(TriggerType.REWARD_EARNED, {
      participantId: new Types.ObjectId(participantData.id),
      clientId,
      participantData,
      eventData: {
        type: 'reward_earned',
        rewardAmount,
        rewardType,
        totalEarnings,
      },
    });
  }
}
