// src/components/exercises/SubmitExerciseDialog.tsx
'use client';

import { useState, type ReactNode, useRef } from 'react';
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
import { Loader2, CheckCircle, UploadCloud } from 'lucide-react';
import { type Exercise } from '@/contexts/ExercisesContext';
import { addSubmission } from '@/services/submissions';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import Link from 'next/link';
import { uploadImage } from '@/lib/cloudinary';
import Image from 'next/image';

const submissionSchema = z.object({
  submissionLink: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
  submissionNotes: z.string().optional(),
});

type SubmissionFormValues = z.infer<typeof submissionSchema>;

interface SubmitExerciseDialogProps {
  children: ReactNode;
  exercise: Exercise;
  onSubmissionSuccess: () => void;
}

export function SubmitExerciseDialog({ children, exercise, onSubmissionSuccess }: SubmitExerciseDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<SubmissionFormValues & { imageUrl?: string } | null>(null);
  const { toast } = useToast();
  const { user, userData } = useAuth();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<SubmissionFormValues>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      submissionLink: '',
      submissionNotes: '',
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      // No-op for schema; validation happens at submit time
    }
  };
  
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
        form.reset();
        setSubmittedData(null);
        setIsSubmitting(false);
        setImageFile(null);
        setImagePreview(null);
    }
  }

  const onSubmit = async (data: SubmissionFormValues) => {
    if (!user || !userData) return;
    
    if ((!data.submissionLink || data.submissionLink.trim() === '') && !imageFile) {
        form.setError("submissionLink", { type: "manual", message: "A submission link or an image is required." });
        return;
    }

    setIsSubmitting(true);
    let imageUrl = '';
    try {
        if (imageFile) {
            const uploadResult: any = await uploadImage(imageFile);
            imageUrl = uploadResult.secure_url;
        }

      await addSubmission({
        studentId: user.uid,
        studentName: userData.displayName,
        studentGen: userData.gen || 'N/A',
        assignmentId: exercise.id,
        assignmentTitle: exercise.title,
        submissionLink: data.submissionLink || '',
        submissionNotes: data.submissionNotes || '',
        pointCategory: 'Class Exercises',
        imageUrl: imageUrl,
      });

      toast({
        title: 'Exercise Submitted!',
        description: 'Your work has been sent to your teacher for grading.',
      });
      onSubmissionSuccess();
      setSubmittedData({ ...data, imageUrl });
    } catch (error: any) {
      const isDuplicate = error.message === 'duplicate';
      toast({
        variant: 'destructive',
        title: isDuplicate ? 'Already Submitted' : 'Error',
        description: isDuplicate
          ? 'You have already submitted this exercise.'
          : 'Could not submit your exercise.',
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Submit: {exercise.title}</DialogTitle>
          {!submittedData && (
            <DialogDescription>
              Provide a link to your work, upload an image, or both.
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
                    {submittedData.submissionLink && (
                        <p className="text-sm font-medium">
                            Submission Link:{' '}
                            <Link href={submittedData.submissionLink} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                                {submittedData.submissionLink}
                            </Link>
                        </p>
                    )}
                    {submittedData.imageUrl && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Submitted Image:</p>
                            <Image src={submittedData.imageUrl} alt="Submitted image" width={200} height={150} className="rounded-md border" />
                        </div>
                    )}
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
                render={({ field: { onChange, value, ...restField } }) => (
                    <FormItem>
                    <FormLabel>Submission Link (Optional)</FormLabel>
                    <FormControl>
                        <Input
                         placeholder="https://github.com/your-repo"
                         value={value === 'image_uploaded' ? '' : value}
                         onChange={onChange}
                         {...restField}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormItem>
                    <FormLabel>Image (Optional)</FormLabel>
                    <FormControl>
                        <div 
                        className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                        >
                        <div className="space-y-1 text-center">
                            {imagePreview ? (
                            <Image src={imagePreview} alt="Preview" width={200} height={100} className="mx-auto h-24 object-contain" />
                            ) : (
                            <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                            )}
                            <div className="flex text-sm text-muted-foreground">
                            <p className="pl-1">Click to upload an image</p>
                            <Input ref={fileInputRef} id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" />
                            </div>
                            <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
                        </div>
                        </div>
                    </FormControl>
                 </FormItem>
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
                <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
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
                <Button type="button" onClick={() => handleOpenChange(false)}>
                    Close
                </Button>
            </DialogFooter>
         )}
      </DialogContent>
    </Dialog>
  );
}
