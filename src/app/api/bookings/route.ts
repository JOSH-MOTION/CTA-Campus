// src/app/api/bookings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const staffId = searchParams.get('staffId');
    const status = searchParams.get('status');
    
    let query: any = {};
    if (studentId) query.studentId = studentId;
    if (staffId) query.staffId = staffId;
    if (status) query.status = status;
    
    const bookings = await Booking.find(query)
      .sort({ dateTime: -1 })
      .lean();
    
    return NextResponse.json({ success: true, bookings });
  } catch (error: any) {
    console.error('Error fetching bookings:', error);
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
    const booking = await Booking.create(data);
    
    return NextResponse.json({ success: true, booking });
  } catch (error: any) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
