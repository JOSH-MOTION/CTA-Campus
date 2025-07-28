// src/components/announcements/CreateAnnouncementDialog.tsx
'use client';

import {useState, type ReactNode} from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {useForm, Controller} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form';
import {useAnnouncements} from '@/contexts/AnnouncementsContext';
import {useAuth} from '@/contexts/AuthContext';
import {useToast} from '@/hooks/use-toast';

const announcementSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters long.'),
  content: z.string().min(10, 'Content must be at least 10 characters long.'),
});

type AnnouncementFormValues = z.infer<typeof announcementSchema>;

interface CreateAnnouncementDialogProps {
  children: ReactNode;
}

export function CreateAnnouncementDialog({children}: CreateAnnouncementDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const {addAnnouncement} = useAnnouncements();
  const {toast} = useToast();

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: '',
      content: '',
    },
  });

  const onSubmit = (data: AnnouncementFormValues) => {
    addAnnouncement({
      ...data,
      author: 'Teacher', // In a real app, this would come from the authenticated user
    });
    toast({
      title: 'Announcement Created',
      description: 'Your announcement has been posted.',
    });
    form.reset();
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a New Announcement</DialogTitle>
          <DialogDescription>
            This announcement will be visible to all students and staff.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({field}) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Upcoming Midterm Exams" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({field}) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Provide the full details of the announcement here..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
