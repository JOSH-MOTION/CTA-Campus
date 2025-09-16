'use server';

/**
 * @fileOverview A secure flow for grading a student's submission.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { serverTimestamp } from 'firebase-admin/firestore';
import { adminDb, adminAuth } from '@/lib/firebase-admin';

const GradeSubmissionInputSchema = z.object({
  submissionId: z.string().describe("The ID of the submission document to grade."),
  studentId: z.string().describe("The UID of the student who made the submission."),
  assignmentTitle: z.string().describe("The title of the assignment being graded."),
  grade: z.string().optional().describe("The grade to award for the submission."),
  feedback: z.string().optional().describe("Optional feedback for the student."),
  idToken: z.string().describe("The Firebase ID token of the user making the request for authorization."),
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
    const { submissionId, studentId, grade, feedback, assignmentTitle, idToken } = input;

    try {
      if (!adminDb || !adminAuth) {
        throw new Error('Firebase Admin SDK not initialized.');
      }

      // Verify the token and get the user's custom claims (including role)
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      const role = decodedToken.role;

      // Authorize the request
      if (role !== 'teacher' && role !== 'admin') {
        throw new Error('You do not have permission to perform this action.');
      }
      
      const submissionRef = adminDb.collection('submissions').doc(submissionId);

      // Update the submission document with the grade and feedback
      await submissionRef.update({
        grade: grade,
        feedback: feedback || '',
        gradedAt: serverTimestamp(),
        gradedBy: decodedToken.uid,
      });

      // Create a notification for the student
      const notification = {
        userId: studentId,
        title: `Graded: ${assignmentTitle}`,
        description: `Your submission has been graded by ${decodedToken.name || 'your teacher'}.`,
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
