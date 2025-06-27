import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 🚀 Decorator para extrair automaticamente o clientId do JWT
 * Uso: @ClientId() clientId: string
 * 
 * Garante isolamento de dados entre clientes de forma automática
 */
export const ClientId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user?.clientId) {
      throw new Error('ClientId não encontrado no token JWT');
    }
    
    return user.clientId;
  },
);

/**
 * 🔒 Decorator para extrair o objeto user completo autenticado
 * Uso: @CurrentUser() user: AuthenticatedUser
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

/**
 * 📝 Interface para tipagem do user autenticado
 */
export interface AuthenticatedUser {
  clientId: string;
  userId: string;
  email: string;
  role: string;
  client: any; // Objeto completo do cliente
} 