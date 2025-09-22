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
    const clientId = new Types.ObjectId(req.user.clientId);
    return await this.manualTriggerService.triggerFlowManually(flowId, clientId, body);
  }
}
