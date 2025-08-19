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
      this.logger.log(`🚀 [GATILHO] Iniciando processamento do gatilho: ${triggerType}`);
      this.logger.log(`🚀 [GATILHO] ClientId: ${triggerData.clientId}`);
      this.logger.log(`🚀 [GATILHO] Dados do trigger: ${JSON.stringify(triggerData)}`);

      // Buscar fluxos ativos para este gatilho
      const activeFlows = await this.getActiveFlowsForTrigger(triggerType, triggerData.clientId);
      
      this.logger.log(`🚀 [GATILHO] Fluxos ativos encontrados: ${activeFlows.length}`);
      
      if (activeFlows.length === 0) {
        this.logger.log(`⚠️ [GATILHO] Nenhum fluxo ativo encontrado para o gatilho: ${triggerType}`);
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
          this.logger.log(`🔄 [GATILHO] Processando fluxo: ${flow.name}`);
          await this.processFlow(flow, triggerType, triggerData);
          messagesAdded++;
          this.logger.log(`✅ [GATILHO] Fluxo processado com sucesso: ${flow.name}`);
        } catch (error) {
          const errorMsg = `Erro ao processar fluxo ${flow.name}: ${error.message}`;
          this.logger.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      this.logger.log(`🎉 [GATILHO] Processamento concluído. Fluxos: ${activeFlows.length}, Mensagens: ${messagesAdded}`);

      return {
        success: errors.length === 0,
        message: `Gatilho processado com sucesso. Fluxos: ${activeFlows.length}, Mensagens: ${messagesAdded}`,
        flowsTriggered: activeFlows.length,
        messagesAdded,
        errors: errors.length > 0 ? errors : undefined,
      };

    } catch (error) {
      this.logger.error(`❌ [GATILHO] Erro ao processar gatilho: ${error.message}`);
      throw error;
    }
  }

  private async getActiveFlowsForTrigger(triggerType: string, clientId: Types.ObjectId): Promise<WhatsAppFlowDocument[]> {
    try {
      this.logger.log(`🔍 [DEBUG] Buscando fluxos ativos para gatilho: ${triggerType}`);
      this.logger.log(`🔍 [DEBUG] ClientId: ${clientId}`);
      
      // 🆕 NOVO: Log do tipo de dados
      this.logger.log(`🔍 [DEBUG] Tipo do clientId: ${typeof clientId}`);
      this.logger.log(`🔍 [DEBUG] ClientId é ObjectId: ${clientId instanceof Types.ObjectId}`);
      this.logger.log(`🔍 [DEBUG] ClientId toString: ${clientId.toString()}`);
      
      // 🆕 NOVO: Log da query completa
      const query = {
        clientId: clientId,
        status: 'active',
        triggers: { $in: [triggerType] } // 🆕 CORRIGIDO: Usar $in para buscar em array
      };
      this.logger.log(`🔍 [DEBUG] Query MongoDB: ${JSON.stringify(query)}`);
      
      // 🆕 NOVO: Log antes da execução da query
      this.logger.log(`🔍 [DEBUG] Executando query no modelo: ${this.whatsappFlowModel.modelName}`);
      this.logger.log(`🔍 [DEBUG] Modelo disponível: ${!!this.whatsappFlowModel}`);
      
      // 🆕 NOVO: Buscar TODOS os fluxos do cliente primeiro (para debug)
      const allClientFlows = await this.whatsappFlowModel.find({ clientId: clientId }).exec();
      this.logger.log(`🔍 [DEBUG] Total de fluxos do cliente (sem filtros): ${allClientFlows.length}`);
      
      if (allClientFlows.length > 0) {
        this.logger.log(`🔍 [DEBUG] Dados dos fluxos encontrados:`);
        allClientFlows.forEach((flow, index) => {
          this.logger.log(`🔍 [DEBUG] Fluxo ${index + 1}:`, {
            id: flow._id,
            name: flow.name,
            status: flow.status,
            triggers: flow.triggers,
            clientId: flow.clientId,
            clientIdType: typeof flow.clientId,
            clientIdIsObjectId: flow.clientId instanceof Types.ObjectId
          });
        });
      }
      
      // 🆕 NOVO: Buscar fluxos com cada filtro separadamente
      const flowsByStatus = await this.whatsappFlowModel.find({ clientId: clientId, status: 'active' }).exec();
      this.logger.log(`🔍 [DEBUG] Fluxos com status 'active': ${flowsByStatus.length}`);
      
      const flowsByTrigger = await this.whatsappFlowModel.find({ clientId: clientId, triggers: triggerType }).exec();
      this.logger.log(`🔍 [DEBUG] Fluxos com trigger '${triggerType}': ${flowsByTrigger.length}`);
      
      // Query original
      const activeFlows = await this.whatsappFlowModel.find(query).exec();
      this.logger.log(`🔍 [DEBUG] Fluxos encontrados: ${activeFlows.length}`);
      
      return activeFlows;
    } catch (error) {
      this.logger.error(`❌ [DEBUG] Erro ao buscar fluxos: ${error.message}`);
      this.logger.error(`❌ [DEBUG] Stack trace: ${error.stack}`);
      return [];
    }
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
          if (triggerData.participantData) {
            // Usar dados recebidos via parâmetros
            phoneNumber = triggerData.participantData.phone;
            variables = {
              ...triggerData.participantData, // Incluir todos os dados extras
              dataEntrada: triggerData.participantData.createdAt || new Date(),
            };
          } else if (triggerData.participantId) {
            // Fallback: usar ID para buscar dados (se necessário)
            this.logger.warn('ParticipantData não fornecido, usando dados básicos');
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
            phoneNumber = triggerData.referralData.leadPhone;
            variables = {
              ...triggerData.referralData, // Incluir todos os dados extras
              dataIndicacao: triggerData.referralData.createdAt || new Date(),
            };
          } else if (triggerData.referralId) {
            // Fallback: usar ID para buscar dados (se necessário)
            this.logger.warn('ReferralData não fornecido, usando dados básicos');
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
            // Fallback: usar ID para buscar dados (se necessário)
            this.logger.warn('ParticipantData não fornecido, usando dados básicos');
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
            // Fallback: usar ID para buscar dados (se necessário)
            this.logger.warn('ParticipantData não fornecido, usando dados básicos');
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

  // 🆕 NOVO: Método para processar mensagens de um fluxo
  private async processFlowMessages(
    flow: WhatsAppFlowDocument, 
    referralData: any, 
    triggerType: string
  ): Promise<number> {
    try {
      let messagesAdded = 0;
      
      // Processar cada mensagem do fluxo
      for (const message of flow.messages) {
        try {
          // Verificar se a mensagem deve ser enviada para este gatilho
          // Como o schema não tem campo trigger, vamos usar o trigger do fluxo
          if (flow.triggers.includes(triggerType)) {
            // Preparar dados da mensagem
            const messageData: CreateQueueMessageDto = {
              to: referralData.leadPhone,
              from: 'admin', // Campo obrigatório
              templateId: message.templateId.toString(), // Converter ObjectId para string
              variables: this.extractVariablesFromTemplate(message.templateId.toString(), referralData),
              clientId: flow.clientId.toString(),
              flowId: flow._id.toString(),
              trigger: triggerType, // Campo correto do DTO
              content: {
                body: `Olá ${referralData.leadName}, você foi indicado!` // Campo obrigatório
              },
              triggerData: {
                referralId: referralData.id,
                campaignId: referralData.campaignId
              }
            };
            
            // Adicionar à fila WhatsApp usando o método correto
            await this.whatsappQueueService.addToQueue(messageData);
            messagesAdded++;
            
            this.logger.log(`✅ [GATILHO] Mensagem ${message.order} adicionada à fila para ${referralData.leadPhone}`);
          }
        } catch (error) {
          this.logger.error(`❌ [GATILHO] Erro ao processar mensagem ${message.order}: ${error.message}`);
        }
      }
      
      return messagesAdded;
    } catch (error) {
      this.logger.error(`❌ [GATILHO] Erro ao processar fluxo: ${error.message}`);
      return 0;
    }
  }

  // 🆕 NOVO: Método para extrair variáveis do template
  private extractVariablesFromTemplate(templateId: string, referralData: any): Record<string, string> {
    // Por enquanto, retorna variáveis básicas
    // TODO: Implementar extração dinâmica baseada no template
    return {
      leadName: referralData.leadName || 'Lead',
      leadEmail: referralData.leadEmail || '',
      leadPhone: referralData.leadPhone || '',
      referralDate: new Date().toLocaleDateString('pt-BR')
    };
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

  async triggerLeadIndicated(
    referralData: any, 
    clientId: string | Types.ObjectId, // 🆕 CORRIGIDO: Aceitar string ou ObjectId
    campaignId?: string
  ): Promise<TriggerResult> {
    try {
      this.logger.log(`🚀 [GATILHO] Iniciando processamento do gatilho: lead_indicated`);
      
      // 🆕 CORRIGIDO: Converter string para ObjectId se necessário
      const clientIdObj = typeof clientId === 'string' ? new Types.ObjectId(clientId) : clientId;
      
      this.logger.log(`🚀 [GATILHO] ClientId: ${clientIdObj}`);
      this.logger.log(`🚀 [GATILHO] Dados do trigger:`, {
        referralId: referralData.id,
        clientId: clientIdObj.toString(),
        campaignId,
        referralData,
        eventData: { type: 'lead_indicated' }
      });

      // Buscar fluxos ativos para este gatilho
      const activeFlows = await this.getActiveFlowsForTrigger('lead_indicated', clientIdObj);
      
      if (activeFlows.length === 0) {
        return {
          success: true,
          message: 'Nenhum fluxo ativo encontrado para o gatilho: lead_indicated',
          flowsTriggered: 0,
          messagesAdded: 0
        };
      }

      this.logger.log(`🚀 [GATILHO] Fluxos ativos encontrados: ${activeFlows.length}`);

      let totalMessagesAdded = 0;
      const triggeredFlows: string[] = [];

      // Processar cada fluxo ativo
      for (const flow of activeFlows) {
        try {
          this.logger.log(`🔄 [GATILHO] Processando fluxo: ${flow.name}`);
          
          // Processar mensagens do fluxo
          const messagesAdded = await this.processFlowMessages(flow, referralData, 'lead_indicated');
          
          if (messagesAdded > 0) {
            totalMessagesAdded += messagesAdded;
            triggeredFlows.push(flow.name);
            this.logger.log(`✅ [GATILHO] Mensagem adicionada à fila WhatsApp`);
          }
        } catch (error) {
          this.logger.error(`❌ [GATILHO] Erro ao processar fluxo ${flow.name}: ${error.message}`);
        }
      }

      return {
        success: true,
        message: `Processamento concluído: ${triggeredFlows.length} fluxos acionados`,
        flowsTriggered: triggeredFlows.length,
        messagesAdded: totalMessagesAdded
      };

    } catch (error) {
      this.logger.error(`❌ [GATILHO] Erro ao processar gatilho lead_indicated: ${error.message}`);
      return {
        success: false,
        message: `Erro ao processar gatilho: ${error.message}`,
        flowsTriggered: 0,
        messagesAdded: 0
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
