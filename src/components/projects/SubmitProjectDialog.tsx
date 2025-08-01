// src/components/projects/SubmitProjectDialog.tsx
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
import { Loader2, CheckCircle } from 'lucide-react';
import { type Project } from '@/contexts/ProjectsContext';
import { addSubmission } from '@/services/submissions';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import Link from 'next/link';

const submissionSchema = z.object({
  submissionLink: z.string().url('Please enter a valid URL (e.g., https://github.com/...)'),
  submissionNotes: z.string().optional(),
});

type SubmissionFormValues = z.infer<typeof submissionSchema>;

interface SubmitProjectDialogProps {
  children: ReactNode;
  project: Project;
  onSubmissionSuccess: () => void;
}

export function SubmitProjectDialog({ children, project, onSubmissionSuccess }: SubmitProjectDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<SubmissionFormValues | null>(null);
  const { toast } = useToast();
  const { user, userData } = useAuth();

  const form = useForm<SubmissionFormValues>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      submissionLink: '',
      submissionNotes: '',
    },
  });

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
        form.reset();
        setSubmittedData(null);
        setIsSubmitting(false);
    }
  }

  const onSubmit = async (data: SubmissionFormValues) => {
    if (!user || !userData) return;
    setIsSubmitting(true);
    try {
      await addSubmission({
        studentId: user.uid,
        studentName: userData.displayName,
        studentGen: userData.gen || 'N/A',
        assignmentId: project.id,
        assignmentTitle: project.title,
        submissionLink: data.submissionLink,
        submissionNotes: data.submissionNotes || '',
        pointsToAward: 1,
        pointCategory: 'Weekly Projects',
      });

      toast({
        title: 'Project Submitted!',
        description: 'Your work has been sent to your teacher. You have been awarded 1 point.',
      });
      onSubmissionSuccess();
      setSubmittedData(data);
    } catch (error: any) {
      const isDuplicate = error.message === 'duplicate';
      toast({
        variant: 'destructive',
        title: isDuplicate ? 'Already Submitted' : 'Error',
        description: isDuplicate
          ? 'You have already submitted this project.'
          : 'Could not submit your project.',
      });
      if (isDuplicate) {
          onSubmissionSuccess();
          setIsOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit: {project.title}</DialogTitle>
          {!submittedData && (
            <DialogDescription>
                Provide a link to your work and any notes for your instructor.
            </DialogDescription>
          )}
        </DialogHeader>

        {submittedData ? (
             <div className="space-y-4">
                <Alert variant="default" className="border-green-500 bg-green-50 dark:bg-green-950">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <AlertTitle className="text-green-700 dark:text-green-300">Submission Successful!</AlertTitle>
                    <AlertDescription className="text-green-700 dark:text-green-400">
                       Your work has been submitted for grading. Here's a summary of what you sent.
                    </AlertDescription>
                </Alert>
                <div className="space-y-3 rounded-md border p-4">
                    <p className="text-sm font-medium">
                        Submission Link:{' '}
                        <Link href={submittedData.submissionLink} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                            {submittedData.submissionLink}
                        </Link>
                    </p>
                    {submittedData.submissionNotes && (
                        <p className="text-sm font-medium">
                            Notes: <span className="font-normal text-muted-foreground">{submittedData.submissionNotes}</span>
                        </p>
                    )}
                </div>
            </div>
        ) : (
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
                    Submit Work
                </Button>
                </DialogFooter>
            </form>
            </Form>
        )}
        {submittedData && (
            <DialogFooter>
                <Button type="button" onClick={() => setIsOpen(false)}>
                    Close
                </Button>
            </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
