// src/app/api/submissions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Submission } from '@/models/User';
import { adminAuth } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const assignmentId = searchParams.get('assignmentId');
    const status = searchParams.get('status');

    let query: any = {};

    if (studentId) {
      query.studentId = studentId;
    }

    if (assignmentId) {
      query.assignmentId = assignmentId;
    }

    if (status === 'graded') {
      query.grade = { $ne: null };
    } else if (status === 'pending') {
      query.grade = null;
    }

    const submissions = await Submission.find(query)
      .sort({ submittedAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      submissions,
    });
  } catch (error: any) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      studentId,
      studentName,
      studentGen,
      assignmentId,
      assignmentTitle,
      submissionLink,
      submissionNotes,
      pointCategory,
      imageUrl,
    } = body;

    // Validate required fields
    if (!studentId || !studentName || !studentGen || !assignmentId || !assignmentTitle || !pointCategory) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Either link or image must be provided
    if (!submissionLink && !imageUrl) {
      return NextResponse.json(
        { success: false, message: 'Either submission link or image is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check for duplicate submission
    const is100Days = assignmentId === '100-days-of-code';
    const duplicateQuery: any = { studentId };

    if (is100Days) {
      duplicateQuery.assignmentTitle = assignmentTitle;
    } else {
      duplicateQuery.assignmentId = assignmentId;
    }

    const existingSubmission = await Submission.findOne(duplicateQuery);
    if (existingSubmission) {
      return NextResponse.json(
        { success: false, message: 'Duplicate submission detected' },
        { status: 409 }
      );
    }

    // Create submission
    const submission = await Submission.create({
      studentId,
      studentName,
      studentGen,
      assignmentId,
      assignmentTitle,
      submissionLink: submissionLink || '',
      submissionNotes: submissionNotes || '',
      pointCategory,
      imageUrl: imageUrl || '',
      submittedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      submission,
    });
  } catch (error: any) {
    console.error('Error creating submission:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create submission' },
      { status: 500 }
    );
  }
}