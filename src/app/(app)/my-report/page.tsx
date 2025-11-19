// src/app/(app)/my-report/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, FileText, TrendingUp, CheckCircle, Award, Calendar, Briefcase, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { getStudentReport, type StudentReport } from '@/services/student-reports';

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

  const overallPercentage = Math.round((report.totalPoints / report.maxPoints) * 100);

  const downloadReport = async () => {
    const element = document.getElementById('report-card');
    if (!element) return;
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${user?.displayName || 'report'}-report.pdf`);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">My Termly Report</h1>
        <button
          onClick={downloadReport}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          <FileText className="h-4 w-4" /> Download PDF
        </button>
      </div>

      {/* Report Card Container */}
      <div id="report-card" className="bg-white p-6 rounded-xl shadow-lg w-full max-w-4xl mx-auto space-y-6">
        {/* Header Info */}
        <div className="text-center">
          <h2 className="text-2xl font-bold">{user.displayName}</h2>
          <p className="text-sm text-gray-600">{user.email} | Gen: {report.gen}</p>
          <p className="text-sm text-gray-500">Term: 1 | Academic Year: 2025/2026</p>
        </div>

        {/* Overall Progress */}
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Overall Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span>Total Points: {report.totalPoints}/{report.maxPoints}</span>
              <span className="font-bold text-lg">{overallPercentage}%</span>
            </div>
            <Progress value={overallPercentage} className="h-3" />
          </CardContent>
        </Card>

        {/* Academic Performance */}
        <Card className="border-2 border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-600" />
              Academic Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(report).map(([key, value]: any) => {
              if (
                ['attendance', 'assignments', 'exercises', 'weeklyProjects', 'monthlyProjects'].includes(key)
              ) {
                return (
                  <div key={key} className="p-4 border rounded-lg bg-gray-50">
                    <h3 className="font-medium mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1')}</h3>
                    <p className="text-sm mb-1">{value.current}/{value.total} pts</p>
                    <Progress value={value.percentage} className="h-2" />
                    <p className="text-xs text-gray-500 text-right">{value.percentage}% Complete</p>
                  </div>
                );
              }
            })}
          </CardContent>
        </Card>

        {/* Career Development */}
        <Card className="border-2 border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-orange-600" />
              Career Development
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm mb-2">Completed Modules: {report.careerModules.completed} / {report.careerModules.modules.length}</p>
            <Progress value={(report.careerModules.completed / report.careerModules.modules.length) * 100} className="h-2" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
              {report.careerModules.modules.map((module, idx) => (
                <div
                  key={idx}
                  className={`p-2 border rounded flex justify-between items-center ${
                    module.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <span className={module.completed ? 'font-medium' : 'text-gray-500'}>{module.name}</span>
                  <Badge variant={module.completed ? 'default' : 'outline'}>2 pts</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Events & Workshops */}
        <Card className="border-2 border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Events & Workshops
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {report.eventsWorkshops.events.map((event, idx) => (
                <div key={idx} className="p-2 bg-blue-50 border border-blue-100 rounded flex justify-between items-center">
                  <span>{event.name}</span>
                  <span className="text-xs text-gray-500">{new Date(event.date).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Internship Applications */}
        <Card className="border-2 border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-orange-600" />
              Internship & Job Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {report.internshipApplications.applications.map((app, idx) => (
                <div key={idx} className="p-2 bg-orange-50 border border-orange-100 rounded flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm">{app.company}</p>
                    <p className="text-xs text-gray-500">{app.role}</p>
                  </div>
                  <Badge variant={
                    app.status === 'Accepted' || app.status === 'Interview' ? 'default' :
                    app.status === 'Pending' ? 'secondary' :
                    'outline'
                  }>{app.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* One-on-One Sessions */}
        <Card className="border-2 border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              One-on-One Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {report.oneOnOneSessions.sessions.map((session, idx) => (
                <div key={idx} className="p-2 bg-green-50 border border-green-100 rounded flex justify-between items-center">
                  <span>{session.topic}</span>
                  <span className="text-xs text-gray-500">with {session.with}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
