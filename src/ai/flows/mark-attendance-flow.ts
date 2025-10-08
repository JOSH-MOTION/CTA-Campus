// src/ai/flows/mark-attendance-flow.ts
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getBaseUrl } from '@/lib/utils';

const MarkAttendanceFlowInputSchema = z.object({
  studentId: z.string().describe("The UID of the student."),
  studentName: z.string().describe("The name of the student."),
  studentGen: z.string().describe("The generation of the student."),
  classId: z.string().describe("The ID of the class session."),
  className: z.string().describe("The name of the class session."),
  learned: z.string().describe("What the student learned."),
  challenged: z.string().describe("What the student found challenging."),
  questions: z.string().optional().describe("Any questions the student has."),
  idToken: z.string().describe("The Firebase ID token of the user making the request for authorization."),
});

export type MarkAttendanceFlowInput = z.infer<typeof MarkAttendanceFlowInputSchema>;

const MarkAttendanceFlowOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type MarkAttendanceFlowOutput = z.infer<typeof MarkAttendanceFlowOutputSchema>;

export const markAttendanceFlow = ai.defineFlow(
  {
    name: 'markAttendanceFlow',
    inputSchema: MarkAttendanceFlowInputSchema,
    outputSchema: MarkAttendanceFlowOutputSchema,
  },
  async (input) => {
    const { studentId, studentName, studentGen, classId, className, learned, challenged, questions, idToken } = input;

    try {
      // Verify the ID token
      await adminAuth.verifyIdToken(idToken);

      const attendanceDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const activityId = `attendance-${classId}-${attendanceDate}`;

      const pointDocRef = adminDb.collection('users').doc(studentId).collection('points').doc(activityId);
      const pointDocSnap = await pointDocRef.get();

      // Always save attendance feedback
      const attendanceRef = adminDb.collection('attendance').doc();
      await attendanceRef.set({
        studentId,
        studentName,
        studentGen,
        classId,
        className,
        learned,
        challenged,
        questions,
        submittedAt: FieldValue.serverTimestamp(),
      });

      // If points already awarded, return early
      if (pointDocSnap.exists) {
        // Add in-app notification for feedback submission
        try {
          await addDoc(collection(db, 'notifications'), {
            title: `Attendance Feedback Submitted: ${className}`,
            description: `Your feedback for ${className} has been recorded. Attendance was already marked for today.`,
            userId: studentId,
            read: false,
            date: serverTimestamp(),
            href: `${getBaseUrl()}/attendance`,
          });
        } catch (notificationError: any) {
          console.error('Non-critical error adding notification:', {
            error: notificationError.message,
            studentId,
            classId,
            stack: notificationError.stack,
          });
          // Don't throw, as notification failure shouldn't block attendance
        }

        return { success: true, message: "Attendance already marked for this session today, but your feedback was saved." };
      }

      // Award points and save attendance in a transaction
      await adminDb.runTransaction(async (transaction) => {
        const userDocRef = adminDb.collection('users').doc(studentId);
        const userDoc = await userDocRef.get();

        if (!userDoc.exists) {
          console.error(`User document not found for studentId: ${studentId}`);
          throw new Error('Student user document not found. Please ensure the student is registered.');
        }

        transaction.update(userDocRef, { totalPoints: FieldValue.increment(1) });

        transaction.set(pointDocRef, {
          points: 1,
          reason: 'Class Attendance',
          assignmentTitle: `Attendance: ${className}`,
          activityId: activityId,
          awardedAt: FieldValue.serverTimestamp(),
        });
      });

      // Add in-app notification for successful attendance
      try {
        await addDoc(collection(db, 'notifications'), {
          title: `Attendance Marked: ${className}`,
          description: `Your attendance for ${className} has been recorded. You earned 1 point!`,
          userId: studentId,
          read: false,
          date: serverTimestamp(),
          href: `${getBaseUrl()}/attendance`,
        });
      } catch (notificationError: any) {
        console.error('Non-critical error adding notification:', {
          error: notificationError.message,
          studentId,
          classId,
          stack: notificationError.stack,
        });
        // Don't throw, as notification failure shouldn't block attendance
      }

      return { success: true, message: 'Attendance marked and 1 point awarded!' };
    } catch (error: any) {
      console.error('Error processing attendance in flow:', {
        error: error.message,
        studentId,
        classId,
        stack: error.stack,
      });
      return { success: false, message: `Server error: Could not process attendance. Reason: ${error.message || 'An unexpected error occurred.'}` };
    }
  }
);