// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
  console.log('Firebase Admin SDK initialized successfully.');
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
