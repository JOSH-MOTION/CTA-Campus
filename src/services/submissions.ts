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
  
  export type NewSubmissionData = Omit<Submission, 'id' | 'submittedAt'>;
  
  /**
   * Creates a new submission for an assignment.
   */
  export const addSubmission = async (submissionData: NewSubmissionData): Promise<{ id: string }> => {
    try {
      const submissionsCol = collection(db, 'submissions');
      const q = query(
        submissionsCol,
        where('studentId', '==', submissionData.studentId),
        where('assignmentId', '==', submissionData.assignmentId)
      );
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
          throw new Error('duplicate');
      }
      
      const docRef = await addDoc(submissionsCol, {
        ...submissionData,
        submittedAt: serverTimestamp(),
      });
      return { id: docRef.id };
    } catch (error) {
      console.error('Error creating submission:', error);
      throw error;
    }
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
