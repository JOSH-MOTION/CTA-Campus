// src/app/(app)/exercises/page.tsx
'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, PencilRuler, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useExercises } from '@/contexts/ExercisesContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { CreateExerciseDialog } from '@/components/exercises/CreateExerciseDialog';
import { Badge } from '@/components/ui/badge';
import { ExerciseActions } from '@/components/exercises/ExerciseActions';

export default function ExercisesPage() {
  const { role, userData } = useAuth();
  const { exercises, loading } = useExercises();
  const isTeacherOrAdmin = role === 'teacher' || role === 'admin';

  const filteredExercises = useMemo(() => {
    if (isTeacherOrAdmin) return exercises;
    return exercises.filter(exercise => {
      if (exercise.targetGen === 'Everyone') return true;
      if (role === 'student' && exercise.targetGen === 'All Students') return true;
      if (role === 'student' && exercise.targetGen === userData?.gen) return true;
      return false;
    });
  }, [exercises, isTeacherOrAdmin, role, userData?.gen]);
  
  const sortedExercises = [...filteredExercises].sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Exercises</h1>
          <p className="text-muted-foreground">
            {isTeacherOrAdmin ? 'Create and manage exercises.' : 'View and complete your exercises.'}
          </p>
        </div>
        {isTeacherOrAdmin && (
          <CreateExerciseDialog>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Exercise
            </Button>
          </CreateExerciseDialog>
        )}
      </div>

      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed">
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
        </div>
      ) : sortedExercises.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedExercises.map(exercise => (
            <Card key={exercise.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1 pr-2">
                    <CardTitle>{exercise.title}</CardTitle>
                    {isTeacherOrAdmin && <Badge variant={exercise.targetGen === 'Everyone' ? 'destructive' : exercise.targetGen === 'All Students' ? 'default' : 'secondary'} className="mt-1">{exercise.targetGen}</Badge>}
                  </div>
                  <ExerciseActions exercise={exercise} />
                </div>
                <CardDescription className="pt-2">{exercise.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow"></CardContent>
              <CardFooter>
                 <Button className="w-full">
                    Start Exercise
                  </Button>
              </CardFooter>
            </Card>
          ))}
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
