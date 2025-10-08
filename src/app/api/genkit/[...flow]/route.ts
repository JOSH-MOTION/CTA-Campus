// src/app/api/genkit/[...flow]/route.ts
import { NextRequest, NextResponse } from 'next/server';

// IMPORTANT: This must be the first import to ensure Firebase Admin is initialized
// before any of the AI flows that depend on it are loaded.
try {
  require('@/lib/firebase-admin');
  console.log('Firebase Admin initialized successfully for API route.');
} catch (error) {
  console.error('Failed to initialize Firebase Admin for API route:', error);
}

// Use the centrally configured ai instance
import { ai } from '@/ai/genkit';

// Import all flows that should be exposed as API endpoints
import '@/ai/flows/award-points-flow';
import '@/ai/flows/clear-all-submissions-flow';
import '@/ai/flows/faq-chatbot';
import '@/ai/flows/grade-submission-flow';
import '@/ai/flows/mark-attendance-flow';
import '@/ai/flows/resource-summarizer';
import '@/ai/flows/suggested-contact-method';

export async function POST(
  req: NextRequest,
  { params }: { params: { flow: string[] } }
) {
  try {
    const flowName = params.flow.join('/');
    const body = await req.json();

    // Find the flow in the flows array
    const flow = ai.flows.find((f: any) => f.name === flowName);
    
    if (!flow) {
      return NextResponse.json(
        { error: `Flow '${flowName}' not found` },
        { status: 404 }
      );
    }

    // Execute the flow
    const result = await flow(body);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Flow execution error:', error);
    return NextResponse.json(
      { error: error.message || 'Flow execution failed' },
      { status: 500 }
    );
  }
}