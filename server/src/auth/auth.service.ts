import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LoginDto } from './dto/login.dto';
import { UsuarioAdmin } from '../admins/entities/usuario-admin.schema';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectModel(UsuarioAdmin.name) private usuarioAdminModel: Model<UsuarioAdmin>,
  ) {}

  async loginAdmin(loginDto: LoginDto) {
    const admin = await this.usuarioAdminModel.findOne({ email: loginDto.email.toLowerCase(), ativo: true }).select('+senha');
    if (!admin) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    const senhaCorreta = await bcrypt.compare(loginDto.password, admin.senha);
    if (!senhaCorreta) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    const payload = { email: admin.email, sub: admin._id, role: admin.role };
    const { senha, ...adminSemSenha } = admin.toObject();
    return {
      access_token: this.jwtService.sign(payload),
      admin: adminSemSenha
    };
  }

  async listAdmins() {
    return await this.usuarioAdminModel.find({}, '-senha');
  }
} 