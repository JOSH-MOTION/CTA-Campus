// src/components/exercises/CreateExerciseDialog.tsx
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
import {useExercises} from '@/contexts/ExercisesContext';
import {useAuth, UserData} from '@/contexts/AuthContext';
import {useToast} from '@/hooks/use-toast';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const exerciseSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters long.'),
  description: z.string().min(10, 'Description must be at least 10 characters long.'),
  targetGen: z.string().nonempty('Please select a target audience.'),
});

type ExerciseFormValues = z.infer<typeof exerciseSchema>;

interface CreateExerciseDialogProps {
  children: ReactNode;
}

export function CreateExerciseDialog({children}: CreateExerciseDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {addExercise} = useExercises();
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

  const form = useForm<ExerciseFormValues>({
    resolver: zodResolver(exerciseSchema),
    defaultValues: {
      title: '',
      description: '',
      targetGen: 'All Students',
    },
  });

  const onSubmit = async (data: ExerciseFormValues) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await addExercise({
        ...data,
        authorId: user.uid,
      });
      toast({
        title: 'Exercise Created',
        description: 'Your exercise has been posted.',
      });
      form.reset();
      setIsOpen(false);
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create exercise. You may not have permission.',
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
          <DialogTitle>Create a New Exercise</DialogTitle>
          <DialogDescription>
            This exercise will be visible to the selected audience.
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
                    <Input placeholder="e.g., Flexbox Fundamentals" {...field} />
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
                    <Textarea placeholder="Provide the instructions for the exercise here..." {...field} />
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
