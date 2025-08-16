import { Controller, Post, Body, UseGuards, Logger, Get, Param } from '@nestjs/common';
import { WhatsAppFlowTriggerService, TriggerType } from './whatsapp-flow-trigger.service';
import { JwtClientAuthGuard } from '../auth/guards/jwt-client-auth.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Types } from 'mongoose';

@Controller('whatsapp/triggers')
export class WhatsAppFlowTriggerController {
  private readonly logger = new Logger(WhatsAppFlowTriggerController.name);

  constructor(private readonly whatsappFlowTriggerService: WhatsAppFlowTriggerService) {}

  // APIs para clientes dispararem gatilhos
  @Post('indicator-joined')
  @UseGuards(JwtClientAuthGuard)
  async triggerIndicatorJoined(@Body() body: { participantId: string; campaignId?: string; clientId: string; }) {
    try {
      this.logger.log(`Gatilho indicator_joined disparado para participante: ${body.participantId}`);
      
      const result = await this.whatsappFlowTriggerService.triggerIndicatorJoined(
        new Types.ObjectId(body.participantId),
        new Types.ObjectId(body.clientId),
        body.campaignId
      );

      return {
        success: true,
        message: 'Gatilho processado com sucesso',
        result
      };
    } catch (error) {
      this.logger.error(`Erro ao disparar gatilho indicator_joined: ${error.message}`);
      return {
        success: false,
        message: 'Erro ao processar gatilho',
        error: error.message
      };
    }
  }

  @Post('lead-indicated')
  @UseGuards(JwtClientAuthGuard)
  async triggerLeadIndicated(@Body() body: { referralId: string; campaignId?: string; clientId: string; }) {
    try {
      this.logger.log(`Gatilho lead_indicated disparado para indicação: ${body.referralId}`);
      
      const result = await this.whatsappFlowTriggerService.triggerLeadIndicated(
        new Types.ObjectId(body.referralId),
        new Types.ObjectId(body.clientId),
        body.campaignId
      );

      return {
        success: true,
        message: 'Gatilho processado com sucesso',
        result
      };
    } catch (error) {
      this.logger.error(`Erro ao disparar gatilho lead_indicated: ${error.message}`);
      return {
        success: false,
        message: 'Erro ao processar gatilho',
        error: error.message
      };
    }
  }

  @Post('reward-earned')
  @UseGuards(JwtClientAuthGuard)
  async triggerRewardEarned(@Body() body: { 
    participantId: string; 
    clientId: string; 
    rewardAmount: number; 
    rewardType: string; 
    totalEarnings: number; 
  }) {
    try {
      this.logger.log(`Gatilho reward_earned disparado para participante: ${body.participantId}`);
      
      const result = await this.whatsappFlowTriggerService.triggerRewardEarned(
        new Types.ObjectId(body.participantId),
        new Types.ObjectId(body.clientId),
        body.rewardAmount,
        body.rewardType,
        body.totalEarnings
      );

      return {
        success: true,
        message: 'Gatilho processado com sucesso',
        result
      };
    } catch (error) {
      this.logger.error(`Erro ao disparar gatilho reward_earned: ${error.message}`);
      return {
        success: false,
        message: 'Erro ao processar gatilho',
        error: error.message
      };
    }
  }

  // API genérica para qualquer tipo de gatilho
  @Post('generic')
  @UseGuards(JwtClientAuthGuard)
  async triggerGeneric(@Body() body: { 
    triggerType: TriggerType; 
    participantId?: string; 
    referralId?: string; 
    clientId: string; 
    campaignId?: string; 
    eventData?: Record<string, any>; 
  }) {
    try {
      this.logger.log(`Gatilho genérico disparado: ${body.triggerType}`);
      
      const result = await this.whatsappFlowTriggerService.processTrigger(
        body.triggerType,
        {
          participantId: body.participantId ? new Types.ObjectId(body.participantId) : undefined,
          referralId: body.referralId ? new Types.ObjectId(body.referralId) : undefined,
          clientId: new Types.ObjectId(body.clientId),
          campaignId: body.campaignId,
          eventData: body.eventData || {},
        }
      );

      return {
        success: true,
        message: 'Gatilho processado com sucesso',
        result
      };
    } catch (error) {
      this.logger.error(`Erro ao disparar gatilho genérico: ${error.message}`);
      return {
        success: false,
        message: 'Erro ao processar gatilho',
        error: error.message
      };
    }
  }

  // API para admin listar tipos de gatilhos disponíveis
  @Get('types')
  @UseGuards(JwtAuthGuard)
  async listTriggerTypes() {
    return {
      success: true,
      triggerTypes: [
        {
          type: TriggerType.INDICATOR_JOINED,
          name: 'Novo Indicador',
          description: 'Disparado quando um novo indicador se junta ao sistema',
          priority: 'HIGH',
          requiredFields: ['participantId', 'clientId']
        },
        {
          type: TriggerType.LEAD_INDICATED,
          name: 'Novo Lead',
          description: 'Disparado quando um novo lead é indicado',
          priority: 'HIGH',
          requiredFields: ['referralId', 'clientId']
        },
        {
          type: TriggerType.REWARD_EARNED,
          name: 'Recompensa Ganha',
          description: 'Disparado quando uma recompensa é ganha',
          priority: 'MEDIUM',
          requiredFields: ['participantId', 'clientId', 'rewardAmount', 'rewardType', 'totalEarnings']
        },
        {
          type: TriggerType.CAMPAIGN_STARTED,
          name: 'Campanha Iniciada',
          description: 'Disparado quando uma campanha é iniciada',
          priority: 'MEDIUM',
          requiredFields: ['clientId', 'campaignId']
        },
        {
          type: TriggerType.PARTICIPANT_ACTIVATED,
          name: 'Participante Ativado',
          description: 'Disparado quando um participante é ativado',
          priority: 'MEDIUM',
          requiredFields: ['participantId', 'clientId']
        },
        {
          type: TriggerType.REFERRAL_COMPLETED,
          name: 'Indicação Completada',
          description: 'Disparado quando uma indicação é completada',
          priority: 'MEDIUM',
          requiredFields: ['referralId', 'clientId']
        }
      ]
    };
  }

  // API para admin testar gatilhos
  @Post('test/:triggerType')
  @UseGuards(JwtAuthGuard)
  async testTrigger(@Param('triggerType') triggerType: string, @Body() body: any) {
    try {
      this.logger.log(`Teste de gatilho: ${triggerType}`);
      
      if (!Object.values(TriggerType).includes(triggerType as TriggerType)) {
        return {
          success: false,
          message: `Tipo de gatilho inválido: ${triggerType}`
        };
      }

      const result = await this.whatsappFlowTriggerService.processTrigger(
        triggerType as TriggerType,
        {
          participantId: body.participantId ? new Types.ObjectId(body.participantId) : undefined,
          referralId: body.referralId ? new Types.ObjectId(body.referralId) : undefined,
          clientId: new Types.ObjectId(body.clientId),
          campaignId: body.campaignId,
          eventData: body.eventData || {},
        }
      );

      return {
        success: true,
        message: 'Teste de gatilho executado com sucesso',
        result
      };
    } catch (error) {
      this.logger.error(`Erro ao testar gatilho: ${error.message}`);
      return {
        success: false,
        message: 'Erro ao executar teste de gatilho',
        error: error.message
      };
    }
  }
}
