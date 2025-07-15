import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Finance, FinanceSchema } from './finance.schema';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { Client, ClientSchema } from '../clients/entities/client.schema';

@Module({
  imports: [MongooseModule.forFeature([
    { name: Finance.name, schema: FinanceSchema },
    { name: Client.name, schema: ClientSchema },
  ])],
  providers: [FinanceService],
  controllers: [FinanceController],
  exports: [FinanceService],
})
export class FinanceModule {} 