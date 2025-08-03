// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

// A more robust way to initialize the admin SDK in serverless environments.
// It checks for an existing app named 'default' and initializes if not found.
const app = admin.apps.find((app) => app?.name === '[DEFAULT]') || admin.initializeApp({
    projectId: 'campus-compass-ug6bc',
});


const db = admin.firestore();
export { admin, db as adminDB };
