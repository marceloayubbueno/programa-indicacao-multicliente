import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class UsuarioAdmin extends Document {
  @Prop({ required: true })
  nome: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, select: false })
  senha: string;

  @Prop()
  telefone: string;

  @Prop({ required: true, enum: ['superadmin', 'admin'] })
  role: string;

  @Prop({ default: false })
  superadmin: boolean;

  @Prop({ default: true })
  ativo: boolean;
}

export const UsuarioAdminSchema = SchemaFactory.createForClass(UsuarioAdmin); 