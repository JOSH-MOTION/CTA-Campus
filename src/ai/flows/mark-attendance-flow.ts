'use server';

/**
 * @fileOverview A secure flow for marking student attendance and awarding points.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, increment, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth } from '@/lib/firebase'; // Import auth directly from firebase.ts

const MarkAttendanceFlowInputSchema = z.object({
  studentId: z.string().describe("The UID of the student."),
  studentName: z.string().describe("The name of the student."),
  studentGen: z.string().describe("The generation of the student."),
  classId: z.string().describe("The ID of the class session."),
  className: z.string().describe("The name of the class session."),
  learned: z.string().describe("What the student learned."),
  challenged: z.string().describe("What the student found challenging."),
  questions: z.string().optional().describe("Any questions the student has."),
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
    auth: auth, // Use the auth instance from firebase.ts
  },
  async (input, context) => {
    if (!context.auth) {
      throw new Error('Authentication is required to mark attendance.');
    }
    const { studentId, studentName, studentGen, classId, className, learned, challenged, questions } = input;
    const attendanceDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const activityId = `attendance-${classId}-${attendanceDate}`;

    try {
      // 1. Check if points have already been awarded for this specific activity
      const pointDocRef = doc(db, 'users', studentId, 'points', activityId);
      const pointDocSnap = await getDoc(pointDocRef);

      if (pointDocSnap.exists()) {
        // If points exist, we can still save the feedback, but we don't award more points.
        await addDoc(collection(db, 'attendance'), {
          studentId,
          studentName,
          studentGen,
          classId,
          className,
          learned,
          challenged,
          questions,
          submittedAt: serverTimestamp(),
        });
        return { success: true, message: "Attendance already marked for this session today, but your feedback was saved." };
      }

      // 2. Atomically increment the totalPoints on the user document
      const userDocRef = doc(db, 'users', studentId);
      await updateDoc(userDocRef, {
        totalPoints: increment(1)
      });

      // 3. Create a log entry for the points in the subcollection
      await setDoc(pointDocRef, {
        points: 1,
        reason: 'Class Attendance',
        assignmentTitle: `Attendance: ${className}`,
        activityId: activityId,
        awardedAt: serverTimestamp(),
      });

      // 4. Save the attendance feedback
      await addDoc(collection(db, 'attendance'), {
        studentId,
        studentName,
        studentGen,
        classId,
        className,
        learned,
        challenged,
        questions,
        submittedAt: serverTimestamp(),
      });

      return { success: true, message: 'Attendance marked and 1 point awarded!' };
    } catch (error: any) {
      console.error("Error processing attendance in flow:", error);
      if (error.code === 'permission-denied' || error.code === 7) {
        return { success: false, message: "Server error: Could not process points. Reason: Missing or insufficient permissions." };
      }
      const errorMessage = error.message || "An unexpected error occurred.";
      return { success: false, message: `Server error: Could not process points. Reason: ${errorMessage}` };
    }
  }
);