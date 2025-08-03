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
import { PlusCircle, Loader2, ChevronsUpDown, Check } from 'lucide-react';
import { useAuth, UserData } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { awardPointsFlow } from '@/ai/flows/award-points-flow';

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
    { title: "Manual Adjustment", points: 0},
];

const tempUpdateSchema = z.object({
  studentId: z.string().nonempty('Please select a student.'),
  activityTitle: z.string().nonempty('Please select an activity.'),
  points: z.coerce.number().min(0.1, 'Please enter a valid point value.'),
  reason: z.string().optional(),
}).refine(data => {
    if (data.activityTitle === 'Manual Adjustment') {
        return data.reason && data.reason.trim().length >= 3;
    }
    return true;
}, {
    message: "Reason is required for manual adjustments (min 3 chars).",
    path: ["reason"],
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
      reason: ''
    },
  });

  const selectedActivity = form.watch('activityTitle');
  
  useEffect(() => {
      const activity = gradingData.find(g => g.title === selectedActivity);
      if (activity && activity.points > 0) {
          form.setValue('points', activity.points);
      }
  }, [selectedActivity, form]);

  const onSubmit = async (data: TempUpdateFormValues) => {
    setIsSubmitting(true);
    console.log("Form submitted. Data:", data);

    const reasonForPoints = data.activityTitle === 'Manual Adjustment' 
        ? data.reason?.trim() || 'Manual Adjustment'
        : data.activityTitle;

    try {
      console.log("Calling awardPointsFlow...");
      const result = await awardPointsFlow({
          studentId: data.studentId,
          points: data.points,
          reason: reasonForPoints,
          activityId: `manual-${reasonForPoints.replace(/\s+/g, '-').toLowerCase()}`,
          action: 'award',
      });
      
      console.log("awardPointsFlow result:", result);
      if (!result || !result.success) {
          throw new Error(result?.message || "An unknown error occurred in the flow.");
      }
      
      const selectedStudent = students.find(s => s.uid === data.studentId);
      toast({
        title: 'Points Awarded!',
        description: `${data.points} points awarded to ${selectedStudent?.displayName} for "${reasonForPoints}".`,
      });
      form.reset({
        studentId: '',
        activityTitle: '',
        points: 1,
        reason: '',
      });
    } catch (error: any) {
      console.error("Error in onSubmit:", error);
      toast({
        variant: 'destructive',
        title: 'Error Awarding Points',
        description: error.message || 'Could not award points. Please check the console.',
      });
    } finally {
      console.log("Submission process finished.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
       <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Manual Point Entry</h1>
        <p className="text-muted-foreground">Manually award points to students for historical data, corrections, or special cases.</p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Award Points</CardTitle>
          <CardDescription>Select a student, activity, and the points to award. This will be added to their current total.</CardDescription>
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
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
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

               {selectedActivity === 'Manual Adjustment' && (
                 <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Reason for Adjustment</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., Points from last year" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
               )}

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <PlusCircle className="mr-2 h-4 w-4" />
                )}
                {isSubmitting ? 'Awarding...' : 'Award Points'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
