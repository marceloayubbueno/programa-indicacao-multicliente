import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Campaign extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: false })
  description?: string;

  @Prop({ type: Date, required: false })
  startDate?: Date;

  @Prop({ type: Date, required: false })
  endDate?: Date;

  @Prop({ type: Types.ObjectId, ref: 'Client', required: true })
  clientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ParticipantList', required: false })
  participantListId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'LPIndicadores', required: false })
  lpIndicadoresId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'LPDivulgacao', required: false })
  lpDivulgacaoId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Reward', required: false })
  rewardOnReferral?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Reward', required: false })
  rewardOnConversion?: Types.ObjectId;

  @Prop({ required: false, default: 'draft' })
  status?: string;

  @Prop({ required: true })
  type: string;
}

export const CampaignSchema = SchemaFactory.createForClass(Campaign); 