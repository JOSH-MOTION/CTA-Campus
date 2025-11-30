// src/models/StudentReport.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ICareerModule {
  name: string;
  completed: boolean;
  points: number;
  completedAt?: Date;
}

export interface IEventWorkshop {
  name: string;
  date: string;
  attended: boolean;
}

export interface IInternshipApplication {
  company: string;
  role: string;
  date: string;
  status: 'Pending' | 'Interview' | 'Rejected' | 'Accepted';
}

export interface IOneOnOneSession {
  with: string;
  topic: string;
  date: string;
  completed: boolean;
}

export interface ICVPortfolio {
  cvStatus: 'Not Submitted' | 'Under Review' | 'Reviewed' | 'Approved';
  cvLastUpdated?: string;
  portfolioStatus: 'Not Submitted' | 'Under Review' | 'Needs Improvement' | 'Approved';
  portfolioUrl?: string;
  portfolioLastUpdated?: string;
}

export interface IStudentReport extends Document {
  studentId: string;
  studentName: string;
  gen: string;
  email: string;
  
  // Academic Performance
  attendance: { current: number; total: number; percentage: number };
  assignments: { current: number; total: number; percentage: number };
  exercises: { current: number; total: number; percentage: number };
  weeklyProjects: { current: number; total: number; percentage: number };
  monthlyProjects: { current: number; total: number; percentage: number };
  hundredDaysOfCode: { current: number; total: number; percentage: number };
  codeReview: { current: number; total: number; percentage: number };
  finalProject: { current: number; total: number; percentage: number };
  softSkills: { current: number; total: number; percentage: number };
  miniDemoDays: { current: number; total: number; percentage: number };
  
  // Career Module Data
  careerModules: {
    completed: number;
    total: number;
    modules: ICareerModule[];
  };
  
  eventsWorkshops: {
    attended: number;
    required: number;
    percentage: number;
    events: IEventWorkshop[];
  };
  
  internshipApplications: {
    submitted: number;
    required: number;
    percentage: number;
    applications: IInternshipApplication[];
  };
  
  oneOnOneSessions: {
    attended: number;
    required: number;
    percentage: number;
    sessions: IOneOnOneSession[];
  };
  
  cvPortfolio: ICVPortfolio;
  
  totalPoints: number;
  maxPoints: number;
  
  // Editable feedback fields
  strengths: string[];
  areasForImprovement: string[];
  achievements: string[];
  recommendations: string[];
  teacherComments: string;
  careerServiceComments: string;
  employerFeedback: string;
  
  lastUpdated: Date;
  updatedBy?: string;
}

const StudentReportSchema = new Schema<IStudentReport>(
  {
    studentId: { type: String, required: true, unique: true, index: true },
    studentName: { type: String, required: true },
    gen: { type: String, required: true, index: true },
    email: { type: String, required: true },
    
    // Academic Performance
    attendance: {
      current: { type: Number, default: 0 },
      total: { type: Number, default: 50 },
      percentage: { type: Number, default: 0 },
    },
    assignments: {
      current: { type: Number, default: 0 },
      total: { type: Number, default: 50 },
      percentage: { type: Number, default: 0 },
    },
    exercises: {
      current: { type: Number, default: 0 },
      total: { type: Number, default: 50 },
      percentage: { type: Number, default: 0 },
    },
    weeklyProjects: {
      current: { type: Number, default: 0 },
      total: { type: Number, default: 50 },
      percentage: { type: Number, default: 0 },
    },
    monthlyProjects: {
      current: { type: Number, default: 0 },
      total: { type: Number, default: 10 },
      percentage: { type: Number, default: 0 },
    },
    hundredDaysOfCode: {
      current: { type: Number, default: 0 },
      total: { type: Number, default: 50 },
      percentage: { type: Number, default: 0 },
    },
    codeReview: {
      current: { type: Number, default: 0 },
      total: { type: Number, default: 5 },
      percentage: { type: Number, default: 0 },
    },
    finalProject: {
      current: { type: Number, default: 0 },
      total: { type: Number, default: 10 },
      percentage: { type: Number, default: 0 },
    },
    softSkills: {
      current: { type: Number, default: 0 },
      total: { type: Number, default: 70 },
      percentage: { type: Number, default: 0 },
    },
    miniDemoDays: {
      current: { type: Number, default: 0 },
      total: { type: Number, default: 5 },
      percentage: { type: Number, default: 0 },
    },
    
    // Career Data
    careerModules: {
      completed: { type: Number, default: 0 },
      total: { type: Number, default: 10 },
      modules: [{
        name: String,
        completed: Boolean,
        points: Number,
        completedAt: Date,
      }],
    },
    
    eventsWorkshops: {
      attended: { type: Number, default: 0 },
      required: { type: Number, default: 12 },
      percentage: { type: Number, default: 0 },
      events: [{
        name: String,
        date: String,
        attended: Boolean,
      }],
    },
    
    internshipApplications: {
      submitted: { type: Number, default: 0 },
      required: { type: Number, default: 24 },
      percentage: { type: Number, default: 0 },
      applications: [{
        company: String,
        role: String,
        date: String,
        status: String,
      }],
    },
    
    oneOnOneSessions: {
      attended: { type: Number, default: 0 },
      required: { type: Number, default: 24 },
      percentage: { type: Number, default: 0 },
      sessions: [{
        with: String,
        topic: String,
        date: String,
        completed: Boolean,
      }],
    },
    
    cvPortfolio: {
      cvStatus: { type: String, default: 'Not Submitted' },
      cvLastUpdated: String,
      portfolioStatus: { type: String, default: 'Not Submitted' },
      portfolioUrl: String,
      portfolioLastUpdated: String,
    },
    
    totalPoints: { type: Number, default: 0 },
    maxPoints: { type: Number, default: 291 },
    
    // Feedback
    strengths: [String],
    areasForImprovement: [String],
    achievements: [String],
    recommendations: [String],
    teacherComments: { type: String, default: '' },
    careerServiceComments: { type: String, default: '' },
    employerFeedback: { type: String, default: '' },
    
    lastUpdated: { type: Date, default: Date.now },
    updatedBy: String,
  },
  { timestamps: true }
);

export default mongoose.models.StudentReport || 
  mongoose.model<IStudentReport>('StudentReport', StudentReportSchema);