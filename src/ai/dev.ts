// src/ai/dev.ts
import { config } from 'dotenv';
config();

import { initializeAdmin } from '@/lib/firebase-admin'; // Ensures Firebase Admin is initialized first
initializeAdmin();

import '@/ai/flows/resource-summarizer.ts';
import '@/ai/flows/faq-chatbot.ts';
import '@/ai/flows/suggested-contact-method.ts';
import '@/ai/flows/award-points-flow.ts';
import '@/ai/flows/clear-all-submissions-flow.ts';
import '@/ai/flows/grade-submission-flow.ts';
