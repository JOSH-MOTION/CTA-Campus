// src/app/(app)/temp-update/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Loader2, ChevronsUpDown, Check, CalendarIcon } from 'lucide-react';
import { useAuth, UserData } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { awardPointsFlow } from '@/ai/flows/award-points-flow';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';

const gradingData = [
    { title: "Class Attendance", points: 1 },
    { title: "Class Assignments", points: 1 },
    { title: "Class Exercises", points: 1 },
    { title: "Weekly Projects", points: 1 },
    { title: "Monthly Personal Projects", points: 1 },
    { title: "Soft Skills & Product Training", points: 1 },
    { title: "Mini Demo Days", points: 5 },
    { title: "100 Days of Code", points: 0.5 },
    { title: "Code Review", points: 1 },
    { title: "Final Project Completion", points: 10 },
];

const tempUpdateSchema = z.object({
  studentId: z.string().nonempty('Please select a student.'),
  activityTitle: z.string().nonempty('Please select an activity.'),
  points: z.coerce.number().min(0.1, 'Please enter a valid point value.'),
  date: z.date({ required_error: 'Please select a date for the activity.' }),
});

type TempUpdateFormValues = z.infer<typeof tempUpdateSchema>;

export default function TempUpdatePage() {
  const { toast } = useToast();
  const { fetchAllUsers } = useAuth();
  const [students, setStudents] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  useEffect(() => {
    const loadStudents = async () => {
      setLoading(true);
      const allUsers = await fetchAllUsers();
      const studentUsers = allUsers.filter(u => u.role === 'student');
      setStudents(studentUsers);
      setLoading(false);
    };
    loadStudents();
  }, [fetchAllUsers]);
  
  const form = useForm<TempUpdateFormValues>({
    resolver: zodResolver(tempUpdateSchema),
    defaultValues: {
      studentId: '',
      activityTitle: '',
      points: 1,
      date: new Date(),
    },
  });

  const selectedActivity = form.watch('activityTitle');
  useEffect(() => {
      const activity = gradingData.find(g => g.title === selectedActivity);
      if (activity) {
          form.setValue('points', activity.points);
      }
  }, [selectedActivity, form]);

  const onSubmit = async (data: TempUpdateFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await awardPointsFlow({
          studentId: data.studentId,
          points: data.points,
          reason: data.activityTitle,
          activityId: data.activityTitle, // The flow will make this unique
          action: 'award',
          date: data.date.toISOString().split('T')[0] // Pass date to flow
      });
      
      if (!result.success) {
          throw new Error(result.message);
      }
      
      const selectedStudent = students.find(s => s.uid === data.studentId);
      toast({
        title: 'Points Awarded!',
        description: `${data.points} points awarded to ${selectedStudent?.displayName} for "${data.activityTitle}".`,
      });
      form.reset({
        studentId: '',
        activityTitle: '',
        points: 1,
        date: new Date(),
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message === 'duplicate' ? 'This activity has already been recorded for this student on this date.' : 'Could not award points.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
       <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Historical Data Entry</h1>
        <p className="text-muted-foreground">Manually award points to students for past activities or special cases.</p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Award Points</CardTitle>
          <CardDescription>Select a student, activity, date, and points to award.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="studentId"
                    render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>Student</FormLabel>
                        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                        <PopoverTrigger asChild>
                            <FormControl>
                            <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                                )}
                                disabled={loading}
                            >
                                {loading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    field.value
                                    ? students.find(
                                        (student) => student.uid === field.value
                                    )?.displayName
                                    : "Select a student"
                                )}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                             <Command>
                                <CommandInput placeholder="Search student..." />
                                <CommandEmpty>No student found.</CommandEmpty>
                                <CommandList>
                                 <ScrollArea className="h-72">
                                    <CommandGroup>
                                    {students.map((student) => (
                                        <CommandItem
                                            value={student.displayName}
                                            key={student.uid}
                                            onSelect={() => {
                                                form.setValue("studentId", student.uid);
                                                setPopoverOpen(false);
                                            }}
                                        >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                student.uid === field.value
                                                ? "opacity-100"
                                                : "opacity-0"
                                            )}
                                        />
                                        {student.displayName} ({student.gen})
                                        </CommandItem>
                                    ))}
                                    </CommandGroup>
                                 </ScrollArea>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                        </Popover>
                        <FormMessage />
                    </FormItem>
                    )}
                />


              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="activityTitle"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Activity</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Select an activity" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {gradingData.map((activity) => (
                            <SelectItem key={activity.title} value={activity.title}>
                                {activity.title}
                            </SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="points"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Points to Award</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="e.g., 5" {...field} step="0.5"/>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
              </div>

               <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date of Activity</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
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
                            disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />


              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <PlusCircle className="mr-2 h-4 w-4" />}
                Award Points
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
