// src/app/(app)/assignments/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAssignments } from '@/contexts/AssignmentsContext';
import { onSubmissions, Submission } from '@/services/submissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, ExternalLink, Loader2, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { awardPoint } from '@/services/points';
import { useToast } from '@/hooks/use-toast';

export default function AssignmentSubmissionsPage() {
  const { id: assignmentId } = useParams();
  const router = useRouter();
  const { role } = useAuth();
  const { assignments, loading: assignmentsLoading } = useAssignments();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradingState, setGradingState] = useState<{[submissionId: string]: 'idle' | 'loading' | 'graded'}>({});
  const { toast } = useToast();

  const assignment = assignments.find(a => a.id === assignmentId);

  useEffect(() => {
    if (typeof assignmentId !== 'string') return;
    setLoading(true);
    const unsubscribe = onSubmissions(assignmentId, (newSubmissions) => {
      setSubmissions(newSubmissions);
      const initialGradingState: {[submissionId: string]: 'idle' | 'loading' | 'graded'} = {};
      newSubmissions.forEach(s => {
        // Here you might check if it's already graded in your DB
        // For now, we'll just initialize all as 'idle'
        initialGradingState[s.id] = 'idle';
      });
      setGradingState(initialGradingState);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [assignmentId]);

  if (role === 'student') {
    // Redirect students away, this page is for teachers/admins
    router.push('/assignments');
    return null;
  }

  const handleGrade = async (submission: Submission) => {
    setGradingState(prev => ({ ...prev, [submission.id]: 'loading' }));
    try {
      // Award 5 points for a graded assignment. This can be customized.
      await awardPoint(submission.studentId, 5, `Graded: ${assignment?.title}`, `graded-${submission.id}`);
      setGradingState(prev => ({ ...prev, [submission.id]: 'graded' }));
      toast({
        title: 'Submission Graded',
        description: `${submission.studentName} has been awarded 5 points.`,
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
  
  const isLoading = loading || assignmentsLoading;

  return (
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
                                    <TableCell className="text-right">
                                        <Button 
                                            variant={currentGradeState === 'graded' ? 'secondary' : 'outline'}
                                            size="sm"
                                            onClick={() => handleGrade(submission)}
                                            disabled={currentGradeState !== 'idle'}
                                        >
                                            {currentGradeState === 'loading' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            {currentGradeState === 'graded' && <CheckCircle className="mr-2 h-4 w-4 text-green-500" />}
                                            {currentGradeState === 'graded' ? 'Graded' : 'Grade (5 pts)'}
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
  );
}
