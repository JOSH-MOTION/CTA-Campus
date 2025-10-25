// src/components/assignments/EditAssignmentDialog.tsx
'use client';

import {useState, type ReactNode, useEffect, useMemo} from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {useForm, useFieldArray} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form';
import {Assignment, useAssignments} from '@/contexts/AssignmentsContext';
import {useToast} from '@/hooks/use-toast';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover';
import {cn} from '@/lib/utils';
import {CalendarIcon, Clock, Loader2} from 'lucide-react';
import {format, parseISO} from 'date-fns';
import {Calendar} from '@/components/ui/calendar';
import {useAuth, UserData} from '@/contexts/AuthContext';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup} from '@/components/ui/select';
import {Checkbox} from '@/components/ui/checkbox';
import { useRoadmap } from '@/contexts/RoadmapContext';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const assignmentSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters long.'),
  description: z.string().min(10, 'Description must be at least 10 characters long.'),
  targetGen: z.string().nonempty('Please select a target audience.'),
  subject: z.string().nonempty('Please select a subject.'),
  week: z.string().nonempty('Please select a week.'),
  dueDates: z.array(z.object({
      day: z.string(),
      enabled: z.boolean(),
      date: z.date().optional(),
      time: z.string().optional(),
  })),
});

type AssignmentFormValues = z.infer<typeof assignmentSchema>;

interface EditAssignmentDialogProps {
  assignment: Assignment;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const timeSlots = Array.from({ length: 24 * 2 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = i % 2 === 0 ? '00' : '30';
    const formattedHour = hour.toString().padStart(2, '0');
    return `${formattedHour}:${minute}`;
});


export function EditAssignmentDialog({ assignment, isOpen, onOpenChange }: EditAssignmentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {updateAssignment} = useAssignments();
  const {toast} = useToast();
  const {fetchAllUsers} = useAuth();
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const { roadmapData } = useRoadmap();

  const subjectsWithWeeks = useMemo(() => roadmapData.filter(s => (s.weeks?.length || 0) > 0), [roadmapData]);

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
    values: {
        title: assignment.title,
        description: assignment.description,
        targetGen: assignment.targetGen,
        subject: assignment.subject || subjectsWithWeeks[0]?.title || '',
        week: assignment.week || subjectsWithWeeks[0]?.weeks?.[0]?.title || '',
        dueDates: daysOfWeek.map(day => {
            const existingDueDate = assignment.dueDates.find(d => d.day === day);
            if (existingDueDate) {
                const date = parseISO(existingDueDate.dateTime);
                return {
                    day,
                    enabled: true,
                    date: date,
                    time: format(date, 'HH:mm'),
                }
            }
            return { day, enabled: false, date: undefined, time: '17:00' };
        })
    }
  });

  const { fields } = useFieldArray({
      control: form.control,
      name: "dueDates",
  });

  const onSubmit = async (data: AssignmentFormValues) => {
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
        await updateAssignment(assignment.id, {
          title: data.title,
          description: data.description,
          targetGen: data.targetGen,
          authorId: assignment.authorId,
          subject: data.subject,
          week: data.week,
          dueDates: activeDueDates,
        });
        toast({
          title: 'Assignment Updated',
          description: 'The assignment has been successfully updated.',
        });
        form.reset();
        onOpenChange(false);
    } catch(error) {
         toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to update assignment. You may not have permission.",
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit Assignment</DialogTitle>
          <DialogDescription>Make changes to your existing assignment.</DialogDescription>
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <Select
                      onValueChange={(val) => {
                        field.onChange(val);
                        const found = subjectsWithWeeks.find(s => s.title === val);
                        const firstWeek = found?.weeks?.[0]?.title || '';
                        form.setValue('week', firstWeek);
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectGroup>
                          {subjectsWithWeeks.map(s => (
                            <SelectItem key={s.title} value={s.title}>{s.title}</SelectItem>
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
                name="week"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Week</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select week" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectGroup>
                          {(subjectsWithWeeks.find(s => s.title === form.watch('subject'))?.weeks || []).map((w) => (
                            <SelectItem key={w.title} value={w.title}>{w.title}</SelectItem>
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
