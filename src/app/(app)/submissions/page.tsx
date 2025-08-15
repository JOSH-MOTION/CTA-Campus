// src/app/(app)/submissions/page.tsx
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserData } from '@/contexts/AuthContext';
import { getAllSubmissions, Submission, deleteSubmission } from '@/services/submissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ExternalLink, Loader2, Search, Trash2, CheckCircle, XCircle, Download } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { clearAllSubmissionsFlow } from '@/ai/flows/clear-all-submissions-flow';
import { awardPointsFlow } from '@/ai/flows/award-points-flow';
import { cn } from '@/lib/utils';
import Papa from 'papaparse';
import { GradeSubmissionDialog } from '@/components/submissions/GradeSubmissionDialog';
import { gradeSubmissionFlow } from '@/ai/flows/grade-submission-flow';

const submissionCategories = ['All', 'Class Assignments', 'Class Exercises', 'Weekly Projects', '100 Days of Code'];

// Helper to generate the correct activity ID based on submission type
const getActivityIdForSubmission = (submission: Submission): string => {
    switch (submission.pointCategory) {
        case 'Class Assignments':
            return `graded-submission-${submission.id}`;
        case 'Class Exercises':
            return `graded-exercise-${submission.id}`;
        case 'Weekly Projects':
            return `graded-project-${submission.id}`;
        case '100 Days of Code':
            return `100-days-of-code-${submission.assignmentTitle.replace('100 Days of Code - ', '')}`;
        default:
            return `graded-submission-${submission.id}`;
    }
};

export default function AllSubmissionsPage() {
  const router = useRouter();
  const { role, fetchAllUsers } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [allStudents, setAllStudents] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGen, setSelectedGen] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isClearing, setIsClearing] = useState(false);
  const [submissionToDelete, setSubmissionToDelete] = useState<Submission | null>(null);

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
      console.error("Failed to fetch data:", error);
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
      const matchesCategory = selectedCategory === 'All' || submission.pointCategory === selectedCategory;

      return matchesSearch && matchesGen && matchesCategory;
    });
  }, [submissions, allStudents, searchTerm, selectedGen, selectedCategory]);

  const handleRevoke = async (submission: Submission) => {
    const activityId = getActivityIdForSubmission(submission);
    
    try {
      const result = await awardPointsFlow({
          studentId: submission.studentId,
          points: 0, // points are retrieved from the doc, so 0 is fine here.
          reason: submission.pointCategory,
          activityId: activityId,
          action: 'revoke',
          assignmentTitle: submission.assignmentTitle,
      });

       if (!result.success) throw new Error(result.message);
       
      await gradeSubmissionFlow({
            submissionId: submission.id,
            studentId: submission.studentId,
            assignmentTitle: submission.assignmentTitle,
            grade: undefined, // Set grade to undefined to mark as not graded
            feedback: "Points revoked.",
      });

      await fetchData();
      
      toast({
        title: 'Points Revoked',
        description: `Points for ${submission.studentName} have been revoked.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Could not revoke points.',
      });
    }
  };
  
  const handleDelete = async () => {
      if (!submissionToDelete) return;

      try {
          if(submissionToDelete.grade) {
              await handleRevoke(submissionToDelete);
          }
          await deleteSubmission(submissionToDelete.id);
          toast({
              title: 'Submission Deleted',
              description: 'The submission has been permanently removed.'
          });
          fetchData();
      } catch (error) {
           toast({
              variant: 'destructive',
              title: 'Error',
              description: 'Could not delete submission.'
          });
      } finally {
          setSubmissionToDelete(null);
      }
  }


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
        fetchData();
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

  const handleDownloadCsv = () => {
    const dataToExport = filteredSubmissions.map(s => ({
        Student: s.studentName,
        Generation: s.studentGen,
        Assignment: s.assignmentTitle,
        Category: s.pointCategory,
        Submitted: s.submittedAt.toDate().toLocaleString(),
        Link: s.submissionLink,
        Graded: s.grade ? 'Yes' : 'No'
    }));

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'submissions.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <>
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
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by student or assignment..."
                  className="w-full pl-9"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
               <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {submissionCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              <Button onClick={handleDownloadCsv} variant="outline" disabled={filteredSubmissions.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Download CSV
              </Button>
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
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Gen</TableHead>
                  <TableHead>Assignment</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Link</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.length > 0 ? (
                  filteredSubmissions.map(submission => {
                    return (
                        <TableRow key={submission.id}>
                            <TableCell className="font-medium">{submission.studentName}</TableCell>
                            <TableCell><Badge variant="secondary">{submission.studentGen}</Badge></TableCell>
                            <TableCell>
                                <p className="font-medium">{submission.assignmentTitle}</p>
                                <Badge variant="outline" className="mt-1">{submission.pointCategory}</Badge>
                            </TableCell>
                            <TableCell>{formatDistanceToNow(submission.submittedAt.toDate(), { addSuffix: true })}</TableCell>
                            <TableCell>
                                <Button variant="ghost" asChild size="icon">
                                    <Link href={submission.submissionLink} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                                {submission.grade ? (
                                     <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleRevoke(submission)}
                                    >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Revoke
                                    </Button>
                                ) : (
                                    <GradeSubmissionDialog
                                        submission={submission}
                                        onGraded={fetchData}
                                    >
                                        <Button size="sm" variant="outline">
                                          <CheckCircle className="mr-2 h-4 w-4" />
                                          Grade
                                        </Button>
                                    </GradeSubmissionDialog>
                                )}
                                 <Button 
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setSubmissionToDelete(submission)}
                                >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No submissions match your filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            </div>
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
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
        </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
