// src/components/materials/EditMaterialDialog.tsx
'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useRoadmap } from '@/contexts/RoadmapContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Material, updateMaterial } from '@/services/materials';

const materialSchema = z.object({
    title: z.string().min(3, 'Title is too short.'),
    videoUrl: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
    slidesUrl: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
    subject: z.string().nonempty('Please select a subject.'),
    week: z.string().nonempty('Please select a week.'),
}).refine(data => data.videoUrl || data.slidesUrl, {
    message: "Please provide at least one link for a video or slides.",
    path: ["videoUrl"],
});

type MaterialFormValues = z.infer<typeof materialSchema>;

interface EditMaterialDialogProps {
  material: Material;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditMaterialDialog({ material, isOpen, onOpenChange }: EditMaterialDialogProps) {
  const { roadmapData } = useRoadmap();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      title: material.title,
      videoUrl: material.videoUrl,
      slidesUrl: material.slidesUrl,
      subject: material.subject,
      week: material.week,
    },
  });
  
  const selectedSubjectTitle = form.watch('subject');

  const availableWeeks = useMemo(() => {
    if (!selectedSubjectTitle) return [];
    const subject = roadmapData.find(s => s.title === selectedSubjectTitle);
    return subject ? subject.weeks : [];
  }, [selectedSubjectTitle, roadmapData]);


  const onSubmit = async (data: MaterialFormValues) => {
    setIsSubmitting(true);
    try {
      await updateMaterial(material.id, data);
      toast({ title: 'Material Updated!', description: 'The resource has been successfully changed.' });
      onOpenChange(false);
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Database Error',
        description: 'Failed to update the material.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Material</DialogTitle>
          <DialogDescription>Make changes to the material details.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Flexbox Explained" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="videoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Video URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://youtube.com/..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slidesUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slides URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://slides.com/..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roadmapData.map(s => <SelectItem key={s.title} value={s.title}>{s.title}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="week"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Week</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!selectedSubjectTitle}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select Week" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableWeeks.map(w => <SelectItem key={w.title} value={w.title}>{w.title}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
