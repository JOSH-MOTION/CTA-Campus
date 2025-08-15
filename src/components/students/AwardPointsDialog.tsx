// src/components/students/AwardPointsDialog.tsx
'use client';

import { useState, type ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
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
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { UserData } from '@/contexts/AuthContext';
import { awardPointsFlow } from '@/ai/flows/award-points-flow';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const awardSchema = z.object({
  points: z.coerce.number().min(0.1, 'Points must be greater than 0.'),
  reason: z.string().nonempty('Please select a reason.'),
  notes: z.string().optional(),
});

type AwardFormValues = z.infer<typeof awardSchema>;

interface AwardPointsDialogProps {
  children: ReactNode;
  student: UserData;
}

const pointReasons = [
    "Class Attendance",
    "Class Assignments",
    "Class Exercises",
    "Weekly Projects",
    "Monthly Personal Projects",
    "Soft Skills & Product Training",
    "Mini Demo Days",
    "100 Days of Code",
    "Code Review",
    "Final Project Completion",
    "Bonus Points",
    "Other"
];


export function AwardPointsDialog({ children, student }: AwardPointsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<AwardFormValues>({
    resolver: zodResolver(awardSchema),
    defaultValues: {
      points: 0,
      reason: '',
      notes: '',
    }
  });

  const onSubmit = async (data: AwardFormValues) => {
    setIsSubmitting(true);
    try {
        const activityId = `manual-award-${uuidv4()}`;
        const result = await awardPointsFlow({
            studentId: student.uid,
            points: data.points,
            reason: data.reason,
            activityId: activityId,
            action: 'award',
            assignmentTitle: data.notes || data.reason,
        });

      if (!result.success) {
          throw new Error(result.message);
      }

      toast({
        title: 'Points Awarded!',
        description: `${student.displayName} has been awarded ${data.points} points.`,
      });
      form.reset();
      setIsOpen(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Could not award points.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Award Points to {student.displayName}</DialogTitle>
          <DialogDescription>
            Manually grant points for a specific achievement or activity.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="points"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Points</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 5" {...field} step="0.5" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Award</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a reason" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {pointReasons.map(reason => (
                            <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Add any specific details here..." {...field} />
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
                Confirm Award
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
