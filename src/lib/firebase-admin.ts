// src/lib/firebase-admin.ts
import { initializeApp, cert, getApps, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Use non-nullable types

let adminDb!: ReturnType<typeof getFirestore>;
let adminAuth!: ReturnType<typeof getAuth>;


function initializeFirebaseAdmin() {
  if (getApps().length > 0) {
    console.log('Firebase Admin SDK already initialized');
    const app = getApps()[0];
    adminDb = getFirestore(app);
    adminAuth = getAuth(app);
    return;
  }

  try {
    let credential;

    if (process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64) {
      console.log('Using GOOGLE_APPLICATION_CREDENTIALS_BASE64 for Firebase Admin initialization');
      const serviceAccountJson = Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64, 'base64').toString('utf-8');
      try {
        const serviceAccount: ServiceAccount = JSON.parse(serviceAccountJson);
        credential = cert(serviceAccount);
      } catch (parseError: any) {
        throw new Error(`Failed to parse GOOGLE_APPLICATION_CREDENTIALS_BASE64: ${parseError.message}`);
      }
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.log('Using GOOGLE_APPLICATION_CREDENTIALS for Firebase Admin initialization');
      try {
        const serviceAccount: ServiceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
        credential = cert(serviceAccount);
      } catch (parseError: any) {
        throw new Error(`Failed to parse GOOGLE_APPLICATION_CREDENTIALS: ${parseError.message}`);
      }
    } else {
      throw new Error('No Firebase Admin credentials provided. Set GOOGLE_APPLICATION_CREDENTIALS_BASE64 or GOOGLE_APPLICATION_CREDENTIALS in .env.');
    }

    const app = initializeApp({
      credential,
      projectId: 'campus-compass-ug6bc',
    });

    adminDb = getFirestore(app);
    adminAuth = getAuth(app);

    console.log('Firebase Admin SDK initialized successfully');
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization error:', {
      error: error.message,
      stack: error.stack,
      base64Provided: !!process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64,
      jsonProvided: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });
    throw new Error('Failed to initialize Firebase Admin SDK. Ensure GOOGLE_APPLICATION_CREDENTIALS_BASE64 or GOOGLE_APPLICATION_CREDENTIALS is set correctly.');
  }
}

// Initialize Firebase Admin SDK
initializeFirebaseAdmin();

// Ensure adminDb and adminAuth are defined
if (!adminDb || !adminAuth) {
  console.error('Firebase Admin SDK failed to initialize adminDb or adminAuth');
  throw new Error('Firebase Admin SDK failed to initialize adminDb or adminAuth');
}

export { adminDb, adminAuth };