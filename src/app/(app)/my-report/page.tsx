// src/app/(app)/my-report/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getStudentReport, type StudentReport } from '@/services/student-reports';
import { 
  Award, 
  CheckCircle, 
  Edit, 
  Projector, 
  Handshake, 
  Presentation, 
  Code, 
  GitBranch,
  Calendar,
  Briefcase,
  Users,
  FileText,
  TrendingUp,
  Target
} from 'lucide-react';

const categoryIcons = {
  attendance: CheckCircle,
  assignments: Edit,
  exercises: Edit,
  weeklyProjects: Projector,
  monthlyProjects: Projector,
  hundredDaysOfCode: Code,
  codeReview: GitBranch,
  finalProject: Award,
  softSkills: Handshake,
  miniDemoDays: Presentation,
};

export default function MyReportPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [report, setReport] = useState<StudentReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReport() {
      if (authLoading) return;
      
      if (!user) {
        router.push('/login');
        return;
      }

      setLoading(true);
      try {
        const studentReport = await getStudentReport(user.uid);
        setReport(studentReport);
      } catch (error) {
        console.error('Error loading report:', error);
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your report...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Report Not Available</CardTitle>
            <CardDescription>
              Your report could not be loaded. Please contact your instructor.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const academicCategories = [
    { key: 'attendance', label: 'Class Attendance', data: report.attendance },
    { key: 'assignments', label: 'Class Assignments', data: report.assignments },
    { key: 'exercises', label: 'Class Exercises', data: report.exercises },
    { key: 'weeklyProjects', label: 'Weekly Projects', data: report.weeklyProjects },
    { key: 'monthlyProjects', label: 'Monthly Projects', data: report.monthlyProjects },
    { key: 'softSkills', label: 'Soft Skills Training', data: report.softSkills },
    { key: 'miniDemoDays', label: 'Mini Demo Days', data: report.miniDemoDays },
    { key: 'hundredDaysOfCode', label: '100 Days of Code', data: report.hundredDaysOfCode },
    { key: 'codeReview', label: 'Code Review', data: report.codeReview },
    { key: 'finalProject', label: 'Final Project', data: report.finalProject },
  ];

  const overallPercentage = Math.round((report.totalPoints / report.maxPoints) * 100);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">My Progress Report</h1>
        <p className="text-muted-foreground">
          Track your academic progress and career development
        </p>
      </div>

      {/* Overall Progress */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            Overall Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Points Earned</p>
              <p className="text-3xl font-bold text-blue-600">
                {report.totalPoints}/{report.maxPoints}
              </p>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                overallPercentage >= 75 ? 'bg-green-100 text-green-700' :
                overallPercentage >= 50 ? 'bg-yellow-100 text-yellow-700' :
                'bg-orange-100 text-orange-700'
              }`}>
                <Target className="h-5 w-5" />
                <span className="font-bold">{overallPercentage}%</span>
              </div>
            </div>
          </div>
          <Progress value={overallPercentage} className="h-3" />
        </CardContent>
      </Card>

      <Tabs defaultValue="academic" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="academic">Academic Performance</TabsTrigger>
          <TabsTrigger value="career">Career Development</TabsTrigger>
        </TabsList>

        {/* Academic Performance Tab */}
        <TabsContent value="academic" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {academicCategories.map(({ key, label, data }) => {
              const Icon = categoryIcons[key as keyof typeof categoryIcons] || Award;
              return (
                <Card key={key}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-base">{label}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">
                        {data.current} / {data.total} pts
                      </span>
                    </div>
                    <Progress value={data.percentage} />
                    <p className="text-xs text-muted-foreground text-right">
                      {data.percentage}% Complete
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Career Development Tab */}
        <TabsContent value="career" className="space-y-4 mt-6">
          {/* Career Modules */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-purple-600" />
                Career Modules
              </CardTitle>
              <CardDescription>
                Complete 5 career development modules • 2 points each • Total: 10 points
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span className="font-medium">
                    {report.careerModules.completed * 2} / 10 points
                  </span>
                </div>
                <Progress 
                  value={(report.careerModules.completed / 5) * 100} 
                />
              </div>
              <div className="grid grid-cols-1 gap-2">
                {report.careerModules.modules.map((module, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      module.completed 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {module.completed ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                      )}
                      <span className={module.completed ? 'font-medium' : 'text-muted-foreground'}>
                        {module.name}
                      </span>
                    </div>
                    <Badge variant={module.completed ? 'default' : 'outline'}>
                      2 pts
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Events & Workshops */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Events & Workshops
              </CardTitle>
              <CardDescription>
                Attend 12 events per year • No points, tracking only
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span className="font-medium">
                    {report.eventsWorkshops.attended} / 12 events
                  </span>
                </div>
                <Progress value={report.eventsWorkshops.percentage} />
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {report.eventsWorkshops.events.length > 0 ? (
                  report.eventsWorkshops.events.map((event, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 bg-blue-50 rounded border border-blue-100">
                      <Calendar className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{event.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(event.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    No events recorded yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Internship Applications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-orange-600" />
                Internship & Job Applications
              </CardTitle>
              <CardDescription>
                Apply to 24 positions per year (2 per month) • No points, tracking only
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span className="font-medium">
                    {report.internshipApplications.submitted} / 24 applications
                  </span>
                </div>
                <Progress value={report.internshipApplications.percentage} />
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {report.internshipApplications.applications.length > 0 ? (
                  report.internshipApplications.applications.map((app, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-orange-50 rounded border border-orange-100">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{app.company}</p>
                        <p className="text-xs text-muted-foreground">{app.role}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(app.date).toLocaleDateString()}
                        </p>
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
                  <p className="text-center text-sm text-muted-foreground py-4">
                    No applications recorded yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* One-on-One Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                One-on-One Sessions
              </CardTitle>
              <CardDescription>
                Attend 24 sessions per year (2 per month) • No points, tracking only
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span className="font-medium">
                    {report.oneOnOneSessions.attended} / 24 sessions
                  </span>
                </div>
                <Progress value={report.oneOnOneSessions.percentage} />
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {report.oneOnOneSessions.sessions.length > 0 ? (
                  report.oneOnOneSessions.sessions.map((session, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 bg-green-50 rounded border border-green-100">
                      <Users className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{session.topic}</p>
                        <p className="text-xs text-muted-foreground">with {session.with}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(session.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    No sessions recorded yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}