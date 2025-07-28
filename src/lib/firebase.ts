// src/lib/firebase.ts
import {initializeApp, getApps, getApp} from 'firebase/app';
import {getStorage} from 'firebase/storage';
import {getAuth} from 'firebase/auth';
import {getFirestore} from 'firebase/firestore';

const firebaseConfig = {
  projectId: 'campus-compass-ug6bc',
  appId: '1:627953773368:web:a87d7270648de5146b6fcd',
  storageBucket: 'campus-compass-ug6bc.appspot.com',
  apiKey: 'AIzaSyDA7BIADNBZwk-9o7A8fzVcfPy6HeZWJzU',
  authDomain: 'campus-compass-ug6bc.firebaseapp.com',
  messagingSenderId: '627953773368',
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const storage = getStorage(app);
const db = getFirestore(app);

export {app, auth, storage, db};
