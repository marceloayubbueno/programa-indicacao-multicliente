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
   * 🚨 ENDPOINT DE DEBUG - TESTAR SE PROXY FUNCIONA
   */
  @Get('debug-proxy-test')
  async debugProxyTest(@Res() res: Response) {
    console.log(`🚨 [DEBUG-PROXY-TEST] ENDPOINT FUNCIONANDO! Timestamp: ${new Date().toISOString()}`);
    return res.json({
      success: true,
      message: 'PROXY FUNCIONANDO! Request chegou no Railway.',
      timestamp: new Date().toISOString(),
      clientUrl: process.env.CLIENT_URL,
      environment: process.env.NODE_ENV
    });
  }

  /**
   * 🚨 ENDPOINT DE TESTE - VERIFICAR SE ROTAS ESTÃO FUNCIONANDO
   */
  @Get('test-route')
  async testRoute() {
    console.log(`🚨 [TEST-ROUTE] Endpoint de teste acessado!`);
    return {
      success: true,
      message: 'Rota de indicação funcionando!',
      timestamp: new Date().toISOString(),
      routes: [
        '/indicacao/test-route',
        '/indicacao/debug-proxy-test',
        '/indicacao/:codigo/preview',
        '/indicacao/:codigo'
      ]
    };
  }







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
    // 🚨 [H1] DIAGNÓSTICO PROXY VERCEL - Verificar se requisições chegam ao Railway
    console.log(`🚨 [H1-PROXY] ========== NOVA REQUISIÇÃO ==========`);
    console.log(`🚨 [H1-PROXY] Timestamp: ${new Date().toISOString()}`);
    console.log(`🚨 [H1-PROXY] Código recebido: ${codigo}`);
    console.log(`🚨 [H1-PROXY] Method: ${res.req.method}`);
    console.log(`🚨 [H1-PROXY] URL completa: ${res.req.url}`);
    console.log(`🚨 [H1-PROXY] Protocol: ${res.req.protocol}`);
    console.log(`🚨 [H1-PROXY] Host: ${res.req.get('host')}`);
    console.log(`🚨 [H1-PROXY] User-Agent: ${res.req.get('user-agent')}`);
    console.log(`🚨 [H1-PROXY] Referer: ${res.req.get('referer')}`);
    
    // 🚨 [H5] DIAGNÓSTICO CORS/HEADERS - Headers detalhados
    console.log(`🚨 [H5-CORS] ========== HEADERS RECEBIDOS ==========`);
    Object.keys(res.req.headers).forEach(key => {
      console.log(`🚨 [H5-CORS] ${key}: ${res.req.headers[key]}`);
    });
    
    // 🚨 [H4] DIAGNÓSTICO URLs - Variáveis de ambiente
    console.log(`🚨 [H4-URLS] ========== CONFIGURAÇÕES DE AMBIENTE ==========`);
    console.log(`🚨 [H4-URLS] CLIENT_URL: ${process.env.CLIENT_URL}`);
    console.log(`🚨 [H4-URLS] API_BASE_URL: ${process.env.API_BASE_URL}`);
    console.log(`🚨 [H4-URLS] NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`🚨 [H4-URLS] PORT: ${process.env.PORT}`);
    console.log(`🚨 [H4-URLS] RAILWAY_PUBLIC_DOMAIN: ${process.env.RAILWAY_PUBLIC_DOMAIN}`);
    
    console.log(`🚨 [DEBUG-PROXY] REQUEST CHEGOU NO RAILWAY! Código: ${codigo}`);
    console.log(`🚨 [DEBUG-PROXY] Headers: ${JSON.stringify(res.req.headers)}`);
    console.log(`🚨 [DEBUG-PROXY] Query Params: ${JSON.stringify(queryParams)}`);
    console.log(`🚨 [DEBUG-PROXY] CLIENT_URL atual: ${process.env.CLIENT_URL}`);
    this.logger.log(`🔗 Acesso via link de indicação: ${codigo}`);

    try {
      // 1. Validar código do indicador
      console.log(`🚨 [DEBUG-VALIDATION] Iniciando validação do código: ${codigo}`);
      const validation = await this.participantsService.validateReferralCode(codigo);
      console.log(`🚨 [DEBUG-VALIDATION] Resultado da validação:`, validation);
      
      if (!validation.valid) {
        console.log(`🚨 [DEBUG-VALIDATION] ❌ CÓDIGO INVÁLIDO! Erro: ${validation.error}`);
        this.logger.warn(`❌ Código inválido: ${codigo} - ${validation.error}`);
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          error: 'Link de indicação inválido ou expirado',
          message: 'Verifique se o link está correto ou solicite um novo link ao indicador.',
          debug: {
            codigo,
            validationResult: validation,
            timestamp: new Date().toISOString()
          }
        });
      }

      const indicador = validation.participant!;
      this.logger.log(`✅ Indicador encontrado: ${indicador.name} (${indicador.email})`);

      // 2. Buscar LP de Divulgação ativa do cliente
      let targetLP: any = null;
      
      // Extrair clientId corretamente
      const clientIdString = indicador.clientId._id ? indicador.clientId._id.toString() : indicador.clientId.toString();
      this.logger.log(`🔍 Buscando LPs para cliente: ${clientIdString}`);
      
      // 🚨 [H3] DIAGNÓSTICO LP DIVULGAÇÃO - Busca detalhada
      console.log(`🚨 [H3-LP] ========== BUSCANDO LP DE DIVULGAÇÃO ==========`);
      console.log(`🚨 [H3-LP] Timestamp: ${new Date().toISOString()}`);
      console.log(`🚨 [H3-LP] Cliente ID: ${clientIdString}`);
      console.log(`🚨 [H3-LP] Indicador: ${indicador.name} (${indicador.email})`);
      console.log(`🚨 [H3-LP] Indicador ClientId original:`, indicador.clientId);
      
      try {
        console.log(`🚨 [H3-LP] 🔍 Chamando lpDivulgacaoService.findAll(${clientIdString})...`);
        const lpsFromClient = await this.lpDivulgacaoService.findAll(clientIdString);
        
        console.log(`🚨 [H3-LP] LPs encontradas:`, {
          total: lpsFromClient?.length || 0,
          lps: lpsFromClient?.map(lp => ({
            name: lp.name,
            slug: lp.slug,
            status: lp.status
          })) || []
        });
        
        if (lpsFromClient && lpsFromClient.length > 0) {
          const publishedLPs = lpsFromClient.filter(lp => lp.status === 'published');
          console.log(`🚨 [H3-LP] LPs publicadas:`, {
            total: publishedLPs.length,
            lps: publishedLPs.map(lp => ({
              name: lp.name,
              slug: lp.slug,
              status: lp.status
            }))
          });
          
          targetLP = publishedLPs[0] || null;
          console.log(`🚨 [H3-LP] LP selecionada:`, {
            selected: !!targetLP,
            lpName: targetLP?.name,
            lpSlug: targetLP?.slug
          });
          
          this.logger.log(`🎯 LP encontrada: ${targetLP?.name || 'Nenhuma publicada'}`);
        } else {
          console.log(`🚨 [H3-LP] ❌ NENHUMA LP ENCONTRADA para cliente: ${clientIdString}`);
          
          // 🚨 [H3] DIAGNÓSTICO EXTRA: Verificar se existem LPs para outros clientes
          try {
            const allLPs = await this.lpDivulgacaoService.findAll('');
            console.log(`🚨 [H3-LP] Total de LPs no sistema: ${allLPs?.length || 0}`);
            
            if (allLPs && allLPs.length > 0) {
              const distinctClients = [...new Set(allLPs.map(lp => lp.clientId?.toString()))];
              console.log(`🚨 [H3-LP] Clientes com LP: ${distinctClients.length}`, distinctClients);
            }
          } catch (allLpsError) {
            console.log(`🚨 [H3-LP] Erro ao buscar todas as LPs:`, allLpsError.message);
          }
        }
      } catch (error) {
        console.error(`🚨 [H3-LP] 💥 ERRO AO BUSCAR LPs:`, error);
        console.error(`🚨 [H3-LP] Stack trace:`, error.stack);
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
          </head>
          <body>
            <div id="lp-container">
              ${personalizedHtml}
            </div>
            
            <!-- Script de formulário inline -->
            <script>
              // === SCRIPT DE FORMULÁRIO INLINE ===
              window.submitReferralForm = async function(event, form) {
                event.preventDefault();

                const feedback = form.querySelector('.feedback') || form.querySelector('[class*="feedback"]');
                
                // Capturar dados do formulário
                const formData = new FormData(form);
                const name = formData.get('name') || '';
                const email = formData.get('email') || '';
                const phone = formData.get('phone') || '';
                const company = formData.get('company') || '';

                // Validação básica
                if (!name || !email) {
                  const message = 'Por favor, preencha nome e e-mail.';
                  if (feedback) { 
                    feedback.textContent = message; 
                    feedback.style.color = 'red'; 
                  }
                  return false;
                }

                // Buscar ID da LP
                const lpId = localStorage.getItem('currentLpDivulgacaoId');
                
                if (!lpId) {
                  if (feedback) { 
                    feedback.textContent = 'Erro: Contexto da LP não encontrado.'; 
                    feedback.style.color = 'red'; 
                  }
                  return false;
                }

                // Buscar informações do indicador do localStorage
                const indicatorCode = localStorage.getItem('currentIndicatorCode');
                const indicatorName = localStorage.getItem('currentIndicatorName');

                // Captura dados de origem (UTM, referrer, userAgent, etc)
                const urlParams = new URL(window.location.href).searchParams;
                const indicatorCodeFromUrl = urlParams.get('ref') || '';
                const finalIndicatorCode = indicatorCodeFromUrl || indicatorCode || '';

                // Monta payload com código do indicador
                const payload = {
                  name, email, phone, company, lpId,
                  indicatorCode: finalIndicatorCode || null,
                  indicatorName: indicatorName || null,
                  referrerUrl: document.referrer,
                  userAgent: navigator.userAgent,
                  language: navigator.language
                };

                try {
                  // 🌍 USAR URL CORRETA DA API - CORREÇÃO CRÍTICA
                  const apiUrl = 'https://programa-indicacao-multicliente-production.up.railway.app/api';
                  const fullUrl = \`\${apiUrl}/lp-divulgacao/submit-referral\`;
                  
                  console.log('📡 [LP-FORM] Enviando para:', fullUrl);
                  console.log('📡 [LP-FORM] Payload:', payload);
                  
                  const response = await fetch(fullUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                  });
                  
                  console.log('📡 [LP-FORM] Status da resposta:', response.status);
                  const result = await response.json();
                  console.log('📡 [LP-FORM] Resultado:', result);
                  
                  if (response.ok && result.success) {
                    if (feedback) { 
                      feedback.textContent = 'Envio concluído! Obrigado pela indicação.'; 
                      feedback.style.color = 'green'; 
                    }
                    form.reset();
                    
                    // Redirecionar se necessário
                    setTimeout(() => {
                      if (result.data && result.data.redirectUrl) {
                        window.location.href = result.data.redirectUrl;
                      }
                    }, 2000);
                    
                  } else {
                    if (feedback) { 
                      feedback.textContent = result.message || 'Erro ao enviar indicação.'; 
                      feedback.style.color = 'red'; 
                    }
                  }
                } catch (err) {
                  console.error('❌ [LP-FORM] Erro:', err);
                  if (feedback) { 
                    feedback.textContent = 'Erro de conexão. Tente novamente.'; 
                    feedback.style.color = 'red'; 
                  }
                }
                return false;
              };

              // === FUNÇÃO PARA GERAR LINKS CORRETOS ===
              window.generateReferralLink = function(code) {
                // 🌍 URL CORRETA PARA LINKS DE INDICAÇÃO
                return \`https://lp.virallead.com.br/indicacao/\${code}\`;
              };

              // === FUNÇÃO PARA AUTO-BIND DOS FORMULÁRIOS ===
              window.bindReferralForms = function() {
                console.log('🔗 [LP-FORM] Iniciando auto-bind dos formulários...');
                
                // Buscar TODOS os formulários na página
                const forms = document.querySelectorAll('form');
                console.log('🔗 [LP-FORM] Encontrados ' + forms.length + ' formulários');
                
                forms.forEach((form, index) => {
                  console.log('🔗 [LP-FORM] Processando formulário ' + (index + 1) + ':', form);
                  
                  // 🔧 CORREÇÃO: Usar APENAS addEventListener para evitar duplicação
                  // Remover qualquer onsubmit existente para garantir limpeza
                  form.onsubmit = null;
                  
                  // Adicionar APENAS um listener de submit
                  form.addEventListener('submit', function(event) {
                    console.log('🔗 [LP-FORM] Event listener capturou submit do formulário ' + (index + 1));
                    return window.submitReferralForm(event, form);
                  });
                });
                
                console.log('🔗 [LP-FORM] Auto-bind concluído! (Sem duplicação)');
              };
            </script>
            
            <script>
              // Configurar dados do indicador para rastreamento
              localStorage.setItem('currentIndicatorCode', '${codigo}');
              localStorage.setItem('currentIndicatorName', '${indicador.name}');
              localStorage.setItem('currentLpDivulgacaoId', '${targetLP._id}');
              
              // Auto-bind dos formulários
              setTimeout(() => {
                if (window.bindReferralForms) {
                  window.bindReferralForms();
                }
              }, 100);
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