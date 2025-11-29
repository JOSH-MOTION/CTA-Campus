// src/app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const targetGen = searchParams.get('targetGen');
    const authorId = searchParams.get('authorId');
    
    let query: any = {};
    if (targetGen) query.targetGen = targetGen;
    if (authorId) query.authorId = authorId;
    
    const projects = await Project.find(query)
      .sort({ createdAt: -1 })
      .lean();
    
    return NextResponse.json({ success: true, projects });
  } catch (error: any) {
    console.error('Error fetching projects:', error);
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
    const project = await Project.create(data);
    
    return NextResponse.json({ success: true, project });
  } catch (error: any) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
