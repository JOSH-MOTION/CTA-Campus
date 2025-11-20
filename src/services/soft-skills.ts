// src/services/soft-skills.ts
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface ModuleSubmission {
  id: string;
  moduleId: string;
  studentId: string;
  studentName: string;
  studentGen: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Timestamp;
  approvedAt?: Timestamp;
  approvedBy?: string;
  notes?: string;
}

export interface Event {
  id: string;
  name: string;
  date: string;
  type: 'virtual' | 'in-person';
  location?: string;
  description: string;
  link?: string;
  createdBy: string;
  createdAt: Timestamp;
}

export interface EventAttendance {
  id: string;
  eventId: string;
  studentId: string;
  studentName: string;
  studentGen: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Timestamp;
  approvedAt?: Timestamp;
  approvedBy?: string;
  notes?: string;
}

export interface JobPost {
  id: string;
  title: string;
  company: string;
  type: 'internship' | 'full-time' | 'part-time' | 'contract';
  location: string;
  description: string;
  applicationUrl: string;
  postedBy: string;
  postedAt: Timestamp;
}

export interface Application {
  id: string;
  jobId: string;
  studentId: string;
  studentName: string;
  studentGen: string;
  status: 'pending' | 'approved' | 'rejected';
  screenshotUrl: string;
  submittedAt: Timestamp;
  approvedAt?: Timestamp;
  approvedBy?: string;
  notes?: string;
}

export interface Session {
  id: string;
  studentId: string;
  studentName: string;
  studentGen: string;
  bookingLink: string;
  scheduledDate: string;
  topic: string;
  status: 'pending' | 'completed' | 'cancelled';
  bookedAt: Timestamp;
  completedAt?: Timestamp;
  completedBy?: string;
}

// Module Submissions
export const submitModule = async (
  studentId: string,
  studentName: string,
  studentGen: string,
  moduleId: string,
  notes?: string
) => {
  return await addDoc(collection(db, 'soft_skills_modules'), {
    moduleId,
    studentId,
    studentName,
    studentGen,
    status: 'pending',
    submittedAt: serverTimestamp(),
    notes: notes || '',
  });
};

export const approveModule = async (
  submissionId: string,
  approverId: string
) => {
  await updateDoc(doc(db, 'soft_skills_modules', submissionId), {
    status: 'approved',
    approvedAt: serverTimestamp(),
    approvedBy: approverId,
  });
};

export const rejectModule = async (
  submissionId: string,
  approverId: string
) => {
  await updateDoc(doc(db, 'soft_skills_modules', submissionId), {
    status: 'rejected',
    approvedAt: serverTimestamp(),
    approvedBy: approverId,
  });
};

// Events
export const createEvent = async (
  name: string,
  date: string,
  type: 'virtual' | 'in-person',
  description: string,
  createdBy: string,
  location?: string,
  link?: string
) => {
  return await addDoc(collection(db, 'soft_skills_events'), {
    name,
    date,
    type,
    description,
    location: location || '',
    link: link || '',
    createdBy,
    createdAt: serverTimestamp(),
  });
};

export const submitEventAttendance = async (
  eventId: string,
  studentId: string,
  studentName: string,
  studentGen: string,
  notes?: string
) => {
  // Check if already submitted
  const existingQuery = query(
    collection(db, 'soft_skills_attendance'),
    where('eventId', '==', eventId),
    where('studentId', '==', studentId)
  );
  const existing = await getDocs(existingQuery);
  
  if (!existing.empty) {
    throw new Error('Attendance already submitted for this event');
  }

  return await addDoc(collection(db, 'soft_skills_attendance'), {
    eventId,
    studentId,
    studentName,
    studentGen,
    status: 'pending',
    submittedAt: serverTimestamp(),
    notes: notes || '',
  });
};

export const approveAttendance = async (
  attendanceId: string,
  approverId: string
) => {
  await updateDoc(doc(db, 'soft_skills_attendance', attendanceId), {
    status: 'approved',
    approvedAt: serverTimestamp(),
    approvedBy: approverId,
  });
};

export const rejectAttendance = async (
  attendanceId: string,
  approverId: string
) => {
  await updateDoc(doc(db, 'soft_skills_attendance', attendanceId), {
    status: 'rejected',
    approvedAt: serverTimestamp(),
    approvedBy: approverId,
  });
};

// Job Posts
export const createJobPost = async (
  title: string,
  company: string,
  type: JobPost['type'],
  location: string,
  description: string,
  applicationUrl: string,
  postedBy: string
) => {
  return await addDoc(collection(db, 'soft_skills_jobs'), {
    title,
    company,
    type,
    location,
    description,
    applicationUrl,
    postedBy,
    postedAt: serverTimestamp(),
  });
};

export const submitApplication = async (
  jobId: string,
  studentId: string,
  studentName: string,
  studentGen: string,
  screenshotUrl: string,
  notes?: string
) => {
  // Check if already applied
  const existingQuery = query(
    collection(db, 'soft_skills_applications'),
    where('jobId', '==', jobId),
    where('studentId', '==', studentId)
  );
  const existing = await getDocs(existingQuery);
  
  if (!existing.empty) {
    throw new Error('Application already submitted for this job');
  }

  return await addDoc(collection(db, 'soft_skills_applications'), {
    jobId,
    studentId,
    studentName,
    studentGen,
    status: 'pending',
    screenshotUrl,
    submittedAt: serverTimestamp(),
    notes: notes || '',
  });
};

export const approveApplication = async (
  applicationId: string,
  approverId: string
) => {
  await updateDoc(doc(db, 'soft_skills_applications', applicationId), {
    status: 'approved',
    approvedAt: serverTimestamp(),
    approvedBy: approverId,
  });
};

export const rejectApplication = async (
  applicationId: string,
  approverId: string
) => {
  await updateDoc(doc(db, 'soft_skills_applications', applicationId), {
    status: 'rejected',
    approvedAt: serverTimestamp(),
    approvedBy: approverId,
  });
};

// Sessions
export const bookSession = async (
  studentId: string,
  studentName: string,
  studentGen: string,
  bookingLink: string,
  scheduledDate: string,
  topic: string
) => {
  return await addDoc(collection(db, 'soft_skills_sessions'), {
    studentId,
    studentName,
    studentGen,
    bookingLink,
    scheduledDate,
    topic,
    status: 'pending',
    bookedAt: serverTimestamp(),
  });
};

export const completeSession = async (
  sessionId: string,
  completedBy: string
) => {
  await updateDoc(doc(db, 'soft_skills_sessions', sessionId), {
    status: 'completed',
    completedAt: serverTimestamp(),
    completedBy,
  });
};

export const cancelSession = async (sessionId: string) => {
  await updateDoc(doc(db, 'soft_skills_sessions', sessionId), {
    status: 'cancelled',
  });
};