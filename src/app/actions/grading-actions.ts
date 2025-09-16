// src/app/actions/grading-actions.ts
'use server';

import { awardPointsFlow, AwardPointsFlowInput } from "@/ai/flows/award-points-flow";
import { gradeSubmissionFlow, GradeSubmissionInput } from "@/ai/flows/grade-submission-flow";
import { adminAuth } from "@/lib/firebase-admin";

// Update the input types to include the idToken
type AwardPointsServerInput = Omit<AwardPointsFlowInput, 'awardedBy'> & { idToken: string };
type GradeSubmissionServerInput = Omit<GradeSubmissionInput, 'gradedBy' | 'graderName'> & { idToken: string };

async function getVerifiedUser(idToken: string) {
    if (!idToken) {
        throw new Error('Authentication token is missing.');
    }
    
    try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const role = decodedToken.role;

        if (role !== 'teacher' && role !== 'admin') {
            throw new Error('You do not have permission to perform this action.');
        }
        
        return {
            uid: decodedToken.uid,
            name: decodedToken.name || decodedToken.email, // Fallback to email if name is not on token
            role: role
        };
    } catch (error) {
        console.error("Error verifying ID token:", error);
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
