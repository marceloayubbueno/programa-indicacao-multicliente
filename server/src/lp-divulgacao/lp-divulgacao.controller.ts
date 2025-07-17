import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query, 
  HttpStatus,
  HttpCode,
  Put
} from '@nestjs/common';
import { LPDivulgacaoService } from './lp-divulgacao.service';
import { CreateLPDivulgacaoDto } from './dto/create-lp-divulgacao.dto';
import { UpdateLPDivulgacaoDto } from './dto/update-lp-divulgacao.dto';

@Controller('lp-divulgacao')
export class LPDivulgacaoController {
  constructor(private readonly lpDivulgacaoService: LPDivulgacaoService) {}

  // === CRUD BÁSICO ===

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createLPDivulgacaoDto: CreateLPDivulgacaoDto) {
    try {
      return {
        success: true,
        data: await this.lpDivulgacaoService.create(createLPDivulgacaoDto),
        message: 'LP de Divulgação criada com sucesso'
      };
    } catch (error) {
      console.error('[LPDivulgacaoController][CREATE] Erro ao criar LP:', error);
      throw error;
    }
  }

  @Get()
  async findAll(
    @Query('clientId') clientId?: string,
    @Query('status') status?: string,
    @Query('campaignId') campaignId?: string
  ) {
    return {
      success: true,
      data: await this.lpDivulgacaoService.findAll(clientId, status, campaignId),
      message: 'LPs de Divulgação listadas com sucesso'
    };
  }

  @Get('templates')
  async getTemplates() {
    return {
      success: true,
      data: await this.lpDivulgacaoService.getTemplates(),
      message: 'Templates listados com sucesso'
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return {
      success: true,
      data: await this.lpDivulgacaoService.findOne(id),
      message: 'LP de Divulgação encontrada'
    };
  }

  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    return {
      success: true,
      data: await this.lpDivulgacaoService.findBySlug(slug),
      message: 'LP encontrada'
    };
  }

  @Put(':id')
  async putUpdate(
    @Param('id') id: string,
    @Body() updateLPDivulgacaoDto: UpdateLPDivulgacaoDto
  ) {
    console.log('[BACKEND][PUT] Body recebido:', updateLPDivulgacaoDto);
    const result = await this.lpDivulgacaoService.update(id, updateLPDivulgacaoDto);
    console.log('[BACKEND][PUT] Resultado da atualização:', result);
    return {
      success: true,
      data: result,
      message: 'LP de Divulgação atualizada com sucesso'
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.lpDivulgacaoService.remove(id);
    return {
      success: true,
      message: 'LP de Divulgação removida com sucesso'
    };
  }

  // === FUNCIONALIDADES ESPECÍFICAS ===

  @Post(':id/publish')
  async publish(@Param('id') id: string) {
    return {
      success: true,
      data: await this.lpDivulgacaoService.publish(id),
      message: 'LP publicada com sucesso'
    };
  }

  @Post(':id/unpublish')
  async unpublish(@Param('id') id: string) {
    return {
      success: true,
      data: await this.lpDivulgacaoService.unpublish(id),
      message: 'LP despublicada com sucesso'
    };
  }

  @Post(':id/duplicate')
  async duplicate(
    @Param('id') id: string,
    @Body('name') newName: string
  ) {
    return {
      success: true,
      data: await this.lpDivulgacaoService.duplicate(id, newName),
      message: 'LP duplicada com sucesso'
    };
  }

  @Get(':id/statistics')
  async getStatistics(@Param('id') id: string) {
    return {
      success: true,
      data: await this.lpDivulgacaoService.getStatistics(id),
      message: 'Estatísticas obtidas com sucesso'
    };
  }

  // === SUBMISSÃO DE INDICAÇÃO (PÚBLICO) ===
  @Post('submit-referral')
  @HttpCode(HttpStatus.CREATED)
  async submitReferralForm(@Body() body: any) {
    return {
      success: true,
      data: await this.lpDivulgacaoService.submitReferralForm(body),
      message: 'Indicação enviada com sucesso'
    };
  }

  // === TEMPLATES ===

  @Post('from-template/:templateId')
  async createFromTemplate(
    @Param('templateId') templateId: string,
    @Body() createDto: Partial<CreateLPDivulgacaoDto>
  ) {
    return {
      success: true,
      data: await this.lpDivulgacaoService.createFromTemplate(templateId, createDto),
      message: 'LP criada a partir do template com sucesso'
    };
  }

  // === GRAPESJS ENDPOINTS ===

  @Get(':id/grapes-data')
  async getGrapesData(@Param('id') id: string): Promise<any> {
    const lp = await this.lpDivulgacaoService.findOne(id);
    return {
      success: true,
      data: {
        grapesData: lp.grapesData,
        metadata: lp.metadata
      },
      message: 'Dados do GrapesJS obtidos com sucesso'
    };
  }

  @Post(':id/save-grapes')
  async saveGrapesData(
    @Param('id') id: string,
    @Body() data: {
      grapesData: any;
      compiledOutput: any;
      metadata: any;
    }
  ) {
    const updateDto: UpdateLPDivulgacaoDto = {
      grapesData: data.grapesData,
      compiledOutput: data.compiledOutput,
      metadata: {
        ...data.metadata,
        lastModified: new Date()
      }
    };

    return {
      success: true,
      data: await this.lpDivulgacaoService.update(id, updateDto),
      message: 'Dados do GrapesJS salvos com sucesso'
    };
  }

  // === PREVIEW ===

  @Get(':id/preview')
  async getPreview(@Param('id') id: string) {
    const lp = await this.lpDivulgacaoService.findOne(id);
    
    return {
      success: true,
      data: {
        html: lp.compiledOutput.html,
        css: lp.compiledOutput.css,
        productInfo: {
          name: lp.productName,
          price: lp.productPrice,
          description: lp.productDescription
        }
      },
      message: 'Preview obtido com sucesso'
    };
  }

  // === CONFIGURAÇÃO DE PRODUTO ===

  @Patch(':id/product-config')
  async updateProductConfig(
    @Param('id') id: string,
    @Body() productConfig: {
      productName?: string;
      productPrice?: number;
      productDescription?: string;
    }
  ) {
    const updateDto: UpdateLPDivulgacaoDto = {
      productName: productConfig.productName,
      productPrice: productConfig.productPrice,
      productDescription: productConfig.productDescription
    };

    return {
      success: true,
      data: await this.lpDivulgacaoService.update(id, updateDto),
      message: 'Configuração do produto atualizada com sucesso'
    };
  }

  // === INTEGRAÇÃO ===

  @Patch(':id/integration-config')
  async updateIntegrationConfig(
    @Param('id') id: string,
    @Body() integrationConfig: any
  ) {
    const updateDto: UpdateLPDivulgacaoDto = {
      integrationConfig: integrationConfig
    };

    return {
      success: true,
      data: await this.lpDivulgacaoService.update(id, updateDto),
      message: 'Configuração de integração atualizada com sucesso'
    };
  }

  // === TRACKING DE REDIRECIONAMENTO ===
  @Post(':id/track-redirect')
  async trackRedirect(@Param('id') id: string, @Body() body: any) {
    // Chama o service para registrar o evento (por ora, apenas loga)
    await this.lpDivulgacaoService.trackRedirect(id, body);
    return {
      success: true,
      message: 'Evento de redirecionamento registrado'
    };
  }

  // === TOGGLE STATUS ===
  @Patch(':id/toggle-status')
  async toggleStatus(@Param('id') id: string) {
    try {
      const result = await this.lpDivulgacaoService.toggleStatus(id);
      return {
        success: true,
        data: result,
        message: `Status alterado para ${result.status}`
      };
    } catch (error) {
      console.error('[LPDivulgacaoController][TOGGLE-STATUS] Erro:', error);
      throw error;
    }
  }

  // === CONFIGURAÇÃO UTM/REDIRECIONAMENTO ===
  @Put(':id/redirect-config')
  async updateRedirectConfig(
    @Param('id') id: string,
    @Body() config: {
      redirectUrl?: string;
      utmParams?: Record<string, string>;
    }
  ) {
    try {
      const updateDto: UpdateLPDivulgacaoDto = {
        redirectUrl: config.redirectUrl,
        utmParams: config.utmParams
      };

      const result = await this.lpDivulgacaoService.update(id, updateDto);
      return {
        success: true,
        data: result,
        message: 'Configuração de redirecionamento/UTM atualizada com sucesso'
      };
    } catch (error) {
      console.error('[LPDivulgacaoController][REDIRECT-CONFIG] Erro:', error);
      throw error;
    }
  }

  @Get(':id/redirect-config')
  async getRedirectConfig(@Param('id') id: string) {
    try {
      const lp = await this.lpDivulgacaoService.findOne(id);
      return {
        success: true,
        data: {
          redirectUrl: lp.redirectUrl,
          utmParams: lp.utmParams
        },
        message: 'Configuração obtida com sucesso'
      };
    } catch (error) {
      console.error('[LPDivulgacaoController][GET-REDIRECT-CONFIG] Erro:', error);
      throw error;
    }
  }
} 