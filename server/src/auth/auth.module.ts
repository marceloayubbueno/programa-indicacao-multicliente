import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtClientStrategy } from './strategies/jwt-client.strategy';
import { MongooseModule } from '@nestjs/mongoose';
import { UsuarioAdmin, UsuarioAdminSchema } from '../admins/entities/usuario-admin.schema';
import { Client, ClientSchema } from '../clients/entities/client.schema';
import { ClientsModule } from '../clients/clients.module'; // 🚀 NOVO: Import do ClientsModule
import { AdminsModule } from '../admins/admins.module'; // 🚀 NOVO: Import do AdminsModule para SuperAdminSeedService

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'sua-chave-secreta-aqui',
      signOptions: { expiresIn: '1d' },
    }),
    MongooseModule.forFeature([
      { name: UsuarioAdmin.name, schema: UsuarioAdminSchema },
      { name: Client.name, schema: ClientSchema },
    ]),
    ClientsModule, // 🚀 NOVO: Importar ClientsModule para usar ClientsService
    AdminsModule, // 🚀 NOVO: Importar AdminsModule para usar SuperAdminSeedService
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtClientStrategy],
  exports: [AuthService],
})
export class AuthModule {}
