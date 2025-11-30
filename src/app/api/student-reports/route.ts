// src/app/api/student-reports/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import StudentReport from '@/models/StudentReport';
import User from '@/models/User';
import { Point } from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const gen = searchParams.get('gen');
    const studentId = searchParams.get('studentId');
    
    let query: any = {};
    if (gen) query.gen = gen;
    if (studentId) query.studentId = studentId;
    
    const reports = await StudentReport.find(query)
      .sort({ studentName: 1 })
      .lean();
    
    return NextResponse.json({ success: true, reports });
  } catch (error: any) {
    console.error('Error fetching student reports:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { studentId } = await request.json();
    
    if (!studentId) {
      return NextResponse.json(
        { success: false, message: 'studentId is required' },
        { status: 400 }
      );
    }
    
    // Check if report already exists
    const existing = await StudentReport.findOne({ studentId });
    if (existing) {
      return NextResponse.json({ success: true, report: existing });
    }
    
    // Get user data
    const user = await User.findOne({ uid: studentId });
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Calculate academic performance from points
    const points = await Point.find({ userId: studentId });
    const pointsByCategory = calculatePointsByCategory(points);
    
    // Create initial report
    const report = await StudentReport.create({
      studentId,
      studentName: user.displayName,
      gen: user.gen || 'Unknown',
      email: user.email,
      totalPoints: user.totalPoints || 0,
      ...pointsByCategory,
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
    });
    
    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    console.error('Error creating student report:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

function calculatePointsByCategory(points: any[]) {
  const categories = {
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
  
  points.forEach(point => {
    const reason = point.reason?.toLowerCase() || '';
    if (reason.includes('attendance')) categories.attendance += point.points;
    else if (reason.includes('assignment')) categories.assignments += point.points;
    else if (reason.includes('exercise')) categories.exercises += point.points;
    else if (reason.includes('weekly project')) categories.weeklyProjects += point.points;
    else if (reason.includes('monthly') || reason.includes('personal project')) 
      categories.monthlyProjects += point.points;
    else if (reason.includes('100 days')) categories.hundredDays += point.points;
    else if (reason.includes('code review')) categories.codeReview += point.points;
    else if (reason.includes('final project')) categories.finalProject += point.points;
    else if (reason.includes('soft skill')) categories.softSkills += point.points;
    else if (reason.includes('demo')) categories.miniDemo += point.points;
  });
  
  const totals = {
    attendance: 50,
    assignments: 50,
    exercises: 50,
    weeklyProjects: 50,
    monthlyProjects: 10,
    hundredDaysOfCode: 50,
    codeReview: 5,
    finalProject: 10,
    softSkills: 70,
    miniDemoDays: 5,
  };
  
  return {
    attendance: {
      current: categories.attendance,
      total: totals.attendance,
      percentage: Math.round((categories.attendance / totals.attendance) * 100),
    },
    assignments: {
      current: categories.assignments,
      total: totals.assignments,
      percentage: Math.round((categories.assignments / totals.assignments) * 100),
    },
    exercises: {
      current: categories.exercises,
      total: totals.exercises,
      percentage: Math.round((categories.exercises / totals.exercises) * 100),
    },
    weeklyProjects: {
      current: categories.weeklyProjects,
      total: totals.weeklyProjects,
      percentage: Math.round((categories.weeklyProjects / totals.weeklyProjects) * 100),
    },
    monthlyProjects: {
      current: categories.monthlyProjects,
      total: totals.monthlyProjects,
      percentage: Math.round((categories.monthlyProjects / totals.monthlyProjects) * 100),
    },
    hundredDaysOfCode: {
      current: categories.hundredDays,
      total: totals.hundredDaysOfCode,
      percentage: Math.round((categories.hundredDays / totals.hundredDaysOfCode) * 100),
    },
    codeReview: {
      current: categories.codeReview,
      total: totals.codeReview,
      percentage: Math.round((categories.codeReview / totals.codeReview) * 100),
    },
    finalProject: {
      current: categories.finalProject,
      total: totals.finalProject,
      percentage: Math.round((categories.finalProject / totals.finalProject) * 100),
    },
    softSkills: {
      current: categories.softSkills,
      total: totals.softSkills,
      percentage: Math.round((categories.softSkills / totals.softSkills) * 100),
    },
    miniDemoDays: {
      current: categories.miniDemo,
      total: totals.miniDemoDays,
      percentage: Math.round((categories.miniDemo / totals.miniDemoDays) * 100),
    },
  };
}

