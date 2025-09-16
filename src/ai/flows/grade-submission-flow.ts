'use server';

/**
 * @fileOverview A secure flow for grading a student's submission.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { serverTimestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';

const GradeSubmissionInputSchema = z.object({
  submissionId: z.string().describe("The ID of the submission document to grade."),
  studentId: z.string().describe("The UID of the student who made the submission."),
  assignmentTitle: z.string().describe("The title of the assignment being graded."),
  grade: z.string().optional().describe("The grade to award for the submission."),
  feedback: z.string().optional().describe("Optional feedback for the student."),
  gradedBy: z.string().describe("The UID of the user grading the submission."),
  graderName: z.string().describe("The display name of the user grading the submission."),
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
    const { submissionId, studentId, grade, feedback, assignmentTitle, gradedBy, graderName } = input;

    try {
      if (!adminDb) {
        throw new Error('Firebase Admin SDK not initialized.');
      }
      
      const submissionRef = adminDb.collection('submissions').doc(submissionId);

      // Update the submission document with the grade and feedback
      await submissionRef.update({
        grade: grade,
        feedback: feedback || '',
        gradedAt: serverTimestamp(),
        gradedBy: gradedBy,
      });

      // Create a notification for the student
      const notification = {
        userId: studentId,
        title: `Graded: ${assignmentTitle}`,
        description: `Your submission has been graded by ${graderName}.`,
        href: `/submissions`,
        read: false,
        date: serverTimestamp(),
      };
      await adminDb.collection('notifications').add(notification);

      return { success: true, message: 'Submission graded successfully.' };
    } catch (error: any) {
      console.error("Error grading submission in flow:", error);

      const errorMessage = error.message || "An unexpected error occurred.";
      return { success: false, message: `Server error: Could not grade submission. Reason: ${errorMessage}` };
    }
  }
);
