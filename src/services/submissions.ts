// src/services/submissions.ts
import {
    collection,
    addDoc,
    serverTimestamp,
    query,
    where,
    onSnapshot,
    Timestamp,
    DocumentData,
    orderBy,
    doc,
    deleteDoc,
    getDocs,
  } from 'firebase/firestore';
  import { db } from '@/lib/firebase';
  import { awardPointsFlow } from '@/ai/flows/award-points-flow';
import { addNotificationForGen } from '@/services/notifications';
  
  export interface Submission {
    id: string;
    studentId: string;
    studentName: string;
    studentGen: string;
    assignmentId: string;
    assignmentTitle: string;
    submissionLink: string;
    submissionNotes: string;
    submittedAt: Timestamp;
    pointCategory: string;
    grade?: string;
    feedback?: string;
  }
  
  export interface NewSubmissionData extends Omit<Submission, 'id' | 'submittedAt' | 'grade' | 'feedback'> {
      pointsToAward?: number;
  }
  
  /**
   * Creates a new submission for an assignment.
   */
  export const addSubmission = async (submissionData: NewSubmissionData): Promise<{ id: string }> => {
    const { pointsToAward, ...restOfSubmissionData } = submissionData;
    
    const is100Days = submissionData.assignmentId === '100-days-of-code';

    // For "100 Days of Code", check by title. For others, check by assignment ID.
    const duplicateCheckQuery = is100Days
      ? query(
          collection(db, 'submissions'),
          where('studentId', '==', submissionData.studentId),
          where('assignmentTitle', '==', submissionData.assignmentTitle)
        )
      : query(
          collection(db, 'submissions'),
          where('studentId', '==', submissionData.studentId),
          where('assignmentId', '==', submissionData.assignmentId)
        );
      
    const querySnapshot = await getDocs(duplicateCheckQuery);
    if (!querySnapshot.empty) {
       throw new Error('duplicate');
    }
      
    const docRef = await addDoc(collection(db, 'submissions'), {
        ...restOfSubmissionData,
        submittedAt: serverTimestamp(),
    });

    // Award points for 100 Days of Code immediately
    if (pointsToAward && is100Days) {
        const activityId = `100-days-of-code-${submissionData.assignmentTitle.replace('100 Days of Code - ', '')}`;
        try {
             await awardPointsFlow({
                studentId: submissionData.studentId,
                points: pointsToAward,
                reason: '100 Days of Code',
                activityId: activityId,
                action: 'award',
                assignmentTitle: submissionData.assignmentTitle
            });
        } catch(e) {
            console.error(`Failed to award points for 100 Days of Code submission ${docRef.id}:`, e);
        }
    }

    // Send notification to all staff
    try {
        await addNotificationForGen('All Staff', {
            title: `New Submission: ${submissionData.assignmentTitle}`,
            description: `From ${submissionData.studentName} (${submissionData.studentGen})`,
            href: `/submissions`,
        });
    } catch (e) {
        console.error(`Failed to send notification for new submission ${docRef.id}:`, e);
    }


    return { id: docRef.id };
  };
  
 /**
 * Fetches all submissions for a specific assignment once.
 * @param assignmentId - The ID of the assignment to fetch submissions for.
 * @returns A promise that resolves to an array of submissions.
 */
export const fetchSubmissions = async (assignmentId: string): Promise<Submission[]> => {
    try {
        const submissionsCol = collection(db, 'submissions');
        const q = query(
            submissionsCol,
            where('assignmentId', '==', assignmentId),
            orderBy('submittedAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        } as Submission));
    } catch (error) {
        console.error(`Error fetching submissions for ${assignmentId}:`, error);
        throw error;
    }
};

  /**
   * Fetches all submissions across all assignments once.
   * @returns A promise that resolves to an array of all submissions.
   */
  export const getAllSubmissions = async (): Promise<Submission[]> => {
    try {
      const submissionsCol = collection(db, 'submissions');
      const q = query(submissionsCol, orderBy('submittedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Submission));
    } catch (error) {
        console.error('Error fetching all submissions:', error);
        throw new Error("Could not fetch submissions.");
    }
  };

  /**
   * Fetches all submissions for a specific student in real-time.
   * @param studentId - The UID of the student.
   * @param callback - The function to call with the new array of submissions and an optional error message.
   * @returns An unsubscribe function to stop the listener.
   */
    export const onSubmissionsForStudent = (studentId: string, callback: (submissions: Submission[], error: string | null) => void) => {
        const submissionsCol = collection(db, 'submissions');
        const q = query(
        submissionsCol,
        where('studentId', '==', studentId),
        orderBy('submittedAt', 'desc')
        );

        const unsubscribe = onSnapshot(
            q,
            (querySnapshot) => {
                const submissions: Submission[] = querySnapshot.docs.map((doc) => {
                return { id: doc.id, ...doc.data() } as Submission;
                });
                callback(submissions, null);
            },
            (error) => {
                console.error(`Error listening to submissions for student ${studentId}:`, error);
                let errorMessage = "Could not load submissions. Please try again later.";
                if (error.code === 'failed-precondition') {
                    errorMessage = "The required database index is still being built. Please wait a few minutes and try again.";
                }
                callback([], errorMessage);
            }
        );

        return unsubscribe;
    };


  /**
   * Deletes a submission from the database.
   * @param submissionId - The ID of the submission to delete.
   */
  export const deleteSubmission = async (submissionId: string) => {
    try {
      const submissionDoc = doc(db, 'submissions', submissionId);
      await deleteDoc(submissionDoc);
    } catch (error) {
      console.error('Error deleting submission:', error);
      throw error;
    }
  };
