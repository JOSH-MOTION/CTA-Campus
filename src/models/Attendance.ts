// src/models/Attendance.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendance extends Document {
  studentId: string;
  studentName: string;
  studentGen: string;
  classId: string;
  className: string;
  learned: string;
  challenged: string;
  questions?: string;
  rating: number;
  attendanceType: 'virtual' | 'in-person';
  understanding: number;
  actionPlan: string;
  preClassReview: 'yes' | 'no';
  submittedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>({
  studentId: { type: String, required: true, index: true },
  studentName: { type: String, required: true },
  studentGen: { type: String, required: true, index: true },
  classId: { type: String, required: true, index: true },
  className: { type: String, required: true },
  learned: { type: String, required: true },
  challenged: { type: String, required: true },
  questions: String,
  rating: { type: Number, required: true, min: 1, max: 10 },
  attendanceType: { type: String, enum: ['virtual', 'in-person'], required: true },
  understanding: { type: Number, required: true, min: 1, max: 10 },
  actionPlan: { type: String, required: true },
  preClassReview: { type: String, enum: ['yes', 'no'], required: true },
  submittedAt: { type: Date, default: Date.now, index: true },
});

export default mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema);

