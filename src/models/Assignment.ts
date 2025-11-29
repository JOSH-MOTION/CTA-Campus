// src/models/Assignment.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IAssignment extends Document {
  title: string;
  description: string;
  dueDates: Array<{ day: string; dateTime: Date }>;
  targetGen: string;
  authorId: string;
  subject?: string;
  week?: string;
  createdAt: Date;
}

const AssignmentSchema = new Schema<IAssignment>({
  title: { type: String, required: true, index: true },
  description: { type: String, required: true },
  dueDates: [{ 
    day: String, 
    dateTime: Date 
  }],
  targetGen: { type: String, required: true, index: true },
  authorId: { type: String, required: true, index: true },
  subject: String,
  week: String,
  createdAt: { type: Date, default: Date.now, index: true },
});

export default mongoose.models.Assignment || mongoose.model<IAssignment>('Assignment', AssignmentSchema);
