'use server';

/**
 * @fileOverview A secure flow for grading a student's submission.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth } from '@/lib/firebase'; // Import auth directly from firebase.ts

const GradeSubmissionInputSchema = z.object({
  submissionId: z.string().describe("The ID of the submission document to grade."),
  studentId: z.string().describe("The UID of the student who made the submission."),
  assignmentTitle: z.string().describe("The title of the assignment being graded."),
  grade: z.string().optional().describe("The grade to award for the submission."),
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
    auth: auth, // Use the auth instance from firebase.ts
  },
  async (input, context) => {
    if (!context.auth) {
      throw new Error('Authentication is required.');
    }
    if (context.auth.role !== 'teacher' && context.auth.role !== 'admin') {
      throw new Error('You do not have permission to perform this action.');
    }

    const { submissionId, studentId, grade, feedback, assignmentTitle } = input;

    try {
      const submissionRef = doc(db, 'submissions', submissionId);

      // Update the submission document with the grade and feedback
      await updateDoc(submissionRef, {
        grade: grade,
        feedback: feedback || '',
        gradedAt: serverTimestamp(),
        gradedBy: context.auth?.uid,
      });

      // Create a notification for the student
      const notification = {
        userId: studentId,
        title: `Graded: ${assignmentTitle}`,
        description: `Your submission has been graded by ${context.auth?.name || 'your teacher'}.`,
        href: `/submissions`,
        read: false,
        date: serverTimestamp(),
      };
      await addDoc(collection(db, 'notifications'), notification);

      return { success: true, message: 'Submission graded successfully.' };
    } catch (error: any) {
      console.error("Error grading submission in flow:", error);

      // Handle Firestore permission errors
      if (error.code === 'permission-denied' || error.code === 7) {
        return { success: false, message: "Server error: Could not grade submission. Reason: Missing or insufficient permissions." };
      }

      const errorMessage = error.message || "An unexpected error occurred.";
      return { success: false, message: `Server error: Could not grade submission. Reason: ${errorMessage}` };
    }
  }
);