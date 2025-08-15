// src/app/(app)/100-days-of-code/submissions/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Submission, deleteSubmission, fetchSubmissions } from '@/services/submissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, ExternalLink, Loader2, Trash2, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { awardPointsFlow } from '@/ai/flows/award-points-flow';
import { GradeSubmissionDialog } from '@/components/submissions/GradeSubmissionDialog';

const HUNDRED_DAYS_OF_CODE_ASSIGNMENT_ID = '100-days-of-code';

export default function HundredDaysSubmissionsPage() {
  const router = useRouter();
  const { role } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [submissionToDelete, setSubmissionToDelete] = useState<Submission | null>(null);

  const getSubmissions = useCallback(async () => {
    setLoading(true);
    try {
        const newSubmissions = await fetchSubmissions(HUNDRED_DAYS_OF_CODE_ASSIGNMENT_ID);
        setSubmissions(newSubmissions);
    } catch (error) {
        console.error("Error fetching submissions:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not load submissions."
        });
    } finally {
        setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    getSubmissions();
  }, [getSubmissions]);

  if (role === 'student') {
    router.push('/100-days-of-code');
    return null;
  }
  
  const handleRevoke = async (submission: Submission) => {
    try {
        const activityId = `100-days-of-code-${submission.assignmentTitle.replace('100 Days of Code - ', '')}`;
        await awardPointsFlow({
            studentId: submission.studentId,
            points: 0, // points are retrieved from the doc, so 0 is fine here.
            reason: '100 Days of Code',
            activityId: activityId,
            action: 'revoke'
        });

        toast({
            title: 'Points Revoked',
            description: `The submission from ${submission?.studentName} has been updated and points revoked.`,
        });
        getSubmissions(); // Refresh submissions
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not revoke points for the submission.',
        });
    }
  };


  const handleDeleteSubmission = async () => {
    if (!submissionToDelete) return;
    try {
        if (submissionToDelete.grade) {
           await handleRevoke(submissionToDelete);
        }
        await deleteSubmission(submissionToDelete.id);
        
        toast({
            title: 'Submission Deleted',
            description: `The submission from ${submissionToDelete?.studentName} has been removed.`,
        });
        setSubmissions(prev => prev.filter(s => s.id !== submissionToDelete.id));
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not delete the submission.',
        });
    } finally {
        setSubmissionToDelete(null);
    }
  };

  return (
    <>
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
            <h1 className="text-3xl font-bold tracking-tight">100 Days of Code Submissions</h1>
            <p className="text-muted-foreground">
                Reviewing daily progress submissions.
            </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Received Submissions ({submissions.length})</CardTitle>
          <CardDescription>
            A list of all students who have submitted their daily progress.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
             <div className="flex h-64 flex-col items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
             </div>
          ) : (
            <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Generation</TableHead>
                    <TableHead>Submitted For</TableHead>
                    <TableHead>Submitted At</TableHead>
                    <TableHead>Link</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {submissions.length > 0 ? (
                        submissions.map(submission => (
                            <TableRow key={submission.id}>
                                <TableCell className="font-medium">{submission.studentName}</TableCell>
                                <TableCell><Badge variant="secondary">{submission.studentGen}</Badge></TableCell>
                                <TableCell>{submission.assignmentTitle.replace('100 Days of Code - ', '')}</TableCell>
                                <TableCell>{formatDistanceToNow(submission.submittedAt.toDate(), { addSuffix: true })}</TableCell>
                                <TableCell>
                                    <Button variant="link" asChild className="p-0 h-auto">
                                        <Link href={submission.submissionLink} target="_blank" rel="noopener noreferrer">
                                            View Post <ExternalLink className="ml-2 h-3 w-3" />
                                        </Link>
                                    </Button>
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    {submission.grade ? (
                                        <Button size="sm" variant="destructive" onClick={() => handleRevoke(submission)}>
                                            <XCircle className="mr-2 h-4 w-4" />
                                            Revoke
                                        </Button>
                                    ) : (
                                        <GradeSubmissionDialog submission={submission} onGraded={getSubmissions}>
                                            <Button size="sm">
                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                Grade
                                            </Button>
                                        </GradeSubmissionDialog>
                                    )}
                                    <Button 
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setSubmissionToDelete(submission)}
                                    >
                                       <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                                No submissions yet.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
    <AlertDialog open={!!submissionToDelete} onOpenChange={(open) => !open && setSubmissionToDelete(null)}>
        <AlertDialogContent>
        <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the submission from{' '}
                <span className="font-semibold">{submissionToDelete?.studentName}</span>. Any points awarded will be revoked.
            </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSubmission}>Delete</AlertDialogAction>
        </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
