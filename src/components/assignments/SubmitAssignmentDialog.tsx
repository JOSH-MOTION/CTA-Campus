// src/components/assignments/SubmitAssignmentDialog.tsx
'use client';

import { useState, type ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { type Assignment } from '@/contexts/AssignmentsContext';
import { addSubmission } from '@/services/submissions';
import { awardPoint } from '@/services/points';

const submissionSchema = z.object({
  submissionLink: z.string().url('Please enter a valid URL (e.g., https://github.com/...)'),
  submissionNotes: z.string().optional(),
});

type SubmissionFormValues = z.infer<typeof submissionSchema>;

interface SubmitAssignmentDialogProps {
  children: ReactNode;
  assignment: Assignment;
  onSubmissionSuccess: () => void;
}

export function SubmitAssignmentDialog({ children, assignment, onSubmissionSuccess }: SubmitAssignmentDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user, userData } = useAuth();

  const form = useForm<SubmissionFormValues>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      submissionLink: '',
      submissionNotes: '',
    },
  });

  const onSubmit = async (data: SubmissionFormValues) => {
    if (!user || !userData) return;
    setIsSubmitting(true);
    try {
      // 1. Add the submission to the database
      await addSubmission({
        studentId: user.uid,
        studentName: userData.displayName,
        studentGen: userData.gen || 'N/A',
        assignmentId: assignment.id,
        assignmentTitle: assignment.title,
        submissionLink: data.submissionLink,
        submissionNotes: data.submissionNotes || '',
      });

      // 2. Award points for the submission
      await awardPoint(user.uid, 1, 'Class Assignment', `assignment-${assignment.id}`);

      toast({
        title: 'Assignment Submitted!',
        description: 'Your work has been sent to your teacher and you have been awarded 1 point.',
      });
      onSubmissionSuccess();
      form.reset();
      setIsOpen(false);
    } catch (error: any) {
      const isDuplicate = error.message === 'duplicate';
      toast({
        variant: 'destructive',
        title: isDuplicate ? 'Already Submitted' : 'Error',
        description: isDuplicate
          ? 'You have already submitted this assignment and received points for it.'
          : 'Could not submit your assignment.',
      });
      // If it's a duplicate error, we should still update the UI state
      if (isDuplicate) {
          onSubmissionSuccess();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit: {assignment.title}</DialogTitle>
          <DialogDescription>
            Provide a link to your work and any notes for your instructor.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="submissionLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Submission Link</FormLabel>
                  <FormControl>
                    <Input placeholder="https://github.com/your-repo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="submissionNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Anything you want your teacher to know?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit & Get 1 Point
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
