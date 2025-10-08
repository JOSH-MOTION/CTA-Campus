// src/lib/firebase-admin.ts
import { initializeApp, cert, getApps, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let adminDb: ReturnType<typeof getFirestore>;
let adminAuth: ReturnType<typeof getAuth>;

if (!getApps().length) {
  try {
    let credential;

    if (process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64) {
      // Decode the base64-encoded service account key
      const serviceAccountJson = Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64, 'base64').toString('utf-8');
      const serviceAccount: ServiceAccount = JSON.parse(serviceAccountJson);
      credential = cert(serviceAccount);
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      // Fallback to JSON string directly
      const serviceAccount: ServiceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
      credential = cert(serviceAccount);
    } else {
      throw new Error('No Firebase Admin credentials provided. Set GOOGLE_APPLICATION_CREDENTIALS_BASE64 or GOOGLE_APPLICATION_CREDENTIALS.');
    }

    const app = initializeApp({
      credential,
      projectId: 'campus-compass-ug6bc',
    });

    adminDb = getFirestore(app);
    adminAuth = getAuth(app);
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization error:', {
      error: error.message,
      stack: error.stack,
    });
    throw new Error('Failed to initialize Firebase Admin SDK. Ensure GOOGLE_APPLICATION_CREDENTIALS_BASE64 or GOOGLE_APPLICATION_CREDENTIALS is set correctly.');
  }
}

export { adminDb, adminAuth };