// src/ai/flows/grade-submission-flow.ts
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
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';

const GradeSubmissionInputSchema = z.object({
  submissionId: z.string().describe("The ID of the submission document to grade."),
  studentId: z.string().describe("The UID of the student who made the submission."),
  assignmentTitle: z.string().describe("The title of the assignment being graded."),
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
  },
  async (input) => {
    const { submissionId, studentId, grade, feedback, assignmentTitle } = input;
    
    try {
      const submissionRef = doc(db, 'submissions', submissionId);

      // Update the submission document with the grade and feedback
      await updateDoc(submissionRef, {
        grade: grade,
        feedback: feedback || '',
      });

      // Create a notification for the student
      const notification = {
        userId: studentId,
        title: `Graded: ${assignmentTitle}`,
        description: "Your submission has been graded by your teacher.",
        href: `/submissions`, // Simple link, can be improved to point to the exact item
        read: false,
        date: serverTimestamp(),
      };
      await addDoc(collection(db, 'notifications'), notification);

      return { success: true, message: 'Submission graded successfully.' };
    } catch (error: any) {
      console.error("Error grading submission in flow:", error);
      const errorMessage = error.message || "An unexpected error occurred.";
      return { success: false, message: `Server error: Could not grade submission. Reason: ${errorMessage}` };
    }
  }
);
