"use client";

import { useState } from 'react';
import { useBookings } from '@/contexts/BookingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CheckCircle, XCircle, Video, MapPin } from 'lucide-react';
import { format } from 'date-fns';

export default function BookingsPage() {
  const { bookings, loading, updateBookingStatus } = useBookings();
  const { role } = useAuth();
  
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [responseType, setResponseType] = useState<'accept' | 'reject'>('accept');
  const [showDialog, setShowDialog] = useState(false);
  const [meetingLink, setMeetingLink] = useState('');
  const [responseNote, setResponseNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isStaff = role === 'teacher' || role === 'admin';

  const handleOpenDialog = (booking: any, type: 'accept' | 'reject') => {
    setSelectedBooking(booking);
    setResponseType(type);
    setMeetingLink('');
    setResponseNote('');
    setShowDialog(true);
  };

  const handleSubmitResponse = async () => {
    if (!selectedBooking) return;
    
    // Validate meeting link for online meetings when accepting
    if (responseType === 'accept' && selectedBooking.meetingType === 'online' && !meetingLink.trim()) {
      return; // Form validation will show error
    }

    setIsSubmitting(true);
    try {
      await updateBookingStatus(
        selectedBooking.id,
        responseType === 'accept' ? 'accepted' : 'rejected',
        meetingLink.trim() || undefined,
        responseNote.trim() || undefined
      );
      
      setShowDialog(false);
      setSelectedBooking(null);
    } catch (error) {
      console.error('Error updating booking:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const respondedBookings = bookings.filter(b => b.status !== 'pending');

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Manage Bookings</h1>
        <p className="text-muted-foreground">
          {isStaff ? 'Review and manage student booking requests.' : 'View your booking requests and statuses.'}
        </p>
      </div>

      {/* Pending Bookings */}
      {isStaff && pendingBookings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 text-amber-500" />
              Pending Requests ({pendingBookings.length})
            </CardTitle>
            <CardDescription>Bookings awaiting your response</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingBookings.map((booking) => {
                const dateTime = booking.dateTime?.toDate?.() ?? new Date();
                return (
                  <div key={booking.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-lg">{booking.studentName ?? 'Student'}</span>
                          {booking.meetingType === 'online' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                              <Video className="h-3 w-3" />
                              Online
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
                              <MapPin className="h-3 w-3" />
                              In-person
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(dateTime, 'EEEE, MMMM d, yyyy')} at {format(dateTime, 'h:mm a')}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Reason:</span> {booking.reason}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleOpenDialog(booking, 'accept')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleOpenDialog(booking, 'reject')}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>{isStaff ? 'All Bookings' : 'My Bookings'}</CardTitle>
          <CardDescription>
            {isStaff ? 'Complete history of booking requests' : 'Your booking history and status'}
          </CardDescription>
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
                    {isStaff && <TableHead>Student</TableHead>}
                    {!isStaff && <TableHead>Teacher</TableHead>}
                    <TableHead>Type</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Details</TableHead>
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
                        {isStaff && <TableCell>{b.studentName ?? b.studentId}</TableCell>}
                        {!isStaff && <TableCell>{b.staffName ?? b.staffId}</TableCell>}
                        <TableCell className="capitalize">
                          {b.meetingType === 'online' ? (
                            <span className="inline-flex items-center gap-1">
                              <Video className="h-3 w-3" />
                              Online
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              In-person
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[320px] truncate" title={b.reason}>{b.reason}</TableCell>
                        <TableCell>
                          <span
                            className={
                              b.status === 'accepted'
                                ? 'text-green-600 font-medium'
                                : b.status === 'rejected'
                                ? 'text-red-600 font-medium'
                                : 'text-amber-600 font-medium'
                            }
                          >
                            {b.status === 'accepted' ? 'Accepted' : b.status === 'rejected' ? 'Declined' : 'Pending'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {b.responseNote && (
                            <div className="text-sm text-muted-foreground max-w-[200px] truncate" title={b.responseNote}>
                              {b.responseNote}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Response Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {responseType === 'accept' ? 'Accept Booking' : 'Decline Booking'}
            </DialogTitle>
            <DialogDescription>
              {selectedBooking && (
                <div className="mt-2 p-3 bg-muted rounded-lg space-y-1">
                  <p className="font-medium">{selectedBooking.studentName}</p>
                  <p className="text-sm">
                    {format(selectedBooking.dateTime?.toDate?.() ?? new Date(), 'EEEE, MMMM d, yyyy')}
                  </p>
                  <p className="text-sm">
                    {format(selectedBooking.dateTime?.toDate?.() ?? new Date(), 'h:mm a')}
                  </p>
                  <p className="text-sm capitalize flex items-center gap-1">
                    {selectedBooking.meetingType === 'online' ? (
                      <><Video className="h-3 w-3" /> Online Meeting</>
                    ) : (
                      <><MapPin className="h-3 w-3" /> In-Person</>
                    )}
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {responseType === 'accept' && selectedBooking?.meetingType === 'online' && (
              <div className="space-y-2">
                <Label htmlFor="meetingLink">
                  Google Meet Link <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="meetingLink"
                  type="url"
                  placeholder="https://meet.google.com/..."
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Create a Google Meet link and paste it here
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="responseNote">
                {responseType === 'accept' ? 'Note to Student (Optional)' : 'Reason for Declining'}
              </Label>
              <Textarea
                id="responseNote"
                placeholder={
                  responseType === 'accept'
                    ? "e.g., Please prepare questions beforehand..."
                    : "e.g., I have a conflict at this time. Please book Wednesday afternoon instead."
                }
                value={responseNote}
                onChange={(e) => setResponseNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitResponse}
              disabled={
                isSubmitting ||
                (responseType === 'accept' &&
                  selectedBooking?.meetingType === 'online' &&
                  !meetingLink.trim())
              }
              className={responseType === 'accept' ? 'bg-green-600 hover:bg-green-700' : ''}
              variant={responseType === 'accept' ? 'default' : 'destructive'}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm {responseType === 'accept' ? 'Accept' : 'Decline'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}