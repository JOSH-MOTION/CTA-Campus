// src/app/api/fees/statistics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Fee from '@/models/Fee';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const gen = searchParams.get('gen');
    
    let query: any = {};
    if (gen) query.gen = gen;
    
    const fees = await Fee.find(query);
    
    const stats = {
      totalStudents: fees.length,
      totalFeesExpected: fees.reduce((sum, f) => sum + f.amountDue, 0),
      totalCollected: fees.reduce((sum, f) => sum + f.amountPaid, 0),
      totalOutstanding: fees.reduce((sum, f) => sum + f.balance, 0),
      paidCount: fees.filter(f => f.status === 'paid').length,
      partialCount: fees.filter(f => f.status === 'partial').length,
      unpaidCount: fees.filter(f => f.status === 'unpaid').length,
      overdueCount: fees.filter(f => f.status === 'overdue').length,
      scholarshipCount: fees.filter(f => f.scholarship.hasScholarship).length,
      fullScholarshipCount: fees.filter(f => 
        f.scholarship.hasScholarship && f.scholarship.type === 'full'
      ).length,
    };
    
    stats.collectionRate = stats.totalFeesExpected > 0 
      ? (stats.totalCollected / stats.totalFeesExpected) * 100 
      : 0;
    
    return NextResponse.json({ success: true, statistics: stats });
  } catch (error: any) {
    console.error('Error calculating fee statistics:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}