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
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp, updateDoc, increment, runTransaction, DocumentReference, collection } from 'firebase/firestore';

const AwardPointsFlowInputSchema = z.object({
    studentId: z.string().describe("The UID of the student to award points to."),
    points: z.number().describe("The number of points to award. Can be negative to revoke."),
    reason: z.string().describe("A short description of why the points are being awarded."),
    activityId: z.string().describe("A unique ID for the specific activity (e.g., submission ID or manual award ID)."),
    action: z.enum(['award', 'revoke']).describe("Whether to award or revoke the points."),
    assignmentTitle: z.string().optional().describe("The title of the assignment or activity."),
});
export type AwardPointsFlowInput = z.infer<typeof AwardPointsFlowInputSchema>;

const AwardPointsFlowOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type AwardPointsFlowOutput = z.infer<typeof AwardPointsFlowOutputSchema>;


export const awardPointsFlow = ai.defineFlow(
  {
    name: 'awardPointsFlow',
    inputSchema: AwardPointsFlowInputSchema,
    outputSchema: AwardPointsFlowOutputSchema,
  },
  async (input) => {
    const { studentId, points, reason, activityId, action, assignmentTitle } = input;

    try {
        await runTransaction(db, async (transaction) => {
            const userDocRef = doc(db, 'users', studentId);
            const pointDocRef = doc(db, 'users', studentId, 'points', activityId);
            
            if (action === 'award') {
                const pointDocSnap = await transaction.get(pointDocRef);
                if (pointDocSnap.exists()) {
                    console.log(`Duplicate award attempt for activityId: ${activityId}, action will be skipped.`);
                    // This is not an error, just means it's already done.
                    return; 
                }

                const userDoc = await transaction.get(userDocRef);
                const currentPoints = userDoc.data()?.totalPoints || 0;
                
                // Set or Update the totalPoints field.
                transaction.set(userDocRef, { totalPoints: currentPoints + points }, { merge: true });

                // Create the point log entry
                transaction.set(pointDocRef, {
                    points,
                    reason,
                    assignmentTitle: assignmentTitle || reason,
                    activityId,
                    awardedAt: serverTimestamp(),
                });
                
            } else { // action === 'revoke'
                const pointDocSnap = await transaction.get(pointDocRef);
                if (!pointDocSnap.exists()) {
                    console.log(`Point log not found for revocation: ${activityId}, action will be skipped.`);
                    return; // The point to revoke doesn't exist, so we're done.
                }

                const pointsToRevoke = pointDocSnap.data().points || 0;
                const userDoc = await transaction.get(userDocRef);
                const currentPoints = userDoc.data()?.totalPoints || 0;

                // Set or Update the totalPoints field.
                transaction.set(userDocRef, { totalPoints: Math.max(0, currentPoints - pointsToRevoke) }, { merge: true });

                // Delete the log entry
                transaction.delete(pointDocRef);
            }
        });

        return { success: true, message: `Points ${action === 'award' ? 'awarded' : 'revoked'} successfully.` };

    } catch (error: any) {
      console.error("Error processing points in transaction:", error);
      const errorMessage = error.message || "An unexpected error occurred.";
      // Check for specific Firestore error codes if needed
      if (error.code === 'permission-denied') {
          return { success: false, message: `Could not process points. Reason: Missing or insufficient permissions. Please check Firestore rules.` };
      }
      return { success: false, message: `Could not process points. Reason: ${errorMessage}` };
    }
  }
);
