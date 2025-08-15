import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { WhatsAppFlowService } from './whatsapp-flow.service';
import { JwtClientAuthGuard } from '../auth/guards/jwt-client-auth.guard';
import { Types } from 'mongoose';

@Controller('whatsapp/flows')
@UseGuards(JwtClientAuthGuard)
export class WhatsAppFlowController {
  constructor(private readonly flowService: WhatsAppFlowService) {}

  // ===== CRUD OPERATIONS =====

  /**
   * Criar novo fluxo
   */
  @Post()
  async createFlow(@Body() createFlowDto: any, @Request() req: any) {
    const clientId = new Types.ObjectId(req.user.clientId);
    return await this.flowService.createFlow(createFlowDto, clientId);
  }

  /**
   * Obter todos os fluxos do cliente
   */
  @Get()
  async getFlows(@Request() req: any) {
    const clientId = new Types.ObjectId(req.user.clientId);
    return await this.flowService.getFlowsByClient(clientId);
  }

  /**
   * Obter fluxo específico
   */
  @Get(':id')
  async getFlow(@Param('id') id: string, @Request() req: any) {
    const clientId = new Types.ObjectId(req.user.clientId);
    return await this.flowService.getFlowById(id, clientId);
  }

  /**
   * Atualizar fluxo
   */
  @Put(':id')
  async updateFlow(
    @Param('id') id: string,
    @Body() updateFlowDto: any,
    @Request() req: any
  ) {
    const clientId = new Types.ObjectId(req.user.clientId);
    return await this.flowService.updateFlow(id, updateFlowDto, clientId);
  }

  /**
   * Deletar fluxo
   */
  @Delete(':id')
  async deleteFlow(@Param('id') id: string, @Request() req: any) {
    const clientId = new Types.ObjectId(req.user.clientId);
    await this.flowService.deleteFlow(id, clientId);
    return { message: 'Fluxo deletado com sucesso' };
  }

  // ===== FLOW MANAGEMENT =====

  /**
   * Ativar fluxo
   */
  @Post(':id/activate')
  async activateFlow(@Param('id') id: string, @Request() req: any) {
    const clientId = new Types.ObjectId(req.user.clientId);
    return await this.flowService.activateFlow(id, clientId);
  }

  /**
   * Pausar fluxo
   */
  @Post(':id/pause')
  async pauseFlow(@Param('id') id: string, @Request() req: any) {
    const clientId = new Types.ObjectId(req.user.clientId);
    return await this.flowService.pauseFlow(id, clientId);
  }

  /**
   * Arquivar fluxo
   */
  @Post(':id/archive')
  async archiveFlow(@Param('id') id: string, @Request() req: any) {
    const clientId = new Types.ObjectId(req.user.clientId);
    return await this.flowService.archiveFlow(id, clientId);
  }

  /**
   * Duplicar fluxo
   */
  @Post(':id/duplicate')
  async duplicateFlow(
    @Param('id') id: string,
    @Body() body: { newName: string },
    @Request() req: any
  ) {
    const clientId = new Types.ObjectId(req.user.clientId);
    return await this.flowService.duplicateFlow(id, clientId, body.newName);
  }

  // ===== FLOW EXECUTION =====

  /**
   * Obter fluxos ativos
   */
  @Get('active/list')
  async getActiveFlows(@Request() req: any) {
    const clientId = new Types.ObjectId(req.user.clientId);
    return await this.flowService.getActiveFlows(clientId);
  }

  /**
   * Obter fluxos agendados
   */
  @Get('scheduled/list')
  async getScheduledFlows(@Request() req: any) {
    const clientId = new Types.ObjectId(req.user.clientId);
    return await this.flowService.getScheduledFlows(clientId);
  }

  /**
   * Verificar se fluxo pode ser executado
   */
  @Get(':id/can-execute')
  async canExecuteFlow(@Param('id') id: string, @Request() req: any) {
    const clientId = new Types.ObjectId(req.user.clientId);
    const canExecute = await this.flowService.canExecuteFlow(id, clientId);
    return { canExecute };
  }

  // ===== STATISTICS =====

  /**
   * Obter estatísticas dos fluxos do cliente
   */
  @Get('statistics/summary')
  async getFlowStatistics(@Request() req: any) {
    const clientId = new Types.ObjectId(req.user.clientId);
    return await this.flowService.getClientFlowStatistics(clientId);
  }

  /**
   * Atualizar estatísticas de um fluxo
   */
  @Post(':id/statistics')
  async updateFlowStatistics(
    @Param('id') id: string,
    @Body() stats: {
      totalSent?: number;
      totalDelivered?: number;
      totalFailed?: number;
      lastSentAt?: Date;
    },
    @Request() req: any
  ) {
    const clientId = new Types.ObjectId(req.user.clientId);
    // Verificar se o fluxo pertence ao cliente
    await this.flowService.getFlowById(id, clientId);
    await this.flowService.updateFlowStatistics(id, stats);
    return { message: 'Estatísticas atualizadas com sucesso' };
  }

  // ===== VALIDATION ENDPOINTS =====

  /**
   * Validar dados de criação de fluxo
   */
  @Post('validate')
  async validateFlowData(@Body() flowData: any) {
    const errors = [];

    // Validar dados obrigatórios
    if (!flowData.name) {
      errors.push('Nome do fluxo é obrigatório');
    }

    if (!flowData.targetAudience) {
      errors.push('Audiência alvo é obrigatória');
    }

    if (!flowData.messages || !Array.isArray(flowData.messages) || flowData.messages.length === 0) {
      errors.push('Pelo menos uma mensagem deve ser configurada');
    } else {
      // Validar ordem das mensagens
      const orders = flowData.messages.map(m => m.order).sort((a, b) => a - b);
      for (let i = 0; i < orders.length; i++) {
        if (orders[i] !== i + 1) {
          errors.push('Ordem das mensagens deve ser sequencial (1, 2, 3...)');
          break;
        }
      }
    }

    if (errors.length > 0) {
      return {
        isValid: false,
        errors
      };
    }

    return {
      isValid: true,
      message: 'Dados do fluxo são válidos'
    };
  }
}
