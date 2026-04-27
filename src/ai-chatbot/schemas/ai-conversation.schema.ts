import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class AiConversation extends Document {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop([
    {
      role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
      content: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
    },
  ])
  messages: {
    role: string;
    content: string;
    timestamp: Date;
  }[];
}

export const AiConversationSchema = SchemaFactory.createForClass(AiConversation);
