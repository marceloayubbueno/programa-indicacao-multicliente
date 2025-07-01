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
  
  // Configurar prefixo global, mas excluir rotas públicas de indicação
  app.setGlobalPrefix('api', {
    exclude: [
      { path: 'indicacao', method: RequestMethod.GET },
      { path: 'indicacao/*', method: RequestMethod.GET },
    ],
  });
  
  // Configuração global de validação
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // Filtro global para logar qualquer erro
  app.useGlobalFilters(new GlobalExceptionLogger());

  // Configuração CORS dinâmica - SEMPRE incluir Vercel e Railway
  const allowedOrigins: string[] = [
    'http://localhost:5501', 
    'http://127.0.0.1:5501',
    'https://programa-indicacao-multicliente.vercel.app', // ✅ FIXO: Vercel sempre permitido
    'https://programa-indicacao-multicliente-production.up.railway.app', // ✅ FIXO: Railway sempre permitido
    ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : [])
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // ✅ CORS mais permissivo: aceitar Vercel e Railway sempre
      if (!origin || 
          allowedOrigins.includes(origin) || 
          origin.includes('programa-indicacao-multicliente.vercel.app') ||
          origin.includes('programa-indicacao-multicliente-production.up.railway.app') ||
          origin.includes('vercel.app') ||
          origin.includes('railway.app')) {
        callback(null, true);
      } else {
        console.log(`[CORS] ❌ Origem bloqueada: ${origin}`);
        callback(new Error('Não permitido pelo CORS'), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  console.log(`[BOOT] 🌐 CORS configurado para:`, allowedOrigins);

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`\n[BOOT] 🚀 Backend rodando na porta ${port}`);
  console.log(`[BOOT] 🌐 API disponível em: /api/`);
  console.log(`[BOOT] 🔗 Environment: ${process.env.NODE_ENV || 'development'}\n`);
}
bootstrap();
