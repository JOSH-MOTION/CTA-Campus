// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

let app: admin.app.App;

export function initializeAdmin() {
    if (!admin.apps.length) {
        app = admin.initializeApp({
            credential: admin.credential.applicationDefault(),
        });
        console.log('Firebase Admin SDK initialized successfully.');
    } else {
        app = admin.app();
    }
}

// Initialize on module load
initializeAdmin();

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
