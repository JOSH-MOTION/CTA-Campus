// src/components/assignments/CreateAssignmentDialog.tsx
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
import {useAssignments} from '@/contexts/AssignmentsContext';
import {useToast} from '@/hooks/use-toast';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover';
import {cn} from '@/lib/utils';
import {CalendarIcon} from 'lucide-react';
import {format} from 'date-fns';
import {Calendar} from '@/components/ui/calendar';
import {useAuth, UserData} from '@/contexts/AuthContext';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';

const assignmentSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters long.'),
  description: z.string().min(10, 'Description must be at least 10 characters long.'),
  dueDate: z.date({
    required_error: 'A due date is required.',
  }),
  targetGen: z.string().nonempty('Please select a target generation.'),
});

type AssignmentFormValues = z.infer<typeof assignmentSchema>;

interface CreateAssignmentDialogProps {
  children: ReactNode;
}

export function CreateAssignmentDialog({children}: CreateAssignmentDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const {addAssignment} = useAssignments();
  const {toast} = useToast();
  const {fetchAllUsers} = useAuth();
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

  const form = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      title: '',
      description: '',
      targetGen: 'All',
    },
  });

  const onSubmit = (data: AssignmentFormValues) => {
    addAssignment(data);
    toast({
      title: 'Assignment Created',
      description: 'Your new assignment has been posted.',
    });
    form.reset();
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a New Assignment</DialogTitle>
          <DialogDescription>Fill in the details for the new assignment.</DialogDescription>
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
                    <Input placeholder="e.g., History Essay on Roman Empire" {...field} />
                  </FormControl>
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
                    <Textarea placeholder="Provide detailed instructions for the assignment..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="dueDate"
                render={({field}) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={date => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="targetGen"
                render={({field}) => (
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
                          <SelectItem key={gen} value={gen}>
                            {gen}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
