import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { UsuarioAdmin } from './entities/usuario-admin.schema';
import * as bcrypt from 'bcryptjs';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const adminModel = app.get(getModelToken(UsuarioAdmin.name));

  const nome = process.env.ADMIN_NAME || 'Super Admin';
  const email = process.env.ADMIN_EMAIL || 'admin@programa-indicacao.com';
  const senha = process.env.ADMIN_PASSWORD;
  const telefone = process.env.ADMIN_PHONE || '';
  const role = 'superadmin';
  const ativo = true;
  const superadmin = true;
  
  // 🔒 SEGURANÇA: Validar se a senha foi definida via variável de ambiente
  if (!senha) {
    console.error('❌ ERRO DE SEGURANÇA: ADMIN_PASSWORD não definida nas variáveis de ambiente');
    console.error('❌ Configure ADMIN_PASSWORD antes de executar o seed');
    await app.close();
    return;
  }

  const existe = await adminModel.findOne({ email });
  if (existe) {
    console.log('Já existe um superadmin com este e-mail.');
    await app.close();
    return;
  }

  const hash = await bcrypt.hash(senha, 10);
  const admin = new adminModel({ nome, email, senha: hash, telefone, role, ativo, superadmin });
  await admin.save();
  console.log('Superadmin criado com sucesso:', { nome, email });
  await app.close();
}

bootstrap(); 