// src/app/actions/grading-actions.ts
'use server';

import { z } from 'zod';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { gradeSubmissionFlow, GradeSubmissionInput } from '@/ai/flows/grade-submission-flow';
import { awardPointsFlow, AwardPointsFlowInput } from '@/ai/flows/award-points-flow';

const ActionResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

async function getVerifiedUser(idToken: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      throw new Error('User document not found');
    }

    const userData = userDoc.data();
    if (!userData || !['teacher', 'admin'].includes(userData.role)) {
      throw new Error('User does not have sufficient permissions');
    }

    return { uid, role: userData.role };
  } catch (error: any) {
    console.error('Error verifying ID token or fetching user role:', {
      error: error.message,
      stack: error.stack,
    });
    throw new Error(error.message || 'Session invalid. Please log in again.');
  }
}

export async function awardPointsAction(input: Omit<AwardPointsFlowInput, 'awardedBy'> & { idToken: string }) {
  try {
    const { idToken, ...flowInput } = input; // Destructure idToken to exclude it from flowInput
    const { uid, role } = await getVerifiedUser(idToken);

    if (!['teacher', 'admin'].includes(role)) {
      return {
        success: false,
        message: 'Unauthorized: Only teachers or admins can award points',
      };
    }

    const result = await awardPointsFlow({
      ...flowInput,
      awardedBy: uid,
    });

    return ActionResponseSchema.parse(result);
  } catch (error: any) {
    console.error('Error in awardPointsAction:', {
      error: error.message,
      stack: error.stack,
      studentId: input.studentId,
      activityId: input.activityId,
    });
    return {
      success: false,
      message: error.message || 'Failed to award points',
    };
  }
}

export async function gradeSubmissionAction(input: Omit<GradeSubmissionInput, 'gradedBy' | 'graderName'> & { idToken: string }) {
  try {
    const { idToken, ...flowInput } = input; // Destructure idToken to exclude it from flowInput
    const { uid, role } = await getVerifiedUser(idToken);

    if (!['teacher', 'admin'].includes(role)) {
      return {
        success: false,
        message: 'Unauthorized: Only teachers or admins can grade submissions',
      };
    }

    const result = await gradeSubmissionFlow({
      ...flowInput,
      gradedBy: uid,
      graderName: 'Teacher', // Or fetch from userData if needed
      idToken, // Pass idToken to flow if it needs it for verification
    });

    return ActionResponseSchema.parse(result);
  } catch (error: any) {
    console.error('Error in gradeSubmissionAction:', {
      error: error.message,
      stack: error.stack,
      submissionId: input.submissionId,
      studentId: input.studentId,
    });
    return {
      success: false,
      message: error.message || 'Failed to grade submission',
    };
  }
}