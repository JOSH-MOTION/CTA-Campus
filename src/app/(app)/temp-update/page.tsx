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

const gradingData = [
    { 
        title: "Class Attendance", 
        points: 1, 
        description: "1 point per weekly class attendance",
        icon: CheckCircle,
    },
    { 
        title: "Class Assignments", 
        points: 1, 
        description: "1 point per assignment",
        icon: Edit,
    },
    { 
        title: "Class Exercises", 
        points: 1, 
        description: "1 point per exercise",
        icon: Edit,
    },
    { 
        title: "Weekly Projects", 
        points: 1, 
        description: "1 point per project completion",
        icon: Projector
    },
    { 
        title: "Monthly Personal Projects", 
        points: 1, 
        description: "1 point per project",
        icon: Projector
    },
    { 
        title: "Soft Skills & Product Training", 
        points: 1, 
        description: "1 point per attendance",
        icon: Handshake
    },
    { 
        title: "Mini Demo Days", 
        points: 5, 
        description: "5 points per demo",
        icon: Presentation
    },
    { 
        title: "100 Days of Code", 
        points: 0.5, 
        description: "0.5 points per day",
        icon: Code
    },
    { 
        title: "Code Review", 
        points: 1, 
        description: "1 point per contribution",
        icon: GitBranch
    },
    { 
        title: "Final Project Completion", 
        points: 10, 
        description: "Awarded upon completion",
        icon: Award
    },
];

const tempUpdateSchema = z.object({
  studentId: z.string().nonempty('Please select a student.'),
  activityIndex: z.string().nonempty('Please select an activity.'),
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
      const activity = gradingData[parseInt(data.activityIndex)];
      if (!activity) {
        throw new Error("Invalid activity selected.");
      }

      // Generate a unique ID for this manual entry to ensure idempotency
      const activityId = `manual-${activity.title.toLowerCase().replace(/\s+/g, '-')}-${uuidv4()}`;
      
      await awardPoint(data.studentId, activity.points, activity.title, activityId);
      
      const selectedStudent = students.find(s => s.uid === data.studentId);
      toast({
        title: 'Points Awarded!',
        description: `${activity.points} points awarded to ${selectedStudent?.displayName} for "${activity.title}".`,
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
          <CardDescription>Select a student and the activity for which to award points.</CardDescription>
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

              <FormField
                control={form.control}
                name="activityIndex"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Activity</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an activity to award points for" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {gradingData.map((activity, index) => (
                          <SelectItem key={activity.title} value={index.toString()}>
                            {activity.title} ({activity.points} points)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
