import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Participant } from '../clients/entities/participant.schema';
import { Referral } from '../referrals/entities/referral.schema';
import { Campaign } from '../campaigns/entities/campaign.schema';

@Injectable()
export class IndicatorAuthService {
  private readonly logger = new Logger(IndicatorAuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(Participant.name) private readonly participantModel: Model<Participant>,
    @InjectModel(Referral.name) private readonly referralModel: Model<Referral>,
    @InjectModel(Campaign.name) private readonly campaignModel: Model<Campaign>,
  ) {}

  /**
   * Autentica um indicador usando email, senha (plainPassword) e/ou código de referral
   */
  async login(email: string, password?: string, referralCode?: string): Promise<any> {
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

      // Se password foi fornecido, validar
      if (password) {
        if (!indicator.plainPassword || indicator.plainPassword !== password) {
          return {
            success: false,
            message: 'Senha inválida'
          };
        }
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
        createdAt: indicator.createdAt,
        pixKey: indicator.pixKey || null
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

      // 🚀 CORREÇÃO: Buscar campanha diretamente associada ao indicador
      let campaigns: any[] = [];
      
      this.logger.log(`🔍 [DASHBOARD] Buscando campanha para indicador: ${indicatorId}`);
      this.logger.log(`🔍 [DASHBOARD] Indicador nome: ${indicator.name}`);
      this.logger.log(`🔍 [DASHBOARD] Indicador email: ${indicator.email}`);
      this.logger.log(`🔍 [DASHBOARD] Indicador clientId: ${indicator.clientId}`);
      this.logger.log(`🔍 [DASHBOARD] Indicador tipo: ${indicator.tipo}`);
      this.logger.log(`🔍 [DASHBOARD] Indicador uniqueReferralCode: ${indicator.uniqueReferralCode}`);
      
      // ✅ CORREÇÃO: Buscar campanha diretamente associada ao indicador atual
      if (indicator.campaignId) {
        this.logger.log(`🔍 [DASHBOARD] Indicador tem campaignId: ${indicator.campaignId}`);
        
        try {
          const campaign = await this.campaignModel.findById(indicator.campaignId)
            .populate('rewardOnReferral', 'type value description')
            .populate('rewardOnConversion', 'type value description');
          
          if (campaign) {
            this.logger.log(`✅ [DASHBOARD] Campanha encontrada: ${campaign.name}`);
            
            // Buscar recompensas
            let referralReward: any = null;
            let conversionReward: any = null;
            
            if (campaign.rewardOnReferral) {
              try {
                const reward = await this.campaignModel.db.model('Reward').findById(campaign.rewardOnReferral);
                if (reward) {
                  referralReward = {
                    type: reward.type,
                    value: reward.value,
                    description: reward.description
                  };
                  this.logger.log(`✅ [DASHBOARD] Recompensa por indicação: R$ ${reward.value}`);
                }
              } catch (error) {
                this.logger.error(`❌ [DASHBOARD] Erro ao buscar recompensa por indicação: ${error.message}`);
              }
            }
            
            if (campaign.rewardOnConversion) {
              try {
                const reward = await this.campaignModel.db.model('Reward').findById(campaign.rewardOnConversion);
                if (reward) {
                  conversionReward = {
                    type: reward.type,
                    value: reward.value,
                    description: reward.description
                  };
                  this.logger.log(`✅ [DASHBOARD] Recompensa por conversão: R$ ${reward.value}`);
                }
              } catch (error) {
                this.logger.error(`❌ [DASHBOARD] Erro ao buscar recompensa por conversão: ${error.message}`);
              }
            }
            
            campaigns.push({
              id: campaign._id,
              name: campaign.name,
              status: campaign.status,
              referralReward,
              conversionReward,
              referralLink: `/indicacao/${indicator.uniqueReferralCode}`,
              isCurrentIndicator: true
            });
            
            this.logger.log(`✅ [DASHBOARD] Campanha adicionada: ${campaign.name} (Link: ${indicator.uniqueReferralCode})`);
          } else {
            this.logger.warn(`⚠️ [DASHBOARD] Campanha não encontrada: ${indicator.campaignId}`);
          }
        } catch (error) {
          this.logger.error(`❌ [DASHBOARD] Erro ao processar campanha ${indicator.campaignId}: ${error.message}`);
        }
      } else {
        this.logger.log(`❌ [DASHBOARD] Indicador não tem campaignId associado`);
      }
      
      this.logger.log(`🔍 [DASHBOARD] Total de campanhas processadas: ${campaigns.length}`);

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
        campaigns, // 🚀 CORRIGIDO: Campanhas com recompensas usando padrão correto
        quickActions: [
          {
            title: 'Compartilhar Link',
            description: 'Copie seu link exclusivo de indicação',
            action: 'copy_link',
            link: `/indicacao/${indicator.uniqueReferralCode}`
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

  /**
   * Atualiza a chave Pix do indicador autenticado
   */
  async updatePixKey(indicatorId: string, pixKey: string): Promise<{ pixKey: string | null }> {
    // Validação básica (reutiliza a lógica do schema)
    if (pixKey) {
      // Regex para e-mail
      const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
      // Regex para CPF (apenas números, 11 dígitos)
      const cpfRegex = /^\d{11}$/;
      // Regex para celular (apenas números, 11 dígitos, ex: 11999999999)
      const phoneRegex = /^\d{11}$/;
      // Regex para chave aleatória Pix (32 caracteres, letras e números)
      const randomKeyRegex = /^[a-zA-Z0-9]{32}$/;
      if (!(
        emailRegex.test(pixKey) ||
        cpfRegex.test(pixKey) ||
        phoneRegex.test(pixKey) ||
        randomKeyRegex.test(pixKey)
      )) {
        throw new Error('Chave Pix inválida. Use um e-mail, CPF, celular (apenas números) ou chave aleatória Pix.');
      }
    }
    const updated = await this.participantModel.findByIdAndUpdate(
      indicatorId,
      { pixKey: pixKey || null, updatedAt: new Date() },
      { new: true }
    );
    if (!updated) {
      throw new Error('Indicador não encontrado');
    }
    return { pixKey: updated.pixKey || null };
  }
} 