// src/app/api/student-reports/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import StudentReport from '@/models/StudentReport';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const report = await StudentReport.findOne({ studentId: params.id }).lean();
    
    if (!report) {
      return NextResponse.json(
        { success: false, message: 'Report not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    console.error('Error fetching student report:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const updates = await request.json();
    
    const report = await StudentReport.findOneAndUpdate(
      { studentId: params.id },
      { 
        $set: { 
          ...updates, 
          lastUpdated: new Date() 
        } 
      },
      { new: true }
    );
    
    if (!report) {
      return NextResponse.json(
        { success: false, message: 'Report not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    console.error('Error updating student report:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}