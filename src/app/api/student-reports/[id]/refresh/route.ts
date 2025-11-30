// src/app/api/student-reports/[id]/refresh/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import StudentReport from '@/models/StudentReport';
import User from '@/models/User';
import { Point } from '@/models/User';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const user = await User.findOne({ uid: params.id });
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    
    const points = await Point.find({ userId: params.id });
    const academicPerformance = calculatePointsByCategory(points);
    
    const report = await StudentReport.findOneAndUpdate(
      { studentId: params.id },
      {
        $set: {
          ...academicPerformance,
          totalPoints: user.totalPoints || 0,
          lastUpdated: new Date(),
        }
      },
      { new: true, upsert: true }
    );
    
    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    console.error('Error refreshing student report:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}