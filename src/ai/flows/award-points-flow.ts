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

const awardOrRevokePointsTool = ai.defineTool(
  {
    name: 'awardOrRevokePoints',
    description: 'A tool to securely award or revoke points for a student in the database.',
    inputSchema: AwardPointsFlowInputSchema,
    outputSchema: AwardPointsFlowOutputSchema,
  },
  async (input) => {
    try {
        const { studentId, points, reason, activityId, action } = input;
        
        const finalActivityId = activityId.startsWith('manual-') 
            ? `${activityId}-${uuidv4()}`
            : activityId;

        const pointDocRef = doc(db, 'users', studentId, 'points', finalActivityId);

        if (action === 'award') {
            const docSnap = await getDoc(pointDocRef);
            if (docSnap.exists() && !activityId.startsWith('manual-')) {
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
            const pointToRevokeRef = doc(db, 'users', studentId, 'points', activityId);
            const docSnap = await getDoc(pointToRevokeRef);
            if (!docSnap.exists()) {
                return { success: true, message: "Points already revoked or never existed." };
            }
            await deleteDoc(pointToRevokeRef);
            return { success: true, message: "Points revoked successfully." };
        }
    } catch (error: any) {
      console.error("Error processing points in tool:", error);
      // Provide a more specific error message if possible, but fallback to a generic one.
      const errorMessage = error.message || "An unexpected error occurred.";
      return { success: false, message: `Server error: Could not process points. Reason: ${errorMessage}` };
    }
  }
);


export async function awardPointsFlow(input: AwardPointsFlowInput): Promise<AwardPointsFlowOutput> {
    // The tool is now the entire implementation. The flow just calls it.
    // This is the correct pattern for secure server-side operations.
    return await awardOrRevokePointsTool(input);
}
