import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { LPIndicadores, LPIndicadoresDocument } from './entities/lp-indicadores.schema';
import { Participant } from '../clients/entities/participant.schema';
import { CreateLPIndicadoresDto } from './dto/create-lp-indicadores.dto';
import { UpdateLPIndicadoresDto } from './dto/update-lp-indicadores.dto';
import { SubmitFormLPIndicadoresDto } from './dto/submit-form-lp-indicadores.dto';
import { Document } from 'mongoose';

export type ParticipantDocument = Participant & Document;

@Injectable()
export class LPIndicadoresService {
  constructor(
    @InjectModel(LPIndicadores.name) private lpIndicadoresModel: Model<LPIndicadoresDocument>,
    @InjectModel(Participant.name) private participantModel: Model<ParticipantDocument>,
  ) {}

  // === CRUD BÁSICO ===

  async create(createLPIndicadoresDto: CreateLPIndicadoresDto): Promise<LPIndicadores> {
    try {
      console.log('[LPIndicadoresService][create] payload:', createLPIndicadoresDto);
      // Verificar se slug já existe
      if (createLPIndicadoresDto.slug) {
        console.log('[LPIndicadoresService][create] Verificando slug duplicado:', createLPIndicadoresDto.slug);
        const existingLP = await this.lpIndicadoresModel.findOne({ 
          slug: createLPIndicadoresDto.slug 
        });
        console.log('[LPIndicadoresService][create] Resultado da busca por slug duplicado:', existingLP);
        if (existingLP) {
          console.warn('[LPIndicadoresService][create] Conflito: Slug já está em uso por outra LP:', existingLP._id);
          throw new ConflictException('Slug já está em uso');
        }
      }

      // Pós-processamento: garantir classe no <form>
      if (createLPIndicadoresDto.compiledOutput && createLPIndicadoresDto.compiledOutput.html) {
        createLPIndicadoresDto.compiledOutput.html = createLPIndicadoresDto.compiledOutput.html.replace(/<form(?![^>]*lp-indicador-form)/g, '<form class="lp-indicador-form"');
        // Pós-processamento: garantir elemento de feedback no <form>
        createLPIndicadoresDto.compiledOutput.html = createLPIndicadoresDto.compiledOutput.html.replace(
          /(<form[^>]*>[\s\S]*?)(<\/form>)/g,
          (match, start, end) => {
            return /lp-indicador-feedback/.test(match)
              ? match
              : `${start}<div class=\"lp-indicador-feedback\" style=\"margin-top:8px;font-size:0.95em;\"></div>${end}`;
          }
        );
        // Pós-processamento: garantir name="name"
        createLPIndicadoresDto.compiledOutput.html = createLPIndicadoresDto.compiledOutput.html
          .replace(/<input([^>]+type=['"]text['"][^>]*)name=['"][^'"]*['"]/gi, '<input$1name="name"')
          .replace(/<input([^>]+type=['"]text['"])(?![^>]*name=['"]name['"])/gi, '<input$1 name="name"');
        // Pós-processamento: garantir name="email" e name="phone"
        createLPIndicadoresDto.compiledOutput.html = createLPIndicadoresDto.compiledOutput.html
          .replace(/<input([^>]+type=['"]email['"][^>]*)name=['"][^'"]*['"]/gi, '<input$1name="email"')
          .replace(/<input([^>]+type=['"]email['"])(?![^>]*name=['"]email['"])/gi, '<input$1 name="email"')
          .replace(/<input([^>]+type=['"]tel['"][^>]*)name=['"][^'"]*['"]/gi, '<input$1name="phone"')
          .replace(/<input([^>]+type=['"]tel['"])(?![^>]*name=['"]phone['"])/gi, '<input$1 name="phone"');
      }

      // Adicionar metadados automáticos
      const lpData = {
        ...createLPIndicadoresDto,
        metadata: {
          ...createLPIndicadoresDto.metadata,
          lastModified: new Date(),
        },
        clientId: new Types.ObjectId(createLPIndicadoresDto.clientId),
        campaignId: createLPIndicadoresDto.campaignId ? 
          new Types.ObjectId(createLPIndicadoresDto.campaignId) : undefined,
        createdBy: createLPIndicadoresDto.createdBy ? 
          new Types.ObjectId(createLPIndicadoresDto.createdBy) : undefined,
      };

      const createdLP = new this.lpIndicadoresModel(lpData);
      return await createdLP.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('LP com este slug já existe');
      }
      throw error;
    }
  }

  async findAll(clientId?: string, status?: string, campaignId?: string): Promise<any[]> {
    const filter: any = {};
    
    if (clientId) {
      try {
        filter.$or = [
          { clientId: new Types.ObjectId(clientId) },
          { clientId: clientId }
        ];
      } catch (e) {
        filter.clientId = clientId;
      }
      console.log('[LPIndicadoresService][findAll] Filtro clientId:', filter.$or || filter.clientId);
    }
    if (status) filter.status = status;
    if (campaignId) filter.campaignId = new Types.ObjectId(campaignId);

    const lps = await this.lpIndicadoresModel
      .find(filter)
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return lps.map(lp => ({
      ...lp,
      clientId: lp.clientId?.toString()
    }));
  }

  async findOne(id: string): Promise<LPIndicadores> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID inválido');
    }

    const lp = await this.lpIndicadoresModel
      .findById(id)
      .populate('clientId', 'name email')
      .populate('campaignId', 'name description')
      .exec();

    if (!lp) {
      throw new NotFoundException('LP de Indicadores não encontrada');
    }

    return lp;
  }

  async findBySlug(slug: string): Promise<LPIndicadores> {
    const lp = await this.lpIndicadoresModel
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

  async update(id: string, updateLPIndicadoresDto: UpdateLPIndicadoresDto): Promise<LPIndicadores> {
    console.log('[LPIndicadoresService][update] id:', id, 'payload:', updateLPIndicadoresDto);
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID inválido');
    }

    // Verificar se LP está vinculada a uma campanha
    const currentLP = await this.lpIndicadoresModel.findById(id);
    if (!currentLP) {
      throw new NotFoundException('LP de Indicadores não encontrada');
    }
    
    if (currentLP.campaignId && currentLP.campaignName) {
      throw new BadRequestException(
        `Esta LP está vinculada à campanha "${currentLP.campaignName}". ` +
        `Para editá-la, acesse através da gestão da campanha ou desvincule-a primeiro.`
      );
    }

    // Pós-processamento: garantir classe no <form>
    if (updateLPIndicadoresDto.compiledOutput && updateLPIndicadoresDto.compiledOutput.html) {
      updateLPIndicadoresDto.compiledOutput.html = updateLPIndicadoresDto.compiledOutput.html.replace(/<form(?![^>]*lp-indicador-form)/g, '<form class="lp-indicador-form"');
      // Pós-processamento: garantir elemento de feedback no <form>
      updateLPIndicadoresDto.compiledOutput.html = updateLPIndicadoresDto.compiledOutput.html.replace(
        /(<form[^>]*>[\s\S]*?)(<\/form>)/g,
        (match, start, end) => {
          return /lp-indicador-feedback/.test(match)
            ? match
            : `${start}<div class=\"lp-indicador-feedback\" style=\"margin-top:8px;font-size:0.95em;\"></div>${end}`;
        }
      );
      // Pós-processamento: garantir name="name"
      updateLPIndicadoresDto.compiledOutput.html = updateLPIndicadoresDto.compiledOutput.html
        .replace(/<input([^>]+type=['"]text['"][^>]*)name=['"][^'"]*['"]/gi, '<input$1name="name"')
        .replace(/<input([^>]+type=['"]text['"])(?![^>]*name=['"]name['"])/gi, '<input$1 name="name"');
      // Pós-processamento: garantir name="email" e name="phone"
      updateLPIndicadoresDto.compiledOutput.html = updateLPIndicadoresDto.compiledOutput.html
        .replace(/<input([^>]+type=['"]email['"][^>]*)name=['"][^'"]*['"]/gi, '<input$1name="email"')
        .replace(/<input([^>]+type=['"]email['"])(?![^>]*name=['"]email['"])/gi, '<input$1 name="email"')
        .replace(/<input([^>]+type=['"]tel['"][^>]*)name=['"][^'"]*['"]/gi, '<input$1name="phone"')
        .replace(/<input([^>]+type=['"]tel['"])(?![^>]*name=['"]phone['"])/gi, '<input$1 name="phone"');
    }

    // Usar a LP já carregada para verificar campos obrigatórios
    const lpAtual = currentLP;
    if (!updateLPIndicadoresDto.clientId) {
      updateLPIndicadoresDto.clientId = lpAtual.clientId?.toString();
    } else {
      // Sanitizar clientId para garantir que nunca seja salvo como objeto
      if (updateLPIndicadoresDto.clientId && typeof updateLPIndicadoresDto.clientId === 'object') {
        if ((updateLPIndicadoresDto.clientId as any)._id) {
          updateLPIndicadoresDto.clientId = (updateLPIndicadoresDto.clientId as any)._id.toString();
        } else if ((updateLPIndicadoresDto.clientId as any).toString) {
          updateLPIndicadoresDto.clientId = (updateLPIndicadoresDto.clientId as any).toString();
        }
      }
    }
    if (!updateLPIndicadoresDto.status) {
      updateLPIndicadoresDto.status = lpAtual.status || 'draft';
    }

    // Verificar se slug já existe (se fornecido)
    if (updateLPIndicadoresDto.slug && updateLPIndicadoresDto.clientId) {
      console.log('[LPIndicadoresService][update] Verificando slug duplicado:', {
        slug: updateLPIndicadoresDto.slug,
        clientId: updateLPIndicadoresDto.clientId,
        idAtual: id
      });
      const existingLP = await this.lpIndicadoresModel.findOne({ 
        slug: updateLPIndicadoresDto.slug,
        clientId: updateLPIndicadoresDto.clientId,
        _id: { $ne: id }
      });
      console.log('[LPIndicadoresService][update] Resultado da busca por slug duplicado:', existingLP);
      if (existingLP) {
        console.warn('[LPIndicadoresService][update] Conflito: Slug já está em uso por outra LP:', existingLP._id);
        throw new ConflictException('Slug já está em uso');
      }
    }

    const updateData = {
      ...updateLPIndicadoresDto,
      lastModifiedBy: updateLPIndicadoresDto.lastModifiedBy ? 
        new Types.ObjectId(updateLPIndicadoresDto.lastModifiedBy) : undefined,
    };

    const updatedLP = await this.lpIndicadoresModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    console.log('[LPIndicadoresService][update] LP atualizada:', updatedLP?._id || null, 'status:', updatedLP?.status, 'clientId:', updatedLP?.clientId);

    if (!updatedLP) {
      throw new NotFoundException('LP de Indicadores não encontrada');
    }

    return updatedLP;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID inválido');
    }

    const result = await this.lpIndicadoresModel.findByIdAndDelete(id).exec();
    
    if (!result) {
      throw new NotFoundException('LP de Indicadores não encontrada');
    }
  }

  // === FUNCIONALIDADES ESPECÍFICAS ===

  async publish(id: string): Promise<LPIndicadores | null> {
    const lp = await this.lpIndicadoresModel.findById(id);
    
    if (!lp) {
      throw new NotFoundException('LP de Indicadores não encontrada');
    }
    
    return await this.lpIndicadoresModel.findByIdAndUpdate(
      id,
      {
        status: 'published',
        publishedAt: new Date(),
        publishedUrl: `https://lp.virallead.com.br/lp-indicadores/slug/${lp.slug}`
      },
      { new: true }
    ).exec();
  }

  async unpublish(id: string): Promise<LPIndicadores | null> {
    const lp = await this.lpIndicadoresModel.findById(id);
    
    if (!lp) {
      throw new NotFoundException('LP de Indicadores não encontrada');
    }
    
    return await this.lpIndicadoresModel.findByIdAndUpdate(
      id,
      {
        status: 'draft',
        $unset: { publishedAt: 1, publishedUrl: 1 }
      },
      { new: true }
    ).exec();
  }

  async duplicate(id: string, newName: string): Promise<LPIndicadores> {
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
      formConfig: originalLP.formConfig,
      metaTitle: originalLP.metaTitle,
      metaDescription: originalLP.metaDescription,
      metaKeywords: originalLP.metaKeywords,
      ogImage: originalLP.ogImage,
      customCSS: originalLP.customCSS,
      customJS: originalLP.customJS,
      trackingCodes: originalLP.trackingCodes,
      templateId: originalLP.templateId,
      parentLPId: id,
      isTemplate: false
    };

    return await this.create(duplicateData as CreateLPIndicadoresDto);
  }

  async incrementViews(id: string): Promise<void> {
    await this.lpIndicadoresModel.findByIdAndUpdate(
      id,
      { 
        $inc: { 'statistics.totalViews': 1 },
        $set: { 'statistics.lastViewAt': new Date() }
      }
    ).exec();
  }

  // === SUBMISSÃO DE FORMULÁRIO ===

  async submitForm(submitFormDto: SubmitFormLPIndicadoresDto): Promise<any> {
    try {
      console.log('[LP] 🚀 === INICIANDO SUBMISSÃO DE FORMULÁRIO ===');
      console.log('[LP] 🚀 LP ID:', submitFormDto.lpId);
      console.log('[LP] 🚀 Nome:', submitFormDto.name);
      console.log('[LP] 🚀 Email:', submitFormDto.email);

    // Verificar se LP existe
    const lp = await this.findOne(submitFormDto.lpId);
    console.log('[LP] ✅ LP encontrada:', lp.name);
    console.log('[LP] 🔍 LP vinculada à campanha:', !!lp.campaignId);
    console.log('[LP] 🔍 Campaign ID:', lp.campaignId);
    console.log('[LP] 🔍 Campaign Name:', lp.campaignName);
    console.log('[LP] 🔍 Client ID:', lp.clientId);

    // Verificar se indicador já existe
      const existingIndicator = await this.participantModel.findOne({
      email: submitFormDto.email,
        originLandingPageId: (lp as any)._id?.toString()
    });
      if (existingIndicator) {
        console.warn('[LP] ⚠️ Indicador já cadastrado:', submitFormDto.email);
      throw new ConflictException('Indicador já cadastrado com este email');
    }
      
      console.log('[LP] ✅ Email não está duplicado, prosseguindo...');

      // Gerar indicatorId único
      const indicatorId = uuidv4();
      console.log('[LP] 🆔 ID do novo indicador:', indicatorId);

      // Gerar senha automática para o indicador
      const plainPassword = Math.random().toString(36).slice(-8);
      console.log('[LP] 🔑 Senha gerada para indicador:', plainPassword);

    // Criar novo indicador
      const indicatorData = {
      participantId: indicatorId,
      name: submitFormDto.name,
      email: submitFormDto.email,
      phone: submitFormDto.phone,
        company: submitFormDto.company,
        tipo: 'indicador', // 🆕 ESSENCIAL: Definir como indicador
        plainPassword, // 🆕 SENHA: Adicionar senha gerada
        originLandingPageId: (lp as any)._id?.toString(),
        originLandingPageName: lp.name,
        status: 'ativo',
        clientId: lp.clientId, // 🆕 ESSENCIAL: Vincular ao cliente
        // 🆕 ADICIONANDO campos da campanha se LP estiver vinculada (convertendo para ObjectId)
        campaignId: lp.campaignId ? (
          Types.ObjectId.isValid(lp.campaignId) ? 
            new Types.ObjectId(lp.campaignId) : 
            lp.campaignId
        ) : null,
        campaignName: lp.campaignName || null,
        originCampaignId: lp.campaignId ? (
          Types.ObjectId.isValid(lp.campaignId) ? 
            new Types.ObjectId(lp.campaignId) : 
            lp.campaignId
        ) : null,
        originSource: 'landing-page',
        originMetadata: {
          lpName: lp.name,
          originLandingPageName: lp.name,
          campaignName: lp.campaignName || null,
        utmSource: submitFormDto.utmSource,
        utmMedium: submitFormDto.utmMedium,
        utmCampaign: submitFormDto.utmCampaign,
        utmContent: submitFormDto.utmContent,
        utmTerm: submitFormDto.utmTerm,
        referrerUrl: submitFormDto.referrerUrl,
        userAgent: submitFormDto.userAgent,
        ipAddress: submitFormDto.ipAddress,
        submissionDate: new Date(),
        formData: submitFormDto.formData
      }
    };
      
      console.log('[LP] 🚀 Criando novo indicador com dados:', {
        name: indicatorData.name,
        email: indicatorData.email,
        tipo: indicatorData.tipo,
        clientId: indicatorData.clientId,
        campaignId: indicatorData.campaignId,
        campaignName: indicatorData.campaignName,
        originLandingPageId: indicatorData.originLandingPageId
      });

      const newIndicator = new this.participantModel(indicatorData);
      const savedIndicator = await newIndicator.save();
      console.log('[LP] ✅ Indicador salvo com sucesso:', savedIndicator._id);

      // 🆕 NOVA FUNCIONALIDADE: Adicionar indicador à lista da campanha se LP estiver vinculada
      console.log('[LP] 🎯 Iniciando processo de vinculação à lista da campanha...');
      try {
        await this.addIndicatorToCampaignList(savedIndicator, lp);
        console.log('[LP] ✅ Processo de vinculação concluído com sucesso');
      } catch (error) {
        console.error('[LP] ❌ ERRO ao adicionar indicador à lista da campanha:', error.message);
        console.error('[LP] ❌ Stack:', error.stack);
        
        // FALLBACK: Tentar reparação automática
        console.log('[LP] 🔄 Tentando reparação automática...');
        try {
          if (lp.campaignId) {
            await this.repairParticipantToList(savedIndicator._id.toString(), lp.campaignId.toString());
            console.log('[LP] ✅ Reparação automática bem-sucedida');
          }
        } catch (repairError) {
          console.error('[LP] ❌ Falha na reparação automática:', repairError.message);
        }
      }

    // Atualizar estatísticas da LP
    console.log('[LP] 📊 Atualizando estatísticas da LP...');
    await this.lpIndicadoresModel.findByIdAndUpdate(
      submitFormDto.lpId,
      { 
        $inc: { 
          'statistics.totalSubmissions': 1,
          'statistics.totalIndicadoresCadastrados': 1
        },
        $set: { 'statistics.lastSubmissionAt': new Date() }
      }
    ).exec();
    console.log('[LP] ✅ Estatísticas atualizadas');

      console.log('[LP] 🚀 === SUBMISSÃO CONCLUÍDA COM SUCESSO ===');
      
      // Converter ObjectIds para strings na resposta para consistência
      const responseData = {
        ...savedIndicator.toObject(),
        campaignId: savedIndicator.campaignId?.toString(),
        originCampaignId: savedIndicator.originCampaignId?.toString(),
        clientId: savedIndicator.clientId?.toString(),
        originLandingPageId: savedIndicator.originLandingPageId?.toString(),
      };
      
      return responseData;
    } catch (error) {
      console.error('[LP] ❌ === ERRO NA SUBMISSÃO ===');
      console.error('[LP] ❌ Erro:', error.message);
      console.error('[LP] ❌ Stack:', error.stack);
      console.log('[LP] 🚀 === FIM (ERRO) ===');
      throw error;
    }
  }

  // === ESTATÍSTICAS ===

  async getStatistics(id: string): Promise<any> {
    const lp = await this.findOne(id);
    
    // Buscar indicadores originados desta LP
    const indicadores = await this.participantModel.find({
      originLandingPageId: new Types.ObjectId(id)
    }).exec();

    const totalIndicadores = indicadores.length;
    const indicadoresAtivos = indicadores.filter(p => p.status === 'ativo').length;
    const totalIndicacoes = indicadores.reduce((sum, p) => sum + (p.totalIndicacoes || 0), 0);

    return {
      ...lp.statistics,
      totalIndicadores,
      indicadoresAtivos,
      totalIndicacoesFeitasPorIndicadores: totalIndicacoes,
      indicadoresPorMes: await this.getIndicadoresPorMes(id),
      topIndicadores: await this.getTopIndicadores(id)
    };
  }

  private async getIndicadoresPorMes(lpId: string): Promise<any[]> {
    return await this.participantModel.aggregate([
      { $match: { originLandingPageId: new Types.ObjectId(lpId) } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]).exec();
  }

  private async getTopIndicadores(lpId: string): Promise<any[]> {
    return await this.participantModel
      .find({ originLandingPageId: new Types.ObjectId(lpId) })
      .sort({ totalIndicacoes: -1 })
      .limit(10)
      .select('name email totalIndicacoes indicacoesAprovadas')
      .exec();
  }

  // === TEMPLATES ===

  async getTemplates(): Promise<LPIndicadores[]> {
    return await this.lpIndicadoresModel
      .find({ isTemplate: true })
      .select('name description metadata.blocksUsed previewUrl')
      .exec();
  }

  async createFromTemplate(templateId: string, createDto: Partial<CreateLPIndicadoresDto>): Promise<LPIndicadores> {
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
      formConfig: template.formConfig,
      metaTitle: template.metaTitle,
      metaDescription: template.metaDescription,
      metaKeywords: template.metaKeywords,
      ogImage: template.ogImage,
      customCSS: template.customCSS,
      customJS: template.customJS,
      trackingCodes: template.trackingCodes,
      templateId: templateId,
      isTemplate: false
    };

    return await this.create(newLPData as CreateLPIndicadoresDto);
  }

  /**
   * Duplica LPs-modelo para uma nova campanha, preenchendo campaignId e campaignName
   * @param templateLPs Array de LPs-modelo (LPIndicadoresDocument)
   * @param campaignId ID da nova campanha
   * @param campaignName Nome da nova campanha
   * @param clientId ID do cliente
   */
  async duplicateLPsForCampaign(templateLPs: LPIndicadoresDocument[], campaignId: string, campaignName: string, clientId: string): Promise<LPIndicadores[]> {
    const duplicated: LPIndicadores[] = [];
    for (const template of templateLPs) {
      // Garantir que temos valores válidos para gerar o slug
      const templateName = template.name || 'LP';
      const safeCampaignName = campaignName || 'Campanha';
      
      // Gerar novo slug baseado no nome da campanha e template
      const baseSlug = `${templateName}-${safeCampaignName}`.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      // Adicionar timestamp para garantir unicidade
      const timestamp = Date.now();
      const newSlug = `${baseSlug}-${timestamp}`;

      console.log('[LP] Criando duplicata:', {
        templateName,
        safeCampaignName,
        newSlug,
        campaignId,
        clientId
      });

      // Extrair apenas os campos necessários do template, evitando sobrescrever campos críticos
      const templateData = template.toObject();
      const data = {
        // Campos únicos para a duplicata
        name: `${templateName} - ${safeCampaignName}`,
        slug: newSlug,
        campaignId: new Types.ObjectId(campaignId),
        campaignName: safeCampaignName,
        clientId: new Types.ObjectId(clientId),
        status: template.status || 'draft',
        isTemplate: false,
        
        // Campos copiados do template
        description: templateData.description,
        grapesData: templateData.grapesData,
        compiledOutput: templateData.compiledOutput,
        metadata: {
          ...templateData.metadata,
          lastModified: new Date(),
          version: '1.0'
        },
        formConfig: templateData.formConfig,
        statistics: {
          totalViews: 0,
          totalSubmissions: 0,
          totalIndicadoresCadastrados: 0,
          conversionRate: 0
        },
        metaTitle: templateData.metaTitle,
        metaDescription: templateData.metaDescription,
        metaKeywords: templateData.metaKeywords,
        ogImage: templateData.ogImage,
        customCSS: templateData.customCSS,
        customJS: templateData.customJS,
        trackingCodes: templateData.trackingCodes,
        templateId: templateData._id?.toString(),
        parentLPId: templateData._id,
        createdBy: templateData.createdBy,
        
        // Campos que devem ser undefined para nova criação
        _id: undefined,
        createdAt: undefined,
        updatedAt: undefined,
        publishedAt: undefined,
        publishedUrl: undefined,
        previewUrl: undefined,
        __v: undefined
      };
      
      console.log('[LP] Dados da duplicata antes de salvar:', {
        name: data.name,
        slug: data.slug,
        campaignId: data.campaignId,
        clientId: data.clientId,
        hasSlug: !!data.slug,
        slugLength: data.slug?.length || 0
      });
      
      try {
        console.log('[LP] ===== DADOS PARA CRIAÇÃO =====');
        console.log('[LP] Name:', data.name);
        console.log('[LP] Slug:', data.slug);
        console.log('[LP] ClientId:', data.clientId);
        console.log('[LP] Status:', data.status);
        console.log('[LP] HasGrapesData:', !!data.grapesData);
        console.log('[LP] HasCompiledOutput:', !!data.compiledOutput);
        console.log('[LP] HasMetadata:', !!data.metadata);
        
        // Tentar criar usando método create diretamente em vez de new + save
        const saved = await this.lpIndicadoresModel.create(data);
        console.log('[LP] ✅ Duplicata criada com sucesso:', saved._id, 'slug:', saved.slug);
        duplicated.push(saved);
      } catch (error) {
        console.error('[LP] ❌ Erro ao criar duplicata:', error.message);
        if (error.errors) {
          console.error('[LP] Campos com erro:');
          Object.keys(error.errors).forEach(field => {
            console.error(`[LP] - ${field}: ${error.errors[field].message}`);
          });
        }
        throw error;
      }
    }
    return duplicated;
  }

  /**
   * 🆕 NOVA FUNCIONALIDADE: Adicionar indicador à lista da campanha
   */
  async addIndicatorToCampaignList(
    participant: any,
    lpIndicadores: LPIndicadores
  ): Promise<void> {
    console.log('[LP-INDICADORES] ===== INICIANDO ADIÇÃO À LISTA =====');
    console.log('[LP-INDICADORES] Participant ID:', participant._id);
    console.log('[LP-INDICADORES] Participant Name:', participant.name);
    console.log('[LP-INDICADORES] LP Name:', lpIndicadores.name);
    console.log('[LP-INDICADORES] LP campaignId:', lpIndicadores.campaignId);

    if (!lpIndicadores.campaignId) {
      console.error('[LP-INDICADORES] ❌ ERRO: LP não tem campaignId vinculado');
      return;
    }

    try {
      // Buscar a campanha
      console.log('[LP-INDICADORES] 🔍 Buscando campanha:', lpIndicadores.campaignId);
      const campaign = await this.participantModel.db.model('Campaign').findById(lpIndicadores.campaignId).exec();
      if (!campaign) {
        console.error('[LP-INDICADORES] ❌ ERRO: Campanha não encontrada:', lpIndicadores.campaignId);
        return;
      }

      console.log('[LP-INDICADORES] ✅ Campanha encontrada:', campaign.name);
      console.log('[LP-INDICADORES] 🔍 Lista da campanha ID:', campaign.participantListId);

      if (!campaign.participantListId) {
        console.error('[LP-INDICADORES] ❌ ERRO: Campanha não tem participantListId');
        return;
      }

      // Buscar a lista da campanha
      console.log('[LP-INDICADORES] 🔍 Buscando lista:', campaign.participantListId);
      const participantList = await this.participantModel.db.model('ParticipantList').findById(campaign.participantListId).exec();
      if (!participantList) {
        console.error('[LP-INDICADORES] ❌ ERRO: Lista não encontrada:', campaign.participantListId);
        return;
      }

      console.log('[LP-INDICADORES] ✅ Lista encontrada:', participantList.name);
      console.log('[LP-INDICADORES] 📋 Tipo da lista:', participantList.tipo);
      console.log('[LP-INDICADORES] 👥 Participantes atuais na lista:', participantList.participants?.length || 0);

      // Verificar se a lista é do tipo "indicador"
      if (participantList.tipo !== 'indicador') {
        console.error('[LP-INDICADORES] ❌ ERRO: Lista não é do tipo indicador, tipo atual:', participantList.tipo);
        return;
      }

      // Verificar se o participante já está na lista
      const isAlreadyInList = participantList.participants?.some(p => p.toString() === participant._id.toString());
      if (isAlreadyInList) {
        console.log('[LP-INDICADORES] ℹ️ Participante já está na lista');
        return;
      }

      console.log('[LP-INDICADORES] 🚀 Adicionando participante à lista...');

      // Adicionar o participante à lista da campanha
      const listUpdateResult = await this.participantModel.db.model('ParticipantList').findByIdAndUpdate(
        participantList._id,
        { $addToSet: { participants: participant._id } },
        { new: true }
      );

      if (listUpdateResult) {
        console.log('[LP-INDICADORES] ✅ Participante adicionado ao array da lista');
        console.log('[LP-INDICADORES] 👥 Total de participantes agora:', listUpdateResult.participants?.length || 0);
      } else {
        console.error('[LP-INDICADORES] ❌ ERRO: Falha ao atualizar lista');
        return;
      }

      // Atualizar o participante para incluir a lista (garantindo ObjectId)
      console.log('[LP-INDICADORES] 🔄 Atualizando participante...');
      const participantUpdateResult = await this.participantModel.findByIdAndUpdate(
        participant._id,
          { 
          $addToSet: { lists: participantList._id },
            $set: { 
            campaignId: new Types.ObjectId(campaign._id),
              campaignName: campaign.name 
            }
        },
        { new: true }
      );

      if (participantUpdateResult) {
        console.log('[LP-INDICADORES] ✅ Participante atualizado com sucesso');
        console.log('[LP-INDICADORES] 📋 Listas do participante:', participantUpdateResult.lists?.length || 0);
        console.log('[LP-INDICADORES] 🎯 CampaignId:', participantUpdateResult.campaignId);
        console.log('[LP-INDICADORES] 🏷️ CampaignName:', participantUpdateResult.campaignName);
      } else {
        console.error('[LP-INDICADORES] ❌ ERRO: Falha ao atualizar participante');
      }

      console.log('[LP-INDICADORES] ===== ADIÇÃO À LISTA CONCLUÍDA COM SUCESSO =====');

    } catch (error) {
      console.error('[LP-INDICADORES] ❌ ERRO CRÍTICO ao adicionar participante à lista:', error.message);
      console.error('[LP-INDICADORES] Stack:', error.stack);
      throw error;
    }
  }

  /**
   * 🆕 NOVA FUNCIONALIDADE: Buscar dados de sucesso do indicador
   */
  async getSuccessData(participantId: string): Promise<any> {
    console.log('[LP] 🎯 Buscando dados de sucesso para indicador:', participantId);
    
    try {
      // Buscar o indicador
      const indicator = await this.participantModel.findById(participantId)
        .populate('lists', 'name tipo campaignName')
        .populate('originLandingPageId', 'name')
        .exec();
      
      if (!indicator) {
        throw new NotFoundException('Indicador não encontrado');
      }

      // Verificar se é um indicador válido
      if (!['indicador', 'influenciador'].includes(indicator.tipo)) {
        throw new BadRequestException('Participante não é um indicador válido');
      }

      // Gerar link de compartilhamento se não existir
      let referralLink: string | null = null;
      if (indicator.uniqueReferralCode) {
        // 🔧 CORREÇÃO: Links de indicação SEMPRE usam domínio lp.virallead.com.br
        const baseUrl = 'https://lp.virallead.com.br';
        
        referralLink = `${baseUrl}/indicacao/${indicator.uniqueReferralCode}`;
      }

      // Buscar informações da campanha se disponível
      let campaignInfo: any = null;
      if (indicator.campaignId) {
        const campaignModel = this.participantModel.db.model('Campaign');
        const campaign = await campaignModel.findById(indicator.campaignId).exec();
        if (campaign) {
          campaignInfo = {
            id: campaign._id,
            name: campaign.name,
            description: campaign.description
          };
        }
      }

      // Buscar informações da LP de origem se disponível
      let lpInfo: any = null;
      if (indicator.originLandingPageId) {
        const lp = await this.lpIndicadoresModel.findById(indicator.originLandingPageId).exec();
        if (lp) {
          lpInfo = {
            id: lp._id,
            name: lp.name,
            description: lp.description
          };
        }
      }

      const successData = {
        indicator: {
          id: indicator._id,
          name: indicator.name,
          email: indicator.email,
          phone: indicator.phone,
          tipo: indicator.tipo,
          status: indicator.status,
          uniqueReferralCode: indicator.uniqueReferralCode,
          referralLink: referralLink,
          totalIndicacoes: indicator.totalIndicacoes || 0,
          indicacoesAprovadas: indicator.indicacoesAprovadas || 0,
          createdAt: indicator.createdAt
        },
        campaign: campaignInfo,
        landingPage: lpInfo,
        lists: (indicator.lists || []).map((list: any) => ({
          id: list._id || list,
          name: list.name || 'Lista não identificada',
          tipo: list.tipo || 'indefinido',
          campaignName: list.campaignName
        }))
      };

      console.log('[LP] ✅ Dados de sucesso preparados para:', indicator.name);
      return successData;
    } catch (error) {
      console.error('[LP] ❌ Erro ao buscar dados de sucesso:', error.message);
      throw error;
    }
  }

  /**
   * 🔄 MÉTODO DE REPARAÇÃO: Adicionar participante específico à lista da campanha
   */
  private async repairParticipantToList(participantId: string, campaignId: string): Promise<void> {
    console.log('[LP-REPAIR] Iniciando reparação para participante:', participantId);
    
    try {
      // Buscar a campanha
      const campaign = await this.participantModel.db.model('Campaign').findById(campaignId).exec();
      if (!campaign || !campaign.participantListId) {
        throw new Error('Campanha ou lista não encontrada');
      }

      // Buscar o participante
      const participant = await this.participantModel.findById(participantId).exec();
      if (!participant) {
        throw new Error('Participante não encontrado');
      }

      // Verificar se já está na lista
      const isAlreadyInList = participant.lists?.some(listId => listId.toString() === campaign.participantListId.toString());
      if (isAlreadyInList) {
        console.log('[LP-REPAIR] Participante já está na lista');
        return;
      }

      // Adicionar à lista
      await this.participantModel.db.model('ParticipantList').findByIdAndUpdate(
        campaign.participantListId,
        { $addToSet: { participants: participantId } }
      );

      // Atualizar participante
      await this.participantModel.findByIdAndUpdate(
        participantId,
        { 
          $addToSet: { lists: campaign.participantListId },
          $set: { 
            campaignId: new Types.ObjectId(campaignId),
            campaignName: campaign.name 
          }
        }
      );

      console.log('[LP-REPAIR] ✅ Reparação concluída com sucesso');
    } catch (error) {
      console.error('[LP-REPAIR] ❌ Erro na reparação:', error.message);
      throw error;
    }
  }
} 