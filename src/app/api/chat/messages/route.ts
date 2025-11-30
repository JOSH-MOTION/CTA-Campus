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

// src/app/api/chat/metadata/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

// Simple schema for chat metadata
const ChatMetadataSchema = new mongoose.Schema({
  chatId: { type: String, required: true, unique: true, index: true },
  lastMessageAt: Date,
  lastMessage: String,
  unreadCount: { type: Map, of: Number },
});

const ChatMetadata = mongoose.models.ChatMetadata || 
  mongoose.model('ChatMetadata', ChatMetadataSchema);

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    // If userId provided, filter to relevant chats
    let query: any = {};
    if (userId) {
      // This is a simplification - you might need more complex logic
      query = {
        $or: [
          { chatId: { $regex: userId } },
          { [`unreadCount.${userId}`]: { $exists: true } }
        ]
      };
    }
    
    const metadata = await ChatMetadata.find(query).lean();
    
    return NextResponse.json({ success: true, metadata });
  } catch (error: any) {
    console.error('Error fetching chat metadata:', error);
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
    const metadata = await ChatMetadata.findOneAndUpdate(
      { chatId: data.chatId },
      { $set: data },
      { upsert: true, new: true }
    );
    
    return NextResponse.json({ success: true, metadata });
  } catch (error: any) {
    console.error('Error updating chat metadata:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}