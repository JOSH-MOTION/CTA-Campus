// src/ai/dev.ts
import { config } from 'dotenv';
config();

// IMPORTANT: This must be the first import to ensure Firebase Admin is initialized
// before any of the AI flows that depend on it are loaded.
import '@/lib/firebase-admin';

import '@/ai/flows/resource-summarizer.ts';
import '@/ai/flows/faq-chatbot.ts';
import '@/ai/flows/suggested-contact-method.ts';
import '@/ai/flows/award-points-flow.ts';
import '@/ai/flows/clear-all-submissions-flow.ts';
import '@/ai/flows/grade-submission-flow.ts';
