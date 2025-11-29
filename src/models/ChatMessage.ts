// src/models/ChatMessage.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage extends Document {
  chatId: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  replyTo?: {
    messageId: string;
    text: string;
    senderName: string;
  };
  isPinned?: boolean;
  edited?: boolean;
}

const ChatMessageSchema = new Schema<IChatMessage>({
  chatId: { type: String, required: true, index: true },
  text: { type: String, required: true },
  senderId: { type: String, required: true, index: true },
  senderName: { type: String, required: true },
  timestamp: { type: Date, default: Date.now, index: true },
  replyTo: {
    messageId: String,
    text: String,
    senderName: String,
  },
  isPinned: Boolean,
  edited: Boolean,
});

export default mongoose.models.ChatMessage || mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
