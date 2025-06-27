import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Logger } from '@nestjs/common';
import { RewardsService } from './rewards.service';
import { CreateRewardDto } from './dto/create-reward.dto';
import { UpdateRewardDto } from './dto/update-reward.dto';

@Controller('rewards')
export class RewardsController {
  private readonly logger = new Logger(RewardsController.name);

  constructor(private readonly rewardsService: RewardsService) {}

  @Post()
  create(@Body() createRewardDto: CreateRewardDto) {
    return this.rewardsService.create(createRewardDto);
  }

  @Get()
  async findAll(@Query('campaign') campaign?: string, @Query('clientId') clientId?: string) {
    this.logger.debug(`[GET /rewards] Buscando recompensas - campaign: ${campaign}, clientId: ${clientId}`);
    try {
      let result;
      if (campaign) {
        result = await this.rewardsService.findByCampaign(campaign);
      } else if (clientId) {
        result = await this.rewardsService.findByClient(clientId);
      } else {
        result = await this.rewardsService.findAll();
      }
      this.logger.debug(`[GET /rewards] Recompensas encontradas: ${JSON.stringify(result)}`);
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
  findOne(@Param('id') id: string) {
    return this.rewardsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRewardDto: UpdateRewardDto) {
    return this.rewardsService.update(id, updateRewardDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rewardsService.remove(id);
  }
} 