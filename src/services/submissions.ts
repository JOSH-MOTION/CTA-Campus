// src/services/submissions.ts (UPDATED - Hybrid Firestore + MongoDB)
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  onSnapshot,
  Timestamp,
  orderBy,
  doc,
  deleteDoc,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Submission {
  id: string;
  studentId: string;
  studentName: string;
  studentGen: string;
  assignmentId: string;
  assignmentTitle: string;
  submissionLink?: string;
  submissionNotes: string;
  submittedAt: Timestamp;
  pointCategory: string;
  grade?: string;
  feedback?: string;
  imageUrl?: string;
}

export interface NewSubmissionData extends Omit<Submission, 'id' | 'submittedAt' | 'grade' | 'feedback'> {
  pointsToAward?: number;
}

/**
 * Creates a new submission - writes to both Firestore (for real-time) and MongoDB (for backup)
 */
export const addSubmission = async (submissionData: NewSubmissionData): Promise<{ id: string }> => {
  const { pointsToAward, ...restOfSubmissionData } = submissionData;
  
  if (!restOfSubmissionData.submissionLink && !restOfSubmissionData.imageUrl) {
    throw new Error("A submission link or an image is required.");
  }

  const is100Days = submissionData.assignmentId === '100-days-of-code';

  // Check for duplicates in Firestore
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
    
  // Write to Firestore (for real-time updates)
  const docRef = await addDoc(collection(db, 'submissions'), {
    ...restOfSubmissionData,
    submittedAt: serverTimestamp(),
  });

  // Sync to MongoDB in background (don't wait for it)
  syncSubmissionToMongoDB({
    id: docRef.id,
    ...restOfSubmissionData,
    submittedAt: new Date(),
  }).catch(err => {
    console.error('Background sync to MongoDB failed:', err);
  });

  // Send notification to staff
  try {
    const staffQuery = query(collection(db, 'users'), where('role', 'in', ['teacher', 'admin']));
    const staffSnapshot = await getDocs(staffQuery);
    
    const batch = writeBatch(db);
    staffSnapshot.forEach(staffDoc => {
      const notificationRef = doc(collection(db, 'notifications'));
      batch.set(notificationRef, {
        title: `New Submission: ${submissionData.assignmentTitle}`,
        description: `From ${submissionData.studentName} (${submissionData.studentGen})`,
        href: `/submissions`,
        userId: staffDoc.id,
        read: false,
        date: serverTimestamp(),
      });
    });
    await batch.commit();
  } catch (e) {
    console.error(`Failed to send notification for new submission ${docRef.id}:`, e);
  }

  return { id: docRef.id };
};

/**
 * Helper function to sync submission to MongoDB
 */
async function syncSubmissionToMongoDB(submission: any) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    await fetch(`${baseUrl}/api/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission),
    });
  } catch (error) {
    console.error('Error syncing submission to MongoDB:', error);
    throw error;
  }
}

/**
 * Fetches all submissions for a specific assignment once (from Firestore)
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
 * Fetches all submissions (from Firestore)
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
 * Real-time listener for student submissions (Firestore)
 */
export const onSubmissionsForStudent = (
  studentId: string, 
  callback: (submissions: Submission[], error: string | null) => void
) => {
  let unsubscribe: () => void = () => {};
  try {
    const submissionsCol = collection(db, 'submissions');
    const q = query(
      submissionsCol,
      where('studentId', '==', studentId),
      orderBy('submittedAt', 'desc')
    );

    unsubscribe = onSnapshot(
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
  } catch (error: any) {
    console.error(`Error setting up listener for student ${studentId}:`, error);
    callback([], "An unexpected error occurred while setting up the data listener.");
  }

  return unsubscribe;
};

/**
 * Deletes a submission from both Firestore and MongoDB
 */
export const deleteSubmission = async (submissionId: string, idToken?: string) => {
  try {
    // Delete from Firestore
    const submissionDoc = doc(db, 'submissions', submissionId);
    await deleteDoc(submissionDoc);

    // Delete from MongoDB in background
    if (idToken) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      fetch(`${baseUrl}/api/submissions/${submissionId}?idToken=${idToken}`, {
        method: 'DELETE',
      }).catch(err => {
        console.error('Background deletion from MongoDB failed:', err);
      });
    }
  } catch (error) {
    console.error('Error deleting submission:', error);
    throw error;
  }
};