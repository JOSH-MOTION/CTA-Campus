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
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';


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


export const awardPointsFlow = ai.defineFlow(
  {
    name: 'awardPointsFlow',
    inputSchema: AwardPointsFlowInputSchema,
    outputSchema: AwardPointsFlowOutputSchema,
    authPolicy: (auth, input) => {
        // This policy is checked on the server before the flow runs.
        // It ensures only authenticated users can call this flow.
        if (!auth) {
            throw new Error("User must be authenticated.");
        }
        // Further validation could check for a teacher/admin role if the user's
        // custom claims were available in the auth object. Since they are not
        // by default, we will rely on Firestore security rules for write permissions.
    }
  },
  async (input) => {
    try {
      if (input.action === 'award') {
        const { studentId, points, reason, activityId } = input;
        
        const finalActivityId = activityId.startsWith('manual-')
            ? `${activityId}-${uuidv4()}` 
            : activityId;
        
        const pointDocRef = doc(db, 'users', studentId, 'points', finalActivityId);

        const docSnap = await getDoc(pointDocRef);
        // Prevent duplicate points for non-manual entries
        if (docSnap.exists() && !activityId.startsWith('manual-')) {
            return { success: false, message: 'duplicate' };
        }

        await setDoc(pointDocRef, {
            points,
            reason,
            activityId: finalActivityId,
            awardedAt: serverTimestamp(),
        });
        
        return { success: true, message: 'Points awarded successfully.' };

      } else { // action === 'revoke'
        const { studentId, activityId } = input;
        const pointToRevokeRef = doc(db, 'users', studentId, 'points', activityId);
        
        const docSnap = await getDoc(pointToRevokeRef);
        if (!docSnap.exists) {
            return { success: true, message: "Points already revoked or never existed." };
        }
        
        await deleteDoc(pointToRevokeRef);
        
        return { success: true, message: "Points revoked successfully." };
      }
    } catch (error: any) {
      console.error("Error processing points in flow:", error);
      // Firestore permission errors have a specific code.
      if (error.code === 'permission-denied') {
          return { success: false, message: "Server error: Could not process points. Reason: Missing or insufficient permissions." };
      }
      const errorMessage = error.message || "An unexpected error occurred.";
      return { success: false, message: `Server error: Could not process points. Reason: ${errorMessage}` };
    }
  }
);
