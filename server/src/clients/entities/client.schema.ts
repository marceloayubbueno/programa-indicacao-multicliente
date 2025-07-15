import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Plan } from '../../planos/entities/plan.schema';

export type ClientDocument = Client & Document;

@Schema({ timestamps: true })
export class Client {
  @Prop({ required: true })
  companyName: string;

  @Prop({ required: false, unique: true, sparse: true })
  cnpj: string;

  @Prop({ required: true })
  responsibleName: string;

  @Prop({ required: true })
  responsiblePhone: string;

  @Prop({ required: false })
  responsiblePosition: string;

  @Prop({ required: true })
  responsibleEmail: string;

  @Prop({ required: false })
  responsibleCPF: string;

  @Prop({ required: false })
  cep: string;

  @Prop({ required: false })
  street: string;

  @Prop({ required: false })
  number: string;

  @Prop()
  complement?: string;

  @Prop({ required: false })
  neighborhood: string;

  @Prop({ required: false })
  city: string;

  @Prop({ required: false })
  state: string;

  @Prop({ required: true, unique: true })
  accessEmail: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: Types.ObjectId, ref: 'Plan', required: true })
  plan: Plan;

  @Prop({ required: true, enum: ['pendente', 'ativo', 'inativo'], default: 'pendente' })
  status: string;

  @Prop({ required: false })
  employeeCount?: string;

  @Prop({ required: false, default: true })
  profileComplete?: boolean;

  @Prop({ required: false })
  webhookMakeUrl?: string;

  @Prop({ default: Date.now })
  createdAt?: Date;
}

export const ClientSchema = SchemaFactory.createForClass(Client);

// Garante índice único e sparse para cnpj
ClientSchema.index({ cnpj: 1 }, { unique: true, sparse: true }); 