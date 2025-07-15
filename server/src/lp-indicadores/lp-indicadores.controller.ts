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
  UseGuards,
  Res
} from '@nestjs/common';
import { LPIndicadoresService } from './lp-indicadores.service';
import { CreateLPIndicadoresDto } from './dto/create-lp-indicadores.dto';
import { UpdateLPIndicadoresDto } from './dto/update-lp-indicadores.dto';
import { SubmitFormLPIndicadoresDto } from './dto/submit-form-lp-indicadores.dto';
import { JwtClientAuthGuard } from '../auth/guards/jwt-client-auth.guard';
import { ClientId } from '../auth/decorators/client-id.decorator';

@Controller('lp-indicadores')
export class LPIndicadoresController {
  constructor(private readonly lpIndicadoresService: LPIndicadoresService) {}

  // === CRUD BÁSICO ===

  @UseGuards(JwtClientAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createLPIndicadoresDto: CreateLPIndicadoresDto,
    @ClientId() clientId: string // 🚀 NOVO: ClientId automático do JWT
  ) {
    // 🔒 SEGURANÇA: Garantir que a LP seja criada para o cliente correto
    const lpData = { ...createLPIndicadoresDto, clientId };
    return {
      success: true,
      data: await this.lpIndicadoresService.create(lpData),
      message: 'LP de Indicadores criada com sucesso'
    };
  }

  @UseGuards(JwtClientAuthGuard)
  @Get()
  async findAll(
    @ClientId() clientId: string, // 🚀 NOVO: ClientId automático do JWT
    @Query('status') status?: string,
    @Query('campaignId') campaignId?: string
  ) {
    return {
      success: true,
      data: await this.lpIndicadoresService.findAll(clientId, status, campaignId),
      message: 'LPs de Indicadores listadas com sucesso'
    };
  }

  @Get('templates')
  async getTemplates() {
    return {
      success: true,
      data: await this.lpIndicadoresService.getTemplates(),
      message: 'Templates listados com sucesso'
    };
  }

  @UseGuards(JwtClientAuthGuard)
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @ClientId() clientId: string // 🔒 SEGURANÇA: Validar ownership
  ) {
    const lp = await this.lpIndicadoresService.findOne(id);
    
    // 🔧 FIX: Extrair clientId corretamente (pode ser populated object ou string)  
    let lpClientId: string;
    if (typeof lp.clientId === 'object' && lp.clientId !== null) {
      // Cliente populado com dados completos
      lpClientId = (lp.clientId as any)._id?.toString() || (lp.clientId as any).toString();
    } else {
      // Cliente como string simples
      lpClientId = (lp.clientId as any)?.toString();
    }
    

    
    // 🔒 SEGURANÇA: Verificar se a LP pertence ao cliente
    if (lpClientId !== clientId) {
      return {
        success: false,
        message: 'LP não encontrada ou não pertence ao cliente'
      };
    }
    return {
      success: true,
      data: lp,
      message: 'LP de Indicadores encontrada'
    };
  }

  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string, @Res() res: any) {
    try {
      const lp = await this.lpIndicadoresService.findBySlug(slug);
      
      // Retornar HTML renderizado da LP
      
             // Construir HTML completo da LP
       const trackingScripts = [
         lp.trackingCodes?.googleAnalytics ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${lp.trackingCodes.googleAnalytics}"></script><script>window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', '${lp.trackingCodes.googleAnalytics}');</script>` : '',
         lp.trackingCodes?.facebookPixel ? `<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init', '${lp.trackingCodes.facebookPixel}');fbq('track', 'PageView');</script>` : '',
         ...(lp.trackingCodes?.customScripts || []).map(script => `<script>${script}</script>`)
       ].filter(Boolean).join('\n    ');
       
       // 🔧 CORREÇÃO: JavaScript completo para funcionamento do formulário de LP de indicadores
       const lpFormJS = `
        // Configuração do contexto da LP
        localStorage.setItem('currentLpId', '${(lp as any)._id}');
        localStorage.setItem('currentLpName', '${lp.name.replace(/'/g, "\\'")}');
        localStorage.setItem('currentClientId', '${lp.clientId}');
        
        // Configuração de API
        window.APP_CONFIG = {
          API_URL: '${process.env.API_BASE_URL || 'http://localhost:3000'}/api',
          CLIENT_URL: '${process.env.CLIENT_BASE_URL || 'http://localhost:5501'}'
        };
        
        // JavaScript do formulário de indicadores
        window.submitIndicadorForm = async function(event, form) {
          event.preventDefault();
          const nameInput = form.querySelector('input[name="name"]');
          const emailInput = form.querySelector('input[name="email"]');
          const phoneInput = form.querySelector('input[name="phone"]') || form.querySelector('input[name="whatsapp"]');
          const companyInput = form.querySelector('input[name="company"]');

          const name = nameInput ? nameInput.value.trim() : '';
          const email = emailInput ? emailInput.value.trim() : '';
          const phone = phoneInput ? phoneInput.value.trim() : '';
          const company = companyInput ? companyInput.value.trim() : undefined;
          const lpId = localStorage.getItem('currentLpId');
          const clientId = localStorage.getItem('currentClientId');
          const feedback = form.querySelector('.lp-indicador-feedback') || form.querySelector('.feedback');
          if (!feedback) {
            const feedbackDiv = document.createElement('div');
            feedbackDiv.className = 'lp-indicador-feedback';
            feedbackDiv.style.cssText = 'margin-top:8px;font-size:0.95em;';
            form.appendChild(feedbackDiv);
          }
          const feedbackEl = form.querySelector('.lp-indicador-feedback') || form.querySelector('.feedback');
          feedbackEl.textContent = '';

          // Validação simples de e-mail no frontend
          const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
          if (!emailRegex.test(email)) {
            feedbackEl.textContent = 'Por favor, informe um e-mail válido.';
            feedbackEl.style.color = 'red';
            return false;
          }
          if (!name) {
            feedbackEl.textContent = 'Por favor, informe seu nome.';
            feedbackEl.style.color = 'red';
            return false;
          }
          if (!phone) {
            feedbackEl.textContent = 'Por favor, informe seu telefone.';
            feedbackEl.style.color = 'red';
            return false;
          }
          if (!lpId) {
            feedbackEl.textContent = 'Erro: dados de contexto não encontrados. Recarregue a página.';
            feedbackEl.style.color = 'red';
            return false;
          }
          
          // Captura dados de origem
          const urlParams = new URL(window.location.href).searchParams;
          const utmSource = urlParams.get('utm_source') || '';
          const utmMedium = urlParams.get('utm_medium') || '';
          const utmCampaign = urlParams.get('utm_campaign') || '';
          const utmTerm = urlParams.get('utm_term') || '';
          const utmContent = urlParams.get('utm_content') || '';
          const referrerUrl = document.referrer;
          const userAgent = navigator.userAgent;
          const language = navigator.language;
          
          const payload = {
            name, email, phone, company, lpId,
            utmSource, utmMedium, utmCampaign, utmTerm, utmContent,
            referrerUrl, userAgent, language
          };
          
          try {
            feedbackEl.textContent = 'Enviando...';
            feedbackEl.style.color = 'blue';
            
            const response = await fetch(window.APP_CONFIG.API_URL + '/lp-indicadores/submit-form', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            const result = await response.json();
            
            if (response.ok && result.success) {
              feedbackEl.textContent = 'Cadastro realizado com sucesso! Você receberá seu link de indicação em breve.';
              feedbackEl.style.color = 'green';
              form.reset();
              
              // Opcional: Redirecionar após sucesso
              const participantId = result.participantId || result.data?._id;
              if (participantId) {
                setTimeout(() => {
                  window.location.href = window.APP_CONFIG.CLIENT_URL + '/pages/lp-indicadores-success.html?id=' + participantId;
                }, 2000);
              }
            } else {
              feedbackEl.textContent = result.message || 'Erro ao cadastrar indicador.';
              feedbackEl.style.color = 'red';
            }
          } catch (err) {
            feedbackEl.textContent = 'Erro de conexão. Tente novamente.';
            feedbackEl.style.color = 'red';
          }
          return false;
        };

        // Função para associar formulários à submissão
        window.bindIndicadorForms = function() {
          document.querySelectorAll('.lp-indicador-form, form').forEach(form => {
            // Verificar se o formulário tem campos de indicador
            const hasNameField = form.querySelector('input[name="name"]');
            const hasEmailField = form.querySelector('input[name="email"]');
            if (hasNameField && hasEmailField) {
              form.onsubmit = function(event) { return window.submitIndicadorForm(event, form); };
              form.classList.add('lp-indicador-form');
              
              // Adicionar elemento de feedback se não existir
              if (!form.querySelector('.lp-indicador-feedback, .feedback')) {
                const feedbackDiv = document.createElement('div');
                feedbackDiv.className = 'lp-indicador-feedback';
                feedbackDiv.style.cssText = 'margin-top:8px;font-size:0.95em;';
                form.appendChild(feedbackDiv);
              }
            }
          });
        };
        
        // Executar após o DOM carregar
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', window.bindIndicadorForms);
        } else {
          window.bindIndicadorForms();
        }
        
        // Executar também após um pequeno delay para garantir
        setTimeout(window.bindIndicadorForms, 100);`;
       
       const fullHTML = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${lp.name || 'LP de Indicadores'}</title>
    <style>
        ${lp.compiledOutput?.css || ''}
        ${lp.customCSS || ''}
    </style>
    ${trackingScripts}
</head>
<body>
    ${lp.compiledOutput?.html || '<p>Conteúdo da LP não disponível</p>'}
    
    <script>
        ${lpFormJS}
    </script>
    <script>
        ${lp.customJS || ''}
    </script>
</body>
</html>`;
      
      // HTML gerado com sucesso
      
      // Retornar como HTML
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(fullHTML);
      
    } catch (error) {
      console.error('Erro ao servir LP:', error.message);
      // Em caso de erro, retornar página de erro HTML
      const errorHTML = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LP não encontrada</title>
</head>
<body>
    <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
        <h1>LP de Indicadores não encontrada</h1>
        <p>A landing page solicitada não foi encontrada ou não está publicada.</p>
        <p>Código de erro: ${error.message}</p>
    </div>
</body>
</html>`;
      res.status(404).setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(errorHTML);
    }
  }

  @UseGuards(JwtClientAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string, 
    @Body() updateLPIndicadoresDto: UpdateLPIndicadoresDto,
    @ClientId() clientId: string // 🔒 SEGURANÇA: Validar ownership
  ) {
    // 🔒 SEGURANÇA: Verificar se a LP pertence ao cliente antes de atualizar
    const lp = await this.lpIndicadoresService.findOne(id);
    
    // 🔧 FIX: Extrair clientId corretamente no update também
    let lpClientIdUpdate: string;
    if (typeof lp.clientId === 'object' && lp.clientId !== null) {
      lpClientIdUpdate = (lp.clientId as any)._id?.toString() || (lp.clientId as any).toString();
    } else {
      lpClientIdUpdate = (lp.clientId as any)?.toString();
    }
    

    
    if (lpClientIdUpdate !== clientId) {
      return {
        success: false,
        message: 'LP não encontrada ou não pertence ao cliente'
      };
    }
    
    return {
      success: true,
      data: await this.lpIndicadoresService.update(id, updateLPIndicadoresDto),
      message: 'LP de Indicadores atualizada com sucesso'
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.lpIndicadoresService.remove(id);
    return {
      success: true,
      message: 'LP de Indicadores removida com sucesso'
    };
  }

  // === FUNCIONALIDADES ESPECÍFICAS ===

  @Post(':id/publish')
  async publish(@Param('id') id: string) {
    return {
      success: true,
      data: await this.lpIndicadoresService.publish(id),
      message: 'LP publicada com sucesso'
    };
  }

  @Post(':id/unpublish')
  async unpublish(@Param('id') id: string) {
    return {
      success: true,
      data: await this.lpIndicadoresService.unpublish(id),
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
      data: await this.lpIndicadoresService.duplicate(id, newName),
      message: 'LP duplicada com sucesso'
    };
  }

  @Get(':id/statistics')
  async getStatistics(@Param('id') id: string) {
    return {
      success: true,
      data: await this.lpIndicadoresService.getStatistics(id),
      message: 'Estatísticas obtidas com sucesso'
    };
  }

  // === SUBMISSÃO DE FORMULÁRIO (PÚBLICO) ===

  @Post('submit-form')
  @HttpCode(HttpStatus.CREATED)
  async submitForm(@Body() submitFormDto: SubmitFormLPIndicadoresDto) {
    console.log('[LP] Recebido POST /api/lp-indicadores/submit-form');
    console.log('[LP] Payload recebido:', JSON.stringify(submitFormDto));
    const indicador = await this.lpIndicadoresService.submitForm(submitFormDto);
    return {
      success: true,
      data: indicador,
      participantId: indicador._id, // 🆕 Incluir ID para redirecionamento
      message: 'Indicador cadastrado com sucesso'
    };
  }

  // 🆕 NOVA FUNCIONALIDADE: Endpoint para dados de sucesso do indicador
  @Get('success/:participantId')
  @HttpCode(HttpStatus.OK)
  async getSuccessData(@Param('participantId') participantId: string) {
    console.log('[LP] Recebido GET /api/lp-indicadores/success/', participantId);
    
    try {
      const successData = await this.lpIndicadoresService.getSuccessData(participantId);
      return {
        success: true,
        data: successData,
        message: 'Dados de sucesso obtidos com sucesso'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Erro ao buscar dados de sucesso',
        error: error.message
      };
    }
  }

  // === TEMPLATES ===

  @Post('from-template/:templateId')
  async createFromTemplate(
    @Param('templateId') templateId: string,
    @Body() createDto: Partial<CreateLPIndicadoresDto>
  ) {
    return {
      success: true,
      data: await this.lpIndicadoresService.createFromTemplate(templateId, createDto),
      message: 'LP criada a partir do template com sucesso'
    };
  }

  // === GRAPESJS ENDPOINTS ===

  @Get(':id/grapes-data')
  async getGrapesData(@Param('id') id: string): Promise<any> {
    const lp = await this.lpIndicadoresService.findOne(id);
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
    const updateDto: UpdateLPIndicadoresDto = {
      grapesData: data.grapesData,
      compiledOutput: data.compiledOutput,
      metadata: {
        ...data.metadata,
        lastModified: new Date()
      }
    };

    return {
      success: true,
      data: await this.lpIndicadoresService.update(id, updateDto),
      message: 'Dados do GrapesJS salvos com sucesso'
    };
  }

  // === PREVIEW ===

  @Get(':id/preview')
  async getPreview(@Param('id') id: string) {
    const lp = await this.lpIndicadoresService.findOne(id);
    
    return {
      success: true,
      data: {
        html: lp.compiledOutput.html,
        css: lp.compiledOutput.css,
        customCSS: lp.customCSS,
        customJS: lp.customJS,
        trackingCodes: lp.trackingCodes
      },
      message: 'Preview obtido com sucesso'
    };
  }
} 