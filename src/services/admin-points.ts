// src/services/admin-points.ts
'use server';

import { adminDB } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid';

interface PointDetails {
    studentId: string;
    points: number;
    reason: string;
    activityId: string;
}

export async function awardPointsAdmin(details: PointDetails): Promise<{success: true, message: string}> {
    const { studentId, points, reason, activityId } = details;

    // For manual entries, ensure the ID is always unique to allow multiple awards.
    // For graded items (not used by this service but good practice), the ID is stable.
    const finalActivityId = activityId.startsWith('manual-')
        ? `${activityId}-${uuidv4()}`
        : activityId;
    
    const pointDocRef = adminDB.collection('users').doc(studentId).collection('points').doc(finalActivityId);

    const docSnap = await pointDocRef.get();
    if (docSnap.exists && !activityId.startsWith('manual-')) {
        throw new Error('Point already awarded for this activity.');
    }

    await pointDocRef.set({
        points,
        reason,
        activityId: finalActivityId,
        awardedAt: FieldValue.serverTimestamp(),
    });

    return { success: true, message: "Points awarded successfully." };
}

export async function revokePointsAdmin(details: Pick<PointDetails, 'studentId' | 'activityId'>): Promise<{success: true, message: string}> {
    const { studentId, activityId } = details;
    
    // For revoking, we need the original, stable activityId.
    const pointToRevokeRef = adminDB.collection('users').doc(studentId).collection('points').doc(activityId);

    const docSnap = await pointToRevokeRef.get();
    if (!docSnap.exists) {
        // If it's already gone, we consider the operation successful.
        return { success: true, message: "Points already revoked or never existed." };
    }

    await pointToRevokeRef.delete();
    
    return { success: true, message: "Points revoked successfully." };
}
