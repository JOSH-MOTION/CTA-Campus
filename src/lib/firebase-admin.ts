import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'campus-compass-ug6bc',
  });
}

const db = admin.firestore();
export { admin, db as adminDB };
