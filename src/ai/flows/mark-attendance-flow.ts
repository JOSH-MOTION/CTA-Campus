'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, adminAuth } from '@/lib/firebase-admin';

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
      await adminAuth.verifyIdToken(idToken);
      
      const attendanceDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const activityId = `attendance-${classId}-${attendanceDate}`;
      
      const pointDocRef = adminDb.collection('users').doc(studentId).collection('points').doc(activityId);
      const pointDocSnap = await pointDocRef.get();

      if (pointDocSnap.exists) {
        await adminDb.collection('attendance').add({
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
        return { success: true, message: "Attendance already marked for this session today, but your feedback was saved." };
      }

      const userDocRef = adminDb.collection('users').doc(studentId);
      const userDoc = await userDocRef.get();

      if (!userDoc.exists) {
        console.error(`User document not found for studentId: ${studentId}`);
        throw new Error('Student user document not found. Please ensure the student is registered.');
      }
      
      await adminDb.runTransaction(async (transaction) => {
        transaction.update(userDocRef, { totalPoints: FieldValue.increment(1) });
        
        transaction.set(pointDocRef, {
          points: 1,
          reason: 'Class Attendance',
          assignmentTitle: `Attendance: ${className}`,
          activityId: activityId,
          awardedAt: FieldValue.serverTimestamp(),
        });
        
        const attendanceRef = adminDb.collection('attendance').doc();
        transaction.set(attendanceRef, {
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
      });

      return { success: true, message: 'Attendance marked and 1 point awarded!' };
    } catch (error: any) {
      console.error("Error processing attendance in flow:", {
        error: error.message,
        studentId,
        classId
      });
      const errorMessage = error.message || "An unexpected error occurred.";
      return { success: false, message: `Server error: Could not process points. Reason: ${errorMessage}` };
    }
  }
);