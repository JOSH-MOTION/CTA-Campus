// src/ai/flows/mark-attendance-flow.ts
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { getBaseUrl } from '@/lib/utils';

/* ---------- INPUT SCHEMA ---------- */
const MarkAttendanceFlowInputSchema = z.object({
  studentId: z.string(),
  studentName: z.string(),
  studentGen: z.string(),
  classId: z.string(),
  className: z.string(),
  learned: z.string(),
  challenged: z.string(),
  questions: z.string().optional(),
  rating: z.number().int().min(1).max(10),
  attendanceType: z.enum(['virtual', 'in-person']),
  understanding: z.number().int().min(1).max(10),
  actionPlan: z.string().min(10),
  preClassReview: z.enum(['yes', 'no']),
  idToken: z.string(),
});

export type MarkAttendanceFlowInput = z.infer<typeof MarkAttendanceFlowInputSchema>;

const MarkAttendanceFlowOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

/* ---------- HELPER: Send notification ---------- */
async function sendNotificationToUsers(
  userIds: string[],
  title: string,
  description: string,
  href: string = `${getBaseUrl()}/attendance`
) {
  if (userIds.length === 0) return;

  const batch: Promise<any>[] = [];
  for (const uid of userIds) {
    batch.push(
      adminDb.collection('notifications').add({
        title,
        description,
        userId: uid,
        read: false,
        date: FieldValue.serverTimestamp(),
        href,
      })
    );
  }

  try {
    await Promise.all(batch);
  } catch (error) {
    console.error('Error sending notifications:', error);
    // Don't throw - notifications are non-critical
  }
}

/* ---------- MAIN FLOW ---------- */
export const markAttendanceFlow = ai.defineFlow(
  {
    name: 'markAttendanceFlow',
    inputSchema: MarkAttendanceFlowInputSchema,
    outputSchema: MarkAttendanceFlowOutputSchema,
  },
  async (input) => {
    const {
      studentId,
      studentName,
      studentGen,
      classId,
      className,
      learned,
      challenged,
      questions,
      rating,
      attendanceType,
      understanding,
      actionPlan,
      preClassReview,
      idToken,
    } = input;

    try {
      // 1. Verify caller
      await adminAuth.verifyIdToken(idToken);

      const attendanceDate = new Date().toISOString().split('T')[0];
      const activityId = `attendance-${classId}-${attendanceDate}`;
      const pointDocRef = adminDb
        .collection('users')
        .doc(studentId)
        .collection('points')
        .doc(activityId);
      const pointDocSnap = await pointDocRef.get();

      // 2. Save full feedback
      const attendanceRef = adminDb.collection('attendance').doc();
      await attendanceRef.set({
        studentId,
        studentName,
        studentGen,
        classId,
        className,
        learned,
        challenged,
        questions: questions || '',
        rating,
        attendanceType,
        understanding,
        actionPlan,
        preClassReview,
        submittedAt: FieldValue.serverTimestamp(),
      });

      // 3. Get users to notify BEFORE checking duplicate
      let genMateIds: string[] = [];
      let staffIds: string[] = [];
      try {
        const [genMatesSnap, staffSnap] = await Promise.all([
          // All students in same gen (exclude self)
          adminDb
            .collection('users')
            .where('gen', '==', studentGen)
            .where('role', '==', 'student')
            .get(),
          // All teachers + admins
          adminDb
            .collection('users')
            .where('role', 'in', ['teacher', 'admin'])
            .get(),
        ]);

        genMateIds = genMatesSnap.docs
          .map(d => d.id)
          .filter(id => id !== studentId);

        staffIds = staffSnap.docs.map(d => d.id);
      } catch (notifyQueryError) {
        console.error('Error querying users for notifications:', notifyQueryError);
        // Continue without notifications
        genMateIds = [];
        staffIds = [];
      }

      // 4. Handle duplicate attendance
      if (pointDocSnap.exists) {
        // Notify submitter
        await sendNotificationToUsers(
          [studentId],
          `Feedback Saved: ${className}`,
          `Your feedback was recorded. Attendance already marked today.`
        );

        // Notify gen-mates (they only get notification, can't see details)
        await sendNotificationToUsers(
          genMateIds,
          `${studentName} attended ${className}`,
          `Your gen-mate just submitted feedback.`
        );

        // Notify staff (they can see full details)
        await sendNotificationToUsers(
          staffIds,
          `Feedback: ${studentName} (${studentGen})`,
          `Submitted attendance for ${className}.`
        );

        return {
          success: true,
          message: 'Feedback saved (attendance already marked).',
        };
      }

      // 5. Award point (transaction)
      await adminDb.runTransaction(async (transaction) => {
        const userRef = adminDb.collection('users').doc(studentId);
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists) throw new Error('User not found');

        transaction.update(userRef, { totalPoints: FieldValue.increment(1) });
        transaction.set(pointDocRef, {
          points: 1,
          reason: 'Class Attendance',
          assignmentTitle: `Attendance: ${className}`,
          activityId,
          awardedAt: FieldValue.serverTimestamp(),
        });
      });

      // 6. SUCCESS NOTIFICATIONS
      await Promise.all([
        // Student confirmation
        sendNotificationToUsers(
          [studentId],
          `Attendance Marked: ${className}`,
          `You earned 1 point!`
        ),

        // Gen-mates notification (simple, no details)
        sendNotificationToUsers(
          genMateIds,
          `${studentName} just attended!`,
          `${studentName} from ${studentGen} marked attendance for ${className}.`
        ),

        // Teachers/Admins (with details)
        sendNotificationToUsers(
          staffIds,
          `New Attendance: ${studentName}`,
          `${studentName} (${studentGen}) attended ${className}. Rating: ${rating}/10`
        ),
      ]);

      return { 
        success: true, 
        message: 'Attendance marked and 1 point awarded!' 
      };
    } catch (error: any) {
      console.error('markAttendanceFlow error:', error);
      return { 
        success: false, 
        message: error.message || 'Server error' 
      };
    }
  }
);