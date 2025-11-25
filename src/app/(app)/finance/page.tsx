// src/app/(app)/finance/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  onFeeRecords,
  StudentFeeRecord,
  recordPayment,
  updateScholarship,
  getFeeStatistics,
  initializeStudentFees,
} from '@/services/fees';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Search,
  Plus,
  DollarSign,
  TrendingUp,
  Users,
  Award,
  Eye,
  Edit,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { InitializeFeesDialog } from '@/components/finance/InitializeFeesDialog';

export default function FinanceManagementPage() {
  const { user, userData, role, allUsers } = useAuth();
  const { toast } = useToast();
  const [feeRecords, setFeeRecords] = useState<StudentFeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGen, setSelectedGen] = useState('all');
  const [statistics, setStatistics] = useState<any>(null);

  // Dialog states
  const [recordPaymentDialog, setRecordPaymentDialog] = useState<{
    open: boolean;
    student: StudentFeeRecord | null;
  }>({ open: false, student: null });
  const [viewDetailsDialog, setViewDetailsDialog] = useState<{
    open: boolean;
    student: StudentFeeRecord | null;
  }>({ open: false, student: null });
  const [scholarshipDialog, setScholarshipDialog] = useState<{
    open: boolean;
    student: StudentFeeRecord | null;
  }>({ open: false, student: null });

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'cash' as const,
    reference: '',
    notes: '',
  });

  // Scholarship form state
  const [scholarshipForm, setScholarshipForm] = useState({
    hasScholarship: false,
    type: 'partial' as 'full' | 'partial',
    percentage: '',
    description: '',
  });

  useEffect(() => {
    if (role !== 'admin') return;

    const genFilter = selectedGen === 'all' ? undefined : selectedGen;
    const unsubscribe = onFeeRecords((records) => {
      setFeeRecords(records);
      setLoading(false);
    }, genFilter);

    return () => unsubscribe();
  }, [role, selectedGen]);

  useEffect(() => {
    if (role !== 'admin') return;

    const loadStats = async () => {
      const stats = await getFeeStatistics(selectedGen === 'all' ? undefined : selectedGen);
      setStatistics(stats);
    };

    loadStats();
  }, [role, selectedGen, feeRecords]);

  const availableGens = useMemo(() => {
    const gens = new Set(allUsers.filter(u => u.role === 'student').map(u => u.gen).filter(Boolean));
    return ['all', ...Array.from(gens).sort()];
  }, [allUsers]);

  const filteredRecords = useMemo(() => {
    return feeRecords.filter(record =>
      record.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.studentId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [feeRecords, searchTerm]);

  const handleRecordPayment = async () => {
    if (!recordPaymentDialog.student || !user || !userData) return;

    const amount = parseFloat(paymentForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Amount',
        description: 'Please enter a valid payment amount.',
      });
      return;
    }

    try {
      await recordPayment(recordPaymentDialog.student.studentId, {
        amount,
        method: paymentForm.method,
        reference: paymentForm.reference,
        notes: paymentForm.notes,
        recordedBy: user.uid,
        recordedByName: userData.displayName,
      });

      toast({
        title: 'Payment Recorded',
        description: `Payment of ${recordPaymentDialog.student.feeStructure.currency} ${amount.toFixed(2)} has been recorded.`,
      });

      setRecordPaymentDialog({ open: false, student: null });
      setPaymentForm({ amount: '', method: 'cash', reference: '', notes: '' });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to record payment.',
      });
    }
  };

  const handleUpdateScholarship = async () => {
    if (!scholarshipDialog.student || !user) return;

    try {
      await updateScholarship(
        scholarshipDialog.student.studentId,
        {
          hasScholarship: scholarshipForm.hasScholarship,
          type: scholarshipForm.type,
          percentage: scholarshipForm.hasScholarship && scholarshipForm.type === 'partial'
            ? parseFloat(scholarshipForm.percentage)
            : undefined,
          description: scholarshipForm.description,
        },
        user.uid
      );

      toast({
        title: 'Scholarship Updated',
        description: 'Scholarship information has been updated successfully.',
      });

      setScholarshipDialog({ open: false, student: null });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update scholarship.',
      });
    }
  };

  if (role !== 'admin') {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Access denied. Admin only.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const statusColors = {
    paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    partial: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    unpaid: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    overdue: 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-200',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Finance Management</h1>
          <p className="text-muted-foreground">Manage student fees and payments</p>
        </div>
        <InitializeFeesDialog onSuccess={() => {
          // Records will auto-refresh via onFeeRecords listener
        }} />
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalStudents}</div>
              <p className="text-xs text-muted-foreground">
                {statistics.paidCount} paid • {statistics.partialCount} partial • {statistics.unpaidCount} unpaid
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                GHS {statistics.totalCollected.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {statistics.collectionRate.toFixed(1)}% collection rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                GHS {statistics.totalOutstanding.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Of GHS {statistics.totalFeesExpected.toFixed(2)} expected
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scholarships</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.scholarshipCount}</div>
              <p className="text-xs text-muted-foreground">
                {statistics.fullScholarshipCount} full scholarships
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or ID..."
            className="w-full pl-9"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={selectedGen} onValueChange={setSelectedGen}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by Gen" />
          </SelectTrigger>
          <SelectContent>
            {availableGens.map(gen => (
              <SelectItem key={gen} value={gen} className="capitalize">
                {gen === 'all' ? 'All Generations' : gen}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Fee Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Student Fee Records</CardTitle>
          <CardDescription>View and manage all student fee information</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Gen</TableHead>
                <TableHead>Total Fees</TableHead>
                <TableHead>Amount Due</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Scholarship</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map(record => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      <div>
                        <p>{record.studentName}</p>
                        <p className="text-xs text-muted-foreground">{record.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{record.gen}</TableCell>
                    <TableCell>GHS {record.totalFees.toFixed(2)}</TableCell>
                    <TableCell>GHS {record.amountDue.toFixed(2)}</TableCell>
                    <TableCell className="text-green-600">GHS {record.amountPaid.toFixed(2)}</TableCell>
                    <TableCell className={record.balance > 0 ? 'text-red-600' : 'text-green-600'}>
                      GHS {record.balance.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[record.status]}>
                        {record.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {record.scholarship.hasScholarship ? (
                        <Badge variant="outline" className="border-blue-500 text-blue-700">
                          {record.scholarship.type === 'full' ? 'Full' : `${record.scholarship.percentage}%`}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setViewDetailsDialog({ open: true, student: record })}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setScholarshipDialog({ open: true, student: record });
                            setScholarshipForm({
                              hasScholarship: record.scholarship.hasScholarship,
                              type: record.scholarship.type || 'partial',
                              percentage: record.scholarship.percentage?.toString() || '',
                              description: record.scholarship.description || '',
                            });
                          }}
                        >
                          <Award className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setRecordPaymentDialog({ open: true, student: record })}
                          disabled={record.balance <= 0}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Payment
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    No fee records found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Record Payment Dialog */}
      <Dialog open={recordPaymentDialog.open} onOpenChange={(open) => {
        setRecordPaymentDialog({ open, student: open ? recordPaymentDialog.student : null });
        if (!open) setPaymentForm({ amount: '', method: 'cash', reference: '', notes: '' });
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a payment for {recordPaymentDialog.student?.studentName}
            </DialogDescription>
          </DialogHeader>
          {recordPaymentDialog.student && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4 space-y-1">
                <p className="text-sm text-muted-foreground">Balance</p>
                <p className="text-2xl font-bold">
                  {recordPaymentDialog.student.feeStructure.currency} {recordPaymentDialog.student.balance.toFixed(2)}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="method">Payment Method</Label>
                <Select
                  value={paymentForm.method}
                  onValueChange={(value: any) => setPaymentForm({ ...paymentForm, method: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference">Reference (Optional)</Label>
                <Input
                  id="reference"
                  placeholder="Transaction reference or receipt number"
                  value={paymentForm.reference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes about this payment"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecordPaymentDialog({ open: false, student: null })}>
              Cancel
            </Button>
            <Button onClick={handleRecordPayment}>
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={viewDetailsDialog.open} onOpenChange={(open) => {
        setViewDetailsDialog({ open, student: open ? viewDetailsDialog.student : null });
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Fee Details</DialogTitle>
            <DialogDescription>
              Complete fee information for {viewDetailsDialog.student?.studentName}
            </DialogDescription>
          </DialogHeader>
          {viewDetailsDialog.student && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Fees</p>
                  <p className="text-lg font-semibold">
                    GHS {viewDetailsDialog.student.totalFees.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount Due</p>
                  <p className="text-lg font-semibold">
                    GHS {viewDetailsDialog.student.amountDue.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount Paid</p>
                  <p className="text-lg font-semibold text-green-600">
                    GHS {viewDetailsDialog.student.amountPaid.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Balance</p>
                  <p className="text-lg font-semibold text-red-600">
                    GHS {viewDetailsDialog.student.balance.toFixed(2)}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Payment History</h4>
                {viewDetailsDialog.student.payments.length > 0 ? (
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {viewDetailsDialog.student.payments.map(payment => (
                      <div key={payment.id} className="border-b pb-3 last:border-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">GHS {payment.amount.toFixed(2)}</p>
                            <p className="text-sm text-muted-foreground">
                              {payment.method.replace('_', ' ')} • {formatDistanceToNow(payment.date.toDate(), { addSuffix: true })}
                            </p>
                            {payment.notes && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {payment.notes}
                              </p>
                            )}
                          </div>
                          {payment.reference && (
                            <Badge variant="outline" className="text-xs">
                              Ref: {payment.reference}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No payments recorded
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Scholarship Dialog */}
      <Dialog open={scholarshipDialog.open} onOpenChange={(open) => {
        setScholarshipDialog({ open, student: open ? scholarshipDialog.student : null });
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Scholarship</DialogTitle>
            <DialogDescription>
              Update scholarship information for {scholarshipDialog.student?.studentName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="hasScholarship"
                checked={scholarshipForm.hasScholarship}
                onChange={(e) => setScholarshipForm({ ...scholarshipForm, hasScholarship: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="hasScholarship">Student has scholarship</Label>
            </div>

            {scholarshipForm.hasScholarship && (
              <>
                <div className="space-y-2">
                  <Label>Scholarship Type</Label>
                  <Select
                    value={scholarshipForm.type}
                    onValueChange={(value: 'full' | 'partial') => setScholarshipForm({ ...scholarshipForm, type: value })}
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

                {scholarshipForm.type === 'partial' && (
                  <div className="space-y-2">
                    <Label htmlFor="percentage">Percentage</Label>
                    <Input
                      id="percentage"
                      type="number"
                      min="1"
                      max="99"
                      placeholder="50"
                      value={scholarshipForm.percentage}
                      onChange={(e) => setScholarshipForm({ ...scholarshipForm, percentage: e.target.value })}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="e.g., Academic Excellence Award, Need-based scholarship..."
                    value={scholarshipForm.description}
                    onChange={(e) => setScholarshipForm({ ...scholarshipForm, description: e.target.value })}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScholarshipDialog({ open: false, student: null })}>
              Cancel
            </Button>
            <Button onClick={handleUpdateScholarship}>
              Update Scholarship
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}