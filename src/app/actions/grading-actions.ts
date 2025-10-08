'use server';

import { awardPointsFlow, AwardPointsFlowInput } from '@/ai/flows/award-points-flow';
import { gradeSubmissionFlow, GradeSubmissionInput } from '@/ai/flows/grade-submission-flow';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

type AwardPointsServerInput = Omit<AwardPointsFlowInput, 'awardedBy'> & { idToken: string };
type GradeSubmissionServerInput = Omit<GradeSubmissionInput, 'gradedBy' | 'graderName' | 'idToken'> & { idToken: string };

async function getVerifiedUser(idToken: string) {
  if (!idToken) {
    throw new Error('Authentication token is missing.');
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    const userDoc = await adminDb.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      console.error(`User document not found for UID: ${uid}`);
      throw new Error('User document not found in database.');
    }

    const userData = userDoc.data();
    const role = userData?.role;

    if (role !== 'teacher' && role !== 'admin') {
      throw new Error('You do not have permission to perform this action.');
    }
    
    return {
      uid: uid,
      name: userData?.displayName || decodedToken.email || 'Unnamed User',
      role: role
    };
  } catch (error: any) {
    console.error("Error verifying ID token or fetching user role:", error);
    
    if (error.code === 'auth/id-token-expired') {
      throw new Error('Session expired. Please refresh the page and try again.');
    }
    if (error.code === 'auth/argument-error') {
      throw new Error('Invalid authentication token. Please refresh and try again.');
    }
    
    throw new Error(error.message || 'Session invalid. Please log in again.');
  }
}

export async function awardPointsAction(input: AwardPointsServerInput) {
  try {
    const { idToken, ...flowInput } = input;
    const user = await getVerifiedUser(idToken);

    return await awardPointsFlow({
      ...flowInput,
      awardedBy: user.uid,
    });
  } catch (error: any) {
    console.error('Error in awardPointsAction:', error);
    return {
      success: false,
      message: error.message || 'Failed to process points',
    };
  }
}

export async function gradeSubmissionAction(input: GradeSubmissionServerInput) {
  try {
    const { idToken, ...flowInput } = input;
    const user = await getVerifiedUser(idToken);
    
    return await gradeSubmissionFlow({
      ...flowInput,
      gradedBy: user.uid,
      graderName: user.name,
      idToken,
    });
  } catch (error: any) {
    console.error('Error in gradeSubmissionAction:', error);
    return {
      success: false,
      message: error.message || 'Failed to grade submission',
    };
  }
}