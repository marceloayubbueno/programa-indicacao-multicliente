import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Client } from '../../clients/entities/client.schema';

@Injectable()
export class JwtClientStrategy extends PassportStrategy(Strategy, 'jwt-client') {
  constructor(
    @InjectModel(Client.name) private clientModel: Model<Client>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'sua-chave-secreta-aqui',
    });
  }

  async validate(payload: any) {
    // 🚀 NOVO: Validação mais robusta do payload
    if (!payload.clientId || !payload.sub) {
      throw new UnauthorizedException('Token inválido - dados incompletos');
    }

    const client = await this.clientModel.findById(payload.sub);
    if (!client) {
      throw new UnauthorizedException('Cliente não encontrado');
    }

    if (client.status !== 'ativo') {
      throw new UnauthorizedException('Cliente inativo');
    }

    // 🔒 SEGURANÇA: Retorna objeto user com clientId explícito para isolamento de dados
    return {
      clientId: payload.clientId,
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      client: client // Objeto completo para casos específicos
    };
  }
} 