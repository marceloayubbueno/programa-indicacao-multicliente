import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type WhatsAppCompanyHeaderDocument = WhatsAppCompanyHeader & Document;

@Schema({ timestamps: true })
export class WhatsAppCompanyHeader {
  @Prop({ required: true, index: true })
  clientId: string;

  @Prop({ required: true, type: Object })
  companyInfo: {
    name: string;
    description?: string;
    website?: string;
    phone?: string;
    email?: string;
    address?: string;
  };

  @Prop({ required: true, type: Object })
  socialMedia: {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    whatsapp?: string;
  };

  @Prop({ required: true, type: Object })
  headerConfig: {
    enabled: boolean;
    separator: string;
    customText?: string;
  };

  @Prop({ required: true, type: Object })
  activeFields: {
    description: boolean;
    website: boolean;
    phone: boolean;
    email: boolean;
    instagram: boolean;
    facebook: boolean;
    linkedin: boolean;
    whatsapp: boolean;
  };

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isVerified: boolean;
}

export const WhatsAppCompanyHeaderSchema = SchemaFactory.createForClass(WhatsAppCompanyHeader);
