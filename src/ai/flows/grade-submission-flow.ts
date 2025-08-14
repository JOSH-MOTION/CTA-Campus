'use server';
/**
 * @fileOverview A secure flow for grading a student's submission.
 *
 * - gradeSubmissionFlow - A function that handles grading a submission.
 * - GradeSubmissionInput - The input type for the gradeSubmissionFlow function.
 * - GradeSubmissionOutput - The return type for the gradeSubmissionFlow function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

const GradeSubmissionInputSchema = z.object({
  submissionId: z.string().describe("The ID of the submission document to grade."),
  studentId: z.string().describe("The UID of the student who made the submission."),
  grade: z.string().default('Complete').describe("The grade to award for the submission."),
  feedback: z.string().optional().describe("Optional feedback for the student."),
});
export type GradeSubmissionInput = z.infer<typeof GradeSubmissionInputSchema>;

const GradeSubmissionOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type GradeSubmissionOutput = z.infer<typeof GradeSubmissionOutputSchema>;

export const gradeSubmissionFlow = ai.defineFlow(
  {
    name: 'gradeSubmissionFlow',
    inputSchema: GradeSubmissionInputSchema,
    outputSchema: GradeSubmissionOutputSchema,
    auth: {
      policy: (auth, input) => {
        if (!auth) {
          throw new Error('Authentication required.');
        }
        if (auth.role !== 'teacher' && auth.role !== 'admin') {
          throw new Error('Only teachers or admins can grade submissions.');
        }
      }
    }
  },
  async (input) => {
    const { submissionId, studentId, grade, feedback } = input;
    
    try {
      const submissionRef = doc(db, 'submissions', submissionId);
      const userRef = doc(db, 'users', studentId);

      // Update the submission document
      await updateDoc(submissionRef, {
        grade: grade,
        feedback: feedback || '',
      });

      // Update the user document
      await updateDoc(userRef, {
        grade: grade,
        feedback: feedback || '',
      });

      return { success: true, message: 'Submission graded successfully.' };
    } catch (error: any) {
      console.error("Error grading submission in flow:", error);
      const errorMessage = error.message || "An unexpected error occurred.";
      return { success: false, message: `Server error: Could not grade submission. Reason: ${errorMessage}` };
    }
  }
);
