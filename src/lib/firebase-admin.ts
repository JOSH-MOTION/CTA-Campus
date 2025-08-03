import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'campus-compass-ug6bc',
  });
}

const adminDB = admin.firestore();
export { admin, adminDB, FieldValue };
