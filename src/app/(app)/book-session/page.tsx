'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, Clock, Loader2, ExternalLink, CheckCircle, XCircle, Calendar as CalendarClock } from 'lucide-react';
import { format, parse } from 'date-fns';
import { useAuth, UserData } from '@/contexts/AuthContext';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useBookings } from '@/contexts/BookingsContext';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const bookingSchema = z.object({
  staffId: z.string().nonempty('Please select a staff member.'),
  date: z.date({ required_error: 'Please select a date.' }),
  time: z.string().nonempty('Please select a time slot.'),
  reason: z.string().min(10, 'Please provide a brief reason (min. 10 characters).'),
  meetingType: z.enum(['online', 'in-person'], { required_error: 'Please select a meeting type.' }),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

export default function BookSessionPage() {
  const { toast } = useToast();
  const { fetchAllUsers } = useAuth();
  const [staff, setStaff] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const { addBooking, bookings } = useBookings();
  
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
  });
  
  const selectedStaffId = form.watch('staffId');
  const selectedStaff = useMemo(() => staff.find(s => s.uid === selectedStaffId), [staff, selectedStaffId]);

  useEffect(() => {
    const loadStaff = async () => {
      setLoading(true);
      const allUsers = await fetchAllUsers();
      const staffUsers = allUsers.filter(u => u.role === 'teacher' || u.role === 'admin');
      setStaff(staffUsers);
      setLoading(false);
    };
    loadStaff();
  }, [fetchAllUsers]);

  const availableTimeSlots = useMemo(() => {
    if (!selectedStaff || !selectedStaff.timeSlots) return [];
    
    return selectedStaff.timeSlots.flatMap(slot => {
        const start = parse(slot.startTime, 'HH:mm', new Date());
        const end = parse(slot.endTime, 'HH:mm', new Date());
        const slots = [];
        let current = start;
        while(current < end) {
            slots.push(format(current, 'HH:mm'));
            current.setMinutes(current.getMinutes() + 30);
        }
        return slots;
    });
  }, [selectedStaff]);

  const isDayDisabled = (date: Date) => {
    if (!selectedStaff || !selectedStaff.availableDays) {
        return true;
    }
    const dayOfWeek = format(date, 'EEEE');
    return !selectedStaff.availableDays.includes(dayOfWeek) || date < new Date();
  };

  const onSubmit = async (data: BookingFormValues) => {
    try {
      const [hours, minutes] = data.time.split(':').map(Number);
      const dateTime = new Date(data.date);
      dateTime.setHours(hours, minutes, 0, 0);

      await addBooking({
        staffId: data.staffId,
        dateTime,
        reason: data.reason,
        meetingType: data.meetingType,
      });

      const selectedStaffMember = staff.find((s) => s.uid === data.staffId);
      toast({
        title: 'Booking request sent',
        description: `Requested ${data.meetingType} session with ${selectedStaffMember?.displayName} on ${format(dateTime, 'PPp')}.`,
      });
      form.reset();
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Could not send booking',
        description: e?.message || 'Please try again.',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Accepted</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Book a Session</h1>
        <p className="text-muted-foreground">Schedule a one-on-one session with a teacher or advisor.</p>
      </div>

      <Tabs defaultValue="new-booking" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="new-booking">New Booking</TabsTrigger>
          <TabsTrigger value="history">
            My Bookings
            {bookings.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {bookings.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="new-booking">
          <Card>
            <CardHeader>
              <CardTitle>New Booking</CardTitle>
              <CardDescription>Select a staff member and a time that works for you.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="staffId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Staff Member</FormLabel>
                        <Select onValueChange={(value) => {
                            field.onChange(value);
                            form.setValue('date', undefined as any);
                            form.setValue('time', '');
                        }} defaultValue={field.value} disabled={loading}>
                          <FormControl>
                            <SelectTrigger>
                              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              <SelectValue placeholder={loading ? "Loading staff..." : "Select a staff member"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {staff.map(member => (
                              <SelectItem key={member.uid} value={member.uid}>{member.displayName}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={'outline'}
                                  disabled={!selectedStaffId}
                                  className={cn(
                                    'w-full pl-3 text-left font-normal',
                                    !field.value && 'text-muted-foreground'
                                  )}
                                >
                                  {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={isDayDisabled}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedStaffId || !form.getValues('date')}>
                            <FormControl>
                              <SelectTrigger>
                                <Clock className="mr-2 h-4 w-4" />
                                <SelectValue placeholder="Select a time" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {availableTimeSlots.length > 0 ? availableTimeSlots.map(time => (
                                <SelectItem key={time} value={time}>{format(parse(time, 'HH:mm', new Date()), 'p')}</SelectItem>
                              )) : <SelectItem value="disabled" disabled>No slots available</SelectItem>}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reason for Booking</FormLabel>
                        <FormControl>
                          <Textarea placeholder="e.g., Discuss project proposal, review assignment feedback..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="meetingType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meeting Type</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-2 gap-4"
                          >
                            <label className="flex items-center gap-2 rounded-md border p-3 cursor-pointer hover:bg-accent">
                              <RadioGroupItem value="online" />
                              <span>Online</span>
                            </label>
                            <label className="flex items-center gap-2 rounded-md border p-3 cursor-pointer hover:bg-accent">
                              <RadioGroupItem value="in-person" />
                              <span>In person</span>
                            </label>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit">Submit Booking</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>My Booking History</CardTitle>
              <CardDescription>View all your past and current booking requests</CardDescription>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
                <div className="text-center py-10">
                  <CalendarClock className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-sm text-muted-foreground">No bookings yet. Create your first booking!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Teacher</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Meeting Link</TableHead>
                        <TableHead>Note</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings.map((booking) => {
                        const dateTime = booking.dateTime?.toDate?.() ?? new Date();
                        return (
                          <TableRow key={booking.id}>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">{format(dateTime, 'PPP')}</span>
                                <span className="text-sm text-muted-foreground">{format(dateTime, 'p')}</span>
                              </div>
                            </TableCell>
                            <TableCell>{booking.staffName ?? 'Staff'}</TableCell>
                            <TableCell className="capitalize">{booking.meetingType}</TableCell>
                            <TableCell>{getStatusBadge(booking.status)}</TableCell>
                            <TableCell>
                              {booking.meetingLink && booking.status === 'accepted' ? (
                                <a 
                                  href={booking.meetingLink} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-primary hover:underline"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  Join
                                </a>
                              ) : (
                                <span className="text-muted-foreground text-sm">—</span>
                              )}
                            </TableCell>
                            <TableCell className="max-w-[200px]">
                              {booking.responseNote ? (
                                <span className="text-sm" title={booking.responseNote}>
                                  {booking.responseNote.substring(0, 30)}
                                  {booking.responseNote.length > 30 && '...'}
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-sm">—</span>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}