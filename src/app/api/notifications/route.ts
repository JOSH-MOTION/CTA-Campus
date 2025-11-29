import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const read = searchParams.get('read');
    
    let query: any = {};
    if (userId) query.userId = userId;
    if (read !== null) query.read = read === 'true';
    
    const notifications = await Notification.find(query)
      .sort({ date: -1 })
      .lean();
    
    return NextResponse.json({ success: true, notifications });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
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
    const notification = await Notification.create(data);
    
    return NextResponse.json({ success: true, notification });
  } catch (error: any) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
