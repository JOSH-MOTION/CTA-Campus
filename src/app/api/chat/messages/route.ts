// src/app/api/chat/messages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ChatMessage from '@/models/ChatMessage';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');
    
    if (!chatId) {
      return NextResponse.json(
        { success: false, message: 'chatId is required' },
        { status: 400 }
      );
    }
    
    const messages = await ChatMessage.find({ chatId })
      .sort({ timestamp: 1 })
      .lean();
    
    return NextResponse.json({ success: true, messages });
  } catch (error: any) {
    console.error('Error fetching chat messages:', error);
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
    const message = await ChatMessage.create({
      ...data,
      timestamp: new Date(),
    });
    
    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

