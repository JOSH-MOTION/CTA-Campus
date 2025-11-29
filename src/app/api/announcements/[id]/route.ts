// src/app/api/announcements/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Announcement from '@/models/Announcement';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const updates = await request.json();
    const announcement = await Announcement.findByIdAndUpdate(
      params.id,
      { $set: updates },
      { new: true }
    );
    
    if (!announcement) {
      return NextResponse.json(
        { success: false, message: 'Announcement not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, announcement });
  } catch (error: any) {
    console.error('Error updating announcement:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const announcement = await Announcement.findByIdAndDelete(params.id);
    
    if (!announcement) {
      return NextResponse.json(
        { success: false, message: 'Announcement not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting announcement:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}