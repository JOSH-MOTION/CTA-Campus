
// src/app/actions/grading-actions.ts
'use server';

import { awardPointsFlow, AwardPointsFlowInput } from "@/ai/flows/award-points-flow";
import { gradeSubmissionFlow, GradeSubmissionInput } from "@/ai/flows/grade-submission-flow";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

// Update the input types to include the idToken
type AwardPointsServerInput = Omit<AwardPointsFlowInput, 'awardedBy'> & { idToken: string };
type GradeSubmissionServerInput = Omit<GradeSubmissionInput, 'gradedBy' | 'graderName'> & { idToken: string };

async function getVerifiedUser(idToken: string) {
    if (!idToken) {
        throw new Error('Authentication token is missing.');
    }
    
    if (!adminDb || !adminAuth) {
        throw new Error('Firebase Admin SDK is not initialized on the server.');
    }

    try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const uid = decodedToken.uid;
        
        // Instead of relying on the token's custom claim, which can be stale,
        // fetch the user's document directly from Firestore to get the authoritative role.
        const userDoc = await adminDb.collection('users').doc(uid).get();

        if (!userDoc.exists) {
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
        throw new Error("Session invalid. Please log in again.");
    }
}


export async function awardPointsAction(input: AwardPointsServerInput) {
    const { idToken, ...flowInput } = input;
    const user = await getVerifiedUser(idToken);

    return await awardPointsFlow({
        ...flowInput,
        awardedBy: user.uid,
    });
}

export async function gradeSubmissionAction(input: GradeSubmissionServerInput) {
    const { idToken, ...flowInput } = input;
    const user = await getVerifiedUser(idToken);
    
    return await gradeSubmissionFlow({
        ...flowInput,
        gradedBy: user.uid,
        graderName: user.name,
    });
}
