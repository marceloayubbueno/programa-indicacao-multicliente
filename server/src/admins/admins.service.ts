import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsuarioAdmin } from './entities/usuario-admin.schema';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminsService {
  constructor(
    @InjectModel(UsuarioAdmin.name) private adminModel: Model<UsuarioAdmin>,
  ) {}

  async findAll() {
    return this.adminModel.find({}, '-senha');
  }

  async create(createDto, currentUser) {
    if (currentUser.role !== 'superadmin') throw new ForbiddenException('Apenas superadmins podem criar admins');
    const { nome, email, senha, telefone, role, ativo } = createDto;
    const existe = await this.adminModel.findOne({ email });
    if (existe) throw new ForbiddenException('E-mail já cadastrado');
    const hash = await bcrypt.hash(senha, 10);
    const admin = new this.adminModel({ nome, email, senha: hash, telefone, role, ativo, superadmin: role === 'superadmin' });
    await admin.save();
    const { senha: _, ...adminObj } = admin.toObject();
    return { message: 'Admin criado com sucesso.', admin: adminObj };
  }

  async update(id, updateDto, currentUser) {
    if (currentUser.role !== 'superadmin') throw new ForbiddenException('Apenas superadmins podem editar admins');
    const admin = await this.adminModel.findById(id);
    if (!admin) throw new NotFoundException('Admin não encontrado');
    const { nome, email, senha, telefone, role, ativo } = updateDto;
    if (email && email !== admin.email) {
      const existe = await this.adminModel.findOne({ email });
      if (existe) throw new ForbiddenException('E-mail já cadastrado');
      admin.email = email;
    }
    if (nome) admin.nome = nome;
    if (telefone) admin.telefone = telefone;
    if (role) {
      admin.role = role;
      admin.superadmin = role === 'superadmin';
    }
    if (typeof ativo === 'boolean' || ativo === true || ativo === false) admin.ativo = ativo;
    if (senha) admin.senha = await bcrypt.hash(senha, 10);
    await admin.save();
    const { senha: _, ...adminObj } = admin.toObject();
    return { message: 'Admin atualizado com sucesso.', admin: adminObj };
  }

  async remove(id, currentUser) {
    if (currentUser.role !== 'superadmin') throw new ForbiddenException('Apenas superadmins podem remover admins');
    const admin = await this.adminModel.findById(id);
    if (!admin) throw new NotFoundException('Admin não encontrado');
    await this.adminModel.deleteOne({ _id: id });
    return { message: 'Admin removido com sucesso.', admin };
  }
} 