// src/models/Booking.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IBooking extends Document {
  studentId: string;
  studentName: string;
  staffId: string;
  staffName: string;
  dateTime: Date;
  reason: string;
  meetingType: 'online' | 'in-person';
  status: 'pending' | 'accepted' | 'rejected';
  meetingLink?: string;
  responseNote?: string;
  createdAt: Date;
  respondedAt?: Date;
}

const BookingSchema = new Schema<IBooking>({
  studentId: { type: String, required: true, index: true },
  studentName: String,
  staffId: { type: String, required: true, index: true },
  staffName: String,
  dateTime: { type: Date, required: true, index: true },
  reason: { type: String, required: true },
  meetingType: { type: String, enum: ['online', 'in-person'], required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending', index: true },
  meetingLink: String,
  responseNote: String,
  createdAt: { type: Date, default: Date.now },
  respondedAt: Date,
});

export default mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);

