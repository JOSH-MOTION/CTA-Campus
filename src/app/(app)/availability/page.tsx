'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const timeSlots = Array.from({ length: 24 * 2 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = i % 2 === 0 ? '00' : '30';
    const formattedHour = hour.toString().padStart(2, '0');
    return `${formattedHour}:${minute}`;
});

// New availability structure: { [day: string]: { startTime: string; endTime: string }[] }
type DayAvailability = { startTime: string; endTime: string }[];
type WeeklyAvailability = { [day: string]: DayAvailability };

const availabilitySchema = z.object({
  availability: z.record(z.array(z.object({
    startTime: z.string().nonempty(),
    endTime: z.string().nonempty(),
  }))),
});

type AvailabilityFormValues = z.infer<typeof availabilitySchema>;

export default function AvailabilityPage() {
  const { toast } = useToast();
  const { user, userData, setUserData, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [newSlotStart, setNewSlotStart] = useState('09:00');
  const [newSlotEnd, setNewSlotEnd] = useState('17:00');

  const form = useForm<AvailabilityFormValues>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: {
      availability: daysOfWeek.reduce((acc, day) => {
        acc[day] = [];
        return acc;
      }, {} as WeeklyAvailability),
    },
  });
  
  useEffect(() => {
    if (userData) {
      // Migrate old format if exists
      if (userData.availableDays && userData.timeSlots) {
        const migratedAvailability: WeeklyAvailability = daysOfWeek.reduce((acc, day) => {
          acc[day] = userData.availableDays?.includes(day) ? (userData.timeSlots || []) : [];
          return acc;
        }, {} as WeeklyAvailability);
        form.reset({ availability: migratedAvailability });
      } else if (userData.availability) {
        // Use new format
        form.reset({ availability: userData.availability });
      }
    }
  }, [userData, form]);

  const addTimeSlot = () => {
    if (newSlotStart >= newSlotEnd) {
      toast({
        variant: 'destructive',
        title: 'Invalid time range',
        description: 'End time must be after start time.',
      });
      return;
    }

    const currentAvailability = form.getValues('availability');
    const daySlots = [...(currentAvailability[selectedDay] || [])];
    
    // Check for overlapping slots
    const hasOverlap = daySlots.some(slot => {
      return (newSlotStart < slot.endTime && newSlotEnd > slot.startTime);
    });

    if (hasOverlap) {
      toast({
        variant: 'destructive',
        title: 'Overlapping time slots',
        description: 'This time slot overlaps with an existing one.',
      });
      return;
    }

    daySlots.push({ startTime: newSlotStart, endTime: newSlotEnd });
    daySlots.sort((a, b) => a.startTime.localeCompare(b.startTime));

    form.setValue(`availability.${selectedDay}`, daySlots);
    
    toast({
      title: 'Time slot added',
      description: `Added ${newSlotStart} - ${newSlotEnd} to ${selectedDay}`,
    });
  };

  const removeTimeSlot = (day: string, index: number) => {
    const currentAvailability = form.getValues('availability');
    const daySlots = [...(currentAvailability[day] || [])];
    daySlots.splice(index, 1);
    form.setValue(`availability.${day}`, daySlots);
  };

  const onSubmit = async (data: AvailabilityFormValues) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        availability: data.availability,
        // Keep old fields for backwards compatibility temporarily
        availableDays: Object.keys(data.availability).filter(day => data.availability[day].length > 0),
        timeSlots: [], // Clear old timeSlots
      });

      if(setUserData) {
        setUserData(prev => prev ? ({ 
          ...prev, 
          availability: data.availability,
          availableDays: Object.keys(data.availability).filter(day => data.availability[day].length > 0),
          timeSlots: []
        }) : null);
      }

      toast({
        title: 'Availability Saved!',
        description: 'Your booking availability has been updated successfully.',
      });
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Error Saving',
        description: 'Could not save your availability.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const currentAvailability = form.watch('availability');

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Manage Availability</h1>
        <p className="text-muted-foreground">Set your available days and times for student bookings.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Set Your Schedule</CardTitle>
          <CardDescription>
            Students will only be able to book you during these times. You can set different time slots for each day.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              {/* Add Time Slot Section */}
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <FormLabel className="text-base">Add Time Slot</FormLabel>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                  <div>
                    <FormLabel>Day</FormLabel>
                    <Select value={selectedDay} onValueChange={setSelectedDay}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {daysOfWeek.map(day => (
                          <SelectItem key={day} value={day}>{day}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <FormLabel>Start Time</FormLabel>
                    <Select value={newSlotStart} onValueChange={setNewSlotStart}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map(time => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <FormLabel>End Time</FormLabel>
                    <Select value={newSlotEnd} onValueChange={setNewSlotEnd}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map(time => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button type="button" onClick={addTimeSlot} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Slot
                    </Button>
                  </div>
                </div>
              </div>

              {/* Current Schedule Display */}
              <div className="space-y-4">
                <FormLabel className="text-base">Current Schedule</FormLabel>
                <div className="space-y-3">
                  {daysOfWeek.map((day) => (
                    <div key={day} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <FormLabel className="font-semibold">{day}</FormLabel>
                        {(!currentAvailability[day] || currentAvailability[day].length === 0) && (
                          <span className="text-sm text-muted-foreground italic">Not available</span>
                        )}
                      </div>
                      {currentAvailability[day] && currentAvailability[day].length > 0 && (
                        <div className="space-y-2">
                          {currentAvailability[day].map((slot, index) => (
                            <div key={index} className="flex items-center justify-between bg-primary/10 p-3 rounded">
                              <span className="font-medium">
                                {slot.startTime} - {slot.endTime}
                              </span>
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                onClick={() => removeTimeSlot(day, index)}
                                className="h-8 w-8"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Availability
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}