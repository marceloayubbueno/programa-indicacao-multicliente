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
          </head>
          <body>
            <div id="lp-container">
              ${personalizedHtml}
            </div>
            
            <!-- 🔍 DEBUG: Inclusão do script de formulário -->
            <script src="/client/js/lp-referral-form-public.js"></script>
            
            <script>
              // Configurar dados do indicador para rastreamento
              localStorage.setItem('currentIndicatorCode', '${codigo}');
              localStorage.setItem('currentIndicatorName', '${indicador.name}');
              localStorage.setItem('currentLpDivulgacaoId', '${targetLP._id}');
              
              console.log('🎯 LP carregada via indicador:', '${indicador.name}');
              console.log('📊 Tracking configurado para código:', '${codigo}');
              
              // === 🔍 DEBUG LOGS - HIPÓTESE 1 ===
              setTimeout(() => {
                console.log('🔍 [DEBUG-H1] Função submitReferralForm disponível:', typeof window.submitReferralForm);
                console.log('🔍 [DEBUG-H1] Scripts carregados na página:', Array.from(document.scripts).map(s => s.src || 'inline'));
                
                // === 🔍 DEBUG LOGS - HIPÓTESE 2 ===
                console.log('🔍 [DEBUG-H2] Formulários encontrados:', document.querySelectorAll('form').length);
                console.log('🔍 [DEBUG-H2] Formulários com classe lp-referral-form:', document.querySelectorAll('.lp-referral-form').length);
                console.log('🔍 [DEBUG-H2] Event listeners nos formulários:', Array.from(document.querySelectorAll('form')).map(f => !!f.onsubmit));
                
                // === 🔍 DEBUG LOGS - HIPÓTESE 3 ===
                console.log('🔍 [DEBUG-H3] LocalStorage:', {
                  lpId: localStorage.getItem('currentLpDivulgacaoId'),
                  indicatorCode: localStorage.getItem('currentIndicatorCode'),
                  indicatorName: localStorage.getItem('currentIndicatorName')
                });
                console.log('🔍 [DEBUG-H3] URL Params ref:', new URL(window.location.href).searchParams.get('ref'));
              }, 500);
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