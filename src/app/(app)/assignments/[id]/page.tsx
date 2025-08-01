// src/app/(app)/assignments/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAssignments } from '@/contexts/AssignmentsContext';
import { Submission, deleteSubmission, fetchSubmissions } from '@/services/submissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, ExternalLink, Loader2, CheckCircle, Trash2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { hasPointBeenAwarded } from '@/services/points';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useNotifications } from '@/contexts/NotificationsContext';
import { cn } from '@/lib/utils';
import { awardPointsFlow } from '@/ai/flows/award-points-flow';

export default function AssignmentSubmissionsPage() {
  const { id: assignmentId } = useParams();
  const router = useRouter();
  const { role } = useAuth();
  const { assignments, loading: assignmentsLoading } = useAssignments();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradingState, setGradingState] = useState<{[submissionId: string]: 'idle' | 'loading' | 'graded'}>({});
  const { toast } = useToast();
  const [submissionToDelete, setSubmissionToDelete] = useState<Submission | null>(null);
  const { addNotificationForUser } = useNotifications();

  const assignment = assignments.find(a => a.id === assignmentId);

  useEffect(() => {
    if (typeof assignmentId !== 'string') return;
    
    const getSubmissions = async () => {
        setLoading(true);
        try {
            const newSubmissions = await fetchSubmissions(assignmentId);
            setSubmissions(newSubmissions);

            const initialGradingState: {[submissionId: string]: 'idle' | 'loading' | 'graded'} = {};
            for (const s of newSubmissions) {
                const activityId = `graded-submission-${s.id}`;
                const isGraded = await hasPointBeenAwarded(s.studentId, activityId);
                initialGradingState[s.id] = isGraded ? 'graded' : 'idle';
            }
            setGradingState(initialGradingState);

        } catch (error) {
             toast({
                variant: "destructive",
                title: "Error",
                description: "Could not load submissions."
            });
        } finally {
            setLoading(false);
        }
    }
    getSubmissions();
  }, [assignmentId, toast]);

  if (role === 'student') {
    // Redirect students away, this page is for teachers/admins
    router.push('/assignments');
    return null;
  }

  const handleGrade = async (submission: Submission) => {
    setGradingState(prev => ({ ...prev, [submission.id]: 'loading' }));
    const activityId = `graded-submission-${submission.id}`;
    try {
      const result = await awardPointsFlow({
          studentId: submission.studentId,
          points: 1,
          reason: 'Class Assignments',
          activityId,
          action: 'award'
      });
      if (!result.success) throw new Error(result.message);

      setGradingState(prev => ({ ...prev, [submission.id]: 'graded' }));
      toast({
        title: 'Submission Graded',
        description: `${submission.studentName} has been awarded 1 point.`,
      });
      
      // Send notification to the student
      await addNotificationForUser(submission.studentId, {
        title: `Your assignment "${submission.assignmentTitle}" has been graded!`,
        description: 'You have been awarded 1 point.',
        href: '/assignments',
      });

    } catch (error: any) {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message === 'duplicate' ? 'This submission has already been graded.' : 'Could not award points.',
      });
       if(error.message === 'duplicate') {
        setGradingState(prev => ({ ...prev, [submission.id]: 'graded' }));
       } else {
        setGradingState(prev => ({ ...prev, [submission.id]: 'idle' }));
       }
    }
  };

  const unGrade = async (submission: Submission) => {
    setGradingState(prev => ({ ...prev, [submission.id]: 'loading' }));
    const activityId = `graded-submission-${submission.id}`;
    try {
      const result = await awardPointsFlow({
          studentId: submission.studentId,
          points: 1,
          reason: 'Class Assignments',
          activityId,
          action: 'revoke'
      });
       if (!result.success) throw new Error(result.message);

      setGradingState(prev => ({ ...prev, [submission.id]: 'idle' }));
      toast({
        title: 'Points Revoked',
        description: `Points for ${submission.studentName} have been revoked.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not revoke points.',
      });
      setGradingState(prev => ({ ...prev, [submission.id]: 'graded' }));
    }
  };


  const handleDeleteSubmission = async () => {
    if (!submissionToDelete) return;
    try {
        const activityId = `graded-submission-${submissionToDelete.id}`;
        await deleteSubmission(submissionToDelete.id);
        // Only attempt to remove point if it was graded
        if(gradingState[submissionToDelete.id] === 'graded') {
             await awardPointsFlow({
                studentId: submissionToDelete.studentId,
                points: 1,
                reason: 'Class Assignments',
                activityId,
                action: 'revoke'
            });
        }
        setSubmissions(prev => prev.filter(s => s.id !== submissionToDelete.id));
        
        toast({
            title: 'Submission Deleted',
            description: `The submission from ${submissionToDelete?.studentName} has been removed. Any points awarded have been revoked.`,
        });
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
  
  const isLoading = loading || assignmentsLoading;

  return (
    <>
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Submissions</h1>
            <p className="text-muted-foreground">
                {isLoading ? 'Loading...' : `Reviewing submissions for "${assignment?.title}"`}
            </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Received Submissions ({submissions.length})</CardTitle>
          <CardDescription>
            A list of all students who have submitted their work for this assignment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex h-64 flex-col items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
             </div>
          ) : (
            <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Generation</TableHead>
                    <TableHead>Submitted At</TableHead>
                    <TableHead>Link</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {submissions.length > 0 ? (
                        submissions.map(submission => {
                            const currentGradeState = gradingState[submission.id] || 'idle';
                            return (
                                <TableRow key={submission.id}>
                                    <TableCell className="font-medium">{submission.studentName}</TableCell>
                                    <TableCell><Badge variant="secondary">{submission.studentGen}</Badge></TableCell>
                                    <TableCell>{formatDistanceToNow(submission.submittedAt.toDate(), { addSuffix: true })}</TableCell>
                                    <TableCell>
                                        <Button variant="link" asChild className="p-0 h-auto">
                                            <Link href={submission.submissionLink} target="_blank" rel="noopener noreferrer">
                                                View Work <ExternalLink className="ml-2 h-3 w-3" />
                                            </Link>
                                        </Button>
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                         <Button 
                                            size="sm"
                                            variant={currentGradeState === 'graded' ? 'default' : 'outline'}
                                            onClick={() => currentGradeState === 'graded' ? unGrade(submission) : handleGrade(submission)}
                                            disabled={currentGradeState === 'loading'}
                                            className={cn(currentGradeState === 'graded' && 'bg-green-600 hover:bg-green-700 text-white')}
                                        >
                                            {currentGradeState === 'loading' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            {currentGradeState === 'graded' ? <XCircle className="mr-2 h-4 w-4" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                            {currentGradeState === 'graded' ? 'Revoke Point' : 'Grade (1 pt)'}
                                        </Button>
                                        <Button 
                                            variant="destructive"
                                            size="icon"
                                            onClick={() => setSubmissionToDelete(submission)}
                                        >
                                           <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )
                        })
                    ) : (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
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
