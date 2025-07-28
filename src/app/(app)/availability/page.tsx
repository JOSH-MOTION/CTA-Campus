
'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Trash } from 'lucide-react';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const timeSlots = Array.from({ length: 9 }, (_, i) => `${i + 9}:00`); // 9:00 to 17:00

const availabilitySchema = z.object({
  availableDays: z.array(z.string()).refine(value => value.some(item => item), {
    message: 'You have to select at least one day.',
  }),
  timeSlots: z.array(z.object({
    startTime: z.string().nonempty(),
    endTime: z.string().nonempty(),
  })).min(1, 'Please add at least one time slot.'),
});

type AvailabilityFormValues = z.infer<typeof availabilitySchema>;

export default function AvailabilityPage() {
  const { toast } = useToast();
  const form = useForm<AvailabilityFormValues>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: {
      availableDays: ['Monday'],
      timeSlots: [{ startTime: '09:00', endTime: '17:00' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    name: 'timeSlots',
    control: form.control,
  });

  const onSubmit = (data: AvailabilityFormValues) => {
    console.log(data);
    toast({
      title: 'Availability Saved!',
      description: 'Your booking availability has been updated successfully.',
    });
  };

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
            Students will only be able to book you during these times.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="availableDays"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">Available Days</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Select the days of the week you are available.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                      {daysOfWeek.map((day) => (
                        <FormField
                          key={day}
                          control={form.control}
                          name="availableDays"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={day}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(day)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, day])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== day
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {day}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel className="text-base">Available Time Slots</FormLabel>
                <p className="text-sm text-muted-foreground mb-4">
                  Add time ranges for your selected days.
                </p>
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex flex-wrap items-end gap-4">
                       <FormField
                          control={form.control}
                          name={`timeSlots.${index}.startTime`}
                          render={({ field }) => (
                            <FormItem className="flex-grow">
                              <FormLabel>Start Time</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Start" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                   {timeSlots.map(time => <SelectItem key={time} value={time}>{time}</SelectItem>)}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`timeSlots.${index}.endTime`}
                          render={({ field }) => (
                            <FormItem className="flex-grow">
                              <FormLabel>End Time</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="End" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {timeSlots.map(time => <SelectItem key={time} value={time}>{time}</SelectItem>)}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => remove(index)}
                        disabled={fields.length <= 1}
                        className="shrink-0"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => append({ startTime: '09:00', endTime: '10:00' })}
                  >
                    Add Time Slot
                  </Button>
                </div>
              </div>


              <Button type="submit">Save Availability</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
