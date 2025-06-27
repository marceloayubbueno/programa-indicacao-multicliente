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

  // Configuração CORS dinâmica
  const allowedOrigins: string[] = [
    'http://localhost:5501', 
    'http://127.0.0.1:5501',
    ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : [])
  ];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  console.log(`[BOOT] 🌐 CORS configurado para:`, allowedOrigins);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`\n[BOOT] Backend rodando em http://localhost:${port}/api\n`);
}
bootstrap();
