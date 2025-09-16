// src/ai/flows/award-points-flow.ts
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { serverTimestamp, increment } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';

const AwardPointsFlowInputSchema = z.object({
    studentId: z.string().describe("The UID of the student to award points to."),
    points: z.number().describe("The number of points to award. Can be negative to revoke."),
    reason: z.string().describe("A short description of why the points are being awarded."),
    activityId: z.string().describe("A unique ID for the specific activity."),
    action: z.enum(['award', 'revoke']).describe("Whether to award or revoke the points."),
    awardedBy: z.string().describe("The UID of the user awarding the points."),
    assignmentTitle: z.string().optional().describe("The title of the assignment or activity."),
});

export type AwardPointsFlowInput = z.infer<typeof AwardPointsFlowInputSchema>;

const AwardPointsFlowOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  totalPoints: z.number().optional(),
});

export type AwardPointsFlowOutput = z.infer<typeof AwardPointsFlowOutputSchema>;

export const awardPointsFlow = ai.defineFlow(
  {
    name: 'awardPointsFlow',
    inputSchema: AwardPointsFlowInputSchema,
    outputSchema: AwardPointsFlowOutputSchema,
  },
  async (input) => {
    const { studentId, points, reason, activityId, action, awardedBy, assignmentTitle } = input;
    
    try {
      if (!adminDb) {
        throw new Error('Firebase Admin SDK not initialized.');
      }

      const result = await adminDb.runTransaction(async (transaction) => {
        const userDocRef = adminDb.collection('users').doc(studentId);
        const userDoc = await transaction.get(userDocRef);
        
        if (!userDoc.exists) {
          throw new Error('Student user document not found.');
        }
        
        const currentTotalPoints = userDoc.data()?.totalPoints || 0;
        
        if (action === 'award') {
          const pointDocRef = userDocRef.collection('points').doc(activityId);
          
          const existingPointDoc = await transaction.get(pointDocRef);
          if (existingPointDoc.exists) {
            return { 
              success: true,
              message: 'Points for this activity have already been awarded',
              totalPoints: currentTotalPoints
            };
          }
          
          transaction.update(userDocRef, {
            totalPoints: increment(points)
          });

          transaction.set(pointDocRef, {
            points,
            reason,
            assignmentTitle: assignmentTitle || reason,
            activityId,
            awardedAt: serverTimestamp(),
            awardedBy: awardedBy,
          });
          
          return { 
            success: true, 
            message: 'Points awarded successfully.',
            totalPoints: currentTotalPoints + points
          };

        } else { // action === 'revoke'
          const pointToRevokeRef = userDocRef.collection('points').doc(activityId);
          const pointDoc = await transaction.get(pointToRevokeRef);
          
          if (!pointDoc.exists) {
            return { 
              success: true, 
              message: "Points already revoked or never existed.",
              totalPoints: currentTotalPoints
            };
          }
          
          const pointsToRevoke = pointDoc.data()?.points || 0;
          
          transaction.update(userDocRef, {
            totalPoints: increment(-pointsToRevoke)
          });

          transaction.delete(pointToRevokeRef);
          
          return { 
            success: true, 
            message: "Points revoked successfully.",
            totalPoints: currentTotalPoints - pointsToRevoke
          };
        }
      });
      
      return result;
      
    } catch (error: any) {
      console.error("Error processing points in flow:", error);
      
      const errorMessage = error.message || "An unexpected error occurred.";
      return { 
        success: false, 
        message: `Server error: Could not process points. Reason: ${errorMessage}` 
      };
    }
  }
);
