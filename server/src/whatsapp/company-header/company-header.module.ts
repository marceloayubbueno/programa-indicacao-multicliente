import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompanyHeaderController } from './company-header.controller';
import { CompanyHeaderService } from './company-header.service';
import { WhatsAppCompanyHeader, WhatsAppCompanyHeaderSchema } from '../entities/whatsapp-company-header.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WhatsAppCompanyHeader.name, schema: WhatsAppCompanyHeaderSchema },
    ]),
  ],
  controllers: [CompanyHeaderController],
  providers: [CompanyHeaderService],
  exports: [CompanyHeaderService],
})
export class CompanyHeaderModule {}
