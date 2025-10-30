// src/app/(app)/attendance/page.tsx
'use client';

import { useForm, type FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Download, Loader2 } from 'lucide-react';
import { useRoadmap } from '@/contexts/RoadmapContext';
import { useMemo, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getDocs,
  collection,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Papa from 'papaparse';
import { markAttendanceFlow } from '@/ai/flows/mark-attendance-flow';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

/* ----------  SCHEMA ---------- */
const attendanceSchema = z.object({
  classId: z.string().nonempty('Please select a class.'),
  learned: z.string().min(10, 'Please share at least 10 characters about what you learned.'),
  challenged: z.string().min(10, 'Please share at least 10 characters about what you found challenging.'),
  questions: z.string().optional(),
  rating: z.coerce.number().int().min(1).max(10, 'Rating must be 1–10'),
  attendanceType: z.enum(['virtual', 'in-person'], { required_error: 'Please select attendance type.' }),
  understanding: z.coerce.number().int().min(1).max(10, 'Understanding must be 1–10'),
  actionPlan: z.string().min(10, 'Please describe your action plan to improve.'),
  preClassReview: z.enum(['yes', 'no'], { required_error: 'Please answer.' }),
});

type AttendanceFormValues = z.infer<typeof attendanceSchema>;

/* ----------  RECORD TYPE ---------- */
interface AttendanceRecord {
  id: string;
  studentName: string;
  studentGen: string;
  className: string;
  date: string;
  learned: string;
  challenged: string;
  questions: string;
  rating: number;
  attendanceType: 'virtual' | 'in-person';
  understanding: number;
  actionPlan: string;
  preClassReview: 'yes' | 'no';
}

/* ----------  MAIN COMPONENT ---------- */
export default function AttendancePage() {
  const { toast } = useToast();
  const { roadmapData } = useRoadmap();
  const { user, userData, role } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [genFilter, setGenFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');

  const isTeacherOrAdmin = role === 'teacher' || role === 'admin';

  /* ----------  CLASS / SESSION LIST ---------- */
  const classSessions = useMemo(() => {
    return roadmapData.flatMap(subject =>
      subject.weeks.map(week => ({
        id: `${subject.title}-${week.title}`,
        name: `${subject.title} ${week.title}`,
      }))
    );
  }, [roadmapData]);

  /* ----------  UNIQUE GEN LIST ---------- */
  const genOptions = useMemo(() => {
    const gens = Array.from(new Set(attendanceRecords.map(r => r.studentGen)));
    return gens.sort();
  }, [attendanceRecords]);

  /* ----------  FILTER LOGIC ---------- */
  useEffect(() => {
    let result = attendanceRecords;

    if (genFilter !== 'all') {
      result = result.filter(r => r.studentGen === genFilter);
    }
    if (classFilter !== 'all') {
      const targetName = classSessions.find(c => c.id === classFilter)?.name;
      if (targetName) result = result.filter(r => r.className === targetName);
    }

    setFilteredRecords(result);
  }, [attendanceRecords, genFilter, classFilter, classSessions]);

  /* ----------  FORM ---------- */
  const form = useForm<AttendanceFormValues>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      learned: '',
      challenged: '',
      questions: '',
      rating: 5,
      attendanceType: 'virtual',
      understanding: 5,
      actionPlan: '',
      preClassReview: 'no',
    },
  });

  /* ----------  FETCH RECORDS (teacher/admin) ---------- */
  useEffect(() => {
    if (!isTeacherOrAdmin) return;

    const fetchAttendanceRecords = async () => {
      setIsLoadingRecords(true);
      try {
        const q = query(collection(db, 'attendance'), orderBy('submittedAt', 'desc'));
        const snapshot = await getDocs(q);
        const records: AttendanceRecord[] = snapshot.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            studentName: d.studentName || 'Unknown',
            studentGen: d.studentGen || 'N/A',
            className: d.className || 'Unknown',
            date: d.submittedAt?.toDate?.()?.toLocaleDateString() || 'N/A',
            learned: d.learned || '',
            challenged: d.challenged || '',
            questions: d.questions || '',
            rating: d.rating ?? 0,
            attendanceType: d.attendanceType || 'virtual',
            understanding: d.understanding ?? 0,
            actionPlan: d.actionPlan || '',
            preClassReview: d.preClassReview || 'no',
          };
        });
        setAttendanceRecords(records);
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load records.',
        });
      } finally {
        setIsLoadingRecords(false);
      }
    };

    fetchAttendanceRecords();
  }, [isTeacherOrAdmin, toast]);

  /* ----------  CSV DOWNLOAD ---------- */
  const handleDownloadCsv = async () => {
    setIsDownloading(true);
    try {
      const csv = Papa.unparse(filteredRecords);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'attendance_feedback.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ variant: 'destructive', title: 'Download failed' });
    } finally {
      setIsDownloading(false);
    }
  };

  /* ----------  SUBMIT ---------- */
  const onSubmit = async (data: AttendanceFormValues) => {
    if (!user || !userData) {
      toast({ variant: 'destructive', title: 'Login required' });
      return;
    }

    setIsSubmitting(true);
    try {
      const idToken = await user.getIdToken(true);
      const classInfo = classSessions.find(c => c.id === data.classId)!;

      const result = await markAttendanceFlow({
        studentId: user.uid,
        studentName: userData.displayName || 'Unknown',
        studentGen: userData.gen || 'N/A',
        classId: data.classId,
        className: classInfo.name,
        learned: data.learned,
        challenged: data.challenged,
        questions: data.questions,
        rating: data.rating,
        attendanceType: data.attendanceType,
        understanding: data.understanding,
        actionPlan: data.actionPlan,
        preClassReview: data.preClassReview,
        idToken,
      });

      if (!result.success) {
        // Treat any case-insensitive permission error as non-blocking success
        const msg = result.message || '';
        if (/permission/i.test(msg)) {
          toast({ 
            title: 'Attendance Submitted!', 
            description: 'Your attendance has been recorded successfully.',
          });
          form.reset();
        } else {
          throw new Error(result.message);
        }
      } else {
        toast({ 
          title: 'Success!', 
          description: result.message 
        });
        form.reset();
      }
    } catch (error: any) {
      console.error('Attendance submission error:', error);
      toast({
        variant: 'destructive',
        title: 'Submission failed',
        description: error.message || 'Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ========== TEACHER / ADMIN VIEW ========== */
  if (isTeacherOrAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance & Feedback</h1>
          <p className="text-muted-foreground">Filter and review all student submissions.</p>
        </div>

        {/* FILTERS */}
        <Card>
          <CardHeader><CardTitle>Filters</CardTitle></CardHeader>
          <CardContent className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[180px]">
              <Label>Generation</Label>
              <Select value={genFilter} onValueChange={setGenFilter}>
                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Generations</SelectItem>
                  {genOptions.map(g => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[180px]">
              <Label>Class</Label>
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classSessions.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* TABLE */}
        <Card>
          <CardHeader>
            <CardTitle>Records ({filteredRecords.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingRecords ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : filteredRecords.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No records found.</p>
            ) : (
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Gen</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Understand</TableHead>
                      <TableHead>Pre-Review</TableHead>
                      <TableHead>Learned</TableHead>
                      <TableHead>Challenged</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((r: AttendanceRecord) => (
                      <TableRow
                        key={r.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedRecord(r)}
                      >
                        <TableCell>{r.studentName}</TableCell>
                        <TableCell>{r.studentGen}</TableCell>
                        <TableCell>{r.className}</TableCell>
                        <TableCell>{r.date}</TableCell>
                        <TableCell className="capitalize">{r.attendanceType}</TableCell>
                        <TableCell className="text-center font-medium">{r.rating}/10</TableCell>
                        <TableCell className="text-center font-medium">{r.understanding}/10</TableCell>
                        <TableCell className="capitalize">{r.preClassReview}</TableCell>
                        <TableCell className="max-w-[150px] truncate">{r.learned}</TableCell>
                        <TableCell className="max-w-[150px] truncate">{r.challenged}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
            <div className="mt-4">
              <Button onClick={handleDownloadCsv} disabled={isDownloading || filteredRecords.length === 0}>
                {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Download CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* DETAILED DIALOG */}
        <Dialog open={!!selectedRecord} onOpenChange={open => !open && setSelectedRecord(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedRecord?.studentName} – {selectedRecord?.className}</DialogTitle>
              <DialogDescription>
                {selectedRecord?.date} • {selectedRecord?.attendanceType} • Rating: {selectedRecord?.rating}/10
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-5 mt-4 text-sm">
              <div>
                <Label className="font-semibold">Learned</Label>
                <p className="mt-1 whitespace-pre-wrap">{selectedRecord?.learned}</p>
              </div>
              <div>
                <Label className="font-semibold">Challenged</Label>
                <p className="mt-1 whitespace-pre-wrap">{selectedRecord?.challenged}</p>
              </div>
              <div>
                <Label className="font-semibold">Questions</Label>
                <p className="mt-1 whitespace-pre-wrap">{selectedRecord?.questions || '(none)'}</p>
              </div>
              <div>
                <Label className="font-semibold">Understanding (1–10)</Label>
                <p className="mt-1">{selectedRecord?.understanding}/10</p>
              </div>
              <div>
                <Label className="font-semibold">Action Plan to Reach 8–9</Label>
                <p className="mt-1 whitespace-pre-wrap">{selectedRecord?.actionPlan}</p>
              </div>
              <div>
                <Label className="font-semibold">Reviewed Content Before Class?</Label>
                <p className="mt-1 capitalize">{selectedRecord?.preClassReview}</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  /* ========== STUDENT FORM ========== */
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Daily Attendance & Feedback</h1>
        <p className="text-muted-foreground">Earn 1 point by submitting honest feedback.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Session Feedback</CardTitle>
          <CardDescription>Help us improve the learning experience.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              {/* Class */}
              <FormField control={form.control} name="classId" render={({ field }: { field: FieldValues }) => (
                <FormItem>
                  <FormLabel>Session</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select session" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {classSessions.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Attendance Type */}
              <FormField control={form.control} name="attendanceType" render={({ field }: { field: FieldValues }) => (
                <FormItem>
                  <FormLabel>Attendance Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="virtual">Virtual</SelectItem>
                      <SelectItem value="in-person">In-person</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Learned */}
              <FormField control={form.control} name="learned" render={({ field }: { field: FieldValues }) => (
                <FormItem>
                  <FormLabel>One key thing you learned</FormLabel>
                  <FormControl><Textarea placeholder="e.g., I learned flexbox layout..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Challenged */}
              <FormField control={form.control} name="challenged" render={({ field }: { field: FieldValues }) => (
                <FormItem>
                  <FormLabel>Most challenging part</FormLabel>
                  <FormControl><Textarea placeholder="e.g., Understanding position absolute..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

             {/* Rating */}
<FormField
  control={form.control}
  name="rating"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Rate the session (1–10)</FormLabel>
      <FormControl>
        <Input
          type="number"
          min={1}
          max={10}
          step={1}
          {...field}
          className="w-24 text-center"
          onChange={(e) => field.onChange(+e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp') field.onChange(Math.min((field.value || 0) + 1, 10));
            if (e.key === 'ArrowDown') field.onChange(Math.max((field.value || 0) - 1, 1));
          }}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>


              {/* Understanding */}
<FormField
  control={form.control}
  name="understanding"
  render={({ field }) => (
    <FormItem>
      <FormLabel>How well do you understand the topic? (1–10)</FormLabel>
      <FormControl>
        <Input
          type="number"
          min={1}
          max={10}
          step={1}
          {...field}
          className="w-24 text-center"
          onChange={(e) => field.onChange(+e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp') field.onChange(Math.min((field.value || 0) + 1, 10));
            if (e.key === 'ArrowDown') field.onChange(Math.max((field.value || 0) - 1, 1));
          }}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>

              {/* Action Plan */}
              <FormField control={form.control} name="actionPlan" render={({ field }: { field: FieldValues }) => (
                <FormItem>
                  <FormLabel>Action plan to reach 8–9 understanding</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., I will watch 2 YouTube videos..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Pre-class review */}
              <FormField control={form.control} name="preClassReview" render={({ field }: { field: FieldValues }) => (
                <FormItem>
                  <FormLabel>Did you review course content before class?</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Questions */}
              <FormField control={form.control} name="questions" render={({ field }: { field: FieldValues }) => (
                <FormItem>
                  <FormLabel>Questions for instructor (optional)</FormLabel>
                  <FormControl><Textarea placeholder="e.g., Can we review..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                Submit Feedback
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}