// src/app/api/exercises/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Exercise from '@/models/Exercise';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const targetGen = searchParams.get('targetGen');
    const authorId = searchParams.get('authorId');
    
    let query: any = {};
    if (targetGen) query.targetGen = targetGen;
    if (authorId) query.authorId = authorId;
    
    const exercises = await Exercise.find(query)
      .sort({ createdAt: -1 })
      .lean();
    
    return NextResponse.json({ success: true, exercises });
  } catch (error: any) {
    console.error('Error fetching exercises:', error);
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
    const exercise = await Exercise.create(data);
    
    return NextResponse.json({ success: true, exercise });
  } catch (error: any) {
    console.error('Error creating exercise:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
