// src/app/api/genkit/[...flow]/route.ts
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { firebase } from '@genkit-ai/firebase';
import { NextRequest } from 'next/server';
import { nextHandler } from '@genkit-ai/next';

// IMPORTANT: This must be the first import to ensure Firebase Admin is initialized
// before any of the AI flows that depend on it are loaded.
try {
  require('@/lib/firebase-admin');
  console.log('Firebase Admin initialized successfully for API route.');
} catch (error) {
  console.error('Failed to initialize Firebase Admin for API route:', error);
}

// Import all flows that should be exposed as API endpoints
import '@/ai/flows/award-points-flow';
import '@/ai/flows/clear-all-submissions-flow';
import '@/ai/flows/faq-chatbot';
import '@/ai/flows/grade-submission-flow';
import '@/ai/flows/mark-attendance-flow';
import '@/ai/flows/resource-summarizer';
import '@/ai/flows/suggested-contact-method';

export const ai = genkit({
  plugins: [
    firebase(),
    googleAI({
      apiKey: process.env.GOOGLE_AI_API_KEY,
    }),
  ],
  model: 'googleai/gemini-2.0-flash',
  telemetry: {
    instrumentation: 'genkit',
    logger: 'genkit',
  },
});

const handler = nextHandler();

export async function POST(req: NextRequest) {
  return handler(req);
}
