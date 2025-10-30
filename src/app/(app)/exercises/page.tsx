// src/app/(app)/exercises/page.tsx
'use client';

import { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, PencilRuler, Loader2, ArrowRight, CheckCircle, BookCheck, Filter } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useExercises } from '@/contexts/ExercisesContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { CreateExerciseDialog } from '@/components/exercises/CreateExerciseDialog';
import { Badge } from '@/components/ui/badge';
import { ExerciseActions } from '@/components/exercises/ExerciseActions';
import { SubmitExerciseDialog } from '@/components/exercises/SubmitExerciseDialog';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ExercisesPage() {
  const { role, userData, user } = useAuth();
  const { exercises, loading } = useExercises();
  const isTeacherOrAdmin = role === 'teacher' || role === 'admin';
  const router = useRouter();
  const [submittedExerciseIds, setSubmittedExerciseIds] = useState<Set<string>>(new Set());
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
            const exerciseSubmissions = new Set<string>();
            querySnapshot.docs.forEach(doc => {
              const submission = doc.data();
              if (exercises.some(ex => ex.id === submission.assignmentId)) {
                exerciseSubmissions.add(submission.assignmentId);
              }
            });
            setSubmittedExerciseIds(exerciseSubmissions);
            setCheckingSubmissions(false);
        } else {
            setCheckingSubmissions(false);
        }
    };
    if (!loading) {
       fetchSubmissions();
    }
  }, [user, role, loading, exercises]);

  // Get available generations from exercises
  const availableGens = useMemo(() => {
    const gens = new Set<string>();
    exercises.forEach(exercise => {
      if (exercise.targetGen && 
          exercise.targetGen !== 'Everyone' && 
          exercise.targetGen !== 'All Students') {
        gens.add(exercise.targetGen);
      }
    });
    return Array.from(gens).sort();
  }, [exercises]);

  // Filter exercises based on role and selected filter
  const filteredExercises = useMemo(() => {
    if (role === 'student') {
      // Students see exercises targeted to them
      return exercises.filter(exercise => 
        exercise.targetGen === 'Everyone' ||
        exercise.targetGen === 'All Students' ||
        exercise.targetGen === userData?.gen
      );
    }

    if (role === 'teacher') {
      const teacherGen = userData?.gen;
      
      if (genFilter === 'all') {
        // Show all exercises when "All Exercises" is selected
        return exercises;
      } else if (genFilter === 'my-gen' && teacherGen) {
        // Show only exercises for teacher's generation
        return exercises.filter(exercise => 
          exercise.targetGen === teacherGen ||
          exercise.targetGen === 'Everyone' ||
          exercise.targetGen === 'All Students'
        );
      } else if (genFilter !== 'my-gen' && genFilter !== 'all') {
        // Show exercises for a specific generation
        return exercises.filter(exercise => 
          exercise.targetGen === genFilter ||
          exercise.targetGen === 'Everyone' ||
          exercise.targetGen === 'All Students'
        );
      }
    }

    // Admin sees everything
    return exercises;
  }, [exercises, role, userData?.gen, genFilter]);
  
  const sortedExercises = [...filteredExercises].sort((a, b) => {
    const aTime = a.createdAt?.toMillis() || 0;
    const bTime = b.createdAt?.toMillis() || 0;
    return bTime - aTime;
  });

  const isLoading = loading || (role === 'student' && checkingSubmissions);

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Exercises</h1>
          <p className="text-muted-foreground">
            {isTeacherOrAdmin ? 'Create and manage exercises.' : 'View and submit your exercises.'}
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
                <SelectItem value="all">All Exercises</SelectItem>
                {availableGens.map(gen => (
                  <SelectItem key={gen} value={gen}>{gen}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {isTeacherOrAdmin && (
            <CreateExerciseDialog>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Exercise
              </Button>
            </CreateExerciseDialog>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed">
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
        </div>
      ) : sortedExercises.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedExercises.map(exercise => {
            const hasSubmitted = submittedExerciseIds.has(exercise.id);
            return (
              <Card key={exercise.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1 pr-2">
                      <CardTitle>{exercise.title}</CardTitle>
                      {(exercise.subject && exercise.week) && (
                        <div className="mt-1 flex flex-wrap gap-2">
                          <Badge variant="outline">{exercise.subject}</Badge>
                          <Badge variant="secondary">{exercise.week}</Badge>
                        </div>
                      )}
                      {isTeacherOrAdmin && <Badge variant={exercise.targetGen === 'Everyone' ? 'destructive' : exercise.targetGen === 'All Students' ? 'default' : 'secondary'} className="mt-1">{exercise.targetGen}</Badge>}
                    </div>
                    {isTeacherOrAdmin && <ExerciseActions exercise={exercise} />}
                  </div>
                  <CardDescription className="pt-2">{exercise.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow"></CardContent>
                <CardFooter>
                  {isTeacherOrAdmin ? (
                     <Button variant="outline" className="w-full" onClick={() => router.push(`/exercises/${exercise.id}`)}>
                        <BookCheck className="mr-2 h-4 w-4" />
                        View Submissions
                     </Button>
                  ) : hasSubmitted ? (
                    <Button className="w-full bg-green-600 hover:bg-green-700" disabled>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Submitted
                    </Button>
                  ) : (
                    <SubmitExerciseDialog exercise={exercise} onSubmissionSuccess={() => {
                        setSubmittedExerciseIds(prev => new Set(prev).add(exercise.id));
                    }}>
                      <Button className="w-full">
                        Submit Work <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </SubmitExerciseDialog>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed">
          <PencilRuler className="h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">No exercises yet</h2>
          <p className="mt-1 text-muted-foreground">
            {isTeacherOrAdmin ? 'Create the first exercise to get started.' : 'Check back later for exercises.'}
          </p>
        </div>
      )}
    </div>
  );
}