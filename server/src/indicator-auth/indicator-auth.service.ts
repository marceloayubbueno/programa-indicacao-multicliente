import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Participant } from '../clients/entities/participant.schema';
import { Referral } from '../referrals/entities/referral.schema';

@Injectable()
export class IndicatorAuthService {
  private readonly logger = new Logger(IndicatorAuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(Participant.name) private readonly participantModel: Model<Participant>,
    @InjectModel(Referral.name) private readonly referralModel: Model<Referral>,
  ) {}

  /**
   * Autentica um indicador usando email e/ou código de referral
   */
  async login(email: string, referralCode?: string): Promise<any> {
    this.logger.log(`Tentativa de login: ${email}, código: ${referralCode || 'N/A'}`);
    
    try {
      // Buscar indicador por email e/ou código
      let indicator: any = null;
      
      if (referralCode) {
        // Buscar primeiro por código de referral
        indicator = await this.participantModel.findOne({
          uniqueReferralCode: referralCode,
          tipo: { $in: ['indicador', 'influenciador'] },
          status: 'ativo'
        });
        
        // Se encontrou por código, verificar se o email bate
        if (indicator && indicator.email.toLowerCase() !== email.toLowerCase()) {
          return {
            success: false,
            message: 'Email não corresponde ao código de indicação fornecido'
          };
        }
      } else {
        // Buscar apenas por email
        indicator = await this.participantModel.findOne({
          email: email.toLowerCase(),
          tipo: { $in: ['indicador', 'influenciador'] },
          status: 'ativo'
        });
      }

      if (!indicator) {
        return {
          success: false,
          message: 'Indicador não encontrado ou inativo'
        };
      }

      if (!indicator.canIndicate) {
        return {
          success: false,
          message: 'Indicador não autorizado a fazer indicações'
        };
      }

      // Gerar token JWT específico para indicadores
      const payload = {
        sub: indicator._id.toString(),
        email: indicator.email,
        type: 'indicator',
        referralCode: indicator.uniqueReferralCode
      };

      const token = this.jwtService.sign(payload);

      // Atualizar último acesso
      await this.participantModel.findByIdAndUpdate(indicator._id, {
        lastIndicacaoAt: new Date(),
        updatedAt: new Date()
      });

      return {
        success: true,
        message: 'Login realizado com sucesso',
        token,
        indicator: {
          id: indicator._id,
          name: indicator.name,
          email: indicator.email,
          referralCode: indicator.uniqueReferralCode,
          referralLink: `/indicacao/${indicator.uniqueReferralCode}`,
          campaignName: indicator.campaignName || 'N/A'
        }
      };

    } catch (error) {
      this.logger.error(`Erro no login: ${error.message}`);
      return {
        success: false,
        message: 'Erro interno do servidor'
      };
    }
  }

  /**
   * Busca perfil do indicador autenticado
   */
  async getProfile(indicatorId: string): Promise<any> {
    try {
      const indicator = await this.participantModel.findById(indicatorId)
        .populate('clientId', 'name')
        .populate('campaignId', 'name');

      if (!indicator) {
        throw new Error('Indicador não encontrado');
      }

      return {
        id: indicator._id,
        name: indicator.name,
        email: indicator.email,
        phone: indicator.phone,
        company: indicator.company || 'N/A',
        referralCode: indicator.uniqueReferralCode,
        referralLink: `/indicacao/${indicator.uniqueReferralCode}`,
        totalIndicacoes: indicator.totalIndicacoes || 0,
        indicacoesAprovadas: indicator.indicacoesAprovadas || 0,
        recompensasRecebidas: indicator.recompensasRecebidas || 0,
        campaignName: indicator.campaignName || 'N/A',
        clientName: (indicator.clientId as any)?.name || 'N/A',
        status: indicator.status,
        canIndicate: indicator.canIndicate,
        lastIndicacaoAt: indicator.lastIndicacaoAt,
        createdAt: indicator.createdAt
      };
    } catch (error) {
      this.logger.error(`Erro ao buscar perfil: ${error.message}`);
      throw error;
    }
  }

  /**
   * Carrega dados do dashboard do indicador
   */
  async getDashboard(indicatorId: string): Promise<any> {
    try {
      const indicator = await this.getProfile(indicatorId);
      
      // Buscar indicações recentes
      const recentReferrals = await this.referralModel.find({
        indicatorId: indicatorId
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('leadName leadEmail status rewardValue createdAt');

      // Calcular estatísticas
      const totalReferrals = await this.referralModel.countDocuments({
        indicatorId: indicatorId
      });

      const approvedReferrals = await this.referralModel.countDocuments({
        indicatorId: indicatorId,
        status: 'aprovada'
      });

      const pendingReferrals = await this.referralModel.countDocuments({
        indicatorId: indicatorId,
        status: 'pendente'
      });

      // Calcular recompensas
      const rewardStats = await this.referralModel.aggregate([
        { $match: { indicatorId: indicatorId } },
        {
          $group: {
            _id: '$rewardStatus',
            total: { $sum: 1 },
            totalValue: { $sum: '$rewardValue' }
          }
        }
      ]);

      let pendingRewards = 0;
      let paidRewards = 0;

      rewardStats.forEach(stat => {
        if (stat._id === 'pending') pendingRewards = stat.totalValue || 0;
        if (stat._id === 'paid') paidRewards = stat.totalValue || 0;
      });

      return {
        indicator,
        stats: {
          totalReferrals,
          approvedReferrals,
          pendingReferrals,
          pendingRewards,
          paidRewards,
          conversionRate: totalReferrals > 0 ? ((approvedReferrals / totalReferrals) * 100).toFixed(1) : '0'
        },
        recentReferrals: recentReferrals.map((ref: any) => ({
          id: ref._id,
          leadName: ref.leadName,
          leadEmail: ref.leadEmail,
          status: ref.status,
          rewardValue: ref.rewardValue || 0,
          createdAt: ref.createdAt
        })),
        quickActions: [
          {
            title: 'Compartilhar Link',
            description: 'Copie seu link exclusivo de indicação',
            action: 'copy_link',
            link: `/indicacao/${indicator.referralCode}`
          },
          {
            title: 'Ver Indicações',
            description: 'Acompanhe todas as suas indicações',
            action: 'view_referrals',
            link: '/indicator/referrals'
          },
          {
            title: 'Recompensas',
            description: 'Veja suas recompensas ganhas',
            action: 'view_rewards',
            link: '/indicator/rewards'
          }
        ]
      };
    } catch (error) {
      this.logger.error(`Erro ao carregar dashboard: ${error.message}`);
      throw error;
    }
  }

  /**
   * Lista todas as indicações do indicador
   */
  async getReferrals(indicatorId: string): Promise<any> {
    try {
      const referrals = await this.referralModel.find({
        indicatorId: indicatorId
      })
      .populate('campaignId', 'name')
      .sort({ createdAt: -1 });

      return {
        total: referrals.length,
        referrals: referrals.map((ref: any) => ({
          id: ref._id,
          leadName: ref.leadName,
          leadEmail: ref.leadEmail,
          leadPhone: ref.leadPhone,
          status: ref.status,
          rewardStatus: ref.rewardStatus,
          rewardValue: ref.rewardValue || 0,
          campaignName: (ref.campaignId as any)?.name || 'N/A',
          source: ref.referralSource || 'link',
          createdAt: ref.createdAt,
          convertedAt: ref.convertedAt,
          notes: ref.conversionNotes
        }))
      };
    } catch (error) {
      this.logger.error(`Erro ao listar indicações: ${error.message}`);
      throw error;
    }
  }

  /**
   * Busca recompensas do indicador
   */
  async getRewards(indicatorId: string): Promise<any> {
    try {
      const rewardsData = await this.referralModel.find({
        indicatorId: indicatorId,
        rewardValue: { $gt: 0 }
      })
      .populate('campaignId', 'name')
      .sort({ createdAt: -1 });

      // Agrupar por status
      const pending = rewardsData.filter(r => r.rewardStatus === 'pending');
      const paid = rewardsData.filter(r => r.rewardStatus === 'paid');
      const cancelled = rewardsData.filter(r => r.rewardStatus === 'cancelled');

      const totalPending = pending.reduce((sum, r) => sum + (r.rewardValue || 0), 0);
      const totalPaid = paid.reduce((sum, r) => sum + (r.rewardValue || 0), 0);

      return {
        summary: {
          totalPending,
          totalPaid,
          pendingCount: pending.length,
          paidCount: paid.length,
          cancelledCount: cancelled.length
        },
        rewards: rewardsData.map((reward: any) => ({
          id: reward._id,
          leadName: reward.leadName,
          leadEmail: reward.leadEmail,
          value: reward.rewardValue || 0,
          status: reward.rewardStatus,
          type: 'referral', // Por enquanto sempre referral
          campaignName: (reward.campaignId as any)?.name || 'N/A',
          earnedAt: reward.createdAt,
          paidAt: reward.paidAt,
          paymentMethod: reward.paymentMethod,
          notes: reward.paymentNotes
        }))
      };
    } catch (error) {
      this.logger.error(`Erro ao buscar recompensas: ${error.message}`);
      throw error;
    }
  }
} 