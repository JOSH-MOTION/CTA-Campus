// src/app/api/soft-skills/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SoftSkills from '@/models/SoftSkills';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'module', 'event', 'attendance', 'job', 'application', 'session'
    const status = searchParams.get('status');
    const studentId = searchParams.get('studentId');
    const studentGen = searchParams.get('studentGen');
    const jobId = searchParams.get('jobId');
    const eventId = searchParams.get('eventId');
    
    let query: any = {};
    if (type) query.type = type;
    if (status) query.status = status;
    if (studentId) query.studentId = studentId;
    if (studentGen) query.studentGen = studentGen;
    if (jobId) query.jobId = jobId;
    if (eventId) query.eventId = eventId;
    
    const items = await SoftSkills.find(query)
      .sort({ createdAt: -1 })
      .lean();
    
    return NextResponse.json({ success: true, items });
  } catch (error: any) {
    console.error('Error fetching soft skills items:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const data = await request.json();
    
    // Validate required type field
    if (!data.type) {
      return NextResponse.json(
        { success: false, message: 'Type is required' },
        { status: 400 }
      );
    }
    
    // Check for duplicates based on type
    if (data.type === 'attendance' && data.eventId && data.studentId) {
      const existing = await SoftSkills.findOne({
        type: 'attendance',
        eventId: data.eventId,
        studentId: data.studentId,
      });
      if (existing) {
        return NextResponse.json(
          { success: false, message: 'Attendance already submitted for this event' },
          { status: 409 }
        );
      }
    }
    
    if (data.type === 'application' && data.jobId && data.studentId) {
      const existing = await SoftSkills.findOne({
        type: 'application',
        jobId: data.jobId,
        studentId: data.studentId,
      });
      if (existing) {
        return NextResponse.json(
          { success: false, message: 'Application already submitted for this job' },
          { status: 409 }
        );
      }
    }
    
    const item = await SoftSkills.create({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    console.error('Error creating soft skills item:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
