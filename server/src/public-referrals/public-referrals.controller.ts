import { Controller, Get, Param, Query, Res, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { ParticipantsService } from '../clients/participants.service';
import { LPDivulgacaoService } from '../lp-divulgacao/lp-divulgacao.service';

@Controller('indicacao')
export class PublicReferralsController {
  private readonly logger = new Logger(PublicReferralsController.name);

  constructor(
    private readonly participantsService: ParticipantsService,
    private readonly lpDivulgacaoService: LPDivulgacaoService,
  ) {}







  /**
   * Endpoint para preview/teste: /indicacao/:codigo/preview
   * Retorna informações sem redirecionar (útil para debug)
   * DEVE VIR ANTES DO ENDPOINT GENÉRICO!
   */
  @Get(':codigo/preview')
  async previewRedirection(@Param('codigo') codigo: string) {
    this.logger.log(`👀 [PREVIEW] Iniciando preview do link: ${codigo}`);

    try {
      // 1. Validar código
      this.logger.log(`🔍 [PREVIEW] Validando código: ${codigo}`);
      const validation = await this.participantsService.validateReferralCode(codigo);
      
      if (!validation.valid) {
        this.logger.warn(`❌ [PREVIEW] Código inválido: ${codigo} - ${validation.error}`);
        return {
          success: false,
          error: validation.error,
          codigo
        };
      }

      const indicador = validation.participant!;
      this.logger.log(`✅ [PREVIEW] Indicador encontrado: ${indicador.name} (${indicador.email})`);
      
            // 2. Buscar LP de destino
      let targetLP: any = null;
      
      // Extrair clientId corretamente do indicador
      const clientIdString = indicador.clientId._id ? indicador.clientId._id.toString() : indicador.clientId.toString();
      this.logger.log(`🔍 [PREVIEW] ClientId extraído: ${clientIdString}`);
      
      // Buscar LPs do cliente
      try {
        const lpsFromClient = await this.lpDivulgacaoService.findAll(clientIdString);
        
        if (lpsFromClient && lpsFromClient.length > 0) {
          targetLP = lpsFromClient.find(lp => lp.status === 'published') || null;
          this.logger.log(`🎯 [PREVIEW] LP encontrada: ${targetLP?.name || 'Nenhuma publicada'}`);
        }
      } catch (error) {
        this.logger.error(`❌ [PREVIEW] Erro ao buscar LPs: ${error.message}`);
      }

      const redirectUrl = targetLP ? `/lp-divulgacao/${targetLP.slug}?ref=${codigo}&utm_source=indicador&utm_content=${indicador.name.replace(/\s+/g, '_').toLowerCase()}` : null;
      this.logger.log(`🔗 [PREVIEW] URL de redirecionamento: ${redirectUrl}`);

      return {
        success: true,
        codigo,
        indicador: {
          name: indicador.name,
          email: indicador.email,
          campaign: indicador.campaignName || 'N/A'
        },
        targetLP: targetLP ? {
          id: targetLP._id,
          name: targetLP.name,
          slug: targetLP.slug,
          status: targetLP.status
        } : null,
        redirectUrl,
        message: 'Preview gerado com sucesso'
      };

    } catch (error) {
      this.logger.error(`💥 [PREVIEW] Erro detalhado no preview:`);
      this.logger.error(`- Mensagem: ${error.message}`);
      this.logger.error(`- Stack: ${error.stack}`);
      this.logger.error(`- Código: ${codigo}`);
      return {
        success: false,
        error: error.message,
        codigo,
        debug: error.stack
      };
    }
  }

  /**
   * Endpoint público principal: /indicacao/:codigo
   * Redireciona para LP de Divulgação com rastreamento do indicador
   */
  @Get(':codigo')
  async redirectToLandingPage(
    @Param('codigo') codigo: string,
    @Query() queryParams: any,
    @Res() res: Response,
  ) {
    this.logger.log(`🔗 Acesso via link de indicação: ${codigo}`);

    try {
      // 1. Validar código do indicador
      const validation = await this.participantsService.validateReferralCode(codigo);
      
      if (!validation.valid) {
        this.logger.warn(`❌ Código inválido: ${codigo} - ${validation.error}`);
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          error: 'Link de indicação inválido ou expirado',
          message: 'Verifique se o link está correto ou solicite um novo link ao indicador.'
        });
      }

      const indicador = validation.participant!;
      this.logger.log(`✅ Indicador encontrado: ${indicador.name} (${indicador.email})`);

      // 2. Buscar LP de Divulgação ativa do cliente
      let targetLP: any = null;
      
      // Extrair clientId corretamente
      const clientIdString = indicador.clientId._id ? indicador.clientId._id.toString() : indicador.clientId.toString();
      this.logger.log(`🔍 Buscando LPs para cliente: ${clientIdString}`);
      
      try {
        const lpsFromClient = await this.lpDivulgacaoService.findAll(clientIdString);
        
        if (lpsFromClient && lpsFromClient.length > 0) {
          targetLP = lpsFromClient.find(lp => lp.status === 'published') || null;
          this.logger.log(`🎯 LP encontrada: ${targetLP?.name || 'Nenhuma publicada'}`);
        }
      } catch (error) {
        this.logger.error(`❌ Erro ao buscar LPs: ${error.message}`);
      }

      if (!targetLP) {
        this.logger.error(`❌ Nenhuma LP de Divulgação ativa encontrada para indicador ${indicador.name}`);
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          error: 'Página de indicação não disponível',
          message: 'Entre em contato conosco para mais informações.'
        });
      }

      // 3. ✅ SOLUÇÃO DIRETA: Buscar LP e renderizar HTML
      this.logger.log(`🎯 Carregando LP: ${targetLP.name}`);
      
      try {
        const lpCompleta = await this.lpDivulgacaoService.findOne(targetLP._id.toString());
        
        // 🆕 MERGE FIELDS: Processar personalização do conteúdo
        let personalizedHtml = lpCompleta.compiledOutput.html || '<p>Conteúdo da LP não disponível</p>';
        
        // Substituir o merge field completo (incluindo estilos do editor) pelo nome limpo
        const mergeFieldRegex = /<span[^>]*>{{NOME_INDICADOR}}<\/span>/g;
        personalizedHtml = personalizedHtml.replace(mergeFieldRegex, indicador.name || 'Amigo');
        
        // Fallback: substituir qualquer {{NOME_INDICADOR}} restante
        personalizedHtml = personalizedHtml.replace(/\{\{NOME_INDICADOR\}\}/g, indicador.name || 'Amigo');
        
        this.logger.log(`🔄 Merge fields processados para: ${indicador.name || 'Amigo'}`);
        
        // Gerar HTML completo com tracking
        const htmlContent = `
          <!DOCTYPE html>
          <html lang="pt-BR">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${lpCompleta.metaTitle || lpCompleta.name}</title>
            <style>${lpCompleta.compiledOutput.css || ''}</style>
            
            <!-- DIAGNOSIS H4: Config script primeiro -->
            <script>
              console.log('[DIAGNOSIS-H4] 🚀 Config script inline carregando...');
              console.log('[DIAGNOSIS-H4] Timestamp:', new Date().toISOString());
              
              // Configuração de API
              window.APP_CONFIG = {
                API_URL: '${process.env.API_BASE_URL || 'http://localhost:3000'}/api',
                CLIENT_URL: '${process.env.CLIENT_BASE_URL || 'http://localhost:5501'}',
                environment: '${process.env.NODE_ENV || 'development'}'
              };
              
              console.log('[DIAGNOSIS-H4] ✅ window.APP_CONFIG definido:', window.APP_CONFIG);
              console.log('[DIAGNOSIS-H4] process.env values:', {
                API_BASE_URL: '${process.env.API_BASE_URL || 'UNDEFINED'}',
                CLIENT_BASE_URL: '${process.env.CLIENT_BASE_URL || 'UNDEFINED'}',
                NODE_ENV: '${process.env.NODE_ENV || 'UNDEFINED'}'
              });
            </script>
          </head>
          <body>
            <div id="lp-container">
              ${personalizedHtml}
            </div>
            
            <!-- Script de formulário inline -->
            <script>
              console.log('[DIAGNOSIS-H4] 📝 Script de formulário inline carregando...');
              
              // === SCRIPT DE FORMULÁRIO INLINE ===
              window.submitReferralForm = async function(event, form) {
                console.log('[DIAGNOSIS-H4] 🚀 submitReferralForm inline chamada');
                event.preventDefault();

                const feedback = form.querySelector('.feedback') || form.querySelector('[class*="feedback"]');
                
                // Capturar dados do formulário
                const formData = new FormData(form);
                const name = formData.get('name') || '';
                const email = formData.get('email') || '';
                const phone = formData.get('phone') || '';
                const company = formData.get('company') || '';

                console.log('[DIAGNOSIS-H4] 📋 Dados capturados:', { name, email, phone, company });

                // Validação básica
                if (!name || !email) {
                  const message = 'Por favor, preencha nome e e-mail.';
                  console.warn('[DIAGNOSIS-H4] ⚠️ Validação falhou:', message);
                  if (feedback) { 
                    feedback.textContent = message; 
                    feedback.style.color = 'red'; 
                  }
                  return false;
                }

                // Buscar ID da LP
                const lpId = localStorage.getItem('currentLpDivulgacaoId');
                console.log('[DIAGNOSIS-H4] 🆔 LP ID do localStorage:', lpId);
                
                if (!lpId) {
                  console.error('[DIAGNOSIS-H4] ❌ LP ID não encontrado');
                  if (feedback) { 
                    feedback.textContent = 'Erro: Contexto da LP não encontrado.'; 
                    feedback.style.color = 'red'; 
                  }
                  return false;
                }

                // Buscar informações do indicador do localStorage
                const indicatorCode = localStorage.getItem('currentIndicatorCode');
                const indicatorName = localStorage.getItem('currentIndicatorName');

                console.log('[DIAGNOSIS-H4] 👤 Dados do indicador:', {
                  indicatorCode,
                  indicatorName
                });

                // Captura dados de origem (UTM, referrer, userAgent, etc)
                const urlParams = new URL(window.location.href).searchParams;
                const indicatorCodeFromUrl = urlParams.get('ref') || '';
                const finalIndicatorCode = indicatorCodeFromUrl || indicatorCode || '';

                console.log('[DIAGNOSIS-H4] 🔗 Código do indicador final:', finalIndicatorCode);

                // Monta payload com código do indicador
                const payload = {
                  name, email, phone, company, lpId,
                  indicatorCode: finalIndicatorCode || null,
                  indicatorName: indicatorName || null,
                  referrerUrl: document.referrer,
                  userAgent: navigator.userAgent,
                  language: navigator.language
                };

                console.log('[DIAGNOSIS-H4] 📦 Payload construído:', payload);

                try {
                  // Determinar URL da API
                  const apiUrl = window.APP_CONFIG ? window.APP_CONFIG.API_URL : 
                                (window.location.hostname === 'localhost' ? 
                                 'http://localhost:3000/api' : 
                                 'https://programa-indicacao-multicliente-production.up.railway.app/api');
                  const fullUrl = \`\${apiUrl}/lp-divulgacao/submit-referral\`;
                  
                  console.log('[DIAGNOSIS-H4] 🌐 API URL determinada:', apiUrl);
                  console.log('[DIAGNOSIS-H4] 🔗 URL completa:', fullUrl);
                  
                  const response = await fetch(fullUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                  });
                  
                  console.log('[DIAGNOSIS-H4] 📥 Response status:', response.status);
                  console.log('[DIAGNOSIS-H4] 📥 Response ok:', response.ok);
                  
                  const result = await response.json();
                  console.log('[DIAGNOSIS-H4] 📄 Response data:', result);
                  
                  if (response.ok && result.success) {
                    console.log('[DIAGNOSIS-H4] ✅ Sucesso!');
                    if (feedback) { 
                      feedback.textContent = 'Envio concluído! Obrigado pela indicação.'; 
                      feedback.style.color = 'green'; 
                    }
                    form.reset();
                    
                    // Redirecionar se necessário
                    setTimeout(() => {
                      if (result.data && result.data.redirectUrl) {
                        console.log('[DIAGNOSIS-H4] 🚀 Redirecionando para:', result.data.redirectUrl);
                        window.location.href = result.data.redirectUrl;
                      }
                    }, 2000);
                    
                  } else {
                    console.error('[DIAGNOSIS-H4] ❌ Erro na resposta:', result);
                    if (feedback) { 
                      feedback.textContent = result.message || 'Erro ao enviar indicação.'; 
                      feedback.style.color = 'red'; 
                    }
                  }
                } catch (err) {
                  console.error('[DIAGNOSIS-H4] 💥 Erro de requisição:', err);
                  if (feedback) { 
                    feedback.textContent = 'Erro de conexão. Tente novamente.'; 
                    feedback.style.color = 'red'; 
                  }
                }
                return false;
              };

              // === FUNÇÃO PARA AUTO-BIND DOS FORMULÁRIOS ===
              window.bindReferralForms = function() {
                console.log('[DIAGNOSIS-H4] 🔗 bindReferralForms inline chamada');
                const forms = document.querySelectorAll('.lp-referral-form, form[data-type="referral"], form');
                console.log('[DIAGNOSIS-H4] 📋 Forms encontrados:', forms.length);
                
                forms.forEach((form, index) => {
                  console.log('[DIAGNOSIS-H4] 🔧 Configurando form', index + 1, form);
                  if (!form.onsubmit) {
                    form.onsubmit = function(event) {
                      console.log('[DIAGNOSIS-H4] 📝 Submit interceptado form', index + 1);
                      return window.submitReferralForm(event, form);
                    };
                    console.log('[DIAGNOSIS-H4] ✅ Form', index + 1, 'configurado');
                  }
                });
              };
              
              console.log('[DIAGNOSIS-H4] ✅ Funções inline definidas');
            </script>
            
            <script>
              console.log('[DIAGNOSIS-H4] 🔧 Script de configuração final executando...');
              
              // Configurar dados do indicador para rastreamento
              localStorage.setItem('currentIndicatorCode', '${codigo}');
              localStorage.setItem('currentIndicatorName', '${indicador.name}');
              localStorage.setItem('currentLpDivulgacaoId', '${targetLP._id}');
              
              console.log('[DIAGNOSIS-H4] 💾 LocalStorage configurado:', {
                currentIndicatorCode: '${codigo}',
                currentIndicatorName: '${indicador.name}',
                currentLpDivulgacaoId: '${targetLP._id}'
              });
              
              // Auto-bind dos formulários
              setTimeout(() => {
                console.log('[DIAGNOSIS-H4] ⏰ Auto-bind timeout executando...');
                if (window.bindReferralForms) {
                  console.log('[DIAGNOSIS-H4] 🔗 Chamando bindReferralForms...');
                  window.bindReferralForms();
                } else {
                  console.error('[DIAGNOSIS-H4] ❌ bindReferralForms não encontrada!');
                }
              }, 100);
              
              console.log('[DIAGNOSIS-H4] ✅ Script final configurado');
            </script>
          </body>
          </html>
        `;
        
        // 4. Registrar acesso
        await this.registerAccess(codigo, indicador._id.toString());
        
        // 5. Retornar HTML diretamente
        this.logger.log(`✅ LP renderizada com sucesso para ${indicador.name}`);
        return res.status(HttpStatus.OK).send(htmlContent);
        
      } catch (lpError) {
        this.logger.error(`❌ Erro ao carregar LP: ${lpError.message}`);
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          success: false,
          error: 'Erro ao carregar página de divulgação',
          message: 'Tente novamente em alguns minutos.'
        });
      }

    } catch (error) {
      this.logger.error(`💥 [ERRO DETALHADO] Erro no redirecionamento:`);
      this.logger.error(`- Mensagem: ${error.message}`);
      this.logger.error(`- Stack: ${error.stack}`);
      this.logger.error(`- Código testado: ${codigo}`);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Tente novamente em alguns minutos.',
        debug: error.message // Incluir erro para debug
      });
    }
  }

  /**
   * Registra acesso ao link para analytics futuras
   */
  private async registerAccess(codigo: string, indicadorId: string): Promise<void> {
    try {
      // Por enquanto apenas log, mas pode ser expandido para salvar no banco
      this.logger.log(`📊 Acesso registrado - Código: ${codigo}, Indicador: ${indicadorId}`);
      
      // TODO: Implementar salvamento de analytics se necessário
      // await this.analyticsService.registerLinkAccess(codigo, indicadorId, metadata);
    } catch (error) {
      this.logger.warn(`Falha ao registrar acesso: ${error.message}`);
      // Não falha o fluxo principal se analytics falhar
    }
  }
} 