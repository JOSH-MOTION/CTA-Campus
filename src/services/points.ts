// src/services/points.ts
'use server';

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
 * DEPRECATED: This function is not secure to call from the client. 
 * Use the awardPointsFlow instead.
 */
export const awardPoint = async (userId: string, points: number, reason: string, activityId: string) => {
    throw new Error("awardPoint cannot be called from the client. Use awardPointsFlow.");
};

/**
 * DEPRECATED: This function is not secure to call from the client.
 * Use the awardPointsFlow instead.
 */
export const removePointByActivityId = async (userId: string, activityId: string): Promise<void> => {
     throw new Error("removePointByActivityId cannot be called from the client. Use awardPointsFlow.");
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
