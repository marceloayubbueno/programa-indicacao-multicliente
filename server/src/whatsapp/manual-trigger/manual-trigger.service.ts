import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WhatsAppFlow, WhatsAppFlowDocument } from '../entities/whatsapp-flow.schema';
import { Participant } from '../../clients/entities/participant.schema';

@Injectable()
export class ManualTriggerService {
  constructor(
    @InjectModel(WhatsAppFlow.name) private flowModel: Model<WhatsAppFlowDocument>,
    @InjectModel(Participant.name) private participantModel: Model<Participant>,
  ) {}

  /**
   * Disparar fluxo manualmente - CÓPIA EXATA DA LÓGICA QUE FUNCIONA
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
    console.log('🔍 [MANUAL-TRIGGER] Executando - flowId:', flowId, 'targetAudience:', body.targetAudience, 'campaignId:', body.campaignId);
    try {
      // Buscar fluxo e validar - CÓPIA EXATA
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

      // Mapear targetAudience para triggerType - CÓPIA EXATA
      let triggerTypes: string[] = [];
      
      if (body.targetAudience === 'indicators') {
        triggerTypes = ['indicator_joined'];
      } else if (body.targetAudience === 'leads') {
        triggerTypes = ['lead_indicated'];
      } else if (body.targetAudience === 'mixed') {
        triggerTypes = ['indicator_joined', 'lead_indicated'];
      } else {
        // Fallback para indicadores (comportamento anterior)
        triggerTypes = ['indicator_joined'];
      }

      // Usar sistema automático global - CÓPIA EXATA
      let participants: Participant[] = [];
      if (body.campaignId) {
        // Determinar tipo de participante baseado no targetAudience
        let tipoFilter: any = 'indicador'; // fallback
        
        if (body.targetAudience === 'leads') {
          tipoFilter = 'lead';
        } else if (body.targetAudience === 'mixed') {
          tipoFilter = { $in: ['indicador', 'lead'] };
        }
        
        // 🔍 DEBUG TEMPORÁRIO - Logs detalhados
        console.log('🔍 [DEBUG] Query parameters:', {
          campaignId: body.campaignId,
          clientId: clientId.toString(),
          targetAudience: body.targetAudience,
          tipoFilter: tipoFilter
        });
        
        // 🔍 DEBUG TEMPORÁRIO - Verificar se existem participantes no banco
        const totalParticipants = await this.participantModel.countDocuments({ clientId: clientId });
        const campaignParticipants = await this.participantModel.countDocuments({ 
          clientId: clientId, 
          campaignId: body.campaignId 
        });
        const indicatorParticipants = await this.participantModel.countDocuments({ 
          clientId: clientId, 
          campaignId: body.campaignId,
          tipo: 'indicador'
        });
        
        console.log('🔍 [DEBUG] Participant counts:', {
          totalParticipants,
          campaignParticipants,
          indicatorParticipants
        });
        
        participants = await this.participantModel.find({
          campaignId: body.campaignId,
          clientId: clientId,
          tipo: tipoFilter
        }).exec();
        
        console.log('🔍 [DEBUG] Query result:', {
          participantsFound: participants.length,
          sampleParticipants: participants.slice(0, 3).map(p => ({
            id: p._id,
            name: p.name,
            email: p.email,
            tipo: p.tipo,
            campaignId: p.campaignId
          }))
        });
      }

      // Usar sistema automático global para cada participante - CÓPIA EXATA
      let messagesSent = 0;
      const eligibleParticipants = participants.length;

      if (global.whatsAppFlowTriggerService && participants.length > 0) {
        for (const participant of participants) {
          try {
            const triggerResult = await global.whatsAppFlowTriggerService.triggerIndicatorJoined(
              {
                id: participant._id.toString(),
                name: participant.name,
                email: participant.email,
                phone: participant.phone,
                uniqueReferralCode: participant.uniqueReferralCode,
                plainPassword: participant.plainPassword
              },
              clientId,
              body.campaignId
            );
            
            if (triggerResult.success) {
              messagesSent += triggerResult.messagesAdded;
            }
          } catch (error) {
            console.error('Erro ao disparar fluxo para participante:', error.message);
          }
        }
      }

      // Atualizar estatísticas do fluxo - CÓPIA EXATA
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

  /**
   * Obter fluxo específico - CÓPIA EXATA
   */
  async getFlowById(flowId: string, clientId: Types.ObjectId): Promise<WhatsAppFlow> {
    const flow = await this.flowModel.findOne({ _id: flowId, clientId });
    if (!flow) {
      throw new NotFoundException('Fluxo não encontrado');
    }
    return flow;
  }

  /**
   * Atualizar estatísticas do fluxo - CÓPIA EXATA
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
}
