// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Submission } from '@/services/submissions';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getActivityIdForSubmission(submission: Submission): string {
  switch (submission.pointCategory) {
    case 'Class Assignments':
      return `graded-submission-${submission.id}`;
    case 'Class Exercises':
      return `graded-exercise-${submission.id}`;
    case 'Weekly Projects':
      return `graded-project-${submission.id}`;
    case '100 Days of Code':
      return `100-days-of-code-${submission.assignmentTitle.replace('100 Days of Code - ', '')}`;
    default:
      return `graded-submission-${submission.id}`;
  }
}

export function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.host}`;
  }
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  console.warn('NEXT_PUBLIC_BASE_URL not set, falling back to localhost');
  return 'http://localhost:3000';
}