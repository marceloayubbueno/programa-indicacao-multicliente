import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Finance, FinanceDocument } from './finance.schema';
import { ConfigService } from '@nestjs/config';
import fetch from 'node-fetch';

@Injectable()
export class FinanceService {
  constructor(
    @InjectModel(Finance.name) private financeModel: Model<FinanceDocument>,
    private readonly configService: ConfigService,
  ) {}

  async getSaldoTotal(): Promise<number> {
    const result = await this.financeModel.aggregate([
      { $match: { status: 'confirmado' } },
      { $group: { _id: null, total: { $sum: '$valor' } } }
    ]);
    return result[0]?.total || 0;
  }

  async getExtrato(): Promise<Finance[]> {
    return this.financeModel.find().sort({ data: -1 }).limit(50).exec();
  }

  // Integração real com Sicoob para emissão de cobrança
  async gerarCobranca(dto: { clientId: string, valor: number, origem: string, descricao?: string }): Promise<Finance> {
    // Montar payload conforme documentação Sicoob
    const payload = {
      // Exemplo de campos, ajustar conforme docs reais do Sicoob
      valor: dto.valor,
      tipo: dto.origem, // 'pix' ou 'boleto'
      descricao: dto.descricao || '',
      // ...outros campos obrigatórios
    };

    // Endpoint e autenticação Sicoob (ajustar para produção)
    const sicoobApiUrl = this.configService.get<string>('SICOOB_API_URL') || 'https://sandbox.sicoob.com.br/api/cobranca';
    const sicoobApiToken = this.configService.get<string>('SICOOB_API_TOKEN') || '';

    let sicoobResponse: any;
    try {
      // Chamada HTTP simulada (ajustar método, headers, body conforme docs reais)
      const response = await fetch(sicoobApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sicoobApiToken}`
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error(`Erro Sicoob: ${response.status} ${response.statusText}`);
      }
      sicoobResponse = await response.json();
    } catch (err) {
      throw new InternalServerErrorException('Erro ao emitir cobrança no Sicoob: ' + err.message);
    }

    // Extrair dados relevantes da resposta do Sicoob
    const linhaDigitavel = sicoobResponse.linhaDigitavel || null;
    const qrCode = sicoobResponse.qrCode || null;
    const vencimento = sicoobResponse.vencimento || null;
    const status = sicoobResponse.status || 'pendente';

    // Salvar no banco
    const mov = new this.financeModel({
      clientId: dto.clientId,
      tipo: 'entrada',
      valor: dto.valor,
      data: new Date(),
      referenciaBanco: sicoobResponse.referencia || ('sicoob-' + Date.now()),
      status,
      origem: dto.origem,
      descricao: dto.descricao || '',
      // Campos extras para exibir no frontend (adicionar no schema se necessário)
      linhaDigitavel,
      qrCode,
      vencimento
    });
    return mov.save();
  }

  async processarWebhook(referenciaBanco: string): Promise<Finance | null> {
    return this.financeModel.findOneAndUpdate(
      { referenciaBanco },
      { status: 'confirmado' },
      { new: true }
    );
  }
} 