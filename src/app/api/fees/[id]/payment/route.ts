// src/app/api/fees/[id]/payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Fee from '@/models/Fee';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const paymentData = await request.json();
    const { amount, method, reference, notes, recordedBy, recordedByName } = paymentData;
    
    if (!amount || !method || !recordedBy || !recordedByName) {
      return NextResponse.json(
        { success: false, message: 'Missing required payment fields' },
        { status: 400 }
      );
    }
    
    const fee = await Fee.findOne({ studentId: params.id });
    
    if (!fee) {
      return NextResponse.json(
        { success: false, message: 'Fee record not found' },
        { status: 404 }
      );
    }
    
    // Create payment record
    const payment = {
      id: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount,
      date: new Date(),
      method,
      reference: reference || '',
      notes: notes || '',
      recordedBy,
      recordedByName,
    };
    
    // Calculate new balances
    const newAmountPaid = fee.amountPaid + amount;
    const newBalance = fee.amountDue - newAmountPaid;
    const newStatus = newBalance <= 0 ? 'paid' : newAmountPaid > 0 ? 'partial' : 'unpaid';
    
    // Update fee record
    fee.payments.push(payment);
    fee.amountPaid = newAmountPaid;
    fee.balance = newBalance;
    fee.status = newStatus;
    fee.lastPaymentDate = new Date();
    fee.updatedAt = new Date();
    fee.updatedBy = recordedBy;
    
    await fee.save();
    
    return NextResponse.json({ 
      success: true, 
      fee,
      payment 
    });
  } catch (error: any) {
    console.error('Error recording payment:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

