// src/app/api/roadmap/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import RoadmapStatus from '@/models/RoadmapStatus';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const weekId = searchParams.get('weekId');
    const gen = searchParams.get('gen');
    
    if (weekId) {
      // Get specific week status
      const status = await RoadmapStatus.findOne({ weekId }).lean();
      return NextResponse.json({ success: true, status });
    }
    
    // Get all roadmap status
    const allStatus = await RoadmapStatus.find().lean();
    
    // Transform to the format expected by frontend
    const statusMap: { [weekId: string]: { [gen: string]: boolean } } = {};
    allStatus.forEach((doc: any) => {
      statusMap[doc.weekId] = Object.fromEntries(doc.completions);
    });
    
    return NextResponse.json({ success: true, statusMap });
  } catch (error: any) {
    console.error('Error fetching roadmap status:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { weekId, gen, completed } = await request.json();
    
    if (!weekId || !gen || typeof completed !== 'boolean') {
      return NextResponse.json(
        { success: false, message: 'weekId, gen, and completed are required' },
        { status: 400 }
      );
    }
    
    // Update or create the week status
    const status = await RoadmapStatus.findOneAndUpdate(
      { weekId },
      {
        $set: {
          [`completions.${gen}`]: completed,
          updatedAt: new Date(),
        }
      },
      { upsert: true, new: true }
    );
    
    return NextResponse.json({ success: true, status });
  } catch (error: any) {
    console.error('Error updating roadmap status:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}