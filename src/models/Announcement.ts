// src/models/Announcement.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IAnnouncement extends Document {
  title: string;
  content: string;
  author: string;
  authorId: string;
  targetGen: string;
  imageUrl?: string;
  date: Date;
}

const AnnouncementSchema = new Schema<IAnnouncement>({
  title: { type: String, required: true, index: true },
  content: { type: String, required: true },
  author: { type: String, required: true },
  authorId: { type: String, required: true, index: true },
  targetGen: { type: String, required: true, index: true },
  imageUrl: String,
  date: { type: Date, default: Date.now, index: true },
});

export default mongoose.models.Announcement || mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);
