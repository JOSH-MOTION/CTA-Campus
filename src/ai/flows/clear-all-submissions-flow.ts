// src/ai/flows/clear-all-submissions-flow.ts
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { collection, getDocs, writeBatch, query, limit, startAfter, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
      const BATCH_SIZE = 500; // Firestore batch limit
      let totalDeleted = 0;
      let lastDoc = null;

      do {
        // Build query with pagination
        let q = query(submissionsRef, orderBy('__name__'), limit(BATCH_SIZE));
        if (lastDoc) {
          q = query(submissionsRef, orderBy('__name__'), startAfter(lastDoc), limit(BATCH_SIZE));
        }

        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          break;
        }

        const batch = writeBatch(db);
        querySnapshot.forEach(doc => {
          batch.delete(doc.ref);
        });

        await batch.commit();
        totalDeleted += querySnapshot.size;
        
        // Update lastDoc for pagination
        lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
        
      } while (lastDoc);

      if (totalDeleted === 0) {
        return { success: true, deletedCount: 0, message: 'No submissions to delete.' };
      }

      return { 
        success: true, 
        deletedCount: totalDeleted,
        message: `Successfully deleted ${totalDeleted} submission(s).` 
      };

    } catch (error: any) {
      console.error("Error clearing submissions:", error);
      const errorMessage = error.message || "An unexpected error occurred.";
      return { success: false, deletedCount: 0, message: `Server error: Could not clear submissions. Reason: ${errorMessage}` };
    }
  }
);