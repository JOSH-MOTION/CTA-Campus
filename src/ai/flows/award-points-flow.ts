// src/ai/flows/award-points-flow.ts
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp, updateDoc, increment, runTransaction } from 'firebase/firestore';

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
  totalPoints: z.number().optional(),
});

export type AwardPointsFlowOutput = z.infer<typeof AwardPointsFlowOutputSchema>;

export const awardPointsFlow = ai.defineFlow(
  {
    name: 'awardPointsFlow',
    inputSchema: AwardPointsFlowInputSchema,
    outputSchema: AwardPointsFlowOutputSchema,
    // Add authentication check for staff members
    auth: (auth, input) => {
      if (!auth) {
        throw new Error('Authentication is required to award points.');
      }
      if (!auth.role || (auth.role !== 'teacher' && auth.role !== 'admin')) {
        throw new Error('You do not have permission to award points.');
      }
    }
  },
  async (input, context) => {
    const { studentId, points, reason, activityId, action, assignmentTitle } = input;
    
    try {
      // Use Firebase Admin SDK for server-side operations
      const { getFirestore } = await import('firebase-admin/firestore');
      const adminDb = getFirestore();
      
      const result = await adminDb.runTransaction(async (transaction) => {
        const userDocRef = adminDb.collection('users').doc(studentId);
        const userDoc = await transaction.get(userDocRef);
        
        // Ensure user document exists
        if (!userDoc.exists) {
          transaction.set(userDocRef, {
            totalPoints: 0,
            createdAt: serverTimestamp(),
          });
        }
        
        const currentTotalPoints = userDoc.exists ? (userDoc.data()?.totalPoints || 0) : 0;
        
        if (action === 'award') {
          const pointDocRef = userDocRef.collection('points').doc(activityId);
          
          // Check if points for this activity already exist
          const existingPointDoc = await transaction.get(pointDocRef);
          if (existingPointDoc.exists) {
            throw new Error('Points for this activity have already been awarded');
          }
          
          // Update total points
          transaction.update(userDocRef, {
            totalPoints: currentTotalPoints + points
          });

          // Create point log entry
          transaction.set(pointDocRef, {
            points,
            reason,
            assignmentTitle: assignmentTitle || reason,
            activityId,
            awardedAt: serverTimestamp(),
            awardedBy: context.auth?.uid || 'system',
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
          
          // Update total points
          transaction.update(userDocRef, {
            totalPoints: currentTotalPoints - pointsToRevoke
          });

          // Delete the point log entry
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
      
      if (error.code === 'permission-denied') {
        return { 
          success: false, 
          message: "Server error: Could not process points. Reason: Missing or insufficient permissions." 
        };
      }
      
      const errorMessage = error.message || "An unexpected error occurred.";
      return { 
        success: false, 
        message: `Server error: Could not process points. Reason: ${errorMessage}` 
      };
    }
  }
);