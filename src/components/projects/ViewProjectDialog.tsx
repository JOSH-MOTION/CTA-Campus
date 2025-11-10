// src/components/projects/ViewProjectDialog.tsx
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
import { type Project } from '@/contexts/ProjectsContext';
import { linkify } from '@/lib/linkify';

interface ViewProjectDialogProps {
  children: ReactNode;
  project: Project;
}

export function ViewProjectDialog({ children, project }: ViewProjectDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{project.title}</DialogTitle>
          <DialogDescription className="pt-4 whitespace-pre-wrap">
            {linkify(project.description)}
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}