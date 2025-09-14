// src/ai/genkit.ts
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { firebase } from '@genkit-ai/firebase';

export const ai = genkit({
  plugins: [
    googleAI(),
    firebase() // Add Firebase plugin for auth support
  ],
  model: 'googleai/gemini-2.0-flash',
});