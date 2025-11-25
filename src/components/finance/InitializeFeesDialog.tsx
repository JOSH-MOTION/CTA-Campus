// src/components/finance/InitializeFeesDialog.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { initializeStudentFees, FeeStructure, ScholarshipInfo } from '@/services/fees';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

interface InitializeFeesDialogProps {
  onSuccess?: () => void;
}

export function InitializeFeesDialog({ onSuccess }: InitializeFeesDialogProps) {
  const { allUsers } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [feeAmount, setFeeAmount] = useState('');
  const [paymentPlan, setPaymentPlan] = useState<'full' | 'installment'>('full');
  const [installmentCount, setInstallmentCount] = useState('');
  const [hasScholarship, setHasScholarship] = useState(false);
  const [scholarshipType, setScholarshipType] = useState<'full' | 'partial'>('partial');
  const [scholarshipPercentage, setScholarshipPercentage] = useState('');
  const [scholarshipDescription, setScholarshipDescription] = useState('');

  // Get students who might not have fee records initialized
  const students = allUsers.filter(u => u.role === 'student');

  const handleInitialize = async () => {
    if (!selectedStudent || !feeAmount) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please select a student and enter fee amount.',
      });
      return;
    }

    const student = students.find(s => s.uid === selectedStudent);
    if (!student) return;

    const amount = parseFloat(feeAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Amount',
        description: 'Please enter a valid fee amount.',
      });
      return;
    }

    setLoading(true);
    try {
      const feeStructure: FeeStructure = {
        fullAmount: amount,
        currency: 'GHS',
        paymentPlan,
        installments: paymentPlan === 'installment' && installmentCount
          ? {
              count: parseInt(installmentCount),
              amountPerInstallment: amount / parseInt(installmentCount),
            }
          : undefined,
      };

      const scholarship: ScholarshipInfo = {
        hasScholarship,
        type: hasScholarship ? scholarshipType : undefined,
        percentage: hasScholarship && scholarshipType === 'partial' 
          ? parseFloat(scholarshipPercentage) 
          : undefined,
        description: hasScholarship ? scholarshipDescription : undefined,
      };

      await initializeStudentFees(
        student.uid,
        student.displayName,
        student.gen || 'Unknown',
        student.email,
        feeStructure,
        scholarship
      );

      toast({
        title: 'Success',
        description: `Fee record initialized for ${student.displayName}`,
      });

      // Reset form
      setSelectedStudent('');
      setFeeAmount('');
      setPaymentPlan('full');
      setInstallmentCount('');
      setHasScholarship(false);
      setScholarshipType('partial');
      setScholarshipPercentage('');
      setScholarshipDescription('');
      setOpen(false);

      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to initialize fee record.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Initialize Student Fees
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Initialize Student Fee Record</DialogTitle>
          <DialogDescription>
            Set up fee structure and scholarship information for a student
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="student">Select Student</Label>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a student" />
              </SelectTrigger>
              <SelectContent>
                {students.map(student => (
                  <SelectItem key={student.uid} value={student.uid}>
                    {student.displayName} ({student.gen || 'No Gen'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feeAmount">Total Fee Amount (GHS)</Label>
            <Input
              id="feeAmount"
              type="number"
              step="0.01"
              placeholder="15000.00"
              value={feeAmount}
              onChange={e => setFeeAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Payment Plan</Label>
            <Select value={paymentPlan} onValueChange={(v: 'full' | 'installment') => setPaymentPlan(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full Payment</SelectItem>
                <SelectItem value="installment">Installment Plan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {paymentPlan === 'installment' && (
            <div className="space-y-2">
              <Label htmlFor="installments">Number of Installments</Label>
              <Input
                id="installments"
                type="number"
                min="2"
                placeholder="3"
                value={installmentCount}
                onChange={e => setInstallmentCount(e.target.value)}
              />
              {installmentCount && feeAmount && (
                <p className="text-sm text-muted-foreground">
                  GHS {(parseFloat(feeAmount) / parseInt(installmentCount)).toFixed(2)} per installment
                </p>
              )}
            </div>
          )}

          <div className="border-t pt-4 space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="hasScholarship"
                checked={hasScholarship}
                onChange={e => setHasScholarship(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="hasScholarship">Student has scholarship</Label>
            </div>

            {hasScholarship && (
              <>
                <div className="space-y-2">
                  <Label>Scholarship Type</Label>
                  <Select
                    value={scholarshipType}
                    onValueChange={(v: 'full' | 'partial') => setScholarshipType(v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full Scholarship (100%)</SelectItem>
                      <SelectItem value="partial">Partial Scholarship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {scholarshipType === 'partial' && (
                  <div className="space-y-2">
                    <Label htmlFor="scholarshipPercentage">Scholarship Percentage</Label>
                    <Input
                      id="scholarshipPercentage"
                      type="number"
                      min="1"
                      max="99"
                      placeholder="50"
                      value={scholarshipPercentage}
                      onChange={e => setScholarshipPercentage(e.target.value)}
                    />
                    {scholarshipPercentage && feeAmount && (
                      <p className="text-sm text-muted-foreground">
                        Amount Due: GHS {(parseFloat(feeAmount) * (1 - parseFloat(scholarshipPercentage) / 100)).toFixed(2)}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="scholarshipDesc">Scholarship Description</Label>
                  <Textarea
                    id="scholarshipDesc"
                    placeholder="e.g., Academic Excellence Award, Need-based scholarship..."
                    value={scholarshipDescription}
                    onChange={e => setScholarshipDescription(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleInitialize} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Initialize Fee Record
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}