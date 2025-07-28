// src/components/projects/ProjectActions.tsx
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
import { Project, useProjects } from '@/contexts/ProjectsContext';
import { useToast } from '@/hooks/use-toast';
import { EditProjectDialog } from './EditProjectDialog';

interface ProjectActionsProps {
  project: Project;
}

export function ProjectActions({ project }: ProjectActionsProps) {
  const { user, role } = useAuth();
  const { deleteProject } = useProjects();
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const isOwner = user?.uid === project.authorId;
  const isAdmin = role === 'admin';

  const handleDelete = async () => {
    try {
      await deleteProject(project.id);
      toast({
        title: 'Project Deleted',
        description: 'The project has been successfully deleted.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete project. You may not have permission.',
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
              This action cannot be undone. This will permanently delete the project.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isEditDialogOpen && (
        <EditProjectDialog
          project={project}
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
        />
      )}
    </>
  );
}
