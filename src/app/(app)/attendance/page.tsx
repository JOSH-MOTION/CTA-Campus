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
import { useMemo, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getDocs, collection, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Papa from 'papaparse';
import { markAttendanceFlow } from '@/ai/flows/mark-attendance-flow';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

const attendanceSchema = z.object({
  classId: z.string().nonempty('Please select a class.'),
  learned: z.string().min(10, 'Please share at least 10 characters about what you learned.'),
  challenged: z.string().min(10, 'Please share at least 10 characters about what you found challenging.'),
  questions: z.string().optional(),
});

type AttendanceFormValues = z.infer<typeof attendanceSchema>;

interface AttendanceRecord {
  id: string;
  studentName: string;
  studentGen: string;
  className: string;
  date: string;
  learned: string;
  challenged: string;
  questions: string;
}

export default function AttendancePage() {
  const { toast } = useToast();
  const { roadmapData } = useRoadmap();
  const { user, userData, role } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const isTeacherOrAdmin = role === 'teacher' || role === 'admin';

  const classSessions = useMemo(() => {
  return roadmapData.flatMap(subject =>
    subject.weeks.map(week => ({
      id: `${subject.title}-${week.title}`, // Create unique ID for each week
      name: `${subject.title} ${week.title}`, // e.g., "Git Week 1", "HTML Week 2"
    }))
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

  // Fetch attendance records for teachers/admins
  useEffect(() => {
    if (isTeacherOrAdmin) {
      const fetchAttendanceRecords = async () => {
        setIsLoadingRecords(true);
        try {
          const attendanceRef = collection(db, 'attendance');
          const q = query(attendanceRef, orderBy('submittedAt', 'desc'));
          const querySnapshot = await getDocs(q);
          const records = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              studentName: data.studentName,
              studentGen: data.studentGen,
              className: data.className,
              date: data.submittedAt.toDate().toLocaleDateString(),
              learned: data.learned,
              challenged: data.challenged,
              questions: data.questions || '',
            };
          });
          setAttendanceRecords(records);
        } catch (error: any) {
          console.error('Error fetching attendance records:', {
            error: error.message,
            stack: error.stack,
          });
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not fetch attendance records.',
          });
        } finally {
          setIsLoadingRecords(false);
        }
      };
      fetchAttendanceRecords();
    }
  }, [isTeacherOrAdmin, toast]);

  const handleDownloadCsv = async () => {
    setIsDownloading(true);
    try {
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
    } catch (error: any) {
      console.error('Error downloading CSV:', {
        error: error.message,
        stack: error.stack,
      });
      toast({
        variant: 'destructive',
        title: 'Download Failed',
        description: 'Could not download attendance data.',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const onSubmit = async (data: AttendanceFormValues) => {
    if (!user || !userData) {
      console.error('No user or userData available for attendance submission');
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to submit attendance. Redirecting to login.',
      });
      window.location.href = '/login';
      return;
    }

    setIsSubmitting(true);
    try {
      const idToken = await user.getIdToken(true);
      const result = await markAttendanceFlow({
        studentId: user.uid,
        studentName: userData.displayName || 'Unknown Student',
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
    } catch (error: any) {
      console.error('Error submitting attendance:', {
        error: error.message,
        stack: error.stack,
        classId: data.classId,
        studentId: user.uid,
      });
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Could not submit attendance. Please try again.',
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
          <p className="text-muted-foreground">View and download all student attendance and feedback submissions.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Attendance Records</CardTitle>
            <CardDescription>Review student attendance and feedback.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingRecords ? (
              <div className="flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : attendanceRecords.length === 0 ? (
              <p className="text-muted-foreground">No attendance records found.</p>
            ) : (
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Generation</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Learned</TableHead>
                      <TableHead>Challenged</TableHead>
                      <TableHead>Questions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceRecords.map(record => (
                      <TableRow key={record.id}>
                        <TableCell>{record.studentName}</TableCell>
                        <TableCell>{record.studentGen}</TableCell>
                        <TableCell>{record.className}</TableCell>
                        <TableCell>{record.date}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{record.learned}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{record.challenged}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{record.questions}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
            <div className="mt-4">
              <Button onClick={handleDownloadCsv} disabled={isDownloading || isLoadingRecords || attendanceRecords.length === 0}>
                {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Download Attendance CSV
              </Button>
            </div>
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
          <CardDescription>Your feedback is valuable for improving the learning experience.</CardDescription>
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