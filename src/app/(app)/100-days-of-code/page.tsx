
// src/app/(app)/100-days-of-code/page.tsx
'use client';

import {useState, useEffect} from 'react';
import {Button} from '@/components/ui/button';
import {Calendar} from '@/components/ui/calendar';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Link, Loader2, CheckCircle, ExternalLink} from 'lucide-react';
import {useAuth} from '@/contexts/AuthContext';
import {useToast} from '@/hooks/use-toast';
import {addSubmission, onSubmissions} from '@/services/submissions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import NextLink from 'next/link';

const HUNDRED_DAYS_OF_CODE_ASSIGNMENT_ID = '100-days-of-code';

export default function OneHundredDaysOfCodePage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [link, setLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedDates, setSubmittedDates] = useState<Date[]>([]);
  const {user, userData} = useAuth();
  const {toast} = useToast();
  const [lastSubmission, setLastSubmission] = useState<{ link: string; date: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSubmissions(HUNDRED_DAYS_OF_CODE_ASSIGNMENT_ID, submissions => {
        const userSubmissions = submissions.filter(s => s.studentId === user.uid);
        const dates = userSubmissions.map(s => {
            const datePart = s.assignmentTitle.replace('100 Days of Code - ', '');
            // Adjust for potential timezone shifts by parsing as UTC
            return new Date(datePart + 'T00:00:00');
        });
        setSubmittedDates(dates);
    });
    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userData || !date) return;
    setIsSubmitting(true);
    setLastSubmission(null);
    
    try {
       const submissionDate = date.toISOString().split('T')[0];
       await addSubmission({
        studentId: user.uid,
        studentName: userData.displayName,
        studentGen: userData.gen || 'N/A',
        assignmentId: HUNDRED_DAYS_OF_CODE_ASSIGNMENT_ID,
        assignmentTitle: `100 Days of Code - ${submissionDate}`,
        submissionLink: link,
        submissionNotes: `Submission for date: ${submissionDate}`,
        pointsToAward: 0.5,
        pointCategory: '100 Days of Code',
      });

      toast({
        title: 'Progress Submitted!',
        description: 'You earned 0.5 points for your daily post.',
      });
      setLastSubmission({ link, date: submissionDate });
      setLink('');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message === 'duplicate' ? 'You have already submitted for this date.' : 'Could not submit your progress.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">100 Days of Code</h1>
        <p className="text-muted-foreground">
          Select a day on the calendar and post the link to your daily progress to earn 0.5 points.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Submit Your Progress</CardTitle>
            <CardDescription>
              Keep your streak going! Paste the URL to your LinkedIn post.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="progress-link">Progress Link</Label>
                <div className="relative mt-1">
                  <Link className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="progress-link"
                    type="url"
                    placeholder="https://www.linkedin.com/posts/..."
                    value={link}
                    onChange={e => setLink(e.target.value)}
                    required
                    className="pl-9"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={!link || isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Post Link
              </Button>
            </form>
            {lastSubmission && (
                <Alert className="mt-4" variant="default">
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Submission Successful!</AlertTitle>
                    <AlertDescription className="space-y-2">
                        <p>Your post for {lastSubmission.date} has been recorded.</p>
                        <Button variant="link" asChild className="p-0 h-auto font-normal">
                            <NextLink href={lastSubmission.link} target="_blank" rel="noopener noreferrer">
                                View Submission <ExternalLink className="ml-1 h-3 w-3" />
                            </NextLink>
                        </Button>
                    </AlertDescription>
                </Alert>
            )}
          </CardContent>
        </Card>
        <Card className="flex items-center justify-center">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border p-3"
            modifiers={{ submitted: submittedDates }}
            modifiersClassNames={{
                submitted: 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200',
            }}
            classNames={{
                caption_label: 'text-lg font-medium',
                head_cell: 'w-12 font-medium text-muted-foreground',
                cell: 'h-12 w-12 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
                day: 'h-12 w-12 p-0 font-normal aria-selected:opacity-100',
                day_selected:
                  'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
            }}
          />
        </Card>
      </div>
    </div>
  );
}
