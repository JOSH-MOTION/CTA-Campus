// src/app/(app)/submissions/page.tsx
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserData } from '@/contexts/AuthContext';
import { getAllSubmissions, Submission } from '@/services/submissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ExternalLink, Loader2, Search, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { clearAllSubmissionsFlow } from '@/ai/flows/clear-all-submissions-flow';

export default function AllSubmissionsPage() {
  const router = useRouter();
  const { role, fetchAllUsers } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [allStudents, setAllStudents] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGen, setSelectedGen] = useState('all');
  const [isClearing, setIsClearing] = useState(false);
  
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [fetchedSubmissions, fetchedUsers] = await Promise.all([
        getAllSubmissions(),
        fetchAllUsers()
      ]);
      setSubmissions(fetchedSubmissions);
      setAllStudents(fetchedUsers.filter(u => u.role === 'student'));
    } catch (error) {
      console.error("Failed to fetch submissions:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not load submissions. You may not have the required permissions.',
      });
    } finally {
      setLoading(false);
    }
  }, [toast, fetchAllUsers]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const availableGens = useMemo(() => {
    const gens = new Set(allStudents.map(student => student.gen).filter(Boolean));
    return ['all', ...Array.from(gens).sort()];
  }, [allStudents]);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter(submission => {
        const student = allStudents.find(s => s.uid === submission.studentId);
        const studentName = student?.displayName || submission.studentName || '';
        const studentGen = student?.gen || submission.studentGen || '';
        
        const matchesSearch = 
            studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            submission.assignmentTitle.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesGen = selectedGen === 'all' || studentGen === selectedGen;

        return matchesSearch && matchesGen;
    })
  }, [submissions, allStudents, searchTerm, selectedGen]);


  if (role === 'student') {
    router.push('/');
    return null;
  }
  
  const handleClearAll = async () => {
    setIsClearing(true);
    try {
        const result = await clearAllSubmissionsFlow();
        if (result.success) {
            toast({
                title: 'Submissions Cleared',
                description: `${result.deletedCount} submissions have been deleted.`,
            });
            fetchData(); // Refresh the data
        } else {
            throw new Error(result.message);
        }
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: error.message || 'Could not clear submissions.',
        });
    } finally {
        setIsClearing(false);
    }
  };


  return (
    <div className="space-y-6">
        <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">All Submissions</h1>
            <p className="text-muted-foreground">
                A complete log of all student submissions across all coursework.
            </p>
        </div>

        <Card>
            <CardHeader>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <CardTitle>Submission History ({filteredSubmissions.length})</CardTitle>
                        <CardDescription>
                            Search and filter through all received submissions.
                        </CardDescription>
                    </div>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            placeholder="Search by student or assignment..."
                            className="w-full pl-9"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                          />
                        </div>
                        <Select value={selectedGen} onValueChange={setSelectedGen}>
                          <SelectTrigger className="w-full md:w-[180px]">
                            <SelectValue placeholder="Filter by Gen" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableGens.map(gen => (
                              <SelectItem key={gen} value={gen} className="capitalize">{gen}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" disabled={submissions.length === 0}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Clear All
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete all {submissions.length} submissions from the database. This action will not revoke any points awarded.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleClearAll} disabled={isClearing}>
                                        {isClearing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Yes, delete all
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
            {loading ? (
                <div className="flex h-96 flex-col items-center justify-center">
                    <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Generation</TableHead>
                        <TableHead>Assignment</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead className="text-right">Link</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredSubmissions.length > 0 ? (
                            filteredSubmissions.map(submission => (
                                <TableRow key={submission.id}>
                                    <TableCell className="font-medium">{submission.studentName}</TableCell>
                                    <TableCell><Badge variant="secondary">{submission.studentGen}</Badge></TableCell>
                                    <TableCell>{submission.assignmentTitle}</TableCell>
                                    <TableCell><Badge variant="outline">{submission.pointCategory}</Badge></TableCell>
                                    <TableCell>{formatDistanceToNow(submission.submittedAt.toDate(), { addSuffix: true })}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" asChild size="icon">
                                            <Link href={submission.submissionLink} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No submissions match your filters.
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
