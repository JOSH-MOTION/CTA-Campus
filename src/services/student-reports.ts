// src/services/student-reports.ts
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface CareerModule {
  name: string;
  completed: boolean;
  points: number;
  completedAt?: Timestamp;
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
  
  lastUpdated: Timestamp;
  updatedBy?: string;
}

/**
 * Calculate academic performance from existing points data
 */
const calculateAcademicPerformance = async (studentId: string) => {
  const userDoc = await getDoc(doc(db, 'users', studentId));
  const userData = userDoc.data();
  const totalPoints = userData?.totalPoints || 0;
  
  // Get points breakdown from the points subcollection
  const pointsSnapshot = await getDocs(
    collection(db, 'users', studentId, 'points')
  );
  
  const pointsByCategory = {
    attendance: 0,
    assignments: 0,
    exercises: 0,
    weeklyProjects: 0,
    monthlyProjects: 0,
    hundredDays: 0,
    codeReview: 0,
    finalProject: 0,
    softSkills: 0,
    miniDemo: 0,
  };
  
  pointsSnapshot.forEach((pointDoc) => {
    const data = pointDoc.data();
    const reason = data.reason?.toLowerCase() || '';
    
    if (reason.includes('attendance')) pointsByCategory.attendance += data.points;
    else if (reason.includes('assignment')) pointsByCategory.assignments += data.points;
    else if (reason.includes('exercise')) pointsByCategory.exercises += data.points;
    else if (reason.includes('weekly project')) pointsByCategory.weeklyProjects += data.points;
    else if (reason.includes('monthly') || reason.includes('personal project')) pointsByCategory.monthlyProjects += data.points;
    else if (reason.includes('100 days')) pointsByCategory.hundredDays += data.points;
    else if (reason.includes('code review')) pointsByCategory.codeReview += data.points;
    else if (reason.includes('final project')) pointsByCategory.finalProject += data.points;
    else if (reason.includes('soft skill')) pointsByCategory.softSkills += data.points;
    else if (reason.includes('demo')) pointsByCategory.miniDemo += data.points;
  });
  
  // Define totals based on grading system
  const totals = {
    attendance: 50,
    assignments: 50,
    exercises: 50,
    weeklyProjects: 50,
    monthlyProjects: 10,
    hundredDaysOfCode: 50,
    codeReview: 5,
    finalProject: 10,
    softSkills: 6,
    miniDemoDays: 5,
  };
  
  return {
    attendance: {
      current: pointsByCategory.attendance,
      total: totals.attendance,
      percentage: Math.round((pointsByCategory.attendance / totals.attendance) * 100),
    },
    assignments: {
      current: pointsByCategory.assignments,
      total: totals.assignments,
      percentage: Math.round((pointsByCategory.assignments / totals.assignments) * 100),
    },
    exercises: {
      current: pointsByCategory.exercises,
      total: totals.exercises,
      percentage: Math.round((pointsByCategory.exercises / totals.exercises) * 100),
    },
    weeklyProjects: {
      current: pointsByCategory.weeklyProjects,
      total: totals.weeklyProjects,
      percentage: Math.round((pointsByCategory.weeklyProjects / totals.weeklyProjects) * 100),
    },
    monthlyProjects: {
      current: pointsByCategory.monthlyProjects,
      total: totals.monthlyProjects,
      percentage: Math.round((pointsByCategory.monthlyProjects / totals.monthlyProjects) * 100),
    },
    hundredDaysOfCode: {
      current: pointsByCategory.hundredDays,
      total: totals.hundredDaysOfCode,
      percentage: Math.round((pointsByCategory.hundredDays / totals.hundredDaysOfCode) * 100),
    },
    codeReview: {
      current: pointsByCategory.codeReview,
      total: totals.codeReview,
      percentage: Math.round((pointsByCategory.codeReview / totals.codeReview) * 100),
    },
    finalProject: {
      current: pointsByCategory.finalProject,
      total: totals.finalProject,
      percentage: Math.round((pointsByCategory.finalProject / totals.finalProject) * 100),
    },
    softSkills: {
      current: pointsByCategory.softSkills,
      total: totals.softSkills,
      percentage: Math.round((pointsByCategory.softSkills / totals.softSkills) * 100),
    },
    miniDemoDays: {
      current: pointsByCategory.miniDemo,
      total: totals.miniDemoDays,
      percentage: Math.round((pointsByCategory.miniDemo / totals.miniDemoDays) * 100),
    },
    totalPoints,
    maxPoints: 291,
  };
};

/**
 * Get or create a student report
 */
export const getStudentReport = async (studentId: string): Promise<StudentReport | null> => {
  try {
    const reportDoc = await getDoc(doc(db, 'student_reports', studentId));
    
    if (reportDoc.exists()) {
      return { id: reportDoc.id, ...reportDoc.data() } as StudentReport;
    }
    
    // Create a new report if it doesn't exist
    const userDoc = await getDoc(doc(db, 'users', studentId));
    if (!userDoc.exists()) {
      throw new Error('Student not found');
    }
    
    const userData = userDoc.data();
    const academicPerformance = await calculateAcademicPerformance(studentId);
    
    const newReport: Omit<StudentReport, 'id'> = {
      studentId,
      studentName: userData.displayName || 'Unknown',
      gen: userData.gen || 'Unknown',
      email: userData.email || '',
      
      ...academicPerformance,
      
      careerModules: {
        completed: 0,
        total: 10,
        modules: [
          { name: 'Resume Writing', completed: false, points: 0 },
          { name: 'LinkedIn Optimization', completed: false, points: 0 },
          { name: 'Interview Prep', completed: false, points: 0 },
          { name: 'Portfolio Building', completed: false, points: 0 },
          { name: 'Networking Skills', completed: false, points: 0 },
          { name: 'Personal Branding', completed: false, points: 0 },
          { name: 'Job Search Strategies', completed: false, points: 0 },
          { name: 'Salary Negotiation', completed: false, points: 0 },
          { name: 'Professional Communication', completed: false, points: 0 },
          { name: 'Career Planning', completed: false, points: 0 },
        ],
      },
      
      eventsWorkshops: {
        attended: 0,
        required: 12,
        percentage: 0,
        events: [],
      },
      
      internshipApplications: {
        submitted: 0,
        required: 24,
        percentage: 0,
        applications: [],
      },
      
      oneOnOneSessions: {
        attended: 0,
        required: 24,
        percentage: 0,
        sessions: [],
      },
      
      cvPortfolio: {
        cvStatus: 'Not Submitted',
        portfolioStatus: 'Not Submitted',
      },
      
      strengths: [],
      areasForImprovement: [],
      achievements: [],
      recommendations: [],
      teacherComments: '',
      careerServiceComments: '',
      employerFeedback: '',
      
      lastUpdated: serverTimestamp() as Timestamp,
    };
    
    await setDoc(doc(db, 'student_reports', studentId), newReport);
    
    return { id: studentId, ...newReport } as StudentReport;
  } catch (error) {
    console.error('Error fetching student report:', error);
    return null;
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
) => {
  try {
    const reportRef = doc(db, 'student_reports', studentId);
    await updateDoc(reportRef, {
      ...updates,
      lastUpdated: serverTimestamp(),
      updatedBy,
    });
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
) => {
  try {
    const reportDoc = await getDoc(doc(db, 'student_reports', studentId));
    if (!reportDoc.exists()) {
      throw new Error('Report not found');
    }
    
    const report = reportDoc.data() as StudentReport;
    const modules = report.careerModules.modules.map((m) =>
      m.name === moduleName
        ? {
            ...m,
            completed,
            points: completed ? 10 : 0,
            completedAt: completed ? (serverTimestamp() as Timestamp) : undefined,
          }
        : m
    );
    
    const completedCount = modules.filter((m) => m.completed).length;
    
    await updateDoc(doc(db, 'student_reports', studentId), {
      'careerModules.modules': modules,
      'careerModules.completed': completedCount,
      lastUpdated: serverTimestamp(),
    });
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
) => {
  try {
    const reportDoc = await getDoc(doc(db, 'student_reports', studentId));
    if (!reportDoc.exists()) {
      throw new Error('Report not found');
    }
    
    const report = reportDoc.data() as StudentReport;
    const newEvent = { ...event, attended: true };
    const events = [...report.eventsWorkshops.events, newEvent];
    const attended = events.filter((e) => e.attended).length;
    const percentage = Math.round((attended / 12) * 100);
    
    await updateDoc(doc(db, 'student_reports', studentId), {
      'eventsWorkshops.events': events,
      'eventsWorkshops.attended': attended,
      'eventsWorkshops.percentage': percentage,
      lastUpdated: serverTimestamp(),
    });
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
) => {
  try {
    const reportDoc = await getDoc(doc(db, 'student_reports', studentId));
    if (!reportDoc.exists()) {
      throw new Error('Report not found');
    }
    
    const report = reportDoc.data() as StudentReport;
    const applications = [...report.internshipApplications.applications, application];
    const submitted = applications.length;
    const percentage = Math.round((submitted / 24) * 100);
    
    await updateDoc(doc(db, 'student_reports', studentId), {
      'internshipApplications.applications': applications,
      'internshipApplications.submitted': submitted,
      'internshipApplications.percentage': percentage,
      lastUpdated: serverTimestamp(),
    });
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
) => {
  try {
    const reportDoc = await getDoc(doc(db, 'student_reports', studentId));
    if (!reportDoc.exists()) {
      throw new Error('Report not found');
    }
    
    const report = reportDoc.data() as StudentReport;
    const newSession = { ...session, completed: true };
    const sessions = [...report.oneOnOneSessions.sessions, newSession];
    const attended = sessions.filter((s) => s.completed).length;
    const percentage = Math.round((attended / 24) * 100);
    
    await updateDoc(doc(db, 'student_reports', studentId), {
      'oneOnOneSessions.sessions': sessions,
      'oneOnOneSessions.attended': attended,
      'oneOnOneSessions.percentage': percentage,
      lastUpdated: serverTimestamp(),
    });
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
) => {
  try {
    const updateData: any = {};
    Object.entries(updates).forEach(([key, value]) => {
      updateData[`cvPortfolio.${key}`] = value;
    });
    updateData.lastUpdated = serverTimestamp();
    
    await updateDoc(doc(db, 'student_reports', studentId), updateData);
  } catch (error) {
    console.error('Error updating CV/Portfolio status:', error);
    throw error;
  }
};

/**
 * Refresh academic performance data
 */
export const refreshAcademicPerformance = async (studentId: string) => {
  try {
    const academicPerformance = await calculateAcademicPerformance(studentId);
    
    const reportRef = doc(db, 'student_reports', studentId);
    const reportDoc = await getDoc(reportRef);
    
    if (reportDoc.exists()) {
      // Document exists, update it
      await updateDoc(reportRef, {
        ...academicPerformance,
        lastUpdated: serverTimestamp(),
      });
    } else {
      // Document doesn't exist, it will be created by getStudentReport
      console.log('Report document does not exist yet, will be created on first access');
    }
  } catch (error) {
    console.error('Error refreshing academic performance:', error);
    // Don't throw the error, just log it
  }
};

/**
 * Get all reports for a generation
 */
export const getReportsByGen = async (gen: string): Promise<StudentReport[]> => {
  try {
    const reportsQuery = query(
      collection(db, 'student_reports'),
      where('gen', '==', gen)
    );
    
    const snapshot = await getDocs(reportsQuery);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as StudentReport[];
  } catch (error) {
    console.error('Error fetching reports by generation:', error);
    return [];
  }
};