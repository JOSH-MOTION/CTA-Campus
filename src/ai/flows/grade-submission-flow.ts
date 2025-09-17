// src/ai/flows/grade-submission-flow.ts
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
  gradedBy: z.string().describe("The UID of the user grading the submission."),
  graderName: z.string().describe("The display name of the user grading the submission."),
  idToken: z.string().describe("The Firebase ID token for authentication."), // Added this
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
    const { submissionId, studentId, grade, feedback, assignmentTitle, gradedBy, graderName, idToken } = input;

    try {
      if (!adminDb || !adminAuth) {
        throw new Error('Firebase Admin SDK not initialized.');
      }

      // Verify the ID token first
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      
      // Check if the token user matches the grader
      if (decodedToken.uid !== gradedBy) {
        throw new Error('Token user does not match grader ID.');
      }

      // Check if user has permission to grade (teacher or admin role)
      if (!decodedToken.role || !['teacher', 'admin'].includes(decodedToken.role)) {
        throw new Error('Insufficient permissions to grade submissions.');
      }
      
      const submissionRef = adminDb.collection('submissions').doc(submissionId);
      
      // Check if submission exists
      const submissionDoc = await submissionRef.get();
      if (!submissionDoc.exists) {
        throw new Error('Submission not found.');
      }

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

      // Handle specific authentication errors
      if (error.code === 'auth/id-token-expired') {
        return { success: false, message: 'Session expired. Please refresh the page and try again.' };
      }
      if (error.code === 'auth/id-token-revoked') {
        return { success: false, message: 'Session invalid. Please login again.' };
      }
      if (error.code === 'auth/argument-error') {
        return { success: false, message: 'Invalid authentication token. Please refresh and try again.' };
      }

      const errorMessage = error.message || "An unexpected error occurred.";
      return { success: false, message: `Server error: Could not grade submission. Reason: ${errorMessage}` };
    }
  }
);