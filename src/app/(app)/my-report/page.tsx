"use client"

import React, { useEffect, useState } from 'react';
import { FileText, Download, Loader2, Award, TrendingUp, Calendar, Briefcase, Users, Code, BookOpen, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getStudentReport, StudentReport } from '@/services/student-reports';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const StudentReportPage = () => {
  const { user, userData } = useAuth();
  const [report, setReport] = useState<StudentReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadReport = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        const studentReport = await getStudentReport(user.uid);
        if (studentReport) {
          setReport(studentReport);
        } else {
          setError('Could not load your report. Please contact your instructor.');
        }
      } catch (err: any) {
        console.error('Error loading report:', err);
        setError(err.message || 'Failed to load report');
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [user]);

  const downloadReport = async () => {
    alert('PDF download functionality would be implemented here');
  };

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (percentage >= 75) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (percentage >= 40) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getPerformanceLabel = (percentage: number) => {
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 75) return 'Very Good';
    if (percentage >= 60) return 'Good';
    if (percentage >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  const PerformanceCard = ({ title, current, total, percentage, icon: Icon }: { 
    title: string; 
    current: number; 
    total: number; 
    percentage: number;
    icon: React.ElementType;
  }) => (
    <div className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 text-sm">{title}</h4>
          <p className="text-2xl font-bold text-gray-900 mt-1">{current}/{total}</p>
        </div>
        <Icon className="h-5 w-5 text-blue-600" />
      </div>
      <div className="space-y-2">
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
          <span className={`text-xs font-medium px-2 py-1 rounded ${getPerformanceColor(percentage)}`}>
            {getPerformanceLabel(percentage)}
          </span>
          <span className="text-sm font-semibold text-gray-900">{percentage}%</span>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Loading Report</AlertTitle>
            <AlertDescription>
              {error || 'Could not load your report. Please try again later or contact your instructor.'}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const overallPercentage = Math.round((report.totalPoints / report.maxPoints) * 100);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Download Button - Top Right */}
        <div className="flex justify-end mb-4">
          <button
            onClick={downloadReport}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </button>
        </div>

        {/* Report Card Container */}
        <div id="report-content" className="bg-white rounded-xl shadow-lg">
          {/* Header with Logo */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8 rounded-t-xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-white p-2 rounded-lg">
                  <img 
                    src="/logo.png" 
                    alt="School Logo" 
                    className="h-16 w-16 object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Academic Report Card</h1>
                  <p className="text-blue-100 mt-1">Term 1 • Academic Year 2024/2025</p>
                </div>
              </div>
            </div>
          </div>

          {/* Student Info */}
          <div className="p-8 border-b">
            <div className="flex items-center gap-6">
              <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-blue-100">
  <img
    src={
      userData?.photoURL ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${report.studentName}`
    }
    alt={report.studentName}
    className="h-full w-full object-cover"
  />
</div>

              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">{report.studentName}</h2>
                <p className="text-gray-600">{report.email}</p>
                <p className="text-sm text-gray-500 mt-1">Generation: {report.gen}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Points Earned</p>
                <p className="text-4xl font-bold text-blue-600">{report.totalPoints}</p>
                <p className="text-sm text-gray-500">out of {report.maxPoints}</p>
              </div>
            </div>
          </div>

          {/* Overall Performance */}
          <div className="p-8 bg-blue-50 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Overall Performance</h3>
                <div className="flex items-center gap-3">
                  <div className="w-64 bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-blue-600 h-4 rounded-full transition-all"
                      style={{ width: `${overallPercentage}%` }}
                    />
                  </div>
                  <span className="text-2xl font-bold text-blue-600">{overallPercentage}%</span>
                </div>
              </div>
              <div className={`px-6 py-3 rounded-full font-bold text-lg ${getPerformanceColor(overallPercentage)}`}>
                {getPerformanceLabel(overallPercentage)}
              </div>
            </div>
          </div>

          {/* Academic Performance Section */}
          <div className="p-8 border-b">
            <div className="flex items-center gap-2 mb-6">
              <BookOpen className="h-6 w-6 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-900">Academic Performance</h3>
              <span className="ml-auto text-sm text-gray-600">280 points available</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <PerformanceCard {...report.attendance} title="Class Attendance" icon={Calendar} />
              <PerformanceCard {...report.assignments} title="Assignments" icon={FileText} />
              <PerformanceCard {...report.exercises} title="Class Exercises" icon={FileText} />
              <PerformanceCard {...report.weeklyProjects} title="Weekly Projects" icon={Code} />
              <PerformanceCard {...report.monthlyProjects} title="Monthly Projects" icon={Code} />
              <PerformanceCard {...report.hundredDaysOfCode} title="100 Days of Code" icon={Code} />
              <PerformanceCard {...report.codeReview} title="Code Review" icon={Users} />
              <PerformanceCard {...report.miniDemoDays} title="Mini Demo Days" icon={Award} />
              <PerformanceCard {...report.finalProject} title="Final Project" icon={Award} />
            </div>
          </div>

          {/* Career Development Section */}
          <div className="p-8 border-b">
            <div className="flex items-center gap-2 mb-6">
              <Briefcase className="h-6 w-6 text-purple-600" />
              <h3 className="text-xl font-bold text-gray-900">Career Development & Soft Skills</h3>
              <span className="ml-auto text-sm text-gray-600">70 points available</span>
            </div>

            {/* Career Modules */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">Career Modules ({report.careerModules.completed}/{report.careerModules.total} completed)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {report.careerModules.modules.map((module, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      module.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <span className={module.completed ? 'text-gray-900' : 'text-gray-500'}>
                      {module.name}
                    </span>
                    <span className="font-semibold text-sm">{module.points} pts</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Events & Workshops */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">
                Events & Workshops ({report.eventsWorkshops.attended}/{report.eventsWorkshops.required} attended)
              </h4>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Progress</span>
                  <span className="font-semibold">{report.eventsWorkshops.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${report.eventsWorkshops.percentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Job Applications */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">
                Internship Applications ({report.internshipApplications.submitted}/{report.internshipApplications.required} submitted)
              </h4>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Progress</span>
                  <span className="font-semibold">{report.internshipApplications.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-600 h-2 rounded-full"
                    style={{ width: `${report.internshipApplications.percentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* One-on-One Sessions */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">
                One-on-One Sessions ({report.oneOnOneSessions.attended}/{report.oneOnOneSessions.required} completed)
              </h4>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Progress</span>
                  <span className="font-semibold">{report.oneOnOneSessions.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${report.oneOnOneSessions.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Feedback Section */}
          <div className="p-8 border-b">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="h-6 w-6 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-900">Performance Feedback</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Strengths */}
              {report.strengths && report.strengths.length > 0 && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-3">Strengths</h4>
                  <ul className="space-y-2">
                    {report.strengths.map((strength, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-green-600 mt-1">•</span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Areas for Improvement */}
              {report.areasForImprovement && report.areasForImprovement.length > 0 && (
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <h4 className="font-semibold text-orange-800 mb-3">Areas for Improvement</h4>
                  <ul className="space-y-2">
                    {report.areasForImprovement.map((area, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-orange-600 mt-1">•</span>
                        {area}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Achievements */}
            {report.achievements && report.achievements.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
                <h4 className="font-semibold text-blue-800 mb-3">Notable Achievements</h4>
                <ul className="space-y-2">
                  {report.achievements.map((achievement, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                      <Award className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                      {achievement}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {report.recommendations && report.recommendations.length > 0 && (
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-800 mb-3">Recommendations</h4>
                <ul className="space-y-2">
                  {report.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-purple-600 mt-1">→</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className="p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Additional Comments</h3>
            
            <div className="space-y-4">
              {report.teacherComments && (
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">Teacher's Comments</h4>
                  <p className="text-sm text-gray-700 italic">{report.teacherComments}</p>
                </div>
              )}

              {report.careerServiceComments && (
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">Career Service Lead Comments</h4>
                  <p className="text-sm text-gray-700 italic">{report.careerServiceComments}</p>
                </div>
              )}

              {report.employerFeedback && report.employerFeedback !== 'N/A' && (
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">Employer's Feedback</h4>
                  <p className="text-sm text-gray-700 italic">{report.employerFeedback}</p>
                </div>
              )}

              {!report.teacherComments && !report.careerServiceComments && !report.employerFeedback && (
                <div className="text-center text-gray-500 py-8">
                  <p>No additional comments have been added yet.</p>
                  <p className="text-sm mt-2">Your instructors will provide feedback as you progress through the program.</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-blue-50 p-6 rounded-b-xl text-center border-t">
            <p className="text-sm text-gray-700 mb-2">
              We encourage you to schedule a meeting with your instructor to discuss this evaluation further.
            </p>
            <p className="text-sm font-semibold text-gray-900">
              Codetrain Career Services
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentReportPage;