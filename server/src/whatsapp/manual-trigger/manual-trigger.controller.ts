import { Controller, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { Types } from 'mongoose';
import { ManualTriggerService } from './manual-trigger.service';
import { JwtClientAuthGuard } from '../../auth/guards/jwt-client-auth.guard';

@Controller('whatsapp/manual-trigger')
@UseGuards(JwtClientAuthGuard)
export class ManualTriggerController {
  constructor(private readonly manualTriggerService: ManualTriggerService) {}

  /**
   * Disparar fluxo manualmente - CÓPIA EXATA DA LÓGICA QUE FUNCIONA
   */
  @Post(':flowId/execute')
  async executeManualTrigger(
    @Param('flowId') flowId: string,
    @Body() body: {
      manualTrigger?: boolean;
      targetAudience?: string;
      campaignId?: string;
    },
    @Request() req: any
  ) {
    // 🔍 DEBUG TEMPORÁRIO - Logs no controller
    console.log('🔍 [DEBUG-CONTROLLER] Endpoint chamado');
    console.log('🔍 [DEBUG-CONTROLLER] Parâmetros:', {
      flowId,
      body,
      clientId: req.user.clientId
    });
    
    const clientId = new Types.ObjectId(req.user.clientId);
    
    console.log('🔍 [DEBUG-CONTROLLER] ClientId convertido:', clientId.toString());
    console.log('🔍 [DEBUG-CONTROLLER] Chamando manualTriggerService...');
    
    const result = await this.manualTriggerService.triggerFlowManually(flowId, clientId, body);
    
    console.log('🔍 [DEBUG-CONTROLLER] Resultado:', result);
    
    return result;
  }
}
