import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Reward, RewardDocument } from './entities/reward.schema';
import { CreateRewardDto } from './dto/create-reward.dto';
import { UpdateRewardDto } from './dto/update-reward.dto';

@Injectable()
export class RewardsService {
  private readonly logger = new Logger(RewardsService.name);

  constructor(
    @InjectModel(Reward.name) private rewardModel: Model<RewardDocument>,
  ) {}

  async create(createRewardDto: CreateRewardDto): Promise<Reward> {
    const data = {
      ...createRewardDto,
      clientId: new Types.ObjectId(createRewardDto.clientId)
    };
    const created = new this.rewardModel(data);
    return created.save();
  }

  async findAll(): Promise<Reward[]> {
    return this.rewardModel.find().exec();
  }

  async findByCampaign(campaignId: string): Promise<Reward[]> {
    return this.rewardModel.find({ campaign: campaignId }).exec();
  }

  async findOne(id: string): Promise<Reward> {
    const reward = await this.rewardModel.findById(id).exec();
    if (!reward) throw new NotFoundException('Reward not found');
    return reward;
  }

  async update(id: string, updateRewardDto: UpdateRewardDto): Promise<Reward> {
    const reward = await this.rewardModel.findByIdAndUpdate(id, updateRewardDto, { new: true }).exec();
    if (!reward) throw new NotFoundException('Reward not found');
    return reward;
  }

  async remove(id: string): Promise<void> {
    const result = await this.rewardModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Reward not found');
  }

  async findByClient(clientId: string): Promise<Reward[]> {
    this.logger.debug(`[findByClient] Buscando recompensas para clientId: ${clientId}`);
    try {
      const rewards = await this.rewardModel.find({ clientId: new Types.ObjectId(clientId) }).exec();
      this.logger.debug(`[findByClient] Recompensas encontradas: ${JSON.stringify(rewards)}`);
      return rewards;
    } catch (error) {
      this.logger.error(`[findByClient] Erro ao buscar recompensas: ${error.message}`);
      throw error;
    }
  }

  /**
   * Duplica recompensas-modelo para uma nova campanha, preenchendo campaignId e campaignName
   * @param templateRewards Array de recompensas-modelo (RewardDocument)
   * @param campaignId ID da nova campanha
   * @param campaignName Nome da nova campanha
   * @param clientId ID do cliente
   */
  async duplicateRewardsForCampaign(templateRewards: RewardDocument[], campaignId: string, campaignName: string, clientId: string): Promise<Reward[]> {
    const duplicated: Reward[] = [];
    for (const template of templateRewards) {
      const data = {
        ...template.toObject(),
        _id: undefined, // Garante novo ID
        campaignId: new Types.ObjectId(campaignId),
        campaignName,
        clientId: new Types.ObjectId(clientId),
        status: template.status || 'pendente',
        history: [],
        indicator: undefined,
        paymentDate: undefined,
        paymentGatewayId: undefined,
      };
      const created = new this.rewardModel(data);
      duplicated.push(await created.save());
    }
    return duplicated;
  }
} 