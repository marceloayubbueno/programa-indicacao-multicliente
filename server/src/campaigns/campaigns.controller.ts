import { Body, Controller, Post, Get, Query, Put, Param, UseGuards } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { JwtClientAuthGuard } from '../auth/guards/jwt-client-auth.guard';
import { ClientId } from '../auth/decorators/client-id.decorator';

@Controller('campaigns')
@UseGuards(JwtClientAuthGuard) // 🔒 PROTEÇÃO: Todas as rotas protegidas por JWT
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  async createCampaign(
    @Body() body: any,
    @ClientId() clientId: string // 🚀 NOVO: ClientId extraído automaticamente do JWT
  ) {
    // 🔒 SEGURANÇA: Garantir que o clientId do body corresponde ao do JWT
    const campaignData = { ...body, clientId };
    return this.campaignsService.createCampaign(campaignData);
  }

  @Get()
  async getCampaigns(@ClientId() clientId: string) {
    // 🚀 NOVO: ClientId vem automaticamente do JWT - sem query params inseguros
    const campaigns = await this.campaignsService.findByClient(clientId);
    return { success: true, data: campaigns };
  }

  // 🆕 NOVA FUNCIONALIDADE: Buscar LP de Indicadores de uma campanha
  @Get(':id/lp-indicadores')
  async getCampaignLPIndicadores(@Param('id') campaignId: string, @ClientId() clientId: string) {
    try {
      const lpIndicadores = await this.campaignsService.getCampaignLPIndicadores(campaignId, clientId);
      
      return {
        success: true,
        data: lpIndicadores,
        message: 'LP de Indicadores encontrada'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Erro ao buscar LP de Indicadores',
        error: error.message
      };
    }
  }

  @Put(':id')
  async updateCampaign(
    @Param('id') id: string, 
    @Body() updateData: any,
    @ClientId() clientId: string // 🔒 SEGURANÇA: Validar ownership da campanha
  ) {
    try {
      // 🔒 SEGURANÇA: Verificar se a campanha pertence ao cliente autenticado
      const campaigns = await this.campaignsService.findByClient(clientId);
      const campaignExists = campaigns.find(c => c._id.toString() === id);
      
      if (!campaignExists) {
        return {
          success: false,
          message: 'Campanha não encontrada ou não pertence ao cliente'
        };
      }

      const updated = await this.campaignsService.updateCampaign(id, updateData);
      return {
        success: true,
        data: updated,
        message: 'Campanha atualizada com sucesso'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Erro ao atualizar campanha'
      };
    }
  }

  // 🔧 ENDPOINT DE REPARAÇÃO: Corrigir vinculações LP-Campanha
  @Post('repair-lp-links')
  async repairLPLinks(@ClientId() clientId: string) {
    try {
      console.log('[REPAIR-ENDPOINT] Executando reparação para cliente:', clientId);
      const result = await this.campaignsService.repairLPCampaignLinks();
      
      return {
        success: true,
        data: result,
        message: `Reparação concluída. ${result.fixed} LPs corrigidas de ${result.total} campanhas verificadas.`
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro ao executar reparação: ' + error.message,
        error: error.message
      };
    }
  }
} 