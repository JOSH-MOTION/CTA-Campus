
// src/app/(app)/temp-update/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Award, CheckCircle, Code, Edit, Film, GitBranch, Handshake, Loader2, PlusCircle, Presentation, Projector, Star } from 'lucide-react';
import { useAuth, UserData } from '@/contexts/AuthContext';
import { awardPoint } from '@/services/points';
import { v4 as uuidv4 } from 'uuid';
import { Input } from '@/components/ui/input';

const gradingData = [
    { title: "Class Attendance" },
    { title: "Class Assignments" },
    { title: "Class Exercises" },
    { title: "Weekly Projects" },
    { title: "Monthly Personal Projects" },
    { title: "Soft Skills & Product Training" },
    { title: "Mini Demo Days" },
    { title: "100 Days of Code" },
    { title: "Code Review" },
    { title: "Final Project Completion" },
];

const tempUpdateSchema = z.object({
  studentId: z.string().nonempty('Please select a student.'),
  activityTitle: z.string().nonempty('Please select an activity.'),
  points: z.coerce.number().min(0.1, 'Please enter a valid point value.'),
});

type TempUpdateFormValues = z.infer<typeof tempUpdateSchema>;

export default function TempUpdatePage() {
  const { toast } = useToast();
  const { fetchAllUsers } = useAuth();
  const [students, setStudents] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  });

  const onSubmit = async (data: TempUpdateFormValues) => {
    setIsSubmitting(true);
    try {
      // Generate a unique ID for this manual entry to ensure idempotency
      const activityId = `manual-${data.activityTitle.toLowerCase().replace(/\s+/g, '-')}-${uuidv4()}`;
      
      await awardPoint(data.studentId, data.points, data.activityTitle, activityId);
      
      const selectedStudent = students.find(s => s.uid === data.studentId);
      toast({
        title: 'Points Awarded!',
        description: `${data.points} points awarded to ${selectedStudent?.displayName} for "${data.activityTitle}".`,
      });
      form.reset();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message === 'duplicate' ? 'This Activity ID has already been used for this student.' : 'Could not award points.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
       <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Manual Point Entry</h1>
        <p className="text-muted-foreground">Manually award points to students for historical data or special cases.</p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Award Points</CardTitle>
          <CardDescription>Select a student, activity, and enter the points to award.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                      <FormControl>
                        <SelectTrigger>
                           {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          <SelectValue placeholder={loading ? "Loading students..." : "Select a student"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {students.map(member => (
                          <SelectItem key={member.uid} value={member.uid}>{member.displayName} ({member.gen})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
