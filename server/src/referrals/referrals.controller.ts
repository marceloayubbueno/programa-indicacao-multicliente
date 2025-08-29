import { Body, Controller, HttpCode, HttpStatus, Post, Logger, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { JwtClientAuthGuard } from '../auth/guards/jwt-client-auth.guard';
import { ClientId } from '../auth/decorators/client-id.decorator';

@Controller('referrals')
@UseGuards(JwtClientAuthGuard) // 🔒 PROTEÇÃO: Todas as rotas protegidas por JWT
export class ReferralsController {
  private readonly logger = new Logger(ReferralsController.name);

  constructor(private readonly referralsService: ReferralsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createReferral(@Body() body: any, @ClientId() clientId: string) {
    this.logger.log('Recebido POST /referrals');
    this.logger.debug('Body recebido:', JSON.stringify(body));
    const { leadName, leadEmail, leadPhone, campaignId, indicatorId } = body;
    if (!leadName || !leadEmail || !leadPhone) {
      this.logger.warn('Campos obrigatórios ausentes');
      return { success: false, message: 'Nome, e-mail e celular são obrigatórios.' };
    }
    try {
      const result = await this.referralsService.createReferral({
        leadName,
        leadEmail,
        leadPhone,
        campaignId,
        clientId, // 🔒 SEGURANÇA: Usar clientId do JWT
        indicatorId,
        status: 'pendente',
      });
      this.logger.log('Referral criado com sucesso:', JSON.stringify(result.data));
      return { success: true, message: 'Indicação enviada com sucesso!', referralId: result.data._id };
    } catch (err) {
      this.logger.error('Erro ao criar referral:', err);
      return { success: false, message: 'Erro ao criar indicação.' };
    }
  }

  @Get()
  async getAllReferrals(@ClientId() clientId: string) {
    this.logger.log('Recebido GET /referrals');
    try {
      const referrals = await this.referralsService.findByClient(clientId); // 🔒 SEGURANÇA: Filtrar por clientId
      return { success: true, data: referrals };
    } catch (err) {
      this.logger.error('Erro ao listar referrals:', err);
      return { success: false, message: 'Erro ao buscar indicações.' };
    }
  }

  /**
   * Endpoint para página de pagamentos - listar recompensas
   * GET /referrals/payments (MOVIDO PARA CIMA PARA EVITAR CONFLITOS)
   */
  @Get('payments')
  async getPaymentsData(@Query('clientId') clientId?: string) {
    this.logger.log('Buscando dados para página de pagamentos');
    
    try {
      const rewardsData = await this.referralsService.getRewardsForPayments(clientId);
      
      // Filtrar apenas recompensas com valor > 0
      const rewardsWithValue = rewardsData.filter(r => r.rewardValue && r.rewardValue > 0);

      return {
        success: true,
        data: rewardsWithValue
      };
    } catch (error) {
      this.logger.error('Erro ao buscar dados de pagamentos:', error);
      return {
        success: false,
        message: error.message || 'Erro ao buscar dados de pagamentos'
      };
    }
  }

  // === ENDPOINTS PARA SISTEMA DE RECOMPENSAS ===

  /**
   * Marcar indicação como convertida (venda realizada)
   * POST /referrals/:id/mark-conversion
   */
  @Post(':id/mark-conversion')
  async markConversion(
    @Param('id') id: string,
    @Body() body: { notes?: string }
  ) {
    this.logger.log(`Marcando conversão para referral: ${id}`);
    
    try {
      // Importar CampaignsService dinamicamente
      const { CampaignsService } = await import('../campaigns/campaigns.service');
      
      // TODO: Idealmente isso deveria ser injetado no construtor
      // Por enquanto, vamos atualizar diretamente via service
      await this.referralsService.markAsConverted(id, body.notes);
      
      return {
        success: true,
        message: 'Conversão marcada com sucesso',
        referralId: id
      };
    } catch (error) {
      this.logger.error('Erro ao marcar conversão:', error);
      return {
        success: false,
        message: error.message || 'Erro ao marcar conversão',
        referralId: id
      };
    }
  }

  /**
   * Buscar recompensas de um indicador
   * GET /referrals/indicator/:indicatorId/rewards
   */
  @Get('indicator/:indicatorId/rewards')
  async getIndicatorRewards(@Param('indicatorId') indicatorId: string) {
    this.logger.log(`Buscando recompensas do indicador: ${indicatorId}`);
    
    try {
      const rewards = await this.referralsService.getIndicatorRewards(indicatorId);
      return {
        success: true,
        data: rewards,
        message: 'Recompensas encontradas'
      };
    } catch (error) {
      this.logger.error('Erro ao buscar recompensas:', error);
      return {
        success: false,
        message: error.message || 'Erro ao buscar recompensas',
        indicatorId
      };
    }
  }

  /**
   * Listar indicações com recompensas pendentes
   * GET /referrals/pending-rewards?clientId=xxx
   */
  @Get('pending-rewards')
  async getPendingRewards(@Query('clientId') clientId: string) {
    this.logger.log(`Buscando recompensas pendentes para cliente: ${clientId}`);
    
    if (!clientId) {
      return {
        success: false,
        message: 'clientId é obrigatório'
      };
    }

    try {
      const pendingRewards = await this.referralsService.findPendingRewards(clientId);
      return {
        success: true,
        data: pendingRewards,
        total: pendingRewards.length,
        message: `${pendingRewards.length} recompensas pendentes encontradas`
      };
    } catch (error) {
      this.logger.error('Erro ao buscar recompensas pendentes:', error);
      return {
        success: false,
        message: error.message || 'Erro ao buscar recompensas pendentes'
      };
    }
  }

  /**
   * Atualizar status do lead
   * PATCH /referrals/:id/status
   */
  @Post(':id/status')
  async updateLeadStatus(
    @Param('id') id: string,
    @Body() body: { status: string }
  ) {
    this.logger.log(`Atualizando status do lead: ${id} para ${body.status}`);
    
    try {
      await this.referralsService.updateLeadStatus(id, body.status);
      return {
        success: true,
        message: 'Status atualizado com sucesso'
      };
    } catch (error) {
      this.logger.error('Erro ao atualizar status:', error);
      return {
        success: false,
        message: error.message || 'Erro ao atualizar status'
      };
    }
  }

  /**
   * Aprovar recompensa (pendente → aprovada)
   * POST /referrals/:id/approve-reward
   */
  @Post(':id/approve-reward')
  async approveReward(
    @Param('id') id: string,
    @Body() body: { notes?: string }
  ) {
    this.logger.log(`Aprovando recompensa para referral: ${id}`);
    
    try {
      await this.referralsService.approveReward(id, body.notes);
      return {
        success: true,
        message: 'Recompensa aprovada com sucesso'
      };
    } catch (error) {
      this.logger.error('Erro ao aprovar recompensa:', error);
      return {
        success: false,
        message: error.message || 'Erro ao aprovar recompensa'
      };
    }
  }

  /**
   * Rejeitar recompensa
   * POST /referrals/:id/reject-reward
   */
  @Post(':id/reject-reward')
  async rejectReward(
    @Param('id') id: string,
    @Body() body: { notes?: string }
  ) {
    this.logger.log(`Rejeitando recompensa para referral: ${id}`);
    
    try {
      await this.referralsService.rejectReward(id, body.notes);
      return {
        success: true,
        message: 'Recompensa rejeitada'
      };
    } catch (error) {
      this.logger.error('Erro ao rejeitar recompensa:', error);
      return {
        success: false,
        message: error.message || 'Erro ao rejeitar recompensa'
      };
    }
  }

  /**
   * Processar pagamento (aprovada → paga)
   * POST /referrals/:id/process-payment
   */
  @Post(':id/process-payment')
  async processPayment(
    @Param('id') id: string,
    @Body() body: { 
      paymentMethod: string;
      reference: string;
      notes?: string;
    }
  ) {
    this.logger.log(`Processando pagamento para referral: ${id}`);
    
    try {
      await this.referralsService.processPayment(id, body);
      return {
        success: true,
        message: 'Pagamento processado com sucesso'
      };
    } catch (error) {
      this.logger.error('Erro ao processar pagamento:', error);
      return {
        success: false,
        message: error.message || 'Erro ao processar pagamento'
      };
    }
  }


} 