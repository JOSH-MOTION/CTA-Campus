// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';
import { Agent } from 'http';

// Check if the GOOGLE_APPLICATION_CREDENTIALS environment variable is set
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // In a deployed Firebase environment, these are set automatically.
    // In local development, you need to set them in your .env file
    // after downloading a service account key from the Firebase console.
    console.warn("GOOGLE_APPLICATION_CREDENTIALS not set. Firebase Admin SDK may not initialize correctly in local development.");
}

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      // The SDK will automatically pick up the service account credentials
      // from the environment variables (GOOGLE_APPLICATION_CREDENTIALS)
      // or from the application default credentials in a deployed environment.
      
      // Add an HTTP Agent to mitigate potential clock drift issues in serverless environments
      // which can cause token verification to fail.
      httpAgent: new Agent({ keepAlive: true }),
    });
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization error:', error.message);
  }
}

export const adminDb = admin.apps.length ? admin.firestore() : null;
export const adminAuth = admin.apps.length ? admin.auth() : null;

if (!adminDb) {
  console.error("Firestore Admin DB is not available. Ensure Firebase Admin SDK is initialized.");
}
