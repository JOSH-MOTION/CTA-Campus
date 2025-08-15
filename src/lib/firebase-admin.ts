// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

// Function to initialize the Firebase Admin SDK, ensuring it only runs once.
export function initializeAdmin() {
    if (admin.apps.length === 0) {
        try {
            admin.initializeApp({
                credential: admin.credential.applicationDefault(),
            });
            console.log('Firebase Admin SDK initialized successfully.');
        } catch (error) {
            console.error('Firebase Admin initialization error:', error);
            // Propagate the error to make it visible in the logs
            throw new Error(`Firebase Admin initialization failed: ${error}`);
        }
    }
}

// Export the admin services. They will be used after initialization is confirmed.
export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
