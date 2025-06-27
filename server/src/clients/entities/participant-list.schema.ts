import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class ParticipantList extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: false })
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'Client', required: true })
  clientId: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Participant' }], default: [] })
  participants: Types.ObjectId[];

  @Prop({ required: true, enum: ['participante', 'indicador', 'influenciador', 'mista'], default: 'participante' })
  tipo: string;

  @Prop({ default: Date.now })
  createdAt?: Date;

  @Prop({ default: Date.now })
  updatedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'Campaign', required: false })
  campaignId?: Types.ObjectId;

  @Prop({ required: false })
  campaignName?: string;

  // Campo auxiliar para resposta, não persistido no banco
  participantCount?: number;
}

export const ParticipantListSchema = SchemaFactory.createForClass(ParticipantList); 