// src/app/api/fees/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Fee from '@/models/Fee';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const gen = searchParams.get('gen');
    const status = searchParams.get('status');
    const studentId = searchParams.get('studentId');
    
    let query: any = {};
    if (gen) query.gen = gen;
    if (status) query.status = status;
    if (studentId) query.studentId = studentId;
    
    const fees = await Fee.find(query)
      .sort({ studentName: 1 })
      .lean();
    
    return NextResponse.json({ success: true, fees });
  } catch (error: any) {
    console.error('Error fetching fees:', error);
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
    
    // Check if fee record already exists
    const existing = await Fee.findOne({ studentId: data.studentId });
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Fee record already exists for this student' },
        { status: 409 }
      );
    }
    
    const fee = await Fee.create({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    return NextResponse.json({ success: true, fee });
  } catch (error: any) {
    console.error('Error creating fee record:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

