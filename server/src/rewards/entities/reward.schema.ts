import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RewardDocument = Reward & Document;

export enum RewardType {
  // TIPOS EXISTENTES (NÃO ALTERAR - JÁ FUNCIONAM)
  PIX = 'pix',
  PONTOS = 'pontos',
  DESCONTO = 'desconto',
  
  // NOVOS TIPOS (ADICIONADOS INCREMENTALMENTE)
  DESCONTO_VALOR_FINANCEIRO = 'desconto_valor_financeiro',
  VALOR_FIXO = 'valor_fixo',
  VALOR_PERCENTUAL = 'valor_percentual',
  DESCONTO_RECORRENTE = 'desconto_recorrente',
  CASHBACK = 'cashback',
  CREDITO_DIGITAL = 'credito_digital',
  PRODUTO_GRATIS = 'produto_gratis',
  COMISSAO_RECORRENTE = 'comissao_recorrente',
  BONUS_VOLUME = 'bonus_volume',
  DESCONTO_PROGRESSIVO = 'desconto_progressivo',
  VALE_PRESENTE = 'vale_presente',
  VALOR_CONVERSAO = 'valor_conversao',
  META = 'meta',
}

export enum RewardStatus {
  PENDENTE = 'pendente',
  APROVADA = 'aprovada',
  PAGA = 'paga',
  CANCELADA = 'cancelada',
}

@Schema({ timestamps: true })
export class Reward {
  @Prop({ type: String, enum: RewardType, required: true })
  type: RewardType;

  @Prop({ required: true })
  value: number;

  @Prop({ type: String, enum: RewardStatus, default: RewardStatus.PENDENTE })
  status: RewardStatus;

  @Prop({ type: Types.ObjectId, ref: 'Campaign', required: false })
  campaignId?: Types.ObjectId;

  @Prop({ required: false })
  campaignName?: string;

  @Prop({ type: String })
  description?: string;

  @Prop({ type: Date })
  paymentDate?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  indicator?: Types.ObjectId;

  @Prop({
    type: [
      {
        status: { type: String, enum: RewardStatus },
        date: { type: Date },
        changedBy: { type: Types.ObjectId, ref: 'User' },
      },
    ],
    default: [],
  })
  history?: Array<{
    status: RewardStatus;
    date: Date;
    changedBy?: Types.ObjectId;
  }>;

  @Prop({ type: String })
  paymentGatewayId?: string;

  @Prop({ type: Types.ObjectId, ref: 'Client', required: true })
  clientId: Types.ObjectId;

  // CAMPOS ADICIONAIS PARA NOVOS TIPOS (OPCIONAIS - NÃO QUEBRAM FUNCIONALIDADE EXISTENTE)
  @Prop({ required: false })
  fixedValue?: number; // Para VALOR_FIXO

  @Prop({ required: false })
  percentageValue?: number; // Para VALOR_PERCENTUAL

  @Prop({ required: false })
  baseValue?: number; // Para VALOR_PERCENTUAL sem valor base

  @Prop({ required: false })
  cupomCode?: string; // Para DESCONTO

  @Prop({ required: false })
  validadeDias?: number; // Para DESCONTO

  @Prop({ required: false })
  limiteUso?: number; // Para DESCONTO
}

export const RewardSchema = SchemaFactory.createForClass(Reward); 