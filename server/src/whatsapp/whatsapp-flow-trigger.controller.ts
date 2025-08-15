import { Controller, Post, Body, UseGuards, Logger } from '@nestjs/common';
import { WhatsAppFlowTriggerService, TriggerType } from './whatsapp-flow-trigger.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Types } from 'mongoose';

@Controller('admin/whatsapp/triggers')
@UseGuards(JwtAuthGuard)
export class WhatsAppFlowTriggerController {
  private readonly logger = new Logger(WhatsAppFlowTriggerController.name);

  constructor(private readonly whatsappFlowTriggerService: WhatsAppFlowTriggerService) {}

  /**
   * Testa gatilho de novo indicador
   */
  @Post('test/indicator-joined')
  async testIndicatorJoined(@Body() body: {
    participantId: string;
    clientId: string;
    campaignId?: string;
  }) {
    try {
      this.logger.log(`Testando gatilho INDICATOR_JOINED: ${JSON.stringify(body)}`);

      const result = await this.whatsappFlowTriggerService.triggerIndicatorJoined(
        new Types.ObjectId(body.participantId),
        new Types.ObjectId(body.clientId),
        body.campaignId,
      );

      return {
        success: true,
        message: 'Gatilho testado com sucesso',
        data: result,
      };
    } catch (error) {
      this.logger.error(`Erro ao testar gatilho INDICATOR_JOINED: ${error.message}`);
      return {
        success: false,
        message: 'Erro ao testar gatilho',
        error: error.message,
      };
    }
  }

  /**
   * Testa gatilho de novo lead
   */
  @Post('test/lead-indicated')
  async testLeadIndicated(@Body() body: {
    referralId: string;
    clientId: string;
    campaignId?: string;
  }) {
    try {
      this.logger.log(`Testando gatilho LEAD_INDICATED: ${JSON.stringify(body)}`);

      const result = await this.whatsappFlowTriggerService.triggerLeadIndicated(
        new Types.ObjectId(body.referralId),
        new Types.ObjectId(body.clientId),
        body.campaignId,
      );

      return {
        success: true,
        message: 'Gatilho testado com sucesso',
        data: result,
      };
    } catch (error) {
      this.logger.error(`Erro ao testar gatilho LEAD_INDICATED: ${error.message}`);
      return {
        success: false,
        message: 'Erro ao testar gatilho',
        error: error.message,
      };
    }
  }

  /**
   * Testa gatilho de recompensa ganha
   */
  @Post('test/reward-earned')
  async testRewardEarned(@Body() body: {
    participantId: string;
    clientId: string;
    rewardAmount: number;
    rewardType: string;
    totalEarnings: number;
  }) {
    try {
      this.logger.log(`Testando gatilho REWARD_EARNED: ${JSON.stringify(body)}`);

      const result = await this.whatsappFlowTriggerService.triggerRewardEarned(
        new Types.ObjectId(body.participantId),
        new Types.ObjectId(body.clientId),
        body.rewardAmount,
        body.rewardType,
        body.totalEarnings,
      );

      return {
        success: true,
        message: 'Gatilho testado com sucesso',
        data: result,
      };
    } catch (error) {
      this.logger.error(`Erro ao testar gatilho REWARD_EARNED: ${error.message}`);
      return {
        success: false,
        message: 'Erro ao testar gatilho',
        error: error.message,
      };
    }
  }

  /**
   * Testa gatilho genérico
   */
  @Post('test/generic')
  async testGenericTrigger(@Body() body: {
    triggerType: TriggerType;
    participantId?: string;
    referralId?: string;
    clientId: string;
    campaignId?: string;
    eventData?: Record<string, any>;
  }) {
    try {
      this.logger.log(`Testando gatilho genérico: ${JSON.stringify(body)}`);

      const triggerData = {
        participantId: body.participantId ? new Types.ObjectId(body.participantId) : undefined,
        referralId: body.referralId ? new Types.ObjectId(body.referralId) : undefined,
        clientId: new Types.ObjectId(body.clientId),
        campaignId: body.campaignId,
        eventData: body.eventData || {},
      };

      const result = await this.whatsappFlowTriggerService.processTrigger(
        body.triggerType,
        triggerData,
      );

      return {
        success: true,
        message: 'Gatilho genérico testado com sucesso',
        data: result,
      };
    } catch (error) {
      this.logger.error(`Erro ao testar gatilho genérico: ${error.message}`);
      return {
        success: false,
        message: 'Erro ao testar gatilho genérico',
        error: error.message,
      };
    }
  }

  /**
   * Lista todos os tipos de gatilhos disponíveis
   */
  @Post('list-types')
  async listTriggerTypes() {
    try {
      const triggerTypes = Object.values(TriggerType);
      
      return {
        success: true,
        data: {
          triggerTypes,
          descriptions: {
            [TriggerType.INDICATOR_JOINED]: 'Novo indicador se juntou ao sistema',
            [TriggerType.LEAD_INDICATED]: 'Novo lead foi indicado',
            [TriggerType.REWARD_EARNED]: 'Recompensa foi ganha',
            [TriggerType.CAMPAIGN_STARTED]: 'Campanha foi iniciada',
            [TriggerType.PARTICIPANT_ACTIVATED]: 'Participante foi ativado',
            [TriggerType.REFERRAL_COMPLETED]: 'Indicação foi completada',
          },
        },
      };
    } catch (error) {
      this.logger.error(`Erro ao listar tipos de gatilhos: ${error.message}`);
      return {
        success: false,
        message: 'Erro ao listar tipos de gatilhos',
        error: error.message,
      };
    }
  }
}
