// src/services/users.ts
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserData } from '@/contexts/AuthContext';

// Note: This file is created to break a circular dependency between Notifications and Auth contexts.

/**
 * Fetches all user documents from Firestore.
 * @returns A promise that resolves to an array of all users.
 */
export const fetchAllUsers = async (): Promise<UserData[]> => {
  try {
    const usersCollection = collection(db, 'users');
    const usersSnapshot = await getDocs(usersCollection);
    const usersList = usersSnapshot.docs.map(doc => doc.data() as UserData);
    return usersList;
  } catch (e) {
    console.error("Error fetching all users:", e);
    return [];
  }
};
