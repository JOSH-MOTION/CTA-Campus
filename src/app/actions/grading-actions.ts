// src/app/actions/grading-actions.ts
'use server';

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
    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(input.idToken);
    
    // Call the points API
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/points`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: input.studentId,
        points: input.points,
        reason: input.reason,
        assignmentTitle: input.assignmentTitle,
        activityId: input.activityId,
        awardedBy: decodedToken.uid,
        action: input.action,
        idToken: input.idToken,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      return {
        success: false,
        message: result.message || 'Failed to manage points',
      };
    }

    return {
      success: true,
      message: input.action === 'award' ? 'Points awarded successfully' : 'Points revoked successfully',
    };
  } catch (error: any) {
    console.error('Error in awardPointsAction:', error);
    
    if (error.code && error.code.startsWith('auth/')) {
      return {
        success: false,
        message: 'Authentication failed. Please refresh and try again.',
      };
    }

    return {
      success: false,
      message: error.message || 'An unexpected error occurred',
    };
  }
}

export async function gradeSubmissionAction(input: GradeSubmissionInput) {
  try {
    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(input.idToken);
    
    // Call the submissions API
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/submissions/${input.submissionId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grade: input.grade || 'Complete',
        feedback: input.feedback || '',
        gradedBy: decodedToken.uid,
        graderName: decodedToken.name || 'Staff',
        idToken: input.idToken,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      return {
        success: false,
        message: result.message || 'Failed to grade submission',
      };
    }

    return {
      success: true,
      message: 'Submission graded successfully',
    };
  } catch (error: any) {
    console.error('Error in gradeSubmissionAction:', error);
    
    if (error.code && error.code.startsWith('auth/')) {
      return {
        success: false,
        message: 'Authentication failed. Please refresh and try again.',
      };
    }

    return {
      success: false,
      message: error.message || 'An unexpected error occurred',
    };
  }
}