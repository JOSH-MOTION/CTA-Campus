// src/models/Fee.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IFee extends Document {
  studentId: string;
  studentName: string;
  gen: string;
  email: string;
  totalFees: number;
  amountDue: number;
  amountPaid: number;
  balance: number;
  status: 'paid' | 'partial' | 'unpaid' | 'overdue';
  feeStructure: {
    fullAmount: number;
    currency: string;
    paymentPlan: 'full' | 'installment';
    installments?: {
      count: number;
      amountPerInstallment: number;
    };
  };
  scholarship: {
    hasScholarship: boolean;
    type?: 'full' | 'partial';
    percentage?: number;
    description?: string;
  };
  payments: Array<{
    id: string;
    amount: number;
    date: Date;
    method: string;
    reference?: string;
    notes?: string;
    recordedBy: string;
    recordedByName: string;
  }>;
  enrollmentDate: Date;
  expectedCompletionDate?: Date;
  lastPaymentDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FeeSchema = new Schema<IFee>({
  studentId: { type: String, required: true, unique: true, index: true },
  studentName: { type: String, required: true },
  gen: { type: String, required: true, index: true },
  email: { type: String, required: true },
  totalFees: { type: Number, required: true },
  amountDue: { type: Number, required: true },
  amountPaid: { type: Number, default: 0 },
  balance: { type: Number, required: true },
  status: { type: String, enum: ['paid', 'partial', 'unpaid', 'overdue'], default: 'unpaid', index: true },
  feeStructure: {
    fullAmount: Number,
    currency: String,
    paymentPlan: { type: String, enum: ['full', 'installment'] },
    installments: {
      count: Number,
      amountPerInstallment: Number,
    },
  },
  scholarship: {
    hasScholarship: Boolean,
    type: { type: String, enum: ['full', 'partial'] },
    percentage: Number,
    description: String,
  },
  payments: [{
    id: String,
    amount: Number,
    date: Date,
    method: String,
    reference: String,
    notes: String,
    recordedBy: String,
    recordedByName: String,
  }],
  enrollmentDate: { type: Date, required: true },
  expectedCompletionDate: Date,
  lastPaymentDate: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Fee || mongoose.model<IFee>('Fee', FeeSchema);