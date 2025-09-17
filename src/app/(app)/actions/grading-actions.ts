// src/app/actions/grading-actions.ts
'use server';

import { awardPointsFlow } from '@/ai/flows/award-points-flow';
import { gradeSubmissionFlow } from '@/ai/flows/grade-submission-flow';
import { adminAuth } from '@/lib/firebase-admin';

interface AwardPointsInput {
  studentId: string;
  points: number;
  reason: string;
  activityId: string;
  action: 'award' | 'revoke';
  assignmentTitle?: string;
  idToken: string;
}

interface GradeSubmissionInput {
  submissionId: string;
  studentId: string;
  assignmentTitle: string;
  grade?: string;
  feedback?: string;
  idToken: string;
}

export async function awardPointsAction(input: AwardPointsInput) {
  try {
    if (!adminAuth) {
      throw new Error('Firebase Admin Auth not initialized');
    }

    // Verify the token and get user info
    const decodedToken = await adminAuth.verifyIdToken(input.idToken);
    
    const result = await awardPointsFlow({
      studentId: input.studentId,
      points: input.points,
      reason: input.reason,
      activityId: input.activityId,
      action: input.action,
      awardedBy: decodedToken.uid,
      assignmentTitle: input.assignmentTitle,
    });
    
    return result;
  } catch (error: any) {
    console.error('Error in awardPointsAction:', error);
    
    // Handle specific auth errors
    if (error.code === 'auth/id-token-expired') {
      return {
        success: false,
        message: 'Session expired. Please refresh the page and try again.',
      };
    }
    
    if (error.code === 'auth/argument-error') {
      return {
        success: false,
        message: 'Invalid authentication token. Please refresh and try again.',
      };
    }
    
    return {
      success: false,
      message: error.message || 'Failed to process points',
    };
  }
}

export async function gradeSubmissionAction(input: GradeSubmissionInput) {
  try {
    if (!adminAuth) {
      throw new Error('Firebase Admin Auth not initialized');
    }

    // Verify the token and get user info
    const decodedToken = await adminAuth.verifyIdToken(input.idToken);
    
    // Get user display name (you might want to fetch this from your users collection)
    const graderName = decodedToken.name || decodedToken.email || 'Teacher';
    
    const result = await gradeSubmissionFlow({
      submissionId: input.submissionId,
      studentId: input.studentId,
      assignmentTitle: input.assignmentTitle,
      grade: input.grade || 'Complete',
      feedback: input.feedback,
      gradedBy: decodedToken.uid,
      graderName: graderName,
      idToken: input.idToken,
    });
    
    return result;
  } catch (error: any) {
    console.error('Error in gradeSubmissionAction:', error);
    
    // Handle specific auth errors
    if (error.code === 'auth/id-token-expired') {
      return {
        success: false,
        message: 'Session expired. Please refresh the page and try again.',
      };
    }
    
    if (error.code === 'auth/argument-error') {
      return {
        success: false,
        message: 'Invalid authentication token. Please refresh and try again.',
      };
    }
    
    return {
      success: false,
      message: error.message || 'Failed to grade submission',
    };
  }
}