// src/ai/dev.ts
import { config } from 'dotenv';
config();

import '@/ai/flows/resource-summarizer.ts';
import '@/ai/flows/faq-chatbot.ts';
import '@/ai/flows/suggested-contact-method.ts';
import '@/ai/flows/award-points-flow.ts';
import '@/ai/flows/clear-all-submissions-flow.ts';
import '@/ai/flows/grade-submission-flow.ts';
