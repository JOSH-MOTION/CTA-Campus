// src/ai/flows/faq-chatbot.ts
'use server';
/**
 * @fileOverview A chatbot that answers FAQs related to campus facilities, policies, and procedures.
 *
 * - faqChatbot - A function that handles the chatbot process.
 * - FaqChatbotInput - The input type for the faqChatbot function.
 * - FaqChatbotOutput - The return type for the faqChatbot function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FaqChatbotInputSchema = z.object({
  query: z.string().describe('The user query about campus facilities, policies, and procedures.'),
});
export type FaqChatbotInput = z.infer<typeof FaqChatbotInputSchema>;

const FaqChatbotOutputSchema = z.object({
  answer: z.string().describe('The answer to the user query.'),
});
export type FaqChatbotOutput = z.infer<typeof FaqChatbotOutputSchema>;

export async function faqChatbot(input: FaqChatbotInput): Promise<FaqChatbotOutput> {
  return faqChatbotFlow(input);
}

const prompt = ai.definePrompt({
  name: 'faqChatbotPrompt',
  input: {schema: FaqChatbotInputSchema},
  output: {schema: FaqChatbotOutputSchema},
  prompt: `You are a helpful AI assistant that answers questions about campus facilities, policies, and procedures.

  User query: {{{query}}}

  Answer:`,
});

const faqChatbotFlow = ai.defineFlow(
  {
    name: 'faqChatbotFlow',
    inputSchema: FaqChatbotInputSchema,
    outputSchema: FaqChatbotOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
