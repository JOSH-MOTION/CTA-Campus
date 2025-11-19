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
  const canEdit = isStaff && !isOwnReport;  // Only staff can edit other reports
  const showPDF = isStaff || isOwnReport;    // Both can download

  useEffect(() => {
    loadReport();
  }, [studentId]);

  const loadReport = async () => {
    if (!user) { router.push('/login'); return; }

    setLoading(true);
    try {
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
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load report' });
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getPerformanceRating = (percentage: number) => {
    if (percentage >= 90) return { label: 'High', color: 'text-green-600 bg-green-50', icon: TrendingUp };
    if (percentage >= 75) return { label: 'Above Average', color: 'text-blue-600 bg-blue-50', icon: TrendingUp };
    if (percentage >= 60) return { label: 'Average', color: 'text-yellow-600 bg-yellow-50', icon: TrendingUp };
    if (percentage >= 40) return { label: 'Below Average', color: 'text-orange-600 bg-orange-50', icon: TrendingDown };
    return { label: 'Low', color: 'text-red-600 bg-red-50', icon: TrendingDown };
  };

  const handleSaveComments = async () => {
    if (!user || !canEdit) return;
    setSaving(true);
    try {
      await updateStudentReportFeedback(studentId, editedComments, user.uid);
      setStudentData(prev => prev ? { ...prev, ...editedComments } : null);
      setIsEditing(false);
      toast({ title: 'Success', description: 'Report updated successfully' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update report' });
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
      toast({ title: 'Generating PDF', description: 'Please wait...' });
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(pdfWidth / canvas.width, pdfHeight / canvas.height);
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width * ratio, canvas.height * ratio);
      pdf.save(`${studentData.studentName}_Report.pdf`);
      toast({ title: 'Success', description: 'PDF downloaded!' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to generate PDF' });
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
        <p className="text-gray-600">Report Not Available</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const overallPercentage = Math.round((studentData.totalPoints / studentData.maxPoints) * 100);
  const overallRating = getPerformanceRating(overallPercentage);
  const OverallIcon = overallRating.icon;

  const PerformanceCard = ({ title, current, total, percentage }: any) => {
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
            <div className={`h-2 rounded-full ${percentage >= 75 ? 'bg-green-500' : percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${percentage}%` }} />
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium px-2 py-1 rounded ${rating.color}`}>{rating.label}</span>
            <span className="text-sm font-semibold text-gray-900">{percentage}%</span>
          </div>
        </div>
      </div>
    );
  };

  const SectionHeader = ({ title, icon: Icon, sectionKey }: any) => (
    <button onClick={() => toggleSection(sectionKey)} className="flex items-center justify-between w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-colors">
      <div className="flex items-center gap-3">
        <Icon className="h-6 w-6" />
        <h2 className="text-xl font-bold">{title}</h2>
      </div>
      {expandedSections[sectionKey] ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
    </button>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 bg-gray-50 min-h-screen">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back
      </Button>

      {isOwnReport && (
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">My Termly Progress Report</h1>
          <p className="text-xl text-gray-600 mt-2">Codetrain Africa • {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
        </div>
      )}

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
              {showPDF && (
                <Button onClick={handleExportPDF} variant="outline">
                  <Download className="h-4 w-4 mr-2" /> Export PDF
                </Button>
              )}
            </div>
          </div>

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

        {/* Academic Performance */}
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

        {/* Career Service Evaluation */}
        <div className="space-y-4">
          <SectionHeader title="Career Service Evaluation" icon={Briefcase} sectionKey="career" />
          {expandedSections.career && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Career Modules, Events, Internships, One-on-One — keep your existing code here */}
              {/* ... same as before ... */}
            </div>
          )}
        </div>

        {/* Soft Skills & Presentations */}
        <div className="space-y-4">
          <SectionHeader title="Soft Skills & Presentations" icon={Award} sectionKey="softSkills" />
          {expandedSections.softSkills && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PerformanceCard {...studentData.softSkills} title="Soft Skills Training" />
              <PerformanceCard {...studentData.miniDemoDays} title="Mini Demo Days" />
              {/* CV & Portfolio status — keep your existing code */}
            </div>
          )}
        </div>

        {/* Feedback Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <SectionHeader title="Feedback & Comments" icon={FileText} sectionKey="feedback" />
            {canEdit && expandedSections.feedback && (
              <div className="flex gap-2">
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)}><Edit className="h-4 w-4 mr-2" /> Edit</Button>
                ) : (
                  <>
                    <Button variant="outline" onClick={handleCancelEdit}><X className="h-4 w-4 mr-2" /> Cancel</Button>
                    <Button onClick={handleSaveComments} disabled={saving}>
                      {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Save
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>

          {expandedSections.feedback && (
            /* Your full feedback UI — keep exactly as you had */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* All the Strengths, Areas, Achievements, etc. — keep your code */}
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

       
  