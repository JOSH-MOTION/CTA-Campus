// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'campus-compass-ug6bc',
  });
}

const db = admin.firestore();
export { admin, db as adminDB };
