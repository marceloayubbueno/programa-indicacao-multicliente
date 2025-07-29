import * as dotenv from 'dotenv';
dotenv.config();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, RequestMethod } from '@nestjs/common';
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

@Catch()
class GlobalExceptionLogger implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Erro interno do servidor';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
    } else if (exception.message) {
      message = exception.message;
    }

    console.error('[GLOBAL ERROR]', {
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      status,
      message,
      stack: exception.stack
    });

    response.status(status).json({
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: message,
    });
  }
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // 🔐 AUTO-SEED: Garantir que sempre existe um Super Admin
  try {
    const { SuperAdminSeedService } = await import('./admins/seed-superadmin');
    const seedService = app.get(SuperAdminSeedService);
    await seedService.ensureSuperAdminExists();
  } catch (error) {
    console.error('[BOOT] ❌ Erro no auto-seed do Super Admin:', error.message);
  }
  
  // ✅ SERVIR ARQUIVOS ESTÁTICOS - CONFIGURAÇÃO EXPLÍCITA
  const clientPath = join(__dirname, '..', '..', 'client');
  console.log(`[BOOT] 🔧 Servindo arquivos estáticos de: ${clientPath}`);
  // Servir arquivos estáticos com prefixo explícito
  app.useStaticAssets(clientPath, {
    prefix: '/client/',
    setHeaders: (res, path) => {
      console.log(`[STATIC] Servindo arquivo: ${path}`);
    }
  });

  // NOVO: Servir arquivos estáticos da pasta public na raiz
  const publicPath = join(__dirname, '..', 'public');
  console.log(`[BOOT] 🔧 Servindo arquivos estáticos PUBLIC de: ${publicPath}`);
  app.useStaticAssets(publicPath, {
    prefix: '/', // Serve arquivos de public/ na raiz
    setHeaders: (res, path) => {
      console.log(`[STATIC-PUBLIC] Servindo arquivo: ${path}`);
    }
  });

    // 🔧 CORREÇÃO: Configurar prefixo global, mas excluir rotas públicas e arquivos estáticos
  app.setGlobalPrefix('api', {
    exclude: [
      // Rotas públicas de indicação
      { path: 'indicacao', method: RequestMethod.GET },
      { path: 'indicacao/*', method: RequestMethod.GET },
      { path: 'indicacao/*/preview', method: RequestMethod.GET },
      // Rota raiz e health check
      { path: '', method: RequestMethod.GET },
      { path: 'health', method: RequestMethod.GET },
      // Arquivos estáticos JavaScript e CSS
      { path: 'js/*', method: RequestMethod.GET },
      { path: 'css/*', method: RequestMethod.GET },
      { path: 'assets/*', method: RequestMethod.GET },
    ],
  });
  
  // Configuração global de validação
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // Filtro global para logar qualquer erro
  app.useGlobalFilters(new GlobalExceptionLogger());

  // 🔧 CORS CONFIGURAÇÃO TEMPORÁRIA - PERMISSIVA PARA RESOLVER PROBLEMA
  app.enableCors({
    origin: true, // Permitir todas as origens temporariamente
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });
  
  console.log(`[BOOT] 🌐 CORS configurado para: PERMITIR TODAS AS ORIGENS (TEMPORÁRIO)`);

  // 🚨 DIAGNÓSTICO: Log de configuração de rotas
  console.log(`[BOOT] 🛣️ CONFIGURAÇÃO DE ROTAS:`);
  console.log(`[BOOT] 🛣️ - Prefixo global: /api`);
  console.log(`[BOOT] 🛣️ - Rotas excluídas do prefixo:`);
  console.log(`[BOOT] 🛣️   - Indicação: /indicacao/*`);
  console.log(`[BOOT] 🛣️   - Raiz: / e /health`);
  console.log(`[BOOT] 🛣️   - Estáticos: /js/*, /css/*, /assets/*`);
  console.log(`[BOOT] 🛣️ - Arquivos estáticos servidos de: ${clientPath} e ${publicPath}`);

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`\n[BOOT] 🚀 Backend rodando na porta ${port}`);
  console.log(`[BOOT] 🌐 API disponível em: /api/`);
  console.log(`[BOOT] 🔗 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[BOOT] 🌐 CLIENT_URL: ${process.env.CLIENT_URL || 'NÃO CONFIGURADO'}`);
  console.log(`[BOOT] 🛣️ ROTAS PÚBLICAS: /indicacao/* (excluídas do prefixo /api)\n`);
}
bootstrap();
