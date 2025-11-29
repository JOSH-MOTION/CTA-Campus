// src/app/api/assignments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Assignment from '@/models/Assignment';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const targetGen = searchParams.get('targetGen');
    const authorId = searchParams.get('authorId');
    
    let query: any = {};
    if (targetGen) query.targetGen = targetGen;
    if (authorId) query.authorId = authorId;
    
    const assignments = await Assignment.find(query)
      .sort({ createdAt: -1 })
      .lean();
    
    return NextResponse.json({ success: true, assignments });
  } catch (error: any) {
    console.error('Error fetching assignments:', error);
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
    const assignment = await Assignment.create(data);
    
    return NextResponse.json({ success: true, assignment });
  } catch (error: any) {
    console.error('Error creating assignment:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}