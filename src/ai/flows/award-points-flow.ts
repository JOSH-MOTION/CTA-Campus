// src/ai/flows/award-points-flow.ts
'use server';
/**
 * @fileOverview A secure flow for awarding or revoking points for a student.
 *
 * - awardPointsFlow - A function that handles awarding or revoking points.
 * - AwardPointsFlowInput - The input type for the awardPointsFlow function.
 * - AwardPointsFlowOutput - The return type for the awardPointsFlow function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { awardPointsAdmin, revokePointsAdmin } from '@/services/admin-points';

const AwardPointsFlowInputSchema = z.object({
    studentId: z.string().describe("The UID of the student to award points to."),
    points: z.number().describe("The number of points to award. Can be negative to revoke."),
    reason: z.string().describe("A short description of why the points are being awarded."),
    activityId: z.string().describe("A unique ID for the specific activity."),
    action: z.enum(['award', 'revoke']).describe("Whether to award or revoke the points."),
});
export type AwardPointsFlowInput = z.infer<typeof AwardPointsFlowInputSchema>;

const AwardPointsFlowOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type AwardPointsFlowOutput = z.infer<typeof AwardPointsFlowOutputSchema>;

// This tool defines the secure server-side action using the Firebase Admin SDK.
const awardOrRevokePointsTool = ai.defineTool(
  {
    name: 'awardOrRevokePoints',
    description: 'A tool to securely award or revoke points for a student using admin privileges.',
    inputSchema: AwardPointsFlowInputSchema,
    outputSchema: AwardPointsFlowOutputSchema,
  },
  async (input) => {
    try {
      if (input.action === 'award') {
        return await awardPointsAdmin(input);
      } else { // action === 'revoke'
        return await revokePointsAdmin(input);
      }
    } catch (error: any) {
      console.error("Error processing points in tool:", error);
      const errorMessage = error.message || "An unexpected error occurred.";
      return { success: false, message: `Server error: Could not process points. Reason: ${errorMessage}` };
    }
  }
);

// The exported flow function remains the same. It just calls the tool.
export async function awardPointsFlow(input: AwardPointsFlowInput): Promise<AwardPointsFlowOutput> {
    return await awardOrRevokePointsTool(input);
}
