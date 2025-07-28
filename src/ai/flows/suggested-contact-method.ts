// Implemented suggested contact method Genkit flow.
'use server';
/**
 * @fileOverview An AI agent that suggests the best method to contact another person.
 *
 * - suggestContactMethod - A function that suggests the best method to contact another person.
 * - SuggestContactMethodInput - The input type for the suggestContactMethod function.
 * - SuggestContactMethodOutput - The return type for the suggestContactMethod function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestContactMethodInputSchema = z.object({
  personName: z.string().describe('The name of the person to contact.'),
  availability: z.string().describe('The availability of the person to contact.'),
  preferences: z.string().describe('The preferred contact methods of the person to contact.'),
  urgency: z.string().describe('The urgency of the message.'),
});
export type SuggestContactMethodInput = z.infer<typeof SuggestContactMethodInputSchema>;

const SuggestContactMethodOutputSchema = z.object({
  contactMethod: z.string().describe('The suggested method to contact the person.'),
  reason: z.string().describe('The reason for suggesting this contact method.'),
});
export type SuggestContactMethodOutput = z.infer<typeof SuggestContactMethodOutputSchema>;

export async function suggestContactMethod(input: SuggestContactMethodInput): Promise<SuggestContactMethodOutput> {
  return suggestContactMethodFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestContactMethodPrompt',
  input: {schema: SuggestContactMethodInputSchema},
  output: {schema: SuggestContactMethodOutputSchema},
  prompt: `You are an AI assistant helping users to contact other people efficiently.

  Given the following information about the person to contact, suggest the best method to contact them and explain why.

  Person's Name: {{{personName}}}
  Availability: {{{availability}}}
  Preferences: {{{preferences}}}
  Urgency: {{{urgency}}}

  Consider the urgency of the message, the person's availability and preferences when suggesting the best contact method.
`,
});

const suggestContactMethodFlow = ai.defineFlow(
  {
    name: 'suggestContactMethodFlow',
    inputSchema: SuggestContactMethodInputSchema,
    outputSchema: SuggestContactMethodOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
