// src/lib/firebase-messaging.ts
'use client';

import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { app } from './firebase';

const messaging = typeof window !== 'undefined' && (await isSupported()) ? getMessaging(app) : null;

export const requestNotificationPermission = async () => {
  if (!messaging) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const token = await getToken(messaging, {
      vapidKey: 'BF67fLNLby7dkzsIhhE_DPeElR0mYXTp-lv9O27C6gKwxeMK8l6FsVfJtkq8Tl7WI7PmwF9GqCeuGCR-tkqCwh8', // ← replace with real key from Firebase Console
    });

    if (token) {
      await saveTokenToDatabase(token);
      console.log('FCM Token saved');
    }
    return token;
  } catch (err) {
    console.error('FCM Error:', err);
    return null;
  }
};

// Fixed: onMessage no longer returns unsubscribe → just call and forget
export const onForegroundMessage = (callback: (payload: any) => void) => {
  if (!messaging) return;

  onMessage(messaging, (payload) => {
    callback(payload);
    // Optional: also play sound or refresh notifications here
  });
};

// Save token to Firestore (runs only on client)
async function saveTokenToDatabase(token: string) {
  if (typeof window === 'undefined') return;

  const { getAuth } = await import('firebase/auth');
  const auth = getAuth();
  if (!auth.currentUser) return;

  const { db } = await import('./firebase');
  const { doc, setDoc } = await import('firebase/firestore');

  try {
    await setDoc(
      doc(db, 'users', auth.currentUser.uid),
      {
        fcmToken: token, // single device (overwrite)
        // fcmTokens: arrayUnion(token), // ← use this if you want multiple devices
        updatedAt: new Date(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error('Failed to save FCM token:', err);
  }
}