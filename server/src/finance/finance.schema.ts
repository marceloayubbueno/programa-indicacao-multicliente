import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FinanceDocument = Finance & Document;

@Schema({ timestamps: true })
export class Finance {
  @Prop({ type: Types.ObjectId, ref: 'Client', required: true })
  clientId: Types.ObjectId;

  @Prop({ required: true, enum: ['entrada', 'saida'] })
  tipo: 'entrada' | 'saida';

  @Prop({ required: true })
  valor: number;

  @Prop({ required: true })
  data: Date;

  @Prop({ required: true })
  referenciaBanco: string;

  @Prop({ required: true, enum: ['pendente', 'confirmado', 'cancelado'], default: 'pendente' })
  status: 'pendente' | 'confirmado' | 'cancelado';

  @Prop({ required: true, enum: ['pix', 'boleto', 'transferencia', 'manual'] })
  origem: 'pix' | 'boleto' | 'transferencia' | 'manual';

  @Prop()
  descricao?: string;

  @Prop()
  linhaDigitavel?: string;

  @Prop()
  qrCode?: string;

  @Prop()
  vencimento?: Date;
}

export const FinanceSchema = SchemaFactory.createForClass(Finance); 