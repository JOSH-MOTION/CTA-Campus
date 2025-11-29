// src/models/Notification.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: string;
  title: string;
  description: string;
  href: string;
  read: boolean;
  date: Date;
}

const NotificationSchema = new Schema<INotification>({
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  href: { type: String, required: true },
  read: { type: Boolean, default: false, index: true },
  date: { type: Date, default: Date.now, index: true },
});

export default mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
