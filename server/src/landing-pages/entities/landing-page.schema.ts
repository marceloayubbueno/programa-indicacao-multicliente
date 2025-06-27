import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LandingPageDocument = LandingPage & Document;

@Schema({ timestamps: true })
export class LandingPage {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string; // URL amigável

  @Prop({ required: true, enum: ['draft', 'published', 'inactive'], default: 'draft' })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'Client', required: true })
  clientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Campaign', required: false })
  campaignId?: Types.ObjectId;

  @Prop({ type: Object, required: true })
  content: any; // JSON com blocos da LP

  @Prop({ type: String, required: false })
  templateId?: string;

  @Prop({ type: [String], required: false })
  images?: string[]; // URLs das imagens usadas na LP
}

export const LandingPageSchema = SchemaFactory.createForClass(LandingPage); 