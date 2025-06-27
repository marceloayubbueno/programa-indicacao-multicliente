import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsuarioAdmin } from '../../admins/entities/usuario-admin.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectModel(UsuarioAdmin.name) private usuarioAdminModel: Model<UsuarioAdmin>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'sua-chave-secreta-aqui',
    });
  }

  async validate(payload: any) {
    const admin = await this.usuarioAdminModel.findById(payload.sub);
    if (!admin) {
      throw new UnauthorizedException('Usuário não encontrado');
    }
    return admin;
  }
} 