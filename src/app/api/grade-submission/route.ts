// src/app/api/grade-submission/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { gradeSubmissionFlow } from '@/ai/flows/grade-submission-flow';
import { adminDb } from '@/lib/firebase-admin';
import { Query, DocumentData } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      submissionId,
      studentId,
      assignmentTitle,
      grade,
      feedback,
      gradedBy,
      graderName,
      idToken,
    } = body;

    // Validate required fields
    if (!submissionId || !studentId || !assignmentTitle || !gradedBy || !graderName || !idToken) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Call the Genkit flow with all required parameters
    const result = await gradeSubmissionFlow({
      submissionId,
      studentId,
      assignmentTitle,
      grade: grade || 'Complete',
      feedback: feedback || '',
      gradedBy,
      graderName,
      idToken,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in grade submission API:', {
      error: error.message,
      stack: error.stack,
    });

    if (error.code && error.code.startsWith('auth/')) {
      return NextResponse.json(
        {
          success: false,
          message: 'Authentication failed. Please refresh the page and try again.',
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const studentId = searchParams.get('studentId');

    const submissions = await fetchSubmissions({ status, studentId });

    return NextResponse.json({ success: true, submissions });
  } catch (error: any) {
    console.error('Error fetching submissions:', {
      error: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { success: false, message: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}

async function fetchSubmissions(filters: { status?: string | null; studentId?: string | null }) {
  let query: Query<DocumentData> = adminDb.collection('submissions');

  if (filters.status) {
    if (filters.status === 'graded') {
      query = query.where('grade', '!=', null);
    } else if (filters.status === 'pending') {
      query = query.where('grade', '==', null);
    }
  }

  if (filters.studentId) {
    query = query.where('studentId', '==', filters.studentId);
  }

  query = query.orderBy('submittedAt', 'desc');

  const snapshot = await query.get();

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    submittedAt: doc.data().submittedAt?.toDate?.()?.toISOString() || doc.data().submittedAt,
  }));
}