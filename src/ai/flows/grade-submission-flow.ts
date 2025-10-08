// src/ai/flows/grade-submission-flow.ts
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { awardPointsFlow } from './award-points-flow';

const GradeSubmissionInputSchema = z.object({
  submissionId: z.string().describe("The ID of the submission to grade"),
  studentId: z.string().describe("The UID of the student"),
  assignmentTitle: z.string().describe("The title of the assignment"),
  grade: z.string().optional().describe("The assigned grade"),
  feedback: z.string().optional().describe("Feedback for the submission"),
  gradedBy: z.string().describe("The UID of the grader"),
  graderName: z.string().describe("The name of the grader"),
  idToken: z.string().describe("The Firebase ID token for authorization"),
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
    const { submissionId, studentId, assignmentTitle, grade, feedback, gradedBy, graderName, idToken } = input;

    try {
      // Verify the ID token
      await adminAuth.verifyIdToken(idToken);

      // Check if student user document exists
      const userDocRef = adminDb.collection('users').doc(studentId);
      const userDoc = await userDocRef.get();
      if (!userDoc.exists) {
        console.error(`User document not found for studentId: ${studentId}`);
        throw new Error('Student user document not found. Please ensure the student is registered.');
      }

      // Check if submission exists
      const submissionRef = adminDb.collection('submissions').doc(submissionId);
      const submissionDoc = await submissionRef.get();

      if (!submissionDoc.exists) {
        console.error(`Submission document not found for submissionId: ${submissionId}`);
        throw new Error('Submission not found.');
      }

      // Update the submission with grade and feedback
      await submissionRef.update({
        grade: grade || 'Complete',
        feedback: feedback || '',
        gradedBy,
        graderName,
        gradedAt: FieldValue.serverTimestamp(),
      });

      // Award points based on the submission's point category
      const submissionData = submissionDoc.data();
      const pointsToAward = getPointsForCategory(submissionData?.pointCategory);

      if (pointsToAward > 0) {
        const activityId = `graded-submission-${submissionId}`;
        const pointsResult = await awardPointsFlow({
          studentId,
          points: pointsToAward,
          reason: `Graded: ${assignmentTitle}`,
          activityId,
          action: 'award',
          awardedBy: gradedBy,
          assignmentTitle,
        });

        if (!pointsResult.success) {
          console.error(`Failed to award points for submissionId: ${submissionId}`, pointsResult.message);
          throw new Error(pointsResult.message);
        }
      }

      return {
        success: true,
        message: 'Submission graded successfully.',
      };
    } catch (error: any) {
      console.error('Error in gradeSubmissionFlow:', {
        error: error.message,
        submissionId,
        studentId,
        stack: error.stack,
      });
      return {
        success: false,
        message: error.message || 'Failed to grade submission.',
      };
    }
  }
);

function getPointsForCategory(category: string | undefined): number {
  switch (category) {
    case 'Class Assignments':
    case 'Class Exercises':
    case 'Weekly Projects':
      return 1;
    case '100 Days of Code':
      return 0.5;
    default:
      return 0;
  }
}