// src/lib/init-user.ts
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function initializeUserDoc(uid: string, displayName: string, gen: string, role: string = 'student') {
  const userDocRef = adminDb.collection('users').doc(uid);
  const userDoc = await userDocRef.get();
  if (!userDoc.exists) {
    await userDocRef.set({
      displayName,
      gen,
      role,
      totalPoints: 0,
      createdAt: FieldValue.serverTimestamp(),
    });
  }
}