// src/app/actions/grading-actions.ts
'use server';

import { awardPointsFlow, AwardPointsFlowInput } from "@/ai/flows/award-points-flow";
import { gradeSubmissionFlow, GradeSubmissionInput } from "@/ai/flows/grade-submission-flow";
import { adminAuth } from "@/lib/firebase-admin";
import { cookies } from 'next/headers';

type AwardPointsServerInput = Omit<AwardPointsFlowInput, 'awardedBy'>;
type GradeSubmissionServerInput = Omit<GradeSubmissionInput, 'gradedBy' | 'graderName'>;

async function getVerifiedUser() {
    const sessionCookie = cookies().get('__session')?.value || '';
    if (!sessionCookie) {
        throw new Error('User not authenticated.');
    }
    
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    const role = decodedToken.role;

    if (role !== 'teacher' && role !== 'admin') {
        throw new Error('You do not have permission to perform this action.');
    }
    
    return {
        uid: decodedToken.uid,
        name: decodedToken.name,
        role: role
    };
}


export async function awardPointsAction(input: AwardPointsServerInput) {
    const user = await getVerifiedUser();

    return await awardPointsFlow({
        ...input,
        awardedBy: user.uid,
    });
}

export async function gradeSubmissionAction(input: GradeSubmissionServerInput) {
    const user = await getVerifiedUser();
    
    return await gradeSubmissionFlow({
        ...input,
        gradedBy: user.uid,
        graderName: user.name,
    });
}
