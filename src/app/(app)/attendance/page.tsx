// src/app/(app)/attendance/page.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useRoadmap } from '@/contexts/RoadmapContext';
import { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { awardPoint } from '@/services/points';

const attendanceSchema = z.object({
  classId: z.string().nonempty('Please select a class.'),
  learned: z.string().min(10, 'Please share at least 10 characters about what you learned.'),
  challenged: z.string().min(10, 'Please share at least 10 characters about what you found challenging.'),
  questions: z.string().optional(),
});

type AttendanceFormValues = z.infer<typeof attendanceSchema>;

export default function AttendancePage() {
  const { toast } = useToast();
  const { roadmapData } = useRoadmap();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const classSessions = useMemo(() => {
    return roadmapData.flatMap(subject =>
      subject.weeks.flatMap(week =>
        week.topics.map(topic => ({
          id: topic.id,
          name: `${subject.title} - ${topic.title}`,
        }))
      )
    );
  }, [roadmapData]);
  
  const form = useForm<AttendanceFormValues>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      learned: '',
      challenged: '',
      questions: '',
    },
  });

  const onSubmit = async (data: AttendanceFormValues) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const attendanceDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      await awardPoint(user.uid, 1, 'Class Attendance', `attendance-${data.classId}-${attendanceDate}`);
      toast({
        title: 'Attendance Marked!',
        description: 'You have been awarded 1 point for submitting your feedback.',
      });
      form.reset();
    } catch(error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message === 'duplicate' ? 'You have already marked attendance for this session today.' : 'Could not submit attendance.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Daily Attendance & Feedback</h1>
        <p className="text-muted-foreground">Submit this form to mark your attendance and get 1 point.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Session Feedback</CardTitle>
          <CardDescription>
            Your feedback is valuable for improving the learning experience.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="classId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class/Session</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select the session you attended" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {classSessions.map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
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
                name="learned"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What is one key thing you learned today?</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., I learned how to implement the flexbox model in CSS..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="challenged"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What did you find most challenging?</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Understanding the difference between position relative and absolute was tricky..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
               <FormField
                control={form.control}
                name="questions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Do you have any questions for the instructor? (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Could we go over an example of..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <CheckCircle className="mr-2 h-4 w-4" />
                Submit Attendance
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
