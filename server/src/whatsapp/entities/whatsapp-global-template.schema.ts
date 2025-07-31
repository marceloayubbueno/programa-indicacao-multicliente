import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type WhatsAppGlobalTemplateDocument = WhatsAppGlobalTemplate & Document;

@Schema({ timestamps: true })
export class WhatsAppGlobalTemplate {
  @Prop({ required: true })
  name: string; // Nome do template

  @Prop({ required: true, enum: ['indicadores', 'leads', 'geral'] })
  category: string; // Categoria do template

  @Prop({ required: true, default: 'pt-BR' })
  language: string; // Idioma do template

  @Prop({ type: Object, required: true })
  content: {
    body: string; // Conteúdo principal da mensagem
    header?: {
      type: string;
      text?: string;
      mediaUrl?: string;
    };
    footer?: string;
    buttons?: Array<{
      type: string;
      text: string;
      url?: string;
      phoneNumber?: string;
    }>;
  };

  @Prop({ required: true, enum: ['active', 'inactive'], default: 'active' })
  status: string; // Status do template

  @Prop({ type: [String], default: [] })
  variables: string[]; // Variáveis detectadas no template

  @Prop({ default: true })
  isGlobal: boolean; // Sempre true para templates globais

  @Prop()
  templateId?: string; // ID do template no provedor (se aplicável)
}

export const WhatsAppGlobalTemplateSchema = SchemaFactory.createForClass(WhatsAppGlobalTemplate); 