// src/ai/dev.ts
import { config } from 'dotenv';
config();

// Initialize Firebase Admin SDK first
import * as admin from 'firebase-admin';
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } catch (error) {
    console.error('Firebase Admin initialization error in dev.ts:', error);
  }
}

import '@/ai/flows/resource-summarizer.ts';
import '@/ai/flows/faq-chatbot.ts';
import '@/ai/flows/suggested-contact-method.ts';
import '@/ai/flows/award-points-flow.ts';
import '@/ai/flows/clear-all-submissions-flow.ts';
import '@/ai/flows/grade-submission-flow.ts';
