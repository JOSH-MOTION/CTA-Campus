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
import { ArrowLeft, ExternalLink, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function AssignmentSubmissionsPage() {
  const { id: assignmentId } = useParams();
  const router = useRouter();
  const { role } = useAuth();
  const { assignments, loading: assignmentsLoading } = useAssignments();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  const assignment = assignments.find(a => a.id === assignmentId);

  useEffect(() => {
    if (typeof assignmentId !== 'string') return;
    setLoading(true);
    const unsubscribe = onSubmissions(assignmentId, (newSubmissions) => {
      setSubmissions(newSubmissions);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [assignmentId]);

  if (role === 'student') {
    // Redirect students away, this page is for teachers/admins
    router.push('/assignments');
    return null;
  }
  
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
                                <TableCell className="text-right">
                                    <Button variant="outline" size="sm">Grade</Button>
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
  );
}
