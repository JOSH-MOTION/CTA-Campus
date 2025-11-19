// src/app/(app)/reports/[studentId]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FileText, Download, Edit, Save, X, TrendingUp, TrendingDown, Calendar, Award, Briefcase, Users, BookOpen, ChevronDown, ChevronUp, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  getStudentReport,
  updateStudentReportFeedback,
  refreshAcademicPerformance,
  StudentReport,
  OneOnOneSession,
  InternshipApplication,
  EventWorkshop,
} from '@/services/student-reports';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function StudentReportPage() {
  const params = useParams();
  const router = useRouter();
  const { user, role } = useAuth();
  const { toast } = useToast();
  
  const studentId = params.studentId as string;
  const [studentData, setStudentData] = useState<StudentReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editedComments, setEditedComments] = useState({
    strengths: [] as string[],
    areasForImprovement: [] as string[],
    achievements: [] as string[],
    recommendations: [] as string[],
    teacherComments: '',
    careerServiceComments: '',
    employerFeedback: ''
  });
  const [expandedSections, setExpandedSections] = useState({
    academic: true,
    career: true,
    softSkills: true,
    feedback: true
  });

  const isStaff = role === 'teacher' || role === 'admin';
  const isOwnReport = user?.uid === studentId;

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const loadReport = async () => {
    setLoading(true);
    try {
      // Refresh academic performance before loading
      await refreshAcademicPerformance(studentId);
      
      const report = await getStudentReport(studentId);
      if (report) {
        setStudentData(report);
        setEditedComments({
          strengths: report.strengths || [],
          areasForImprovement: report.areasForImprovement || [],
          achievements: report.achievements || [],
          recommendations: report.recommendations || [],
          teacherComments: report.teacherComments || '',
          careerServiceComments: report.careerServiceComments || '',
          employerFeedback: report.employerFeedback || ''
        });
      }
    } catch (error) {
      console.error('Error loading report:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load student report'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: 'academic' | 'career' | 'softSkills' | 'feedback') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getPerformanceRating = (percentage: number) => {
    if (percentage >= 90) return { label: 'High', color: 'text-green-600 bg-green-50', icon: TrendingUp };
    if (percentage >= 75) return { label: 'Above Average', color: 'text-blue-600 bg-blue-50', icon: TrendingUp };
    if (percentage >= 60) return { label: 'Average', color: 'text-yellow-600 bg-yellow-50', icon: TrendingUp };
    if (percentage >= 40) return { label: 'Below Average', color: 'text-orange-600 bg-orange-50', icon: TrendingDown };
    return { label: 'Low', color: 'text-red-600 bg-red-50', icon: TrendingDown };
  };

  const handleSaveComments = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      await updateStudentReportFeedback(
        studentId,
        editedComments,
        user.uid
      );
      
      setStudentData(prev => prev ? { ...prev, ...editedComments } : null);
      setIsEditing(false);
      
      toast({
        title: 'Success',
        description: 'Report updated successfully'
      });
    } catch (error) {
      console.error('Error saving comments:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update report'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (studentData) {
      setEditedComments({
        strengths: studentData.strengths || [],
        areasForImprovement: studentData.areasForImprovement || [],
        achievements: studentData.achievements || [],
        recommendations: studentData.recommendations || [],
        teacherComments: studentData.teacherComments || '',
        careerServiceComments: studentData.careerServiceComments || '',
        employerFeedback: studentData.employerFeedback || ''
      });
    }
    setIsEditing(false);
  };

  const handleExportPDF = async () => {
    if (!studentData) return;
    
    const element = document.getElementById('report-content');
    if (!element) return;

    try {
      toast({
        title: 'Generating PDF',
        description: 'Please wait...'
      });

      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`${studentData.studentName}_Report.pdf`);

      toast({
        title: 'Success',
        description: 'PDF downloaded successfully'
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to generate PDF'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!studentData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-gray-600">Student report not found</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const overallPercentage = Math.round((studentData.totalPoints / studentData.maxPoints) * 100);
  const overallRating = getPerformanceRating(overallPercentage);
  const OverallIcon = overallRating.icon;

  const PerformanceCard = ({ title, current, total, percentage }: { 
    title: string; 
    current: number; 
    total: number; 
    percentage: number;
  }) => {
    const rating = getPerformanceRating(percentage);
    const Icon = rating.icon;
    
    return (
      <div className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-medium text-gray-900">{title}</h4>
          <Icon className={`h-5 w-5 ${rating.color.split(' ')[0]}`} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Progress</span>
            <span className="font-semibold">{current}/{total}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all ${
                percentage >= 75 ? 'bg-green-500' : 
                percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium px-2 py-1 rounded ${rating.color}`}>
              {rating.label}
            </span>
            <span className="text-sm font-semibold text-gray-900">{percentage}%</span>
          </div>
        </div>
      </div>
    );
  };

  const SectionHeader = ({ title, icon: Icon, sectionKey }: { 
    title: string; 
    icon: React.ElementType; 
    sectionKey: 'academic' | 'career' | 'softSkills' | 'feedback';
  }) => (
    <button
      onClick={() => toggleSection(sectionKey)}
      className="flex items-center justify-between w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-colors"
    >
      <div className="flex items-center gap-3">
        <Icon className="h-6 w-6" />
        <h2 className="text-xl font-bold">{title}</h2>
      </div>
      {expandedSections[sectionKey] ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
    </button>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Navigation */}
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div id="report-content" className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                {studentData.studentName.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{studentData.studentName}</h1>
                <p className="text-gray-600">{studentData.gen} • {studentData.studentId}</p>
                <p className="text-sm text-gray-500">{studentData.email}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleExportPDF} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>

          {/* Overall Performance */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border-2 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Overall Performance</h3>
                <p className="text-3xl font-bold text-blue-600">{studentData.totalPoints}/{studentData.maxPoints} Points</p>
              </div>
              <div className="text-right">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${overallRating.color} text-lg font-bold`}>
                  <OverallIcon className="h-6 w-6" />
                  {overallRating.label}
                </div>
                <p className="text-2xl font-bold text-gray-900 mt-2">{overallPercentage}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Academic Performance Section */}
        <div className="space-y-4">
          <SectionHeader title="Academic Performance" icon={BookOpen} sectionKey="academic" />
          
          {expandedSections.academic && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <PerformanceCard {...studentData.attendance} title="Class Attendance" />
              <PerformanceCard {...studentData.assignments} title="Class Assignments" />
              <PerformanceCard {...studentData.exercises} title="Class Exercises" />
              <PerformanceCard {...studentData.weeklyProjects} title="Weekly Projects" />
              <PerformanceCard {...studentData.monthlyProjects} title="Monthly Projects" />
              <PerformanceCard {...studentData.hundredDaysOfCode} title="100 Days of Code" />
              <PerformanceCard {...studentData.codeReview} title="Code Review" />
              <PerformanceCard {...studentData.finalProject} title="Final Project" />
            </div>
          )}
        </div>

        {/* Career Module Section */}
        <div className="space-y-4">
          <SectionHeader title="Career Service Evaluation" icon={Briefcase} sectionKey="career" />
          
          {expandedSections.career && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Career Modules */}
              <div className="bg-white rounded-lg border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Career Modules</h3>
                  <span className="text-sm font-medium text-gray-600">
                    {studentData.careerModules.completed}/{studentData.careerModules.total} Completed
                  </span>
                </div>
                <div className="space-y-3">
                  {studentData.careerModules.modules.map((module, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full ${module.completed ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className={module.completed ? 'text-gray-900' : 'text-gray-500'}>
                          {module.name}
                        </span>
                      </div>
                      <span className="font-semibold text-sm">{module.points} pts</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Events & Workshops */}
              <div className="bg-white rounded-lg border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Events & Workshops</h3>
                  <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                    studentData.eventsWorkshops.percentage >= 75 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {studentData.eventsWorkshops.attended}/{studentData.eventsWorkshops.required} Attended
                  </span>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {studentData.eventsWorkshops.events.length > 0 ? (
                    studentData.eventsWorkshops.events.map((event: EventWorkshop, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded">
                        <Calendar className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{event.name}</p>
                          <p className="text-xs text-gray-500">{new Date(event.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No events attended yet</p>
                  )}
                </div>
              </div>

              {/* Internship Applications */}
              <div className="bg-white rounded-lg border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Internship Applications</h3>
                  <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                    studentData.internshipApplications.percentage >= 75 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {studentData.internshipApplications.submitted}/{studentData.internshipApplications.required} Submitted
                  </span>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {studentData.internshipApplications.applications.length > 0 ? (
                    studentData.internshipApplications.applications.slice(0, 5).map((app: InternshipApplication, index: number) => (
                      <div key={index} className="flex items-start justify-between p-2 hover:bg-gray-50 rounded">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{app.company}</p>
                          <p className="text-xs text-gray-600">{app.role}</p>
                          <p className="text-xs text-gray-500">{new Date(app.date).toLocaleDateString()}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${
                          app.status === 'Interview' || app.status === 'Accepted' ? 'bg-blue-100 text-blue-700' :
                          app.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {app.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No applications submitted yet</p>
                  )}
                </div>
              </div>

              {/* One-on-One Sessions */}
              <div className="bg-white rounded-lg border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">One-on-One Sessions</h3>
                  <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                    studentData.oneOnOneSessions.percentage >= 75 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {studentData.oneOnOneSessions.attended}/{studentData.oneOnOneSessions.required} Completed
                  </span>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {studentData.oneOnOneSessions.sessions.length > 0 ? (
                    studentData.oneOnOneSessions.sessions.slice(0, 5).map((session: OneOnOneSession, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded">
                        <Users className="h-4 w-4 text-purple-600 mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{session.topic}</p>
                          <p className="text-xs text-gray-600">with {session.with}</p>
                          <p className="text-xs text-gray-500">{new Date(session.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No sessions completed yet</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Soft Skills Section */}
        <div className="space-y-4">
          <SectionHeader title="Soft Skills & Presentations" icon={Award} sectionKey="softSkills" />
          
          {expandedSections.softSkills && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PerformanceCard {...studentData.softSkills} title="Soft Skills Training" />
              <PerformanceCard {...studentData.miniDemoDays} title="Mini Demo Days" />

              {/* CV & Portfolio Status */}
              <div className="bg-white rounded-lg border p-4 md:col-span-2">
                <h4 className="font-semibold text-gray-900 mb-3">CV & Portfolio Status</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">CV Status</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        studentData.cvPortfolio.cvStatus === 'Approved' ? 'bg-green-100 text-green-700' :
                        studentData.cvPortfolio.cvStatus === 'Reviewed' ? 'bg-blue-100 text-blue-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {studentData.cvPortfolio.cvStatus}
                      </span>
                    </div>
                    {studentData.cvPortfolio.cvLastUpdated && (
                      <p className="text-xs text-gray-500">Last updated: {new Date(studentData.cvPortfolio.cvLastUpdated).toLocaleDateString()}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Portfolio Status</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        studentData.cvPortfolio.portfolioStatus === 'Approved' ? 'bg-green-100 text-green-700' :
                        studentData.cvPortfolio.portfolioStatus === 'Under Review' ? 'bg-blue-100 text-blue-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {studentData.cvPortfolio.portfolioStatus}
                      </span>
                    </div>
                    {studentData.cvPortfolio.portfolioUrl && (
                      <a href={studentData.cvPortfolio.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline block truncate">
                        {studentData.cvPortfolio.portfolioUrl}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Feedback Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
  <SectionHeader title="Feedback & Comments" icon={FileText} sectionKey="feedback" />

  {isStaff && expandedSections.feedback && (
    <div className="flex gap-2 ml-4">
      {!isEditing ? (
        <Button
          size="sm"
          className="flex items-center gap-1 px-3 py-1"
          onClick={() => setIsEditing(true)}
        >
          <Edit className="h-4 w-4" />
          Edit
        </Button>
      ) : (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex items-center gap-1 px-3 py-1"
            onClick={handleCancelEdit}
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <Button
            size="sm"
            className="flex items-center gap-1 px-3 py-1"
            onClick={handleSaveComments}
            disabled={saving}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </Button>
        </div>
      )}
    </div>
  )}
</div>


          {expandedSections.feedback && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strengths */}
              <div className="bg-white rounded-lg border p-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Strengths
                </h4>
                {isEditing ? (
                  <textarea
                    value={editedComments.strengths.join('')}
                    onChange={(e) => setEditedComments(prev => ({
                      ...prev,
                      strengths: e.target.value.split('').filter(s => s.trim())
                    }))}
                    className="w-full h-32 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter strengths (one per line)"
                  />
                ) : (
                  <ul className="space-y-2">
                    {(studentData.strengths || []).length > 0 ? (
                      studentData.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-green-600 mt-1">•</span>
                          {strength}
                        </li>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No strengths added yet</p>
                    )}
                  </ul>
                )}
              </div>

              {/* Areas for Improvement */}
              <div className="bg-white rounded-lg border p-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-orange-600" />
                  Areas for Improvement
                </h4>
                {isEditing ? (
                  <textarea
                    value={editedComments.areasForImprovement.join('')}
                    onChange={(e) => setEditedComments(prev => ({
                      ...prev,
                      areasForImprovement: e.target.value.split('').filter(s => s.trim())
                    }))}
                    className="w-full h-32 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter areas for improvement (one per line)"
                  />
                ) : (
                  <ul className="space-y-2">
                    {(studentData.areasForImprovement || []).length > 0 ? (
                      studentData.areasForImprovement.map((area, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-orange-600 mt-1">•</span>
                          {area}
                        </li>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No areas added yet</p>
                    )}
                  </ul>
                )}
              </div>

              {/* Noteworthy Achievements */}
              <div className="bg-white rounded-lg border p-6 md:col-span-2">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Award className="h-5 w-5 text-blue-600" />
                  Noteworthy Achievements
                </h4>
                {isEditing ? (
                  <textarea
                    value={editedComments.achievements.join('')}
                    onChange={(e) => setEditedComments(prev => ({
                      ...prev,
                      achievements: e.target.value.split('').filter(s => s.trim())
                    }))}
                    className="w-full h-32 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter achievements (one per line)"
                  />
                ) : (
                  <ul className="space-y-2">
                    {(studentData.achievements || []).length > 0 ? (
                      studentData.achievements.map((achievement, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-blue-600 mt-1">•</span>
                          {achievement}
                        </li>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No achievements added yet</p>
                    )}
                  </ul>
                )}
              </div>

              {/* Recommendations */}
              <div className="bg-white rounded-lg border p-6">
                <h4 className="font-semibold text-gray-900 mb-3">Recommendations</h4>
                {isEditing ? (
                  <textarea
                    value={editedComments.recommendations.join('')}
                    onChange={(e) => setEditedComments(prev => ({
                      ...prev,
                      recommendations: e.target.value.split('').filter(s => s.trim())
                    }))}
                    className="w-full h-32 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter recommendations (one per line)"
                  />
                ) : (
                  <ul className="space-y-2">
                    {(studentData.recommendations || []).length > 0 ? (
                      studentData.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-purple-600 mt-1">•</span>
                          {rec}
                        </li>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No recommendations added yet</p>
                    )}
                  </ul>
                )}
              </div>

              {/* Teacher Comments */}
              <div className="bg-white rounded-lg border p-6 md:col-span-2">
                <h4 className="font-semibold text-gray-900 mb-3">Teacher's Comments</h4>
                {isEditing ? (
                  <textarea
                    value={editedComments.teacherComments}
                    onChange={(e) => setEditedComments(prev => ({
                      ...prev,
                      teacherComments: e.target.value
                    }))}
                    className="w-full h-24 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter teacher's comments"
                  />
                ) : (
                  <p className="text-sm text-gray-700 italic">
                    {studentData.teacherComments || "No comments added yet."}
                  </p>
                )}
              </div>

              {/* Career Service Comments */}
              <div className="bg-white rounded-lg border p-6 md:col-span-2">
                <h4 className="font-semibold text-gray-900 mb-3">Career Service Lead Comment</h4>
                {isEditing ? (
                  <textarea
                    value={editedComments.careerServiceComments}
                    onChange={(e) => setEditedComments(prev => ({
                      ...prev,
                      careerServiceComments: e.target.value
                    }))}
                    className="w-full h-24 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter career service lead's comments"
                  />
                ) : (
                  <p className="text-sm text-gray-700 italic">
                    {studentData.careerServiceComments || "No comments added yet."}
                  </p>
                )}
              </div>

              {/* Employer Feedback */}
              <div className="bg-white rounded-lg border p-6 md:col-span-2">
                <h4 className="font-semibold text-gray-900 mb-3">Employer's Feedback (if applicable)</h4>
                {isEditing ? (
                  <textarea
                    value={editedComments.employerFeedback}
                    onChange={(e) => setEditedComments(prev => ({
                      ...prev,
                      employerFeedback: e.target.value
                    }))}
                    className="w-full h-24 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter employer's feedback (if available)"
                  />
                ) : (
                  <p className="text-sm text-gray-700 italic">
                    {studentData.employerFeedback || "No employer feedback available yet."}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Message */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 text-center">
          <p className="text-sm text-gray-700">
            We encourage you to schedule a meeting with your instructor to discuss this evaluation further 
            and to gain deeper insights into your performance. We are confident that, with dedication and 
            focused effort, you can maximize your learning experience in Codetrain Africa.
          </p>
          <p className="text-sm font-semibold text-gray-900 mt-4">
            Thank you for your commitment to excellence. We look forward to seeing your continued growth and success.
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Sincerely,<br />
            <span className="font-semibold">Codetrain Career Services</span>
          </p>
        </div>
      </div>
    </div>
  );
}
