// src/models/User.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  uid: string;
  email: string;
  displayName: string;
  role: 'student' | 'teacher' | 'admin';
  gen?: string;
  schoolId?: string;
  lessonDay?: string;
  lessonType?: string;
  lessonTime?: string;
  hasEditedLessonDetails?: boolean;
  bio?: string;
  photoURL?: string;
  totalPoints: number;
  availability?: Record<string, Array<{ startTime: string; endTime: string }>>;
  availableDays?: string[];
  gensTaught?: string;
  timeSlots?: Array<{ startTime: string; endTime: string }>;
  linkedin?: string;
  github?: string;
  fcmToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    uid: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true },
    displayName: { type: String, required: true },
    role: { type: String, enum: ['student', 'teacher', 'admin'], default: 'student' },
    gen: String,
    schoolId: String,
    lessonDay: String,
    lessonType: String,
    lessonTime: String,
    hasEditedLessonDetails: Boolean,
    bio: String,
    photoURL: String,
    totalPoints: { type: Number, default: 0 },
    availability: { type: Map, of: [{ startTime: String, endTime: String }] },
    availableDays: [String],
    gensTaught: String,
    timeSlots: [{ startTime: String, endTime: String }],
    linkedin: String,
    github: String,
    fcmToken: String,
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

// ==================== POINTS ====================
// src/models/Point.ts
export interface IPoint extends Document {
  userId: string;
  points: number;
  reason: string;
  assignmentTitle?: string;
  activityId: string;
  awardedBy?: string;
  awardedAt: Date;
}

const PointSchema = new Schema<IPoint>({
  userId: { type: String, required: true, index: true },
  points: { type: Number, required: true },
  reason: { type: String, required: true },
  assignmentTitle: String,
  activityId: { type: String, required: true },
  awardedBy: String,
  awardedAt: { type: Date, default: Date.now },
});

export const Point = mongoose.models.Point || mongoose.model<IPoint>('Point', PointSchema);

// ==================== ANNOUNCEMENTS ====================
// src/models/Announcement.ts
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
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: String, required: true },
  authorId: { type: String, required: true, index: true },
  targetGen: { type: String, required: true, index: true },
  imageUrl: String,
  date: { type: Date, default: Date.now, index: true },
});

export const Announcement = mongoose.models.Announcement || mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);

// ==================== ASSIGNMENTS ====================
// src/models/Assignment.ts
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
  title: { type: String, required: true },
  description: { type: String, required: true },
  dueDates: [{ day: String, dateTime: Date }],
  targetGen: { type: String, required: true, index: true },
  authorId: { type: String, required: true, index: true },
  subject: String,
  week: String,
  createdAt: { type: Date, default: Date.now, index: true },
});

export const Assignment = mongoose.models.Assignment || mongoose.model<IAssignment>('Assignment', AssignmentSchema);

// ==================== SUBMISSIONS ====================
// src/models/Submission.ts
export interface ISubmission extends Document {
  studentId: string;
  studentName: string;
  studentGen: string;
  assignmentId: string;
  assignmentTitle: string;
  submissionLink?: string;
  submissionNotes: string;
  pointCategory: string;
  grade?: string;
  feedback?: string;
  imageUrl?: string;
  submittedAt: Date;
  gradedAt?: Date;
  gradedBy?: string;
}

const SubmissionSchema = new Schema<ISubmission>({
  studentId: { type: String, required: true, index: true },
  studentName: { type: String, required: true },
  studentGen: { type: String, required: true, index: true },
  assignmentId: { type: String, required: true, index: true },
  assignmentTitle: { type: String, required: true },
  submissionLink: String,
  submissionNotes: String,
  pointCategory: { type: String, required: true },
  grade: String,
  feedback: String,
  imageUrl: String,
  submittedAt: { type: Date, default: Date.now, index: true },
  gradedAt: Date,
  gradedBy: String,
});

export const Submission = mongoose.models.Submission || mongoose.model<ISubmission>('Submission', SubmissionSchema);

// ==================== NOTIFICATIONS ====================
// src/models/Notification.ts
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
  read: { type: Boolean, default: false },
  date: { type: Date, default: Date.now, index: true },
});

export const Notification = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);

// ==================== ATTENDANCE ====================
// src/models/Attendance.ts
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
  classId: { type: String, required: true },
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

export const Attendance = mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema);