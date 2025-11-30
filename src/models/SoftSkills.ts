// src/models/SoftSkills.ts
import mongoose, { Schema, Document } from 'mongoose';

// Base interface for all soft skills documents
export interface ISoftSkillsBase extends Document {
  type: 'module' | 'event' | 'attendance' | 'job' | 'application' | 'session';
  createdAt: Date;
  updatedAt: Date;
}

// Module submission
export interface IModuleSubmission extends ISoftSkillsBase {
  type: 'module';
  moduleId: string;
  studentId: string;
  studentName: string;
  studentGen: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  approvedAt?: Date;
  approvedBy?: string;
  notes?: string;
}

// Event
export interface IEvent extends ISoftSkillsBase {
  type: 'event';
  name: string;
  date: string;
  eventType: 'virtual' | 'in-person';
  location?: string;
  description: string;
  link?: string;
  createdBy: string;
}

// Event attendance
export interface IEventAttendance extends ISoftSkillsBase {
  type: 'attendance';
  eventId: string;
  studentId: string;
  studentName: string;
  studentGen: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  approvedAt?: Date;
  approvedBy?: string;
  notes?: string;
}

// Job post
export interface IJobPost extends ISoftSkillsBase {
  type: 'job';
  title: string;
  company: string;
  jobType: 'internship' | 'full-time' | 'part-time' | 'contract';
  location: string;
  description: string;
  applicationUrl: string;
  postedBy: string;
  postedAt: Date;
}

// Job application
export interface IApplication extends ISoftSkillsBase {
  type: 'application';
  jobId: string;
  studentId: string;
  studentName: string;
  studentGen: string;
  status: 'pending' | 'approved' | 'rejected';
  screenshotUrl: string;
  submittedAt: Date;
  approvedAt?: Date;
  approvedBy?: string;
  notes?: string;
}

// Career session
export interface ISession extends ISoftSkillsBase {
  type: 'session';
  studentId: string;
  studentName: string;
  studentGen: string;
  bookingLink: string;
  scheduledDate: string;
  topic: string;
  status: 'pending' | 'completed' | 'cancelled';
  bookedAt: Date;
  completedAt?: Date;
  completedBy?: string;
}

const SoftSkillsSchema = new Schema<ISoftSkillsBase>(
  {
    type: { 
      type: String, 
      required: true, 
      enum: ['module', 'event', 'attendance', 'job', 'application', 'session'],
      index: true 
    },
    // Module fields
    moduleId: String,
    // Event fields
    name: String,
    date: String,
    eventType: { type: String, enum: ['virtual', 'in-person'] },
    location: String,
    description: String,
    link: String,
    // Common fields
    studentId: { type: String, index: true },
    studentName: String,
    studentGen: { type: String, index: true },
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'],
      index: true 
    },
    submittedAt: Date,
    approvedAt: Date,
    approvedBy: String,
    notes: String,
    // Job fields
    title: String,
    company: String,
    jobType: { type: String, enum: ['internship', 'full-time', 'part-time', 'contract'] },
    applicationUrl: String,
    postedBy: String,
    postedAt: Date,
    // Application fields
    jobId: { type: String, index: true },
    eventId: { type: String, index: true },
    screenshotUrl: String,
    // Session fields
    bookingLink: String,
    scheduledDate: String,
    topic: String,
    bookedAt: Date,
    completedAt: Date,
    completedBy: String,
    createdBy: String,
  },
  { timestamps: true }
);

// Indexes for common queries
SoftSkillsSchema.index({ type: 1, studentId: 1 });
SoftSkillsSchema.index({ type: 1, status: 1 });
SoftSkillsSchema.index({ type: 1, studentGen: 1 });

export default mongoose.models.SoftSkills || 
  mongoose.model<ISoftSkillsBase>('SoftSkills', SoftSkillsSchema);