// src/components/projects/CreateProjectDialog.tsx
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
import {useProjects} from '@/contexts/ProjectsContext';
import {useAuth, UserData} from '@/contexts/AuthContext';
import {useToast} from '@/hooks/use-toast';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const projectSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters long.'),
  description: z.string().min(10, 'Description must be at least 10 characters long.'),
  targetGen: z.string().nonempty('Please select a target audience.'),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

interface CreateProjectDialogProps {
  children: ReactNode;
}

export function CreateProjectDialog({children}: CreateProjectDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {addProject} = useProjects();
  const {toast} = useToast();
  const {user, fetchAllUsers} = useAuth();
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const loadUsers = async () => {
        setLoadingUsers(true);
        const users = await fetchAllUsers();
        setAllUsers(users);
        setLoadingUsers(false);
      };
      loadUsers();
    }
  }, [isOpen, fetchAllUsers]);

  const availableGens = useMemo(() => {
    const studentGens = allUsers
      .filter(u => u.role === 'student' && u.gen)
      .map(u => u.gen!);
    return [...new Set(studentGens)].sort();
  }, [allUsers]);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: '',
      description: '',
      targetGen: 'All Students',
    },
  });

  const onSubmit = async (data: ProjectFormValues) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await addProject({
        ...data,
        authorId: user.uid,
      });
      toast({
        title: 'Project Created',
        description: 'Your project has been posted.',
      });
      form.reset();
      setIsOpen(false);
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create project. You may not have permission.',
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
          <DialogTitle>Create a New Project</DialogTitle>
          <DialogDescription>
            This project will be visible to the selected audience.
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
                    <Input placeholder="e.g., E-commerce Website" {...field} />
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
                    <FormLabel>Target Audience</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loadingUsers}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an audience" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectGroup>
                           <SelectItem value="Everyone">Everyone (incl. Staff)</SelectItem>
                           <SelectItem value="All Students">All Students</SelectItem>
                        </SelectGroup>
                        <SelectGroup>
                           {availableGens.map(gen => (
                            <SelectItem key={gen} value={gen}>{gen}</SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <FormField
              control={form.control}
              name="description"
              render={({field}) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Provide the requirements for the project here..." {...field} />
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
                Create
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
