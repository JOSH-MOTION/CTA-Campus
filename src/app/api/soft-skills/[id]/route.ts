// src/app/api/soft-skills/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SoftSkills from '@/models/SoftSkills';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const item = await SoftSkills.findById(params.id).lean();
    
    if (!item) {
      return NextResponse.json(
        { success: false, message: 'Item not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    console.error('Error fetching soft skills item:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const updates = await request.json();
    
    const item = await SoftSkills.findByIdAndUpdate(
      params.id,
      { 
        $set: { 
          ...updates, 
          updatedAt: new Date() 
        } 
      },
      { new: true }
    );
    
    if (!item) {
      return NextResponse.json(
        { success: false, message: 'Item not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    console.error('Error updating soft skills item:', error);
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
    
    const item = await SoftSkills.findByIdAndDelete(params.id);
    
    if (!item) {
      return NextResponse.json(
        { success: false, message: 'Item not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting soft skills item:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}