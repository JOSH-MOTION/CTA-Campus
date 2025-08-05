// src/ai/flows/clear-all-submissions-flow.ts
'use server';
/**
 * @fileOverview A flow to clear all submissions.
 *
 * - clearAllSubmissionsFlow - A function that handles deleting all submissions.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { collection, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Submission } from '@/services/submissions';

const ClearAllSubmissionsOutputSchema = z.object({
  success: z.boolean(),
  deletedCount: z.number(),
  message: z.string(),
});

export const clearAllSubmissionsFlow = ai.defineFlow(
  {
    name: 'clearAllSubmissionsFlow',
    inputSchema: z.void(),
    outputSchema: ClearAllSubmissionsOutputSchema,
  },
  async () => {
    try {
      const submissionsRef = collection(db, 'submissions');
      const querySnapshot = await getDocs(submissionsRef);
      
      if (querySnapshot.empty) {
        return { success: true, deletedCount: 0, message: 'No submissions to delete.' };
      }

      const batch = writeBatch(db);
      querySnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      return { 
        success: true, 
        deletedCount: querySnapshot.size,
        message: 'All submissions have been successfully deleted.' 
      };

    } catch (error: any) {
      console.error("Error clearing submissions:", error);
      const errorMessage = error.message || "An unexpected error occurred.";
      return { success: false, deletedCount: 0, message: `Server error: Could not clear submissions. Reason: ${errorMessage}` };
    }
  }
);
