// src/app/(app)/submissions/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { onAllSubmissions, Submission } from '@/services/submissions';
import { formatDistanceToNow } from 'date-fns';
import { useAuth, UserData } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const { role, fetchAllUsers } = useAuth();
  const router = useRouter();
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [selectedGen, setSelectedGen] = useState('all');

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
    
    const loadUsers = async () => {
        const users = await fetchAllUsers();
        setAllUsers(users);
    }
    loadUsers();

    return () => unsubscribe();
  }, [role, router, fetchAllUsers]);
  
  const allStudents = useMemo(() => allUsers.filter(u => u.role === 'student'), [allUsers]);

  const availableGens = useMemo(() => {
    const gens = new Set(allStudents.map(student => student.gen).filter(Boolean));
    return ['all', ...Array.from(gens).sort()];
  }, [allStudents]);
  
  const filteredSubmissions = useMemo(() => {
    if (selectedGen === 'all') {
      return submissions;
    }
    return submissions.filter(s => s.studentGen === selectedGen);
  }, [submissions, selectedGen]);

  const getSubmissionParentType = (pointCategory: string): string => {
    switch(pointCategory) {
        case 'Class Assignments': return 'assignments';
        case 'Weekly Projects': return 'projects';
        case 'Class Exercises': return 'exercises';
        case '100 Days of Code': return '100-days-of-code/submissions';
        default: return '';
    }
  };
  
  if (role === 'student') return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">All Submissions</h1>
          <p className="text-muted-foreground">
            A live feed of all student submissions across all coursework.
          </p>
        </div>
        <div className="flex items-center gap-2">
            <p className="text-sm font-medium">Filter by Gen:</p>
            <Select value={selectedGen} onValueChange={setSelectedGen}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Select a Generation" />
              </SelectTrigger>
              <SelectContent>
                {availableGens.map(gen => (
                  <SelectItem key={gen} value={gen} className="capitalize">{gen}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
      </div>


       <Card>
        <CardHeader>
          <CardTitle>Recent Submissions ({filteredSubmissions.length})</CardTitle>
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
                    {filteredSubmissions.length > 0 ? (
                        filteredSubmissions.map(submission => {
                            const parentPath = getSubmissionParentType(submission.pointCategory);
                            const href = parentPath ? `/${parentPath}` : '#';
                            
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
                                No submissions yet for the selected generation.
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
