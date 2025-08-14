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
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp, updateDoc, increment } from 'firebase/firestore';


const AwardPointsFlowInputSchema = z.object({
    studentId: z.string().describe("The UID of the student to award points to."),
    points: z.number().describe("The number of points to award. Can be negative to revoke."),
    reason: z.string().describe("A short description of why the points are being awarded."),
    activityId: z.string().describe("A unique ID for the specific activity."),
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
    const userDocRef = doc(db, 'users', studentId);
    
    try {
      if (action === 'award') {
        const pointDocRef = doc(db, 'users', studentId, 'points', activityId);

        // Atomically increment the totalPoints on the user document
        await updateDoc(userDocRef, {
            totalPoints: increment(points)
        });

        // Create a log entry in the subcollection
        await setDoc(pointDocRef, {
            points,
            reason,
            assignmentTitle: assignmentTitle || reason, // Fallback to reason if title not provided
            activityId,
            awardedAt: serverTimestamp(),
        });
        
        return { success: true, message: 'Points awarded successfully.' };

      } else { // action === 'revoke'
        const pointToRevokeRef = doc(db, 'users', studentId, 'points', activityId);
        
        const docSnap = await getDoc(pointToRevokeRef);
        if (docSnap.exists()) {
            const pointsToRevoke = docSnap.data().points || 0;
            
            // Atomically decrement the totalPoints on the user document
            await updateDoc(userDocRef, {
                totalPoints: increment(-pointsToRevoke)
            });

            // Delete the log entry
            await deleteDoc(pointToRevokeRef);
            return { success: true, message: "Points revoked successfully." };
        }
        
        return { success: true, message: "Points already revoked or never existed." };
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
