
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
import { CalendarIcon, Clock, Loader2 } from 'lucide-react';
import { format, parse } from 'date-fns';
import { useAuth, UserData } from '@/contexts/AuthContext';

const bookingSchema = z.object({
  staffId: z.string().nonempty('Please select a staff member.'),
  date: z.date({ required_error: 'Please select a date.' }),
  time: z.string().nonempty('Please select a time slot.'),
  reason: z.string().min(10, 'Please provide a brief reason (min. 10 characters).'),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

export default function BookSessionPage() {
  const { toast } = useToast();
  const { fetchAllUsers } = useAuth();
  const [staff, setStaff] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  
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
            current.setHours(current.getHours() + 1);
        }
        return slots;
    });

  }, [selectedStaff]);

  const isDayDisabled = (date: Date) => {
    if (!selectedStaff || !selectedStaff.availableDays) {
        // If no staff is selected or they have no available days set, disable all days
        return true;
    }
    const dayOfWeek = format(date, 'EEEE'); // e.g., "Monday"
    return !selectedStaff.availableDays.includes(dayOfWeek) || date < new Date();
  };

  const onSubmit = (data: BookingFormValues) => {
    console.log(data);
    const selectedStaffMember = staff.find(s => s.uid === data.staffId);
    toast({
      title: 'Booking Confirmed!',
      description: `Your session with ${selectedStaffMember?.displayName} on ${format(data.date, 'PPP')} at ${data.time} is booked.`,
    });
    form.reset();
  };

  return (
    <div className="space-y-6">
       <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Book a Session</h1>
        <p className="text-muted-foreground">Schedule a one-on-one session with a teacher or advisor.</p>
      </div>

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

              <Button type="submit">Submit Booking</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
