// src/ai/flows/award-points-flow.ts
'use server';
/**
 * @fileOverview A secure flow for awarding or revoking points for a student.
 *
 * - awardPointsFlow - A function that handles awarding or revoking points.
 * - AwardPointsFlowInput - The input type for the awardPointsFlow function.
 * - AwardPointsFlowOutput - The return type for the awardPointsFlow function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

const AwardPointsFlowInputSchema = z.object({
    studentId: z.string().describe("The UID of the student to award points to."),
    points: z.number().describe("The number of points to award. Can be negative to revoke."),
    reason: z.string().describe("A short description of why the points are being awarded."),
    activityId: z.string().describe("A unique ID for the specific activity."),
    action: z.enum(['award', 'revoke']).describe("Whether to award or revoke the points."),
});
export type AwardPointsFlowInput = z.infer<typeof AwardPointsFlowInputSchema>;

const AwardPointsFlowOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type AwardPointsFlowOutput = z.infer<typeof AwardPointsFlowOutputSchema>;


export async function awardPointsFlow(input: AwardPointsFlowInput): Promise<AwardPointsFlowOutput> {
  const { studentId, points, reason, activityId, action } = input;
  
  // For manually entered points, we always generate a new unique ID to ensure it's a distinct event.
  // For system-generated points (like grading), the activityId should be stable (e.g., `graded-submission-XYZ`).
  const finalActivityId = activityId.startsWith('manual-') 
      ? `${activityId}-${uuidv4()}`
      : activityId;

  const pointDocRef = doc(db, 'users', studentId, 'points', finalActivityId);

  try {
    if (action === 'award') {
      const docSnap = await getDoc(pointDocRef);
      if (docSnap.exists() && !activityId.startsWith('manual-')) {
        // If the point already exists for a non-manual entry, we don't need to do anything.
        // This makes the award action idempotent for stable activity IDs.
        return { success: true, message: 'Point already awarded.' };
      }
      
      await setDoc(pointDocRef, {
        points,
        reason,
        activityId: finalActivityId,
        awardedAt: serverTimestamp(),
      });

      return { success: true, message: "Points awarded successfully." };
    } else { // action === 'revoke'
        // For revoke, we need the exact ID, which should be passed in `activityId`.
        const pointToRevokeRef = doc(db, 'users', studentId, 'points', activityId);
        await deleteDoc(pointToRevokeRef);
        return { success: true, message: "Points revoked successfully." };
    }
  } catch (error: any) {
    console.error("Error processing points:", error);
    // Return a more generic but helpful error message to the client.
    return { success: false, message: `Server error: Could not process points due to a permission or data issue.` };
  }
}
