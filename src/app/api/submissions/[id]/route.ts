// src/app/api/submissions/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Submission } from '@/models/User';
import { adminAuth } from '@/lib/firebase-admin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { grade, feedback, gradedBy, graderName, idToken } = body;

    // Verify ID token
    if (!idToken) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    try {
      await adminAuth.verifyIdToken(idToken);
    } catch (authError) {
      return NextResponse.json(
        { success: false, message: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    await connectDB();

    const submission = await Submission.findByIdAndUpdate(
      params.id,
      {
        $set: {
          grade: grade || 'Complete',
          feedback: feedback || '',
          gradedBy,
          gradedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!submission) {
      return NextResponse.json(
        { success: false, message: 'Submission not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      submission,
    });
  } catch (error: any) {
    console.error('Error grading submission:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to grade submission' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const idToken = searchParams.get('idToken');

    // Verify ID token
    if (!idToken) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    try {
      await adminAuth.verifyIdToken(idToken);
    } catch (authError) {
      return NextResponse.json(
        { success: false, message: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    await connectDB();

    const submission = await Submission.findByIdAndDelete(params.id);

    if (!submission) {
      return NextResponse.json(
        { success: false, message: 'Submission not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Submission deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting submission:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete submission' },
      { status: 500 }
    );
  }
}