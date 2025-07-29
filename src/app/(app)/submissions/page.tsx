// src/app/(app)/submissions/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { onAllSubmissions, Submission } from '@/services/submissions';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useAssignments } from '@/contexts/AssignmentsContext';
import { useProjects } from '@/contexts/ProjectsContext';
import { useExercises } from '@/contexts/ExercisesContext';

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const { role } = useAuth();
  const router = useRouter();
  const { assignments } = useAssignments();
  const { projects } = useProjects();
  const { exercises } = useExercises();

  useEffect(() => {
    if (role === 'student') {
      router.push('/');
      return;
    }

    setLoading(true);
    const unsubscribe = onAllSubmissions((newSubmissions) => {
      setSubmissions(newSubmissions);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [role, router]);

  const getSubmissionParentType = (assignmentId: string): 'assignments' | 'projects' | 'exercises' | null => {
    if (assignments.some(a => a.id === assignmentId)) return 'assignments';
    if (projects.some(p => p.id === assignmentId)) return 'projects';
    if (exercises.some(e => e.id === assignmentId)) return 'exercises';
    return null;
  };
  
  if (role === 'student') return null;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">All Submissions</h1>
        <p className="text-muted-foreground">
          A live feed of all student submissions across all coursework.
        </p>
      </div>

       <Card>
        <CardHeader>
          <CardTitle>Recent Submissions ({submissions.length})</CardTitle>
          <CardDescription>
            The latest work submitted by students, ordered by most recent.
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
                    <TableHead>Gen</TableHead>
                    <TableHead>Coursework</TableHead>
                    <TableHead>Submitted At</TableHead>
                    <TableHead className="text-right">Link</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {submissions.length > 0 ? (
                        submissions.map(submission => {
                            const parentType = getSubmissionParentType(submission.assignmentId);
                            const href = parentType ? `/${parentType}/${submission.assignmentId}` : '#';
                            
                            return (
                                <TableRow key={submission.id}>
                                    <TableCell className="font-medium">{submission.studentName}</TableCell>
                                    <TableCell><Badge variant="secondary">{submission.studentGen}</Badge></TableCell>
                                    <TableCell>
                                        <Button variant="link" asChild className="p-0 h-auto font-medium">
                                            <Link href={href}>
                                                {submission.assignmentTitle}
                                            </Link>
                                        </Button>
                                    </TableCell>
                                    <TableCell>{formatDistanceToNow(submission.submittedAt.toDate(), { addSuffix: true })}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={submission.submissionLink} target="_blank" rel="noopener noreferrer">
                                                View Work <ExternalLink className="ml-2 h-3 w-3" />
                                            </Link>
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
