"use client";

import { useBookings } from '@/contexts/BookingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function BookingsPage() {
  const { bookings, loading, updateBookingStatus } = useBookings();
  const { role } = useAuth();

  const isStaff = role === 'teacher' || role === 'admin';

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Manage Bookings</h1>
        <p className="text-muted-foreground">
          {isStaff ? 'Review and manage student booking requests.' : 'View your booking requests and statuses.'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bookings</CardTitle>
          <CardDescription>All recent booking requests</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : bookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No bookings found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    {isStaff && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((b) => {
                    const date = b.dateTime?.toDate?.() ?? new Date();
                    const time = b.dateTime?.toDate?.() ?? new Date();
                    return (
                      <TableRow key={b.id}>
                        <TableCell>{format(date, 'PPP')}</TableCell>
                        <TableCell>{format(time, 'p')}</TableCell>
                        <TableCell>{b.studentName ?? b.studentId}</TableCell>
                        <TableCell>{b.staffName ?? b.staffId}</TableCell>
                        <TableCell className="capitalize">{b.meetingType}</TableCell>
                        <TableCell className="max-w-[320px] truncate" title={b.reason}>{b.reason}</TableCell>
                        <TableCell className="capitalize">
                          <span
                            className={
                              b.status === 'accepted'
                                ? 'text-green-600'
                                : b.status === 'rejected'
                                ? 'text-red-600'
                                : 'text-amber-600'
                            }
                          >
                            {b.status}
                          </span>
                        </TableCell>
                        {isStaff && (
                          <TableCell className="text-right space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={b.status !== 'pending'}
                              onClick={() => updateBookingStatus(b.id, 'accepted')}
                            >
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={b.status !== 'pending'}
                              onClick={() => updateBookingStatus(b.id, 'rejected')}
                            >
                              Reject
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
