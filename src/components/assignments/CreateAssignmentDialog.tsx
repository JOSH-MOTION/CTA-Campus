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
import {useForm, useFieldArray} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form';
import {useAssignments} from '@/contexts/AssignmentsContext';
import {useToast} from '@/hooks/use-toast';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover';
import {cn} from '@/lib/utils';
import {CalendarIcon, Clock, Loader2} from 'lucide-react';
import {format} from 'date-fns';
import {Calendar} from '@/components/ui/calendar';
import {useAuth, UserData} from '@/contexts/AuthContext';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup} from '@/components/ui/select';
import {Checkbox} from '@/components/ui/checkbox';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const assignmentSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters long.'),
  description: z.string().min(10, 'Description must be at least 10 characters long.'),
  targetGen: z.string().nonempty('Please select a target audience.'),
  dueDates: z.array(z.object({
      day: z.string(),
      enabled: z.boolean(),
      date: z.date().optional(),
      time: z.string().optional(),
  })),
});

type AssignmentFormValues = z.infer<typeof assignmentSchema>;

interface CreateAssignmentDialogProps {
  children: ReactNode;
}

const timeSlots = Array.from({ length: 24 * 2 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = i % 2 === 0 ? '00' : '30';
    const formattedHour = hour.toString().padStart(2, '0');
    return `${formattedHour}:${minute}`;
});


export function CreateAssignmentDialog({children}: CreateAssignmentDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {addAssignment} = useAssignments();
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

  const form = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      title: '',
      description: '',
      targetGen: 'All Students',
      dueDates: daysOfWeek.map(day => ({
        day,
        enabled: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(day),
        date: undefined,
        time: '17:00'
      }))
    },
  });

  const { fields } = useFieldArray({
      control: form.control,
      name: "dueDates",
  });

  const onSubmit = async (data: AssignmentFormValues) => {
    if (!user) return;
    setIsSubmitting(true);
    const activeDueDates = data.dueDates
        .filter(d => d.enabled && d.date && d.time)
        .map(d => {
            const date = new Date(d.date!);
            const [hours, minutes] = d.time!.split(':').map(Number);
            date.setHours(hours, minutes);
            return { day: d.day, dateTime: date.toISOString() };
        });

    try {
        await addAssignment({
          title: data.title,
          description: data.description,
          targetGen: data.targetGen,
          authorId: user.uid,
          dueDates: activeDueDates,
        });
        toast({
          title: 'Assignment Created',
          description: 'Your new assignment has been posted.',
        });
        form.reset();
        setIsOpen(false);
    } catch(error) {
         toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to create assignment. You may not have permission.",
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create a New Assignment</DialogTitle>
          <DialogDescription>Fill in the details for the new assignment.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                name="targetGen"
                render={({field}) => (
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
            </div>
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
            
            <div className="space-y-4 rounded-md border p-4">
                <FormLabel>Due Dates (Optional)</FormLabel>
                <FormMessage>{form.formState.errors.dueDates?.message}</FormMessage>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {fields.map((field, index) => {
                    const isEnabled = form.watch(`dueDates.${index}.enabled`);
                    return (
                        <div key={field.id} className="space-y-2 rounded-lg p-3"
                             style={{
                                 backgroundColor: isEnabled ? 'hsl(var(--muted))' : 'transparent',
                                 opacity: isEnabled ? 1 : 0.6
                             }}>
                            <FormField
                                control={form.control}
                                name={`dueDates.${index}.enabled`}
                                render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                    <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                    </FormControl>
                                    <FormLabel className="text-base font-semibold">
                                        {daysOfWeek[index]}
                                    </FormLabel>
                                </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-2 pl-6">
                            <FormField
                                control={form.control}
                                name={`dueDates.${index}.date`}
                                render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                        <Button
                                            variant={'outline'}
                                            disabled={!isEnabled}
                                            className={cn(
                                            'w-full pl-3 text-left font-normal bg-background',
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
                                        disabled={(date) => date < new Date()}
                                        initialFocus
                                        />
                                    </PopoverContent>
                                    </Popover>
                                </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name={`dueDates.${index}.time`}
                                render={({ field }) => (
                                    <FormItem>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isEnabled}>
                                        <FormControl>
                                            <SelectTrigger className="bg-background">
                                                <Clock className="mr-2 h-4 w-4" />
                                                <SelectValue placeholder="Time" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {timeSlots.map(time => (
                                            <SelectItem key={time} value={time}>{time}</SelectItem>
                                            ))}
                                        </SelectContent>
                                        </Select>
                                    </FormItem>
                                )}
                                />
                            </div>
                        </div>
                    )
                })}
                </div>
            </div>

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
