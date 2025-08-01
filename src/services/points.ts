// src/services/points.ts
import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    serverTimestamp,
    query,
    where,
    writeBatch,
    collectionGroup,
    setDoc,
    deleteDoc,
    orderBy,
    Timestamp,
    onSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';


export interface PointEntry {
    id: string;
    points: number;
    reason: string;
    activityId: string;
    awardedAt: Timestamp;
}

/**
 * Awards points to a user for a specific activity, ensuring idempotency.
 * @param userId - The UID of the user to award points to.
 * @param points - The number of points to award.
 * @param reason - A short description of why the points are being awarded.
 * @param activityId - A unique ID for the specific activity (e.g., `assignment-xyz`, `attendance-2024-05-21`).
 */
export const awardPoint = async (userId: string, points: number, reason: string, activityId: string) => {
  const pointDocRef = doc(db, 'users', userId, 'points', activityId);

  const docSnap = await getDoc(pointDocRef);
  if (docSnap.exists()) {
    // The user has already been awarded points for this specific activity.
    throw new Error('duplicate');
  }
  
  await setDoc(pointDocRef, {
    points,
    reason,
    activityId, // Store the activity ID to prevent duplicates
    awardedAt: serverTimestamp(),
  });
};

/**
 * Removes a point record associated with a specific activity.
 * This is used when deleting a submission to also revoke points.
 * @param userId The user's ID
 * @param activityId The unique ID of the activity to remove the point for
 */
export const removePointByActivityId = async (userId: string, activityId: string): Promise<void> => {
    const pointDocRef = doc(db, 'users', userId, 'points', activityId);
    try {
        await deleteDoc(pointDocRef);
    } catch(error) {
        console.error("Error removing point:", error);
        // We don't throw here, as the submission might have been deleted anyway.
        // It's not critical if the point record was already gone.
        // Throwing could prevent the UI from updating correctly.
    }
};

/**
 * Deletes a specific point entry by its document ID.
 * @param userId The user's ID
 * @param pointId The unique ID of the point document to delete
 */
export const deletePointEntry = async (userId: string, pointId: string): Promise<void> => {
    const pointDocRef = doc(db, 'users', userId, 'points', pointId);
    try {
        await deleteDoc(pointDocRef);
    } catch (error) {
        console.error("Error deleting point entry:", error);
        throw error;
    }
};


/**
 * Checks if a point has already been awarded for a specific activity.
 * @param userId The user's ID
 * @param activityId The unique ID of the activity
 * @returns true if the point has been awarded, false otherwise
 */
export const hasPointBeenAwarded = async (userId: string, activityId: string): Promise<boolean> => {
    const pointDocRef = doc(db, 'users', userId, 'points', activityId);
    const docSnap = await getDoc(pointDocRef);
    return docSnap.exists();
};


/**
 * Retrieves the total points for a single user.
 * @param userId - The UID of the user.
 * @returns The total points for the user.
 */
export const getPointsForStudent = async (userId: string): Promise<number> => {
  const pointsCol = collection(db, 'users', userId, 'points');
  const querySnapshot = await getDocs(pointsCol);
  
  let totalPoints = 0;
  querySnapshot.forEach(doc => {
    totalPoints += doc.data().points || 0;
  });

  return totalPoints;
};

/**
 * Sets up a real-time listener for all point entries for a specific student.
 * @param studentId The UID of the student.
 * @param callback The function to call with the new array of point entries.
 * @returns An unsubscribe function to stop the listener.
 */
export const onPointsForStudent = (studentId: string, callback: (points: PointEntry[]) => void) => {
    const pointsCol = collection(db, 'users', studentId, 'points');
    const q = query(pointsCol, orderBy('awardedAt', 'desc'));

    const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
            const points: PointEntry[] = querySnapshot.docs.map((doc) => {
                return { id: doc.id, ...doc.data() } as PointEntry;
            });
            callback(points);
        },
        (error) => {
            console.error(`Error listening to points for student ${studentId}:`, error);
        }
    );

    return unsubscribe;
};
