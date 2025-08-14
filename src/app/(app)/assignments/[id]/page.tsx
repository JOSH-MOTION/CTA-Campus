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
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, ExternalLink, Loader2, Trash2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useNotifications } from '@/contexts/NotificationsContext';
import { awardPointsFlow } from '@/ai/flows/award-points-flow';
import { GradeSubmissionDialog } from '@/components/submissions/GradeSubmissionDialog';

export default function AssignmentSubmissionsPage() {
  const { id: assignmentId } = useParams();
  const router = useRouter();
  const { role } = useAuth();
  const { assignments, loading: assignmentsLoading } = useAssignments();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [submissionToDelete, setSubmissionToDelete] = useState<Submission | null>(null);

  const assignment = assignments.find(a => a.id === assignmentId);
  
  const refreshSubmissions = async () => {
      if (typeof assignmentId !== 'string') return;
      setLoading(true);
      try {
          const newSubmissions = await fetchSubmissions(assignmentId);
          setSubmissions(newSubmissions);
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

  useEffect(() => {
    refreshSubmissions();
  }, [assignmentId, toast]);

  if (role === 'student') {
    // Redirect students away, this page is for teachers/admins
    router.push('/assignments');
    return null;
  }
  
  const handleDeleteSubmission = async () => {
    if (!submissionToDelete) return;
    try {
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
                        submissions.map(submission => (
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
                                     <GradeSubmissionDialog submission={submission} onGraded={refreshSubmissions}>
                                        <Button size="sm">Grade</Button>
                                     </GradeSubmissionDialog>
                                    <Button 
                                        variant="destructive"
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
