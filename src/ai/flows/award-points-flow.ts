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
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp, updateDoc, increment } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

const AwardPointsFlowInputSchema = z.object({
    studentId: z.string().describe("The UID of the student to award points to."),
    points: z.number().describe("The number of points to award. Can be negative to revoke."),
    reason: z.string().describe("A short description of why the points are being awarded."),
    activityId: z.string().describe("A unique ID for the specific activity."),
    pointLogId: z.string().optional().describe("The unique ID of the point log entry to revoke."),
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
    const { studentId, points, reason, activityId, pointLogId, action, assignmentTitle } = input;
    const userDocRef = doc(db, 'users', studentId);
    
    try {
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists() && action === 'award') {
          // If the user document doesn't exist, we can't award points to them.
          // For revoking, we proceed because the doc might have been deleted, but points still need to be adjusted.
          return { success: false, message: 'User not found.' };
      }
      
      if (action === 'award') {
        // Use a consistent ID for the check to prevent duplicates.
        const pointDocRefForCheck = doc(db, 'users', studentId, 'points', activityId);
        const pointDocSnap = await getDoc(pointDocRefForCheck);
        
        if (pointDocSnap.exists()) {
            // Points for this specific activity have already been awarded.
            return { success: true, message: 'duplicate' };
        }

        // Use a new unique ID for the actual log entry to support multiple manual awards for the same reason.
        const newPointLogId = uuidv4();
        const pointDocRef = doc(db, 'users', studentId, 'points', newPointLogId);

        // Ensure totalPoints field exists before incrementing.
        if (!userDoc.data()?.totalPoints) {
            await setDoc(userDocRef, { totalPoints: 0 }, { merge: true });
        }

        // Atomically increment the totalPoints on the user document
        await updateDoc(userDocRef, {
            totalPoints: increment(points)
        });

        // Create a log entry in the subcollection
        await setDoc(pointDocRef, {
            points,
            reason,
            assignmentTitle: assignmentTitle || reason,
            activityId, // Keep original activityId for lookup if needed
            pointLogId: newPointLogId, // Store the unique ID for potential revocation
            awardedAt: serverTimestamp(),
        });
        
        return { success: true, message: 'Points awarded successfully.' };

      } else { // action === 'revoke'
        // Revoking requires a specific pointLogId to target the exact entry.
        if (!pointLogId) {
            return { success: false, message: "pointLogId is required to revoke points." };
        }
        
        const pointDocRef = doc(db, 'users', studentId, 'points', pointLogId);
        const docSnap = await getDoc(pointDocRef);

        if (docSnap.exists()) {
            const pointsToRevoke = docSnap.data().points || 0;
            
            // Ensure totalPoints field exists before decrementing.
            if (!userDoc.data()?.totalPoints) {
                await setDoc(userDocRef, { totalPoints: 0 }, { merge: true });
            }

            // Atomically decrement the totalPoints on the user document
            await updateDoc(userDocRef, {
                totalPoints: increment(-pointsToRevoke)
            });

            // Delete the log entry
            await deleteDoc(pointDocRef);
            return { success: true, message: "Points revoked successfully." };
        }
        
        return { success: true, message: "Points already revoked or never existed." };
      }
    } catch (error: any) {
      console.error("Error processing points in flow:", error);
      const errorMessage = error.message || "An unexpected error occurred.";
      return { success: false, message: `Server error: Could not process points. Reason: ${errorMessage}` };
    }
  }
);
