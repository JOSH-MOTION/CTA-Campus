import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { firebase } from '@genkit-ai/firebase'; // Ensure this import is correct

export const ai = genkit({
  plugins: [
    googleAI(),
    firebase(), // This should initialize the Firebase plugin
  ],
  model: 'googleai/gemini-2.0-flash',
});