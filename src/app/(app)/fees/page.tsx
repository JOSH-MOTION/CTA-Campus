// src/app/(app)/fees/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getStudentFeeRecord, StudentFeeRecord } from '@/services/fees';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Wallet, TrendingUp, Calendar, Award, Receipt } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow } from 'date-fns';

export default function StudentFeesPage() {
  const { user, userData } = useAuth();
  const [feeRecord, setFeeRecord] = useState<StudentFeeRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadFeeRecord = async () => {
      try {
        const record = await getStudentFeeRecord(user.uid);
        setFeeRecord(record);
      } catch (error) {
        console.error('Error loading fee record:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFeeRecord();
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!feeRecord) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fee Payment</h1>
          <p className="text-muted-foreground">View your tuition and fee information</p>
        </div>
        <Alert>
          <AlertTitle>No Fee Record Found</AlertTitle>
          <AlertDescription>
            Your fee information has not been set up yet. Please contact the finance office.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const statusColors = {
    paid: 'bg-green-500',
    partial: 'bg-yellow-500',
    unpaid: 'bg-red-500',
    overdue: 'bg-red-700',
  };

  const statusLabels = {
    paid: 'Fully Paid',
    partial: 'Partially Paid',
    unpaid: 'Unpaid',
    overdue: 'Overdue',
  };

  const percentagePaid = feeRecord.amountDue > 0 
    ? (feeRecord.amountPaid / feeRecord.amountDue) * 100 
    : 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fee Payment</h1>
        <p className="text-muted-foreground">Your tuition and fee information</p>
      </div>

      {/* Status Banner */}
      <Alert className={feeRecord.balance <= 0 ? 'border-green-500 bg-green-50 dark:bg-green-950' : ''}>
        <Wallet className="h-4 w-4" />
        <AlertTitle>Payment Status: {statusLabels[feeRecord.status]}</AlertTitle>
        <AlertDescription>
          {feeRecord.balance <= 0 
            ? 'Your fees are fully paid. Thank you!' 
            : `Outstanding balance: ${feeRecord.feeStructure.currency} ${feeRecord.balance.toFixed(2)}`
          }
        </AlertDescription>
      </Alert>

      {/* Scholarship Info */}
      {feeRecord.scholarship.hasScholarship && (
        <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
          <Award className="h-4 w-4 text-blue-500" />
          <AlertTitle>Scholarship Award</AlertTitle>
          <AlertDescription>
            {feeRecord.scholarship.type === 'full' 
              ? 'You have a full scholarship covering 100% of tuition fees.'
              : `You have a ${feeRecord.scholarship.percentage}% scholarship. ${feeRecord.scholarship.description || ''}`
            }
          </AlertDescription>
        </Alert>
      )}

      {/* Fee Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fees</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {feeRecord.feeStructure.currency} {feeRecord.totalFees.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Full tuition amount
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amount Due</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {feeRecord.feeStructure.currency} {feeRecord.amountDue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              After scholarship
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amount Paid</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {feeRecord.feeStructure.currency} {feeRecord.amountPaid.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {percentagePaid.toFixed(0)}% paid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${feeRecord.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {feeRecord.feeStructure.currency} {feeRecord.balance.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Remaining balance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Progress</CardTitle>
          <CardDescription>Track your fee payment completion</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="relative h-4 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full transition-all ${statusColors[feeRecord.status]}`}
              style={{ width: `${Math.min(percentagePaid, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{feeRecord.feeStructure.currency} {feeRecord.amountPaid.toFixed(2)} paid</span>
            <span>{percentagePaid.toFixed(1)}%</span>
            <span>{feeRecord.feeStructure.currency} {feeRecord.balance.toFixed(2)} remaining</span>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>All recorded payments for your tuition fees</CardDescription>
        </CardHeader>
        <CardContent>
          {feeRecord.payments.length > 0 ? (
            <div className="space-y-4">
              {feeRecord.payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">
                        {feeRecord.feeStructure.currency} {payment.amount.toFixed(2)}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {payment.method.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Recorded by {payment.recordedByName}
                    </p>
                    {payment.notes && (
                      <p className="text-sm text-muted-foreground italic">
                        Note: {payment.notes}
                      </p>
                    )}
                    {payment.reference && (
                      <p className="text-xs text-muted-foreground">
                        Ref: {payment.reference}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    {formatDistanceToNow(payment.date.toDate(), { addSuffix: true })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-8">
              No payments recorded yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Payment Instructions */}
      <Alert>
        <AlertTitle>How to Make a Payment</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>To make a payment, please visit the finance office or contact them through:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Email: finance@codetrain.org</li>
            <li>Phone: +233 XX XXX XXXX</li>
            <li>In-person: Finance Office, Ground Floor</li>
          </ul>
          <p className="mt-2">All payments will be recorded and reflected here within 24 hours.</p>
        </AlertDescription>
      </Alert>
    </div>
  );
}