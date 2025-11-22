"use client"

import React, { useState, useEffect } from 'react';
import { 
  Award, Calendar, CheckCircle, Circle, Plus, TrendingUp, Trophy, Briefcase, Users, 
  ExternalLink, Clock, MapPin, Upload, AlertCircle, GraduationCap, Building2, Globe
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Types (kept minimal)
interface Event { id: string; name: string; date: string; type: 'virtual' | 'in-person'; location?: string; description: string; link?: string; createdAt: Timestamp; }
interface JobPost { id: string; title: string; company: string; type: 'internship' | 'full-time' | 'part-time' | 'contract'; location: string; description: string; applicationUrl: string; postedAt: Timestamp; }

// Mock Data (auto-hides when real data exists)
const MOCK_EVENTS: Event[] = [
  { id: 'mock1', name: 'Google Africa Developer Workshop', date: '2025-12-10', type: 'virtual', description: 'Master Cloud, AI & career strategies with Google engineers', link: 'https://google.com/events', createdAt: Timestamp.now() },
  { id: 'mock2', name: 'MTN Career Fair 2025', date: '2025-11-28', type: 'in-person', location: 'Accra International Conference Centre', description: 'Network with 50+ top companies', createdAt: Timestamp.now() },
  { id: 'mock3', name: 'Women in Tech Summit', date: '2025-12-05', type: 'virtual', description: 'Empowering the next generation of female tech leaders', link: 'https://witsummit.com', createdAt: Timestamp.now() },
];

const MOCK_JOBS: JobPost[] = [
  { id: 'mockj1', title: 'Frontend Developer Intern', company: 'Andela', type: 'internship', location: 'Remote', description: 'Paid 3-month program. React + TypeScript.', applicationUrl: 'https://andela.com/apply', postedAt: Timestamp.now() },
  { id: 'mockj2', title: 'Software Engineer', company: 'mPharma', type: 'full-time', location: 'Accra, Ghana', description: 'Build healthcare for millions', applicationUrl: 'https://mpharma.com/careers', postedAt: Timestamp.now() },
  { id: 'mockj3', title: 'Product Design Intern', company: 'Flutterwave', type: 'internship', location: 'Lagos / Remote', description: 'Design the future of African fintech', applicationUrl: 'https://flutterwave.com/careers', postedAt: Timestamp.now() },
];

const SoftSkillsPage = () => {
  const { role, user, userData } = useAuth();
  const { toast } = useToast();
  const isStaff = role === 'teacher' || role === 'admin';

  // State
  const [activeTab, setActiveTab] = useState('overview');
  const [events, setEvents] = useState<Event[]>([]);
  const [jobPosts, setJobPosts] = useState<JobPost[]>([]);

  // Dialogs & Forms
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [jobDialogOpen, setJobDialogOpen] = useState(false);
  const [applyJobDialogOpen, setApplyJobDialogOpen] = useState(false);
  const [eventAttendanceDialogOpen, setEventAttendanceDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobPost | null>(null);

  const [newEvent, setNewEvent] = useState({ name: '', date: '', type: 'virtual' as 'virtual' | 'in-person', location: '', description: '', link: '' });
  const [newJob, setNewJob] = useState({ title: '', company: '', type: 'internship' as JobPost['type'], location: '', description: '', applicationUrl: '' });

  // Real-time listeners
  useEffect(() => {
    if (!user) return;

    const unsubEvents = onSnapshot(query(collection(db, 'soft_skills_events'), orderBy('date', 'desc')), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Event[];
      setEvents(data.length > 0 ? data : MOCK_EVENTS);
    });

    const unsubJobs = onSnapshot(query(collection(db, 'soft_skills_jobs'), orderBy('postedAt', 'desc')), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as JobPost[];
      setJobPosts(data.length > 0 ? data : MOCK_JOBS);
    });

    return () => { unsubEvents(); unsubJobs(); };
  }, [user]);

  // Hardcoded progress (replace with real calculation later)
  const points = {
    modules: 14, events: 7, applications: 16, sessions: 9,
    get total() { return this.modules + this.events + this.applications + this.sessions; },
    maxTotal: 80
  };
  const overallPercentage = Math.round((points.total / points.maxTotal) * 100);

  // Handlers
  const handleCreateEvent = async () => {
    if (!isStaff) return;
    await addDoc(collection(db, 'soft_skills_events'), { ...newEvent, createdAt: serverTimestamp() });
    toast({ title: "Event Created!", description: "Students can now register." });
    setEventDialogOpen(false);
    setNewEvent({ name: '', date: '', type: 'virtual', location: '', description: '', link: '' });
  };

  const handleCreateJob = async () => {
    if (!isStaff) return;
    await addDoc(collection(db, 'soft_skills_jobs'), { ...newJob, postedAt: serverTimestamp() });
    toast({ title: "Job Posted!", description: "Students can now apply." });
    setJobDialogOpen(false);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-5xl font-bold text-blue-900">Soft Skills & Career Hub</h1>
        <p className="text-xl text-muted-foreground mt-3">Your complete career development dashboard</p>
      </div>

      {/* Student Progress Card */}
      {!isStaff && (
        <Card className="mb-10 border-2 border-blue-300 bg-gradient-to-br from-blue-50 via-cyan-50 to-indigo-50 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl flex items-center justify-center gap-3">
              <Trophy className="h-10 w-10 text-yellow-500" />
              Your Career Journey
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="text-center">
              <div className="text-6xl font-bold text-blue-700">{points.total}<span className="text-3xl text-muted-foreground">/{points.maxTotal}</span></div>
              <Progress value={overallPercentage} className="h-5 mt-4 max-w-md mx-auto" />
              <p className="text-2xl font-semibold text-blue-600 mt-3">{overallPercentage}% Complete — Keep Going!</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { icon: GraduationCap, label: "Modules", value: points.modules, color: "text-purple-600", bg: "bg-purple-100" },
                { icon: Calendar, label: "Events", value: points.events, color: "text-blue-600", bg: "bg-blue-100" },
                { icon: Briefcase, label: "Applications", value: points.applications, color: "text-green-600", bg: "bg-green-100" },
                { icon: Users, label: "Sessions", value: points.sessions, color: "text-indigo-600", bg: "bg-indigo-100" },
              ].map((item) => (
                <div key={item.label} className={`${item.bg} rounded-2xl p-6 text-center border-2 border-white/50`}>
                  <item.icon className={`h-12 w-12 mx-auto mb-3 ${item.color}`} />
                  <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                  <p className="text-4xl font-bold">{item.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB — NEVER EMPTY */}
        <TabsContent value="overview" className="space-y-10">
          <div>
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <Calendar className="h-8 w-8 text-blue-600" />
              Upcoming Events & Workshops
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {events.slice(0, 6).map((event) => (
                <Card key={event.id} className="hover:shadow-lg transition-all">
                  <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                    <CardTitle className="text-lg">{event.name}</CardTitle>
                    <p className="text-sm opacity-90">{new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                    <Button variant="link" className="mt-3 p-0" onClick={() => setActiveTab('events')}>
                      View Details →
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <Briefcase className="h-8 w-8 text-green-600" />
              Latest Job Opportunities
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {jobPosts.slice(0, 4).map((job) => (
                <Card key={job.id} className="hover:border-green-300 transition-all">
                  <CardHeader>
                    <div className="flex justify-between">
                      <div>
                        <CardTitle className="text-xl">{job.title}</CardTitle>
                        <p className="text-lg font-semibold text-green-600">{job.company}</p>
                      </div>
                      <Badge>{job.type}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{job.description}</p>
                    <Button className="w-full" onClick={() => setActiveTab('jobs')}>
                      View All Jobs →
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold">All Events & Workshops</h2>
            {isStaff && <Button size="lg" onClick={() => setEventDialogOpen(true)}><Plus className="mr-2" /> Create Event</Button>}
          </div>
          <div className="grid gap-6">
            {events.map((event) => (
              <Card key={event.id} className="overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6">
                  <h3 className="text-2xl font-bold">{event.name}</h3>
                  <div className="flex gap-6 mt-2 text-sm">
                    <span><Calendar className="inline h-4 w-4" /> {new Date(event.date).toLocaleDateString()}</span>
                    <span>{event.type === 'virtual' ? <Globe className="inline h-4 w-4" /> : <MapPin className="inline h-4 w-4" />} {event.type === 'virtual' ? 'Online' : event.location}</span>
                  </div>
                </div>
                <CardContent className="pt-6">
                  <p>{event.description}</p>
                  <div className="flex gap-3 mt-4">
                    {event.link && <Button asChild><a href={event.link} target="_blank">Join Event <ExternalLink className="ml-2 h-4 w-4" /></a></Button>}
                    {!isStaff && <Button variant="outline" onClick={() => { setSelectedEvent(event); setEventAttendanceDialogOpen(true); }}>Mark Attended</Button>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Jobs Tab */}
        <TabsContent value="jobs" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold">Job Board</h2>
            {isStaff && <Button size="lg" onClick={() => setJobDialogOpen(true)}><Plus className="mr-2" /> Post Job</Button>}
          </div>
          <div className="grid gap-6">
            {jobPosts.map((job) => (
              <Card key={job.id} className="border-2 hover:border-green-400 transition-all">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl">{job.title}</CardTitle>
                      <p className="text-xl font-semibold text-green-600">{job.company}</p>
                    </div>
                    <Badge variant="secondary" className="text-lg">{job.type}</Badge>
                  </div>
                  <p className="text-muted-foreground mt-2"><MapPin className="inline h-4 w-4" /> {job.location}</p>
                </CardHeader>
                <CardContent>
                  <p className="mb-6">{job.description}</p>
                  <div className="flex gap-4">
                    <Button asChild><a href={job.applicationUrl} target="_blank">Apply Now</a></Button>
                    {!isStaff && <Button variant="outline" onClick={() => { setSelectedJob(job); setApplyJobDialogOpen(true); }}>
                      <Upload className="mr-2 h-4 w-4" /> Submit Proof (+1pt)
                    </Button>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs remain the same */}
      <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Create New Event</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Event Name" value={newEvent.name} onChange={e => setNewEvent({...newEvent, name: e.target.value})} />
            <Input type="date" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} />
            <div className="flex gap-3">
              <Button variant={newEvent.type === 'virtual' ? 'default' : 'outline'} onClick={() => setNewEvent({...newEvent, type: 'virtual'})}>Virtual</Button>
              <Button variant={newEvent.type === 'in-person' ? 'default' : 'outline'} onClick={() => setNewEvent({...newEvent, type: 'in-person'})}>In-Person</Button>
            </div>
            {newEvent.type === 'in-person' && <Input placeholder="Location" value={newEvent.location} onChange={e => setNewEvent({...newEvent, location: e.target.value})} />}
            <Textarea placeholder="Description" value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} />
            <Input placeholder="Registration Link (optional)" value={newEvent.link} onChange={e => setNewEvent({...newEvent, link: e.target.value})} />
          </div>
          <DialogFooter><Button onClick={handleCreateEvent}>Create Event</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={applyJobDialogOpen} onOpenChange={setApplyJobDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Submit Application Proof</DialogTitle></DialogHeader>
          <Alert><Upload className="h-4 w-4" /><AlertTitle>Screenshot Required</AlertTitle><AlertDescription>Paste link to confirmation screenshot</AlertDescription></Alert>
          <Input className="mt-4" placeholder="https://imgur.com/abc123" />
          <Textarea placeholder="Notes (optional)" />
          <DialogFooter><Button>Submit Proof (+1 point)</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SoftSkillsPage;