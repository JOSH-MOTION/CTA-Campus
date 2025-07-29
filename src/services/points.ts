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
    setDoc
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
  
  await setDoc(pointDocRef, {
    points,
    reason,
    activityId, // Store the activity ID to prevent duplicates
    awardedAt: serverTimestamp(),
  });
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
 * Retrieves total points for all students efficiently using a collectionGroup query.
 * @returns A map of student UID to their total points.
 */
export const getPointsForAllStudents = async (): Promise<{[key: string]: number}> => {
    const pointsMap: {[key: string]: number} = {};
    
    // Use a collection group query to get all 'points' documents across all users.
    const pointsQuery = query(collectionGroup(db, 'points'));
    const querySnapshot = await getDocs(pointsQuery);

    querySnapshot.forEach(doc => {
        const data = doc.data();
        // The parent of a document in a subcollection is one level up.
        // The path is 'users/{userId}/points/{pointId}'
        const userId = doc.ref.parent.parent?.id; 
        
        if (userId) {
            if (!pointsMap[userId]) {
                pointsMap[userId] = 0;
            }
            pointsMap[userId] += data.points || 0;
        }
    });

    return pointsMap;
}
