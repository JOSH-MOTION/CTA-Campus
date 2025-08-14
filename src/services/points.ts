// src/services/points.ts
'use server';

import {
    collection,
    doc,
    getDoc,
    getDocs,
    Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserData } from '@/contexts/AuthContext';


export interface PointEntry {
    id: string;
    points: number;
    reason: string;
    activityId: string;
    awardedAt: Timestamp;
}

/**
 * Retrieves the total points for a single user by reading the totalPoints field.
 * @param userId - The UID of the user.
 * @returns The total points for the user.
 */
export const getPointsForStudent = async (userId: string): Promise<number> => {
  const userDocRef = doc(db, 'users', userId);
  const docSnap = await getDoc(userDocRef);

  if (docSnap.exists()) {
    const userData = docSnap.data() as UserData;
    // Return the totalPoints field, defaulting to 0 if it doesn't exist.
    return userData.totalPoints || 0;
  }

  // If the user document doesn't exist, they have 0 points.
  return 0;
};
