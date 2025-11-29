// src/models/Material.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IMaterial extends Document {
  title: string;
  videoUrl?: string;
  slidesUrl?: string;
  subject: string;
  week: string;
  order?: number;
  createdAt: Date;
}

const MaterialSchema = new Schema<IMaterial>({
  title: { type: String, required: true },
  videoUrl: String,
  slidesUrl: String,
  subject: { type: String, required: true, index: true },
  week: { type: String, required: true, index: true },
  order: Number,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Material || mongoose.model<IMaterial>('Material', MaterialSchema);
