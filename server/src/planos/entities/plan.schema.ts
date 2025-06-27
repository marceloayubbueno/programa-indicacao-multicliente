import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PlanDocument = Plan & Document;

@Schema({ timestamps: true })
export class Plan {
  @Prop({ required: true })
  nome: string;

  @Prop()
  descricao?: string;

  @Prop({ required: true, type: Number })
  preco: number;

  @Prop({ required: true, type: Number })
  periodoTrial: number;

  @Prop({ required: true, type: Number })
  limiteIndicadores: number;

  @Prop({ required: true, type: Number })
  limiteIndicacoes: number;

  @Prop({ required: true, type: Object, default: {} })
  funcionalidades: Record<string, boolean>;
}

export const PlanSchema = SchemaFactory.createForClass(Plan); 