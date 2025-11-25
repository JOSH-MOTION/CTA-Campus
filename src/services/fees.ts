// src/services/fees.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface FeeStructure {
  fullAmount: number;
  currency: string;
  paymentPlan: 'full' | 'installment';
  installments?: {
    count: number;
    amountPerInstallment: number;
  };
}

export interface ScholarshipInfo {
  hasScholarship: boolean;
  type?: 'full' | 'partial';
  percentage?: number;
  description?: string;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  date: Timestamp;
  method: 'cash' | 'bank_transfer' | 'mobile_money' | 'cheque' | 'other';
  reference?: string;
  notes?: string;
  recordedBy: string;
  recordedByName: string;
}

export interface StudentFeeRecord {
  id: string;
  studentId: string;
  studentName: string;
  gen: string;
  email: string;

  feeStructure: FeeStructure;
  scholarship: ScholarshipInfo;

  totalFees: number;
  amountDue: number;
  amountPaid: number;
  balance: number;

  payments: PaymentRecord[];

  status: 'paid' | 'partial' | 'unpaid' | 'overdue';

  enrollmentDate: Timestamp;
  expectedCompletionDate?: Timestamp;
  lastPaymentDate?: Timestamp;

  createdAt: Timestamp;
  updatedAt: Timestamp;
  updatedBy?: string;
}

export type NewPaymentData = Omit<PaymentRecord, 'id' | 'date'>;

/**
 * Helper: safely build a clean ScholarshipInfo object (never contains undefined)
 */
const buildScholarshipInfo = (
  hasScholarship: boolean,
  type?: 'full' | 'partial',
  percentage?: string | number,
  description?: string
): ScholarshipInfo => {
  const info: ScholarshipInfo = { hasScholarship };

  if (!hasScholarship) return info;

  info.type = type;

  if (type === 'partial' && percentage !== undefined && percentage !== '') {
    const pct = typeof percentage === 'string' ? parseFloat(percentage) : percentage;
    if (!isNaN(pct) && pct > 0 && pct <= 100) {
      info.percentage = pct;
    }
  }

  if (description && description.trim() !== '') {
    info.description = description.trim();
  }

  return info;
};

/**
 * Initialize fee record for a student
 */
export const initializeStudentFees = async (
  studentId: string,
  studentName: string,
  gen: string,
  email: string,
  feeStructure: FeeStructure,
  rawScholarship: {
    hasScholarship: boolean;
    type?: 'full' | 'partial';
    percentage?: string | number;
    description?: string;
  } = { hasScholarship: false },
  enrollmentDate: Date = new Date()
) => {
  try {
    const scholarship = buildScholarshipInfo(
      rawScholarship.hasScholarship,
      rawScholarship.type,
      rawScholarship.percentage,
      rawScholarship.description
    );

    const totalFees = feeStructure.fullAmount;
    let amountDue = totalFees;

    if (scholarship.hasScholarship) {
      if (scholarship.type === 'full') {
        amountDue = 0;
      } else if (scholarship.type === 'partial' && scholarship.percentage) {
        amountDue = totalFees * (1 - scholarship.percentage / 100);
      }
    }

    const feeRecord: Omit<StudentFeeRecord, 'id'> = {
      studentId,
      studentName,
      gen,
      email,
      feeStructure,
      scholarship,
      totalFees,
      amountDue,
      amountPaid: 0,
      balance: amountDue,
      payments: [],
      status: amountDue === 0 ? 'paid' : 'unpaid',
      enrollmentDate: Timestamp.fromDate(enrollmentDate),
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    };

    await setDoc(doc(db, 'student_fees', studentId), feeRecord);
    return feeRecord;
  } catch (error) {
    console.error('Error initializing student fees:', error);
    throw error;
  }
};

/**
 * Update scholarship information (used by admin)
 */
export const updateScholarship = async (
  studentId: string,
  rawScholarship: {
    hasScholarship: boolean;
    type?: 'full' | 'partial';
    percentage?: string | number;
    description?: string;
  },
  updatedBy: string
) => {
  try {
    const feeDocRef = doc(db, 'student_fees', studentId);
    const feeDoc = await getDoc(feeDocRef);

    if (!feeDoc.exists()) {
      throw new Error('Student fee record not found');
    }

    const feeRecord = feeDoc.data() as StudentFeeRecord;
    const scholarship = buildScholarshipInfo(
      rawScholarship.hasScholarship,
      rawScholarship.type,
      rawScholarship.percentage,
      rawScholarship.description
    );

    let newAmountDue = feeRecord.totalFees;
    if (scholarship.hasScholarship) {
      if (scholarship.type === 'full') {
        newAmountDue = 0;
      } else if (scholarship.type === 'partial' && scholarship.percentage) {
        newAmountDue = feeRecord.totalFees * (1 - scholarship.percentage / 100);
      }
    }

    const newBalance = newAmountDue - feeRecord.amountPaid;
    const status: StudentFeeRecord['status'] =
      newBalance <= 0 ? 'paid' : feeRecord.amountPaid > 0 ? 'partial' : 'unpaid';

    await updateDoc(feeDocRef, {
      scholarship,
      amountDue: newAmountDue,
      balance: newBalance,
      status,
      updatedAt: serverTimestamp(),
      updatedBy,
    });
  } catch (error) {
    console.error('Error updating scholarship:', error);
    throw error;
  }
};

/* All other functions stay exactly the same – they already work perfectly */
export const getStudentFeeRecord = async (studentId: string): Promise<StudentFeeRecord | null> => {
  try {
    const feeDoc = await getDoc(doc(db, 'student_fees', studentId));
    if (!feeDoc.exists()) return null;
    return { id: feeDoc.id, ...feeDoc.data() } as StudentFeeRecord;
  } catch (error) {
    console.error('Error fetching student fee record:', error);
    return null;
  }
};

export const getAllFeeRecords = async (genFilter?: string): Promise<StudentFeeRecord[]> => {
  try {
    const feesCol = collection(db, 'student_fees');
    const q = genFilter
      ? query(feesCol, where('gen', '==', genFilter), orderBy('studentName', 'asc'))
      : query(feesCol, orderBy('studentName', 'asc'));

    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as StudentFeeRecord));
  } catch (error) {
    console.error('Error fetching all fee records:', error);
    return [];
  }
};

export const onFeeRecords = (
  callback: (records: StudentFeeRecord[]) => void,
  genFilter?: string
) => {
  try {
    const feesCol = collection(db, 'student_fees');
    const q = genFilter
      ? query(feesCol, where('gen', '==', genFilter), orderBy('studentName', 'asc'))
      : query(feesCol, orderBy('studentName', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as StudentFeeRecord));
      callback(records);
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up fee records listener:', error);
    return () => {};
  }
};

export const recordPayment = async (studentId: string, paymentData: NewPaymentData) => {
  try {
    const feeDocRef = doc(db, 'student_fees', studentId);
    const feeDoc = await getDoc(feeDocRef);
    if (!feeDoc.exists()) throw new Error('Student fee record not found');

    const feeRecord = feeDoc.data() as StudentFeeRecord;

    const payment: PaymentRecord = {
      id: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...paymentData,
      date: serverTimestamp() as Timestamp,
    };

    const newAmountPaid = feeRecord.amountPaid + paymentData.amount;
    const newBalance = feeRecord.amountDue - newAmountPaid;
    const status: StudentFeeRecord['status'] =
      newBalance <= 0 ? 'paid' : newAmountPaid > 0 ? 'partial' : 'unpaid';

    await updateDoc(feeDocRef, {
      payments: [...feeRecord.payments, payment],
      amountPaid: newAmountPaid,
      balance: newBalance,
      status,
      lastPaymentDate: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: paymentData.recordedBy,
    });

    // Notification
    try {
      await addDoc(collection(db, 'notifications'), {
        title: 'Payment Recorded',
        description: `A payment of ${feeRecord.feeStructure.currency} ${paymentData.amount.toFixed(
          2
        )} has been recorded. Balance: ${feeRecord.feeStructure.currency} ${newBalance.toFixed(2)}`,
        userId: studentId,
        read: false,
        date: serverTimestamp(),
        href: '/fees',
      });
    } catch (e) {
      console.error('Failed to send notification:', e);
    }
  } catch (error) {
    console.error('Error recording payment:', error);
    throw error;
  }
};

export const getFeeStatistics = async (genFilter?: string) => {
  try {
    const records = await getAllFeeRecords(genFilter);

    const totalStudents = records.length;
    const totalFeesExpected = records.reduce((sum, r) => sum + r.amountDue, 0);
    const totalCollected = records.reduce((sum, r) => sum + r.amountPaid, 0);
    const totalOutstanding = records.reduce((sum, r) => sum + r.balance, 0);

    const paidCount = records.filter((r) => r.status === 'paid').length;
    const partialCount = records.filter((r) => r.status === 'partial').length;
    const unpaidCount = records.filter((r) => r.status === 'unpaid').length;
    const overdueCount = records.filter((r) => r.status === 'overdue').length;

    const scholarshipCount = records.filter((r) => r.scholarship.hasScholarship).length;
    const fullScholarshipCount = records.filter(
      (r) => r.scholarship.hasScholarship && r.scholarship.type === 'full'
    ).length;

    return {
      totalStudents,
      totalFeesExpected,
      totalCollected,
      totalOutstanding,
      collectionRate: totalFeesExpected > 0 ? (totalCollected / totalFeesExpected) * 100 : 0,
      paidCount,
      partialCount,
      unpaidCount,
      overdueCount,
      scholarshipCount,
      fullScholarshipCount,
    };
  } catch (error) {
    console.error('Error calculating fee statistics:', error);
    throw error;
  }
};