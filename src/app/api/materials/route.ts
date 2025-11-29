// src/app/api/materials/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Material from '@/models/Material';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');
    const week = searchParams.get('week');
    
    let query: any = {};
    if (subject) query.subject = subject;
    if (week) query.week = week;
    
    const materials = await Material.find(query)
      .sort({ order: 1, createdAt: 1 })
      .lean();
    
    return NextResponse.json({ success: true, materials });
  } catch (error: any) {
    console.error('Error fetching materials:', error);
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
    const material = await Material.create(data);
    
    return NextResponse.json({ success: true, material });
  } catch (error: any) {
    console.error('Error creating material:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
