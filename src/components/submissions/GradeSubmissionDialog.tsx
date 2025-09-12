// src/components/submissions/GradeSubmissionDialog.tsx
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
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, ExternalLink, Award } from 'lucide-react';
import { type Submission } from '@/services/submissions';
import { gradeSubmissionFlow } from '@/ai/flows/grade-submission-flow';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import Link from 'next/link';
import { Input } from '../ui/input';
import { awardPointsFlow } from '@/ai/flows/award-points-flow';

const gradingSchema = z.object({
  feedback: z.string().optional(),
});

type GradingFormValues = z.infer<typeof gradingSchema>;

interface GradeSubmissionDialogProps {
  children: ReactNode;
  submission: Submission;
  onGraded: () => void;
}

const getActivityIdForSubmission = (submission: Submission): string => {
    switch (submission.pointCategory) {
        case 'Class Assignments':
            return `graded-submission-${submission.id}`;
        case 'Class Exercises':
            return `graded-exercise-${submission.id}`;
        case 'Weekly Projects':
            return `graded-project-${submission.id}`;
        case '100 Days of Code':
            return `100-days-of-code-${submission.assignmentTitle.replace('100 Days of Code - ', '')}`;
        default:
            return `graded-submission-${submission.id}`;
    }
};

export function GradeSubmissionDialog({ children, submission, onGraded }: GradeSubmissionDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<GradingFormValues>({
    resolver: zodResolver(gradingSchema),
    defaultValues: {
      feedback: submission.feedback || '',
    },
  });

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      form.reset();
    }
  }

  const pointsToAward = submission.pointCategory === '100 Days of Code' ? 0.5 : 1;

  const onSubmit = async (data: GradingFormValues) => {
    setIsSubmitting(true);
    try {
        const activityId = getActivityIdForSubmission(submission);
        
        // Award points first
        const awardResult = await awardPointsFlow({
            studentId: submission.studentId,
            points: pointsToAward,
            reason: submission.pointCategory,
            activityId,
            action: 'award',
            assignmentTitle: submission.assignmentTitle,
        });

        if (!awardResult.success) {
            // Allow duplicates to proceed to grading without showing an error
            if (awardResult.message !== 'duplicate') {
                throw new Error(awardResult.message);
            }
        }

        // Then, update the submission document with grade and feedback
        const gradeResult = await gradeSubmissionFlow({
            submissionId: submission.id,
            studentId: submission.studentId,
            assignmentTitle: submission.assignmentTitle,
            grade: 'Complete',
            feedback: data.feedback,
        });

        if (!gradeResult.success) {
            throw new Error(gradeResult.message);
        }

        toast({
            title: 'Submission Graded!',
            description: `Awarded ${pointsToAward} points and saved feedback.`,
        });
        onGraded();
        setIsOpen(false);

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Could not grade the submission.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Grade: {submission.assignmentTitle}</DialogTitle>
          <DialogDescription>
            Submitted by {submission.studentName} from {submission.studentGen}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
            <p className="text-sm font-medium">
                Submission Link:{' '}
                <Button variant="link" asChild className="p-0 h-auto">
                    <Link href={submission.submissionLink} target="_blank" rel="noopener noreferrer">
                       View Submission <ExternalLink className="ml-2 h-3 w-3" />
                    </Link>
                </Button>
            </p>
            {submission.submissionNotes && (
                <div className="space-y-1">
                    <p className="text-sm font-medium">Student Notes:</p>
                    <blockquote className="border-l-2 pl-6 italic text-muted-foreground">
                       {submission.submissionNotes}
                    </blockquote>
                </div>
            )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Alert>
                <Award className="h-4 w-4" />
                <AlertTitle>Points to Award</AlertTitle>
                <AlertDescription>
                    This will award <span className="font-bold">{pointsToAward} point(s)</span> to the student.
                </AlertDescription>
            </Alert>
            <FormField
              control={form.control}
              name="feedback"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Feedback (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Provide constructive feedback for the student..." {...field} />
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
                Save Grade
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}