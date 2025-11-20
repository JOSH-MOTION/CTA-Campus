import React, { useState, useEffect } from 'react';
import { 
  Award, Calendar, CheckCircle, Circle, Plus, Loader2, TrendingUp, 
  Trophy, Briefcase, Users, ExternalLink, Clock, MapPin, Link as LinkIcon,
  Upload, FileText, X, Check, AlertCircle, GraduationCap, Target
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Mock user role - replace with actual auth context
const useAuth = () => ({ role: 'student', user: { uid: 'user1', displayName: 'John Doe' } });

// Career Module structure
const CAREER_MODULES = [
  { 
    id: 'cv-writing', 
    name: 'CV Writing Workshop', 
    description: 'Learn to craft an effective CV',
    link: 'https://example.com/cv-workshop',
    requiresApproval: false,
    points: 2
  },
  { 
    id: 'linkedin', 
    name: 'LinkedIn Profile Optimization', 
    description: 'Build a professional LinkedIn presence',
    link: 'https://example.com/linkedin',
    requiresApproval: true,
    points: 2
  },
  { 
    id: 'interview-prep', 
    name: 'Interview Preparation', 
    description: 'Master common interview questions',
    link: 'https://example.com/interview',
    requiresApproval: true,
    points: 2
  },
  { 
    id: 'portfolio', 
    name: 'Portfolio Building', 
    description: 'Create an impressive developer portfolio',
    link: 'https://example.com/portfolio',
    requiresApproval: true,
    points: 2
  },
  { 
    id: 'networking', 
    name: 'Networking Skills', 
    description: 'Build professional connections',
    link: 'https://example.com/networking',
    requiresApproval: true,
    points: 2
  }
];

const SoftSkillsPage = () => {
  const { role, user } = useAuth();
  const isStaff = role === 'teacher' || role === 'admin';
  
  // State
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Module submissions state
  const [moduleSubmissions, setModuleSubmissions] = useState([
    { id: 'sub1', moduleId: 'cv-writing', status: 'approved', submittedAt: new Date(), approvedAt: new Date() },
    { id: 'sub2', moduleId: 'linkedin', status: 'pending', submittedAt: new Date(), proofUrl: 'https://...' }
  ]);
  
  // Events state
  const [events, setEvents] = useState([
    { 
      id: 'event1', 
      name: 'Tech Career Fair 2024', 
      date: '2024-03-15', 
      type: 'in-person',
      location: 'Main Campus',
      description: 'Annual career fair with 50+ companies',
      link: null,
      attendees: 0
    },
    { 
      id: 'event2', 
      name: 'Resume Workshop', 
      date: '2024-03-20', 
      type: 'virtual',
      location: null,
      description: 'Learn to write effective resumes',
      link: 'https://zoom.us/j/123456',
      attendees: 0
    }
  ]);
  
  const [eventAttendance, setEventAttendance] = useState([
    { id: 'att1', eventId: 'event1', studentId: user.uid, status: 'approved', submittedAt: new Date() }
  ]);
  
  // Job applications state
  const [jobPosts, setJobPosts] = useState([
    {
      id: 'job1',
      title: 'Junior Frontend Developer',
      company: 'Tech Corp',
      type: 'internship',
      location: 'Remote',
      description: 'Seeking talented frontend developers',
      postedAt: new Date(),
      applicationUrl: 'https://techcorp.com/apply'
    }
  ]);
  
  const [applications, setApplications] = useState([
    {
      id: 'app1',
      jobId: 'job1',
      studentId: user.uid,
      status: 'pending',
      screenshotUrl: 'https://...',
      submittedAt: new Date(),
      notes: 'Applied via company website'
    }
  ]);
  
  // Sessions state
  const [sessions, setSessions] = useState([
    {
      id: 'sess1',
      studentId: user.uid,
      bookingLink: 'https://calendly.com/booking/abc123',
      scheduledDate: '2024-03-10',
      topic: 'Career planning discussion',
      status: 'completed',
      bookedAt: new Date(),
      completedAt: new Date()
    }
  ]);
  
  // Dialog states
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [eventAttendanceDialogOpen, setEventAttendanceDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [jobDialogOpen, setJobDialogOpen] = useState(false);
  const [applyJobDialogOpen, setApplyJobDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  
  // Calculate points
  const calculatePoints = () => {
    const modulePoints = moduleSubmissions.filter(s => s.status === 'approved').length * 2;
    const eventPoints = Math.min(eventAttendance.filter(a => a.status === 'approved').length, 12);
    const applicationPoints = Math.min(applications.filter(a => a.status === 'approved').length, 24);
    const sessionPoints = Math.min(sessions.filter(s => s.status === 'completed').length, 24);
    
    return {
      modules: { current: modulePoints, total: 10 },
      events: { current: eventPoints, total: 12 },
      applications: { current: applicationPoints, total: 24 },
      sessions: { current: sessionPoints, total: 24 },
      total: modulePoints + eventPoints + applicationPoints + sessionPoints,
      maxTotal: 70
    };
  };
  
  const points = calculatePoints();
  const overallPercentage = Math.round((points.total / points.maxTotal) * 100);
  
  // Get pending items for staff
  const pendingModules = moduleSubmissions.filter(s => s.status === 'pending');
  const pendingEvents = eventAttendance.filter(a => a.status === 'pending');
  const pendingApplications = applications.filter(a => a.status === 'pending');
  const pendingSessions = sessions.filter(s => s.status === 'pending');
  
  const totalPending = pendingModules.length + pendingEvents.length + 
                       pendingApplications.length + pendingSessions.length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Soft Skills & Career Development</h1>
          <p className="text-muted-foreground">Track your progress across all career development activities</p>
        </div>
        {isStaff && totalPending > 0 && (
          <Badge variant="destructive" className="text-lg px-4 py-2">
            {totalPending} Pending Approvals
          </Badge>
        )}
      </div>

      {/* Overall Progress Card */}
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
              <p className="text-3xl font-bold text-blue-600">{points.total}/{points.maxTotal}</p>
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
          
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white rounded-lg p-3 border">
              <div className="flex items-center gap-2 text-purple-600 mb-1">
                <GraduationCap className="h-4 w-4" />
                <span className="text-xs font-medium">Modules</span>
              </div>
              <p className="text-2xl font-bold">{points.modules.current}/{points.modules.total}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-xs font-medium">Events</span>
              </div>
              <p className="text-2xl font-bold">{points.events.current}/{points.events.total}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border">
              <div className="flex items-center gap-2 text-green-600 mb-1">
                <Briefcase className="h-4 w-4" />
                <span className="text-xs font-medium">Applications</span>
              </div>
              <p className="text-2xl font-bold">{points.applications.current}/{points.applications.total}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border">
              <div className="flex items-center gap-2 text-indigo-600 mb-1">
                <Users className="h-4 w-4" />
                <span className="text-xs font-medium">Sessions</span>
              </div>
              <p className="text-2xl font-bold">{points.sessions.current}/{points.sessions.total}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="modules">
            Modules {pendingModules.length > 0 && <Badge variant="destructive" className="ml-2">{pendingModules.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="events">
            Events {pendingEvents.length > 0 && <Badge variant="destructive" className="ml-2">{pendingEvents.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="applications">
            Applications {pendingApplications.length > 0 && <Badge variant="destructive" className="ml-2">{pendingApplications.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Career Modules Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-purple-600" />
                  Career Modules
                </CardTitle>
                <CardDescription>Complete 5 modules • 2 points each • Total 10 points</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-purple-600">{points.modules.current}/10</span>
                    <Badge variant="outline">{moduleSubmissions.filter(s => s.status === 'approved').length}/5 completed</Badge>
                  </div>
                  <Progress value={(points.modules.current / points.modules.total) * 100} className="h-2" />
                  <Button variant="outline" className="w-full" onClick={() => setActiveTab('modules')}>
                    View Modules <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Events Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Events & Workshops
                </CardTitle>
                <CardDescription>Attend 12 events/year • 1 point each</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-blue-600">{points.events.current}/12</span>
                    <Badge variant="outline">{eventAttendance.filter(a => a.status === 'approved').length} attended</Badge>
                  </div>
                  <Progress value={(points.events.current / points.events.total) * 100} className="h-2" />
                  <Button variant="outline" className="w-full" onClick={() => setActiveTab('events')}>
                    View Events <Calendar className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Applications Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-green-600" />
                  Job Applications
                </CardTitle>
                <CardDescription>Apply to 24 roles/year • 1 point each</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-green-600">{points.applications.current}/24</span>
                    <Badge variant="outline">{applications.filter(a => a.status === 'approved').length} approved</Badge>
                  </div>
                  <Progress value={(points.applications.current / points.applications.total) * 100} className="h-2" />
                  <Button variant="outline" className="w-full" onClick={() => setActiveTab('applications')}>
                    View Applications <Briefcase className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Sessions Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-600" />
                  One-on-One Sessions
                </CardTitle>
                <CardDescription>Attend 24 sessions/year • 1 point each</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-indigo-600">{points.sessions.current}/24</span>
                    <Badge variant="outline">{sessions.filter(s => s.status === 'completed').length} completed</Badge>
                  </div>
                  <Progress value={(points.sessions.current / points.sessions.total) * 100} className="h-2" />
                  <Button variant="outline" className="w-full" onClick={() => setSessionDialogOpen(true)}>
                    Book Session <Users className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Modules Tab */}
        <TabsContent value="modules" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Career Development Modules</CardTitle>
                  <CardDescription>Complete online modules and submit for approval</CardDescription>
                </div>
                <Badge className="text-lg px-4 py-2">
                  {moduleSubmissions.filter(s => s.status === 'approved').length}/5 Completed
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {CAREER_MODULES.map((module, index) => {
                  const submission = moduleSubmissions.find(s => s.moduleId === module.id);
                  const isCompleted = submission?.status === 'approved';
                  const isPending = submission?.status === 'pending';
                  const canAccess = index === 0 || moduleSubmissions.find(s => s.moduleId === CAREER_MODULES[index - 1].id && s.status === 'approved');
                  
                  return (
                    <div key={module.id} className={`p-4 rounded-lg border-2 ${
                      isCompleted ? 'bg-green-50 border-green-200' :
                      isPending ? 'bg-yellow-50 border-yellow-200' :
                      !canAccess ? 'bg-gray-50 border-gray-200 opacity-60' :
                      'bg-white border-gray-200 hover:border-purple-200'
                    }`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          {isCompleted ? (
                            <CheckCircle className="h-6 w-6 text-green-600 mt-1" />
                          ) : isPending ? (
                            <Clock className="h-6 w-6 text-yellow-600 mt-1" />
                          ) : (
                            <Circle className="h-6 w-6 text-gray-400 mt-1" />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{module.name}</h3>
                              {module.requiresApproval && (
                                <Badge variant="outline" className="text-xs">Requires Approval</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{module.description}</p>
                            {isPending && (
                              <Alert className="mt-2">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription className="text-xs">
                                  Submitted for review. Waiting for staff approval.
                                </AlertDescription>
                              </Alert>
                            )}
                            {isCompleted && submission.approvedAt && (
                              <p className="text-xs text-green-600 mt-2">
                                ✓ Approved on {new Date(submission.approvedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={isCompleted ? 'default' : 'secondary'}>
                            {module.points} pts
                          </Badge>
                          {!isCompleted && canAccess && (
                            <Button 
                              size="sm"
                              disabled={isPending}
                              onClick={() => {
                                setSelectedModule(module);
                                setModuleDialogOpen(true);
                              }}
                            >
                              {isPending ? 'Pending' : 'Start'}
                              <ExternalLink className="ml-2 h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Staff Approval Section */}
              {isStaff && pendingModules.length > 0 && (
                <div className="mt-6 p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    Pending Module Approvals
                  </h3>
                  <div className="space-y-2">
                    {pendingModules.map(sub => {
                      const module = CAREER_MODULES.find(m => m.id === sub.moduleId);
                      return (
                        <div key={sub.id} className="flex items-center justify-between bg-white p-3 rounded border">
                          <div>
                            <p className="font-medium">{module?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Submitted {new Date(sub.submittedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => console.log('Reject', sub.id)}>
                              <X className="h-4 w-4 mr-1" /> Reject
                            </Button>
                            <Button size="sm" onClick={() => console.log('Approve', sub.id)}>
                              <Check className="h-4 w-4 mr-1" /> Approve
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Events & Workshops</CardTitle>
                  <CardDescription>Attend career development events throughout the year</CardDescription>
                </div>
                {isStaff && (
                  <Button onClick={() => setEventDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Create Event
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {events.map(event => {
                  const attendance = eventAttendance.find(a => a.eventId === event.id && a.studentId === user.uid);
                  const hasAttended = attendance?.status === 'approved';
                  const isPending = attendance?.status === 'pending';
                  
                  return (
                    <div key={event.id} className={`p-4 rounded-lg border-2 ${
                      hasAttended ? 'bg-green-50 border-green-200' :
                      isPending ? 'bg-yellow-50 border-yellow-200' :
                      'bg-white border-gray-200'
                    }`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{event.name}</h3>
                            <Badge variant={event.type === 'virtual' ? 'default' : 'secondary'}>
                              {event.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(event.date).toLocaleDateString()}
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {event.location}
                              </div>
                            )}
                            {event.link && (
                              <a href={event.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                                <LinkIcon className="h-4 w-4" />
                                Join Link
                              </a>
                            )}
                          </div>
                          {isPending && (
                            <Alert className="mt-3">
                              <Clock className="h-4 w-4" />
                              <AlertDescription className="text-xs">
                                Attendance pending approval
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          {hasAttended ? (
                            <Badge variant="default" className="whitespace-nowrap">
                              <CheckCircle className="h-4 w-4 mr-1" /> Attended
                            </Badge>
                          ) : isPending ? (
                            <Badge variant="secondary" className="whitespace-nowrap">
                              <Clock className="h-4 w-4 mr-1" /> Pending
                            </Badge>
                          ) : (
                            <Button 
                              size="sm"
                              onClick={() => {
                                setSelectedEvent(event);
                                setEventAttendanceDialogOpen(true);
                              }}
                            >
                              Mark Attended
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Applications Tab */}
        <TabsContent value="applications" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Job & Internship Applications</CardTitle>
                  <CardDescription>Apply to 2 roles per month (24 per year)</CardDescription>
                </div>
                {isStaff && (
                  <Button onClick={() => setJobDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Post Opportunity
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {jobPosts.map(job => {
                  const application = applications.find(a => a.jobId === job.id && a.studentId === user.uid);
                  const hasApplied = !!application;
                  const isApproved = application?.status === 'approved';
                  const isPending = application?.status === 'pending';
                  
                  return (
                    <div key={job.id} className={`p-4 rounded-lg border-2 ${
                      isApproved ? 'bg-green-50 border-green-200' :
                      isPending ? 'bg-yellow-50 border-yellow-200' :
                      'bg-white border-gray-200'
                    }`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{job.title}</h3>
                            <Badge variant="outline">{job.type}</Badge>
                          </div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">{job.company}</p>
                          <p className="text-sm text-muted-foreground mb-2">{job.description}</p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {job.location}
                            </div>
                            <a href={job.applicationUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                              <ExternalLink className="h-4 w-4" />
                              Apply Here
                            </a>
                          </div>
                          {isPending && application && (
                            <Alert className="mt-3">
                              <Clock className="h-4 w-4" />
                              <AlertDescription className="text-xs">
                                Application pending verification
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          {isApproved ? (
                            <Badge variant="default" className="whitespace-nowrap">
                              <CheckCircle className="h-4 w-4 mr-1" /> Verified
                            </Badge>
                          ) : isPending ? (
                            <Badge variant="secondary" className="whitespace-nowrap">
                              <Clock className="h-4 w-4 mr-1" /> Pending
                            </Badge>
                          ) : hasApplied ? (
                            <Badge variant="outline">Submitted</Badge>
                          ) : (
                            <Button 
                              size="sm"
                              onClick={() => {
                                setSelectedJob(job);
                                setApplyJobDialogOpen(true);
                              }}
                            >
                              Submit Proof
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Staff Approval Section */}
              {isStaff && pendingApplications.length > 0 && (
                <div className="mt-6 p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    Pending Application Verifications
                  </h3>
                  <div className="space-y-2">
                    {pendingApplications.map(app => {
                      const job = jobPosts.find(j => j.id === app.jobId);
                      return (
                        <div key={app.id} className="flex items-center justify-between bg-white p-3 rounded border">
                          <div>
                            <p className="font-medium">{job?.title} - {job?.company}</p>
                            <p className="text-sm text-muted-foreground">
                              Submitted {new Date(app.submittedAt).toLocaleDateString()}
                            </p>
                            {app.screenshotUrl && (
                              <a href={app.screenshotUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                                View Screenshot
                              </a>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => console.log('Reject', app.id)}>
                              <X className="h-4 w-4 mr-1" /> Reject
                            </Button>
                            <Button size="sm" onClick={() => console.log('Approve', app.id)}>
                              <Check className="h-4 w-4 mr-1" /> Approve
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Module Submission Dialog */}
      <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedModule?.name}</DialogTitle>
            <DialogDescription>{selectedModule?.description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>How it works</AlertTitle>
              <AlertDescription>
                1. Click the link below to access the module<br/>
                2. Complete all activities in the module<br/>
                3. Submit for staff review and approval<br/>
                {selectedModule?.requiresApproval && "4. Wait for staff approval to unlock the next module"}
              </AlertDescription>
            </Alert>
            
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium mb-1">Module Link</p>
                  <a 
                    href={selectedModule?.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    Open Module <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
                <Badge>{selectedModule?.points} points</Badge>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Completion Notes (Optional)</Label>
              <Textarea 
                id="notes"
                placeholder="Add any notes about your completion..."
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModuleDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              console.log('Submit module completion');
              setModuleDialogOpen(false);
            }}>
              Submit for Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event Creation Dialog (Staff Only) */}
      <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
            <DialogDescription>Add a career development event or workshop</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="event-name">Event Name</Label>
              <Input id="event-name" placeholder="e.g., Tech Career Fair 2024" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-desc">Description</Label>
              <Textarea id="event-desc" placeholder="Brief description of the event..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event-date">Date</Label>
                <Input id="event-date" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-type">Type</Label>
                <select id="event-type" className="w-full h-10 px-3 rounded-md border border-input bg-background">
                  <option value="virtual">Virtual</option>
                  <option value="in-person">In-Person</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-location">Location / Meeting Link</Label>
              <Input id="event-location" placeholder="Physical location or Zoom link" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEventDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              console.log('Create event');
              setEventDialogOpen(false);
            }}>
              Create Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event Attendance Dialog */}
      <Dialog open={eventAttendanceDialogOpen} onOpenChange={setEventAttendanceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Event Attendance</DialogTitle>
            <DialogDescription>{selectedEvent?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Attendance Verification</AlertTitle>
              <AlertDescription>
                Your attendance will be reviewed by staff before points are awarded.
              </AlertDescription>
            </Alert>
            
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <p className="text-sm"><strong>Event:</strong> {selectedEvent?.name}</p>
              <p className="text-sm"><strong>Date:</strong> {selectedEvent && new Date(selectedEvent.date).toLocaleDateString()}</p>
              <p className="text-sm"><strong>Type:</strong> {selectedEvent?.type}</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="attendance-notes">Attendance Notes</Label>
              <Textarea 
                id="attendance-notes"
                placeholder="Optional: Add any notes about your attendance..."
                className="min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEventAttendanceDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              console.log('Submit attendance');
              setEventAttendanceDialogOpen(false);
            }}>
              Submit Attendance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Job Post Dialog (Staff Only) */}
      <Dialog open={jobDialogOpen} onOpenChange={setJobDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Post Job Opportunity</DialogTitle>
            <DialogDescription>Add a new internship or job opportunity</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="job-title">Job Title</Label>
              <Input id="job-title" placeholder="e.g., Junior Frontend Developer" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-company">Company</Label>
              <Input id="job-company" placeholder="Company name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-desc">Description</Label>
              <Textarea id="job-desc" placeholder="Job description..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="job-type">Type</Label>
                <select id="job-type" className="w-full h-10 px-3 rounded-md border border-input bg-background">
                  <option value="internship">Internship</option>
                  <option value="full-time">Full-Time</option>
                  <option value="part-time">Part-Time</option>
                  <option value="contract">Contract</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="job-location">Location</Label>
                <Input id="job-location" placeholder="e.g., Remote, Accra" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-url">Application URL</Label>
              <Input id="job-url" type="url" placeholder="https://company.com/apply" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setJobDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              console.log('Post job');
              setJobDialogOpen(false);
            }}>
              Post Opportunity
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Apply Job Dialog */}
      <Dialog open={applyJobDialogOpen} onOpenChange={setApplyJobDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Application Proof</DialogTitle>
            <DialogDescription>{selectedJob?.title} at {selectedJob?.company}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Verification Required</AlertTitle>
              <AlertDescription>
                Upload a screenshot of your application confirmation to receive credit. Staff will verify before awarding points.
              </AlertDescription>
            </Alert>
            
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <p className="text-sm"><strong>Position:</strong> {selectedJob?.title}</p>
              <p className="text-sm"><strong>Company:</strong> {selectedJob?.company}</p>
              <a href={selectedJob?.applicationUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                <ExternalLink className="h-4 w-4" />
                Open Application Link
              </a>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="screenshot">Screenshot Upload</Label>
              <Input id="screenshot" type="file" accept="image/*" />
              <p className="text-xs text-muted-foreground">Upload a screenshot showing your application submission</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="app-notes">Application Notes</Label>
              <Textarea 
                id="app-notes"
                placeholder="Add any relevant details about your application..."
                className="min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyJobDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              console.log('Submit application proof');
              setApplyJobDialogOpen(false);
            }}>
              Submit Proof
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Book Session Dialog */}
      <Dialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book One-on-One Session</DialogTitle>
            <DialogDescription>Schedule a career guidance session</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>How it works</AlertTitle>
              <AlertDescription>
                1. Book a session using the Calendly link below<br/>
                2. Attend your scheduled session<br/>
                3. Staff will mark your attendance after the session<br/>
                4. Points will be awarded upon completion
              </AlertDescription>
            </Alert>
            
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Calendly Booking Link</p>
              <a 
                href="https://calendly.com/your-booking-link" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1"
              >
                Open Calendly <ExternalLink className="h-4 w-4" />
              </a>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="session-topic">Session Topic (Optional)</Label>
              <Textarea 
                id="session-topic"
                placeholder="What would you like to discuss?"
                className="min-h-[80px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="booking-link">Booking Confirmation Link</Label>
              <Input 
                id="booking-link" 
                type="url"
                placeholder="Paste your Calendly confirmation link"
              />
              <p className="text-xs text-muted-foreground">You'll receive this after booking on Calendly</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSessionDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              console.log('Submit booking');
              setSessionDialogOpen(false);
            }}>
              Submit Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sessions Card - Add to Overview tab if needed */}
      {activeTab === 'overview' && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Your Progress Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Modules Progress</p>
                  <Progress value={(points.modules.current / points.modules.total) * 100} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {moduleSubmissions.filter(s => s.status === 'pending').length} pending approval
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Events Progress</p>
                  <Progress value={(points.events.current / points.events.total) * 100} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {eventAttendance.filter(a => a.status === 'pending').length} pending verification
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Applications Progress</p>
                  <Progress value={(points.applications.current / points.applications.total) * 100} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {applications.filter(a => a.status === 'pending').length} pending verification
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Sessions Progress</p>
                  <Progress value={(points.sessions.current / points.sessions.total) * 100} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {sessions.filter(s => s.status === 'pending').length} pending completion
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SoftSkillsPage;