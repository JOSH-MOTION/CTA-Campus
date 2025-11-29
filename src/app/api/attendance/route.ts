// src/app/api/attendance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Attendance from '@/models/Attendance';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const studentGen = searchParams.get('studentGen');
    const classId = searchParams.get('classId');
    
    let query: any = {};
    if (studentId) query.studentId = studentId;
    if (studentGen) query.studentGen = studentGen;
    if (classId) query.classId = classId;
    
    const attendance = await Attendance.find(query)
      .sort({ submittedAt: -1 })
      .lean();
    
    return NextResponse.json({ success: true, attendance });
  } catch (error: any) {
    console.error('Error fetching attendance:', error);
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
    const attendance = await Attendance.create(data);
    
    return NextResponse.json({ success: true, attendance });
  } catch (error: any) {
    console.error('Error creating attendance:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
