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
  // ✅ CORREÇÃO: Adicionar campos essenciais que estavam faltando
  uniqueReferralCode?: string;  // Link único de compartilhamento
  plainPassword?: string;        // Senha do indicador
  [key: string]: any;
}

export interface ReferralData {
  id: string;
  leadName: string;
  leadEmail: string;
  leadPhone: string;
  indicadorName?: string;
  indicadorEmail?: string;
  indicadorPhone?: string;
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
      
      const activeFlows = await this.whatsappFlowModel.find(query).exec();
      
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

  // 🆕 MÉTODO PARA BUSCAR DADOS DO PARTICIPANTE
  private async getParticipantData(participantId: Types.ObjectId): Promise<any> {
    try {
      // ✅ CORREÇÃO: Implementar busca real dos dados do participante
      const Participant = this.whatsappFlowModel.db.models.Participant || this.whatsappFlowModel.db.model('Participant');
      
      if (!Participant) {
        this.logger.error('Modelo Participant não encontrado');
        return null;
      }
      
      const participantData = await Participant.findById(participantId).select('uniqueReferralCode plainPassword campaignId').exec();
      
      if (!participantData) {
        this.logger.error('Participante não encontrado no banco');
        return null;
      }
      
      return participantData;
    } catch (error) {
      this.logger.error(`Erro ao buscar dados do participante: ${error.message}`);
      return null;
    }
  }

  // 🆕 MÉTODO PARA BUSCAR DADOS DO CLIENTE
  private async getClientData(clientId: Types.ObjectId): Promise<any> {
    try {
      // ✅ CORREÇÃO: Implementar busca real dos dados do cliente
      const Client = this.whatsappFlowModel.db.models.Client || this.whatsappFlowModel.db.model('Client');
      
      if (!Client) {
        this.logger.error('Modelo Client não encontrado');
        return null;
      }
      
      const clientData = await Client.findById(clientId).select('companyName').exec();
      
      if (!clientData) {
        this.logger.error('Cliente não encontrado no banco');
        return null;
      }
      
      return clientData;
    } catch (error) {
      this.logger.error(`Erro ao buscar dados do cliente: ${error.message}`);
      return null;
    }
  }

  // 🆕 MÉTODO PARA BUSCAR DADOS DA CAMPANHA
  private async getCampaignData(campaignId?: string): Promise<any> {
    try {
      if (!campaignId) {
        return null;
      }
      
      // ✅ CORREÇÃO: Implementar busca real dos dados da campanha
      const Campaign = this.whatsappFlowModel.db.models.Campaign || this.whatsappFlowModel.db.model('Campaign');
      
      if (!Campaign) {
        this.logger.error('Modelo Campaign não encontrado');
        return null;
      }
      
      const campaignData = await Campaign.findById(campaignId).select('name').exec();
      
      if (!campaignData) {
        this.logger.error('Campanha não encontrada no banco');
        return null;
      }
      
      return campaignData;
    } catch (error) {
      this.logger.error(`Erro ao buscar dados da campanha: ${error.message}`);
      return null;
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
            
            // 🆕 BUSCAR DADOS REAIS DO PARTICIPANTE NO BANCO
            const participantDataFromDB = triggerData.participantId ? 
              await this.getParticipantData(triggerData.participantId) : null;
            
            // 🆕 BUSCAR DADOS DO CLIENTE
            const clientData = await this.getClientData(triggerData.clientId);
            
            // 🆕 BUSCAR DADOS DA CAMPANHA
            const campaignData = await this.getCampaignData(triggerData.campaignId);
            
            variables = {
              ...triggerData.participantData, // Incluir todos os dados extras
              dataEntrada: triggerData.participantData.createdAt || new Date(),
              
              // ✅ CORREÇÃO: Dados reais da empresa
              companyName: clientData?.companyName || 'Viral Lead',           // {{nomedaempresa}}
              
              // ✅ CORREÇÃO: Link único real do banco de dados (LINK COMPLETO)
              uniqueReferralCode: `https://lp.virallead.com.br/indicacao/${participantDataFromDB?.uniqueReferralCode || 
                triggerData.participantData.uniqueReferralCode || 
                (triggerData.participantData.id ? `REF${triggerData.participantData.id.slice(-8).toUpperCase()}` : 'REF' + Math.random().toString(36).substr(2, 8).toUpperCase())}`, // {{linkunico}}
              
              // ✅ CORREÇÃO: Senha real do banco de dados
              plainPassword: participantDataFromDB?.plainPassword || 
                triggerData.participantData.plainPassword || 
                Math.random().toString(36).substr(2, 6).toUpperCase(),           // {{senhaindicador}}
              
              // 🆕 NOVO: Nome da campanha real
              campaignName: campaignData?.name || 'Campanha Viral Lead'        // {{nomeCampanha}}
            };
          } else if (triggerData.participantId) {
            // ✅ CORREÇÃO: Buscar dados reais do participante no banco
            const participantDataFromDB = await this.getParticipantData(triggerData.participantId);
            
            // ✅ CORREÇÃO: Buscar dados do cliente
            const clientData = await this.getClientData(triggerData.clientId);
            
            // ✅ CORREÇÃO: Buscar dados da campanha
            const campaignData = await this.getCampaignData(triggerData.campaignId);

            phoneNumber = 'placeholder_phone';
            variables = {
              nome: 'Indicador',
              email: '',
              telefone: '',
              dataEntrada: new Date(),
              
              // ✅ CORREÇÃO: Dados reais da empresa
              companyName: clientData?.companyName || 'Viral Lead',           // {{nomedaempresa}}
              
              // ✅ CORREÇÃO: Link único real do banco de dados (LINK COMPLETO)
              uniqueReferralCode: `https://lp.virallead.com.br/indicacao/${participantDataFromDB?.uniqueReferralCode || 'Link não disponível'}`, // {{linkunico}}
              
              // ✅ CORREÇÃO: Senha real do banco de dados
              plainPassword: participantDataFromDB?.plainPassword || 'Senha não disponível',           // {{senhaindicador}}
              
              // 🆕 NOVO: Nome da campanha real
              campaignName: campaignData?.name || 'Campanha Viral Lead'        // {{nomeCampanha}}
            };
          }
          break;

        case TriggerType.LEAD_INDICATED:
          if (triggerData.referralData) {
            // Usar dados recebidos via parâmetros
            phoneNumber = triggerData.referralData.leadPhone;
            
            // 🆕 BUSCAR DADOS DO CLIENTE
            const clientData = await this.getClientData(triggerData.clientId);
            
            // 🆕 BUSCAR DADOS DA CAMPANHA
            const campaignData = await this.getCampaignData(triggerData.campaignId);
            
            variables = {
              ...triggerData.referralData, // Incluir todos os dados extras
              dataIndicacao: triggerData.referralData.createdAt || new Date(),
              
              // ✅ CORREÇÃO: Dados reais da empresa
              companyName: clientData?.companyName || 'Viral Lead',           // {{nomedaempresa}}
              
              // ✅ CORREÇÃO: Nome da campanha real
              campaignName: campaignData?.name || triggerData.referralData.campaignName || 'Campanha Viral Lead', // {{nomeCampanha}}
              
              // ✅ CORREÇÃO: DADOS DO INDICADOR (quem fez a indicação) - para tag {{nome}}
              name: triggerData.referralData.indicadorName || 'Indicador',      // {{nome}}
              email: triggerData.referralData.indicadorEmail || 'Email não disponível', // {{email}}
              phone: triggerData.referralData.indicadorPhone || 'Telefone não disponível', // {{telefone}}
            };
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
            
            // 🆕 BUSCAR DADOS DO CLIENTE
            const clientData = await this.getClientData(triggerData.clientId);
            
            // 🆕 BUSCAR DADOS DA CAMPANHA
            const campaignData = await this.getCampaignData(triggerData.campaignId);
            
            variables = {
              ...triggerData.participantData, // Incluir todos os dados extras
              
              // ✅ CORREÇÃO: Dados reais da empresa
              companyName: clientData?.companyName || 'Viral Lead',           // {{nomedaempresa}}
              
              // ✅ CORREÇÃO: Nome da campanha real
              campaignName: campaignData?.name || 'Campanha Viral Lead',        // {{nomeCampanha}}
              
              // ✅ CORREÇÃO: TAGS AVANÇADAS DO INDICADOR (LINK COMPLETO)
              uniqueReferralCode: `https://lp.virallead.com.br/indicacao/${triggerData.participantData.uniqueReferralCode || 
                (triggerData.participantData.id ? `REF${triggerData.participantData.id.slice(-8).toUpperCase()}` : 'REF' + Math.random().toString(36).substr(2, 8).toUpperCase())}`, // {{linkunico}}
              plainPassword: triggerData.participantData.plainPassword || 
                Math.random().toString(36).substr(2, 6).toUpperCase(),           // {{senhaindicador}}
              
              // 🆕 TAGS DE RECOMPENSA (corrigidas)
              rewardAmount: triggerData.eventData?.rewardAmount || 0,      // {{valorRecompensa}}
              rewardType: triggerData.eventData?.rewardType || 'Comissão', // {{tipoRecompensa}}
              totalEarnings: triggerData.eventData?.totalEarnings || 0,   // {{totalGanhos}}
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
            
            // 🆕 BUSCAR DADOS DO CLIENTE
            const clientData = await this.getClientData(triggerData.clientId);
            
            // 🆕 BUSCAR DADOS DA CAMPANHA
            const campaignData = await this.getCampaignData(triggerData.campaignId);
            
            variables = {
              ...triggerData.participantData, // Incluir todos os dados extras
              
              // ✅ CORREÇÃO: Dados reais da empresa
              companyName: clientData?.companyName || 'Viral Lead',           // {{nomedaempresa}}
              
              // ✅ CORREÇÃO: Nome da campanha real
              campaignName: campaignData?.name || 'Campanha Viral Lead',        // {{nomeCampanha}}
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
    
    // ✅ CORREÇÃO: Usar conteúdo do template sem adicionar frases duplicadas
    let body = template.content?.body || 'Olá {{nome}}! Bem-vindo ao nosso programa de indicação. Você está pronto para começar sua jornada de sucesso? 🚀';
    
    // Aplicar variáveis dinâmicas
    body = this.replaceVariables(body, recipientData.variables);
    
    // ✅ CORREÇÃO: Remover frases duplicadas que causavam problemas no frontend
    // Não adicionar sufixos automáticos - deixar o template controlar o conteúdo

    const result = {
      body,
      header: template.content?.header,
      footer: template.content?.footer,
      buttons: template.content?.buttons,
    };
    
    return result;
  }

  private replaceVariables(text: string, variables: Record<string, any>): string {
    let result = text;
    
    // 🆕 MAPEAMENTO CORRETO: Chaves em inglês para tags em português
    const variableMapping = {
      // ✅ TAGS BÁSICAS DO INDICADOR
      'name': 'nome',
      'email': 'email', 
      'phone': 'telefone',
      'createdAt': 'dataEntrada',
      
      // ✅ TAGS DO LEAD
      'leadPhone': 'telefoneLead',
      'leadName': 'nomeLead',
      'leadEmail': 'emailLead',
      'dataIndicacao': 'dataIndicacao',
      
      // ✅ TAGS DE RECOMPENSA
      'rewardAmount': 'valorRecompensa',
      'rewardType': 'tipoRecompensa',
      'totalEarnings': 'totalGanhos',
      
      // ✅ TAGS AVANÇADAS
      'companyName': 'nomedaempresa',        // Nome da empresa
      'uniqueReferralCode': 'linkunico',     // Link único de compartilhamento
      'plainPassword': 'senhaindicador',     // Senha de acesso do indicador
      'campaignName': 'nomeCampanha'         // Nome da campanha
    };
    
    for (const [key, value] of Object.entries(variables)) {
      // 🔧 CORREÇÃO: Mapear chave em inglês para tag em português
      const portugueseKey = variableMapping[key] || key;
      
      // 🔧 CORREÇÃO: Usar formato {{key}} em vez de {key}
      const placeholder = `{{${portugueseKey}}}`;
      const oldPlaceholder = `{${portugueseKey}}`;
      
      if (typeof value === 'string' || typeof value === 'number') {
        // 🔧 CORREÇÃO: Substituir ambos os formatos
        if (text.includes(placeholder)) {
          result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value.toString());
        }
        
        if (text.includes(oldPlaceholder)) {
          result = result.replace(new RegExp(oldPlaceholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value.toString());
        }
      }
    }
    
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
          indicadorEmail: referralData.indicadorEmail,
          indicadorPhone: referralData.indicadorPhone,
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
