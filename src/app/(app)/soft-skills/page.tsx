// src/app/(app)/soft-skills/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Award, Calendar, CheckCircle, Circle, Plus, Loader2, TrendingUp, Trophy, Briefcase, Users
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useForm, type FieldValues } from 'react-hook-form';
import { formatDistanceToNow } from 'date-fns';

import {
  getStudentReport,
  updateCareerModule,
  addEvent,
  markEventAttendance,
  addAttendanceRecord,
  addInternshipApplication,
  addOneOnOneSession,
  StudentReport,
  Event
} from '@/services/student-reports';

export default function SoftSkillsPage() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [report, setReport] = useState<StudentReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const isStaff = role === 'teacher' || role === 'admin';

  // Event Dialog
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');

  // Attendance Dialog
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);

  // Attendance Form
  const form = useForm<FieldValues>({
    defaultValues: {},
  });

  useEffect(() => {
    if (user) loadReport();
  }, [user]);

  const loadReport = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const studentReport = await getStudentReport(user.uid);
      setReport(studentReport);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load report' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = async () => {
    if (!eventName || !eventDate) return;
    setSubmitting(true);
    try {
      await addEvent({ name: eventName, date: eventDate });
      toast({ title: 'Success', description: 'Event added' });
      setEventName('');
      setEventDate('');
      setEventDialogOpen(false);
      await loadReport();
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to add event' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkAttendance = async (event: Event) => {
    setAttendanceDialogOpen(true);
  };

  const onSubmitAttendance = async (data: FieldValues) => {
    if (!user) return;
    setSubmitting(true);
    try {
      const records = report!.careerModules.modules.map((module, idx) => ({
        moduleName: module.name,
        attended: data[`topic${idx}`] === 'Yes',
        learned: data[`learned${idx}`] || '',
        challenged: data[`challenged${idx}`] || '',
        rating: Number(data[`rating${idx}`] || 0),
      }));

      await addAttendanceRecord(user.uid, records);
      toast({ title: 'Attendance Submitted', description: 'Your attendance was recorded successfully' });
      setAttendanceDialogOpen(false);
      form.reset();
      await loadReport();
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to submit attendance' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">No data available</p>
      </div>
    );
  }

  /** ------------------ Calculate points ------------------ **/
  const careerModulePoints = report.careerModules.modules.reduce((sum, m) => sum + (m.completed ? 2 : 0), 0); // 10 max
  const eventPoints = Math.min(report.eventsWorkshops.eventsAttended || 0, 12); // 12 max
  const internshipPoints = Math.min(report.internshipApplications.length, 24); // 24 max
  const sessionPoints = Math.min(report.oneOnOneSessions.length, 24); // 24 max

  const totalPoints = careerModulePoints + eventPoints + internshipPoints + sessionPoints; // 70
  const overallPercentage = Math.round((totalPoints / 70) * 100);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between space-y-1">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Soft Skills & Career Development</h1>
          <p className="text-muted-foreground">Track progress in modules, events, applications, and sessions</p>
        </div>
        <div className="flex gap-2">
          {!isStaff && (
            <Button onClick={() => setAttendanceDialogOpen(true)}>Mark Attendance</Button>
          )}
          {isStaff && (
            <Button onClick={() => setAttendanceDialogOpen(true)}>View Attendance</Button>
          )}
        </div>
      </div>

      {/* Overall Progress */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-blue-600" />
            Overall Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Points Earned</p>
              <p className="text-3xl font-bold text-blue-600">{totalPoints}/70</p>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                overallPercentage >= 75 ? 'bg-green-100 text-green-700' :
                overallPercentage >= 50 ? 'bg-yellow-100 text-yellow-700' :
                'bg-orange-100 text-orange-700'
              }`}>
                <TrendingUp className="h-5 w-5" />
                <span className="font-bold">{overallPercentage}%</span>
              </div>
            </div>
          </div>
          <Progress value={overallPercentage} className="h-3" />
        </CardContent>
      </Card>

      {/* Career Modules */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-purple-600" />
                Career Modules
              </CardTitle>
              <CardDescription>
                Complete 5 modules • 2 points each • Total 10 points
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-purple-600">{careerModulePoints}/10</p>
              <p className="text-sm text-gray-600">{report.careerModules.modules.filter(m => m.completed).length}/5 completed</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {report.careerModules.modules.map((module, i) => (
              <div key={i} className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                module.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200 hover:border-purple-200'
              }`}>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateCareerModule(user!.uid, module.name, !module.completed).then(loadReport)}
                    disabled={!isStaff || submitting}
                    className="disabled:opacity-50"
                  >
                    {module.completed ? <CheckCircle className="h-6 w-6 text-green-600" /> : <Circle className="h-6 w-6 text-gray-400" />}
                  </button>
                  <div>
                    <p className="font-medium">{module.name}</p>
                    {module.completed && module.completedAt && (
                      <p className="text-xs text-gray-500">
                        Completed {formatDistanceToNow(module.completedAt.toDate(), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </div>
                <Badge variant={module.completed ? 'default' : 'outline'}>2 pts</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Events */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Events & Workshops
            </CardTitle>
            <CardDescription>Attend at least 12 events/year</CardDescription>
          </div>
          {isStaff && (
            <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Event
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Event</DialogTitle>
                  <DialogDescription>Add new event/workshop</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="eventName">Event Name</Label>
                    <Input id="eventName" value={eventName} onChange={e => setEventName(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="eventDate">Date</Label>
                    <Input type="date" id="eventDate" value={eventDate} onChange={e => setEventDate(e.target.value)} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEventDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddEvent} disabled={submitting || !eventName || !eventDate}>
                    {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Add Event
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          <p className="font-medium">{eventPoints}/12 events attended</p>
        </CardContent>
      </Card>

      {/* Internships & Applications */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-green-600" />
              Internship & Job Applications
            </CardTitle>
            <CardDescription>Apply to 2 per month (24/year)</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <p className="font-medium">{internshipPoints}/24 applications submitted</p>
        </CardContent>
      </Card>

      {/* One-on-One Sessions */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" />
              One-on-One Sessions
            </CardTitle>
            <CardDescription>Attend 2 per month (24/year)</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <p className="font-medium">{sessionPoints}/24 sessions attended</p>
        </CardContent>
      </Card>
    </div>
  );
}
