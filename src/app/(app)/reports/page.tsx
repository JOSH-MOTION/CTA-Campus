// src/app/(app)/reports/page.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useReports } from '@/contexts/ReportsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FilePen, Rss } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const reportSchema = z.object({
  progress: z.string().min(20, { message: 'Please provide at least 20 characters for your progress this week.' }),
  challenges: z.string().min(20, { message: 'Please describe your challenges in at least 20 characters.' }),
  nextWeekPlan: z.string().min(20, { message: 'Please outline your plan for next week in at least 20 characters.' }),
});

type ReportFormValues = z.infer<typeof reportSchema>;

const ReportForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addReport } = useReports();
  const { toast } = useToast();

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      progress: '',
      challenges: '',
      nextWeekPlan: '',
    },
  });

  const onSubmit = async (data: ReportFormValues) => {
    setIsSubmitting(true);
    try {
      await addReport(data);
      toast({
        title: 'Report Submitted',
        description: 'Your weekly report has been successfully filed.',
      });
      form.reset();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Submission Error',
        description: error.message || 'There was a problem submitting your report.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Weekly Report</CardTitle>
        <CardDescription>Document your progress, challenges, and plans for the upcoming week.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="progress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>This Week's Progress</FormLabel>
                  <FormControl>
                    <Textarea rows={4} placeholder="e.g., Covered advanced CSS topics with Gen 30, reviewed student projects..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="challenges"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Challenges Encountered</FormLabel>
                  <FormControl>
                    <Textarea rows={4} placeholder="e.g., Some students are struggling with asynchronous JavaScript concepts..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nextWeekPlan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan for Next Week</FormLabel>
                  <FormControl>
                    <Textarea rows={4} placeholder="e.g., Introduce React hooks, schedule one-on-one sessions for struggling students..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Report
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};


export default function ReportsPage() {
  const { role } = useAuth();
  const { reports, loading } = useReports();
  const isStaff = role === 'teacher' || role === 'admin';
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Weekly Reports</h1>
          <p className="text-muted-foreground">A central hub for all teacher and admin weekly updates.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-semibold tracking-tight">Report Feed</h2>
             {loading ? (
                <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed">
                    <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                </div>
            ) : reports.length > 0 ? (
                 <div className="space-y-6">
                    {reports.map(report => (
                        <Card key={report.id}>
                            <CardHeader>
                                <div className="flex items-center gap-4">
                                    <Avatar>
                                        <AvatarImage src={report.authorPhotoURL} alt={report.authorName} />
                                        <AvatarFallback>{report.authorName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">{report.authorName}</p>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className="capitalize">{report.authorRole}</Badge>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(report.createdAt.toDate(), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h3 className="font-semibold text-sm">Progress This Week</h3>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{report.progress}</p>
                                </div>
                                 <div>
                                    <h3 className="font-semibold text-sm">Challenges</h3>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{report.challenges}</p>
                                </div>
                                 <div>
                                    <h3 className="font-semibold text-sm">Plan for Next Week</h3>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{report.nextWeekPlan}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed">
                    <Rss className="h-12 w-12 text-muted-foreground" />
                    <h2 className="mt-4 text-xl font-semibold">No reports yet</h2>
                    <p className="mt-1 text-muted-foreground">
                        {isStaff ? 'Submit the first report to get started.' : 'Check back later for staff reports.'}
                    </p>
                </div>
            )}
        </div>
        
        {isStaff && (
             <div className="lg:col-span-1">
                <ReportForm />
            </div>
        )}
      </div>
    </div>
  );
}
