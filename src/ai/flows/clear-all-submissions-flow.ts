// src/ai/flows/clear-all-submissions-flow.ts
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { adminDb } from '@/lib/firebase-admin';

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
      const submissionsRef = adminDb.collection('submissions');
      const BATCH_SIZE = 500; // Firestore batch limit
      let totalDeleted = 0;

      while (true) {
        const snapshot = await submissionsRef.limit(BATCH_SIZE).get();

        if (snapshot.empty) {
          break;
        }

        const batch = adminDb.batch();
        snapshot.forEach(doc => {
          batch.delete(doc.ref);
        });

        await batch.commit();
        totalDeleted += snapshot.size;
      }

      if (totalDeleted === 0) {
        return { success: true, deletedCount: 0, message: 'No submissions to delete.' };
      }

      return {
        success: true,
        deletedCount: totalDeleted,
        message: `Successfully deleted ${totalDeleted} submission(s).`,
      };
    } catch (error: any) {
      console.error('Error clearing submissions:', {
        error: error.message,
        stack: error.stack,
      });
      return {
        success: false,
        deletedCount: 0,
        message: `Server error: Could not clear submissions. Reason: ${error.message || 'An unexpected error occurred.'}`,
      };
    }
  }
);