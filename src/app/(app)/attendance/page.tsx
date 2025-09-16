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
import { CheckCircle, Download, Loader2 } from 'lucide-react';
import { useRoadmap } from '@/contexts/RoadmapContext';
import { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getDocs, collection, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Papa from 'papaparse';
import { markAttendanceFlow } from '@/ai/flows/mark-attendance-flow';

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
  const { user, userData, role } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const isTeacherOrAdmin = role === 'teacher' || role === 'admin';

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

  const handleDownloadCsv = async () => {
    setIsDownloading(true);
    try {
        const attendanceRef = collection(db, 'attendance');
        const q = query(attendanceRef, orderBy('submittedAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const attendanceRecords = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                Student: data.studentName,
                Gen: data.studentGen,
                Class: data.className,
                Date: data.submittedAt.toDate().toLocaleDateString(),
                Learned: data.learned,
                Challenged: data.challenged,
                Questions: data.questions,
            };
        });
        
        const csv = Papa.unparse(attendanceRecords);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'attendance_feedback.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    } catch (error) {
        console.error("Error downloading CSV: ", error);
        toast({
            variant: 'destructive',
            title: 'Download Failed',
            description: 'Could not download attendance data.'
        });
    } finally {
        setIsDownloading(false);
    }
  }

  const onSubmit = async (data: AttendanceFormValues) => {
    if (!user || !userData) return;
    setIsSubmitting(true);
    try {
      const idToken = await user.getIdToken(true);
      const result = await markAttendanceFlow({
        studentId: user.uid,
        studentName: userData.displayName,
        studentGen: userData.gen || 'N/A',
        classId: data.classId,
        className: classSessions.find(c => c.id === data.classId)?.name || 'Unknown Class',
        learned: data.learned,
        challenged: data.challenged,
        questions: data.questions,
        idToken,
      });

      if (!result.success) {
        throw new Error(result.message);
      }

      toast({
        title: 'Attendance Marked!',
        description: result.message,
      });
      form.reset();
    } catch(error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Could not submit attendance.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isTeacherOrAdmin) {
      return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">Attendance Records</h1>
                <p className="text-muted-foreground">Download all student attendance and feedback submissions.</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Export Data</CardTitle>
                    <CardDescription>Download a CSV file containing all attendance records.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleDownloadCsv} disabled={isDownloading}>
                        {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Download Attendance CSV
                    </Button>
                </CardContent>
            </Card>
        </div>
      );
  }

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
