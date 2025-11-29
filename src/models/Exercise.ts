// src/models/Exercise.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IExercise extends Document {
  title: string;
  description: string;
  targetGen: string;
  authorId: string;
  subject?: string;
  week?: string;
  createdAt: Date;
}

const ExerciseSchema = new Schema<IExercise>({
  title: { type: String, required: true, index: true },
  description: { type: String, required: true },
  targetGen: { type: String, required: true, index: true },
  authorId: { type: String, required: true, index: true },
  subject: String,
  week: String,
  createdAt: { type: Date, default: Date.now, index: true },
});

export default mongoose.models.Exercise || mongoose.model<IExercise>('Exercise', ExerciseSchema);
