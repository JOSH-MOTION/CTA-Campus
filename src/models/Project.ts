// src/models/Project.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
  title: string;
  description: string;
  targetGen: string;
  authorId: string;
  createdAt: Date;
}

const ProjectSchema = new Schema<IProject>({
  title: { type: String, required: true, index: true },
  description: { type: String, required: true },
  targetGen: { type: String, required: true, index: true },
  authorId: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now, index: true },
});

export default mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);
