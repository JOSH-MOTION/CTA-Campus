// src/app/(app)/soft-skills/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Award, 
  Calendar, 
  Briefcase, 
  Users, 
  CheckCircle, 
  Circle, 
  Plus,
  Loader2,
  TrendingUp,
  Target,
  Trophy,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  getStudentReport,
  updateCareerModule,
  addEventAttendance,
  addInternshipApplication,
  addOneOnOneSession,
  StudentReport,
} from '@/services/student-reports';
import { formatDistanceToNow } from 'date-fns';

export default function SoftSkillsPage() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [report, setReport] = useState<StudentReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Dialog states
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [applicationDialogOpen, setApplicationDialogOpen] = useState(false);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);

  // Form states
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  
  const [company, setCompany] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [applicationDate, setApplicationDate] = useState('');
  const [applicationStatus, setApplicationStatus] = useState<'Pending' | 'Interview' | 'Rejected' | 'Accepted'>('Pending');
  
  const [sessionWith, setSessionWith] = useState('');
  const [sessionTopic, setSessionTopic] = useState('');
  const [sessionDate, setSessionDate] = useState('');

  const isStaff = role === 'teacher' || role === 'admin';

  useEffect(() => {
    if (user) {
      loadReport();
    }
  }, [user]);

  const loadReport = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const studentReport = await getStudentReport(user.uid);
      setReport(studentReport);
    } catch (error) {
      console.error('Error loading report:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load your soft skills progress'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleModuleToggle = async (moduleName: string, currentStatus: boolean) => {
    if (!user || !report) return;
    
    setSubmitting(true);
    try {
      await updateCareerModule(user.uid, moduleName, !currentStatus);
      await loadReport();
      
      toast({
        title: 'Success',
        description: `Module ${!currentStatus ? 'completed' : 'uncompleted'}`
      });
    } catch (error) {
      console.error('Error updating module:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update module'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddEvent = async () => {
    if (!user || !eventName || !eventDate) return;
    
    setSubmitting(true);
    try {
      await addEventAttendance(user.uid, {
        name: eventName,
        date: eventDate,
      });
      await loadReport();
      
      setEventDialogOpen(false);
      setEventName('');
      setEventDate('');
      
      toast({
        title: 'Success',
        description: 'Event attendance recorded'
      });
    } catch (error) {
      console.error('Error adding event:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add event'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddApplication = async () => {
    if (!user || !company || !jobRole || !applicationDate) return;
    
    setSubmitting(true);
    try {
      await addInternshipApplication(user.uid, {
        company,
        role: jobRole,
        date: applicationDate,
        status: applicationStatus,
      });
      await loadReport();
      
      setApplicationDialogOpen(false);
      setCompany('');
      setJobRole('');
      setApplicationDate('');
      setApplicationStatus('Pending');
      
      toast({
        title: 'Success',
        description: 'Application recorded'
      });
    } catch (error) {
      console.error('Error adding application:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add application'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddSession = async () => {
    if (!user || !sessionWith || !sessionTopic || !sessionDate) return;
    
    setSubmitting(true);
    try {
      await addOneOnOneSession(user.uid, {
        with: sessionWith,
        topic: sessionTopic,
        date: sessionDate,
      });
      await loadReport();
      
      setSessionDialogOpen(false);
      setSessionWith('');
      setSessionTopic('');
      setSessionDate('');
      
      toast({
        title: 'Success',
        description: 'Session recorded'
      });
    } catch (error) {
      console.error('Error adding session:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add session'
      });
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

  // Calculate total points (only from career modules)
  const careerModulePoints = report.careerModules.completed * 2; // 2 points per module
  const totalEarnedPoints = careerModulePoints;
  const totalPossiblePoints = 10; // 5 modules × 2 points
  const overallPercentage = Math.round((totalEarnedPoints / totalPossiblePoints) * 100);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Soft Skills & Career Development</h1>
        <p className="text-muted-foreground">
          Track your progress in career modules, events, applications, and mentorship sessions.
        </p>
      </div>

      {/* Overall Progress */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-blue-600" />
            Career Module Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Points Earned</p>
              <p className="text-3xl font-bold text-blue-600">{totalEarnedPoints}/{totalPossiblePoints}</p>
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
          <p className="text-xs text-muted-foreground">
            Complete all 5 career modules to earn 10 points
          </p>
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
                Complete 5 career development modules • 2 points each • Total: 10 points
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-purple-600">{careerModulePoints}/10</p>
              <p className="text-sm text-gray-600">{report.careerModules.completed}/5 completed</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {report.careerModules.modules.slice(0, 5).map((module, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                  module.completed 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-gray-50 border-gray-200 hover:border-purple-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleModuleToggle(module.name, module.completed)}
                    disabled={submitting || !isStaff}
                    className="disabled:opacity-50"
                  >
                    {module.completed ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <Circle className="h-6 w-6 text-gray-400" />
                    )}
                  </button>
                  <div>
                    <p className={`font-medium ${module.completed ? 'text-gray-900' : 'text-gray-600'}`}>
                      {module.name}
                    </p>
                    {module.completed && module.completedAt && (
                      <p className="text-xs text-gray-500">
                        Completed {formatDistanceToNow(module.completedAt.toDate(), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </div>
                <Badge variant={module.completed ? 'default' : 'outline'}>
                  2 pts
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Events & Workshops (No Points) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Events & Workshops
              </CardTitle>
              <CardDescription>
                Attend 12 events per year • No points, tracking only
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">{report.eventsWorkshops.attended}/12</p>
                <p className="text-sm text-gray-600">events attended</p>
              </div>
              <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Event
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Record Event Attendance</DialogTitle>
                    <DialogDescription>
                      Add an event or workshop you attended
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="eventName">Event Name</Label>
                      <Input
                        id="eventName"
                        value={eventName}
                        onChange={(e) => setEventName(e.target.value)}
                        placeholder="e.g., Tech Talk: AI in Web Dev"
                      />
                    </div>
                    <div>
                      <Label htmlFor="eventDate">Date</Label>
                      <Input
                        id="eventDate"
                        type="date"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setEventDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddEvent} disabled={submitting || !eventName || !eventDate}>
                      {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Add Event
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {report.eventsWorkshops.events.length > 0 ? (
              report.eventsWorkshops.events.map((event, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <Calendar className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{event.name}</p>
                    <p className="text-sm text-gray-600">{new Date(event.date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">No events recorded yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Internship Applications (No Points) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-orange-600" />
                Internship & Job Applications
              </CardTitle>
              <CardDescription>
                Apply to 24 positions per year (2 per month) • No points, tracking only
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-2xl font-bold text-orange-600">{report.internshipApplications.submitted}/24</p>
                <p className="text-sm text-gray-600">applications submitted</p>
              </div>
              <Dialog open={applicationDialogOpen} onOpenChange={setApplicationDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Application
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Record Job Application</DialogTitle>
                    <DialogDescription>
                      Add an internship or job application you submitted
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="company">Company Name</Label>
                      <Input
                        id="company"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="e.g., Tech Corp"
                      />
                    </div>
                    <div>
                      <Label htmlFor="jobRole">Role/Position</Label>
                      <Input
                        id="jobRole"
                        value={jobRole}
                        onChange={(e) => setJobRole(e.target.value)}
                        placeholder="e.g., Frontend Developer Intern"
                      />
                    </div>
                    <div>
                      <Label htmlFor="applicationDate">Application Date</Label>
                      <Input
                        id="applicationDate"
                        type="date"
                        value={applicationDate}
                        onChange={(e) => setApplicationDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select value={applicationStatus} onValueChange={(value: any) => setApplicationStatus(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Interview">Interview</SelectItem>
                          <SelectItem value="Accepted">Accepted</SelectItem>
                          <SelectItem value="Rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setApplicationDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddApplication} disabled={submitting || !company || !jobRole || !applicationDate}>
                      {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Add Application
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {report.internshipApplications.applications.length > 0 ? (
              report.internshipApplications.applications.map((app, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{app.company}</p>
                    <p className="text-sm text-gray-600">{app.role}</p>
                    <p className="text-xs text-gray-500">{new Date(app.date).toLocaleDateString()}</p>
                  </div>
                  <Badge variant={
                    app.status === 'Accepted' || app.status === 'Interview' ? 'default' :
                    app.status === 'Pending' ? 'secondary' :
                    'outline'
                  }>
                    {app.status}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">No applications recorded yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* One-on-One Sessions (No Points) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                One-on-One Sessions
              </CardTitle>
              <CardDescription>
                Attend 24 sessions per year (2 per month) • No points, tracking only
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">{report.oneOnOneSessions.attended}/24</p>
                <p className="text-sm text-gray-600">sessions attended</p>
              </div>
              <Dialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Session
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Record One-on-One Session</DialogTitle>
                    <DialogDescription>
                      Add a mentorship or guidance session you attended
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="sessionWith">Session With</Label>
                      <Input
                        id="sessionWith"
                        value={sessionWith}
                        onChange={(e) => setSessionWith(e.target.value)}
                        placeholder="e.g., Mr. Mensah"
                      />
                    </div>
                    <div>
                      <Label htmlFor="sessionTopic">Topic</Label>
                      <Input
                        id="sessionTopic"
                        value={sessionTopic}
                        onChange={(e) => setSessionTopic(e.target.value)}
                        placeholder="e.g., Career Planning"
                      />
                    </div>
                    <div>
                      <Label htmlFor="sessionDate">Date</Label>
                      <Input
                        id="sessionDate"
                        type="date"
                        value={sessionDate}
                        onChange={(e) => setSessionDate(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setSessionDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddSession} disabled={submitting || !sessionWith || !sessionTopic || !sessionDate}>
                      {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Add Session
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {report.oneOnOneSessions.sessions.length > 0 ? (
              report.oneOnOneSessions.sessions.map((session, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                  <Users className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{session.topic}</p>
                    <p className="text-sm text-gray-600">with {session.with}</p>
                    <p className="text-xs text-gray-500">{new Date(session.date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">No sessions recorded yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}