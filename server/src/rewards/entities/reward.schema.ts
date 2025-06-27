import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RewardDocument = Reward & Document;

export enum RewardType {
  PIX = 'pix',
  PONTOS = 'pontos',
  DESCONTO = 'desconto',
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
}

export const RewardSchema = SchemaFactory.createForClass(Reward); 