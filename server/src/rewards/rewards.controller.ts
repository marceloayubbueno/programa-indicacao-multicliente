import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Logger, UseGuards, Request } from '@nestjs/common';
import { RewardsService } from './rewards.service';
import { CreateRewardDto } from './dto/create-reward.dto';
import { UpdateRewardDto } from './dto/update-reward.dto';
import { JwtClientAuthGuard } from '../auth/guards/jwt-client-auth.guard';

@Controller('rewards')
@UseGuards(JwtClientAuthGuard)
export class RewardsController {
  private readonly logger = new Logger(RewardsController.name);

  constructor(private readonly rewardsService: RewardsService) {}

  @Post()
  create(@Request() req, @Body() createRewardDto: CreateRewardDto) {
    const clientId = req.user?.clientId || req.user?.sub;
    createRewardDto.clientId = clientId;
    return this.rewardsService.create(createRewardDto);
  }

  @Get()
  async findAll(@Request() req, @Query('campaign') campaign?: string) {
    const clientId = req.user?.clientId || req.user?.sub;
    this.logger.debug(`[GET /rewards] Buscando recompensas - campaign: ${campaign}, clientId: ${clientId}`);
    
    try {
      let result;
      if (campaign) {
        result = await this.rewardsService.findByCampaign(campaign);
      } else {
        // SEMPRE filtrar por clientId do token JWT
        result = await this.rewardsService.findByClient(clientId);
      }
      
      this.logger.debug(`[GET /rewards] ${result.length} recompensas encontradas para cliente ${clientId}`);
      return {
        success: true,
        data: result,
        message: 'Recompensas listadas com sucesso'
      };
    } catch (error) {
      this.logger.error(`[GET /rewards] Erro ao buscar recompensas: ${error.message}`);
      throw error;
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const clientId = req.user?.clientId || req.user?.sub;
    // Buscar apenas se pertencer ao cliente
    const reward = await this.rewardsService.findOne(id);
    if (reward.clientId.toString() !== clientId) {
      throw new Error('Acesso negado: recompensa não pertence ao cliente');
    }
    return reward;
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateRewardDto: UpdateRewardDto, @Request() req) {
    const clientId = req.user?.clientId || req.user?.sub;
    // Verificar se pertence ao cliente antes de atualizar
    const existing = await this.rewardsService.findOne(id);
    if (existing.clientId.toString() !== clientId) {
      throw new Error('Acesso negado: recompensa não pertence ao cliente');
    }
    return this.rewardsService.update(id, updateRewardDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    const clientId = req.user?.clientId || req.user?.sub;
    // Verificar se pertence ao cliente antes de deletar
    const existing = await this.rewardsService.findOne(id);
    if (existing.clientId.toString() !== clientId) {
      throw new Error('Acesso negado: recompensa não pertence ao cliente');
    }
    return this.rewardsService.remove(id);
  }

  @Get(':id/campaigns')
  async findCampaignsUsingReward(@Param('id') id: string, @Request() req) {
    const clientId = req.user?.clientId || req.user?.sub;
    this.logger.debug(`[GET /rewards/:id/campaigns] Buscando campanhas para rewardId: ${id}, clientId: ${clientId}`);
    
    try {
      // Verificar se a recompensa pertence ao cliente
      const reward = await this.rewardsService.findOne(id);
      this.logger.debug(`[GET /rewards/:id/campaigns] Recompensa encontrada: ${reward._id}, clientId da recompensa: ${reward.clientId}`);
      
      if (reward.clientId.toString() !== clientId) {
        this.logger.error(`[GET /rewards/:id/campaigns] Acesso negado: recompensa ${id} pertence ao cliente ${reward.clientId}, mas requisição é do cliente ${clientId}`);
        throw new Error('Acesso negado: recompensa não pertence ao cliente');
      }
      
      const campaigns = await this.rewardsService.findCampaignsUsingReward(id, clientId);
      this.logger.debug(`[GET /rewards/:id/campaigns] ${campaigns.length} campanhas encontradas para recompensa ${id}`);
      
      return {
        success: true,
        data: campaigns,
        message: 'Campanhas encontradas com sucesso'
      };
    } catch (error) {
      this.logger.error(`[GET /rewards/:id/campaigns] Erro ao buscar campanhas: ${error.message}`);
      throw error;
    }
  }
} 