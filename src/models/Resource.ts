// src/models/Resource.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IResource extends Document {
  title: string;
  description: string;
  content: string;
  url?: string;
  type: 'Article' | 'Video' | 'Link' | 'Document';
  authorId: string;
  createdAt: Date;
}

const ResourceSchema = new Schema<IResource>({
  title: { type: String, required: true, index: true },
  description: { type: String, required: true },
  content: { type: String, required: true },
  url: String,
  type: { type: String, enum: ['Article', 'Video', 'Link', 'Document'], required: true },
  authorId: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now, index: true },
});

export default mongoose.models.Resource || mongoose.model<IResource>('Resource', ResourceSchema);
