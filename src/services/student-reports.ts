// src/services/student-reports.ts (MIGRATED TO MONGODB)
export interface CareerModule {
  name: string;
  completed: boolean;
  points: number;
  completedAt?: string;
}

export interface EventWorkshop {
  name: string;
  date: string;
  attended: boolean;
}

export interface InternshipApplication {
  company: string;
  role: string;
  date: string;
  status: 'Pending' | 'Interview' | 'Rejected' | 'Accepted';
}

export interface OneOnOneSession {
  with: string;
  topic: string;
  date: string;
  completed: boolean;
}

export interface CVPortfolio {
  cvStatus: 'Not Submitted' | 'Under Review' | 'Reviewed' | 'Approved';
  cvLastUpdated?: string;
  portfolioStatus: 'Not Submitted' | 'Under Review' | 'Needs Improvement' | 'Approved';
  portfolioUrl?: string;
  portfolioLastUpdated?: string;
}

export interface StudentReport {
  id: string;
  studentId: string;
  studentName: string;
  gen: string;
  email: string;
  
  // Academic Performance
  attendance: { current: number; total: number; percentage: number };
  assignments: { current: number; total: number; percentage: number };
  exercises: { current: number; total: number; percentage: number };
  weeklyProjects: { current: number; total: number; percentage: number };
  monthlyProjects: { current: number; total: number; percentage: number };
  hundredDaysOfCode: { current: number; total: number; percentage: number };
  codeReview: { current: number; total: number; percentage: number };
  finalProject: { current: number; total: number; percentage: number };
  softSkills: { current: number; total: number; percentage: number };
  miniDemoDays: { current: number; total: number; percentage: number };
  
  // Career Module Data
  careerModules: {
    completed: number;
    total: number;
    modules: CareerModule[];
  };
  
  eventsWorkshops: {
    attended: number;
    required: number;
    percentage: number;
    events: EventWorkshop[];
  };
  
  internshipApplications: {
    submitted: number;
    required: number;
    percentage: number;
    applications: InternshipApplication[];
  };
  
  oneOnOneSessions: {
    attended: number;
    required: number;
    percentage: number;
    sessions: OneOnOneSession[];
  };
  
  cvPortfolio: CVPortfolio;
  
  totalPoints: number;
  maxPoints: number;
  
  // Editable feedback fields
  strengths: string[];
  areasForImprovement: string[];
  achievements: string[];
  recommendations: string[];
  teacherComments: string;
  careerServiceComments: string;
  employerFeedback: string;
  
  lastUpdated: string;
  updatedBy?: string;
}

/**
 * Get or create a student report
 */
export const getStudentReport = async (
  studentId: string
): Promise<StudentReport | null> => {
  try {
    const response = await fetch(`/api/student-reports/${studentId}`);
    const result = await response.json();
    
    if (!result.success) {
      if (result.message?.includes('not found')) {
        // Create new report
        return await createStudentReport(studentId);
      }
      throw new Error(result.message);
    }

    return mapReport(result.report);
  } catch (error) {
    console.error('Error fetching student report:', error);
    return null;
  }
};

/**
 * Create a new student report
 */
const createStudentReport = async (
  studentId: string
): Promise<StudentReport> => {
  try {
    const response = await fetch('/api/student-reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId }),
    });

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to create report');
    }

    return mapReport(result.report);
  } catch (error) {
    console.error('Error creating student report:', error);
    throw error;
  }
};

/**
 * Update student report feedback fields
 */
export const updateStudentReportFeedback = async (
  studentId: string,
  updates: {
    strengths?: string[];
    areasForImprovement?: string[];
    achievements?: string[];
    recommendations?: string[];
    teacherComments?: string;
    careerServiceComments?: string;
    employerFeedback?: string;
  },
  updatedBy: string
): Promise<void> => {
  try {
    const response = await fetch(`/api/student-reports/${studentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...updates,
        updatedBy,
      }),
    });

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to update report');
    }
  } catch (error) {
    console.error('Error updating student report:', error);
    throw error;
  }
};

/**
 * Update career module completion
 */
export const updateCareerModule = async (
  studentId: string,
  moduleName: string,
  completed: boolean
): Promise<void> => {
  try {
    // First fetch the current report
    const report = await getStudentReport(studentId);
    if (!report) throw new Error('Report not found');
    
    // Update the specific module
    const updatedModules = report.careerModules.modules.map(m =>
      m.name === moduleName
        ? {
            ...m,
            completed,
            points: completed ? 10 : 0,
            completedAt: completed ? new Date().toISOString() : undefined,
          }
        : m
    );
    
    const completedCount = updatedModules.filter(m => m.completed).length;
    
    // Update via API
    const response = await fetch(`/api/student-reports/${studentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        'careerModules.modules': updatedModules,
        'careerModules.completed': completedCount,
      }),
    });

    const result = await response.json();
    if (!result.success) throw new Error(result.message);
  } catch (error) {
    console.error('Error updating career module:', error);
    throw error;
  }
};

/**
 * Add event/workshop attendance
 */
export const addEventAttendance = async (
  studentId: string,
  event: Omit<EventWorkshop, 'attended'>
): Promise<void> => {
  try {
    const report = await getStudentReport(studentId);
    if (!report) throw new Error('Report not found');
    
    const newEvent = { ...event, attended: true };
    const events = [...report.eventsWorkshops.events, newEvent];
    const attended = events.filter(e => e.attended).length;
    const percentage = Math.round((attended / 12) * 100);
    
    const response = await fetch(`/api/student-reports/${studentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        'eventsWorkshops.events': events,
        'eventsWorkshops.attended': attended,
        'eventsWorkshops.percentage': percentage,
      }),
    });

    const result = await response.json();
    if (!result.success) throw new Error(result.message);
  } catch (error) {
    console.error('Error adding event attendance:', error);
    throw error;
  }
};

/**
 * Add internship application
 */
export const addInternshipApplication = async (
  studentId: string,
  application: InternshipApplication
): Promise<void> => {
  try {
    const report = await getStudentReport(studentId);
    if (!report) throw new Error('Report not found');
    
    const applications = [...report.internshipApplications.applications, application];
    const submitted = applications.length;
    const percentage = Math.round((submitted / 24) * 100);
    
    const response = await fetch(`/api/student-reports/${studentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        'internshipApplications.applications': applications,
        'internshipApplications.submitted': submitted,
        'internshipApplications.percentage': percentage,
      }),
    });

    const result = await response.json();
    if (!result.success) throw new Error(result.message);
  } catch (error) {
    console.error('Error adding internship application:', error);
    throw error;
  }
};

/**
 * Add one-on-one session
 */
export const addOneOnOneSession = async (
  studentId: string,
  session: Omit<OneOnOneSession, 'completed'>
): Promise<void> => {
  try {
    const report = await getStudentReport(studentId);
    if (!report) throw new Error('Report not found');
    
    const newSession = { ...session, completed: true };
    const sessions = [...report.oneOnOneSessions.sessions, newSession];
    const attended = sessions.filter(s => s.completed).length;
    const percentage = Math.round((attended / 24) * 100);
    
    const response = await fetch(`/api/student-reports/${studentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        'oneOnOneSessions.sessions': sessions,
        'oneOnOneSessions.attended': attended,
        'oneOnOneSessions.percentage': percentage,
      }),
    });

    const result = await response.json();
    if (!result.success) throw new Error(result.message);
  } catch (error) {
    console.error('Error adding one-on-one session:', error);
    throw error;
  }
};

/**
 * Update CV/Portfolio status
 */
export const updateCVPortfolioStatus = async (
  studentId: string,
  updates: Partial<CVPortfolio>
): Promise<void> => {
  try {
    const updateData: any = {};
    Object.entries(updates).forEach(([key, value]) => {
      updateData[`cvPortfolio.${key}`] = value;
    });
    
    const response = await fetch(`/api/student-reports/${studentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    });

    const result = await response.json();
    if (!result.success) throw new Error(result.message);
  } catch (error) {
    console.error('Error updating CV/Portfolio status:', error);
    throw error;
  }
};

/**
 * Refresh academic performance data
 */
export const refreshAcademicPerformance = async (
  studentId: string
): Promise<void> => {
  try {
    const response = await fetch(`/api/student-reports/${studentId}/refresh`, {
      method: 'POST',
    });

    const result = await response.json();
    if (!result.success) throw new Error(result.message);
  } catch (error) {
    console.error('Error refreshing academic performance:', error);
    // Don't throw - this is non-critical
  }
};

/**
 * Get all reports for a generation
 */
export const getReportsByGen = async (gen: string): Promise<StudentReport[]> => {
  try {
    const response = await fetch(`/api/student-reports?gen=${gen}`);
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch reports');
    }

    return result.reports.map(mapReport);
  } catch (error) {
    console.error('Error fetching reports by generation:', error);
    return [];
  }
};

/**
 * Helper: Map API response to StudentReport
 */
function mapReport(report: any): StudentReport {
  return {
    ...report,
    id: report._id || report.id,
    lastUpdated: new Date(report.lastUpdated).toISOString(),
    careerModules: {
      ...report.careerModules,
      modules: report.careerModules.modules.map((m: any) => ({
        ...m,
        completedAt: m.completedAt ? new Date(m.completedAt).toISOString() : undefined,
      })),
    },
  };
}