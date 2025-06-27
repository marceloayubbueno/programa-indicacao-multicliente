import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsuarioAdmin } from './entities/usuario-admin.schema';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class SuperAdminSeedService {
  constructor(
    @InjectModel(UsuarioAdmin.name) private usuarioAdminModel: Model<UsuarioAdmin>,
  ) {}

  /**
   * Garante que sempre existe um super admin no sistema
   * Roda automaticamente na inicialização
   */
  async ensureSuperAdminExists(): Promise<void> {
    try {
      // Verificar se existe algum super admin
      const superAdminExists = await this.usuarioAdminModel.findOne({ 
        role: 'superadmin',
        ativo: true 
      });

      if (!superAdminExists) {
        console.log('🔧 Super Admin não encontrado. Criando super admin padrão...');
        await this.createDefaultSuperAdmin();
        console.log('✅ Super Admin criado com sucesso!');
      } else {
        console.log('✅ Super Admin já existe no sistema.');
      }
    } catch (error) {
      console.error('❌ Erro ao verificar/criar Super Admin:', error.message);
    }
  }

  /**
   * Cria o super admin padrão usando variáveis de ambiente
   */
  private async createDefaultSuperAdmin(): Promise<void> {
    const defaultEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@programa-indicacao.com';
    const defaultPassword = process.env.SUPER_ADMIN_PASSWORD || 'Admin@123456';
    const defaultName = process.env.SUPER_ADMIN_NAME || 'Super Administrador';

    // Hash da senha
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Criar super admin
    const superAdmin = new this.usuarioAdminModel({
      nome: defaultName,
      email: defaultEmail.toLowerCase(),
      senha: hashedPassword,
      telefone: '',
      role: 'superadmin',
      ativo: true,
      superadmin: true,
      criadoEm: new Date(),
      atualizadoEm: new Date()
    });

    await superAdmin.save();

    console.log(`📧 Super Admin criado: ${defaultEmail}`);
    console.log(`🔐 Senha: ${defaultPassword}`);
    console.log('⚠️  IMPORTANTE: Altere a senha após o primeiro login!');
  }

  /**
   * Método para recriar super admin se necessário (uso manual)
   */
  async recreateSuperAdmin(): Promise<{ success: boolean; message: string; admin?: any }> {
    try {
      // Remover super admin existente (se houver)
      await this.usuarioAdminModel.deleteMany({ role: 'superadmin' });
      
      // Criar novo super admin
      await this.createDefaultSuperAdmin();

      const newSuperAdmin = await this.usuarioAdminModel.findOne(
        { role: 'superadmin' },
        '-senha'
      );

      return {
        success: true,
        message: 'Super Admin recriado com sucesso',
        admin: newSuperAdmin
      };
    } catch (error) {
      return {
        success: false,
        message: `Erro ao recriar Super Admin: ${error.message}`
      };
    }
  }
} 