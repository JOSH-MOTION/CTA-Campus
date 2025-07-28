// src/components/announcements/CreateAnnouncementDialog.tsx
'use client';

import {useState, type ReactNode, useEffect, useMemo} from 'react';
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
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form';
import {useAnnouncements} from '@/contexts/AnnouncementsContext';
import {useAuth, UserData} from '@/contexts/AuthContext';
import {useToast} from '@/hooks/use-toast';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';

const announcementSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters long.'),
  content: z.string().min(10, 'Content must be at least 10 characters long.'),
  targetGen: z.string().nonempty('Please select a target generation.'),
});

type AnnouncementFormValues = z.infer<typeof announcementSchema>;

interface CreateAnnouncementDialogProps {
  children: ReactNode;
}

export function CreateAnnouncementDialog({children}: CreateAnnouncementDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const {addAnnouncement} = useAnnouncements();
  const {toast} = useToast();
  const {user, fetchAllUsers} = useAuth();
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const loadUsers = async () => {
        setLoading(true);
        const users = await fetchAllUsers();
        setAllUsers(users);
        setLoading(false);
      };
      loadUsers();
    }
  }, [isOpen, fetchAllUsers]);

  const availableGens = useMemo(() => {
    const studentGens = allUsers
      .filter(u => u.role === 'student' && u.gen)
      .map(u => u.gen!);
    return ['All', ...[...new Set(studentGens)].sort()];
  }, [allUsers]);

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: '',
      content: '',
      targetGen: 'All',
    },
  });

  const onSubmit = (data: AnnouncementFormValues) => {
    addAnnouncement({
      ...data,
      author: user?.displayName || 'Teacher',
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
                name="targetGen"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Generation</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a generation" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableGens.map(gen => (
                          <SelectItem key={gen} value={gen}>{gen}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
