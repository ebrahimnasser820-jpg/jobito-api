import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Conversation extends Document {
    @Prop({ required: true, index: true })
    userId: string;

    @Prop({ required: true, unique: true, index: true })
    sessionId: string;

    @Prop([
        {
            sender: { type: String, enum: ['user', 'bot'], required: true },
            type: { type: String, enum: ['text', 'image', 'audio', 'video'], required: true },
            content: { type: String },
            mediaUrl: { type: String },
            timestamp: { type: Date, default: Date.now },
        },
    ])
    messages: {
        sender: string;
        type: string;
        content?: string;
        mediaUrl?: string;
        timestamp: Date;
    }[];

    @Prop({ type: Object, default: {} })
    context: {
        lastIntent?: string;
        detectedSkills?: string[];
    };
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
