// src/app/api/announcements/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Announcement from '@/models/Announcement';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const targetGen = searchParams.get('targetGen');
    const authorId = searchParams.get('authorId');
    
    let query: any = {};
    if (targetGen) query.targetGen = targetGen;
    if (authorId) query.authorId = authorId;
    
    const announcements = await Announcement.find(query)
      .sort({ date: -1 })
      .lean();
    
    return NextResponse.json({ success: true, announcements });
  } catch (error: any) {
    console.error('Error fetching announcements:', error);
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
    const announcement = await Announcement.create(data);
    
    return NextResponse.json({ success: true, announcement });
  } catch (error: any) {
    console.error('Error creating announcement:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
