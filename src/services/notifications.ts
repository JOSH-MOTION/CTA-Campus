// src/services/notifications.ts
import { collection, addDoc, serverTimestamp, doc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { fetchAllUsers } from './users'; 

// Note: This file is created to break a circular dependency between Submissions and Notifications contexts.

/**
 * Creates a notification for all users of a specific generation or role.
 * @param targetGen - The generation to notify (e.g., "Gen 30", "All Students", "All Staff", "Everyone").
 * @param notificationData - The content of the notification.
 */
export const addNotificationForGen = async (
  targetGen: string,
  notificationData: { title: string; description: string; href: string }
) => {
  const users = await fetchAllUsers();
  const batch = writeBatch(db);

  const targetUsers = users.filter(u => {
    if (targetGen === 'Everyone') return true;
    if (targetGen === 'All Staff' && (u.role === 'teacher' || u.role === 'admin')) return true;
    if (targetGen === 'All Students' && u.role === 'student') return true;
    if (u.gen === targetGen) return true;
    return false;
  });

  targetUsers.forEach(targetUser => {
    const newNotification = {
      ...notificationData,
      userId: targetUser.uid,
      read: false,
      date: serverTimestamp(),
    };
    const notificationRef = doc(collection(db, 'notifications'));
    batch.set(notificationRef, newNotification);
  });

  await batch.commit();
};
