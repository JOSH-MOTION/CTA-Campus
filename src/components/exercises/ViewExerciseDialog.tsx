// src/components/exercises/ViewExerciseDialog.tsx
'use client';

import { type ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { type Exercise } from '@/contexts/ExercisesContext';
import { Badge } from '../ui/badge';
import { linkify } from '@/lib/linkify';

interface ViewExerciseDialogProps {
  children: ReactNode;
  exercise: Exercise;
}

export function ViewExerciseDialog({ children, exercise }: ViewExerciseDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{exercise.title}</DialogTitle>
          <DialogDescription className="pt-4 whitespace-pre-wrap break-words">
            {linkify(exercise.description)}
          </DialogDescription>
        </DialogHeader>
        {(exercise.subject && exercise.week) && (
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="outline">{exercise.subject}</Badge>
            <Badge variant="secondary">{exercise.week}</Badge>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}