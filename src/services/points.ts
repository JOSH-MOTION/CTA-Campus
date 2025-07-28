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
    writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

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

  await addDoc(collection(db, 'users', userId, 'points'), {
    points,
    reason,
    activityId, // Store the activity ID to prevent duplicates
    awardedAt: serverTimestamp(),
  });
};

/**
 * Retrieves the total points for a single user.
 * @param userId - The UID of the user.
 * @returns The total points for the user.
 */
export const getTotalPointsForUser = async (userId: string): Promise<number> => {
  const pointsCol = collection(db, 'users', userId, 'points');
  const querySnapshot = await getDocs(pointsCol);
  
  let totalPoints = 0;
  querySnapshot.forEach(doc => {
    totalPoints += doc.data().points || 0;
  });

  return totalPoints;
};

/**
 * Retrieves total points for all students efficiently.
 * @param studentUids - An array of student UIDs.
 * @returns A map of student UID to their total points.
 */
export const getPointsForAllStudents = async (studentUids: string[]): Promise<{[key: string]: number}> => {
    if (studentUids.length === 0) {
        return {};
    }

    const pointsMap: {[key: string]: number} = {};
    studentUids.forEach(uid => pointsMap[uid] = 0);

    // Firestore 'in' query is limited to 30 items. We need to batch our requests.
    const batchSize = 30;
    for (let i = 0; i < studentUids.length; i += batchSize) {
        const batchUids = studentUids.slice(i, i + batchSize);
        const pointsCol = collection(db, 'users');
        
        // This is a bit of a workaround because we can't query subcollections directly
        // across different parent documents. We fetch all point documents for the users in the batch.
        const pointPromises = batchUids.map(uid => getDocs(collection(pointsCol, uid, 'points')));
        const snapshots = await Promise.all(pointPromises);

        snapshots.forEach((snapshot, index) => {
            const uid = batchUids[index];
            let totalPoints = 0;
            snapshot.forEach(doc => {
                totalPoints += doc.data().points || 0;
            });
            pointsMap[uid] = totalPoints;
        });
    }

    return pointsMap;
}
