// src/ai/dev.ts
import { config } from 'dotenv';
config();

// IMPORTANT: Initialize Firebase Admin SDK first by importing it.
// This ensures that the admin app is initialized before any other flows that might use it.
import '@/lib/firebase-admin';

import '@/ai/flows/resource-summarizer.ts';
import '@/ai/flows/faq-chatbot.ts';
import '@/ai/flows/suggested-contact-method.ts';
import '@/ai/flows/award-points-flow.ts';
import '@/ai/flows/clear-all-submissions-flow.ts';
import '@/ai/flows/grade-submission-flow.ts';
