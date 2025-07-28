// src/components/exercises/ExerciseActions.tsx
'use client';

import { useState } from 'react';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { Exercise, useExercises } from '@/contexts/ExercisesContext';
import { useToast } from '@/hooks/use-toast';
import { EditExerciseDialog } from './EditExerciseDialog';

interface ExerciseActionsProps {
  exercise: Exercise;
}

export function ExerciseActions({ exercise }: ExerciseActionsProps) {
  const { user, role } = useAuth();
  const { deleteExercise } = useExercises();
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const isOwner = user?.uid === exercise.authorId;
  const isAdmin = role === 'admin';

  const handleDelete = async () => {
    try {
      await deleteExercise(exercise.id);
      toast({
        title: 'Exercise Deleted',
        description: 'The exercise has been successfully deleted.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete exercise. You may not have permission.',
      });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  if (!isOwner && !isAdmin) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the exercise.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isEditDialogOpen && (
        <EditExerciseDialog
          exercise={exercise}
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
        />
      )}
    </>
  );
}
