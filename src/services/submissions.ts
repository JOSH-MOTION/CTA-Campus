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
  import { awardPoint } from './points';
  
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
  }
  
  export interface NewSubmissionData extends Omit<Submission, 'id' | 'submittedAt'> {
      pointsToAward?: number;
      pointCategory?: string;
  }
  
  /**
   * Creates a new submission for an assignment.
   */
  export const addSubmission = async (submissionData: NewSubmissionData): Promise<{ id: string }> => {
    const { pointsToAward, pointCategory, ...restOfSubmissionData } = submissionData;
    
    // Use assignmentTitle for duplicate check, as it will be unique for each day's 100-days-of-code post
    const q = query(
        collection(db, 'submissions'),
        where('studentId', '==', submissionData.studentId),
        where('assignmentTitle', '==', submissionData.assignmentTitle)
    );
      
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        throw new Error('duplicate');
    }
      
    const docRef = await addDoc(collection(db, 'submissions'), {
        ...restOfSubmissionData,
        submittedAt: serverTimestamp(),
    });

    if (pointsToAward && pointCategory) {
        // We use the new submission's ID to ensure point awarding is idempotent
        const activityId = `graded-submission-${docRef.id}`;
        try {
            await awardPoint(submissionData.studentId, pointsToAward, pointCategory, activityId);
        } catch(e) {
            // If awarding points fails, we don't fail the whole submission,
            // but we log the error. The teacher can manually award points.
            console.error(`Failed to award points for submission ${docRef.id}:`, e);
        }
    }

    return { id: docRef.id };
  };
  
  /**
   * Fetches all submissions for a specific assignment in real-time.
   * @param assignmentId - The ID of the assignment to fetch submissions for.
   * @param callback - The function to call with the new array of submissions.
   * @returns An unsubscribe function to stop the listener.
   */
  export const onSubmissions = (assignmentId: string, callback: (submissions: Submission[]) => void) => {
    const submissionsCol = collection(db, 'submissions');
    const q = query(
      submissionsCol,
      where('assignmentId', '==', assignmentId),
      orderBy('submittedAt', 'desc')
    );
  
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const submissions: Submission[] = querySnapshot.docs.map((doc) => {
          const data = doc.data() as DocumentData;
          return {
            id: doc.id,
            ...data,
          } as Submission;
        });
        callback(submissions);
      },
      (error) => {
        console.error('Error listening to submissions:', error);
      }
    );
  
    return unsubscribe;
  };

  /**
   * Fetches all submissions across all assignments in real-time.
   * @param callback - The function to call with the new array of submissions.
   * @returns An unsubscribe function to stop the listener.
   */
  export const onAllSubmissions = (callback: (submissions: Submission[]) => void) => {
    const submissionsCol = collection(db, 'submissions');
    const q = query(submissionsCol, orderBy('submittedAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const submissions: Submission[] = querySnapshot.docs.map((doc) => {
          const data = doc.data() as DocumentData;
          return {
            id: doc.id,
            ...data,
          } as Submission;
        });
        callback(submissions);
      },
      (error) => {
        console.error('Error listening to all submissions:', error);
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
