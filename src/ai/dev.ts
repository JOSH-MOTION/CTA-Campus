// src/ai/dev.ts
import { config } from 'dotenv';
config();

// Validate required environment variables
if (!process.env.GOOGLE_AI_API_KEY) {
  console.warn('Warning: GOOGLE_AI_API_KEY not found in environment variables');
}

// IMPORTANT: This must be the first import to ensure Firebase Admin is initialized
// before any of the AI flows that depend on it are loaded.
try {
  await import('@/lib/firebase-admin');
} catch (error) {
  console.error('Failed to initialize Firebase Admin:', error);
  process.exit(1);
}

// Import AI flows
import '@/ai/flows/resource-summarizer';
import '@/ai/flows/faq-chatbot';
import '@/ai/flows/suggested-contact-method';
import '@/ai/flows/award-points-flow';
import '@/ai/flows/clear-all-submissions-flow';
import '@/ai/flows/grade-submission-flow';
import '@/ai/flows/mark-attendance-flow';
import '@genkit-ai/firebase';

console.log('All AI flows loaded successfully');
