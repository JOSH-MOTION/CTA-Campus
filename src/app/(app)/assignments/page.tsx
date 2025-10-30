// src/app/(app)/assignments/page.tsx
'use client';

import { useMemo, useState, useEffect } from 'react';
import {Button} from '@/components/ui/button';
import {PlusCircle, ListOrdered, ArrowRight, Clock, Loader2, BookCheck, CheckCircle, Eye, Filter} from 'lucide-react';
import {useAuth} from '@/contexts/AuthContext';
import {useAssignments} from '@/contexts/AssignmentsContext';
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from '@/components/ui/card';
import {CreateAssignmentDialog} from '@/components/assignments/CreateAssignmentDialog';
import {Badge} from '@/components/ui/badge';
import {format} from 'date-fns';
import { AssignmentActions } from '@/components/assignments/AssignmentActions';
import { SubmitAssignmentDialog } from '@/components/assignments/SubmitAssignmentDialog';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ViewAssignmentDialog } from '@/components/assignments/ViewAssignmentDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


export default function AssignmentsPage() {
  const {role, userData, user} = useAuth();
  const {assignments, loading} = useAssignments();
  const isTeacherOrAdmin = role === 'teacher' || role === 'admin';
  const router = useRouter();
  const [submittedAssignmentIds, setSubmittedAssignmentIds] = useState<Set<string>>(new Set());
  const [checkingSubmissions, setCheckingSubmissions] = useState(true);
  const [genFilter, setGenFilter] = useState<string>('my-gen');

  useEffect(() => {
    const fetchSubmissions = async () => {
        if (role === 'student' && user) {
            setCheckingSubmissions(true);
            const submissionsQuery = query(
                collection(db, 'submissions'),
                where('studentId', '==', user.uid)
            );
            const querySnapshot = await getDocs(submissionsQuery);
            const ids = new Set(querySnapshot.docs.map(doc => doc.data().assignmentId));
            setSubmittedAssignmentIds(ids);
            setCheckingSubmissions(false);
        } else {
            setCheckingSubmissions(false);
        }
    };
    if (!loading) {
        fetchSubmissions();
    }
  }, [user, role, loading]);

  // Get available generations from assignments
  const availableGens = useMemo(() => {
    const gens = new Set<string>();
    assignments.forEach(assignment => {
      if (assignment.targetGen && 
          assignment.targetGen !== 'Everyone' && 
          assignment.targetGen !== 'All Students') {
        gens.add(assignment.targetGen);
      }
    });
    return Array.from(gens).sort();
  }, [assignments]);

  // Filter assignments based on role and selected filter
  const filteredAssignments = useMemo(() => {
    if (role === 'student') {
      // Students see assignments targeted to them
      return assignments.filter(assignment => 
        assignment.targetGen === 'Everyone' ||
        assignment.targetGen === 'All Students' ||
        assignment.targetGen === userData?.gen
      );
    }

    if (role === 'teacher') {
      const teacherGen = userData?.gen;
      
      if (genFilter === 'all') {
        // Show all assignments when "All Assignments" is selected
        return assignments;
      } else if (genFilter === 'my-gen' && teacherGen) {
        // Show only assignments for teacher's generation
        return assignments.filter(assignment => 
          assignment.targetGen === teacherGen ||
          assignment.targetGen === 'Everyone' ||
          assignment.targetGen === 'All Students'
        );
      } else if (genFilter !== 'my-gen' && genFilter !== 'all') {
        // Show assignments for a specific generation
        return assignments.filter(assignment => 
          assignment.targetGen === genFilter ||
          assignment.targetGen === 'Everyone' ||
          assignment.targetGen === 'All Students'
        );
      }
    }

    // Admin sees everything
    return assignments;
  }, [assignments, role, userData?.gen, genFilter]);

  const sortedAssignments = [...filteredAssignments].sort((a, b) => {
    return (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0);
  });

  const isLoading = loading || (role === 'student' && checkingSubmissions);

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
          <p className="text-muted-foreground">
            {isTeacherOrAdmin ? 'Create and manage assignments.' : 'View and submit your assignments.'}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {role === 'teacher' && (
            <Select value={genFilter} onValueChange={setGenFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by Gen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="my-gen">My Generation</SelectItem>
                <SelectItem value="all">All Assignments</SelectItem>
                {availableGens.map(gen => (
                  <SelectItem key={gen} value={gen}>{gen}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {isTeacherOrAdmin && (
            <CreateAssignmentDialog>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Assignment
              </Button>
            </CreateAssignmentDialog>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed">
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
        </div>
      ) : sortedAssignments.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedAssignments.map(assignment => {
            const studentDueDate = assignment.dueDates?.find(d => d.day.toLowerCase() === userData?.lessonDay?.toLowerCase());
            const hasSubmitted = submittedAssignmentIds.has(assignment.id);

            return (
                <Card key={assignment.id} className="flex flex-col">
                  <ViewAssignmentDialog assignment={assignment}>
                    <div className="flex-grow cursor-pointer hover:bg-muted/50">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                            <div className="flex-1 pr-2">
                                <CardTitle>{assignment.title}</CardTitle>
                                {(assignment.subject && assignment.week) && (
                                  <div className="mt-1 flex flex-wrap gap-2">
                                    <Badge variant="outline">{assignment.subject}</Badge>
                                    <Badge variant="secondary">{assignment.week}</Badge>
                                  </div>
                                )}
                                {isTeacherOrAdmin && <Badge variant={assignment.targetGen === 'Everyone' ? 'destructive' : assignment.targetGen === 'All Students' ? 'default' : 'secondary'} className="mt-1">{assignment.targetGen}</Badge>}
                            </div>
                            <AssignmentActions assignment={assignment} />
                            </div>
                            <CardDescription className="pt-2 line-clamp-2">{assignment.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <p className="text-sm font-semibold">Due Date:</p>
                            <div className="flex flex-wrap gap-2">
                                {isTeacherOrAdmin ? (
                                    assignment.dueDates?.length > 0 ? assignment.dueDates.map(dueDate => (
                                        <Badge key={dueDate.day} variant="secondary" className="flex items-center gap-1.5">
                                            <Clock className="h-3 w-3" />
                                            <span>{dueDate.day}: {format(new Date(dueDate.dateTime), 'PP p')}</span>
                                        </Badge>
                                    )) : <Badge variant="outline">No due date set</Badge>
                                ) : studentDueDate ? (
                                    <Badge variant="secondary" className="flex items-center gap-1.5">
                                        <Clock className="h-3 w-3" />
                                        <span>{studentDueDate.day}: {format(new Date(studentDueDate.dateTime), 'PP p')}</span>
                                    </Badge>
                                ) : (
                                    <Badge variant="outline">No due date for your day</Badge>
                                )}
                            </div>
                        </CardContent>
                    </div>
                  </ViewAssignmentDialog>
                <CardFooter className="flex flex-col items-start gap-2 pt-4">
                     {!isTeacherOrAdmin && (
                        <ViewAssignmentDialog assignment={assignment}>
                            <Button variant="outline" className="w-full">
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                            </Button>
                        </ViewAssignmentDialog>
                     )}
                    {isTeacherOrAdmin ? (
                    <Button variant="outline" className="w-full" onClick={() => router.push(`/assignments/${assignment.id}`)}>
                        <BookCheck className="mr-2 h-4 w-4" />
                        View Submissions
                    </Button>
                    ) : hasSubmitted ? (
                        <Button className="w-full bg-green-600 hover:bg-green-700" disabled>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Submitted
                        </Button>
                    ) : (
                    <SubmitAssignmentDialog assignment={assignment} onSubmissionSuccess={() => {
                        setSubmittedAssignmentIds(prev => new Set(prev).add(assignment.id));
                    }}>
                        <Button className="w-full">
                        Submit Work <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </SubmitAssignmentDialog>
                    )}
                </CardFooter>
                </Card>
            )
          })}
        </div>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed">
          <ListOrdered className="h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">No assignments yet</h2>
          <p className="mt-1 text-muted-foreground">
            {isTeacherOrAdmin ? 'Create the first assignment to get started.' : 'Check back later for assignments.'}
          </p>
        </div>
      )}
    </div>
  );
}