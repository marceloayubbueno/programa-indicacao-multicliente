import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminsController } from './admins.controller';
import { AdminsService } from './admins.service';
import { UsuarioAdmin, UsuarioAdminSchema } from './entities/usuario-admin.schema';
import { SuperAdminSeedService } from './seed-superadmin';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: UsuarioAdmin.name, schema: UsuarioAdminSchema }]),
  ],
  controllers: [AdminsController],
  providers: [AdminsService, SuperAdminSeedService],
  exports: [AdminsService, SuperAdminSeedService],
})
export class AdminsModule {} 