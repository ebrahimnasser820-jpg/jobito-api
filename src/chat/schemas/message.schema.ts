import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Message extends Document {
  @Prop({ type: String, required: true, index: true })
  senderId: string;

  @Prop({ type: String, required: true, index: true })
  recipientId: string;

  @Prop({ type: String })
  message: string;

  @Prop({ type: String, enum: ['text', 'image', 'file', 'video', 'voice'], default: 'text' })
  type: string;

  @Prop({ type: String })
  audioUrl: string;

  @Prop({ type: Number })
  duration: number;

  @Prop({ type: Boolean, default: false })
  isRead: boolean;

  @Prop({ type: String, index: true })
  clientId: string;

  @Prop({ type: Date, default: null })
  readAt: Date;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
