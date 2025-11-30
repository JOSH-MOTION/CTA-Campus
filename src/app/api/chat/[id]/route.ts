// src/app/api/chat/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ChatMessage from '@/models/ChatMessage';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const updates = await request.json();
    const message = await ChatMessage.findByIdAndUpdate(
      params.id,
      { $set: { ...updates, edited: true } },
      { new: true }
    );
    
    if (!message) {
      return NextResponse.json(
        { success: false, message: 'Message not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    console.error('Error updating message:', error);
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
    
    const message = await ChatMessage.findByIdAndDelete(params.id);
    
    if (!message) {
      return NextResponse.json(
        { success: false, message: 'Message not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting message:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

