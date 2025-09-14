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
  require('@/lib/firebase-admin');
  console.log('Firebase Admin initialized successfully');
} catch (error) {
  console.error('Failed to initialize Firebase Admin:', error);
  // Don't exit in development, just warn
  console.warn('Continuing without Firebase Admin...');
}

// Import AI flows so they are registered with the Genkit server
try {
  require('@/ai/flows/award-points-flow');
  require('@/ai/flows/clear-all-submissions-flow');
  require('@/ai/flows/faq-chatbot');
  require('@/ai/flows/grade-submission-flow');
  require('@/ai/flows/mark-attendance-flow');
  require('@/ai/flows/resource-summarizer');
  require('@/ai/flows/suggested-contact-method');
  console.log('All AI flows loaded successfully');
} catch (error) {
  console.error('Error loading AI flows:', error);
}

console.log('Genkit development server ready');
