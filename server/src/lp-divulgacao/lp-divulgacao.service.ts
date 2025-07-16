import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LPDivulgacao, LPDivulgacaoDocument } from './entities/lp-divulgacao.schema';
import { CreateLPDivulgacaoDto } from './dto/create-lp-divulgacao.dto';
import { UpdateLPDivulgacaoDto } from './dto/update-lp-divulgacao.dto';
import { Referral, ReferralDocument } from '../referrals/entities/referral.schema';
import { Participant } from '../clients/entities/participant.schema';
import { ReferralsService } from '../referrals/referrals.service';

@Injectable()
export class LPDivulgacaoService {
  private readonly logger = new Logger(LPDivulgacaoService.name);
  constructor(
    @InjectModel(LPDivulgacao.name) private lpDivulgacaoModel: Model<LPDivulgacaoDocument>,
    @InjectModel(Referral.name) private referralModel: Model<ReferralDocument>,
    @InjectModel(Participant.name) private participantModel: Model<Participant>,
    private readonly referralsService: ReferralsService,
  ) {}

  // === CRUD BÁSICO ===

  async create(createLPDivulgacaoDto: CreateLPDivulgacaoDto): Promise<LPDivulgacao> {
    try {
      // Verificar se slug já existe
      if (createLPDivulgacaoDto.slug) {
        const existingLP = await this.lpDivulgacaoModel.findOne({ 
          slug: createLPDivulgacaoDto.slug 
        });
        if (existingLP) {
          throw new ConflictException('Slug já está em uso');
        }
      }

      // Adicionar metadados automáticos e status default
      const lpData = {
        ...createLPDivulgacaoDto,
        status: createLPDivulgacaoDto.status || 'draft',
        metadata: {
          ...createLPDivulgacaoDto.metadata,
          lastModified: new Date(),
        },
        clientId: new Types.ObjectId(createLPDivulgacaoDto.clientId),
        campaignId: createLPDivulgacaoDto.campaignId ? 
          new Types.ObjectId(createLPDivulgacaoDto.campaignId) : undefined,
        createdBy: createLPDivulgacaoDto.createdBy ? 
          new Types.ObjectId(createLPDivulgacaoDto.createdBy) : undefined,
      };

      const createdLP = new this.lpDivulgacaoModel(lpData);
      return await createdLP.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('LP com este slug já existe');
      }
      throw error;
    }
  }

  async findAll(clientId?: string, status?: string, campaignId?: string): Promise<LPDivulgacao[]> {
    try {
      const filter: any = {};
      
      if (clientId) {
        // Buscar tanto por ObjectId quanto por string para compatibilidade
        if (Types.ObjectId.isValid(clientId)) {
          filter.$or = [
            { clientId: new Types.ObjectId(clientId) },
            { clientId: clientId }
          ];
        } else {
          filter.clientId = clientId;
        }
      }
      
      if (status) {
        filter.status = status;
      }
      
      if (campaignId && Types.ObjectId.isValid(campaignId)) {
        filter.campaignId = new Types.ObjectId(campaignId);
      }
      
      return await this.lpDivulgacaoModel
        .find(filter)
        .populate('clientId', 'name email')
        .populate('campaignId', 'name description')
        .sort({ createdAt: -1 })
        .exec();
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: string): Promise<LPDivulgacao> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID inválido');
    }

    const lp = await this.lpDivulgacaoModel
      .findById(id)
      .populate('clientId', 'name email')
      .populate('campaignId', 'name description')
      .exec();

    if (!lp) {
      throw new NotFoundException('LP de Divulgação não encontrada');
    }

    return lp;
  }

  async findBySlug(slug: string): Promise<LPDivulgacao> {
    const lp = await this.lpDivulgacaoModel
      .findOne({ slug, status: 'published' })
      .populate('clientId', 'name email')
      .populate('campaignId', 'name description')
      .exec();

    if (!lp) {
      throw new NotFoundException('LP não encontrada ou não publicada');
    }

    // Incrementar visualizações
    await this.incrementViews(lp._id.toString());

    return lp;
  }

  async update(id: string, updateLPDivulgacaoDto: UpdateLPDivulgacaoDto): Promise<LPDivulgacao> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID inválido');
    }

    // Verificar se LP está vinculada a uma campanha
    const currentLP = await this.lpDivulgacaoModel.findById(id);
    if (!currentLP) {
      throw new NotFoundException('LP de Divulgação não encontrada');
    }
    
    if (currentLP.campaignId && currentLP.campaignName) {
      throw new BadRequestException(
        `Esta LP está vinculada à campanha "${currentLP.campaignName}". ` +
        `Para editá-la, acesse através da gestão da campanha ou desvincule-a primeiro.`
      );
    }

    // Verificar se slug já existe (se fornecido)
    if (updateLPDivulgacaoDto.slug) {
      const existingLP = await this.lpDivulgacaoModel.findOne({ 
        slug: updateLPDivulgacaoDto.slug,
        _id: { $ne: id }
      });
      if (existingLP) {
        throw new ConflictException('Slug já está em uso');
      }
    }
    // Buscar status e clientId atuais se não vierem no DTO
    let status = updateLPDivulgacaoDto.status;
    let clientId: string | Types.ObjectId | undefined = updateLPDivulgacaoDto.clientId;
    if (!status || !clientId) {
      const current = await this.lpDivulgacaoModel.findById(id).select('status clientId');
      if (!status) status = current?.status || 'draft';
      if (!clientId) clientId = current?.clientId;
    }
    // Garantir que clientId seja string
    if (clientId && typeof clientId !== 'string' && typeof clientId.toString === 'function') {
      clientId = clientId.toString();
    }
    const updateData = {
      ...updateLPDivulgacaoDto,
      status,
      clientId,
      lastModifiedBy: updateLPDivulgacaoDto.lastModifiedBy ? 
        new Types.ObjectId(updateLPDivulgacaoDto.lastModifiedBy) : undefined,
    };
    const updatedLP = await this.lpDivulgacaoModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('clientId', 'name email')
      .populate('campaignId', 'name description')
      .exec();
    if (!updatedLP) {
      throw new NotFoundException('LP de Divulgação não encontrada');
    }
    return updatedLP;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID inválido');
    }

    const result = await this.lpDivulgacaoModel.findByIdAndDelete(id).exec();
    
    if (!result) {
      throw new NotFoundException('LP de Divulgação não encontrada');
    }
  }

  async toggleStatus(id: string): Promise<LPDivulgacao> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID inválido');
    }

    const lp = await this.lpDivulgacaoModel.findById(id).exec();
    if (!lp) {
      throw new NotFoundException('LP de Divulgação não encontrada');
    }

    // Alterna entre 'ativo' e 'inativo'
    const newStatus = lp.status === 'ativo' ? 'inativo' : 'ativo';
    
    const updated = await this.lpDivulgacaoModel.findByIdAndUpdate(
      id,
      { status: newStatus },
      { new: true }
    ).exec();
    
    if (!updated) {
      throw new NotFoundException('LP de Divulgação não encontrada');
    }
    
    return updated;
  }

  // === FUNCIONALIDADES ESPECÍFICAS ===

  async publish(id: string): Promise<LPDivulgacao | null> {
    const lp = await this.lpDivulgacaoModel.findById(id);
    
    if (!lp) {
      throw new NotFoundException('LP de Divulgação não encontrada');
    }
    
    return await this.lpDivulgacaoModel.findByIdAndUpdate(
      id,
      {
        status: 'published',
        publishedAt: new Date(),
        publishedUrl: `/lp/divulgacao/${lp.slug}`
      },
      { new: true }
    ).exec();
  }

  async unpublish(id: string): Promise<LPDivulgacao | null> {
    const lp = await this.lpDivulgacaoModel.findById(id);
    
    if (!lp) {
      throw new NotFoundException('LP de Divulgação não encontrada');
    }
    
    return await this.lpDivulgacaoModel.findByIdAndUpdate(
      id,
      {
        status: 'draft',
        $unset: { publishedAt: 1, publishedUrl: 1 }
      },
      { new: true }
    ).exec();
  }

  async duplicate(id: string, newName: string): Promise<LPDivulgacao> {
    const originalLP = await this.findOne(id);
    
    const duplicateData = {
      name: newName,
      slug: newName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: originalLP.description,
      status: 'draft',
      clientId: originalLP.clientId.toString(),
      campaignId: originalLP.campaignId?.toString(),
      grapesData: originalLP.grapesData,
      compiledOutput: originalLP.compiledOutput,
      metadata: {
        ...originalLP.metadata,
        lastModified: new Date(),
        version: '1.0'
      },
      metaTitle: originalLP.metaTitle,
      metaDescription: originalLP.metaDescription,
      metaKeywords: originalLP.metaKeywords,
      ogImage: originalLP.ogImage,
      productName: originalLP.productName,
      productPrice: originalLP.productPrice,
      productDescription: originalLP.productDescription,
      templateId: originalLP.templateId,
      parentLPId: id,
      isTemplate: false,
      funnelStage: originalLP.funnelStage,
      targetAudience: originalLP.targetAudience
    };

    return await this.create(duplicateData as CreateLPDivulgacaoDto);
  }

  async incrementViews(id: string): Promise<void> {
    await this.lpDivulgacaoModel.findByIdAndUpdate(
      id,
      { 
        $inc: { 'statistics.totalViews': 1 },
        $set: { 'statistics.lastViewAt': new Date() }
      }
    ).exec();
  }

  // === SUBMISSÃO DE FORMULÁRIO DE TESTE GRÁTIS ===

  async submitReferralForm(submitReferralFormDto: any): Promise<any> {
    try {
      // === 🔍 DIAGNOSIS H3: Logs detalhados do backend ===
      this.logger.log('[DIAGNOSIS-H3] 🚀 === INÍCIO submitReferralForm ===');
      this.logger.log('[DIAGNOSIS-H3] 📥 Payload recebido:', JSON.stringify(submitReferralFormDto, null, 2));
      this.logger.log('[DIAGNOSIS-H3] 🕐 Timestamp:', new Date().toISOString());
      this.logger.log('[DIAGNOSIS-H3] 🌍 Environment:', process.env.NODE_ENV);
      this.logger.log('[DIAGNOSIS-H3] 🔍 Variáveis críticas:', {
        MONGODB_URI: process.env.MONGODB_URI ? 'DEFINIDA' : 'AUSENTE',
        JWT_SECRET: process.env.JWT_SECRET ? 'DEFINIDA' : 'AUSENTE',
        CLIENT_URL: process.env.CLIENT_URL || 'AUSENTE',
        API_BASE_URL: process.env.API_BASE_URL || 'AUSENTE'
      });

      const {
        name,
        email,
        phone,
        lpId,
        indicatorCode
      } = submitReferralFormDto;

      this.logger.log('[DIAGNOSIS-H3] 📝 Dados extraídos do payload:');
      this.logger.log('[DIAGNOSIS-H3]   name:', name);
      this.logger.log('[DIAGNOSIS-H3]   email:', email);
      this.logger.log('[DIAGNOSIS-H3]   phone:', phone);
      this.logger.log('[DIAGNOSIS-H3]   lpId:', lpId);
      this.logger.log('[DIAGNOSIS-H3]   indicatorCode:', indicatorCode);

      // Validações básicas
      if (!name || !email || !phone || !lpId) {
        const missingFields = [];
        if (!name) missingFields.push('name');
        if (!email) missingFields.push('email');
        if (!phone) missingFields.push('phone');
        if (!lpId) missingFields.push('lpId');
        
        this.logger.error('[DIAGNOSIS-H3] ❌ Campos obrigatórios ausentes:', missingFields);
        throw new Error(`Dados obrigatórios ausentes: ${missingFields.join(', ')}`);
      }

      this.logger.log('[DIAGNOSIS-H3] ✅ Validação básica passou');

      // Buscar a LP de divulgação
      this.logger.log('[DIAGNOSIS-H3] 🔍 Buscando LP de divulgação no banco...');
      const lp = await this.lpDivulgacaoModel.findById(lpId)
        .populate('campaignId')
        .populate('clientId')
        .exec();

      if (!lp) {
        this.logger.error('[DIAGNOSIS-H3] ❌ LP de divulgação não encontrada:', lpId);
        throw new Error('LP de divulgação não encontrada');
      }

      this.logger.log('[DIAGNOSIS-H3] ✅ LP encontrada:', {
        id: lp._id,
        name: lp.name,
        campaignId: lp.campaignId?._id || lp.campaignId,
        clientId: lp.clientId?._id || lp.clientId
      });

      // Extrair IDs necessários
      const campaignId = lp.campaignId?._id?.toString() || lp.campaignId?.toString() || lp.campaignId;
      const clientId = lp.clientId?._id?.toString() || lp.clientId?.toString() || lp.clientId;

      this.logger.log('[DIAGNOSIS-H3] 🔗 IDs extraídos:', {
        campaignId,
        clientId
      });

      // Buscar indicador pelo código único (se fornecido)
      let indicadorId = null;
      let indicadorData = null;

      if (indicatorCode) {
        this.logger.log('[DIAGNOSIS-H3] 👤 Buscando indicador pelo código:', indicatorCode);
        indicadorData = await this.participantModel.findOne({
          uniqueReferralCode: indicatorCode,
          tipo: { $in: ['indicador', 'influenciador'] }
        });

        if (indicadorData) {
          indicadorId = (indicadorData as any)._id.toString();
          this.logger.log('[DIAGNOSIS-H3] ✅ Indicador encontrado:', {
            id: indicadorId,
            name: (indicadorData as any).name,
            email: (indicadorData as any).email,
            code: indicatorCode
          });
        } else {
          this.logger.warn('[DIAGNOSIS-H3] ⚠️ Indicador não encontrado para código:', indicatorCode);
        }
      } else {
        this.logger.log('[DIAGNOSIS-H3] ℹ️ Nenhum código de indicador fornecido');
      }

      // ✅ CORREÇÃO: Usar sistema unificado de criação de referrals
      this.logger.log('[DIAGNOSIS-H3] 🔄 Preparando dados para sistema unificado de referrals...');
      
      const referralData = {
        leadName: name,
        leadEmail: email,
        leadPhone: phone,
        campaignId: campaignId || null,
        campaignName: (lp.campaignId as any)?.name || 'LP Divulgacao',
        clientId: clientId,
        indicatorId: indicadorId || null,
        indicatorName: (indicadorData as any)?.name || null,
        indicatorReferralCode: indicatorCode || null,
        referralSource: 'landing-page',
        status: 'pendente',
        lpDivulgacaoId: lpId
      };

      this.logger.log('[DIAGNOSIS-H3] 📦 Dados do referral a serem enviados:', JSON.stringify(referralData, null, 2));

      // 🎯 USAR SISTEMA UNIFICADO que inclui logs H2/H3 e processamento automático de recompensas
      this.logger.log('[DIAGNOSIS-H3] 🚀 Chamando referralsService.createReferral...');
      
      try {
        const referralResult = await this.referralsService.createReferral(referralData);
        const savedReferral = referralResult.data;
        
        this.logger.log('[DIAGNOSIS-H3] ✅ Referral criado via sistema unificado:', {
          id: savedReferral._id,
          leadName: savedReferral.leadName,
          leadEmail: savedReferral.leadEmail,
          indicatorName: savedReferral.indicatorName,
          status: savedReferral.status
        });

        // Atualizar estatísticas da LP
        this.logger.log('[DIAGNOSIS-H3] 📊 Atualizando estatísticas da LP...');
        const updateResult = await this.lpDivulgacaoModel.findByIdAndUpdate(
          submitReferralFormDto.lpId,
          { 
            $inc: { 
              'statistics.totalSubmissions': 1
            },
            $set: { 'statistics.lastSubmissionAt': new Date() }
          }
        ).exec();
        
        this.logger.log('[DIAGNOSIS-H3] ✅ Estatísticas da LP atualizadas:', {
          lpId: submitReferralFormDto.lpId,
          updateApplied: !!updateResult
        });

        this.logger.log('[DIAGNOSIS-H3] 🎉 === SUCESSO TOTAL ===');
        
        return {
          success: true,
          message: 'Indicação enviada com sucesso',
          referralId: savedReferral._id,
          data: {
            leadName: savedReferral.leadName,
            leadEmail: savedReferral.leadEmail,
            indicatorName: (indicadorData as any)?.name || null,
            campaignName: (lp.campaignId as any)?.name || 'LP Divulgacao'
          }
        };
        
      } catch (referralError) {
        this.logger.error('[DIAGNOSIS-H3] ❌ Erro ao criar referral:', {
          message: referralError.message,
          stack: referralError.stack,
          referralData: JSON.stringify(referralData, null, 2)
        });
        throw new Error(`Erro ao processar referral: ${referralError.message}`);
      }

    } catch (error) {
      this.logger.error('[DIAGNOSIS-H3] 💥 ERRO GERAL em submitReferralForm:', {
        message: error.message,
        stack: error.stack,
        payload: JSON.stringify(submitReferralFormDto, null, 2)
      });
      throw error;
    }
  }

  // === ESTATÍSTICAS ===

  async getStatistics(id: string): Promise<any> {
    const lp = await this.findOne(id);
    
    // TODO: Buscar leads de teste grátis originados desta LP
    // Por enquanto, retornar estatísticas básicas da LP
    
    return {
      ...lp.statistics,
      // Adicionar estatísticas específicas de trial quando implementarmos o schema
      trialConversionRate: 0,
      activeTrials: 0,
      expiredTrials: 0,
      convertedTrials: 0
    };
  }

  // === TEMPLATES ===

  async getTemplates(): Promise<LPDivulgacao[]> {
    return await this.lpDivulgacaoModel
      .find({ isTemplate: true })
      .select('name description metadata.blocksUsed previewUrl productName funnelStage')
      .exec();
  }

  async createFromTemplate(templateId: string, createDto: Partial<CreateLPDivulgacaoDto>): Promise<LPDivulgacao> {
    const template = await this.findOne(templateId);
    
    if (!template.isTemplate) {
      throw new BadRequestException('LP especificada não é um template');
    }

    const newLPData = {
      name: createDto.name || `${template.name} - Cópia`,
      slug: createDto.slug || `${template.slug}-copy`,
      description: createDto.description || template.description,
      status: 'draft',
      clientId: createDto.clientId || template.clientId.toString(),
      campaignId: createDto.campaignId,
      grapesData: template.grapesData,
      compiledOutput: template.compiledOutput,
      metadata: {
        ...template.metadata,
        lastModified: new Date(),
        version: '1.0'
      },
      metaTitle: template.metaTitle,
      metaDescription: template.metaDescription,
      metaKeywords: template.metaKeywords,
      ogImage: template.ogImage,
      productName: template.productName,
      productPrice: template.productPrice,
      productDescription: template.productDescription,
      templateId: templateId,
      isTemplate: false,
      funnelStage: template.funnelStage,
      targetAudience: template.targetAudience
    };

    return await this.create(newLPData as CreateLPDivulgacaoDto);
  }

  async trackRedirect(id: string, body: any): Promise<void> {
    this.logger.log(`[TRACK] Redirecionamento registrado para LP ${id}: ${JSON.stringify(body)}`);
    // Futuro: persistir evento em coleção própria ou analytics
  }

  // === SISTEMA DE RECOMPENSAS ===

  /**
   * Processa recompensa automática para um referral específico
   */
  private async processReferralRewardDirect(referralId: string, campaignId: string, indicadorId: string): Promise<void> {
    this.logger.log(`[REWARDS] Processando recompensa - Referral: ${referralId}, Indicador: ${indicadorId}`);
    
    try {
      // 🔧 CORREÇÃO: Usar modelo injetado em vez de mongoose.model()
      const indicator = await this.participantModel.findById(indicadorId);
      if (!indicator || !indicator.assignedRewards || indicator.assignedRewards.length === 0) {
        this.logger.log('[REWARDS] Indicador sem recompensas atribuídas');
        return;
      }

      // 🔧 CORREÇÃO: Usar import direto do mongoose para Reward (temporário)
      const mongoose = await import('mongoose');
      const RewardModel = mongoose.model('Reward');
      const referralRewards = await RewardModel.find({
        _id: { $in: indicator.assignedRewards },
        trigger: 'referral'
      });

      if (referralRewards.length === 0) {
        this.logger.log('[REWARDS] Nenhuma recompensa por indicação encontrada');
        return;
      }

      // Usar a primeira recompensa encontrada
      const reward = referralRewards[0];
      
      // Atualizar o referral com a informação da recompensa
      await this.referralModel.findByIdAndUpdate(referralId, {
        rewardId: reward._id,
        rewardValue: reward.value,
        rewardStatus: 'pending'
      });

      this.logger.log(`[REWARDS] ✅ Recompensa de ${reward.type} R$ ${reward.value} atribuída ao referral`);

    } catch (error) {
      this.logger.error('[REWARDS] ❌ Erro no processamento direto da recompensa:', error.message);
      throw error;
    }
  }
} 