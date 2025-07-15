import { Controller, Get, Post, Body, Query, Logger } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Client } from '../clients/entities/client.schema';

@Controller('admin/api/carteira')
export class FinanceController {
  private readonly logger = new Logger(FinanceController.name);
  constructor(
    private readonly financeService: FinanceService,
    @InjectModel(Client.name) private clientModel: Model<Client>,
  ) {}

  @Get('saldo')
  async getSaldoTotal() {
    const saldo = await this.financeService.getSaldoTotal();
    return { saldo };
  }

  @Get('extrato')
  async getExtrato() {
    return this.financeService.getExtrato();
  }

  @Post('gerar-cobranca')
  async gerarCobranca(@Body() dto: { clientId: string, valor: number, origem: string, descricao?: string }) {
    return this.financeService.gerarCobranca(dto);
  }

  @Post('webhook')
  async processarWebhook(@Body() body: { referenciaBanco: string }) {
    return this.financeService.processarWebhook(body.referenciaBanco);
  }

  @Get('clientes')
  async listarClientes() {
    this.logger.log('Endpoint /clientes chamado');
    const clientes = await this.clientModel.find({}, { _id: 1, companyName: 1 });
    this.logger.log(`Clientes retornados: ${JSON.stringify(clientes)}`);
    return clientes;
  }
} 