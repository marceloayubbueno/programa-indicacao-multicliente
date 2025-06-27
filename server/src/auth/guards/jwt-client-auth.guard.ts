import { Injectable, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtClientAuthGuard extends AuthGuard('jwt-client') {
  private readonly logger = new Logger(JwtClientAuthGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const result = await super.canActivate(context);
    
    if (!result) {
      return false;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // 🔒 SEGURANÇA CRÍTICA: Garantir que o clientId está presente no token
    if (!user?.clientId) {
      this.logger.error('Token JWT não contém clientId - possível tentativa de acesso não autorizado');
      throw new UnauthorizedException('Token inválido - clientId não encontrado');
    }

    // 🔒 ISOLAMENTO: Log de segurança para auditoria
    this.logger.debug(`Cliente autenticado: ${user.clientId} - Email: ${user.email}`);

    return true;
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      this.logger.error('Falha na autenticação JWT:', { error: err?.message, info: info?.message });
      throw err || new UnauthorizedException('Token inválido ou expirado');
    }
    return user;
  }
} 