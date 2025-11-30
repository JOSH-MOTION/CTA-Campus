// src/app/api/soft-skills/[id]/approve/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SoftSkills from '@/models/SoftSkills';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const { approverId, action } = await request.json(); // action: 'approve' | 'reject'
    
    if (!approverId || !action) {
      return NextResponse.json(
        { success: false, message: 'approverId and action are required' },
        { status: 400 }
      );
    }
    
    const status = action === 'approve' ? 'approved' : 'rejected';
    
    const item = await SoftSkills.findByIdAndUpdate(
      params.id,
      {
        $set: {
          status,
          approvedAt: new Date(),
          approvedBy: approverId,
          updatedAt: new Date(),
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
    console.error('Error approving/rejecting soft skills item:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}