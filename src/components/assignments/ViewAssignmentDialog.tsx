// src/components/assignments/ViewAssignmentDialog.tsx
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
import { type Assignment } from '@/contexts/AssignmentsContext';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';
import { Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';


interface ViewAssignmentDialogProps {
  children: ReactNode;
  assignment: Assignment;
}

export function ViewAssignmentDialog({ children, assignment }: ViewAssignmentDialogProps) {
  const { userData } = useAuth();
  const studentDueDate = assignment.dueDates?.find(d => d.day.toLowerCase() === userData?.lessonDay?.toLowerCase());

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{assignment.title}</DialogTitle>
          <DialogDescription className="pt-4 whitespace-pre-wrap">
            {assignment.description}
          </DialogDescription>
        </DialogHeader>
        {(assignment.subject && assignment.week) && (
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{assignment.subject}</Badge>
            <Badge variant="secondary">{assignment.week}</Badge>
          </div>
        )}
        <div className="space-y-2 py-4">
            <p className="text-sm font-semibold">Due Date:</p>
            <div className="flex flex-wrap gap-2">
                {studentDueDate ? (
                    <Badge variant="secondary" className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        <span>{studentDueDate.day}: {format(new Date(studentDueDate.dateTime), 'PP p')}</span>
                    </Badge>
                ) : (
                    <Badge variant="outline">No specific due date for your assigned day</Badge>
                )}
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
