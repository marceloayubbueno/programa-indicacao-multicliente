import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Participant } from '../../clients/entities/participant.schema';

@Injectable()
export class JwtIndicatorStrategy extends PassportStrategy(Strategy, 'jwt-indicator') {
  constructor(
    @InjectModel(Participant.name) private readonly participantModel: Model<Participant>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'secretKey',
    });
  }

  async validate(payload: any) {
    // Verificar se é token de indicador
    if (payload.type !== 'indicator') {
      return null;
    }

    // Buscar indicador no banco
    const indicator = await this.participantModel.findById(payload.sub)
      .select('_id name email uniqueReferralCode status canIndicate tipo');

    if (!indicator || 
        !['indicador', 'influenciador'].includes(indicator.tipo) ||
        indicator.status !== 'ativo' ||
        !indicator.canIndicate) {
      return null;
    }

    return {
      id: indicator._id.toString(),
      email: indicator.email,
      name: indicator.name,
      referralCode: indicator.uniqueReferralCode,
      type: 'indicator'
    };
  }
} 