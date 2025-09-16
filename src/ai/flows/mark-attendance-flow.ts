'use server';

/**
 * @fileOverview A secure flow for marking student attendance and awarding points.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { serverTimestamp, increment } from 'firebase-admin/firestore';
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
        if (!adminDb || !adminAuth) {
            throw new Error('Firebase Admin SDK not initialized.');
        }

        // Verify the token to ensure the request is coming from an authenticated user.
        await adminAuth.verifyIdToken(idToken);
        
        const attendanceDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const activityId = `attendance-${classId}-${attendanceDate}`;
        
        const pointDocRef = adminDb.collection('users').doc(studentId).collection('points').doc(activityId);
        const pointDocSnap = await pointDocRef.get();

        if (pointDocSnap.exists()) {
            // If points exist, we can still save the feedback, but we don't award more points.
            await adminDb.collection('attendance').add({
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

        const userDocRef = adminDb.collection('users').doc(studentId);
        
        // Atomically increment points and save attendance records
        await adminDb.runTransaction(async (transaction) => {
            transaction.update(userDocRef, { totalPoints: increment(1) });
            
            transaction.set(pointDocRef, {
            points: 1,
            reason: 'Class Attendance',
            assignmentTitle: `Attendance: ${className}`,
            activityId: activityId,
            awardedAt: serverTimestamp(),
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
            submittedAt: serverTimestamp(),
            });
        });

        return { success: true, message: 'Attendance marked and 1 point awarded!' };
    } catch (error: any) {
        console.error("Error processing attendance in flow:", error);
        const errorMessage = error.message || "An unexpected error occurred.";
        return { success: false, message: `Server error: Could not process points. Reason: ${errorMessage}` };
    }
  }
);
