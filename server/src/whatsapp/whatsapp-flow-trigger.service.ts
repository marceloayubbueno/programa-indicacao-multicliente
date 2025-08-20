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
        
        // 🔍 LOG DETALHADO: Dados da mensagem antes de adicionar na fila
        console.log('🔍 [QUEUE-ADD] ===== DADOS DA MENSAGEM ANTES DE ADICIONAR NA FILA =====');
        console.log('🔍 [QUEUE-ADD] Queue Message:', JSON.stringify(queueMessage, null, 2));
        console.log('🔍 [QUEUE-ADD] Content Body:', queueMessage.content.body);
        console.log('🔍 [QUEUE-ADD] Variables:', JSON.stringify(queueMessage.variables, null, 2));
        console.log('🔍 [QUEUE-ADD] ===== FIM DOS DADOS =====');
        
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

  // 🆕 MÉTODO PARA BUSCAR DADOS DO PARTICIPANTE
  private async getParticipantData(participantId: Types.ObjectId): Promise<any> {
    try {
      // 🔍 LOG: Buscando dados do participante
      console.log('🔍 [PARTICIPANT-DATA] ===== BUSCANDO DADOS DO PARTICIPANTE =====');
      console.log('🔍 [PARTICIPANT-DATA] Participant ID:', participantId);
      
      // ✅ CORREÇÃO: Implementar busca real dos dados do participante
      const Participant = this.whatsappFlowModel.db.models.Participant || this.whatsappFlowModel.db.model('Participant');
      
      if (!Participant) {
        console.error('🔍 [PARTICIPANT-DATA] ❌ Modelo Participant não encontrado');
        return null;
      }
      
      const participantData = await Participant.findById(participantId).select('uniqueReferralCode plainPassword campaignId').exec();
      
      if (!participantData) {
        console.error('🔍 [PARTICIPANT-DATA] ❌ Participante não encontrado no banco');
        return null;
      }
      
      console.log('🔍 [PARTICIPANT-DATA] Dados do participante encontrados:', participantData);
      console.log('🔍 [PARTICIPANT-DATA] ===== FIM BUSCA PARTICIPANTE =====');
      
      return participantData;
    } catch (error) {
      console.error('🔍 [PARTICIPANT-DATA] ❌ Erro ao buscar dados do participante:', error);
      return null;
    }
  }

  // 🆕 MÉTODO PARA BUSCAR DADOS DO CLIENTE
  private async getClientData(clientId: Types.ObjectId): Promise<any> {
    try {
      // 🔍 LOG: Buscando dados do cliente
      console.log('🔍 [CLIENT-DATA] ===== BUSCANDO DADOS DO CLIENTE =====');
      console.log('🔍 [CLIENT-DATA] Client ID:', clientId);
      
      // ✅ CORREÇÃO: Implementar busca real dos dados do cliente
      const Client = this.whatsappFlowModel.db.models.Client || this.whatsappFlowModel.db.model('Client');
      
      if (!Client) {
        console.error('🔍 [CLIENT-DATA] ❌ Modelo Client não encontrado');
        return null;
      }
      
      const clientData = await Client.findById(clientId).select('companyName').exec();
      
      if (!clientData) {
        console.error('🔍 [CLIENT-DATA] ❌ Cliente não encontrado no banco');
        return null;
      }
      
      console.log('🔍 [CLIENT-DATA] Dados do cliente encontrados:', clientData);
      console.log('🔍 [CLIENT-DATA] ===== FIM BUSCA CLIENTE =====');
      
      return clientData;
    } catch (error) {
      console.error('🔍 [CLIENT-DATA] ❌ Erro ao buscar dados do cliente:', error);
      return null;
    }
  }

  // 🆕 MÉTODO PARA BUSCAR DADOS DA CAMPANHA
  private async getCampaignData(campaignId?: string): Promise<any> {
    try {
      if (!campaignId) {
        console.log('🔍 [CAMPAIGN-DATA] Nenhum campaignId fornecido');
        return null;
      }
      
      console.log('🔍 [CAMPAIGN-DATA] ===== BUSCANDO DADOS DA CAMPANHA =====');
      console.log('🔍 [CAMPAIGN-DATA] Campaign ID:', campaignId);
      
      // ✅ CORREÇÃO: Implementar busca real dos dados da campanha
      const Campaign = this.whatsappFlowModel.db.models.Campaign || this.whatsappFlowModel.db.model('Campaign');
      
      if (!Campaign) {
        console.error('🔍 [CAMPAIGN-DATA] ❌ Modelo Campaign não encontrado');
        return null;
      }
      
      const campaignData = await Campaign.findById(campaignId).select('name').exec();
      
      if (!campaignData) {
        console.error('🔍 [CAMPAIGN-DATA] ❌ Campanha não encontrada no banco');
        return null;
      }
      
      console.log('🔍 [CAMPAIGN-DATA] Dados da campanha encontrados:', campaignData);
      console.log('🔍 [CAMPAIGN-DATA] ===== FIM BUSCA CAMPANHA =====');
      
      return campaignData;
    } catch (error) {
      console.error('🔍 [CAMPAIGN-DATA] ❌ Erro ao buscar dados da campanha:', error);
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
      // 🔍 LOG DE DIAGNÓSTICO: Início da extração de dados
      console.log('🔍 [EXTRACT-DATA] ===== INICIANDO EXTRAÇÃO DE DADOS =====');
      console.log('🔍 [EXTRACT-DATA] Trigger Type:', triggerType);
      console.log('🔍 [EXTRACT-DATA] Trigger Data:', JSON.stringify(triggerData, null, 2));
      console.log('🔍 [EXTRACT-DATA] Participant Data:', triggerData.participantData);
      console.log('🔍 [EXTRACT-DATA] Referral Data:', triggerData.referralData);

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
              
              // ✅ CORREÇÃO: Link único real do banco de dados
              uniqueReferralCode: participantDataFromDB?.uniqueReferralCode || 
                triggerData.participantData.uniqueReferralCode || 
                (triggerData.participantData.id ? `REF${triggerData.participantData.id.slice(-8).toUpperCase()}` : 'REF' + Math.random().toString(36).substr(2, 8).toUpperCase()), // {{linkunico}}
              
              // ✅ CORREÇÃO: Senha real do banco de dados
              plainPassword: participantDataFromDB?.plainPassword || 
                triggerData.participantData.plainPassword || 
                Math.random().toString(36).substr(2, 6).toUpperCase(),           // {{senhaindicador}}
              
              // 🆕 NOVO: Nome da campanha real
              campaignName: campaignData?.name || 'Campanha Viral Lead'        // {{nomeCampanha}}
            };
            
            // 🔍 LOG DE DIAGNÓSTICO: Dados extraídos para indicador
            console.log('🔍 [EXTRACT-DATA] ✅ Dados extraídos para INDICATOR_JOINED:');
            console.log('🔍 [EXTRACT-DATA] Phone Number:', phoneNumber);
            console.log('🔍 [EXTRACT-DATA] Participant Data from DB:', participantDataFromDB);
            console.log('🔍 [EXTRACT-DATA] Client Data:', clientData);
            console.log('🔍 [EXTRACT-DATA] Campaign Data:', campaignData);
            console.log('🔍 [EXTRACT-DATA] Variables:', JSON.stringify(variables, null, 2));
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
              
              // ✅ CORREÇÃO: Link único real do banco de dados
              uniqueReferralCode: participantDataFromDB?.uniqueReferralCode || 'Link não disponível', // {{linkunico}}
              
              // ✅ CORREÇÃO: Senha real do banco de dados
              plainPassword: participantDataFromDB?.plainPassword || 'Senha não disponível',           // {{senhaindicador}}
              
              // 🆕 NOVO: Nome da campanha real
              campaignName: campaignData?.name || 'Campanha Viral Lead'        // {{nomeCampanha}}
            };
            
            // 🔍 LOG DE DIAGNÓSTICO: Dados placeholder
            console.log('🔍 [EXTRACT-DATA] ⚠️ Usando dados placeholder para INDICATOR_JOINED');
            console.log('🔍 [EXTRACT-DATA] Phone Number:', phoneNumber);
            console.log('🔍 [EXTRACT-DATA] Participant Data from DB:', participantDataFromDB);
            console.log('🔍 [EXTRACT-DATA] Client Data:', clientData);
            console.log('🔍 [EXTRACT-DATA] Campaign Data:', campaignData);
            console.log('🔍 [EXTRACT-DATA] Variables:', JSON.stringify(variables, null, 2));
          }
          break;

        case TriggerType.LEAD_INDICATED:
          if (triggerData.referralData) {
            // Usar dados recebidos via parâmetros
            console.log('🔍 [FLOW-TRIGGER] referralData recebido:', triggerData.referralData);
            console.log('🔍 [FLOW-TRIGGER] leadPhone:', triggerData.referralData.leadPhone);
            
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
              
              // 🆕 DADOS DO INDICADOR (quem fez a indicação)
              name: triggerData.participantData?.name || 'Indicador',      // {{nome}}
              email: triggerData.participantData?.email || 'Email não disponível', // {{email}}
              phone: triggerData.participantData?.phone || 'Telefone não disponível', // {{telefone}}
            };
            
            // 🔍 LOG DE DIAGNÓSTICO: Dados extraídos para lead
            console.log('🔍 [EXTRACT-DATA] ✅ Dados extraídos para LEAD_INDICATED:');
            console.log('🔍 [EXTRACT-DATA] Phone Number:', phoneNumber);
            console.log('🔍 [EXTRACT-DATA] Client Data:', clientData);
            console.log('🔍 [EXTRACT-DATA] Campaign Data:', campaignData);
            console.log('🔍 [EXTRACT-DATA] Participant Data:', triggerData.participantData);
            console.log('🔍 [EXTRACT-DATA] Variables:', JSON.stringify(variables, null, 2));
            
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
            
            // 🔍 LOG DE DIAGNÓSTICO: Dados placeholder para lead
            console.log('🔍 [EXTRACT-DATA] ⚠️ Usando dados placeholder para LEAD_INDICATED');
            console.log('🔍 [EXTRACT-DATA] Phone Number:', phoneNumber);
            console.log('🔍 [EXTRACT-DATA] Variables:', JSON.stringify(variables, null, 2));
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
              
              // ✅ CORREÇÃO: TAGS AVANÇADAS DO INDICADOR
              uniqueReferralCode: triggerData.participantData.uniqueReferralCode || 
                (triggerData.participantData.id ? `REF${triggerData.participantData.id.slice(-8).toUpperCase()}` : 'REF' + Math.random().toString(36).substr(2, 8).toUpperCase()), // {{linkunico}}
              plainPassword: triggerData.participantData.plainPassword || 
                Math.random().toString(36).substr(2, 6).toUpperCase(),           // {{senhaindicador}}
              
              // 🆕 TAGS DE RECOMPENSA (corrigidas)
              rewardAmount: triggerData.eventData?.rewardAmount || 0,      // {{valorRecompensa}}
              rewardType: triggerData.eventData?.rewardType || 'Comissão', // {{tipoRecompensa}}
              totalEarnings: triggerData.eventData?.totalEarnings || 0,   // {{totalGanhos}}
            };
            
            // 🔍 LOG DE DIAGNÓSTICO: Dados extraídos para recompensa
            console.log('🔍 [EXTRACT-DATA] ✅ Dados extraídos para REWARD_EARNED:');
            console.log('🔍 [EXTRACT-DATA] Phone Number:', phoneNumber);
            console.log('🔍 [EXTRACT-DATA] Client Data:', clientData);
            console.log('🔍 [EXTRACT-DATA] Campaign Data:', campaignData);
            console.log('🔍 [EXTRACT-DATA] Variables:', JSON.stringify(variables, null, 2));
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
            
            // 🔍 LOG DE DIAGNÓSTICO: Dados placeholder para recompensa
            console.log('🔍 [EXTRACT-DATA] ⚠️ Usando dados placeholder para REWARD_EARNED');
            console.log('🔍 [EXTRACT-DATA] Phone Number:', phoneNumber);
            console.log('🔍 [EXTRACT-DATA] Variables:', JSON.stringify(variables, null, 2));
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
            
            // 🔍 LOG DE DIAGNÓSTICO: Dados extraídos para caso default
            console.log('🔍 [EXTRACT-DATA] ✅ Dados extraídos para caso DEFAULT:');
            console.log('🔍 [EXTRACT-DATA] Phone Number:', phoneNumber);
            console.log('🔍 [EXTRACT-DATA] Client Data:', clientData);
            console.log('🔍 [EXTRACT-DATA] Campaign Data:', campaignData);
            console.log('🔍 [EXTRACT-DATA] Variables:', JSON.stringify(variables, null, 2));
          } else if (triggerData.participantId) {

            phoneNumber = 'placeholder_phone';
            variables = {
              nome: 'Usuário',
              email: '',
              telefone: '',
            };
            
            // 🔍 LOG DE DIAGNÓSTICO: Dados placeholder para caso default
            console.log('🔍 [EXTRACT-DATA] ⚠️ Usando dados placeholder para caso DEFAULT');
            console.log('🔍 [EXTRACT-DATA] Phone Number:', phoneNumber);
            console.log('🔍 [EXTRACT-DATA] Variables:', JSON.stringify(variables, null, 2));
          }
          break;
      }

      if (!phoneNumber) {
        console.log('🔍 [EXTRACT-DATA] ❌ Phone number não encontrado, retornando null');
        return null;
      }

      // 🔍 LOG DE DIAGNÓSTICO: Resultado final da extração
      console.log('🔍 [EXTRACT-DATA] ===== RESULTADO FINAL DA EXTRAÇÃO =====');
      console.log('🔍 [EXTRACT-DATA] Phone Number Final:', phoneNumber);
      console.log('🔍 [EXTRACT-DATA] Variables Finais:', JSON.stringify(variables, null, 2));
      console.log('🔍 [EXTRACT-DATA] ===== FIM DA EXTRAÇÃO =====');

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
    
    // 🔍 LOG DE DIAGNÓSTICO: Início da preparação do conteúdo
    console.log('🔍 [PREPARE-CONTENT] ===== INICIANDO PREPARAÇÃO DO CONTEÚDO =====');
    console.log('🔍 [PREPARE-CONTENT] Template ID:', template._id);
    console.log('🔍 [PREPARE-CONTENT] Template Name:', template.name);
    console.log('🔍 [PREPARE-CONTENT] Template Content:', JSON.stringify(template.content, null, 2));
    console.log('🔍 [PREPARE-CONTENT] Recipient Data:', JSON.stringify(recipientData, null, 2));
    console.log('🔍 [PREPARE-CONTENT] Trigger Type:', triggerType);
    
    // ✅ CORREÇÃO: Usar conteúdo do template sem adicionar frases duplicadas
    let body = template.content?.body || 'Olá {{nome}}! Bem-vindo ao nosso programa de indicação. Você está pronto para começar sua jornada de sucesso? 🚀';
    console.log('🔍 [PREPARE-CONTENT] Body original do template:', body);
    
    // Aplicar variáveis dinâmicas
    console.log('🔍 [PREPARE-CONTENT] Chamando replaceVariables...');
    body = this.replaceVariables(body, recipientData.variables);
    console.log('🔍 [PREPARE-CONTENT] Body após substituição de variáveis:', body);
    
    // ✅ CORREÇÃO: Remover frases duplicadas que causavam problemas no frontend
    // Não adicionar sufixos automáticos - deixar o template controlar o conteúdo
    
    console.log('🔍 [PREPARE-CONTENT] Body final (sem sufixos duplicados):', body);

    const result = {
      body,
      header: template.content?.header,
      footer: template.content?.footer,
      buttons: template.content?.buttons,
    };
    
    console.log('🔍 [PREPARE-CONTENT] Resultado final:', JSON.stringify(result, null, 2));
    console.log('🔍 [PREPARE-CONTENT] ===== FIM DA PREPARAÇÃO =====');
    
    return result;
  }

  private replaceVariables(text: string, variables: Record<string, any>): string {
    let result = text;
    
    // 🔍 LOG DETALHADO: Início da substituição
    console.log('🔍 [REPLACE-VARIABLES] ===== INICIANDO SUBSTITUIÇÃO DE VARIÁVEIS =====');
    console.log('🔍 [REPLACE-VARIABLES] Texto original:', text);
    console.log('🔍 [REPLACE-VARIABLES] Variáveis recebidas:', JSON.stringify(variables, null, 2));
    console.log('🔍 [REPLACE-VARIABLES] Tipo das variáveis:', typeof variables);
    console.log('🔍 [REPLACE-VARIABLES] Número de variáveis:', Object.keys(variables).length);
    
    // 🔍 LOG: Verificar se o texto contém tags
    const tagMatches = text.match(/\{\{(\w+)\}\}/g);
    console.log('🔍 [REPLACE-VARIABLES] Tags encontradas no texto:', tagMatches);
    
    let replacementsMade = 0;
    
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
      // 🔍 LOG: Processando cada variável
      console.log(`🔍 [REPLACE-VARIABLES] Processando variável: ${key} = ${value} (tipo: ${typeof value})`);
      
      // 🔧 CORREÇÃO: Mapear chave em inglês para tag em português
      const portugueseKey = variableMapping[key] || key;
      
      // 🔧 CORREÇÃO: Usar formato {{key}} em vez de {key}
      const placeholder = `{{${portugueseKey}}}`;
      const oldPlaceholder = `{${portugueseKey}}`;
      
      // 🔍 LOG: Verificar se a tag existe no texto
      const hasNewFormat = text.includes(placeholder);
      const hasOldFormat = text.includes(oldPlaceholder);
      
      console.log(`🔍 [REPLACE-VARIABLES] Tag ${placeholder} encontrada: ${hasNewFormat}`);
      console.log(`🔍 [REPLACE-VARIABLES] Tag ${oldPlaceholder} encontrada: ${hasOldFormat}`);
      
      if (typeof value === 'string' || typeof value === 'number') {
        // 🔧 CORREÇÃO: Substituir ambos os formatos
        if (hasNewFormat) {
          result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value.toString());
          replacementsMade++;
          console.log(`🔍 [REPLACE-VARIABLES] ✅ Substituído ${placeholder} → ${value}`);
        }
        
        if (hasOldFormat) {
          result = result.replace(new RegExp(oldPlaceholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value.toString());
          replacementsMade++;
          console.log(`🔍 [REPLACE-VARIABLES] ✅ Substituído ${oldPlaceholder} → ${value}`);
        }
      } else {
        console.log(`🔍 [REPLACE-VARIABLES] ⚠️ Variável ${key} ignorada (tipo não suportado: ${typeof value})`);
      }
    }
    
    console.log(`🔍 [REPLACE-VARIABLES] Total de substituições realizadas: ${replacementsMade}`);
    console.log('🔍 [REPLACE-VARIABLES] Texto final:', result);
    console.log('🔍 [REPLACE-VARIABLES] ===== FIM DA SUBSTITUIÇÃO =====');
    
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
